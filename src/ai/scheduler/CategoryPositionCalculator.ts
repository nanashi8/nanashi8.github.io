/**
 * CategoryPositionCalculator - カテゴリー内Position計算器
 *
 * 各カテゴリー内での相対的な優先度（0-100）を計算
 *
 * 【計算方針】
 * - incorrect: 連続不正解が多い → 高Position
 * - still_learning: 正答率が低い方 → 高Position
 * - new: 基本Positionのまま（バッチ順など）
 * - mastered: 最終学習からの経過日数 → 高Position（忘却対策）
 *
 * 【使用例】
 * ```typescript
 * const calculator = new CategoryPositionCalculator();
 * const position = calculator.calculateCategoryPosition(
 *   wordProgress,
 *   'incorrect',
 *   'memorization'
 * );
 * ```
 */

import type { WordProgress } from '@/storage/progress/types';
import type { LearningCategory, CategoryPosition } from './types';
import { PositionCalculator } from './PositionCalculator';

export interface CategoryPositionOptions {
  /** 基本Position計算器（既存のPositionCalculatorを使用） */
  baseCalculator?: PositionCalculator;
}

export class CategoryPositionCalculator {
  private calculatorCache: Map<
    'memorization' | 'translation' | 'spelling' | 'grammar',
    PositionCalculator
  >;

  constructor(options?: CategoryPositionOptions) {
    this.calculatorCache = new Map();
    if (options?.baseCalculator) {
      // 既存オプションとの互換性のため、memorizationとしてキャッシュ
      this.calculatorCache.set('memorization', options.baseCalculator);
    }
  }

  /**
   * カテゴリー内Positionを計算
   *
   * @param wordProgress 単語の学習進捗
   * @param category 学習カテゴリー
   * @param mode 学習モード
   * @returns カテゴリー内Position（0-100）
   */
  calculateCategoryPosition(
    wordProgress: WordProgress,
    category: LearningCategory,
    mode: 'memorization' | 'translation' | 'spelling' | 'grammar'
  ): CategoryPosition {
    // 基本Positionを取得
    // - 可能なら保存済みPosition（解答直後に計算・保存された値）を用いる
    // - これにより「カテゴリ内順位はPositionを主に決める」という設計に沿う
    const basePosition = this.getBasePosition(wordProgress, mode);

    let positionInCategory = basePosition;
    let reason = '基本Position';

    // カテゴリー別の補正
    switch (category) {
      case 'incorrect':
        positionInCategory = this.calculateIncorrectPosition(wordProgress, basePosition, mode);
        reason = '連続不正解・正答率補正';
        break;

      case 'still_learning':
        positionInCategory = this.calculateStillLearningPosition(wordProgress, basePosition, mode);
        reason = '正答率・復習間隔補正';
        break;

      case 'new':
        positionInCategory = this.calculateNewPosition(wordProgress, basePosition);
        reason = 'バッチ順・基本Position';
        break;

      case 'mastered':
        positionInCategory = this.calculateMasteredPosition(wordProgress, basePosition);
        reason = '忘却対策・経過日数補正';
        break;
    }

    // 0-100にクランプ
    // メタ情報（difficultyScore等）を小さく加点
    const metadataBonus = this.calculateMetadataBonus(wordProgress);
    if (metadataBonus !== 0) {
      positionInCategory += metadataBonus;
      reason += ` + メタ情報(${metadataBonus})`;
    }

    positionInCategory = this.normalizePosition(positionInCategory);

    return {
      category,
      positionInCategory,
      reason,
    };
  }

  /**
   * 複数の単語をカテゴリー内Positionでソート
   *
   * @param words 単語リスト
   * @param progressMap 学習進捗マップ
   * @param category カテゴリー
   * @param mode 学習モード
   * @returns ソート済み単語リスト（Position降順）
   */
  sortByPriority(
    words: string[],
    progressMap: Record<string, WordProgress>,
    category: LearningCategory,
    mode: 'memorization' | 'translation' | 'spelling' | 'grammar'
  ): Array<{ word: string; position: CategoryPosition }> {
    const wordPositions = words.map((word) => {
      const progress = progressMap[word] || this.createDefaultProgress(word);
      const position = this.calculateCategoryPosition(progress, category, mode);
      return { word, position };
    });

    // Position降順でソート
    return wordPositions.sort(
      (a, b) => b.position.positionInCategory - a.position.positionInCategory
    );
  }

  /**
   * 分からない語のPosition計算
   *
   * 連続不正解が多い → 高Position
   */
  private calculateIncorrectPosition(
    wordProgress: WordProgress,
    basePosition: number,
    mode: 'memorization' | 'translation' | 'spelling' | 'grammar'
  ): number {
    const consecutiveIncorrect = wordProgress.consecutiveIncorrect || 0;
    const { attempts, correct } = this.getModeStats(wordProgress, mode);

    // 連続不正解ボーナス（1回あたり+5）
    let position = basePosition + consecutiveIncorrect * 5;

    // 正答率による補正（正答率が低いほど高Position）
    if (attempts > 0) {
      const accuracy = (correct / attempts) * 100;
      const accuracyPenalty = (100 - accuracy) * 0.2; // 正答率0%で+20
      position += accuracyPenalty;
    }

    return position;
  }

