/**
 * Service Worker for Update Detection & Cache Management
 * 生徒が学習中のセッション継続性を保証する
 */

// NOTE: 端末間でUI/データの差が出ないよう、更新時に確実にキャッシュを切り替える。
// キャッシュ戦略を変えた場合は必ずバージョンを更新すること。
const CACHE_VERSION = 'v2-app-cache';
const LOCAL_DATA_PACK_CACHE = 'v2-local-data-pack-cache';
const CACHE_ASSETS = ['/', '/index.html', '/manifest.json'];

// インストール: 初期キャッシュ設定
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => {
        console.log('[SW] Cache opened:', CACHE_VERSION);
        return cache.addAll(CACHE_ASSETS);
      })
      .then(() => {
        // 新しいサービスワーカーは即座にアクティブになる
        return self.skipWaiting();
      })
  );
});

// アクティベート: 古いキャッシュ削除
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // ローカル教材キャッシュは生徒端末に配布されたデータなので、アプリ更新で消さない
            if (cacheName !== CACHE_VERSION && cacheName !== LOCAL_DATA_PACK_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // 即座にすべてのクライアントを制御下に置く
        return self.clients.claim();
      })
  );
});

// フェッチ: ネットワーク優先＋キャッシュフォールバック
self.addEventListener('fetch', (event) => {
  // 開発サーバー（Vite HMR）のリクエストは無視
  try {
    const url = new URL(event.request.url);

    // Vite開発サーバーの特殊リクエストはService Workerでインターセプトしない
    if (
      url.pathname.startsWith('/@') || // @vite/client, @react-refresh など
      url.pathname.startsWith('/src/') || // ソースファイル直接アクセス
      (url.pathname.includes('?') && url.searchParams.has('t')) // Vite HMRのタイムスタンプクエリ
    ) {
      return; // Service Workerを通さない
    }
  } catch {
    // URL解析失敗は通常フローへ
  }

  // ローカル教材: /data/**
  // 以前は「ローカル教材キャッシュ最優先」だったが、
  // それだと端末ごとに古い教材が残り、モバイル/非モバイルで内容がズレる原因になる。
  // ここではネットワーク優先で取得し、失敗時のみキャッシュ（配布データ/過去取得）を返す。
  try {
    const url = new URL(event.request.url);
    if (
      event.request.method === 'GET' &&
      url.origin === self.location.origin &&
      url.pathname.startsWith('/data/')
    ) {
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            if (response && response.ok) {
              // /data/ はローカル教材キャッシュへ保存（オフライン復帰用）
              caches.open(LOCAL_DATA_PACK_CACHE).then((cache) => {
                cache.put(event.request, response.clone());
              });
            }
            return response;
          })
          .catch(() =>
            caches
              .open(LOCAL_DATA_PACK_CACHE)
              .then((cache) => cache.match(event.request))
              .then((cached) => cached || caches.match(event.request))
          )
      );
      return;
    }
  } catch {
    // URL解析失敗は通常フローへ
  }

  // HTMLはネットワーク優先（最新版を常に取得）
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // キャッシュに保存
          if (response.ok) {
            const cache = caches.open(CACHE_VERSION);
            cache.then((c) => c.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // オフライン時はキャッシュから復帰
          return caches.match(event.request).then((cachedResponse) => {
            return (
              cachedResponse ||
              new Response('オフラインです。インターネット接続を確認してください。', {
                status: 503,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' },
              })
            );
          });
        })
    );
    return;
  }

  // JavaScript/CSS: ネットワーク優先（最新版を確実に反映）
  // ※ キャッシュ優先にすると、端末差で古いUIが残りやすい。
  if (event.request.url.endsWith('.js') || event.request.url.endsWith('.css')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(event.request, response.clone());
            });
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || new Response('Resource not available', { status: 404 });
          })
        )
    );
    return;
  }

  // その他: ネットワーク優先＋キャッシュフォールバック
  event.respondWith(
    fetch(event.request)
      .then((response) => response)
      .catch(() => caches.match(event.request))
  );
});

// メッセージ受信: クライアントからのアップデート確認コマンド
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    // サービスワーカーの更新をチェック
    self.registration.update().then(() => {
      console.log('[SW] Update check completed');
    });
  }

  // 明示的に即時有効化したい場合（将来の拡張用）
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
