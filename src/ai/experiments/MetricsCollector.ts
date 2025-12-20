/**
 * ABテストのメトリクス収集システム
 *
 * 学習効果、エンゲージメント、AI信頼度などの指標を収集・分析します。
 */

export interface MetricEvent {
  /** イベントタイプ */
  type: MetricEventType;

  /** テストID */
  testId: string;

  /** バリアントID */
  variantId: string;

  /** イベント発生時刻 */
  timestamp: Date;

  /** イベント固有のデータ */
  data: Record<string, any>;
}

export type MetricEventType =
  | 'learning_outcome'      // 学習成果
  | 'engagement'            // エンゲージメント
  | 'trust_rating'          // AI信頼度評価
  | 'feature_interaction'   // 機能インタラクション
  | 'session_duration'      // セッション時間
  | 'completion_rate';      // 完了率

export interface LearningOutcomeData {
  /** 単語 */
  word: string;

  /** 正誤 */
  isCorrect: boolean;

  /** 学習中かどうか */
  isStillLearning: boolean;

  /** 記憶保持率 */
  retentionRate?: number;

  /** 優先度スコア */
  priorityScore?: number;
}

export interface EngagementData {
  /** アクションタイプ */
  action: 'question_answered' | 'dashboard_viewed' | 'explanation_viewed' | 'stats_viewed';

  /** セッションID */
  sessionId: string;

  /** アクション継続時間（ミリ秒） */
  duration?: number;
}

export interface TrustRatingData {
  /** 評価スコア (1-5) */
  rating: number;

  /** 評価対象機能 */
  feature: 'calibration_dashboard' | 'priority_explanation' | 'overall';

  /** コメント（オプション） */
  comment?: string;
}

export interface FeatureInteractionData {
  /** 機能名 */
  feature: string;

  /** インタラクションタイプ */
  interactionType: 'click' | 'view' | 'expand' | 'collapse';

  /** 要素ID */
  elementId?: string;
}

/**
 * メトリクス集計結果
 */
export interface MetricsSummary {
  /** テストID */
  testId: string;

  /** バリアント別の集計 */
  byVariant: Record<string, VariantMetrics>;

  /** 集計期間 */
  period: {
    start: Date;
    end: Date;
  };

  /** 総イベント数 */
  totalEvents: number;
}

export interface VariantMetrics {
  /** バリアントID */
  variantId: string;

  /** サンプル数（ユーザー数） */
  sampleSize: number;

  /** 学習成果メトリクス */
  learningOutcome: {
    correctRate: number;        // 正答率
    avgRetentionRate: number;   // 平均記憶保持率
    totalQuestions: number;     // 総問題数
  };

  /** エンゲージメントメトリクス */
  engagement: {
    avgSessionDuration: number;   // 平均セッション時間（秒）
    actionsPerSession: number;    // セッションあたりのアクション数
    featureInteractions: number;  // 機能インタラクション数
  };

  /** 信頼度メトリクス */
  trust: {
    avgRating: number;            // 平均評価スコア
    ratingCount: number;          // 評価数
  };
}

export interface MetricsStorage {
  logEvent(event: MetricEvent): void;
  getEvents(testId: string, variantId?: string, startDate?: Date, endDate?: Date): MetricEvent[];
  getEventsByType(testId: string, type: MetricEventType): MetricEvent[];
  clearEvents(testId: string): void;
  getAllEvents?(): MetricEvent[]; // デバッグ用（オプショナル）
}

/**
 * インメモリストレージ（テスト用）
 */
export function createInMemoryMetricsStorage(): MetricsStorage {
  const events: MetricEvent[] = [];

  return {
    logEvent(event: MetricEvent): void {
      events.push(event);
    },

    getEvents(testId: string, variantId?: string, startDate?: Date, endDate?: Date): MetricEvent[] {
      return events.filter(e => {
        if (e.testId !== testId) return false;
        if (variantId && e.variantId !== variantId) return false;
        if (startDate && e.timestamp < startDate) return false;
        if (endDate && e.timestamp > endDate) return false;
        return true;
      });
    },

    getEventsByType(testId: string, type: MetricEventType): MetricEvent[] {
      return events.filter(e => e.testId === testId && e.type === type);
    },

    clearEvents(testId: string): void {
      const filtered = events.filter(e => e.testId !== testId);
      events.length = 0;
      events.push(...filtered);
    },

    getAllEvents(): MetricEvent[] {
      return [...events];
    }
  };
}

/**
 * メトリクスコレクター
 */
export class MetricsCollector {
  private storage: MetricsStorage;

  constructor(storage: MetricsStorage) {
    this.storage = storage;
  }

