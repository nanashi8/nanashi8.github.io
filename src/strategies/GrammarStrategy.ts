/**
 * 文法タブ用の問題選択戦略
 * 正答率ベースの優先度調整（将来的に文法パターン認識を追加予定）
 */

import { Question } from '../types';
import {
  BaseQuestionStrategy,
  SessionStats,
  LearningLimits,
} from './QuestionSelectionStrategy';
import { logger } from '@/utils/logger';

/**
 * 文法タブ用の問題選択戦略クラス
 * 
 * 特徴:
 * - 正答率ベースの優先度
 * - 文法パターン認識（将来拡張用）
 * - 文法カテゴリ別の優先度調整（将来拡張用）
 * - 効果的上限の適用
 */
export class GrammarStrategy extends BaseQuestionStrategy<Question> {
  constructor() {
    super('grammar');
  }

  /**
   * 問題の優先度を取得
   * @param question 問題
   * @returns 優先度（低いほど優先）
   */
  getQuestionPriority(question: Question): number {
    const status = this.getQuestionStatusForWord(question.word);
    if (!status) return 3; // 新規問題

    // 正答率ベースの優先度
    const accuracy = status.accuracy || 0;

    if (accuracy < 50) {
      return 1; // incorrect - 最優先
    } else if (accuracy < 80) {
      return 2; // still_learning - 高優先
    } else {
      return 5; // mastered - 低優先
    }
  }

  /**
   * 問題リストを優先順位に基づいてソート
   * @param questions 問題リスト
   * @param limits 学習上限設定
   * @param stats セッション統計（オプション）
   * @returns ソート済み問題リスト
   */
  sortQuestions(
    questions: Question[],
    limits: LearningLimits,
    stats?: SessionStats
  ): Question[] {
    if (questions.length === 0) return [];

    try {
      // 各問題の状態を取得
      const questionsWithStatus = questions.map((q) => ({
        question: q,
        status: this.getQuestionStatusForWord(q.word),
      }));

      // 効果的な上限を計算（statsがある場合）
      let shouldFocusOnLearning = false;
      let shouldFocusOnIncorrect = false;

      if (stats) {
        const effectiveLearningLimit = this.calculateEffectiveLimit(
          limits.learningLimit,
          stats.still_learning
        );
        const effectiveReviewLimit = this.calculateEffectiveLimit(
          limits.reviewLimit,
          stats.incorrect
        );

        shouldFocusOnLearning =
          effectiveLearningLimit > 0 && stats.still_learning >= effectiveLearningLimit;
        shouldFocusOnIncorrect =
          effectiveReviewLimit > 0 && stats.incorrect >= effectiveReviewLimit;
      }

      // ソート: 優先度 > 最終学習時刻（古い順） > ランダム
      const sorted = questionsWithStatus.sort((a, b) => {
        const statusA = a.status;
        const statusB = b.status;

        // 優先度を取得
        let priorityA = statusA?.priority || 3;
        let priorityB = statusB?.priority || 3;

        // 上限達成時の優先度調整
        if (shouldFocusOnIncorrect) {
          if (statusA?.category === 'incorrect') priorityA = 0;
          if (statusB?.category === 'incorrect') priorityB = 0;
        }
        if (shouldFocusOnLearning) {
          if (statusA?.category === 'still_learning') priorityA = 0.5;
          if (statusB?.category === 'still_learning') priorityB = 0.5;
        }

        // 優先度順
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        // 最終学習時刻順（古い方を優先）
        const lastStudiedA = statusA?.lastStudied || 0;
        const lastStudiedB = statusB?.lastStudied || 0;
        if (lastStudiedA !== lastStudiedB) {
          return lastStudiedA - lastStudiedB;
        }

        // ランダム（同じ優先度・同じ学習時刻の場合）
        return Math.random() - 0.5;
      });

      return sorted.map((item) => item.question);
    } catch (error) {
      logger.error('GrammarStrategy: ソート中にエラーが発生しました:', error);
      return questions;
    }
  }
}
