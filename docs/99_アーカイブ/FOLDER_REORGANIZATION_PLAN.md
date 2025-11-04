# SimpleWord フォルダ構成整理計画書

**作成日**: 2025年10月29日  
**目的**: Feature-First / Vertical Slice Architecture に沿った明確なフォルダ構成の確立

---

## 📋 整理方針

### 基本原則
1. **Feature-First**: 各機能は `Features/` 配下に独立して配置
2. **Vertical Slice**: 各 Feature は View/ViewModel/Model/Services/Components を内包
3. **共通要素の明確化**: 複数 Feature で共有されるものは `Common/` に配置
4. **不要ファイルの削除**: `_DELETED` サフィックスやバックアップファイルの整理

---

## 🎯 理想的なフォルダ構成

```
SimpleWord/
├── SimpleWord/                          # メインアプリケーション
│   ├── SimpleWordApp.swift            # アプリエントリーポイント
│   ├── ContentView.swift              # ルートビュー
│   │
│   ├── Config/                         # アプリ設定ファイル
│   │   ├── Info.plist
│   │   └── SimpleWord.entitlements
│   │
│   ├── Features/                       # 機能別フォルダ
│   │   ├── Quiz/                      # クイズ機能
│   │   │   ├── QuizView.swift
│   │   │   ├── ViewModels/
│   │   │   │   ├── QuizSessionStore.swift
│   │   │   │   ├── ScoreStore.swift
│   │   │   │   └── WordScoreStore.swift
│   │   │   ├── Models/
│   │   │   │   ├── QuizModels.swift
│   │   │   │   ├── QuizViewState.swift
│   │   │   │   └── QuizChoice.swift
│   │   │   ├── Services/
│   │   │   │   ├── QuizDataLoader.swift
│   │   │   │   ├── QuizQuestionGenerator.swift
│   │   │   │   ├── QuizAnswerHandler.swift
│   │   │   │   ├── QuizBatchManager.swift
│   │   │   │   └── CSVHeaderParser.swift
│   │   │   └── Components/
│   │   │       ├── QuizContentView.swift
│   │   │       ├── QuizLoadingView.swift
│   │   │       ├── QuizErrorView.swift
│   │   │       ├── QuizEmptyView.swift
│   │   │       ├── QuizNavigationButtonsView.swift
│   │   │       ├── QuizStatisticsView.swift
│   │   │       ├── QuestionCardView.swift
│   │   │       ├── DontKnowCardView.swift
│   │   │       └── ChoiceCardView.swift
│   │   │
│   │   ├── QuizSettings/              # クイズ設定機能
│   │   │   ├── QuizSettingsView.swift
│   │   │   ├── ViewModels/
│   │   │   │   └── QuizSettingsStore.swift
│   │   │   ├── Models/
│   │   │   │   ├── QuizSettings.swift
│   │   │   │   ├── QuizSettingsModel.swift
│   │   │   │   ├── PerCSVSettings.swift
│   │   │   │   └── LearningMode.swift
│   │   │   ├── Services/
│   │   │   │   └── QuizSettingsFilterService.swift
│   │   │   └── Components/
│   │   │       ├── CSVSelectionView.swift
│   │   │       ├── FieldFilterView.swift
│   │   │       ├── DifficultyFilterView.swift
│   │   │       ├── QuizParametersView.swift
│   │   │       ├── AppearanceSettingsView.swift
│   │   │       ├── CurrentSettingsSummaryView.swift
│   │   │       └── NoFieldsWarningView.swift
│   │   │
│   │   ├── Results/                   # 結果表示機能
│   │   │   ├── Views/
│   │   │   │   ├── QuizResultsByCSVView.swift
│   │   │   │   ├── QuizResultsDetailView.swift
│   │   │   │   ├── ScoreView.swift
│   │   │   │   └── WordScoresView.swift
│   │   │   └── Components/
│   │   │       └── LearningModeRecommendationView.swift
│   │   │
│   │   ├── ChoiceCard/                # 選択肢カード機能
│   │   │   ├── Components/
│   │   │   │   ├── ClassicalDetailsView.swift
│   │   │   │   ├── EnglishDetailsView.swift
│   │   │   │   └── HistoryDetailsView.swift
│   │   │   └── Services/
│   │   │       └── CSVTypeDetector.swift
│   │   │
│   │   ├── CSVEditor/                 # CSV編集機能
│   │   │   └── Views/
│   │   │       ├── CSVEditorView.swift
│   │   │       ├── CSVManagerView.swift
│   │   │       ├── CSVItemEditView.swift
│   │   │       └── CSVItemListEditorView.swift
│   │   │
│   │   ├── IDMap/                     # ID管理機能
│   │   │   └── Views/
│   │   │       └── IDMapAdminView.swift
│   │   │
│   │   ├── Navigator/                 # ナビゲーション機能
│   │   │   └── NavigatorView.swift
│   │   │
│   │   ├── WordList/                  # 単語リスト機能
│   │   │   └── Views/
│   │   │       └── QuestionDetailView.swift
│   │   │
│   │   └── Filters/                   # フィルタ機能
│   │       └── Views/
│   │           └── FilterEditorView.swift
│   │
│   ├── CoreData/                       # CoreData定義
│   │   └── SimpleWord.xcdatamodeld/
│   │
│   ├── Persistence/                    # 永続化層
│   │   └── Persistence.swift
│   │
│   ├── Services/                       # アプリ全体で使うサービス
│   │   └── CoreDataIDs/
│   │       ├── CoreDataStack.swift
│   │       ├── CoreDataWordIDProvider.swift
│   │       ├── WordIdMap.swift
│   │       ├── WordKeyBuilder.swift
│   │       └── IDMapMaintenance.swift
│   │
│   ├── Stores/                         # グローバルストア
│   │   └── CurrentCSV.swift
│   │
│   ├── Utils/                          # アプリ固有のユーティリティ
│   │   ├── CSVLoader.swift
│   │   ├── CSVDocument.swift
│   │   └── CSVIDEnsurer.swift
│   │
│   └── Resources/                      # アプリリソース
│       ├── Assets.xcassets/
│       ├── 中学古典単語.csv
│       ├── 中学歴史.csv
│       ├── 中学英会話.csv
│       ├── 中学英単語.csv
│       └── 中学英熟語.csv
│
├── Common/                              # 共通モジュール
│   ├── Models/                         # 共通データモデル
│   │   ├── QuestionItem.swift
│   │   └── WordScore.swift
│   │
│   ├── Data/                           # データアクセス層
│   │   ├── DataSource/
│   │   │   ├── DataSourceProtocol.swift
│   │   │   ├── DataSourceFactory.swift
│   │   │   ├── CSVDataSource.swift
│   │   │   └── CSVQuestionLoader.swift
│   │   ├── Repository/
│   │   │   ├── RepositoryProtocol.swift
│   │   │   └── QuestionItemRepository.swift
│   │   ├── Parser/
│   │   │   ├── Parser.swift
│   │   │   └── QuestionItemParser.swift
│   │   ├── Schema/
│   │   │   └── QuestionItemCSVSchema.swift
│   │   └── Legacy/
│   │       ├── LegacyCSVLoaderAdapter.swift
│   │       └── LegacyCSVQuestionLoaderAdapter.swift
│   │
│   ├── Utility/                        # 共通ユーティリティ
│   │   ├── Logger.swift
│   │   ├── FileUtils.swift
│   │   ├── FileWatcher.swift
│   │   └── IDFactory.swift
│   │
│   └── Extensions/                     # 共通拡張
│       └── Result+Extensions.swift
│
├── Appearance/                          # アピアランス設定
│   ├── Appearance.swift
│   └── StyleGuide.swift
│
├── Resources/                           # プロジェクト全体のリソース
│   └── (CSVのバックアップファイルを整理後に配置)
│
├── Tools/                               # 開発ツール・スクリプト
│   ├── check_csv_loader.swift
│   ├── validate_csvs.swift
│   ├── generate_csvs.swift
│   ├── fill_csv_ids.swift
│   ├── expand_csvs.swift
│   ├── convert_related_fields.swift
│   └── dedup_and_fill_csvs.swift
│
├── SimpleWordTests/                     # ユニットテスト
│   ├── SimpleWordTests.swift
│   ├── LearningModeTests.swift
│   └── AdaptiveSchedulerTests.swift
│
├── SimpleWordUITests/                   # UIテスト
│   ├── SimpleWordUITests.swift
│   └── SimpleWordUITestsLaunchTests.swift
│
├── docs/                                # プロジェクトドキュメント
│   ├── COMPREHENSIVE_SPECIFICATION.md
│   ├── ERROR_RESOLUTION_PROTOCOL.md
│   ├── CUSTOM_INSTRUCTIONS.md
│   ├── PROMPT_TEMPLATES.md
│   ├── DOCUMENT_INDEX.md
│   └── (その他のドキュメント)
│
├── changes/                             # 変更履歴・レポート
│   └── (各種変更レポートファイル)
│
├── .github/                             # GitHub設定
│   └── copilot-instructions.md
│
├── README.md
├── CHANGELOG.md
└── (その他のルートレベルドキュメント)
```

