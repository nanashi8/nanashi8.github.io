import Foundation

/// 単語ごとの成績データ
/// - attempts: 試行回数
/// - correct: 正解回数
/// - lastSeen: 最終学習日時
public struct WordScore: Codable, Equatable {
    public var attempts: Int
    public var correct: Int
    public var lastSeen: Date?

    public init(attempts: Int = 0, correct: Int = 0, lastSeen: Date? = nil) {
        self.attempts = attempts
        self.correct = correct
        self.lastSeen = lastSeen
    }

    public var accuracy: Double {
        guard attempts > 0 else { return 0.0 }
        return Double(correct) / Double(attempts)
    }

    // 記録を更新する
    public mutating func record(correct: Bool) {
        attempts += 1
        if correct { self.correct += 1 }
        lastSeen = Date()
    }
}
