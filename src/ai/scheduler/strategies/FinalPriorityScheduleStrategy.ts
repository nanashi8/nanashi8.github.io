/**
 * FinalPriorityScheduleStrategy - FinalPriorityモードのスケジューリング戦略
 *
 * AICoordinatorのfinalPriorityを主軸にしたスケジューリング戦略（variant=C）
 *
 * 【特徴】
 * - AICoordinatorの7AI統合評価（finalPriority）を主因として使用
 * - Position計算は補助的に使用
 * - GamificationAIによる「まだまだ語」のブースト
 * - 新規語のインターリーブで「分からない連打で新規が一切出ない」を回避
 *
 * 【使用例】
 * ```typescript
 * const strategy = new FinalPriorityScheduleStrategy(dependencies);
 * const result = await strategy.schedule(context);
 * ```
 */

import type { ScheduleResult, PrioritizedQuestion as PQ, WordStatus } from '../types';
import type { ScheduleContext } from './ScheduleStrategy';
import { BaseScheduleStrategy } from './ScheduleStrategy';
import { logger } from '@/utils/logger';
import { PositionCalculator } from '../PositionCalculator';
import { positionToCategory } from '@/ai/utils/categoryDetermination';
import { writeDebugJSON } from '@/utils/debugStorage';
import { DebugTracer } from '@/utils/DebugTracer';
import { GamificationAI } from '@/ai/specialists/GamificationAI';

