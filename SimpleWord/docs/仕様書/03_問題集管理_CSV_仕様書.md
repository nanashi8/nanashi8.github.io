# 問題集管理（CSV の一覧・削除・管理）

**最終更新: 2025-10-19**

この文書は、「問題集管理」画面の編集・実装ガイドです。

## 概要

### 何を実現しているか
- アプリ同梱（Bundle）と端末内（Documents）のCSVを統合表示
- Documents内のCSVの削除機能
- CSV情報の確認（問題数、分野、難易度）
- 将来的なインポート/エクスポート機能の入口

## 画面構成

### CSV一覧
```
┌─────────────────────────┐
│ 📄 中学英単語.csv        │
│    問題数: 500           │
│    場所: Documents       │
│    [削除] ← スワイプ     │
├─────────────────────────┤
│ 📄 高校単語.csv          │
│    問題数: 1000          │
│    場所: Bundle          │
│    (削除不可)            │
└─────────────────────────┘
```

### インポート/エクスポート（将来実装）
```
[CSVをインポート]
[CSVをエクスポート]
```

## 関係するファイル

### 画面
- **CSVManagerView.swift** - 問題集管理画面本体

### ユーティリティ
- **FileUtils.swift** - ファイル操作
  - `listCSVFilesInDocuments()` - Documents内のCSV一覧
  - `listBundleCSVFiles()` - Bundle内のCSV一覧
  - `deleteCSV(named:)` - CSV削除

### データモデル
- **QuestionItem.swift** - CSV読み込み後のデータ
- **CSVLoader.swift** - CSV解析

## 主要な処理

### CSV一覧の取得
```swift
func loadCSVList() {
    var csvList: [(name: String, location: String, count: Int)] = []
    
    // Documents から取得
    let docCSVs = FileUtils.listCSVFilesInDocuments()
    for csv in docCSVs {
        let count = getQuestionCount(csv, from: .documents)
        csvList.append((csv, "Documents", count))
    }
    
    // Bundle から取得（Documentsに同名がなければ）
    let bundleCSVs = FileUtils.listBundleCSVFiles()
    for csv in bundleCSVs {
        if !docCSVs.contains(csv) {
            let count = getQuestionCount(csv, from: .bundle)
            csvList.append((csv, "Bundle", count))
        }
    }
}
```

### CSV削除
```swift
func deleteCSV(named: String, location: String) {
    guard location == "Documents" else {
        // Bundle は削除不可
        showError("アプリ同梱のCSVは削除できません")
        return
    }
    
    do {
        try FileUtils.deleteCSV(named: named)
        // 一覧を再読み込み
        loadCSVList()
    } catch {
        showError("削除に失敗しました: \(error.localizedDescription)")
    }
}
```

## 編集時の注意点

### Documents と Bundle の優先順位
**ルール**: Documents が常に優先される

```swift
// 同名CSVがある場合、Documentsを優先
if docCSVs.contains(csvName) {
    // Documents から読み込む
} else if bundleCSVs.contains(csvName) {
    // Bundle から読み込む
}
```

**チェックポイント**:
- [ ] 同名CSVの重複表示を防ぐ
- [ ] Documents版が更新された場合、Bundle版より優先
- [ ] 削除後は Bundle版が表示される

### 削除の安全性
**実装箇所**: スワイプアクション

```swift
.swipeActions(edge: .trailing) {
    if csv.location == "Documents" {
        Button(role: .destructive) {
            showDeleteConfirmation(csv)
        } label: {
            Label("削除", systemImage: "trash")
        }
    }
}
```

**チェックポイント**:
- [ ] Bundle版は削除ボタンが表示されない
- [ ] 削除前に確認ダイアログが表示される
- [ ] 削除後に一覧が自動更新される

### 問題数の取得
**実装箇所**: CSV読み込み

```swift
func getQuestionCount(_ csvName: String, from location: Location) -> Int {
    let loader = CSVLoader()
    let items: [QuestionItem]?
    
    if location == .documents {
        let url = FileUtils.documentsDirectory?.appendingPathComponent(csvName)
        items = try? loader.load(from: url!)
    } else {
        let baseName = csvName.replacingOccurrences(of: ".csv", with: "")
        items = try? loader.loadFromBundle(named: baseName)
    }
    
    return items?.count ?? 0
}
```

**チェックポイント**:
- [ ] エラー時は 0 を返す
- [ ] 大量問題でもパフォーマンス劣化しない
- [ ] キャッシュを検討（頻繁に呼ばれる場合）

## テスト観点

### 基本動作
- [ ] CSV一覧が正しく表示される
- [ ] Documents と Bundle の両方が表示される
- [ ] 同名CSVは Documents のみ表示される
- [ ] 問題数が正確に表示される

### 削除機能
- [ ] Documents内のCSVが削除できる
- [ ] Bundle内のCSVは削除できない
- [ ] 削除後、一覧が更新される
- [ ] 削除したCSVが選択中の場合、別のCSVに切り替わる

### エラーハンドリング
- [ ] CSVが1つもない場合の表示
- [ ] 破損したCSVの問題数が0になる
- [ ] 削除失敗時のエラーメッセージ

### エッジケース
- [ ] 空のCSV（ヘッダーのみ）
- [ ] 巨大なCSV（10000問以上）
- [ ] 特殊文字を含むファイル名

## よくある編集パターン

### インポート機能の追加
```swift
func importCSV(from url: URL) {
    // 1. ファイルをコピー
    let destURL = FileUtils.documentsDirectory!.appendingPathComponent(url.lastPathComponent)
    try? FileManager.default.copyItem(at: url, to: destURL)
    
    // 2. 検証
    let loader = CSVLoader()
    guard let items = try? loader.load(from: destURL), !items.isEmpty else {
        // エラー処理
        return
    }
    
    // 3. 一覧を更新
    loadCSVList()
}
```

### エクスポート機能の追加
```swift
func exportCSV(named: String) {
    guard let sourceURL = FileUtils.documentsDirectory?.appendingPathComponent(named) else {
        return
    }
    
    // UIActivityViewController で共有
    let activityVC = UIActivityViewController(
        activityItems: [sourceURL],
        applicationActivities: nil
    )
    // 表示処理
}
```

### CSV情報の詳細表示
```swift
struct CSVDetailView: View {
    let csvName: String
    @State private var items: [QuestionItem] = []
    @State private var fields: Set<String> = []
    @State private var difficulties: Set<String> = []
    
    var body: some View {
        List {
            Section("基本情報") {
                Text("問題数: \(items.count)")
            }
            Section("分野") {
                ForEach(Array(fields), id: \.self) { field in
                    Text(field)
                }
            }
            Section("難易度") {
                ForEach(Array(difficulties), id: \.self) { diff in
                    Text(diff)
                }
            }
        }
        .onAppear(perform: loadDetails)
    }
}
```

## トラブルシューティング

### CSV一覧が空
- Documents に CSV がない → iOS ファイルアプリから追加
- Bundle に CSV がない → Xcode で Resources に追加

### 削除後もCSVが表示される
- 一覧の更新タイミングを確認
- `loadCSVList()` が呼ばれているか確認

### 問題数が0になる
- CSV形式が正しいか確認（CSVLoader の仕様参照）
- ヘッダー行が存在するか確認

## 関連ドキュメント
- `.copilot/structure-map.md` - ファイル構成
- `07_CSV編集_仕様書.md` - CSV形式の詳細
- `FileUtils.swift` - ファイル操作の実装
