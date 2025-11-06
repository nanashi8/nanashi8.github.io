# SimpleWord - 適応型学習システム搭載の単語学習アプリ

**バージョン**: 2.0  
**最終更新**: 2025-10-25  
**対応OS**: iOS 15.0以降

---

## 📖 プロジェクト概要

SimpleWordは、脳科学と記憶理論に基づく**適応型学習アルゴリズム**を搭載した、効率的な単語学習を実現するiOSアプリケーションです。

### 主な特徴

- ✅ **適応型学習**: ユーザーの習熟度に応じて最適な出題順序を自動決定
- ✅ **記憶定着段階管理**: 6段階の記憶レベル（未学習→習熟済み）で進捗を可視化
- ✅ **バッチ学習**: 効率的な短期集中学習を実現
- ✅ **詳細な成績管理**: CSV別・単語別の成績を記録
- ✅ **柔軟なカスタマイズ**: 分野・難易度・学習モードでフィルタリング
- ✅ **CSV管理**: 単語リストのインポート・エクスポート・編集

---

## 🚀 クイックスタート

### 必要な環境

- **macOS**: Ventura (13.0) 以降
- **Xcode**: 15.0 以降
- **iOS**: 15.0 以降（実機またはシミュレータ）

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/your-username/SimpleWord.git
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

### 1. クイズ機能

4択形式で単語を学習します。

**特徴**:
- 適応型出題で効率的に学習
- 記憶定着度の可視化
- 回答後の詳細な解説表示
- 前へ/次へボタンで自由に移動
- 光るアニメーションで進捗を実感

### 2. 適応型学習システム

**記憶定着段階**（6段階）:
1. 未学習
2. 初回接触（1-2回）
3. 短期記憶（3-5回、30秒-5分間隔）
4. 中期記憶（6-10回、1時間-1日間隔）
5. 長期記憶（11回以上、1日以上間隔）
6. 習熟済み

**学習モード**:
- **通常モード**: バランス型の学習
- **復習モード**: 短期・中期記憶を重点復習
- **補習モード**: 苦手な単語を集中学習

### 3. 成績管理

**CSV別成績**:
- ファイルごとの学習履歴
- 正答率、出題数、正解数
- 時系列での成績推移

**単語別成績**:
- 個別単語の詳細統計
- 正答率、出題回数、連続正解数
- ソート・フィルタ機能

### 4. CSV管理

- CSV一覧表示
- インポート・エクスポート
- アプリ内編集
- プレビュー機能

#### CSVフォーマット仕様（2025-10-27更新）

**列数**: 7列固定  
**ヘッダ行**: 必須（1行目）

**中学英会話.csv**:
```
語句,発音（カタカナ）,和訳,語源等解説（日本語）,関連語（英語）と意味（日本語）,関連分野（日本語）,難易度
```

**中学古典単語.csv**:
```
語句,読み（ひらがな）,意味,語源等解説（日本語）,関連語と意味,関連分野,難易度
```

**特徴**:
- 列数は7列固定（拡張性よりシンプルさを重視）
- ヘッダ行は必須（データとの区別のため）
- セミコロン（;）で複数値を区切り（関連語、関連分野）
- 2列目が「発音（カタカナ）」の場合、回答後に語句の後ろに発音を表示

---

## 📝 最近の更新

### 2025-10-27
- **CSVヘッダ更新**: より明確で理解しやすいヘッダ名に変更
- **発音表示機能**: 回答後の選択肢カードで語句に発音を括弧付きで表示
- **QuizView出題不具合修正**: Documents内のCSVも正しく読み込まれるように改善

### 2025-10-25
- **適応型学習システム導入**: 6段階の記憶定着度管理を実装
- **学習モード追加**: 通常/復習/補習の3モードに対応

### 2025-10-23
- **アーキテクチャ移行**: Feature-First Architectureへ全面移行
- **コード整理**: 機能ごとのディレクトリ構成に再編

詳細は[CHANGELOG.md](CHANGELOG.md)を参照。

---

## 🏗️ アーキテクチャ

### 設計原則

