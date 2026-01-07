/**
 * QuestionScheduler - 統一問題スケジューラー
 *
 * 全タブ（暗記・和訳・スペル・文法）共通の出題順序決定ロジック
 *
 * 【主要機能】
 * 1. DTA (Time-Dependent Adjustment): 忘却曲線に基づく優先度調整
 * 2. 振動防止: 最近正解した問題の即座再出題を防止
 * 3. メタAIシグナル統合: 疲労・飽き・過学習を検出して出題調整
 * 4. 優先度計算: category + DTA + signals + timeBoost
 *
 * 【使用例】
 * ```typescript
 * const scheduler = new QuestionScheduler();
 * const result = scheduler.schedule({
 *   questions: filtered,
 *   mode: 'memorization',
 *   limits: { learningLimit: 10, reviewLimit: 5 },
 *   sessionStats,
 *   useMetaAI: true,
 * });
 * ```
 */

import type { Question } from '@/types';
import { loadProgressSync } from '@/storage/progress/progressStorage';
import type {
  ScheduleParams,
  ScheduleContext,
  ScheduleResult,
  WordStatus,
  PrioritizedQuestion,
  RecentAnswer,
  ForgettingRiskParams,
  DetectedSignal,
} from './types';
import type { WordProgress } from '@/storage/progress/types';
import { AntiVibrationFilter } from './AntiVibrationFilter';
import { logger } from '@/utils/logger';
import { writeDebugJSON } from '@/utils/debugStorage';
import { AICoordinator } from '../AICoordinator';
import type { SessionStats as AISessionStats } from '../types';
import { positionToCategory } from '../utils/categoryDetermination';
import { PositionCalculator, type LearningMode } from './PositionCalculator';
import { MemoryAI } from '@/ai/specialists/MemoryAI';
import { CognitiveLoadAI } from '@/ai/specialists/CognitiveLoadAI';
import { ErrorPredictionAI } from '@/ai/specialists/ErrorPredictionAI';
import { LinguisticAI } from '@/ai/specialists/LinguisticAI';
import { ContextualAI } from '@/ai/specialists/ContextualAI';
import { LearningStyleAI } from '@/ai/specialists/LearningStyleAI';
import { GamificationAI } from '@/ai/specialists/GamificationAI';
import { generateContextualSequence } from '@/ai/optimization/contextualLearningAI';
import { isIncorrectWordCategory, isReviewWordCategory } from '@/ai/utils/wordCategoryPredicates';
import { DebugTracer } from '@/utils/DebugTracer';
import {
  getStrengthLookupForScheduling,
  getVocabularyNetworkForScheduling,
  recordVocabularyNetworkSchedulerPerf,
  startVocabularyNetworkPrecomputeIfNeeded,
} from '@/ai/utils/vocabularyNetwork';
import { getABTestManager } from '@/ai/experiments/ABTestManager';
import { BatchManager } from './BatchManager';
import { SlotAllocator } from './SlotAllocator';
import { SlotConfigManager } from './SlotConfigManager';

export class QuestionScheduler {
  private antiVibration: AntiVibrationFilter;
  private recentAnswersCache: Map<string, RecentAnswer[]> = new Map();
  public readonly aiCoordinator: AICoordinator;
  private slotAllocator: SlotAllocator; // 🆕 カテゴリーベーススロットシステム
  private batchManager: BatchManager | null = null; // ⚡ BatchManagerキャッシュ
  private lastProgressDataFetch: number = 0; // ⚡ 最終取得時刻
  private cachedProgressData: Record<string, any> | null = null; // ⚡ キャッシュ

  private incorrectSkipQueue: PrioritizedQuestion[] = [];
  private skipCounter: number = 0;
  private skipTarget: number = 0;

  private static get isVerboseDebug(): boolean {
    return import.meta.env.DEV && localStorage.getItem('debug-scheduler-verbose') === 'true';
  }

  private static getProgressMapFromParams(params: ScheduleParams): Record<string, any> {
    if (params.progressOverride) return params.progressOverride;
    return loadProgressSync().wordProgress || {};
  }

  constructor() {
    this.antiVibration = new AntiVibrationFilter();
    this.aiCoordinator = new AICoordinator({ debugMode: import.meta.env.DEV });
    this.slotAllocator = new SlotAllocator(); // 🆕 SlotAllocatorインスタンス
  }

  /**
   * Strategy用の依存関係を取得
   * 
   * Strategy PatternにおけるDependency Injection
   */
  private getDependencies() {
    return {
      antiVibration: this.antiVibration,
      aiCoordinator: this.aiCoordinator,
      slotAllocator: this.slotAllocator,
      batchManager: this.batchManager,
      scheduler: this, // QuestionScheduler自身をContextとして渡す
    };
  }

  private getRandomSkipCount(): number {
    const random = Math.random();
    if (random < 0.4) return 2;
    if (random < 0.7) return 3;
    if (random < 0.9) return 4;
    return 5;
  }

  /**
   * 問題をスケジューリング（メインAPI）
   *
   * @param params スケジューリングパラメータ
   * @returns スケジューリング結果
   */
  async schedule(params: ScheduleParams): Promise<ScheduleResult> {
    const startTime = performance.now();

    // 🆕 バッチモード: アクティブな単語のみにフィルタリング
    // ⚡ パフォーマンス最適化: インスタンス再利用、progressDataキャッシュ（5秒）
    if (BatchManager.isEnabled()) {
      // BatchManagerインスタンスを再利用
      if (!this.batchManager) {
        this.batchManager = new BatchManager();
      }

      // progressDataを5秒間キャッシュ（頻繁なlocalStorage読み取りを削減）
      const now = Date.now();
      // progressOverride が指定されている場合はキャッシュではなく常にそちらを優先
      const progressData = params.progressOverride
        ? params.progressOverride
        : (() => {
            if (!this.cachedProgressData || now - this.lastProgressDataFetch > 5000) {
              this.cachedProgressData = loadProgressSync().wordProgress || {};
              this.lastProgressDataFetch = now;
            }
            return this.cachedProgressData;
          })();

      this.batchManager.initialize(params.questions, {
        batchSize: 100,
        clearThreshold: 0.7,
        mode: params.mode as 'memorization' | 'translation' | 'spelling' | 'grammar',
        reset: false, // ← 既存設定を優先
      });

      const activeWords = this.batchManager.getActiveWords();

      // ⚡ 軽量チェック: 50問に1回だけバッチ追加をチェック
      const shouldCheck = params.sessionStats?.correct
        ? params.sessionStats.correct % 50 === 0
        : false;

      if (shouldCheck) {
        const added = this.batchManager.checkAndAddNextBatch(progressData);
        if (added && localStorage.getItem('debug-batch-mode') === 'true') {
          logger.info('[QuestionScheduler] 次バッチが追加されました');
        }
      }

      // アクティブな単語のみをフィルタリング
      const activeSet = new Set(activeWords);
      params = {
        ...params,
        questions: params.questions.filter((q) => activeSet.has(q.word)),
      };

      // デバッグログは100問に1回のみ
      if (shouldCheck && localStorage.getItem('debug-batch-mode') === 'true') {
        const status = this.batchManager.getStatus(progressData);
        logger.info('[QuestionScheduler] バッチステータス', {
          currentBatch: status.currentBatch,
          activeCount: status.activeCount,
          clearedCount: status.clearedCount,
          clearRate: `${(status.clearRate * 100).toFixed(1)}%`,
        });
      }
    }

    // A/B: いもづる式（局所並べ替え）のON/OFFを割当
    // - 呼び出し側が明示指定した場合は尊重
    // - 未指定の場合のみ、AB割当から自動決定（デフォルトOFF）
    if (typeof params.useChainLearning !== 'boolean') {
      params = {
        ...params,
        useChainLearning: getABTestManager().isFeatureEnabled(
          'chain_learning_retention_2025_01',
          'useChainLearning'
        ),
      };
    }

    const debugInfo = {
      timestamp: new Date().toISOString(),
      mode: params.mode,
      questionCount: params.questions.length,
      hybridMode: params.hybridMode || false,
      useChainLearning: params.useChainLearning,
      firstQuestions: params.questions.slice(0, 10).map((q) => q.word),
    };

    // スケジューリング開始（ログ削減のため出力なし）

    // localStorage に保存（デバッグ用）
    try {
      const existing = JSON.parse(localStorage.getItem('debug_scheduler_calls') || '[]');
      existing.push(debugInfo);
      if (existing.length > 10) existing.shift(); // 最新10件のみ保持
      if (QuestionScheduler.isVerboseDebug)
        localStorage.setItem('debug_scheduler_calls', JSON.stringify(existing));
    } catch {
      // ignore
    }

    // 🔥 ランダム飛ばし機能（オブザーバー提案）
    // 待機キューから再出題チェック
    if (this.skipCounter >= this.skipTarget && this.incorrectSkipQueue.length > 0) {
      const readyQuestion = this.incorrectSkipQueue.shift()!;
      this.skipCounter = 0;
      this.skipTarget = 0;

      if (import.meta.env.DEV) {
        console.log('🔥 [RandomSkip] 待機キューから再出題:', readyQuestion.question.word);
      }

      // 待機キューの問題を最優先で出題
      const otherQuestions = params.questions.filter((q) => q.word !== readyQuestion.question.word);
      return this.schedule({
        ...params,
        questions: [readyQuestion.question, ...otherQuestions],
      });
    }

    // 飛ばしカウンター進行
    if (this.skipTarget > 0) {
      this.skipCounter++;
      // Debug log removed to reduce console noise
    }

    // 🆕 カテゴリーベーススロットシステム（新実装）
    // 明示指定（params.useCategorySlots）がある場合は、他モードより優先して適用する。
    if (params.useCategorySlots) {
      console.log('🎯 [QuestionScheduler] カテゴリースロット方式を開始します', {
        mode: params.mode,
        questionsCount: params.questions.length,
        timestamp: new Date().toISOString(),
      });
      try {
        const result = await this.scheduleCategorySlots(params, startTime);
        console.log('✅ [QuestionScheduler] カテゴリースロット方式が正常に完了しました', {
          mode: params.mode,
          resultSize: result.scheduledQuestions.length,
          processingTime: `${result.processingTime.toFixed(2)}ms`,
        });
        return result;
      } catch (error) {
        console.error(
          '❌ [QuestionScheduler] カテゴリースロット方式でエラーが発生しました:',
          error
        );
        logger.warn(
          '[QuestionScheduler] カテゴリースロット方式に失敗したためフォールバックします',
          {
            mode: params.mode,
            error: String(error),
          }
        );
        // 続行して通常のメタAI経路へ
      }
    }

    // 🎯 Strategy Pattern: モード別スケジューリング戦略選択
    // ハイブリッドモード: 既存AIの順序を尊重
    if (params.hybridMode) {
      const HybridScheduleStrategy = await import(
        './strategies/HybridScheduleStrategy'
      ).then((m) => m.HybridScheduleStrategy);
      const strategy = new HybridScheduleStrategy(this.getDependencies());
      return strategy.schedule({
        params,
        startTime,
        dependencies: this.getDependencies(),
        progressData: QuestionScheduler.getProgressMapFromParams(params),
      });
    }

    // finalPriorityモード: AICoordinatorのfinalPriorityを主軸にする（variant=C）
    if (params.finalPriorityMode) {
      const FinalPriorityScheduleStrategy = await import(
        './strategies/FinalPriorityScheduleStrategy'
      ).then((m) => m.FinalPriorityScheduleStrategy);
      const strategy = new FinalPriorityScheduleStrategy(this.getDependencies());
      return strategy.schedule({
        params,
        startTime,
        dependencies: this.getDependencies(),
        progressData: QuestionScheduler.getProgressMapFromParams(params),
      });
    }

    // 1. コンテキスト構築
    const context = this.buildContext(params);

    const signals = this.detectSignals(context);

    // 3. 優先度計算（DTA統合 + Position分散）
    // ⚠️ calculatePriorities()内でapplyInterleavingAdjustment()を呼び出し済み
    const prioritized = this.calculatePriorities(params.questions, context, signals, false);

    // 4. 振動防止フィルター適用
    const filtered = this.applyAntiVibration(prioritized, context);

    // 4.5 学習上限（語数上限）← 廃止（バッチモードに移行）
    // const limited = this.applyLearningLimits(filtered, params, context);

    // 5. ソート・バランス調整
    const sorted = this.sortAndBalance(filtered, params, context);

    // 6. 後処理
    const questions = this.postProcess(sorted, context);

    // 📊 localStorage保存: postProcess後のTOP30（実際の出題順序）
    // NOTE: mode別キーも併記して、translation等の30問テストで上書きされないようにする
    try {
      const top30 = questions.slice(0, 30).map((q, _idx) => {
        const pq = sorted.find((pq) => pq.question.word === q.word);
        return {
          word: q.word,
          position: pq?.position || 0,
          category: pq?.status?.category,
          attempts: pq?.status?.attempts || 0,
        };
      });

      const payload = {
        timestamp: new Date().toISOString(),
        mode: context.mode,
        source: 'schedule',
        top30,
      };

      writeDebugJSON('debug_postProcess_output', payload, { mode: context.mode });
    } catch {
      // localStorage失敗は無視
    }

    // 7. 振動スコア計算
    const vibrationScore = this.antiVibration.calculateVibrationScore(
      sorted,
      context.recentAnswers,
      20
    );

    // 8. 🔒 強制装置: sortAndBalance() → postProcess() の順序整合性検証
    const sortedTop10Positions = sorted.slice(0, 10).map((pq) => pq.position);
    const questionsTop10Positions = questions
      .slice(0, 10)
      .map((q) => sorted.find((pq) => pq.question.word === q.word)?.position ?? 0);

    // TOP10の順序が一致しているか検証
    const orderMismatch = !sortedTop10Positions.every(
      (pos, idx) => pos === questionsTop10Positions[idx]
    );

    if (orderMismatch && import.meta.env.DEV) {
      console.error(
        '🚨 [QuestionScheduler] CRITICAL: postProcess()がsortAndBalance()の順序を破壊しました！',
        {
          sortedTop10: sorted
            .slice(0, 10)
            .map((pq) => ({ word: pq.question.word, pos: pq.position })),
          questionsTop10: questions.slice(0, 10).map((q) => ({
            word: q.word,
            pos: sorted.find((pq) => pq.question.word === q.word)?.position ?? 0,
          })),
        }
      );
    }

    const processingTime = performance.now() - startTime;

    const resultDebug = {
      top10Words: questions.slice(0, 10).map((q) => q.word),
      top10Positions: sorted
        .slice(0, 10)
        .map((pq) => ({ word: pq.question.word, position: pq.position })),
      orderMismatch,
    };

    logger.info(`[QuestionScheduler] スケジューリング完了`, {
      processingTime: Math.round(processingTime) + 'ms',
      vibrationScore,
      signalCount: signals.length,
      resultDebug,
    });

    // localStorage に結果を保存（デバッグ用）
    try {
      const existing = JSON.parse(localStorage.getItem('debug_scheduler_results') || '[]');
      existing.push({
        timestamp: new Date().toISOString(),
        ...resultDebug,
      });
      if (existing.length > 10) existing.shift();
      if (QuestionScheduler.isVerboseDebug)
        localStorage.setItem('debug_scheduler_results', JSON.stringify(existing));
    } catch {
      // ignore
    }

    // 🔥 ランダム飛ばし機能: incorrect単語を待機キューに追加
    // トップ問題がincorrectの場合のみ（出題直前に判定）
    if (sorted.length > 0 && context.recentAnswers.length > 0) {
      const topQuestion = sorted[0];
      const recentAnswer = context.recentAnswers.find((a) => a.word === topQuestion.question.word);

      if (recentAnswer && !recentAnswer.correct) {
        // 既に待機キューにない場合のみ追加
        const alreadyQueued = this.incorrectSkipQueue.some(
          (pq) => pq.question.word === topQuestion.question.word
        );

        if (!alreadyQueued) {
          this.incorrectSkipQueue.push(topQuestion);
          this.skipTarget = this.getRandomSkipCount();
          this.skipCounter = 0;

          if (import.meta.env.DEV) {
            console.log(
              `🔥 [RandomSkip] incorrect待機キューに追加: ${topQuestion.question.word} (${this.skipTarget}問後に再出題)`
            );
          }

          // トップ問題を除外して再スケジューリング
          const nextQuestions = questions.slice(1);
          if (nextQuestions.length > 0) {
            return {
              scheduledQuestions: nextQuestions,
              vibrationScore,
              processingTime,
              signalCount: signals.length,
              debug: {
                dtaApplied: sorted.filter((pq) => (pq.status?.position ?? 50) < 20).length, // mastered
                antiVibrationApplied: sorted.filter((pq) => pq.antiVibrationApplied).length,
                signalsDetected: signals,
                randomSkipApplied: true, // 🔥 追加
              },
            };
          }
        }
      }
    }

    return {
      scheduledQuestions: questions,
      vibrationScore,
      processingTime,
      signalCount: signals.length,
      debug: {
        dtaApplied: sorted.filter((pq) => (pq.status?.position ?? 50) < 20).length, // mastered
        antiVibrationApplied: sorted.filter((pq) => pq.antiVibrationApplied).length,
        signalsDetected: signals,
      },
    };
  }

