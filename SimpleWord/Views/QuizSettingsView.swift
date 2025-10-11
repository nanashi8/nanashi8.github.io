import SwiftUI

// QuizSettingsView.swift
// 出題設定画面
// - 何を: CSV/分野/難易度/繰り返し回数/合格率を設定し、出題範囲と基準を決めます。
// - なぜ: 目的やレベルに合った出題にするため（効率的な学習）。

struct QuizSettingsView: View {
    @EnvironmentObject var quizSettings: QuizSettings
    @EnvironmentObject var currentCSV: CurrentCSV
    @EnvironmentObject var appearanceManager: AppearanceManager
    // 追加: カラースキームに応じてカード背景色を切り替える
    @Environment(\.colorScheme) private var colorScheme

    @State private var bundleFiles: [String] = []
    @State private var docFiles: [String] = []

    @State private var showFilterEditor: Bool = false
    @State private var availableFields: [String] = []
    @State private var availableDifficulties: [String] = []

    @State private var selectedCSVIndex: Int = 0
    @State private var fieldWheelIndex: Int = 0
    @State private var difficultyWheelIndex: Int = 0

    // カード背景色を決定するヘルパー（ライト時はやや濃いめにしてはっきり見えるようにする）
    private var cardBackground: Color {
        if colorScheme == .light {
            // ライトモードでよりはっきり見えるグレー（UIKitのsystemGray4を利用）
            return Color(uiColor: .systemGray4)
        } else {
            // ダークでは従来の secondarySystemBackground を使う
            return Color(uiColor: .secondarySystemBackground)
        }
    }

    // QuizSettings の Published プロパティへ直接バインドする computed bindings
    private var repeatCountBinding: Binding<Int> {
        Binding(get: { quizSettings.repeatCount }, set: { quizSettings.repeatCount = $0; quizSettings.save() })
    }
    private var thresholdBinding: Binding<Double> {
        Binding(get: { quizSettings.threshold }, set: { quizSettings.threshold = min(max(0.0, $0), 1.0); quizSettings.save() })
    }
    private var questionsPerBatchBinding: Binding<Int> {
        Binding(get: { quizSettings.questionsPerBatch }, set: { quizSettings.questionsPerBatch = max(1, $0); quizSettings.save() })
    }
    private var numberOfChoicesBinding: Binding<Int> {
        Binding(get: { quizSettings.numberOfChoices }, set: { quizSettings.numberOfChoices = max(2, min(10, $0)); quizSettings.save() })
    }
    private var numberOfQuestionsBinding: Binding<Int> {
        Binding(get: { quizSettings.numberOfQuestions }, set: { quizSettings.numberOfQuestions = max(1, min(500, $0)); quizSettings.save() })
    }
    private var isTimerEnabledBinding: Binding<Bool> {
        Binding(get: { quizSettings.isTimerEnabled }, set: { quizSettings.isTimerEnabled = $0; quizSettings.save() })
    }
    private var timeLimitBinding: Binding<Int> {
        Binding(get: { quizSettings.timeLimit }, set: { quizSettings.timeLimit = max(5, min(3600, $0)); quizSettings.save() })
    }
    private var isRandomOrderBinding: Binding<Bool> {
        Binding(get: { quizSettings.isRandomOrder }, set: { quizSettings.isRandomOrder = $0; quizSettings.save() })
    }
    private var isSpeechEnabledBinding: Binding<Bool> {
        Binding(get: { quizSettings.isSpeechEnabled }, set: { quizSettings.isSpeechEnabled = $0; quizSettings.save() })
    }
    // 学習モードの列挙型バインディング: QuizSettings.learningMode と同期して保存する
    private var learningModeBinding: Binding<LearningMode> {
        Binding(get: { quizSettings.learningMode }, set: { quizSettings.learningMode = $0; quizSettings.save() })
    }

