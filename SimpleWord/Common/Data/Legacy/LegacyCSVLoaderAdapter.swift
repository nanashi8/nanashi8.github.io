// LegacyCSVLoaderAdapter.swift
// 既存のCSVLoaderとの互換性を保つアダプター
//
// 何を: 新しいRepository構造を既存のインターフェースで利用可能にする
// なぜ: 段階的な移行を可能にし、既存コードを破壊しないため

import Foundation

/// 既存のCSVLoaderインターフェースを維持しつつ、新しいRepository構造を使用するアダプター
@available(*, deprecated, message: "新しいQuestionItemRepositoryを直接使用してください")
public final class LegacyCSVLoaderAdapter {
    
    public init() {}
    
    /// Bundle内のファイル名から読み込む（既存インターフェース互換）
    /// - Parameter name: ファイル名（拡張子なし）
    /// - Returns: QuestionItemの配列
    /// - Throws: CSVLoaderError
    public func loadFromBundle(named name: String) throws -> [QuestionItem] {
        let repository = QuestionItemRepository(fileName: name)
        
        switch repository.fetch() {
        case .success(let items):
            return items
        case .failure(let error):
            // 既存のエラー型に変換
            switch error {
            case .notFound:
                throw CSVLoaderError.notFound
            case .invalidData:
                throw CSVLoaderError.invalidFormat("invalid data")
            case .parseError:
                throw CSVLoaderError.invalidFormat("parse error")
            }
        }
    }
    
    /// 任意のURLから読み込む（既存インターフェース互換）
    /// - Parameters:
    ///   - url: CSVファイルのURL
    ///   - encoding: 文字エンコーディング
    /// - Returns: QuestionItemの配列
    /// - Throws: CSVLoaderError
    public func load(from url: URL, encoding: String.Encoding = .utf8) throws -> [QuestionItem] {
        // URLからファイル名を取得
        let fileName = url.deletingPathExtension().lastPathComponent
        let repository = QuestionItemRepository(fileName: fileName)
        
        switch repository.fetch() {
        case .success(let items):
            return items
        case .failure(let error):
            switch error {
            case .notFound:
                throw CSVLoaderError.notFound
            case .invalidData:
                throw CSVLoaderError.invalidFormat("invalid data")
            case .parseError:
                throw CSVLoaderError.invalidFormat("parse error")
            }
        }
    }
}
