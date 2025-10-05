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
import CoreData

struct ContentView: View {
    @Environment(\.managedObjectContext) private var viewContext

    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \Item.timestamp, ascending: true)],
        animation: .default)
    private var items: FetchedResults<Item>

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    // 見出し（クイックアクセス）は廃止しました
                    // Text("クイックアクセス") ... を削除

                    VStack(spacing: 12) {
                        // 1) クイズをはじめる
                        NavigationLink {
                            QuizView()
                        } label: {
                            SectionCard {
                                HStack(spacing: 12) {
                                    Image(systemName: "questionmark.circle")
                                        .imageScale(.large)
                                        .foregroundColor(.accentColor)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("クイズをはじめる")
                                            .font(.headline)
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
                        .buttonStyle(.plain)

                        // 2) 単語リスト（ナビゲーター）は廃止済み

                        // 4) 出題設定
                        NavigationLink {
                            QuizSettingsView()
                        } label: {
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

    private func addItem() {
        withAnimation {
            let newItem = Item(context: viewContext)
            newItem.timestamp = Date()

            do {
                try viewContext.save()
            } catch {
                // Replace this implementation with code to handle the error appropriately.
                // fatalError() causes the application to generate a crash log and terminate. You should not use this function in a shipping application, although it may be useful during development.
                let nsError = error as NSError
                fatalError("Unresolved error \(nsError), \(nsError.userInfo)")
            }
        }
    }

    private func deleteItems(offsets: IndexSet) {
        withAnimation {
            offsets.map { items[$0] }.forEach(viewContext.delete)

            do {
                try viewContext.save()
            } catch {
                // Replace this implementation with code to handle the error appropriately.
                // fatalError() causes the application to generate a crash log and terminate. You should not use this function in a shipping application, although it may be useful during development.
                let nsError = error as NSError
                fatalError("Unresolved error \(nsError), \(nsError.userInfo)")
            }
        }
    }
}

private let itemFormatter: DateFormatter = {
    let formatter = DateFormatter()
    formatter.dateStyle = .short
    formatter.timeStyle = .medium
    return formatter
}()

#Preview {
    ContentView().environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
}
