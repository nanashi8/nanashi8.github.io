// WordScoresView.swift
// 単語別の成績一覧
// - 何を: 単語IDごとの正答率を表示し、苦手な語を見つけやすくします。
// - なぜ: 個別の弱点克服に役立てるため（出題アルゴリズム改善の基礎データ）。

import SwiftUI

struct WordScoresView: View {
    @EnvironmentObject var wordScoreStore: WordScoreStore
    @State private var itemsByID: [UUID: QuestionItem] = [:]
    @State private var loadingError: String? = nil

    var body: some View {
        List {
            if let err = loadingError {
                Section {
                    Text(err).foregroundColor(.red)
                }
            }

            Section(header: Text("単語ごとの成績")) {
                if wordScoreStore.scores.isEmpty {
                    Text("まだ成績が記録されていません").foregroundColor(.secondary)
                } else {
                    ForEach(sortedEntries(), id: \.0) { entry in
                        let id = entry.0
                        let score = entry.1
                        HStack {
                            VStack(alignment: .leading) {
                                if let item = itemsByID[id] {
                                    Text(item.term).font(.headline)
                                    HStack {
                                        if !item.reading.isEmpty {
                                            Text(item.reading).font(.caption).foregroundColor(.secondary)
                                        }
                                        if !item.meaning.isEmpty {
                                            Text(item.meaning).font(.caption2).foregroundColor(.secondary)
                                        }
                                    }
                                } else {
                                    Text(id.uuidString).font(.headline)
                                    Text("(詳細情報なし)").font(.caption).foregroundColor(.secondary)
                                }
                            }
                            Spacer()
                            VStack(alignment: .trailing) {
                                Text(String(format: "%.0f%%", score.accuracy * 100.0))
                                    .font(.headline)
                                Text("\(score.correct)/\(score.attempts)")
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding(.vertical, 6)
                    }
                }
            }

            Section {
                Button(role: .destructive) {
                    wordScoreStore.resetAll()
                } label: {
                    Text("全成績をリセット")
                }
            }
        }
        .listStyle(InsetGroupedListStyle())
        .navigationTitle("Word Scores")
        .onAppear(perform: loadAllItems)
    }

    // Sort entries by accuracy ascending then attempts ascending (low accuracy first)
    private func sortedEntries() -> [(UUID, WordScore)] {
        let arr = Array(wordScoreStore.scores.map { ($0.key, $0.value) })
        return arr.sorted { a, b in
            if a.1.accuracy == b.1.accuracy {
                return a.1.attempts < b.1.attempts
            }
            return a.1.accuracy < b.1.accuracy
        }
    }

    // Load QuestionItem for known CSVs (bundle + documents) to show term/reading/meaning
    private func loadAllItems() {
        DispatchQueue.global(qos: .userInitiated).async {
            var map: [UUID: QuestionItem] = [:]
            let loader = CSVLoader()
            // Bundle CSVs
            let bundleFiles = FileUtils.listBundleCSVFiles()
            for name in bundleFiles {
                let base = name.replacingOccurrences(of: ".csv", with: "")
                if let arr = try? loader.loadFromBundle(named: base) {
                    for it in arr { map[it.id] = it }
                }
            }
            // Documents CSVs
            let docFiles = FileUtils.listCSVFilesInDocuments()
            if let docsDir = FileUtils.documentsDirectory {
                for fname in docFiles {
                    let url = docsDir.appendingPathComponent(fname)
                    if let arr = try? loader.load(from: url) {
                        for it in arr { map[it.id] = it }
                    }
                }
            }
            DispatchQueue.main.async {
                self.itemsByID = map
            }
        }
    }
}

#Preview {
    NavigationStack {
        WordScoresView().environmentObject(WordScoreStore())
    }
}
