import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import * as Sentry from "@sentry/react";

// Sentry初期化（エラー監視）
// 本番環境のみ有効化
if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN || "",
    environment: import.meta.env.MODE,
    
    // パフォーマンス計測（10%サンプリング）
    tracesSampleRate: 0.1,
    
    // セッションリプレイ（エラー時のみ）
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    
    // エラーフィルタリング（不要なエラーを除外）
    beforeSend(event, hint) {
      // LocalStorageエラーは無視（よくある非クリティカルエラー）
      if (event.exception?.values?.[0]?.value?.includes('localStorage')) {
        return null;
      }
      
      // ResizeObserverエラーは無視（ブラウザの既知のバグ）
      if (event.message?.includes('ResizeObserver')) {
        return null;
      }
      
      return event;
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
