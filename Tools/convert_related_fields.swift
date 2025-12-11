import Foundation

let fm = FileManager.default
let basePath = "/path/to/project/SimpleWord/SimpleWord/Resources"

let inputs = ["高校単語.csv": "高校単語.csv",
              "サンプル単語.csv": "サンプル単語.csv"]

let mapping: [String: String] = [
    "English": "英語",
    "Logic": "論理",
    "Science": "理科",
    "Math": "数学",
    "Geography": "地理",
    "CS": "情報",
    "Economics": "経済",
    "History": "歴史",
    "Arts": "芸術",
    "Social": "社会",
    "Debate": "討論",
    "Law": "法律",
    "Biology": "生物",
    "Physics": "物理",
    "Chemistry": "化学",
    "Engineering": "工学",
    "Design": "デザイン",
    "Education": "教育",
    "Music": "音楽",
    "Life": "生活",
    "PE": "体育",
    "Shop": "実習",
    "Transport": "交通",
    "Safety": "安全",
    "Vocabulary": "語彙",
    "Study": "学習",
    "Grammar": "文法",
    "Forensics": "法科学",
    "Library": "図書",
    "Urban": "都市",
    "Marketing": "マーケティング",
    "Statistics": "統計",
    "Physics;": "物理;" // fallback example
]

func splitCSVLine(_ line: String) -> [String] {
    var fields: [String] = []
    var current = ""
    var inside = false
    let chars = Array(line)
    var i = 0
    while i < chars.count {
        let c = chars[i]
        if c == '"' {
            if inside {
                if i+1 < chars.count && chars[i+1] == '"' {
                    current.append('"')
                    i += 1
                } else {
                    inside = false
                }
            } else {
                inside = true
            }
        } else if c == "," && !inside {
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
        if field.contains(",") || field.contains("\n") || field.contains("\"") {
            let esc = field.replacingOccurrences(of: "\"", with: "\"\"")
            return "\"\(esc)\""
        } else {
            return field
        }
    }.joined(separator: ",")
}

for (inName, outName) in inputs {
    let inURL = URL(fileURLWithPath: basePath).appendingPathComponent(inName)
    let outURL = URL(fileURLWithPath: basePath).appendingPathComponent(outName)
    guard fm.fileExists(atPath: inURL.path) else {
        print("input not found: \(inURL.path)")
        continue
    }
    guard let text = try? String(contentsOf: inURL, encoding: .utf8) else {
        print("failed to read: \(inURL.path)")
        continue
    }
    var lines = text.components(separatedBy: CharacterSet.newlines)
    if lines.isEmpty { continue }
    // header
    let header = lines.first!
    let headers = splitCSVLine(header)
    guard let rfIdx = headers.firstIndex(where: { $0.lowercased() == "relatedfields" }) else {
        print("relatedFields column not found in \(inName)")
        continue
    }
    var outLines: [String] = [header]
    for i in 1..<lines.count {
        let raw = lines[i]
        if raw.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { outLines.append(raw); continue }
        let cols = splitCSVLine(raw)
        if rfIdx < cols.count {
            let rf = cols[rfIdx]
            // split by semicolon
            let parts = rf.split(separator: ";").map { String($0).trimmingCharacters(in: .whitespacesAndNewlines) }
            let newParts = parts.map { part -> String in
                if let v = mapping[part] { return v }
                return part
            }
            var newCols = cols
            newCols[rfIdx] = newParts.joined(separator: ";")
            outLines.append(joinCSVLine(newCols))
        } else {
            outLines.append(raw)
        }
    }
    let outText = outLines.joined(separator: "\n")
    do {
        try outText.write(to: outURL, atomically: true, encoding: .utf8)
        print("wrote: \(outURL.path)")
    } catch {
        print("failed to write: \(outURL.path) -> \(error)")
    }
}
