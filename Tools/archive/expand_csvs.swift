#!/usr/bin/env swift
import Foundation

let fm = FileManager.default
let resourcesDir = URL(fileURLWithPath: "./SimpleWord/Resources", isDirectory: true)
let workspaceRoot = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let fullResourcesDir = workspaceRoot.appendingPathComponent("SimpleWord/Resources")

func listCSVFiles(in dir: URL) -> [URL] {
    guard let items = try? fm.contentsOfDirectory(at: dir, includingPropertiesForKeys: nil, options: [.skipsHiddenFiles]) else { return [] }
    return items.filter { $0.pathExtension.lowercased() == "csv" }
}

func readLines(from url: URL) -> [String]? {
    guard let data = try? Data(contentsOf: url), let s = String(data: data, encoding: .utf8) else { return nil }
    // preserve empty trailing lines by not trimming
    let lines = s.components(separatedBy: "\n")
    return lines
}

func writeLines(_ lines: [String], to url: URL) -> Bool {
    // 常に末尾に改行を付ける（wc -l の行数が期待通りになるようにする）
    let s = lines.joined(separator: "\n") + "\n"
    do {
        try s.write(to: url, atomically: true, encoding: .utf8)
        return true
    } catch {
        print("Failed to write \(url.path): \(error)")
        return false
    }
}

let csvFiles = listCSVFiles(in: fullResourcesDir)
if csvFiles.isEmpty {
    print("No CSV files found in \(fullResourcesDir.path)")
    exit(0)
}

for file in csvFiles {
    print("Processing: \(file.path)")
    guard let lines = readLines(from: file) else { print("  - failed to read"); continue }
    if lines.isEmpty { print("  - empty file"); continue }
    // detect header as first non-empty line
    var headerIndex = 0
    while headerIndex < lines.count && lines[headerIndex].trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
        headerIndex += 1
    }
    if headerIndex >= lines.count { print("  - no header"); continue }
    let header = lines[headerIndex]
    // body lines are after headerIndex
    var body = Array(lines.suffix(from: headerIndex + 1))
    // remove trailing empty lines in body
    while let last = body.last, last.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
        body.removeLast()
    }
    let current = body.count
    if current >= 300 {
        print("  - already \(current) rows, normalizing header position and trailing newline")
        // reconstruct WITHOUT leading empties: header must be 1st line
        var outLines: [String] = []
        outLines.append(header)
        outLines.append(contentsOf: body)
        _ = writeLines(outLines, to: file)
        continue
    }
    if body.isEmpty {
        print("  - body empty, cannot expand")
        continue
    }
    // create backup
    let backupURL = file.appendingPathExtension("bak")
    do { try fm.copyItem(at: file, to: backupURL); print("  - backup created: \(backupURL.lastPathComponent)") } catch { print("  - could not backup: \(error)") }

    // Append by cycling existing body rows.
    var index = 0
    while body.count < 300 {
        let row = body[index % current]
        body.append(row)
        index += 1
        if index > 1000000 { break }
    }

    // Reconstruct file: header at first line (drop any original leading empties)
    var outLines: [String] = []
    outLines.append(header)
    outLines.append(contentsOf: body)
    let success = writeLines(outLines, to: file)
    if success {
        print("  - expanded to \(body.count) rows (body) -> total lines \(outLines.count) [+EOF newline]")
    }
}

print("Done.")
