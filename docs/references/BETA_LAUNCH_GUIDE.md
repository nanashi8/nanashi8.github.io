# ホームページ試験運用（ベータ）開始ガイド

本番環境への公開前に確認・実施すべき項目をまとめたチェックリストと実装ガイドです。

---

## 📋 目次

1. [試験運用前チェックリスト](#試験運用前チェックリスト)
2. [機能テスト](#機能テスト)
3. [デプロイとCI/CD](#デプロイとcicd)
4. [監視・障害通知](#監視障害通知)
5. [ユーザー追跡と統計](#ユーザー追跡と統計)
6. [プライバシーとセキュリティ](#プライバシーとセキュリティ)
7. [データ管理とバックアップ](#データ管理とバックアップ)
8. [ユーザーサポート体制](#ユーザーサポート体制)
9. [運用フロー](#運用フロー)
10. [トラブルシューティング](#トラブルシューティング)

---

## 試験運用前チェックリスト

### 必須項目（Must Have）

- [ ] **機能テスト**: 主要フローが動作する（クイズ、読解、スコア保存）
- [ ] **ブラウザ互換**: Chrome、Safari、Firefox、iOS Safariで動作確認
- [ ] **デプロイ確認**: GitHub Pagesへの自動デプロイが動作
- [ ] **エラー監視**: Sentryまたは代替ツールでエラー収集
- [ ] **プライバシーポリシー**: `/privacy` ページを作成・公開
- [ ] **問い合わせ先**: メールアドレスまたはフォームを設置
- [ ] **HTTPS**: 全ページがHTTPSで配信（GitHub Pages標準対応）

### 推奨項目（Should Have）

- [ ] **Cookie同意バナー**: 初回訪問時に同意を取得
- [ ] **ユーザー統計**: ユニークユーザー数・学習単語数の収集
- [ ] **可用性監視**: Uptime Robotなどで5分間隔の死活監視
- [ ] **セキュリティヘッダー**: CSP、X-Frame-Optionsの設定
- [ ] **依存関係スキャン**: GitHub Dependabotの有効化
- [ ] **ログ保持期間**: 90日間保存・自動削除の設定
- [ ] **フィードバック機能**: アンケートやバグ報告フォーム

### オプション項目（Nice to Have）

- [ ] **A/Bテスト**: Feature flagで段階的ロールアウト
- [ ] **パフォーマンス計測**: Lighthouse CI、Core Web Vitals
- [ ] **国際化（i18n）**: 英語対応（将来的）
- [ ] **PWA対応**: オフライン学習機能
- [ ] **ソーシャル共有**: OGP設定（Twitterカードなど）

---

## 機能テスト

### 主要ユーザーフロー

#### 1. 新規ユーザー（初回訪問）

```
アクセス → ホーム画面表示 → クイズ開始 → 10問解答 → スコア表示 → 学習データ保存確認
```

**確認項目**:
- [ ] LocalStorage/IndexedDBにデータが保存される
- [ ] スコアボードに正しい統計が表示される
- [ ] リロードしてもデータが保持される

#### 2. リピーター（2回目以降）

```
アクセス → 前回の続きから開始 → 間違えた単語が優先出題 → 学習履歴の累積
```

**確認項目**:
- [ ] 前回の進捗が正しく読み込まれる
- [ ] 適応的学習（苦手単語の優先出題）が機能
- [ ] 連続学習日数が正しくカウント

#### 3. エラーケース

```
ネットワーク切断 → オフライン通知 → 再接続 → データ同期
```

**確認項目**:
- [ ] オフライン時のエラーメッセージ表示
- [ ] LocalStorageのフォールバック動作
- [ ] データ損失がない

### テストコマンド

```bash
# ローカル開発サーバー起動
npm install
npm run dev

# 本番ビルドのプレビュー
npm run build
npm run preview

# 型チェック
npx tsc --noEmit

# リンター
npm run lint
```

### ブラウザ別テスト

| ブラウザ | バージョン | テスト項目 |
|---------|-----------|-----------|
| Chrome | 最新 | 全機能 |
| Safari | 最新 | 音声合成、LocalStorage |
| Firefox | 最新 | 基本機能 |
| iOS Safari | iOS 15+ | タッチ操作、音声 |
| Android Chrome | 最新 | レスポンシブUI |

---

## デプロイとCI/CD

### GitHub Actions ワークフロー

現在の設定:
```yaml
# .github/workflows/deploy.yml (既存の場合)
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run deploy
```

### デプロイ手順

**通常デプロイ**:
```bash
# コミット
git add .
git commit -m "機能追加: XXX"

# プッシュ（自動デプロイトリガー）
git push origin main

# デプロイ完了確認（約2-5分）
# https://nanashi8.github.io/ をブラウザで確認
```

**緊急ロールバック**:
```bash
# 直前のコミットを取り消し
git revert HEAD
git push origin main

# または特定のコミットに戻す
git reset --hard <commit-hash>
git push -f origin main  # 注意: force push
```

### ステージング環境（オプション）

GitHub Pagesは本番のみなので、ステージングが必要な場合:

**方法1: Netlifyブランチデプロイ**
```bash
# staging ブランチ作成
git checkout -b staging
git push origin staging

# Netlify設定: staging ブランチ → preview-nanashi8.netlify.app
```

**方法2: Vercel Preview**
```bash
# Vercel CLIでプレビュー
npm i -g vercel
vercel --prod=false
```

---

## 監視・障害通知

### 1. エラー監視（Sentry）

#### セットアップ

**1. Sentryアカウント作成**
- https://sentry.io/ でサインアップ（無料: 月5,000イベント）
- プロジェクト作成 → DSN取得

**2. パッケージインストール**
```bash
npm install @sentry/react @sentry/tracing
```

**3. 初期化コード追加**

`src/main.tsx` または `src/index.tsx`:
```typescript
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [new BrowserTracing()],
  environment: import.meta.env.MODE, // 'production' or 'development'
  tracesSampleRate: 0.1, // パフォーマンス計測（10%サンプリング）
  
  // エラーフィルタリング
  beforeSend(event, hint) {
    // LocalStorageエラーは無視
    if (event.exception?.values?.[0]?.value?.includes('localStorage')) {
      return null;
    }
    return event;
  }
});
```

**4. 環境変数設定**

`.env.production`:
```
VITE_SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/7890123
```

GitHub Secrets（推奨）:
```bash
# Settings → Secrets → New repository secret
# Name: VITE_SENTRY_DSN
# Value: https://...
```

#### エラー通知設定

Sentry Dashboard → Alerts → New Alert Rule:
- **条件**: エラー数 > 10件/時間
- **通知先**: メール、Slack、Discord等
- **優先度**: Critical、High、Medium

---

### 2. 可用性監視（Uptime Robot）

#### セットアップ

**1. アカウント作成**
- https://uptimerobot.com/ （無料: 50モニター）

**2. モニター追加**
- Type: HTTP(s)
- URL: `https://nanashi8.github.io/`
- Interval: 5分
- Alert Contacts: メールアドレス

**3. ステータスページ作成**
- Public Status Page: `https://stats.uptimerobot.com/xxxxx`
- ユーザーに障害情報を共有可能

#### 監視項目

| 項目 | 目標値 | アラート条件 |
|------|--------|--------------|
| 稼働率 | 99.9% | 2回連続ダウン |
| レスポンス時間 | < 2秒 | > 5秒が5分継続 |
| SSL証明書 | 有効 | 30日前に警告 |

---

### 3. ログ監視

#### クライアントログ

**開発時のデバッグ**:
```typescript
// src/utils/logger.ts
export const logger = {
  info: (msg: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[INFO] ${msg}`, data);
    }
  },
  error: (msg: string, error?: Error) => {
    console.error(`[ERROR] ${msg}`, error);
    // Sentryに送信
    Sentry.captureException(error);
  }
};
```

#### サーバーログ（サーバレス関数）

Netlify Functions の例:
```javascript
// netlify/functions/track-stats.js
exports.handler = async (event) => {
  console.log('[INFO] Stats received:', {
    userId: event.body.userId,
    timestamp: new Date().toISOString()
  });
  
  try {
    // 処理
  } catch (error) {
    console.error('[ERROR] DB save failed:', error);
    // エラー通知
    await notifySlack(`DB Error: ${error.message}`);
    return { statusCode: 500 };
  }
};
```

**ログ確認**:
```bash
# Netlify CLI
netlify functions:log track-stats

# AWS CloudWatch（Lambda）
aws logs tail /aws/lambda/track-stats --follow
```

---

## ユーザー追跡と統計

### UUID生成とデータ送信

#### クライアント実装

`src/utils/analytics.ts`:
```typescript
// ユーザーID生成（初回のみ）
export function getUserId(): string {
  let userId = localStorage.getItem('user-id');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('user-id', userId);
    localStorage.setItem('user-created-at', new Date().toISOString());
  }
  return userId;
}

// 学習統計を送信
export async function trackLearningStats(progress: UserProgress) {
  const userId = getUserId();
  
  const stats = {
    userId,
    timestamp: new Date().toISOString(),
    learnedWords: Object.keys(progress.wordProgress).length,
    totalQuestions: progress.statistics.totalQuestions,
    totalCorrect: progress.statistics.totalCorrect,
    accuracy: (progress.statistics.totalCorrect / progress.statistics.totalQuestions * 100).toFixed(1),
    studyDays: progress.statistics.studyDates.length,
    lastStudyDate: progress.statistics.lastStudyDate,
    // デバイス情報
    userAgent: navigator.userAgent,
    screenWidth: screen.width,
    screenHeight: screen.height
  };
  
  try {
    await fetch('/.netlify/functions/track-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stats),
      keepalive: true
    });
  } catch (error) {
    console.warn('Stats tracking failed:', error);
  }
}

// 送信タイミング
export function setupAnalytics(progress: UserProgress) {
  // セッション終了時
  window.addEventListener('beforeunload', () => {
    trackLearningStats(progress);
  });
  
  // 5分ごと
  setInterval(() => {
    trackLearningStats(progress);
  }, 5 * 60 * 1000);
}
```

#### サーバー実装（Netlify Functions）

`netlify/functions/track-stats.js`:
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

exports.handler = async (event) => {
  // CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }
  
  try {
    const stats = JSON.parse(event.body);
    
    // データ保存
    const { error } = await supabase
      .from('user_stats')
      .insert({
        user_id: stats.userId,
        timestamp: stats.timestamp,
        learned_words: stats.learnedWords,
        total_questions: stats.totalQuestions,
        total_correct: stats.totalCorrect,
        accuracy: parseFloat(stats.accuracy),
        study_days: stats.studyDays,
        user_agent: stats.userAgent,
        screen_width: stats.screenWidth,
        screen_height: stats.screenHeight
      });
    
    if (error) throw error;
    
    return {
      statusCode: 204,
      headers
    };
  } catch (error) {
    console.error('Stats error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal error' })
    };
  }
};
```

#### データベーススキーマ（Supabase）

```sql
-- user_stats テーブル作成
CREATE TABLE user_stats (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  learned_words INTEGER,
  total_questions INTEGER,
  total_correct INTEGER,
  accuracy DECIMAL(5,2),
  study_days INTEGER,
  user_agent TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX idx_user_stats_timestamp ON user_stats(timestamp DESC);

-- 自動削除（90日後）
CREATE OR REPLACE FUNCTION delete_old_stats()
RETURNS void AS $$
BEGIN
  DELETE FROM user_stats
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- cron（毎日1回実行）
SELECT cron.schedule(
  'delete-old-stats',
  '0 2 * * *', -- 毎日2時
  $$SELECT delete_old_stats();$$
);
```

### 統計データ取得

#### SQLクエリ例

```sql
-- 1. 総ユニークユーザー数
SELECT COUNT(DISTINCT user_id) as total_users
FROM user_stats;

-- 2. ユーザー別学習単語数（上位100）
SELECT 
  user_id,
  MAX(learned_words) as words,
  MAX(timestamp) as last_access,
  MIN(timestamp) as first_access
FROM user_stats
GROUP BY user_id
ORDER BY words DESC
LIMIT 100;

-- 3. アクティブユーザー（過去7日間）
SELECT COUNT(DISTINCT user_id) as active_users
FROM user_stats
WHERE timestamp > NOW() - INTERVAL '7 days';

-- 4. 日別新規ユーザー
SELECT 
  DATE(first_access) as date,
  COUNT(*) as new_users
FROM (
  SELECT user_id, MIN(timestamp) as first_access
  FROM user_stats
  GROUP BY user_id
) sub
GROUP BY DATE(first_access)
ORDER BY date DESC;

-- 5. 学習単語数の分布
SELECT 
  CASE 
    WHEN max_words < 10 THEN '1-10語'
    WHEN max_words < 50 THEN '11-50語'
    WHEN max_words < 100 THEN '51-100語'
    WHEN max_words < 500 THEN '101-500語'
    ELSE '500語以上'
  END as range,
  COUNT(*) as users
FROM (
  SELECT user_id, MAX(learned_words) as max_words
  FROM user_stats
  GROUP BY user_id
) sub
GROUP BY range
ORDER BY range;
```

#### CSVエクスポート

```bash
# Supabase CLIでエクスポート
supabase db dump --data-only -t user_stats > stats.sql

# PostgreSQLクライアントで
psql $DATABASE_URL -c "COPY (
  SELECT user_id, MAX(learned_words) as words, MAX(timestamp) as last_access
  FROM user_stats GROUP BY user_id
) TO STDOUT WITH CSV HEADER" > user-stats.csv
```

---

## プライバシーとセキュリティ

### プライバシーポリシー

`public/privacy.html` を作成:

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>プライバシーポリシー</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
    h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }
    h2 { margin-top: 30px; color: #555; }
  </style>
</head>
<body>
  <h1>プライバシーポリシー</h1>
  <p>最終更新日: 2025年11月21日</p>
  
  <h2>1. 収集する情報</h2>
  <p>当サイトでは、サービス改善のため以下の情報を収集します。</p>
  <ul>
    <li><strong>学習データ</strong>: 学習した単語数、正答率、学習日数</li>
    <li><strong>利用情報</strong>: アクセス日時、閲覧ページ、リファラ</li>
    <li><strong>デバイス情報</strong>: ブラウザ種類、OS、画面サイズ</li>
    <li><strong>匿名識別子</strong>: ランダム生成されたUUID（個人を特定しない）</li>
  </ul>
  
  <h2>2. 情報の利用目的</h2>
  <ul>
    <li>サービスの改善と機能開発</li>
    <li>利用状況の統計分析</li>
    <li>技術的な問題の診断とサポート</li>
  </ul>
  
  <h2>3. 情報の保存期間</h2>
  <p>収集した情報は<strong>90日間</strong>保存し、それ以降は自動削除されます。</p>
  
  <h2>4. 第三者提供</h2>
  <p>収集した情報は、以下の場合を除き第三者に提供しません。</p>
  <ul>
    <li>法令に基づく開示請求があった場合</li>
    <li>ユーザーの同意がある場合</li>
  </ul>
  
  <h2>5. Cookie（クッキー）の使用</h2>
  <p>当サイトでは、学習データの保存にLocalStorage（ブラウザの保存機能）を使用します。</p>
  <p>外部サービス（Google Analytics等）を使用する場合、Cookieが設定されることがあります。</p>
  
  <h2>6. データの削除</h2>
  <p>保存されたデータを削除したい場合:</p>
  <ul>
    <li>ブラウザの設定から「サイトデータを消去」を実行</li>
    <li>または support@example.com へメールで削除依頼</li>
  </ul>
  
  <h2>7. セキュリティ</h2>
  <p>HTTPS通信により、データの盗聴や改ざんを防止しています。</p>
  
  <h2>8. お問い合わせ</h2>
  <p>プライバシーに関するご質問は、以下までご連絡ください。</p>
  <p>メール: <a href="mailto:support@example.com">support@example.com</a></p>
  
  <h2>9. ポリシーの変更</h2>
  <p>本ポリシーは予告なく変更されることがあります。変更時は本ページで通知します。</p>
</body>
</html>
```

### Cookie同意バナー

`src/components/CookieBanner.tsx`:
```typescript
import { useState, useEffect } from 'react';

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  
  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    } else if (consent === 'accepted') {
      // トラッキング開始
      initializeTracking();
    }
  }, []);
  
  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowBanner(false);
    initializeTracking();
  };
  
  const reject = () => {
    localStorage.setItem('cookie-consent', 'rejected');
    setShowBanner(false);
  };
  
  if (!showBanner) return null;
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#333',
      color: 'white',
      padding: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 10000
    }}>
      <p style={{ margin: 0 }}>
        当サイトでは学習データの保存と統計分析のためLocalStorageを使用します。
        <a href="/privacy.html" style={{ color: '#4a9eff', marginLeft: '10px' }}>
          詳細
        </a>
      </p>
      <div>
        <button onClick={accept} style={{
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          marginLeft: '10px',
          cursor: 'pointer',
          borderRadius: '4px'
        }}>
          同意する
        </button>
        <button onClick={reject} style={{
          background: '#666',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          marginLeft: '10px',
          cursor: 'pointer',
          borderRadius: '4px'
        }}>
          拒否
        </button>
      </div>
    </div>
  );
}

