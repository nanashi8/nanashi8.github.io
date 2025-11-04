# SimpleWord 包括的仕様書

**作成日**: 2025-10-25  
**バージョン**: 2.0  
**プロジェクト**: SimpleWord - 適応型学習システム搭載の単語学習アプリ

---

## 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [アーキテクチャ](#アーキテクチャ)
3. [主要機能](#主要機能)
4. [データモデル](#データモデル)
5. [学習アルゴリズム](#学習アルゴリズム)
6. [ファイル構成](#ファイル構成)
7. [API仕様](#api仕様)
8. [UI/UX仕様](#uiux仕様)
9. [データ永続化](#データ永続化)
10. [テスト戦略](#テスト戦略)

---

## プロジェクト概要

### 目的
SimpleWordは、脳科学と記憶理論に基づく適応型学習アルゴリズムを搭載した、効率的な単語学習を実現するiOSアプリケーションです。

### 主な特徴
- **適応型学習**: 個々のユーザーの学習進捗に応じて最適な出題順序を自動決定
- **記憶定着段階管理**: 6段階の記憶定着レベル（未学習→習熟済み）で進捗を可視化
- **バッチ学習**: 効率的な短期集中学習を実現するバッチシステム
- **詳細な成績管理**: CSV別・単語別の成績を永続化し、長期的な学習進捗を追跡
- **柔軟なカスタマイズ**: 分野・難易度・学習モードなど多彩なフィルタ機能

### 技術スタック
- **言語**: Swift 5.9+
- **フレームワーク**: SwiftUI, Combine
- **最小対応OS**: iOS 15.0
- **開発環境**: Xcode 15+
- **アーキテクチャ**: Feature-First / Vertical Slice Architecture

---

## アーキテクチャ

### 設計原則

#### 1. Feature-First / Vertical Slice Architecture
機能ごとに垂直方向でコードを分割し、関連するすべてのレイヤー（UI、ロジック、データ）を同一ディレクトリに配置します。

```
Features/
├── Quiz/              # クイズ機能
│   ├── Views/         # UI層
│   ├── Logic/         # ビジネスロジック
│   └── Models/        # データモデル
└── Study/             # 学習管理機能
    ├── Domain/        # ドメインモデル
    ├── Logic/         # 学習アルゴリズム
    └── Data/          # データアクセス
```

#### 2. 責務分離
- **View**: 表示とユーザー操作のみを担当
- **Store**: 状態管理と永続化を担当
- **Repository**: データアクセスを抽象化
- **Scheduler**: 学習ロジックを集約

#### 3. 単一責任の原則
各コンポーネントは1つの明確な責務のみを持ちます。例：
- `QuestionCardView`: 問題カードの表示のみ
- `AdaptiveScheduler`: 出題スケジューリングのみ
- `WordScoreStore`: 単語別成績の管理のみ

---

## 主要機能

### 1. クイズ機能（QuizView）

#### 概要
CSV形式の単語リストから問題を生成し、4択形式で出題します。適応型学習アルゴリズムにより、ユーザーの習熟度に応じた最適な出題を実現します。

#### 機能詳細

##### 出題システム
- **バッチ学習**: 設定されたバッチサイズ（デフォルト10問）ごとに出題
- **適応型出題**: `AdaptiveScheduler`により優先度の高い単語を自動選択
- **繰り返し学習**: 記憶段階に応じて同じ単語を適切な回数繰り返し出題
- **ラウンドロビン配置**: 同じ単語が連続しないように分散配置

##### 回答フィードバック
- **即座のフィードバック**: 選択と同時に正誤を表示
- **アニメーション効果**: 合格数と総出題数が増加時に光るエフェクト
- **語源表示**: 回答後、すべての選択肢の語源を常時表示
- **自動進行**: 正解時に自動的に次の問題へ進む（設定により有効化）

##### ナビゲーション
- **前へ/次へボタン**: 問題間を自由に移動
- **履歴管理**: 過去に出題された問題を記録し、戻る機能を実現

##### 記憶定着度表示
- **6段階の進捗バー**: 各記憶段階の単語数を視覚化
- **習熟率表示**: 全体の習熟度をパーセンテージで表示
- **段階別カウント**: 未学習から習熟済みまでの分布を表示

#### 主要コンポーネント

```swift
QuizView.swift (1100行)
├── QuestionCardView        // 問題カード表示
├── ChoiceCardView          // 選択肢カード表示
├── DontKnowCardView        // 分からないボタン
├── QuizStatisticsView      // 統計情報表示
├── QuizNavigationButtonsView // ナビゲーションボタン
└── MemoryProgressView      // 記憶定着度進捗表示
```

#### 状態管理

```swift
// データ状態
@State private var items: [QuestionItem] = []          // 全問題
@State private var order: [QuestionItem] = []          // 出題順序
@State private var pool: [QuestionItem] = []           // 現在バッチ
@State private var currentItem: QuestionItem? = nil    // 現在の問題

// スコア管理
@State private var score: Int = 0                      // 累積正解数
@State private var questionCount: Int = 0              // 累積出題数
@State private var batchCorrect: Int = 0               // バッチ正解数

// アニメーション
@State private var shouldAnimatePassedCount: Bool = false
@State private var shouldAnimateTotalCount: Bool = false

// 記憶定着度
@State private var memoryStatistics: [MemoryStage: Int] = [:]
```

#### デバッグフラグ

段階的な機能有効化のためのフラグ：

```swift
private let enableMemoryTracking = false      // 記憶定着度追跡
private let enableAdaptiveScheduling = false  // 適応型スケジューリング
```

### 2. 出題設定機能（QuizSettingsView）

#### 概要
クイズの詳細な設定を行う画面です。CSV選択、フィルタ条件、学習モード、各種機能の有効化を設定できます。

#### 設定項目

##### CSV選択
- 使用するCSVファイルを選択
- Documents ディレクトリとBundleの両方から読み込み可能

##### フィルタ設定
- **分野フィルタ**: 複数選択可能（数学、理科、英語など）
- **難易度フィルタ**: 複数選択可能（初級、中級、上級など）

##### 出題パラメータ
- **出題数**: 1回のクイズセッションでの総問題数
- **バッチサイズ**: 一度に出題する問題数（デフォルト10）
- **合格率**: バッチ通過に必要な正答率（デフォルト70%）
- **繰り返し回数**: 各単語の出題回数（デフォルト1、記憶段階により自動調整）

##### 学習モード
- **通常モード**: バランス型の学習
- **復習モード**: 短期・中期記憶を重点的に復習
- **補習モード**: 習熟していない単語を集中学習

##### 機能切替
- **ランダム出題**: 出題順序をランダム化
- **タイマー有効**: 制限時間を設定（デフォルト60秒）
- **音声読み上げ**: 問題の音声読み上げ
- **自動進行**: 正解時に自動的に次の問題へ

#### データモデル

```swift
struct QuizSettingsModel: Codable {
    var selectedCSV: String?
    var selectedFields: [String]
    var difficulties: [String]
    var repeatCount: Int
    var successThreshold: Double
    var autoAdvance: Bool
    var questionsPerBatch: Int
    var lowAccuracyThreshold: Double
    var maxLowAccuracyRatio: Double
    var learningMode: LearningMode
    // ... その他の設定
}
```

### 3. 成績表示機能

#### 概要
学習結果を多角的に分析・表示する機能群です。

#### 主要画面

##### ScoreView（成績切り替え画面）
- CSV別成績と単語別成績の切り替え
- タブインターフェースで直感的な操作

##### QuizResultsByCSVView（CSV別成績）
- CSVファイルごとの学習履歴
- 正答率、出題数、正解数の表示
- 時系列での成績推移

##### QuizResultsDetailView（CSV詳細）
- 特定CSVの詳細な統計情報
- グラフによる視覚化
- 学習傾向の分析

##### WordScoresView（単語別成績）
- 個別の単語ごとの成績
- 正答率、出題回数、連続正解数
- ソート・フィルタ機能

### 4. CSV管理機能（CSVManagerView）

#### 概要
単語リスト（CSVファイル）の管理を行います。

#### 機能
- **CSV一覧表示**: 利用可能なすべてのCSVを表示
- **削除**: 不要なCSVを削除
- **インポート**: 外部からCSVを取り込み
- **エクスポート**: CSVを外部に書き出し
- **プレビュー**: CSVの内容をアプリ内で確認

### 5. 単語一覧機能（NavigatorView）

#### 概要
選択したCSVの全単語を一覧表示します。

#### 機能
- **全単語表示**: CSVの全エントリを表示
- **検索**: 単語の検索機能
- **フィルタ**: 分野・難易度でフィルタリング
- **詳細表示**: 単語をタップして詳細情報を表示
- **ファイル監視**: CSVの変更を自動検知して再読み込み

### 6. ID管理機能（IDMapAdminView）

#### 概要
単語のID整合性を管理する管理者向け機能です。

#### 機能
- **ID生成**: 新規単語のUUID生成
- **整合性チェック**: 重複IDや不正なIDの検出
- **修復**: 問題のあるIDを自動修復
- **バックアップ**: 修復前の状態を自動保存

---

## データモデル

### 1. QuestionItem（問題データ）

単語1つ分のすべての情報を保持します。

```swift
struct QuestionItem: Identifiable, Codable {
    let id: UUID                    // 一意識別子
    let term: String                // 語句（問題文）
    let reading: String             // 読み・発音
    let meaning: String             // 意味（正解）
    let etymology: String           // 語源・解説
    let relatedWordsCSV: String     // 関連語（CSV形式）
    let relatedFieldsCSV: String    // 関連分野（CSV形式）
    let difficulty: String          // 難易度
    
    // 計算プロパティ
    var relatedWords: [String]      // 関連語の配列
    var relatedFields: [String]     // 関連分野の配列
}
```

#### CSVフォーマット（2025-10-27更新）

**列数**: 7列固定  
**ヘッダ行**: 必須（1行目）

**中学英会話.csv**:
```
語句,発音（カタカナ）,和訳,語源等解説（日本語）,関連語（英語）と意味（日本語）,関連分野（日本語）,難易度
```

**中学古典単語.csv**:
```
語句,読み（ひらがな）,意味,語源等解説（日本語）,関連語と意味,関連分野,難易度
```

**列の対応**:
- 1列目 → `term` (語句)
- 2列目 → `reading` (読み・発音)
- 3列目 → `meaning` (意味・和訳)
- 4列目 → `etymology` (語源等解説)
- 5列目 → `relatedWordsCSV` (関連語、セミコロン区切り)
- 6列目 → `relatedFieldsCSV` (関連分野、セミコロン区切り)
- 7列目 → `difficulty` (難易度)

**発音表示の特殊ルール**:
- 2列目のヘッダに「発音」または「カタカナ」が含まれる場合、回答後の選択肢カードで語句の後ろに発音を括弧付きで表示します
- 例: `Hello! (ハロー)`
- それ以外の場合（「読み」「ひらがな」など）は、独立した行として表示します

### 2. StudyRecord（学習履歴）

単語ごとの学習履歴と出題間隔を管理します。

```swift
struct StudyRecord: Codable, Identifiable {
    let id: UUID                    // QuestionItem.idと一致
    var firstSeenAt: Date?          // 初回出題日時
    var lastSeenAt: Date?           // 最終出題日時
    var nextDueAt: Date             // 次回出題予定日時
    var interval: TimeInterval      // 出題間隔（秒）
    
    var totalAttempts: Int          // 総試行回数
    var correctCount: Int           // 正解回数
    var wrongCount: Int             // 誤答回数
    
    var correctStreak: Int          // 連続正解数
    var wrongStreak: Int            // 連続誤答数
    var alternationCount: Int       // 正誤交代回数
    var lastOutcome: ReviewOutcome? // 最後の結果
    
    var smoothedAccuracy: Double    // EWMA正答率（0.0-1.0）
    var avgResponseTime: Double     // EWMA応答時間（秒）
    
    var mastered: Bool              // 習熟済みフラグ
    var trailingWindow: [Bool]      // 直近の正解履歴
    var masteryWindowSize: Int      // 習熟判定ウィンドウサイズ
    
    var ease: Double                // 容易度（1.1-3.0）
}
```

### 3. MemoryStage（記憶段階）

記憶の定着段階を表現します。

```swift
enum MemoryStage: String, Codable {
    case unseen         // 未学習
    case initial        // 初回接触（1-2回）
    case shortTerm      // 短期記憶（3-5回、30秒-5分間隔）
    case midTerm        // 中期記憶（6-10回、1時間-1日間隔）
    case longTerm       // 長期記憶（11回以上、1日以上間隔）
    case mastered       // 習熟済み（連続5回正解＆高精度）
    
    var displayName: String
    var description: String
    var recommendedInterval: ClosedRange<TimeInterval>
    var recommendedRepetitions: Int
    func priority(for mode: LearningMode) -> Double
}
```

### 4. LearningMode（学習モード）

学習の目的に応じたモードを定義します。

```swift
enum LearningMode: String, Codable {
    case normal         // 通常モード
    case review         // 復習モード
    case remediation    // 補習モード
    
    var displayName: String
}
```

### 5. ReviewOutcome（回答結果）

単語に対する回答結果を表現します。

```swift
enum ReviewOutcome: String, Codable {
    case correct    // 正解
    case wrong      // 誤答
    case gaveUp     // 分からない
}
```

---

## 学習アルゴリズム

### 1. 適応型スケジューリング（AdaptiveScheduler）

#### 目的
ユーザーの学習履歴を分析し、最も効果的な出題順序を決定します。

#### アルゴリズム概要

##### 優先度スコア計算

各単語に対して以下の要素を組み合わせて優先度スコアを計算：

```swift
final = dueFactor * accFactor * intervalFactor * attemptScore 
        * troubleFactor * masteredPenalty * easeFactor 
        * (1.0 + (1.0 - recallEstimate)) 
        * forgettingBoost * alternationBoost
```

**要素の詳細:**

1. **dueFactor**: 期日要因
   - `1.0 + max(0.0, dueDelta) / 3600.0`
   - 期日を過ぎた単語ほど優先度が高い

2. **accFactor**: 正答率要因
   - `1.0 + (1.0 - smoothedAccuracy) * 1.5`
   - 正答率が低い単語ほど優先度が高い

3. **intervalFactor**: 間隔要因
   - `1.0 / max(interval, 1.0)`
   - 短い間隔の単語ほど優先度が高い

4. **attemptScore**: 試行回数要因
   - `1.0 / max(totalAttempts + 1, 1.0)`
   - 出題回数が少ない単語ほど優先度が高い

5. **troubleFactor**: トラブル要因
   - `1.0 + wrongStreak * 0.15 + alternationCount * 0.05`
   - 連続誤答や正誤交代が多い単語ほど優先度が高い

6. **masteredPenalty**: 習熟ペナルティ
   - 習熟済み: `0.25`、未習熟: `1.0`
   - 習熟済みの単語は優先度を下げる

7. **easeFactor**: 容易度要因
   - `1.0 / max(ease, 1.1)`
   - 難しい単語ほど優先度が高い

8. **recallEstimate**: 想起確率推定
   - `exp(-timeSinceLast / max(interval, 1.0))`
   - 忘却曲線に基づく想起しにくさ

9. **forgettingBoost**: 忘却傾向ブースト
   - `1.0 + (1.1 - globalForgetting)`
   - ユーザー全体の忘却傾向を反映

10. **alternationBoost**: 交互傾向ブースト
    - `1.0 + globalAlternationBoost`
    - 正誤が交互に現れる傾向を反映

#### バッチスケジューリング

```swift
func scheduleNextBatch(itemIDs: [UUID], count: Int) -> [UUID]
```

1. 各単語の優先度スコアを計算
2. スコア降順でソート
3. 上位`count`件を選択して返す

### 2. 記憶定着追跡（MemoryConsolidationTracker）

#### 目的
各単語の記憶段階を判定し、学習モードに応じた最適なフィルタリングを行います。

#### 記憶段階の判定ロジック

```swift
static func determine(from record: StudyRecord) -> MemoryStage {
    // 習熟済み判定
    if record.mastered && record.smoothedAccuracy >= 0.9 
       && record.correctStreak >= 5 {
        return .mastered
    }
    
    let attempts = record.totalAttempts
    let interval = record.interval
    
    if attempts == 0 { return .unseen }
    if attempts <= 2 { return .initial }
    if attempts <= 5 || interval < 300 { return .shortTerm }
    if attempts <= 10 || interval < 86400 { return .midTerm }
    return .longTerm
}
```

#### 学習モード別フィルタリング

```swift
func filter(itemIDs: [UUID], for mode: LearningMode, limit: Int) -> [UUID]
```

各単語に対して：
1. 記憶段階を判定
2. 学習モードに応じた基本優先度を設定
3. 正答率・誤答連続・期日超過で補正
4. 優先度順にソートして上位を返す

### 3. 間隔反復アルゴリズム（StudyRecord.apply）

#### 目的
SuperMemo 2（SM-2）アルゴリズムを基にした間隔更新ロジックです。

#### 容易度（ease）の更新

```swift
let easeDelta = 0.06 * (Double(quality) - 3.0)
ease = clamp(ease + easeDelta, 1.1, 3.0)
```

- **quality**: 1-5の品質スコア
  - 5: 速く正答
  - 4: 正答
  - 3: 基準
  - 2: 誤答
  - 1: 分からない（放棄）

#### 出題間隔の更新

##### 正解時
```swift
let streakBonus = min(3, correctStreak)
let growth = (1.2 + 0.12 * Double(streakBonus)) 
             * ease * pace * forget * (1.0 - altPenalty)
interval *= growth
```

- 連続正解ボーナスで成長率を増加
- 容易度（ease）で個人差を反映
- ユーザーペース（pace）で全体的な学習速度を調整
- 忘却係数（forget）で忘れやすさを反映
- 交互ペナルティで不安定な学習を抑制

##### 誤答時
```swift
let wrongPower = min(4, wrongStreak)
interval = max(minInterval, interval * pow(0.5, Double(wrongPower)) * forget)
```

- 連続誤答で指数的に間隔を短縮
- 最小間隔（15秒）以下にはならない

### 4. 学習分析（LearningAnalytics）

#### 目的
全ユーザーの学習履歴から学習傾向を分析します。

#### 計算される指標

```swift
struct LearningProfile {
    let paceFactor: Double          // 学習ペース（0.6-1.6）
    let forgettingFactor: Double    // 忘却傾向（0.75-1.05）
    let alternationBoost: Double    // 正誤交互傾向（0.0-0.2）
}
```

##### paceFactor（学習ペース）
- 全単語の平均間隔から計算
- 短い間隔 → ペースが速い（factor > 1.0）
- 長い間隔 → ペースが遅い（factor < 1.0）

##### forgettingFactor（忘却傾向）
- 全単語の平均正答率から計算
- 高正答率 → 忘れにくい（factor > 1.0）
- 低正答率 → 忘れやすい（factor < 1.0）

##### alternationBoost（交互傾向）
- 正誤が交互に現れる割合を計算
- 高い値 → 不安定な学習パターン

---

## ファイル構成

### プロジェクトルート

```
SimpleWord/
├── .copilot/                           # AI作業効率化ドキュメント
│   ├── README.md
│   ├── structure-map.md
│   ├── quick-ref.md
│   ├── changelog.md
│   ├── deprecated-patterns.md
│   ├── components/
│   ├── prompts/
│   └── scripts/
├── .github/
│   └── workflows/
│       └── code-quality.yml
├── SimpleWord.xcodeproj/
├── SimpleWord/                         # アプリ本体
├── SimpleWordTests/                    # ユニットテスト
├── SimpleWordUITests/                  # UIテスト
├── Resources/                          # 同梱CSV
├── docs/                               # プロジェクトドキュメント
├── Tools/                              # スクリプト・ツール
├── Appearance/                         # 外観設定
├── README.md
├── ADAPTIVE_LEARNING_GUIDE.md
├── DEPRECATION_GUIDE.md
├── TEST_GUIDE.md
└── .swiftlint.yml
```

### SimpleWord/（アプリ本体）

```
SimpleWord/
├── App/
│   └── SimpleWordApp.swift             # アプリエントリーポイント
├── Config/
│   └── AppConfiguration.swift          # アプリ設定
├── Features/                           # 機能別モジュール
│   ├── Quiz/
│   │   ├── Views/
│   │   │   ├── QuizView.swift          # クイズ画面（1100行）
│   │   │   ├── MemoryProgressView.swift
│   │   │   ├── QuizResultsByCSVView.swift
│   │   │   ├── QuizResultsDetailView.swift
│   │   │   └── LearningModeRecommendationView.swift
│   │   └── WordManagement/
│   └── Study/
│       ├── Domain/
│       │   ├── StudyRecord.swift       # 学習履歴モデル
│       │   ├── MemoryStage.swift       # 記憶段階モデル
│       │   └── ReviewOutcome.swift     # 回答結果モデル
│       ├── Logic/
│       │   ├── AdaptiveScheduler.swift # 適応型スケジューラ
│       │   └── LearningAnalytics.swift # 学習分析
│       └── Data/
│           └── FileStudyProgressRepository.swift
├── Models/
│   ├── QuestionItem.swift              # 問題データモデル
│   └── QuizResult.swift                # クイズ結果モデル
├── Stores/                             # 状態管理
│   ├── QuizSettings.swift              # 出題設定
│   ├── QuizSettingsStore.swift
│   ├── ScoreStore.swift                # CSV別成績
│   ├── WordScoreStore.swift            # 単語別成績
│   └── CurrentCSV.swift                # 現在のCSV
├── Views/                              # 画面
│   ├── ContentView.swift               # メインナビゲーション
│   ├── QuizSettingsView.swift          # 出題設定画面
│   ├── CSVManagerView.swift            # CSV管理画面
│   ├── NavigatorView.swift             # 単語一覧画面
│   ├── ScoreView.swift                 # 成績画面
│   ├── WordScoresView.swift            # 単語別成績画面
│   ├── IDMapAdminView.swift            # ID管理画面
│   └── QuestionDetailView.swift        # 単語詳細画面
├── QuizComponents/                     # クイズ用UIコンポーネント
│   ├── QuestionCardView.swift          # 問題カード
│   ├── ChoiceCardView.swift            # 選択肢カード
│   ├── DontKnowCardView.swift          # 分からないボタン
│   ├── QuizStatisticsView.swift        # 統計表示
│   └── QuizNavigationButtonsView.swift # ナビゲーションボタン
├── Services/                           # サービス層
│   ├── CSVLoader.swift                 # CSV読み込み
│   └── FileWatcher.swift               # ファイル監視
├── Utils/                              # ユーティリティ
│   ├── FileUtils.swift                 # ファイル操作
│   ├── IDFactory.swift                 # ID生成
│   └── StyleGuide.swift                # UIスタイル定義
├── Persistence/
│   └── PersistenceController.swift     # データ永続化
└── docs/仕様書/                        # 機能別仕様書
    ├── 00_編集ガイド.md
    ├── 01_クイズ機能_仕様書.md
    ├── 02_出題設定_仕様書.md
    ├── 03_問題集管理_CSV_仕様書.md
    ├── 04_ナビゲーター機能_仕様書.md
    ├── 05_成績表示_仕様書.md
    ├── 06_IDマップ管理_仕様書.md
    ├── 07_CSV編集_仕様書.md
    ├── 08_外観_仕様書.md
    ├── 09_出題ロジック_仕様書.md
    └── 99_ファイル索引.md
```

---

## API仕様

### AdaptiveScheduler

適応型学習のコアロジックを提供します。

#### イニシャライザ

```swift
init(repo: StudyProgressRepository = FileStudyProgressRepository(), 
     analytics: LearningAnalytics = LearningAnalytics())
```

#### メソッド

##### record
```swift
func record(itemID: UUID, 
            result: ReviewOutcome, 
            responseTime: TimeInterval, 
            now: Date = Date())
```

**説明**: ユーザーの回答を記録し、StudyRecordを更新します。

**パラメータ**:
- `itemID`: 問題のUUID
- `result`: 回答結果（.correct/.wrong/.gaveUp）
- `responseTime`: 応答時間（秒）
- `now`: 現在時刻（テスト用）

##### scheduleNextBatch
```swift
func scheduleNextBatch(itemIDs: [UUID], count: Int) -> [UUID]
```

**説明**: 優先度順に出題する問題IDのリストを返します。

**パラメータ**:
- `itemIDs`: 候補となる問題IDの配列
- `count`: 返す問題数

**戻り値**: 優先度順にソートされた問題IDの配列

### MemoryConsolidationTracker

記憶定着度の追跡と分析を提供します。

#### イニシャライザ

```swift
init(repo: StudyProgressRepository = FileStudyProgressRepository())
```

#### メソッド

##### stages
```swift
func stages(for itemIDs: [UUID]) -> [UUID: MemoryStage]
```

**説明**: 各問題の記憶段階を取得します。

**パラメータ**:
- `itemIDs`: 問題IDの配列

**戻り値**: 問題IDと記憶段階のマッピング

##### filter
```swift
func filter(itemIDs: [UUID], 
            for mode: LearningMode, 
            limit: Int) -> [UUID]
```

**説明**: 学習モードに応じて優先度付けされた問題IDを返します。

**パラメータ**:
- `itemIDs`: 候補となる問題IDの配列
- `mode`: 学習モード
- `limit`: 返す最大数

**戻り値**: 優先度順の問題ID配列

##### statistics
```swift
func statistics(for itemIDs: [UUID]) -> [MemoryStage: Int]
```

**説明**: 記憶段階別の統計を取得します。

**パラメータ**:
- `itemIDs`: 問題IDの配列

**戻り値**: 各記憶段階の問題数

### StudyProgressRepository

学習進捗データへのアクセスを抽象化します。

#### プロトコル

```swift
protocol StudyProgressRepository {
    func load(id: UUID) -> StudyRecord
    func save(_ record: StudyRecord)
    func loadAll() -> [StudyRecord]
    func delete(id: UUID)
    func clear()
}
```

#### 実装: FileStudyProgressRepository

```swift
class FileStudyProgressRepository: StudyProgressRepository {
    private let fileURL: URL
    private var cache: [UUID: StudyRecord]
    
    init()
    func load(id: UUID) -> StudyRecord
    func save(_ record: StudyRecord)
    func loadAll() -> [StudyRecord]
    func delete(id: UUID)
    func clear()
}
```

---

## UI/UX仕様

### カラースキーム

#### 記憶段階の色

```swift
switch stage {
case .unseen:    Color.gray     // 灰色
case .initial:   Color.blue     // 青
case .shortTerm: Color.cyan     // 水色
case .midTerm:   Color.yellow   // 黄色
case .longTerm:  Color.orange   // オレンジ
case .mastered:  Color.green    // 緑
}
```

#### 正誤の色

- 正解: `.green`
- 誤答: `.red`
- 未回答: `.secondary`

#### アニメーション色

- 合格数増加: `.green`（1.3倍スケール、スプリングアニメーション）
- 総出題数増加: `.orange`（1.3倍スケール、スプリングアニメーション）

### レイアウト

#### 問題カード
- 最大幅: `.infinity`
- パディング: 水平方向16pt
- 角丸: 12pt
- 背景色: `.secondarySystemGroupedBackground`

#### 選択肢カード
- 高さ: 自動（内容に応じる）
- パディング: 16pt
- 角丸: 10pt
- タップフィードバック: スケールアニメーション

#### 統計表示
- フォント: `.caption`
- 配置: 水平方向に均等配置
- アニメーション: 1.2秒のスプリングアニメーション

### アニメーション仕様

#### 合格数・総出題数の光るエフェクト

```swift
.scaleEffect(shouldAnimate ? 1.3 : 1.0)
.animation(.spring(response: 0.4, dampingFraction: 0.5), value: shouldAnimate)
```

- **持続時間**: 1.2秒
- **タイプ**: スプリングアニメーション
- **スケール**: 1.0 → 1.3 → 1.0

#### 選択肢のフィードバック

```swift
.scaleEffect(isPressed ? 0.95 : 1.0)
.animation(.easeInOut(duration: 0.1), value: isPressed)
```

### アクセシビリティ

- すべてのボタンにアクセシビリティラベルを設定
- 動的タイプ（Dynamic Type）に対応
- VoiceOverサポート
- カラーコントラスト比を4.5:1以上に維持

---

## データ永続化

### ストレージ構造

#### UserDefaults
- **用途**: 設定情報の保存
- **キー**:
  - `quizSettings`: QuizSettingsModel
  - `appearance`: 外観設定

#### FileManager（Documents Directory）
- **用途**: CSVファイルと学習履歴の保存
- **構造**:
  ```
  Documents/
  ├── CSVs/                      # インポートされたCSV
  │   ├── 中学英単語.csv
  │   ├── 高校単語.csv
  │   └── ...
  ├── StudyProgress/             # 学習進捗
  │   └── records.json
  ├── Scores/                    # CSV別成績
  │   └── scores.json
  └── WordScores/                # 単語別成績
      └── word_scores.json
  ```

### データフォーマット

#### StudyProgress（学習進捗）

```json
{
  "records": [
    {
      "id": "UUID文字列",
      "firstSeenAt": "2025-10-25T10:00:00Z",
      "lastSeenAt": "2025-10-25T11:00:00Z",
      "nextDueAt": "2025-10-25T12:00:00Z",
      "interval": 3600.0,
      "totalAttempts": 5,
      "correctCount": 4,
      "wrongCount": 1,
      "correctStreak": 2,
      "wrongStreak": 0,
      "alternationCount": 1,
      "lastOutcome": "correct",
      "smoothedAccuracy": 0.85,
      "avgResponseTime": 3.5,
      "mastered": false,
      "trailingWindow": [true, true, false, true, true],
      "masteryWindowSize": 5,
      "ease": 1.8
    }
  ]
}
```

#### WordScores（単語別成績）

```json
{
  "scores": {
    "UUID文字列": {
      "itemID": "UUID文字列",
      "attempts": 10,
      "correct": 8,
      "accuracy": 0.8,
      "lastAttempt": "2025-10-25T11:00:00Z"
    }
  }
}
```

#### QuizResults（クイズ結果）

```json
{
  "results": [
    {
      "id": "UUID文字列",
      "date": "2025-10-25T11:00:00Z",
      "csvName": "中学英単語.csv",
      "total": 20,
      "correct": 16,
      "settings": {
        "learningMode": "normal",
        "numberOfQuestions": 20,
        "questionsPerBatch": 10
      }
    }
  ]
}
```

### バックアップ戦略

#### 自動バックアップ
- **タイミング**: アプリ起動時、終了時
- **保存先**: `Documents/Backups/`
- **保持期間**: 最新10世代

#### 手動バックアップ
- CSV単位でのエクスポート機能
- 全データの一括エクスポート

---

## テスト戦略

### ユニットテスト

#### 対象
- AdaptiveScheduler
- MemoryConsolidationTracker
- StudyRecord
- LearningAnalytics

#### テストケース例

```swift
// AdaptiveSchedulerTest.swift
func testRecordCorrectAnswer() {
    let scheduler = AdaptiveScheduler(repo: MockRepository())
    let itemID = UUID()
    
    scheduler.record(itemID: itemID, result: .correct, responseTime: 2.0)
    
    let record = scheduler.repo.load(id: itemID)
    XCTAssertEqual(record.correctCount, 1)
    XCTAssertTrue(record.interval > 30)
}

func testScheduleNextBatch() {
    let scheduler = AdaptiveScheduler(repo: MockRepository())
    let itemIDs = [UUID(), UUID(), UUID()]
    
    let result = scheduler.scheduleNextBatch(itemIDs: itemIDs, count: 2)
    
    XCTAssertEqual(result.count, 2)
}
```

### 統合テスト

#### 対象
- QuizView全体のフロー
- CSV読み込みから出題まで
- 成績保存の整合性

### UIテスト

#### 対象
- クイズの回答フロー
- 設定画面の操作
- ナビゲーション

#### テストケース例

```swift
// QuizViewUITest.swift
func testAnswerQuestion() {
    let app = XCUIApplication()
    app.launch()
    
    app.buttons["クイズを始める"].tap()
    app.buttons["選択肢1"].tap()
    
    XCTAssertTrue(app.staticTexts["正解"].exists)
}
```

### パフォーマンステスト

#### 測定項目
- CSV読み込み時間（10,000単語で < 1秒）
- 問題生成時間（< 0.1秒）
- スケジューリング時間（1000問で < 0.5秒）

---

## まとめ

この仕様書は、SimpleWordプロジェクトの現在の状態を正確に記述したものです。この仕様書を読むことで、プロジェクトの全体像を把握し、開発を再開することができます。

### 次のステップ

1. **段階的な機能有効化**: `QuizView.swift`のデバッグフラグを段階的に有効化
2. **テストの拡充**: ユニットテストのカバレッジを80%以上に
3. **UI改善**: ユーザーフィードバックに基づく改善
4. **新機能追加**: 学習グラフ、達成バッジなど

### 参考ドキュメント

- `.copilot/README.md` - AI作業ガイド
- `ADAPTIVE_LEARNING_GUIDE.md` - 適応型学習の詳細
- `DEPRECATION_GUIDE.md` - 非推奨構文対策
- `TEST_GUIDE.md` - テストガイド
- `SimpleWord/docs/仕様書/` - 機能別詳細仕様

---

**最終更新**: 2025-10-25  
**バージョン**: 2.0  
**著者**: GitHub Copilot
