/**
 * SignalDetector - シグナル検出器
 *
 * 既存の6つのAIモジュールからシグナルを検出し、統合する役割を担う
 */

import {
  SignalSource,
  StrategyType,
  LearningSignal,
  NetworkConfig,
  QuestionContext,
} from './types';
import type { AcquisitionProgress } from '../../strategies/memoryAcquisitionAlgorithm';

interface Logger {
  debug(message: string, context?: any): void;
  info(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  error(message: string, context?: any): void;
}

// シンプルなロガー実装
const logger: Logger = {
  debug: (message, context) => {
    if (import.meta.env.DEV) {
      console.debug(`[SignalDetector] ${message}`, context);
    }
  },
  info: (message, context) => console.info(`[SignalDetector] ${message}`, context),
  warn: (message, context) => console.warn(`[SignalDetector] ${message}`, context),
  error: (message, context) => console.error(`[SignalDetector] ${message}`, context),
};

/**
 * SignalDetector
 *
 * 各AIモジュールから学習シグナルを検出し、統合する
 */
export class SignalDetector {
  private config: NetworkConfig;
  private signalCache: Map<string, LearningSignal[]> = new Map();
  private cacheTimeout = 5000; // 5秒

  constructor(config: NetworkConfig) {
    this.config = config;
  }

  /**
   * 初期化（非同期データロードなど）
   */
  async initialize(): Promise<void> {
    logger.info('SignalDetector initializing...');
    // 現時点では特に初期化処理なし
    logger.info('SignalDetector initialized');
  }

  /**
   * すべてのAIモジュールからシグナルを検出
   *
   * @param word 学習中の単語
   * @param result 回答結果
   * @param context 質問コンテキスト
   * @returns 検出されたシグナルの配列
   */
  async detectSignals(
    word: string,
    result: 'correct' | 'incorrect',
    context: QuestionContext
  ): Promise<LearningSignal[]> {
    const startTime = Date.now();
    const signals: LearningSignal[] = [];
    const errors: Array<{ module: string; error: Error }> = [];

    // キャッシュチェック
    const cacheKey = `${word}-${result}-${context.attemptNumber}`;
    const cached = this.getCachedSignals(cacheKey);
    if (cached) {
      logger.debug('Using cached signals', { word, cacheKey });
      return cached;
    }

    // 並列でシグナル検出（Promise.allSettled使用）
    const detectionPromises = [
      this.detectMemoryAcquisitionSignals(word, result, context),
      this.detectCognitiveLoadSignals(context),
      this.detectErrorPredictionSignals(word, result),
      this.detectLearningStyleSignals(context),
      this.detectLinguisticRelationsSignals(word),
      this.detectContextualLearningSignals(word, result),
    ];

    const results = await Promise.allSettled(detectionPromises);

    // 結果を集約
    results.forEach((result, index) => {
      const moduleName = this.getModuleName(index);
      if (result.status === 'fulfilled') {
        signals.push(...result.value);
        logger.debug(`${moduleName} signals detected`, { count: result.value.length });
      } else {
        errors.push({ module: moduleName, error: result.reason });
        logger.warn(`${moduleName} failed`, result.reason);
      }
    });

    // すべて失敗した場合
    if (signals.length === 0 && errors.length > 0) {
      logger.error('All AI modules failed', { errors });
      return [];
    }

    // 部分的な失敗を記録
    if (errors.length > 0 && signals.length > 0) {
      logger.warn('Some AI modules failed', {
        failed: errors.length,
        succeeded: signals.length,
      });
    }

    // フィルタリングとソート
    const filteredSignals = this.filterAndSortSignals(signals);

    // キャッシュに保存
    this.cacheSignals(cacheKey, filteredSignals);

    const duration = Date.now() - startTime;
    logger.debug('Signal detection completed', { duration, signalCount: filteredSignals.length });

    return filteredSignals;
  }

