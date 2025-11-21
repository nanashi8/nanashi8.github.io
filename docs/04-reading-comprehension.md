# 04. 長文読解機能仕様書

## 📖 概要

長文読解機能は、段落ごとに英文を提示し、分からない単語をマークしながら読み進める学習モードです。和訳は節・句単位で段階的に表示され、最終的に全文の和訳と選択した未知語を問題集として保存できます。

### 主な特徴

- **段落単位の表示**: 長文を節・句（フレーズ）に分割して見やすく配置
- **未知語マーキング**: 分からない単語をタップして赤くマーク
- **段階的和訳**: フレーズごとに和訳を表示し、理解度に応じて進行
- **問題集自動生成**: マークした未知語を問題集として保存し、後で復習可能
- **複数長文管理**: プルダウンで複数の長文を切り替え

---

## 🎯 機能仕様

### 1. データ構造

#### ReadingPassage（長文データ）

```typescript
export interface ReadingPassage {
  id: string;              // 一意のID
  title: string;           // タイトル（例: "Modern Technology"）
  level?: string;          // 難易度レベル（初級/中級/上級）
  theme?: string;          // テーマ（例: "科学技術"）
  targetWordCount?: number; // 目標語数
  actualWordCount?: number; // 実際の語数
  phrases: ReadingPhrase[]; // 節・句のリスト
  translation?: string;     // 全体の和訳
}

export interface ReadingPhrase {
  id?: number;              // フレーズID
  phraseMeaning: string;    // 節・句全体の和訳
  segments: ReadingSegment[]; // 個別単語の詳細
}

export interface ReadingSegment {
  word: string;             // 単語（例: "Modern"）
  meaning: string;          // 意味（例: "現代の"）
  isUnknown: boolean;       // 未知語フラグ
}
```

#### データファイル例（public/data/passages.json）

```json
[
  {
    "id": "passage-tech-001",
    "title": "Modern Technology and Daily Life",
    "level": "中級",
    "theme": "科学技術",
    "targetWordCount": 150,
    "actualWordCount": 148,
    "translation": "現代の技術は私たちの日常生活を大きく変えました。スマートフォン、コンピューター、そしてインターネットは今や不可欠なツールです。",
    "phrases": [
      {
        "phraseMeaning": "現代の技術は",
        "segments": [
          { "word": "Modern", "meaning": "現代の", "isUnknown": false },
          { "word": "technology", "meaning": "技術", "isUnknown": false }
        ]
      },
      {
        "phraseMeaning": "私たちの日常生活を大きく変えました",
        "segments": [
          { "word": "has", "meaning": "-", "isUnknown": false },
          { "word": "changed", "meaning": "変えた", "isUnknown": false },
          { "word": "our", "meaning": "私たちの", "isUnknown": false },
          { "word": "daily", "meaning": "日常の", "isUnknown": false },
          { "word": "lives", "meaning": "生活", "isUnknown": false },
          { "word": "significantly", "meaning": "大きく", "isUnknown": false }
        ]
      }
    ]
  }
]
```

---

### 2. UI/UX フロー

#### 初期表示

1. **長文選択**: プルダウンメニューで複数の長文から選択
2. **指示表示**: 「💡 分からない単語をタップして赤くマークしてください」
3. **フレーズ表示**: 節・句ごとに英文を横並びで表示

#### 未知語マーキングフェーズ

- **単語クリック**: タップで単語が赤く変化（`isUnknown: true`）
- **再クリック**: もう一度タップで解除
- **制限**: 和訳表示後は未知語マーク不可（disabled状態）

#### 和訳表示フェーズ

1. **個別フレーズ和訳**: 各フレーズの「和訳」ボタンをクリック
   - フレーズ全体の和訳を表示
   - 各単語の意味をインライン表示（meaning !== '-'の場合）
   
2. **全フレーズ和訳**: 「✅ すべて和訳を見る」ボタンをクリック
   - すべてのフレーズの和訳を一括表示
   - 全文の日本語訳を表示
   - **未知語問題集の作成ダイアログ**を表示

#### 問題集作成ダイアログ

