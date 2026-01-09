import * as vscode from 'vscode';
import { ConstellationDataGenerator } from '../constellation/ConstellationDataGenerator';
import { NeuralDependencyGraph } from '../neural/NeuralDependencyGraph';
import { GoalManager } from '../goals/GoalManager';

/**
 * WebView Panel for 3D Constellation Visualization
 *
 * Three.jsを使った3D天体儀をVS Code内に表示
 */
export class ConstellationViewPanel {
  public static currentPanel: ConstellationViewPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _generator: ConstellationDataGenerator;
  private _graph: NeuralDependencyGraph;
  private _goalManager: GoalManager;
  private _webviewReady = false;
  private _latestData: unknown = null;
  private _pendingError: string | null = null;

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    graph: NeuralDependencyGraph,
    goalManager: GoalManager,
    generator: ConstellationDataGenerator
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._graph = graph;
    this._goalManager = goalManager;
    this._generator = generator;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case 'openFile':
            this._openFile(message.filePath);
            return;
          case 'showInfo':
            this._showNodeInfo(message.nodeId);
            return;
          case 'refresh':
            this._refresh();
            return;
          case 'webviewError': {
            const details = [
              message.message ? `message=${message.message}` : '',
              message.source ? `source=${message.source}` : '',
              typeof message.line === 'number' ? `line=${message.line}` : '',
              typeof message.column === 'number' ? `column=${message.column}` : '',
            ]
              .filter(Boolean)
              .join(' ');
            console.error(`[Constellation WebView Error] ${details}`);
            return;
          }
          case 'ready': {
            this._webviewReady = true;

            if (this._latestData) {
              this._panel.webview.postMessage({
                command: 'updateData',
                data: this._latestData,
              });
              return;
            }

            if (this._pendingError) {
              this._panel.webview.postMessage({
                command: 'error',
                message: this._pendingError,
              });
            }
            return;
          }
        }
      },
      null,
      this._disposables
    );
  }

  /**
   * Create or show the constellation view panel
   */
  public static createOrShow(
    extensionUri: vscode.Uri,
    graph: NeuralDependencyGraph,
    goalManager: GoalManager,
    generator: ConstellationDataGenerator
  ): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (ConstellationViewPanel.currentPanel) {
      ConstellationViewPanel.currentPanel._panel.reveal(column);
      ConstellationViewPanel.currentPanel._refresh();
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      'constellationView',
      '🌟 天体儀ビュー',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'media'),
          vscode.Uri.joinPath(extensionUri, 'dist'),
        ],
      }
    );

    ConstellationViewPanel.currentPanel = new ConstellationViewPanel(
      panel,
      extensionUri,
      graph,
      goalManager,
      generator
    );
  }

  /**
   * Dispose of the panel
   */
  public dispose(): void {
    ConstellationViewPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  /**
   * Refresh the constellation data
   */
  private async _refresh(): Promise<void> {
    // データを再送信（webviewがreadyになっていれば）
    if (this._webviewReady && this._latestData) {
      this._panel.webview.postMessage({
        type: 'updateData',
        data: this._latestData,
      });
    }
  }

  /**
   * Open a file in the editor
   */
  private async _openFile(filePath: string): Promise<void> {
    try {
      const uri = vscode.Uri.file(filePath);
      await vscode.window.showTextDocument(uri);
    } catch {
      vscode.window.showErrorMessage(`ファイルを開けません: ${filePath}`);
    }
  }

  /**
   * Show information about a node
   */
  private _showNodeInfo(nodeId: string): void {
    const nodes = this._graph.getNodes();
    const node = nodes.get(nodeId);

    if (!node) {
      vscode.window.showWarningMessage(`ノードが見つかりません: ${nodeId}`);
      return;
    }

    const info = [
      `📄 **${node.filePath}**`,
      '',
      `**優先度スコア**: ${(node.priorityScore || 0).toFixed(3)}`,
      `**ゴール距離**: ${(node.goalDistance || 1).toFixed(3)}`,
      `**活性化**: ${node.activationLevel.toFixed(3)}`,
      `**変更頻度**: ${(node.changeFrequency || 0).toFixed(3)}`,
      `**インポート数**: ${node.importCount}`,
      `**複雑度**: ${node.entropy.toFixed(3)}`,
      '',
      `**最終更新**: ${new Date(node.lastModified).toLocaleString()}`,
    ].join('\n');

    vscode.window.showInformationMessage(info, { modal: false });
  }

  /**
   * Update the webview content
   */
  private async _update(): Promise<void> {
    const webview = this._panel.webview;

    this._webviewReady = false;
    this._latestData = null;
    this._pendingError = null;

    this._panel.title = '🌟 天体儀ビュー';
    this._panel.webview.html = await this._getHtmlForWebview(webview);

    // Send initial data
    try {
      const data = await this._generator.generate();
      this._latestData = data;

      if (this._webviewReady) {
        webview.postMessage({
          command: 'updateData',
          data: data,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(`天体儀データの生成に失敗: ${errorMessage}`);
      this._pendingError = errorMessage;

      if (this._webviewReady) {
        webview.postMessage({
          command: 'error',
          message: errorMessage,
        });
      }
    }
  }

  /**
   * Generate HTML content for the webview
   */
  private async _getHtmlForWebview(webview: vscode.Webview): Promise<string> {
    // Three.js is vendored into the extension to avoid CDN/network dependency.
    const threejsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'vendor', 'three', 'three.module.js')
    );
    const orbitControlsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'vendor', 'three', 'OrbitControls.js')
    );

    const cspSource = webview.cspSource;

    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} https: data:; style-src ${cspSource} 'unsafe-inline'; script-src ${cspSource} 'unsafe-inline'; font-src ${cspSource} https: data:; connect-src ${cspSource} https:;">
        <script type="importmap">{
            "imports": {
                "three": "${threejsUri}"
            }
        }</script>
    <title>天体儀ビュー</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: #000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        #canvas-container {
            width: 100vw;
            height: 100vh;
            position: relative;
        }
        #controls {
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(30, 30, 30, 0.95);
            padding: 8px 16px;
            border-radius: 6px;
            color: #fff;
            font-size: 11px;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 16px;
            backdrop-filter: blur(10px);
        }
        #controls.collapsed {
            gap: 0;
        }
        #controls.collapsed > *:not(#toggle-panel-btn) {
            display: none;
        }
        #toggle-panel-btn {
            background: transparent;
            border: none;
            color: #4fc3f7;
            font-size: 18px;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            transition: background 0.2s;
        }
        #toggle-panel-btn:hover {
            background: rgba(79, 195, 247, 0.2);
        }
        #controls h3 {
            margin: 0;
            font-size: 12px;
            color: #4fc3f7;
            white-space: nowrap;
        }
        #controls label {
            display: flex;
            align-items: center;
            margin: 0;
            cursor: pointer;
            user-select: none;
            white-space: nowrap;
        }
        #controls input[type="checkbox"] {
            margin-right: 4px;
        }
        #controls button:not(#toggle-panel-btn) {
            padding: 4px 10px;
            background: rgba(79, 195, 247, 0.2);
            border: 1px solid #4fc3f7;
            border-radius: 4px;
            color: #4fc3f7;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
        }
        #controls button:not(#toggle-panel-btn):hover {
            background: rgba(79, 195, 247, 0.4);
        }
        #controls .slider-container {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        #controls .slider-label {
            font-size: 10px;
            white-space: nowrap;
        }
        #controls input[type="range"] {
            width: 80px;
        }
        #controls select {
            padding: 3px 6px;
            background: rgba(50, 50, 50, 0.9);
            color: #fff;
            border: 1px solid #555;
            border-radius: 4px;
            font-size: 10px;
        }
        #controls .section {
            display: flex;
            align-items: center;
            gap: 8px;
            padding-left: 16px;
            border-left: 1px solid #444;
        }
        #info {
            position: absolute;
            bottom: 10px;
            left: 10px;
            background: rgba(30, 30, 30, 0.95);
            padding: 12px 15px;
            border-radius: 8px;
            color: #fff;
            font-size: 11px;
            z-index: 1000;
            max-width: 300px;
        }
        #info > div {
            margin: 4px 0;
        }
        #selected-info {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #444;
        }
        #loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #4fc3f7;
            font-size: 16px;
            z-index: 999;
        }
        #error-banner {
            position: absolute;
            top: 60px;
            left: 10px;
            right: 10px;
            max-width: 720px;
            background: rgba(60, 0, 0, 0.92);
            border: 1px solid rgba(255, 68, 68, 0.8);
            color: #fff;
            padding: 10px 12px;
            border-radius: 8px;
            z-index: 2002;
            font-size: 11px;
            backdrop-filter: blur(10px);
        }
        #error-banner .title {
            font-weight: 700;
            margin-bottom: 6px;
        }
        #error-banner .details {
            white-space: pre-wrap;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
            font-size: 10px;
            color: #ffd0d0;
            margin-top: 6px;
            max-height: 140px;
            overflow: auto;
        }
        #error-banner .actions {
            display: flex;
            gap: 8px;
            margin-top: 8px;
        }
        #error-banner button {
            padding: 4px 10px;
            background: rgba(255, 68, 68, 0.15);
            border: 1px solid rgba(255, 68, 68, 0.7);
            border-radius: 6px;
            color: #fff;
            font-size: 11px;
            cursor: pointer;
        }
        #error-banner button:hover {
            background: rgba(255, 68, 68, 0.3);
        }
        .hidden {
            display: none;
        }
        #debug-panel {
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.95);
            color: #0f0;
            padding: 12px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 10px;
            width: 400px;
            max-height: 60vh;
            overflow-y: auto;
            z-index: 2000;
            border: 1px solid #0f0;
            backdrop-filter: blur(10px);
        }
        #debug-panel h4 {
            margin: 0 0 8px 0;
            color: #4fc3f7;
            font-size: 12px;
        }
        #debug-panel .debug-entry {
            margin: 4px 0;
            padding: 2px 0;
            border-bottom: 1px solid #333;
        }
        #debug-panel .debug-entry.error {
            color: #ff4444;
        }
        #debug-panel .debug-entry.success {
            color: #4fc3f7;
        }
        #debug-panel .debug-entry.warning {
            color: #ffaa00;
        }
        #debug-toggle {
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.9);
            color: #0f0;
            border: 1px solid #0f0;
            padding: 8px 16px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            border-radius: 6px;
            z-index: 2001;
            backdrop-filter: blur(10px);
            box-shadow: 0 2px 8px rgba(0, 255, 0, 0.3);
        }
        #debug-toggle:hover {
            background: rgba(0, 255, 0, 0.2);
            box-shadow: 0 4px 12px rgba(0, 255, 0, 0.5);
        }
    </style>
