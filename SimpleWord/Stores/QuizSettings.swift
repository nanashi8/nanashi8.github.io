// QuizSettings.swift
// 出題設定の保存/読み込み（UserDefaults）
// - 何を: 出題に使うCSVや分野・難易度、繰り返し回数・合格率などを永続化します。
// - なぜ: アプリ再起動後も設定を保持し、同じ環境で学習を続けるため。

import Foundation
import Combine

public struct QuizSettingsModel: Codable, Equatable {
    public var selectedCSV: String? // 現在のCSV名（表示用: CurrentCSVから投影）
    public var selectedFields: [String] // 分野フィルタ
    public var difficulties: [String] // 難易度フィルタ
    public var repeatCount: Int // 繰り返し回数
    public var successThreshold: Double // 合格率(0.0...1.0)
    // 新: 自動で次へ（回答後、自動的に次の問題へ進む）
    public var autoAdvance: Bool
    // 新: 1セットの出題数（UI では「出題数」）。バッチサイズに相当。
    public var questionsPerBatch: Int

    public static func `default`() -> QuizSettingsModel {
        return QuizSettingsModel(
            selectedCSV: nil,
            selectedFields: [],
            difficulties: [],
            repeatCount: 1,
            successThreshold: 0.7,
            autoAdvance: false,
            questionsPerBatch: 10
        )
    }
}

// 内部保存用: CSVごとの設定（selectedCSVは持たず、キーがCSV名を表す）
private struct PerCSVSettings: Codable, Equatable {
    var selectedFields: [String]
    var difficulties: [String]
    var repeatCount: Int
    var successThreshold: Double
    // 新: 自動で次へ
    var autoAdvance: Bool
    // 新: 1セットの出題数（バッチサイズ）
    var questionsPerBatch: Int

    static func `default`() -> PerCSVSettings {
        .init(
            selectedFields: [],
            difficulties: [],
            repeatCount: 1,
            successThreshold: 0.7,
            autoAdvance: false,
            questionsPerBatch: 10
        )
    }

    // Codable 安全化: 古いフォーマットでもデコードできるように decodeIfPresent を使う
    init(selectedFields: [String], difficulties: [String], repeatCount: Int, successThreshold: Double, autoAdvance: Bool, questionsPerBatch: Int) {
        self.selectedFields = selectedFields
        self.difficulties = difficulties
        self.repeatCount = repeatCount
        self.successThreshold = successThreshold
        self.autoAdvance = autoAdvance
        self.questionsPerBatch = questionsPerBatch
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.selectedFields = try c.decodeIfPresent([String].self, forKey: .selectedFields) ?? []
        self.difficulties = try c.decodeIfPresent([String].self, forKey: .difficulties) ?? []
        self.repeatCount = try c.decodeIfPresent(Int.self, forKey: .repeatCount) ?? 1
        self.successThreshold = try c.decodeIfPresent(Double.self, forKey: .successThreshold) ?? 0.7
        self.autoAdvance = try c.decodeIfPresent(Bool.self, forKey: .autoAdvance) ?? false
        self.questionsPerBatch = try c.decodeIfPresent(Int.self, forKey: .questionsPerBatch) ?? 10
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(selectedFields, forKey: .selectedFields)
        try c.encode(difficulties, forKey: .difficulties)
        try c.encode(repeatCount, forKey: .repeatCount)
        try c.encode(successThreshold, forKey: .successThreshold)
        try c.encode(autoAdvance, forKey: .autoAdvance)
        try c.encode(questionsPerBatch, forKey: .questionsPerBatch)
    }

    private enum CodingKeys: String, CodingKey {
        case selectedFields, difficulties, repeatCount, successThreshold, autoAdvance, questionsPerBatch
    }
}

public final class QuizSettings: ObservableObject {
    // 公開: 現在のCSVに対する設定モデル(表示・編集用)。更新時は save() を呼ぶこと。
    @Published public var model: QuizSettingsModel

    // 内部: CSV名 -> 設定
    private var storage: [String: PerCSVSettings] = [:]
    private let storageKey = "QuizPerCSVSettings_v1"

    // 旧版互換: 単一モデル保存キー(マイグレーション用)
    private let legacyKey = "QuizSettingsStore_v1"

    private var cancellables: Set<AnyCancellable> = []

    public init() {
        // 初期化順序: Swift のルールに従い、self を使う前に全ての stored properties を初期化する
        // model は一旦デフォルトで初期化しておく（後で実際の CSV 名に基づいた model に差し替える）
        self.model = QuizSettingsModel.default()

        // 1) 新フォーマットの読み込み
        if let data = UserDefaults.standard.data(forKey: storageKey) {
            if let decoded = try? JSONDecoder().decode([String: PerCSVSettings].self, from: data) {
                self.storage = decoded
            } else {
                // デコード失敗時は空にしてマイグレーションに備える
                self.storage = [:]
            }
        } else {
            self.storage = [:]
        }
        // 2) 旧フォーマットからのマイグレーション(存在すれば)
        if storage.isEmpty, let data = UserDefaults.standard.data(forKey: legacyKey), let legacy = try? JSONDecoder().decode(QuizSettingsModel.self, from: data) {
            let per = PerCSVSettings(
                selectedFields: legacy.selectedFields,
                difficulties: legacy.difficulties,
                repeatCount: legacy.repeatCount,
                successThreshold: legacy.successThreshold,
                autoAdvance: legacy.autoAdvance,
                questionsPerBatch: legacy.questionsPerBatch
            )
            // 旧版では CSV が未指定のことがあるため、特別キーとして保存
            let key = legacy.selectedCSV ?? "__default__"
            storage[key] = per
            // 新キーで保存して旧キーの影響を排除
            persistStorage()
        }
        // 3) 現在のCSV名に応じて model を構築
        let currentName = CurrentCSV.shared.name ?? "__default__"
        self.model = Self.buildModel(for: currentName, from: storage)

        // 4) CSV名の変更を監視し、アクティブモデルを切り替える
        CurrentCSV.shared.$name
            .sink { [weak self] newName in
                guard let self = self else { return }
                let key = newName ?? "__default__"
                // 直前の model を保存してから切り替え
                self.persistActiveModel()
                self.model = Self.buildModel(for: key, from: self.storage)
            }
            .store(in: &cancellables)
    }

    // 現在の model を storage に書き戻す（現在のCSV名のバケットに）
    private func persistActiveModel() {
        let key = CurrentCSV.shared.name ?? "__default__"
        let per = PerCSVSettings(
            selectedFields: model.selectedFields,
            difficulties: model.difficulties,
            repeatCount: max(1, model.repeatCount),
            successThreshold: min(max(0.0, model.successThreshold), 1.0),
            autoAdvance: model.autoAdvance,
            questionsPerBatch: max(1, model.questionsPerBatch)
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
        // model.selectedCSV は表示用なので、CurrentCSV から決定
        model.selectedCSV = CurrentCSV.shared.name
        persistActiveModel()
    }

    // 現在のCSV名に対して QuizSettingsModel を生成
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
            questionsPerBatch: per.questionsPerBatch
        )
    }
}
