//
//  QuizView.swift
//  SimpleWord
//
//  Created by GitHub Copilot on 2025/10/06.
//

// クイズ画面（CSVから読み込み→フィルタ→出題→成績記録）
// - 何を: 設定に基づいて問題を作成し、選択肢を提示。解答結果は単語別成績/結果ストアに記録します。
// - なぜ: 学習を反復しやすくし、弱点把握（単語別成績）と進捗確認（CSV別）を可能にするため。

import SwiftUI
import AVFoundation
import Combine

// QuizView: CSV (Resources) から QuestionItem を読み込み出題するように変更
struct QuizView: View {
    // Environment stores
    @EnvironmentObject var quizSettings: QuizSettings
    @EnvironmentObject var scoreStore: ScoreStore
    @EnvironmentObject var wordScoreStore: WordScoreStore
    @EnvironmentObject var currentCSV: CurrentCSV

    // Speech synthesizer (used when quizSettings.isSpeechEnabled == true)
    private let speechSynthesizer = AVSpeechSynthesizer()

    // 学習スケジューラ（ユーザー適応型）
    private let scheduler = AdaptiveScheduler()

    // UI状態
    @State private var items: [QuestionItem] = []
    @State private var order: [QuestionItem] = [] // シャッフルされた全アイテム順序
    @State private var pool: [QuestionItem] = [] // 現在のバッチで繰り返し分を含む出題プール
    @State private var poolIndex: Int = 0

    @State private var currentItem: QuestionItem? = nil

    // Replace simple String-based choices with an ID-backed Choice so we can unambiguously map back to the original QuestionItem.
    private struct Choice: Identifiable, Equatable {
        let id: UUID
        let item: QuestionItem
        // 選択肢に表示する主要ラベル：日本語訳（meaning）を優先し、空の場合は語句(term)を使う
        var label: String { item.meaning.isEmpty ? item.term : item.meaning }
        init(item: QuestionItem) {
            self.item = item
            self.id = item.id
        }
        static func ==(lhs: Choice, rhs: Choice) -> Bool { lhs.id == rhs.id }
    }

    // Small subview to render a single choice and its explanation (keeps body simpler for the compiler)
    private struct ChoiceView: View {
        let choice: Choice
        let selectedID: UUID?
        let correctAnswerID: UUID?
        @Binding var expandedIDs: Set<UUID>
        let lookup: (String) -> QuestionItem?
        let onSelect: (UUID) -> Void

