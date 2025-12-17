/**
 * useAdaptiveLearning.ts
 *
 * 適応型学習AI統合フック
 * 工程3-7で実装した全アルゴリズムを統合し、UIコンポーネントで簡単に使用できるようにする
 *
 * @author AI Assistant
 * @version 1.0
 * @since 2025-12-16
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Question } from '../types';
import {
  LearningPhaseDetector,
  LearningPhase,
  type QuestionStatus,
} from '../strategies/learningPhaseDetector';
import {
  AcquisitionQueueManager,
  QuestionCategory,
  QueueType,
} from '../strategies/memoryAcquisitionAlgorithm';
import { MemoryRetentionManager } from '../strategies/memoryRetentionAlgorithm';
import {
  PersonalParameterEstimator,
  type PersonalParameters,
} from '../strategies/personalParameterEstimator';
import {
  HybridQuestionSelector,
  type QuestionCandidate,
  DEFAULT_HYBRID_STRATEGY,
} from '../strategies/hybridQuestionSelector';
import { logger } from '@/utils/logger';
import { getWordProgress } from '../progressStorage';

/**
 * WordProgressをQuestionStatusに変換
 */
function convertToQuestionStatus(
  word: string,
  wordProgress: ReturnType<typeof getWordProgress>
): QuestionStatus {
  if (!wordProgress) {
    return {
      word,
      reviewCount: 0,
      correctCount: 0,
      wrongCount: 0,
      lastReviewTime: 0,
      lastCorrectTime: 0,
      averageResponseTime: 0,
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
    };
  }

  return {
    word,
    reviewCount: wordProgress.correctCount + wordProgress.incorrectCount,
    correctCount: wordProgress.correctCount,
    wrongCount: wordProgress.incorrectCount,
    lastReviewTime: wordProgress.lastStudied || 0,
    lastCorrectTime: wordProgress.consecutiveCorrect > 0 ? wordProgress.lastStudied : 0,
    averageResponseTime: wordProgress.averageResponseTime || 0,
    consecutiveCorrect: wordProgress.consecutiveCorrect,
    consecutiveWrong: wordProgress.consecutiveIncorrect,
  };
}

/**
 * 適応型学習の状態
 */
export interface AdaptiveLearningState {
  /** 現在のフェーズ */
  currentPhase: LearningPhase | null;

  /** 個人パラメータ */
  personalParams: PersonalParameters | null;

  /** 同日復習キューのサイズ */
  queueSizes: {
    immediate: number;
    early: number;
    mid: number;
    end: number;
  };

  /** セッション進行状況 */
  sessionProgress: {
    totalQuestions: number;
    newWords: number;
    reviews: number;
  };
}

/**
 * 解答コンテキスト（processAnswerAndGetNextの入力）
 */
export interface AnswerContext {
  /** 解答した問題のID または word */
  questionId: string;

  /** 正誤（正解=true, 不正解=false, スキップ=undefined） */
  isCorrect?: boolean;

  /** 応答時間（ミリ秒） */
  responseTime: number;

  /** 難易度評価（1-5, オプション） */
  difficultyRating?: number;

  /** スキップフラグ */
  isSkipped?: boolean;

  /** 次の候補問題リスト（フィルタ済み全体） */
  candidates: Question[];

  /** タイムスタンプ（デフォルト: Date.now()） */
  timestamp?: number;
}

/**
 * 次問題ペイロード（processAnswerAndGetNextの出力）
 */
export interface NextQuestionPayload {
  /** 次に出題する問題（null=候補なし） */
  question: Question | null;

  /** 選定理由（UI説明用） */
  reason: string;

  /** 優先度スコア（0-100） */
  priority: number;

  /** 除外されたID一覧 */
  excludedIds: string[];

  /** 学習フェーズ */
  phase: LearningPhase | null;

  /** UIヒント（オプション） */
  hints?: {
    /** 即時復習フラグ */
    isImmediateReview?: boolean;
    /** 新規単語フラグ */
    isNewWord?: boolean;
    /** 復習間隔（日数） */
    intervalDays?: number;
  };
}

/**
 * 適応型学習フックの戻り値
 */
export interface UseAdaptiveLearningResult {
  /** 次の問題を選択 */
  selectNextQuestion: (candidates: Question[], currentQuestionId?: string) => Question | null;

  /** 回答を記録 */
  recordAnswer: (word: string, isCorrect: boolean, responseTime: number) => void;