```
[ダイアログ内容]
3個の分からない単語が選択されています。
問題集の名前を入力してください:

[デフォルト値: "Modern Technology and Daily Lifeの単語"]
```

- **入力**: 問題集名を入力（デフォルト: `{長文タイトル}の単語`）
- **保存**: 未知語マークされた単語を`Question`型に変換して保存
- **通知**: 「問題集「○○」を作成しました! N個の単語が和訳・スペルタブで復習できます。」

#### リセット機能

- **ボタン**: 「🔄 リセットして最初から」
- **動作**: 
  - すべての和訳表示をクリア
  - すべての未知語マークを解除
  - 初期状態に戻る

---

### 3. コード例

#### 未知語マーキング処理

```typescript
const handleWordClick = (phraseIndex: number, wordIndex: number) => {
  const anyTranslationShown = phraseTranslations.some(shown => shown);
  if (anyTranslationShown || !currentPassage) return;

  setPassages((prev) =>
    prev.map((passage) =>
      passage.id === currentPassage.id
        ? {
            ...passage,
            phrases: passage.phrases.map((phrase, pIdx) =>
              pIdx === phraseIndex
                ? {
                    ...phrase,
                    segments: phrase.segments.map((seg, wIdx) =>
                      wIdx === wordIndex 
                        ? { ...seg, isUnknown: !seg.isUnknown } 
                        : seg
                    ),
                  }
                : phrase
            ),
          }
        : passage
    )
  );
};
```

#### 問題集自動生成

```typescript
const handleShowAllTranslations = () => {
  if (!currentPassage) return;

  // 全フレーズの和訳を表示
  setPhraseTranslations(new Array(currentPassage.phrases.length).fill(true));

  // 未知語を収集
  const unknownWords: Question[] = [];
  currentPassage.phrases.forEach((phrase) => {
    phrase.segments.forEach((segment) => {
      if (segment.isUnknown) {
        unknownWords.push({
          word: segment.word,
          reading: '',
          meaning: segment.meaning,
          etymology: '',
          relatedWords: phrase.phraseMeaning,
          relatedFields: currentPassage.title,
          difficulty: '',
        });
      }
    });
  });

  if (unknownWords.length > 0) {
    const setName = prompt(
      `${unknownWords.length}個の分からない単語が選択されています。\n問題集の名前を入力してください:`,
      `${currentPassage.title}の単語`
    );

    if (setName) {
      const newSet = {
        id: generateId(),
        name: setName,
        questions: unknownWords,
        createdAt: Date.now(),
        isBuiltIn: false,
        source: `長文抽出: ${currentPassage.title}`,
      };
      saveQuestionSet(newSet);
      alert(
        `問題集「${setName}」を作成しました!\n${unknownWords.length}個の単語が和訳・スペルタブで復習できます。`
      );
    }
  }
};
```

#### リセット処理

```typescript
const handleReset = () => {
  if (currentPassage) {
    setPhraseTranslations(new Array(currentPassage.phrases.length).fill(false));
    setPassages((prev) =>
      prev.map((passage) =>
        passage.id === currentPassage.id
          ? {
              ...passage,
              phrases: passage.phrases.map((phrase) => ({
                ...phrase,
                segments: phrase.segments.map((segment) => ({
                  ...segment,
                  isUnknown: false,
                })),
              })),
            }
          : passage
      )
    );
  }
};
```

---

### 4. CSS スタイリング

#### 未知語マーク

```css
.word-card {
  padding: 4px 8px;
  margin: 2px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.word-card.unknown {
  background: #ffebee;
  border-color: #f44336;
  color: #d32f2f;
  font-weight: bold;
}

.word-card.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
```

#### フレーズ表示

```css
.phrase-line {
  margin: 16px 0;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.phrase-words-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.word-meaning-inline {
  display: block;
  font-size: 0.75em;
  color: #1976d2;
  margin-top: 2px;
}
```

#### 和訳ボタン

```css
.phrase-translation-btn {
  padding: 6px 16px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}

.phrase-translation-btn:hover {
  background: #1976d2;
}
```

---

### 5. 学習フロー設計

#### ステップ1: 未知語の選択（初読）

