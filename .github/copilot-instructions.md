# GitHub Copilot 指示ファイル

**作成日**: 2025年10月28日  
**最終更新**: 2025年11月8日  
**対応内容**: CSV種類別に最適化された選択肢カード詳細表示の実装、ファイル配置規約、ファイル命名規則、セキュリティとパフォーマンス要件の統合

---

## � ファイル命名規則（最重要）

### ✅ docs/配下のファイル命名ルール

**すべてのドキュメントファイルは、ナンバリング+日本語タイトルで命名してください。**

#### 必須形式
```
XX-YY_日本語タイトル.md
```

- `XX`: 親フォルダ番号（01, 02, 03, 04, 99）
- `YY`: ファイル番号（01, 02, 03...）
- タイトル: **必ず日本語で記述**（英語タイトルは禁止）

#### 命名例

**正しい命名（✅）**
```
03-01_ファイル配置規約.md
03-02_適応学習ガイド.md
04-05_CSV固定列選択肢生成レポート.md
01-01_プロジェクト概要.md
```

**間違った命名（❌）**
```
FILE_ORGANIZATION.md          # 英語タイトル、ナンバリングなし
TEST_GUIDE.md                 # 英語タイトル、ナンバリングなし
CSV_REPORT.md                 # 英語タイトル、ナンバリングなし
guide.md                      # 曖昧、ナンバリングなし
```

### 🤖 AI作成時の必須ルール

**新規ドキュメント作成時は、必ずナンバリング+日本語タイトルで命名すること。**

❌ 禁止:
```
「テストガイドを作成して」
→ TEST_GUIDE.md が作成される（ルール違反）
```

✅ 正しい指示:
```
「03-06_パフォーマンステストガイド.md を docs/03_開発ガイド/ に作成して」
→ 正しい命名規則で作成される
```

---

## �📁 ファイル配置規約（重要）

### ✅ ルート直下に配置して良いファイル

以下のファイル**のみ**をプロジェクトルートに配置可能：
- `README.md` - プロジェクトの概要・使い方
- `CHANGELOG.md` - バージョン履歴
- `LICENSE` - ライセンスファイル
- `.gitignore` - Git除外設定

### ❌ ルート直下に配置してはいけないファイル

- ログファイル（`*.log`） → `logs/`に配置
- 実装レポート（`*_REPORT.md`等） → `docs/04_レポート/`に配置（ナンバリング+日本語タイトルで）
- ガイドドキュメント（`*_GUIDE.md`） → `docs/03_開発ガイド/`に配置（ナンバリング+日本語タイトルで）
- テスト出力ファイル → `logs/`または`tmp/`に配置
- 一時ファイル（`*.tmp`, `*.temp`） → `tmp/`に配置
- バックアップファイル（`*.backup`, `*_V2.md`等） → `docs/99_アーカイブ/`に配置

### 📂 ファイル種類別の配置場所と命名例

| ファイル種類 | 配置先 | 命名例 |
|-------------|--------|--------|
| ガイド・チュートリアル | `docs/03_開発ガイド/` | `03-03_テストガイド.md` |
| 実装レポート・設計書 | `docs/04_レポート/` | `04-05_CSV固定列選択肢生成レポート.md` |
| 仕様書 | `docs/01_仕様書/` | `01-01_プロジェクト概要.md` |
| 実装ガイド | `docs/02_実装ガイド/` | `02-02_コーディング規約.md` |
| アーカイブ | `docs/99_アーカイブ/` | `99-01_README復元版.md` |
| ログファイル | `logs/` (.gitignore) | `*.log` |
| 一時ファイル | `tmp/` (.gitignore) | `*.tmp` |

### 🤖 AI自動ドキュメント分類フロー（最重要）

**ユーザーがフォルダやファイル名を指定しない場合、AIが以下のフローで自動判断してください。**

#### ステップ1: ドキュメント内容の分析

ユーザーの指示内容から、作成するドキュメントの種類を判断：

**判断基準**:

