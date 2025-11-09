//
//  SimpleWordApp.swift
//  SimpleWord
//
//  Created by YUICHI NAKAMURA on 2025/10/06.
//

import SwiftUI

@main
struct SimpleWordApp: App {
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
            TabView {
                ContentView()
                    .tabItem {
                        Label("Home", systemImage: "house")
                    }

                PrototypeView()
                    .tabItem {
                        Label("Prototype", systemImage: "wrench")
                    }
            }
            .environmentObject(quizSettings)
            .environmentObject(scoreStore)
            .environmentObject(wordScoreStore)
            .environmentObject(currentCSV)
            // 追加: 外観設定を環境に注入
            .environmentObject(appearanceManager)
            // 追加: 選択された外観をアプリ全体に適用
            .preferredColorScheme(appearanceManager.appearance.colorScheme)
            .onAppear {
                // アプリ起動時に現在のCSVがあればWordScoreStoreを切り替え
                if let csvName = currentCSV.name {
                    wordScoreStore.switchToCSV(csvName)
                }
            }
        }
    }
}

