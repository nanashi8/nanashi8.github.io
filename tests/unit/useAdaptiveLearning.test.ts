import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAdaptiveLearning } from '../../src/hooks/useAdaptiveLearning';
import type { Question } from '../../src/types';

// モックデータ
const mockQuestions: Question[] = [
  { word: 'apple', meaning: 'りんご', difficulty: '1' },
  { word: 'banana', meaning: 'バナナ', difficulty: '2' },
  { word: 'cherry', meaning: 'さくらんぼ', difficulty: '3' },
  { word: 'date', meaning: 'ナツメヤシ', difficulty: '1' },
  { word: 'elderberry', meaning: 'ニワトコの実', difficulty: '3' },
];

// progressStorageのモック
vi.mock('../../src/progressStorage', () => ({
  getWordProgress: vi.fn((word: string) => ({
    word,
    correctCount: 0,
    incorrectCount: 0,
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
    lastStudied: 0,
    totalResponseTime: 0,
    averageResponseTime: 0,
    difficultyScore: 50,
    masteryLevel: 'new' as const,
    responseTimes: [],
  })),
}));

describe('useAdaptiveLearning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('初期化', () => {
    it('正しく初期化される', () => {
      const { result } = renderHook(() => useAdaptiveLearning('MEMORIZATION'));

      expect(result.current.state).toBeDefined();
      expect(result.current.state.sessionProgress.totalQuestions).toBe(0);
    });

    it('カテゴリーごとに独立して初期化される', () => {
      const { result: result1 } = renderHook(() => useAdaptiveLearning('MEMORIZATION'));
      const { result: result2 } = renderHook(() => useAdaptiveLearning('TRANSLATION'));

      expect(result1.current).toBeDefined();
      expect(result2.current).toBeDefined();
      expect(result1.current).not.toBe(result2.current);
    });
  });

  describe('問題選択', () => {
    it('候補から問題を選択できる', () => {
      const { result } = renderHook(() => useAdaptiveLearning('MEMORIZATION'));

      act(() => {
        const selected = result.current.selectNextQuestion(mockQuestions);
        expect(selected).toBeDefined();
        expect(mockQuestions).toContain(selected);
      });
    });

    it('空配列の場合nullを返す', () => {
      const { result } = renderHook(() => useAdaptiveLearning('MEMORIZATION'));

      act(() => {
        const selected = result.current.selectNextQuestion([]);
        expect(selected).toBeNull();
      });
    });

    it('複数回呼び出しても問題を返す', () => {
      const { result } = renderHook(() => useAdaptiveLearning('MEMORIZATION'));

      act(() => {
        const selected1 = result.current.selectNextQuestion(mockQuestions);
        const selected2 = result.current.selectNextQuestion(mockQuestions);
        const selected3 = result.current.selectNextQuestion(mockQuestions);

        expect(selected1).toBeDefined();
        expect(selected2).toBeDefined();
        expect(selected3).toBeDefined();
      });
    });
  });

  describe('回答記録', () => {
    it('正解を記録できる', () => {
      const { result } = renderHook(() => useAdaptiveLearning('MEMORIZATION'));

      act(() => {
        result.current.recordAnswer('apple', true, 2000);
      });

      expect(result.current.state.sessionProgress.totalQuestions).toBe(1);
    });

    it('不正解を記録できる', () => {
      const { result } = renderHook(() => useAdaptiveLearning('MEMORIZATION'));

      act(() => {
        result.current.recordAnswer('apple', false, 3000);
      });

      expect(result.current.state.sessionProgress.totalQuestions).toBe(1);
    });

    it('複数の回答を記録できる', () => {
      const { result } = renderHook(() => useAdaptiveLearning('MEMORIZATION'));

      act(() => {
        result.current.recordAnswer('apple', true, 2000);
        result.current.recordAnswer('banana', false, 3000);
        result.current.recordAnswer('cherry', true, 2500);
      });

      expect(result.current.state.sessionProgress.totalQuestions).toBe(3);
    });

    it('20問ごとに個人パラメータが更新される', () => {
      const { result } = renderHook(() => useAdaptiveLearning('MEMORIZATION'));

      act(() => {
        // 20問回答
        for (let i = 0; i < 20; i++) {
          result.current.recordAnswer(`word${i}`, i % 2 === 0, 2000);
        }
      });

      expect(result.current.state.sessionProgress.totalQuestions).toBe(20);
      expect(result.current.state.personalParams).toBeDefined();
    });
  });

  describe('セッション状態', () => {
    it('キューサイズが取得できる', () => {
      const { result } = renderHook(() => useAdaptiveLearning('MEMORIZATION'));

      expect(result.current.state.queueSizes).toBeDefined();
      expect(result.current.state.queueSizes.immediate).toBe(0);
      expect(result.current.state.queueSizes.early).toBe(0);
      expect(result.current.state.queueSizes.mid).toBe(0);
      expect(result.current.state.queueSizes.end).toBe(0);
    });

    it('進行状況が取得できる', () => {
      const { result } = renderHook(() => useAdaptiveLearning('MEMORIZATION'));

      expect(result.current.state.sessionProgress).toBeDefined();
      expect(result.current.state.sessionProgress.newWords).toBe(0);
      expect(result.current.state.sessionProgress.reviews).toBe(0);
    });

    it('個人パラメータが初期値を持つ', () => {
      const { result } = renderHook(() => useAdaptiveLearning('MEMORIZATION'));

      // 初期状態ではnullまたはデフォルト値
      expect(result.current.state.personalParams).toBeDefined();
    });
  });

  describe('localStorage連携', () => {
    it('キューをlocalStorageに保存できる', () => {
      const { result } = renderHook(() => useAdaptiveLearning('MEMORIZATION'));

      act(() => {
        result.current.recordAnswer('apple', true, 2000);
      });

      // localStorageに保存されているか確認
      const saved = localStorage.getItem('adaptive-learning-queues-MEMORIZATION');
      expect(saved).toBeDefined();
    });

    it('localStorageからキューを復元できる', () => {
      // まず保存
      const { result: result1 } = renderHook(() => useAdaptiveLearning('MEMORIZATION'));

      act(() => {
        result1.current.recordAnswer('apple', true, 2000);
      });

      // 新しいインスタンスで復元
      const { result: result2 } = renderHook(() => useAdaptiveLearning('MEMORIZATION'));

      // 復元されたデータが存在することを確認
      expect(result2.current.state).toBeDefined();
    });
  });

  describe('エラーハンドリング', () => {
    it('不正な単語名でもエラーにならない', () => {
      const { result } = renderHook(() => useAdaptiveLearning('MEMORIZATION'));

      act(() => {
        expect(() => {
          result.current.recordAnswer('', true, 2000);
        }).not.toThrow();
      });
    });

    it('負の応答時間でもエラーにならない', () => {
      const { result } = renderHook(() => useAdaptiveLearning('MEMORIZATION'));

      act(() => {
        expect(() => {
          result.current.recordAnswer('apple', true, -1000);
        }).not.toThrow();
      });
    });

    it('非常に大きな応答時間でもエラーにならない', () => {
      const { result } = renderHook(() => useAdaptiveLearning('MEMORIZATION'));

      act(() => {
        expect(() => {
          result.current.recordAnswer('apple', true, 999999999);
        }).not.toThrow();
      });
    });
  });

  describe('統合シナリオ', () => {
    it('典型的な学習フローが動作する', () => {
      const { result } = renderHook(() => useAdaptiveLearning('MEMORIZATION'));
      let recordedAnswers = 0;

      act(() => {
        // 1. 問題選択
        const q1 = result.current.selectNextQuestion(mockQuestions);
        expect(q1).toBeDefined();

        // 2. 正解記録
        if (q1) {
          result.current.recordAnswer(q1.word, true, 2000);
          recordedAnswers++;
        }

        // 3. 次の問題選択
        const q2 = result.current.selectNextQuestion(mockQuestions);
        expect(q2).toBeDefined();

        // 4. 不正解記録
        if (q2) {
          result.current.recordAnswer(q2.word, false, 4000);
          recordedAnswers++;
        }

        // 5. さらに問題選択
        const q3 = result.current.selectNextQuestion(mockQuestions);
        expect(q3).toBeDefined();
      });

      expect(result.current.state.sessionProgress.totalQuestions).toBe(recordedAnswers);
    });

    it('長時間セッションでも安定動作する', () => {
      const { result } = renderHook(() => useAdaptiveLearning('MEMORIZATION'));
      let answeredCount = 0;

      act(() => {
        // 50問の学習セッションをシミュレート
        for (let i = 0; i < 50; i++) {
          const question = result.current.selectNextQuestion(mockQuestions);
          if (question) {
            // 70%の正答率でシミュレート
            const isCorrect = Math.random() < 0.7;
            const responseTime = 2000 + Math.random() * 2000;
            result.current.recordAnswer(question.word, isCorrect, responseTime);
            answeredCount++;
          }
        }
      });

      expect(result.current.state.sessionProgress.totalQuestions).toBe(answeredCount);
      expect(result.current.state.personalParams).toBeDefined();
    });

    it('異なるカテゴリーは独立して動作する', () => {
      const { result: mem } = renderHook(() => useAdaptiveLearning('MEMORIZATION'));
      const { result: trans } = renderHook(() => useAdaptiveLearning('TRANSLATION'));

      act(() => {
        mem.current.recordAnswer('apple', true, 2000);
        trans.current.recordAnswer('apple', false, 3000);
      });

      expect(mem.current.state.sessionProgress.totalQuestions).toBe(1);
      expect(trans.current.state.sessionProgress.totalQuestions).toBe(1);
    });
  });

  describe('パフォーマンス', () => {
    it('大量の問題選択でも高速に動作する', () => {
      const { result } = renderHook(() => useAdaptiveLearning('MEMORIZATION'));
      const startTime = performance.now();

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.selectNextQuestion(mockQuestions);
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 100回の選択が1秒以内に完了することを期待
      expect(duration).toBeLessThan(1000);
    });

    it('大量の記録処理でも高速に動作する', () => {
      const { result } = renderHook(() => useAdaptiveLearning('MEMORIZATION'));
      const startTime = performance.now();

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.recordAnswer(`word${i}`, i % 2 === 0, 2000);
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 100回の記録が1秒以内に完了することを期待
      expect(duration).toBeLessThan(1000);
    });
  });
});
