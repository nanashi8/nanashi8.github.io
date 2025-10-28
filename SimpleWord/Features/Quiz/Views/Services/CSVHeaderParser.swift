import Foundation

/// CSV ヘッダの解析を担当
/// CSVファイルのヘッダ行から論理キーと表示ラベルのマッピングを作成
struct CSVHeaderParser {
    
    /// CSV URLからヘッダを読み取り、論理キー->表示ラベルマップを作成
    /// - Parameter url: CSV ファイルの URL
    /// - Returns: 論理キー（term, meaning等）-> 表示ラベル（"語句", "意味"等）のマップ
    func parseHeader(from url: URL) -> [String: String] {
        do {
            let raw = try String(contentsOf: url, encoding: .utf8)
            
            // ヘッダ候補は先頭の非空行で、コメント(//)を無視
            let lines = raw.components(separatedBy: CharacterSet.newlines)
            var headerLine: String? = nil
            
            for line in lines {
                let trimmed = line.trimmingCharacters(in: .whitespacesAndNewlines)
                if trimmed.isEmpty { continue }
                if trimmed.hasPrefix("//") { continue }
                headerLine = trimmed
                break
            }
            
            if let headerLine = headerLine {
                let headerCols = splitCSVLine(headerLine)
                return buildHeaderLabelMap(headerCols)
            } else {
                return [:]
            }
        } catch {
            return [:]
        }
    }
    
    /// ヘッダの配列から論理キー->表示ラベルマップを作成
    /// - Parameter headerColumns: ヘッダのカラム配列
    /// - Returns: 論理キー -> 表示ラベルのマップ
    func buildHeaderLabelMap(_ headerColumns: [String]) -> [String: String] {
        var map: [String: String] = [:]
        
        for (_, raw) in headerColumns.enumerated() {
            let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            let key = normalize(trimmed)
            
            // related words (先に処理して「関連史実」「関連語（英語）と意味（日本語）」を確実にキャッチ)
            if key.contains("関連語") || key.contains("関連史実") ||
               key == "relatedwords" || key.contains("relatedword") {
                if map["relatedwords"] == nil { map["relatedwords"] = trimmed }
            }
            // related fields (関連分野を先に処理)
            else if key.contains("関連分野") || key.contains("分野") || key.contains("カテゴリ") ||
                    key == "relatedfields" || key.contains("relatedfield") {
                if map["relatedfields"] == nil { map["relatedfields"] = trimmed }
            }
            // term (問題として出題される項目)
            // 中学歴史では「年号」、英単語では「語句」
            else if key.contains("語句") || key.contains("単語") || key.contains("年号") ||
               key == "term" || key == "word" || key == "japanese" || key == "lemma" {
                if map["term"] == nil { map["term"] = trimmed }
            }
            // reading (読み・発音・登場人物)
            else if key.contains("読み") || key.contains("よみ") || key.contains("発音") || key.contains("登場人物") || key.contains("人物") ||
                    key == "reading" || key == "yomi" {
                if map["reading"] == nil { map["reading"] = trimmed }
            }
            // meaning (選択肢として出題される項目)
            // 中学歴史では「史実名」、英単語では「意味・和訳」
            // 「史実名」を「史実」より優先
            else if key.contains("史実名") || key.contains("意味") || key.contains("和訳") || key.contains("史実") ||
                    key == "meaning" || key == "translation" {
                if map["meaning"] == nil { map["meaning"] = trimmed }
            }
            // etymology (詳細情報・解説)
            else if key.contains("語源") || key.contains("解説") || key.contains("経緯") ||
                    key.contains("覚え方") ||
                    key == "etymology" || key == "note" || key == "explain" {
                if map["etymology"] == nil { map["etymology"] = trimmed }
            }
            // difficulty
            else if key.contains("難易度") || key == "difficulty" || key == "level" {
                if map["difficulty"] == nil { map["difficulty"] = trimmed }
            }
        }
        
        return map
    }
    
    /// CSV行を分割
    /// クォートを考慮してカンマで分割する
    /// - Parameter line: CSV の1行
    /// - Returns: 分割された文字列の配列
    func splitCSVLine(_ line: String) -> [String] {
        var items: [String] = []
        var current = ""
        var insideQuotes = false
        let chars = Array(line)
        var i = 0
        
        while i < chars.count {
            let ch = chars[i]
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
        
        return items.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
    }
    
    // MARK: - Private
    
    /// 文字列を正規化（小文字化、記号除去等）
    private func normalize(_ s: String) -> String {
        var t = s.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let remove = CharacterSet(charactersIn: "()（）\"' 　,、・")
        t = t.components(separatedBy: remove).joined()
        t = t.replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
        return t
    }
}