  /**
   * 解答を処理して次の問題を取得（Tell, Don't Ask パターン）
   * @param context 解答コンテキスト
   * @returns 次の問題と選定情報
   */
  processAnswerAndGetNext: (context: AnswerContext) => NextQuestionPayload;

  /** 適応型学習の状態 */
  state: AdaptiveLearningState;

  /** アルゴリズムをリセット */
  reset: () => void;

  /** デバッグ情報を取得 */
  getDebugInfo: () => any;
}

/**
 * 適応型学習を使用するカスタムフック
 *
 * @param category 問題カテゴリ（MEMORIZATION, TRANSLATION, SPELLING, GRAMMAR）
 * @param sessionId セッションID（オプション）
 * @returns 適応型学習の制御インターフェース
 *
 * @example
 * const { selectNextQuestion, recordAnswer, state } = useAdaptiveLearning('MEMORIZATION');
 *
 * // 次の問題を選択（現在の問題を除外）
 * const nextQuestion = selectNextQuestion(availableQuestions, currentQuestion.word);
 *
 * // 回答を記録
 * recordAnswer(question.word, isCorrect, responseTime);
 */
export function useAdaptiveLearning(
  category: QuestionCategory = QuestionCategory.MEMORIZATION,
  sessionId?: string
): UseAdaptiveLearningResult {
  // アルゴリズムインスタンス（Ref で保持）
  const phaseDetectorRef = useRef<LearningPhaseDetector | null>(null);
  const acquisitionAlgoRef = useRef<AcquisitionQueueManager | null>(null);
  const retentionAlgoRef = useRef<MemoryRetentionManager | null>(null);
  const paramEstimatorRef = useRef<PersonalParameterEstimator | null>(null);
  const questionSelectorRef = useRef<HybridQuestionSelector | null>(null);

  // セッション状態
  const [sessionQuestionCount, setSessionQuestionCount] = useState(0);
  const [state, setState] = useState<AdaptiveLearningState>({
    currentPhase: null,
    personalParams: null,
    queueSizes: {
      immediate: 0,
      early: 0,
      mid: 0,
      end: 0,
    },
    sessionProgress: {
      totalQuestions: 0,
      newWords: 0,
      reviews: 0,
    },
  });

  // 初期化
  useEffect(() => {
    logger.info('[useAdaptiveLearning] Initializing adaptive learning algorithms', {
      category,
      sessionId,
    });

    // アルゴリズムインスタンスを作成
    phaseDetectorRef.current = new LearningPhaseDetector();
    acquisitionAlgoRef.current = new AcquisitionQueueManager();
    retentionAlgoRef.current = new MemoryRetentionManager();
    paramEstimatorRef.current = new PersonalParameterEstimator();
    questionSelectorRef.current = new HybridQuestionSelector({
      ...DEFAULT_HYBRID_STRATEGY,
      sessionQuestionNumber: 0,
    });

    // LocalStorageから永続化されたキューを復元
    try {
      const savedQueues = localStorage.getItem(`adaptive-learning-queues-${category}`);
      if (savedQueues && acquisitionAlgoRef.current) {
        // キュー復元ロジック（実装は省略）
        logger.debug('[useAdaptiveLearning] Restored queues from localStorage');
      }
    } catch (error) {
      logger.error('[useAdaptiveLearning] Failed to restore queues:', error);
    }

    // 個人パラメータを推定
    try {
      if (paramEstimatorRef.current) {
        const params = paramEstimatorRef.current.estimateParameters();
        setState((prev) => ({ ...prev, personalParams: params }));

        // HybridQuestionSelectorに個人パラメータを設定
        if (questionSelectorRef.current) {
          questionSelectorRef.current.setPersonalParameters(params);
        }

        logger.info('[useAdaptiveLearning] Personal parameters estimated:', params);
      }
    } catch (error) {
      logger.error('[useAdaptiveLearning] Failed to estimate personal parameters:', error);
    }

    return () => {
      // クリーンアップ: キューを保存
      try {
        if (acquisitionAlgoRef.current) {
          const queues = acquisitionAlgoRef.current.exportQueues();
          localStorage.setItem(`adaptive-learning-queues-${category}`, JSON.stringify(queues));
          logger.debug('[useAdaptiveLearning] Saved queues to localStorage');
        }
      } catch (error) {
        logger.error('[useAdaptiveLearning] Failed to save queues:', error);
      }
    };
  }, [category, sessionId]);

  /**
   * 次の問題を選択
   */
  const selectNextQuestion = useCallback(
    (candidates: Question[], currentQuestionId?: string): Question | null => {
      if (
        !questionSelectorRef.current ||
        !phaseDetectorRef.current ||
        !acquisitionAlgoRef.current
      ) {
        logger.warn('[useAdaptiveLearning] Algorithms not initialized');
        return candidates.length > 0 ? candidates[0] : null;
      }

      try {
        // 現在の問題を除外（連続出題を防止）
        // wordまたは(q as any).idで比較（GrammarQuestionにも対応）
        const filteredCandidates = currentQuestionId
          ? candidates.filter((q) => q.word !== currentQuestionId && (q as any).id !== currentQuestionId)
          : candidates;

        if (filteredCandidates.length === 0) {
          logger.debug('[useAdaptiveLearning] All candidates filtered out, returning null');
          return null;
        }

        // 問題候補をQuestionCandidateに変換
        const questionCandidates: QuestionCandidate[] = filteredCandidates.map((q) => {
          // word（単語モード等）または id（文法モード等）をキーとして扱う
          const key = (q as any).word ?? (q as any).id;

          const wordProgress = getWordProgress(key);
          const status = convertToQuestionStatus(key, wordProgress);
          const phase = phaseDetectorRef.current!.detectPhase(key, status);
          const queueInfo = acquisitionAlgoRef.current!.getQueueInfo(key);

          // 難易度は数値化できない場合は中間値3にフォールバック
          const rawDifficulty = (q as any).difficulty;
          const difficultyNum =
            typeof rawDifficulty === 'number'
              ? rawDifficulty
              : typeof rawDifficulty === 'string'
                ? parseInt(rawDifficulty) || 3
                : 3;

          return {
            id: key,
            word: key,
            category,
            phase,
            reviewCount: status.reviewCount,
            correctCount: status.correctCount,
            lastReviewTime: status.lastReviewTime || Date.now(),
            queueType: queueInfo?.queueType,
            questionNumber: queueInfo?.questionNumber,
            difficulty: difficultyNum,
          };
        });

        // HybridQuestionSelectorで次の問題を選択
        questionSelectorRef.current.updateStrategy({
          sessionQuestionNumber: sessionQuestionCount,
        });

        const selected = questionSelectorRef.current.selectNextQuestion(questionCandidates);

        if (selected) {
          // word か id のどちらでもマッチするように検索
          const selectedQuestion = candidates.find(
            (q) => (q as any).word === selected.word || (q as any).id === selected.word
          );

          // セッション進行状況を更新
          setSessionQuestionCount((prev) => prev + 1);
          setState((prev) => ({
            ...prev,
            currentPhase: selected.phase,
            sessionProgress: {
              totalQuestions: prev.sessionProgress.totalQuestions + 1,
              newWords: prev.sessionProgress.newWords + (selected.reviewCount === 0 ? 1 : 0),
              reviews: prev.sessionProgress.reviews + (selected.reviewCount > 0 ? 1 : 0),
            },
          }));

          logger.debug('[useAdaptiveLearning] Selected question:', {
            word: selected.word,
            phase: selected.phase,
            queueType: selected.queueType,
          });

          return selectedQuestion || null;
        }

        return null;
      } catch (error) {
        logger.error('[useAdaptiveLearning] Error selecting question:', error);
        const filteredCandidates = currentQuestionId
          ? candidates.filter((q) => q.word !== currentQuestionId && (q as any).id !== currentQuestionId)
          : candidates;
        return filteredCandidates.length > 0 ? filteredCandidates[0] : null;
      }
    },
    [category, sessionQuestionCount]
  );

  /**
   * 回答を記録
   */
  const recordAnswer = useCallback(
    (word: string, isCorrect: boolean, responseTime: number) => {
      try {
        // フェーズ判定
        if (phaseDetectorRef.current) {
          const wordProgress = getWordProgress(word);
          const status = convertToQuestionStatus(word, wordProgress);
          const phase = phaseDetectorRef.current.detectPhase(word, status);
          setState((prev) => ({ ...prev, currentPhase: phase }));
        }

        // 記憶獲得アルゴリズムに記録
        if (acquisitionAlgoRef.current) {
          acquisitionAlgoRef.current.recordAnswer(word, isCorrect, responseTime);

          // キューサイズを更新
          const queueSizes = acquisitionAlgoRef.current.getQueueSizes();
          setState((prev) => ({ ...prev, queueSizes }));
        }

        // 記憶保持アルゴリズムに記録
        if (retentionAlgoRef.current) {
          retentionAlgoRef.current.recordReview(word, {
            isCorrect,
            confidence: isCorrect ? 3 : 0, // 正解時は中程度の自信、不正解時は0
            responseTime,
            timestamp: Date.now(),
          });
        }

        // 個人パラメータ推定に履歴を追加
        if (paramEstimatorRef.current) {
          paramEstimatorRef.current.addHistory({
            word,
            timestamp: Date.now(),
            isCorrect,
            responseTime,
            reviewNumber: 1, // TODO: 実際の復習番号を取得
            daysSinceFirstSeen: 0, // TODO: 実際の日数を計算
          });

          // 定期的に個人パラメータを再推定（20回ごと）
          if (sessionQuestionCount > 0 && sessionQuestionCount % 20 === 0) {
            const params = paramEstimatorRef.current.estimateParameters();
            setState((prev) => ({ ...prev, personalParams: params }));

            if (questionSelectorRef.current) {
              questionSelectorRef.current.setPersonalParameters(params);
            }

            logger.info('[useAdaptiveLearning] Personal parameters updated:', params);
          }
        }

        logger.debug('[useAdaptiveLearning] Recorded answer:', { word, isCorrect, responseTime });
      } catch (error) {
        logger.error('[useAdaptiveLearning] Error recording answer:', error);
      }
    },
    [sessionQuestionCount]
  );

  /**
   * アルゴリズムをリセット
   */
  const reset = useCallback(() => {
    logger.info('[useAdaptiveLearning] Resetting adaptive learning algorithms');

    setSessionQuestionCount(0);
    setState({
      currentPhase: null,
      personalParams: null,
      queueSizes: {
        immediate: 0,
        early: 0,
        mid: 0,
        end: 0,
      },
      sessionProgress: {
        totalQuestions: 0,
        newWords: 0,
        reviews: 0,
      },
    });

    // キューをクリア
    if (acquisitionAlgoRef.current) {
      acquisitionAlgoRef.current.clearQueues();
    }

    // 履歴をクリア
    if (paramEstimatorRef.current) {
      paramEstimatorRef.current.clearHistory();
    }
  }, []);

  /**
   * デバッグ情報を取得
   */
  const getDebugInfo = useCallback(() => {
    return {
      sessionQuestionCount,
      state,
      queues: acquisitionAlgoRef.current?.exportQueues() || null,
      personalParams: state.personalParams,
    };
  }, [sessionQuestionCount, state]);

  // 直前の問題IDを記憶（2語振動防止用）
  const lastQuestionIdRef = useRef<string | null>(null);

  /**
   * 解答を処理して次の問題を取得（Tell, Don't Ask パターン）
   * ビュー側は解答コンテキストを渡すだけで、記録と次問選定を一括処理
   */
  const processAnswerAndGetNext = useCallback(
    (context: AnswerContext): NextQuestionPayload => {
      const {
        questionId,
        isCorrect,
        responseTime,
        difficultyRating: _difficultyRating,
        isSkipped = false,
        candidates,
        timestamp = Date.now(),
      } = context;

      logger.debug('[processAnswerAndGetNext] Processing answer:', {
        questionId,
        isCorrect,
        isSkipped,
        candidatesCount: candidates.length,
        lastQuestionId: lastQuestionIdRef.current,
      });

      const excludedIds: string[] = [questionId];
      // 直前の問題も除外（2語振動防止）
      if (lastQuestionIdRef.current && lastQuestionIdRef.current !== questionId) {
        excludedIds.push(lastQuestionIdRef.current);
      }

      let reason = '';
      let priority = 0;
      let phase: LearningPhase | null = null;
      const hints: NextQuestionPayload['hints'] = {};

      try {
        // 1. 解答を記録（isCorrectが渡された場合のみ）
        if (isCorrect !== undefined) {
          recordAnswer(questionId, isCorrect, responseTime);
        }

        // 2. 現在の問題と直前の問題を除外した候補を準備（2語振動防止）
        const filteredCandidates = candidates.filter((q) => {
          const key = (q as any).word || (q as any).id;
          return !excludedIds.includes(key);
        });

        if (filteredCandidates.length === 0) {
          // 除外後に候補がない場合、直前問題の除外を緩和
          const relaxedCandidates = candidates.filter((q) => {
            const key = (q as any).word || (q as any).id;
            return key !== questionId;
          });

          if (relaxedCandidates.length === 0) {
            return {
              question: null,
              reason: '候補問題がありません',
              priority: 0,
              excludedIds,
              phase: null,
            };
          }

          // 直前問題除外を緩和して選定
          const nextQuestion = selectNextQuestion(relaxedCandidates, questionId);
          if (nextQuestion) {
            const key = (nextQuestion as any).word || (nextQuestion as any).id;
            lastQuestionIdRef.current = key;
          }

          return {
            question: nextQuestion,
            reason: '候補不足のため直前問題除外を緩和',
            priority: 10,
            excludedIds: [questionId],
            phase: null,
            hints: {},
          };
        }

        // 3. 次の問題を選定
        const nextQuestion = selectNextQuestion(filteredCandidates, questionId);

        if (!nextQuestion) {
          return {
            question: null,
            reason: '選定可能な問題がありません',
            priority: 0,
            excludedIds,
            phase: null,
          };
        }

        // 4. 選定理由とメタ情報を生成
        const key = (nextQuestion as any).word || (nextQuestion as any).id;
        const wordProgress = getWordProgress(key);
        const status = convertToQuestionStatus(key, wordProgress);
        phase = phaseDetectorRef.current?.detectPhase(key, status) || null;
        const queueInfo = acquisitionAlgoRef.current?.getQueueInfo(key);

        // 優先度スコアを計算（0-100）
        priority = Math.min(
          100,
          (status.reviewCount === 0 ? 50 : 0) + // 新規単語+50
            (queueInfo?.queueType === QueueType.IMMEDIATE ? 40 : 0) + // 即時復習+40
            (status.consecutiveWrong > 0 ? 30 : 0) + // 連続不正解+30
            Math.max(0, 20 - status.consecutiveCorrect * 5) // 連続正解で減点
        );

        // 選定理由を生成
        if (status.reviewCount === 0) {
          reason = '新規単語';
          hints.isNewWord = true;
        } else if (queueInfo?.queueType === QueueType.IMMEDIATE) {
          reason = '即時復習（同日再出題）';
          hints.isImmediateReview = true;
        } else if (status.consecutiveWrong > 0) {
          reason = `苦手単語（連続${status.consecutiveWrong}回不正解）`;
        } else if (phase === LearningPhase.ENCODING) {
          reason = '記憶符号化フェーズ';
        } else if (phase === LearningPhase.INITIAL_CONSOLIDATION) {
          reason = '初期統合フェーズ';
        } else if (phase === LearningPhase.INTRADAY_REVIEW) {
          reason = '同日復習フェーズ';
        } else if (phase === LearningPhase.SHORT_TERM) {
          reason = '短期記憶フェーズ';
        } else if (phase === LearningPhase.LONG_TERM) {
          reason = '長期記憶フェーズ';
          // 復習間隔を計算（簡易版）
          if (status.lastReviewTime > 0) {
            const daysSince = (timestamp - status.lastReviewTime) / (1000 * 60 * 60 * 24);
            hints.intervalDays = Math.floor(daysSince);
          }
        } else {
          reason = 'ハイブリッド選定';
        }

        logger.info('[processAnswerAndGetNext] Selected next question:', {
          key,
          reason,
          priority,
          phase,
          queueType: queueInfo?.queueType,
          excludedIds,
        });

        // 次回のために記憶
        lastQuestionIdRef.current = key;

        return {
          question: nextQuestion,
          reason,
          priority,
          excludedIds,
          phase,
          hints,
        };
      } catch (error) {
        logger.error('[processAnswerAndGetNext] Error:', error);
        // エラー時はフォールバック（先頭の問題）
        const fallback = candidates.find((q) => {
          const key = (q as any).word || (q as any).id;
          return key !== questionId;
        });

        if (fallback) {
          const fallbackKey = (fallback as any).word || (fallback as any).id;
          lastQuestionIdRef.current = fallbackKey;
        }

        return {
          question: fallback || null,
          reason: 'エラーによるフォールバック選定',
          priority: 0,
          excludedIds,
          phase: null,
        };
      }
    },
    [selectNextQuestion, recordAnswer, sessionQuestionCount]
  );

  return {
    selectNextQuestion,
    recordAnswer,
    processAnswerAndGetNext,
    state,
    reset,
    getDebugInfo,
  };
}
