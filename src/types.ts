// quiz-app互換の7列CSV形式
// 語句,読み,意味,語源等解説,関連語,関連分野,難易度

export interface Question {
  word: string;        // 語句（単語 or 熟語、熟語の場合スペース含む）
  reading: string;     // 読み（国際基準アクセント記号をカタカナで正確に）
  meaning: string;     // 意味（正解）
  etymology: string;   // 語源等解説（小中学生向け派生語習得支援）
  relatedWords: string; // 関連語（熟語・派生語と読みと意味）
  relatedFields: string; // 関連分野（表示用）
  category?: string;   // 関連分野（フィルター用）
  difficulty: string;  // 難易度
  type?: 'word' | 'phrase'; // 単語か熟語か（オプショナル、将来の拡張用）
  isPhraseOnly?: boolean; // 複数単語から成る熟語かどうか（スペース含む場合true）
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
  phrases: ReadingPhrase[]; // 文節ごとのグループ
  translation: string; // 全体の和訳
}

export interface ReadingPhrase {
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
