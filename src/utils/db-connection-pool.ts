// ═══════════════════════════════════════════════════════════
// 🏊 IndexedDB Connection Pool
// ═══════════════════════════════════════════════════════════
// Phase 1 Pattern 5: IndexedDB接続プーリング
//
// 目的:
//   - IndexedDB接続の再利用でopen/closeオーバーヘッドを削減
//   - トランザクション管理の効率化
//   - 同時接続数の制御
//
// 期待効果:
//   - データ保存時間: 500ms → 250ms（50%短縮）
//   - トランザクション開始時間: 50ms → 10ms（80%短縮）
//   - 接続エラーリスク: 低減
// ═══════════════════════════════════════════════════════════

import { logger } from '@/utils/logger';
import { PerformanceMonitor } from '@/utils/performance-monitor';

const DB_NAME = 'Nanashi8DB';
// 旧DB互換性（初回のみマイグレーション）
const OLD_DB_NAME = 'QuizAppDB';
const DB_VERSION = 1;

// Store名の定義
export const STORES = {
  PROGRESS: 'progress',
  SESSION_HISTORY: 'sessionHistory',
  DAILY_STATS: 'dailyStats',
  SETTINGS: 'settings',
} as const;

interface ConnectionPoolConfig {
  maxConnections: number; // 最大接続数
  connectionTimeout: number; // 接続タイムアウト（ms）
  idleTimeout: number; // アイドルタイムアウト（ms）
}

interface PooledConnection {
  db: IDBDatabase;
  lastUsed: number;
  inUse: boolean;
}

/**
 * IndexedDB接続プール
 * シングルトンパターンで実装
 */
class DBConnectionPool {
  private static instance: DBConnectionPool | null = null;

  private connections: PooledConnection[] = [];
  private pendingConnectionCreations = 0;
  private config: ConnectionPoolConfig = {
    maxConnections: 5, // 最大5接続
    connectionTimeout: 5000, // 5秒
    idleTimeout: 60000, // 60秒
  };

  private initializationPromise: Promise<void> | null = null;
  private cleanupInterval: number | null = null;

  private constructor() {
    // プライベートコンストラクタ（シングルトン）
    this.startCleanupTimer();
  }

  /**
   * シングルトンインスタンス取得
   */
  static getInstance(): DBConnectionPool {
    if (!DBConnectionPool.instance) {
      DBConnectionPool.instance = new DBConnectionPool();
    }
    return DBConnectionPool.instance;
  }

  /**
   * 接続プールの初期化
   */
  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    PerformanceMonitor.start('db-pool-init');

