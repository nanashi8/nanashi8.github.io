import type { UserProgress } from './types';

export const CURRENT_PROGRESS_SCHEMA_VERSION = 1 as const;

export type ProgressSchemaMigrationResult =
  | {
      status: 'ok';
      fromVersion: number;
      toVersion: number;
      didMigrate: boolean;
      notes: string[];
      progress: UserProgress;
    }
  | {
      status: 'too_new';
      storedVersion: number;
      supportedVersion: number;
      notes: string[];
      progress: UserProgress;
    };

export function normalizeSchemaVersion(version: unknown): number | null {
  if (typeof version !== 'number') return null;
  if (!Number.isFinite(version)) return null;
  return version;
}

/**
 * UserProgressを最新スキーマへマイグレーションする。
 *
 * - storedVersionが無い/不正な場合は v0 として扱う。
 * - 将来バージョンのデータ（storedVersion > CURRENT）は破壊的に上書きしない。
 */
export function migrateUserProgress(
  progress: UserProgress,
  storedVersion: number | null
): ProgressSchemaMigrationResult {
  const fromVersion = storedVersion ?? normalizeSchemaVersion(progress.schemaVersion) ?? 0;

  if (fromVersion > CURRENT_PROGRESS_SCHEMA_VERSION) {
    return {
      status: 'too_new',
      storedVersion: fromVersion,
      supportedVersion: CURRENT_PROGRESS_SCHEMA_VERSION,
      notes: ['Stored progress schema is newer than this app supports; skipping migration/save'],
      progress,
    };
  }

  let didMigrate = false;
  const notes: string[] = [];

  // v0 -> v1: schemaVersion導入（データ内容は既存の修復ロジックで担保）
  if (fromVersion < 1) {
    notes.push('Set schemaVersion (v0 -> v1)');
  }

  if (progress.schemaVersion !== CURRENT_PROGRESS_SCHEMA_VERSION) {
    progress.schemaVersion = CURRENT_PROGRESS_SCHEMA_VERSION;
    didMigrate = true;
  }

  // 安全側の正規化（欠損を許容しつつ、最低限の形に寄せる）
  if (!progress.wordProgress || typeof progress.wordProgress !== 'object') {
    progress.wordProgress = {} as UserProgress['wordProgress'];
    didMigrate = true;
    notes.push('Initialize missing wordProgress');
  }
  if (!progress.results || !Array.isArray(progress.results)) {
    progress.results = [];
    didMigrate = true;
    notes.push('Initialize missing results');
  }
  if (!progress.questionSetStats || typeof progress.questionSetStats !== 'object') {
    progress.questionSetStats = {} as UserProgress['questionSetStats'];
    didMigrate = true;
    notes.push('Initialize missing questionSetStats');
  }

  return {
    status: 'ok',
    fromVersion,
    toVersion: CURRENT_PROGRESS_SCHEMA_VERSION,
    didMigrate,
    notes,
    progress,
  };
}
