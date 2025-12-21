# Quality - 品質管理・QA

**Diátaxis分類**: Reference（基準・原則） + How-to（手順）の混在  
**目的**: 品質基準、テスト手順、品質レポートの集約

---

## 📋 ファイル一覧

### 🚨 品質管理中核 ⚠️ 移動注意

- **[QUALITY_SYSTEM.md](QUALITY_SYSTEM.md)** ⭐ - 品質保証システム統合ガイド（794行）
  - **参照元**: `.aitk/instructions/code-quality.instructions.md`, `README.md`, 多数の開発/保守ガイド
- **[INTEGRATED_QUALITY_PIPELINE.md](INTEGRATED_QUALITY_PIPELINE.md)** - 統合品質パイプライン
- **[QUALITY_AUTOMATION_GUIDE.md](QUALITY_AUTOMATION_GUIDE.md)** - 品質自動化ガイド

---

### 🎯 メタAI品質保証 ⚠️ 移動禁止

- **[QUESTION_SCHEDULER_QA_PIPELINE.md](QUESTION_SCHEDULER_QA_PIPELINE.md)** ⭐ - QuestionScheduler品質保証パイプライン
  - **参照元**: `.aitk/instructions/meta-ai-priority.instructions.md`, メタAIトライアド

---

### 📝 品質レポート

- [HEALTH_CHECK_REPORT.md](HEALTH_CHECK_REPORT.md) - 健康診断レポート
- [CONTENT_QUALITY_TESTING_REPORT.md](CONTENT_QUALITY_TESTING_REPORT.md) - コンテンツ品質テスト実装レポート
- [grammar_quality_report.md](GRAMMAR_QUALITY_REPORT.md) - 文法品質レポート

---

### 📊 Phase完了レポート

- [PHASE_1_COMPLETION_REPORT.md](PHASE_1_COMPLETION_REPORT.md) - Phase 1完了レポート
- [PHASE_2_COMPLETION_SUMMARY.md](PHASE_2_COMPLETION_SUMMARY.md) - Phase 2完了サマリー
- [PHASE_2_STEP1_COMPLETION_REPORT.md](PHASE_2_STEP1_COMPLETION_REPORT.md) - Phase 2 Step 1完了
- [PHASE_2_STEP2_COMPLETION_REPORT.md](PHASE_2_STEP2_COMPLETION_REPORT.md) - Phase 2 Step 2完了
- [PHASE_2_STEP3_COMPLETION_REPORT.md](PHASE_2_STEP3_COMPLETION_REPORT.md) - Phase 2 Step 3完了
- [PHASE_2_PLAN.md](PHASE_2_PLAN.md) - Phase 2計画

---

### 🎨 コンテンツ品質

- [CONTENT_QUALITY_PRINCIPLES.md](CONTENT_QUALITY_PRINCIPLES.md) - コンテンツ品質原則（質 > スピード、質 > 量、質 > 効率）
- [CONTENT_QUALITY_TESTING.md](CONTENT_QUALITY_TESTING.md) - コンテンツ品質テスト実装ガイド
- [PHRASE_TRANSLATION_QUALITY_GUIDE.md](PHRASE_TRANSLATION_QUALITY_GUIDE.md) - 熟語翻訳品質ガイド
- [PHRASE_TRANSLATION_RULES.md](PHRASE_TRANSLATION_RULES.md) - 熟語翻訳ルール

---

### 🛠️ その他品質ガイド

- [COLOR_PALETTE_SPECIFICATION.md](COLOR_PALETTE_SPECIFICATION.md) - カラーパレット仕様
- [ERROR_ZERO_POLICY_IMPLEMENTATION.md](ERROR_ZERO_POLICY_IMPLEMENTATION.md) - エラーゼロポリシー実装
- [EMERGENCY_QUALITY_NERVOUS_SYSTEM_REPORT.md](EMERGENCY_QUALITY_NERVOUS_SYSTEM_REPORT.md) - 緊急品質神経系レポート
- [GRAMMAR_QUALITY_SYSTEM.md](GRAMMAR_QUALITY_SYSTEM.md) - 文法品質システム
- [PROBLEM_CREATION_PROCESS_AUDIT.md](PROBLEM_CREATION_PROCESS_AUDIT.md) - 問題作成プロセス監査
- [QUALITY_CHECKLIST.md](QUALITY_CHECKLIST.md) - 品質チェックリスト
- [QUALITY_PIPELINE_LEGACY.md](QUALITY_PIPELINE_LEGACY.md) - 品質パイプライン（レガシー版）
- [SOFTWARE_QUALITY_TERMINOLOGY.md](SOFTWARE_QUALITY_TERMINOLOGY.md) - ソフトウェア品質用語集
- [TECHNICAL_VISION.md](TECHNICAL_VISION.md) - 技術ビジョン

---

### 📁 サブディレクトリ

- [archive/](archive/) - アーカイブされた品質レポート

---

## 🎯 Diátaxis分類

### Reference（基準・原則）
品質基準や原則を定義：
- QUALITY_SYSTEM.md
- CONTENT_QUALITY_PRINCIPLES.md
- SOFTWARE_QUALITY_TERMINOLOGY.md

### How-to（手順）
具体的な品質保証手順：
- QUESTION_SCHEDULER_QA_PIPELINE.md ⭐
- CONTENT_QUALITY_TESTING.md
- QUALITY_AUTOMATION_GUIDE.md

### Explanation（解説）
Phase完了レポート、監査レポート：
- PHASE_*_COMPLETION_REPORT.md
- HEALTH_CHECK_REPORT.md

---

## 📌 重要な注意事項

### ⚠️ 移動禁止ファイル

- **QUESTION_SCHEDULER_QA_PIPELINE.md** は **絶対に移動しないでください**
  - **理由**: メタAIトライアドの一角。`.aitk/instructions/` から直接参照
  - 詳細: [../.donotmove](../.donotmove)

### 🟠 移動注意ファイル

- **QUALITY_SYSTEM.md** は **移動時に要注意**
  - **理由**: プロジェクト全体の品質保証の中核。10+ 箇所から参照
  - 移動する場合は、全参照箇所の調査と90日間のリダイレクト期間が必須

---

## 🔗 関連ドキュメント

### ガイドライン
- [../guidelines/META_AI_TROUBLESHOOTING.md](../guidelines/META_AI_TROUBLESHOOTING.md) - メタAIトラブルシューティング
- [../guidelines/GRAMMAR_DATA_QUALITY_GUIDELINES.md](../guidelines/GRAMMAR_DATA_QUALITY_GUIDELINES.md) - 文法データ品質ガイドライン

### 仕様書
- [../specifications/QUESTION_SCHEDULER_SPEC.md](../specifications/QUESTION_SCHEDULER_SPEC.md) - QuestionScheduler仕様

### プロセス
- [../processes/REFACTORING_SAFETY.md](../processes/REFACTORING_SAFETY.md) - リファクタリング安全手順

---

**最終更新**: 2025-12-19
