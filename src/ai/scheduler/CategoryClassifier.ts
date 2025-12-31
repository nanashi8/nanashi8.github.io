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
import { logger } from '@/utils/logger';

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
  private options: Required<CategoryClassifierOptions>;
  private categoryCache: Map<string, { category: LearningCategory; timestamp: number; signature: string }>;
  private cacheTimeout: number = 10000; // 10秒間キャッシュ（パフォーマンス改善）

  constructor(options?: CategoryClassifierOptions) {
    this.options = {
      minAttempts: options?.minAttempts ?? 5,
      masteredThreshold: options?.masteredThreshold ?? 3,
      stillLearningMinAccuracy: options?.stillLearningMinAccuracy ?? 50,
      stillLearningMaxAccuracy: options?.stillLearningMaxAccuracy ?? 80,
      incorrectThreshold: options?.incorrectThreshold ?? 50,
    };
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

    const modeStats = this.getModeStats(wordProgress, mode);
    const consecutiveCorrect = wordProgress.consecutiveCorrect || 0;
    const consecutiveIncorrect = wordProgress.consecutiveIncorrect || 0;
    const savedPosition = this.getSavedPosition(wordProgress, mode);
    const signature = `${modeStats.attempts}/${modeStats.correct}/${modeStats.stillLearning}/${consecutiveCorrect}/${consecutiveIncorrect}/${savedPosition ?? 'x'}`;

    // キャッシュヒット（5秒以内）
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout && cached.signature === signature) {
      return cached.category;
    }

    // モード別の試行回数・正解数を取得
    const { attempts, correct } = modeStats;

    // 未挑戦 → 新規
    if (attempts === 0) {
      this.cacheResult(cacheKey, 'new', signature);
      return 'new';
    }

    // ✅ 初回解答（attempts=1）は保存済みPosition（例: 15/50/70）からカテゴリを確定
    // 閾値境界での揺れを避け、解答ボタンに対応したカテゴリへ確実に分類する。
    if (attempts === 1 && typeof savedPosition === 'number') {
      const decided =
        savedPosition >= 70
          ? 'incorrect'
          : savedPosition >= 40
            ? 'still_learning'
            : 'mastered';
      this.cacheResult(cacheKey, decided, signature);
      return decided;
    }

    // 連続3回以上正解 → 定着済
    if (consecutiveCorrect >= this.options.masteredThreshold) {
      this.cacheResult(cacheKey, 'mastered', signature);
      return 'mastered';
    }

    // 試行回数が少ない場合は正答率を信用せず、連続正解数のみで判定
    if (attempts < this.options.minAttempts) {
      if (consecutiveCorrect >= 2) {
        this.cacheResult(cacheKey, 'still_learning', signature);
        return 'still_learning';
      }
      if (consecutiveCorrect === 1) {
        this.cacheResult(cacheKey, 'still_learning', signature);
        return 'still_learning';
      }
      // 連続正解0 → 分からない
      this.cacheResult(cacheKey, 'incorrect', signature);
      return 'incorrect';
    }

    // 正答率で判定（試行回数が十分な場合）
    const accuracy = (correct / attempts) * 100;

    if (accuracy >= this.options.stillLearningMaxAccuracy) {
      // 正答率80%以上 → 定着済（ただし連続正解が足りない）
      this.cacheResult(cacheKey, 'mastered', signature);
      return 'mastered';
    }

    if (accuracy >= this.options.stillLearningMinAccuracy) {
      // 正答率50-80% → まだまだ
      this.cacheResult(cacheKey, 'still_learning', signature);
      return 'still_learning';
    }

    // 正答率50%未満 → 分からない
    this.cacheResult(cacheKey, 'incorrect', signature);
    return 'incorrect';
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
   * モード別の統計を取得
   */
  private getModeStats(
    wordProgress: WordProgress,
    mode: 'memorization' | 'translation' | 'spelling' | 'grammar'
  ): { attempts: number; correct: number; stillLearning: number } {
    switch (mode) {
      case 'memorization':
        return {
          attempts: wordProgress.memorizationAttempts || 0,
          correct: wordProgress.memorizationCorrect || 0,
          stillLearning: wordProgress.memorizationStillLearning || 0,
        };
      case 'translation':
        return {
          attempts: wordProgress.translationAttempts || 0,
          correct: wordProgress.translationCorrect || 0,
          stillLearning: 0,
        };
      case 'spelling':
        return {
          attempts: wordProgress.spellingAttempts || 0,
          correct: wordProgress.spellingCorrect || 0,
          stillLearning: 0,
        };
      case 'grammar':
        return {
          attempts: wordProgress.grammarAttempts || 0,
          correct: wordProgress.grammarCorrect || 0,
          stillLearning: 0,
        };
      default:
        return { attempts: 0, correct: 0, stillLearning: 0 };
    }
  }

  /**
   * モード別の保存済みPositionを取得
   */
  private getSavedPosition(
    wordProgress: WordProgress,
    mode: 'memorization' | 'translation' | 'spelling' | 'grammar'
  ): number | undefined {
    switch (mode) {
      case 'memorization':
        return wordProgress.memorizationPosition;
      case 'translation':
        return wordProgress.translationPosition;
      case 'spelling':
        return wordProgress.spellingPosition;
      case 'grammar':
        return wordProgress.grammarPosition;
      default:
        return undefined;
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
