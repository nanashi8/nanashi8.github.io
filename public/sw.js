/**
 * Service Worker for Update Detection & Cache Management
 * 生徒が学習中のセッション継続性を保証する
 */

const CACHE_VERSION = 'v1-app-cache';
const LOCAL_DATA_PACK_CACHE = 'v1-local-data-pack-cache';
const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// インストール: 初期キャッシュ設定
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log('[SW] Cache opened:', CACHE_VERSION);
      return cache.addAll(CACHE_ASSETS);
    }).then(() => {
      // 新しいサービスワーカーは即座にアクティブになる
      return self.skipWaiting();
    })
  );
});

// アクティベート: 古いキャッシュ削除
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // ローカル教材キャッシュは生徒端末に配布されたデータなので、アプリ更新で消さない
          if (cacheName !== CACHE_VERSION && cacheName !== LOCAL_DATA_PACK_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 即座にすべてのクライアントを制御下に置く
      return self.clients.claim();
    })
  );
});

// フェッチ: ネットワーク優先＋キャッシュフォールバック
self.addEventListener('fetch', (event) => {
  // ローカル教材: /data/** はローカル教材キャッシュを最優先で返す（全タブ対応の差し替え）
  try {
    const url = new URL(event.request.url);
    if (
      event.request.method === 'GET' &&
      url.origin === self.location.origin &&
      url.pathname.startsWith('/data/')
    ) {
      event.respondWith(
        caches
          .open(LOCAL_DATA_PACK_CACHE)
          .then((cache) => cache.match(event.request))
          .then((localResponse) => {
            if (localResponse) return localResponse;
            // ローカルに無ければ通常のネットワーク取得（必要なら既存のフォールバックへ）
            return fetch(event.request).catch(() => caches.match(event.request));
          })
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
            return cachedResponse || new Response('オフラインです。インターネット接続を確認してください。', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
          });
        })
    );
    return;
  }

  // JavaScript/CSS: キャッシュ優先（古いキャッシュで高速化）
  if (event.request.url.endsWith('.js') || event.request.url.endsWith('.css')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // バックグラウンドで最新版を取得（キャッシュを更新）
          fetch(event.request).then((response) => {
            if (response.ok) {
              caches.open(CACHE_VERSION).then((cache) => {
                cache.put(event.request, response.clone());
              });
            }
          }).catch(() => {
            // ネットワークエラーでもキャッシュ版で動作
          });
          return cachedResponse;
        }
        return fetch(event.request).catch(() => {
          return new Response('Resource not available', { status: 404 });
        });
      })
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
});