export class FinalPriorityScheduleStrategy extends BaseScheduleStrategy {
  /**
   * FinalPriorityモードでスケジューリング
   *
   * @param context - スケジューリングコンテキスト
   * @returns スケジューリング結果
   */
  async schedule(context: ScheduleContext): Promise<ScheduleResult> {
    const { params, startTime, dependencies } = context;
    const scheduler = dependencies.scheduler; // QuestionScheduler（Context）

    this.log('FinalPriorityモード開始', {
      questionCount: params.questions.length,
      mode: params.mode,
    });

    // 1. コンテキスト構築
    const scheduleContext = scheduler.buildContext(params);

    // 2. シグナル検出
    const signals = scheduler.detectSignals(scheduleContext);

    // 3. 進捗データ取得
    const progressCache = scheduler.loadProgressCache();
    const allProgress: Record<string, any> = (progressCache?.wordProgress ?? {}) as Record<
      string,
      any
    >;

    // 4. AICoordinator用のセッション統計構築
    const currentTab: 'memorization' | 'grammar' | 'comprehensive' =
      params.mode === 'grammar'
        ? 'grammar'
        : params.mode === 'memorization'
          ? 'memorization'
          : 'comprehensive';

    const totalAttempts =
      (params.sessionStats.correct || 0) +
      (params.sessionStats.incorrect || 0) +
      (params.sessionStats.still_learning || 0) +
      (params.sessionStats.mastered || 0);

    // 学習段階の分布計算
    let masteredCount = 0;
    let stillLearningCount = 0;
    let incorrectCount = 0;
    let newCount = 0;
    for (const wp of Object.values(allProgress)) {
      const calculator = new PositionCalculator(
        params.mode as 'memorization' | 'translation' | 'spelling' | 'grammar'
      );
      const pos = calculator.calculate(wp);
      if (pos >= 70) incorrectCount++;
      else if (pos >= 40) stillLearningCount++;
      else if (pos >= 20) newCount++;
      else masteredCount++;
    }

    const aiSessionStats = {
      totalAttempts,
      correctAnswers: params.sessionStats.correct || 0,
      incorrectAnswers: params.sessionStats.incorrect || 0,
      stillLearningAnswers: params.sessionStats.still_learning || 0,
      sessionStartTime: scheduleContext.sessionStartTime,
      sessionDuration: (params.sessionStats.duration || 0) as number,
      consecutiveIncorrect: 0,
      masteredCount,
      stillLearningCount,
      incorrectCount,
      newCount,
      consecutiveCorrect: params.sessionStats.consecutiveCorrect || 0,
    };

    // 5. AICoordinatorチェック
    if (!dependencies.aiCoordinator) {
      this.logError('AICoordinatorが未初期化、ハイブリッドモードにフォールバック');
      // HybridScheduleStrategyにフォールバック
      const HybridScheduleStrategy = await import('./HybridScheduleStrategy').then(
        (m) => m.HybridScheduleStrategy
      );
      const hybrid = new HybridScheduleStrategy(dependencies);
      return hybrid.schedule(context);
    }

    // 6. デバッグトレース開始
    let beforeAISpanId: string | undefined;
    if (import.meta.env.DEV) {
      const weakWordsInInput = params.questions.filter((q) => {
        const wp = allProgress[q.word] ?? scheduleContext.wordProgress[q.word] ?? null;
        if (!wp) return false;
        const attempts = wp.memorizationAttempts ?? wp.totalAttempts ?? 0;
        if (attempts <= 0) return false;
        const calculator = new PositionCalculator(
          params.mode as 'memorization' | 'translation' | 'spelling' | 'grammar'
        );
        const pos = calculator.calculate(wp);
        return pos >= 40;
      });

      beforeAISpanId = DebugTracer.startSpan('FinalPriorityScheduleStrategy.beforeAI', {
        weakWordsCount: weakWordsInInput.length,
        totalCount: params.questions.length,
        weakWords: weakWordsInInput.map((q) => q.word),
      });
    }

    // 7. 各問題にAICoordinatorのfinalPriorityを取得
    const prioritized: PQ[] = [];
    for (const question of params.questions) {
      const wordProgress =
        allProgress[question.word] ?? scheduleContext.wordProgress[question.word] ?? null;

      const cachedStatus = scheduler.getWordStatusFromCache(
        question.word,
        scheduleContext.mode,
        progressCache
      );

      // Position決定
      const position =
        cachedStatus?.position ??
        new PositionCalculator(
          params.mode as 'memorization' | 'translation' | 'spelling' | 'grammar'
        ).calculate(wordProgress);

      // モード別attempts取得
      let fallbackAttempts = 0;
      let fallbackCorrect = 0;
      if (wordProgress) {
        switch (params.mode) {
          case 'memorization':
            fallbackAttempts = wordProgress.memorizationAttempts || 0;
            fallbackCorrect = wordProgress.memorizationCorrect || 0;
            break;
          case 'translation':
            fallbackAttempts = wordProgress.translationAttempts || 0;
            fallbackCorrect = wordProgress.translationCorrect || 0;
            break;
          case 'spelling':
            fallbackAttempts = wordProgress.spellingAttempts || 0;
            fallbackCorrect = wordProgress.spellingCorrect || 0;
            break;
          case 'grammar':
            fallbackAttempts = wordProgress.grammarAttempts || 0;
            fallbackCorrect = wordProgress.grammarCorrect || 0;
            break;
          default:
            break;
        }
      }

      const status: WordStatus = cachedStatus ?? {
        category: positionToCategory(position),
        position,
        lastStudied: wordProgress?.lastStudied || 0,
        attempts: fallbackAttempts,
        correct: fallbackCorrect,
        streak: wordProgress?.consecutiveCorrect || 0,
        forgettingRisk: 0,
        reviewInterval: 1,
      };

      // AICoordinator分析
      const aiResult = await dependencies.aiCoordinator.analyzeAndCoordinate(
        {
          word: {
            word: question.word,
            meaning: question.meaning,
            reading: question.reading,
            difficulty: question.difficulty,
            category: question.category,
            source: question.source,
            type: question.type,
            isPhraseOnly: question.isPhraseOnly,
          },
          progress: wordProgress,
          sessionStats: aiSessionStats,
          currentTab,
          allProgress,
        },
        position / 100 // basePriority（0-1）
      );

      prioritized.push({
        question,
        position,
        finalPriority: aiResult.finalPriority,
        status,
        attempts: status?.attempts ?? 0,
        timeBoost: 1.0,
      });
    }

    // 8. デバッグトレース終了
    if (import.meta.env.DEV && beforeAISpanId) {
      const weakWordsAfterLoop = prioritized.filter((pq: PQ) => {
        if (!pq.status) return false;
        const attempts = pq.status.attempts ?? 0;
        if (attempts <= 0) return false;
        return pq.position >= 40;
      });
      DebugTracer.endSpan(beforeAISpanId, {
        weakWordsCount: weakWordsAfterLoop.length,
        totalCount: prioritized.length,
        weakWords: weakWordsAfterLoop.map((pq: PQ) => pq.question.word),
      });
    }

    // 9. GamificationAI: まだまだ語をブースト
    const gamificationAI = new GamificationAI();
    const boostedResult = gamificationAI.boostStillLearningQuestions(prioritized);
    const boostedPrioritized = boostedResult.result;

    // まだまだ語のfinalPriorityをブースト（Position 60-69）
    for (const pq of boostedPrioritized) {
      if (pq.position >= 60 && pq.position < 70 && (pq.status?.attempts ?? 0) > 0) {
        pq.finalPriority = (pq.finalPriority ?? 0) + 100.0;
      }
    }

    // 10. 新規混入（Position分散 → インターリーブ）
    const { result: adjustedForNew } =
      gamificationAI.adjustPositionForInterleaving(boostedPrioritized);

    // 11. finalPriority降順ソート
    const sorted = [...adjustedForNew].sort(
      (a: PQ, b: PQ) => (b.finalPriority ?? 0) - (a.finalPriority ?? 0)
    );

    // 12. カテゴリ別インターリーブ
    const interleaved = gamificationAI.interleaveByCategory(sorted);

    // 13. デバッグ情報保存
    try {
      const top30Final = interleaved.slice(0, 30).map((pq: PQ, idx: number) => ({
        rank: idx + 1,
        word: pq.question.word,
        position: pq.position,
        finalPriority: pq.finalPriority ?? 0,
        category: pq.status?.category,
        attempts: pq.status?.attempts ?? 0,
      }));
      writeDebugJSON('debug_finalPriority_output', top30Final, { mode: scheduleContext.mode });

      const statsPayload = {
        currentTab,
        totalQuestions: params.questions.length,
        allProgressCount: Object.keys(allProgress || {}).length,
        aiSessionStats,
        timestamp: new Date().toISOString(),
        mode: scheduleContext.mode,
      };
      writeDebugJSON('debug_finalPriority_sessionStats', statsPayload, {
        mode: scheduleContext.mode,
      });
    } catch {
      // localStorage失敗は無視
    }

    // 14. 後処理
    const questions = scheduler.postProcess(interleaved, scheduleContext);

    // 15. 振動スコア計算
    const vibrationScore = dependencies.antiVibration.calculateVibrationScore(
      interleaved,
      scheduleContext.recentAnswers,
      20
    );

    const processingTime = performance.now() - startTime;

    logger.info(`[FinalPriorityScheduleStrategy] スケジューリング完了`, {
      processingTime: Math.round(processingTime) + 'ms',
      vibrationScore,
      aiEnabled: true,
      totalCount: questions.length,
      top5FinalPriority: interleaved.slice(0, 5).map((pq: PQ) => ({
        word: pq.question.word,
        finalPriority: (pq.finalPriority ?? 0).toFixed(3),
        position: pq.position,
      })),
    });

    return this.buildResult(interleaved, {
      source: 'FinalPriorityScheduleStrategy',
      elapsed: processingTime,
      vibrationScore,
      signalCount: signals.length,
    });
  }
}
