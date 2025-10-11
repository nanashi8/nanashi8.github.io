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

    // 追加: アイテムごとの容易度（ease）。大きいほど間隔が伸びやすい（SM-2 の概念に近い）
    public var ease: Double

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

        self.ease = 1.6                        // 初期容易度（過度な増減を防ぐ）
    }

    /// 回答結果を反映し、次回出題間隔を更新する
    /// 実装ノート（日本語）:
    /// - 忘却曲線の考え方を簡潔に取り入れるため ease（容易度）を保持し、quality に応じて ease を適応更新する。
    /// - 正解時は ease と連続正解に応じて間隔を伸ばす。誤答時は指数的に間隔を詰める。
    /// - 応答時間を簡易的な品質指標（quality）として用い、速く正答できる場合は高品質と判断する。
    public mutating func apply(result: ReviewOutcome,
                               responseTime: TimeInterval,
                               userPace: Double,
                               forgettingFactor: Double = 1.0,
                               now: Date = Date()) {
        if firstSeenAt == nil { firstSeenAt = now }
        lastSeenAt = now
        totalAttempts += 1

        // 前回結果と異なれば交互カウントを増やす
        if let last = lastOutcome, last != result { alternationCount += 1 }

        // 正誤カウントと連続カウンタ更新
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

        // EWMA 更新（正答率・反応時間）
        let alpha = 0.2
        let y = (result == .correct) ? 1.0 : 0.0
        smoothedAccuracy = (smoothedAccuracy == 0) ? y : (1 - alpha) * smoothedAccuracy + alpha * y
        avgResponseTime = (avgResponseTime == 0) ? responseTime : (1 - alpha) * avgResponseTime + alpha * responseTime

        // 直近ウィンドウ更新とマスタリ判定
        trailingWindow.append(result == .correct)
        if trailingWindow.count > masteryWindowSize { trailingWindow.removeFirst() }
        mastered = (trailingWindow.count == masteryWindowSize) && trailingWindow.allSatisfy { $0 }

        // --- 間隔更新ロジック（脳科学ベースの簡易実装） ---
        let minInterval: TimeInterval = 15                  // 下限（既存の値を尊重）
        let maxInterval: TimeInterval = 60 * 60 * 24 * 14   // 上限 14日

        // 簡易 quality 指標（1..5）: 速く正答できれば高品質
        var quality = 3
        if result == .correct {
            // 速さの閾値: 平均反応時間の 0.8 倍を目安に速いと判断
            let fastThreshold = max(0.5, avgResponseTime * 0.8)
            quality = (responseTime <= fastThreshold) ? 5 : 4
        } else {
            quality = (result == .gaveUp) ? 1 : 2
        }

        // ease の更新（簡易 SM-2 ライク）
        // quality が高いほど ease が増加する。変化量は小さめにして安定化を優先。
        let easeDelta = 0.06 * (Double(quality) - 3.0)
        ease = clamp(ease + easeDelta, 1.1, 3.0)

        // 交互ペナルティ（誤答と正解が頻繁に切り替わる場合、過度な伸長を抑制）
        let altPenalty = (alternationCount > 0) ? 0.08 : 0.0

        if result == .correct {
            // 連続正解ボーナス（上限3まで）
            let streakBonus = min(3, correctStreak)
            let pace = clamp(userPace, 0.6, 1.6)
            let forget = clamp(forgettingFactor, 0.75, 1.05)

            // growth は ease と streak による乗数。既存ロジックの感触を踏襲しつつ、ease を反映。
            interval = max(interval, 30)
            let growth = (1.2 + 0.12 * Double(streakBonus)) * ease * pace * forget * (1.0 - altPenalty)
            interval *= growth
        } else {
            // 誤答時は指数的に短縮（誤答連続でさらに短縮）
            let wrongPower = min(4, wrongStreak)
            let forget = clamp(forgettingFactor, 0.7, 1.05)
            interval = max(minInterval, interval * pow(0.5, Double(wrongPower)) * forget)
        }

        // 最終クランプと次回期日の設定
        interval = clamp(interval, minInterval, maxInterval)
        nextDueAt = now.addingTimeInterval(interval)
        lastOutcome = result
    }
}

// MARK: - Helpers
private func clamp<T: Comparable>(_ x: T, _ a: T, _ b: T) -> T {
    return min(max(x, a), b)
}
