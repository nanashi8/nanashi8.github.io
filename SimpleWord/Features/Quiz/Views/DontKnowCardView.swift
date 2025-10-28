//
//  DontKnowCardView.swift
//  SimpleWord
//
//  Created by GitHub Copilot on 2025/10/18.
//

// 「分からない」カード表示コンポーネント
// - 何を: 「分からない」選択肢カードを表示
// - なぜ: QuizViewから「分からない」カード部分を分離し、可読性と保守性を向上させるため

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

// MARK: - Preview
#Preview {
    VStack(spacing: 20) {
        // 未回答時
        DontKnowCardView(
            id: UUID(),
            selectedID: nil,
            correctAnswerID: UUID(),
            onSelect: { _ in print("分からない選択") }
        )
        
        // 選択された時
        let selectedId = UUID()
        DontKnowCardView(
            id: selectedId,
            selectedID: selectedId,
            correctAnswerID: UUID(),
            onSelect: { _ in print("分からない選択") }
        )
        
        // 他の選択肢が選ばれた時
        DontKnowCardView(
            id: UUID(),
            selectedID: UUID(),
            correctAnswerID: UUID(),
            onSelect: { _ in print("分からない選択") }
        )
    }
    .padding()
    .background(Color(uiColor: .systemGroupedBackground))
}
