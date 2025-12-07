---
description: Development patterns for any new feature addition
applyTo: 'src/**/*.{ts,tsx}'
---

# 新機能追加のための開発パターン（包括版）

このドキュメントは、**あらゆる新機能**（モード追加、UI機能、データ機能など）を追加する際のガイドラインです。

## 🚨 新機能追加前の必須チェック

### 1. 既存機能との重複確認
```bash
# 似た機能が既に実装されていないか検索
grep -r "機能名" src/
```

- [ ] 同じ機能が既に実装されていないか？
- [ ] 既存機能を拡張できないか？
- [ ] 既存コンポーネントを再利用できないか？

### 2. データフローの確認

#### 進捗記録が必要な場合
```typescript
// ✅ 正しい: updateWordProgressのみ使用
await updateWordProgress(word, isCorrect, responseTime, userRating, mode);

// ❌ 禁止: 直接記録
progress.results.push({...});

// ❌ 禁止: 二重記録
await updateWordProgress(...);
await addQuizResult({...});
```

#### ScoreBoard更新が必要な場合
```typescript
// ✅ 正しい
await updateWordProgress(...);
setLastAnswerTime(Date.now()); // 必須

// ❌ 禁止: lastAnswerTime更新忘れ
await updateWordProgress(...);
// ScoreBoardが更新されない
```

### 3. LocalStorage使用の確認

#### 命名規則
```typescript
// ✅ 正しい命名パターン
'quiz-app-{feature-name}'        // アプリ全体
'{tab-name}-{setting-name}'      // タブ固有
'{feature}-{data-type}-{scope}'  // 機能固有

// 例:
'quiz-app-user-progress'
'translation-auto-next'
'custom-questions-weak-words'

// ❌ 避けるべき
'data'                    // 曖昧
'myFeature'              // プレフィックスなし
'feature_new'            // アンダースコア（ハイフン推奨）
```

#### 実装パターン
```typescript
const STORAGE_KEY = 'feature-name-data';
const STORAGE_VERSION = 1;

interface StorageData {
  version: number;
  data: YourDataType;
  updatedAt: number;
}

// 保存
function saveData(data: YourDataType): void {
  try {
    const storageData: StorageData = {
      version: STORAGE_VERSION,
      data,
      updatedAt: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
  } catch (error) {
    console.error('保存エラー:', error);
  }
}

// 読み込み
function loadData(): YourDataType | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const parsed: StorageData = JSON.parse(stored);
    
    // バージョンチェック
    if (parsed.version !== STORAGE_VERSION) {
      return migrateData(parsed);
    }
    
    return parsed.data;
  } catch (error) {
    console.error('読み込みエラー:', error);
    return null;
  }
}
```

## 📦 機能別実装パターン

