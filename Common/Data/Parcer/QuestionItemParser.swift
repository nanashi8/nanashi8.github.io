// QuestionItemParser.swift
// QuestionItemのパース処理
//
// 何を: CSV行をQuestionItemに変換する処理
// なぜ: パース処理を独立させ、再利用可能にするため

import Foundation

/// QuestionItem用のパーサー
public struct QuestionItemParser {
    
    /// 固定列順のCSVLineParserを生成する（後方互換性のため残す）
    public static func makeParser() -> CSVLineParser<QuestionItem> {
        CSVLineParser { lineNumber, columns in
            // 7列固定（IDなし）
            guard columns.count == QuestionItemCSVSchema.standardColumnCount else {
                throw DataSourceError.invalidData("行\(lineNumber): 列数不正（期待: \(QuestionItemCSVSchema.standardColumnCount), 実際: \(columns.count)）")
            }
            
            let term = columns[QuestionItemCSVSchema.Column.term.rawValue]
            let reading = columns[QuestionItemCSVSchema.Column.reading.rawValue]
            let meaning = columns[QuestionItemCSVSchema.Column.meaning.rawValue]
            let etymology = columns[QuestionItemCSVSchema.Column.etymology.rawValue]
            let relatedWordsCSV = columns[QuestionItemCSVSchema.Column.relatedWords.rawValue]
            let relatedFieldsCSV = columns[QuestionItemCSVSchema.Column.relatedFields.rawValue]
            let difficulty = columns[QuestionItemCSVSchema.Column.difficulty.rawValue]
            
            return QuestionItem(
                term: term,
                reading: reading,
                meaning: meaning,
                etymology: etymology,
                relatedWordsCSV: relatedWordsCSV,
                relatedFieldsCSV: relatedFieldsCSV,
                difficulty: difficulty,
                rawColumns: columns,  // 生のCSV列データを保存
                id: UUID()
            )
        }
    }
    
    /// ヘッダ駆動型パーサを生成する（CSVのヘッダを最優先）
    /// - Returns: ヘッダマッピングを受け取るパーサクロージャ
    public static func makeHeaderDrivenParser() -> (Int, [String], [String: Int]) throws -> QuestionItem {
        return { lineNumber, columns, mapping in
            // 各フィールドを取得（存在しない場合は空文字列）
            let term = mapping["term"].flatMap { columns[safe: $0] } ?? ""
            let reading = mapping["reading"].flatMap { columns[safe: $0] } ?? ""
            let meaning = mapping["meaning"].flatMap { columns[safe: $0] } ?? ""
            let etymology = mapping["etymology"].flatMap { columns[safe: $0] } ?? ""
            let relatedWordsCSV = mapping["relatedWords"].flatMap { columns[safe: $0] } ?? ""
            let relatedFieldsCSV = mapping["relatedFields"].flatMap { columns[safe: $0] } ?? ""
            let difficulty = mapping["difficulty"].flatMap { columns[safe: $0] } ?? ""
            
            return QuestionItem(
                term: term,
                reading: reading,
                meaning: meaning,
                etymology: etymology,
                relatedWordsCSV: relatedWordsCSV,
                relatedFieldsCSV: relatedFieldsCSV,
                difficulty: difficulty,
                rawColumns: columns,  // 生のCSV列データを保存
                id: UUID()
            )
        }
    }
}

// MARK: - Array Extension (Safe Subscript)

extension Array {
    /// 安全な添字アクセス
    subscript(safe index: Int) -> Element? {
        return indices.contains(index) ? self[index] : nil
    }
}
