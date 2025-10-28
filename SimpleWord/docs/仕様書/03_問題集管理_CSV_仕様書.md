# 問題集管理（CSV）機能_仕様書 v2

**最終更新**: 2025年10月30日  
**ステータス**: ✅ 最新（実装と一致）  
**復元可能性**: ★★★★☆

---

## 🎯 このドキュメントの目的

SimpleWordのCSV管理機能の完全な仕様を記述します。機能損失時に、このドキュメントから復元できます。

---

## 概要

### 何を実現しているか
- **CSV一覧表示**: Bundle内とDocuments内のCSVファイルを一覧表示
- **ファイル操作**: 削除、エクスポート、インポート
- **プレビュー**: CSV内容の確認
- **現在の選択状態**: どのCSVが選択されているか表示

### 基本的な操作フロー
```
ホーム画面 → 問題集管理 → CSV一覧
                           ↓
                    ファイル選択 → プレビュー
                    ファイル選択 → 削除/エクスポート
                    + ボタン → インポート
```

---

## CSV管理の方針

### ファイルの保存場所

#### 1. Bundle内のCSV（読み取り専用）
- **場所**: `Bundle.main/Resources/`
- **用途**: アプリに同梱されている問題集
- **操作**: 読み取りのみ（削除・編集不可）
- **例**: 
  - 中学英単語.csv
  - 中学古典単語.csv
  - 中学英会話.csv

#### 2. Documents内のCSV（読み書き可能）
- **場所**: `FileManager.default.urls(for: .documentDirectory, ...)[0]`
- **用途**: ユーザーが追加した問題集
- **操作**: 追加・削除・編集が可能
- **インポート**: ファイルアプリや他のアプリから取り込み可能

### CSV読み込みの優先順位
クイズ機能でCSVを読み込む際の優先順位：
```
1. Documents/〇〇.csv （高優先度）
2. Bundle.main/〇〇.csv （低優先度）
```

この仕様により、ユーザーが同名のCSVをインポートすれば、Bundle版を上書きできます。

---

## CSVフォーマット仕様

### ヘッダ駆動型（推奨）
**実装日**: 2025年10月27日以降

CSVの1行目のヘッダから列を自動認識します。列順は自由です。

#### 必須列
- `term` または `語句`: 語句（問題文）
- `meaning` または `意味` または `和訳`: 意味（正解）

#### オプション列
- `reading` または `読み` または `発音`: 読み仮名または発音
- `etymology` または `語源` または `語源等解説`: 語源・解説
- `relatedWords` または `関連語`: 関連語（セミコロン区切り）
- `relatedFields` または `関連分野` または `分野`: 関連分野（セミコロン区切り）
- `difficulty` または `難易度`: 難易度

### 標準フォーマット例

#### パターン1: 中学古典単語
```csv
語句,読み（ひらがな）,意味,語源等解説（日本語）,関連語と意味,関連分野,難易度
いと,いと,とても,古語で強調を表す副詞,いみじ:非常に,副詞,1
をかし,をかし,趣がある,美的感覚を表す形容詞,あはれ:しみじみ,形容詞,2
```

#### パターン2: 中学英会話
```csv
語句,発音（カタカナ）,和訳,語源等解説（日本語）,関連語（英語）と意味（日本語）,関連分野（日本語）,難易度
Hello!,ハロー,こんにちは,英語の挨拶の定番,Hi:やあ,挨拶,1
Thank you,サンキュー,ありがとう,感謝を表す表現,Thanks:ありがと,感謝,1
```

### 複数値の区切り
- **関連語**: セミコロン（`;`）で区切る
  - 例: `word1:意味1;word2:意味2;word3:意味3`
- **関連分野**: セミコロン（`;`）で区切る
  - 例: `分野1;分野2;分野3`

### エンコーディング
- **UTF-8** 必須
- BOM付きUTF-8も対応

---

## 実装詳細

