# SimpleWord アーキテクチャマップ

最終更新: 2025年10月23日 | Feature-First / Vertical Slice Architecture

---

## 📂 現在の構成（簡潔版）

```
SimpleWord/
├── App/                    # ✅ エントリポイント
├── Features/               # 機能別垂直分割
│   ├── Quiz/Views/        # ✅ 4ファイル配置済み
│   └── Study/             # ✅ 適応型学習（完全実装）
├── Models/                # ⚠️ Core統合予定
├── QuizModels/            # ⚠️ Quiz統合予定
├── QuizComponents/        # ⚠️ Quiz統合予定（5ファイル）
├── Views/                 # ⚠️ Feature統合予定（13ファイル）
├── Services/              # ⚠️ Core統合予定
├── Stores/                # ⚠️ Core統合予定
├── Utils/                 # ⚠️ Core統合予定
├── CoreData/              # ✅ データモデル
├── Config/                # ✅ 設定ファイル
└── Resources/             # ✅ リソース
```

---

## 🎯 主要コンポーネント

### QuizView依存関係
```
Features/Quiz/Views/QuizView.swift (434行)
├─ @EnvironmentObject: QuizSettings, ScoreStore, WordScoreStore, CurrentCSV
├─ Services: CSVQuestionLoader, AdaptiveScheduler
├─ Models: QuestionItem, QuizModels, WordScore
└─ Components: QuestionCardView, ChoiceCardView (QuizComponents/)
```

### Study機能（完全実装）
```
Features/Study/
├── Data/FileStudyProgressRepository.swift
├── Domain/ReviewOutcome, StudyRecord, UserLearningProfile
└── Logic/AdaptiveScheduler, LearningAnalytics
```

---

## 🔄 次のステップ

**詳細**: `.copilot/REFACTOR-PLAN-20251022.md`

- Phase A: Core層作成（25ファイル）
- Phase B: Quiz統合（6ファイル）
- Phase C: 新Feature作成（12ファイル）

---

## 📝 開発原則

- **Feature-First**: 機能単位での垂直分割
- **責務分離**: View/Model/Store/Service明確化
- **単一実装**: 過度なラッパー回避
- **実用性優先**: 可読性・保守性重視
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