  /**
   * 学習成果イベントを記録
   */
  logLearningOutcome(
    testId: string,
    variantId: string,
    data: LearningOutcomeData
  ): void {
    this.storage.logEvent({
      type: 'learning_outcome',
      testId,
      variantId,
      timestamp: new Date(),
      data
    });
  }

  /**
   * エンゲージメントイベントを記録
   */
  logEngagement(
    testId: string,
    variantId: string,
    data: EngagementData
  ): void {
    this.storage.logEvent({
      type: 'engagement',
      testId,
      variantId,
      timestamp: new Date(),
      data
    });
  }

  /**
   * 信頼度評価を記録
   */
  logTrustRating(
    testId: string,
    variantId: string,
    data: TrustRatingData
  ): void {
    this.storage.logEvent({
      type: 'trust_rating',
      testId,
      variantId,
      timestamp: new Date(),
      data
    });
  }

  /**
   * 機能インタラクションを記録
   */
  logFeatureInteraction(
    testId: string,
    variantId: string,
    data: FeatureInteractionData
  ): void {
    this.storage.logEvent({
      type: 'feature_interaction',
      testId,
      variantId,
      timestamp: new Date(),
      data
    });
  }

  /**
   * メトリクスを集計
   */
  summarize(testId: string, startDate?: Date, endDate?: Date): MetricsSummary {
    const events = this.storage.getEvents(testId, undefined, startDate, endDate);

    if (events.length === 0) {
      return {
        testId,
        byVariant: {},
        period: {
          start: startDate || new Date(),
          end: endDate || new Date()
        },
        totalEvents: 0
      };
    }

    // バリアント別にグループ化
    const variantGroups = new Map<string, MetricEvent[]>();
    for (const event of events) {
      if (!variantGroups.has(event.variantId)) {
        variantGroups.set(event.variantId, []);
      }
      variantGroups.get(event.variantId)!.push(event);
    }

    // 各バリアントのメトリクスを計算
    const byVariant: Record<string, VariantMetrics> = {};

    for (const [variantId, variantEvents] of variantGroups) {
      byVariant[variantId] = this.calculateVariantMetrics(variantId, variantEvents);
    }

    return {
      testId,
      byVariant,
      period: {
        start: startDate || events[0].timestamp,
        end: endDate || events[events.length - 1].timestamp
      },
      totalEvents: events.length
    };
  }

  /**
   * バリアント別メトリクスを計算
   */
  private calculateVariantMetrics(variantId: string, events: MetricEvent[]): VariantMetrics {
    const learningEvents = events.filter(e => e.type === 'learning_outcome');
    const engagementEvents = events.filter(e => e.type === 'engagement');
    const trustEvents = events.filter(e => e.type === 'trust_rating');
    const interactionEvents = events.filter(e => e.type === 'feature_interaction');

    // 学習成果メトリクス
    const correctCount = learningEvents.filter(e => e.data.isCorrect).length;
    const totalQuestions = learningEvents.length;
    const correctRate = totalQuestions > 0 ? correctCount / totalQuestions : 0;

    const retentionRates = learningEvents
      .map(e => e.data.retentionRate)
      .filter((r): r is number => typeof r === 'number');
    const avgRetentionRate = retentionRates.length > 0
      ? retentionRates.reduce((sum, r) => sum + r, 0) / retentionRates.length
      : 0;

    // エンゲージメントメトリクス
    const sessionIds = new Set(
      engagementEvents.map(e => e.data.sessionId).filter(Boolean)
    );
    const sampleSize = sessionIds.size || 1; // 最低1と仮定

    const sessionDurations = engagementEvents
      .filter(e => e.data.action === 'question_answered')
      .map(e => e.data.duration)
      .filter((d): d is number => typeof d === 'number');
    const avgSessionDuration = sessionDurations.length > 0
      ? sessionDurations.reduce((sum, d) => sum + d, 0) / sessionDurations.length / 1000
      : 0;

    const actionsPerSession = engagementEvents.length / sampleSize;

    // 信頼度メトリクス
    const ratings = trustEvents.map(e => e.data.rating);
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : 0;

    return {
      variantId,
      sampleSize,
      learningOutcome: {
        correctRate,
        avgRetentionRate,
        totalQuestions
      },
      engagement: {
        avgSessionDuration,
        actionsPerSession,
        featureInteractions: interactionEvents.length
      },
      trust: {
        avgRating,
        ratingCount: ratings.length
      }
    };
  }

