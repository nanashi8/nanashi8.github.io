# スクリプト集

このディレクトリには、パッセージファイルの品質管理と保守のためのスクリプトが含まれています。

## 🤖 project_ai_servant.py

プロジェクト専用AIサーバント - メインAIの作業を支援するアシスタント

### 用語辞書機能（新機能）

プロジェクト固有の変数名、関数名、パラメータの意味を検索できます。

```bash
# 用語の意味を問い合わせ
python3 scripts/project_ai_servant.py --query-term isSkipped

# 登録されている全用語をリスト
python3 scripts/project_ai_servant.py --list-terms

# JSON形式で出力
python3 scripts/project_ai_servant.py --query-term processAnswerAndGetNext --json
```

**現在登録されている用語：**
- `isSkipped` - スキップボタン用パラメータ（初回問題判定には使わない！）
- `lastAnswerCorrectRef` - Tell, Don't Askパターンで前回の正誤を記憶
- `processAnswerAndGetNext` - 解答記録と次問選定を一括処理
- `lastQuestionIdRef` - 2語振動防止用
- `QuestionCategory` - 学習モード分類
- `LearningPhase` - 記憶定着段階

### その他の機能

```bash
# タスク分析
python3 scripts/project_ai_servant.py --analyze "文法問題を追加"

# 品質状態確認
python3 scripts/project_ai_servant.py --status

# 次のアクション提案
python3 scripts/project_ai_servant.py --suggest "UIを改善したい"

# 問題パネルの確認
python3 scripts/project_ai_servant.py --check-panel

# 警告の詳細分析
python3 scripts/project_ai_servant.py --analyze-warnings
```

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

---

## 📚 NEW HORIZON 文法問題関連スクリプト

### validate_grammar_questions.py

NEW HORIZON準拠の文並び替え問題（sentence-ordering-grade*.json）の品質検証スクリプト。

#### 機能
- 必須フィールドの存在確認（id, japanese, words, difficulty, grammarPoint, wordCount, hint）
- 語数範囲のチェック（推奨: 3-11語）
- wordCountフィールドと実際の語数の一致確認
- ID形式の検証（g{grade}-u{unit}-{number}）
- 難易度タグの妥当性確認（beginner/intermediate/advanced）
- 総問題数（totalQuestions）の整合性チェック
- 語数分布・難易度分布の統計レポート

#### 使用方法

```bash
# 全学年の文法問題を検証
python3 scripts/validate_grammar_questions.py
```

#### 出力例

```
================================================================================
Validating: sentence-ordering-grade1.json
Grade: 1, Total Questions: 50
================================================================================

Unit 0: アルファベット・小学校英語の復習 (5 questions)
Unit 1: be動詞（I am / You are） (5 questions)
...

================================================================================
Word Count Distribution:
================================================================================
  3-5 words:   40 ( 80.0%)
  6-8 words:    7 ( 14.0%)
  9-11 words:   0 (  0.0%)

================================================================================
✅ All checks passed for sentence-ordering-grade1.json!
================================================================================
```

#### 終了コード
- `0`: 全ファイルが検証成功
- `1`: エラー検出またはファイル不在

---

### grammar_stats_report.py

文並び替え問題の詳細な統計レポートを生成するスクリプト。

#### 機能
- 学年別の問題数・Unit数の集計
- 語数分布の視覚化（バーチャート）
- 難易度分布の分析
- 文法項目別の問題数ランキング（トップ15）
- 品質メトリクスの評価（目標値との比較）

#### 使用方法

```bash
# 統計レポートを生成
python3 scripts/grammar_stats_report.py
```

#### 出力例

```
================================================================================
NEW HORIZON Grammar Questions - Statistics Report
================================================================================

【Grade 1】
  Total Questions: 50
  Total Units: 10

【Grade 2】
  Total Questions: 60
  Total Units: 10

【Grade 3】
  Total Questions: 68
  Total Units: 10

================================================================================
Overall Statistics
================================================================================
Total Questions: 178
Average Questions/Unit: 5.9

================================================================================
Word Count Distribution (Overall)
================================================================================
  3-5 words:   74 ( 41.6%) ████████████████████
  6-8 words:   83 ( 46.6%) ███████████████████████
  9-11 words:  18 ( 10.1%) █████

================================================================================
Quality Metrics
================================================================================
  Word Count Distribution Quality:
    3-5 words:   41.6% (Target: ~45%)  ✅
    6-8 words:   46.6% (Target: ~50%)  ✅
    9-11 words:  10.1% (Target: ~10%)  ✅
    12+ words:    1.7% (Target: <5%)   ✅
```

---

### fix_grammar_questions.py

文法問題データの自動修復スクリプト。

#### 機能
- 欠落している`hint`フィールドの自動生成
  - 文法項目に基づいた適切なヒントを生成
  - 例: be動詞 → "主語 → be動詞 の順"
  - 例: 疑問詞 → "What → 動詞 → 主語 の順"
- `totalQuestions`の自動修正
- 語数不足問題の警告表示

#### 使用方法

```bash
# 全学年の文法問題を自動修復
python3 scripts/fix_grammar_questions.py

# 修復後は必ず検証を実行
python3 scripts/validate_grammar_questions.py
```

#### 出力例

```
================================================================================
Fixing: sentence-ordering-grade2.json
================================================================================

  ✓ Unit 1 Q1: Added hint: 'was/were + 動詞-ing の形'
  ✓ Unit 2 Q1: Added hint: 'I から始める'
  ...
  ✓ Fixed totalQuestions: 54 → 60

================================================================================
✅ Fixed sentence-ordering-grade2.json
================================================================================
```

---

## 📖 NEW HORIZON 文法問題作成ガイドライン

詳細なガイドラインは以下を参照してください:
- [docs/NEW_HORIZON_GRAMMAR_GUIDELINES.md](../docs/NEW_HORIZON_GRAMMAR_GUIDELINES.md) - 文法問題作成の標準仕様

### クイックスタート

```bash
# 1. 公式リソースの確認
# https://ten.tokyo-shoseki.co.jp/text/chu/list/keikaku/#eigo
# 年間指導計画作成資料（PDF/Word/Excel）をダウンロード

# 2. JSONファイルを編集
code public/data/sentence-ordering-grade1.json

# 3. バリデーション実行
python3 scripts/validate_grammar_questions.py

# 4. エラーがあれば自動修復
python3 scripts/fix_grammar_questions.py

# 5. 統計レポート確認
python3 scripts/grammar_stats_report.py

# 6. 最終検証
python3 scripts/validate_grammar_questions.py

# 7. コミット
git add public/data/sentence-ordering-grade*.json
git commit -m "feat(grammar): Add/Update sentence ordering questions"
```

---

## 今後の拡張

以下の機能を追加予定:
- [ ] CI/CDパイプラインでの自動検査
- [ ] VSCode拡張機能との統合
- [ ] より高度な自然言語処理による品質チェック
- [ ] 学習者レベルに応じた語彙・構文の難易度チェック
- [ ] 翻訳品質のチェック(英日対応の妥当性)
- [ ] 文法問題の重複検出
- [ ] NEW HORIZON公式資料との自動同期チェック