1. **仕様書系** → `docs/01_仕様書/`
   - キーワード: 「仕様」「要件」「設計」「アーキテクチャ」「API仕様」
   - 例: 「プロジェクトの仕様書を作成して」

2. **実装ガイド系** → `docs/02_実装ガイド/`
   - キーワード: 「実装方法」「コーディング」「規約」「ベストプラクティス」
   - 例: 「コーディング規約を作成して」

3. **開発ガイド系** → `docs/03_開発ガイド/`
   - キーワード: 「ガイド」「チュートリアル」「使い方」「セットアップ」「テスト」
   - 例: 「テストの実行方法をドキュメント化して」

4. **レポート系** → `docs/04_レポート/`
   - キーワード: 「レポート」「報告」「実装結果」「変更履歴」「サマリ」「完了」
   - 例: 「今回の実装をレポートにまとめて」

5. **アーカイブ系** → `docs/99_アーカイブ/`
   - キーワード: 「アーカイブ」「古い」「バックアップ」「廃止」
   - 例: 「古いドキュメントをアーカイブ化して」

#### ステップ2: 自動ナンバリング

該当フォルダ内の既存ファイルを確認し、次の番号を自動割り当て：

```bash
# 例: docs/03_開発ガイド/に05まで存在する場合
ls docs/03_開発ガイド/ | grep "^03-"
→ 03-01, 03-02, 03-03, 03-04, 03-05 が存在
→ 新規ファイルは 03-06 とする
```

#### ステップ3: 日本語タイトルの生成

ユーザーの指示から適切な日本語タイトルを生成：

**生成ルール**:
- 簡潔で内容が分かるタイトル（5-15文字程度）
- 英語は使わない
- 略語は避ける（CSV→CSV、API→APIは例外）

**例**:
```
「パフォーマンステストの方法をドキュメント化」
→ 03-06_パフォーマンステストガイド.md

「CSV解析の実装結果をまとめて」
→ 04-07_CSV解析実装レポート.md

「データベース設計の仕様を書いて」
→ 01-05_データベース設計仕様.md
```

#### ステップ4: ファイル作成の確認

ファイル作成前に、以下を確認：

```
【作成するファイル】
パス: docs/04_レポート/04-07_機能実装レポート.md
理由: 実装結果のレポートのため、04_レポート/に配置
ナンバリング: 既存の04-06まで存在、次は04-07

このファイルを作成します。
```

#### ステップ5: ファイル作成

確認後、ファイルを作成し、適切な内容を記述。

---

### 📝 AI自動分類の実例

#### 例1: ユーザー指示が曖昧な場合

**ユーザー**: 「テストの実行方法をドキュメント化して」

**AIの判断**:
1. キーワード「テスト」「方法」→ 開発ガイド系
2. フォルダ: `docs/03_開発ガイド/`
3. 既存ファイル確認: 03-05まで存在
4. 新規ナンバー: 03-06
5. タイトル生成: 「テスト実行ガイド」
6. 作成: `docs/03_開発ガイド/03-06_テスト実行ガイド.md`

#### 例2: レポート作成

**ユーザー**: 「今回のリファクタリングをまとめて」

**AIの判断**:
1. キーワード「まとめて」→ レポート系
2. フォルダ: `docs/04_レポート/`
3. 既存ファイル確認: 04-06まで存在
4. 新規ナンバー: 04-07
5. タイトル生成: 「リファクタリング実装レポート」
6. 作成: `docs/04_レポート/04-07_リファクタリング実装レポート.md`

#### 例3: 仕様書作成

**ユーザー**: 「APIの仕様を書いて」

**AIの判断**:
1. キーワード「API」「仕様」→ 仕様書系
2. フォルダ: `docs/01_仕様書/`
3. 既存ファイル確認: 01-04まで存在
4. 新規ナンバー: 01-05
5. タイトル生成: 「API仕様」
6. 作成: `docs/01_仕様書/01-05_API仕様.md`

---

### ⚠️ 重要な注意事項