  /**
   * 統計的有意差を検定（簡易的なt検定）
   */
  compareVariants(
    testId: string,
    variantId1: string,
    variantId2: string,
    metric: 'correctRate' | 'avgRetentionRate' | 'avgRating'
  ): ComparisonResult {
    const summary = this.summarize(testId);
    const variant1 = summary.byVariant[variantId1];
    const variant2 = summary.byVariant[variantId2];

    if (!variant1 || !variant2) {
      throw new Error('Variant not found');
    }

    let value1: number, value2: number;
    let n1: number, n2: number;

    switch (metric) {
      case 'correctRate':
        value1 = variant1.learningOutcome.correctRate;
        value2 = variant2.learningOutcome.correctRate;
        n1 = variant1.learningOutcome.totalQuestions;
        n2 = variant2.learningOutcome.totalQuestions;
        break;
      case 'avgRetentionRate':
        value1 = variant1.learningOutcome.avgRetentionRate;
        value2 = variant2.learningOutcome.avgRetentionRate;
        n1 = variant1.learningOutcome.totalQuestions;
        n2 = variant2.learningOutcome.totalQuestions;
        break;
      case 'avgRating':
        value1 = variant1.trust.avgRating;
        value2 = variant2.trust.avgRating;
        n1 = variant1.trust.ratingCount;
        n2 = variant2.trust.ratingCount;
        break;
    }

    const diff = value1 - value2;
    const relativeDiff = value2 !== 0 ? (diff / value2) * 100 : 0;

    // 簡易的な有意性判定（サンプルサイズと差の大きさから）
    const minSampleSize = Math.min(n1, n2);
    const isSignificant = minSampleSize >= 30 && Math.abs(relativeDiff) > 5;

    return {
      variant1: { id: variantId1, value: value1, sampleSize: n1 },
      variant2: { id: variantId2, value: value2, sampleSize: n2 },
      difference: diff,
      relativeDifference: relativeDiff,
      isSignificant,
      confidence: this.calculateConfidence(minSampleSize, Math.abs(relativeDiff))
    };
  }

  /**
   * 信頼度を計算（簡易版）
   */
  private calculateConfidence(sampleSize: number, relativeDiff: number): number {
    if (sampleSize < 30) return 0;
    if (sampleSize >= 100 && relativeDiff >= 10) return 0.95;
    if (sampleSize >= 50 && relativeDiff >= 5) return 0.90;
    if (sampleSize >= 30 && relativeDiff >= 5) return 0.80;
    return 0.50;
  }
}

export interface ComparisonResult {
  variant1: { id: string; value: number; sampleSize: number };
  variant2: { id: string; value: number; sampleSize: number };
  difference: number;
  relativeDifference: number;
  isSignificant: boolean;
  confidence: number;
}

/**
 * グローバルメトリクスコレクターのインスタンス
 */
let globalMetricsCollector: MetricsCollector | null = null;

export function getMetricsCollector(): MetricsCollector {
  if (!globalMetricsCollector) {
    // 本番環境ではlocalStorageベースのストレージを使用
    const storage: MetricsStorage = {
      logEvent(event: MetricEvent): void {
        const key = `ab_test_metrics_${event.testId}`;
        const existing = localStorage.getItem(key);
        const events: MetricEvent[] = existing ? JSON.parse(existing) : [];

        events.push({
          ...event,
          timestamp: event.timestamp.toISOString() as any
        });

        // 最大10,000イベントまで保持
        if (events.length > 10000) {
          events.splice(0, events.length - 10000);
        }

        localStorage.setItem(key, JSON.stringify(events));
      },

      getEvents(testId: string, variantId?: string, startDate?: Date, endDate?: Date): MetricEvent[] {
        const key = `ab_test_metrics_${testId}`;
        const data = localStorage.getItem(key);
        if (!data) return [];

        const events: MetricEvent[] = JSON.parse(data).map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp)
        }));

        return events.filter(e => {
          if (variantId && e.variantId !== variantId) return false;
          if (startDate && e.timestamp < startDate) return false;
          if (endDate && e.timestamp > endDate) return false;
          return true;
        });
      },

      getEventsByType(testId: string, type: MetricEventType): MetricEvent[] {
        const key = `ab_test_metrics_${testId}`;
        const data = localStorage.getItem(key);
        if (!data) return [];

        const events: MetricEvent[] = JSON.parse(data).map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp)
        }));

        return events.filter(e => e.type === type);
      },

      clearEvents(testId: string): void {
        const key = `ab_test_metrics_${testId}`;
        localStorage.removeItem(key);
      }
    };

    globalMetricsCollector = new MetricsCollector(storage);
  }

  return globalMetricsCollector;
}

export function resetMetricsCollector(): void {
  globalMetricsCollector = null;
}
