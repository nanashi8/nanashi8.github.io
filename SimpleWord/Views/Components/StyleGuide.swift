// StyleGuide.swift
// 共通UIコンポーネント集（バッジ/タグ/カードなど）
// - 何を: 繰り返し使う見た目を部品化して、画面の統一感と可読性を保ちます。
// - なぜ: 初心者でもWhere/Whyが追いやすく、変更の影響範囲を小さくするため。

import SwiftUI

// 難易度に応じた色付け（初級・中級・上級）
struct DifficultyBadge: View {
    let text: String
    var body: some View {
        Text(text)
            .font(.caption2)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(colorForDifficulty(text).opacity(0.15))
            .foregroundColor(colorForDifficulty(text).opacity(0.9))
            .clipShape(Capsule())
    }

    private func colorForDifficulty(_ s: String) -> Color {
        let t = s.trimmingCharacters(in: .whitespaces)
        if t.contains("初級") { return .green }
        if t.contains("中級") { return .orange }
        if t.contains("上級") { return .red }
        return .gray
    }
}

// 分野や関連語を小さなタグで表示
struct TagCapsule: View {
    let label: String
    var body: some View {
        Text(label)
            .font(.caption2)
            .padding(.horizontal, 6)
            .padding(.vertical, 3)
            .background(Color(uiColor: .secondarySystemBackground))
            .clipShape(Capsule())
    }
}

// セクションカード風の背景（読みやすいカード）
struct SectionCard<Content: View>: View {
    let content: Content
    // 新: 背景色を外部から指定可能（デフォルトは従来の secondarySystemBackground）
    let backgroundColor: Color

    init(backgroundColor: Color = Color(uiColor: .secondarySystemBackground), @ViewBuilder content: () -> Content) {
        self.content = content()
        self.backgroundColor = backgroundColor
    }
    var body: some View {
        content
            .padding(12)
            .background(backgroundColor)
            .cornerRadius(12)
    }
}

// 新規: カード風アイコンボタン（ツールバー用の小型カード）
struct CardIconButton: View {
    let systemImage: String
    let title: String?
    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: systemImage)
                .imageScale(.medium)
                .foregroundColor(.primary)
            if let t = title {
                Text(t)
                    .font(.caption2)
                    .foregroundColor(.primary)
            }
        }
        .padding(.vertical, 6)
        .padding(.horizontal, 10)
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(10)
        .contentShape(RoundedRectangle(cornerRadius: 10))
    }
}

// 見出し（アイコン付き）
struct SectionHeader: View {
    let systemImage: String
    let title: String
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: systemImage)
                .foregroundColor(.accentColor)
            Text(title)
                .font(.headline)
        }
    }
}
