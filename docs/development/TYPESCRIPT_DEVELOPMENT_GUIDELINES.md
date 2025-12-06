# TypeScript/React 開発ガイドライン

**最終更新**: 2025年12月2日  
**対象**: 英語学習アプリ (nanashi8.github.io)

---

## 📋 目次

1. [概要](#概要)
1. [プロジェクト構成](#プロジェクト構成)
1. [TypeScript設定](#typescript設定)
1. [コンポーネント設計](#コンポーネント設計)
1. [状態管理](#状態管理)
1. [型定義](#型定義)
1. [ESLintルール](#eslintルール)
1. [開発フロー](#開発フロー)
1. [トラブルシューティング](#トラブルシューティング)

---

## 概要

### 原則

- **型安全第一**: すべてのコードをTypeScriptで記述し、`any`型の使用を避ける
- **関数コンポーネント**: React Hooksベースの関数コンポーネントを使用
- **単一責任**: 1コンポーネント = 1責務
- **Props明示**: すべてのPropsにインターフェースを定義
- **副作用の分離**: useEffectの依存配列を正確に管理

### 技術スタック

```json
{
  "react": "^18.3.1",
  "typescript": "^5.6.3",
  "vite": "^5.4.21"
}
```

---

## プロジェクト構成

### ディレクトリ構造

```
src/
├── components/           # Reactコンポーネント
│   ├── AICommentGenerator.tsx
│   ├── CalendarHeatmap.tsx
│   ├── GrammarQuiz.tsx
│   ├── LearningCurveChart.tsx
│   ├── QuizApp.tsx       # メインクイズコンポーネント
│   ├── RadarChart.tsx
│   ├── ReadingComprehension.tsx
│   ├── SettingsPanel.tsx
│   ├── SpellingQuiz.tsx
│   ├── Stats.tsx
│   └── VocabularyCreator.tsx
│
├── data/                 # データファイル
│   ├── grade1/
│   ├── grade2/
│   ├── grade3/
│   └── grammar/
│
├── hooks/               # カスタムフック（🆕 今後追加）
│   └── useQuizState.ts
│
├── types/               # 型定義ファイル
│   ├── quiz.ts
│   ├── vocabulary.ts
│   └── stats.ts
│
├── utils/               # ユーティリティ関数
│   ├── csvParser.ts
│   └── storage.ts
│
├── styles/              # スタイルシート
│   ├── variables.css
│   ├── global.css
│   └── themes/
│
├── App.tsx              # アプリケーションルート
└── main.tsx             # エントリーポイント
```

### ファイル命名規則

```
コンポーネント:     PascalCase.tsx  (QuizApp.tsx)
カスタムフック:     camelCase.ts    (useQuizState.ts)
型定義:             camelCase.ts    (quiz.ts)
ユーティリティ:     camelCase.ts    (csvParser.ts)
定数:               UPPER_SNAKE_CASE (QUIZ_CONSTANTS.ts)
```

---

## TypeScript設定

### tsconfig.json

現在の設定（厳格モード有効）:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    
    /* 厳格な型チェック */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    
    /* モジュール解決 */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    
    /* パス解決 */
    "resolveJsonModule": true,
    "esModuleInterop": true
  },
  "include": ["src"]
}
```

### 重要な設定項目

- **`strict: true`**: すべての厳格チェックを有効化
- **`noUnusedLocals`**: 未使用変数を検出
- **`noUnusedParameters`**: 未使用パラメータを検出
- **`jsx: "react-jsx"`**: 新しいJSX変換を使用（React 17+）

---

## コンポーネント設計

### 基本テンプレート

```tsx
// src/components/ExampleComponent.tsx
import { useState, useEffect } from 'react';
import '../styles/components/example-component.css';

// Props型定義
interface ExampleComponentProps {
  title: string;
  count: number;
  onUpdate?: (newCount: number) => void;
}

// コンポーネント定義
export function ExampleComponent({ title, count, onUpdate }: ExampleComponentProps) {
  // State
  const [localCount, setLocalCount] = useState(count);
  
  // Effects
  useEffect(() => {
    setLocalCount(count);
  }, [count]);
  
  // Handlers
  const handleIncrement = () => {
    const newCount = localCount + 1;
    setLocalCount(newCount);
    onUpdate?.(newCount);
  };
  
  // Render
  return (
    <div className="example-component">
      <h2 className="example-component__title">{title}</h2>
      <p className="example-component__count">{localCount}</p>
      <button 
        className="example-component__button" 
        onClick={handleIncrement}
      >
        増やす
      </button>
    </div>
  );
}
```

### コンポーネント分類

#### 1. プレゼンテーションコンポーネント

- **役割**: 見た目のみを担当（状態を持たない）
- **特徴**: Propsのみで動作、副作用なし

```tsx
interface ButtonProps {
  label: string;
  variant: 'primary' | 'secondary';
  onClick: () => void;
}

export function Button({ label, variant, onClick }: ButtonProps) {
  return (
    <button 
      className={`button button--${variant}`} 
      onClick={onClick}
    >
      {label}
    </button>
  );
}
```

#### 2. コンテナコンポーネント

- **役割**: ロジックと状態管理を担当
- **特徴**: useState, useEffectを使用、子コンポーネントにPropsを渡す

```tsx
export function QuizContainer() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    // データ取得ロジック
    loadQuestions().then(setQuestions);
  }, []);
  
  return (
    <div>
      <QuizQuestion question={questions[currentIndex]} />
      <QuizControls onNext={() => setCurrentIndex(i => i + 1)} />
    </div>
  );
}
```

### Props設計原則

#### ✅ 良い例

```tsx
// 明確な型定義
interface QuizQuestionProps {
  question: string;
  options: string[];
  correctAnswer: number;
  onAnswer: (selectedIndex: number) => void;
}

// オプショナルプロパティは最後に
interface CardProps {
  title: string;
  description: string;
  imageUrl?: string;
  onClose?: () => void;
}
```

#### ❌ 悪い例

```tsx
// any型の使用
interface BadProps {
  data: any;  // ❌ 型が不明確
}

// 巨大なPropsオブジェクト
interface TooManyProps {
  prop1: string;
  prop2: number;
  prop3: boolean;
  // ... 20個以上のプロパティ
  prop25: string;
}
// → コンポーネントを分割すべき
```

---

## 状態管理

### ローカル状態（useState）

```tsx
export function QuizApp() {
  // ✅ 単純な状態
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  
  // ✅ 初期値が計算必要な場合は関数形式
  const [questions, setQuestions] = useState(() => {
    return loadQuestionsFromStorage();
  });
  
  return (/* ... */);
}
```

### 複雑な状態（useReducer）

```tsx
// 状態の型定義
interface QuizState {
  questions: Question[];
  currentIndex: number;
  score: number;
  answers: Answer[];
  isCompleted: boolean;
}

// アクションの型定義
type QuizAction =
  | { type: 'ANSWER_QUESTION'; payload: { index: number; answer: string } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'RESET_QUIZ' }
  | { type: 'COMPLETE_QUIZ' };

// リデューサー関数
function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'ANSWER_QUESTION':
      return {
        ...state,
        answers: [
          ...state.answers,
          { questionIndex: action.payload.index, answer: action.payload.answer }
        ]
      };
    
    case 'NEXT_QUESTION':
      return {
        ...state,
        currentIndex: state.currentIndex + 1
      };
    
    case 'RESET_QUIZ':
      return initialState;
    
    case 'COMPLETE_QUIZ':
      return {
        ...state,
        isCompleted: true
      };
    
    default:
      return state;
  }
}

// コンポーネント内での使用
export function QuizApp() {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  
  const handleAnswer = (answer: string) => {
    dispatch({ 
      type: 'ANSWER_QUESTION', 
      payload: { index: state.currentIndex, answer } 
    });
  };
  
  return (/* ... */);
}
```

### カスタムフック

共通ロジックの抽出:

```tsx
// src/hooks/useQuizState.ts
import { useState, useCallback } from 'react';

interface UseQuizStateReturn {
  currentIndex: number;
  score: number;
  isCompleted: boolean;
  nextQuestion: () => void;
  addScore: (points: number) => void;
  resetQuiz: () => void;
}

export function useQuizState(totalQuestions: number): UseQuizStateReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const nextQuestion = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
  }, [currentIndex, totalQuestions]);
  
  const addScore = useCallback((points: number) => {
    setScore(prev => prev + points);
  }, []);
  
  const resetQuiz = useCallback(() => {
    setCurrentIndex(0);
    setScore(0);
    setIsCompleted(false);
  }, []);
  
  return {
    currentIndex,
    score,
    isCompleted,
    nextQuestion,
    addScore,
    resetQuiz
  };
}