    try {
      // 最初の接続を作成
      this.pendingConnectionCreations++;
      const db = await this.createNewConnection().finally(() => {
        this.pendingConnectionCreations--;
      });
      this.connections.push({
        db,
        lastUsed: Date.now(),
        inUse: false,
      });

      const duration = PerformanceMonitor.end('db-pool-init');
      logger.log(`🏊 [DBConnectionPool] 初期化完了 (${duration.toFixed(2)}ms)`);
    } catch (error) {
      logger.error('❌ [DBConnectionPool] 初期化失敗:', error);
      throw error;
    }
  }

  /**
   * 新しいIndexedDB接続を作成
   */
  private createNewConnection(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      PerformanceMonitor.start('db-connection-open');

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      const timeout = setTimeout(() => {
        reject(new Error('IndexedDB open timeout'));
      }, this.config.connectionTimeout);

      request.onerror = () => {
        clearTimeout(timeout);
        PerformanceMonitor.end('db-connection-open');
        logger.error('❌ IndexedDB open error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        clearTimeout(timeout);
        const duration = PerformanceMonitor.end('db-connection-open');

        if (import.meta.env.DEV && duration > 50) {
          logger.log(`⏱️ [DBConnectionPool] 接続作成: ${duration.toFixed(2)}ms`);
        }

        resolve(request.result);
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
            autoIncrement: true,
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

        logger.log('📦 [DBConnectionPool] Stores created');
      };
    });
  }

  /**
   * プールから接続を取得
   * 利用可能な接続がない場合は新規作成
   */
  async getConnection(): Promise<IDBDatabase> {
    PerformanceMonitor.start('db-pool-get-connection');

    // 初期化は常に待機（並列呼び出し時の接続作成レースを防ぐ）
    await this.initialize();

    // 利用可能な接続を探す
    const availableConnection = this.connections.find(conn => !conn.inUse);

    if (availableConnection) {
      availableConnection.inUse = true;
      availableConnection.lastUsed = Date.now();

      const duration = PerformanceMonitor.end('db-pool-get-connection');

      if (import.meta.env.DEV && duration > 5) {
        logger.log(`🔄 [DBConnectionPool] 接続再利用 (${duration.toFixed(2)}ms)`);
      }

      return availableConnection.db;
    }

    // 接続数が上限に達していない場合は新規作成（作成中も含めて上限管理）
    if (this.connections.length + this.pendingConnectionCreations < this.config.maxConnections) {
      this.pendingConnectionCreations++;
      const db = await this.createNewConnection().finally(() => {
        this.pendingConnectionCreations--;
      });

      this.connections.push({
        db,
        lastUsed: Date.now(),
        inUse: true,
      });

      const duration = PerformanceMonitor.end('db-pool-get-connection');
      logger.log(`➕ [DBConnectionPool] 新規接続作成 (${this.connections.length}/${this.config.maxConnections}) (${duration.toFixed(2)}ms)`);

      return db;
    }

    // 上限に達している場合は待機（最古の接続が解放されるまで）
    logger.warn('⚠️ [DBConnectionPool] 接続プール満杯、待機中...');

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const available = this.connections.find(conn => !conn.inUse);
        if (available) {
          clearInterval(checkInterval);
          available.inUse = true;
          available.lastUsed = Date.now();

          const duration = PerformanceMonitor.end('db-pool-get-connection');
          logger.log(`✅ [DBConnectionPool] 待機後接続取得 (${duration.toFixed(2)}ms)`);

          resolve(available.db);
        }
      }, 10);
    });
  }

  /**
   * 接続をプールに返却
   */
  releaseConnection(db: IDBDatabase): void {
    const connection = this.connections.find(conn => conn.db === db);
    if (connection) {
      connection.inUse = false;
      connection.lastUsed = Date.now();

      if (import.meta.env.DEV) {
        const inUseCount = this.connections.filter(c => c.inUse).length;
        logger.log(`🔓 [DBConnectionPool] 接続解放 (使用中: ${inUseCount}/${this.connections.length})`);
      }
    }
  }

  /**
   * アイドル接続のクリーンアップ
   */
  private cleanupIdleConnections(): void {
    const now = Date.now();
    const idleThreshold = now - this.config.idleTimeout;

    // 使用中でなく、アイドルタイムアウトを超えた接続を削除
    const connectionsToRemove = this.connections.filter(
      conn => !conn.inUse && conn.lastUsed < idleThreshold
    );

    if (connectionsToRemove.length > 0) {
      connectionsToRemove.forEach(conn => {
        conn.db.close();
        const index = this.connections.indexOf(conn);
        if (index !== -1) {
          this.connections.splice(index, 1);
        }
      });

      logger.log(`🧹 [DBConnectionPool] アイドル接続削除: ${connectionsToRemove.length}個`);
    }
  }

  /**
   * クリーンアップタイマーを開始
   */
  private startCleanupTimer(): void {
    // 30秒ごとにクリーンアップ
    this.cleanupInterval = window.setInterval(() => {
      this.cleanupIdleConnections();
    }, 30000);
  }

  /**
   * プールを閉じる（全接続をクローズ）
   */
  async closeAll(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.connections.forEach(conn => {
      try {
        conn.db.close();
      } catch (error) {
        logger.error('❌ [DBConnectionPool] 接続クローズエラー:', error);
      }
    });

    this.connections = [];
    this.initializationPromise = null;

    logger.log('🔒 [DBConnectionPool] 全接続クローズ完了');
  }

  /**
   * プール統計情報取得
   */
  getStats() {
    return {
      totalConnections: this.connections.length,
      inUseConnections: this.connections.filter(c => c.inUse).length,
      availableConnections: this.connections.filter(c => !c.inUse).length,
      maxConnections: this.config.maxConnections,
      oldestConnectionAge: this.connections.length > 0
        ? Math.min(...this.connections.map(c => Date.now() - c.lastUsed))
        : 0,
    };
  }
}

// ═══════════════════════════════════════════════════════════
// 🔌 Helper Functions（既存APIとの互換性維持）
// ═══════════════════════════════════════════════════════════

const pool = DBConnectionPool.getInstance();

/**
 * IndexedDB初期化（プール経由）
 */
export async function initDB(): Promise<IDBDatabase> {
  await pool.initialize();
  return pool.getConnection();
}

/**
 * トランザクション実行ヘルパー
 * 自動的に接続の取得と解放を行う
 */
export async function executeTransaction<T>(
  storeNames: string | string[],
  mode: IDBTransactionMode,
  callback: (transaction: IDBTransaction) => Promise<T>
): Promise<T> {
  PerformanceMonitor.start('db-transaction');

  const db = await pool.getConnection();

  try {
    const transaction = db.transaction(storeNames, mode);
    const result = await callback(transaction);

    const duration = PerformanceMonitor.end('db-transaction');

    if (import.meta.env.DEV && duration > 50) {
      logger.log(`💾 [DBConnectionPool] トランザクション完了: ${duration.toFixed(2)}ms`);
    }

    return result;
  } finally {
    pool.releaseConnection(db);
  }
}

/**
 * プール統計情報の取得
 */
export function getPoolStats() {
  return pool.getStats();
}

/**
 * プールのクローズ（テスト用）
 */
export async function closePool(): Promise<void> {
  return pool.closeAll();
}
