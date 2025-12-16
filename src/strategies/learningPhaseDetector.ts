/**
 * 学習フェーズ判定エンジン
 *
 * 5段階の学習フェーズを神経科学的根拠に基づいて判定する。
 * - ENCODING: 初見単語、作業記憶段階（0-30秒）
 * - INITIAL_CONSOLIDATION: 海馬の初期統合（初回正答後1時間）
 * - INTRADAY_REVIEW: 同日集中復習（同日内2回以上正答）
 * - SHORT_TERM: 短期記憶（1-7日、海馬→新皮質転送）
 * - LONG_TERM: 長期記憶（7日以上、新皮質保存）
 */

export enum LearningPhase {
  ENCODING = 'encoding',
  INITIAL_CONSOLIDATION = 'initial',
  INTRADAY_REVIEW = 'intraday',
  SHORT_TERM = 'short_term',
  LONG_TERM = 'long_term',
}

export interface PhaseThresholds {
  encodingTime: number; // 作業記憶の持続時間（デフォルト30秒）
  initialConsolidation: number; // 初期統合期間（デフォルト1時間）
  intradayWindow: number; // 同日内ウィンドウ（デフォルト24時間）
  shortTermWindow: number; // 短期記憶期間（デフォルト7日）
  longTermThreshold: number; // 長期記憶判定閾値（デフォルト7日）
  correctRateThreshold: number; // 正答率閾値（デフォルト0.8）
  responseTimeThreshold: number; // 応答時間閾値（デフォルト1500ms）
}

export interface PersonalParameters {
  learningSpeed: number; // 学習速度（1.0=標準、2.0=速い、0.5=遅い）
  forgettingSpeed: number; // 忘却速度
  consolidationThreshold: number; // 定着に必要な正答回数
  optimalInterval: number; // 最適な復習間隔（日数）
  sampleSize: number; // 推定に使用したサンプル数
  confidence: number; // 推定の信頼度（0-1）
  lastUpdated: number; // 最終更新日時
  nextUpdateAt: number; // 次回更新日時
}

export interface QuestionStatus {
  word: string;
  reviewCount: number;
  correctCount: number;
  wrongCount: number;
  lastReviewTime: number;
  lastCorrectTime: number;
  averageResponseTime: number;
  consecutiveCorrect: number;
  consecutiveWrong: number;
}

export interface PhaseDetectionResult {
  phase: LearningPhase;
  reason: string;
  matchedCondition: number;
  metrics: {
    reviewCount: number;
    correctCount: number;
    correctRate: number;
    daysSinceLastReview: number;
    timeSinceLastReview: number;
    averageResponseTime: number;
  };
}

// デフォルト閾値（神経科学的根拠に基づく）
export const DEFAULT_PHASE_THRESHOLDS: PhaseThresholds = {
  encodingTime: 30000, // 30秒（作業記憶の持続時間）
  initialConsolidation: 3600000, // 1時間（海馬の初期統合）
  intradayWindow: 86400000, // 24時間
  shortTermWindow: 604800000, // 7日（システム統合期間）
  longTermThreshold: 604800000, // 7日
  correctRateThreshold: 0.8, // 80%（長期記憶の基準）
  responseTimeThreshold: 1500, // 1.5秒（自動化された記憶）
};

// デフォルト個人パラメータ
export const DEFAULT_PERSONAL_PARAMETERS: PersonalParameters = {
  learningSpeed: 1.0,
  forgettingSpeed: 1.0,
  consolidationThreshold: 3,
  optimalInterval: 1.0,
  sampleSize: 0,
  confidence: 0.5,
  lastUpdated: Date.now(),
  nextUpdateAt: Date.now() + 86400000,
};

