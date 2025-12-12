import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index-tailwind.css'
import * as Sentry from "@sentry/react";

// ダークモードの初期化（アプリ起動時に実行）
const initializeDarkMode = () => {
  const saved = localStorage.getItem('darkMode');
  let mode: 'light' | 'dark' | 'system' = 'system';
  
  if (saved === 'system' || saved === 'light' || saved === 'dark') {
    mode = saved;
  } else if (saved === 'true') {
    // 旧形式（boolean）からの移行
    mode = 'dark';
    localStorage.setItem('darkMode', 'dark');
  } else if (saved === 'false') {
    mode = 'light';
    localStorage.setItem('darkMode', 'light');
  }
  
  // ダークモードを適用（Tailwindのdarkクラスを使用）
  let isDark = false;
  if (mode === 'system') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  } else {
    isDark = mode === 'dark';
  }
  
  // Tailwind用のdarkクラスに変更
  document.documentElement.classList.toggle('dark', isDark);
};

// ダークモードを即座に初期化（FLASHを防ぐ）
initializeDarkMode();

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
      // Sentry接続テスト用の擬似エラーは無視
      const msg = event.message || event.exception?.values?.[0]?.value || '';
      if (msg.includes('Sentry接続テスト') || msg.includes('Sentryテスト') || msg.includes('🎯 Sentry')) {
        return null;
      }
      // エラーログUI（ErrorLogPanel/ErrorBadge）に起因するエラーは無視
      const frames = event.exception?.values?.[0]?.stacktrace?.frames || [];
      if (Array.isArray(frames)) {
        const uiError = frames.some((f: { function?: string; filename?: string }) => {
          const fn = `${f.function || ''}`;
          const file = `${f.filename || ''}`;
          return fn.includes('ErrorLogPanel') || fn.includes('ErrorBadge') || file.includes('ErrorLogPanel') || file.includes('ErrorBadge');
        });
        if (uiError) return null;
      }
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