// 使用例
export function QuizApp() {
  const { currentIndex, score, nextQuestion, addScore } = useQuizState(10);
  
  return (/* ... */);
}
```

---

## 型定義

### 基本型の定義

```tsx
// src/types/quiz.ts

// 語彙データ型
export interface VocabularyItem {
  word: string;
  reading: string;
  meaning: string;
  etymology: string;
  relatedWords: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// クイズ問題型
export interface QuizQuestion {
  id: string;
  word: string;
  correctAnswer: string;
  options: string[];
  category: string;
}

// 回答結果型
export interface QuizAnswer {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timestamp: number;
}

// クイズセッション型
export interface QuizSession {
  sessionId: string;
  startTime: number;
  endTime: number | null;
  questions: QuizQuestion[];
  answers: QuizAnswer[];
  score: number;
}
```

### ユーティリティ型の活用

```tsx
// Partial: すべてのプロパティをオプショナルに
type PartialVocabulary = Partial<VocabularyItem>;

// Pick: 特定のプロパティのみ抽出
type VocabularyPreview = Pick<VocabularyItem, 'word' | 'meaning'>;

// Omit: 特定のプロパティを除外
type VocabularyWithoutEtymology = Omit<VocabularyItem, 'etymology'>;

// Record: キー・値のマッピング型
type CategoryMap = Record<string, VocabularyItem[]>;

// 実際の使用例
function updateVocabulary(
  id: string, 
  updates: Partial<VocabularyItem>  // 一部のみ更新可能
): VocabularyItem {
  const current = getVocabulary(id);
  return { ...current, ...updates };
}
```

### 型ガード

```tsx
// 型ガード関数
function isVocabularyItem(obj: unknown): obj is VocabularyItem {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'word' in obj &&
    'meaning' in obj &&
    typeof (obj as VocabularyItem).word === 'string' &&
    typeof (obj as VocabularyItem).meaning === 'string'
  );
}

