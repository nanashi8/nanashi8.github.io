// IDFactory.swift
// 決定論的ハッシュ/UUIDを作る
// - 何を: 入力テキストを正規化し、衝突しにくい軽量ハッシュやUUIDを生成します。
// - なぜ: CSVやIDマップで同一語を安定して識別するため。

import Foundation
import CryptoKit

/// 単語・意味・語源などから決定論的なハッシュ（軽量な識別子）を作る
/// - 出力は先頭16バイト（32文字の16進文字列）を返す。衝突は実務上極めて稀。
public struct IDFactory {
    /// term, meaning, etymology などを正規化して SHA256 -> 先頭16バイトを hex で返す
    /// - Parameters:
    ///   - term: 単語（例: "apple"）
    ///   - meaning: 意味テキスト
    ///   - etymology: 語源（nil 可）
    ///   - lang: 言語コード（任意）
    ///   - source: 出典やデータセット名（任意）
    /// - Returns: 32文字の hex 文字列（lowercase）
    public static func makeDeterministicHash(term: String, meaning: String, etymology: String? = nil, lang: String? = nil, source: String? = nil) -> String {
        let t = canonicalize(term)
        let m = canonicalize(meaning)
        let e = canonicalize(etymology ?? "")
        let l = canonicalize(lang ?? "")
        let s = canonicalize(source ?? "")
        // 長さプレフィックスで結合して曖昧さを排除
        let parts = [t, m, e, l, s]
        let joined = parts.map { "\($0.count)#" + $0 }.joined(separator: "|")
        let hash = SHA256.hash(data: Data(joined.utf8))
        return hash.prefix(16).map { String(format: "%02x", $0) }.joined()
    }

    /// UUID を生成（必要ならここで別種の ID に変える）
    public static func makeUUID() -> String {
        return UUID().uuidString
    }

    // MARK: - Helpers
    private static func canonicalize(_ s: String) -> String {
        // Unicode 正規化(NFC) + 小文字化 + trim + 連続空白を1つに
        let nfc = (s as NSString).precomposedStringWithCanonicalMapping
        let lowered = nfc.lowercased()
        let trimmed = lowered.trimmingCharacters(in: .whitespacesAndNewlines)
        let collapsed = trimmed
            .components(separatedBy: .whitespacesAndNewlines)
            .filter { !$0.isEmpty }
            .joined(separator: " ")
        return collapsed
    }
}
