// WordScoreStore.swift
// 単語別成績（UUIDごと）の保存/読み込み
// - 何を: 各語の試行回数・正解数・最終学習日時を保存して正答率を算出します。
// - なぜ: 苦手な語を見つけやすくし、復習に活かすため。

import Foundation
import Combine

/// 単語成績の永続化ストア
/// - シンプルに UserDefaults に JSON エンコードで保存する
/// - ObservableObject で UI に反映される
public final class WordScoreStore: ObservableObject {
    /// UUID -> WordScore
    @Published private(set) var scores: [UUID: WordScore] = [:]

    private let userDefaultsKey = "SimpleWord.WordScoreStore.v1"
    private let saveQueue = DispatchQueue(label: "SimpleWord.WordScoreStore.saveQueue", qos: .background)

    public init() {
        load()
    }

    /// 指定単語に対する結果を記録する
    public func recordResult(itemID: UUID, correct: Bool) {
        var entry = scores[itemID] ?? WordScore()
        entry.record(correct: correct)
        scores[itemID] = entry
        saveAsync()
    }

    /// 指定単語の現在のスコアを返す（無ければ初期値）
    public func score(for itemID: UUID) -> WordScore {
        return scores[itemID] ?? WordScore()
    }

    /// 全データをリセット
    public func resetAll() {
        scores.removeAll()
        saveAsync()
    }

    // MARK: - Persistence
    private func saveAsync() {
        let snapshot = scores
        saveQueue.async { [weak self] in
            guard let self = self else { return }
            do {
                let data = try JSONEncoder().encode(snapshot)
                UserDefaults.standard.set(data, forKey: self.userDefaultsKey)
            } catch {
                print("WordScoreStore save error: \(error)")
            }
        }
    }

    private func load() {
        guard let data = UserDefaults.standard.data(forKey: userDefaultsKey) else { return }
        do {
            let decoded = try JSONDecoder().decode([UUID: WordScore].self, from: data)
            DispatchQueue.main.async {
                self.scores = decoded
            }
        } catch {
            print("WordScoreStore load error: \(error)")
        }
    }
}
