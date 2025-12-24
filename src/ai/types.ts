/**
 * 7AI共通型定義
 *
 * すべての専門AIが使用する共通のインターフェースとデータ型
 */

import type { WordProgress as StorageWordProgress } from '../storage/progress/types';

// Storage層のWordProgressを再エクスポート
export type { StorageWordProgress };

/**
 * 単語の学習スコア（0-100の数値）
 *
 * スコア範囲と意味:
 * - 0-20:   mastered (定着済み、最低優先)
 * - 20-40:  new (未学習、中低優先)
 * - 40-70:  still_learning (学習中、中高優先)
 * - 70-100: incorrect (要復習、最高優先)
 *
 * 各担当AIの評価を統合して算出される
 */
export type WordPosition = number;

/**
 * 学習カテゴリ（文字列）
 *
 * 注: Position(0-100)とは別物。
 * UI/説明・シグナル・デバッグではこちらのカテゴリ名を使用する。
 */
export type WordCategory = 'new' | 'incorrect' | 'still_learning' | 'mastered';

/**
 * 認知負荷レベル
 */
export type CognitiveLoadLevel = 'low' | 'medium' | 'high' | 'overload';

/**
 * 学習スタイルプロファイル
 */
export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading';

/**
 * 難易度設定
 */
export type DifficultyPreference = 'gradual' | 'challenge' | 'mixed';

/**
 * モチベーションタイプ
 */
export type MotivationType = 'mastery' | 'performance' | 'social';

/**
 * チャレンジレベル
 */
export type ChallengeLevel = 'easy' | 'medium' | 'hard';

/**
 * 基底AIシグナル - すべてのAIシグナルの共通インターフェース
 */
export interface BaseAISignal {
  /** シグナルの信頼度 (0-1) */
  confidence: number;
  /** シグナル生成時刻 */
  timestamp: number;
  /** AIの識別子 */
  aiId: string;
}

/**
 * 記憶AIシグナル (🧠 MemoryAI)
 *
 * Phase 4拡張: 記憶科学統合
 * - SM-2分析結果
 * - Ebbinghaus保持率
 * - 長期記憶段階
 */
export interface MemorySignal extends BaseAISignal {
  aiId: 'memory';
  /** 忘却リスク (0-200) */
  forgettingRisk: number;
  /** 時間経過による優先度ブースト (0-1) */
  timeBoost: number;
  /** カテゴリー判定 */
  category: WordCategory;
  /** 記憶定着度 (0-1) */
  retentionStrength: number;

  // === Phase 4拡張フィールド ===
  /** SM-2分析結果（optional: 既存データとの互換性のため） */
  sm2Data?: {
    quality: number;
    easeFactor: number;
    interval: number;
    repetitions: number;
    nextReviewDate: Date;
  };
  /** Ebbinghaus保持率 (0-1, optional) */
  retention?: number;
  /** 長期記憶段階 (optional) */
  memoryStage?: 'WORKING_MEMORY' | 'SHORT_TERM' | 'CONSOLIDATING' | 'LONG_TERM';
  /** 推奨次回復習日 (optional) */
  recommendedNextReview?: Date;
}

/**
 * 認知負荷AIシグナル (💤 CognitiveLoadAI)
 */
export interface CognitiveLoadSignal extends BaseAISignal {
  aiId: 'cognitiveLoad';
  /** 負荷レベル */
  loadLevel: CognitiveLoadLevel;
  /** 疲労スコア (0-1) */
  fatigueScore: number;
  /** 休憩推奨フラグ */
  recommendedBreak: boolean;
  /** 難易度調整 (-0.2 ~ +0.2) */
  difficultyAdjustment: number;
}

/**
 * 誤答予測AIシグナル (🔮 ErrorPredictionAI)
 */
export interface ErrorPredictionSignal extends BaseAISignal {
  aiId: 'errorPrediction';
  /** 弱点分野 */
  weaknessAreas: string[];
  /** 混同ペア [正しい語, 間違える語] */
  confusionPairs: [string, string][];
  /** 予防的復習推奨語句 */
  preemptiveReview: string[];
  /** パターン信頼度 (0-1) */
  patternConfidence: number;

