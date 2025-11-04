# CSV固定列順での選択肢生成実装レポート

**作成日**: 2025年11月4日  
**対応内容**: CSVの固定列順（列3）を使用した選択肢生成の実装

---

## 📋 実装概要

クイズの選択肢生成において、ヘッダ駆動型パーサによる「汚染」を防ぎ、**CSV固定列順（列3：意味/和訳/史実名）** を直接使用して選択肢を生成するように実装しました。

### 問題点
- 以前の実装では `QuestionItem.meaning` フィールドを使用して選択肢を生成
- `meaning` フィールドはヘッダ駆動型パーサで解釈されたデータ
- ヘッダの解釈によって選択肢が「汚染」される可能性があった

### 解決策
- `QuestionItem` に **生のCSV列データ (`rawColumns: [String]`)** を追加
- 選択肢生成時に **固定列3 (`rawColumns[2]`)** を直接使用
- ヘッダ駆動型パーサの影響を受けない、純粋なCSVデータから選択肢を生成

---

## ✅ 実装内容

### 1. QuestionItem モデルの拡張

**ファイル**: `Common/Models/QuestionItem.swift`

```swift
public struct QuestionItem: Identifiable, Hashable {
    public let id: UUID
    public let term: String
    public let reading: String
    public let meaning: String
    public let etymology: String
    public let relatedWords: [String]
    public let relatedFields: [String]
    public let difficulty: String
    
    /// CSV生データ（固定列順での選択肢生成用）
    /// 選択肢生成時に固定列3（rawColumns[2]）を使用する
    public let rawColumns: [String]  // 🆕 追加
    
    public init(term: String,
                reading: String,
                meaning: String,
                etymology: String,
                relatedWordsCSV: String,
                relatedFieldsCSV: String,
                difficulty: String,
                rawColumns: [String] = [],  // 🆕 追加（デフォルト値で後方互換性）
                id: UUID? = nil) {
        // ...初期化処理
        self.rawColumns = rawColumns  // 🆕 保存
    }
}
```

**変更点**:
- `rawColumns: [String]` プロパティを追加
- CSV生データをそのまま保存し、固定列順での選択肢生成に使用
- デフォルト値 `[]` で後方互換性を維持

---

### 2. QuestionItemParser の更新

**ファイル**: `Common/Data/Parcer/QuestionItemParser.swift`

#### 固定列順パーサ
```swift
public static func makeParser() -> CSVLineParser<QuestionItem> {
    CSVLineParser { lineNumber, columns in
        // ...既存のパース処理
        
        return QuestionItem(
            term: term,
            reading: reading,
            meaning: meaning,
            etymology: etymology,
            relatedWordsCSV: relatedWordsCSV,
            relatedFieldsCSV: relatedFieldsCSV,
            difficulty: difficulty,
            rawColumns: columns,  // 🆕 生のCSV列データを保存
            id: UUID()
        )
    }
}
```

#### ヘッダ駆動型パーサ
```swift
public static func makeHeaderDrivenParser() -> (Int, [String], [String: Int]) throws -> QuestionItem {
    return { lineNumber, columns, mapping in
        // ...既存のマッピング処理
        
        return QuestionItem(
            term: term,
            reading: reading,
            meaning: meaning,
            etymology: etymology,
            relatedWordsCSV: relatedWordsCSV,
            relatedFieldsCSV: relatedFieldsCSV,
            difficulty: difficulty,
            rawColumns: columns,  // 🆕 生のCSV列データを保存
            id: UUID()
        )
    }
}
```

**変更点**:
- 両方のパーサで `rawColumns: columns` を渡すように更新
- CSV生データを保存し、後で固定列順でアクセス可能に

---

### 3. CSVLoader の更新

**ファイル**: `SimpleWord/Utils/CSVLoader.swift`

```swift
private func parseItemFromColumns(_ columns: [String], mapping: [String: Int], lineNumber: Int) throws -> QuestionItem {
    // ...既存のマッピング処理
    
    return QuestionItem(
        term: term,
        reading: reading,
        meaning: meaning,
        etymology: etymology,
        relatedWordsCSV: relatedWordsCSV,
        relatedFieldsCSV: relatedFieldsCSV,
        difficulty: difficulty,
        rawColumns: columns,  // 🆕 生のCSV列データを保存
        id: UUID()
    )
}
```

