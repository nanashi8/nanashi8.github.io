/**
 * useLearningEngine.ts
 *
 * 統一学習エンジン：全タブ共通の出題制御システム
 * 解答情報と進捗データから最適な出題順序を導き出す
 *
 * @author AI Assistant
 * @version 3.0
 * @since 2025-12-16
 */

import { useCallback } from 'react';
import { sortQuestionsByPriority } from '../utils/questionPrioritySorter';
import { useQuestionRequeue } from './useQuestionRequeue';

export interface LearningEngineConfig {
  mode: 'translation' | 'spelling' | 'grammar' | 'memorization';
  learningLimit: number | null;
  reviewLimit: number | null;
  isReviewFocusMode: boolean;
}

export interface AnswerResult {
  isCorrect: boolean;
  totalAnswered: number;
}

export interface LearningEngineResult<T> {
  /**
   * 解答後の問題リスト更新処理
   * @param questions 現在の問題リスト
   * @param currentQuestion 解答した問題
   * @param currentIndex 現在のインデックス
   * @param answer 解答結果
   * @returns 更新後の問題リスト
   */
  updateQuestionsAfterAnswer: (
    questions: T[],
    currentQuestion: T,
    currentIndex: number,
    answer: AnswerResult
  ) => T[];
}

/**
 * 統一学習エンジンフック
 *
 * 全タブで共通の学習最適化アルゴリズムを提供
 * - 不正解問題の即座再追加（次の3-5問内）
 * - 定期的な優先度再ソート（3問ごと）
 * - 単一のアトミックな状態更新
 */
export function useLearningEngine<T extends { [key: string]: any }>(
  config: LearningEngineConfig
): LearningEngineResult<T> {
  const { reAddQuestion } = useQuestionRequeue<T>();

  /**
   * 解答後の問題リスト更新
   *
   * 処理フロー：
   * 1. 不正解なら問題を再追加（次の3-5問内）
   * 2. 定期的に残りの問題を優先度ソート（3問ごと）
   * 3. 単一の状態更新で完結（競合なし）
   */
  const updateQuestionsAfterAnswer = useCallback(
    (questions: T[], currentQuestion: T, currentIndex: number, answer: AnswerResult): T[] => {
      const { isCorrect, totalAnswered } = answer;

      // 正解の場合は何もしない
      if (isCorrect) {
        return questions;
      }

      // ステップ1: 不正解問題を再追加（次の3-5問内）
      const questionsWithReAdd = reAddQuestion(currentQuestion, questions, currentIndex, config.mode, {
        outcome: 'incorrect',
      });

      // ステップ2: 定期的な優先度ソート（3問ごと）
      // 復翕モード時は毎回ソートして復習問題を最優先（スキップ連打対応）
      // 上限の80%を超えた場合も毎回ソート
      const resortInterval = config.isReviewFocusMode ? 1 : 3;
      const shouldResort = totalAnswered % resortInterval === 0;

      if (!shouldResort) {
        return questionsWithReAdd;
      }

      // 残りの問題を再ソート
      const remainingQuestions = questionsWithReAdd.slice(currentIndex + 1);

      if (remainingQuestions.length <= 1) {
        return questionsWithReAdd;
      }

      // 復習モード時はisReviewFocusMode=trueで復習問題に高優先度を付与
      const resorted = sortQuestionsByPriority(remainingQuestions as any[], {
        isReviewFocusMode: config.isReviewFocusMode,
        learningLimit: config.learningLimit,
        reviewLimit: config.reviewLimit,
        mode: config.mode,
      }) as unknown as T[];

      return [...questionsWithReAdd.slice(0, currentIndex + 1), ...resorted];
    },
    [config, reAddQuestion]
  );

  return {
    updateQuestionsAfterAnswer,
  };
}
