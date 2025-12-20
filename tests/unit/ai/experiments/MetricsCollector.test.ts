import { describe, it, expect, beforeEach } from 'vitest';
import {
  MetricsCollector,
  createInMemoryMetricsStorage,
  type LearningOutcomeData,
  type EngagementData,
  type TrustRatingData,
  type FeatureInteractionData,
  getMetricsCollector,
  resetMetricsCollector
} from '@/ai/experiments/MetricsCollector';

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    const storage = createInMemoryMetricsStorage();
    collector = new MetricsCollector(storage);
  });

  describe('logLearningOutcome', () => {
    it('should log learning outcome events', () => {
      const data: LearningOutcomeData = {
        word: 'apple',
        isCorrect: true,
        isStillLearning: false,
        retentionRate: 0.85,
        priorityScore: 50
      };

      collector.logLearningOutcome('test_learning', 'treatment', data);

      const summary = collector.summarize('test_learning');
      expect(summary.totalEvents).toBe(1);
      expect(summary.byVariant.treatment).toBeDefined();
    });
  });

  describe('logEngagement', () => {
    it('should log engagement events', () => {
      const data: EngagementData = {
        action: 'dashboard_viewed',
        sessionId: 'session_123',
        duration: 5000
      };

      collector.logEngagement('test_engagement', 'treatment', data);

      const summary = collector.summarize('test_engagement');
      expect(summary.totalEvents).toBe(1);
    });
  });

  describe('logTrustRating', () => {
    it('should log trust rating events', () => {
      const data: TrustRatingData = {
        rating: 5,
        feature: 'calibration_dashboard',
        comment: 'Very helpful!'
      };

      collector.logTrustRating('test_trust', 'treatment', data);

      const summary = collector.summarize('test_trust');
      expect(summary.totalEvents).toBe(1);
      expect(summary.byVariant.treatment.trust.avgRating).toBe(5);
    });
  });

  describe('logFeatureInteraction', () => {
    it('should log feature interaction events', () => {
      const data: FeatureInteractionData = {
        feature: 'priority_badge',
        interactionType: 'expand',
        elementId: 'badge_123'
      };

      collector.logFeatureInteraction('test_interaction', 'treatment', data);

      const summary = collector.summarize('test_interaction');
      expect(summary.totalEvents).toBe(1);
    });
  });

  describe('summarize', () => {
    it('should calculate correct metrics for each variant', () => {
      // 新しいコレクターを作成
      const storage = createInMemoryMetricsStorage();
      const testCollector = new MetricsCollector(storage);

      // Control group: 基本性能
      for (let i = 0; i < 10; i++) {
        testCollector.logLearningOutcome('test_summary_1', 'control', {
          word: `word_${i}`,
          isCorrect: i < 6, // 60% correct rate
          isStillLearning: false,
          retentionRate: 0.65
        });

        testCollector.logEngagement('test_summary_1', 'control', {
          action: 'question_answered',
          sessionId: 'session_control',
          duration: 3000
        });
      }

      // Treatment group: 改善性能
      for (let i = 0; i < 10; i++) {
        testCollector.logLearningOutcome('test_summary_1', 'treatment', {
          word: `word_${i}`,
          isCorrect: i < 8, // 80% correct rate
          isStillLearning: false,
          retentionRate: 0.80
        });

        testCollector.logEngagement('test_summary_1', 'treatment', {
          action: 'question_answered',
          sessionId: 'session_treatment',
          duration: 4000
        });
      }

      // 信頼度評価
      testCollector.logTrustRating('test_summary_1', 'control', {
        rating: 3,
        feature: 'overall'
      });

      testCollector.logTrustRating('test_summary_1', 'treatment', {
        rating: 5,
        feature: 'calibration_dashboard'
      });

      testCollector.logTrustRating('test_summary_1', 'treatment', {
        rating: 4,
        feature: 'priority_explanation'
      });

      const summary = testCollector.summarize('test_summary_1');

      expect(summary.totalEvents).toBe(43); // 10 control learning + 10 control engagement + 10 treatment learning + 10 treatment engagement + 3 trust
      expect(Object.keys(summary.byVariant)).toHaveLength(2);

      const control = summary.byVariant.control;
      expect(control.learningOutcome.correctRate).toBeCloseTo(0.6, 2);
      expect(control.learningOutcome.totalQuestions).toBe(10);
      expect(control.learningOutcome.avgRetentionRate).toBeCloseTo(0.65, 2);
      expect(control.trust.avgRating).toBe(3);

      const treatment = summary.byVariant.treatment;
      expect(treatment.learningOutcome.correctRate).toBeCloseTo(0.8, 2);
      expect(treatment.learningOutcome.totalQuestions).toBe(10);
      expect(treatment.learningOutcome.avgRetentionRate).toBeCloseTo(0.80, 2);
      expect(treatment.trust.avgRating).toBeCloseTo(4.5, 2);
    });

    it('should calculate engagement metrics', () => {
      // 新しいコレクターを作成
      const storage = createInMemoryMetricsStorage();
      const testCollector = new MetricsCollector(storage);

      // Control group
      for (let i = 0; i < 10; i++) {
        testCollector.logLearningOutcome('test_engagement_metrics', 'control', {
          word: `word_${i}`,
          isCorrect: i < 6,
          isStillLearning: false,
          retentionRate: 0.65
        });

        testCollector.logEngagement('test_engagement_metrics', 'control', {
          action: 'question_answered',
          sessionId: 'session_control',
          duration: 3000
        });
      }

      // Treatment group
      for (let i = 0; i < 10; i++) {
        testCollector.logLearningOutcome('test_engagement_metrics', 'treatment', {
          word: `word_${i}`,
          isCorrect: i < 8,
          isStillLearning: false,
          retentionRate: 0.80
        });

        testCollector.logEngagement('test_engagement_metrics', 'treatment', {
          action: 'question_answered',
          sessionId: 'session_treatment',
          duration: 4000
        });
      }

      const summary = testCollector.summarize('test_engagement_metrics');

      const control = summary.byVariant.control;
      expect(control.engagement.avgSessionDuration).toBeCloseTo(3, 1);
      expect(control.engagement.actionsPerSession).toBeCloseTo(10, 0);

      const treatment = summary.byVariant.treatment;
      expect(treatment.engagement.avgSessionDuration).toBeCloseTo(4, 1);
      expect(treatment.engagement.actionsPerSession).toBeCloseTo(10, 0);
    });

    it('should handle date range filtering', () => {
      // 新しいコレクターを作成
      const storage = createInMemoryMetricsStorage();
      const testCollector = new MetricsCollector(storage);

      // イベントを記録
      for (let i = 0; i < 10; i++) {
        testCollector.logLearningOutcome('test_date_filter', 'control', {
          word: `word_${i}`,
          isCorrect: i < 6,
          isStillLearning: false,
          retentionRate: 0.65
        });

        testCollector.logEngagement('test_date_filter', 'control', {
          action: 'question_answered',
          sessionId: 'session_control',
          duration: 3000
        });
      }

      for (let i = 0; i < 10; i++) {
        testCollector.logLearningOutcome('test_date_filter', 'treatment', {
          word: `word_${i}`,
          isCorrect: i < 8,
          isStillLearning: false,
          retentionRate: 0.80
        });

        testCollector.logEngagement('test_date_filter', 'treatment', {
          action: 'question_answered',
          sessionId: 'session_treatment',
          duration: 4000
        });
      }

      testCollector.logTrustRating('test_date_filter', 'control', {
        rating: 3,
        feature: 'overall'
      });

      testCollector.logTrustRating('test_date_filter', 'treatment', {
        rating: 5,
        feature: 'calibration_dashboard'
      });

      testCollector.logTrustRating('test_date_filter', 'treatment', {
        rating: 4,
        feature: 'priority_explanation'
      });

      const now = new Date();
      const yesterday = new Date(now.getTime() - 86400000);
      const tomorrow = new Date(now.getTime() + 86400000);

      // 過去のデータは含まれない
      const summaryPast = testCollector.summarize('test_date_filter', yesterday, yesterday);
      expect(summaryPast.totalEvents).toBe(0);

      // 今日のデータは含まれる
      const summaryToday = testCollector.summarize('test_date_filter', yesterday, tomorrow);
      expect(summaryToday.totalEvents).toBe(43); // 10 control learning + 10 control engagement + 10 treatment learning + 10 treatment engagement + 3 trust
    });

    it('should return empty summary for non-existent test', () => {
      const summary = collector.summarize('non_existent');
      expect(summary.totalEvents).toBe(0);
      expect(Object.keys(summary.byVariant)).toHaveLength(0);
    });
  });

  describe('compareVariants', () => {
    beforeEach(() => {
      // Control: 60% correct rate, 0.65 retention
      for (let i = 0; i < 100; i++) {
        collector.logLearningOutcome('test_1', 'control', {
          word: `word_${i}`,
          isCorrect: i < 60,
          isStillLearning: false,
          retentionRate: 0.65
        });
      }

      // Treatment: 75% correct rate, 0.80 retention
      for (let i = 0; i < 100; i++) {
        collector.logLearningOutcome('test_1', 'treatment', {
          word: `word_${i}`,
          isCorrect: i < 75,
          isStillLearning: false,
          retentionRate: 0.80
        });
      }

      // 信頼度評価
      for (let i = 0; i < 50; i++) {
        collector.logTrustRating('test_1', 'control', {
          rating: 3,
          feature: 'overall'
        });

        collector.logTrustRating('test_1', 'treatment', {
          rating: 4,
          feature: 'overall'
        });
      }
    });

    it('should calculate difference between variants', () => {
      const result = collector.compareVariants('test_1', 'treatment', 'control', 'correctRate');

      expect(result.variant1.value).toBeCloseTo(0.75, 2);
      expect(result.variant2.value).toBeCloseTo(0.60, 2);
      expect(result.difference).toBeCloseTo(0.15, 2);
      expect(result.relativeDifference).toBeCloseTo(25, 1); // 25% improvement
    });

    it('should detect statistical significance', () => {
      const result = collector.compareVariants('test_1', 'treatment', 'control', 'correctRate');

      expect(result.isSignificant).toBe(true); // n=100, 25% difference
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should compare retention rates', () => {
      const result = collector.compareVariants('test_1', 'treatment', 'control', 'avgRetentionRate');

      expect(result.variant1.value).toBeCloseTo(0.80, 2);
      expect(result.variant2.value).toBeCloseTo(0.65, 2);
      expect(result.difference).toBeCloseTo(0.15, 2);
    });

    it('should compare trust ratings', () => {
      const result = collector.compareVariants('test_1', 'treatment', 'control', 'avgRating');

      expect(result.variant1.value).toBeCloseTo(4, 1);
      expect(result.variant2.value).toBeCloseTo(3, 1);
      expect(result.difference).toBeCloseTo(1, 1);
      expect(result.relativeDifference).toBeCloseTo(33.3, 1);
    });

    it('should not detect significance with small sample', () => {
      const storage = createInMemoryMetricsStorage();
      const smallCollector = new MetricsCollector(storage);

      // 小さいサンプル（n=10）
      for (let i = 0; i < 10; i++) {
        smallCollector.logLearningOutcome('test_small', 'control', {
          word: `word_${i}`,
          isCorrect: i < 5,
          isStillLearning: false
        });

        smallCollector.logLearningOutcome('test_small', 'treatment', {
          word: `word_${i}`,
          isCorrect: i < 8,
          isStillLearning: false
        });
      }

      const result = smallCollector.compareVariants('test_small', 'treatment', 'control', 'correctRate');
      expect(result.isSignificant).toBe(false); // n=10 is too small
    });

    it('should throw error for non-existent variant', () => {
      expect(() => {
        collector.compareVariants('test_1', 'non_existent', 'control', 'correctRate');
      }).toThrow('Variant not found');
    });
  });

  describe('getMetricsCollector', () => {
    beforeEach(() => {
      resetMetricsCollector();
      localStorage.clear();
    });

    it('should return singleton instance', () => {
      const collector1 = getMetricsCollector();
      const collector2 = getMetricsCollector();
      expect(collector1).toBe(collector2);
    });

    it('should persist events to localStorage', () => {
      const collector = getMetricsCollector();

      collector.logLearningOutcome('test_persist', 'control', {
        word: 'apple',
        isCorrect: true,
        isStillLearning: false
      });

      const key = 'ab_test_metrics_test_persist';
      const data = localStorage.getItem(key);
      expect(data).toBeTruthy();

      const events = JSON.parse(data!);
      expect(events).toHaveLength(1);
      expect(events[0].data.word).toBe('apple');
    });
  });
});