// 定数
const MAX_DAYS_THRESHOLD = 1000; // 超長期放置の閾値
const MASTERY_THRESHOLD = 100; // 完全習得の閾値
const RESET_THRESHOLD = 100; // リセットの閾値
const MIN_RESPONSE_TIME = 0; // 応答時間の最小値
const MAX_RESPONSE_TIME = 60000; // 応答時間の最大値（60秒）
const DEFAULT_RESPONSE_TIME = 1000; // デフォルト応答時間（1秒）

/**
 * 学習フェーズ判定クラス
 */
export class LearningPhaseDetector {
  private thresholds: PhaseThresholds;
  private cache: Map<string, { phase: LearningPhase; timestamp: number }>;
  private readonly CACHE_DURATION = 5000; // 5秒

  constructor(personalParams?: PersonalParameters, customThresholds?: Partial<PhaseThresholds>) {
    const baseThresholds = { ...DEFAULT_PHASE_THRESHOLDS, ...customThresholds };

    if (personalParams) {
      this.thresholds = this.adjustThresholds(baseThresholds, personalParams);
    } else {
      this.thresholds = baseThresholds;
    }

    this.cache = new Map();
  }

  /**
   * 個人パラメータによる閾値調整
   */
  private adjustThresholds(
    baseThresholds: PhaseThresholds,
    personalParams: PersonalParameters
  ): PhaseThresholds {
    return {
      encodingTime: baseThresholds.encodingTime,
      initialConsolidation: baseThresholds.initialConsolidation / personalParams.learningSpeed,
      intradayWindow: baseThresholds.intradayWindow,
      shortTermWindow: baseThresholds.shortTermWindow / personalParams.learningSpeed,
      longTermThreshold: baseThresholds.longTermThreshold / personalParams.learningSpeed,
      correctRateThreshold: baseThresholds.correctRateThreshold,
      responseTimeThreshold: baseThresholds.responseTimeThreshold * personalParams.learningSpeed,
    };
  }

  /**
   * 学習フェーズを判定（キャッシュあり）
   */
  detectPhase(word: string, status: QuestionStatus): LearningPhase {
    const now = Date.now();
    const cached = this.cache.get(word);

    if (cached && now - cached.timestamp < this.CACHE_DURATION) {
      return cached.phase;
    }

    const result = this.detectPhaseWithReason(word, status);
    this.cache.set(word, { phase: result.phase, timestamp: now });

    return result.phase;
  }

