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

## 4. 新しいモードの追加手順

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

## 6. コードレビューチェックリスト

新しい機能や修正を実装する前に、以下を確認してください：

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
