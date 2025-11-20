// データマイグレーション - LocalStorageからIndexedDBへの自動移行

import {
  initDB,
  isIndexedDBSupported,
  putToDB,
  getFromDB,
  STORES
} from './indexedDBStorage';

const MIGRATION_FLAG_KEY = 'indexeddb-migration-completed';
const MIGRATION_VERSION = '1.0';

// 移行済みチェック
export function isMigrationCompleted(): boolean {
  try {
    const flag = localStorage.getItem(MIGRATION_FLAG_KEY);
    return flag === MIGRATION_VERSION;
  } catch {
    return false;
  }
}

// 移行完了フラグを設定
function setMigrationCompleted(): void {
  try {
    localStorage.setItem(MIGRATION_FLAG_KEY, MIGRATION_VERSION);
    console.log('✅ Migration flag set');
  } catch (error) {
    console.error('Failed to set migration flag:', error);
  }
}

// LocalStorageからデータを取得
function getLocalStorageData(key: string): any {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Failed to get ${key} from localStorage:`, error);
    return null;
  }
}

// progress-dataの移行
async function migrateProgressData(): Promise<boolean> {
  try {
    const progressData = getLocalStorageData('progress-data');
    if (progressData) {
      await putToDB(STORES.PROGRESS, progressData, 'main');
      console.log('📦 Progress data migrated:', Object.keys(progressData.words || {}).length, 'words');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Progress data migration error:', error);
    return false;
  }
}

// session-historyの移行
async function migrateSessionHistory(): Promise<boolean> {
  try {
    const modes = ['translation', 'spelling'];
    let totalMigrated = 0;

    for (const mode of modes) {
      const key = `session-history-${mode}`;
      const history = getLocalStorageData(key);
      
      if (history && Array.isArray(history)) {
        // 各履歴アイテムをIndexedDBに保存
        for (const item of history) {
          await putToDB(STORES.SESSION_HISTORY, {
            mode,
            status: item.status,
            word: item.word,
            timestamp: item.timestamp
          });
          totalMigrated++;
        }
      }
    }

    if (totalMigrated > 0) {
      console.log('📜 Session history migrated:', totalMigrated, 'items');
    }
    return true;
  } catch (error) {
    console.error('Session history migration error:', error);
    return false;
  }
}

// studyStats-{date}の移行（90日以内のみ）
async function migrateDailyStats(): Promise<boolean> {
  try {
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    let migratedCount = 0;
    let cleanedCount = 0;

    // LocalStorageの全キーをチェック
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('studyStats-')) {
        const dateStr = key.replace('studyStats-', '');
        const statDate = new Date(dateStr);

        if (statDate >= ninetyDaysAgo) {
          // 90日以内: 移行
          const stats = getLocalStorageData(key);
          if (stats) {
            await putToDB(STORES.DAILY_STATS, { date: dateStr, ...stats });
            migratedCount++;
          }
        } else {
          // 90日以前: 削除
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }
    }

    if (migratedCount > 0 || cleanedCount > 0) {
      console.log(`📊 Daily stats: migrated ${migratedCount}, cleaned ${cleanedCount}`);
    }
    return true;
  } catch (error) {
    console.error('Daily stats migration error:', error);
    return false;
  }
}

// その他の設定データの移行
async function migrateSettings(): Promise<boolean> {
  try {
    const settingsKeys = [
      'user-goal-level',
      'lastLoginDate',
      'loginStreak',
      'radar-improvement-progress',
      'skip-exclude-groups'
    ];

    let migratedCount = 0;
    for (const key of settingsKeys) {
      const value = getLocalStorageData(key);
      if (value !== null) {
        await putToDB(STORES.SETTINGS, value, key);
        migratedCount++;
      }
    }

    // daily-plan-target と score-board-goal はモード別
    const modes = ['translation', 'spelling', 'reading'];
    for (const mode of modes) {
      const planKey = `daily-plan-target-${mode}`;
      const goalKey = `score-board-goal-${mode}`;
      
      const planValue = localStorage.getItem(planKey);
      if (planValue) {
        await putToDB(STORES.SETTINGS, planValue, planKey);
        migratedCount++;
      }
      
      const goalValue = localStorage.getItem(goalKey);
      if (goalValue) {
        await putToDB(STORES.SETTINGS, goalValue, goalKey);
        migratedCount++;
      }
    }

    if (migratedCount > 0) {
      console.log('⚙️ Settings migrated:', migratedCount, 'items');
    }
    return true;
  } catch (error) {
    console.error('Settings migration error:', error);
    return false;
  }
}

// データ検証
async function verifyMigration(): Promise<boolean> {
  try {
    // 主要なデータが移行されたか確認
    const progressData = await getFromDB(STORES.PROGRESS, 'main');
    
    if (!progressData) {
      console.warn('⚠️ Progress data verification failed');
      return false;
    }

    console.log('✅ Migration verification passed');
    return true;
  } catch (error) {
    console.error('Migration verification error:', error);
    return false;
  }
}

// メイン移行関数
export async function migrateToIndexedDB(): Promise<boolean> {
  // 既に移行済みかチェック
  if (isMigrationCompleted()) {
    console.log('ℹ️ Migration already completed');
    return true;
  }

  // IndexedDB対応チェック
  if (!isIndexedDBSupported()) {
    console.warn('⚠️ IndexedDB not supported, using localStorage');
    return false;
  }

  console.log('🚀 Starting data migration to IndexedDB...');

  try {
    // DB初期化
    await initDB();

    // 各データを順次移行
    const results = await Promise.all([
      migrateProgressData(),
      migrateSessionHistory(),
      migrateDailyStats(),
      migrateSettings()
    ]);

    // 全て成功したか確認
    if (results.every(r => r)) {
      // データ検証
      const verified = await verifyMigration();
      
      if (verified) {
        // 移行完了フラグを設定
        setMigrationCompleted();
        console.log('🎉 Migration completed successfully!');
        return true;
      } else {
        console.error('❌ Migration verification failed');
        return false;
      }
    } else {
      console.error('❌ Some migrations failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
}

// 移行状態のリセット（開発・テスト用）
export function resetMigrationFlag(): void {
  try {
    localStorage.removeItem(MIGRATION_FLAG_KEY);
    console.log('🔄 Migration flag reset');
  } catch (error) {
    console.error('Failed to reset migration flag:', error);
  }
}

// 移行の進捗情報を取得
export function getMigrationInfo(): {
  completed: boolean;
  indexedDBSupported: boolean;
  version: string;
} {
  return {
    completed: isMigrationCompleted(),
    indexedDBSupported: isIndexedDBSupported(),
    version: MIGRATION_VERSION
  };
}
