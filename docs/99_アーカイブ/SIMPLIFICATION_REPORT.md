# SimpleWord プロジェクト簡素化提案レポート

**作成日**: 2025年10月28日

## 📋 概要

プロジェクト全体を分析し、機能を損なわずに実装を簡素化できる箇所を特定しました。
以下、優先度順に改善提案をまとめます。

---

## 🔴 高優先度: 重複・複雑な構造

### 1. QuizSettings の重複定義

**問題点**:
- `QuizSettings.swift` と `QuizSettingsStore.swift` に同じクラスが定義されている
- テストファイル `LearningModeTests.swift` にも重複定義がある
- どれが実際に使われているか不明確

**影響**:
- コード保守性の低下
- 変更時の漏れによるバグの可能性
- ビルド時の混乱

**提案**:
```swift
// 統合先: SimpleWord/Stores/QuizSettings.swift のみを残す
// 削除対象:
// - SimpleWord/Stores/QuizSettingsStore.swift（#if false で無効化済み）
// - LearningModeTests.swift 内の重複定義（モック化）
```

**作業内容**:
1. `QuizSettingsStore.swift` を完全削除
2. テストコードでは `QuizSettings` をモック化
3. 全参照を `QuizSettings.swift` の実装に統一

---

### 2. CSVローダーの二重実装

**問題点**:
- `CSVLoader` (Utils) と `CSVDataSource` (Common/Data) が同じことをしている
- `QuestionItemRepository` が両方を使い分けている
- ヘッダ駆動型の実装が重複

**影響**:
- メンテナンス箇所が2倍
- バグ修正の漏れリスク
- 新しい開発者の混乱

**提案**:
```swift
// 統合方針: QuestionItemRepository + CSVDataSource に一本化
// 削除対象: SimpleWord/Utils/CSVLoader.swift

// 移行手順:
// 1. CSVLoader を使用している箇所を QuestionItemRepository に置き換え
// 2. CSVLoader.swift を削除
// 3. テストコードを更新
```

**簡素化例**:
```swift
// 【現在】複雑
let loader = CSVLoader()
let items = try loader.load(from: url)

// 【提案】シンプル
let repository = QuestionItemRepository(fileName: csvName)
let items = try repository.fetch().get()
```

---

### 3. Core Data の過剰な複雑性

**問題点**:
- `CoreDataStack.swift` で独自のモデルを動的生成している
- `WordIdMap` のためだけに複雑なインフラを構築
- 実際には UUID の保存だけなので、JSON ファイルで十分

**影響**:
- Core Data の学習コストが高い
- マイグレーション時の問題
- デバッグが困難

**提案**:
```swift
// IDマップを JSON ファイルで管理
// 場所: Application Support/SimpleWord/WordIDMap.json

struct WordIDMapStore {
    private let fileURL: URL
    private var map: [String: String] = [:] // hashKey -> UUID
    
    func getOrCreateID(for hashKey: String) -> UUID {
        if let existing = map[hashKey], let uuid = UUID(uuidString: existing) {
            return uuid
        }
        let newID = UUID()
        map[hashKey] = newID.uuidString
        save()
        return newID
    }
    
    private func save() {
        let data = try? JSONEncoder().encode(map)
        try? data?.write(to: fileURL)
    }
}
```

**削減されるファイル**:
- `CoreDataStack.swift`
- `WordIdMap.swift`
- `CoreDataWordIDProvider.swift`（一部機能は残す）

---

## 🟡 中優先度: アーキテクチャの簡素化

### 4. QuizSettingsModel の肥大化

**問題点**:
- `QuizSettingsModel` に20個以上のプロパティがある
- UI用/保存用/履歴用が混在
- 後方互換性のために複雑な Codable 実装

**提案**:
```swift
// 責務で分離
struct QuizConfig {
    var fields: [String]
    var difficulties: [String]
    var repeatCount: Int
    var successThreshold: Double
    var questionsPerBatch: Int
}

struct QuizUISettings {
    var numberOfChoices: Int
    var isRandomOrder: Bool
    var autoAdvance: Bool
}

struct QuizResult {
    var csvName: String
    var config: QuizConfig
    var score: Int
    var total: Int
    var date: Date
}
```

---

### 5. AdaptiveScheduler と MemoryTracker が未使用

