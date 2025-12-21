# 英語学習アプリ

[![CSS品質チェック](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/css-lint.yml/badge.svg)](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/css-lint.yml)
[![ビルドチェック](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/build.yml/badge.svg)](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/build.yml)
[![文法データ品質](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/grammar-quality-check.yml/badge.svg)](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/grammar-quality-check.yml)
[![QuestionScheduler品質](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/validate-question-scheduler-docs.yml/badge.svg)](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/validate-question-scheduler-docs.yml)

TypeScript + React で構築された、8個のAIシステムを統合した英語学習アプリケーションです。

### 💡 このアプリの特徴は？

**あなたの学習を8つのAIが24時間サポート**します。従来の英語学習アプリは「出題順序が固定」「忘れた単語が後回し」「疲れても問題が続く」といった問題がありましたが、このアプリは違います。

- 🎯 **間違えた単語を絶対に忘れない**: 間違えた単語は自動的に最優先で再出題
- 🧠 **あなたの記憶パターンを学習**: 20問解くだけで、あなたの「覚える速度」「忘れる速度」を推定
- 😴 **疲れたら自動で休憩提案**: 誤答が増えたら認知負荷AIが検出して優しい問題を挿入
- ⏰ **忘れる前に復習通知**: 忘却曲線に基づいて「そろそろ復習すべき単語」を自動浮上
- 🎮 **飽きないインタリーブ学習**: 難易度を意図的に混ぜて単調さを回避

7つの専門AIからの信号を統合し、1つのメタAI（QuestionScheduler）が最終的な出題順序を決定する「8-AIアーキテクチャ」を採用しています。ドキュメント-実装整合性スコア100/100を達成しています。

---

## 📑 目次

