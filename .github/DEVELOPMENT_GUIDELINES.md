# 開発ガイドライン

## 目的
このドキュメントは、二重経路・二重定義・二重実装・二重記録などの問題を防ぎ、一貫性のあるコードベースを維持するためのガイドラインです。

## 1. 進捗記録の一元管理

### 原則
**すべての進捗記録は `updateWordProgress` 関数を経由して `progress.results` に記録する**

### 実装パターン

#### ✅ 正しい実装
```typescript
// 単語の進捗を更新（自動的にprogress.resultsに記録される）
await updateWordProgress(
  word,
  isCorrect,
  responseTime,
  userRating,
  mode // 'translation' | 'spelling' | 'reading' | 'grammar' | 'memorization'
);
```

#### ❌ 避けるべき実装
```typescript
// progress.resultsへの直接記録は禁止
const progress = await loadProgress();
progress.results.push({...}); // ❌ 二重記録の原因
await saveProgress(progress);

// updateWordProgressと併用も禁止
await updateWordProgress(...); // ✅
await addQuizResult({...}); // ❌ 二重記録
```

### チェックリスト
- [ ] `progress.results.push()` を直接呼んでいないか？
- [ ] `addQuizResult()` と `updateWordProgress()` を両方呼んでいないか？
- [ ] 新しいモードを追加する場合、`updateWordProgress` の型定義を更新したか？

## 2. ScoreBoard更新の一元管理

### 原則
**ScoreBoardの更新は `lastAnswerTime` の変更によってトリガーされる**

### 実装パターン

#### ✅ 正しい実装
```typescript
// 回答処理後に必ずlastAnswerTimeを更新
const handleAnswer = () => {
  // ... 回答処理 ...
  setLastAnswerTime(Date.now()); // ScoreBoard更新のトリガー
};

// ScoreBoardに渡す
<ScoreBoard
  onAnswerTime={lastAnswerTime}
  // ...その他のprops
/>
```

#### ❌ 避けるべき実装
```typescript
// lastAnswerTimeを更新せずに進捗を記録
await updateWordProgress(...); // ❌ ScoreBoardが更新されない
```

### チェックリスト
- [ ] 回答・スキップ処理後に `setLastAnswerTime(Date.now())` を呼んでいるか？
- [ ] ScoreBoardに `onAnswerTime={lastAnswerTime}` を渡しているか？

## 3. モード別実装の統一

### 原則
**各モード（タブ）は同じパターンで実装する**

### 必須要素
1. **questionStartTimeRef**: 質問開始時刻を記録
2. **lastAnswerTime**: ScoreBoard更新用の回答時刻
3. **updateWordProgress**: 進捗記録（自動的にprogress.resultsに記録）
4. **setLastAnswerTime**: ScoreBoard更新トリガー

### 実装テンプレート

```typescript
function XxxView() {
  // 1. 質問開始時刻を記録
  const questionStartTimeRef = useRef<number>(Date.now());
  
  // 2. ScoreBoard更新用の回答時刻
  const [lastAnswerTime, setLastAnswerTime] = useState<number>(Date.now());
  
  // 3. 回答処理
  const handleAnswer = async (isCorrect: boolean) => {
    const responseTime = Date.now() - questionStartTimeRef.current;
    
    // 進捗を記録（自動的にprogress.resultsに記録される）
    await updateWordProgress(
      currentQuestion.word,
      isCorrect,
      responseTime,
      undefined,
      'xxx' // モード名
    );
    
    // ScoreBoard更新をトリガー
    setLastAnswerTime(Date.now());
    
    // セッション統計を更新
    setSessionStats(prev => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
    }));
  };
  
  // 4. 次の質問に移動時にquestionStartTimeRefをリセット
  const handleNext = () => {
    questionStartTimeRef.current = Date.now();
    // ...
  };
  
  // 5. ScoreBoardに渡す
  return (
    <ScoreBoard
      mode="xxx"
      onAnswerTime={lastAnswerTime}
      // ...
    />
  );
}
```

### チェックリスト
- [ ] `questionStartTimeRef` を定義しているか？
- [ ] `lastAnswerTime` stateを定義しているか？
- [ ] 回答処理で `updateWordProgress` を呼んでいるか？
- [ ] 回答処理で `setLastAnswerTime(Date.now())` を呼んでいるか？
- [ ] 次の問題に移動時に `questionStartTimeRef.current = Date.now()` を呼んでいるか？

