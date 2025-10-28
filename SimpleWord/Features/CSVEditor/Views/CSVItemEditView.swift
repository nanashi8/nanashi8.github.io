// CSVItemEditView.swift
// CSVの1項目を編集/追加するフォーム
// - 何を: 語句・読み・意味・語源・関連語・分野・難易度を入力して保存します。
// - なぜ: ミスを減らし、必要なフィールドを漏れなく編集できるようにするため。

import SwiftUI

// 単一項目を編集/追加するフォーム
struct CSVItemEditView: View {
    // 初期値
    @State private var term: String
    @State private var reading: String
    @State private var meaning: String
    @State private var etymology: String
    @State private var relatedWords: String
    @State private var relatedFields: String
    @State private var difficulty: String

    let onSave: (QuestionItem) -> Void
    let onCancel: (() -> Void)?

    init(initial: QuestionItem? = nil, onSave: @escaping (QuestionItem) -> Void, onCancel: (() -> Void)? = nil) {
        _term = State(initialValue: initial?.term ?? "")
        _reading = State(initialValue: initial?.reading ?? "")
        _meaning = State(initialValue: initial?.meaning ?? "")
        _etymology = State(initialValue: initial?.etymology ?? "")
        _relatedWords = State(initialValue: (initial?.relatedWords ?? []).joined(separator: ";"))
        _relatedFields = State(initialValue: (initial?.relatedFields ?? []).joined(separator: ";"))
        _difficulty = State(initialValue: initial?.difficulty ?? "")
        self.onSave = onSave
        self.onCancel = onCancel
    }

    var body: some View {
        Form {
            Section(header: Text("基本情報")) {
                TextField("語句", text: $term)
                TextField("読み", text: $reading)
                TextField("意味", text: $meaning, axis: .vertical)
                    .lineLimit(2...4)
            }
            Section(header: Text("補足")) {
                TextField("語源・解説", text: $etymology, axis: .vertical)
                    .lineLimit(2...6)
                TextField("関連語（; 区切り）", text: $relatedWords)
                TextField("分野（; 区切り）", text: $relatedFields)
                TextField("難易度（例: 初級/中級/上級）", text: $difficulty)
            }
            Section(footer: Text("関連語・分野は ;（セミコロン）区切りで入力してください。")) {
                EmptyView()
            }
        }
        .navigationTitle("項目を編集")
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("キャンセル") { onCancel?() }
            }
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("保存") { save() }.disabled(term.trimmingCharacters(in: .whitespaces).isEmpty || meaning.trimmingCharacters(in: .whitespaces).isEmpty)
            }
        }
    }

    private func save() {
        let item = QuestionItem(term: term,
                                reading: reading,
                                meaning: meaning,
                                etymology: etymology,
                                relatedWordsCSV: relatedWords,
                                relatedFieldsCSV: relatedFields,
                                difficulty: difficulty)
        onSave(item)
    }
}

#Preview {
    NavigationStack {
        CSVItemEditView(initial: nil, onSave: { _ in })
    }
}
