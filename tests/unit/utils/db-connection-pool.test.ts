/**
 * db-connection-pool.ts のユニットテスト
 * Phase 1 Pattern 5: IndexedDB接続プーリング
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  initDB,
  executeTransaction,
  getPoolStats,
  closePool,
} from '@/utils/db-connection-pool';

// IndexedDB モック
const mockDB = {
  transaction: vi.fn(),
  close: vi.fn(),
  objectStoreNames: {
    contains: vi.fn(() => false),
  },
};

const mockOpenRequest = {
  result: mockDB,
  onsuccess: null as ((event: Event) => void) | null,
  onerror: null as ((event: Event) => void) | null,
  onupgradeneeded: null as ((event: IDBVersionChangeEvent) => void) | null,
};

// グローバル indexedDB をモック
global.indexedDB = {
  open: vi.fn(() => mockOpenRequest as unknown as IDBOpenDBRequest),
  deleteDatabase: vi.fn(),
} as unknown as IDBFactory;

describe('DBConnectionPool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOpenRequest.onsuccess = null;
    mockOpenRequest.onerror = null;
    mockOpenRequest.onupgradeneeded = null;
  });

  afterEach(async () => {
    await closePool();
  });

  describe('initDB - 接続プール初期化', () => {
    it('初回呼び出しで新規接続を作成する', async () => {
      const initPromise = initDB();

      // onsuccess コールバックをシミュレート
      if (mockOpenRequest.onsuccess) {
        mockOpenRequest.onsuccess(new Event('success'));
      }

      const db = await initPromise;

      expect(global.indexedDB.open).toHaveBeenCalledWith('QuizAppDB', 1);
      expect(db).toBe(mockDB);
    });

    it('2回目以降はプールから既存接続を再利用する', async () => {
      // 1回目
      const init1Promise = initDB();
      if (mockOpenRequest.onsuccess) {
        mockOpenRequest.onsuccess(new Event('success'));
      }
      await init1Promise;

      vi.clearAllMocks();

      // 2回目
      const db2 = await initDB();

      // open は呼ばれない（プールから再利用）
      expect(global.indexedDB.open).not.toHaveBeenCalled();
      expect(db2).toBe(mockDB);
    });
  });

  describe('executeTransaction - トランザクション実行', () => {
    it('トランザクションを実行して接続を自動解放する', async () => {
      const mockTransaction = {
        objectStore: vi.fn(() => ({
          get: vi.fn(() => ({
            onsuccess: null as ((event: Event) => void) | null,
            onerror: null as ((event: Event) => void) | null,
            result: { value: 'test' },
          })),
        })),
      };

      mockDB.transaction.mockReturnValue(mockTransaction);

      const initPromise = initDB();
      if (mockOpenRequest.onsuccess) {
        mockOpenRequest.onsuccess(new Event('success'));
      }
      await initPromise;

      const result = await executeTransaction<string>(
        'testStore',
        'readonly',
        async (transaction) => {
          const store = transaction.objectStore('testStore');
          const request = store.get('key');
          return new Promise((resolve) => {
            if (request.onsuccess) {
              request.onsuccess(new Event('success'));
            }
            resolve('success');
          });
        }
      );

      expect(result).toBe('success');
      expect(mockDB.transaction).toHaveBeenCalledWith('testStore', 'readonly');
    });

    it('エラー時も接続を解放する', async () => {
      const initPromise = initDB();
      if (mockOpenRequest.onsuccess) {
        mockOpenRequest.onsuccess(new Event('success'));
      }
      await initPromise;

      mockDB.transaction.mockImplementation(() => {
        throw new Error('Transaction error');
      });

      await expect(
        executeTransaction('testStore', 'readonly', async () => {
          return 'test';
        })
      ).rejects.toThrow('Transaction error');

      // 接続は解放されているべき
      const stats = getPoolStats();
      expect(stats.inUseConnections).toBe(0);
    });
  });

  describe('getPoolStats - プール統計', () => {
    it('接続プールの統計情報を取得できる', async () => {
      const initPromise = initDB();
      if (mockOpenRequest.onsuccess) {
        mockOpenRequest.onsuccess(new Event('success'));
      }
      await initPromise;

      const stats = getPoolStats();

      expect(stats).toHaveProperty('totalConnections');
      expect(stats).toHaveProperty('inUseConnections');
      expect(stats).toHaveProperty('availableConnections');
      expect(stats).toHaveProperty('maxConnections');
      expect(stats.maxConnections).toBe(5);
    });

    it('使用中の接続数を正しく報告する', async () => {
      const initPromise = initDB();
      if (mockOpenRequest.onsuccess) {
        mockOpenRequest.onsuccess(new Event('success'));
      }
      await initPromise;

      // トランザクション実行中
      const txPromise = executeTransaction('test', 'readonly', async () => {
        const stats = getPoolStats();
        expect(stats.inUseConnections).toBeGreaterThan(0);
        return 'done';
      });

      await txPromise;

      // トランザクション完了後
      const statsAfter = getPoolStats();
      expect(statsAfter.inUseConnections).toBe(0);
    });
  });

  describe('パフォーマンステスト', () => {
    it('接続プールにより2回目以降の接続が高速化される', async () => {
      // 1回目: 新規接続（遅い）
      const start1 = performance.now();
      const init1Promise = initDB();
      if (mockOpenRequest.onsuccess) {
        mockOpenRequest.onsuccess(new Event('success'));
      }
      await init1Promise;
      const duration1 = performance.now() - start1;

      // 2回目: プールから再利用（速い）
      const start2 = performance.now();
      await initDB();
      const duration2 = performance.now() - start2;

      expect(duration2).toBeLessThan(duration1);
      expect(duration2).toBeLessThan(10); // 10ms以内
    });

    it('並列トランザクション実行が可能', async () => {
      const initPromise = initDB();
      if (mockOpenRequest.onsuccess) {
        mockOpenRequest.onsuccess(new Event('success'));
      }
      await initPromise;

      mockDB.transaction.mockReturnValue({
        objectStore: vi.fn(() => ({})),
      });

      const start = performance.now();

      // 10個の並列トランザクション
      const promises = Array.from({ length: 10 }, (_, i) =>
        executeTransaction(`store${i}`, 'readonly', async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return `result${i}`;
        })
      );

      const results = await Promise.all(promises);
      const duration = performance.now() - start;

      expect(results).toHaveLength(10);
      expect(duration).toBeLessThan(100); // 並列実行により100ms以内
    });
  });

  describe('closePool - プールクローズ', () => {
    it('全ての接続をクローズする', async () => {
      const initPromise = initDB();
      if (mockOpenRequest.onsuccess) {
        mockOpenRequest.onsuccess(new Event('success'));
      }
      await initPromise;

      await closePool();

      expect(mockDB.close).toHaveBeenCalled();

      const stats = getPoolStats();
      expect(stats.totalConnections).toBe(0);
    });
  });
});
