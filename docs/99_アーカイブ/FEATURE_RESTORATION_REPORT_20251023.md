import SwiftUI
import AVFoundation

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
    
    // データ状態
    @State private var items: [QuestionItem] = []           // 全問題（フィルタ済み）
    @State private var order: [QuestionItem] = []           // 出題順序
    @State private var pool: [QuestionItem] = []            // 現在バッチのプール
    @State private var currentItem: QuestionItem? = nil     // 現在の問題
    @State private var currentBatchItems: [QuestionItem] = []  // 現在のバッチに含まれる単語
    @State private var previousBatchResults: [UUID: Bool] = [:] // 前バッチの結果（単語ID: 正解したか）
    
    // UI状態
    @State private var choices: [Choice] = []               // 選択肢
    @State private var selectedChoiceID: UUID? = nil
    @State private var correctAnswerID: UUID? = nil
    @State private var dontKnowID: UUID = UUID()
    
    // スコア・バッチ管理
    @State private var score: Int = 0                       // 累積正解数
    @State private var questionCount: Int = 0               // 累積出題数
    @State private var batchCorrect: Int = 0                // 現在バッチの正解数
    @State private var batchSize: Int = 10                  // バッチサイズ
    @State private var batchAttempts: Int = 0               // バッチ再試行回数
    @State private var remediationMode: Bool = false        // 補修モード
    
    // タイマー関連
    @State private var timer: Timer? = nil
    @State private var timeRemaining: Int = 0
    @State private var questionStartTime: Date? = nil
    
    // 音声読み上げ
    private let speechSynthesizer = AVSpeechSynthesizer()
    
    // アニメーション状態
    @State private var shouldAnimatePassedCount: Bool = false   // 合格数アニメ
    @State private var shouldAnimateTotalCount: Bool = false    // 総出題数アニメ
    
    // ローディング・エラー状態
    @State private var isLoading: Bool = true
    @State private var errorMessage: String? = nil
    
    // 学習履歴
    @State private var history: [UUID] = []                 // 出題履歴（戻る機能用）
    @State private var historyIndex: Int = -1               // 履歴内の現在位置
    
    // AdaptiveScheduler
    private let scheduler = AdaptiveScheduler()
    
    @Environment(\.dismiss) private var dismiss
    
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
        .onDisappear {
            stopTimer()
            speechSynthesizer.stopSpeaking(at: .immediate)
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
                    learningMode: determineLearningMode(),
                    accuracy: calculateAccuracy(),
                    passedCount: batchCorrect,
                    totalCount: questionCount,
                    batchSize: batchSize,
                    isTimerEnabled: quizSettings.isTimerEnabled,
                    timeRemaining: timeRemaining,
                    shouldAnimatePassedCount: $shouldAnimatePassedCount,
                    shouldAnimateTotalCount: $shouldAnimateTotalCount
                )
                .padding(.horizontal)
                
                // 問題カード
                if let item = currentItem {
                    QuestionCardView(item: item)
                        .environmentObject(wordScoreStore)
                        .padding(.horizontal)
                }
                
                // 選択肢
                VStack(spacing: 12) {
                    ForEach(choices) { choice in
                        ChoiceCardView(
                            id: choice.id,
                            text: choice.label,
                            selectedID: selectedChoiceID,
                            correctID: correctAnswerID,
                            onSelect: { id in
                                handleChoiceSelection(id)
                            }
                        )
                        .padding(.horizontal)
                    }
                    
                    // 「分からない」ボタン
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
                
                // ナビゲーションボタン
                QuizNavigationButtonsView(
                    canGoPrevious: historyIndex > 0,
                    canGoNext: selectedChoiceID != nil,
                    onPrevious: {
                        goToPreviousQuestion()
                    },
                    onNext: {
                        goToNextQuestion()
                    }
                )
                .padding(.horizontal)
                .padding(.top, 8)
            }
            .padding(.vertical)
        }
        .background(Color(uiColor: .systemGroupedBackground))
    }
    
    // MARK: - ロジック
    
    /// CSV読み込みと初期化
    private func loadCSVAndStart() {
        isLoading = true
        errorMessage = nil
        
        // CSV名の確認
        guard let csvName = currentCSV.name, !csvName.isEmpty else {
            errorMessage = "CSVが選択されていません。\n「出題設定」からCSVを選択してください。"
            isLoading = false
            return
        }
        
        // CSV名から拡張子を除去
        let nameWithoutExtension = csvName.replacingOccurrences(of: ".csv", with: "")
        
        print("📚 CSV読み込み開始: \(csvName) -> \(nameWithoutExtension)")
        
        // CSV読み込み
        let loader = CSVLoader()
        do {
            let loadedItems = try loader.loadFromBundle(named: nameWithoutExtension)
            
            print("📚 CSV読み込み成功: \(loadedItems.count)問")
            
            // フィルタリング（分野・難易度）
            var filtered = loadedItems
            if !quizSettings.fields.isEmpty {
                print("📚 分野フィルタ: \(quizSettings.fields)")
                filtered = filtered.filter { item in
                    !Set(item.relatedFields).isDisjoint(with: Set(quizSettings.fields))
                }
                print("📚 分野フィルタ後: \(filtered.count)問")
            }
            if !quizSettings.difficulties.isEmpty {
                print("📚 難易度フィルタ: \(quizSettings.difficulties)")
                filtered = filtered.filter { item in
                    quizSettings.difficulties.contains(item.difficulty)
                }
                print("📚 難易度フィルタ後: \(filtered.count)問")
            }
            
            // 問題数制限
            let maxQuestions = min(quizSettings.numberOfQuestions, filtered.count)
            filtered = Array(filtered.prefix(maxQuestions))
            
            items = filtered
            
            if items.isEmpty {
                errorMessage = "条件に合う問題がありません。\n\n設定内容:\n・CSV: \(csvName)\n・分野: \(quizSettings.fields.isEmpty ? "すべて" : quizSettings.fields.joined(separator: ", "))\n・難易度: \(quizSettings.difficulties.isEmpty ? "すべて" : quizSettings.difficulties.joined(separator: ", "))"
            } else {
                print("📚 最終問題数: \(items.count)問")
                
                // バッチサイズを設定
                batchSize = min(10, items.count)
                
                // 初回バッチを準備
                prepareBatch()
            }
        } catch CSVLoaderError.notFound {
            errorMessage = "CSVファイルが見つかりません。\n\nファイル名: \(csvName)\nResources フォルダに配置されているか確認してください。"
            print("❌ CSV読み込みエラー: ファイルが見つかりません - \(nameWithoutExtension)")
        } catch CSVLoaderError.invalidFormat {
            errorMessage = "CSVファイルの形式が正しくありません。\n\nファイル名: \(csvName)"
            print("❌ CSV読み込みエラー: 形式が正しくありません")
        } catch {
            errorMessage = "CSVの読み込みに失敗しました。\n\nファイル名: \(csvName)\nエラー: \(error.localizedDescription)"
            print("❌ CSV読み込みエラー: \(error)")
        }
        
        isLoading = false
    }
    
    /// バッチ準備（適応型学習）
    private func prepareBatch() {
        guard !items.isEmpty else { return }
        
        // AdaptiveSchedulerで優先度順に選択
        let itemIDs = items.map { $0.id }
        let scheduledIDs = scheduler.scheduleNextBatch(itemIDs: itemIDs, count: batchSize)
        
        // スケジュールされたIDに対応する問題を取得
        var batchItems: [QuestionItem] = []
        for id in scheduledIDs {
            if let item = items.first(where: { $0.id == id }) {
                batchItems.append(item)
            }
        }
        
        // 【補修モード判定】
        // バッチ内で正答率 < lowAccuracyThreshold の単語が maxLowAccuracyRatio 以上なら補修モードに入る
        let lowAccThreshold = quizSettings.model.lowAccuracyThreshold  // デフォルト 0.5
        let lowCount = batchItems.filter { item in
            let ws = wordScoreStore.score(for: item.id)
            return ws.attempts > 0 && (Double(ws.correct) / Double(ws.attempts)) < lowAccThreshold
        }.count
        let lowRatio = batchItems.isEmpty ? 0.0 : Double(lowCount) / Double(batchItems.count)
        remediationMode = (lowRatio >= quizSettings.model.maxLowAccuracyRatio)  // デフォルト 0.5
        
        if remediationMode {
            print("📚 補修モード発動: 低正答率単語 \(lowCount)/\(batchItems.count)")
            // 補修モード時は低正答率の単語のみをピックアップ
            batchItems = batchItems.filter { item in
                let ws = wordScoreStore.score(for: item.id)
                return ws.attempts == 0 || (Double(ws.correct) / Double(ws.attempts)) < lowAccThreshold
            }
        }
        
        // 【ローテーション】（前バッチ終了後の入れ替え）
        // 前バッチで正答率 >= 85% かつ出題回数 >= 3 回の単語を低出題回数単語と入れ替え
        if !previousBatchResults.isEmpty {
            let highAccuracyIDs = previousBatchResults.filter { id, wasCorrect in
                let ws = wordScoreStore.score(for: id)
                let accuracy = ws.attempts > 0 ? Double(ws.correct) / Double(ws.attempts) : 0.0
                return accuracy >= 0.85 && ws.attempts >= 3
            }.map { $0.key }
            
            let rotationCount = max(1, batchSize / 5)  // バッチサイズの20%
            if highAccuracyIDs.count >= rotationCount {
                print("📚 ローテーション: \(rotationCount)単語を入れ替え")
                // 習熟した単語を除去
                batchItems = batchItems.filter { !highAccuracyIDs.prefix(rotationCount).contains($0.id) }
                
                // 低出題回数の単語を追加
                let lowAttemptItems = items
                    .filter { item in !batchItems.contains(where: { $0.id == item.id }) }
                    .sorted { wordScoreStore.score(for: $0.id).attempts < wordScoreStore.score(for: $1.id).attempts }
                    .prefix(rotationCount)
                
                batchItems.append(contentsOf: lowAttemptItems)
            }
        }
        
        // 現在のバッチを保存
        currentBatchItems = batchItems
        
        // 【繰り返し回数の個別計算】
        var perItemRepeat: [UUID: Int] = [:]
        let repeatCount = quizSettings.repeatCount
        
        for item in batchItems {
            let ws = wordScoreStore.score(for: item.id)
            let accuracy = ws.attempts > 0 ? Double(ws.correct) / Double(ws.attempts) : 0.0
            
            // 高記憶判定（AdaptiveSchedulerのレコードは使用せず、WordScoreStoreを使用）
            let isHighMemory = (accuracy >= 0.85 && ws.attempts >= 3)
            
            if remediationMode {
                // 補修モード時
                perItemRepeat[item.id] = isHighMemory ? 1 : max(2, repeatCount * 4)
            } else {
                // 通常時
                if accuracy < lowAccThreshold {
                    perItemRepeat[item.id] = max(2, repeatCount * 3)
                } else {
                    perItemRepeat[item.id] = isHighMemory ? 1 : repeatCount
                }
            }
        }
        
        // 繰り返し回数分の問題をプールに追加
        var poolWithRepetitions: [QuestionItem] = []
        for item in batchItems {
            let repetitions = perItemRepeat[item.id] ?? repeatCount
            for _ in 0..<repetitions {
                poolWithRepetitions.append(item)
            }
        }
        
        // プールを作成（ラウンドロビン配置）
        // 同じ問題が連続しないように分散配置
        pool = distributeRoundRobin(items: poolWithRepetitions, originalCount: batchItems.count)
        
        // 順序をランダム化（設定による）
        if quizSettings.isRandomOrder {
            pool.shuffle()
        }
        
        // 現在バッチのスコアをリセット
        batchCorrect = 0
        batchAttempts += 1
        
        // 最初の問題を準備
        prepareQuestion()
    }
    
    /// ラウンドロビン配置
    /// 同じ問題が連続しないように、問題を均等に分散配置する
    private func distributeRoundRobin(items: [QuestionItem], originalCount: Int) -> [QuestionItem] {
        guard originalCount > 0 else { return items }
        
        // 各問題の出現回数をカウント
        var itemCounts: [UUID: Int] = [:]
        for item in items {
            itemCounts[item.id, default: 0] += 1
        }
        
        // 出現回数が多い順にソート
        let sortedItems = items.uniqued().sorted { item1, item2 in
            (itemCounts[item1.id] ?? 0) > (itemCounts[item2.id] ?? 0)
        }
        
        // ラウンドロビンで配置
        var result: [QuestionItem] = []
        var counters: [UUID: Int] = [:]
        
        for item in sortedItems {
            counters[item.id] = 0
        }
        
        let maxRepetitions = itemCounts.values.max() ?? 1
        for _ in 0..<maxRepetitions {
            for item in sortedItems {
                if counters[item.id, default: 0] < (itemCounts[item.id] ?? 0) {
                    result.append(item)
                    counters[item.id, default: 0] += 1
                }
            }
        }
        
        return result
    }
    
    /// 次の問題を準備
    private func prepareQuestion() {
        guard !pool.isEmpty else {
            // プールが空ならバッチ評価
            evaluateBatch()
            return
        }
        
        // プールから取り出し
        currentItem = pool.removeFirst()
        
        guard let item = currentItem else { return }
        
        // 履歴に追加
        if historyIndex < history.count - 1 {
            // 履歴の途中から新しい問題に進む場合、それ以降の履歴を削除
            history.removeSubrange((historyIndex + 1)...)
        }
        history.append(item.id)
        historyIndex = history.count - 1
        
        // 正解IDを設定
        correctAnswerID = item.id
        
        // 選択肢を生成
        prepareChoices()
        
        // 問題開始時刻を記録
        questionStartTime = Date()
        
        // タイマー開始
        startTimer()
        
        // 音声読み上げ
        speakQuestion()
    }
    
    /// タイマーを開始
    private func startTimer() {
        stopTimer()
        
        guard quizSettings.isTimerEnabled else { return }
        
        timeRemaining = quizSettings.timeLimit
        
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            if timeRemaining > 0 {
                timeRemaining -= 1
            } else {
                // 時間切れ
                handleTimeout()
            }
        }
    }
    
    /// タイマーを停止
    private func stopTimer() {
        timer?.invalidate()
        timer = nil
    }
    
    /// タイムアウト処理
    private func handleTimeout() {
        stopTimer()
        // 「分からない」として処理
        handleChoiceSelection(dontKnowID)
    }
    
    /// 問題を音声読み上げ
    private func speakQuestion() {
        guard quizSettings.isSpeechEnabled else { return }
        guard let item = currentItem else { return }
        
        speechSynthesizer.stopSpeaking(at: .immediate)
        
        // 読み上げテキストを構築
        var textToSpeak = item.term
        if !item.reading.isEmpty {
            textToSpeak += "、読みは、" + item.reading
        }
        
        let utterance = AVSpeechUtterance(string: textToSpeak)
        utterance.voice = AVSpeechSynthesisVoice(language: "ja-JP")
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate
        
        speechSynthesizer.speak(utterance)
    }
    
    /// 選択肢を準備
    private func prepareChoices() {
        guard let item = currentItem else { return }
        
        // 選択肢を生成
        var choiceItems: [QuestionItem] = [item]
        
        // 他の問題から選択肢を追加
        let otherItems = items.filter { $0.id != item.id }
        let numberOfWrongChoices = quizSettings.numberOfChoices - 1
        let wrongChoices = Array(otherItems.shuffled().prefix(numberOfWrongChoices))
        choiceItems.append(contentsOf: wrongChoices)
        
        // シャッフル
        choiceItems.shuffle()
        
        choices = choiceItems.map { Choice(item: $0) }
        
        // 回答状態をリセット
        selectedChoiceID = nil
        dontKnowID = UUID()
    }
    
    private func handleChoiceSelection(_ id: UUID) {
        guard selectedChoiceID == nil else { return }
        guard let item = currentItem else { return }
        
        // タイマーを停止
        stopTimer()
        
        // 応答時間を計算
        let responseTime: TimeInterval
        if let startTime = questionStartTime {
            responseTime = Date().timeIntervalSince(startTime)
        } else {
            responseTime = 1.0
        }
        
        // 値変更前の状態を保存
        let oldQuestionCount = questionCount
        let oldBatchCorrect = batchCorrect
        
        selectedChoiceID = id
        
        // 正解判定
        let isCorrect = (id == correctAnswerID)
        let isDontKnow = (id == dontKnowID)
        
        // スコアを更新
        questionCount += 1
        if isCorrect {
            score += 1
            batchCorrect += 1
        }
        
        // 現在のバッチ結果を記録
        previousBatchResults[item.id] = isCorrect
        
        // アニメーション判定
        if questionCount > oldQuestionCount {
            shouldAnimateTotalCount = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                self.shouldAnimateTotalCount = false
            }
        }
        if batchCorrect > oldBatchCorrect {
            shouldAnimatePassedCount = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                self.shouldAnimatePassedCount = false
            }
        }
        
        // WordScoreStoreに記録
        wordScoreStore.recordResult(itemID: item.id, correct: isCorrect)
        
        // AdaptiveSchedulerに記録（実際の応答時間を使用）
        let result: ReviewOutcome = isDontKnow ? .gaveUp : (isCorrect ? .correct : .wrong)
        scheduler.record(itemID: item.id, result: result, responseTime: responseTime)
        
        // 自動進行（設定がONで正解の場合）
        if quizSettings.model.autoAdvance && isCorrect {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
                if self.selectedChoiceID != nil {
                    self.goToNextQuestion()
                }
            }
        }
    }
    
    private func goToPreviousQuestion() {
        guard historyIndex > 0 else { return }
        
        historyIndex -= 1
        let previousID = history[historyIndex]
        
        // 履歴から問題を復元
        if let item = items.first(where: { $0.id == previousID }) {
            currentItem = item
            correctAnswerID = item.id
            prepareChoices()
        }
    }
    
    private func goToNextQuestion() {
        guard selectedChoiceID != nil else { return }
        
        // 次の問題を準備
        prepareQuestion()
    }
    
    /// バッチ評価
    /// バッチ終了時に成功率を判定し、次のバッチに進むか再試行するかを決定
    private func evaluateBatch() {
        let batchTotal = currentBatchItems.count
        guard batchTotal > 0 else {
            // すべて完了
            saveResults()
            dismiss()
            return
        }
        
        // 成功率を計算
        let successRate = Double(batchCorrect) / Double(batchTotal)
        let threshold = quizSettings.threshold
        
        print("📊 バッチ評価: 正解 \(batchCorrect)/\(batchTotal) = \(Int(successRate * 100))%, 閾値: \(Int(threshold * 100))%")
        
        if successRate >= threshold {
            // 成功: 次のバッチへ
            print("✅ バッチ合格!")
            
            // バッチサイズを増やす（最大20）
            if batchSize < 20 {
                batchSize = min(20, batchSize + 2)
                print("📚 バッチサイズを \(batchSize) に増加")
            }
            
            // 前バッチ結果をリセット
            previousBatchResults = [:]
            
            // 再試行回数をリセット
            batchAttempts = 0
            
            // 次のバッチを準備
            if questionCount < items.count {
                prepareBatch()
            } else {
                // すべて完了
                saveResults()
                dismiss()
            }
        } else {
            // 失敗: 再試行
            if batchAttempts < 3 {
                print("⚠️ バッチ不合格、再試行 (\(batchAttempts)/3)")
                prepareBatch()
            } else {
                print("⚠️ 最大再試行回数に達しました。次のバッチへ")
                // 最大再試行回数に達したら次へ
                previousBatchResults = [:]
                batchAttempts = 0
                
                if questionCount < items.count {
                    prepareBatch()
                } else {
                    saveResults()
                    dismiss()
                }
            }
        }
    }
    
    /// 結果を保存
    private func saveResults() {
        // QuizResultをScoreStoreに保存
        let result = QuizResult(
            total: questionCount,
            correct: score,
            settings: quizSettings.model
        )
        scoreStore.addResult(result)
        print("💾 クイズ結果を保存しました: \(score)/\(questionCount)")
    }
    
    // MARK: - ヘルパーメソッド
    
    /// 学習モードを決定
    private func determineLearningMode() -> String {
        // QuizSettings の learningMode を使用
        switch quizSettings.learningMode {
        case .normal:
            return "通常モード"
        case .review:
            return "復習モード"
        case .remediation:
            return "補習モード"
        }
    }
    
    /// 正答率を計算
    private func calculateAccuracy() -> Int {
        guard questionCount > 0 else { return 0 }
        return Int(Double(score) / Double(questionCount) * 100)
    }
}

// MARK: - Extensions

extension Array where Element == QuestionItem {
    /// 重複を削除した配列を返す（IDベース）
    func uniqued() -> [QuestionItem] {
        var seen = Set<UUID>()
        return filter { item in
            if seen.contains(item.id) {
                return false
            } else {
                seen.insert(item.id)
                return true
            }
        }
    }
}

// MARK: - Preview

struct QuizView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationStack {
            QuizView()
                .environmentObject(WordScoreStore())
                .environmentObject(CurrentCSV.shared)
                .environmentObject(QuizSettings(currentCSV: CurrentCSV.shared))
        }
    }
}
