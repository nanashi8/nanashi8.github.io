//
//  QuizStatisticsView.swift
//  SimpleWord
//
//  Created by GitHub Copilot on 2025/10/18.
//

// 統計表示コンポーネント
// - 何を: CSV名、学習モード、正答率、合格数、総出題数、バッチサイズを表示
// - なぜ: QuizViewから統計表示部分を分離し、可読性と保守性を向上させるため

import SwiftUI

struct QuizStatisticsView: View {
    let csvName: String
    let learningMode: String
    let accuracy: Double
    let passedCount: Int
    let totalCount: Int
    let batchSize: Int
    
    @Binding var shouldAnimatePassedCount: Bool
    @Binding var shouldAnimateTotalCount: Bool
    
    var body: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 8) {
                // CSV名と学習モード
                HStack {
                    Text("CSV:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(csvName)
                        .font(.caption)
                    Spacer()
                    Text("学習モード:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(learningMode)
                        .font(.caption)
                        .foregroundColor(.blue)
                }
                
                // 統計情報
                HStack(spacing: 12) {
                    Text("正答率: \(String(format: "%.1f", accuracy))%")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    // 合格数: 新しい単語が追加されたら光る
                    Text("合格数: \(passedCount)")
                        .font(.caption)
                        .foregroundColor(shouldAnimatePassedCount ? .green : .secondary)
                        .scaleEffect(shouldAnimatePassedCount ? 1.3 : 1.0)
                        .animation(.spring(response: 0.4, dampingFraction: 0.5), value: shouldAnimatePassedCount)
                    
                    // 総出題数: 新しい単語が追加されたら光る
                    Text("総出題: \(totalCount)")
                        .font(.caption)
                        .foregroundColor(shouldAnimateTotalCount ? .orange : .secondary)
                        .scaleEffect(shouldAnimateTotalCount ? 1.3 : 1.0)
                        .animation(.spring(response: 0.4, dampingFraction: 0.5), value: shouldAnimateTotalCount)
                    
                    Spacer()
                    
                    Text("バッチサイズ: \(batchSize)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Preview
#Preview {
    VStack(spacing: 20) {
        QuizStatisticsView(
            csvName: "中学英単語.csv",
            learningMode: "標準モード",
            accuracy: 85.0,
            passedCount: 8,
            totalCount: 10,
            batchSize: 10,
            shouldAnimatePassedCount: .constant(false),
            shouldAnimateTotalCount: .constant(false)
        )
        
        QuizStatisticsView(
            csvName: "高校単語.csv",
            learningMode: "集中モード",
            accuracy: 92.5,
            passedCount: 15,
            totalCount: 18,
            batchSize: 20,
            shouldAnimatePassedCount: .constant(true),
            shouldAnimateTotalCount: .constant(false)
        )
    }
    .padding()
    .background(Color(uiColor: .systemGroupedBackground))
}
