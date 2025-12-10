// IndexedDBラッパーモジュール - ストレージの抽象化レイヤー

import { logger } from '@/logger';

const DB_NAME = 'QuizAppDB';
const DB_VERSION = 1;

// Store名の定義
export const STORES = {
  PROGRESS: 'progress',
  SESSION_HISTORY: 'sessionHistory',
  DAILY_STATS: 'dailyStats',
  SETTINGS: 'settings'
} as const;

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

// DB初期化
let dbInstance: IDBDatabase | null = null;

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    if (!isIndexedDBSupported()) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      logger.error('IndexedDB open error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      logger.log('✅ IndexedDB initialized successfully');
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // progress store: メイン進捗データ
      if (!db.objectStoreNames.contains(STORES.PROGRESS)) {
        db.createObjectStore(STORES.PROGRESS);
      }

      // sessionHistory store: セッション履歴
      if (!db.objectStoreNames.contains(STORES.SESSION_HISTORY)) {
        const historyStore = db.createObjectStore(STORES.SESSION_HISTORY, {
          keyPath: 'id',
          autoIncrement: true
        });
        historyStore.createIndex('mode', 'mode', { unique: false });
        historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        historyStore.createIndex('modeTimestamp', ['mode', 'timestamp'], { unique: false });
      }

      // dailyStats store: 日別統計
      if (!db.objectStoreNames.contains(STORES.DAILY_STATS)) {
        const statsStore = db.createObjectStore(STORES.DAILY_STATS, { keyPath: 'date' });
        statsStore.createIndex('date', 'date', { unique: true });
      }

      // settings store: 設定・フラグ
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS);
      }

      logger.log('📦 IndexedDB stores created');
    };
  });
}

// 汎用的なget操作
export async function getFromDB<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    logger.error('getFromDB error:', error);
    return null;
  }
}

// 汎用的なput操作
export async function putToDB<T>(storeName: string, value: T, key?: IDBValidKey): Promise<boolean> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = key !== undefined ? store.put(value, key) : store.put(value);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    logger.error('putToDB error:', error);
    return false;
  }
}

// 汎用的なdelete操作
export async function deleteFromDB(storeName: string, key: IDBValidKey): Promise<boolean> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    logger.error('deleteFromDB error:', error);
    return false;
  }
}

// 全件取得
export async function getAllFromDB<T>(storeName: string): Promise<T[]> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    logger.error('getAllFromDB error:', error);
    return [];
  }
}

// インデックスを使った検索
export async function queryByIndex<T>(
  storeName: string,
  indexName: string,
  query: IDBValidKey | IDBKeyRange,
  limit?: number
): Promise<T[]> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
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
  } catch (error) {
    logger.error('queryByIndex error:', error);
    return [];
  }
}

// Storeの全削除
export async function clearStore(storeName: string): Promise<boolean> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    logger.error('clearStore error:', error);
    return false;
  }
}

// ストレージ使用量推定（概算）
export async function getStorageEstimate(): Promise<{ usage: number; quota: number }> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    } catch (error) {
      logger.error('Storage estimate error:', error);
    }
  }
  return { usage: 0, quota: 0 };
}

// データ件数取得
export async function getCount(storeName: string): Promise<number> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    logger.error('getCount error:', error);
    return 0;
  }
}

// DB全削除（テスト用）
export async function deleteDatabase(): Promise<boolean> {
  return new Promise((resolve) => {
    if (dbInstance) {
      dbInstance.close();
      dbInstance = null;
    }
    
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
