/**
 * Ebbinghaus Forgetting Curve Model
 *
 * エビングハウスの忘却曲線を実装
 * 記憶の保持率が時間経過とともに指数関数的に減衰することをモデル化
 *
 * 数式: R(t) = e^(-t/S)
 * - R: 記憶保持率（0-1）
 * - t: 経過時間（日数）
 * - S: 記憶強度（1-10）
 *
 * 参考: Hermann Ebbinghaus (1885) "Memory: A Contribution to Experimental Psychology"
 */

import type { WordProgress } from '@/storage/progress/types';

/**
 * 記憶保持率の計算結果
 */
export interface RetentionResult {
  /** 記憶保持率（0-1）*/
  retention: number;

  /** 記憶強度（1-10） */
  memoryStrength: number;

  /** 経過日数 */
  daysSince: number;

  /** 復習推奨レベル */
  reviewUrgency: 'now' | 'soon' | 'scheduled' | 'later';
}

/**
 * Ebbinghaus忘却曲線モデルの実装クラス
 */
export class ForgettingCurveModel {
  /** 目標記憶保持率（デフォルト90%） */
  private static readonly TARGET_RETENTION = 0.9;

  /** 記憶強度の最小値 */
  private static readonly MIN_STRENGTH = 1;

  /** 記憶強度の最大値 */
  private static readonly MAX_STRENGTH = 10;

  /**
   * 記憶保持率の計算
   *
   * エビングハウスの忘却曲線: R(t) = e^(-t/S)
   *
   * @param daysSinceLastReview - 最終復習からの経過日数
   * @param memoryStrength - 記憶強度（1-10、10が最強）
   * @returns 記憶保持率（0-1）
   */
  calculateRetention(
    daysSinceLastReview: number,
    memoryStrength: number
  ): number {
    // 記憶強度を1-10に正規化
    const normalizedStrength = Math.max(
      ForgettingCurveModel.MIN_STRENGTH,
      Math.min(ForgettingCurveModel.MAX_STRENGTH, memoryStrength)
    );

    // 減衰率の計算（記憶強度が高いほど減衰が遅い）
    const decayRate = 1 / normalizedStrength;

    // エビングハウスの公式: e^(-t/S)
    const retention = Math.exp(-daysSinceLastReview * decayRate);

    // 0-1に正規化（念のため）
    return Math.max(0, Math.min(1, retention));
  }

  /**
   * 記憶強度の計算（単語の学習履歴から）
   *
   * 記憶強度の要因:
   * 1. 連続正解回数（高いほど強い）
   * 2. 正答率（高いほど強い）
   * 3. 試行回数（多いほど安定）
   * 4. 定着レベル（mastered > new > still_learning > incorrect）
   *
   * @param progress - 単語の学習履歴
   * @returns 記憶強度（1-10）
   */
  calculateMemoryStrength(progress: WordProgress): number {
    const baseStrength = ForgettingCurveModel.MIN_STRENGTH;

    // 1️⃣ 連続正解ボーナス（最大+4.5）
    const consecutiveBonus = (progress.consecutiveCorrect || 0) * 1.5;

    // 2️⃣ 正答率ボーナス（最大+3.0）
    const attempts = progress.memorizationAttempts || 0;
    const correct = progress.memorizationCorrect || 0;
    const accuracy = attempts > 0 ? correct / attempts : 0;
    const accuracyBonus = accuracy * 3;

    // 3️⃣ 試行回数による安定化ボーナス（最大+2.0）
    // 試行回数が多いほど記憶が安定する
    const stabilityBonus = Math.min(attempts * 0.2, 2);

    // 4️⃣ 「まだまだ」回数によるペナルティ（-0.5 × 回数）
    const stillLearning = progress.memorizationStillLearning || 0;
    const stillLearningPenalty = stillLearning * 0.5;

    // 5️⃣ 連続不正解によるペナルティ（-1.0 × 回数）
    const consecutiveIncorrect = progress.consecutiveIncorrect || 0;
    const incorrectPenalty = consecutiveIncorrect * 1.0;

    // 合計記憶強度の計算
    const totalStrength = baseStrength
      + consecutiveBonus
      + accuracyBonus
      + stabilityBonus
      - stillLearningPenalty
      - incorrectPenalty;

    // 1-10に正規化
    return Math.max(
      ForgettingCurveModel.MIN_STRENGTH,
      Math.min(ForgettingCurveModel.MAX_STRENGTH, totalStrength)
    );
  }

  /**
   * 最適な復習タイミングの提案
   *
   * @param currentRetention - 現在の記憶保持率（0-1）
   * @param targetRetention - 目標記憶保持率（デフォルト0.9）
   * @returns 復習推奨レベル
   */
  suggestReviewTiming(
    currentRetention: number,
    targetRetention: number = ForgettingCurveModel.TARGET_RETENTION
  ): 'now' | 'soon' | 'scheduled' | 'later' {
    // 保持率が目標を大きく下回る（-20%以上） → 今すぐ復習
    if (currentRetention < targetRetention - 0.2) {
      return 'now';
    }

    // 保持率が目標を下回る（-10%以上） → 近日中に復習
    if (currentRetention < targetRetention - 0.1) {
      return 'soon';
    }

    // 保持率が目標付近（±10%） → スケジュール通り
    if (currentRetention < targetRetention + 0.1) {
      return 'scheduled';
    }

    // 保持率が目標を大きく上回る → 後回しでOK
    return 'later';
  }

