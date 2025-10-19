// filepath: /Users/yuichinakamura/Documents/20251006_002/SimpleWord/SimpleWord/Services/CSVQuestionLoader.swift
// CSVQuestionLoader.swift
// Bundle 内の CSV ファイルを読み込み、QuestionItem 配列を生成するユーティリティ
// - 何を: 選択された CSV 名に対応するリソースを読み込み、CSV をパースして QuestionItem に変換
// - なぜ: QuizView が CSV 選択時に問題を表示できるようにするため

import Foundation

/// CSV を読み込み QuestionItem 配列を返すシンプルなローダー
/// - 注意: リソース名に ".csv" を含んでいる場合と含んでいない場合の両方に対応します。
public struct CSVQuestionLoader {
    /// 指定した CSV 名から QuestionItem を読み込む
    /// - Parameter csvName: リソース名（例: "中学英単語" または "中学英単語.csv"）。nil の場合は空配列を返す。
    public static func loadQuestions(csvName: String?) -> [QuestionItem] {
        guard let csvName = csvName, !csvName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return []
        }

        // まずは拡張子なしで検索し、見つからなければ拡張子ありも試す
        let baseName = csvName.hasSuffix(".csv") ? String(csvName.dropLast(4)) : csvName
        let bundle = Bundle.main

        var url: URL? = bundle.url(forResource: baseName, withExtension: "csv")
        if url == nil {
            // 直接拡張子付きで探す
            url = bundle.url(forResource: csvName, withExtension: nil)
        }
        if url == nil {
            // 最終手段: バンドルの Resources を列挙して最後が一致するものを探す
            if let resources = bundle.resourceURL, let enumerator = FileManager.default.enumerator(at: resources, includingPropertiesForKeys: nil) {
                for case let fileURL as URL in enumerator {
                    if fileURL.lastPathComponent == csvName || fileURL.lastPathComponent == "\(baseName).csv" {
                        url = fileURL
                        break
                    }
                }
            }
        }

        guard let csvURL = url, let raw = try? String(contentsOf: csvURL, encoding: .utf8) else {
            return []
        }

        return parseCSV(raw)
    }

    // MARK: - CSV Parsing

    /// CSV 全体をパースして QuestionItem 配列を返す
    private static func parseCSV(_ text: String) -> [QuestionItem] {
        var lines = text.components(separatedBy: CharacterSet.newlines)
        // 空行を取り除く
        lines = lines.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
        guard !lines.isEmpty else { return [] }

        // ヘッダ行を解析してカラム位置を決める
        let header = parseCSVLine(lines.removeFirst())
        let headerMap = buildHeaderMap(header)

        var items: [QuestionItem] = []
        for line in lines {
            let cols = parseCSVLine(line)
            // 必要なカラムが存在するか確認
            guard let termIdx = headerMap["term"],
                  let meaningIdx = headerMap["meaning"] else {
                // 最低限 term と meaning が必要
                continue
            }

            // 安全な accessor
            func col(_ idx: Int?) -> String { guard let i = idx, i >= 0, i < cols.count else { return "" }; return cols[i] }

            let term = col(termIdx)
            let reading = col(headerMap["reading"]) 
            let meaning = col(meaningIdx)
            let etymology = col(headerMap["etymology"]) 
            let relatedWordsCSV = col(headerMap["relatedwords"]) 
            let relatedFieldsCSV = col(headerMap["relatedfields"]) 
            let difficulty = col(headerMap["difficulty"]) 

            let item = QuestionItem(
                term: term,
                reading: reading,
                meaning: meaning,
                etymology: etymology,
                relatedWordsCSV: relatedWordsCSV,
                relatedFieldsCSV: relatedFieldsCSV,
                difficulty: difficulty
            )
            items.append(item)
        }

        return items
    }

    /// ヘッダ行をキー(小文字) -> index に変換
    private static func buildHeaderMap(_ headerCols: [String]) -> [String: Int] {
        var map: [String: Int] = [:]
        for (i, raw) in headerCols.enumerated() {
            let key = raw.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            // いくつかの可能なヘッダ名を正規化
            switch key {
            case "term", "word", "japanese", "lemma": map["term"] = i
            case "reading", "yomi": map["reading"] = i
            case "meaning", "meaning_jp", "translation": map["meaning"] = i
            case "etymology", "note", "explain": map["etymology"] = i
            case "relatedwords", "related_words", "related_words_csv": map["relatedwords"] = i
            case "relatedfields", "related_fields", "related_fields_csv": map["relatedfields"] = i
            case "difficulty", "level": map["difficulty"] = i
            default:
                // unknown header - ignore
                break
            }
        }

        return map
    }

    /// 単一行の CSV をパースしてカラム配列を返す（引用符対応）
    private static func parseCSVLine(_ line: String) -> [String] {
        var result: [String] = []
        var current = ""
        var inQuotes = false
        var chars = Array(line)

        var i = 0
        while i < chars.count {
            let ch = chars[i]
            if ch == '"' {
                if inQuotes && i + 1 < chars.count && chars[i + 1] == '"' {
                    // エスケープされた引用符
                    current.append('"')
                    i += 1
                } else {
                    inQuotes.toggle()
                }
            } else if ch == ',' && !inQuotes {
                result.append(current.trimmingCharacters(in: .whitespacesAndNewlines))
                current = ""
            } else {
                current.append(ch)
            }
            i += 1
        }
        result.append(current.trimmingCharacters(in: .whitespacesAndNewlines))
        return result
    }
}
