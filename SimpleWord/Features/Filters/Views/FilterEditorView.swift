import SwiftUI

// FilterEditorView
// - 何を: CSVから抽出した分野と難易度の候補を表示し、ホイール(ドラム)で選んで複数選択できるUIを提供します。
// - なぜ: 複数選択のフィルタを直感的に編集できるようにするため。

struct FilterEditorView: View {
    @Environment(\.dismiss) var dismiss

    // available options (including "全て")
    let availableFields: [String]
    let availableDifficulties: [String]

    // bindings to the caller's selections
    @Binding var selectedFields: [String]
    @Binding var selectedDifficulties: [String]

    // current wheel selections
    @State private var currentFieldIndex: Int = 0
    @State private var currentDifficultyIndex: Int = 0

    var body: some View {
        NavigationStack {
            VStack(spacing: 12) {
                // Fields wheel + add
                SectionCard {
                    VStack(alignment: .leading, spacing: 8) {
                        SectionHeader(systemImage: "square.grid.2x2", title: "分野を追加")
                        Picker(selection: $currentFieldIndex, label: Text("分野")) {
                            ForEach(availableFields.indices, id: \.self) { i in
                                Text(availableFields[i]).tag(i)
                            }
                        }
                        .pickerStyle(.wheel)
                        .frame(height: 140)

                        HStack {
                            Button(action: addCurrentField) {
                                Label("追加", systemImage: "plus")
                            }
                            Spacer()
                            Text("選択済: ")
                                .font(.caption)
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 6) {
                                    ForEach(selectedFields, id: \.self) { f in
                                        HStack(spacing: 6) {
                                            Text(f).font(.caption2)
                                            Button(action: { removeField(f) }) {
                                                Image(systemName: "xmark.circle.fill")
                                            }
                                            .buttonStyle(.plain)
                                        }
                                        .padding(6)
                                        .background(Color(uiColor: .secondarySystemBackground))
                                        .cornerRadius(8)
                                    }
                                }
                            }
                        }
                    }
                }

                // Difficulties wheel + add
                SectionCard {
                    VStack(alignment: .leading, spacing: 8) {
                        SectionHeader(systemImage: "flag.checkered", title: "難易度を追加")
                        Picker(selection: $currentDifficultyIndex, label: Text("難易度")) {
                            ForEach(availableDifficulties.indices, id: \.self) { i in
                                Text(availableDifficulties[i]).tag(i)
                            }
                        }
                        .pickerStyle(.wheel)
                        .frame(height: 140)

                        HStack {
                            Button(action: addCurrentDifficulty) {
                                Label("追加", systemImage: "plus")
                            }
                            Spacer()
                            Text("選択済: ")
                                .font(.caption)
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 6) {
                                    ForEach(selectedDifficulties, id: \.self) { d in
                                        HStack(spacing: 6) {
                                            Text(d).font(.caption2)
                                            Button(action: { removeDifficulty(d) }) {
                                                Image(systemName: "xmark.circle.fill")
                                            }
                                            .buttonStyle(.plain)
                                        }
                                        .padding(6)
                                        .background(Color(uiColor: .secondarySystemBackground))
                                        .cornerRadius(8)
                                    }
                                }
                            }
                        }
                    }
                }

                Spacer()
            }
            .padding()
            .navigationTitle("フィルタ編集")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("キャンセル") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("完了") { dismiss() }
                }
            }
        }
    }

    // MARK: - Actions
    private func addCurrentField() {
        let val = availableFields.indices.contains(currentFieldIndex) ? availableFields[currentFieldIndex] : ""
        guard !val.isEmpty else { return }
        if val == "全て" {
            selectedFields.removeAll()
            return
        }
        if !selectedFields.contains(val) {
            selectedFields.append(val)
        }
    }

    private func removeField(_ f: String) {
        selectedFields.removeAll { $0 == f }
    }

    private func addCurrentDifficulty() {
        let val = availableDifficulties.indices.contains(currentDifficultyIndex) ? availableDifficulties[currentDifficultyIndex] : ""
        guard !val.isEmpty else { return }
        if val == "全て" {
            selectedDifficulties.removeAll()
            return
        }
        if !selectedDifficulties.contains(val) {
            selectedDifficulties.append(val)
        }
    }

    private func removeDifficulty(_ d: String) {
        selectedDifficulties.removeAll { $0 == d }
    }
}

#Preview {
    NavigationStack {
        FilterEditorView(availableFields: ["全て", "英語", "国語"], availableDifficulties: ["全て", "初級", "中級", "上級"], selectedFields: .constant([]), selectedDifficulties: .constant([]))
    }
}
