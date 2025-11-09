// IDMapMaintenance.swift
// - 何を: IDマップの統計・プリウォーム・エクスポート・パージを提供します。
// - なぜ: 初回遅延の低減、不要データの整理、バックアップしやすさ向上のため。

import Foundation
import CoreData

/// ID マップ（WordIdMap）の保守ユーティリティ。
/// - 何を: 統計取得、プリウォーム（CSVからID事前生成）、エクスポート、古いレコードのパージ
/// - なぜ: UIの初回遅延を減らし、不要なマップを整理し、バックアップを取りやすくするため
final class IDMapMaintenance {
    static let shared = IDMapMaintenance()
    private init() {}

    private let stack = CoreDataStack.shared
    private let keyBuilder = WordKeyBuilder.shared
    private let idProvider = CoreDataWordIDProvider.shared

    // MARK: - Stats
    struct Stats {
        let count: Int
        let earliest: Date?
        let latest: Date?
    }

    /// 登録件数や期間の概況を返す
    func stats() -> Stats {
        let ctx = stack.container.viewContext
        var count = 0
        var earliest: Date? = nil
        var latest: Date? = nil
        ctx.performAndWait {
            let req = NSFetchRequest<NSDictionary>(entityName: "WordIdMap")
            req.resultType = .dictionaryResultType

            // 件数
            let countExpr = NSExpressionDescription()
            countExpr.name = "count"
            countExpr.expression = NSExpression(forFunction: "count:", arguments: [NSExpression(forKeyPath: "hashKey")])
            countExpr.expressionResultType = .integer64AttributeType

            // 最小/最大 createdAt
            let minExpr = NSExpressionDescription()
            minExpr.name = "minCreated"
            minExpr.expression = NSExpression(forFunction: "min:", arguments: [NSExpression(forKeyPath: "createdAt")])
            minExpr.expressionResultType = .dateAttributeType

            let maxExpr = NSExpressionDescription()
            maxExpr.name = "maxCreated"
            maxExpr.expression = NSExpression(forFunction: "max:", arguments: [NSExpression(forKeyPath: "createdAt")])
            maxExpr.expressionResultType = .dateAttributeType

            req.propertiesToFetch = [countExpr, minExpr, maxExpr]
            let dict = (try? ctx.fetch(req).first) ?? [:]
            count = (dict["count"] as? NSNumber)?.intValue ?? 0
            earliest = dict["minCreated"] as? Date
            latest = dict["maxCreated"] as? Date
        }
        return Stats(count: count, earliest: earliest, latest: latest)
    }

    // MARK: - Prewarm
    /// 指定CSVを読み、安定キーからIDを発行してマップに反映（存在すれば更新のみ）。
    @discardableResult
    func prewarm(fromCSV url: URL) throws -> Int {
        let text = try String(contentsOf: url, encoding: .utf8)
        let lines = text.components(separatedBy: .newlines)
        guard !lines.isEmpty else { return 0 }

        // ヘッダ検出
        var header: [String] = []
        var startIndex = 0
        if let first = lines.first(where: { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }) {
            let lower = first.lowercased()
            if lower.contains("term") || lower.contains("meaning") || lower.contains("reading") {
                header = splitCSVLine(first)
                if let idx = lines.firstIndex(of: first) { startIndex = idx + 1 }
            }
        }
        let headerMap: [String: Int] = Dictionary(uniqueKeysWithValues: header.enumerated().map { ($1.lowercased(), $0) })

        var createdOrTouched = 0
        let sourceId = url.lastPathComponent
        for i in startIndex..<lines.count {
            let raw = lines[i]
            let line = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            if line.isEmpty { continue }
            let parts = splitCSVLine(line)
            func valueAt(_ idx: Int) -> String { (idx >= 0 && idx < parts.count) ? unquote(parts[idx]) : "" }
            func valueFor(_ names: [String]) -> String? {
                for n in names { if let idx = headerMap[n], idx < parts.count { return unquote(parts[idx]) } }
                return nil
            }
            let term = valueFor(["term","word","question"]) ?? (parts.count > 0 ? unquote(parts[0]) : "")
            let reading = valueFor(["reading"]) ?? (parts.count > 1 ? unquote(parts[1]) : "")
            let meaning = valueFor(["meaning","definition","translation"]) ?? (parts.count > 2 ? unquote(parts[2]) : "")
            let etym = valueFor(["etymology"]) ?? (parts.count > 3 ? unquote(parts[3]) : "")

            // 発行/更新（lastSeen更新も兼ねる）
            _ = idProvider.idFor(term: term, reading: reading, meaning: meaning, etymology: etym, sourceId: sourceId)
            createdOrTouched += 1
        }
        return createdOrTouched
    }

