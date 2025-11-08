//
//  HistoryDetailsView.swift
//  SimpleWord
//
//  Created by リファクタリング フェーズ3
//

// 中学歴史の詳細表示コンポーネント
// - 何を: 年号、史実名、解説、登場人物、関連史実、関連分野、難易度を表示
// - なぜ: CSV種類別の表示ロジックを分離し、保守性を向上させるため

import SwiftUI

/// 中学歴史の詳細情報を表示するコンポーネント
struct HistoryDetailsView: View {
    let questionItem: QuestionItem
    let headerLabels: [String: String]
    let textColor: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            // 1. 年号（term）
            if !questionItem.term.isEmpty {
                DetailRow(
                    label: CSVTypeDetector.labelFor("term", in: headerLabels, fallback: "年号:"),
                    value: questionItem.term,
                    textColor: textColor,
                    isBold: true
                )
            }
            
            // 2. 史実名（meaning）
            if !questionItem.meaning.isEmpty {
                DetailRow(
                    label: CSVTypeDetector.labelFor("meaning", in: headerLabels, fallback: "史実名:"),
                    value: questionItem.meaning,
                    textColor: textColor,
                    isBold: true
                )
            }
            
            // 3. 解説（etymology）
            if !questionItem.etymology.isEmpty {
                DetailRow(
                    label: CSVTypeDetector.labelFor("etymology", in: headerLabels, fallback: "解説:"),
                    value: questionItem.etymology,
                    textColor: textColor,
                    lineLimit: 3
                )
            }
            
            // 4. 登場人物（reading）
            if !questionItem.reading.isEmpty {
                DetailRow(
                    label: CSVTypeDetector.labelFor("reading", in: headerLabels, fallback: "登場人物:"),
                    value: questionItem.reading,
                    textColor: textColor
                )
            }
            
            // 5. 関連史実（relatedWords）
            if !questionItem.relatedWords.isEmpty {
                DetailRow(
                    label: CSVTypeDetector.labelFor("relatedwords", in: headerLabels, fallback: "関連史実:"),
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
        term: "1192",
        reading: "源頼朝、北条政子",
        meaning: "鎌倉幕府成立",
        etymology: "源頼朝が征夷大将軍に任命され、武家政権が確立した。",
        relatedWordsCSV: "平家滅亡;承久の乱;執権政治",
        relatedFieldsCSV: "鎌倉時代;政治史",
        difficulty: "基礎"
    )
    
    VStack(spacing: 0) {
        HistoryDetailsView(
            questionItem: item,
            headerLabels: [:],
            textColor: .white
        )
    }
    .padding()
    .background(Color.green.opacity(0.9))
}
