import SwiftUI

/// クイズ読み込み中の表示
/// ProgressView とメッセージを表示して、データ読み込み中であることをユーザーに伝える
struct QuizLoadingView: View {
    var body: some View {
        VStack(spacing: 16) {
            // 読み込み中インジケータ
            ProgressView()
            
            // 読み込み中メッセージ
            Text("問題を読み込み中...")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Preview
#Preview {
    QuizLoadingView()
}
