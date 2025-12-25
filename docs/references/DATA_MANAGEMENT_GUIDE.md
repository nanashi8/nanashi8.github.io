# データ管理・正規化ガイド

## 📋 概要

このドキュメントは、プロジェクトのデータ品質を維持し、作業効率を向上させるための運用ガイドです。

**対象**:
- Vocabulary CSVファイルの10分野システム準拠
- 長文パッセージの品質管理
- 文法問題データの検証・修正
- フレーズ翻訳の自動生成

---

## 📚 目次

- [Vocabulary管理](#vocabulary管理)
- [長文パッセージ管理](#長文パッセージ管理)
- [文法問題管理](#文法問題管理)
- [フレーズ翻訳管理](#フレーズ翻訳管理)
- [データ管理スクリプト](#データ管理スクリプト)

---

## 📖 Vocabulary管理

### 🎯 10分野システム（厳守）

すべてのvocabulary CSVファイルの「関連分野」列は、以下の**10分野のいずれか1つ**を使用すること：

1. **言語基本** - 代名詞、冠詞、前置詞、接続詞、be動詞、助動詞、基本副詞
1. **学校・学習** - 教育、学問、読み書き、科目
1. **日常生活** - 家庭、衣食住、金銭、宗教行事
1. **人・社会** - 人間関係、感情、仕事、社会活動、一般動詞・形容詞
1. **自然・環境** - 動植物、天気、地形、季節
1. **食・健康** - 食事、身体、医療、栄養
1. **運動・娯楽** - スポーツ、音楽、芸術、趣味
1. **場所・移動** - 地名、建物、交通、方向
1. **時間・数量** - 時間、日付、数、頻度
1. **科学・技術** - 科学、技術、コンピュータ、実験

**⚠️ 重要**: カテゴリ名は完全一致必須（例: 「学校学習」❌ → 「学校・学習」✅）

---

## 🛠️ データ管理スクリプト

### 1. classify_words_by_meaning.py（意味ベース分類）

**用途**: 単語・フレーズの意味から適切な10分野を自動判定

**対象ファイル**:
- `all-words.csv`
- `junior-high-entrance-words.csv`
- `junior-high-entrance-phrases.csv`
- `intermediate-1800-words.csv`
- `intermediate-1800-phrases.csv`

**実行方法**:
```bash
cd /path/to/nanashi8.github.io
python3 scripts/classify_words_by_meaning.py
```

**動作**:
1. 全対象CSVファイルを自動処理
1. バックアップを自動作成（`.backup_meaning_YYYYMMDD_HHMMSS.csv`）
1. 単語・読み・意味から10分野を判定
1. 分類結果レポートを出力

**分類ロジック**:
- **厳格な言語基本判定**: 代名詞、冠詞、前置詞、接続詞、be動詞、助動詞、基本副詞のみ
- **キーワードベース分類**: 意味に含まれるキーワードで各分野を判定
- **デフォルト**: 一般的な動詞・形容詞は「人・社会」に分類

**出力例**:
```
📊 分類結果:
  - 総行数: 3282語
  - 再分類: 3282行

📈 カテゴリ分布:
  言語基本                :  106語
  人・社会                : 1752語
  食・健康                :  474語
  ...
```

### 2. normalize_categories_to_10.py（レガシー：品詞ベース正規化）

**用途**: 既存の品詞名・カテゴリ名を10分野にマッピング

**⚠️ 非推奨**: `classify_words_by_meaning.py`の使用を推奨（より正確な分類）

**実行方法**:
```bash
python3 scripts/normalize_categories_to_10.py
```

**制限事項**:
- 元データが品詞名のみの場合、適切な分野を判定できない
- デフォルトで「言語基本」に分類される傾向がある

### 3. normalize_all_vocabulary_categories.py（一括正規化）

**用途**: 複数のCSVファイルを一括で正規化

**実行方法**:
```bash
python3 scripts/normalize_all_vocabulary_categories.py
```

**処理対象**:
- `junior-high-entrance-words.csv`
- `junior-high-entrance-phrases.csv`
- `intermediate-1800-words.csv`
- `intermediate-1800-phrases.csv`

---

## 📋 運用フロー

### 新規データ追加時

1. **CSVファイル編集**
   - 7列形式を遵守: 語句, 読み, 意味, 語源等解説, 関連語, 関連分野, 難易度
   - 関連分野は10分野のいずれか1つ
   - 難易度は「初級」「中級」「上級」のいずれか

1. **データ検証**
   ```bash
   # 10分野・難易度の適合性チェック
   python3 << 'EOF'
   import csv
   valid_categories = ["言語基本", "学校・学習", "日常生活", "人・社会", 
                       "自然・環境", "食・健康", "運動・娯楽", "場所・移動", 
                       "時間・数量", "科学・技術"]
   valid_difficulties = ["初級", "中級", "上級"]
   
   with open("public/data/vocabulary/all-words.csv", 'r', encoding='utf-8') as f:
       reader = csv.reader(f)
       next(reader)
       for i, row in enumerate(reader, start=2):
           if len(row) >= 7:
               if row[5].strip() not in valid_categories:
                   print(f"行{i}: 無効な分野 '{row[5]}'")
               if row[6].strip() not in valid_difficulties:
                   print(f"行{i}: 無効な難易度 '{row[6]}'")
   EOF
   ```

1. **アプリケーション確認**
   ```bash
   npm run dev
   ```
   - 和訳クイズで新データが表示されるか
   - スペルクイズで新データが表示されるか
   - 学習設定で10カテゴリが正しく表示されるか

### 既存データ修正時

1. **バックアップ確認**
   - スクリプト実行前に手動バックアップを推奨
   ```bash
   cp public/data/vocabulary/all-words.csv public/data/vocabulary/all-words.backup_manual_$(date +%Y%m%d).csv
   ```

1. **分類スクリプト実行**
   ```bash
   python3 scripts/classify_words_by_meaning.py
   ```

1. **結果確認**
   - 分類結果レポートを確認
   - 言語基本が3-6%程度であることを確認（厳格化後の目安）
   - 人・社会が最も多いことを確認（一般動詞・形容詞の集約先）

1. **問題がある場合**
   - バックアップから復元
   ```bash
   cp public/data/vocabulary/all-words.backup_meaning_20251127_104726.csv public/data/vocabulary/all-words.csv
   ```
   - スクリプトの分類ロジックを調整

---

## 🔍 品質チェック

### 10分野適合性チェック

```bash
cd /path/to/nanashi8.github.io
python3 << 'EOF'
import csv
from pathlib import Path

vocab_dir = Path("public/data/vocabulary")
csv_files = ["all-words.csv", "junior-high-entrance-words.csv", 
             "junior-high-entrance-phrases.csv", "intermediate-1800-words.csv",
             "intermediate-1800-phrases.csv"]

valid_categories = ["言語基本", "学校・学習", "日常生活", "人・社会", 
                    "自然・環境", "食・健康", "運動・娯楽", "場所・移動", 
                    "時間・数量", "科学・技術"]

for csv_file in csv_files:
    filepath = vocab_dir / csv_file
    if not filepath.exists():
        continue
    
    print(f"\n=== {csv_file} ===")
    invalid = []
    
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)
        for i, row in enumerate(reader, start=2):
            if len(row) >= 6 and row[5].strip() not in valid_categories:
                invalid.append((i, row[0], row[5]))
    
    if invalid:
        print(f"❌ 無効な分野: {len(invalid)}件")
        for line, word, cat in invalid[:5]:
            print(f"  行{line}: {word} → {cat}")
    else:
        print("✅ 10分野: 全て適合")
EOF
```

### 分類分布確認

```bash
python3 << 'EOF'
import csv
from pathlib import Path

vocab_dir = Path("public/data/vocabulary")

for csv_file in ["all-words.csv", "junior-high-entrance-words.csv"]:
    filepath = vocab_dir / csv_file
    if not filepath.exists():
        continue
    
    category_count = {}
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)
        for row in reader:
            if len(row) >= 6:
                cat = row[5].strip()
                category_count[cat] = category_count.get(cat, 0) + 1
    
    print(f"\n=== {csv_file} ===")
    total = sum(category_count.values())
    for cat, count in sorted(category_count.items(), key=lambda x: -x[1]):
        pct = count / total * 100
        print(f"{cat}: {count}語 ({pct:.1f}%)")
EOF
```

---

## 📖 長文パッセージ管理

### 概要

長文パッセージ（reading passages）の品質管理と自動生成のためのスクリプト群です。

### 主要スクリプト

#### 1. split_passages_into_phrases.py（フレーズ分割）

**用途**: 長文を文法的に適切な節・句（フレーズ）に自動分割

**実行方法**:
```bash
python3 scripts/split_passages_into_phrases.py
```

**機能**:
- `public/data/passages/*.txt`から長文を読み込み
- 文法的な節・句に自動分割（v3アルゴリズム）
- `public/data/passages-for-phrase-work/`に分割済みフォーマットで保存
- バックアップ自動作成

**分割ルール**:
- 従属接続詞（because, although等）で分割
- 関係代名詞（who, which等）で分割
- 等位接続詞（and, but, or）前後の条件付き分割
- カンマ分割の厳格化（前2語以上、後3語以上）

**詳細**: ~~PASSAGE_PHRASE_SPLITTING_RULES_v3.md（ファイル存在せず）~~

#### 2. passage_quality_check.py（品質検証）

**用途**: パッセージの品質を自動検証

**実行方法**:
```bash
# 単一ファイル検証
python3 scripts/passage_quality_check.py public/data/passages/beginner-school-life.txt

# 全ファイル検証
python3 scripts/passage_quality_check.py --all
```

**検証項目**:
- 段落インデント（4スペース必須）
- 文法エラー
- 句読点の正確性
- フォーマット規則
- 語数（レベル別）
  - Beginner: 800-1,500語
  - Intermediate: 1,500-2,500語
  - Advanced: 2,500-4,000語

**出力例**:
```
======================================================================
Checking: beginner-school-life.txt
======================================================================

✅ Indentation: PASSED
✅ Grammar: PASSED
✅ Punctuation: PASSED
✅ Formatting: PASSED
✅ Word Count: 1,234 words (Target: 800-1,500)

======================================================================
✅ ALL CHECKS PASSED
======================================================================
```

#### 3. vocab_coverage_report.py（語彙カバレッジ）

**用途**: パッセージで使用されている語彙の分析

**実行方法**:
```bash
# 基本語彙のみ
python3 scripts/vocab_coverage_report.py

# 中級語彙も含む
python3 scripts/vocab_coverage_report.py --include-intermediate

# 統合語彙ファイルで分析
python3 scripts/vocab_coverage_report.py --vocab public/data/vocabulary/all-words.csv
```

**出力**:
- ターミナル: サマリー統計
- `scripts/output/vocab_coverage_report.txt`: 詳細レポート
- `scripts/output/vocab_unused_*.txt`: 未使用語彙リスト（トップ200）

**分析項目**:
- 総語彙数 / 使用語彙数 / 未使用語彙数 / 使用率
- パッセージ別ユニーク語数
- 未使用語トップ200（アルファベット順）

### 運用フロー

#### 新規パッセージ作成

```bash
# 1. 長文ファイルを作成（4スペースインデント厳守）
vim public/data/passages/beginner-new-topic.txt

# 2. 品質チェック
python3 scripts/passage_quality_check.py public/data/passages/beginner-new-topic.txt

# 3. フレーズ分割
python3 scripts/split_passages_into_phrases.py

# 4. 語彙カバレッジ確認
python3 scripts/vocab_coverage_report.py

# 5. 修正が必要な場合は1に戻る
```

#### 既存パッセージ修正

```bash
# 1. バックアップ
cp public/data/passages/existing.txt public/data/passages/existing.txt.backup

# 2. 修正
vim public/data/passages/existing.txt

# 3. 品質チェック
python3 scripts/passage_quality_check.py public/data/passages/existing.txt

# 4. フレーズ再分割
python3 scripts/split_passages_into_phrases.py
```

---

## 📖 文法問題管理

### 概要

NEW HORIZON準拠の文法問題（文並び替え、動詞変化、穴埋め）の管理スクリプト群です。

### 主要スクリプト

#### 1. validate_grammar_questions.py（検証）

**用途**: 文法問題データの品質検証

**実行方法**:
```bash
python3 scripts/validate_grammar_questions.py
```

**検証項目**:
- 必須フィールドの存在確認
- 語数範囲チェック（推奨: 3-11語）
- wordCountフィールドと実際の語数の一致
- ID形式の検証（g{grade}-u{unit}-{number}）
- 難易度タグの妥当性
- totalQuestionsの整合性

**出力例**:
```
================================================================================
Validating: sentence-ordering-grade1.json
Grade: 1, Total Questions: 50
================================================================================

Unit 0: アルファベット・小学校英語の復習 (5 questions)
Unit 1: be動詞（I am / You are） (5 questions)
...

================================================================================
✅ All checks passed for sentence-ordering-grade1.json!
================================================================================
```

#### 2. fix_grammar_questions.py（自動修復）

**用途**: 文法問題データの自動修復

**実行方法**:
```bash
python3 scripts/fix_grammar_questions.py
```

**修復機能**:
- 欠落している`hint`フィールドの自動生成
- `totalQuestions`の自動修正
- 語数不足問題の警告表示

**ヒント生成例**:
- be動詞 → "主語 → be動詞 の順"
- 疑問詞 → "What → 動詞 → 主語 の順"
- 現在進行形 → "be動詞 + 動詞-ing の形"

#### 3. grammar_stats_report.py（統計レポート）

**用途**: 文法問題の詳細統計レポート生成

**実行方法**:
```bash
python3 scripts/grammar_stats_report.py
```

**レポート内容**:
- 学年別の問題数・Unit数
- 語数分布の視覚化（バーチャート）
- 難易度分布
- 文法項目別問題数ランキング（トップ15）
- 品質メトリクス評価

#### 4. expand_*.py（問題拡張）

**用途**: 各問題タイプの自動拡張

**スクリプト**:
- `expand_sentence_ordering_questions.py` - 文並び替え問題
- `expand_verb_form_questions.py` - 動詞変化問題
- `expand_fill_in_blank_questions.py` - 穴埋め問題

**実行方法**:
```bash
# 全学年の問題を一括拡張
python3 scripts/expand_sentence_ordering_questions.py
python3 scripts/expand_verb_form_questions.py
python3 scripts/expand_fill_in_blank_questions.py
```

### 運用フロー

```bash
# 1. 問題データ編集
code public/data/sentence-ordering-grade1.json

# 2. 検証
python3 scripts/validate_grammar_questions.py

# 3. エラーがあれば自動修復
python3 scripts/fix_grammar_questions.py

# 4. 統計レポート確認
python3 scripts/grammar_stats_report.py

# 5. 最終検証
python3 scripts/validate_grammar_questions.py

# 6. コミット
git add public/data/sentence-ordering-grade*.json
git commit -m "feat(grammar): Update sentence ordering questions"
```

**詳細**: [NEW_HORIZON_GRAMMAR_GUIDELINES.md](../guidelines/grammar/NEW_HORIZON_GRAMMAR_GUIDELINES.md)

---

## 📖 フレーズ翻訳管理

### 概要

長文パッセージのフレーズ単位での日本語翻訳を自動生成・管理するスクリプト群です。

### 主要スクリプト

#### 1. auto_create_japanese_phrases.py（自動翻訳生成）

**用途**: フレーズ分割済み長文の日本語翻訳を自動生成

**実行方法**:
```bash
python3 scripts/auto_create_japanese_phrases.py
```

**機能**:
- `public/data/passages-for-phrase-work/*-phrases.txt`を処理
- 各英語フレーズに対応する日本語翻訳を生成
- 形式: `[EN] | [JA]` の1行ペア形式
- バックアップ自動作成

#### 2. align_phrase_translations.py（翻訳整合性チェック）

**用途**: 英語フレーズと日本語翻訳の1:1対応を検証・修正

**実行方法**:
```bash
python3 scripts/align_phrase_translations.py
```

**検証項目**:
- 英語フレーズと日本語翻訳の数が一致
- 空行の位置が一致
- フォーマットの正確性

**出力例**:
```
================================================================================
Checking: beginner-school-life-ja-phrases.txt
================================================================================

  ✅ English phrases: 45
  ✅ Japanese translations: 45
  ✅ Alignment: PERFECT MATCH

================================================================================
```

#### 3. generate_phrase_learning_json.py（JSON変換）

**用途**: フレーズ翻訳ファイルをJSON形式に変換

**実行方法**:
```bash
python3 scripts/generate_phrase_learning_json.py
```

**機能**:
- `*-ja-phrases.txt`をJSON形式に変換
- `public/data/phrase-learning/*.json`に出力
- アプリケーションで使用可能な形式

#### 4. regenerate_all_japanese_phrases.py（一括再生成）

**用途**: 全フレーズ翻訳を一括再生成

**実行方法**:
```bash
python3 scripts/regenerate_all_japanese_phrases.py
```

**機能**:
- 全ての`*-phrases.txt`ファイルを処理
- 日本語翻訳を一括生成
- バックアップ自動作成

### 運用フロー

```bash
# 1. 長文を作成
vim public/data/passages/beginner-new-topic.txt

# 2. フレーズ分割
python3 scripts/split_passages_into_phrases.py

# 3. 日本語翻訳を自動生成
python3 scripts/auto_create_japanese_phrases.py

# 4. 翻訳の整合性チェック
python3 scripts/align_phrase_translations.py

# 5. 必要に応じて手動修正
vim public/data/passages-for-phrase-work/beginner-new-topic-ja-phrases.txt

# 6. JSON変換
python3 scripts/generate_phrase_learning_json.py

# 7. アプリケーションで動作確認
npm run dev
```

---

## 📖 品質チェック・レポート

### 概要

データ品質を維持するための検証・レポートスクリプト群です。

### 主要スクリプト

#### 1. passage_validator.py（総合品質チェック）

**用途**: パッセージの総合的な品質検証

**実行方法**:
```bash
python3 scripts/passage_validator.py public/data/passages/beginner-school-life.txt
```

#### 2. phrase_coverage_report.py（フレーズカバレッジ）

**用途**: フレーズ翻訳のカバレッジレポート

**実行方法**:
```bash
python3 scripts/phrase_coverage_report.py
```

**出力**:
- 全パッセージのフレーズ翻訳状況
- 未翻訳フレーズの検出
- カバレッジ率の算出

#### 3. compare_phrase_alignment.py（翻訳比較）

**用途**: 複数の翻訳バージョンを比較

**実行方法**:
```bash
python3 scripts/compare_phrase_alignment.py
```

### 定期的な品質チェック

```bash
# 週次チェック
python3 scripts/validate_grammar_questions.py
python3 scripts/passage_quality_check.py --all
python3 scripts/phrase_coverage_report.py

# 月次チェック
python3 scripts/vocab_coverage_report.py --include-intermediate
python3 scripts/grammar_stats_report.py
```

## 📚 関連ドキュメント

### Vocabulary管理
- **[19-junior-high-vocabulary.md](../specifications/19-junior-high-vocabulary.md)**: 単語データ仕様・10カテゴリ詳細
- **[20-junior-high-phrases.md](../specifications/20-junior-high-phrases.md)**: フレーズデータ仕様
- **[15-data-structures.md](../specifications/15-data-structures.md)**: TypeScript型定義とデータ構造
- **[QUALITY_CHECKLIST.md](../quality/QUALITY_CHECKLIST.md)**: データ品質チェックリスト

### 長文パッセージ管理
- **[PASSAGE_QUALITY_GUIDE.md](../guidelines/passage/PASSAGE_QUALITY_GUIDE.md)**: パッセージ品質検査の詳細ガイド
- **~~PASSAGE_PHRASE_SPLITTING_RULES_v3.md（ファイル存在せず）~~**: フレーズ分割ルール
- **[PASSAGE_CREATION_GUIDELINES.md](../guidelines/passage/PASSAGE_CREATION_GUIDELINES.md)**: パッセージ作成ガイドライン
- **[21-reading-passages.md](../specifications/21-reading-passages.md)**: 長文読解パッセージの仕様

### 文法問題管理
- **[NEW_HORIZON_GRAMMAR_GUIDELINES.md](../guidelines/grammar/NEW_HORIZON_GRAMMAR_GUIDELINES.md)**: 文法問題作成の標準仕様
- **[NEW_HORIZON_VERB_FORM_GUIDELINES.md](../guidelines/grammar/NEW_HORIZON_VERB_FORM_GUIDELINES.md)**: 動詞変化問題のガイドライン
- **[NEW_HORIZON_FILL_IN_BLANK_GUIDELINES.md](../guidelines/grammar/NEW_HORIZON_FILL_IN_BLANK_GUIDELINES.md)**: 穴埋め問題のガイドライン

### フレーズ翻訳管理
- **[PASSAGE_PHRASE_JSON_CREATION_GUIDE.md](../guidelines/passage/PASSAGE_PHRASE_JSON_CREATION_GUIDE.md)**: フレーズJSON作成ガイド
- **[PASSAGE_QUICKSTART.md](../guidelines/passage/PASSAGE_QUICKSTART.md)**: クイックスタートガイド

### 開発・運用
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)**: クイックリファレンス
- **[AI_WORKFLOW_INSTRUCTIONS.md](./AI_WORKFLOW_INSTRUCTIONS.md)**: AI開発ワークフロー

---

## 🚨 トラブルシューティング

### Vocabulary管理

#### 問題: スクリプト実行後、言語基本が多すぎる

**原因**: 
- レガシースクリプト（`normalize_categories_to_10.py`）を使用している
- 元データが品詞名のみで意味情報が不足

**解決策**:
```bash
# 厳格化されたスクリプトを使用
python3 scripts/classify_words_by_meaning.py
```

### 問題: 難易度列が空

**原因**: 元データで関連分野列に難易度（「上級」等）が誤入力

**解決策**:
```bash
python3 << 'EOF'
import csv

rows = []
with open("public/data/vocabulary/all-words.csv", 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)
    rows.append(header)
    
    for row in reader:
        if len(row) >= 7 and not row[6].strip():
            # sourceから判定
            source = row[7] if len(row) > 7 else ""
            if "junior" in source:
                row[6] = "初級"
            elif "intermediate" in source:
                row[6] = "中級"
            else:
                row[6] = "中級"  # デフォルト
        rows.append(row)

with open("public/data/vocabulary/all-words.csv", 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerows(rows)
EOF
```

### 問題: 特定の単語が誤った分野に分類される

**原因**: キーワードマッチングの限界

**解決策**:
1. `scripts/classify_words_by_meaning.py`の分類ロジックを調整
1. 該当分野のキーワードリストを追加
1. スクリプトを再実行

**例**: 「blasphemy」（冒涜）を「日常生活」（宗教関連）に分類したい場合
```python
# classify_words_by_meaning.py内
daily_keywords = [
    '生活', '家', '家族', ...
    '宗教', '祭', '行事', 'クリスマス', '誕生日',
    '冒涜', '神', '仏',  # ← 追加
]
```

---

## 📝 ベストプラクティス

1. **定期的な品質チェック**: 月1回、全CSVファイルの10分野適合性を確認
1. **バックアップの保持**: スクリプト実行前に手動バックアップを作成
1. **段階的な修正**: 大量のデータ修正は段階的に実施し、各段階で動作確認
1. **ドキュメント更新**: 分類ロジックを変更した場合、このガイドを更新
1. **テスト環境での検証**: 本番環境に適用する前に、ローカル環境で十分にテスト

---

## 📅 更新履歴

| 日付 | 内容 |
|------|------|
| 2025-11-27 | 初版作成：意味ベース分類スクリプトの運用ガイド整備 |

### 長文パッセージ管理

#### 問題: インデントエラーが発生

**原因**: 段落の最初の行が4スペースでインデントされていない

**解決策**:
```bash
# 自動修正（sed使用）
sed -i.bak 's/^[A-Z]/    &/g' public/data/passages/your-file.txt
```

#### 問題: フレーズ分割が不適切

**解決策**: `public/data/passages-for-phrase-work/*-phrases.txt`を手動修正

#### 問題: 語彙カバレッジが低い

**解決策**:
```bash
cat scripts/output/vocab_unused_*.txt | head -100
python3 scripts/vocab_coverage_report.py
```

### 文法問題管理

#### 問題: totalQuestionsが不一致

**解決策**:
```bash
python3 scripts/fix_grammar_questions.py
python3 scripts/validate_grammar_questions.py
```

### フレーズ翻訳管理

#### 問題: 英語フレーズと日本語翻訳の数が不一致

**解決策**:
```bash
python3 scripts/align_phrase_translations.py
```

---

## 🔒 型安全性とデータ整合性

### TypeScript型定義（コンパイル時チェック）

**場所**: `src/types.ts`

10分野と難易度がリテラル型として定義され、コンパイル時に型チェックが行われます：

```typescript
// 10分野システム（厳格な型定義）
export const OFFICIAL_CATEGORIES = [
  '言語基本', '学校・学習', '日常生活', '人・社会', '自然・環境',
  '食・健康', '運動・娯楽', '場所・移動', '時間・数量', '科学・技術',
] as const;

export type CategoryType = typeof OFFICIAL_CATEGORIES[number];
export type DifficultyType = 'beginner' | 'intermediate' | 'advanced';

// バリデーションヘルパー関数
export function isValidCategory(category: string): category is CategoryType;
export function isValidDifficulty(difficulty: string): difficulty is DifficultyType;
```

### ランタイムバリデーション（実行時チェック）

**場所**: `src/utils.ts` - `parseCSV`関数

CSV読み込み時に10分野適合性をチェックし、不正なカテゴリがあれば警告を出力：

```typescript
// parseCSV関数内で自動チェック
if (relatedFields && !isValidCategory(relatedFields)) {
  console.warn(
    `[データ整合性警告] 不正なカテゴリ: "${relatedFields}" (単語: "${word}")\n` +
    `有効なカテゴリ: ${OFFICIAL_CATEGORIES.join(', ')}`
  );
}
```

**確認方法**: ブラウザの開発者ツール（Console）で警告を確認

### 定数の一元管理

**場所**: `public/data/constants.json`

TypeScript/Python両方から参照可能な定数定義ファイル：

```json
{
  "version": "1.0.0",
  "categories": {
    "values": ["言語基本", "学校・学習", ...],
    "categoryDefinitions": { ... }
  },
  "difficulties": {
    "values": ["beginner", "intermediate", "advanced"]
  }
}
```

**利用**:
- TypeScript: `src/types.ts`で定義（`OFFICIAL_CATEGORIES`）
- Python: `scripts/validate_all_data.py`で読み込み

### ビルド前自動検証

**場所**: `scripts/validate_all_data.py`

**実行タイミング**:
- `npm run build` 実行時（自動）
- `npm run validate` 実行時（手動）

**検証内容**:
1. 全CSVファイルの10分野適合性チェック
1. 難易度レベルの妥当性検証
1. 必須フィールドの存在確認
1. カテゴリ分布の確認（言語基本が6%以上で警告）

**実行方法**:
```bash
# 手動検証
npm run validate

# ビルド時自動検証（package.jsonのprebuildフック）
npm run build
```

**出力例**:
```
============================================================
📊 全CSVファイル検証開始
============================================================
検証対象: 5ファイル
基準: constants.json v1.0.0

📄 検証中: all-words.csv
  ✓ 3282行検証完了 (0件のエラー)

============================================================
📋 検証結果レポート
============================================================
検証ファイル数: 5
検証行数: 8078
エラー数: 0
警告数: 0

✅ データ検証成功！すべてのファイルが品質基準を満たしています
```

### エラー発生時の対応

**ビルドが失敗した場合**:

```bash
# 1. 詳細を確認
npm run validate

# 2. エラー内容に応じて修正
# - 10分野不適合 → classify_words_by_meaning.py を実行
python3 scripts/classify_words_by_meaning.py

# - 難易度不適合 → 該当ファイルを手動修正

# 3. 再検証
npm run validate

# 4. 成功したらビルド
npm run build
```

---

## 📝 ベストプラクティス

1. **定期的な品質チェック**: 月1回、全CSVファイルの10分野適合性を確認（`npm run validate`）
1. **ビルド前検証**: デプロイ前に必ず`npm run build`で自動検証を実行
1. **バックアップの保持**: スクリプト実行前に手動バックアップ（自動バックアップも生成される）
1. **段階的な修正**: 大量のデータ修正は段階的に実施し、各段階で検証
1. **ドキュメントの更新**: 新しい分類ロジックやスクリプトを追加した場合、このガイドを更新
1. **型安全性の維持**: TypeScriptの型定義を変更した場合、constants.jsonも同期更新

---

**最終更新**: 2025-11-27 - 型安全性とビルド前検証を追加（v2.0.0）
