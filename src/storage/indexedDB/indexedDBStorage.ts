// IndexedDBラッパーモジュール - ストレージの抽象化レイヤー
// ═══════════════════════════════════════════════════════════
// Phase 1 Pattern 5: 接続プーリング統合
// ═══════════════════════════════════════════════════════════

import { logger } from '@/utils/logger';
import { PerformanceMonitor } from '@/utils/performance-monitor';
import {
  initDB as initDBPool,
  executeTransaction,
  getPoolStats,
  closePool,
  STORES,
} from '@/utils/db-connection-pool';

const DB_NAME = 'QuizAppDB';
const DB_VERSION = 1;

// Store名の定義（再エクスポート）
export { STORES };

// IndexedDB対応チェック
export function isIndexedDBSupported(): boolean {
  try {
    return 'indexedDB' in window && indexedDB !== null;
  } catch {
    return false;
  }
}

// プライベートモード検出（IndexedDB制限がある場合）
export async function isPrivateMode(): Promise<boolean> {
  if (!isIndexedDBSupported()) return true;

  try {
    const testDB = indexedDB.open('test');
    return new Promise((resolve) => {
      testDB.onsuccess = () => {
        testDB.result.close();
        indexedDB.deleteDatabase('test');
        resolve(false);
      };
      testDB.onerror = () => resolve(true);
    });
  } catch {
    return true;
  }
}

// DB初期化（接続プール経由）
export function initDB(): Promise<IDBDatabase> {
  PerformanceMonitor.start('db-init-legacy');

  return initDBPool()
    .then((db) => {
      const duration = PerformanceMonitor.end('db-init-legacy');
      if (import.meta.env.DEV && duration > 20) {
        logger.log(`📦 [indexedDBStorage] DB初期化: ${duration.toFixed(2)}ms`);
      }
      return db;
    })
    .catch((error) => {
      PerformanceMonitor.end('db-init-legacy');
      logger.error('❌ IndexedDB initialization failed:', error);
      throw error;
    });
}

