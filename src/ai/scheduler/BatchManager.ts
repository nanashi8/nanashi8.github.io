/**
 * BatchManager - 動的バッチ管理システム
 *
 * 機能:
 * - 100語ずつバッチで学習
 * - 70%クリアで次バッチを自動追加
 * - バッチサイズ・クリア閾値の設定可能
 *
 * 使用例:
 * ```typescript
 * const manager = new BatchManager();
 * manager.initialize(allWords, { batchSize: 100, clearThreshold: 0.7 });
 * const active = manager.getActiveWords();
 * manager.checkAndAddNextBatch(progress);
 * ```
 */

import type { Question } from '@/types';
import type { WordProgress } from '@/storage/progress/types';
import type { CategoryStats } from './types';
import { PositionCalculator } from './PositionCalculator';
import { CategoryClassifier } from './CategoryClassifier';
import { logger } from '@/utils/logger';

export interface BatchConfig {
  /** 1バッチのサイズ（デフォルト: 100） */
  batchSize: number;
  /**
   * クリア閾値（0-1）
   * - 0: 設定なし（常に次バッチ追加可能）
   * - 0.1: 10%クリアで次バッチ
   * - 0.2: 20%クリアで次バッチ
   * - ...
   * - 1.0: 100%クリアで次バッチ
   * デフォルト: 0.7 (70%)
   */
  clearThreshold: number;
  /** 現在のバッチ番号（1から開始） */
  currentBatch: number;
  /** アクティブな単語リスト */
  activeWords: string[];
  /** 全単語リスト */
  allWords: string[];
  /** モード（memorization, translation, spelling, grammar） */
  mode: 'memorization' | 'translation' | 'spelling' | 'grammar';
}

export interface BatchStatus {
  /** 現在のバッチ番号 */
  currentBatch: number;
  /** アクティブな単語数 */
  activeCount: number;
  /** クリア済み単語数（Position < 20） */
  clearedCount: number;
  /** クリア率（0-1） */
  clearRate: number;
  /** 次バッチ追加可能か */
  canAddNextBatch: boolean;
  /** 全バッチクリア済みか */
  allBatchesCleared: boolean;
  /** カテゴリー別統計（オプション） */
  categoryStats?: Pick<CategoryStats, 'counts'>;
}

const STORAGE_KEY_PREFIX = 'batch-config';

export class BatchManager {
  private config: BatchConfig | null = null;
  private classifier: CategoryClassifier;

  constructor() {
    this.classifier = new CategoryClassifier();
  }

  private static isVerboseDebug(): boolean {
    return import.meta.env.DEV && localStorage.getItem('debug-batch-mode') === 'true';
  }

