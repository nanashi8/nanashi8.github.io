import SwiftUI

/// クイズエラー表示
/// エラーメッセージと、設定確認や戻るボタンを表示
struct QuizErrorView: View {
    /// エラーメッセージ
    let message: String
    
    /// ホームに戻るアクション
    let onDismiss: () -> Void
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // エラーアイコン
                Image(systemName: "exclamationmark.triangle")
                    .font(.system(size: 60))
                    .foregroundColor(.orange)
                    .padding(.top, 40)

                // エラータイトル
                Text("クイズを開始できません")
                    .font(.title2)
                    .bold()

                // エラーメッセージ
                Text(message)
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)

                // アクションボタン
                VStack(spacing: 12) {
                    // 設定確認ボタン
                    NavigationLink(destination: QuizSettingsView()) {
                        HStack {
                            Image(systemName: "gearshape")
                            Text("出題設定を確認")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.accentColor)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                    .padding(.horizontal)

                    // ホームに戻るボタン
                    Button("ホームに戻る") {
                        onDismiss()
                    }
                    .buttonStyle(.bordered)
                    .padding(.horizontal)
                }
                .padding(.top, 8)

                Spacer()
            }
        }
        .background(Color(uiColor: .systemGroupedBackground))
    }
}

// MARK: - Preview
#Preview {
    NavigationStack {
        QuizErrorView(
            message: "CSVファイルが選択されていません。",
            onDismiss: {}
        )
    }
}
