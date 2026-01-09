/**
 * DetailState - 詳細表示モード
 * 
 * 特定のノード（ファイル/モジュール）の詳細情報を表示。
 */

import { BaseViewState, type ViewModeName } from '../ViewState';
import type { ConstellationViewPanel } from '../ConstellationViewPanel';
import { OverviewState } from './OverviewState';

export class DetailState extends BaseViewState {
  readonly name: ViewModeName = 'Detail';

  constructor(private selectedNodeId: string) {
    super();
  }

  async enter(context: ConstellationViewPanel): Promise<void> {
    context.logToOutput(`[Constellation] 詳細表示モードに入りました (Node: ${this.selectedNodeId})`);
    await context.refresh();
  }

  render(context: ConstellationViewPanel): string {
    const nodeData = context.getNodeData(this.selectedNodeId);
    
    if (!nodeData) {
      return this.renderNotFound(context);
    }

    return `
      ${this.getHtmlHeader(`🌟 天体儀 - ${nodeData.name || this.selectedNodeId}`)}
      
      <div class="header">
        <h1>📋 ${nodeData.name || this.selectedNodeId}</h1>
        <div class="toolbar">
          <button onclick="backToOverview()">◀️ 戻る</button>
        </div>
      </div>
      
      <div class="detail-content">
        <h2>基本情報</h2>
        <table>
          <tr>
            <th>ID:</th>
            <td>${this.selectedNodeId}</td>
          </tr>
          <tr>
            <th>名前:</th>
            <td>${nodeData.name || 'N/A'}</td>
          </tr>
          <tr>
            <th>タイプ:</th>
            <td>${nodeData.type || 'N/A'}</td>
          </tr>
          <tr>
            <th>パス:</th>
            <td>${nodeData.path || 'N/A'}</td>
          </tr>
        </table>
        
        <h2>依存関係</h2>
        <div>
          <h3>依存先 (${nodeData.dependencies?.length || 0})</h3>
          <ul>
            ${(nodeData.dependencies || []).map((dep: any) => `<li>${dep}</li>`).join('')}
          </ul>
          
          <h3>被依存 (${nodeData.dependents?.length || 0})</h3>
          <ul>
            ${(nodeData.dependents || []).map((dep: any) => `<li>${dep}</li>`).join('')}
          </ul>
        </div>
      </div>
      
      ${this.getHtmlFooter()}
      
      <script>
        window.backToOverview = function() {
          vscode.postMessage({ command: 'showOverview' });
        };
      </script>
      
      <style>
        .detail-content {
          padding: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid var(--vscode-panel-border);
        }
        th {
          font-weight: bold;
          width: 120px;
        }
        ul {
          list-style-type: none;
          padding-left: 0;
        }
        li {
          padding: 4px 0;
        }
      </style>
    `;
  }

  private renderNotFound(context: ConstellationViewPanel): string {
    return `
      ${this.getHtmlHeader('🌟 天体儀 - ノードが見つかりません')}
      
      <div class="header">
        <h1>⚠️ ノードが見つかりません</h1>
        <div class="toolbar">
          <button onclick="backToOverview()">◀️ 戻る</button>
        </div>
      </div>
      
      <div class="detail-content">
        <p>ノードID「${this.selectedNodeId}」が見つかりませんでした。</p>
      </div>
      
      ${this.getHtmlFooter()}
      
      <script>
        window.backToOverview = function() {
          vscode.postMessage({ command: 'showOverview' });
        };
      </script>
    `;
  }

  async handleMessage(context: ConstellationViewPanel, message: any): Promise<void> {
    if (message.command === 'showOverview') {
      await this.showOverview(context);
    }
  }

  async updateData(context: ConstellationViewPanel): Promise<void> {
    // 詳細表示では再レンダリング
    await context.refresh();
  }

  async showOverview(context: ConstellationViewPanel): Promise<void> {
    await context.transitionToState(new OverviewState());
  }

  canTransitionTo(modeName: ViewModeName): boolean {
    return modeName === 'Overview';
  }

  getDescription(): string {
    return `ノード「${this.selectedNodeId}」の詳細を表示しています。`;
  }

  getSelectedNodeId(): string {
    return this.selectedNodeId;
  }
}
