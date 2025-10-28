//
//  FlowLayout.swift
//  SimpleWord
//
//  解説表示用のフローレイアウト
//  タグのように複数の要素を横に並べ、幅が足りない場合は自動的に改行する
//

import SwiftUI

/// フローレイアウト：タグのように要素を配置
struct FlowLayout<Content: View>: View {
    let items: [String]
    let spacing: CGFloat
    let content: (String) -> Content
    
    @State private var totalHeight: CGFloat = 0
    
    init(items: [String], spacing: CGFloat = 8, @ViewBuilder content: @escaping (String) -> Content) {
        self.items = items
        self.spacing = spacing
        self.content = content
    }
    
    var body: some View {
        GeometryReader { geometry in
            self.generateContent(in: geometry)
        }
        .frame(height: totalHeight)
    }
    
    private func generateContent(in geometry: GeometryProxy) -> some View {
        var width: CGFloat = 0
        var height: CGFloat = 0
        var currentRowHeight: CGFloat = 0
        
        return ZStack(alignment: .topLeading) {
            ForEach(items, id: \.self) { item in
                content(item)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(
                        GeometryReader { itemGeometry in
                            Color.clear.preference(
                                key: ViewHeightKey.self,
                                value: [itemGeometry.size.height]
                            )
                        }
                    )
                    .alignmentGuide(.leading) { dimension in
                        if abs(width - dimension.width) > geometry.size.width {
                            width = 0
                            height -= currentRowHeight + spacing
                            currentRowHeight = dimension.height
                        }
                        let result = width
                        if item == items.last {
                            width = 0
                        } else {
                            width -= dimension.width + spacing
                        }
                        return result
                    }
                    .alignmentGuide(.top) { dimension in
                        let result = height
                        if item == items.last {
                            height = 0
                        }
                        currentRowHeight = max(currentRowHeight, dimension.height)
                        return result
                    }
            }
        }
        .onPreferenceChange(ViewHeightKey.self) { heights in
            if let maxHeight = heights.max() {
                self.totalHeight = maxHeight + spacing
            }
        }
    }
}

/// ビューの高さを取得するためのPreferenceKey
private struct ViewHeightKey: PreferenceKey {
    static var defaultValue: [CGFloat] = []
    static func reduce(value: inout [CGFloat], nextValue: () -> [CGFloat]) {
        value.append(contentsOf: nextValue())
    }
}