</head>
<body>
    <div id="canvas-container"></div>

    <button id="debug-toggle">🐛 Debug</button>
    <div id="debug-panel" class="hidden">
        <h4>🐛 デバッグ情報</h4>
        <div id="debug-log"></div>
    </div>

    <div id="controls">
        <button id="toggle-panel-btn" title="設定パネルを開閉">⚙️</button>
        <h3>🌟 表示</h3>
        <label title="3軸を表示">
            <input type="checkbox" id="toggle-axes" checked>
            軸
        </label>
        <label title="グリッドを表示">
            <input type="checkbox" id="toggle-grid" checked>
            グリッド
        </label>
        <label title="軌道線を表示">
            <input type="checkbox" id="toggle-orbits" checked>
            軌道
        </label>
        <label title="ラベルを表示">
            <input type="checkbox" id="toggle-labels" checked>
            ラベル
        </label>

        <div class="section">
            <label title="エッジを表示">
                <input type="checkbox" id="toggle-edges" checked>
                エッジ
            </label>
            <div class="slider-container">
                <span class="slider-label" id="edge-count-value">50</span>
                <input type="range" id="edge-count-slider" min="10" max="100" value="50" step="10" title="エッジ表示数">
            </div>
        </div>

        <div class="section">
            <select id="depth-filter" title="依存深度フィルター">
                <option value="all">すべて</option>
                <option value="1">1次</option>
                <option value="2" selected>2次</option>
                <option value="3">3次</option>
            </select>
        </div>

        <div class="section">
            <button id="refresh-btn" title="データを更新">🔄</button>
            <button id="reset-camera-btn" title="視点をリセット">📷</button>
            <button id="clear-selection-btn" title="選択を解除">🎯</button>
        </div>
    </div>

    <div id="info">
        <div id="node-count">ノード: 読込中...</div>
        <div id="edge-count">エッジ: -</div>
        <div id="selected-info" class="hidden"></div>
        <div id="hover-info" class="hidden"></div>
    </div>

    <div id="loading">🌟 天体儀を読み込み中...</div>

    <div id="error-banner" class="hidden" role="alert" aria-live="polite">
        <div class="title">❌ Three.jsの読み込みに失敗しました</div>
        <div>ネットワーク制限 / プロキシ / CSP などが原因の可能性があります。</div>
        <div id="error-details" class="details"></div>
        <div class="actions">
            <button id="error-open-debug">🐛 Debugを開く</button>
        </div>
    </div>

    <script>
        // Non-module bootstrap: must work even when module evaluation/imports are blocked.
        (function () {
            const vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : null;

            const debugLog = [];
            const debugLogEl = document.getElementById('debug-log');
            const debugToggleBtn = document.getElementById('debug-toggle');
            const debugPanel = document.getElementById('debug-panel');
            const errorBanner = document.getElementById('error-banner');
            const errorDetails = document.getElementById('error-details');
            const errorOpenDebugBtn = document.getElementById('error-open-debug');

            function addDebugEntry(message, type) {
                const ts = new Date().toISOString().split('T')[1].split('.')[0];
                const entry = { timestamp: ts, message: String(message || ''), type: type || 'info' };
                debugLog.push(entry);

                if (debugLogEl) {
                    const entryDiv = document.createElement('div');
                    entryDiv.className = 'debug-entry ' + entry.type;
                    entryDiv.textContent = '[' + ts + '] ' + entry.message;
                    debugLogEl.appendChild(entryDiv);
                    debugLogEl.scrollTop = debugLogEl.scrollHeight;
                }

                try {
                    console.log('[Constellation Debug] ' + entry.message);
                } catch {
                    // noop
                }
            }

            function showDebugPanel() {
                if (debugPanel) {
                    debugPanel.classList.remove('hidden');
                }
                if (debugToggleBtn) {
                    debugToggleBtn.textContent = '❌ Close';
                }
            }

            function setLoadingError(text) {
                const loadingEl = document.getElementById('loading');
                if (loadingEl) {
                    loadingEl.textContent = text;
                    loadingEl.style.color = '#ff4444';
                }
            }

            function showErrorBanner(summary, details) {
                if (errorBanner) {
                    errorBanner.classList.remove('hidden');
                }
                if (errorDetails) {
                    const safeDetails = (() => {
                        try {
                            if (details instanceof Error) {
                                return (details.name ? details.name + ': ' : '') + (details.message || '') + (details.stack ? '\n' + details.stack : '');
                            }
                            if (typeof details === 'string') return details;
                            return JSON.stringify(details, null, 2);
                        } catch {
                            return String(details || '');
                        }
                    })();
                    const lines = [
                        summary ? 'summary: ' + summary : '',
                        safeDetails ? 'details: ' + safeDetails : ''
                    ].filter(Boolean);
                    errorDetails.textContent = lines.join('\n').slice(-2000);
                }
            }

            // Toggle wiring (must not depend on module script)
            if (debugToggleBtn && debugPanel) {
                debugToggleBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    debugPanel.classList.toggle('hidden');
                    debugToggleBtn.textContent = debugPanel.classList.contains('hidden') ? '🐛 Debug' : '❌ Close';
                    addDebugEntry('Debug panel toggled: ' + (debugPanel.classList.contains('hidden') ? 'hidden' : 'visible'), 'info');
                });
            }
            if (errorOpenDebugBtn) {
                errorOpenDebugBtn.addEventListener('click', () => {
                    showDebugPanel();
                });
            }

            // Surface failures even if module script never runs
            window.addEventListener('error', (event) => {
                const msg = 'Error: ' + (event && event.message ? event.message : '') + ' at ' + (event && event.filename ? event.filename : '') + ':' + (event && event.lineno ? event.lineno : '') + ':' + (event && event.colno ? event.colno : '');
                addDebugEntry(msg, 'error');
                try {
                    if (vscode) {
                        vscode.postMessage({
                            command: 'webviewError',
                            message: event && event.message ? event.message : 'Unknown error',
                            source: event && event.filename ? event.filename : undefined,
                            line: event && event.lineno ? event.lineno : undefined,
                            column: event && event.colno ? event.colno : undefined
                        });
                    }
                } catch {
                    // noop
                }
            });
            window.addEventListener('unhandledrejection', (event) => {
                const reason = event && event.reason ? event.reason : undefined;
                addDebugEntry('Unhandled rejection: ' + String(reason || ''), 'error');
                try {
                    if (vscode) {
                        vscode.postMessage({
                            command: 'webviewError',
                            message: String(reason || 'Unhandled rejection')
                        });
                    }
                } catch {
                    // noop
                }
            });

            // Export helpers for module script
            window.__constellationDebug = {
                addDebugEntry,
                showDebugPanel,
                setLoadingError,
                showErrorBanner
            };

            addDebugEntry('WebView bootstrap script initialized', 'success');
            addDebugEntry('User agent: ' + navigator.userAgent, 'info');
            const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            const cspContent = cspMeta ? (cspMeta.content || '').substring(0, 160) : 'Not found';
            addDebugEntry('CSP: ' + cspContent, 'info');
        })();
    </script>

    <script type="module">
        const vscode = acquireVsCodeApi();

        const addDebugEntry = window.__constellationDebug?.addDebugEntry
            ? window.__constellationDebug.addDebugEntry
            : (message, type = 'info') => {
                try {
                    console.log('[Constellation Debug fallback] ' + type + ': ' + String(message || ''));
                } catch {
                    // noop
                }
            };
        const showDebugPanel = window.__constellationDebug?.showDebugPanel
            ? window.__constellationDebug.showDebugPanel
            : () => {};
        const setLoadingError = window.__constellationDebug?.setLoadingError
            ? window.__constellationDebug.setLoadingError
            : (text) => {
                const loadingEl = document.getElementById('loading');
                if (loadingEl) {
                    loadingEl.textContent = text;
                }
            };
        const showErrorBanner = window.__constellationDebug?.showErrorBanner
            ? window.__constellationDebug.showErrorBanner
            : () => {};

        function reportThreeLoadFailure(error, phase) {
            const errorName = error?.name || (error?.constructor && error.constructor.name) || 'Error';
            const errorMessage = error?.message || String(error);
            const stack = error?.stack || '';

            addDebugEntry('❌ Three.js load failed (' + phase + ')', 'error');
            addDebugEntry('Error: ' + errorName + ': ' + errorMessage, 'error');
            if (stack) addDebugEntry('Stack: ' + stack, 'error');
            addDebugEntry('Online: ' + (navigator.onLine ? 'true' : 'false'), navigator.onLine ? 'info' : 'warning');
            addDebugEntry('URLs:', 'info');
            addDebugEntry('  Three.js: ${threejsUri}', 'info');
            addDebugEntry('  OrbitControls: ${orbitControlsUri}', 'info');

            setLoadingError('❌ Three.jsの読み込みに失敗しました');
            showErrorBanner('Three.js load failed (' + phase + ')', error);
            showDebugPanel();

            try {
                vscode.postMessage({
                    command: 'webviewError',
                    message: 'Failed to load Three.js assets: ' + errorName + ': ' + errorMessage,
                    source: phase,
                    errorType: errorName
                });
            } catch {
                // noop
            }
        }

        // Load Three.js/OrbitControls via dynamic import so we can catch failures
        let THREE;
        let OrbitControls;
        addDebugEntry('Network status: ' + (navigator.onLine ? 'Online' : 'Offline'), navigator.onLine ? 'success' : 'warning');

        async function probeUrl(url, label) {
            try {
                const t0 = performance.now();
                // no-cors: CORSヘッダが無くても到達性だけは確認できる（opaqueでもOK）
                await fetch(url, { method: 'GET', mode: 'no-cors', cache: 'no-store' });
                addDebugEntry('✓ Probe OK: ' + label + ' (' + Math.round(performance.now() - t0) + 'ms)', 'success');
            } catch (e) {
                const name = e?.name || (e?.constructor && e.constructor.name) || 'Error';
                const msg = e?.message || String(e);
                addDebugEntry('⚠️ Probe failed: ' + label + ' - ' + name + ': ' + msg, 'warning');
            }
        }

        await probeUrl('${threejsUri}', 'Three.js (local)');
        await probeUrl('${orbitControlsUri}', 'OrbitControls (local)');

        addDebugEntry('Attempting to load Three.js from: ${threejsUri}', 'info');
        try {
            const t0 = performance.now();
            THREE = await import('${threejsUri}');
            addDebugEntry('✓ Three.js loaded (' + Math.round(performance.now() - t0) + 'ms)', 'success');
        } catch (error) {
            reportThreeLoadFailure(error, 'three');
            return;
        }

        addDebugEntry('Attempting to load OrbitControls from: ${orbitControlsUri}', 'info');
        try {
            const t1 = performance.now();
            ({ OrbitControls } = await import('${orbitControlsUri}'));
            addDebugEntry('✓ OrbitControls loaded (' + Math.round(performance.now() - t1) + 'ms)', 'success');
        } catch (error) {
            reportThreeLoadFailure(error, 'orbitControls');
            return;
        }

            let scene, camera, renderer, controls;
            let nodeObjects = [];
            let edgeObjects = [];
            let labelObjects = [];
            let constellationData = null;
            let raycaster, mouse;
            let selectedNodeId = null;
            let edgeCount = 50;
            let depthFilter = '2';

            // Initialize Three.js scene
            function init() {
                addDebugEntry('Starting Three.js scene initialization', 'info');
                try {
                    const container = document.getElementById('canvas-container');
                    if (!container) {
                        throw new Error('canvas-container not found');
                    }
                    addDebugEntry('Container element found', 'success');

                    // Scene
                    addDebugEntry('Creating scene...', 'info');
                    scene = new THREE.Scene();
                    scene.background = new THREE.Color(0x000511);
                    addDebugEntry('✓ Scene created', 'success');

                    // Camera
                    addDebugEntry('Creating camera...', 'info');
                    camera = new THREE.PerspectiveCamera(
                        60,
                        window.innerWidth / window.innerHeight,
                        0.1,
                        2000
                    );
                    camera.position.set(150, 100, 150);
                    addDebugEntry('✓ Camera created', 'success');

                    // Renderer
                    addDebugEntry('Creating WebGL renderer...', 'info');
                    renderer = new THREE.WebGLRenderer({ antialias: true });
                    renderer.setSize(window.innerWidth, window.innerHeight);
                    renderer.setPixelRatio(window.devicePixelRatio);
                    container.appendChild(renderer.domElement);
                    addDebugEntry('✓ Renderer created and attached', 'success');

                    // Controls
                    addDebugEntry('Creating OrbitControls...', 'info');
                    controls = new OrbitControls(camera, renderer.domElement);
                    controls.enableDamping = true;
                    controls.dampingFactor = 0.05;
                    controls.minDistance = 50;
                    controls.maxDistance = 500;
                    addDebugEntry('✓ OrbitControls created', 'success');

                    // Raycaster for hover/click
                    addDebugEntry('Setting up raycaster...', 'info');
                    raycaster = new THREE.Raycaster();
                    raycaster.params.Line = { threshold: 2 };
                    mouse = new THREE.Vector2();
                    addDebugEntry('✓ Raycaster ready', 'success');

                    // Add lights
                    addDebugEntry('Adding lights...', 'info');
                    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
                    scene.add(ambientLight);

                    const pointLight1 = new THREE.PointLight(0xffffff, 1, 1000);
                    pointLight1.position.set(100, 100, 100);
                    scene.add(pointLight1);

                    const pointLight2 = new THREE.PointLight(0x4fc3f7, 0.5, 1000);
                    pointLight2.position.set(-100, -100, -100);
                    scene.add(pointLight2);
                    addDebugEntry('✓ Lights added', 'success');

                    // Add background stars
                    addDebugEntry('Adding background stars...', 'info');
                    addBackgroundStars();
                    addDebugEntry('✓ Background stars added', 'success');

                    // Add helpers
                    addDebugEntry('Adding scene helpers...', 'info');
                    window.axesHelper = new THREE.AxesHelper(200);
                    scene.add(window.axesHelper);

                    window.gridHelper = new THREE.GridHelper(400, 20, 0x444444, 0x222222);
                    scene.add(window.gridHelper);

            window.orbitLines = new THREE.Group();
            [40, 70, 100].forEach(radius => {
                const geometry = new THREE.BufferGeometry().setFromPoints(
                    new Array(64).fill(0).map((_, i) => {
          const angle = (i / 64) * Math.PI * 2;
                        return new THREE.Vector3(
                            Math.cos(angle) * radius,
                            0,
                            Math.sin(angle) * radius
                        );
                    })
                );
                const material = new THREE.LineBasicMaterial({
                    color: 0x333333,
                    transparent: true,
                    opacity: 0.3
                });
                const line = new THREE.LineLoop(geometry, material);
                window.orbitLines.add(line);
            });
            scene.add(window.orbitLines);

            // Event listeners
            window.addEventListener('resize', onWindowResize);
            renderer.domElement.addEventListener('mousemove', onMouseMove);
            renderer.domElement.addEventListener('click', onClick);
            renderer.domElement.addEventListener('dblclick', onDoubleClick);

            // Control panel toggle
            document.getElementById('toggle-panel-btn').addEventListener('click', () => {
                const panel = document.getElementById('controls');
                panel.classList.toggle('collapsed');
            });

            // Control panel listeners
            document.getElementById('toggle-axes').addEventListener('change', (e) => {
                window.axesHelper.visible = e.target.checked;
            });
            document.getElementById('toggle-grid').addEventListener('change', (e) => {
                window.gridHelper.visible = e.target.checked;
            });
            document.getElementById('toggle-orbits').addEventListener('change', (e) => {
                window.orbitLines.visible = e.target.checked;
            });
            document.getElementById('toggle-labels').addEventListener('change', (e) => {
                labelObjects.forEach(label => label.visible = e.target.checked);
            });
            document.getElementById('toggle-edges').addEventListener('change', (e) => {
                edgeObjects.forEach(edge => edge.visible = e.target.checked);
            });
            document.getElementById('edge-count-slider').addEventListener('input', (e) => {
                edgeCount = parseInt(e.target.value);
                document.getElementById('edge-count-value').textContent = edgeCount;
                if (constellationData) {
                    updateEdges();
                }
            });
            document.getElementById('depth-filter').addEventListener('change', (e) => {
                depthFilter = e.target.value;
                if (selectedNodeId && constellationData) {
                    highlightNode(selectedNodeId);
                }
            });
            document.getElementById('refresh-btn').addEventListener('click', () => {
                vscode.postMessage({ command: 'refresh' });
            });
            document.getElementById('reset-camera-btn').addEventListener('click', resetCamera);
            document.getElementById('clear-selection-btn').addEventListener('click', clearSelection);

            // Start animation
            animate();

            // Hide loading
            document.getElementById('loading').classList.add('hidden');

            vscode.postMessage({ command: 'ready' });
            }

            function addBackgroundStars() {
            const starsGeometry = new THREE.BufferGeometry();
            const starPositions = [];

            for (let i = 0; i < 1000; i++) {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const r = 300 + Math.random() * 200;

                starPositions.push(
                    r * Math.sin(phi) * Math.cos(theta),
                    r * Math.sin(phi) * Math.sin(theta),
                    r * Math.cos(phi)
                );
            }

            starsGeometry.setAttribute('position',
                new THREE.Float32BufferAttribute(starPositions, 3)
            );

            const starsMaterial = new THREE.PointsMaterial({
                color: 0xffffff,
                size: 1.5,
                transparent: true,
                opacity: 0.8
            });

            const stars = new THREE.Points(starsGeometry, starsMaterial);
            scene.add(stars);
            }

            function updateConstellation(data) {
                addDebugEntry('updateConstellation called', 'info');
                const nodeCount = data?.nodes?.length || 0;
                const edgeCount = data?.edges?.length || 0;
                addDebugEntry('Received ' + nodeCount + ' nodes, ' + edgeCount + ' edges', 'info');
                constellationData = data;

                // Hide loading
                document.getElementById('loading').style.display = 'none';

                if (!data || !data.nodes || data.nodes.length === 0) {
                    addDebugEntry('No data to display', 'warning');
                    return;
                }

                // Clear existing objects
                addDebugEntry('Clearing existing scene objects...', 'info');
                nodeObjects.forEach(obj => scene.remove(obj));
                edgeObjects.forEach(edge => scene.remove(edge));
                labelObjects.forEach(label => scene.remove(label));
                nodeObjects = [];
                edgeObjects = [];
                labelObjects = [];
                addDebugEntry('✓ Scene cleared', 'success');

                // Add nodes
                addDebugEntry('Creating ' + data.nodes.length + ' node objects...', 'info');
                data.nodes.forEach((node, index) => {
                    // Node sphere
                    const geometry = new THREE.SphereGeometry(node.size, 32, 32);
                    const material = new THREE.MeshStandardMaterial({
                        color: parseInt(node.color.replace('#', '0x')),
                        emissive: parseInt(node.color.replace('#', '0x')),
                        emissiveIntensity: 0.3,
                        metalness: 0.5,
                        roughness: 0.3
                    });
                    const sphere = new THREE.Mesh(geometry, material);
                    sphere.position.set(node.position.x, node.position.y, node.position.z);
                    sphere.userData = { nodeId: node.id, node: node };
                    scene.add(sphere);
                    nodeObjects.push(sphere);

                    // Label
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.width = 256;
                    canvas.height = 64;
                    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    context.font = '20px Arial';
                    context.fillStyle = '#ffffff';
                    context.textAlign = 'center';
                    context.textBaseline = 'middle';
                    const fileName = node.label || node.id.split('/').pop();
                    context.fillText(fileName, canvas.width / 2, canvas.height / 2);

                    const texture = new THREE.CanvasTexture(canvas);
                    const labelMaterial = new THREE.SpriteMaterial({
                        map: texture,
                        transparent: true,
                        opacity: 0.8
                    });
                    const label = new THREE.Sprite(labelMaterial);
                    label.position.set(node.position.x, node.position.y + node.size + 5, node.position.z);
                    label.scale.set(15, 5, 1);
                    scene.add(label);
                    labelObjects.push(label);
                });

                // Add edges
                updateEdges();

                // Update info
                const categoryCount = new Set(data.nodes.map(n => n.category)).size;
                document.getElementById('node-count').textContent =
                    \`ノード: \${data.nodes.length} | カテゴリ: \${categoryCount}\`;
            }

            function updateEdges() {
            if (!constellationData) return;

            // Clear existing edges
            edgeObjects.forEach(edge => scene.remove(edge));
            edgeObjects = [];

            // Sort edges by strength and take top N
            const sortedEdges = constellationData.edges
                .sort((a, b) => b.strength - a.strength)
                .slice(0, edgeCount);

            // Create node position map
            const nodePositions = new Map();
            constellationData.nodes.forEach(node => {
                nodePositions.set(node.id, node.position);
            });

            // Draw edges
            sortedEdges.forEach(edge => {
                const fromPos = nodePositions.get(edge.from);
                const toPos = nodePositions.get(edge.to);

                if (!fromPos || !toPos) return;

                const color = getEdgeColor(edge.strength);
                const lineWidth = 0.5 + edge.strength * 2; // 0.5-2.5

                const points = [
                    new THREE.Vector3(fromPos.x, fromPos.y, fromPos.z),
                    new THREE.Vector3(toPos.x, toPos.y, toPos.z)
                ];

                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineBasicMaterial({
                    color: parseInt(color.replace('#', '0x')),
                    transparent: true,
                    opacity: 0.4 + edge.strength * 0.3,
                    linewidth: lineWidth
                });

                const line = new THREE.Line(geometry, material);
                line.userData = { edge: edge, originalOpacity: material.opacity };
                scene.add(line);
                edgeObjects.push(line);
            });

            document.getElementById('edge-count').textContent =
                \`エッジ: \${sortedEdges.length} / \${constellationData.edges.length}\`;
            }

            function getEdgeColor(strength) {
            if (strength >= 0.8) return '#ff4444'; // 赤
            if (strength >= 0.6) return '#ffaa44'; // オレンジ
            if (strength >= 0.4) return '#ffff44'; // 黄色
            if (strength >= 0.3) return '#44ff44'; // 緑
            return '#4444ff'; // 青
            }

            function highlightNode(nodeId) {
            selectedNodeId = nodeId;

            // Build adjacency map
            const adjacentNodes = new Set();
            const relatedEdges = new Set();

            constellationData.edges.forEach(edge => {
                if (edge.from === nodeId) {
                    adjacentNodes.add(edge.to);
                    relatedEdges.add(edge);
                }
                if (edge.to === nodeId) {
                    adjacentNodes.add(edge.from);
                    relatedEdges.add(edge);
                }
            });

            // Apply depth filter
            let filteredNodes = new Set([nodeId]);
            if (depthFilter !== 'all') {
                const maxDepth = parseInt(depthFilter);
                const depths = calculateDepths(nodeId, maxDepth);

                depths.forEach((depth, node) => {
                    if (depth <= maxDepth) {
                        filteredNodes.add(node);
                    }
                });
            } else {
                filteredNodes = new Set([nodeId, ...adjacentNodes]);
            }

            // Update node appearances
            nodeObjects.forEach(obj => {
                const objNodeId = obj.userData.nodeId;
                const material = obj.material;

                if (objNodeId === nodeId) {
                    // Selected node - yellow glow
                    material.emissive.setHex(0xffff00);
                    material.emissiveIntensity = 0.8;
                    obj.scale.set(1.5, 1.5, 1.5);
                } else if (filteredNodes.has(objNodeId)) {
                    // Related node - green highlight
                    material.emissive.setHex(0x44ff44);
                    material.emissiveIntensity = 0.5;
                    material.opacity = 1.0;
                    material.transparent = false;
                } else {
                    // Unrelated node - dim
                    material.opacity = 0.3;
                    material.transparent = true;
                }
            });

            // Update edge appearances
            edgeObjects.forEach(obj => {
                const edge = obj.userData.edge;
                const material = obj.material;

                if (relatedEdges.has(edge) &&
                    filteredNodes.has(edge.from) &&
                    filteredNodes.has(edge.to)) {
                    // Related edge - bright
                    material.opacity = obj.userData.originalOpacity * 2;
                    material.linewidth = 3;
                } else {
                    // Unrelated edge - very dim
                    material.opacity = 0.1;
                }
            });

            // Update selected info panel
            const selectedNode = constellationData.nodes.find(n => n.id === nodeId);
            if (selectedNode) {
                const inbound = constellationData.edges.filter(e => e.to === nodeId).length;
                const outbound = constellationData.edges.filter(e => e.from === nodeId).length;

                document.getElementById('selected-info').innerHTML = \`
                    <strong>選択中</strong><br>
                    📄 \${selectedNode.label}<br>
                    優先度: \${selectedNode.priority.toFixed(3)}<br>
                    接続先: \${outbound} →<br>
                    接続元: \${inbound} ←
                \`;
                document.getElementById('selected-info').classList.remove('hidden');
            }
            }

            function calculateDepths(startNodeId, maxDepth) {
            const depths = new Map();
            const queue = [[startNodeId, 0]];
            const visited = new Set();

            while (queue.length > 0) {
                const [nodeId, depth] = queue.shift();

                if (visited.has(nodeId) || depth > maxDepth) {
                    continue;
                }

                visited.add(nodeId);
                depths.set(nodeId, depth);

                constellationData.edges.forEach(edge => {
                    if (edge.from === nodeId && !visited.has(edge.to)) {
                        queue.push([edge.to, depth + 1]);
                    }
                    if (edge.to === nodeId && !visited.has(edge.from)) {
                        queue.push([edge.from, depth + 1]);
                    }
                });
            }

            return depths;
            }

            function clearSelection() {
            selectedNodeId = null;

            // Reset all nodes
            nodeObjects.forEach(obj => {
                const material = obj.material;
                const node = obj.userData.node;

                material.emissive.setHex(parseInt(node.color.replace('#', '0x')));
                material.emissiveIntensity = 0.3;
                material.opacity = 1.0;
                material.transparent = false;
                obj.scale.set(1, 1, 1);
            });

            // Reset all edges
            edgeObjects.forEach(obj => {
                const material = obj.material;
                material.opacity = obj.userData.originalOpacity;
                material.linewidth = 1;
            });

            document.getElementById('selected-info').classList.add('hidden');
            }

            function onMouseMove(event) {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(nodeObjects);

            const hoverInfo = document.getElementById('hover-info');
            if (intersects.length > 0 && !selectedNodeId) {
                const node = intersects[0].object.userData.node;
                hoverInfo.innerHTML = \`
                    <strong>\${node.label}</strong><br>
                    優先度: \${node.priority.toFixed(3)}<br>
                    カテゴリ: \${node.category}
                \`;
                hoverInfo.classList.remove('hidden');
                document.body.style.cursor = 'pointer';
            } else {
                hoverInfo.classList.add('hidden');
                document.body.style.cursor = 'default';
            }
            }

            function onClick(event) {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(nodeObjects);

            if (intersects.length > 0) {
                const nodeId = intersects[0].object.userData.nodeId;

                if (selectedNodeId === nodeId) {
                    // Open file
                    vscode.postMessage({
                        command: 'openFile',
                        filePath: nodeId
                    });
                } else {
                    // Select node
                    highlightNode(nodeId);
                }
            }
            }

            function onDoubleClick(event) {
            clearSelection();
            }

            function resetCamera() {
            camera.position.set(150, 100, 150);
            camera.lookAt(0, 0, 0);
            controls.target.set(0, 0, 0);
            controls.update();
            }

            function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            }

            function animate() {
            requestAnimationFrame(animate);
            controls.update();

            // Twinkle stars
            if (scene.children[3]) {
                const stars = scene.children[3];
                if (stars.material) {
                    stars.material.opacity = 0.5 + Math.sin(Date.now() * 0.001) * 0.3;
                }
            }

            renderer.render(scene, camera);
            }

            function updateConstellation(data) {
            try {
                constellationData = data;

                // Hide loading indicator
                document.getElementById('loading').style.display = 'none';

                // Update node count
                document.getElementById('node-count').textContent =
                    \`ノード: \${data.nodes.length}\`;

                // Clear existing objects
                nodeObjects.forEach(node => scene.remove(node));
                edgeObjects.forEach(edge => scene.remove(edge));
                labelObjects.forEach(label => scene.remove(label));
                nodeObjects = [];
                edgeObjects = [];
                labelObjects = [];

                // Add nodes
                data.nodes.forEach(node => {
                    const geometry = new THREE.SphereGeometry(node.size || 2, 16, 16);
                    const material = new THREE.MeshPhongMaterial({
                        color: parseInt(node.color.replace('#', '0x')),
                        emissive: parseInt(node.color.replace('#', '0x')),
                        emissiveIntensity: 0.2
                    });

                    const sphere = new THREE.Mesh(geometry, material);
                    sphere.position.set(node.position.x, node.position.y, node.position.z);
                    sphere.userData = { nodeId: node.id, node: node };
                    scene.add(sphere);
                    nodeObjects.push(sphere);
                });

                // Update edges
                updateEdges();

                // Start animation
                animate();
            } catch (error) {
                console.error('Failed to update constellation:', error);
                document.getElementById('loading').textContent = '❌ データの読み込みに失敗しました';
                document.getElementById('loading').style.color = '#ff4444';
            }
            }

            // Handle messages from extension
            window.addEventListener('message', event => {
                addDebugEntry('Received message: ' + (event.data?.command || 'unknown'), 'info');
                const message = event.data;
                switch (message.command) {
                    case 'updateData':
                        addDebugEntry('Processing updateData message...', 'info');
                        updateConstellation(message.data);
                        break;
                    case 'error':
                        addDebugEntry('Error from extension: ' + (message.message || ''), 'error');
                        document.getElementById('loading').textContent =
                            '❌ エラー: ' + (message.message || '');
                        document.getElementById('loading').style.color = '#ff4444';
                        break;
                }
            });

            // Initialize on load
            addDebugEntry('Calling init()...', 'info');
            try {
                init();
                addDebugEntry('✓ init() completed successfully', 'success');
                addDebugEntry('Waiting for data from extension...', 'info');
            } catch (error) {
                addDebugEntry('init() failed: ' + (error.message || error), 'error');
                addDebugEntry('Stack: ' + (error.stack || 'No stack'), 'error');
                throw error;
            }
        })();
    </script>
</body>
</html>`;
  }
}
