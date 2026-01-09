/**
 * SearchState - 検索表示モード
 * 
 * ノードを検索して表示。
 */

import { BaseViewState, type ViewModeName } from '../ViewState';
import type { ConstellationViewPanel } from '../ConstellationViewPanel';
import { OverviewState } from './OverviewState';
import { DetailState } from './DetailState';

export class SearchState extends BaseViewState {
  readonly name: ViewModeName = 'Search';

  constructor(private query: string = '') {
    super();
  }

  async enter(context: ConstellationViewPanel): Promise<void> {
    context.logToOutput(`[Constellation] 検索表示モードに入りました`);
    await context.refresh();
  }

  render(context: ConstellationViewPanel): string {
    const results = context.searchNodes(this.query);
    
    return `
      ${this.getHtmlHeader('🌟 天体儀 - 検索')}
      
      <div class="header">
        <h1>🔍 検索</h1>
        <div class="toolbar">
          <button onclick="backToOverview()">◀️ 戻る</button>
        </div>
      </div>
      
      <div class="search-panel">
        <div class="search-box">
          <input 
            type="text" 
            id="search-input" 
            placeholder="ノード名、パスで検索..."
            value="${this.query}"
            onkeypress="if(event.key==='Enter') executeSearch()"
          />
          <button onclick="executeSearch()">検索</button>
        </div>
        
        <h2>検索結果 (${results.length}件)</h2>
        <div class="results">
          ${results.length === 0 ? `
            <p class="no-results">
              ${this.query ? '該当するノードが見つかりませんでした。' : '検索ワードを入力してください。'}
            </p>
          ` : `
            <ul>
              ${results.map(node => `
                <li onclick="selectNode('${node.id}')">
                  <div class="node-info">
                    <strong>${node.name || node.id}</strong>
                    <span class="node-type">${node.type || 'N/A'}</span>
                  </div>
                  <div class="node-path">${node.path || ''}</div>
                </li>
              `).join('')}
            </ul>
          `}
        </div>
      </div>
      
      ${this.getHtmlFooter()}
      
      <script>
        window.executeSearch = function() {
          const query = document.getElementById('search-input').value;
          vscode.postMessage({ 
            command: 'search',
            query: query
          });
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
        
        // 初期化時にフォーカス
        document.getElementById('search-input').focus();
      </script>
      
      <style>
        .search-panel {
          padding: 20px;
        }
        .search-box {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        .search-box input {
          flex: 1;
          padding: 8px;
          background-color: var(--vscode-input-background);
          color: var(--vscode-input-foreground);
          border: 1px solid var(--vscode-input-border);
          font-family: var(--vscode-font-family);
        }
        .results ul {
          list-style-type: none;
          padding-left: 0;
        }
        .results li {
          padding: 12px;
          cursor: pointer;
          border-bottom: 1px solid var(--vscode-panel-border);
        }
        .results li:hover {
          background-color: var(--vscode-list-hoverBackground);
        }
        .node-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .node-type {
          font-size: 0.9em;
          opacity: 0.7;
        }
        .node-path {
          font-size: 0.85em;
          opacity: 0.6;
        }
        .no-results {
          text-align: center;
          padding: 40px;
          opacity: 0.6;
        }
      </style>
    `;
  }

  async handleMessage(context: ConstellationViewPanel, message: any): Promise<void> {
    switch (message.command) {
      case 'search':
        this.query = message.query || '';
        await context.refresh();
        break;
      case 'showOverview':
        await this.showOverview(context);
        break;
      case 'showDetail':
        await this.showDetail(context, message.nodeId);
        break;
    }
  }

  async updateData(context: ConstellationViewPanel): Promise<void> {
    await context.refresh();
  }

  async showOverview(context: ConstellationViewPanel): Promise<void> {
    await context.transitionToState(new OverviewState());
  }

  async showDetail(context: ConstellationViewPanel, nodeId: string): Promise<void> {
    await context.transitionToState(new DetailState(nodeId));
  }

  canTransitionTo(modeName: ViewModeName): boolean {
    return ['Overview', 'Detail'].includes(modeName);
  }

  getDescription(): string {
    return this.query 
      ? `「${this.query}」を検索しています。`
      : '検索モードです。';
  }

  getQuery(): string {
    return this.query;
  }
}
