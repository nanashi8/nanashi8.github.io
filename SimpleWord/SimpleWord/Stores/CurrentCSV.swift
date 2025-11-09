// CurrentCSV.swift
// 現在出題中のCSV名を保持するシングルトン
// - 何を: アプリ全体で参照される現在のCSV名を @Published で保持し、UserDefaults に永続化します。
// - なぜ: View 間で一貫した参照（単一の情報源 Single Source of Truth）にするため。

import Foundation
import Combine

public final class CurrentCSV: ObservableObject {
    public static let shared = CurrentCSV()

    @Published public var name: String? {
        didSet { save() }
    }

    private let key = "CurrentCSVName_v1"

    private init() {
        // 初期値は UserDefaults から復元
        self.name = UserDefaults.standard.string(forKey: key)
    }

    private func save() {
        if let n = name, !n.isEmpty {
            UserDefaults.standard.set(n, forKey: key)
        } else {
            UserDefaults.standard.removeObject(forKey: key)
        }
    }
}
