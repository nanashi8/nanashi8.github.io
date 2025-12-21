---
title: 自動化システムガイド
created: 2025-12-10
updated: 2025-12-15
status: in-progress
tags: [process, ai]
---

# 自動化システムガイド

このプロジェクトは、AIによる自律的な判断と実行が可能な自動化システムを備えています。

## 🤖 自動化の範囲

### 1. 自動マージ (`auto-merge.yml`)

以下の条件を満たすPRは**自動的に承認・マージ**されます:

- **Dependabot**が作成したPR（依存関係の更新）
- **GitHub Actions bot**が作成したPR（自動修正など）
- `auto-merge`ラベルが付いているPR

#### 動作条件

- すべてのチェック（ビルド、テスト、Lint）が成功
- マージ方法: Squash merge
- 6回までリトライ（10秒間隔）

### 2. 自動デプロイ (`auto-deploy.yml`)

`main`ブランチへのプッシュで**自動的にデプロイ**されます:

1. **品質チェック**
   - TypeScript型チェック
   - ESLint（エラーのみ）
   - CSS Lint

1. **ビルド & デプロイ**
   - Viteビルド
   - GitHub Pagesへデプロイ

1. **通知**
   - 成功/失敗の通知

### 3. 自動修正 (`auto-fix.yml`)

**毎日深夜2時（JST）**に自動実行:

- CSS Lintエラーの自動修正
- 自動コミット & プッシュ

**手動実行も可能**:

```bash
# GitHub UIから "Run workflow" をクリック
```

### 4. 依存関係の自動更新 (`dependabot.yml`)

**毎週月曜日 9:00（JST）**に自動実行:

#### npm依存関係

- セキュリティアップデート
- マイナーバージョンアップデート
- `auto-merge`ラベル付きでPR作成

#### GitHub Actions

- アクションの最新版に自動更新
- `auto-merge`ラベル付きでPR作成

## 🎯 使い方

### AIに自動実行を任せる場合

1. **何もしない** - システムが自動で動きます
1. **結果を確認** - GitHub Actionsタブで確認

### 手動で介入する場合

1. **PRにラベル追加**

   ```
   auto-merge  # 自動マージを有効化
   work in progress  # 自動マージを無効化
   ```

1. **ワークフロー手動実行**
   - GitHubのActionsタブ
   - "Run workflow" ボタンをクリック

1. **自動化を一時停止**
   - `.github/workflows/`内のファイルを編集
   - `if: false`を追加

## 🔐 セキュリティ

### 権限設定

すべてのワークフローは**最小権限**で動作:

```yaml
permissions:
  contents: write # コミット・プッシュ
  pull-requests: write # PR作成・マージ
  pages: write # GitHub Pagesデプロイ
```

### シークレット

必要なシークレット:

- `GITHUB_TOKEN` - GitHub Actionsが自動で提供

## 📊 監視・通知

### デプロイ状況

- GitHub Actionsタブで確認
- バッジ: [![Auto Deploy](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/auto-deploy.yml/badge.svg)](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/auto-deploy.yml)

### 自動マージ状況

- PRのチェック欄で確認
- マージ後は自動クローズ

## ⚙️ カスタマイズ

### スケジュール変更

`auto-fix.yml`のcron式を編集:

```yaml
schedule:
  - cron: '0 17 * * *' # UTC 17:00 = JST 02:00
```

### 自動マージ条件の変更

`auto-merge.yml`の`MERGE_LABELS`を編集:

```yaml
MERGE_LABELS: 'auto-merge,!work in progress,!do-not-merge'
```

### Dependabotの頻度変更

`.github/dependabot.yml`を編集:

```yaml
schedule:
  interval: 'daily' # daily, weekly, monthly
```

## 🚨 トラブルシューティング

### 自動マージが動かない

1. **チェックの確認**
   - すべてのチェックが成功しているか
   - `build`ジョブが完了しているか

1. **ラベルの確認**
   - `auto-merge`ラベルが付いているか
   - `work in progress`ラベルが無いか

1. **権限の確認**
   - リポジトリ設定 → Actions → General
   - "Allow GitHub Actions to create and approve pull requests"が有効か

### デプロイが失敗する

1. **ビルドエラーの確認**

   ```bash
   npm run build
   ```

1. **型エラーの確認**

   ```bash
   npm run typecheck
   ```

1. **Lint エラーの確認**
   ```bash
   npm run lint:errors-only
   ```

## 📝 ベストプラクティス

### AIに任せる場合

- コミットメッセージは明確に
- `feat:`, `fix:`, `chore:`などのプレフィックスを使用
- PRには適切なラベルを付ける

### 手動介入が必要な場合

- **大きな変更**: `work in progress`ラベルを付けてレビュー
- **本番デプロイ**: 手動でワークフローを実行
- **緊急修正**: 直接`main`にプッシュ（自動デプロイされる）

## 🔗 関連ドキュメント

- [GitHub Actions ドキュメント](https://docs.github.com/en/actions)
- [Dependabot ドキュメント](https://docs.github.com/en/code-security/dependabot)
- [開発ガイドライン](../../.github/DEVELOPMENT_GUIDELINES.md)
