// QuizQuestionGeneratorTests.swift
// 固定列順での選択肢生成テスト

import XCTest
@testable import SimpleWord

final class QuizQuestionGeneratorTests: XCTestCase {
    
    var generator: QuizQuestionGenerator!
    
    override func setUp() {
        super.setUp()
        generator = QuizQuestionGenerator()
    }
    
    override func tearDown() {
        generator = nil
        super.tearDown()
    }
    
    // MARK: - 固定列順での選択肢生成テスト
    
    /// 固定列3（rawColumns[2]）を使用して選択肢が生成されることを確認
    func testGenerateChoicesUsesFixedColumn3() {
        // Given: rawColumnsを持つQuestionItemを作成
        let item1 = QuestionItem(
            term: "語句1",
            reading: "読み1",
            meaning: "意味1（meaningフィールド）",
            etymology: "解説1",
            relatedWordsCSV: "",
            relatedFieldsCSV: "",
            difficulty: "1",
            rawColumns: ["語句1", "読み1", "固定列3の値1", "解説1", "", "", "1"],
            id: UUID()
        )
        
        let item2 = QuestionItem(
            term: "語句2",
            reading: "読み2",
            meaning: "意味2（meaningフィールド）",
            etymology: "解説2",
            relatedWordsCSV: "",
            relatedFieldsCSV: "",
            difficulty: "1",
            rawColumns: ["語句2", "読み2", "固定列3の値2", "解説2", "", "", "1"],
            id: UUID()
        )
        
        let item3 = QuestionItem(
            term: "語句3",
            reading: "読み3",
            meaning: "意味3（meaningフィールド）",
            etymology: "解説3",
            relatedWordsCSV: "",
            relatedFieldsCSV: "",
            difficulty: "1",
            rawColumns: ["語句3", "読み3", "固定列3の値3", "解説3", "", "", "1"],
            id: UUID()
        )
        
        let allItems = [item1, item2, item3]
        
        // When: 選択肢を生成
        let result = generator.generateChoices(
            correctItem: item1,
            allItems: allItems,
            numberOfChoices: 3
        )
        
        // Then: 正解の選択肢が固定列3の値を使用していることを確認
        let correctChoice = result.choices.first { $0.id == result.correctAnswerID }
        XCTAssertNotNil(correctChoice, "正解の選択肢が存在する")
        XCTAssertEqual(correctChoice?.label, "固定列3の値1", "正解の選択肢は固定列3の値を使用する")
        XCTAssertNotEqual(correctChoice?.label, "意味1（meaningフィールド）", "meaningフィールドは使用しない")
        
        // 不正解の選択肢も固定列3の値を使用していることを確認
        let incorrectChoices = result.choices.filter { $0.id != result.correctAnswerID }
        let incorrectLabels = incorrectChoices.map { $0.label }
        XCTAssertTrue(incorrectLabels.contains("固定列3の値2") || incorrectLabels.contains("固定列3の値3"),
                     "不正解の選択肢も固定列3の値を使用する")
    }
    
    /// rawColumnsがない場合はmeaningフィールドにフォールバックすることを確認
    func testGenerateChoicesFallbackToMeaning() {
        // Given: rawColumnsを持たないQuestionItem（後方互換性）
        let item1 = QuestionItem(
            term: "語句1",
            reading: "読み1",
            meaning: "意味1",
            etymology: "解説1",
            relatedWordsCSV: "",
            relatedFieldsCSV: "",
            difficulty: "1",
            rawColumns: [],  // 空のrawColumns
            id: UUID()
        )
        
        let item2 = QuestionItem(
            term: "語句2",
            reading: "読み2",
            meaning: "意味2",
            etymology: "解説2",
            relatedWordsCSV: "",
            relatedFieldsCSV: "",
            difficulty: "1",
            rawColumns: [],
            id: UUID()
        )
        
        let allItems = [item1, item2]
        
        // When: 選択肢を生成
        let result = generator.generateChoices(
            correctItem: item1,
            allItems: allItems,
            numberOfChoices: 2
        )
        
        // Then: meaningフィールドにフォールバックすることを確認
        let correctChoice = result.choices.first { $0.id == result.correctAnswerID }
        XCTAssertNotNil(correctChoice, "正解の選択肢が存在する")
        XCTAssertEqual(correctChoice?.label, "意味1", "rawColumnsがない場合はmeaningフィールドを使用する")
    }
    