  /**
   * セッションコンテキストを構築
   * 
   * TODO: 工程6で共通ヘルパーに抽出
   */
  public buildContext(params: ScheduleParams): ScheduleContext {
    const now = new Date();
    const hour = now.getHours();
    const timeOfDay =
      hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';

    const cognitiveLoad = this.calculateCognitiveLoad(params.sessionStats);
    const recentAnswers = this.getRecentAnswers(params.mode, params.progressOverride);

    // 単語別の学習進捗を読み込み（override対応）
    const progressMap = QuestionScheduler.getProgressMapFromParams(params);
    const wordProgress: Record<string, any> = {};
    for (const question of params.questions) {
      const wp = progressMap[question.word];
      if (wp) wordProgress[question.word] = wp;
    }

    return {
      mode: params.mode,
      sessionStats: params.sessionStats,
      recentAnswers,
      timeOfDay,
      cognitiveLoad,
      isReviewFocusMode: params.isReviewFocusMode || false,
      sessionStartTime: Date.now() - (params.sessionStats.duration || 0),
      wordProgress,
    };
  }

  /**
   * 認知負荷を計算（0-1）
   */
  private calculateCognitiveLoad(stats: ScheduleParams['sessionStats']): number {
    const errorRate =
      stats.correct + stats.incorrect > 0 ? stats.incorrect / (stats.correct + stats.incorrect) : 0;

    const sessionMinutes = (stats.duration || 0) / 60000;
    const timeLoad = Math.min(sessionMinutes / 30, 1); // 30分で最大

    return Math.min(errorRate * 0.7 + timeLoad * 0.3, 1);
  }

  /**
   * 最近の解答履歴を取得（最大100件）
   */
  private getRecentAnswers(mode: string, progressOverride?: Record<string, any>): RecentAnswer[] {
    // キャッシュチェック
    if (this.recentAnswersCache.has(mode) && !progressOverride) {
      return this.recentAnswersCache.get(mode)!;
    }

    try {
      const progressMap = progressOverride ?? (loadProgressSync().wordProgress || {});
      const answers: RecentAnswer[] = [];

      Object.entries(progressMap || {}).forEach(([word, data]: [string, any]) => {
        if (data.lastStudied > 0) {
          const calculator = new PositionCalculator(
            mode as 'memorization' | 'translation' | 'spelling' | 'grammar'
          );
          const position = calculator.calculate(data);
          const bucket = PositionCalculator.categoryOf(position);
          answers.push({
            word,
            correct: !isIncorrectWordCategory(bucket),
            timestamp: data.lastStudied,
            consecutiveCorrect: data.streak || 0,
          });
        }
      });

      answers.sort((a, b) => b.timestamp - a.timestamp);
      const recentAnswers = answers.slice(0, 100);

      if (!progressOverride) {
        this.recentAnswersCache.set(mode, recentAnswers);
      }

      return recentAnswers;
    } catch (error) {
      logger.error('[QuestionScheduler] 解答履歴の取得に失敗', error);
      return [];
    }
  }

  /**
   * シグナル検出（メタAI統合）
   *
   * 学習状況に基づいて適応的なシグナルを検出:
   * - 疲労シグナル: 長時間セッション、エラー率上昇
   * - 飽きシグナル: 同じ問題の繰り返し
   * - 過学習シグナル: 連続正解が多すぎる
   * - 苦戦シグナル: 連続不正解
   * 
   * TODO: 工程6で共通ヘルパーに抽出
   */
  public detectSignals(context: ScheduleContext): DetectedSignal[] {
    try {
      const signals: DetectedSignal[] = [];

      const stats = context.sessionStats;
      const totalAttempts = stats.correct + stats.incorrect + stats.still_learning;
      const errorRate = totalAttempts > 0 ? stats.incorrect / totalAttempts : 0;
      const sessionMinutes = (stats.duration || 0) / 60000;

      // 1. 疲労シグナル検出
      if (sessionMinutes > 20 || context.cognitiveLoad > 0.7) {
        const confidence = Math.min((sessionMinutes / 30) * 0.5 + context.cognitiveLoad * 0.5, 1);
        signals.push({
          type: 'fatigue',
          confidence,
          action: 'easier',
        });
        logger.debug(`[Signal] 疲労検出: ${(confidence * 100).toFixed(0)}%`);
      }

      // 2. 苦戦シグナル検出
      if (errorRate > 0.4 && totalAttempts >= 5) {
        const confidence = Math.min(errorRate, 0.9);
        signals.push({
          type: 'struggling',
          confidence,
          action: 'review',
        });
        logger.debug(
          `[Signal] 苦戦検出: ${(confidence * 100).toFixed(0)}% (エラー率${(errorRate * 100).toFixed(0)}%)`
        );
      }

      // 3. 過学習シグナル検出（連続正解が多すぎる）
      const consecutiveCorrect = stats.consecutiveCorrect || 0;
      if (consecutiveCorrect > 10) {
        const confidence = Math.min(consecutiveCorrect / 15, 0.9);
        signals.push({
          type: 'overlearning',
          confidence,
          action: 'harder',
        });
        logger.debug(
          `[Signal] 過学習検出: ${(confidence * 100).toFixed(0)}% (連続${consecutiveCorrect}回正解)`
        );
      }

      // 4. 最適状態検出
      if (errorRate >= 0.2 && errorRate <= 0.35 && consecutiveCorrect < 8) {
        signals.push({
          type: 'optimal',
          confidence: 0.8,
          action: 'continue',
        });
        logger.debug(`[Signal] 最適学習状態検出`);
      }

      // シグナルがない場合は通常モード
      if (signals.length === 0) {
        logger.debug('[Signal] シグナル検出なし - 通常モード');
      }

      return signals;
    } catch (error) {
      logger.error('[QuestionScheduler] シグナル検出エラー', error);
      return [];
    }
  }

