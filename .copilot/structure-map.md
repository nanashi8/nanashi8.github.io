# SimpleWord アーキテクチャマップ

最終更新: 2025年10月18日

## プロジェクト概要
語句を効率的に学習するためのクイズアプリケーション。直感的に操作できる分かりやすい画面レイアウトで、軽快かつ安定した動作を目指す。

---

## コアファイル

### Views
- **QuizView.swift** (1,100行超) - クイズメイン画面 ⚠️ 分割対象
- **QuestionDetailView.swift** - 単語詳細表示画面
- **SettingsView.swift** - 設定画面
- **ScoreHistoryView.swift** - 成績履歴画面

### Models
- **QuestionItem.swift** - 単語データモデル
- **QuizModels.swift** - Choice構造体など共通モデル
- **QuizResult.swift** - クイズ結果モデル
- **QuizSettingsModel.swift** - クイズ設定モデル

### Stores (永続化・状態管理)
- **QuizSettings.swift** - クイズ設定管理 (@Published)
- **ScoreStore.swift** - CSV別成績データ永続化
- **WordScoreStore.swift** - 単語別成績管理
- **CurrentCSV.swift** - 現在選択中のCSV管理

### Services
- **CSVLoader.swift** - CSV読み込みサービス
- **AdaptiveScheduler.swift** - 学習スケジューリング
- **FileStudyProgressRepository.swift** - 学習進捗の永続化

### UI Components
- **SectionCard.swift** - セクションカード共通コンポーネント
- **SectionHeader.swift** - セクションヘッダー
- **DifficultyBadge.swift** - 難易度バッジ
- **TagCapsule.swift** - タグ表示カプセル

---

## QuizView の依存関係

```
QuizView (1,100行超)
├─ @EnvironmentObject
│  ├─ QuizSettings          # クイズ設定
│  ├─ ScoreStore            # CSV別成績
│  ├─ WordScoreStore        # 単語別成績
│  └─ CurrentCSV            # 現在のCSV
│
├─ Services
│  ├─ CSVLoader             # データ読み込み
│  ├─ AdaptiveScheduler     # 学習スケジューリング
│  └─ FileStudyProgressRepository  # 進捗管理
│
├─ Models
│  ├─ QuestionItem          # 単語データ
│  ├─ Choice                # 選択肢データ
│  └─ QuizResult            # クイズ結果
│
└─ UI Components
   ├─ SectionCard
   ├─ SectionHeader
   ├─ DifficultyBadge
   └─ TagCapsule
```

---

## QuizView v1.2.0 完全実装 (2025-10-19)

### ファイル構成
```
SimpleWord/
├── QuizView.swift (264行) ✅ 完全実装
│   ├── QuizOption (fileprivate) - 選択肢モデル
│   ├── State管理 - 問題、選択肢、スコア、バッチ、UI
│   ├── View構成
│   │   ├── quizContentView
│   │   ├── statsView
│   │   ├── progressView
│   │   ├── choicesSection
│   │   └── finishedView
│   └── ロジック
│       ├── start(), prepareBatch(), prepareNextQuestion()
│       ├── generateChoices(), handleChoice()
│       └── startTimer(), restart()
├── QuestionCardView.swift - 問題表示
├── ChoiceCardView.swift - 選択肢表示
├── DontKnowCardView.swift - 分からないカード
└── QuizStatisticsView.swift - 統計表示
```

### 実装された全機能
1. ✅ 適応型学習（WordScoreStore連携）
2. ✅ バッチ管理（繰り返し、段階的進行）
3. ✅ アニメーション（光るエフェクト）
4. ✅ タイマー機能（制限時間、カウントダウン）
5. ✅ 音声再生（AVSpeechSynthesizer）
6. ✅ 自動遷移（設定による制御）
7. ✅ CSV統合（CSVLoader）
8. ✅ 完了画面（結果サマリー）

### ビルド状態
- ✅ BUILD SUCCEEDED
- ✅ エラーなし
- ✅ 警告なし

---

## 新しいアーキテクチャ (v1.1.0~)

### Features/Quiz/ ディレクトリ構造
```
Features/Quiz/
├── Models/
│   └── QuizState.swift         # 状態管理モデル (NEW)
├── Logic/
│   └── QuizEngine.swift        # ビジネスロジック (NEW)
└── Views/
    └── (今後追加予定)
```

### QuizState モデル
- `QuestionState`: 問題管理（items, pool, currentItem等）
- `ChoiceState`: 選択肢管理（choices, selectedID等）
- `ScoreState`: スコア管理（score, questionCount等）
- `BatchState`: バッチ管理（batchSize, remediationMode等）
- `UIState`: UI状態（アニメーション、タイマー）

