// WordScoreStore.swift
// 単語別成績（UUIDごと）の保存/読み込み
// - 何を: 問題集（CSV）ごとに各語の試行回数・正解数・最終学習日時を保存して正答率を算出します。
// - なぜ: 苦手な語を見つけやすくし、復習に活かすため。問題集ごとに学習結果を管理し、リセット可能にするため。

import Foundation
import Combine

/// 単語成績の永続化ストア（問題集別に管理）
/// - シンプルに UserDefaults に JSON エンコードで保存する
/// - ObservableObject で UI に反映される
public final class WordScoreStore: ObservableObject {
    /// 現在アクティブな問題集の UUID -> WordScore
    @Published private(set) var scores: [UUID: WordScore] = [:]
    
    /// 現在ロード中の問題集名
    @Published private(set) var currentCSVName: String? = nil

    /// 全問題集のデータ: CSVName -> [UUID: WordScore]
    private var allScores: [String: [UUID: WordScore]] = [:]
    
    private let userDefaultsKey = "SimpleWord.WordScoreStore.v2"
    private let saveQueue = DispatchQueue(label: "SimpleWord.WordScoreStore.saveQueue", qos: .background)

    public init() {
        loadAll()
    }

    /// 問題集を切り替える（問題集名を指定して対応する学習結果を読み込む）
    public func switchToCSV(_ csvName: String) {
        currentCSVName = csvName
        scores = allScores[csvName] ?? [:]
        print("WordScoreStore: 問題集 '\(csvName)' の学習結果を読み込みました（\(scores.count) 件）")
    }

    /// 指定単語に対する結果を記録する
    public func recordResult(itemID: UUID, correct: Bool) {
        guard let csvName = currentCSVName else {
            print("WordScoreStore: 問題集が選択されていないため、記録できません")
            return
        }
        
        var entry = scores[itemID] ?? WordScore()
        entry.record(correct: correct)
        scores[itemID] = entry
        allScores[csvName] = scores
        saveAsync()
    }

    /// 指定単語の現在のスコアを返す（無ければ初期値）
    public func score(for itemID: UUID) -> WordScore {
        return scores[itemID] ?? WordScore()
    }

    /// 現在の問題集の学習結果をリセット
    public func resetCurrentCSV() {
        guard let csvName = currentCSVName else {
            print("WordScoreStore: 問題集が選択されていないため、リセットできません")
            return
        }
        
        scores.removeAll()
        allScores[csvName] = nil
        saveAsync()
        print("WordScoreStore: 問題集 '\(csvName)' の学習結果をリセットしました")
    }
    
    /// 指定した問題集の学習結果をリセット
    public func reset(csvName: String) {
        allScores[csvName] = nil
        if currentCSVName == csvName {
            scores.removeAll()
        }
        saveAsync()
        print("WordScoreStore: 問題集 '\(csvName)' の学習結果をリセットしました")
    }

    /// 全データをリセット
    public func resetAll() {
        scores.removeAll()
        allScores.removeAll()
        currentCSVName = nil
        saveAsync()
        print("WordScoreStore: 全問題集の学習結果をリセットしました")
    }

    // MARK: - Persistence
    private func saveAsync() {
        let snapshot = allScores
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

    private func loadAll() {
        guard let data = UserDefaults.standard.data(forKey: userDefaultsKey) else {
            // v2形式のデータがない場合、v1形式からの移行を試みる
            migrateFromV1()
            return
        }
        do {
            let decoded = try JSONDecoder().decode([String: [UUID: WordScore]].self, from: data)
            DispatchQueue.main.async {
                self.allScores = decoded
                print("WordScoreStore: \(decoded.count) 個の問題集データを読み込みました")
            }
        } catch {
            print("WordScoreStore load error: \(error)")
            // 読み込み失敗時はv1からの移行を試みる
            migrateFromV1()
        }
    }
    
    /// v1形式（問題集分離なし）からv2形式（問題集別）へのデータ移行
    private func migrateFromV1() {
        let v1Key = "SimpleWord.WordScoreStore.v1"
        guard let data = UserDefaults.standard.data(forKey: v1Key) else { return }
        
        do {
            let v1Scores = try JSONDecoder().decode([UUID: WordScore].self, from: data)
            print("WordScoreStore: v1形式のデータを検出しました（\(v1Scores.count) 件）")
            
            // v1のデータは問題集名が不明なため、"_migrated"という特別な名前で保存
            allScores["_migrated"] = v1Scores
            saveAsync()
            
            print("WordScoreStore: v1データを '_migrated' として移行しました")
        } catch {
            print("WordScoreStore v1 migration error: \(error)")
        }
    }
}
