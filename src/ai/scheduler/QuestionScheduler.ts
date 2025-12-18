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
import { AntiVibrationFilter } from './AntiVibrationFilter';
import { logger } from '@/utils/logger';

export class QuestionScheduler {
  private antiVibration: AntiVibrationFilter;
  private recentAnswersCache: Map<string, RecentAnswer[]> = new Map();

  constructor() {
    this.antiVibration = new AntiVibrationFilter();
  }

  /**
   * 問題をスケジューリング（メインAPI）
   *
   * @param params スケジューリングパラメータ
   * @returns スケジューリング結果
   */
  schedule(params: ScheduleParams): ScheduleResult {
    const startTime = performance.now();

    const debugInfo = {
      timestamp: new Date().toISOString(),
      mode: params.mode,
      questionCount: params.questions.length,
      useMetaAI: params.useMetaAI,
      hybridMode: params.hybridMode || false,
      firstQuestions: params.questions.slice(0, 10).map(q => q.word),
    };

    console.log('🔥🔥🔥 [QuestionScheduler] スケジューリング開始', debugInfo);

    // localStorage に保存（デバッグ用）
    try {
      const existing = JSON.parse(localStorage.getItem('debug_scheduler_calls') || '[]');
      existing.push(debugInfo);
      if (existing.length > 10) existing.shift(); // 最新10件のみ保持
      localStorage.setItem('debug_scheduler_calls', JSON.stringify(existing));
    } catch {
      // ignore
    }

    // ハイブリッドモード: 既存AIの順序を尊重
    if (params.hybridMode) {
      return this.scheduleHybridMode(params, startTime);
    }

    // 1. コンテキスト構築
    const context = this.buildContext(params);

    // 2. シグナル検出（メタAI統合）
    const signals = params.useMetaAI ? this.detectSignals(context) : [];

    // 3. 優先度計算（DTA統合）
    const prioritized = this.calculatePriorities(params.questions, context, signals, false);

    // 4. 振動防止フィルター適用
    const filtered = this.applyAntiVibration(prioritized, context);

    // 5. ソート・バランス調整
    const sorted = this.sortAndBalance(filtered, params);

    // 6. 後処理
    const questions = this.postProcess(sorted, context);

    // 7. 振動スコア計算
    const vibrationScore = this.antiVibration.calculateVibrationScore(
      sorted,
      context.recentAnswers,
      20
    );

    const processingTime = performance.now() - startTime;

    const resultDebug = {
      top10Words: questions.slice(0, 10).map(q => q.word),
      top10Priorities: sorted.slice(0, 10).map(pq => ({ word: pq.question.word, priority: pq.priority })),
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

    return {
      scheduledQuestions: questions,
      vibrationScore,
      processingTime,
      signalCount: signals.length,
      debug: {
        dtaApplied: sorted.filter(pq => pq.status?.category === 'mastered').length,
        antiVibrationApplied: sorted.filter(pq => pq.antiVibrationApplied).length,
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

    return {
      mode: params.mode,
      sessionStats: params.sessionStats,
      recentAnswers,
      timeOfDay,
      cognitiveLoad,
      useMetaAI: params.useMetaAI || false,
      isReviewFocusMode: params.isReviewFocusMode || false,
      sessionStartTime: Date.now() - (params.sessionStats.duration || 0),
    };
  }

  /**
   * 認知負荷を計算（0-1）
   */
  private calculateCognitiveLoad(stats: ScheduleParams['sessionStats']): number {
    const errorRate = stats.correct + stats.incorrect > 0
      ? stats.incorrect / (stats.correct + stats.incorrect)
      : 0;

    const sessionMinutes = (stats.duration || 0) / 60000;
    const timeLoad = Math.min(sessionMinutes / 30, 1); // 30分で最大

    return Math.min((errorRate * 0.7) + (timeLoad * 0.3), 1);
  }

  /**
   * 最近の解答履歴を取得（最大100件）
   */
  private getRecentAnswers(mode: string): RecentAnswer[] {
    // キャッシュチェック
    if (this.recentAnswersCache.has(mode)) {
      return this.recentAnswersCache.get(mode)!;
    }

    const key = 'english-progress';
    const stored = localStorage.getItem(key);
    if (!stored) return [];

    try {
      const progress = JSON.parse(stored);
      const answers: RecentAnswer[] = [];

      Object.entries(progress.wordProgress || {}).forEach(([word, data]: [string, any]) => {
        if (data.lastStudied > 0) {
          answers.push({
            word,
            correct: data.category !== 'incorrect',
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
        logger.debug(`[Signal] 苦戦検出: ${(confidence * 100).toFixed(0)}% (エラー率${(errorRate * 100).toFixed(0)}%)`);
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
        logger.debug(`[Signal] 過学習検出: ${(confidence * 100).toFixed(0)}% (連続${consecutiveCorrect}回正解)`);
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
   * 優先度計算（DTA統合）
   */
  private calculatePriorities(
    questions: Question[],
    context: ScheduleContext,
    signals: any[],
    hybridMode = false
  ): PrioritizedQuestion[] {
    return questions.map((q, index) => {
      const status = this.getWordStatus(q.word, context.mode);

      // ハイブリッドモード: 元の順序を保持（indexベース）
      if (hybridMode) {
        const priority = index / questions.length * 100; // 0-100の範囲
        return {
          question: q,
          priority,
          status,
          signals: [],
          originalIndex: index,
        };
      }

      // 基本優先度
      let priority = this.getBasePriority(status);
      const basePriority = priority; // デバッグ用に保存

      // DTA調整
      if (status?.category === 'mastered') {
        const risk = this.calculateForgettingRisk({
          lastStudied: status.lastStudied,
          reviewInterval: status.reviewInterval,
          accuracy: status.correct / Math.max(status.attempts, 1) * 100,
        });

        // 忘却リスク < 30: 優先度5（後回し）
        // 忘却リスク 30-70: 優先度20（中程度）
        // 忘却リスク >= 70: 優先度40（復習必要）
        if (risk < 30) {
          priority = 5;
        } else if (risk < 70) {
          priority = 20;
        } else {
          priority = 40;
        }

        logger.debug(`[DTA] ${q.word}: risk=${risk}, priority=${priority}`);
      }

      // シグナル反映（将来実装）
      priority = this.applySignals(priority, signals, q);

      // 時間ブースト
      priority = this.applyTimeBoost(priority, status);

      // デバッグログ: 最初の10単語の優先度を出力
      if (index < 10) {
        console.log(`🎯 [QuestionScheduler] 優先度計算: ${q.word}`, {
          category: status?.category || 'null',
          basePriority,
          finalPriority: priority,
        });
      }

      return {
        question: q,
        priority,
        status,
        signals: [],
        originalIndex: index,
      };
    });
  }

  /**
   * 基本優先度を取得（降順ソート: 大きいほど優先度が高い）
   */
  private getBasePriority(status: WordStatus | null): number {
    if (!status) return 50; // new

    switch (status.category) {
      case 'incorrect':
        return 100; // 最優先（最大値）
      case 'still_learning':
        return 75;
      case 'mastered':
        return 10; // 最低優先（最小値、DTA後に調整）
      case 'new':
      default:
        return 50;
    }
  }

  /**
   * 忘却リスクスコアを計算（0-200）
   */
  private calculateForgettingRisk(params: ForgettingRiskParams): number {
    if (params.lastStudied === 0) return 0;

    const daysSinceLastStudy = (Date.now() - params.lastStudied) / (1000 * 60 * 60 * 24);
    const intervalRatio = params.reviewInterval > 0 ? daysSinceLastStudy / params.reviewInterval : 0;

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
            adjustedPriority *= (1 - signal.confidence * 0.2); // 最大20%優先度アップ
          }
          break;

        case 'struggling':
          // 苦戦時: incorrect/still_learningの優先度を大きく下げる（優先出題）
          if (priority < 2) {
            adjustedPriority *= (1 - signal.confidence * 0.3); // 最大30%優先度アップ
          }
          break;

        case 'overlearning':
          // 過学習時: 新しい問題や難しい問題を優先
          if (priority >= 3 && priority <= 5) {
            adjustedPriority *= (1 - signal.confidence * 0.15); // 最大15%優先度アップ
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
   * 時間ブーストを適用
   */
  private applyTimeBoost(priority: number, status: WordStatus | null): number {
    if (!status || status.lastStudied === 0) return priority;

    const daysSinceLastStudy = (Date.now() - status.lastStudied) / (1000 * 60 * 60 * 24);

    // 7日以上放置されている場合、優先度を上げる
    if (daysSinceLastStudy >= 7) {
      return priority * 0.8; // 20%優先度アップ
    } else if (daysSinceLastStudy >= 3) {
      return priority * 0.9; // 10%優先度アップ
    }

    return priority;
  }

  /**
   * 語句の学習状況を取得
   */
  private getWordStatus(word: string, _mode: string): WordStatus | null {
    const key = 'english-progress';
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    try {
      const progress = JSON.parse(stored);
      const wordProgress = progress.wordProgress?.[word];
      if (!wordProgress) return null;

      // カテゴリーを取得または推測
      let category = wordProgress.category;

      // ✅ デバッグ: localStorageから読み取ったカテゴリー
      console.log(`🔍 [QuestionScheduler] ${word}: localStorage.category = ${category || '未設定'}`);

      // 既存データにcategoryがない場合は推測
      if (!category) {
        const totalAttempts = (wordProgress.correctCount || 0) + (wordProgress.incorrectCount || 0);
        const consecutiveIncorrect = wordProgress.consecutiveIncorrect || 0;

        if (totalAttempts === 0) {
          category = 'new';
        } else if (consecutiveIncorrect >= 2) {
          category = 'incorrect';
        } else if (wordProgress.incorrectCount && wordProgress.incorrectCount > 0) {
          category = 'still_learning';
        } else if (wordProgress.masteryLevel === 'mastered') {
          category = 'mastered';
        } else {
          category = 'still_learning';
        }
        console.log(`🔍 [QuestionScheduler] ${word}: category未設定のため推測 → ${category}`);
      }

      const status = {
        category,
        priority: wordProgress.priority || 3,
        lastStudied: wordProgress.lastStudied || 0,
        attempts: wordProgress.attempts || 0,
        correct: wordProgress.correct || 0,
        streak: wordProgress.streak || 0,
        forgettingRisk: wordProgress.forgettingRisk || 0,
        reviewInterval: wordProgress.reviewInterval || 1,
      };

      // デバッグ: incorrect/still_learningの単語のみログ出力
      if (status.category === 'incorrect' || status.category === 'still_learning') {
        logger.debug(`[WordStatus] ${word}: ${status.category} (attempts=${status.attempts}, correct=${status.correct}, consecutiveIncorrect=${wordProgress.consecutiveIncorrect || 0})`);
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
   */
  private sortAndBalance(
    questions: PrioritizedQuestion[],
    _params: ScheduleParams
  ): PrioritizedQuestion[] {
    // カテゴリ別に分類（強制優先）
    const incorrectQuestions = questions.filter(pq => pq.status?.category === 'incorrect');
    const stillLearningQuestions = questions.filter(pq => pq.status?.category === 'still_learning');
    const otherQuestions = questions.filter(pq =>
      pq.status?.category !== 'incorrect' && pq.status?.category !== 'still_learning'
    );

    // デバッグ: 全カテゴリの統計
    const categoryStats = questions.reduce((acc, pq) => {
      const cat = pq.status?.category || 'null';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('📊📊📊 [QuestionScheduler] カテゴリ統計', {
      total: questions.length,
      categories: categoryStats,
      incorrectSample: incorrectQuestions.slice(0, 3).map(pq => pq.question.word),
      stillLearningSample: stillLearningQuestions.slice(0, 3).map(pq => pq.question.word),
      nullCategorySample: questions.filter(pq => !pq.status?.category).slice(0, 5).map(pq => pq.question.word),
    });

    // 🚨 警告: すべての単語がnullカテゴリーの場合、学習履歴が読み取れていない
    if (categoryStats['null'] === questions.length) {
      console.error('🚨🚨🚨 [QuestionScheduler] 全単語のカテゴリーがnull - localStorageから学習履歴を読み取れていません！');
    }

    // 各カテゴリ内で優先度順ソート（降順: 優先度が高い順）
    const sortByPriority = (a: PrioritizedQuestion, b: PrioritizedQuestion) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;  // ✅ 降順（優先度が高い順）
      }

      // 🎲 ABC順排除: 学習履歴のない単語（null/new）はランダムソート
      const aIsNew = !a.status?.category || a.status?.category === 'new';
      const bIsNew = !b.status?.category || b.status?.category === 'new';

      if (aIsNew && bIsNew) {
        return Math.random() - 0.5;  // 両方とも新出単語はランダム
      }

      return (a.originalIndex || 0) - (b.originalIndex || 0);
    };

    incorrectQuestions.sort(sortByPriority);
    stillLearningQuestions.sort(sortByPriority);
    otherQuestions.sort(sortByPriority);

    // 優先順序: incorrect → still_learning → その他
    const sorted = [...incorrectQuestions, ...stillLearningQuestions, ...otherQuestions];

    // 【確実性保証】復習が必要な単語を確実に上位20%に配置
    const reviewNeeded = incorrectQuestions.length + stillLearningQuestions.length;
    const totalQuestions = sorted.length;
    const top20PercentCount = Math.ceil(totalQuestions * 0.2);

    if (reviewNeeded > 0 && reviewNeeded > top20PercentCount) {
      // 復習単語が20%を超える場合は警告
      logger.warn('[QuestionScheduler] 復習単語が多すぎます', {
        reviewNeeded,
        top20Percent: top20PercentCount,
        ratio: `${((reviewNeeded / totalQuestions) * 100).toFixed(0)}%`,
      });
    } else if (reviewNeeded > 0) {
      // 復習単語の最小保証: 上位20%に必ず含める
      const guaranteedTop = sorted.slice(0, top20PercentCount);
      const reviewInTop = guaranteedTop.filter(pq =>
        pq.status?.category === 'incorrect' || pq.status?.category === 'still_learning'
      ).length;

      if (reviewInTop < reviewNeeded) {
        logger.warn('[QuestionScheduler] 上位20%に復習単語が不足 - 強制配置実行', {
          expected: reviewNeeded,
          actual: reviewInTop,
          shortfall: reviewNeeded - reviewInTop,
        });
        // この場合は既に正しく配置されているため、追加処理不要
      }
    }

    // デバッグログ
    console.log('✅✅✅ [QuestionScheduler] 優先単語配置完了', {
      incorrectCount: incorrectQuestions.length,
      stillLearningCount: stillLearningQuestions.length,
      otherCount: otherQuestions.length,
      top10: sorted.slice(0, 10).map(pq => `${pq.question.word}(${pq.status?.category || 'unknown'}/${pq.priority.toFixed(1)})`),
      guaranteeRatio: reviewNeeded > 0 ? `${((reviewNeeded / Math.min(top20PercentCount, totalQuestions)) * 100).toFixed(0)}%` : 'N/A',
    });

    return sorted;
  }

  /**
   * ハイブリッドモード: 既存AI優先度を尊重し、振動防止とDTAの微調整のみ適用
   */
  private scheduleHybridMode(params: ScheduleParams, startTime: number): ScheduleResult {
    const context = this.buildContext(params);
    const signals = params.useMetaAI ? this.detectSignals(context) : [];

    // 既存の順序を保持したまま優先度を付与
    const prioritized = this.calculatePriorities(params.questions, context, signals, true);

    // 振動防止フィルター適用（最近正解した単語の再出題を防止）
    const filtered = this.applyAntiVibration(prioritized, context);

    // カテゴリ別に分類
    const incorrectQuestions = filtered.filter(pq => pq.status?.category === 'incorrect');
    const stillLearningQuestions = filtered.filter(pq => pq.status?.category === 'still_learning');
    const otherQuestions = filtered.filter(pq =>
      pq.status?.category !== 'incorrect' && pq.status?.category !== 'still_learning'
    );

    // 優先順序: incorrect → still_learning → その他
    const sorted = [...incorrectQuestions, ...stillLearningQuestions, ...otherQuestions];

    // 【確実性保証】ハイブリッドモードでも復習単語を確実に上位に配置
    const reviewNeeded = incorrectQuestions.length + stillLearningQuestions.length;
    const totalQuestions = sorted.length;

    logger.info('[QuestionScheduler Hybrid] 優先単語配置完了', {
      incorrectWords: incorrectQuestions.slice(0, 5).map(pq => pq.question.word),
      stillLearningWords: stillLearningQuestions.slice(0, 5).map(pq => pq.question.word),
      incorrectCount: incorrectQuestions.length,
      stillLearningCount: stillLearningQuestions.length,
      otherCount: otherQuestions.length,
      reviewRatio: totalQuestions > 0 ? `${((reviewNeeded / totalQuestions) * 100).toFixed(0)}%` : '0%',
      top5: sorted.slice(0, 5).map(pq => `${pq.question.word}(${pq.status?.category})`),
    });

    // 後処理
    const questions = this.postProcess(sorted, context);

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
   * 後処理
   */
  private postProcess(
    questions: PrioritizedQuestion[],
    _context: ScheduleContext
  ): Question[] {
    return questions.map(pq => pq.question);
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.recentAnswersCache.clear();
    logger.info('[QuestionScheduler] キャッシュクリア完了');
  }
}
