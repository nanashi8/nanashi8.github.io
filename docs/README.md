# 高校受験英語学習アプリ - ドキュメント目次

## 📚 目次

## 🗓️ プロジェクト計画・ロードマップ

**プロジェクトの全体像と今後の方向性:**

- [**📋 プラットフォーム開発ロードマップ**](./PLATFORM_ROADMAP.md) - ⭐ 全体アーキテクチャ・Phase 1-5の詳細計画・技術スタック
- [**📝 Phase 1 タスクリスト**](./PHASE_1_TASKS.md) - ⭐ 基盤構築期の具体的タスク・進捗管理

**既存の計画・ロードマップ:**
- [データ品質改善計画](./guidelines/DATA_QUALITY_REPORT.md) - データ品質向上のフェーズ別計画
- [パッセージ作成ロードマップ](./guidelines/passage/PASSAGE_CREATION_GUIDELINES.md) - 長文パッセージの段階的追加計画
- [文法問題品質パイプライン](./guidelines/grammar/GRAMMAR_QUALITY_PIPELINE.md) - 文法問題の生成・検証フロー

---

## 🚀 開発効率化ドキュメント（AI作業用）

**開発作業を始める前に必ず確認:**

- [**AI開発ワークフロー指示書**](./AI_WORKFLOW_INSTRUCTIONS.md) - ⭐ AIアシスタント向け・作業タイプ別の標準フロー・必須ドキュメント索引
- [**クイックリファレンス**](./QUICK_REFERENCE.md) - ⭐ 作業タイプ別ドキュメント早見表・即座にアクセス
- [**品質チェックリスト統合**](./QUALITY_CHECKLIST.md) - ⭐ 全作業タイプの完了前チェック項目

---

### 1. プロジェクト概要
- [01-プロジェクト概要](./01-project-overview.md) - プロジェクトの目的、ターゲット、主要機能

### 2. 機能仕様
- [02-和訳クイズ](./02-translation-quiz.md) - 和訳クイズ機能の詳細仕様
- [03-スペルクイズ](./03-spelling-quiz.md) - スペリングクイズ機能の詳細仕様
- [04-長文読解](./04-reading-comprehension.md) - 長文読解機能の詳細仕様
- [05-統計・分析](./05-stats-analytics.md) - 統計表示と学習分析機能
- [06-設定画面](./06-settings.md) - 設定画面の仕様

### 3. AI機能仕様
- [07-認知負荷AI](./07-cognitive-load-ai.md) - 認知負荷の測定と調整
- [08-エラー予測AI](./08-error-prediction-ai.md) - エラーパターン分析と予測
- [09-文脈学習AI](./09-contextual-learning-ai.md) - 文脈に基づく学習順序の最適化
- [10-学習スタイルAI](./10-learning-style-ai.md) - 学習スタイル分析と推奨
- [11-ゲーミフィケーションAI](./11-gamification-ai.md) - モチベーション管理と報酬システム
- [12-学習曲線AI](./12-learning-curve-ai.md) - 学習進捗の予測と最適化
- [13-レーダーチャートAI](./13-radar-chart-ai.md) - 6カテゴリー分析と弱点強化
- [14-AIコメント生成](./14-ai-comment-generator.md) - 動的コメント生成システム

### 4. データ構造
- [15-データ構造](./15-data-structures.md) - 問題データ、進捗データの構造
- [16-ストレージ戦略](./16-storage-strategy.md) - IndexedDB/LocalStorageの使い分け

### 5. UI/UXデザイン

- [17-スタイリング](./17-styling.md) - デザインシステムとCSSガイドライン
- [18-ダークモード](./18-dark-mode.md) - ダークモード実装の詳細
- [**UI開発ガイドライン**](./UI_DEVELOPMENT_GUIDELINES.md) - ⚠️ 必読：CSS変数使用規則・ライトモード/ダークモード対応必須事項
- [**デザインシステムルール**](./DESIGN_SYSTEM_RULES.md) - ⚠️ 必読：カラーシステム定義・自動チェック方法

