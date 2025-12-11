---
description: 型定義の使用パターンとベストプラクティス
applyTo: 'src/**/*.{ts,tsx}'
---

# 型使用パターン

Phase 1で整理された型定義システム（`src/types/`）の使用方法とベストプラクティスを説明します。

## 📁 型定義の構造

```
src/types/
├── domain.ts       # ドメイン型（Question, QuestionSet, Answer等）
├── ui.ts           # UI型（Tab, DifficultyLevel, Category等）
├── reading.ts      # 読解型（ReadingPassage等）
├── ai.ts           # AI型（AIPersonality, CommentContext等）
├── storage.ts      # ストレージ型（LearningSchedule等）
└── index.ts        # 統合エクスポート
```

## 🎯 型のインポート

### 基本パターン

```typescript
// ✅ Good: @/types からインポート
import type { Question, QuestionSet, Answer } from '@/types';
import type { Tab, DifficultyLevel } from '@/types';
import type { ReadingPassage } from '@/types';

// ❌ Bad: 相対パスでインポート
import type { Question } from '../../types/domain';

// ❌ Bad: ローカルで型定義
interface Question {
  word: string;
  // ...
}
```

### カテゴリ別インポート

```typescript
// ✅ Good: 必要な型のみインポート
import type { 
  Question,      // domain.ts
  QuestionSet,   // domain.ts
  Answer         // domain.ts
} from '@/types';

// ✅ Good: UI型とドメイン型を明確に分離
import type { Question } from '@/types';           // domain
import type { Tab, DifficultyLevel } from '@/types'; // ui
```

## 📋 主要な型定義

### 1. ドメイン型（domain.ts）

**Question型**:
```typescript
interface Question {
  word: string;           // 語句
  reading: string;        // 読み（カタカナ）
  meaning: string;        // 意味
  etymology?: string;     // 語源等解説
  relatedWords?: string;  // 関連語
  category: string;       // カテゴリ
  difficulty: string;     // 難易度
  ipa?: string;          // IPA発音記号
  // ... 他のフィールド
}
```

**使用例**:
```typescript
import type { Question } from '@/types';

function QuizCard({ question }: { question: Question }) {
  return (
    <div>
      <h2>{question.word}</h2>
      <p>{question.reading}</p>
      <p>{question.meaning}</p>
    </div>
  );
}
```

**QuestionSet型**:
```typescript
interface QuestionSet {
  id: string;
  name: string;
  description: string;
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
}
```

**Answer型**:
```typescript
interface Answer {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timestamp: Date;
}
```

### 2. UI型（ui.ts）

**Tab型**:
```typescript
type Tab = 'translation' | 'spelling' | 'reading' | 'stats' | 'settings' | 'create';
```

**使用例**:
```typescript
import type { Tab } from '@/types';
import { useState } from 'react';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('translation');
  
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };
  
  return (
    <div>
      <button onClick={() => handleTabChange('translation')}>翻訳</button>
      <button onClick={() => handleTabChange('spelling')}>スペリング</button>
    </div>
  );
}
```

**DifficultyLevel型**:
```typescript
type DifficultyLevel = '初級' | '中級' | '上級' | 'all';
```

**Category型**:
```typescript
type Category = 
  | '言語基本'
  | '学校・学習'
  | '日常生活'
  | '人・社会'
  | '自然・環境'
  | '食・健康'
  | '運動・娯楽'
  | '場所・移動'
  | '時間・数量'
  | '科学・技術'
  | 'all';
```

### 3. 読解型（reading.ts）

**ReadingPassage型**:
```typescript
interface ReadingPassage {
  id: string;
  title: string;
  content: string;
  difficulty: DifficultyLevel;
  questions: ComprehensionQuestion[];
}

interface ComprehensionQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}
```

**使用例**:
```typescript
import type { ReadingPassage } from '@/types';

function ReadingView({ passage }: { passage: ReadingPassage }) {
  return (
    <div>
      <h1>{passage.title}</h1>
      <p>{passage.content}</p>
      {passage.questions.map(q => (
        <QuestionCard key={q.id} question={q} />
      ))}
    </div>
  );
}
```

### 4. AI型（ai.ts）

**AIPersonality型**:
```typescript
type AIPersonality = 'supportive' | 'strict' | 'humorous';
```

**CommentContext型**:
```typescript
interface CommentContext {
  isCorrect: boolean;
  consecutiveCorrect: number;
  difficulty: DifficultyLevel;
  personality: AIPersonality;
}
```