        var body: some View {
            // determine state
            let answered = (selectedID != nil)
            let isCorrect = (correctAnswerID != nil && choice.id == correctAnswerID)
            let isChosen = (selectedID != nil && choice.id == selectedID)

            // background color for card depending on answer state
            let bgColor: Color = {
                if !answered { return Color(uiColor: .secondarySystemBackground) }
                if isCorrect { return Color.green.opacity(0.9) }
                if isChosen { return Color.red.opacity(0.9) }
                return Color(uiColor: .secondarySystemBackground).opacity(0.6)
            }()

            // choose readable text/icon colors depending on whether the card is showing an answer
            // - 未回答時はシステムの primary を使い、ダーク/ライト両対応
            // - 回答表示時 (緑/赤 背景) は白を使ってコントラストを確保
            let textColor: Color = answered ? .white : .primary
            let textColorFaint: Color = answered ? Color.white.opacity(0.9) : Color.primary.opacity(0.9)
            let textColorStrong: Color = answered ? Color.white.opacity(0.95) : Color.primary
            let iconColor: Color = answered ? .white : .primary
            let textFont: Font = answered ? .body.weight(.semibold) : .body

            //Button(action: { onSelect(choice.id) }) {
            SectionCard(backgroundColor: bgColor) {
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 12) {
                        // 主要表示: 日本語訳を目立たせ、英語語句は補助として小さく表示
                        VStack(alignment: .leading, spacing: 2) {
                            Text(choice.label)
                                .foregroundColor(textColor)
                                .font(textFont)
                                .lineLimit(2)
                            // 補助テキストとして英単語（語句）を小さく表示
                            // 未回答時は補助テキストを伏せる（答えが漏れないようにする）
                            if answered {
                                Text(choice.item.term)
                                    .foregroundColor(textColorFaint)
                                    .font(.caption)
                                    .lineLimit(1)
                            }
                        }

                        Spacer()
                        if let s = selectedID {
                            if let ca = correctAnswerID, choice.id == ca {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(iconColor)
                            } else if choice.id == s {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(iconColor)
                            }
                        }
                    }

                    if answered {
                        let explainItem = choice.item
                        let isExpanded = expandedIDs.contains(choice.id)
                        VStack(alignment: .leading, spacing: 6) {
                            Text("語句: \(explainItem.term)")
                                .font(.caption)
                                .foregroundColor(textColorStrong)
                            if !explainItem.reading.isEmpty {
                                Text("読み: \(explainItem.reading)")
                                    .font(.caption)
                                    .foregroundColor(textColorFaint)
                            }

                            // 語源は常に全文表示（展開不要）
                            if !explainItem.etymology.isEmpty {
                                Text(explainItem.etymology)
                                    .font(.caption)
                                    .foregroundColor(textColorFaint)
                                    .lineLimit(nil)
                            }

                            if isExpanded {
                                if !explainItem.relatedWords.isEmpty {
                                    VStack(alignment: .leading, spacing: 6) {
                                        SectionHeader(systemImage: "tag", title: "関連語")
                                        VStack(alignment: .leading, spacing: 8) {
                                            ForEach(explainItem.relatedWords, id: \.self) { rw in
                                                if let found = lookup(rw) {
                                                    NavigationLink {
                                                        QuestionDetailView(item: found)
                                                    } label: {
                                                        VStack(alignment: .leading, spacing: 2) {
                                                            Text(found.term)
                                                                .font(.subheadline)
                                                                .bold()
                                                                .foregroundColor(textColor)
                                                            if !found.reading.isEmpty {
                                                                Text(found.reading)
                                                                    .font(.caption)
                                                                    .foregroundColor(textColorFaint)
                                                            }
                                                            if !found.meaning.isEmpty {
                                                                Text(found.meaning)
                                                                    .font(.caption2)
                                                                    .foregroundColor(textColorFaint)
                                                            }
                                                        }
                                                        .padding(.vertical, 6)
                                                    }
                                                    .buttonStyle(.plain)
                                                } else {
                                                    VStack(alignment: .leading, spacing: 2) {
                                                        Text(rw)
                                                            .font(.subheadline)
                                                            .foregroundColor(textColor)
                                                        Text("(詳細情報なし)")
                                                            .font(.caption2)
                                                            .foregroundColor(textColorFaint)
                                                    }
                                                    .padding(.vertical, 6)
                                                }
                                            }
                                        }
                                    }
                                }

                                if !explainItem.relatedFields.isEmpty {
                                    HStack(spacing: 6) {
                                        Text("分野:")
                                            .font(.caption2)
                                            .foregroundColor(textColorFaint)
                                        ForEach(explainItem.relatedFields, id: \.self) { f in
                                            TagCapsule(label: f)
                                        }
                                    }
                                }

                                if !explainItem.difficulty.isEmpty {
                                    HStack(spacing: 6) {
                                        Text("難易度:")
                                            .font(.caption2)
                                            .foregroundColor(textColorFaint)
                                        DifficultyBadge(text: explainItem.difficulty)
                                    }
                                }
                            }

                            Button(action: {
                                withAnimation {
                                    if isExpanded {
                                        expandedIDs.remove(choice.id)
                                    } else {
                                        expandedIDs.insert(choice.id)
                                    }
                                }
                            }) {
                                Text(isExpanded ? "閉じる" : "もっと見る")
                                    .font(.caption2)
                                    .foregroundColor(textColor)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .contentShape(Rectangle()) // ensure the tappable area includes padding
            }
            .frame(maxWidth: .infinity)
            .onTapGesture {
                // only allow selection when not already answered
                if selectedID == nil {
                    onSelect(choice.id)
                }
            }
            //.buttonStyle(.plain)
            //.disabled(selectedID != nil)
        }
    }

    @State private var choices: [Choice] = []
    @State private var correctAnswerID: UUID? = nil
    @State private var selectedID: UUID? = nil
    @State private var score: Int = 0 // 累積正解数
    @State private var questionCount: Int = 0 // 累積出題数
    @State private var finished: Bool = false
    @State private var errorMessage: String? = nil
    /// 各問題ごとに生成する「分からない」カードの識別子
    @State private var dontKnowChoiceID: UUID? = nil

    // 問題ごとのタイマー制御
    @State private var questionTimerWorkItem: DispatchWorkItem? = nil
    @State private var timeRemaining: Int = 0

    // 自動で次への予約用（DispatchWorkItem を使って遅延実行・キャンセル可能にする）
    @State private var pendingAdvance: DispatchWorkItem? = nil
    // 回答後に自動で次へするまでの遅延（秒）
    private let autoAdvanceDelay: TimeInterval = 1.0

    // per-choice expanded/collapsed state for explanations
    @State private var expandedIDs: Set<UUID> = []

    // バッチ管理
    @State private var batchStart: Int = 0
    @State private var batchSize: Int = 10 // デフォルトバッチサイズ（設定で上書き）
    @State private var batchCorrect: Int = 0
    @State private var batchAttempts: Int = 0
    // 補修モード判定
    @State private var remediationMode: Bool = false

    // 応答時間計測（問題表示→選択まで）
    @State private var questionShownAt: Date? = nil

    // 直前セットのアイテム（次セットのローテーションに使用）
    @State private var lastBatchItemIDs: [UUID] = []
    @State private var lastPickedItems: [QuestionItem] = []
    
    // 新しい単語追加時の光るエフェクト用
    @State private var shouldAnimatePassedCount: Bool = false
    @State private var shouldAnimateTotalCount: Bool = false
    @State private var previousPassedCount: Int = 0
    @State private var previousTotalCount: Int = 0

    // 表示用計算プロパティ
    private var totalBatches: Int {
        guard batchSize > 0 else { return 1 }
        return max(1, Int(ceil(Double(max(1, order.count)) / Double(batchSize))))
    }

    // UIで使う簡易フォーマット済み文字列（複雑な式をViewBuilder内に置かないため）
    private var overallAccuracy: Int {
        // 元の一行計算はコンパイラの型推論でタイムアウトすることがあるので
        // 明示的に段階的に計算して型推論負荷を下げる
        guard questionCount > 0 else { return 0 }
        let q = Double(questionCount)
        let s = Double(score)
        let ratio = (q > 0) ? (s / q) : 0.0
        let percent = round(ratio * 100.0)
        return Int(percent)
    }
    private var timerStatus: String { quizSettings.isTimerEnabled ? "有効" : "無効" }
    private var learningModeStatus: String { quizSettings.learningMode.displayName }
    private var randomOrderStatus: String { quizSettings.isRandomOrder ? "ON" : "OFF" }
    private var speechStatus: String { quizSettings.isSpeechEnabled ? "ON" : "OFF" }
    private var autoAdvanceStatus: String { quizSettings.model.autoAdvance ? "有効" : "無効" }

    // body の型推論負荷を下げるため、実際の UI は AnyView を返す `contentBody` に移譲する。
    var body: some View { contentBody }

    // AnyView にラップすることで Swift の型推論対象を単純化し、大きな ViewBuilder による
    // 「The compiler is unable to type-check this expression in reasonable time」問題を回避する。
    private var contentBody: AnyView {
        // 少しずつ式を分割して compiler の型推論負荷を軽減する
        let mainScroll = ScrollView { // スクロール可能にして長文の解説でも崩れないようにする
            VStack(spacing: 12) {
                // 統計表示
                QuizStatisticsView(
                    csvName: currentCSV.name ?? "(未設定)",
                    learningMode: learningModeStatus,
                    accuracy: overallAccuracy,
                    passedCount: batchCorrect,
                    totalCount: questionCount,
                    batchSize: batchSize,
                    shouldAnimatePassedCount: $shouldAnimatePassedCount,
                    shouldAnimateTotalCount: $shouldAnimateTotalCount
                )

                if items.count < 1 {
                    VStack(spacing: 8) {
                        if let msg = errorMessage {
                            Text(msg)
                                .foregroundColor(.red)
                        }
                        Text("CSV に十分な単語がありません (1語以上が必要です)。")
                            .padding()
                    }
                } else if finished {
                    // 結果表示
                    VStack(spacing: 12) {
                        Text("終了！")
                            .font(.largeTitle)
                            .bold()
                        Text("スコア: \(score) / \(questionCount)")
                        Button("もう一度") {
                            restart()
                        }
                        .buttonStyle(.borderedProminent)
                    }
                } else {
                    // 出題表示
                    questionDisplayView
                }
            }
            .padding(.vertical)
            .padding(.horizontal)
        }

        // 修飾子類は別変数に適用してから AnyView に包む
        let withBackground = mainScroll.background(Color(uiColor: .systemGroupedBackground))
        let withNav = withBackground
            .navigationTitle("SimpleWord Quiz")
            .navigationBarTitleDisplayMode(.inline)
        let withAppear = withNav.onAppear(perform: start)

        // onChange/onDisappear を個別に追加してチェーン長を分割
        let withAutoAdvanceChange = withAppear.onChange(of: quizSettings.model.autoAdvance) { _, newAutoAdvance in
            if !newAutoAdvance {
                pendingAdvance?.cancel()
                pendingAdvance = nil
            }
        }

        let withQuestionsPerBatchChange = withAutoAdvanceChange.onChange(of: quizSettings.questionsPerBatch) { _, newQuestionsPerBatch in
            batchSize = min(max(1, newQuestionsPerBatch), max(1, items.count))
        }

        let finalView = withQuestionsPerBatchChange.onDisappear {
            pendingAdvance?.cancel()
            pendingAdvance = nil
        }

        return AnyView(finalView)
    }

    // 初期処理: CSV を読み込む
    private func start() {
        // 出題設定エディタ用のテキストフィールドを初期化
        // fieldsText = quizSettings.fields.joined(separator: ",")
        // difficultiesText = quizSettings.difficulties.joined(separator: ",")
        loadCSVAndStart()
    }

    private func loadCSVAndStart() {
        let loader = CSVLoader()
        var loaded: [QuestionItem] = []

        // 1) 現在出題中のCSV名（シングルトン）を優先して読み込む
        if let selected = currentCSV.name, !selected.isEmpty {
            // Documents にあるか
            if let docDir = FileUtils.documentsDirectory {
                let docURL = docDir.appendingPathComponent(selected)
                if FileManager.default.fileExists(atPath: docURL.path) {
                    if let got = try? loader.load(from: docURL) {
                        loaded = got
                    }
                }
            }
            // Bundle にあるか (名前のみの場合)
            if loaded.isEmpty {
                let base = selected.replacingOccurrences(of: ".csv", with: "")
                if let got = try? loader.loadFromBundle(named: base) {
                    loaded = got
                }
            }
        }

        // 2) 選択無しなら highschool -> sample の順でロード
        if loaded.isEmpty {
            if let high = try? loader.loadFromBundle(named: "高校単語"), !high.isEmpty {
                loaded = high
                // シングルトンが未設定ならデフォルトを設定
                if (currentCSV.name ?? "").isEmpty { currentCSV.name = "高校単語.csv" }
            } else if let sample = try? loader.loadFromBundle(named: "サンプル単語"), !sample.isEmpty {
                loaded = sample
                if (currentCSV.name ?? "").isEmpty { currentCSV.name = "サンプル単語.csv" }
            }
        }

        // フィルタ: selectedFields と difficulty
        var filtered = loaded
        if !quizSettings.fields.isEmpty {
            filtered = filtered.filter { item in
                // item.relatedFields に quizSettings.fields のいずれかが含まれる場合を残す
                for f in quizSettings.fields {
                    if item.relatedFields.contains(where: { $0.localizedCaseInsensitiveContains(f) }) {
                        return true
                    }
                }
                return false
            }
        }
        // difficulties は複数選択可。1つでも空でなければフィルタを適用する。
        if !quizSettings.difficulties.isEmpty {
            filtered = filtered.filter { item in
                // 空文字は無視
                for d in quizSettings.difficulties where !d.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    if item.difficulty.localizedCaseInsensitiveContains(d) { return true }
                }
                return false
            }
        }

        if filtered.isEmpty {
            self.items = []
            self.errorMessage = "フィルタに合致する問題がありません。設定を見直してください。"
            return
        }

        // QuizSettings の numberOfQuestions と isRandomOrder を反映して出題対象を決定
        let requestedTotal = max(1, quizSettings.numberOfQuestions)
        let totalQuestions = min(requestedTotal, filtered.count)

        // totalQuestions に基づいて items を切り出す（ランダム順序かどうかは isRandomOrder に従う）
        if quizSettings.isRandomOrder {
            // シャッフルして先頭 totalQuestions を採用
            let sel = filtered.shuffled().prefix(totalQuestions)
            self.items = Array(sel)
            self.order = self.items.shuffled()
        } else {
            // 元の順序（ファイル順）を維持して先頭 totalQuestions を採用
            let sel = Array(filtered.prefix(totalQuestions))
            self.items = sel
            self.order = sel
        }
        self.batchStart = 0

        // ユーザー設定に基づくバッチサイズ（questionsPerBatch）を totalQuestions まででクリップ
        self.batchSize = min(max(1, quizSettings.questionsPerBatch), max(1, self.items.count))

        self.score = 0
        self.questionCount = 0
        self.finished = false
        self.batchAttempts = 0
        self.lastBatchItemIDs = [] // 初回はローテーションなし
        self.remediationMode = false
        prepareBatch()
    }