**問題点**:
```swift
// QuizView.swift 内
private let enableMemoryTracking = false
private let enableAdaptiveScheduling = false
```
- 機能フラグが常に false
- コードは存在するが動いていない
- メンテナンスコストだけ発生

**提案**:
1. 使う予定があれば別ブランチに退避
2. 使わないなら完全削除

**削減されるファイル**:
- `AdaptiveScheduler.swift`
- `MemoryConsolidationTracker.swift`（存在する場合）
- `MemoryProgressView.swift`
- `MemoryStage.swift`

---

### 6. Legacy アダプター層が不要

**問題点**:
```
Common/Data/Legacy/
├── LegacyCSVLoaderAdapter.swift
└── LegacyCSVQuestionLoaderAdapter.swift
```
- 新しい実装に移行済みなら不要
- 使われていないコード

**提案**:
- 実際に使われているか確認
- 使われていなければ削除

---

## 🟢 低優先度: 細かい改善

### 7. ContentView の不要な Core Data コード

**問題点**:
```swift
// ContentView.swift
private func addItem() { ... }
private func deleteItems(offsets: IndexSet) { ... }
```
- `Item` エンティティは使われていない
- FetchRequest も不要

**提案**:
- Core Data 関連のコードを削除
- ContentView をシンプルなナビゲーション画面に

---

### 8. 環境オブジェクトの過剰な注入

**問題点**:
```swift
// ContentView.swift - QuizView への遷移
NavigationLink(destination: QuizView()
    .environmentObject(wordScoreStore)
    .environmentObject(currentCSV)
    .environmentObject(quizSettings))
```
- 親で既に注入済みなのに、子にも明示的に注入
- 冗長で保守が面倒

**提案**:
```swift
// SimpleWordApp で注入したら、子では自動的に使える
NavigationLink(destination: QuizView())
```

---

## 📊 簡素化による効果予測

| 項目 | 削減ファイル数 | 削減コード行数（推定） | 保守性向上度 |
|------|----------------|------------------------|--------------|
| QuizSettings統合 | 2 | 150行 | ⭐⭐⭐ |
| CSVLoader統合 | 1 | 200行 | ⭐⭐⭐ |
| Core Data → JSON | 3 | 250行 | ⭐⭐⭐⭐ |
| 未使用機能削除 | 5-7 | 500行 | ⭐⭐⭐⭐⭐ |
| Legacy削除 | 2 | 100行 | ⭐⭐ |
| ContentView整理 | 0 | 50行 | ⭐⭐ |
| 環境注入最適化 | 0 | 30行 | ⭐ |
| **合計** | **13-15** | **1280行** | **平均 ⭐⭐⭐** |

---

## 🎯 推奨実行順序

### フェーズ1: 安全な削除（1-2時間）
1. 未使用の AdaptiveScheduler 関連機能を削除
2. Legacy アダプター削除
3. ContentView の不要コード削除

### フェーズ2: 重複解消（2-3時間）
4. QuizSettings 統合
5. CSVLoader 統合

### フェーズ3: アーキテクチャ改善（3-4時間）
6. Core Data → JSON 移行
7. QuizSettingsModel の分離
8. 環境オブジェクト注入の最適化

---

## ⚠️ 注意事項

### 実施前の確認
1. **Git でブランチ作成**: `git checkout -b simplification`
2. **既存機能のテスト**: 主要機能が動作することを確認
3. **段階的な適用**: 一度に全部やらず、1つずつ確認

### バックアップ
```bash
# 現在の状態をタグ付け
git tag before-simplification
git push origin before-simplification
```

---

## 🚀 次のステップ

どの項目から着手しますか？

1. **安全第一**: フェーズ1から順番に
2. **効果優先**: Core Data → JSON から（最大の簡素化効果）
3. **段階確認**: 1項目ずつ実施して確認

具体的な実装支援が必要な場合は、個別に対応します。

---

## 📝 追加調査が必要な項目

以下の項目は実際の使用状況を確認する必要があります：

- [ ] `CSVQuestionLoader.swift` の使用状況
- [ ] `IDMapAdminView` の利用頻度
- [ ] `FileWatcher.swift` の必要性
- [ ] `QuizSessionStore.shared` vs インスタンス化
- [ ] Appearance 機能の使用率

---

**レポート作成者**: GitHub Copilot  
**分析対象**: SimpleWord プロジェクト全体（81 Swift ファイル）
