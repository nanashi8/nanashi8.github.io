import SwiftUI

// QuizSettingsView.swift
// 出題設定画面
// - 何を: CSV/分野/難易度/繰り返し回数/合格率を設定し、出題範囲と基準を決めます。
// - なぜ: 目的やレベルに合った出題にするため（効率的な学習）。

struct QuizSettingsView: View {
    @EnvironmentObject var quizSettings: QuizSettings
    @EnvironmentObject var currentCSV: CurrentCSV
    @EnvironmentObject var wordScoreStore: WordScoreStore
    @EnvironmentObject var appearanceManager: AppearanceManager
    @Environment(\.colorScheme) private var colorScheme

    @State private var bundleFiles: [String] = []
    @State private var docFiles: [String] = []
    @State private var showFilterEditor: Bool = false
    @State private var availableFields: [String] = []
    @State private var availableDifficulties: [String] = []
    @State private var selectedCSVIndex: Int = 0
    @State private var fieldWheelIndex: Int = 0
    @State private var difficultyWheelIndex: Int = 0

    // カード背景色
    private var cardBackground: Color {
        if colorScheme == .light {
            return Color(uiColor: .systemGray4)
        } else {
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
    private var learningModeBinding: Binding<LearningMode> {
        Binding(get: { quizSettings.learningMode }, set: { quizSettings.learningMode = $0; quizSettings.save() })
    }
    private var autoAdvanceBinding: Binding<Bool> {
        Binding(get: { quizSettings.model.autoAdvance }, set: { quizSettings.model.autoAdvance = $0; quizSettings.save() })
    }

    var body: some View {
        SwiftUI.Form(content: {
             // 現在の設定（要約カード）
             Section {
                 CurrentSettingsSummaryView(
                     csvName: currentCSV.name,
                     fields: quizSettings.fields,
                     difficulties: quizSettings.difficulties,
                     questionsPerBatch: quizSettings.questionsPerBatch,
                     numberOfChoices: quizSettings.numberOfChoices,
                     repeatCount: quizSettings.repeatCount,
                     threshold: quizSettings.threshold,
                     isRandomOrder: quizSettings.isRandomOrder,
                     isSpeechEnabled: quizSettings.isSpeechEnabled,
                     isTimerEnabled: quizSettings.isTimerEnabled,
                     timeLimit: quizSettings.timeLimit,
                     learningMode: quizSettings.learningMode,
                     autoAdvance: quizSettings.model.autoAdvance,
                     appearance: appearanceManager.appearance,
                     cardBackground: cardBackground
                 )
             }

             // 出題するCSV
             Section(header: SectionHeader(systemImage: "doc", title: "出題するCSV")) {
                 CSVSelectionView(
                     availableCSVs: (docFiles + bundleFiles).removingDuplicates(),
                     currentCSVName: currentCSV.name,
                     selectedIndex: $selectedCSVIndex,
                     onSetCSV: {
                         let editable = (docFiles + bundleFiles).removingDuplicates()
                         let name = editable[selectedCSVIndex]
                         currentCSV.name = name
                         wordScoreStore.switchToCSV(name)
                         buildAvailableOptions()
                     },
                     cardBackground: cardBackground
                 )
             }

             // フィルタ設定
             Section(header: SectionHeader(systemImage: "line.3.horizontal.decrease.circle", title: "フィルタ設定")) {
                 // 分野列がない場合の警告
                 if availableFields.count <= 1 {
                     NoFieldsWarningView(cardBackground: cardBackground)
                 }

                 // 分野フィルター
                 FieldFilterView(
                     availableFields: availableFields,
                     selectedIndex: $fieldWheelIndex,
                     selectedFields: Binding(
                         get: { quizSettings.fields },
                         set: { quizSettings.fields = $0; quizSettings.save() }
                     ),
                     onAdd: { index in addField(at: index) },
                     onRemove: { field in removeField(field) },
                     cardBackground: cardBackground
                 )

                 // 難易度フィルター
                 DifficultyFilterView(
                     availableDifficulties: availableDifficulties,
                     selectedIndex: $difficultyWheelIndex,
                     selectedDifficulties: Binding(
                         get: { quizSettings.difficulties },
                         set: { quizSettings.difficulties = $0; quizSettings.save() }
                     ),
                     onAdd: { index in addDifficulty(at: index) },
                     onRemove: { difficulty in removeDifficulty(difficulty) },
                     cardBackground: cardBackground
                 )
             }

             // 出題設定
             Section(header: SectionHeader(systemImage: "gearshape", title: "出題設定")) {
                 QuizParametersView(
                     questionsPerBatch: questionsPerBatchBinding,
                     threshold: thresholdBinding,
                     repeatCount: repeatCountBinding,
                     isRandomOrder: isRandomOrderBinding,
                     isTimerEnabled: isTimerEnabledBinding,
                     timeLimit: timeLimitBinding,
                     numberOfChoices: numberOfChoicesBinding,
                     isSpeechEnabled: isSpeechEnabledBinding,
                     learningMode: learningModeBinding,
                     autoAdvance: autoAdvanceBinding,
                     cardBackground: cardBackground
                 )
             }

             // 外観設定
             Section(header: SectionHeader(systemImage: "moon.circle", title: "外観")) {
                 AppearanceSettingsView(
                     appearance: $appearanceManager.appearance,
                     cardBackground: cardBackground
                 )
             }

             // 保存ボタン
             Section {
                 SectionCard(backgroundColor: cardBackground) {
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
             quizSettings.appearance = new
             quizSettings.save()
         }
         .sheet(isPresented: $showFilterEditor) {
             FilterEditorView(
                 availableFields: availableFields,
                 availableDifficulties: availableDifficulties,
                 selectedFields: Binding(get: { quizSettings.fields }, set: { quizSettings.fields = $0; quizSettings.save() }),
                 selectedDifficulties: Binding(get: { quizSettings.difficulties }, set: { quizSettings.difficulties = $0; quizSettings.save() })
             )
         }
     }

     // MARK: - Private Methods
     
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

     private func addField(at index: Int) {
         guard availableFields.indices.contains(index) else { return }
         let val = availableFields[index]
         let updated = QuizSettingsFilterService.addField(val, to: quizSettings.fields)
         quizSettings.fields = updated
         quizSettings.save()
     }

     private func removeField(_ f: String) {
         let updated = QuizSettingsFilterService.removeField(f, from: quizSettings.fields)
         quizSettings.fields = updated
         quizSettings.save()
     }

     private func addDifficulty(at index: Int) {
         guard availableDifficulties.indices.contains(index) else { return }
         let val = availableDifficulties[index]
         let updated = QuizSettingsFilterService.addDifficulty(val, to: quizSettings.difficulties)
         quizSettings.difficulties = updated
         quizSettings.save()
     }

     private func removeDifficulty(_ d: String) {
         let updated = QuizSettingsFilterService.removeDifficulty(d, from: quizSettings.difficulties)
         quizSettings.difficulties = updated
         quizSettings.save()
     }

     private func buildAvailableOptions() {
         let options = QuizSettingsFilterService.buildAvailableOptions(from: currentCSV.name)
         self.availableFields = options.fields
         self.availableDifficulties = options.difficulties
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

// Preview
struct QuizSettingsView_Previews: PreviewProvider {
    static var previews: some View {
        let currentCSV = CurrentCSV.shared
        NavigationStack {
            QuizSettingsView()
                .environmentObject(QuizSettings(currentCSV: currentCSV))
                .environmentObject(currentCSV)
                .environmentObject(AppearanceManager())
        }
    }
}