    private func prepareBatch() {
        // AdaptiveScheduler から次に出すべき ID を取得
        let ids = items.map { $0.id }
        let suggestedIDs = scheduler.scheduleNextBatch(itemIDs: ids, count: batchSize)
        var pickedItems: [QuestionItem] = suggestedIDs.compactMap { sid in items.first(where: { $0.id == sid }) }
        if pickedItems.isEmpty {
            // フォールバック: 既存の順序からレンジで選択
            let end = min(batchStart + batchSize, order.count)
            if batchStart < end {
                pickedItems = Array(order[batchStart..<end])
            } else {
                pickedItems = Array(items.shuffled().prefix(batchSize))
            }
        }

        // 補修判定: バッチ内で低正答率の割合が閾値を超えたら補修モードへ
        let lowAccThreshold = max(0.0, min(1.0, quizSettings.model.lowAccuracyThreshold))
        let lowCount = pickedItems.filter { wordScoreStore.score(for: $0.id).accuracy < lowAccThreshold }.count
        let lowRatio = (pickedItems.count > 0) ? Double(lowCount) / Double(pickedItems.count) : 0.0
        remediationMode = (quizSettings.model.maxLowAccuracyRatio > 0.0) && (lowRatio >= quizSettings.model.maxLowAccuracyRatio)
        if remediationMode {
            // 補修モードでは低正答率の問題のみを優先して出題
            let lowItems = pickedItems.filter { wordScoreStore.score(for: $0.id).accuracy < lowAccThreshold }
            if !lowItems.isEmpty {
                pickedItems = lowItems
            }
        }

        // セット終了後のローテーション: 直前セットで高正答(>=85%)のアイテムを、出題回数の少ないアイテムに入れ替える
        if !lastBatchItemIDs.isEmpty {
            // 高正答の候補
            let highAccIDs: [UUID] = lastBatchItemIDs.filter { id in
                let s = wordScoreStore.score(for: id)
                return s.attempts >= 3 && s.accuracy >= 0.85
            }
            if !highAccIDs.isEmpty {
                // 現在の候補から置換対象を抽出（picked 内に含まれる高正答から）
                var replaceTargets: [Int] = []
                for (idx, q) in pickedItems.enumerated() {
                    if highAccIDs.contains(q.id) { replaceTargets.append(idx) }
                }
                // 置換数（全体の 20% かつ最低1件、かつ picked 内の高正答数まで）
                let maxReplace = max(1, batchSize / 5)
                replaceTargets = Array(replaceTargets.prefix(maxReplace))

                if !replaceTargets.isEmpty {
                    // 低出題回数アイテムを昇順に並べ、未選択のものを優先して取得
                    let sortedByAttempts = items.sorted {
                        let a = wordScoreStore.score(for: $0.id).attempts
                        let b = wordScoreStore.score(for: $1.id).attempts
                        return a < b
                    }
                    var lowExposure: [QuestionItem] = []
                    var pickedSet = Set(pickedItems.map { $0.id })
                    for it in sortedByAttempts where !pickedSet.contains(it.id) {
                        lowExposure.append(it)
                        if lowExposure.count >= replaceTargets.count { break }
                    }
                    // 置換を実行
                    for (i, idx) in replaceTargets.enumerated() {
                        if i < lowExposure.count {
                            pickedItems[idx] = lowExposure[i]
                            pickedSet.insert(lowExposure[i].id)
                        }
                    }
                }
            }
        }

        // repeatCount を適用して pool を作成（低正答率は繰り返し回数を増やす。高記憶は1回に抑える）
        let repeatCount = max(1, quizSettings.repeatCount)
        self.lastPickedItems = pickedItems // 次の評価のため保持
        var p: [QuestionItem] = []
        if repeatCount <= 1 && !remediationMode {
            p = pickedItems.shuffled()
        } else {
            // 各アイテムの繰り返し回数を可変化: 高記憶は 1 回、低正答は増幅
            var perItemRepeat: [UUID: Int] = [:]
            let repo = FileStudyProgressRepository()
            for it in pickedItems {
                let ws = wordScoreStore.score(for: it.id)
                let rec = repo.load(id: it.id)
                let isHighMemory = (ws.attempts >= 3 && ws.accuracy >= 0.85) || rec.mastered || rec.correctStreak >= 3
                if remediationMode {
                    // 補修モード時は低正答率問題を多めに繰り返す
                    perItemRepeat[it.id] = isHighMemory ? 1 : max(2, repeatCount * 4)
                } else {
                    // 通常時: 低正答率は繰り返しを増やす
                    if ws.accuracy < lowAccThreshold {
                        perItemRepeat[it.id] = max(2, repeatCount * 3)
                    } else {
                        perItemRepeat[it.id] = isHighMemory ? 1 : repeatCount
                    }
                }
            }
            // ラウンドロビン: 各アイテムを perItemRepeat 回ずつ、連続しないように配置
            var counts: [UUID: Int] = perItemRepeat
            var byID: [UUID: QuestionItem] = [:]
            for it in pickedItems { byID[it.id] = it }
            var lastID: UUID? = nil
            while counts.values.reduce(0, +) > 0 {
                // 候補をソート（残回数が多い順）
                let candidates = counts.keys.sorted { (a, b) in
                    counts[a, default: 0] > counts[b, default: 0]
                }
                // last と異なる最上位を選択
                var chosen: UUID? = nil
                for c in candidates where counts[c, default: 0] > 0 {
                    if c != lastID { chosen = c; break }
                }
                // もし全て last と同一しか残らない場合はやむなくそれを選択
                if chosen == nil { chosen = candidates.first(where: { counts[$0, default: 0] > 0 }) }
                if let cid = chosen, let q = byID[cid] {
                    p.append(q)
                    counts[cid, default: 0] -= 1
                    lastID = cid
                } else {
                    break
                }
            }
            // 念のためサイズ不足時はシャッフル補完
            let expected = pickedItems.reduce(0) { $0 + (perItemRepeat[$1.id] ?? 1) }
            if p.count < expected {
                var extras: [QuestionItem] = []
                for it in pickedItems { for _ in 0..<(perItemRepeat[it.id] ?? 1) { extras.append(it) } }
                extras.shuffle()
                for e in extras where p.count < expected { p.append(e) }
            }
        }
        self.pool = p
        self.poolIndex = 0
        self.batchCorrect = 0
        // 準備して最初の問題を出す
        prepareQuestion()
    }

