// QuestionItemRepository.swift
// QuestionItem用のリポジトリ
//
// 何を: CSV形式でのQuestionItem取得を提供（ヘッダ駆動型のみ）
// なぜ: データ取得処理をビジネスロジックから分離し、テスタビリティを向上させるため

import Foundation

/// QuestionItemリポジトリ（ヘッダ駆動型CSV読み込み）
public final class QuestionItemRepository: Repository {
    public typealias Entity = QuestionItem
    
    private let dataSource: CSVDataSource<QuestionItem>
    
    /// イニシャライザ（ヘッダ駆動型）
    /// - Parameter fileName: CSVファイル名（拡張子なし）
    public init(fileName: String) {
        // ヘッダ駆動型モード: CSVのヘッダを最優先
        self.dataSource = CSVDataSource(
            fileName: fileName,
            headerDrivenParser: QuestionItemParser.makeHeaderDrivenParser()
        )
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
