// CSVLoader.swift
// CSV読み込みユーティリティ（軽量パーサ）
// - 何を: CSVを行ごとに分解し、見出し（あれば）を使ってQuestionItemを組み立てます。
// - なぜ: 余計な依存を増やさず、扱う列に合わせて柔軟に読み込むため。

import Foundation

public enum CSVLoaderError: Error {
    case notFound
    case invalidFormat
}

public final class CSVLoader {
    public init() {}

    // Bundle 内のファイル名から読み込む
    public func loadFromBundle(named name: String) throws -> [QuestionItem] {
        guard let url = Bundle.main.url(forResource: name, withExtension: "csv") else {
            throw CSVLoaderError.notFound
        }
        return try load(from: url)
    }

    // 任意の URL から読み込む
    public func load(from url: URL, encoding: String.Encoding = .utf8) throws -> [QuestionItem] {
        let text = try String(contentsOf: url, encoding: encoding)
        var lines = text.components(separatedBy: .newlines)

        // ヘッダ行の検出: 最初の非空行がヘッダっぽければ取り除き、ヘッダフィールドを得る
        var headerFields: [String] = []
        if let first = lines.first(where: { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }) {
            let lower = first.lowercased()
            // ヘッダ候補語（英語・日本語）
            let headerCandidates = ["term", "word", "question", "meaning", "reading", "etymology",
                                    "語句", "意味", "読み", "読み方", "単語", "語源等解説", "関連語", "関連分野", "難易度",
                                    "フレーズ", "読み（カタカナ）", "意味（日本語）", "和訳", "語源等解説（日本語）", "関連語と意味", "関連分野（日本語）", "シチュエーション"]
            var found = false
            for key in headerCandidates {
                if lower.contains(key) { found = true; break }
            }
            if found {
                headerFields = splitCSVLine(first)
                // remove the header line
                if let idx = lines.firstIndex(of: first) { lines.remove(at: idx) }
            }
        }

        var results: [QuestionItem] = []

        // map lowercased header name -> index for convenience
        var headerIndexMap: [String: Int] = [:]
        // normalize header keys to be tolerant to spaces, full-width parentheses, and punctuation
        func normalizeHeaderKey(_ s: String) -> String {
            var t = s.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            // remove common punctuation and full-width parentheses
            let removeChars = CharacterSet(charactersIn: "()（）\"' 　,、・")
            t = t.components(separatedBy: removeChars).joined()
            // collapse multiple spaces
            t = t.replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
            return t
        }
        for (i, h) in headerFields.enumerated() {
            headerIndexMap[normalizeHeaderKey(h)] = i
        }

        let hasHeader = !headerFields.isEmpty

        // Core Data ベースの ID 供給者
        let idProvider = CoreDataWordIDProvider.shared
        let sourceId = url.lastPathComponent // デッキ単位の衝突回避に使用（任意）

        for raw in lines {
            let line = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            if line.isEmpty { continue }
            let parts = splitCSVLine(line)
            // determine field extraction helpers
            func valueAt(_ idx: Int) -> String {
                guard idx >= 0 && idx < parts.count else { return "" }
                return unquote(parts[idx])
            }
            func valueFor(names: [String]) -> String? {
                for name in names {
                    let key = normalizeHeaderKey(name)
                    if let idx = headerIndexMap[key], idx < parts.count {
                        return unquote(parts[idx])
                    }
                }
                // fallback: try substring match on normalized keys
                for name in names {
                    let key = normalizeHeaderKey(name)
                    for (hKey, idx) in headerIndexMap where hKey.contains(key) && idx < parts.count {
                        return unquote(parts[idx])
                    }
                }
                return nil
            }

            // Improved header-based extractor: try multiple synonyms (including Japanese)
            func valueForHeader(names: [String]) -> String? {
                for name in names {
                    let key = normalizeHeaderKey(name)
                    if let idx = headerIndexMap[key], idx < parts.count {
                        return unquote(parts[idx])
                    }
                }
                return nil
            }

            // extract basic fields: prefer header-based extraction, otherwise fallback to positional
            let term = (valueFor(names: ["term", "word", "question", "語句", "単語", "フレーズ"]) ?? (parts.count > 0 ? unquote(parts[0]) : ""))
            let reading = (valueFor(names: ["reading", "読み", "読み方", "読み（カタカナ）"]) ?? (parts.count > 1 ? unquote(parts[1]) : ""))
            // support header "和訳" as well as existing synonyms
            let meaning = (valueFor(names: ["meaning", "definition", "translation", "意味", "和訳", "意味（日本語）"]) ?? (parts.count > 2 ? unquote(parts[2]) : ""))
            let etymology = (valueFor(names: ["etymology", "語源等解説", "語源", "解説", "語源等解説（日本語）"]) ?? (parts.count > 3 ? unquote(parts[3]) : ""))

            // relatedWords: try many header names; if header exists but none match, leave empty (do not positional-fallback into wrong column)
            let relatedWordsCandidates = ["relatedwords", "related_words", "relatedword", "related_word", "related", "related words", "関連語", "関連語と意味", "paraphrase", "paraphrases", "synonyms"]
            let relatedWordsCSV: String
            if let v = valueFor(names: relatedWordsCandidates) {
                relatedWordsCSV = v
            } else if !hasHeader {
                relatedWordsCSV = parts.count > 4 ? unquote(parts[4]) : ""
            } else {
                relatedWordsCSV = ""
            }

            // relatedFields: JP優先、ENも対応。ヘッダ存在時はポジション フォールバックしない。
            let relatedFieldsCandidatesJP = ["関連分野", "関連分野（日本語）", "分野", "カテゴリー", "カテゴリ", "シチュエーション", "シチュエーション（日本語）"]
            let relatedFieldsCandidatesEN = ["relatedfields", "related_fields", "relatedfield", "related_field", "fields", "field", "related fields", "category", "categories"]
            let vJP = valueFor(names: relatedFieldsCandidatesJP) ?? ""
            let vEN = valueFor(names: relatedFieldsCandidatesEN) ?? ""

            // EN→JP 簡易マッピング（小文字で比較、部分一致）
            let enToJP: [(key: String, jp: String)] = [
                ("english", "英語"), ("language", "言語"),
                ("math", "数学"), ("algebra", "数学"), ("geometry", "数学"),
                ("science", "理科"), ("biology", "生物"), ("chemistry", "化学"), ("physics", "物理"),
                ("geography", "地理"), ("history", "歴史"), ("religion", "宗教"),
                ("school", "学校"), ("class", "学校"), ("education", "学校"),
                ("weather", "天気"), ("season", "天気"),
                ("health", "健康"), ("medical", "医療"), ("medicine", "医療"),
                ("sports", "スポーツ"), ("game", "スポーツ"), ("exercise", "スポーツ"),
                ("business", "ビジネス"), ("work", "ビジネス"), ("office", "ビジネス"),
                ("travel", "旅行"), ("trip", "旅行"), ("tour", "旅行"),
                ("food", "食事"), ("eat", "食事"), ("restaurant", "食事"),
                ("family", "人間関係"), ("friend", "人間関係"), ("social", "人間関係"),
                ("technology", "技術"), ("computer", "情報"), ("internet", "情報"),
                ("culture", "文化"), ("literature", "文学"), ("art", "芸術"), ("music", "音楽"),
                ("econom", "経済"), ("govern", "政治"), ("law", "法律"),
                ("environment", "環境"),
                ("logic", "論理"), ("analysis", "調査/分析"), ("research", "調査/分析"), ("investigat", "調査/分析")
            ]
            func mapENTokenToJP(_ t: String) -> String? {
                let s = t.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
                if s.isEmpty { return nil }
                for (k, jp) in enToJP { if s.contains(k) { return jp } }
                return nil // 未知語は無視
            }

            // JPとENを統合（JPが空 or 「その他」しかない場合はEN由来のマッピングを使って補強）
            var jpTokens = vJP.split(separator: ";").map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
            let enTokensRaw = vEN.split(separator: ";").map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
            let mappedEN = enTokensRaw.compactMap { mapENTokenToJP($0) }
            let jpHasSpecific = jpTokens.contains { $0 != "その他" }
            if jpHasSpecific {
                // 具体的なJPカテゴリがあるなら、ENマッピングで新規のものだけ追加
                for m in mappedEN where !jpTokens.contains(m) { jpTokens.append(m) }
            } else if !mappedEN.isEmpty {
                // JPが空/その他のみなら、ENマッピング結果を採用（重複排除）
                var set = Set<String>()
                let base = jpTokens.filter { $0 != "その他" }
                for b in base { set.insert(b) }
                for m in mappedEN { if !set.contains(m) { set.insert(m) } }
                jpTokens = Array(set)
                if jpTokens.isEmpty { jpTokens = jpTokens + (vJP.isEmpty ? [] : ["その他"]) }
            }
            // 最終的なCSV文字列を生成（セミコロン区切り）
            let relatedFieldsCSV = jpTokens.joined(separator: ";")

            let difficulty = (valueFor(names: ["difficulty", "難易度"]) ?? (parts.count > 6 ? unquote(parts[6]) : ""))

            // UUID は CSV からは読み取らず、安定キー→Core Data マップで取得/発行
            let uuid = idProvider.idFor(term: term, reading: reading, meaning: meaning, etymology: etymology, sourceId: sourceId)

            let item = QuestionItem(term: term,
                                    reading: reading,
                                    meaning: meaning,
                                    etymology: etymology,
                                    relatedWordsCSV: relatedWordsCSV,
                                    relatedFieldsCSV: relatedFieldsCSV,
                                    difficulty: difficulty,
                                    id: uuid)
            results.append(item)
        }
        return results
    }

    // 単純な CSV 行分割（引用符を考慮）
    private func splitCSVLine(_ line: String) -> [String] {
        var items: [String] = []
        var current = ""
        var insideQuotes = false
        let chars = Array(line)
        var i = 0
        while i < chars.count {
            let ch = chars[i]
            // 比較は Character を使って明示する（安定した比較）
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

    private func unquote(_ s: String) -> String {
        var str = s.trimmingCharacters(in: .whitespacesAndNewlines)
        if str.hasPrefix("\"") && str.hasSuffix("\"") && str.count >= 2 {
            str.removeFirst()
            str.removeLast()
        }
        str = str.replacingOccurrences(of: "\"\"", with: "\"")
        return str
    }
}
