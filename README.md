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

### 🆕 Phase 2-3完了: 7AI+メタAI完全統合（2025年12月）

**新機能**: 7つの専門AIが実装され、暗記・文法・スペリングタブで利用可能になりました！

#### 有効化方法

ブラウザのコンソール（F12）で以下を実行：

```javascript
// AI統合を有効化
localStorage.setItem('enable-ai-coordination', 'true');
location.reload();

// 無効化
localStorage.removeItem('enable-ai-coordination');
location.reload();
```

開発環境（`npm run dev`）では自動的に有効化されます。

#### 7つの専門AI

1. **🧠 Memory AI** - 記憶・忘却リスク評価（2/5/15/30分単位）
2. **💤 Cognitive Load AI** - 認知負荷・疲労検出
3. **🔮 Error Prediction AI** - 過去の間違いパターンから誤答予測
4. **🎯 Learning Style AI** - 学習スタイルプロファイリング
5. **📚 Linguistic AI** - 言語学的難易度評価
6. **🌍 Contextual AI** - 時間帯・環境最適化
7. **🎮 Gamification AI** - 動機付け・達成感管理

コンソールに以下のような詳細ログが表示されます：

```
🤖 [MemorizationView] AI統合が有効化されました
🧠 Memory AI: forgettingRisk=120 (優先度+35)
💤 Cognitive Load AI: fatigueScore=0.3 (優先度+15)
🔮 Error Prediction AI: errorProbability=0.65 (優先度+40)
🤖 Meta AI: Final Priority=260 (HIGH PRIORITY)
```

📚 **詳細ドキュメント**:
- [AI統合ガイド](docs/AI_INTEGRATION_GUIDE.md) - 技術詳細
- [有効化ガイド](docs/HOW_TO_ENABLE_AI.md) - 使い方
- [完了レポート](docs/FINAL_PROJECT_REPORT.md) - プロジェクト総括

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

| ドキュメント | 行数 | 目的 |
|------------|------|------|
| [完全仕様書](docs/specifications/QUESTION_SCHEDULER_SPEC.md) | 1,669行 | アルゴリズム完全解説 |
| [型定義リファレンス](docs/references/QUESTION_SCHEDULER_TYPES.md) | 901行 | 11個の型定義 |
| [復旧手順書](docs/how-to/QUESTION_SCHEDULER_RECOVERY.md) | 1,080行 | 7.5時間で復旧可能 |
| [APIリファレンス](docs/references/QUESTION_SCHEDULER_API.md) | 594行 | 実装者向けガイド |
| [統合ガイド](docs/guidelines/META_AI_INTEGRATION_GUIDE.md) | v3.0 | 4タブ統合手順 |
| [シグナル活用](docs/how-to/DETECTED_SIGNAL_USAGE_GUIDE.md) | 653行 | UI/UXパターン |

**検証システム**: 
- 自動検証スクリプト（30チェック、30秒）
- GitHub Actions CI/CD統合
- PR時の自動品質チェック

**完了レポート**:
- [Phase 1-4総括](docs/reports/PHASE_1_4_FINAL_REPORT.md) - 整合性89点達成
- [Phase 5完了](docs/reports/PHASE_5_COMPLETION_REPORT.md) - 100点達成
- [Phase 6完了](docs/reports/PHASE_6_COMPLETION_REPORT.md) - CI/CD統合

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

- ✅ **248/248 テスト成功** (100%)
  - アルゴリズムテスト: 203/203 (既存)
  - 統合テスト: 22/22 (既存)
  - Phase 1-3改善: 23/23 (新規)
- ✅ **平均カバレッジ 96.50%**
- ✅ **型安全**: TypeScript完全対応
- ✅ **再現性**: Seed対応による決定論的実行

#### ドキュメント-実装整合性

- ✅ **100/100スコア** - QuestionScheduler完全整合
- ✅ **30項目自動検証** - CI/CDで継続監視
- ✅ **8,800+行ドキュメント** - 機械復旧可能レベル
- ✅ **7.5時間復旧保証** - 完全な復旧手順書

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