### 主要ファイル

現在、CSV管理機能は主に以下のユーティリティで実装されています：

```
SimpleWord/
├── Utils/
│   ├── FileUtils.swift              # ファイル操作ユーティリティ
│   └── CSVLoader.swift               # CSV読み込み（廃止予定）
├── Common/
│   └── Data/
│       ├── Repository/
│       │   └── QuestionItemRepository.swift  # CSV読み込み（推奨）
│       └── Parser/
│           ├── QuestionItemParser.swift      # ヘッダ駆動型パーサー
│           └── CSVHeaderParser.swift         # ヘッダ解析
```

**注意**: 現在CSVManagerViewは実装されていません。CSV管理は主に：
- ContentView からの間接的なアクセス
- QuizSettingsView での CSV 選択
- FileUtils による低レベルファイル操作

で行われています。

### FileUtils の主要メソッド

```swift
// Bundle内のCSVファイル一覧を取得
static func listBundleCSVFiles() -> [String]

// Documents内のCSVファイル一覧を取得
static func listCSVFilesInDocuments() -> [String]

// DocumentsディレクトリのURLを取得
static func getDocumentsDirectory() -> URL

// CSVファイルをDocumentsにコピー
static func copyCSVToDocuments(from sourceURL: URL, fileName: String) -> Bool

// DocumentsからCSVファイルを削除
static func deleteCSVFromDocuments(fileName: String) -> Bool
```

### QuestionItemRepository の使用方法

```swift
// CSV読み込み（ヘッダ駆動型）
let repository = QuestionItemRepository(fileName: "中学英単語")
switch repository.fetch() {
case .success(let items):
    print("読み込み成功: \(items.count)件")
case .failure(let error):
    print("読み込み失敗: \(error.localizedDescription)")
}
```

### CSVHeaderParser の使用方法

```swift
// CSVのヘッダを解析して表示ラベルマップを作成
let parser = CSVHeaderParser()
let headerLabels = parser.parseHeader(from: csvURL)
// 結果: ["term": "語句", "reading": "読み（ひらがな）", "meaning": "意味", ...]
```

---

## CSV管理画面の復元ガイド

### 現状
現在、専用のCSV管理画面（CSVManagerView）は実装されていません。

### 復元が必要な場合の実装ガイド

#### 1. 基本構造
```swift
// Features/CSVManager/CSVManagerView.swift
struct CSVManagerView: View {
    @State private var bundleFiles: [String] = []
    @State private var docFiles: [String] = []
    @State private var showImporter = false
    @State private var selectedFile: String?
    
    var body: some View {
        List {
            // Bundle内のCSV
            Section(header: Text("アプリ同梱")) {
                ForEach(bundleFiles, id: \.self) { file in
                    CSVFileRow(fileName: file, isEditable: false)
                }
            }
            
            // Documents内のCSV
            Section(header: Text("マイ問題集")) {
                ForEach(docFiles, id: \.self) { file in
                    CSVFileRow(fileName: file, isEditable: true)
                }
            }
        }
        .navigationTitle("問題集管理")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button(action: { showImporter = true }) {
                    Image(systemName: "plus")
                }
            }
        }
        .fileImporter(
            isPresented: $showImporter,
            allowedContentTypes: [.commaSeparatedText],
            onCompletion: handleImport
        )
        .onAppear(perform: loadFiles)
    }
    
    private func loadFiles() {
        bundleFiles = FileUtils.listBundleCSVFiles()
        docFiles = FileUtils.listCSVFilesInDocuments()
    }
    
    private func handleImport(result: Result<URL, Error>) {
        switch result {
        case .success(let url):
            guard url.startAccessingSecurityScopedResource() else { return }
            defer { url.stopAccessingSecurityScopedResource() }
            
            let fileName = url.lastPathComponent
            if FileUtils.copyCSVToDocuments(from: url, fileName: fileName) {
                loadFiles()
            }
        case .failure(let error):
            print("Import failed: \(error)")
        }
    }
}
```

