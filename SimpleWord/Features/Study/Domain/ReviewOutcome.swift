// ReviewOutcome.swift
// 学習結果の列挙
// Simple English + 日本語コメントで分かりやすく

import Foundation

/// ユーザーの回答結果（永続化可能）
public enum ReviewOutcome: String, Codable {
    case correct
    case wrong
    case gaveUp
}