---

## 📝 具体的な整理作業手順

### ステップ1: 不要ファイルの削除

以下のファイルを削除してください:

#### A. バックアップ・削除済みマークファイル
```
削除対象:
□ SimpleWord/Stores/QuizSettingsStore_DELETED.swift
□ SimpleWord/Persistence/PERSISTENCE_DELETED.txt
□ SimpleWordTests/LearningModeTests_DELETED.swift
□ SimpleWordTests/AdaptiveSchedulerTests_DELETED.swift
```

#### B. CSVバックアップファイル
```
Resources/ 配下の以下のファイルを削除:
□ 中学古典単語.csv.augment.bak
□ 中学古典単語.csv.bak
□ 中学古典単語.csv.bak.20251012195420
□ 中学古典単語.csv.bak.20251017
□ 中学古典単語.csv.canonical.bak
□ 中学古典単語.csv.enforce20.bak
□ 中学古典単語.csv.single.bak
□ 中学英会話.bak.csv
□ 中学英会話.bak.csv.augment.bak
□ 中学英会話.bak.csv.canonical.bak
□ 中学英会話.bak.csv.enforce20.bak
□ 中学英会話.bak.csv.single.bak
□ 中学英会話.csv.augment.bak
□ 中学英会話.csv.bak.20251012195420
□ 中学英会話.csv.canonical.bak
□ 中学英会話.csv.enforce20.bak
□ 中学英会話.csv.single.bak
□ 中学英会話.template.csv

SimpleWord/Resources/ 配下の以下のファイルを削除:
□ xcode.csv
□ fix_csv.py
□ 中学英単語.csv.backup.20251028110810
```