### 6. データセット
- [19-中学受験単語](./19-junior-high-vocabulary.md) - 中学受験頻出単語リスト
- [20-中学受験フレーズ](./20-junior-high-phrases.md) - 中学受験頻出フレーズリスト
- [21-長文読解パッセージ](./21-reading-passages.md) - 長文読解用パッセージデータ
- [**NEW HORIZON文法問題ガイドライン**](./NEW_HORIZON_GRAMMAR_GUIDELINES.md) - 文並び替え問題の作成標準仕様

### 7. 開発ガイド
- [22-開発環境セットアップ](./22-development-setup.md) - 開発環境の構築手順
- [23-デプロイメント](./23-deployment.md) - GitHub Pagesへのデプロイ手順
- [24-テスト戦略](./24-testing-strategy.md) - テスト方針とテストケース
- [**パッセージ作成ガイドライン**](./PASSAGE_CREATION_GUIDELINES.md) - 長文パッセージの作成・編集標準仕様

### 8. 変更履歴・レポート
- [25-変更履歴](./25-changelog.md) - 機能追加・修正の履歴
- [26-実装完了レポート](./26-final-report.md) - プロジェクト完了時のレポート

---

## 🗂️ アーカイブ（参考用）

開発過程で作成された旧ドキュメントを `archive/` に保管:

- **旧仕様書**: archive/specifications/ - 初期設計ドキュメント
- **開発ワークフロー**: READING_*.md, RETENTION_*.md, PHRASE_*.md
- **参考資料**: references/ - デプロイガイド、セットアップ手順

### アーカイブ内の主要ドキュメント

- `archive/specifications/00-overview.md` - 旧システム概要
- `archive/RETENTION_IMPLEMENTATION_COMPLETE.md` - 定着度機能実装レポート
- `archive/READING_PASSAGES_GUIDE.md` - 長文パッセージ作成ガイド
- `archive/PHRASE_GENERATION_WORKFLOW.md` - フレーズ生成ワークフロー

---

## 📝 ドキュメント更新日

最終更新: 2025年11月25日（v3.1.0）

## 🔄 ドキュメント管理方針

1. **番号付け**: すべての主要ドキュメントは2桁の連番で管理
1. **カテゴリー分け**: 機能・AI・データ・開発ガイドで分類
1. **定期更新**: 機能追加・変更時に対応するドキュメントを更新
1. **アーカイブ**: 古い仕様書はarchive/に移動
1. **AI効率化**: AI開発ワークフロー指示書により作業を標準化・効率化

## 📖 ドキュメント記述ルール

- **日本語**: すべてのドキュメントは日本語で記述
- **Markdown**: Markdown形式を使用
- **構造化**: 見出し階層を適切に使用
- **コード例**: 実装例は```で囲む
- **図表**: Mermaid図やASCII図を活用

## 🎯 AI作業効率化システム

このプロジェクトは、AIアシスタントが効率的に開発作業を進めるための「パイプライン」システムを整備しています：

### パイプライン構成

```
ユーザー指示
    ↓
AI_WORKFLOW_INSTRUCTIONS.md（作業タイプ判定・フロー確認）
    ↓
QUICK_REFERENCE.md（必要ドキュメントへ即座にアクセス）
    ↓
該当ガイドライン（詳細実装規則の確認）
    ↓
実装作業
    ↓
QUALITY_CHECKLIST.md（完了前の品質確認）
    ↓
デプロイ
```

### 使用方法

1. **作業開始時**: `AI_WORKFLOW_INSTRUCTIONS.md`で作業タイプを特定
1. **実装中**: `QUICK_REFERENCE.md`で必要な情報に素早くアクセス
1. **完了前**: `QUALITY_CHECKLIST.md`で品質保証

これにより、一貫性のある高品質な開発を効率的に実現できます。
