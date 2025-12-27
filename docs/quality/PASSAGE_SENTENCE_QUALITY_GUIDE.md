# 長文品質評価システム - 使用ガイド

## 概要

長文問題（Reading Passages）の一文一文を6つの観点から評価し、スコアリングするシステムです。

## 評価項目（120点満点）

### 1. 英文品質（20点満点）
- 文法正確性
- スペルチェック
- 基本的な文の構造（大文字、句読点）
- 冠詞の使い方

### 2. 構造の確度（20点満点）
- 主節・従属節の識別
- 関係代名詞の使用
- 前置詞句の位置
- 複文・重文の構造

### 3. 節・句分類の確度（20点満点）
- 節の種類（名詞節/形容詞節/副詞節）
- 句の種類（前置詞句/不定詞句/動名詞句/分詞句）
- 文型の複雑さ

### 4. 直訳の正確さ（20点満点）
- 語順の逐語訳
- 文法要素の対応（主語、時制）
- 英日の長さバランス

### 5. 日本語訳の正確さ（20点満点）
- 意味の正確性
- 自然な日本語表現
- 文体の統一性
- 助詞の正しい使用

### 6. **Vocabulary使用率（20点満点）** ⭐
- 学習語彙データベースとの照合
- カバレッジ率の測定
- 語彙活用度の評価

**重要**: 長文読解は最終的にvocabularyの学習成果が試される場であり、この評価項目は品質評価において最も重要な指標の一つです。

## 使用方法

### 基本的な使い方

```bash
python3 scripts/validate_passage_sentence_quality.py \
  public/data/passages-phrase-learning/beginner-morning-routine.json \
  --output scripts/output/passage_quality_report.json
```

### 語彙データベースを指定

```bash
python3 scripts/validate_passage_sentence_quality.py \
  public/data/passages-phrase-learning/intermediate-school-news.json \
  --vocab public/data/vocabulary/high-school-entrance-words.csv \
         public/data/vocabulary/junior-high-intermediate-words.csv \
  --output scripts/output/passage_quality_intermediate.json
```

### 統合語彙データベースを使用

```bash
python3 scripts/validate_passage_sentence_quality.py \
  public/data/passages-phrase-learning/advanced-school-festival.json \
  --vocab public/data/vocabulary/all-words.csv \
  --min-score 90 \
  --output scripts/output/passage_quality_advanced.json
```

## オプション

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `passage_file` | 評価する長文JSONファイル | 必須 |
| `--vocab` | 語彙データベースCSV（複数指定可） | `high-school-entrance-words.csv`<br>`junior-high-intermediate-words.csv` |
| `--output` | 結果を出力するJSONファイル | なし（ターミナルのみ表示） |
| `--min-score` | 最低合格スコア | 80点 |

## 出力例

### ターミナル出力

```
============================================================
長文品質評価システム
============================================================
確認年月日: 2025年12月27日 13:04:58

📚 語彙データベース読み込み完了: 2662 語

📖 長文ファイル読み込み: beginner-morning-routine.json
   12 文を検出

🔍 品質評価開始...
   10/12 文完了

============================================================
📊 評価結果サマリー
============================================================

総合:
  平均スコア: 110.5/120点
  最高スコア: 112/120点
  最低スコア: 106/120点
  合格率: 12/12 (100.0%)

項目別平均:
  1. 英文品質:        18.7/20点
  2. 構造の確度:      19.5/20点
  3. 節・句分類:      15.8/20点
  4. 直訳の正確さ:    19.3/20点
  5. 日本語訳:        19.2/20点
  6. 語彙使用率:      17.9/20点

✅ 詳細結果を出力: scripts/output/passage_quality_beginner-morning-routine.json
============================================================
```

### JSON出力（抜粋）

```json
{
  "evaluation_date": "2025年12月27日 13:04:58",
  "passage_file": "public/data/passages-phrase-learning/beginner-morning-routine.json",
  "total_sentences": 12,
  "average_score": 110.5,
  "pass_rate": 1.0,
  "results": [
    {
      "english": "I wake up",
      "japanese": "私は起きます",
      "total_score": 111,
      "scores": {
        "english_quality": 18,
        "structure_accuracy": 20,
        "clause_classification": 15,
        "literal_accuracy": 20,
        "translation_accuracy": 20,
        "vocabulary_usage": 18
      },
      "issues": {
        "english": ["文末に句読点がない"],
        "structure": [],
        "clause": ["単文（複雑な構造なし）"],
        "literal": [],
        "translation": ["✓ です・ます調"]
      },
      "vocabulary_info": {
        "score": 18,
        "coverage_rate": "66.7%",
        "matched_count": 2,
        "total_count": 3,
        "matched_words": ["i", "wake"],
        "unmatched_words": ["up"]
      }
    }
  ]
}
```

## スコアリング基準

### Vocabulary使用率のスコアリング

| カバレッジ率 | スコア | 評価 |
|------------|--------|------|
| 80%以上 | 20点 | 優秀 |
| 60-79% | 18点 | 良好 |
| 40-59% | 15点 | 普通 |
| 20-39% | 12点 | 要改善 |
| 20%未満 | 10点 | 不十分 |

### 総合評価基準

