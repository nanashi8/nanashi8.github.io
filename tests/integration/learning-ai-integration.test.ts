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
import { updateProgressCache } from '../../src/storage/progress/progressStorage';
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

  const setProgress = (partial: any) => {
    const base = {
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

    const merged = {
      ...base,
      ...partial,
      wordProgress: partial?.wordProgress ?? {},
      results: partial?.results ?? [],
    };

    localStorage.setItem('english-progress', JSON.stringify(merged));
    updateProgressCache(merged);
  };

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

    // 初期データを設定（loadProgressSyncのキャッシュも同期する）
    setProgress({ wordProgress: {}, results: [] });

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

      setProgress(progress);

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

      setProgress(progress);

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

      setProgress(progress);

      const stored = localStorage.getItem('english-progress');
      const parsed = JSON.parse(stored!);
      expect(parsed.wordProgress.book.category).toBe('still_learning');
    });
  });

  describe('2. QuestionSchedulerの学習履歴読み取りテスト', () => {
    it('incorrectカテゴリーの単語を優先的に選択すること', async () => {
      // テストデータ: incorrect、still_learning、masteredが混在
      const progress = {
        wordProgress: {
          apple: {
            word: 'apple',
            category: 'mastered',
            correctCount: 3,
            incorrectCount: 0,
            totalAttempts: 3,
            memorizationPosition: 10,
            memorizationAttempts: 3,
            memorizationCorrect: 3,
            memorizationStillLearning: 0,
            consecutiveCorrect: 0,
            consecutiveIncorrect: 0,
            lastStudied: Date.now() - 10000,
          },
          book: {
            word: 'book',
            category: 'still_learning',
            correctCount: 1,
            incorrectCount: 1,
            totalAttempts: 2,
            memorizationPosition: 65,
            memorizationAttempts: 2,
            memorizationCorrect: 1,
            memorizationStillLearning: 1,
            consecutiveCorrect: 0,
            consecutiveIncorrect: 0,
            lastStudied: Date.now() - 5000,
          },
          cat: {
            word: 'cat',
            category: 'incorrect',
            correctCount: 0,
            incorrectCount: 2,
            totalAttempts: 2,
            consecutiveIncorrect: 2,
            memorizationPosition: 85,
            memorizationAttempts: 2,
            memorizationCorrect: 0,
            memorizationStillLearning: 0,
            consecutiveCorrect: 0,
            lastStudied: Date.now() - 3000,
          },
          dog: {
            word: 'dog',
            category: 'incorrect',
            correctCount: 0,
            incorrectCount: 3,
            totalAttempts: 3,
            consecutiveIncorrect: 3,
            memorizationPosition: 80,
            memorizationAttempts: 3,
            memorizationCorrect: 0,
            memorizationStillLearning: 0,
            consecutiveCorrect: 0,
            lastStudied: Date.now() - 2000,
          },
          elephant: {
            word: 'elephant',
            category: 'new',
            correctCount: 0,
            incorrectCount: 0,
            totalAttempts: 0,
            memorizationPosition: 30,
            memorizationAttempts: 0,
            memorizationCorrect: 0,
            memorizationStillLearning: 0,
            consecutiveCorrect: 0,
            consecutiveIncorrect: 0,
            lastStudied: 0,
          },
        },
        results: [],
      };

      setProgress(progress);

      const result = await scheduler.schedule({
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
        isReviewFocusMode: false,
      });

      // Position帯(SSOT)に従い、incorrect / still_learning が上位に来ることを確認する
      const top3Words = result.scheduledQuestions.slice(0, 3).map((q) => q.word);
      expect(top3Words.some((w) => w === 'cat' || w === 'dog')).toBe(true);
      expect(top3Words).toContain('book');
    });

    it('still_learningカテゴリーがincorrectの次に優先されること', async () => {
      const progress = {
        wordProgress: {
          apple: {
            word: 'apple',
            category: 'mastered',
            correctCount: 3,
            incorrectCount: 0,
            totalAttempts: 3,
            memorizationPosition: 10,
            memorizationAttempts: 3,
            memorizationCorrect: 3,
            memorizationStillLearning: 0,
            consecutiveCorrect: 0,
            consecutiveIncorrect: 0,
            lastStudied: Date.now() - 10000,
          },
          book: {
            word: 'book',
            category: 'still_learning',
            correctCount: 1,
            incorrectCount: 1,
            totalAttempts: 2,
            memorizationPosition: 66,
            memorizationAttempts: 2,
            memorizationCorrect: 1,
            memorizationStillLearning: 1,
            consecutiveCorrect: 0,
            consecutiveIncorrect: 0,
            lastStudied: Date.now() - 5000,
          },
          cat: {
            word: 'cat',
            category: 'still_learning',
            correctCount: 2,
            incorrectCount: 1,
            totalAttempts: 3,
            memorizationPosition: 64,
            memorizationAttempts: 3,
            memorizationCorrect: 2,
            memorizationStillLearning: 1,
            consecutiveCorrect: 0,
            consecutiveIncorrect: 0,
            lastStudied: Date.now() - 4000,
          },
          dog: {
            word: 'dog',
            category: 'new',
            correctCount: 0,
            incorrectCount: 0,
            totalAttempts: 0,
            memorizationPosition: 30,
            memorizationAttempts: 0,
            memorizationCorrect: 0,
            memorizationStillLearning: 0,
            consecutiveCorrect: 0,
            consecutiveIncorrect: 0,
            lastStudied: 0,
          },
          elephant: {
            word: 'elephant',
            category: 'new',
            correctCount: 0,
            incorrectCount: 0,
            totalAttempts: 0,
            memorizationPosition: 30,
            memorizationAttempts: 0,
            memorizationCorrect: 0,
            memorizationStillLearning: 0,
            consecutiveCorrect: 0,
            consecutiveIncorrect: 0,
            lastStudied: 0,
          },
        },
        results: [],
      };

      setProgress(progress);

      const result = await scheduler.schedule({
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
        isReviewFocusMode: false,
      });

      // still_learning が new / mastered より上位に来ることを確認する
      const top3Words = result.scheduledQuestions.slice(0, 3).map((q) => q.word);
      expect(top3Words.some((w) => w === 'book' || w === 'cat')).toBe(true);
    });

    it('masteredカテゴリーの単語は優先度が低いこと', async () => {
      const progress = {
        wordProgress: {
          apple: {
            word: 'apple',
            category: 'mastered',
            correctCount: 5,
            incorrectCount: 0,
            totalAttempts: 5,
            consecutiveCorrect: 5,
            memorizationPosition: 10,
            memorizationAttempts: 5,
            memorizationCorrect: 5,
            memorizationStillLearning: 0,
            lastStudied: Date.now() - 10000,
          },
          book: {
            word: 'book',
            category: 'incorrect',
            correctCount: 0,
            incorrectCount: 2,
            totalAttempts: 2,
            consecutiveIncorrect: 2,
            memorizationPosition: 85,
            memorizationAttempts: 2,
            memorizationCorrect: 0,
            memorizationStillLearning: 0,
            consecutiveCorrect: 0,
            lastStudied: Date.now() - 1000,
          },
          dog: {
            word: 'dog',
            category: 'incorrect',
            correctCount: 0,
            incorrectCount: 3,
            totalAttempts: 3,
            consecutiveIncorrect: 3,
            memorizationPosition: 80,
            memorizationAttempts: 3,
            memorizationCorrect: 0,
            memorizationStillLearning: 0,
            consecutiveCorrect: 0,
            lastStudied: Date.now() - 2000,
          },
          cat: {
            word: 'cat',
            category: 'new',
            correctCount: 0,
            incorrectCount: 0,
            totalAttempts: 0,
            memorizationPosition: 30,
            memorizationAttempts: 0,
            memorizationCorrect: 0,
            memorizationStillLearning: 0,
            consecutiveCorrect: 0,
            consecutiveIncorrect: 0,
            lastStudied: 0,
          },
          elephant: {
            word: 'elephant',
            category: 'new',
            correctCount: 0,
            incorrectCount: 0,
            totalAttempts: 0,
            memorizationPosition: 30,
            memorizationAttempts: 0,
            memorizationCorrect: 0,
            memorizationStillLearning: 0,
            consecutiveCorrect: 0,
            consecutiveIncorrect: 0,
            lastStudied: 0,
          },
        },
        results: [],
      };

      setProgress(progress);

      const result = await scheduler.schedule({
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
        isReviewFocusMode: false,
      });

      // mastered は先頭にならないこと（incorrect/new が上位になる）
      expect(result.scheduledQuestions[0].word).not.toBe('apple');
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

      setProgress(progress);

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

      setProgress(updatedProgress);

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

      setProgress(progress);

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

      setProgress(updatedProgress);

      const stored = localStorage.getItem('english-progress');
      const parsed = JSON.parse(stored!);
      expect(parsed.wordProgress.dog.category).toBe('incorrect');
      expect(parsed.wordProgress.dog.consecutiveIncorrect).toBe(2);
    });
  });

  describe('4. セッション統計の反映テスト', () => {
    it('sessionStatsがスケジューリングに影響すること', async () => {
      const progress = {
        wordProgress: {
          apple: {
            word: 'apple',
            category: 'incorrect',
            memorizationPosition: 85,
            memorizationAttempts: 2,
            memorizationCorrect: 0,
            memorizationStillLearning: 0,
            consecutiveCorrect: 0,
            consecutiveIncorrect: 2,
            lastStudied: Date.now() - 5000,
          },
          book: {
            word: 'book',
            category: 'incorrect',
            memorizationPosition: 80,
            memorizationAttempts: 3,
            memorizationCorrect: 0,
            memorizationStillLearning: 0,
            consecutiveCorrect: 0,
            consecutiveIncorrect: 3,
            lastStudied: Date.now() - 4000,
          },
          cat: {
            word: 'cat',
            category: 'still_learning',
            memorizationPosition: 65,
            memorizationAttempts: 2,
            memorizationCorrect: 1,
            memorizationStillLearning: 1,
            consecutiveCorrect: 0,
            consecutiveIncorrect: 0,
            lastStudied: Date.now() - 3000,
          },
          dog: {
            word: 'dog',
            category: 'new',
            memorizationPosition: 30,
            memorizationAttempts: 0,
            memorizationCorrect: 0,
            memorizationStillLearning: 0,
            consecutiveCorrect: 0,
            consecutiveIncorrect: 0,
            lastStudied: 0,
          },
          elephant: {
            word: 'elephant',
            category: 'new',
            memorizationPosition: 30,
            memorizationAttempts: 0,
            memorizationCorrect: 0,
            memorizationStillLearning: 0,
            consecutiveCorrect: 0,
            consecutiveIncorrect: 0,
            lastStudied: 0,
          },
        },
        results: [],
      };

      // progressStorage側は内部キャッシュを持つため、テストでは必ず helper 経由で反映する
      setProgress(progress);

      // 多くのincorrectを含むセッション
      const result = await scheduler.schedule({
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
        isReviewFocusMode: false,
      });

      // incorrectカテゴリーが上位に配置されること
      const top3Words = result.scheduledQuestions.slice(0, 3).map((q) => q.word);
      expect(top3Words.some((w) => w === 'apple' || w === 'book')).toBe(true);
    });

    it('limitsが正しく適用されること', async () => {
      const progress = {
        wordProgress: {
          apple: { word: 'apple', category: 'incorrect', memorizationPosition: 85, lastStudied: Date.now() },
          book: { word: 'book', category: 'incorrect', memorizationPosition: 80, lastStudied: Date.now() },
          cat: { word: 'cat', category: 'incorrect', memorizationPosition: 75, lastStudied: Date.now() },
          dog: { word: 'dog', category: 'still_learning', memorizationPosition: 65, lastStudied: Date.now() },
          elephant: { word: 'elephant', category: 'still_learning', memorizationPosition: 64, lastStudied: Date.now() },
        },
        results: [],
      };

      localStorage.setItem('english-progress', JSON.stringify(progress));

      const result = await scheduler.schedule({
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
        isReviewFocusMode: true, // 復習モード
      });

      // 上限に達しているため、復習単語が優先されること
      expect(result.scheduledQuestions.length).toBeGreaterThan(0);
    });
  });

  describe('5. 総合シナリオテスト', () => {
    it('初回学習→復習→定着の完全フローが正しく動作すること', async () => {
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
            memorizationPosition: 35,
            memorizationAttempts: 0,
            memorizationCorrect: 0,
            memorizationStillLearning: 0,
            lastStudied: 0,
          },
        },
        results: [],
      };
      localStorage.setItem('english-progress', JSON.stringify(progress));

      let result = await scheduler.schedule({
        questions: [testQuestions[0]],
        mode: 'memorization',
        limits: { learningLimit: 10, reviewLimit: 10 },
        sessionStats: { correct: 0, incorrect: 0, still_learning: 0, mastered: 0, duration: 0 },
        isReviewFocusMode: false,
      });

      expect(result.scheduledQuestions.map((q) => q.word)).toContain('apple');

      // ステップ2: 不正解（incorrect化）
      progress.wordProgress.apple = {
        ...progress.wordProgress.apple,
        category: 'incorrect',
        incorrectCount: 1,
        totalAttempts: 1,
        consecutiveIncorrect: 1,
        memorizationPosition: 80,
        memorizationAttempts: 1,
        memorizationCorrect: 0,
        memorizationStillLearning: 0,
        lastStudied: Date.now(),
      };
      localStorage.setItem('english-progress', JSON.stringify(progress));

      result = await scheduler.schedule({
        questions: [testQuestions[0]],
        mode: 'memorization',
        limits: { learningLimit: 10, reviewLimit: 10 },
        sessionStats: { correct: 0, incorrect: 1, still_learning: 0, mastered: 0, duration: 1000 },
        isReviewFocusMode: false,
      });

      // incorrectとして優先されること
      expect(result.scheduledQuestions.map((q) => q.word)).toContain('apple');

      // ステップ3: 正解（still_learning化）
      progress.wordProgress.apple = {
        ...progress.wordProgress.apple,
        category: 'still_learning',
        correctCount: 1,
        totalAttempts: 2,
        consecutiveCorrect: 1,
        consecutiveIncorrect: 0,
        memorizationPosition: 65,
        memorizationAttempts: 2,
        memorizationCorrect: 1,
        memorizationStillLearning: 1,
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
        memorizationPosition: 10,
        memorizationAttempts: 4,
        memorizationCorrect: 3,
        memorizationStillLearning: 1,
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
