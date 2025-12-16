/**
 * questionPrioritySorter.ts
 *
 * 全タブ共通の問題優先度ソート機能
 * 適応型学習AIと統合し、学習状況に応じて動的に問題を再選択
 *
 * @author AI Assistant
 * @version 1.0
 * @since 2025-12-16
 */

import { Question } from '../types';
import { logger } from '@/utils/logger';

interface WordStatus {
  category: 'new' | 'incorrect' | 'still_learning' | 'mastered';
  priority: number;
  lastStudied: number;
  attempts: number;
  correct: number;
  streak: number;
  forgettingRisk: number;
  reviewInterval: number;
}

interface SortOptions {
  isReviewFocusMode?: boolean;
  learningLimit?: number | null;
  reviewLimit?: number | null;
  mode: 'translation' | 'spelling' | 'grammar' | 'memorization';
}

/**
 * 忘却リスクスコアの計算
 */
function calculateForgettingRisk(
  lastStudied: number,
  reviewInterval: number,
  accuracy: number
): number {
  if (lastStudied === 0) return 0;

  const daysSinceLastStudy = (Date.now() - lastStudied) / (1000 * 60 * 60 * 24);
  const intervalRatio = reviewInterval > 0 ? daysSinceLastStudy / reviewInterval : 0;

  let risk = intervalRatio * 100;
  if (accuracy < 50) risk *= 1.5;
  else if (accuracy >= 80) risk *= 0.7;

  return Math.round(Math.min(risk, 200));
}

/**
 * 最適な復習間隔を計算
 */
function calculateOptimalInterval(streak: number, easinessFactor: number = 2.5): number {
  if (streak === 0) return 0;
  if (streak === 1) return 1;
  if (streak === 2) return 3;
  if (streak === 3) return 7;

  const baseInterval = 7;
  return Math.round(baseInterval * Math.pow(easinessFactor, streak - 3));
}

/**
 * 語句の学習状況を取得
 */
function getWordStatus(word: string, mode: string): WordStatus | null {
  const key = 'english-progress';
  const stored = localStorage.getItem(key);
  if (!stored) return null;

  try {
    const progress = JSON.parse(stored);
    const wordProgress = progress.wordProgress?.[word];
    if (!wordProgress) return null;

    // モード別の統計を取得
    const modeKey = mode === 'memorization' ? 'memorization' : 'default';
    const attempts =
      mode === 'memorization' ? wordProgress.memorizationAttempts || 0 : wordProgress.attempts || 0;
    const correct =
      mode === 'memorization' ? wordProgress.memorizationCorrect || 0 : wordProgress.correct || 0;
    const stillLearning = mode === 'memorization' ? wordProgress.memorizationStillLearning || 0 : 0;
    const streak =
      mode === 'memorization' ? wordProgress.memorizationStreak || 0 : wordProgress.streak || 0;
    const lastStudied = wordProgress.lastStudied || 0;

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
      };
    }

    const effectiveCorrect = correct + stillLearning * 0.5;
    const accuracy = attempts > 0 ? (effectiveCorrect / attempts) * 100 : 0;
    const forgettingRisk = calculateForgettingRisk(lastStudied, reviewInterval, accuracy);

    // カテゴリ判定
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
      };
    } else if (accuracy >= 50 || stillLearning > 0) {
      return {
        category: 'still_learning',
        priority: 2,
        lastStudied,
        attempts,
        correct,
        streak,
        forgettingRisk,
        reviewInterval,
      };
    } else {
      return {
        category: 'incorrect',
        priority: 1,
        lastStudied,
        attempts,
        correct,
        streak,
        forgettingRisk,
        reviewInterval,
      };
    }
  } catch (error) {
    logger.error('統計情報の取得エラー:', error);
    return null;
  }
}

/**
 * 問題を優先度順にソート
 */
