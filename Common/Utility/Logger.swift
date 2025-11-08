// Logger.swift
// ログ管理
//
// 何を: 統一的なログ出力機能を提供
// なぜ: ログレベルを管理し、デバッグとリリースで出力を制御するため

import Foundation

/// ログレベル
public enum LogLevel {
    case debug
    case info
    case warning
    case error
}

/// ログユーティリティ
public struct Logger {
    
    /// ログを出力する
    /// - Parameters:
    ///   - message: メッセージ
    ///   - level: ログレベル
    public static func log(_ message: String, level: LogLevel = .info) {
        #if DEBUG
        let prefix: String
        switch level {
        case .debug: prefix = "🔍"
        case .info: prefix = "ℹ️"
        case .warning: prefix = "⚠️"
        case .error: prefix = "❌"
        }
        print("\(prefix) \(message)")
        #endif
    }
}
