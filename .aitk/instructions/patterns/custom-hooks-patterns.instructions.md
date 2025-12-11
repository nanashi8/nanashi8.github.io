---
description: カスタムフックの使用方法とベストプラクティス
applyTo: 'src/**/*.{ts,tsx}'
---

# カスタムフックパターン

Phase 2で作成された6個のカスタムフック（485行）の使用方法とベストプラクティスを説明します。

## 📋 既存のカスタムフック一覧

| フック名 | 行数 | 用途 | 使用箇所 |
|---------|------|------|----------|
| useQuizSettings | 22行 | 自動進行設定管理 | App.tsx |
| useQuizFilters | 45行 | フィルター状態管理 | App.tsx |
| useQuizState | 67行 | クイズ状態管理 | App.tsx |
| useSpellingGame | 268行 | スペリングゲームロジック | SpellingView.tsx |
| useSessionStats | 58行 | セッション統計追跡 | SpellingView.tsx |
| useLearningLimits | 25行 | 学習制限管理 | 既存 |

**総行数**: 485行

## 🎯 各フックの詳細

### 1. useQuizSettings

**ファイル**: `src/hooks/useQuizSettings.ts` (22行)

**用途**: 自動進行設定の管理（autoAdvance, autoAdvanceDelay）

**戻り値**:
```typescript
{
  autoAdvance: boolean;
  autoAdvanceDelay: number;
  setAutoAdvance: (value: boolean) => void;
  setAutoAdvanceDelay: (value: number) => void;
}
```

**使用例**:
```typescript
import { useQuizSettings } from '@/hooks/useQuizSettings';

function QuizComponent() {
  const { 
    autoAdvance, 
    autoAdvanceDelay, 
    setAutoAdvance, 
    setAutoAdvanceDelay 
  } = useQuizSettings();
  
  return (
    <div>
      <label>
        <input 
          type="checkbox" 
          checked={autoAdvance}
          onChange={(e) => setAutoAdvance(e.target.checked)}
        />
        自動進行
      </label>
      {autoAdvance && (
        <input 
          type="number" 
          value={autoAdvanceDelay}
          onChange={(e) => setAutoAdvanceDelay(Number(e.target.value))}
        />
      )}
    </div>
  );
}
```

**特徴**:
- LocalStorageと自動統合
- 設定変更が永続化される
- 依存関係なし（独立したフック）

---

### 2. useQuizFilters

**ファイル**: `src/hooks/useQuizFilters.ts` (45行)

**用途**: 6つのフィルター状態を管理

**管理する状態**:
1. `categoryFilter`: カテゴリフィルター
2. `difficultyFilter`: 難易度フィルター
3. `wordPhraseFilter`: 単語/フレーズフィルター
4. `phraseTypeFilter`: フレーズタイプフィルター
5. `dataSourceFilter`: データソースフィルター
6. `grammarConstructionFilter`: 文法構文フィルター

**戻り値**:
```typescript
{
  categoryFilter: string;
  difficultyFilter: string;
  wordPhraseFilter: string;
  phraseTypeFilter: string;
  dataSourceFilter: DataSource | 'all';
  grammarConstructionFilter: string;
  setCategoryFilter: (value: string) => void;
  setDifficultyFilter: (value: string) => void;
  setWordPhraseFilter: (value: string) => void;
  setPhraseTypeFilter: (value: string) => void;
  setDataSourceFilter: (value: DataSource | 'all') => void;
  setGrammarConstructionFilter: (value: string) => void;
}
```

**使用例**:
```typescript
import { useQuizFilters } from '@/hooks/useQuizFilters';

function FilterPanel() {
  const { 
    categoryFilter, 
    difficultyFilter,
    setCategoryFilter,
    setDifficultyFilter
  } = useQuizFilters();
  
  return (
    <div>
      <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
        <option value="all">すべて</option>
        <option value="食・健康">食・健康</option>
      </select>
      
      <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)}>
        <option value="all">すべて</option>
        <option value="初級">初級</option>
      </select>
    </div>
  );
}
```

