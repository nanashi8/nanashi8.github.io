# 📋 フォルダ構成整理計画書

作成日: 2025年10月22日
目的: Feature-First / Vertical Slice Architecture への完全移行

---

## 🎯 目標構成

```
SimpleWord/
├── App/                           # アプリケーションエントリポイント
├── Features/                      # 機能別垂直分割
│   ├── Quiz/                     # クイズ機能
│   ├── Study/                    # 学習機能（既存）
│   ├── CSV/                      # CSV管理機能
│   ├── Score/                    # スコア表示機能
│   └── Admin/                    # 管理機能
├── Core/                         # 共通コア機能
│   ├── Models/
│   ├── Services/
│   ├── Stores/
│   ├── Utils/
│   ├── Persistence/
│   ├── Appearance/
│   ├── Views/                    # 共通ビュー
│   └── Components/
├── Resources/                    # リソースファイル
├── Config/                       # 設定ファイル
└── Tools/                        # ツール（移動不要）
```

---

## 🔄 Phase 1: App層の作成（1ファイル）

### Xcodeでの操作手順
1. Project Navigator で `SimpleWord` グループを右クリック
2. `New Group` を選択 → `App` と命名
3. `SimpleWordApp.swift` を `App/` グループへドラッグ

### チェックリスト
- [ ] `SimpleWordApp.swift` → `App/SimpleWordApp.swift`

---

## 🔄 Phase 2: Quiz機能の完全集約（6ファイル）

### Xcodeでの操作手順
1. `Features/Quiz/Views/` が既に存在することを確認
2. ルート直下の以下のファイルを `Features/Quiz/Views/` へドラッグ
   - ChoiceCardView.swift
   - DontKnowCardView.swift
   - QuestionCardView.swift
   - QuizNavigationButtonsView.swift
   - QuizStatisticsView.swift
3. `Features/Quiz/` 配下に `Models` グループを新規作成
4. ルート直下の `QuizModels.swift` を `Features/Quiz/Models/` へドラッグ

### チェックリスト
- [ ] `ChoiceCardView.swift` → `Features/Quiz/Views/ChoiceCardView.swift`
- [ ] `DontKnowCardView.swift` → `Features/Quiz/Views/DontKnowCardView.swift`
- [ ] `QuestionCardView.swift` → `Features/Quiz/Views/QuestionCardView.swift`
- [ ] `QuizNavigationButtonsView.swift` → `Features/Quiz/Views/QuizNavigationButtonsView.swift`
- [ ] `QuizStatisticsView.swift` → `Features/Quiz/Views/QuizStatisticsView.swift`
- [ ] `QuizModels.swift` → `Features/Quiz/Models/QuizModels.swift`

### ビルド確認
```bash
Cmd + B
```

---

## 🔄 Phase 3: 新規Feature作成とViews整理（12ファイル）

### 3-1: CSV管理機能（5ファイル）

#### Xcodeでの操作手順
1. `Features/` 配下に `CSV` グループを新規作成
2. `CSV/` 配下に `Views` グループを新規作成
3. `Views/` フォルダから以下をドラッグ:
   - CSVEditorView.swift
   - CSVItemEditView.swift
   - CSVItemListEditorView.swift
   - CSVManagerView.swift
   - FilterEditorView.swift

#### チェックリスト
- [ ] `CSVEditorView.swift` → `Features/CSV/Views/CSVEditorView.swift`
- [ ] `CSVItemEditView.swift` → `Features/CSV/Views/CSVItemEditView.swift`
- [ ] `CSVItemListEditorView.swift` → `Features/CSV/Views/CSVItemListEditorView.swift`
- [ ] `CSVManagerView.swift` → `Features/CSV/Views/CSVManagerView.swift`
- [ ] `FilterEditorView.swift` → `Features/CSV/Views/FilterEditorView.swift`

### 3-2: 管理機能（1ファイル）

#### Xcodeでの操作手順
1. `Features/` 配下に `Admin` グループを新規作成
2. `Admin/` 配下に `Views` グループを新規作成
3. `Views/IDMapAdminView.swift` を `Features/Admin/Views/` へドラッグ

#### チェックリスト
- [ ] `IDMapAdminView.swift` → `Features/Admin/Views/IDMapAdminView.swift`

### 3-3: Quiz関連Views（2ファイル）

