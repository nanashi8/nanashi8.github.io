// LegacyCSVQuestionLoaderAdapter.swift
// 既存のCSVQuestionLoaderとの互換性を保つアダプター
//
// 何を: CSVQuestionLoaderの既存インターフェースを維持
// なぜ: 段階的な移行を可能にし、QuizViewなど既存コードを破壊しないため

import Foundation

/// CSVQuestionLoaderの互換アダプター
@available(*, deprecated, message: "新しいQuestionItemRepositoryを直接使用してください")
public struct LegacyCSVQuestionLoaderAdapter {
    
    /// 指定したCSV名からQuestionItemを読み込む（既存インターフェース互換）
    /// - Parameter csvName: リソース名（例: "中学英単語" または "中学英単語.csv"）
    /// - Returns: QuestionItemの配列（エラー時は空配列）
    public static func loadQuestions(csvName: String?) -> [QuestionItem] {
        guard let csvName = csvName, !csvName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return []
        }
        
        // .csv拡張子を除去
        let fileName = csvName.hasSuffix(".csv") ? String(csvName.dropLast(4)) : csvName
        
        // 新しいRepositoryを使用
        let repository = QuestionItemRepository(fileName: fileName)
        
        switch repository.fetch() {
        case .success(let items):
            return items
        case .failure(let error):
            Logger.log("CSV読み込みエラー: \(error.localizedDescription)", level: .error)
            return []
        }
    }
}