// 使用例
function processData(data: unknown) {
  if (isVocabularyItem(data)) {
    // ここでは data は VocabularyItem 型として扱える
    console.log(data.word);
  }
}
```

---

## ESLintルール

### 設定（eslint.config.js）

```javascript
export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
)
```

### 重要なルール

#### 1. React Hooks ルール

```tsx
// ✅ useEffectの依存配列を正確に
useEffect(() => {
  fetchData(userId);
}, [userId]);  // userIdが変わったら再実行

// ❌ 依存配列不足
useEffect(() => {
  fetchData(userId);
}, []);  // ESLintエラー: userId が依存配列にない
```

#### 2. useState の更新関数

```tsx
// ✅ 関数形式（前の値に依存）
setCount(prev => prev + 1);

// ❌ 直接代入（クロージャの罠）
setCount(count + 1);  // countが古い値を参照する可能性
```

#### 3. useCallbackの依存配列

```tsx
// ✅ 依存配列正確
const handleSubmit = useCallback((data: FormData) => {
  submitForm(data, userId);
}, [userId]);

// ❌ 依存配列不足
const handleSubmit = useCallback((data: FormData) => {
  submitForm(data, userId);
}, []);  // ESLintエラー
```

### よくあるESLintエラーと対処法

#### エラー1: `Date.now()` の純粋性警告

```tsx
// ❌ 問題コード
const sessionId = `session_${Date.now()}`;

// ✅ 修正: 関数実行時に生成
function generateSessionId() {
  return `session_${Date.now()}`;
}
const sessionId = generateSessionId();
```

#### エラー2: useEffect内でのsetState

```tsx
// ❌ 問題コード
useEffect(() => {
  if (someCondition) {
    setState(newValue);  // 無限ループの危険
  }
});

// ✅ 修正: 依存配列を正確に
useEffect(() => {
  if (someCondition) {
    setState(newValue);
  }
}, [someCondition]);  // 依存配列を明示
```

#### エラー3: イベントハンドラの型

```tsx
// ❌ any型
const handleClick = (e: any) => { };

// ✅ 正確な型
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
};
```

---

## 開発フロー

### 新規コンポーネント作成

#### 1. 型定義ファイル作成（必要な場合）

```bash
touch src/types/feature.ts
```

```tsx
// src/types/feature.ts
export interface FeatureData {
  id: string;
  name: string;
  value: number;
}
```

#### 2. コンポーネントファイル作成

```bash
touch src/components/FeatureComponent.tsx
```

```tsx
// src/components/FeatureComponent.tsx
import { useState } from 'react';
import type { FeatureData } from '../types/feature';
import '../styles/components/feature-component.css';

interface FeatureComponentProps {
  data: FeatureData;
  onUpdate: (data: FeatureData) => void;
}

