/**
 * Word Metadata Cache
 *
 * 語句のメタ情報を一度抽出したらキャッシュし、再計算を避ける
 *
 * パフォーマンス最適化とビルド時の事前計算サポート
 */

import { extractWordMetadata, type WordMetadata } from './wordMetadata';
import type { Question } from '../../types';

/**
 * メタデータキャッシュのエントリ
 */
interface MetadataCacheEntry {
  /** 語句 */
  word: string;
  /** 抽出されたメタ情報 */
  metadata: WordMetadata;
  /** 抽出時刻（キャッシュ無効化判定用） */
  timestamp: number;
}

/**
 * メタデータキャッシュの実装
 */
class WordMetadataCache {
  /** キャッシュストレージ */
  private cache: Map<string, MetadataCacheEntry> = new Map();

  /** キャッシュの有効期限（ミリ秒）デフォルト: 24時間 */
  private ttl: number = 24 * 60 * 60 * 1000;

  /**
   * 語句のメタ情報を取得（キャッシュ優先）
   *
   * @param word - 対象の語句
   * @param meaning - 意味テキスト（品詞推定に利用）
   * @returns 抽出されたメタ情報
   */
  getMetadata(word: string, meaning?: string): WordMetadata {
    const key = this.getCacheKey(word, meaning);
    const cached = this.cache.get(key);

    // キャッシュヒット & 有効期限内
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.metadata;
    }

    // キャッシュミス or 期限切れ → 再計算
    const metadata = extractWordMetadata(word, meaning);
    this.cache.set(key, {
      word,
      metadata,
      timestamp: Date.now(),
    });

    return metadata;
  }

  /**
   * Questionオブジェクトからメタ情報を取得
   *
   * @param question - 問題オブジェクト
   * @returns 抽出されたメタ情報
   */
  getMetadataFromQuestion(question: Question): WordMetadata {
    return this.getMetadata(question.word, question.meaning);
  }

  /**
   * 複数の語句のメタ情報を一括取得
   *
   * @param words - 対象の語句リスト
   * @returns 語句とメタ情報のマップ
   */
  getBulkMetadata(words: string[]): Map<string, WordMetadata> {
    const result = new Map<string, WordMetadata>();
    words.forEach((word) => {
      result.set(word, this.getMetadata(word));
    });
    return result;
  }

  /**
   * 複数のQuestionオブジェクトのメタ情報を一括取得
   *
   * @param questions - 問題オブジェクトのリスト
   * @returns 語句とメタ情報のマップ
   */
  getBulkMetadataFromQuestions(questions: Question[]): Map<string, WordMetadata> {
    const result = new Map<string, WordMetadata>();
    questions.forEach((q) => {
      result.set(q.word, this.getMetadataFromQuestion(q));
    });
    return result;
  }

  /**
   * キャッシュをクリア
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 期限切れエントリを削除
   *
   * @returns 削除されたエントリ数
   */
  purgeExpired(): number {
    const now = Date.now();
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= this.ttl) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * キャッシュの統計情報を取得
   *
   * @returns キャッシュサイズ、ヒット率などの統計
   */
  getStats(): {
    size: number;
    ttl: number;
    oldestEntryAge: number;
    newestEntryAge: number;
  } {
    const now = Date.now();
    let oldest = 0;
    let newest = Infinity;

    for (const entry of this.cache.values()) {
      const age = now - entry.timestamp;
      if (age > oldest) oldest = age;
      if (age < newest) newest = age;
    }

    return {
      size: this.cache.size,
      ttl: this.ttl,
      oldestEntryAge: oldest,
      newestEntryAge: newest === Infinity ? 0 : newest,
    };
  }

  /**
   * キャッシュキーを生成
   *
   * @param word - 語句
   * @param meaning - 意味テキスト（オプション）
   * @returns キャッシュキー
   */
  private getCacheKey(word: string, meaning?: string): string {
    // meaningが品詞推定に影響するため、キーに含める
    return meaning ? `${word}::${meaning}` : word;
  }

  /**
   * TTL（有効期限）を設定
   *
   * @param milliseconds - 有効期限（ミリ秒）
   */
  setTTL(milliseconds: number): void {
    this.ttl = milliseconds;
  }
}

/**
 * シングルトンインスタンス
 */
export const metadataCache = new WordMetadataCache();

/**
 * 便利関数：語句のメタ情報を取得（キャッシュ付き）
 *
 * @param word - 対象の語句
 * @param meaning - 意味テキスト（オプション）
 * @returns 抽出されたメタ情報
 */
export function getWordMetadata(word: string, meaning?: string): WordMetadata {
  return metadataCache.getMetadata(word, meaning);
}

/**
 * 便利関数：Questionオブジェクトからメタ情報を取得（キャッシュ付き）
 *
 * @param question - 問題オブジェクト
 * @returns 抽出されたメタ情報
 */
export function getWordMetadataFromQuestion(question: Question): WordMetadata {
  return metadataCache.getMetadataFromQuestion(question);
}