**変更点**:
- `parseItemFromColumns` メソッドで `rawColumns: columns` を渡すように更新

---

### 4. QuizQuestionGenerator の更新（メイン実装）

**ファイル**: `SimpleWord/Features/Quiz/Services/QuizQuestionGenerator.swift`

```swift
struct QuizQuestionGenerator {
    
    func generateChoices(
        correctItem: QuestionItem,
        allItems: [QuestionItem],
        numberOfChoices: Int
    ) -> (choices: [QuizChoice], correctAnswerID: UUID) {
        
        // 正解の選択肢を作成
        // 🆕 固定列3（rawColumns[2]）を使用して選択肢テキストを取得
        let correctChoiceLabel = getChoiceLabel(from: correctItem)
        
        let correctChoice = QuizChoice(
            id: UUID(),
            label: correctChoiceLabel,  // 🆕 固定列3の値を使用
            explanation: correctItem.etymology,
            isCorrect: true,
            item: correctItem
        )
        // ...以下、不正解の選択肢も同様に処理
    }
    
    // MARK: - Private Methods
    
    /// QuestionItemから選択肢ラベルを取得（固定列3を使用）
    private func getChoiceLabel(from item: QuestionItem) -> String {
        // rawColumnsが存在し、列3（インデックス2）が存在する場合はそれを使用
        if item.rawColumns.count >= 3 {
            return item.rawColumns[2]  // 🆕 固定列3を直接使用
        }
        // フォールバック: rawColumnsがない場合はmeaningフィールドを使用
        return item.meaning
    }
}
```

**変更点**:
- `getChoiceLabel(from:)` メソッドを追加
- **固定列3 (`rawColumns[2]`)** を直接使用して選択肢を生成
- `rawColumns` がない場合は `meaning` フィールドにフォールバック（後方互換性）

---

## 🎯 動作原理

### CSV固定列順の定義

| 列番号 | 列名（例） | 内容 | インデックス |
|--------|-----------|------|-------------|
| 列1 | 語句 | term | 0 |
| 列2 | 読み/発音 | reading | 1 |
| **列3** | **意味/和訳/史実名** | **meaning** | **2** 🎯 |
| 列4 | 語源/解説 | etymology | 3 |
| 列5 | 関連語 | relatedWords | 4 |
| 列6 | 関連分野 | relatedFields | 5 |
| 列7 | 難易度 | difficulty | 6 |

### 選択肢生成の流れ

1. **CSV読み込み**
   ```
   CSV行: ["Hello!", "ハロー", "こんにちは", "英語の挨拶", "Hi:やあ", "感情", "1"]
   ```

2. **QuestionItem作成**
   ```swift
   QuestionItem(
       term: "Hello!",           // rawColumns[0]
       reading: "ハロー",         // rawColumns[1]
       meaning: "こんにちは",     // rawColumns[2] ← ヘッダ駆動で決定
       etymology: "英語の挨拶",   // rawColumns[3]
       ...
       rawColumns: ["Hello!", "ハロー", "こんにちは", "英語の挨拶", "Hi:やあ", "感情", "1"]
   )
   ```

3. **選択肢生成**
   ```swift
   // ❌ 以前（ヘッダ駆動の影響を受ける）
   label: item.meaning  // ヘッダ解釈による値
   
   // ✅ 現在（固定列3を直接使用）
   label: item.rawColumns[2]  // "こんにちは" - CSV生データ
   ```

---

## 📊 CSVタイプ別の列3の内容

### 中学英会話
- **列3**: 和訳（日本語）
- **例**: "Hello!" → "こんにちは"

### 中学古典単語
- **列3**: 意味（現代語訳）
- **例**: "いと" → "とても"

### 中学歴史
- **列3**: 史実名
- **例**: "4世紀頃" → "大和政権の成立"

すべてのCSVタイプで、**列3が選択肢として表示される値**です。

---

## ✅ 後方互換性

### rawColumns がない場合のフォールバック

```swift
private func getChoiceLabel(from item: QuestionItem) -> String {
    if item.rawColumns.count >= 3 {
        return item.rawColumns[2]  // 固定列3を使用
    }
    return item.meaning  // フォールバック
}
```

- 既存のテストや古いデータソースでも動作
- `rawColumns` が空の場合は `meaning` フィールドを使用

---

## 🧪 テスト

### 作成したテストファイル

