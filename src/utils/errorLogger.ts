// エラーログ収集システム
import { logger } from '@/utils/logger';

export interface ErrorLog {
  timestamp: number;
  message: string;
  stack?: string;
  type: 'error' | 'warn' | 'info';
  source?: string;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 100;
  private originalConsoleError: typeof console.error;
  private originalConsoleWarn: typeof console.warn;
  private originalConsoleLog: typeof console.log;
  private ignorePatterns = [
    'Sentry接続テスト',
    'Sentryテスト',
    '🎯 Sentry',
    'ResizeObserver'
  ];

  constructor() {
    this.originalConsoleError = console.error.bind(console);
    this.originalConsoleWarn = console.warn.bind(console);
    this.originalConsoleLog = console.log.bind(console);
  }

  // コンソールをインターセプト
  interceptConsole(): void {
    console.error = (...args: any[]) => {
      this.addLog('error', args);
      this.originalConsoleError(...args);
    };

    console.warn = (...args: any[]) => {
      this.addLog('warn', args);
      this.originalConsoleWarn(...args);
    };

    // 重要なログのみキャプチャ
    const originalLog = console.log.bind(console);
    console.log = (...args: any[]) => {
      const message = args.join(' ');
      if (message.includes('❌') || message.includes('⚠️') || message.includes('🔄') || message.includes('Migration')) {
        this.addLog('info', args);
      }
      originalLog(...args);
    };
  }

  private addLog(type: 'error' | 'warn' | 'info', args: any[]): void {
    const message = args.map(arg => {
      if (arg instanceof Error) {
        return arg.message;
      }
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');

    // 除外パターンのメッセージは無視
    if (this.ignorePatterns.some(p => message.includes(p))) {
      return;
    }

    // エラーウィンドウ自身に起因するものは無視（スタック/引数にコンポーネント名が含まれる場合）
    const stackStr = args.find(arg => arg instanceof Error)?.stack || '';
    if ((stackStr && (stackStr.includes('ErrorLogPanel') || stackStr.includes('ErrorBadge'))) ||
        message.includes('ErrorLogPanel') || message.includes('ErrorBadge')) {
      return;
    }

    const log: ErrorLog = {
      timestamp: Date.now(),
      message,
      type,
      stack: args.find(arg => arg instanceof Error)?.stack
    };

    this.logs.push(log);
    
    // 最大数を超えたら古いログを削除
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // LocalStorageに保存（診断用）
    try {
      localStorage.setItem('error-logs', JSON.stringify(this.logs.slice(-20)));
    } catch (_e) {
      // 保存失敗は無視
    }
  }

  // グローバルエラーをキャプチャ
  captureGlobalErrors(): void {
    window.addEventListener('error', (event) => {
      const msg = `${event.message}`;
      if (this.ignorePatterns.some(p => msg.includes(p))) return;
      this.addLog('error', [
        `Uncaught Error: ${event.message}`,
        `at ${event.filename}:${event.lineno}:${event.colno}`,
        event.error
      ]);
    });

    window.addEventListener('unhandledrejection', (event) => {
      const reasonStr = `${(event as any).reason || ''}`;
      if (this.ignorePatterns.some(p => reasonStr.includes(p))) return;
      this.addLog('error', [
        'Unhandled Promise Rejection:',
        event.reason
      ]);
    });
  }

  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  getRecentErrors(): ErrorLog[] {
    return this.logs.filter(log => log.type === 'error').slice(-10);
  }

  getFormattedLogs(): string {
    return this.logs.map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString('ja-JP');
      const icon = log.type === 'error' ? '❌' : log.type === 'warn' ? '⚠️' : 'ℹ️';
      return `${icon} [${time}] ${log.message}`;
    }).join('\n');
  }

  clearLogs(): void {
    this.logs = [];
    try {
      localStorage.removeItem('error-logs');
    } catch (_e) {
      // 削除失敗は無視
    }
  }

  // エラーレポートを生成
  generateReport(): string {
    const errors = this.logs.filter(log => log.type === 'error');
    const warnings = this.logs.filter(log => log.type === 'warn');
    
    return `
=== エラーレポート ===
生成日時: ${new Date().toLocaleString('ja-JP')}
エラー数: ${errors.length}
警告数: ${warnings.length}

--- 最近のエラー ---
${errors.slice(-5).map(log => {
  const time = new Date(log.timestamp).toLocaleTimeString('ja-JP');
  return `[${time}] ${log.message}${log.stack ? '\n' + log.stack : ''}`;
}).join('\n\n')}

--- 最近の警告 ---
${warnings.slice(-5).map(log => {
  const time = new Date(log.timestamp).toLocaleTimeString('ja-JP');
  return `[${time}] ${log.message}`;
}).join('\n\n')}

--- 全ログ ---
${this.getFormattedLogs()}
    `.trim();
  }
}

// シングルトンインスタンス
export const errorLogger = new ErrorLogger();

// 初期化
export function initErrorLogger(): void {
  errorLogger.interceptConsole();
  errorLogger.captureGlobalErrors();
  logger.log('🔍 Error logger initialized');
}
