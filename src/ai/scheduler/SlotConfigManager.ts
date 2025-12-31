/**
 * SlotConfigManager - スロット設定管理
 *
 * 各カテゴリーの出題枠比率を管理
 *
 * 【デフォルト設定】
 * - 新規語: 70%
 * - 分からない語: 15%
 * - まだまだ語: 10%
 * - 定着済: 5%
 *
 * 【使用例】
 * ```typescript
 * const manager = new SlotConfigManager();
 * const config = manager.getSlotConfig('memorization');
 * ```
 */

import type { BatchSlotConfig } from './types';
import { logger } from '@/utils/logger';

export interface SlotConfigManagerOptions {
  /** localStorage キー */
  storageKey?: string;

  /** デバッグモード */
  debugMode?: boolean;
}

/**
 * モード別のデフォルトスロット設定
 */
const DEFAULT_SLOT_CONFIGS: Record<string, BatchSlotConfig> = {
  memorization: {
    newRatio: 0.7, // 新規語70%
    incorrectRatio: 0.15, // 分からない15%
    stillLearningRatio: 0.1, // まだまだ10%
    masteredRatio: 0.05, // 定着済5%
    chainLearningRatio: 0.3, // いもづる式30%（各カテゴリー内）
  },
  translation: {
    newRatio: 0.6, // 翻訳は復習重視
    incorrectRatio: 0.2,
    stillLearningRatio: 0.15,
    masteredRatio: 0.05,
    chainLearningRatio: 0.3,
  },
  spelling: {
    newRatio: 0.65,
    incorrectRatio: 0.2,
    stillLearningRatio: 0.1,
    masteredRatio: 0.05,
    chainLearningRatio: 0.3,
  },
  grammar: {
    newRatio: 0.6,
    incorrectRatio: 0.2,
    stillLearningRatio: 0.15,
    masteredRatio: 0.05,
    chainLearningRatio: 0.3,
  },
};

export class SlotConfigManager {
  private storageKey: string;
  private debugMode: boolean;
  private configCache: Map<string, BatchSlotConfig>;

  constructor(options?: SlotConfigManagerOptions) {
    this.storageKey = options?.storageKey || 'slot-config';
    this.debugMode = options?.debugMode || false;
    this.configCache = new Map();
  }

  /**
   * スロット設定を取得
   *
   * 優先順位:
   * 1. localStorage のカスタム設定
   * 2. モード別デフォルト設定
   * 3. 汎用デフォルト設定
   *
   * @param mode 学習モード
   * @returns スロット設定
   */
  getSlotConfig(mode: 'memorization' | 'translation' | 'spelling' | 'grammar'): BatchSlotConfig {
    // キャッシュチェック
    if (this.configCache.has(mode)) {
      return this.configCache.get(mode)!;
    }

    let config: BatchSlotConfig;

    // 1. localStorage からカスタム設定を読み取り
    const customConfig = this.loadCustomConfig(mode);
    if (customConfig) {
      config = customConfig;
      if (this.debugMode) {
        logger.info(`[SlotConfigManager] カスタム設定を使用: ${mode}`, config);
      }
    } else {
      // 2. モード別デフォルト設定
      config = DEFAULT_SLOT_CONFIGS[mode] || DEFAULT_SLOT_CONFIGS.memorization;
      if (this.debugMode) {
        logger.info(`[SlotConfigManager] デフォルト設定を使用: ${mode}`, config);
      }
    }

    // 3. 設定の検証と正規化
    config = this.validateAndNormalize(config);

    // キャッシュに保存
    this.configCache.set(mode, config);

    return config;
  }

  /**
   * スロット設定をカスタマイズ
   *
   * @param mode 学習モード
   * @param config 新しい設定
   */
  setSlotConfig(
    mode: 'memorization' | 'translation' | 'spelling' | 'grammar',
    config: BatchSlotConfig
  ): void {
    // 検証と正規化
    const normalizedConfig = this.validateAndNormalize(config);

    // localStorage に保存
    this.saveCustomConfig(mode, normalizedConfig);

    // キャッシュを更新
    this.configCache.set(mode, normalizedConfig);

    if (this.debugMode) {
      logger.info(`[SlotConfigManager] 設定を保存: ${mode}`, normalizedConfig);
    }
  }

