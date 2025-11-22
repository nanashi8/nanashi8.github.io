# スクリプト集

このディレクトリには、パッセージファイルの品質管理と保守のためのスクリプトが含まれています。

## 📋 validate_passage.py

新しいパッセージや既存のパッセージの品質を検査するスクリプト。

### 機能
- 従属節の不自然な分離を検出
- 前置詞句の不自然な分離を検出
- 等位接続詞の不自然な分離を検出
- to不定詞句の不自然な分離を検出
- 関係詞節の不自然な分離を検出
- 並列項目のカンマ欠落を検出
- 句読点の重複を検出
- 所有格の誤りを検出
- 文断片を検出

### 使用方法

```bash
# 単一ファイルの検査
python3 scripts/validate_passage.py public/data/beginner-1.json

# 全ファイルの検査(bashの場合)
for file in public/data/*.json; do
  echo "=== $file ==="
  python3 scripts/validate_passage.py "$file"
  echo ""
done

# 全ファイルの検査(zshの場合)
for file in public/data/*.json; do
  echo "=== $file ==="
  python3 scripts/validate_passage.py "$file"
  echo ""
done
```

### 出力

検出された問題は深刻度別に分類されます:
- 🔴 **高**: 必ず修正が必要(文法的に不自然)
- 🟡 **中**: 可能な限り修正を推奨
- 🟢 **低**: 文脈に応じて判断

### 終了コード
- `0`: 問題なし
- `1`: 問題あり、またはエラー

## 🔧 fix_all_passages.py

複数のパッセージファイルを一括で修正するスクリプト。

### 機能
- 事前定義された修正ルールに基づいてフレーズを統合
- テキストの句読点・文法エラーを修正
- 自動バックアップ作成(.backup2)

### 使用方法

```bash
# 全ファイルを一括修正
python3 scripts/fix_all_passages.py

# 修正前に必ずバックアップを確認
ls -la public/data/*.backup2
```

### 注意
- このスクリプトはファイルを直接書き換えます
- 実行前に必ずgit commitまたは手動バックアップを推奨
- 修正ルールはスクリプト内で定義されています

## ワークフロー例

### 新しいパッセージを追加する場合

```bash
# 1. JSONファイルを作成
vim public/data/new-passage.json

# 2. 検査を実行
python3 scripts/validate_passage.py public/data/new-passage.json

# 3. 問題があれば手動で修正
vim public/data/new-passage.json

# 4. 再検査
python3 scripts/validate_passage.py public/data/new-passage.json

# 5. ビルドテスト
npm run build
```

### 既存のパッセージを修正する場合

```bash
# 1. 現状確認
python3 scripts/validate_passage.py public/data/existing-passage.json

# 2. バックアップ
cp public/data/existing-passage.json public/data/existing-passage.json.manual-backup

# 3. 修正
vim public/data/existing-passage.json

# 4. 再検査
python3 scripts/validate_passage.py public/data/existing-passage.json

# 5. ビルドテスト
npm run build
```

### 全ファイルの品質チェック

```bash
# 簡易チェック(エラーのみ表示)
for file in public/data/{beginner,intermediate,advanced}-*.json; do
  if ! python3 scripts/validate_passage.py "$file" > /dev/null 2>&1; then
    echo "❌ $file"
  else
    echo "✅ $file"
  fi
done

# 詳細チェック(全レポート表示)
for file in public/data/{beginner,intermediate,advanced}-*.json; do
  echo "========================================"
  python3 scripts/validate_passage.py "$file"
  echo ""
done
```

## 詳細なドキュメント

より詳しいガイドラインは以下を参照してください:
- [docs/PASSAGE_QUALITY_GUIDE.md](../docs/PASSAGE_QUALITY_GUIDE.md) - パッセージ品質検査の詳細ガイド
- [docs/15-data-structures.md](../docs/15-data-structures.md) - データ構造の仕様
- [docs/21-reading-passages.md](../docs/21-reading-passages.md) - 長文読解パッセージの仕様

## トラブルシューティング

### Python実行エラー

```bash
# Python 3がインストールされているか確認
python3 --version

# スクリプトに実行権限を付与
chmod +x scripts/validate_passage.py
chmod +x scripts/fix_all_passages.py
```

### JSONエラー

```bash
# JSONファイルの構文チェック
python3 -m json.tool public/data/your-file.json
```

### エンコーディングエラー

すべてのJSONファイルはUTF-8エンコーディングである必要があります:
```bash
# エンコーディング確認
file public/data/your-file.json

# UTF-8に変換(必要な場合)
iconv -f SHIFT-JIS -t UTF-8 public/data/your-file.json > public/data/your-file-utf8.json
```

## 今後の拡張

以下の機能を追加予定:
- [ ] CI/CDパイプラインでの自動検査
- [ ] VSCode拡張機能との統合
- [ ] より高度な自然言語処理による品質チェック
- [ ] 学習者レベルに応じた語彙・構文の難易度チェック
- [ ] 翻訳品質のチェック(英日対応の妥当性)