export function FeatureComponent({ data, onUpdate }: FeatureComponentProps) {
  const [localData, setLocalData] = useState(data);
  
  const handleChange = (newValue: number) => {
    const updated = { ...localData, value: newValue };
    setLocalData(updated);
    onUpdate(updated);
  };
  
  return (
    <div className="feature-component">
      <h3>{localData.name}</h3>
      <input 
        type="number" 
        value={localData.value} 
        onChange={(e) => handleChange(Number(e.target.value))}
      />
    </div>
  );
}
```

#### 3. CSSファイル作成

```bash
touch src/styles/components/feature-component.css
```

#### 4. 型チェック

```bash
npm run typecheck
```

#### 5. ESLint実行

```bash
npm run lint
```

#### 6. ビルド確認

```bash
npm run build
```

#### 7. テスト（必要な場合）

```bash
npm run test
```

### 既存コンポーネント修正

#### 1. 型定義確認

```tsx
// Propsの型を確認
interface QuizAppProps {
  // ...
}
```

#### 2. 段階的修正

- 1機能ずつ修正
- 修正後、即座にtypecheck

```bash
npm run typecheck
```

#### 3. ESLintエラー修正

```bash
npm run lint
```

#### 4. 動作確認

```bash
npm run dev
# Simple Browserで確認
```

---

## トラブルシューティング

### TypeScriptエラー

#### エラー: `Property does not exist on type`

```tsx
// ❌ 型定義不足
const obj: object = { name: 'test' };
console.log(obj.name);  // エラー

// ✅ 正確な型定義
interface User {
  name: string;
}
const obj: User = { name: 'test' };
console.log(obj.name);  // OK
```

#### エラー: `Type 'null' is not assignable`

```tsx
// ❌ nullの可能性を考慮していない
const element: HTMLElement = document.getElementById('root');

// ✅ null チェック
const element = document.getElementById('root');
if (element) {
  // elementはHTMLElement型として使える
}

// または Non-null assertion (確実にnullでない場合のみ)
const element = document.getElementById('root')!;
```

### Reactエラー

#### エラー: `Too many re-renders`

```tsx
// ❌ 無限ループ
function Component() {
  const [count, setCount] = useState(0);
  
  setCount(count + 1);  // レンダリングのたびに実行される
  
  return <div>{count}</div>;
}

// ✅ イベントハンドラで実行
function Component() {
  const [count, setCount] = useState(0);
  
  const handleClick = () => {
    setCount(count + 1);
  };
  
  return <button onClick={handleClick}>{count}</button>;
}
```

#### エラー: `Cannot update during render`

```tsx
// ❌ レンダリング中にstate更新
function Component({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);
  
  if (userId) {
    fetchUser(userId).then(setUser);  // エラー
  }
  
  return <div>{user?.name}</div>;
}

// ✅ useEffectで副作用を実行
function Component({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    if (userId) {
      fetchUser(userId).then(setUser);
    }
  }, [userId]);
  
  return <div>{user?.name}</div>;
}
```

### ビルドエラー

#### エラー: `Module not found`

```bash
# パス確認
ls src/components/FeatureComponent.tsx

# import文確認
import { FeatureComponent } from './components/FeatureComponent';  # 拡張子なし
```

#### エラー: `Failed to resolve import`

```bash
# tsconfig.jsonのpaths設定を確認
# vite.config.tsのresolve.alias設定を確認
```

---

## チェックリスト

### 新規コンポーネント作成時

- [ ] Props型をinterfaceで定義
- [ ] すべてのstateに型アノテーション
- [ ] useEffectの依存配列が正確
- [ ] イベントハンドラに正確な型
- [ ] `npm run typecheck` が成功
- [ ] `npm run lint` でエラーなし
- [ ] `npm run build` が成功
- [ ] Simple Browserで動作確認

### 既存コンポーネント修正時

- [ ] 型定義を確認済み
- [ ] 段階的修正（1機能ずつ）
- [ ] 修正後にtypecheck実行
- [ ] ESLintエラー修正
- [ ] ビルド成功確認
- [ ] 動作確認完了

---

## 参考資料

- [TypeScript公式ドキュメント](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [React Hooks公式ドキュメント](https://react.dev/reference/react)
- [ESLint React Hooks Plugin](https://www.npmjs.com/package/eslint-plugin-react-hooks)

---

**改訂履歴**:
- 2025-12-02: 初版作成（TypeScript 0エラー達成後）
