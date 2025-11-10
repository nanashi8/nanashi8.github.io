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
