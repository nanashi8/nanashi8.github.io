// ScoreStore.swift
// クイズ結果（セッション単位）の保存/読み込み
// - 何を: クイズ1回ごとの総数・正解数・設定を保存します（履歴）。
// - なぜ: 時系列の進捗を簡単に追えるようにするため。

import Foundation
import Combine

/// クイズ結果（Sendable準拠）
public struct QuizResult: Codable, Identifiable, Sendable {
    public let id: UUID
    public let date: Date
    public let total: Int
    public let correct: Int
    public let settings: QuizSettingsModel

    public init(total: Int, correct: Int, settings: QuizSettingsModel) {
        self.id = UUID()
        self.date = Date()
        self.total = total
        self.correct = correct
        self.settings = settings
    }
}

/// クイズ結果ストア（MainActorで並行性を保証）
@MainActor
public final class ScoreStore: ObservableObject {
    @Published public private(set) var results: [QuizResult] = []
    private let key = "QuizResults_v1"

    public init() {
        if let data = UserDefaults.standard.data(forKey: key),
           let decoded = try? JSONDecoder().decode([QuizResult].self, from: data) {
            self.results = decoded
        }
    }

    public func addResult(_ result: QuizResult) {
        results.insert(result, at: 0)
        save()
    }

    public func clear() {
        results = []
        save()
    }

    private func save() {
        if let data = try? JSONEncoder().encode(results) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }
}
