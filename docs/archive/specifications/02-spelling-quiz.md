# スペルクイズ仕様書

## 📌 概要

和訳から英単語のスペルを虫食い形式で完成させるクイズ。
アルファベットの選択肢から文字を選んで空欄を埋める。

## 🎯 機能要件

### 基本機能
- 和訳を表示し、対応する英単語のスペルを推測
- 単語の一部を空欄（`_`）にして表示
- アルファベット選択肢から文字を選択
- 全ての空欄が埋まったら自動チェック
- 正解・不正解のフィードバック

### ゲーム性
- 6〜12個のランダムなアルファベット選択肢
- 正解の文字を含む + ダミー文字
- 空欄数は単語の長さに応じて調整

## 📊 データ構造

### SpellingState型

```typescript
export interface SpellingState {
  questions: Question[];      // 問題リスト
  currentIndex: number;       // 現在の問題番号
  score: number;              // スコア
  answered: boolean;          // 回答済みフラグ
  isCorrect: boolean;         // 正解フラグ
  selectedLetters: string[];  // 選択した文字の配列
  wrongAnswers: Question[];   // 間違えた問題
}
```

### SpellingPuzzle型

```typescript
interface SpellingPuzzle {
  word: string;          // 完全な単語
  blanks: number[];      // 空欄の位置インデックス
  choices: string[];     // アルファベット選択肢
}
```

## 🔧 実装詳細

### generateSpellingPuzzle関数（utils.ts）

**アルゴリズム:**

```typescript
export function generateSpellingPuzzle(word: string): SpellingPuzzle {
  const wordUpper = word.toUpperCase();
  const length = wordUpper.length;
  
  // 空欄数を決定（単語の長さの30-50%）
  const numBlanks = Math.max(
    2,
    Math.min(
      Math.floor(length * 0.5),
      length - 1
    )
  );
  
  // ランダムに空欄位置を選択
  const blanks: number[] = [];
  while (blanks.length < numBlanks) {
    const pos = Math.floor(Math.random() * length);
    if (!blanks.includes(pos)) {
      blanks.push(pos);
    }
  }
  blanks.sort((a, b) => a - b);
  
  // 正解の文字を取得
  const correctLetters = blanks.map(i => wordUpper[i]);
  
  // ダミー文字を生成（母音・子音バランス考慮）
  const vowels = ['A', 'E', 'I', 'O', 'U'];
  const consonants = 'BCDFGHJKLMNPQRSTVWXYZ'.split('');
  const dummyCount = Math.floor(Math.random() * 7) + 6 - correctLetters.length;
  
  const dummies: string[] = [];
  for (let i = 0; i < dummyCount; i++) {
    const usedVowels = correctLetters.filter(c => vowels.includes(c)).length;
    const needVowel = usedVowels < 2 && Math.random() > 0.5;
    
    if (needVowel) {
      dummies.push(vowels[Math.floor(Math.random() * vowels.length)]);
    } else {
      dummies.push(consonants[Math.floor(Math.random() * consonants.length)]);
    }
  }
  
  // 選択肢をシャッフル
  const choices = shuffle([...correctLetters, ...dummies]);
  
  return { word: wordUpper, blanks, choices };
}
```

### SpellingView.tsx

**状態管理:**

```typescript
const [spellingState, setSpellingState] = useState<SpellingState>({
  questions: [],
  currentIndex: 0,
  score: 0,
  answered: false,
  isCorrect: false,
  selectedLetters: [],
  wrongAnswers: []
});

const [puzzle, setPuzzle] = useState<SpellingPuzzle | null>(null);
```

**パズル生成:**

```typescript
useEffect(() => {
  if (questions.length > 0 && currentIndex < questions.length) {
    const newPuzzle = generateSpellingPuzzle(questions[currentIndex].word);
    setPuzzle(newPuzzle);
    setSpellingState(prev => ({
      ...prev,
      selectedLetters: new Array(newPuzzle.blanks.length).fill(''),
      answered: false,
      isCorrect: false
    }));
  }
}, [currentIndex, questions]);
```

**文字選択処理:**

