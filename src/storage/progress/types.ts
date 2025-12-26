// 進捗ストレージの型定義

export type SessionHistoryItem = {
  status: 'correct' | 'incorrect' | 'review' | 'mastered';
  word: string;
  timestamp: number;
};

export interface StudySettings {
  maxReviewCount: number; // 要復習上限（デフォルト: 10）
}

export interface QuizResult {
  id: string;
  questionSetId: string;
  questionSetName: string;
  score: number;
  total: number;
  percentage: number;
  date: number;
  timeSpent: number; // 秒
  incorrectWords: string[];
  mode: 'translation' | 'spelling' | 'reading' | 'grammar' | 'memorization';
  category?: string; // 関連分野
  difficulty?: string; // 難易度レベル
}

// 単語ごとの学習進捗
export interface WordProgress {
  word: string; // 単語
  correctCount: number; // 正解回数
  incorrectCount: number; // 不正解回数
  consecutiveCorrect: number; // 連続正解回数
  consecutiveIncorrect: number; // 連続不正解回数
  firstAttempted?: number; // 初出題日時（タイムスタンプ）- 時間ベース優先度AI用
  lastStudied: number; // 最終学習日時（タイムスタンプ）
  totalResponseTime: number; // 累計応答時間（ミリ秒）
  averageResponseTime: number; // 平均応答時間（ミリ秒）
  difficultyScore: number; // 難易度スコア（0-100、高いほど苦手）
  userDifficultyRating?: number; // ユーザーの主観的難易度評価（1-3: 簡単/普通/難しい）
  masteryLevel: 'new' | 'learning' | 'mastered'; // 習熟レベル
  responseTimes: number[]; // 応答時間の履歴（最新10件）
  category?: string; // カテゴリー

  // 出題優先度（解答直後に計算・保存）
  calculatedPriority?: number; // 出題優先度（0-100、高いほど優先）
  accuracyRate?: number; // 正答率（0-1）
  lastPriorityUpdate?: number; // 優先度最終更新日時
  difficulty?: string; // 難易度レベル
  skippedCount?: number; // スキップ回数
  lastSkipped?: number; // 最終スキップ日時（タイムスタンプ）
  skipExcludeUntil?: number; // この日時まで出題除外（タイムスタンプ）
  needsVerification?: boolean; // AI学習アシスタント: 検証が必要
  verificationReason?: string; // AI学習アシスタント: 検証が必要な理由
  meaning?: string; // 意味（苦手語句表示用）
  reading?: string; // 読み（苦手語句表示用）

  // モード別統計（難易度別リセット用）
  totalAttempts?: number; // 総試行回数
  translationAttempts?: number; // 和訳モードの試行回数
  translationCorrect?: number; // 和訳モードの正解回数
  translationStreak?: number; // 和訳モードの連続正解数
  spellingAttempts?: number; // スペルモードの試行回数
  spellingCorrect?: number; // スペルモードの正解回数
  spellingStreak?: number; // スペルモードの連続正解数
  grammarAttempts?: number; // 文法モードの試行回数
  grammarCorrect?: number; // 文法モードの正解回数
  grammarStreak?: number; // 文法モードの連続正解数
  memorizationAttempts?: number; // 暗記モードの試行回数
  memorizationCorrect?: number; // 暗記モードの正解回数
  memorizationStillLearning?: number; // 暗記モードのまだまだ回数
  memorizationStreak?: number; // 暗記モードの連続正解数

  // 学習曲線AI用の詳細履歴
  learningHistory?: Array<{
    timestamp: number;
    wasCorrect: boolean;
    responseTime: number;
    userAnswer?: string;
    sessionIndex?: number;
  }>;

  // 混同履歴（この単語を誤答として選んだ履歴）
  confusedWith?: Array<{
    word: string; // 実際に出題された単語
    timestamp: number; // 混同した日時
  }>;
  confusionCount?: number; // 混同された合計回数
  lastConfused?: number; // 最終混同日時

  // 定着済み単語の復習管理
  nextReviewDate?: number; // 次回復習予定日時（タイムスタンプ）

  // 📍 タブ別Position（AI出題工夫用）
  position?: number; // 総合Position (0-100) - 互換性のため任意
  memorizationPosition?: number; // 暗記タブでのPosition (0-100)
  translationPosition?: number; // 和訳タブでのPosition (0-100)
  spellingPosition?: number; // スペルタブでのPosition (0-100)
  grammarPosition?: number; // 文法タブでのPosition (0-100)

