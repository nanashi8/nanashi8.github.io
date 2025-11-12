# データ構造・型定義仕様書

## 📌 概要

アプリケーション全体で使用されるTypeScript型定義とデータ構造の詳細仕様。

## 📊 基本型定義

### Question型（基幹データ型）

```typescript
export interface Question {
  word: string;         // 英単語・フレーズ
  reading: string;      // 読み（ひらがな）
  meaning: string;      // 日本語の意味
  explanation: string;  // 語源や詳細な解説
  relatedWords: string; // 関連語・類義語
  category: string;     // カテゴリ・関連分野
  difficulty: string;   // 難易度レベル
}
```

**使用箇所:**
- 和訳クイズ
- スペルクイズ
- 問題作成
- CSV読み込み

**データ例:**
```typescript
{
  word: "apple",
  reading: "アップル",
  meaning: "りんご",
  explanation: "古英語æppelに由来。果物の一種",
  relatedWords: "fruit, orange, banana",
  category: "食べ物",
  difficulty: "初級"
}
```

## 🎯 クイズ関連型

### QuizState型

```typescript
export interface QuizState {
  questions: Question[];     // 出題問題の配列
  currentIndex: number;      // 現在の問題番号（0始まり）
  score: number;             // 現在のスコア
  answered: boolean;         // 現在の問題に回答済みか
  selectedAnswer: string;    // 選択した回答
  wrongAnswers: Question[];  // 間違えた問題のリスト
}
```

**初期状態:**
```typescript
const initialQuizState: QuizState = {
  questions: [],
  currentIndex: 0,
  score: 0,
  answered: false,
  selectedAnswer: '',
  wrongAnswers: []
};
```

**状態遷移:**
```
初期状態 → CSV読込 → 問題表示 → 回答 → 判定 → 次の問題 → ...
```

### SpellingState型

```typescript
export interface SpellingState {
  questions: Question[];      // 出題問題の配列
  currentIndex: number;       // 現在の問題番号
  score: number;              // スコア
  answered: boolean;          // 回答済みフラグ
  isCorrect: boolean;         // 正解フラグ
  selectedLetters: string[];  // 選択した文字の配列
  wrongAnswers: Question[];   // 間違えた問題リスト
}
```

**selectedLettersの構造:**
```typescript
// 例: "APPLE"で空欄が[1, 3]の場合
selectedLetters = ['', '']  // 初期状態
selectedLetters = ['P', '']  // 1つ目選択後
selectedLetters = ['P', 'L']  // 2つ目選択後（自動チェック）
```

## 📖 長文読解関連型

### ReadingPassage型

```typescript
export interface ReadingPassage {
  id: string;              // パッセージの一意ID
  title: string;           // タイトル
  phrases: ReadingPhrase[]; // フレーズの配列
}
```

**データ例:**
```typescript
{
  id: 'passage1',
  title: 'Learning and Technology',
  phrases: [/* フレーズ配列 */]
}
```

### ReadingPhrase型

```typescript
export interface ReadingPhrase {
  id: string;              // フレーズの一意ID
  words: string[];         // 英単語の配列
  phraseMeaning: string;   // フレーズ全体の和訳
  segments: ReadingSegment[]; // 単語セグメント情報
  isUnknown: boolean;      // 不明フラグ（現在未使用）
}
```

**データ例:**
```typescript
{
  id: 'phrase1',
  words: ['Learning', 'is', 'a', 'lifelong', 'journey'],
  phraseMeaning: '学習は生涯の旅である',
  segments: [
    { word: 'Learning', meaning: '学習', isUnknown: false },
    { word: 'is', meaning: 'be動詞(3単現)', isUnknown: false },
    { word: 'a', meaning: '不定冠詞', isUnknown: false },
    { word: 'lifelong', meaning: '生涯の', isUnknown: false },
    { word: 'journey', meaning: '旅', isUnknown: false }
  ],
  isUnknown: false
}
```

### ReadingSegment型

```typescript
export interface ReadingSegment {
  word: string;      // 英単語
  meaning: string;   // 日本語の意味
  isUnknown: boolean; // 分からない単語としてマークされているか
}
```

**状態管理:**
```typescript
// App.tsx内で管理
const [unknownSegments, setUnknownSegments] = useState<Set<string>>(new Set());

// セグメントキー形式: "phraseId-wordIndex"
// 例: "phrase1-2" → phrase1のwords[2]
```

## 🔧 ユーティリティ型

### SpellingPuzzle型（内部使用）

```typescript
interface SpellingPuzzle {
  word: string;          // 完全な単語（大文字）
  blanks: number[];      // 空欄のインデックス配列
  choices: string[];     // アルファベット選択肢
}
```