  /**
   * Memory Acquisition AIからシグナルを検出
   */
  private async detectMemoryAcquisitionSignals(
    word: string,
    result: 'correct' | 'incorrect',
    _context: QuestionContext
  ): Promise<LearningSignal[]> {
    const signals: LearningSignal[] = [];

    try {
      // LocalStorageから習得進捗を取得（実際の実装ではストアから取得）
      const progress = this.getAcquisitionProgress(word);

      if (!progress) {
        return signals;
      }

      // シグナル1: IMMEDIATE_REPETITION（連続エラー時）
      if (result === 'incorrect' && this.shouldImmediateRepeat(progress)) {
        signals.push({
          source: SignalSource.MEMORY_ACQUISITION,
          type: StrategyType.IMMEDIATE_REPETITION,
          strength: this.calculateImmediateRepeatStrength(progress),
          confidence: 0.9,
          priority: 9,
          timestamp: Date.now(),
          metadata: {
            currentExposure: progress.totalAttempts,
            targetExposure: progress.dynamicThreshold,
            consecutiveErrors: this.getConsecutiveErrors(progress),
            acquisitionProgress: this.calculateAcquisitionProgress(progress),
          },
        });
      }

      // シグナル2: SPACED_REPETITION（習得進捗が一定以上）
      if (result === 'correct' && progress.correctRate >= 0.5) {
        signals.push({
          source: SignalSource.MEMORY_ACQUISITION,
          type: StrategyType.SPACED_REPETITION,
          strength: Math.min(progress.correctRate, 0.8),
          confidence: 0.85,
          priority: 7,
          timestamp: Date.now(),
          metadata: {
            correctRate: progress.correctRate,
            consecutiveCorrect: progress.consecutiveCorrectStreak,
          },
        });
      }

      // シグナル3: INCREASE_EXPOSURE（露出回数不足）
      if (result === 'incorrect' && progress.totalAttempts < progress.dynamicThreshold) {
        signals.push({
          source: SignalSource.MEMORY_ACQUISITION,
          type: StrategyType.INCREASE_EXPOSURE,
          strength: 1 - progress.totalAttempts / progress.dynamicThreshold,
          confidence: 0.8,
          priority: 8,
          timestamp: Date.now(),
          metadata: {
            currentAttempts: progress.totalAttempts,
            targetAttempts: progress.dynamicThreshold,
          },
        });
      }
    } catch (error) {
      logger.error('Memory Acquisition signal detection failed', error);
    }

    return signals;
  }

  /**
   * Cognitive Load AIからシグナルを検出
   */
  private async detectCognitiveLoadSignals(context: QuestionContext): Promise<LearningSignal[]> {
    const signals: LearningSignal[] = [];

    try {
      const cognitiveLoad = context.cognitiveLoad ?? this.estimateCognitiveLoad(context);

      // シグナル1: TAKE_BREAK（高認知負荷）
      if (cognitiveLoad > 0.8) {
        signals.push({
          source: SignalSource.COGNITIVE_LOAD,
          type: StrategyType.TAKE_BREAK,
          strength: Math.min(cognitiveLoad, 1.0),
          confidence: 0.95,
          priority: 10, // 最高優先度
          timestamp: Date.now(),
          metadata: {
            cognitiveLoad,
            sessionDuration: context.sessionDuration,
            recommendedBreakDuration: this.calculateBreakDuration(cognitiveLoad),
            fatigueLevel: this.getFatigueLevel(cognitiveLoad),
          },
        });
      }

      // シグナル2: REDUCE_DIFFICULTY（認知負荷高 + 連続エラー）
      if (cognitiveLoad > 0.6 && context.recentErrors >= 2) {
        signals.push({
          source: SignalSource.COGNITIVE_LOAD,
          type: StrategyType.REDUCE_DIFFICULTY,
          strength: (cognitiveLoad + context.recentErrors / 5) / 2,
          confidence: 0.8,
          priority: 8,
          timestamp: Date.now(),
          metadata: {
            cognitiveLoad,
            recentErrors: context.recentErrors,
          },
        });
      }

      // シグナル3: ADJUST_SESSION_LENGTH（長時間学習）
      const sessionMinutes = context.sessionDuration ? context.sessionDuration / 60000 : 0;
      if (sessionMinutes > 30) {
        signals.push({
          source: SignalSource.COGNITIVE_LOAD,
          type: StrategyType.ADJUST_SESSION_LENGTH,
          strength: Math.min(sessionMinutes / 60, 0.6),
          confidence: 0.7,
          priority: 6,
          timestamp: Date.now(),
          metadata: {
            sessionDuration: context.sessionDuration,
            sessionMinutes,
          },
        });
      }
    } catch (error) {
      logger.error('Cognitive Load signal detection failed', error);
    }

    return signals;
  }