export function sortQuestionsByPriority(questions: Question[], options: SortOptions): Question[] {
  const { isReviewFocusMode = false, learningLimit, reviewLimit, mode } = options;

  // 各語句の状態を取得
  const questionsWithStatus = questions.map((q, index) => ({
    question: q,
    status: getWordStatus(q.word, mode),
    index,
  }));

  // カテゴリ別にカウント
  const counts = {
    mastered: questionsWithStatus.filter((q) => q.status?.category === 'mastered').length,
    still_learning: questionsWithStatus.filter((q) => q.status?.category === 'still_learning')
      .length,
    incorrect: questionsWithStatus.filter((q) => q.status?.category === 'incorrect').length,
    new: questionsWithStatus.filter((q) => q.status?.category === 'new').length,
  };

  // 上限チェック
  const shouldFocusOnStillLearning =
    learningLimit !== null && learningLimit !== undefined && counts.still_learning >= learningLimit;
  const shouldFocusOnIncorrect =
    reviewLimit !== null && reviewLimit !== undefined && counts.incorrect >= reviewLimit;

  // 学習状況を分析
  const totalStudied = counts.mastered + counts.still_learning + counts.incorrect;
  const needsReview = counts.still_learning + counts.incorrect;
  const reviewRatio = totalStudied > 0 ? needsReview / totalStudied : 0;
  const shouldSuppressNew = reviewRatio >= 0.2;

  // 段階的解消戦略：上限設定に応じて動的に閾値を調整
  const effectiveLimit: number =
    learningLimit !== null && learningLimit !== undefined
      ? learningLimit
      : reviewLimit !== null && reviewLimit !== undefined
        ? reviewLimit
        : 50;
  const concentrationThreshold = Math.max(3, Math.floor(effectiveLimit * 0.6));
  const newQuestionThreshold = Math.max(2, Math.floor(effectiveLimit * 0.3));

  const hasLargeIncorrectBacklog = counts.incorrect > concentrationThreshold;
  const canIntroduceNewQuestions = counts.incorrect <= newQuestionThreshold;

  // ソート
  const sorted = questionsWithStatus.sort((a, b) => {
    const statusA = a.status;
    const statusB = b.status;

    let priorityA = statusA?.priority || 3;
    let priorityB = statusB?.priority || 3;

    // セッション優先フラグ：再追加された問題を最優先（次の3問の中で）
    const hasSessionPriorityA = a.question.sessionPriority !== undefined;
    const hasSessionPriorityB = b.question.sessionPriority !== undefined;

    if (hasSessionPriorityA && !hasSessionPriorityB) return -1;
    if (!hasSessionPriorityA && hasSessionPriorityB) return 1;
    if (hasSessionPriorityA && hasSessionPriorityB) {
      // 両方とも再追加されている場合は、タイムスタンプで比較（古い方を優先）
      return (a.question.sessionPriority || 0) - (b.question.sessionPriority || 0);
    }

    // 復習モード
    if (isReviewFocusMode) {
      if (statusA?.category === 'incorrect') priorityA = 0;
      if (statusB?.category === 'incorrect') priorityB = 0;

      if (statusA?.category === 'still_learning' && priorityA !== 0) priorityA = 0.5;
      if (statusB?.category === 'still_learning' && priorityB !== 0) priorityB = 0.5;

      if (statusA?.category === 'mastered' && priorityA > 1) priorityA = 10;
      if (statusB?.category === 'mastered' && priorityB > 1) priorityB = 10;
      if (statusA?.category === 'new' && priorityA > 1) priorityA = 8;
      if (statusB?.category === 'new' && priorityB > 1) priorityB = 8;
    } else {
      // 通常モード
      const riskA = statusA?.forgettingRisk || 0;
      const riskB = statusB?.forgettingRisk || 0;

      if (riskA >= 150) priorityA = 0.1;
      if (riskB >= 150) priorityB = 0.1;

      if (riskA >= 100 && riskA < 150) priorityA = 0.2;
      if (riskB >= 100 && riskB < 150) priorityB = 0.2;

      // 覚えていない語句の優先度（大量バックログ対応）
      if (statusA?.category === 'incorrect' && priorityA > 0.2) {
        if (hasLargeIncorrectBacklog) {
          const isRecentA = statusA.lastStudied && Date.now() - statusA.lastStudied < 86400000;
          priorityA = isRecentA ? 0.1 : 0.3;
        } else {
          priorityA = 0.3;
        }
      }
      if (statusB?.category === 'incorrect' && priorityB > 0.2) {
        if (hasLargeIncorrectBacklog) {
          const isRecentB = statusB.lastStudied && Date.now() - statusB.lastStudied < 86400000;
          priorityB = isRecentB ? 0.1 : 0.3;
        } else {
          priorityB = 0.3;
        }
      }

      // まだまだ語句
      if (statusA?.category === 'still_learning' && priorityA > 0.3) priorityA = 0.8;
      if (statusB?.category === 'still_learning' && priorityB > 0.3) priorityB = 0.8;

      // 覚えてる語句
      if (statusA?.category === 'mastered') {
        if (riskA >= 50 && priorityA > 1) priorityA = 2.0;
        else if (priorityA > 2) priorityA = 4.5;
      }
      if (statusB?.category === 'mastered') {
        if (riskB >= 50 && priorityB > 1) priorityB = 2.0;
        else if (priorityB > 2) priorityB = 4.5;
      }

      // 新規問題の段階的導入
      if (statusA?.category === 'new' && priorityA > 3) {
        if (hasLargeIncorrectBacklog) {
          priorityA = 10;
        } else if (canIntroduceNewQuestions) {
          priorityA = 3.5;
        } else {
          priorityA = shouldSuppressNew ? 5 : 3.5;
        }
      }
      if (statusB?.category === 'new' && priorityB > 3) {
        if (hasLargeIncorrectBacklog) {
          priorityB = 10;
        } else if (canIntroduceNewQuestions) {
          priorityB = 3.5;
        } else {
          priorityB = shouldSuppressNew ? 5 : 3.5;
        }
      }

      // 上限達成時の優先度調整
      if (shouldFocusOnIncorrect) {
        if (statusA?.category === 'incorrect') priorityA = 0;
        if (statusB?.category === 'incorrect') priorityB = 0;
      }
      if (shouldFocusOnStillLearning) {
        if (statusA?.category === 'still_learning') priorityA = 0.05;
        if (statusB?.category === 'still_learning') priorityB = 0.05;
      }
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

    // 安定タイブレーク（元の順序を維持）
    return (a as any).index - (b as any).index;
  });

  // 枠取りロジック：新規/復習のバランスを制御
  const sortedQuestions = sorted.map((item) => item.question);

  // セッション優先フラグを持つ問題（再追加問題）を最初に抽出
  const sessionPriorityQuestions = sortedQuestions.filter(q => q.sessionPriority !== undefined);
  const otherQuestions = sortedQuestions.filter(q => q.sessionPriority === undefined);

  // 新規問題と復習問題を分類（sessionPriority以外で）
  const reviewQuestions: Question[] = [];
  const newQuestions: Question[] = [];

  otherQuestions.forEach(q => {
    // 既に学習したことがある問題（incorrect, still_learning, mastered）は復習扱い
    const status = getWordStatus(q.word, mode);
    if (status && status.category !== 'new') {
      reviewQuestions.push(q);
    } else {
      newQuestions.push(q);
    }
  });

  // 枠取り：復習7割、新規3割の比率で混ぜる
  const result: Question[] = [];
  let reviewIndex = 0;
  let newIndex = 0;

  // まずセッション優先問題を追加（最優先）
  result.push(...sessionPriorityQuestions);

  // 復習と新規を比率7:3で混ぜる
  while (reviewIndex < reviewQuestions.length || newIndex < newQuestions.length) {
    // 復習7問
    for (let i = 0; i < 7 && reviewIndex < reviewQuestions.length; i++) {
      result.push(reviewQuestions[reviewIndex++]);
    }
    // 新規3問
    for (let i = 0; i < 3 && newIndex < newQuestions.length; i++) {
      result.push(newQuestions[newIndex++]);
    }
  }

  return result;
}
