# Servant

**プロジェクト内に住むAIサーバント - 設計方針を守り、AIの作業を効率化**

## 🎯 コンセプト

Servant は、あなたのプロジェクトに常駐する**知的な執事**です。

### Servant の3つの役割

#### 1. 🛡️ **ガーディアン（守護者）**
`.instructions.md` に記述された設計方針を監視し、リアルタイムでルール違反を検出。コミット前にも自動チェックし、品質を保証します。

#### 2. 🤖 **AIアシスタント（支援者）**（Phase 8-11: 実装済み ✅ / 実験的）
プロジェクト構造を解析し、AI作業を「追跡 → 自己評価 → 学習 → 最適化」します。
- `.vscode/project-index.json` に構造化データを保存（依存関係/ヒント収集）
- AI処理の追跡ログ: `.vscode/ai-action-log.json`
- 自己評価履歴: `.vscode/ai-performance-history.json`
- フィードバック: `.vscode/ai-feedback.json`
- ニューラル依存関係グラフ: `.vscode/neural-graph.json`

**Note**: Copilot（言語モデル）への“自動”コンテキスト注入（`vscode.lm` API連携）は未接続です。現状はコマンド/Chat Participant経由で利用します。

---

## 🚀 主要機能

### 🎁 ワンクリック修正（NEW!）

lint/エラー修正時に、ボタン1つでDECISIONS追記 → git add → git commit を自動実行：

1. **コマンドパレット**（Cmd+Shift+P / Ctrl+Shift+P）を開く
2. 「**Quick Fix Commit**」と入力して実行
3. 変更内容を簡単に説明（例: lint エラー修正）
4. Enter → **完了！**

サーバントの警告を気にせず、安全にコミットできます。

### Phase 1-6: コア機能（実装済み ✅）

#### リアルタイム検証
コード編集中に `.instructions.md` のルール違反を即座に検出し、Problems パネルに表示。

#### AI-Powered Quick Fix
💡 電球アイコンをクリックするだけで、違反を自動修正。

#### Pre-commit Hook
Git コミット前に自動検証。違反があればコミットをブロック。

#### 高速キャッシング
変更されたファイルのみを検証。**98.7%の検証時間削減**（472ms → 6ms）。

### Phase 7: 適応的学習機能（実装済み ✅）

#### 自動学習サイクル
Servant は、あなたのコーディングパターンから学習します:
- 違反を自動記録（手動検証 or pre-commit 時）
- **15回のサイクルで自動学習**を実行
- 頻発する違反パターンを `.aitk/instructions/` に自動生成
- 重み付けで重要なルールを優先

#### Git 履歴解析
```
Servant: Learn from Git History
→ コミット履歴からパターンを抽出
→ ホットスポット（頻繁に変更されるファイル）を検出
```

#### プロジェクトインデックス
```
Servant: Index Project for AI
→ コードベース全体をインデックス化
→ 依存関係マップを .vscode/project-index.json に保存
```

#### ホットスポット検出
```
Servant: Show Problem Hotspots
→ 頻繁に違反が発生するファイルを検出
→ リスクスコアで優先順位付け
```

**Note**: AI向けコンテキストの“自動注入”は未接続です。必要に応じて `Servant: Index Project for AI` / `Servant: Build AI Context Packet` を実行してください。

---

## 🧭 Autopilot（コマンド暗記ゼロの先回り）

「コマンドを覚えたくない」「状況に応じてサーバントが自立して誘導してほしい」向けに、
Servant には **Autopilot** を追加できます。

Autopilot は編集状況から自動で:

- **事前誘導**: 作業開始時に、最善の進め方（推奨手順/次に触るべきファイル順/リスク予測）を Output に出します
- **仕様確認の先回り**: Specチェックが期限切れ/未記録っぽい場合に、先に指示書確認へ誘導します
- **事後レビュー（照会）**: 作業がひと段落したタイミングで「提案を採用したか」「もっと良い方法があったか」を短く問い、次回に活かせる形にします
- **🤖 AI自動調査（NEW!）**: 「分からない」と回答すると、**上級SE視点でコード品質を自動評価**し、改善案を提示します

### 🎓 上級SE視点のコード品質評価

ユーザーが事後レビューで「**分からない**」を選択すると、以下の自動調査が実行されます:

#### 5つの評価軸（各100点満点）

