# SimpleWord 変更履歴

このファイルは、SimpleWordアプリの主要な変更を記録します。

---

## [2025-10-27] CSVヘッダ更新対応

### 変更内容
CSVファイルのヘッダを手動修正したことに伴い、関連するコードとドキュメントを更新しました。

### 修正されたCSVヘッダ

#### 中学英会話.csv
```
語句,発音（カタカナ）,和訳,語源等解説（日本語）,関連語（英語）と意味（日本語）,関連分野（日本語）,難易度
```

#### 中学古典単語.csv
```
語句,読み（ひらがな）,意味,語源等解説（日本語）,関連語と意味,関連分野,難易度
```

### 更新ファイル
- `Common/Data/Schema/QuestionItemCSVSchema.swift` - ヘッダ候補に新しい列名を追加
- `Common/Data/DataSource/CSVDataSource.swift` - ヘッダ検出トークンを更新
- `SimpleWord/Utils/CSVLoader.swift` - ヘッダ検出トークンを更新
- `SimpleWord/Features/Quiz/Views/QuizView.swift` - ヘッダマッピングロジックを更新
- `SimpleWord/QuizComponents/ChoiceCardView.swift` - 発音表示機能を追加
- `SimpleWord/docs/仕様書/03_問題集管理_CSV_仕様書.md` - CSVヘッダ仕様を追記
- `docs/COMPREHENSIVE_SPECIFICATION.md` - QuestionItemモデルにCSV仕様を追記

### 新機能
**回答後の選択肢カードで発音表示**
- CSVの2列目が「発音（カタカナ）」の場合、語句の後ろに発音を表示
- 表示例: `Hello! (ハロー)`
- 「読み（ひらがな）」などの場合は、従来通り独立した行として表示

### ドキュメント
新規作成: `CSV_HEADER_UPDATE_REPORT_20251027.md` - 今回の変更の詳細レポート

---

## [2025-10-27] QuizView出題不具合修正

### 問題
- QuizViewでCSVを読み込んでも問題が出題されない不具合

### 原因
1. `CSVLoader.load(from:)` がURL引数を無視し、常にBundleから読み込んでいた
2. セッション復元時に `batchSize` が0の場合、バッチ準備が空になり即終了
3. `repeatCount` が0の場合、出題プールが空になり即完了

### 修正内容
- `CSVLoader.swift` - URL指定時に実ファイルを直接読み込むように修正
- `QuizSessionStore.swift` - `batchSize` を最小1にクランプ
- `QuizView.swift` - `repeatCount` を最小1にクランプ（既存実装）
- `LegacyCSVLoaderAdapter.swift` - エラー型の互換性修正

### 仕様
- 列数は7列固定を維持
- 先頭行のヘッダはスキップ（ラベル表示用に別途読み込み）
- Documents配下のCSVも正しく読み込まれるように改善

### ドキュメント
作成済み: 関連する修正内容は各ファイルのコメントに記載

---

## [2025-10-25] 適応型学習システム導入

### 追加機能
- 6段階の記憶定着度管理（未学習→習熟済み）
- SM-2アルゴリズムベースの出題間隔調整
- 学習モード（通常/復習/補習）の導入
- 記憶定着度の可視化

### 新規ファイル
- `Features/Study/Domain/MemoryStage.swift`
- `Features/Study/Domain/StudyRecord.swift`
- `Features/Study/Logic/AdaptiveScheduler.swift`
- `Features/Study/Logic/MemoryConsolidationTracker.swift`

### 更新ファイル
- `QuizView.swift` - 適応型学習システムの統合
- `QuizSettings.swift` - 学習モードの追加

---

## [2025-10-23] Feature-First Architecture への移行

### アーキテクチャ変更
従来のレイヤー分離型から Feature-First / Vertical Slice Architecture へ移行

### 主な変更
- `Features/` ディレクトリの新設
- 機能ごとのディレクトリ構成（Quiz, Study, etc.）
- 各機能内で Views, Logic, Domain を垂直統合

### メリット
- 機能追加・修正時の影響範囲が明確化
- テストの容易性向上
- コードの可読性向上

---

## [2025-10-19] CSV管理機能の実装

### 追加機能
- CSV一覧表示（Bundle + Documents統合）
- Documents内CSVの削除機能
- CSV情報の確認（問題数、分野、難易度）

### 新規ファイル
- `Views/CSVManagerView.swift`
- `Utils/FileUtils.swift`

---

## [2025-10-15] 単語別成績管理の実装

### 追加機能
- 単語ごとの詳細な学習履歴
- 正答率、出題回数、連続正解数の記録
- CSV別の成績管理

### 新規ファイル
- `Stores/WordScoreStore.swift`
- `Models/WordScore.swift`

### 更新ファイル
- `QuizView.swift` - 成績記録ロジックの追加

---

## [2025-10-10] プロジェクト開始

### 初期実装
- 基本的なクイズ機能（4択）
- CSV読み込み機能
- 出題設定画面
- 成績表示画面

### 初期ファイル構成
```
SimpleWord/
├── Views/
│   ├── QuizView.swift
│   ├── QuizSettingsView.swift
│   └── ScoreView.swift
├── Models/
│   └── QuestionItem.swift
├── Stores/
│   ├── CurrentCSV.swift
│   ├── QuizSettings.swift
│   └── ScoreStore.swift
└── Utils/
    └── CSVLoader.swift
```

---

## 今後の予定

### 短期
- [ ] インポート/エクスポート機能の実装
- [ ] CSV編集機能の改善
- [ ] エラーハンドリングの強化

### 中期
- [ ] 音声読み上げ機能
- [ ] タイマー機能の有効化
- [ ] 統計グラフの追加

### 長期
- [ ] iCloud同期
- [ ] 複数デバイス間の学習進捗共有
- [ ] AI による出題最適化

---

## 破壊的変更

### [2025-10-23] QuizSettings の構造変更
- `isLearningMode: Bool` → `learningMode: LearningMode`（enum）
- CSV別設定の保存形式変更（UserDefaults キー変更）
- 旧バージョンからの自動マイグレーション実装済み

### [2025-10-19] WordScoreStore の保存形式変更
- 単一の辞書 → CSV別辞書へ変更
- UserDefaults キー: `v1` → `v2`
- 旧データは `_migrated` キーで保持
