/**
 * Long-Term Memory Strategy
 *
 * 記憶の4段階移行戦略を実装:
 * 1. WORKING_MEMORY（作業記憶）: 数秒～数分
 * 2. SHORT_TERM（短期記憶）: 数分～数日
 * 3. CONSOLIDATING（固定化中）: 数日～数週間
 * 4. LONG_TERM（長期記憶）: 数ヶ月～永続
 *
 * 各段階で適切な復習間隔を設定し、記憶の長期定着を促進
 */

import type { WordProgress } from '@/storage/progress/types';
import type { SM2Result } from './SM2Algorithm';

/**
 * 記憶の段階
 */
export enum MemoryStage {
  /** 作業記憶（数秒～数分） - 初回学習直後 */
  WORKING_MEMORY = 'working',

  /** 短期記憶（数分～数日） - 1日以内に復習が必要 */
  SHORT_TERM = 'short',

  /** 固定化中（数日～数週間） - 長期記憶への移行過程 */
  CONSOLIDATING = 'consolidating',

  /** 長期記憶（数ヶ月～永続） - 完全に定着 */
  LONG_TERM = 'long'
}

/**
 * 記憶段階の判定結果
 */
export interface MemoryStageResult {
  /** 現在の記憶段階 */
  stage: MemoryStage;

  /** 推奨復習間隔（日数）*/
  recommendedIntervals: number[];

  /** 次回復習までの推奨間隔（日数） */
  nextInterval: number;

  /** 段階の説明 */
  description: string;
}

/**
 * 長期記憶移行戦略の実装クラス
 */
export class LongTermMemoryStrategy {
  /** 作業記憶の復習間隔（時間単位を日数に変換） */
  private static readonly WORKING_MEMORY_INTERVALS = [
    1 / 1440,      // 1分後
    10 / 1440,     // 10分後
    1 / 24,        // 1時間後
    0.5            // 12時間後
  ];

  /** 短期記憶の復習間隔（日数） */
  private static readonly SHORT_TERM_INTERVALS = [
    1,   // 1日後
    3,   // 3日後
    7,   // 1週間後
    14   // 2週間後
  ];

  /** 固定化中の復習間隔（日数） */
  private static readonly CONSOLIDATING_INTERVALS = [
    14,  // 2週間後
    30,  // 1ヶ月後
    60,  // 2ヶ月後
    90   // 3ヶ月後
  ];

  /** 長期記憶の復習間隔（日数） */
  private static readonly LONG_TERM_INTERVALS = [
    180, // 6ヶ月後
    365, // 1年後
    730  // 2年後
  ];

  /**
   * 現在の記憶段階を判定
   *
   * 判定基準:
   * - 長期記憶: 30日以上経過 & 連続正解3回以上 & 試行10回以上
   * - 固定化中: 7日以上経過 & 連続正解2回以上
   * - 短期記憶: 1日以上経過 & 正解経験あり
   * - 作業記憶: 初回～1日以内
   *
   * @param progress - 単語の学習履歴
   * @returns 記憶段階
   */
  determineMemoryStage(progress: WordProgress): MemoryStage {
    const daysSinceFirst = this.getDaysSinceFirstAttempt(progress);
    const consecutiveCorrect = progress.consecutiveCorrect || 0;
    const attempts = progress.memorizationAttempts || 0;
    const correct = progress.memorizationCorrect || 0;

    // 長期記憶: 30日以上経過 & 連続正解3回以上 & 試行10回以上
    if (daysSinceFirst >= 30 && consecutiveCorrect >= 3 && attempts >= 10) {
      return MemoryStage.LONG_TERM;
    }

    // 固定化中: 7日以上経過 & 連続正解2回以上 & 正答率70%以上
    const accuracy = attempts > 0 ? correct / attempts : 0;
    if (daysSinceFirst >= 7 && consecutiveCorrect >= 2 && accuracy >= 0.7) {
      return MemoryStage.CONSOLIDATING;
    }

    // 短期記憶: 1日以上経過 & 正解経験あり
    if (daysSinceFirst >= 1 && correct > 0) {
      return MemoryStage.SHORT_TERM;
    }

    // 作業記憶: 初回～1日以内
    return MemoryStage.WORKING_MEMORY;
  }

  /**
   * 初回試行からの経過日数を計算
   *
   * @param progress - 単語の学習履歴
   * @returns 経過日数
   */
  private getDaysSinceFirstAttempt(progress: WordProgress): number {
    const firstAttempt = progress.firstAttempted || Date.now();
    const daysSince = (Date.now() - firstAttempt) / (1000 * 60 * 60 * 24);
    return Math.max(0, daysSince);
  }

  /**
   * 各段階に適した復習間隔（日数）を取得
   *
   * @param stage - 記憶段階
   * @returns 復習間隔の配列（日数）
   */
  getReviewIntervals(stage: MemoryStage): number[] {
    const intervals = {
      [MemoryStage.WORKING_MEMORY]: LongTermMemoryStrategy.WORKING_MEMORY_INTERVALS,
      [MemoryStage.SHORT_TERM]: LongTermMemoryStrategy.SHORT_TERM_INTERVALS,
      [MemoryStage.CONSOLIDATING]: LongTermMemoryStrategy.CONSOLIDATING_INTERVALS,
      [MemoryStage.LONG_TERM]: LongTermMemoryStrategy.LONG_TERM_INTERVALS
    };

    return intervals[stage];
  }

