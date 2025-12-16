/**
 * 記憶保持アルゴリズム (SuperMemo SM-2 ベース)
 *
 * 長期記憶の定着と保持のための分散学習スケジュール管理。
 * 忘却曲線に基づく最適な復習タイミングの計算。
 */

export interface SM2Parameters {
  interval: number; // 次回復習までの日数
  repetition: number; // 連続正答回数
  easeFactor: number; // 容易度係数 (1.3-2.5)
}

export interface RetentionStatus {
  lastReviewDate: number; // 最終復習日時
  nextReviewDate: number; // 次回復習予定日時
  sm2: SM2Parameters; // SM-2パラメータ
  retentionRate: number; // 推定保持率 (0-1)
  forgettingIndex: number; // 忘却指数 (高いほど忘れやすい)
  totalReviews: number; // 総復習回数
  totalCorrect: number; // 総正答回数
  consecutiveCorrect: number; // 連続正答回数
  consecutiveWrong: number; // 連続誤答回数
  averageResponseTime: number; // 平均応答時間
  lastResponseTime: number; // 最終応答時間
}

export interface ReviewResult {
  isCorrect: boolean;
  responseTime: number;
  confidence: number; // 自信度 (1-5)
  timestamp: number;
}

export interface RetentionConfig {
  minEaseFactor: number; // 最小容易度係数
  maxEaseFactor: number; // 最大容易度係数
  easeFactorIncrement: number; // 正答時の容易度係数増分
  easeFactorDecrement: number; // 誤答時の容易度係数減分
  initialInterval: number; // 初回復習間隔（日）
  forgettingCurveDecay: number; // 忘却曲線の減衰率
  confidenceWeight: number; // 自信度の重み
}

export const DEFAULT_RETENTION_CONFIG: RetentionConfig = {
  minEaseFactor: 1.3,
  maxEaseFactor: 2.5,
  easeFactorIncrement: 0.1,
  easeFactorDecrement: 0.2,
  initialInterval: 1,
  forgettingCurveDecay: 0.5,
  confidenceWeight: 0.15,
};

/**
 * 記憶保持マネージャー
 */
export class MemoryRetentionManager {
  private retentionData: Map<string, RetentionStatus> = new Map();
  private config: RetentionConfig;

  constructor(customConfig?: Partial<RetentionConfig>) {
    this.config = { ...DEFAULT_RETENTION_CONFIG, ...customConfig };
  }

  /**
   * 単語の保持状態を取得
   */
  getRetentionStatus(word: string): RetentionStatus {
    if (!this.retentionData.has(word)) {
      this.retentionData.set(word, this.createInitialStatus());
    }
    return this.retentionData.get(word)!;
  }

  /**
   * 復習結果を記録し、次回復習日を計算
   */
  recordReview(word: string, result: ReviewResult): RetentionStatus {
    const status = this.getRetentionStatus(word);

    // 統計情報の更新
    status.totalReviews++;
    status.lastReviewDate = result.timestamp;
    status.lastResponseTime = result.responseTime;

    // 平均応答時間の更新（移動平均）
    const alpha = 0.3; // 新しい値の重み
    status.averageResponseTime =
      status.averageResponseTime * (1 - alpha) + result.responseTime * alpha;

    if (result.isCorrect) {
      status.totalCorrect++;
      status.consecutiveCorrect++;
      status.consecutiveWrong = 0;

      // SM-2アルゴリズムによる次回復習日の計算
      this.updateSM2OnCorrect(status, result.confidence);
    } else {
      status.consecutiveCorrect = 0;
      status.consecutiveWrong++;

      // SM-2アルゴリズムによるリセット
      this.updateSM2OnWrong(status);
    }

    // 保持率の推定
    status.retentionRate = this.estimateRetentionRate(status);

    // 忘却指数の更新
    status.forgettingIndex = this.calculateForgettingIndex(status);

    return status;
  }

  /**
   * 復習が必要な単語を取得
   */
  getDueWords(wordList: string[], currentTime: number = Date.now()): string[] {
    const dueWords: Array<{ word: string; priority: number }> = [];

    for (const word of wordList) {
      const status = this.getRetentionStatus(word);

      if (currentTime >= status.nextReviewDate) {
        // 優先度 = 経過日数 × 忘却指数
        const daysPastDue = (currentTime - status.nextReviewDate) / 86400000;
        const priority = daysPastDue * status.forgettingIndex;

        dueWords.push({ word, priority });
      }
    }

    // 優先度順にソート
    dueWords.sort((a, b) => b.priority - a.priority);

    return dueWords.map((item) => item.word);
  }

