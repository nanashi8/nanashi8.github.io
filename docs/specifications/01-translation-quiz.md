# 和訳クイズ仕様書

## 📌 概要

英単語から日本語訳を3択で選ぶクイズ機能。

## 🎯 機能要件

### 基本機能
- CSV形式の単語データを読み込み
- 3つの選択肢から正解を選択
- 正解・不正解のフィードバック表示
- スコア集計と進捗表示
- 問題シャッフル機能

### 追加機能
- 長文タブで選択した「分からない単語」を自動追加
- ファイル選択インターフェース
- リトライ機能

## 📊 データ構造

### Question型

```typescript
export interface Question {
  word: string;         // 英単語
  reading: string;      // 読み（ひらがな）
  meaning: string;      // 意味
  explanation: string;  // 語源等解説
  relatedWords: string; // 関連語
  category: string;     // 関連分野
  difficulty: string;   // 難易度
}
```

### QuizState型

```typescript
export interface QuizState {
  questions: Question[];     // 問題リスト
  currentIndex: number;      // 現在の問題番号
  score: number;             // 現在のスコア
  answered: boolean;         // 回答済みフラグ
  selectedAnswer: string;    // 選択した回答
  wrongAnswers: Question[];  // 間違えた問題
}
```

## 🔧 実装詳細

### QuizView.tsx

**主要機能:**

1. **CSV読み込み**
```typescript
const handleFileSelect = async (file: File) => {
  const text = await file.text();
  const questions = parseCSV(text);
  const shuffled = shuffle(questions);
  setQuizState({
    questions: shuffled,
    currentIndex: 0,
    score: 0,
    answered: false,
    selectedAnswer: '',
    wrongAnswers: []
  });
};
```

2. **選択肢生成**
```typescript
// 現在の問題の正解 + ランダムな2つの不正解
const currentQuestion = questions[currentIndex];
const choices = generateChoices(currentQuestion, questions, 3);
```

3. **回答処理**
```typescript
const handleAnswer = (answer: string) => {
  const isCorrect = answer === currentQuestion.meaning;
  setQuizState({
    ...quizState,
    answered: true,
    selectedAnswer: answer,
    score: isCorrect ? score + 1 : score,
    wrongAnswers: isCorrect ? wrongAnswers : [...wrongAnswers, currentQuestion]
  });
};
```

4. **次の問題へ移動**
```typescript
const handleNext = () => {
  if (currentIndex < questions.length - 1) {
    setQuizState({
      ...quizState,
      currentIndex: currentIndex + 1,
      answered: false,
      selectedAnswer: ''
    });
  }
};
```

## 🎨 UI要素

### レイアウト構造

```
┌───────────────────────────┐
│ [ファイル選択ボタン]      │
├───────────────────────────┤
│ スコア: 5/10  (50%)       │ ← ScoreBoard
├───────────────────────────┤
│ ┌───────────────────────┐ │
│ │ apple                 │ │ ← 英単語
│ │                       │ │
│ │ [A] りんご  ✓         │ │ ← 選択肢（正解時）
│ │ [B] みかん            │ │
│ │ [C] ばなな            │ │
│ │                       │ │
│ │     [次へ →]          │ │
│ └───────────────────────┘ │
└───────────────────────────┘
```

### スタイリング

```css
/* 問題カード */
.question-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* 選択肢ボタン */
.choice-btn {
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
}

.choice-btn:hover {
  background: #f5f5f5;
  border-color: #2196F3;
}

/* 正解の選択肢 */
.choice-btn.correct {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

/* 不正解の選択肢 */
.choice-btn.wrong {
  background: #f44336;
  color: white;
  border-color: #f44336;
}
```

## 🔌 連携機能

### unknownWordsとの統合

```typescript
// App.tsx
const combinedQuestions = [...questions, ...unknownWords];
```

長文タブで選択された「分からない単語」が自動的にクイズに追加される。

## ✅ テストシナリオ

1. **正常系**
   - CSVファイルを選択 → 問題が表示される
   - 正解を選択 → スコアが増加、次へボタンが表示
   - 次へボタンをクリック → 次の問題が表示
   - 最後の問題 → 結果画面が表示

2. **異常系**
   - 不正なCSV → エラーメッセージ表示
   - 問題数が0 → 「問題がありません」表示

3. **エッジケース**
   - 問題数が2つ以下 → 選択肢生成に重複あり
   - 同じ意味の単語が複数 → ランダム選択

## 📝 保守メモ

### 将来の改善案
- 難易度フィルタリング
- カテゴリ別クイズ
- タイマー機能
- 解説表示機能