    /// バンドル/ドキュメントにある既知CSVを一括プリウォーム
    @discardableResult
    func prewarmAllKnownCSVs() -> Int {
        var total = 0
        // Bundle
        let bundleFiles = FileUtils.listBundleCSVFiles()
        for name in bundleFiles {
            let base = name.replacingOccurrences(of: ".csv", with: "")
            if let url = Bundle.main.url(forResource: base, withExtension: "csv") {
                total += (try? prewarm(fromCSV: url)) ?? 0
            }
        }
        // Documents
        if let dir = FileUtils.documentsDirectory {
            let docFiles = FileUtils.listCSVFilesInDocuments()
            for f in docFiles {
                let url = dir.appendingPathComponent(f)
                total += (try? prewarm(fromCSV: url)) ?? 0
            }
        }
        return total
    }

    // MARK: - Export
    /// マッピング全件をCSVとして書き出す
    func exportAll(to url: URL) throws {
        let ctx = stack.container.viewContext
        var rows: [String] = []
        rows.append("hashKey,uuid,sourceId,createdAt,lastSeen")
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        try ctx.performAndWait {
            let req = NSFetchRequest<WordIdMap>(entityName: "WordIdMap")
            req.sortDescriptors = [NSSortDescriptor(key: "createdAt", ascending: true)]
            let all = try ctx.fetch(req)
            for m in all {
                let created = formatter.string(from: m.createdAt)
                let seen = formatter.string(from: m.lastSeen)
                rows.append(joinCSVLine([
                    m.hashKey,
                    m.uuid,
                    m.sourceId ?? "",
                    created,
                    seen
                ]))
            }
        }
        let text = rows.joined(separator: "\n")
        try text.write(to: url, atomically: true, encoding: .utf8)
    }

    // MARK: - Purge
    /// 指定日数より古い lastSeen を持つレコードを削除
    @discardableResult
    func purgeOlderThan(days: Int) throws -> Int {
        let cutoff = Calendar.current.date(byAdding: .day, value: -abs(days), to: Date()) ?? Date.distantPast
        return try purge(before: cutoff)
    }

    @discardableResult
    func purge(before cutoff: Date) throws -> Int {
        let ctx = stack.container.newBackgroundContext()
        ctx.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
        var removed = 0
        try ctx.performAndWait {
            let req = NSFetchRequest<NSManagedObjectID>(entityName: "WordIdMap")
            req.resultType = .managedObjectIDResultType
            req.predicate = NSPredicate(format: "lastSeen < %@", cutoff as NSDate)
            let ids = try ctx.fetch(req)
            for oid in ids { if let obj = try? ctx.existingObject(with: oid) { ctx.delete(obj) } }
            if ctx.hasChanges { try ctx.save(); removed = ids.count }
        }
        return removed
    }

    // MARK: - Local CSV helpers (既存実装と整合)
    private func splitCSVLine(_ line: String) -> [String] {
        var items: [String] = []
        var current = ""
        var insideQuotes = false
        let chars = Array(line)
        var i = 0
        let dq: Character = "\""
        let comma: Character = ","
        while i < chars.count {
            let c = chars[i]
            if c == dq {
                if insideQuotes {
                    if i+1 < chars.count && chars[i+1] == dq { current.append(dq); i += 1 } else { insideQuotes = false }
                } else { insideQuotes = true }
            } else if c == comma && !insideQuotes {
                items.append(current); current = ""
            } else {
                current.append(c)
            }
            i += 1
        }
        items.append(current)
        return items
    }

    private func joinCSVLine(_ fields: [String]) -> String {
        return fields.map { f in
            if f.contains(",") || f.contains("\"") || f.contains("\n") {
                let escaped = f.replacingOccurrences(of: "\"", with: "\"\"")
                return "\"\(escaped)\""
            } else { return f }
        }.joined(separator: ",")
    }

    private func unquote(_ s: String) -> String {
        var str = s.trimmingCharacters(in: .whitespacesAndNewlines)
        if str.hasPrefix("\"") && str.hasSuffix("\"") && str.count >= 2 { str.removeFirst(); str.removeLast() }
        str = str.replacingOccurrences(of: "\"\"", with: "\"")
        return str
    }
}
