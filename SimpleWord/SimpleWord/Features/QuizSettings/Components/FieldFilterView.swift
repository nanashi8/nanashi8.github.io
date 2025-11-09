//
//  FieldFilterView.swift
//  SimpleWord
//
//  Created by リファクタリング フェーズ2
//

// 分野フィルターコンポーネント
// - 何を: ホイールピッカーで分野を選択し、複数の分野をフィルタに追加/削除
// - なぜ: 特定の分野に絞った出題を可能にするため

import SwiftUI

/// 分野選択ホイールとフィルタ管理を表示するコンポーネント
struct FieldFilterView: View {
    let availableFields: [String]
    @Binding var selectedIndex: Int
    @Binding var selectedFields: [String]
    let onAdd: (Int) -> Void
    let onRemove: (String) -> Void
    let cardBackground: Color
    
    var body: some View {
        SectionCard(backgroundColor: cardBackground) {
            VStack(alignment: .leading, spacing: 8) {
                // セクションヘッダー
                SectionHeader(systemImage: "square.grid.2x2", title: "分野を選択")
                
                // ホイールピッカー
                Picker(selection: $selectedIndex, label: Text("分野")) {
                    ForEach(availableFields.indices, id: \.self) { i in
                        Text(availableFields[i]).tag(i)
                    }
                }
                .pickerStyle(.wheel)
                .frame(height: 100)
                
                // 追加・削除コントロール
                HStack {
                    // 追加ボタン
                    Button(action: { onAdd(selectedIndex) }) {
                        Label("追加", systemImage: "plus")
                    }
                    
                    Spacer()
                    
                    // 選択済みフィルタ表示
                    Text("選択済: ")
                        .font(.caption)
                    
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 6) {
                            ForEach(selectedFields, id: \.self) { f in
                                HStack(spacing: 6) {
                                    Text(f).font(.caption2)
                                    Button(action: { onRemove(f) }) {
                                        Image(systemName: "xmark.circle.fill")
                                    }
                                    .buttonStyle(.plain)
                                }
                                .padding(6)
                                .background(Color(uiColor: .secondarySystemBackground))
                                .cornerRadius(8)
                            }
                        }
                    }
                }
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
            FieldFilterView(
                availableFields: ["全て", "動詞", "名詞", "形容詞", "副詞"],
                selectedIndex: .constant(0),
                selectedFields: .constant(["動詞", "名詞"]),
                onAdd: { _ in print("追加") },
                onRemove: { _ in print("削除") },
                cardBackground: Color(uiColor: .secondarySystemBackground)
            )
        }
    }
}
