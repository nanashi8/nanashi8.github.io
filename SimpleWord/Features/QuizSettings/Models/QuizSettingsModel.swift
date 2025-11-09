//
//  QuizSettingsModel.swift
//  SimpleWord
//
//  Created by リファクタリング フェーズ4
//

// クイズ設定データモデル
// - 何を: クイズの全設定パラメータを保持するデータ構造
// - なぜ: 設定の永続化と履歴記録のため

import Foundation

/// クイズ設定のデータモデル
public struct QuizSettingsModel: Codable, Equatable, Sendable {
    // MARK: - 基本設定
    
    /// 現在のCSV名（表示用）
    public var selectedCSV: String?
    
    /// 分野フィルタ
    public var selectedFields: [String]
    
    /// 難易度フィルタ
    public var difficulties: [String]
    
    /// 繰り返し回数
    public var repeatCount: Int
    
    /// 合格率 (0.0...1.0)
    public var successThreshold: Double
    
    /// 回答後に自動で次へ進む
    public var autoAdvance: Bool
    
    /// 1セットの出題数（バッチサイズ）
    public var questionsPerBatch: Int
    
    /// 低正答と判定する閾値 (0.0 - 1.0)
    public var lowAccuracyThreshold: Double
    
    /// バッチ内で許容する低正答アイテムの最大比率 (0.0 - 1.0)
    public var maxLowAccuracyRatio: Double
    
    // MARK: - UI設定（履歴記録用）
    
    /// 選択肢の数
    public var numberOfChoices: Int
    
    /// 出題する問題の総数
    public var numberOfQuestions: Int
    
    /// タイマー有効フラグ
    public var isTimerEnabled: Bool
    
    /// 制限時間（秒）
    public var timeLimit: Int
    
    /// 学習モード
    public var learningMode: LearningMode
    
    /// ランダム出題
    public var isRandomOrder: Bool
    
    /// 音声読み上げ
    public var isSpeechEnabled: Bool
    
    /// 選択されたCSVファイル名（履歴用）
    public var selectedCSVFile: String?
    
    // MARK: - 互換性フィールド
    
    /// selectedFields の別名（互換性用）
    public var fields: [String]
    
    /// successThreshold の別名（互換性用）
    public var threshold: Double
    
    /// 外観設定（文字列）
    public var appearance: String
    
    // MARK: - Initializer
    
    /// デフォルト設定
    public static func `default`() -> QuizSettingsModel {
        return QuizSettingsModel(
            selectedCSV: nil,
            selectedFields: [],
            difficulties: [],
            repeatCount: 1,
            successThreshold: 0.7,
            autoAdvance: false,
            questionsPerBatch: 10,
            lowAccuracyThreshold: 0.5,
            maxLowAccuracyRatio: 0.5,
            numberOfChoices: 4,
            numberOfQuestions: 50,
            isTimerEnabled: false,
            timeLimit: 60,
            learningMode: .normal,
            isRandomOrder: true,
            isSpeechEnabled: true,
            selectedCSVFile: nil,
            fields: [],
            threshold: 0.7,
            appearance: "system"
        )
    }
    
    /// 全プロパティを指定するイニシャライザ
    public init(
        selectedCSV: String?,
        selectedFields: [String],
        difficulties: [String],
        repeatCount: Int,
        successThreshold: Double,
        autoAdvance: Bool,
        questionsPerBatch: Int,
        lowAccuracyThreshold: Double,
        maxLowAccuracyRatio: Double,
        numberOfChoices: Int,
        numberOfQuestions: Int,
        isTimerEnabled: Bool,
        timeLimit: Int,
        learningMode: LearningMode,
        isRandomOrder: Bool,
        isSpeechEnabled: Bool,
        selectedCSVFile: String?,
        fields: [String],
        threshold: Double,
        appearance: String
    ) {
        self.selectedCSV = selectedCSV
        self.selectedFields = selectedFields
        self.difficulties = difficulties
        self.repeatCount = repeatCount
        self.successThreshold = successThreshold
        self.autoAdvance = autoAdvance
        self.questionsPerBatch = questionsPerBatch
        self.lowAccuracyThreshold = lowAccuracyThreshold
        self.maxLowAccuracyRatio = maxLowAccuracyRatio
        self.numberOfChoices = numberOfChoices
        self.numberOfQuestions = numberOfQuestions
        self.isTimerEnabled = isTimerEnabled
        self.timeLimit = timeLimit
        self.learningMode = learningMode
        self.isRandomOrder = isRandomOrder
        self.isSpeechEnabled = isSpeechEnabled
        self.selectedCSVFile = selectedCSVFile
        self.fields = fields
        self.threshold = threshold
        self.appearance = appearance
    }
    
    // MARK: - Codable Implementation
    
