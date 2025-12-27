import type { UserProgress } from './types';

export const CURRENT_PROGRESS_SCHEMA_VERSION = 2 as const;

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

  // v1 -> v2: questionSetStats を mode+questionSetId キーへ移行
  if (fromVersion < 2) {
    const rebuilt: UserProgress['questionSetStats'] = {} as UserProgress['questionSetStats'];
    const sums = new Map<string, { sum: number; count: number }>();

    for (const r of progress.results || []) {
      if (!r || typeof r !== 'object') continue;
      // QuizResult型に準拠している前提だが、念のため最小限の防御
      const mode = (r as any).mode as string | undefined;
      const questionSetId = (r as any).questionSetId as string | undefined;
      const percentage = (r as any).percentage as number | undefined;
      const date = (r as any).date as number | undefined;
      const timeSpent = (r as any).timeSpent as number | undefined;

      if (!mode || !questionSetId) continue;
      const key = `${mode}:${questionSetId}`;

      if (!rebuilt[key]) {
        rebuilt[key] = {
          attempts: 0,
          bestScore: 0,
          averageScore: 0,
          lastAttempt: 0,
          totalTimeSpent: 0,
        };
      }

      const entry = rebuilt[key];
      entry.attempts++;
      if (typeof percentage === 'number' && Number.isFinite(percentage)) {
        entry.bestScore = Math.max(entry.bestScore, percentage);
        const acc = sums.get(key) || { sum: 0, count: 0 };
        acc.sum += percentage;
        acc.count += 1;
        sums.set(key, acc);
      }
      if (typeof date === 'number' && Number.isFinite(date)) {
        entry.lastAttempt = Math.max(entry.lastAttempt, date);
      }
      if (typeof timeSpent === 'number' && Number.isFinite(timeSpent)) {
        entry.totalTimeSpent += timeSpent;
      }
    }

    // 平均スコアを後段で確定
    for (const [key, acc] of sums.entries()) {
      if (!rebuilt[key]) continue;
      rebuilt[key].averageScore = acc.count > 0 ? acc.sum / acc.count : 0;
    }

    progress.questionSetStats = rebuilt;
    didMigrate = true;
    notes.push('Migrate questionSetStats keying to mode:questionSetId (v1 -> v2)');
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
