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

// QuizView: CSV (Resources) から QuestionItem を読み込み出題するように変更
struct QuizView: View {
    // Environment stores
    @EnvironmentObject var quizSettings: QuizSettings
    @EnvironmentObject var scoreStore: ScoreStore
    @EnvironmentObject var wordScoreStore: WordScoreStore
    @EnvironmentObject var currentCSV: CurrentCSV

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
        var label: String { item.meaning }
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
                        Text(choice.label)
                            .foregroundColor(textColor)
                            .font(textFont)
                            .lineLimit(2)
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

                            if !explainItem.etymology.isEmpty {
                                if isExpanded {
                                    Text(explainItem.etymology)
                                        .font(.caption)
                                        .foregroundColor(textColorFaint)
                                } else {
                                    let preview = String(explainItem.etymology.prefix(160))
                                    Text(preview + (explainItem.etymology.count > 160 ? "…" : ""))
                                        .font(.caption)
                                        .foregroundColor(textColorFaint)
                                }
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

    // 応答時間計測（問題表示→選択まで）
    @State private var questionShownAt: Date? = nil

    // 直前セットのアイテム（次セットのローテーションに使用）
    @State private var lastBatchItemIDs: [UUID] = []
    @State private var lastPickedItems: [QuestionItem] = []

    var body: some View {
        ScrollView { // スクロール可能にして長文の解説でも崩れないようにする
            VStack(spacing: 16) {
                // Show current CSV name at top
                SectionCard {
                    HStack {
                        Text("CSV:")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(currentCSV.name ?? "(未設定)")
                            .font(.caption)
                        Spacer()
                    }
                }

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
                    VStack(alignment: .leading, spacing: 12) {
                        Text("問題 \(questionCount + 1)")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        if let item = currentItem {
                            // 問題ヘッダカード: 語句・読み・難易度 + 問題別の正答率
                            SectionCard {
                                VStack(alignment: .leading, spacing: 6) {
                                    HStack(alignment: .firstTextBaseline) {
                                        Text(item.term)
                                            .font(.title2)
                                            .bold()
                                        Spacer()
                                        if !item.difficulty.isEmpty {
                                            DifficultyBadge(text: item.difficulty)
                                        }
                                    }
                                    if !item.reading.isEmpty {
                                        Text(item.reading)
                                            .font(.subheadline)
                                            .foregroundColor(.secondary)
                                    }
                                    // 日本語コメント: この問題の過去正答率を表示する（WordScoreStore の集計を使用）
                                    let ws = wordScoreStore.score(for: item.id)
                                    HStack(spacing: 8) {
                                        if ws.attempts > 0 {
                                            Text("正答率: \(Int(round(ws.accuracy * 100)))% ・ 過去\(ws.attempts)回")
                                                .font(.caption)
                                                .foregroundColor(.secondary)
                                        } else {
                                            Text("正答率: データなし")
                                                .font(.caption)
                                                .foregroundColor(.secondary)
                                        }
                                    }
                                }
                            }
                            .padding(.top, 4)

                            // 選択肢（各カード）
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

                            // セットとプール情報（控えめ）
                            Text("セット: \(batchStart + 1)  •  \(poolIndex + 1)/\(pool.count)")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                                .padding(.top, 2)
                        }
                    }
                    .padding(.horizontal)

                    if selectedID != nil {
                        Button(action: next) {
                            Text("次へ")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .padding(.horizontal)
                        .padding(.top, 4)
                    } else if currentItem != nil {
                        // 未回答時のヘルプ: ギブアップして解答表示
                        Button(action: giveUp) {
                            Text("わからない（答えを見る）")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                        .tint(.gray)
                        .padding(.horizontal)
                        .padding(.top, 4)
                    }

                    Spacer(minLength: 12)
                }
            }
            .padding(.vertical)
        }
        .background(Color(uiColor: .systemGroupedBackground)) // ダーク/ライト両対応の背景
        .navigationTitle("SimpleWord Quiz")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear(perform: start)
        // QuizSettings.model の変更を監視して、autoAdvance がオフになった場合は保留中の自動遷移をキャンセルする。
        .onReceive(quizSettings.$model) { newModel in
            if !newModel.autoAdvance {
                pendingAdvance?.cancel()
                pendingAdvance = nil
            }
        }
        .onDisappear {
            // 画面が消える際は予約をキャンセルして副作用を残さない
            pendingAdvance?.cancel()
            pendingAdvance = nil
        }
    }

    // 初期処理: CSV を読み込む
    private func start() {
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
        let settings = quizSettings.model
        var filtered = loaded
        if !settings.selectedFields.isEmpty {
            filtered = filtered.filter { item in
                // item.relatedFields に settings.selectedFields のいずれかが含まれる場合を残す
                for f in settings.selectedFields {
                    if item.relatedFields.contains(where: { $0.localizedCaseInsensitiveContains(f) }) {
                        return true
                    }
                }
                return false
            }
        }
        // difficulties は複数選択可。1つでも空でなければフィルタを適用する。
        if !settings.difficulties.isEmpty {
            filtered = filtered.filter { item in
                // 空文字は無視
                for d in settings.difficulties where !d.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
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

        // order を作ってバッチ開始
        self.items = filtered
        self.order = filtered.shuffled()
        self.batchStart = 0

        // ユーザー設定に基づく出題数
        self.batchSize = min(max(1, quizSettings.model.questionsPerBatch), max(1, filtered.count))

        self.score = 0
        self.questionCount = 0
        self.finished = false
        self.batchAttempts = 0
        self.lastBatchItemIDs = [] // 初回はローテーションなし
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

        // repeatCount を適用して pool を作成（同一アイテムの連続出題を避けるようにインタリーブ）
        let repeatCount = max(1, quizSettings.model.repeatCount)
        self.lastPickedItems = pickedItems // 次の評価のため保持
        var p: [QuestionItem] = []
        if repeatCount <= 1 {
            p = pickedItems.shuffled()
        } else {
            // 各アイテムの繰り返し回数を可変化: 高記憶（高正答/連続正解/マスタリ）は 1 回に抑える
            var perItemRepeat: [UUID: Int] = [:]
            let repo = FileStudyProgressRepository()
            for it in pickedItems {
                let ws = wordScoreStore.score(for: it.id)
                // repo からマスタリ状況を参照
                let rec = repo.load(id: it.id)
                let isHighMemory = (ws.attempts >= 3 && ws.accuracy >= 0.85) || rec.mastered || rec.correctStreak >= 3
                perItemRepeat[it.id] = isHighMemory ? 1 : repeatCount
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

    private func prepareQuestion() {
        guard poolIndex < pool.count else {
            // バッチ終了。評価して次へ or 繰り返し
            evaluateBatch()
            return
        }
        let item = pool[poolIndex]
        currentItem = item
        // correctAnswer = item.meaning
        // Build choices as Choice items carrying the original QuestionItem so lookups are unambiguous
        var others = items.filter { $0.meaning != item.meaning }
        others.shuffle()
        let otherItems = Array(others.prefix(2))
        var cs: [Choice] = []
        // correct choice first
        let correctChoice = Choice(item: item)
        cs.append(correctChoice)
        for it in otherItems {
            cs.append(Choice(item: it))
        }
        cs.shuffle()
        self.choices = cs
        self.correctAnswerID = correctChoice.id
        // 問題表示時刻を記録（応答時間計測用）
        self.questionShownAt = Date()
    }

    private func select(_ choiceID: UUID) {
        guard selectedID == nil else { return }
        selectedID = choiceID
        questionCount += 1
        let wasCorrect = (correctAnswerID != nil && choiceID == correctAnswerID)
        if wasCorrect {
            score += 1
            batchCorrect += 1
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

        // 自動で次へ設定なら遅延して次へを呼ぶ
        if quizSettings.model.autoAdvance {
            // 既に予約があればキャンセル
            pendingAdvance?.cancel()
            let work = DispatchWorkItem {
                DispatchQueue.main.async {
                    // 実行直前に自動遷移がまだ有効か確認する（ユーザーが途中でオフにした可能性があるため）
                    if quizSettings.model.autoAdvance {
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
        // 回答せずに解答を表示：selectedID をダミーで埋めて解説表示・次へ可能に
        selectedID = UUID() // どの選択肢にも一致しない ID
        questionCount += 1
        // 成績（不正解として記録）
        wordScoreStore.recordResult(itemID: item.id, correct: false)
        // 学習ログ（gaveUp として記録）
        let now = Date()
        let rt = max(0.05, now.timeIntervalSince(questionShownAt ?? now))
        scheduler.record(itemID: item.id, result: .gaveUp, responseTime: rt, now: now)

        if quizSettings.model.autoAdvance {
            pendingAdvance?.cancel()
            let work = DispatchWorkItem {
                DispatchQueue.main.async {
                    if quizSettings.model.autoAdvance {
                        self.next()
                    }
                }
            }
            pendingAdvance = work
            DispatchQueue.main.asyncAfter(deadline: .now() + autoAdvanceDelay, execute: work)
        }
    }

    private func next() {
        guard selectedID != nil else { return }
        // 自動遷移予約があればキャンセルして二重実行を防止
        pendingAdvance?.cancel()
        pendingAdvance = nil
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
        let threshold = max(0.0, min(1.0, quizSettings.model.successThreshold))
        if successRate >= threshold {
            // 次のセットへ（ローテーションのため直前セットを記録）
            lastBatchItemIDs = lastPickedItems.map { $0.id }
            batchStart += batchSize
            batchAttempts = 0
            if batchStart >= order.count {
                // 全て完了
                finished = true
                // 保存
                var settings = quizSettings.model
                settings.selectedCSV = currentCSV.name // 現在のCSV名を結果に刻む
                let result = QuizResult(total: questionCount, correct: score, settings: settings)
                scoreStore.addResult(result)
                return
            }
            prepareBatch()
        } else {
            // しきい値未達成: 繰り返し（上限3回）
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
                    let resultSettings: QuizSettingsModel = {
                        var s = quizSettings.model
                        s.selectedCSV = currentCSV.name // 現在のCSV名を結果に刻む
                        return s
                    }()
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

    // 自動最適化用関数は廃止
}

#Preview {
    NavigationStack {
        QuizView()
            .environmentObject(QuizSettings())
            .environmentObject(ScoreStore())
            .environmentObject(WordScoreStore())
            .environmentObject(CurrentCSV.shared)
    }
}
