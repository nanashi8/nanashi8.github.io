//
//  SimpleWordTests.swift
//  SimpleWordTests
//
//  Created by YUICHI NAKAMURA on 2025/10/06.
//

import Foundation
import Testing
@testable import SimpleWord

struct SimpleWordTests {

    @Test func csvRelatedFieldsParsing() async throws {
        // CSV ローダーがヘッダ行を尊重し、JPヘッダ「関連語」「関連分野」を正しく解釈できることを検証する
        // 自己完結のため、一時CSVを生成して読み込む
        let header = "語句,読み（ひらがな）,意味,語源等解説（日本語）,関連語と意味,関連分野,難易度"
        let row = "put on,プット オン,身に着ける,phrasal verb,put;on,学校;日常生活,初級"
        let csv = header + "\n" + row + "\n"

        let tmpURL: URL = try {
            let dir = URL(fileURLWithPath: NSTemporaryDirectory(), isDirectory: true)
            let file = dir.appendingPathComponent("test_related_fields.csv")
            try csv.write(to: file, atomically: true, encoding: .utf8)
            return file
        }()

        let (relatedFields, relatedWords): ([String], [String]) = try await MainActor.run {
            let loader = CSVLoader()
            let items = try loader.load(from: tmpURL)
            guard let first = items.first else {
                throw NSError(domain: "test", code: 1, userInfo: [NSLocalizedDescriptionKey: "CSVからアイテムが読み込めませんでした"]) }
            return (first.relatedFields, first.relatedWords)
        }

        // relatedFields はCSVの「関連分野」列からセミコロン区切りで複数トークンに分割される
        let expectedRelatedFields = ["学校", "日常生活"]
        if relatedFields != expectedRelatedFields {
            throw NSError(domain: "test", code: 2, userInfo: [NSLocalizedDescriptionKey: "relatedFields が期待値と異なります: \(relatedFields)"]) }

        // relatedWords もセミコロン区切りでパースされる（先頭行は "put;on"）
        let expectedRelatedWords = ["put", "on"]
        if relatedWords != expectedRelatedWords {
            throw NSError(domain: "test", code: 3, userInfo: [NSLocalizedDescriptionKey: "relatedWords が期待値と異なります: \(relatedWords)"]) }
    }

    @Test func csvParsesEmptyRelatedFieldsWhenHeaderMissing() async throws {
        // 目的: ヘッダに「関連分野」列が無い場合、relatedFields は空配列([])になることを検証する
        // ポイント: ヘッダ検出は日本語カラム名（語句/意味/読み）を含めば有効になる想定
        let header = "語句,読み（ひらがな）,意味,語源等解説（日本語）,関連語と意味,難易度"
        let row = "look after,ルック アフター,〜の世話をする,look + after,care for;take care,初級"
        let csv = header + "\n" + row + "\n"

        // 一時ファイルにCSVを書き出してからロードする（CSVLoader は URL 入力のため）
        let tmpURL: URL = try {
            let dir = URL(fileURLWithPath: NSTemporaryDirectory(), isDirectory: true)
            let file = dir.appendingPathComponent("test_no_related_fields.csv")
            try csv.write(to: file, atomically: true, encoding: .utf8)
            return file
        }()

        let (relatedFields, relatedWords): ([String], [String]) = try await MainActor.run {
            let loader = CSVLoader()
            let items = try loader.load(from: tmpURL)
            guard let first = items.first else {
                throw NSError(domain: "test", code: 10, userInfo: [NSLocalizedDescriptionKey: "一時CSVからアイテムが読み込めませんでした"]) }
            return (first.relatedFields, first.relatedWords)
        }

        // ヘッダに関連分野が無いため、空配列を期待
        if !relatedFields.isEmpty {
            throw NSError(domain: "test", code: 11, userInfo: [NSLocalizedDescriptionKey: "ヘッダ欠如時の relatedFields は空のはずですが: \(relatedFields)"]) }

        // 関連語はヘッダ「関連語」により正しくパースされる
        let expectedRelatedWords = ["care for", "take care"]
        if relatedWords != expectedRelatedWords {
            throw NSError(domain: "test", code: 12, userInfo: [NSLocalizedDescriptionKey: "関連語のパースが期待と異なります: \(relatedWords)"]) }
    }

    @Test func csvParsesHeadersInAnyOrder() async throws {
        // 目的: ヘッダー列の順序が入れ替わっても正しくフィールドが読み取れること
        // ヘッダー順をシャッフル（関連分野,関連語,意味,語句,読み,難易度,語源等解説）
        let header = "関連分野,関連語,意味,語句,読み,難易度,語源等解説"
        let row = "学校;日常生活,put;on,身に着ける,put on,プット オン,初級,phrasal verb"
        let csv = header + "\n" + row + "\n"

        let tmpURL: URL = try {
            let dir = URL(fileURLWithPath: NSTemporaryDirectory(), isDirectory: true)
            let file = dir.appendingPathComponent("test_header_any_order.csv")
            try csv.write(to: file, atomically: true, encoding: .utf8)
            return file
        }()

        let values = try await MainActor.run { () throws -> (String, String, String, String, [String], [String], String) in
            let loader = CSVLoader()
            let items = try loader.load(from: tmpURL)
            guard let first = items.first else { throw NSError(domain: "test", code: 20, userInfo: [NSLocalizedDescriptionKey: "CSVからアイテムが読み込めませんでした"]) }
            return (first.term, first.reading, first.meaning, first.etymology, first.relatedWords, first.relatedFields, first.difficulty)
        }
        let (term, reading, meaning, etymology, relatedWords, relatedFields, difficulty) = values

        // 語句/読み/意味/語源等解説
        if term != "put on" { throw NSError(domain: "test", code: 21, userInfo: [NSLocalizedDescriptionKey: "term が不正: \(term)"]) }
        if reading != "プット オン" { throw NSError(domain: "test", code: 22, userInfo: [NSLocalizedDescriptionKey: "reading が不正: \(reading)"]) }
        if meaning != "身に着ける" { throw NSError(domain: "test", code: 23, userInfo: [NSLocalizedDescriptionKey: "meaning が不正: \(meaning)"]) }
        if etymology != "phrasal verb" { throw NSError(domain: "test", code: 24, userInfo: [NSLocalizedDescriptionKey: "etymology が不正: \(etymology)"]) }
        if relatedWords != ["put", "on"] { throw NSError(domain: "test", code: 25, userInfo: [NSLocalizedDescriptionKey: "relatedWords が不正: \(relatedWords)"]) }
        if relatedFields != ["学校", "日常生活"] { throw NSError(domain: "test", code: 26, userInfo: [NSLocalizedDescriptionKey: "relatedFields が不正: \(relatedFields)"]) }
        if difficulty != "初級" { throw NSError(domain: "test", code: 27, userInfo: [NSLocalizedDescriptionKey: "difficulty が不正: \(difficulty)"]) }
    }

    @Test func bundleCSVsAreLoadable() async throws {
        // 目的: Resources/ に作成したCSVがバンドルから読み込めることを確認
        let names = ["中学英単語", "中学英会話"]
        for name in names {
            let (count, firstTerm): (Int, String) = try await MainActor.run {
                let loader = CSVLoader()
                let items = try loader.loadFromBundle(named: name)
                return (items.count, items.first?.term ?? "")
            }
            if count == 0 || firstTerm.isEmpty {
                throw NSError(domain: "test", code: 30, userInfo: [NSLocalizedDescriptionKey: "バンドルCSV \(name) の読み込みに失敗しました"]) }
        }
    }
}
