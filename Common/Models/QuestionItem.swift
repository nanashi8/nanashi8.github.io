// QuestionItem.swift
// モデル: CSVから読み込む問題アイテム
// 簡潔な日本語コメントを含む（何を/なぜ）

import Foundation

/// 問題データの軽量モデル
/// - term: 語句（英単語など）
/// - reading: 読み（かな）
/// - meaning: 日本語の意味
/// - etymology: 語源や簡単な解説
/// - relatedWords: 関連語のリスト
/// - relatedFields: 関連分野やカテゴリのリスト
/// - difficulty: 難易度（文字列で簡単に指定）
public struct QuestionItem: Identifiable, Hashable {
    public let id: UUID
    public let term: String
    public let reading: String
    public let meaning: String
    public let etymology: String
    public let relatedWords: [String]
    public let relatedFields: [String]
    public let difficulty: String

    // CSVの各列から初期化する簡易イニシャライザ
    // relatedWords/relatedFields はセミコロン(;)で区切られた文字列を受け取る
    public init(term: String,
                reading: String,
                meaning: String,
                etymology: String,
                relatedWordsCSV: String,
                relatedFieldsCSV: String,
                difficulty: String,
                id: UUID? = nil) {
        self.id = id ?? UUID()
        self.term = term
        self.reading = reading
        self.meaning = meaning
        self.etymology = etymology
        self.relatedWords = relatedWordsCSV.split(separator: ";").map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
        self.relatedFields = relatedFieldsCSV.split(separator: ";").map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
        self.difficulty = difficulty
    }
}