  /**
   * Position計算（7つのAI評価統合）
   * ⚡ パフォーマンス最適化: localStorageを1回だけ読み込む
   * 
   * TODO: 工程6で共通ヘルパーに抽出
   */
  public calculatePriorities(
    questions: Question[],
    context: ScheduleContext,
    signals: any[],
    hybridMode = false
  ): PrioritizedQuestion[] {
    // 📞 関数呼び出しトレース
    this.recordFunctionCall('calculatePriorities', {
      questionsCount: questions.length,
      hybridMode,
    });

    // ⚡ 最適化: localStorage を一度だけ読み込んでキャッシュ
    const progressCache = this.loadProgressCache();

    // 🐛 DEBUG: 入力時点でまだまだ語が含まれているか確認
    let calcSpanId: string | undefined;
    if (import.meta.env.DEV) {
      const weakWordsInInput = questions.filter((q) => {
        const status = this.getWordStatusFromCache(q.word, context.mode, progressCache);
        return status && status.attempts > 0 && status.position >= 40;
      });

      calcSpanId = DebugTracer.startSpan('QuestionScheduler.calculatePriorities', {
        weakWordsCount: weakWordsInInput.length,
        totalCount: questions.length,
        weakWords: weakWordsInInput.map((q) => q.word),
      });
    }

    // 🎯 難易度別適応学習: 中級・上級の正答率が悪い場合、初級を優先
    const difficultyAdaptation = this.calculateDifficultyAdaptation(progressCache);

    const prioritized = questions.map((q, index) => {
      const status = this.getWordStatusFromCache(q.word, context.mode, progressCache);

      // ハイブリッドモード: 元の順序を保持（indexベース）
      if (hybridMode) {
        const position = (index / questions.length) * 100; // 0-100の範囲
        return {
          question: q,
          position,
          status,
          signals: [],
          originalIndex: index,
          attempts: status?.attempts || 0, // 出題回数を追加
        };
      }

      // ✅ Position = 0-100スコア（determineWordPosition()で計算済み）
      // すでに7つのAI評価・TimeBoost・全ての要素が統合されている
      let position = status?.position || 35; // デフォルト: new範囲

      // 🐛 DEBUG: statusがnullの場合を検出
      if (import.meta.env.DEV && status === null && index < 20) {
        console.warn(
          `⚠️ [calculatePriorities] ${q.word}: status is NULL (using default position=35)`
        );
      }

      // 🎯 難易度別適応: 中級・上級が苦手な場合、初級を優先
      position = this.applyDifficultyAdaptation(position, q, difficultyAdaptation);

      // 🔍 デバッグ: Position値確認（開発環境のみ、最初の20単語のみ）
      if (import.meta.env.DEV && index < 20) {
        console.log(
          `🔍 [calculatePriorities] ${q.word}: position=${position}, status.position=${status?.position}, status=${status ? 'OK' : 'NULL'}`
        );
      }

      return {
        question: q,
        position: position,
        status,
        signals: [],
        originalIndex: index,
        attempts: status?.attempts || 0, // 出題回数を追加
      };
    });

    // 🎮 Position分散適用（インターリーブ）
    const adjusted = this.applyInterleavingAdjustment(prioritized, context.mode, questions.length);

    // 🎫 スパン終了（calculatePriorities完了）
    if (import.meta.env.DEV && calcSpanId) {
      const weakWordsAfter = adjusted.filter(
        (pq) => pq.position >= 40 && pq.position < 70 && (pq.attempts ?? 0) > 0
      );
      DebugTracer.endSpan(calcSpanId, {
        weakWordsCount: weakWordsAfter.length,
        totalCount: adjusted.length,
        weakWords: weakWordsAfter.map((pq) => pq.question.word),
      });
    }

    return adjusted;
  }

  /**
   * GamificationAIによるPosition調整（インターリーブ用）
   */
  private applyInterleavingAdjustment(
    prioritized: PrioritizedQuestion[],
    mode: ScheduleParams['mode'],
    questionsCount: number
  ): PrioritizedQuestion[] {
    // 📞 関数呼び出しトレース
    this.recordFunctionCall('applyInterleavingAdjustment', {
      prioritizedCount: prioritized.length,
      mode,
      questionsCount,
    });

    // 🐛 DEBUG: GamificationAI入力時点でまだまだ語を確認
    let gamificationSpanId: string | undefined;
    if (import.meta.env.DEV) {
      const weakWordsInInput = prioritized.filter(
        (pq) => pq.position >= 40 && pq.position < 70 && (pq.attempts ?? 0) > 0
      );

      gamificationSpanId = DebugTracer.startSpan('QuestionScheduler.beforeGamification', {
        weakWordsCount: weakWordsInInput.length,
        totalCount: prioritized.length,
        weakWords: weakWordsInInput.map((pq) => pq.question.word),
      });
    }

    const gamificationAI = new GamificationAI();

    // 🔍 デバッグ: Position分散前の統計（正確なカテゴリ判定）
    const before = {
      stillLearning: prioritized.filter(
        (pq) => pq.position >= 40 && pq.position < 70 && (pq.attempts ?? 0) > 0
      ).length,
      incorrect: prioritized.filter((pq) => pq.position >= 70).length,
      new: prioritized.filter((pq) => pq.position < 40).length,
      boostable: prioritized.filter(
        (pq) => pq.position >= 25 && pq.position < 40 && (pq.attempts ?? 0) === 0
      ).length,
    };

    // まだまだ語のブースト（Position 45 → 60）
    const { result: boostedStill, changed: stillChanged } =
      gamificationAI.boostStillLearningQuestions(prioritized);

    // 新規語のPosition引き上げ
    const { result, changed } = gamificationAI.adjustPositionForInterleaving(boostedStill);

    // 🔍 デバッグ: Position分散後の統計（正確なカテゴリ判定）
    const after = {
      stillLearning: result.filter(
        (pq) => pq.position >= 40 && pq.position < 70 && (pq.attempts ?? 0) > 0
      ).length,
      incorrect: result.filter((pq) => pq.position >= 70).length,
      new: result.filter((pq) => pq.position < 40).length,
      boostable: result.filter(
        (pq) => pq.position >= 25 && pq.position < 40 && (pq.attempts ?? 0) === 0
      ).length,
    };

    // 🔍 Position階層検証（「あっちを立てればこっちが立たず」防止）
    const stillInBoostedZone = result.filter((pq) => {
      const isStill = pq.position >= 40 && pq.position < 70 && (pq.attempts ?? 0) > 0;
      return isStill && pq.position >= 60 && pq.position < 70; // まだまだ語が60-69範囲内
    }).length;
    const newInBoostedZone = result.filter((pq) => {
      const isNew = pq.position >= 40 && (pq.attempts ?? 0) === 0;
      return isNew && pq.position >= 40 && pq.position < 60; // 新規語（ブースト後）が40-59範囲内
    }).length;
    const hierarchyViolation = result.filter((pq) => {
      const isNew = (pq.attempts ?? 0) === 0;
      const isStill = (pq.attempts ?? 0) > 0 && pq.position >= 40 && pq.position < 70;
      // 新規 > まだまだ の逆転をチェック
      return (isNew && pq.position >= 60) || (isStill && pq.position < 60);
    });

    if (QuestionScheduler.isVerboseDebug && hierarchyViolation.length > 0) {
      console.error(
        `❌ [Position階層違反] 「あっちを立てればこっちが立たず」検出: ${hierarchyViolation.length}語`
      );
      console.error('🚨 新規語がPosition 60以上、またはまだまだ語がPosition 60未満');
      hierarchyViolation.slice(0, 3).forEach((pq) => {
        const word = pq.question.word;
        const type = (pq.attempts ?? 0) === 0 ? '新規' : 'まだまだ';
        console.error(`  • ${word} (${type}): Position ${pq.position.toFixed(0)}`);
      });
    }

    // localStorage保存（デバッグパネル用）
    if (QuestionScheduler.isVerboseDebug) {
      try {
        const snapshot = {
          mode,
          questionsCount,
          stillInBoostedZone,
          newInBoostedZone,
          violations: hierarchyViolation.map((pq) => ({
            word: pq.question.word,
            position: pq.position,
            attempts: pq.attempts ?? 0,
            type: (pq.attempts ?? 0) === 0 ? 'new_exceeds_60' : 'still_below_60',
          })),
          violationCount: hierarchyViolation.length,
          isValid: hierarchyViolation.length === 0,
          timestamp: new Date().toISOString(),
        };

        // legacy
        localStorage.setItem('debug_position_hierarchy_validation', JSON.stringify(snapshot));
        // by-mode
        localStorage.setItem(
          `debug_position_hierarchy_validation_${mode}`,
          JSON.stringify(snapshot)
        );
      } catch {
        // localStorage失敗は無視
      }
    }

    // Position変更があった問題を記録 (すでにGamificationAIから返ってくる)

    // localStorage保存
    if (QuestionScheduler.isVerboseDebug) {
      try {
        const snapshot = {
          mode,
          questionsCount,
          timestamp: new Date().toISOString(),
          before,
          after,
          stillChanged,
          changed,
          summary: {
            stillBoosted: stillChanged.length,
            newBoosted: changed.length,
            working: stillChanged.length > 0 || changed.length > 0,
          },
        };

        // legacy
        localStorage.setItem('debug_position_interleaving', JSON.stringify(snapshot));
        // by-mode
        const byModeKey = `debug_position_interleaving_${mode}`;
        localStorage.setItem(byModeKey, JSON.stringify(snapshot));
        // history
        const historyKey = `debug_position_interleaving_history_${mode}`;
        try {
          const existingRaw = localStorage.getItem(historyKey);
          const existing = JSON.parse(existingRaw || '[]');
          const arr = Array.isArray(existing) ? existing : [];
          arr.push(snapshot);
          while (arr.length > 5) arr.shift();
          localStorage.setItem(historyKey, JSON.stringify(arr));
        } catch {
          // ignore
        }
      } catch {
        // localStorage失敗は無視
      }
    }

    if (QuestionScheduler.isVerboseDebug) {
      console.log('🎮 [GamificationAI] Position分散前:', before);
      console.log('🎮 [GamificationAI] Position分散後:', after);
      if (stillChanged.length > 0) {
        console.log(
          '✅ [GamificationAI] まだまだ語ブースト:',
          stillChanged.slice(0, 10).map((c) => ({
            word: c.word,
            before: c.before.toFixed(0),
            after: c.after.toFixed(0),
          }))
        );
      }
      if (changed.length > 0) {
        console.log(
          '✅ [GamificationAI] 新規語Position引き上げ:',
          changed.slice(0, 10).map((c) => ({
            word: c.word,
            before: c.before.toFixed(0),
            after: c.after.toFixed(0),
          }))
        );
      } else {
        // まだまだ語が0の場合はPosition分散がスキップされる（正常動作）
        if (before.stillLearning === 0 && before.incorrect === 0) {
          console.log(
            'ℹ️ [GamificationAI] まだまだ・分からない語が0語 → Position分散スキップ（正常動作）'
          );
        } else {
          console.warn('⚠️ [GamificationAI] Position変更なし - 新規語が不足している可能性');
        }
      }
    }

    // 🎯 まだまだ語のPosition引き上げ（新規より優先させる）
    const { result: stillLearningBoosted, changed: stillLearningChanges } =
      gamificationAI.boostStillLearningQuestions(result);

    // localStorage保存
    if (QuestionScheduler.isVerboseDebug) {
      try {
        const snapshot = {
          mode,
          questionsCount,
          timestamp: new Date().toISOString(),
          boosted: stillLearningChanges.length,
          changes: stillLearningChanges,
          working: stillLearningChanges.length > 0,
        };
        // legacy
        localStorage.setItem('debug_still_learning_boost', JSON.stringify(snapshot));
        // by-mode
        localStorage.setItem(`debug_still_learning_boost_${mode}`, JSON.stringify(snapshot));
      } catch {
        // localStorage失敗は無視
      }
    }

    if (QuestionScheduler.isVerboseDebug && stillLearningChanges.length > 0) {
      console.log(
        '🎯 [GamificationAI] まだまだ語ブースト:',
        stillLearningChanges.slice(0, 10).map((c) => ({
          word: c.word,
          before: c.before.toFixed(0),
          after: c.after.toFixed(0),
        }))
      );
    }

    // 🎫 スパン終了（GamificationAI処理完了）
    if (import.meta.env.DEV && gamificationSpanId) {
      const weakWordsAfter = stillLearningBoosted.filter(
        (pq) => pq.position >= 40 && pq.position < 70 && (pq.attempts ?? 0) > 0
      );
      DebugTracer.endSpan(gamificationSpanId, {
        weakWordsCount: weakWordsAfter.length,
        totalCount: stillLearningBoosted.length,
        weakWords: weakWordsAfter.map((pq) => pq.question.word),
      });
    }

    return stillLearningBoosted;
  }

  /**
   * 関数呼び出しをlocalStorageに記録（デバッグ用）
   */
  private recordFunctionCall(funcName: string, params: any): void {
    try {
      const stored = localStorage.getItem('debug_function_calls');
      const logs = stored ? JSON.parse(stored) : [];
      logs.push({
        timestamp: new Date().toISOString(),
        function: funcName,
        params,
      });
      // 最新30件のみ保持
      if (logs.length > 30) logs.shift();
      if (QuestionScheduler.isVerboseDebug)
        localStorage.setItem('debug_function_calls', JSON.stringify(logs));
    } catch {
      // localStorage失敗は無視
    }
  }

