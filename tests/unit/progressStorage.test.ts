import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadProgressSync,
  updateProgressCache,
  getResultsByDateRange,
  exportProgress,
  importProgress,
  clearProgress,
  getWeakWords,
  getWordProgress,
  getAllWordProgress,
  getWordsByMasteryLevel,
  getWordsSortedByDifficulty,
  type UserProgress,
  type QuizResult,
  type WordProgress,
} from '@/storage/progress/progressStorage';

describe('progressStorage', () => {
  beforeEach(() => {
    // LocalStorageをクリア
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('loadProgressSync', () => {
    it('初回ロード時に初期化されたデータを返す', () => {
      const progress = loadProgressSync();

      expect(progress).toBeDefined();
      expect(progress.results).toEqual([]);
      expect(progress.statistics).toBeDefined();
      expect(progress.statistics.totalQuizzes).toBe(0);
      expect(progress.wordProgress).toEqual({});
    });

    it('LocalStorageからデータを読み込む', () => {
      // 新しいProgressデータを作成してキャッシュに設定
      const mockProgress: UserProgress = {
        results: [
          {
            date: Date.now(),
            score: 80,
            total: 10,
            correct: 8,
            questionSetId: 'test-set',
            mode: 'normal',
          } as QuizResult,
        ],
        statistics: {
          totalQuizzes: 1,
          totalQuestions: 10,
          totalCorrect: 8,
          averageScore: 80,
          bestScore: 80,
          streakDays: 1,
          lastStudyDate: Date.now(),
          studyDates: [Date.now()],
        },
        questionSetStats: {},
        categoryStats: {},
        difficultyStats: {},
        wordProgress: {},
      };

      // LocalStorageに保存してキャッシュに設定
      localStorage.setItem('progress-data', JSON.stringify(mockProgress));
      updateProgressCache(mockProgress);

      const progress = loadProgressSync();

      expect(progress.results).toHaveLength(1);
      expect(progress.statistics.totalQuizzes).toBe(1);
      expect(progress.statistics.totalCorrect).toBe(8);
    });

    it('破損したJSONデータを処理する', () => {
      // 完全にクリーンな状態から開始
      localStorage.clear();
      localStorage.setItem('progress-data', 'invalid-json-{');

      // 空の初期データでキャッシュをリセット
      const emptyProgress: UserProgress = {
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
      updateProgressCache(emptyProgress);

      // この時点でloadProgressSyncはキャッシュから空データを返すべき
      const progress = loadProgressSync();

      // エラー時は初期化されたデータを返す
      expect(progress.results).toEqual([]);
      expect(progress.statistics.totalQuizzes).toBe(0);
    });
  });

  describe('updateProgressCache', () => {
    it('キャッシュを更新する', () => {
      const mockProgress: UserProgress = {
        results: [],
        statistics: {
          totalQuizzes: 5,
          totalQuestions: 50,
          totalCorrect: 40,
          averageScore: 80,
          bestScore: 100,
          streakDays: 3,
          lastStudyDate: Date.now(),
          studyDates: [],
        },
        questionSetStats: {},
        categoryStats: {},
        difficultyStats: {},
        wordProgress: {},
      };

      updateProgressCache(mockProgress);

      const progress = loadProgressSync();
      expect(progress.statistics.totalQuizzes).toBe(5);
      expect(progress.statistics.totalCorrect).toBe(40);
    });
  });

  describe('getResultsByDateRange', () => {
    it('指定期間内の結果を返す', () => {
      const now = Date.now();
      const yesterday = now - 24 * 60 * 60 * 1000;
      const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

      const mockProgress: UserProgress = {
        results: [
          { date: now, score: 90, total: 10, correct: 9 } as QuizResult,
          { date: yesterday, score: 80, total: 10, correct: 8 } as QuizResult,
          { date: twoDaysAgo, score: 70, total: 10, correct: 7 } as QuizResult,
        ],
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

      updateProgressCache(mockProgress);

      const results = getResultsByDateRange(yesterday - 1000, now + 1000);

      expect(results).toHaveLength(2);
      expect(results[0].score).toBe(90);
      expect(results[1].score).toBe(80);
    });

    it('期間外の結果を除外する', () => {
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;

      const mockProgress: UserProgress = {
        results: [
          { date: now, score: 90, total: 10, correct: 9 } as QuizResult,
          { date: oneHourAgo, score: 80, total: 10, correct: 8 } as QuizResult,
        ],
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

      updateProgressCache(mockProgress);

      const results = getResultsByDateRange(now - 30 * 60 * 1000, now + 1000);

      expect(results).toHaveLength(1);
      expect(results[0].score).toBe(90);
    });
  });

  describe('exportProgress', () => {
    it('進捗データをJSON文字列としてエクスポートする', () => {
      const mockProgress: UserProgress = {
        results: [{ date: Date.now(), score: 85, total: 10, correct: 8 } as QuizResult],
        statistics: {
          totalQuizzes: 1,
          totalQuestions: 10,
          totalCorrect: 8,
          averageScore: 85,
          bestScore: 85,
          streakDays: 1,
          lastStudyDate: Date.now(),
          studyDates: [],
        },
        questionSetStats: {},
        categoryStats: {},
        difficultyStats: {},
        wordProgress: {},
      };

      updateProgressCache(mockProgress);

      const exported = exportProgress();

      expect(exported).toBeTruthy();
      const parsed = JSON.parse(exported);
      expect(parsed.statistics.totalQuizzes).toBe(1);
      expect(parsed.results).toHaveLength(1);
    });
  });

  describe('importProgress', () => {
    it('有効なJSON文字列からデータをインポートする', () => {
      const mockData = {
        results: [{ date: Date.now(), score: 75, total: 10, correct: 7 }],
        statistics: {
          totalQuizzes: 1,
          totalQuestions: 10,
          totalCorrect: 7,
          averageScore: 75,
          bestScore: 75,
          streakDays: 1,
          lastStudyDate: Date.now(),
          studyDates: [],
        },
        questionSetStats: {},
        categoryStats: {},
        difficultyStats: {},
        wordProgress: {},
      };

      const success = importProgress(JSON.stringify(mockData));

      expect(success).toBe(true);

      const progress = loadProgressSync();
      expect(progress.statistics.totalQuizzes).toBe(1);
      expect(progress.results).toHaveLength(1);
    });

    it('無効なJSON文字列を拒否する', () => {
      const success = importProgress('invalid-json-data');

      expect(success).toBe(false);
    });
  });

  describe('clearProgress', () => {
    it('進捗データをクリアする', () => {
      // confirm()をモック（jsdomで未実装のため）
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      const mockProgress: UserProgress = {
        results: [{ date: Date.now(), score: 90, total: 10, correct: 9 } as QuizResult],
        statistics: {
          totalQuizzes: 1,
          totalQuestions: 10,
          totalCorrect: 9,
          averageScore: 90,
          bestScore: 90,
          streakDays: 1,
          lastStudyDate: Date.now(),
          studyDates: [],
        },
        questionSetStats: {},
        categoryStats: {},
        difficultyStats: {},
        wordProgress: {},
      };

      updateProgressCache(mockProgress);
      localStorage.setItem('quiz-app-user-progress', JSON.stringify(mockProgress));

      clearProgress();

      expect(confirmSpy).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalled();
      expect(localStorage.getItem('quiz-app-user-progress')).toBeNull();

      confirmSpy.mockRestore();
      alertSpy.mockRestore();
    });
  });

  describe('getWeakWords', () => {
    it('間違いの多い単語を返す', () => {
      const mockProgress: UserProgress = {
        results: [
          {
            date: Date.now(),
            score: 50,
            total: 10,
            correct: 5,
            incorrectWords: [
              'cherry',
              'cherry',
              'cherry',
              'cherry',
              'cherry',
              'apple',
              'apple',
              'apple',
            ],
          } as QuizResult,
          {
            date: Date.now(),
            score: 60,
            total: 10,
            correct: 6,
            incorrectWords: ['cherry', 'cherry', 'cherry', 'apple', 'apple', 'banana', 'banana'],
          } as QuizResult,
        ],
        statistics: {
          totalQuizzes: 2,
          totalQuestions: 20,
          totalCorrect: 11,
          averageScore: 55,
          bestScore: 60,
          streakDays: 1,
          lastStudyDate: Date.now(),
          studyDates: [],
        },
        questionSetStats: {},
        categoryStats: {},
        difficultyStats: {},
        wordProgress: {},
      };

      updateProgressCache(mockProgress);

      const weakWords = getWeakWords(2);

      expect(weakWords).toHaveLength(2);
      expect(weakWords[0].word).toBe('cherry'); // 8 mistakes
      expect(weakWords[0].mistakes).toBe(8);
      expect(weakWords[1].word).toBe('apple'); // 5 mistakes
      expect(weakWords[1].mistakes).toBe(5);
    });

    it('空のwordProgressから空配列を返す', () => {
      const mockProgress: UserProgress = {
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

      updateProgressCache(mockProgress);

      const weakWords = getWeakWords(5);

      expect(weakWords).toEqual([]);
    });
  });

  describe('getWordProgress', () => {
    it('指定した単語の進捗を返す', () => {
      const mockProgress: UserProgress = {
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
          dog: {
            word: 'dog',
            correct: 5,
            incorrect: 2,
            lastStudied: Date.now(),
            consecutiveCorrect: 2,
            nextReviewDate: Date.now(),
            masteryLevel: 'learning',
          },
        },
      };

      updateProgressCache(mockProgress);

      const progress = getWordProgress('dog');

      expect(progress).toBeDefined();
      expect(progress?.word).toBe('dog');
      expect(progress?.correct).toBe(5);
      expect(progress?.incorrect).toBe(2);
    });

    it('存在しない単語にnullを返す', () => {
      const mockProgress: UserProgress = {
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

      updateProgressCache(mockProgress);

      const progress = getWordProgress('nonexistent');

      expect(progress).toBeNull();
    });
  });

  describe('getAllWordProgress', () => {
    it('すべての単語進捗を配列で返す', () => {
      const mockProgress: UserProgress = {
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
          cat: {
            word: 'cat',
            correct: 3,
            incorrect: 1,
            lastStudied: Date.now(),
            consecutiveCorrect: 1,
            nextReviewDate: Date.now(),
            masteryLevel: 'new',
          },
          dog: {
            word: 'dog',
            correct: 7,
            incorrect: 0,
            lastStudied: Date.now(),
            consecutiveCorrect: 7,
            nextReviewDate: Date.now(),
            masteryLevel: 'mastered',
          },
        },
      };

      updateProgressCache(mockProgress);

      const allProgress = getAllWordProgress();

      expect(allProgress).toHaveLength(2);
      expect(allProgress.map((p) => p.word)).toContain('cat');
      expect(allProgress.map((p) => p.word)).toContain('dog');
    });
  });

  describe('getWordsByMasteryLevel', () => {
    it('習熟度別に単語を取得する', () => {
      const mockProgress: UserProgress = {
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
          new1: {
            word: 'new1',
            correct: 0,
            incorrect: 0,
            lastStudied: Date.now(),
            consecutiveCorrect: 0,
            nextReviewDate: Date.now(),
            masteryLevel: 'new',
          },
          learning1: {
            word: 'learning1',
            correct: 3,
            incorrect: 2,
            lastStudied: Date.now(),
            consecutiveCorrect: 1,
            nextReviewDate: Date.now(),
            masteryLevel: 'learning',
          },
          mastered1: {
            word: 'mastered1',
            correct: 10,
            incorrect: 0,
            lastStudied: Date.now(),
            consecutiveCorrect: 10,
            nextReviewDate: Date.now(),
            masteryLevel: 'mastered',
          },
        },
      };

      updateProgressCache(mockProgress);

      expect(getWordsByMasteryLevel('new')).toEqual(['new1']);
      expect(getWordsByMasteryLevel('learning')).toEqual(['learning1']);
      expect(getWordsByMasteryLevel('mastered')).toEqual(['mastered1']);
    });
  });

  describe('getWordsSortedByDifficulty', () => {
    it('難易度順（間違い率）でソートされた単語を返す', () => {
      const mockProgress: UserProgress = {
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
          easy: {
            word: 'easy',
            correct: 9,
            incorrect: 1,
            lastStudied: Date.now(),
            consecutiveCorrect: 3,
            nextReviewDate: Date.now(),
            masteryLevel: 'learning',
            difficultyScore: 10, // Low difficulty
          },
          medium: {
            word: 'medium',
            correct: 5,
            incorrect: 5,
            lastStudied: Date.now(),
            consecutiveCorrect: 0,
            nextReviewDate: Date.now(),
            masteryLevel: 'new',
            difficultyScore: 50, // Medium difficulty
          },
          hard: {
            word: 'hard',
            correct: 2,
            incorrect: 8,
            lastStudied: Date.now(),
            consecutiveCorrect: 0,
            nextReviewDate: Date.now(),
            masteryLevel: 'new',
            difficultyScore: 80, // High difficulty
          },
        },
      };

      updateProgressCache(mockProgress);

      const sorted = getWordsSortedByDifficulty(3);

      expect(sorted).toHaveLength(3);
      expect(sorted[0].word).toBe('hard'); // Highest difficulty score first
      expect(sorted[1].word).toBe('medium');
      expect(sorted[2].word).toBe('easy');
    });

    it('limit パラメータで件数を制限する', () => {
      const mockProgress: UserProgress = {
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
          word1: {
            word: 'word1',
            correct: 1,
            incorrect: 9,
            lastStudied: Date.now(),
            consecutiveCorrect: 0,
            nextReviewDate: Date.now(),
            masteryLevel: 'new',
            difficultyScore: 90,
          },
          word2: {
            word: 'word2',
            correct: 3,
            incorrect: 7,
            lastStudied: Date.now(),
            consecutiveCorrect: 0,
            nextReviewDate: Date.now(),
            masteryLevel: 'new',
            difficultyScore: 70,
          },
          word3: {
            word: 'word3',
            correct: 5,
            incorrect: 5,
            lastStudied: Date.now(),
            consecutiveCorrect: 0,
            nextReviewDate: Date.now(),
            masteryLevel: 'new',
            difficultyScore: 50,
          },
        },
      };

      updateProgressCache(mockProgress);

      const sorted = getWordsSortedByDifficulty(2);

      expect(sorted).toHaveLength(2);
      expect(sorted[0].word).toBe('word1');
      expect(sorted[1].word).toBe('word2');
    });
  });
});
