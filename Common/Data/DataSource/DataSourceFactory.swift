// DataSourceFactory.swift
// DataSource生成を一元管理
//
// 何を: DataSourceの生成ロジックを集約
// なぜ: DataSource生成を統一し、テスト時のモック注入を容易にするため

import Foundation

/// DataSourceファクトリ
public enum DataSourceFactory {

    /// CSV DataSource を生成
    public static func makeCSVDataSource<T>(
        fileName: String,
        columnCount: Int,
        parser: CSVLineParser<T>
    ) -> CSVDataSource<T> {
        CSVDataSource(
            fileName: fileName,
            columnCount: columnCount,
            parser: { lineNumber, columns in
                try parser.parse((lineNumber: lineNumber, columns: columns))
            }
        )
    }

    /// テスト用モックDataSourceを生成（テスト時に使用）
    public static func makeMockDataSource<T>(items: [T]) -> MockDataSource<T> {
        MockDataSource(items: items)
    }
}

/// テスト用モックDataSource
public final class MockDataSource<T>: DataSource {
    public typealias Item = T

    private let items: [T]

    public init(items: [T]) {
        self.items = items
    }

    public func fetch() -> Result<DataSourceResult<T>, DataSourceError> {
        .success(DataSourceResult(items: items))
    }
}
