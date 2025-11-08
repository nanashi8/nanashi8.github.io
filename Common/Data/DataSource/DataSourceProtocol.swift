// DataSourceProtocol.swift
// データ取得方法を抽象化（CSV, API, DB など実装方法を隠蔽）
//
// 何を: データ取得の抽象インターフェースを提供
// なぜ: 実装方法（CSV/API/DB）を切り替え可能にし、テスタビリティを向上させるため

import Foundation

/// データ取得エラー
public enum DataSourceError: LocalizedError {
    case notFound(String)
    case invalidData(String)
    case parseError(String)
    
    public var errorDescription: String? {
        switch self {
        case .notFound(let detail):
            return "データが見つかりません: \(detail)"
        case .invalidData(let detail):
            return "データ形式が不正です: \(detail)"
        case .parseError(let detail):
            return "データの解析に失敗しました: \(detail)"
        }
    }
}

/// データ取得結果
public struct DataSourceResult<T> {
    public let items: [T]
    public let warnings: [String]
    
    public init(items: [T], warnings: [String] = []) {
        self.items = items
        self.warnings = warnings
    }
}

/// データソースプロトコル（CSV, API, DB など実装を問わない）
public protocol DataSource {
    associatedtype Item
    
    /// データを取得する
    func fetch() -> Result<DataSourceResult<Item>, DataSourceError>
}
