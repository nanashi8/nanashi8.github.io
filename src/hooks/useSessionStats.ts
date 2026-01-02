import { useState, useEffect } from 'react';

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
  still_learning?: number; // まだまだ（暗記タブ専用）
  total?: number; // 総回答数（暗記タブ専用）
}

type LearningMode = 'memorization' | 'translation' | 'spelling' | 'grammar';

const INITIAL_STATS: SessionStats = {
  correct: 0,
  incorrect: 0,
  review: 0,
  mastered: 0,
  newQuestions: 0,
  reviewQuestions: 0,
  consecutiveNew: 0,
  consecutiveReview: 0,
  still_learning: 0,
  total: 0,
};

/**
 * localStorageからタブ別の統計を取得
 */
function loadSessionStats(mode: LearningMode): SessionStats {
  try {
    const key = `session-stats-${mode}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error(`[useSessionStats] ${mode} の読み込みエラー:`, error);
  }
  return { ...INITIAL_STATS };
}

/**
 * localStorageにタブ別の統計を保存
 */
function saveSessionStats(mode: LearningMode, stats: SessionStats): void {
  try {
    const key = `session-stats-${mode}`;
    localStorage.setItem(key, JSON.stringify(stats));
  } catch (error) {
    console.error(`[useSessionStats] ${mode} の保存エラー:`, error);
  }
}

/**
 * セッション統計を管理するフック（タブごとに独立）
 *
 * 正解・不正解・要復習・定着済みのカウントを追跡
 * 各タブ（暗記・和訳・スペル・文法）で独立した統計を保持
 */
export function useSessionStats(mode: LearningMode = 'translation') {
  const [sessionStats, setSessionStats] = useState<SessionStats>(() => loadSessionStats(mode));

  // 統計が更新されたらlocalStorageに保存
  useEffect(() => {
    saveSessionStats(mode, sessionStats);
  }, [mode, sessionStats]);

  /**
   * 統計をリセット
   */
  const resetStats = () => {
    const resetStats = { ...INITIAL_STATS };
    setSessionStats(resetStats);
    saveSessionStats(mode, resetStats);
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
