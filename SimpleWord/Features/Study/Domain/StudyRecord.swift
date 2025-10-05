// StudyRecord.swift
// 学習履歴（1アイテム単位）と間隔更新ロジック

import Foundation

/// 学習履歴（1カード/アイテムごと）
/// - 役割: 出題間隔の更新・マスタリ判定・指標更新
public struct StudyRecord: Codable, Identifiable {
    public let id: UUID                      // アイテムID（QuestionItem.id と一致）
    public var firstSeenAt: Date?
    public var lastSeenAt: Date?
    public var nextDueAt: Date               // 次回出題時刻
    public var interval: TimeInterval        // 現在の出題間隔（秒）

    public var totalAttempts: Int
    public var correctCount: Int
    public var wrongCount: Int

    public var correctStreak: Int
    public var wrongStreak: Int
    public var alternationCount: Int         // 正誤が交互に変化した回数
    public var lastOutcome: ReviewOutcome?

    public var smoothedAccuracy: Double      // EWMA 正答率（0..1）
    public var avgResponseTime: Double       // EWMA 反応時間（秒）

    public var mastered: Bool
    public var trailingWindow: [Bool]        // 直近ウィンドウの正解履歴
    public var masteryWindowSize: Int

    public init(id: UUID, now: Date = Date()) {
        self.id = id
        self.firstSeenAt = nil
        self.lastSeenAt = nil
        self.nextDueAt = now
        self.interval = 30                    // 初期30秒（短期反復）

        self.totalAttempts = 0
        self.correctCount = 0
        self.wrongCount = 0

        self.correctStreak = 0
        self.wrongStreak = 0
        self.alternationCount = 0
        self.lastOutcome = nil

        self.smoothedAccuracy = 0.0
        self.avgResponseTime = 0.0

        self.mastered = false
        self.trailingWindow = []
        self.masteryWindowSize = 5            // 直近5回すべて正解で100%達成
    }

    /// 回答結果を反映し、次回出題間隔を更新する
    public mutating func apply(result: ReviewOutcome,
                               responseTime: TimeInterval,
                               userPace: Double,
                               forgettingFactor: Double = 1.0,
                               now: Date = Date()) {
        if firstSeenAt == nil { firstSeenAt = now }
        lastSeenAt = now
        totalAttempts += 1

        // 交互判定（前回と結果が異なる）
        if let last = lastOutcome, last != result { alternationCount += 1 }

        // 連続カウンタと正誤数
        switch result {
        case .correct:
            correctCount += 1
            correctStreak += 1
            wrongStreak = 0
        case .wrong, .gaveUp:
            wrongCount += 1
            wrongStreak += 1
            correctStreak = 0
        }

        // EWMA 更新（簡潔な平滑化）
        let alpha = 0.2
        let y = (result == .correct) ? 1.0 : 0.0
        smoothedAccuracy = (smoothedAccuracy == 0) ? y : (1 - alpha) * smoothedAccuracy + alpha * y
        avgResponseTime = (avgResponseTime == 0) ? responseTime : (1 - alpha) * avgResponseTime + alpha * responseTime

        // マスタリ判定のための直近ウィンドウ更新
        trailingWindow.append(result == .correct)
        if trailingWindow.count > masteryWindowSize { trailingWindow.removeFirst() }
        mastered = (trailingWindow.count == masteryWindowSize) && trailingWindow.allSatisfy { $0 }

        // 出題間隔の更新ロジック
        // 正解が続けば間隔↑、正誤交互なら間隔↓、不正解連続ならさらに間隔↓↓
        let minInterval: TimeInterval = 15                  // 下限
        let maxInterval: TimeInterval = 60 * 60 * 24 * 14   // 上限 14日

        if result == .correct {
            let streakBonus = min(3, correctStreak)         // 連続正解の上限寄与
            let altPenalty = (alternationCount > 0) ? 0.10 : 0.0
            let pace = clamp(userPace, 0.6, 1.6)            // ユーザ速度の安全域
            let forget = clamp(forgettingFactor, 0.7, 1.1)  // 忘却傾向（<1 で伸び抑制）
            interval = max(interval, 30)
            interval *= (1.6 + 0.2 * Double(streakBonus)) * pace * forget * (1.0 - altPenalty)
        } else {
            let wrongPower = min(3, wrongStreak)
            let forget = clamp(forgettingFactor, 0.7, 1.1)
            // 交互や誤答連続は強く詰める（0.4^k 倍）。忘れやすいほどさらに詰める。
            interval = max(minInterval, interval * pow(0.4, Double(wrongPower)) * forget)
        }

        interval = clamp(interval, minInterval, maxInterval)
        nextDueAt = now.addingTimeInterval(interval)
        lastOutcome = result
    }
}

// MARK: - Helpers
private func clamp<T: Comparable>(_ x: T, _ a: T, _ b: T) -> T {
    return min(max(x, a), b)
}