  /**
   * 忘却リスクスコアを計算（0-200）
   * 注: この計算は参考値。実際のPosition計算はdetermineWordPosition()で実施済み
   */
  private calculateForgettingRisk(params: ForgettingRiskParams): number {
    if (params.lastStudied === 0) return 0;

    const daysSinceLastStudy = (Date.now() - params.lastStudied) / (1000 * 60 * 60 * 24);
    const intervalRatio =
      params.reviewInterval > 0 ? daysSinceLastStudy / params.reviewInterval : 0;

    let risk = intervalRatio * 100;

    // 正答率による調整
    if (params.accuracy < 50) {
      risk *= 1.5; // 正答率低い→リスク増
    } else if (params.accuracy >= 80) {
      risk *= 0.7; // 正答率高い→リスク減
    }

    return Math.round(Math.min(risk, 200));
  }

  /**
   * シグナルを優先度に反映
   *
   * シグナルに基づいて優先度を動的に調整:
   * - 疲労: 簡単な問題（masteredなど）の優先度を上げる
   * - 苦戦: 復習問題（incorrect/still_learning）の優先度を大きく上げる
   * - 過学習: 難しい問題の優先度を上げる
   * - 最適: 現在の優先度を維持
   */
  private applySignals(
    priority: number,
    signals: Array<{
      type: 'fatigue' | 'boredom' | 'overlearning' | 'struggling' | 'optimal';
      confidence: number;
      action: 'easier' | 'harder' | 'diverse' | 'review' | 'continue';
    }>,
    _question: Question
  ): number {
    if (signals.length === 0) return priority;

    let adjustedPriority = priority;

    for (const signal of signals) {
      switch (signal.type) {
        case 'fatigue':
          // 疲労時: mastered問題を少し優先（復習しやすい）
          if (priority > 8) {
            adjustedPriority *= 1 - signal.confidence * 0.2; // 最大20%優先度アップ
          }
          break;

        case 'struggling':
          // 苦戦時: incorrect/still_learningの優先度を大きく下げる（優先出題）
          if (priority < 2) {
            adjustedPriority *= 1 - signal.confidence * 0.3; // 最大30%優先度アップ
          }
          break;

        case 'overlearning':
          // 過学習時: 新しい問題や難しい問題を優先
          if (priority >= 3 && priority <= 5) {
            adjustedPriority *= 1 - signal.confidence * 0.15; // 最大15%優先度アップ
          }
          break;

        case 'optimal':
          // 最適状態: 現在の優先度を維持
          break;
      }
    }

    return adjustedPriority;
  }

  /**
  /**
   * ⚡ localStorage からプログレスデータを1回だけ読み込む
   */
  /**
   * 進捗データキャッシュをロード
   * 
   * TODO: 工程6で共通ヘルパーに抽出
   */
  public loadProgressCache(): any {
    try {
      const progress = loadProgressSync();
      return progress;
    } catch {
      return null;
    }
  }

  /**
   * ⚡ キャッシュされたデータから語句の学習状況を取得
   * 
   * TODO: 工程6で共通ヘルパーに抽出
   */
  public getWordStatusFromCache(
    word: string,
    mode: LearningMode,
    progressCache: any
  ): WordStatus | null {
    if (!progressCache || !progressCache.wordProgress) return null;

    const wordProgress = progressCache.wordProgress[word];
    if (!wordProgress) return null;

    const calculator = new PositionCalculator(mode);
    const position = calculator.calculate(wordProgress);
    const stats = calculator.getStats(wordProgress);
    const category = PositionCalculator.categoryOf(position);

    return {
      category,
      position,
      lastStudied: wordProgress.lastStudied || 0,
      attempts: stats.attempts,
      correct: stats.correct,
      streak: wordProgress.consecutiveCorrect || 0,
      forgettingRisk: 0,
      reviewInterval: 1,
    };
  }

  /**
   * 語句の学習状況を取得（旧メソッド - 互換性のため残す）
   */
  private getWordStatus(word: string, mode: string): WordStatus | null {
    try {
      const progress = loadProgressSync();
      const wordProgress = progress.wordProgress?.[word];
      if (!wordProgress) return null;

      const calculator = new PositionCalculator(
        mode as 'memorization' | 'translation' | 'spelling' | 'grammar'
      );
      const position = calculator.calculate(wordProgress);
      const bucket = PositionCalculator.categoryOf(position);

      // ✅ デバッグ: AI判定結果
      if (import.meta.env.DEV) {
        console.log(`🔍 [QuestionScheduler] ${word}: Position=${position}, category=${bucket}`);
      }

      // 🎯 モード別の試行回数を取得（重要！）
      let modeAttempts = 0;
      let modeCorrect = 0;
      switch (mode) {
        case 'memorization':
          modeAttempts = wordProgress.memorizationAttempts || 0;
          modeCorrect = wordProgress.memorizationCorrect || 0;
          break;
        case 'translation':
          modeAttempts = wordProgress.translationAttempts || 0;
          modeCorrect = wordProgress.translationCorrect || 0;
          break;
        case 'spelling':
          modeAttempts = wordProgress.spellingAttempts || 0;
          modeCorrect = wordProgress.spellingCorrect || 0;
          break;
        case 'grammar':
          modeAttempts = wordProgress.grammarAttempts || 0;
          modeCorrect = wordProgress.grammarCorrect || 0;
          break;
        default:
          // フォールバック: 総合値
          modeAttempts = (wordProgress.correctCount || 0) + (wordProgress.incorrectCount || 0);
          modeCorrect = wordProgress.correctCount || 0;
      }

      const status = {
        category: bucket,
        position,
        lastStudied: wordProgress.lastStudied || 0,
        attempts: modeAttempts, // ✅ モード別試行回数
        correct: modeCorrect, // ✅ モード別正解回数
        streak: wordProgress.consecutiveCorrect || 0,
        forgettingRisk: 0,
        reviewInterval: 1,
      };

      // デバッグ: incorrect/still_learningの単語のみログ出力
      if (isReviewWordCategory(bucket)) {
        logger.debug(
          `[WordStatus] ${word}: ${bucket} (position=${position}, attempts=${status.attempts}, consecutiveIncorrect=${wordProgress.consecutiveIncorrect || 0})`
        );
      }

      return status;
    } catch (error) {
      logger.error('[QuestionScheduler] 学習状況の取得に失敗', error);
      return null;
    }
  }

  /**
   * 振動防止フィルター適用
   * 
   * TODO: 工程6で共通ヘルパーに抽出
   */
  public applyAntiVibration(
    questions: PrioritizedQuestion[],
    context: ScheduleContext
  ): PrioritizedQuestion[] {
    return this.antiVibration.filter(questions, {
      recentAnswers: context.recentAnswers,
      minInterval: 60000, // 1分
      consecutiveThreshold: 3, // 3連続正解
    });
  }

  /**
   * 学習上限（語数上限）を適用
   *
   * 🚫 廃止: バッチ管理システムに移行
   * 理由: バッチモードでは100語ずつ追加したいため、語数上限は不要
   *
   * @deprecated バッチモード（BatchManager）を使用してください
   */
  private applyLearningLimits(
    questions: PrioritizedQuestion[],
    _params: ScheduleParams,
    _context: ScheduleContext
  ): PrioritizedQuestion[] {
    // 語数上限を廃止し、全ての問題を返す
    return questions;
  }

