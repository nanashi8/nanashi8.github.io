import SwiftUI

// QuizView.swift
// クイズ画面（4択・適応型学習・アニメーション）
// - 何を: CSV から問題を読み込み、適応型学習アルゴリズムで出題し、選択肢を表示して回答を記録します。
// - なぜ: ユーザーが効率的に単語学習を行えるようにするため。バッチ学習と適応型出題で学習効率を最大化します。

/// クイズ画面の実装
struct QuizView: View {
    // 環境オブジェクト
    @EnvironmentObject var wordScoreStore: WordScoreStore
    @EnvironmentObject var currentCSV: CurrentCSV
    @EnvironmentObject var quizSettings: QuizSettings
    @EnvironmentObject var scoreStore: ScoreStore
    @StateObject private var sessionStore = QuizSessionStore.shared

    // データ状態
    @State private var items: [QuestionItem] = []           // 全問題（フィルタ済み）
    @State private var order: [QuestionItem] = []           // 出題順序
    @State private var pool: [QuestionItem] = []            // 現在バッチのプール
    @State private var currentItem: QuestionItem? = nil     // 現在の問題

    // UI状態
    @State private var choices: [Choice] = []               // 選択肢
    @State private var selectedChoiceID: UUID? = nil
    @State private var correctAnswerID: UUID? = nil
    @State private var dontKnowID: UUID = UUID()

    // アニメーション状態
    @State private var shouldAnimatePassedCount: Bool = false   // 合格数アニメ
    @State private var shouldAnimateTotalCount: Bool = false    // 総出題数アニメ

    // ローディング・エラー状態
    @State private var isLoading: Bool = true
    @State private var errorMessage: String? = nil

    // 学習履歴
    @State private var history: [UUID] = []                 // 出題履歴（戻る機能用）
    @State private var historyIndex: Int = -1               // 履歴内の現在位置

    // CSVのヘッダ表示用マップ: 論理キー(term,reading,meaning,etymology,relatedfields,difficulty) -> 表示ヘッダ
    @State private var csvHeaderLabels: [String: String] = [:]

    @Environment(\.dismiss) private var dismiss

    // QuizSettings の容易な参照: model に含まれる値を使う
    private var learningModeDisplayName: String {
        quizSettings.model.learningMode.displayName
    }

    private var autoAdvanceEnabled: Bool { quizSettings.model.autoAdvance }
    private var configuredNumberOfChoices: Int { quizSettings.numberOfChoices } // QuizSettingsView の公開プロパティを優先
    private var configuredQuestionsPerBatch: Int { quizSettings.questionsPerBatch }

    var body: some View {
        Group {
            if isLoading {
                loadingView
            } else if let error = errorMessage {
                errorView(error)
            } else if items.isEmpty {
                emptyView
            } else {
                quizContent
            }
        }
        .navigationTitle("クイズ")
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(false)
        .onAppear {
            loadCSVAndStart()
        }
    }

