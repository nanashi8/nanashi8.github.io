---
description: Progress tracking and ScoreBoard update patterns
applyTo: 'src/**/*.{ts,tsx}'
---

# 進捗記録とScoreBoard更新のパターン

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
