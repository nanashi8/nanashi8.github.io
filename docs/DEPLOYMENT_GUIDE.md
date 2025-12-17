# デプロイ設定ガイド

## 🌙 深夜デプロイ設定の概要

生徒に影響を与えないよう、以下の2段構えのデプロイ戦略を実装しました：

### 1. **通常時：手動承認式デプロイ**
- `main`ブランチへプッシュ → **自動的にビルド・テスト**
- デプロイは**手動承認が必要**
- 深夜など都合の良い時間に承認してデプロイ

### 2. **自動：深夜スケジュールデプロイ**
- 毎日**午前2時（JST）**に自動実行
- 変更がある場合のみデプロイ
- 変更がなければスキップ

---

## 📋 初回設定手順（5分）

### Step 1: Production Environment の作成

1. GitHubリポジトリページを開く
2. **Settings** タブをクリック
3. 左メニューから **Environments** を選択
4. **New environment** をクリック
5. 名前に `production` と入力して **Configure environment** をクリック

### Step 2: 承認者の設定（推奨）

1. **Environment protection rules** セクションで：
   - ☑️ **Required reviewers** をチェック
   - 自分（先生）のアカウントを追加
   - **Save protection rules** をクリック

2. （オプション）**Wait timer** を設定：
   - 例：30分後に自動承認（深夜のみ自動化したい場合）

### Step 3: Environment secrets の設定（必要な場合）

通知用のWebhook URLなどがあれば設定：
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

---

## 🚀 使い方

### パターン A: 日中に開発 → 深夜に自動デプロイ

```bash
# 1. 開発作業
git checkout -b feature/新機能
# ... 開発 ...

# 2. mainへマージ（日中でもOK）
git checkout main
git merge feature/新機能
git push origin main

# 3. GitHub Actions でビルド・テストが自動実行される（デプロイはされない）

# 4. 深夜2時に自動デプロイ実行
#    → 変更があれば自動的に本番反映
```

### パターン B: すぐにデプロイしたい場合

```bash
# 1. コードをpush
git push origin main

# 2. GitHub Actions ページを開く
# https://github.com/nanashi8/nanashi8.github.io/actions

# 3. "Build and Test (Manual Deploy)" ワークフローを開く

# 4. "deploy" ジョブで "Review deployments" ボタンが表示される

# 5. チェックボックスをチェックして "Approve and deploy" をクリック
```

### パターン C: 緊急時の手動デプロイ

```bash
# GitHub Actions → "Scheduled Night Deploy" を開く
# "Run workflow" → "Run workflow" をクリック
# すぐにデプロイが開始される
```

---

## ⏰ スケジュール変更方法

デプロイ時刻を変更したい場合：

[scheduled-deploy.yml](../.github/workflows/scheduled-deploy.yml) の cron を編集：

```yaml
schedule:
  - cron: '0 17 * * *'  # UTC 17:00 = JST 2:00（深夜2時）
```

### よく使う時刻設定例

| JST時刻 | UTC時刻 | cron設定 |
|---------|---------|----------|
| 深夜1時 | 16:00 | `'0 16 * * *'` |
| 深夜2時 | 17:00 | `'0 17 * * *'` |
| 深夜3時 | 18:00 | `'0 18 * * *'` |
| 早朝5時 | 20:00 | `'0 20 * * *'` |

---

## 🔍 デプロイ状況の確認

### GitHub Actions で確認
https://github.com/nanashi8/nanashi8.github.io/actions

- **Build and Test**: mainへのpushで自動実行
- **Scheduled Night Deploy**: 毎日深夜2時に自動実行

### 本番環境URL
https://nanashi8.github.io

### デプロイ履歴
```bash
# デプロイタグを確認
git tag | grep deploy-

# 例:
# deploy-20251216-020015
# deploy-20251217-020008
```

---

## 📊 運用フロー図

```
開発者が mainへ push
        ↓
    ビルド・テスト
        ↓
  ビルド成果物保存
        ↓
    承認待機 ⏸️
        ↓
    【選択肢】
    ├─ 手動承認 → すぐデプロイ
    └─ そのまま → 深夜2時に自動デプロイ
```

---

## 🛡️ 安全機能

### ✅ 自動実装済み

1. **ビルド検証**：デプロイ前に必ずビルドが成功することを確認
2. **品質チェック**：TypeScript、ESLint、CSS lintを自動実行
3. **変更検知**：変更がない場合はデプロイをスキップ
4. **タグ付け**：各デプロイに自動でタグを付けてロールバック可能に
5. **同時実行制御**：複数のデプロイが同時に走らないよう制御

### 📋 手動で確認すべきこと

- [ ] Environment protection rules が設定済み
- [ ] 自分が承認者として登録済み
- [ ] デプロイ通知を受け取る設定（オプション）

---

## 🚨 ロールバック手順

デプロイ後に問題が発生した場合：

```bash
# 1. デプロイタグを確認
git tag --sort=-creatordate | grep deploy- | head -5

# 2. 前のバージョンに戻す
git reset --hard deploy-20251215-020010  # 前回のタグ
git push -f origin main

# 3. 手動でデプロイを承認
# または深夜まで待つ
```

### より安全なロールバック（PRを使う）

```bash
# 1. ロールバック用ブランチ作成
git checkout -b rollback/urgent

# 2. 前のバージョンを指定
git reset --hard deploy-20251215-020010

# 3. Push してPR作成
git push origin rollback/urgent

# 4. PR経由でmainにマージ（履歴が残る）
```

---

## 💡 Tips

### 開発環境でテスト
```bash
# ローカルでビルドをテスト
npm run build
npm run preview

# Beta環境でテスト
npm run deploy:beta
# → https://nanashi8.github.io/beta/
```

### デプロイを一時停止したい場合
```yaml
# scheduled-deploy.yml の先頭に追加
on:
  # schedule:
  #   - cron: '0 17 * * *'  # コメントアウト
  workflow_dispatch:  # 手動実行のみ有効
```

### 通知を追加したい場合

Slackなどに通知を送る場合は、notify ジョブに追加：

```yaml
- name: Slack通知
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "🌙 深夜デプロイ完了: https://nanashi8.github.io"
      }
```

---

## 🎯 まとめ

✅ **実装済み**
- 手動承認式デプロイ（即座に対応可能）
- 深夜2時の自動デプロイ（変更検知付き）
- ビルド・品質チェック自動化
- ロールバック用タグ自動生成

⚙️ **要設定**
- GitHub Environment "production" の作成
- 承認者（先生）の登録

📚 **推奨運用**
1. 通常は気にせず開発してmainへpush
2. 深夜2時に自動デプロイ
3. 緊急時のみ手動承認でデプロイ
4. 問題発生時はタグでロールバック