    var body: some View {
        // 明示的なラベル付きイニシャライザを使って content クロージャを渡す。
        // これにより SwiftUI.Form.init(_:)（FormStyleConfiguration を受け取るもの）と
        // コンテンツ初期化子のあいだの曖昧さが解消されます。
        SwiftUI.Form(content: {
             // 現在の設定（要約カード）
             Section {
                 SectionCard(backgroundColor: cardBackground) {
                     VStack(alignment: .leading, spacing: 8) {
                         HStack(alignment: .firstTextBaseline) {
                             Text("現在の設定")
                                 .font(.headline)
                             Spacer()
                             // show one or more difficulty badges
                             if !quizSettings.difficulties.isEmpty {
                                 HStack(spacing: 6) {
                                     ForEach(quizSettings.difficulties, id: \.self) { d in
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
                                     ForEach(quizSettings.fields, id: \.self) { f in
                                         TagCapsule(label: f)
                                     }
                                 }
                             }
                         }
                         HStack(spacing: 12) {
                             Text("繰り返し: \(quizSettings.repeatCount)回")
                                 .font(.caption)
                             Text("合格率: \(Int(quizSettings.threshold * 100))%")
                                 .font(.caption)
                         }
                         HStack(spacing: 12) {
                             Text("出題数: \(quizSettings.questionsPerBatch)問")
                                 .font(.caption)
                         }
                         // 追加: 現在の外観
                         HStack(spacing: 12) {
                             Text("外観: \(appearanceManager.appearance.displayName)")
                                 .font(.caption)
                         }
                     }
                 }
                 .listRowInsets(EdgeInsets())
                 .listRowBackground(cardBackground)
             }

             // 出題するCSV（ホイールで選択）
             Section(header: SectionHeader(systemImage: "doc", title: "出題するCSV")) {
                 let editable = (docFiles + bundleFiles).removingDuplicates()
                 // 編集: 中身全体を SectionCard で包み、リスト行の余白と背景をカードに揃える
                 if editable.isEmpty {
                     SectionCard(backgroundColor: cardBackground) {
                         VStack(alignment: .leading, spacing: 8) {
                             Text("CSVが見つかりません")
                                 .font(.caption)
                                 .foregroundColor(.secondary)
                             Text("Resources または Documents に CSV を配置してください。")
                                 .font(.caption2)
                                 .foregroundColor(.secondary)
                         }
                         .frame(maxWidth: .infinity, alignment: .leading)
                     }
                     .listRowInsets(EdgeInsets())
                     .listRowBackground(cardBackground)
                 } else {
                     SectionCard(backgroundColor: cardBackground) {
                         VStack(alignment: .leading, spacing: 8) {
                             Picker("CSV", selection: $selectedCSVIndex) {
                                 ForEach(editable.indices, id: \.self) { i in
                                     Text(editable[i]).tag(i)
                                 }
                             }
                             .pickerStyle(.wheel)
                             .frame(height: 100)

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
                                 .frame(maxWidth: .infinity, alignment: .center)

                                 Spacer()
                                 Text("現在: \(currentCSV.name ?? "(未設定)")")
                                     .font(.caption)
                                     .foregroundColor(.secondary)
                             }
                         }
                     }
                     .listRowInsets(EdgeInsets())
                     .listRowBackground(cardBackground)
                 }
             }

             // フィルタ設定: 分野と難易度のホイールを縦に並べ、追加で複数選択
             Section(header: SectionHeader(systemImage: "line.3.horizontal.decrease.circle", title: "フィルタ設定")) {

                 // CSV に分野列が無い場合はユーザーに分かりやすく案内を出す
                 // （availableFields が "全て" のみ、または要素数が 1 以下の場合）
                 if availableFields.count <= 1 {
                     SectionCard(backgroundColor: cardBackground) {
                         VStack(alignment: .leading, spacing: 6) {
                             Text("このCSVには分野（カテゴリ）列が見つかりません。")
                                 .font(.caption)
                                 .foregroundColor(.secondary)
                             Text("CSV のヘッダに '分野'、'カテゴリー'、'カテゴリ' または英語の 'category' / 'fields' の列があるか確認してください。")
                                 .font(.caption2)
                                 .foregroundColor(.secondary)
                         }
                     }
                     .listRowInsets(EdgeInsets())
                     .listRowBackground(cardBackground)
                 }

                 // Fields wheel
                 SectionCard(backgroundColor: cardBackground) {
                     VStack(alignment: .leading, spacing: 8) {
                         SectionHeader(systemImage: "square.grid.2x2", title: "分野を選択")
                         Picker(selection: $fieldWheelIndex, label: Text("分野")) {
                             ForEach(availableFields.indices, id: \.self) { i in
                                 Text(availableFields[i]).tag(i)
                             }
                         }
                         .pickerStyle(.wheel)
                         .frame(height: 100)

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
                                     ForEach(quizSettings.fields, id: \.self) { f in
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
                 .listRowInsets(EdgeInsets())
                 .listRowBackground(cardBackground)

                 // Difficulties wheel
                 SectionCard(backgroundColor: cardBackground) {
                     VStack(alignment: .leading, spacing: 8) {
                         SectionHeader(systemImage: "flag.checkered", title: "難易度を選択")
                         Picker(selection: $difficultyWheelIndex, label: Text("難易度")) {
                             ForEach(availableDifficulties.indices, id: \.self) { i in
                                 Text(availableDifficulties[i]).tag(i)
                             }
                         }
                         .pickerStyle(.wheel)
                         .frame(height: 100)

                         HStack {
                             Button(action: { addDifficulty(at: difficultyWheelIndex) }) {
                                 Label("追加", systemImage: "plus")
                             }
                             Spacer()
                             Text("選択済: ")
                                 .font(.caption)
                             ScrollView(.horizontal, showsIndicators: false) {
                                 HStack(spacing: 6) {
                                     ForEach(quizSettings.difficulties, id: \.self) { d in
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
                 .listRowInsets(EdgeInsets())
                 .listRowBackground(cardBackground)
             }

             Section(header: SectionHeader(systemImage: "gearshape", title: "出題設定")) {
                 SectionCard(backgroundColor: cardBackground) {
                     VStack(alignment: .leading, spacing: 20) {
                         // バッチサイズ（先頭）
                         Stepper("バッチサイズ: \(quizSettings.questionsPerBatch)問", value: questionsPerBatchBinding, in: 1...50)

                         // 合格率（スライダー）
                         VStack(alignment: .leading) {
                             Text("合格率: \(Int(quizSettings.threshold * 100))%")
                             Slider(value: thresholdBinding, in: 0...1, step: 0.05)
                         }

                         // 繰り返し回数
                         Stepper("繰り返し回数: \(quizSettings.repeatCount)回", value: repeatCountBinding, in: 1...10)

                         // ランダム出題
                         Toggle(isOn: isRandomOrderBinding) { Text("ランダム出題") }

                         // タイマー有効化
                         Toggle(isOn: isTimerEnabledBinding) { Text("タイマーを有効にする") }
                         if quizSettings.isTimerEnabled {
                             Stepper("制限時間: \(quizSettings.timeLimit)秒", value: timeLimitBinding, in: 5...600, step: 5)
                         }

                         // 選択肢の数
                         Stepper("選択肢の数: \(quizSettings.numberOfChoices)", value: numberOfChoicesBinding, in: 2...6)

                         // 音声読み上げ
                         Toggle(isOn: isSpeechEnabledBinding) { Text("音声読み上げ") }

                         // 学習モード
                         VStack(alignment: .leading) {
                             Text("学習モード")
                                 .font(.subheadline)
                             Picker("学習モード", selection: learningModeBinding) {
                                 ForEach(LearningMode.allCases) { mode in
                                     Text(mode.displayName).tag(mode)
                                 }
                             }
                             .pickerStyle(.wheel)
                             .frame(height: 100)
                         }

                         // 回答後に自動で次へ
                         Toggle(isOn: Binding(get: { quizSettings.model.autoAdvance }, set: { quizSettings.model.autoAdvance = $0; quizSettings.save() })) {
                             Text("回答後に自動で次へ")
                         }
                     }
                 }
                 .listRowInsets(EdgeInsets())
                 .listRowBackground(cardBackground)
             }

             // 追加: 外観設定セクション（アプリ全体に即時適用）
             Section(header: SectionHeader(systemImage: "moon.circle", title: "外観")) {
                 SectionCard(backgroundColor: cardBackground) {
                     VStack(alignment: .leading, spacing: 8) {
                         // ホイールタイプの Picker に変更（要望）
                         Picker("外観モード", selection: $appearanceManager.appearance) {
                             ForEach(Appearance.allCases) { option in
                                 Text(option.displayName).tag(option)
                             }
                         }
                         .pickerStyle(.wheel)
                         .frame(height: 140) // ホイール表示のための高さを確保

                         Text("アプリ全体の見た目を切り替えます")
                             .font(.caption)
                             .foregroundColor(.secondary)
                     }
                 }
                 .listRowInsets(EdgeInsets())
                 .listRowBackground(cardBackground)
             }

             Section {
                 SectionCard(backgroundColor: cardBackground) {
                     // ボタンを VStack に入れて幅指定を確実に反映
                     VStack(spacing: 0) {
                         Button(action: { save() }) {
                             Text("保存")
                                 .frame(maxWidth: .infinity)
                         }
                         .buttonStyle(.borderedProminent)
                         .controlSize(.large)
                         .padding(.vertical, 12)
                     }
                     .frame(maxWidth: .infinity)
                 }
                 .listRowInsets(EdgeInsets())
                 .listRowBackground(cardBackground)
             }
         })
         .navigationTitle("Quiz Settings")
         .navigationBarTitleDisplayMode(.inline)
         .onAppear(perform: load)
         .onReceive(currentCSV.$name) { _ in buildAvailableOptions() }
         .onReceive(appearanceManager.$appearance) { new in
             // 外観が変わったら QuizSettings の appearance に反映して保存
             quizSettings.appearance = new
             quizSettings.save()
         }
         .sheet(isPresented: $showFilterEditor) {
             FilterEditorView(availableFields: availableFields, availableDifficulties: availableDifficulties, selectedFields: Binding(get: { quizSettings.fields }, set: { quizSettings.fields = $0; quizSettings.save() }), selectedDifficulties: Binding(get: { quizSettings.difficulties }, set: { quizSettings.difficulties = $0; quizSettings.save() }))
         }
     }

     private func load() {
         bundleFiles = FileUtils.listBundleCSVFiles()
         docFiles = FileUtils.listCSVFilesInDocuments()
         let editable = (docFiles + bundleFiles).removingDuplicates()
         if let cur = currentCSV.name, let idx = editable.firstIndex(of: cur) {
             selectedCSVIndex = idx
         } else {
             selectedCSVIndex = 0
         }
         fieldWheelIndex = min(fieldWheelIndex, max(0, availableFields.count - 1))
         difficultyWheelIndex = min(difficultyWheelIndex, max(0, availableDifficulties.count - 1))
         buildAvailableOptions()
     }

     private func save() {
         quizSettings.save()
     }

     // MARK: - Filter selection helpers (operate on quizSettings and persist)
     private func addField(at index: Int) {
         guard availableFields.indices.contains(index) else { return }
         let val = availableFields[index]
         if val == "全て" {
             quizSettings.fields.removeAll()
             quizSettings.save()
             return
         }
         if !quizSettings.fields.contains(val) {
             quizSettings.fields.append(val)
             quizSettings.save()
         }
     }

     private func removeField(_ f: String) {
         quizSettings.fields.removeAll { $0 == f }
         quizSettings.save()
     }

     private func addDifficulty(at index: Int) {
         guard availableDifficulties.indices.contains(index) else { return }
         let val = availableDifficulties[index]
         if val == "全て" {
             quizSettings.difficulties.removeAll()
             quizSettings.save()
             return
         }
         if !quizSettings.difficulties.contains(val) {
             quizSettings.difficulties.append(val)
             quizSettings.save()
         }
     }

     // 難易度を削除するヘルパー（UIボタンから呼ばれる）
     // 日本語コメント: 選択済みの難易度を取り除き、変更を保存します。
     private func removeDifficulty(_ d: String) {
         quizSettings.difficulties.removeAll { $0 == d }
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

// PreviewProviderを使ってプレビューを提供する（#Preview の代替）
struct QuizSettingsView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationStack {
            QuizSettingsView()
                .environmentObject(QuizSettings())
                .environmentObject(CurrentCSV.shared)
                .environmentObject(AppearanceManager())
        }
    }
}
