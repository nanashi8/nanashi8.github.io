import Foundation

/// クイズの回答処理結果
struct QuizAnswerResult {
    /// アニメーションすべきか（総出題数）
    let shouldAnimateTotalCount: Bool
    
    /// アニメーションすべきか（合格数）
    let shouldAnimatePassedCount: Bool
    
    /// 正解だったか
    let wasCorrect: Bool
}

/// クイズの回答処理を担当
struct QuizAnswerHandler {
    
    /// 回答を処理
    /// - Parameters:
    ///   - isCorrect: 正解かどうか
    ///   - sessionStore: クイズセッションストア
    /// - Returns: 回答処理の結果
    func handleAnswer(
        isCorrect: Bool,
        sessionStore: QuizSessionStore
    ) -> QuizAnswerResult {
        let oldQuestionCount = sessionStore.questionCount
        let oldBatchCorrect = sessionStore.batchCorrect
        
        // セッションストアに記録
        sessionStore.recordAnswer(correct: isCorrect)
        
        // アニメーション判定
        let shouldAnimateTotalCount = sessionStore.questionCount > oldQuestionCount
        let shouldAnimatePassedCount = sessionStore.batchCorrect > oldBatchCorrect
        
        return QuizAnswerResult(
            shouldAnimateTotalCount: shouldAnimateTotalCount,
            shouldAnimatePassedCount: shouldAnimatePassedCount,
            wasCorrect: isCorrect
        )
    }
}
