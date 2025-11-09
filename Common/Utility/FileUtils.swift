// FileUtils.swift
// ファイル操作ユーティリティ
// - 何を: Bundle/Document内のCSVの列挙・作成・削除・改名、インポート/エクスポート、CSV行の結合/分割を提供します。
// - なぜ: 画面から安全にCSVを扱えるようにし、重複名やバックアップへも配慮するため。

import Foundation
import CryptoKit

enum FileUtils {
    // アプリのドキュメントディレクトリURL
    nonisolated static var documentsDirectory: URL? {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first
    }

    // Bundle 内の CSV ファイル一覧（ファイル名のみ）
    nonisolated static func listBundleCSVFiles() -> [String] {
        // Bundle.pathsForResources(ofType:inDirectory:) を使って列挙
        guard let paths = Bundle.main.paths(forResourcesOfType: "csv", inDirectory: nil) as [String]? else { return [] }
        return paths.map { URL(fileURLWithPath: $0).lastPathComponent }
    }

    // Documents 内の .csv ファイル一覧（ファイル名のみ）
    nonisolated static func listCSVFilesInDocuments() -> [String] {
        guard let dir = documentsDirectory else { return [] }
        do {
            let files = try FileManager.default.contentsOfDirectory(at: dir, includingPropertiesForKeys: nil)
            return files.filter { $0.pathExtension.lowercased() == "csv" }.map { $0.lastPathComponent }
        } catch {
            return []
        }
    }

    // Bundle 内の CSV を文字列で読み込む（編集前に確認する際に利用）
    nonisolated static func readBundleCSVText(named name: String) -> String? {
        guard let url = Bundle.main.url(forResource: name, withExtension: "csv") else { return nil }
        return try? String(contentsOf: url, encoding: .utf8)
    }

    // Documents に空の CSV ファイルを新規作成（ヘッダ行を追加）
    nonisolated static func createCSVInDocuments(named name: String) throws -> URL {
        guard let dir = documentsDirectory else { throw NSError(domain: "FileUtils", code: 1, userInfo: [NSLocalizedDescriptionKey: "Documents not available"]) }
        var filename = name
        if !filename.hasSuffix(".csv") { filename += ".csv" }
        let url = dir.appendingPathComponent(filename)
        if FileManager.default.fileExists(atPath: url.path) {
            throw NSError(domain: "FileUtils", code: 2, userInfo: [NSLocalizedDescriptionKey: "File already exists"])
        }
        let header = "term,reading,meaning,etymology,relatedWords,relatedFields,difficulty\n"
        try header.write(to: url, atomically: true, encoding: .utf8)
        return url
    }

    nonisolated static func deleteCSVInDocuments(named name: String) throws {
        guard let dir = documentsDirectory else { return }
        var filename = name
        if !filename.hasSuffix(".csv") { filename += ".csv" }
        let url = dir.appendingPathComponent(filename)
        try FileManager.default.removeItem(at: url)
    }

    nonisolated static func renameCSVInDocuments(oldName: String, newName: String) throws {
        guard let dir = documentsDirectory else { return }
        var oldFile = oldName
        if !oldFile.hasSuffix(".csv") { oldFile += ".csv" }
        var newFile = newName
        if !newFile.hasSuffix(".csv") { newFile += ".csv" }
        let oldURL = dir.appendingPathComponent(oldFile)
        let newURL = dir.appendingPathComponent(newFile)
        try FileManager.default.moveItem(at: oldURL, to: newURL)
    }

    // Bundle にあるリソース（例: 高校単語.csv）を Documents にコピーして編集可能にする
    nonisolated static func copyBundleCSVToDocuments(named resourceName: String) throws -> URL {
        guard let bundleURL = Bundle.main.url(forResource: resourceName, withExtension: "csv") else {
            throw NSError(domain: "FileUtils", code: 3, userInfo: [NSLocalizedDescriptionKey: "Resource not found in bundle"])
        }
        guard let dir = documentsDirectory else { throw NSError(domain: "FileUtils", code: 1, userInfo: nil) }
        let destURL = dir.appendingPathComponent(bundleURL.lastPathComponent)
        if FileManager.default.fileExists(atPath: destURL.path) {
            // 上書きせずにそのまま返す
            return destURL
        }
        try FileManager.default.copyItem(at: bundleURL, to: destURL)
        return destURL
    }

