import * as vscode from 'vscode';
import type { ViewModeName } from '../ViewState';
import { BaseViewState } from '../ViewState';
import { ConstellationViewPanel } from '../ConstellationViewPanel';
import { DetailState } from './DetailState';
import { FilterState } from './FilterState';
import { SearchState } from './SearchState';
import { MaintenanceState } from './MaintenanceState';

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
    <title>天体儀</title>
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
        .header {
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(30, 30, 30, 0.95);
            padding: 12px 20px;
            border-radius: 8px;
            color: #fff;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 16px;
            backdrop-filter: blur(10px);
        }
        .header h1 {
            margin: 0;
            font-size: 16px;
            color: #4fc3f7;
        }
        .toolbar {
            display: flex;
            gap: 10px;
        }
        button {
            padding: 6px 12px;
            background: rgba(79, 195, 247, 0.2);
            border: 1px solid #4fc3f7;
            border-radius: 4px;
            color: #4fc3f7;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }
        button:hover {
            background: rgba(79, 195, 247, 0.4);
        }
        #info {
            position: absolute;
            bottom: 10px;
            left: 10px;
            background: rgba(30, 30, 30, 0.95);
            padding: 12px 16px;
            border-radius: 8px;
            color: #fff;
            font-size: 12px;
            z-index: 1000;
        }
        #status {
            color: #4fc3f7;
            margin-bottom: 8px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌟 プロジェクト構造（天体儀）</h1>
        <div class="toolbar">
            <button onclick="showSearch()">🔍 検索</button>
            <button onclick="showFilter()">🎯 フィルター</button>
          <button onclick="showMaintenance()">🩺 健全診断</button>
            <button onclick="requestData()">🔄 更新</button>
        </div>
    </div>

    <div id="canvas-container"></div>

    <div id="info">
        <div id="status">初期化中...</div>
        <div>ノード数: <span id="node-count">0</span></div>
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

  async showOverview(context: ConstellationViewPanel): Promise<void> {
    // 既にOverview状態なので何もしない
    context.logToOutput('[Overview] Already in overview state');
  }

  getDescription(): string {
    return '🌟 プロジェクト全体の天体儀表示';
  }

  async enter(context: ConstellationViewPanel): Promise<void> {
    context.logToOutput('[Overview] Entering overview state');
    await this.updateData(context);
  }

  async exit(context: ConstellationViewPanel): Promise<void> {
    context.logToOutput('[Overview] Exiting overview state');
  }
}
