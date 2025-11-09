# QuizView クイックリファレンス

最終更新: 2025年10月18日

---

## よく使う @State 変数

### 問題管理
```swift
@State private var items: [QuestionItem] = []          // 全問題アイテム
@State private var order: [QuestionItem] = []          // シャッフルされた全アイテム順序
@State private var pool: [QuestionItem] = []           // 現在のバッチで繰り返し分を含む出題プール
@State private var poolIndex: Int = 0                  // 現在のプール内インデックス
@State private var currentItem: QuestionItem? = nil    // 現在の問題
```

### 選択肢管理
```swift
@State private var choices: [Choice] = []              // 選択肢リスト
@State private var correctAnswerID: UUID? = nil        // 正解のID
@State private var selectedID: UUID? = nil             // 選択された選択肢ID
@State private var dontKnowChoiceID: UUID? = nil       // 分からないカードのID
@State private var expandedIDs: Set<UUID> = []         // 展開された選択肢ID
```

### スコア管理
```swift
@State private var score: Int = 0                      // 累積正解数
@State private var questionCount: Int = 0              // 累積出題数
@State private var batchCorrect: Int = 0               // バッチ内正解数
@State private var finished: Bool = false              // 終了フラグ
```

### バッチ管理
```swift
@State private var batchStart: Int = 0                 // バッチ開始位置
@State private var batchSize: Int = 10                 // バッチサイズ
@State private var batchAttempts: Int = 0              // バッチ試行回数
@State private var remediationMode: Bool = false       // 補修モードフラグ
@State private var lastBatchItemIDs: [UUID] = []       // 直前セットのアイテムID
@State private var lastPickedItems: [QuestionItem] = [] // 直前セットのアイテム
```

### アニメーション管理
```swift
@State private var shouldAnimatePassedCount: Bool = false  // 合格数アニメーション
@State private var shouldAnimateTotalCount: Bool = false   // 総出題数アニメーション
@State private var previousPassedCount: Int = 0            // 前回の合格数
@State private var previousTotalCount: Int = 0             // 前回の総出題数
```

### タイマー・音声
```swift
@State private var questionTimerWorkItem: DispatchWorkItem? = nil  // 問題タイマー
@State private var timeRemaining: Int = 0                          // 残り時間
@State private var pendingAdvance: DispatchWorkItem? = nil         // 自動遷移予約
@State private var questionShownAt: Date? = nil                    // 問題表示時刻
```

---

## アニメーショントリガーパターン

### 値の変化を検出してアニメーション
```swift
// 値変更前に保存
let old = currentValue

// 値変更
currentValue += 1

// 変化検出してアニメーション
if currentValue > old {
    shouldAnimate = true
    DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
        self.shouldAnimate = false
    }
}
```

### 実装例: select関数内
```swift
private func select(_ choiceID: UUID) {
    guard selectedID == nil else { return }
    cancelQuestionTimer()
    selectedID = choiceID
    
    // 値の変化前にチェック
    let oldQuestionCount = questionCount
    let oldBatchCorrect = batchCorrect
    
    questionCount += 1
    let wasCorrect = (correctAnswerID != nil && choiceID == correctAnswerID)
    if wasCorrect {
        score += 1
        batchCorrect += 1
    }
    
    // 値が変化したらアニメーションをトリガー
    if questionCount > oldQuestionCount {
        shouldAnimateTotalCount = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
            self.shouldAnimateTotalCount = false
        }
    }
    
    if wasCorrect && batchCorrect > oldBatchCorrect {
        shouldAnimatePassedCount = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
            self.shouldAnimatePassedCount = false
        }
    }
    
    // ... 以降の処理
}
```

---

## View表示パターン

### アニメーション付きテキスト
```swift
Text("合格数: \(batchCorrect)")
    .font(.caption)
    .foregroundColor(shouldAnimatePassedCount ? .green : .secondary)
    .scaleEffect(shouldAnimatePassedCount ? 1.3 : 1.0)
    .animation(.spring(response: 0.4, dampingFraction: 0.5), value: shouldAnimatePassedCount)
```

### 条件付き色変更
```swift
let bgColor: Color = {
    if !answered { return Color(uiColor: .secondarySystemBackground) }
    if isCorrect { return Color.green.opacity(0.9) }
    if isChosen { return Color.red.opacity(0.9) }
    return Color(uiColor: .secondarySystemBackground).opacity(0.6)
}()
```

---

## 主要メソッドの処理フロー

### 初期化フロー
```
start()
  → loadCSVAndStart()
      → CSVLoader.load()
      → フィルタ適用
      → prepareBatch()
          → AdaptiveScheduler.scheduleNextBatch()
          → prepareQuestion()
```