```typescript
const handleLetterClick = (letter: string) => {
  if (answered || !puzzle) return;
  
  // 最初の空欄を埋める
  const firstEmptyIndex = selectedLetters.findIndex(l => l === '');
  if (firstEmptyIndex === -1) return;
  
  const newSelected = [...selectedLetters];
  newSelected[firstEmptyIndex] = letter;
  
  setSpellingState(prev => ({
    ...prev,
    selectedLetters: newSelected
  }));
  
  // 全て埋まったら自動チェック
  if (!newSelected.includes('')) {
    checkAnswer(newSelected);
  }
};
```

**自動チェック:**

```typescript
const checkAnswer = (selected: string[]) => {
  const userAnswer = puzzle!.word.split('').map((char, i) => {
    const blankIndex = puzzle!.blanks.indexOf(i);
    return blankIndex >= 0 ? selected[blankIndex] : char;
  }).join('');
  
  const correct = userAnswer === puzzle!.word;
  
  setSpellingState(prev => ({
    ...prev,
    answered: true,
    isCorrect: correct,
    score: correct ? prev.score + 1 : prev.score,
    wrongAnswers: correct ? prev.wrongAnswers : [...prev.wrongAnswers, questions[currentIndex]]
  }));
};
```

## 🎨 UI要素

### レイアウト構造

```
┌─────────────────────────────┐
│ スコア: 3/10                │
├─────────────────────────────┤
│ 和訳: りんご                │
│                             │
│ スペル: A _ _ L _           │ ← 空欄付き単語
│                             │
│ ┌─┬─┬─┬─┬─┬─┬─┬─┐    │
│ │P│E│I│L│M│T│O│R│    │ ← 文字選択肢
│ └─┴─┴─┴─┴─┴─┴─┴─┘    │
│                             │
│ ✓ 正解！                    │ ← フィードバック
│                             │
│       [次へ →]              │
└─────────────────────────────┘
```

### スタイリング

```css
/* 単語表示エリア */
.word-blanks {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin: 2rem 0;
  font-size: 2.5rem;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

/* 文字ボックス（空欄・文字） */
.letter-box {
  width: 3rem;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #2196F3;
  border-radius: 8px;
  background: white;
}

.letter-box.blank {
  background: #f5f5f5;
  border-style: dashed;
}

.letter-box.correct {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.letter-box.wrong {
  background: #f44336;
  color: white;
  border-color: #f44336;
}

/* アルファベット選択肢 */
.letters-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin: 2rem 0;
}

.letter-btn {
  width: 3rem;
  height: 3rem;
  font-size: 1.5rem;
  font-weight: bold;
  border: 2px solid #2196F3;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.letter-btn:hover:not(:disabled) {
  background: #2196F3;
  color: white;
  transform: scale(1.1);
}

.letter-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
```

## 🔌 連携機能

### CSV読み込み

```typescript
const handleFileSelect = async (file: File) => {
  const text = await file.text();
  const questions = parseCSV(text);
  const shuffled = shuffle(questions);
  
  setSpellingState({
    questions: shuffled,
    currentIndex: 0,
    score: 0,
    answered: false,
    isCorrect: false,
    selectedLetters: [],
    wrongAnswers: []
  });
};
```

### unknownWordsとの統合

```typescript
// App.tsx内で結合
const combinedQuestions = [...csvQuestions, ...unknownWords];
```

## ✅ テストシナリオ

1. **正常系**
   - 問題開始 → 空欄と選択肢が表示
   - 文字選択 → 空欄が順番に埋まる
   - 全て埋める → 自動チェック
   - 正解 → 緑色表示、スコア増加
   - 次へ → 新しい問題

1. **エッジケース**
   - 短い単語（2文字） → 最低2つの空欄
   - 長い単語（10文字以上） → 50%まで空欄
   - 同じ文字が複数 → 個別に選択

1. **UI動作**
   - 回答後の文字ボタン無効化
   - リセット機能で再挑戦

## 📝 保守メモ

### 調整可能なパラメータ
- 空欄比率: 現在30-50%
- 選択肢数: 現在6-12個
- ダミー文字の母音/子音比率

### 将来の改善案
- ヒント機能（語源表示）
- タイムアタックモード
- 文字を戻す機能（Undo）
