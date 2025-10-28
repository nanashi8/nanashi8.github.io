// Stores/QuizSettings.swift
// 出題設定の保存/読み込み（UserDefaults）
// - 何を: 出題に使うCSVや分野・難易度、繰り返し回数・合格率などを永続化します。
// - なぜ: アプリ再起動後も設定を保持し、同じ環境で学習を続けるため。

import Foundation
import Combine

/// クイズ設定の永続化とCSV別管理を行うクラス
public final class QuizSettings: ObservableObject {
    // MARK: - Published Properties
    
    /// 現在のCSVに対する設定モデル（表示・編集用）
    @Published public var model: QuizSettingsModel
    
    /// 選択肢の数
    @Published public var numberOfChoices: Int = 4
    
    /// 出題する問題の総数
    @Published public var numberOfQuestions: Int = 50
    
    /// タイマー有効フラグ
    @Published public var isTimerEnabled: Bool = false
    
    /// 制限時間（秒）
    @Published public var timeLimit: Int = 60
    
    /// 学習モード
    @Published public var learningMode: LearningMode = .normal
    
    /// ランダム出題
    @Published public var isRandomOrder: Bool = true
    
    /// 音声読み上げ
    @Published public var isSpeechEnabled: Bool = true
    
    // MARK: - Private Properties
    
    /// CSV名 -> 設定のストレージ
    private var storage: [String: PerCSVSettings] = [:]
    
    /// UserDefaults保存キー
    private let storageKey = "QuizPerCSVSettings_v1"
    
    /// 旧版互換: 単一モデル保存キー（マイグレーション用）
    private let legacyKey = "QuizSettingsStore_v1"
    
    private var cancellables: Set<AnyCancellable> = []
    
    /// CurrentCSV への参照
    private var currentCSV: CurrentCSV?
    
    /// 外観設定のバッキングストア
    private var appearanceBacking: Appearance = .system
    
    // MARK: - Computed Properties (互換性ラッパー)
    
    /// selectedFields の別名
    public var fields: [String] {
        get { model.selectedFields }
        set { model.selectedFields = newValue }
    }
    
    /// difficulties の別名
    public var difficulties: [String] {
        get { model.difficulties }
        set { model.difficulties = newValue }
    }
    
    /// repeatCount のラッパー（バリデーション付き）
    public var repeatCount: Int {
        get { model.repeatCount }
        set { model.repeatCount = max(1, newValue); save() }
    }
    
    /// successThreshold の別名（threshold）
    public var threshold: Double {
        get { model.successThreshold }
        set { model.successThreshold = min(max(0.0, newValue), 1.0); save() }
    }
    
    /// questionsPerBatch のラッパー（バリデーション付き）
    public var questionsPerBatch: Int {
        get { model.questionsPerBatch }
        set { model.questionsPerBatch = max(1, newValue); save() }
    }
    
    /// 外観設定
    public var appearance: Appearance {
        get { appearanceBacking }
        set { appearanceBacking = newValue; save() }
    }
    
    // MARK: - Initializer
    
    public init(currentCSV: CurrentCSV? = nil) {
        // 初期化: デフォルトモデルで開始
        self.model = QuizSettingsModel.default()
        self.currentCSV = currentCSV
        
        // 1) 新フォーマットの読み込み
        if let data = UserDefaults.standard.data(forKey: storageKey) {
            if let decoded = try? JSONDecoder().decode([String: PerCSVSettings].self, from: data) {
                self.storage = decoded
            } else {
                self.storage = [:]
            }
        } else {
            self.storage = [:]
        }
        
        // 2) 旧フォーマットからのマイグレーション
        if storage.isEmpty,
           let data = UserDefaults.standard.data(forKey: legacyKey),
           let legacy = try? JSONDecoder().decode(QuizSettingsModel.self, from: data) {
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
        
        // 3) 現在のCSV名に応じてmodelを構築
        let csv = self.currentCSV ?? CurrentCSV.shared
        let currentName = csv.name ?? "__default__"
        self.model = Self.buildModel(for: currentName, from: storage)
        
        // 外観とlearningModeを初期化
        self.appearanceBacking = .system
        self.learningMode = self.model.learningMode
        
        // 4) CSV名の変更を監視
        csv.$name
            .sink { [weak self] newName in
                guard let self = self else { return }
                let key = newName ?? "__default__"
                // 現在のmodelを保存してから切り替え
                self.persistActiveModel()
                self.model = Self.buildModel(for: key, from: self.storage)
                self.learningMode = self.model.learningMode
            }
            .store(in: &cancellables)
    }
    
    // MARK: - Public Methods
    
    /// 現在の設定を保存
    public func save() {
        let csv = self.currentCSV ?? CurrentCSV.shared
        model.selectedCSV = csv.name
        model.learningMode = learningMode
        persistActiveModel()
    }
    
    // MARK: - Private Methods
    
    /// 現在のmodelをstorageに書き戻す
    private func persistActiveModel() {
        let csv = self.currentCSV ?? CurrentCSV.shared
        let key = csv.name ?? "__default__"
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
    
    /// storageをUserDefaultsに保存
    private func persistStorage() {
        if let data = try? JSONEncoder().encode(storage) {
            UserDefaults.standard.set(data, forKey: storageKey)
        }
    }
    
    /// CSV名に対してQuizSettingsModelを生成
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
        model.learningMode = .normal
        return model
    }
}
