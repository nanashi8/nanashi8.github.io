import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import type { ViewModeName } from '../ViewState';
import { BaseViewState } from '../ViewState';
import { ConstellationViewPanel } from '../ConstellationViewPanel';
import { OverviewState } from './OverviewState';

type HealthItem = {
  label: string;
  status: 'ok' | 'warn' | 'error';
  detail?: string;
};

type HealthSnapshot = {
  generatedAt: string;
  workspaceRoot: string;
  isTrusted: boolean;
  items: HealthItem[];
};

const statusBadge = (status: HealthItem['status']): string => {
  switch (status) {
    case 'ok':
      return '<span class="badge ok">OK</span>';
    case 'warn':
      return '<span class="badge warn">WARN</span>';
    case 'error':
      return '<span class="badge err">ERROR</span>';
    default:
      return '<span class="badge warn">UNKNOWN</span>';
  }
};

export class MaintenanceState extends BaseViewState {
  public readonly name: ViewModeName = 'Maintenance';

  private snapshot: HealthSnapshot | null = null;

  async enter(_context: ConstellationViewPanel): Promise<void> {
    this.snapshot = await this.buildSnapshot();
  }

  async exit(_context: ConstellationViewPanel): Promise<void> {
    // no-op
  }

  render(_context: ConstellationViewPanel): string {
    const snap = this.snapshot;

    const generatedAt = snap?.generatedAt ?? new Date().toLocaleString('ja-JP');
    const workspaceRoot = snap?.workspaceRoot ?? '(unknown)';
    const trusted = snap?.isTrusted ?? false;

    const itemsHtml = (snap?.items ?? [])
      .map((it) => {
        const detail = it.detail ? `<div class="detail">${escapeHtml(it.detail)}</div>` : '';
        return `<div class="row">
  <div class="cell status">${statusBadge(it.status)}</div>
  <div class="cell main">
    <div class="label">${escapeHtml(it.label)}</div>
    ${detail}
  </div>
</div>`;
      })
      .join('\n');

    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>健全診断</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      margin: 0;
      padding: 16px;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding-bottom: 12px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    .title {
      display: flex;
      align-items: baseline;
      gap: 10px;
    }
    .title h1 {
      margin: 0;
      font-size: 18px;
    }
    .meta {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }
    .toolbar {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    button {
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 6px 10px;
      cursor: pointer;
      border-radius: 4px;
      font-size: 12px;
    }
    button:hover {
      background-color: var(--vscode-button-hoverBackground);
    }
    .panel {
      background: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 8px;
      padding: 12px;
    }
    .row {
      display: grid;
      grid-template-columns: 64px 1fr;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    .row:last-child {
      border-bottom: none;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-weight: 600;
      font-size: 11px;
      text-align: center;
      width: 100%;
      box-sizing: border-box;
    }
    .badge.ok {
      background: rgba(46, 160, 67, 0.25);
      color: #2ea043;
      border: 1px solid rgba(46, 160, 67, 0.45);
    }
    .badge.warn {
      background: rgba(255, 166, 0, 0.18);
      color: #c69026;
      border: 1px solid rgba(255, 166, 0, 0.35);
    }
    .badge.err {
      background: rgba(248, 81, 73, 0.18);
      color: #f85149;
      border: 1px solid rgba(248, 81, 73, 0.35);
    }
    .label {
      font-weight: 600;
      margin-bottom: 2px;
    }
    .detail {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      white-space: pre-wrap;
    }
    .sectionTitle {
      margin: 14px 0 8px;
      font-weight: 700;
    }
    .hint {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-top: 8px;
      line-height: 1.5;
    }
    code {
      font-family: var(--vscode-editor-font-family);
      background: rgba(127,127,127,0.15);
      padding: 0 6px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">
      <h1>🩺 メンテナンス / 健全診断</h1>
      <div class="meta">生成: ${escapeHtml(generatedAt)}</div>
    </div>
    <div class="toolbar">
      <button onclick="backToOverview()">◀️ 戻る</button>
      <button onclick="refreshHealth()">🔄 再診断</button>
      <button onclick="openServantOutput()">📄 Output（Servant）</button>
    </div>
  </div>

  <div class="panel">
    <div class="sectionTitle">現在の状態</div>
    <div class="hint">
      Workspace: <code>${escapeHtml(workspaceRoot)}</code><br />
      Trusted: <code>${trusted ? 'true' : 'false'}</code>
    </div>

    <div class="sectionTitle">診断項目</div>
    ${itemsHtml || '<div class="hint">（項目がありません）</div>'}

    <div class="sectionTitle">メンテナンス実行</div>
    <div class="toolbar" style="justify-content:flex-start; margin-top: 8px;">
      <button onclick="runCommand('servant.evaluateWorkspaceReadiness')">📋 Workspace評価書</button>
      <button onclick="runCommand('servant.validateBeforeCommit')">🛡️ Validate Before Commit</button>
      <button onclick="runCommand('servant.validate')">🧾 Validate Instructions</button>
      <button onclick="runCommand('servant.recordSpecCheck')">📝 Record Spec Check</button>
      <button onclick="runCommand('servant.reviewRequiredInstructions')">📌 Review Required Instructions</button>
    </div>

    <div class="hint">
      実行ログは主に Output（Servant）に出ます。必要に応じて上のボタンで開いてください。<br />
      ここは「紹介画面（天体儀）」から辿れる簡易メンテナンス画面です。
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    window.backToOverview = function() {
      vscode.postMessage({ command: 'showOverview' });
    };

    window.refreshHealth = function() {
      vscode.postMessage({ command: 'refreshHealth' });
    };

    window.runCommand = function(commandId) {
      vscode.postMessage({ command: 'runCommand', commandId });
    };

    window.openServantOutput = function() {
      vscode.postMessage({ command: 'openServantOutput' });
    };

    vscode.postMessage({ command: 'ready' });
  </script>
</body>
</html>`;
  }

  async handleMessage(context: ConstellationViewPanel, message: any): Promise<void> {
    switch (message?.command) {
      case 'showOverview':
        await this.showOverview(context);
        break;
      case 'refreshHealth':
        this.snapshot = await this.buildSnapshot();
        await context.refresh();
        break;
      case 'openServantOutput':
        await vscode.commands.executeCommand('servant.showOutput');
        break;
      case 'runCommand':
        await this.executeAllowedCommand(message?.commandId);
        break;
    }
  }

  async updateData(_context: ConstellationViewPanel): Promise<void> {
    // no-op (this view is not graph-driven)
  }

  async showOverview(context: ConstellationViewPanel): Promise<void> {
    await context.transitionToState(new OverviewState());
  }

  getDescription(): string {
    return '🩺 メンテナンス / 健全診断（簡易）';
  }

  private async executeAllowedCommand(commandId: unknown): Promise<void> {
    const id = String(commandId ?? '');
    const allow = new Set([
      'servant.validateBeforeCommit',
      'servant.validate',
      'servant.recordSpecCheck',
      'servant.reviewRequiredInstructions',
      'servant.showOutput',
    ]);

    if (!allow.has(id)) {
      vscode.window.showWarningMessage(`許可されていないコマンドです: ${id}`);
      return;
    }

    try {
      await vscode.commands.executeCommand(id);
    } catch (e) {
      vscode.window.showErrorMessage(`コマンド実行に失敗: ${id} (${String(e)})`);
    }
  }

  private async buildSnapshot(): Promise<HealthSnapshot> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '(no-workspace)';
    const isTrusted = vscode.workspace.isTrusted;

    const items: HealthItem[] = [];

    // Workspace trust
    items.push({
      label: 'ワークスペースが信頼されている',
      status: isTrusted ? 'ok' : 'error',
      detail: isTrusted ? 'Restricted Modeでは多くの機能が無効になります。' : 'workbench.action.manageWorkspaceTrust で信頼してください。',
    });

    // Git marker
    const gitPath = path.join(workspaceRoot, '.git');
    if (workspaceRoot !== '(no-workspace)' && fs.existsSync(gitPath)) {
      items.push({ label: 'Gitリポジトリが存在する', status: 'ok', detail: gitPath });
    } else {
      items.push({
        label: 'Gitリポジトリが存在する',
        status: workspaceRoot === '(no-workspace)' ? 'warn' : 'warn',
        detail: workspaceRoot === '(no-workspace)' ? 'ワークスペースがありません。' : 'このプロジェクトはGit管理外かもしれません。',
      });
    }

    // Instructions folder
    const instructionDir = path.join(workspaceRoot, '.aitk', 'instructions');
    if (workspaceRoot !== '(no-workspace)' && fs.existsSync(instructionDir)) {
      items.push({ label: 'AI指示ファイル（.aitk/instructions）が存在', status: 'ok', detail: instructionDir });
    } else {
      items.push({
        label: 'AI指示ファイル（.aitk/instructions）が存在',
        status: 'warn',
        detail: '無い場合、ガード/自動検証が期待通りに動かない可能性があります。',
      });
    }

    // Package.json
    const packageJson = path.join(workspaceRoot, 'package.json');
    if (workspaceRoot !== '(no-workspace)' && fs.existsSync(packageJson)) {
      items.push({ label: 'package.json が存在', status: 'ok', detail: packageJson });
    } else {
      items.push({ label: 'package.json が存在', status: 'warn', detail: 'Nodeプロジェクトでない場合は問題ありません。' });
    }

    return {
      generatedAt: new Date().toLocaleString('ja-JP'),
      workspaceRoot,
      isTrusted,
      items,
    };
  }
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