### QuizEngine サービス
- `loadItems()`: CSV読み込み
- `prepareBatch()`: バッチ準備
- `prepareNextQuestion()`: 問題準備
- `generateChoices()`: 選択肢生成
- `processAnswer()`: 回答処理

---

## QuizView の現在の構造 (v1.0.0 - 暫定)

### @State 変数（簡易実装）
- `items: [QuestionItem]` - 全問題アイテム
- `order: [QuestionItem]` - シャッフルされた全アイテム順序
- `pool: [QuestionItem]` - 現在のバッチで繰り返し分を含む出題プール
- `poolIndex: Int` - 現在のプール内インデックス
- `currentItem: QuestionItem?` - 現在の問題
- `choices: [Choice]` - 選択肢リスト
- `correctAnswerID: UUID?` - 正解のID
- `selectedID: UUID?` - 選択された選択肢ID
- `dontKnowChoiceID: UUID?` - 分からないカードのID
- `score: Int` - 累積正解数
- `questionCount: Int` - 累積出題数
- `finished: Bool` - 終了フラグ
- `batchSize: Int` - バッチサイズ
- `batchCorrect: Int` - バッチ内正解数
- `batchAttempts: Int` - バッチ試行回数
- `remediationMode: Bool` - 補修モードフラグ
- `expandedIDs: Set<UUID>` - 展開された選択肢ID
- `shouldAnimatePassedCount: Bool` - 合格数アニメーション
- `shouldAnimateTotalCount: Bool` - 総出題数アニメーション
- その他タイマー・音声関連の状態

### 主要メソッド
- `start()` - 初期処理
- `loadCSVAndStart()` - CSV読み込みと開始
- `prepareBatch()` - バッチ準備（約150行）
- `prepareQuestion()` - 問題準備
- `select(_ choiceID: UUID)` - 選択肢選択時の処理
- `giveUp()` - 分からないボタンの処理
- `next()` - 次の問題へ
- `evaluateBatch()` - バッチ評価（約80行）
- `restart()` - 再開処理

### 内部View構造体
- `Choice` - 選択肢データ（→ QuizModels.swiftに移動済み）
- `ChoiceView` - 選択肢カード表示（約120行）
- `DontKnowView` - 分からないカード表示（約40行）

---

## 分割計画

### Phase 1: View コンポーネント分割（優先度: 高）
1. **QuizStatisticsView.swift** (50行程度)
   - CSV名、学習モード、正答率、合格数、総出題数の表示
   - アニメーション効果の制御

2. **QuestionCardView.swift** (80行程度)
   - 問題カードの表示
   - 難易度バッジ、読み、正答率の表示

3. **ChoiceCardView.swift** (120行程度)
   - 選択肢カードの表示と解説の展開/折りたたみ
   - 回答後の色変更・アイコン表示

4. **DontKnowCardView.swift** (40行程度)
   - 分からないカードの表示

5. **QuizNavigationButtonsView.swift** (30行程度)
   - 前へ・次へボタン

### Phase 2: ViewModel 分割（優先度: 中）
6. **QuizViewModel.swift** (400行程度)
   - ビジネスロジックの集約
   - CSV読み込み、バッチ準備、問題作成、評価ロジック
   - アニメーショントリガーの管理

### Phase 3: 結果表示分割（優先度: 低）
7. **QuizResultView.swift** (50行程度)
   - クイズ終了時の結果表示

---

## 分割時の注意点

### @EnvironmentObject の引き継ぎ
- 各Viewで必要な@EnvironmentObjectを個別に受け取る
- QuizViewからは`.environmentObject()`で渡す

### @Binding の使用
- アニメーション状態など、親子間で共有する状態は@Bindingで渡す
- `shouldAnimatePassedCount`、`shouldAnimateTotalCount`など

### ViewModelパターン
- `@StateObject`でQuizViewが保持
- 子Viewには`@ObservedObject`で渡す
- ロジックはすべてViewModelに集約

### テスタビリティ
- ViewModelは単体テスト可能な構造にする
- 依存性注入を考慮（CSVLoader、Schedulerなど）

---

## 現在の問題点

1. **QuizViewが1,100行超** - 可読性・保守性が低下
2. **ビジネスロジックとViewが混在** - テストが困難
3. **@State変数が多すぎる** - 状態管理が複雑
4. **型推論の負荷が高い** - コンパイル時間が長い

---

## 分割後の期待効果

1. **可読性向上**: 各ファイルが100行以下になり理解しやすい
2. **保守性向上**: 変更時の影響範囲が明確
3. **再利用性**: 各コンポーネントを他の画面でも利用可能
4. **テスタビリティ**: ViewModelを単体テストできる
5. **コンパイル時間短縮**: ファイルサイズ減少で型推論が高速化
6. **AI作業効率化**: 必要なファイルのみを参照できる

---
