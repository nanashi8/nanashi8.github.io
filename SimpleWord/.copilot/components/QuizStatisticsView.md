# QuizStatisticsView 仕様書

最終更新: 2025年10月18日

---

## 責務
- CSV名、学習モード、正答率、合格数、総出題数、バッチサイズを表示
- 合格数・総出題数の変化時に光るアニメーション効果を制御

---

## 入力パラメータ

### 必須
```swift
let csvName: String                           // CSV名
let learningMode: String                      // 学習モード表示名
let accuracy: Int                             // 正答率（%）
let passedCount: Int                          // 合格数
let totalCount: Int                           // 総出題数
let batchSize: Int                            // バッチサイズ
```

### Binding
```swift
@Binding var shouldAnimatePassedCount: Bool   // 合格数アニメーションフラグ
@Binding var shouldAnimateTotalCount: Bool    // 総出題数アニメーションフラグ
```

---

## アニメーション仕様

### 合格数
- **色**: 通常時は`.secondary`、アニメーション時は`.green`
- **スケール**: 通常時は1.0、アニメーション時は1.3倍
- **持続時間**: 1.2秒

### 総出題数
- **色**: 通常時は`.secondary`、アニメーション時は`.orange`
- **スケール**: 通常時は1.0、アニメーション時は1.3倍
- **持続時間**: 1.2秒

---

## 実装例

```swift
import SwiftUI

struct QuizStatisticsView: View {
    let csvName: String
    let learningMode: String
    let accuracy: Int
    let passedCount: Int
    let totalCount: Int
    let batchSize: Int
    
    @Binding var shouldAnimatePassedCount: Bool
    @Binding var shouldAnimateTotalCount: Bool
    
    var body: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 8) {
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
                
                HStack(spacing: 12) {
                    Text("正答率: \(accuracy)%")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("合格数: \(passedCount)")
                        .font(.caption)
                        .foregroundColor(shouldAnimatePassedCount ? .green : .secondary)
                        .scaleEffect(shouldAnimatePassedCount ? 1.3 : 1.0)
                        .animation(.spring(response: 0.4, dampingFraction: 0.5), value: shouldAnimatePassedCount)
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
```

---

## 依存コンポーネント
- `SectionCard` - カード表示用共通コンポーネント

---