    private enum CodingKeys: String, CodingKey {
        case selectedCSV, selectedFields, difficulties, repeatCount, successThreshold
        case autoAdvance, questionsPerBatch, lowAccuracyThreshold, maxLowAccuracyRatio
        case numberOfChoices, numberOfQuestions, isTimerEnabled, timeLimit, learningMode
        case isRandomOrder, isSpeechEnabled, selectedCSVFile, fields, threshold, appearance
        // 互換性のため古いキー名も列挙
        case isLearningMode
    }
    
    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        
        self.selectedCSV = try c.decodeIfPresent(String.self, forKey: .selectedCSV)
        self.selectedFields = try c.decodeIfPresent([String].self, forKey: .selectedFields) ?? []
        self.difficulties = try c.decodeIfPresent([String].self, forKey: .difficulties) ?? []
        self.repeatCount = try c.decodeIfPresent(Int.self, forKey: .repeatCount) ?? 1
        self.successThreshold = try c.decodeIfPresent(Double.self, forKey: .successThreshold)
            ?? (try c.decodeIfPresent(Double.self, forKey: .threshold) ?? 0.7)
        self.autoAdvance = try c.decodeIfPresent(Bool.self, forKey: .autoAdvance) ?? false
        self.questionsPerBatch = try c.decodeIfPresent(Int.self, forKey: .questionsPerBatch) ?? 10
        self.lowAccuracyThreshold = try c.decodeIfPresent(Double.self, forKey: .lowAccuracyThreshold) ?? 0.5
        self.maxLowAccuracyRatio = try c.decodeIfPresent(Double.self, forKey: .maxLowAccuracyRatio) ?? 0.5
        
        self.numberOfChoices = try c.decodeIfPresent(Int.self, forKey: .numberOfChoices) ?? 4
        self.numberOfQuestions = try c.decodeIfPresent(Int.self, forKey: .numberOfQuestions) ?? 50
        self.isTimerEnabled = try c.decodeIfPresent(Bool.self, forKey: .isTimerEnabled) ?? false
        self.timeLimit = try c.decodeIfPresent(Int.self, forKey: .timeLimit) ?? 60
        
        // learningMode の互換性処理
        if let lmStr = try c.decodeIfPresent(String.self, forKey: .learningMode),
           let lm = LearningMode(rawValue: lmStr) {
            self.learningMode = lm
        } else if let legacyBool = try c.decodeIfPresent(Bool.self, forKey: .isLearningMode) {
            // 古い isLearningMode(Bool) が true の場合は .review にマップ
            self.learningMode = legacyBool ? .review : .normal
        } else {
            self.learningMode = .normal
        }
        
        self.isRandomOrder = try c.decodeIfPresent(Bool.self, forKey: .isRandomOrder) ?? true
        self.isSpeechEnabled = try c.decodeIfPresent(Bool.self, forKey: .isSpeechEnabled) ?? true
        self.selectedCSVFile = try c.decodeIfPresent(String.self, forKey: .selectedCSVFile) ?? self.selectedCSV
        
        // 互換性フィールド
        self.fields = try c.decodeIfPresent([String].self, forKey: .fields) ?? self.selectedFields
        self.threshold = try c.decodeIfPresent(Double.self, forKey: .threshold) ?? self.successThreshold
        self.appearance = try c.decodeIfPresent(String.self, forKey: .appearance) ?? "system"
    }
    
    public func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        
        try c.encodeIfPresent(selectedCSV, forKey: .selectedCSV)
        try c.encode(selectedFields, forKey: .selectedFields)
        try c.encode(difficulties, forKey: .difficulties)
        try c.encode(repeatCount, forKey: .repeatCount)
        try c.encode(successThreshold, forKey: .successThreshold)
        try c.encode(autoAdvance, forKey: .autoAdvance)
        try c.encode(questionsPerBatch, forKey: .questionsPerBatch)
        try c.encode(lowAccuracyThreshold, forKey: .lowAccuracyThreshold)
        try c.encode(maxLowAccuracyRatio, forKey: .maxLowAccuracyRatio)
        
        try c.encode(numberOfChoices, forKey: .numberOfChoices)
        try c.encode(numberOfQuestions, forKey: .numberOfQuestions)
        try c.encode(isTimerEnabled, forKey: .isTimerEnabled)
        try c.encode(timeLimit, forKey: .timeLimit)
        try c.encode(learningMode.rawValue, forKey: .learningMode)
        try c.encode(isRandomOrder, forKey: .isRandomOrder)
        try c.encode(isSpeechEnabled, forKey: .isSpeechEnabled)
        try c.encodeIfPresent(selectedCSVFile, forKey: .selectedCSVFile)
        
        try c.encode(fields, forKey: .fields)
        try c.encode(threshold, forKey: .threshold)
        try c.encode(appearance, forKey: .appearance)
    }
}
