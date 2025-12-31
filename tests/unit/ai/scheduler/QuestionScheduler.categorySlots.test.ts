import { describe, it, expect, beforeEach } from 'vitest';
import { QuestionScheduler } from '../../../../src/ai/scheduler/QuestionScheduler';
import { updateProgressCache } from '../../../../src/storage/progress/progressStorage';
import { CURRENT_PROGRESS_SCHEMA_VERSION } from '../../../../src/storage/progress/progressSchema';
import type { UserProgress, WordProgress } from '../../../../src/storage/progress/types';
import type { Question } from '../../../../src/types';

function createEmptyProgress(): UserProgress {
  return {
    schemaVersion: CURRENT_PROGRESS_SCHEMA_VERSION,
    results: [],
    statistics: {
      totalQuizzes: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      averageScore: 0,
      bestScore: 0,
      streakDays: 0,
      lastStudyDate: 0,
      studyDates: [],
    },
    questionSetStats: {},
    categoryStats: {},
    difficultyStats: {},
    wordProgress: {},
  };
}

function makeQuestion(word: string): Question {
  return {
    word,
    reading: 'r',
    meaning: 'm',
    etymology: 'e',
    relatedWords: '',
    relatedFields: '',
    difficulty: 'beginner',
  };
}

function makeBaseWordProgress(word: string): WordProgress {
  return {
    word,
    correctCount: 0,
    incorrectCount: 0,
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
    lastStudied: Date.now(),
    totalResponseTime: 0,
    averageResponseTime: 0,
    difficultyScore: 0,
    masteryLevel: 'learning',
    responseTimes: [],
  };
}

describe('QuestionScheduler - category slots scheduling', () => {
  beforeEach(() => {
    updateProgressCache(createEmptyProgress());
    localStorage.clear();
    sessionStorage.clear(); // 振動防止用の直近履歴もクリア
  });

  it('useCategorySlots=true は最大100問に制限し、出力は入力語の部分集合で重複しない', async () => {
    const scheduler = new QuestionScheduler();
    // 振動防止用の直近履歴をクリア
    (scheduler as any).recentAnswersCache.clear();

    const questions = Array.from({ length: 150 }, (_, i) => makeQuestion(`w_${i}`));

    const result = await scheduler.schedule({
      questions,
      mode: 'memorization',
      limits: { learningLimit: null, reviewLimit: null },
      sessionStats: { correct: 0, incorrect: 0, still_learning: 0, mastered: 0 },
      useCategorySlots: true,
    });

    expect(result.scheduledQuestions.length).toBe(100);

    const outputWords = result.scheduledQuestions.map((q) => q.word);
    expect(new Set(outputWords).size).toBe(outputWords.length);

    const inputWords = new Set(questions.map((q) => q.word));
    expect(outputWords.every((w) => inputWords.has(w))).toBe(true);
  });

  it('incorrect語が少数なら、カテゴリースロット方式で全て採用される', async () => {
    const scheduler = new QuestionScheduler();
    // 振動防止用の直近履歴をクリア
    (scheduler as any).recentAnswersCache.clear();

    const questions = Array.from({ length: 80 }, (_, i) => makeQuestion(`w_${i}`));

    const progress = createEmptyProgress();
    const incorrectWords = ['w_1', 'w_2', 'w_3', 'w_4', 'w_5'];

    for (const w of incorrectWords) {
      progress.wordProgress[w] = {
        ...makeBaseWordProgress(w),
        lastStudied: 0, // 振動防止の対象外にする
        memorizationAttempts: 5,
        memorizationCorrect: 0,
        memorizationStillLearning: 0,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 2,
      };
    }

    updateProgressCache(progress);

    const result = await scheduler.schedule({
      questions,
      mode: 'memorization',
      limits: { learningLimit: null, reviewLimit: null },
      sessionStats: { correct: 0, incorrect: 0, still_learning: 0, mastered: 0 },
      useCategorySlots: true,
    });

    const outputWords = new Set(result.scheduledQuestions.map((q) => q.word));
    for (const w of incorrectWords) {
      expect(outputWords.has(w)).toBe(true);
    }
  });
});
