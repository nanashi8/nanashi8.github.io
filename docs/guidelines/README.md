# Guidelines - ガイドライン・実践原則

**Diátaxis分類**: Reference（原則）+ How-to（実践）の混在  
**目的**: 品質保証、文法問題作成、テスト手順の原則と実践ガイド

---

## 📋 ファイル一覧

### 🚨 メタAI（QuestionScheduler）関連 ⚠️ 移動禁止

**出題機能トラブルシューティングの最優先導線**

- **[META_AI_TROUBLESHOOTING.md](META_AI_TROUBLESHOOTING.md)** ⭐ - 出題不具合時の完全ガイド（400+ 行）
- **[QUESTION_SCHEDULER_QUICK_GUIDE.md](QUESTION_SCHEDULER_QUICK_GUIDE.md)** ⭐ - 5分クイックガイド（1ページ）

**参照元**: `.aitk/instructions/meta-ai-priority.instructions.md`, `tests/simulation/`

---

### 📝 文法問題品質システム ⚠️ 移動禁止

**NEW HORIZON準拠の教材品質を保証**

- **[GRAMMAR_DATA_QUALITY_GUIDELINES.md](GRAMMAR_DATA_QUALITY_GUIDELINES.md)** ⭐ - 文法データ品質の核心原則
- **[AI_GRAMMAR_QUESTION_CREATION.md](AI_GRAMMAR_QUESTION_CREATION.md)** - AI による文法問題生成指示
- **[GRAMMAR_QUESTION_VALIDATION.md](GRAMMAR_QUESTION_VALIDATION.md)** - 文法問題検証手順
- **[grammar/](grammar/)** - NEW HORIZON 文法ガイドライン（6ファイル）

**参照元**: `.github/PULL_REQUEST_TEMPLATE.md`, `scripts/README.md`

---

### 📖 長文読解（Passage）関連

- **[passage/](passage/)** - パッセージ作成ガイドライン（5ファイル）

---

### 🧪 テスト・シミュレーション関連

- [DURABILITY_TESTING_GUIDE.md](DURABILITY_TESTING_GUIDE.md) - 耐久性テストガイド
- [SCENARIO_VISUALIZATION_GUIDE.md](SCENARIO_VISUALIZATION_GUIDE.md) - シナリオ可視化ガイド
- [TEST_SPECIFICATION_TEMPLATE.md](TEST_SPECIFICATION_TEMPLATE.md) - テスト仕様書テンプレート

---

### 🔧 データ品質・修正ガイド

- [DATA_QUALITY_ASSURANCE.md](DATA_QUALITY_ASSURANCE.md) - データ品質保証手順
- [DATA_QUALITY_REPORT.md](DATA_QUALITY_REPORT.md) - データ品質レポート
- [DATA_FIX_EXAMPLES.md](DATA_FIX_EXAMPLES.md) - データ修正事例集
- [QUICK_FIX_GUIDE.md](QUICK_FIX_GUIDE.md) - クイック修正ガイド
- [AM_PM_CORRECTION_LOG.md](AM_PM_CORRECTION_LOG.md) - AM/PM修正ログ

---

### 🔗 一貫性・整合性

- [CROSS_FILE_CONSISTENCY.md](CROSS_FILE_CONSISTENCY.md) - ファイル間整合性ガイド
- [META_AI_INTEGRATION_GUIDE.md](META_AI_INTEGRATION_GUIDE.md) - メタAI統合ガイド

---

## 🎯 Diátaxis分類

### Reference（参照・原則）
品質基準や原則を定義するドキュメント：
- GRAMMAR_DATA_QUALITY_GUIDELINES.md
- AI_GRAMMAR_QUESTION_CREATION.md
- grammar/NEW_HORIZON_*.md

### How-to（実践・手順）
具体的な手順やトラブルシューティング：
- META_AI_TROUBLESHOOTING.md ⭐
- QUESTION_SCHEDULER_QUICK_GUIDE.md ⭐
- DURABILITY_TESTING_GUIDE.md
- SCENARIO_VISUALIZATION_GUIDE.md

---

## 📌 重要な注意事項

### ⚠️ 移動禁止ファイル

以下のファイルは **絶対に移動しないでください**：

1. **メタAIトライアド**
   - META_AI_TROUBLESHOOTING.md
   - QUESTION_SCHEDULER_QUICK_GUIDE.md

2. **文法品質中核**
   - GRAMMAR_DATA_QUALITY_GUIDELINES.md
   - AI_GRAMMAR_QUESTION_CREATION.md
   - grammar/ 配下全ファイル

**理由**: 
- `.aitk/instructions/` から直接参照されている
- `tests/simulation/` から参照されている
- PRテンプレートで必須チェック項目として使用

移動する場合は、事前に全参照箇所（30+ 箇所）を調査し、90日間のリダイレクト期間を設けてください。

詳細: [../.donotmove](../.donotmove)

---

## 🔗 関連ドキュメント

### 仕様書
- [../specifications/QUESTION_SCHEDULER_SPEC.md](../specifications/QUESTION_SCHEDULER_SPEC.md) - QuestionScheduler詳細仕様

### 品質管理
- [../quality/QUESTION_SCHEDULER_QA_PIPELINE.md](../quality/QUESTION_SCHEDULER_QA_PIPELINE.md) - QAパイプライン
- [../quality/QUALITY_SYSTEM.md](../quality/QUALITY_SYSTEM.md) - 品質保証システム統合ガイド

### テスト
- [../../tests/simulation/README.md](../../tests/simulation/README.md) - シミュレーションテスト

---

**最終更新**: 2025-12-19