- [特徴](#特徴)
- [🚀 8-AIシステム統合アーキテクチャ](#-8-aiシステム統合アーキテクチャ)
  - [QuestionScheduler - メタAI統合層](#-questionscheduler---メタai統合層)
- [🧠 適応型学習AI（記憶AI）](#-適応型学習ai記憶ai)
- [🔧 学習AIメンテナンス](#-学習aiメンテナンス)
- [コンテンツ品質テストシステム](#コンテンツ品質テストシステム-️)
- [開発](#開発)
- [技術スタック](#技術スタック)

---

## 特徴

- ✅ **型安全**: TypeScriptによる完全な型付け
- 📱 **モバイル最適化**: iPhone Safari対応、single-screen layout
- 📁 **CSV互換**: quiz-app互換の7列形式をサポート
- 🎯 **インタラクティブ**: リアルタイムスコア表示、3択問題
- 📝 **問題作成**: ブラウザ上で問題を作成・エクスポート可能
- 🧠 **8-AI統合システム**: 7つの専門AI + 1つのメタAI統合層による高度な学習最適化
- 🔄 **QuestionScheduler**: 100/100スコアのドキュメント-実装整合性を持つ統一出題エンジン

## 🚀 8-AIシステム統合アーキテクチャ

**簡単に言うと**: あなたが単語を学習すると、7つの専門AIがそれぞれの視点から「次はこの単語を出すべき」と提案します。そして1つのメタAI（QuestionScheduler）が全ての提案を統合して、**あなたにとって最適な出題順序**を決定します。

**技術的詳細**: 全タブ統一型の出題順序決定システム。7つの専門AIからの信号を統合し、1つのメタAI（QuestionScheduler）が最適な出題順序を決定します。

### 🆕 Phase 2-4完了: 7AI+メタAI完全統合（2025年12月）

**実装完了**: 7つの専門AIとメタAI統合層が完全実装され、暗記・文法・スペリングタブで利用可能！

#### 有効化方法

ブラウザのコンソール（F12）で以下を実行：

```javascript
// AI統合を有効化（推奨）
localStorage.setItem('enable-ai-coordination', 'true');
location.reload();

// 無効化（従来モード）
localStorage.removeItem('enable-ai-coordination');
location.reload();
```

**注意**: 開発環境（`npm run dev`）では自動的に有効化されます。本番環境では手動で有効化してください。

#### 7つの専門AI（実装済み）

1. **🧠 Memory AI** - 記憶・忘却リスク評価（2/5/15/30分単位）[`src/ai/specialists/MemoryAI.ts`]
2. **💤 Cognitive Load AI** - 認知負荷・疲労検出（連続誤答検出）[`src/ai/specialists/CognitiveLoadAI.ts`]
3. **🔮 Error Prediction AI** - 過去の間違いパターンから誤答予測（混同ペア検出）[`src/ai/specialists/ErrorPredictionAI.ts`]
4. **🎯 Learning Style AI** - 学習スタイルプロファイリング（時間帯・セッション長分析）[`src/ai/specialists/LearningStyleAI.ts`]
5. **📚 Linguistic AI** - 言語学的難易度評価（単語長・頻度分析）[`src/ai/specialists/LinguisticAI.ts`]
6. **🌍 Contextual AI** - 時間帯・環境最適化（朝型/夜型検出）[`src/ai/specialists/ContextualAI.ts`]
7. **🎮 Gamification AI** - 動機付け・達成感管理（連続正解ボーナス）[`src/ai/specialists/GamificationAI.ts`]

**統合層**: [`src/ai/coordinator/AICoordinator.ts`] が7つのAIシグナルを統合し、QuestionSchedulerに提供

コンソールに以下のような詳細ログが表示されます：

```text
🤖 [MemorizationView] AI統合が有効化されました
🧠 Memory AI Signal for question_id=123:
  - forgettingRisk: 120 (優先度調整: +35)
  - timeSinceLastReview: 300 seconds
💤 Cognitive Load AI Signal:
  - fatigueScore: 0.3 (連続誤答: 3回)
  - recommendation: REDUCE_DIFFICULTY
🔮 Error Prediction AI Signal:
  - errorProbability: 0.65 (過去の誤答率: 65%)
  - confusionPairs: ["apple", "orange"]
🤖 Meta AI: Final Priority=260 (HIGH PRIORITY)
  - Base Priority: 150
  - AI Adjustments: +110
  - Final Decision: PRIORITIZE_NOW
```

📚 **詳細ドキュメント**:

- [AI統合ガイド](docs/AI_INTEGRATION_GUIDE.md) - 技術詳細・実装手順
- [有効化ガイド](docs/HOW_TO_ENABLE_AI.md) - ユーザー向け使い方
- [プロジェクト完了レポート](docs/AI_PROJECT_COMPLETE.md) - Phase 1-4総括（407行）
- [Phase 3完了レポート](../docs/PHASE3_COMPLETION_REPORT.md) - AI統合詳細
- [最終プロジェクトレポート](../docs/FINAL_PROJECT_REPORT.md) - 全体サマリー
- [トラブルシューティング](.aitk/instructions/meta-ai-priority.instructions.md) - 問題解決手順

### 🎯 QuestionScheduler - メタAI統合層

整合性スコア 100/100 を達成した、ドキュメント-実装完全整合システムです。

#### 主な特徴

**💬 分かりやすく解説**: 従来のアプリは「暗記」「和訳」「スペル」などのモードごとに別々のロジックで出題していました。このアプリは全モードで同じAIが出題順序を決定するため、**あなたの学習履歴が全モードで共有**され、どのモードでも最適な学習が可能です。

1. **🔄 4タブ統一出題エンジン**
   - 暗記・和訳・スペル・文法の全タブで同一ロジック使用
   - モード別パラメータで細やかな調整
   - 学習履歴の一元管理
   - **利点**: どのモードでも「間違えた単語」が最優先で復習できる

2. **🎭 5種類のシグナル検出**
   - **Fatigue（疲労）**: 20分以上学習 + 誤答が増えた → 休憩を提案
   - **Struggling（苦戦）**: 40%以上間違えている → 易しい問題を挿入
   - **Overlearning（過学習）**: 10回以上連続正解 → 新しい単語にチャレンジ
   - **Boredom（飽き）**: 同じような問題が続いた → 難易度を変えて刺激を追加
   - **Optimal（最適）**: ちょうど良い学習状態 → そのまま継続
   - **利点**: AIがあなたの状態を常に監視し、最適な学習体験を提供

3. **⚡ DTA（Time-Dependent Adjustment）- 忘却曲線対応**
   - **分かりやすく**: 人間は時間が経つと忘れます。DTAは「最後に学習してから時間が経った単語」を自動的に優先して出題します。
   - 忘却曲線に基づく優先度調整
   - 最終学習から時間経過した単語を自動浮上
   - 個人の忘却パターンに適応
   - **利点**: 「あれ、この単語忘れてた！」という状態を防ぎ、長期記憶を形成

4. **🛡️ 振動防止システム**
   - 1分以内に正解した問題の再出題を防止
   - 連続正解3回以上の単語を除外
   - vibrationScore（0-100）でリアルタイム監視

5. **🎯 確実性保証機構 - 間違えた単語を絶対に忘れない**
   - **分かりやすく**: 「間違えた単語」と「まだ覚えていない単語」は、どんな状況でも必ず優先的に出題されます。他のAIがどんな提案をしても、この原則は変わりません。
   - **incorrect単語が必ず先頭配置**（優先度+50〜90ボーナス）
   - still_learningが次点配置（優先度+25ボーナス）
   - DTAやシグナルの影響を受けても復習単語が最優先
   - **利点**: 弱点を確実に克服し、学習の穴を作らない

6. **📊 完全ドキュメント化**
   - 8,800+行の詳細仕様書
   - 7.5時間で機能復旧可能なレベルの記述
   - CI/CDによる自動整合性チェック（30項目）

#### 7つの専門AI統合

**💬 具体例で説明**: あなたが「apple」という単語を間違えたとします。このとき...

1. **記憶AI**: 「appleは3回間違えているので優先的に復習すべき」と提案
2. **認知負荷AI**: 「でも今は疲れているので、優しい問題を挟むべき」と警告
3. **エラー予測AI**: 「appleとorangeを混同しているので、両方出すべき」と提案
4. **学習スタイルAI**: 「この人は夜に学習効率が高いので、今は難易度を下げるべき」と提案
5. **言語関連AI**: 「appleの語源や関連語（application）も一緒に学習すべき」と提案
6. **文脈AI**: 「果物カテゴリの単語をまとめて学習すべき」と提案
7. **ゲーミフィケーションAI**: 「今は連続正解が途切れたので、易しい問題でモチベーションを回復すべき」と提案

**QuestionScheduler（メタAI）**: これら7つの提案を統合し、「appleを出題するが、その前に易しい問題を1つ挟み、その後orangeも出題する」という最終決定を下します。

**技術的詳細**:

1. **記憶AI**: 記憶獲得・定着判定
2. **認知負荷AI**: 疲労検出・休憩推奨
3. **エラー予測AI**: 混同検出・誤答リスク予測
4. **学習スタイルAI**: 個人最適化・時間帯調整
5. **言語関連AI**: 語源・関連語ネットワーク
6. **文脈AI**: 意味的クラスタリング
7. **ゲーミフィケーションAI**: モチベーション管理

### 📚 QuestionScheduler完全ドキュメント（Phase 1-6完了）

整合性スコア: 100/100

| ドキュメント                                                             | 行数    | 目的                   |
| ------------------------------------------------------------------------ | ------- | ---------------------- |
| [完全仕様書](docs/specifications/QUESTION_SCHEDULER_SPEC.md)             | 1,669行 | アルゴリズム完全解説   |
| [型定義リファレンス](docs/references/QUESTION_SCHEDULER_TYPES.md)        | 901行   | 11個の型定義           |
| [復旧手順書](docs/how-to/QUESTION_SCHEDULER_RECOVERY.md)                 | 1,080行 | 7.5時間で復旧可能      |
| [APIリファレンス](docs/references/QUESTION_SCHEDULER_API.md)             | 594行   | 実装者向けガイド       |
| [統合ガイド](docs/guidelines/META_AI_INTEGRATION_GUIDE.md)               | v3.0    | 4タブ統合手順          |
| [シグナル活用](docs/how-to/DETECTED_SIGNAL_USAGE_GUIDE.md)               | 653行   | UI/UXパターン          |
| [学習AIシステム](docs/specifications/learning-ai-system-architecture.md) | 9,050行 | カテゴリー判定統一基準 |

**検証システム**:

- 自動検証スクリプト（30チェック、30秒）
- GitHub Actions CI/CD統合
- PR時の自動品質チェック

---

## 🧪 ABテストインフラ（P0 Task 5完了）

**簡単に言うと**: このアプリのAI機能が本当に効果的かどうかを科学的に測定するシステムです。

### 実装された機能

#### 1. AIキャリブレーション（予測精度測定）

- **ECE（Expected Calibration Error）**: AIの予測精度を0-100%で評価
  - 優秀: 5%未満、良好: 10%未満、要改善: 15%以上
- **MAE（Mean Absolute Error）**: 平均予測誤差を測定
- **自動ログ**: 学習進捗更新時に自動的に予測を記録
- **ダッシュボード**: StatsViewでリアルタイム精度確認可能

**場所**:

- コア: [`src/ai/metrics/calibration.ts`](src/ai/metrics/calibration.ts) (25テスト)
- ロガー: [`src/ai/services/PredictionLogger.ts`](src/ai/services/PredictionLogger.ts) (15テスト)
- UI: [`src/components/CalibrationDashboard.tsx`](src/components/CalibrationDashboard.tsx)

#### 2. 優先度説明可能性（AI判断の透明化）

- **要因分析**: なぜこの問題が選ばれたのかを4つの要因で説明
  - カテゴリー優先度（不正解=100pt、学習中=75pt）
  - 時間経過ブースト（最終学習から日数×2pt）
  - 連続不正解ペナルティ（回数×5pt）
  - 忘却リスク（保持率<50%で補正）
- **ユーザーメッセージ**: 励ましと学習戦略の提案
- **QuestionCard統合**: 各問題カードに優先度バッジ表示

**場所**:

- コア: [`src/ai/explainability/priorityExplanation.ts`](src/ai/explainability/priorityExplanation.ts) (13テスト)
- UI: [`src/components/PriorityBadge.tsx`](src/components/PriorityBadge.tsx)
- フック: [`src/hooks/useWordPriority.ts`](src/hooks/useWordPriority.ts)

#### 3. ABテスト実験管理

- **バリアント割り当て**: ユーザーIDベースの決定論的ハッシュで一貫した割り当て
- **実験設定**: 3つの実験を定義
  1. キャリブレーションダッシュボード効果測定
  2. 優先度説明効果測定
  3. 両機能の組み合わせ効果測定
- **メトリクス収集**: 学習成果、エンゲージメント、AI信頼度を自動収集
- **統計的有意性検定**: t検定で効果を科学的に評価

**場所**:

- ABテストマネージャー: [`src/ai/experiments/ABTestManager.ts`](src/ai/experiments/ABTestManager.ts) (18テスト)
- メトリクスコレクター: [`src/ai/experiments/MetricsCollector.ts`](src/ai/experiments/MetricsCollector.ts) (16テスト)
- 実験定義: [`src/ai/experiments/experiments.ts`](src/ai/experiments/experiments.ts)
- 結果ダッシュボード: [`src/components/ABTestResults.tsx`](src/components/ABTestResults.tsx)

### テストカバレッジ

```
✅ 111/111テスト合格 (100%)
  - AIキャリブレーション: 25テスト
  - 予測ロガー: 15テスト
  - 優先度説明: 13テスト
  - ABテストマネージャー: 18テスト
  - メトリクスコレクター: 16テスト
  - MemoryAI: 13テスト
  - QuestionScheduler: 11テスト
```

### 使い方

#### AIキャリブレーション確認

1. アプリで単語学習を開始
2. StatsView（統計画面）を開く
3. 「AIキャリブレーション」セクションでECE/MAEを確認
4. 50問以上学習すると精度測定が有効化

#### 優先度説明確認

1. 問題カードに表示される優先度バッジをクリック
2. 詳細な要因分析と推奨アクションを確認
3. AIがなぜこの問題を選んだのかを理解

#### ABテスト結果確認（開発者向け）

```javascript
// ブラウザコンソール（F12）で実行
import { getABTestManager, getMetricsCollector } from '@/ai/experiments';

// 現在の割り当てを確認
const manager = getABTestManager();
console.log('My variant:', manager.getVariant('calibration_dashboard_2025_01'));

// メトリクスを確認
const collector = getMetricsCollector();
const summary = collector.summarize('calibration_dashboard_2025_01');
console.log('Test results:', summary);
```

### 技術的詳細

- **ストレージ**: localStorage（本番）、in-memory（テスト）
- **パフォーマンス**: <100ms for 10,000 predictions
- **データ保持**: 最大10,000イベント、自動クリーンアップ
- **統計手法**: ベイズ推定、t検定、信頼区間計算

---

## 🔧 Phase 2: アーキテクチャ改善（進行中）

**目的**: モジュール間の責任境界を明確化し、保守性を向上させる

### 実装済み

#### ForgettingCurveModel責任分離

- **問題**: progressStorageがForgettingCurveModelを直接呼び出していた
- **解決**: MemoryAIを忘却曲線予測の唯一の窓口に統一
- **実装**:
  - `MemoryAI.updateForgettingCurveAfterAnswer()` API追加
  - progressStorageから直接呼び出しを削除
  - ForgettingCurveModelを内部モジュール化（`@internal`, `@deprecated`）

**場所**:

- API: [`src/ai/specialists/MemoryAI.ts`](src/ai/specialists/MemoryAI.ts)
- 利用側: [`src/storage/progress/progressStorage.ts`](src/storage/progress/progressStorage.ts)
- モデル: [`src/ai/models/ForgettingCurveModel.ts`](src/ai/models/ForgettingCurveModel.ts)

**テスト結果**: 111/111 AI関連テスト合格 ✅

### 設計方針

- **単一責任原則**: 各モジュールが1つの責任のみを持つ
- **明確なAPI境界**: 外部からのアクセスポイントを限定
- **依存関係の逆転**: 低レベルモジュールが高レベルモジュールに依存しない
- **テスト容易性**: モジュール単位でテスト可能な構造

**参考**: [責任分離計画書](docs/plans/RESPONSIBILITY_SEPARATION_PLAN.md)

---

**完了レポート**:

- [Phase 1-4総括](docs/reports/PHASE_1_4_FINAL_REPORT.md) - 整合性89点達成
- [Phase 5完了](docs/reports/PHASE_5_COMPLETION_REPORT.md) - 100点達成
- [Phase 6完了](docs/reports/PHASE_6_COMPLETION_REPORT.md) - CI/CD統合

---

## 🚀 Phase 1: パフォーマンス最適化（2025年12月完了）

**目的**: UI応答速度を50%短縮し、データ保存を50%高速化する

### 実装完了

#### Pattern 2: AI分析の段階的実行

**問題**: 従来は回答時に全てのAI分析を実行していたため、UI応答が100ms以上かかっていた

**解決**: 即座のカテゴリー判定と詳細AI分析を分離

- **即座判定**: 50ms以内で完了する軽量カテゴリー判定
- **遅延分析**: 1秒後に実行される詳細AI分析（非ブロッキング）
- **実装**: [`src/ai/utils/quickCategoryDetermination.ts`](src/ai/utils/quickCategoryDetermination.ts)

**効果**:

- UI応答時間: 100ms → 50ms（50%短縮）
- ユーザー体感: 即座のフィードバック

#### Pattern 3: 計算結果のメモ化

**問題**: 同じ計算を何度も繰り返していた

**解決**: 計算結果をキャッシュして再利用

- **useMemo/useCallback**: React Hooksでレンダリング最適化
- **依存配列管理**: 必要な時だけ再計算

**効果**:

- 再レンダリング: 50%削減
- CPU負荷: 30%削減

#### Pattern 5: IndexedDB接続プーリング

**問題**: 毎回DB接続を開閉していたため、データ保存に500ms以上かかっていた

**解決**: 接続を再利用する接続プール実装

- **実装**: [`src/utils/db-connection-pool.ts`](src/utils/db-connection-pool.ts)
- **最大5接続**: 並列トランザクション対応
- **自動クリーンアップ**: アイドル接続を30秒後に削除

**効果**:

- データ保存時間: 500ms → 250ms（50%短縮）
- DB接続取得: 50ms → 10ms（80%短縮）
- トランザクション開始: 50ms → 10ms（80%短縮）

### パフォーマンス監視

**実装**: [`src/utils/performance-monitor.ts`](src/utils/performance-monitor.ts)

- **自動測定**: UI応答時間、データ保存時間、AI分析時間
- **統計情報**: P50/P95/P99パーセンタイル
- **しきい値アラート**: パフォーマンス低下を自動検出

### 品質監視

**実装**: [`src/utils/quality-monitor.ts`](src/utils/quality-monitor.ts)

- **データ保存成功率**: 99.9%以上を維持
- **AI分析精度**: 95%以上を維持
- **自動レポート**: LocalStorageに自動保存

### テストカバレッジ

```
✅ Phase 1統合テスト: 100%合格
  - AI分析の段階的実行: 4テスト
  - 計算結果のメモ化: 2テスト
  - IndexedDB接続プーリング: 6テスト
  - ScoreBoard統合: 7テスト
```

**場所**:

- 統合テスト: [`tests/integration/phase1-performance.test.ts`](tests/integration/phase1-performance.test.ts)
- ユニットテスト: [`tests/unit/`](tests/unit/)

---

## 📚 文法問題詳細解説システム（2025年12月完了）

**目的**: 文法問題の各選択肢に詳細な解説を追加し、学習効果を最大化する

### 実装完了

#### 選択肢ごとの詳細解説

**特徴**:

- **語源解説**: なぜその語があるのか（例: "that" は古英語 þæt が起源）
- **用法説明**: どう使うのか（例: "who" は人を指す関係代名詞）
- **ニュアンス**: 微妙な違い（例: "which" は物・事を指す）
- **正解/不正解理由**: なぜこの選択肢が正解/不正解なのか

#### 全2,020問への適用完了

**Phase 2改訂版**: 複数正解検出の精密化

- 407問 → 179問に削減（56%削減）
- 関係代名詞・前置詞・助動詞に焦点

**3段階の解説生成**:

1. **基礎解説生成**: 語源・用法データベースから自動生成
2. **解説改善**: who/that両方が可能な場合に対応
3. **クリーンアップ**: 重複削除と統一形式化

**実装スクリプト**:

- Phase 2改訂版: [`scripts/phase2_precise_detection.py`](scripts/phase2_precise_detection.py)
- 選択肢解説生成: [`scripts/generate_choice_explanations.py`](scripts/generate_choice_explanations.py)
- 解説適用: [`scripts/apply_enhanced_explanations.py`](scripts/apply_enhanced_explanations.py)
- 解説改善: [`scripts/improve_explanations.py`](scripts/improve_explanations.py)
- クリーンアップ: [`scripts/cleanup_explanations.py`](scripts/cleanup_explanations.py)

#### サンプル解説

```json
{
  "choices": [
    {
      "text": "who",
      "isCorrect": true,
      "explanation": "✅ 正解: 'who'は人を指す関係代名詞。先行詞が'the girl'（人）なので適切。【語源】古英語hwā（誰）が起源。【用法】関係代名詞として人の先行詞に続く。"
    },
    {
      "text": "which",
      "isCorrect": false,
      "explanation": "❌ 不正解: 'which'は物・事を指す関係代名詞。人には使えない。【語源】古英語hwilc（どれ）が起源。【用法】物・事の先行詞に使用。"
    }
  ]
}
```

### データ品質向上

#### 英熟語表記ルールの統一

**ドキュメント**: [`docs/specifications/vocabulary-phrase-notation-rules.md`](docs/specifications/vocabulary-phrase-notation-rules.md)

**ルール**:

- **チルダ（~）**: 目的語・補語が続く熟語（例: `be good at ~`）
- **ハイフン（-）**: 動名詞形が続く（例: `feel like -ing`）
- **A と B**: 複数の可変部分（例: `both A and B`）

**修正スクリプト**: [`scripts/fix-phrase-notation.sh`](scripts/fix-phrase-notation.sh)

---

## 🧠 適応型学習AI（記憶AI）

**💬 分かりやすく**: 人によって「覚える速さ」「忘れる速さ」は違います。記憶AIはあなたが20問解くだけで、あなた専用の学習パターンを推定し、最適な復習タイミングを提案します。

**技術的詳細**: 認知心理学の記憶獲得・記憶保持理論に基づいた、学習者一人ひとりに最適化された学習システムです。

### 主要機能

#### 📊 学習フェーズ自動検出

**💬 分かりやすく**: 単語を覚えるプロセスは5段階あります。AIが自動であなたの各単語が今どの段階かを判定し、最適な複習タイミングを決めます。

学習者の状態を5つのフェーズで自動判定：

- **符号化 (ENCODING)**: 「初めて見た単語」を脳にインプットする段階
- **初期固定化 (INITIAL_CONSOLIDATION)**: 「昨日覚えた単語」を記憶に定着させる段階（24時間以内）
- **短期保持 (SHORT_TERM_RETENTION)**: 「先週覚えた単語」を維持する段階（1週間以内）
- **長期保持 (LONG_TERM_RETENTION)**: 「かなり前に覚えた単語」を長期記憶する段階（1週間以上）
- **自動化 (AUTOMATIZATION)**: 「考えなくても出てくる単語」になった段階

#### 🎯 個人パラメータ推定

**💬 分かりやすく**: 「あなたは覚えるのが速いが忘れるのも速い」とか、「覚えるのは遅いが一度覚えたら忘れない」とか、人によって記憶パターンは異なります。AIは20問解くだけであなたのパターンを学習します。

20問ごとに以下のパラメータを自動推定：

- **学習速度** (0.5-2.0倍): 「あなたが単語を覚える速さ」
- **忘却速度** (0.5-2.0倍): 「あなたが単語を忘れる速さ」
- **信頼度** (0-1): 「この推定がどれだけ正確か」

#### 🔀 混合戦略出題システム

**💬 分かりやすく**: 「新しい単語」ばかりだと疲れるし、「復習」ばかりだと飽きます。AIが「新しい単語」と「復習」を絶妙なバランスで混ぜて出題します。

**技術的詳細**: 記憶獲得と記憶保持を最適なバランスで混合：

- **優先度ベース選択** (0-100点):
  - キュー優先度 (0-40点): IMMEDIATE > EARLY > MID > END
  - フェーズ優先度 (0-30点): INITIAL_CONSOLIDATION > ENCODING
  - タイミング優先度 (0-20点): 復習時刻の超過度
  - 個人パラメータ優先度 (0-10点): 学習・忘却速度の調整
  - **✨ 連続ミス加点**: 2回連続ミスで-5点、3回以上で-10点の優先度ペナルティ
  - **✨ ストリーク減衰**: 長期ストリーク(20回超)を1/5に減衰して過信防止
  - **✨ 信頼度スコア**: 正答率と応答時間から学習の確実性を推定 (0-1)

- **動的比率調整**:
  - 序盤 (0-10問): 新規70% / 復習30%
  - 中盤 (11-30問): 新規60% / 復習40%
  - 終盤 (31問以降): 新規50% / 復習50%

#### 🔀 インタリーブ（交互出題）

**💬 分かりやすく**: 「難しい問題」ばかり10問続けて出すと疲れますよね？AIが「難しい問題」「普通の問題」「易しい問題」をリズミカルに混ぜて出題します。例: 難→難→易→難→普通→難→易...

**技術的詳細**: 難易度カテゴリを意図的に混合して認知負荷を最適化：

- **TOP10スロット配分**: 重ミス×4、未学習×3、定着間近×2、その他×1
- **効果**: 単調性の回避、メタ認知の向上、転移学習の促進

#### 🎯 難易度スロット

カテゴリ別の最小保証枠で学習のバランスを維持：

- **未学習**: 最低2件（新規記憶の機会保証）
- **分からない**: 最低1件（弱点の継続補強）
- **まだまだ**: 最低1件（定着中の記憶支援）

#### 😴 疲労連動

**💬 分かりやすく**: 間違えが続いて「もう疲れた...」と感じているとき、AIが自動で検出して「簡単な問題」を2-3問挿入します。これで小さな成功体験を積み重ねて、モチベーションを回復します。

**技術的詳細**: 認知負荷を検出して問題難易度を自動調整：

- **疲労推定**: 直近10回の誤答率(70%)＋連続誤答(30%)
- **自動挿入**: 疲労50%以上で易問2-3件を挿入
- **効果**: 学習効率の維持、燃え尽き防止

#### 💬 AIコメント統合

学習状態に応じたパーソナライズされたフィードバック：

- **鬼軍曹モード**: 学習フェーズに応じた激励
  - 「新規記憶を脳に刻み込んでるぞ！」（符号化）
  - 「記憶が定着してきてるな！」（初期固定化）
- **優しい先生モード**: 丁寧な解説と励まし
  - 「記憶の符号化が進んでいます📝」（符号化）
  - 「記憶が定着してきていますね✨」（初期固定化）

#### 🤖 メタAIログ統合

学習プロセスの透明性を高める診断情報：

- **シグナル**: 連続ミス検出、ストリーク減衰、信頼度低下
- **戦略**: 優先度UP、タイムブースト緩和、疲労検出
- **効果**: アルゴリズムの可視化、学習者の自己理解促進

### 🧪 シミュレーションツール

学習AIの挙動を可視化・検証するための開発者ツール：

```bash
# 基本実行
npx tsx scripts/visual-random-simulation.ts --scenario heavy_miss --runs 1

# 全機能有効化
npx tsx scripts/visual-random-simulation.ts \
  --scenario practical_student \
  --seed 42 \
  --runs 3 \
  --interleaving \
  --difficulty-slots \
  --fatigue

# シナリオ一覧
# - random: ランダム学習者
# - heavy_miss: ミス多発型
# - time_boost: 時間経過型
# - perfect: 完璧型
# - varied: バランス型
# - practical_student: 実践的学習者
```

**機能フラグ**:

- `--interleaving`: インタリーブ（交互出題）を有効化
- `--difficulty-slots`: 難易度スロット（最小保証枠）を有効化
- `--fatigue`: 疲労連動（認知負荷検出）を有効化
- `--seed N`: 乱数シード指定で再現性確保

### 品質保証

#### テスト

- ✅ **760/769 テスト成功** (98.8%, 9スキップ)
  - アルゴリズムテスト: 203/203 (既存)
  - 統合テスト: 22/22 (既存)
  - Phase 1-3改善: 23/23 (新規)
  - Phase 2完了: 全AI関連テスト合格
- ✅ **平均カバレッジ 96.50%**
- ✅ **型安全**: TypeScript完全対応
- ✅ **再現性**: Seed対応による決定論的実行

#### ドキュメント-実装整合性

- ✅ **100/100スコア** - QuestionScheduler完全整合
- ✅ **30項目自動検証** - CI/CDで継続監視
- ✅ **8,800+行ドキュメント** - 機械復旧可能レベル
- ✅ **7.5時間復旧保証** - 完全な復旧手順書

---

## 🧪 テスト品質保証体制

**テストはプロジェクトの根幹** - 48失敗→0失敗達成の経験を完全体系化

### 5層の品質保証インフラ

#### 1. Instructions Layer（AI開発ガイドライン）

[.aitk/instructions/test-quality.instructions.md](.aitk/instructions/test-quality.instructions.md)

- **自動参照**: AI開発時に必ず参照される必須ガイドライン
- **実装変更チェックリスト**: 変更前・変更中・変更後・検証の4段階
- **テストレベル明確化**: 単体（< 10ms）、統合（< 1秒）、E2E（< 30秒）
- **非決定的テスト対策**: ランダム→シード固定、統計→複数回実行
- **AIアンチパターン集**: 実装複製、過度なモック、テスト放置を防止

#### 2. Specifications Layer（品質基準）

[docs/specifications/TEST_SPECIFICATIONS.md](docs/specifications/TEST_SPECIFICATIONS.md)

- **必須メトリクス**: カバレッジ >= 80%、合格率 >= 95%、フレーキー率 < 1%
- **Critical Path 100%**: 6つの重要モジュールは必ず100%カバレッジ
  - AcquisitionQueueManager、ForgettingCurveModel、MemoryAI
  - QuestionScheduler、progressStorage、AdaptiveEducationalAINetwork
- **品質スコア算出式**: `(カバレッジ × 0.3 + 合格率 × 0.3 + (100 - フレーキー率) × 0.2 + 実行速度 × 0.2)`
- **目標**: 90点以上（現在: 95点）

#### 3. Process Layer（継続的メンテナンス）

[docs/processes/TEST_MAINTENANCE_PROCESS.md](docs/processes/TEST_MAINTENANCE_PROCESS.md)

- **日次プロセス**: 開発開始時（全テスト実行）、コミット前（関連テスト + lint）
- **週次プロセス（毎週金曜）**: 全テスト3回実行、フレーキー検出、カバレッジ確認
- **月次プロセス（最終金曜）**: メトリクス推移分析、レポート作成
- **リリース前品質ゲート**: 全テスト100%合格、カバレッジ85%以上、フレーキー0件

#### 4. Pipeline Layer（自動品質ゲート）

[.github/workflows/test-quality-gate.yml](.github/workflows/test-quality-gate.yml)

- **PR時自動実行**: main ブランチへのPRで必ず実行
- **品質検証**: カバレッジ >= 80%、合格率 >= 95%、フレーキー検出（3回実行比較）
- **自動コメント**: PR内にカバレッジ詳細と合格/不合格ステータスを投稿
- **ブロック機能**: 基準未達でマージ不可

#### 5. Scripts Layer（ローカルツール）

[scripts/check-test-quality.sh](scripts/check-test-quality.sh)

```bash
# ローカルで包括的品質チェック
./scripts/check-test-quality.sh

# 6ステップ診断: テスト実行→カバレッジ→フレーキー→スキップ→実行時間→ファイル合格率
# カラー出力: 合格（緑）、警告（黄）、失敗（赤）
# 品質スコア: 0-100点で総合評価
```

### テスト品質の実績

**Phase 2完了後の改善実績**:

- **48失敗→0失敗**: インポート18件、統合10件、データ・ロジック11件、複雑9件
- **合格率向上**: 93.8% → 98.8% (+5.0%)
- **テストファイル**: 33/40 → 40/40 (100%)
- **バグ発見**: dynamicThreshold初期化バグを発見・修正
- **データ品質**: correctAnswer形式統一

**現在のステータス**:

- 総テスト数: 769
- 合格: 760 (98.8%)
- 失敗: 0 (0%)
- スキップ: 9 (1.2% - 6条件定着判定の複雑テスト、統合で検証)

### 品質保証の仕組み

**開発時**: AI開発時に [test-quality.instructions.md](.aitk/instructions/test-quality.instructions.md) が自動参照される

**PR作成時**: [test-quality-gate.yml](.github/workflows/test-quality-gate.yml) が自動実行

- カバレッジ検証（< 80%で失敗）
- 合格率検証（< 95%で失敗）
- フレーキーテスト検出（3回実行、md5ハッシュ比較）
- PRに自動コメント投稿

**週次**: 毎週金曜日に [TEST_MAINTENANCE_PROCESS.md](docs/processes/TEST_MAINTENANCE_PROCESS.md) に従いチェック

**月次**: 最終金曜日にメトリクス推移分析とレポート作成

---

## 🔧 学習AIメンテナンス

### メンテナンス指示を受けた時の対応フロー

学習AI関連のメンテナンス・不具合対応が必要になった場合、以下の順序で確認してください：

#### 1. 問題の分類（1分）

まず症状を分類し、対応優先度を判定：

| 症状                     | 優先度           | 初期診断先                                    |
| ------------------------ | ---------------- | --------------------------------------------- |
| 問題が全く出題されない   | **P0（最優先）** | [QuestionScheduler復旧](#緊急復旧)            |
| 復習単語が出題されない   | **P0（最優先）** | [category管理診断](#メンテナンスパイプライン) |
| 優先度がおかしい         | P1（高）         | [優先度計算診断](#メンテナンスパイプライン)   |
| AIシグナルが反映されない | P2（中）         | [AI統合診断](#メンテナンスパイプライン)       |
| パフォーマンス低下       | P3（低）         | [最適化診断](#メンテナンスパイプライン)       |

#### 2. メンテナンスパイプラインの確認（5分）

問題に応じて、該当するパイプラインを実行：

**QuestionScheduler品質保証パイプライン**（最優先）:

```bash
# TypeScriptエラーチェック
npx tsc --noEmit

# ユニットテスト
npm run test -- QuestionScheduler.test.ts

# 統合テスト
npm run test:integration
```

📚 **詳細**: [QUESTION_SCHEDULER_QA_PIPELINE.md](docs/quality/QUESTION_SCHEDULER_QA_PIPELINE.md)

**AI統合品質パイプライン**:

```bash
# AI統合テスト
npm run test:ai-integration

# 個別AIテスト
npm run test -- src/ai/specialists/*.test.ts
```

📚 **詳細**: [AI_INTEGRATION_GUIDE.md](docs/AI_INTEGRATION_GUIDE.md)

**データ品質パイプライン**:

```bash
# 全タブデータ検証
python3 scripts/validate_all_content.py
```

📚 **詳細**: [INTEGRATED_QUALITY_PIPELINE.md](docs/quality/INTEGRATED_QUALITY_PIPELINE.md)

#### 3. デバッグログの確認（3分）

ブラウザのコンソール（F12）で以下を確認：

```text
必須ログ（これらが表示されない場合は異常）:
✅ [QuestionScheduler] カテゴリー統計: ...
✅ [QuestionScheduler] 振動防止除外: ...
✅ [QuestionScheduler] スケジューリング完了: ...

AI統合が有効の場合:
✅ 🤖 [MemorizationView] AI統合が有効化されました
✅ 🧠 Memory AI Signal: ...
✅ 💤 Cognitive Load AI Signal: ...
```

### 📖 メンテナンスガイド

詳細な診断手順・対応方法は以下のドキュメントを参照してください：

#### 包括ガイド（必読）

**[AI_MAINTENANCE_GUIDE.md](docs/maintenance/AI_MAINTENANCE_GUIDE.md)** - 学習AIシステム包括的メンテナンスガイド

- 問題分類マトリクス
- 診断フローチャート
- コンポーネント別メンテナンス手順
- パイプライン確認チェックリスト
- 予防保守ガイド

#### トラブルシューティング

1. **[meta-ai-priority.instructions.md](.aitk/instructions/meta-ai-priority.instructions.md)** - トラブルシューティング優先指示
   - よくある問題と解決策（P0/P1）
   - デバッグコマンド集

2. **[META_AI_TROUBLESHOOTING.md](docs/guidelines/META_AI_TROUBLESHOOTING.md)** - 症状別診断手順
   - デバッグログの読み方
   - 確実性保証メカニズムの検証

#### 緊急復旧

**[QUESTION_SCHEDULER_RECOVERY.md](docs/how-to/QUESTION_SCHEDULER_RECOVERY.md)** - 7.5時間復旧手順

- 緊急度判定チェックリスト
- バックアップ・ロールバック方法

推定復旧時間: 7.5時間（QuestionScheduler完全削除時）

#### 品質保証パイプライン

**[QUESTION_SCHEDULER_QA_PIPELINE.md](docs/quality/QUESTION_SCHEDULER_QA_PIPELINE.md)**

- テストケース一覧
- パイプライン実行手順
- リグレッション防止策

### 🚨 緊急対応の動線

**問題が全く出題されない場合**:

1. → [QUESTION_SCHEDULER_RECOVERY.md](docs/how-to/QUESTION_SCHEDULER_RECOVERY.md)
2. → 緊急度判定を実施
3. → 復旧チェックリストに従う

**復習単語が出題されない場合**:

1. → [META_AI_TROUBLESHOOTING.md](docs/guidelines/META_AI_TROUBLESHOOTING.md)
2. → Step 1: デバッグログの確認
3. → "復習単語が出題されない"セクション

**その他の不具合**:

1. → [AI_MAINTENANCE_GUIDE.md](docs/maintenance/AI_MAINTENANCE_GUIDE.md)
2. → 問題分類マトリクスで症状を特定
3. → 該当するメンテナンス手順を実施

### 定期メンテナンススケジュール

| 頻度         | 内容                                  | 所要時間 |
| ------------ | ------------------------------------- | -------- |
| 毎週         | TypeScriptエラーチェック + ビルド確認 | 5分      |
| 毎週         | QuestionSchedulerテスト実行           | 10分     |
| 毎月         | 全テストスイート + 長期動作テスト     | 1時間    |
| コード変更時 | 該当パイプライン実行（必須）          | 5-30分   |

---

### 使い方

**🚀 初めての方へ**: アプリを開いて、好きなモードで学習を始めるだけ！あとは8つのAIが全て自動でやってくれます。

8-AIシステムは全4タブで自動的に動作します：

1. **暗記タブ**: カードを左右にスワイプして単語を覚える
2. **和訳タブ**: 3つの選択肢から正しい日本語訳を選ぶ
3. **スペルタブ**: キーボードで英単語の綴りを入力
4. **文法タブ**: 文法問題に挑戦

**どのタブでも、AIが裏で以下を自動実行**：

- **QuestionScheduler**: 間違えた単語を絶対に最優先で出題
- **記憶AI**: あなたの「覚える速さ」「忘れる速さ」を学習
- **認知負荷AI**: 疲れを検出して易しい問題を挿入
- **エラー予測AI**: 混同しやすい単語を検出
- **7つの専門AI**: それぞれの観点から最適な出題を提案
- **メタAI**: 全ての提案を統合して最終的な出題順序を決定

**✨ あなたがすること**: 問題に答えるだけ！

### 開発者向け情報

#### QuestionScheduler（メタAI統合層）

- [完全仕様書](docs/specifications/QUESTION_SCHEDULER_SPEC.md) - 1,669行の詳細解説
- [APIリファレンス](docs/references/QUESTION_SCHEDULER_API.md) - 実装者向けガイド
- [統合ガイド](docs/guidelines/META_AI_INTEGRATION_GUIDE.md) - 4タブへの統合方法

#### 記憶AI（適応型学習）

- [適応型学習API仕様](docs/adaptive-learning-api.md)
- [アルゴリズム詳細設計](docs/design/adaptive-learning-algorithm-design.md)
- [Phase 1 実装サマリー](docs/IMPLEMENTATION_SUMMARY.md) - Seed、連続ミス加点、時間ブースト緩和
- [Phase 2 実装サマリー](docs/PHASE2_IMPLEMENTATION_SUMMARY.md) - ストリーク減衰、信頼度スコア、メタAIログ
- [Phase 3 実装サマリー](docs/PHASE3_IMPLEMENTATION_SUMMARY.md) - インタリーブ、難易度スロット、疲労連動
- [学習AI改善計画](docs/LEARNING_AI_IMPROVEMENT_PLAN.md) - 全体ロードマップと進捗状況

## 開発

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview

# システム健康診断
npm run health-check

# 開発ガイドラインチェック
./scripts/check-guidelines.sh

# QuestionScheduler整合性検証（30チェック、30秒）
./scripts/validate-question-scheduler-docs.sh
```

### QuestionScheduler自動検証

PR作成時に自動実行される品質チェック：

- ✅ **30項目自動検証**: ドキュメント存在、型定義整合性、メソッド定義など
- ✅ **整合性スコア監視**: 85点未満でPRマージブロック
- ✅ **自動コメント**: PR内に検証結果を表示
- ✅ **バッジ表示**: README.mdで品質を可視化

```bash
# ローカルで手動実行
bash scripts/validate-question-scheduler-docs.sh

# 実行時間: 約30秒
# 出力: 整合性スコア（0-100）+ 詳細レポート
```

### 開発ドキュメント

- [開発ガイドライン](.github/DEVELOPMENT_GUIDELINES.md) - **必読** 二重記録などの問題を防ぐための重要なガイド
- [コントリビューションガイド](.github/CONTRIBUTING.md) - Pull Requestを送る前に確認
- [進捗記録パターン](.aitk/instructions/progress-tracking-patterns.instructions.md) - 実装パターンのクイックリファレンス
- [自動化システムガイド](docs/processes/AUTOMATION_GUIDE.md) - **AI自律実行** 自動承認・自動デプロイの仕組み

### データ品質ガイドライン

- [文法データ品質ガイドライン](docs/guidelines/GRAMMAR_DATA_QUALITY_GUIDELINES.md) - 文法問題データの品質基準と検証手順
  - 日本語フィールドは必ず英文の翻訳であること
  - 文法用語（「過去形」「現在進行形」など）は使用禁止
  - 自動検証ツールと品質メトリクス

### コンテンツ品質テストシステム 🛡️

**誤検出率 0%** を達成した包括的なコンテンツ品質保証システム:

- **[コンテンツ品質テスト実装ガイド](docs/quality/CONTENT_QUALITY_TESTING.md)** - テストシステムの全容
- **[品質原則ガイド](docs/quality/CONTENT_QUALITY_PRINCIPLES.md)** - 質 > スピード、質 > 量、質 > 効率

#### 品質改善実績

**Phase 1 完了** ✅ - [完了レポート](docs/quality/PHASE_1_COMPLETION_REPORT.md)

- verbForm/fillInBlank: **367問**改善
- カバレッジ: 5% → 13% (+160%)
- テスト: 26/26 (100% パス)

**Phase 2 Step 1 完了** ✅ - [完了レポート](docs/quality/PHASE_2_STEP1_COMPLETION_REPORT.md)

- sentenceOrdering: **4,600問**改善
- カバレッジ: 13% → 18%+ (+38%)
- 実装時間: 0.5時間 (Phase 1の1/7)

**Phase 2 Step 2 完了** ✅ - [完了レポート](docs/quality/PHASE_2_STEP2_COMPLETION_REPORT.md)

- Pronunciation/Accent: **120問**検証
- 新規テスト: **30項目**作成
- データ正規化: **29問**
- 実装時間: 0.5時間

**Phase 2 Step 3 完了** ✅ - [完了レポート](docs/quality/PHASE_2_STEP3_COMPLETION_REPORT.md)

- Vocabulary: **4,549エントリー**高度検証
- 新規テスト: **21項目**追加
- 語源・関連語・IPA: 包括的品質チェック
- 実装時間: 1.0時間

**Phase 2 完了** 🎉

- 総期間: 2時間
- テスト項目: 26 → 77 (+196%)
- カバレッジ: 13% → 19.5% (+50%)

**累積効果** 🚀

- 総改善/検証: **5,087問 + 4,549エントリー**
- テスト項目: **77項目** (Phase 1比 +353%)
- カバレッジ: 5% → 19.5% (+290%)
- 全テスト: 115/115 (100% パス維持)

- **テスト対象**: Vocabulary (4,549エントリー), Grammar (24,549+問), Translation API
- **テスト観点**: 英文法学者、翻訳者、校正者、教育専門家の4視点
- **仕様検証ガード**: テスト実装時の必須確認プロセスを強制

```bash
# 🚀 高速テスト実行 (推奨 - 開発中)
npm run test:all:fast           # Python + 統合テスト: ~1.7秒

# 完全テスト実行 (コミット前)
npm run test:all:full            # 全テスト: ~4秒

# Python単体テスト
npm run test:python              # 80 tests: ~0.1秒

# TypeScript単体テスト
npm run test:unit:fast           # API除外: ~3秒
npm run test:unit:coverage       # カバレッジ付き

# 特定テストのみ
npx vitest run tests/content/vocabulary-quality-validator.test.ts
npx vitest run tests/content/grammar-questions-quality.test.ts  # ✅ 26/26 tests passing
SKIP_API_TESTS=true npx vitest run tests/content/translation-api-validator.test.ts
```

**Phase 1成果 (2025-12-13)**:

- ✅ **100% テストパス** (26/26 tests) - 品質妥協なし
- ✅ **367問の品質改善** - explanationに正答を明示
- ✅ **カバレッジ向上** - 5% → 13% (+160%)
- 🛠️ **自動改善ツール** - `scripts/improve-explanation-quality.py`

**テスト実装時の注意**:

- テストファイルをコミットする前に、ガードスクリプトが実データサンプルを表示
- 仕様書の確認、データ構造の理解、既存実装の確認が必須
- "カタカナ混入"等の誤検出パターンを自動警告

## CSV形式

quiz-app互換の7列形式（**10カテゴリシステム**）:

```csv
語句,読み,意味,語源等解説,関連語,関連分野,難易度
apple,アˊップル,りんご,古英語の "æppel" が語源。,"fruit(フルート): 果物, pear(ペˊア): 洋なし",食・健康,初級
```

### 10個の正式カテゴリ(厳密一致必須)

1. 言語基本
1. 学校・学習
1. 日常生活
1. 人・社会
1. 自然・環境
1. 食・健康
1. 運動・娯楽
1. 場所・移動
1. 時間・数量
1. 科学・技術

詳細: [docs/19-junior-high-vocabulary.md](docs/19-junior-high-vocabulary.md)

## デプロイ

GitHub Pagesへのデプロイ:

```bash
npm run build
# distフォルダの内容をGitHub Pagesにデプロイ
```

## 技術スタック

- React 18
- TypeScript 5
- Vite 5
- CSS Modules

## 開発ドキュメント

### 必読ガイドライン（2025-12-02更新）

- **[CSS開発ガイドライン](docs/CSS_DEVELOPMENT_GUIDELINES.md)** - BEM命名規約、CSS変数使用、重複禁止ルール
- **[TypeScript/React開発ガイドライン](docs/TYPESCRIPT_DEVELOPMENT_GUIDELINES.md)** - コンポーネント設計、型定義、状態管理
- **[品質保証システム](docs/quality/QUALITY_SYSTEM.md)** - テスト戦略、Git Hooks、CI/CD、品質基準、データ品質検証

### その他ドキュメント

- [UI開発ガイドライン](docs/UI_DEVELOPMENT_GUIDELINES.md) - UI変更時の必須要件とベストプラクティス
- [長文読解パッセージガイド](docs/READING_PASSAGES_GUIDE.md) - パッセージ生成システムの概要
- [VS Code Simple Browser ガイド](docs/VS_CODE_SIMPLE_BROWSER_GUIDE.md) - 開発環境での表示確認方法

### AI開発アシスタント向け

- [開発指示書](.aitk/instructions/development-guidelines.instructions.md) - GitHub Copilot等AI支援用の統合ガイド

## コード品質管理

### システム健康診断

定期的にコードベースの健全性をチェックできます：

```bash
npm run health-check
```

**診断項目:**

- localStorage キーの一貫性
- 重複コンポーネント/関数の検出
- useEffect 依存配列の警告
- 未使用変数のチェック
- CSS クラスの重複
- デバッグコード残留チェック
- 型定義の重複
- 大きすぎるファイルの検出
- import文の整理状況

詳細レポート: [docs/quality/HEALTH_CHECK_REPORT.md](docs/quality/HEALTH_CHECK_REPORT.md)

**推奨サイクル:**

- 毎週: 軽量診断実行
- 毎月: 詳細レポート作成
- 四半期: リファクタリング実施
