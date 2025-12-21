---
title: 03. スペルクイズ
created: 2025-11-22
updated: 2025-12-07
status: in-progress
tags: [specification, ai, adaptive]
---

# 03. スペルクイズ

## 📌 概要

日本語訳から英単語のスペルを入力する学習モード。
2つの入力形式（虫食い・フル入力）で、記述力と正確なスペリングを養成。

## 🎯 機能仕様

### 基本フロー

1. **問題表示**: 日本語訳を表示
1. **入力**: スペルを入力（虫食い or フル）
1. **解答**: Enterキー or 「解答」ボタン
1. **判定**: リアルタイム検証
1. **フィードバック**: 正誤表示 + AIコメント
1. **次の問題**: 「次の問題」ボタン

## 📝 入力モード

### 1. 虫食い形式（デフォルト）

一部の文字を隠して入力:

```
問題: 捨てる、放棄する
━━━━━━━━━━━━━━━━━━━━
スペル: a _ a n _ o n
         ↑   ↑
入力欄:  [b] [d]
```

#### 虫食いアルゴリズム

```typescript
function createBlanks(word: string): string[] {
  const length = word.length;
  const blankCount = Math.ceil(length * 0.4); // 40%を空欄に

  const indices = [];
  for (let i = 1; i < length - 1; i++) {
    // 最初と最後は除外
    indices.push(i);
  }

  // ランダムに選択
  const blanks = shuffle(indices).slice(0, blankCount);

  return word.split('').map((char, i) => (blanks.includes(i) ? '_' : char));
}
```

#### ヒント表示

```typescript
// 母音のヒント
function getVowelHint(word: string): string {
  return word
    .split('')
    .map((char) => ('aeiou'.includes(char.toLowerCase()) ? char : '_'))
    .join(' ');
}

// 例: "abandon" → "a_a_o_"
```

### 2. フル入力形式

単語全体を入力:

```
問題: 捨てる、放棄する
━━━━━━━━━━━━━━━━━━━━
入力欄: [________________]
```

## ⌨️ 入力支援機能

### リアルタイム検証

```typescript
function validateInput(
  userInput: string,
  correctAnswer: string
): {
  isValid: boolean;
  errors: number[];
} {
  const errors = [];

  for (let i = 0; i < userInput.length; i++) {
    if (userInput[i].toLowerCase() !== correctAnswer[i]?.toLowerCase()) {
      errors.push(i);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

### 入力フィードバック

- **正しい文字**: 緑色のアンダーライン
- **間違った文字**: 赤色のアンダーライン
- **未入力**: グレーのアンダーライン

```css
.spelling-input.correct {
  border-bottom: 2px solid #28a745;
}

.spelling-input.incorrect {
  border-bottom: 2px solid #dc3545;
}

.spelling-input.pending {
  border-bottom: 2px solid #ddd;
}
```

## 🎛️ フィルター機能

### 難易度フィルター

和訳クイズと同様:

- All
- Beginner
- Intermediate
- Advanced

### 単語/フレーズフィルター

- All
- Words Only（推奨: スペル練習に適している）
- Phrases Only

### 入力形式切り替え

```typescript
type SpellingMode = 'blanks' | 'full';

function toggleSpellingMode(current: SpellingMode): SpellingMode {
  return current === 'blanks' ? 'full' : 'blanks';
}
```

## 🔊 音声機能

### 自動読み上げ

正解後に自動的に発音:

```typescript
function onCorrectAnswer(word: string) {
  showCorrectFeedback();
  speakEnglish(word); // 自動読み上げ
  updateProgress(word, true);
}
```

### 手動読み上げ

スピーカーアイコンをクリックして任意のタイミングで再生。

## 🎨 UI/UX

### 入力欄デザイン

#### 虫食い形式

```css
.spelling-blanks {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  font-size: 1.5em;
  font-family: 'Courier New', monospace;
}

