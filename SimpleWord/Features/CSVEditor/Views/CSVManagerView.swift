//
//  CSVManagerView.swift
//  SimpleWord
//
//  Created by automated-recovery on 2025/10/15.
//

import SwiftUI

// 問題集管理画面
// - 目的: CSV のインポート・エクスポート・一覧表示・削除を行うための画面
// - 備考: バンドル(Resources)とアプリの Documents ディレクトリを走査して .csv を一覧表示します。
//         バンドル内ファイルは読み取り専用なため削除は行いません。インポート/エクスポートは別タスクで実装予定。
struct CSVManagerView: View {
    // 表示用のCSVファイル名リスト
    @State private var csvFiles: [String] = []
    // ファイル名 -> URL のマップ（削除やエクスポート時に参照する）
    @State private var fileURLs: [String: URL] = [:]

    @State private var showingImporter: Bool = false
    @State private var showingExporter: Bool = false

    var body: some View {
        List {
            // 利用可能なCSV一覧
            Section(header: Text("利用可能なCSV")) {
                if csvFiles.isEmpty {
                    Text("Resources または Documents フォルダからCSVを読み込んでください")
                        .foregroundColor(.secondary)
                } else {
                    ForEach(csvFiles, id: \.self) { name in
                        HStack(spacing: 12) {
                            Image(systemName: "doc.text")
                                .imageScale(.medium)
                            Text(name)
                            Spacer()
                        }
                        .contentShape(Rectangle())
                    }
                    .onDelete(perform: deleteCSV)
                }
            }

            // 操作セクション
            Section {
                Button(action: { showingImporter.toggle() }) {
                    Label("インポート", systemImage: "square.and.arrow.down")
                }
                Button(action: { showingExporter.toggle() }) {
                    Label("エクスポート", systemImage: "square.and.arrow.up")
                }
            }
        }
        .listStyle(InsetGroupedListStyle())
        .navigationTitle("問題集管理")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                EditButton()
            }
        }
        .onAppear(perform: loadCSVFiles)
        // 将来的なインポーター/エクスポーター表示用のプレースホルダ
        .sheet(isPresented: $showingImporter) {
            // 簡易インポーター説明
            NavigationView {
                VStack(spacing: 16) {
                    Text("CSV をインポートする処理をここに実装します。ファイルピッカー経由で Documents に保存する想定です。")
                        .padding()
                    Spacer()
                }
                .navigationTitle("CSV インポート")
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button("閉じる") { showingImporter = false } } }
            }
        }
        .sheet(isPresented: $showingExporter) {
            NavigationView {
                VStack(spacing: 16) {
                    Text("CSV をエクスポートする処理をここに実装します。Documents のファイルを外部に書き出す想定です。")
                        .padding()
                    Spacer()
                }
                .navigationTitle("CSV エクスポート")
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button("閉じる") { showingExporter = false } } }
            }
        }
    }

    // MARK: - 内部処理

    /// 画面表示時に利用可能なCSV一覧を読み込む
    /// - バンドル（Resources）内の csv と、アプリの Documents ディレクトリ内の csv を結合して表示します
    private func loadCSVFiles() {
        var foundFiles: [String] = []
        var urlsMap: [String: URL] = [:]

        // 1) バンドル内の csv (読み取り専用)
        if let bundleURLs = Bundle.main.urls(forResourcesWithExtension: "csv", subdirectory: nil) {
            for url in bundleURLs {
                let name = url.lastPathComponent
                foundFiles.append(name)
                urlsMap[name] = url
            }
        }

        // 2) Documents ディレクトリ内の csv (読み書き可能)
        let fm = FileManager.default
        if let docsURL = fm.urls(for: .documentDirectory, in: .userDomainMask).first {
            do {
                let docContents = try fm.contentsOfDirectory(at: docsURL, includingPropertiesForKeys: nil)
                for url in docContents where url.pathExtension.lowercased() == "csv" {
                    let name = url.lastPathComponent
                    // 重複があれば Documents 側を優先して上書き
                    if !foundFiles.contains(name) {
                        foundFiles.append(name)
                    }
                    urlsMap[name] = url
                }
            } catch {
                // エラーは UI 上で特別扱いしない（ログ出力）
                #if DEBUG
                print("CSVManagerView: Documents の読み込みに失敗しました: \(error)")
                #endif
            }
        }

        // UI 更新はメインスレッドで
        DispatchQueue.main.async {
            self.csvFiles = foundFiles.sorted()
            self.fileURLs = urlsMap
        }
    }

    /// CSV を削除する（Documents 内のファイルのみ実際に削除する）
    /// - Parameter offsets: 削除するインデックス集合
    private func deleteCSV(at offsets: IndexSet) {
        // 削除対象の名前を取得
        // IndexSet の要素型は Int だが、コンパイラがクロージャの戻り型を推論できない場面があるため
        // 明示的に型を指定して String? を返すクロージャにする
        let namesToDelete: [String] = offsets.compactMap { (idx: Int) -> String? in
            guard idx < csvFiles.count else { return nil }
            return csvFiles[idx]
        }

        let fm = FileManager.default
        for name in namesToDelete {
            if let url = fileURLs[name] {
                // Documents 内にあるファイルかどうかをチェックしてから削除
                if url.isFileURL && url.path.contains("/Documents/") {
                    do {
                        try fm.removeItem(at: url)
                        #if DEBUG
                        print("CSVManagerView: Deleted file at \(url)")
                        #endif
                    } catch {
                        #if DEBUG
                        print("CSVManagerView: ファイル削除に失敗しました(\(error))")
                        #endif
                    }
                }
            }
        }

        // UI 側のリストを更新
        loadCSVFiles()
    }
}

struct CSVManagerView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            CSVManagerView()
        }
    }
}