  /**
   * カスタム設定をリセット
   *
   * @param mode 学習モード（省略時は全モード）
   */
  resetSlotConfig(mode?: 'memorization' | 'translation' | 'spelling' | 'grammar'): void {
    if (mode) {
      // 特定モードのみリセット
      this.removeCustomConfig(mode);
      this.configCache.delete(mode);
      if (this.debugMode) {
        logger.info(`[SlotConfigManager] 設定をリセット: ${mode}`);
      }
    } else {
      // 全モードリセット
      if (typeof window !== 'undefined') {
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith(this.storageKey)) {
            localStorage.removeItem(key);
          }
        }
      }
      this.configCache.clear();
      if (this.debugMode) {
        logger.info('[SlotConfigManager] 全設定をリセット');
      }
    }
  }

  /**
   * 設定の検証と正規化
   *
   * - 比率の合計を1.0に調整
   * - 負の値を0にクランプ
   * - chainLearningRatio を0-1にクランプ
   */
  validateAndNormalize(config: BatchSlotConfig): BatchSlotConfig {
    // 負の値を0にクランプ
    const normalized = {
      newRatio: Math.max(0, config.newRatio || 0),
      incorrectRatio: Math.max(0, config.incorrectRatio || 0),
      stillLearningRatio: Math.max(0, config.stillLearningRatio || 0),
      masteredRatio: Math.max(0, config.masteredRatio || 0),
      chainLearningRatio: Math.max(0, Math.min(1, config.chainLearningRatio || 0.3)),
    };

    // 比率の合計
    const sum =
      normalized.newRatio +
      normalized.incorrectRatio +
      normalized.stillLearningRatio +
      normalized.masteredRatio;

    // 合計が0の場合はデフォルト値を使用
    if (sum === 0) {
      return DEFAULT_SLOT_CONFIGS.memorization;
    }

    // 合計が1.0でない場合は正規化
    if (Math.abs(sum - 1.0) > 0.001) {
      normalized.newRatio /= sum;
      normalized.incorrectRatio /= sum;
      normalized.stillLearningRatio /= sum;
      normalized.masteredRatio /= sum;

      if (this.debugMode) {
        logger.warn('[SlotConfigManager] 比率の合計が1.0でないため正規化しました', {
          before: sum.toFixed(3),
          after: 1.0,
        });
      }
    }

    return normalized;
  }

  /**
   * localStorage からカスタム設定を読み取り
   */
  private loadCustomConfig(
    mode: 'memorization' | 'translation' | 'spelling' | 'grammar'
  ): BatchSlotConfig | null {
    if (typeof window === 'undefined') return null;

    try {
      const key = `${this.storageKey}-${mode}`;
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const config = JSON.parse(stored) as BatchSlotConfig;
      return config;
    } catch (error) {
      logger.error('[SlotConfigManager] カスタム設定の読み取りに失敗', error);
      return null;
    }
  }

  /**
   * localStorage にカスタム設定を保存
   */
  private saveCustomConfig(
    mode: 'memorization' | 'translation' | 'spelling' | 'grammar',
    config: BatchSlotConfig
  ): void {
    if (typeof window === 'undefined') return;

    try {
      const key = `${this.storageKey}-${mode}`;
      localStorage.setItem(key, JSON.stringify(config));
    } catch (error) {
      logger.error('[SlotConfigManager] カスタム設定の保存に失敗', error);
    }
  }

  /**
   * localStorage からカスタム設定を削除
   */
  private removeCustomConfig(mode: 'memorization' | 'translation' | 'spelling' | 'grammar'): void {
    if (typeof window === 'undefined') return;

    try {
      const key = `${this.storageKey}-${mode}`;
      localStorage.removeItem(key);
    } catch (error) {
      logger.error('[SlotConfigManager] カスタム設定の削除に失敗', error);
    }
  }
}