.blank-char {
  width: 40px;
  height: 50px;
  text-align: center;
  font-size: 1.2em;
  border: 2px solid #667eea;
  border-radius: 8px;
}
```

#### フル入力形式

```css
.spelling-full-input {
  width: 100%;
  max-width: 400px;
  padding: 16px;
  font-size: 1.5em;
  text-align: center;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
}
```

### レスポンシブ対応

#### PC

- 入力欄幅: 400px
- フォントサイズ: 1.5em

#### スマホ

- 入力欄幅: 100%
- フォントサイズ: 1.2em

## 📱 モバイル最適化

### ソフトキーボード対応

```html
<input type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" />
```

### IME制御

英語入力を強制:

```css
.spelling-input {
  ime-mode: disabled; /* 旧ブラウザ用 */
}
```

```javascript
input.addEventListener('compositionstart', (e) => {
  e.preventDefault(); // 日本語入力を防止
});
```

## 🧠 AI連携

### 学習アシスタント

#### スキップ機能

難しい単語をスキップして後でまとめて復習:

```typescript
function handleSkip(word: string) {
  recordWordSkip(word);
  addToSkipGroup(word);
  showNextQuestion();
}

// スキップグループから優先出題
function getNextQuestion(): Question {
  const skipGroup = getSkipGroup();
  if (skipGroup.length > 0) {
    return skipGroup[0]; // スキップした単語を優先
  }
  return selectAdaptiveQuestion();
}
```

#### ヒント機能

段階的にヒントを表示:

```typescript
const hints = [
  '最初の文字は "a" です',
  '7文字の単語です',
  '母音は "a", "a", "o" です',
  '語源はフランス語の "abandonner" です',
];
```

## 📊 進捗記録

### スペル特有の記録

```typescript
interface SpellingProgress extends WordProgress {
  spellingAccuracy: number; // スペル正確度
  commonMistakes: string[]; // よくある間違い
  hintUsedCount: number; // ヒント使用回数
  skipCount: number; // スキップ回数
}
```

### 間違いパターンの記録

```typescript
function recordMistake(userInput: string, correctAnswer: string) {
  const mistakes = findDifferences(userInput, correctAnswer);

  // 例: "abandun" → "abandon"
  // mistakes: [{ position: 5, wrong: 'u', correct: 'o' }]

  saveMistakePattern(correctAnswer, mistakes);
}
```

## 🎮 キーボードショートカット

| キー   | 動作         |
| ------ | ------------ |
| Enter  | 解答を確定   |
| Escape | 入力をクリア |
| Space  | 音声再生     |
| H      | ヒント表示   |
| S      | スキップ     |

## 📈 統計情報

### スペル統計

```typescript
interface SpellingStats {
  totalAttempts: number;
  perfectSpellings: number; // 一発正解
  correctedSpellings: number; // 修正後正解
  failedSpellings: number; // 不正解
  averageAttempts: number; // 平均試行回数
  hintsUsed: number;
  skipped: number;
}
```

## 🔄 学習サイクル

### 復習システム

忘却曲線に基づく復習タイミング:

```typescript
function getNextReviewTime(correctCount: number, lastAttempt: number): number {
  const intervals = [
    1, // 1日後
    3, // 3日後
    7, // 1週間後
    14, // 2週間後
    30, // 1ヶ月後
  ];

  const index = Math.min(correctCount, intervals.length - 1);
  const daysToAdd = intervals[index];

  return lastAttempt + daysToAdd * 24 * 60 * 60 * 1000;
}
```

## 🐛 エラーハンドリング

### 入力検証

```typescript
function sanitizeInput(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z\s-]/g, ''); // 英字とハイフンのみ許可
}
```

### 特殊文字対応

```typescript
// ハイフン付き単語: "well-known"
// スペース付きフレーズ: "give up"
function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .replace(/\s+/g, ' ') // 複数スペースを1つに
    .trim();
}
```

## 💡 学習のコツ（UIに表示）

```
📝 スペル学習のヒント:
1. 発音を意識して覚える
1. 語源を理解すると覚えやすい
1. 似た単語をグループで覚える
1. 書いて覚える（手を動かす）
1. 間違えた単語は繰り返し練習
```

## 📝 関連ドキュメント

- [02-和訳クイズ](./02-translation-quiz.md)
- [04-長文読解](./04-reading-comprehension.md)
- [12-学習曲線AI](./12-learning-curve-ai.md)
- [15-データ構造](./15-data-structures.md)
