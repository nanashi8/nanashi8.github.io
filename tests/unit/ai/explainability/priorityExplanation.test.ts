/**
 * Priority Explanation Tests
 *
 * 優先度説明機能のテスト
 */

import { describe, it, expect } from 'vitest';
import {
  explainPriority,
  getPriorityColor,
  getPriorityLabel,
  // type PriorityExplanation,
} from '../../../../src/ai/explainability/priorityExplanation';
import type { WordProgress } from '../../../../src/storage/progress/types';

describe('Priority Explanation', () => {
  describe('explainPriority', () => {
    it('苦手単語（incorrect）の説明を生成', () => {
      const progress: WordProgress = {
        word: 'difficult',
        correctCount: 1,
        incorrectCount: 9,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 3,
        lastStudied: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2日前
        totalResponseTime: 50000,
        averageResponseTime: 5000,
        difficultyScore: 90,
        masteryLevel: 'learning',
        responseTimes: [5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000],
        calculatedPriority: 110,
        lastPriorityUpdate: Date.now(),
        accuracyRate: 0.1,
        memorizationAttempts: 10,
        memorizationPosition: 85,
      };

      const explanation = explainPriority(progress);

      expect(explanation.category).toBe('incorrect');
      expect(explanation.priority).toBe(110);
      expect(explanation.factors.length).toBeGreaterThan(0);
      expect(explanation.userMessage).toContain('苦手');
      expect(explanation.mainReason).toBeTruthy();
    });

    it('学習中（still_learning）の説明を生成', () => {
      const progress: WordProgress = {
        word: 'learning',
        correctCount: 5,
        incorrectCount: 3,
        consecutiveCorrect: 1,
        consecutiveIncorrect: 0,
        lastStudied: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1日前
        totalResponseTime: 24000,
        averageResponseTime: 3000,
        difficultyScore: 40,
        masteryLevel: 'learning',
        responseTimes: [3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000],
        calculatedPriority: 77,
        lastPriorityUpdate: Date.now(),
        accuracyRate: 0.625,
        memorizationAttempts: 8,
        memorizationPosition: 65,
      };

      const explanation = explainPriority(progress);

      expect(explanation.category).toBe('still_learning');
      expect(explanation.priority).toBe(77);
      expect(explanation.userMessage).toBeTruthy();
    });

    it('新規単語（new）の説明を生成', () => {
      const progress: WordProgress = {
        word: 'new',
        correctCount: 0,
        incorrectCount: 0,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 0,
        lastStudied: Date.now(),
        totalResponseTime: 0,
        averageResponseTime: 0,
        difficultyScore: 50,
        masteryLevel: 'new',
        responseTimes: [],
        calculatedPriority: 50,
        lastPriorityUpdate: Date.now(),
        accuracyRate: 0,
        memorizationAttempts: 0,
        memorizationPosition: 35,
      };

      const explanation = explainPriority(progress);

      expect(explanation.category).toBe('new');
      expect(explanation.priority).toBe(50);
      expect(explanation.userMessage).toContain('新しい');
      expect(explanation.recommendedAction).toBeTruthy();
    });

    it('定着済み（mastered）の説明を生成', () => {
      const progress: WordProgress = {
        word: 'mastered',
        correctCount: 10,
        incorrectCount: 1,
        consecutiveCorrect: 5,
        consecutiveIncorrect: 0,
        lastStudied: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10日前
        totalResponseTime: 33000,
        averageResponseTime: 3000,
        difficultyScore: 10,
        masteryLevel: 'mastered',
        responseTimes: [3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000],
        calculatedPriority: 30,
        lastPriorityUpdate: Date.now(),
        accuracyRate: 0.91,
        memorizationAttempts: 11,
        memorizationPosition: 10,
      };

      const explanation = explainPriority(progress);

      expect(explanation.category).toBe('mastered');
      expect(explanation.priority).toBe(30);
      expect(explanation.factors.some((f) => f.name === '復習タイミング')).toBe(true);
    });

    it('時間経過ブーストを正しく計算', () => {
      const progress: WordProgress = {
        word: 'test',
        correctCount: 5,
        incorrectCount: 2,
        consecutiveCorrect: 1,
        consecutiveIncorrect: 0,
        lastStudied: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5日前
        totalResponseTime: 21000,
        averageResponseTime: 3000,
        difficultyScore: 30,
        masteryLevel: 'learning',
        responseTimes: [3000, 3000, 3000, 3000, 3000, 3000, 3000],
        calculatedPriority: 85,
        lastPriorityUpdate: Date.now(),
        accuracyRate: 0.71,
        memorizationAttempts: 7,
      };

      const explanation = explainPriority(progress);
      const timeBoostFactor = explanation.factors.find((f) => f.name === '復習タイミング');

      expect(timeBoostFactor).toBeDefined();
      expect(timeBoostFactor?.impact).toBe(10); // 5日 * 2 = 10pt
      expect(timeBoostFactor?.description).toContain('5日間');
    });

    it('連続不正解ペナルティを計算', () => {
      const progress: WordProgress = {
        word: 'test',
        correctCount: 2,
        incorrectCount: 5,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 4,
        lastStudied: Date.now(),
        totalResponseTime: 21000,
        averageResponseTime: 3000,
        difficultyScore: 70,
        masteryLevel: 'learning',
        responseTimes: [3000, 3000, 3000, 3000, 3000, 3000, 3000],
        calculatedPriority: 120,
        lastPriorityUpdate: Date.now(),
        accuracyRate: 0.29,
        memorizationAttempts: 7,
      };

      const explanation = explainPriority(progress);
      const consecutiveFactor = explanation.factors.find((f) => f.name === '連続不正解');

      expect(consecutiveFactor).toBeDefined();
      expect(consecutiveFactor?.impact).toBe(20); // 4回 * 5 = 20pt
      expect(consecutiveFactor?.icon).toBe('⚠️');
    });

    it('忘却リスクを計算', () => {
      const progress: WordProgress = {
        word: 'test',
        correctCount: 5,
        incorrectCount: 2,
        consecutiveCorrect: 1,
        consecutiveIncorrect: 0,
        lastStudied: Date.now() - 7 * 24 * 60 * 60 * 1000,
        totalResponseTime: 21000,
        averageResponseTime: 3000,
        difficultyScore: 30,
        masteryLevel: 'learning',
        responseTimes: [3000, 3000, 3000, 3000, 3000, 3000, 3000],
        calculatedPriority: 90,
        lastPriorityUpdate: Date.now(),
        accuracyRate: 0.71,
        memorizationAttempts: 7,
        lastRetentionRate: 0.3, // 記憶保持率30%
      };

      const explanation = explainPriority(progress);
      const riskFactor = explanation.factors.find((f) => f.name === '忘却リスク');

      expect(riskFactor).toBeDefined();
      expect(riskFactor?.impact).toBeGreaterThan(0);
      expect(riskFactor?.icon).toBe('🧠');
    });

    it('要因を影響度順にソート', () => {
      const progress: WordProgress = {
        word: 'test',
        correctCount: 1,
        incorrectCount: 9,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 5,
        lastStudied: Date.now() - 10 * 24 * 60 * 60 * 1000,
        totalResponseTime: 30000,
        averageResponseTime: 3000,
        difficultyScore: 90,
        masteryLevel: 'learning',
        responseTimes: [3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000],
        calculatedPriority: 145,
        lastPriorityUpdate: Date.now(),
        accuracyRate: 0.1,
        memorizationAttempts: 10,
        lastRetentionRate: 0.2,
      };

      const explanation = explainPriority(progress);

      // 最初の要因が最も影響度が大きい
      for (let i = 0; i < explanation.factors.length - 1; i++) {
        expect(explanation.factors[i].impact).toBeGreaterThanOrEqual(
          explanation.factors[i + 1].impact
        );
      }
    });

    it('メイン理由が最大影響要因と一致', () => {
      const progress: WordProgress = {
        word: 'test',
        correctCount: 1,
        incorrectCount: 9,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 0,
        lastStudied: Date.now(),
        totalResponseTime: 30000,
        averageResponseTime: 3000,
        difficultyScore: 90,
        masteryLevel: 'learning',
        responseTimes: [3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000],
        calculatedPriority: 100,
        lastPriorityUpdate: Date.now(),
        accuracyRate: 0.1,
        memorizationAttempts: 10,
      };

      const explanation = explainPriority(progress);

      // mainReasonは最大影響要因の説明と一致すべき
      expect(explanation.mainReason).toBe(explanation.factors[0].description);
    });
  });

  describe('getPriorityColor', () => {
    it('優先度に応じた色を返す', () => {
      expect(getPriorityColor(120)).toContain('red');
      expect(getPriorityColor(90)).toContain('orange');
      expect(getPriorityColor(60)).toContain('yellow');
      expect(getPriorityColor(30)).toContain('blue');
      expect(getPriorityColor(10)).toContain('green');
    });
  });

  describe('getPriorityLabel', () => {
    it('優先度に応じたラベルを返す', () => {
      expect(getPriorityLabel(120)).toBe('最優先');
      expect(getPriorityLabel(90)).toBe('優先');
      expect(getPriorityLabel(60)).toBe('通常');
      expect(getPriorityLabel(30)).toBe('低');
      expect(getPriorityLabel(10)).toBe('最低');
    });
  });

  describe('edge cases', () => {
    it('lastStudiedがundefinedでも動作', () => {
      const progress: WordProgress = {
        word: 'test',
        correctCount: 0,
        incorrectCount: 0,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 0,
        lastStudied: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        difficultyScore: 0,
        masteryLevel: 'new',
        responseTimes: [],
        calculatedPriority: 50,
        lastPriorityUpdate: Date.now(),
        accuracyRate: 0,
        memorizationAttempts: 0,
      };

      const explanation = explainPriority(progress);
      expect(explanation).toBeDefined();
      expect(explanation.factors.some((f) => f.name === '復習タイミング')).toBe(false);
    });

    it('categoryがundefinedの場合はnewとして扱う', () => {
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
        calculatedPriority: 50,
        lastPriorityUpdate: Date.now(),
        accuracyRate: 0,
        memorizationAttempts: 0,
      };

      const explanation = explainPriority(progress);
      expect(explanation.category).toBe('new');
    });
  });
});
