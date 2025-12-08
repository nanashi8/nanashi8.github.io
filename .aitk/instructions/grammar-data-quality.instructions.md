---
description: 文法データ編集時の品質基準と検証手順
applyTo: 'public/data/grammar/**/*.json'
---

# 文法データ編集時の必須ルール

このinstructionファイルは、AI assistant（GitHub Copilot等）が文法データを編集する際に従うべきルールを定義します。

## 🎯 最重要原則

**`japanese` フィールドには、必ず英文（`sentence`）の日本語訳を記載すること**

❌ **絶対に禁止**: 文法用語や説明文を記載すること

## ❌ 禁止パターン一覧

以下のような文法用語・説明文は絶対に使用してはいけません:

### 動詞関連
- ❌ 「過去形」「現在形」「未来形」
- ❌ 「過去進行形」「現在進行形」
- ❌ 「過去完了」「現在完了」「未来完了」
- ❌ 「不規則動詞」「一般動詞」「be動詞」
- ❌ 「助動詞」「受動態」「能動態」

### 文型関連
- ❌ 「疑問文」「否定文」「肯定文」
- ❌ 「命令文」「感嘆文」「間接疑問文」
- ❌ 「SVOC」「第5文型」

### 品詞・構文関連
- ❌ 「比較級」「最上級」
- ❌ 「関係代名詞」「関係副詞」
- ❌ 「分詞」「動名詞」「不定詞」
- ❌ 「複数形」「三人称単数」

### 変化パターン
- ❌ 「eを取る-ing」「yをiに変える」
- ❌ 「語尾を重ねる」「不規則変化」
- ❌ 「子音+yで-ies」

### その他
- ❌ 「穴埋め1」「並べ替え2」（問題番号のみ）
- ❌ 「〜を使う。」「〜について。」（説明文）
- ❌ 英単語や文法用語のみ（例: "must", "have to"）

## ✅ 正しい例

```json
{
  "japanese": "彼女は昨日公園へ行きました。",
  "sentence": "She went to the park yesterday.",
  "choices": ["went", "goes", "going"],
  "correctAnswer": "went"
}
```

```json
{
  "japanese": "私は今宿題をしています。",
  "sentence": "I am doing my homework now.",
  "choices": ["am doing", "do", "did"],
  "correctAnswer": "am doing"
}
```

## 🔍 編集前の必須チェック

文法データファイルを編集する前に、以下を**必ず**実行してください:

### 1. ガイドラインの確認
```bash
# 品質ガイドラインを読む
cat docs/guidelines/GRAMMAR_DATA_QUALITY_GUIDELINES.md
```

### 2. 現在の品質状態の確認
```bash
# 品質分析を実行
python scripts/analyze_grammar_data_quality.py

# 高度検証を実行
python scripts/validate_grammar_advanced.py
```

### 3. 編集対象ファイルの確認
```bash
# ファイルの有効/無効状態を確認
grep -l '"enabled": false' public/data/grammar/*.json
```

## 🛠️ 編集後の必須検証

文法データファイルを編集した後は、以下を**必ず**実行してください:

### 1. 自動検証の実行
```bash
# 高度検証を実行（文法用語検出を含む）
python scripts/validate_grammar_advanced.py

# エラーがある場合は必ず修正すること
```

### 2. 品質レポートの確認
```bash
# 品質分析を再実行
python scripts/analyze_grammar_data_quality.py

# レポートを確認
cat docs/quality/grammar_quality_report_*.md
```

### 3. Git commitの実行
```bash
# Pre-commit hookが自動的に検証を実行します
git add public/data/grammar/*.json
git commit -m "fix: 文法データの品質向上"

# もしhookがエラーを報告した場合は、必ず修正してから再コミット
```

## 🚫 よくある間違いと修正方法

### 間違い1: 文法用語が残っている

❌ **間違い:**
```json
{
  "japanese": "過去進行形she。",
  "sentence": "She was watching TV."
}
```

✅ **修正:**
```json
{
  "japanese": "彼女はテレビを見ていました。",
  "sentence": "She was watching TV."
}
```

### 間違い2: 変化パターンの説明

❌ **間違い:**
```json
{
  "japanese": "eを取る-ing。",
  "sentence": "He is making a cake."
}
```

✅ **修正:**
```json
{
  "japanese": "彼はケーキを作っています。",
  "sentence": "He is making a cake."
}
```

### 間違い3: 複数形の説明

❌ **間違い:**
```json
{
  "japanese": "leafの複数形。",
  "sentence": "There are many leaves on the tree."
}
```

✅ **修正:**
```json
{
  "japanese": "木にはたくさんの葉があります。",
  "sentence": "There are many leaves on the tree."
}
```

## 📋 編集ワークフロー

文法データを編集する際は、以下のワークフローに従ってください:

```bash
# 1. 現状確認
python scripts/analyze_grammar_data_quality.py

# 2. ガイドライン確認
cat docs/guidelines/GRAMMAR_DATA_QUALITY_GUIDELINES.md

# 3. ファイル編集
# エディタで public/data/grammar/XXX.json を編集

# 4. 検証実行
python scripts/validate_grammar_advanced.py

# 5. エラーがあれば修正して再検証（4に戻る）

# 6. コミット（pre-commit hookが自動検証）
git add public/data/grammar/XXX.json
git commit -m "fix: 文法データの品質向上"

# 7. hookでエラーが出た場合は修正して再コミット
```

## 🎓 学習リソース

- **詳細ガイドライン**: [docs/guidelines/GRAMMAR_DATA_QUALITY_GUIDELINES.md](../../docs/guidelines/GRAMMAR_DATA_QUALITY_GUIDELINES.md)
- **検証スクリプト**: `scripts/validate_grammar_advanced.py`
- **分析スクリプト**: `scripts/analyze_grammar_data_quality.py`
- **Pre-commit hook**: `.git/hooks/pre-commit`

## 🤖 AI Assistant向け注意事項

このinstructionファイルを読んでいるAI assistantは、以下を厳守してください:

1. **文法データ編集前に必ずガイドラインを確認する**
2. **`japanese`フィールドには必ず英文の翻訳を記載する（文法用語は絶対NG）**
3. **編集後は必ず検証スクリプトを実行する**
4. **検証でエラーが出た場合は、必ず修正してから次に進む**
5. **ユーザーに対して「検証済み」「品質確認済み」と報告する前に、実際に検証を実行する**

違反例を発見した場合は、即座に修正し、ユーザーに報告してください。
