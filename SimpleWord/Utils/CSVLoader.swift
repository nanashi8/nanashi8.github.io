// CSVLoader.swift
// CSV読み込みユーティリティ（軽量パーサ）
// - 何を: CSVを行ごとに分解し、見出し（あれば）を使ってQuestionItemを組み立てます。
// - なぜ: 余計な依存を増やさず、扱う列に合わせて柔軟に読み込むため。
//
// 注意: QuestionItemRepositoryを直接使用するように更新されました。

import Foundation

public enum CSVLoaderError: Error {
    case notFound
    case invalidFormat(String)
}

public final class CSVLoader {
    public init() {}

    // Bundle 内のファイル名から読み込む（拡張子なし/ありどちらも可）
    public func loadFromBundle(named name: String) throws -> [QuestionItem] {
        let base = name.replacingOccurrences(of: ".csv", with: "")
        let repository = QuestionItemRepository(fileName: base)
        switch repository.fetch() {
        case .success(let items):
            return items
        case .failure(let error):
            switch error {
            case .notFound:
                throw CSVLoaderError.notFound
            case .invalidData(let detail):
                throw CSVLoaderError.invalidFormat(detail)
            case .parseError(let detail):
                throw CSVLoaderError.invalidFormat(detail)
            }
        }
    }

    // 任意の URL から読み込む（Documents など Bundle 外の CSV 対応）
    public func load(from url: URL, encoding: String.Encoding = .utf8) throws -> [QuestionItem] {
        if FileManager.default.fileExists(atPath: url.path) {
            if let content = try? String(contentsOf: url, encoding: encoding) {
                return try parseContent(content)
            }
        }
        let fileName = url.deletingPathExtension().lastPathComponent
        let repository = QuestionItemRepository(fileName: fileName)
        switch repository.fetch() {
        case .success(let items):
            return items
        case .failure(let error):
            switch error {
            case .notFound:
                throw CSVLoaderError.notFound
            case .invalidData(let detail):
                throw CSVLoaderError.invalidFormat(detail)
            case .parseError(let detail):
                throw CSVLoaderError.invalidFormat(detail)
            }
        }
    }

    // MARK: - ヘッダ駆動型パース（CSVヘッダを最優先）
    private func parseContent(_ content: String) throws -> [QuestionItem] {
        let allLines = content.components(separatedBy: .newlines)
        let lines = allLines.filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }
        guard !lines.isEmpty else { throw CSVLoaderError.invalidFormat("ファイルが空です") }
        
        // 最初の行をヘッダとして扱う
        let headerLine = lines[0]
        let headerColumns = splitCSVLine(headerLine)
        
        // ヘッダ行かどうかをチェック
        guard isHeaderRow(headerColumns) else {
            throw CSVLoaderError.invalidFormat("CSVの1行目がヘッダではありません")
        }
        
        // ヘッダから列マッピングを作成
        let columnMapping = buildColumnMapping(headerColumns)
        
        var items: [QuestionItem] = []
        
        // 2行目以降をデータ行としてパース
        for idx in 1..<lines.count {
            let lineNumber = idx + 1
            let line = lines[idx]
            let columns = splitCSVLine(line)
            
            guard columns.count == headerColumns.count else {
                throw CSVLoaderError.invalidFormat("行\(lineNumber): 列数不正（期待: \(headerColumns.count), 実際: \(columns.count)）")
            }
            
            // ヘッダマッピングを使用してQuestionItemを作成
            let item = try parseItemFromColumns(columns, mapping: columnMapping, lineNumber: lineNumber)
            items.append(item)
        }
        
