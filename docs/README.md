# 中学受験英語学習アプリ - ドキュメント目次

## 📚 目次

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

### 6. データセット
- [19-中学受験単語](./19-junior-high-vocabulary.md) - 中学受験頻出単語リスト
- [20-中学受験フレーズ](./20-junior-high-phrases.md) - 中学受験頻出フレーズリスト
- [21-長文読解パッセージ](./21-reading-passages.md) - 長文読解用パッセージデータ

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

最終更新: 2025年11月22日

## 🔄 ドキュメント管理方針

1. **番号付け**: すべての主要ドキュメントは2桁の連番で管理
2. **カテゴリー分け**: 機能・AI・データ・開発ガイドで分類
3. **定期更新**: 機能追加・変更時に対応するドキュメントを更新
4. **アーカイブ**: 古い仕様書はarchive/に移動

## 📖 ドキュメント記述ルール

- **日本語**: すべてのドキュメントは日本語で記述
- **Markdown**: Markdown形式を使用
- **構造化**: 見出し階層を適切に使用
- **コード例**: 実装例は```で囲む
- **図表**: Mermaid図やASCII図を活用
