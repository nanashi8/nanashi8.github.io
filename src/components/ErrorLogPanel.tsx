// エラーログ表示パネル

import { useState, useEffect } from 'react';
import { errorLogger, ErrorLog } from '../errorLogger';
import { ENABLE_ERROR_LOGGING } from '../config/errorLogging';

interface ErrorLogPanelProps {
  onClose: () => void;
}

export function ErrorLogPanel({ onClose }: ErrorLogPanelProps) {
  // Error logging is disabled - panel is hidden
  if (!ENABLE_ERROR_LOGGING) {
    return null;
  }
  
  const [logs, setLogs] = useState<ErrorLog[]>([]);

  useEffect(() => {
    // 1秒ごとにログを更新
    const interval = setInterval(() => {
      setLogs(errorLogger.getLogs());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const errors = logs.filter(log => log.type === 'error');

  return (
    <div className="error-log-panel">
      <div className="error-log-header">
        <strong>🐛 エラーログ ({errors.length}件)</strong>
        <div>
          <button
            onClick={() => {
              const report = errorLogger.generateReport();
              navigator.clipboard.writeText(report);
              alert('エラーログをコピーしました！');
            }}
            className="error-log-copy-btn"
          >
            📋 コピー
          </button>
          <button
            onClick={onClose}
            className="error-log-close-btn"
          >
            ×
          </button>
        </div>
      </div>
      
      <div className="error-log-content">
        {errors.slice(-10).reverse().map((log, index) => {
          const time = new Date(log.timestamp).toLocaleTimeString('ja-JP');
          return (
            <div key={index} className="error-log-item">
              <div className="error-log-time">
                {time}
              </div>
              <div className="error-log-message">
                {log.message}
              </div>
              {log.stack && (
                <details className="error-log-stack-details">
                  <summary className="error-log-stack-summary">スタックトレース</summary>
                  <pre className="error-log-stack-pre">
                    {log.stack}
                  </pre>
                </details>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="error-log-footer">
        このログをコピーして開発者に送信してください
      </div>
    </div>
  );
}

// フローティングエラーバッジ（最小化表示）
export function ErrorBadge() {
  // Error logging is disabled - badge is hidden
  if (!ENABLE_ERROR_LOGGING) {
    return null;
  }
  
  const [errorCount, setErrorCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);

  // 本番ではエラーバッジ/パネルを表示しない
  if (import.meta.env.PROD) {
    return null;
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const errors = errorLogger.getRecentErrors();
      setErrorCount(errors.length);
      // 開発時のみ自動表示
      if (import.meta.env.DEV && errors.length > 0 && !showPanel) {
        setShowPanel(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showPanel]);

  if (errorCount === 0) {
    return null;
  }

  return (
    <>
      {showPanel && <ErrorLogPanel onClose={() => setShowPanel(false)} />}
      {!showPanel && (
        <button
          onClick={() => setShowPanel(true)}
          className="error-badge"
        >
          <span>🐛</span>
          <span className="error-badge-count">{errorCount}</span>
        </button>
      )}
    </>
  );
}
