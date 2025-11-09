//
//  DifficultyFilterView.swift
//  SimpleWord
//
//  Created by リファクタリング フェーズ2
//

// 難易度フィルターコンポーネント
// - 何を: ホイールピッカーで難易度を選択し、複数の難易度をフィルタに追加/削除
// - なぜ: 特定の難易度に絞った出題を可能にするため

import SwiftUI

/// 難易度選択ホイールとフィルタ管理を表示するコンポーネント
struct DifficultyFilterView: View {
    let availableDifficulties: [String]
    @Binding var selectedIndex: Int
    @Binding var selectedDifficulties: [String]
    let onAdd: (Int) -> Void
    let onRemove: (String) -> Void
    let cardBackground: Color
    
    var body: some View {
        SectionCard(backgroundColor: cardBackground) {
            VStack(alignment: .leading, spacing: 8) {
                // セクションヘッダー
                SectionHeader(systemImage: "flag.checkered", title: "難易度を選択")
                
                // ホイールピッカー
                Picker(selection: $selectedIndex, label: Text("難易度")) {
                    ForEach(availableDifficulties.indices, id: \.self) { i in
                        Text(availableDifficulties[i]).tag(i)
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
                            ForEach(selectedDifficulties, id: \.self) { d in
                                HStack(spacing: 6) {
                                    Text(d).font(.caption2)
                                    Button(action: { onRemove(d) }) {
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
        Section(header: Text("難易度設定")) {
            DifficultyFilterView(
                availableDifficulties: ["全て", "基礎", "標準", "応用", "発展"],
                selectedIndex: .constant(0),
                selectedDifficulties: .constant(["基礎", "標準"]),
                onAdd: { _ in print("追加") },
                onRemove: { _ in print("削除") },
                cardBackground: Color(uiColor: .secondarySystemBackground)
            )
        }
    }
}
