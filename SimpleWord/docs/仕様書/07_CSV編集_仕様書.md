# CSV編集（アプリ内での簡易編集機能）

**最終更新: 2025-10-19**

この文書は、アプリ内CSV編集機能の編集・実装ガイドです。

## 概要

### 何を実現しているか
- アプリ内でCSVの内容を一覧表示
- 個別の単語項目の編集（語句、読み、意味、関連語など）
- 編集内容のリアルタイム保存
- 簡易的な追加・削除機能

### 推奨する使い方
- **大規模編集**: PC の表計算ソフト（Excel、Numbers等）で実施
- **アプリ内編集**: 誤字修正や微調整に使用
- **点検・確認**: アプリで内容を確認し、問題があれば外部で修正

## 画面構成

### CSV選択
```
[CSV選択ピッカー]
中学英単語.csv ▼
```

### 単語一覧
```
┌─────────────────────────┐
│ example                  │
│ 例、見本                 │
│ [編集] [削除]           │
├─────────────────────────┤
│ practice                 │
│ 練習、実践               │
│ [編集] [削除]           │
└─────────────────────────┘
[+ 新規追加]
```

### 編集画面
```
語句: [example        ]
読み: [イグザンプル     ]
意味: [例、見本        ]
語源: [ラテン語...      ]
関連語: [sample;instance]
分野: [English         ]
難易度: [中級          ]

[保存] [キャンセル]
```

## 関係するファイル

### 画面
- **CSVEditorView.swift** - CSV編集のメイン画面
- **CSVItemListEditorView.swift** - 単語一覧表示
- **CSVItemEditView.swift** - 個別単語の編集フォーム

### ユーティリティ
- **CSVDocument.swift** - CSV読み書きのラッパー
- **CSVLoader.swift** - CSV解析
- **FileUtils.swift** - ファイル操作

### データモデル
- **QuestionItem.swift** - 編集対象のデータ構造

## 主要な処理

### CSV読み込み
```swift
func loadCSV(named: String) {
    let loader = CSVLoader()
    
    // Documents優先で読み込み
    if let docURL = FileUtils.documentsDirectory?.appendingPathComponent(named) {
        if FileManager.default.fileExists(atPath: docURL.path) {
            items = (try? loader.load(from: docURL)) ?? []
            currentURL = docURL
            return
        }
    }
    
    // Bundleから読み込み（読み取り専用）
    let baseName = named.replacingOccurrences(of: ".csv", with: "")
    items = (try? loader.loadFromBundle(named: baseName)) ?? []
    isReadOnly = true
}
```

### 単語の編集
```swift
func updateItem(at index: Int, with newItem: QuestionItem) {
    guard index < items.count else { return }
    items[index] = newItem
    
    // 即座に保存
    saveCSV()
}

func saveCSV() {
    guard !isReadOnly, let url = currentURL else {
        showError("読み取り専用のCSVは編集できません")
        return
    }
    
    // CSV形式で書き出し
    let csvString = generateCSVString(from: items)
    
    do {
        try csvString.write(to: url, atomically: true, encoding: .utf8)
    } catch {
        showError("保存に失敗しました: \(error.localizedDescription)")
    }
}
```

### CSV文字列の生成
```swift
func generateCSVString(from items: [QuestionItem]) -> String {
    var lines: [String] = []
    
    // ヘッダー
    lines.append("語句,読み（ひらがな）,意味,語源等解説（日本語）,関連語と意味,関連分野,難易度")
    
    // データ行
    for item in items {
        let fields = [
            escapeCSVField(item.term),
            escapeCSVField(item.reading),
            escapeCSVField(item.meaning),
            escapeCSVField(item.etymology),
            item.relatedWords.joined(separator: ";"),
            item.relatedFields.joined(separator: ";"),
            escapeCSVField(item.difficulty)
        ]
        lines.append(fields.joined(separator: ","))
    }
    
    return lines.joined(separator: "\n")
}

func escapeCSVField(_ field: String) -> String {
    // カンマや改行を含む場合はダブルクォートで囲む
    if field.contains(",") || field.contains("\n") || field.contains("\"") {
        let escaped = field.replacingOccurrences(of: "\"", with: "\"\"")
        return "\"\(escaped)\""
    }
    return field
}
```

## 編集時の注意点

### Bundle CSVは編集不可
**重要**: アプリ同梱のCSVは読み取り専用

