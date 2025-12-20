---
description: プロパティ命名規則 - WordProgressのモード別プロパティの正しい使い分け
applyTo: '**/*.{ts,tsx}'
priority: high
---

# プロパティ命名規則ガイド

## 🎯 目的

WordProgressインターフェースには**モード別**のプロパティが存在します。
このガイドは、正しいプロパティを使用するための必須ルールです。

---

## 📊 WordProgressの構造

### 完全な型定義

```typescript
// src/storage/progress/types.ts
export interface WordProgress {
  // ========================================
  // 暗記モード専用プロパティ（memorizationXxx）
  // ========================================
  memorizationAttempts?: number;      // 暗記モード総試行回数
  memorizationCorrect?: number;       // 暗記モード正解回数（「覚えてる」）
  memorizationStillLearning?: number; // 暗記モード「まだまだ」回数
  memorizationStreak?: number;        // 暗記モード連続正解数
  
  // ========================================
  // 和訳モード専用プロパティ（translationXxx）
  // ========================================
  translationAttempts?: number;       // 和訳モード総試行回数
  translationCorrect?: number;        // 和訳モード正解回数
  translationIncorrect?: number;      // 和訳モード不正解回数
  
  // ========================================
  // スペルモード専用プロパティ（spellingXxx）
  // ========================================
  spellingAttempts?: number;          // スペルモード総試行回数
  spellingCorrect?: number;           // スペルモード正解回数
  spellingSkipped?: number;           // スペルモード「分からない」回数
  
  // ========================================
  // 汎用プロパティ（使用非推奨）
  // ========================================
  correctCount?: number;              // 旧：正解回数（使用禁止）
  incorrectCount?: number;            // 旧：不正解回数（使用禁止）
  consecutiveCorrect?: number;        // 旧：連続正解（使用禁止）
  
  // ========================================
  // 共通プロパティ
  // ========================================
  lastStudied?: number;               // 最終学習日時（Unix timestamp）
  reviewInterval?: number;            // 復習間隔（日数）
  difficulty?: number;                // 難易度スコア
}
```

---

## ✅ 使用ルール

### Rule 1: モード別プロパティを使用する

**暗記タブの実装**:

```typescript
// ❌ 悪い例：汎用プロパティを使用
function analyzeMemorizationProgress(progress: WordProgress) {
  const attempts = progress.attempts || 0;         // NG: 汎用プロパティ
  const correct = progress.correctCount || 0;      // NG: 汎用プロパティ
  const incorrect = progress.incorrectCount || 0;  // NG: 汎用プロパティ
}

// ✅ 良い例：モード専用プロパティを使用
function analyzeMemorizationProgress(progress: WordProgress) {
  const attempts = progress.memorizationAttempts || 0;
  const correct = progress.memorizationCorrect || 0;
  const stillLearning = progress.memorizationStillLearning || 0;
  const streak = progress.memorizationStreak || 0;
}
```

**和訳タブの実装**:

```typescript
// ✅ 正解例
function analyzeTranslationProgress(progress: WordProgress) {
  const attempts = progress.translationAttempts || 0;
  const correct = progress.translationCorrect || 0;
  const incorrect = progress.translationIncorrect || 0;
}
```

**スペルタブの実装**:

```typescript
// ✅ 正解例
function analyzeSpellingProgress(progress: WordProgress) {
  const attempts = progress.spellingAttempts || 0;
  const correct = progress.spellingCorrect || 0;
  const skipped = progress.spellingSkipped || 0;
}
```

### Rule 2: 汎用プロパティは使用禁止

**禁止されているプロパティ**:

```typescript
// ❌ これらは使用禁止
progress.correctCount
progress.incorrectCount
progress.consecutiveCorrect
progress.attempts  // モード指定なし
```

**理由**:
- 将来的に削除予定
- モード間で混同が発生
- バグの原因となる

### Rule 3: 「まだまだ」は0.5点として計算

**暗記モードの正解率計算**:

```typescript
// ✅ 正解例：「まだまだ」を0.5点として計算
function calculateAccuracy(progress: WordProgress): number {
  const attempts = progress.memorizationAttempts || 0;
  const correct = progress.memorizationCorrect || 0;
  const stillLearning = progress.memorizationStillLearning || 0;
  
  if (attempts === 0) return 0;
  
  // 「まだまだ」は0.5回の正解として計算
  const effectiveCorrect = correct + stillLearning * 0.5;
  const accuracy = effectiveCorrect / attempts;
  
  return accuracy;
}

// ❌ 悪い例：「まだまだ」を除外
function calculateAccuracy(progress: WordProgress): number {
  const correct = progress.memorizationCorrect || 0;
  const incorrect = progress.memorizationIncorrect || 0; // 存在しないプロパティ
  const totalAttempts = correct + incorrect; // まだまだが除外される
  
  return totalAttempts > 0 ? correct / totalAttempts : 0;
}
```

---

## 🔍 実装パターン集

### パターン1: カテゴリー判定（暗記モード）

```typescript
export function determineMemorizationCategory(progress: WordProgress): WordCategory {
  // ステップ1: プロパティを取得
  const attempts = progress.memorizationAttempts || 0;
  const correct = progress.memorizationCorrect || 0;
  const stillLearning = progress.memorizationStillLearning || 0;
  const streak = progress.memorizationStreak || 0;

  // ステップ2: 未出題チェック
  if (attempts === 0) return 'new';

  // ステップ3: 効果的正解数を計算
  const effectiveCorrect = correct + stillLearning * 0.5;
  const totalAttempts = attempts;
  const incorrectCount = attempts - correct - stillLearning;
  const accuracy = effectiveCorrect / totalAttempts;

  // ステップ4: カテゴリー判定
  if ((accuracy >= 0.8 && streak >= 3) || (accuracy >= 0.7 && totalAttempts >= 5)) {
    return 'mastered';
  }

  if (accuracy < 0.3 || incorrectCount >= 2) {
    return 'incorrect';
  }

  return 'still_learning';
}
```

