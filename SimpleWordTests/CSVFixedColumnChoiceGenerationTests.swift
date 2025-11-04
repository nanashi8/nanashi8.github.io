// CSVFixedColumnChoiceGenerationTests.swift
// CSV固定列順での選択肢生成統合テスト

import XCTest
@testable import SimpleWord

final class CSVFixedColumnChoiceGenerationTests: XCTestCase {
    
    var loader: CSVLoader!
    var generator: QuizQuestionGenerator!
    
    override func setUp() {
        super.setUp()
        loader = CSVLoader()
        generator = QuizQuestionGenerator()
    }
    
    override func tearDown() {
        loader = nil
        generator = nil
        super.tearDown()
    }
    
    // MARK: - 統合テスト：CSV読み込み + 選択肢生成
    
    /// 中学英会話CSVから読み込んだデータで選択肢生成テスト
    func testGenerateChoicesFromEnglishConversationCSV() throws {
        // Given: 中学英会話CSVを読み込む
        let items = try loader.loadFromBundle(named: "中学英会話")
        
        XCTAssertFalse(items.isEmpty, "CSVデータが読み込まれている")
        XCTAssertTrue(items.count >= 2, "少なくとも2つのアイテムが必要")
        
        // 最初のアイテムを確認
        let firstItem = items[0]
        print("📝 First item - term: \(firstItem.term), meaning: \(firstItem.meaning)")
        print("📝 rawColumns count: \(firstItem.rawColumns.count)")
        if firstItem.rawColumns.count >= 3 {
            print("📝 rawColumns[2] (固定列3): \(firstItem.rawColumns[2])")
        }
        
        XCTAssertFalse(firstItem.rawColumns.isEmpty, "rawColumnsが保存されている")
        XCTAssertTrue(firstItem.rawColumns.count >= 3, "少なくとも3列のデータが存在する")
        
        // When: 選択肢を生成
        let result = generator.generateChoices(
            correctItem: firstItem,
            allItems: items,
            numberOfChoices: 4
        )
        
        // Then: 選択肢が生成されている
        XCTAssertEqual(result.choices.count, 4, "4つの選択肢が生成される")
        
        // 正解の選択肢を確認
        let correctChoice = result.choices.first { $0.id == result.correctAnswerID }
        XCTAssertNotNil(correctChoice, "正解の選択肢が存在する")
        
        // 固定列3（和訳）が使用されていることを確認
        if firstItem.rawColumns.count >= 3 {
            let expectedLabel = firstItem.rawColumns[2]
            XCTAssertEqual(correctChoice?.label, expectedLabel, 
                          "選択肢は固定列3（和訳）を使用する: 期待=\(expectedLabel), 実際=\(correctChoice?.label ?? "nil")")
            
            print("✅ 正解の選択肢: \(correctChoice?.label ?? "nil")")
            print("✅ 固定列3の値: \(expectedLabel)")
        }
        
        // すべての選択肢を表示
        print("\n📋 生成された選択肢:")
        for (index, choice) in result.choices.enumerated() {
            let marker = choice.id == result.correctAnswerID ? "✓ (正解)" : ""
            print("  \(index + 1). \(choice.label) \(marker)")
        }
    }
    
    /// 中学古典単語CSVから読み込んだデータで選択肢生成テスト
    func testGenerateChoicesFromClassicalJapaneseCSV() throws {
        // Given: 中学古典単語CSVを読み込む
        let items = try loader.loadFromBundle(named: "中学古典単語")
        
        XCTAssertFalse(items.isEmpty, "CSVデータが読み込まれている")
        XCTAssertTrue(items.count >= 2, "少なくとも2つのアイテムが必要")
        
        // 最初のアイテムを確認
        let firstItem = items[0]
        print("📝 First item - term: \(firstItem.term), meaning: \(firstItem.meaning)")
        print("📝 rawColumns count: \(firstItem.rawColumns.count)")
        if firstItem.rawColumns.count >= 3 {
            print("📝 rawColumns[2] (固定列3): \(firstItem.rawColumns[2])")
        }
        
        XCTAssertFalse(firstItem.rawColumns.isEmpty, "rawColumnsが保存されている")
        XCTAssertTrue(firstItem.rawColumns.count >= 3, "少なくとも3列のデータが存在する")
        
        // When: 選択肢を生成
        let result = generator.generateChoices(
            correctItem: firstItem,
            allItems: items,
            numberOfChoices: 4
        )
        
        // Then: 選択肢が生成されている
        XCTAssertEqual(result.choices.count, 4, "4つの選択肢が生成される")
        
        // 正解の選択肢を確認
        let correctChoice = result.choices.first { $0.id == result.correctAnswerID }
        XCTAssertNotNil(correctChoice, "正解の選択肢が存在する")
        
        // 固定列3（意味）が使用されていることを確認
        if firstItem.rawColumns.count >= 3 {
            let expectedLabel = firstItem.rawColumns[2]
            XCTAssertEqual(correctChoice?.label, expectedLabel, 
                          "選択肢は固定列3（意味）を使用する: 期待=\(expectedLabel), 実際=\(correctChoice?.label ?? "nil")")
            
            print("✅ 正解の選択肢: \(correctChoice?.label ?? "nil")")
            print("✅ 固定列3の値: \(expectedLabel)")
        }
        
        // すべての選択肢を表示
        print("\n📋 生成された選択肢:")
        for (index, choice) in result.choices.enumerated() {
            let marker = choice.id == result.correctAnswerID ? "✓ (正解)" : ""
            print("  \(index + 1). \(choice.label) \(marker)")
        }
    }
    
    /// 選択肢がヘッダ変換で汚染されていないことを確認
    func testChoicesNotContaminatedByHeaderConversion() throws {
        // Given: CSVを読み込む
        let items = try loader.loadFromBundle(named: "中学英会話")
        
        guard items.count >= 3 else {
            XCTFail("テストには少なくとも3つのアイテムが必要")
            return
        }
        
        let firstItem = items[0]
        
        // When: 選択肢を生成
        let result = generator.generateChoices(
            correctItem: firstItem,
            allItems: items,
            numberOfChoices: 3
        )
        
        // Then: 選択肢がCSVの生データ（固定列3）を使用していることを確認
        for choice in result.choices {
            guard let item = choice.item else { continue }
            
            // 選択肢ラベルが固定列3と一致することを確認
            if item.rawColumns.count >= 3 {
                let expectedFromRawColumn = item.rawColumns[2]
                XCTAssertEqual(choice.label, expectedFromRawColumn,
                              "選択肢は固定列3のデータを使用し、ヘッダ変換で汚染されていない")
                
                // meaningフィールドと異なる場合は警告を出す（デバッグ用）
                if choice.label != item.meaning {
                    print("⚠️ 注意: rawColumns[2]=\(expectedFromRawColumn), meaning=\(item.meaning)")
                }
            }
        }
    }
}
