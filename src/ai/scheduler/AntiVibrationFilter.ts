/**
 * AntiVibrationFilter - 振動防止フィルター
 *
 * 最近正解した問題の即座再出題を防止し、ユーザーの飽きを防ぐ
 *
 * 【防止戦略】
 * 1. 短時間内再出題ペナルティ: 1分以内に正解した問題は大幅に後回し
 * 2. 連続正解頻度低減: 3回以上連続正解した問題の出題頻度を下げる
 * 3. sessionPriority除外: セッション内で再追加された問題の特別扱い
 */

import type { PrioritizedQuestion, FilterOptions, RecentAnswer } from './types';
import { logger } from '@/utils/logger';

export class AntiVibrationFilter {
  /**
   * 振動防止フィルターを適用
   *
   * @param questions 優先度付き問題リスト
   * @param options フィルターオプション
   * @returns フィルター適用後の問題リスト
   */
  filter(questions: PrioritizedQuestion[], options: FilterOptions): PrioritizedQuestion[] {
    if (questions.length === 0) return questions;

    const now = Date.now();
    let appliedCount = 0;

    const filtered = questions.map(pq => {
      const recentAnswer = this.findRecentAnswer(pq.question.word, options.recentAnswers);

      if (!recentAnswer) {
        return pq;
      }

      const timeSinceAnswer = now - recentAnswer.timestamp;
      let penaltyApplied = false;
      let newPriority = pq.priority;

      // 戦略1: 短時間内の再出題ペナルティ
      if (timeSinceAnswer < options.minInterval && recentAnswer.correct) {
        // 1分以内に正解した問題は大幅に後回し（優先度+5.0）
        newPriority += 5.0;
        penaltyApplied = true;

        logger.debug(`[AntiVibration] 短時間再出題ペナルティ: ${pq.question.word}`, {
          timeSinceAnswer: Math.round(timeSinceAnswer / 1000) + 's',
          penalty: 5.0,
        });
      } else if (timeSinceAnswer < options.minInterval * 5 && recentAnswer.correct) {
        // 5分以内に正解した問題は中程度に後回し（優先度+2.0）
        newPriority += 2.0;
        penaltyApplied = true;

        logger.debug(`[AntiVibration] 中時間再出題ペナルティ: ${pq.question.word}`, {
          timeSinceAnswer: Math.round(timeSinceAnswer / 1000) + 's',
          penalty: 2.0,
        });
      }

      // 戦略2: 連続正解の頻度低減
      if (recentAnswer.consecutiveCorrect >= options.consecutiveThreshold) {
        // 3回以上連続正解した問題は頻度を下げる（優先度+2.0）
        newPriority += 2.0;
        penaltyApplied = true;

        logger.debug(`[AntiVibration] 連続正解頻度低減: ${pq.question.word}`, {
          consecutiveCorrect: recentAnswer.consecutiveCorrect,
          penalty: 2.0,
        });
      }

      if (penaltyApplied) {
        appliedCount++;
        return {
          ...pq,
          priority: newPriority,
          antiVibrationApplied: true,
        };
      }

      return pq;
    });

    if (appliedCount > 0) {
      logger.info(`[AntiVibration] フィルター適用: ${appliedCount}問に振動防止ペナルティ`);
    }

    return filtered;
  }

  /**
   * 最近の解答履歴から該当する語句を検索
   *
   * @param word 語句
   * @param recentAnswers 最近の解答履歴
   * @returns 該当する解答履歴（なければnull）
   */
  private findRecentAnswer(word: string, recentAnswers: RecentAnswer[]): RecentAnswer | null {
    return recentAnswers.find(a => a.word === word) || null;
  }

  /**
   * 振動スコアを計算（0-100）
   *
   * スコアが高いほど振動リスクが高い:
   * - 0-20: 正常（振動なし）
   * - 21-50: 注意（軽度の振動傾向）
   * - 51-100: 危険（振動発生中）
   *
   * @param questions ソート済み問題リスト
   * @param recentAnswers 最近の解答履歴
   * @param topN 上位N問を検査（デフォルト20）
   * @returns 振動スコア
   */
  calculateVibrationScore(
    questions: PrioritizedQuestion[],
    recentAnswers: RecentAnswer[],
    topN: number = 20
  ): number {
    if (questions.length === 0) return 0;

    const now = Date.now();
    let score = 0;

    const topQuestions = questions.slice(0, Math.min(topN, questions.length));

    topQuestions.forEach(pq => {
      const recentAnswer = this.findRecentAnswer(pq.question.word, recentAnswers);
      if (!recentAnswer) return;

      const timeSinceAnswer = now - recentAnswer.timestamp;

      if (timeSinceAnswer < 60000) {
        // 1分以内: 高リスク（+10点）
        score += 10;
      } else if (timeSinceAnswer < 300000) {
        // 5分以内: 中リスク（+5点）
        score += 5;
      } else if (timeSinceAnswer < 600000) {
        // 10分以内: 低リスク（+2点）
        score += 2;
      }

      // 連続正解による加算
      if (recentAnswer.consecutiveCorrect >= 3) {
        score += 5;
      }
    });

    const finalScore = Math.min(score, 100);

    if (finalScore > 50) {
      logger.warn(`[AntiVibration] 高い振動スコア検出: ${finalScore}`, {
        topQuestions: topQuestions.slice(0, 5).map(pq => pq.question.word),
      });
    }

    return finalScore;
  }

  /**
   * sessionPriorityを持つ問題を抽出（再追加問題）
   *
   * @param questions 問題リスト
   * @returns sessionPriorityを持つ問題
   */
  extractSessionPriorityQuestions(questions: PrioritizedQuestion[]): PrioritizedQuestion[] {
    return questions.filter(pq => pq.question.sessionPriority !== undefined);
  }

  /**
   * sessionPriorityを持たない問題を抽出（通常問題）
   *
   * @param questions 問題リスト
   * @returns sessionPriorityを持たない問題
   */
  extractNormalQuestions(questions: PrioritizedQuestion[]): PrioritizedQuestion[] {
    return questions.filter(pq => pq.question.sessionPriority === undefined);
  }
}