| 総合スコア | 評価 | 説明 |
|-----------|------|------|
| 100点以上 | A | 非常に高品質 |
| 90-99点 | B | 高品質 |
| 80-89点 | C | 合格レベル |
| 70-79点 | D | 改善推奨 |
| 70点未満 | F | 要修正 |

## ワークフロー

### 1. 新規長文の品質チェック

```bash
# 長文を作成
vim public/data/passages-phrase-learning/new-passage.json

# 品質評価
python3 scripts/validate_passage_sentence_quality.py \
  public/data/passages-phrase-learning/new-passage.json \
  --vocab public/data/vocabulary/all-words.csv \
  --output scripts/output/new_passage_quality.json

# 結果確認
cat scripts/output/new_passage_quality.json | jq '.average_score'
```

### 2. 既存長文の改善

```bash
# 現状評価
python3 scripts/validate_passage_sentence_quality.py \
  public/data/passages-phrase-learning/existing-passage.json \
  --output scripts/output/before_improvement.json

# 低スコア文を確認
cat scripts/output/before_improvement.json | jq '.results[] | select(.total_score < 80)'

# 修正後に再評価
python3 scripts/validate_passage_sentence_quality.py \
  public/data/passages-phrase-learning/existing-passage.json \
  --output scripts/output/after_improvement.json
```

### 3. 全長文の一括評価

```bash
#!/bin/bash
# 全長文を評価するスクリプト

for file in public/data/passages-phrase-learning/*.json; do
  basename=$(basename "$file" .json)
  echo "Evaluating: $basename"
  
  python3 scripts/validate_passage_sentence_quality.py \
    "$file" \
    --vocab public/data/vocabulary/all-words.csv \
    --output "scripts/output/quality_${basename}.json"
done

# 平均スコアを集計
for file in scripts/output/quality_*.json; do
  score=$(cat "$file" | jq -r '.average_score')
  echo "$(basename $file): $score"
done | sort -t: -k2 -n
```

## 品質改善のヒント

### 語彙使用率を上げるには

1. **未使用語彙の確認**
   - `vocabulary_info.unmatched_words` を確認
   - 学習語彙データベースと照合

2. **自然な統合**
   - 文脈に合った語彙を選択
   - 無理に詰め込まない

3. **カバレッジレポートと連携**
   ```bash
   python3 scripts/vocab_coverage_report.py \
     --vocab public/data/vocabulary/all-words.csv
   ```

### 構造の確度を上げるには

- 単文ばかりにならないよう、適度に従属節を使用
- 関係代名詞で情報を追加
- 接続詞で文をつなぐ

### 日本語訳の品質を上げるには

- 直訳調を避ける
- です・ます調で統一
- 助詞の重複に注意

## 統合

### 既存の品質チェックシステムとの関係

```
品質保証システム
├── コード品質
│   ├── TypeScript型チェック
│   ├── ESLint
│   └── CSS Lint
├── データ品質
│   ├── 文法問題検証
│   ├── 和訳問題検証
│   └── 語彙データ検証
└── コンテンツ品質 ⭐ NEW
    ├── フレーズ訳品質検証
    └── 長文品質評価システム ← このスクリプト
```

### CI/CDへの統合（将来）

```yaml
# .github/workflows/passage-quality-check.yml
name: Passage Quality Check

on:
  pull_request:
    paths:
      - 'public/data/passages-phrase-learning/**'

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Run Quality Check
        run: |
          for file in public/data/passages-phrase-learning/*.json; do
            python3 scripts/validate_passage_sentence_quality.py \
              "$file" \
              --vocab public/data/vocabulary/all-words.csv \
              --min-score 85
          done
```

## トラブルシューティング

### Q. 語彙データベースが読み込まれない

A. CSVファイルのパスとフォーマットを確認してください。

```bash
# ファイルの存在確認
ls -la public/data/vocabulary/

# ヘッダー確認
head -n 1 public/data/vocabulary/high-school-entrance-words.csv
```

### Q. スコアが低すぎる

A. 各項目の `issues` を確認して、具体的な改善点を特定してください。

```bash
cat scripts/output/passage_quality.json | jq '.results[] | select(.total_score < 80) | {english, total_score, issues}'
```

### Q. 評価が厳しすぎる/甘すぎる

A. `--min-score` オプションで合格基準を調整できます。また、各チェッカーのスコアリングロジックはカスタマイズ可能です。

## 関連ドキュメント

- [長文作成ガイドライン](../docs/guidelines/passage/PASSAGE_CREATION_GUIDELINES.md)
- [語彙カバレッジ戦略](../docs/guidelines/passage/PASSAGE_CREATION_GUIDELINES.md#9-vocabulary-coverage-strategy)
- [フレーズ訳品質検証](../docs/quality/PHRASE_TRANSLATION_QUALITY_GUIDE.md)
- [品質保証システム](../docs/quality/QUALITY_SYSTEM.md)

## 更新履歴

- **2025-12-27**: 初版リリース
  - 6項目の品質評価システム実装
  - Vocabulary使用率評価を追加
  - 確認年月日フィールド追加
  - JSON出力サポート

---

**作成日**: 2025年12月27日  
**バージョン**: 1.0.0  
**メンテナ**: プロジェクトチーム
