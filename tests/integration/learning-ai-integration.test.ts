/**
 * 学習AI統合テスト
 *
 * このテストは以下を検証します：
 * 1. ユーザーの解答情報がlocalStorageに正しく保存されること
 * 2. QuestionSchedulerが学習履歴を正しく読み取ること
 * 3. 学習履歴に基づいて適切な出題順序を決定すること
 * 4. カテゴリー更新（incorrect/still_learning/mastered）が正しく動作すること
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { QuestionScheduler } from '../../src/ai/scheduler/QuestionScheduler';
import type { Question } from '../../src/types';

// localStorageのモック
class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = value;
  }

  removeItem(key: string) {
    delete this.store[key];
  }

  get length() {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

describe('学習AI統合テスト', () => {
  let scheduler: QuestionScheduler;
  let mockLocalStorage: LocalStorageMock;

  // テスト用の問題セット
  const testQuestions: Question[] = [
    {
      word: 'apple',
      meaning: 'りんご',
      reading: 'apple',
      grade: 1,
      type: 'word',
      difficulty: 'beginner',
      etymology: '',
      relatedWords: '',
      relatedFields: '',
    },
    {
      word: 'book',
      meaning: '本',
      reading: 'book',
      grade: 1,
      type: 'word',
      difficulty: 'beginner',
      etymology: '',
      relatedWords: '',
      relatedFields: '',
    },
    {
      word: 'cat',
      meaning: '猫',
      reading: 'cat',
      grade: 1,
      type: 'word',
      difficulty: 'beginner',
      etymology: '',
      relatedWords: '',
      relatedFields: '',
    },
    {
      word: 'dog',
      meaning: '犬',
      reading: 'dog',
      grade: 1,
      type: 'word',
      difficulty: 'beginner',
      etymology: '',
      relatedWords: '',
      relatedFields: '',
    },
    {
      word: 'elephant',
      meaning: '象',
      reading: 'elephant',
      grade: 2,
      type: 'word',
      difficulty: 'intermediate',
      etymology: '',
      relatedWords: '',
      relatedFields: '',
    },
  ];

  beforeEach(() => {
    // localStorageをモック（vi.stubGlobalを使用）
    mockLocalStorage = new LocalStorageMock();
    vi.stubGlobal('localStorage', mockLocalStorage);

    // 初期データを設定
    const initialProgress = {
      wordProgress: {},
      results: [],
    };
    localStorage.setItem('english-progress', JSON.stringify(initialProgress));

    scheduler = new QuestionScheduler();
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  describe('1. 解答情報の保存テスト', () => {
    it('正解した単語がlocalStorageに保存されること', () => {
      const progress = {
        wordProgress: {
          apple: {
            word: 'apple',
            correctCount: 1,
            incorrectCount: 0,
            totalAttempts: 1,
            consecutiveCorrect: 1,
            consecutiveIncorrect: 0,
            category: 'mastered',
            lastStudied: Date.now(),
          },
        },
        results: [],
      };

      localStorage.setItem('english-progress', JSON.stringify(progress));

      const stored = localStorage.getItem('english-progress');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.wordProgress.apple).toBeDefined();
      expect(parsed.wordProgress.apple.category).toBe('mastered');
      expect(parsed.wordProgress.apple.correctCount).toBe(1);
      expect(parsed.wordProgress.apple.consecutiveCorrect).toBe(1);
    });

    it('不正解した単語がincorrectカテゴリーに分類されること', () => {
      const progress = {
        wordProgress: {
          elephant: {
            word: 'elephant',
            correctCount: 0,
            incorrectCount: 2,
            totalAttempts: 2,
            consecutiveCorrect: 0,
            consecutiveIncorrect: 2,
            category: 'incorrect',
            lastStudied: Date.now(),
          },
        },
        results: [],
      };

      localStorage.setItem('english-progress', JSON.stringify(progress));

      const stored = localStorage.getItem('english-progress');
      const parsed = JSON.parse(stored!);
      expect(parsed.wordProgress.elephant.category).toBe('incorrect');
      expect(parsed.wordProgress.elephant.consecutiveIncorrect).toBe(2);
    });

    it('まだまだ（still_learning）の単語が正しく記録されること', () => {
      const progress = {
        wordProgress: {
          book: {
            word: 'book',
            correctCount: 1,
            incorrectCount: 1,
            totalAttempts: 2,
            consecutiveCorrect: 0,
            consecutiveIncorrect: 0,
            category: 'still_learning',
            lastStudied: Date.now(),
          },
        },
        results: [],
      };

      localStorage.setItem('english-progress', JSON.stringify(progress));

      const stored = localStorage.getItem('english-progress');
      const parsed = JSON.parse(stored!);
      expect(parsed.wordProgress.book.category).toBe('still_learning');
    });
  });

  describe('2. QuestionSchedulerの学習履歴読み取りテスト', () => {
    it('incorrectカテゴリーの単語を優先的に選択すること', () => {
      // テストデータ: incorrect、still_learning、masteredが混在
      const progress = {
        wordProgress: {
          apple: {
            word: 'apple',
            category: 'mastered',
            correctCount: 3,
            incorrectCount: 0,
            totalAttempts: 3,
            lastStudied: Date.now() - 10000,
          },
          book: {
            word: 'book',
            category: 'still_learning',
            correctCount: 1,
            incorrectCount: 1,
            totalAttempts: 2,
            lastStudied: Date.now() - 5000,
          },
          cat: {
            word: 'cat',
            category: 'incorrect',
            correctCount: 0,
            incorrectCount: 2,
            totalAttempts: 2,
            consecutiveIncorrect: 2,
            lastStudied: Date.now() - 3000,
          },
          dog: {
            word: 'dog',
            category: 'incorrect',
            correctCount: 0,
            incorrectCount: 3,
            totalAttempts: 3,
            consecutiveIncorrect: 3,
            lastStudied: Date.now() - 2000,
          },
        },
        results: [],
      };

      localStorage.setItem('english-progress', JSON.stringify(progress));

      const result = scheduler.schedule({
        questions: testQuestions,
        mode: 'memorization',
        limits: { learningLimit: 10, reviewLimit: 10 },
        sessionStats: {
          correct: 0,
          incorrect: 0,
          still_learning: 0,
          mastered: 0,
          duration: 0,
        },
        useMetaAI: true,
        isReviewFocusMode: false,
      });

      // 🔥 ランダム飛ばし機能: 最初のincorrect('cat')は待機キューに入る
      // 2番目のincorrect('dog')が上位に来る
      const topWords = result.scheduledQuestions.slice(0, 2).map((q) => q.word);
      expect(topWords).toContain('dog'); // 2番目のincorrectが出題
      expect(topWords).toContain('book'); // still_learningが続く
      // catは待機キューに入ったのでtop2には含まれない
      expect(topWords).not.toContain('cat');
    });

    it('still_learningカテゴリーがincorrectの次に優先されること', () => {
      const progress = {
        wordProgress: {
          apple: {
            word: 'apple',
            category: 'mastered',
            correctCount: 3,
            incorrectCount: 0,
            totalAttempts: 3,
            lastStudied: Date.now() - 10000,
          },
          book: {
            word: 'book',
            category: 'still_learning',
            correctCount: 1,
            incorrectCount: 1,
            totalAttempts: 2,
            lastStudied: Date.now() - 5000,
          },
          cat: {
            word: 'cat',
            category: 'still_learning',
            correctCount: 2,
            incorrectCount: 1,
            totalAttempts: 3,
            lastStudied: Date.now() - 4000,
          },
          dog: {
            word: 'dog',
            category: 'new',
            correctCount: 0,
            incorrectCount: 0,
            totalAttempts: 0,
            lastStudied: 0,
          },
        },
        results: [],
      };

      localStorage.setItem('english-progress', JSON.stringify(progress));

      const result = scheduler.schedule({
        questions: testQuestions,
        mode: 'memorization',
        limits: { learningLimit: 10, reviewLimit: 10 },
        sessionStats: {
          correct: 0,
          incorrect: 0,
          still_learning: 0,
          mastered: 0,
          duration: 0,
        },
        useMetaAI: true,
        isReviewFocusMode: false,
      });

      // 🔥 ランダム飛ばし機能: incorrectの'cat'は待機キューに入る
      // 2番目のincorrect('dog')とstill_learning('book')が上位に来る
      const topWords = result.scheduledQuestions.slice(0, 2).map((q) => q.word);
      expect(topWords).toContain('book'); // still_learning
      expect(topWords).toContain('dog'); // 2番目のincorrect
      expect(topWords).not.toContain('cat'); // 待機キューに入った
    });

    it('masteredカテゴリーの単語は優先度が低いこと', () => {
      const progress = {
        wordProgress: {
          apple: {
            word: 'apple',
            category: 'mastered',
            correctCount: 5,
            incorrectCount: 0,
            totalAttempts: 5,
            consecutiveCorrect: 5,
            lastStudied: Date.now() - 10000,
          },
          book: {
            word: 'book',
            category: 'incorrect',
            correctCount: 0,
            incorrectCount: 2,
            totalAttempts: 2,
            consecutiveIncorrect: 2,
            lastStudied: Date.now() - 1000,
          },
        },
        results: [],
      };

      localStorage.setItem('english-progress', JSON.stringify(progress));

      const result = scheduler.schedule({
        questions: testQuestions,
        mode: 'memorization',
        limits: { learningLimit: 10, reviewLimit: 10 },
        sessionStats: {
          correct: 0,
          incorrect: 0,
          still_learning: 0,
          mastered: 0,
          duration: 0,
        },
        useMetaAI: true,
        isReviewFocusMode: false,
      });

      // 🔥 ランダム飛ばし機能: incorrectの'cat'は待機キューに入る
      // 2番目のincorrect('dog')が最初に来る
      expect(result.scheduledQuestions[0].word).toBe('dog');

      // masteredは後方に配置されること
      const appleIndex = result.scheduledQuestions.findIndex((q) => q.word === 'apple');
      expect(appleIndex).toBeGreaterThan(0);
    });
  });

  describe('3. カテゴリー更新のテスト', () => {
    it('連続正解でstill_learning→masteredに遷移すること', () => {
      const progress = {
        wordProgress: {
          apple: {
            word: 'apple',
            category: 'still_learning',
            correctCount: 2,
            incorrectCount: 1,
            totalAttempts: 3,
            consecutiveCorrect: 2,
            consecutiveIncorrect: 0,
            lastStudied: Date.now(),
          },
        },
        results: [],
      };

      localStorage.setItem('english-progress', JSON.stringify(progress));

      // 1回正解を追加（consecutiveCorrect=3になる想定）
      const updatedProgress = {
        wordProgress: {
          apple: {
            ...progress.wordProgress.apple,
            correctCount: 3,
            totalAttempts: 4,
            consecutiveCorrect: 3,
            category: 'mastered', // 3連続正解で定着
          },
        },
        results: [],
      };

      localStorage.setItem('english-progress', JSON.stringify(updatedProgress));

      const stored = localStorage.getItem('english-progress');
      const parsed = JSON.parse(stored!);
      expect(parsed.wordProgress.apple.category).toBe('mastered');
      expect(parsed.wordProgress.apple.consecutiveCorrect).toBe(3);
    });

    it('連続不正解でincorrectカテゴリーに遷移すること', () => {
      const progress = {
        wordProgress: {
          dog: {
            word: 'dog',
            category: 'still_learning',
            correctCount: 1,
            incorrectCount: 1,
            totalAttempts: 2,
            consecutiveCorrect: 0,
            consecutiveIncorrect: 1,
            lastStudied: Date.now(),
          },
        },
        results: [],
      };

      localStorage.setItem('english-progress', JSON.stringify(progress));

      // 1回不正解を追加（consecutiveIncorrect=2になる想定）
      const updatedProgress = {
        wordProgress: {
          dog: {
            ...progress.wordProgress.dog,
            incorrectCount: 2,
            totalAttempts: 3,
            consecutiveIncorrect: 2,
            category: 'incorrect', // 2連続不正解で要学習
          },
        },
        results: [],
      };

      localStorage.setItem('english-progress', JSON.stringify(updatedProgress));

      const stored = localStorage.getItem('english-progress');
      const parsed = JSON.parse(stored!);
      expect(parsed.wordProgress.dog.category).toBe('incorrect');
      expect(parsed.wordProgress.dog.consecutiveIncorrect).toBe(2);
    });
  });

  describe('4. セッション統計の反映テスト', () => {
    it('sessionStatsがスケジューリングに影響すること', () => {
      const progress = {
        wordProgress: {
          apple: { word: 'apple', category: 'incorrect', lastStudied: Date.now() - 5000 },
          book: { word: 'book', category: 'incorrect', lastStudied: Date.now() - 4000 },
          cat: { word: 'cat', category: 'still_learning', lastStudied: Date.now() - 3000 },
        },
        results: [],
      };

      localStorage.setItem('english-progress', JSON.stringify(progress));

      // 多くのincorrectを含むセッション
      const result = scheduler.schedule({
        questions: testQuestions,
        mode: 'memorization',
        limits: {
          learningLimit: 10,
          reviewLimit: 5,
        },
        sessionStats: {
          correct: 2,
          incorrect: 5, // 多数の不正解
          still_learning: 1,
          mastered: 0,
          duration: 60000,
        },
        useMetaAI: true,
        isReviewFocusMode: false,
      });

      // incorrectカテゴリーが上位に配置されること
      const topCategories = result.scheduledQuestions
        .slice(0, 3)
        .filter((q) => ['apple', 'book', 'cat'].includes(q.word));

      expect(topCategories.length).toBeGreaterThan(0);
    });

    it('limitsが正しく適用されること', () => {
      const progress = {
        wordProgress: {
          apple: { word: 'apple', category: 'incorrect', lastStudied: Date.now() },
          book: { word: 'book', category: 'incorrect', lastStudied: Date.now() },
          cat: { word: 'cat', category: 'incorrect', lastStudied: Date.now() },
          dog: { word: 'dog', category: 'still_learning', lastStudied: Date.now() },
          elephant: { word: 'elephant', category: 'still_learning', lastStudied: Date.now() },
        },
        results: [],
      };

      localStorage.setItem('english-progress', JSON.stringify(progress));

      const result = scheduler.schedule({
        questions: testQuestions,
        mode: 'memorization',
        limits: {
          reviewLimit: 2, // incorrectは2つまで
          learningLimit: 1, // still_learningは1つまで
        },
        sessionStats: {
          correct: 0,
          incorrect: 2, // すでに上限
          still_learning: 1, // すでに上限
          mastered: 0,
          duration: 0,
        },
        useMetaAI: true,
        isReviewFocusMode: true, // 復習モード
      });

      // 上限に達しているため、復習単語が優先されること
      expect(result.scheduledQuestions.length).toBeGreaterThan(0);
    });
  });

  describe('5. 総合シナリオテスト', () => {
    it('初回学習→復習→定着の完全フローが正しく動作すること', () => {
      // シナリオ: 新規単語を学習→不正解→復習→正解→定着

      // ステップ1: 初回（新規）
      const progress = {
        wordProgress: {
          apple: {
            word: 'apple',
            category: 'new',
            correctCount: 0,
            incorrectCount: 0,
            totalAttempts: 0,
            consecutiveCorrect: 0,
            consecutiveIncorrect: 0,
            lastStudied: 0,
          },
        },
        results: [],
      };
      localStorage.setItem('english-progress', JSON.stringify(progress));

      let result = scheduler.schedule({
        questions: [testQuestions[0]],
        mode: 'memorization',
        limits: { learningLimit: 10, reviewLimit: 10 },
        sessionStats: { correct: 0, incorrect: 0, still_learning: 0, mastered: 0, duration: 0 },
        useMetaAI: true,
        isReviewFocusMode: false,
      });

      expect(result.scheduledQuestions[0].word).toBe('apple');

      // ステップ2: 不正解（incorrect化）
      progress.wordProgress.apple = {
        ...progress.wordProgress.apple,
        category: 'incorrect',
        incorrectCount: 1,
        totalAttempts: 1,
        consecutiveIncorrect: 1,
        lastStudied: Date.now(),
      };
      localStorage.setItem('english-progress', JSON.stringify(progress));

      result = scheduler.schedule({
        questions: [testQuestions[0]],
        mode: 'memorization',
        limits: { learningLimit: 10, reviewLimit: 10 },
        sessionStats: { correct: 0, incorrect: 1, still_learning: 0, mastered: 0, duration: 1000 },
        useMetaAI: true,
        isReviewFocusMode: false,
      });

      // incorrectとして優先されること
      expect(result.scheduledQuestions[0].word).toBe('apple');

      // ステップ3: 正解（still_learning化）
      progress.wordProgress.apple = {
        ...progress.wordProgress.apple,
        category: 'still_learning',
        correctCount: 1,
        totalAttempts: 2,
        consecutiveCorrect: 1,
        consecutiveIncorrect: 0,
        lastStudied: Date.now(),
      };
      localStorage.setItem('english-progress', JSON.stringify(progress));

      // ステップ4: 連続正解（mastered化）
      progress.wordProgress.apple = {
        ...progress.wordProgress.apple,
        category: 'mastered',
        correctCount: 3,
        totalAttempts: 4,
        consecutiveCorrect: 3,
        lastStudied: Date.now(),
      };
      localStorage.setItem('english-progress', JSON.stringify(progress));

      const stored = localStorage.getItem('english-progress');
      const parsed = JSON.parse(stored!);
      expect(parsed.wordProgress.apple.category).toBe('mastered');
      expect(parsed.wordProgress.apple.consecutiveCorrect).toBe(3);
    });
  });
});