1. 長文を読み始める
2. 分からない単語をタップしてマーク
3. 文脈から意味を推測する練習

#### ステップ2: 理解度確認（段階的和訳）

1. フレーズごとに和訳ボタンを押す
2. 自分の推測と実際の和訳を比較
3. 未知語の意味を確認

#### ステップ3: 全体理解（全文和訳）

1. すべての和訳を表示
2. 全文の日本語訳で全体の流れを確認
3. 未知語を問題集として保存

#### ステップ4: 復習（問題集活用）

1. 和訳タブ・スペルタブで未知語を復習
2. AI適応アルゴリズムで優先度調整
3. 定着するまで繰り返し出題

---

### 6. データ管理

#### 問題集保存（utils.ts）

```typescript
export function saveQuestionSet(set: QuestionSet): void {
  const sets = getQuestionSets();
  sets.push(set);
  localStorage.setItem('questionSets', JSON.stringify(sets));
}

export function getQuestionSets(): QuestionSet[] {
  const data = localStorage.getItem('questionSets');
  return data ? JSON.parse(data) : [];
}
```

#### 長文データ読み込み

```typescript
useEffect(() => {
  fetch('/data/passages.json')
    .then((res) => res.json())
    .then((data: ReadingPassage[]) => {
      setPassages(data);
      setLoading(false);
      if (data.length > 0) {
        setSelectedPassageId(data[0].id);
        setPhraseTranslations(new Array(data[0].phrases.length).fill(false));
      }
    })
    .catch((err) => {
      console.error('Failed to load passages:', err);
      setPassages([]);
      setLoading(false);
    });
}, []);
```

---

### 7. モバイル最適化

#### タッチ操作

- **単語カードサイズ**: `padding: 4px 8px` でタップしやすいサイズ
- **フォントサイズ**: 本文 `1em`、意味 `0.75em`
- **行間調整**: `margin: 2px` で読みやすい配置

#### レスポンシブデザイン

```css
@media (max-width: 768px) {
  .phrase-words-row {
    flex-direction: row;
    justify-content: flex-start;
  }
  
  .word-card {
    font-size: 0.9em;
    padding: 6px 10px;
  }
  
  .phrase-line {
    padding: 8px;
  }
}
```

---

### 8. エラーハンドリング

#### 長文データ読み込み失敗

```tsx
if (loading) {
  return <div className="reading-view"><p>📖 読み込み中...</p></div>;
}

if (passages.length === 0) {
  return (
    <div className="reading-view">
      <div className="empty-state">
        <p>📖 長文が見つかりませんでした</p>
        <p className="hint">問題設定タブから長文を追加してください</p>
      </div>
    </div>
  );
}
```

#### 問題集作成失敗

```typescript
try {
  saveQuestionSet(newSet);
  alert(`問題集「${setName}」を作成しました!`);
} catch (error) {
  console.error('問題集の保存に失敗しました:', error);
  alert('問題集の保存に失敗しました。もう一度お試しください。');
}
```

---

### 9. 将来の拡張計画

#### 機能追加案

1. **音声読み上げ**: 各フレーズを音声で再生
2. **理解度クイズ**: 内容理解を問う選択問題
3. **語数カウント**: 実際の語数を自動計算
4. **難易度推定**: 未知語数から難易度を自動判定
5. **進捗管理**: 読了した長文を記録

#### データ拡張

- 初級・中級・上級の長文を各10本以上追加
- テーマ別カテゴリ（科学、歴史、文化、スポーツなど）
- ジャンル別フィルタ機能

---

## 📚 関連ドキュメント

- [01. プロジェクト概要](./01-project-overview.md) - 全体構成と技術スタック
- [02. 和訳クイズ機能](./02-translation-quiz.md) - 選択問題での復習
- [03. スペルクイズ機能](./03-spelling-quiz.md) - 綴り入力での復習
- [15. データ構造仕様](./15-data-structures.md) - TypeScript型定義
- [16. ストレージ戦略](./16-storage-strategy.md) - LocalStorage活用法
- [21. 読解長文データセット](./21-reading-passages.md) - 長文データ詳細
