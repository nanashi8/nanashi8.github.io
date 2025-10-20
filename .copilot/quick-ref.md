# QuizView クイックリファレンス

最終更新: 2025年10月23日

---

## 📂 ファイルの場所

```
Features/Quiz/Views/QuizView.swift    # メインクイズ画面 (434行)
```

### 依存ファイル

**Models**: `Models/QuestionItem.swift`, `Models/WordScore.swift`, `QuizModels/QuizModels.swift`
**Stores**: `Stores/QuizSettings.swift`, `ScoreStore.swift`, `WordScoreStore.swift`, `CurrentCSV.swift`
**Services**: `Services/CSVQuestionLoader.swift`, `Features/Study/Logic/AdaptiveScheduler.swift`
**Components**: `QuizComponents/QuestionCardView.swift`, `ChoiceCardView.swift`, `DontKnowCardView.swift`

---

## 🎯 よく使うパターン

### アニメーショントリガー
```swift
// 値変更前に保存
let old = currentValue
// 値を更新
currentValue = newValue
// アニメーションフラグをトグル
withAnimation { shouldAnimate.toggle() }
```

### バッチ管理の基本フロー
```swift
1. prepareBatch() // バッチ準備（シャッフル、繰り返し追加）
2. prepareNextQuestion() // 問題準備
3. handleChoice() // 回答処理
4. evaluateBatch() // バッチ評価（合格判定）
```

### @EnvironmentObject注入
```swift
@EnvironmentObject var quizSettings: QuizSettings
@EnvironmentObject var scoreStore: ScoreStore
@EnvironmentObject var wordScoreStore: WordScoreStore
@EnvironmentObject var currentCSV: CurrentCSV
```

---

## 📝 実装時の注意点

- **非同期更新**: UI更新は必ず`DispatchQueue.main.async`
- **タイマー管理**: `DispatchWorkItem`のキャンセル忘れに注意
- **音声制御**: `AVSpeechSynthesizer`の停止処理を忘れずに
- **メモリ管理**: 大量のQuestionItemをpoolに保持する際は注意

---

## 🔍 デバッグ時のチェックポイント

- [ ] `items`が正しくロードされているか
- [ ] `pool`が適切にシャッフルされているか
- [ ] `currentItem`がnilでないか
- [ ] 選択肢が重複していないか
- [ ] タイマーが正しくキャンセルされているか
