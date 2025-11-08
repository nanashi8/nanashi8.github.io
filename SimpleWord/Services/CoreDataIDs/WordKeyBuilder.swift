// WordKeyBuilder.swift
// - 何を: 行データから揺れに強い安定キーを作成します（NFC正規化・空白整形など）。
// - なぜ: 入力表記が多少違っても同じ語を同一視できるようにするため。

import Foundation

/// 行データから安定キーを生成するユーティリティ。
/// ・空白/改行を整形して揺れを抑える
/// ・Unicode 正規化（NFC）
/// ・将来の変更に備えてバージョン識別子を付ける
final class WordKeyBuilder: Sendable {
    static let shared = WordKeyBuilder()
    private init() {}

    /// term / reading / meaning / etymology から安定キーを生成
    nonisolated func makeStableKey(term: String, reading: String?, meaning: String, etymology: String?) -> String {
        let t = normalize(term)
        let r = normalize(reading)
        let m = normalize(meaning)
        let e = normalize(etymology)
        return "v1|t:\(t)|r:\(r)|m:\(m)|e:\(e)"
    }

    nonisolated private func normalize(_ s: String?) -> String {
        guard var v = s, !v.isEmpty else { return "" }
        v = v.replacingOccurrences(of: "\r\n", with: "\n")
             .replacingOccurrences(of: "\r", with: "\n")
        v = v.replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
        v = v.trimmingCharacters(in: .whitespacesAndNewlines)
        v = v.precomposedStringWithCanonicalMapping // NFC
        return v
    }
}
