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
   * 次の3-5問の中で必ず再出題されるように配置
   */
  const reAddQuestion = useCallback((question: T, questions: T[], currentIndex: number): T[] => {
    const qid =
      (question as any).id ?? (question as any).word ?? String((question as any).japanese ?? '');
    const reAddedQuestion = {
      ...question,
      sessionPriority: Date.now(),
      reAddedCount: (question.reAddedCount || 0) + 1,
    } as T;

    // 直近ウィンドウ(次の5問)に同一IDがあれば重複再追加しない
    const windowEnd = Math.min(currentIndex + 6, questions.length);
    const upcoming = questions.slice(currentIndex + 1, windowEnd);
    const existsNearby = upcoming.some((q: any) => {
      const id = q?.id ?? q?.word ?? String(q?.japanese ?? '');
      return id === qid;
    });
    if (existsNearby) {
      return questions;
    }

    // 即座に再出題（次の1問後）：スキップ連打で高速消化を実現
    const offset = 1; // 常に次の問題として再出題
    const insertPosition = Math.min(currentIndex + 1 + offset, questions.length);

    // KPI: 再追加を記録（開発用）
    try {
      sessionKpi.onReAdd(String(qid));
    } catch {
      // KPI記録失敗は無視（開発用機能のため本番動作に影響なし）
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

  return {
    reAddQuestion,
    clearExpiredFlags,
    isReviewQuestion,
    updateRequeueStats,
  };
}