  /**
   * 次回復習までの推奨間隔を計算
   *
   * SM-2の推奨間隔と記憶段階を組み合わせて最適な間隔を決定
   *
   * @param progress - 単語の学習履歴
   * @param sm2Result - SM-2計算結果
   * @returns 次回復習までの推奨間隔（日数）
   */
  calculateNextReviewInterval(
    progress: WordProgress,
    sm2Result: SM2Result
  ): number {
    const stage = this.determineMemoryStage(progress);
    const intervals = this.getReviewIntervals(stage);
    const repetition = sm2Result.repetitions;

    // 記憶段階の推奨間隔（repetition回数に応じて選択）
    const stageInterval = intervals[Math.min(repetition, intervals.length - 1)];

    // SM-2の推奨間隔
    const sm2Interval = sm2Result.nextInterval;

    // 両者の平均を取る（バランス型アプローチ）
    // より保守的な（短い）間隔を重視する場合は、調和平均を使用
    const balancedInterval = (stageInterval + sm2Interval) / 2;

    return Math.max(0.01, balancedInterval); // 最小0.01日（約15分）
  }

  /**
   * 包括的な記憶段階分析
   *
   * @param progress - 単語の学習履歴
   * @param sm2Result - SM-2計算結果（オプション）
   * @returns 詳細な分析結果
   */
  analyzeMemoryStage(
    progress: WordProgress,
    sm2Result?: SM2Result
  ): MemoryStageResult {
    const stage = this.determineMemoryStage(progress);
    const recommendedIntervals = this.getReviewIntervals(stage);

    // 次回復習間隔の計算
    let nextInterval: number;
    if (sm2Result) {
      nextInterval = this.calculateNextReviewInterval(progress, sm2Result);
    } else {
      // SM-2結果がない場合は、記憶段階の最初の間隔を使用
      nextInterval = recommendedIntervals[0];
    }

    // 段階の説明
    const description = this.getStageDescription(stage);

    return {
      stage,
      recommendedIntervals,
      nextInterval,
      description
    };
  }

  /**
   * 記憶段階の説明テキストを取得
   *
   * @param stage - 記憶段階
   * @returns 説明テキスト
   */
  getStageDescription(stage: MemoryStage): string {
    const descriptions = {
      [MemoryStage.WORKING_MEMORY]: '作業記憶 - 初回学習直後、短期間で復習が必要',
      [MemoryStage.SHORT_TERM]: '短期記憶 - 1-2週間で復習が必要、定着には時間がかかる',
      [MemoryStage.CONSOLIDATING]: '固定化中 - 長期記憶への移行過程、月単位での復習が推奨',
      [MemoryStage.LONG_TERM]: '長期記憶 - 完全に定着、半年～年単位での復習で十分'
    };

    return descriptions[stage];
  }

  /**
   * 記憶段階に応じた優先度調整を提案
   *
   * @param stage - 記憶段階
   * @param daysSinceLastReview - 最終復習からの経過日数
   * @returns Position調整値（-20 ~ +20）
   */
  suggestPriorityAdjustment(
    stage: MemoryStage,
    daysSinceLastReview: number
  ): number {
    const intervals = this.getReviewIntervals(stage);
    const expectedInterval = intervals[0]; // 次回復習の推奨間隔

    // 経過日数が推奨間隔を超えている → 優先度UP
    if (daysSinceLastReview > expectedInterval * 1.5) {
      return 20; // 大幅に遅れている
    }
    if (daysSinceLastReview > expectedInterval) {
      return 10; // やや遅れている
    }

    // 経過日数が推奨間隔未満 → 優先度DOWN
    if (daysSinceLastReview < expectedInterval * 0.5) {
      return -10; // まだ早い
    }

    // 適切なタイミング → 調整なし
    return 0;
  }

  /**
   * デバッグ用: 記憶段階の詳細ログ
   *
   * @param progress - 単語の学習履歴
   * @param result - 分析結果
   */
  logAnalysis(progress: WordProgress, result: MemoryStageResult): void {
    if (!import.meta.env?.DEV) return;

    console.log('🧠 [Long-Term Memory] 記憶段階分析');
    console.log(`  単語: ${progress.word}`);
    console.log(`  現在の段階: ${this.getStageLabel(result.stage)}`);
    console.log(`  説明: ${result.description}`);
    console.log(`  次回復習: ${result.nextInterval.toFixed(1)}日後`);
    console.log(`  推奨間隔: ${result.recommendedIntervals.map(d => `${d.toFixed(1)}日`).join(' → ')}`);

    // 進捗情報
    const daysSince = this.getDaysSinceFirstAttempt(progress);
    console.log(`  学習開始から: ${daysSince.toFixed(1)}日`);
    console.log(`  連続正解: ${progress.consecutiveCorrect || 0}回`);
    console.log(`  試行回数: ${progress.memorizationAttempts || 0}回`);
  }

  /**
   * 記憶段階の日本語ラベルを取得
   *
   * @param stage - 記憶段階
   * @returns 日本語ラベル
   */
  private getStageLabel(stage: MemoryStage): string {
    const labels = {
      [MemoryStage.WORKING_MEMORY]: '作業記憶',
      [MemoryStage.SHORT_TERM]: '短期記憶',
      [MemoryStage.CONSOLIDATING]: '固定化中',
      [MemoryStage.LONG_TERM]: '長期記憶'
    };

    return labels[stage];
  }
}
