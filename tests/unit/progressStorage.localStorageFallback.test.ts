import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// 進捗の永続化（IndexedDB）層は、このテストでは不要なのでモックする
vi.mock('@/storage/manager/storageManager', () => {
  return {
    saveProgressData: vi.fn(async () => true),
    loadProgressData: vi.fn(async () => null),
    saveSetting: vi.fn(async () => true),
    loadSetting: vi.fn(async () => null),
  };
});

// IndexedDB削除はこのテストでは不要
vi.mock('@/storage/indexedDB/indexedDBStorage', () => {
  return {
    deleteDatabase: vi.fn(async () => {}),
  };
});

describe('progressStorage - LocalStorage fallback snapshot', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it('wordProgressが上限超過でも、同期用スナップショットをLocalStorageに保存する（トリム）', async () => {
    const { saveProgress } = await import('@/storage/progress/progressStorage');

    // wordProgressを大量に作る（LocalStorage容量制限対策の経路に入れる）
    const wordProgress: Record<string, any> = {};

    // 最近学習した語を必ず含めたい
    wordProgress['hot-word'] = {
      word: 'hot-word',
      correctCount: 0,
      incorrectCount: 10,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 10,
      firstAttempted: Date.now() - 1000,
      lastStudied: Date.now() - 10,
      totalResponseTime: 0,
      averageResponseTime: 0,
      difficultyScore: 80,
      masteryLevel: 'incorrect',
      responseTimes: [],
      category: 'incorrect',
      memorizationAttempts: 10,
      memorizationCorrect: 0,
      memorizationStillLearning: 0,
    };

    // 1300語（上限1200を超える）
    for (let i = 0; i < 1299; i++) {
      const word = `w-${i}`;
      wordProgress[word] = {
        word,
        correctCount: 0,
        incorrectCount: 0,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 0,
        firstAttempted: 0,
        lastStudied: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        difficultyScore: 50,
        masteryLevel: 'new',
        responseTimes: [],
        category: 'new',
      };
    }

    const progress: any = {
      schemaVersion: 999,
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
      wordProgress,
    };

    await saveProgress(progress);

    // フォールバックはsetTimeoutで遅延保存される
    await vi.runOnlyPendingTimersAsync();

    const stored = localStorage.getItem('english-progress');
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored as string);
    expect(parsed.wordProgress).toBeDefined();

    // 上限を超えて「何も保存しない」のではなく、トリムして保存されること
    expect(Object.keys(parsed.wordProgress).length).toBeGreaterThan(0);
    expect(Object.keys(parsed.wordProgress).length).toBeLessThanOrEqual(1200);

    // 直近学習語が落ちないこと
    expect(parsed.wordProgress['hot-word']).toBeDefined();
  });
});
