import SwiftUI

// QuizView.swift
// クイズ画面（4択・適応型学習・アニメーション）
// - 何を: CSV から問題を読み込み、適応型学習アルゴリズムで出題し、選択肢を表示して回答を記録します。
// - なぜ: ユーザーが効率的に単語学習を行えるようにするため。バッチ学習と適応型出題で学習効率を最大化します。

/// クイズ画面の実装
struct QuizView: View {
    // 環境オブジェクト
    @EnvironmentObject var wordScoreStore: WordScoreStore
    @EnvironmentObject var currentCSV: CurrentCSV
    @EnvironmentObject var quizSettings: QuizSettings
    @EnvironmentObject var scoreStore: ScoreStore
    @StateObject private var sessionStore = QuizSessionStore.shared

    // データ状態
    @State private var items: [QuestionItem] = []           // 全問題（フィルタ済み）
    @State private var order: [QuestionItem] = []           // 出題順序
    @State private var pool: [QuestionItem] = []            // 現在バッチのプール
    @State private var currentItem: QuestionItem? = nil     // 現在の問題

    // UI状態
    @State private var choices: [QuizChoice] = []           // 選択肢
    @State private var selectedChoiceID: UUID? = nil
    @State private var correctAnswerID: UUID? = nil
    @State private var dontKnowID: UUID = UUID()

    // アニメーション状態
    @State private var shouldAnimatePassedCount: Bool = false   // 合格数アニメ
    @State private var shouldAnimateTotalCount: Bool = false    // 総出題数アニメ

    // ローディング・エラー状態
    @State private var isLoading: Bool = true
    @State private var errorMessage: String? = nil

    // 学習履歴
    @State private var history: [UUID] = []                 // 出題履歴（戻る機能用）
    @State private var historyIndex: Int = -1               // 履歴内の現在位置

    // CSVのヘッダ表示用マップ: 論理キー(term,reading,meaning,etymology,relatedfields,difficulty) -> 表示ヘッダ
    @State private var csvHeaderLabels: [String: String] = [:]

    @Environment(\.dismiss) private var dismiss

    // QuizSettings の容易な参照: model に含まれる値を使う
    private var learningModeDisplayName: String {
        quizSettings.model.learningMode.displayName
    }

    private var autoAdvanceEnabled: Bool { quizSettings.model.autoAdvance }
    private var configuredNumberOfChoices: Int { quizSettings.numberOfChoices } // QuizSettingsView の公開プロパティを優先
    private var configuredQuestionsPerBatch: Int { quizSettings.questionsPerBatch }

    var body: some View {
        Group {
            if isLoading {
                QuizLoadingView()
            } else if let error = errorMessage {
                QuizErrorView(message: error, onDismiss: { dismiss() })
            } else if items.isEmpty {
                QuizEmptyView(onDismiss: { dismiss() })
            } else {
                QuizContentView(
                    currentItem: currentItem,
                    choices: choices,
                    csvHeaderLabels: csvHeaderLabels,
                    csvName: currentCSV.name ?? "",
                    learningMode: learningModeDisplayName,
                    accuracy: sessionStore.calculateAccuracy(),
                    passedCount: sessionStore.batchCorrect,
                    totalCount: sessionStore.questionCount,
                    batchSize: sessionStore.batchSize,
                    canGoPrevious: historyIndex > 0,
                    canGoNext: selectedChoiceID != nil,
                    onPrevious: { goToPreviousQuestion() },
                    onNext: { goToNextQuestion() },
                    selectedChoiceID: selectedChoiceID,
                    correctAnswerID: correctAnswerID,
                    dontKnowID: dontKnowID,
                    onSelect: { id in handleChoiceSelection(id) },
                    shouldAnimatePassedCount: $shouldAnimatePassedCount,
                    shouldAnimateTotalCount: $shouldAnimateTotalCount
                )
                .environmentObject(wordScoreStore)
            }
        }
        .navigationTitle("クイズ")
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(false)
        .onAppear {
            loadCSVAndStart()
        }
    }

    // MARK: - データロード

    private func loadCSVAndStart() {
        guard let csvName = currentCSV.name else {
            errorMessage = "CSVファイルが選択されていません。"
            isLoading = false
            return
        }

        var allItems: [QuestionItem] = []
        var resolvedCSVURL: URL? = nil

        // QuestionItemRepository を使用してCSVを読み込む
        let base = csvName.replacingOccurrences(of: ".csv", with: "")
        let repository = QuestionItemRepository(fileName: base)
        
        switch repository.fetch() {
        case .success(let items):
            allItems = items
        case .failure(let error):
            print("CSV load error: \(error.localizedDescription)")
            allItems = []
        }

        // resolvedCSVURL の設定（Documents優先、次にBundle）
        if let documentsURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
            let csvURL = documentsURL.appendingPathComponent(csvName.hasSuffix(".csv") ? csvName : "\(csvName).csv")
            if FileManager.default.fileExists(atPath: csvURL.path) {
                resolvedCSVURL = csvURL
            }
        }
        if resolvedCSVURL == nil {
            resolvedCSVURL = Bundle.main.url(forResource: base, withExtension: "csv")
        }

