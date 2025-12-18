# Specifications - 仕様書

**Diátaxis分類**: Reference（参照・仕様）  
**目的**: 機能仕様、データ構造、API、AI機能の詳細定義

---

## 📋 ファイル一覧

### 🚨 メタAI（QuestionScheduler）仕様 ⚠️ 移動禁止

- **[QUESTION_SCHEDULER_SPEC.md](QUESTION_SCHEDULER_SPEC.md)** ⭐ - QuestionScheduler詳細仕様書（475行）
  - バージョン: 2.0.0
  - 実装: `src/ai/scheduler/QuestionScheduler.ts`
  - **参照元**: `.aitk/instructions/`, `tests/simulation/`, 各ガイドライン

---

### 🎯 プロジェクト概要（序数付き）

- [01-project-overview.md](01-project-overview.md) - プロジェクトの目的、ターゲット、主要機能

---

### 📝 機能仕様（クイズ機能）

- [02-translation-quiz.md](02-translation-quiz.md) - 和訳クイズ機能
- [03-spelling-quiz.md](03-spelling-quiz.md) - スペリングクイズ機能
- [04-reading-comprehension.md](04-reading-comprehension.md) - 長文読解機能
- [05-stats-analytics.md](05-stats-analytics.md) - 統計表示と学習分析
- [06-settings.md](06-settings.md) - 設定画面の仕様

---

### 🤖 AI機能仕様

- [07-cognitive-load-ai.md](07-cognitive-load-ai.md) - 認知負荷の測定と調整
- [08-error-prediction-ai.md](08-error-prediction-ai.md) - エラーパターン分析と予測
- [09-contextual-learning-ai.md](09-contextual-learning-ai.md) - 文脈に基づく学習順序の最適化
- [10-learning-style-ai.md](10-learning-style-ai.md) - 学習スタイル分析と推奨
- [11-gamification-ai.md](11-gamification-ai.md) - モチベーション管理と報酬システム
- [12-learning-curve-ai.md](12-learning-curve-ai.md) - 学習進捗の予測と最適化
- [13-radar-chart-ai.md](13-radar-chart-ai.md) - 6カテゴリー分析と弱点強化
- [14-ai-comment-generator.md](14-ai-comment-generator.md) - 動的コメント生成システム

---

### 📊 データ構造

- [15-data-structures.md](15-data-structures.md) - 問題データ、進捗データの構造（最新版）
- [15-data-structures-old.md](15-data-structures-old.md) - 旧版（アーカイブ）
- [16-storage-strategy.md](16-storage-strategy.md) - ストレージ戦略

---

### 🎨 スタイリング・UI

- [17-styling.md](17-styling.md) - スタイリング仕様
- [18-dark-mode.md](18-dark-mode.md) - ダークモード仕様

---

### 📚 コンテンツ仕様

- [19-junior-high-vocabulary.md](19-junior-high-vocabulary.md) - 中学英単語仕様
- [20-junior-high-phrases.md](20-junior-high-phrases.md) - 中学英熟語仕様
- [21-reading-passages.md](21-reading-passages.md) - 長文読解パッセージ仕様

---

### 📝 変更履歴・レポート

- [25-changelog.md](25-changelog.md) - 変更履歴
- [26-final-report.md](26-final-report.md) - 最終レポート

---

### 🌐 Adaptive Network（適応型学習）

- [ADAPTIVE_NETWORK_API_SPECIFICATION.md](ADAPTIVE_NETWORK_API_SPECIFICATION.md) - Adaptive Network API仕様
- [ADAPTIVE_NETWORK_ERROR_HANDLING.md](ADAPTIVE_NETWORK_ERROR_HANDLING.md) - エラーハンドリング仕様
- [ADAPTIVE_NETWORK_TEST_CASES.md](ADAPTIVE_NETWORK_TEST_CASES.md) - テストケース
- [adaptive-learning-api.md](adaptive-learning-api.md) - 適応型学習API仕様

---

## 🎯 Diátaxis分類

### Reference（仕様・API）

このディレクトリは **Reference** カテゴリに属します：

- **特徴**: 「何ができるか」「どう動作するか」を正確に記述
- **用途**: 実装時の参照、既存機能の理解、API仕様確認

---

## 📌 重要な注意事項

### ⚠️ 移動禁止ファイル

- **QUESTION_SCHEDULER_SPEC.md** は **絶対に移動しないでください**
  - **理由**: メタAIトライアドの一角。`.aitk/instructions/`, `tests/simulation/` から直接参照
  - **参照箇所**: 10+ 箇所
  - 詳細: [../.donotmove](../.donotmove)

---

## 🔗 関連ドキュメント

### ガイドライン
- [../guidelines/META_AI_TROUBLESHOOTING.md](../guidelines/META_AI_TROUBLESHOOTING.md) - メタAIトラブルシューティング
- [../guidelines/QUESTION_SCHEDULER_QUICK_GUIDE.md](../guidelines/QUESTION_SCHEDULER_QUICK_GUIDE.md) - クイックガイド

### 品質管理
- [../quality/QUESTION_SCHEDULER_QA_PIPELINE.md](../quality/QUESTION_SCHEDULER_QA_PIPELINE.md) - QAパイプライン
- [../quality/QUALITY_SYSTEM.md](../quality/QUALITY_SYSTEM.md) - 品質保証システム

### テスト
- [../../tests/simulation/README.md](../../tests/simulation/README.md) - シミュレーションテスト

---

**最終更新**: 2025-12-19
