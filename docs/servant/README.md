# Servantシステム

## 🎯 概要

**Servant**（サーバント）は、プロジェクト全体を自動的に管理・学習する自律型システムです。

AIとのペアコーディングで発生する高速開発に対応し、短いサイクルで自動的にGit履歴を学習することで、常に最新の知識を保持します。

---

## 📚 ドキュメント一覧

### コアドキュメント

- **[自動学習システム](./auto-learning.md)** - サーバント自動学習システム
  - Git履歴の自動学習
  - Post-commit Hookによる学習トリガー
  - 定期自動学習（GitHub Actions）
  - 手動学習コマンド

- **[管轄範囲](./scope.md)** - サーバント管轄範囲
  - 管理対象ドキュメント一覧
  - 自動生成ドキュメント
  - 手動作成ドキュメント
  - ドキュメント階層構造

---

## 🔄 自動学習の仕組み

### 学習トリガー

Servantは以下のタイミングで自動的に学習を実行します:

#### 1. Post-commit Hook（最優先）

```bash
# 設定: 15コミットごとに自動学習
LEARNING_CYCLE=15
```

**動作**:

```
コミット1: 📊 コミット数 1/15
コミット2: 📊 コミット数 2/15
...
コミット15: 🧠 学習サイクル到達！
           ↓
      バックグラウンドで学習実行
```

#### 2. 定期自動学習（GitHub Actions）

- **頻度**: 1日1回（午前3時）
- **対象**: mainブランチ
- **処理**: Git履歴の差分学習

#### 3. 手動学習

```bash
npm run servant:learn
```

---

## 📊 管轄範囲

Servantは以下のドキュメントを管理します:

### 🧠 Instructions（AI教育層）

- `adaptive-guard-system.instructions.md` ✅ 自動生成
- `ai-code-quality-checklist.instructions.md` ✅ 手動作成
- `refactoring-safety-guide.instructions.md` ✅ 手動作成
- `property-naming-convention.instructions.md` ✅ 手動作成

### 📐 Specifications（仕様層）

- `ADAPTIVE_SPECIFICATIONS.md` 🔄 自動生成（新規）
- `QUESTION_SCHEDULER_SPEC.md` ✅ 手動作成
- `TEST_SPECIFICATIONS.md` ✅ 手動作成

### 📋 Guidelines（ガイドライン層）

- `ADAPTIVE_GUIDELINES.md` 🔄 自動生成（新規）
- `META_AI_INTEGRATION_GUIDE.md` ✅ 手動作成
- `CSS_DEVELOPMENT_GUIDELINES.md` ✅ 手動作成

### 🔧 Pipelines（パイプライン層）

自動化ワークフローの管理

---

## 🚀 使い方

### セットアップ

```bash
# Post-commit Hookを設定
npm run servant:setup-hooks

# 学習サイクルを設定（デフォルト: 15コミット）
export LEARNING_CYCLE=15
```

### 学習実行

```bash
# Git履歴から学習
npm run servant:learn

# 失敗履歴から学習
npm run servant:learn-failures

# 統合学習（推奨）
npm run servant:learn-all
```

### 状態確認

```bash
# 学習状態を確認
npm run servant:status

# 管轄ドキュメントを確認
npm run servant:list-docs
```

---

## 🎓 学習内容

Servantは以下の情報を学習します:

### 1. Git履歴

- コミットメッセージ
- ファイル変更差分
- リファクタリングパターン
- バグ修正パターン

### 2. 失敗パターン

- AI修正の失敗事例
- 危険な操作パターン
- 無限ループ等の検出ルール

### 3. プロジェクト構造

- ドキュメント依存関係
- コード構造の変遷
- アーキテクチャの進化

### 4. 品質メトリクス

- テストカバレッジの推移
- ビルド成功率
- コード品質スコア

---

## 🧠 AI統合

Servantは以下のAIシステムと連携します:

- **[ガードシステム](../ai-systems/guard-system.md)** - リアルタイム監視
- **[警告システム](../ai-systems/warning-system.md)** - 危険操作の検出
- **[失敗学習](../ai-systems/failure-collection.md)** - 失敗パターンの分析

---

## 📈 学習サイクル

```
Phase 1: データ収集
├─ Git履歴の取得
├─ 失敗履歴の読み込み
└─ 品質メトリクスの集計

Phase 2: パターン分析
├─ 頻出パターンの抽出
├─ 危険パターンの特定
└─ 成功パターンの学習

Phase 3: ルール更新
├─ ガードルールの生成
├─ Instructionsの更新
└─ チェックリストの追加

Phase 4: フィードバック
├─ 学習レポートの生成
├─ ドキュメントの自動更新
└─ 次回学習の準備
```

---

## 🔗 関連ドキュメント

- [AI統合システム](../ai-systems/) - ガード・警告・学習システム
- [開発ガイド](../development/) - 実装詳細
- [ドキュメント構造](../README.md) - 全体構成

---

## 💡 設計思想

**「高速開発に対応した自律型学習」**

AIとのペアコーディングでは、人間の数倍の速度でコミットが積み重なります。
Servantは短いサイクルで自動学習することで、この高速開発に追従し、
常に最新の知識でプロジェクトをサポートします。

```
従来: 週1回の手動レビュー → 知識が古くなる
Servant: 15コミットごとに自動学習 → 常に最新
```
