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
            let now = Date()
            let records = itemIDs.map { id -> (UUID, StudyRecord) in
                return (id, repo.load(id: id))
            }

            // 学習プロファイル（全体傾向）を取得して忘却傾向や交互傾向を利用
            let profile = analytics.computeProfile(from: repo.loadAll())
            let globalForgetting = profile.forgettingFactor
            let globalAlternationBoost = profile.alternationBoost

            // 優先度スコアを計算: 既存の要素に加えて ease と想起確率を反映する
            let scored: [(UUID, Double)] = records.map { (id, rec) in
                // 期日差分（秒）
                let dueDelta = now.timeIntervalSince(rec.nextDueAt)
                let dueFactor = 1.0 + max(0.0, dueDelta) / 3600.0

                // 正答率が低ければ優先度UP
                let accFactor = 1.0 + (1.0 - rec.smoothedAccuracy) * 1.5

                // interval の逆数（短い interval = 高優先）
                let intervalFactor = 1.0 / max(rec.interval, 1.0)

                // attempts の補正（少ないほど優先）
                let attemptScore = 1.0 / max(Double(rec.totalAttempts + 1), 1.0)

                // トラブル補正
                let troubleFactor = 1.0 + Double(rec.wrongStreak) * 0.15 + Double(rec.alternationCount) * 0.05

                // 習熟済みペナルティ
                let masteredPenalty = rec.mastered ? 0.25 : 1.0

                // 個別容易度による補正: ease が高い（簡単）ほど優先度を下げる
                let easeFactor = 1.0 / max(rec.ease, 1.1)

                // 想起確率の簡易推定（経過時間と間隔から指数減衰で推定）
                let timeSinceLast = rec.lastSeenAt != nil ? now.timeIntervalSince(rec.lastSeenAt!) : rec.interval
                let recallEstimate = exp(-timeSinceLast / max(rec.interval, 1.0))

                // グローバルな忘却傾向に基づくブースト（忘れやすければ優先度UP）
                let forgettingBoost = 1.0 + (1.1 - globalForgetting)

                // 交互傾向ブースト
                let alternationBoost = 1.0 + globalAlternationBoost

                // 最終スコアの組み合わせ: 既存の寄与を保ちつつ新要素で補正
                var final = dueFactor * accFactor * intervalFactor * attemptScore * troubleFactor * masteredPenalty
                final *= easeFactor
                final *= (1.0 + (1.0 - recallEstimate)) // 想起されにくいものは優先度UP
                final *= forgettingBoost
                final *= alternationBoost

                return (id, final)
            }

            // スコア降順でソートして上位countを返す
            let sorted = scored.sorted { $0.1 > $1.1 }.map { $0.0 }
            if sorted.isEmpty { return [] }
            return Array(sorted.prefix(max(0, min(count, sorted.count))))
        }
    }
}
