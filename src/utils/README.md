# 英文分割ユーティリティ

このディレクトリには、英文を3種類の形式で分割処理するツール群が含まれています。

## 📁 ファイル構成

### 分割ロジック（本体）
- **`vocabularySplitLogic.ts`** - 語句分割（`+ I / + wake up / + at seven / .`）
- **`slashSplitLogic.ts`** - スラッシュ分割（`I wake up / at seven / every morning.`）
- **`parenSplitLogic.ts`** - 括弧分割（`I wake up <at seven> every morning.`）

### データ生成
- **`generateSplitData.ts`** - 英文ファイルを読み込んで3形式のJSONデータを生成

### テストスクリプト
- **`testVocabularySplit.ts`** - 語句分割のテスト（18パターン）
- **`testSlashSplit.ts`** - スラッシュ分割のテスト（18パターン）
- **`testParenSplit.ts`** - 括弧分割のテスト（18パターン）

## 🚀 使い方

### テストの実行
```bash
# 語句分割テスト（18/18合格を確認）
npm run test:vocab-split

# スラッシュ分割テスト
npm run test:slash-split

# 括弧分割テスト
npm run test:paren-split

# 全テスト実行
npm run test:splits
```

### データ生成
```bash
# 単一ファイルを処理
npm run generate:split-data -- public/data/passages-original/J_2020_4.txt

# 全ファイルを一括処理
npm run generate:split-data
```

## 📊 処理内容

### 1. 語句分割（vocabularySplit）
単語と熟語のまとまりごとに `+` ボタンを付加。カスタム問題集作成用。

**ルール**:
- 句動詞を保護: `wake up`, `give food`, `want to`, etc.
- 熟語を保護: `have to`, `in front of`, etc.
- 時間表現を保護: `at seven`, `every morning`, `for five years`
- 数詞表現を保護: `fifteen years old`, `many people`
- 受動態を保護: `by many people`
- 前置詞句を個別分離: `to school / with friends`
- to不定詞と前置詞toを区別: `to see`（分離）vs `to school`（保護）
- 句読点に+なし

**入力例**: `I wake up at seven every morning.`  
**出力**: `+ I / + wake up / + at seven / + every morning / .`

### 2. スラッシュ分割（slashSplit）
接続詞・前置詞句の前に `/` を挿入。

**入力例**: `I walk to school with friends.`  
**出力**: `I walk / to school / with friends.`

### 3. 括弧分割（parenSplit）
従属節を `()`、前置詞句を `<>` で囲む。

**入力例**: `I can't join because I have to go home by six.`  
**出力**: `I can't join (because I have to go home by six).`

## 🧪 テストカバレッジ

18パターンの文法構造をカバー:

**基本パターン (1-12)** - J_2020_4.txt由来
1. 句動詞（wake up）
2. 接続詞（and, but）
3. 前置詞句（with my family）
4. 通常文
5. 文頭前置詞句（After breakfast）
6. 複合文
7. 複数前置詞句（to school / with friends）
8. 固有名詞（Smile Zoo）
9. 句動詞（give food）
10. 時間表現（at eleven, for thirty minutes）
11. 慣用句（have to）
12. 数詞表現（three dollars per person）

**拡張パターン (13-18)** - 追加文法
13. 関係代名詞（that節）
14. 受動態（by many people）
15. to不定詞（want to, 目的用法のto）
16. 比較級（more interesting than）
17. 疑問詞+to不定詞（how to, don't know）
18. 現在完了（have lived, for five years）

## 📤 出力形式

生成されるJSONファイル: `public/data/passages-processed/{filename}_processed.json`

```json
[
  {
    "id": "J_2020_4_1",
    "original": "In our city, we have a good zoo, Smile Zoo.",
    "slashSplit": "In our city, we have a good zoo, Smile Zoo.",
    "parenSplit": "<In our city>, we have a good zoo, Smile Zoo.",
    "vocabularySplit": "+ In our city / , / + we / + have / + a / + good / + zoo / , / + Smile / + Zoo / ."
  }
]
```

## 🔧 開発経緯

このツール群は**パターン選択法**を使って仕様を確定:
1. 具体的な英文例を提示
2. A/B/Cの分割パターンから選択
3. ルールを段階的に確定
4. テスト駆動で実装

詳細: `docs/development/vocabulary-tab-implementation.md`（該当ドキュメントがあれば）

## 📝 メンテナンス

### 新しい熟語を追加
`vocabularySplitLogic.ts` の配列に追加:
```typescript
const phrasal_verbs = [
  'wake up', 'get up', 
  'your_new_phrase'  // ← ここに追加
];
```

### テストケース追加
各テストファイルに例文と期待値を追加後、再実行して確認。
