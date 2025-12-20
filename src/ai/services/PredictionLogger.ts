/**
 * Prediction Logger Service
 *
 * AIの予測と実際の結果をログに記録し、
 * キャリブレーション分析のためのデータを提供
 */

import type { Prediction } from '../metrics/calibration';

/** ログの保存キー */
const PREDICTIONS_STORAGE_KEY = 'ai_predictions_log';

/** 最大ログ保存数（メモリ管理のため） */
const MAX_PREDICTIONS = 10000;

/** ストレージインターフェース */
interface IStorage {
  getItem(key: string): Promise<unknown>;
  setItem(key: string, value: unknown): Promise<void>;
}

/**
 * 予測ログサービス
 *
 * - 予測をストレージに永続化
 * - 古いログの自動削除（MAX_PREDICTIONS超過時）
 * - キャリブレーション分析用のクエリAPI
 */
export class PredictionLogger {
  /** ログキャッシュ（メモリ効率化） */
  private cache: Prediction[] | null = null;

  /** ストレージ */
  private storage: IStorage;

  constructor(storage?: IStorage) {
    // テスト環境ではインメモリストレージを使用
    this.storage = storage || createInMemoryStorage();
  }

  /**
   * 予測をログに記録
   *
   * @param word - 単語ID
   * @param predicted - 予測された記憶保持率（0-1）
   * @param actual - 実際の結果（0=不正解、1=正解）
   */
  async logPrediction(word: string, predicted: number, actual: number): Promise<void> {
    const prediction: Prediction = {
      predicted,
      actual,
      word,
      timestamp: Date.now(),
    };

    // キャッシュをロード
    if (this.cache === null) {
      await this.loadCache();
    }

    // 新しい予測を追加
    this.cache!.push(prediction);

    // MAX_PREDICTIONS超過時は古いものを削除
    if (this.cache!.length > MAX_PREDICTIONS) {
      const deleteCount = this.cache!.length - MAX_PREDICTIONS;
      this.cache!.splice(0, deleteCount);
    }

    // 保存
    await this.saveCache();
  }

  /**
   * 最近のN件の予測を取得
   *
   * @param limit - 取得件数（デフォルト: 1000）
   * @returns 予測配列（新しい順）
   */
  async getRecentPredictions(limit: number = 1000): Promise<Prediction[]> {
    if (this.cache === null) {
      await this.loadCache();
    }

    const startIndex = Math.max(0, this.cache!.length - limit);
    return this.cache!.slice(startIndex).reverse();
  }

  /**
   * 全予測を取得
   *
   * @returns 全予測配列
   */
  async getAllPredictions(): Promise<Prediction[]> {
    if (this.cache === null) {
      await this.loadCache();
    }

    return [...this.cache!];
  }

  /**
   * 期間を指定して予測を取得
   *
   * @param startTime - 開始タイムスタンプ
   * @param endTime - 終了タイムスタンプ（デフォルト: 現在時刻）
   * @returns 期間内の予測配列
   */
  async getPredictionsByTimeRange(
    startTime: number,
    endTime: number = Date.now()
  ): Promise<Prediction[]> {
    if (this.cache === null) {
      await this.loadCache();
    }

    return this.cache!.filter(
      (p) => p.timestamp && p.timestamp >= startTime && p.timestamp <= endTime
    );
  }

  /**
   * 特定の単語の予測履歴を取得
   *
   * @param word - 単語ID
   * @returns 単語の予測履歴
   */
  async getPredictionsByWord(word: string): Promise<Prediction[]> {
    if (this.cache === null) {
      await this.loadCache();
    }

    return this.cache!.filter((p) => p.word === word);
  }

  /**
   * ログの統計情報を取得
   *
   * @returns 統計情報
   */
  async getStats(): Promise<{
    total: number;
    oldest: number | null;
    newest: number | null;
    uniqueWords: number;
  }> {
    if (this.cache === null) {
      await this.loadCache();
    }

    const timestamps = this.cache!
      .map((p) => p.timestamp)
      .filter((t): t is number => t !== undefined);

    const uniqueWords = new Set(this.cache!.map((p) => p.word)).size;

    return {
      total: this.cache!.length,
      oldest: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newest: timestamps.length > 0 ? Math.max(...timestamps) : null,
      uniqueWords,
    };
  }

  /**
   * ログをクリア
   */
  async clearLogs(): Promise<void> {
    this.cache = [];
    await this.saveCache();
  }

  /**
   * キャッシュをストレージからロード
   */
  private async loadCache(): Promise<void> {
    try {
      const data = await this.storage.getItem(PREDICTIONS_STORAGE_KEY);
      if (data && Array.isArray(data)) {
        this.cache = data;
      } else {
        this.cache = [];
      }
    } catch (error) {
      console.error('Failed to load prediction logs:', error);
      this.cache = [];
    }
  }

  /**
   * キャッシュをストレージに保存
   */
  private async saveCache(): Promise<void> {
    try {
      await this.storage.setItem(PREDICTIONS_STORAGE_KEY, this.cache!);
    } catch (error) {
      console.error('Failed to save prediction logs:', error);
    }
  }
}

/**
 * インメモリストレージ（テスト用）
 */
function createInMemoryStorage(): IStorage {
  const store = new Map<string, unknown>();

  return {
    async getItem(key: string) {
      return store.get(key);
    },
    async setItem(key: string, value: unknown) {
      store.set(key, value);
    },
  };
}

/** シングルトンインスタンス（本番環境用） */
let defaultInstance: PredictionLogger | null = null;

export function getPredictionLogger(): PredictionLogger {
  if (!defaultInstance) {
    // 本番環境ではstorageManagerを使用
    if (typeof window !== 'undefined') {
      import('@/storage/manager/storageManager').then(({ storageManager }) => {
        defaultInstance = new PredictionLogger(storageManager as unknown as IStorage);
      });
    }
    // 初期化中はインメモリストレージを使用
    defaultInstance = new PredictionLogger();
  }
  return defaultInstance;
}
