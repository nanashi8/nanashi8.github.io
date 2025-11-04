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
    
    /// 中学英熟語CSVから読み込んだデータで選択肢生成テスト
    func testGenerateChoicesFromEnglishIdiomCSV() throws {
        // Given: 中学英熟語CSVを読み込む
        let items = try loader.loadFromBundle(named: "中学英熟語")
        
        XCTAssertFalse(items.isEmpty, "CSVデータが読み込まれている")
        XCTAssertTrue(items.count >= 2, "少なくとも2つのアイテムが必要")
        
        // 最初の3つのアイテムを詳細に確認
        for i in 0..<min(3, items.count) {
            let item = items[i]
            print("\n📝 Item \(i+1):")
            print("  term: \(item.term)")
            print("  reading: \(item.reading)")
            print("  meaning: \(item.meaning)")
            print("  rawColumns count: \(item.rawColumns.count)")
            
            if item.rawColumns.count >= 3 {
                print("  rawColumns[0] (語句): \(item.rawColumns[0])")
                print("  rawColumns[1] (発音): \(item.rawColumns[1])")
                print("  rawColumns[2] (和訳): \(item.rawColumns[2])")
                print("  rawColumns[3] (語源等解説): \(item.rawColumns.count >= 4 ? item.rawColumns[3] : "N/A")")
            }
        }
        
        let firstItem = items[0]
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
            
            print("\n✅ 正解の選択肢: \(correctChoice?.label ?? "nil")")
            print("✅ 固定列3の値: \(expectedLabel)")
            print("✅ meaningフィールド: \(firstItem.meaning)")
            
            // meaningフィールドと比較
            if correctChoice?.label == firstItem.meaning {
                print("✅ 選択肢とmeaningフィールドが一致")
            } else {
                print("⚠️ 選択肢とmeaningフィールドが異なる - これは正常（ヘッダ駆動型の影響）")
            }
        }
        
        // すべての選択肢を表示
        print("\n📋 生成された選択肢:")
        for (index, choice) in result.choices.enumerated() {
            let marker = choice.id == result.correctAnswerID ? "✓ (正解)" : ""
            print("  \(index + 1). \(choice.label) \(marker)")
        }
        
        // 各選択肢がrawColumns[2]を使用していることを確認
        for choice in result.choices {
            guard let item = choice.item else { continue }
            if item.rawColumns.count >= 3 {
                XCTAssertEqual(choice.label, item.rawColumns[2],
                              "すべての選択肢が固定列3を使用している")
            }
        }
    }
    
    /// 中学英熟語CSV全件で選択肢生成が正しく動作するかテスト
    func testGenerateChoicesFromAllEnglishIdioms() throws {
        // Given: 中学英熟語CSVを読み込む
        let items = try loader.loadFromBundle(named: "中学英熟語")
        
        XCTAssertFalse(items.isEmpty, "CSVデータが読み込まれている")
        print("\n📊 中学英熟語全件テスト開始: \(items.count)件")
        
        var successCount = 0
        var failureCount = 0
        var errors: [(index: Int, item: QuestionItem, error: String)] = []
        
        // When: 全アイテムについて選択肢生成をテスト
        for (index, item) in items.enumerated() {
            // rawColumnsの検証
            guard !item.rawColumns.isEmpty else {
                let error = "rawColumnsが空"
                errors.append((index, item, error))
                failureCount += 1
                print("❌ \(index + 1). \(item.term): \(error)")
                continue
            }
            
            guard item.rawColumns.count >= 3 else {
                let error = "rawColumnsが3列未満（\(item.rawColumns.count)列）"
                errors.append((index, item, error))
                failureCount += 1
                print("❌ \(index + 1). \(item.term): \(error)")
                continue
            }
            
            // 選択肢生成
            let result = generator.generateChoices(
                correctItem: item,
                allItems: items,
                numberOfChoices: 4
            )
            
            // 選択肢数の検証
            guard result.choices.count == 4 else {
                let error = "選択肢数が不正（\(result.choices.count)個）"
                errors.append((index, item, error))
                failureCount += 1
                print("❌ \(index + 1). \(item.term): \(error)")
                continue
            }
            
            // 正解の選択肢を検証
            guard let correctChoice = result.choices.first(where: { $0.id == result.correctAnswerID }) else {
                let error = "正解の選択肢が見つからない"
                errors.append((index, item, error))
                failureCount += 1
                print("❌ \(index + 1). \(item.term): \(error)")
                continue
            }
            
            // 固定列3が使用されているか検証
            let expectedLabel = item.rawColumns[2]
            guard correctChoice.label == expectedLabel else {
                let error = "選択肢が固定列3と不一致（期待: \(expectedLabel), 実際: \(correctChoice.label)）"
                errors.append((index, item, error))
                failureCount += 1
                print("❌ \(index + 1). \(item.term): \(error)")
                continue
            }
            
            // 全ての選択肢がrawColumns[2]を使用しているか検証
            var allChoicesValid = true
            for choice in result.choices {
                guard let choiceItem = choice.item else { continue }
                if choiceItem.rawColumns.count >= 3 {
                    if choice.label != choiceItem.rawColumns[2] {
                        allChoicesValid = false
                        break
                    }
                }
            }
            
            if !allChoicesValid {
                let error = "一部の選択肢が固定列3を使用していない"
                errors.append((index, item, error))
                failureCount += 1
                print("❌ \(index + 1). \(item.term): \(error)")
                continue
            }
            
            // 成功
            successCount += 1
            if index < 3 || index % 10 == 0 {
                print("✅ \(index + 1). \(item.term) → \(correctChoice.label)")
            }
        }
        
        // Then: 結果を出力
        print("\n" + String(repeating: "=", count: 60))
        print("📊 テスト結果:")
        print("   総数: \(items.count)件")
        print("   成功: \(successCount)件 (\(String(format: "%.1f", Double(successCount) / Double(items.count) * 100))%)")
        print("   失敗: \(failureCount)件 (\(String(format: "%.1f", Double(failureCount) / Double(items.count) * 100))%)")
        print(String(repeating: "=", count: 60))
        
        if !errors.isEmpty {
            print("\n❌ 失敗した項目:")
            for (index, item, error) in errors.prefix(10) {
                print("   \(index + 1). \(item.term): \(error)")
            }
            if errors.count > 10 {
                print("   ... 他 \(errors.count - 10)件")
            }
        }
        
        // すべて成功することを検証
        XCTAssertEqual(failureCount, 0, "\(failureCount)件の失敗がありました")
        XCTAssertEqual(successCount, items.count, "全\(items.count)件が成功すること")
    }
}
