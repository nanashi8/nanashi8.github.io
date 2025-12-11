// filepath: /path/to/project/SimpleWord/SimpleWord/ChoiceCardView.swift
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
    let explanation: String? // 回答後に表示する解説
    let item: QuestionItem? // 選択肢の詳細情報
    let headerLabels: [String: String] // CSVの表示ヘッダマップ（論理キー->表示ラベル）
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

        return SectionCard(backgroundColor: bgColor) {
            VStack(alignment: .leading, spacing: 8) {
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

                // 回答後に詳細情報を表示
                if answered, let questionItem = item {
                    Divider()
                        .background(textColor.opacity(0.3))

                    // CSV種類を判定して表示
                    let csvType = CSVTypeDetector.detectCSVType(from: headerLabels)
                    
                    switch csvType {
                    case .history:
                        HistoryDetailsView(
                            questionItem: questionItem,
                            headerLabels: headerLabels,
                            textColor: textColor
                        )
                    case .classical:
                        ClassicalDetailsView(
                            questionItem: questionItem,
                            headerLabels: headerLabels,
                            textColor: textColor
                        )
                    case .english:
                        EnglishDetailsView(
                            questionItem: questionItem,
                            headerLabels: headerLabels,
                            textColor: textColor
                        )
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
    VStack(spacing: 16) {
        let id1 = UUID()
        let id2 = UUID()
        let item1 = QuestionItem(
            term: "apple",
            reading: "アップル",
            meaning: "りんご",
            etymology: "古英語æppel←西ゲルマン語*aplaz。果物の一種。",
            relatedWordsCSV: "fruit;food",
            relatedFieldsCSV: "食べ物;果物",
            difficulty: "1"
        )
        let item2 = QuestionItem(
            term: "orange",
            reading: "オレンジ",
            meaning: "みかん、オレンジ",
            etymology: "柑橘類。ビタミンCが豊富。",
            relatedWordsCSV: "fruit;citrus",
            relatedFieldsCSV: "食べ物;果物",
            difficulty: "1"
        )

        ChoiceCardView(
            id: id1,
            text: "りんご",
            explanation: "果物。赤いものが多い。",
            item: item1,
            headerLabels: [:],
            selectedID: nil,
            correctID: id1,
            onSelect: { _ in }
        )

        ChoiceCardView(
            id: id2,
            text: "みかん",
            explanation: "柑橘類。ビタミンCが豊富。",
            item: item2,
            headerLabels: [:],
            selectedID: id1,
            correctID: id1,
            onSelect: { _ in }
        )
    }
    .padding()
    .background(Color(uiColor: .systemGroupedBackground))
}
