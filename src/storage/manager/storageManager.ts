// ストレージマネージャー - IndexedDBとlocalStorageの統合管理

import {
  isIndexedDBSupported,
  getFromDB,
  putToDB,
  STORES
} from '@/storage/indexedDB/indexedDBStorage';
import { isMigrationCompleted } from '@/storage/migration/dataMigration';
import { logger } from '@/utils/logger';

// ストレージ戦略の決定
let useIndexedDB = false;

export function initStorageStrategy(): void {
  useIndexedDB = isIndexedDBSupported() && isMigrationCompleted();
  logger.log(`📦 Storage strategy: ${useIndexedDB ? 'IndexedDB' : 'localStorage'}`);
}

// 進捗データの保存（統合インターフェース）
export async function saveProgressData(data: any): Promise<boolean> {
  try {
    if (useIndexedDB) {
      // IndexedDBに保存
      return await putToDB(STORES.PROGRESS, data, 'main');
    } else {
      // LocalStorageにフォールバック
      localStorage.setItem('progress-data', JSON.stringify(data));
      return true;
    }
  } catch (error) {
    logger.error('saveProgressData error:', error);
    // IndexedDB失敗時はLocalStorageにフォールバック
    try {
      localStorage.setItem('progress-data', JSON.stringify(data));
      return true;
    } catch (fallbackError) {
      logger.error('localStorage fallback failed:', fallbackError);
      return false;
    }
  }
}

// 進捗データの読み込み（統合インターフェース）
export async function loadProgressData(): Promise<any | null> {
  try {
    if (useIndexedDB) {
      // IndexedDBから読み込み
      const data = await getFromDB(STORES.PROGRESS, 'main');
      if (data) return data;
      
      // IndexedDBにない場合はLocalStorageから読み込み（移行前のデータ）
      const fallbackData = localStorage.getItem('progress-data');
      return fallbackData ? JSON.parse(fallbackData) : null;
    } else {
      // LocalStorageから読み込み
      const data = localStorage.getItem('progress-data');
      return data ? JSON.parse(data) : null;
    }
  } catch (error) {
    logger.error('loadProgressData error:', error);
    return null;
  }
}

// 設定値の保存（統合インターフェース）
export async function saveSetting(key: string, value: any): Promise<boolean> {
  try {
    if (useIndexedDB) {
      return await putToDB(STORES.SETTINGS, value, key);
    } else {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      return true;
    }
  } catch (error) {
    logger.error(`saveSetting(${key}) error:`, error);
    // フォールバック
    try {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }
}

// 設定値の読み込み（統合インターフェース）
export async function loadSetting(key: string): Promise<any | null> {
  try {
    if (useIndexedDB) {
      const data = await getFromDB(STORES.SETTINGS, key);
      if (data !== null) return data;
      
      // IndexedDBにない場合はLocalStorageから読み込み
      const fallbackData = localStorage.getItem(key);
      return fallbackData || null;
    } else {
      const data = localStorage.getItem(key);
      return data || null;
    }
  } catch (error) {
    logger.error(`loadSetting(${key}) error:`, error);
    return null;
  }
}

// LocalStorageへの同期保存（後方互換性のため）
export function saveToLocalStorage(key: string, value: any): boolean {
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error(`saveToLocalStorage(${key}) error:`, error);
    return false;
  }
}

// LocalStorageからの読み込み（後方互換性のため）
export function loadFromLocalStorage(key: string): any | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    logger.error(`loadFromLocalStorage(${key}) error:`, error);
    return null;
  }
}

// ストレージ使用状況の取得
export function getStorageUsage(): { localStorage: number; indexedDB: boolean } {
  let localStorageSize = 0;
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          localStorageSize += key.length + value.length;
        }
      }
    }
  } catch (error) {
    logger.error('Failed to calculate localStorage size:', error);
  }

  return {
    localStorage: localStorageSize,
    indexedDB: useIndexedDB
  };
}