1. **必ず自動判断を実行**: ユーザーがフォルダを指定しない場合、上記フローで判断してください
2. **ルート直下に作成しない**: ドキュメントは必ず`docs/`配下に配置
3. **英語タイトル禁止**: タイトルは必ず日本語で生成
4. **ナンバリング必須**: 必ず`XX-YY_`形式で命名

詳細は`docs/03_開発ガイド/03-01_ファイル配置規約.md`を参照してください。

---

## 📋 実装概要

回答後の選択肢カードの詳細表示を、CSV種類（中学歴史、中学古典単語、中学英単語・英会話など）に応じて最適な順序で表示するように実装しました。

**重要**: 選択肢自体は**CSV固定列3（`rawColumns[2]`：意味/和訳/史実名）**から生成されます。これにより、ヘッダ駆動型パーサの影響を受けずに正確な選択肢が表示されます。

---

## ✅ 実装内容

### 1. CSV種類の判定ロジック

**ファイル**: `SimpleWord/QuizComponents/ChoiceCardView.swift`

**CSV種類の定義**:
```swift
private enum CSVType {
    case history    // 中学歴史
    case classical  // 中学古典単語
    case english    // 中学英単語・英熟語・英会話・xcode
}
```

**判定方法**:
CSVヘッダラベル（`headerLabels`）の内容から自動判定：
- **中学歴史**: `term`に「年号」、`reading`に「登場人物」、`meaning`に「史実」が含まれる
- **中学古典単語**: `reading`に「ひらがな」が含まれる
- **中学英単語・英会話**: `reading`に「カタカナ」または「発音」が含まれる、または`meaning`に「和訳」が含まれる

### 2. 各CSV種類別の表示順序

#### パターン1: 中学歴史
**表示順序**: 年号 → 史実名（表示済み） → 解説 → 登場人物 → 関連史実 → 関連分野 & 難易度

**実装関数**: `displayHistoryDetails(_:_:)`

**表示例**:
```
大和政権の成立 ✓

年号: 4世紀頃
解説: 弥生時代後期に各地の豪族が力を持つようになる...
登場人物: 大和朝廷の豪族たち
関連史実: 古墳文化・律令以前の統合過程
関連分野: その他  難易度: 2
```

**特徴**:
- 史実名（meaning）はメインテキストで既に表示されているため詳細では省略
- 時系列がわかる「年号」を最初に表示
- 「解説」で史実の背景を説明
- 「登場人物」で関係者を明示

#### パターン2: 中学古典単語
**表示順序**: 語句 → 発音 → 意味（表示済み） → 用法 → 関連語 → 関連分野 & 難易度

**実装関数**: `displayClassicalDetails(_:_:)`

**表示例**:
```
しみじみとした情趣 ✓

語句: あはれ
読み: あはれ
用法: 感動詞「あはれ」から
関連語: 「もののあはれ」
関連分野: 文学・美学  難易度: 2
```

**特徴**:
- 意味（meaning）はメインテキストで既に表示されているため詳細では省略
- 「語句」と「読み」を並べて表示（古典単語の学習に重要）
- 「用法」として語源等解説を表示（古典では用法が重要）

#### パターン3: 中学英単語・英熟語・英会話・xcode
**表示順序**: 語句(発音) → 和訳（表示済み） → 語源等解説 → 関連語と意味 → 関連分野 & 難易度

**実装関数**: `displayEnglishDetails(_:_:)`

**表示例**:
```
こんにちは！ ✓

語句: Hello! (ハロー)
語源等解説: 古英語の挨拶語
関連語と意味: Hi / やあ
関連分野: 挨拶  難易度: 1
```

**特徴**:
- 和訳（meaning）はメインテキストで既に表示されているため詳細では省略
- **発音を語句の直後に括弧付きで表示**（英語学習に重要）
- 「語源等解説」で単語の由来を説明
- 「関連語と意味」で類似表現を学習

---

## 🎯 共通仕様

