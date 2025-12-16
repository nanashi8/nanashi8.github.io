/**
 * 問題選択戦略の基底インターフェース
 * 各学習モード（暗記・和訳・スペル・文法）で異なる出題戦略を実装
 */

import { Question } from '../types';
import { calculateEffectiveLimit, getQuestionStatus, QuestionStatus } from './learningUtils';

/**
 * セッション統計情報
 */
export interface SessionStats {
  mastered: number;
  still_learning: number;
  incorrect: number;
  new: number;
}

/**
 * 学習上限設定
 */
export interface LearningLimits {
  learningLimit: number;
  reviewLimit: number;
}

// QuestionStatusを re-export
export type { QuestionStatus };

/**
 * 問題選択戦略の基底インターフェース
 */
export interface QuestionSelectionStrategy<T = Question> {
  /**
   * 段階的な学習を促す効果的な上限を計算
   * @param targetLimit 目標とする上限値
   * @param currentCount 現在のカウント
   * @returns 効果的な上限値
   */
  calculateEffectiveLimit(targetLimit: number, currentCount: number): number;

  /**
   * 問題リストを優先順位に基づいてソート
   * @param questions 問題リスト
   * @param limits 学習上限設定
   * @param stats セッション統計（オプション）
   * @returns ソート済み問題リスト
   */
  sortQuestions(questions: T[], limits: LearningLimits, stats?: SessionStats): T[];

  /**
   * 復習モードに入るべきかを判定
   * @param stats セッション統計
   * @param limits 学習上限設定
   * @returns 復習モードに入るべきかどうか
   */
  shouldEnterReviewMode(stats: SessionStats, limits: LearningLimits): boolean;

  /**
   * 問題の優先度を取得
   * @param question 問題
   * @returns 優先度（低いほど優先）
   */
  getQuestionPriority(question: T): number;
}

/**
 * 問題選択戦略の基底クラス
 * 共通ロジックを実装し、各タブで継承して使用
 */
export abstract class BaseQuestionStrategy<T = Question> implements QuestionSelectionStrategy<T> {
  protected mode: 'memorization' | 'translation' | 'spelling' | 'grammar';

  constructor(mode: 'memorization' | 'translation' | 'spelling' | 'grammar') {
    this.mode = mode;
  }

  /**
   * 段階的な学習を促す効果的な上限を計算（共通実装）
   * learningUtils.tsの関数を使用
   */
  calculateEffectiveLimit(targetLimit: number, currentCount: number): number {
    return calculateEffectiveLimit(targetLimit, currentCount);
  }

  /**
   * 復習モードに入るべきかを判定（共通実装）
   */
  shouldEnterReviewMode(stats: SessionStats, limits: LearningLimits): boolean {
    const effectiveLearningLimit = this.calculateEffectiveLimit(
      limits.learningLimit,
      stats.still_learning
    );
    const effectiveReviewLimit = this.calculateEffectiveLimit(limits.reviewLimit, stats.incorrect);

    return (
      (effectiveLearningLimit > 0 && stats.still_learning >= effectiveLearningLimit) ||
      (effectiveReviewLimit > 0 && stats.incorrect >= effectiveReviewLimit)
    );
  }

  /**
   * 問題の状態を取得（共通ヘルパー）
   * learningUtils.tsの関数を使用
   */
  protected getQuestionStatusForWord(word: string): QuestionStatus | null {
    return getQuestionStatus(word, this.mode);
  }

  /**
   * 問題リストをソート（各タブで実装）
   */
  abstract sortQuestions(questions: T[], limits: LearningLimits, stats?: SessionStats): T[];

  /**
   * 問題の優先度を取得（各タブで実装）
   */
  abstract getQuestionPriority(question: T): number;
}
