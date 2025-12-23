/**
 * useQuestionRequeue.ts
 *
 * 問題の再出題管理フック
 * 不正解・「まだまだ」の問題を即座に次の数問内で再出題する
 *
 * @author AI Assistant
 * @version 2.0
 * @since 2025-12-16
 */

import { useCallback } from 'react';
import { sessionKpi } from '../metrics/sessionKpi';

export interface RequeuableQuestion {
  sessionPriority?: number;
  reAddedCount?: number;
  [key: string]: any;
}

// 統計型は呼び出し側の型パラメータに任せる
interface UseQuestionRequeueResult<T extends RequeuableQuestion, TStats = any> {
  // 再追加処理
  reAddQuestion: (question: T, questions: T[], currentIndex: number) => T[];

  // フラグクリア処理
  clearExpiredFlags: (questions: T[], currentIndex: number) => T[];

  // 新規/復習判定
  isReviewQuestion: (question: T) => boolean;

  // 統計更新（ジェネリック型）
  updateRequeueStats: (
    question: T,
    currentStats: TStats,
    setter: (updater: (prev: TStats) => TStats) => void
  ) => void;

  // 🆕 デバッグ用: 再出題予定のリストを取得
  getRequeuedWords: (questions: T[], currentIndex: number) => Array<{
    word: string;
    reason: 'incorrect' | 'still_learning';
    insertAt: number;
    timestamp: number;
  }>;
}

/**
 * 問題の再出題管理フック
 */
export function useQuestionRequeue<
  T extends RequeuableQuestion,
  TStats = any,
>(): UseQuestionRequeueResult<T, TStats> {
  /**
   * 問題を再追加（最優先キューに追加）
   * 🔒 分からない: 1-2問後に積極的に再出題
   * 🟡 まだまだ: 3-5問後に再出題
   */
  const reAddQuestion = useCallback((question: T, questions: T[], currentIndex: number): T[] => {
    // nullガード
    if (!questions || !Array.isArray(questions)) {
      console.warn('[useQuestionRequeue] questions is null or not an array');
      return [];
    }

    const qid =
      (question as any).id ?? (question as any).word ?? String((question as any).japanese ?? '');
    const reAddedQuestion = {
      ...question,
      sessionPriority: Date.now(),
      reAddedCount: (question.reAddedCount || 0) + 1,
    } as T;

    // 直近ウィンドウ(次の10問)に同一IDがあれば重複再追加しない
    const windowSize = 10; // 振動防止のため10問に拡大
    const windowEnd = Math.min(currentIndex + windowSize + 1, questions.length);
    const upcoming = questions.slice(currentIndex + 1, windowEnd);
    const existsNearby = upcoming.some((q: any) => {
      const id = q?.id ?? q?.word ?? String(q?.japanese ?? '');
      return id === qid;
    });
    if (existsNearby) {
      if (import.meta.env.DEV) {
        console.log('🔄 [useQuestionRequeue] 重複スキップ: 既に次の10問以内に存在', {
          word: String(qid),
          currentIndex,
          windowEnd,
        });
      }
      return questions;
    }

    // 🔒 強制装置: 再出題位置を決定
    // incorrectの判定は難しいため、reAddedCountで判定
    // 初回再出題(count=0): 3-5問後
    // 2回目以降(count>=1): 1-2問後（積極的に再出題）
    const isUrgent = (question.reAddedCount || 0) >= 1;
    const offset = isUrgent
      ? 1 + Math.floor(Math.random() * 2) // 1 or 2 (分からない)
      : 3 + Math.floor(Math.random() * 3); // 3, 4, or 5 (まだまだ)
    const insertPosition = Math.min(currentIndex + offset, questions.length);

    // KPI: 再追加を記録（開発用）
    try {
      sessionKpi.onReAdd(String(qid));
    } catch {
      // KPI記録失敗は無視（開発用機能のため本番動作に影響なし）
    }

    if (import.meta.env.DEV && isUrgent) {
      console.log('🔴 [強制装置] 分からない問題を1-2問後に再出題:', String(qid));
    }

    return [
      ...questions.slice(0, insertPosition),
      reAddedQuestion,
      ...questions.slice(insertPosition),
    ];
  }, []);

  /**
   * 期限切れのsessionPriorityフラグをクリア
   * 5問経過した問題からフラグを削除
   */
  const clearExpiredFlags = useCallback((questions: T[], currentIndex: number): T[] => {
    if (currentIndex >= questions.length - 1) return questions;

    return questions.map((q, idx) => {
      // 現在位置より5問以上先の問題からフラグをクリア
      if (q.sessionPriority && idx > currentIndex && idx - currentIndex > 5) {
        const { sessionPriority: _sessionPriority, ...rest } = q;
        return rest as T;
      }
      return q;
    });
  }, []);

  /**
   * 問題が復習問題かどうかを判定
   */
  const isReviewQuestion = useCallback((question: T): boolean => {
    return (question.reAddedCount || 0) > 0;
  }, []);

  /**
   * 再出題統計を更新
   */
  const updateRequeueStats = useCallback(
    (question: T, currentStats: TStats, setter: (updater: (prev: TStats) => TStats) => void) => {
      const isReview = (question.reAddedCount || 0) > 0;

      setter((prev: any) => ({
        ...prev,
        newQuestions: isReview ? prev.newQuestions : (prev.newQuestions || 0) + 1,
        reviewQuestions: isReview ? (prev.reviewQuestions || 0) + 1 : prev.reviewQuestions || 0,
        consecutiveNew: isReview ? 0 : (prev.consecutiveNew || 0) + 1,
        consecutiveReview: isReview ? (prev.consecutiveReview || 0) + 1 : 0,
      }));
    },
    []
  );

  /**
   * 🆕 デバッグ用: 再出題予定のリストを取得
   * sessionPriorityが設定されている問題 = 再出題された問題
   */
  const getRequeuedWords = useCallback(
    (
      questions: T[],
      currentIndex: number
    ): Array<{
      word: string;
      reason: 'incorrect' | 'still_learning';
      insertAt: number;
      timestamp: number;
    }> => {
      const requeued: Array<{
        word: string;
        reason: 'incorrect' | 'still_learning';
        insertAt: number;
        timestamp: number;
      }> = [];

      questions.forEach((q, idx) => {
        if (idx > currentIndex && q.sessionPriority) {
          const word = String((q as any).word || (q as any).japanese || '(unknown)');

          // reasonの判定（簡易的にreAddedCountで判定）
          // 本来はWordProgressを見るべきだが、デバッグ用のため簡易実装
          const reason: 'incorrect' | 'still_learning' = 'still_learning';

          requeued.push({
            word,
            reason,
            insertAt: idx + 1, // 1-indexed
            timestamp: q.sessionPriority,
          });
        }
      });

      return requeued;
    },
    []
  );

  return {
    reAddQuestion,
    clearExpiredFlags,
    isReviewQuestion,
    updateRequeueStats,
    getRequeuedWords,
  };
}
