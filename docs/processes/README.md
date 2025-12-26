# Processes - 作業プロセス・運用ガイド

**Diátaxis分類**: How-to（実践・手順）  
**目的**: デプロイ、リファクタリング、緊急対応などの運用手順

---

## 📋 ファイル一覧

### 🚀 デプロイ関連

- **[DEPLOYMENT_OPERATIONS.md](DEPLOYMENT_OPERATIONS.md)** ⭐ - 本番デプロイ手順（正本）
- **[STUDENT_DEPLOYMENT_GUIDE.md](STUDENT_DEPLOYMENT_GUIDE.md)** - 生徒向けデプロイガイド
- [AUTOMATION_GUIDE.md](AUTOMATION_GUIDE.md) - AI自律実行・自動承認・自動デプロイの仕組み

**参照元**: `.aitk/instructions/security-best-practices.instructions.md`, `README.md`

---

### 🔧 リファクタリング・安全手順

- **[REFACTORING_SAFETY.md](REFACTORING_SAFETY.md)** ⭐ - リファクタリング安全手順（完全ガイド）
- **[EMERGENCY_RECOVERY.md](EMERGENCY_RECOVERY.md)** ⭐ - 緊急復旧手順
- [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) - インシデント対応手順

**参照元**: `.aitk/instructions/refactoring-safety.instructions.md`

---

### 📝 開発プロセス

- **[COPILOT_WORK_MANAGEMENT.md](COPILOT_WORK_MANAGEMENT.md)** - 効率的開発パイプライン・作業管理ルール
- [TDD_GUIDE.md](TDD_GUIDE.md) - テスト駆動開発ガイド
- [EXPLANATION_QUALITY_GUIDE.md](EXPLANATION_QUALITY_GUIDE.md) - 説明文品質ガイド
- [CONTENT_AUTHORING_WORKFLOW.md](CONTENT_AUTHORING_WORKFLOW.md) - コンテンツ作成ワークフロー（品質重視）

---

### 📊 整理計画

- [DOCS_REORGANIZATION_PLAN.md](DOCS_REORGANIZATION_PLAN.md) - ドキュメント整理計画（段階的リンク保持型リファクタリング）

---

## 🎯 Diátaxis分類

### How-to（手順・実践）

このディレクトリは **How-to** カテゴリに属します：

- **特徴**: 「どうやるか」の具体的な手順を記述
- **用途**: デプロイ実施、リファクタリング実施、緊急対応時の参照

---

## 📌 ファイル移動について

### ✅ このディレクトリは移動可能

processes/ ディレクトリのファイルは、Diátaxis分類に基づいて `how-to/` に移動可能です。

**ただし、以下の手順が必須**:
1. 全参照箇所の調査（10-15箇所）
2. 一括リンク更新（find + sed）
3. シムファイル設置（90日間）
4. CI検証（リンクチェッカー）
5. 手動検証（README、instructions、tests）

詳細: [DOCS_REORGANIZATION_PLAN.md](DOCS_REORGANIZATION_PLAN.md) Phase 3

---

## 🔗 関連ドキュメント

### 品質管理
- [../quality/QUALITY_SYSTEM.md](../quality/QUALITY_SYSTEM.md) - 品質保証システム
- [../quality/INTEGRATED_QUALITY_PIPELINE.md](../quality/INTEGRATED_QUALITY_PIPELINE.md) - 統合品質パイプライン

### ガイドライン
- [../guidelines/META_AI_TROUBLESHOOTING.md](../guidelines/META_AI_TROUBLESHOOTING.md) - メタAIトラブルシューティング

---

**最終更新**: 2025-12-19
