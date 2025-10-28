//
//  ClassicalDetailsView.swift
//  SimpleWord
//
//  Created by リファクタリング フェーズ3
//

// 中学古典単語の詳細表示コンポーネント
// - 何を: 語句、発音、意味、用法、関連語、関連分野、難易度を表示
// - なぜ: CSV種類別の表示ロジックを分離し、保守性を向上させるため

import SwiftUI

/// 中学古典単語の詳細情報を表示するコンポーネント
struct ClassicalDetailsView: View {
    let questionItem: QuestionItem
    let headerLabels: [String: String]
    let textColor: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            // 1. 語句（term）
            if !questionItem.term.isEmpty {
                DetailRow(
                    label: CSVTypeDetector.labelFor("term", in: headerLabels, fallback: "語句:"),
                    value: questionItem.term,
                    textColor: textColor,
                    isBold: true
                )
            }
            
            // 2. 発音/読み（reading）
            if !questionItem.reading.isEmpty {
                DetailRow(
                    label: CSVTypeDetector.labelFor("reading", in: headerLabels, fallback: "読み:"),
                    value: questionItem.reading,
                    textColor: textColor
                )
            }
            
            // 3. 意味（meaning）
            if !questionItem.meaning.isEmpty {
                DetailRow(
                    label: CSVTypeDetector.labelFor("meaning", in: headerLabels, fallback: "意味:"),
                    value: questionItem.meaning,
                    textColor: textColor,
                    isBold: true
                )
            }
            
            // 4. 用法（etymology）
            if !questionItem.etymology.isEmpty {
                DetailRow(
                    label: CSVTypeDetector.labelFor("etymology", in: headerLabels, fallback: "用法:"),
                    value: questionItem.etymology,
                    textColor: textColor,
                    lineLimit: 3
                )
            }
            
            // 5. 関連語（relatedWords）
            if !questionItem.relatedWords.isEmpty {
                DetailRow(
                    label: CSVTypeDetector.labelFor("relatedwords", in: headerLabels, fallback: "関連語:"),
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
        term: "をかし",
        reading: "おかし",
        meaning: "趣がある、美しい",
        etymology: "心を引かれる様子。枕草子で頻繁に使われる。",
        relatedWordsCSV: "あはれ;いとをかし",
        relatedFieldsCSV: "形容詞;古典文学",
        difficulty: "基礎"
    )
    
    VStack(spacing: 0) {
        ClassicalDetailsView(
            questionItem: item,
            headerLabels: [:],
            textColor: .white
        )
    }
    .padding()
    .background(Color.green.opacity(0.9))
}