  /**
   * 復習スケジュールを取得
   */
  getReviewSchedule(wordList: string[], days: number = 7): Map<string, Date[]> {
    const schedule = new Map<string, Date[]>();
    const now = Date.now();

    for (const word of wordList) {
      const status = this.getRetentionStatus(word);
      const reviewDates: Date[] = [];

      let nextDate = status.nextReviewDate;
      const endDate = now + days * 86400000;

      while (nextDate <= endDate) {
        reviewDates.push(new Date(nextDate));

        // 次の復習日を予測（現在の間隔を使用）
        nextDate += status.sm2.interval * 86400000;
      }

      if (reviewDates.length > 0) {
        schedule.set(word, reviewDates);
      }
    }

    return schedule;
  }

  /**
   * 保持統計を取得
   */
  getRetentionStatistics(wordList: string[]): {
    averageRetentionRate: number;
    averageEaseFactor: number;
    averageInterval: number;
    dueCount: number;
    overdueCount: number;
    wellLearnedCount: number;
  } {
    const now = Date.now();
    let totalRetention = 0;
    let totalEaseFactor = 0;
    let totalInterval = 0;
    let dueCount = 0;
    let overdueCount = 0;
    let wellLearnedCount = 0;

    for (const word of wordList) {
      const status = this.getRetentionStatus(word);

      totalRetention += status.retentionRate;
      totalEaseFactor += status.sm2.easeFactor;
      totalInterval += status.sm2.interval;

      if (now >= status.nextReviewDate) {
        dueCount++;

        const daysPastDue = (now - status.nextReviewDate) / 86400000;
        if (daysPastDue > 1) {
          overdueCount++;
        }
      }

      // 十分に学習された単語：連続5回以上正答、interval >= 30日
      if (status.consecutiveCorrect >= 5 && status.sm2.interval >= 30) {
        wellLearnedCount++;
      }
    }

    const count = wordList.length || 1;

    return {
      averageRetentionRate: totalRetention / count,
      averageEaseFactor: totalEaseFactor / count,
      averageInterval: totalInterval / count,
      dueCount,
      overdueCount,
      wellLearnedCount,
    };
  }

  /**
   * 忘却曲線による推定保持率
   */
  estimateRetentionRate(status: RetentionStatus): number {
    const now = Date.now();
    const daysSinceReview = (now - status.lastReviewDate) / 86400000;
    const daysUntilReview = (status.nextReviewDate - now) / 86400000;

    if (daysUntilReview >= 0) {
      // まだ復習日前なら、指数関数的に減衰
      const decay = Math.exp(
        (-this.config.forgettingCurveDecay * daysSinceReview) / status.sm2.interval
      );
      return Math.max(0.1, Math.min(1.0, decay));
    } else {
      // 復習日を過ぎている場合、急速に減衰
      const overdueDays = -daysUntilReview;
      const decay = Math.exp(
        (-this.config.forgettingCurveDecay * (daysSinceReview + overdueDays)) / status.sm2.interval
      );
      return Math.max(0.05, Math.min(0.9, decay));
    }
  }

  /**
   * リセット
   */
  reset(): void {
    this.retentionData.clear();
  }

  /**
   * データのインポート
   */
  importRetentionData(data: Map<string, RetentionStatus>): void {
    this.retentionData = new Map(data);
  }

  /**
   * データのエクスポート
   */
  exportRetentionData(): Map<string, RetentionStatus> {
    return new Map(this.retentionData);
  }

  // ========================================
  // プライベートメソッド
  // ========================================

  private createInitialStatus(): RetentionStatus {
    return {
      lastReviewDate: Date.now(),
      nextReviewDate: Date.now() + this.config.initialInterval * 86400000,
      sm2: {
        interval: this.config.initialInterval,
        repetition: 0,
        easeFactor: 2.5,
      },
      retentionRate: 1.0,
      forgettingIndex: 1.0,
      totalReviews: 0,
      totalCorrect: 0,
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
      averageResponseTime: 0,
      lastResponseTime: 0,
    };
  }