### パターン1: 新しいタブ（View）の追加

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
    
    // 進捗記録
    await updateWordProgress(
      currentQuestion.word,
      isCorrect,
      responseTime,
      undefined,
      'new-mode'
    );
    
    // ScoreBoard更新トリガー
    setLastAnswerTime(Date.now());
    
    // セッション統計更新
    setSessionStats(prev => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
    }));
  };
  
  // 次の問題に移動
  const handleNext = () => {
    questionStartTimeRef.current = Date.now(); // リセット
    // ...
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

チェックリスト:
- [ ] `questionStartTimeRef` を定義
- [ ] `lastAnswerTime` を定義
- [ ] `updateWordProgress` を使用
- [ ] `setLastAnswerTime` を呼び出し
- [ ] `handleNext` で `questionStartTimeRef` をリセット
- [ ] `App.tsx` にルーティング追加

### パターン2: カスタムフックの追加

```typescript
// hooks/useFeatureName.ts
import { useState, useEffect, useCallback } from 'react';

export function useFeatureName(param: ParamType) {
  const [state, setState] = useState<StateType>(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // メモ化されたコールバック
  const handleAction = useCallback((arg: ArgType) => {
    // ...
  }, [/* dependencies */]);
  
  useEffect(() => {
    // 副作用処理
    const cleanup = () => {
      // クリーンアップ
    };
    
    return cleanup;
  }, [param]); // 依存配列を正しく設定
  
  return { state, setState, loading, error, handleAction };
}
```

チェックリスト:
- [ ] `hooks/` ディレクトリに配置
- [ ] 命名規則は `use*`
- [ ] 依存配列を正しく設定
- [ ] クリーンアップ処理を実装（必要な場合）

### パターン3: 新しいUIコンポーネントの追加

```typescript
// components/NewComponent.tsx
interface NewComponentProps {
  title: string;
  onAction: () => void;
  // ...
}

function NewComponent({ title, onAction }: NewComponentProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        {title}
      </h2>
      
      <button 
        onClick={onAction}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg transition-colors"
        aria-label="説明的なラベル"
      >
        アクション
      </button>
    </div>
  );
}

export default NewComponent;
```

チェックリスト:
- [ ] Props型を定義
- [ ] Tailwind CSSクラスを使用
- [ ] `dark:` プレフィックスでダークモード対応
- [ ] レスポンシブデザイン考慮
- [ ] `aria-label` でアクセシビリティ対応

### パターン4: 統計・分析機能の追加

```typescript
// progressStorage.ts or 専用ファイル
export interface FeatureStats {
  total: number;
  correct: number;
  accuracy: number;
  // ...
}

export function calculateFeatureStats(
  results: QuizResult[],
  options: {
    mode?: QuizResult['mode'];
    startDate?: number;
    endDate?: number;
  } = {}
): FeatureStats {
  // フィルタリング
  const filtered = results.filter(result => {
    if (options.mode && result.mode !== options.mode) return false;
    if (options.startDate && result.date < options.startDate) return false;
    if (options.endDate && result.date > options.endDate) return false;
    return true;
  });
  
  // 集計
  const total = filtered.length;
  const correct = filtered.filter(r => r.score > 0).length;
  const accuracy = total > 0 ? (correct / total) * 100 : 0;
  
  return { total, correct, accuracy };
}
```

チェックリスト:
- [ ] `progress.results` 配列を活用
- [ ] フィルタリング条件を統一
- [ ] 効率的な集計ロジック
- [ ] エッジケース処理（ゼロ除算など）

### パターン5: API連携機能の追加

```typescript
// api/featureApi.ts
interface ApiResponse {
  success: boolean;
  data: YourDataType;
}

export async function fetchFeatureData(
  param: string
): Promise<YourDataType> {
  try {
    const response = await fetch(`/api/feature/${param}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: ApiResponse = await response.json();
    
    if (!data.success) {
      throw new Error('API returned error');
    }
    
    return data.data;
  } catch (error) {
    console.error('API呼び出しエラー:', error);
    throw error;
  }
}

