/**
 * 環境に応じたロギングユーティリティ
 * 
 * ログレベル:
 * - production: エラーのみ
 * - development: 警告とエラーのみ（デバッグログは無効）
 * - debug: すべてのログ（URL に ?debug=true を追加）
 */

const isDevelopment = import.meta.env.DEV;
const isDebugMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === 'true';

export const logger = {
  log: (...args: unknown[]) => {
    // デバッグモードのみ出力
    if (isDebugMode) {
      console.log(...args);
    }
  },
  
  warn: (...args: unknown[]) => {
    // 開発環境とデバッグモードで出力
    if (isDevelopment || isDebugMode) {
      console.warn(...args);
    }
  },
  
  error: (...args: unknown[]) => {
    // 常に出力
    console.error(...args);
  },
  
  debug: (...args: unknown[]) => {
    // デバッグモードのみ出力
    if (isDebugMode) {
      console.debug(...args);
    }
  },
  
  info: (...args: unknown[]) => {
    // デバッグモードのみ出力
    if (isDebugMode) {
      console.info(...args);
    }
  },
};
