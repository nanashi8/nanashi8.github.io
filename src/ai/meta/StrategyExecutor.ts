/**
 * StrategyExecutor - 戦略実行器
 *
 * シグナルから最適な学習戦略を選択し、実行する
 */

import {
  StrategyType,
  LearningSignal,
  StrategyRecommendation,
  StrategyEffectiveness,
  NetworkConfig,
  QuestionContext,
  StrategyExecutionResult,
  ExecutedAction,
} from './types';

interface Logger {
  debug(message: string, context?: any): void;
  info(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  error(message: string, context?: any): void;
}

const logger: Logger = {
  debug: (message, context) => {
    if (import.meta.env.DEV) {
      console.debug(`[StrategyExecutor] ${message}`, context);
    }
  },
  info: (message, context) => console.info(`[StrategyExecutor] ${message}`, context),
  warn: (message, context) => console.warn(`[StrategyExecutor] ${message}`, context),
  error: (message, context) => console.error(`[StrategyExecutor] ${message}`, context),
};

interface StrategyRecord {
  strategy: StrategyType;
  timestamp: number;
}

/**
 * StrategyExecutor
 *
 * シグナルに基づいて最適な戦略を選択し、実行する
 */
export class StrategyExecutor {
  private config: NetworkConfig;
  private strategyHistory: StrategyRecord[] = [];
  private readonly MAX_HISTORY = 20;

  constructor(config: NetworkConfig) {
    this.config = config;
  }

  /**
   * 初期化
   */
  async initialize(): Promise<void> {
    logger.info('StrategyExecutor initializing...');
    this.loadHistory();
    logger.info('StrategyExecutor initialized');
  }

  /**
   * 最適な戦略を選択
   *
   * @param signals 検出されたシグナル
   * @param effectiveness 戦略効果測定データ
   * @returns 推奨戦略
   */
  selectBestStrategy(
    signals: LearningSignal[],
    effectiveness: Map<StrategyType, StrategyEffectiveness>
  ): StrategyRecommendation {
    try {
      // 入力検証
      if (!Array.isArray(signals)) {
        throw new Error('Signals must be an array');
      }

      // シグナルなし
      if (signals.length === 0) {
        logger.info('No signals provided, using default strategy');
        return this.getDefaultRecommendation();
      }

      // 信頼度フィルタリング
      const minConfidence = this.config.minConfidence ?? 0.5;
      const validSignals = signals.filter((s) => s.confidence >= minConfidence);

      if (validSignals.length === 0) {
        logger.warn('No signals meet confidence threshold', {
          totalSignals: signals.length,
          minConfidence: this.config.minConfidence,
        });
        return this.getDefaultRecommendation();
      }

      // 優先度10のシグナルは強制選択
      const criticalSignal = validSignals.find((s) => s.priority === 10);
      if (criticalSignal) {
        logger.info('Critical priority signal detected', {
          type: criticalSignal.type,
        });
        return this.createRecommendation(criticalSignal, validSignals, 'critical_priority');
      }

      // スコア計算
      const scores = validSignals.map((signal) => ({
        signal,
        score: this.calculateScore(signal, effectiveness),
      }));

      // 多様性ペナルティ適用
      scores.forEach((item) => {
        const diversityPenalty = this.calculateDiversityPenalty(item.signal.type);
        item.score -= diversityPenalty;
      });

      // 最高スコアを選択
      scores.sort((a, b) => b.score - a.score);
      const best = scores[0];

      logger.debug('Strategy selected', {
        strategy: best.signal.type,
        score: best.score,
        totalSignals: validSignals.length,
      });

      return this.createRecommendation(best.signal, validSignals, 'score_based', best.score);
    } catch (error) {
      logger.error('Strategy selection failed', { signals, error });
      return this.getFallbackRecommendation(error as Error);
    }
  }

