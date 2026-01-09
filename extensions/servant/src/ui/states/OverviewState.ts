/**
 * OverviewState - 全体表示モード
 *
 * プロジェクト全体の構造を3D天体儀として表示。
 * これがデフォルトの表示モード。
 */

import { BaseViewState, type ViewModeName } from '../ViewState';
import type { ConstellationViewPanel } from '../ConstellationViewPanel';
import { DetailState } from './DetailState';
import { FilterState } from './FilterState';
import { SearchState } from './SearchState';

export class OverviewState extends BaseViewState {
  readonly name: ViewModeName = 'Overview';

  async enter(context: ConstellationViewPanel): Promise<void> {
    context.logToOutput('[Constellation] 全体表示モードに入りました');
    await context.refresh();
  }

  render(context: ConstellationViewPanel): string {
    const data = context.getData();

    return `
      ${this.getHtmlHeader('🌟 天体儀 - 全体表示')}

      <div class="header">
        <h1>🌟 プロジェクト構造（天体儀）</h1>
        <div class="toolbar">
          <button onclick="showSearch()">🔍 検索</button>
          <button onclick="showFilter()">🎯 フィルター</button>
          <button onclick="requestData()">🔄 更新</button>
        </div>
      </div>

      <div id="canvas-container"></div>

      ${this.getHtmlFooter()}

      <script type="module">
        import * as THREE from '${context.getThreeJsUri()}';
        import { OrbitControls } from '${context.getOrbitControlsUri()}';

        // Three.js シーン初期化
        const container = document.getElementById('canvas-container');
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });

        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        camera.position.z = 5;

        // データレンダリング
        function renderConstellationData(data) {
          // 既存のオブジェクトをクリア
          while(scene.children.length > 0) {
            scene.remove(scene.children[0]);
          }

          // ライト追加
          const light = new THREE.AmbientLight(0x404040);
          scene.add(light);
          const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
          directionalLight.position.set(1, 1, 1);
          scene.add(directionalLight);

          // ノードを描画
          if (data && data.nodes) {
            data.nodes.forEach(node => {
              const geometry = new THREE.SphereGeometry(0.1, 32, 32);
              const material = new THREE.MeshStandardMaterial({
                color: node.color || 0x4488ff
              });
              const sphere = new THREE.Mesh(geometry, material);

              sphere.position.set(
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4
              );

              sphere.userData = { nodeId: node.id, nodeData: node };
              scene.add(sphere);
            });
          }
        }

        // アニメーションループ
        function animate() {
          requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        }
        animate();

        // ウィンドウリサイズ対応
        window.addEventListener('resize', () => {
          camera.aspect = container.clientWidth / container.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(container.clientWidth, container.clientHeight);
        });

        // クリックイベント
        renderer.domElement.addEventListener('click', (event) => {
          const mouse = new THREE.Vector2();
          mouse.x = (event.clientX / container.clientWidth) * 2 - 1;
          mouse.y = -(event.clientY / container.clientHeight) * 2 + 1;

          const raycaster = new THREE.Raycaster();
          raycaster.setFromCamera(mouse, camera);

          const intersects = raycaster.intersectObjects(scene.children);
          if (intersects.length > 0) {
            const nodeId = intersects[0].object.userData.nodeId;
            if (nodeId) {
              vscode.postMessage({
                command: 'showDetail',
                nodeId: nodeId
              });
            }
          }
        });

        // メッセージハンドラー
        window.handleMessage = function(message) {
          if (message.command === 'renderData' && message.data) {
            renderConstellationData(message.data);
          }
        };

        // 検索表示
        window.showSearch = function() {
          vscode.postMessage({ command: 'showSearch' });
        };

        // フィルター表示
        window.showFilter = function() {
          vscode.postMessage({ command: 'showFilter' });
        };
      </script>
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
        await this.showSearch(context, '');
        break;
      case 'showFilter':
        await this.showFilter(context, {});
        break;
    }
  }

  async updateData(context: ConstellationViewPanel): Promise<void> {
    const data = context.getData();
    context.postMessage({ command: 'renderData', data });
  }

  async showDetail(context: ConstellationViewPanel, nodeId: string): Promise<void> {
    await context.transitionToState(new DetailState(nodeId));
  }

  async showFilter(context: ConstellationViewPanel, filters: Record<string, any>): Promise<void> {
    await context.transitionToState(new FilterState(filters));
  }

  async showSearch(context: ConstellationViewPanel, query: string): Promise<void> {
    await context.transitionToState(new SearchState(query));
  }

  canTransitionTo(modeName: ViewModeName): boolean {
    return ['Detail', 'Filter', 'Search'].includes(modeName);
  }

  getDescription(): string {
    return 'プロジェクト全体を3D天体儀として表示しています。';
  }
}