**使用例**:
```typescript
import type { AIPersonality, CommentContext } from '@/types';

function generateComment(context: CommentContext): string {
  if (context.isCorrect && context.consecutiveCorrect >= 3) {
    return context.personality === 'supportive' 
      ? 'すばらしい！その調子です！' 
      : '悪くないな。';
  }
  // ...
}
```

### 5. ストレージ型（storage.ts）

**LearningSchedule型**:
```typescript
interface LearningSchedule {
  wordId: string;
  nextReviewDate: Date;
  interval: number;      // 日数
  easeFactor: number;
  repetitions: number;
}
```

**ProgressData型**:
```typescript
interface ProgressData {
  wordId: string;
  correctCount: number;
  incorrectCount: number;
  lastReviewDate: Date;
  mastered: boolean;
}
```

## 🎨 型の定義パターン

### 1. Interface vs Type

**Interface使用（推奨）**:
```typescript
// ✅ Good: オブジェクト構造はinterface
interface Question {
  word: string;
  reading: string;
  meaning: string;
}

// 拡張可能
interface ExtendedQuestion extends Question {
  audioUrl: string;
}
```

**Type使用**:
```typescript
// ✅ Good: ユニオン型、リテラル型はtype
type Tab = 'translation' | 'spelling' | 'reading';
type DifficultyLevel = '初級' | '中級' | '上級';

// ✅ Good: 複雑な型操作
type ReadonlyQuestion = Readonly<Question>;
type PartialQuestion = Partial<Question>;
```

### 2. オプショナルプロパティ

```typescript
// ✅ Good: オプショナルは ? で明示
interface Question {
  word: string;           // 必須
  reading: string;        // 必須
  etymology?: string;     // オプショナル
  relatedWords?: string;  // オプショナル
}

// ❌ Bad: undefined を明示的に書かない
interface Question {
  etymology: string | undefined;  // 冗長
}
```

### 3. null vs undefined

```typescript
// ✅ Good: undefinedを使用（TypeScript標準）
interface QuizState {
  selectedAnswer: string | null;      // nullを明示的に許可する場合
  answeredCorrectly: boolean | null;  // nullを明示的に許可する場合
}

// ✅ Good: オプショナルはundefinedが暗黙的
interface Question {
  etymology?: string;  // undefined が暗黙的に許可される
}
```

### 4. ジェネリクス

```typescript
// ✅ Good: 汎用的なデータ構造
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// 使用例
const questionResponse: ApiResponse<Question[]> = {
  data: [/* ... */],
  status: 200,
  message: 'Success'
};
```

## 🔍 型ガード

### 1. Type Predicate

```typescript
// ✅ Good: 型ガード関数
function isQuestion(obj: unknown): obj is Question {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'word' in obj &&
    'reading' in obj &&
    'meaning' in obj
  );
}

// 使用例
function processData(data: unknown) {
  if (isQuestion(data)) {
    // data は Question 型として扱える
    console.log(data.word);
  }
}
```

### 2. Discriminated Union

```typescript
// ✅ Good: タグ付きユニオン
interface SuccessResult {
  type: 'success';
  data: Question[];
}

interface ErrorResult {
  type: 'error';
  message: string;
}

type Result = SuccessResult | ErrorResult;

// 使用例
function handleResult(result: Result) {
  if (result.type === 'success') {
    // result は SuccessResult 型
    console.log(result.data);
  } else {
    // result は ErrorResult 型
    console.log(result.message);
  }
}
```

## 📦 型のエクスポート

### index.ts パターン

```typescript
// src/types/index.ts
export type { Question, QuestionSet, Answer } from './domain';
export type { Tab, DifficultyLevel, Category } from './ui';
export type { ReadingPassage, ComprehensionQuestion } from './reading';
export type { AIPersonality, CommentContext } from './ai';
export type { LearningSchedule, ProgressData } from './storage';
```

**メリット**:
- 単一のインポート元
- 型の構造がわかりやすい
- リファクタリング時の影響範囲が限定的

## 🚫 アンチパターン

### 1. 型定義の分散

```typescript
// ❌ Bad: コンポーネントファイルで型定義
// src/components/QuizView.tsx
interface Question {
  word: string;
  // ...
}

// ❌ Bad: 複数の場所で同じ型を定義
// src/components/SpellingView.tsx
interface Question {
  word: string;
  // ...重複
}

// ✅ Good: @/types で一元管理
// src/types/domain.ts
export interface Question {
  word: string;
  // ...
}
```