  // Phase 4.5 ML拡張フィールド
  /** 誤答確率 (0-1) - ML予測 */
  errorProbability?: number;
  /** 弱点レベル (0-1) - ML予測 */
  weaknessLevel?: number;
  /** 混同スコア (0-1) - ML予測 */
  confusionScore?: number;
}

/**
 * 学習スタイルAIシグナル (🎯 LearningStyleAI)
 */
export interface LearningStyleSignal extends BaseAISignal {
  aiId: 'learningStyle';
  /** 学習スタイルプロファイル */
  styleProfile: LearningStyle;
  /** 最適セッション長 (分) */
  optimalSessionLength: number;
  /** 好みの難易度設定 */
  preferredDifficulty: DifficultyPreference;
  /** モチベーションタイプ */
  motivationType: MotivationType;
}

/**
 * 言語学的AIシグナル (📚 LinguisticAI)
 */
export interface LinguisticSignal extends BaseAISignal {
  aiId: 'linguistic';
  /** 固有難易度 (0-1) */
  inherentDifficulty: number;
  /** 音韻類似語 */
  phoneticSimilarity: string[];
  /** 意味的クラスター */
  semanticCluster: string[];
  /** 文法複雑度 (0-1) */
  grammarComplexity: number;
}

/**
 * 文脈的AIシグナル (🌍 ContextualAI)
 */
export interface ContextualSignal extends BaseAISignal {
  aiId: 'contextual';
  /** 文脈関連性 (0-1) */
  contextRelevance: number;
  /** トピック継続性フラグ */
  topicContinuity: boolean;
  /** 環境適合度 (0-1) */
  environmentFit: number;
  /** 他タブとの相乗効果 */
  crossTabSynergy: string[];
}

/**
 * ゲーミフィケーションAIシグナル (🎮 GamificationAI)
 */
export interface GamificationSignal extends BaseAISignal {
  aiId: 'gamification';
  /** モチベーションレベル (0-1) */
  motivationLevel: number;
  /** 報酬付与タイミングフラグ */
  rewardTiming: boolean;
  /** チャレンジレベル */
  challengeLevel: ChallengeLevel;
  /** SNS共有推奨メッセージ */
  socialFeedback: string;
}

/**
 * すべてのAIシグナルの統合型
 */
export type AISignal =
  | MemorySignal
  | CognitiveLoadSignal
  | ErrorPredictionSignal
  | LearningStyleSignal
  | LinguisticSignal
  | ContextualSignal
  | GamificationSignal;

/**
 * AI分析入力データ - 各AIが受け取る共通の入力
 */
export interface AIAnalysisInput {
  /** 単語オブジェクト */
  word: WordData;
  /** 単語の進捗データ（storage層の完全な型を使用） */
  progress: StorageWordProgress | null;
  /** セッション統計 */
  sessionStats: SessionStats;
  /** 現在のタブ */
  currentTab: 'memorization' | 'grammar' | 'comprehensive';
  /** すべての単語進捗データ */
  allProgress: Record<string, StorageWordProgress>;
}

/**
 * 単語データ（Phase 4.5: ML特徴量抽出用）
 */
export interface WordData {
  word: string;
  meaning: string;
  ipa?: string;
  katakana?: string;
  [key: string]: any; // 拡張性のため
}

/**
 * 試行回数のサマリー（Phase 4.5拡張）
 * Note: 実際のデータ構造はstorage層で定義されています
 * このインターフェースは、AI層で期待される最小限の構造を定義します
 */
export interface AttemptsSummary {
  totalAttempts: number;
  correctCount: number;
  wrongCount?: number;
  stillLearningCount?: number;
  consecutiveCorrect: number;
  consecutiveWrong: number;
  streak?: number;
  wrongAnswerPatterns?: string[];
}

