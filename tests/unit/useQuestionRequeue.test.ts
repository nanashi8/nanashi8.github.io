// @test-guard-bypass: 非コンテンツ系のユニットテスト（requeue挙動）。`npm run test:unit` と `npm run typecheck` で検証済み。
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

  it('暗記モードの分からない(>=70)は、近すぎる将来に同一IDが存在する場合でも minGap まで後ろへ移動する（SSOT position を優先）', () => {
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
    // minGap(=10) を満たせる長さにする（apple を「近すぎる位置」に置き、後ろへ移動されることを確認）
    const questions = Array.from({ length: 30 }, (_, i) => ({ word: `q${i}`, position: 0 }));
    questions[1] = { word: 'apple', position: 20 };

    const returned = result.current.reAddQuestion(currentQuestion, questions, 0, 'memorization');

    // 追加ではなく「移動」なので長さは変わらない
    expect(returned).toHaveLength(questions.length);
    // 暗記モードの分からないは minGap=10 なので、index 10 以降に配置される
    const nextAppleIndex = returned.findIndex((q: any, idx: number) => idx > 0 && q?.word === 'apple');
    expect(nextAppleIndex).toBeGreaterThanOrEqual(10);
    // 重複は増えない
    expect(returned.filter((q: any) => q.word === 'apple')).toHaveLength(1);

    const stored = localStorage.getItem('debug_requeue_events');
    expect(stored).not.toBeNull();

    const logs = JSON.parse(stored as string);
    expect(Array.isArray(logs)).toBe(true);
    expect(logs).toHaveLength(1);

    const entry = logs[0];
    expect(entry.decision).toBe('inserted');
    // question.position(10)ではなく、SSOT（memorizationPosition=80）を採用して判断できていること
    expect(entry.questionPosition).toBe(10);
    expect(entry.ssotPosition).toBe(80);
    expect(entry.effectivePosition).toBe(80);
    expect(entry.reason).toBe('incorrect_like');
    expect(entry.movedExisting).toBe(true);
    expect(entry.note).toBe('moved_due_to_min_gap');
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
    // 暗記モードの分からない(>=70)は振動対策で最小10問先に挿入される。
    // position-aware も維持されることを確認するため、高Position群を scanStart(=10) 以降に配置する。
    const questions = [
      { word: 'q0', position: 0 },
      { word: 'q1', position: 0 },
      { word: 'q2', position: 0 },
      { word: 'q3', position: 0 },
      { word: 'q4', position: 0 },
      { word: 'q5', position: 0 },
      { word: 'q6', position: 0 },
      { word: 'q7', position: 0 },
      { word: 'q8', position: 0 },
      { word: 'q9', position: 0 },
      { word: 'q10', position: 0 },
      { word: 'q11', position: 0 },
      { word: 'q12', position: 0 },
      { word: 'q13', position: 0 },
      { word: 'high', position: 60 }, // 高Position群（scanStart以降）
      { word: 'q15', position: 0 },
      { word: 'q16', position: 0 },
      { word: 'q17', position: 0 },
      { word: 'q18', position: 0 },
      { word: 'q19', position: 0 },
    ];

    const returned = result.current.reAddQuestion(currentQuestion, questions, 0, 'memorization');

    expect(returned).not.toBe(questions);
    expect(returned).toHaveLength(questions.length + 1);

    // baseOffset=1 でも暗記モードは最小10問先。
    // originalInsertAt=10 から scanStart=10.. の範囲で高Position群(index 14)を見つけ、直後(index 15)に寄せる。
    expect(returned[15].word).toBe('apple');

    const stored = localStorage.getItem('debug_requeue_events');
    expect(stored).not.toBeNull();

    const logs = JSON.parse(stored as string);
    expect(logs).toHaveLength(1);

    const entry = logs[0];
    expect(entry.decision).toBe('inserted');
    expect(entry.originalInsertAt).toBe(10);
    expect(entry.insertAt).toBe(15);
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

  it('分からない(>=70)は既に将来に存在する場合、重複追加せず（必要なら）適度な距離まで繰り上げる（move existing）', () => {
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
    // 既存の apple を「探索ウィンドウ内」かつ desiredInsertPosition より後方に置き、
    // minGap(=10) に従って「近すぎない位置」へ繰り上げられることを確認する。
    const questions = [
      { word: 'q0', position: 0 },
      { word: 'q1', position: 0 },
      { word: 'q2', position: 0 },
      { word: 'q3', position: 0 },
      { word: 'q4', position: 0 },
      { word: 'q5', position: 0 },
      { word: 'q6', position: 0 },
      { word: 'q7', position: 0 },
      { word: 'q8', position: 0 },
      { word: 'q9', position: 0 },
      { word: 'q10', position: 0 },
      { word: 'q11', position: 0 },
      { word: 'q12', position: 0 },
      { word: 'q13', position: 0 },
      { word: 'q14', position: 0 },
      { word: 'apple', position: 20 }, // 既存（ウィンドウ内・desired(=index10)より後方）
      { word: 'q15', position: 0 },
      { word: 'q16', position: 0 },
      { word: 'q17', position: 0 },
      { word: 'q18', position: 0 },
      { word: 'q19', position: 0 },
      { word: 'q20', position: 0 },
      { word: 'q21', position: 0 },
      { word: 'q22', position: 0 },
      { word: 'q23', position: 0 },
      { word: 'q24', position: 0 },
      { word: 'q25', position: 0 },
      { word: 'q26', position: 0 },
    ];

    const returned = result.current.reAddQuestion(currentQuestion, questions, 0, 'memorization');

    // 追加ではなく「移動」なので長さは変わらない
    expect(returned).toHaveLength(questions.length);
    // 暗記モードの分からないは minGap=10 なので、index 10 に繰り上がる
    expect(returned[10].word).toBe('apple');
    // 旧位置には残らない（重複しない）
    expect(returned.filter((q: any) => q.word === 'apple')).toHaveLength(1);

    const stored = localStorage.getItem('debug_requeue_events');
    expect(stored).not.toBeNull();
    const logs = JSON.parse(stored as string);
    expect(logs).toHaveLength(1);
    expect(logs[0].decision).toBe('inserted');
    expect(logs[0].reason).toBe('incorrect_like');
    expect(logs[0].movedExisting).toBe(true);
  });
});