**Feature-First / Vertical Slice Architecture**を採用し、機能ごとに垂直方向でコードを分割しています。

```
SimpleWord/
├── Features/              # 機能別モジュール
│   ├── Quiz/             # クイズ機能
│   │   └── Views/        # UI層
│   └── Study/            # 学習管理機能
│       ├── Domain/       # ドメインモデル
│       ├── Logic/        # ビジネスロジック
│       └── Data/         # データアクセス
├── Stores/               # 状態管理
├── Views/                # 共通画面
├── QuizComponents/       # クイズUI部品
├── Services/             # サービス層
└── Utils/                # ユーティリティ
```

### 主要コンポーネント

| コンポーネント | 責務 | 場所 |
|---|---|---|
| QuizView | クイズ画面本体 | Features/Quiz/Views/ |
| AdaptiveScheduler | 適応型学習スケジューラ | Features/Study/Logic/ |
| MemoryStage | 記憶段階モデル | Features/Study/Domain/ |
| StudyRecord | 学習履歴とSM-2アルゴリズム | Features/Study/Domain/ |
| QuizSettings | 出題設定の管理 | Stores/ |
| WordScoreStore | 単語別成績の管理 | Stores/ |

---

## 📖 ドキュメント

### 主要ドキュメント

| ドキュメント | 内容 | 対象者 |
|---|---|---|
| [包括的仕様書](docs/COMPREHENSIVE_SPECIFICATION.md) | **最重要**: 全機能の詳細仕様 | 全員 |
| [カスタムインストラクション](docs/CUSTOM_INSTRUCTIONS.md) | コーディング規約とガイドライン | 開発者 |
| [プロンプトテンプレート](docs/PROMPT_TEMPLATES.md) | AI活用のためのテンプレート集 | AI利用者 |
| [ドキュメントインデックス](docs/DOCUMENT_INDEX.md) | 全ドキュメントの索引 | 全員 |
| [適応型学習ガイド](ADAPTIVE_LEARNING_GUIDE.md) | 学習アルゴリズムの詳細 | アルゴリズム担当 |
| [非推奨構文対策](DEPRECATION_GUIDE.md) | iOS更新への対応 | 開発者 |
| [テストガイド](TEST_GUIDE.md) | テスト戦略とガイドライン | テスト担当 |

### 機能別仕様書

`SimpleWord/docs/仕様書/`に以下の詳細仕様書があります：

- 00_編集ガイド.md
- 01_クイズ機能_仕様書.md
- 02_出題設定_仕様書.md
- 03_問題集管理_CSV_仕様書.md
- 04_ナビゲーター機能_仕様書.md
- 05_成績表示_仕様書.md
- 06_IDマップ管理_仕様書.md
- 07_CSV編集_仕様書.md
- 08_外観_仕様書.md
- 09_出題ロジック_仕様書.md

---

## 🛠️ 開発

### 開発環境のセットアップ

```bash
# SwiftLintのインストール（推奨）
brew install swiftlint

# プロジェクトルートで実行
cd SimpleWord
swiftlint
```

### コーディング規約

- インデント: スペース4つ
- 命名: 説明的な名前を使用
- コメント: 日本語で意図を明記
- Feature-First Architectureを遵守
- 非推奨構文を使用しない

詳細は[カスタムインストラクション](docs/CUSTOM_INSTRUCTIONS.md)を参照。

### ビルド

```bash
# シミュレータでビルド
xcodebuild -project SimpleWord.xcodeproj \
  -scheme SimpleWord \
  -destination 'platform=iOS Simulator,name=iPhone 15' \
  build

# テスト実行
xcodebuild test -project SimpleWord.xcodeproj \
  -scheme SimpleWord \
  -destination 'platform=iOS Simulator,name=iPhone 15'
```

### ブランチ戦略

- `main`: 安定版
- `feature/*`: 新機能開発
- `fix/*`: バグ修正
- `refactor/*`: リファクタリング

---

## 🧪 テスト

### ユニットテスト

主要なビジネスロジックにはユニットテストを実装しています。

