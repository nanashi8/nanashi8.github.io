//
//  QuizSettingsFilterService.swift
//  SimpleWord
//
//  Created by リファクタリング フェーズ2
//

// フィルタ管理サービス
// - 何を: CSVから利用可能な分野と難易度を抽出し、フィルタの追加/削除を管理
// - なぜ: フィルタロジックを一元管理し、テスト可能にするため

import Foundation

/// クイズ設定のフィルタ（分野・難易度）を管理するサービス
struct QuizSettingsFilterService {
    
    /// CSVファイルから利用可能な分野と難易度を抽出する
    /// - Parameter csvName: CSV名（nilの場合は全CSVから集約）
    /// - Returns: (分野リスト, 難易度リスト) ※先頭に"全て"が追加される
    static func buildAvailableOptions(from csvName: String?) -> (fields: [String], difficulties: [String]) {
        var fieldsSet = Set<String>()
        var diffsSet = Set<String>()
        
        func process(fileName: String) {
            let base = fileName.replacingOccurrences(of: ".csv", with: "")
            let repository = QuestionItemRepository(fileName: base)
            if case .success(let arr) = repository.fetch() {
                for item in arr {
                    for field in item.relatedFields where !field.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        fieldsSet.insert(field)
                    }
                    if !item.difficulty.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        diffsSet.insert(item.difficulty)
                    }
                }
            }
        }
        
        if let csvName = csvName, !csvName.isEmpty {
            // 特定のCSVから抽出
            process(fileName: csvName)
        } else {
            // 全CSVから集約
            for name in FileUtils.listCSVFilesInDocuments() {
                process(fileName: name)
            }
            for name in FileUtils.listBundleCSVFiles() {
                process(fileName: name)
            }
        }
        
        let fields = ["全て"] + fieldsSet.sorted()
        let difficulties = ["全て"] + diffsSet.sorted()
        
        return (fields, difficulties)
    }
    
    /// 分野フィルタに追加する
    /// - Parameters:
    ///   - field: 追加する分野
    ///   - currentFields: 現在選択中の分野リスト
    /// - Returns: 更新後の分野リスト
    static func addField(_ field: String, to currentFields: [String]) -> [String] {
        if field == "全て" {
            return []
        }
        if currentFields.contains(field) {
            return currentFields
        }
        return currentFields + [field]
    }
    
    /// 分野フィルタから削除する
    /// - Parameters:
    ///   - field: 削除する分野
    ///   - currentFields: 現在選択中の分野リスト
    /// - Returns: 更新後の分野リスト
    static func removeField(_ field: String, from currentFields: [String]) -> [String] {
        return currentFields.filter { $0 != field }
    }
    
    /// 難易度フィルタに追加する
    /// - Parameters:
    ///   - difficulty: 追加する難易度
    ///   - currentDifficulties: 現在選択中の難易度リスト
    /// - Returns: 更新後の難易度リスト
    static func addDifficulty(_ difficulty: String, to currentDifficulties: [String]) -> [String] {
        if difficulty == "全て" {
            return []
        }
        if currentDifficulties.contains(difficulty) {
            return currentDifficulties
        }
        return currentDifficulties + [difficulty]
    }
    
    /// 難易度フィルタから削除する
    /// - Parameters:
    ///   - difficulty: 削除する難易度
    ///   - currentDifficulties: 現在選択中の難易度リスト
    /// - Returns: 更新後の難易度リスト
    static func removeDifficulty(_ difficulty: String, from currentDifficulties: [String]) -> [String] {
        return currentDifficulties.filter { $0 != difficulty }
    }
}
