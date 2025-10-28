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

        let dataLoader = QuizDataLoader()
        
        do {
            let result = try dataLoader.loadQuizData(
                csvName: csvName,
                fields: quizSettings.fields,
                difficulties: quizSettings.difficulties,
                numberOfQuestions: quizSettings.numberOfQuestions,
                isRandomOrder: quizSettings.isRandomOrder
            )
            
            self.items = result.items
            self.order = result.order
            self.csvHeaderLabels = result.headerLabels
            
            // 問題集に対応する学習結果を読み込む
            wordScoreStore.switchToCSV(csvName)

            // 出題数とバッチサイズの設定
            let totalQuestions = result.order.count
            let batchSize = min(quizSettings.questionsPerBatch, totalQuestions)

            // セッションの開始または復元
            if sessionStore.canResumeSession(csvName: csvName) {
                // 既存のセッションを継続
                print("セッションを復元: スコア=\(sessionStore.score), 問題数=\(sessionStore.questionCount)")
            } else {
                // 新しいセッションを開始
                sessionStore.startSession(csvName: csvName, batchSize: batchSize, totalQuestions: totalQuestions)
            }

            isLoading = false
            prepareBatch()
            
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
        }
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
        let generator = QuizQuestionGenerator()
        let result = generator.generateChoices(
            correctItem: item,
            allItems: items,
            numberOfChoices: configuredNumberOfChoices
        )
        
        choices = result.choices
        correctAnswerID = result.correctAnswerID

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
        selectedChoiceID = id
        let wasCorrect = (id == correctAnswerID)
        
        // 回答処理とアニメーション
        processAnswer(isCorrect: wasCorrect)

        // 自動進行
        if wasCorrect && autoAdvanceEnabled {
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                goToNextQuestion()
            }
        }
    }

    private func giveUp() {
        guard selectedChoiceID == nil else { return }
        selectedChoiceID = dontKnowID
        
        // 回答処理とアニメーション（不正解として）
        processAnswer(isCorrect: false)
    }
    
    /// 回答を処理してアニメーションを設定
    private func processAnswer(isCorrect: Bool) {
        let answerHandler = QuizAnswerHandler()
        let result = answerHandler.handleAnswer(
            isCorrect: isCorrect,
            sessionStore: sessionStore
        )

        // アニメーション設定
        setAnimation(
            totalCount: result.shouldAnimateTotalCount,
            passedCount: result.shouldAnimatePassedCount
        )

        // スコア記録
        if let item = currentItem {
            wordScoreStore.recordResult(itemID: item.id, correct: isCorrect)
        }
    }
    
    /// アニメーションを設定
    private func setAnimation(totalCount: Bool, passedCount: Bool) {
        if totalCount {
            shouldAnimateTotalCount = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                self.shouldAnimateTotalCount = false
            }
        }

        if passedCount {
            shouldAnimatePassedCount = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                self.shouldAnimatePassedCount = false
            }
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
            let generator = QuizQuestionGenerator()
            let result = generator.generateChoices(
                correctItem: previousItem,
                allItems: items,
                numberOfChoices: configuredNumberOfChoices
            )
            
            choices = result.choices
            correctAnswerID = result.correctAnswerID
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
