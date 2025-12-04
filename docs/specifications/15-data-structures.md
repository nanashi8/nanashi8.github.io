# 15. データ構造仕様書

## 📦 概要

本ドキュメントでは、アプリケーション全体で使用されるTypeScript型定義とデータ構造を詳細に説明します。一貫性のあるデータモデルにより、型安全性を確保し、開発効率を向上させています。

---

## 🎯 主要な型定義

### 1. Question（単語・熟語データ）

```typescript
export interface Question {
  word: string;          // 語句（単語 or 熟語）
  reading: string;       // 読み（カタカナ表記）
  meaning: string;       // 意味（正解）
  etymology: string;     // 語源解説
  relatedWords: string;  // 関連語
  relatedFields: string; // 関連分野（10カテゴリのいずれか）
  category?: string;     // カテゴリー（フィルター用・内部処理）
  difficulty: string;    // 難易度（初級/中級/上級）
  type?: 'word' | 'phrase';
  isPhraseOnly?: boolean; // 熟語フラグ
}
```

**📋 relatedFields（関連分野）の値**:
- 必ず以下10個のカテゴリのいずれか1つ
- 詳細: [19-junior-high-vocabulary.md](./19-junior-high-vocabulary.md)

1. 言語基本
2. 学校・学習
3. 日常生活
4. 人・社会
5. 自然・環境
6. 食・健康
7. 運動・娯楽
8. 場所・移動
9. 時間・数量
10. 科学・技術

**難易度**:
- `初級`: 中1レベル
- `中級`: 中2-3レベル
- `上級`: 高校入試レベル

### 2. QuizState（和訳クイズ状態）

```typescript
export interface QuizState {
  questions: Question[];
  currentIndex: number;
  score: number;
  totalAnswered: number;
  answered: boolean;
  selectedAnswer: string | null;
}
```

### 3. SpellingState（スペルクイズ状態）

```typescript
export interface SpellingState {
  questions: Question[];
  currentIndex: number;
  score: number;
  totalAnswered: number;
  answered: boolean;
  selectedLetters: (string | null)[];
  correctWord: string;
}
```

### 4. ReadingPassage（長文データ）

```typescript
export interface ReadingPassage {
  id: string;
  title: string;
  level?: string;
  theme?: string;
  targetWordCount?: number;
  actualWordCount?: number;
  phrases: ReadingPhrase[];
  translation?: string;
}

export interface ReadingPhrase {
  phraseMeaning: string;
  segments: ReadingSegment[];
}

export interface ReadingSegment {
  word: string;
  meaning: string;
  isUnknown: boolean;
}
```

### 5. QuestionSet（問題集）

```typescript
export interface QuestionSet {
  id: string;
  name: string;
  questions: Question[];
  createdAt: number;
  isBuiltIn: boolean;
  source?: string;
}
```

### 6. LearningSchedule（学習プラン）

```typescript
export interface LearningSchedule {
  userId: string;
  startDate: number;
  currentDay: number;
  totalDays: number;
  planDurationMonths: number;
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
```

### 7. AIPersonality（AI人格）

```typescript
export type AIPersonality = 
  | 'kind-teacher'
  | 'strict-coach'
  | 'cheerful-friend'
  | 'calm-mentor';
```

### 8. WordProgress（単語進捗）

```typescript
export interface WordProgress {
  word: string;
  correctCount: number;
  incorrectCount: number;
  lastStudied: number;
  retentionLevel: number;
  learningHistory: LearningAttempt[];
}

export interface LearningAttempt {
  timestamp: number;
  wasCorrect: boolean;
  responseTime: number;
  mode: 'translation' | 'spelling' | 'reading';
}
```

---

## 📚 関連ドキュメント

- [01. プロジェクト概要](./01-project-overview.md) - 技術スタック
- [16. ストレージ戦略](./16-storage-strategy.md) - データ保存方法