/**
 * WordProgress型はstorage層で定義されています
 * AI層では StorageWordProgress を使用してください
 *
 * @deprecated AI層では直接使用しないでください。StorageWordProgressを使用してください。
 */

/**
 * 誤答記録
 */
export interface ErrorRecord {
  timestamp: number;
  word: string;
  questionType: string;
  userAnswer?: string;
  correctAnswer: string;
  grammarPoint?: string;
}

/**
 * セッション統計
 */
export interface SessionStats {
  totalAttempts: number;
  correctAnswers: number;
  incorrectAnswers: number;
  stillLearningAnswers: number;
  sessionStartTime: number;
  sessionDuration: number; // ミリ秒
  avgResponseTime?: number; // ミリ秒
  consecutiveIncorrect: number;

  // カテゴリ別カウント
  masteredCount: number;
  stillLearningCount: number;
  incorrectCount: number;
  newCount: number;

  // Phase 4.5 ML拡張フィールド
  questionsAnswered?: number;
  currentAccuracy?: number;
  consecutiveCorrect?: number;
  averageResponseTime?: number;
  responseTimeVariance?: number;
  slowResponseCount?: number;
  fastResponseCount?: number;
  timeoutCount?: number;
}

/**
 * AI統合結果 - AICoordinatorが返す最終結果
 */
export interface AICoordinationResult {
  /** 最終的な優先度 */
  finalPriority: number;
  /** 各AIのシグナル */
  signals: {
    memory?: MemorySignal;
    cognitiveLoad?: CognitiveLoadSignal;
    errorPrediction?: ErrorPredictionSignal;
    learningStyle?: LearningStyleSignal;
    linguistic?: LinguisticSignal;
    contextual?: ContextualSignal;
    gamification?: GamificationSignal;
  };
  /** 緊急フラグ（最優先） */
  urgentFlag: boolean;
  /** 推奨アクション */
  recommendedAction?: string;
  /** デバッグ情報 */
  debug?: {
    basePriority: number;
    adjustments: Record<string, number>;
    reasoning: string;
  };
}

/**
 * 専門AIの基底インターフェース
 */
export interface SpecialistAI<T extends BaseAISignal> {
  /** AIの識別子 */
  readonly id: string;

  /** AIの名前 */
  readonly name: string;

  /** AIの絵文字アイコン */
  readonly icon: string;

  /**
   * 分析を実行してシグナルを生成
   * @param input 分析入力データ
   * @returns AIシグナル（Phase 4.5: MLサポートのためPromiseに対応）
   */
  analyze(input: AIAnalysisInput): T | Promise<T>;

  /**
   * シグナルの妥当性を検証
   * @param signal 検証するシグナル
   * @returns 妥当性フラグ
   */
  validateSignal(signal: T): boolean;
}

/**
 * AICoordinatorの設定
 */
export interface CoordinatorConfig {
  /** 各AIの重み付け (0-1) */
  weights: {
    memory: number;
    cognitiveLoad: number;
    errorPrediction: number;
    learningStyle: number;
    linguistic: number;
    contextual: number;
    gamification: number;
  };

  /** 緊急フラグの閾値 */
  emergencyThresholds: {
    forgettingRisk: number; // デフォルト 150
    cognitiveOverload: boolean; // デフォルト true
    consecutiveErrors: number; // デフォルト 5
  };

  /** デバッグモード */
  debugMode: boolean;
}

/**
 * デフォルト設定
 */
export const DEFAULT_COORDINATOR_CONFIG: CoordinatorConfig = {
  weights: {
    memory: 1.0, // 最重要
    cognitiveLoad: 0.8, // 重要
    errorPrediction: 0.7, // 重要
    learningStyle: 0.5, // 中程度
    linguistic: 0.4, // 参考程度
    contextual: 0.6, // やや重要
    gamification: 0.3, // 付加価値
  },
  emergencyThresholds: {
    forgettingRisk: 150,
    cognitiveOverload: true,
    consecutiveErrors: 5,
  },
  debugMode: false,
};
