// CSVManagerView.swift
// CSVマネージャー画面
// - 何を: CSVのインポート（Filesから）、エクスポート（共有/保存）、ドキュメント内CSVの項目ごとの編集を提供します。
// - なぜ: 誤操作を防ぎつつ、安全にデータを取り込み・配布・編集できるようにするため（コピー機能は廃止）。

import SwiftUI
import UniformTypeIdentifiers

struct CSVManagerView: View {
    @EnvironmentObject var quizSettings: QuizSettings
    @State private var bundleFiles: [String] = []
    @State private var docFiles: [String] = []

    // Import / Export states
    @State private var showImporter: Bool = false
    @State private var exportDocument: CSVDocument? = nil
    @State private var isExporting: Bool = false

    // Alerts
    @State private var showingAlert: Bool = false
    @State private var alertMessage: String = ""

    // ホイール選択用のインデックス
    @State private var selectedEditIndex: Int = 0
    @State private var selectedSampleIndex: Int = 0

    // 編集用の一時URL
    @State private var editURL: URL? = nil
    @State private var showEditor: Bool = false

    var body: some View {
        List {
            // 編集するCSV（Documents + Bundle を含む）
            Section(header: SectionHeader(systemImage: "pencil", title: "編集するCSV")) {
                let editable = (docFiles + bundleFiles).removingDuplicates()
                if editable.isEmpty {
                    Text("編集可能なCSVがありません")
                        .foregroundColor(.secondary)
                } else {
                    Picker("CSV", selection: $selectedEditIndex) {
                        ForEach(editable.indices, id: \.self) { i in
                            Text(editable[i]).tag(i)
                        }
                    }
                    .pickerStyle(.wheel)
                    .frame(height: 140)

                    // 編集を開く
                    Button {
                        let name = editable[selectedEditIndex]
                        // Documents に存在するか?
                        if docFiles.contains(name), let dir = FileUtils.documentsDirectory {
                            editURL = dir.appendingPathComponent(name)
                            showEditor = true
                        } else {
                            // bundle 側ならコピーしてから開く
                            let base = name.replacingOccurrences(of: ".csv", with: "")
                            do {
                                let url = try FileUtils.copyBundleCSVToDocuments(named: base)
                                editURL = url
                                // refresh docFiles so next time it's listed as doc
                                refresh()
                                showEditor = true
                            } catch {
                                alertMessage = "バンドルからドキュメントへのコピーに失敗しました: \(error.localizedDescription)"
                                showingAlert = true
                            }
                        }
                    } label: {
                        Label("編集を開く", systemImage: "square.and.pencil")
                    }
                    .buttonStyle(.borderedProminent)
                    .sheet(isPresented: $showEditor) {
                        if let url = editURL {
                            NavigationStack {
                                CSVItemListEditorView(fileURL: url)
                            }
                        } else {
                            EmptyView()
                        }
                    }
                }
            }

            // インポート
            Section(header: SectionHeader(systemImage: "square.and.arrow.down", title: "インポートするCSVを選択")) {
                Button {
                    showImporter = true
                } label: {
                    Label("ファイルから読み込む", systemImage: "folder.badge.plus")
                }
            }

            // サンプルCSV（ホイール選択してエクスポート）
            Section(header: SectionHeader(systemImage: "shippingbox", title: "エクスポートするCSVを選択")) {
                if bundleFiles.isEmpty {
                    Text("バンドル内にCSVがありません")
                        .foregroundColor(.secondary)
                } else {
                    Picker("CSV", selection: $selectedSampleIndex) {
                        ForEach(bundleFiles.indices, id: \.self) { i in
                            Text(bundleFiles[i]).tag(i)
                        }
                    }
                    .pickerStyle(.wheel)
                    .frame(height: 140)

                    if bundleFiles.indices.contains(selectedSampleIndex) {
                        let name = bundleFiles[selectedSampleIndex]
                        Button {
                            exportBundleCSV(named: name)
                        } label: {
                            Label("エクスポート", systemImage: "square.and.arrow.up")
                        }
                        .buttonStyle(.bordered)
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("CSVマネージャー")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: refresh) { Image(systemName: "arrow.clockwise") }
            }
        }
        .onAppear(perform: refresh)
        .fileImporter(isPresented: $showImporter, allowedContentTypes: [UTType.commaSeparatedText]) { res in
            switch res {
            case .success(let url):
                do {
                    let dest = try FileUtils.importCSVFromURL(url)
                    alertMessage = "インポートしました: \(dest.lastPathComponent)"
                    showingAlert = true
                    refresh()
                } catch {
                    alertMessage = "インポート失敗: \(error.localizedDescription)"
                    showingAlert = true
                }
            case .failure(let err):
                alertMessage = "インポート失敗: \(err.localizedDescription)"
                showingAlert = true
            }
        }
        .fileExporter(isPresented: $isExporting, document: exportDocument, contentType: .commaSeparatedText, defaultFilename: exportDocument?.suggestedName) { result in
            switch result {
            case .success:
                alertMessage = "エクスポートしました"
            case .failure(let err):
                alertMessage = "エクスポート失敗: \(err.localizedDescription)"
            }
            showingAlert = true
            exportDocument = nil
        }
        .alert(alertMessage, isPresented: $showingAlert) { Button("OK", role: .cancel) {} }
    }

    private func refresh() {
        bundleFiles = FileUtils.listBundleCSVFiles()
        docFiles = FileUtils.listCSVFilesInDocuments()
        // 補正: 選択インデックスの範囲
        // combine docs+bundle for edit picker
        let editable = (docFiles + bundleFiles).removingDuplicates()
        if !editable.indices.contains(selectedEditIndex) { selectedEditIndex = 0 }
        if !bundleFiles.indices.contains(selectedSampleIndex) { selectedSampleIndex = 0 }
    }

    private func exportDocCSV(named name: String) {
        guard let dir = FileUtils.documentsDirectory else { return }
        let url = dir.appendingPathComponent(name)
        do {
            let data = try Data(contentsOf: url)
            exportDocument = CSVDocument(data: data, suggestedName: name)
            isExporting = true
        } catch {
            alertMessage = "読み込み失敗: \(error.localizedDescription)"
            showingAlert = true
        }
    }

    private func exportBundleCSV(named name: String) {
        let base = name.replacingOccurrences(of: ".csv", with: "")
        guard let url = Bundle.main.url(forResource: base, withExtension: "csv") else {
            alertMessage = "バンドル内に見つかりません"
            showingAlert = true
            return
        }
        do {
            let data = try Data(contentsOf: url)
            exportDocument = CSVDocument(data: data, suggestedName: name)
            isExporting = true
        } catch {
            alertMessage = "読み込み失敗: \(error.localizedDescription)"
            showingAlert = true
        }
    }
}

#Preview {
    NavigationStack {
        CSVManagerView()
            .environmentObject(QuizSettings())
    }
}

// Helper to remove duplicates while preserving order
fileprivate extension Array where Element: Hashable {
    func removingDuplicates() -> [Element] {
        var seen = Set<Element>()
        var out: [Element] = []
        for e in self {
            if !seen.contains(e) { seen.insert(e); out.append(e) }
        }
        return out
    }
}