  /**
   * 学習フェーズを判定（理由付き）
   */
  detectPhaseWithReason(word: string, status: QuestionStatus): PhaseDetectionResult {
    const now = Date.now();

    // タイムスタンプの異常値処理
    const lastReviewTime = this.sanitizeTimestamp(status.lastReviewTime, now);
    const lastCorrectTime = this.sanitizeTimestamp(status.lastCorrectTime, now);

    // 応答時間の異常値処理
    const averageResponseTime = this.sanitizeResponseTime(status.averageResponseTime);

    // 基本メトリクスの計算
    const timeSinceLastReview = now - lastReviewTime;
    const daysSinceLastReview = timeSinceLastReview / 86400000;
    const correctRate = status.reviewCount > 0 ? status.correctCount / status.reviewCount : 0;

    const metrics = {
      reviewCount: status.reviewCount,
      correctCount: status.correctCount,
      correctRate,
      daysSinceLastReview,
      timeSinceLastReview,
      averageResponseTime,
    };

    // 条件1: 初見単語
    if (status.reviewCount === 0) {
      return {
        phase: LearningPhase.ENCODING,
        reason: '初見単語（reviewCount=0）',
        matchedCondition: 1,
        metrics,
      };
    }

    // 条件2: 作業記憶段階（30秒以内）
    if (timeSinceLastReview < this.thresholds.encodingTime) {
      return {
        phase: LearningPhase.ENCODING,
        reason: `作業記憶段階（${Math.round(timeSinceLastReview / 1000)}秒前）`,
        matchedCondition: 2,
        metrics,
      };
    }

    // 条件3: 未正答
    if (status.correctCount === 0) {
      return {
        phase: LearningPhase.ENCODING,
        reason: '一度も正答していない',
        matchedCondition: 3,
        metrics,
      };
    }

    // エッジケース: 超長期放置
    if (daysSinceLastReview > MAX_DAYS_THRESHOLD) {
      return {
        phase: LearningPhase.ENCODING,
        reason: `超長期放置（${Math.round(daysSinceLastReview)}日前）`,
        matchedCondition: 101,
        metrics,
      };
    }

    // エッジケース: 超高頻度正答
    if (status.consecutiveCorrect >= MASTERY_THRESHOLD) {
      return {
        phase: LearningPhase.LONG_TERM,
        reason: `完全習得（${status.consecutiveCorrect}回連続正答）`,
        matchedCondition: 102,
        metrics,
      };
    }

    // エッジケース: 超高頻度誤答
    if (status.consecutiveWrong >= RESET_THRESHOLD) {
      return {
        phase: LearningPhase.ENCODING,
        reason: `学習方法要見直し（${status.consecutiveWrong}回連続誤答）`,
        matchedCondition: 103,
        metrics,
      };
    }

    // 条件4: 初期統合段階（1回正答、1時間以内）
    const hoursSinceCorrect = (now - lastCorrectTime) / 3600000;
    if (status.correctCount === 1 && now - lastCorrectTime < this.thresholds.initialConsolidation) {
      return {
        phase: LearningPhase.INITIAL_CONSOLIDATION,
        reason: `初期統合段階（初回正答後${Math.round(hoursSinceCorrect * 60)}分）`,
        matchedCondition: 4,
        metrics,
      };
    }

    // 条件5: 同日復習段階（同日内2回以上正答）
    if (this.isSameDay(now, lastCorrectTime) && status.correctCount >= 2) {
      return {
        phase: LearningPhase.INTRADAY_REVIEW,
        reason: `同日復習段階（今日${status.correctCount}回正答）`,
        matchedCondition: 5,
        metrics,
      };
    }

    // 条件6: 短期記憶段階（1-7日）
    if (daysSinceLastReview >= 1 && daysSinceLastReview <= 7) {
      if (correctRate >= 0.5 && correctRate < this.thresholds.correctRateThreshold) {
        return {
          phase: LearningPhase.SHORT_TERM,
          reason: `短期記憶段階（${Math.round(daysSinceLastReview)}日前、正答率${Math.round(correctRate * 100)}%）`,
          matchedCondition: 6,
          metrics,
        };
      } else if (correctRate < 0.5) {
        return {
          phase: LearningPhase.ENCODING,
          reason: `忘却によりリセット（正答率${Math.round(correctRate * 100)}%）`,
          matchedCondition: 6,
          metrics,
        };
      }
    }

    // 条件7: 長期記憶段階（7日以上）
    if (daysSinceLastReview > 7) {
      if (
        correctRate >= this.thresholds.correctRateThreshold &&
        averageResponseTime < this.thresholds.responseTimeThreshold
      ) {
        return {
          phase: LearningPhase.LONG_TERM,
          reason: `長期記憶確立（${Math.round(daysSinceLastReview)}日前、正答率${Math.round(correctRate * 100)}%、応答${Math.round(averageResponseTime)}ms）`,
          matchedCondition: 7,
          metrics,
        };
      } else if (correctRate >= 0.5 && correctRate < this.thresholds.correctRateThreshold) {
        return {
          phase: LearningPhase.SHORT_TERM,
          reason: `まだ不安定（正答率${Math.round(correctRate * 100)}%）`,
          matchedCondition: 7,
          metrics,
        };
      } else {
        return {
          phase: LearningPhase.ENCODING,
          reason: `完全忘却（正答率${Math.round(correctRate * 100)}%）`,
          matchedCondition: 7,
          metrics,
        };
      }
    }

    // デフォルト: SHORT_TERM
    return {
      phase: LearningPhase.SHORT_TERM,
      reason: 'デフォルト判定',
      matchedCondition: 0,
      metrics,
    };
  }

