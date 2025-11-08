#!/usr/bin/env swift

// CSV選択肢生成テストスクリプト
// 目的: Resources/内の全CSVファイルを読み込み、各行が正しく選択肢として表示されるかテスト

import Foundation

// MARK: - CSVパーサー

struct CSVRow {
    let lineNumber: Int
    let columns: [String]
    let fileName: String
}

func parseCSV(filePath: String) -> [CSVRow] {
    guard let content = try? String(contentsOfFile: filePath, encoding: .utf8) else {
        print("❌ ファイル読み込みエラー: \(filePath)")
        return []
    }
    
    let fileName = URL(fileURLWithPath: filePath).lastPathComponent
    var rows: [CSVRow] = []
    let lines = content.components(separatedBy: .newlines)
    
    for (index, line) in lines.enumerated() {
        // 空行やヘッダーをスキップ
        if index == 0 || line.trimmingCharacters(in: .whitespaces).isEmpty {
            continue
        }
        
        let columns = line.components(separatedBy: ",")
        rows.append(CSVRow(lineNumber: index + 1, columns: columns, fileName: fileName))
    }
    
    return rows
}

// MARK: - テスト関数

struct TestResult {
    let fileName: String
    let lineNumber: Int
    let success: Bool
    let message: String
    let column3Value: String?
}

func testCSVRow(row: CSVRow) -> TestResult {
    // 固定列3（インデックス2）の存在確認
    guard row.columns.count >= 3 else {
        return TestResult(
            fileName: row.fileName,
            lineNumber: row.lineNumber,
            success: false,
            message: "❌ 列数不足（期待: 3列以上、実際: \(row.columns.count)列）",
            column3Value: nil
        )
    }
    
    let column3 = row.columns[2].trimmingCharacters(in: .whitespaces)
    
    // 固定列3が空でないことを確認
    if column3.isEmpty {
        return TestResult(
            fileName: row.fileName,
            lineNumber: row.lineNumber,
            success: false,
            message: "❌ 固定列3が空です",
            column3Value: column3
        )
    }
    
    // 成功
    return TestResult(
        fileName: row.fileName,
        lineNumber: row.lineNumber,
        success: true,
        message: "✅ OK",
        column3Value: column3
    )
}

// MARK: - メイン処理

func main() {
    print("=" * 80)
    print("CSV選択肢生成テスト")
    print("=" * 80)
    print()
    
    // CSVファイルのパス
    let basePath = "/Users/yuichinakamura/Documents/20251006_002/SimpleWord/SimpleWord/Resources"
    let csvFiles = [
        "\(basePath)/中学歴史.csv",
        "\(basePath)/中学古典単語.csv",
        "\(basePath)/中学英単語.csv",
        "\(basePath)/中学英会話.csv",
        "\(basePath)/xcode.csv"
    ]
    
    var allResults: [TestResult] = []
    var totalTests = 0
    var successTests = 0
    var failureTests = 0
    
    // 各CSVファイルをテスト
    for csvFile in csvFiles {
        let fileName = URL(fileURLWithPath: csvFile).lastPathComponent
        print("📄 テスト開始: \(fileName)")
        print("-" * 80)
        
        let rows = parseCSV(filePath: csvFile)
        print("   行数: \(rows.count)")
        
        var fileSuccessCount = 0
        var fileFailureCount = 0
        
        for row in rows {
            let result = testCSVRow(row: row)
            allResults.append(result)
            totalTests += 1
            
            if result.success {
                successTests += 1
                fileSuccessCount += 1
            } else {
                failureTests += 1
                fileFailureCount += 1
                // エラーの場合は詳細を出力
                print("   行\(result.lineNumber): \(result.message)")
            }
        }
        
        print("   ✅ 成功: \(fileSuccessCount)")
        print("   ❌ 失敗: \(fileFailureCount)")
        print()
    }
    
    // サマリー
    print("=" * 80)
    print("テスト結果サマリー")
    print("=" * 80)
    print("総テスト数: \(totalTests)")
    print("✅ 成功: \(successTests)")
    print("❌ 失敗: \(failureTests)")
    print()
    
    if failureTests == 0 {
        print("🎉 全テスト成功！")
        print("すべてのCSV行が正しく選択肢として表示されます。")
    } else {
        print("⚠️  \(failureTests)件の問題が見つかりました。")
        print()
        print("問題のある行:")
        print("-" * 80)
        
        for result in allResults where !result.success {
            print("[\(result.fileName)] 行\(result.lineNumber): \(result.message)")
        }
    }
    
    print()
    
    // 各CSVファイルの固定列3のサンプル表示（最初の3行）
    print("=" * 80)
    print("固定列3（選択肢テキスト）のサンプル")
    print("=" * 80)
    
    for csvFile in csvFiles {
        let fileName = URL(fileURLWithPath: csvFile).lastPathComponent
        let rows = parseCSV(filePath: csvFile)
        
        print()
        print("📄 \(fileName)")
        print("-" * 80)
        
        for (index, row) in rows.prefix(3).enumerated() {
            if row.columns.count >= 3 {
                print("   \(index + 1). \(row.columns[2])")
            }
        }
    }
    
    print()
    print("=" * 80)
    print("テスト完了")
    print("=" * 80)
}

// Stringの繰り返し演算子
func * (left: String, right: Int) -> String {
    return String(repeating: left, count: right)
}

// スクリプト実行
main()
