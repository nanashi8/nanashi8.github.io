# 長文読解機能仕様書

## 📌 概要

英語の長文を自然な塊（チャンク）で表示し、分からない単語を記録しながら読解する機能。
英米人が話す際の自然な区切りでフレーズを分割し、単語の意味と文節全体の和訳を縦配置で表示。

## 🎯 機能要件

### 基本機能
- 長文をフレーズ単位で表示
- フレーズ内の各単語をクリック可能なボタンで表示
- 単語の意味を個別に表示
- フレーズ全体の和訳を表示
- 分からない単語を選択・記録
- 記録した単語を和訳・スペルクイズに追加

### レイアウト特性
- **縦配置**: 英文 → 単語の意味 → フレーズ和訳
- **自然なチャンク**: 文法構造ではなく、話す時の塊で分割
- **視覚的階層**: 英語と日本語を明確に分離

## 📊 データ構造

### ReadingPassage型

```typescript
export interface ReadingPassage {
  id: string;              // パッセージID
  title: string;           // タイトル
  phrases: ReadingPhrase[]; // フレーズの配列
}
```

### ReadingPhrase型

```typescript
export interface ReadingPhrase {
  id: string;              // フレーズID
  words: string[];         // 単語の配列（英語）
  phraseMeaning: string;   // フレーズ全体の和訳
  segments: ReadingSegment[]; // 単語セグメント情報
  isUnknown: boolean;      // 不明フラグ（未使用）
}
```

### ReadingSegment型

```typescript
export interface ReadingSegment {
  word: string;      // 単語（英語）
  meaning: string;   // 単語の意味（日本語）
  isUnknown: boolean; // この単語が分からない単語としてマークされているか
}
```

## 🔧 実装詳細

### ReadingView.tsx

**サンプルデータ構造:**

```typescript
const samplePassages: ReadingPassage[] = [
  {
    id: 'passage1',
    title: 'Learning and Technology',
    phrases: [
      {
        id: 'phrase1',
        words: ['Learning', 'is', 'a', 'lifelong', 'journey'],
        phraseMeaning: '学習は生涯の旅である',
        segments: [
          { word: 'Learning', meaning: '学習', isUnknown: false },
          { word: 'is', meaning: 'be動詞(3単現)', isUnknown: false },
          { word: 'a', meaning: '不定冠詞', isUnknown: false },
          { word: 'lifelong', meaning: '生涯の', isUnknown: false },
          { word: 'journey', meaning: '旅', isUnknown: false }
        ],
        isUnknown: false
      },
      {
        id: 'phrase2',
        words: ['that', 'requires', 'dedication', 'and', 'curiosity'],
        phraseMeaning: '献身と好奇心を必要とする',
        segments: [
          { word: 'that', meaning: '関係代名詞', isUnknown: false },
          { word: 'requires', meaning: '必要とする', isUnknown: false },
          { word: 'dedication', meaning: '献身', isUnknown: false },
          { word: 'and', meaning: 'そして', isUnknown: false },
          { word: 'curiosity', meaning: '好奇心', isUnknown: false }
        ],
        isUnknown: false
      }
      // ... 他のフレーズ
    ]
  }
];
```

**状態管理:**

```typescript
const [passages] = useState<ReadingPassage[]>(samplePassages);
const [selectedPassageId, setSelectedPassageId] = useState<string>(
  samplePassages[0]?.id || ''
);
const [unknownSegments, setUnknownSegments] = useState<Set<string>>(new Set());
```

**単語クリック処理:**

```typescript
const handleWordClick = (
  phraseId: string, 
  wordIndex: number, 
  word: string, 
  meaning: string
) => {
  const segmentKey = `${phraseId}-${wordIndex}`;
  const newUnknownSegments = new Set(unknownSegments);
  
  if (unknownSegments.has(segmentKey)) {
    // 既に選択されている → 解除
    newUnknownSegments.delete(segmentKey);
  } else {
    // 未選択 → 追加
    newUnknownSegments.add(segmentKey);
  }
  
  setUnknownSegments(newUnknownSegments);
};
```

**分からない単語を送信:**

```typescript
const handleSubmitUnknown = () => {
  const selectedPassage = passages.find(p => p.id === selectedPassageId);
  if (!selectedPassage) return;
  
  const unknownWords: Question[] = [];
  
  selectedPassage.phrases.forEach((phrase) => {
    phrase.segments.forEach((segment, index) => {
      const segmentKey = `${phrase.id}-${index}`;
      if (unknownSegments.has(segmentKey)) {
        unknownWords.push({
          word: segment.word,
          reading: '', // 読みは空
          meaning: segment.meaning,
          explanation: `${selectedPassage.title}より`,
          relatedWords: '',
          category: 'reading',
          difficulty: 'unknown'
        });
      }
    });
  });
  
  onAddUnknownWords(unknownWords);
  setUnknownSegments(new Set()); // リセット
};
```

## 🎨 UI要素

### レイアウト構造