### パターン2: 統計情報の取得（暗記モード）

```typescript
export function getMemorizationStatistics(progress: WordProgress) {
  const attempts = progress.memorizationAttempts || 0;
  const correct = progress.memorizationCorrect || 0;
  const stillLearning = progress.memorizationStillLearning || 0;
  const streak = progress.memorizationStreak || 0;

  const effectiveCorrect = correct + stillLearning * 0.5;
  const incorrectCount = attempts - correct - stillLearning;
  const accuracy = attempts > 0 ? (effectiveCorrect / attempts) * 100 : 0;

  return {
    totalAttempts: attempts,
    correctCount: correct,
    stillLearningCount: stillLearning,
    incorrectCount,
    accuracy: Math.round(accuracy * 10) / 10, // 小数点1桁
    streak,
  };
}
```

### パターン3: 進捗の更新（暗記モード）

```typescript
export function updateMemorizationProgress(
  currentProgress: WordProgress,
  result: 'correct' | 'stillLearning' | 'incorrect'
): WordProgress {
  const attempts = (currentProgress.memorizationAttempts || 0) + 1;
  let correct = currentProgress.memorizationCorrect || 0;
  let stillLearning = currentProgress.memorizationStillLearning || 0;
  let streak = currentProgress.memorizationStreak || 0;

  if (result === 'correct') {
    correct += 1;
    streak += 1;
  } else if (result === 'stillLearning') {
    stillLearning += 1;
    streak = 0; // 連続正解リセット
  } else {
    streak = 0; // 連続正解リセット
  }

  return {
    ...currentProgress,
    memorizationAttempts: attempts,
    memorizationCorrect: correct,
    memorizationStillLearning: stillLearning,
    memorizationStreak: streak,
    lastStudied: Date.now(),
  };
}
```

---

## 🚨 よくある間違い

### 間違い1: プロパティ名の推測

```typescript
// ❌ 悪い例：推測で実装
const correct = progress.correctCount || 0;          // 汎用プロパティ
const incorrect = progress.incorrectCount || 0;      // 汎用プロパティ
const streak = progress.consecutiveCorrect || 0;     // 汎用プロパティ

// ✅ 良い例：型定義を確認
const correct = progress.memorizationCorrect || 0;       // モード専用
const stillLearning = progress.memorizationStillLearning || 0; // モード専用
const streak = progress.memorizationStreak || 0;         // モード専用
```

### 間違い2: 「まだまだ」の除外

```typescript
// ❌ 悪い例：「まだまだ」を除外
const totalAttempts = correct + incorrect; // まだまだが含まれない

// ✅ 良い例：「まだまだ」を0.5点として計算
const effectiveCorrect = correct + stillLearning * 0.5;
const totalAttempts = attempts; // 全試行回数
```

### 間違い3: モード混同

```typescript
// ❌ 悪い例：暗記モードのコードで和訳プロパティを使用
function analyzeMemorization(progress: WordProgress) {
  const attempts = progress.translationAttempts || 0; // 和訳プロパティ
  const correct = progress.translationCorrect || 0;   // 和訳プロパティ
}

// ✅ 良い例：暗記モードのコードで暗記プロパティを使用
function analyzeMemorization(progress: WordProgress) {
  const attempts = progress.memorizationAttempts || 0;
  const correct = progress.memorizationCorrect || 0;
}
```

---

## 📚 クイックリファレンス

### 暗記モード（Memorization）

| プロパティ名 | 用途 | 例 |
|----------|------|---|
| `memorizationAttempts` | 総試行回数 | `10` |
| `memorizationCorrect` | 「覚えてる」回数 | `6` |
| `memorizationStillLearning` | 「まだまだ」回数 | `3` |
| `memorizationStreak` | 連続正解数 | `2` |

**計算式**:
- 効果的正解数 = `correct + stillLearning * 0.5`
- 不正解回数 = `attempts - correct - stillLearning`
- 正答率 = `effectiveCorrect / attempts`

### 和訳モード（Translation）

| プロパティ名 | 用途 | 例 |
|----------|------|---|
| `translationAttempts` | 総試行回数 | `15` |
| `translationCorrect` | 正解回数 | `10` |
| `translationIncorrect` | 不正解回数 | `5` |

### スペルモード（Spelling）

| プロパティ名 | 用途 | 例 |
|----------|------|---|
| `spellingAttempts` | 総試行回数 | `8` |
| `spellingCorrect` | 正解回数 | `5` |
| `spellingSkipped` | 「分からない」回数 | `3` |

---

## 🎓 学習チェックリスト

実装前に以下を確認：

- [ ] 実装するモードを特定した（暗記/和訳/スペル）
- [ ] 対応するモード専用プロパティを確認した
- [ ] 汎用プロパティを使用していない
- [ ] 「まだまだ」の扱いを理解した（0.5点計算）
- [ ] 型定義ファイルを確認した

---

## 🤖 AI実装時の必須ルール

1. **必ず型定義を確認**する（`src/storage/progress/types.ts`）
2. **モード専用プロパティ**を使用する
3. **汎用プロパティは使用禁止**
4. **「まだまだ」は0.5点**として計算する
5. **プロパティ名を推測しない**

これらを守らない場合、**必ずバグが発生する**。