## 4. 新機能追加前のチェックリスト

### 事前確認（必須）

新しい機能を追加する前に、以下を必ず確認してください：

#### 1. 既存機能の重複チェック
- [ ] 同じ機能が既に実装されていないか？
- [ ] 似た機能を拡張できないか？
- [ ] 既存のコンポーネントを再利用できないか？

#### 2. データフローの確認
- [ ] 進捗記録が必要か？ → `updateWordProgress`を使用
- [ ] ScoreBoard更新が必要か？ → `lastAnswerTime`を更新
- [ ] LocalStorageに保存が必要か？ → 既存のキー命名規則に従う
- [ ] APIコールが必要か？ → 既存のパターンに従う

#### 3. 型定義の影響範囲
- [ ] 新しい型を追加するか？ → `types.ts`に集約
- [ ] 既存の型を拡張するか？ → 後方互換性を保つ
- [ ] モード追加か？ → 「5. 新しいモードの追加手順」参照
- [ ] 状態管理が必要か？ → `useState`/`useRef`のパターンに従う

#### 4. UI/UXの一貫性
- [ ] 既存のデザインパターンに従っているか？
- [ ] レスポンシブ対応は必要か？
- [ ] ダークモード対応は必要か？
- [ ] アクセシビリティは考慮されているか？

#### 5. パフォーマンスへの影響
- [ ] 大量データを扱うか？ → メモ化やページネーション検討
- [ ] 頻繁に更新される状態か？ → 不要な再レンダリング防止
- [ ] 非同期処理か？ → ローディング状態とエラーハンドリング

### 実装前の設計確認

#### LocalStorageキーの命名規則
```typescript
// ✅ 正しい命名パターン
'quiz-app-{feature-name}'        // アプリ全体の設定
'{tab-name}-{setting-name}'      // タブ固有の設定
'{feature}-{data-type}-{scope}'  // 機能固有のデータ

// 例:
'quiz-app-user-progress'         // 進捗データ
'translation-auto-next'          // 和訳タブの自動次へ設定
'learning-schedule-90days'       // 学習スケジュール
'reading-passages-data'          // 長文読解データ

// ❌ 避けるべきパターン
'data'                           // 曖昧すぎる
'myFeature'                      // プレフィックスなし
'feature_new_data'               // アンダースコア（ハイフン推奨）
```

#### コンポーネント配置の原則
```
src/
├── components/           # 再利用可能なUIコンポーネント
│   ├── *View.tsx        # タブごとのメインビュー
│   ├── ScoreBoard.tsx   # 共通コンポーネント
│   └── ...
├── hooks/               # カスタムフック
│   └── useLearningLimits.ts
├── types.ts             # 型定義の集約
├── progressStorage.ts   # 進捗管理の中核
└── App.tsx              # ルーティングと状態管理
```

#### 状態管理のパターン
```typescript
// ローカル状態（コンポーネント内のみ）
const [localState, setLocalState] = useState(initialValue);

// 永続化が必要な状態（localStorage使用）
const [setting, setSetting] = useState(() => {
  const saved = localStorage.getItem('key');
  return saved ? JSON.parse(saved) : defaultValue;
});

useEffect(() => {
  localStorage.setItem('key', JSON.stringify(setting));
}, [setting]);

// 共通状態（App.tsxで管理してprops経由で渡す）
// または Context API使用（大規模な場合）
```

## 5. 新しいモードの追加手順

### ステップ1: 型定義を更新

```typescript
// progressStorage.ts
export async function updateWordProgress(
  word: string,
  isCorrect: boolean,
  responseTime: number,
  userRating?: number,
  mode?: 'translation' | 'spelling' | 'reading' | 'grammar' | 'memorization' | 'NEW_MODE' // ← 追加
): Promise<void> {
```

### ステップ2: WordProgress型を更新

```typescript
// progressStorage.ts
export interface WordProgress {
  // ...既存のフィールド
  newModeAttempts?: number;
  newModeCorrect?: number;
  newModeStreak?: number;
}
```

### ステップ3: updateWordProgress内にモード別処理を追加

