# SimpleWord カスタムインストラクション（2025-10-25版）

**対象**: GitHub Copilot / AIアシスタント  
**プロジェクト**: SimpleWord v2.0  
**最終更新**: 2025-10-25

---

## プロジェクト概要

SimpleWordは、適応型学習アルゴリズムを搭載したiOS用単語学習アプリです。SwiftUIで構築され、Feature-First Architectureを採用しています。

### 技術スタック
- **言語**: Swift 5.9+
- **フレームワーク**: SwiftUI, Combine
- **最小対応OS**: iOS 15.0
- **アーキテクチャ**: Feature-First / Vertical Slice Architecture

---

## コーディング規約

### 基本ルール

1. **インデント**: スペース4つ
2. **命名**: 説明的な名前を使用し、型情報を明示
3. **コメント**: ファイル冒頭と重要なロジックに日本語コメントを追加
4. **View**: 各項目に内容が分かる日本語コメントを付与

### アーキテクチャ原則

1. **Feature-First**: 機能ごとに垂直方向でコード分割
2. **責務分離**: View、Store、Repository、Schedulerを明確に分離
3. **単一責任**: 各コンポーネントは1つの責務のみを持つ
4. **単一管理点**: 変更は単一の実装・単一路線・単一管理点に集約
5. **過度な抽象化を避ける**: 多段継承や過度なラッパーは使用しない

### 既存コードの尊重

- 既存の設計・コード・仕組み・パッケージを優先的に利用
- 目的達成に支障がない限り、書き換えや再発明を避ける
- 副作用は必要最小限に留める

### メンテナンス性

- 可能な限り短いセッションで完了できる構造
- テスタビリティを考慮した設計
- エラー修正や改修が容易な構造

---

## プロジェクト構造の理解

### 主要ディレクトリ

```
SimpleWord/
├── Features/              # 機能別モジュール
│   ├── Quiz/             # クイズ機能
│   │   ├── Views/        # UI層
│   │   └── WordManagement/
│   └── Study/            # 学習管理機能
│       ├── Domain/       # ドメインモデル
│       ├── Logic/        # ビジネスロジック
│       └── Data/         # データアクセス
├── Stores/               # 状態管理
├── Views/                # 共通画面
├── QuizComponents/       # クイズUI部品
├── Services/             # サービス層
├── Models/               # データモデル
└── Utils/                # ユーティリティ
```

### 主要コンポーネント

#### クイズ機能
- **QuizView.swift** (1100行): クイズのメイン画面
- **QuestionCardView.swift**: 問題カード表示
- **ChoiceCardView.swift**: 選択肢カード
- **QuizStatisticsView.swift**: 統計情報表示
- **MemoryProgressView.swift**: 記憶定着度進捗表示

#### 学習システム
- **AdaptiveScheduler.swift**: 適応型学習スケジューラ
- **MemoryStage.swift**: 記憶定着段階モデル（6段階）
- **StudyRecord.swift**: 学習履歴とSM-2アルゴリズム
- **LearningAnalytics.swift**: 学習傾向分析

#### データ管理
- **QuizSettings.swift**: 出題設定（UserDefaults）
- **ScoreStore.swift**: CSV別成績
- **WordScoreStore.swift**: 単語別成績
- **FileStudyProgressRepository.swift**: 学習進捗の永続化

---

## 重要な実装パターン

### 1. 記憶定着段階システム

```swift
enum MemoryStage: String, Codable {
    case unseen         // 未学習
    case initial        // 初回接触（1-2回）
    case shortTerm      // 短期記憶（3-5回）
    case midTerm        // 中期記憶（6-10回）
    case longTerm       // 長期記憶（11回以上）
    case mastered       // 習熟済み
}
```

### 2. 学習モード

```swift
enum LearningMode: String, Codable {
    case normal         // 通常モード
    case review         // 復習モード
    case remediation    // 補習モード
}
```

### 3. 適応型スケジューリング

```swift
// 使用例
let scheduler = AdaptiveScheduler()
scheduler.record(itemID: uuid, result: .correct, responseTime: 2.5)
let nextBatch = scheduler.scheduleNextBatch(itemIDs: candidates, count: 10)
```

### 4. 段階的機能有効化

QuizView.swiftには段階的に機能を有効化するためのデバッグフラグがあります：

```swift
private let enableMemoryTracking = false      // 記憶定着度追跡
private let enableAdaptiveScheduling = false  // 適応型スケジューリング
```

---

## 非推奨パターンの回避

### iOS 17以降で使用禁止

```swift
// ❌ 禁止
.onChange(of: value) { _ in }
.onChange(of: value) { newValue in }

// ✅ 正しい
.onChange(of: value) { }
.onChange(of: value) { oldValue, newValue in }
```

### その他の注意点

- Deployment TargetがiOS 15.0のため、`NavigationStack`はまだ使用不可
- `NavigationView`を使用すること

---

## ファイル編集時の注意事項

### 1. 編集前の確認