    /// 実際のCSVデータ形式でのテスト（中学英会話）
    func testGenerateChoicesWithRealCSVData() {
        // Given: 実際のCSV形式のデータ
        let item1 = QuestionItem(
            term: "Hello!",
            reading: "ハロー",
            meaning: "こんにちは",
            etymology: "英語の挨拶の定番",
            relatedWordsCSV: "Hi:やあ",
            relatedFieldsCSV: "感情",
            difficulty: "1",
            rawColumns: ["Hello!", "ハロー", "こんにちは", "英語の挨拶の定番", "Hi:やあ", "感情", "1"],
            id: UUID()
        )
        
        let item2 = QuestionItem(
            term: "How are you?",
            reading: "ハウ アー ユー",
            meaning: "元気ですか",
            etymology: "相手の体調や気分を尋ねる表現",
            relatedWordsCSV: "What's up?:調子はどう？",
            relatedFieldsCSV: "文法・表現",
            difficulty: "1",
            rawColumns: ["How are you?", "ハウ アー ユー", "元気ですか", "相手の体調や気分を尋ねる表現", "What's up?:調子はどう？", "文法・表現", "1"],
            id: UUID()
        )
        
        let allItems = [item1, item2]
        
        // When: 選択肢を生成
        let result = generator.generateChoices(
            correctItem: item1,
            allItems: allItems,
            numberOfChoices: 2
        )
        
        // Then: 固定列3（和訳）が選択肢として使用されることを確認
        let correctChoice = result.choices.first { $0.id == result.correctAnswerID }
        XCTAssertEqual(correctChoice?.label, "こんにちは", "和訳（列3）が選択肢として使用される")
        
        let allLabels = result.choices.map { $0.label }
        XCTAssertTrue(allLabels.contains("こんにちは"), "選択肢に「こんにちは」が含まれる")
        XCTAssertTrue(allLabels.contains("元気ですか"), "選択肢に「元気ですか」が含まれる")
    }
    
    /// 実際のCSVデータ形式でのテスト（中学古典単語）
    func testGenerateChoicesWithClassicalJapaneseCSVData() {
        // Given: 中学古典単語のCSV形式のデータ
        let item1 = QuestionItem(
            term: "いと",
            reading: "いと",
            meaning: "とても",
            etymology: "古語で強調を表す副詞",
            relatedWordsCSV: "いみじ:非常に",
            relatedFieldsCSV: "家族",
            difficulty: "1",
            rawColumns: ["いと", "いと", "とても", "古語で強調を表す副詞", "いみじ:非常に", "家族", "1"],
            id: UUID()
        )
        
        let item2 = QuestionItem(
            term: "あはれ",
            reading: "あはれ",
            meaning: "しみじみとした情趣",
            etymology: "感動や哀愁を表す古語",
            relatedWordsCSV: "かなしい:悲しい",
            relatedFieldsCSV: "交通",
            difficulty: "2",
            rawColumns: ["あはれ", "あはれ", "しみじみとした情趣", "感動や哀愁を表す古語", "かなしい:悲しい", "交通", "2"],
            id: UUID()
        )
        
        let allItems = [item1, item2]
        
        // When: 選択肢を生成
        let result = generator.generateChoices(
            correctItem: item1,
            allItems: allItems,
            numberOfChoices: 2
        )
        
        // Then: 固定列3（意味）が選択肢として使用されることを確認
        let correctChoice = result.choices.first { $0.id == result.correctAnswerID }
        XCTAssertEqual(correctChoice?.label, "とても", "意味（列3）が選択肢として使用される")
        
        let allLabels = result.choices.map { $0.label }
        XCTAssertTrue(allLabels.contains("とても"), "選択肢に「とても」が含まれる")
        XCTAssertTrue(allLabels.contains("しみじみとした情趣"), "選択肢に「しみじみとした情趣」が含まれる")
    }
}
