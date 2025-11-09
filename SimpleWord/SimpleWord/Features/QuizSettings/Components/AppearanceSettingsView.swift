//
//  AppearanceSettingsView.swift
//  SimpleWord
//
//  Created by リファクタリング フェーズ2
//

// 外観設定コンポーネント
// - 何を: アプリ全体の外観（ライト/ダーク/システム）を選択
// - なぜ: ユーザーの好みに合わせた見た目を提供するため

import SwiftUI

/// アプリ外観設定を表示するコンポーネント
struct AppearanceSettingsView: View {
    @Binding var appearance: Appearance
    let cardBackground: Color
    
    var body: some View {
        SectionCard(backgroundColor: cardBackground) {
            VStack(alignment: .leading, spacing: 8) {
                // ホイールピッカー
                Picker("外観モード", selection: $appearance) {
                    ForEach(Appearance.allCases) { option in
                        Text(option.displayName).tag(option)
                    }
                }
                .pickerStyle(.wheel)
                .frame(height: 140)
                
                // 説明テキスト
                Text("アプリ全体の見た目を切り替えます")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .listRowInsets(EdgeInsets())
        .listRowBackground(cardBackground)
    }
}

// MARK: - Preview
#Preview {
    List {
        Section(header: Text("外観")) {
            AppearanceSettingsView(
                appearance: .constant(.system),
                cardBackground: Color(uiColor: .secondarySystemBackground)
            )
        }
    }
}