### 1. メインテキストとの重複回避
すべてのパターンで、選択肢のメインテキスト（`meaning`）は詳細情報では表示しません。
- **理由**: 情報の重複を避け、画面をすっきりさせるため
- **効果**: ユーザーが必要な情報を見つけやすくなる

### 2. 関連分野と難易度の1行表示
すべてのパターンで、関連分野と難易度を1行にまとめて表示します。
- **理由**: 画面スペースの効率的な利用
- **表示**: `関連分野: その他  難易度: 2`

### 3. 動的なラベル表示
CSVヘッダの実際の列名を優先的に使用します。
- **例**: CSVヘッダが「史実名」なら「史実名:」と表示
- **フォールバック**: ヘッダがない場合はデフォルトラベルを使用

---

## 📊 技術的な実装詳細

### 1. ViewBuilder構文の活用
各表示関数は`@ViewBuilder`を使用し、条件付きレンダリングを実現：
```swift
@ViewBuilder
private func displayHistoryDetails(_ questionItem: QuestionItem, _ textColor: Color) -> some View {
    Group {
        if !questionItem.term.isEmpty {
            // 年号を表示
        }
        if !questionItem.etymology.isEmpty {
            // 解説を表示
        }
        // ...
    }
}
```

### 2. 共通ヘルパー関数
`labelFor(_:fallback:)`関数でラベル取得ロジックを共通化：
```swift
private func labelFor(_ key: String, fallback: String) -> String {
    if let header = headerLabels[key], !header.isEmpty {
        return header.hasSuffix(":") ? header : "\(header):"
    }
    return fallback
}
```

### 3. CSV種類の自動判定
ヘッダラベルの内容から自動的にCSV種類を判定し、適切な表示関数を呼び出し：
```swift
let csvType = detectCSVType(from: headerLabels)

switch csvType {
case .history:
    displayHistoryDetails(questionItem, textColor)
case .classical:
    displayClassicalDetails(questionItem, textColor)
case .english:
    displayEnglishDetails(questionItem, textColor)
}
```

---

## ✅ 検証結果

### ビルド結果
- **コンパイルエラー**: なし ✅
- **警告**: なし ✅
- **ビルドステータス**: BUILD SUCCEEDED ✅

### コード品質
- **構文チェック**: 正常 ✅
- **型チェック**: 正常 ✅
- **ViewBuilder構文**: 正しく動作 ✅

---

## 🎯 対応するCSVファイル

### 自動判定されるCSV種類

1. **中学歴史** (`history`)
   - ヘッダ: `年号,登場人物,史実名,解説,関連史実,関連分野,難易度`
   - 判定条件: 「年号」「登場人物」「史実」が含まれる

2. **中学古典単語** (`classical`)
   - ヘッダ: `語句,読み（ひらがな）,意味,語源等解説（日本語）,関連語と意味,関連分野,難易度`
   - 判定条件: 「ひらがな」が含まれる

3. **中学英単語・英熟語・英会話・xcode** (`english`)
   - ヘッダ: `語句,発音（カタカナ）,和訳,語源等解説（日本語）,関連語（英語）と意味（日本語）,関連分野（日本語）,難易度`
   - 判定条件: 「カタカナ」「発音」「和訳」が含まれる

---

## 🚀 今後の拡張性

### 新しいCSV種類の追加
新しいCSV種類を追加する場合：

1. `CSVType` enumに新しいケースを追加
2. `detectCSVType`関数に判定ロジックを追加
3. 専用の表示関数を作成（例: `displayNewTypeDetails`）
4. `switch`文に新しいケースを追加

### カスタマイズ可能な点
- 表示順序の変更（関数内の順序を入れ替え）
- 表示する項目の追加/削除（条件分岐で制御）
- ラベルのカスタマイズ（`labelFor`のフォールバック値を変更）

---

## 📝 まとめ