### 問題表示フロー
```
prepareQuestion()
  → currentItem設定
  → dontKnowChoiceID生成
  → 選択肢作成（weightedDistractorItems）
  → choices設定
  → タイマー開始（isTimerEnabled時）
```

### 選択フロー
```
select(choiceID)
  → タイマー停止
  → selectedID設定
  → スコア更新
  → アニメーショントリガー
  → WordScoreStore.recordResult()
  → AdaptiveScheduler.record()
  → 自動遷移予約（autoAdvance時）
```

### バッチ評価フロー
```
evaluateBatch()
  → 成功率計算
  → しきい値判定
      → 成功 → 次のバッチへ（batchSize増加）
      → 失敗 → 再試行 or 次のバッチへ
  → 全体終了時 → ScoreStore.addResult()
```

---

## 重要な計算ロジック

### 正答率計算
```swift
private var overallAccuracy: Int {
    guard questionCount > 0 else { return 0 }
    let q = Double(questionCount)
    let s = Double(score)
    let ratio = (q > 0) ? (s / q) : 0.0
    let percent = round(ratio * 100.0)
    return Int(percent)
}
```

### バッチ数計算
```swift
private var totalBatches: Int {
    guard batchSize > 0 else { return 1 }
    return max(1, Int(ceil(Double(max(1, order.count)) / Double(batchSize))))
}
```

---

## 分割時の注意点

### 1. @EnvironmentObject の引き継ぎ
```swift
// 親View（QuizView）
struct QuizView: View {
    @EnvironmentObject var quizSettings: QuizSettings
    @EnvironmentObject var scoreStore: ScoreStore
    @EnvironmentObject var wordScoreStore: WordScoreStore
    @EnvironmentObject var currentCSV: CurrentCSV
    
    var body: some View {
        QuizStatisticsView(...)
            .environmentObject(quizSettings)
            .environmentObject(currentCSV)
    }
}

// 子View
struct QuizStatisticsView: View {
    @EnvironmentObject var quizSettings: QuizSettings
    @EnvironmentObject var currentCSV: CurrentCSV
    // 必要な@EnvironmentObjectのみを宣言
}
```

### 2. @Binding の使用
```swift
// 親View
@State private var shouldAnimatePassedCount: Bool = false

var body: some View {
    QuizStatisticsView(
        shouldAnimatePassedCount: $shouldAnimatePassedCount
    )
}

// 子View
struct QuizStatisticsView: View {
    @Binding var shouldAnimatePassedCount: Bool
}
```

### 3. Closureによるアクション伝播
```swift
// 親View
var body: some View {
    ChoiceCardView(
        choice: choice,
        onSelect: { id in select(id) }
    )
}

// 子View
struct ChoiceCardView: View {
    let onSelect: (UUID) -> Void
    
    var body: some View {
        // ...
        .onTapGesture {
            onSelect(choice.id)
        }
    }
}
```

---

## デバッグのヒント

### 1. アニメーションが動作しない場合
- `shouldAnimate`の値が変化しているか確認
- `DispatchQueue.main.asyncAfter`が実行されているか確認
- `.animation()`の`value:`パラメータが正しいか確認

### 2. 選択肢が表示されない場合
- `choices`配列が空でないか確認
- `currentItem`がnilでないか確認
- `prepareQuestion()`が呼ばれているか確認

### 3. タイマーが停止しない場合
- `cancelQuestionTimer()`が呼ばれているか確認
- `questionTimerWorkItem?.cancel()`が実行されているか確認

---

## 分割優先順位

1. **QuizStatisticsView** - 統計表示（独立性高）
2. **QuestionCardView** - 問題カード（独立性高）
3. **ChoiceCardView** - 選択肢カード（やや複雑）
4. **DontKnowCardView** - 分からないカード（独立性高）
5. **QuizNavigationButtonsView** - ナビゲーションボタン（独立性高）
6. **QuizResultView** - 結果表示（独立性高）
7. **QuizViewModel** - ビジネスロジック（最も複雑、最後に実施）

---

## 🚫 使用禁止パターン（非推奨構文）

### onChange の古い構文（iOS 17+で非推奨）
```swift
// ❌ 絶対に使用禁止
.onChange(of: currentIndex) { _ in
    selectedChoiceID = nil
}

.onChange(of: value) { newValue in
    // 処理
}

// ✅ 正しい書き方
.onChange(of: currentIndex) {
    selectedChoiceID = nil
}

.onChange(of: value) { oldValue, newValue in
    // 古い値と新しい値の両方が必要な場合
}
```

**重要**: iOS 17以降、1パラメータのクロージャは非推奨です。
- 古い値が不要な場合: 0パラメータ `{ }`
- 古い値と新しい値が必要な場合: 2パラメータ `{ old, new in }`

### その他の注意事項
詳細は `.copilot/deprecated-patterns.md` を参照してください。

---
