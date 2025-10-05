// AdaptiveScheduler.swift
// 学習スケジューラ: StudyProgressRepository と LearningAnalytics を使って StudyRecord を更新する

import Foundation

/// ユーザー適応型のスケジューラ（テスト/QuizView から同期的に呼ばれることを想定）
final class AdaptiveScheduler {
    private let repo: StudyProgressRepository
    private let analytics: LearningAnalytics
    private let queue = DispatchQueue(label: "adaptive.scheduler.queue")

    /// コンストラクタ: テストから repository を差し替えられるように引数を取る
    init(repo: StudyProgressRepository = FileStudyProgressRepository(), analytics: LearningAnalytics = LearningAnalytics()) {
        self.repo = repo
        self.analytics = analytics
    }

    /// ユーザーの回答を記録し、StudyRecord を更新・保存する
    /// - Parameters:
    ///   - itemID: QuestionItem.id に対応する UUID
    ///   - result: ReviewOutcome (.correct/.wrong/.gaveUp)
    ///   - responseTime: ユーザーの応答時間（秒）
    ///   - now: テスト用に時刻を注入できるようにオプション
    func record(itemID: UUID, result: ReviewOutcome, responseTime: TimeInterval, now: Date = Date()) {
        // 同期的に処理してテストからの直後確認を可能にする
        queue.sync {
            // リポジトリからレコードを読み込み（存在しなければ初期化される）
            var rec = repo.load(id: itemID)

            // 学習傾向をリポジトリ全体から推定
            let profile = analytics.computeProfile(from: repo.loadAll())

            // StudyRecord のロジックに委譲して更新
            rec.apply(result: result,
                      responseTime: responseTime,
                      userPace: profile.paceFactor,
                      forgettingFactor: profile.forgettingFactor,
                      now: now)

            // 変更を保存
            repo.save(rec)
        }
    }

    /// 次のバッチで出題する項目のID順リストを返す（上位count件）
    /// 現状は軽量な優先度戦略:
    ///  - 出題間隔が短い（復習必要度が高い）ものを優先
    ///  - 出題回数の少ないものを次点で優先
    ///  - ランダム性を混ぜる
    func scheduleNextBatch(itemIDs: [UUID], count: Int) -> [UUID] {
        // シンプルで決定的な選択を行う。queueで同期してrepoの一貫性を確保。
        return queue.sync {
            let records = itemIDs.map { id -> (UUID, StudyRecord) in
                return (id, repo.load(id: id))
            }

            // 優先度スコアを計算: 小さい interval と少ない totalAttempts を高優先度に
            let scored: [(UUID, Double)] = records.map { (id, rec) in
                // interval (秒) -> inverse priority
                let invInterval = 1.0 / max(rec.interval, 1.0)
                // attempts の重み（少ない方を優先）
                let attemptScore = 1.0 / max(Double(rec.totalAttempts + 1), 1.0)
                // 未習得はボーナス
                let masteredBonus = rec.mastered ? 0.2 : 1.0
                // alternation や wrongStreak がある場合は多少優先
                let troubleFactor = 1.0 + Double(rec.wrongStreak) * 0.1 + Double(rec.alternationCount) * 0.05
                let score = invInterval * 0.6 + attemptScore * 0.3
                let final = score * troubleFactor * masteredBonus
                return (id, final)
            }

            // スコア降順でソートして上位countを返す。ただし件数不足はそのまま返す
            let sorted = scored.sorted { $0.1 > $1.1 }.map { $0.0 }
            if sorted.isEmpty { return [] }
            return Array(sorted.prefix(max(0, min(count, sorted.count))))
        }
    }
}