  /**
   * まだまだ語のPosition計算
   *
   * 正答率が低い方 → 高Position
   */
  private calculateStillLearningPosition(
    wordProgress: WordProgress,
    basePosition: number,
    mode: 'memorization' | 'translation' | 'spelling' | 'grammar'
  ): number {
    const { attempts, correct } = this.getModeStats(wordProgress, mode);

    if (attempts === 0) return basePosition;

    // 正答率による補正（正答率が低いほど高Position）
    const accuracy = (correct / attempts) * 100;
    const accuracyBonus = (100 - accuracy) * 0.2; // 正答率0%で+20

    // 復習間隔による補正（最終学習から時間が経っているほど高Position）
    const daysSinceLastStudy = wordProgress.lastStudied
      ? (Date.now() - wordProgress.lastStudied) / (1000 * 60 * 60 * 24)
      : 0;
    const timeBonus = Math.min(10, daysSinceLastStudy * 0.5); // 最大+10

    return basePosition + accuracyBonus + timeBonus;
  }

  /**
   * 保存済みPositionを優先して取得
   */
  private getBasePosition(
    wordProgress: WordProgress,
    mode: 'memorization' | 'translation' | 'spelling' | 'grammar'
  ): number {
    let calculator = this.calculatorCache.get(mode);
    if (!calculator) {
      calculator = new PositionCalculator(mode);
      this.calculatorCache.set(mode, calculator);
    }
    return calculator.calculate(wordProgress);
  }

  /**
   * メタ情報ボーナス（0-12程度）
   *
   * 現状はWordProgress側にある指標のみを使用。
   * - difficultyScore(0-100) を最大+10程度
   * - userDifficultyRating(1-3) の「難しい」を+2程度
   */
  private calculateMetadataBonus(wordProgress: WordProgress): number {
    const difficultyScore =
      typeof wordProgress.difficultyScore === 'number' ? wordProgress.difficultyScore : 0;
    const difficultyBonus = Math.round((Math.max(0, Math.min(100, difficultyScore)) / 100) * 10);

    const rating = wordProgress.userDifficultyRating;
    const ratingBonus = rating === 3 ? 2 : 0;

    return Math.max(0, Math.min(12, difficultyBonus + ratingBonus));
  }

  /**
   * 新規語のPosition計算
   *
   * 頭文字ベースの分散 + ランダム化により出題順序を最適化
   * 同じ頭文字の単語が連続しないよう、異なる範囲に配置
   */
  private calculateNewPosition(wordProgress: WordProgress, _basePosition: number): number {
    const word = wordProgress.word.toLowerCase();

    // 頭文字を取得（アルファベット以外は'#'として扱う）
    const firstChar = word.match(/[a-z]/) ? word.charAt(0) : '#';

    // 頭文字のcharCodeを0-25の範囲に正規化（a=0, b=1, ..., z=25, その他=26）
    const charCode = firstChar === '#' ? 26 : firstChar.charCodeAt(0) - 'a'.charCodeAt(0);

    // 頭文字ごとに異なる範囲（0-100を27分割）に基本位置を設定
    const baseRange = (charCode * 100) / 27;

    // 同じ頭文字内でもランダムに分散（範囲内で±15のバラつき）
    const randomOffset = (Math.random() - 0.5) * 30;

    // 最終的なPositionを計算（0-100にクランプ）
    return Math.max(0, Math.min(100, baseRange + randomOffset));
  }

  /**
   * 定着済語のPosition計算
   *
   * 最終学習からの経過日数 → 高Position（忘却対策）
   */
  private calculateMasteredPosition(wordProgress: WordProgress, basePosition: number): number {
    if (!wordProgress.lastStudied) return basePosition;

    // 最終学習からの経過日数
    const daysSinceLastStudy = (Date.now() - wordProgress.lastStudied) / (1000 * 60 * 60 * 24);

    // 経過日数による忘却リスク補正（1日あたり+2、最大+40）
    const forgettingBonus = Math.min(40, daysSinceLastStudy * 2);

    return basePosition + forgettingBonus;
  }

  /**
   * Positionを0-100にクランプ
   */
  private normalizePosition(position: number): number {
    return Math.max(0, Math.min(100, Math.round(position)));
  }

  /**
   * モード別の統計を取得
   */
  private getModeStats(
    wordProgress: WordProgress,
    mode: 'memorization' | 'translation' | 'spelling' | 'grammar'
  ): { attempts: number; correct: number } {
    switch (mode) {
      case 'memorization':
        return {
          attempts: wordProgress.memorizationAttempts || 0,
          correct: wordProgress.memorizationCorrect || 0,
        };
      case 'translation':
        return {
          attempts: wordProgress.translationAttempts || 0,
          correct: wordProgress.translationCorrect || 0,
        };
      case 'spelling':
        return {
          attempts: wordProgress.spellingAttempts || 0,
          correct: wordProgress.spellingCorrect || 0,
        };
      case 'grammar':
        return {
          attempts: wordProgress.grammarAttempts || 0,
          correct: wordProgress.grammarCorrect || 0,
        };
      default:
        return { attempts: 0, correct: 0 };
    }
  }

  /**
   * デフォルトの学習進捗を作成
   */
  private createDefaultProgress(word: string): WordProgress {
    return {
      word,
      correctCount: 0,
      incorrectCount: 0,
      lastStudied: 0,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,
      memorizationAttempts: 0,
      memorizationCorrect: 0,
      translationAttempts: 0,
      translationCorrect: 0,
      spellingAttempts: 0,
      spellingCorrect: 0,
      grammarAttempts: 0,
      grammarCorrect: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      difficultyScore: 0,
      masteryLevel: 'new' as const,
      responseTimes: [],
    };
  }
}
