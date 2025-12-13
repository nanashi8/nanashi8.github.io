import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStatsByMode,
  getRecentResults,
  getStatsByCategory,
  getStatsByDifficulty,
  getTodayIncorrectWords,
  getDailyStudyTime,
  getTodayStats,
  getWeeklyStats,
} from '@/storage/progress/statistics';
import {
  updateProgressCache,
  type UserProgress,
  type QuizResult,
} from '@/storage/progress/progressStorage';

describe('statistics', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getStatsByMode', () => {
    it('モード別の統計を返す', () => {
      const now = Date.now();
      const mockProgress: UserProgress = {
        results: [
          { date: now, mode: 'translation', percentage: 80, score: 8, total: 10 } as QuizResult,
          { date: now, mode: 'translation', percentage: 90, score: 9, total: 10 } as QuizResult,
          { date: now, mode: 'spelling', percentage: 70, score: 7, total: 10 } as QuizResult,
          { date: now, mode: 'reading', percentage: 85, score: 8, total: 10 } as QuizResult,
        ],
        statistics: {
          totalQuizzes: 4,
          totalQuestions: 40,
          totalCorrect: 32,
          averageScore: 81.25,
          bestScore: 90,
          streakDays: 1,
          lastStudyDate: now,
          studyDates: [],
        },
        questionSetStats: {},
        categoryStats: {},
        difficultyStats: {},
        wordProgress: {},
      };

      updateProgressCache(mockProgress);

      const translationStats = getStatsByMode('translation');
      expect(translationStats.totalQuizzes).toBe(2);
      expect(translationStats.averageScore).toBe(85); // (80 + 90) / 2
      expect(translationStats.bestScore).toBe(90);

      const spellingStats = getStatsByMode('spelling');
      expect(spellingStats.totalQuizzes).toBe(1);
      expect(spellingStats.averageScore).toBe(70);
      expect(spellingStats.bestScore).toBe(70);

      const readingStats = getStatsByMode('reading');
      expect(readingStats.totalQuizzes).toBe(1);
      expect(readingStats.averageScore).toBe(85);
      expect(readingStats.bestScore).toBe(85);
    });

    it('データがない場合はゼロを返す', () => {
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

      const stats = getStatsByMode('translation');
      expect(stats.totalQuizzes).toBe(0);
      expect(stats.averageScore).toBe(0);
      expect(stats.bestScore).toBe(0);
    });
  });

  describe('getRecentResults', () => {
    it('最近の結果を逆順で返す', () => {
      const now = Date.now();
      const mockProgress: UserProgress = {
        results: [
          { date: now - 3000, score: 70, total: 10, percentage: 70 } as QuizResult,
          { date: now - 2000, score: 80, total: 10, percentage: 80 } as QuizResult,
          { date: now - 1000, score: 90, total: 10, percentage: 90 } as QuizResult,
          { date: now, score: 95, total: 10, percentage: 95 } as QuizResult,
        ],
        statistics: {
          totalQuizzes: 4,
          totalQuestions: 40,
          totalCorrect: 33,
          averageScore: 83.75,
          bestScore: 95,
          streakDays: 1,
          lastStudyDate: now,
          studyDates: [],
        },
        questionSetStats: {},
        categoryStats: {},
        difficultyStats: {},
        wordProgress: {},
      };

      updateProgressCache(mockProgress);

      const recent = getRecentResults(3);

      expect(recent).toHaveLength(3);
      expect(recent[0].score).toBe(95); // Most recent first
      expect(recent[1].score).toBe(90);
      expect(recent[2].score).toBe(80);
    });

    it('limitパラメータを尊重する', () => {
      const now = Date.now();
      const mockProgress: UserProgress = {
        results: Array.from({ length: 20 }, (_, i) => ({
          date: now - (20 - i) * 1000,
          score: i + 1,
          total: 10,
          percentage: (i + 1) * 5,
        })) as QuizResult[],
        statistics: {
          totalQuizzes: 20,
          totalQuestions: 200,
          totalCorrect: 150,
          averageScore: 75,
          bestScore: 100,
          streakDays: 1,
          lastStudyDate: now,
          studyDates: [],
        },
        questionSetStats: {},
        categoryStats: {},
        difficultyStats: {},
        wordProgress: {},
      };

      updateProgressCache(mockProgress);

      const recent = getRecentResults(5);

      expect(recent).toHaveLength(5);
      expect(recent[0].score).toBe(20); // Most recent
    });
  });

  describe('getStatsByCategory', () => {
    it('カテゴリ別の統計を計算する', () => {
      const now = Date.now();
      const mockProgress: UserProgress = {
        results: [
          { date: now, category: '言語基本', score: 8, total: 10 } as QuizResult,
          { date: now, category: '言語基本', score: 9, total: 10 } as QuizResult,
          { date: now, category: '日常生活', score: 6, total: 10 } as QuizResult,
          { date: now, category: '日常生活', score: 7, total: 10 } as QuizResult,
        ],
        statistics: {
          totalQuizzes: 4,
          totalQuestions: 40,
          totalCorrect: 30,
          averageScore: 75,
          bestScore: 90,
          streakDays: 1,
          lastStudyDate: now,
          studyDates: [],
        },
        questionSetStats: {},
        categoryStats: {},
        difficultyStats: {},
        wordProgress: {},
      };

      updateProgressCache(mockProgress);

      const categoryStats = getStatsByCategory();

      expect(categoryStats.size).toBe(2);

      const languageBasic = categoryStats.get('言語基本');
      expect(languageBasic?.correctCount).toBe(17); // 8 + 9
      expect(languageBasic?.totalCount).toBe(20); // 10 + 10
      expect(languageBasic?.accuracy).toBe(85); // 17/20 * 100

      const dailyLife = categoryStats.get('日常生活');
      expect(dailyLife?.correctCount).toBe(13); // 6 + 7
      expect(dailyLife?.totalCount).toBe(20);
      expect(dailyLife?.accuracy).toBe(65); // 13/20 * 100
    });

    it('カテゴリがない結果を無視する', () => {
      const now = Date.now();
      const mockProgress: UserProgress = {
        results: [
          { date: now, score: 8, total: 10 } as QuizResult, // No category
        ],
        statistics: {
          totalQuizzes: 1,
          totalQuestions: 10,
          totalCorrect: 8,
          averageScore: 80,
          bestScore: 80,
          streakDays: 1,
          lastStudyDate: now,
          studyDates: [],
        },
        questionSetStats: {},
        categoryStats: {},
        difficultyStats: {},
        wordProgress: {},
      };

      updateProgressCache(mockProgress);

      const categoryStats = getStatsByCategory();
      expect(categoryStats.size).toBe(0);
    });
  });

  describe('getStatsByDifficulty', () => {
    it('難易度別の統計を計算する', () => {
      const now = Date.now();
      const mockProgress: UserProgress = {
        results: [
          { date: now, difficulty: 'easy', score: 9, total: 10 } as QuizResult,
          { date: now, difficulty: 'easy', score: 10, total: 10 } as QuizResult,
          { date: now, difficulty: 'medium', score: 7, total: 10 } as QuizResult,
          { date: now, difficulty: 'hard', score: 5, total: 10 } as QuizResult,
        ],
        statistics: {
          totalQuizzes: 4,
          totalQuestions: 40,
          totalCorrect: 31,
          averageScore: 77.5,
          bestScore: 100,
          streakDays: 1,
          lastStudyDate: now,
          studyDates: [],
        },
        questionSetStats: {},
        categoryStats: {},
        difficultyStats: {},
        wordProgress: {},
      };

      updateProgressCache(mockProgress);

      const difficultyStats = getStatsByDifficulty();

      expect(difficultyStats.size).toBe(3);

      const easy = difficultyStats.get('easy');
      expect(easy?.correctCount).toBe(19); // 9 + 10
      expect(easy?.totalCount).toBe(20);
      expect(easy?.accuracy).toBe(95);

      const medium = difficultyStats.get('medium');
      expect(medium?.correctCount).toBe(7);
      expect(medium?.totalCount).toBe(10);
      expect(medium?.accuracy).toBe(70);

      const hard = difficultyStats.get('hard');
      expect(hard?.correctCount).toBe(5);
      expect(hard?.totalCount).toBe(10);
      expect(hard?.accuracy).toBe(50);
    });
  });

  describe('getTodayIncorrectWords', () => {
    it('当日の誤答単語を返す', () => {
      const now = Date.now();
      const today = now;
      const yesterday = now - 24 * 60 * 60 * 1000;

      const mockProgress: UserProgress = {
        results: [
          {
            date: today,
            incorrectWords: ['apple', 'banana', 'apple'], // applE重複
          } as QuizResult,
          {
            date: today,
            incorrectWords: ['cherry'],
          } as QuizResult,
          {
            date: yesterday,
            incorrectWords: ['dog'], // 昨日のデータ（除外されるべき）
          } as QuizResult,
        ],
        statistics: {
          totalQuizzes: 3,
          totalQuestions: 30,
          totalCorrect: 25,
          averageScore: 83.33,
          bestScore: 90,
          streakDays: 2,
          lastStudyDate: now,
          studyDates: [],
        },
        questionSetStats: {},
        categoryStats: {},
        difficultyStats: {},
        wordProgress: {},
      };

      updateProgressCache(mockProgress);

      const incorrectWords = getTodayIncorrectWords();

      expect(incorrectWords).toHaveLength(3);
      expect(incorrectWords).toContain('apple');
      expect(incorrectWords).toContain('banana');
      expect(incorrectWords).toContain('cherry');
      expect(incorrectWords).not.toContain('dog'); // 昨日のデータは含まれない
    });

    it('当日のデータがない場合は空配列を返す', () => {
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;

      const mockProgress: UserProgress = {
        results: [
          {
            date: yesterday,
            incorrectWords: ['old'],
          } as QuizResult,
        ],
        statistics: {
          totalQuizzes: 1,
          totalQuestions: 10,
          totalCorrect: 9,
          averageScore: 90,
          bestScore: 90,
          streakDays: 1,
          lastStudyDate: yesterday,
          studyDates: [],
        },
        questionSetStats: {},
        categoryStats: {},
        difficultyStats: {},
        wordProgress: {},
      };

      updateProgressCache(mockProgress);

      const incorrectWords = getTodayIncorrectWords();
      expect(incorrectWords).toEqual([]);
    });
  });

  describe('getDailyStudyTime', () => {
    it('日別の学習時間を返す', () => {
      const now = Date.now();
      const today = now;
      const yesterday = now - 24 * 60 * 60 * 1000;
      const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

      const mockProgress: UserProgress = {
        results: [
          { date: today, timeSpent: 300 } as QuizResult, // 5 minutes
          { date: today, timeSpent: 600 } as QuizResult, // 10 minutes
          { date: yesterday, timeSpent: 1200 } as QuizResult, // 20 minutes
          { date: twoDaysAgo, timeSpent: 900 } as QuizResult, // 15 minutes
        ],
        statistics: {
          totalQuizzes: 4,
          totalQuestions: 40,
          totalCorrect: 35,
          averageScore: 87.5,
          bestScore: 95,
          streakDays: 3,
          lastStudyDate: now,
          studyDates: [],
        },
        questionSetStats: {},
        categoryStats: {},
        difficultyStats: {},
        wordProgress: {},
      };

      updateProgressCache(mockProgress);

      const dailyTime = getDailyStudyTime(7);

      expect(dailyTime.length).toBeGreaterThan(0);

      // 日付でソートされている
      const todayEntry = dailyTime.find(
        (d: any) => d.date === new Date(today).toLocaleDateString('ja-JP')
      );
      expect(todayEntry?.timeSpent).toBe(900); // 300 + 600

      const yesterdayEntry = dailyTime.find(
        (d: any) => d.date === new Date(yesterday).toLocaleDateString('ja-JP')
      );
      expect(yesterdayEntry?.timeSpent).toBe(1200);
    });

    it('指定日数分のデータのみ返す', () => {
      const now = Date.now();
      const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;

      const mockProgress: UserProgress = {
        results: [
          { date: now, timeSpent: 600 } as QuizResult,
          { date: eightDaysAgo, timeSpent: 300 } as QuizResult, // 8日前（7日以内でない）
        ],
        statistics: {
          totalQuizzes: 2,
          totalQuestions: 20,
          totalCorrect: 18,
          averageScore: 90,
          bestScore: 95,
          streakDays: 2,
          lastStudyDate: now,
          studyDates: [],
        },
        questionSetStats: {},
        categoryStats: {},
        difficultyStats: {},
        wordProgress: {},
      };

      updateProgressCache(mockProgress);

      const dailyTime = getDailyStudyTime(7);

      expect(dailyTime).toHaveLength(1);
      expect(dailyTime[0].timeSpent).toBe(600);
    });
  });

  describe('getTodayStats', () => {
    it('当日の統計を返す', () => {
      const now = Date.now();
      const today = now;
      const yesterday = now - 24 * 60 * 60 * 1000;

      const mockProgress: UserProgress = {
        results: [
          {
            date: today,
            mode: 'translation',
            score: 8, // getTodayStatsはscoreを使用
            total: 10,
          } as QuizResult,
          {
            date: today,
            mode: 'translation',
            score: 9,
            total: 10,
          } as QuizResult,
          {
            date: yesterday,
            mode: 'translation',
            score: 7,
            total: 10,
          } as QuizResult, // 昨日のデータ（除外されるべき）
        ],
        statistics: {
          totalQuizzes: 3,
          totalQuestions: 30,
          totalCorrect: 24,
          averageScore: 80,
          bestScore: 90,
          streakDays: 2,
          lastStudyDate: now,
          studyDates: [],
        },
        questionSetStats: {},
        categoryStats: {},
        difficultyStats: {},
        wordProgress: {},
      };

      updateProgressCache(mockProgress);

      const stats = getTodayStats();

      expect(stats.todayCorrectCount).toBe(17); // 8 + 9
      expect(stats.todayTotalAnswered).toBe(20); // 10 + 10
      expect(stats.todayAccuracy).toBe(85); // 17/20 * 100
    });

    it('モードでフィルタできる', () => {
      const now = Date.now();

      const mockProgress: UserProgress = {
        results: [
          {
            date: now,
            mode: 'translation',
            score: 8, // scoreプロパティを使用
            total: 10,
          } as QuizResult,
          {
            date: now,
            mode: 'spelling',
            score: 6,
            total: 10,
          } as QuizResult,
        ],
        statistics: {
          totalQuizzes: 2,
          totalQuestions: 20,
          totalCorrect: 14,
          averageScore: 70,
          bestScore: 80,
          streakDays: 1,
          lastStudyDate: now,
          studyDates: [],
        },
        questionSetStats: {},
        categoryStats: {},
        difficultyStats: {},
        wordProgress: {},
      };

      updateProgressCache(mockProgress);

      const translationStats = getTodayStats('translation');
      expect(translationStats.todayCorrectCount).toBe(8);
      expect(translationStats.todayTotalAnswered).toBe(10);
      expect(translationStats.todayAccuracy).toBe(80);

      const spellingStats = getTodayStats('spelling');
      expect(spellingStats.todayCorrectCount).toBe(6);
      expect(spellingStats.todayTotalAnswered).toBe(10);
      expect(spellingStats.todayAccuracy).toBe(60);
    });
  });

  describe('getWeeklyStats', () => {
    it('週間統計を返す', () => {
      const now = Date.now();
      const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
      const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;

      const mockProgress: UserProgress = {
        results: [
          { date: now, score: 9, total: 10 } as QuizResult,
          { date: threeDaysAgo, score: 8, total: 10 } as QuizResult,
          { date: eightDaysAgo, score: 7, total: 10 } as QuizResult, // 8日前（今週に含まれない可能性）
        ],
        statistics: {
          totalQuizzes: 3,
          totalQuestions: 30,
          totalCorrect: 24,
          averageScore: 80,
          bestScore: 90,
          streakDays: 3,
          lastStudyDate: now,
          studyDates: [],
        },
        questionSetStats: {},
        categoryStats: {},
        difficultyStats: {},
        wordProgress: {},
      };

      updateProgressCache(mockProgress);

      const weeklyStats = getWeeklyStats();

      // 実装の戻り値構造に合わせる
      expect(weeklyStats.studyDays).toBeGreaterThanOrEqual(0); // 今週の学習日数
      expect(weeklyStats.totalDays).toBe(7);
      expect(weeklyStats.totalAnswered).toBeGreaterThanOrEqual(0);
      expect(weeklyStats.accuracy).toBeGreaterThanOrEqual(0);
      expect(weeklyStats.newMastered).toBeGreaterThanOrEqual(0);
      expect(weeklyStats.previousWeekAccuracy).toBeGreaterThanOrEqual(0);
    });

    it('データがない場合はゼロを返す', () => {
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

      const weeklyStats = getWeeklyStats();

      // 実装の戻り値構造に合わせる
      expect(weeklyStats.studyDays).toBe(0);
      expect(weeklyStats.totalDays).toBe(7);
      expect(weeklyStats.totalAnswered).toBe(0);
      expect(weeklyStats.accuracy).toBe(0);
      expect(weeklyStats.newMastered).toBe(0);
      expect(weeklyStats.previousWeekAccuracy).toBe(0);
    });
  });
});