```
┌──────────────────────────────────────┐
│ [パッセージ選択ドロップダウン]       │
├──────────────────────────────────────┤
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ Learning is a lifelong journey   │ │ ← 英文（単語ボタン）
│ │                                  │ │
│ │ 学習 be動詞 不定冠詞 生涯の 旅  │ │ ← 単語の意味
│ │                                  │ │
│ │ 学習は生涯の旅である             │ │ ← フレーズ和訳
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ that requires dedication...      │ │ ← 次のフレーズ
│ │                                  │ │
│ │ 関係代名詞 必要とする 献身...    │ │
│ │                                  │ │
│ │ 献身と好奇心を必要とする         │ │
│ └──────────────────────────────────┘ │
│                                      │
│ 選択した単語: 3個                   │
│ [分からない単語を追加]               │
└──────────────────────────────────────┘
```

### スタイリング

```css
/* 全体コンテナ */
.reading-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

/* フレーズリスト（縦配置） */
.reading-chunks {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 2rem;
}

/* フレーズブロック */
.chunk-block {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 英語単語行 */
.chunk-words {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

/* 単語ボタン */
.word-btn {
  padding: 0.5rem 1rem;
  background: #e3f2fd;
  border: 2px solid #2196F3;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.word-btn:hover {
  background: #2196F3;
  color: white;
  transform: translateY(-2px);
}

/* 選択された単語 */
.word-btn.unknown {
  background: #ffeb3b;
  border-color: #fbc02d;
  font-weight: bold;
}

/* 単語の意味行 */
.chunk-word-meanings {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  color: #666;
  font-size: 0.95rem;
  line-height: 1.8;
  padding: 0.5rem 0;
  border-top: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
}

/* フレーズ和訳 */
.chunk-translation {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 500;
  text-align: center;
  margin-top: 0.5rem;
}

/* パッセージ選択 */
.passage-selector {
  margin-bottom: 1.5rem;
}

.passage-selector select {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #2196F3;
  border-radius: 8px;
  background: white;
  cursor: pointer;
}

/* 送信ボタン */
.submit-unknown-btn {
  width: 100%;
  padding: 1rem;
  margin-top: 2rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.submit-unknown-btn:hover {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

.submit-unknown-btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
  transform: none;
}
```

## 📚 フレーズ分割の原則

### 自然なチャンクとは

英米人が話す際の塊（thought groups）で分割:

1. **主語句**: "Learning", "Modern technology", "In today's world"
1. **動詞句**: "is", "has transformed", "can access"
1. **補語・目的語**: "a lifelong journey", "information instantly"
1. **修飾句**: "that requires dedication", "from anywhere"
1. **接続詞句**: "However,", "In fact,"

### 分割の具体例

```typescript
// ❌ 文法的分割（不自然）
['Learning', 'is', 'a', 'lifelong', 'journey', 'that', 'requires'...]

// ✅ 自然なチャンク
['Learning is a lifelong journey', 'that requires dedication and curiosity']

// ❌ 単語ごと
['Modern', 'technology', 'has', 'transformed', 'the', 'way']

// ✅ 意味のある塊
['Modern technology', 'has transformed', 'the way we learn']
```

## 🔌 連携機能

### App.tsxとの統合

```typescript
// App.tsx
const [unknownWords, setUnknownWords] = useState<Question[]>([]);

const handleAddUnknownWords = (words: Question[]) => {
  setUnknownWords(prev => [...prev, ...words]);
  alert(`${words.length}個の単語を追加しました！`);
};

// ReadingViewに渡す
<ReadingView onAddUnknownWords={handleAddUnknownWords} />
```

### 和訳・スペルクイズへの追加

```typescript
// 和訳タブ
const combinedQuestions = [...csvQuestions, ...unknownWords];

// スペルタブ
const combinedQuestions = [...csvQuestions, ...unknownWords];
```

## ✅ テストシナリオ

1. **正常系**
   - パッセージ選択 → フレーズ表示
   - 単語クリック → 黄色ハイライト
   - 再クリック → ハイライト解除
   - 送信ボタン → 和訳/スペルクイズに追加

1. **UI動作**
   - ホバー → 単語が浮き上がる
   - 単語の意味が常に表示
   - フレーズ和訳が下部に表示

1. **データ連携**
   - 送信後、unknownWordsに追加
   - 他のタブで新しい問題として出題

## 📝 保守メモ

### データ追加方法

新しいパッセージを追加:

```typescript
{
  id: 'passage3',
  title: 'Your Title',
  phrases: [
    {
      id: 'phrase1',
      words: ['First', 'phrase', 'words'],
      phraseMeaning: 'フレーズの和訳',
      segments: [
        { word: 'First', meaning: '最初の', isUnknown: false },
        { word: 'phrase', meaning: 'フレーズ', isUnknown: false },
        { word: 'words', meaning: '単語', isUnknown: false }
      ],
      isUnknown: false
    }
  ]
}
```

### 将来の改善案
- 外部JSONからパッセージ読み込み
- 音声読み上げ機能
- 進捗保存機能
- 難易度レベル別フィルタ
