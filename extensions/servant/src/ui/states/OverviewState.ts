import * as vscode from 'vscode';
import type { ViewModeName } from '../ViewState';
import { BaseViewState } from '../ViewState';
import { ConstellationViewPanel } from '../ConstellationViewPanel';
import { DetailState } from './DetailState';
import { FilterState } from './FilterState';
import { SearchState } from './SearchState';
import { MaintenanceState } from './MaintenanceState';

/**
 * OverviewState - 執事の居住空間（中央司令室）
 *
 * 役割：
 * - 道具部屋：プロジェクトのツール・ガイドドキュメントへの直接アクセス
 * - 控え室：健全診断・検索・フィルター・データ更新の制御
 * - 休憩部屋：プロジェクト状態・作業履歴・ドキュメント管理
 * - 執事アバター：将来の姿・表情表示用の領域確保
 *
 * 天体儀（Constellation）との関係：
 * 天体儀は「全宇宙リソース統合エンジン」として機能する。
 *
 * プロジェクト内（地球）だけでなく、太陽系外（インターネット上の全て）まで：
 * - 🌍 プロジェクト内機能（既存コード、ツール、ユーティリティ）
 * - 🪐 外部API/サービス（OpenAI、GitHub、Google、AWS等あらゆるAPI）
 * - 🌌 オープンソース全体（npm、PyPI、GitHub上の全リポジトリ）
 * - 🔭 観測可能な全リソース（Web上のドキュメント、論文、実装例）
 *
 * これら全ての「未知の組み合わせ」から、新たな創造物を合成：
 * 例：[プロジェクトのスラッシュ分割] + [OpenAI GPT-4] + [GitHub Copilot API]
 *     → 「AI駆動の教材自動生成システム」
 *
 * 天体儀は宇宙全体のリソースマップであり、
 * 合成エンジンは全宇宙から素材を選択し、
 * 今まで存在しなかった創造物を生み出す。
 */
export class OverviewState extends BaseViewState {
  public readonly name: ViewModeName = 'Overview';

