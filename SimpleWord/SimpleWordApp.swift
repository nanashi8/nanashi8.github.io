//
//  SimpleWordApp.swift
//  SimpleWord
//
//  Created by YUICHI NAKAMURA on 2025/10/06.
//

// アプリのエントリポイント（@main）
// - 何を: 画面ルートに ContentView を表示し、Core Data のコンテキストと各種ストア（設定・結果・単語成績）を注入します。
// - なぜ: どの画面でも同じデータ/設定を共有できるようにするため（状態の単一管理点）。

import SwiftUI
import CoreData

@main
struct SimpleWordApp: App {
    let persistenceController = PersistenceController.shared
    // CurrentCSVを最初に初期化
    @StateObject private var currentCSV = CurrentCSV.shared
    // add stores - currentCSVを注入
    @StateObject private var quizSettings = QuizSettings(currentCSV: CurrentCSV.shared)
    @StateObject private var scoreStore = ScoreStore()
    @StateObject private var wordScoreStore = WordScoreStore()
    // 追加: 外観マネージャをアプリ全体に提供
    @StateObject private var appearanceManager = AppearanceManager()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
                .environmentObject(quizSettings)
                .environmentObject(scoreStore)
                .environmentObject(wordScoreStore)
                .environmentObject(currentCSV)
                // 追加: 外観設定を環境に注入
                .environmentObject(appearanceManager)
                // 追加: 選択された外観をアプリ全体に適用
                .preferredColorScheme(appearanceManager.appearance.colorScheme)
        }
    }
}