// コンポーネント内での使用
function FeatureComponent() {
  const [data, setData] = useState<YourDataType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await fetchFeatureData('param');
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラー');
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

チェックリスト:
- [ ] エラーハンドリング実装
- [ ] ローディング状態管理
- [ ] 型定義を適切に設定
- [ ] try-catch-finallyでクリーンアップ

### パターン6: 型定義の追加

```typescript
// types.ts に集約
export interface NewFeatureType {
  id: string;
  name: string;
  createdAt: number;
  // ...
}

export type NewFeatureStatus = 'active' | 'inactive' | 'pending';

// 既存型の拡張
export interface ExtendedQuestion extends Question {
  newField: string;
}
```

チェックリスト:
- [ ] `types.ts` に集約
- [ ] `export` を付ける
- [ ] 明確な命名
- [ ] JSDocコメント（必要な場合）

## 🚫 禁止パターン（全機能共通）

### ❌ 進捗の二重記録
```typescript
await updateWordProgress(...);
progress.results.push({...}); // 禁止
```

### ❌ 直接記録
```typescript
const progress = await loadProgress();
progress.results.push({...}); // 禁止
await saveProgress(progress);
```

### ❌ lastAnswerTime更新忘れ
```typescript
await updateWordProgress(...);
// setLastAnswerTime(Date.now()); // 忘れている
```

### ❌ 型定義の分散
```typescript
// ❌ 各ファイルで型定義
// ComponentA.tsx
interface MyType { }

// ComponentB.tsx
interface MyType { } // 重複

// ✅ types.tsに集約
// types.ts
export interface MyType { }
```

### ❌ any型の濫用
```typescript
// ❌ 禁止
const data: any = ...;

// ✅ 正しい
const data: SpecificType = ...;
```

### ❌ LocalStorageキーの命名ミス
```typescript
// ❌ 禁止
localStorage.setItem('data', ...);        // 曖昧
localStorage.setItem('myFeature', ...);   // プレフィックスなし
localStorage.setItem('feature_name', ...); // アンダースコア

// ✅ 正しい
localStorage.setItem('feature-name-data', ...);
```

## ✅ 実装完了チェックリスト

新機能を実装したら、以下を確認してください：

### コード品質
- [ ] TypeScriptエラーがない (`npm run typecheck`)
- [ ] ビルドが成功する (`npm run build`)
- [ ] ESLint警告がない (`npm run lint`)
- [ ] ガイドラインチェック通過 (`./scripts/check-guidelines.sh`)

### データフロー
- [ ] 進捗記録は `updateWordProgress` のみ使用
- [ ] ScoreBoard更新は `lastAnswerTime` で制御
- [ ] LocalStorageキーは命名規則に従っている
- [ ] 二重記録・二重定義がない

### UI/UX
- [ ] ダークモード対応
- [ ] レスポンシブデザイン
- [ ] アクセシビリティ考慮
- [ ] 既存デザインパターンに準拠

### ドキュメント
- [ ] コメント追加（複雑なロジック）
- [ ] 型定義が明確
- [ ] README更新（必要な場合）

### テスト
- [ ] 実際に動作確認
- [ ] エッジケース確認
- [ ] エラーハンドリング確認
- [ ] 既存機能への影響確認

## 📚 参考資料

- [開発ガイドライン](../../.github/DEVELOPMENT_GUIDELINES.md) - 詳細なガイド
- [コントリビューションガイド](../../.github/CONTRIBUTING.md) - Pull Request前の確認
- 自動チェック: `./scripts/check-guidelines.sh`

## 最重要原則

### 1. 進捗記録は updateWordProgress のみ使用
```typescript
// ✅ 正しい
await updateWordProgress(word, isCorrect, responseTime, userRating, mode);

// ❌ 禁止：直接記録
progress.results.push({...});

// ❌ 禁止：二重記録
await updateWordProgress(...);
await addQuizResult({...});
```

### 2. ScoreBoard更新は lastAnswerTime で制御
```typescript
// ✅ 正しい
await updateWordProgress(...);
setLastAnswerTime(Date.now()); // ScoreBoard更新をトリガー

// ❌ 禁止：lastAnswerTime更新忘れ
await updateWordProgress(...);
// ScoreBoardが更新されない
```

## 実装パターン

### タブ（View）の標準実装
```typescript
function XxxView() {
  // 必須: 質問開始時刻
  const questionStartTimeRef = useRef<number>(Date.now());
  
  // 必須: ScoreBoard更新用
  const [lastAnswerTime, setLastAnswerTime] = useState<number>(Date.now());
  
  // 回答処理
  const handleAnswer = async (isCorrect: boolean) => {
    // 1. 応答時間を計算
    const responseTime = Date.now() - questionStartTimeRef.current;
    
    // 2. 進捗を記録（自動的にprogress.resultsに記録）
    await updateWordProgress(
      currentQuestion.word,
      isCorrect,
      responseTime,
      undefined,
      'mode-name' // 'translation' | 'spelling' | 'reading' | 'grammar' | 'memorization'
    );
    
    // 3. ScoreBoard更新をトリガー
    setLastAnswerTime(Date.now());
    
    // 4. セッション統計を更新
    setSessionStats(prev => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
    }));
  };
  
  // 次の問題に移動時
  const handleNext = () => {
    questionStartTimeRef.current = Date.now(); // リセット
    // ...
  };
  
  return (
    <ScoreBoard
      mode="mode-name"
      onAnswerTime={lastAnswerTime} // 必須
      // ...
    />
  );
}
```

## 新しいモードを追加する場合

### 1. progressStorage.ts の型定義を更新
```typescript
export async function updateWordProgress(
  word: string,
  isCorrect: boolean,
  responseTime: number,
  userRating?: number,
  mode?: 'translation' | 'spelling' | 'reading' | 'grammar' | 'memorization' | 'NEW_MODE'
): Promise<void> {
```

### 2. WordProgress型にフィールドを追加
```typescript
export interface WordProgress {
  // ...
  newModeAttempts?: number;
  newModeCorrect?: number;
  newModeStreak?: number;
}
```

### 3. updateWordProgress内にモード別処理を追加
```typescript
} else if (mode === 'NEW_MODE') {
  wordProgress.newModeAttempts = (wordProgress.newModeAttempts || 0) + 1;
  if (isCorrect) {
    wordProgress.newModeCorrect = (wordProgress.newModeCorrect || 0) + 1;
    wordProgress.newModeStreak = (wordProgress.newModeStreak || 0) + 1;
  } else {
    wordProgress.newModeStreak = 0;
  }
}
```

### 4. totalAttemptsの計算を更新
```typescript
wordProgress.totalAttempts = 
  (wordProgress.translationAttempts || 0) + 
  (wordProgress.spellingAttempts || 0) + 
  (wordProgress.grammarAttempts || 0) + 
  (wordProgress.memorizationAttempts || 0) +
  (wordProgress.newModeAttempts || 0);
```

### 5. questionSetName mappingを追加
```typescript
const questionSetName = 
  mode === 'translation' ? '和訳' :
  mode === 'spelling' ? 'スペル' :
  mode === 'grammar' ? '文法' :
  mode === 'memorization' ? '暗記' :
  mode === 'NEW_MODE' ? '新モード名' :
  '読解';
```

### 6. QuizResult.mode型を更新
```typescript
export interface QuizResult {
  // ...
  mode: 'translation' | 'spelling' | 'reading' | 'grammar' | 'memorization' | 'NEW_MODE';
  // ...
}
```

## 禁止パターン

### ❌ progress.resultsへの直接記録
```typescript
const progress = await loadProgress();
progress.results.push({...}); // 禁止
await saveProgress(progress);
```

### ❌ 二重記録
```typescript
await updateWordProgress(...);
await addQuizResult({...}); // 禁止
```

### ❌ lastAnswerTime更新忘れ
```typescript
await updateWordProgress(...);
// setLastAnswerTime(Date.now()); // 忘れている - ScoreBoardが更新されない
```

### ❌ questionStartTimeRefなし
```typescript
const handleAnswer = async () => {
  const responseTime = 0; // 常に0 - 正しく計測できていない
  await updateWordProgress(word, isCorrect, responseTime, undefined, mode);
};
```

## チェックリスト

機能を実装・修正する際は、以下を確認してください：

- [ ] `updateWordProgress` を使用している（直接記録していない）
- [ ] `setLastAnswerTime(Date.now())` を呼んでいる
- [ ] `questionStartTimeRef` で応答時間を計測している
- [ ] 新しいモードの場合、型定義を更新している
- [ ] 二重記録していない（addQuizResultと併用していない）
- [ ] TypeScriptエラーがない
- [ ] ビルドが成功する
- [ ] 実際に動作確認している

## 参考資料

- [開発ガイドライン](.github/DEVELOPMENT_GUIDELINES.md)
- [コントリビューションガイド](.github/CONTRIBUTING.md)