```typescript
// progressStorage.ts
} else if (mode === 'NEW_MODE') {
  wordProgress.newModeAttempts = (wordProgress.newModeAttempts || 0) + 1;
  if (isCorrect) {
    wordProgress.newModeCorrect = (wordProgress.newModeCorrect || 0) + 1;
    wordProgress.newModeStreak = (wordProgress.newModeStreak || 0) + 1;
  } else {
    wordProgress.newModeStreak = 0;
  }
}

// 総試行回数を更新
wordProgress.totalAttempts = 
  (wordProgress.translationAttempts || 0) + 
  (wordProgress.spellingAttempts || 0) + 
  (wordProgress.grammarAttempts || 0) + 
  (wordProgress.memorizationAttempts || 0) +
  (wordProgress.newModeAttempts || 0); // ← 追加
```

### ステップ4: questionSetName mappingを更新

```typescript
// progressStorage.ts
const questionSetName = 
  mode === 'translation' ? '和訳' :
  mode === 'spelling' ? 'スペル' :
  mode === 'grammar' ? '文法' :
  mode === 'memorization' ? '暗記' :
  mode === 'NEW_MODE' ? '新モード名' : // ← 追加
  '読解';
```

### ステップ5: QuizResult型のmodeを更新

```typescript
// progressStorage.ts
export interface QuizResult {
  // ...
  mode: 'translation' | 'spelling' | 'reading' | 'grammar' | 'memorization' | 'NEW_MODE'; // ← 追加
  // ...
}
```

### ステップ6: ScoreBoard履歴タブの条件を更新

```typescript
// ScoreBoard.tsx
{(mode === 'translation' || mode === 'spelling' || mode === 'grammar' || mode === 'NEW_MODE') && (
  <button>履歴</button>
)}
```

### チェックリスト
- [ ] `updateWordProgress` の型定義を更新したか？
- [ ] `WordProgress` 型にフィールドを追加したか？
- [ ] `updateWordProgress` 内にモード別処理を追加したか？
- [ ] `totalAttempts` 計算を更新したか？
- [ ] `questionSetName` mappingを更新したか？
- [ ] `QuizResult.mode` 型を更新したか？
- [ ] ScoreBoard履歴タブの条件を更新したか？

## 5. デバッグ時のチェックポイント

### スコアボードが更新されない場合

1. **`setLastAnswerTime(Date.now())` を呼んでいるか？**
   - 回答処理の直後に必ず呼ぶ
   - スキップ処理でも呼ぶ

2. **`updateWordProgress` を呼んでいるか？**
   - `progress.results` への直接記録は禁止
   - `addQuizResult` との併用も禁止

3. **`mode` パラメータは正しいか？**
   - 型定義に存在するモード名を使用
   - typoがないか確認

### 二重記録が発生している場合

1. **`progress.results.push()` を直接呼んでいないか？**
   - すべて `updateWordProgress` に統一

2. **`addQuizResult()` と `updateWordProgress()` を両方呼んでいないか？**
   - `updateWordProgress` のみ使用

3. **複数の場所から進捗記録していないか？**
   - 記録は1箇所のみ

## 6. 機能別実装ガイド

### 6.1 データ永続化機能の追加

#### チェックポイント
- [ ] LocalStorageキー名は既存の命名規則に従っているか？
- [ ] データマイグレーション（バージョン管理）は必要か？
- [ ] データサイズの上限を考慮しているか？（LocalStorageは5-10MB）
- [ ] エラーハンドリング（localStorage無効/容量超過）を実装しているか？

#### 実装パターン
```typescript
// ✅ 推奨パターン
const STORAGE_KEY = 'quiz-app-feature-data';
const STORAGE_VERSION = 1;

interface FeatureData {
  version: number;
  data: YourDataType;
  updatedAt: number;
}

// 保存
export async function saveFeatureData(data: YourDataType): Promise<void> {
  try {
    const storageData: FeatureData = {
      version: STORAGE_VERSION,
      data,
      updatedAt: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
  } catch (error) {
    console.error('保存エラー:', error);
    // フォールバック処理
  }
}

// 読み込み
export async function loadFeatureData(): Promise<YourDataType | null> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const parsed: FeatureData = JSON.parse(stored);
    
    // バージョンチェック
    if (parsed.version !== STORAGE_VERSION) {
      // マイグレーション処理
      return migrateData(parsed);
    }
    
    return parsed.data;
  } catch (error) {
    console.error('読み込みエラー:', error);
    return null;
  }
}
```