    // MARK: - サブビュー

    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
            Text("問題を読み込み中...")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
    }

    private func errorView(_ message: String) -> some View {
        ScrollView {
            VStack(spacing: 20) {
                Image(systemName: "exclamationmark.triangle")
                    .font(.system(size: 60))
                    .foregroundColor(.orange)
                    .padding(.top, 40)

                Text("クイズを開始できません")
                    .font(.title2)
                    .bold()

                Text(message)
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)

                VStack(spacing: 12) {
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

                    Button("ホームに戻る") {
                        dismiss()
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

    private var emptyView: some View {
        VStack(spacing: 16) {
            Image(systemName: "doc.text")
                .font(.largeTitle)
                .foregroundColor(.secondary)
            Text("問題がありません")
                .font(.headline)
            Text("CSVファイルを選択してから出題設定を行ってください。")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            Button("戻る") {
                dismiss()
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
    }

    private var quizContent: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // 統計表示
                QuizStatisticsView(
                    csvName: currentCSV.name ?? "",
                    learningMode: learningModeDisplayName,
                    accuracy: sessionStore.calculateAccuracy(),
                    passedCount: sessionStore.batchCorrect,
                    totalCount: sessionStore.questionCount,
                    batchSize: sessionStore.batchSize,
                    shouldAnimatePassedCount: $shouldAnimatePassedCount,
                    shouldAnimateTotalCount: $shouldAnimateTotalCount
                )
                .padding(.horizontal)

                // ナビゲーションボタン（問題カードの上に表示）
                QuizNavigationButtonsView(
                    canGoPrevious: historyIndex > 0,
                    canGoNext: selectedChoiceID != nil,
                    onPrevious: { goToPreviousQuestion() },
                    onNext: { goToNextQuestion() }
                )
                .padding(.horizontal)

                // 問題カード
                if let item = currentItem {
                    QuestionCardView(
                        item: item,
                        isAnswered: selectedChoiceID != nil,
                        isCorrect: selectedChoiceID != nil ? (selectedChoiceID == correctAnswerID) : nil
                    )
                    .environmentObject(wordScoreStore)
                    .padding(.horizontal)
                }

                // 選択肢
                VStack(spacing: 12) {
                    ForEach(choices) { choice in
                        ChoiceCardView(
                            id: choice.id,
                            text: choice.label,
                            explanation: choice.explanation,
                            item: choice.item,
                            headerLabels: csvHeaderLabels,
                            selectedID: selectedChoiceID,
                            correctID: correctAnswerID,
                            onSelect: { id in
                                handleChoiceSelection(id)
                            }
                        )
                        .padding(.horizontal)
                    }

                    // "分からない" ボタン
                    DontKnowCardView(
                        id: dontKnowID,
                        selectedID: selectedChoiceID,
                        correctAnswerID: correctAnswerID,
                        onSelect: { id in
                            handleChoiceSelection(id)
                        }
                    )
                    .padding(.horizontal)
                }

                // ナビゲーションボタン（下部は省略。上部に移動したためオプションで表示しない）
                Spacer(minLength: 16)
            }
        }
        .background(Color(uiColor: .systemGroupedBackground))
    }

    // MARK: - Choice構造体

    struct Choice: Identifiable {
        let id: UUID
        let label: String
        let explanation: String?
        let isCorrect: Bool
        let item: QuestionItem? // 選択肢に対応する問題項目（詳細情報表示用）
    }

    // MARK: - データロード

    private func loadCSVAndStart() {
        guard let csvName = currentCSV.name else {
            errorMessage = "CSVファイルが選択されていません。"
            isLoading = false
            return
        }

        var allItems: [QuestionItem] = []
        var resolvedCSVURL: URL? = nil

        // QuestionItemRepository を使用してCSVを読み込む
        let base = csvName.replacingOccurrences(of: ".csv", with: "")
        let repository = QuestionItemRepository(fileName: base)
        
        switch repository.fetch() {
        case .success(let items):
            allItems = items
        case .failure(let error):
            print("CSV load error: \(error.localizedDescription)")
            allItems = []
        }

        // resolvedCSVURL の設定（Documents優先、次にBundle）
        if let documentsURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
            let csvURL = documentsURL.appendingPathComponent(csvName.hasSuffix(".csv") ? csvName : "\(csvName).csv")
            if FileManager.default.fileExists(atPath: csvURL.path) {
                resolvedCSVURL = csvURL
            }
        }
        if resolvedCSVURL == nil {
            resolvedCSVURL = Bundle.main.url(forResource: base, withExtension: "csv")
        }

        // ここで resolvedCSVURL が決まっている可能性があるので、ヘッダを読み取ってラベルマップを作成する
        if let url = resolvedCSVURL {
            do {
                let raw = try String(contentsOf: url, encoding: .utf8)
                // ヘッダ候補は先頭の非空行で、コメント(//)を無視
                let lines = raw.components(separatedBy: CharacterSet.newlines)
                var headerLine: String? = nil
                for line in lines {
                    let trimmed = line.trimmingCharacters(in: .whitespacesAndNewlines)
                    if trimmed.isEmpty { continue }
                    if trimmed.hasPrefix("//") { continue }
                    headerLine = trimmed
                    break
                }
                if let headerLine = headerLine {
                    let headerCols = splitCSVLineLocal(headerLine)
                    csvHeaderLabels = buildHeaderLabelMap(headerCols)
                } else {
                    csvHeaderLabels = [:]
                }
            } catch {
                csvHeaderLabels = [:]
            }
        } else {
            csvHeaderLabels = [:]
        }

        if allItems.isEmpty {
            errorMessage = "CSVファイル '\(csvName)' が見つからないか、読み込みに失敗しました。"
            isLoading = false
            return
        }

        // フィルタリング
        let filtered = applyFilters(to: allItems)
        if filtered.isEmpty {
            errorMessage = "フィルタ条件に一致する問題がありません。\n出題設定を確認してください。"
            isLoading = false
            return
        }

        self.items = filtered

        // 問題集に対応する学習結果を読み込む
        wordScoreStore.switchToCSV(csvName)

        // 出題数とバッチサイズの設定
        let totalQuestions = quizSettings.numberOfQuestions > 0 ? min(quizSettings.numberOfQuestions, items.count) : items.count
        let batchSize = min(quizSettings.questionsPerBatch, totalQuestions)

        // セッションの開始または復元
        if sessionStore.canResumeSession(csvName: csvName) {
            // 既存のセッションを継続
            print("セッションを復元: スコア=\(sessionStore.score), 問題数=\(sessionStore.questionCount)")
        } else {
            // 新しいセッションを開始
            sessionStore.startSession(csvName: csvName, batchSize: batchSize, totalQuestions: totalQuestions)
        }

        // 出題順序の決定
        if quizSettings.isRandomOrder {
            order = items.shuffled().prefix(totalQuestions).map { $0 }
        } else {
            order = Array(items.prefix(totalQuestions))
        }

        isLoading = false
        prepareBatch()
    }

    private func applyFilters(to items: [QuestionItem]) -> [QuestionItem] {
        var result = items

        // 分野フィルタ
        if !quizSettings.fields.isEmpty {
            result = result.filter { item in
                !Set(item.relatedFields).isDisjoint(with: quizSettings.fields)
            }
        }

        // 難易度フィルタ
        if !quizSettings.difficulties.isEmpty {
            result = result.filter { item in
                quizSettings.difficulties.contains(item.difficulty)
            }
        }

        return result
    }

    // MARK: - バッチ準備

    private func prepareBatch() {
        guard !order.isEmpty else {
            errorMessage = "出題する問題がありません。"
            return
        }

        // 単純にバッチサイズ分を取得
        let batchItems = Array(order.prefix(sessionStore.batchSize))

        guard !batchItems.isEmpty else {
            errorMessage = "出題する問題がありません。"
            return
        }

        // 設定された繰り返し回数を使用（最低1回は保証）
        var poolItems: [QuestionItem] = []
        let repeatCount = max(1, quizSettings.repeatCount)
        for item in batchItems {
            for _ in 0..<repeatCount {
                poolItems.append(item)
            }
        }

        // ラウンドロビン配置（同じ単語が連続しないように分散）
        pool = roundRobinShuffle(items: batchItems, pool: poolItems)

        prepareQuestion()
    }

    private func roundRobinShuffle(items: [QuestionItem], pool: [QuestionItem]) -> [QuestionItem] {
        var result: [QuestionItem] = []
        var queues = [UUID: [QuestionItem]]()

        for item in pool {
            queues[item.id, default: []].append(item)
        }

        var hasMore = true
        while hasMore {
            hasMore = false
            for item in items {
                if var queue = queues[item.id], !queue.isEmpty {
                    result.append(queue.removeFirst())
                    queues[item.id] = queue
                    hasMore = true
                }
            }
        }

        return result
    }

    // MARK: - 問題準備

    private func prepareQuestion() {
        guard !pool.isEmpty else {
            // バッチ完了
            completeBatch()
            return
        }

        currentItem = pool.removeFirst()
        selectedChoiceID = nil
        correctAnswerID = nil
        dontKnowID = UUID()

        guard let item = currentItem else { return }

        // 選択肢の生成
        // 正解のラベルは item.meaning
        let correctChoice = Choice(id: UUID(), label: item.meaning, explanation: item.etymology, isCorrect: true, item: item)
        correctAnswerID = correctChoice.id

        var incorrectChoices: [Choice] = []
        let otherItems = items.filter { $0.id != item.id }.shuffled()

        for otherItem in otherItems.prefix(max(0, configuredNumberOfChoices - 1)) {
            let choice = Choice(id: UUID(), label: otherItem.meaning, explanation: otherItem.etymology, isCorrect: false, item: otherItem)
            incorrectChoices.append(choice)
        }

        // 必要に応じて選択肢を補う（候補が不足する場合）
        while incorrectChoices.count < max(0, configuredNumberOfChoices - 1) {
            incorrectChoices.append(Choice(id: UUID(), label: "(候補不足)", explanation: nil, isCorrect: false, item: nil))
        }

        choices = ([correctChoice] + incorrectChoices).shuffled()

        // 履歴に追加
        if historyIndex >= 0 && historyIndex < history.count - 1 {
            history = Array(history.prefix(historyIndex + 1))
        }
        history.append(item.id)
        historyIndex = history.count - 1
    }

    // MARK: - 回答処理

    private func handleChoiceSelection(_ id: UUID) {
        guard selectedChoiceID == nil else { return }

        // 分からないボタンの処理
        if id == dontKnowID {
            giveUp()
            return
        }

        // 通常の選択肢
        let oldQuestionCount = sessionStore.questionCount
        let oldBatchCorrect = sessionStore.batchCorrect

        selectedChoiceID = id

        let wasCorrect = (id == correctAnswerID)
        
        // セッションストアに記録
        sessionStore.recordAnswer(correct: wasCorrect)

        // アニメーション判定
        if sessionStore.questionCount > oldQuestionCount {
            shouldAnimateTotalCount = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                self.shouldAnimateTotalCount = false
            }
        }

        if sessionStore.batchCorrect > oldBatchCorrect {
            shouldAnimatePassedCount = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                self.shouldAnimatePassedCount = false
            }
        }

        // スコア記録
        if let item = currentItem {
            // 単語スコアストアへ記録（既存 API を使用）
            wordScoreStore.recordResult(itemID: item.id, correct: wasCorrect)
        }

        // 自動進行
        if wasCorrect && autoAdvanceEnabled {
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                goToNextQuestion()
            }
        }
    }

    private func giveUp() {
        guard selectedChoiceID == nil else { return }

        let oldQuestionCount = sessionStore.questionCount

        selectedChoiceID = dontKnowID
        
        // セッションストアに不正解として記録
        sessionStore.recordAnswer(correct: false)

        // アニメーション判定
        if sessionStore.questionCount > oldQuestionCount {
            shouldAnimateTotalCount = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                self.shouldAnimateTotalCount = false
            }
        }

        // スコア記録（不正解として）
        if let item = currentItem {
            wordScoreStore.recordResult(itemID: item.id, correct: false)
        }
    }

    // MARK: - ナビゲーション

    private func goToNextQuestion() {
        prepareQuestion()
    }

    private func goToPreviousQuestion() {
        guard historyIndex > 0 else { return }

        historyIndex -= 1
        let previousID = history[historyIndex]

        // 前の問題を再表示
        if let previousItem = items.first(where: { $0.id == previousID }) {
            currentItem = previousItem
            selectedChoiceID = nil
            correctAnswerID = nil

            // 選択肢を再生成
            let correctChoice = Choice(id: UUID(), label: previousItem.meaning, explanation: previousItem.etymology, isCorrect: true, item: previousItem)
            correctAnswerID = correctChoice.id

            var incorrectChoices: [Choice] = []
            let otherItems = items.filter { $0.id != previousItem.id }.shuffled()

            for otherItem in otherItems.prefix(max(0, configuredNumberOfChoices - 1)) {
                let choice = Choice(id: UUID(), label: otherItem.meaning, explanation: otherItem.etymology, isCorrect: false, item: otherItem)
                incorrectChoices.append(choice)
            }

            while incorrectChoices.count < max(0, configuredNumberOfChoices - 1) {
                incorrectChoices.append(Choice(id: UUID(), label: "(候補不足)", explanation: nil, isCorrect: false, item: nil))
            }

            choices = ([correctChoice] + incorrectChoices).shuffled()
        }
    }

    // MARK: - バッチ完了

    private func completeBatch() {
        // バッチ完了処理
        // 次のバッチへ進むか、全体を終了するかを判定
        
        sessionStore.completeBatch()

        if order.count > sessionStore.batchSize {
            // 次のバッチがある
            order = Array(order.dropFirst(sessionStore.batchSize))
            prepareBatch()
        } else {
            // 全問題完了
            saveResults()
            sessionStore.endSession()
            dismiss()
        }
    }

    private func saveResults() {
        guard currentCSV.name != nil else { return }

        // ScoreStore が期待するイニシャライザを使う
        let result = QuizResult(total: sessionStore.questionCount, correct: sessionStore.score, settings: quizSettings.model)
        scoreStore.addResult(result)
    }

    // MARK: - ヘルパー

    private func determineLearningMode() -> String {
        // model に含まれる学習モードを返す
        quizSettings.model.learningMode.displayName
    }

    // CSV行の分割ヘルパー
    private func splitCSVLineLocal(_ line: String) -> [String] {
        var items: [String] = []
        var current = ""
        var insideQuotes = false
        let chars = Array(line)
        var i = 0
        while i < chars.count {
            let ch = chars[i]
            if ch == Character("\"") {
                insideQuotes.toggle()
                current.append(ch)
            } else if ch == Character(",") && !insideQuotes {
                items.append(current)
                current = ""
            } else {
                current.append(ch)
            }
            i += 1
        }
        items.append(current)
        return items.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
    }

    // ローカルヘルパー: ヘッダの配列から論理キー->表示ラベルマップを作る
    private func buildHeaderLabelMap(_ headerCols: [String]) -> [String: String] {
        var map: [String: String] = [:]
        func normalize(_ s: String) -> String {
            var t = s.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            let remove = CharacterSet(charactersIn: "()（）\"' 　,、・")
            t = t.components(separatedBy: remove).joined()
            t = t.replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
            return t
        }
        for (_, raw) in headerCols.enumerated() {
            let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            let key = normalize(trimmed)
            
            // related words (先に処理して「関連史実」「関連語（英語）と意味（日本語）」を確実にキャッチ)
            if key.contains("関連語") || key.contains("関連史実") ||
               key == "relatedwords" || key.contains("relatedword") {
                if map["relatedwords"] == nil { map["relatedwords"] = trimmed }
            }
            // related fields (関連分野を先に処理)
            else if key.contains("関連分野") || key.contains("分野") || key.contains("カテゴリ") ||
                    key == "relatedfields" || key.contains("relatedfield") {
                if map["relatedfields"] == nil { map["relatedfields"] = trimmed }
            }
            // term (問題として出題される項目)
            // 中学歴史では「年号」、英単語では「語句」
            else if key.contains("語句") || key.contains("単語") || key.contains("年号") ||
               key == "term" || key == "word" || key == "japanese" || key == "lemma" {
                if map["term"] == nil { map["term"] = trimmed }
            }
            // reading (読み・発音・登場人物)
            else if key.contains("読み") || key.contains("よみ") || key.contains("発音") || key.contains("登場人物") || key.contains("人物") ||
                    key == "reading" || key == "yomi" {
                if map["reading"] == nil { map["reading"] = trimmed }
            }
            // meaning (選択肢として出題される項目)
            // 中学歴史では「史実名」、英単語では「意味・和訳」
            // 「史実名」を「史実」より優先
            else if key.contains("史実名") || key.contains("意味") || key.contains("和訳") || key.contains("史実") ||
                    key == "meaning" || key == "translation" {
                if map["meaning"] == nil { map["meaning"] = trimmed }
            }
            // etymology (詳細情報・解説)
            else if key.contains("語源") || key.contains("解説") || key.contains("経緯") ||
                    key.contains("覚え方") ||
                    key == "etymology" || key == "note" || key == "explain" {
                if map["etymology"] == nil { map["etymology"] = trimmed }
            }
            // difficulty
            else if key.contains("難易度") || key == "difficulty" || key == "level" {
                if map["difficulty"] == nil { map["difficulty"] = trimmed }
            }
        }
        return map
    }
}

// MARK: - Preview
#Preview {
    NavigationStack {
        QuizView()
            .environmentObject(WordScoreStore())
            .environmentObject(CurrentCSV.shared)
            .environmentObject(QuizSettings())
            .environmentObject(ScoreStore())
     }
 }
