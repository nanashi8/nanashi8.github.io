//
//  NoFieldsWarningView.swift
//  SimpleWord
//
//  Created by リファクタリング フェーズ2
//

// 分野列警告コンポーネント
// - 何を: CSVに分野列が見つからない場合の案内メッセージを表示
// - なぜ: ユーザーがCSVの構造を理解し、適切に修正できるようにするため

import SwiftUI

/// 分野列が見つからない場合の警告を表示するコンポーネント
struct NoFieldsWarningView: View {
    let cardBackground: Color
    
    var body: some View {
        SectionCard(backgroundColor: cardBackground) {
            VStack(alignment: .leading, spacing: 6) {
                Text("このCSVには分野（カテゴリ）列が見つかりません。")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text("CSV のヘッダに '分野'、'カテゴリー'、'カテゴリ' または英語の 'category' / 'fields' の列があるか確認してください。")
                    .font(.caption2)
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
        Section(header: Text("フィルタ設定")) {
            NoFieldsWarningView(
                cardBackground: Color(uiColor: .secondarySystemBackground)
            )
        }
    }
}
