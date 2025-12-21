# Grammar - NEW HORIZON文法問題ガイドライン

**Diátaxis分類**: Reference（原則・仕様）  
**目的**: NEW HORIZON準拠の文法問題作成・品質保証

---

## 📋 ファイル一覧

### 🚨 NEW HORIZON準拠ガイドライン ⚠️ 移動禁止

- **[NEW_HORIZON_GRAMMAR_GUIDELINES.md](NEW_HORIZON_GRAMMAR_GUIDELINES.md)** ⭐ - 文法問題作成の標準仕様（1038行）
  - Grade 1/2/3の全単元の文法事項
  - 公式単元構成の参照必須
  - **参照元**: `.aitk/instructions/`, `scripts/`, `docs/reports/`

- **[NEW_HORIZON_FILL_IN_BLANK_GUIDELINES.md](NEW_HORIZON_FILL_IN_BLANK_GUIDELINES.md)** - 穴埋め問題作成ガイドライン

- **[NEW_HORIZON_VERB_FORM_GUIDELINES.md](NEW_HORIZON_VERB_FORM_GUIDELINES.md)** - 動詞形式問題作成ガイドライン

---

### 📊 品質保証

- **[GRAMMAR_QUALITY_PIPELINE.md](GRAMMAR_QUALITY_PIPELINE.md)** ⭐ - 品質保証パイプライン（527行）
  - G1/G2/G3の品質保証ベストプラクティス
  - 検証手順とチェックリスト
  - **参照元**: `docs/README.md`, `docs/guidelines/`, `docs/quality/`

---

### 🔧 生成・検証

- [GRAMMAR_GENERATION_GUIDELINES.md](GRAMMAR_GENERATION_GUIDELINES.md) - 文法問題生成ガイドライン
- [GRAMMAR_VALIDATION_SPEC.md](GRAMMAR_VALIDATION_SPEC.md) - 文法問題検証仕様

---

## ⚠️ 重要：単元構成の確認

**文法問題作成時は必ず以下を確認:**

1. **公式単元構成マスター**
   - [../../references/NEW_HORIZON_OFFICIAL_UNIT_STRUCTURE.md](../../references/NEW_HORIZON_OFFICIAL_UNIT_STRUCTURE.md)
   - 東京書籍公式の年間指導計画から抽出

2. **単元番号の検証**
   - Grade 2: Unit 0-7 のみ存在（Unit 8, 9は存在しない）
   - Grade 3: Unit 0-6 のみ存在（Unit 7, 8, 9は存在しない）

3. **検証スクリプト実行**
   ```bash
   ./scripts/validate-unit-structure.sh
   ```

**なぜ重要か**: 誤った単元構成での学習は教育内容の崩壊を招く

---

## 📌 移動禁止ファイル

このディレクトリの全ファイルは **移動禁止** です：

**理由**:
- `.aitk/instructions/grammar-data-quality.instructions.md` から直接参照
- `scripts/README.md` から参照
- `.github/PULL_REQUEST_TEMPLATE.md` でチェック必須
- `docs/reports/UNIT_STRUCTURE_ERROR_CORRECTION_PLAN.md` から参照

詳細: [../../.donotmove](../../.donotmove)

---

## 🔗 関連ドキュメント

### 親ガイドライン
- [../GRAMMAR_DATA_QUALITY_GUIDELINES.md](../GRAMMAR_DATA_QUALITY_GUIDELINES.md) - 文法データ品質ガイドライン
- [../AI_GRAMMAR_QUESTION_CREATION.md](../AI_GRAMMAR_QUESTION_CREATION.md) - AI による文法問題生成

### 品質管理
- [../../quality/grammar_quality_report.md](../../quality/GRAMMAR_QUALITY_REPORT.md) - 文法品質レポート
- [../../quality/QUALITY_SYSTEM.md](../../quality/QUALITY_SYSTEM.md) - 品質保証システム

### 公式資料
- [../../references/NEW_HORIZON_OFFICIAL_UNIT_STRUCTURE.md](../../references/NEW_HORIZON_OFFICIAL_UNIT_STRUCTURE.md) - 公式単元構成

---

**最終更新**: 2025-12-19