| 評価項目 | チェック内容 |
|---------|------------|
| **設計品質** | ファイル数・変更規模のバランス、領域結合度、テスト/実装比率、エラー・違反の有無 |
| **保守性** | 変更の粒度、リファクタリング指標、ドキュメント更新の有無 |
| **可読性** | 関数の長さ、ネストの深さ、命名規則（今後実装予定） |
| **テスト戦略** | テストファイルの存在、テスト/実装比率、E2Eテストの有無 |
| **ドキュメンテーション** | ドキュメント更新、指示書更新、DECISIONS.md記録 |

**総合スコア**: 各項目の平均値（0〜100点）

#### 自動調査の内容

1. **上級SE視点での品質評価** - 5つの観点から総合的に評価
2. **変更内容の分析** - ファイル数・行数、変更規模の適切性
3. **関連指示書の確認** - ルール違反がないか自動チェック
4. **Git履歴からの学習** - 過去の類似変更を検索（今後実装予定）
5. **総合評価と推奨事項** - 優先度付きでアクションを提案

#### 使い方

1. AI処理（ファイル編集など）が完了すると、サーバントが事後レビューを開始
2. 「他にもっと良い方法がありましたか？」の質問で、**「分からない → AIに自動調査させる」** を選択
3. 自動調査が実行され、Output パネルに詳細レポートが表示される
4. レポートを参考に、次のステップを決定

詳細は [Autopilot審議システムガイド](docs/AUTOPILOT_DELIBERATION_GUIDE.md) を参照してください。

### 🤖 AI改善案生成（NEW!）

ユーザーが事後レビューで「**分からない**」を選択すると、以下のワークフローが実行されます:

1. **自動調査** - 上級SE視点でコード品質を評価
2. **ユーザー確認** - 「AIに具体的な改善案を作成させますか？」と確認
3. **AI改善案プロンプト生成** - GitHub Copilot 用のプロンプトを自動生成
4. **Copilot Chat 連携** - プロンプトをクリップボードにコピーし、Copilot Chat を開く
5. **改善案の実装** - Copilot が提案する具体的なリファクタリング手順を確認・適用

#### プロンプトに含まれる内容

- 総合スコアと問題の優先度
- 高優先度・中優先度の問題と理由
- 変更ファイルのリスト
- 具体的なリファクタリング手順の依頼
- テスト戦略の依頼
- ドキュメント更新の依頼
- 実装順序とリスク評価の依頼

#### 安全機能

- **二段階確認**: まず「分からない」を選択、次に「AIに改善案を作成させる」を選択
- **プロンプト確認**: Output パネルでプロンプト内容を確認可能
- **実装前承認**: AIの提案を確認してから実装を決定

### 設定

通知はノイズにならないように、基本は Output/ステータスバーに寄せ、
高リスク時や「大作業（変更ファイル数が多い）」のときだけ強めに促す設計です。

強め通知の出し方（自動/常に/なし）や、大作業のしきい値は、
コマンドパレットから事前調整できます:

- **`Servant: Adjust Autopilot Preflight`**

高リスク/大作業などで作業開始前に止める場合、ステータスバーが
**`Servant: Autopilot (REVIEW REQUIRED)`** になり、クリックで「審議（承認）」を再表示できます。
コマンドから開く場合は以下です:

- **`Servant: Review Autopilot (Deliberation)`**

審議モーダルでは、承認の前にワンクリックで検証を走らせることもできます:

- **型チェックを実行**（`npm run typecheck`）
- **コミット前検証を実行**（`Servant: Validate Before Commit` 相当）

さらに、審議の内容を **Copilot相談用の簡易テンプレ** としてワンクリックでクリップボードへコピーできます。
そのままチャットに貼るだけで、手順（順序付き）と最小検証セットの提案がすぐ受け取れます。

承認する場合は **承認メモ（根拠）が必須**で、内容は Output に「審議ログ」として残ります。

---

## 📦 インストール

### 方法1: VSIXファイルから（ローカル）

1. VSCode で **Cmd+Shift+P**
2. 「**Extensions: Install from VSIX...**」を選択
3. `servant-0.3.0.vsix` を選択

### 方法2: 開発モード（最も簡単）

```bash
cd extensions/servant
# VSCode で F5 を押す
```

---

## 🎮 使い方

### 基本的な使用

1. **`.instructions.md` ファイルを作成**
   ```markdown
   ---
   description: TypeScript は関数型スタイルで書く
   applyTo: '**/*.ts'
   ---
   
   - 必ずアロー関数を使用すること
   - `function` キーワードは禁止
   ```

