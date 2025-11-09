// CSVLoader.swift
// CSV読み込みユーティリティ（QuestionItemRepositoryの薄いラッパー）
// - 何を: QuestionItemRepositoryへの簡単なアクセスを提供します。
// - なぜ: 既存コードとの互換性を保ちつつ、実装を統一するため。

import Foundation

/// CSV読み込みエラー
public enum CSVLoaderError: Error {
    case notFound
    case invalidFormat(String)
}

/// CSV読み込みユーティリティ
/// - Note: 内部的にQuestionItemRepositoryを使用しています。
public final class CSVLoader {
    public init() {}

    /// Bundle内のファイル名から読み込む（拡張子なし/ありどちらも可）
    /// - Parameter name: ファイル名
    /// - Returns: QuestionItemの配列
    /// - Throws: CSVLoaderError
    public func loadFromBundle(named name: String) throws -> [QuestionItem] {
        let base = name.replacingOccurrences(of: ".csv", with: "")
        let repository = QuestionItemRepository(fileName: base)
        switch repository.fetch() {
        case .success(let items):
            return items
        case .failure(let error):
            throw convertError(error)
        }
    }

    /// 任意のURLから読み込む
    /// - Parameters:
    ///   - url: CSVファイルのURL
    ///   - encoding: 文字エンコーディング（デフォルト: UTF-8）
    /// - Returns: QuestionItemの配列
    /// - Throws: CSVLoaderError
    public func load(from url: URL, encoding: String.Encoding = .utf8) throws -> [QuestionItem] {
        // ファイルが存在する場合は、ファイル名からRepositoryで読み込む
        let fileName = url.deletingPathExtension().lastPathComponent
        let repository = QuestionItemRepository(fileName: fileName)
        switch repository.fetch() {
        case .success(let items):
            return items
        case .failure(let error):
            throw convertError(error)
        }
    }
    
    // MARK: - Private
    
    /// DataSourceErrorをCSVLoaderErrorに変換
    private func convertError(_ error: DataSourceError) -> CSVLoaderError {
        switch error {
        case .notFound:
            return .notFound
        case .invalidData(let detail):
            return .invalidFormat(detail)
        case .parseError(let detail):
            return .invalidFormat(detail)
        }
    }
}
