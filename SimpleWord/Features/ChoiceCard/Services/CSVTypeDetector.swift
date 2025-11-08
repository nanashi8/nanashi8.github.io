//
//  CSVTypeDetector.swift
//  SimpleWord
//
//  Created by リファクタリング フェーズ3
//

// CSV種類判定サービス
// - 何を: ヘッダラベルからCSVの種類（歴史/古典/英語）を判定
// - なぜ: 判定ロジックを一元管理し、テスト可能にするため

import Foundation

/// CSV種類
enum CSVType {
    case history    // 中学歴史
    case classical  // 中学古典単語
    case english    // 中学英単語・英熟語・英会話・xcode
}

/// CSV種類を判定するサービス
struct CSVTypeDetector {
    
    /// ヘッダラベルからCSV種類を判定
    /// - Parameter headerLabels: CSVヘッダのマッピング（論理キー -> 表示ラベル）
    /// - Returns: 判定されたCSV種類
    static func detectCSVType(from headerLabels: [String: String]) -> CSVType {
        // etymologyラベルの内容で判定（最優先）
        if let etymologyLabel = headerLabels["etymology"] {
            let normalized = etymologyLabel.lowercased()
            if normalized.contains("用法") {
                return .classical  // 中学古典単語
            } else if normalized == "解説" {
                return .history  // 中学歴史
            } else if normalized.contains("語源") {
                return .english  // 英語系
            }
        }
        
        // termラベルの内容で判定
        if let termLabel = headerLabels["term"] {
            let normalized = termLabel.lowercased()
            if normalized.contains("年号") {
                return .history
            }
        }
        
        // readingラベルの内容で判定
        if let readingLabel = headerLabels["reading"] {
            let normalized = readingLabel.lowercased()
            if normalized.contains("登場人物") {
                return .history
            }
        }
        
        // meaningラベルの内容で判定
        if let meaningLabel = headerLabels["meaning"] {
            let normalized = meaningLabel.lowercased()
            if normalized.contains("史実") {
                return .history
            } else if normalized.contains("和訳") {
                return .english
            } else if normalized.contains("意味") {
                // readingラベルを再確認
                if let readingLabel = headerLabels["reading"] {
                    let readingNormalized = readingLabel.lowercased()
                    if readingNormalized.contains("発音") && !readingNormalized.contains("カタカナ") {
                        return .classical  // 中学古典単語（発音だけでカタカナの記載なし）
                    }
                }
            }
        }
        
        // デフォルトは英語系
        return .english
    }
    
    /// ヘッダラベルから表示用ラベルを取得
    /// - Parameters:
    ///   - key: 論理キー
    ///   - headerLabels: ヘッダラベルマップ
    ///   - fallback: デフォルトラベル
    /// - Returns: 表示用ラベル（末尾にコロンが付く）
    static func labelFor(_ key: String, in headerLabels: [String: String], fallback: String) -> String {
        if let header = headerLabels[key], !header.isEmpty {
            return header.hasSuffix(":") ? header : "\(header):"
        }
        return fallback
    }
}