### 達成できたこと
✅ CSV種類を自動判定する機能を実装  
✅ 中学歴史の最適な表示順序を実装  
✅ 中学古典単語の最適な表示順序を実装  
✅ 中学英単語・英会話の最適な表示順序を実装（発音表示を含む）  
✅ メインテキストとの重複を排除  
✅ 動的なラベル表示に対応  
✅ すべてのビルドエラー・警告を解消  

### ユーザーへの影響
- CSV種類に応じた最適な情報表示順序
- 各科目の学習に必要な情報が適切な順序で表示される
- 画面が読みやすく、理解しやすい
- 英語学習では発音が語句の直後に表示され、学習効率が向上

### 次のステップ
アプリを起動して以下を確認してください：
1. **中学歴史**で回答後、年号→解説→登場人物の順に表示される
2. **中学古典単語**で回答後、語句→読み→用法の順に表示される
3. **中学英会話**で回答後、語句(発音)→語源等解説→関連語の順に表示される
4. すべてのCSVで適切な表示順序になっている

---

**以上、CSV種類別の最適な表示順序の実装が完了しました！** 🎉

---

## 🔒 セキュリティとパフォーマンス設計原則（必須）

**重要**: 本プロジェクトではセキュアで高パフォーマンスなコードを実現するため、以下の原則を厳守してください。

### 📚 完全なガイドライン

**詳細は以下のドキュメントを参照**:
- **[docs/02_実装ガイド/02-03_セキュリティとパフォーマンス設計方針.md](../docs/02_実装ガイド/02-03_セキュリティとパフォーマンス設計方針.md)** - 完全なガイドライン

### 必須要件（14項目）

#### 1. Swift 6.0の使用と並行性
```swift
// ✅ actorでデータ競合を防止
actor QuizSessionStore {
    private var sessions: [String: QuizSession] = [:]
    func addSession(_ session: QuizSession) {
        sessions[session.id] = session
    }
}

// ✅ @MainActorでUI更新を保証
@MainActor
class QuizViewModel: ObservableObject {
    @Published var currentQuestion: QuestionItem?
}
```

#### 2. 雑な例外処理を禁止
```swift
// ❌ 禁止: エラーを無視
try? loadData()

// ✅ 必須: 適切なエラーハンドリング
do {
    let data = try loadData()
    return try parseCSV(data: data)
} catch let error as CSVError {
    logger.error("CSV読み込みエラー: \(error.localizedDescription)")
    throw error
}
```

#### 3. 可変引数を使用しない
```swift
// ❌ 禁止: 可変引数（型安全性が失われる）
func processItems(_ items: Any...) { }

// ✅ 必須: 明示的な配列またはジェネリクス
func processItems(_ items: [QuestionItem]) { }
func processItems<T: Identifiable>(_ items: [T]) { }
```

#### 4. 任意のコード実行・SQL文実行の禁止
```swift
// ❌ 禁止: 任意のコマンド実行
// Process.launch()等で任意のコマンド実行

// ✅ 必須: 明示的な関数呼び出し
enum QuizCommand {
    case start
    case submit(answerId: Int)
}

// ✅ 必須: CoreDataのタイプセーフなAPI（SQL文の直接実行禁止）
let request: NSFetchRequest<QuizSessionEntity> = QuizSessionEntity.fetchRequest()
request.predicate = NSPredicate(format: "userId == %@", userId)
```

#### 5. ログに内部情報・個人情報を出力しない
```swift
// ❌ 禁止: 個人情報をログに出力
logger.debug("ユーザーID: \(userId), メール: \(email)")

// ✅ 必須: 個人情報をマスク
extension String {
    func masked() -> String {
        guard count > 4 else { return "****" }
        let start = prefix(2)
        let end = suffix(2)
        return "\(start)***\(end)"
    }
}
logger.debug("ユーザーID: \(userId.masked())")  // "ab***xy"
```

