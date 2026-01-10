import * as vscode from 'vscode';
import { ConstellationDataGenerator } from '../constellation/ConstellationDataGenerator';
import { NeuralDependencyGraph } from '../neural/NeuralDependencyGraph';
import { GoalManager } from '../goals/GoalManager';
import type { ViewState, ViewModeName } from './ViewState';
import { OverviewState } from './states/OverviewState';
import { SearchState } from './states/SearchState';
import { FilterState } from './states/FilterState';
import { DetailState } from './states/DetailState';
import { MaintenanceState } from './states/MaintenanceState';

export type ConstellationOpenOptions = {
  mode?: ViewModeName;
  query?: string;
  filters?: Record<string, any>;
  nodeId?: string;
};

/**
 * ConstellationViewPanel - 天体儀（全宇宙リソース統合エンジン）
 *
 * 現在の役割：
 * - プロジェクト構造の3D可視化
 * - ファイル・依存関係のノード表示
 *
 * 真の役割（全宇宙リソース統合）：
 * 天体儀は、プロジェクト内（地球）だけでなく、
 * 太陽系外（インターネット上の全て）までを統合する：
 *
 * 🌍 プロジェクト内（地球）
 *    - 既存コード、ツール、ユーティリティ
 *    - ローカルリソース、独自実装
 *
 * 🪐 太陽系（外部API/サービス）
 *    - OpenAI、Anthropic、Google AI
 *    - GitHub、GitLab、npm、PyPI
 *    - AWS、Azure、GCP等あらゆるクラウドサービス
 *
 * 🌌 銀河系外（オープンソース全体）
 *    - GitHub上の全リポジトリ（観測可能な全実装）
 *    - Stack Overflow、Qiita等の全ナレッジ
 *    - arXiv、論文サイト等の全研究成果
 *
 * 🔭 観測範囲（動的拡大）
 *    - Web上の全ドキュメント
 *    - 新規公開されたAPI/ライブラリを自動検出
 *    - 「観測できれば統合する」原則
 *
 * 合成エンジンの動作：
 * 1. 全宇宙からリソースを観測・マッピング
 * 2. 未知の組み合わせを探索（AIによる提案）
 * 3. ドラッグ&ドロップで素材を選択
 * 4. 新たな創造物を合成・生成
 *
 * 例：
 * [あなたのスラッシュ分割] + [OpenAI GPT-4 API] + [GitHub上の優れた実装]
 * → 今まで存在しなかった「AI駆動教材自動生成システム」
 *
 * 拡張ポイント：
 * TODO: 外部リソース観測システム（ResourceObserver）
 * TODO: 全宇宙リソースマップ（UniversalResourceGraph）
 * TODO: 動的API統合エンジン（DynamicIntegrator）
 * TODO: 未知の組み合わせ探索AI（CombinationExplorer）
 * TODO: 創造物合成パイプライン（SynthesisPipeline）
 * TODO: リソース観測範囲の自動拡大（ObservationExpander）
 *
 * 0ベース: 最もシンプルな天体儀表示
 */
export class ConstellationViewPanel {
  public static currentPanel: ConstellationViewPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _graph: NeuralDependencyGraph | null = null;
  private _generator: ConstellationDataGenerator | null = null;

  // State Pattern統合
  private _currentViewState: ViewState;
  private _outputChannel: vscode.OutputChannel;
  private _webviewReady = false;

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    graph: NeuralDependencyGraph,
    generator: ConstellationDataGenerator,
    openOptions?: ConstellationOpenOptions
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._graph = graph;
    this._generator = generator;

    // OutputChannel作成
    this._outputChannel = vscode.window.createOutputChannel('Constellation View');

    // 初期状態（デフォルト: Overview）
    this._currentViewState = ConstellationViewPanel.createStateFromOpenOptions(openOptions);

    // 先にHTMLをセットしてWebviewのロードを開始
    this._panel.webview.html = this._currentViewState.render(this);

    // メッセージハンドラ（状態に委譲 + ready処理）
    this._panel.webview.onDidReceiveMessage(
      async message => {
        // Webview ready イベントを処理（初期データ送信は ready 後に行う）
        if (message?.command === 'ready') {
          this._webviewReady = true;
          this.logToOutput('[Constellation] Webview ready');
          await this._currentViewState.enter(this);
          return;
        }
        await this._currentViewState.handleMessage(this, message);
      },
      null,
      this._disposables
    );

