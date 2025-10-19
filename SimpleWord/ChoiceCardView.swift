// filepath: /Users/yuichinakamura/Documents/20251006_002/SimpleWord/SimpleWord/ChoiceCardView.swift
//
//  ChoiceCardView.swift
//  SimpleWord
//
//  Created by GitHub Copilot on 2025/10/19.
//

// 選択肢カード表示コンポーネント
// - 何を: 選択肢テキストを表示し、選択状態や正誤に応じた色変化を行う
// - なぜ: QuizViewから選択肢部分を分離して再利用可能にするため

import SwiftUI

struct ChoiceCardView: View {
    let id: UUID
    let text: String
    let selectedID: UUID?
    let correctID: UUID?
    let onSelect: (UUID) -> Void

    var body: some View {
        let answered = (selectedID != nil)
        let isChosen = (selectedID != nil && selectedID == id)
        let isCorrect = (correctID != nil && correctID == id)

        // 背景色: 未回答は淡い背景、回答後は正解は緑、誤答は赤
        let bgColor: Color = {
            if !answered { return Color(uiColor: .secondarySystemBackground) }
            if isChosen && isCorrect { return Color.green.opacity(0.9) }
            if isChosen && !isCorrect { return Color.red.opacity(0.9) }
            if isCorrect { return Color.green.opacity(0.6) }
            return Color(uiColor: .secondarySystemBackground).opacity(0.6)
        }()

        let textColor: Color = answered ? .white : .primary
        let textFont: Font = answered ? .body.weight(.semibold) : .body

        SectionCard(backgroundColor: bgColor) {
            HStack(spacing: 12) {
                Text(text)
                    .foregroundColor(textColor)
                    .font(textFont)
                    .lineLimit(2)

                Spacer()

                if answered && isChosen {
                    Image(systemName: isCorrect ? "checkmark.circle.fill" : "xmark.circle.fill")
                        .foregroundColor(textColor)
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

// MARK: - Preview
#Preview {
    VStack(spacing: 16) {
        let id1 = UUID()
        let id2 = UUID()
        ChoiceCardView(id: id1, text: "りんご", selectedID: nil, correctID: id1, onSelect: { _ in })
        ChoiceCardView(id: id2, text: "みかん", selectedID: id1, correctID: id1, onSelect: { _ in })
    }
    .padding()
    .background(Color(uiColor: .systemGroupedBackground))
}
