/**
 * QuestionScheduler - 統一問題スケジューラー
 *
 * 全タブ（暗記・和訳・スペル・文法）共通の出題順序決定ロジック
 *
 * 【主要機能】
 * 1. DTA (Time-Dependent Adjustment): 忘却曲線に基づく優先度調整
 * 2. 振動防止: 最近正解した問題の即座再出題を防止
 * 3. メタAIシグナル統合: 疲労・飽き・過学習を検出して出題調整
 * 4. 優先度計算: category + DTA + signals + timeBoost
 *
 * 【使用例】
 * ```typescript
 * const scheduler = new QuestionScheduler();
 * const result = scheduler.schedule({
 *   questions: filtered,
 *   mode: 'memorization',
 *   limits: { learningLimit: 10, reviewLimit: 5 },
 *   sessionStats,
 *   useMetaAI: true,
 * });
 * ```
 */

import type { Question } from '@/types';
import { loadProgressSync } from '@/storage/progress/progressStorage';
import type {
  ScheduleParams,
  ScheduleContext,
  ScheduleResult,
  WordStatus,
  PrioritizedQuestion,
  RecentAnswer,
  ForgettingRiskParams,
  DetectedSignal,
} from './types';
import type { WordProgress } from '@/storage/progress/types';
import { AntiVibrationFilter } from './AntiVibrationFilter';
import { logger } from '@/utils/logger';
import { AICoordinator } from '../AICoordinator';
import type { SessionStats as AISessionStats } from '../types';
import {
  determineWordPosition,
  getSavedPositionDecisionForDebug,
  positionToCategory,
} from '../utils/categoryDetermination';
import { MemoryAI } from '@/ai/specialists/MemoryAI';
import { CognitiveLoadAI } from '@/ai/specialists/CognitiveLoadAI';
import { ErrorPredictionAI } from '@/ai/specialists/ErrorPredictionAI';
import { LinguisticAI } from '@/ai/specialists/LinguisticAI';
import { ContextualAI } from '@/ai/specialists/ContextualAI';
import { LearningStyleAI } from '@/ai/specialists/LearningStyleAI';
import { GamificationAI } from '@/ai/specialists/GamificationAI';
import { generateContextualSequence } from '@/ai/optimization/contextualLearningAI';
import { isIncorrectWordCategory, isReviewWordCategory } from '@/ai/utils/wordCategoryPredicates';
import { DebugTracer } from '@/utils/DebugTracer';

export class QuestionScheduler {
  private antiVibration: AntiVibrationFilter;
  private recentAnswersCache: Map<string, RecentAnswer[]> = new Map();
  public aiCoordinator: AICoordinator | null = null;
  private useAICoordinator: boolean = false;

  // 🔥 ランダム飛ばし機能（オブザーバー提案）
  private incorrectSkipQueue: PrioritizedQuestion[] = []; // incorrect待機キュー
  private skipCounter: number = 0; // 飛ばしカウンター
  private skipTarget: number = 0; // 目標飛ばし回数

  constructor() {
    this.antiVibration = new AntiVibrationFilter();
  }

  /**
   * 重み付きランダムで飛ばし回数を決定
   * 2問: 40%, 3問: 30%, 4問: 20%, 5問: 10%
   */
  private getRandomSkipCount(): number {
    const random = Math.random();
    if (random < 0.4) return 2;
    if (random < 0.7) return 3;
    if (random < 0.9) return 4;
    return 5;
  }

  /**
   * AI統合機能を有効化（オプトイン）
   */
  enableAICoordination(enable: boolean = true): void {
    this.useAICoordinator = enable;
    if (enable && !this.aiCoordinator) {
      this.aiCoordinator = new AICoordinator({
        debugMode: import.meta.env.DEV,
      });
    }
  }

  /**
   * 問題をスケジューリング（メインAPI）
   *
   * @param params スケジューリングパラメータ
   * @returns スケジューリング結果
   */
  async schedule(params: ScheduleParams): Promise<ScheduleResult> {
    const startTime = performance.now();

    const debugInfo = {
      timestamp: new Date().toISOString(),
      mode: params.mode,
      questionCount: params.questions.length,
      useMetaAI: params.useMetaAI,
      hybridMode: params.hybridMode || false,
      firstQuestions: params.questions.slice(0, 10).map((q) => q.word),
    };

    // スケジューリング開始（ログ削減のため出力なし）

    // localStorage に保存（デバッグ用）
    try {
      const existing = JSON.parse(localStorage.getItem('debug_scheduler_calls') || '[]');
      existing.push(debugInfo);
      if (existing.length > 10) existing.shift(); // 最新10件のみ保持
      localStorage.setItem('debug_scheduler_calls', JSON.stringify(existing));
    } catch {
      // ignore
    }

    // 🔥 ランダム飛ばし機能（オブザーバー提案）
    // 待機キューから再出題チェック
    if (this.skipCounter >= this.skipTarget && this.incorrectSkipQueue.length > 0) {
      const readyQuestion = this.incorrectSkipQueue.shift()!;
      this.skipCounter = 0;
      this.skipTarget = 0;

      if (import.meta.env.DEV) {
        console.log('🔥 [RandomSkip] 待機キューから再出題:', readyQuestion.question.word);
      }

      // 待機キューの問題を最優先で出題
      const otherQuestions = params.questions.filter((q) => q.word !== readyQuestion.question.word);
      return this.schedule({
        ...params,
        questions: [readyQuestion.question, ...otherQuestions],
      });
    }

    // 飛ばしカウンター進行
    if (this.skipTarget > 0) {
      this.skipCounter++;
      // Debug log removed to reduce console noise
    }

    // ハイブリッドモード: 既存AIの順序を尊重
    if (params.hybridMode) {
      return this.scheduleHybridMode(params, startTime);
    }

    // finalPriorityモード: AICoordinatorのfinalPriorityを主軸にする（variant=C）
    if (params.finalPriorityMode) {
      return this.scheduleFinalPriorityMode(params, startTime);
    }

    // 1. コンテキスト構築
    const context = this.buildContext(params);

    // 2. シグナル検出（メタAI統合）
    const signals = params.useMetaAI ? this.detectSignals(context) : [];

    // 3. 優先度計算（DTA統合 + Position分散）
    // ⚠️ calculatePriorities()内でapplyInterleavingAdjustment()を呼び出し済み
    const prioritized = this.calculatePriorities(params.questions, context, signals, false);

    // 4. 振動防止フィルター適用
    const filtered = this.applyAntiVibration(prioritized, context);

    // 5. ソート・バランス調整
    const sorted = this.sortAndBalance(filtered, params, context);

    // 6. 後処理
    const questions = this.postProcess(sorted, context);

    // 📊 localStorage保存: postProcess後のTOP30（実際の出題順序）
    // NOTE: mode別キーも併記して、translation等の30問テストで上書きされないようにする
    try {
      const top30 = questions.slice(0, 30).map((q, _idx) => {
        const pq = sorted.find((pq) => pq.question.word === q.word);
        return {
          word: q.word,
          position: pq?.position || 0,
          category: pq?.status?.category,
          attempts: pq?.status?.attempts || 0,
        };
      });

      const payload = {
        timestamp: new Date().toISOString(),
        mode: context.mode,
        source: 'schedule',
        top30,
      };

      localStorage.setItem('debug_postProcess_output', JSON.stringify(payload));
      localStorage.setItem(`debug_postProcess_output_${context.mode}`, JSON.stringify(payload));
    } catch {
      // localStorage失敗は無視
    }

    // 7. 振動スコア計算
    const vibrationScore = this.antiVibration.calculateVibrationScore(
      sorted,
      context.recentAnswers,
      20
    );

    const processingTime = performance.now() - startTime;

    const resultDebug = {
      top10Words: questions.slice(0, 10).map((q) => q.word),
      top10Positions: sorted
        .slice(0, 10)
        .map((pq) => ({ word: pq.question.word, position: pq.position })),
    };

    logger.info(`[QuestionScheduler] スケジューリング完了`, {
      processingTime: Math.round(processingTime) + 'ms',
      vibrationScore,
      signalCount: signals.length,
      resultDebug,
    });

    // localStorage に結果を保存（デバッグ用）
    try {
      const existing = JSON.parse(localStorage.getItem('debug_scheduler_results') || '[]');
      existing.push({
        timestamp: new Date().toISOString(),
        ...resultDebug,
      });
      if (existing.length > 10) existing.shift();
      localStorage.setItem('debug_scheduler_results', JSON.stringify(existing));
    } catch {
      // ignore
    }

    // 🔥 ランダム飛ばし機能: incorrect単語を待機キューに追加
    // トップ問題がincorrectの場合のみ（出題直前に判定）
    if (sorted.length > 0 && context.recentAnswers.length > 0) {
      const topQuestion = sorted[0];
      const recentAnswer = context.recentAnswers.find((a) => a.word === topQuestion.question.word);

      if (recentAnswer && !recentAnswer.correct) {
        // 既に待機キューにない場合のみ追加
        const alreadyQueued = this.incorrectSkipQueue.some(
          (pq) => pq.question.word === topQuestion.question.word
        );

        if (!alreadyQueued) {
          this.incorrectSkipQueue.push(topQuestion);
          this.skipTarget = this.getRandomSkipCount();
          this.skipCounter = 0;

          if (import.meta.env.DEV) {
            console.log(
              `🔥 [RandomSkip] incorrect待機キューに追加: ${topQuestion.question.word} (${this.skipTarget}問後に再出題)`
            );
          }

          // トップ問題を除外して再スケジューリング
          const nextQuestions = questions.slice(1);
          if (nextQuestions.length > 0) {
            return {
              scheduledQuestions: nextQuestions,
              vibrationScore,
              processingTime,
              signalCount: signals.length,
              debug: {
                dtaApplied: sorted.filter((pq) => (pq.status?.position ?? 50) < 20).length, // mastered
                antiVibrationApplied: sorted.filter((pq) => pq.antiVibrationApplied).length,
                signalsDetected: signals,
                randomSkipApplied: true, // 🔥 追加
              },
            };
          }
        }
      }
    }

    return {
      scheduledQuestions: questions,
      vibrationScore,
      processingTime,
      signalCount: signals.length,
      debug: {
        dtaApplied: sorted.filter((pq) => (pq.status?.position ?? 50) < 20).length, // mastered
        antiVibrationApplied: sorted.filter((pq) => pq.antiVibrationApplied).length,
        signalsDetected: signals,
      },
    };
  }

