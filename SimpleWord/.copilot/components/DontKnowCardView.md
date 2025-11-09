# DontKnowCardView 仕様書

最終更新: 2025年10月18日

---

## 責務
- 「分からない」カードの表示
- 選択肢カードと同じ見た目で統一感を保つ

---

## 入力パラメータ

### 必須
```swift
let id: UUID                                  // カードの一意ID
let selectedID: UUID?                         // 選択された選択肢ID
let correctAnswerID: UUID?                    // 正解のID
let onSelect: (UUID) -> Void                  // 選択時のコールバック
```

---

## 表示状態

### 未回答時
- 背景色: `.secondarySystemBackground`
- テキスト色: `.primary`
- テキスト: 「分からない」

### 回答後（選択された場合）
- 背景色: `.red.opacity(0.9)`
- テキスト色: `.white`
- アイコン: `xmark.circle.fill`

### 回答後（未選択）
- 背景色: `.secondarySystemBackground.opacity(0.6)`
- テキスト色: `.primary`

---

## 実装例

```swift
import SwiftUI

struct DontKnowCardView: View {
    let id: UUID
    let selectedID: UUID?
    let correctAnswerID: UUID?
    let onSelect: (UUID) -> Void
    
    var body: some View {
        let answered = (selectedID != nil)
        let isChosen = (selectedID != nil && selectedID == id)
        
        let bgColor: Color = {
            if !answered { return Color(uiColor: .secondarySystemBackground) }
            if isChosen { return Color.red.opacity(0.9) }
            return Color(uiColor: .secondarySystemBackground).opacity(0.6)
        }()
        
        let textColor: Color = answered ? .white : .primary
        let textFont: Font = answered ? .body.weight(.semibold) : .body
        
        SectionCard(backgroundColor: bgColor) {
            HStack(spacing: 12) {
                Text("分からない")
                    .foregroundColor(textColor)
                    .font(textFont)
                    .lineLimit(2)
                
                Spacer()
                
                if let _ = selectedID {
                    if isChosen {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(textColor)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity)
        .contentShape(Rectangle())
        .onTapGesture {
            if selectedID == nil {
                onSelect(id)
            }
        }
    }
}
```

---

## 使用例

```swift
struct QuizView: View {
    @State private var dontKnowChoiceID: UUID? = nil
    
    var body: some View {
        if let dkID = dontKnowChoiceID {
            DontKnowCardView(
                id: dkID,
                selectedID: selectedID,
                correctAnswerID: correctAnswerID,
                onSelect: { id in
                    if selectedID == nil {
                        giveUp()
                    }
                }
            )
        }
    }
}
```

---

## 依存コンポーネント
- `SectionCard` - カード表示用共通コンポーネント

---

## 備考
- 選択肢カードと視覚的に統一された見た目
- タップすると親Viewの`giveUp()`関数を呼び出す
- 独立性が高く、分割しやすいコンポーネント

---