function initializeTracking() {
  // トラッキングスクリプトを読み込み
  const script = document.createElement('script');
  script.src = '/analytics.js';
  document.head.appendChild(script);
}
```

`App.tsx` に追加:
```typescript
import { CookieBanner } from './components/CookieBanner';

function App() {
  return (
    <>
      {/* 既存のコンポーネント */}
      <CookieBanner />
    </>
  );
}
```

### セキュリティヘッダー

#### Netlify設定

`netlify.toml`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"
    Content-Security-Policy = """
      default-src 'self';
      script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self' data:;
      connect-src 'self' https://*.supabase.co;
    """
```

#### GitHub Pages（_headers ファイル）

`public/_headers`:
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
```

### 依存関係スキャン

#### GitHub Dependabot有効化

`.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
```

Settings → Security → Dependabot alerts → Enable

#### npm audit自動化

`.github/workflows/security.yml`:
```yaml
name: Security Scan
on:
  schedule:
    - cron: '0 0 * * *' # 毎日0時
  push:
    branches: [main]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm audit --audit-level=high
      - run: npm outdated || true
```

---

## データ管理とバックアップ

### データ保存ポリシー

| データ種類 | 保存場所 | 保持期間 | 削除方法 |
|-----------|---------|---------|---------|
| 学習データ | LocalStorage/IndexedDB | ユーザー削除まで | ブラウザのクリア |
| アクセスログ | Supabase/S3 | 90日 | 自動削除（cron） |
| エラーログ | Sentry | 30日 | Sentry自動削除 |
| バックアップ | S3/Supabase | 30日 | 自動削除 |

### 自動バックアップ

#### Supabase自動バックアップ

Supabase Dashboard → Settings → Backup:
- **頻度**: 毎日
- **保持**: 30日間
- **復元**: ダッシュボードからワンクリック

#### 手動バックアップスクリプト

`scripts/backup-db.sh`:
```bash
#!/bin/bash
# データベースバックアップ