  /**
   * Error Prediction AIからシグナルを検出
   */
  private async detectErrorPredictionSignals(
    word: string,
    result: 'correct' | 'incorrect'
  ): Promise<LearningSignal[]> {
    const signals: LearningSignal[] = [];

    try {
      if (result === 'incorrect') {
        // 混同ペアの検出
        const confusionPairs = this.getConfusionPairs(word);

        if (confusionPairs.length > 0) {
          signals.push({
            source: SignalSource.ERROR_PREDICTION,
            type: StrategyType.USE_CONFUSION_PAIRS,
            strength: Math.min(0.7 + confusionPairs.length * 0.1, 0.9),
            confidence: 0.85,
            priority: 8,
            timestamp: Date.now(),
            metadata: {
              confusionPairs,
              errorType: this.detectErrorType(word),
            },
          });
        }

        // 文脈不足による誤答の可能性
        if (this.needsContextualLearning(word)) {
          signals.push({
            source: SignalSource.ERROR_PREDICTION,
            type: StrategyType.CONTEXTUAL_LEARNING,
            strength: 0.6,
            confidence: 0.75,
            priority: 7,
            timestamp: Date.now(),
            metadata: {
              reason: 'context_insufficient',
            },
          });
        }
      }
    } catch (error) {
      logger.error('Error Prediction signal detection failed', error);
    }

    return signals;
  }

  /**
   * Learning Style AIからシグナルを検出
   */
  private async detectLearningStyleSignals(context: QuestionContext): Promise<LearningSignal[]> {
    const signals: LearningSignal[] = [];

    try {
      // 時間帯最適化
      const currentHour = new Date().getHours();
      const optimalHour = this.getOptimalLearningHour();
      const hourDiff = Math.abs(currentHour - optimalHour);

      if (hourDiff > 3) {
        signals.push({
          source: SignalSource.LEARNING_STYLE,
          type: StrategyType.TIME_OF_DAY_OPTIMIZATION,
          strength: Math.min(hourDiff / 12, 0.5),
          confidence: 0.6,
          priority: 4,
          timestamp: Date.now(),
          metadata: {
            currentHour,
            optimalHour,
          },
        });
      }

      // セッション長最適化
      const optimalSessionLength = 25 * 60 * 1000; // 25分（ポモドーロ）
      const sessionDiff = Math.abs((context.sessionDuration ?? 0) - optimalSessionLength);

      if (sessionDiff > 10 * 60 * 1000) {
        signals.push({
          source: SignalSource.LEARNING_STYLE,
          type: StrategyType.ADJUST_SESSION_LENGTH,
          strength: Math.min(sessionDiff / (30 * 60 * 1000), 0.6),
          confidence: 0.65,
          priority: 5,
          timestamp: Date.now(),
          metadata: {
            currentSessionLength: context.sessionDuration,
            optimalSessionLength,
          },
        });
      }
    } catch (error) {
      logger.error('Learning Style signal detection failed', error);
    }

    return signals;
  }