    // 補助: 重み付きで選択肢用の誤答アイテムを選ぶ
    private func weightedDistractorItems(excluding correct: QuestionItem, count: Int) -> [QuestionItem] {
        var candidates = items.filter { $0.id != correct.id }
        if candidates.isEmpty { return [] }
        // 重み付け: 低正答率は重みを増やす、既に高精度のものは重みを下げる
        let lowAccThreshold = max(0.0, min(1.0, quizSettings.model.lowAccuracyThreshold))
        var weights: [Double] = candidates.map { it in
            let acc = wordScoreStore.score(for: it.id).accuracy
            if acc < lowAccThreshold { return 4.0 }
            if acc >= 0.85 { return 0.5 }
            return 1.0
        }
        var picked: [QuestionItem] = []
        for _ in 0..<min(count, candidates.count) {
            let total = weights.reduce(0, +)
            if total <= 0 { break }
            var r = Double.random(in: 0..<total)
            var idx = 0
            while idx < weights.count {
                r -= weights[idx]
                if r <= 0 { break }
                idx += 1
            }
            if idx >= candidates.count { idx = candidates.count - 1 }
            picked.append(candidates[idx])
            // remove chosen
            candidates.remove(at: idx)
            weights.remove(at: idx)
        }
        return picked
    }

