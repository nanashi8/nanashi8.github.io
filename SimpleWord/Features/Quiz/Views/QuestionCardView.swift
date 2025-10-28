//
//  QuestionCardView.swift
//  SimpleWord
//
//  Created by GitHub Copilot on 2025/10/18.
//

// 問題カード表示コンポーネント
// - 何を: 問題（語句）、読み、難易度、過去の正答率を表示。回答後は正解情報も表示
// - なぜ: QuizViewから問題表示部分を分離し、可読性と保守性を向上させるため

import SwiftUI

struct QuestionCardView: View {
    let item: QuestionItem
    var isAnswered: Bool = false // 回答済みかどうか
    var isCorrect: Bool? = nil   // 正解したかどうか（回答済みの場合のみ有効）
    
    @EnvironmentObject var wordScoreStore: WordScoreStore
    
    var body: some View {
        let ws = wordScoreStore.score(for: item.id)
        
        SectionCard {
            VStack(alignment: .leading, spacing: 12) {
                // 問題（語句・スペル）
                HStack(alignment: .firstTextBaseline) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("問題")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(item.term)
                            .font(.title2)
                            .bold()
                    }
                    Spacer()
                    if !item.difficulty.isEmpty {
                        DifficultyBadge(text: item.difficulty)
                    }
                }
                
                // 発音（読み）
                if !item.reading.isEmpty {
                    Text(item.reading)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                // 過去の正答率を表示（回答前のみ）
                if !isAnswered {
                    Divider()
                    
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
        }
        .padding(.top, 4)
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Preview
#Preview {
    let store = WordScoreStore()
    
    ScrollView {
        VStack(spacing: 20) {
            // 回答前
            Text("回答前の状態")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal)
            
            QuestionCardView(
                item: QuestionItem(
                    term: "apple",
                    reading: "アップル",
                    meaning: "りんご",
                    etymology: "古英語æppel←西ゲルマン語*aplaz",
                    relatedWordsCSV: "",
                    relatedFieldsCSV: "食べ物",
                    difficulty: "1"
                )
            )
            .environmentObject(store)
            
            // 正解後
            Text("正解後の状態")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal)
                .padding(.top, 20)
            
            QuestionCardView(
                item: QuestionItem(
                    term: "beautiful",
                    reading: "ビューティフル",
                    meaning: "美しい",
                    etymology: "美を意味するbeautyの形容詞形",
                    relatedWordsCSV: "",
                    relatedFieldsCSV: "形容詞",
                    difficulty: "2"
                ),
                isAnswered: true,
                isCorrect: true
            )
            .environmentObject(store)
            
            // 不正解後
            Text("不正解後の状態")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal)
                .padding(.top, 20)
            
            QuestionCardView(
                item: QuestionItem(
                    term: "photosynthesis",
                    reading: "フォトシンセシス",
                    meaning: "光合成",
                    etymology: "ギリシャ語のphos（光）とsynthesis（合成）から",
                    relatedWordsCSV: "",
                    relatedFieldsCSV: "生物学",
                    difficulty: "3"
                ),
                isAnswered: true,
                isCorrect: false
            )
            .environmentObject(store)
        }
        .padding()
    }
    .background(Color(uiColor: .systemGroupedBackground))
}