#### C. 重複ツールファイル
```
SimpleWord/Tools/ 配下の以下のファイルを削除:
□ fix_chu_english_conv.py
```

---

### ステップ2: 空フォルダの削除

以下の空フォルダを削除してください:

```
削除対象:
□ SimpleWord/Models/
□ SimpleWord/QuizComponents/
□ SimpleWord/Features/Components/
□ SimpleWord/Features/Study/
□ SimpleWord/Features/Navigator/
□ SimpleWord/Features/IDMap/Views/
□ SimpleWord/Features/IDMap/Services/
□ SimpleWord/Features/Quiz/Services/
□ SimpleWord/Features/Quiz/WordManagement/Views/
□ SimpleWord/Features/Quiz/WordManagement/Models/
□ SimpleWord/Features/QuizSettings/Services/ (1ファイルあるので移動後削除)
□ SimpleWord/Features/CSVEditor/ViewModels/
□ SimpleWord/Features/Results/ViewModels/
□ SimpleWord/Features/Results/Views/
□ SimpleWord/Features/WordList/Components/
```

---

### ステップ3: ファイルの移動

#### 3.1 Quiz Feature 内の整理

**移動元 → 移動先**

```
[Services の統合]
□ SimpleWord/Features/Quiz/Views/Services/QuizDataLoader.swift
  → SimpleWord/Features/Quiz/Services/QuizDataLoader.swift

□ SimpleWord/Features/Quiz/Views/Services/QuizQuestionGenerator.swift
  → SimpleWord/Features/Quiz/Services/QuizQuestionGenerator.swift

□ SimpleWord/Features/Quiz/Views/Services/QuizAnswerHandler.swift
  → SimpleWord/Features/Quiz/Services/QuizAnswerHandler.swift

□ SimpleWord/Features/Quiz/Views/Services/QuizBatchManager.swift
  → SimpleWord/Features/Quiz/Services/QuizBatchManager.swift

□ SimpleWord/Features/Quiz/Views/Services/CSVHeaderParser.swift
  → SimpleWord/Features/Quiz/Services/CSVHeaderParser.swift

[Models の統合]
□ SimpleWord/Features/Quiz/Views/Models/QuizChoice.swift
  → SimpleWord/Features/Quiz/Models/QuizChoice.swift

[Components の統合]
□ SimpleWord/Features/Quiz/Views/Components/QuizContentView.swift
  → SimpleWord/Features/Quiz/Components/QuizContentView.swift

□ SimpleWord/Features/Quiz/Views/Components/QuizLoadingView.swift
  → SimpleWord/Features/Quiz/Components/QuizLoadingView.swift

□ SimpleWord/Features/Quiz/Views/Components/QuizErrorView.swift
  → SimpleWord/Features/Quiz/Components/QuizErrorView.swift

□ SimpleWord/Features/Quiz/Views/Components/QuizEmptyView.swift
  → SimpleWord/Features/Quiz/Components/QuizEmptyView.swift

□ SimpleWord/Features/Quiz/Views/Components/QuizNavigationButtonsView.swift
  → SimpleWord/Features/Quiz/Components/QuizNavigationButtonsView.swift

□ SimpleWord/Features/Quiz/Views/Components/QuizStatisticsView.swift
  → SimpleWord/Features/Quiz/Components/QuizStatisticsView.swift

□ SimpleWord/Features/Quiz/Views/Components/QuestionCardView.swift
  → SimpleWord/Features/Quiz/Components/QuestionCardView.swift

□ SimpleWord/Features/Quiz/Views/Components/DontKnowCardView.swift
  → SimpleWord/Features/Quiz/Components/DontKnowCardView.swift

□ SimpleWord/Views/Components/Cards/ChoiceCardView.swift
  → SimpleWord/Features/Quiz/Components/ChoiceCardView.swift

[Views の整理]
□ SimpleWord/Features/Quiz/Views/QuizView.swift
  → SimpleWord/Features/Quiz/QuizView.swift (Featureルートに配置)

□ SimpleWord/Features/Quiz/Views/QuizResultsByCSVView.swift
  → SimpleWord/Features/Results/Views/QuizResultsByCSVView.swift

□ SimpleWord/Features/Quiz/Views/QuizResultsDetailView.swift
  → SimpleWord/Features/Results/Views/QuizResultsDetailView.swift

□ SimpleWord/Features/Quiz/Views/LearningModeRecommendationView.swift
  → SimpleWord/Features/Results/Components/LearningModeRecommendationView.swift

□ SimpleWord/Features/Quiz/Views/FlowLayout.swift
  → SimpleWord/Features/Results/Components/FlowLayout.swift
```

