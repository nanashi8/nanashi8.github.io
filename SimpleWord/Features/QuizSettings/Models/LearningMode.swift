//
//  LearningMode.swift
//  SimpleWord
//
//  Created by リファクタリング フェーズ4
//

// 学習モード定義
// - 何を: 通常/復習/補習の3つの学習モードを定義
// - なぜ: 学習の目的に応じた出題方法を切り替えるため

import Foundation

/// 学習モード: 通常 / 復習 / 補習
<<<<<<< HEAD
public enum LearningMode: String, Codable, CaseIterable, Identifiable, Sendable {
=======
public enum LearningMode: String, Codable, CaseIterable, Identifiable {
>>>>>>> docs/organize-documentation
    public var id: String { rawValue }
    
    case normal = "normal"          // 通常モード
    case review = "review"          // 復習モード
    case remediation = "remediation" // 補習モード

    /// 日本語表示名
    public var displayName: String {
        switch self {
        case .normal: return "通常"
        case .review: return "復習"
        case .remediation: return "補習"
        }
    }
}
