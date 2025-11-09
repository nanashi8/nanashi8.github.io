// QuestionItemRepository.swift
// QuestionItem用のリポジトリ
//
// 何を: CSV形式でのQuestionItem取得を提供
// なぜ: データ取得処理をビジネスロジックから分離し、テスタビリティを向上させるため

import Foundation

/// QuestionItemリポジトリ
public final class QuestionItemRepository: Repository {
    public typealias Entity = QuestionItem
    
    private let dataSource: CSVDataSource<QuestionItem>
    
    /// イニシャライザ（ヘッダ駆動型モード - デフォルト）
    /// - Parameters:
    ///   - fileName: CSVファイル名（拡張子なし）
    ///   - useHeaderDriven: ヘッダ駆動型を使用するか（デフォルト: true）
    public init(fileName: String, useHeaderDriven: Bool = true) {
        if useHeaderDriven {
            // ヘッダ駆動型モード: CSVのヘッダを最優先
            self.dataSource = CSVDataSource(
                fileName: fileName,
                headerDrivenParser: QuestionItemParser.makeHeaderDrivenParser()
            )
        } else {
            // 固定列順モード（後方互換性のため残す）
            self.dataSource = DataSourceFactory.makeCSVDataSource(
                fileName: fileName,
                columnCount: QuestionItemCSVSchema.standardColumnCount,
                parser: QuestionItemParser.makeParser()
            )
        }
    }
    
    /// 旧イニシャライザ（後方互換性のため残す）
    /// - Parameters:
    ///   - fileName: CSVファイル名（拡張子なし）
    ///   - columnCount: 期待する列数（無視される - ヘッダ駆動型に統一）
    @available(*, deprecated, message: "useHeaderDriven パラメータを使用してください")
    public convenience init(fileName: String, columnCount: Int) {
        self.init(fileName: fileName, useHeaderDriven: true)
    }
    
    /// DataSourceを直接注入するイニシャライザ（テスト用）
    public init(dataSource: CSVDataSource<QuestionItem>) {
        self.dataSource = dataSource
    }
    
    /// データを取得する
    public func fetch() -> Result<[QuestionItem], DataSourceError> {
        let result = dataSource.fetch()
        
        switch result {
        case .success(let data):
            // 警告をログ出力
            data.warnings.forEach { Logger.log($0, level: .warning) }
            Logger.log("データ読み込み成功: \(data.items.count)件", level: .info)
            return .success(data.items)
            
        case .failure(let error):
            Logger.log("データ読み込み失敗: \(error.localizedDescription)", level: .error)
            return .failure(error)
        }
    }
}
