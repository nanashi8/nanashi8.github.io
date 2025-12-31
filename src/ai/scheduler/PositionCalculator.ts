/**
 * Position Calculator - Strategy Pattern
 *
 * 学習モード別のPosition計算を管理
 *
 * 【設計思想】
 * - Strategyパターン: mode別の計算ロジックを独立したクラスに分離
 * - 型駆動設計: Position範囲とカテゴリを型で明示
 * - カプセル化: mode別の試行回数取得ロジックをStrategy内に隔離
 *
 * 【Position階層】
 * - 70-100: incorrect (分からない) ← 最優先で再出題
 * - 40-69:  still_learning (まだまだ) ← 高優先度
 * - 20-39:  new (新規) ← 通常優先度
 * - 0-19:   mastered (定着済み) ← 低優先度
 *
 * 【使用例】
 * ```typescript
 * const calculator = new PositionCalculator('memorization');
 * const position = calculator.calculate(progress);
 * const category = PositionCalculator.categoryOf(position);
 * ```
 */

import type { WordProgress } from '@/storage/progress/types';

export type LearningMode = 'memorization' | 'translation' | 'spelling' | 'grammar';

export type PositionRange = {
  readonly min: number;
  readonly max: number;
  readonly category: 'incorrect' | 'still_learning' | 'new' | 'mastered';
};

export const POSITION_RANGES: Record<PositionRange['category'], PositionRange> = {
  incorrect: { min: 70, max: 100, category: 'incorrect' },
  still_learning: { min: 40, max: 69, category: 'still_learning' },
  new: { min: 20, max: 39, category: 'new' },
  mastered: { min: 0, max: 19, category: 'mastered' },
};

type ModeStats = {
  attempts: number;
  correct: number;
  stillLearning: number;
};

/**
 * Position計算のStrategy基底インターフェース
 *
 * 各学習モード（暗記・和訳・スペル・文法）は独自のStrategyを持つ
 */
interface PositionStrategy {
  calculate(progress: WordProgress | null | undefined): number;
  extractStats(progress: WordProgress | null | undefined): ModeStats;
  getSavedPosition(progress: WordProgress | null | undefined): number | undefined;
}

/**
 * 暗記モードのPosition計算Strategy
 */
class MemorizationStrategy implements PositionStrategy {
  calculate(progress: WordProgress | null | undefined): number {
    return calculatePosition(progress, this.extractStats(progress));
  }

  extractStats(progress: WordProgress | null | undefined): ModeStats {
    return {
      attempts: progress?.memorizationAttempts || 0,
      correct: progress?.memorizationCorrect || 0,
      stillLearning: progress?.memorizationStillLearning || 0,
    };
  }

  getSavedPosition(progress: WordProgress | null | undefined): number | undefined {
    return progress?.memorizationPosition;
  }
}

/**
 * 和訳モードのPosition計算Strategy
 */
class TranslationStrategy implements PositionStrategy {
  calculate(progress: WordProgress | null | undefined): number {
    return calculatePosition(progress, this.extractStats(progress));
  }

  extractStats(progress: WordProgress | null | undefined): ModeStats {
    return {
      attempts: progress?.translationAttempts || 0,
      correct: progress?.translationCorrect || 0,
      stillLearning: 0,
    };
  }

  getSavedPosition(progress: WordProgress | null | undefined): number | undefined {
    return progress?.translationPosition;
  }
}

/**
 * スペルモードのPosition計算Strategy
 */
class SpellingStrategy implements PositionStrategy {
  calculate(progress: WordProgress | null | undefined): number {
    return calculatePosition(progress, this.extractStats(progress));
  }

  extractStats(progress: WordProgress | null | undefined): ModeStats {
    return {
      attempts: progress?.spellingAttempts || 0,
      correct: progress?.spellingCorrect || 0,
      stillLearning: 0,
    };
  }

  getSavedPosition(progress: WordProgress | null | undefined): number | undefined {
    return progress?.spellingPosition;
  }
}

/**
 * 文法モードのPosition計算Strategy
 */
class GrammarStrategy implements PositionStrategy {
  calculate(progress: WordProgress | null | undefined): number {
    return calculatePosition(progress, this.extractStats(progress));
  }

  extractStats(progress: WordProgress | null | undefined): ModeStats {
    return {
      attempts: progress?.grammarAttempts || 0,
      correct: progress?.grammarCorrect || 0,
      stillLearning: 0,
    };
  }

  getSavedPosition(progress: WordProgress | null | undefined): number | undefined {
    return progress?.grammarPosition;
  }
}

const STRATEGIES: Record<LearningMode, PositionStrategy> = {
  memorization: new MemorizationStrategy(),
  translation: new TranslationStrategy(),
  spelling: new SpellingStrategy(),
  grammar: new GrammarStrategy(),
};

/**
 * Position計算のコア関数
 *
 * 計算ロジック:
 * 1. ゴールファースト判定: 連続3回正解 → Position 5 (mastered)
 * 2. 連続不正解ペナルティ: 3回 → 85, 2回 → 75
 * 3. 基本スコア: 50 - 正答率×30 + 連続不正解×10
 * 4. 時間ブースト: 最終学習からの経過日数×2 (最大20)
 * 5. まだまだ語の自動昇格: 正答率70%以上 & 3回以上挑戦 → Position上限35
 *
 * @param progress - 単語の進捗情報
 * @param modeStats - mode別の統計（attempts/correct/stillLearning）
 * @returns Position (0-100)
 */