// 汎用的なget操作（接続プール経由）
export async function getFromDB<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
  try {
    PerformanceMonitor.start('db-get');

    const result = await executeTransaction<T | null>(
      storeName,
      'readonly',
      async (transaction) => {
        return new Promise((resolve, reject) => {
          const store = transaction.objectStore(storeName);
          const request = store.get(key);

          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => reject(request.error);
        });
      }
    );

    const duration = PerformanceMonitor.end('db-get');
    if (import.meta.env.DEV && duration > 20) {
      logger.log(`🔍 [getFromDB] ${storeName}: ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    PerformanceMonitor.end('db-get');
    logger.error('getFromDB error:', error);
    return null;
  }
}

// 汎用的なput操作（接続プール経由）
export async function putToDB<T>(storeName: string, value: T, key?: IDBValidKey): Promise<boolean> {
  try {
    PerformanceMonitor.start('db-put');

    const result = await executeTransaction<boolean>(
      storeName,
      'readwrite',
      async (transaction) => {
        return new Promise((resolve, reject) => {
          const store = transaction.objectStore(storeName);
          const request = key !== undefined ? store.put(value, key) : store.put(value);

          request.onsuccess = () => resolve(true);
          request.onerror = () => reject(request.error);
        });
      }
    );

    const duration = PerformanceMonitor.end('db-put');
    if (import.meta.env.DEV && duration > 30) {
      logger.log(`💾 [putToDB] ${storeName}: ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    PerformanceMonitor.end('db-put');
    logger.error('putToDB error:', error);
    return false;
  }
}

// 汎用的なdelete操作（接続プール経由）
export async function deleteFromDB(storeName: string, key: IDBValidKey): Promise<boolean> {
  try {
    PerformanceMonitor.start('db-delete');

    const result = await executeTransaction<boolean>(
      storeName,
      'readwrite',
      async (transaction) => {
        return new Promise((resolve, reject) => {
          const store = transaction.objectStore(storeName);
          const request = store.delete(key);

          request.onsuccess = () => resolve(true);
          request.onerror = () => reject(request.error);
        });
      }
    );

    const duration = PerformanceMonitor.end('db-delete');
    if (import.meta.env.DEV && duration > 20) {
      logger.log(`🗑️ [deleteFromDB] ${storeName}: ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    PerformanceMonitor.end('db-delete');
    logger.error('deleteFromDB error:', error);
    return false;
  }
}

// 全件取得（接続プール経由）
export async function getAllFromDB<T>(storeName: string): Promise<T[]> {
  try {
    PerformanceMonitor.start('db-get-all');

    const result = await executeTransaction<T[]>(
      storeName,
      'readonly',
      async (transaction) => {
        return new Promise((resolve, reject) => {
          const store = transaction.objectStore(storeName);
          const request = store.getAll();

          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        });
      }
    );

    const duration = PerformanceMonitor.end('db-get-all');
    if (import.meta.env.DEV && duration > 50) {
      logger.log(`📚 [getAllFromDB] ${storeName}: ${result.length}件, ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    PerformanceMonitor.end('db-get-all');
    logger.error('getAllFromDB error:', error);
    return [];
  }
}

// インデックスを使った検索（接続プール経由）
export async function queryByIndex<T>(
  storeName: string,
  indexName: string,
  query: IDBValidKey | IDBKeyRange,
  limit?: number
): Promise<T[]> {
  try {
    PerformanceMonitor.start('db-query-index');

    const result = await executeTransaction<T[]>(
      storeName,
      'readonly',
      async (transaction) => {
        return new Promise((resolve, reject) => {
          const store = transaction.objectStore(storeName);
          const index = store.index(indexName);
          const request = index.openCursor(query, 'prev'); // 降順（新しい順）
          const results: T[] = [];

          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor && (!limit || results.length < limit)) {
              results.push(cursor.value);
              cursor.continue();
            } else {
              resolve(results);
            }
          };

          request.onerror = () => reject(request.error);
        });
      }
    );

    const duration = PerformanceMonitor.end('db-query-index');
    if (import.meta.env.DEV && duration > 50) {
      logger.log(`🔎 [queryByIndex] ${storeName}.${indexName}: ${result.length}件, ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    PerformanceMonitor.end('db-query-index');
    logger.error('queryByIndex error:', error);
    return [];
  }
}

// Storeの全削除（接続プール経由）
export async function clearStore(storeName: string): Promise<boolean> {
  try {
    PerformanceMonitor.start('db-clear-store');

    const result = await executeTransaction<boolean>(
      storeName,
      'readwrite',
      async (transaction) => {
        return new Promise((resolve, reject) => {
          const store = transaction.objectStore(storeName);
          const request = store.clear();

          request.onsuccess = () => resolve(true);
          request.onerror = () => reject(request.error);
        });
      }
    );

    const duration = PerformanceMonitor.end('db-clear-store');
    logger.log(`🧽 [clearStore] ${storeName}: ${duration.toFixed(2)}ms`);

    return result;
  } catch (error) {
    PerformanceMonitor.end('db-clear-store');
    logger.error('clearStore error:', error);
    return false;
  }
}

// データ件数取得（接続プール経由）
export async function getCount(storeName: string): Promise<number> {
  try {
    PerformanceMonitor.start('db-count');

    const result = await executeTransaction<number>(
      storeName,
      'readonly',
      async (transaction) => {
        return new Promise((resolve, reject) => {
          const store = transaction.objectStore(storeName);
          const request = store.count();

          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      }
    );

    const duration = PerformanceMonitor.end('db-count');
    if (import.meta.env.DEV && duration > 20) {
      logger.log(`🔢 [getCount] ${storeName}: ${result}件, ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    PerformanceMonitor.end('db-count');
    logger.error('getCount error:', error);
    return 0;
  }
}

// DB全削除（テスト用）
export async function deleteDatabase(): Promise<boolean> {
  return new Promise(async (resolve) => {
    // 1. 接続プールを完全にクローズ
    try {
      await closePool();
      logger.log('🔒 Connection pool closed before DB deletion');
    } catch (error) {
      logger.error('⚠️ Pool close error:', error);
    }

    // 2. データベース削除
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => {
      logger.log('🗑️ Database deleted');
      resolve(true);
    };
    request.onerror = () => {
      logger.error('Database delete error');
      resolve(false);
    };
  });
}

// ═══════════════════════════════════════════════════════════
// 🏊 接続プール統計・管理
// ═══════════════════════════════════════════════════════════

/**
 * 接続プール統計情報の取得
 * 開発モードでパフォーマンス確認に使用
 */
export function getConnectionPoolStats() {
  return getPoolStats();
}

/**
 * ストレージ使用量推定（概算）
 */
export async function getStorageEstimate(): Promise<{ usage: number; quota: number }> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  }
  return { usage: 0, quota: 0 };
}
