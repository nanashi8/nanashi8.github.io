// ストレージ使用量情報を取得

import { getStorageEstimate, getCount, STORES } from '@/storage/indexedDB/indexedDBStorage';
import { getMigrationInfo } from '@/storage/migration/dataMigration';
import { formatBytes } from './dataExport';
import { logger } from '@/logger';

export interface StorageInfo {
  localStorage: {
    used: number;
    usedFormatted: string;
    limit: number;
    limitFormatted: string;
    percentage: number;
  };
  indexedDB: {
    enabled: boolean;
    progressCount: number;
    sessionHistoryCount: number;
    dailyStatsCount: number;
    totalEstimate: number;
    totalEstimateFormatted: string;
    quota: number;
    quotaFormatted: string;
    percentage: number;
  };
  migration: {
    completed: boolean;
    version: string;
  };
}

// LocalStorageの使用量を計算
function getLocalStorageSize(): number {
  let total = 0;
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          // キー + 値のバイト数を計算
          total += (key.length + value.length) * 2; // UTF-16なので2倍
        }
      }
    }
  } catch (error) {
    logger.error('LocalStorageサイズ計算エラー:', error);
  }
  
  return total;
}

// ストレージ情報を取得
export async function getStorageInfo(): Promise<StorageInfo> {
  const migrationInfo = getMigrationInfo();
  
  // LocalStorage情報
  const localStorageUsed = getLocalStorageSize();
  const localStorageLimit = 5 * 1024 * 1024; // 一般的に5MB
  
  // IndexedDB情報
  const estimate = await getStorageEstimate();
  let progressCount = 0;
  let sessionHistoryCount = 0;
  let dailyStatsCount = 0;
  
  if (migrationInfo.completed) {
    try {
      progressCount = await getCount(STORES.PROGRESS);
      sessionHistoryCount = await getCount(STORES.SESSION_HISTORY);
      dailyStatsCount = await getCount(STORES.DAILY_STATS);
    } catch (error) {
      logger.error('IndexedDB件数取得エラー:', error);
    }
  }
  
  return {
    localStorage: {
      used: localStorageUsed,
      usedFormatted: formatBytes(localStorageUsed),
      limit: localStorageLimit,
      limitFormatted: formatBytes(localStorageLimit),
      percentage: (localStorageUsed / localStorageLimit) * 100
    },
    indexedDB: {
      enabled: migrationInfo.completed,
      progressCount,
      sessionHistoryCount,
      dailyStatsCount,
      totalEstimate: estimate.usage,
      totalEstimateFormatted: formatBytes(estimate.usage),
      quota: estimate.quota,
      quotaFormatted: formatBytes(estimate.quota),
      percentage: estimate.quota > 0 ? (estimate.usage / estimate.quota) * 100 : 0
    },
    migration: {
      completed: migrationInfo.completed,
      version: migrationInfo.version
    }
  };
}

// ストレージ状態の健全性チェック
export async function checkStorageHealth(): Promise<{
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  suggestions: string[];
}> {
  const info = await getStorageInfo();
  const suggestions: string[] = [];
  
  // LocalStorageが80%以上使用されている
  if (info.localStorage.percentage > 80) {
    suggestions.push('LocalStorageの使用量が多いため、古いデータを削除してください');
  }
  
  // IndexedDBが90%以上使用されている
  if (info.indexedDB.enabled && info.indexedDB.percentage > 90) {
    suggestions.push('IndexedDBの使用量が多いため、データのクリーンアップを推奨します');
  }
  
  // セッション履歴が1000件以上
  if (info.indexedDB.sessionHistoryCount > 1000) {
    suggestions.push('セッション履歴が多すぎます。古い履歴を削除できます');
  }
  
  // 判定
  if (info.localStorage.percentage > 90 || info.indexedDB.percentage > 95) {
    return {
      status: 'critical',
      message: 'ストレージ容量が不足しています',
      suggestions
    };
  } else if (info.localStorage.percentage > 70 || info.indexedDB.percentage > 80) {
    return {
      status: 'warning',
      message: 'ストレージ使用量が多くなっています',
      suggestions
    };
  } else {
    return {
      status: 'healthy',
      message: 'ストレージは正常です',
      suggestions: []
    };
  }
}
