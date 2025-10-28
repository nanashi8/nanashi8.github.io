//
//  PerCSVSettings.swift
//  SimpleWord
//
//  Created by リファクタリング フェーズ4
//

// CSV別設定の内部保存用モデル
// - 何を: CSV名をキーとして個別に保存する設定データ
// - なぜ: 複数のCSVで異なる設定を保持するため

import Foundation

/// CSV別の設定（内部保存用）
/// selectedCSVは持たず、キーがCSV名を表す
struct PerCSVSettings: Codable, Equatable {
    var selectedFields: [String]
    var difficulties: [String]
    var repeatCount: Int
    var successThreshold: Double
    var autoAdvance: Bool
    var questionsPerBatch: Int
    var lowAccuracyThreshold: Double
    var maxLowAccuracyRatio: Double
    
    /// デフォルト設定
    static func `default`() -> PerCSVSettings {
        .init(
            selectedFields: [],
            difficulties: [],
            repeatCount: 1,
            successThreshold: 0.7,
            autoAdvance: false,
            questionsPerBatch: 10,
            lowAccuracyThreshold: 0.5,
            maxLowAccuracyRatio: 0.5
        )
    }
    
    /// 全プロパティを指定するイニシャライザ
    init(
        selectedFields: [String],
        difficulties: [String],
        repeatCount: Int,
        successThreshold: Double,
        autoAdvance: Bool,
        questionsPerBatch: Int,
        lowAccuracyThreshold: Double = 0.5,
        maxLowAccuracyRatio: Double = 0.5
    ) {
        self.selectedFields = selectedFields
        self.difficulties = difficulties
        self.repeatCount = repeatCount
        self.successThreshold = successThreshold
        self.autoAdvance = autoAdvance
        self.questionsPerBatch = questionsPerBatch
        self.lowAccuracyThreshold = lowAccuracyThreshold
        self.maxLowAccuracyRatio = maxLowAccuracyRatio
    }
    
    // MARK: - Codable Implementation
    
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.selectedFields = try c.decodeIfPresent([String].self, forKey: .selectedFields) ?? []
        self.difficulties = try c.decodeIfPresent([String].self, forKey: .difficulties) ?? []
        self.repeatCount = try c.decodeIfPresent(Int.self, forKey: .repeatCount) ?? 1
        self.successThreshold = try c.decodeIfPresent(Double.self, forKey: .successThreshold) ?? 0.7
        self.autoAdvance = try c.decodeIfPresent(Bool.self, forKey: .autoAdvance) ?? false
        self.questionsPerBatch = try c.decodeIfPresent(Int.self, forKey: .questionsPerBatch) ?? 10
        self.lowAccuracyThreshold = try c.decodeIfPresent(Double.self, forKey: .lowAccuracyThreshold) ?? 0.5
        self.maxLowAccuracyRatio = try c.decodeIfPresent(Double.self, forKey: .maxLowAccuracyRatio) ?? 0.5
    }
    
    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(selectedFields, forKey: .selectedFields)
        try c.encode(difficulties, forKey: .difficulties)
        try c.encode(repeatCount, forKey: .repeatCount)
        try c.encode(successThreshold, forKey: .successThreshold)
        try c.encode(autoAdvance, forKey: .autoAdvance)
        try c.encode(questionsPerBatch, forKey: .questionsPerBatch)
        try c.encode(lowAccuracyThreshold, forKey: .lowAccuracyThreshold)
        try c.encode(maxLowAccuracyRatio, forKey: .maxLowAccuracyRatio)
    }
    
    private enum CodingKeys: String, CodingKey {
        case selectedFields, difficulties, repeatCount, successThreshold
        case autoAdvance, questionsPerBatch, lowAccuracyThreshold, maxLowAccuracyRatio
    }
}