**特徴**:
- 6つの状態を一元管理
- 型安全な状態管理
- 循環依存を避けるためインライン型定義

---

### 3. useQuizState

**ファイル**: `src/hooks/useQuizState.ts` (67行)

**用途**: クイズの状態、セッション統計、レビューモード管理

**管理する状態**:
1. `quizState`: クイズ状態（QuizState型）
2. `sessionStats`: セッション統計（SessionStats型）
3. `reviewFocusMode`: レビューフォーカスモード
4. `reviewQuestionPool`: レビュー問題プール

**型定義**:
```typescript
interface QuizState {
  currentQuestionIndex: number;
  selectedAnswer: string | null;
  isAnswered: boolean;
  answeredCorrectly: boolean | null;
  showAnswer: boolean;
  reviewMode: boolean;
}

interface SessionStats {
  correct: number;
  incorrect: number;
  reviewed: number;
  mastered: number;
}
```

**使用例**:
```typescript
import { useQuizState } from '@/hooks/useQuizState';

function QuizView() {
  const {
    quizState,
    sessionStats,
    reviewFocusMode,
    setQuizState,
    setSessionStats,
    setReviewFocusMode
  } = useQuizState();
  
  const handleAnswer = (answer: string) => {
    setQuizState({
      ...quizState,
      selectedAnswer: answer,
      isAnswered: true
    });
  };
  
  return (
    <div>
      <p>正解: {sessionStats.correct}</p>
      <p>不正解: {sessionStats.incorrect}</p>
      {reviewFocusMode && <p>レビューモード</p>}
    </div>
  );
}
```

**特徴**:
- `@/types` から型をインポート（型の一元管理）
- クイズの状態を包括的に管理
- セッション統計を追跡

---

### 4. useSpellingGame

**ファイル**: `src/hooks/useSpellingGame.ts` (268行)

**用途**: スペリングゲームのコアロジック

**管理する機能**:
1. 文字のシャッフル
2. 文字の順次選択
3. 複数単語のフレーズサポート
4. 解答チェック
5. タイミング計測

**主要な関数**:
```typescript
{
  // 状態
  shuffledLetters: string[];
  selectedLetters: string[];
  isComplete: boolean;
  isCorrect: boolean | null;
  
  // 操作
  handleLetterClick: (letter: string, index: number) => void;
  handleUndo: () => void;
  handleReset: () => void;
  handleSubmit: () => void;
  
  // ユーティリティ
  getCurrentWord: () => string;
  getRemainingLetters: () => string[];
}
```

**使用例**:
```typescript
import { useSpellingGame } from '@/hooks/useSpellingGame';

function SpellingGame({ question }: { question: Question }) {
  const {
    shuffledLetters,
    selectedLetters,
    isComplete,
    isCorrect,
    handleLetterClick,
    handleUndo,
    handleSubmit
  } = useSpellingGame(question);
  
  return (
    <div>
      <div className="letter-pool">
        {shuffledLetters.map((letter, index) => (
          <button 
            key={index}
            onClick={() => handleLetterClick(letter, index)}
          >
            {letter}
          </button>
        ))}
      </div>
      
      <div className="selected-area">
        {selectedLetters.join('')}
      </div>
      
      <button onClick={handleUndo}>戻す</button>
      <button onClick={handleSubmit} disabled={!isComplete}>
        解答
      </button>
      
      {isCorrect !== null && (
        <p>{isCorrect ? '正解!' : '不正解'}</p>
      )}
    </div>
  );
}
```

**特徴**:
- 268行の複雑なゲームロジックを抽出
- SpellingView.txを141行削減（-15.8%）
- スペース区切りの複数単語対応
- タイミング計測機能内蔵

---

### 5. useSessionStats

**ファイル**: `src/hooks/useSessionStats.ts` (58行)

**用途**: セッション統計の追跡と更新