  /**
   * 戦略を実行
   *
   * @param strategy 実行する戦略
   * @param word 対象単語
   * @param context 実行コンテキスト
   * @returns 実行結果
   */
  async executeStrategy(
    strategy: StrategyType,
    word: string,
    context: QuestionContext
  ): Promise<StrategyExecutionResult> {
    const startTime = Date.now();

    try {
      // 戦略タイプ検証
      if (!Object.values(StrategyType).includes(strategy)) {
        throw new Error(`Invalid strategy type: ${strategy}`);
      }

      const actions: ExecutedAction[] = [];

      // 戦略別実行
      switch (strategy) {
        case StrategyType.IMMEDIATE_REPETITION:
          actions.push(await this.executeImmediateRepetition(word));
          break;

        case StrategyType.TAKE_BREAK:
          actions.push(...(await this.executeTakeBreak(context)));
          break;

        case StrategyType.USE_CONFUSION_PAIRS:
          actions.push(await this.executeConfusionPairs(word));
          break;

        case StrategyType.REDUCE_DIFFICULTY:
          actions.push(await this.executeReduceDifficulty(word));
          break;

        case StrategyType.SPACED_REPETITION:
          actions.push(await this.executeSpacedRepetition(word));
          break;

        case StrategyType.CONTEXTUAL_LEARNING:
          actions.push(await this.executeContextualLearning(word));
          break;

        case StrategyType.GROUP_BY_THEME:
          actions.push(await this.executeGroupByTheme(word));
          break;

        case StrategyType.ADJUST_SESSION_LENGTH:
          actions.push(await this.executeAdjustSessionLength(context));
          break;

        case StrategyType.USE_ETYMOLOGY:
          actions.push(await this.executeUseEtymology(word));
          break;

        case StrategyType.TIME_OF_DAY_OPTIMIZATION:
          actions.push(await this.executeTimeOfDayOptimization());
          break;

        case StrategyType.INCREASE_EXPOSURE:
          actions.push(await this.executeIncreaseExposure(word));
          break;

        case StrategyType.CONTINUE_NORMAL:
          // 何もしない（通常学習）
          break;

        default:
          logger.warn(`No execution logic for strategy: ${strategy}`);
      }

      // 履歴に記録
      this.recordUsage(strategy);

      return {
        success: true,
        strategy,
        actions,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      logger.error('Strategy execution failed', { strategy, word, error });

      return {
        success: false,
        strategy,
        actions: [],
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ================== 戦略実行メソッド ==================

  /**
   * IMMEDIATE_REPETITION: キューの最前線に追加
   */
  private async executeImmediateRepetition(word: string): Promise<ExecutedAction> {
    logger.debug('Executing IMMEDIATE_REPETITION', { word });

    // 実際の実装では、キュー管理システムに追加
    return {
      type: 'QUEUE_FRONT',
      timestamp: Date.now(),
      metadata: {
        word,
        position: 0,
        queueType: 'immediate',
      },
    };
  }

  /**
   * TAKE_BREAK: 休憩を促す
   */
  private async executeTakeBreak(context: QuestionContext): Promise<ExecutedAction[]> {
    logger.debug('Executing TAKE_BREAK', { context });

    const breakDuration = this.calculateBreakDuration(context);

    return [
      {
        type: 'PAUSE_SESSION',
        timestamp: Date.now(),
        metadata: {
          duration: breakDuration,
          reason: 'cognitive_load',
        },
      },
      {
        type: 'SHOW_BREAK_NOTIFICATION',
        timestamp: Date.now(),
        metadata: {
          message: `${breakDuration / 60000}分間の休憩をおすすめします`,
        },
      },
    ];
  }

  /**
   * USE_CONFUSION_PAIRS: 混同ペアを読み込む
   */
  private async executeConfusionPairs(word: string): Promise<ExecutedAction> {
    logger.debug('Executing USE_CONFUSION_PAIRS', { word });

    const confusionPairs = this.getConfusionPairs(word);

    return {
      type: 'LOAD_CONFUSION_PAIRS',
      timestamp: Date.now(),
      metadata: {
        word,
        pairs: confusionPairs,
      },
    };
  }

  /**
   * REDUCE_DIFFICULTY: 難易度を下げる
   */
  private async executeReduceDifficulty(word: string): Promise<ExecutedAction> {
    logger.debug('Executing REDUCE_DIFFICULTY', { word });

    return {
      type: 'ADJUST_DIFFICULTY',
      timestamp: Date.now(),
      metadata: {
        word,
        direction: 'decrease',
        amount: 1,
      },
    };
  }

  /**
   * SPACED_REPETITION: 間隔を空けて復習
   */
  private async executeSpacedRepetition(word: string): Promise<ExecutedAction> {
    logger.debug('Executing SPACED_REPETITION', { word });

    return {
      type: 'SCHEDULE_SPACED_REVIEW',
      timestamp: Date.now(),
      metadata: {
        word,
        nextReviewTime: Date.now() + 24 * 60 * 60 * 1000, // 24時間後
      },
    };
  }

  /**
   * CONTEXTUAL_LEARNING: 文脈例文を表示
   */
  private async executeContextualLearning(word: string): Promise<ExecutedAction> {
    logger.debug('Executing CONTEXTUAL_LEARNING', { word });

    return {
      type: 'SHOW_CONTEXT_EXAMPLES',
      timestamp: Date.now(),
      metadata: {
        word,
        exampleCount: 3,
      },
    };
  }

  /**
   * GROUP_BY_THEME: テーマ別にグループ化
   */
  private async executeGroupByTheme(word: string): Promise<ExecutedAction> {
    logger.debug('Executing GROUP_BY_THEME', { word });

    const theme = this.getThemeCategory(word);

    return {
      type: 'GROUP_WORDS_BY_THEME',
      timestamp: Date.now(),
      metadata: {
        word,
        theme,
      },
    };
  }

  /**
   * ADJUST_SESSION_LENGTH: セッション長を調整
   */
  private async executeAdjustSessionLength(context: QuestionContext): Promise<ExecutedAction> {
    logger.debug('Executing ADJUST_SESSION_LENGTH', { context });

    const optimalLength = 25 * 60 * 1000; // 25分

    return {
      type: 'ADJUST_SESSION_LENGTH',
      timestamp: Date.now(),
      metadata: {
        currentLength: context.sessionDuration,
        recommendedLength: optimalLength,
      },
    };
  }

  /**
   * USE_ETYMOLOGY: 語源情報を表示
   */
  private async executeUseEtymology(word: string): Promise<ExecutedAction> {
    logger.debug('Executing USE_ETYMOLOGY', { word });

    return {
      type: 'SHOW_ETYMOLOGY',
      timestamp: Date.now(),
      metadata: {
        word,
      },
    };
  }

  /**
   * TIME_OF_DAY_OPTIMIZATION: 時間帯最適化の提案
   */
  private async executeTimeOfDayOptimization(): Promise<ExecutedAction> {
    logger.debug('Executing TIME_OF_DAY_OPTIMIZATION');

    const optimalHour = 10; // 朝10時

    return {
      type: 'SUGGEST_OPTIMAL_TIME',
      timestamp: Date.now(),
      metadata: {
        optimalHour,
        message: `学習効果が最も高い時間帯は${optimalHour}時頃です`,
      },
    };
  }

  /**
   * INCREASE_EXPOSURE: 露出回数を増やす
   */
  private async executeIncreaseExposure(word: string): Promise<ExecutedAction> {
    logger.debug('Executing INCREASE_EXPOSURE', { word });

    return {
      type: 'INCREASE_EXPOSURE_FREQUENCY',
      timestamp: Date.now(),
      metadata: {
        word,
        multiplier: 1.5,
      },
    };
  }

  // ================== ヘルパーメソッド ==================

  /**
   * スコアを計算
   */
  private calculateScore(
    signal: LearningSignal,
    effectiveness: Map<StrategyType, StrategyEffectiveness>
  ): number {
    // ベーススコア: 強度 × 優先度
    const baseScore = signal.strength * signal.priority;

    // 信頼度ボーナス
    const confidenceBonus = signal.confidence * 2;

    // 効果測定ボーナス
    let effectivenessBonus = 0;
    const strategyEffectiveness = effectiveness.get(signal.type);
    if (strategyEffectiveness) {
      effectivenessBonus = strategyEffectiveness.successRate * 3;

      // 最近使用ペナルティ（減衰）
      const timeSinceLastUse = Date.now() - strategyEffectiveness.lastUsed;
      const recencyPenalty = Math.max(0, 2 - timeSinceLastUse / 1000000);
      effectivenessBonus -= recencyPenalty;
    }

    return baseScore + confidenceBonus + effectivenessBonus;
  }

  /**
   * 多様性ペナルティを計算
   */
  private calculateDiversityPenalty(strategy: StrategyType): number {
    const recentUsage = this.strategyHistory
      .slice(-5)
      .filter((record) => record.strategy === strategy).length;

    return recentUsage * 0.5; // 最近使用した回数に応じてペナルティ
  }

  /**
   * 推奨を作成
   */
  private createRecommendation(
    signal: LearningSignal,
    allSignals: LearningSignal[],
    selectionMethod: string,
    score?: number
  ): StrategyRecommendation {
    return {
      strategy: signal.type,
      confidence: signal.confidence,
      reason: this.generateReason(signal),
      signals: allSignals,
      metadata: {
        selectionMethod,
        score,
        signalSource: signal.source,
      },
    };
  }

  /**
   * 理由を生成
   */
  private generateReason(signal: LearningSignal): string {
    const reasons: Record<StrategyType, string> = {
      [StrategyType.IMMEDIATE_REPETITION]: '連続エラーが検出されたため、即座に復習します',
      [StrategyType.TAKE_BREAK]: '認知負荷が高いため、休憩をおすすめします',
      [StrategyType.USE_CONFUSION_PAIRS]: '混同しやすい単語が検出されました',
      [StrategyType.REDUCE_DIFFICULTY]: '認知負荷が高いため、難易度を下げます',
      [StrategyType.SPACED_REPETITION]: '習得が進んでいるため、間隔を空けて復習します',
      [StrategyType.CONTEXTUAL_LEARNING]: '文脈例文で理解を深めます',
      [StrategyType.GROUP_BY_THEME]: '関連語彙とセットで学習します',
      [StrategyType.ADJUST_SESSION_LENGTH]: 'セッション長を最適化します',
      [StrategyType.USE_ETYMOLOGY]: '語源情報で記憶を強化します',
      [StrategyType.TIME_OF_DAY_OPTIMIZATION]: '最適な学習時間帯を提案します',
      [StrategyType.INCREASE_EXPOSURE]: '露出回数を増やして定着を促進します',
      [StrategyType.CONTINUE_NORMAL]: '通常の学習を続けます',
    };

    return reasons[signal.type] || '最適な学習戦略を適用します';
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
        fallback: false,
        default: true,
      },
    };
  }

  /**
   * フォールバック推奨を取得
   */
  private getFallbackRecommendation(error?: Error): StrategyRecommendation {
    return {
      strategy: StrategyType.CONTINUE_NORMAL,
      confidence: 0,
      reason: 'AI処理が一時的に利用できないため、通常学習を続けます',
      signals: [],
      metadata: {
        fallback: true,
        error: true,
        errorMessage: error?.message,
      },
    };
  }

  /**
   * 使用履歴を記録
   */
  recordUsage(strategy: StrategyType): void {
    this.strategyHistory.push({
      strategy,
      timestamp: Date.now(),
    });

    // 履歴数を制限
    if (this.strategyHistory.length > this.MAX_HISTORY) {
      this.strategyHistory.shift();
    }

    this.saveHistory();
  }

  /**
   * 履歴を保存
   */
  private saveHistory(): void {
    try {
      localStorage.setItem('adaptive_strategy_history', JSON.stringify(this.strategyHistory));
    } catch (error) {
      logger.warn('Failed to save strategy history', error);
    }
  }

  /**
   * 履歴を読み込み
   */
  private loadHistory(): void {
    try {
      const stored = localStorage.getItem('adaptive_strategy_history');
      if (stored) {
        this.strategyHistory = JSON.parse(stored);
      }
    } catch (error) {
      logger.warn('Failed to load strategy history', error);
    }
  }

  /**
   * 休憩時間を計算
   */
  private calculateBreakDuration(context: QuestionContext): number {
    const cognitiveLoad = context.cognitiveLoad ?? 0.5;

    if (cognitiveLoad >= 0.9) return 10 * 60 * 1000; // 10分
    if (cognitiveLoad >= 0.8) return 5 * 60 * 1000; // 5分
    return 3 * 60 * 1000; // 3分
  }

  /**
   * 混同ペアを取得
   */
  private getConfusionPairs(word: string): string[] {
    const confusionMap: Record<string, string[]> = {
      affect: ['effect'],
      effect: ['affect'],
      accept: ['except'],
      except: ['accept'],
    };
    return confusionMap[word] || [];
  }

  /**
   * テーマカテゴリを取得
   */
  private getThemeCategory(word: string): string | null {
    const themeMap: Record<string, string> = {
      apple: 'fruits',
      banana: 'fruits',
      dog: 'animals',
      cat: 'animals',
    };
    return themeMap[word] || null;
  }
}
