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

                // 回答後に詳細情報を表示（全選択肢）
                // 注意: 各CSVタイプに応じて指定された順序ですべてのフィールドを表示する
                if answered, let questionItem = item {
                    Divider()
                        .background(textColor.opacity(0.3))

                    // CSV種類を判定して表示順序を決定
                    let csvType = detectCSVType(from: headerLabels)
                    
                    VStack(alignment: .leading, spacing: 4) {
                        switch csvType {
                        case .history:
                            // 中学歴史: 年号、史実名、解説、登場人物、関連史実、関連分野、難易度
                            displayHistoryDetails(questionItem, textColor)
                        case .classical:
                            // 中学古典単語: 語句、発音、意味（メインテキストで表示済み）、用法、関連語、関連分野、難易度
                            displayClassicalDetails(questionItem, textColor)
                        case .english:
                            // 中学英単語・英熟語・英会話・xcode: 語句、発音、和訳（メインテキストで表示済み）、語源等解説、関連語と意味、関連分野、難易度
                            displayEnglishDetails(questionItem, textColor)
                        }
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
    
    // MARK: - CSV種類判定
    
    /// CSV種類
    private enum CSVType {
        case history    // 中学歴史
        case classical  // 中学古典単語
        case english    // 中学英単語・英熟語・英会話・xcode
    }
    
    /// ヘッダラベルから表示用ラベルを取得（共通ヘルパー）
    private func labelFor(_ key: String, fallback: String) -> String {
        if let header = headerLabels[key], !header.isEmpty {
            return header.hasSuffix(":") ? header : "\(header):"
        }
        return fallback
    }
    
    /// ヘッダラベルからCSV種類を判定
    private func detectCSVType(from headerLabels: [String: String]) -> CSVType {
        // etymologyラベルの内容で判定（最優先）
        if let etymologyLabel = headerLabels["etymology"] {
            let normalized = etymologyLabel.lowercased()
            if normalized.contains("用法") {
                return .classical  // 中学古典単語
            } else if normalized == "解説" {
                return .history  // 中学歴史
            } else if normalized.contains("語源") {
                return .english  // 英語系
            }
        }
        
        // termラベルの内容で判定
        if let termLabel = headerLabels["term"] {
            let normalized = termLabel.lowercased()
            if normalized.contains("年号") {
                return .history
            }
        }
        
        // readingラベルの内容で判定
        if let readingLabel = headerLabels["reading"] {
            let normalized = readingLabel.lowercased()
            if normalized.contains("登場人物") {
                return .history
            }
        }
        
        // meaningラベルの内容で判定
        if let meaningLabel = headerLabels["meaning"] {
            let normalized = meaningLabel.lowercased()
            if normalized.contains("史実") {
                return .history
            } else if normalized.contains("和訳") {
                return .english
            } else if normalized.contains("意味") {
                // readingラベルを再確認
                if let readingLabel = headerLabels["reading"] {
                    let readingNormalized = readingLabel.lowercased()
                    if readingNormalized.contains("発音") && !readingNormalized.contains("カタカナ") {
                        return .classical  // 中学古典単語（発音だけでカタカナの記載なし）
                    }
                }
            }
        }
        
        // デフォルトは英語系
        return .english
    }
    
    // MARK: - 各CSV種類別の詳細表示
    
    /// 中学歴史の詳細表示: 年号、史実名、解説、登場人物、関連史実、関連分野、難易度
    @ViewBuilder
    private func displayHistoryDetails(_ questionItem: QuestionItem, _ textColor: Color) -> some View {
        Group {
            // 1. 年号（term）
            if !questionItem.term.isEmpty {
                HStack(spacing: 3) {
                    Text(labelFor("term", fallback: "年号:"))
                        .font(.caption2)
                        .foregroundColor(textColor.opacity(0.7))
                        .bold()
                    Text(questionItem.term)
                        .font(.caption)
                        .foregroundColor(textColor.opacity(0.95))
                        .fontWeight(.semibold)
                }
            }
            
            // 2. 史実名（meaning）
            if !questionItem.meaning.isEmpty {
                HStack(spacing: 3) {
                    Text(labelFor("meaning", fallback: "史実名:"))
                        .font(.caption2)
                        .foregroundColor(textColor.opacity(0.7))
                        .bold()
                    Text(questionItem.meaning)
                        .font(.caption)
                        .foregroundColor(textColor.opacity(0.95))
                        .fontWeight(.semibold)
                }
            }
            
            // 3. 解説（etymology）
            if !questionItem.etymology.isEmpty {
                HStack(alignment: .top, spacing: 3) {
                    Text(labelFor("etymology", fallback: "解説:"))
                        .font(.caption2)
                        .foregroundColor(textColor.opacity(0.7))
                        .bold()
                    Text(questionItem.etymology)
                        .font(.caption)
                        .foregroundColor(textColor.opacity(0.85))
                        .lineLimit(3)
                }
            }
            
            // 4. 登場人物（reading）
            if !questionItem.reading.isEmpty {
                HStack(spacing: 3) {
                    Text(labelFor("reading", fallback: "登場人物:"))
                        .font(.caption2)
                        .foregroundColor(textColor.opacity(0.7))
                        .bold()
                    Text(questionItem.reading)
                        .font(.caption)
                        .foregroundColor(textColor.opacity(0.9))
                }
            }
            
            // 5. 関連史実（relatedWords）
            if !questionItem.relatedWords.isEmpty {
                HStack(alignment: .top, spacing: 3) {
                    Text(labelFor("relatedwords", fallback: "関連史実:"))
                        .font(.caption2)
                        .foregroundColor(textColor.opacity(0.7))
                        .bold()
                    Text(questionItem.relatedWords.prefix(3).joined(separator: ", "))
                        .font(.caption)
                        .foregroundColor(textColor.opacity(0.85))
                        .lineLimit(2)
                }
            }
            
            // 6. 関連分野 & 7. 難易度を1行にまとめる
            HStack(spacing: 8) {
                if !questionItem.relatedFields.isEmpty {
                    HStack(spacing: 3) {
                        Text(labelFor("relatedfields", fallback: "関連分野:"))
                            .font(.caption2)
                            .foregroundColor(textColor.opacity(0.7))
                            .bold()
                        Text(questionItem.relatedFields.prefix(2).joined(separator: ","))
                            .font(.caption)
                            .foregroundColor(textColor.opacity(0.85))
                            .lineLimit(1)
                    }
                }
                
                if !questionItem.difficulty.isEmpty {
                    HStack(spacing: 3) {
                        Text(labelFor("difficulty", fallback: "難易度:"))
                            .font(.caption2)
                            .foregroundColor(textColor.opacity(0.7))
                            .bold()
                        Text(questionItem.difficulty)
                            .font(.caption)
                            .foregroundColor(textColor.opacity(0.85))
                    }
                }
            }
        }
    }
    
    /// 中学古典単語の詳細表示: 語句、発音、意味、用法、関連語、関連分野、難易度
    @ViewBuilder
    private func displayClassicalDetails(_ questionItem: QuestionItem, _ textColor: Color) -> some View {
        Group {
            // 1. 語句（term）
            if !questionItem.term.isEmpty {
                HStack(spacing: 3) {
                    Text(labelFor("term", fallback: "語句:"))
                        .font(.caption2)
                        .foregroundColor(textColor.opacity(0.7))
                        .bold()
                    Text(questionItem.term)
                        .font(.caption)
                        .foregroundColor(textColor.opacity(0.95))
                        .fontWeight(.semibold)
                }
            }
            
            // 2. 発音/読み（reading）
            if !questionItem.reading.isEmpty {
                HStack(spacing: 3) {
                    Text(labelFor("reading", fallback: "読み:"))
                        .font(.caption2)
                        .foregroundColor(textColor.opacity(0.7))
                        .bold()
                    Text(questionItem.reading)
                        .font(.caption)
                        .foregroundColor(textColor.opacity(0.9))
                }
            }
            
            // 3. 意味（meaning）
            if !questionItem.meaning.isEmpty {
                HStack(spacing: 3) {
                    Text(labelFor("meaning", fallback: "意味:"))
                        .font(.caption2)
                        .foregroundColor(textColor.opacity(0.7))
                        .bold()
                    Text(questionItem.meaning)
                        .font(.caption)
                        .foregroundColor(textColor.opacity(0.95))
                }
            }
            
            // 4. 用法（etymology）- 「語源等解説」を「用法」として扱う
            if !questionItem.etymology.isEmpty {
                HStack(alignment: .top, spacing: 3) {
                    Text(labelFor("etymology", fallback: "用法:"))
                        .font(.caption2)
                        .foregroundColor(textColor.opacity(0.7))
                        .bold()
                    Text(questionItem.etymology)
                        .font(.caption)
                        .foregroundColor(textColor.opacity(0.85))
                        .lineLimit(3)
                }
            }
            
            // 5. 関連語（relatedWords）
            if !questionItem.relatedWords.isEmpty {
                HStack(alignment: .top, spacing: 3) {
                    Text(labelFor("relatedwords", fallback: "関連語:"))
                        .font(.caption2)
                        .foregroundColor(textColor.opacity(0.7))
                        .bold()
                    Text(questionItem.relatedWords.prefix(3).joined(separator: ", "))
                        .font(.caption)
                        .foregroundColor(textColor.opacity(0.85))
                        .lineLimit(2)
                }
            }
            
            // 6. 関連分野 & 7. 難易度を1行にまとめる
            HStack(spacing: 8) {
                if !questionItem.relatedFields.isEmpty {
                    HStack(spacing: 3) {
                        Text(labelFor("relatedfields", fallback: "関連分野:"))
                            .font(.caption2)
                            .foregroundColor(textColor.opacity(0.7))
                            .bold()
                        Text(questionItem.relatedFields.prefix(2).joined(separator: ","))
                            .font(.caption)
                            .foregroundColor(textColor.opacity(0.85))
                            .lineLimit(1)
                    }
                }
                
                if !questionItem.difficulty.isEmpty {
                    HStack(spacing: 3) {
                        Text(labelFor("difficulty", fallback: "難易度:"))
                            .font(.caption2)
                            .foregroundColor(textColor.opacity(0.7))
                            .bold()
                        Text(questionItem.difficulty)
                            .font(.caption)
                            .foregroundColor(textColor.opacity(0.85))
                    }
                }
            }
        }
    }
    
    /// 中学英単語・英熟語・英会話・xcodeの詳細表示: 語句、発音、和訳、語源等解説、関連語と意味、関連分野、難易度
    @ViewBuilder
    private func displayEnglishDetails(_ questionItem: QuestionItem, _ textColor: Color) -> some View {
        Group {
            // 1. 語句（term）+ 発音を括弧内に表示
            if !questionItem.term.isEmpty {
                HStack(spacing: 3) {
                    Text(labelFor("term", fallback: "語句:"))
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
                HStack(spacing: 3) {
                    Text(labelFor("meaning", fallback: "和訳:"))
                        .font(.caption2)
                        .foregroundColor(textColor.opacity(0.7))
                        .bold()
                    Text(questionItem.meaning)
                        .font(.caption)
                        .foregroundColor(textColor.opacity(0.95))
                }
            }
            
            // 4. 語源等解説（etymology）
            if !questionItem.etymology.isEmpty {
                HStack(alignment: .top, spacing: 3) {
                    Text(labelFor("etymology", fallback: "語源等解説:"))
                        .font(.caption2)
                        .foregroundColor(textColor.opacity(0.7))
                        .bold()
                    Text(questionItem.etymology)
                        .font(.caption)
                        .foregroundColor(textColor.opacity(0.85))
                        .lineLimit(3)
                }
            }
            
            // 5. 関連語と意味（relatedWords）
            if !questionItem.relatedWords.isEmpty {
                HStack(alignment: .top, spacing: 3) {
                    Text(labelFor("relatedwords", fallback: "関連語と意味:"))
                        .font(.caption2)
                        .foregroundColor(textColor.opacity(0.7))
                        .bold()
                    Text(questionItem.relatedWords.prefix(3).joined(separator: ", "))
                        .font(.caption)
                        .foregroundColor(textColor.opacity(0.85))
                        .lineLimit(2)
                }
            }
            
            // 6. 関連分野 & 7. 難易度を1行にまとめる
            HStack(spacing: 8) {
                if !questionItem.relatedFields.isEmpty {
                    HStack(spacing: 3) {
                        Text(labelFor("relatedfields", fallback: "関連分野:"))
                            .font(.caption2)
                            .foregroundColor(textColor.opacity(0.7))
                            .bold()
                        Text(questionItem.relatedFields.prefix(2).joined(separator: ","))
                            .font(.caption)
                            .foregroundColor(textColor.opacity(0.85))
                            .lineLimit(1)
                    }
                }
                
                if !questionItem.difficulty.isEmpty {
                    HStack(spacing: 3) {
                        Text(labelFor("difficulty", fallback: "難易度:"))
                            .font(.caption2)
                            .foregroundColor(textColor.opacity(0.7))
                            .bold()
                        Text(questionItem.difficulty)
                            .font(.caption)
                            .foregroundColor(textColor.opacity(0.85))
                    }
                }
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
