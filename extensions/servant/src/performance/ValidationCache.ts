import * as vscode from 'vscode';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const readdir = promisify(fs.readdir);

export interface CachedResult {
  violations: Array<{
    line: number;
    message: string;
    severity: 'error' | 'warning';
  }>;
  timestamp: number;
  fileHash: string;
  instructionsVersion: string;
}

interface CacheEntry {
  key: string;
  value: CachedResult;
  lastAccess: number;
}

/**
 * ValidationCache
 *
 * ファイル検証結果をキャッシュして高速化する。
 * - メモリキャッシュ (LRU方式)
 * - ディスクキャッシュ (永続化)
 * - ハッシュベースの無効化
 */
export class ValidationCache {
  private memoryCache: Map<string, CacheEntry>;
  private maxMemorySize: number;
  private diskCachePath: string;
  private instructionsVersion: string = '1.0.0';
  private enabled: boolean;

  constructor(workspaceRoot: string) {
    const config = vscode.workspace.getConfiguration('servant');
    const legacyConfig = vscode.workspace.getConfiguration('instructionsValidator');

    this.enabled =
      config.get<boolean>('performance.enableCache') ??
      legacyConfig.get<boolean>('performance.enableCache', true);
    this.maxMemorySize =
      config.get<number>('performance.maxCacheSize') ??
      legacyConfig.get<number>('performance.maxCacheSize', 100);

    const cacheLocation =
      config.get<string>('performance.cacheLocation') ??
      legacyConfig.get<string>('performance.cacheLocation', '.vscode/cache');
    this.diskCachePath = path.join(workspaceRoot, cacheLocation, 'servant');

    this.memoryCache = new Map();

    // ディスクキャッシュディレクトリを作成
    this.ensureCacheDirectory();
  }

  /**
   * ファイル内容からハッシュを生成
   */
  private generateHash(content: string): string {
    return crypto.createHash('md5')
      .update(content)
      .update(this.instructionsVersion)
      .digest('hex');
  }

  /**
   * キャッシュキーを生成
   */
  private getCacheKey(filePath: string, fileHash: string): string {
    return `${filePath}:${fileHash}`;
  }

  /**
   * キャッシュから結果を取得
   *
   * @param filePath - ファイルパス
   * @param content - ファイル内容
   * @returns キャッシュされた結果、なければnull
   */
  async get(filePath: string, content: string): Promise<CachedResult | null> {
    if (!this.enabled) {
      return null;
    }

    const fileHash = this.generateHash(content);
    const cacheKey = this.getCacheKey(filePath, fileHash);

    // 1. メモリキャッシュをチェック
    const memoryEntry = this.memoryCache.get(cacheKey);
    if (memoryEntry) {
      memoryEntry.lastAccess = Date.now();
      return memoryEntry.value;
    }

    // 2. ディスクキャッシュをチェック
    try {
      const diskResult = await this.getFromDisk(cacheKey);
      if (diskResult && diskResult.fileHash === fileHash) {
        // メモリキャッシュに追加
        this.setInMemory(cacheKey, diskResult);
        return diskResult;
      }
    } catch {
      // ディスクキャッシュ読み込みエラーは無視
    }

    return null;
  }

  /**
   * 結果をキャッシュに保存
   *
   * @param filePath - ファイルパス
   * @param content - ファイル内容
   * @param violations - 検証結果
   */
  async set(
    filePath: string,
    content: string,
    violations: CachedResult['violations']
  ): Promise<void> {
    if (!this.enabled) {
      return;
    }

    const fileHash = this.generateHash(content);
    const cacheKey = this.getCacheKey(filePath, fileHash);

    const result: CachedResult = {
      violations,
      timestamp: Date.now(),
      fileHash,
      instructionsVersion: this.instructionsVersion
    };

    // メモリキャッシュに保存
    this.setInMemory(cacheKey, result);

    // ディスクキャッシュに保存
    try {
      await this.saveToDisk(cacheKey, result);
    } catch (error) {
      console.error('Failed to save to disk cache:', error);
    }
  }

  /**
   * メモリキャッシュに保存（LRU方式）
   */
  private setInMemory(key: string, value: CachedResult): void {
    // キャッシュサイズを超える場合、最も古いエントリを削除
    if (this.memoryCache.size >= this.maxMemorySize) {
      this.evictOldest();
    }

    this.memoryCache.set(key, {
      key,
      value,
      lastAccess: Date.now()
    });
  }

  /**
   * 最も古いエントリを削除（LRU）
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  /**
   * ディスクキャッシュから読み込み
   */
  private async getFromDisk(cacheKey: string): Promise<CachedResult | null> {
    const filePath = this.getDiskCachePath(cacheKey);

    try {
      const content = await readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * ディスクキャッシュに保存
   */
  private async saveToDisk(cacheKey: string, result: CachedResult): Promise<void> {
    const filePath = this.getDiskCachePath(cacheKey);
    const content = JSON.stringify(result, null, 2);
    await writeFile(filePath, content, 'utf8');
  }

  /**
   * ディスクキャッシュのファイルパスを取得
   */
  private getDiskCachePath(cacheKey: string): string {
    const hash = crypto.createHash('md5').update(cacheKey).digest('hex');
    return path.join(this.diskCachePath, `${hash}.json`);
  }

  /**
   * 特定のファイルのキャッシュを無効化
   */
  async invalidate(filePath: string): Promise<void> {
    // メモリキャッシュから削除
    const keysToDelete: string[] = [];
    for (const [key] of this.memoryCache.entries()) {
      if (key.startsWith(filePath + ':')) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.memoryCache.delete(key);
    }

    // ディスクキャッシュから削除
    try {
      const files = await readdir(this.diskCachePath);
      for (const file of files) {
        const fullPath = path.join(this.diskCachePath, file);
        await unlink(fullPath);
      }
    } catch {
      // エラーは無視
    }
  }

  /**
   * 全キャッシュをクリア
   */
  async clear(): Promise<void> {
    // メモリキャッシュクリア
    this.memoryCache.clear();

    // ディスクキャッシュクリア
    try {
      const files = await readdir(this.diskCachePath);
      for (const file of files) {
        await unlink(path.join(this.diskCachePath, file));
      }
    } catch {
      // エラーは無視
    }
  }

  /**
   * キャッシュディレクトリを確保
   */
  private async ensureCacheDirectory(): Promise<void> {
    try {
      await mkdir(this.diskCachePath, { recursive: true });
    } catch (error) {
      console.error('Failed to create cache directory:', error);
    }
  }

  /**
   * キャッシュ統計を取得
   */
  getStats(): {
    memorySize: number;
    diskSize: number;
    hitRate: number;
  } {
    return {
      memorySize: this.memoryCache.size,
      diskSize: 0, // TODO: ディスクサイズ計算
      hitRate: 0  // TODO: ヒット率計算
    };
  }

  /**
   * Instructionsバージョンを更新（全キャッシュ無効化）
   */
  async setInstructionsVersion(version: string): Promise<void> {
    if (this.instructionsVersion !== version) {
      this.instructionsVersion = version;
      await this.clear();
    }
  }

  /**
   * キャッシュが有効かどうか
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * キャッシュの有効/無効を切り替え
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.memoryCache.clear();
    }
  }
}
