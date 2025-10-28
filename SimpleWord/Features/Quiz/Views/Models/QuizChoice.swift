import Foundation

/// クイズの選択肢
/// 各選択肢のデータと、正解かどうかの情報を保持
struct QuizChoice: Identifiable {
    /// 選択肢のユニークID
    let id: UUID
    
    /// 選択肢のテキスト（表示される内容）
    let label: String
    
    /// 選択肢の説明（語源・解説など）
    let explanation: String?
    
    /// 正解かどうか
    let isCorrect: Bool
    
    /// 選択肢に対応する問題項目（詳細情報表示用）
    let item: QuestionItem?
}
