// QuizResultsDetailView.swift
// CSV別の詳細成績（分野/難易度）
// - 何を: 指定CSVの分野ごと・難易度ごとの試行/正解と正答率を表示します。
// - なぜ: どの分野やレベルが苦手かを特定し、学習計画に反映するため。

import SwiftUI

// 指定CSVの詳細成績（分野・難易度ごとの集計）
struct QuizResultsDetailView: View {
    let csvName: String
    @EnvironmentObject var wordScoreStore: WordScoreStore

    @State private var fieldStats: [(key: String, attempts: Int, correct: Int)] = []
    @State private var diffStats: [(key: String, attempts: Int, correct: Int)] = []
    @State private var totalAttempts: Int = 0
    @State private var totalCorrect: Int = 0

    var body: some View {
        List {
            Section(header: SectionHeader(systemImage: "doc.text", title: csvName)) {
                HStack {
                    Text("総合")
                    Spacer()
                    Text("正解: \(totalCorrect) / \(totalAttempts)")
                        .foregroundColor(.secondary)
                }
            }

            Section(header: SectionHeader(systemImage: "square.grid.2x2", title: "分野ごとの成績")) {
                if fieldStats.isEmpty {
                    Text("分野情報がありません").foregroundColor(.secondary)
                } else {
                    ForEach(fieldStats, id: \.key) { s in
                        HStack {
                            Text(s.key)
                            Spacer()
                            let acc = (s.attempts > 0) ? Double(s.correct) / Double(s.attempts) : 0.0
                            Text(String(format: "%.0f%%  (\(s.correct)/\(s.attempts))", acc * 100))
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }

            Section(header: SectionHeader(systemImage: "flag.checkered", title: "難易度ごとの成績")) {
                if diffStats.isEmpty {
                    Text("難易度情報がありません").foregroundColor(.secondary)
                } else {
                    ForEach(diffStats, id: \.key) { s in
                        HStack {
                            if s.key.isEmpty { Text("(未設定)") } else { DifficultyBadge(text: s.key) }
                            Spacer()
                            let acc = (s.attempts > 0) ? Double(s.correct) / Double(s.attempts) : 0.0
                            Text(String(format: "%.0f%%  (\(s.correct)/\(s.attempts))", acc * 100))
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("詳細")
        .onAppear(perform: compute)
    }

    private func compute() {
        let items = loadItems(forCSVName: csvName)
        var totalA = 0
        var totalC = 0

        var fieldMap: [String: (a: Int, c: Int)] = [:]
        var diffMap: [String: (a: Int, c: Int)] = [:]

        for it in items {
            let s = wordScoreStore.score(for: it.id)
            totalA += s.attempts
            totalC += s.correct
            // fields
            let fields = it.relatedFields.isEmpty ? ["(未設定)"] : it.relatedFields
            for f in fields {
                var entry = fieldMap[f] ?? (0,0)
                entry.a += s.attempts
                entry.c += s.correct
                fieldMap[f] = entry
            }
            // difficulty
            let d = it.difficulty
            var e = diffMap[d] ?? (0,0)
            e.a += s.attempts
            e.c += s.correct
            diffMap[d] = e
        }

        self.totalAttempts = totalA
        self.totalCorrect = totalC
        self.fieldStats = fieldMap.map { (key: $0.key, attempts: $0.value.a, correct: $0.value.c) }.sorted { $0.key < $1.key }
        self.diffStats = diffMap.map { (key: $0.key, attempts: $0.value.a, correct: $0.value.c) }.sorted { $0.key < $1.key }
    }

    private func loadItems(forCSVName name: String) -> [QuestionItem] {
        let loader = CSVLoader()
        // Documents first
        if let dir = FileUtils.documentsDirectory {
            let url = dir.appendingPathComponent(name)
            if FileManager.default.fileExists(atPath: url.path), let arr = try? loader.load(from: url) {
                return arr
            }
        }
        // Bundle fallback (name may include .csv)
        let base = name.replacingOccurrences(of: ".csv", with: "")
        if let arr = try? loader.loadFromBundle(named: base) { return arr }
        return []
    }
}

#Preview {
    NavigationStack {
        QuizResultsDetailView(csvName: "サンプル単語.csv").environmentObject(WordScoreStore())
    }
}
