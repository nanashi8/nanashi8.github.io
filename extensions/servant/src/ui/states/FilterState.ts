/**
 * FilterState - フィルター表示モード
 * 
 * 特定の条件でノードをフィルタリングして表示。
 */

import { BaseViewState, type ViewModeName } from '../ViewState';
import type { ConstellationViewPanel } from '../ConstellationViewPanel';
import { OverviewState } from './OverviewState';

export class FilterState extends BaseViewState {
  readonly name: ViewModeName = 'Filter';

  constructor(private filters: Record<string, any> = {}) {
    super();
  }

  async enter(context: ConstellationViewPanel): Promise<void> {
    context.logToOutput(`[Constellation] フィルター表示モードに入りました`);
    await context.refresh();
  }

  render(context: ConstellationViewPanel): string {
    const filteredData = context.getFilteredData(this.filters);
    
    return `
      ${this.getHtmlHeader('🌟 天体儀 - フィルター')}
      
      <div class="header">
        <h1>🎯 フィルター表示</h1>
        <div class="toolbar">
          <button onclick="clearFilter()">❌ クリア</button>
          <button onclick="backToOverview()">◀️ 戻る</button>
        </div>
      </div>
      
      <div class="filter-panel">
        <h2>フィルター条件</h2>
        <div class="filter-controls">
          <label>
            タイプ:
            <select id="type-filter">
              <option value="">すべて</option>
              <option value="module">モジュール</option>
              <option value="file">ファイル</option>
              <option value="function">関数</option>
            </select>
          </label>
          <button onclick="applyFilter()">適用</button>
        </div>
        
        <h2>結果 (${filteredData.nodes?.length || 0}件)</h2>
        <div class="results">
          <ul>
            ${(filteredData.nodes || []).map((node: any) => `
              <li onclick="selectNode('${node.id}')">
                ${node.name || node.id} (${node.type || 'N/A'})
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
      
      ${this.getHtmlFooter()}
      
      <script>
        window.applyFilter = function() {
          const typeFilter = document.getElementById('type-filter').value;
          vscode.postMessage({ 
            command: 'applyFilter',
            filters: { type: typeFilter }
          });
        };
        
        window.clearFilter = function() {
          vscode.postMessage({ command: 'clearFilter' });
        };
        
        window.backToOverview = function() {
          vscode.postMessage({ command: 'showOverview' });
        };
        
        window.selectNode = function(nodeId) {
          vscode.postMessage({ 
            command: 'showDetail',
            nodeId: nodeId
          });
        };
      </script>
      
      <style>
        .filter-panel {
          padding: 20px;
        }
        .filter-controls {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-bottom: 20px;
        }
        .filter-controls label {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .filter-controls select {
          padding: 4px 8px;
          background-color: var(--vscode-input-background);
          color: var(--vscode-input-foreground);
          border: 1px solid var(--vscode-input-border);
        }
        .results ul {
          list-style-type: none;
          padding-left: 0;
        }
        .results li {
          padding: 8px;
          cursor: pointer;
          border-bottom: 1px solid var(--vscode-panel-border);
        }
        .results li:hover {
          background-color: var(--vscode-list-hoverBackground);
        }
      </style>
    `;
  }

  async handleMessage(context: ConstellationViewPanel, message: any): Promise<void> {
    switch (message.command) {
      case 'applyFilter':
        this.filters = message.filters || {};
        await context.refresh();
        break;
      case 'clearFilter':
        await this.showOverview(context);
        break;
      case 'showOverview':
        await this.showOverview(context);
        break;
      case 'showDetail':
        // DetailStateへの遷移は許可しない（Overviewを経由）
        await this.showOverview(context);
        break;
    }
  }

  async updateData(context: ConstellationViewPanel): Promise<void> {
    await context.refresh();
  }

  async showOverview(context: ConstellationViewPanel): Promise<void> {
    await context.transitionToState(new OverviewState());
  }

  canTransitionTo(modeName: ViewModeName): boolean {
    return modeName === 'Overview';
  }

  getDescription(): string {
    const filterCount = Object.keys(this.filters).length;
    return `${filterCount}個のフィルター条件で表示しています。`;
  }

  getFilters(): Record<string, any> {
    return this.filters;
  }
}