function calculatePosition(progress: WordProgress | null | undefined, modeStats: ModeStats): number {
  const { attempts, correct, stillLearning } = modeStats;
  const consecutiveCorrect = progress?.consecutiveCorrect || 0;
  const consecutiveIncorrect = progress?.consecutiveIncorrect || 0;

  // ✅ 初出題の場合: ボタン押下に応じて各カテゴリーの標準値に設定
  if (attempts === 1) {
    // 1回目の解答結果を判定
    if (consecutiveCorrect === 1 && correct === 1) {
      // 「覚えてる」を押した → mastered (定着済み) の標準値
      return 15; // POSITION_VALUES.MASTERED_ALMOST
    } else if (stillLearning === 1) {
      // 「まだまだ」を押した → still_learning (学習中) の標準値
      return 50; // POSITION_VALUES.STILL_LEARNING_DEFAULT
    } else if (consecutiveIncorrect === 1) {
      // 「分からない」を押した → incorrect (要復習) の標準値
      return 70; // POSITION_VALUES.INCORRECT_MEDIUM
    }
  }

  // 未挑戦の単語: デフォルト Position 35 (new範囲)
  if (attempts === 0) return 35;

  // ゴールファースト判定: 連続3回正解 → 即座に定着判定
  if (consecutiveCorrect >= 3 && correct >= 3) return 5;

  const accuracy = attempts > 0 ? correct / attempts : 0;

  // 連続不正解ペナルティ
  if (consecutiveIncorrect >= 3) return 85;
  if (consecutiveIncorrect >= 2) return 75;

  // 基本スコア計算
  const baseScore = 50 - accuracy * 30 + consecutiveIncorrect * 10;

  // 時間ブースト: 最終学習からの経過日数
  const daysSince =
    (Date.now() - (progress?.lastStudied || Date.now())) / (1000 * 60 * 60 * 24);
  const timeBoost = Math.min(daysSince * 2, 20);

  let position = baseScore + timeBoost;

  // まだまだ語の自動昇格: 正答率70%以上 & 挑戦3回以上 → Position上限35
  // 理由: 「まだまだ」判定だが実質的に定着しているため、新規語と同等に扱う
  if (accuracy >= 0.7 && stillLearning > 0 && attempts >= 3) {
    position = Math.min(position, 35);
  }

  return Math.max(0, Math.min(100, position));
}

/**
 * PositionCalculator - 学習モード別のPosition計算を統括
 *
 * 機能:
 * - mode別のStrategyを選択・実行
 * - savedPositionの自動判定（まだまだ語の昇格条件判定）
 * - Position → Category 変換
 */
export class PositionCalculator {
  private readonly strategy: PositionStrategy;

  constructor(mode: LearningMode) {
    this.strategy = STRATEGIES[mode];
  }

  /**
   * Positionを計算
   *
   * savedPositionがある場合:
   * - 基本的にsavedPositionを信頼して返却
   * - ただし「まだまだ語の自動昇格条件」を満たす場合のみ再計算
   *   - 挑戦3回以上 & 正解3回以上 & 連続2回正解 & savedPosition >= 40
   *
   * @param progress - 単語の進捗情報
   * @param options.ignoreSaved - savedPositionを無視して強制再計算（解答直後用）
   */
  calculate(
    progress: WordProgress | null | undefined,
    options: { ignoreSaved?: boolean } = {}
  ): number {
    if (!options.ignoreSaved) {
      const saved = this.strategy.getSavedPosition(progress);
      if (saved !== undefined) {
        const stats = this.strategy.extractStats(progress);
        const consecutiveCorrect = progress?.consecutiveCorrect || 0;
        // まだまだ語の自動昇格判定: 実質的に定着している場合は再計算
        const shouldOverride =
          stats.attempts >= 3 &&
          stats.correct >= 3 &&
          consecutiveCorrect >= 2 &&
          saved >= 40;

        if (!shouldOverride) return saved;
      }
    }

    return this.strategy.calculate(progress);
  }

  /**
   * mode別の統計を取得
   *
   * @returns attempts, correct, stillLearning
   */
  getStats(progress: WordProgress | null | undefined): ModeStats {
    return this.strategy.extractStats(progress);
  }

  /**
   * PositionからPositionRangeを取得
   *
   * @param position - Position値 (0-100)
   * @returns PositionRange（min/max/category）
   */
  static rangeOf(position: number): PositionRange {
    for (const range of Object.values(POSITION_RANGES)) {
      if (position >= range.min && position <= range.max) return range;
    }
    return POSITION_RANGES.new;
  }

  /**
   * Positionからカテゴリを取得
   *
   * @param position - Position値 (0-100)
   * @returns 'incorrect' | 'still_learning' | 'new' | 'mastered'
   */
  static categoryOf(position: number): PositionRange['category'] {
    return this.rangeOf(position).category;
  }
}
