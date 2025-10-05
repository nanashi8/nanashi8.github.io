// LearningAnalytics.swift
// 軽量な学習特徴の推定

import Foundation

/// 学習特徴の分析（軽量）
/// - 反応時間とマスタリまでの試行数から pace を更新
/// - 誤答率と交互傾向から forgettingFactor / alternationBoost を推定
public final class LearningAnalytics {

    public init() {}

    public func computeProfile(from records: [StudyRecord]) -> UserLearningProfile {
        guard !records.isEmpty else { return UserLearningProfile() }

        // 中央反応時間（粗い推定）
        let times = records.map(\.avgResponseTime).filter { $0 > 0 }.sorted()
        let medianRT = times.isEmpty ? 2.5 : times[times.count / 2]

        // マスタリまでの平均試行数（粗い推定）
        let mastered = records.filter { $0.mastered }
        let avgTrials = mastered.isEmpty ? 4.0 : (mastered.map(\.totalAttempts).map(Double.init).reduce(0, +) / Double(mastered.count))

        // pace: 速く・正確なら pace↑、遅い・反復多いなら pace↓
        let rtRef = 2.5
        let trialsRef = 4.0
        let rtFactor = clamp(rtRef / max(0.8, medianRT), 0.7, 1.3)
        let trialsFactor = clamp(trialsRef / max(1.0, avgTrials), 0.7, 1.3)
        let pace = clamp(0.5 * rtFactor + 0.5 * trialsFactor, 0.6, 1.6)

        // 交互傾向: 正誤が交互に切り替わる割合（試行数で正規化）
        let totalsAlternations = records.map(\.alternationCount).reduce(0, +)
        let totalsAttempts = records.map(\.totalAttempts).reduce(0, +)
        let alternationRate = (totalsAttempts > 1) ? Double(totalsAlternations) / Double(max(1, totalsAttempts - records.count)) : 0.0
        // 0..0.3 の範囲でブースト。交互が多いほどブースト大。
        let alternationBoost = clamp(alternationRate * 0.3, 0.0, 0.3)

        // 忘却傾向: 誤答率から推定（高いほど間隔伸長を抑える）
        let totalWrongs = records.map(\.wrongCount).reduce(0, +)
        let lapseRate = (totalsAttempts > 0) ? Double(totalWrongs) / Double(totalsAttempts) : 0.0
        // 1.1（ほぼ忘れない）〜0.7（忘れやすい）にマップ
        let forgettingFactor = clamp(1.1 - 0.6 * lapseRate, 0.7, 1.1)

        // 目標精度とウィンドウは固定（必要なら将来動的化）
        return UserLearningProfile(
            paceFactor: pace,
            targetAccuracy: 0.95,
            masteryWindowSize: 5,
            forgettingFactor: forgettingFactor,
            alternationBoost: alternationBoost
        )
    }
}

private func clamp<T: Comparable>(_ x: T, _ a: T, _ b: T) -> T {
    return min(max(x, a), b)
}
