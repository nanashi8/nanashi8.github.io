/**
 * 統一問題スケジューラー - 型定義
 *
 * 全タブ共通の出題順序決定に使用する型を定義
 */

import type { Question } from '@/types';

/**
 * Position (0-100) から category を派生
 * 🎯 後方互換性維持のためのヘルパー関数
 */
export function getCategoryFromPosition(
  position: number | undefined
): 'new' | 'incorrect' | 'still_learning' | 'mastered' {
  if (position === undefined) return 'new';
  if (position >= 70) return 'incorrect'; // 要復習
  if (position >= 40) return 'still_learning'; // 学習中
  if (position >= 20) return 'new'; // 新規
  return 'mastered'; // 定着済み
}

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

  /** 🆕 バッチ数設定（暗記モード専用、設定なしの場合は全語出題） */
  batchSize?: number;

  /** 学習上限設定（廃止予定：バッチ数設定に統合、オプショナル） */
  limits?: LearningLimits;

  /** セッション統計 */
  sessionStats: SessionStats;

  /** 復習集中モードか */
  isReviewFocusMode?: boolean;

  /** ハイブリッドモード（既存AI優先度を尊重） */
  hybridMode?: boolean;

  /** finalPriority主因モード（variant=Cで使用、AICoordinatorのfinalPriorityを主軸にする） */
  finalPriorityMode?: boolean;

  /** いもづる式学習モード（関連語を連鎖的に出題） */
  useChainLearning?: boolean;

  /** カテゴリーベーススロットシステムを使用（新実装） */
  useCategorySlots?: boolean;
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

  /** 復習集中モード */
  isReviewFocusMode: boolean;

  /** セッション開始時刻 */
  sessionStartTime: number;

  /** 単語別の学習進捗 */
  wordProgress: Record<string, any>;
}

/**
 * 語句の学習状況
 */
export interface WordStatus {
  category: 'new' | 'incorrect' | 'still_learning' | 'mastered'; // 後方互換性のため残す（position範囲から派生）
  position: number; // Position スコア（0-100）
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

  /** Position スコア（0-100、高いほど優先） */
  position: number;

  /** 語句の学習状況 */
  status: WordStatus | null;

  /** 出題回数 */
  attempts?: number;

  /** 振動防止フィルターが適用されたか */
  antiVibrationApplied?: boolean;

  /** 検出されたシグナル */
  signals?: any[];

  /** 元のインデックス（安定ソート用） */
  originalIndex?: number;

  /** AI主因モードなどで使用する最終優先度（高いほど優先） */
  finalPriority?: number;

  /** 時間経過などによる補正値（デバッグ/可観測性用） */
  timeBoost?: number;
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
    randomSkipApplied?: boolean; // 🔥 ランダム飛ばし機能の適用フラグ
  };
}

/**
 * 学習カテゴリー
 *
 * 回答結果に基づいて動的に分類される学習段階
 */
export type LearningCategory = 'new' | 'incorrect' | 'still_learning' | 'mastered';

/**
 * カテゴリー別Position
 *
 * 各カテゴリー内での相対的な優先度（0-100）
 */
export interface CategoryPosition {
  /** 学習カテゴリー */
  category: LearningCategory;

  /** カテゴリー内でのPosition値（0-100、高いほど優先） */
  positionInCategory: number;

  /** メタデータの結びつき強度（いもづる式学習用、0-100） */
  relatedStrength?: number;

  /** カテゴリー判定の根拠 */
  reason?: string;
}

/**
 * バッチスロット設定
 *
 * 各カテゴリーの出題枠の割合を定義
 */
export interface BatchSlotConfig {
  /** 新規語の出題枠比率（0-1） */
  newRatio: number;

  /** 分からない語の出題枠比率（0-1） */
  incorrectRatio: number;

  /** まだまだ語の出題枠比率（0-1） */
  stillLearningRatio: number;

  /** 定着済の出題枠比率（0-1） */
  masteredRatio: number;

  /** いもづる式学習の優先枠比率（0-1、各カテゴリー内で適用） */
  chainLearningRatio?: number;
}

/**
 * 🆕 動的スロット設定（上限到達時の配分）
 */
export interface DynamicSlotConfig {
  /** 分からない・まだまだの上限比率（0-1、例: 0.2 = 20%） */
  reviewLimitRatio: number;

  /** 上限到達時の配分 */
  overLimitRatios: {
    /** 分からない・まだまだの合計（上限到達時） */
    reviewRatio: number;
    /** 未出題（上限到達時） */
    newRatio: number;
    /** 覚えてる（固定） */
    masteredRatio: number;
  };
}

/**
 * カテゴリー別統計
 *
 * バッチ内の各カテゴリーの語数と状態
 */
export interface CategoryStats {
  /** カテゴリー別の語数 */
  counts: Record<LearningCategory, number>;

  /** カテゴリー別の割り当てスロット数 */
  allocatedSlots: Record<LearningCategory, number>;

  /** 余剰スロット数 */
  surplusSlots: number;

  /** スロット不足があるか */
  hasShortage: boolean;
}
