// WordScoresView.swift
// 単語別の成績一覧
// - 何を: 問題集ごとに単語IDごとの正答率を表示し、苦手な語を見つけやすくします。
// - なぜ: 個別の弱点克服に役立てるため（出題アルゴリズム改善の基礎データ）。

import SwiftUI

struct WordScoresView: View {
    @EnvironmentObject var wordScoreStore: WordScoreStore
    @State private var itemsByID: [UUID: QuestionItem] = [:]
    @State private var loadingError: String? = nil
    @State private var availableCSVs: [String] = []
    @State private var selectedCSV: String? = nil
    @State private var showResetAlert: Bool = false

    var body: some View {
        List {
            if let err = loadingError {
                Section {
                    Text(err).foregroundColor(.red)
                }
            }
            
            // 問題集選択
            Section(header: Text("問題集")) {
                if availableCSVs.isEmpty {
                    Text("利用可能な問題集がありません").foregroundColor(.secondary)
                } else {
                    Picker("問題集を選択", selection: $selectedCSV) {
                        Text("選択してください").tag(nil as String?)
                        ForEach(availableCSVs, id: \.self) { csvName in
                            Text(csvName).tag(csvName as String?)
                        }
                    }
                    .onChange(of: selectedCSV) { oldValue, newValue in
                        if let csv = newValue {
                            wordScoreStore.switchToCSV(csv)
                            loadItemsForCSV(csv)
                        }
                    }
                }
            }

            Section(header: Text("単語ごとの成績")) {
                if selectedCSV == nil {
                    Text("問題集を選択してください").foregroundColor(.secondary)
                } else if wordScoreStore.scores.isEmpty {
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

            if selectedCSV != nil {
                Section {
                    Button(role: .destructive) {
                        showResetAlert = true
                    } label: {
                        Text("この問題集の成績をリセット")
                    }
                }
            }
            
            Section {
                Button(role: .destructive) {
                    wordScoreStore.resetAll()
                    selectedCSV = nil
                    itemsByID.removeAll()
                } label: {
                    Text("全成績をリセット")
                }
            }
        }
        .listStyle(InsetGroupedListStyle())
        .navigationTitle("Word Scores")
        .onAppear(perform: loadAvailableCSVs)
        .alert("学習結果のリセット", isPresented: $showResetAlert) {
            Button("キャンセル", role: .cancel) { }
            Button("リセット", role: .destructive) {
                if let csv = selectedCSV {
                    wordScoreStore.reset(csvName: csv)
                }
            }
        } message: {
            if let csv = selectedCSV {
                Text("「\(csv)」の学習結果をリセットしますか？この操作は取り消せません。")
            }
        }
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
    
    // 利用可能なCSVリストを読み込む
    private func loadAvailableCSVs() {
        var csvs = Set<String>()
        // Bundle CSVs
        csvs.formUnion(FileUtils.listBundleCSVFiles())
        // Documents CSVs
        csvs.formUnion(FileUtils.listCSVFilesInDocuments())
        availableCSVs = Array(csvs).sorted()
    }

    // 指定CSVの単語情報を読み込む
    private func loadItemsForCSV(_ csvName: String) {
<<<<<<< HEAD
        Task {
            var map: [UUID: QuestionItem] = [:]
            let base = csvName.replacingOccurrences(of: ".csv", with: "")
            
            let repository = await MainActor.run {
                QuestionItemRepository(fileName: base)
            }
            
            let result = await MainActor.run {
                repository.fetch()
            }
            
            if case .success(let arr) = result {
                for it in arr { map[it.id] = it }
            }
            
            await MainActor.run {
=======
        DispatchQueue.global(qos: .userInitiated).async {
            var map: [UUID: QuestionItem] = [:]
            let base = csvName.replacingOccurrences(of: ".csv", with: "")
            let repository = QuestionItemRepository(fileName: base)
            
            if case .success(let arr) = repository.fetch() {
                for it in arr { map[it.id] = it }
            }
            
            DispatchQueue.main.async {
>>>>>>> docs/organize-documentation
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
