# 英文分割機能開発ガイド

## 概要

語句タブに、単語と熟語のまとまりごとに「+ボタン」を付加し、カスタム問題集を作成できる機能を実装。

## 要件定義

### 目的
英文を以下の3形式で分割表示:
1. **語句分割**: `+ I / + wake up / + at seven / .` (カスタム問題集用)
2. **スラッシュ分割**: `I wake up / at seven / every morning.` (読解補助)
3. **括弧分割**: `I wake up <at seven> every morning.` (構造理解)

### 仕様策定手法
**パターン選択法**を採用:
- 具体的な英文例を提示
- A/B/Cの分割パターンから選択
- 段階的にルールを確定
- テスト駆動で実装

## 実装

### ファイル構成

```
src/utils/
├── vocabularySplitLogic.ts      # 語句分割ロジック
├── slashSplitLogic.ts           # /分割ロジック
├── parenSplitLogic.ts           # ()分割ロジック
├── generateSplitData.ts         # データ生成スクリプト
├── testVocabularySplit.ts       # 語句分割テスト
├── testSlashSplit.ts            # /分割テスト
├── testParenSplit.ts            # ()分割テスト
└── README.md                    # ツール使用ガイド

public/data/
├── passages-original/           # 元の英文データ
│   └── J_2020_4.txt
└── passages-processed/          # 処理済みデータ
    └── J_2020_4_processed.json
```

### 語句分割アルゴリズム

**7段階処理パイプライン**:

```typescript
1. イディオム保護      → "in front of", "have to"
2. 時間表現保護        → "at seven", "every morning"
3. 受動態byフレーズ保護 → "by many people"
4. 数詞表現保護        → "fifteen years old"
5. 句動詞保護         → "wake up", "want to"
6. 前置詞句保護        → "to school" (個別に)
7. トークン分割 + 整形  → "+" プレフィックス付加
```

**重要な処理**:
- `|||マーカー|||` で保護対象をマーク
- `__PROTECTED_n__` で一時退避（前置詞処理時）
- to不定詞と前置詞toの区別（`to + 動詞` vs `to + 名詞`）

### テストカバレッジ

**18パターン全合格**:

#### 基本パターン (1-12) - J_2020_4.txt由来
1. 句動詞: `wake up`
2. 接続詞: `and`, `but`
3. 前置詞句: `with my family`
4. 通常文
5. 文頭前置詞句: `After breakfast`
6. 複合文
7. 複数前置詞句: `to school / with friends`
8. 固有名詞: `Smile Zoo`
9. 句動詞: `give food`
10. 時間表現: `at eleven`, `for thirty minutes`
11. 慣用句: `have to`
12. 数詞表現: `three dollars per person`

#### 拡張パターン (13-18) - 追加文法
13. 関係代名詞: `that I bought yesterday`
14. 受動態: `by many people`
15. to不定詞: `want to`, `to see my friend`
16. 比較級: `more interesting than`
17. 疑問詞+to: `how to use`, `don't know`
18. 現在完了: `have lived`, `for five years`

## 使用方法

### コマンド

```bash
# テスト実行
npm run test:vocab-split    # 語句分割テスト（18/18確認）
npm run test:slash-split    # /分割テスト
npm run test:paren-split    # ()分割テスト
npm run test:splits         # 全テスト実行

# データ生成
npm run generate:split-data -- public/data/passages-original/J_2020_4.txt  # 単一ファイル
npm run generate:split-data                                                 # 全ファイル
```

### 生成データ形式

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

## メンテナンス

### 新しい熟語を追加

`vocabularySplitLogic.ts`:
```typescript
const phrasal_verbs = [
  'wake up', 
  'get up',
  'your_new_phrase'  // ← ここに追加
];
```

### テストケース追加

各テストファイル（例: `testVocabularySplit.ts`）:
```typescript
const testCases = [
  {
    input: "Your new test sentence.",
    expected: "+ Your / + new / + test / + sentence / ."
  }
];
```

### デバッグ

エラー時は各ステージの出力を確認:
```typescript
console.log('Stage 1:', result);  // イディオム保護後
console.log('Stage 2:', result);  // 時間表現保護後
// ...
```

## トラブルシューティング

### よくある問題

**Q: `by many people`が分割される**  
A: `passiveByPhrases`配列に追加し、ステージ3で保護

**Q: `to see`が保護される**  
A: ステージ6で`to + 動詞`を除外（`to + 名詞`のみ保護）

**Q: 前置詞句が長すぎる**  
A: 正規表現の先読みに前置詞を追加（次の前置詞で停止）

## 今後の拡張

- [ ] 比較級の`as...as`構文対応
- [ ] 関係代名詞`which`, `who`対応
- [ ] 仮定法過去対応
- [ ] 複雑な接続詞対応（`not only...but also`等）

## 参考

- 元データ: `public/data/passages-original/J_2020_4.txt`
- ツール使用ガイド: `src/utils/README.md`
- パターン選択法の詳細: 会話履歴参照
