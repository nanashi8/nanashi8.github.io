//
//  ContentView.swift
//  SimpleWord
//
//  Created by YUICHI NAKAMURA on 2025/10/06.
//

// ホーム画面（カード式メニュー）
// - 何を: クイズ/単語リスト/CSV管理/設定/成績/ID管理 への入口をカードで提供します。
// - なぜ: 初心者にも分かりやすく、目的の機能にすぐ移動できるようにするため。

import SwiftUI

struct ContentView: View {
    // QuizViewに渡すための環境オブジェクト
    @EnvironmentObject var wordScoreStore: WordScoreStore
    @EnvironmentObject var currentCSV: CurrentCSV
    @EnvironmentObject var quizSettings: QuizSettings

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    // 見出し（クイックアクセス）は廃止しました
                    // Text("クイックアクセス") ... を削除

                    VStack(spacing: 12) {
                        // 1) クイズをはじめる
                        NavigationLink(destination: QuizView()
                            .environmentObject(wordScoreStore)
                            .environmentObject(currentCSV)
                            .environmentObject(quizSettings)) {
                            SectionCard {
                                HStack(spacing: 12) {
                                    Image(systemName: "questionmark.circle")
                                        .imageScale(.large)
                                        .foregroundColor(.accentColor)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("クイズをはじめる")
                                            .font(.headline)
                                            .foregroundColor(.primary)
                                        Text("選んだCSVから出題します")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .foregroundColor(Color(UIColor.tertiaryLabel))
                                }
                            }
                            .padding(.horizontal)
                        }

                        // 2) 単語リスト（ナビゲーター）は廃止済み

                        // 4) 出題設定
                        NavigationLink(destination: QuizSettingsView()
                            .environmentObject(wordScoreStore)) {
                            SectionCard {
                                HStack(spacing: 12) {
                                    Image(systemName: "gearshape")
                                        .imageScale(.large)
                                        .foregroundColor(.accentColor)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("出題設定")
                                            .font(.headline)
                                        Text("分野・難易度・回数・合格率")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .foregroundColor(Color(UIColor.tertiaryLabel))
                                }
                            }
                            .padding(.horizontal)
                        }
                        .buttonStyle(.plain)



                        // 3) 問題集管理
                        NavigationLink {
                            CSVManagerView()
                        } label: {
                            SectionCard {
                                HStack(spacing: 12) {
                                    Image(systemName: "doc.text")
                                        .imageScale(.large)
                                        .foregroundColor(.accentColor)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("問題集管理")
                                            .font(.headline)
                                        Text("インポート・エクスポート・編集")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .foregroundColor(Color(UIColor.tertiaryLabel))
                                }
                            }
                            .padding(.horizontal)
                        }
                        .buttonStyle(.plain)



                        // 5) 学習結果
                        NavigationLink {
                            ScoreView()
                        } label: {
                            SectionCard {
                                HStack(spacing: 12) {
                                    Image(systemName: "chart.bar")
                                        .imageScale(.large)
                                        .foregroundColor(.accentColor)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("学習結果")
                                            .font(.headline)
                                        Text("CSV別・単語別の成績")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .foregroundColor(Color(UIColor.tertiaryLabel))
                                }
                            }
                            .padding(.horizontal)
                        }
                        .buttonStyle(.plain)

                        // 6) IDマップ管理
                        NavigationLink {
                            IDMapAdminView()
                        } label: {
                            SectionCard {
                                HStack(spacing: 12) {
                                    Image(systemName: "number")
                                        .imageScale(.large)
                                        .foregroundColor(.accentColor)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("IDマップ管理")
                                            .font(.headline)
                                        Text("プリウォーム・エクスポート・パージ")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .foregroundColor(Color(UIColor.tertiaryLabel))
                                }
                            }
                            .padding(.horizontal)
                        }
                        .buttonStyle(.plain)
                    }

                    Spacer(minLength: 12)
                }
                .padding(.vertical)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle("SimpleWord ホーム")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(WordScoreStore())
        .environmentObject(CurrentCSV.shared)
        .environmentObject(QuizSettings(currentCSV: CurrentCSV.shared))
}
