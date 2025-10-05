import SwiftUI

// QuizSettingsView.swift
// 出題設定画面
// - 何を: CSV/分野/難易度/繰り返し回数/合格率を設定し、出題範囲と基準を決めます。
// - なぜ: 目的やレベルに合った出題にするため（効率的な学習）。

struct QuizSettingsView: View {
    @EnvironmentObject var quizSettings: QuizSettings
    @EnvironmentObject var currentCSV: CurrentCSV
    // Bind directly to the model's selectedCSV via a mapped Binding below to avoid deprecated onChange
    @State private var repeatCount: Int = 1
    @State private var threshold: Double = 0.7
    @State private var bundleFiles: [String] = []
    @State private var docFiles: [String] = []

    @State private var showFilterEditor: Bool = false
    @State private var availableFields: [String] = []
    @State private var availableDifficulties: [String] = []

    // 新: 出題CSV選択用
    @State private var selectedCSVIndex: Int = 0
    // 新: フィルタホイールの現在選択インデックス
    @State private var fieldWheelIndex: Int = 0
    @State private var difficultyWheelIndex: Int = 0
    // 新: 出題数（1セットの設問数）
    @State private var questionsPerBatch: Int = 10

    var body: some View {
        Form {
            // 現在の設定（要約カード）
            Section {
                SectionCard {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(alignment: .firstTextBaseline) {
                            Text("現在の設定")
                                .font(.headline)
                            Spacer()
                            // show one or more difficulty badges
                            if !quizSettings.model.difficulties.isEmpty {
                                HStack(spacing: 6) {
                                    ForEach(quizSettings.model.difficulties, id: \.self) { d in
                                        DifficultyBadge(text: d)
                                    }
                                }
                            }
                        }
                        HStack(alignment: .top, spacing: 8) {
                            Text("CSV:")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text(currentCSV.name ?? "(未設定)")
                                .font(.caption)
                        }
                        VStack(alignment: .leading, spacing: 4) {
                            Text("分野:")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 6) {
                                    ForEach(quizSettings.model.selectedFields, id: \.self) { f in
                                        TagCapsule(label: f)
                                    }
                                }
                            }
                        }
                        HStack(spacing: 12) {
                            Text("繰り返し: \(quizSettings.model.repeatCount)回")
                                .font(.caption)
                            Text("合格率: \(Int(quizSettings.model.successThreshold * 100))%")
                                .font(.caption)
                        }
                        HStack(spacing: 12) {
                            Text("出題数: \(quizSettings.model.questionsPerBatch)問")
                                .font(.caption)
                        }
                    }
                }
            }

            // 出題するCSV（ホイールで選択）
            Section(header: SectionHeader(systemImage: "doc", title: "出題するCSV")) {
                let editable = (docFiles + bundleFiles).removingDuplicates()
                if editable.isEmpty {
                    Text("CSVが見つかりません")
                        .foregroundColor(.secondary)
                } else {
                    Picker("CSV", selection: $selectedCSVIndex) {
                        ForEach(editable.indices, id: \.self) { i in
                            Text(editable[i]).tag(i)
                        }
                    }
                    .pickerStyle(.wheel)
                    .frame(height: 140)

                    HStack {
                        Button(action: {
                            // set current CSV to selected
                            let name = editable[selectedCSVIndex]
                            currentCSV.name = name
                            // update available options immediately
                            buildAvailableOptions()
                        }) {
                            Text("このCSVを出題に設定")
                        }
                        .buttonStyle(.borderedProminent)

                        Spacer()
                        Text("現在: \(currentCSV.name ?? "(未設定)")")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }

            // フィルタ設定: 分野と難易度のホイールを縦に並べ、追加で複数選択
            Section(header: SectionHeader(systemImage: "line.3.horizontal.decrease.circle", title: "フィルタ設定")) {

                // CSV に分野列が無い場合はユーザーに分かりやすく案内を出す
                // （availableFields が "全て" のみ、または要素数が 1 以下の場合）
                if availableFields.count <= 1 {
                    SectionCard {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("このCSVには分野（カテゴリ）列が見つかりません。")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text("CSV のヘッダに '分野'、'カテゴリー'、'カテゴリ' または英語の 'category' / 'fields' の列があるか確認してください。")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                }

                // Fields wheel
                SectionCard {
                    VStack(alignment: .leading, spacing: 8) {
                        SectionHeader(systemImage: "square.grid.2x2", title: "分野を選択")
                        Picker(selection: $fieldWheelIndex, label: Text("分野")) {
                            ForEach(availableFields.indices, id: \.self) { i in
                                Text(availableFields[i]).tag(i)
                            }
                        }
                        .pickerStyle(.wheel)
                        .frame(height: 140)

                        // Add/remove controls
                        HStack {
                            // Add currently selected option
                            Button(action: { addField(at: fieldWheelIndex) }) {
                                Label("追加", systemImage: "plus")
                            }
                            Spacer()
                            Text("選択済: ")
                                .font(.caption)
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 6) {
                                    ForEach(quizSettings.model.selectedFields, id: \.self) { f in
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

                // Difficulties wheel
                SectionCard {
                    VStack(alignment: .leading, spacing: 8) {
                        SectionHeader(systemImage: "flag.checkered", title: "難易度を選択")
                        Picker(selection: $difficultyWheelIndex, label: Text("難易度")) {
                            ForEach(availableDifficulties.indices, id: \.self) { i in
                                Text(availableDifficulties[i]).tag(i)
                            }
                        }
                        .pickerStyle(.wheel)
                        .frame(height: 140)

                        HStack {
                            Button(action: { addDifficulty(at: difficultyWheelIndex) }) {
                                Label("追加", systemImage: "plus")
                            }
                            Spacer()
                            Text("選択済: ")
                                .font(.caption)
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 6) {
                                    ForEach(quizSettings.model.difficulties, id: \.self) { d in
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
            }

            Section(header: SectionHeader(systemImage: "gearshape", title: "出題設定")) {
                Stepper("繰り返し回数: \(repeatCount)", value: $repeatCount, in: 1...10)
                // 出題数（1セットあたりの問題数）
                Stepper("出題数: \(questionsPerBatch)問", value: $questionsPerBatch, in: 1...50)
                VStack(alignment: .leading) {
                    Text("合格率: \(Int(threshold * 100))%")
                    Slider(value: $threshold, in: 0...1, step: 0.05)
                }
                // 既存: 回答後に自動で次へ進むか
                Toggle(isOn: Binding(get: { quizSettings.model.autoAdvance }, set: { quizSettings.model.autoAdvance = $0; quizSettings.save() })) {
                    Text("回答後に自動で次へ")
                }
            }

            Section {
                Button("保存") { save() }
                    .buttonStyle(.borderedProminent)
            }
        }
        .navigationTitle("Quiz Settings")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear(perform: load)
        .onReceive(currentCSV.$name) { _ in buildAvailableOptions() }
        .sheet(isPresented: $showFilterEditor) {
            FilterEditorView(availableFields: availableFields, availableDifficulties: availableDifficulties, selectedFields: Binding(get: { quizSettings.model.selectedFields }, set: { quizSettings.model.selectedFields = $0; quizSettings.save() }), selectedDifficulties: Binding(get: { quizSettings.model.difficulties }, set: { quizSettings.model.difficulties = $0; quizSettings.save() }))
        }
    }

    private func load() {
        repeatCount = quizSettings.model.repeatCount
        threshold = quizSettings.model.successThreshold
        questionsPerBatch = max(1, quizSettings.model.questionsPerBatch)
        bundleFiles = FileUtils.listBundleCSVFiles()
        docFiles = FileUtils.listCSVFilesInDocuments()
        // set selectedCSVIndex to currentCSV if present
        let editable = (docFiles + bundleFiles).removingDuplicates()
        if let cur = currentCSV.name, let idx = editable.firstIndex(of: cur) {
            selectedCSVIndex = idx
        } else {
            selectedCSVIndex = 0
        }
        // ensure wheel indices are valid
        fieldWheelIndex = min(fieldWheelIndex, max(0, availableFields.count - 1))
        difficultyWheelIndex = min(difficultyWheelIndex, max(0, availableDifficulties.count - 1))
        buildAvailableOptions()
    }

    private func save() {
        quizSettings.model.repeatCount = max(1, repeatCount)
        quizSettings.model.successThreshold = min(max(0.0, threshold), 1.0)
        quizSettings.model.questionsPerBatch = max(1, questionsPerBatch)
        quizSettings.save()
    }

    // MARK: - Filter selection helpers (operate on quizSettings.model and persist)
    private func addField(at index: Int) {
        guard availableFields.indices.contains(index) else { return }
        let val = availableFields[index]
        if val == "全て" {
            quizSettings.model.selectedFields.removeAll()
            quizSettings.save()
            return
        }
        if !quizSettings.model.selectedFields.contains(val) {
            quizSettings.model.selectedFields.append(val)
            quizSettings.save()
        }
    }

    private func removeField(_ f: String) {
        quizSettings.model.selectedFields.removeAll { $0 == f }
        quizSettings.save()
    }

    private func addDifficulty(at index: Int) {
        guard availableDifficulties.indices.contains(index) else { return }
        let val = availableDifficulties[index]
        if val == "全て" {
            quizSettings.model.difficulties.removeAll()
            quizSettings.save()
            return
        }
        if !quizSettings.model.difficulties.contains(val) {
            quizSettings.model.difficulties.append(val)
            quizSettings.save()
        }
    }

    // 難易度を削除するヘルパー（UIボタンから呼ばれる）
    // 日本語コメント: 選択済みの難易度を取り除き、変更を保存します。
    private func removeDifficulty(_ d: String) {
        quizSettings.model.difficulties.removeAll { $0 == d }
        quizSettings.save()
    }

    // Build available fields/difficulties from selected CSV or all CSVs. Prepend "全て"
    private func buildAvailableOptions() {
        var fieldsSet = Set<String>()
        var diffsSet = Set<String>()
        let loader = CSVLoader()

        func process(url: URL) {
            if let arr = try? loader.load(from: url) {
                for it in arr {
                    for f in it.relatedFields where !f.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { fieldsSet.insert(f) }
                    if !it.difficulty.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { diffsSet.insert(it.difficulty) }
                }
            }
        }

        if let sel = currentCSV.name, !sel.isEmpty {
            // try Documents first
            if let dir = FileUtils.documentsDirectory {
                let url = dir.appendingPathComponent(sel)
                if FileManager.default.fileExists(atPath: url.path) { process(url: url); self.availableFields = ["全て"] + fieldsSet.sorted(); self.availableDifficulties = ["全て"] + diffsSet.sorted();
                    // adjust wheel indices
                    fieldWheelIndex = min(fieldWheelIndex, max(0, availableFields.count - 1))
                    difficultyWheelIndex = min(difficultyWheelIndex, max(0, availableDifficulties.count - 1))
                    return }
            }
            // bundle fallback
            let base = sel.replacingOccurrences(of: ".csv", with: "")
            if let url = Bundle.main.url(forResource: base, withExtension: "csv") { process(url: url) }
        } else {
            // no selection: aggregate from all CSVs
            for name in FileUtils.listCSVFilesInDocuments() {
                if let dir = FileUtils.documentsDirectory {
                    let url = dir.appendingPathComponent(name)
                    process(url: url)
                }
            }
            for name in FileUtils.listBundleCSVFiles() {
                let base = name.replacingOccurrences(of: ".csv", with: "")
                if let url = Bundle.main.url(forResource: base, withExtension: "csv") { process(url: url) }
            }
        }

        self.availableFields = ["全て"] + fieldsSet.sorted()
        self.availableDifficulties = ["全て"] + diffsSet.sorted()
        // adjust wheel indices
        fieldWheelIndex = min(fieldWheelIndex, max(0, availableFields.count - 1))
        difficultyWheelIndex = min(difficultyWheelIndex, max(0, availableDifficulties.count - 1))
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

#Preview {
    NavigationStack { QuizSettingsView().environmentObject(QuizSettings()).environmentObject(CurrentCSV.shared) }
}
