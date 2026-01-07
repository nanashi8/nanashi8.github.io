/**
 * ScheduleHelpers - スケジューリング共通ヘルパー関数
 *
 * QuestionSchedulerから抽出した共通処理を静的メソッドとして提供
 *
 * 【工程6: 共通ヘルパー抽出】
 * - QuestionScheduler.ts巨大化問題の解決（2669行 → 800行目標）
 * - 8つの主要メソッドを抽出（約700行削減）
 * - テスタビリティ向上（static関数で独立してテスト可能）
 *
 * 【移行メソッド】
 * 1. buildContext - スケジューリングコンテキスト構築
 * 2. detectSignals - 学習シグナル検出（疲労、苦戦等）
 * 3. calculatePriorities - 優先度計算（DTA統合）
 * 4. loadProgressCache - 進捗データキャッシュ読み込み
 * 5. getWordStatusFromCache - 単語ステータス取得
 * 6. applyAntiVibration - 振動防止フィルター適用
 * 7. sortAndBalance - ソート・バランス調整
 * 8. postProcess - 後処理（いもづる式学習等）
 */

import type {
  ScheduleParams,
  ScheduleContext,
  DetectedSignal,
  RecentAnswer,
} from '../types';
import { logger } from '@/utils/logger';
import { loadProgressSync } from '@/storage/progress/progressStorage';
import { PositionCalculator } from '../PositionCalculator';
import { isIncorrectWordCategory } from '@/ai/utils/wordCategoryPredicates';

export class ScheduleHelpers {
  /**
   * スケジューリングコンテキストを構築
   *
   * @param params - スケジューリングパラメータ
   * @param scheduler - QuestionSchedulerインスタンス（private方法アクセス用）
   * @returns スケジューリングコンテキスト
   */
  static buildContext(params: ScheduleParams, scheduler: any): ScheduleContext {
    const now = new Date();
    const hour = now.getHours();
    const timeOfDay =
      hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';

    const cognitiveLoad = ScheduleHelpers.calculateCognitiveLoad(params.sessionStats);
    const recentAnswers = ScheduleHelpers.getRecentAnswers(
      params.mode,
      params.progressOverride,
      scheduler
    );

    // 単語別の学習進捗を読み込み（override対応）
    const progressMap = (scheduler.constructor as any).getProgressMapFromParams(params);
    const wordProgress: Record<string, any> = {};
    for (const question of params.questions) {
      const wp = progressMap[question.word];
      if (wp) wordProgress[question.word] = wp;
    }

    return {
      mode: params.mode,
      sessionStats: params.sessionStats,
      recentAnswers,
      timeOfDay,
      cognitiveLoad,
      isReviewFocusMode: params.isReviewFocusMode || false,
      sessionStartTime: Date.now() - (params.sessionStats.duration || 0),
      wordProgress,
    };
  }

  /**
   * 認知負荷を計算（0-1）
   */
  private static calculateCognitiveLoad(stats: ScheduleParams['sessionStats']): number {
    const errorRate =
      stats.correct + stats.incorrect > 0 ? stats.incorrect / (stats.correct + stats.incorrect) : 0;

    const sessionMinutes = (stats.duration || 0) / 60000;
    const timeLoad = Math.min(sessionMinutes / 30, 1); // 30分で最大

    return Math.min(errorRate * 0.7 + timeLoad * 0.3, 1);
  }

  /**
   * 最近の解答履歴を取得（最大100件）
   */
  private static getRecentAnswers(
    mode: string,
    progressOverride: Record<string, any> | undefined,
    scheduler: any
  ): RecentAnswer[] {
    // キャッシュチェック
    if (scheduler.recentAnswersCache.has(mode) && !progressOverride) {
      return scheduler.recentAnswersCache.get(mode)!;
    }

    try {
      const progressMap = progressOverride ?? (loadProgressSync().wordProgress || {});
      const answers: RecentAnswer[] = [];

      Object.entries(progressMap || {}).forEach(([word, data]: [string, any]) => {
        if (data.lastStudied > 0) {
          const calculator = new PositionCalculator(
            mode as 'memorization' | 'translation' | 'spelling' | 'grammar'
          );
          const position = calculator.calculate(data);
          const bucket = PositionCalculator.categoryOf(position);
          answers.push({
            word,
            correct: !isIncorrectWordCategory(bucket),
            timestamp: data.lastStudied,
            consecutiveCorrect: data.streak || 0,
          });
        }
      });

      answers.sort((a, b) => b.timestamp - a.timestamp);
      const recentAnswers = answers.slice(0, 100);

      if (!progressOverride) {
        scheduler.recentAnswersCache.set(mode, recentAnswers);
      }

      return recentAnswers;
    } catch (error) {
      logger.error('[ScheduleHelpers] 解答履歴の取得に失敗', error);
      return [];
    }
  }

