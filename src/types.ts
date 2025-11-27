// quiz-app互換の7列CSV形式
// 語句,読み,意味,語源等解説,関連語,関連分野,難易度

// 10分野システム（厳格な型定義）
// 参照: docs/19-junior-high-vocabulary.md
export const OFFICIAL_CATEGORIES = [
  '言語基本',
  '学校・学習',
  '日常生活',
  '人・社会',
  '自然・環境',
  '食・健康',
  '運動・娯楽',
  '場所・移動',
  '時間・数量',
  '科学・技術',
] as const;

export type CategoryType = typeof OFFICIAL_CATEGORIES[number];

// 難易度の型定義
export const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type DifficultyType = typeof DIFFICULTY_LEVELS[number];

export interface Question {
  word: string;        // 語句（単語 or 熟語、熟語の場合スペース含む）
  reading: string;     // 読み（国際基準アクセント記号をカタカナで正確に）
  meaning: string;     // 意味（正解）
  etymology: string;   // 語源等解説（小中学生向け派生語習得支援）
  relatedWords: string; // 関連語（熟語・派生語と読みと意味）
  relatedFields: string; // 関連分野（表示用・CSVから読み込み）
  category?: string;   // 関連分野（フィルター用・内部処理）
  difficulty: string;  // 難易度（CSVから読み込み）
  source?: 'junior' | 'intermediate'; // データソース（高校受験 or 中級1800）
  type?: 'word' | 'phrase'; // 単語か熟語か（オプショナル、将来の拡張用）
  isPhraseOnly?: boolean; // 複数単語から成る熟語かどうか（スペース含む場合true）
}

// バリデーション用のヘルパー関数
export function isValidCategory(category: string): category is CategoryType {
  return (OFFICIAL_CATEGORIES as readonly string[]).includes(category);
}

export function isValidDifficulty(difficulty: string): difficulty is DifficultyType {
  return (DIFFICULTY_LEVELS as readonly string[]).includes(difficulty);
}

export interface QuizState {
  questions: Question[];
  currentIndex: number;
  score: number;
  totalAnswered: number;
  answered: boolean;
  selectedAnswer: string | null;
}

export interface CreatedQuestion {
  word: string;
  reading: string;
  meaning: string;
  etymology: string;
  relatedWords: string;
  relatedFields: string;
  difficulty: string;
}

// スペルクイズ用の状態
export interface SpellingState {
  questions: Question[];
  currentIndex: number;
  score: number;
  totalAnswered: number;
  answered: boolean;
  selectedLetters: (string | null)[]; // 選択されたアルファベット
  correctWord: string; // 正解の単語
}

// 長文読解用の型
export interface ReadingPassage {
  id: string;
  title: string;
  level?: string; // 難易度レベル（初級/中級/上級）
  theme?: string; // テーマ
  targetWordCount?: number; // 目標語数
  actualWordCount?: number; // 実際の語数
  phrases: ReadingPhrase[]; // 文節ごとのグループ
  translation?: string; // 全体の和訳（オプショナル）
}

export interface ReadingPhrase {
  id?: number; // フレーズID（オプショナル）
  words?: string[]; // 文節内の単語リスト(例: ["Modern", "technology"]) - オプショナル（segmentsから生成可能）
  phraseMeaning: string; // 文節全体の和訳(例: "現代の技術")
  segments: ReadingSegment[]; // 個別単語の詳細
  isUnknown?: boolean; // 文節全体が分からないとマークされているか - 旧バージョンとの互換性のため
}

export interface ReadingSegment {
  word: string; // 単語
  meaning: string; // 意味
  isUnknown: boolean; // 分からない単語としてマークされているか
}

// 問題集（単語セット）の型
export interface QuestionSet {
  id: string; // 一意のID
  name: string; // 問題集の名前
  questions: Question[]; // 問題リスト
  createdAt: number; // 作成日時（タイムスタンプ）
  isBuiltIn: boolean; // 組み込みサンプルかどうか（削除不可）
  source?: string; // 作成元（例: "長文抽出", "CSV読み込み", "手動作成"）
}

// 学習プランの型（期間調整可能）
export interface LearningSchedule {
  userId: string;
  startDate: number;
  currentDay: number;
  totalDays: number; // 30, 60, 90, 180など
  planDurationMonths: number; // 1, 2, 3, 6ヶ月など
  phase: 1 | 2 | 3;
  
  dailyGoals: {
    newWords: number;
    reviewWords: number;
    timeMinutes: number;
  };
  
  weeklyProgress: {
    week: number;
    wordsLearned: number;
    wordsReviewed: number;
    averageAccuracy: number;
    completionRate: number;
  }[];
  
  milestones: {
    day: number;
    title: string;
    wordsTarget: number;
    achieved: boolean;
  }[];
}

export interface DailyStudyPlan {
  date: number;
  dayNumber: number;
  phase: 1 | 2 | 3;
  
  morning: {
    newWords: Question[];
    duration: number;
    mode: 'discovery';
  };
  
  afternoon: {
    reviewWords: Question[];
    duration: number;
    mode: 'weakness';
  };
  
  evening: {
    mixedWords: Question[];
    duration: number;
    mode: 'mixed';
  };
  
  completed: boolean;
  actualAccuracy: number;
}

// AI人格システムの型定義
export type AIPersonality = 
  | 'drill-sergeant'    // 鬼軍曹
  | 'kind-teacher'      // 優しい先生
  | 'analyst'           // 冷静な分析官
  | 'enthusiastic-coach' // 熱血コーチ
  | 'wise-sage';        // 賢者

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
    beginner: number;    // 初級の平均正答率 (0-100)
    intermediate: number; // 中級の平均正答率
    advanced: number;     // 上級の平均正答率
  };
  
  // カテゴリー別の得意度
  categoryStrength: {
    [category: string]: {
      accuracyRate: number;      // 正答率(0-100)
      learningSpeed: number;     // 習得速度(問題数/単語)
      retentionRate: number;     // 定着率(0-100)
      confidence: 'high' | 'medium' | 'low'; // 得意度判定
      totalStudied: number;      // 学習した単語数
      totalMastered: number;     // 習得済み単語数
    };
  };
  
  // 動的閾値
  dynamicThresholds: {
    masteryThreshold: number;    // 習得判定の閾値(60-90%)
    reviewThreshold: number;     // 復習判定の閾値(40-70%)
    priorityThreshold: number;   // 優先出題の閾値(50-80%)
  };
  
  // 学習ペース
  learningPace: {
    dailyAverage: number;        // 1日平均問題数
    preferredBatchSize: number;  // 好みのバッチサイズ
    studyPattern: 'fast' | 'steady' | 'slow'; // 学習パターン
  };
  
  // 最終更新日時
  lastUpdated: number;
}
