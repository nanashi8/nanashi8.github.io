/**
 * QuestionScheduler Priority Calculation Tests
 *
 * Phase 1.2: 優先度計算のテスト（TDD Red phase）
 *
 * 優先度計算式:
 * priority = basePriority(category) + timeBoost(daysSinceLastStudy)
 *
 * - basePriority: incorrect=100, still_learning=75, new=50, mastered=10
 * - timeBoost: min(daysSinceLastStudy * 2, 20) ※最大+20
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { QuestionScheduler } from '../../../../src/ai/scheduler/QuestionScheduler';
import type { WordProgress } from '../../../../src/storage/progress/types';

describe('QuestionScheduler - Priority Calculation', () => {
  let scheduler: QuestionScheduler;

  beforeEach(() => {
    scheduler = new QuestionScheduler();
  });

  describe('recalculatePriorityAfterAnswer', () => {
    it('incorrect語句に最高優先度100を割り当て', () => {
      const progress: WordProgress = {
        word: 'test',
        correctCount: 1,
        incorrectCount: 4,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 0,
        lastStudied: Date.now(), // 今日学習
        totalResponseTime: 15000,
        averageResponseTime: 3000,
        difficultyScore: 80,
        masteryLevel: 'learning',
        responseTimes: [3000, 3000, 3000, 3000, 3000],
        calculatedPriority: 0,
        lastPriorityUpdate: 0,
        accuracyRate: 0.2,
        memorizationAttempts: 5,
      };

      const priority = scheduler.recalculatePriorityAfterAnswer(progress);

      // basePriority=100, timeBoost=0（今日学習）
      expect(priority).toBeCloseTo(100, 1);
    });

    it('still_learning語句に高優先度75を割り当て', () => {
      const progress: WordProgress = {
        word: 'test',
        correctCount: 3,
        incorrectCount: 2,
        consecutiveCorrect: 1,
        consecutiveIncorrect: 0,
        lastStudied: Date.now(),
        totalResponseTime: 15000,
        averageResponseTime: 3000,
        difficultyScore: 40,
        masteryLevel: 'learning',
        responseTimes: [3000, 3000, 3000, 3000, 3000],
        calculatedPriority: 0,
        lastPriorityUpdate: 0,
        accuracyRate: 0.6,
        memorizationAttempts: 5,
        memorizationCorrect: 2,
        memorizationIncorrect: 1,
        memorizationStillLearning: 2,
        memorizationStreak: 1,
      };

      const priority = scheduler.recalculatePriorityAfterAnswer(progress);

      // basePriority=75, timeBoost=0
      expect(priority).toBeCloseTo(75, 1);
    });

    it('new語句に中優先度50を割り当て', () => {
      const progress: WordProgress = {
        word: 'test',
        correctCount: 0,
        incorrectCount: 0,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 0,
        lastStudied: Date.now(),
        totalResponseTime: 0,
        averageResponseTime: 0,
        difficultyScore: 0,
        masteryLevel: 'new',
        responseTimes: [],
        calculatedPriority: 0,
        lastPriorityUpdate: 0,
        accuracyRate: 0,
        memorizationAttempts: 0,
      };

      const priority = scheduler.recalculatePriorityAfterAnswer(progress);

      // basePriority=50, timeBoost=0
      expect(priority).toBeCloseTo(50, 1);
    });

    it('mastered語句に低優先度10を割り当て', () => {
      const progress: WordProgress = {
        word: 'test',
        correctCount: 4,
        incorrectCount: 1,
        consecutiveCorrect: 3,
        consecutiveIncorrect: 0,
        lastStudied: Date.now(),
        totalResponseTime: 15000,
        averageResponseTime: 3000,
        difficultyScore: 20,
        masteryLevel: 'mastered',
        responseTimes: [3000, 3000, 3000, 3000, 3000],
        calculatedPriority: 0,
        lastPriorityUpdate: 0,
        accuracyRate: 0.8,
        memorizationAttempts: 5,
        memorizationCorrect: 4,
        memorizationIncorrect: 0,
        memorizationStillLearning: 1,
        memorizationStreak: 3,
      };

      const priority = scheduler.recalculatePriorityAfterAnswer(progress);

      // basePriority=10, timeBoost=0
      expect(priority).toBeCloseTo(10, 1);
    });

    it('時間経過による優先度ブーストを適用（1日後=+2）', () => {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

      const progress: WordProgress = {
        word: 'test',
        correctCount: 3,
        incorrectCount: 2,
        consecutiveCorrect: 1,
        consecutiveIncorrect: 0,
        lastStudied: oneDayAgo,
        totalResponseTime: 15000,
        averageResponseTime: 3000,
        difficultyScore: 40,
        masteryLevel: 'learning',
        responseTimes: [3000, 3000, 3000, 3000, 3000],
        calculatedPriority: 0,
        lastPriorityUpdate: 0,
        accuracyRate: 0.6,
        memorizationAttempts: 5,
        memorizationCorrect: 2,
        memorizationIncorrect: 1,
        memorizationStillLearning: 2,
        memorizationStreak: 1,
      };

      const priority = scheduler.recalculatePriorityAfterAnswer(progress);

      // basePriority=75, timeBoost=2 (1日*2)
      expect(priority).toBeCloseTo(77, 1);
    });

    it('時間経過による優先度ブーストを適用（5日後=+10）', () => {
      const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;

      const progress: WordProgress = {
        word: 'test',
        correctCount: 3,
        incorrectCount: 2,
        consecutiveCorrect: 1,
        consecutiveIncorrect: 0,
        lastStudied: fiveDaysAgo,
        totalResponseTime: 15000,
        averageResponseTime: 3000,
        difficultyScore: 40,
        masteryLevel: 'learning',
        responseTimes: [3000, 3000, 3000, 3000, 3000],
        calculatedPriority: 0,
        lastPriorityUpdate: 0,
        accuracyRate: 0.6,
        memorizationAttempts: 5,
        memorizationCorrect: 2,
        memorizationIncorrect: 1,
        memorizationStillLearning: 2,
        memorizationStreak: 1,
      };

      const priority = scheduler.recalculatePriorityAfterAnswer(progress);

      // basePriority=75, timeBoost=10 (5日*2)
      expect(priority).toBeCloseTo(85, 1);
    });

    it('時間ブーストの上限を20に制限（15日後でも+20）', () => {
      const fifteenDaysAgo = Date.now() - 15 * 24 * 60 * 60 * 1000;

      const progress: WordProgress = {
        word: 'test',
        correctCount: 3,
        incorrectCount: 2,
        consecutiveCorrect: 1,
        consecutiveIncorrect: 0,
        lastStudied: fifteenDaysAgo,
        totalResponseTime: 15000,
        averageResponseTime: 3000,
        difficultyScore: 40,
        masteryLevel: 'learning',
        responseTimes: [3000, 3000, 3000, 3000, 3000],
        calculatedPriority: 0,
        lastPriorityUpdate: 0,
        accuracyRate: 0.6,
        memorizationAttempts: 5,
        memorizationCorrect: 2,
        memorizationIncorrect: 1,
        memorizationStillLearning: 2,
        memorizationStreak: 1,
      };

      const priority = scheduler.recalculatePriorityAfterAnswer(progress);

      // basePriority=75, timeBoost=20 (上限)
      expect(priority).toBeCloseTo(95, 1);
    });

    it('incorrect + 時間経過で最高優先度120', () => {
      const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;

      const progress: WordProgress = {
        word: 'test',
        correctCount: 1,
        incorrectCount: 4,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 2,
        lastStudied: tenDaysAgo,
        totalResponseTime: 15000,
        averageResponseTime: 3000,
        difficultyScore: 80,
        masteryLevel: 'learning',
        responseTimes: [3000, 3000, 3000, 3000, 3000],
        calculatedPriority: 0,
        lastPriorityUpdate: 0,
        accuracyRate: 0.2,
        memorizationAttempts: 5,
      };

      const priority = scheduler.recalculatePriorityAfterAnswer(progress);

      // basePriority=100, timeBoost=20 (10日*2, 上限)
      expect(priority).toBeCloseTo(120, 1);
    });

    it('未定義カテゴリーはデフォルト50を使用', () => {
      const progress: WordProgress = {
        word: 'test',
        correctCount: 0,
        incorrectCount: 0,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 0,
        lastStudied: Date.now(),
        totalResponseTime: 0,
        averageResponseTime: 0,
        difficultyScore: 0,
        masteryLevel: 'new',
        responseTimes: [],
        calculatedPriority: 0,
        lastPriorityUpdate: 0,
        accuracyRate: 0,
        memorizationAttempts: 0,
      };

      const priority = scheduler.recalculatePriorityAfterAnswer(progress);

      // デフォルト=50, timeBoost=0
      expect(priority).toBeCloseTo(50, 1);
    });

    it('WordProgressに計算結果を格納', () => {
      const progress: WordProgress = {
        word: 'test',
        correctCount: 3,
        incorrectCount: 2,
        consecutiveCorrect: 1,
        consecutiveIncorrect: 0,
        lastStudied: Date.now(),
        totalResponseTime: 15000,
        averageResponseTime: 3000,
        difficultyScore: 40,
        masteryLevel: 'learning',
        responseTimes: [3000, 3000, 3000, 3000, 3000],
        calculatedPriority: 0,
        lastPriorityUpdate: 0,
        accuracyRate: 0.6,
        memorizationAttempts: 5,
        memorizationCorrect: 2,
        memorizationIncorrect: 1,
        memorizationStillLearning: 2,
        memorizationStreak: 1,
      };

      scheduler.recalculatePriorityAfterAnswer(progress);

      // WordProgress.calculatedPriorityが更新される
      expect(progress.calculatedPriority).toBeCloseTo(75, 1);
      expect(progress.lastPriorityUpdate).toBeGreaterThan(0);
      expect(progress.accuracyRate).toBeCloseTo(0.6, 2); // 3/5
    });
  });

  describe('performance requirements', () => {
    it('1000語の優先度計算を200ms以内に完了', () => {
      const testWords: WordProgress[] = [];

      for (let i = 0; i < 1000; i++) {
        const totalAttempts = Math.floor(Math.random() * 10) + 1;
        const correctCount = Math.floor(Math.random() * totalAttempts);
        const incorrectCount = totalAttempts - correctCount;
        const responseTimes = Array(totalAttempts).fill(3000);

        testWords.push({
          word: `test_${i}`,
          correctCount,
          incorrectCount,
          consecutiveCorrect: Math.floor(Math.random() * 5),
          consecutiveIncorrect: 0,
          lastStudied: Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000,
          totalResponseTime: totalAttempts * 3000,
          averageResponseTime: 3000,
          difficultyScore: Math.floor(Math.random() * 100),
          masteryLevel: ['new', 'learning', 'mastered'][Math.floor(Math.random() * 3)] as any,
          responseTimes,
          calculatedPriority: 0,
          lastPriorityUpdate: 0,
          accuracyRate: correctCount / totalAttempts,
          memorizationAttempts: totalAttempts,
        });
      }

      const startTime = performance.now();

      testWords.forEach((wp) => {
        scheduler.recalculatePriorityAfterAnswer(wp);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200);
    });
  });
});
