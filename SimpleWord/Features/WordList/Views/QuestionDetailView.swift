// QuestionDetailView.swift
// 語句の詳細表示
// - 何を: 語句の基本情報（読み・意味）や補足（語源・関連語・分野）をカードで見やすく表示します。
// - なぜ: 学習中に背景知識を確認し、記憶の定着を助けるため。

import SwiftUI

// Detailed view for a QuestionItem. Opened when user taps a related word.
struct QuestionDetailView: View {
    let item: QuestionItem

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                // Header card: term, reading, difficulty
                SectionCard {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(alignment: .firstTextBaseline) {
                            Text(item.term)
                                .font(.title)
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
                    }
                }

                // Meaning
                if !item.meaning.isEmpty {
                    SectionCard {
                        SectionHeader(systemImage: "book", title: "意味")
                        Text(item.meaning)
                            .font(.body)
                            .padding(.top, 4)
                    }
                }

                // Etymology / explanation
                if !item.etymology.isEmpty {
                    SectionCard {
                        SectionHeader(systemImage: "sparkles", title: "語源・解説")
                        Text(item.etymology)
                            .font(.body)
                            .padding(.top, 4)
                    }
                }

                // Related words (simple list)
                if !item.relatedWords.isEmpty {
                    SectionCard {
                        SectionHeader(systemImage: "tag", title: "関連語")
                        VStack(alignment: .leading, spacing: 8) {
                            ForEach(item.relatedWords, id: \.self) { rw in
                                Text(rw)
                                    .font(.subheadline)
                            }
                        }
                        .padding(.top, 4)
                    }
                }

                // Related fields
                if !item.relatedFields.isEmpty {
                    SectionCard {
                        SectionHeader(systemImage: "square.grid.2x2", title: "関連分野")
                        HStack {
                            ForEach(item.relatedFields, id: \.self) { f in
                                TagCapsule(label: f)
                            }
                        }
                        .padding(.top, 4)
                    }
                }

                Spacer(minLength: 20)
            }
            .padding()
        }
        .navigationTitle(item.term)
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationStack {
        QuestionDetailView(item: QuestionItem(term: "sample", reading: "さぁんぷる", meaning: "例", etymology: "語構成｜由来｜使い方", relatedWordsCSV: "関連1;関連2", relatedFieldsCSV: "英語;国語", difficulty: "初級"))
    }
}
