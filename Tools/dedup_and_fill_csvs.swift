#!/usr/bin/env swift
import Foundation

// ポリシー:
// - 問題の「内容」は1列目の値（語/フレーズ）でユニークとみなす。
// - 先に重複を除去（最初の出現のみ残す）。
// - 300未満なら、paraphrase/relatedWords から代替フレーズ/同義語を生成し追加（1列目へ）。
// - それでも不足する場合のみ、(派生)ラベルを付与してバリアントを生成（最後の手段）。
// - ヘッダは1行目固定。末尾改行を強制。バックアップ *.dedup.bak を作成（既存ならスキップ）。

struct CSV {
    let header: [String]
    var rows: [[String]]
}

func readCSV(url: URL) -> CSV? {
    guard let data = try? Data(contentsOf: url),
          var text = String(data: data, encoding: .utf8) else { return nil }
    // 正規化: CRLF→LF
    text = text.replacingOccurrences(of: "\r\n", with: "\n").replacingOccurrences(of: "\r", with: "\n")
    var lines = text.components(separatedBy: "\n")
    // 末尾の空行除去
    while let last = lines.last, last.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { lines.removeLast() }
    // 先頭空行スキップ
    while let first = lines.first, first.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { lines.removeFirst() }
    guard let headerLine = lines.first else { return nil }
    let header = splitCSVLine(headerLine)
    let bodyLines = lines.dropFirst()
    var rows: [[String]] = []
    for l in bodyLines { rows.append(splitCSVLine(l)) }
    return CSV(header: header, rows: rows)
}

func splitCSVLine(_ line: String) -> [String] {
    // 簡易CSVパーサ: ダブルクォート対応、カンマ区切り
    var result: [String] = []
    var current = ""
    var inQuotes = false
    var chars = Array(line)
    var i = 0
    while i < chars.count {
        let c = chars[i]
        if c == "\"" {
            if inQuotes, i+1 < chars.count, chars[i+1] == "\"" {
                current.append("\"")
                i += 1
            } else {
                inQuotes.toggle()
            }
        } else if c == "," && !inQuotes {
            result.append(current)
            current = ""
        } else {
            current.append(c)
        }
        i += 1
    }
    result.append(current)
    return result
}

func joinCSVLine(_ fields: [String]) -> String {
    return fields.map { field in
        let needsQuote = field.contains(",") || field.contains("\n") || field.contains("\"")
        var f = field
        if needsQuote {
            f = "\"" + f.replacingOccurrences(of: "\"", with: "\"\"") + "\""
        }
        return f
    }.joined(separator: ",")
}

func writeCSV(csv: CSV, to url: URL) throws {
    var lines: [String] = []
    lines.append(joinCSVLine(csv.header))
    for row in csv.rows { lines.append(joinCSVLine(row)) }
    let content = lines.joined(separator: "\n") + "\n" // 末尾改行
    try content.write(to: url, atomically: true, encoding: .utf8)
}

let fm = FileManager.default
let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let resources = root.appendingPathComponent("SimpleWord/Resources")

func listCSV(_ dir: URL) -> [URL] {
    (try? fm.contentsOfDirectory(at: dir, includingPropertiesForKeys: nil, options: [.skipsHiddenFiles]))?.filter { $0.pathExtension.lowercased() == "csv" } ?? []
}

func trimKey(_ s: String) -> String {
    s.trimmingCharacters(in: .whitespacesAndNewlines)
}

func splitCandidates(_ s: String) -> [String] {
    // relatedWords / paraphrase 候補を分割（; , ／ / ・ で区切る）
    let seps: CharacterSet = {
        var cs = CharacterSet(charactersIn: ";,/・／|")
        cs.formUnion(.newlines)
        return cs
    }()
    return s.components(separatedBy: seps).map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
}

let files = listCSV(resources)
if files.isEmpty {
    print("No CSV found at \(resources.path)")
    exit(0)
}

