// quiz-app互換の7列CSV形式
// 語句,読み,意味,語源等解説,関連語,関連分野,難易度

export interface Question {
  word: string;        // 語句
  reading: string;     // 読み
  meaning: string;     // 意味（正解）
  etymology: string;   // 語源等解説
  relatedWords: string; // 関連語
  relatedFields: string; // 関連分野
  difficulty: string;  // 難易度
  hint: string;        // ヒント（関連分野または語源から生成）
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
  words: string[]; // 文節内の単語リスト（例: ["Modern", "technology"]）
  phraseMeaning: string; // 文節全体の和訳（例: "現代の技術"）
  segments: ReadingSegment[]; // 個別単語の詳細
  isUnknown: boolean; // 文節全体が分からないとマークされているか
}

export interface ReadingSegment {
  word: string; // 単語
  meaning: string; // 意味
  isUnknown: boolean; // 分からない単語としてマークされているか
}
