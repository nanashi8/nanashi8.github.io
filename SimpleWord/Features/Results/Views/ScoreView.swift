import SwiftUI

// ScoreView.swift
// 成績画面（CSV別/単語別）
// - 何を: 学習結果を2つの観点で表示します。CSV別=教材ごとの合計、単語別=各語句の正答率。
// - なぜ: 教材単位の進捗と個々の弱点の両方を把握し、次の学習計画に活かすため。

struct ScoreView: View {
    @EnvironmentObject var scoreStore: ScoreStore
    @EnvironmentObject var wordScoreStore: WordScoreStore

    // 0: CSV別, 1: 単語別
    @State private var selectedTab: Int = 0

    var body: some View {
        VStack(spacing: 0) {
            // Segmented control to switch between CSV別 and 単語別
            Picker(selection: $selectedTab, label: Text("View")) {
                Text("CSV別").tag(0)
                Text("単語別").tag(1)
            }
            .pickerStyle(.segmented)
            .padding([.top, .horizontal])

            // Content
            if selectedTab == 0 {
                QuizResultsByCSVView()
                    .environmentObject(scoreStore)
                    .environmentObject(wordScoreStore)
            } else {
                WordScoresView()
                    .environmentObject(wordScoreStore)
            }
        }
        .navigationTitle(selectedTab == 0 ? "CSV別の成績" : "単語別の成績")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationStack {
        ScoreView()
            .environmentObject(ScoreStore())
            .environmentObject(WordScoreStore())
    }
}
