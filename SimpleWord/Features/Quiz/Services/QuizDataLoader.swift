import Foundation

/// クイズデータの読み込み結果
struct QuizLoadResult {
    /// 読み込まれた問題アイテム（フィルタ済み）
    let items: [QuestionItem]
    
    /// 出題順序
    let order: [QuestionItem]
    
    /// CSV ファイルの URL
    let csvURL: URL?
    
    /// CSV ヘッダラベル
    let headerLabels: [String: String]
}

/// クイズデータ読み込みエラー
enum QuizLoadError: LocalizedError {
    case csvNotSelected
    case csvNotFound(String)
    case noMatchingQuestions
    
    var errorDescription: String? {
        switch self {
        case .csvNotSelected:
            return "CSVファイルが選択されていません。"
        case .csvNotFound(let fileName):
            return "CSVファイル '\(fileName)' が見つからないか、読み込みに失敗しました。"
        case .noMatchingQuestions:
            return "フィルタ条件に一致する問題がありません。\n出題設定を確認してください。"
        }
    }
}

/// クイズデータの読み込みを担当
struct QuizDataLoader {
    
    /// CSV からクイズデータを読み込む
    /// - Parameters:
    ///   - csvName: CSV ファイル名
    ///   - fields: フィルタする分野
    ///   - difficulties: フィルタする難易度
    ///   - numberOfQuestions: 出題数（0の場合は全問題）
    ///   - isRandomOrder: ランダム出題かどうか
    /// - Returns: 読み込み結果
    /// - Throws: QuizLoadError
    func loadQuizData(
        csvName: String,
        fields: Set<String>,
        difficulties: Set<String>,
        numberOfQuestions: Int,
        isRandomOrder: Bool
    ) throws -> QuizLoadResult {
        var allItems: [QuestionItem] = []
        var resolvedCSVURL: URL? = nil

        // QuestionItemRepository を使用してCSVを読み込む
        let base = csvName.replacingOccurrences(of: ".csv", with: "")
        let repository = QuestionItemRepository(fileName: base)
        
        switch repository.fetch() {
        case .success(let items):
            allItems = items
        case .failure(let error):
            print("CSV load error: \(error.localizedDescription)")
            allItems = []
        }

        // resolvedCSVURL の設定（Documents優先、次にBundle）
        if let documentsURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
            let csvURL = documentsURL.appendingPathComponent(csvName.hasSuffix(".csv") ? csvName : "\(csvName).csv")
            if FileManager.default.fileExists(atPath: csvURL.path) {
                resolvedCSVURL = csvURL
            }
        }
        if resolvedCSVURL == nil {
            resolvedCSVURL = Bundle.main.url(forResource: base, withExtension: "csv")
        }

        // ヘッダを読み取ってラベルマップを作成
        let headerLabels: [String: String]
        if let url = resolvedCSVURL {
            let parser = CSVHeaderParser()
            headerLabels = parser.parseHeader(from: url)
        } else {
            headerLabels = [:]
        }

        guard !allItems.isEmpty else {
            throw QuizLoadError.csvNotFound(csvName)
        }

        // フィルタリング
        let filtered = applyFilters(to: allItems, fields: fields, difficulties: difficulties)
        guard !filtered.isEmpty else {
            throw QuizLoadError.noMatchingQuestions
        }

        // 出題順序の決定
        let totalQuestions = numberOfQuestions > 0 ? min(numberOfQuestions, filtered.count) : filtered.count
        let order: [QuestionItem]
        
        if isRandomOrder {
            order = filtered.shuffled().prefix(totalQuestions).map { $0 }
        } else {
            order = Array(filtered.prefix(totalQuestions))
        }

        return QuizLoadResult(
            items: filtered,
            order: order,
            csvURL: resolvedCSVURL,
            headerLabels: headerLabels
        )
    }
    
    /// フィルタを適用
    private func applyFilters(
        to items: [QuestionItem],
        fields: Set<String>,
        difficulties: Set<String>
    ) -> [QuestionItem] {
        var result = items

        // 分野フィルタ
        if !fields.isEmpty {
            result = result.filter { item in
                !Set(item.relatedFields).isDisjoint(with: fields)
            }
        }

        // 難易度フィルタ
        if !difficulties.isEmpty {
            result = result.filter { item in
                difficulties.contains(item.difficulty)
            }
        }

        return result
    }
}
