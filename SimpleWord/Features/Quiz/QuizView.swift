import SwiftUI

// QuizView.swift
// クイズ画面（4択・適応型学習・アニメーション）
// - 何を: CSV から問題を読み込み、適応型学習アルゴリズムで出題し、選択肢を表示して回答を記録します。
// - なぜ: ユーザーが効率的に単語学習を行えるようにするため。バッチ学習と適応型出題で学習効率を最大化します。

/// クイズ画面の実装
struct QuizView: View {
    // MARK: - Properties
    
    // 環境オブジェクト
    @EnvironmentObject var wordScoreStore: WordScoreStore
    @EnvironmentObject var currentCSV: CurrentCSV
    @EnvironmentObject var quizSettings: QuizSettings
    @EnvironmentObject var scoreStore: ScoreStore
    
    // 状態管理
    @StateObject private var state = QuizViewState()
    @StateObject private var sessionStore = QuizSessionStore.shared
    
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
            if state.isLoading {
                QuizLoadingView()
            } else if let error = state.errorMessage {
                QuizErrorView(message: error, onDismiss: { dismiss() })
            } else if state.items.isEmpty {
                QuizEmptyView(onDismiss: { dismiss() })
            } else {
                QuizContentView(
                    currentItem: state.currentItem,
                    choices: state.choices,
                    csvHeaderLabels: state.csvHeaderLabels,
                    csvName: currentCSV.name ?? "",
                    learningMode: learningModeDisplayName,
                    accuracy: Double(sessionStore.calculateAccuracy()),
                    passedCount: sessionStore.batchCorrect,
                    totalCount: sessionStore.questionCount,
                    batchSize: sessionStore.batchSize,
                    canGoPrevious: state.historyIndex > 0,
                    canGoNext: state.selectedChoiceID != nil,
                    onPrevious: { goToPreviousQuestion() },
                    onNext: { goToNextQuestion() },
                    selectedChoiceID: state.selectedChoiceID,
                    correctAnswerID: state.correctAnswerID,
                    dontKnowID: state.dontKnowID,
                    onSelect: { id in handleChoiceSelection(id) },
                    shouldAnimatePassedCount: $state.shouldAnimatePassedCount,
                    shouldAnimateTotalCount: $state.shouldAnimateTotalCount
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
            state.errorMessage = "CSVファイルが選択されていません。"
            state.isLoading = false
            return
        }

        let dataLoader = QuizDataLoader()
        
        do {
            let result = try dataLoader.loadQuizData(
                csvName: csvName,
                fields: Set(quizSettings.fields),
                difficulties: Set(quizSettings.difficulties),
                numberOfQuestions: quizSettings.numberOfQuestions,
                isRandomOrder: quizSettings.isRandomOrder
            )
            
            state.items = result.items
            state.order = result.order
            state.csvHeaderLabels = result.headerLabels
            
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

            state.isLoading = false
            prepareBatch()
            
        } catch {
            state.errorMessage = error.localizedDescription
            state.isLoading = false
        }
    }

    // MARK: - バッチ準備

    private func prepareBatch() {
        guard !state.order.isEmpty else {
            state.errorMessage = "出題する問題がありません。"
            return
        }

        let batchManager = QuizBatchManager()
        state.pool = batchManager.prepareBatch(
            from: state.items,
            order: state.order,
            batchSize: sessionStore.batchSize,
            repeatCount: quizSettings.repeatCount
        )

        guard !state.pool.isEmpty else {
            state.errorMessage = "出題する問題がありません。"
            return
        }

        prepareQuestion()
    }

    // MARK: - 問題準備

    private func prepareQuestion() {
        guard !state.pool.isEmpty else {
            // バッチ完了
            completeBatch()
            return
        }

        state.currentItem = state.pool.removeFirst()
        state.selectedChoiceID = nil
        state.correctAnswerID = nil
        state.dontKnowID = UUID()

        guard let item = state.currentItem else { return }

        // 選択肢の生成
        let generator = QuizQuestionGenerator()
        let result = generator.generateChoices(
            correctItem: item,
            allItems: state.items,
            numberOfChoices: configuredNumberOfChoices
        )
        
        state.choices = result.choices
        state.correctAnswerID = result.correctAnswerID

        // 履歴に追加
        if state.historyIndex >= 0 && state.historyIndex < state.history.count - 1 {
            state.history = Array(state.history.prefix(state.historyIndex + 1))
        }
        state.history.append(item.id)
        state.historyIndex = state.history.count - 1
    }

    // MARK: - 回答処理

    private func handleChoiceSelection(_ id: UUID) {
        guard state.selectedChoiceID == nil else { return }

        // 分からないボタンの処理
        if id == state.dontKnowID {
            giveUp()
            return
        }

        // 通常の選択肢
        state.selectedChoiceID = id
        let wasCorrect = (id == state.correctAnswerID)
        
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
        guard state.selectedChoiceID == nil else { return }
        state.selectedChoiceID = state.dontKnowID
        
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
        if let item = state.currentItem {
            wordScoreStore.recordResult(itemID: item.id, correct: isCorrect)
        }
    }
    
    /// アニメーションを設定
    private func setAnimation(totalCount: Bool, passedCount: Bool) {
        if totalCount {
            state.shouldAnimateTotalCount = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                self.state.shouldAnimateTotalCount = false
            }
        }

        if passedCount {
            state.shouldAnimatePassedCount = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                self.state.shouldAnimatePassedCount = false
            }
        }
    }

    // MARK: - ナビゲーション

    private func goToNextQuestion() {
        prepareQuestion()
    }

    private func goToPreviousQuestion() {
        guard state.historyIndex > 0 else { return }

        state.historyIndex -= 1
        let previousID = state.history[state.historyIndex]

        // 前の問題を再表示
        if let previousItem = state.items.first(where: { $0.id == previousID }) {
            state.currentItem = previousItem
            state.selectedChoiceID = nil
            state.correctAnswerID = nil

            // 選択肢を再生成
            let generator = QuizQuestionGenerator()
            let result = generator.generateChoices(
                correctItem: previousItem,
                allItems: state.items,
                numberOfChoices: configuredNumberOfChoices
            )
            
            state.choices = result.choices
            state.correctAnswerID = result.correctAnswerID
        }
    }

    // MARK: - バッチ完了

    private func completeBatch() {
        // バッチ完了処理
        // 次のバッチへ進むか、全体を終了するかを判定
        
        sessionStore.completeBatch()

        if state.order.count > sessionStore.batchSize {
            // 次のバッチがある
            state.order = Array(state.order.dropFirst(sessionStore.batchSize))
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
