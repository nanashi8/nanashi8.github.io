# アクセスログ取得ガイド

Webサイト管理者がユーザーのアクセス情報（訪問日時、閲覧ページ、リファラなど）を取得・分析する方法を解説します。

---

## 📋 目次

1. [取得できる情報](#取得できる情報)
2. [主な実装方法](#主な実装方法)
3. [静的サイト向け実装（推奨）](#静的サイト向け実装推奨)
4. [サーバーログによる取得](#サーバーログによる取得)
5. [サードパーティ解析ツール](#サードパーティ解析ツール)
6. [プライバシー・法的注意点](#プライバシー法的注意点)
7. [導入チェックリスト](#導入チェックリスト)

---

## 取得できる情報

### 基本情報
- **アクセス日時（timestamp）**: いつ訪問したか
- **URL/ページパス**: どのページを見たか
- **リファラ（referrer）**: どこから来たか（検索エンジン、SNS、直接など）
- **User-Agent**: ブラウザ・OS情報（Chrome/Safari/Firefox、Windows/Mac/iOS等）
- **画面サイズ**: デバイスの解像度（レスポンシブ分析用）

### 追加取得可能な情報
- **IPアドレス**: サーバー側で取得可（⚠️ 個人情報扱い、匿名化推奨）
- **セッション時間**: 滞在時間、離脱時間
- **イベント**: クリック、スクロール、動画再生などのインタラクション
- **コンバージョン**: 購入、登録、ダウンロードなどの目標達成
- **地理情報**: IPから国・都市を推定（精度は限定的）

---

## 主な実装方法

### 方法の比較表

| 方法 | 難易度 | コスト | データ所有 | プライバシー対応 | 適用シーン |
|------|--------|--------|------------|------------------|------------|
| **サーバーログ** | 低 | 無料 | ✅ 自社 | △ IPが生で残る | 自前サーバー運用時 |
| **クライアント送信+サーバレス** | 中 | 低〜中 | ✅ 自社 | ◯ 実装次第 | GitHub Pages等の静的サイト |
| **Google Analytics 4** | 低 | 無料* | ❌ Google | △ Cookie同意必要 | 手軽に詳細分析したい |
| **Matomo（自ホスト）** | 中〜高 | サーバー代 | ✅ 自社 | ◯ 設定で調整可 | プライバシー重視 |
| **Plausible/Fathom** | 低 | 有料 | △ SaaS | ◎ Cookie不要 | シンプル・軽量重視 |

*無料枠あり（月1000万イベントまで）

---

## 静的サイト向け実装（推奨）

GitHub Pages、Netlify、Vercelなど**サーバーログが取れない静的ホスティング**での実装方法。

### アーキテクチャ

```
[ユーザーのブラウザ]
     ↓ ページ読み込み
[静的HTML + tracking.js]
     ↓ アクセス情報をPOST
[サーバレス関数（Lambda/Netlify Functions等）]
     ↓ IP付与・保存
[データベース or ログストレージ（S3/BigQuery等）]
```

### 実装サンプル

#### 1. クライアント側（ブラウザJS）

`public/tracking.js`:
```javascript
(function() {
  const ENDPOINT = 'https://your-site.netlify.app/.netlify/functions/track';
  
  function sendEvent(eventType, data = {}) {
    const payload = {
      type: eventType,
      ts: new Date().toISOString(),
      url: location.pathname + location.search,
      referrer: document.referrer || null,
      ua: navigator.userAgent,
      screen: {
        width: screen.width,
        height: screen.height
      },
      ...data
    };
    
    // Beacon API（ページ離脱時も送信確実）
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(ENDPOINT, blob);
    } else {
      // フォールバック
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(err => console.warn('Tracking failed:', err));
    }
  }
  
  // ページビュー
  window.addEventListener('load', () => sendEvent('pageview'));
  
  // カスタムイベント例（data-track属性をクリック）
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-track]');
    if (target) {
      sendEvent('click', { 
        element: target.getAttribute('data-track'),
        text: target.textContent.trim()
      });
    }
  });
})();
```

HTML に追加:
```html
<script src="/tracking.js" defer></script>
```

#### 2. サーバレス関数（受信側）

**Netlify Functions** の例 (`netlify/functions/track.js`):

```javascript
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event) => {
  // CORSヘッダー
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }
  
  try {
    const body = JSON.parse(event.body);
    const ip = event.headers['x-forwarded-for']?.split(',')[0] || 
               event.headers['client-ip'] || 
               'unknown';
    
    const record = {
      timestamp: body.ts,
      ip: anonymizeIP(ip), // IP匿名化（後述）
      url: body.url,
      referrer: body.referrer,
      userAgent: body.ua,
      screen: body.screen,
      eventType: body.type,
      eventData: body.element || body.text || null
    };
    
    // S3に保存（または DynamoDB/PostgreSQL等）
    const key = `logs/${new Date().toISOString().split('T')[0]}/${Date.now()}.json`;
    await s3.putObject({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: JSON.stringify(record),
      ContentType: 'application/json'
    }).promise();
    
    console.log('Tracked:', record);
    
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal error' })
    };
  }
};

// IP匿名化（最終オクテットをマスク）
function anonymizeIP(ip) {
  if (ip.includes(':')) {
    // IPv6: 最後の2セグメントをマスク
    return ip.split(':').slice(0, -2).join(':') + '::0';
  }
  // IPv4: 最後のオクテットをマスク
  return ip.split('.').slice(0, 3).join('.') + '.0';
}
```

**AWS Lambda + API Gateway** も同様の実装が可能。

#### 3. データ分析

S3に保存したログをBigQueryやAthenaで分析:

```sql
-- 日別アクセス数
SELECT 
  DATE(timestamp) as date,
  COUNT(*) as pageviews
FROM logs
WHERE eventType = 'pageview'
GROUP BY date
ORDER BY date DESC;

-- 人気ページ Top 10
SELECT 
  url,
  COUNT(*) as views
FROM logs
WHERE eventType = 'pageview'
GROUP BY url
ORDER BY views DESC
LIMIT 10;

-- リファラ分析
SELECT 
  CASE 
    WHEN referrer IS NULL THEN 'Direct'
    WHEN referrer LIKE '%google%' THEN 'Google'
    WHEN referrer LIKE '%twitter%' THEN 'Twitter'
    ELSE 'Other'
  END as source,
  COUNT(*) as visits
FROM logs
GROUP BY source
ORDER BY visits DESC;
```

---

## サーバーログによる取得

自前サーバー（Nginx、Apache等）を運用している場合、サーバーのアクセスログを活用。

### Nginx の場合

#### ログフォーマット確認

`/etc/nginx/nginx.conf`:
```nginx
log_format combined '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent"';

access_log /var/log/nginx/access.log combined;
```

#### ログ例
```
192.168.1.100 - - [21/Nov/2025:14:23:45 +0900] "GET /quiz HTTP/1.1" 200 4521 "https://google.com/" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
```

### ログ解析コマンド

#### 基本集計（awk）

```bash
# 今日のアクセス数
grep "$(date +%d/%b/%Y)" /var/log/nginx/access.log | wc -l

# IP別アクセス上位10
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10

# URL別アクセス上位10
awk '{print $7}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10

# ステータスコード別集計
awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn

# リファラ別集計
awk -F'"' '{print $4}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -20

# User-Agent別集計（ボット検出用）
awk -F'"' '{print $6}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -20

# 時間帯別アクセス（時間のみ抽出）
awk -F'[: []' '{print $3}' /var/log/nginx/access.log | sort | uniq -c

# エラーログ（4xx, 5xx）のみ抽出
awk '$9 ~ /^[45]/ {print $0}' /var/log/nginx/access.log | tail -20
```

#### 高度な分析ツール

**GoAccess**（リアルタイムWeb UI）:
```bash
# インストール（Ubuntu/Debian）
sudo apt install goaccess

# リアルタイム分析（ターミナル）
goaccess /var/log/nginx/access.log -c

# HTML レポート生成
goaccess /var/log/nginx/access.log -o /var/www/html/report.html --log-format=COMBINED

# リアルタイムHTML（WebSocket）
goaccess /var/log/nginx/access.log -o /var/www/html/report.html --log-format=COMBINED --real-time-html
```

**ELK Stack**（Elasticsearch + Logstash + Kibana）:
- Logstash でログ収集・パース
- Elasticsearch に保存
- Kibana でダッシュボード作成

```yaml
# docker-compose.yml 簡易例
version: '3'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
    ports:
      - 9200:9200
  
  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
      - /var/log/nginx:/logs
    depends_on:
      - elasticsearch
  
  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - 5601:5601
    depends_on:
      - elasticsearch
```

---

## サードパーティ解析ツール

### Google Analytics 4（GA4）

**メリット**:
- 無料（月1000万イベントまで）
- 詳細なユーザー行動分析（セッション、コンバージョン、ファネル等）
- BigQuery連携でカスタム分析可能

**デメリット**:
- データはGoogleに送信される
- Cookie使用のため同意取得が必要（GDPR等）
- 学習コストがやや高い

**導入**:
```html
<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX', {
    anonymize_ip: true, // IP匿名化
    cookie_flags: 'SameSite=None;Secure'
  });
</script>
```

### Matomo（旧Piwik）

**メリット**:
- オープンソース、自ホスト可能（データを自分で管理）
- GA4に近い機能（ヒートマップ、A/Bテスト等）
- GDPR準拠の設定オプション豊富

**デメリット**:
- 自ホストの場合はサーバー・DB管理が必要
- クラウド版は有料（月€19〜）

**Docker導入例**:
```bash
# docker-compose.yml
version: '3'
services:
  matomo:
    image: matomo:latest
    ports:
      - 8080:80
    environment:
      - MATOMO_DATABASE_HOST=db
      - MATOMO_DATABASE_DBNAME=matomo
      - MATOMO_DATABASE_USERNAME=matomo
      - MATOMO_DATABASE_PASSWORD=secret
    volumes:
      - matomo:/var/www/html
  
  db:
    image: mariadb:10
    environment:
      - MYSQL_ROOT_PASSWORD=rootsecret
      - MYSQL_DATABASE=matomo
      - MYSQL_USER=matomo
      - MYSQL_PASSWORD=secret
    volumes:
      - db:/var/lib/mysql

volumes:
  matomo:
  db:
```

起動:
```bash
docker-compose up -d
# http://localhost:8080 でセットアップ開始
```

### Plausible / Fathom

**メリット**:
- シンプルで軽量（スクリプト1KB未満）
- Cookie不要でGDPR準拠
- プライバシー重視

**デメリット**:
- 有料（Plausible: 月$9〜、Fathom: 月$14〜）
- 機能はシンプル（詳細分析には不向き）

**導入例（Plausible）**:
```html
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
```

---

## プライバシー・法的注意点

### 日本の法律

**個人情報保護法**:
- IPアドレスは「個人に関する情報」として扱われる可能性がある
- 利用目的を特定し、プライバシーポリシーに明記
- 第三者提供（GA等）は本人同意が原則

### GDPR（EU）/ ePrivacy

- Cookie使用には**事前同意（オプトイン）**が必要
- データ主体の権利（アクセス権、削除権等）を保証
- データ保持期間を最小限に

### 実装すべきこと

#### 1. プライバシーポリシーへの記載

```markdown
## アクセスログの取得について

当サイトでは、サービス改善とセキュリティ確保のため、以下の情報を自動的に収集します。

### 収集する情報
- アクセス日時
- 閲覧ページのURL
- リファラ（参照元サイト）
- ブラウザ・OS情報（User-Agent）
- IPアドレス（匿名化処理を実施）
- 画面解像度

### 利用目的
- サイトの利用状況分析
- コンテンツ改善
- セキュリティインシデント対応

### 保存期間
- 90日間（それ以降は自動削除）

### 第三者提供
- 原則として第三者に提供しません
- ただし、法令に基づく開示請求には応じます

### お問い合わせ
- メール: privacy@example.com
```

#### 2. Cookie同意バナー

```html
<div id="cookie-banner" style="position: fixed; bottom: 0; width: 100%; background: #333; color: white; padding: 15px; display: none;">
  <p>
    当サイトではアクセス分析のためCookieを使用します。
    <a href="/privacy" style="color: #4a9eff;">詳細</a>
  </p>
  <button onclick="acceptCookies()">同意する</button>
  <button onclick="rejectCookies()">拒否</button>
</div>

<script>
  // 同意状態の確認
  if (!localStorage.getItem('cookieConsent')) {
    document.getElementById('cookie-banner').style.display = 'block';
  } else if (localStorage.getItem('cookieConsent') === 'accepted') {
    // トラッキング開始
    loadTrackingScript();
  }
  
  function acceptCookies() {
    localStorage.setItem('cookieConsent', 'accepted');
    document.getElementById('cookie-banner').style.display = 'none';
    loadTrackingScript();
  }
  
  function rejectCookies() {
    localStorage.setItem('cookieConsent', 'rejected');
    document.getElementById('cookie-banner').style.display = 'none';
  }
  
  function loadTrackingScript() {
    // GA4やMatomoのスクリプトをここで読み込む
    const script = document.createElement('script');
    script.src = '/tracking.js';
    document.head.appendChild(script);
  }
</script>
```

#### 3. IP匿名化の実装

```javascript
// IPv4: 192.168.1.100 → 192.168.1.0
function anonymizeIPv4(ip) {
  return ip.split('.').slice(0, 3).join('.') + '.0';
}

// IPv6: 2001:0db8:85a3::8a2e:0370:7334 → 2001:0db8:85a3::
function anonymizeIPv6(ip) {
  return ip.split(':').slice(0, 3).join(':') + '::';
}

function anonymizeIP(ip) {
  return ip.includes(':') ? anonymizeIPv6(ip) : anonymizeIPv4(ip);
}
```

#### 4. データ自動削除

```javascript
// サーバーサイドで定期実行（例: cron）
const deleteOldLogs = async () => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90); // 90日前
  
  // S3の場合
  const objects = await s3.listObjectsV2({
    Bucket: 'my-logs',
    Prefix: 'logs/'
  }).promise();
  
  const toDelete = objects.Contents.filter(obj => 
    new Date(obj.LastModified) < cutoffDate
  );
  
  if (toDelete.length > 0) {
    await s3.deleteObjects({
      Bucket: 'my-logs',
      Delete: {
        Objects: toDelete.map(obj => ({ Key: obj.Key }))
      }
    }).promise();
    console.log(`Deleted ${toDelete.length} old log files`);
  }
};

// 毎日実行
setInterval(deleteOldLogs, 24 * 60 * 60 * 1000);
```

---

## 導入チェックリスト

### 準備段階

- [ ] 収集する情報の種類を決定（必要最小限に）
- [ ] データ保存場所を決定（S3/DB/SaaS）
- [ ] 保存期間を決定（推奨: 30〜90日）
- [ ] プライバシーポリシーを作成・更新

### 実装段階

- [ ] トラッキングコード実装（クライアント側）
- [ ] 受信エンドポイント実装（サーバレス関数等）
- [ ] IP匿名化の実装
- [ ] Cookie同意バナーの実装（必要な場合）
- [ ] データ自動削除の仕組み構築

### テスト段階

- [ ] 開発環境でデータ送信をテスト
- [ ] 各ブラウザ・デバイスで動作確認
- [ ] プライバシーモード・広告ブロッカーでの挙動確認
- [ ] データが正しく保存されているか確認

### 運用段階

- [ ] ダッシュボード・分析クエリの作成
- [ ] 異常アクセスの監視設定
- [ ] 定期的なログ確認（週次/月次）
- [ ] データ削除が自動実行されているか確認

---

## おすすめツール選択ガイド

### ケース別推奨

| 状況 | 推奨ツール | 理由 |
|------|-----------|------|
| とにかく簡単に始めたい | Google Analytics 4 | 設定5分、レポート豊富 |
| プライバシー重視 | Plausible または Matomo | Cookie不要、データ自社管理 |
| GitHub Pages使用中 | 自作（Netlify Functions） | コスト最小、完全制御 |
| 自前サーバー運用 | Nginx/Apache ログ + GoAccess | 追加コスト不要、軽量 |
| 大規模サイト | ELK Stack または Google BigQuery | スケーラブル、高度な分析 |
| eコマース | Google Analytics 4 + GTM | eコマース機能充実 |

### コスト比較（月間10万PV想定）

| ツール | コスト | 備考 |
|--------|--------|------|
| Nginx/Apache ログ | 無料 | サーバー代のみ |
| 自作（Netlify Functions） | $0〜$10 | 無料枠内で収まる場合も |
| Google Analytics 4 | 無料 | 1000万イベント/月まで |
| Plausible | $9/月 | 10万PVまで |
| Matomo Cloud | €19/月 | 約3000円 |
| Matomo（自ホスト） | サーバー代 | VPS $5〜 |

---

## まとめ

### 静的サイトの場合
1. **最速**: Google Analytics 4（5分で導入、プライバシーポリシー必須）
2. **バランス型**: Plausible（軽量、Cookie不要、有料）
3. **完全制御**: 自作トラッキング（Netlify Functions + S3等）

### 自前サーバーの場合
1. Nginx/Apacheのアクセスログ活用
2. GoAccessで可視化
3. 必要に応じてELKやMatomoを追加

### 必ず対応すること
- ✅ プライバシーポリシーへの記載
- ✅ IP匿名化
- ✅ データ保存期間の設定と自動削除
- ✅ Cookie使用時は同意取得

---

## 参考リンク

- [Google Analytics 4 公式ドキュメント](https://support.google.com/analytics/answer/10089681)
- [Matomo 公式サイト](https://matomo.org/)
- [Plausible Analytics](https://plausible.io/)
- [GoAccess](https://goaccess.io/)
- [個人情報保護委員会 - 個人情報保護法](https://www.ppc.go.jp/)
- [GDPR（EU一般データ保護規則）](https://gdpr.eu/)

---

**最終更新**: 2025年11月21日