DATE=$(date +%Y%m%d)
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Supabase PostgreSQLダンプ
pg_dump $DATABASE_URL > "$BACKUP_DIR/db-$DATE.sql"

# 圧縮
gzip "$BACKUP_DIR/db-$DATE.sql"

# S3アップロード（オプション）
aws s3 cp "$BACKUP_DIR/db-$DATE.sql.gz" s3://my-backups/

# 30日以上古いバックアップを削除
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "✅ Backup completed: db-$DATE.sql.gz"
```

実行:
```bash
chmod +x scripts/backup-db.sh
./scripts/backup-db.sh

# cron設定（毎日2時）
crontab -e
# 0 2 * * * /path/to/backup-db.sh
```

### データ削除スクリプト

#### 古いログの自動削除

`scripts/cleanup-logs.js`:
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function cleanupOldData() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90); // 90日前
  
  const { data, error } = await supabase
    .from('user_stats')
    .delete()
    .lt('timestamp', cutoffDate.toISOString());
  
  if (error) {
    console.error('Cleanup failed:', error);
  } else {
    console.log(`✅ Deleted ${data?.length || 0} old records`);
  }
}

cleanupOldData();
```

GitHub Actionsで定期実行:
```yaml
# .github/workflows/cleanup.yml
name: Cleanup Old Data
on:
  schedule:
    - cron: '0 3 * * 0' # 毎週日曜3時

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install @supabase/supabase-js
      - run: node scripts/cleanup-logs.js
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
```