        // ここで resolvedCSVURL が決まっている可能性があるので、ヘッダを読み取ってラベルマップを作成する
        if let url = resolvedCSVURL {
            let parser = CSVHeaderParser()
            csvHeaderLabels = parser.parseHeader(from: url)
        } else {
            csvHeaderLabels = [:]
        }

        if allItems.isEmpty {
            errorMessage = "CSVファイル '\(csvName)' が見つからないか、読み込みに失敗しました。"
            isLoading = false
            return
        }

        // フィルタリング
        let filtered = applyFilters(to: allItems)
        if filtered.isEmpty {
            errorMessage = "フィルタ条件に一致する問題がありません。\n出題設定を確認してください。"
            isLoading = false
            return
        }

        self.items = filtered

        // 問題集に対応する学習結果を読み込む
        wordScoreStore.switchToCSV(csvName)

        // 出題数とバッチサイズの設定
        let totalQuestions = quizSettings.numberOfQuestions > 0 ? min(quizSettings.numberOfQuestions, items.count) : items.count
        let batchSize = min(quizSettings.questionsPerBatch, totalQuestions)

        // セッションの開始または復元
        if sessionStore.canResumeSession(csvName: csvName) {
            // 既存のセッションを継続
            print("セッションを復元: スコア=\(sessionStore.score), 問題数=\(sessionStore.questionCount)")
        } else {
            // 新しいセッションを開始
            sessionStore.startSession(csvName: csvName, batchSize: batchSize, totalQuestions: totalQuestions)
        }

        // 出題順序の決定
        if quizSettings.isRandomOrder {
            order = items.shuffled().prefix(totalQuestions).map { $0 }
        } else {
            order = Array(items.prefix(totalQuestions))
        }

