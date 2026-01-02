/**
 * QuestionScheduler Priority Calculation Tests
 *
 * Phase 1.2: 優先度計算のテスト（TDD Red phase）
 *
 * 現行仕様:
 * - recalculatePriorityAfterAnswer() は「カテゴリ」ではなく Position(0-100) を返す
 * - Positionは determineWordPosition()（タブ別カウント + 時間経過 + 連続正解/不正解）で算出される
 * - 解答直後は savedPosition を一時的に無視して再計算する
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
    it('連続不正解3回でincorrect（Position 85）', () => {
      const progress: WordProgress = {
        word: 'test',
        correctCount: 1,
        incorrectCount: 4,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 3,
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
        memorizationCorrect: 1,
        memorizationStillLearning: 0,
      };

      const priority = scheduler.recalculatePriorityAfterAnswer("test", progress, "memorization");

      expect(priority).toBe(85);
    });

    it('連続1回正解・低精度でstill_learning（Position 45）', () => {
      const progress: WordProgress = {
        word: 'test',
        correctCount: 2,
        incorrectCount: 3,
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
        accuracyRate: 0.4,
        memorizationAttempts: 5,
        memorizationCorrect: 2,
        memorizationStillLearning: 0,
        memorizationStreak: 1,
      };

      const priority = scheduler.recalculatePriorityAfterAnswer("test", progress, "memorization");

      // baseScore = 50 - (0.4 * 30) = 38 だが、still_learning の下限（STILL_LEARNING_LOW=45）に丸める
      expect(priority).toBe(45);
    });

    it('未出題（attempts=0）はnew（Position 35）', () => {
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

      const priority = scheduler.recalculatePriorityAfterAnswer("test", progress, "memorization");

      expect(priority).toBe(35);
    });

    it('連続3回正解でmastered（Position 10）', () => {
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
        memorizationStillLearning: 1,
        memorizationStreak: 3,
      };

      const priority = scheduler.recalculatePriorityAfterAnswer('test', progress, 'memorization');

      expect(priority).toBe(10);
    });

    it('時間経過ブースト（最大+15）がPositionに反映される', () => {
      const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
      const progress: WordProgress = {
        word: 'test',
        correctCount: 7,
        incorrectCount: 3,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 0,
        lastStudied: tenDaysAgo,
        totalResponseTime: 30000,
        averageResponseTime: 3000,
        difficultyScore: 40,
        masteryLevel: 'learning',
        responseTimes: [3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000],
        calculatedPriority: 0,
        lastPriorityUpdate: 0,
        accuracyRate: 0.7,
        memorizationAttempts: 10,
        memorizationCorrect: 7,
        memorizationStillLearning: 0,
      };

      const priority = scheduler.recalculatePriorityAfterAnswer("test", progress, "memorization");

      // baseScore(accuracy=0.7)=29 + timeBoost(10日→+15)=44（上限+15）
      expect(priority).toBe(44);
    });

    it('解答直後は savedPosition を無視して再計算する', () => {
      const progress: WordProgress = {
        word: 'test',
        correctCount: 1,
        incorrectCount: 4,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 3,
        lastStudied: Date.now(),
        totalResponseTime: 15000,
        averageResponseTime: 3000,
        difficultyScore: 80,
        masteryLevel: 'learning',
        responseTimes: [3000, 3000, 3000, 3000, 3000],
        calculatedPriority: 0,
        lastPriorityUpdate: 0,
        accuracyRate: 0.2,
        memorizationAttempts: 5,
        memorizationCorrect: 1,
        memorizationStillLearning: 0,
        memorizationPosition: 10, // savedPosition（古い値）
      };

      const priority = scheduler.recalculatePriorityAfterAnswer('test', progress, 'memorization');
      expect(priority).toBe(85);
    });

    it('accuracyRate（全体カウント由来）を更新する', () => {
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
        memorizationStillLearning: 2,
        memorizationStreak: 1,
      };

      scheduler.recalculatePriorityAfterAnswer("test", progress, "memorization");

      expect(progress.accuracyRate).toBeCloseTo(0.6, 2); // 3/5
    });
  });

  describe('performance requirements', () => {
    it('1000語の計算が完了し、Positionが範囲内に収まる', () => {
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
          memorizationCorrect: correctCount,
        });
      }

      const results = testWords.map((wp) =>
        scheduler.recalculatePriorityAfterAnswer('test', wp, 'memorization')
      );

      expect(results).toHaveLength(1000);
      results.forEach((p) => {
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(100);
      });
    });
  });
});
