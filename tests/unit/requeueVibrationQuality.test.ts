// @test-guard-bypass: 非コンテンツ系の品質テスト（振動=近すぎる再出題の再発防止）。seed固定のfuzzで再現性を担保する。
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useQuestionRequeue } from '@/hooks/useQuestionRequeue';
import { updateProgressCache } from '@/storage/progress/progressStorage';

function setProgressForWord(word: string, wordProgress: Record<string, unknown>) {
  updateProgressCache({
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
    wordProgress: {
      [word]: wordProgress as any,
    },
  } as any);
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function randint(rng: () => number, min: number, maxInclusive: number) {
  return min + Math.floor(rng() * (maxInclusive - min + 1));
}

function nextIndexOfWord(questions: any[], word: string, startExclusive: number) {
  for (let i = startExclusive + 1; i < questions.length; i++) {
    if ((questions[i]?.id ?? questions[i]?.word) === word) return i;
  }
  return -1;
}

describe('requeue vibration quality (memorization incorrect)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    updateProgressCache({
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
    } as any);
  });

  it('seed固定fuzz: 分からない(>=70)の再出題は原則として10問未満に戻らない（十分な残り長さがある場合）', () => {
    const { result } = renderHook(() => useQuestionRequeue<any>());

    // 50 seeds × 80 trials = 4000ケース程度
    for (let seed = 1; seed <= 50; seed++) {
      const rng = mulberry32(seed);

      for (let trial = 0; trial < 80; trial++) {
        const length = randint(rng, 60, 140);
        const currentIndex = randint(rng, 0, Math.min(20, length - 1));

        const baseQuestions = Array.from({ length }, (_, i) => ({ word: `w${seed}_${trial}_${i}`, position: 0 }));

        // 現在の問題（分からない相当）
        const currentWord = baseQuestions[currentIndex].word;
        setProgressForWord(currentWord, {
          memorizationPosition: 80,
          memorizationAttempts: 10,
          memorizationCorrect: 0,
          memorizationStillLearning: 0,
          consecutiveCorrect: 0,
          consecutiveIncorrect: 3,
          lastStudied: Date.now(),
        });

        // 既に近い将来に同一語が存在するパターンも混ぜる
        // - verySoon: 1〜5
        // - mid: 6〜12
        const placeDuplicate = rng() < 0.6;
        let questions = baseQuestions;
        if (placeDuplicate) {
          const duplicateAt = Math.min(
            length - 1,
            currentIndex + randint(rng, 1, 12)
          );
          if (duplicateAt !== currentIndex) {
            questions = [...baseQuestions];
            questions[duplicateAt] = { word: currentWord, position: 0 };
          }
        }

        const returned = result.current.reAddQuestion(
          { word: currentWord, position: 10 },
          questions,
          currentIndex,
          'memorization'
        );

        const nextIdx = nextIndexOfWord(returned, currentWord, currentIndex);
        expect(nextIdx).not.toBe(-1);

        const remaining = returned.length - 1 - currentIndex;
        if (remaining >= 10) {
          // 「振動しない」不変条件: 次の出現が currentIndex+10 以上
          expect(nextIdx).toBeGreaterThanOrEqual(currentIndex + 10);
        } else {
          // そもそも10問分の余地がないときは末尾付近になり得る（ここでは“即次(<=+1)”だけは避けたい）
          expect(nextIdx).toBeGreaterThanOrEqual(currentIndex + 2);
        }
      }
    }
  });
});