  private updateSM2OnCorrect(status: RetentionStatus, confidence: number): void {
    const sm2 = status.sm2;
    sm2.repetition++;

    // 容易度係数の更新（自信度を考慮）
    const quality = this.mapConfidenceToQuality(confidence);
    const newEF = sm2.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    sm2.easeFactor = Math.max(
      this.config.minEaseFactor,
      Math.min(this.config.maxEaseFactor, newEF)
    );

    // 復習間隔の計算
    if (sm2.repetition === 1) {
      sm2.interval = 1;
    } else if (sm2.repetition === 2) {
      sm2.interval = 6;
    } else {
      sm2.interval = Math.round(sm2.interval * sm2.easeFactor);
    }

    // 応答時間を考慮した調整
    if (
      status.lastResponseTime > 3000 &&
      status.lastResponseTime > status.averageResponseTime * 1.5
    ) {
      // 応答時間が遅い場合は間隔を短縮
      sm2.interval = Math.max(1, Math.round(sm2.interval * 0.8));
    }

    // 次回復習日の設定
    status.nextReviewDate = status.lastReviewDate + sm2.interval * 86400000;
  }

  private updateSM2OnWrong(status: RetentionStatus): void {
    const sm2 = status.sm2;

    // 連続正答回数をリセット
    sm2.repetition = 0;

    // 容易度係数を下げる
    sm2.easeFactor = Math.max(
      this.config.minEaseFactor,
      sm2.easeFactor - this.config.easeFactorDecrement
    );

    // 間隔をリセット
    sm2.interval = 1;

    // 次回復習日の設定（即日）
    status.nextReviewDate = status.lastReviewDate + sm2.interval * 86400000;
  }

  private mapConfidenceToQuality(confidence: number): number {
    // confidence (1-5) を SM-2 の quality (0-5) にマッピング
    // confidence 5 (完璧) → quality 5
    // confidence 4 (良い) → quality 4
    // confidence 3 (普通) → quality 3
    // confidence 2 (難しい) → quality 2
    // confidence 1 (とても難しい) → quality 1
    return Math.max(0, Math.min(5, confidence));
  }

  private calculateForgettingIndex(status: RetentionStatus): number {
    // 忘却指数 = 基本値 + 誤答率の影響 + 応答時間の影響

    const baseIndex = 1.0;

    // 誤答率の影響（総復習回数が多いほど信頼性が高い）
    const wrongRate = status.totalReviews > 0 ? 1 - status.totalCorrect / status.totalReviews : 0;
    const wrongImpact = wrongRate * 2.0;

    // 応答時間の影響（遅いほど忘れやすい）
    const responseImpact =
      status.averageResponseTime > 2000 ? (status.averageResponseTime - 2000) / 5000 : 0;

    // 連続誤答の影響
    const consecutiveWrongImpact = Math.min(status.consecutiveWrong * 0.3, 1.5);

    const index = baseIndex + wrongImpact + responseImpact + consecutiveWrongImpact;

    return Math.max(0.5, Math.min(5.0, index));
  }
}

/**
 * 最適な復習タイミングを判定
 */
export function isOptimalReviewTime(
  status: RetentionStatus,
  currentTime: number = Date.now()
): { isOptimal: boolean; reason: string; hoursUntilDue: number } {
  const hoursUntilDue = (status.nextReviewDate - currentTime) / 3600000;

  if (hoursUntilDue <= 0) {
    return {
      isOptimal: true,
      reason: '復習期限を過ぎています',
      hoursUntilDue,
    };
  }

  if (hoursUntilDue <= 2) {
    return {
      isOptimal: true,
      reason: '復習期限が近づいています',
      hoursUntilDue,
    };
  }

  if (status.retentionRate < 0.6) {
    return {
      isOptimal: true,
      reason: '保持率が低下しています',
      hoursUntilDue,
    };
  }

  return {
    isOptimal: false,
    reason: 'まだ復習の必要はありません',
    hoursUntilDue,
  };
}

/**
 * 復習効率の計算
 */
export function calculateReviewEfficiency(
  manager: MemoryRetentionManager,
  wordList: string[]
): number {
  const stats = manager.getRetentionStatistics(wordList);

  if (wordList.length === 0) {
    return 0;
  }

  // 効率 = (平均保持率 × 0.4) + (平均間隔/60 × 0.3) + (習得率 × 0.3)
  const retentionScore = stats.averageRetentionRate * 0.4;
  const intervalScore = Math.min(stats.averageInterval / 60, 1.0) * 0.3;
  const masteryScore = (stats.wellLearnedCount / wordList.length) * 0.3;

  return retentionScore + intervalScore + masteryScore;
}
