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
    // add stores
    @StateObject var quizSettings = QuizSettings()
    @StateObject var scoreStore = ScoreStore()
    @StateObject var wordScoreStore = WordScoreStore()
    @StateObject var currentCSV = CurrentCSV.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
                .environmentObject(quizSettings)
                .environmentObject(scoreStore)
                .environmentObject(wordScoreStore)
                .environmentObject(currentCSV)
        }
    }
}
