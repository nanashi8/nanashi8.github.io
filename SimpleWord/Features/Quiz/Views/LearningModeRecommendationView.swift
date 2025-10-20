// LearningModeRecommendationView.swift
// 学習モード別の推奨設定を表示するビュー
// - 何を: 各学習モードの説明と推奨される使い方を表示します。
// - なぜ: ユーザーが適切な学習モードを選択できるようにガイドするため。

import SwiftUI

/// 学習モード推奨設定の表示ビュー
struct LearningModeRecommendationView: View {
    let mode: LearningMode

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: modeIcon)
                    .font(.title2)
                    .foregroundColor(modeColor)
                Text(mode.displayName)
                    .font(.headline)
                    .foregroundColor(.primary)
            }

            Text(modeDescription)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .fixedSize(horizontal: false, vertical: true)

            Divider()

            VStack(alignment: .leading, spacing: 8) {
                Text("このモードに適したシーン:")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .textCase(.uppercase)

                ForEach(recommendedScenarios, id: \.self) { scenario in
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.caption)
                            .foregroundColor(.green)
                        Text(scenario)
                            .font(.subheadline)
                            .foregroundColor(.primary)
                    }
                }
            }

            if !tips.isEmpty {
                Divider()

                VStack(alignment: .leading, spacing: 8) {
                    Text("学習のコツ:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .textCase(.uppercase)

                    ForEach(tips, id: \.self) { tip in
                        HStack(alignment: .top, spacing: 8) {
                            Image(systemName: "lightbulb.fill")
                                .font(.caption)
                                .foregroundColor(.yellow)
                            Text(tip)
                                .font(.subheadline)
                                .foregroundColor(.primary)
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Mode-specific content

    private var modeIcon: String {
        switch mode {
        case .normal: return "book.fill"
        case .review: return "arrow.clockwise"
        case .remediation: return "star.fill"
        }
    }

    private var modeColor: Color {
        switch mode {
        case .normal: return .blue
        case .review: return .orange
        case .remediation: return .red
        }
    }

    private var modeDescription: String {
        switch mode {
        case .normal:
            return "新しい単語と復習が必要な単語をバランスよく学習します。初見の単語は集中的に反復し、既習単語は適度な間隔で復習します。"
        case .review:
            return "短期記憶〜中期記憶段階の単語を重点的に復習します。記憶の定着を確実にするための復習モードです。"
        case .remediation:
            return "苦手な単語や正答率の低い単語を集中的に学習します。記憶が不安定な初期段階の単語を徹底的に反復して定着させます。"
        }
    }

    private var recommendedScenarios: [String] {
        switch mode {
        case .normal:
            return [
                "新しい教材を学び始めるとき",
                "バランスよく語彙を増やしたいとき",
                "毎日の学習習慣として"
            ]
        case .review:
            return [
                "試験前の総復習",
                "学習済みの単語を定着させたいとき",
                "週末のまとめ復習として"
            ]
        case .remediation:
            return [
                "苦手な単語を克服したいとき",
                "正答率の低い分野を強化したいとき",
                "短期集中で記憶を定着させたいとき"
            ]
        }
    }

    private var tips: [String] {
        switch mode {
        case .normal:
            return [
                "1日10〜20分の学習を継続すると効果的",
                "新規単語は2〜3回繰り返すのがおすすめ"
            ]
        case .review:
            return [
                "前日や前週に学習した単語の復習に最適",
                "正答率80%以上を目指して復習しましょう"
            ]
        case .remediation:
            return [
                "繰り返し回数を多めに設定すると効果的",
                "焦らず、確実に1つずつ定着させましょう",
                "正答率50%未満の単語が減るまで継続"
            ]
        }
    }
}

// MARK: - Preview
#Preview("通常モード") {
    LearningModeRecommendationView(mode: .normal)
        .padding()
        .background(Color(uiColor: .systemGroupedBackground))
}

#Preview("復習モード") {
    LearningModeRecommendationView(mode: .review)
        .padding()
        .background(Color(uiColor: .systemGroupedBackground))
}

#Preview("補習モード") {
    LearningModeRecommendationView(mode: .remediation)
        .padding()
        .background(Color(uiColor: .systemGroupedBackground))
}