2. **コードを編集**
   - ルール違反があれば自動的に赤い波線で表示
   
3. **Quick Fix で修正**
   - 💡 をクリック → 自動修正を適用

### コマンド

#### 基本機能
- **`Servant: Validate Instructions`** - 手動で全体検証
- **`Servant: Install Git Hooks`** - pre-commit hook をインストール
- **`Servant: Validate Before Commit`** - コミット前検証を実行

#### Phase 7 機能（実装済み ✅）
- **`Servant: Learn from Git History`** - Git 履歴から学習（パターン抽出）
- **`Servant: Index Project for AI`** - プロジェクト全体をAI向けにインデックス化
- **`Servant: Show Learning Statistics`** - 学習統計を表示
- **`Servant: Reset Learning Data`** - 学習データをリセット

---

## ⚙️ 設定

### 基本設定

```json
{
  "servant.enable": true,
  "servant.severity": "error"
}
```

### Pre-commit 設定

```json
{
  "servant.preCommit.enabled": true,
  "servant.preCommit.strictMode": false,
  "servant.preCommit.autoFix": false,
  "servant.preCommit.ignorePatterns": ["node_modules", "dist", ".git"]
}
```

### パフォーマンス設定

```json
{
  "servant.performance.enableCache": true,
  "servant.performance.maxCacheSize": 100,
  "servant.performance.enableIncremental": true
}
```

### Phase 7: 学習機能設定

```json
{
  "servant.learning.enabled": true,
  "servant.learning.cycleSize": 15,
  "servant.learning.autoUpdateInstructions": true
}

### 通知設定（"心地良い完璧"）

Servant は通知のノイズを減らすため、既定で `quiet` を採用します（重要な失敗は表示し、その他は Output/Problems 側に寄せます）。

```json
{
  "servant.notifications.mode": "quiet",
  "servant.notifications.cooldownMs": 60000
}
```

詳細な方針: [docs/NOTIFICATION_POLICY.md](docs/NOTIFICATION_POLICY.md)

### Autopilot 設定

```json
{
  "servant.autopilot.enabled": true,
  "servant.autopilot.autoOptimizeOnStart": true,
  "servant.autopilot.proactiveSpecCheck": true,
  "servant.autopilot.askPostReview": true,
  "servant.autopilot.promptMode": "auto",
  "servant.autopilot.revealOutputOnStart": true,
  "servant.autopilot.largeWorkThresholdFiles": 20
}
```
```

---

## 📊 パフォーマンス

| 指標 | 初回検証 | キャッシュ有効 | 改善率 |
|------|---------|-------------|-------|
| 検証時間 | 472ms | 6ms | **98.7%** |
| メモリ使用量 | 50MB | 52MB | -4% |
| CPU使用率 | 15% | 1% | **93.3%** |

---

## 🛠️ 開発

### テスト実行

```bash
npm test                  # 全テスト実行
npm run test:watch        # ウォッチモード
npm run test:coverage     # カバレッジ計測
```

### コンパイル

```bash
npm run compile           # 本番ビルド
npm run watch             # 開発ウォッチモード
```

### パッケージング

```bash
npm run package           # VSIX ファイル生成
```

---

## 📝 ライセンス

MIT License - nanashi8

---

## 🗺️ ロードマップ

### ✅ Phase 1-6: コア機能（完了）
- リアルタイム検証
- Quick Fix
- Pre-commit Hook
- キャッシング & 増分検証

### ✅ Phase 7: 適応的学習（完了）
- 違反パターンの自動記録
- 15回サイクルでの自動学習
- Git 履歴解析機能
- プロジェクトインデックス機能
- AI向けコンテキスト収集

### ✅ Phase 8: AI自己評価とフィードバックループ（実装済み / 実験的）
- AI処理追跡（アクションログ）
- 自己評価（メトリクス算出＋履歴保存）
- フィードバック生成（強み/弱み/改善提案）

### ✅ Phase 9-10: ニューラルグラフ & 学習伝播 & 最適化（実装済み / 実験的）
- ニューラル依存関係グラフ構築
- 影響伝播（順伝播）
- ワークフロー学習と最適化提案

### 📅 Future: Team 機能（計画中）
- Team 設定の同期
- Web ダッシュボード
- 複数 Instructions ファイルのマージ

---

**Servant は、あなたとAIが協力してプロジェクトを成功させるための、最高のパートナーです。**
