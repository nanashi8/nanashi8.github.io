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

function createMockOpenRequest(): IDBOpenDBRequest {
  const request = {
    result: mockDB,
    error: null,
    onsuccess: null as ((event: Event) => void) | null,
    onerror: null as ((event: Event) => void) | null,
    onupgradeneeded: null as ((event: IDBVersionChangeEvent) => void) | null,
  } as unknown as IDBOpenDBRequest;

  // createNewConnection() がハンドラをセットした後に発火させる
  queueMicrotask(() => {
    (request as unknown as { onsuccess: ((event: Event) => void) | null }).onsuccess?.(
      new Event('success')
    );
  });

  return request;
}

// グローバル indexedDB をモック
global.indexedDB = {
  open: vi.fn(() => createMockOpenRequest()),
  deleteDatabase: vi.fn(),
} as unknown as IDBFactory;

describe('DBConnectionPool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDB.transaction.mockReset();
    mockDB.close.mockReset();
    mockDB.objectStoreNames.contains.mockReset();
    mockDB.objectStoreNames.contains.mockReturnValue(false);
  });

  afterEach(async () => {
    await closePool();
  });

  describe('initDB - 接続プール初期化', () => {
    it('初回呼び出しで新規接続を作成する', async () => {
      const db = await initDB();

      expect(global.indexedDB.open).toHaveBeenCalledWith('QuizAppDB', 1);
      expect(db).toBe(mockDB);
    });

    it('executeTransaction は接続を解放し、次回は既存接続を再利用する', async () => {
      await executeTransaction('testStore', 'readonly', async () => 'ok');
      await executeTransaction('testStore', 'readonly', async () => 'ok2');

      // 初期化で1回だけ open され、以降は同一接続を再利用
      expect(global.indexedDB.open).toHaveBeenCalledTimes(1);
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
      await executeTransaction('test', 'readonly', async () => 'done');

      const stats = getPoolStats();

      expect(stats).toHaveProperty('totalConnections');
      expect(stats).toHaveProperty('inUseConnections');
      expect(stats).toHaveProperty('availableConnections');
      expect(stats).toHaveProperty('maxConnections');
      expect(stats.maxConnections).toBe(5);
    });

    it('使用中の接続数を正しく報告する', async () => {
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
    it('接続プールにより2回目以降はopen回数が増えない', async () => {
      await executeTransaction('testStore', 'readonly', async () => 'ok');
      await executeTransaction('testStore', 'readonly', async () => 'ok2');

      expect(global.indexedDB.open).toHaveBeenCalledTimes(1);
    });

    it('並列トランザクション実行が可能', async () => {
      mockDB.transaction.mockReturnValue({
        objectStore: vi.fn(() => ({})),
      });

      // 10個の並列トランザクション
      const promises = Array.from({ length: 10 }, (_, i) =>
        executeTransaction(`store${i}`, 'readonly', async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return `result${i}`;
        })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);

      // 初期化 + 最大接続数までの新規作成に収まる
      expect(global.indexedDB.open).toHaveBeenCalledTimes(5);
    });
  });

  describe('closePool - プールクローズ', () => {
    it('全ての接続をクローズする', async () => {
      await executeTransaction('test', 'readonly', async () => 'done');

      await closePool();

      expect(mockDB.close).toHaveBeenCalled();

      const stats = getPoolStats();
      expect(stats.totalConnections).toBe(0);
    });
  });
});