#### 2. CSVファイル行のUI
```swift
struct CSVFileRow: View {
    let fileName: String
    let isEditable: Bool
    @State private var showPreview = false
    
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(fileName)
                    .font(.headline)
                if let count = getItemCount() {
                    Text("\(count)個の単語")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            Button(action: { showPreview = true }) {
                Image(systemName: "eye")
            }
            
            if isEditable {
                Button(action: deleteFile) {
                    Image(systemName: "trash")
                        .foregroundColor(.red)
                }
            }
        }
        .sheet(isPresented: $showPreview) {
            CSVPreviewView(fileName: fileName)
        }
    }
    
    private func getItemCount() -> Int? {
        let base = fileName.replacingOccurrences(of: ".csv", with: "")
        let repo = QuestionItemRepository(fileName: base)
        switch repo.fetch() {
        case .success(let items):
            return items.count
        case .failure:
            return nil
        }
    }
    
    private func deleteFile() {
        FileUtils.deleteCSVFromDocuments(fileName: fileName)
    }
}
```

#### 3. CSVプレビュー画面
```swift
struct CSVPreviewView: View {
    let fileName: String
    @State private var items: [QuestionItem] = []
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            List(items) { item in
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.term)
                        .font(.headline)
                    Text(item.reading)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Text(item.meaning)
                        .font(.body)
                }
            }
            .navigationTitle(fileName)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("閉じる") { dismiss() }
                }
            }
            .onAppear(perform: loadItems)
        }
    }
    
    private func loadItems() {
        let base = fileName.replacingOccurrences(of: ".csv", with: "")
        let repo = QuestionItemRepository(fileName: base)
        switch repo.fetch() {
        case .success(let loadedItems):
            items = loadedItems
        case .failure(let error):
            print("Failed to load: \(error)")
        }
    }
}
```

#### 4. ContentView への統合
```swift
// ContentView.swift
NavigationLink(destination: CSVManagerView()) {
    SectionCard {
        HStack(spacing: 12) {
            Image(systemName: "doc.text")
                .imageScale(.large)
                .foregroundColor(.accentColor)
            VStack(alignment: .leading, spacing: 4) {
                Text("問題集管理")
                    .font(.headline)
                    .foregroundColor(.primary)
                Text("CSVのインポート・削除")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .foregroundColor(Color(UIColor.tertiaryLabel))
        }
    }
}
.padding(.horizontal)
```

---

## エクスポート機能

### 実装方法
```swift
// CSVファイルをエクスポート（共有シート）
func exportCSV(fileName: String) {
    guard let url = FileUtils.getDocumentsDirectory()
        .appendingPathComponent(fileName) else { return }
    
    let activityVC = UIActivityViewController(
        activityItems: [url],
        applicationActivities: nil
    )
    
    // iPad対応
    if let popover = activityVC.popoverPresentationController {
        popover.sourceView = UIApplication.shared.windows.first?.rootViewController?.view
    }
    
    UIApplication.shared.windows.first?.rootViewController?
        .present(activityVC, animated: true)
}
```

### SwiftUIでの実装
```swift
.contextMenu {
    Button(action: { exportCSV(fileName: fileName) }) {
        Label("エクスポート", systemImage: "square.and.arrow.up")
    }
}
```

---

## インポート機能

### ファイルインポーター
```swift
.fileImporter(
    isPresented: $showImporter,
    allowedContentTypes: [.commaSeparatedText],
    allowsMultipleSelection: false
) { result in
    switch result {
    case .success(let urls):
        guard let url = urls.first else { return }
        importCSV(from: url)
    case .failure(let error):
        print("Import failed: \(error)")
    }
}

func importCSV(from url: URL) {
    guard url.startAccessingSecurityScopedResource() else { return }
    defer { url.stopAccessingSecurityScopedResource() }
    
    let fileName = url.lastPathComponent
    if FileUtils.copyCSVToDocuments(from: url, fileName: fileName) {
        // 成功時の処理
        loadFiles()
    }
}
```

