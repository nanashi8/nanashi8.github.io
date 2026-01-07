/**
 * DefaultScheduleStrategy - デフォルトスケジューリング戦略
 *
 * 標準的なスケジューリングロジック
 *
 * 【特徴】
 * - DTA（Time-Dependent Adjustment）による優先度調整
 * - Position計算とカテゴリー分類
 * - 振動防止フィルター適用
 * - GamificationAIによる新規語・まだまだ語のブースト
 *
 * 【使用例】
 * ```typescript
 * const strategy = new DefaultScheduleStrategy(dependencies);
 * const result = await strategy.schedule(context);
 * ```
 */

import type { ScheduleResult, PrioritizedQuestion as PQ } from '../types';
import type { Question } from '@/types';
import type { ScheduleContext } from './ScheduleStrategy';
import { BaseScheduleStrategy } from './ScheduleStrategy';
import { logger } from '@/utils/logger';
import { writeDebugJSON } from '@/utils/debugStorage';

export class DefaultScheduleStrategy extends BaseScheduleStrategy {
  /**
   * デフォルトモードでスケジューリング
   *
   * @param context - スケジューリングコンテキスト
   * @returns スケジューリング結果
   */
  async schedule(context: ScheduleContext): Promise<ScheduleResult> {
    const { params, startTime, dependencies } = context;
    const scheduler = dependencies.scheduler; // QuestionScheduler（Context）

    this.log('デフォルトモード開始', {
      questionCount: params.questions.length,
      mode: params.mode,
    });

    // 1. コンテキスト構築
    const scheduleContext = scheduler.buildContext(params);

    // 2. シグナル検出
    const signals = scheduler.detectSignals(scheduleContext);

    // 3. 優先度計算（DTA統合 + Position分散）
    const prioritized: PQ[] = scheduler.calculatePriorities(
      params.questions,
      scheduleContext,
      signals,
      false // hybridMode=false
    );

    // 4. 振動防止フィルター適用
    const filtered: PQ[] = scheduler.applyAntiVibration(prioritized, scheduleContext);

    // 5. ソート・バランス調整
    const sorted: PQ[] = scheduler.sortAndBalance(filtered, params, scheduleContext);

    // 6. 後処理（いもづる式学習など）
    const questions: Question[] = scheduler.postProcess(sorted, scheduleContext);

    // 7. デバッグ情報保存
    try {
      const top30 = questions.slice(0, 30).map((q: Question, _idx: number) => {
        const pq = sorted.find((pq: PQ) => pq.question.word === q.word);
        return {
          word: q.word,
          position: pq?.position || 0,
          category: pq?.status?.category,
          attempts: pq?.status?.attempts || 0,
        };
      });

      const payload = {
        timestamp: new Date().toISOString(),
        mode: scheduleContext.mode,
        source: 'DefaultScheduleStrategy',
        top30,
      };

      writeDebugJSON('debug_postProcess_output', payload, { mode: scheduleContext.mode });
    } catch {
      // localStorage失敗は無視
    }

    // 8. 振動スコア計算
    const vibrationScore = dependencies.antiVibration.calculateVibrationScore(
      sorted,
      scheduleContext.recentAnswers,
      20
    );

    // 9. 順序整合性検証
    const sortedTop10Positions = sorted.slice(0, 10).map((pq: PQ) => pq.position);
    const questionsTop10Positions = questions
      .slice(0, 10)
      .map((q: Question) => sorted.find((pq: PQ) => pq.question.word === q.word)?.position ?? 0);

    const orderMismatch = !sortedTop10Positions.every(
      (pos, idx) => pos === questionsTop10Positions[idx]
    );

    if (orderMismatch && import.meta.env.DEV) {
      console.error(
        '🚨 [DefaultScheduleStrategy] CRITICAL: postProcess()がsortAndBalance()の順序を破壊しました！',
        {
          sortedTop10: sorted
            .slice(0, 10)
            .map((pq: PQ) => ({ word: pq.question.word, pos: pq.position })),
          questionsTop10: questions.slice(0, 10).map((q: Question) => ({
            word: q.word,
            pos: sorted.find((pq: PQ) => pq.question.word === q.word)?.position ?? 0,
          })),
        }
      );
    }

    const processingTime = performance.now() - startTime;

    const resultDebug = {
      top10Words: questions.slice(0, 10).map((q: Question) => q.word),
      top10Positions: sorted
        .slice(0, 10)
        .map((pq: PQ) => ({ word: pq.question.word, position: pq.position })),
      orderMismatch,
    };

    logger.info(`[DefaultScheduleStrategy] スケジューリング完了`, {
      processingTime: Math.round(processingTime) + 'ms',
      vibrationScore,
      signalCount: signals.length,
      resultDebug,
    });

    // 10. デバッグ情報をlocalStorageに保存
    try {
      const existing = JSON.parse(localStorage.getItem('debug_scheduler_results') || '[]');
      existing.push({
        timestamp: new Date().toISOString(),
        ...resultDebug,
      });
      if (existing.length > 10) existing.shift();
      localStorage.setItem('debug_scheduler_results', JSON.stringify(existing));
    } catch {
      // ignore
    }

    return this.buildResult(sorted, {
      source: 'DefaultScheduleStrategy',
      elapsed: processingTime,
      vibrationScore,
      signalCount: signals.length,
    });
  }
}
