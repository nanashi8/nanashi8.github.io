/**
 * 暗記タブ用の問題選択戦略
 * 忘却リスク計算、間隔反復学習、適応型優先度調整を実装
 */

import { Question } from '../types';
import {
  BaseQuestionStrategy,
  SessionStats,
  LearningLimits,
  QuestionStatus,
} from './QuestionSelectionStrategy';
import {
  calculateOptimalInterval,
  calculateForgettingRisk,
} from './learningUtils';
import { logger } from '@/utils/logger';

/**
 * 暗記タブ用の問題選択戦略クラス
 * 
 * 特徴:
 * - 忘却リスクベースの優先度（エビングハウスの忘却曲線）
 * - SuperMemo SM-2ベースの間隔反復学習
 * - 復習モード時の集中出題（incorrect 70%, still_learning 25%）
 * - フラッシュカード学習原則（復習20%以上で新規抑制）
 * - 上限達成時の自動優先度調整
 */
export class MemorizationStrategy extends BaseQuestionStrategy<Question> {
  private isReviewFocusMode: boolean = false;

  constructor(isReviewFocusMode: boolean = false) {
    super('memorization');
    this.isReviewFocusMode = isReviewFocusMode;
  }

  /**
   * 復習モードの設定を更新
   */
  setReviewFocusMode(enabled: boolean): void {
    this.isReviewFocusMode = enabled;
  }

  /**
   * 問題の優先度を取得
   * @param question 問題
   * @returns 優先度（低いほど優先）
   */
  getQuestionPriority(question: Question): number {
    const status = this.getQuestionStatusForWord(question.word);
    if (!status) return 3; // デフォルト優先度

    const priority = status.priority;

    // 復習モードの場合の優先度調整
    if (this.isReviewFocusMode) {
      if (status.category === 'incorrect') return 0;
      if (status.category === 'still_learning') return 0.5;
      if (status.category === 'mastered') return 10;
      if (status.category === 'new') return 8;
    }

    // 通常モード: 忘却リスクベース
    const risk = status.forgettingRisk || 0;
    if (risk >= 150) return 0.1; // 緊急
    if (risk >= 100) return 0.2; // 高リスク

    if (status.category === 'incorrect') return Math.min(priority, 0.3);
    if (status.category === 'still_learning') return Math.min(priority, 0.8);

    // masteredは忘却リスクに応じて調整
    if (status.category === 'mastered') {
      if (risk >= 50) return 2.0;
      return 4.5;
    }

    return priority;
  }

