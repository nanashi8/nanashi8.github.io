// CSVEditorView.swift
// （参考）CSVをテキストとして直接編集
// - 何を: CSV全体をテキストエディタで編集/保存します（高度な用途向け）。
// - なぜ: 細かい一括修正が必要な場合に備えたバックアップ的編集手段。

import SwiftUI

struct CSVEditorView: View {
    @Environment(\.presentationMode) var presentationMode
    let fileURL: URL
    @State private var text: String = ""
    @State private var errorMessage: String?
    @State private var infoMessage: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                if let err = errorMessage {
                    Text(err)
                        .foregroundColor(.red)
                }
                if let info = infoMessage {
                    Text(info)
                        .foregroundColor(.green)
                }

                SectionHeader(systemImage: "doc.text", title: "ファイル内容")
                SectionCard {
                    // モノスペースでCSVが見やすいようにする
                    TextEditor(text: $text)
                        .font(.system(.body, design: .monospaced))
                        .frame(minHeight: 320)
                }

                Text("列の順序: term, reading, meaning, etymology, relatedWords, relatedFields, difficulty")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            .padding()
        }
        .background(Color(UIColor.systemGroupedBackground))
        .navigationTitle(fileURL.lastPathComponent)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Save") { save() }
            }
        }
        .onAppear(perform: load)
    }

    private func load() {
        do {
            text = try String(contentsOf: fileURL, encoding: .utf8)
            errorMessage = nil
            infoMessage = nil
        } catch {
            errorMessage = "Failed to read file: \(error.localizedDescription)"
        }
    }

    private func save() {
        do {
            try FileUtils.saveCSVText(text, to: fileURL)
            infoMessage = "Saved."
            errorMessage = nil
            presentationMode.wrappedValue.dismiss()
        } catch {
            errorMessage = "Save failed: \(error.localizedDescription)"
        }
    }
}

#Preview {
    NavigationStack {
        // Preview won't have a valid URL; show a placeholder
        Text("CSV Editor Preview")
    }
}
