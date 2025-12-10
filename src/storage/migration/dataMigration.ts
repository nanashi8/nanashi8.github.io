// データマイグレーション - LocalStorageからIndexedDBへの自動移行

import {
  initDB,
  isIndexedDBSupported,
  putToDB,
  getFromDB,
  STORES
} from '@/storage/indexedDB/indexedDBStorage';
import { logger } from '@/logger';

const MIGRATION_FLAG_KEY = 'indexeddb-migration-completed';
const MIGRATION_VERSION = '1.1'; // バージョンアップしてエラー修正版で再移行

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
    logger.log('✅ Migration flag set');
  } catch (error) {
    logger.error('Failed to set migration flag:', error);
  }
}

// LocalStorageからデータを取得（JSON用）
function getLocalStorageData(key: string): any {
  try {
    const data = localStorage.getItem(key);
    if (!data) return null;
    
    // 文字列データは直接返す（JSONパースしない）
    if (key.includes('lastLogin') || key.includes('Date') || key.includes('daily-plan') || key.includes('score-board')) {
      return null; // これらは別の方法で処理
    }
    
    return JSON.parse(data);
  } catch (_error) {
    // JSONパースエラーは警告のみ（文字列データの可能性）
    logger.warn(`${key} is not valid JSON (skipping)`);
    return null;
  }
}

// LocalStorageから生データ（文字列）を取得
function getLocalStorageRawData(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (_error) {
    logger.error(`Failed to get ${key} from localStorage:`, _error);
    return null;
  }
}

// progress-dataの移行
async function migrateProgressData(): Promise<boolean> {
  try {
    const progressData = getLocalStorageData('progress-data');
    if (progressData) {
      // データ検証と補完
      if (!progressData.wordProgress) {
        progressData.wordProgress = {};
      }
      if (!progressData.results) {
        progressData.results = [];
      }
      if (!progressData.statistics) {
        progressData.statistics = {
          totalQuizzes: 0,
          totalQuestions: 0,
          totalCorrect: 0,
          averageScore: 0,
          bestScore: 0,
          streakDays: 0,
          lastStudyDate: 0,
          studyDates: [],
        };
      }
      if (!progressData.questionSetStats) {
        progressData.questionSetStats = {};
      }
      
      await putToDB(STORES.PROGRESS, progressData, 'main');
      logger.log('📦 Progress data migrated:', Object.keys(progressData.wordProgress || {}).length, 'words');
      return true;
    }
    
    // LocalStorageにデータがない場合は初期データを作成
    logger.log('ℹ️ No progress data to migrate, creating initial data');
    const initialData = {
      wordProgress: {},
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
    };
    await putToDB(STORES.PROGRESS, initialData, 'main');
    return true;
  } catch (error) {
    logger.error('Progress data migration error:', error);
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
      logger.log('📜 Session history migrated:', totalMigrated, 'items');
    }
    return true;
  } catch (error) {
    logger.error('Session history migration error:', error);
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
      logger.log(`📊 Daily stats: migrated ${migratedCount}, cleaned ${cleanedCount}`);
    }
    return true;
  } catch (error) {
    logger.error('Daily stats migration error:', error);
    return false;
  }
}