  render(context: ConstellationViewPanel): string {
    const webview = context['_panel'].webview;
    const threejsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(context['_extensionUri'], 'media', 'vendor', 'three', 'three.module.js')
    );
    const orbitControlsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(context['_extensionUri'], 'media', 'vendor', 'three', 'OrbitControls.js')
    );
    const cspSource = webview.cspSource;

    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} https: data:; style-src ${cspSource} 'unsafe-inline'; script-src ${cspSource} 'unsafe-inline'; font-src ${cspSource} https: data:; connect-src ${cspSource} https:;">
    <title>執事の居住空間</title>
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #fff;
        }
        #canvas-container {
            width: 100vw;
            height: 100vh;
            position: relative;
        }
        .header {
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(20, 20, 35, 0.95);
            padding: 16px 24px;
            border-radius: 12px;
            z-index: 1000;
            backdrop-filter: blur(15px);
            border: 1px solid rgba(79, 195, 247, 0.3);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        }
        .header h1 {
            margin: 0 0 12px 0;
            font-size: 18px;
            color: #4fc3f7;
            text-align: center;
            font-weight: 600;
            letter-spacing: 0.5px;
        }
        .rooms-container {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
            justify-content: center;
        }
        .room {
            background: rgba(30, 30, 45, 0.8);
            padding: 12px 16px;
            border-radius: 8px;
            border: 1px solid rgba(79, 195, 247, 0.2);
            min-width: 220px;
            transition: all 0.3s ease;
        }
        .room:hover {
            background: rgba(40, 40, 60, 0.9);
            border-color: rgba(79, 195, 247, 0.5);
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(79, 195, 247, 0.2);
        }
        .room h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #4fc3f7;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .room-buttons {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        button {
            padding: 8px 14px;
            background: rgba(79, 195, 247, 0.15);
            border: 1px solid rgba(79, 195, 247, 0.4);
            border-radius: 6px;
            color: #4fc3f7;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.2s;
            text-align: left;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        button:hover {
            background: rgba(79, 195, 247, 0.3);
            border-color: #4fc3f7;
            transform: scale(1.02);
        }
        button:active {
            transform: scale(0.98);
        }
        .avatar-space {
            position: absolute;
            bottom: 20px;
            right: 20px;
            width: 180px;
            height: 240px;
            background: rgba(20, 20, 35, 0.9);
            border: 2px dashed rgba(79, 195, 247, 0.3);
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            backdrop-filter: blur(10px);
            z-index: 1000;
        }
        .avatar-space .placeholder {
            font-size: 64px;
            margin-bottom: 12px;
            opacity: 0.6;
        }
        .avatar-space .label {
            font-size: 11px;
            color: rgba(79, 195, 247, 0.7);
            text-align: center;
            line-height: 1.4;
        }
        #info {
            position: absolute;
            bottom: 10px;
            left: 10px;
            background: rgba(20, 20, 35, 0.95);
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 11px;
            z-index: 1000;
            border: 1px solid rgba(79, 195, 247, 0.2);
            max-width: 280px;
        }
        #status {
            color: #4fc3f7;
            margin-bottom: 6px;
            font-weight: 500;
        }
        .toolbar {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid rgba(79, 195, 247, 0.2);
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            justify-content: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>👔 執事の居住空間 - Servant's Quarters</h1>

        <div class="rooms-container">
            <!-- サーバントの7つ道具（神器の聖域） -->
            <div class="room" style="border: 2px solid rgba(255, 215, 0, 0.5); background: rgba(255, 215, 0, 0.05);">
                <h3 style="color: #ffd700;">⚔️ 7つ道具 (Sacred Arsenal)</h3>
                <div class="room-buttons">
                    <button onclick="invokeSacredTool(1)" style="border-color: rgba(255, 215, 0, 0.6); color: #ffd700;">🌌 全宇宙リソース統合</button>
                    <button onclick="invokeSacredTool(2)" style="border-color: rgba(255, 215, 0, 0.6); color: #ffd700;">🧠 適応的学習システム</button>
                    <button onclick="invokeSacredTool(3)" style="border-color: rgba(255, 215, 0, 0.6); color: #ffd700;">🩺 健全診断システム</button>
                    <button onclick="invokeSacredTool(4)" style="border-color: rgba(255, 215, 0, 0.6); color: #ffd700;">⚗️ データ生成パイプライン</button>
                    <button onclick="invokeSacredTool(5)" style="border-color: rgba(255, 215, 0, 0.6); color: #ffd700;">🛡️ 品質保証システム</button>
                    <button onclick="invokeSacredTool(6)" style="border-color: rgba(150, 150, 150, 0.4); color: #888;">🔮 第6の神器 (未実装)</button>
                    <button onclick="invokeSacredTool(7)" style="border-color: rgba(150, 150, 150, 0.4); color: #888;">✨ 第7の神器 (未実装)</button>
                </div>
            </div>

            <!-- ガイドドキュメント -->
            <div class="room">
                <h3>📚 知識の書庫 (Guides)</h3>
                <div class="room-buttons">
                    <button onclick="openDoc('DATA_GENERATION_TOOLS_CATALOG')">📚 ツールカタログ</button>
                    <button onclick="openDoc('TESTING_GUIDE')">🧪 テストガイド</button>
                    <button onclick="openDoc('VOICE_FOR_STUDENTS_GUIDE')">🔊 音声機能</button>
                    <button onclick="openDoc('QUESTION_SCHEDULER_RECOVERY')">🔄 スケジューラ復旧</button>
                    <button onclick="openDoc('GENERATE_CLASSICAL_JAPANESE_PDF')">📄 古文PDF生成</button>
                </div>
            </div>

            <!-- 控え室 -->
            <div class="room">
                <h3>🎯 制御室 (Control)</h3>
                <div class="room-buttons">
                    <button onclick="showSearch()">🔍 プロジェクト検索</button>
                    <button onclick="showFilter()">🎯 フィルター</button>
                    <button onclick="requestData()">🔄 データ更新</button>
                    <button onclick="showProjectStatus()">📊 プロジェクト状態</button>
                </div>
            </div>
        </div>

        <div class="toolbar">
            <button onclick="showConstellationView()" style="background: rgba(255, 215, 0, 0.15); border-color: rgba(255, 215, 0, 0.4); color: #ffd700;">� 全宇宙リソース統合 (開発中)</button>
            <button onclick="toggleAvatarMode()">👤 執事モード切替</button>
        </div>
    </div>

    <div id="canvas-container"></div>

    <!-- 執事アバター表示領域 -->
    <div class="avatar-space">
        <div class="placeholder">👔</div>
        <div class="label">執事の姿・表情<br>（将来実装予定）</div>
    </div>

    <div id="info">
        <div id="status">初期化中...</div>
        <div>ノード数: <span id="node-count">0</span></div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(79,195,247,0.2); font-size: 10px; color: rgba(79,195,247,0.6);">
            執事として完璧なサービスを<br>提供するための司令室
        </div>
    </div>

    <script>
        // Non-module bootstrap
        (function() {
            const vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : null;

            function log(message, type = 'info') {
                console.log('[Constellation Webview] ' + type + ': ' + message);
            }

            window.__constellation = {
                vscode: vscode,
                log: log
            };

            log('Bootstrap script initialized', 'info');
        })();
    </script>

    <script type="module">
        (async function() {
            const { vscode, log } = window.__constellation;
            const statusEl = document.getElementById('status');
            const nodeCountEl = document.getElementById('node-count');

            // Three.js読み込み（working versionのパターン）
            let THREE, OrbitControls;

            log('Loading Three.js from: ${threejsUri}');
            statusEl.textContent = 'Three.js 読み込み中...';
            try {
                THREE = await import('${threejsUri}');
                log('Three.js loaded successfully');
                statusEl.textContent = 'Three.js 読み込み完了';
            } catch (error) {
                log('Failed to load Three.js: ' + error.message, 'error');
                statusEl.textContent = 'Three.js 読み込み失敗';
                statusEl.style.color = '#ff4444';
                throw error;
            }

            log('Loading OrbitControls from: ${orbitControlsUri}');
            statusEl.textContent = 'OrbitControls 読み込み中...';
            try {
                ({ OrbitControls } = await import('${orbitControlsUri}'));
                log('OrbitControls loaded successfully');
                statusEl.textContent = 'OrbitControls 読み込み完了';
            } catch (error) {
                log('Failed to load OrbitControls: ' + error.message, 'error');
                statusEl.textContent = 'OrbitControls 読み込み失敗';
                statusEl.style.color = '#ff4444';
                throw error;
            }

            // Three.js シーン初期化
            const container = document.getElementById('canvas-container');
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x000000);

        const camera = new THREE.PerspectiveCamera(
            75,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        camera.position.set(0, 0, 10);
        controls.update();

        statusEl.textContent = 'シーン初期化完了';
        log('Scene initialized');

        // ライト追加
        const ambientLight = new THREE.AmbientLight(0x404040, 2);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        // データレンダリング
        function renderConstellationData(data) {
          log('renderConstellationData called with: ' + JSON.stringify(data));
          statusEl.textContent = 'データ受信...';

          // 既存のメッシュをクリア
          const meshes = scene.children.filter(obj => obj.type === 'Mesh' && obj.geometry.type === 'SphereGeometry');
          meshes.forEach(mesh => {
            scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
          });

          // ノードを描画
          if (data && data.nodes && data.nodes.length > 0) {
            log(\`Rendering \${data.nodes.length} nodes\`);
            data.nodes.forEach(node => {
              const geometry = new THREE.SphereGeometry(0.2, 32, 32);
              const material = new THREE.MeshStandardMaterial({
                color: node.color || 0x4488ff,
                metalness: 0.3,
                roughness: 0.4
              });
              const sphere = new THREE.Mesh(geometry, material);

              const position = node.position || { x: 0, y: 0, z: 0 };
              sphere.position.set(position.x, position.y, position.z);

              sphere.userData = {
                nodeId: node.nodeId,
                nodeData: node
              };

              scene.add(sphere);
            });

            nodeCountEl.textContent = String(data.nodes.length);
            statusEl.textContent = 'レンダリング完了';
            log(\`\${data.nodes.length} nodes rendered\`);
          } else {
            nodeCountEl.textContent = '0';
            statusEl.textContent = 'データなし';
            log('No nodes to render');
          }
        }

        // アニメーションループ
        function animate() {
          requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        }

        statusEl.textContent = 'アニメーション開始';
        log('Animation started');
        animate();

        // ウィンドウリサイズ対応
        window.addEventListener('resize', () => {
          camera.aspect = container.clientWidth / container.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(container.clientWidth, container.clientHeight);
        });

        // クリックイベント
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        renderer.domElement.addEventListener('click', (event) => {
          mouse.x = (event.clientX / container.clientWidth) * 2 - 1;
          mouse.y = -(event.clientY / container.clientHeight) * 2 + 1;

          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(scene.children.filter(obj => obj.type === 'Mesh'));

          if (intersects.length > 0) {
            const selected = intersects[0].object;
            const nodeData = selected.userData;

            statusEl.textContent = \`選択: \${nodeData.nodeData?.name || nodeData.nodeId}\`;
            log('Node selected: ' + nodeData.nodeId);

            // 選択したノードをハイライト
            selected.material.emissive.setHex(0x00ff00);
            setTimeout(() => {
              selected.material.emissive.setHex(0x000000);
            }, 500);

            // 詳細表示へ遷移
            vscode.postMessage({
              command: 'showDetail',
              nodeId: nodeData.nodeId
            });
          }
        });

        // メッセージハンドラー
        window.addEventListener('message', event => {
          const message = event.data;
          log('Received message: ' + JSON.stringify(message));

          if (message.command === 'renderData' || message.command === 'updateData') {
            log('Rendering data');
            renderConstellationData(message.data);
          }
        });

        // グローバル関数
        window.invokeSacredTool = function(toolNumber) {
          log('Invoking Sacred Tool #' + toolNumber);
          vscode.postMessage({
            command: 'invokeSacredTool',
            toolNumber: toolNumber
          });
        };

        window.openDoc = function(docName) {
          log('Opening document: ' + docName);
          vscode.postMessage({
            command: 'openDocument',
            docName: docName
          });
        };

        window.showSearch = function() {
          vscode.postMessage({ command: 'showSearch' });
        };

        window.showFilter = function() {
          vscode.postMessage({ command: 'showFilter' });
        };

        window.showMaintenance = function() {
          vscode.postMessage({ command: 'showMaintenance' });
        };

        window.requestData = function() {
          vscode.postMessage({ command: 'getData' });
        };

        window.showProjectStatus = function() {
          vscode.postMessage({ command: 'showProjectStatus' });
        };

        window.showWorkHistory = function() {
          vscode.postMessage({ command: 'showWorkHistory' });
        };

        window.showConstellationView = function() {
          vscode.postMessage({ command: 'toggleConstellationView' });
        };

        window.toggleAvatarMode = function() {
          vscode.postMessage({ command: 'toggleAvatarMode' });
        };

            // 初期化完了を通知
            statusEl.textContent = 'データ待機中...';
            log('Sending ready message');
            vscode.postMessage({ command: 'ready' });

            log('Initialization complete');
        })();
    </script>
</body>
</html>
    `;
  }

  async handleMessage(context: ConstellationViewPanel, message: any): Promise<void> {
    switch (message.command) {
      case 'getData':
        await this.updateData(context);
        break;
      case 'showDetail':
        await this.showDetail(context, message.nodeId);
        break;
      case 'showSearch':
        await this.showSearch(context, message.query || '');
        break;
      case 'showFilter':
        await this.showFilter(context, message.filters || {});
        break;
      case 'showMaintenance':
        context.logToOutput('[Overview] Transitioning to maintenance view');
        await context.transitionToState(new MaintenanceState());
        break;
      case 'openDocument':
        await this.openDocument(context, message.docName);
        break;
      case 'showProjectStatus':
        await this.showProjectStatus(context);
        break;
      case 'showWorkHistory':
        await this.showWorkHistory(context);
        break;
      case 'toggleConstellationView':
        await this.toggleConstellationView(context);
        break;
      case 'toggleAvatarMode':
        await this.toggleAvatarMode(context);
        break;
      case 'invokeSacredTool':
        await this.invokeSacredTool(context, message.toolNumber);
        break;
      case 'executeSacredToolAction':
        await this.executeSacredToolAction(context, message.toolNumber, message.actionId);
        break;
    }
  }

  async showDetail(context: ConstellationViewPanel, nodeId: string): Promise<void> {
    context.logToOutput(`[Overview] Transitioning to detail view for node: ${nodeId}`);
    await context.transitionToState(new DetailState(nodeId));
  }

  async showSearch(context: ConstellationViewPanel, query: string): Promise<void> {
    context.logToOutput('[Overview] Transitioning to search view');
    await context.transitionToState(new SearchState(query));
  }

  async showFilter(context: ConstellationViewPanel, filters: Record<string, unknown>): Promise<void> {
    context.logToOutput('[Overview] Transitioning to filter view');
    await context.transitionToState(new FilterState(filters));
  }

  async updateData(context: ConstellationViewPanel): Promise<void> {
    const data = context.getData();
    context.logToOutput(`[Overview] Sending constellation data: ${data.nodes.length} nodes`);
    context.postMessage({
      command: 'renderData',
      data: data
    });
  }

  async openDocument(context: ConstellationViewPanel, docName: string): Promise<void> {
    const docMap: Record<string, string> = {
      'DATA_GENERATION_TOOLS_CATALOG': 'docs/how-to/DATA_GENERATION_TOOLS_CATALOG.md',
      'TESTING_GUIDE': 'docs/how-to/TESTING_GUIDE.md',
      'VOICE_FOR_STUDENTS_GUIDE': 'docs/how-to/VOICE_FOR_STUDENTS_GUIDE.md',
      'QUESTION_SCHEDULER_RECOVERY': 'docs/how-to/QUESTION_SCHEDULER_RECOVERY.md',
      'GENERATE_CLASSICAL_JAPANESE_PDF': 'docs/how-to/GENERATE_CLASSICAL_JAPANESE_PDF.md',
      'LOCAL_UD_DEPENDENCY_PARSE': 'docs/how-to/LOCAL_UD_DEPENDENCY_PARSE.md',
      'DETECTED_SIGNAL_USAGE_GUIDE': 'docs/how-to/DETECTED_SIGNAL_USAGE_GUIDE.md',
      'DOCPART_USAGE': 'docs/how-to/DOCPART_USAGE.md',
      'DOCUSAURUS_SETUP_GUIDE': 'docs/how-to/DOCUSAURUS_SETUP_GUIDE.md'
    };

    const docPath = docMap[docName];
    if (!docPath) {
      context.logToOutput(`[Overview] Unknown document: ${docName}`);
      vscode.window.showWarningMessage(`ドキュメントが見つかりません: ${docName}`);
      return;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('ワークスペースが開かれていません');
      return;
    }

    const fullPath = vscode.Uri.joinPath(workspaceFolder.uri, docPath);
    context.logToOutput(`[Overview] Opening document: ${fullPath.fsPath}`);

    try {
      const doc = await vscode.workspace.openTextDocument(fullPath);
      await vscode.window.showTextDocument(doc, { preview: false });
    } catch (error) {
      context.logToOutput(`[Overview] Failed to open document: ${error}`);
      vscode.window.showErrorMessage(`ドキュメントを開けませんでした: ${docPath}`);
    }
  }

  async showProjectStatus(context: ConstellationViewPanel): Promise<void> {
    context.logToOutput('[Overview] Showing project status');

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('ワークスペースが開かれていません');
      return;
    }

    // Git status を取得
    const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
    const api = gitExtension?.getAPI(1);

    let statusText = '📊 プロジェクト状態\n\n';

    if (api && api.repositories.length > 0) {
      const repo = api.repositories[0];
      const branch = repo.state.HEAD?.name || 'unknown';
      const changes = repo.state.workingTreeChanges.length;
      const staged = repo.state.indexChanges.length;

      statusText += `📌 ブランチ: ${branch}\n`;
      statusText += `📝 変更ファイル: ${changes}\n`;
      statusText += `✅ ステージング: ${staged}\n`;
    }

    statusText += `\n📂 ワークスペース: ${workspaceFolder.name}`;

    vscode.window.showInformationMessage(statusText, { modal: false });
  }

  async showWorkHistory(context: ConstellationViewPanel): Promise<void> {
    context.logToOutput('[Overview] Showing work history');
    vscode.window.showInformationMessage(
      '📜 作業履歴機能は近日実装予定です。\n現在は Git ログで確認できます。',
      '閉じる'
    );
  }

  async toggleConstellationView(context: ConstellationViewPanel): Promise<void> {
    context.logToOutput('[Overview] Universal Resource Integration Engine requested');
    context.postMessage({
      command: 'toggleVisualization',
      enabled: true
    });
    vscode.window.showInformationMessage(
      '🌌 全宇宙リソース統合エンジン（開発中）\n\n' +
      'プロジェクト概要は、この世の全てから新たな創造物を合成します：\n\n' +
      '🌍 プロジェクト内機能（既存コード・ツール）\n' +
      '🪐 外部API/サービス（OpenAI、GitHub、Google等全てのAPI）\n' +
      '🌌 オープンソース全体（npm、PyPI、GitHub全リポジトリ）\n' +
      '🔭 観測可能な全リソース（Web上の全ドキュメント・実装例）\n\n' +
      '💫 未知の組み合わせ：\n' +
      '例：[あなたのスラッシュ分割] + [OpenAI API] + [GitHub上の優れた実装]\n' +
      '   → 今まで存在しなかった「AI駆動教材自動生成システム」を合成\n\n' +
      '太陽系外からでも、観測できれば統合します。\n' +
      'プロジェクト概要は全宇宙のリソースマップです。',
      '了解'
    );
  }

  async invokeSacredTool(context: ConstellationViewPanel, toolNumber: number): Promise<void> {
    context.logToOutput(`[Overview] Invoking Sacred Tool #${toolNumber}`);

    const toolDescriptions: Record<number, { name: string; description: string; action?: () => Promise<void>; menu?: Array<{ id: string; label: string; description: string }> }> = {
      1: {
        name: '🌌 全宇宙リソース統合エンジン',
        description: 'プロジェクト内から太陽系外まで、観測可能な全リソースを統合し、未知の組み合わせから新たな創造物を合成します。',
        action: async () => await this.toggleConstellationView(context),
        menu: [
          { id: 'buildNeuralGraph', label: '🧠 ニューラルグラフ構築', description: '依存関係を重み付きグラフ化' },
          { id: 'showNeuralGraph', label: '📊 グラフ統計表示', description: 'ノード・エッジ統計を表示' },
          { id: 'propagateForward', label: '🔮 影響伝播計算', description: '現在のファイルから影響範囲を予測' },
          { id: 'showNeuralLearning', label: '📈 学習統計', description: 'ニューラル学習の進捗' },
        ]
      },
      2: {
        name: '🧠 適応的学習システム',
        description: 'ユーザーの行動・失敗パターンから学習し、最適な問題・タイミング・難易度を自動調整します。',
        menu: [
          { id: 'evaluateAI', label: '🎯 AI自己評価実行', description: '処理履歴からメトリクス算出' },
          { id: 'showAIStats', label: '📊 AI処理統計', description: '成功率・違反率を表示' },
          { id: 'showRecentAIActions', label: '📜 直近のAI処理', description: '最新20件の処理履歴' },
          { id: 'showAITrend', label: '📈 パフォーマンス推移', description: '時系列でスコア変化を表示' },
          { id: 'learnFromHistory', label: '🔄 Git履歴学習', description: 'コミット履歴からパターン抽出' },
          { id: 'showLearningStats', label: '📊 学習統計表示', description: '学習サイクル・パターン数' },
        ]
      },
      3: {
        name: '🩺 健全診断システム',
        description: 'プロジェクトの状態を診断し、潜在的な問題を検出。品質ガード・spec鮮度・依存関係を自動チェックします。',
        action: async () => {
          context.logToOutput('[Overview] Transitioning to maintenance view');
          await context.transitionToState(new MaintenanceState());
        }
      },
      4: {
        name: '⚗️ データ生成パイプライン',
        description: '教材データを自動生成・検証・変換するパイプライン。英語・古文・社会科等、全科目のデータを統合管理します。',
      },
      5: {
        name: '🛡️ 品質保証システム',
        description: 'コード品質・データ品質・テストカバレッジを自動監視。CI/CD統合で品質を保証します。',
      },
      6: {
        name: '🔮 第6の神器',
        description: 'まだ実装されていない、世界を変える神器。あなたのビジョンが具現化するのを待っています。',
      },
      7: {
        name: '✨ 第7の神器',
        description: '究極の神器。その姿はまだ誰も知りません。これからの世界を変える、最後の鍵となるでしょう。',
      }
    };

    const tool = toolDescriptions[toolNumber];
    if (!tool) {
      vscode.window.showErrorMessage(`神器 #${toolNumber} が見つかりません`);
      return;
    }

    if (toolNumber === 6 || toolNumber === 7) {
      vscode.window.showInformationMessage(
        `${tool.name}\n\n${tool.description}\n\n「全てをイメージできていない」— それでいい。\n神器は必要な時に現れます。`,
        '了解'
      );
      return;
    }

    if (tool.menu && tool.menu.length > 0) {
      // サブメニュー表示
      const items = tool.menu.map(m => ({
        label: m.label,
        description: m.description,
        id: m.id
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: `${tool.name} - 実行する機能を選択してください`,
        matchOnDescription: true
      });

      if (selected) {
        await this.executeSacredToolAction(context, toolNumber, selected.id);
      }
    } else if (tool.action) {
      await tool.action();
    } else {
      vscode.window.showInformationMessage(
        `${tool.name}\n\n${tool.description}\n\n実装準備中...`,
        '了解'
      );
    }
  }

  async executeSacredToolAction(context: ConstellationViewPanel, toolNumber: number, actionId: string): Promise<void> {
    context.logToOutput(`[Overview] Executing Sacred Tool #${toolNumber} action: ${actionId}`);

    try {
      switch (actionId) {
        // 神器#1: 全宇宙リソース統合 (ニューラルグラフ)
        case 'buildNeuralGraph':
          await vscode.commands.executeCommand('servant.buildNeuralGraph');
          break;
        case 'showNeuralGraph':
          await vscode.commands.executeCommand('servant.showNeuralGraph');
          break;
        case 'propagateForward':
          await vscode.commands.executeCommand('servant.propagateForward');
          break;
        case 'showNeuralLearning':
          await vscode.commands.executeCommand('servant.showNeuralLearningStats');
          break;

        // 神器#2: 適応的学習システム (AI自己評価)
        case 'evaluateAI':
          await vscode.commands.executeCommand('servant.evaluateAI');
          break;
        case 'showAIStats':
          await vscode.commands.executeCommand('servant.showAIStats');
          break;
        case 'showRecentAIActions':
          await vscode.commands.executeCommand('servant.showRecentAIActions');
          break;
        case 'showAITrend':
          await vscode.commands.executeCommand('servant.showAITrend');
          break;
        case 'learnFromHistory':
          await vscode.commands.executeCommand('servant.learnFromHistory');
          break;
        case 'showLearningStats':
          await vscode.commands.executeCommand('servant.showLearningStats');
          break;

        default:
          vscode.window.showWarningMessage(`アクション "${actionId}" は未実装です`);
      }
    } catch (error) {
      context.logToOutput(`[Overview] Failed to execute action: ${error}`);
      vscode.window.showErrorMessage(`実行エラー: ${error}`);
    }
  }

  async toggleAvatarMode(context: ConstellationViewPanel): Promise<void> {
    context.logToOutput('[Overview] Avatar mode toggle requested');
    vscode.window.showInformationMessage(
      '👔 執事アバターモード\n\n将来、執事の姿や表情をこの画面に表示する予定です。\n現在はプレースホルダーのみ表示されています。',
      '了解'
    );
  }

  async showOverview(context: ConstellationViewPanel): Promise<void> {
    // 既にOverview状態なので何もしない
    context.logToOutput('[Overview] Already in overview state');
  }

  getDescription(): string {
    return '👔 執事の居住空間 - サーバントの7つ道具（神器）';
  }

  async enter(context: ConstellationViewPanel): Promise<void> {
    context.logToOutput('[Overview] Entering Servant Quarters with Sacred Arsenal (サーバントの7つ道具)');
    await this.updateData(context);
  }

  async exit(context: ConstellationViewPanel): Promise<void> {
    context.logToOutput('[Overview] Exiting Servant Quarters');
  }
}
