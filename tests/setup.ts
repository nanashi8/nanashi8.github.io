import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { updateProgressCache } from '../src/storage/progress/progressStorage';
import { CURRENT_PROGRESS_SCHEMA_VERSION } from '../src/storage/progress/progressSchema';
import type { UserProgress } from '../src/storage/progress/types';

function createEmptyProgress(): UserProgress {
  return {
    schemaVersion: CURRENT_PROGRESS_SCHEMA_VERSION,
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
}

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup();

  // テスト間の状態リークを防ぐ（localStorageベースのSSOT/デバッグ出力が混ざると不安定になる）
  try {
    window.localStorage?.clear();
    window.sessionStorage?.clear();
  } catch {
    // ignore
  }

  // progressStorageは module-level cache（progressCache）を持つため、明示的に初期化する
  updateProgressCache(createEmptyProgress());
});

// LocalStorage/SessionStorageのモック
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
});
