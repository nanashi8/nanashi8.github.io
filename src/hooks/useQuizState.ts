import { useState } from 'react';
import type { Question, QuizState } from '@/types';

// セッション統計インターフェース
interface SessionStats {
  correct: number;
  incorrect: number;
  review: number;
  mastered: number;
}

/**
 * クイズ状態管理フック
 * - quizState: 和訳タブ用のクイズ状態
 * - sessionStats: セッション統計
 * - reviewFocusMode: 要復習集中モード（補修モード）
 * - reviewQuestionPool: 補修モード用の問題プール
 * - reviewCorrectStreak: 補修モードの連続正解数
 */
export function useQuizState() {
  // セッション統計（和訳タブ用）
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    correct: 0,
    incorrect: 0,
    review: 0,
    mastered: 0,
  });

  // 和訳タブ用のクイズ状態
  const [quizState, setQuizState] = useState<QuizState>({
    questions: [],
    currentIndex: 0,
    score: 0,
    totalAnswered: 0,
    answered: false,
    selectedAnswer: null,
  });

  // 要復習集中モード（補修モード）
  const [reviewFocusMode, setReviewFocusMode] = useState<boolean>(false);
  const [reviewQuestionPool, setReviewQuestionPool] = useState<Question[]>([]);
  const [reviewCorrectStreak, setReviewCorrectStreak] = useState<Map<string, number>>(new Map());

  return {
    sessionStats,
    setSessionStats,
    quizState,
    setQuizState,
    reviewFocusMode,
    setReviewFocusMode,
    reviewQuestionPool,
    setReviewQuestionPool,
    reviewCorrectStreak,
    setReviewCorrectStreak,
  };
}
