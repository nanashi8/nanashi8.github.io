import Foundation

/// クイズの問題と選択肢を生成するサービス
struct QuizQuestionGenerator {
    
    /// 選択肢を生成
    /// - Parameters:
    ///   - correctItem: 正解の問題アイテム
    ///   - allItems: 全問題アイテム
    ///   - numberOfChoices: 選択肢数
    /// - Returns: 生成された選択肢（正解を含む、シャッフル済み）
    func generateChoices(
        correctItem: QuestionItem,
        allItems: [QuestionItem],
        numberOfChoices: Int
    ) -> (choices: [QuizChoice], correctAnswerID: UUID) {
        // 正解の選択肢を作成
        // 固定列3（rawColumns[2]）を使用して選択肢テキストを取得
        let correctChoiceLabel = getChoiceLabel(from: correctItem)
        
        let correctChoice = QuizChoice(
            id: UUID(),
            label: correctChoiceLabel,
            explanation: correctItem.etymology,
            isCorrect: true,
            item: correctItem
        )
        let correctAnswerID = correctChoice.id

        // 不正解の選択肢を作成
        var incorrectChoices: [QuizChoice] = []
        let otherItems = allItems.filter { $0.id != correctItem.id }.shuffled()

        for otherItem in otherItems.prefix(max(0, numberOfChoices - 1)) {
            // 固定列3（rawColumns[2]）を使用して選択肢テキストを取得
            let choiceLabel = getChoiceLabel(from: otherItem)
            
            let choice = QuizChoice(
                id: UUID(),
                label: choiceLabel,
                explanation: otherItem.etymology,
                isCorrect: false,
                item: otherItem
            )
            incorrectChoices.append(choice)
        }

        // 必要に応じて選択肢を補う（候補が不足する場合）
        while incorrectChoices.count < max(0, numberOfChoices - 1) {
            incorrectChoices.append(
                QuizChoice(
                    id: UUID(),
                    label: "(候補不足)",
                    explanation: nil,
                    isCorrect: false,
                    item: nil
                )
            )
        }

        // 正解と不正解をシャッフルして返す
        let allChoices = ([correctChoice] + incorrectChoices).shuffled()
        
        return (choices: allChoices, correctAnswerID: correctAnswerID)
    }
    
    // MARK: - Private Methods
    
    /// QuestionItemから選択肢ラベルを取得（固定列3を使用）
    /// - Parameter item: QuestionItem
    /// - Returns: 選択肢ラベル
    private func getChoiceLabel(from item: QuestionItem) -> String {
        // rawColumnsが存在し、列3（インデックス2）が存在する場合はそれを使用
        if item.rawColumns.count >= 3 {
            return item.rawColumns[2]
        }
        // フォールバック: rawColumnsがない場合はmeaningフィールドを使用
        return item.meaning
    }
}
