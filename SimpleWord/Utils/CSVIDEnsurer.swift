// CSVIDEnsurer.swift
// CSVへ uuid / id_hash を安全に付与
// - 何を: 足りない列を検出して付与し、原子置換でファイルを更新します（.bakを作成）。
// - なぜ: 後続の同期/移行やデータの一意性を保つため。

import Foundation

/// CSV に `uuid` と `id_hash` を付与する。既に存在すればスキップ。
/// - 挙動: バックアップを作成し、原子置換で置き換える。ヘッダがあれば末尾に列名を追加。
public final class CSVIDEnsurer {
    public init() {}

    /// CSV を検査・必要なら付与する。
    /// - Parameters:
    ///   - url: 対象 CSV の URL
    ///   - deterministic: true = id_hash を term+meaning+etymology で生成
    /// - Returns: 更新後の URL（成功）または nil（失敗）
    public func ensureIDsIfMissing(at url: URL, deterministic: Bool = true) -> URL? {
        guard let text = try? String(contentsOf: url, encoding: .utf8) else { return nil }
        let lines = text.components(separatedBy: .newlines)
        guard !lines.isEmpty else { return url }

        // find first non-empty line as header candidate
        guard let firstLineIndex = lines.firstIndex(where: { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }) else { return url }
        let firstLine = lines[firstLineIndex]
        let headerExists = looksLikeHeader(firstLine)

        var headerFields: [String] = []
        var startIndex = 0
        if headerExists {
            headerFields = splitCSVLine(firstLine)
            startIndex = firstLineIndex + 1
        }

        // detect whether uuid / id_hash already present
        let lowerHeaders = headerFields.map { $0.lowercased() }
        let hasUUIDHeader = lowerHeaders.contains(where: { $0 == "uuid" || $0 == "id" })
        let hasHashHeader = lowerHeaders.contains(where: { $0 == "id_hash" || $0 == "sha256" || $0 == "hash" })

        // quick check if every data row already has uuid and id_hash (if headers present)
        if headerExists && hasUUIDHeader && hasHashHeader {
            // Assume already complete — do a quick sanity check: at least one row has non-empty values
            var allBlank = true
            for i in startIndex..<lines.count {
                let line = lines[i].trimmingCharacters(in: .whitespacesAndNewlines)
                if line.isEmpty { continue }
                let cols = splitCSVLine(line)
                // if both headers present, find values
                func value(for names: [String]) -> String? {
                    for (idx,h) in lowerHeaders.enumerated() {
                        if names.contains(h), idx < cols.count {
                            return unquote(cols[idx])
                        }
                    }
                    return nil
                }
                if let u = value(for: ["uuid","id"]), !u.isEmpty, let _ = UUID(uuidString: u) {
                    allBlank = false
                    break
                }
                if let h = value(for: ["id_hash","sha256","hash"]), !h.isEmpty {
                    allBlank = false
                    break
                }
            }
            if !allBlank {
                // reasonable assumption that file already has ids
                return url
            }
        }

        // Prepare output lines
        var outLines: [String] = []
        if headerExists {
            var newHeader = headerFields
            if !hasUUIDHeader {
                newHeader.append("uuid")
            }
            if !hasHashHeader {
                newHeader.append("id_hash")
            }
            outLines.append(joinCSVLine(newHeader))
        }

        // process rows
        for i in startIndex..<lines.count {
            let raw = lines[i]
            let line = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            if line.isEmpty { continue }
            let cols = splitCSVLine(line)
            // extract term, meaning, etymology if available
            let term = cols.count > 0 ? unquote(cols[0]) : ""
            _ = cols.count > 1 ? unquote(cols[1]) : ""
            let meaning = cols.count > 2 ? unquote(cols[2]) : ""
            let etym = cols.count > 3 ? unquote(cols[3]) : ""

            // existing uuid/hash extraction if headers existed but maybe blank
            var existingUUIDString: String? = nil
            if headerExists && hasUUIDHeader {
                for (idx,h) in lowerHeaders.enumerated() {
                    if (h == "uuid" || h == "id"), idx < cols.count {
                        let v = unquote(cols[idx])
                        if !v.isEmpty { existingUUIDString = v }
                        break
                    }
                }
            } else if !headerExists {
                // if no header but row has extra columns beyond expected 7, try to detect uuid/hash at end
                if cols.count >= 8 {
                    let last = unquote(cols[cols.count - 1])
                    if UUID(uuidString: last) != nil {
                        existingUUIDString = last
                    }
                }
            }

            var uuidToUse: String
            if let existing = existingUUIDString, !existing.isEmpty {
                uuidToUse = existing
            } else {
                uuidToUse = IDFactory.makeUUID()
            }

            var hashToUse: String
            if headerExists && hasHashHeader {
                var found: String? = nil
                for (idx,h) in lowerHeaders.enumerated() {
                    if ["id_hash","sha256","hash"].contains(h), idx < cols.count {
                        let v = unquote(cols[idx])
                        if !v.isEmpty { found = v; break }
                    }
                }
                if let f = found { hashToUse = f } else {
                    hashToUse = deterministicHash(term: term, meaning: meaning, etymology: etym)
                }
            } else {
                // no header hash present — compute deterministic
                hashToUse = deterministicHash(term: term, meaning: meaning, etymology: etym)
            }

            // Build new row: keep original columns, append missing uuid/hash if they were not part of header
            var newCols = cols
            // If headers exist, we appended header names earlier; ensure positions align: append uuid/hash only if header didn't have them
            if headerExists {
                if !hasUUIDHeader { newCols.append(uuidToUse) }
                if !hasHashHeader { newCols.append(hashToUse) }
            } else {
                // no header: append both (even if original rows had uuid detected, ensure it remains)
                // but avoid duplicating if original already had uuid at end
                if existingUUIDString == nil && !uuidToUse.isEmpty { newCols.append(uuidToUse) }
                // append hash
                newCols.append(hashToUse)
            }

            outLines.append(joinCSVLine(newCols))
        }

        let newCSV = outLines.joined(separator: "\n")

        // atomic replace with backup using FileManager.replaceItemAt
        let fm = FileManager.default
        let dir = url.deletingLastPathComponent()
        let tempURL = dir.appendingPathComponent(".")
            .appendingPathComponent(UUID().uuidString)
        do {
            // write temp
            try newCSV.data(using: .utf8)?.write(to: tempURL, options: .atomic)

            // Create a backup if not exists
            let backupURL = url.appendingPathExtension("bak")
            if !fm.fileExists(atPath: backupURL.path) {
                do { try fm.copyItem(at: url, to: backupURL) } catch { /* ignore backup failure */ }
            }

            // Replace original: remove original then move temp into place
            do {
                try fm.removeItem(at: url)
            } catch {
                // If remove fails, attempt to continue (may be because file doesn't exist)
            }
            try fm.moveItem(at: tempURL, to: url)
            return url
        } catch {
            // fallback: try to write directly (atomic)
            do {
                try newCSV.data(using: .utf8)?.write(to: url, options: .atomic)
                return url
            } catch {
                return nil
            }
        }
    }

