// セッション履歴管理モジュール

import { logger } from '@/utils/logger';
import { putToDB, queryByIndex, STORES, isIndexedDBSupported } from '@/storage/indexedDB/indexedDBStorage';
import { isMigrationCompleted } from '@/storage/migration/dataMigration';
import type { SessionHistoryItem } from './types';

const SESSION_HISTORY_KEY = 'session-history';
const MAX_SESSION_HISTORY = 50;

/**
 * セッション履歴を追加（IndexedDB/LocalStorage対応）
 */
export async function addSessionHistory(item: SessionHistoryItem, mode: 'translation' | 'spelling' | 'grammar' | 'memorization'): Promise<void> {
  const useIndexedDB = isIndexedDBSupported() && isMigrationCompleted();
  
  try {
    if (useIndexedDB) {
      // IndexedDBに保存
      await putToDB(STORES.SESSION_HISTORY, {
        mode,
        status: item.status,
        word: item.word,
        timestamp: item.timestamp
      });
    } else {
      // LocalStorageにフォールバック
      const key = `${SESSION_HISTORY_KEY}-${mode}`;
      const stored = localStorage.getItem(key);
      const history: SessionHistoryItem[] = stored ? JSON.parse(stored) : [];
      
      history.push(item);
      
      // 最新50件のみ保持
      if (history.length > MAX_SESSION_HISTORY) {
        history.shift();
      }
      
      localStorage.setItem(key, JSON.stringify(history));
    }
  } catch (e) {
    logger.error('セッション履歴の保存エラー:', e);
  }
}

/**
 * セッション履歴を取得（IndexedDB/LocalStorage対応）
 */
export async function getSessionHistory(mode: 'translation' | 'spelling' | 'grammar' | 'memorization', limit: number = 20): Promise<SessionHistoryItem[]> {
  const useIndexedDB = isIndexedDBSupported() && isMigrationCompleted();
  
  try {
    if (useIndexedDB) {
      // IndexedDBから検索
      const results = await queryByIndex<Record<string, unknown>>(
        STORES.SESSION_HISTORY,
        'mode',
        mode,
        limit
      );
      
      return results.map(r => ({
        status: r.status as SessionHistoryItem['status'],
        word: r.word as string,
        timestamp: r.timestamp as number
      }));
    } else {
      // LocalStorageから読み込み
      const key = `${SESSION_HISTORY_KEY}-${mode}`;
      const stored = localStorage.getItem(key);
      const history: SessionHistoryItem[] = stored ? JSON.parse(stored) : [];
      
      // 最新limit件を返す
      return history.slice(-limit);
    }
  } catch (e) {
    logger.error('セッション履歴の取得エラー:', e);
    return [];
  }
}

/**
 * セッション履歴をクリア
 */
export function clearSessionHistory(mode: 'translation' | 'spelling' | 'grammar' | 'memorization'): void {
  try {
    const key = `${SESSION_HISTORY_KEY}-${mode}`;
    localStorage.removeItem(key);
  } catch (e) {
    logger.error('セッション履歴のクリアエラー:', e);
  }
}
