import SwiftUI

/// 問題なし表示
/// フィルタ条件に一致する問題がない場合に表示
struct QuizEmptyView: View {
    /// 戻るアクション
    let onDismiss: () -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            // 空のアイコン
            Image(systemName: "doc.text")
                .font(.largeTitle)
                .foregroundColor(.secondary)
            
            // タイトル
            Text("問題がありません")
                .font(.headline)
            
            // 説明
            Text("CSVファイルを選択してから出題設定を行ってください。")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            // 戻るボタン
            Button("戻る") {
                onDismiss()
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
    }
}

// MARK: - Preview
#Preview {
    QuizEmptyView(onDismiss: {})
}