    private func prepareQuestion() {
        guard poolIndex < pool.count else {
            // バッチ終了。評価して次へ or 繰り返し
            evaluateBatch()
            return
        }
        let item = pool[poolIndex]
        currentItem = item
        // 問題ごとに「分からない」カード用の一意IDを作成
        self.dontKnowChoiceID = UUID()

        // 既存の質問タイマーがあればキャンセル
        cancelQuestionTimer()

        // 音声設定が有効なら問題を読み上げる
        if quizSettings.isSpeechEnabled {
            speak(text: item.term)
        }

        // 選択肢数を設定（設定が利用可能でなければデフォルト3）
        let numberOfChoices = max(2, min(6, quizSettings.numberOfChoices))
         let distractorCount = max(1, numberOfChoices - 1)
         
         // correctAnswer = item.meaning
         // Build choices as Choice items carrying the original QuestionItem so lookups are unambiguous
         var cs: [Choice] = []
         // correct choice first
         let correctChoice = Choice(item: item)
         cs.append(correctChoice)

         // 誤答は重み付きで選択（低正答率の単語が選択肢に表示される頻度を増やす）
         let otherItems = weightedDistractorItems(excluding: item, count: distractorCount)
         for it in otherItems { cs.append(Choice(item: it)) }

         // 足りない場合は通常の補完（既存選択肢と重複しないようにフィルタ）
         if cs.count < numberOfChoices {
             var others = items.filter { it in it.id != item.id && !cs.contains(where: { $0.id == it.id }) }
             others.shuffle()
             for it in others.prefix(numberOfChoices - cs.count) { cs.append(Choice(item: it)) }
         }

         cs.shuffle()
         self.choices = cs
         self.correctAnswerID = correctChoice.id
         // 問題表示時刻を記録（応答時間計測用）
         self.questionShownAt = Date()

         // タイマーを開始（有効化されている場合）
         if quizSettings.isTimerEnabled {
             startQuestionTimer()
         }
     }