**管理する統計**:
```typescript
interface SessionStats {
  correct: number;    // 正解数
  incorrect: number;  // 不正解数
  reviewed: number;   // レビュー数
  mastered: number;   // マスター数
}
```

**主要な関数**:
```typescript
{
  stats: SessionStats;
  updateStats: (status: 'correct' | 'incorrect' | 'reviewed' | 'mastered') => void;
  resetStats: () => void;
}
```

**使用例**:
```typescript
import { useSessionStats } from '@/hooks/useSessionStats';

function QuizSession() {
  const { stats, updateStats, resetStats } = useSessionStats();
  
  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      updateStats('correct');
    } else {
      updateStats('incorrect');
    }
  };
  
  return (
    <div>
      <div className="stats">
        <p>正解: {stats.correct}</p>
        <p>不正解: {stats.incorrect}</p>
        <p>レビュー: {stats.reviewed}</p>
        <p>マスター: {stats.mastered}</p>
      </div>
      
      <button onClick={resetStats}>統計リセット</button>
    </div>
  );
}
```

**特徴**:
- シンプルな状態管理
- 4種類の統計を追跡
- リセット機能付き

---

### 6. useLearningLimits

**ファイル**: `src/hooks/useLearningLimits.ts` (25行)

**用途**: 学習制限（新規学習数、復習数）の管理

**管理する設定**:
```typescript
{
  learningLimit: number;  // 新規学習の上限
  reviewLimit: number;    // 復習の上限
}
```

**使用例**:
```typescript
import { useLearningLimits } from '@/hooks/useLearningLimits';

function LearningSettings() {
  const { learningLimit, reviewLimit, setLearningLimit, setReviewLimit } = useLearningLimits();
  
  return (
    <div>
      <label>
        新規学習上限:
        <input 
          type="number" 
          value={learningLimit}
          onChange={(e) => setLearningLimit(Number(e.target.value))}
        />
      </label>
      
      <label>
        復習上限:
        <input 
          type="number" 
          value={reviewLimit}
          onChange={(e) => setReviewLimit(Number(e.target.value))}
        />
      </label>
    </div>
  );
}
```

**特徴**:
- 既存フック（Phase 1以前から存在）
- LocalStorage統合
- シンプルな数値管理

---

## 🎨 新しいフック作成ガイドライン

### 1. フック化の判断基準

**フック化すべき場合**:
- ✅ 50行以上のロジック
- ✅ 複数コンポーネントで使用するロジック
- ✅ 状態管理 + 副作用（useEffect）を含む
- ✅ テスト可能にしたいロジック

**フック化不要な場合**:
- ❌ 単純な計算ロジック（関数で十分）
- ❌ UIに密接に関連するロジック
- ❌ 1つのコンポーネントでしか使わない軽量なロジック

### 2. フック作成のテンプレート

```typescript
// src/hooks/useMyFeature.ts
import { useState, useEffect, useCallback } from 'react';
import type { MyType } from '@/types';
import { MY_CONSTANT } from '@/constants';

/**
 * My Feature のロジックを管理するフック
 * 
 * @param initialValue - 初期値
 * @returns フックの戻り値
 */
export function useMyFeature(initialValue: MyType) {
  // 状態
  const [state, setState] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  
  // 副作用
  useEffect(() => {
    // 初期化ロジック
    const saved = localStorage.getItem('myFeature');
    if (saved) {
      setState(JSON.parse(saved));
    }
  }, []);
  
  // 操作関数
  const handleUpdate = useCallback((newValue: MyType) => {
    setState(newValue);
    localStorage.setItem('myFeature', JSON.stringify(newValue));
  }, []);
  
  const handleReset = useCallback(() => {
    setState(initialValue);
    localStorage.removeItem('myFeature');
  }, [initialValue]);
  
  // 戻り値
  return {
    state,
    loading,
    handleUpdate,
    handleReset,
  };
}
```

### 3. フックの命名規則

