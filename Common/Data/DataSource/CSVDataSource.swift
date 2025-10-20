// CSVDataSource.swift
// CSV読み込みの具体的な実装（外部からは DataSource として扱われる）
//
// 何を: CSV形式のデータソース実装を提供
// なぜ: CSV読み込み処理を一元化し、列数チェックとエラーハンドリングを統一するため

import Foundation

/// CSV形式のデータソース実装
public final class CSVDataSource<T>: DataSource {
    public typealias Item = T
    
    private let fileName: String
    private let columnCount: Int?  // nil の場合はヘッダ駆動型
    private let parser: (Int, [String]) throws -> T?
    private let headerDrivenParser: ((Int, [String], [String: Int]) throws -> T?)?  // ヘッダ駆動型パーサ
    
    /// イニシャライザ（固定列数モード）
    /// - Parameters:
    ///   - fileName: ファイル名（拡張子なし）
    ///   - columnCount: 期待する列数
    ///   - parser: 各行をパースするクロージャ (lineNumber, columns) -> Item?
    public init(
        fileName: String,
        columnCount: Int,
        parser: @escaping (Int, [String]) throws -> T?
    ) {
        self.fileName = fileName
        self.columnCount = columnCount
        self.parser = parser
        self.headerDrivenParser = nil
    }
    
    /// イニシャライザ（ヘッダ駆動型モード）
    /// - Parameters:
    ///   - fileName: ファイル名（拡張子なし）
    ///   - headerDrivenParser: ヘッダマッピングを受け取るパーサ (lineNumber, columns, mapping) -> Item?
    public init(
        fileName: String,
        headerDrivenParser: @escaping (Int, [String], [String: Int]) throws -> T?
    ) {
        self.fileName = fileName
        self.columnCount = nil  // ヘッダ駆動型では列数チェックなし
        self.parser = { _, _ in nil }  // ダミー
        self.headerDrivenParser = headerDrivenParser
    }
    
    /// データを取得する
    public func fetch() -> Result<DataSourceResult<T>, DataSourceError> {
        // ファイル読み込み（Bundle優先、見つからなければResourcesフォルダ）
        guard let content = loadFileContent() else {
            return .failure(.notFound(fileName))
        }
        
        // 行分割（空行は除去）
        let allLines = content.components(separatedBy: .newlines)
        let lines = allLines.filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }
        
        guard !lines.isEmpty else {
            return .failure(.invalidData("ファイルが空です"))
        }
        
        // ヘッダ駆動型の場合
        if let headerDrivenParser = headerDrivenParser {
            return fetchWithHeaderDriven(lines: lines, parser: headerDrivenParser)
        }
        
        // 固定列数モードの場合
        return fetchWithFixedColumns(lines: lines)
    }
    
    // MARK: - ヘッダ駆動型フェッチ
    
    private func fetchWithHeaderDriven(
        lines: [String],
        parser: (Int, [String], [String: Int]) throws -> T?
    ) -> Result<DataSourceResult<T>, DataSourceError> {
        // 最初の行をヘッダとして扱う
        let headerLine = lines[0]
        let headerColumns = splitCSVLine(headerLine)
        
        guard isHeaderRow(headerColumns) else {
            return .failure(.invalidData("CSVの1行目がヘッダではありません"))
        }
        
        // ヘッダマッピングを構築
        let mapping = buildColumnMapping(headerColumns)
        
        var items: [T] = []
        var warnings: [String] = []
        
        // 2行目以降をデータ行としてパース
        for index in 1..<lines.count {
            let lineNumber = index + 1
            let line = lines[index]
            let columns = splitCSVLine(line)
            
            // 列数チェック（ヘッダと同じ列数であることを確認）
            guard columns.count == headerColumns.count else {
                return .failure(.invalidData(
                    "行\(lineNumber): 列数不正（期待: \(headerColumns.count), 実際: \(columns.count)）"
                ))
            }
            
            // パース処理
            do {
                if let item = try parser(lineNumber, columns, mapping) {
                    items.append(item)
                } else {
                    warnings.append("行\(lineNumber)をスキップしました")
                }
            } catch {
                return .failure(.parseError("行\(lineNumber): \(error.localizedDescription)"))
            }
        }
        
        return .success(DataSourceResult(items: items, warnings: warnings))
    }
    
    // MARK: - 固定列数モードフェッチ
    
    private func fetchWithFixedColumns(lines: [String]) -> Result<DataSourceResult<T>, DataSourceError> {
        guard let columnCount = columnCount else {
            return .failure(.invalidData("固定列数モードですが列数が指定されていません"))
        }
        
        var items: [T] = []
        var warnings: [String] = []
        
        // 各行をパース
        for (index, line) in lines.enumerated() {
            let lineNumber = index + 1
            let columns = splitCSVLine(line)
            
            // 先頭行がヘッダならスキップ
            if lineNumber == 1 && isHeaderRow(columns) {
                continue
            }
            
            // 列数チェック（固定）
            guard columns.count == columnCount else {
                return .failure(.invalidData(
                    "行\(lineNumber): 列数不正（期待: \(columnCount), 実際: \(columns.count)）"
                ))
            }
            
            // パース処理
            do {
                if let item = try parser(lineNumber, columns) {
                    items.append(item)
                } else {
                    warnings.append("行\(lineNumber)をスキップしました")
                }
            } catch {
                return .failure(.parseError("行\(lineNumber): \(error.localizedDescription)"))
            }
        }
        
        return .success(DataSourceResult(items: items, warnings: warnings))
    }
    
    // MARK: - ヘッダマッピング構築
    
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
    
    // MARK: - Private Methods
    
    /// ファイル内容を読み込む（Bundle優先、フォールバックあり）
    private func loadFileContent() -> String? {
        // 1. Bundleから読み込み
        if let url = Bundle.main.url(forResource: fileName, withExtension: "csv"),
           let content = try? String(contentsOf: url, encoding: .utf8) {
            return content
        }
        
        // 2. プロジェクトのResourcesフォルダから読み込み（開発中のフォールバック）
        let projectPath = #file
        let projectURL = URL(fileURLWithPath: projectPath)
        let resourcesURL = projectURL
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent("Resources")
            .appendingPathComponent("\(fileName).csv")
        
        if FileManager.default.fileExists(atPath: resourcesURL.path),
           let content = try? String(contentsOf: resourcesURL, encoding: .utf8) {
            return content
        }
        
        return nil
    }
    
    /// CSV行を分割する（カンマ区切り、クォート対応）
    private func splitCSVLine(_ line: String) -> [String] {
        var result: [String] = []
        var current = ""
        var inQuotes = false
        
        for char in line {
            if char == "\"" {
                inQuotes.toggle()
            } else if char == "," && !inQuotes {
                result.append(current.trimmingCharacters(in: .whitespaces))
                current = ""
            } else {
                current.append(char)
            }
        }
        
        result.append(current.trimmingCharacters(in: .whitespaces))
        return result.map { unquoteString($0) }
    }
    
    /// クォートを除去する
    private func unquoteString(_ s: String) -> String {
        var result = s.trimmingCharacters(in: .whitespaces)
        if result.hasPrefix("\"") && result.hasSuffix("\"") && result.count >= 2 {
            result = String(result.dropFirst().dropLast())
        }
        return result
    }
    
    /// ヘッダ行らしさの判定（代表的な列名に合致するか）
    private func isHeaderRow(_ columns: [String]) -> Bool {
        let normalized = columns.map { $0.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }
        let headerTokens: Set<String> = [
            "id", "term", "word", "question", "語句", "単語", "フレーズ", "年号",
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
