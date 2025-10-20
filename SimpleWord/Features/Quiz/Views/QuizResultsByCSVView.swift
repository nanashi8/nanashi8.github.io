// QuizResultsByCSVView.swift
// CSVごとの成績一覧
// - 何を: 各CSVに含まれる語彙の総試行/正解を集計して表示します。
// - なぜ: 教材（CSV）単位の進捗を把握しやすくするため。

import SwiftUI

// CSVごとの成績を集計して一覧表示
struct QuizResultsByCSVView: View {
    @EnvironmentObject var scoreStore: ScoreStore
    @EnvironmentObject var wordScoreStore: WordScoreStore

    @State private var csvNames: [String] = []
    @State private var summaryByCSV: [String: (attempts: Int, correct: Int)] = [:]

    var body: some View {
        List {
            Section(header: SectionHeader(systemImage: "chart.bar.fill", title: "CSV別の成績")) {
                if csvNames.isEmpty {
                    Text("成績を表示できるCSVがありません")
                        .foregroundColor(.secondary)
                } else {
                    ForEach(csvNames, id: \.self) { name in
                        NavigationLink {
                            QuizResultsDetailView(csvName: name)
                                .environmentObject(wordScoreStore)
                        } label: {
                            HStack(alignment: .firstTextBaseline) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(name)
                                        .font(.headline)
                                    if let s = summaryByCSV[name] {
                                        Text("正解: \(s.correct) / \(s.attempts)")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                }
                                Spacer()
                                if let s = summaryByCSV[name] {
                                    let acc = (s.attempts > 0) ? Double(s.correct) / Double(s.attempts) : 0.0
                                    Text(String(format: "%.0f%%", acc * 100))
                                        .font(.headline)
                                }
                            }
                            .padding(.vertical, 6)
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("CSV別の成績")
        .onAppear(perform: recompute)
    }

    private func recompute() {
        // 1) 結果から参照されたCSV名を集める
        var names = Set<String>()
        for r in scoreStore.results {
            if let n = r.settings.selectedCSV, !n.isEmpty {
                names.insert(n)
            }
        }
        // 2) ファイルシステム上に存在するCSVも加える
        for n in FileUtils.listCSVFilesInDocuments() { names.insert(n) }
        for n in FileUtils.listBundleCSVFiles() { names.insert(n) }
        let list = Array(names).sorted()
        self.csvNames = list

        // 3) 各CSVの総試行/正解を、WordScoreStore を使って集計
        var map: [String: (attempts: Int, correct: Int)] = [:]
        for name in list {
            let items = loadItems(forCSVName: name)
            var attempts = 0
            var correct = 0
            
            // 一時的に問題集を切り替えてスコアを取得
            let previousCSV = wordScoreStore.currentCSVName
            wordScoreStore.switchToCSV(name)
            
            for it in items {
                let s = wordScoreStore.score(for: it.id)
                attempts += s.attempts
                correct += s.correct
            }
            
            // 元の問題集に戻す
            if let prev = previousCSV {
                wordScoreStore.switchToCSV(prev)
            }
            
            map[name] = (attempts, correct)
        }
        self.summaryByCSV = map
    }

    private func loadItems(forCSVName name: String) -> [QuestionItem] {
        let base = name.replacingOccurrences(of: ".csv", with: "")
        let repository = QuestionItemRepository(fileName: base)
        if case .success(let arr) = repository.fetch() {
            return arr
        }
        return []
    }
}

#Preview {
    NavigationStack {
        QuizResultsByCSVView()
            .environmentObject(ScoreStore())
            .environmentObject(WordScoreStore())
    }
}
