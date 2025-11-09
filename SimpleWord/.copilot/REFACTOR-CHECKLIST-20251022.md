# ✅ フォルダ構成整理 - 簡易チェックリスト

作成日: 2025年10月22日

---

## 📋 Phase 1: App層（1ファイル）

- [ ] `SimpleWordApp.swift` → `App/`

**ビルド確認**: `Cmd + B`

---

## 📋 Phase 2: Quiz機能集約（6ファイル）

### Views（5ファイル）
- [ ] `ChoiceCardView.swift` → `Features/Quiz/Views/`
- [ ] `DontKnowCardView.swift` → `Features/Quiz/Views/`
- [ ] `QuestionCardView.swift` → `Features/Quiz/Views/`
- [ ] `QuizNavigationButtonsView.swift` → `Features/Quiz/Views/`
- [ ] `QuizStatisticsView.swift` → `Features/Quiz/Views/`

### Models（1ファイル）
- [ ] `QuizModels.swift` → `Features/Quiz/Models/`（新規作成）

**ビルド確認**: `Cmd + B`

---

## 📋 Phase 3: 新規Feature作成（12ファイル）

### CSV管理（5ファイル）
- [ ] `CSVEditorView.swift` → `Features/CSV/Views/`
- [ ] `CSVItemEditView.swift` → `Features/CSV/Views/`
- [ ] `CSVItemListEditorView.swift` → `Features/CSV/Views/`
- [ ] `CSVManagerView.swift` → `Features/CSV/Views/`
- [ ] `FilterEditorView.swift` → `Features/CSV/Views/`

### 管理機能（1ファイル）
- [ ] `IDMapAdminView.swift` → `Features/Admin/Views/`

### Quiz追加（2ファイル）
- [ ] `QuestionDetailView.swift` → `Features/Quiz/Views/`
- [ ] `QuizSettingsView.swift` → `Features/Quiz/Views/`

### スコア機能（2ファイル）
- [ ] `ScoreView.swift` → `Features/Score/Views/`
- [ ] `WordScoresView.swift` → `Features/Score/Views/`

### 共通Views（2ファイル）
- [ ] `ContentView.swift` → `Core/Views/`
- [ ] `NavigatorView.swift` → `Core/Views/`

**ビルド確認**: `Cmd + B`

---

## 📋 Phase 4: Core層整理（25ファイル）

### Models（2ファイル）
- [ ] `QuestionItem.swift` → `Core/Models/`
- [ ] `WordScore.swift` → `Core/Models/`

### Services（6ファイル）
- [ ] `CSVQuestionLoader.swift` → `Core/Services/`
- [ ] `CoreDataIDs/CoreDataStack.swift` → `Core/Services/CoreDataIDs/`
- [ ] `CoreDataIDs/CoreDataWordIDProvider.swift` → `Core/Services/CoreDataIDs/`
- [ ] `CoreDataIDs/IDMapMaintenance.swift` → `Core/Services/CoreDataIDs/`
- [ ] `CoreDataIDs/WordIdMap.swift` → `Core/Services/CoreDataIDs/`
- [ ] `CoreDataIDs/WordKeyBuilder.swift` → `Core/Services/CoreDataIDs/`

### Stores（5ファイル）
- [ ] `CurrentCSV.swift` → `Core/Stores/`
- [ ] `QuizSettings.swift` → `Core/Stores/`
- [ ] `QuizSettingsStore.swift` → `Core/Stores/`
- [ ] `ScoreStore.swift` → `Core/Stores/`
- [ ] `WordScoreStore.swift` → `Core/Stores/`

### Utils（6ファイル）
- [ ] `CSVDocument.swift` → `Core/Utils/`
- [ ] `CSVIDEnsurer.swift` → `Core/Utils/`
- [ ] `CSVLoader.swift` → `Core/Utils/`
- [ ] `FileUtils.swift` → `Core/Utils/`
- [ ] `FileWatcher.swift` → `Core/Utils/`
- [ ] `IDFactory.swift` → `Core/Utils/`

### その他（6ファイル）
- [ ] `Appearance.swift` → `Core/Appearance/`
- [ ] `Persistence.swift` → `Core/Persistence/`
- [ ] `SimpleWord.xcdatamodeld/` → `Core/Persistence/`
- [ ] `StyleGuide.swift` → `Core/Components/`

**ビルド確認**: `Cmd + B`

---

## 📋 Phase 5: Config（2ファイル）

- [ ] `Info.plist` → `Config/`
- [ ] `SimpleWord.entitlements` → `Config/`

**ビルド確認**: `Cmd + B`

---

## 📋 Phase 6: 空フォルダ削除

- [ ] `Features/Quiz/Logic/` 削除
- [ ] `Features/Quiz/WordManagement/` 削除（配下含む）
- [ ] 旧 `Models/` グループ削除（空の場合）
- [ ] 旧 `Services/` グループ削除（空の場合）
- [ ] 旧 `Stores/` グループ削除（空の場合）
- [ ] 旧 `Utils/` グループ削除（空の場合）
- [ ] 旧 `Views/` グループ削除（空の場合）

**最終ビルド確認**: `Cmd + B`

---

## 🎯 完了後

```
✅ 「バージョン管理してください」
```

→ すべてが自動記録されます！

---

## 📊 進捗

- Phase 1: ⬜ 0/1
- Phase 2: ⬜ 0/6
- Phase 3: ⬜ 0/12
- Phase 4: ⬜ 0/25
- Phase 5: ⬜ 0/2
- Phase 6: ⬜

**合計**: 0/46ファイル移動完了