### 2. any の使用

```typescript
// ❌ Bad: any を使用
function processQuestion(question: any) {
  console.log(question.word);  // 型チェック無し
}

// ✅ Good: 適切な型を使用
import type { Question } from '@/types';

function processQuestion(question: Question) {
  console.log(question.word);  // 型安全
}
```

### 3. 型アサーション乱用

```typescript
// ❌ Bad: 型アサーション乱用
const data = JSON.parse(jsonString) as Question;  // 危険！

// ✅ Good: 型ガードで検証
const data = JSON.parse(jsonString);
if (isQuestion(data)) {
  // 安全に使用
  console.log(data.word);
}
```

### 4. インライン型定義

```typescript
// ❌ Bad: Props で複雑な型をインライン定義
function QuizCard(props: {
  question: {
    word: string;
    reading: string;
    meaning: string;
  };
  onAnswer: (answer: string) => void;
}) {
  // ...
}

// ✅ Good: 型を分離
import type { Question } from '@/types';

interface QuizCardProps {
  question: Question;
  onAnswer: (answer: string) => void;
}

function QuizCard({ question, onAnswer }: QuizCardProps) {
  // ...
}
```

## 🧪 型のテスト

### 型レベルテスト

```typescript
// src/types/__tests__/domain.test.ts
import type { Question } from '../domain';

// 型の互換性テスト（コンパイル時にチェック）
const validQuestion: Question = {
  word: 'apple',
  reading: 'アップル',
  meaning: 'りんご',
  category: '食・健康',
  difficulty: '初級'
};

// @ts-expect-error - 必須フィールド不足
const invalidQuestion: Question = {
  word: 'apple'
};
```

## 📊 型定義の統計（2025年12月11日）

| ファイル | 行数（推定） | 主要な型 |
|---------|------------|---------|
| domain.ts | ~150行 | Question, QuestionSet, Answer |
| ui.ts | ~50行 | Tab, DifficultyLevel, Category |
| reading.ts | ~80行 | ReadingPassage, ComprehensionQuestion |
| ai.ts | ~100行 | AIPersonality, CommentContext |
| storage.ts | ~120行 | LearningSchedule, ProgressData |

## 📚 ベストプラクティス

### 1. 型の再利用

```typescript
// ✅ Good: 既存の型を拡張
import type { Question } from '@/types';

interface ExtendedQuestion extends Question {
  audioUrl: string;
  imageUrl: string;
}
```

### 2. Utility Types の活用

```typescript
import type { Question } from '@/types';

// 部分的な型
type PartialQuestion = Partial<Question>;

// 読み取り専用
type ReadonlyQuestion = Readonly<Question>;

// 特定のプロパティのみ
type QuestionPreview = Pick<Question, 'word' | 'meaning'>;

// 特定のプロパティを除外
type QuestionWithoutEtymology = Omit<Question, 'etymology'>;
```

### 3. 型の文書化

```typescript
/**
 * 問題データを表す型
 * 
 * @property word - 英単語またはフレーズ
 * @property reading - カタカナ読み（アクセント記号含む）
 * @property meaning - 日本語の意味
 * @property category - 10個の正式カテゴリのいずれか
 * @property difficulty - 初級・中級・上級のいずれか
 */
export interface Question {
  word: string;
  reading: string;
  meaning: string;
  category: string;
  difficulty: string;
  // ...
}
```

## 🔄 型の移行パターン

### Phase 1での移行

**Before（Phase 1前）**:
```typescript
// src/types.ts（単一ファイル）
export interface Question { /* ... */ }
export interface QuestionSet { /* ... */ }
export type Tab = 'translation' | 'spelling';
// ... 全ての型が1ファイルに
```

**After（Phase 1後）**:
```typescript
// src/types/domain.ts
export interface Question { /* ... */ }
export interface QuestionSet { /* ... */ }

// src/types/ui.ts
export type Tab = 'translation' | 'spelling';

// src/types/index.ts（統合エクスポート）
export type { Question, QuestionSet } from './domain';
export type { Tab } from './ui';
```

**移行の利点**:
- 型の発見性向上
- ファイルサイズ削減
- 関心事の分離

## 📝 関連ドキュメント

- [プロジェクト構造](../project-structure.instructions.md)
- [カスタムフックパターン](./custom-hooks-patterns.instructions.md)

---

**Last Updated**: 2025年12月11日  
**Version**: 2.0.0（Phase 1完了）