---

## ユーザーサポート体制

### 問い合わせフォーム

#### Netlify Forms（最も簡単）

`public/contact.html`:
```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>お問い合わせ</title>
</head>
<body>
  <h1>お問い合わせ</h1>
  
  <form name="contact" method="POST" data-netlify="true">
    <input type="hidden" name="form-name" value="contact">
    
    <label>
      お名前（任意）<br>
      <input type="text" name="name">
    </label><br><br>
    
    <label>
      メールアドレス（任意）<br>
      <input type="email" name="email">
    </label><br><br>
    
    <label>
      お問い合わせ内容<br>
      <textarea name="message" rows="10" required></textarea>
    </label><br><br>
    
    <label>
      <input type="checkbox" name="consent" required>
      プライバシーポリシーに同意します
    </label><br><br>
    
    <button type="submit">送信</button>
  </form>
</body>
</html>
```

Netlify Dashboard → Forms で受信確認。メール通知設定可能。

#### Google Forms（代替）

```html
<!-- Google Formsの埋め込み -->
<iframe src="https://docs.google.com/forms/d/e/xxxxx/viewform?embedded=true" 
  width="640" height="800" frameborder="0">
</iframe>
```

### フィードバック収集

#### アプリ内フィードバックボタン

`src/components/FeedbackButton.tsx`:
```typescript
export function FeedbackButton() {
  const openFeedback = () => {
    window.open('/contact.html', '_blank');
  };
  
  return (
    <button
      onClick={openFeedback}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '50px',
        padding: '15px 25px',
        cursor: 'pointer',
        boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
        fontSize: '16px',
        zIndex: 1000
      }}
    >
      💬 フィードバック
    </button>
  );
}
```

