# Sentry エラー監視 設定ガイド

このガイドに従って、3分でSentryのエラー監視を有効化できます。

---

## ステップ1: Sentryアカウント作成（2分）

### 1. Sentryにアクセス
https://sentry.io/signup/

### 2. アカウント作成
- **GitHub アカウントでサインアップ**（推奨）
  - "Sign up with GitHub" をクリック
  - GitHubで認証
  
または
- メールアドレスで登録
  - メール、パスワードを入力
  - メール認証

### 3. プロジェクト作成
```
Select a platform: React を選択
Project name: nanashi8-quiz-app（任意の名前）
Team: My Team（デフォルト）
```

### 4. DSN（接続キー）をコピー
```
表示される画面で DSN をコピー:

例:
https://1234567890abcdef@o123456.ingest.sentry.io/7890123
       ↑この文字列全体をコピー
```

---

## ステップ2: DSNを環境変数に設定（1分）

### 方法A: GitHub Secrets に設定（推奨）

1. **GitHubリポジトリを開く**
   https://github.com/nanashi8/nanashi8.github.io

2. **Settings → Secrets and variables → Actions**

3. **New repository secret** をクリック

4. **入力**
   ```
   Name: VITE_SENTRY_DSN
   Secret: （コピーしたDSNを貼り付け）
   ```

5. **Add secret** をクリック

### 方法B: ローカルファイルに設定（テスト用）

`.env.production` ファイルを編集:
```bash
VITE_SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/xxxxxx
```

⚠️ **注意**: `.env.production` は `.gitignore` に追加して、GitHubにコミットしないこと

---

## ステップ3: パッケージインストールとビルド

```bash
# 依存関係のインストール
npm install

# ローカルで動作確認
npm run dev

# 本番ビルド
npm run build

# デプロイ
npm run deploy
```

---

## ステップ4: 動作確認

### テストイベントでの動作確認

動作確認は以下のいずれかの方法を推奨します（生のthrowは推奨しません）。

- Sentryのダッシュボードから「Send a test event（テストイベント送信）」を利用する。
- ローカルでデバッグし、SDKのAPIを使って明示的にイベントを送る（例）:
```javascript
// 開発時の一時的なテスト例（強制的な例外投出は避ける）
// import * as Sentry from "@sentry/react";
// Sentry.captureException(new Error("Sentryテスト（テスト用イベント）"));
```

### Sentryで確認

1. https://sentry.io/ にログイン
2. Projects → nanashi8-quiz-app
3. Issues タブを確認
4. テストイベントが表示されればOK

---

## ステップ5: 通知設定（オプション）

### メール通知

**Sentry Dashboard → Settings → Notifications**

- **Alert Rules** → New Alert Rule
  ```
  条件: エラー数 > 10件/1時間
  通知先: メールアドレス
  重要度: High
  ```

### Slack通知

**Sentry Dashboard → Settings → Integrations → Slack**

1. "Install Slack" をクリック
2. Slackワークスペースを選択
3. チャンネルを選択（例: #alerts）
4. Alert Rule を作成
   ```
   When: エラーが発生したら
   Then: #alerts に通知
   ```

---

## 現在の設定内容

### エラー監視の対象

✅ **JavaScript エラー**: `TypeError`, `ReferenceError` 等  
✅ **Promise エラー**: `unhandledrejection`  
✅ **ネットワークエラー**: `fetch` 失敗  
✅ **ユーザー操作時のエラー**: クリック、入力時のバグ

### 除外されるエラー（ノイズ削減）

❌ **LocalStorage エラー**: 容量超過（よくある非クリティカル）  
❌ **ResizeObserver エラー**: ブラウザの既知のバグ

### 収集される情報

- **エラー内容**: メッセージ、スタックトレース
- **発生場所**: ファイル名、行番号
- **環境情報**: ブラウザ、OS、画面サイズ
- **タイムスタンプ**: 発生日時
- **ユーザー操作履歴**: エラー前の10アクション（リプレイ機能）

### 収集されない情報

- パスワード、クレジットカード等の機密情報
- LocalStorageの内容
- Cookie（自動マスキング）

---

## トラブルシューティング

### エラーが表示されない

**確認項目**:
1. DSNが正しく設定されているか
   ```bash
   # GitHub Actionsのログで確認
   # Settings → Secrets で VITE_SENTRY_DSN が登録されているか
   ```

2. 本番ビルドか確認
   ```bash
   # 開発環境（npm run dev）ではSentryは無効
   # 本番ビルド（npm run build）で有効化される
   ```

3. ブラウザのコンソールでエラー確認
   ```
   Failed to send error to Sentry: ...
   → DSNが間違っている可能性
   ```

### エラーが多すぎる

**無料枠（月5,000件）を超える場合**:

1. **サンプリング率を下げる**
   ```typescript
   // src/main.tsx
   tracesSampleRate: 0.05, // 5%にサンプリング
   ```

2. **フィルタを追加**
   ```typescript
   beforeSend(event) {
     // 特定のエラーを除外
     if (event.message?.includes('Network error')) {
       return null;
     }
     return event;
   }
   ```

---

## 料金プラン

| プラン | 月額 | エラー数 | 推奨用途 |
|--------|------|---------|---------|
| Developer | **無料** | 5,000件 | 個人プロジェクト（あなたのサイト） |
| Team | $26 | 100,000件 | 小規模チーム |
| Business | $80 | 1,000,000件 | 中規模企業 |

**あなたのサイトの場合**: 無料プランで十分（月100〜1,000件程度と予想）

---

## プライバシーポリシーへの記載

Sentryを使用する場合、プライバシーポリシーに以下を追加:

```
## エラー監視ツールの使用

当サイトでは、サービス品質向上のため、エラー監視ツール（Sentry）を使用しています。

### 収集する情報
- エラーの内容と発生場所
- ブラウザ・OS情報
- タイムスタンプ

### 利用目的
- 技術的な問題の早期発見と修正

### 第三者提供
- Sentry（Functional Software, Inc.、米国）にデータが送信されます
- データは暗号化され、90日間保存後に自動削除されます

### データの削除
- エラー情報の削除を希望する場合、support@example.com までご連絡ください
```

---

## 参考リンク

- [Sentry 公式ドキュメント](https://docs.sentry.io/)
- [React SDK ガイド](https://docs.sentry.io/platforms/javascript/guides/react/)
- [プライバシーとセキュリティ](https://sentry.io/security/)
- [料金プラン](https://sentry.io/pricing/)

---

**設定完了後、このファイルは削除してもOKです**

最終更新: 2025年11月21日