  /**
   * 問題リストを優先順位に基づいてソート
   * @param questions 問題リスト
   * @param limits 学習上限設定
   * @param _stats セッション統計（未使用、内部で計算）
   * @returns ソート済み問題リスト
   */
  sortQuestions(
    questions: Question[],
    limits: LearningLimits,
    _stats?: SessionStats
  ): Question[] {
    if (questions.length === 0) return [];

    try {
      // 各語句の状態を取得
      const questionsWithStatus = questions.map((q) => ({
        question: q,
        status: this.getEnhancedWordStatus(q.word),
      }));

      // カテゴリ別にカウント
      const counts = {
        mastered: questionsWithStatus.filter((q) => q.status?.category === 'mastered').length,
        still_learning: questionsWithStatus.filter(
          (q) => q.status?.category === 'still_learning'
        ).length,
        incorrect: questionsWithStatus.filter((q) => q.status?.category === 'incorrect').length,
        new: questionsWithStatus.filter((q) => q.status?.category === 'new').length,
      };

      // 上限チェックと優先度調整
      const effectiveStillLearningLimit = this.calculateEffectiveLimit(
        limits.learningLimit,
        counts.still_learning
      );
      const effectiveIncorrectLimit = this.calculateEffectiveLimit(
        limits.reviewLimit,
        counts.incorrect
      );

      const shouldFocusOnStillLearning =
        effectiveStillLearningLimit > 0 && counts.still_learning >= effectiveStillLearningLimit;
      const shouldFocusOnIncorrect =
        effectiveIncorrectLimit > 0 && counts.incorrect >= effectiveIncorrectLimit;

      // 学習状況を分析：まだまだ+分からないの割合を計算
      const totalStudied = counts.mastered + counts.still_learning + counts.incorrect;
      const needsReview = counts.still_learning + counts.incorrect;
      const reviewRatio = totalStudied > 0 ? needsReview / totalStudied : 0;

      // フラッシュカード学習の原則：復習が20%以上なら新規を大幅に抑制
      const shouldSuppressNew = reviewRatio >= 0.2;

      // ソート: 優先度 > 最終学習時刻（古い順） > ランダム
      const sorted = questionsWithStatus.sort((a, b) => {
        const statusA = a.status;
        const statusB = b.status;

        // 優先度を計算
        const priorityA = this.calculatePriority(
          statusA,
          shouldFocusOnStillLearning,
          shouldFocusOnIncorrect,
          shouldSuppressNew
        );
        const priorityB = this.calculatePriority(
          statusB,
          shouldFocusOnStillLearning,
          shouldFocusOnIncorrect,
          shouldSuppressNew
        );

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
      logger.error('MemorizationStrategy: ソート中にエラーが発生しました:', error);
      return questions; // エラー時は元のリストを返す
    }
  }

  /**
   * 拡張された問題状態を取得（忘却リスク・間隔反復学習データを含む）
   * @private
   */
  private getEnhancedWordStatus(word: string): QuestionStatus | null {
    const key = 'english-progress';
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    try {
      const progress = JSON.parse(stored);
      const wordProgress = progress.wordProgress?.[word];
      if (!wordProgress) return null;

      const attempts = wordProgress.memorizationAttempts || 0;
      const correct = wordProgress.memorizationCorrect || 0;
      const stillLearning = wordProgress.memorizationStillLearning || 0;
      const streak = wordProgress.memorizationStreak || 0;
      const lastStudied = wordProgress.lastStudied || 0;

      // 間隔反復学習用データ
      const easinessFactor = wordProgress.easinessFactor || 2.5;
      const reviewInterval =
        wordProgress.reviewInterval || calculateOptimalInterval(streak, easinessFactor);

      if (attempts === 0) {
        return {
          category: 'new',
          priority: 3,
          lastStudied,
          attempts,
          correct,
          streak,
          forgettingRisk: 0,
          reviewInterval: 0,
          accuracy: 0,
        };
      }

      // まだまだを0.5回の正解として計算（正答率50%以上になるように）
      const effectiveCorrect = correct + stillLearning * 0.5;
      const accuracy = attempts > 0 ? (effectiveCorrect / attempts) * 100 : 0;

      // 忘却リスクを計算
      const forgettingRisk = calculateForgettingRisk(lastStudied, reviewInterval, accuracy);

      // カテゴリ判定
      // 🟢 覚えてる: 連続3回以上 or 正答率80%以上で連続2回
      if (streak >= 3 || (streak >= 2 && accuracy >= 80)) {
        return {
          category: 'mastered',
          priority: 5,
          lastStudied,
          attempts,
          correct,
          streak,
          forgettingRisk,
          reviewInterval,
          accuracy,
        };
      }
      // 🟡 まだまだ: 正答率50%以上 or まだまだボタンを押したことがある
      else if (accuracy >= 50 || stillLearning > 0) {
        return {
          category: 'still_learning',
          priority: 2,
          lastStudied,
          attempts,
          correct,
          streak,
          forgettingRisk,
          reviewInterval,
          accuracy,
        };
      }
      // 🔴 分からない: 正答率50%未満 and まだまだボタンを押したことがない
      else {
        return {
          category: 'incorrect',
          priority: 1,
          lastStudied,
          attempts,
          correct,
          streak,
          forgettingRisk,
          reviewInterval,
          accuracy,
        };
      }
    } catch (error) {
      logger.error('統計情報の取得エラー:', error);
      return null;
    }
  }

  /**
   * 優先度を計算
   * @private
   */
  private calculatePriority(
    status: QuestionStatus | null,
    shouldFocusOnStillLearning: boolean,
    shouldFocusOnIncorrect: boolean,
    shouldSuppressNew: boolean
  ): number {
    if (!status) return 3;

    let priority = status.priority;

    // 🔥 復習モードが有効な場合: 分からないとまだまだを集中的に出題
    if (this.isReviewFocusMode) {
      // 分からない（incorrect）を最優先（約70%の出現率）
      if (status.category === 'incorrect') return 0;

      // まだまだ（still_learning）を次に優先（約25%の出現率）
      if (status.category === 'still_learning') return 0.5;

      // 覚えてる（mastered）と新規はほぼ出題しない（合計5%）
      if (status.category === 'mastered') return 10;
      if (status.category === 'new') return 8;
    } else {
      // 通常モード: 適応型間隔反復 + 忘却リスクベースの優先度

      // 忘却リスクによる緊急度判定
      const risk = status.forgettingRisk || 0;

      // 🚨 忘却リスク150+: 緊急（忘れる直前）→ 最優先
      if (risk >= 150) return 0.1;

      // ⚠️ 忘却リスク100-149: 高リスク → 優先
      if (risk >= 100 && risk < 150) return 0.2;

      // 🔴 分からないは常に高優先（記憶の定着が最重要）
      if (status.category === 'incorrect' && priority > 0.2) priority = 0.3;

      // 🟡 まだまだも高優先（定着させることが重要）
      if (status.category === 'still_learning' && priority > 0.3) priority = 0.8;

      // 🟢 覚えてる: 忘却リスクに応じて出題タイミングを調整
      if (status.category === 'mastered') {
        if (risk >= 50 && priority > 1) {
          priority = 2.0; // 中リスク → 適度に復習
        } else if (priority > 2) {
          priority = 4.5; // 低リスク → 後回し
        }
      }

      // 🆕 新規問題は復習状況に応じて大幅に抑制
      // フラッシュカード学習では、復習が優先で新規は少しずつ追加
      if (status.category === 'new' && priority > 3) {
        priority = shouldSuppressNew ? 5 : 3.5; // 20%以上: 最後尾、20%未満: 後回し
      }

      // 上限に達した場合はさらに優先度を上げる
      if (shouldFocusOnIncorrect && status.category === 'incorrect') {
        priority = 0;
      }
      if (shouldFocusOnStillLearning && status.category === 'still_learning') {
        priority = 0.05;
      }
    }

    return priority;
  }
}
