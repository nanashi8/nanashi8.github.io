# QuizNavigationButtonsView 仕様書

最終更新: 2025年10月18日

---

## 責務
- 「前へ」「次へ」ボタンの表示
- ボタンの有効/無効状態の制御

---

## 入力パラメータ

### 必須
```swift
let canGoPrevious: Bool                       // 前へボタンが有効か
let canGoNext: Bool                           // 次へボタンが有効か
let onPrevious: () -> Void                    // 前へボタン押下時のコールバック
let onNext: () -> Void                        // 次へボタン押下時のコールバック
```

---

## 実装例

```swift
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
```

---

## 使用例

```swift
struct QuizView: View {
    var body: some View {
        QuizNavigationButtonsView(
            canGoPrevious: poolIndex > 0,
            canGoNext: selectedID != nil,
            onPrevious: { goPrevious() },
            onNext: { next() }
        )
    }
}
```

---

## 備考
- シンプルで独立性が高いコンポーネント
- UIロジックのみで、ビジネスロジックは含まない

---
