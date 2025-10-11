//
//  QuizNavigationButtonsView.swift
//  SimpleWord
//
//  Created by GitHub Copilot on 2025/10/18.
//

// ナビゲーションボタン表示コンポーネント
// - 何を: 前へ・次へボタンを表示
// - なぜ: QuizViewからナビゲーション部分を分離し、可読性と保守性を向上させるため

import SwiftUI

struct QuizNavigationButtonsView: View {
    let canGoPrevious: Bool
    let canGoNext: Bool
    let onPrevious: () -> Void
    let onNext: () -> Void
    
    var body: some View {
        HStack(spacing: 12) {
            Button(action: onPrevious) {
                HStack {
                    Image(systemName: "chevron.left")
                    Text("前へ")
                }
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
            .disabled(!canGoPrevious)
            
            Button(action: onNext) {
                HStack {
                    Text("次へ")
                    Image(systemName: "chevron.right")
                }
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .disabled(!canGoNext)
        }
    }
}

// MARK: - Preview
#Preview {
    VStack(spacing: 20) {
        QuizNavigationButtonsView(
            canGoPrevious: false,
            canGoNext: true,
            onPrevious: { print("前へ") },
            onNext: { print("次へ") }
        )
        
        QuizNavigationButtonsView(
            canGoPrevious: true,
            canGoNext: true,
            onPrevious: { print("前へ") },
            onNext: { print("次へ") }
        )
        
        QuizNavigationButtonsView(
            canGoPrevious: true,
            canGoNext: false,
            onPrevious: { print("前へ") },
            onNext: { print("次へ") }
        )
    }
    .padding()
}