- `docs/COMPREHENSIVE_SPECIFICATION.md` - 包括的仕様書
- `.copilot/structure-map.md` - アーキテクチャマップ
- `.copilot/quick-ref.md` - 実装パターン集
- `SimpleWord/docs/仕様書/` - 機能別詳細仕様

### 2. 大規模ファイルの編集

QuizView.swift（1100行）などの大規模ファイルを編集する際：

1. 該当セクションのみを特定
2. 周辺コードを十分に理解
3. 既存のパターンを踏襲
4. コンポーネント分離を検討

### 3. エラーチェック

編集後は必ず以下を実行：

```bash
# SwiftLintでチェック
swiftlint

# ビルド確認
xcodebuild -project SimpleWord.xcodeproj -scheme SimpleWord \
  -destination 'platform=iOS Simulator,name=iPhone 15' build
```

### 4. 変更記録

`.copilot/changelog.md`に変更内容を記録すること。

---

## 典型的なタスクの実行手順

### 新しいUIコンポーネントの追加

1. `QuizComponents/`に新しいファイルを作成
2. 日本語コメントで目的を明記
3. `// 何を:` と `// なぜ:` を記述
4. プレビューを必ず実装
5. QuizView.swiftから参照

### 学習アルゴリズムの調整

1. `Features/Study/Logic/AdaptiveScheduler.swift`を編集
2. ロジックの変更理由を日本語コメントで説明
3. ユニットテストを更新
4. `ADAPTIVE_LEARNING_GUIDE.md`を更新

### 設定項目の追加

1. `QuizSettingsModel`にプロパティを追加
2. デコード/エンコードロジックを更新（後方互換性を維持）
3. `QuizSettingsView.swift`にUI要素を追加
4. デフォルト値を設定

---

## テスト戦略

### ユニットテスト

主要なビジネスロジックには必ずテストを追加：

- AdaptiveScheduler
- MemoryConsolidationTracker
- StudyRecord
- LearningAnalytics

### テストの実行

```bash
xcodebuild test -project SimpleWord.xcodeproj \
  -scheme SimpleWord \
  -destination 'platform=iOS Simulator,name=iPhone 15'
```

---

## ドキュメント更新の優先順位

変更を行った際は、以下のドキュメントを優先的に更新：

1. **高優先度**:
   - `.copilot/changelog.md` - 変更履歴
   - `docs/COMPREHENSIVE_SPECIFICATION.md` - 包括的仕様書
   - 該当する`SimpleWord/docs/仕様書/XX_仕様書.md`

2. **中優先度**:
   - `.copilot/quick-ref.md` - 実装パターン集
   - `.copilot/structure-map.md` - アーキテクチャマップ

3. **低優先度**:
   - `README.md` - プロジェクトREADME
   - `ADAPTIVE_LEARNING_GUIDE.md` - 適応型学習ガイド

---

## トラブルシューティング

### ビルドエラーが発生した場合

1. SwiftLintの警告を確認
2. 非推奨構文を使用していないか確認
3. `get_errors`ツールでエラー詳細を確認
4. 既存の類似実装を参照

### 動作が期待と異なる場合

1. デバッグフラグの状態を確認
2. ログ出力を追加して状態を確認
3. ユニットテストで該当ロジックを検証
4. 仕様書と照らし合わせて意図を確認

### ドキュメントが古い場合

1. `docs/COMPREHENSIVE_SPECIFICATION.md`が最新の正式仕様
2. 矛盾がある場合は実装を優先
3. ドキュメント更新を提案

---

## 参考資料

### 必読ドキュメント

- `docs/COMPREHENSIVE_SPECIFICATION.md` - **最重要**: 包括的仕様書
- `ADAPTIVE_LEARNING_GUIDE.md` - 適応型学習システムの詳細
- `DEPRECATION_GUIDE.md` - 非推奨構文対策
- `TEST_GUIDE.md` - テストガイド

### 機能別仕様書

- `SimpleWord/docs/仕様書/01_クイズ機能_仕様書.md`
- `SimpleWord/docs/仕様書/02_出題設定_仕様書.md`
- `SimpleWord/docs/仕様書/09_出題ロジック_仕様書.md`

### AI作業資料

- `.copilot/README.md` - AI作業ガイド
- `.copilot/structure-map.md` - アーキテクチャマップ
- `.copilot/quick-ref.md` - 実装パターン集
- `.copilot/changelog.md` - 変更履歴

---

## まとめ

このカスタムインストラクションに従うことで、プロジェクトの一貫性を保ちながら効率的に作業を進めることができます。

### 作業開始時のチェックリスト

- [ ] `docs/COMPREHENSIVE_SPECIFICATION.md`を確認
- [ ] `.copilot/changelog.md`で最近の変更を確認
- [ ] 該当する機能の仕様書を確認
- [ ] 既存のコードパターンを理解
- [ ] 非推奨構文リストを確認

### 作業完了時のチェックリスト

- [ ] SwiftLintでチェック
- [ ] ビルドが通ることを確認
- [ ] 該当するテストを実行
- [ ] `.copilot/changelog.md`に変更を記録
- [ ] 必要に応じて仕様書を更新

---

**最終更新**: 2025-10-25  
**バージョン**: 2.0
