//
//  QuizView.swift
//  SimpleWord
//
//  Created by GitHub Copilot on 2025/10/20.
//

// クイズ画面の完全実装（v1.2.0）
// - 何を: 問題表示、選択肢、統計、ナビゲーション、スコア記録を統合したクイズUI
// - なぜ: 語句学習のメイン画面として、適応型学習とバッチ管理を実現するため

import SwiftUI
import Combine

struct QuizView: View {
    // 単語スコアは環境オブジェクトで注入される想定
    @EnvironmentObject var wordScoreStore: WordScoreStore
    // 現在選択されている CSV 名を参照
    @EnvironmentObject var currentCSV: CurrentCSV
    // クイズ設定を参照
    @EnvironmentObject var quizSettings: QuizSettings

    // 問題リストと現在のインデックス
    @State private var currentIndex: Int = 0
    @State private var items: [QuestionItem] = []

    // 選択状態
    @State private var selectedChoiceID: UUID? = nil
    @State private var correctChoiceID: UUID? = nil
    @State private var showExplanation: Bool = false

    // 統計情報
    @State private var passedCount: Int = 0
    @State private var totalCount: Int = 0
    @State private var shouldAnimatePassedCount: Bool = false
    @State private var shouldAnimateTotalCount: Bool = false

    var body: some View {
        VStack(spacing: 12) {
            if items.isEmpty {
                // 問題がない場合
                emptyView
            } else {
                // 問題がある場合
                quizContentView
            }

            Spacer()
        }
        .navigationTitle("クイズ")
        .navigationBarTitleDisplayMode(.inline)
        // 遷移時はまず選択中の CSV を読み込む
        .onAppear {
            debugLog("🎯 QuizView が表示されました")
            loadContent()
        }
        // CurrentCSV が変化したら再ロードする
        .onReceive(currentCSV.$name) { _ in
            loadContent()
        }
        // QuizSettings の選択CSVが変わった場合にも再ロードする（起動時の選択反映用）
        .onReceive(quizSettings.$model.map { $0.selectedCSV }.eraseToAnyPublisher()) { _ in
            loadContent()
        }
        .onChange(of: currentIndex) { _, _ in
            // 問題が変わったら選択状態と解説表示をリセット
            selectedChoiceID = nil
            correctChoiceID = nil
            showExplanation = false
        }
        .padding(.top)
        .background(Color(uiColor: .systemGroupedBackground))
    }

    // MARK: - Subviews