#### 3.2 QuizSettings Feature の整理

```
[Services の配置修正]
□ SimpleWord/Features/QuizSettings/Services/QuizSettingsFilterService.swift
  → SimpleWord/Features/QuizSettings/Services/QuizSettingsFilterService.swift
  (既に正しい場所にあるので確認のみ)

[Views の整理]
□ SimpleWord/Features/QuizSettings/Views/QuizSettingsView.swift
  → SimpleWord/Features/QuizSettings/QuizSettingsView.swift (Featureルートに配置)
```

#### 3.3 Results Feature の作成と整理

**新規フォルダ作成**:
- `SimpleWord/Features/Results/`
- `SimpleWord/Features/Results/Views/`
- `SimpleWord/Features/Results/Components/`

```
[Views の移動]
□ SimpleWord/Views/ScoreView.swift
  → SimpleWord/Features/Results/Views/ScoreView.swift

□ SimpleWord/Views/WordScoresView.swift
  → SimpleWord/Features/Results/Views/WordScoresView.swift
```

#### 3.4 CSVEditor Feature の整理

```
[Views の移動]
□ SimpleWord/Views/CSVEditorView.swift
  → SimpleWord/Features/CSVEditor/Views/CSVEditorView.swift

□ SimpleWord/Views/CSVManagerView.swift
  → SimpleWord/Features/CSVEditor/Views/CSVManagerView.swift

□ SimpleWord/Views/CSVItemEditView.swift
  → SimpleWord/Features/CSVEditor/Views/CSVItemEditView.swift

□ SimpleWord/Views/CSVItemListEditorView.swift
  → SimpleWord/Features/CSVEditor/Views/CSVItemListEditorView.swift
```