```bash
# すべてのテストを実行
xcodebuild test -project SimpleWord.xcodeproj \
  -scheme SimpleWord \
  -destination 'platform=iOS Simulator,name=iPhone 15'

# 特定のテストクラスを実行
xcodebuild test -project SimpleWord.xcodeproj \
  -scheme SimpleWord \
  -only-testing:SimpleWordTests/AdaptiveSchedulerTests
```

### UIテスト

主要な画面遷移とユーザー操作をテストしています。

```bash
xcodebuild test -project SimpleWord.xcodeproj \
  -scheme SimpleWord \
  -only-testing:SimpleWordUITests
```

### カバレッジ目標

- ビジネスロジック: 80%以上
- UI層: 50%以上

---

## 📦 依存関係

このプロジェクトは外部ライブラリを使用していません。SwiftUIとCombineのみで実装されています。

---

## 🔄 バージョニング

### 現在のバージョン: 2.0（2025-10-25）

**主な変更点**:
- 適応型学習システムの実装
- 記憶定着段階管理の追加
- UIコンポーネントの分離
- 包括的ドキュメントの整備

### バージョン履歴

`.copilot/changelog.md`を参照してください。

---

## 🤝 貢献

### 貢献の流れ

1. Issueを作成して問題を報告
2. フォークしてブランチを作成
3. 変更を実装
4. テストを追加・実行
5. プルリクエストを作成

### コードレビュー基準

- コーディング規約への準拠
- テストの追加
- ドキュメントの更新
- 非推奨構文の不使用

---

## 📄 ライセンス

このプロジェクトは[MITライセンス](LICENSE)の下で公開されています。

---

## 👥 作成者

**GitHub Copilot** - AI開発アシスタント

---

## 🙏 謝辞

このプロジェクトは以下の理論と技術に基づいています：

- **SuperMemo 2 (SM-2)**: 間隔反復アルゴリズム
- **エビングハウスの忘却曲線**: 記憶定着理論
- **SwiftUI**: Appleのモダンなフレームワーク
- **Feature-First Architecture**: 保守性の高いアーキテクチャ

---

## 📞 サポート

### 問題が発生した場合

1. [包括的仕様書](docs/COMPREHENSIVE_SPECIFICATION.md)を確認
2. [トラブルシューティング](docs/CUSTOM_INSTRUCTIONS.md#トラブルシューティング)を確認
3. Issueを作成して報告

### よくある質問

**Q: CSVファイルのフォーマットは？**

A: 以下の列を含むUTF-8エンコードのCSVファイルです：

```csv
語句,読み（ひらがな）,意味,語源等解説（日本語）,関連語と意味,関連分野,難易度
```

または英会話など発音を含む場合:

```csv
語句,発音（カタカナ）,和訳,語源等解説（日本語）,関連語（英語）と意味（日本語）,関連分野（日本語）,難易度
```

**Q: 適応型学習を無効化できますか？**

A: `QuizView.swift`の以下のデバッグフラグで制御できます：

```swift
private let enableMemoryTracking = false
private let enableAdaptiveScheduling = false
```

**Q: データはどこに保存されますか？**

A: 以下の場所に保存されます：

- 設定: UserDefaults
- CSV: Documents ディレクトリ
- 学習履歴: Documents/StudyProgress/
- 成績: Documents/Scores/, Documents/WordScores/

---

## 🗺️ ロードマップ

### v2.1（予定）

- [ ] 学習グラフの可視化
- [ ] 達成バッジシステム
- [ ] 学習リマインダー
- [ ] iCloud同期

### v3.0（予定）

- [ ] Apple Watch対応
- [ ] ウィジェット対応
- [ ] 音声入力による回答
- [ ] グループ学習機能

---

## 📊 統計情報

- **総行数**: 約15,000行（Swift）
- **主要ファイル**: QuizView.swift（1,100行）
- **コンポーネント数**: 50+
- **CSV例**: 10ファイル（約5,000単語）

---

**最終更新**: 2025-10-25  
**バージョン**: 2.0  
**ステータス**: ✅ 安定版
