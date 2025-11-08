//
//  QuizModels.swift
//  SimpleWord
//
//  Created by GitHub Copilot on 2025/10/18.
//

// クイズ関連のモデル構造体
// - 何を: Choice構造体など、クイズ機能で使用する共通のモデルを定義
// - なぜ: 複数のViewで共有するモデルを一箇所に集約し、保守性を向上させるため

import Foundation

/// 選択肢データ
/// - 選択肢に表示する主要ラベルは日本語訳（meaning）を優先し、空の場合は語句(term)を使う
struct Choice: Identifiable, Equatable {
    let id: UUID
    let item: QuestionItem
    
    /// 選択肢に表示するラベル（meaningを優先、空ならterm）
    var label: String {
        item.meaning.isEmpty ? item.term : item.meaning
    }
    
    init(item: QuestionItem) {
        self.item = item
        self.id = item.id
    }
    
    static func ==(lhs: Choice, rhs: Choice) -> Bool {
        lhs.id == rhs.id
    }
}
