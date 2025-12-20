/**
 * AdaptiveEducationalAINetwork - 適応型教育AIネットワーク
 *
 * 複数のAIモジュールを統合し、最適な学習戦略を動的に選択・実行する
 * メタ戦略コントローラー
 */

import {
  AdaptiveNetworkState,
  NetworkConfig,
  DEFAULT_NETWORK_CONFIG,
  StrategyRecommendation,
  QuestionContext,
  StrategyType,
} from './types';
import { SignalDetector } from './SignalDetector';
import { StrategyExecutor } from './StrategyExecutor';
import { EffectivenessTracker } from './EffectivenessTracker';
import {
  calculateTimeBasedPriority as _calculateTimeBasedPriority,
  getTimeBasedStats as _getTimeBasedStats,
} from '@/ai/nodes/TimeBasedPriorityAI';
import type { WordProgress as _WordProgress } from '@/storage/progress/types';

interface Logger {
  debug(message: string, context?: any): void;
  info(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  error(message: string, context?: any): void;
}

const logger: Logger = {
  debug: (message, context) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[AdaptiveNetwork] ${message}`, context);
    }
  },
  info: (message, context) => console.info(`[AdaptiveNetwork] ${message}`, context),
  warn: (message, context) => console.warn(`[AdaptiveNetwork] ${message}`, context),
  error: (message, context) => console.error(`[AdaptiveNetwork] ${message}`, context),
};

const STORAGE_KEY = 'adaptive_network_state';
const CONFIG_KEY = 'adaptive_network_config';

/**
 * Adaptive Educational AI Network
 *
 * メインコントローラークラス
 */
export class AdaptiveEducationalAINetwork {
  private signalDetector: SignalDetector;
  private strategyExecutor: StrategyExecutor;
  private effectivenessTracker: EffectivenessTracker;
  private state: AdaptiveNetworkState;
  private config: NetworkConfig;
  private saveTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<NetworkConfig>) {
    // 設定をマージ
    this.config = { ...DEFAULT_NETWORK_CONFIG, ...config };

    // 状態を初期化
    this.state = this.createInitialState();

    // コンポーネントを初期化
    this.signalDetector = new SignalDetector(this.config);
    this.strategyExecutor = new StrategyExecutor(this.config);
    this.effectivenessTracker = new EffectivenessTracker(this.config);

    // LocalStorageから状態を復元
    this.loadState();

    logger.info('AdaptiveEducationalAINetwork created', {
      enabled: this.config.enabled,
    });
  }

  /**
   * ネットワークの初期化
   */
  async initialize(): Promise<void> {
    logger.info('Initializing AdaptiveEducationalAINetwork...');

    try {
      // 各コンポーネントを初期化
      await Promise.all([
        this.signalDetector.initialize(),
        this.strategyExecutor.initialize(),
        this.effectivenessTracker.initialize(),
      ]);

      // 状態を検証・修復
      this.validateAndRepairState();

      logger.info('AdaptiveEducationalAINetwork initialized successfully');
    } catch (error) {
      logger.error('Initialization failed', error);

      // 部分的な初期化を試みる
      try {
        this.initializeWithDefaults();
        logger.info('Initialized with default configuration');
      } catch {
        throw new Error(
          `Failed to initialize Adaptive Network: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  /**
   * 質問の結果を処理し、次の戦略を決定
   *
   * @param word 学習中の単語
   * @param result 回答結果
   * @param context 質問コンテキスト
   * @returns 推奨戦略
   */
  async processQuestion(
    word: string,
    result: 'correct' | 'incorrect',
    context: QuestionContext
  ): Promise<StrategyRecommendation> {
    // 入力検証
    try {
      this.validateInput(word, result, context);
    } catch (error) {
      logger.error('Invalid input', { word, result, context, error });
      return this.getDefaultRecommendation();
    }

    // ネットワーク無効時
    if (!this.state.enabled) {
      return this.getDefaultRecommendation();
    }

    try {
      // 1. シグナル検出
      const signals = await this.signalDetector.detectSignals(word, result, context);

      logger.debug('Signals detected', {
        word,
        result,
        signalCount: signals.length,
      });

      // 2. 戦略選択
      const recommendation = this.strategyExecutor.selectBestStrategy(
        signals,
        this.state.effectiveness
      );

      logger.info('Strategy selected', {
        word,
        result,
        strategy: recommendation.strategy,
        confidence: recommendation.confidence,
      });

      // 3. 戦略実行（バックグラウンドで）
      this.executeStrategyAsync(recommendation.strategy, word, context);

      // 4. 状態更新
      this.updateState(recommendation, signals);

      // 5. セッション統計更新
      this.updateSessionStats(result);

      // 6. 保存（デバウンス）
      this.debounceSave();

      return recommendation;
    } catch (error) {
      logger.error('Question processing failed', { word, result, context, error });

      // フォールバック
      return {
        strategy: StrategyType.CONTINUE_NORMAL,
        confidence: 0,
        reason: 'AI処理が一時的に利用できないため、通常学習を続けます',
        signals: [],
        metadata: {
          error: true,
          fallback: true,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * 現在の状態を取得（読み取り専用）
   *
   * @returns ネットワーク状態
   */
  getState(): Readonly<AdaptiveNetworkState> {
    return { ...this.state };
  }

  /**
   * 設定を動的に更新
   *
   * @param config 更新する設定項目
   */
  updateConfig(config: Partial<NetworkConfig>): void {
    this.config = { ...this.config, ...config };

    // enabled状態を反映
    if (config.enabled !== undefined) {
      this.state.enabled = config.enabled;
    }

    // 設定を保存
    this.saveConfig();

    logger.info('Configuration updated', config);
  }

  /**
   * 状態をリセット
   */
  resetState(): void {
    logger.info('Resetting network state');

    this.state = this.createInitialState();
    this.effectivenessTracker.reset();

    // LocalStorageから削除
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      logger.warn('Failed to remove state from storage', error);
    }

    logger.info('Network state reset complete');
  }

  /**
   * 状態をJSON文字列としてエクスポート
   *
   * @returns JSON文字列
   */
  exportState(): string {
    const exportData = {
      version: '1.0.0',
      state: this.state,
      config: this.config,
      effectiveness: Array.from(this.state.effectiveness.entries()),
      exportedAt: Date.now(),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * JSON文字列から状態をインポート
   *
   * @param stateJson エクスポートされたJSON文字列
   */
  importState(stateJson: string): void {
    try {
      const data = JSON.parse(stateJson);

      // バージョンチェック
      if (data.version !== '1.0.0') {
        logger.warn('Version mismatch, attempting migration', {
          expected: '1.0.0',
          actual: data.version,
        });
      }

      // 状態を復元
      if (data.state) {
        this.state = {
          ...data.state,
          effectiveness: new Map(data.effectiveness || []),
        };
      }

      // 設定を復元
      if (data.config) {
        this.config = data.config;
      }

      this.saveState();
      this.saveConfig();

      logger.info('State imported successfully');
    } catch (error) {
      logger.error('Failed to import state', error);
      throw new Error(
        `Invalid state data: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // ================== プライベートメソッド ==================

  /**
   * 初期状態を作成
   */
  private createInitialState(): AdaptiveNetworkState {
    return {
      enabled: this.config.enabled,
      currentStrategy: null,
      activeSignals: [],
      effectiveness: new Map(),
      sessionStats: {
        questionsAnswered: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        sessionStartTime: Date.now(),
        totalSessionTime: 0,
      },
      lastUpdated: Date.now(),
    };
  }

  /**
   * デフォルト値で初期化
   */
  private initializeWithDefaults(): void {
    this.state = this.createInitialState();
    logger.info('Initialized with defaults');
  }

  /**
   * 入力を検証
   */
  private validateInput(
    word: string,
    result: 'correct' | 'incorrect',
    context: QuestionContext
  ): void {
    if (!word || typeof word !== 'string') {
      throw new Error('Invalid word parameter');
    }

    if (result !== 'correct' && result !== 'incorrect') {
      throw new Error('Result must be "correct" or "incorrect"');
    }

    if (!context || typeof context !== 'object') {
      throw new Error('Invalid context parameter');
    }
  }

  /**
   * デフォルト推奨を取得
   */
  private getDefaultRecommendation(): StrategyRecommendation {
    return {
      strategy: StrategyType.CONTINUE_NORMAL,
      confidence: 0.5,
      reason: '通常の学習を続けます',
      signals: [],
      metadata: {
        default: true,
      },
    };
  }

  /**
   * 戦略を非同期で実行
   */
  private async executeStrategyAsync(
    strategy: any,
    word: string,
    context: QuestionContext
  ): Promise<void> {
    try {
      const result = await this.strategyExecutor.executeStrategy(strategy, word, context);

      if (!result.success) {
        logger.warn('Strategy execution failed', {
          strategy,
          error: result.error,
        });
      } else {
        logger.debug('Strategy executed', {
          strategy,
          actionCount: result.actions.length,
          duration: result.duration,
        });
      }
    } catch (error) {
      logger.error('Strategy execution error', { strategy, error });
    }
  }

  /**
   * 状態を更新
   */
  private updateState(recommendation: StrategyRecommendation, signals: any[]): void {
    this.state.currentStrategy = recommendation.strategy;
    this.state.activeSignals = signals;
    this.state.lastUpdated = Date.now();
  }

  /**
   * セッション統計を更新
   */
  private updateSessionStats(result: 'correct' | 'incorrect'): void {
    this.state.sessionStats.questionsAnswered++;

    if (result === 'correct') {
      this.state.sessionStats.correctAnswers++;
    } else {
      this.state.sessionStats.incorrectAnswers++;
    }

    this.state.sessionStats.totalSessionTime =
      Date.now() - this.state.sessionStats.sessionStartTime;
  }

  /**
   * 状態を検証・修復
   */
  private validateAndRepairState(): void {
    // enabled検証
    if (typeof this.state.enabled !== 'boolean') {
      logger.warn('Invalid enabled state, repairing');
      this.state.enabled = false;
    }

    // activeSignals検証
    if (!Array.isArray(this.state.activeSignals)) {
      logger.warn('Invalid activeSignals, repairing');
      this.state.activeSignals = [];
    }

    // effectiveness検証
    if (!(this.state.effectiveness instanceof Map)) {
      logger.warn('Invalid effectiveness map, repairing');
      this.state.effectiveness = new Map();
    }

    // sessionStats検証
    if (!this.state.sessionStats || typeof this.state.sessionStats !== 'object') {
      logger.warn('Invalid sessionStats, repairing');
      this.state.sessionStats = {
        questionsAnswered: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        sessionStartTime: Date.now(),
        totalSessionTime: 0,
      };
    }
  }

  /**
   * LocalStorageから状態をロード
   */
  private loadState(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        logger.info('No stored state found');
        return;
      }

      const data = JSON.parse(stored);

      // effectiveness Mapを復元
      if (data.effectiveness && Array.isArray(data.effectiveness)) {
        data.effectiveness = new Map(data.effectiveness);
      }

      this.state = { ...this.state, ...data };

      logger.info('State loaded from storage');
    } catch (error) {
      logger.error('Failed to load state', error);
    }
  }

  /**
   * LocalStorageに状態を保存
   */
  private saveState(): void {
    try {
      const saveData = {
        ...this.state,
        effectiveness: Array.from(this.state.effectiveness.entries()),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));

      logger.debug('State saved to storage');
    } catch (error) {
      logger.warn('Failed to save state', error);
    }
  }

  /**
   * 設定を保存
   */
  private saveConfig(): void {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
    } catch (error) {
      logger.warn('Failed to save config', error);
    }
  }

  /**
   * デバウンスして保存
   */
  private debounceSave(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    this.saveTimer = setTimeout(() => {
      this.saveState();
      this.saveTimer = null;
    }, 500);
  }
}