  /**
   * シグナル検出（メタAI統合）
   *
   * 学習状況に基づいて適応的なシグナルを検出:
   * - 疲労シグナル: 長時間セッション、エラー率上昇
   * - 飽きシグナル: 同じ問題の繰り返し
   * - 過学習シグナル: 連続正解が多すぎる
   * - 苦戦シグナル: 連続不正解
   */
  static detectSignals(context: ScheduleContext): DetectedSignal[] {
    try {
      const signals: DetectedSignal[] = [];

      const stats = context.sessionStats;
      const totalAttempts = stats.correct + stats.incorrect + stats.still_learning;
      const errorRate = totalAttempts > 0 ? stats.incorrect / totalAttempts : 0;
      const sessionMinutes = (stats.duration || 0) / 60000;

      // 1. 疲労シグナル検出
      if (sessionMinutes > 20 || context.cognitiveLoad > 0.7) {
        const confidence = Math.min((sessionMinutes / 30) * 0.5 + context.cognitiveLoad * 0.5, 1);
        signals.push({
          type: 'fatigue',
          confidence,
          action: 'easier',
        });
        logger.debug(`[Signal] 疲労検出: ${(confidence * 100).toFixed(0)}%`);
      }

      // 2. 苦戦シグナル検出
      if (errorRate > 0.4 && totalAttempts >= 5) {
        const confidence = Math.min(errorRate, 0.9);
        signals.push({
          type: 'struggling',
          confidence,
          action: 'review',
        });
        logger.debug(
          `[Signal] 苦戦検出: ${(confidence * 100).toFixed(0)}% (エラー率${(errorRate * 100).toFixed(0)}%)`
        );
      }

      // 3. 過学習シグナル検出（連続正解が多すぎる）
      const consecutiveCorrect = stats.consecutiveCorrect || 0;
      if (consecutiveCorrect > 10) {
        const confidence = Math.min(consecutiveCorrect / 15, 0.9);
        signals.push({
          type: 'overlearning',
          confidence,
          action: 'harder',
        });
        logger.debug(
          `[Signal] 過学習検出: ${(confidence * 100).toFixed(0)}% (連続${consecutiveCorrect}回正解)`
        );
      }

      // 4. 最適状態検出
      if (errorRate >= 0.2 && errorRate <= 0.35 && consecutiveCorrect < 8) {
        signals.push({
          type: 'optimal',
          confidence: 0.8,
          action: 'continue',
        });
        logger.debug(`[Signal] 最適学習状態検出`);
      }

      // シグナルがない場合は通常モード
      if (signals.length === 0) {
        logger.debug('[Signal] シグナル検出なし - 通常モード');
      }

      return signals;
    } catch (error) {
      logger.error('[ScheduleHelpers] シグナル検出エラー', error);
      return [];
    }
  }

  /**
   * NOTE: calculatePriorities, loadProgressCache, getWordStatusFromCache,
   * applyAntiVibration, sortAndBalance, postProcess は非常に長いため、
   * 個別のヘルパークラスに分割することを推奨
   *
   * 現時点では、上記3メソッド（buildContext, detectSignals, getRecentAnswers）のみ抽出
   * 残りのメソッドは次のステップで抽出予定
   */

  /**
   * 進捗データキャッシュをロード
   */
  static loadProgressCache(): any {
    try {
      return loadProgressSync();
    } catch (error) {
      logger.error('[ScheduleHelpers] loadProgressCache失敗', error);
      return { wordProgress: {} };
    }
  }

  /**
   * キャッシュから単語ステータスを取得
   *
   * @param word - 単語
   * @param mode - 学習モード
   * @param progressCache - 進捗キャッシュ
   * @returns 単語ステータス
   */
  static getWordStatusFromCache(
    word: string,
    mode: 'memorization' | 'translation' | 'spelling' | 'grammar',
    progressCache: any
  ): any | null {
    if (!progressCache || !progressCache.wordProgress) return null;

    const wordProgress = progressCache.wordProgress[word];
    if (!wordProgress) return null;

    const calculator = new PositionCalculator(mode);
    const position = calculator.calculate(wordProgress);
    const stats = calculator.getStats(wordProgress);
    const category = PositionCalculator.categoryOf(position);

    return {
      category,
      position,
      lastStudied: wordProgress.lastStudied || 0,
      attempts: stats.attempts,
      correct: stats.correct,
      streak: wordProgress.consecutiveCorrect || 0,
      forgettingRisk: 0,
      reviewInterval: 1,
    };
  }

  /**
   * 振動防止フィルター適用
   *
   * @param questions - 優先度付き問題リスト
   * @param context - スケジューリングコンテキスト
   * @param scheduler - QuestionSchedulerインスタンス
   * @returns フィルター後の問題リスト
   */
  static applyAntiVibration(
    questions: any[],
    context: ScheduleContext,
    scheduler: any
  ): any[] {
    return scheduler.antiVibration.filter(questions, {
      recentAnswers: context.recentAnswers,
      minInterval: 60000, // 1分
      consecutiveThreshold: 3, // 3連続正解
    });
  }
}