        isLoading = false
        prepareBatch()
    }

    private func applyFilters(to items: [QuestionItem]) -> [QuestionItem] {
        var result = items

        // 分野フィルタ
        if !quizSettings.fields.isEmpty {
            result = result.filter { item in
                !Set(item.relatedFields).isDisjoint(with: quizSettings.fields)
            }
        }

        // 難易度フィルタ
        if !quizSettings.difficulties.isEmpty {
            result = result.filter { item in
                quizSettings.difficulties.contains(item.difficulty)
            }
        }

        return result
    }

    // MARK: - バッチ準備

    private func prepareBatch() {
        guard !order.isEmpty else {
            errorMessage = "出題する問題がありません。"
            return
        }

        let batchManager = QuizBatchManager()
        pool = batchManager.prepareBatch(
            from: items,
            order: order,
            batchSize: sessionStore.batchSize,
            repeatCount: quizSettings.repeatCount
        )

        guard !pool.isEmpty else {
            errorMessage = "出題する問題がありません。"
            return
        }

        prepareQuestion()
    }

    // MARK: - 問題準備

    private func prepareQuestion() {
        guard !pool.isEmpty else {
            // バッチ完了
            completeBatch()
            return
        }

        currentItem = pool.removeFirst()
        selectedChoiceID = nil
        correctAnswerID = nil
        dontKnowID = UUID()

        guard let item = currentItem else { return }

        // 選択肢の生成
        // 正解のラベルは item.meaning
        let correctChoice = QuizChoice(id: UUID(), label: item.meaning, explanation: item.etymology, isCorrect: true, item: item)
        correctAnswerID = correctChoice.id

        var incorrectChoices: [QuizChoice] = []
        let otherItems = items.filter { $0.id != item.id }.shuffled()

        for otherItem in otherItems.prefix(max(0, configuredNumberOfChoices - 1)) {
            let choice = QuizChoice(id: UUID(), label: otherItem.meaning, explanation: otherItem.etymology, isCorrect: false, item: otherItem)
            incorrectChoices.append(choice)
        }

        // 必要に応じて選択肢を補う（候補が不足する場合）
        while incorrectChoices.count < max(0, configuredNumberOfChoices - 1) {
            incorrectChoices.append(QuizChoice(id: UUID(), label: "(候補不足)", explanation: nil, isCorrect: false, item: nil))
        }

        choices = ([correctChoice] + incorrectChoices).shuffled()

        // 履歴に追加
        if historyIndex >= 0 && historyIndex < history.count - 1 {
            history = Array(history.prefix(historyIndex + 1))
        }
        history.append(item.id)
        historyIndex = history.count - 1
    }

    // MARK: - 回答処理

    private func handleChoiceSelection(_ id: UUID) {
        guard selectedChoiceID == nil else { return }

        // 分からないボタンの処理
        if id == dontKnowID {
            giveUp()
            return
        }

        // 通常の選択肢
        let oldQuestionCount = sessionStore.questionCount
        let oldBatchCorrect = sessionStore.batchCorrect

        selectedChoiceID = id

        let wasCorrect = (id == correctAnswerID)
        
        // セッションストアに記録
        sessionStore.recordAnswer(correct: wasCorrect)

        // アニメーション判定
        if sessionStore.questionCount > oldQuestionCount {
            shouldAnimateTotalCount = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                self.shouldAnimateTotalCount = false
            }
        }

        if sessionStore.batchCorrect > oldBatchCorrect {
            shouldAnimatePassedCount = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                self.shouldAnimatePassedCount = false
            }
        }

        // スコア記録
        if let item = currentItem {
            // 単語スコアストアへ記録（既存 API を使用）
            wordScoreStore.recordResult(itemID: item.id, correct: wasCorrect)
        }

        // 自動進行
        if wasCorrect && autoAdvanceEnabled {
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                goToNextQuestion()
            }
        }
    }

    private func giveUp() {
        guard selectedChoiceID == nil else { return }

        let oldQuestionCount = sessionStore.questionCount

        selectedChoiceID = dontKnowID
        
        // セッションストアに不正解として記録
        sessionStore.recordAnswer(correct: false)

        // アニメーション判定
        if sessionStore.questionCount > oldQuestionCount {
            shouldAnimateTotalCount = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                self.shouldAnimateTotalCount = false
            }
        }

        // スコア記録（不正解として）
        if let item = currentItem {
            wordScoreStore.recordResult(itemID: item.id, correct: false)
        }
    }

    // MARK: - ナビゲーション

    private func goToNextQuestion() {
        prepareQuestion()
    }

    private func goToPreviousQuestion() {
        guard historyIndex > 0 else { return }

        historyIndex -= 1
        let previousID = history[historyIndex]

        // 前の問題を再表示
        if let previousItem = items.first(where: { $0.id == previousID }) {
            currentItem = previousItem
            selectedChoiceID = nil
            correctAnswerID = nil

            // 選択肢を再生成
            let correctChoice = QuizChoice(id: UUID(), label: previousItem.meaning, explanation: previousItem.etymology, isCorrect: true, item: previousItem)
            correctAnswerID = correctChoice.id

            var incorrectChoices: [QuizChoice] = []
            let otherItems = items.filter { $0.id != previousItem.id }.shuffled()

            for otherItem in otherItems.prefix(max(0, configuredNumberOfChoices - 1)) {
                let choice = QuizChoice(id: UUID(), label: otherItem.meaning, explanation: otherItem.etymology, isCorrect: false, item: otherItem)
                incorrectChoices.append(choice)
            }

            while incorrectChoices.count < max(0, configuredNumberOfChoices - 1) {
                incorrectChoices.append(QuizChoice(id: UUID(), label: "(候補不足)", explanation: nil, isCorrect: false, item: nil))
            }

            choices = ([correctChoice] + incorrectChoices).shuffled()
        }
    }

    // MARK: - バッチ完了

    private func completeBatch() {
        // バッチ完了処理
        // 次のバッチへ進むか、全体を終了するかを判定
        
        sessionStore.completeBatch()

        if order.count > sessionStore.batchSize {
            // 次のバッチがある
            order = Array(order.dropFirst(sessionStore.batchSize))
            prepareBatch()
        } else {
            // 全問題完了
            saveResults()
            sessionStore.endSession()
            dismiss()
        }
    }

    private func saveResults() {
        guard currentCSV.name != nil else { return }

        // ScoreStore が期待するイニシャライザを使う
        let result = QuizResult(total: sessionStore.questionCount, correct: sessionStore.score, settings: quizSettings.model)
        scoreStore.addResult(result)
    }

    // MARK: - ヘルパー

    private func determineLearningMode() -> String {
        // model に含まれる学習モードを返す
        quizSettings.model.learningMode.displayName
    }
}

// MARK: - Preview
#Preview {
    NavigationStack {
        QuizView()
            .environmentObject(WordScoreStore())
            .environmentObject(CurrentCSV.shared)
            .environmentObject(QuizSettings())
            .environmentObject(ScoreStore())
     }
 }
