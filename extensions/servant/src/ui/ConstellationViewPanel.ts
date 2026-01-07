import * as vscode from 'vscode';
import { ConstellationDataGenerator } from '../constellation/ConstellationDataGenerator';
import { NeuralDependencyGraph } from '../neural/NeuralDependencyGraph';
import { GoalManager } from '../goals/GoalManager';

/**
 * 0ベース: 最もシンプルな天体儀表示
 */
export class ConstellationViewPanel {
  public static currentPanel: ConstellationViewPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set HTML
    this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

    // Dispose listener
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public static createOrShow(
    extensionUri: vscode.Uri,
    graph: NeuralDependencyGraph,
    goalManager: GoalManager,
    generator: ConstellationDataGenerator
  ): void {
    const column = vscode.window.activeTextEditor?.viewColumn;

    if (ConstellationViewPanel.currentPanel) {
      ConstellationViewPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'constellationView',
      '🌟 天体儀（0ベース）',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'media'),
        ],
      }
    );

    ConstellationViewPanel.currentPanel = new ConstellationViewPanel(panel, extensionUri);
  }

  public dispose(): void {
    ConstellationViewPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
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
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src ${cspSource} 'unsafe-inline';">
    <title>天体儀 0ベース</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: #000;
            color: #fff;
            font-family: monospace;
        }
        #info {
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0,0,0,0.8);
            padding: 10px;
            border-radius: 5px;
            z-index: 100;
        }
        canvas {
            display: block;
        }
    </style>
</head>
<body>
    <div id="info">
        🌟 天体儀テスト（0ベース）<br>
        Status: <span id="status">初期化中...</span>
    </div>

    <script type="importmap">
    {
        "imports": {
            "three": "${threejsUri}"
        }
    }
    </script>

    <script type="module">
        const statusEl = document.getElementById('status');

        try {
            statusEl.textContent = 'Three.js読み込み中...';

            // Step 1: Three.js読み込み
            const THREE = await import('three');
            statusEl.textContent = 'Three.js OK - OrbitControls読み込み中...';

            // Step 2: OrbitControls読み込み
            const { OrbitControls } = await import('${orbitControlsUri}');
            statusEl.textContent = 'OrbitControls OK - シーン作成中...';

            // Step 3: シーン作成
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(
                75,
                window.innerWidth / window.innerHeight,
                0.1,
                1000
            );
            const renderer = new THREE.WebGLRenderer({ antialias: true });

            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setClearColor(0x000000);
            document.body.appendChild(renderer.domElement);

            statusEl.textContent = 'シーン OK - 立方体作成中...';

            // Step 4: 立方体を追加
            const geometry = new THREE.BoxGeometry(2, 2, 2);
            const material = new THREE.MeshBasicMaterial({
                color: 0x4fc3f7,
                wireframe: true
            });
            const cube = new THREE.Mesh(geometry, material);
            scene.add(cube);

            // カメラ位置
            camera.position.z = 5;

            // OrbitControls
            const controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;

            statusEl.textContent = '✅ 表示中（青い立方体が回転中）';

            // Step 5: アニメーション
            function animate() {
                requestAnimationFrame(animate);

                // 立方体を回転
                cube.rotation.x += 0.01;
                cube.rotation.y += 0.01;

                controls.update();
                renderer.render(scene, camera);
            }
            animate();

            // リサイズ対応
            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });

        } catch (error) {
            statusEl.textContent = '❌ エラー: ' + error.message;
            console.error('初期化エラー:', error);
        }
    </script>
</body>
</html>`;
  }
}
