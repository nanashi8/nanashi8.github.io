/**
 * CategoryClassifier - カテゴリー分類器
 *
 * 回答結果に基づいて単語を学習カテゴリーに分類
 *
 * 【分類基準】
 * - new: 未挑戦（attempts = 0）
 * - incorrect: 正答率50%未満
 * - still_learning: 正答率50-80%、または連続正解1-2回
 * - mastered: 連続3回以上正解、または正答率80%以上
 *
 * 【使用例】
 * ```typescript
 * const classifier = new CategoryClassifier();
 * const category = classifier.determineCategory(wordProgress, 'memorization');
 * ```
 */

import type { WordProgress } from '@/storage/progress/types';
import type { LearningCategory, CategoryStats } from './types';
import { determineWordPosition, positionToCategory } from '@/ai/utils/categoryDetermination';

export interface CategoryClassifierOptions {
  /** 最低試行回数（この回数未満は正答率を信用しない） */
  minAttempts?: number;

  /** 定着判定の連続正解閾値 */
  masteredThreshold?: number;

  /** まだまだ判定の正答率下限 */
  stillLearningMinAccuracy?: number;

  /** まだまだ判定の正答率上限 */
  stillLearningMaxAccuracy?: number;

  /** 分からない判定の正答率閾値 */
  incorrectThreshold?: number;
}

export class CategoryClassifier {
  private categoryCache: Map<string, { category: LearningCategory; timestamp: number; signature: string }>;
  private cacheTimeout: number = 10000; // 10秒間キャッシュ（パフォーマンス改善）

  constructor(_options?: CategoryClassifierOptions) {
    this.categoryCache = new Map();
  }

  /**
   * 単語のカテゴリーを判定
   *
   * @param wordProgress 単語の学習進捗
   * @param mode 学習モード
   * @returns 学習カテゴリー
   */
  determineCategory(
    wordProgress: WordProgress,
    mode: 'memorization' | 'translation' | 'spelling' | 'grammar'
  ): LearningCategory {
    const cacheKey = `${wordProgress.word}-${mode}`;
    const cached = this.categoryCache.get(cacheKey);

    const position = determineWordPosition(wordProgress, mode);
    const category = positionToCategory(position) as LearningCategory;
    const signature = `${position}`;

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout && cached.signature === signature) {
      return cached.category;
    }

    this.cacheResult(cacheKey, category, signature);
    return category;
  }

  /**
   * カテゴリー移動の妥当性を検証
   *
   * 例: mastered → incorrect への急激な移動を防ぐ
   */
  validateCategoryTransition(
    prevCategory: LearningCategory,
    newCategory: LearningCategory,
    wordProgress: WordProgress
  ): { valid: boolean; reason?: string } {
    // mastered → incorrect は、連続不正解が2回以上の場合のみ許可
    if (prevCategory === 'mastered' && newCategory === 'incorrect') {
      const consecutiveIncorrect = wordProgress.consecutiveIncorrect || 0;
      if (consecutiveIncorrect < 2) {
        return {
          valid: false,
          reason: '定着済→分からない への移動は連続不正解2回以上が必要',
        };
      }
    }

    // new → mastered は、最低3回の試行が必要
    if (prevCategory === 'new' && newCategory === 'mastered') {
      const attempts =
        wordProgress.memorizationAttempts ||
        wordProgress.translationAttempts ||
        wordProgress.spellingAttempts ||
        wordProgress.grammarAttempts ||
        0;
      if (attempts < 3) {
        return {
          valid: false,
          reason: '新規→定着済 への移動は最低3回の試行が必要',
        };
      }
    }

    return { valid: true };
  }

  /**
   * バッチ内のカテゴリー統計を取得
   *
   * @param words 単語リスト
   * @param progressMap 学習進捗マップ
   * @param mode 学習モード
   * @returns カテゴリー統計
   */
  getCategoryStats(
    words: string[],
    progressMap: Record<string, WordProgress>,
    mode: 'memorization' | 'translation' | 'spelling' | 'grammar'
  ): Pick<CategoryStats, 'counts'> {
    const counts: Record<LearningCategory, number> = {
      new: 0,
      incorrect: 0,
      still_learning: 0,
      mastered: 0,
    };

    // ⚡ パフォーマンス: 単一ループで集計
    for (const word of words) {
      const progress = progressMap[word];
      if (!progress) {
        counts.new++;
        continue;
      }

      const category = this.determineCategory(progress, mode);
      counts[category]++;
    }

    return { counts };
  }

  /**
   * キャッシュをクリア（メモリ管理）
   */
  clearCache(): void {
    this.categoryCache.clear();
  }

  /**
   * 古いキャッシュエントリを削除（自動メモリ管理）
   */
  private pruneCache(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, value] of this.categoryCache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      this.categoryCache.delete(key);
    }
  }

  /**
   * キャッシュに結果を保存
   */
  private cacheResult(cacheKey: string, category: LearningCategory, signature: string): void {
    this.categoryCache.set(cacheKey, {
      category,
      timestamp: Date.now(),
      signature,
    });

    // ⚡ パフォーマンス: 100件を超えたら古いエントリを削除
    if (this.categoryCache.size > 100) {
      this.pruneCache();
    }
  }
}