#### 6. 時刻はタイムゾーンを設定する
```swift
// ❌ 禁止: タイムゾーン未指定
let formatter = DateFormatter()
formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"

// ✅ 必須: タイムゾーンを明示
let formatter = DateFormatter()
formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
formatter.timeZone = TimeZone(identifier: "Asia/Tokyo")!
formatter.locale = Locale(identifier: "ja_JP")

// ✅ 推奨: ISO8601形式を使用
let isoFormatter = ISO8601DateFormatter()
isoFormatter.timeZone = TimeZone(secondsFromGMT: 0)
```

#### 7. 浮動小数点の丸め方を統一する
```swift
// ❌ 禁止: 丸め方が不明確
let rounded = Int(score)

// ✅ 必須: 明示的な丸め方
extension Double {
    func rounded(toPlaces places: Int) -> Double {
        let divisor = pow(10.0, Double(places))
        return (self * divisor).rounded() / divisor
    }
}

let score = 85.6789
let roundedScore = score.rounded(toPlaces: 2)  // 85.68（四捨五入）

// ✅ 金額など正確性が必要な場合はDecimal型
let price = Decimal(string: "1234.56")!
```

#### 8. ライブラリの警告を無視しない
```swift
// ❌ 禁止: 警告を放置
@available(iOS 15, *)  // iOS 16以降なのに放置

// ✅ 必須: 警告に対応
@available(iOS 16.0, *)
func newAPIFeature() { }

func compatibleFeature() {
    if #available(iOS 16.0, *) {
        newAPIFeature()
    } else {
        legacyFeature()
    }
}
```

#### 9. 同期・非同期が機能停止を引き起こさない
```swift
// ❌ 禁止: メインスレッドで重い同期処理
@MainActor
func loadAndProcessData() {
    let data = loadDataSync()  // UIをブロックする
}

// ✅ 必須: 非同期処理を適切に分離
class DataLoader {
    func loadData() async throws -> Data {
        return try await URLSession.shared.data(from: url).0
    }
    
    func processData(_ data: Data) -> [QuestionItem] {
        return parseCSV(data: data)  // 同期処理
    }
}
```

#### 10. リソースを解放する
```swift
// ❌ 禁止: リソースリーク
class FileProcessor {
    var fileHandle: FileHandle?
    func process() {
        fileHandle = try? FileHandle(forReadingFrom: url)
        // closeを呼び忘れる
    }
}

// ✅ 必須: deferでリソースを確実に解放
func processFile(at url: URL) throws {
    let fileHandle = try FileHandle(forReadingFrom: url)
    defer {
        try? fileHandle.close()  // 必ず実行される
    }
    let data = fileHandle.readDataToEndOfFile()
}

// ✅ 必須: メモリ集約的な処理でautoreleasepool
func processManyItems(_ items: [QuestionItem]) {
    for item in items {
        autoreleasepool {
            let processed = processItem(item)
            saveToDatabase(processed)
        }
    }
}
```

#### 11. ハードコードしない
```swift
// ❌ 禁止: ハードコード
let maxBatchSize = 20
let apiEndpoint = "https://example.com/api"

// ✅ 必須: 設定ファイルで管理
struct AppConfig {
    static let shared = AppConfig()
    let maxBatchSize: Int
    let defaultDifficulty: Int
    
    private init() {
        // Info.plistから読み込む
        if let path = Bundle.main.path(forResource: "Config", ofType: "plist"),
           let config = NSDictionary(contentsOfFile: path) {
            self.maxBatchSize = config["MaxBatchSize"] as? Int ?? 20
            self.defaultDifficulty = config["DefaultDifficulty"] as? Int ?? 1
        } else {
            self.maxBatchSize = 20
            self.defaultDifficulty = 1
        }
    }
}
```

#### 12. 遅いコードを書かない
```swift
// ❌ 禁止: O(n²)の不要なループ
func findDuplicates(_ items: [QuestionItem]) -> [QuestionItem] {
    var duplicates: [QuestionItem] = []
    for i in 0..<items.count {
        for j in (i+1)..<items.count {
            if items[i].id == items[j].id {
                duplicates.append(items[i])
            }
        }
    }
    return duplicates
}

// ✅ 必須: O(n)で処理
func findDuplicates(_ items: [QuestionItem]) -> [QuestionItem] {
    var seen = Set<String>()
    var duplicates: [QuestionItem] = []
    for item in items {
        if seen.contains(item.id) {
            duplicates.append(item)
        } else {
            seen.insert(item.id)
        }
    }
    return duplicates
}

// ✅ 必須: 辞書で高速検索（O(1)）
let itemsDict = items.toDictionary()
let item = itemsDict[id]  // O(1)
```