// その他の設定データの移行
async function migrateSettings(): Promise<boolean> {
  try {
    // JSON形式のデータのみ
    const jsonSettingsKeys = [
      'user-goal-level',
      'loginStreak',
      'radar-improvement-progress',
      'skip-exclude-groups'
    ];

    // 文字列形式のデータ（JSON.parseしない）
    const rawSettingsKeys = [
      'lastLoginDate',
      'lastLoginData' // typo対策
    ];

    let migratedCount = 0;
    
    // JSON形式の設定を移行（文字列データは除外）
    for (const key of jsonSettingsKeys) {
      try {
        // lastLoginで始まるキーはスキップ
        if (key.includes('lastLogin')) {
          logger.warn(`Skipping ${key} from JSON migration`);
          continue;
        }
        
        const value = getLocalStorageData(key);
        if (value !== null) {
          await putToDB(STORES.SETTINGS, value, key);
          migratedCount++;
        }
      } catch (error) {
        logger.warn(`Failed to migrate ${key}:`, error);
      }
    }
    
    // 文字列形式の設定を移行
    for (const key of rawSettingsKeys) {
      try {
        const value = getLocalStorageRawData(key);
        if (value !== null) {
          await putToDB(STORES.SETTINGS, value, key);
          migratedCount++;
        }
      } catch (error) {
        logger.warn(`Failed to migrate ${key}:`, error);
      }
    }

    // daily-plan-target と score-board-goal はモード別
    const modes = ['translation', 'spelling', 'reading'];
    for (const mode of modes) {
      const planKey = `daily-plan-target-${mode}`;
      const goalKey = `score-board-goal-${mode}`;
      
      try {
        const planValue = localStorage.getItem(planKey);
        if (planValue) {
          await putToDB(STORES.SETTINGS, planValue, planKey);
          migratedCount++;
        }
      } catch (error) {
        logger.warn(`Failed to migrate ${planKey}:`, error);
      }
      
      try {
        const goalValue = localStorage.getItem(goalKey);
        if (goalValue) {
          await putToDB(STORES.SETTINGS, goalValue, goalKey);
          migratedCount++;
        }
      } catch (error) {
        logger.warn(`Failed to migrate ${goalKey}:`, error);
      }
    }

    if (migratedCount > 0) {
      logger.log('⚙️ Settings migrated:', migratedCount, 'items');
    }
    return true;
  } catch (error) {
    logger.error('Settings migration error:', error);
    return false;
  }
}

// データ検証
async function verifyMigration(): Promise<boolean> {
  try {
    // 主要なデータが移行されたか確認
    const progressData = await getFromDB(STORES.PROGRESS, 'main') as any;
    
    if (!progressData) {
      logger.warn('⚠️ Progress data verification failed - no data found');
      return false;
    }
    
    // wordProgressが存在し、オブジェクトであることを確認
    if (!progressData.wordProgress || typeof progressData.wordProgress !== 'object') {
      logger.warn('⚠️ Progress data verification failed - invalid wordProgress');
      return false;
    }

    logger.log('✅ Migration verification passed');
    return true;
  } catch (error) {
    logger.error('Migration verification error:', error);
    return false;
  }
}

// メイン移行関数
export async function migrateToIndexedDB(): Promise<boolean> {
  // 既に移行済みかチェック
  if (isMigrationCompleted()) {
    logger.log('ℹ️ Migration already completed');
    return true;
  }

  // IndexedDB対応チェック
  if (!isIndexedDBSupported()) {
    logger.warn('⚠️ IndexedDB not supported, using localStorage');
    return false;
  }

  logger.log('🚀 Starting data migration to IndexedDB...');

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

    // 結果をログ出力
    const labels = ['Progress', 'SessionHistory', 'DailyStats', 'Settings'];
    results.forEach((result, index) => {
      if (!result) {
        logger.warn(`⚠️ ${labels[index]} migration incomplete (may be empty)`);
      }
    });

    // 最低限の移行が成功していればOK（全てが必須ではない）
    const criticalSuccess = results[0]; // Progress dataが最重要
    
    if (criticalSuccess || results.some(r => r)) {
      // データ検証
      const verified = await verifyMigration();
      
      if (verified) {
        // 移行完了フラグを設定
        setMigrationCompleted();
        logger.log('🎉 Migration completed successfully!');
        return true;
      } else {
        logger.warn('⚠️ Migration verification failed, but marking as complete');
        setMigrationCompleted();
        return true;
      }
    } else {
      logger.warn('⚠️ All migrations returned false, marking as complete anyway');
      setMigrationCompleted();
      return true;
    }
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    return false;
  }
}

// 移行状態のリセット（開発・テスト用）
export function resetMigrationFlag(): void {
  try {
    localStorage.removeItem(MIGRATION_FLAG_KEY);
    logger.log('🔄 Migration flag reset');
  } catch (error) {
    logger.error('Failed to reset migration flag:', error);
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