#### 3.5 IDMap Feature の整理

```
[Views の移動]
□ SimpleWord/Views/IDMapAdminView.swift
  → SimpleWord/Features/IDMap/Views/IDMapAdminView.swift
```

#### 3.6 Navigator Feature の整理

```
[Views の移動]
□ SimpleWord/Views/NavigatorView.swift
  → SimpleWord/Features/Navigator/NavigatorView.swift (Featureルートに配置)
```

#### 3.7 WordList Feature の整理

```
[Views の移動]
□ SimpleWord/Views/QuestionDetailView.swift
  → SimpleWord/Features/WordList/Views/QuestionDetailView.swift
```

#### 3.8 Filters Feature の作成

**新規フォルダ作成**:
- `SimpleWord/Features/Filters/`
- `SimpleWord/Features/Filters/Views/`

```
[Views の移動]
□ SimpleWord/Views/FilterEditorView.swift
  → SimpleWord/Features/Filters/Views/FilterEditorView.swift
```

#### 3.9 Common/Data の整理

```
[フォルダ名の修正]
□ Common/Data/Parcer/
  → Common/Data/Parser/ にリネーム
```

---

### ステップ4: 移動後の空フォルダ削除

以下のフォルダが空になっていることを確認して削除:

```
削除対象:
□ SimpleWord/Views/Components/Cards/
□ SimpleWord/Views/Components/
□ SimpleWord/Views/
□ SimpleWord/Features/Quiz/Views/Components/
□ SimpleWord/Features/Quiz/Views/Models/
□ SimpleWord/Features/Quiz/Views/Services/
□ SimpleWord/Features/Quiz/Views/
□ SimpleWord/Features/Quiz/WordManagement/
□ SimpleWord/Features/QuizSettings/Views/
```

---

### ステップ5: ドキュメントの整理

#### 5.1 docs フォルダへの統合

