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
import { determineWordPosition } from '@/ai/utils/categoryDetermination';

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
  extractStats(progress: WordProgress | null | undefined): ModeStats;
  getSavedPosition(progress: WordProgress | null | undefined): number | undefined;
}

/**
 * 暗記モードのPosition計算Strategy
 */
class MemorizationStrategy implements PositionStrategy {
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
 * PositionCalculator - 学習モード別のPosition計算を統括
 *
 * 機能:
 * - mode別のStrategyを選択・実行
 * - savedPositionの自動判定（まだまだ語の昇格条件判定）
 * - Position → Category 変換
 */
export class PositionCalculator {
  private readonly mode: LearningMode;
  private readonly strategy: PositionStrategy;

  constructor(mode: LearningMode) {
    this.mode = mode;
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
    return determineWordPosition(progress, this.mode, { ignoreSaved: options.ignoreSaved });
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
