import Foundation
import CryptoKit

enum Mode { case deterministic, random }

func deterministicUUID(from input: String) -> UUID {
    let digest = SHA256.hash(data: Data(input.utf8))
    let bytes = Array(digest.prefix(16))
    return UUID(uuid: (
        bytes[0], bytes[1], bytes[2], bytes[3],
        bytes[4], bytes[5], bytes[6], bytes[7],
        bytes[8], bytes[9], bytes[10], bytes[11],
        bytes[12], bytes[13], bytes[14], bytes[15]
    ))
}

func idHashHex(from input: String) -> String {
    // Return first 16 bytes of SHA256 as hex (32 hex characters)
    let digest = SHA256.hash(data: Data(input.utf8))
    return digest.prefix(16).map { String(format: "%02x", $0) }.joined()
}

func splitCSVLine(_ line: String) -> [String] {
    var fields: [String] = []
    var current = ""
    var insideQuotes = false
    let chars = Array(line)
    var i = 0
    let dq: Character = "\"" // double-quote character
    let comma: Character = ","
    while i < chars.count {
        let c = chars[i]
        if c == dq {
            if insideQuotes {
                if i+1 < chars.count && chars[i+1] == dq {
                    current.append("\"")
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

func joinCSVLine(_ fields: [String]) -> String {
    return fields.map { field in
        if field.contains(",") || field.contains("\"") || field.contains("\n") {
            let escaped = field.replacingOccurrences(of: "\"", with: "\"\"")
            return "\"\(escaped)\""
        } else {
            return field
        }
    }.joined(separator: ",")
}

func processCSV(at url: URL, mode: Mode) throws {
    let data = try String(contentsOf: url, encoding: .utf8)
    let lines = data.components(separatedBy: .newlines)
    guard lines.count > 0 else { return }
    var headerFields = splitCSVLine(lines[0])
    // normalize headers lowercase for detection
    let lower = headerFields.map { $0.lowercased() }
    // if file already has uuid or id_hash/sha256, skip to avoid duplicate columns
    if lower.contains("uuid") || lower.contains("id_hash") || lower.contains("sha256") {
        print("skip (already has uuid/id_hash/sha256): \(url.path)")
        return
    }
    // backup original if not already backed up
    let backupURL = url.appendingPathExtension("bak")
    if !FileManager.default.fileExists(atPath: backupURL.path) {
        try FileManager.default.copyItem(at: url, to: backupURL)
        print("backup created: \(backupURL.path)")
    } else {
        print("backup already exists: \(backupURL.path)")
    }

    // keep original headerFields for indexing detection
    let origHeader = headerFields
    // append uuid and id_hash as last columns
    headerFields.append("uuid")
    headerFields.append("id_hash")

    var outLines: [String] = []
    outLines.append(joinCSVLine(headerFields))

    // prepare lowercased original header for index lookups
    let origLower = origHeader.map { $0.lowercased() }
    func idx(of names: [String]) -> Int? {
        for (j,h) in origLower.enumerated() {
            if names.contains(h) { return j }
        }
        return nil
    }
    let termIdx = idx(of: ["term","word","question","term","lemma"]) // added lemma as possibility
    let meaningIdx = idx(of: ["meaning","definition","translation","answer","gloss"]) // added gloss

    for i in 1..<lines.count {
        let line = lines[i]
        if line.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { continue }
        let cols = splitCSVLine(line)
        // gather term and meaning safely
        let termVal = (termIdx != nil && termIdx! < cols.count) ? cols[termIdx!] : ""
        let meaningVal = (meaningIdx != nil && meaningIdx! < cols.count) ? cols[meaningIdx!] : ""
        let combined = termVal + "|" + meaningVal
        // compute uuid and id_hash
        let uuidStr: String
        if mode == .random {
            uuidStr = UUID().uuidString
        } else {
            uuidStr = deterministicUUID(from: combined).uuidString
        }
        let idHash = idHashHex(from: combined)
        var newCols = cols
        newCols.append(uuidStr)
        newCols.append(idHash)
        outLines.append(joinCSVLine(newCols))
    }

    let out = outLines.joined(separator: "\n")
    // write atomically to avoid partial writes
    try out.write(to: url, atomically: true, encoding: .utf8)
    print("updated (appended uuid,id_hash): \(url.path)")
}

func iterate(path: String) {
    let fm = FileManager.default
    var isDir: ObjCBool = false
    guard fm.fileExists(atPath: path, isDirectory: &isDir) else { print("path not found: \(path)"); return }
    let modeArg = CommandLine.arguments.contains("--random") ? Mode.random : Mode.deterministic
    if isDir.boolValue {
        let url = URL(fileURLWithPath: path)
        guard let enumerator = fm.enumerator(at: url, includingPropertiesForKeys: nil) else { return }
        for case let fileURL as URL in enumerator {
            if fileURL.pathExtension.lowercased() == "csv" {
                do { try processCSV(at: fileURL, mode: modeArg) } catch { print("error processing \(fileURL.path): \(error)") }
            }
        }
    } else {
        let fileURL = URL(fileURLWithPath: path)
        if fileURL.pathExtension.lowercased() == "csv" {
            do { try processCSV(at: fileURL, mode: modeArg) } catch { print("error processing \(fileURL.path): \(error)") }
        } else { print("not a csv: \(path)") }
    }
}

// Note: This Tools file now only provides functions; do not use @main here to avoid conflict with the app entry point.
// To run this script standalone, create a small wrapper file outside the app module or run with `swift` by adding a short entry script.
