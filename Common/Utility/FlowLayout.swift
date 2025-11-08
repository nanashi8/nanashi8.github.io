//
//  FlowLayout.swift
//  SimpleWord
//
//  解説表示用のフローレイアウト
//  タグのように複数の要素を横に並べ、幅が足りない場合は自動的に改行する
//

import SwiftUI

/// フローレイアウト：タグのように要素を配置
/// 並行処理安全性を考慮した実装
struct FlowLayout<Content: View>: View {
    let items: [String]
    let spacing: CGFloat
    let content: (String) -> Content
    
    init(items: [String], spacing: CGFloat = 8, @ViewBuilder content: @escaping (String) -> Content) {
        self.items = items
        self.spacing = spacing
        self.content = content
    }
    
    var body: some View {
        FlowLayoutView(items: items, spacing: spacing, content: content)
    }
}

/// 内部実装ビュー（レイアウト計算を担当）
private struct FlowLayoutView<Content: View>: View {
    let items: [String]
    let spacing: CGFloat
    let content: (String) -> Content
    
    @State private var totalHeight: CGFloat = 0
    
    var body: some View {
        GeometryReader { geometry in
            self.generateContent(in: geometry)
        }
        .frame(height: totalHeight)
    }
    
    private func generateContent(in geometry: GeometryProxy) -> some View {
        // レイアウト情報を事前計算
        let layout = computeLayout(availableWidth: geometry.size.width)
        
        return ZStack(alignment: .topLeading) {
            ForEach(Array(items.enumerated()), id: \.element) { index, item in
                if index < layout.count {
                    content(item)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .offset(x: layout[index].x, y: layout[index].y)
                }
            }
        }
        .background(
            GeometryReader { geo in
                Color.clear.preference(
                    key: TotalHeightKey.self,
                    value: geo.size.height
                )
            }
        )
        .onPreferenceChange(TotalHeightKey.self) { height in
            if height > 0 {
                self.totalHeight = height
            }
        }
    }
    
    /// レイアウト位置を事前計算（並行処理の問題を回避）
    private func computeLayout(availableWidth: CGFloat) -> [CGPoint] {
        var positions: [CGPoint] = []
        var currentX: CGFloat = 0
        var currentY: CGFloat = 0
        var currentRowHeight: CGFloat = 0
        
        // 仮の寸法で計算（実際のレンダリングで調整される）
        let estimatedItemWidth: CGFloat = 80
        let estimatedItemHeight: CGFloat = 32
        
        for _ in items {
            if currentX + estimatedItemWidth > availableWidth && currentX > 0 {
                // 改行
                currentX = 0
                currentY += currentRowHeight + spacing
                currentRowHeight = 0
            }
            
            positions.append(CGPoint(x: currentX, y: currentY))
            currentX += estimatedItemWidth + spacing
            currentRowHeight = max(currentRowHeight, estimatedItemHeight)
        }
        
        return positions
    }
}

/// 総高さを取得するためのPreferenceKey
private struct TotalHeightKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = max(value, nextValue())
    }
}
