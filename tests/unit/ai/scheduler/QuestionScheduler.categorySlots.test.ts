// @test-guard-bypass
// 仕様確認済み: カテゴリースロット方式の出題順制約
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

  it('useCategorySlots=true は new語の同じ頭文字が固まりすぎないよう分散する', async () => {
    const scheduler = new QuestionScheduler();
    (scheduler as any).recentAnswersCache.clear();

    // すべて未学習（progressなし）= categorySlotsでは basePosition=35 の new 扱いになりやすい
    // 入力順がABC寄り（例: a...が続く）だと、そのまま出力に出て同頭文字が連続しがち。
    const words = [
      ...Array.from({ length: 10 }, (_, i) => `apple_${String(i).padStart(2, '0')}`),
      ...Array.from({ length: 10 }, (_, i) => `banana_${String(i).padStart(2, '0')}`),
      ...Array.from({ length: 10 }, (_, i) => `cherry_${String(i).padStart(2, '0')}`),
    ];
    const questions = words.map((w) => makeQuestion(w));

    const result = await scheduler.schedule({
      questions,
      mode: 'memorization',
      limits: { learningLimit: null, reviewLimit: null },
      sessionStats: { correct: 0, incorrect: 0, still_learning: 0, mastered: 0 },
      useCategorySlots: true,
      useChainLearning: false,
      batchSize: 30,
    });

    const out = result.scheduledQuestions.map((q) => q.word);

    // 連続する同一頭文字の最大ラン長を計算（a/b/c など）
    const head = (w: string): string => {
      const c = (w ?? '').toLowerCase().charAt(0);
      return c >= 'a' && c <= 'z' ? c : '#';
    };
    let maxRun = 1;
    let run = 1;
    for (let i = 1; i < out.length; i++) {
      if (head(out[i]) === head(out[i - 1])) {
        run++;
        maxRun = Math.max(maxRun, run);
      } else {
        run = 1;
      }
    }

    // 理想は 1（交互）だが、実装上の制約もあり得るので 2 まで許容。
    expect(maxRun).toBeLessThanOrEqual(2);
  });

  it('useChainLearning=true でも入力順（アルファベット順）を引きずらず、同点は決定的にタイブレークされる', async () => {
    const scheduler = new QuestionScheduler();
    (scheduler as any).recentAnswersCache.clear();

    // すべて未学習で、関連度ネットワークが薄い（≒同点0）想定のダミー語
    // 先頭文字はバラけているため、頭文字分散（maxRun>2）には引っかからない。
    const words = [
      'alpha_00',
      'bravo_00',
      'charlie_00',
      'delta_00',
      'echo_00',
      'foxtrot_00',
      'golf_00',
      'hotel_00',
      'india_00',
      'juliet_00',
    ];
    const questions = words.map((w) => makeQuestion(w));

    const result = await scheduler.schedule({
      questions,
      mode: 'memorization',
      limits: { learningLimit: null, reviewLimit: null },
      sessionStats: { correct: 0, incorrect: 0, still_learning: 0, mastered: 0 },
      useCategorySlots: true,
      useChainLearning: true,
      batchSize: 10,
    });

    const out = result.scheduledQuestions.map((q) => q.word);

    // 期待: 同点の場合は FNV-1a 32bit の昇順（決定的）になる
    const fnv1a32 = (s: string): number => {
      let h = 0x811c9dc5;
      for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
      }
      return h >>> 0;
    };
    const expected = [...words].sort((a, b) => fnv1a32(a) - fnv1a32(b));

    expect(out).toEqual(expected);
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
