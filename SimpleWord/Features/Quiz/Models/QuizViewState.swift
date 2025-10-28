//
//  QuizViewState.swift
//  SimpleWord
//
//  Created by リファクタリング フェーズ5
//

// QuizView の UI 状態管理
// - 何を: QuizView の UI 関連の状態を一元管理
// - なぜ: 変数宣言の削減、テスタビリティの向上、再利用性の確保

import SwiftUI

/// QuizView の UI 状態を一元管理するクラス
class QuizViewState: ObservableObject {
    // MARK: - Data State
    
    /// 全問題（フィルタ済み）
    @Published var items: [QuestionItem] = []
    
    /// 出題順序
    @Published var order: [QuestionItem] = []
    
    /// 現在バッチのプール
    @Published var pool: [QuestionItem] = []
    
    /// 現在の問題
    @Published var currentItem: QuestionItem? = nil
    
    // MARK: - UI State
    
    /// 選択肢
    @Published var choices: [QuizChoice] = []
    
    /// 選択された選択肢のID
    @Published var selectedChoiceID: UUID? = nil
    
    /// 正解の選択肢ID
    @Published var correctAnswerID: UUID? = nil
    
    /// 「わからない」の選択肢ID
    @Published var dontKnowID: UUID = UUID()
    
    // MARK: - Animation State
    
    /// 合格数アニメーション
    @Published var shouldAnimatePassedCount: Bool = false
    
    /// 総出題数アニメーション
    @Published var shouldAnimateTotalCount: Bool = false
    
    // MARK: - Loading & Error State
    
    /// ローディング状態
    @Published var isLoading: Bool = true
    
    /// エラーメッセージ
    @Published var errorMessage: String? = nil
    
    // MARK: - History State
    
    /// 出題履歴（戻る機能用）
    @Published var history: [UUID] = []
    
    /// 履歴内の現在位置
    @Published var historyIndex: Int = -1
    
    // MARK: - CSV State
    
    /// CSVのヘッダ表示用マップ（論理キー -> 表示ヘッダ）
    @Published var csvHeaderLabels: [String: String] = [:]
    
    // MARK: - Methods
    
    /// 状態をリセット
    func reset() {
        items = []
        order = []
        pool = []
        currentItem = nil
        choices = []
        selectedChoiceID = nil
        correctAnswerID = nil
        dontKnowID = UUID()
        shouldAnimatePassedCount = false
        shouldAnimateTotalCount = false
        isLoading = true
        errorMessage = nil
        history = []
        historyIndex = -1
        csvHeaderLabels = [:]
    }
    
    /// ローディング開始
    func startLoading() {
        isLoading = true
        errorMessage = nil
    }
    
    /// ローディング完了
    func finishLoading() {
        isLoading = false
    }
    
    /// エラーを設定
    func setError(_ message: String) {
        errorMessage = message
        isLoading = false
    }
    
    /// 合格数アニメーションをトリガー
    func triggerPassedCountAnimation() {
        shouldAnimatePassedCount = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            self.shouldAnimatePassedCount = false
        }
    }
    
    /// 総出題数アニメーションをトリガー
    func triggerTotalCountAnimation() {
        shouldAnimateTotalCount = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            self.shouldAnimateTotalCount = false
        }
    }
}
