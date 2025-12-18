/**
 * 統一問題スケジューラー - 型定義
 *
 * 全タブ共通の出題順序決定に使用する型を定義
 */

import type { Question } from '@/types';

/**
 * スケジューリングモード
 */
export type ScheduleMode = 'memorization' | 'translation' | 'spelling' | 'grammar';

/**
 * セッション統計
 */
export interface SessionStats {
  correct: number;
  incorrect: number;
  still_learning: number;
  mastered: number;
  consecutiveCorrect?: number;
  duration?: number;
  averageDifficulty?: number;
}

/**
 * 学習上限設定
 */
export interface LearningLimits {
  learningLimit: number | null;
  reviewLimit: number | null;
}

/**
 * スケジューリングパラメータ
 */
export interface ScheduleParams {
  /** 出題候補の問題リスト */
  questions: Question[];

  /** スケジューリングモード（タブ種類） */
  mode: ScheduleMode;

  /** 学習上限設定 */
  limits: LearningLimits;

  /** セッション統計 */
  sessionStats: SessionStats;

  /** メタAI統合層（QuestionScheduler）を使用するか */
  useMetaAI?: boolean;

  /** 復習集中モードか */
  isReviewFocusMode?: boolean;

  /** ハイブリッドモード（既存AI優先度を尊重） */
  hybridMode?: boolean;
}

/**
 * スケジューリングコンテキスト
 */
export interface ScheduleContext {
  /** スケジューリングモード */
  mode: ScheduleMode;

  /** セッション統計 */
  sessionStats: SessionStats;

  /** 最近の解答履歴 */
  recentAnswers: RecentAnswer[];

  /** 時間帯 */
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';

  /** 認知負荷（0-1） */
  cognitiveLoad: number;

  /** メタAI統合を使用するか */
  useMetaAI: boolean;

  /** 復習集中モード */
  isReviewFocusMode: boolean;

  /** セッション開始時刻 */
  sessionStartTime: number;
}

/**
 * 語句の学習状況
 */
export interface WordStatus {
  category: 'new' | 'incorrect' | 'still_learning' | 'mastered';
  priority: number;
  lastStudied: number;
  attempts: number;
  correct: number;
  streak: number;
  forgettingRisk: number;
  reviewInterval: number;
}

/**
 * 優先度付き問題
 */
export interface PrioritizedQuestion {
  /** 問題 */
  question: Question;

  /** 計算された優先度（低いほど優先） */
  priority: number;

  /** 語句の学習状況 */
  status: WordStatus | null;

  /** 振動防止フィルターが適用されたか */
  antiVibrationApplied?: boolean;

  /** 検出されたシグナル */
  signals?: any[];

  /** 元のインデックス（安定ソート用） */
  originalIndex?: number;
}

/**
 * 最近の解答履歴
 */
export interface RecentAnswer {
  /** 語句 */
  word: string;

  /** 正解したか */
  correct: boolean;

  /** 解答時刻（タイムスタンプ） */
  timestamp: number;

  /** 連続正解数 */
  consecutiveCorrect: number;

  /** 反応時間（ミリ秒） */
  responseTime?: number;
}

/**
 * 振動防止フィルターオプション
 */
export interface FilterOptions {
  /** 最近の解答履歴 */
  recentAnswers: RecentAnswer[];

  /** 最小再出題間隔（ミリ秒） */
  minInterval: number;

  /** 連続正解閾値（この回数以上で頻度低減） */
  consecutiveThreshold: number;
}

/**
 * 忘却リスク計算パラメータ
 */
export interface ForgettingRiskParams {
  lastStudied: number;
  reviewInterval: number;
  accuracy: number;
}

/**
 * 検出されたシグナル（7AIからの信号）
 */
export interface DetectedSignal {
  /** シグナルの種類 */
  type: 'fatigue' | 'struggling' | 'overlearning' | 'boredom' | 'optimal';

  /** 信頼度（0-1） */
  confidence: number;

  /** 推奨アクション */
  action: string;

  /** シグナル検出時刻 */
  timestamp?: number;

  /** 追加メタデータ */
  metadata?: Record<string, any>;
}

/**
 * スケジューリング結果
 */
export interface ScheduleResult {
  /** ソート済み問題リスト */
  scheduledQuestions: Question[];

  /** 振動スコア（0-100） */
  vibrationScore: number;

  /** 処理時間（ミリ秒） */
  processingTime: number;

  /** 適用されたシグナル数 */
  signalCount: number;

  /** デバッグ情報 */
  debug?: {
    dtaApplied: number;
    antiVibrationApplied: number;
    signalsDetected: DetectedSignal[];
  };
}
