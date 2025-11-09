//
//  CSVSelectionView.swift
//  SimpleWord
//
//  Created by リファクタリング フェーズ2
//

// CSV選択コンポーネント
// - 何を: ホイールピッカーでCSVを選択し、現在のCSVを設定
// - なぜ: 出題元CSVを簡単に切り替えられるようにするため

import SwiftUI

/// CSV選択ホイールと設定ボタンを表示するコンポーネント
struct CSVSelectionView: View {
    let availableCSVs: [String]
    let currentCSVName: String?
    @Binding var selectedIndex: Int
    let onSetCSV: () -> Void
    let cardBackground: Color
    
    var body: some View {
        if availableCSVs.isEmpty {
            // CSVが見つからない場合
            SectionCard(backgroundColor: cardBackground) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("CSVが見つかりません")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("Resources または Documents に CSV を配置してください。")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .listRowInsets(EdgeInsets())
            .listRowBackground(cardBackground)
        } else {
            // CSV選択ホイール
            SectionCard(backgroundColor: cardBackground) {
                VStack(alignment: .leading, spacing: 8) {
                    // ホイールピッカー
                    Picker("CSV", selection: $selectedIndex) {
                        ForEach(availableCSVs.indices, id: \.self) { i in
                            Text(availableCSVs[i]).tag(i)
                        }
                    }
                    .pickerStyle(.wheel)
                    .frame(height: 100)
                    
                    // 設定ボタンと現在のCSV表示
                    HStack {
                        Button(action: onSetCSV) {
                            Text("このCSVを出題に設定")
                        }
                        .buttonStyle(.borderedProminent)
                        .frame(maxWidth: .infinity, alignment: .center)
                        
                        Spacer()
                        
                        Text("現在: \(currentCSVName ?? "(未設定)")")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .listRowInsets(EdgeInsets())
            .listRowBackground(cardBackground)
        }
    }
}

// MARK: - Preview
#Preview {
    List {
        Section(header: Text("CSV選択")) {
            CSVSelectionView(
                availableCSVs: ["中学英単語.csv", "高校英単語.csv", "TOEIC頻出.csv"],
                currentCSVName: "中学英単語.csv",
                selectedIndex: .constant(0),
                onSetCSV: { print("CSV設定") },
                cardBackground: Color(uiColor: .secondarySystemBackground)
            )
        }
    }
}
