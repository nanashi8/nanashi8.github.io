// Stores/QuizSessionStore.swift
// クイズセッションの状態管理（正答率、合格数、総出題数など）
// - 何を: 進行中のクイズセッションの状態を保存・復元します。
// - なぜ: ユーザーがクイズ画面から離れても、戻ったときに続きから再開できるようにするため。

import Foundation
import Combine

/// クイズセッションの状態を保存・復元するストア
@MainActor
public class QuizSessionStore: ObservableObject {
    // 現在のセッション状態
    @Published public var score: Int = 0                    // 累積正解数
    @Published public var questionCount: Int = 0            // 累積出題数
    @Published public var batchCorrect: Int = 0             // 現在バッチの正解数
    @Published public var batchSize: Int = 10               // バッチサイズ
    
    // セッション管理
    @Published public var isSessionActive: Bool = false     // セッションがアクティブか
    @Published public var currentCSVName: String? = nil     // 現在のCSV名
    
    // 出題状態（バッチごとの進捗）
    @Published public var currentBatchIndex: Int = 0        // 現在のバッチ番号
    @Published public var totalBatches: Int = 0             // 総バッチ数
    
    private let defaults = UserDefaults.standard
    private let sessionKey = "QuizSession"
    
    public static let shared = QuizSessionStore()
    
    private init() {
        loadSession()
    }
    
    /// 新しいセッションを開始
    public func startSession(csvName: String, batchSize: Int, totalQuestions: Int) {
        self.currentCSVName = csvName
        self.batchSize = max(1, batchSize)
        self.score = 0
        self.questionCount = 0
        self.batchCorrect = 0
        self.currentBatchIndex = 0
        self.totalBatches = (totalQuestions + self.batchSize - 1) / self.batchSize
        self.isSessionActive = true
        saveSession()
    }
    
    /// スコアを更新
    public func recordAnswer(correct: Bool) {
        questionCount += 1
        if correct {
            score += 1
            batchCorrect += 1
        }
        saveSession()
    }
    
    /// バッチを完了し、次のバッチへ進む
    public func completeBatch() {
        currentBatchIndex += 1
        batchCorrect = 0
        saveSession()
    }
    
    /// セッションを終了
    public func endSession() {
        isSessionActive = false
        currentCSVName = nil
        score = 0
        questionCount = 0
        batchCorrect = 0
        currentBatchIndex = 0
        totalBatches = 0
        clearSession()
    }
    
    /// セッションが同じCSVで継続可能か確認
    public func canResumeSession(csvName: String) -> Bool {
        return isSessionActive && currentCSVName == csvName
    }
    
    /// 正答率を計算
    public func calculateAccuracy() -> Int {
        guard questionCount > 0 else { return 0 }
        return Int(Double(score) / Double(questionCount) * 100)
    }
    
    // MARK: - 永続化
    
    private func saveSession() {
        let session: [String: Any] = [
            "score": score,
            "questionCount": questionCount,
            "batchCorrect": batchCorrect,
            "batchSize": batchSize,
            "isSessionActive": isSessionActive,
            "currentCSVName": currentCSVName as Any,
            "currentBatchIndex": currentBatchIndex,
            "totalBatches": totalBatches
        ]
        defaults.set(session, forKey: sessionKey)
    }
    
    private func loadSession() {
        guard let session = defaults.dictionary(forKey: sessionKey) else { return }
        
        score = session["score"] as? Int ?? 0
        questionCount = session["questionCount"] as? Int ?? 0
        batchCorrect = session["batchCorrect"] as? Int ?? 0
        let loadedBatchSize = session["batchSize"] as? Int ?? 10
        batchSize = max(1, loadedBatchSize)
        isSessionActive = session["isSessionActive"] as? Bool ?? false
        currentCSVName = session["currentCSVName"] as? String
        currentBatchIndex = session["currentBatchIndex"] as? Int ?? 0
        totalBatches = session["totalBatches"] as? Int ?? 0
    }
    
    private func clearSession() {
        defaults.removeObject(forKey: sessionKey)
    }
}