#### Xcodeでの操作手順
1. `Views/` フォルダから以下を `Features/Quiz/Views/` へドラッグ:
   - QuestionDetailView.swift
   - QuizSettingsView.swift

#### チェックリスト
- [ ] `QuestionDetailView.swift` → `Features/Quiz/Views/QuestionDetailView.swift`
- [ ] `QuizSettingsView.swift` → `Features/Quiz/Views/QuizSettingsView.swift`

### 3-4: スコア機能（2ファイル）

#### Xcodeでの操作手順
1. `Features/` 配下に `Score` グループを新規作成
2. `Score/` 配下に `Views` グループを新規作成
3. `Views/` フォルダから以下をドラッグ:
   - ScoreView.swift
   - WordScoresView.swift

#### チェックリスト
- [ ] `ScoreView.swift` → `Features/Score/Views/ScoreView.swift`
- [ ] `WordScoresView.swift` → `Features/Score/Views/WordScoresView.swift`

### 3-5: 共通Views（2ファイル）

#### Xcodeでの操作手順
1. `Core/` グループを新規作成（まだない場合）
2. `Core/` 配下に `Views` グループを新規作成
3. `Views/` フォルダから以下をドラッグ:
   - ContentView.swift
   - NavigatorView.swift

#### チェックリスト
- [ ] `ContentView.swift` → `Core/Views/ContentView.swift`
- [ ] `NavigatorView.swift` → `Core/Views/NavigatorView.swift`

### ビルド確認
```bash
Cmd + B
```

---

## 🔄 Phase 4: Core層の完全整理（25ファイル）

### 4-1: Models（2ファイル）

#### Xcodeでの操作手順
1. `Core/` 配下に `Models` グループを新規作成
2. `Models/` フォルダから全ファイルを `Core/Models/` へドラッグ
3. 元の `Models/` グループを削除

#### チェックリスト
- [ ] `QuestionItem.swift` → `Core/Models/QuestionItem.swift`
- [ ] `WordScore.swift` → `Core/Models/WordScore.swift`

### 4-2: Services（6ファイル）

#### Xcodeでの操作手順
1. `Core/` 配下に `Services` グループを新規作成
2. `Services/CSVQuestionLoader.swift` を `Core/Services/` へドラッグ
3. `Services/CoreDataIDs/` フォルダ全体を `Core/Services/` へドラッグ
4. 元の `Services/` グループを削除

#### チェックリスト
- [ ] `CSVQuestionLoader.swift` → `Core/Services/CSVQuestionLoader.swift`
- [ ] `CoreDataIDs/CoreDataStack.swift` → `Core/Services/CoreDataIDs/CoreDataStack.swift`
- [ ] `CoreDataIDs/CoreDataWordIDProvider.swift` → `Core/Services/CoreDataIDs/CoreDataWordIDProvider.swift`
- [ ] `CoreDataIDs/IDMapMaintenance.swift` → `Core/Services/CoreDataIDs/IDMapMaintenance.swift`
- [ ] `CoreDataIDs/WordIdMap.swift` → `Core/Services/CoreDataIDs/WordIdMap.swift`
- [ ] `CoreDataIDs/WordKeyBuilder.swift` → `Core/Services/CoreDataIDs/WordKeyBuilder.swift`

### 4-3: Stores（5ファイル）

#### Xcodeでの操作手順
1. `Core/` 配下に `Stores` グループを新規作成
2. `Stores/` フォルダから全ファイルを `Core/Stores/` へドラッグ
3. 元の `Stores/` グループを削除

#### チェックリスト
- [ ] `CurrentCSV.swift` → `Core/Stores/CurrentCSV.swift`
- [ ] `QuizSettings.swift` → `Core/Stores/QuizSettings.swift`
- [ ] `QuizSettingsStore.swift` → `Core/Stores/QuizSettingsStore.swift`
- [ ] `ScoreStore.swift` → `Core/Stores/ScoreStore.swift`
- [ ] `WordScoreStore.swift` → `Core/Stores/WordScoreStore.swift`

### 4-4: Utils（6ファイル）

#### Xcodeでの操作手順
1. `Core/` 配下に `Utils` グループを新規作成
2. `Utils/` フォルダから全ファイルを `Core/Utils/` へドラッグ
3. 元の `Utils/` グループを削除