    // タイマー関連
    private func startQuestionTimer() {
        cancelQuestionTimer()
        let limit = max(1, quizSettings.timeLimit)
        timeRemaining = limit
        let work = DispatchWorkItem {
            DispatchQueue.main.async {
                // 時間切れは giveUp と同等扱い
                if self.selectedID == nil {
                    self.giveUp()
                }
            }
        }
        questionTimerWorkItem = work
        DispatchQueue.global().asyncAfter(deadline: .now() + .seconds(limit), execute: work)
    }

    private func cancelQuestionTimer() {
        questionTimerWorkItem?.cancel()
        questionTimerWorkItem = nil
        timeRemaining = 0
    }

    // Speak helper
    private func speak(text: String) {
        let utt = AVSpeechUtterance(string: text)
        utt.rate = AVSpeechUtteranceDefaultSpeechRate
        utt.voice = AVSpeechSynthesisVoice(language: "en-US")
        speechSynthesizer.stopSpeaking(at: .immediate)
        speechSynthesizer.speak(utt)
    }

    private func select(_ choiceID: UUID) {
        guard selectedID == nil else { return }
        // 選択時は問題タイマーを停止
        cancelQuestionTimer()
         selectedID = choiceID
         
         // 値の変化前にアニメーションをチェック
         let oldQuestionCount = questionCount
         let oldBatchCorrect = batchCorrect
         
         questionCount += 1
         let wasCorrect = (correctAnswerID != nil && choiceID == correctAnswerID)
         if wasCorrect {
             score += 1
             batchCorrect += 1
         }
         
         // 値が変化したらアニメーションをトリガー
         if questionCount > oldQuestionCount {
             shouldAnimateTotalCount = true
             DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                 self.shouldAnimateTotalCount = false
             }
         }
         
         if wasCorrect && batchCorrect > oldBatchCorrect {
             shouldAnimatePassedCount = true
             DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                 self.shouldAnimatePassedCount = false
             }
         }
         // Record per-word result in WordScoreStore
         if let chosen = choices.first(where: { $0.id == choiceID }) {
             wordScoreStore.recordResult(itemID: chosen.item.id, correct: wasCorrect)
         }
         // Adaptive 学習記録（応答時間込み）
         if let item = currentItem {
             let now = Date()
             let rt = max(0.05, now.timeIntervalSince(questionShownAt ?? now))
             let outcome: ReviewOutcome = wasCorrect ? .correct : .wrong
             scheduler.record(itemID: item.id, result: outcome, responseTime: rt, now: now)
         }

