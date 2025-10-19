import SwiftUI

// QuizView.swift
// クイズ画面の最小実装（UI表示とワードスコア参照）
// - 目的: 破損していた QuizView を復元し、最小限でビルド可能にする
// - 依存: QuestionItem, WordScoreStore

struct QuizView: View {
    // 単語スコアは環境オブジェクトで注入される想定
    @EnvironmentObject var wordScoreStore: WordScoreStore

    // テスト用に複数の問題を保持（将来的には QuizEngine から供給）
    @State private var currentIndex: Int = 0
    @State private var items: [QuestionItem] = []

    // 選択肢関連の状態（簡易実装: 現在表示中の問題に対する選択を保持）
    @State private var selectedChoiceID: UUID? = nil

    // 単純な選択肢モデル
    private struct Choice: Identifiable, Hashable {
        let id: UUID
        let text: String
        let isCorrect: Bool
    }

    var body: some View {
        // NavigationView は呼び出し元（ContentView）の NavigationView と競合するため除去
        VStack(spacing: 12) {
            if items.isEmpty {
                Text("問題データがありません。CSV管理で問題集を追加してください。")
                    .multilineTextAlignment(.center)
                    .padding()
            } else {
                let item = items[currentIndex]

                // 既存の QuestionCardView を利用して表示
                QuestionCardView(item: item)
                    .environmentObject(wordScoreStore)

                // 進捗表示
                HStack {
                    Text("問題: \(currentIndex + 1)/\(items.count)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Spacer()
                }
                .padding(.horizontal)

                // 選択肢の生成（表示専用のローカル配列を作る）
                let choices = makeChoices(for: item)
                let correctID = choices.first(where: { $0.isCorrect })?.id

                VStack(spacing: 10) {
                    // 選択肢カード群
                    ForEach(choices) { c in
                        ChoiceCardView(
                            id: c.id,
                            text: c.text,
                            selectedID: selectedChoiceID,
                            correctID: correctID
                        ) { chosenId in
                            // 初回選択のみ受け付ける簡易ロジック
                            if selectedChoiceID == nil {
                                selectedChoiceID = chosenId
                            }
                        }
                        .environmentObject(wordScoreStore)
                    }

                    // 「分からない」カード
                    DontKnowCardView(
                        id: UUID(),
                        selectedID: selectedChoiceID,
                        correctAnswerID: correctID
                    ) { _ in
                        if selectedChoiceID == nil {
                            // 分からないは選択扱いとしてダミーIDを設定する
                            selectedChoiceID = UUID()
                        }
                    }
                }
                .padding(.horizontal)

                HStack(spacing: 12) {
                    Button(action: prev) {
                        Label("前へ", systemImage: "chevron.left")
                    }
                    .disabled(currentIndex == 0)

                    Spacer()

                    Button(action: next) {
                        Label("次へ", systemImage: "chevron.right")
                    }
                    .disabled(currentIndex >= items.count - 1)
                }
                .padding(.horizontal)
            }

            Spacer()
        }
        .navigationTitle("クイズ")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear(perform: loadSampleIfNeeded)
        // currentIndex が変わったら選択状態をリセットする
        .onChange(of: currentIndex) {
            selectedChoiceID = nil
        }
        .padding(.top)
        .background(Color(uiColor: .systemGroupedBackground))
    }

    // MARK: - Actions
    private func next() {
        if currentIndex < items.count - 1 {
            currentIndex += 1
        }
    }

    private func prev() {
        if currentIndex > 0 {
            currentIndex -= 1
        }
    }

    // 単純な選択肢生成: 正答に item.meaning、他は関連語や他問題の意味から拝借
    private func makeChoices(for item: QuestionItem) -> [Choice] {
        var pool: [String] = []
        pool.append(contentsOf: item.relatedWords)
        pool.append(contentsOf: items.map { $0.meaning })

        // フィルタして重複を避ける
        pool = Array(Set(pool)).filter { !$0.isEmpty && $0 != item.meaning }

        // ランダムに3つ選ぶ（足りなければダミーを作る）
        var distractors: [String] = pool.shuffled().prefix(3).map { $0 }
        while distractors.count < 3 {
            distractors.append("(候補)\(Int.random(in: 1...100))")
        }

        // 正答をランダムな位置に挿入
        var options = distractors
        let insertIndex = Int.random(in: 0...options.count)
        options.insert(item.meaning, at: insertIndex)

        return options.map { text in Choice(id: UUID(), text: text, isCorrect: text == item.meaning) }
    }

    private func loadSampleIfNeeded() {
        // 簡易なサンプルをロード（CSV未接続環境でもUIが確認できるようにする）
        guard items.isEmpty else { return }
        items = [
            QuestionItem(term: "apple", reading: "アップル", meaning: "りんご", etymology: "", relatedWordsCSV: "fruit;food", relatedFieldsCSV: "English;Basic", difficulty: "初級"),
            QuestionItem(term: "book", reading: "ブック", meaning: "本", etymology: "", relatedWordsCSV: "read;paper", relatedFieldsCSV: "English;Basic", difficulty: "初級")
        ]
    }
}