  /**
   * Linguistic Relations AIからシグナルを検出
   */
  private async detectLinguisticRelationsSignals(word: string): Promise<LearningSignal[]> {
    const signals: LearningSignal[] = [];

    try {
      // 関連語彙の検出（簡易版：実際のデータがないため推定）
      // 実装時は allQuestions を渡して findWordRelations を使用
      const hasRelatedWords = word.length > 3; // 簡易判定

      if (hasRelatedWords) {
        signals.push({
          source: SignalSource.LINGUISTIC_RELATIONS,
          type: StrategyType.GROUP_BY_THEME,
          strength: 0.6,
          confidence: 0.5, // 簡易実装のため信頼度は低め
          priority: 6,
          timestamp: Date.now(),
          metadata: {
            simplified: true,
            reason: '関連語彙によるグループ学習を推奨',
          },
        });
      }

      // 語源情報の利用可能性（簡易版）
      // 実際の語源データへのアクセスが必要な場合は、Question型から取得
      const mayHaveEtymology = word.length >= 4; // 簡易判定

      if (mayHaveEtymology) {
        signals.push({
          source: SignalSource.LINGUISTIC_RELATIONS,
          type: StrategyType.USE_ETYMOLOGY,
          strength: 0.4,
          confidence: 0.5, // 簡易実装のため信頼度は低め
          priority: 5,
          timestamp: Date.now(),
          metadata: {
            simplified: true,
            reason: '語源情報を活用した学習を推奨',
          },
        });
      }
    } catch (error) {
      logger.error('Linguistic Relations signal detection failed', error);
    }

    return signals;
  }

  /**
   * Contextual Learning AIからシグナルを検出
   */
  private async detectContextualLearningSignals(
    word: string,
    result: 'correct' | 'incorrect'
  ): Promise<LearningSignal[]> {
    const signals: LearningSignal[] = [];

    try {
      if (result === 'incorrect') {
        // 文脈例文の利用可能性
        const hasContexts = this.hasAvailableContexts(word);

        if (hasContexts) {
          signals.push({
            source: SignalSource.CONTEXTUAL_LEARNING,
            type: StrategyType.CONTEXTUAL_LEARNING,
            strength: 0.75,
            confidence: 0.85,
            priority: 7,
            timestamp: Date.now(),
            metadata: {
              availableContexts: this.getAvailableContextCount(word),
            },
          });
        }

        // テーマ別学習の有効性
        const themeCategory = this.getThemeCategory(word);

        if (themeCategory) {
          signals.push({
            source: SignalSource.CONTEXTUAL_LEARNING,
            type: StrategyType.GROUP_BY_THEME,
            strength: 0.6,
            confidence: 0.75,
            priority: 6,
            timestamp: Date.now(),
            metadata: {
              themeCategory,
            },
          });
        }
      }
    } catch (error) {
      logger.error('Contextual Learning signal detection failed', error);
    }

    return signals;
  }

  // ================== ヘルパーメソッド ==================

  /**
   * シグナルをフィルタリングしてソート
   */
  private filterAndSortSignals(signals: LearningSignal[]): LearningSignal[] {
    // 強度フィルタリング
    const minStrength = this.config.minSignalStrength ?? 0.3;
    const filtered = signals.filter((s) => s.strength >= minStrength);

    // 優先度でソート（降順）
    filtered.sort((a, b) => b.priority - a.priority);

    // 最大数に制限
    return filtered.slice(0, this.config.maxActiveSignals);
  }

  /**
   * シグナルをキャッシュ
   */
  private cacheSignals(key: string, signals: LearningSignal[]): void {
    this.signalCache.set(key, signals);

    // タイムアウト後にクリア
    setTimeout(() => {
      this.signalCache.delete(key);
    }, this.cacheTimeout);
  }

  /**
   * キャッシュされたシグナルを取得
   */
  private getCachedSignals(key: string): LearningSignal[] | null {
    return this.signalCache.get(key) || null;
  }

  /**
   * モジュール名を取得
   */
  private getModuleName(index: number): string {
    const modules = [
      'MemoryAcquisition',
      'CognitiveLoad',
      'ErrorPrediction',
      'LearningStyle',
      'LinguisticRelations',
      'ContextualLearning',
    ];
    return modules[index] || 'Unknown';
  }