  /**
   * セッションコンテキストを構築
   */
  private buildContext(params: ScheduleParams): ScheduleContext {
    const now = new Date();
    const hour = now.getHours();
    const timeOfDay =
      hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';

    const cognitiveLoad = this.calculateCognitiveLoad(params.sessionStats);
    const recentAnswers = this.getRecentAnswers(params.mode);

    // 単語別の学習進捗を読み込み
    const progress = loadProgressSync();
    const wordProgress: Record<string, any> = {};
    if (progress && progress.wordProgress) {
      for (const question of params.questions) {
        const wp = progress.wordProgress[question.word];
        if (wp) {
          wordProgress[question.word] = wp;
        }
      }
    }

    return {
      mode: params.mode,
      sessionStats: params.sessionStats,
      recentAnswers,
      timeOfDay,
      cognitiveLoad,
      useMetaAI: params.useMetaAI || false,
      isReviewFocusMode: params.isReviewFocusMode || false,
      sessionStartTime: Date.now() - (params.sessionStats.duration || 0),
      wordProgress,
    };
  }

  /**
   * 認知負荷を計算（0-1）
   */
  private calculateCognitiveLoad(stats: ScheduleParams['sessionStats']): number {
    const errorRate =
      stats.correct + stats.incorrect > 0 ? stats.incorrect / (stats.correct + stats.incorrect) : 0;

    const sessionMinutes = (stats.duration || 0) / 60000;
    const timeLoad = Math.min(sessionMinutes / 30, 1); // 30分で最大

    return Math.min(errorRate * 0.7 + timeLoad * 0.3, 1);
  }

