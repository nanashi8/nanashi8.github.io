// RepositoryProtocol.swift
// データ取得を抽象化（実装方法を隠蔽）
//
// 何を: リポジトリの抽象インターフェースを提供
// なぜ: データ取得処理をビジネスロジックから分離し、テスタビリティを向上させるため

import Foundation

/// リポジトリプロトコル
public protocol Repository {
    associatedtype Entity
    
    /// データを取得する
    func fetch() -> Result<[Entity], DataSourceError>
}