  /**
   * 習得進捗を取得（仮実装）
   */
  private getAcquisitionProgress(word: string): AcquisitionProgress | null {
    try {
      const key = `acquisition_${word}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      logger.warn('Failed to load acquisition progress', error);
    }
    return null;
  }

  /**
   * 即座復習が必要か判定
   */
  private shouldImmediateRepeat(progress: AcquisitionProgress): boolean {
    const consecutiveErrors = this.getConsecutiveErrors(progress);
    return consecutiveErrors >= 3;
  }

  /**
   * 連続エラー数を計算
   */
  private getConsecutiveErrors(progress: AcquisitionProgress): number {
    let count = 0;
    for (let i = progress.todayReviews.length - 1; i >= 0; i--) {
      if (progress.todayReviews[i].isCorrect) break;
      count++;
    }
    return count;
  }

  /**
   * 即座復習の強度を計算
   */
  private calculateImmediateRepeatStrength(progress: AcquisitionProgress): number {
    const consecutiveErrors = this.getConsecutiveErrors(progress);
    return Math.min(0.8 + consecutiveErrors * 0.05, 1.0);
  }

  /**
   * 習得進捗を計算（0-100）
   */
  private calculateAcquisitionProgress(progress: AcquisitionProgress): number {
    return Math.min((progress.totalAttempts / progress.dynamicThreshold) * 100, 100);
  }

  /**
   * 認知負荷を推定
   */
  private estimateCognitiveLoad(context: QuestionContext): number {
    const timeLoad = Math.min((context.sessionDuration ?? 0) / (60 * 60 * 1000), 1); // 1時間で1.0
    const errorLoad = Math.min(context.recentErrors / 5, 1); // 5エラーで1.0
    return (timeLoad + errorLoad) / 2;
  }

  /**
   * 休憩時間を計算（ミリ秒）
   */
  private calculateBreakDuration(cognitiveLoad: number): number {
    if (cognitiveLoad >= 0.9) return 10 * 60 * 1000; // 10分
    if (cognitiveLoad >= 0.8) return 5 * 60 * 1000; // 5分
    return 3 * 60 * 1000; // 3分
  }

  /**
   * 疲労レベルを取得
   */
  private getFatigueLevel(cognitiveLoad: number): 'low' | 'medium' | 'high' {
    if (cognitiveLoad >= 0.8) return 'high';
    if (cognitiveLoad >= 0.5) return 'medium';
    return 'low';
  }

  /**
   * 混同ペアを取得（仮実装）
   */
  private getConfusionPairs(word: string): string[] {
    // 実際の実装では、errorPredictionAIから取得
    const confusionMap: Record<string, string[]> = {
      affect: ['effect'],
      effect: ['affect'],
      accept: ['except'],
      except: ['accept'],
    };
    return confusionMap[word] || [];
  }

  /**
   * エラータイプを検出
   */
  private detectErrorType(_word: string): 'spelling' | 'meaning' | 'pronunciation' {
    // 簡易実装: 単語の特性から推定
    return 'meaning';
  }

  /**
   * 文脈学習が必要か判定
   */
  private needsContextualLearning(word: string): boolean {
    // 多義語や抽象的な単語は文脈学習が有効
    const abstractWords = ['abstract', 'concept', 'theory', 'principle'];
    return abstractWords.includes(word);
  }

  /**
   * 最適な学習時間帯を取得
   */
  private getOptimalLearningHour(): number {
    // 簡易実装: 朝10時を最適とする
    return 10;
  }

  /**
   * 利用可能な文脈例文があるか
   */
  private hasAvailableContexts(_word: string): boolean {
    // 実際の実装では、データベースから確認
    return true;
  }

  /**
   * 利用可能な文脈例文の数を取得
   */
  private getAvailableContextCount(_word: string): number {
    // 実際の実装では、データベースから取得
    return 3;
  }

  /**
   * テーマカテゴリを取得
   */
  private getThemeCategory(word: string): string | null {
    // 実際の実装では、linguisticRelationsAIから取得
    const themeMap: Record<string, string> = {
      apple: 'fruits',
      banana: 'fruits',
      dog: 'animals',
      cat: 'animals',
    };
    return themeMap[word] || null;
  }
}
