# GitHub CLI (gh) セットアップガイド

## GitHub CLI とは

`gh` は GitHub の公式コマンドラインツールです。ターミナルから Issue、Pull Request、リポジトリ操作などを実行できます。

## 認証の仕組み

### 1. 認証方法の種類

GitHub CLI は以下の3つの認証方法をサポートしています:

#### A. ブラウザ認証（推奨）
```bash
gh auth login --web
```
- 最も簡単で安全
- ブラウザで GitHub にログインするだけ
- 自動的にトークンが生成される

#### B. Personal Access Token
```bash
gh auth login
```
手動でトークンを生成して貼り付ける方法:
1. https://github.com/settings/tokens にアクセス
1. "Generate new token (classic)" をクリック
1. 必要なスコープを選択:
   - `repo` - リポジトリへのフルアクセス
   - `read:org` - 組織情報の読み取り
   - `admin:public_key` - SSH公開鍵の管理
1. トークンをコピー
1. `gh auth login` で貼り付け

#### C. SSH鍵アップロード
既存のSSH鍵をGitHubアカウントに自動アップロードする方法です。

### 2. 認証フロー

```
┌─────────────────┐
│ gh auth login   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ Where do you use GitHub?│
│ ・GitHub.com (通常)     │ ← これを選択
│ ・GitHub Enterprise    │
│ ・Other (カスタム)      │
└────────┬────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Protocol for Git ops?    │
│ ・HTTPS                  │
│ ・SSH                    │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ How to authenticate?     │
│ ・Login with browser     │ ← 推奨
│ ・Paste a token          │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Authentication complete! │
└──────────────────────────┘
```

### 3. 重要な用語

#### hostname
接続先のGitHubサーバーのアドレス:
- **GitHub.com**: 通常のGitHub（ほとんどの場合これ）
- **GitHub Enterprise**: 企業用の独自GitHubサーバー（例: `github.company.com`）
- **Other**: カスタムホスト名

⚠️ **よくある間違い**: ユーザー名（例: `nanashi8`）を入力してしまう
✅ **正解**: `GitHub.com` を選択

#### Personal Access Token (PAT)
GitHubアカウントへのアクセス権限を持つトークン文字列:
- パスワードの代わりに使用
- 有効期限を設定可能
- 細かい権限制御が可能
- 形式: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### スコープ (Scopes)
トークンが持つ権限の範囲:
- `repo`: プライベートリポジトリを含むすべてのリポジトリへのアクセス
- `read:org`: 組織の情報を読み取る
- `admin:public_key`: SSH公開鍵を管理する
- `workflow`: GitHub Actions ワークフローの編集

## トラブルシューティング

### エラー: HTTP 401: Bad credentials

**原因**: トークンが無効または期限切れ

**解決方法**:
1. 新しいトークンを生成: https://github.com/settings/tokens
1. または、ブラウザ認証を使用: `gh auth login --web`

### エラー: error connecting to nanashi8

**原因**: hostname に誤ったサーバー名（ユーザー名など）を入力した

**解決方法**:
1. `gh auth logout` で認証をクリア
1. `gh auth login` を再実行
1. "Where do you use GitHub?" で **GitHub.com** を選択

### エラー: check your internet connection

**原因**: 
- ネットワーク接続の問題
- 誤った hostname を指定

**解決方法**:
1. インターネット接続を確認
1. `gh auth logout` してから `gh auth login` を再実行

## 認証状態の確認

```bash
# 現在の認証状態を確認
gh auth status

# 認証をクリア
gh auth logout

# 認証を更新
gh auth refresh
```

## Issue作成の例

認証後、以下のコマンドでIssueを作成できます:

```bash
gh issue create \
  --title "タイトル" \
  --body "本文" \
  --label "bug,enhancement"
```

または対話的に作成:

```bash
gh issue create
```

## セキュリティのベストプラクティス

1. **トークンは安全に管理**
   - 公開リポジトリにコミットしない
   - 他人と共有しない
   - 定期的に更新する

1. **最小権限の原則**
   - 必要なスコープのみを付与
   - 不要になったトークンは削除

1. **有効期限の設定**
   - 長期間有効なトークンは避ける
   - 推奨: 30日〜90日

1. **ブラウザ認証を推奨**
   - トークンの手動管理が不要
   - 自動的に適切な権限が設定される

## 参考リンク

- [GitHub CLI 公式ドキュメント](https://cli.github.com/manual/)
- [Personal Access Tokens](https://github.com/settings/tokens)
- [GitHub CLI 認証について](https://cli.github.com/manual/gh_auth_login)
