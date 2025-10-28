//
//  QuizParametersView.swift
//  SimpleWord
//
//  Created by リファクタリング フェーズ2
//

// 出題設定コンポーネント
// - 何を: バッチサイズ、合格率、繰り返し回数、タイマー、選択肢数、音声、学習モード、自動進行を設定
// - なぜ: 出題の詳細な条件を細かく調整できるようにするため

import SwiftUI

/// 出題パラメータを設定するコンポーネント
struct QuizParametersView: View {
    @Binding var questionsPerBatch: Int
    @Binding var threshold: Double
    @Binding var repeatCount: Int
    @Binding var isRandomOrder: Bool
    @Binding var isTimerEnabled: Bool
    @Binding var timeLimit: Int
    @Binding var numberOfChoices: Int
    @Binding var isSpeechEnabled: Bool
    @Binding var learningMode: LearningMode
    @Binding var autoAdvance: Bool
    let cardBackground: Color
    
    var body: some View {
        SectionCard(backgroundColor: cardBackground) {
            VStack(alignment: .leading, spacing: 20) {
                // バッチサイズ
                Stepper("バッチサイズ: \(questionsPerBatch)問", value: $questionsPerBatch, in: 1...50)
                
                // 合格率（スライダー）
                VStack(alignment: .leading) {
                    Text("合格率: \(Int(threshold * 100))%")
                    Slider(value: $threshold, in: 0...1, step: 0.05)
                }
                
                // 繰り返し回数
                Stepper("繰り返し回数: \(repeatCount)回", value: $repeatCount, in: 1...10)
                
                // ランダム出題
                Toggle(isOn: $isRandomOrder) {
                    Text("ランダム出題")
                }
                
                // タイマー有効化
                Toggle(isOn: $isTimerEnabled) {
                    Text("タイマーを有効にする")
                }
                
                // タイマー制限時間（タイマー有効時のみ表示）
                if isTimerEnabled {
                    Stepper("制限時間: \(timeLimit)秒", value: $timeLimit, in: 5...600, step: 5)
                }
                
                // 選択肢の数
                Stepper("選択肢の数: \(numberOfChoices)", value: $numberOfChoices, in: 2...6)
                
                // 音声読み上げ
                Toggle(isOn: $isSpeechEnabled) {
                    Text("音声読み上げ")
                }
                
                // 学習モード
                VStack(alignment: .leading) {
                    Text("学習モード")
                        .font(.subheadline)
                    Picker("学習モード", selection: $learningMode) {
                        ForEach(LearningMode.allCases) { mode in
                            Text(mode.displayName).tag(mode)
                        }
                    }
                    .pickerStyle(.wheel)
                    .frame(height: 100)
                }
                
                // 自動進行
                Toggle(isOn: $autoAdvance) {
                    Text("回答後に自動で次へ")
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
        Section(header: Text("出題設定")) {
            QuizParametersView(
                questionsPerBatch: .constant(10),
                threshold: .constant(0.8),
                repeatCount: .constant(3),
                isRandomOrder: .constant(true),
                isTimerEnabled: .constant(true),
                timeLimit: .constant(30),
                numberOfChoices: .constant(4),
                isSpeechEnabled: .constant(true),
                learningMode: .constant(.standard),
                autoAdvance: .constant(false),
                cardBackground: Color(uiColor: .secondarySystemBackground)
            )
        }
    }
}
