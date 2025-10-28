# SimpleWord - CSV駆動型の単語学習アプリ

**バージョン**: 3.0  
**最終更新**: 2025年10月30日  
**対応OS**: iOS 15.0以降

---

## 📖 プロジェクト概要

SimpleWordは、CSV形式の単語リストから4択クイズを生成し、効率的な単語学習を実現するiOSアプリケーションです。

### 主な特徴

- ✅ **CSVベース**: 独自のCSVファイルで学習可能
- ✅ **バッチ学習**: 効率的な短期集中学習を実現
- ✅ **詳細な成績管理**: CSV別・単語別の成績を記録
- ✅ **柔軟なフィルタ**: 分野・難易度で出題範囲をカスタマイズ
- ✅ **セッション管理**: アプリを閉じても続きから再開可能
- ✅ **Feature-First**: 保守性の高いアーキテクチャ

---

## 🚀 クイックスタート

### 必要な環境

- **macOS**: Ventura (13.0) 以降
- **Xcode**: 15.0 以降
- **iOS**: 15.0 以降（実機またはシミュレータ）

### インストール

```bash
# リポジトリのクローン
git clone <repository-url>
cd SimpleWord

# Xcodeで開く
open SimpleWord.xcodeproj

# ビルド・実行（⌘ + R）
```

### 初回起動

1. アプリを起動
2. 「出題設定」でCSVファイルを選択
3. 分野・難易度を設定（オプション）
4. 「クイズをはじめる」をタップ
5. 学習開始！

---

## 📚 主要機能

### 1. クイズ機能 🎯
4択形式で単語を学習します。

**特徴**:
- バッチ学習で集中力維持
- ラウンドロビン配置で同じ問題の連続を回避
- 前へ/次へボタンで自由に移動
- 光るアニメーションで進捗を実感
- セッション管理で中断・再開が可能

### 2. 出題設定 ⚙️
CSV別に出題条件を設定できます。

**設定項目**:
- CSV選択
- 分野フィルタ
- 難易度フィルタ
- バッチサイズ
- 繰り返し回数
- 選択肢の数
- 学習モード
- 自動進行

### 3. 成績管理 📊
学習結果を詳細に記録します。

**CSV別成績**:
- ファイルごとの学習履歴
- 正答率、出題数、正解数
- 学習履歴の時系列表示

**単語別成績**:
- 個別単語の詳細統計
- 正答率、出題回数
- 最終学習日
- ソート・フィルタ機能

### 4. CSV管理 📁
単語リストのインポート・エクスポートが可能です。

**機能**:
- Bundle内のCSV（アプリ同梱）
- Documents内のCSV（ユーザー追加）
- ファイルアプリからのインポート
- CSV内容のプレビュー

---

## 🏗️ アーキテクチャ

### Feature-First / Vertical Slice Architecture

機能ごとに独立したディレクトリ構成を採用しています。

```
SimpleWord/
├── Features/                # 機能別実装
│   ├── Quiz/               # クイズ機能
│   ├── QuizSettings/       # 出題設定
│   ├── Statistics/         # 成績管理
│   └── CSVManager/         # CSV管理
├── Common/                  # 共通コンポーネント
│   ├── Data/               # データアクセス層
│   ├── Models/             # 共通モデル
│   ├── Extensions/         # Swift拡張
│   └── Utility/            # ユーティリティ
├── Appearance/              # デザインシステム
└── Resources/               # CSVファイル

各Feature内の構造:
Feature/
├── Views/                   # SwiftUI Views
├── Services/                # ビジネスロジック
└── Models/                  # データ構造
```

詳細は `docs/ARCHITECTURE_GUIDE.md` を参照してください。

---

## 📖 ドキュメント

### 開発ガイド

- **[アーキテクチャガイド](docs/ARCHITECTURE_GUIDE.md)** - システム設計の全体像
- **[包括的仕様書](docs/COMPREHENSIVE_SPECIFICATION.md)** - 機能別詳細仕様
- **[参考資料](SimpleWord/docs/参考資料/)** - 学習・開発ガイド

### 参考資料の構成

```
参考資料/
├── 01_学習者向け/          # 初心者ガイド
├── 02_開発者向け/          # 開発実務ガイド
├── 03_AI活用ガイド/        # AIを使った効率化
└── 04_履歴・レポート/      # 改訂履歴・アーカイブ
```

詳細は `SimpleWord/docs/参考資料/00_参考資料ガイド.md` を参照してください。

---

## 🔧 開発

### 技術スタック

- **言語**: Swift 5.9+
- **フレームワーク**: SwiftUI, Combine
- **データ**: CSV (UserDefaults for persistence)
- **最低対応**: iOS 15.0

### ビルド

```bash
# Xcodeで開く
open SimpleWord.xcodeproj

# コマンドラインでビルド
xcodebuild -project SimpleWord.xcodeproj \
           -scheme SimpleWord \
           -sdk iphonesimulator \
           -configuration Debug
```

### テスト

```bash
# ユニットテスト実行
xcodebuild test -project SimpleWord.xcodeproj \
                -scheme SimpleWord \
                -sdk iphonesimulator \
                -destination 'platform=iOS Simulator,name=iPhone 15'
```

---

## 📄 ライセンス

このプロジェクトのライセンス情報については、プロジェクト管理者にお問い合わせください。

---

## 🤝 コントリビューション

プルリクエストは歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

---

## 📞 サポート

質問や問題がある場合は、GitHubのissueを作成してください。