**ルール**: `use` + 機能名（キャメルケース）

```typescript
// ✅ Good
useQuizSettings
useSpellingGame
useSessionStats
useMyFeature

// ❌ Bad
quizSettings      // useが無い
UseQuizSettings   // 大文字始まり（コンポーネントと混同）
use_quiz_settings // スネークケース
```

### 4. 型安全性の確保

```typescript
// ✅ Good: 型をインポート
import type { Question, QuizState } from '@/types';

export function useQuiz(questions: Question[]) {
  const [state, setState] = useState<QuizState>({ /* ... */ });
  // ...
}

// ❌ Bad: ローカル型定義
interface QuizState { /* ... */ }

export function useQuiz(questions: any) {  // any禁止
  // ...
}
```

### 5. 依存関係の管理

```typescript
// ✅ Good: 最小限の依存関係
export function useQuizSettings() {
  // Reactフックのみ使用
  const [setting, setSetting] = useState(false);
  return { setting, setSetting };
}

// ⚠️  注意: 他のカスタムフックへの依存は慎重に
export function useQuizWithSettings() {
  const settings = useQuizSettings();  // 依存関係発生
  const state = useQuizState();        // 依存関係発生
  // 循環依存に注意！
}
```

## 🧪 フックのテスト

### テストファイル構造

```
src/hooks/
├── useQuizSettings.ts
├── useQuizFilters.ts
└── __tests__/
    ├── useQuizSettings.test.ts
    └── useQuizFilters.test.ts
```

### テスト例

```typescript
// src/hooks/__tests__/useQuizSettings.test.ts
import { renderHook, act } from '@testing-library/react';
import { useQuizSettings } from '../useQuizSettings';

describe('useQuizSettings', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useQuizSettings());
    
    expect(result.current.autoAdvance).toBe(false);
    expect(result.current.autoAdvanceDelay).toBe(3);
  });
  
  it('should update autoAdvance', () => {
    const { result } = renderHook(() => useQuizSettings());
    
    act(() => {
      result.current.setAutoAdvance(true);
    });
    
    expect(result.current.autoAdvance).toBe(true);
  });
});
```

## 📚 ベストプラクティス

### 1. 単一責任の原則

```typescript
// ✅ Good: 1つのフックで1つの責任
function useQuizSettings() {
  // 設定管理のみ
}

function useQuizState() {
  // 状態管理のみ
}

// ❌ Bad: 1つのフックで複数の責任
function useQuiz() {
  // 設定 + 状態 + フィルター + ... （多すぎ）
}
```

### 2. カスタムフックの合成

```typescript
// ✅ Good: 小さなフックを組み合わせる
function QuizView() {
  const settings = useQuizSettings();
  const filters = useQuizFilters();
  const state = useQuizState();
  
  // これらを組み合わせて使用
}
```

### 3. メモ化の活用

```typescript
// ✅ Good: 計算コストが高い場合はuseMemo
export function useFilteredQuestions(questions: Question[], filter: string) {
  const filtered = useMemo(
    () => questions.filter(q => q.category === filter),
    [questions, filter]
  );
  
  return filtered;
}

// ✅ Good: 関数の安定性が必要な場合はuseCallback
export function useQuizActions() {
  const handleSubmit = useCallback((answer: string) => {
    // 送信処理
  }, []);
  
  return { handleSubmit };
}
```

## 📊 Phase 2の成果

| 指標 | 変更前 | 変更後 | 改善 |
|------|--------|--------|------|
| カスタムフック数 | 1個 | 6個 | +500% |
| App.tsx行数 | 1651行 | 1623行 | -1.7% |
| SpellingView.tsx行数 | 890行 | 749行 | -15.8% |
| 総削減行数 | - | -169行 | -6.7% |

## 📝 関連ドキュメント

- [プロジェクト構造](../project-structure.instructions.md)

---

**Last Updated**: 2025年12月11日  
**Version**: 2.0.0（Phase 2完了）
