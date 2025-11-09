// NavigatorView.swift
// 問題ナビゲーター（CSVを読み込み一覧 → タップで詳細）
// - 何を: CSVからQuestionItemを読み込み、検索/確認しやすい一覧を提供します。
// - なぜ: 編集や学習前に内容を確認したり、個別の語を参照するため。

import SwiftUI
import UniformTypeIdentifiers

extension Notification.Name {
    static let csvFileDidChange = Notification.Name("csvFileDidChange")
}

struct NavigatorView: View {
    @State private var items: [QuestionItem] = []
    @State private var errorMessage: String?
    @State private var csvURL: URL? = nil
    @State private var showImporter: Bool = false
    @State private var watcher: FileWatcher? = nil
    // security-scoped access flag for imported file
    @State private var isAccessingSecurityScopedResource: Bool = false

    var body: some View {
        List {
            if items.isEmpty {
                if let msg = errorMessage {
                    Text(msg)
                        .foregroundColor(.red)
                } else {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("No items found.")
                            .foregroundColor(.secondary)
                        Text("Use the import button to select a CSV from Files, or include サンプル単語.csv in the app bundle.")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .listRowBackground(Color.clear)
                }
            } else {
                ForEach(items) { item in
                    NavigationLink {
                        QuestionDetailView(item: item)
                    } label: {
                        HStack(alignment: .firstTextBaseline) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(item.term)
                                    .font(.headline)
                                HStack(spacing: 6) {
                                    if !item.reading.isEmpty {
                                        Text(item.reading)
                                            .font(.subheadline)
                                            .foregroundColor(.secondary)
                                    }
                                    if !item.meaning.isEmpty {
                                        Text("—")
                                            .foregroundColor(.secondary)
                                        Text(item.meaning)
                                            .font(.subheadline)
                                            .foregroundColor(.primary)
                                            .lineLimit(1)
                                    }
                                }
                            }
                            Spacer()
                            if !item.difficulty.isEmpty {
                                DifficultyBadge(text: item.difficulty)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Navigator")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear(perform: onAppear)
        .onReceive(NotificationCenter.default.publisher(for: .csvFileDidChange)) { notification in
            if let url = notification.object as? URL {
                load(from: url)
            }
        }
        .onDisappear {
            watcher?.invalidate()
            watcher = nil
            // stop security-scoped access if we previously started it
            stopAccessIfNeeded()
        }
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button(action: { showImporter = true }) {
                    Label("Import CSV", systemImage: "square.and.arrow.down")
                }
            }
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: reload) {
                    Image(systemName: "arrow.clockwise")
                }
            }
        }
        .fileImporter(isPresented: $showImporter, allowedContentTypes: [UTType.commaSeparatedText]) { res in
            switch res {
            case .success(let url):
                // security-scoped resource may be needed on some platforms
                csvURL = url
                startWatching(url: url)
                load(from: url)
            case .failure(let err):
                errorMessage = "Import failed: \(err.localizedDescription)"
            }
        }
    }

    private func onAppear() {
        //  優先: 選択された csvURL -> バンドル内の 高校単語.csv -> サンプル単語.csv
        if let url = csvURL {
            startWatching(url: url)
            load(from: url)
            return
        }
        do {
            let loader = CSVLoader()
            // まず highschool_words を試す（新たに追加したファイル）
            if let highschool = try? loader.loadFromBundle(named: "高校単語"), !highschool.isEmpty {
                self.items = highschool
                self.errorMessage = nil
                return
            }
            // フォールバック: 既存の sample_words
            let loaded = try loader.loadFromBundle(named: "サンプル単語")
            self.items = loaded
            self.errorMessage = nil
        } catch {
            self.items = []
            self.errorMessage = "CSV load failed: \(error)"
        }
    }

    private func startWatching(url: URL) {
        watcher?.invalidate()
        // If the URL is security-scoped (from Files), start access before opening
        if url.startAccessingSecurityScopedResource() {
            isAccessingSecurityScopedResource = true
        }
        // Post a notification on change so we don't capture the struct `self` in the closure
        watcher = FileWatcher(url: url) {
            NotificationCenter.default.post(name: .csvFileDidChange, object: url)
        }
    }

    private func load(from url: URL) {
        // URL からの直接ロードは CSVLoader の機能を使用（Documents フォルダ対応）
        let loader = CSVLoader()
        do {
            let loaded = try loader.load(from: url)
            DispatchQueue.main.async {
                self.items = loaded
                self.errorMessage = nil
            }
        } catch {
            DispatchQueue.main.async {
                self.items = []
                self.errorMessage = "CSV load failed: \(error)"
            }
        }
    }

    private func reload() {
        if let url = csvURL {
            load(from: url)
        } else {
            onAppear()
        }
    }
}

// NOTE: The `QuestionDetailView` implementation was moved to `SimpleWord/Views/QuestionDetailView.swift`.
// Remove the duplicated local definition to avoid redeclaration and ambiguous initializer issues.

#Preview {
    NavigationStack {
        NavigatorView()
    }
}

// Ensure that when watcher is invalidated we also stop security-scoped access
extension NavigatorView {
    private func stopAccessIfNeeded() {
        if isAccessingSecurityScopedResource, let url = csvURL {
            url.stopAccessingSecurityScopedResource()
            isAccessingSecurityScopedResource = false
        }
    }
}
