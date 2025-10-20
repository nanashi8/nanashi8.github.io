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

        // URL 解決（Documents を優先し、見つからなければ Bundle を探索）
        guard let csvURL = resolveCSVURL(named: csvName) else { return [] }
        guard let raw = try? String(contentsOf: csvURL, encoding: .utf8) else { return [] }
        return parseCSV(raw)
    }

    /// CSV 名から URL を解決する（Documents -> Bundle の順）
    private static func resolveCSVURL(named name: String) -> URL? {
        let filename = name
        // Documents 内を優先
        if let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
            let docURL = dir.appendingPathComponent(filename)
            if FileManager.default.fileExists(atPath: docURL.path) {
                return docURL
            }
            // .csv なしで指定された場合も試す
            if !filename.hasSuffix(".csv") {
                let docURL2 = dir.appendingPathComponent("\(filename).csv")
                if FileManager.default.fileExists(atPath: docURL2.path) { return docURL2 }
            }
        }

        // Bundle 内を探索
        let baseName = filename.hasSuffix(".csv") ? String(filename.dropLast(4)) : filename
        let bundle = Bundle.main
        if let url = bundle.url(forResource: baseName, withExtension: "csv") { return url }
        if let url = bundle.url(forResource: filename, withExtension: nil) { return url }

        // リソース列挙で最終探索
        if let resources = bundle.resourceURL, let enumerator = FileManager.default.enumerator(at: resources, includingPropertiesForKeys: nil) {
            for case let fileURL as URL in enumerator {
                if fileURL.lastPathComponent == filename || fileURL.lastPathComponent == "\(baseName).csv" {
                    return fileURL
                }
            }
        }
        return nil
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
            // いくつかの可能なヘッダ名を正規化（英語/日本語）
            switch key {
            // term
            case "term", "word", "japanese", "lemma", "語句":
                map["term"] = i
            // reading
            case "reading", "yomi", "発音（カタカナ）", "発音(カタカナ)":
                map["reading"] = i
            // meaning
            case "meaning", "meaning_jp", "translation", "和訳":
                map["meaning"] = i
            // etymology / note
            case "etymology", "note", "explain", "語源等解説（日本語）", "語源等解説(日本語)":
                map["etymology"] = i
            // related words
            case "relatedwords", "related_words", "related_words_csv", "関連語（英語）と意味（日本語）", "関連語(英語)と意味(日本語)":
                map["relatedwords"] = i
            // related fields / category
            case "relatedfields", "related_fields", "related_fields_csv", "関連分野（日本語）", "関連分野(日本語)", "分野", "カテゴリ", "カテゴリー":
                map["relatedfields"] = i
            // difficulty / level
            case "difficulty", "level", "難易度":
                map["difficulty"] = i
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
        let chars = Array(line)

        // 明示的に Character を定義して比較することで、シングルクオートや文字列リテラル比較による lint 警告を避ける
        let quoteChar = Character("\"")
        let commaChar = Character(",")

        var i = 0
        while i < chars.count {
            let ch = chars[i]
            if ch == quoteChar {
                if inQuotes && i + 1 < chars.count && chars[i + 1] == quoteChar {
                    // エスケープされた引用符: Character を追加
                    current.append(quoteChar)
                    i += 1
                } else {
                    inQuotes.toggle()
                }
            } else if ch == commaChar && !inQuotes {
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
