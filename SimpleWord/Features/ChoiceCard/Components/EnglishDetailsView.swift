//
//  EnglishDetailsView.swift
//  SimpleWord
//
//  Created by リファクタリング フェーズ3
//

// 英語系の詳細表示コンポーネント
// - 何を: 語句、発音、和訳、語源等解説、関連語と意味、関連分野、難易度を表示
// - なぜ: CSV種類別の表示ロジックを分離し、保守性を向上させるため

import SwiftUI

/// 中学英単語・英熟語・英会話・xcodeの詳細情報を表示するコンポーネント
struct EnglishDetailsView: View {
    let questionItem: QuestionItem
    let headerLabels: [String: String]
    let textColor: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            // 1. 語句（term）+ 発音を括弧内に表示
            if !questionItem.term.isEmpty {
                HStack(spacing: 3) {
                    Text(CSVTypeDetector.labelFor("term", in: headerLabels, fallback: "語句:"))
                        .font(.caption2)
                        .foregroundColor(textColor.opacity(0.7))
                        .bold()
                    HStack(spacing: 4) {
                        Text(questionItem.term)
                            .font(.caption)
                            .foregroundColor(textColor.opacity(0.95))
                            .fontWeight(.semibold)
                        // 2. 発音（reading）を括弧付きで表示
                        if !questionItem.reading.isEmpty {
                            Text("(\(questionItem.reading))")
                                .font(.caption2)
                                .foregroundColor(textColor.opacity(0.85))
                        }
                    }
                }
            }
            
            // 3. 和訳（meaning）
            if !questionItem.meaning.isEmpty {
                DetailRow(
                    label: CSVTypeDetector.labelFor("meaning", in: headerLabels, fallback: "和訳:"),
                    value: questionItem.meaning,
                    textColor: textColor,
                    isBold: true
                )
            }
            
            // 4. 語源等解説（etymology）
            if !questionItem.etymology.isEmpty {
                DetailRow(
                    label: CSVTypeDetector.labelFor("etymology", in: headerLabels, fallback: "語源等解説:"),
                    value: questionItem.etymology,
                    textColor: textColor,
                    lineLimit: 3
                )
            }
            
            // 5. 関連語と意味（relatedWords）
            if !questionItem.relatedWords.isEmpty {
                DetailRow(
                    label: CSVTypeDetector.labelFor("relatedwords", in: headerLabels, fallback: "関連語と意味:"),
                    value: questionItem.relatedWords.prefix(3).joined(separator: ", "),
                    textColor: textColor,
                    lineLimit: 2
                )
            }
            
            // 6. 関連分野 & 7. 難易度を1行にまとめる
            HStack(spacing: 8) {
                if !questionItem.relatedFields.isEmpty {
                    DetailRow(
                        label: CSVTypeDetector.labelFor("relatedfields", in: headerLabels, fallback: "関連分野:"),
                        value: questionItem.relatedFields.prefix(2).joined(separator: ","),
                        textColor: textColor,
                        lineLimit: 1
                    )
                }
                
                if !questionItem.difficulty.isEmpty {
                    DetailRow(
                        label: CSVTypeDetector.labelFor("difficulty", in: headerLabels, fallback: "難易度:"),
                        value: questionItem.difficulty,
                        textColor: textColor
                    )
                }
            }
        }
    }
}

/// 詳細行表示の共通コンポーネント
private struct DetailRow: View {
    let label: String
    let value: String
    let textColor: Color
    var isBold: Bool = false
    var lineLimit: Int? = nil
    
    var body: some View {
        HStack(alignment: lineLimit != nil ? .top : .center, spacing: 3) {
            Text(label)
                .font(.caption2)
                .foregroundColor(textColor.opacity(0.7))
                .bold()
            Text(value)
                .font(.caption)
                .foregroundColor(isBold ? textColor.opacity(0.95) : textColor.opacity(0.85))
                .fontWeight(isBold ? .semibold : .regular)
                .lineLimit(lineLimit)
        }
    }
}

// MARK: - Preview
#Preview {
    let item = QuestionItem(
        term: "apple",
        reading: "アップル",
        meaning: "りんご",
        etymology: "古英語æppel←西ゲルマン語*aplaz。果物の一種。",
        relatedWordsCSV: "fruit (果物);food (食べ物)",
        relatedFieldsCSV: "食べ物;果物",
        difficulty: "基礎"
    )
    
    VStack(spacing: 0) {
        EnglishDetailsView(
            questionItem: item,
            headerLabels: [:],
            textColor: .white
        )
    }
    .padding()
    .background(Color.green.opacity(0.9))
}
