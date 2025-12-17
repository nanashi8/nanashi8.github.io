import { useState } from 'react';

/**
 * セッション統計の型定義
 */
export interface SessionStats {
  correct: number;
  incorrect: number;
  review: number;
  mastered: number;
  newQuestions: number; // 新規問題の出題数
  reviewQuestions: number; // 復習問題の出題数
  consecutiveNew: number; // 連続新規出題カウント
  consecutiveReview: number; // 連続復習出題カウント
}

/**
 * セッション統計を管理するフック
 *
 * 正解・不正解・要復習・定着済みのカウントを追跡
 */
export function useSessionStats() {
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    correct: 0,
    incorrect: 0,
    review: 0,
    mastered: 0,
    newQuestions: 0,
    reviewQuestions: 0,
    consecutiveNew: 0,
    consecutiveReview: 0,
  });

  /**
   * 統計をリセット
   */
  const resetStats = () => {
    setSessionStats({
      correct: 0,
      incorrect: 0,
      review: 0,
      mastered: 0,
      newQuestions: 0,
      reviewQuestions: 0,
      consecutiveNew: 0,
      consecutiveReview: 0,
    });
  };

  /**
   * ステータスに応じて統計を更新
   */
  const updateStats = (status: 'correct' | 'incorrect' | 'review' | 'mastered') => {
    setSessionStats((prev) => ({
      ...prev,
      correct: prev.correct + (status === 'correct' ? 1 : 0),
      incorrect: prev.incorrect + (status === 'incorrect' ? 1 : 0),
      review: prev.review + (status === 'review' ? 1 : 0),
      mastered: prev.mastered + (status === 'mastered' ? 1 : 0),
    }));
  };

  return {
    sessionStats,
    setSessionStats,
    resetStats,
    updateStats,
  };
}