#### 13. 一般乱数を使用しない
```swift
// ❌ 禁止: 予測可能な乱数（セキュリティ用途）
let random = Int.random(in: 0..<100)

// ✅ 必須: セキュアな乱数生成（セキュリティ用途）
import CryptoKit
func generateSecureRandomID() -> String {
    let bytes = (0..<16).map { _ in UInt8.random(in: 0...255) }
    return bytes.map { String(format: "%02x", $0) }.joined()
}

// ✅ 許可: クイズの選択肢シャッフルには SystemRandomNumberGenerator で十分
func shuffleChoices(_ choices: [String]) -> [String] {
    var rng = SystemRandomNumberGenerator()
    return choices.shuffled(using: &rng)
}
```

#### 14. ログ出力でパフォーマンスを落とさない
```swift
// ❌ 禁止: 重い処理をログに含める
logger.debug("全アイテム: \(items.map { $0.description }.joined())")

// ✅ 必須: ログレベルをチェック
if logger.isLoggingEnabled(for: .debug) {
    let itemsDescription = items.map { $0.description }.joined()
    logger.debug("全アイテム: \(itemsDescription)")
}

// ✅ 推奨: OSLogを使用（効率的）
import OSLog
let logger = Logger(subsystem: "com.example.SimpleWord", category: "QuizSession")
logger.debug("セッション開始: \(sessionId, privacy: .public)")
```

### ✅ AI実装時のチェックリスト

コードを生成する際は、以下を必ず確認してください：

#### Swift 6.0と並行性
- [ ] actorを適切に使用している
- [ ] async/awaitを正しく使用している
- [ ] @MainActorでUI更新を保護している
- [ ] 同期・非同期の混在で停止が発生しない

#### エラー処理
- [ ] try?/try!を安易に使用していない
- [ ] エラーを適切に伝播している
- [ ] カスタムエラー型を定義している

#### セキュリティ
- [ ] 可変引数を使用していない
- [ ] 任意のコード実行の可能性がない
- [ ] SQL文の直接実行をしていない
- [ ] 個人情報・内部情報をログに出力していない

#### 時刻とロケール
- [ ] タイムゾーンを明示的に設定している
- [ ] ロケールを明示的に設定している

#### 数値演算
- [ ] 浮動小数点の丸め方を明示している
- [ ] オーバーフローチェックをしている

#### リソース管理
- [ ] deferでリソースを確実に解放している
- [ ] メモリ効率的な処理をしている

#### パフォーマンス
- [ ] 計算量がO(n)またはO(n log n)以下
- [ ] 不要な配列コピーを避けている
- [ ] 辞書やSetを適切に活用している

#### その他
- [ ] ハードコードを避けている
- [ ] ライブラリの警告に対応している
- [ ] セキュアな乱数を使用している（必要な場合）
- [ ] ログ出力が効率的

### 🚨 絶対禁止事項

以下は**絶対に実装してはいけません**：

1. ❌ try?/try!による雑なエラー無視
2. ❌ 可変引数の使用
3. ❌ 任意のコマンド実行（Process.launch()等）
4. ❌ SQL文の直接実行（CoreDataのみ使用）
5. ❌ 個人情報・内部情報のログ出力
6. ❌ タイムゾーン未指定の時刻処理
7. ❌ O(n²)以上の不要な計算量
8. ❌ ハードコードされた設定値
9. ❌ リソースリーク
10. ❌ ライブラリの警告の放置

---

**これらの原則を守ることで、セキュアで高パフォーマンスなアプリケーションを実現します。**
