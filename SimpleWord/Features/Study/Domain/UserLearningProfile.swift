// UserLearningProfile.swift
// ユーザー別の学習ペース設定

import Foundation

/// ユーザー別の学習ペース・目標
public struct UserLearningProfile: Codable {
    public var paceFactor: Double        // 出題間隔の倍率（>1で速く伸ばす）
    public var targetAccuracy: Double    // 目標精度（例: 0.95）
    public var masteryWindowSize: Int    // 100% 判定ウィンドウ
    
    // 追加の学習特徴
    public var forgettingFactor: Double  // 忘却傾向（<1.0: 忘れやすい → 間隔伸長を抑える）
    public var alternationBoost: Double  // 正誤交互傾向に基づく優先度ブースト（0..0.3 程度）

    public init(paceFactor: Double = 1.0,
                targetAccuracy: Double = 0.95,
                masteryWindowSize: Int = 5,
                forgettingFactor: Double = 1.0,
                alternationBoost: Double = 0.0) {
        self.paceFactor = paceFactor
        self.targetAccuracy = targetAccuracy
        self.masteryWindowSize = masteryWindowSize
        self.forgettingFactor = forgettingFactor
        self.alternationBoost = alternationBoost
    }
}
