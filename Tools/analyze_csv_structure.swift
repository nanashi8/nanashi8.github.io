#!/usr/bin/env swift

// CSV詳細分析スクリプト
// 各CSVファイルの構造と固定列3の内容を詳細に分析

import Foundation

// MARK: - CSV分析

struct CSVAnalysis {
    let fileName: String
    let totalRows: Int
    let headerColumns: [String]
    let column3Name: String
    let sampleValues: [String]
    let uniqueValuesCount: Int
    let emptyValuesCount: Int
    let averageLength: Double
}

func analyzeCSV(filePath: String) -> CSVAnalysis? {
    guard let content = try? String(contentsOfFile: filePath, encoding: .utf8) else {
        return nil
    }
    
    let fileName = URL(fileURLWithPath: filePath).lastPathComponent
    let lines = content.components(separatedBy: .newlines).filter { !$0.isEmpty }
    
    guard lines.count > 1 else { return nil }
    
    // ヘッダー解析
    let headerLine = lines[0]
    let headers = headerLine.components(separatedBy: ",")
    let column3Name = headers.count >= 3 ? headers[2] : "(なし)"
    
    // データ行解析
    var column3Values: [String] = []
    var emptyCount = 0
    
    for line in lines.dropFirst() {
        let columns = line.components(separatedBy: ",")
        if columns.count >= 3 {
            let value = columns[2].trimmingCharacters(in: .whitespaces)
            column3Values.append(value)
            if value.isEmpty {
                emptyCount += 1
            }
        }
    }
    
    let uniqueValues = Set(column3Values)
    let averageLength = column3Values.isEmpty ? 0.0 : Double(column3Values.map { $0.count }.reduce(0, +)) / Double(column3Values.count)
    
    return CSVAnalysis(
        fileName: fileName,
        totalRows: lines.count - 1,
        headerColumns: headers,
        column3Name: column3Name,
        sampleValues: Array(column3Values.prefix(5)),
        uniqueValuesCount: uniqueValues.count,
        emptyValuesCount: emptyCount,
        averageLength: averageLength
    )
}

// MARK: - メイン処理

func main() {
    let divider = String(repeating: "=", count: 100)
    let subDivider = String(repeating: "-", count: 100)
    
    print(divider)
    print("CSV詳細分析レポート")
    print("作成日時: \(Date())")
    print(divider)
    print()
    
    let basePath = "/path/to/project/SimpleWord/SimpleWord/Resources"
    let csvFiles = [
        "\(basePath)/中学歴史.csv",
        "\(basePath)/中学古典単語.csv",
        "\(basePath)/中学英単語.csv",
        "\(basePath)/中学英会話.csv",
        "\(basePath)/xcode.csv"
    ]
    
    var analyses: [CSVAnalysis] = []
    var totalRowsAll = 0
    
    for csvFile in csvFiles {
        if let analysis = analyzeCSV(filePath: csvFile) {
            analyses.append(analysis)
            totalRowsAll += analysis.totalRows
        }
    }
    
    // 各CSVファイルの詳細レポート
    for analysis in analyses {
        print("📄 ファイル名: \(analysis.fileName)")
        print(subDivider)
        
        print("【基本情報】")
        print("  • データ行数: \(analysis.totalRows)行")
        print("  • 列数: \(analysis.headerColumns.count)列")
        print()
        
        print("【ヘッダー情報】")
        for (index, header) in analysis.headerColumns.enumerated() {
            let marker = index == 2 ? " ⭐️ [固定列3: 選択肢生成に使用]" : ""
            print("  列\(index + 1): \(header)\(marker)")
        }
        print()
        
        print("【固定列3の詳細】")
        print("  • 列名: \(analysis.column3Name)")
        print("  • ユニーク値数: \(analysis.uniqueValuesCount)")
        print("  • 空白値数: \(analysis.emptyValuesCount)")
        print("  • 平均文字数: \(String(format: "%.1f", analysis.averageLength))文字")
        print()
        
        print("【固定列3のサンプル値（最初の5件）】")
        for (index, value) in analysis.sampleValues.enumerated() {
            print("  \(index + 1). \(value)")
        }
        print()
        
        print("【CSV種類判定】")
        let csvType = detectCSVType(headers: analysis.headerColumns)
        print("  判定結果: \(csvType)")
        print("  説明: \(getCSVTypeDescription(csvType))")
        print()
        
        print()
    }
    
    // 全体サマリー
    print(divider)
    print("全体サマリー")
    print(divider)
    print()
    print("📊 統計情報")
    print("  • CSVファイル数: \(analyses.count)ファイル")
    print("  • 総データ行数: \(totalRowsAll)行")
    print("  • 総選択肢候補数: \(totalRowsAll)個")
    print()
    
    print("📋 各ファイルの行数")
    for analysis in analyses {
        let percentage = Double(analysis.totalRows) / Double(totalRowsAll) * 100
        print("  • \(analysis.fileName): \(analysis.totalRows)行 (\(String(format: "%.1f", percentage))%)")
    }
    print()
    
    print("✅ 検証結果")
    let allValid = analyses.allSatisfy { $0.emptyValuesCount == 0 }
    if allValid {
        print("  🎉 全CSVファイルで固定列3が正しく設定されています")
        print("  • 空白値: 0件")
        print("  • すべての行が選択肢として正しく表示されます")
    } else {
        print("  ⚠️  一部のCSVファイルに問題があります")
        for analysis in analyses where analysis.emptyValuesCount > 0 {
            print("  • \(analysis.fileName): \(analysis.emptyValuesCount)件の空白値")
        }
    }
    print()
    
    print(divider)
    print("分析完了")
    print(divider)
}

// MARK: - ヘルパー関数

func detectCSVType(headers: [String]) -> String {
    let headerString = headers.joined(separator: ",").lowercased()
    
    if headerString.contains("年号") && headerString.contains("登場人物") && headerString.contains("史実") {
        return "中学歴史"
    } else if headerString.contains("ひらがな") || headerString.contains("読み") {
        return "中学古典単語"
    } else if headerString.contains("カタカナ") || headerString.contains("発音") || headerString.contains("和訳") {
        return "中学英単語・英会話"
    } else {
        return "その他"
    }
}

func getCSVTypeDescription(_ type: String) -> String {
    switch type {
    case "中学歴史":
        return "固定列3は「史実名」- 歴史的出来事の名称が選択肢として表示されます"
    case "中学古典単語":
        return "固定列3は「意味」- 古典単語の現代語訳が選択肢として表示されます"
    case "中学英単語・英会話":
        return "固定列3は「和訳」- 英語表現の日本語訳が選択肢として表示されます"
    default:
        return "固定列3の内容が選択肢として表示されます"
    }
}

// スクリプト実行
main()