#### 簡易アンケート

クイズ終了後にモーダル表示:
```typescript
function showSurvey() {
  const satisfaction = prompt('満足度を教えてください（1-5）:');
  if (satisfaction) {
    fetch('/.netlify/functions/survey', {
      method: 'POST',
      body: JSON.stringify({ satisfaction, timestamp: new Date() })
    });
  }
}
```

---

## 運用フロー

### 日常運用（週次）

**月曜 10:00**:
```bash
# エラーログ確認
# Sentry Dashboard → Issues（過去7日間）

# アクセス数確認
# Uptime Robot → Logs

# ユーザー統計確認
psql $DATABASE_URL -c "
  SELECT COUNT(DISTINCT user_id) as users
  FROM user_stats
  WHERE timestamp > NOW() - INTERVAL '7 days';
"
```

### 定期メンテナンス（月次）

**毎月1日**:
- [ ] 依存関係の更新（`npm outdated` → 更新検討）
- [ ] セキュリティパッチ適用（`npm audit fix`）
- [ ] バックアップの確認（S3/Supabase）
- [ ] ユーザーフィードバックの確認
- [ ] 統計レポート作成（CSV出力）

### 緊急対応フロー

#### 障害発生時

1. **検知**: Uptime Robot/Sentryからアラート
2. **確認**: ブラウザで実際にアクセス
3. **原因特定**: 
   - Sentry → エラースタックトレース
   - Netlify Logs → デプロイログ
   - GitHub Actions → ビルドログ