  /**
   * 包括的な記憶分析
   *
   * @param progress - 単語の学習履歴
   * @param daysSinceLastReview - 最終復習からの経過日数
   * @param targetRetention - 目標記憶保持率（デフォルト0.9）
   * @returns 詳細な分析結果
   */
  analyzeRetention(
    progress: WordProgress,
    daysSinceLastReview: number,
    targetRetention: number = ForgettingCurveModel.TARGET_RETENTION
  ): RetentionResult {
    // 記憶強度の計算
    const memoryStrength = this.calculateMemoryStrength(progress);

    // 記憶保持率の計算
    const retention = this.calculateRetention(daysSinceLastReview, memoryStrength);

    // 復習推奨レベルの決定
    const reviewUrgency = this.suggestReviewTiming(retention, targetRetention);

    return {
      retention,
      memoryStrength,
      daysSince: daysSinceLastReview,
      reviewUrgency
    };
  }

  /**
   * 記憶が目標保持率まで減衰するまでの日数を予測
   *
   * R(t) = e^(-t/S) = targetRetention を解く
   * t = -S * ln(targetRetention)
   *
   * @param memoryStrength - 記憶強度（1-10）
   * @param targetRetention - 目標記憶保持率（デフォルト0.9）
   * @returns 目標保持率まで減衰する日数
   */
  predictDecayDays(
    memoryStrength: number,
    targetRetention: number = ForgettingCurveModel.TARGET_RETENTION
  ): number {
    // t = -S * ln(R)
    const decayDays = -memoryStrength * Math.log(targetRetention);

    return Math.max(0, decayDays);
  }

  /**
   * 次回復習の推奨日時を計算
   *
   * @param progress - 単語の学習履歴
   * @param targetRetention - 目標記憶保持率（デフォルト0.9）
   * @returns 次回復習推奨日時
   */
  calculateNextReviewDate(
    progress: WordProgress,
    targetRetention: number = ForgettingCurveModel.TARGET_RETENTION
  ): Date {
    const memoryStrength = this.calculateMemoryStrength(progress);
    const decayDays = this.predictDecayDays(memoryStrength, targetRetention);

    // 現在時刻 + 減衰日数
    const nextReviewTimestamp = Date.now() + decayDays * 24 * 60 * 60 * 1000;

    return new Date(nextReviewTimestamp);
  }

  /**
   * デバッグ用: 忘却曲線の詳細ログ
   *
   * @param progress - 単語の学習履歴
   * @param result - 分析結果
   */
  logAnalysis(progress: WordProgress, result: RetentionResult): void {
    if (!import.meta.env?.DEV) return;

    console.log('📉 [Ebbinghaus] 忘却曲線分析');
    console.log(`  単語: ${progress.word}`);
    console.log(`  記憶強度: ${result.memoryStrength.toFixed(2)} / 10`);
    console.log(`  経過日数: ${result.daysSince.toFixed(1)}日`);
    console.log(`  記憶保持率: ${(result.retention * 100).toFixed(1)}%`);
    console.log(`  復習推奨: ${this.getReviewUrgencyLabel(result.reviewUrgency)}`);

    // 詳細内訳
    console.log('  強度内訳:');
    console.log(`    - 連続正解: ${progress.consecutiveCorrect || 0}回 (+${((progress.consecutiveCorrect || 0) * 1.5).toFixed(1)})`);
    console.log(`    - 正答率: ${((progress.memorizationCorrect || 0) / (progress.memorizationAttempts || 1) * 100).toFixed(0)}%`);
    console.log(`    - まだまだ: ${progress.memorizationStillLearning || 0}回 (-${((progress.memorizationStillLearning || 0) * 0.5).toFixed(1)})`);
  }

  /**
   * 復習推奨レベルのラベルを取得
   *
   * @param urgency - 復習推奨レベル
   * @returns 日本語ラベル
   */
  private getReviewUrgencyLabel(urgency: 'now' | 'soon' | 'scheduled' | 'later'): string {
    const labels = {
      now: '今すぐ復習',
      soon: '近日中に復習',
      scheduled: 'スケジュール通り',
      later: '後回しでOK'
    };

    return labels[urgency];
  }

  /**
   * 記憶強度の説明テキストを取得
   *
   * @param strength - 記憶強度（1-10）
   * @returns 説明テキスト
   */
  getStrengthDescription(strength: number): string {
    if (strength >= 9) return '超強固（長期記憶完全定着）';
    if (strength >= 7) return '強固（長期記憶に移行中）';
    if (strength >= 5) return '中程度（短期記憶から移行中）';
    if (strength >= 3) return '弱い（まだ短期記憶）';
    return '非常に弱い（作業記憶レベル）';
  }
}