```swift
// Bundle CSVの検出
var isReadOnly: Bool {
    guard let url = currentURL else { return true }
    return !url.path.contains(FileUtils.documentsDirectory?.path ?? "")
}

// UI での制御
if isReadOnly {
    Text("このCSVは読み取り専用です")
        .foregroundColor(.orange)
}

Button("保存") {
    saveCSV()
}
.disabled(isReadOnly)
```

**チェックポイント**:
- [ ] Bundle CSVで編集ボタンが無効化される
- [ ] 保存しようとするとエラーメッセージが表示される
- [ ] Documents にコピーすれば編集可能になる

### データ検証
**実装箇所**: 保存前のバリデーション

```swift
func validateItem(_ item: QuestionItem) -> ValidationResult {
    var errors: [String] = []
    
    // 必須フィールドチェック
    if item.term.isEmpty {
        errors.append("語句は必須です")
    }
    if item.meaning.isEmpty {
        errors.append("意味は必須です")
    }
    
    // 重複チェック
    let duplicates = items.filter { 
        $0.id != item.id && $0.term == item.term && $0.meaning == item.meaning 
    }
    if !duplicates.isEmpty {
        errors.append("同じ語句と意味の組み合わせが既に存在します")
    }
    
    return ValidationResult(isValid: errors.isEmpty, errors: errors)
}
```

### CSVフォーマットの維持
**重要**: CSVLoaderと互換性のある形式を保つ

```swift
// CSVLoader が期待するヘッダー
let requiredHeaders = [
    "term", "reading", "meaning", "etymology",
    "relatedWords", "relatedFields", "difficulty"
]

// セミコロン区切りのフィールド
// relatedWords: "word1;word2;word3"
// relatedFields: "field1;field2"
```

**チェックポイント**:
- [ ] ヘッダー行が正しい
- [ ] フィールド数が一致する
- [ ] セミコロン区切りが保たれる
- [ ] エスケープ処理が正確

## テスト観点

### 基本動作
- [ ] CSV読み込みが成功する
- [ ] 単語一覧が表示される
- [ ] 編集フォームが開く
- [ ] 保存が成功する
- [ ] 再読み込みで変更が反映される

### データ整合性
- [ ] 日本語（マルチバイト文字）が正しく保存される
- [ ] カンマを含む文字列が正しくエスケープされる
- [ ] 改行を含むフィールドが正しく処理される
- [ ] 特殊文字（"、;など）が正しく扱われる

### エラーハンドリング
- [ ] Bundle CSVの編集を防止
- [ ] 必須フィールドの空欄をチェック
- [ ] 重複エントリを検出
- [ ] 保存失敗時のエラーメッセージ

### UI/UX
- [ ] 編集中の変更が即座に反映される（保存後）
- [ ] キャンセルで変更を破棄できる
- [ ] 削除前に確認ダイアログが表示される

## よくある編集パターン

### 一括置換
```swift
func replaceAll(from: String, to: String, in field: KeyPath<QuestionItem, String>) {
    for index in items.indices {
        let currentValue = items[index][keyPath: field]
        let newValue = currentValue.replacingOccurrences(of: from, with: to)
        // KeyPath を使った書き込みは複雑なので、個別に更新
        var updated = items[index]
        // field に応じて更新...
        items[index] = updated
    }
    saveCSV()
}
```

### インポート/エクスポート
```swift
// CSV を Documents にコピー（Bundle → Documents）
func copyToDocuments(csvName: String) {
    guard let bundleURL = Bundle.main.url(forResource: csvName, withExtension: "csv"),
          let docDir = FileUtils.documentsDirectory else {
        return
    }
    
    let destURL = docDir.appendingPathComponent("\(csvName).csv")
    
    do {
        try FileManager.default.copyItem(at: bundleURL, to: destURL)
    } catch {
        print("コピー失敗: \(error)")
    }
}
```

## トラブルシューティング

### 保存したのに反映されない
- 正しいファイルパスに保存されているか確認
- キャッシュのクリアが必要か確認
- CSV読み込みのリフレッシュを実行

### 文字化けが発生
- UTF-8 エンコーディングを確認
- BOM（Byte Order Mark）の有無を確認
- Excel等で開く場合は UTF-8 with BOM を使用

### CSVが壊れた
- バックアップから復元
- CSVLoader でエラーメッセージを確認
- 手動でフォーマットを修正

## 関連ドキュメント
- `.copilot/structure-map.md` - ファイル構成
- `CSVLoader.swift` - CSV解析の詳細
- `03_問題集管理_CSV_仕様書.md` - CSV管理全般
