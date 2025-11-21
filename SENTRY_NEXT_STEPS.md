# 🎉 Sentry導入完了！

## ✅ 完了した作業

1. **@sentry/react パッケージ追加** - `package.json`
2. **Sentry初期化コード追加** - `src/main.tsx`
3. **環境変数ファイル作成** - `.env.production`
4. **パッケージインストール** - `npm install` 完了
5. **ビルド確認** - `npm run build` 成功

---

## 📝 次にやること（3分）

### ステップ1: Sentryアカウント作成

1. ブラウザで開く: https://sentry.io/signup/
2. **GitHub アカウントでサインアップ**（推奨）
3. プロジェクト作成:
   ```
   Platform: React
   Project name: nanashi8-quiz-app
   ```
4. **DSN をコピー** （次のステップで使います）
   ```
   例: https://abc123@o456789.ingest.sentry.io/0123456
   ```

---

### ステップ2: DSN を GitHub Secrets に設定

1. GitHub リポジトリを開く:
   https://github.com/nanashi8/nanashi8.github.io

2. **Settings** → **Secrets and variables** → **Actions**

3. **New repository secret** をクリック

4. 入力:
   ```
   Name: VITE_SENTRY_DSN
   Secret: （ステップ1でコピーしたDSNを貼り付け）
   ```

5. **Add secret** をクリック

---

### ステップ3: デプロイ

```bash
# コミット
git add .
git commit -m "Add Sentry error monitoring"

# プッシュ & デプロイ
git push origin main
npm run deploy
```

---

### ステップ4: 動作確認（デプロイ後）

1. **本番サイトにアクセス**:
   https://nanashi8.github.io/

2. **開発者ツールを開く** (F12)

3. **コンソールで実行**:
   ```javascript
   throw new Error("Sentryテスト");
   ```

4. **Sentry Dashboard で確認**:
   - https://sentry.io/ にログイン
   - Projects → nanashi8-quiz-app
   - Issues タブ
   - "Sentryテスト" が表示されればOK ✅

---

## 🔔 通知設定（オプション）

### メール通知

Sentry Dashboard → Settings → Notifications → Alert Rules

```
条件: エラー数 > 10件/1時間
通知先: あなたのメールアドレス
重要度: High
```

### Slack通知

Sentry Dashboard → Settings → Integrations → Slack

1. Slackワークスペースに接続
2. 通知チャンネル選択（例: #alerts）
3. Alert Rule作成

---

## 📊 収集される情報

### ✅ 収集されるもの
- エラーメッセージ
- ファイル名・行番号
- ブラウザ・OS情報
- タイムスタンプ

### ❌ 収集されないもの
- パスワード
- LocalStorageの内容
- 個人を特定する情報

---

## 💰 料金

**無料プラン**: 月5,000エラーまで

あなたのサイトの場合、月100〜1,000エラー程度と予想されるため、**無料プランで十分**です。

---

## 📖 詳細ドキュメント

すべての手順は `SENTRY_SETUP.md` に記載されています。

---

## ❓ トラブルシューティング

### エラーが表示されない

1. **DSNが設定されているか確認**:
   GitHub → Settings → Secrets → `VITE_SENTRY_DSN` があるか

2. **本番ビルドか確認**:
   開発環境（`npm run dev`）ではSentryは無効
   本番（`npm run build`）で有効化

3. **コンソールでエラー確認**:
   ```
   Failed to send to Sentry
   → DSNが間違っている
   ```

---

**準備完了！次のステップに進んでください** 🚀