    // deterministic hash wrapper
    private func deterministicHash(term: String, meaning: String, etymology: String) -> String {
        return IDFactory.makeDeterministicHash(term: term, meaning: meaning, etymology: etymology)
    }

    // --- Simple CSV helpers (use existing project's simple parser semantics) ---
    private func splitCSVLine(_ line: String) -> [String] {
        var fields: [String] = []
        var current = ""
        var insideQuotes = false
        let chars = Array(line)
        var i = 0
        // Use Character constants for comparisons to avoid single-quote literal issues
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

    private func joinCSVLine(_ fields: [String]) -> String {
        return fields.map { field in
            if field.contains(",") || field.contains("\"") || field.contains("\n") {
                let escaped = field.replacingOccurrences(of: "\"", with: "\"\"")
                return "\"\(escaped)\""
            } else {
                return field
            }
        }.joined(separator: ",")
    }

    private func unquote(_ s: String) -> String {
        var str = s.trimmingCharacters(in: .whitespacesAndNewlines)
        if str.hasPrefix("\"") && str.hasSuffix("\"") && str.count >= 2 {
            str.removeFirst(); str.removeLast()
        }
        str = str.replacingOccurrences(of: "\"\"", with: "\"")
        return str
    }

    private func looksLikeHeader(_ line: String) -> Bool {
        let lower = line.lowercased()
        let keywords = ["term","word","meaning","reading","etymology"]
        let hasLetters = lower.rangeOfCharacter(from: .letters) != nil
        return hasLetters && keywords.contains(where: { lower.contains($0) })
    }
}