### 6.2 カスタムフックの追加

#### チェックポイント
- [ ] 既存のフックと重複していないか？
- [ ] `hooks/`ディレクトリに配置しているか？
- [ ] 命名規則は`use*`か？
- [ ] 依存配列は正しく設定されているか？

#### 実装パターン
```typescript
// hooks/useFeatureName.ts
import { useState, useEffect } from 'react';

export function useFeatureName(param: ParamType) {
  const [state, setState] = useState<StateType>(initialValue);
  
  useEffect(() => {
    // 副作用処理
    return () => {
      // クリーンアップ
    };
  }, [param]); // 依存配列を正しく設定
  
  return { state, setState };
}
```

### 6.3 新しいタブ（View）の追加

#### チェックポイント
- [ ] `src/components/*View.tsx`の命名規則に従っているか？
- [ ] 進捗記録パターン（セクション3）に従っているか？
- [ ] ScoreBoard更新パターン（セクション2）に従っているか？
- [ ] `App.tsx`にルーティングを追加したか？
- [ ] タブアイコンとラベルを定義したか？

#### 実装パターン
```typescript
// src/components/NewFeatureView.tsx
import { useState, useRef } from 'react';
import { updateWordProgress } from '../progressStorage';
import ScoreBoard from './ScoreBoard';

function NewFeatureView() {
  // 必須: 質問開始時刻
  const questionStartTimeRef = useRef<number>(Date.now());
  
  // 必須: ScoreBoard更新用
  const [lastAnswerTime, setLastAnswerTime] = useState<number>(Date.now());
  
  // セッション統計
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    review: 0,
    mastered: 0
  });
  
  const handleAnswer = async (isCorrect: boolean) => {
    const responseTime = Date.now() - questionStartTimeRef.current;
    
    await updateWordProgress(
      currentQuestion.word,
      isCorrect,
      responseTime,
      undefined,
      'new-mode' // モード名
    );
    
    setLastAnswerTime(Date.now());
    setSessionStats(prev => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
    }));
  };
  
  return (
    <div>
      <ScoreBoard
        mode="new-mode"
        onAnswerTime={lastAnswerTime}
        sessionCorrect={sessionStats.correct}
        sessionIncorrect={sessionStats.incorrect}
        // ...
      />
      {/* コンテンツ */}
    </div>
  );
}

export default NewFeatureView;
```

```typescript
// App.tsx にルーティング追加
const [activeTab, setActiveTab] = useState<'translation' | 'spelling' | 'reading' | 'grammar' | 'memorization' | 'new-feature'>('translation');

// JSX内
{activeTab === 'new-feature' && <NewFeatureView />}
```

### 6.4 新しい統計・分析機能の追加

#### チェックポイント
- [ ] `progress.results`配列を活用しているか？
- [ ] データ集計ロジックは効率的か？（大量データ対応）
- [ ] フィルタリング条件は既存のパターンに従っているか？
- [ ] 日付範囲の処理は統一されているか？

#### 実装パターン
```typescript
// 統計計算の例
export function calculateFeatureStats(
  results: QuizResult[],
  options: {
    mode?: QuizResult['mode'];
    startDate?: number;
    endDate?: number;
  } = {}
): FeatureStats {
  const filtered = results.filter(result => {
    if (options.mode && result.mode !== options.mode) return false;
    if (options.startDate && result.date < options.startDate) return false;
    if (options.endDate && result.date > options.endDate) return false;
    return true;
  });
  
  // 集計処理
  return {
    total: filtered.length,
    // ...
  };
}
```

### 6.5 新しいUI コンポーネントの追加

#### チェックポイント
- [ ] 既存のコンポーネントを再利用できないか？
- [ ] Tailwind CSSのクラス名を使用しているか？
- [ ] ダークモード対応のクラス（`dark:`）を追加しているか？
- [ ] レスポンシブデザインを考慮しているか？
- [ ] アクセシビリティ（aria-label等）を考慮しているか？

#### 実装パターン
```typescript
// components/NewComponent.tsx
interface NewComponentProps {
  // Props定義
}

function NewComponent({ }: NewComponentProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      {/* レスポンシブ + ダークモード対応 */}
      <button 
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg"
        aria-label="説明的なラベル"
      >
        ボタン
      </button>
    </div>
  );
}

export default NewComponent;
```

