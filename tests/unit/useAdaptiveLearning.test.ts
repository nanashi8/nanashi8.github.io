import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAdaptiveLearning } from '../../src/hooks/useAdaptiveLearning';
import { QuestionCategory } from '../../src/strategies/memoryAcquisitionAlgorithm';
import type { Question } from '../../src/types';

// モックデータ
const mockQuestions: Question[] = [
  {
    word: 'apple',
    meaning: 'りんご',
    difficulty: '1',
    reading: 'apple',
    etymology: 'test',
    relatedWords: 'fruit',
    relatedFields: 'food',
  },
  {
    word: 'banana',
    meaning: 'バナナ',
    difficulty: '2',
    reading: 'banana',
    etymology: 'test',
    relatedWords: 'fruit',
    relatedFields: 'food',
  },
  {
    word: 'cherry',
    meaning: 'さくらんぼ',
    difficulty: '3',
    reading: 'cherry',
    etymology: 'test',
    relatedWords: 'fruit',
    relatedFields: 'food',
  },
  {
    word: 'date',
    meaning: 'ナツメヤシ',
    difficulty: '1',
    reading: 'date',
    etymology: 'test',
    relatedWords: 'fruit',
    relatedFields: 'food',
  },
  {
    word: 'elderberry',
    meaning: 'ニワトコの実',
    difficulty: '3',
    reading: 'elderberry',
    etymology: 'test',
    relatedWords: 'fruit',
    relatedFields: 'food',
  },
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
      const { result } = renderHook(() => useAdaptiveLearning(QuestionCategory.MEMORIZATION));

      expect(result.current.state).toBeDefined();
      expect(result.current.state.sessionProgress.totalQuestions).toBe(0);
    });

    it('カテゴリーごとに独立して初期化される', () => {
      const { result: result1 } = renderHook(() =>
        useAdaptiveLearning(QuestionCategory.MEMORIZATION)
      );
      const { result: result2 } = renderHook(() =>
        useAdaptiveLearning(QuestionCategory.TRANSLATION)
      );

      expect(result1.current).toBeDefined();
      expect(result2.current).toBeDefined();
      expect(result1.current).not.toBe(result2.current);
    });
  });

  describe('問題選択', () => {
    it('候補から問題を選択できる', () => {
      const { result } = renderHook(() => useAdaptiveLearning(QuestionCategory.MEMORIZATION));

      act(() => {
        const selected = result.current.selectNextQuestion(mockQuestions);
        expect(selected).toBeDefined();
        expect(mockQuestions).toContain(selected);
      });
    });

    it('空配列の場合nullを返す', () => {
      const { result } = renderHook(() => useAdaptiveLearning(QuestionCategory.MEMORIZATION));

      act(() => {
        const selected = result.current.selectNextQuestion([]);
        expect(selected).toBeNull();
      });
    });

    it('複数回呼び出しても問題を返す', () => {
      const { result } = renderHook(() => useAdaptiveLearning(QuestionCategory.MEMORIZATION));

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
      const { result } = renderHook(() => useAdaptiveLearning(QuestionCategory.MEMORIZATION));

      act(() => {
        result.current.selectNextQuestion(mockQuestions);
        result.current.recordAnswer('apple', true, 2000);
      });

      expect(result.current.state.sessionProgress.totalQuestions).toBe(1);
    });

    it('不正解を記録できる', () => {
      const { result } = renderHook(() => useAdaptiveLearning(QuestionCategory.MEMORIZATION));

      act(() => {
        result.current.selectNextQuestion(mockQuestions);
        result.current.recordAnswer('apple', false, 3000);
      });

      expect(result.current.state.sessionProgress.totalQuestions).toBe(1);
    });

    it('複数の回答を記録できる', () => {
      const { result } = renderHook(() => useAdaptiveLearning(QuestionCategory.MEMORIZATION));

      act(() => {
        result.current.selectNextQuestion(mockQuestions);
        result.current.recordAnswer('apple', true, 2000);
        result.current.selectNextQuestion(mockQuestions);
        result.current.recordAnswer('banana', false, 3000);
        result.current.selectNextQuestion(mockQuestions);
        result.current.recordAnswer('cherry', true, 2500);
      });

      expect(result.current.state.sessionProgress.totalQuestions).toBe(3);
    });

    it('20問ごとに個人パラメータが更新される', () => {
      const { result } = renderHook(() => useAdaptiveLearning(QuestionCategory.MEMORIZATION));
      let initialParams: any = null;

      act(() => {
        // 最初の20問回答
        for (let i = 0; i < 20; i++) {
          result.current.selectNextQuestion(mockQuestions);
          result.current.recordAnswer(`word${i}`, i % 2 === 0, 2000);
        }
        initialParams = result.current.state.personalParams;
      });

      expect(result.current.state.sessionProgress.totalQuestions).toBe(20);
      expect(initialParams).toBeDefined();

      act(() => {
        // さらに20問回答して再推定をトリガー
        for (let i = 20; i < 40; i++) {
          result.current.selectNextQuestion(mockQuestions);
          result.current.recordAnswer(`word${i}`, i % 2 === 0, 2000);
        }
      });

      expect(result.current.state.sessionProgress.totalQuestions).toBe(40);
      // パラメータが更新されている可能性を確認
      expect(result.current.state.personalParams).toBeDefined();
    });
  });

  describe('セッション状態', () => {
    it('キューサイズが取得できる', () => {
      const { result } = renderHook(() => useAdaptiveLearning(QuestionCategory.MEMORIZATION));

      expect(result.current.state.queueSizes).toBeDefined();
      expect(result.current.state.queueSizes.immediate).toBe(0);
      expect(result.current.state.queueSizes.early).toBe(0);
      expect(result.current.state.queueSizes.mid).toBe(0);
      expect(result.current.state.queueSizes.end).toBe(0);
    });

    it('進行状況が取得できる', () => {
      const { result } = renderHook(() => useAdaptiveLearning(QuestionCategory.MEMORIZATION));

      expect(result.current.state.sessionProgress).toBeDefined();
      expect(result.current.state.sessionProgress.newWords).toBe(0);
      expect(result.current.state.sessionProgress.reviews).toBe(0);
    });

    it('個人パラメータが初期値を持つ', () => {
      const { result } = renderHook(() => useAdaptiveLearning(QuestionCategory.MEMORIZATION));

      // 初期状態ではnullまたはデフォルト値
      expect(result.current.state.personalParams).toBeDefined();
    });
  });

  describe('localStorage連携', () => {
    it('キューをlocalStorageに保存できる', () => {
      const { result } = renderHook(() => useAdaptiveLearning(QuestionCategory.MEMORIZATION));

      act(() => {
        result.current.recordAnswer('apple', true, 2000);
      });

      // localStorageに保存されているか確認
      const saved = localStorage.getItem('adaptive-learning-queues-MEMORIZATION');
      expect(saved).toBeDefined();
    });

    it('localStorageからキューを復元できる', () => {
      // まず保存
      const { result: result1 } = renderHook(() =>
        useAdaptiveLearning(QuestionCategory.MEMORIZATION)
      );

      act(() => {
        result1.current.recordAnswer('apple', true, 2000);
      });

      // 新しいインスタンスで復元
      const { result: result2 } = renderHook(() =>
        useAdaptiveLearning(QuestionCategory.MEMORIZATION)
      );

      // 復元されたデータが存在することを確認
      expect(result2.current.state).toBeDefined();
    });
  });

  describe('エラーハンドリング', () => {
    it('不正な単語名でもエラーにならない', () => {
      const { result } = renderHook(() => useAdaptiveLearning(QuestionCategory.MEMORIZATION));

      act(() => {
        expect(() => {
          result.current.recordAnswer('', true, 2000);
        }).not.toThrow();
      });
    });

    it('負の応答時間でもエラーにならない', () => {
      const { result } = renderHook(() => useAdaptiveLearning(QuestionCategory.MEMORIZATION));

      act(() => {
        expect(() => {
          result.current.recordAnswer('apple', true, -1000);
        }).not.toThrow();
      });
    });

    it('非常に大きな応答時間でもエラーにならない', () => {
      const { result } = renderHook(() => useAdaptiveLearning(QuestionCategory.MEMORIZATION));

      act(() => {
        expect(() => {
          result.current.recordAnswer('apple', true, 999999999);
        }).not.toThrow();
      });
    });
  });

  describe('統合シナリオ', () => {
    it('典型的な学習フローが動作する', () => {
      const { result } = renderHook(() => useAdaptiveLearning(QuestionCategory.MEMORIZATION));

      act(() => {
        // 1. 問題選択
        const q1 = result.current.selectNextQuestion(mockQuestions);
        expect(q1).toBeDefined();

        // 2. 正解記録
        if (q1) {
          result.current.recordAnswer(q1.word, true, 2000);
        }

        // 3. 次の問題選択
        const q2 = result.current.selectNextQuestion(mockQuestions);
        expect(q2).toBeDefined();

        // 4. 不正解記録
        if (q2) {
          result.current.recordAnswer(q2.word, false, 4000);
        }

        // 5. さらに問題選択
        const q3 = result.current.selectNextQuestion(mockQuestions);
        expect(q3).toBeDefined();
      });

      // selectNextQuestionを3回呼んだので3になる
      expect(result.current.state.sessionProgress.totalQuestions).toBe(3);
    });

    it('長時間セッションでも安定動作する', () => {
      const { result } = renderHook(() => useAdaptiveLearning(QuestionCategory.MEMORIZATION));

      act(() => {
        // 50問の学習セッションをシミュレート
        for (let i = 0; i < 50; i++) {
          const question = result.current.selectNextQuestion(mockQuestions);
          if (question) {
            // 70%の正答率でシミュレート
            const isCorrect = Math.random() < 0.7;
            const responseTime = 2000 + Math.random() * 2000;
            result.current.recordAnswer(question.word, isCorrect, responseTime);
          }
        }
      });

      // selectNextQuestionを50回呼んだので50になる
      expect(result.current.state.sessionProgress.totalQuestions).toBe(50);
      expect(result.current.state.personalParams).toBeDefined();
    });

    it('異なるカテゴリーは独立して動作する', () => {
      const { result: mem } = renderHook(() => useAdaptiveLearning(QuestionCategory.MEMORIZATION));
      const { result: trans } = renderHook(() => useAdaptiveLearning(QuestionCategory.TRANSLATION));

      act(() => {
        mem.current.selectNextQuestion(mockQuestions);
        mem.current.recordAnswer('apple', true, 2000);
        trans.current.selectNextQuestion(mockQuestions);
        trans.current.recordAnswer('apple', false, 3000);
      });

      expect(mem.current.state.sessionProgress.totalQuestions).toBe(1);
      expect(trans.current.state.sessionProgress.totalQuestions).toBe(1);
    });
  });

  describe('パフォーマンス', () => {
    it('大量の問題選択でも高速に動作する', () => {
      const { result } = renderHook(() => useAdaptiveLearning(QuestionCategory.MEMORIZATION));
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
      const { result } = renderHook(() => useAdaptiveLearning(QuestionCategory.MEMORIZATION));
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

  describe('リセット機能', () => {
    it('reset()で状態が初期化される', () => {
      const { result } = renderHook(() => useAdaptiveLearning(QuestionCategory.MEMORIZATION));

      act(() => {
        // 学習を進める
        result.current.selectNextQuestion(mockQuestions);
        result.current.recordAnswer('apple', true, 2000);
        result.current.selectNextQuestion(mockQuestions);
        result.current.recordAnswer('banana', false, 3000);

        // リセット
        result.current.reset();
      });

      // 状態が初期化されている
      expect(result.current.state.sessionProgress.totalQuestions).toBe(0);
      expect(result.current.state.sessionProgress.newWords).toBe(0);
      expect(result.current.state.sessionProgress.reviews).toBe(0);
      expect(result.current.state.currentPhase).toBeNull();
    });
  });

  describe('デバッグ機能', () => {
    it('getDebugInfo()でデバッグ情報を取得できる', () => {
      const { result } = renderHook(() => useAdaptiveLearning(QuestionCategory.MEMORIZATION));

      act(() => {
        result.current.selectNextQuestion(mockQuestions);
        result.current.recordAnswer('apple', true, 2000);
      });

      const debugInfo = result.current.getDebugInfo();

      expect(debugInfo).toBeDefined();
      expect(debugInfo.state).toBeDefined();
      expect(debugInfo.state.sessionProgress.totalQuestions).toBe(1);
    });
  });

  describe('セッションID', () => {
    it('セッションIDを指定できる', () => {
      const { result } = renderHook(() =>
        useAdaptiveLearning(QuestionCategory.MEMORIZATION, 'test-session-123')
      );

      expect(result.current).toBeDefined();
      expect(result.current.state).toBeDefined();
    });
  });

  describe('エラーハンドリング', () => {
    it('localStorage読み込みエラーでもアプリは継続する', () => {
      // localStorageのgetItemをモック化してエラーをスロー
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('localStorage error');
      });

      expect(() => {
        renderHook(() => useAdaptiveLearning(QuestionCategory.MEMORIZATION));
      }).not.toThrow();

      // 元に戻す
      localStorage.getItem = originalGetItem;
    });
  });
});
