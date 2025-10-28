import SwiftUI

/// クイズメインコンテンツ
/// 統計表示、ナビゲーションボタン、問題カード、選択肢を含むメイン画面
struct QuizContentView: View {
    // 環境オブジェクト
    @EnvironmentObject var wordScoreStore: WordScoreStore
    
    // データ
    let currentItem: QuestionItem?
    let choices: [QuizChoice]
    let csvHeaderLabels: [String: String]
    
    // 表示情報
    let csvName: String
    let learningMode: String
    let accuracy: Double
    let passedCount: Int
    let totalCount: Int
    let batchSize: Int
    
    // ナビゲーション
    let canGoPrevious: Bool
    let canGoNext: Bool
    let onPrevious: () -> Void
    let onNext: () -> Void
    
    // 選択状態
    let selectedChoiceID: UUID?
    let correctAnswerID: UUID?
    let dontKnowID: UUID
    let onSelect: (UUID) -> Void
    
    // アニメーション
    @Binding var shouldAnimatePassedCount: Bool
    @Binding var shouldAnimateTotalCount: Bool
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // 統計表示
                QuizStatisticsView(
                    csvName: csvName,
                    learningMode: learningMode,
                    accuracy: accuracy,
                    passedCount: passedCount,
                    totalCount: totalCount,
                    batchSize: batchSize,
                    shouldAnimatePassedCount: $shouldAnimatePassedCount,
                    shouldAnimateTotalCount: $shouldAnimateTotalCount
                )
                .padding(.horizontal)

                // ナビゲーションボタン（問題カードの上に表示）
                QuizNavigationButtonsView(
                    canGoPrevious: canGoPrevious,
                    canGoNext: canGoNext,
                    onPrevious: onPrevious,
                    onNext: onNext
                )
                .padding(.horizontal)

                // 問題カード
                if let item = currentItem {
                    QuestionCardView(
                        item: item,
                        isAnswered: selectedChoiceID != nil,
                        isCorrect: selectedChoiceID != nil ? (selectedChoiceID == correctAnswerID) : nil
                    )
                    .environmentObject(wordScoreStore)
                    .padding(.horizontal)
                }

                // 選択肢
                VStack(spacing: 12) {
                    ForEach(choices) { choice in
                        ChoiceCardView(
                            id: choice.id,
                            text: choice.label,
                            explanation: choice.explanation,
                            item: choice.item,
                            headerLabels: csvHeaderLabels,
                            selectedID: selectedChoiceID,
                            correctID: correctAnswerID,
                            onSelect: onSelect
                        )
                        .padding(.horizontal)
                    }

                    // "分からない" ボタン
                    DontKnowCardView(
                        id: dontKnowID,
                        selectedID: selectedChoiceID,
                        correctAnswerID: correctAnswerID,
                        onSelect: onSelect
                    )
                    .padding(.horizontal)
                }

                Spacer(minLength: 16)
            }
        }
        .background(Color(uiColor: .systemGroupedBackground))
    }
}

// MARK: - Preview
#Preview {
    QuizContentView(
        currentItem: QuestionItem(
            id: UUID(),
            term: "apple",
            reading: "アップル",
            meaning: "りんご",
            etymology: "果物の一種",
            relatedWords: "fruit, banana",
            relatedFields: ["食べ物"],
            difficulty: "初級"
        ),
        choices: [
            QuizChoice(
                id: UUID(),
                label: "りんご",
                explanation: "果物の一種",
                isCorrect: true,
                item: nil
            ),
            QuizChoice(
                id: UUID(),
                label: "みかん",
                explanation: nil,
                isCorrect: false,
                item: nil
            )
        ],
        csvHeaderLabels: [:],
        csvName: "サンプル.csv",
        learningMode: "標準",
        accuracy: 0.75,
        passedCount: 3,
        totalCount: 4,
        batchSize: 10,
        canGoPrevious: true,
        canGoNext: false,
        onPrevious: {},
        onNext: {},
        selectedChoiceID: nil,
        correctAnswerID: nil,
        dontKnowID: UUID(),
        onSelect: { _ in },
        shouldAnimatePassedCount: .constant(false),
        shouldAnimateTotalCount: .constant(false)
    )
    .environmentObject(WordScoreStore())
}
