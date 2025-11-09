// PrototypeView.swift
// シンプルなプロトタイプ画面（タブに分けるための独立機能）

import SwiftUI

struct PrototypeView: View {
    @State private var counter = 0
    @EnvironmentObject var currentCSV: CurrentCSV

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Text("Prototype: サンプル機能")
                    .font(.title2)
                    .padding(.top)

                Text("現在のCSV: \(currentCSV.name ?? \"未選択\")")
                    .foregroundColor(.secondary)

                Button(action: {
                    counter += 1
                }) {
                    Label("カウント: \(counter)", systemImage: "plus.circle")
                }
                .buttonStyle(.borderedProminent)

                Spacer()
            }
            .padding()
            .navigationTitle("Prototype")
        }
    }
}

#Preview {
    PrototypeView()
        .environmentObject(CurrentCSV.shared)
}
