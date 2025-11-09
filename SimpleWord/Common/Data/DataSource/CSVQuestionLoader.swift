// filepath: /Users/yuichinakamura/Documents/20251006_002/SimpleWord/SimpleWord/Services/CSVQuestionLoader.swift
// CSVQuestionLoader.swift
// Bundle 内の CSV ファイルを読み込み、QuestionItem 配列を生成するユーティリティ
// - 何を: 選択された CSV 名に対応するリソースを読み込み、CSV をパースして QuestionItem に変換
// - なぜ: QuizView が CSV 選択時に問題を表示できるようにするため
//
// 注意: QuestionItemRepositoryを直接使用するように更新されました。

import Foundation

/// CSV を読み込み QuestionItem 配列を返すシンプルなローダー
/// - 注意: リソース名に ".csv" を含んでいる場合と含んでいない場合の両方に対応します。
public struct CSVQuestionLoader {
    /// 指定した CSV 名から QuestionItem を読み込む
    /// - Parameter csvName: リソース名（例: "中学英単語" または "中学英単語.csv"）。nil の場合は空配列を返す。
    public static func loadQuestions(csvName: String?) -> [QuestionItem] {
        guard let csvName = csvName, !csvName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return []
        }
        
        // .csv拡張子を除去
        let fileName = csvName.hasSuffix(".csv") ? String(csvName.dropLast(4)) : csvName
        
        // QuestionItemRepositoryを直接使用
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