#### チェックリスト
- [ ] `CSVDocument.swift` → `Core/Utils/CSVDocument.swift`
- [ ] `CSVIDEnsurer.swift` → `Core/Utils/CSVIDEnsurer.swift`
- [ ] `CSVLoader.swift` → `Core/Utils/CSVLoader.swift`
- [ ] `FileUtils.swift` → `Core/Utils/FileUtils.swift`
- [ ] `FileWatcher.swift` → `Core/Utils/FileWatcher.swift`
- [ ] `IDFactory.swift` → `Core/Utils/IDFactory.swift`

### 4-5: Appearance（1ファイル）

#### Xcodeでの操作手順
1. `Core/` 配下に `Appearance` グループを新規作成
2. ルート直下の `Appearance.swift` を `Core/Appearance/` へドラッグ

#### チェックリスト
- [ ] `Appearance.swift` → `Core/Appearance/Appearance.swift`

### 4-6: Persistence（2ファイル）

#### Xcodeでの操作手順
1. `Core/` 配下に `Persistence` グループを新規作成
2. ルート直下の `Persistence.swift` を `Core/Persistence/` へドラッグ
3. ルート直下の `SimpleWord.xcdatamodeld/` を `Core/Persistence/` へドラッグ

#### チェックリスト
- [ ] `Persistence.swift` → `Core/Persistence/Persistence.swift`
- [ ] `SimpleWord.xcdatamodeld/` → `Core/Persistence/SimpleWord.xcdatamodeld/`

### 4-7: Components（1ファイル）

#### Xcodeでの操作手順
1. `Core/` 配下に `Components` グループを新規作成
2. `Views/Components/StyleGuide.swift` を `Core/Components/` へドラッグ
3. 元の `Views/Components/` グループを削除

#### チェックリスト
- [ ] `StyleGuide.swift` → `Core/Components/StyleGuide.swift`

### ビルド確認
```bash
Cmd + B
```

---

## 🔄 Phase 5: Config設定ファイル（2ファイル）

### Xcodeでの操作手順
1. `SimpleWord` グループ直下に `Config` グループを新規作成
2. `Info.plist` を `Config/` へドラッグ
3. `SimpleWord.entitlements` を `Config/` へドラッグ

### チェックリスト
- [ ] `Info.plist` → `Config/Info.plist`
- [ ] `SimpleWord.entitlements` → `Config/SimpleWord.entitlements`

### ビルド確認
```bash
Cmd + B
```

---

## 🗑️ Phase 6: 空フォルダの削除

### Xcodeでの操作手順
1. 以下のフォルダを右クリック → `Delete` → `Remove References`
   - `Features/Quiz/Logic/`
   - `Features/Quiz/WordManagement/Models/`
   - `Features/Quiz/WordManagement/Views/`
   - `Features/Quiz/WordManagement/` (親フォルダも削除)
2. 元の `Models/` グループ（空になっている場合）
3. 元の `Services/` グループ（空になっている場合）
4. 元の `Stores/` グループ（空になっている場合）
5. 元の `Utils/` グループ（空になっている場合）
6. 元の `Views/` グループ（空になっている場合）

### チェックリスト
- [ ] `Features/Quiz/Logic/` 削除
- [ ] `Features/Quiz/WordManagement/` 削除（配下の空フォルダ含む）
- [ ] 空になった旧フォルダグループを全て削除

---

## ✅ 最終確認

### ビルドテスト
```bash
Cmd + B
```

### 動作テスト
1. アプリを起動（Cmd + R）
2. 主要機能の動作確認:
   - [ ] クイズ機能が正常に動作
   - [ ] CSV管理画面が表示
   - [ ] スコア表示が正常
   - [ ] 設定画面が正常

---

## 📊 移動サマリー

| Phase | ファイル数 | 完了 |
|-------|-----------|------|
| Phase 1: App層 | 1 | ⬜ |
| Phase 2: Quiz集約 | 6 | ⬜ |
| Phase 3: Views整理 | 12 | ⬜ |
| Phase 4: Core層 | 25 | ⬜ |
| Phase 5: Config | 2 | ⬜ |
| Phase 6: 空フォルダ削除 | - | ⬜ |
| **合計** | **46ファイル** | ⬜ |

---

## 🎯 完了後のアクション

```
✅ 「バージョン管理してください」
```

これにより:
1. 自動ブランチ作成
2. 自動コミット・タグ作成
3. `structure-map.md` 自動更新
4. `changelog.md` 自動更新
5. 完了レポート表示

すべてが自動化されます！