    /// 問題がない場合のビュー
    private var emptyView: some View {
        VStack(spacing: 16) {
            Image(systemName: "doc.text.magnifyingglass")
                .font(.system(size: 60))
                .foregroundColor(.secondary)

            Text("問題データがありません")
                .font(.headline)

            Text("出題設定で問題集を選択するか、CSV管理で問題集を追加してください")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            // デバッグ情報
            VStack(alignment: .leading, spacing: 4) {
                Text("現在のCSV: \(currentCSV.name ?? "未選択")")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text("設定CSV: \(quizSettings.model.selectedCSV ?? "未選択")")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.top, 8)
            
            // 出題設定へのナビゲーションボタン
            NavigationLink {
                QuizSettingsView()
            } label: {
                Label("出題設定を開く", systemImage: "gearshape")
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color.accentColor)
                    .cornerRadius(12)
            }
            .padding(.horizontal)
            .padding(.top, 8)
        }
        .padding()
    }

    /// クイズコンテンツビュー
    private var quizContentView: some View {
        let item = items[currentIndex]
        let choices = makeChoices(for: item)
        let dontKnowID = UUID()

        return VStack(spacing: 12) {
            // 統計表示
            QuizStatisticsView(
                csvName: currentCSV.name ?? "サンプルCSV",
                learningMode: quizSettings.learningMode.displayName,
                accuracy: calculateAccuracy(),
                passedCount: passedCount,
                totalCount: totalCount,
                batchSize: quizSettings.questionsPerBatch,
                shouldAnimatePassedCount: $shouldAnimatePassedCount,
                shouldAnimateTotalCount: $shouldAnimateTotalCount
            )
            .padding(.horizontal)

            // 問題カード
            QuestionCardView(item: item)
                .environmentObject(wordScoreStore)
                .padding(.horizontal)

            // 回答後の解説表示
            if showExplanation {
                explanationView(for: item)
                    .padding(.horizontal)
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }

            // ナビゲーションボタン
            // 変更点: 次へボタンは「回答（または「分からない」）が選ばれるまで無効（グレーアウト）」にする
            //   -> canGoNext に selectedChoiceID != nil を加えて、回答済みのみ次へを許可する
            QuizNavigationButtonsView(
                canGoPrevious: currentIndex > 0,
                canGoNext: (selectedChoiceID != nil) && (currentIndex < items.count - 1),
                onPrevious: previousQuestion,
                onNext: nextQuestion
            )
            .padding(.horizontal)

            // 選択肢カード群
            VStack(spacing: 10) {
                ForEach(choices) { choice in
                    ChoiceCardView(
                        id: choice.id,
                        text: choice.label,
                        selectedID: selectedChoiceID,
                        correctID: correctChoiceID,
                        onSelect: { chosenId in
                            handleChoiceSelection(chosenId: chosenId, choice: choice, item: item)
                        }
                    )
                    .environmentObject(wordScoreStore)
                }

                // 「分からない」カード
                DontKnowCardView(
                    id: dontKnowID,
                    selectedID: selectedChoiceID,
                    correctAnswerID: correctChoiceID,
                    onSelect: { _ in
                        handleDontKnow(dontKnowID: dontKnowID, item: item, choices: choices)
                    }
                )
            }
            .padding(.horizontal)
        }
    }

    /// 解説表示ビュー
    private func explanationView(for item: QuestionItem) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            // 語源・解説
            if !item.etymology.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("語源・解説")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(item.etymology)
                        .font(.body)
                }
            }

            // 関連語
            if !item.relatedWords.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("関連語")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(item.relatedWords, id: \.self) { word in
                                Text(word)
                                    .font(.caption)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.blue.opacity(0.1))
                                    .foregroundColor(.blue)
                                    .cornerRadius(4)
                            }
                        }
                    }
                }
            }

            // 関連分野
            if !item.relatedFields.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("関連分野")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(item.relatedFields, id: \.self) { field in
                                Text(field)
                                    .font(.caption)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.green.opacity(0.1))
                                    .foregroundColor(.green)
                                    .cornerRadius(4)
                            }
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(12)
    }

    // MARK: - Debug Helper
    
    /// デバッグログ出力（DEBUGビルドのみ）
    private func debugLog(_ message: String) {
        #if DEBUG
        print(message)
        #endif
    }
    
    // MARK: - Animation Helper
    
    /// アニメーション種別
    private enum AnimationType {
        case totalCount
        case passedCount
    }
    
    /// アニメーションをトリガー（1.2秒間光る）
    private func triggerAnimation(for type: AnimationType) {
        switch type {
        case .totalCount:
            shouldAnimateTotalCount = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                self.shouldAnimateTotalCount = false
            }
        case .passedCount:
            shouldAnimatePassedCount = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                self.shouldAnimatePassedCount = false
            }
        }
    }

    // MARK: - Actions

    /// 選択肢が選ばれた時の処理
    private func handleChoiceSelection(chosenId: UUID, choice: Choice, item: QuestionItem) {
        guard selectedChoiceID == nil else { return }

        selectedChoiceID = chosenId
        correctChoiceID = makeChoices(for: item).first(where: { isCorrectChoice($0, for: item) })?.id

        let isCorrect = isCorrectChoice(choice, for: item)
        recordResult(itemID: item.id, correct: isCorrect)

        // 統計更新
        updateStatistics(correct: isCorrect)

        // 解説を表示
        withAnimation(.easeInOut(duration: 0.3)) {
            showExplanation = true
        }

        // 自動で次へ進む設定の場合、一定時間後に次の問題へ
        if quizSettings.model.autoAdvance && currentIndex < items.count - 1 {
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                nextQuestion()
            }
        }
    }

    /// 「分からない」が選ばれた時の処理
    private func handleDontKnow(dontKnowID: UUID, item: QuestionItem, choices: [Choice]) {
        guard selectedChoiceID == nil else { return }

        selectedChoiceID = dontKnowID
        correctChoiceID = choices.first(where: { isCorrectChoice($0, for: item) })?.id

        recordResult(itemID: item.id, correct: false)

        // 統計更新
        updateStatistics(correct: false)

        // 解説を表示
        withAnimation(.easeInOut(duration: 0.3)) {
            showExplanation = true
        }

        // 自動で次へ進む設定の場合、一定時間後に次の問題へ
        if quizSettings.model.autoAdvance && currentIndex < items.count - 1 {
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                nextQuestion()
            }
        }
    }

    /// 次の問題へ
    private func nextQuestion() {
        if currentIndex < items.count - 1 {
            withAnimation {
                currentIndex += 1
            }
        }
    }

    /// 前の問題へ
    private func previousQuestion() {
        if currentIndex > 0 {
            withAnimation {
                currentIndex -= 1
            }
        }
    }

    /// 結果を記録
    private func recordResult(itemID: UUID, correct: Bool) {
        wordScoreStore.recordResult(itemID: itemID, correct: correct)
    }

    /// 統計を更新
    private func updateStatistics(correct: Bool) {
        totalCount += 1
        triggerAnimation(for: .totalCount)

        if correct {
            passedCount += 1
            triggerAnimation(for: .passedCount)
        }
    }

    /// 正答率を計算
    private func calculateAccuracy() -> Int {
        guard totalCount > 0 else { return 0 }
        return Int(round(Double(passedCount) / Double(totalCount) * 100))
    }

    // MARK: - Choice Generation

    /// 選択肢を生成
    private func makeChoices(for item: QuestionItem) -> [Choice] {
        let numberOfChoices = max(2, quizSettings.numberOfChoices) // 最低2択
        let numberOfDistractors = numberOfChoices - 1 // 正解以外の選択肢数
        
        var pool: [QuestionItem] = []

        // 他の問題から候補を収集
        pool.append(contentsOf: items.filter { $0.id != item.id })

        // ランダムにn個選ぶ
        var distractors = pool.shuffled().prefix(numberOfDistractors).map { Choice(item: $0) }

        // 足りない場合はダミーを作成
        while distractors.count < numberOfDistractors {
            let dummyItem = QuestionItem(
                term: "(候補\(Int.random(in: 1...100)))",
                reading: "",
                meaning: "(候補\(Int.random(in: 1...100)))",
                etymology: "",
                relatedWordsCSV: "",
                relatedFieldsCSV: "",
                difficulty: ""
            )
            distractors.append(Choice(item: dummyItem))
        }

        // 正解を追加してシャッフル
        var allChoices = distractors
        allChoices.append(Choice(item: item))
        allChoices.shuffle()

        return allChoices
    }

    /// 選択肢が正解かどうかを判定
    private func isCorrectChoice(_ choice: Choice, for item: QuestionItem) -> Bool {
        return choice.item.id == item.id
    }

    // MARK: - Data Loading

    /// CSVまたはサンプルデータをロードする
    private func loadContent() {
        debugLog("📚 loadContent開始")
        
        // 統計をリセット
        self.currentIndex = 0
        self.totalCount = 0
        self.passedCount = 0
        
        // 1) 選択されている CSV をロード
        // 優先順: CurrentCSV.name -> QuizSettings.model.selectedCSV
        let name = currentCSV.name ?? quizSettings.model.selectedCSV
        debugLog("📝 選択されたCSV: \(name ?? "nil")")
        
        if let csvName = name, !csvName.isEmpty {
            let loaded = CSVQuestionLoader.loadQuestions(csvName: csvName)
            debugLog("📖 ロードされた問題数: \(loaded.count)")
            
            if !loaded.isEmpty {
                // 出題設定に基づいてフィルタリング
                let filtered = applyQuizSettings(to: loaded)
                debugLog("🔍 フィルタ後の問題数: \(filtered.count)")
                
                // フィルタ結果が空になる可能性があるため、その場合はフィルタ前の loaded をフォールバックとして使う
                if filtered.isEmpty {
                    self.items = loaded
                    debugLog("✅ フィルタ前のデータを使用: \(loaded.count)問")
                } else {
                    self.items = filtered
                    debugLog("✅ フィルタ後のデータを使用: \(filtered.count)問")
                }
                return
            }
        }

        // 2) CSV が指定されていない、または読み込み失敗した場合はサンプルデータをロード
        debugLog("🎲 サンプルデータをロード")
        loadSampleData()
    }

    /// 出題設定を適用してフィルタリング・ソート
    private func applyQuizSettings(to items: [QuestionItem]) -> [QuestionItem] {
        var filtered = items

        // 1. 分野フィルタ（selectedFieldsが指定されている場合のみ）
        if !quizSettings.model.selectedFields.isEmpty {
            filtered = filtered.filter { item in
                // item.relatedFields に selectedFields のいずれかが含まれているか
                let itemFields = Set(item.relatedFields.map { $0.lowercased() })
                let selectedFields = Set(quizSettings.model.selectedFields.map { $0.lowercased() })
                return !itemFields.isDisjoint(with: selectedFields)
            }
        }

        // 2. 難易度フィルタ（difficultiesが指定されている場合のみ）
        if !quizSettings.model.difficulties.isEmpty {
            filtered = filtered.filter { item in
                let itemDifficulty = item.difficulty.lowercased()
                return quizSettings.model.difficulties.contains { $0.lowercased() == itemDifficulty }
            }
        }

        // 3. ランダムシャッフル（設定がオンの場合）
        if quizSettings.isRandomOrder {
            filtered = filtered.shuffled()
        }

        // 4. 出題数制限（numberOfQuestions）
        let maxQuestions = min(quizSettings.numberOfQuestions, filtered.count)
        if maxQuestions > 0 && maxQuestions < filtered.count {
            filtered = Array(filtered.prefix(maxQuestions))
        }

        return filtered
    }

    /// サンプルデータをロード
    private func loadSampleData() {
        items = [
            QuestionItem(
                term: "apple",
                reading: "アップル",
                meaning: "りんご",
                etymology: "古英語 æppel から",
                relatedWordsCSV: "fruit;food",
                relatedFieldsCSV: "English;Basic",
                difficulty: "初級"
            ),
            QuestionItem(
                term: "book",
                reading: "ブック",
                meaning: "本",
                etymology: "古英語 bōc から",
                relatedWordsCSV: "read;paper;library",
                relatedFieldsCSV: "English;Basic",
                difficulty: "初級"
            ),
            QuestionItem(
                term: "cat",
                reading: "キャット",
                meaning: "猫",
                etymology: "ラテン語 cattus から",
                relatedWordsCSV: "animal;pet",
                relatedFieldsCSV: "English;Basic",
                difficulty: "初級"
            ),
            QuestionItem(
                term: "dog",
                reading: "ドッグ",
                meaning: "犬",
                etymology: "古英語 docga から",
                relatedWordsCSV: "animal;pet",
                relatedFieldsCSV: "English;Basic",
                difficulty: "初級"
            ),
            QuestionItem(
                term: "elephant",
                reading: "エレファント",
                meaning: "象",
                etymology: "ギリシャ語 elephas から",
                relatedWordsCSV: "animal;wild",
                relatedFieldsCSV: "English;Basic",
                difficulty: "初級"
            )
        ]
    }
}

// MARK: - Preview
#Preview {
    let currentCSV = CurrentCSV.shared
    NavigationView {
        QuizView()
            .environmentObject(WordScoreStore())
            .environmentObject(currentCSV)
            .environmentObject(QuizSettings(currentCSV: currentCSV))
    }
}