  /**
   * バッチシステムを初期化
   *
   * @param allWords 全単語リスト
   * @param options オプション設定
   */
  initialize(
    allWords: Question[],
    options: {
      batchSize?: number;
      clearThreshold?: number;
      mode?: 'memorization' | 'translation' | 'spelling' | 'grammar';
      reset?: boolean;
    } = {}
  ): void {
    const mode = options.mode || 'memorization';
    const storageKey = `${STORAGE_KEY_PREFIX}-${mode}`;

    // 既存の設定をロード（reset=trueの場合は無視）
    if (!options.reset) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          this.config = JSON.parse(stored);
          if (BatchManager.isVerboseDebug()) {
            logger.info('[BatchManager] 既存の設定をロード', this.config);
          }
          return;
        } catch (error) {
          logger.warn('[BatchManager] 設定の読み込みに失敗、新規作成します', error);
        }
      }
    }

    // 新規作成
    const batchSize = options.batchSize || 100;
    // クリア閾値: 0 = 設定なし, 0.1-1.0 = 10%-100%刻み
    const clearThreshold = options.clearThreshold !== undefined ? options.clearThreshold : 0.7;
    const allWordsList = allWords.map((q) => q.word);

    // 初回バッチ（1-100語）をアクティブ化
    const activeWords = allWordsList.slice(0, batchSize);

    this.config = {
      batchSize,
      clearThreshold,
      currentBatch: 1,
      activeWords,
      allWords: allWordsList,
      mode,
    };

    this.saveConfig();

    if (BatchManager.isVerboseDebug()) {
      logger.info('[BatchManager] 初期化完了', {
        batchSize,
        clearThreshold: `${(clearThreshold * 100).toFixed(0)}%`,
        currentBatch: 1,
        activeCount: activeWords.length,
        totalWords: allWordsList.length,
      });
    }
  }

  /**
   * アクティブな単語リストを取得
   */
  getActiveWords(): string[] {
    if (!this.config) {
      logger.warn('[BatchManager] 初期化されていません');
      return [];
    }
    return this.config.activeWords;
  }

  /**
   * バッチステータスを取得
   */
  getStatus(progressData: Record<string, WordProgress>): BatchStatus {
    if (!this.config) {
      return {
        currentBatch: 0,
        activeCount: 0,
        clearedCount: 0,
        clearRate: 0,
        canAddNextBatch: false,
        allBatchesCleared: false,
      };
    }

    const calculator = new PositionCalculator(this.config.mode);

    // アクティブ単語のうち、クリア済み（Position < 20）をカウント
    const clearedCount = this.config.activeWords.filter((word) => {
      const progress = progressData[word];
      if (!progress) return false;
      const position = calculator.calculate(progress);
      return position < 20; // mastered
    }).length;

    const clearRate = this.config.activeWords.length > 0
      ? clearedCount / this.config.activeWords.length
      : 0;

    // クリア閾値が0の場合は常に追加可能（設定なし）
    const canAddNextBatch = this.config.clearThreshold === 0
      ? this.config.currentBatch * this.config.batchSize < this.config.allWords.length
      : clearRate >= this.config.clearThreshold &&
        this.config.currentBatch * this.config.batchSize < this.config.allWords.length;

    // 全バッチクリア判定（閾値0の場合は全バッチ追加完了＋全語クリア）
    const allBatchesCleared = this.config.clearThreshold === 0
      ? this.config.currentBatch * this.config.batchSize >= this.config.allWords.length &&
        this.config.activeWords.length === 0
      : this.config.currentBatch * this.config.batchSize >= this.config.allWords.length &&
        clearRate >= this.config.clearThreshold;

    // カテゴリー別統計を計算（カテゴリースロットシステム用）
    const categoryStats = this.classifier.getCategoryStats(
      this.config.activeWords,
      progressData,
      this.config.mode
    );

    return {
      currentBatch: this.config.currentBatch,
      activeCount: this.config.activeWords.length,
      clearedCount,
      clearRate,
      canAddNextBatch,
      allBatchesCleared,
      categoryStats,
    };
  }

  /**
   * クリア状況を確認し、次バッチを追加
   *
   * @param progressData 進捗データ
   * @returns 次バッチが追加されたかどうか
   */
  checkAndAddNextBatch(progressData: Record<string, WordProgress>): boolean {
    if (!this.config) {
      logger.warn('[BatchManager] 初期化されていません');
      return false;
    }

    const status = this.getStatus(progressData);

    if (BatchManager.isVerboseDebug()) {
      logger.info('[BatchManager] クリア状況チェック', {
        currentBatch: status.currentBatch,
        activeCount: status.activeCount,
        clearedCount: status.clearedCount,
        clearRate: `${(status.clearRate * 100).toFixed(1)}%`,
        threshold: `${(this.config.clearThreshold * 100).toFixed(0)}%`,
        canAddNextBatch: status.canAddNextBatch,
      });
    }

    if (!status.canAddNextBatch) {
      return false;
    }

    // 次バッチを追加
    const nextBatchStart = this.config.currentBatch * this.config.batchSize;
    const nextBatchEnd = nextBatchStart + this.config.batchSize;
    const nextBatchWords = this.config.allWords.slice(nextBatchStart, nextBatchEnd);

    if (nextBatchWords.length === 0) {
      if (BatchManager.isVerboseDebug()) {
        logger.info('[BatchManager] 全バッチクリア済み');
      }
      return false;
    }

    // 未クリア語 + 新バッチ
    const calculator = new PositionCalculator(this.config.mode);
    const unclearedWords = this.config.activeWords.filter((word) => {
      const progress = progressData[word];
      if (!progress) return true; // 進捗なし = 未クリア
      const position = calculator.calculate(progress);
      return position >= 20; // not mastered
    });

    this.config.activeWords = [...unclearedWords, ...nextBatchWords];
    this.config.currentBatch += 1;
    this.saveConfig();

    if (BatchManager.isVerboseDebug()) {
      logger.info('[BatchManager] 次バッチ追加', {
        newBatch: this.config.currentBatch,
        added: nextBatchWords.length,
        uncleared: unclearedWords.length,
        newActiveCount: this.config.activeWords.length,
      });
    }

    return true;
  }

  /**
   * 設定をリセット
   */
  reset(): void {
    if (!this.config) return;
    const storageKey = `${STORAGE_KEY_PREFIX}-${this.config.mode}`;
    localStorage.removeItem(storageKey);
    this.config = null;
    if (BatchManager.isVerboseDebug()) {
      logger.info('[BatchManager] リセット完了');
    }
  }

  /**
   * 設定を保存
   */
  private saveConfig(): void {
    if (!this.config) return;
    const storageKey = `${STORAGE_KEY_PREFIX}-${this.config.mode}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(this.config));
    } catch (error) {
      logger.error('[BatchManager] 設定の保存に失敗', error);
    }
  }

  /**
   * バッチモードが有効かどうか
   */
  static isEnabled(): boolean {
    return localStorage.getItem('batch-mode-enabled') === 'true';
  }

  /**
   * バッチモードを有効化
   */
  static enable(): void {
    localStorage.setItem('batch-mode-enabled', 'true');
  }

  /**
   * バッチモードを無効化
   */
  static disable(): void {
    localStorage.removeItem('batch-mode-enabled');
  }
}
