//
//  QuestionCardView.swift
//  SimpleWord
//
//  Created by GitHub Copilot on 2025/10/18.
//

// 問題カード表示コンポーネント
// - 何を: 問題（語句）、読み、難易度、過去の正答率を表示
// - なぜ: QuizViewから問題表示部分を分離し、可読性と保守性を向上させるため

import SwiftUI

struct QuestionCardView: View {
    let item: QuestionItem
    
    @EnvironmentObject var wordScoreStore: WordScoreStore
    
    var body: some View {
        let ws = wordScoreStore.score(for: item.id)
        
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
                    if ws.attempts > 0 {
                        Text("正答率: \(Int(round(ws.accuracy * 100)))% ・ 過去\(ws.attempts)回")
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

// MARK: - Preview
#Preview {
    let store = WordScoreStore()
    
    return VStack(spacing: 20) {
        QuestionCardView(
            item: QuestionItem(
                term: "apple",
                reading: "アップル",
                meaning: "りんご",
                etymology: "古英語のæppelに由来",
                relatedWords: [],
                relatedFields: ["食べ物"],
                difficulty: "初級"
            )
        )
        .environmentObject(store)
        
        QuestionCardView(
            item: QuestionItem(
                term: "photosynthesis",
                reading: "フォトシンセシス",
                meaning: "光合成",
                etymology: "ギリシャ語のphos（光）とsynthesis（合成）から",
                relatedWords: [],
                relatedFields: ["生物学"],
                difficulty: "上級"
            )
        )
        .environmentObject(store)
    }
    .padding()
    .background(Color(uiColor: .systemGroupedBackground))
}
