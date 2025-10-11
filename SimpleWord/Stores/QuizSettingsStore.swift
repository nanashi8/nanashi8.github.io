#if false

// filepath: /Users/yuichinakamura/Documents/20251006_002/SimpleWord/SimpleWord/Stores/QuizSettingsStore.swift
// QuizSettingsStore.swift
// 出題設定の保存/読み込み（UserDefaults）
// 旧: このファイルは廃止されたが、プロジェクトに組み込まれているため
//     ここに QuizSettings 実装を置いてコンパイル可能にする（最小修正）。

import Foundation
import Combine

// Quiz 設定モデル: UI/保存で使う軽量モデル
public struct QuizSettingsModel: Codable, Equatable {
    public var selectedCSV: String? // 現在のCSV名（表示用: CurrentCSVから投影）
    public var selectedFields: [String] // 分野フィルタ
    public var difficulties: [String] // 難易度フィルタ
    public var repeatCount: Int // 繰り返し回数
    public var successThreshold: Double // 合格率(0.0...1.0)
    // 自動で次へ（回答後、自動的に次の問題へ進む）
    public var autoAdvance: Bool
    // 1セットの出題数（UI では「出題数」）。バッチサイズに相当。
    public var questionsPerBatch: Int
    // 低正答と判定する閾値 (0.0 - 1.0)
    public var lowAccuracyThreshold: Double
    // バッチ内で許容する低正答アイテムの最大比率 (0.0 - 1.0)
    public var maxLowAccuracyRatio: Double

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
            maxLowAccuracyRatio: 0.5
        )
    }
}

// 内部保存用: CSVごとの設定（selectedCSVは持たず、キーがCSV名を表す）
private struct PerCSVSettings: Codable, Equatable {
    var selectedFields: [String]
    var difficulties: [String]
    var repeatCount: Int
    var successThreshold: Double
    var autoAdvance: Bool
    var questionsPerBatch: Int
    var lowAccuracyThreshold: Double
    var maxLowAccuracyRatio: Double

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

    init(selectedFields: [String], difficulties: [String], repeatCount: Int, successThreshold: Double, autoAdvance: Bool, questionsPerBatch: Int, lowAccuracyThreshold: Double = 0.5, maxLowAccuracyRatio: Double = 0.5) {
        self.selectedFields = selectedFields
        self.difficulties = difficulties
        self.repeatCount = repeatCount
        self.successThreshold = successThreshold
        self.autoAdvance = autoAdvance
        self.questionsPerBatch = questionsPerBatch
        self.lowAccuracyThreshold = lowAccuracyThreshold
        self.maxLowAccuracyRatio = maxLowAccuracyRatio
    }

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
        case selectedFields, difficulties, repeatCount, successThreshold, autoAdvance, questionsPerBatch, lowAccuracyThreshold, maxLowAccuracyRatio
    }
}

// ObservableObject にして View から環境注入できるようにする
public final class QuizSettings: ObservableObject {
    @Published public var model: QuizSettingsModel

    private var storage: [String: PerCSVSettings] = [:]
    private let storageKey = "QuizPerCSVSettings_v1"
    private let legacyKey = "QuizSettingsStore_v1"

    private var cancellables: Set<AnyCancellable> = []

    public init() {
        self.model = QuizSettingsModel.default()

        if let data = UserDefaults.standard.data(forKey: storageKey) {
            if let decoded = try? JSONDecoder().decode([String: PerCSVSettings].self, from: data) {
                self.storage = decoded
            } else {
                self.storage = [:]
            }
        } else {
            self.storage = [:]
        }

        if storage.isEmpty, let data = UserDefaults.standard.data(forKey: legacyKey), let legacy = try? JSONDecoder().decode(QuizSettingsModel.self, from: data) {
            let per = PerCSVSettings(
                selectedFields: legacy.selectedFields,
                difficulties: legacy.difficulties,
                repeatCount: legacy.repeatCount,
                successThreshold: legacy.successThreshold,
                autoAdvance: legacy.autoAdvance,
                questionsPerBatch: legacy.questionsPerBatch,
                lowAccuracyThreshold: legacy.lowAccuracyThreshold,
                maxLowAccuracyRatio: legacy.maxLowAccuracyRatio
            )
            let key = legacy.selectedCSV ?? "__default__"
            storage[key] = per
            persistStorage()
        }

        let currentName = CurrentCSV.shared.name ?? "__default__"
        self.model = Self.buildModel(for: currentName, from: storage)

        CurrentCSV.shared.$name
            .sink { [weak self] newName in
                guard let self = self else { return }
                let key = newName ?? "__default__"
                self.persistActiveModel()
                self.model = Self.buildModel(for: key, from: self.storage)
            }
            .store(in: &cancellables)
    }

    private func persistActiveModel() {
        let key = CurrentCSV.shared.name ?? "__default__"
        let per = PerCSVSettings(
            selectedFields: model.selectedFields,
            difficulties: model.difficulties,
            repeatCount: max(1, model.repeatCount),
            successThreshold: min(max(0.0, model.successThreshold), 1.0),
            autoAdvance: model.autoAdvance,
            questionsPerBatch: max(1, model.questionsPerBatch),
            lowAccuracyThreshold: min(max(0.0, model.lowAccuracyThreshold), 1.0),
            maxLowAccuracyRatio: min(max(0.0, model.maxLowAccuracyRatio), 1.0)
        )
        storage[key] = per
        persistStorage()
    }

    private func persistStorage() {
        if let data = try? JSONEncoder().encode(storage) {
            UserDefaults.standard.set(data, forKey: storageKey)
        }
    }

    public func save() {
        model.selectedCSV = CurrentCSV.shared.name
        persistActiveModel()
    }

    private static func buildModel(for key: String, from storage: [String: PerCSVSettings]) -> QuizSettingsModel {
        let per = storage[key] ?? .default()
        let csvName = (key == "__default__") ? nil : key
        return QuizSettingsModel(
            selectedCSV: csvName,
            selectedFields: per.selectedFields,
            difficulties: per.difficulties,
            repeatCount: per.repeatCount,
            successThreshold: per.successThreshold,
            autoAdvance: per.autoAdvance,
            questionsPerBatch: per.questionsPerBatch,
            lowAccuracyThreshold: per.lowAccuracyThreshold,
            maxLowAccuracyRatio: per.maxLowAccuracyRatio
        )
    }
}


#endif