    // Dispose listener
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public static createOrShow(
    extensionUri: vscode.Uri,
    graph: NeuralDependencyGraph,
    _goalManager: GoalManager,
    generator: ConstellationDataGenerator,
    openOptions?: ConstellationOpenOptions
  ): void {
    const column = vscode.window.activeTextEditor?.viewColumn;

    if (ConstellationViewPanel.currentPanel) {
      // Webviewキャッシュ/二重評価を避けるため、既存パネルは破棄して作り直す
      ConstellationViewPanel.currentPanel.dispose();
      ConstellationViewPanel.currentPanel = undefined;
    }

    const panel = vscode.window.createWebviewPanel(
      'constellationView',
      '🌟 天体儀（プロジェクト構造）',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: false,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'media'),
        ],
      }
    );

    ConstellationViewPanel.currentPanel = new ConstellationViewPanel(
      panel,
      extensionUri,
      graph,
      generator,
      openOptions
    );
  }

  private static createStateFromOpenOptions(openOptions?: ConstellationOpenOptions): ViewState {
    const mode = openOptions?.mode ?? 'Overview';
    switch (mode) {
      case 'Search':
        return new SearchState(openOptions?.query ?? '');
      case 'Filter':
        return new FilterState(openOptions?.filters ?? {});
      case 'Detail':
        return new DetailState(openOptions?.nodeId ?? '');
      case 'Maintenance':
        return new MaintenanceState();
      case 'Overview':
      default:
        return new OverviewState();
    }
  }

  private _sendData(): void {
    if (!this._webviewReady) {
      this.logToOutput('[Constellation] Skip sendData: webview not ready');
      return;
    }
    if (this._generator) {
      const data = this._generator.generate();
      this._panel.webview.postMessage({ command: 'renderData', data });
    }
  }

  public dispose(): void {
    ConstellationViewPanel.currentPanel = undefined;

    // 現在の状態のexit処理
    if (this._currentViewState) {
      this._currentViewState.exit(this);
    }

    this._panel.dispose();
    this._outputChannel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  // === State Pattern用ヘルパーメソッド ===

  /**
   * 状態遷移
   */
  public async transitionToState(newState: ViewState): Promise<void> {
    const oldStateName = this._currentViewState.name;
    const newStateName = newState.name;

    // 遷移可能かチェック
    if (!this._currentViewState.canTransitionTo(newStateName)) {
      this.logToOutput(`[Constellation] 状態遷移拒否: ${oldStateName} -> ${newStateName}`);
      return;
    }

    this.logToOutput(`[Constellation] 状態遷移: ${oldStateName} -> ${newStateName}`);

    // 現在の状態のexit処理
    await this._currentViewState.exit(this);

    // 新しい状態に切り替え
    this._currentViewState = newState;

    // 新しい状態のenter処理
    await this._currentViewState.enter(this);

    // 画面を更新
    await this.refresh();
  }

  /**
   * 画面を再描画
   */
  public async refresh(): Promise<void> {
    this._panel.webview.html = this._currentViewState.render(this);
  }

  /**
   * 現在の状態名を取得
   */
  public getCurrentViewState(): ViewModeName {
    return this._currentViewState.name;
  }

  /**
   * 状態の説明を取得
   */
  public getViewStateDescription(): string {
    return this._currentViewState.getDescription();
  }

  /**
   * OutputChannelにログ出力
   */
  public logToOutput(message: string): void {
    this._outputChannel.appendLine(message);
  }

  /**
   * Webviewにメッセージ送信
   */
  public postMessage(message: any): void {
    this._panel.webview.postMessage(message);
  }

  /**
   * 天体儀データを取得
   */
  public getData(): any {
    if (this._generator) {
      return this._generator.generate();
    }
    return { nodes: [], edges: [], stats: { totalNodes: 0, totalEdges: 0 } };
  }

  /**
   * 特定ノードのデータを取得
   */
  public getNodeData(nodeId: string): any | null {
    const data = this.getData();
    if (!data || !data.nodes) {
      return null;
    }
    return data.nodes.find((node: any) => node.id === nodeId) || null;
  }

  /**
   * フィルタリングされたデータを取得
   */
  public getFilteredData(filters: Record<string, any>): any {
    const data = this.getData();
    if (!data || !data.nodes) {
      return { nodes: [], edges: [] };
    }

    let filteredNodes = data.nodes;

    // フィルター適用
    if (filters.type) {
      filteredNodes = filteredNodes.filter((node: any) => node.type === filters.type);
    }

    return {
      nodes: filteredNodes,
      edges: data.edges,
    };
  }

  /**
   * ノードを検索
   */
  public searchNodes(query: string): any[] {
    const data = this.getData();
    if (!data || !data.nodes || !query) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    return data.nodes.filter((node: any) => {
      const name = (node.name || '').toLowerCase();
      const path = (node.path || '').toLowerCase();
      const id = (node.id || '').toLowerCase();

      return name.includes(lowerQuery) || path.includes(lowerQuery) || id.includes(lowerQuery);
    });
  }

  /**
   * Three.js URIを取得
   */
  public getThreeJsUri(): string {
    return this._panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'vendor', 'three', 'three.module.js')
    ).toString();
  }

  /**
   * OrbitControls URIを取得
   */
  public getOrbitControlsUri(): string {
    return this._panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'vendor', 'three', 'OrbitControls.js')
    ).toString();
  }

  /**
   * レガシーHTML生成メソッド（後方互換性のため残存、非推奨）
   * @deprecated 新しいState Patternベースのrender()を使用してください
   */

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

            statusEl.textContent = 'シーン OK - カメラ・コントロール設定中...';

            // Step 4: カメラ配置
            camera.position.set(50, 30, 50);
            camera.lookAt(0, 0, 0);

            // Step 5: コントロール
            const controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;

            statusEl.textContent = 'カメラ OK - データ読み込み中...';

            // Step 6: VS Codeからデータ取得
            const vscode = acquireVsCodeApi();
            let sun = null; // 太陽への参照を保持

            window.addEventListener('message', event => {
                const message = event.data;
                if (message.command === 'renderData') {
                    renderConstellation(message.data);
                }
            });

            // データリクエスト
            vscode.postMessage({ command: 'getData' });

            function renderConstellation(data) {
                statusEl.textContent = '天体儀構築中...';

                // 中心の太陽（プロジェクトゴール）
                const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
                const sunMaterial = new THREE.MeshBasicMaterial({
                    color: 0xFFD700,
                    emissive: 0xFFAA00,
                    emissiveIntensity: 0.5
                });
                sun = new THREE.Mesh(sunGeometry, sunMaterial);
                scene.add(sun);

                // 太陽の光
                const sunLight = new THREE.PointLight(0xFFFFCC, 1.5, 200);
                scene.add(sunLight);

                // 環境光
                const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
                scene.add(ambientLight);

                statusEl.textContent = \`ノード描画中... (0/\${data.nodes.length})\`;

                // ノード描画
                data.nodes.forEach((node, i) => {
                    const pos = node.position;
                    const importance = node.priority;

                    // ノード球体
                    const nodeSize = 0.5 + importance * 1.5;
                    const nodeGeometry = new THREE.SphereGeometry(nodeSize, 16, 16);
                    const color = importance > 0.8 ? 0xFF6B6B : importance > 0.6 ? 0x4ECDC4 : 0x95E1D3;
                    const nodeMaterial = new THREE.MeshPhongMaterial({
                        color,
                        emissive: color,
                        emissiveIntensity: 0.2,
                        shininess: 30
                    });
                    const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
                    nodeMesh.position.set(pos.x, pos.y, pos.z);
                    scene.add(nodeMesh);

                    // ラベル（100ノードごと、または重要ノードのみ）
                    if (i % 100 === 0 || importance > 0.8) {
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.width = 256;
                        canvas.height = 64;
                        context.fillStyle = '#FFFFFF';
                        context.font = '20px monospace';
                        context.fillText(node.label, 10, 40);

                        const texture = new THREE.CanvasTexture(canvas);
                        const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
                        const sprite = new THREE.Sprite(spriteMaterial);
                        sprite.position.set(pos.x, pos.y + nodeSize + 1, pos.z);
                        sprite.scale.set(6, 1.5, 1);
                        scene.add(sprite);
                    }

                    if ((i + 1) % 50 === 0) {
                        statusEl.textContent = \`ノード描画中... (\${i + 1}/\${data.nodes.length})\`;
                    }
                });

                statusEl.textContent = \`エッジ描画中... (0/\${data.edges.length})\`;

                // エッジ描画（結合度で太さ変更）
                data.edges.forEach((edge, i) => {
                    const fromNode = data.nodes.find(n => n.id === edge.from);
                    const toNode = data.nodes.find(n => n.id === edge.to);
                    if (!fromNode || !toNode) return;

                    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                        new THREE.Vector3(fromNode.position.x, fromNode.position.y, fromNode.position.z),
                        new THREE.Vector3(toNode.position.x, toNode.position.y, toNode.position.z)
                    ]);
                    const strength = edge.strength;
                    const lineMaterial = new THREE.LineBasicMaterial({
                        color: 0x666666,
                        opacity: 0.2 + strength * 0.5,
                        transparent: true,
                        linewidth: Math.max(1, strength * 3) // 結合度→太さ
                    });
                    const line = new THREE.Line(lineGeometry, lineMaterial);
                    scene.add(line);

                    if ((i + 1) % 50 === 0) {
                        statusEl.textContent = \`エッジ描画中... (\${i + 1}/\${data.edges.length})\`;
                    }
                });

                statusEl.textContent = \`✅ 完了！ノード:\${data.stats.totalNodes} エッジ:\${data.stats.totalEdges}\`;
            }

            // Step 7: アニメーションループ

            function animate() {
                requestAnimationFrame(animate);
                controls.update();
                if (sun) {
                    sun.rotation.y += 0.001; // 太陽ゆっくり回転
                }
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
            console.error(error);
        }
    </script>
</body>
</html>`;
  }
}