  /**
   * ソート・バランス調整
   * 注: category = 学習状態（分からない/まだまだ/未学習/定着済）
   * 
   * TODO: 工程6で共通ヘルパーに抽出
   */
  public sortAndBalance(
    questions: PrioritizedQuestion[],
    _params: ScheduleParams,
    _context: ScheduleContext
  ): PrioritizedQuestion[] {
    // � 関数呼び出しトレース
    this.recordFunctionCall('sortAndBalance', { questionsCount: questions.length });

    // �🔍 デバッグ: TOP20のPosition確認
    if (import.meta.env.DEV && questions.length > 0) {
      const top20 = questions.slice(0, Math.min(20, questions.length));
      console.log(
        '🔍 [sortAndBalance] TOP20 Position確認:',
        top20.map((pq) => ({
          word: pq.question.word,
          position: pq.position,
          statusPosition: pq.status?.position,
        }))
      );
    }

    // 学習状態（習得度）別に分類
    // ⚠️ 重要: pq.positionを使用（pq.status?.positionではない）
    const incorrectQuestions = questions.filter((pq) => pq.position >= 70); // 分からない
    const stillLearningQuestions = questions.filter(
      (pq) => pq.position >= 40 && pq.position < 70 // まだまだ
    );
    const otherQuestions = questions.filter(
      (pq) => pq.position < 40 // 未学習 or 定着済
    );

    // 🔍 デバッグ: カテゴリ分類結果
    if (QuestionScheduler.isVerboseDebug) {
      console.log('🔍 [sortAndBalance] カテゴリ分類結果:', {
        incorrect: incorrectQuestions.length,
        stillLearning: stillLearningQuestions.length,
        other: otherQuestions.length,
        incorrectWords: incorrectQuestions.slice(0, 5).map((pq) => pq.question.word),
        stillLearningWords: stillLearningQuestions.slice(0, 5).map((pq) => pq.question.word),
      });
    }

    // デバッグ: 学習状態別の統計
    const learningStatusStats = questions.reduce(
      (acc, pq) => {
        const status = pq.status?.category || 'null'; // 学習状態（分からない/まだまだ/未学習/定着済）
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // 学習状態統計（ログ削減のため出力なし）

    // 🚨 警告: すべての単語の学習状態がnullの場合、学習履歴が読み取れていない
    if (learningStatusStats['null'] === questions.length) {
      if (import.meta.env.DEV) {
        logger.warn(
          '[QuestionScheduler] 全単語の学習段階がnull - localStorageから学習履歴を読み取れていない可能性があります'
        );
      }
    }

    // 各カテゴリ内でPosition順ソート（降順: Positionが高い順）
    // NOTE: 視覚回帰（スナップショット）と学習体験の安定性のため、同順位のランダム化は行わない。
    const sortByPosition = (a: PrioritizedQuestion, b: PrioritizedQuestion) => {
      if (a.position !== b.position) {
        return b.position - a.position; // ✅ 降順（Positionが高い順）
      }

      // 同一Positionは入力順（originalIndex）で安定化
      return (a.originalIndex || 0) - (b.originalIndex || 0);
    };

    incorrectQuestions.sort(sortByPosition);
    stillLearningQuestions.sort(sortByPosition);
    otherQuestions.sort(sortByPosition);

    // 🎲 GamificationAI: Position分散適用済み（calculatePriorities内）
    // Position降順ソート + カテゴリ別インターリーブで自然に交互出題を実現
    const sorted = [...questions].sort((a, b) => {
      if (a.position !== b.position) {
        return b.position - a.position; // 降順（高い方が優先）
      }
      // 同一Positionは入力順（originalIndex）で安定化
      return (a.originalIndex || 0) - (b.originalIndex || 0);
    });

    // 🎮 GamificationAI: カテゴリ別インターリーブ（苦手語4問→新規1問）
    // 重要: Position降順ソートを前提に、ランダム化は行わない（テスト/UXの安定性）
    const interleaved = new GamificationAI().interleaveByCategory(sorted);

    // 🎯 吸引確認: まだまだ・分からない語がTOP30に何語含まれるか検証
    if (QuestionScheduler.isVerboseDebug) {
      const strugglingInSorted = sorted.filter(
        (pq) => pq.position >= 40 && (pq.attempts ?? 0) > 0
      ).length;
      const strugglingInTop30 = interleaved
        .slice(0, 30)
        .filter((pq) => pq.position >= 40 && (pq.attempts ?? 0) > 0).length;
      const strugglingInTop10 = interleaved
        .slice(0, 10)
        .filter((pq) => pq.position >= 40 && (pq.attempts ?? 0) > 0).length;

      console.log('🎯 [吸引確認] まだまだ・分からない語の分布', {
        total: strugglingInSorted,
        top30: strugglingInTop30,
        top10: strugglingInTop10,
        coverage:
          strugglingInSorted > 0
            ? `${((strugglingInTop30 / strugglingInSorted) * 100).toFixed(1)}%`
            : '-',
      });

      if (strugglingInSorted > 0 && strugglingInTop30 === 0) {
        console.warn(
          '⚠️ [吸引失敗] まだまだ・分からない語がTOP30に1つも含まれていません！Position降順ソートが機能していない可能性があります。'
        );
      }
    }

    // デバッグ: 学習段階分布（開発環境のみ）
    if (QuestionScheduler.isVerboseDebug) {
      const top20 = interleaved.slice(0, Math.min(20, interleaved.length));
      const positionDistribution = {
        分からない: top20.filter((pq) => pq.position >= 70).length,
        まだまだ: top20.filter((pq) => pq.position >= 40 && pq.position < 70).length,
        未学習or定着済: top20.filter((pq) => pq.position < 40).length,
      };
      console.log('🔀 [出題順序] インターリーブ後の学習段階分布', positionDistribution);

      const top20Categories = top20
        .map((pq) => {
          const word = pq.question.word;
          const attempts = pq.attempts ?? 0;
          const category =
            attempts > 0 && pq.position >= 40 && pq.position < 70
              ? 'まだまだ'
              : pq.position >= 40 && pq.position < 70
                ? '新規(引上)'
                : pq.position >= 70
                  ? '分からない'
                  : '新規';
          return `${word}(${category})`;
        })
        .join(', ');
      console.log('🎮 [インターリーブ] TOP20:', top20Categories);
    }

    // 📊 localStorage保存: sortAndBalance出力のTOP30
    try {
      const top30 = interleaved.slice(0, 30).map((pq) => ({
        word: pq.question.word,
        position: pq.position,
        category: pq.status?.category,
        attempts: pq.attempts ?? pq.status?.attempts ?? 0,
      }));
      if (QuestionScheduler.isVerboseDebug)
        localStorage.setItem('debug_sortAndBalance_output', JSON.stringify(top30));

      // 📊 追加: TOP100も保存して、まだまだ語が何位にいるか確認
      const top100 = interleaved.slice(0, 100).map((pq, idx) => ({
        rank: idx + 1,
        word: pq.question.word,
        position: pq.position,
        category: pq.status?.category,
        attempts: pq.attempts ?? pq.status?.attempts ?? 0,
      }));
      // ⚠️ まだまだ語の定義: Position 40-70 かつ attempts > 0
      const stillLearningInTop100 = top100.filter(
        (item) => item.position >= 40 && item.position < 70 && item.attempts > 0
      );

      // 📊 TOP516位も確認（Position 50の新規516語の後にまだまだ語が来るはず）
      const top600 = interleaved.slice(0, 600).map((pq, idx) => ({
        rank: idx + 1,
        word: pq.question.word,
        position: pq.position,
        attempts: pq.attempts ?? pq.status?.attempts ?? 0,
      }));
      const stillLearningInTop600 = top600.filter(
        (item) => item.position >= 40 && item.position < 70 && item.attempts > 0
      );

      if (QuestionScheduler.isVerboseDebug) {
        const snapshot = {
          timestamp: new Date().toISOString(),
          mode: _params.mode,
          questionsCount: questions.length,
          interleavedCount: interleaved.length,
          top100,
          top600,
          top600Count: top600.length,
          stillLearningInTop100: stillLearningInTop100.length,
          stillLearningInTop600: stillLearningInTop600.length,
          stillLearningWordsInTop100: stillLearningInTop100.map(
            (item) => `${item.rank}位: ${item.word} (Position ${item.position}, ${item.attempts}回)`
          ),
          stillLearningWordsInTop600: stillLearningInTop600
            .slice(0, 20)
            .map(
              (item) =>
                `${item.rank}位: ${item.word} (Position ${item.position}, ${item.attempts}回)`
            ),
          position50Count: top600.filter((item) => item.position === 50 && item.attempts === 0)
            .length,
        };

        // 旧キー（互換用）: 最新の1件（モード混在で上書きされ得るので、読む側はmode別キー推奨）
        localStorage.setItem('debug_sortAndBalance_top100', JSON.stringify(snapshot));

        // 新キー: mode別に保存（モード違いの上書きを防止）
        const byModeKey = `debug_sortAndBalance_top100_${_params.mode}`;
        localStorage.setItem(byModeKey, JSON.stringify(snapshot));

        // 新キー: mode別に短い履歴を保持（同一mode内のミニ実行(30問など)でも、必要なスナップショットを選べる）
        const historyKey = `debug_sortAndBalance_top100_history_${_params.mode}`;
        try {
          const existingRaw = localStorage.getItem(historyKey);
          const existing = JSON.parse(existingRaw || '[]');
          const arr = Array.isArray(existing) ? existing : [];
          arr.push(snapshot);
          while (arr.length > 5) arr.shift();
          localStorage.setItem(historyKey, JSON.stringify(arr));
        } catch {
          // ignore
        }
      }
    } catch {
      // localStorage失敗は無視
    }

    if (_params.useChainLearning) {
      return this.applyChainLearningWithinTopN(interleaved, _params);
    }

    return interleaved;
  }

  /**
   * いもづる式（語彙ネットワーク）による“局所的な並べ替え”
   * - Position降順/インターリーブの大枠は維持
   * - TOP数十問のみ、同一Position帯の範囲内で関連語が近くなるように並べ替える
   * - ネットワークが未保存でも軽量に生成し、保存はアイドル時に回す
   */
  private applyChainLearningWithinTopN(
    interleaved: PrioritizedQuestion[],
    params: ScheduleParams
  ): PrioritizedQuestion[] {
    const t0 =
      typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();

    const maxReorder = 80;
    const topCount = Math.min(maxReorder, interleaved.length);
    if (topCount <= 2) return interleaved;

    getVocabularyNetworkForScheduling(params.questions);
    startVocabularyNetworkPrecomputeIfNeeded(params.questions);
    const lookup = getStrengthLookupForScheduling(params.questions);

    const top = interleaved.slice(0, topCount);
    const tail = interleaved.slice(topCount);

    const bucketOf = (pq: PrioritizedQuestion) => Math.floor(pq.position / 10);
    const getStrength = (a: string, b: string): number => {
      const s1 = lookup.get(a)?.get(b) ?? 0;
      const s2 = lookup.get(b)?.get(a) ?? 0;
      return Math.max(s1, s2);
    };

    const reordered: PrioritizedQuestion[] = [];
    let i = 0;
    const touchedBuckets = new Set<number>();
    let usedReorder = false;
    while (i < top.length) {
      const bucket = bucketOf(top[i]);
      touchedBuckets.add(bucket);
      let j = i + 1;
      while (j < top.length && bucketOf(top[j]) === bucket) {
        j++;
      }

      const segment = top.slice(i, j);
      if (segment.length <= 2) {
        reordered.push(...segment);
        i = j;
        continue;
      }

      // まずは元の先頭を起点に、貪欲に“次に最も関係が強い語”を繋ぐ
      const remaining = segment.slice(1);
      const segmentOut: PrioritizedQuestion[] = [segment[0]];

      let totalLink = 0;
      while (remaining.length > 0) {
        const prev = segmentOut[segmentOut.length - 1].question.word;
        let bestIdx = 0;
        let bestStrength = -1;

        for (let k = 0; k < remaining.length; k++) {
          const cand = remaining[k].question.word;
          const strength = getStrength(prev, cand);
          if (strength > bestStrength) {
            bestStrength = strength;
            bestIdx = k;
          }
        }

        totalLink += Math.max(0, bestStrength);
        segmentOut.push(remaining.splice(bestIdx, 1)[0]);
      }

      // 関連が全く取れない場合は、元の順序を維持
      if (totalLink === 0) {
        reordered.push(...segment);
      } else {
        usedReorder = true;
        reordered.push(...segmentOut);
      }

      i = j;
    }

    const out = [...reordered, ...tail];

    const t1 =
      typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();
    recordVocabularyNetworkSchedulerPerf({
      ms: t1 - t0,
      topCount,
      buckets: touchedBuckets.size,
      usedReorder,
    });

    return out;
  }

  /**
   * 後処理 - 関連語グループ化による出題順序の最適化
   *
   * 重要制約: Position階層（70-100 > 60-69 > 40-59 > 20-39 > 0-19）を絶対に保持
   * 各Position範囲内でのみ並べ替えを行い、範囲間の順序は維持する
   * 
   * TODO: 工程6で共通ヘルパーに抽出
   */
  public postProcess(questions: PrioritizedQuestion[], context: ScheduleContext): Question[] {
    // 基本的な変換
    // NOTE: 各タブで「再出題差し込み」「Position不整合検知」を共通で扱えるよう、
    // schedule()の返却QuestionにもPositionを付与する（UXは変えず、データのみ追加）。
    const baseQuestions = questions.map(
      (pq) =>
        ({
          ...pq.question,
          position: pq.position,
          finalPriority: pq.finalPriority,
        }) as unknown as Question
    );

    // ✅ インターリーブ済みの順序を保持
    // sortAndBalance() で GamificationAI.interleaveByCategory() により
    // Position階層を跨いだ交互配置が既に適用されている場合、ここでPosition帯域ごとに
    // 再構成すると「新規が前に来ない（分からない連打で新規が消える）」状態を作る。
    // そのため、順序が“厳密なPosition帯域の単調並び”になっていない場合は、後処理の
    // 並べ替え（関連語グループ化）をスキップして既存順序を返す。
    const isInterleavedAcrossBands = true; // 強制的にtrue（関連語グループ化を無効化）

    // デバッグ用: postProcessの挙動を保存（パネルで原因切り分けに使う）
    // NOTE: mode別キーも併記して、translation等の30問テストで上書きされないようにする
    try {
      const top30 = questions.slice(0, 30).map((pq) => ({
        word: pq.question.word,
        position: pq.position ?? 0,
        attempts: pq.status?.attempts ?? 0,
      }));

      const payload = {
        timestamp: new Date().toISOString(),
        mode: context.mode,
        isInterleavedAcrossBands,
        action: isInterleavedAcrossBands
          ? 'skipped_contextual_reorder'
          : 'applied_contextual_reorder',
        top30,
      };

      writeDebugJSON('debug_postProcess_meta', payload, { mode: context.mode });
    } catch {
      // ignore
    }

    if (isInterleavedAcrossBands) {
      return baseQuestions;
    }

    // 関連語グループ化機能を適用（contextualLearningAI）
    try {
      const allProgress = this.getAllProgress();
      const _recentlyStudied = this.getRecentlyStudiedWords(context);

      // Position範囲ごとに分割（階層を保持するため）
      const positionBands = this.splitByPositionBands(questions, context);

      const reorderedQuestions: Question[] = [];
      let totalClusters = 0;
      let totalTransitions = 0;

      // 各Position範囲内で独立に並べ替え
      for (const band of positionBands) {
        if (band.questions.length === 0) continue;

        const bandQuestions = band.questions.map(
          (pq) =>
            ({
              ...pq.question,
              position: pq.position,
              finalPriority: pq.finalPriority,
            }) as unknown as Question
        );

        // Position範囲内でのみ関連語グループ化
        const contextualResult = generateContextualSequence(
          bandQuestions,
          allProgress,
          // schedule結果から「出題自体」を除外しないため、recentlyStudiedは渡さない
          // （generateContextualSequenceはrecentlyStudiedをsequenceから除外する設計）
          []
        );

        // 最適化されたsequenceに従って並び替え（範囲内のみ）
        const questionMap = new Map(bandQuestions.map((q) => [q.word, q]));
        const bandReordered = contextualResult.sequence
          .map((word) => questionMap.get(word))
          .filter((q): q is Question => q !== undefined);

        reorderedQuestions.push(...bandReordered);
        totalClusters += contextualResult.clusters.length;
        totalTransitions += contextualResult.transitions.length;
      }

      // デバッグログ（開発時のみ）- 関連語グループ化の詳細を可視化
      if (import.meta.env.DEV && totalTransitions > 0) {
        // Position範囲ごとの統計
        const bandsInfo = positionBands.map((b) => ({
          range: b.range,
          count: b.questions.length,
          clusterCount: 0, // あとで計算
          transitionCount: 0,
        }));

        // 関連性遷移の詳細（最初の10個のみ）
        const debugTransitions: any[] = [];
        let bandIdx = 0;
        for (const band of positionBands) {
          if (band.questions.length === 0) continue;

          const bandQuestions = band.questions.map((pq) => pq.question);
          const contextualResult = generateContextualSequence(bandQuestions, allProgress, []);

          bandsInfo[bandIdx].clusterCount = contextualResult.clusters.length;
          bandsInfo[bandIdx].transitionCount = contextualResult.transitions.length;

          // 最初の3遷移のみ記録
          debugTransitions.push(
            ...contextualResult.transitions.slice(0, 3).map((t) => ({
              band: band.range,
              from: t.from,
              to: t.to,
              reason: t.reason,
            }))
          );

          bandIdx++;
        }

        logger.info('[postProcess] 関連語グループ化適用（Position階層保持）:', {
          positionBands: positionBands.length,
          totalClusters,
          totalTransitions,
          bandsInfo,
          sampleTransitions: debugTransitions.slice(0, 10), // 最大10個
        });
      }

      // 📊 postProcess後のTOP30を保存（デバッグパネル用）
      // NOTE: read側は { top30: [...] } のみを前提にする
      try {
        const top30 = reorderedQuestions.slice(0, 30).map((q, idx) => ({
          rank: idx + 1,
          word: q.word,
          position: (q as any).position ?? 0,
          attempts: (q as any).attempts ?? 0,
        }));

        // Position分布を計算
        const positionDistribution = {
          incorrect: top30.filter((q) => q.position >= 70).length,
          stillLearning: top30.filter((q) => q.position >= 60 && q.position < 70).length,
          newBoosted: top30.filter((q) => q.position >= 40 && q.position < 60).length,
          newNormal: top30.filter((q) => q.position >= 20 && q.position < 40).length,
          mastered: top30.filter((q) => q.position < 20).length,
        };

        const payload = {
          timestamp: new Date().toISOString(),
          mode: context.mode,
          source: 'postProcess',
          top30,
          positionDistribution,
          totalQuestions: reorderedQuestions.length,
        };

        writeDebugJSON('debug_postProcess_output', payload, { mode: context.mode });
      } catch {
        // localStorage失敗は無視
      }

      return reorderedQuestions;
    } catch (error) {
      // エラー時はフォールバック
      logger.warn('[postProcess] 関連語グループ化でエラー、基本順序を使用:', error);
      return baseQuestions;
    }
  }

  /**
   * Position範囲でグループ化（階層の不変条件を保持）
   *
   * Position階層:
   * - 70-100: incorrect（分からない）← 第1優先
   * - 60-69:  still_learning (boosted) ← 第2優先
   * - 40-59:  new (boosted) ← 第3優先
   * - 20-39:  new (normal) ← 第4優先
   * - 0-19:   mastered ← 第5優先
   */
  private splitByPositionBands(
    questions: PrioritizedQuestion[],
    _context: ScheduleContext
  ): Array<{ range: string; questions: PrioritizedQuestion[] }> {
    const bands = [
      { range: '70-100 (incorrect)', min: 70, max: 100, questions: [] as PrioritizedQuestion[] },
      { range: '60-69 (still_learning)', min: 60, max: 69, questions: [] as PrioritizedQuestion[] },
      { range: '40-59 (new boosted)', min: 40, max: 59, questions: [] as PrioritizedQuestion[] },
      { range: '20-39 (new normal)', min: 20, max: 39, questions: [] as PrioritizedQuestion[] },
      { range: '0-19 (mastered)', min: 0, max: 19, questions: [] as PrioritizedQuestion[] },
    ];

    questions.forEach((pq) => {
      const position = pq.position;

      for (const band of bands) {
        if (position >= band.min && position <= band.max) {
          band.questions.push(pq);
          break;
        }
      }
    });

    // Position範囲順（降順）で返す
    return bands.filter((b) => b.questions.length > 0);
  }

  /**
   * 最近学習した単語リストを取得（直近20語）
   */
  private getRecentlyStudiedWords(context: ScheduleContext): string[] {
    const recentWords: string[] = [];
    const now = Date.now();
    const recentThreshold = 5 * 60 * 1000; // 5分以内

    for (const [word, progress] of Object.entries(context.wordProgress)) {
      const lastStudied = progress?.lastStudied;
      if (lastStudied && now - new Date(lastStudied).getTime() < recentThreshold) {
        recentWords.push(word);
      }
    }

    return recentWords.slice(-20); // 最新20語
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.recentAnswersCache.clear();
    logger.info('[QuestionScheduler] キャッシュクリア完了');
  }

  /**
   * AI統合用: 単語の進捗データを取得
   */
  private getWordProgress(word: string): any | null {
    try {
      const progress = loadProgressSync();
      return progress.wordProgress?.[word] || null;
    } catch {
      return null;
    }
  }

  /**
   * AI統合用: すべての単語進捗データを取得
   */
  private getAllProgress(): Record<string, any> {
    try {
      const progress = loadProgressSync();
      return progress.wordProgress || {};
    } catch {
      return {};
    }
  }

  /**
   * AI統合用: セッション統計を変換
   */
  private convertToAISessionStats(stats: any): AISessionStats {
    return {
      totalAttempts: stats.correct + stats.incorrect + stats.still_learning,
      correctAnswers: stats.correct || 0,
      incorrectAnswers: stats.incorrect || 0,
      stillLearningAnswers: stats.still_learning || 0,
      sessionStartTime: Date.now() - (stats.duration || 0),
      sessionDuration: stats.duration || 0,
      avgResponseTime: stats.avgResponseTime,
      consecutiveIncorrect: stats.consecutiveIncorrect || 0,
      masteredCount: stats.masteredCount || 0,
      stillLearningCount: stats.still_learningCount || 0,
      incorrectCount: stats.incorrectCount || 0,
      newCount: stats.newCount || 0,
    };
  }

  /**
   * 解答後のPosition再計算（Phase 1.2: progressStorageから移動）
   *
   * @param word - 単語名（AI評価履歴記録用）
   * @param progress - 単語の進捗情報
   * @param mode - 学習モード（各タブで独立した計算のため）
   * @returns Position スコア（0-100）
   *
   * Position計算:
   * すべてdetermineWordPosition()で実施済み
   * - BaseScore: 50 - (accuracy × 30) + (consecutiveErrors × 10)
   * - AI評価: 7つのAI評価を重み付き統合
   * - TimeBoost: min(daysSince × 2, 20)
   */
  public recalculatePriorityAfterAnswer(
    word: string,
    progress: WordProgress,
    mode: 'memorization' | 'translation' | 'spelling' | 'grammar' = 'memorization'
  ): number {
    // ✅ Position = 0-100スコア（7つのAI評価統合済み、タブ別）
    // 解答直後は progress の各カウンタが更新された直後なので、
    // 直前に保存されている tab別Position（savedPosition）は“古い値”になり得る。
    // ここでは savedPosition を一時的に無視して再計算する（解答結果を即反映）。
    const positionBefore = (() => {
      switch (mode) {
        case 'memorization':
          return progress.memorizationPosition ?? 50;
        case 'translation':
          return progress.translationPosition ?? 50;
        case 'spelling':
          return progress.spellingPosition ?? 50;
        case 'grammar':
          return progress.grammarPosition ?? 50;
        default:
          return 50;
      }
    })();

    const position = this.determinePositionAfterAnswer(progress, mode);

    const bucket = PositionCalculator.categoryOf(position);

    // 正答率を計算
    const totalAttempts = progress.correctCount + progress.incorrectCount;
    progress.accuracyRate = totalAttempts > 0 ? progress.correctCount / totalAttempts : 0;

    // モード別統計（デバッグ用）
    let modeAttempts = 0;
    let modeCorrect = 0;
    let modeStillLearning = 0;
    switch (mode) {
      case 'memorization':
        modeAttempts = progress.memorizationAttempts || 0;
        modeCorrect = progress.memorizationCorrect || 0;
        modeStillLearning = progress.memorizationStillLearning || 0;
        break;
      case 'translation':
        modeAttempts = progress.translationAttempts || 0;
        modeCorrect = progress.translationCorrect || 0;
        break;
      case 'spelling':
        modeAttempts = progress.spellingAttempts || 0;
        modeCorrect = progress.spellingCorrect || 0;
        break;
      case 'grammar':
        modeAttempts = progress.grammarAttempts || 0;
        modeCorrect = progress.grammarCorrect || 0;
        break;
    }

    // 🔍 解答直後のPosition計算ログをlocalStorageに保存
    try {
      const answerLog = {
        timestamp: new Date().toISOString(),
        word,
        mode,
        positionBefore,
        positionAfter: position,

        progress: {
          correctCount: progress.correctCount,
          incorrectCount: progress.incorrectCount,
          consecutiveCorrect: progress.consecutiveCorrect || 0,
          consecutiveIncorrect: progress.consecutiveIncorrect || 0,
          accuracy: progress.accuracyRate || 0,
          modeAttempts,
          modeCorrect,
          modeStillLearning,
        },
      };

      const stored = localStorage.getItem('debug_answer_logs');
      const logs = stored ? JSON.parse(stored) : [];
      logs.push(answerLog);
      // 最新20件のみ保持
      if (logs.length > 20) logs.shift();
      if (QuestionScheduler.isVerboseDebug)
        localStorage.setItem('debug_answer_logs', JSON.stringify(logs));
    } catch {
      // localStorage失敗は無視
    }

    if (import.meta.env.DEV) {
      const daysSince = (Date.now() - (progress.lastStudied || Date.now())) / (1000 * 60 * 60 * 24);
      const aiProposals = this.calculateAIEvaluations(progress, position, daysSince);
      this.recordAIEvaluation(word, {
        category: bucket,
        position,
        aiProposals,
        consecutiveCorrect: progress.consecutiveCorrect || 0,
        consecutiveIncorrect: progress.consecutiveIncorrect || 0,
        accuracy: progress.accuracyRate || 0,
        attempts: totalAttempts,
        daysSince,
        timestamp: new Date().toISOString(),
      });
    }

    return position; // ✅ Position（0-100）を返却
  }

  /**
   * 7つのAIからPosition提案を計算（デバッグ用）
   */
  private calculateAIEvaluations(
    progress: WordProgress,
    _position: number,
    daysSinceLastStudy: number
  ): Record<string, number> {
    const totalAttempts = progress.correctCount + progress.incorrectCount;
    const accuracy = totalAttempts > 0 ? progress.correctCount / totalAttempts : 0;
    const consecutiveCorrect = progress.consecutiveCorrect || 0;
    const consecutiveIncorrect = progress.consecutiveIncorrect || 0;

    // 各AIのインスタンス生成
    const memoryAI = new MemoryAI();
    const cognitiveLoadAI = new CognitiveLoadAI();
    const errorPredictionAI = new ErrorPredictionAI();
    const linguisticAI = new LinguisticAI();
    const contextualAI = new ContextualAI();
    const learningStyleAI = new LearningStyleAI();
    const gamificationAI = new GamificationAI();

    return {
      memory: memoryAI.proposePosition(progress, '', daysSinceLastStudy, accuracy, totalAttempts),
      cognitiveLoad: cognitiveLoadAI.proposePosition(progress, consecutiveIncorrect),
      errorPrediction: errorPredictionAI.proposePosition(progress, accuracy, totalAttempts),
      linguistic: linguisticAI.proposePosition(progress, accuracy),
      contextual: contextualAI.proposePosition(progress, daysSinceLastStudy),
      learningStyle: learningStyleAI.proposePosition(progress, accuracy, totalAttempts),
      gamification: gamificationAI.proposePosition(progress, consecutiveCorrect, accuracy),
    };
  }

  /**
   * AI評価をlocalStorageに記録
   */
  private recordAIEvaluation(word: string, evaluation: any): void {
    try {
      const key = 'debug_ai_evaluations';
      const stored = localStorage.getItem(key);
      const evaluations = stored ? JSON.parse(stored) : {};

      // ✅ evaluation オブジェクトに word を追加
      evaluations[word] = { ...evaluation, word };

      // 最新100件のみ保持
      const entries = Object.entries(evaluations);
      if (entries.length > 100) {
        const latest = Object.fromEntries(entries.slice(-100));
        localStorage.setItem(key, JSON.stringify(latest));
      } else {
        localStorage.setItem(key, JSON.stringify(evaluations));
      }

      // コンソールに表示形式で出力
      const aiEvalMap = (evaluation?.aiEvaluations ?? evaluation?.aiProposals ?? {}) as Record<
        string,
        number
      >;
      const aiScores = Object.values(aiEvalMap)
        .map((v) => Number(v).toFixed(1))
        .join('/');
      const finalPriority = Number(evaluation?.finalPriority ?? evaluation?.position ?? 0);
      console.log(
        `🤖 [AI評価] ${word}: ${finalPriority.toFixed(1)}[${aiScores}] (${evaluation?.category ?? 'n/a'})`
      );
    } catch {
      // localStorage失敗は無視
    }
  }

  private determinePosition(
    progress: WordProgress,
    mode: 'memorization' | 'translation' | 'spelling' | 'grammar' = 'memorization'
  ): number {
    return new PositionCalculator(mode).calculate(progress);
  }

  private determinePositionAfterAnswer(
    progress: WordProgress,
    mode: 'memorization' | 'translation' | 'spelling' | 'grammar' = 'memorization'
  ): number {
    return new PositionCalculator(mode).calculate(progress, { ignoreSaved: true });
  }

  /**
   * 🔒 強制装置: position判定時に自動適用
   *
   * まだまだ（still_learning）・分からない（incorrect）の問題は
   * 自動的に高優先度で再出題される
   *
   * この判定はrecalculatePriorityAfterAnswer()で自動的に実行される
   * UI層での追加実装は不要
   */
  private enforceCompletionRequirement(position: number): number {
    // incorrect（分からない 70-100）: 最優先で再出題
    if (position >= 70) {
      return 100;
    }
    // still_learning（まだまだ 40-70）: 高優先度で再出題
    if (position >= 40) {
      return 75;
    }
    // mastered (0-20) / new (20-40): 通常優先度
    return position < 20 ? 10 : 50;
  }

  /**
   * 🎯 難易度別適応学習: 中級・上級の正答率計算
   *
   * 目的: 中級・上級の正答率が悪い場合、初級の習熟を優先させる
   *
   * @param progressCache - プログレスキャッシュ
   * @returns 難易度別の正答率と推奨戦略
   */
  private calculateDifficultyAdaptation(progressCache: any): {
    beginner: number;
    intermediate: number;
    advanced: number;
    shouldPrioritizeBeginner: boolean;
    priorityBoost: number; // 初級への優先度ブースト（0-20）
  } {
    if (!progressCache || !progressCache.wordProgress) {
      return {
        beginner: 70,
        intermediate: 60,
        advanced: 50,
        shouldPrioritizeBeginner: false,
        priorityBoost: 0,
      };
    }

    const wordProgresses = Object.values(progressCache.wordProgress || {}) as any[];

    // 難易度別の正答率計算
    const difficultyStats = {
      beginner: { correct: 0, total: 0 },
      intermediate: { correct: 0, total: 0 },
      advanced: { correct: 0, total: 0 },
    };

    wordProgresses.forEach((wp: any) => {
      const difficultyMap: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {
        初級: 'beginner',
        中級: 'intermediate',
        上級: 'advanced',
      };
      const difficulty = difficultyMap[wp.difficulty as string];

      if (difficulty && difficultyStats[difficulty]) {
        const total = (wp.correctCount || 0) + (wp.incorrectCount || 0);
        difficultyStats[difficulty].total += total;
        difficultyStats[difficulty].correct += wp.correctCount || 0;
      }
    });

    const accuracy = {
      beginner:
        difficultyStats.beginner.total > 0
          ? (difficultyStats.beginner.correct / difficultyStats.beginner.total) * 100
          : 70,
      intermediate:
        difficultyStats.intermediate.total > 0
          ? (difficultyStats.intermediate.correct / difficultyStats.intermediate.total) * 100
          : 60,
      advanced:
        difficultyStats.advanced.total > 0
          ? (difficultyStats.advanced.correct / difficultyStats.advanced.total) * 100
          : 50,
    };

    // 🎯 判定: 中級・上級の正答率が悪い場合、初級を優先
    // 条件: 中級 < 60% OR 上級 < 50%
    const shouldPrioritizeBeginner = accuracy.intermediate < 60 || accuracy.advanced < 50;

    // 優先度ブースト計算: 中級・上級の正答率が低いほど初級のブーストが大きい
    let priorityBoost = 0;
    if (shouldPrioritizeBeginner) {
      const intermediateGap = Math.max(0, 60 - accuracy.intermediate);
      const advancedGap = Math.max(0, 50 - accuracy.advanced);
      priorityBoost = Math.min(20, (intermediateGap + advancedGap) / 2); // 最大20点
    }

    return {
      ...accuracy,
      shouldPrioritizeBeginner,
      priorityBoost,
    };
  }

  /**
   * 🎯 難易度別適応: Position調整
   *
   * 中級・上級の正答率が悪い場合:
   * - 初級の問題: Position を下げる（優先度UP）
   * - 中級・上級: Position を少し上げる（優先度DOWN、ただし完全に避けない）
   *
   * @param position - 元のPosition
   * @param question - 問題
   * @param adaptation - 難易度適応情報
   * @returns 調整後のPosition
   */
  private applyDifficultyAdaptation(
    position: number,
    question: Question,
    adaptation: ReturnType<typeof this.calculateDifficultyAdaptation>
  ): number {
    if (!adaptation.shouldPrioritizeBeginner) {
      return position; // 適応不要
    }

    const difficultyMap: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {
      初級: 'beginner',
      中級: 'intermediate',
      上級: 'advanced',
    };
    const difficulty = difficultyMap[question.difficulty];

    if (!difficulty) {
      return position; // 難易度情報なし
    }

    // 🎯 初級を優先: Position を下げる（優先度UP）
    if (difficulty === 'beginner') {
      return Math.max(0, position - adaptation.priorityBoost);
    }

    // ⚠️ 中級・上級を少し抑える: Position を上げる（優先度DOWN）
    // ただし完全に避けるわけではない（最大+10点）
    if (difficulty === 'intermediate' || difficulty === 'advanced') {
      return Math.min(100, position + Math.min(10, adaptation.priorityBoost / 2));
    }

    return position;
  }

  /**
   * 🆕 新規語優先モード - 新規語を主体に、分からない語を15-30%混合
   *
   * 学習戦略:
   * - 新規語を最優先で出題（70-85%）
   * - 分からない語を15-30%混合（定着確認・攻略用）
   * - まだまだ語は後半で復習
   *
   * インターリーブパターン:
   * [新規3-5語] → [分からない1語] → [新規3-5語] → [分からない1語] → ...
   */
  private sortByNewWordsFirst(
    sorted: PrioritizedQuestion[],
    _params: ScheduleParams,
    _context: ScheduleContext
  ): PrioritizedQuestion[] {
    // 🎲 Fisher-Yates シャッフル（同一Position内でABC順を防ぐ）
    const shuffle = <T>(array: T[]): T[] => {
      const result = [...array];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    };

    // 1. グループ分け + シャッフル（各グループ内でランダム化）
    const newWords = shuffle(sorted.filter((pq) => (pq.attempts ?? 0) === 0 && pq.position >= 20));
    const incorrect = shuffle(sorted.filter((pq) => pq.position >= 70));
    const stillLearning = shuffle(
      sorted.filter((pq) => pq.position >= 40 && pq.position < 70 && (pq.attempts ?? 0) > 0)
    );
    const mastered = shuffle(sorted.filter((pq) => pq.position < 20));

    if (QuestionScheduler.isVerboseDebug) {
      console.log('🆕 [新規語優先モード] グループ分け:', {
        newWords: newWords.length,
        incorrect: incorrect.length,
        stillLearning: stillLearning.length,
        mastered: mastered.length,
      });
    }

    // 2. 比率計算: 全体のうち15-30%を分からない語に
    const totalCount = sorted.length;
    const incorrectRatio = Math.random() * 0.15 + 0.15; // 15-30%
    const incorrectTarget = Math.floor(totalCount * incorrectRatio);
    const incorrectToMix = incorrect.slice(0, incorrectTarget);
    const remainingIncorrect = incorrect.slice(incorrectTarget);

    if (QuestionScheduler.isVerboseDebug) {
      console.log('🎯 [新規語優先モード] 分からない語の混合比率:', {
        ratio: `${(incorrectRatio * 100).toFixed(1)}%`,
        target: incorrectTarget,
        toMix: incorrectToMix.length,
        remaining: remainingIncorrect.length,
      });
    }

    // 3. インターリーブ: [新規3-5語, 分からない1語] のパターン
    const result: PrioritizedQuestion[] = [];
    const newWordsQueue = [...newWords];
    const incorrectQueue = [...incorrectToMix];

    while (newWordsQueue.length > 0 || incorrectQueue.length > 0) {
      // 新規語を3-5語追加
      const newBatchSize = Math.floor(Math.random() * 3) + 3; // 3-5
      for (let i = 0; i < newBatchSize && newWordsQueue.length > 0; i++) {
        result.push(newWordsQueue.shift()!);
      }

      // 分からない語を1語追加
      if (incorrectQueue.length > 0) {
        result.push(incorrectQueue.shift()!);
      }
    }

    // 4. 残りを追加（Position降順を維持）
    result.push(...remainingIncorrect);
    result.push(...stillLearning);
    result.push(...mastered);

    if (QuestionScheduler.isVerboseDebug) {
      const top10 = result.slice(0, 10).map((pq) => ({
        word: pq.question.word,
        position: pq.position,
        attempts: pq.attempts ?? 0,
        type:
          (pq.attempts ?? 0) === 0 && pq.position >= 20
            ? '新規'
            : pq.position >= 70
              ? '分からない'
              : pq.position >= 40
                ? 'まだまだ'
                : '定着済',
      }));
      console.log('🎯 [新規語優先モード] TOP10:', top10);
    }

    return result;
  }

  /**
   * カテゴリーベーススロットシステム
   *
   * 仕様:
   * 1. 全問をカテゴリ別に分類（incorrect/still_learning/new/mastered）
   * 2. カテゴリごとにスロット数を決定
   * 3. 各カテゴリ内でPosition降順にソート
   * 4. いもづる式学習: スロット内で関連語を近くに配置
   * 5. スロット数分だけ取り出して結合
   */
  private async scheduleCategorySlots(
    params: ScheduleParams,
    startTime: number
  ): Promise<ScheduleResult> {
    const progressMap = QuestionScheduler.getProgressMapFromParams(params);
    const calculator = new PositionCalculator(
      params.mode as 'memorization' | 'translation' | 'spelling' | 'grammar'
    );

    // 0. 振動防止: 直近10語のSetを作成（優先順位を下げる）
    const recentWords = this.getRecentWords(params.mode as any, 10);
    const recentSet = new Set(recentWords);

    if (import.meta.env.DEV && recentWords.length > 0) {
      logger.info('[QuestionScheduler] 振動防止（DTA）', {
        recentWords: recentWords.length,
        words: recentWords,
      });
      console.log('🚫 [振動防止] 直近10語（Position -30ペナルティ）:');
      recentWords.forEach((w, i) => {
        console.log(`  ${i + 1}. ${w}`);
      });
    }

    // 1. 全問にPositionを計算（直近語はPosition -30ペナルティ）
    type Classified = {
      question: Question;
      position: number;
      category: 'incorrect' | 'still_learning' | 'new' | 'mastered';
    };

    const minPositionForCategory = (category: Classified['category']): number => {
      switch (category) {
        case 'incorrect':
          return 70;
        case 'still_learning':
          return 40;
        case 'new':
          return 20;
        case 'mastered':
          return 0;
        default:
          return 0;
      }
    };

    const classified: Classified[] = params.questions.map((q) => {
      const wp = progressMap[q.word];
      const basePosition = wp ? calculator.calculate(wp) : 35; // 未学習は new の標準値
      const category = PositionCalculator.categoryOf(basePosition);

      let position = basePosition;
      // 振動防止: 直近10語はPosition -30（優先順位を下げる）
      // 重要: カテゴリ境界を跨いで「incorrect→still_learning」等にならないよう、カテゴリ帯の最低値でクランプする
      if (recentSet.has(q.word)) {
        position = Math.max(minPositionForCategory(category), basePosition - 30);
      }

      return { question: q, position, category };
    });

    // 2. カテゴリ別に分類
    const byCategory: Record<string, Classified[]> = {
      incorrect: classified.filter((c) => {
        const cat = c.category;
        return cat === 'incorrect';
      }),
      still_learning: classified.filter((c) => {
        const cat = c.category;
        return cat === 'still_learning';
      }),
      new: classified.filter((c) => {
        const cat = c.category;
        return cat === 'new';
      }),
      mastered: classified.filter((c) => {
        const cat = c.category;
        return cat === 'mastered';
      }),
    };

    // 3. 各カテゴリ内でPosition降順ソート
    Object.keys(byCategory).forEach((cat) => {
      byCategory[cat].sort((a, b) => b.position - a.position);
    });

    // 4. スロット割当（🆕 バッチサイズ設定対応）
    // - バッチサイズ設定がある場合: その値を使用
    // - 設定なしの場合: 従来通り最大100語
    const totalSlots = params.batchSize
      ? Math.min(params.questions.length, params.batchSize)
      : Math.min(params.questions.length, 100);

    const incorrectCount = byCategory.incorrect.length;
    const stillCount = byCategory.still_learning.length;
    const newCount = byCategory.new.length;
    const masteredCount = byCategory.mastered.length;

    // 4.5 スロット配分（SSOT: SlotConfigManager）
    // 要求仕様（暗記）:
    // - 分からない（要復習）: 20%
    // - まだまだ（学習中）: 20%
    // - 覚えてる（定着済）: 10%
    // - 未出題: 残り
    const slotConfig = new SlotConfigManager({ debugMode: import.meta.env.DEV }).getSlotConfig(
      params.mode as 'memorization' | 'translation' | 'spelling' | 'grammar'
    );

    const slots = {
      incorrect: Math.min(incorrectCount, Math.floor(totalSlots * slotConfig.incorrectRatio)),
      still_learning: Math.min(stillCount, Math.floor(totalSlots * slotConfig.stillLearningRatio)),
      mastered: Math.min(masteredCount, Math.floor(totalSlots * slotConfig.masteredRatio)),
      new: 0,
    };

    // 未出題は「残り」を基本とする
    let remaining = totalSlots - (slots.incorrect + slots.still_learning + slots.mastered);
    if (remaining < 0) remaining = 0;
    slots.new = Math.min(newCount, remaining);
    remaining -= slots.new;

    // それでも余る場合（例: 未出題が不足）には、在庫があるカテゴリに再配分
    if (remaining > 0) {
      const addTo = (key: 'incorrect' | 'still_learning' | 'mastered' | 'new', available: number) => {
        if (remaining <= 0) return;
        const canAdd = Math.max(0, available - slots[key]);
        if (canAdd <= 0) return;
        const toAdd = Math.min(remaining, canAdd);
        slots[key] += toAdd;
        remaining -= toAdd;
      };

      // 既存の学習設計に合わせ、復習系を優先して埋める
      addTo('incorrect', incorrectCount);
      addTo('still_learning', stillCount);
      addTo('mastered', masteredCount);
      addTo('new', newCount);
    }

    // 5. いもづる式学習: カテゴリ内で関連語を近くに配置
    const applyChainLearning = (items: Classified[]): Classified[] => {
      if (!params.useChainLearning || items.length <= 2) return items;

      const lookup = getStrengthLookupForScheduling(params.questions);
      const getStrength = (a: string, b: string): number => {
        const s1 = lookup.get(a)?.get(b) ?? 0;
        const s2 = lookup.get(b)?.get(a) ?? 0;
        return Math.max(s1, s2);
      };

      // Position帯（10刻み）ごとに分割して、帯内で関連語を近くに
      const buckets = new Map<number, Classified[]>();
      items.forEach((item) => {
        const bucket = Math.floor(item.position / 10);
        if (!buckets.has(bucket)) buckets.set(bucket, []);
        buckets.get(bucket)!.push(item);
      });

      const reordered: Classified[] = [];
      buckets.forEach((band) => {
        if (band.length <= 1) {
          reordered.push(...band);
          return;
        }

        // 貪欲法: 最初の語から、関連度が高い順に次を選ぶ
        const remaining = [...band];
        const selected: Classified[] = [remaining.shift()!];

        while (remaining.length > 0) {
          const last = selected[selected.length - 1];
          let bestIdx = 0;
          let bestStrength = getStrength(last.question.word, remaining[0].question.word);

          for (let i = 1; i < remaining.length; i++) {
            const strength = getStrength(last.question.word, remaining[i].question.word);
            if (strength > bestStrength) {
              bestStrength = strength;
              bestIdx = i;
            }
          }

          selected.push(remaining[bestIdx]);
          remaining.splice(bestIdx, 1);
        }

        reordered.push(...selected);
      });

      return reordered;
    };

    // 6. 各スロット内でPosition降順ソート＋いもづる式学習
    // 📌 重複排除: 各カテゴリ内で同じ語が重複しないよう、word でユニーク化
    const dedupeByWord = (items: Classified[]): Classified[] => {
      const seen = new Set<string>();
      return items.filter((item) => {
        if (seen.has(item.question.word)) return false;
        seen.add(item.question.word);
        return true;
      });
    };

    const processedSlots: Record<string, Classified[]> = {
      incorrect: applyChainLearning(
        dedupeByWord(
          byCategory.incorrect.slice(0, slots.incorrect).sort((a, b) => b.position - a.position)
        )
      ),
      still_learning: applyChainLearning(
        dedupeByWord(
          byCategory.still_learning
            .slice(0, slots.still_learning)
            .sort((a, b) => b.position - a.position)
        )
      ),
      new: applyChainLearning(
        dedupeByWord(byCategory.new.slice(0, slots.new).sort((a, b) => b.position - a.position))
      ),
      mastered: applyChainLearning(
        dedupeByWord(
          byCategory.mastered.slice(0, slots.mastered).sort((a, b) => b.position - a.position)
        )
      ),
    };

    // 7. スロット間をGamificationで交互配置（incorrect連続を防ぐ）
    // 🛡️ 実行時検証: still_learning語がPosition 60-69範囲内か
    if (import.meta.env.DEV) {
      const stillLearning = processedSlots.still_learning || [];
      const violations = stillLearning.filter((c) => c.position < 40 || c.position >= 70);
      if (violations.length > 0) {
        console.error('🚨 Position階層違反（まだまだ語）:', violations);
        logger.error('[QuestionScheduler] Position階層違反', {
          violationCount: violations.length,
          violations: violations.map((v) => ({
            word: v.question.word,
            position: v.position,
            category: v.category,
          })),
        });
        // DEVモードでは例外をthrow（問題を早期検知）
        throw new Error(`Position階層違反: まだまだ語が40-69範囲外（${violations.length}語）`);
      }
    }

    type PQ = { position: number; attempts?: number; question: Question };
    const allWithCategory: PQ[] = [
      ...processedSlots.incorrect.map((c) => ({
        position: c.position,
        attempts: (progressMap[c.question.word]?.memorizationAttempts ?? 0) > 0 ? 1 : 0,
        question: c.question,
      })),
      ...processedSlots.still_learning.map((c) => ({
        position: c.position,
        attempts: (progressMap[c.question.word]?.memorizationAttempts ?? 0) > 0 ? 1 : 0,
        question: c.question,
      })),
      ...processedSlots.new.map((c) => ({
        position: c.position,
        attempts: 0,
        question: c.question,
      })),
      ...processedSlots.mastered.map((c) => ({
        position: c.position,
        attempts: (progressMap[c.question.word]?.memorizationAttempts ?? 0) > 0 ? 1 : 0,
        question: c.question,
      })),
    ];

    const gamificationAI = new GamificationAI();
    const interleaved = gamificationAI.interleaveByCategory(allWithCategory);

    // 📌 バッチ全体で重複排除（念のため最終確認）
    const seen = new Set<string>();
    const result = interleaved
      .map((pq) => pq.question)
      .filter((q) => {
        if (seen.has(q.word)) {
          if (import.meta.env.DEV) {
            console.warn(`⚠️ [重複検出] ${q.word} がバッチ内で2回目の出題 → 除外`);
          }
          return false;
        }
        seen.add(q.word);
        return true;
      });

    // 📊 デバッグ用統計
    const stats = {
      total: result.length,
      incorrect: slots.incorrect,
      still_learning: slots.still_learning,
      new: slots.new,
      mastered: slots.mastered,
      chainLearning: params.useChainLearning || false,
      interleavedByCategory: true,
      duplicatesRemoved: interleaved.length - result.length,
    };

    const processingTime = performance.now() - startTime;

    if (import.meta.env.DEV) {
      logger.info('[QuestionScheduler] カテゴリースロット方式', {
        allocated: result.length,
        processingTime: `${processingTime.toFixed(2)}ms`,
        stats,
      });

      // 🔍 出題順序を明示的にログ出力（振動検出用）
      console.log('📝 [出題順序] 先頭30問:');
      result.slice(0, 30).forEach((q, i) => {
        const c = classified.find((x) => x.question.word === q.word);
        const wasRecent = recentSet.has(q.word);
        console.log(
          `  ${(i + 1).toString().padStart(2)}. ${q.word.padEnd(20)} | Pos: ${c?.position.toFixed(0).padStart(3)} | Cat: ${c?.category.padEnd(15)} ${wasRecent ? '⚠️ 直近' : ''}`
        );
      });

      const top30 = result.slice(0, 30).map((q, i) => {
        const c = classified.find((x) => x.question.word === q.word);
        return {
          rank: i + 1,
          word: q.word,
          category: c?.category,
          position: c?.position,
          wasRecent: recentSet.has(q.word),
        };
      });
      // 出題回数マップ（デバッグパネルで表示用）
      const top30AttemptsMap: Record<string, number> = {};
      result.slice(0, 30).forEach((q) => {
        const wp = progressMap[q.word];
        if (wp) {
          const mode = params.mode;
          const attempts =
            mode === 'memorization'
              ? wp.memorizationAttempts || 0
              : mode === 'translation'
                ? wp.translationAttempts || 0
                : mode === 'spelling'
                  ? wp.spellingAttempts || 0
                  : wp.grammarAttempts || 0;
          top30AttemptsMap[q.word] = attempts;
        }
      });
      writeDebugJSON(
        'debug_categorySlots_output',
        { timestamp: new Date().toISOString(), mode: params.mode, stats, top30, top30AttemptsMap },
        { mode: params.mode }
      );
    }

    // 🚨 強制検証: バッチ内で連続する同一単語を検出（振動の原因）
    if (import.meta.env.DEV) {
      for (let i = 0; i < result.length - 1; i++) {
        if (result[i].word === result[i + 1].word) {
          const errorMsg = `🚨🚨🚨 [致命的エラー] バッチ内で連続重複を検出: "${result[i].word}" が位置${i}と${i + 1}で連続出題！`;
          console.error(errorMsg);
          logger.error('[QuestionScheduler] バッチ内連続重複検出', {
            word: result[i].word,
            position1: i,
            position2: i + 1,
            batchSize: result.length,
            mode: params.mode,
          });
          // DEVモードでは例外をthrow（即座に問題を検知）
          throw new Error(errorMsg);
        }
      }

      // 念のため全体の重複チェックも実施
      const allWords = result.map((q) => q.word);
      const uniqueWords = new Set(allWords);
      if (allWords.length !== uniqueWords.size) {
        const duplicates = allWords.filter((word, index) => allWords.indexOf(word) !== index);
        const errorMsg = `🚨 [警告] バッチ内に重複語あり（非連続）: ${[...new Set(duplicates)].join(', ')}`;
        console.error(errorMsg);
        logger.error('[QuestionScheduler] バッチ内重複検出（非連続）', {
          duplicates: [...new Set(duplicates)],
          batchSize: result.length,
          uniqueSize: uniqueWords.size,
          mode: params.mode,
        });
      } else {
        console.log(`✅ [検証成功] バッチ内に重複なし（${result.length}問、全ユニーク）`);
      }
    }

    return {
      scheduledQuestions: result,
      vibrationScore: 0,
      processingTime,
      signalCount: 0,
    };
  }

  /**
   * 直近出題語を取得
   */
  private getRecentWords(
    mode: 'memorization' | 'translation' | 'spelling' | 'grammar',
    count: number = 10
  ): string[] {
    const recentAnswers = this.getRecentAnswers(mode);
    const words: string[] = [];
    const seen = new Set<string>();
    for (const a of recentAnswers) {
      if (seen.has(a.word)) continue;
      seen.add(a.word);
      words.push(a.word);
      if (words.length >= count) break;
    }
    return words;
  }
}
