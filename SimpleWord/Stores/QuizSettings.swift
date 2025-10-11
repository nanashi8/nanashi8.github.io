// Stores/QuizSettings.swift
// 出題設定の保存/読み込み（UserDefaults）
// - 何を: 出題に使うCSVや分野・難易度、繰り返し回数・合格率などを永続化します。
// - なぜ: アプリ再起動後も設定を保持し、同じ環境で学習を続けるため。

import Foundation
import Combine

// 学習モード: 通常 / 復習 / 補習（補修）
public enum LearningMode: String, Codable, CaseIterable, Identifiable {
    public var id: String { rawValue }
    case normal = "normal"    // 通常モード
    case review = "review"    // 復習モード
    case remediation = "remediation" // 補習モード（補修）

    // 日本語表示名
    public var displayName: String {
        switch self {
        case .normal: return "通常"
        case .review: return "復習"
        case .remediation: return "補習"
        }
    }
}

public struct QuizSettingsModel: Codable, Equatable {
    // 基本保存フィールド
    public var selectedCSV: String? // 現在のCSV名（表示用）
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

    // 追加フィールド: Quiz 終了時に記録されるスナップショット用
    // これらは UI 側で一時的に使われる値だが、履歴に保存したいためここに含める
    public var numberOfChoices: Int
    public var numberOfQuestions: Int
    public var isTimerEnabled: Bool
    public var timeLimit: Int
    // 旧 isLearningMode -> 新 learningMode（列挙型）
    public var learningMode: LearningMode
    public var isRandomOrder: Bool
    public var isSpeechEnabled: Bool
    public var selectedCSVFile: String? // ファイル名（履歴用）
    // 便宜上のエイリアス（互換性用）
    public var fields: [String]
    public var threshold: Double
    public var appearance: String

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