        return items
    }
    
    // MARK: - ヘッダから列マッピングを構築
    private func buildColumnMapping(_ headers: [String]) -> [String: Int] {
        var mapping: [String: Int] = [:]
        
        for (index, header) in headers.enumerated() {
            let normalized = header.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            
            // 関連語列の判定（「関連史実」を先に処理）
            if normalized.contains("関連語") || normalized.contains("関連史実") || normalized.contains("relatedword") {
                mapping["relatedWords"] = index
            }
            // 関連分野列の判定
            else if normalized.contains("関連分野") || normalized.contains("分野") || normalized.contains("relatedfield")
                || normalized.contains("カテゴリ") || normalized.contains("シチュエーション") {
                mapping["relatedFields"] = index
            }
            // 語句列の判定
            else if normalized.contains("語句") || normalized.contains("term") || normalized.contains("単語") 
                || normalized.contains("フレーズ") || normalized.contains("年号") {
                mapping["term"] = index
            }
            // 読み/発音列の判定
            else if normalized.contains("読み") || normalized.contains("発音") || normalized.contains("reading")
                || normalized.contains("登場人物") || normalized.contains("人物") {
                mapping["reading"] = index
            }
            // 意味/和訳列の判定（「史実名」を優先）
            else if normalized.contains("史実名") || normalized.contains("意味") || normalized.contains("和訳") 
                || normalized.contains("meaning") || normalized.contains("translation") || normalized.contains("史実") {
                mapping["meaning"] = index
            }
            // 語源/解説列の判定
            else if normalized.contains("語源") || normalized.contains("解説") || normalized.contains("etymology")
                || normalized.contains("経緯") {
                mapping["etymology"] = index
            }
            // 難易度列の判定
            else if normalized.contains("難易度") || normalized.contains("difficulty") || normalized.contains("level")
                || normalized.contains("レベル") {
                mapping["difficulty"] = index
            }
        }
        
        return mapping
    }
    
    // MARK: - マッピングを使用してQuestionItemをパース
    private func parseItemFromColumns(_ columns: [String], mapping: [String: Int], lineNumber: Int) throws -> QuestionItem {
        // 各フィールドを取得（存在しない場合は空文字列）
        let term = mapping["term"].flatMap { columns[safe: $0] } ?? ""
        let reading = mapping["reading"].flatMap { columns[safe: $0] } ?? ""
        let meaning = mapping["meaning"].flatMap { columns[safe: $0] } ?? ""
        let etymology = mapping["etymology"].flatMap { columns[safe: $0] } ?? ""
        let relatedWordsCSV = mapping["relatedWords"].flatMap { columns[safe: $0] } ?? ""
        let relatedFieldsCSV = mapping["relatedFields"].flatMap { columns[safe: $0] } ?? ""
        let difficulty = mapping["difficulty"].flatMap { columns[safe: $0] } ?? ""
        
        return QuestionItem(
            term: term,
            reading: reading,
            meaning: meaning,
            etymology: etymology,
            relatedWordsCSV: relatedWordsCSV,
            relatedFieldsCSV: relatedFieldsCSV,
            difficulty: difficulty,
            id: UUID()
        )
    }

    private func splitCSVLine(_ line: String) -> [String] {
        var result: [String] = []
        var current = ""
        var inQuotes = false
        for ch in line {
            if ch == "\"" { inQuotes.toggle() }
            else if ch == "," && !inQuotes { result.append(current.trimmingCharacters(in: .whitespaces)); current = "" }
            else { current.append(ch) }
        }
        result.append(current.trimmingCharacters(in: .whitespaces))
        return result.map { unquote($0) }
    }

    private func unquote(_ s: String) -> String {
        var t = s.trimmingCharacters(in: .whitespacesAndNewlines)
        if t.hasPrefix("\"") && t.hasSuffix("\"") && t.count >= 2 {
            t = String(t.dropFirst().dropLast())
        }
        return t
    }

    private func isHeaderRow(_ columns: [String]) -> Bool {
        let normalized = columns.map { $0.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }
        let headerTokens: Set<String> = [
            "term", "word", "question", "語句", "単語", "フレーズ", "年号",
            "reading", "読み", "読み方", "読み（カタカナ）", "読み（ひらがな）", "発音（カタカナ）", "登場人物", "人物",
            "meaning", "definition", "translation", "意味", "和訳", "史実名", "史実",
            "etymology", "語源", "語源等解説", "語源等解説（日本語）", "解説", "経緯",
            "relatedwords", "関連語", "関連語と意味", "関連語（英語）と意味（日本語）", "関連史実",
            "relatedfields", "関連分野", "関連分野（日本語）", "分野", "カテゴリー", "カテゴリ", "シチュエーション",
            "difficulty", "level", "難易度", "レベル"
        ]
        return normalized.contains { headerTokens.contains($0) }
    }
}