### 6.6 新しいデータソース・API連携の追加

#### チェックポイント
- [ ] エラーハンドリングは実装されているか？
- [ ] ローディング状態を管理しているか？
- [ ] リトライロジックは必要か？
- [ ] レスポンスのキャッシュは必要か？
- [ ] 型定義は適切か？

#### 実装パターン
```typescript
// API呼び出しの例
interface ApiResponse {
  // レスポンス型定義
}

export async function fetchFeatureData(): Promise<ApiResponse> {
  try {
    const response = await fetch('/api/feature');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: ApiResponse = await response.json();
    return data;
  } catch (error) {
    console.error('API呼び出しエラー:', error);
    throw error;
  }
}

// コンポーネント内での使用
function FeatureComponent() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchFeatureData();
        setData(result);
      } catch (err) {
        setError('データの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error}</div>;
  if (!data) return null;
  
  return <div>{/* データ表示 */}</div>;
}
```

### 6.7 新しい問題形式の追加

#### チェックポイント
- [ ] `Question`型を拡張するか、新しい型を定義するか？
- [ ] CSVデータからの読み込みは必要か？
- [ ] 進捗記録は既存パターンに従っているか？
- [ ] 採点ロジックは正確か？

#### 実装パターン
```typescript
// types.ts に型定義追加
export interface NewQuestionType extends Question {
  // 追加フィールド
  newField: string;
}

// 問題コンポーネント
function NewQuestionCard({ question }: { question: NewQuestionType }) {
  const [userAnswer, setUserAnswer] = useState('');
  
  const handleSubmit = () => {
    const isCorrect = checkAnswer(userAnswer, question);
    // 既存の進捗記録パターンに従う
    onAnswer(isCorrect);
  };
  
  return (
    <div>
      {/* 問題UI */}
    </div>
  );
}
```

## 7. コードレビューチェックリスト（拡張版）

### 実装前チェック
- [ ] 既存の進捗記録システムと競合しないか？
- [ ] 同じ機能が別の場所に実装されていないか？
- [ ] 新しいモードの場合、既存のパターンに従っているか？

### 実装中チェック
- [ ] `updateWordProgress` を使用しているか？
- [ ] `setLastAnswerTime` を呼んでいるか？
- [ ] `questionStartTimeRef` を管理しているか？
- [ ] 型定義を更新したか？

### 実装後チェック
- [ ] TypeScriptエラーがないか？
- [ ] ビルドが成功するか？
- [ ] 既存のテストが通るか？
- [ ] 実際に動作確認したか？

## 7. 禁止パターン

以下のパターンは絶対に避けてください：

### ❌ 進捗の二重記録
```typescript
await updateWordProgress(...);
progress.results.push({...}); // ❌
```

### ❌ 直接記録
```typescript
const progress = await loadProgress();
progress.results.push({...}); // ❌ updateWordProgressを使用
await saveProgress(progress);
```

### ❌ 併用記録
```typescript
await updateWordProgress(...);
await addQuizResult({...}); // ❌ updateWordProgressで十分
```

### ❌ ScoreBoard更新忘れ
```typescript
await updateWordProgress(...);
// setLastAnswerTime(Date.now()); // ❌ 忘れている
```

### ❌ 応答時間の未記録
```typescript
const handleAnswer = () => {
  // const responseTime = Date.now() - questionStartTimeRef.current; // ❌ 忘れている
  await updateWordProgress(word, isCorrect, 0, undefined, mode); // ❌ 0を渡している
};
```

## 8. ベストプラクティス

### ✅ 統一されたパターン
すべてのタブで同じパターンを使用することで、保守性と可読性が向上します。

### ✅ 型安全性
TypeScriptの型定義を活用して、コンパイル時にエラーを検出します。

### ✅ 一元管理
進捗記録とScoreBoard更新は、それぞれ1つの方法でのみ行います。

### ✅ テスト
新しい機能を追加したら、必ず動作確認を行います。

## まとめ

- **進捗記録**: `updateWordProgress` のみ使用
- **ScoreBoard更新**: `setLastAnswerTime(Date.now())` を呼ぶ
- **モード追加**: 7つのステップを踏む
- **禁止**: 二重記録、直接記録、併用記録

このガイドラインに従うことで、一貫性のある高品質なコードベースを維持できます。
