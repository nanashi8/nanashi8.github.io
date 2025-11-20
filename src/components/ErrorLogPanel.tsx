// エラーログ表示パネル

import { useState, useEffect } from 'react';
import { errorLogger, ErrorLog } from '../errorLogger';

export function ErrorLogPanel() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1秒ごとにログを更新
    const interval = setInterval(() => {
      setLogs(errorLogger.getLogs());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const errors = logs.filter(log => log.type === 'error');
  const hasErrors = errors.length > 0;

  if (!hasErrors && !isVisible) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      maxWidth: '500px',
      maxHeight: '400px',
      backgroundColor: '#fff',
      border: '2px solid #dc3545',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: 10000,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        backgroundColor: '#dc3545',
        color: 'white',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <strong>🐛 エラーログ ({errors.length}件)</strong>
        <div>
          <button
            onClick={() => {
              const report = errorLogger.generateReport();
              navigator.clipboard.writeText(report);
              alert('エラーログをコピーしました！');
            }}
            style={{
              backgroundColor: 'white',
              color: '#dc3545',
              border: 'none',
              padding: '4px 12px',
              borderRadius: '4px',
              marginRight: '8px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            📋 コピー
          </button>
          <button
            onClick={() => setIsVisible(false)}
            style={{
              backgroundColor: 'transparent',
              color: 'white',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '0 4px'
            }}
          >
            ×
          </button>
        </div>
      </div>
      
      <div style={{
        padding: '12px',
        overflowY: 'auto',
        fontSize: '13px',
        fontFamily: 'monospace',
        backgroundColor: '#f8f9fa',
        flex: 1
      }}>
        {errors.slice(-10).reverse().map((log, index) => {
          const time = new Date(log.timestamp).toLocaleTimeString('ja-JP');
          return (
            <div key={index} style={{
              marginBottom: '12px',
              padding: '8px',
              backgroundColor: 'white',
              borderLeft: '3px solid #dc3545',
              borderRadius: '4px'
            }}>
              <div style={{ color: '#6c757d', fontSize: '11px', marginBottom: '4px' }}>
                {time}
              </div>
              <div style={{ color: '#212529', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {log.message}
              </div>
              {log.stack && (
                <details style={{ marginTop: '8px', fontSize: '11px' }}>
                  <summary style={{ cursor: 'pointer', color: '#6c757d' }}>スタックトレース</summary>
                  <pre style={{ 
                    marginTop: '4px', 
                    padding: '8px',
                    backgroundColor: '#f1f3f5',
                    borderRadius: '4px',
                    overflow: 'auto',
                    fontSize: '10px'
                  }}>
                    {log.stack}
                  </pre>
                </details>
              )}
            </div>
          );
        })}
      </div>
      
      <div style={{
        padding: '8px 12px',
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid #dee2e6',
        fontSize: '11px',
        color: '#6c757d',
        textAlign: 'center'
      }}>
        このログをコピーして開発者に送信してください
      </div>
    </div>
  );
}

// フローティングエラーバッジ（最小化表示）
export function ErrorBadge() {
  const [errorCount, setErrorCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const errors = errorLogger.getRecentErrors();
      setErrorCount(errors.length);
      // エラーが発生したら自動的にパネルを表示
      if (errors.length > 0 && !showPanel) {
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
      {showPanel && <ErrorLogPanel />}
      {!showPanel && (
        <button
          onClick={() => setShowPanel(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}
        >
          <span>🐛</span>
          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{errorCount}</span>
        </button>
      )}
    </>
  );
}
