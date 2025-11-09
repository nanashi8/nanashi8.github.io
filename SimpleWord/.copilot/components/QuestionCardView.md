# QuestionCardView 仕様書

最終更新: 2025年10月18日

---

## 責務
- 問題カードの表示（語句、読み、難易度）
- 単語別の正答率と試行回数の表示

---

## 入力パラメータ

### 必須
```swift
let item: QuestionItem                        // 問題データ
let wordScore: WordScore                      // 単語別成績
```

---

## 実装例

```swift
import SwiftUI

struct QuestionCardView: View {
    let item: QuestionItem
    let wordScore: WordScore
    
    var body: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 6) {
                HStack(alignment: .firstTextBaseline) {
                    Text(item.term)
                        .font(.title2)
                        .bold()
                    Spacer()
                    if !item.difficulty.isEmpty {
                        DifficultyBadge(text: item.difficulty)
                    }
                }
                
                if !item.reading.isEmpty {
                    Text(item.reading)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                // 過去の正答率を表示
                HStack(spacing: 8) {
                    if wordScore.attempts > 0 {
                        Text("正答率: \(Int(round(wordScore.accuracy * 100)))% ・ 過去\(wordScore.attempts)回")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    } else {
                        Text("正答率: データなし")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
        .padding(.top, 4)
        .frame(maxWidth: .infinity)
    }
}
```

---

## 使用例

```swift
struct QuizView: View {
    @EnvironmentObject var wordScoreStore: WordScoreStore
    
    var body: some View {
        if let item = currentItem {
            let ws = wordScoreStore.score(for: item.id)
            QuestionCardView(item: item, wordScore: ws)
        }
    }
}
```

---

## 依存コンポーネント
- `SectionCard` - カード表示用共通コンポーネント
- `DifficultyBadge` - 難易度バッジ表示

---

## 依存データ型
- `QuestionItem` - 問題データモデル
- `WordScore` - 単語別成績データ

---