    // CSV を文字列として保存
    nonisolated static func saveCSVText(_ text: String, to url: URL) throws {
        try text.write(to: url, atomically: true, encoding: .utf8)
    }

    // MARK: - New: Unique name generator for Documents
    /// Documentsに同名ファイルがある場合に、重複しないファイル名を返す
    /// 例: words.csv -> words_yyyyMMdd_HHmmss.csv（タイムスタンプ）
    nonisolated static func uniqueDocumentsFilename(original: String, now: Date = Date()) -> String {
        guard let dir = documentsDirectory else { return original }
        let fm = FileManager.default
        let base = (original as NSString).deletingPathExtension
        let ext = (original as NSString).pathExtension
        func exists(_ name: String) -> Bool { fm.fileExists(atPath: dir.appendingPathComponent(name).path) }
        if !exists(original) { return original }
        // timestamped candidate
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyyMMdd_HHmmss"
        let ts = fmt.string(from: now)
        let candidate = ext.isEmpty ? "\(base)_\(ts)" : "\(base)_\(ts).\(ext)"
        if !exists(candidate) { return candidate }
        // fallback: increment
        var i = 1
        while true {
            let name = ext.isEmpty ? "\(base) (\(i))" : "\(base) (\(i)).\(ext)"
            if !exists(name) { return name }
            i += 1
        }
    }

    // MARK: - New: Import CSV from external URL into Documents
    /// ファイルURLからDocumentsへCSVをインポート（同名は自動リネーム）
    @discardableResult
    nonisolated static func importCSVFromURL(_ url: URL) throws -> URL {
        guard let dir = documentsDirectory else {
            throw NSError(domain: "FileUtils", code: 10, userInfo: [NSLocalizedDescriptionKey: "Documents not available"]) }
        let originalName = url.lastPathComponent
        let name = uniqueDocumentsFilename(original: originalName)
        let dest = dir.appendingPathComponent(name)
        // 既存ならユニーク名になっている想定。ファイルコピーを実行。
        try FileManager.default.copyItem(at: url, to: dest)
        return dest
    }

    // MARK: - ID injection helpers
    /// CSV のヘッダに id カラムが存在するかを判定する（大文字小文字を無視）
    nonisolated static func csvHasID(at url: URL) -> Bool {
        guard let text = try? String(contentsOf: url, encoding: .utf8) else { return false }
        let lines = text.components(separatedBy: .newlines)
        guard let header = lines.first?.trimmingCharacters(in: .whitespacesAndNewlines), !header.isEmpty else { return false }
        let fields = splitCSVLine(header)
        return fields.map { $0.lowercased() }.contains("id")
    }

    /// CSV に id 列を追加して上書き保存する（既に id があれば何もしない）。バックアップ (.bak) を作成。
    /// - Parameter random: true のときランダム UUID を採用、false のとき term+meaning から決定論的 UUID を生成
    nonisolated static func injectIDs(toCSVAt url: URL, random: Bool = false) throws {
        let text = try String(contentsOf: url, encoding: .utf8)
        var lines = text.components(separatedBy: .newlines)
        guard !lines.isEmpty else { return }
        let headerLine = lines.removeFirst()
        var headerFields = splitCSVLine(headerLine)
        let lower = headerFields.map { $0.lowercased() }
        if lower.contains("id") {
            // already has id
            return
        }

        // backup
        let backupURL = url.appendingPathExtension("bak")
        try? FileManager.default.removeItem(at: backupURL)
        try FileManager.default.copyItem(at: url, to: backupURL)

        // insert id as first column
        headerFields.insert("id", at: 0)
        var outLines: [String] = [joinCSVLine(headerFields)]

        // detect term/meaning indices from original header (before id insertion)
        let origLower = headerFields.dropFirst().map { $0.lowercased() }
        func idx(of names: [String]) -> Int? {
            for (j,h) in origLower.enumerated() {
                if names.contains(h) { return j }
            }
            return nil
        }
        let termIdx = idx(of: ["term","word","question"])
        let meaningIdx = idx(of: ["meaning","definition","translation","answer"])

        for rawLine in lines {
            let line = rawLine.trimmingCharacters(in: .whitespacesAndNewlines)
            if line.isEmpty { continue }
            let cols = splitCSVLine(line)
            var idStr: String
            if random {
                idStr = UUID().uuidString
            } else {
                let termVal = (termIdx != nil && termIdx! < cols.count) ? unquote(cols[termIdx!]) : ""
                let meaningVal = (meaningIdx != nil && meaningIdx! < cols.count) ? unquote(cols[meaningIdx!]) : ""
                idStr = deterministicUUID(from: termVal + "|" + meaningVal).uuidString
            }
            var newCols: [String] = [idStr]
            newCols.append(contentsOf: cols)
            outLines.append(joinCSVLine(newCols))
        }

        let out = outLines.joined(separator: "\n")
        try out.write(to: url, atomically: true, encoding: .utf8)
    }

