import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  addSessionHistory,
  getSessionHistory,
  clearSessionHistory,
} from '@/storage/progress/sessionHistory';
import type { SessionHistoryItem } from '@/storage/progress/types';

// IndexedDBモックをグローバルに設定
vi.mock('@/storage/indexedDB/indexedDBStorage', () => ({
  isIndexedDBSupported: () => false, // LocalStorageモードでテスト
  putToDB: vi.fn(),
  queryByIndex: vi.fn(),
  STORES: {
    SESSION_HISTORY: 'session-history',
  },
}));

vi.mock('@/storage/migration/dataMigration', () => ({
  isMigrationCompleted: () => false, // LocalStorageモードでテスト
}));

describe('sessionHistory', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('addSessionHistory', () => {
    it('セッション履歴を追加する', async () => {
      const item: SessionHistoryItem = {
        status: 'correct',
        word: 'apple',
        timestamp: Date.now(),
      };

      await addSessionHistory(item, 'translation');

      const stored = localStorage.getItem('session-history-translation');
      expect(stored).toBeTruthy();

      const history: SessionHistoryItem[] = JSON.parse(stored!);
      expect(history).toHaveLength(1);
      expect(history[0].word).toBe('apple');
      expect(history[0].status).toBe('correct');
    });

    it('複数のアイテムを順番に追加する', async () => {
      const item1: SessionHistoryItem = {
        status: 'correct',
        word: 'apple',
        timestamp: Date.now(),
      };

      const item2: SessionHistoryItem = {
        status: 'incorrect',
        word: 'banana',
        timestamp: Date.now(),
      };

      await addSessionHistory(item1, 'translation');
      await addSessionHistory(item2, 'translation');

      const stored = localStorage.getItem('session-history-translation');
      const history: SessionHistoryItem[] = JSON.parse(stored!);

      expect(history).toHaveLength(2);
      expect(history[0].word).toBe('apple');
      expect(history[1].word).toBe('banana');
    });

    it('モード別に履歴を保存する', async () => {
      const translationItem: SessionHistoryItem = {
        status: 'correct',
        word: 'apple',
        timestamp: Date.now(),
      };

      const spellingItem: SessionHistoryItem = {
        status: 'incorrect',
        word: 'banana',
        timestamp: Date.now(),
      };

      await addSessionHistory(translationItem, 'translation');
      await addSessionHistory(spellingItem, 'spelling');

      const translationHistory = localStorage.getItem('session-history-translation');
      const spellingHistory = localStorage.getItem('session-history-spelling');

      expect(translationHistory).toBeTruthy();
      expect(spellingHistory).toBeTruthy();

      const translationData: SessionHistoryItem[] = JSON.parse(translationHistory!);
      const spellingData: SessionHistoryItem[] = JSON.parse(spellingHistory!);

      expect(translationData).toHaveLength(1);
      expect(translationData[0].word).toBe('apple');

      expect(spellingData).toHaveLength(1);
      expect(spellingData[0].word).toBe('banana');
    });

    it('50件を超えると古いデータを削除する', async () => {
      // 51件追加
      for (let i = 0; i < 51; i++) {
        const item: SessionHistoryItem = {
          status: 'correct',
          word: `word${i}`,
          timestamp: Date.now() + i,
        };
        await addSessionHistory(item, 'translation');
      }

      const stored = localStorage.getItem('session-history-translation');
      const history: SessionHistoryItem[] = JSON.parse(stored!);

      // 最大50件のみ保持
      expect(history).toHaveLength(50);
      // 最も古いword0は削除され、word1から始まる
      expect(history[0].word).toBe('word1');
      expect(history[49].word).toBe('word50');
    });

    it('異なるステータスを保存できる', async () => {
      const items: SessionHistoryItem[] = [
        { status: 'correct', word: 'correct1', timestamp: Date.now() },
        { status: 'incorrect', word: 'incorrect1', timestamp: Date.now() },
        { status: 'review', word: 'review1', timestamp: Date.now() },
      ];

      for (const item of items) {
        await addSessionHistory(item, 'translation');
      }

      const stored = localStorage.getItem('session-history-translation');
      const history: SessionHistoryItem[] = JSON.parse(stored!);

      expect(history).toHaveLength(3);
      expect(history[0].status).toBe('correct');
      expect(history[1].status).toBe('incorrect');
      expect(history[2].status).toBe('skipped');
    });
  });

  describe('getSessionHistory', () => {
    it('セッション履歴を取得する', async () => {
      const items: SessionHistoryItem[] = [
        { status: 'correct', word: 'apple', timestamp: Date.now() },
        { status: 'incorrect', word: 'banana', timestamp: Date.now() },
        { status: 'correct', word: 'cherry', timestamp: Date.now() },
      ];

      for (const item of items) {
        await addSessionHistory(item, 'translation');
      }

      const history = await getSessionHistory('translation');

      expect(history).toHaveLength(3);
      expect(history[0].word).toBe('apple');
      expect(history[1].word).toBe('banana');
      expect(history[2].word).toBe('cherry');
    });

    it('limit パラメータで件数を制限する', async () => {
      // 10件追加
      for (let i = 0; i < 10; i++) {
        const item: SessionHistoryItem = {
          status: 'correct',
          word: `word${i}`,
          timestamp: Date.now() + i,
        };
        await addSessionHistory(item, 'translation');
      }

      const history = await getSessionHistory('translation', 5);

      // 最新5件を取得
      expect(history).toHaveLength(5);
      expect(history[0].word).toBe('word5'); // 最新5件なのでword5から
      expect(history[4].word).toBe('word9');
    });

    it('モード別に履歴を取得する', async () => {
      await addSessionHistory(
        { status: 'correct', word: 'translation1', timestamp: Date.now() },
        'translation'
      );
      await addSessionHistory(
        { status: 'correct', word: 'spelling1', timestamp: Date.now() },
        'spelling'
      );

      const translationHistory = await getSessionHistory('translation');
      const spellingHistory = await getSessionHistory('spelling');

      expect(translationHistory).toHaveLength(1);
      expect(translationHistory[0].word).toBe('translation1');

      expect(spellingHistory).toHaveLength(1);
      expect(spellingHistory[0].word).toBe('spelling1');
    });

    it('履歴がない場合は空配列を返す', async () => {
      const history = await getSessionHistory('translation');

      expect(history).toEqual([]);
    });

    it('デフォルトlimit=20で取得する', async () => {
      // 30件追加
      for (let i = 0; i < 30; i++) {
        const item: SessionHistoryItem = {
          status: 'correct',
          word: `word${i}`,
          timestamp: Date.now() + i,
        };
        await addSessionHistory(item, 'translation');
      }

      const history = await getSessionHistory('translation'); // limit指定なし

      // デフォルト20件を取得
      expect(history).toHaveLength(20);
      expect(history[0].word).toBe('word10'); // 最新20件なのでword10から
      expect(history[19].word).toBe('word29');
    });
  });

  describe('clearSessionHistory', () => {
    it('セッション履歴をクリアする', async () => {
      const items: SessionHistoryItem[] = [
        { status: 'correct', word: 'apple', timestamp: Date.now() },
        { status: 'incorrect', word: 'banana', timestamp: Date.now() },
      ];

      for (const item of items) {
        await addSessionHistory(item, 'translation');
      }

      // クリア前は存在する
      let stored = localStorage.getItem('session-history-translation');
      expect(stored).toBeTruthy();

      clearSessionHistory('translation');

      // クリア後は削除されている
      stored = localStorage.getItem('session-history-translation');
      expect(stored).toBeNull();
    });

    it('モード別にクリアする', async () => {
      await addSessionHistory(
        { status: 'correct', word: 'translation1', timestamp: Date.now() },
        'translation'
      );
      await addSessionHistory(
        { status: 'correct', word: 'spelling1', timestamp: Date.now() },
        'spelling'
      );

      clearSessionHistory('translation');

      // translationはクリアされている
      const translationStored = localStorage.getItem('session-history-translation');
      expect(translationStored).toBeNull();

      // spellingは残っている
      const spellingStored = localStorage.getItem('session-history-spelling');
      expect(spellingStored).toBeTruthy();

      const spellingHistory: SessionHistoryItem[] = JSON.parse(spellingStored!);
      expect(spellingHistory).toHaveLength(1);
      expect(spellingHistory[0].word).toBe('spelling1');
    });

    it('履歴がない場合でもエラーにならない', () => {
      expect(() => clearSessionHistory('translation')).not.toThrow();
    });
  });
});