  // 間隔反復学習（Spaced Repetition）用フィールド
  easinessFactor?: number; // 難易度係数（1.3-2.5、初期値2.5）個人の学習速度を反映
  reviewInterval?: number; // 現在の復習間隔（日数）
  lastReviewDate?: number; // 最終復習日時（タイムスタンプ）
  totalReviews?: number; // 総復習回数
  avgResponseSpeed?: number; // 平均応答速度（ms）- 学習速度の指標

  // === Phase 4: SM-2追加フィールド ===
  easeFactor?: number; // SM-2難易度係数（1.3-3.0、初期値2.5）easinessFactorのエイリアス
  lastInterval?: number; // 前回の復習間隔（日数）
  repetitions?: number; // 連続正解回数（SM-2用）
  nextSM2ReviewDate?: Date; // SM-2による次回復習日

  // === Phase 4: 長期記憶段階 ===
  memoryStage?: 'WORKING_MEMORY' | 'SHORT_TERM' | 'CONSOLIDATING' | 'LONG_TERM';
  stageTransitionDate?: number; // 段階移行日時（タイムスタンプ）

  // 🧠 個別忘却曲線モデル（Half-Life Regression風）
  memoryStrength?: number; // 記憶強度（0-100、個人適応）初期値50
  halfLife?: number; // 記憶半減期（日数）- この単語をこのユーザーが半分忘れるまでの時間
  lastRetentionRate?: number; // 最終記憶保持率予測（0-1）
  forgettingCurveParams?: {
    decayRate: number; // 減衰率（個人固有）0.1-0.5
    recoveryRate: number; // 回復率（正解時の記憶強化）0.5-2.0
    baseRetention: number; // 基礎保持率（個人の記憶力）0.3-0.9
  };
}

export interface Statistics {
  totalQuizzes: number;
  totalQuestions: number;
  totalCorrect: number;
  averageScore: number;
  bestScore: number;
  streakDays: number;
  lastStudyDate: number;
  studyDates: number[]; // 学習した日付のタイムスタンプ配列
}

export interface QuestionSetStats {
  attempts: number;
  bestScore: number;
  averageScore: number;
  lastAttempt: number;
  totalTimeSpent: number;
}

export interface UserProgress {
  // 進捗データのスキーマバージョン（後方互換のため任意）
  schemaVersion?: number;
  results: QuizResult[];
  statistics: Statistics;
  questionSetStats: {
    [setId: string]: QuestionSetStats;
  };
  categoryStats: {
    [category: string]: {
      attempts: number;
      correctCount: number;
      incorrectCount: number;
    };
  };
  difficultyStats: {
    [difficulty: string]: {
      attempts: number;
      correctCount: number;
      incorrectCount: number;
    };
  };
  wordProgress: {
    [word: string]: WordProgress;
  };
}

export interface DetailedRetentionStats {
  totalWords: number;
  appearedWords: number;
  masteredWords: number;
  masteredCount: number;
  learningWords: number;
  learningCount: number;
  strugglingCount: number;
  newWords: number;
  retentionRate: number;
  basicRetentionRate: number;
  weightedRetentionRate: number;
  masteredPercentage: number;
  learningPercentage: number;
  strugglingPercentage: number;
  averageAttempts: number;
  categoryBreakdown: {
    [category: string]: {
      total: number;
      mastered: number;
      learning: number;
      new: number;
      retentionRate: number;
    };
  };
  difficultyBreakdown: {
    [difficulty: string]: {
      total: number;
      mastered: number;
      learning: number;
      new: number;
      retentionRate: number;
    };
  };
}

export interface MasteryPrediction {
  word: string;
  currentMasteryLevel?: 'new' | 'learning' | 'mastered';
  predictedDaysToMastery?: number;
  confidence: number;
  recommendedPracticeFrequency?: string;
  strengths?: string[];
  weaknesses?: string[];
  // 互換性のため追加
  currentStatus?: string;
  remainingCorrectAnswers?: number;
  nextMilestone?: string;
  estimatedDays?: number;
}

export interface DailyPlanInfo {
  date?: string;
  reviewWords?:
    | Array<{
        word: string;
        meaning: string;
        reading: string;
        lastStudied: number;
        masteryLevel: string;
      }>
    | string[];
  newWords?: Array<{
    word: string;
    meaning: string;
    reading: string;
  }>;
  totalReviewCount?: number;
  totalNewCount?: number;
  estimatedMinutes?: number;
  // 実際の実装で使用されているプロパティ（必須）
  reviewWordsCount: number;
  scheduledWordsCount: number;
  totalPlannedCount: number;
  scheduledWords?: string[];
}
