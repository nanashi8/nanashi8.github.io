/**
 * 適応的教育AIネットワーク - 型定義
 */

// 信号源
export enum SignalSource {
  MEMORY_ACQUISITION = 'memory_acquisition',
  COGNITIVE_LOAD = 'cognitive_load',
  ERROR_PREDICTION = 'error_prediction',
  LEARNING_STYLE = 'learning_style',
  LINGUISTIC_RELATIONS = 'linguistic_relations',
  CONTEXTUAL_LEARNING = 'contextual_learning',
}

// 戦略タイプ
export enum StrategyType {
  IMMEDIATE_REPETITION = 'immediate_repetition',
  TAKE_BREAK = 'take_break',
  USE_CONFUSION_PAIRS = 'use_confusion_pairs',
  REDUCE_DIFFICULTY = 'reduce_difficulty',
  SPACED_REPETITION = 'spaced_repetition',
  CONTEXTUAL_LEARNING = 'contextual_learning',
  GROUP_BY_THEME = 'group_by_theme',
  ADJUST_SESSION_LENGTH = 'adjust_session_length',
  USE_ETYMOLOGY = 'use_etymology',
  TIME_OF_DAY_OPTIMIZATION = 'time_of_day_optimization',
  INCREASE_EXPOSURE = 'increase_exposure',
  CONTINUE_NORMAL = 'continue_normal',
}

// 学習信号
export interface LearningSignal {
  source: SignalSource;
  type: StrategyType;
  strength: number; // 0-1
  confidence: number; // 0-1
  priority: number; // 0-10
  timestamp: number;
  metadata?: Record<string, any>;
}

// 質問コンテキスト
export interface QuestionContext {
  currentDifficulty: number; // 0-1
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  recentErrors: number;
  sessionLength: number; // 分
  consecutiveCorrect: number;
  attemptNumber?: number; // 試行回数 (optional)
  cognitiveLoad?: number; // 認知負荷 0-1 (optional)
  sessionDuration?: number; // セッション経過時間 (optional)
}

// 戦略推奨
export interface StrategyRecommendation {
  strategy: StrategyType;
  confidence: number; // 0-1
  reason: string;
  signals: LearningSignal[];
  metadata?: Record<string, any>;
}

// 学習結果
export interface LearningOutcome {
  word: string;
  correct: boolean;
  success: boolean; // correctと同じ意味だが別名でアクセスされる
  timeToMastery?: number; // 日数
  retentionRate?: number; // 0-1
  timestamp: number;
}

// 効果測定
export interface EffectivenessMeasurement {
  strategy: StrategyType;
  outcome: LearningOutcome;
  timestamp: number;
}

// 戦略効果
export interface StrategyEffectiveness {
  strategyType: StrategyType;
  totalUses: number;
  successCount: number;
  failureCount: number;
  successRate: number; // 0-1
  averageTimeToMastery: number; // 日数
  averageRetentionRate: number; // 0-1
  lastUsed: number;
  confidence: number; // 0-1
}

// 効果レポート
export interface EffectivenessReport {
  topPerformers: Array<{
    strategy: StrategyType;
    successRate: number;
    uses: number;
  }>;
  recommendations: string[];
  timestamp: number;
}

// 戦略比較
export interface StrategyComparison {
  strategy1: StrategyType;
  strategy2: StrategyType;
  betterStrategy: StrategyType | null;
  successRateDiff: number;
  confidenceLevel: number;
  recommendation: string;
}

// 戦略実行結果
export interface StrategyExecutionResult {
  strategy: StrategyType;
  success: boolean;
  actions: ExecutedAction[];
  duration?: number; // 実行時間 (ms)
  error?: string;
  metadata?: Record<string, any>;
}

// ネットワーク状態
export interface AdaptiveNetworkState {
  enabled: boolean;
  currentStrategy: StrategyType | null;
  activeSignals: LearningSignal[];
  effectiveness: Map<StrategyType, StrategyEffectiveness>;
  sessionStats: {
    questionsAnswered: number;
    correctAnswers: number;
    incorrectAnswers: number;
    sessionStartTime: number;
    totalSessionTime: number;
  };
  lastUpdated: number;
}

// ネットワーク設定
export interface NetworkConfig {
  enabled: boolean;
  minSignalStrength?: number;
  minConfidence?: number;
  maxActiveSignals?: number;
  effectivenessWindowSize?: number;
}

// デフォルト設定
export const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
  enabled: false,
  minSignalStrength: 0.3,
  minConfidence: 0.5,
  maxActiveSignals: 10,
  effectivenessWindowSize: 50,
};

// 実行済みアクション (必要に応じて定義を拡張)
export interface ExecutedAction {
  type: string;
  timestamp: number;
  details?: Record<string, any>;
  metadata?: Record<string, any>;
}

// セッション統計 (必要に応じて定義を拡張)
export interface SessionStatistics {
  questionsAnswered: number;
  correctAnswers: number;
  incorrectAnswers: number;
  sessionStartTime: number;
  totalSessionTime: number;
}
