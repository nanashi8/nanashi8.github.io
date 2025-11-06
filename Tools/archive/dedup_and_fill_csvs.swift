#!/usr/bin/env swift
import Foundation

struct Row: Hashable {
    let term: String
    let reading: String
    let meaning: String
    let etymology: String
}

func splitCSVLine(_ line: String) -> [String] {
    var items: [String] = []
    var current = ""
    var insideQuotes = false
    let chars = Array(line)
    var i = 0

    // 明示的に Character を使って比較・append する
    let quoteChar: Character = "\""
    let commaChar: Character = ","

    while i < chars.count {
        let ch = chars[i]
        if ch == quoteChar {
            if insideQuotes {
                // lookahead for escaped quote
                if i+1 < chars.count && chars[i+1] == quoteChar {
                    current.append(quoteChar)
                    i += 1
                } else {
                    insideQuotes = false
                }
            } else {
                insideQuotes = true
            }
        } else if ch == commaChar && !insideQuotes {
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

func validateCSV(at path: String) {
    let url = URL(fileURLWithPath: path)
    guard let text = try? String(contentsOf: url, encoding: .utf8) else { print("[FAIL] Read: \(path)"); return }
    var lines = text.components(separatedBy: .newlines)
    guard let header = lines.first(where: { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }) else { print("[FAIL] Empty: \(path)"); return }
    let headerFields = splitCSVLine(header).map { unquote($0) }
    // minimal header check: expect 7 columns, must contain 語句/読み/意味
    let expected = ["語句","読み","意味","語源等解説","関連語","関連分野","難易度"]
    let okHeader = headerFields.count == expected.count && Set(headerFields) == Set(expected)
    if !okHeader { print("[WARN] Header mismatch in \(path): \(headerFields)") }
    if let idx = lines.firstIndex(of: header) { lines.remove(at: idx) }

    var set = Set<Row>()
    var dup: [Row] = []
    var count = 0
    for raw in lines {
        let line = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        if line.isEmpty { continue }
        let cols = splitCSVLine(line).map { unquote($0) }
        if cols.count < 7 { print("[WARN] Short row (cols=\(cols.count)) in \(path): \(cols)"); continue }
        let r = Row(term: cols[0], reading: cols[1], meaning: cols[2], etymology: cols[3])
        if set.contains(r) { dup.append(r) } else { set.insert(r) }
        count += 1
    }
    print("[OK] \(url.lastPathComponent): rows=\(count), duplicates=\(dup.count)")
    if !dup.isEmpty {
        for d in dup.prefix(5) { print("  DUP:", d) }
    }
}

let root = FileManager.default.currentDirectoryPath
let base = root + "/SimpleWord/Resources"
let files = ["中学英単語.csv","中学英熟語.csv","中学英会話.csv","中学古文単語.csv","中学人名.csv"]
for f in files { validateCSV(at: base + "/" + f) }
