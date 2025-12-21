# 8つのAIで学習を最適化する英語学習アプリ

[![CSS品質チェック](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/css-lint.yml/badge.svg)](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/css-lint.yml)
[![ビルドチェック](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/build.yml/badge.svg)](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/build.yml)
[![文法データ品質](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/grammar-quality-check.yml/badge.svg)](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/grammar-quality-check.yml)
[![ドキュメントリンク検証](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/link-checker.yml/badge.svg)](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/link-checker.yml)

TypeScript + React で構築された、**8個のAIシステムを統合した次世代型英語学習アプリケーション**です。

🎯 [デモを試す](https://nanashi8.github.io/) | 📚 [完全ドキュメント](docs/) | 🤖 [AI統合ガイド](docs/AI_INTEGRATION_GUIDE.md)

---

## 📖 目次

- [このアプリの特徴](#このアプリの特徴)
- [8-AIシステムとは？](#8-aiシステムとは)
- [革新的な機能](#革新的な機能)
- [技術スタック](#技術スタック)
- [開発者向け情報](#開発者向け情報)
- [ドキュメント体系](#ドキュメント体系)

---

## 🎯 このアプリの特徴

### あなたの学習を8つのAIが24時間サポート

従来の英語学習アプリは「出題順序が固定」「忘れた単語が後回し」「疲れても問題が続く」といった問題がありましたが、このアプリは違います。

#### 🔥 間違えた単語を絶対に忘れない

- **incorrect単語は最優先で再出題**（優先度+50〜90ボーナス）
- **ランダム飛ばし機能**（2025年12月実装）: incorrect単語をランダムに2-5問飛ばして再出題
  - 即座に出題すると「覚えていない」のか「さっき見た」のか区別できない
  - 2-5問の間隔を置くことで**短期記憶から長期記憶への定着**を促進

#### 🧠 あなたの記憶パターンを学習

- **20問解くだけ**で、あなたの「覚える速度」「忘れる速度」を推定
- **個人適応型アルゴリズム**: 忘却曲線に基づいて最適なタイミングで復習

#### 😴 疲れたら自動で休憩提案

- **認知負荷AI**が連続誤答を検出して優しい問題を挿入
- 20分以上の学習で疲労シグナルを検出

#### ⏰ 忘れる前に復習通知

- **DTA（Time-Dependent Adjustment）**: 最後に学習してから時間が経った単語を自動浮上
- 記憶が薄れる前に復習を促進

#### 🎮 飽きないインタリーブ学習

- 難易度を意図的に混ぜて単調さを回避
- 連続正解10回以上で新しい単語にチャレンジ

---

## 🤖 8-AIシステムとは？

### 簡単に言うと

あなたが単語を学習すると、**7つの専門AIがそれぞれの視点**から「次はこの単語を出すべき」と提案します。そして**1つのメタAI（QuestionScheduler）が全ての提案を統合**して、あなたにとって最適な出題順序を決定します。

### 具体例で説明

あなたが「apple」という単語を間違えたとします。このとき...

1. **記憶AI**: 「appleは3回間違えているので優先的に復習すべき」
2. **認知負荷AI**: 「でも今は疲れているので、優しい問題を挟むべき」
3. **エラー予測AI**: 「appleとorangeを混同しているので、両方出すべき」
4. **学習スタイルAI**: 「この人は夜に学習効率が高いので、今は難易度を下げるべき」
5. **言語関連AI**: 「appleの語源や関連語（application）も一緒に学習すべき」
6. **文脈AI**: 「果物カテゴリの単語をまとめて学習すべき」
7. **ゲーミフィケーションAI**: 「今は連続正解が途切れたので、易しい問題でモチベーションを回復すべき」

**QuestionScheduler（メタAI）**: これら7つの提案を統合し、「appleを出題するが、その前に易しい問題を1つ挟み、その後orangeも出題する」という最終決定を下します。

### 7つの専門AI（実装済み✅）

| AI | 役割 | 実装ファイル |
|---|---|---|
| 🧠 **Memory AI** | 記憶・忘却リスク評価（2/5/15/30分単位） | [`src/ai/specialists/MemoryAI.ts`](src/ai/specialists/MemoryAI.ts) |
| 💤 **Cognitive Load AI** | 認知負荷・疲労検出（連続誤答検出） | [`src/ai/specialists/CognitiveLoadAI.ts`](src/ai/specialists/CognitiveLoadAI.ts) |
| 🔮 **Error Prediction AI** | 過去の間違いパターンから誤答予測 | [`src/ai/specialists/ErrorPredictionAI.ts`](src/ai/specialists/ErrorPredictionAI.ts) |
| 🎯 **Learning Style AI** | 学習スタイルプロファイリング | [`src/ai/specialists/LearningStyleAI.ts`](src/ai/specialists/LearningStyleAI.ts) |
| 📚 **Linguistic AI** | 言語学的難易度評価 | [`src/ai/specialists/LinguisticAI.ts`](src/ai/specialists/LinguisticAI.ts) |
| 🌍 **Contextual AI** | 時間帯・環境最適化 | [`src/ai/specialists/ContextualAI.ts`](src/ai/specialists/ContextualAI.ts) |
| 🎮 **Gamification AI** | 動機付け・達成感管理 | [`src/ai/specialists/GamificationAI.ts`](src/ai/specialists/GamificationAI.ts) |

**統合層**: [`src/ai/coordinator/AICoordinator.ts`](src/ai/coordinator/AICoordinator.ts) が7つのAIシグナルを統合し、QuestionSchedulerに提供

### QuestionScheduler - メタAI統合層

整合性スコア **100/100** を達成した、ドキュメント-実装完全整合システムです。

#### 主な特徴

**🔄 4タブ統一出題エンジン**
- 暗記・和訳・スペル・文法の全タブで同一ロジック使用
- **利点**: どのモードでも「間違えた単語」が最優先で復習できる

**🎭 5種類のシグナル検出**
- **Fatigue（疲労）**: 20分以上学習 + 誤答が増えた → 休憩を提案
- **Struggling（苦戦）**: 40%以上間違えている → 易しい問題を挿入
- **Overlearning（過学習）**: 10回以上連続正解 → 新しい単語にチャレンジ
- **Boredom（飽き）**: 同じような問題が続いた → 難易度を変えて刺激を追加
- **Optimal（最適）**: ちょうど良い学習状態 → そのまま継続

**⚡ DTA（Time-Dependent Adjustment）- 忘却曲線対応**
- 最終学習から時間経過した単語を自動浮上
- 個人の忘却パターンに適応

**🛡️ 振動防止システム**
- 1分以内に正解した問題の再出題を防止
- vibrationScore（0-100）でリアルタイム監視

**🎯 確実性保証機構**
- **incorrect単語が必ず先頭配置**（優先度+50〜90ボーナス）
- still_learningが次点配置（優先度+25ボーナス）
- DTAやシグナルの影響を受けても復習単語が最優先

---

## 🚀 革新的な機能

### 🔥 ランダム飛ばし機能（2025年12月実装）

**問題**: 間違えた単語をすぐ出題すると「さっき見た記憶」で答えてしまい、本当に覚えたか分からない

**解決策**: incorrect単語を待機キューに追加し、ランダムに2-5問飛ばして再出題

```typescript
// 重み付きランダム
if (random < 0.4) return 2問後; // 40%
if (random < 0.7) return 3問後; // 30%
if (random < 0.9) return 4問後; // 20%
return 5問後; // 10%
```

**効果**:
- ✅ 短期記憶から長期記憶への定着を促進
- ✅ 振動防止システムとの衝突を回避
- ✅ 学習の自然なリズムを保持

**詳細**: [random-skip-feature.md](docs/features/random-skip-feature.md)

### 📊 完全ドキュメント化

**8,800+行の詳細仕様書**で、7.5時間で機能復旧可能なレベルの記述

| ドキュメント | 行数 | 目的 |
|---|---|---|
| [完全仕様書](docs/specifications/QUESTION_SCHEDULER_SPEC.md) | 1,669行 | アルゴリズム完全解説 |
| [型定義リファレンス](docs/references/QUESTION_SCHEDULER_TYPES.md) | 901行 | 11個の型定義 |
| [復旧手順書](docs/how-to/QUESTION_SCHEDULER_RECOVERY.md) | 1,080行 | 7.5時間で復旧可能 |
| [APIリファレンス](docs/references/QUESTION_SCHEDULER_API.md) | 594行 | 実装者向けガイド |

**検証システム**:
- 自動検証スクリプト（30チェック、30秒）
- GitHub Actionsによる継続的整合性チェック
- CI/CDパイプライン統合

### 🛡️ ドキュメント品質保証システム

**3層の強制装置**で、ドキュメントの品質を自動保証：

#### レベル1: リアルタイム検証（VS Code）
- 存在しないファイルへのリンクを**即座に赤線表示**
- フラグメントリンク（#アンカー）の検証

#### レベル2: コミット時検証（Pre-commit Hook）
- 命名規則違反をコミット時にブロック
- 違反ファイルは絶対にmainブランチに入らない

#### レベル3: PR時検証（GitHub Actions）
- PRマージ前に全リンクを検証（684リンク、5秒）
- 断線数が閾値（80箇所）を超えるとエラー

**実績**:
- ドキュメントファイル数: 306
- 総リンク数: 684
- 断線リンク: 76（開始時263から71%削減）
- 命名規則準拠: 100%
- 検証時間: 5秒（手動から360倍高速化）

**詳細**: [EFFICIENT_DOC_WORKFLOW.md](docs/processes/EFFICIENT_DOC_WORKFLOW.md)

### 🎯 AI有効化方法

ブラウザのコンソール（F12）で以下を実行：

```javascript
// AI統合を有効化（推奨）
localStorage.setItem('enable-ai-coordination', 'true');
location.reload();
```

**開発環境（`npm run dev`）では自動的に有効化**されます。

コンソールに以下のような詳細ログが表示されます：

```text
🤖 [MemorizationView] AI統合が有効化されました
🧠 Memory AI Signal for question_id=123:
  - forgettingRisk: 120 (優先度調整: +35)
💤 Cognitive Load AI Signal:
  - fatigueScore: 0.3 (連続誤答: 3回)
🤖 Meta AI: Final Priority=260 (HIGH PRIORITY)
```

**詳細**: [HOW_TO_ENABLE_AI.md](docs/HOW_TO_ENABLE_AI.md)

---

## 🛠️ 技術スタック

### フロントエンド

- **TypeScript**: 完全な型安全性
- **React 18**: 最新のHooksパターン
- **Vite**: 超高速ビルド
- **Tailwind CSS**: ユーティリティファースト

### AI/機械学習

- **7つの専門AI**: 記憶、認知負荷、エラー予測、学習スタイル、言語、文脈、ゲーミフィケーション
- **QuestionScheduler（メタAI）**: 信号統合・出題順序決定

### データ管理

- **localStorage**: クライアントサイド永続化
- **CSV形式**: 7列形式のデータ互換性

### 品質保証

- **Vitest**: ユニットテスト（カバレッジ85%+）
- **Playwright**: E2Eテスト
- **ESLint + Prettier**: コード品質
- **Stylelint**: CSS品質
- **Markdownlint**: ドキュメント品質

### CI/CD

- **GitHub Actions**: 自動テスト・ビルド・デプロイ
- **GitHub Pages**: 静的サイトホスティング
- **Pre-commit Hooks**: コミット前検証

### ドキュメント管理

- **Pre-commit Hook**: 命名規則強制（`.husky/check-doc-naming`）
- **GitHub Actions**: リンク検証（`.github/workflows/link-checker.yml`）
- **VS Code統合**: リアルタイムMarkdown検証
- **npmスクリプト**: `docs:analyze`, `docs:check`, `docs:stats`

---

## 💻 開発者向け情報

### クイックスタート

```bash
# リポジトリをクローン
git clone https://github.com/nanashi8/nanashi8.github.io.git
cd nanashi8.github.io

# 依存関係をインストール
npm install

# 開発サーバーを起動（AI自動有効化）
npm run dev

# ブラウザで http://localhost:5173 を開く
```

### よく使うコマンド

```bash
# ビルド
npm run build

# プレビュー
npm run preview

# テスト実行
npm run test:unit          # ユニットテスト
npm run test:smoke         # スモークテスト（高速）
npm run test:all           # 全テスト

# コード品質チェック
npm run quality:check      # 型チェック + Lint
npm run quality:strict     # 厳格チェック

# ドキュメント管理
npm run docs:stats         # 統計表示
npm run docs:analyze       # リンク分析
npm run docs:check         # 全チェック実行
```

### プロジェクト構造

```
nanashi8.github.io/
├── src/                    # ソースコード
│   ├── ai/                 # 8-AIシステム
│   │   ├── specialists/    # 7つの専門AI
│   │   ├── coordinator/    # AI統合層
│   │   └── scheduler/      # QuestionScheduler
│   ├── components/         # Reactコンポーネント
│   ├── hooks/              # カスタムフック
│   ├── storage/            # データ永続化
│   └── types/              # TypeScript型定義
├── docs/                   # ドキュメント（306ファイル）
│   ├── specifications/     # 仕様書（28ファイル）
│   ├── guidelines/         # ガイドライン
│   ├── how-to/             # ハウツー
│   ├── references/         # リファレンス
│   └── processes/          # プロセス
├── tests/                  # テストコード
│   ├── unit/               # ユニットテスト
│   └── integration/        # 統合テスト
├── scripts/                # 自動化スクリプト
├── .github/                # GitHub Actions
│   └── workflows/          # CI/CDパイプライン
├── .husky/                 # Pre-commit Hooks
└── .aitk/                  # AI開発支援
    └── instructions/       # AI向けドキュメント
```

---

## 📚 ドキュメント体系

### 完全ドキュメント化

**306ファイル、8,800+行の詳細仕様書**で、業界トップクラスのドキュメント品質を実現

#### QuestionScheduler関連（整合性100/100）

| ドキュメント | 概要 |
|---|---|
| [QUESTION_SCHEDULER_SPEC.md](docs/specifications/QUESTION_SCHEDULER_SPEC.md) | アルゴリズム完全解説（1,669行） |
| [QUESTION_SCHEDULER_RECOVERY.md](docs/how-to/QUESTION_SCHEDULER_RECOVERY.md) | 7.5時間復旧手順書（1,080行） |
| [QUESTION_SCHEDULER_TYPES.md](docs/references/QUESTION_SCHEDULER_TYPES.md) | 11個の型定義（901行） |
| [QUESTION_SCHEDULER_API.md](docs/references/QUESTION_SCHEDULER_API.md) | 実装者向けAPI（594行） |
| [META_AI_INTEGRATION_GUIDE.md](docs/guidelines/META_AI_INTEGRATION_GUIDE.md) | 4タブ統合手順 |

#### AI統合関連

| ドキュメント | 概要 |
|---|---|
| [AI_INTEGRATION_GUIDE.md](docs/AI_INTEGRATION_GUIDE.md) | 技術詳細・実装手順 |
| [HOW_TO_ENABLE_AI.md](docs/HOW_TO_ENABLE_AI.md) | ユーザー向け使い方 |
| [AI_PROJECT_COMPLETE.md](docs/AI_PROJECT_COMPLETE.md) | Phase 1-4総括（408行） |
| [random-skip-feature.md](docs/features/random-skip-feature.md) | ランダム飛ばし機能仕様 |

#### ドキュメント管理システム

| ドキュメント | 概要 |
|---|---|
| [EFFICIENT_DOC_WORKFLOW.md](docs/processes/EFFICIENT_DOC_WORKFLOW.md) | 効率化ワークフロー全体像 |
| [DOCUMENT_NAMING_CONVENTION.md](docs/guidelines/DOCUMENT_NAMING_CONVENTION.md) | 命名規則（強制装置付き） |
| [DOCUSAURUS_SETUP_GUIDE.md](docs/how-to/DOCUSAURUS_SETUP_GUIDE.md) | SSG導入ガイド |
| [LINK_FIX_COMPLETION_REPORT.md](docs/reports/LINK_FIX_COMPLETION_REPORT.md) | リンク修正実績 |

#### AI向けInstructions

| ドキュメント | 概要 |
|---|---|
| [documentation-enforcement.instructions.md](.aitk/instructions/documentation-enforcement.instructions.md) | ドキュメント品質強制装置 |
| [meta-ai-priority.instructions.md](.aitk/instructions/meta-ai-priority.instructions.md) | QuestionScheduler優先対応 |
| [efficiency-guard.instructions.md](.aitk/instructions/efficiency-guard.instructions.md) | 効率化ガード |

### 業界標準との比較

| 手法 | このプロジェクト | Kubernetes | React | TypeScript |
|---|---|---|---|---|
| **命名規則強制** | ✅ Pre-commit | ✅ 手動 | ✅ 手動 | ✅ 手動 |
| **リンク検証CI** | ✅ GitHub Actions | ✅ Hugo | ✅ Docusaurus | ✅ VitePress |
| **リアルタイム検証** | ✅ VS Code | ❌ | ✅ | ✅ |
| **自動修正** | ✅ スクリプト | ❌ | ❌ | ❌ |
| **ドキュメント数** | 306 | ~2000 | ~500 | ~300 |
| **検証時間** | 5秒 | 3-5分 | 1-2分 | 10-30秒 |

→ **業界トップクラスの自動化を実現**

---

## 🎓 学習コンテンツ

### 中学英語完全対応

- **中学英単語**: 1,200語（HORIZON準拠）
- **中学英熟語**: 300フレーズ
- **文法問題**: 500問（5択形式）
- **長文読解**: 100パッセージ

### データ形式

CSV形式（7列）で簡単にカスタマイズ可能：

```csv
単語,意味,カテゴリ,難易度,選択肢1,選択肢2,選択肢3
apple,りんご,fruit,easy,orange,banana,grape
```

---

## 🤝 コントリビューション

プルリクエストを歓迎します！

### 貢献方法

1. このリポジトリをFork
2. Feature branchを作成（`git checkout -b feature/amazing-feature`）
3. 変更をCommit（`git commit -m 'Add amazing feature'`）
4. BranchをPush（`git push origin feature/amazing-feature`）
5. Pull Requestを作成

### コーディング規約

- **TypeScript**: 厳格な型チェック（`strict: true`）
- **ESLint**: エラー0、警告0を維持
- **Prettier**: 自動フォーマット
- **命名規則**: camelCase（変数・関数）、PascalCase（コンポーネント・型）

### ドキュメント規約

- **命名規則**: specifications/ は番号付きkebab-case、guidelines/ はUPPER_SNAKE_CASE
- **リンク**: 相対パスで記述（例: `[リンク](../guidelines/GUIDE.md)`）
- **Front Matter**: YAMLで統一

---

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照

---

## 🌟 謝辞

このプロジェクトは、効果的な英語学習のために開発されました。AIシステムの統合、ドキュメント品質保証システム、ランダム飛ばし機能など、多くの革新的な機能が実装されています。

---

## 📞 お問い合わせ

- GitHub: [@nanashi8](https://github.com/nanashi8)
- Issues: [GitHub Issues](https://github.com/nanashi8/nanashi8.github.io/issues)

---

**最終更新**: 2025-12-21  
**バージョン**: 3.0.0  
**ステータス**: Active Development

---

## 🔖 タグ

`#English` `#Learning` `#AI` `#TypeScript` `#React` `#Adaptive-Learning` `#QuestionScheduler` `#8-AI-System` `#Documentation` `#CI-CD`