  /**
   * フェーズ遷移が可能かチェック
   */
  canTransition(word: string, status: QuestionStatus, targetPhase: LearningPhase): boolean {
    const currentPhase = this.detectPhase(word, status);

    // 同じフェーズへの遷移は常に可能
    if (currentPhase === targetPhase) {
      return true;
    }

    // フェーズの順序
    const phaseOrder = [
      LearningPhase.ENCODING,
      LearningPhase.INITIAL_CONSOLIDATION,
      LearningPhase.INTRADAY_REVIEW,
      LearningPhase.SHORT_TERM,
      LearningPhase.LONG_TERM,
    ];

    const currentIndex = phaseOrder.indexOf(currentPhase);
    const targetIndex = phaseOrder.indexOf(targetPhase);

    // 前進は1段階ずつのみ可能（忘却による退行は自由）
    if (targetIndex > currentIndex) {
      return targetIndex - currentIndex === 1;
    }

    // 退行は常に可能
    return true;
  }

  /**
   * 同日判定
   */
  private isSameDay(timestamp1: number, timestamp2: number): boolean {
    const date1 = new Date(timestamp1);
    const date2 = new Date(timestamp2);
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * 応答時間の異常値処理
   */
  private sanitizeResponseTime(responseTime: number): number {
    if (
      responseTime <= MIN_RESPONSE_TIME ||
      responseTime > MAX_RESPONSE_TIME ||
      isNaN(responseTime)
    ) {
      return DEFAULT_RESPONSE_TIME;
    }
    return responseTime;
  }

  /**
   * タイムスタンプの異常値処理
   */
  private sanitizeTimestamp(timestamp: number, now: number): number {
    if (timestamp > now) {
      console.warn(`未来のタイムスタンプを検出: ${timestamp}`);
      return now;
    }
    if (timestamp < 0 || isNaN(timestamp)) {
      return now;
    }
    return timestamp;
  }

  /**
   * キャッシュクリア
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 閾値の更新
   */
  updateThresholds(personalParams: PersonalParameters): void {
    this.thresholds = this.adjustThresholds(DEFAULT_PHASE_THRESHOLDS, personalParams);
    this.clearCache();
  }
}

/**
 * フェーズ分布の分析
 */
export function analyzePhaseDistribution(
  words: Array<{ word: string; status: QuestionStatus }>,
  detector: LearningPhaseDetector
): Record<LearningPhase, number> {
  const distribution: Record<LearningPhase, number> = {
    [LearningPhase.ENCODING]: 0,
    [LearningPhase.INITIAL_CONSOLIDATION]: 0,
    [LearningPhase.INTRADAY_REVIEW]: 0,
    [LearningPhase.SHORT_TERM]: 0,
    [LearningPhase.LONG_TERM]: 0,
  };

  for (const { word, status } of words) {
    const phase = detector.detectPhase(word, status);
    distribution[phase]++;
  }

  return distribution;
}

/**
 * デバッグ用: フェーズ判定の詳細ログ
 */
export function logPhaseDetection(result: PhaseDetectionResult): void {
  console.log(`
🔍 フェーズ判定結果
━━━━━━━━━━━━━━━━━━━━
フェーズ: ${result.phase}
理由: ${result.reason}
条件: ${result.matchedCondition}

📊 メトリクス:
- 総復習回数: ${result.metrics.reviewCount}
- 正答回数: ${result.metrics.correctCount}
- 正答率: ${Math.round(result.metrics.correctRate * 100)}%
- 前回復習: ${Math.round(result.metrics.daysSinceLastReview)}日前
- 平均応答時間: ${Math.round(result.metrics.averageResponseTime)}ms
━━━━━━━━━━━━━━━━━━━━
  `);
}