    // MARK: - New: Write QuestionItems to CSV file
    /// QuestionItem配列をCSVとして保存（固定ヘッダ順）
    /// 列: term,reading,meaning,etymology,relatedWords,relatedFields,difficulty
    nonisolated static func writeQuestionItems(_ items: [QuestionItem], to url: URL) throws {
        var lines: [String] = []
        lines.append("term,reading,meaning,etymology,relatedWords,relatedFields,difficulty")
        for it in items {
            let fields = [
                it.term,
                it.reading,
                it.meaning,
                it.etymology,
                it.relatedWords.joined(separator: ";"),
                it.relatedFields.joined(separator: ";"),
                it.difficulty
            ]
            lines.append(joinCSVLine(fields))
        }
        let text = lines.joined(separator: "\n")
        try text.write(to: url, atomically: true, encoding: .utf8)
    }

    // simple CSV helpers (handles quoted fields and escaped quotes)
    nonisolated private static func splitCSVLine(_ line: String) -> [String] {
        var fields: [String] = []
        var current = ""
        var insideQuotes = false
        let chars = Array(line)
        var i = 0
        // use Character constants to avoid single-quote literal complaints
        let dq: Character = "\""
        let comma: Character = ","
        while i < chars.count {
            let c = chars[i]
            if c == dq {
                if insideQuotes {
                    if i+1 < chars.count && chars[i+1] == dq {
                        current.append(dq)
                        i += 1
                    } else {
                        insideQuotes = false
                    }
                } else {
                    insideQuotes = true
                }
            } else if c == comma && !insideQuotes {
                fields.append(current)
                current = ""
            } else {
                current.append(c)
            }
            i += 1
        }
        fields.append(current)
        return fields
    }

    nonisolated private static func joinCSVLine(_ fields: [String]) -> String {
        return fields.map { field in
            if field.contains(",") || field.contains("\"") || field.contains("\n") {
                let escaped = field.replacingOccurrences(of: "\"", with: "\"\"")
                return "\"\(escaped)\""
            } else {
                return field
            }
        }.joined(separator: ",")
    }

    nonisolated private static func unquote(_ s: String) -> String {
        var str = s.trimmingCharacters(in: .whitespacesAndNewlines)
        if str.hasPrefix("\"") && str.hasSuffix("\"") && str.count >= 2 {
            str.removeFirst()
            str.removeLast()
        }
        str = str.replacingOccurrences(of: "\"\"", with: "\"")
        return str
    }

    nonisolated private static func deterministicUUID(from input: String) -> UUID {
        let digest = SHA256.hash(data: Data(input.utf8))
        let bytes = Array(digest.prefix(16))
        return UUID(uuid: (
            bytes[0], bytes[1], bytes[2], bytes[3],
            bytes[4], bytes[5], bytes[6], bytes[7],
            bytes[8], bytes[9], bytes[10], bytes[11],
            bytes[12], bytes[13], bytes[14], bytes[15]
        ))
    }
}
