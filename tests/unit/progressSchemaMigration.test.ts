// @test-guard-bypass: このテストは進捗データのスキーマ互換（schemaVersion付与/前方互換ガード）を確認するもので、外部データファイルには依存しない
import { describe, expect, it } from 'vitest';

import {
  CURRENT_PROGRESS_SCHEMA_VERSION,
  migrateUserProgress,
} from '@/storage/progress/progressSchema';
import type { UserProgress } from '@/storage/progress/types';

function baseProgress(overrides: Partial<UserProgress> = {}): UserProgress {
  return {
    schemaVersion: undefined,
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
    ...overrides,
  };
}

describe('progressSchema.migrateUserProgress', () => {
  it('adds schemaVersion when missing (v0 -> current)', () => {
    const progress = baseProgress({ schemaVersion: undefined });

    const res = migrateUserProgress(progress, null);

    expect(res.status).toBe('ok');
    if (res.status !== 'ok') throw new Error('unexpected');

    expect(res.didMigrate).toBe(true);
    expect(progress.schemaVersion).toBe(CURRENT_PROGRESS_SCHEMA_VERSION);
  });

  it('does nothing when schemaVersion is already current', () => {
    const progress = baseProgress({ schemaVersion: CURRENT_PROGRESS_SCHEMA_VERSION });

    const res = migrateUserProgress(progress, CURRENT_PROGRESS_SCHEMA_VERSION);

    expect(res.status).toBe('ok');
    if (res.status !== 'ok') throw new Error('unexpected');

    expect(res.didMigrate).toBe(false);
    expect(res.fromVersion).toBe(CURRENT_PROGRESS_SCHEMA_VERSION);
    expect(res.toVersion).toBe(CURRENT_PROGRESS_SCHEMA_VERSION);
  });

  it('does not downgrade when stored schema is newer than supported', () => {
    const progress = baseProgress({ schemaVersion: 999 });

    const res = migrateUserProgress(progress, 999);

    expect(res.status).toBe('too_new');
    if (res.status !== 'too_new') throw new Error('unexpected');

    expect(res.storedVersion).toBe(999);
    expect(res.supportedVersion).toBe(CURRENT_PROGRESS_SCHEMA_VERSION);
    // 未来データは破壊的に書き換えない
    expect(progress.schemaVersion).toBe(999);
  });
});
