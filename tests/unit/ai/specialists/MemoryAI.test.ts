/**
 * MemoryAI Unit Tests
 *
 * Phase 1.1: カテゴリー判定のテスト（TDD Red phase）
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryAI } from '../../../../src/ai/specialists/MemoryAI';
import type { WordProgress } from '../../../../src/storage/progress/types';

describe('MemoryAI', () => {
  let memoryAI: MemoryAI;

  beforeEach(() => {
    memoryAI = new MemoryAI();
  });

  describe('determineCategoryPublic', () => {
    it('新規語句（未出題）をnewとして判定', () => {
      const progress: WordProgress = {
        word: 'test',
        correctCount: 0,
        incorrectCount: 0,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 0,
        lastStudied: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        difficultyScore: 50,
        masteryLevel: 'new',
        responseTimes: [],
        memorizationAttempts: 0,
      };

      const category = memoryAI.determineCategoryPublic(progress);
      expect(category).toBe('new');
    });

    it('正答率80%以上＆連続3回正解でmastered判定', () => {
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
        masteryLevel: 'learning',
        responseTimes: [3000, 3000, 3000, 3000, 3000],
        memorizationAttempts: 5,
      };

      const category = memoryAI.determineCategoryPublic(progress);
      expect(category).toBe('mastered');
    });

    it('正答率70%以上＆5回以上挑戦でmastered判定', () => {
      const progress: WordProgress = {
        word: 'test',
        correctCount: 4,
        incorrectCount: 1,
        consecutiveCorrect: 1,
        consecutiveIncorrect: 0,
        lastStudied: Date.now(),
        totalResponseTime: 15000,
        averageResponseTime: 3000,
        difficultyScore: 30,
        masteryLevel: 'learning',
        responseTimes: [3000, 3000, 3000, 3000, 3000],
        memorizationAttempts: 5,
      };

      const category = memoryAI.determineCategoryPublic(progress);
      expect(category).toBe('mastered');
    });

    it('正答率30%未満でincorrect判定', () => {
      const progress: WordProgress = {
        word: 'test',
        correctCount: 1,
        incorrectCount: 4,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 2,
        lastStudied: Date.now(),
        totalResponseTime: 15000,
        averageResponseTime: 3000,
        difficultyScore: 80,
        masteryLevel: 'learning',
        responseTimes: [3000, 3000, 3000, 3000, 3000],
        memorizationAttempts: 5,
      };

      // accuracy = 1/5 = 0.2 (20%) < 30%
      const category = memoryAI.determineCategoryPublic(progress);
      expect(category).toBe('incorrect');
    });

    it('連続2回不正解でincorrect判定', () => {
      const progress: WordProgress = {
        word: 'test',
        correctCount: 1,
        incorrectCount: 4,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 2,
        lastStudied: Date.now(),
        totalResponseTime: 15000,
        averageResponseTime: 3000,
        difficultyScore: 80,
        masteryLevel: 'learning',
        responseTimes: [3000, 3000, 3000, 3000, 3000],
        memorizationAttempts: 5,
      };

      // accuracy = 1/5 = 0.2 (20%) < 30%
      // 連続2回不正解は正答率が低い傾向があるため、incorrectと判定される
      const category = memoryAI.determineCategoryPublic(progress);
      expect(category).toBe('incorrect');
    });

    it('まだまだを0.5回正解として計算', () => {
      const progress: WordProgress = {
        word: 'test',
        correctCount: 2,
        incorrectCount: 0,
        consecutiveCorrect: 1,
        consecutiveIncorrect: 0,
        lastStudied: Date.now(),
        totalResponseTime: 12000,
        averageResponseTime: 3000,
        difficultyScore: 40,
        masteryLevel: 'learning',
        responseTimes: [3000, 3000, 3000, 3000],
        memorizationAttempts: 4,
        memorizationStillLearning: 2, // まだまだ2回 = 正解1回相当
      };

      // effectiveCorrect = 2 + 2*0.5 = 3
      // accuracy = 3/4 = 0.75
      // 75%は70%以上だが5回未満なのでstill_learning
      const category = memoryAI.determineCategoryPublic(progress);
      expect(category).toBe('still_learning');
    });

    it('中間的な成績でstill_learning判定', () => {
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
        memorizationAttempts: 5,
      };

      // accuracy = 3/5 = 0.6 (60%)
      // 30%以上なのでincorrectではない
      // 80%未満なのでmasteredではない
      const category = memoryAI.determineCategoryPublic(progress);
      expect(category).toBe('still_learning');
    });

    it('境界値テスト: 正答率80%ちょうどで連続3回正解', () => {
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
        masteryLevel: 'learning',
        responseTimes: [3000, 3000, 3000, 3000, 3000],
        memorizationAttempts: 5,
      };

      // accuracy = 4/5 = 0.8 (80%)
      const category = memoryAI.determineCategoryPublic(progress);
      expect(category).toBe('mastered');
    });

    it('境界値テスト: 正答率30%ちょうど', () => {
      const progress: WordProgress = {
        word: 'test',
        correctCount: 3,
        incorrectCount: 7,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 1,
        lastStudied: Date.now(),
        totalResponseTime: 30000,
        averageResponseTime: 3000,
        difficultyScore: 70,
        masteryLevel: 'learning',
        responseTimes: [3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000],
        memorizationAttempts: 10,
      };

      // accuracy = 3/10 = 0.3 (30%)
      // 30%未満ではないのでincorrectではない
      const category = memoryAI.determineCategoryPublic(progress);
      expect(category).toBe('still_learning');
    });

    it('境界値テスト: 正答率70%ちょうどで5回挑戦', () => {
      const progress: WordProgress = {
        word: 'test',
        correctCount: 3.5,
        incorrectCount: 1.5,
        consecutiveCorrect: 1,
        consecutiveIncorrect: 0,
        lastStudied: Date.now(),
        totalResponseTime: 15000,
        averageResponseTime: 3000,
        difficultyScore: 30,
        masteryLevel: 'learning',
        responseTimes: [3000, 3000, 3000, 3000, 3000],
        memorizationAttempts: 5,
        memorizationStillLearning: 1, // まだまだ1回
      };

      // effectiveCorrect = 3 + 1*0.5 = 3.5
      // accuracy = 3.5/5 = 0.7 (70%)
      const category = memoryAI.determineCategoryPublic(progress);
      expect(category).toBe('mastered');
    });
  });

  describe('analyze - category integration', () => {
    it('新規語句をanalizeした際にnewカテゴリーを返す', () => {
      const result = memoryAI.analyze({
        word: 'test',
        currentTab: 'memorization',
        progress: null,
        sessionStats: {
          correct: 0,
          incorrect: 0,
          total: 0,
        },
        allProgress: [],
      });

      expect(result.category).toBe('new');
      expect(result.aiId).toBe('memory');
    });

    it('定着済み語句をanalizeした際にmasteredカテゴリーを返す', () => {
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
        memorizationAttempts: 5,
      };

      const result = memoryAI.analyze({
        word: 'test',
        currentTab: 'memorization',
        progress,
        sessionStats: {
          correct: 4,
          incorrect: 1,
          total: 5,
        },
        allProgress: [progress],
      });

      expect(result.category).toBe('mastered');
    });
  });

  describe('performance requirements', () => {
    it('1000語の処理を200ms以内に完了', () => {
      const testWords: WordProgress[] = [];

      for (let i = 0; i < 1000; i++) {
        testWords.push({
          word: `test_${i}`,
          correctCount: Math.floor(Math.random() * 10),
          incorrectCount: Math.floor(Math.random() * 5),
          consecutiveCorrect: Math.floor(Math.random() * 5),
          consecutiveIncorrect: 0,
          lastStudied: Date.now(),
          totalResponseTime: Math.floor(Math.random() * 30000),
          averageResponseTime: Math.floor(Math.random() * 5000),
          difficultyScore: Math.floor(Math.random() * 100),
          masteryLevel: 'learning',
          responseTimes: [3000, 3000, 3000],
          memorizationAttempts: Math.floor(Math.random() * 10),
          memorizationStillLearning: Math.floor(Math.random() * 2),
        });
      }

      const startTime = performance.now();

      testWords.forEach((wp) => {
        memoryAI.determineCategoryPublic(wp);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200);
    });
  });
});
