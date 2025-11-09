// Parser.swift
// パース処理を独立させる
//
// 何を: データ変換処理の抽象化を提供
// なぜ: パース処理を再利用可能にし、テストを容易にするため

import Foundation

/// パーサープロトコル
public protocol Parser {
    associatedtype Input
    associatedtype Output

    /// 入力データを出力データに変換する
    func parse(_ input: Input) throws -> Output?
}

/// CSV行パーサー
public struct CSVLineParser<T>: Parser {
    public typealias Input = (lineNumber: Int, columns: [String])
    public typealias Output = T

    private let transform: (Int, [String]) throws -> T?

    public init(transform: @escaping (Int, [String]) throws -> T?) {
        self.transform = transform
    }

    public func parse(_ input: Input) throws -> T? {
        try transform(input.lineNumber, input.columns)
    }
}
