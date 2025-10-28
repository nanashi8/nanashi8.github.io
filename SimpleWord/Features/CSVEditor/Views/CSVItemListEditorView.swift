// CSVItemListEditorView.swift
// CSVの項目ごと編集（一覧）
// - 何を: QuestionItem 単位で一覧表示し、タップで編集。＋で新規項目を追加できます。
// - なぜ: テキスト一括編集よりも、安全かつ直感的に編集できるようにするため。

import SwiftUI

// CSVを項目ごとに編集するリストエディタ
struct CSVItemListEditorView: View {
    let fileURL: URL

    @State private var items: [QuestionItem] = []
    @State private var errorMessage: String? = nil
    @State private var infoMessage: String? = nil

    @State private var showAddSheet: Bool = false
    @State private var editingIndex: Int? = nil

    var body: some View {
        List {
            if let err = errorMessage {
                Section { Text(err).foregroundColor(.red) }
            }
            if let info = infoMessage {
                Section { Text(info).foregroundColor(.green) }
            }

            Section(header: SectionHeader(systemImage: "list.bullet", title: "項目一覧")) {
                if items.isEmpty {
                    Text("まだ項目がありません。右上の＋から追加してください。")
                        .foregroundColor(.secondary)
                } else {
                    ForEach(items.indices, id: \.self) { idx in
                        let it = items[idx]
                        Button {
                            editingIndex = idx
                        } label: {
                            HStack(alignment: .firstTextBaseline) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(it.term).font(.headline)
                                    HStack(spacing: 6) {
                                        if !it.reading.isEmpty {
                                            Text(it.reading).font(.caption).foregroundColor(.secondary)
                                        }
                                        if !it.meaning.isEmpty {
                                            Text("—").foregroundColor(.secondary)
                                            Text(it.meaning).font(.caption2).foregroundColor(.secondary).lineLimit(1)
                                        }
                                    }
                                    if !it.relatedFields.isEmpty {
                                        ScrollView(.horizontal, showsIndicators: false) {
                                            HStack(spacing: 6) {
                                                ForEach(it.relatedFields, id: \.self) { f in
                                                    TagCapsule(label: f)
                                                }
                                            }
                                        }
                                    }
                                }
                                Spacer()
                                if !it.difficulty.isEmpty { DifficultyBadge(text: it.difficulty) }
                            }
                            .padding(.vertical, 6)
                        }
                        .buttonStyle(.plain)
                    }
                    .onDelete(perform: delete)
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle(fileURL.lastPathComponent)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                HStack {
                    Button { save() } label: { Image(systemName: "square.and.arrow.down") }
                    Button { showAddSheet = true } label: { Image(systemName: "plus") }
                }
            }
        }
        .onAppear(perform: load)
        .sheet(isPresented: $showAddSheet) {
            NavigationStack {
                CSVItemEditView(initial: nil) { newItem in
                    items.append(newItem)
                    save()
                    showAddSheet = false
                } onCancel: {
                    showAddSheet = false
                }
            }
        }
        .sheet(item: bindingForEditingIndex()) { idxWrapper in
            NavigationStack {
                CSVItemEditView(initial: items[idxWrapper.value]) { updated in
                    items[idxWrapper.value] = updated
                    save()
                    editingIndex = nil
                } onCancel: {
                    editingIndex = nil
                }
            }
        }
    }

    private typealias IndexWrapper = Binding<Int?>.ItemWrapper

    private func bindingForEditingIndex() -> Binding<IndexWrapper?> {
        // Helper to allow .sheet(item:) with an Int? index
        Binding(get: { editingIndex }, set: { editingIndex = $0 }).itemWrapper()
    }

    private func load() {
        // URL からの直接ロードは CSVLoader の機能を使用
        let loader = CSVLoader()
        do {
            let loaded = try loader.load(from: fileURL)
            self.items = loaded
            self.errorMessage = nil
        } catch {
            self.items = []
            self.errorMessage = "読み込み失敗: \(error.localizedDescription)"
        }
    }

    private func save() {
        do {
            try FileUtils.writeQuestionItems(items, to: fileURL)
            self.infoMessage = "保存しました"
            self.errorMessage = nil
            // 通知して他画面（Navigatorなど）に反映
            NotificationCenter.default.post(name: .csvFileDidChange, object: fileURL)
        } catch {
            self.errorMessage = "保存失敗: \(error.localizedDescription)"
        }
    }

    private func delete(at offsets: IndexSet) {
        items.remove(atOffsets: offsets)
        save()
    }
}

// MARK: - Small helper to enable sheet(item:) with Int?
extension Binding where Value == Int? {
    struct ItemWrapper: Identifiable {
        let value: Int
        var id: Int { value }
    }
    func itemWrapper() -> Binding<ItemWrapper?> {
        Binding<ItemWrapper?>(
            get: {
                if let v = self.wrappedValue { return ItemWrapper(value: v) }
                return nil
            },
            set: { newVal in
                self.wrappedValue = newVal?.value
            }
        )
    }
}

#Preview {
    NavigationStack {
        Text("CSV List Editor Preview")
    }
}
