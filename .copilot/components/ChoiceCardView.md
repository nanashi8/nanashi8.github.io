# ChoiceCardView 仕様書

最終更新: 2025年10月18日

---

## 責務
- 選択肢カードの表示と解説の展開/折りたたみ
- 回答後の色変更・アイコン表示
- 関連語・分野情報の表示

---

## 入力パラメータ

### 必須
```swift
let choice: Choice                            // 選択肢データ
let selectedID: UUID?                         // 選択された選択肢ID
let correctAnswerID: UUID?                    // 正解のID
let lookup: (String) -> QuestionItem?         // 関連語検索用クロージャ
let onSelect: (UUID) -> Void                  // 選択時のコールバック
```

### Binding
```swift
@Binding var isExpanded: Bool                 // 展開状態
```

---

## 表示状態

### 未回答時
- 背景色: `.secondarySystemBackground`
- テキスト色: `.primary`
- 日本語訳（meaning）を大きく表示
- 英単語（term）は非表示（答えが漏れないように）

### 回答後（正解）
- 背景色: `.green.opacity(0.9)`
- テキスト色: `.white`
- アイコン: `checkmark.circle.fill`
- 語句、読み、語源を全文表示
- 関連語・分野は「もっと見る」で展開

### 回答後（不正解で選択）
- 背景色: `.red.opacity(0.9)`
- テキスト色: `.white`
- アイコン: `xmark.circle.fill`
- 解説を全文表示

### 回答後（未選択）
- 背景色: `.secondarySystemBackground.opacity(0.6)`
- テキスト色: `.primary`
- 解説を全文表示

---

## 実装例

```swift
import SwiftUI

struct ChoiceCardView: View {
    let choice: Choice
    let selectedID: UUID?
    let correctAnswerID: UUID?
    let lookup: (String) -> QuestionItem?
    let onSelect: (UUID) -> Void
    
    @Binding var isExpanded: Bool
    
    var body: some View {
        let answered = (selectedID != nil)
        let isCorrect = (correctAnswerID != nil && choice.id == correctAnswerID)
        let isChosen = (selectedID != nil && choice.id == selectedID)
        
        let bgColor: Color = {
            if !answered { return Color(uiColor: .secondarySystemBackground) }
            if isCorrect { return Color.green.opacity(0.9) }
            if isChosen { return Color.red.opacity(0.9) }
            return Color(uiColor: .secondarySystemBackground).opacity(0.6)
        }()
        
        let textColor: Color = answered ? .white : .primary
        let textFont: Font = answered ? .body.weight(.semibold) : .body
        
        SectionCard(backgroundColor: bgColor) {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 12) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(choice.label)
                            .foregroundColor(textColor)
                            .font(textFont)
                            .lineLimit(2)
                        
                        if answered {
                            Text(choice.item.term)
                                .foregroundColor(textColor.opacity(0.9))
                                .font(.caption)
                                .lineLimit(1)
                        }
                    }
                    
                    Spacer()
                    
                    if let _ = selectedID {
                        if let _ = correctAnswerID, choice.id == correctAnswerID {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(textColor)
                        } else if choice.id == selectedID {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(textColor)
                        }
                    }
                }
                
                if answered {
                    explanationView(textColor: textColor)
                }
            }
            .contentShape(Rectangle())
        }
        .frame(maxWidth: .infinity)
        .onTapGesture {
            if selectedID == nil {
                onSelect(choice.id)
            }
        }
    }
    
    @ViewBuilder
    private func explanationView(textColor: Color) -> some View {
        let item = choice.item
        
        VStack(alignment: .leading, spacing: 6) {
            Text("語句: \(item.term)")
                .font(.caption)
                .foregroundColor(textColor.opacity(0.95))
            
            if !item.reading.isEmpty {
                Text("読み: \(item.reading)")
                    .font(.caption)
                    .foregroundColor(textColor.opacity(0.9))
            }
            
            // 語源は常に全文表示
            if !item.etymology.isEmpty {
                Text(item.etymology)
                    .font(.caption)
                    .foregroundColor(textColor.opacity(0.9))
                    .lineLimit(nil)
            }
            
            if isExpanded {
                // 関連語や分野情報
                relatedInfoView(item: item, textColor: textColor)
            }
            
            Button(action: {
                withAnimation {
                    isExpanded.toggle()
                }
            }) {
                Text(isExpanded ? "閉じる" : "もっと見る")
                    .font(.caption2)
                    .foregroundColor(textColor)
            }
            .buttonStyle(.plain)
        }
    }
    
    @ViewBuilder
    private func relatedInfoView(item: QuestionItem, textColor: Color) -> some View {
        // 関連語表示
        if !item.relatedWords.isEmpty {
            VStack(alignment: .leading, spacing: 6) {
                SectionHeader(systemImage: "tag", title: "関連語")
                // ... 関連語の詳細表示
            }
        }
        
        // 分野表示
        if !item.relatedFields.isEmpty {
            HStack(spacing: 6) {
                Text("分野:")
                    .font(.caption2)
                    .foregroundColor(textColor.opacity(0.9))
                ForEach(item.relatedFields, id: \.self) { f in
                    TagCapsule(label: f)
                }
            }
        }
    }
}
```

---

## 使用例

```swift
struct QuizView: View {
    @State private var expandedIDs: Set<UUID> = []
    
    var body: some View {
        ForEach(choices) { choice in
            ChoiceCardView(
                choice: choice,
                selectedID: selectedID,
                correctAnswerID: correctAnswerID,
                lookup: { s in lookupItem(for: s) },
                onSelect: { id in select(id) },
                isExpanded: Binding(
                    get: { expandedIDs.contains(choice.id) },
                    set: { expanded in
                        if expanded {
                            expandedIDs.insert(choice.id)
                        } else {
                            expandedIDs.remove(choice.id)
                        }
                    }
                )
            )
        }
    }
}
```

---

## 依存コンポーネント
- `SectionCard` - カード表示用共通コンポーネント
- `SectionHeader` - セクションヘッダー
- `TagCapsule` - タグ表示カプセル

---

## 依存データ型
- `Choice` - 選択肢データ（QuizModels.swift）
- `QuestionItem` - 問題データモデル

---
