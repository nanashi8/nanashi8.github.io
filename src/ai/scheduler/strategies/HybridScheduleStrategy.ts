/**
 * HybridScheduleStrategy - ハイブリッドモードのスケジューリング戦略
 *
 * 既存AIの順序を尊重しながら、Position計算とDTAを適用する戦略
 *
 * 【特徴】
 * - 既存のAI優先度を保持
 * - Position分散を有効化（hybridMode=false設定）
 * - 復習単語（incorrect/still_learning）を確実に上位配置
 *
 * 【使用例】
 * ```typescript
 * const strategy = new HybridScheduleStrategy(dependencies);
 * const result = await strategy.schedule(context);
 * ```
 */

import type { ScheduleResult, PrioritizedQuestion as PQ } from '../types';
import type { ScheduleContext } from './ScheduleStrategy';
import { BaseScheduleStrategy } from './ScheduleStrategy';
import { logger } from '@/utils/logger';

export class HybridScheduleStrategy extends BaseScheduleStrategy {
  /**
   * ハイブリッドモードでスケジューリング
   *
   * @param context - スケジューリングコンテキスト
   * @returns スケジューリング結果
   */
  async schedule(context: ScheduleContext): Promise<ScheduleResult> {
    const { params, startTime, dependencies } = context;
    const scheduler = dependencies.scheduler; // QuestionScheduler（Context）

    this.log('ハイブリッドモード開始', {
      questionCount: params.questions.length,
      mode: params.mode,
    });

    // 1. コンテキスト構築
    const scheduleContext = scheduler.buildContext(params);

    // 2. シグナル検出
    const signals = scheduler.detectSignals(scheduleContext);

    // 3. 優先度計算（hybridMode=false でPosition分散を有効化）
    const prioritized: PQ[] = scheduler.calculatePriorities(
      params.questions,
      scheduleContext,
      signals,
      false // hybridMode=false → Position分散有効
    );

    // 4. 振動防止フィルター適用
    const filtered: PQ[] = scheduler.applyAntiVibration(prioritized, scheduleContext);

    // 5. ソート・バランス調整
    const sorted: PQ[] = scheduler.sortAndBalance(filtered, params, scheduleContext);

    // 6. 後処理
    const questions = scheduler.postProcess(sorted, scheduleContext);

    // 7. 振動スコア計算
    const vibrationScore = dependencies.antiVibration.calculateVibrationScore(
      sorted,
      scheduleContext.recentAnswers,
      20
    );

    // 8. デバッグ情報
    const incorrectQuestions = sorted.filter((pq: PQ) => pq.position >= 70);
    const stillLearningQuestions = sorted.filter(
      (pq: PQ) => pq.position >= 40 && pq.position < 70
    );
    const reviewNeeded = incorrectQuestions.length + stillLearningQuestions.length;
    const totalQuestions = sorted.length;

    logger.info('[HybridScheduleStrategy] 優先単語配置完了', {
      incorrectWords: incorrectQuestions.slice(0, 5).map((pq: PQ) => pq.question.word),
      stillLearningWords: stillLearningQuestions.slice(0, 5).map((pq: PQ) => pq.question.word),
      incorrectCount: incorrectQuestions.length,
      stillLearningCount: stillLearningQuestions.length,
      otherCount: totalQuestions - reviewNeeded,
      reviewRatio:
        totalQuestions > 0 ? `${((reviewNeeded / totalQuestions) * 100).toFixed(0)}%` : '0%',
      top5: sorted.slice(0, 5).map((pq: PQ) => `${pq.question.word}(${pq.status?.category})`),
    });

    const processingTime = performance.now() - startTime;

    logger.info(`[HybridScheduleStrategy] スケジューリング完了`, {
      processingTime: Math.round(processingTime) + 'ms',
      vibrationScore,
      incorrectCount: incorrectQuestions.length,
      stillLearningCount: stillLearningQuestions.length,
      totalCount: questions.length,
    });

    return this.buildResult(sorted, {
      source: 'HybridScheduleStrategy',
      elapsed: processingTime,
      vibrationScore,
      signalCount: signals.length,
    });
  }
}
