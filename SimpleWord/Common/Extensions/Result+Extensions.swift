// Result+Extensions.swift
// Result型の拡張でエラーハンドリングを簡潔に
//
// 何を: Result型の便利メソッドを提供
// なぜ: エラーハンドリングを統一し、コードの可読性を向上させるため

import Foundation

extension Result {
    
    /// 成功時にクロージャを実行
    /// - Parameter perform: 成功時に実行するクロージャ
    /// - Returns: 自身を返す（チェーン可能）
    @discardableResult
    public func onSuccess(_ perform: (Success) -> Void) -> Self {
        if case .success(let value) = self {
            perform(value)
        }
        return self
    }
    
    /// 失敗時にクロージャを実行
    /// - Parameter perform: 失敗時に実行するクロージャ
    /// - Returns: 自身を返す（チェーン可能）
    @discardableResult
    public func onFailure(_ perform: (Failure) -> Void) -> Self {
        if case .failure(let error) = self {
            perform(error)
        }
        return self
    }
}
