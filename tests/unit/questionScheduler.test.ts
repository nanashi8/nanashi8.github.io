import { describe, it, expect, beforeEach } from 'vitest';
import { QuestionScheduler } from '@/ai/scheduler/QuestionScheduler';
import type { Question } from '@/types';

describe('QuestionScheduler - 統合テスト', () => {
  let scheduler: QuestionScheduler;
  let sampleQuestions: Question[];

  beforeEach(() => {
    scheduler = new QuestionScheduler();

    sampleQuestions = [
      {
        word: 'apple',
        meaning: 'りんご',
        reading: 'アップル',
        difficulty: '',
        relatedWords: '',
        relatedFields: '',
        type: 'word',
        etymology: '',
      },
      {
        word: 'book',
        meaning: '本',
        reading: 'ブック',
        difficulty: '',
        relatedWords: '',
        relatedFields: '',
        type: 'word',
        etymology: '',
      },
      {
        word: 'computer',
        meaning: 'コンピューター',
        reading: 'コンピューター',
        difficulty: '',
        relatedWords: '',
        relatedFields: '',
        type: 'word',
        etymology: '',
      },
    ] as Question[];
  });

  describe('基本機能', () => {
    it('問題をスケジュールできる', async () => {
      const result = await scheduler.schedule({
        questions: sampleQuestions,
        mode: 'memorization',
        limits: { learningLimit: null, reviewLimit: null },
        sessionStats: { correct: 0, incorrect: 0, still_learning: 0, mastered: 0 },
      });

      expect(result).toBeDefined();
      expect(result.scheduledQuestions).toHaveLength(3);
      expect(result.vibrationScore).toBeGreaterThanOrEqual(0);
      expect(result.vibrationScore).toBeLessThanOrEqual(100);
    });

    it('すべての問題が含まれる', async () => {
      const result = await scheduler.schedule({
        questions: sampleQuestions,
        mode: 'memorization',
        limits: { learningLimit: null, reviewLimit: null },
        sessionStats: { correct: 1, incorrect: 0, still_learning: 1, mastered: 1 },
      });

      const scheduledWords = result.scheduledQuestions.map((q) => q.word);
      expect(scheduledWords).toContain('apple');
      expect(scheduledWords).toContain('book');
      expect(scheduledWords).toContain('computer');
    });
  });

  describe('エッジケース', () => {
    it('問題が0件でもエラーにならない', async () => {
      const result = await scheduler.schedule({
        questions: [],
        mode: 'memorization',
        limits: { learningLimit: null, reviewLimit: null },
        sessionStats: { correct: 0, incorrect: 0, still_learning: 0, mastered: 0 },
      });

      expect(result.scheduledQuestions).toHaveLength(0);
    });

    it('問題が1件でも動作する', async () => {
      const result = await scheduler.schedule({
        questions: [sampleQuestions[0]],
        mode: 'memorization',
        limits: { learningLimit: null, reviewLimit: null },
        sessionStats: { correct: 0, incorrect: 0, still_learning: 0, mastered: 0 },
      });

      expect(result.scheduledQuestions).toHaveLength(1);
      expect(result.scheduledQuestions[0].word).toBe('apple');
    });
  });

  describe('パフォーマンス', () => {
    it('大量の問題を高速に処理できる', async () => {
      const largeQuestionSet: Question[] = Array.from({ length: 100 }, (_, i) => ({
        word: `word${i}`,
        meaning: `意味${i}`,
        reading: `読み${i}`,
        difficulty: '',
        relatedWords: '',
        relatedFields: '',
        type: 'word',
        etymology: '',
      }));

      const startTime = performance.now();
      const result = await scheduler.schedule({
        questions: largeQuestionSet,
        mode: 'memorization',
        limits: { learningLimit: null, reviewLimit: null },
        sessionStats: { correct: 10, incorrect: 2, still_learning: 30, mastered: 58 },
      });
      const endTime = performance.now();

      expect(result.scheduledQuestions).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(200);
    });
  });
});