         // 自動で次へ設定は「正解の場合のみ」実行する
         if wasCorrect && quizSettings.model.autoAdvance {
             // 既に予約があればキャンセル
             pendingAdvance?.cancel()
             let work = DispatchWorkItem {
                 DispatchQueue.main.async {
                     // 実行直前に自動遷移がまだ有効か確認
                     if self.quizSettings.model.autoAdvance {
                         self.next()
                     }
                 }
             }
             pendingAdvance = work
             DispatchQueue.main.asyncAfter(deadline: .now() + autoAdvanceDelay, execute: work)
         }
    }

    private func giveUp() {
        guard selectedID == nil, let item = currentItem else { return }
        // タイマーを停止
        cancelQuestionTimer()
        // 回答せずに解答を表示：selectedID をダミーで埋めて解説表示・次へ可能に
        // 分からないカードのIDがあればそれを選択状態にする（カードをハイライトするため）
        selectedID = dontKnowChoiceID ?? UUID()
        
        // 値の変化前にチェック
        let oldQuestionCount = questionCount
        questionCount += 1
        
        // 総出題数が変化したらアニメーションをトリガー
        if questionCount > oldQuestionCount {
            shouldAnimateTotalCount = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                self.shouldAnimateTotalCount = false
            }
        }
        
        // 成績（不正解として記録）
        wordScoreStore.recordResult(itemID: item.id, correct: false)
        // 学習ログ（gaveUp として記録）
        let now = Date()
        let rt = max(0.05, now.timeIntervalSince(questionShownAt ?? now))
        scheduler.record(itemID: item.id, result: .gaveUp, responseTime: rt, now: now)

        // 分からない（gave up）の場合は自動遷移しない（誤答として扱うが自動進行は抑止）
        pendingAdvance?.cancel()
        pendingAdvance = nil
    }

    private func next() {
        guard selectedID != nil else { return }
        // 自動遷移予約があればキャンセルして二重実行を防止
        pendingAdvance?.cancel()
        pendingAdvance = nil
        // 次へ移動前に問題タイマーを停止
        cancelQuestionTimer()
         selectedID = nil
         poolIndex += 1

         if poolIndex >= pool.count {
             // バッチ完了処理（prepareQuestion 内で評価するため評価を呼ぶ）
             evaluateBatch()
             return
         }
         prepareQuestion()
    }

    private func evaluateBatch() {
        // バッチ評価開始時に保留中の自動遷移をキャンセル（安全策）
        pendingAdvance?.cancel()
        pendingAdvance = nil
        let successRate = (pool.count > 0) ? Double(batchCorrect) / Double(pool.count) : 0.0
        let threshold = max(0.0, min(1.0, quizSettings.threshold))
        if successRate >= threshold {
            // 次のセットへ（ローテーションのため直前セットを記録）
            lastBatchItemIDs = lastPickedItems.map { $0.id }
            // ここでバッチを "追加" する: 現在のバッチサイズに次のバッチ分を加える
            let increment = max(1, quizSettings.questionsPerBatch)
            let oldBatchSize = batchSize
            if batchSize < items.count {
                batchSize = min(items.count, batchSize + increment)
                
                // 新しい単語が追加される場合、アニメーションをトリガー
                if batchSize > oldBatchSize {
                    shouldAnimateTotalCount = true
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                        self.shouldAnimateTotalCount = false
                    }
                }
            } else {
                // 既に全件をカバーしている場合は進めて終了判定に任せる
                batchStart += batchSize
            }
            batchAttempts = 0
            // 再計算: batchStart を越える場合は終了処理
            if batchStart >= order.count {
                // 全て完了
                finished = true
                // 保存（QuizResultに渡す設定を構築）
                let resultSettings = QuizSettingsModel(
                    selectedCSV: currentCSV.name,
                    selectedFields: quizSettings.fields,
                    difficulties: quizSettings.difficulties,
                    repeatCount: quizSettings.repeatCount,
                    successThreshold: quizSettings.threshold,
                    autoAdvance: quizSettings.model.autoAdvance,
                    questionsPerBatch: quizSettings.questionsPerBatch,
                    lowAccuracyThreshold: quizSettings.model.lowAccuracyThreshold,
                    maxLowAccuracyRatio: quizSettings.model.maxLowAccuracyRatio,
                    numberOfChoices: quizSettings.numberOfChoices,
                    numberOfQuestions: quizSettings.numberOfQuestions,
                    isTimerEnabled: quizSettings.isTimerEnabled,
                    timeLimit: quizSettings.timeLimit,
                    learningMode: quizSettings.learningMode,
                    isRandomOrder: quizSettings.isRandomOrder,
                    isSpeechEnabled: quizSettings.isSpeechEnabled,
                    selectedCSVFile: currentCSV.name ?? "",
                    fields: quizSettings.fields,
                    threshold: quizSettings.threshold,
                    appearance: quizSettings.appearance.rawValue
                )
                let result = QuizResult(total: questionCount, correct: score, settings: resultSettings)
                scoreStore.addResult(result)
                return
            }
            prepareBatch()
        } else {
            // しきい値未達成:  繰り返し（上限3回）
            batchAttempts += 1
            if batchAttempts < 3 {
                // same セット再実行（ローテーションは行わない）
                prepareBatch()
            } else {
                // 次のセットへ進む（失敗扱いで進める）。ローテーションを適用。
                lastBatchItemIDs = lastPickedItems.map { $0.id }
                batchStart += batchSize
                batchAttempts = 0
                if batchStart >= order.count {
                    finished = true
                    let resultSettings = QuizSettingsModel(
                        selectedCSV: currentCSV.name,
                        selectedFields: quizSettings.fields,
                        difficulties: quizSettings.difficulties,
                        repeatCount: quizSettings.repeatCount,
                        successThreshold: quizSettings.threshold,
                        autoAdvance: quizSettings.model.autoAdvance,
                        questionsPerBatch: quizSettings.questionsPerBatch,
                        lowAccuracyThreshold: quizSettings.model.lowAccuracyThreshold,
                        maxLowAccuracyRatio: quizSettings.model.maxLowAccuracyRatio,
                        numberOfChoices: quizSettings.numberOfChoices,
                        numberOfQuestions: quizSettings.numberOfQuestions,
                        isTimerEnabled: quizSettings.isTimerEnabled,
                        timeLimit: quizSettings.timeLimit,
                        learningMode: quizSettings.learningMode,
                        isRandomOrder: quizSettings.isRandomOrder,
                        isSpeechEnabled: quizSettings.isSpeechEnabled,
                        selectedCSVFile: currentCSV.name ?? "",
                        fields: quizSettings.fields,
                        threshold: quizSettings.threshold,
                        appearance: quizSettings.appearance.rawValue
                    )
                    let result = QuizResult(total: questionCount, correct: score, settings: resultSettings)
                    scoreStore.addResult(result)
                    return
                }
                prepareBatch()
            }
        }
    }

    private func restart() {
        // 再開時に保留中の自動遷移があれば取り消す
        pendingAdvance?.cancel()
        pendingAdvance = nil
        cancelQuestionTimer()
        // 再開時は設定を反映して再ロード
        loadCSVAndStart()
    }

    // helper: find QuestionItem by exact term or by meaning fallback
    private func lookupItem(for related: String) -> QuestionItem? {
        let key = related.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if key.isEmpty { return nil }
        if let exact = items.first(where: { $0.term.lowercased() == key }) { return exact }
        if let byMeaning = items.first(where: { $0.meaning.lowercased() == key }) { return byMeaning }
        // partial contains as last resort
        if let containsTerm = items.first(where: { $0.term.lowercased().contains(key) }) { return containsTerm }
        if let containsMeaning = items.first(where: { $0.meaning.lowercased().contains(key) }) { return containsMeaning }
        return nil
    }



    // 問題表示全体ビュー（コンパイラタイムアウト回避のため分離）
    @ViewBuilder
    private var questionDisplayView: some View {
        VStack(alignment: .leading, spacing: 12) {
            if let item = currentItem {
                // ナビゲーションボタン
                QuizNavigationButtonsView(
                    canGoPrevious: poolIndex > 0,
                    canGoNext: selectedID != nil,
                    onPrevious: { goPrevious() },
                    onNext: { next() }
                )

                // 問題カードを独立して表示
                QuestionCardView(item: item)
                    .environmentObject(wordScoreStore)
                
                // 選択肢カードを独立したセクションとして表示
                VStack(alignment: .leading, spacing: 4) {
                    Text("選択肢")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .padding(.leading, 4)
                    choicesListView
                }
                
                // 分からないカードを独立して表示
                VStack(alignment: .leading, spacing: 4) {
                    Text("その他")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .padding(.leading, 4)
                    dontKnowCardView
                }
            }
        }

        Spacer(minLength: 12)
    }

    // 前へボタン: 直前の問題を再表示する
    private func goPrevious() {
        // poolIndex が0より大きいときだけ戻る
        guard poolIndex > 0 else { return }
        // 保留中の自動遷移をキャンセル
        pendingAdvance?.cancel()
        pendingAdvance = nil
        // タイマー停止
        cancelQuestionTimer()
        // 選択状態をリセットして（再挑戦できるように）前問に移動
        selectedID = nil
        poolIndex -= 1
        // 問題を準備（これが currentItem を更新し、選択肢等を再生成する）
        prepareQuestion()
    }

    // 選択肢リスト（コンパイラタイムアウト回避のため分離）
    @ViewBuilder
    private var choicesListView: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(choices) { choice in
                ChoiceView(choice: choice,
                           selectedID: selectedID,
                           correctAnswerID: correctAnswerID,
                           expandedIDs: $expandedIDs,
                           lookup: { s in lookupItem(for: s) },
                           onSelect: { id in select(id) })
            }
        }
    }
    
    // 分からないカード（独立したビュー）
    @ViewBuilder
    private var dontKnowCardView: some View {
        if let dkID = dontKnowChoiceID {
            DontKnowCardView(id: dkID,
                         selectedID: selectedID,
                         correctAnswerID: correctAnswerID,
                         onSelect: { id in
                             // 選択として扱う場合は giveUp() と同等の処理を行う
                             if selectedID == nil { giveUp() }
                         })
        }
    }

    // 自動最適化用関数は廃止
}
