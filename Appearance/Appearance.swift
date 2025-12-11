// filepath: /path/to/project/SimpleWord/SimpleWord/Appearance.swift
//
//  Appearance.swift
//  SimpleWord
//
//  アプリ全体の外観設定（システム/ライト/ダーク）を型安全に管理する小さな ObservableObject を追加します。
//  - AppStorage による永続化
//  - SwiftUI で監視可能な published プロパティ

import SwiftUI
import Combine

/// アプリ外観の列挙型（文字列で永続化される）
public enum Appearance: String, CaseIterable, Identifiable {
    case system
    case light
    case dark

    public var id: String { rawValue }

    /// ユーザー向け表示文字列
    public var displayName: String {
        switch self {
        case .system: return "システムに合わせる"
        case .light: return "ライト"
        case .dark:  return "ダーク"
        }
    }

    /// SwiftUI の ColorScheme に変換（system は nil）
    public var colorScheme: ColorScheme? {
        switch self {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }
}

/// AppStorage をバックエンドにした ObservableObject。アプリ起動時に AppStorage から読み込み、変更時に保存する。
public final class AppearanceManager: ObservableObject {
    // UserDefaults を直接使用して AppStorage のプロパティラッパーによる初期化順の問題を回避
    private let storageKey = "appearance"
    private var storedRawValue: String {
        UserDefaults.standard.string(forKey: storageKey) ?? Appearance.system.rawValue
    }

    @Published public var appearance: Appearance = .system {
        didSet {
            UserDefaults.standard.set(appearance.rawValue, forKey: storageKey)
        }
    }

    public init() {
        // UserDefaults から読み出して初期値を設定
        self.appearance = Appearance(rawValue: storedRawValue) ?? .system
    }
}
