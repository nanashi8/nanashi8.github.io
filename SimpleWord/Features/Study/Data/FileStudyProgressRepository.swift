// FileStudyProgressRepository.swift
// 学習進捗の簡易永続化（JSON）

import Foundation

public protocol StudyProgressRepository {
    func load(id: UUID) -> StudyRecord
    func save(_ record: StudyRecord)
    func loadAll() -> [StudyRecord]
}

/// 永続化: 学習記録を JSON 1ファイルで保存（簡素で安全）
/// - スレッド保護は簡易シリアルキュー
public final class FileStudyProgressRepository: StudyProgressRepository {
    private let queue = DispatchQueue(label: "study.progress.repo")
    private let url: URL
    private var cache: [UUID: StudyRecord] = [:]
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    public init(filename: String = "study_progress.json") {
        let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        self.url = dir.appendingPathComponent(filename)
        self.encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        loadFromDisk()
    }

    public func load(id: UUID) -> StudyRecord {
        return queue.sync {
            if let r = cache[id] { return r }
            let r = StudyRecord(id: id)
            cache[id] = r
            return r
        }
    }

    public func save(_ record: StudyRecord) {
        queue.sync {
            cache[record.id] = record
            saveToDisk()
        }
    }

    public func loadAll() -> [StudyRecord] {
        return queue.sync { Array(cache.values) }
    }

    // MARK: - Disk I/O
    private func loadFromDisk() {
        queue.sync {
            guard FileManager.default.fileExists(atPath: url.path) else { return }
            do {
                let data = try Data(contentsOf: url)
                let dict = try decoder.decode([UUID: StudyRecord].self, from: data)
                self.cache = dict
            } catch {
                // 破損時は新規開始（必要に応じてロギング）
                self.cache = [:]
            }
        }
    }

    private func saveToDisk() {
        do {
            let data = try encoder.encode(cache)
            try data.write(to: url, options: [.atomic])
        } catch {
            // 保存失敗は握りつぶし（将来リトライ等を検討）
        }
    }
}