**生成例:**
```typescript
// "APPLE"から生成
{
  word: "APPLE",
  blanks: [1, 3],  // P と L を空欄に
  choices: ['P', 'L', 'E', 'M', 'T', 'R', 'I', 'O']  // シャッフル済み
}
```

## 📦 データフロー図

### 和訳クイズのデータフロー

```
CSV File
   ↓ (parseCSV)
Question[]
   ↓ (shuffle)
QuizState.questions
   ↓ (generateChoices)
[正解, 不正解1, 不正解2]
   ↓ (user selection)
QuizState.selectedAnswer
   ↓ (判定)
QuizState.score / wrongAnswers
```

### 長文読解のデータフロー

```
ReadingPassage
   ↓
ReadingPhrase[]
   ↓
ReadingSegment[]
   ↓ (user click)
unknownSegments: Set<string>
   ↓ (submit)
Question[] (unknownWords)
   ↓
App.tsx (unknownWords state)
   ↓
QuizView / SpellingView
```

## 🗂️ CSV形式仕様

### 標準フォーマット

```csv
語句,読み,意味,語源等解説,関連語,関連分野,難易度
apple,アップル,りんご,古英語æppel,fruit,食べ物,初級
```

### パース処理

```typescript
export function parseCSV(text: string): Question[] {
  const lines = text.trim().split('\n');
  const questions: Question[] = [];
  
  // ヘッダー行をスキップ
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // CSVパース（簡易版）
    const parts = line.split(',');
    
    questions.push({
      word: parts[0]?.trim() || '',
      reading: parts[1]?.trim() || '',
      meaning: parts[2]?.trim() || '',
      explanation: parts[3]?.trim() || '',
      relatedWords: parts[4]?.trim() || '',
      category: parts[5]?.trim() || '',
      difficulty: parts[6]?.trim() || ''
    });
  }
  
  return questions;
}
```

## 🔄 状態管理パターン

### App.tsxの状態構造

```typescript
// グローバル状態
const [activeTab, setActiveTab] = useState<Tab>('translation');
const [unknownWords, setUnknownWords] = useState<Question[]>([]);

// タブ固有の状態
// QuizView内
const [quizState, setQuizState] = useState<QuizState>(initialState);

// SpellingView内
const [spellingState, setSpellingState] = useState<SpellingState>(initialState);

// ReadingView内
const [passages] = useState<ReadingPassage[]>(samplePassages);
const [unknownSegments, setUnknownSegments] = useState<Set<string>>(new Set());
```

### Props構造

```typescript
// ReadingView
interface ReadingViewProps {
  onAddUnknownWords: (words: Question[]) => void;
}

// FileSelector
interface FileSelectorProps {
  onFileSelect: (file: File) => void;
}

// ScoreBoard
interface ScoreBoardProps {
  score: number;
  total: number;
}

// QuestionCard
interface QuestionCardProps {
  question: Question;
  choices: string[];
  selectedAnswer: string;
  answered: boolean;
  onAnswer: (answer: string) => void;
}
```

## 🎨 型安全性のベストプラクティス

### 型ガード

```typescript
function isValidQuestion(obj: any): obj is Question {
  return (
    typeof obj === 'object' &&
    typeof obj.word === 'string' &&
    typeof obj.meaning === 'string'
  );
}
```

### 型アサーション

```typescript
// 避けるべき
const question = data as Question;

// 推奨
const question: Question = {
  word: data.word || '',
  reading: data.reading || '',
  // ...
};
```

### ジェネリクス活用

```typescript
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

## 📝 型拡張のガイドライン

### 新機能追加時

1. **types.tsに型定義を追加**
```typescript
export interface NewFeatureState {
  // フィールド定義
}
```

2. **既存型の拡張**
```typescript
export interface Question {
  // 既存フィールド
  imageUrl?: string;  // オプショナルで追加
}
```

3. **バージョン管理**
```typescript
// v1互換性を保つ
export interface QuestionV2 extends Question {
  audioUrl?: string;
}
```

## 🔍 デバッグ用ヘルパー

```typescript
// 型情報をログ出力
export function debugQuestion(q: Question): void {
  console.log('Question:', {
    word: q.word,
    meaning: q.meaning,
    hasExplanation: !!q.explanation,
    category: q.category || 'none'
  });
}

// 状態の検証
export function validateQuizState(state: QuizState): boolean {
  return (
    Array.isArray(state.questions) &&
    state.currentIndex >= 0 &&
    state.currentIndex < state.questions.length &&
    state.score >= 0 &&
    state.score <= state.questions.length
  );
}
```