---

## CSV検証

### 検証項目
1. **エンコーディング**: UTF-8であること
2. **ヘッダ**: 必須列が含まれること
3. **列数**: データ行がヘッダと同じ列数であること
4. **内容**: term と meaning が空でないこと

### 検証実装例
```swift
func validateCSV(at url: URL) -> Result<Int, CSVError> {
    let repo = QuestionItemRepository(fileName: url.deletingPathExtension().lastPathComponent)
    switch repo.fetch() {
    case .success(let items):
        if items.isEmpty {
            return .failure(.emptyFile)
        }
        return .success(items.count)
    case .failure(let error):
        return .failure(.parseError(error.localizedDescription))
    }
}

enum CSVError: LocalizedError {
    case emptyFile
    case parseError(String)
    case invalidEncoding
    
    var errorDescription: String? {
        switch self {
        case .emptyFile:
            return "CSVファイルが空です"
        case .parseError(let detail):
            return "CSV解析エラー: \(detail)"
        case .invalidEncoding:
            return "エンコーディングが不正です（UTF-8を使用してください）"
        }
    }
}
```

---

## 削除機能

### 実装方法
```swift
func deleteCSV(fileName: String) -> Bool {
    return FileUtils.deleteCSVFromDocuments(fileName: fileName)
}
```

### UI実装（スワイプ削除）
```swift
List {
    ForEach(docFiles, id: \.self) { file in
        CSVFileRow(fileName: file, isEditable: true)
    }
    .onDelete(perform: deleteFiles)
}

func deleteFiles(at offsets: IndexSet) {
    for index in offsets {
        let file = docFiles[index]
        _ = FileUtils.deleteCSVFromDocuments(fileName: file)
    }
    loadFiles()
}
```

---

## エラーハンドリング

### よくあるエラーと対処

#### 1. ファイルが見つからない
```swift
guard FileManager.default.fileExists(atPath: url.path) else {
    showError("ファイルが見つかりません")
    return
}
```

#### 2. 読み取り権限がない
```swift
guard url.startAccessingSecurityScopedResource() else {
    showError("ファイルへのアクセス権限がありません")
    return
}
defer { url.stopAccessingSecurityScopedResource() }
```

#### 3. CSV解析エラー
```swift
switch repository.fetch() {
case .success(let items):
    print("読み込み成功: \(items.count)件")
case .failure(let error):
    showError("CSV解析エラー: \(error.localizedDescription)")
}
```

#### 4. エンコーディングエラー
```swift
guard let content = try? String(contentsOf: url, encoding: .utf8) else {
    showError("UTF-8でエンコードされていません")
    return
}
```

---

## 将来の拡張案

### 1. CSV編集機能
- アプリ内でCSVを直接編集
- 行の追加・削除・編集
- 実装場所: `Features/CSVEditor/CSVEditorView.swift`（既に存在）

### 2. iCloud同期
- iCloud Driveとの同期
- 複数デバイス間でCSVを共有

### 3. CSVテンプレート
- 新規CSV作成用のテンプレート
- よく使う形式を選択して作成

### 4. バッチインポート
- 複数のCSVファイルを一括インポート
- ZIPファイルからの展開・インポート

---

## 関連ドキュメント

- `00_機能復元マスター仕様書_v3.md` - プロジェクト全体の概要
- `07_CSV編集_仕様書.md` - CSV編集機能の詳細
- `02_出題設定_仕様書_v2.md` - CSV選択機能

---

## 変更履歴

### v2 (2025-10-30)
- 現在の実装状況に合わせて全面改訂
- ヘッダ駆動型パーサーの仕様を追加
- 復元ガイドを追加

### v1 (2025-10-25)
- 初版作成
