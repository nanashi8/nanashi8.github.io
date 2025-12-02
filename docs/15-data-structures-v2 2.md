# 15. データ構造仕様書（実装準拠版）

**最終更新**: 2025年12月2日  
**目的**: 機能損失時に正確に復旧できる完全な型定義仕様

本ドキュメントは `src/types.ts` の実装と完全に同期しています。

---

## 📦 概要

本ドキュメントでは、アプリケーション全体で使用されるTypeScript型定義とデータ構造を詳細に説明します。一貫性のあるデータモデルにより、型安全性を確保し、開発効率を向上させています。

**実装ファイル**: `src/types.ts`  
**TypeScriptバージョン**: 5.6.3  
**strictモード**: 有効

---

## 🎯 主要な型定義

### 1. Question（単語・熟語データ）

**ファイル**: `src/types.ts`

```typescript
export interface Question {
  word: string;          // 語句（単語 or 熟語、熟語の場合スペース含む）
  reading: string;       // 読み（国際基準アクセント記号をカタカナで正確に）
  meaning: string;       // 意味（正解）
  etymology: string;     // 語源等解説（小中学生向け派生語習得支援）
  relatedWords: string;  // 関連語（熟語・派生語と読みと意味）
  relatedFields: string; // 関連分野（表示用・CSVから読み込み）
  category?: string;     // 関連分野（フィルター用・内部処理）
  difficulty: string;    // 難易度（CSVから読み込み）
  source?: 'junior' | 'intermediate'; // データソース（高校受験 or 中級1800）
  type?: 'word' | 'phrase'; // 単語か熟語か（オプショナル）
  isPhraseOnly?: boolean; // 複数単語から成る熟語かどうか（スペース含む場合true）
}
```

#### 📋 relatedFields（関連分野）の値

必ず以下10個のカテゴリのいずれか1つ（厳密一致必須）:

```typescript
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
```

詳細: [19-junior-high-vocabulary.md](./19-junior-high-vocabulary.md)

#### 難易度の型定義

```typescript
export const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type DifficultyType = typeof DIFFICULTY_LEVELS[number];
```

- `beginner`: 中1レベル
- `intermediate`: 中2-3レベル
- `advanced`: 高校入試レベル

#### バリデーション関数

```typescript
export function isValidCategory(category: string): category is CategoryType {
  return (OFFICIAL_CATEGORIES as readonly string[]).includes(category);
}

export function isValidDifficulty(difficulty: string): difficulty is DifficultyType {
  return (DIFFICULTY_LEVELS as readonly string[]).includes(difficulty);
}
```

#### 使用例

```typescript
// CSV解析時
const question: Question = {
  word: "abandon",
  reading: "アバンドン",
  meaning: "捨てる、放棄する",
  etymology: "ab-(離れて) + bandon(支配) → 支配を離れる",
  relatedWords: "abandonment(名詞): 放棄",
  relatedFields: "言語基本",
  difficulty: "intermediate"
};

// バリデーション
if (isValidCategory(question.relatedFields)) {
  console.log("有効なカテゴリー");
}
```

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

#### 使用例

```typescript
const [quizState, setQuizState] = useState<QuizState>({
  questions: [],
  currentIndex: 0,
  score: 0,
  totalAnswered: 0,
  answered: false,
  selectedAnswer: null
});
```

### 3. SpellingState（スペルクイズ状態）

```typescript
export interface SpellingState {
  questions: Question[];
  currentIndex: number;
  score: number;
  totalAnswered: number;
  answered: boolean;
  selectedLetters: (string | null)[]; // 選択されたアルファベット
  correctWord: string; // 正解の単語
}
```

### 4. ReadingPassage（長文データ）

```typescript
export interface ReadingPassage {
  id: string;
  title: string;
  level?: string; // 難易度レベル（Beginner/Intermediate/Advanced）
  theme?: string; // テーマ
  targetWordCount?: number; // 目標語数
  actualWordCount?: number; // 実際の語数
  phrases: ReadingPhrase[]; // 文節ごとのグループ
  translation?: string; // 全体の和訳（オプショナル）
}

export interface ReadingPhrase {
  id?: number; // フレーズID（オプショナル）
  words?: string[]; // 文節内の単語リスト (例: ["Modern", "technology"])
  phraseMeaning: string; // 文節全体の和訳 (例: "現代の技術")
  segments: ReadingSegment[]; // 個別単語の詳細
  isUnknown?: boolean; // 文節全体が分からないとマークされているか
}

export interface ReadingSegment {
  word: string; // 単語（表示形：変化形のまま）
  meaning: string; // 意味
  isUnknown: boolean; // 分からない単語としてマークされているか
  
  // Question型互換フィールド（単語帳保存用）
  lemma?: string; // 原形（辞書形）- gatheredならgather
  reading?: string; // カタカナ読み（例: ギャザー）
  etymology?: string; // 語源等解説（小中学生向け）
  relatedWords?: string; // 関連語（熟語・派生語と読みと意味）
  relatedFields?: string; // 関連分野
  difficulty?: string; // 難易度（beginner/intermediate/advanced）
}
```

### 5. QuestionSet（問題集）

```typescript
export interface QuestionSet {
  id: string; // 一意のID
  name: string; // 問題集の名前
  questions: Question[]; // 問題リスト
  createdAt: number; // 作成日時（タイムスタンプ）
  isBuiltIn: boolean; // 組み込みサンプルかどうか（削除不可）
  source?: string; // 作成元（例: "長文抽出", "CSV読み込み", "手動作成"）
}
```

### 6. LearningSchedule（学習プラン）

```typescript
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
```

### 7. DailyStudyPlan（日次学習プラン）

```typescript
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
```

### 8. AIPersonality（AI人格）

```typescript
export type AIPersonality = 
  | 'drill-sergeant'      // 鬼軍曹
  | 'kind-teacher'        // 優しい先生
  | 'analyst'             // 冷静な分析官
  | 'enthusiastic-coach'  // 熱血コーチ
  | 'wise-sage';          // 賢者
```

### 9. CommentContext（AIコメント生成用コンテキスト）

```typescript
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
```

### 10. UserLearningProfile（ユーザー学習プロファイル）

```typescript
export interface UserLearningProfile {
  // 難易度別の基礎能力
  difficultyMastery: {
    beginner: number;      // 初級の平均正答率 (0-100)
    intermediate: number;  // 中級の平均正答率
    advanced: number;      // 上級の平均正答率
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
```

### 11. CreatedQuestion（問題作成用）

```typescript
export interface CreatedQuestion {
  word: string;
  reading: string;
  meaning: string;
  etymology: string;
  relatedWords: string;
  relatedFields: string;
  difficulty: string;
}
```

---

## 📚 関連ドキュメント

- [01. プロジェクト概要](./01-project-overview.md) - 技術スタック
- [16. ストレージ戦略](./16-storage-strategy.md) - データ保存方法
- [TypeScript開発ガイドライン](./TYPESCRIPT_DEVELOPMENT_GUIDELINES.md) - 型安全な開発
- [緊急復旧ガイド](./EMERGENCY_RECOVERY_GUIDE.md) - 機能損失時の復旧手順

---

**最終更新**: 2025年12月2日  
**ドキュメントバージョン**: 2.0.0  
**改訂履歴**:
- 2025-12-02: 実装準拠版に全面改訂（src/types.tsと完全同期）
