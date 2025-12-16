/**
 * 問題選択戦略を使用するカスタムフック
 * 各コンポーネントで戦略パターンを簡単に使用できるようにする
 */

import { useMemo, useCallback, useEffect, useState } from 'react';
import { Question } from '../types';
import {
  QuestionSelectionStrategy,
  SessionStats,
  LearningLimits,
} from '../strategies/QuestionSelectionStrategy';
import { logger } from '@/utils/logger';

/**
 * 問題選択戦略フックの戻り値
 */
export interface UseQuestionStrategyResult<T = Question> {
  /** ソート済み問題リスト */
  sortedQuestions: T[];
  /** 復習モードに入るべきか */
  shouldReview: boolean;
  /** 効果的な上限（段階的に調整された値） */
  effectiveLimits: {
    learning: number;
    review: number;
  };
  /** 問題リストを手動で再ソート */
  resortQuestions: () => void;
}

/**
 * 問題選択戦略を使用するカスタムフック
 * 
 * @param questions 問題リスト
 * @param strategy 使用する戦略
 * @param limits 学習上限設定
 * @param stats セッション統計（オプション）
 * @returns ソート済み問題リストと関連情報
 * 
 * @example
 * const strategy = new MemorizationStrategy();
 * const { sortedQuestions, shouldReview, effectiveLimits } = useQuestionStrategy(
 *   allQuestions,
 *   strategy,
 *   { learningLimit: 30, reviewLimit: 10 },
 *   sessionStats
 * );
 */
export function useQuestionStrategy<T = Question>(
  questions: T[],
  strategy: QuestionSelectionStrategy<T>,
  limits: LearningLimits,
  stats?: SessionStats
): UseQuestionStrategyResult<T> {
  // ソート済み問題リスト（メモ化）
  const sortedQuestions = useMemo(() => {
    if (questions.length === 0) return [];

    try {
      return strategy.sortQuestions(questions, limits, stats);
    } catch (error) {
      logger.error('問題のソート中にエラーが発生しました:', error);
      return questions; // エラー時は元のリストを返す
    }
  }, [questions, strategy, limits, stats]);

  // 復習モードに入るべきかを判定（メモ化）
  const shouldReview = useMemo(() => {
    if (!stats) return false;

    try {
      return strategy.shouldEnterReviewMode(stats, limits);
    } catch (error) {
      logger.error('復習モード判定中にエラーが発生しました:', error);
      return false;
    }
  }, [stats, strategy, limits]);

  // 効果的な上限を計算（メモ化）
  const effectiveLimits = useMemo(() => {
    if (!stats) {
      return {
        learning: limits.learningLimit,
        review: limits.reviewLimit,
      };
    }

    try {
      return {
        learning: strategy.calculateEffectiveLimit(
          limits.learningLimit,
          stats.still_learning
        ),
        review: strategy.calculateEffectiveLimit(
          limits.reviewLimit,
          stats.incorrect
        ),
      };
    } catch (error) {
      logger.error('効果的な上限の計算中にエラーが発生しました:', error);
      return {
        learning: limits.learningLimit,
        review: limits.reviewLimit,
      };
    }
  }, [stats, strategy, limits]);

  // 手動で再ソートする関数（useCallbackでメモ化）
  const resortQuestions = useCallback(() => {
    // 強制的に再計算を促すため、空の処理
    // 実際の再ソートはuseMemoの依存配列変更で自動的に行われる
    logger.debug('問題リストの再ソートを要求しました');
  }, []);

  return {
    sortedQuestions,
    shouldReview,
    effectiveLimits,
    resortQuestions,
  };
}

/**
 * 上限設定変更時に問題リストを再ソートするエフェクトフック
 * 
 * @param questions 問題リスト
 * @param currentIndex 現在の問題インデックス
 * @param limits 学習上限設定
 * @param strategy 使用する戦略
 * @param onQuestionsUpdate 問題リスト更新時のコールバック
 * @param stats セッション統計（オプション）
 * 
 * @example
 * useQuestionResort(
 *   questions,
 *   currentIndex,
 *   { learningLimit, reviewLimit },
 *   strategy,
 *   setQuestions,
 *   sessionStats
 * );
 */
export function useQuestionResort<T = Question>(
  questions: T[],
  currentIndex: number,
  limits: LearningLimits,
  strategy: QuestionSelectionStrategy<T>,
  onQuestionsUpdate: (questions: T[]) => void,
  stats?: SessionStats
): void {
  useEffect(() => {
    if (questions.length === 0 || currentIndex >= questions.length) {
      return;
    }

    try {
      // 現在の問題以降を取得
      const currentAndAfter = questions.slice(currentIndex);
      const beforeCurrent = questions.slice(0, currentIndex);

      // 現在以降の問題を再ソート
      const resorted = strategy.sortQuestions(currentAndAfter, limits, stats);

      // 既に出題した問題と再ソート後の問題を結合
      const updatedQuestions = [...beforeCurrent, ...resorted];

      onQuestionsUpdate(updatedQuestions);
    } catch (error) {
      logger.error('問題リストの再ソート中にエラーが発生しました:', error);
    }
  }, [limits.learningLimit, limits.reviewLimit]);
}

/**
 * セッション統計を計算するヘルパーフック
 * 
 * @param questions 問題リスト
 * @param getWordFromQuestion 問題から単語を取得する関数
 * @param mode 学習モード
 * @returns セッション統計
 * 
 * @example
 * const sessionStats = useSessionStats(
 *   questions,
 *   (q) => q.word,
 *   'memorization'
 * );
 */
export function useSessionStats<T = Question>(
  questions: T[],
  getWordFromQuestion: (question: T) => string,
  mode: 'memorization' | 'translation' | 'spelling' | 'grammar'
): SessionStats {
  const [stats, setStats] = useState<SessionStats>({
    mastered: 0,
    still_learning: 0,
    incorrect: 0,
    new: 0,
  });

  useEffect(() => {
    import('../strategies/learningUtils').then(({ getQuestionStatus }) => {
      const counts = {
        mastered: 0,
        still_learning: 0,
        incorrect: 0,
        new: 0,
      };

      questions.forEach((question) => {
        const word = getWordFromQuestion(question);
        const status = getQuestionStatus(word, mode);

        if (status) {
          counts[status.category] += 1;
        } else {
          counts.new += 1;
        }
      });

      setStats(counts);
    });
  }, [questions, getWordFromQuestion, mode]);

  return stats;
}
