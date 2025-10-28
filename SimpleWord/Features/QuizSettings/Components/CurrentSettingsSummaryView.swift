//
//  CurrentSettingsSummaryView.swift
//  SimpleWord
//
//  Created by リファクタリング フェーズ2
//

// 現在の設定要約カード
// - 何を: CSV名、分野、難易度、出題設定、挙動、外観をまとめて表示
// - なぜ: 設定全体を一目で把握できるようにするため

import SwiftUI

/// 現在のクイズ設定を要約して表示するカード
struct CurrentSettingsSummaryView: View {
    let csvName: String?
    let fields: [String]
    let difficulties: [String]
    let questionsPerBatch: Int
    let numberOfChoices: Int
    let repeatCount: Int
    let threshold: Double
    let isRandomOrder: Bool
    let isSpeechEnabled: Bool
    let isTimerEnabled: Bool
    let timeLimit: Int
    let learningMode: LearningMode
    let autoAdvance: Bool
    let appearance: Appearance
    let cardBackground: Color
    
    var body: some View {
        SectionCard(backgroundColor: cardBackground) {
            VStack(alignment: .leading, spacing: 10) {
                // ヘッダー
                HStack(alignment: .firstTextBaseline) {
                    Text("現在の設定")
                        .font(.headline)
                    Spacer()
                    // 難易度バッジ
                    if !difficulties.isEmpty {
                        HStack(spacing: 6) {
                            ForEach(difficulties, id: \.self) { d in
                                DifficultyBadge(text: d)
                            }
                        }
                    }
                }
                
                // 設定の要約リスト
                VStack(alignment: .leading, spacing: 8) {
                    // グループ: 一般
                    VStack(alignment: .leading, spacing: 4) {
                        Text("一般")
                            .font(.subheadline)
                            .bold()
                        Text("CSV: \(csvName ?? "(未設定)")")
                            .font(.caption)
                        Text("分野: \(fields.isEmpty ? "全て" : fields.joined(separator: ", "))")
                            .font(.caption)
                        Text("難易度: \(difficulties.isEmpty ? "全て" : difficulties.joined(separator: ", "))")
                            .font(.caption)
                    }
                    
                    Divider()
                    
                    // グループ: 出題設定
                    VStack(alignment: .leading, spacing: 4) {
                        Text("出題設定")
                            .font(.subheadline)
                            .bold()
                        HStack(spacing: 12) {
                            Text("出題数: \(questionsPerBatch)問")
                                .font(.caption)
                            Text("選択肢: \(numberOfChoices)")
                                .font(.caption)
                            Text("繰り返し: \(repeatCount)回")
                                .font(.caption)
                        }
                        Text("合格率: \(Int(threshold * 100))%")
                            .font(.caption)
                    }
                    
                    Divider()
                    
                    // グループ: 挙動
                    VStack(alignment: .leading, spacing: 4) {
                        Text("挙動")
                            .font(.subheadline)
                            .bold()
                        HStack(spacing: 12) {
                            Text("ランダム: \(isRandomOrder ? "有効" : "無効")")
                                .font(.caption)
                            Text("音声: \(isSpeechEnabled ? "有効" : "無効")")
                                .font(.caption)
                        }
                        Text("タイマー: \(isTimerEnabled ? "有効 (\(timeLimit)秒)" : "無効")")
                            .font(.caption)
                        Text("学習モード: \(learningMode.displayName)")
                            .font(.caption)
                        Text("自動進行: \(autoAdvance ? "有効" : "無効")")
                            .font(.caption)
                    }
                    
                    Divider()
                    
                    // グループ: 外観
                    VStack(alignment: .leading, spacing: 4) {
                        Text("外観")
                            .font(.subheadline)
                            .bold()
                        Text(appearance.displayName)
                            .font(.caption)
                    }
                }
            }
        }
        .listRowInsets(EdgeInsets())
        .listRowBackground(cardBackground)
    }
}

// MARK: - Preview
#Preview {
    List {
        CurrentSettingsSummaryView(
            csvName: "中学英単語.csv",
            fields: ["動詞", "名詞"],
            difficulties: ["基礎", "標準"],
            questionsPerBatch: 10,
            numberOfChoices: 4,
            repeatCount: 3,
            threshold: 0.8,
            isRandomOrder: true,
            isSpeechEnabled: true,
            isTimerEnabled: true,
            timeLimit: 30,
            learningMode: .standard,
            autoAdvance: false,
            appearance: .system,
            cardBackground: Color(uiColor: .secondarySystemBackground)
        )
    }
}