4. **対応**:
   - 軽微: 修正 → コミット → 自動デプロイ
   - 重大: ロールバック → 修正 → 再デプロイ
5. **報告**: ユーザーへの通知（必要に応じて）

#### ロールバック手順

```bash
# 直前のコミットに戻す
git log --oneline  # コミット履歴確認
git revert <commit-hash>
git push origin main

# または強制的に戻す
git reset --hard <good-commit-hash>
git push -f origin main

# デプロイ完了を確認
# https://nanashi8.github.io/ をブラウザで確認
```

---

## トラブルシューティング

### よくある問題と解決策

#### 1. データが保存されない

**原因**:
- LocalStorageが無効
- シークレットモード
- 容量超過

**解決**:
```typescript
// storageInfo.ts でチェック
const info = getStorageInfo();
if (info.localStorage.percentage > 80) {
  // 古いデータを削除
  cleanupOldData();
}
```

#### 2. デプロイが失敗する

**確認項目**:
```bash
# ローカルでビルド確認
npm run build

# エラーログ確認
# GitHub Actions → 該当のワークフロー → ログ

# よくある原因
# - 型エラー（npm run type-check）
# - 依存関係不足（npm install）
# - 環境変数未設定（Secrets確認）
```

#### 3. パフォーマンスが遅い

**診断**:
```bash
# Lighthouse実行
npx lighthouse https://nanashi8.github.io/ --view

# バンドルサイズ確認
npm run build -- --analyze
```

**改善**:
- 画像の最適化（WebP変換）
- コード分割（React.lazy）
- キャッシュ設定（service worker）

#### 4. エラーが頻発

**Sentry確認**:
- Dashboard → Issues → ソート（頻度順）
- スタックトレースから原因特定
- 修正 → デプロイ

---

## 参考リンク

- [GitHub Pages ドキュメント](https://docs.github.com/ja/pages)
- [Netlify Functions ガイド](https://docs.netlify.com/functions/overview/)
- [Supabase ドキュメント](https://supabase.com/docs)
- [Sentry React SDK](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Uptime Robot](https://uptimerobot.com/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

---

**最終更新**: 2025年11月21日
