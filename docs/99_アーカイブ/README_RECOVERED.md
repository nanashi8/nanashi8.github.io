# SimpleWord

**効率的な語彙学習のための適応型クイズアプリ**

最終更新: 2025年10月24日

---

## 📱 アプリ概要

SimpleWordは、CSV形式の単語リストから問題を生成し、ユーザーの習熟度に応じて適応的に出題する学習支援アプリケーションです。

### 主な機能

- **4択クイズ**: 直感的な選択式問題
- **適応型学習**: ユーザーの正答率に基づく出題調整
- **バッチ学習**: 段階的な学習進行
- **補修モード**: 苦手な単語を集中学習
- **音声読み上げ**: 問題の音声出力
- **タイマー機能**: 制限時間設定
- **成績管理**: CSV別・単語別の詳細な成績記録

---

## 🏗️ アーキテクチャ

### Feature-First / Vertical Slice Architecture

機能ごとに独立したフォルダ構成を採用しています。

```
SimpleWord/
├── App/                    # アプリエントリポイント
├── Features/               # 機能別実装
│   ├── Quiz/              # クイズ機能
│   │   ├── Views/         # UI
│   │   ├── Logic/         # ビジネスロジック
│   │   └── Domain/        # ドメインモデル
│   └── Study/             # 適応型学習
│       ├── Logic/         # スケジューラー
│       ├── Domain/        # 学習記録
│       └── Data/          # リポジトリ
├── Models/                # 共通データモデル
├── Stores/                # 状態管理
├── Utils/                 # ユーティリティ
└── Views/                 # 共通ビュー
```

詳細: `.copilot/structure-map.md`

---

## 🚀 開発ガイド

### AI支援開発

このプロジェクトはGitHub Copilotによる開発支援を前提としています。

#### 重要ドキュメント

1. **シミュレーションポリシー** (⭐ 最重要)
   - `.copilot/SIMULATION_POLICY.md`
   - AIのビルド/テスト実行ルール

2. **AI作業テンプレート**
   - `.copilot/AI_WORK_TEMPLATE.md`
   - 標準的な作業フォーマット

3. **クイックリファレンス**
   - `.copilot/quick-ref.md`
   - よく使う実装パターン

4. **エラー解決プロトコル**
   - `docs/ERROR_RESOLUTION_PROTOCOL.md`
   - エラー修正の必須手順

#### 自動化機能

**バージョン管理**: 以下のフレーズで自動実行
```
"バージョン管理してください"
"リリース準備"
```

詳細: `.copilot/AI-TRIGGER-GUIDE.md`

---

## 📖 仕様書

機能別の詳細仕様は `SimpleWord/docs/仕様書/` にあります。

- `01_クイズ機能_仕様書.md` - 4択クイズの実装詳細
- `02_出題設定_仕様書.md` - フィルタと設定
- `04_ナビゲーター機能_仕様書.md` - CSV一覧表示
- `05_成績表示_仕様書.md` - 成績管理
- `09_出題ロジック_仕様書.md` - 適応型学習アルゴリズム

---

## 🔧 開発環境

- **Xcode**: 15.0以上
- **Swift**: 5.9以上
- **iOS**: 16.0以上

---

## 📦 プロジェクト構成

### `/SimpleWord` - アプリ本体
メインの実装コード

### `/docs` - ドキュメント
- 仕様書
- 設計ドキュメント
- 各種ガイド

### `/.copilot` - AI支援ドキュメント
GitHub Copilot用のガイドとポリシー

### `/Tools` - ユーティリティスクリプト
開発補助ツール

### `/Resources` - リソースファイル
CSVデータファイル

---

## 🎯 開始方法

### 1. プロジェクトを開く
```bash
open SimpleWord.xcodeproj
```

### 2. ビルド・実行
Xcode で `Cmd + R` を押してビルド・実行

### 3. CSVファイルの配置
`SimpleWord/Resources/` に単語リストのCSVファイルを配置

---

## 📚 関連ドキュメント

### 開発者向け
- [構造マップ](.copilot/structure-map.md) - コードベース全体像
- [クイックリファレンス](.copilot/quick-ref.md) - よく使うパターン
- [エラー解決プロトコル](docs/ERROR_RESOLUTION_PROTOCOL.md) - エラー修正手順

### AI向け
- [シミュレーションポリシー](.copilot/SIMULATION_POLICY.md) - AI実行ルール
- [AI作業テンプレート](.copilot/AI_WORK_TEMPLATE.md) - 標準作業フォーマット
- [AIトリガーガイド](.copilot/AI-TRIGGER-GUIDE.md) - 自動化コマンド

### ユーザー向け
- [機能復元レポート](docs/FEATURE_RESTORATION_REPORT_20251023.md) - 最新の機能一覧
- [テストガイド](TEST_GUIDE.md) - テスト方法

---

## 📄 ライセンス

このプロジェクトは個人学習用です。

---

## 🙏 謝辞

- CSV形式の単語データ提供者
- GitHub Copilot開発チーム

---

**最終更新**: 2025年10月24日
**バージョン**: v1.10.0