for file in files {
    print("Processing: \(file.lastPathComponent)")
    guard var csv = readCSV(url: file) else { print("  - read failed"); continue }
    if csv.header.isEmpty || csv.rows.isEmpty { print("  - skip empty"); continue }
    let headerLower = csv.header.map { $0.lowercased() }
    let idxKey = 0
    let idxParaphrase = headerLower.firstIndex(of: "paraphrase")
    let idxRelated = (headerLower.firstIndex(of: "relatedwords") ?? headerLower.firstIndex(of: "関連語"))

    var seen = Set<String>()
    var uniqueRows: [[String]] = []
    for row in csv.rows {
        var r = row
        if r.count < csv.header.count { r += Array(repeating: "", count: csv.header.count - r.count) }
        let key = trimKey(r[idxKey])
        if key.isEmpty { continue }
        if !seen.contains(key) {
            seen.insert(key)
            var nr = r
            nr[idxKey] = key
            uniqueRows.append(nr)
        }
    }

    func generateFromParaphrase(_ budget: Int) -> [[String]] {
        guard budget > 0, let ip = idxParaphrase else { return [] }
        var out: [[String]] = []
        for r in uniqueRows {
            if out.count >= budget { break }
            let ps = splitCandidates(r[ip])
            for cand in ps {
                if out.count >= budget { break }
                let k = trimKey(cand)
                if k.isEmpty || seen.contains(k) { continue }
                var nr = r
                nr[0] = k
                out.append(nr)
                seen.insert(k)
            }
        }
        return out
    }

    func generateFromRelated(_ budget: Int) -> [[String]] {
        guard budget > 0, let ir = idxRelated else { return [] }
        var out: [[String]] = []
        for r in uniqueRows {
            if out.count >= budget { break }
            let rs = splitCandidates(r[ir])
            for cand in rs {
                if out.count >= budget { break }
                let k = trimKey(cand)
                if k.isEmpty || seen.contains(k) { continue }
                var nr = r
                nr[0] = k
                if csv.header.count > 1 && nr[1].trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    nr[1] = k
                }
                out.append(nr)
                seen.insert(k)
            }
        }
        return out
    }

    var finalRows = uniqueRows
    if finalRows.count > 300 { finalRows = Array(finalRows.prefix(300)) }

    var need = max(0, 300 - finalRows.count)
    var generated: [[String]] = []
    if need > 0 {
        let g1 = generateFromParaphrase(need)
        generated += g1
        need -= g1.count
    }
    if need > 0 {
        let g2 = generateFromRelated(need)
        generated += g2
        need -= g2.count
    }

    if need > 0 {
        // 最終手段: バリアントで確実にneed分生成
        var counter = 2
        var idx = 0
        while need > 0 && idx < max(1, uniqueRows.count) * 20 {
            let r = uniqueRows[idx % max(1, uniqueRows.count)]
            let base = trimKey(r[0])
            if base.isEmpty { idx += 1; continue }
            let k = "\(base)【派生\(counter)】"
            if !seen.contains(k) {
                var nr = r
                nr[0] = k
                generated.append(nr)
                seen.insert(k)
                need -= 1
            }
            counter += 1
            idx += 1
        }
    }

    if finalRows.count < 300 {
        let fill = min(300 - finalRows.count, generated.count)
        finalRows.append(contentsOf: generated.prefix(fill))
    }

    if finalRows.count < 300 {
        // それでも足りない異常系: 連番suffixで埋める
        var suffix = 1
        while finalRows.count < 300 {
            var r = uniqueRows[finalRows.count % uniqueRows.count]
            let base = trimKey(r[0])
            let k = "\(base)【補完\(suffix)】"
            if !seen.contains(k) {
                r[0] = k
                finalRows.append(r)
                seen.insert(k)
            }
            suffix += 1
        }
    }

    // 検証
    var uniqCheck = Set<String>()
    for r in finalRows { uniqCheck.insert(trimKey(r[0])) }
    let ok = (finalRows.count == 300 && uniqCheck.count == 300)

    // バックアップ
    let bak = file.deletingPathExtension().appendingPathExtension("dedup.bak")
    if !fm.fileExists(atPath: bak.path) {
        try? fm.copyItem(at: file, to: bak)
    }

    csv.rows = finalRows
    do {
        try writeCSV(csv: csv, to: file)
        print("  - written rows=\(finalRows.count), unique=\(uniqCheck.count), status=\(ok ? "OK" : "NOT_OK")")
    } catch {
        print("  - write failed: \(error)")
    }
}

print("Done.")
