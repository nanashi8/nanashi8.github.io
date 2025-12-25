import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

describe('useQuestionRequeue', () => {
  let mathRandomSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    mathRandomSpy?.mockRestore();
    // 他テストへの影響を避けるため、空キャッシュに戻す
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

  it('近い将来に同一IDが存在する場合、挿入せず skip ログを残す（SSOT position を優先）', () => {
    setProgressForWord('apple', {
      memorizationPosition: 80,
      memorizationAttempts: 5,
      memorizationCorrect: 0,
      memorizationStillLearning: 0,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 2,
      lastStudied: Date.now(),
    });

    const { result } = renderHook(() => useQuestionRequeue<any>());

    const currentQuestion = { word: 'apple', position: 10 };
    const questions = [
      { word: 'q0', position: 0 },
      { word: 'apple', position: 20 }, // upcoming内に同一ID
      { word: 'q2', position: 0 },
    ];

    const returned = result.current.reAddQuestion(currentQuestion, questions, 0, 'memorization');

    expect(returned).toBe(questions);

    const stored = localStorage.getItem('debug_requeue_events');
    expect(stored).not.toBeNull();

    const logs = JSON.parse(stored as string);
    expect(Array.isArray(logs)).toBe(true);
    expect(logs).toHaveLength(1);

    const entry = logs[0];
    expect(entry.decision).toBe('skipped_exists_nearby');
    // question.position(10)ではなく、SSOT（memorizationPosition=80）を採用して判断できていること
    expect(entry.questionPosition).toBe(10);
    expect(entry.ssotPosition).toBe(80);
    expect(entry.effectivePosition).toBe(80);
    expect(entry.reason).toBe('incorrect_like');
  });

  it('重複がなければ挿入し、position-aware で高Position群の近くに寄せる（insert ログ）', () => {
    setProgressForWord('apple', {
      memorizationPosition: 80,
      memorizationAttempts: 1,
      memorizationCorrect: 0,
      memorizationStillLearning: 0,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 1,
      lastStudied: Date.now(),
    });

    const { result } = renderHook(() => useQuestionRequeue<any>());

    const currentQuestion = { word: 'apple', position: 10 };
    const questions = [
      { word: 'q0', position: 0 },
      { word: 'q1', position: 0 },
      { word: 'q2', position: 0 },
      { word: 'q3', position: 0 },
      { word: 'q4', position: 0 },
      { word: 'high', position: 60 }, // 高Position群
      { word: 'q6', position: 0 },
      { word: 'q7', position: 0 },
      { word: 'q8', position: 0 },
      { word: 'q9', position: 0 },
    ];

    const returned = result.current.reAddQuestion(currentQuestion, questions, 0, 'memorization');

    expect(returned).not.toBe(questions);
    expect(returned).toHaveLength(questions.length + 1);

    // baseOffset=1, originalInsertAt=1 だが、高Position群(index 5)の直後に寄せて index 6 に入る
    expect(returned[6].word).toBe('apple');

    const stored = localStorage.getItem('debug_requeue_events');
    expect(stored).not.toBeNull();

    const logs = JSON.parse(stored as string);
    expect(logs).toHaveLength(1);

    const entry = logs[0];
    expect(entry.decision).toBe('inserted');
    expect(entry.originalInsertAt).toBe(1);
    expect(entry.insertAt).toBe(6);
    expect(entry.positionAwareAdjusted).toBe(true);
    expect(entry.ssotPosition).toBe(80);
    expect(entry.effectivePosition).toBe(80);
    expect(entry.reason).toBe('incorrect_like');
  });

  it('一度 skip されても、進行後には insert される（永久に抑制されない）', () => {
    setProgressForWord('apple', {
      memorizationPosition: 65,
      memorizationAttempts: 3,
      memorizationCorrect: 0,
      memorizationStillLearning: 1,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,
      lastStudied: Date.now(),
    });

    const { result } = renderHook(() => useQuestionRequeue<any>());

    const questions = [
      { word: 'q0', position: 0 },
      { word: 'q1', position: 0 },
      { word: 'q2', position: 0 },
      { word: 'q3', position: 0 },
      { word: 'q4', position: 0 },
      { word: 'apple', position: 0 }, // まずはここにいるので upcoming に入って skip される
      { word: 'q6', position: 0 },
      { word: 'q7', position: 0 },
      { word: 'q8', position: 0 },
      { word: 'q9', position: 0 },
      { word: 'q10', position: 0 },
    ];

    // 1回目: currentIndex=0 の時点では upcoming に apple がいるので skip される
    const first = result.current.reAddQuestion({ word: 'apple' }, questions, 0, 'memorization');
    expect(first).toBe(questions);

    // 2回目: 進行して apple 自体を回答した（currentIndex=5）後は upcoming に同一IDが無いので insert される
    const second = result.current.reAddQuestion(questions[5], questions, 5, 'memorization');
    expect(second).not.toBe(questions);
    expect(second).toHaveLength(questions.length + 1);

    // still_learning_like の baseOffset は 3（Math.random=0）なので、元の挿入予定は currentIndex+3 = 8
    expect(second[8].word).toBe('apple');

    const stored = localStorage.getItem('debug_requeue_events');
    expect(stored).not.toBeNull();
    const logs = JSON.parse(stored as string);
    expect(logs).toHaveLength(2);
    expect(logs[0].decision).toBe('skipped_exists_nearby');
    expect(logs[1].decision).toBe('inserted');
    expect(logs[1].reason).toBe('still_learning_like');
  });
});