```
[ルートから docs/ への移動]
□ 99_ファイル索引_更新メモ.md → docs/
□ ADAPTIVE_LEARNING_GUIDE.md → docs/
□ AI_COMMUNICATION_DOCS_COMPLETION.md → docs/
□ CHOICE_CARD_DISPLAY_FIX_REPORT.md → docs/
□ CHOICE_CARD_DISPLAY_ORDER_FIX_FINAL.md → docs/
□ CHOICE_CARD_DISPLAY_ORDER_FIX_REPORT.md → docs/
□ CSV_HEADER_DRIVEN_IMPLEMENTATION_REPORT.md → docs/
□ CSV_HEADER_DRIVEN_MIGRATION_REPORT.md → docs/
□ CSV_HEADER_UPDATE_REPORT_20251027.md → docs/
□ CSV_HEADER_UPDATE_REPORT_20251027_v2.md → docs/
□ CSV_KANJI_FIX_REPORT.md → docs/
□ CSV_REFACTORING_REPORT.md → docs/
□ CSV_TYPE_SPECIFIC_DISPLAY_REPORT.md → docs/
□ DEPRECATION_GUIDE.md → docs/
□ README_RECOVERED.md → docs/
□ README_V2.md → docs/
□ REFERENCE_MATERIALS_CLEANUP_REPORT.md → docs/
□ REFERENCE_MATERIALS_CLEANUP_SUMMARY.md → docs/
□ REPAIR_REPORT.md → docs/
□ SIMPLIFICATION_COMPLETION_REPORT.md → docs/
□ SIMPLIFICATION_REPORT.md → docs/
□ SIMPLIFICATION_SUMMARY.md → docs/
□ SPECIFICATION_REVISION_REPORT.md → docs/
□ SPECIFICATION_REVISION_SUMMARY.md → docs/
□ TEST_GUIDE.md → docs/
□ XCODE_FOLDER_SETUP_GUIDE.md → docs/

[SimpleWord/docs から親の docs/ への移動]
※ SimpleWord/docs/ の内容を確認して重複がなければ統合
```

---

## ✅ 整理完了後のチェックリスト

### 1. ビルドの確認
```
□ Xcode でプロジェクトをクリーン (⇧⌘K)
□ ビルド実行 (⌘B)
□ エラーがないことを確認
□ アプリを実行して動作確認
```

### 2. ファイルパスの確認
```
□ Xcode のナビゲータで物理フォルダ構造とグループ構造が一致している
□ 不要な赤いファイル参照がない
□ 各 Feature フォルダ内が適切に整理されている
```

### 3. Git の確認
```
□ 削除したファイルが git から削除されている
□ 移動したファイルが正しく追跡されている
□ コミット前に差分を確認
```

---

## 📌 注意事項

### Xcode でのファイル移動について
- **物理的な移動**: Finder で直接ファイルを移動
- **Xcode の参照更新**: Xcode でファイルを削除 (Remove References) → 新しい場所から Add Files

または

- **Xcode 内での移動**: Xcodeのナビゲータで直接ドラッグ&ドロップ（推奨）
  - この方法だと Xcode が自動的に参照を更新してくれます

### import 文の確認
ファイル移動後、以下を確認:
- 各ファイルの import 文が正しいか
- 特に Feature 間の依存関係が適切か
- Common からの import が必要なものは追加されているか

### フォルダ作成の順序
1. まず新規フォルダを Xcode で作成
2. その後ファイルを移動
3. 空になった古いフォルダを削除

---

## 🎓 整理後の利点

### 1. 可読性の向上
- 各機能の責務が明確
- 新規メンバーがコードを理解しやすい

### 2. 保守性の向上
- 変更が必要な箇所を素早く特定できる
- 影響範囲の把握が容易

### 3. 拡張性の向上
- 新機能追加時のファイル配置が明確
- Feature 単位での開発がしやすい

### 4. テスト容易性
- Feature 単位でのテストがしやすい
- モックの作成が容易

---

## 📞 質問・相談

整理作業中に不明な点がありましたら、以下の情報と共にご相談ください:
- どのファイルを移動しようとしているか
- どのようなエラーが出ているか
- Xcode のビルドエラーメッセージ

---

**整理完了予定日**: ________
**整理担当者**: ________
**レビュー者**: ________
