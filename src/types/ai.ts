/**
 * AI関連型定義
 * AIパーソナリティ、コメント生成、学習プロファイルに関する型
 */

// AI人格システムの型定義
export type AIPersonality =
  | 'drill-sergeant' // 鬼軍曹
  | 'kind-teacher' // 優しい先生
  | 'analyst' // 冷静な分析官
  | 'enthusiastic-coach' // 熱血コーチ
  | 'wise-sage'; // 賢者

// AIコメント生成用のコンテキスト
export interface CommentContext {
  // 回答情報
  isCorrect: boolean;
  attemptCount: number;
  responseTime: number; // ミリ秒

  // ストリーク
  correctStreak: number;
  incorrectStreak: number;

  // 単語情報
  word: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;

  // ユーザーの状態
  userAccuracy: number; // 全体正答率(0-100)
  categoryAccuracy: number; // カテゴリー正答率(0-100)
  isWeakCategory: boolean;
  hasSeenBefore: boolean;
  previousAttempts: number; // この単語の過去試行回数

  // 進捗情報
  todayQuestions: number;
  todayAccuracy: number;
  planProgress: number; // プランとの進捗率(0-100)

  // 時間帯
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

// ユーザーの学習プロファイル
export interface UserLearningProfile {
  // 難易度別の基礎能力
  difficultyMastery: {
    beginner: number; // 初級の平均正答率 (0-100)
    intermediate: number; // 中級の平均正答率
    advanced: number; // 上級の平均正答率
  };

  // カテゴリー別の得意度
  categoryStrength: {
    [category: string]: {
      accuracyRate: number; // 正答率(0-100)
      learningSpeed: number; // 習得速度(問題数/単語)
      retentionRate: number; // 定着率(0-100)
      confidence: 'high' | 'medium' | 'low'; // 得意度判定
      totalStudied: number; // 学習した単語数
      totalMastered: number; // 習得済み単語数
    };
  };

  // 動的閾値
  dynamicThresholds: {
    masteryThreshold: number; // 習得判定の閾値(60-90%)
    reviewThreshold: number; // 復習判定の閾値(40-70%)
    priorityThreshold: number; // 優先出題の閾値(50-80%)
  };

  // 学習ペース
  learningPace: {
    dailyAverage: number; // 1日平均問題数
    preferredBatchSize: number; // 好みのバッチサイズ
    studyPattern: 'fast' | 'steady' | 'slow'; // 学習パターン
  };

  // 最終更新日時
  lastUpdated: number;
}

// 暗記行動の記録
export interface MemorizationBehavior {
  word: string;
  timestamp: number;
  viewDuration: number; // 滞在秒数
  swipeDirection: 'left' | 'right'; // スワイプ方向
  sessionId: string;
  consecutiveViews: number; // このセッション内での連続表示回数
}

// 学習曲線の予測データ
export interface MemorizationCurve {
  word: string;
  exposures: Array<{
    timestamp: number;
    viewDuration: number;
    swipeDirection: 'left' | 'right';
    confidence: number; // 0-1: AIが推定する定着度
  }>;
  predictedMastery: number; // 0-1: 次回右スワイプする確率
  optimalNextReview: number; // 最適な次回復習時刻
  learningVelocity: number; // 学習速度（曲線の勾配）
}

// 個人別学習パラメータ
export interface PersonalizedLearningProfile {
  userId: string;

  // 学習速度プロファイル
  learningSpeed: 'fast' | 'medium' | 'slow';

  // 最適な復習間隔（個人差）
  optimalReviewIntervals: {
    firstReview: number; // 初回復習（分）
    secondReview: number; // 2回目（時間）
    thirdReview: number; // 3回目（日）
  };

  // 滞在時間の閾値（統計から算出）
  viewDurationThresholds: {
    quick: number; // さっと見た
    normal: number; // 通常
    struggling: number; // 苦戦中
  };

  // 予測モデルの信頼度
  modelConfidence: number; // 0-1

  // 較正データ
  calibrationData: {
    totalPredictions: number;
    correctPredictions: number;
    overestimations: number; // 過大評価した回数
    underestimations: number; // 過小評価した回数
  };
}
