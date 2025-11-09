#!/usr/bin/env swift
import Foundation

// Quick standalone CSV check to validate CSVLoader behavior without Xcode/simulator.
// It uses parsing logic similar to CSVLoader.load(from:) to print relatedFields and relatedWords for the first row.

let path = "./SimpleWord/Resources/中学英熟語.csv"
let url = URL(fileURLWithPath: FileManager.default.currentDirectoryPath).appendingPathComponent(path)

func splitCSVLine(_ line: String) -> [String] {
    var items: [String] = []
    var current = ""
    var insideQuotes = false
    let chars = Array(line)
    var i = 0
    while i < chars.count {
        let ch = chars[i]
        if ch == Character("\"") {
            insideQuotes.toggle()
            current.append(ch)
        } else if ch == Character(",") && !insideQuotes {
            items.append(current)
            current = ""
        } else {
            current.append(ch)
        }
        i += 1
    }
    items.append(current)
    return items
}

func unquote(_ s: String) -> String {
    var str = s.trimmingCharacters(in: .whitespacesAndNewlines)
    if str.hasPrefix("\"") && str.hasSuffix("\"") && str.count >= 2 {
        str.removeFirst()
        str.removeLast()
    }
    str = str.replacingOccurrences(of: "\"\"", with: "\"")
    return str
}

func loadFirstRow(_ url: URL) -> (relatedFields: [String], relatedWords: [String])? {
    guard let text = try? String(contentsOf: url, encoding: .utf8) else { return nil }
    var lines = text.components(separatedBy: .newlines)
    guard let firstNonEmpty = lines.first(where: { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }) else { return nil }

    // detect header (english or japanese keywords)
    var headerFields: [String] = []
    let lower = firstNonEmpty.lowercased()
    let headerCandidates = ["term", "word", "question", "meaning", "reading", "語句", "意味", "読み", "読み方", "単語"]
    var found = false
    for key in headerCandidates {
        if lower.contains(key) { found = true; break }
    }
    if found {
        headerFields = splitCSVLine(firstNonEmpty)
        if let idx = lines.firstIndex(of: firstNonEmpty) { lines.remove(at: idx) }
    }

    var headerIndexMap: [String: Int] = [:]
    for (i, h) in headerFields.enumerated() {
        headerIndexMap[h.lowercased()] = i
    }
    let hasHeader = !headerFields.isEmpty

    guard let raw = lines.first(where: { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }) else { return nil }
    let parts = splitCSVLine(raw)

    func valueForHeader(names: [String]) -> String? {
        for name in names {
            if let idx = headerIndexMap[name.lowercased()], idx < parts.count {
                return unquote(parts[idx])
            }
        }
        return nil
    }

    let relatedWordsCandidates = ["relatedwords", "related_words", "relatedword", "related_word", "related", "related words", "関連語", "paraphrase", "paraphrases", "synonyms"]
    let relatedWordsCSV: String
    if let v = valueForHeader(names: relatedWordsCandidates) {
        relatedWordsCSV = v
    } else if !hasHeader {
        relatedWordsCSV = parts.count > 4 ? unquote(parts[4]) : ""
    } else {
        relatedWordsCSV = ""
    }

    let relatedFieldsCandidates = ["relatedfields", "related_fields", "relatedfield", "related_field", "fields", "field", "related fields", "category", "categories", "カテゴリ", "カテゴリー", "分野", "関連分野"]
    let relatedFieldsCSV: String
    if let v = valueForHeader(names: relatedFieldsCandidates) {
        relatedFieldsCSV = v
    } else if !hasHeader {
        relatedFieldsCSV = parts.count > 5 ? unquote(parts[5]) : ""
    } else {
        relatedFieldsCSV = ""
    }

    let relatedWords = relatedWordsCSV.split(separator: ";").map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
    let relatedFields = relatedFieldsCSV.split(separator: ";").map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
    return (relatedFields, relatedWords)
}

if let res = loadFirstRow(url) {
    print("relatedFields:\n", res.relatedFields)
    print("relatedWords:\n", res.relatedWords)
} else {
    print("Failed to load or parse CSV at \(url.path)")
}