    // 注意: Codable 用の init(from:) を独自実装しているため、Swift は memberwise initializer を自動生成しません。
    // このため外部からすべてのプロパティを渡して初期化できる public イニシャライザを追加します。
    public init(selectedCSV: String?, selectedFields: [String], difficulties: [String], repeatCount: Int, successThreshold: Double, autoAdvance: Bool, questionsPerBatch: Int, lowAccuracyThreshold: Double, maxLowAccuracyRatio: Double, numberOfChoices: Int, numberOfQuestions: Int, isTimerEnabled: Bool, timeLimit: Int, learningMode: LearningMode, isRandomOrder: Bool, isSpeechEnabled: Bool, selectedCSVFile: String?, fields: [String], threshold: Double, appearance: String) {
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

    // カスタム Codable 実装: 古いフォーマットとの互換性を確保するため decodeIfPresent を使用
    private enum CodingKeys: String, CodingKey {
        case selectedCSV, selectedFields, difficulties, repeatCount, successThreshold, autoAdvance, questionsPerBatch, lowAccuracyThreshold, maxLowAccuracyRatio
        case numberOfChoices, numberOfQuestions, isTimerEnabled, timeLimit, learningMode, isRandomOrder, isSpeechEnabled, selectedCSVFile, fields, threshold, appearance
        // 互換性のため古いキー名も列挙
        case isLearningMode
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.selectedCSV = try c.decodeIfPresent(String.self, forKey: .selectedCSV)
        self.selectedFields = try c.decodeIfPresent([String].self, forKey: .selectedFields) ?? []
        self.difficulties = try c.decodeIfPresent([String].self, forKey: .difficulties) ?? []
        self.repeatCount = try c.decodeIfPresent(Int.self, forKey: .repeatCount) ?? 1
        self.successThreshold = try c.decodeIfPresent(Double.self, forKey: .successThreshold) ?? (try c.decodeIfPresent(Double.self, forKey: .threshold) ?? 0.7)
        self.autoAdvance = try c.decodeIfPresent(Bool.self, forKey: .autoAdvance) ?? false
        self.questionsPerBatch = try c.decodeIfPresent(Int.self, forKey: .questionsPerBatch) ?? 10
        self.lowAccuracyThreshold = try c.decodeIfPresent(Double.self, forKey: .lowAccuracyThreshold) ?? 0.5
        self.maxLowAccuracyRatio = try c.decodeIfPresent(Double.self, forKey: .maxLowAccuracyRatio) ?? 0.5

        self.numberOfChoices = try c.decodeIfPresent(Int.self, forKey: .numberOfChoices) ?? 4
        self.numberOfQuestions = try c.decodeIfPresent(Int.self, forKey: .numberOfQuestions) ?? 50
        self.isTimerEnabled = try c.decodeIfPresent(Bool.self, forKey: .isTimerEnabled) ?? false
        self.timeLimit = try c.decodeIfPresent(Int.self, forKey: .timeLimit) ?? 60
        // learningMode は文字列で保存される想定
        if let lmStr = try c.decodeIfPresent(String.self, forKey: .learningMode), let lm = LearningMode(rawValue: lmStr) {
            self.learningMode = lm
        } else if let legacyBool = try c.decodeIfPresent(Bool.self, forKey: .isLearningMode) {
            // 互換性: 古い isLearningMode(Bool) が true の場合は .review にマップする
            self.learningMode = legacyBool ? .review : .normal
        } else {
            self.learningMode = .normal
        }
        self.isRandomOrder = try c.decodeIfPresent(Bool.self, forKey: .isRandomOrder) ?? true
        self.isSpeechEnabled = try c.decodeIfPresent(Bool.self, forKey: .isSpeechEnabled) ?? true
        self.selectedCSVFile = try c.decodeIfPresent(String.self, forKey: .selectedCSVFile) ?? self.selectedCSV

        // fields と threshold は旧フィールドに依存する可能性があるためフォールバックを設定
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
    // 新: 低正答閾値
    var lowAccuracyThreshold: Double
    // 新: 最大低正答比率
    var maxLowAccuracyRatio: Double

    static func `default`() -> PerCSVSettings {
        .init(
            selectedFields: [],
            difficulties: [],
            repeatCount: 1,
            successThreshold: 0.7,
            autoAdvance: false,
            questionsPerBatch: 10
            , lowAccuracyThreshold: 0.5
            , maxLowAccuracyRatio: 0.5
        )
    }

    // Codable 安全化: 古いフォーマットでもデコードできるように decodeIfPresent を使う
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

public final class QuizSettings: ObservableObject {
    // 公開: 現在のCSVに対する設定モデル(表示・編集用)。更新時は save() を呼ぶこと。
    @Published public var model: QuizSettingsModel

    // 内部: CSV名 -> 設定
    private var storage: [String: PerCSVSettings] = [:]
    private let storageKey = "QuizPerCSVSettings_v1"

    // 旧版互換: 単一モデル保存キー(マイグレーション用)
    private let legacyKey = "QuizSettingsStore_v1"

    private var cancellables: Set<AnyCancellable> = []

    // 互換性ラッパー: 既存ビューが古いプロパティ名で参照しているため computed properties を追加
    // fields / difficulties / repeatCount / threshold / questionsPerBatch / autoAdvance などを提供する
    public var fields: [String] {
        get { model.selectedFields }
        set { model.selectedFields = newValue }
    }

    public var difficulties: [String] {
        get { model.difficulties }
        set { model.difficulties = newValue }
    }

    public var repeatCount: Int {
        get { model.repeatCount }
        set { model.repeatCount = max(1, newValue); save() }
    }

    // threshold は過去の命名（successThreshold に対応）
    public var threshold: Double {
        get { model.successThreshold }
        set { model.successThreshold = min(max(0.0, newValue), 1.0); save() }
    }

    public var questionsPerBatch: Int {
        get { model.questionsPerBatch }
        set { model.questionsPerBatch = max(1, newValue); save() }
    }

    // 以下は現在 model に存在しないが View で参照されているため、互換として簡易的な stored properties を追加しておく
    // これらはアプリの既存の設定保存スキーマに含まれていないため、UserDefaults 等へは未保存（将来的に拡張可）
    @Published public var numberOfChoices: Int = 4
    @Published public var numberOfQuestions: Int = 50
    @Published public var isTimerEnabled: Bool = false
    @Published public var timeLimit: Int = 60
    @Published public var learningMode: LearningMode = .normal
    @Published public var isRandomOrder: Bool = true
    @Published public var isSpeechEnabled: Bool = true

    // 外観は Appearance 型がプロジェクトに存在する前提で互換性を提供
    // 存在しない場合は仮の型 alias を使う（呼び出し側で AppearanceManager を利用しているためここは軽微な影響のみ）
    public var appearance: Appearance {
        get { appearanceBacking }
        set { appearanceBacking = newValue; save() }
    }

    // backing store for appearance (デフォルトは .system)
    private var appearanceBacking: Appearance = .system

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
                questionsPerBatch: legacy.questionsPerBatch,
                lowAccuracyThreshold: legacy.lowAccuracyThreshold,
                maxLowAccuracyRatio: legacy.maxLowAccuracyRatio
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

        // initialize appearance backing from model if possible
        // model の中に appearance 情報がないためデフォルトを使用
        self.appearanceBacking = .system

        // Sync learningMode published property with model
        self.learningMode = self.model.learningMode

        // 4) CSV名の変更を監視し、アクティブモデルを切り替える
        CurrentCSV.shared.$name
            .sink { [weak self] newName in
                guard let self = self else { return }
                let key = newName ?? "__default__"
                // 直前の model を保存してから切り替え
                self.persistActiveModel()
                self.model = Self.buildModel(for: key, from: self.storage)
                // 新しい model に合わせて公開 learningMode を更新
                self.learningMode = self.model.learningMode
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
            , lowAccuracyThreshold: min(max(0.0, model.lowAccuracyThreshold), 1.0)
            , maxLowAccuracyRatio: min(max(0.0, model.maxLowAccuracyRatio), 1.0)
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
        // Sync learningMode into model before persisting so that snapshot results include it
        model.learningMode = learningMode
        persistActiveModel()
    }

    // 現在のCSV名に対して QuizSettingsModel を生成
    private static func buildModel(for key: String, from storage: [String: PerCSVSettings]) -> QuizSettingsModel {
        let per = storage[key] ?? .default()
        let csvName = (key == "__default__") ? nil : key
        var model = QuizSettingsModel.default()
        model.selectedCSV = csvName
        model.selectedFields = per.selectedFields
        model.difficulties = per.difficulties
        model.repeatCount = per.repeatCount
        model.successThreshold = per.successThreshold
        model.autoAdvance = per.autoAdvance
        model.questionsPerBatch = per.questionsPerBatch
        model.lowAccuracyThreshold = per.lowAccuracyThreshold
        model.maxLowAccuracyRatio = per.maxLowAccuracyRatio

        // 互換フィールドを埋める
        model.fields = per.selectedFields
        model.threshold = per.successThreshold
        model.selectedCSVFile = csvName
        // learningMode は PerCSVSettings に保存されていないためデフォルト値を保持
        model.learningMode = .normal
        return model
    }
}
