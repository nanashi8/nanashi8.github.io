import { describe, it, expect, beforeEach } from 'vitest';
import { QuestionScheduler } from '@/ai/scheduler/QuestionScheduler';
import type { Question } from '@/types';

describe('Position階層の不変条件検証', () => {
  let scheduler: QuestionScheduler;

  beforeEach(() => {
    scheduler = new QuestionScheduler();
    sessionStorage.clear();
  });

  const createTestQuestion = (word: string): Question => ({
    word,
    meaning: 'test',
    reading: 'test',
    source: 'junior' as const,
    etymology: '',
    relatedWords: '',
    relatedFields: '',
    difficulty: 'easy' as const,
  });

  it('【不変条件1】スケジューラが正常に動作する', async () => {
    const questions: Question[] = [
      createTestQuestion('test1'),
      createTestQuestion('test2'),
      createTestQuestion('test3'),
    ];

    const result = await scheduler.schedule({
      questions,
      mode: 'memorization',
      useCategorySlots: true,
      limits: { learningLimit: 10, reviewLimit: 20 },
      sessionStats: { correct: 0, incorrect: 0, still_learning: 0, mastered: 0 },
    });

    expect(result.scheduledQuestions.length).toBeGreaterThan(0);
  });

  it('【不変条件2】バッチ内に重複語がない', async () => {
    const questions: Question[] = [
      createTestQuestion('duplicate'),
      createTestQuestion('duplicate'),
      createTestQuestion('duplicate'),
      createTestQuestion('other'),
    ];

    const result = await scheduler.schedule({
      questions,
      mode: 'memorization',
      useCategorySlots: true,
      limits: { learningLimit: 10, reviewLimit: 20 },
      sessionStats: { correct: 0, incorrect: 0, still_learning: 0, mastered: 0 },
    });

    const words = result.scheduledQuestions.map((q) => q.word);
    const uniqueWords = new Set(words);

    expect(words.length).toBe(uniqueWords.size);
  });
});
