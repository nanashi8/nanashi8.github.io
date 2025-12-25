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
import { loadProgressSync } from '@/storage/progress/progressStorage';
import { determineWordPosition } from '@/ai/utils/categoryDetermination';

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

  // 🎯 Position不整合検出（再スケジューリングトリガー）
  checkPositionMismatch: (
    questions: T[],
    mode: 'memorization' | 'translation' | 'spelling' | 'grammar'
  ) => {
    needsRescheduling: boolean;
    mismatchCount: number;
    totalDiff: number;
    reason: string;
  };
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
   * 🧘 連続で分からないが続く場合: 出題間隔を少しずつ延ばして疲労を防ぐ
   * 🎯 Position-aware: 新たに高Positionになった単語は他の高Position単語の近くに配置
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

    const currentReaddCount = question.reAddedCount || 0;

    // 可能ならPositionから「分からない/まだまだ」を推定（なければ still_learning 相当として扱う）
    const questionPosition = (question as any).position;
    const isIncorrectLike = questionPosition !== undefined && questionPosition >= 70;

    // 🔒 強制装置: 再出題位置を決定
    // 初回は比較的早めに再出題するが、連続で「分からない」が続くほど間隔を少しずつ延ばす
    const baseOffset = isIncorrectLike
      ? 1 + Math.floor(Math.random() * 2) // 1 or 2 (分からない)
      : 3 + Math.floor(Math.random() * 3); // 3, 4, or 5 (まだまだ)

    // 連続不正解が続くほど間隔を延長（上限あり）
    const extraDelay = isIncorrectLike
      ? Math.min(currentReaddCount * 3, 18)
      : Math.min(currentReaddCount * 2, 12);

    const plannedOffset = baseOffset + extraDelay;

    // 直近ウィンドウに同一IDがあれば重複再追加しない（実際の挿入予定位置に合わせて探索範囲も拡張）
    const windowSize = Math.min(30, Math.max(10, plannedOffset + 5));
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

    let insertPosition = Math.min(currentIndex + plannedOffset, questions.length);

    // 🎯 Position-aware insertion: 既存の高Position単語群に割り込み配置
    // キュー後半に高Position単語が埋もれている場合、それらの近くに配置
    if (questionPosition !== undefined && questionPosition >= 40) {
      // 挿入位置から前方30問をスキャン（軽量なO(30)操作）
      const scanStart = Math.max(insertPosition, currentIndex + 1);
      const scanEnd = Math.min(scanStart + 30, questions.length);

      // Position 40以上の単語を探す
      let lastHighPositionIdx = -1;
      for (let i = scanStart; i < scanEnd; i++) {
        const pos = (questions[i] as any).position;
        if (pos !== undefined && pos >= 40) {
          lastHighPositionIdx = i;
        }
      }

      // 高Position単語が見つかった場合、その直後に配置
      if (lastHighPositionIdx >= 0) {
        const originalPosition = insertPosition;
        insertPosition = lastHighPositionIdx + 1;

        // 📊 Position-aware挿入ログをlocalStorageに記録
        try {
          const log = {
            timestamp: new Date().toISOString(),
            word: String(qid),
            position: questionPosition,
            baseOffset,
            extraDelay,
            originalInsert: originalPosition,
            adjustedInsert: insertPosition,
            currentIndex,
            nearbyHighPositions: questions
              .slice(scanStart, scanEnd)
              .filter((q) => {
                const pos = (q as any).position;
                return pos !== undefined && pos >= 40;
              })
              .map((q) => ({
                word: (q as any).word || (q as any).id,
                position: (q as any).position,
              })),
          };

          const stored = localStorage.getItem('debug_position_aware_insertions');
          const logs = stored ? JSON.parse(stored) : [];
          logs.push(log);
          // 最新30件のみ保持
          if (logs.length > 30) logs.shift();
          localStorage.setItem('debug_position_aware_insertions', JSON.stringify(logs));
        } catch {
          // localStorage失敗は無視
        }

        if (import.meta.env.DEV) {
          console.log('🎯 [Position-aware] 高Position単語群に割り込み配置', {
            word: String(qid),
            position: questionPosition,
            originalInsert: originalPosition,
            adjustedInsert: insertPosition,
          });
        }
      }
    }

    // KPI: 再追加を記録（開発用）
    try {
      sessionKpi.onReAdd(String(qid));
    } catch {
      // KPI記録失敗は無視（開発用機能のため本番動作に影響なし）
    }

    if (import.meta.env.DEV && isIncorrectLike) {
      console.log('🔴 [強制装置] 分からない問題を再出題（ただし繰り返し不正解ほど間隔延長）:', {
        word: String(qid),
        baseOffset,
        extraDelay,
        plannedOffset,
      });
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

  /**
   * 🎯 Position不整合検出（再スケジューリングトリガー）
   *
   * questions配列のPositionとLocalStorageの実際のPositionを比較し、
   * 再スケジューリングが必要かを判定します。
   *
   * トリガー条件：
   * - 不整合語数が10語以上 AND 差分合計が200以上
   *
   * @param questions 現在のキュー
   * @param mode 学習モード（暗記/和訳）
   * @returns 再スケジューリング判定結果
   */
  const checkPositionMismatch = useCallback(
    (
      questions: T[],
        mode: 'memorization' | 'translation' | 'spelling' | 'grammar'
    ): {
      needsRescheduling: boolean;
      mismatchCount: number;
      totalDiff: number;
      reason: string;
    } => {
      try {
        const progress = loadProgressSync();
        if (!progress?.wordProgress) {
          return {
            needsRescheduling: false,
            mismatchCount: 0,
            totalDiff: 0,
            reason: 'LocalStorage未初期化',
          };
        }

        let mismatchCount = 0;
        let totalDiff = 0;

        // questions配列の各単語のPositionをチェック
        for (const q of questions) {
          const word = (q as any).word;
          if (!word) continue;

          // positionが付与されていない（または不正）場合は比較不能なのでスキップ
          const rawPosition = (q as any).position;
          const originalPosition = Number.isFinite(rawPosition) ? Number(rawPosition) : null;
          if (originalPosition === null) continue;
          const wp = progress.wordProgress[word];

          if (!wp) continue;

          // LocalStorageから実際のPositionを計算
          const realPosition = determineWordPosition(wp, mode);
          const diff = Math.abs(realPosition - originalPosition);

          if (diff >= 5) {
            mismatchCount++;
            totalDiff += diff;
          }
        }

        // トリガー条件判定
        const needsRescheduling = mismatchCount >= 10 && totalDiff >= 200;

        return {
          needsRescheduling,
          mismatchCount,
          totalDiff,
          reason: needsRescheduling
            ? `不整合${mismatchCount}語（差分合計: ${totalDiff}）`
            : '正常範囲内',
        };
      } catch (error) {
        console.error('[useQuestionRequeue] Position不整合チェックエラー:', error);
        return {
          needsRescheduling: false,
          mismatchCount: 0,
          totalDiff: 0,
          reason: 'チェック失敗',
        };
      }
    },
    []
  );

  return {
    reAddQuestion,
    clearExpiredFlags,
    isReviewQuestion,
    updateRequeueStats,
    getRequeuedWords,
    checkPositionMismatch,
  };
}
