# ファイル間整合性ガイドライン

## 概要
パッセージ関連のファイルは複数のディレクトリに分散しており、相互に関連しています。
単語の意味やフレーズの翻訳に誤りを発見した場合、全ての関連ファイルを確認・修正する必要があります。

## ディレクトリ構造と役割

### 1. `public/data/passages/` (廃止予定)
- 古い形式のテキストファイル
- **使用状況**: 読み込まれていない（passageLoader.tsは`passages-for-phrase-work/`を参照）

### 2. `public/data/passages-for-phrase-work/`
- **役割**: 原文テキストファイル（.txt）
- **形式**: 1行1フレーズ形式
- **使用状況**: passageAdapter.tsでフォールバック用に参照（現在は未使用）
- **例**: `beginner-cafe-menu.txt`

### 3. `public/data/passages-phrase-learning/`
- **役割**: フレーズ学習用JSONファイル（メイン）
- **形式**: フレーズごとに英文・和訳・セグメント（単語カード）を含む
- **使用状況**: `ComprehensiveReadingView.tsx`で直接読み込み
- **例**: `beginner-cafe-menu.json`
- **重要**: 単語の`meaning`、`reading`、`etymology`などのメタデータを含む

### 4. `public/data/passages-translations/`
- **役割**: 全訳ファイル
- **形式**: パッセージ全体の日本語訳
- **使用状況**: 現在未使用（将来的に全訳表示機能で使用予定）

## 修正手順

### ステップ1: 誤りの特定
誤りを発見したら、以下を記録：
- ファイル名（例: `beginner-cafe-menu.json`）
- 誤っている内容（例: A.M.の意味が「一つの」になっている）
- 正しい内容（例: A.M. = 午前、ante meridiem）

### ステップ2: 関連ファイルの検索
同じパッセージIDを持つファイルを全て検索：
```bash
# 例: beginner-cafe-menuに関連するファイルを検索
find public/data -name "*beginner-cafe-menu*"
```

### ステップ3: 全ファイルでの該当箇所検索
```bash
# 誤った内容を含むファイルを検索
grep -r "一つの" public/data/passages-phrase-learning/beginner-cafe-menu.json
```

### ステップ4: 修正の優先順位
1. **最優先**: `passages-phrase-learning/*.json`（現在使用中）
1. **中優先**: `passages-for-phrase-work/*.txt`（フォールバック用）
1. **低優先**: `passages-translations/*.txt`（未使用）
1. **廃止**: `passages/*.txt`（読み込まれていない）

### ステップ5: 一括修正の実行
複数ファイルに同じ誤りがある場合：
```bash
# 例: A.M.の意味を一括修正
find public/data/passages-phrase-learning -name "*.json" -exec sed -i '' 's/"meaning": "一つの"/"meaning": "午前（A.M.）"/g' {} \;
```

## 特殊ケース: 略語の処理

### A.M. / P.M.
- **問題**: JSONで`a`, `.`, `m`, `.`の4セグメントに分割されている
- **対応**: フロントエンドの`groupSegmentsByPhrases`関数で結合
- **修正すべき箇所**:
  - `a`の`meaning`: 「一つの」→「午前の一部（A.M.）」または空文字列
  - `m`の`meaning`: 「メートル」→「午前の一部（A.M.）」または空文字列

### Ms. / Mr. / Dr.
- **問題**: `ms`, `.`の2セグメントに分割されている
- **対応**: フロントエンドの`groupSegmentsByPhrases`関数で結合
- **修正すべき箇所**:
  - セグメント単体の意味は空文字列または適切な説明

## チェックリスト

修正時に確認すべき項目：
- [ ] `passages-phrase-learning/*.json`の該当フレーズを修正
- [ ] 同じ単語が他のフレーズにも出現していないか確認
- [ ] 同じパッセージIDの他のディレクトリのファイルも確認
- [ ] フロントエンドの表示ロジックで正しく表示されるか確認
- [ ] 単語の`meaning`、`reading`、`etymology`が全て整合しているか確認

## 自動化スクリプト（TODO）

今後作成すべきスクリプト：
1. `scripts/validate_consistency.py` - ファイル間整合性チェック
1. `scripts/fix_abbreviations.py` - 略語の自動修正
1. `scripts/sync_translations.py` - 翻訳の同期

## 注意事項

- JSONファイルは大きいため、修正前に必ずバックアップを取る
- 一括置換は慎重に行う（意図しない箇所を変更しないよう正規表現を正確に）
- 修正後はブラウザで実際の表示を確認する