  /**
   * 最近の解答履歴を取得（最大100件）
   */
  private getRecentAnswers(mode: string): RecentAnswer[] {
    // キャッシュチェック
    if (this.recentAnswersCache.has(mode)) {
      return this.recentAnswersCache.get(mode)!;
    }

    try {
      const progress = loadProgressSync();
      const answers: RecentAnswer[] = [];

      Object.entries(progress.wordProgress || {}).forEach(([word, data]: [string, any]) => {
        if (data.lastStudied > 0) {
          const bucket = positionToCategory(
            determineWordPosition(
              data,
              mode as 'memorization' | 'translation' | 'spelling' | 'grammar'
            )
          );
          answers.push({
            word,
            correct: !isIncorrectWordCategory(bucket),
            timestamp: data.lastStudied,
            consecutiveCorrect: data.streak || 0,
          });
        }
      });

      // タイムスタンプ降順でソート（最新100件を保持）
      answers.sort((a, b) => b.timestamp - a.timestamp);
      const recentAnswers = answers.slice(0, 100);

      // キャッシュに保存
      this.recentAnswersCache.set(mode, recentAnswers);

      return recentAnswers;
    } catch (error) {
      logger.error('[QuestionScheduler] 解答履歴の取得に失敗', error);
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
  private detectSignals(context: ScheduleContext): DetectedSignal[] {
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
      logger.error('[QuestionScheduler] シグナル検出エラー', error);
      return [];
    }
  }

  /**
   * Position計算（7つのAI評価統合）
   * ⚡ パフォーマンス最適化: localStorageを1回だけ読み込む
   */
  private calculatePriorities(
    questions: Question[],
    context: ScheduleContext,
    signals: any[],
    hybridMode = false
  ): PrioritizedQuestion[] {
    // 📞 関数呼び出しトレース
    this.recordFunctionCall('calculatePriorities', {
      questionsCount: questions.length,
      hybridMode,
    });

    // ⚡ 最適化: localStorage を一度だけ読み込んでキャッシュ
    const progressCache = this.loadProgressCache();

    // 🐛 DEBUG: 入力時点でまだまだ語が含まれているか確認
    let calcSpanId: string | undefined;
    if (import.meta.env.DEV) {
      const weakWordsInInput = questions.filter((q) => {
        const status = this.getWordStatusFromCache(q.word, context.mode, progressCache);
        return status && status.attempts > 0 && status.position >= 40;
      });

      calcSpanId = DebugTracer.startSpan('QuestionScheduler.calculatePriorities', {
        weakWordsCount: weakWordsInInput.length,
        totalCount: questions.length,
        weakWords: weakWordsInInput.map((q) => q.word),
      });
    }

    // 🎯 難易度別適応学習: 中級・上級の正答率が悪い場合、初級を優先
    const difficultyAdaptation = this.calculateDifficultyAdaptation(progressCache);

    const prioritized = questions.map((q, index) => {
      const status = this.getWordStatusFromCache(q.word, context.mode, progressCache);

      // ハイブリッドモード: 元の順序を保持（indexベース）
      if (hybridMode) {
        const position = (index / questions.length) * 100; // 0-100の範囲
        return {
          question: q,
          position,
          status,
          signals: [],
          originalIndex: index,
          attempts: status?.attempts || 0, // 出題回数を追加
        };
      }

      // ✅ Position = 0-100スコア（determineWordPosition()で計算済み）
      // すでに7つのAI評価・TimeBoost・全ての要素が統合されている
      let position = status?.position || 35; // デフォルト: new範囲

      // 🐛 DEBUG: statusがnullの場合を検出
      if (import.meta.env.DEV && status === null && index < 20) {
        console.warn(
          `⚠️ [calculatePriorities] ${q.word}: status is NULL (using default position=35)`
        );
      }

      // 🎯 難易度別適応: 中級・上級が苦手な場合、初級を優先
      position = this.applyDifficultyAdaptation(position, q, difficultyAdaptation);

      // 🔍 デバッグ: Position値確認（開発環境のみ、最初の20単語のみ）
      if (import.meta.env.DEV && index < 20) {
        console.log(
          `🔍 [calculatePriorities] ${q.word}: position=${position}, status.position=${status?.position}, status=${status ? 'OK' : 'NULL'}`
        );
      }

      return {
        question: q,
        position: position,
        status,
        signals: [],
        originalIndex: index,
        attempts: status?.attempts || 0, // 出題回数を追加
      };
    });

    // 🎮 Position分散適用（インターリーブ）
    const adjusted = this.applyInterleavingAdjustment(prioritized, context.mode, questions.length);

    // 🎫 スパン終了（calculatePriorities完了）
    if (import.meta.env.DEV && calcSpanId) {
      const weakWordsAfter = adjusted.filter(
        (pq) => pq.position >= 40 && pq.position < 70 && (pq.attempts ?? 0) > 0
      );
      DebugTracer.endSpan(calcSpanId, {
        weakWordsCount: weakWordsAfter.length,
        totalCount: adjusted.length,
        weakWords: weakWordsAfter.map((pq) => pq.question.word),
      });
    }

    return adjusted;
  }

  /**
   * GamificationAIによるPosition調整（インターリーブ用）
   */
  private applyInterleavingAdjustment(
    prioritized: PrioritizedQuestion[],
    mode: ScheduleParams['mode'],
    questionsCount: number
  ): PrioritizedQuestion[] {
    // 📞 関数呼び出しトレース
    this.recordFunctionCall('applyInterleavingAdjustment', {
      prioritizedCount: prioritized.length,
      mode,
      questionsCount,
    });

    // 🐛 DEBUG: GamificationAI入力時点でまだまだ語を確認
    let gamificationSpanId: string | undefined;
    if (import.meta.env.DEV) {
      const weakWordsInInput = prioritized.filter(
        (pq) => pq.position >= 40 && pq.position < 70 && (pq.attempts ?? 0) > 0
      );

      gamificationSpanId = DebugTracer.startSpan('QuestionScheduler.beforeGamification', {
        weakWordsCount: weakWordsInInput.length,
        totalCount: prioritized.length,
        weakWords: weakWordsInInput.map((pq) => pq.question.word),
      });
    }

    const gamificationAI = new GamificationAI();

    // 🔍 デバッグ: Position分散前の統計（正確なカテゴリ判定）
    const before = {
      stillLearning: prioritized.filter(
        (pq) => pq.position >= 40 && pq.position < 70 && (pq.attempts ?? 0) > 0
      ).length,
      incorrect: prioritized.filter((pq) => pq.position >= 70).length,
      new: prioritized.filter((pq) => pq.position < 40).length,
      boostable: prioritized.filter(
        (pq) => pq.position >= 25 && pq.position < 40 && (pq.attempts ?? 0) === 0
      ).length,
    };

    // まだまだ語のブースト（Position 45 → 60）
    const { result: boostedStill, changed: stillChanged } =
      gamificationAI.boostStillLearningQuestions(prioritized);

    // 新規語のPosition引き上げ
    const { result, changed } = gamificationAI.adjustPositionForInterleaving(boostedStill);

    // 🔍 デバッグ: Position分散後の統計（正確なカテゴリ判定）
    const after = {
      stillLearning: result.filter(
        (pq) => pq.position >= 40 && pq.position < 70 && (pq.attempts ?? 0) > 0
      ).length,
      incorrect: result.filter((pq) => pq.position >= 70).length,
      new: result.filter((pq) => pq.position < 40).length,
      boostable: result.filter(
        (pq) => pq.position >= 25 && pq.position < 40 && (pq.attempts ?? 0) === 0
      ).length,
    };

    // 🔍 Position階層検証（「あっちを立てればこっちが立たず」防止）
    const stillInBoostedZone = result.filter((pq) => {
      const isStill = pq.position >= 40 && pq.position < 70 && (pq.attempts ?? 0) > 0;
      return isStill && pq.position >= 60 && pq.position < 70; // まだまだ語が60-69範囲内
    }).length;
    const newInBoostedZone = result.filter((pq) => {
      const isNew = pq.position >= 40 && (pq.attempts ?? 0) === 0;
      return isNew && pq.position >= 40 && pq.position < 60; // 新規語（ブースト後）が40-59範囲内
    }).length;
    const hierarchyViolation = result.filter((pq) => {
      const isNew = (pq.attempts ?? 0) === 0;
      const isStill = (pq.attempts ?? 0) > 0 && pq.position >= 40 && pq.position < 70;
      // 新規 > まだまだ の逆転をチェック
      return (isNew && pq.position >= 60) || (isStill && pq.position < 60);
    });

    if (import.meta.env.DEV && hierarchyViolation.length > 0) {
      console.error(
        `❌ [Position階層違反] 「あっちを立てればこっちが立たず」検出: ${hierarchyViolation.length}語`
      );
      console.error('🚨 新規語がPosition 60以上、またはまだまだ語がPosition 60未満');
      hierarchyViolation.slice(0, 3).forEach((pq) => {
        const word = pq.question.word;
        const type = (pq.attempts ?? 0) === 0 ? '新規' : 'まだまだ';
        console.error(`  • ${word} (${type}): Position ${pq.position.toFixed(0)}`);
      });
    }

    // localStorage保存（デバッグパネル用）
    try {
      const snapshot = {
        mode,
        questionsCount,
        stillInBoostedZone,
        newInBoostedZone,
        violations: hierarchyViolation.map((pq) => ({
          word: pq.question.word,
          position: pq.position,
          attempts: pq.attempts ?? 0,
          type: (pq.attempts ?? 0) === 0 ? 'new_exceeds_60' : 'still_below_60',
        })),
        violationCount: hierarchyViolation.length,
        isValid: hierarchyViolation.length === 0,
        timestamp: new Date().toISOString(),
      };

      // legacy
      localStorage.setItem('debug_position_hierarchy_validation', JSON.stringify(snapshot));
      // by-mode
      localStorage.setItem(`debug_position_hierarchy_validation_${mode}`, JSON.stringify(snapshot));
    } catch {
      // localStorage失敗は無視
    }

    // Position変更があった問題を記録 (すでにGamificationAIから返ってくる)

    // localStorage保存
    try {
      const snapshot = {
        mode,
        questionsCount,
        timestamp: new Date().toISOString(),
        before,
        after,
        stillChanged,
        changed,
        summary: {
          stillBoosted: stillChanged.length,
          newBoosted: changed.length,
          working: stillChanged.length > 0 || changed.length > 0,
        },
      };

      // legacy
      localStorage.setItem('debug_position_interleaving', JSON.stringify(snapshot));
      // by-mode
      const byModeKey = `debug_position_interleaving_${mode}`;
      localStorage.setItem(byModeKey, JSON.stringify(snapshot));
      // history
      const historyKey = `debug_position_interleaving_history_${mode}`;
      try {
        const existingRaw = localStorage.getItem(historyKey);
        const existing = JSON.parse(existingRaw || '[]');
        const arr = Array.isArray(existing) ? existing : [];
        arr.push(snapshot);
        while (arr.length > 5) arr.shift();
        localStorage.setItem(historyKey, JSON.stringify(arr));
      } catch {
        // ignore
      }
    } catch {
      // localStorage失敗は無視
    }

    if (import.meta.env.DEV) {
      console.log('🎮 [GamificationAI] Position分散前:', before);
      console.log('🎮 [GamificationAI] Position分散後:', after);
      if (stillChanged.length > 0) {
        console.log(
          '✅ [GamificationAI] まだまだ語ブースト:',
          stillChanged.slice(0, 10).map((c) => ({
            word: c.word,
            before: c.before.toFixed(0),
            after: c.after.toFixed(0),
          }))
        );
      }
      if (changed.length > 0) {
        console.log(
          '✅ [GamificationAI] 新規語Position引き上げ:',
          changed.slice(0, 10).map((c) => ({
            word: c.word,
            before: c.before.toFixed(0),
            after: c.after.toFixed(0),
          }))
        );
      } else {
        // まだまだ語が0の場合はPosition分散がスキップされる（正常動作）
        if (before.stillLearning === 0 && before.incorrect === 0) {
          console.log(
            'ℹ️ [GamificationAI] まだまだ・分からない語が0語 → Position分散スキップ（正常動作）'
          );
        } else {
          console.warn('⚠️ [GamificationAI] Position変更なし - 新規語が不足している可能性');
        }
      }
    }

    // 🎯 まだまだ語のPosition引き上げ（新規より優先させる）
    const { result: stillLearningBoosted, changed: stillLearningChanges } =
      gamificationAI.boostStillLearningQuestions(result);

    // localStorage保存
    try {
      const snapshot = {
        mode,
        questionsCount,
        timestamp: new Date().toISOString(),
        boosted: stillLearningChanges.length,
        changes: stillLearningChanges,
        working: stillLearningChanges.length > 0,
      };
      // legacy
      localStorage.setItem('debug_still_learning_boost', JSON.stringify(snapshot));
      // by-mode
      localStorage.setItem(`debug_still_learning_boost_${mode}`, JSON.stringify(snapshot));
    } catch {
      // localStorage失敗は無視
    }

    if (import.meta.env.DEV && stillLearningChanges.length > 0) {
      console.log(
        '🎯 [GamificationAI] まだまだ語ブースト:',
        stillLearningChanges.slice(0, 10).map((c) => ({
          word: c.word,
          before: c.before.toFixed(0),
          after: c.after.toFixed(0),
        }))
      );
    }

    // 🎫 スパン終了（GamificationAI処理完了）
    if (import.meta.env.DEV && gamificationSpanId) {
      const weakWordsAfter = stillLearningBoosted.filter(
        (pq) => pq.position >= 40 && pq.position < 70 && (pq.attempts ?? 0) > 0
      );
      DebugTracer.endSpan(gamificationSpanId, {
        weakWordsCount: weakWordsAfter.length,
        totalCount: stillLearningBoosted.length,
        weakWords: weakWordsAfter.map((pq) => pq.question.word),
      });
    }

    return stillLearningBoosted;
  }

  /**
   * 関数呼び出しをlocalStorageに記録（デバッグ用）
   */
  private recordFunctionCall(funcName: string, params: any): void {
    try {
      const stored = localStorage.getItem('debug_function_calls');
      const logs = stored ? JSON.parse(stored) : [];
      logs.push({
        timestamp: new Date().toISOString(),
        function: funcName,
        params,
      });
      // 最新30件のみ保持
      if (logs.length > 30) logs.shift();
      localStorage.setItem('debug_function_calls', JSON.stringify(logs));
    } catch {
      // localStorage失敗は無視
    }
  }

  /**
   * 忘却リスクスコアを計算（0-200）
   * 注: この計算は参考値。実際のPosition計算はdetermineWordPosition()で実施済み
   */
  private calculateForgettingRisk(params: ForgettingRiskParams): number {
    if (params.lastStudied === 0) return 0;

    const daysSinceLastStudy = (Date.now() - params.lastStudied) / (1000 * 60 * 60 * 24);
    const intervalRatio =
      params.reviewInterval > 0 ? daysSinceLastStudy / params.reviewInterval : 0;

    let risk = intervalRatio * 100;

    // 正答率による調整
    if (params.accuracy < 50) {
      risk *= 1.5; // 正答率低い→リスク増
    } else if (params.accuracy >= 80) {
      risk *= 0.7; // 正答率高い→リスク減
    }

    return Math.round(Math.min(risk, 200));
  }

  /**
   * シグナルを優先度に反映
   *
   * シグナルに基づいて優先度を動的に調整:
   * - 疲労: 簡単な問題（masteredなど）の優先度を上げる
   * - 苦戦: 復習問題（incorrect/still_learning）の優先度を大きく上げる
   * - 過学習: 難しい問題の優先度を上げる
   * - 最適: 現在の優先度を維持
   */
  private applySignals(
    priority: number,
    signals: Array<{
      type: 'fatigue' | 'boredom' | 'overlearning' | 'struggling' | 'optimal';
      confidence: number;
      action: 'easier' | 'harder' | 'diverse' | 'review' | 'continue';
    }>,
    _question: Question
  ): number {
    if (signals.length === 0) return priority;

    let adjustedPriority = priority;

    for (const signal of signals) {
      switch (signal.type) {
        case 'fatigue':
          // 疲労時: mastered問題を少し優先（復習しやすい）
          if (priority > 8) {
            adjustedPriority *= 1 - signal.confidence * 0.2; // 最大20%優先度アップ
          }
          break;

        case 'struggling':
          // 苦戦時: incorrect/still_learningの優先度を大きく下げる（優先出題）
          if (priority < 2) {
            adjustedPriority *= 1 - signal.confidence * 0.3; // 最大30%優先度アップ
          }
          break;

        case 'overlearning':
          // 過学習時: 新しい問題や難しい問題を優先
          if (priority >= 3 && priority <= 5) {
            adjustedPriority *= 1 - signal.confidence * 0.15; // 最大15%優先度アップ
          }
          break;

        case 'optimal':
          // 最適状態: 現在の優先度を維持
          break;
      }
    }

    return adjustedPriority;
  }

  /**
  /**
   * ⚡ localStorage からプログレスデータを1回だけ読み込む
   */
  private loadProgressCache(): any {
    try {
      const progress = loadProgressSync();
      return progress;
    } catch {
      return null;
    }
  }

  /**
   * ⚡ キャッシュされたデータから語句の学習状況を取得
   */
  private getWordStatusFromCache(
    word: string,
    mode: string,
    progressCache: any
  ): WordStatus | null {
    if (!progressCache || !progressCache.wordProgress) return null;

    const wordProgress = progressCache.wordProgress[word];
    if (!wordProgress) {
      // 🐛 DEBUG: LocalStorageに存在するはずの単語が見つからない場合
      // （大量ログを避けるため、ここでは出力しない）
      return null;
    }

    // ✅ AI担当関数に委譲: Position = 0-100スコア（7つのAI評価統合済み）
    // ✅ モード別Position優先: タブごとに独立した学習進度を管理
    const position = determineWordPosition(
      wordProgress,
      mode as 'memorization' | 'translation' | 'spelling' | 'grammar'
    );

    // Position範囲からcategoryを派生（後方互換性）
    const bucket = positionToCategory(position);

    // 🎯 モード別の試行回数を取得（重要！）
    // まだまだ・分からないの判定には、そのタブでの実際の試行回数を使う
    let modeAttempts = 0;
    let modeCorrect = 0;
    switch (mode) {
      case 'memorization':
        modeAttempts = wordProgress.memorizationAttempts || 0;
        modeCorrect = wordProgress.memorizationCorrect || 0;
        break;
      case 'translation':
        modeAttempts = wordProgress.translationAttempts || 0;
        modeCorrect = wordProgress.translationCorrect || 0;
        break;
      case 'spelling':
        modeAttempts = wordProgress.spellingAttempts || 0;
        modeCorrect = wordProgress.spellingCorrect || 0;
        break;
      case 'grammar':
        modeAttempts = wordProgress.grammarAttempts || 0;
        modeCorrect = wordProgress.grammarCorrect || 0;
        break;
      default:
        // フォールバック: 総合値
        modeAttempts = (wordProgress.correctCount || 0) + (wordProgress.incorrectCount || 0);
        modeCorrect = wordProgress.correctCount || 0;
    }

    return {
      category: bucket,
      position,
      lastStudied: wordProgress.lastStudied || 0,
      attempts: modeAttempts, // ✅ モード別試行回数
      correct: modeCorrect, // ✅ モード別正解回数
      streak: wordProgress.consecutiveCorrect || 0,
      forgettingRisk: 0,
      reviewInterval: 1,
    };
  }

  /**
   * 語句の学習状況を取得（旧メソッド - 互換性のため残す）
   */
  private getWordStatus(word: string, mode: string): WordStatus | null {
    try {
      const progress = loadProgressSync();
      const wordProgress = progress.wordProgress?.[word];
      if (!wordProgress) return null;

      // ✅ AI担当関数に委譲: Position = 0-100スコア（7つのAI評価統合済み）
      // ✅ モード別Position優先: タブごとに独立した学習進度を管理
      const position = determineWordPosition(
        wordProgress,
        mode as 'memorization' | 'translation' | 'spelling' | 'grammar'
      );

      // Position範囲からcategoryを派生（後方互換性）
      const bucket = positionToCategory(position);

      // ✅ デバッグ: AI判定結果
      if (import.meta.env.DEV) {
        console.log(`🔍 [QuestionScheduler] ${word}: Position=${position}, category=${bucket}`);
      }

      // 🎯 モード別の試行回数を取得（重要！）
      let modeAttempts = 0;
      let modeCorrect = 0;
      switch (mode) {
        case 'memorization':
          modeAttempts = wordProgress.memorizationAttempts || 0;
          modeCorrect = wordProgress.memorizationCorrect || 0;
          break;
        case 'translation':
          modeAttempts = wordProgress.translationAttempts || 0;
          modeCorrect = wordProgress.translationCorrect || 0;
          break;
        case 'spelling':
          modeAttempts = wordProgress.spellingAttempts || 0;
          modeCorrect = wordProgress.spellingCorrect || 0;
          break;
        case 'grammar':
          modeAttempts = wordProgress.grammarAttempts || 0;
          modeCorrect = wordProgress.grammarCorrect || 0;
          break;
        default:
          // フォールバック: 総合値
          modeAttempts = (wordProgress.correctCount || 0) + (wordProgress.incorrectCount || 0);
          modeCorrect = wordProgress.correctCount || 0;
      }

      const status = {
        category: bucket,
        position,
        lastStudied: wordProgress.lastStudied || 0,
        attempts: modeAttempts, // ✅ モード別試行回数
        correct: modeCorrect, // ✅ モード別正解回数
        streak: wordProgress.consecutiveCorrect || 0,
        forgettingRisk: 0,
        reviewInterval: 1,
      };

      // デバッグ: incorrect/still_learningの単語のみログ出力
      if (isReviewWordCategory(bucket)) {
        logger.debug(
          `[WordStatus] ${word}: ${bucket} (position=${position}, attempts=${status.attempts}, consecutiveIncorrect=${wordProgress.consecutiveIncorrect || 0})`
        );
      }

      return status;
    } catch (error) {
      logger.error('[QuestionScheduler] 学習状況の取得に失敗', error);
      return null;
    }
  }

  /**
   * 振動防止フィルター適用
   */
  private applyAntiVibration(
    questions: PrioritizedQuestion[],
    context: ScheduleContext
  ): PrioritizedQuestion[] {
    return this.antiVibration.filter(questions, {
      recentAnswers: context.recentAnswers,
      minInterval: 60000, // 1分
      consecutiveThreshold: 3, // 3連続正解
    });
  }

  /**
   * ソート・バランス調整
   * 注: category = 学習状態（分からない/まだまだ/未学習/定着済）
   */
  private sortAndBalance(
    questions: PrioritizedQuestion[],
    _params: ScheduleParams,
    _context: ScheduleContext
  ): PrioritizedQuestion[] {
    // � 関数呼び出しトレース
    this.recordFunctionCall('sortAndBalance', { questionsCount: questions.length });

    // �🔍 デバッグ: TOP20のPosition確認
    if (import.meta.env.DEV && questions.length > 0) {
      const top20 = questions.slice(0, Math.min(20, questions.length));
      console.log(
        '🔍 [sortAndBalance] TOP20 Position確認:',
        top20.map((pq) => ({
          word: pq.question.word,
          position: pq.position,
          statusPosition: pq.status?.position,
        }))
      );
    }

    // 学習状態（習得度）別に分類
    // ⚠️ 重要: pq.positionを使用（pq.status?.positionではない）
    const incorrectQuestions = questions.filter((pq) => pq.position >= 70); // 分からない
    const stillLearningQuestions = questions.filter(
      (pq) => pq.position >= 40 && pq.position < 70 // まだまだ
    );
    const otherQuestions = questions.filter(
      (pq) => pq.position < 40 // 未学習 or 定着済
    );

    // 🔍 デバッグ: カテゴリ分類結果
    if (import.meta.env.DEV) {
      console.log('🔍 [sortAndBalance] カテゴリ分類結果:', {
        incorrect: incorrectQuestions.length,
        stillLearning: stillLearningQuestions.length,
        other: otherQuestions.length,
        incorrectWords: incorrectQuestions.slice(0, 5).map((pq) => pq.question.word),
        stillLearningWords: stillLearningQuestions.slice(0, 5).map((pq) => pq.question.word),
      });
    }

    // デバッグ: 学習状態別の統計
    const learningStatusStats = questions.reduce(
      (acc, pq) => {
        const status = pq.status?.category || 'null'; // 学習状態（分からない/まだまだ/未学習/定着済）
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // 学習状態統計（ログ削減のため出力なし）

    // 🚨 警告: すべての単語の学習状態がnullの場合、学習履歴が読み取れていない
    if (learningStatusStats['null'] === questions.length) {
      if (import.meta.env.DEV) {
        logger.warn(
          '[QuestionScheduler] 全単語の学習段階がnull - localStorageから学習履歴を読み取れていない可能性があります'
        );
      }
    }

    // 各カテゴリ内でPosition順ソート（降順: Positionが高い順）
    // NOTE: 視覚回帰（スナップショット）と学習体験の安定性のため、同順位のランダム化は行わない。
    const sortByPosition = (a: PrioritizedQuestion, b: PrioritizedQuestion) => {
      if (a.position !== b.position) {
        return b.position - a.position; // ✅ 降順（Positionが高い順）
      }

      // 同一Positionは入力順（originalIndex）で安定化
      return (a.originalIndex || 0) - (b.originalIndex || 0);
    };

    incorrectQuestions.sort(sortByPosition);
    stillLearningQuestions.sort(sortByPosition);
    otherQuestions.sort(sortByPosition);

    // 🎲 GamificationAI: Position分散適用済み（calculatePriorities内）
    // Position降順ソート + カテゴリ別インターリーブで自然に交互出題を実現
    const sorted = [...questions].sort((a, b) => {
      if (a.position !== b.position) {
        return b.position - a.position; // 降順（高い方が優先）
      }
      // 同一Positionは入力順（originalIndex）で安定化
      return (a.originalIndex || 0) - (b.originalIndex || 0);
    });

    // 🎮 カテゴリ別インターリーブ（まだまだ語とPosition引き上げ新規語を交互配置）
    const gamificationAI = new GamificationAI();
    const interleaved = gamificationAI.interleaveByCategory(sorted);

    // 🎯 吸引確認: まだまだ・分からない語がTOP30に何語含まれるか検証
    if (import.meta.env.DEV) {
      const strugglingInSorted = sorted.filter(
        (pq) => pq.position >= 40 && (pq.attempts ?? 0) > 0
      ).length;
      const strugglingInTop30 = interleaved
        .slice(0, 30)
        .filter((pq) => pq.position >= 40 && (pq.attempts ?? 0) > 0).length;
      const strugglingInTop10 = interleaved
        .slice(0, 10)
        .filter((pq) => pq.position >= 40 && (pq.attempts ?? 0) > 0).length;

      console.log('🎯 [吸引確認] まだまだ・分からない語の分布', {
        total: strugglingInSorted,
        top30: strugglingInTop30,
        top10: strugglingInTop10,
        coverage:
          strugglingInSorted > 0
            ? `${((strugglingInTop30 / strugglingInSorted) * 100).toFixed(1)}%`
            : '-',
      });

      if (strugglingInSorted > 0 && strugglingInTop30 === 0) {
        console.warn(
          '⚠️ [吸引失敗] まだまだ・分からない語がTOP30に1つも含まれていません！Position降順ソートが機能していない可能性があります。'
        );
      }
    }

    // デバッグ: 学習段階分布（開発環境のみ）
    if (import.meta.env.DEV) {
      const top20 = interleaved.slice(0, Math.min(20, interleaved.length));
      const positionDistribution = {
        分からない: top20.filter((pq) => pq.position >= 70).length,
        まだまだ: top20.filter((pq) => pq.position >= 40 && pq.position < 70).length,
        未学習or定着済: top20.filter((pq) => pq.position < 40).length,
      };
      console.log('🔀 [出題順序] インターリーブ後の学習段階分布', positionDistribution);

      const top20Categories = top20
        .map((pq) => {
          const word = pq.question.word;
          const attempts = pq.attempts ?? 0;
          const category =
            attempts > 0 && pq.position >= 40 && pq.position < 70
              ? 'まだまだ'
              : pq.position >= 40 && pq.position < 70
                ? '新規(引上)'
                : pq.position >= 70
                  ? '分からない'
                  : '新規';
          return `${word}(${category})`;
        })
        .join(', ');
      console.log('🎮 [インターリーブ] TOP20:', top20Categories);
    }

    // 📊 localStorage保存: sortAndBalance出力のTOP30
    try {
      const top30 = interleaved.slice(0, 30).map((pq) => ({
        word: pq.question.word,
        position: pq.position,
        category: pq.status?.category,
        attempts: pq.attempts ?? pq.status?.attempts ?? 0,
      }));
      localStorage.setItem('debug_sortAndBalance_output', JSON.stringify(top30));

      // 📊 追加: TOP100も保存して、まだまだ語が何位にいるか確認
      const top100 = interleaved.slice(0, 100).map((pq, idx) => ({
        rank: idx + 1,
        word: pq.question.word,
        position: pq.position,
        category: pq.status?.category,
        attempts: pq.attempts ?? pq.status?.attempts ?? 0,
      }));
      // ⚠️ まだまだ語の定義: Position 40-70 かつ attempts > 0
      const stillLearningInTop100 = top100.filter(
        (item) => item.position >= 40 && item.position < 70 && item.attempts > 0
      );

      // 📊 TOP516位も確認（Position 50の新規516語の後にまだまだ語が来るはず）
      const top600 = interleaved.slice(0, 600).map((pq, idx) => ({
        rank: idx + 1,
        word: pq.question.word,
        position: pq.position,
        attempts: pq.attempts ?? pq.status?.attempts ?? 0,
      }));
      const stillLearningInTop600 = top600.filter(
        (item) => item.position >= 40 && item.position < 70 && item.attempts > 0
      );

      const snapshot = {
        timestamp: new Date().toISOString(),
        mode: _params.mode,
        questionsCount: questions.length,
        interleavedCount: interleaved.length,
        top100,
        top600,
        top600Count: top600.length,
        stillLearningInTop100: stillLearningInTop100.length,
        stillLearningInTop600: stillLearningInTop600.length,
        stillLearningWordsInTop100: stillLearningInTop100.map(
          (item) => `${item.rank}位: ${item.word} (Position ${item.position}, ${item.attempts}回)`
        ),
        stillLearningWordsInTop600: stillLearningInTop600
          .slice(0, 20)
          .map(
            (item) => `${item.rank}位: ${item.word} (Position ${item.position}, ${item.attempts}回)`
          ),
        position50Count: top600.filter((item) => item.position === 50 && item.attempts === 0)
          .length,
      };

      // 旧キー（互換用）: 最新の1件（モード混在で上書きされ得るので、読む側はmode別キー推奨）
      localStorage.setItem('debug_sortAndBalance_top100', JSON.stringify(snapshot));

      // 新キー: mode別に保存（モード違いの上書きを防止）
      const byModeKey = `debug_sortAndBalance_top100_${_params.mode}`;
      localStorage.setItem(byModeKey, JSON.stringify(snapshot));

      // 新キー: mode別に短い履歴を保持（同一mode内のミニ実行(30問など)でも、必要なスナップショットを選べる）
      const historyKey = `debug_sortAndBalance_top100_history_${_params.mode}`;
      try {
        const existingRaw = localStorage.getItem(historyKey);
        const existing = JSON.parse(existingRaw || '[]');
        const arr = Array.isArray(existing) ? existing : [];
        arr.push(snapshot);
        while (arr.length > 5) arr.shift();
        localStorage.setItem(historyKey, JSON.stringify(arr));
      } catch {
        // ignore
      }
    } catch {
      // localStorage失敗は無視
    }

    return interleaved;
  }

  /**
   * ハイブリッドモード: 既存AI優先度を尊重し、振動防止とDTAの微調整のみ適用
   */
  private scheduleHybridMode(params: ScheduleParams, startTime: number): ScheduleResult {
    const context = this.buildContext(params);
    const signals = params.useMetaAI ? this.detectSignals(context) : [];

    // 既存の順序を保持したまま優先度を付与（hybridMode=false に変更してPosition分散を有効化）
    const prioritized = this.calculatePriorities(params.questions, context, signals, false);

    // 振動防止フィルター適用（最近正解した単語の再出題を防止）
    const filtered = this.applyAntiVibration(prioritized, context);

    // Position降順ソート（まだまだ・分からないを優先）
    const sorted = this.sortAndBalance(filtered, params, context);

    // 【確実性保証】ハイブリッドモードでも復習単語を確実に上位に配置
    const incorrectQuestions = sorted.filter((pq) => pq.position >= 70);
    const stillLearningQuestions = sorted.filter((pq) => pq.position >= 40 && pq.position < 70);
    const reviewNeeded = incorrectQuestions.length + stillLearningQuestions.length;
    const totalQuestions = sorted.length;

    logger.info('[QuestionScheduler Hybrid] 優先単語配置完了', {
      incorrectWords: incorrectQuestions.slice(0, 5).map((pq) => pq.question.word),
      stillLearningWords: stillLearningQuestions.slice(0, 5).map((pq) => pq.question.word),
      incorrectCount: incorrectQuestions.length,
      stillLearningCount: stillLearningQuestions.length,
      otherCount: totalQuestions - reviewNeeded,
      reviewRatio:
        totalQuestions > 0 ? `${((reviewNeeded / totalQuestions) * 100).toFixed(0)}%` : '0%',
      top5: sorted.slice(0, 5).map((pq) => `${pq.question.word}(${pq.status?.category})`),
    });

    // 後処理
    const questions = this.postProcess(sorted, context);

    // 📊 localStorage保存: postProcess後のTOP30（実際の出題順序）
    // 重要: sorted配列からPositionを取得（localStorageではなく、メモリ上の値）
    try {
      const top30 = questions.slice(0, 30).map((q, _idx) => {
        // sorted配列から対応するPrioritizedQuestionを検索
        const pq = sorted.find((pq) => pq.question.word === q.word);
        return {
          word: q.word,
          position: pq?.position || 0, // メモリ上のPosition値
          category: pq?.status?.category,
          attempts: pq?.status?.attempts || 0,
        };
      });
      localStorage.setItem(
        'debug_postProcess_output',
        JSON.stringify({
          timestamp: new Date().toISOString(),
          mode: context.mode,
          source: 'scheduleHybridMode',
          top30,
        })
      );
    } catch {
      // localStorage失敗は無視
    }

    // 振動スコア計算
    const vibrationScore = this.antiVibration.calculateVibrationScore(
      sorted,
      context.recentAnswers,
      20
    );

    const processingTime = performance.now() - startTime;

    logger.info(`[QuestionScheduler Hybrid] スケジューリング完了`, {
      processingTime: Math.round(processingTime) + 'ms',
      vibrationScore,
      incorrectCount: incorrectQuestions.length,
      stillLearningCount: stillLearningQuestions.length,
      aiEnabled: this.useAICoordinator,
      totalCount: questions.length,
    });

    return {
      scheduledQuestions: questions,
      vibrationScore,
      processingTime,
      signalCount: signals.length,
    };
  }

  /**
   * finalPriorityモード（variant=C）
   * AICoordinatorのfinalPriorityを主軸に、Positionは補助的に使用
   */
  private async scheduleFinalPriorityMode(
    params: ScheduleParams,
    startTime: number
  ): Promise<ScheduleResult> {
    const context = this.buildContext(params);
    const signals = params.useMetaAI ? this.detectSignals(context) : [];

    // ⚡ AICoordinator用: 全単語の進捗（specialist AI が allProgress を前提にする）
    const progressCache = this.loadProgressCache();
    const allProgress: Record<string, any> = (progressCache?.wordProgress ?? {}) as Record<
      string,
      any
    >;

    // AICoordinator用: currentTab マッピング（AI側の型に合わせる）
    const currentTab: 'memorization' | 'grammar' | 'comprehensive' =
      params.mode === 'grammar'
        ? 'grammar'
        : params.mode === 'memorization'
          ? 'memorization'
          : 'comprehensive';

    // AICoordinator用: SessionStats（AI側の型に合わせる）
    const totalAttempts =
      (params.sessionStats.correct || 0) +
      (params.sessionStats.incorrect || 0) +
      (params.sessionStats.still_learning || 0) +
      (params.sessionStats.mastered || 0);

    // 学習段階の分布（AIのモチベーション/文脈推定で利用）
    let masteredCount = 0;
    let stillLearningCount = 0;
    let incorrectCount = 0;
    let newCount = 0;
    for (const wp of Object.values(allProgress)) {
      const pos = determineWordPosition(
        wp,
        params.mode as 'memorization' | 'translation' | 'spelling' | 'grammar'
      );
      if (pos >= 70) incorrectCount++;
      else if (pos >= 40) stillLearningCount++;
      else if (pos >= 20) newCount++;
      else masteredCount++;
    }

    const aiSessionStats = {
      totalAttempts,
      correctAnswers: params.sessionStats.correct || 0,
      incorrectAnswers: params.sessionStats.incorrect || 0,
      stillLearningAnswers: params.sessionStats.still_learning || 0,
      sessionStartTime: context.sessionStartTime,
      sessionDuration: (params.sessionStats.duration || 0) as number,
      consecutiveIncorrect: 0,
      masteredCount,
      stillLearningCount,
      incorrectCount,
      newCount,
      consecutiveCorrect: params.sessionStats.consecutiveCorrect || 0,
    };

    // AICoordinatorが必須
    if (!this.useAICoordinator || !this.aiCoordinator) {
      logger.warn(
        '[QuestionScheduler FinalPriority] AICoordinatorが未初期化、ハイブリッドモードにフォールバック'
      );
      return this.scheduleHybridMode(params, startTime);
    }

    // 🐛 DEBUG: AIループ前の入力チェック（S_1）
    let beforeAISpanId: string | undefined;
    if (import.meta.env.DEV) {
      const weakWordsInInput = params.questions.filter((q) => {
        const wp = allProgress[q.word] ?? context.wordProgress[q.word] ?? null;
        if (!wp) return false;
        const attempts = wp.memorizationAttempts ?? wp.totalAttempts ?? 0;
        if (attempts <= 0) return false;
        const pos = determineWordPosition(
          wp,
          params.mode as 'memorization' | 'translation' | 'spelling' | 'grammar'
        );
        return pos >= 40;
      });

      beforeAISpanId = DebugTracer.startSpan('QuestionScheduler.finalPriorityMode.beforeAI', {
        weakWordsCount: weakWordsInInput.length,
        totalCount: params.questions.length,
        weakWords: weakWordsInInput.map((q) => q.word),
      });
    }

    // 各問題にAICoordinatorのfinalPriorityを取得
    const prioritized: PrioritizedQuestion[] = [];
    for (const question of params.questions) {
      const wordProgress =
        allProgress[question.word] ?? context.wordProgress[question.word] ?? null;

      // ✅ finalPriorityModeでも通常モードと同じ「attempts」定義を使う
      // GamificationAI（まだまだブースト/新規インターリーブ）は pq.attempts を参照するため必須
      const cachedStatus = this.getWordStatusFromCache(question.word, context.mode, progressCache);

      // Position決定（モード別）
      const position =
        cachedStatus?.position ??
        determineWordPosition(
          wordProgress,
          params.mode as 'memorization' | 'translation' | 'spelling' | 'grammar'
        );

      // status（モード別attempts/カテゴリを優先）
      let fallbackAttempts = 0;
      let fallbackCorrect = 0;
      if (wordProgress) {
        switch (params.mode) {
          case 'memorization':
            fallbackAttempts = wordProgress.memorizationAttempts || 0;
            fallbackCorrect = wordProgress.memorizationCorrect || 0;
            break;
          case 'translation':
            fallbackAttempts = wordProgress.translationAttempts || 0;
            fallbackCorrect = wordProgress.translationCorrect || 0;
            break;
          case 'spelling':
            fallbackAttempts = wordProgress.spellingAttempts || 0;
            fallbackCorrect = wordProgress.spellingCorrect || 0;
            break;
          case 'grammar':
            fallbackAttempts = wordProgress.grammarAttempts || 0;
            fallbackCorrect = wordProgress.grammarCorrect || 0;
            break;
          default:
            break;
        }
      }

      const status: WordStatus = cachedStatus ?? {
        category: positionToCategory(position),
        position,
        lastStudied: wordProgress?.lastStudied || 0,
        attempts: fallbackAttempts,
        correct: fallbackCorrect,
        streak: wordProgress?.consecutiveCorrect || 0,
        forgettingRisk: 0,
        reviewInterval: 1,
      };

      // AICoordinator分析（非同期）
      const aiResult = await this.aiCoordinator.analyzeAndCoordinate(
        {
          // AIAnalysisInput 仕様に合わせる
          word: {
            word: question.word,
            meaning: question.meaning,
            reading: question.reading,
            difficulty: question.difficulty,
            category: question.category,
            source: question.source,
            type: question.type,
            isPhraseOnly: question.isPhraseOnly,
          },
          progress: wordProgress,
          sessionStats: aiSessionStats,
          currentTab,
          allProgress,
        },
        position / 100 // basePriority（0-1）
      );

      prioritized.push({
        question,
        position,
        finalPriority: aiResult.finalPriority, // AIの判定を主因にする
        status,
        attempts: status?.attempts ?? 0,
        timeBoost: 1.0,
      });
    }

    // 🐛 DEBUG: AIループ完了後のチェック（S_2）
    if (import.meta.env.DEV) {
      // beforeAIスパンを終了
      if (beforeAISpanId) {
        const weakWordsAfterLoop = prioritized.filter((pq) => {
          if (!pq.status) return false;
          const attempts = pq.status.attempts ?? 0;
          if (attempts <= 0) return false;
          return pq.position >= 40;
        });
        DebugTracer.endSpan(beforeAISpanId, {
          weakWordsCount: weakWordsAfterLoop.length,
          totalCount: prioritized.length,
          weakWords: weakWordsAfterLoop.map((pq) => pq.question.word),
        });
      }

      const weakWordsInPrioritized = prioritized.filter((pq) => {
        if (!pq.status) return false;
        const attempts = pq.status.attempts ?? 0;
        if (attempts <= 0) return false;
        return pq.position >= 40;
      });

      const afterAISpanId = DebugTracer.startSpan('QuestionScheduler.finalPriorityMode.afterAI', {
        weakWordsCount: weakWordsInPrioritized.length,
        totalCount: prioritized.length,
        weakWords: weakWordsInPrioritized.map((pq) => pq.question.word),
      });

      // afterAIスパンもすぐに終了
      DebugTracer.endSpan(afterAISpanId, {
        weakWordsCount: weakWordsInPrioritized.length,
        totalCount: prioritized.length,
        weakWords: weakWordsInPrioritized.map((pq) => pq.question.word),
      });

      // トレース終了
      DebugTracer.endTrace();
    }

    // 🎮 GamificationAI: まだまだ語をブースト
    // NOTE: finalPriorityModeでは、Position引き上げだけでは効果がないため、
    // finalPriorityを直接ブーストして、まだまだ語を最優先にする
    const gamificationAI = new GamificationAI();
    const boostedResult = gamificationAI.boostStillLearningQuestions(prioritized);
    const boostedPrioritized = boostedResult.result;

    // 🔥 まだまだ語のfinalPriorityをブースト（Position 60-69の単語を最優先）
    for (const pq of boostedPrioritized) {
      if (pq.position >= 60 && pq.position < 70 && (pq.status?.attempts ?? 0) > 0) {
        // まだまだ語のfinalPriorityを大幅にブースト（+100.0）
        // これにより、AIの評価に関係なく、まだまだ語が上位に来る
        pq.finalPriority = (pq.finalPriority ?? 0) + 100.0;
      }
    }

    if (import.meta.env.DEV) {
      const weakWordsAfterBoost = boostedPrioritized.filter(
        (pq) => pq.position >= 40 && (pq.status?.attempts ?? 0) > 0
      );
      const weakWordsInTop10 = boostedPrioritized
        .sort((a, b) => (b.finalPriority ?? 0) - (a.finalPriority ?? 0))
        .slice(0, 10)
        .filter((pq) => pq.position >= 40 && (pq.status?.attempts ?? 0) > 0);

      console.log('🎮 [finalPriorityMode] GamificationAI ブースト後:', {
        totalQuestions: boostedPrioritized.length,
        weakWordsCount: weakWordsAfterBoost.length,
        weakWordsInTop10: weakWordsInTop10.length,
        weakWordsTop5: weakWordsInTop10.slice(0, 5).map((pq) => ({
          word: pq.question.word,
          position: pq.position,
          finalPriority: pq.finalPriority ?? 0,
        })),
      });
    }

    // ✅ 新規混入（Position分散 → インターリーブ）
    // finalPriorityModeでも「分からない連打で新規が一切出ない」を避ける
    // - Position分散: 新規の一部を40-59へ引き上げ（まだまだ/分からないより下位）
    // - インターリーブ: [苦手語3-5問, 新規1問] を混ぜる
    const { result: adjustedForNew } =
      gamificationAI.adjustPositionForInterleaving(boostedPrioritized);

    // finalPriority降順ソート（AIの判定 + GamificationAIブーストを最優先）
    const sorted = [...adjustedForNew].sort(
      (a, b) => (b.finalPriority ?? 0) - (a.finalPriority ?? 0)
    );

    // カテゴリ別インターリーブ（苦手語とPosition引き上げ新規語を交互配置）
    const interleaved = gamificationAI.interleaveByCategory(sorted);

    // 📊 localStorage保存: finalPriorityモードのTOP30（デバッグパネル/コピペ用）
    try {
      const top30Final = interleaved.slice(0, 30).map((pq, idx) => ({
        rank: idx + 1,
        word: pq.question.word,
        position: pq.position,
        finalPriority: pq.finalPriority ?? 0,
        category: pq.status?.category,
        attempts: pq.status?.attempts ?? 0,
      }));
      localStorage.setItem('debug_finalPriority_output', JSON.stringify(top30Final));
      localStorage.setItem(
        `debug_finalPriority_output_${context.mode}`,
        JSON.stringify(top30Final)
      );

      const statsPayload = {
        currentTab,
        totalQuestions: params.questions.length,
        allProgressCount: Object.keys(allProgress || {}).length,
        aiSessionStats,
        timestamp: new Date().toISOString(),
        mode: context.mode,
      };
      localStorage.setItem('debug_finalPriority_sessionStats', JSON.stringify(statsPayload));
      localStorage.setItem(
        `debug_finalPriority_sessionStats_${context.mode}`,
        JSON.stringify(statsPayload)
      );
    } catch {
      // localStorage失敗は無視
    }

    // 後処理
    const questions = this.postProcess(interleaved, context);

    // 📊 localStorage保存: postProcess後のTOP30（finalPriorityMode）
    // NOTE: mode別キーも併記して、translation等の30問テストで上書きされないようにする
    try {
      const top30 = questions.slice(0, 30).map((q) => {
        const pq = interleaved.find((pq) => pq.question.word === q.word);
        return {
          word: q.word,
          position: pq?.position || (q as any).position || 0,
          category: pq?.status?.category,
          attempts: pq?.status?.attempts || 0,
          finalPriority: pq?.finalPriority ?? (q as any).finalPriority ?? 0,
        };
      });

      const payload = {
        timestamp: new Date().toISOString(),
        mode: context.mode,
        source: 'scheduleFinalPriorityMode',
        top30,
      };

      localStorage.setItem('debug_postProcess_output', JSON.stringify(payload));
      localStorage.setItem(`debug_postProcess_output_${context.mode}`, JSON.stringify(payload));
    } catch {
      // ignore
    }

    // 振動スコア計算
    const vibrationScore = this.antiVibration.calculateVibrationScore(
      interleaved,
      context.recentAnswers,
      20
    );

    const processingTime = performance.now() - startTime;

    logger.info(`[QuestionScheduler FinalPriority] スケジューリング完了`, {
      processingTime: Math.round(processingTime) + 'ms',
      vibrationScore,
      aiEnabled: true,
      totalCount: questions.length,
      top5FinalPriority: interleaved.slice(0, 5).map((pq) => ({
        word: pq.question.word,
        finalPriority: (pq.finalPriority ?? 0).toFixed(3),
        position: pq.position,
      })),
    });

    return {
      scheduledQuestions: questions,
      vibrationScore,
      processingTime,
      signalCount: signals.length,
    };
  }

  /**
   * 後処理 - 関連語グループ化による出題順序の最適化
   *
   * 重要制約: Position階層（70-100 > 60-69 > 40-59 > 20-39 > 0-19）を絶対に保持
   * 各Position範囲内でのみ並べ替えを行い、範囲間の順序は維持する
   */
  private postProcess(questions: PrioritizedQuestion[], context: ScheduleContext): Question[] {
    // 基本的な変換
    // NOTE: 各タブで「再出題差し込み」「Position不整合検知」を共通で扱えるよう、
    // schedule()の返却QuestionにもPositionを付与する（UXは変えず、データのみ追加）。
    const baseQuestions = questions.map(
      (pq) =>
        ({
          ...pq.question,
          position: pq.position,
          finalPriority: pq.finalPriority,
        }) as unknown as Question
    );

    // ✅ インターリーブ済みの順序を保持
    // sortAndBalance() で GamificationAI.interleaveByCategory() により
    // Position階層を跨いだ交互配置が既に適用されている場合、ここでPosition帯域ごとに
    // 再構成すると「新規が前に来ない（分からない連打で新規が消える）」状態を作る。
    // そのため、順序が“厳密なPosition帯域の単調並び”になっていない場合は、後処理の
    // 並べ替え（関連語グループ化）をスキップして既存順序を返す。
    const bandIndex = (pos: number) => {
      if (pos >= 70) return 0;
      if (pos >= 60) return 1;
      if (pos >= 40) return 2;
      if (pos >= 20) return 3;
      return 4;
    };

    let isInterleavedAcrossBands = false;
    let prevBand = -1;
    for (const pq of questions) {
      const b = bandIndex(pq.position);
      if (prevBand !== -1 && b < prevBand) {
        isInterleavedAcrossBands = true;
        break;
      }
      prevBand = b;
    }

    // デバッグ用: postProcessの挙動を保存（パネルで原因切り分けに使う）
    // NOTE: mode別キーも併記して、translation等の30問テストで上書きされないようにする
    try {
      const top30 = questions.slice(0, 30).map((pq) => ({
        word: pq.question.word,
        position: pq.position ?? 0,
        attempts: pq.status?.attempts ?? 0,
      }));

      const payload = {
        timestamp: new Date().toISOString(),
        mode: context.mode,
        isInterleavedAcrossBands,
        action: isInterleavedAcrossBands
          ? 'skipped_contextual_reorder'
          : 'applied_contextual_reorder',
        top30,
      };

      localStorage.setItem('debug_postProcess_meta', JSON.stringify(payload));
      localStorage.setItem(`debug_postProcess_meta_${context.mode}`, JSON.stringify(payload));
    } catch {
      // ignore
    }

    if (isInterleavedAcrossBands) {
      return baseQuestions;
    }

    // 関連語グループ化機能を適用（contextualLearningAI）
    try {
      const allProgress = this.getAllProgress();
      const _recentlyStudied = this.getRecentlyStudiedWords(context);

      // Position範囲ごとに分割（階層を保持するため）
      const positionBands = this.splitByPositionBands(questions, context);

      const reorderedQuestions: Question[] = [];
      let totalClusters = 0;
      let totalTransitions = 0;

      // 各Position範囲内で独立に並べ替え
      for (const band of positionBands) {
        if (band.questions.length === 0) continue;

        const bandQuestions = band.questions.map(
          (pq) =>
            ({
              ...pq.question,
              position: pq.position,
              finalPriority: pq.finalPriority,
            }) as unknown as Question
        );

        // Position範囲内でのみ関連語グループ化
        const contextualResult = generateContextualSequence(
          bandQuestions,
          allProgress,
          // schedule結果から「出題自体」を除外しないため、recentlyStudiedは渡さない
          // （generateContextualSequenceはrecentlyStudiedをsequenceから除外する設計）
          []
        );

        // 最適化されたsequenceに従って並び替え（範囲内のみ）
        const questionMap = new Map(bandQuestions.map((q) => [q.word, q]));
        const bandReordered = contextualResult.sequence
          .map((word) => questionMap.get(word))
          .filter((q): q is Question => q !== undefined);

        reorderedQuestions.push(...bandReordered);
        totalClusters += contextualResult.clusters.length;
        totalTransitions += contextualResult.transitions.length;
      }

      // デバッグログ（開発時のみ）- 関連語グループ化の詳細を可視化
      if (import.meta.env.DEV && totalTransitions > 0) {
        // Position範囲ごとの統計
        const bandsInfo = positionBands.map((b) => ({
          range: b.range,
          count: b.questions.length,
          clusterCount: 0, // あとで計算
          transitionCount: 0,
        }));

        // 関連性遷移の詳細（最初の10個のみ）
        const debugTransitions: any[] = [];
        let bandIdx = 0;
        for (const band of positionBands) {
          if (band.questions.length === 0) continue;

          const bandQuestions = band.questions.map((pq) => pq.question);
          const contextualResult = generateContextualSequence(bandQuestions, allProgress, []);

          bandsInfo[bandIdx].clusterCount = contextualResult.clusters.length;
          bandsInfo[bandIdx].transitionCount = contextualResult.transitions.length;

          // 最初の3遷移のみ記録
          debugTransitions.push(
            ...contextualResult.transitions.slice(0, 3).map((t) => ({
              band: band.range,
              from: t.from,
              to: t.to,
              reason: t.reason,
            }))
          );

          bandIdx++;
        }

        logger.info('[postProcess] 関連語グループ化適用（Position階層保持）:', {
          positionBands: positionBands.length,
          totalClusters,
          totalTransitions,
          bandsInfo,
          sampleTransitions: debugTransitions.slice(0, 10), // 最大10個
        });
      }

      // 📊 postProcess後のTOP30を保存（デバッグパネル用）
      // NOTE: read側は { top30: [...] } のみを前提にする
      try {
        const top30 = reorderedQuestions.slice(0, 30).map((q, idx) => ({
          rank: idx + 1,
          word: q.word,
          position: (q as any).position ?? 0,
          attempts: (q as any).attempts ?? 0,
        }));

        // Position分布を計算
        const positionDistribution = {
          incorrect: top30.filter((q) => q.position >= 70).length,
          stillLearning: top30.filter((q) => q.position >= 60 && q.position < 70).length,
          newBoosted: top30.filter((q) => q.position >= 40 && q.position < 60).length,
          newNormal: top30.filter((q) => q.position >= 20 && q.position < 40).length,
          mastered: top30.filter((q) => q.position < 20).length,
        };

        const payload = {
          timestamp: new Date().toISOString(),
          mode: context.mode,
          source: 'postProcess',
          top30,
          positionDistribution,
          totalQuestions: reorderedQuestions.length,
        };

        localStorage.setItem('debug_postProcess_output', JSON.stringify(payload));
        localStorage.setItem(`debug_postProcess_output_${context.mode}`, JSON.stringify(payload));
      } catch {
        // localStorage失敗は無視
      }

      return reorderedQuestions;
    } catch (error) {
      // エラー時はフォールバック
      logger.warn('[postProcess] 関連語グループ化でエラー、基本順序を使用:', error);
      return baseQuestions;
    }
  }

  /**
   * Position範囲でグループ化（階層の不変条件を保持）
   *
   * Position階層:
   * - 70-100: incorrect（分からない）← 第1優先
   * - 60-69:  still_learning (boosted) ← 第2優先
   * - 40-59:  new (boosted) ← 第3優先
   * - 20-39:  new (normal) ← 第4優先
   * - 0-19:   mastered ← 第5優先
   */
  private splitByPositionBands(
    questions: PrioritizedQuestion[],
    _context: ScheduleContext
  ): Array<{ range: string; questions: PrioritizedQuestion[] }> {
    const bands = [
      { range: '70-100 (incorrect)', min: 70, max: 100, questions: [] as PrioritizedQuestion[] },
      { range: '60-69 (still_learning)', min: 60, max: 69, questions: [] as PrioritizedQuestion[] },
      { range: '40-59 (new boosted)', min: 40, max: 59, questions: [] as PrioritizedQuestion[] },
      { range: '20-39 (new normal)', min: 20, max: 39, questions: [] as PrioritizedQuestion[] },
      { range: '0-19 (mastered)', min: 0, max: 19, questions: [] as PrioritizedQuestion[] },
    ];

    questions.forEach((pq) => {
      const position = pq.position;

      for (const band of bands) {
        if (position >= band.min && position <= band.max) {
          band.questions.push(pq);
          break;
        }
      }
    });

    // Position範囲順（降順）で返す
    return bands.filter((b) => b.questions.length > 0);
  }

  /**
   * 最近学習した単語リストを取得（直近20語）
   */
  private getRecentlyStudiedWords(context: ScheduleContext): string[] {
    const recentWords: string[] = [];
    const now = Date.now();
    const recentThreshold = 5 * 60 * 1000; // 5分以内

    for (const [word, progress] of Object.entries(context.wordProgress)) {
      const lastStudied = progress?.lastStudied;
      if (lastStudied && now - new Date(lastStudied).getTime() < recentThreshold) {
        recentWords.push(word);
      }
    }

    return recentWords.slice(-20); // 最新20語
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.recentAnswersCache.clear();
    logger.info('[QuestionScheduler] キャッシュクリア完了');
  }

  /**
   * AI統合用: 単語の進捗データを取得
   */
  private getWordProgress(word: string): any | null {
    try {
      const progress = loadProgressSync();
      return progress.wordProgress?.[word] || null;
    } catch {
      return null;
    }
  }

  /**
   * AI統合用: すべての単語進捗データを取得
   */
  private getAllProgress(): Record<string, any> {
    try {
      const progress = loadProgressSync();
      return progress.wordProgress || {};
    } catch {
      return {};
    }
  }

  /**
   * AI統合用: セッション統計を変換
   */
  private convertToAISessionStats(stats: any): AISessionStats {
    return {
      totalAttempts: stats.correct + stats.incorrect + stats.still_learning,
      correctAnswers: stats.correct || 0,
      incorrectAnswers: stats.incorrect || 0,
      stillLearningAnswers: stats.still_learning || 0,
      sessionStartTime: Date.now() - (stats.duration || 0),
      sessionDuration: stats.duration || 0,
      avgResponseTime: stats.avgResponseTime,
      consecutiveIncorrect: stats.consecutiveIncorrect || 0,
      masteredCount: stats.masteredCount || 0,
      stillLearningCount: stats.still_learningCount || 0,
      incorrectCount: stats.incorrectCount || 0,
      newCount: stats.newCount || 0,
    };
  }

  /**
   * 解答後のPosition再計算（Phase 1.2: progressStorageから移動）
   *
   * @param word - 単語名（AI評価履歴記録用）
   * @param progress - 単語の進捗情報
   * @param mode - 学習モード（各タブで独立した計算のため）
   * @returns Position スコア（0-100）
   *
   * Position計算:
   * すべてdetermineWordPosition()で実施済み
   * - BaseScore: 50 - (accuracy × 30) + (consecutiveErrors × 10)
   * - AI評価: 7つのAI評価を重み付き統合
   * - TimeBoost: min(daysSince × 2, 20)
   */
  public recalculatePriorityAfterAnswer(
    word: string,
    progress: WordProgress,
    mode: 'memorization' | 'translation' | 'spelling' | 'grammar' = 'memorization'
  ): number {
    // ✅ Position = 0-100スコア（7つのAI評価統合済み、タブ別）
    // 解答直後は progress の各カウンタが更新された直後なので、
    // 直前に保存されている tab別Position（savedPosition）は“古い値”になり得る。
    // ここでは savedPosition を一時的に無視して再計算する（解答結果を即反映）。
    const positionBefore = (() => {
      switch (mode) {
        case 'memorization':
          return progress.memorizationPosition ?? 50;
        case 'translation':
          return progress.translationPosition ?? 50;
        case 'spelling':
          return progress.spellingPosition ?? 50;
        case 'grammar':
          return progress.grammarPosition ?? 50;
        default:
          return 50;
      }
    })();

    const position = this.determinePositionAfterAnswer(progress, mode);

    // デバッグ用: savedPositionを考慮した通常計算結果も採取（savedPosition固定が原因の切り分け用）
    const positionWithSavedPosition = determineWordPosition(progress, mode);
    const savedDecision = getSavedPositionDecisionForDebug(progress, mode);

    // 時間経過計算（デバッグ用）
    const daysSinceLastStudy =
      (Date.now() - (progress.lastStudied || Date.now())) / (1000 * 60 * 60 * 24);

    // Position範囲からcategoryを派生（デバッグ表示用）
    const bucket = positionToCategory(position);

    // 正答率を計算
    const totalAttempts = progress.correctCount + progress.incorrectCount;
    progress.accuracyRate = totalAttempts > 0 ? progress.correctCount / totalAttempts : 0;

    // モード別統計（デバッグ用）
    let modeAttempts = 0;
    let modeCorrect = 0;
    let modeStillLearning = 0;
    switch (mode) {
      case 'memorization':
        modeAttempts = progress.memorizationAttempts || 0;
        modeCorrect = progress.memorizationCorrect || 0;
        modeStillLearning = progress.memorizationStillLearning || 0;
        break;
      case 'translation':
        modeAttempts = progress.translationAttempts || 0;
        modeCorrect = progress.translationCorrect || 0;
        break;
      case 'spelling':
        modeAttempts = progress.spellingAttempts || 0;
        modeCorrect = progress.spellingCorrect || 0;
        break;
      case 'grammar':
        modeAttempts = progress.grammarAttempts || 0;
        modeCorrect = progress.grammarCorrect || 0;
        break;
    }

    // 🔍 解答直後のPosition計算ログをlocalStorageに保存
    try {
      const answerLog = {
        timestamp: new Date().toISOString(),
        word,
        mode,
        positionBefore,
        positionAfter: position,
        positionWithSavedPosition,
        category: bucket,
        savedPositionDebug: savedDecision,
        progress: {
          correctCount: progress.correctCount,
          incorrectCount: progress.incorrectCount,
          consecutiveCorrect: progress.consecutiveCorrect || 0,
          consecutiveIncorrect: progress.consecutiveIncorrect || 0,
          accuracy: progress.accuracyRate || 0,
          modeAttempts,
          modeCorrect,
          modeStillLearning,
        },
      };

      const stored = localStorage.getItem('debug_answer_logs');
      const logs = stored ? JSON.parse(stored) : [];
      logs.push(answerLog);
      // 最新20件のみ保持
      if (logs.length > 20) logs.shift();
      localStorage.setItem('debug_answer_logs', JSON.stringify(logs));
    } catch {
      // localStorage失敗は無視
    }

    // デバッグ用: AI評価をlocalStorageに記録
    if (import.meta.env.DEV) {
      const aiProposals = this.calculateAIEvaluations(progress, position, daysSinceLastStudy);
      this.recordAIEvaluation(word, {
        category: bucket,
        position,
        aiProposals, // ✅ 7つのAI提案を記録
        consecutiveCorrect: progress.consecutiveCorrect || 0,
        consecutiveIncorrect: progress.consecutiveIncorrect || 0,
        accuracy: progress.accuracyRate || 0,
        attempts: totalAttempts,
        daysSince: daysSinceLastStudy,
        timestamp: new Date().toISOString(),
      });
    }

    return position; // ✅ Position（0-100）を返却
  }

  /**
   * 7つのAIからPosition提案を計算（デバッグ用）
   */
  private calculateAIEvaluations(
    progress: WordProgress,
    _position: number,
    daysSinceLastStudy: number
  ): Record<string, number> {
    const totalAttempts = progress.correctCount + progress.incorrectCount;
    const accuracy = totalAttempts > 0 ? progress.correctCount / totalAttempts : 0;
    const consecutiveCorrect = progress.consecutiveCorrect || 0;
    const consecutiveIncorrect = progress.consecutiveIncorrect || 0;

    // 各AIのインスタンス生成
    const memoryAI = new MemoryAI();
    const cognitiveLoadAI = new CognitiveLoadAI();
    const errorPredictionAI = new ErrorPredictionAI();
    const linguisticAI = new LinguisticAI();
    const contextualAI = new ContextualAI();
    const learningStyleAI = new LearningStyleAI();
    const gamificationAI = new GamificationAI();

    return {
      memory: memoryAI.proposePosition(progress, '', daysSinceLastStudy, accuracy, totalAttempts),
      cognitiveLoad: cognitiveLoadAI.proposePosition(progress, consecutiveIncorrect),
      errorPrediction: errorPredictionAI.proposePosition(progress, accuracy, totalAttempts),
      linguistic: linguisticAI.proposePosition(progress, accuracy),
      contextual: contextualAI.proposePosition(progress, daysSinceLastStudy),
      learningStyle: learningStyleAI.proposePosition(progress, accuracy, totalAttempts),
      gamification: gamificationAI.proposePosition(progress, consecutiveCorrect, accuracy),
    };
  }

  /**
   * AI評価をlocalStorageに記録
   */
  private recordAIEvaluation(word: string, evaluation: any): void {
    try {
      const key = 'debug_ai_evaluations';
      const stored = localStorage.getItem(key);
      const evaluations = stored ? JSON.parse(stored) : {};

      // ✅ evaluation オブジェクトに word を追加
      evaluations[word] = { ...evaluation, word };

      // 最新100件のみ保持
      const entries = Object.entries(evaluations);
      if (entries.length > 100) {
        const latest = Object.fromEntries(entries.slice(-100));
        localStorage.setItem(key, JSON.stringify(latest));
      } else {
        localStorage.setItem(key, JSON.stringify(evaluations));
      }

      // コンソールに表示形式で出力
      const aiEvalMap = (evaluation?.aiEvaluations ?? evaluation?.aiProposals ?? {}) as Record<
        string,
        number
      >;
      const aiScores = Object.values(aiEvalMap)
        .map((v) => Number(v).toFixed(1))
        .join('/');
      const finalPriority = Number(evaluation?.finalPriority ?? evaluation?.position ?? 0);
      console.log(
        `🤖 [AI評価] ${word}: ${finalPriority.toFixed(1)}[${aiScores}] (${evaluation?.category ?? 'n/a'})`
      );
    } catch {
      // localStorage失敗は無視
    }
  }

  /**
   * Position計算（統一ユーティリティを使用）
   * @returns Position スコア（0-100）
   */
  private determinePosition(
    progress: WordProgress,
    mode: 'memorization' | 'translation' | 'spelling' | 'grammar' = 'memorization'
  ): number {
    return determineWordPosition(progress, mode);
  }

  /**
   * 解答直後のPosition再計算専用。
   * 直前に保存された tab別Position（savedPosition）があると determineWordPosition() が早期returnし、
   * 「まだまだ/分からない」など今回の解答結果が反映されないことがあるため、ここでは無視して計算する。
   */
  private determinePositionAfterAnswer(
    progress: WordProgress,
    mode: 'memorization' | 'translation' | 'spelling' | 'grammar' = 'memorization'
  ): number {
    const progressForCalc: WordProgress = { ...progress };
    switch (mode) {
      case 'memorization':
        progressForCalc.memorizationPosition = undefined;
        break;
      case 'translation':
        progressForCalc.translationPosition = undefined;
        break;
      case 'spelling':
        progressForCalc.spellingPosition = undefined;
        break;
      case 'grammar':
        progressForCalc.grammarPosition = undefined;
        break;
    }
    return determineWordPosition(progressForCalc, mode);
  }

  /**
   * 🔒 強制装置: position判定時に自動適用
   *
   * まだまだ（still_learning）・分からない（incorrect）の問題は
   * 自動的に高優先度で再出題される
   *
   * この判定はrecalculatePriorityAfterAnswer()で自動的に実行される
   * UI層での追加実装は不要
   */
  private enforceCompletionRequirement(position: number): number {
    // incorrect（分からない 70-100）: 最優先で再出題
    if (position >= 70) {
      return 100;
    }
    // still_learning（まだまだ 40-70）: 高優先度で再出題
    if (position >= 40) {
      return 75;
    }
    // mastered (0-20) / new (20-40): 通常優先度
    return position < 20 ? 10 : 50;
  }

  /**
   * 🎯 難易度別適応学習: 中級・上級の正答率計算
   *
   * 目的: 中級・上級の正答率が悪い場合、初級の習熟を優先させる
   *
   * @param progressCache - プログレスキャッシュ
   * @returns 難易度別の正答率と推奨戦略
   */
  private calculateDifficultyAdaptation(progressCache: any): {
    beginner: number;
    intermediate: number;
    advanced: number;
    shouldPrioritizeBeginner: boolean;
    priorityBoost: number; // 初級への優先度ブースト（0-20）
  } {
    if (!progressCache || !progressCache.wordProgress) {
      return {
        beginner: 70,
        intermediate: 60,
        advanced: 50,
        shouldPrioritizeBeginner: false,
        priorityBoost: 0,
      };
    }

    const wordProgresses = Object.values(progressCache.wordProgress || {}) as any[];

    // 難易度別の正答率計算
    const difficultyStats = {
      beginner: { correct: 0, total: 0 },
      intermediate: { correct: 0, total: 0 },
      advanced: { correct: 0, total: 0 },
    };

    wordProgresses.forEach((wp: any) => {
      const difficultyMap: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {
        初級: 'beginner',
        中級: 'intermediate',
        上級: 'advanced',
      };
      const difficulty = difficultyMap[wp.difficulty as string];

      if (difficulty && difficultyStats[difficulty]) {
        const total = (wp.correctCount || 0) + (wp.incorrectCount || 0);
        difficultyStats[difficulty].total += total;
        difficultyStats[difficulty].correct += wp.correctCount || 0;
      }
    });

    const accuracy = {
      beginner:
        difficultyStats.beginner.total > 0
          ? (difficultyStats.beginner.correct / difficultyStats.beginner.total) * 100
          : 70,
      intermediate:
        difficultyStats.intermediate.total > 0
          ? (difficultyStats.intermediate.correct / difficultyStats.intermediate.total) * 100
          : 60,
      advanced:
        difficultyStats.advanced.total > 0
          ? (difficultyStats.advanced.correct / difficultyStats.advanced.total) * 100
          : 50,
    };

    // 🎯 判定: 中級・上級の正答率が悪い場合、初級を優先
    // 条件: 中級 < 60% OR 上級 < 50%
    const shouldPrioritizeBeginner = accuracy.intermediate < 60 || accuracy.advanced < 50;

    // 優先度ブースト計算: 中級・上級の正答率が低いほど初級のブーストが大きい
    let priorityBoost = 0;
    if (shouldPrioritizeBeginner) {
      const intermediateGap = Math.max(0, 60 - accuracy.intermediate);
      const advancedGap = Math.max(0, 50 - accuracy.advanced);
      priorityBoost = Math.min(20, (intermediateGap + advancedGap) / 2); // 最大20点
    }

    return {
      ...accuracy,
      shouldPrioritizeBeginner,
      priorityBoost,
    };
  }

  /**
   * 🎯 難易度別適応: Position調整
   *
   * 中級・上級の正答率が悪い場合:
   * - 初級の問題: Position を下げる（優先度UP）
   * - 中級・上級: Position を少し上げる（優先度DOWN、ただし完全に避けない）
   *
   * @param position - 元のPosition
   * @param question - 問題
   * @param adaptation - 難易度適応情報
   * @returns 調整後のPosition
   */
  private applyDifficultyAdaptation(
    position: number,
    question: Question,
    adaptation: ReturnType<typeof this.calculateDifficultyAdaptation>
  ): number {
    if (!adaptation.shouldPrioritizeBeginner) {
      return position; // 適応不要
    }

    const difficultyMap: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {
      初級: 'beginner',
      中級: 'intermediate',
      上級: 'advanced',
    };
    const difficulty = difficultyMap[question.difficulty];

    if (!difficulty) {
      return position; // 難易度情報なし
    }

    // 🎯 初級を優先: Position を下げる（優先度UP）
    if (difficulty === 'beginner') {
      return Math.max(0, position - adaptation.priorityBoost);
    }

    // ⚠️ 中級・上級を少し抑える: Position を上げる（優先度DOWN）
    // ただし完全に避けるわけではない（最大+10点）
    if (difficulty === 'intermediate' || difficulty === 'advanced') {
      return Math.min(100, position + Math.min(10, adaptation.priorityBoost / 2));
    }

    return position;
  }
}
