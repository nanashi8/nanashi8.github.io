# 品質自動化ガイド - 100%ユニーク度達成の仕組み

## 概要

全1,800問の文法問題(G1/G2/G3 × 3ファイルタイプ)のユニーク度100%を効率的に達成・維持するための自動化ツールとワークフロー。

## ツール構成

### 1. 検証スクリプト

**ファイル**: `scripts/validate_and_fix_duplicates.py`

**機能**:
- 全1,800問の重複検証
- グレード別・ファイルタイプ別の詳細レポート
- 重複パターンの検出と出力
- JSON形式での重複レポート出力

**使用方法**:

```bash
# 基本検証
python3 scripts/validate_and_fix_duplicates.py

# 重複レポートをJSON出力
python3 scripts/validate_and_fix_duplicates.py --export duplicate_report.json
```

**出力例**:

```
【Grade 1 (中1)】
  ✅ 100.0%  verb-form              (200/200)
  ✅ 100.0%  fill-in-blank          (200/200)
  ✅ 100.0%  sentence-ordering      (200/200)

【総計】
  総問題数: 1,800問
  ユニーク: 1,800問
  全体品質: 100.00%
```

## ワークフロー

### 新規問題作成時

1. **問題生成**
   ```bash
   python3 scripts/generate_new_questions.py --grade 2 --unit 5
   ```

2. **即座に検証**
   ```bash
   python3 scripts/validate_and_fix_duplicates.py
   ```

3. **重複があれば修正**
   - レポートに表示された重複IDを確認
   - 該当問題を手動で修正
   - 再検証

### 既存データの品質改善

1. **現状確認**
   ```bash
   python3 scripts/validate_and_fix_duplicates.py --export current_status.json
   ```

2. **重複パターン分析**
   - `current_status.json`を開いて重複箇所を確認
   - 重複が多いユニット・文法項目を特定

3. **修正実施**
   - 重複文を異なる表現に変更
   - 主語・目的語・時制を変更
   - 文脈を変えて意味は同じでも文が異なるようにする

4. **検証ループ**
   ```bash
   python3 scripts/validate_and_fix_duplicates.py
   # 100%になるまで繰り返し
   ```

## データ構造の理解

### マルチセクション構造

各JSONファイルは複数セクションを持つ:

```json
{
  "units": [
    {
      "unit": "Unit 0",
      "verbForm": [/* 20問 */],
      "fillInBlank": [/* 100問 */],
      "sentenceOrdering": [/* 100問 */]
    }
  ]
}
```

### ファイルタイプとメインセクション

| ファイル名 | メインセクション | 検証キー |
|-----------|---------------|---------|
| verb-form-questions-grade*.json | `verbForm` | `sentence` |
| fill-in-blank-questions-grade*.json | `fillInBlank` | `sentence` |
| sentence-ordering-grade*.json | `sentenceOrdering` | `correctOrder` (G3一部は`sentence`) |

**重要**: 検証スクリプトは各ファイルの**メインセクションのみ**を検証します。

## 重複修正のベストプラクティス

### 1. 文の多様化テクニック

**主語を変える**:
```
重複: "He is ____ than me." (3回)
修正: 
  - "He is ____ than me."
  - "He looks ____ than before."
  - "My brother is ____ than me."
```

**時間表現を変える**:
```
重複: "She has been ____ since morning." (4回)
修正:
  - "She has been ____ since morning."
  - "She has been ____ all day."
  - "She has been ____ for 30 minutes."
  - "She has been ____ since yesterday."
```

**数量を変える**:
```
重複: "I have three ____." (3回)
修正:
  - "I have two ____."
  - "I have five ____."
  - "I have eight ____."
```

**動詞を変える**:
```
重複: "He is ____." (4回)
修正:
  - "He is studying."
  - "He is playing."
  - "He is working."
  - "He is running."
```

### 2. 文法的一貫性の維持

重複を修正する際も、以下を維持:
- ✅ 文法項目の一貫性
- ✅ 難易度レベル
- ✅ 選択肢の妥当性
- ✅ 日本語訳の正確性

### 3. 効率的な修正順序

1. **Unit単位で修正** - 同じ文法項目をまとめて処理
2. **重複数が多い順** - インパクトの大きいものから
3. **検証→修正→検証** - 小さいサイクルで確認

## 品質メトリクス

### 目標

- **総合品質**: 100.00%
- **各グレード**: 100.00% (600/600問)
- **各ファイルタイプ**: 100.00% (200/200問)
- **重複パターン数**: 0件

### 現在の達成状況 (2025-11-29)

✅ **Grade 1**: 100.0% (600/600)
  - verb-form: 200/200
  - fill-in-blank: 200/200
  - sentence-ordering: 200/200

✅ **Grade 2**: 100.0% (600/600)
  - verb-form: 200/200
  - fill-in-blank: 200/200
  - sentence-ordering: 200/200

✅ **Grade 3**: 100.0% (600/600)
  - verb-form: 200/200
  - fill-in-blank: 200/200
  - sentence-ordering: 200/200

**総計**: 1,800/1,800問 = **100.00%** 🎉

## CI/CD統合 (今後の展望)

### GitHub Actionsでの自動検証

```yaml
# .github/workflows/quality-check.yml
name: Quality Check

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - name: Validate Grammar Questions
        run: |
          python3 scripts/validate_and_fix_duplicates.py
      - name: Upload Report
        if: failure()
        uses: actions/upload-artifact@v2
        with:
          name: duplicate-report
          path: duplicate_report.json
```

### Pre-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/bash
python3 scripts/validate_and_fix_duplicates.py
if [ $? -ne 0 ]; then
    echo "❌ 品質チェック失敗: 重複が検出されました"
    echo "修正後に再度コミットしてください"
    exit 1
fi
```

## トラブルシューティング

### よくある問題

**Q: G1/G3のsentence-orderingが23問/60問しか検出されない**

A: 一部の問題が`correctOrder`フィールドを持っていない可能性があります。スクリプトは`correctOrder`または`sentence`の両方をチェックします。

**Q: 重複レポートに表示されない重複がある**

A: 検証スクリプトはメインセクションのみをチェックします。他のセクションの重複は意図的に無視されます。

**Q: 100%達成後に新しい重複が発生**

A: 新規問題追加時は必ず検証スクリプトを実行してください。CI/CD統合で自動化することを推奨します。

## 関連ドキュメント

- [GRAMMAR_QUALITY_PIPELINE.md](./GRAMMAR_QUALITY_PIPELINE.md) - 品質プロセス全体
- [GRAMMAR_GENERATION_GUIDELINES.md](./GRAMMAR_GENERATION_GUIDELINES.md) - 問題作成ガイドライン
- [GRAMMAR_VALIDATION_SPEC.md](./GRAMMAR_VALIDATION_SPEC.md) - 検証仕様

## まとめ

このツールとワークフローにより:

1. ✅ **迅速な検証**: 1,800問を数秒で検証
2. ✅ **詳細なレポート**: グレード別・ファイルタイプ別に重複を特定
3. ✅ **再現可能**: 誰でも同じ方法で100%を達成可能
4. ✅ **継続的品質**: 新規追加時も品質維持が容易

**100%ユニーク度の達成と維持が効率的に実現できます。**
