// CSVDocument.swift
// 共有/エクスポート用の簡易CSVドキュメント（FileDocument）
// - 何を: CSVデータを外部へ共有/保存できるようにラップします。
// - なぜ: iOSの標準共有UIを使って簡単にバックアップ/送付するため。

import SwiftUI
import UniformTypeIdentifiers

// シェア/エクスポート用の簡易CSVドキュメント
struct CSVDocument: FileDocument {
    static var readableContentTypes: [UTType] { [.commaSeparatedText] }

    var data: Data
    var suggestedName: String?

    init(data: Data, suggestedName: String? = nil) {
        self.data = data
        self.suggestedName = suggestedName
    }

    init(fileURL: URL) throws {
        self.data = try Data(contentsOf: fileURL)
        self.suggestedName = fileURL.deletingPathExtension().lastPathComponent
    }

    init(configuration: ReadConfiguration) throws {
        // configuration.file は FileWrapper 型（非 Optional）なので、直接利用する
        let fileWrapper = configuration.file
        self.data = fileWrapper.regularFileContents ?? Data()
        self.suggestedName = nil
    }

    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper {
        return FileWrapper(regularFileWithContents: data)
    }
}