1. **QuizQuestionGeneratorTests.swift**
   - 固定列3を使用した選択肢生成のユニットテスト
   - フォールバック動作のテスト

2. **CSVFixedColumnChoiceGenerationTests.swift**
   - CSV読み込みから選択肢生成までの統合テスト
   - 中学英会話・中学古典単語の実データでテスト
   - 選択肢汚染のチェック

### テスト実行方法

```bash
# QuizQuestionGeneratorTests のみ実行
xcodebuild test -project SimpleWord.xcodeproj -scheme SimpleWord \
  -destination 'platform=iOS Simulator,name=Any iOS Simulator Device' \
  -only-testing:SimpleWordTests/QuizQuestionGeneratorTests

# CSVFixedColumnChoiceGenerationTests のみ実行
xcodebuild test -project SimpleWord.xcodeproj -scheme SimpleWord \
  -destination 'platform=iOS Simulator,name=Any iOS Simulator Device' \
  -only-testing:SimpleWordTests/CSVFixedColumnChoiceGenerationTests

# すべてのテスト実行
xcodebuild test -project SimpleWord.xcodeproj -scheme SimpleWord \
  -destination 'platform=iOS Simulator,name=Any iOS Simulator Device'
```

---

## 🔍 検証ポイント

### ✅ 実装済み
1. `QuestionItem` に `rawColumns` プロパティを追加
2. すべてのパーサで `rawColumns` を保存
3. `QuizQuestionGenerator` で固定列3を使用
4. 後方互換性を維持（フォールバック実装）
5. ユニットテスト・統合テスト作成

### 🎯 確認事項
1. CSVから読み込んだデータに `rawColumns` が正しく保存される
2. 選択肢生成時に `rawColumns[2]` が使用される
3. ヘッダ駆動型パーサの影響を受けない
4. すべてのCSVタイプ（英会話、古典、歴史）で正しく動作

---

## 📝 使用例

### クイズ画面での動作

```swift
// QuizView.swift（既存コード - 変更不要）
let result = generator.generateChoices(
    correctItem: currentItem,
    allItems: allQuestions,
    numberOfChoices: settings.numberOfChoices
)

// 選択肢が固定列3（rawColumns[2]）から生成される
// 例: "こんにちは", "元気ですか", "はじめまして", "私の名前は〜"
```

### ヘッダ駆動と固定列順の違い

| 項目 | ヘッダ駆動型（以前） | 固定列順（現在） |
|------|-------------------|-----------------|
| データ取得 | `item.meaning` フィールド | `item.rawColumns[2]` |
| ヘッダの影響 | **受ける**（汚染の可能性） | **受けない** |
| データソース | パーサが解釈した値 | CSV生データ |
| 安全性 | 低（ヘッダ次第） | **高（常に列3）** |

---

## 🚀 今後の拡張

### 1. 他の列の使用
固定列順で他の列も使用したい場合：
```swift
// 例: 列1（term）を問題文として使用
let questionText = item.rawColumns[0]

// 例: 列2（reading）を補助情報として使用
let readingHint = item.rawColumns[1]
```

### 2. 列数の検証
```swift
guard item.rawColumns.count == 7 else {
    throw DataSourceError.invalidData("列数不正: \(item.rawColumns.count)")
}
```

### 3. CSVスキーマの明示化
```swift
enum CSVColumn {
    static let term = 0
    static let reading = 1
    static let meaning = 2  // 選択肢として使用
    static let etymology = 3
    // ...
}

let choiceLabel = item.rawColumns[CSVColumn.meaning]
```

---

## 🎉 まとめ

### 達成したこと
✅ CSV固定列順（列3）を使用した選択肢生成の実装  
✅ ヘッダ駆動型パーサによる「汚染」を防止  
✅ 後方互換性を維持（フォールバック実装）  
✅ ビルド成功 (`BUILD SUCCEEDED`)  
✅ テストコード作成  

### 技術的なポイント
- `rawColumns` による生データ保持
- 固定列順（インデックスベース）でのアクセス
- ヘッダ駆動型と固定列順のハイブリッド設計
- クリーンアーキテクチャの維持

### 次のステップ
1. テスト実行と結果確認
2. 実機/シミュレータでの動作確認
3. CSVファイルの検証（列数・データ整合性）
4. ドキュメント更新

---

**実装完了日**: 2025年11月4日  
**ビルド状態**: ✅ SUCCESS
