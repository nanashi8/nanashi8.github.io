import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { parseDocument } from 'yaml';
import { ServantWarningLogger } from '../ui/ServantWarningLogger';
import { EventBus, ServantEvents, globalEventBus } from '../core/EventBus';

interface WorkflowInfo {
  name: string;
  file: string;
  filePath: string;
  content: string;
  triggers: string[];
  jobs: string[];
  nodeVersions: string[];
  hasGitPush: boolean;
  hasContentsWrite: boolean;
  hasYamlParseError: boolean;
}

interface HealthIssue {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  files: string[];
  suggestion: string;
}

interface RemediationItem {
  title: string;
  priority: 'P0' | 'P1' | 'P2';
  files: string[];
  // サーバント所見: 最大3つ（必要/推奨/非推奨）
  actions: Array<{
    kind: '必要' | '推奨' | '非推奨';
    text: string;
  }>;
  steps: string[];
}

export class ActionsHealthMonitor implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  private workspaceRoot: string;
  private logger: ServantWarningLogger;
  private diagnostics: vscode.DiagnosticCollection;
  private lastCheckTime = 0;
  private readonly CHECK_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 週次
  private statusUpdateCallback: ((status: string) => void) | null = null;
  private eventBus: EventBus;

  constructor(
    workspaceRoot: string,
    logger: ServantWarningLogger,
    eventBus: EventBus = globalEventBus
  ) {
    this.workspaceRoot = workspaceRoot;
    this.logger = logger;
    this.eventBus = eventBus;

    this.diagnostics = vscode.languages.createDiagnosticCollection('servant-actions-health');
    this.disposables.push(this.diagnostics);

    // 起動時に1回チェック
    this.checkActionsHealth();

    // ワークフローファイル変更を監視
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(workspaceRoot, '.github/workflows/*.{yml,yaml}')
    );

    watcher.onDidChange(() => this.scheduleCheck());
    watcher.onDidCreate(() => this.scheduleCheck());
    watcher.onDidDelete(() => this.scheduleCheck());

    this.disposables.push(watcher);

    // 定期チェック（起動時から週次）
    const timer = setInterval(() => {
      const now = Date.now();
      if (now - this.lastCheckTime >= this.CHECK_INTERVAL) {
        this.checkActionsHealth();
      }
    }, 60 * 60 * 1000); // 1時間ごとに判定

    this.disposables.push({ dispose: () => clearInterval(timer) });
  }

  /**
   * ステータス更新コールバックを設定
   */
  public setStatusUpdateCallback(callback: (status: string) => void): void {
    this.statusUpdateCallback = callback;
  }

  /**
   * ステータスを更新
   */
  private updateStatus(status: string): void {
    // EventBus経由で通知
    this.eventBus.emit(ServantEvents.STATUS_UPDATE, {
      message: status,
      icon: status.includes('🔧') ? '🔧' : undefined
    });

    // 後方互換性のため既存のコールバックも呼び出す
    if (this.statusUpdateCallback) {
      this.statusUpdateCallback(status);
    }
  }

  private scheduleCheck() {
    // 変更から5秒後にチェック（連続変更を束ねる）
    setTimeout(() => this.checkActionsHealth(), 5000);
  }

  private async checkActionsHealth(): Promise<void> {
    this.lastCheckTime = Date.now();
    this.updateStatus('🔧 Actions検証中...');

    const workflowsDir = path.join(this.workspaceRoot, '.github', 'workflows');
    if (!fs.existsSync(workflowsDir)) {
      return;
    }

    const workflows = await this.loadWorkflows(workflowsDir);
    const { issues, diagnostics } = this.analyzeWorkflows(workflows);

    this.publishDiagnostics(diagnostics);

    if (issues.length > 0) {
      this.updateStatus(`⚠️ Actions問題: ${issues.length}件`);
      this.reportIssues(issues);
    } else {
      this.updateStatus('✅ Actions健全');
    }
  }

  private publishDiagnostics(diagnostics: Map<string, vscode.Diagnostic[]>): void {
    this.diagnostics.clear();
    for (const [filePath, diags] of diagnostics.entries()) {
      this.diagnostics.set(vscode.Uri.file(filePath), diags);
    }
  }

  private static positionOf(content: string, needle: string): vscode.Position {
    const index = content.indexOf(needle);
    if (index < 0) return new vscode.Position(0, 0);

    const before = content.slice(0, index);
    const line = before.split('\n').length - 1;
    const lastNewline = before.lastIndexOf('\n');
    const character = lastNewline >= 0 ? before.length - lastNewline - 1 : before.length;
    return new vscode.Position(line, character);
  }

  private static diagnosticFor(content: string, message: string, severity: vscode.DiagnosticSeverity, needle?: string): vscode.Diagnostic {
    const start = needle ? ActionsHealthMonitor.positionOf(content, needle) : new vscode.Position(0, 0);
    const end = new vscode.Position(start.line, start.character + 1);
    const d = new vscode.Diagnostic(new vscode.Range(start, end), message, severity);
    d.source = 'Servant ActionsHealthMonitor';
    return d;
  }

  private async loadWorkflows(dir: string): Promise<WorkflowInfo[]> {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
    const workflows: WorkflowInfo[] = [];

    for (const file of files) {
      try {
        const filePath = path.join(dir, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        const doc = parseDocument(content);
        const hasYamlParseError = (doc.errors?.length ?? 0) > 0;
        const yaml = (doc.toJSON() ?? {}) as any;

        const triggers: string[] = [];
        if (yaml.on) {
          if (typeof yaml.on === 'string') {
            triggers.push(yaml.on);
          } else if (Array.isArray(yaml.on)) {
            triggers.push(...yaml.on);
          } else if (typeof yaml.on === 'object') {
            triggers.push(...Object.keys(yaml.on));
          }
        }

        const jobs = yaml.jobs ? Object.keys(yaml.jobs) : [];
        const nodeVersions: string[] = [];
        let hasGitPush = false;
        let hasContentsWrite = false;

        // ジョブ内容を解析
        if (yaml.jobs) {
          for (const job of Object.values(yaml.jobs) as any[]) {
            if (job.steps) {
              for (const step of job.steps) {
                // Node version 抽出
                if (step.uses?.includes('setup-node')) {
                  const nodeVer = step.with?.['node-version'];
                  if (nodeVer) nodeVersions.push(String(nodeVer));
                }
                // git push 検出
                if (step.run?.includes('git push')) {
                  hasGitPush = true;
                }
              }
            }
          }
        }

        // permissions チェック
        if (yaml.permissions?.contents === 'write') {
          hasContentsWrite = true;
        }
        if (yaml.jobs) {
          for (const job of Object.values(yaml.jobs) as any[]) {
            if (job.permissions?.contents === 'write') {
              hasContentsWrite = true;
              break;
            }
          }
        }

        workflows.push({
          name: yaml.name || file,
          file,
          filePath,
          content,
          triggers,
          jobs,
          nodeVersions,
          hasGitPush,
          hasContentsWrite,
          hasYamlParseError
        });
      } catch {
        // YAML parse エラーは無視（別の仕組みで検出される）
      }
    }

    return workflows;
  }

  private analyzeWorkflows(workflows: WorkflowInfo[]): { issues: HealthIssue[]; diagnostics: Map<string, vscode.Diagnostic[]> } {
    const issues: HealthIssue[] = [];
    const diagnostics = new Map<string, vscode.Diagnostic[]>();

    const addDiag = (filePath: string, diag: vscode.Diagnostic) => {
      const current = diagnostics.get(filePath) ?? [];
      current.push(diag);
      diagnostics.set(filePath, current);
    };

    // 0. YAML破損/残骸混入の簡易検知（name/on/jobs の重複）
    for (const wf of workflows) {
      const nameCount = (wf.content.match(/^name\s*:/gm) ?? []).length;
      const onCount = (wf.content.match(/^on\s*:/gm) ?? []).length;
      const jobsCount = (wf.content.match(/^jobs\s*:/gm) ?? []).length;

      if (nameCount > 1 || onCount > 1 || jobsCount > 1) {
        issues.push({
          severity: 'critical',
          category: 'ワークフロー破損の疑い',
          message: `${wf.file} に複数のトップレベル定義が混入している可能性があります（name:${nameCount}, on:${onCount}, jobs:${jobsCount}）`,
          files: [wf.file],
          suggestion: '置換/追記の残骸が混ざっていないか確認し、ファイルを1つのワークフロー定義に正規化してください'
        });

        addDiag(
          wf.filePath,
          ActionsHealthMonitor.diagnosticFor(
            wf.content,
            'ワークフローが破損している可能性があります（トップレベル定義が複数存在）。',
            vscode.DiagnosticSeverity.Error,
            'name:'
          )
        );
      }

      if (wf.hasYamlParseError) {
        issues.push({
          severity: 'warning',
          category: 'YAMLパースエラー',
          message: `${wf.file} はYAMLパースエラーを含む可能性があります`,
          files: [wf.file],
          suggestion: 'YAMLのインデントやマッピングの整合性を確認してください'
        });
        addDiag(
          wf.filePath,
          ActionsHealthMonitor.diagnosticFor(
            wf.content,
            'YAMLの解析でエラーが検出されました。インデント/構文を確認してください。',
            vscode.DiagnosticSeverity.Warning
          )
        );
      }
    }

    // 0.5 再利用ワークフロー(job.uses)の誤用を静的検知（continue-on-error/steps/outputs等）
    // NOTE: 位置情報が取れないため、テキスト検索で近い位置に紐付け
    for (const wf of workflows) {
      const doc = parseDocument(wf.content);
      const yaml = (doc.toJSON() ?? {}) as any;
      const jobs = yaml.jobs && typeof yaml.jobs === 'object' ? yaml.jobs : undefined;
      if (!jobs) continue;

      for (const [jobId, job] of Object.entries(jobs) as Array<[string, any]>) {
        if (!job || typeof job !== 'object') continue;

        const isReusableCall = typeof job.uses === 'string';
        if (!isReusableCall) {
          // ローカルaction uses (./.github/actions) を使うジョブで checkout が無いケースを検知
          if (Array.isArray(job.steps)) {
            const usesLocalActionIndex = job.steps.findIndex((s: any) => typeof s?.uses === 'string' && s.uses.startsWith('./.github/actions/'));
            if (usesLocalActionIndex >= 0) {
              const hasCheckoutBefore = job.steps.slice(0, usesLocalActionIndex).some((s: any) => typeof s?.uses === 'string' && s.uses.includes('actions/checkout'));
              if (!hasCheckoutBefore) {
                issues.push({
                  severity: 'warning',
                  category: 'ローカルAction利用',
                  message: `${wf.file} の job '${jobId}' はローカルActionを使っていますが checkout が先行していない可能性があります`,
                  files: [wf.file],
                  suggestion: 'ローカルActionを使う前に actions/checkout を実行してください（リポジトリ内容が必要です）'
                });
                addDiag(
                  wf.filePath,
                  ActionsHealthMonitor.diagnosticFor(
                    wf.content,
                    `job '${jobId}': ローカルActionの前に actions/checkout が見当たりません。`,
                    vscode.DiagnosticSeverity.Warning,
                    `uses: ./.github/actions/`
                  )
                );
              }
            }
          }

          continue;
        }

        const forbiddenKeys = ['runs-on', 'steps', 'outputs', 'services', 'container', 'timeout-minutes', 'continue-on-error'];
        const presentForbidden = forbiddenKeys.filter(k => Object.prototype.hasOwnProperty.call(job, k));
        if (presentForbidden.length > 0) {
          issues.push({
            severity: 'critical',
            category: 'Reusable Workflow 誤用',
            message: `${wf.file} の job '${jobId}' は再利用ワークフロー呼び出し(job.uses)ですが、併用できないキーがあります: ${presentForbidden.join(', ')}`,
            files: [wf.file],
            suggestion: 'job.uses を使うジョブは、name/uses/with/secrets/permissions/needs/if/strategy のみを基本に構成してください'
          });
          addDiag(
            wf.filePath,
            ActionsHealthMonitor.diagnosticFor(
              wf.content,
              `job '${jobId}': 再利用ワークフロー呼び出しと併用できないキーがあります (${presentForbidden.join(', ')}).`,
              vscode.DiagnosticSeverity.Error,
              `uses:`
            )
          );
        }
      }
    }

    // 1. デプロイの重複起動チェック
    const deployWorkflows = workflows.filter(w =>
      w.name.toLowerCase().includes('deploy') ||
      w.jobs.some(j => j.toLowerCase().includes('deploy'))
    );
    const pushMainDeploys = deployWorkflows.filter(w =>
      w.triggers.includes('push') && !w.file.includes('auto-deploy')
    );
    if (pushMainDeploys.length > 1) {
      issues.push({
        severity: 'critical',
        category: 'デプロイ重複',
        message: `push(main) で複数のデプロイワークフローが起動します（${pushMainDeploys.length}件）`,
        files: pushMainDeploys.map(w => w.file),
        suggestion: '1つのワークフローに統合するか、他を workflow_dispatch のみに変更してください'
      });
    }

    // 2. Node version 不整合
    const allNodeVersions = new Set(workflows.flatMap(w => w.nodeVersions));
    if (allNodeVersions.size > 1) {
      const versionList = Array.from(allNodeVersions).join(', ');
      const filesWithOldNode = workflows
        .filter(w => w.nodeVersions.some(v => v === '18'))
        .map(w => w.file);

      if (filesWithOldNode.length > 0) {
        issues.push({
          severity: 'warning',
          category: 'Node version 不整合',
          message: `複数の Node version が混在しています: ${versionList}`,
          files: filesWithOldNode,
          suggestion: 'すべて Node 20 に統一してください（18 は engine 要件と不一致）'
        });
      }
    }

    // 3. 品質チェックの重複
    const qualityWorkflows = workflows.filter(w =>
      w.triggers.includes('push') &&
      (w.jobs.some(j => j.includes('lint') || j.includes('check') || j.includes('test')))
    );
    if (qualityWorkflows.length > 3) {
      issues.push({
        severity: 'warning',
        category: '品質チェック重複',
        message: `push で ${qualityWorkflows.length} 個の品質チェックが起動します`,
        files: qualityWorkflows.map(w => w.file),
        suggestion: 'typecheck + lint + test を1つのワークフローに統合できます'
      });
    }

    // 4. 自己書換えリスク
    const selfModifying = workflows.filter(w => w.hasGitPush && w.hasContentsWrite);
    if (selfModifying.length > 0) {
      issues.push({
        severity: 'warning',
        category: '自己書換えリスク',
        message: `${selfModifying.length} 個のワークフローが自動的にコードを変更します`,
        files: selfModifying.map(w => w.file),
        suggestion: '自動 commit は慎重に。dry-run モードや手動承認を検討してください'
      });
    }

    // 5. Grammar 専用ワークフローの統合提案
    const grammarWorkflows = workflows.filter(w =>
      w.name.toLowerCase().includes('grammar')
    );
    if (grammarWorkflows.length > 2) {
      issues.push({
        severity: 'info',
        category: 'Grammar 検証統合',
        message: `Grammar 専用ワークフローが ${grammarWorkflows.length} 件あります`,
        files: grammarWorkflows.map(w => w.file),
        suggestion: '1つのワークフローに統合してメンテナンス性を向上できます'
      });
    }

    return { issues, diagnostics };
  }

  private reportIssues(issues: HealthIssue[]): void {
    const critical = issues.filter(i => i.severity === 'critical');
    const warnings = issues.filter(i => i.severity === 'warning');
    const infos = issues.filter(i => i.severity === 'info');

    const remediation = this.buildRemediationPlan(issues);

    const formatFileList = (files: string[], max = 5): string => {
      if (files.length <= max) return files.join(', ');
      const head = files.slice(0, max).join(', ');
      return `${head} … (+${files.length - max})`;
    };

    const diagnosticReport = (() => {
      const lines: string[] = [];
      lines.push('【GitHub Actions 健康診断】');
      lines.push(`結果: 要対応（検出 ${issues.length}件）`);
      lines.push(`内訳: Critical ${critical.length} / Warning ${warnings.length} / Info ${infos.length}`);
      lines.push('');

      if (remediation.length > 0) {
        const sectionTitle: Record<RemediationItem['priority'], string> = {
          P0: 'P0（必須・今すぐ）',
          P1: 'P1（重要・次に）',
          P2: 'P2（改善・余裕があれば）'
        };

        const buckets: Record<RemediationItem['priority'], RemediationItem[]> = { P0: [], P1: [], P2: [] };
        for (const item of remediation) buckets[item.priority].push(item);

        lines.push('所見（優先順）: P0 → P1 → P2');
        lines.push('');

        (['P0', 'P1', 'P2'] as const).forEach(priority => {
          const items = buckets[priority];
          if (items.length === 0) return;
          lines.push(`■ ${sectionTitle[priority]}（${items.length}件）`);
          for (const item of items) {
            lines.push(`- ${item.title}`);
            if (item.files.length > 0) lines.push(`  対象: ${formatFileList(item.files)}`);

            const byKind: Record<'必要' | '推奨' | '非推奨', string[]> = { 必要: [], 推奨: [], 非推奨: [] };
            for (const a of item.actions ?? []) byKind[a.kind].push(a.text);

            // 「必要/推奨/非推奨」を最大3つの所見として固定表示
            const pick = (kind: '必要' | '推奨' | '非推奨') => (byKind[kind][0] ? `  ${kind}: ${byKind[kind][0]}` : undefined);
            const a1 = pick('必要');
            const a2 = pick('推奨');
            const a3 = pick('非推奨');
            if (a1) lines.push(a1);
            if (a2) lines.push(a2);
            if (a3) lines.push(a3);
            lines.push('');
          }
        });
      }

      // 参考: カテゴリ別の件数（見た目を診断結果っぽくする）
      const counts = new Map<string, number>();
      for (const i of issues) counts.set(i.category, (counts.get(i.category) ?? 0) + 1);
      const topCats = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
      if (topCats.length > 0) {
        lines.push('参考（カテゴリ上位）:');
        for (const [cat, n] of topCats) lines.push(`- ${cat}: ${n}件`);
      }

      return lines.join('\n').trimEnd();
    })();

    const summary = `GitHub Actions 健康診断: 要対応（${issues.length}件）`;

    this.logger.logWarning({
      type: 'actions-health',
      severity: critical.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'info',
      timestamp: new Date().toISOString(),
      message: summary,
      details: {
        totalIssues: issues.length,
        critical: critical.length,
        warnings: warnings.length,
        infos: infos.length,
        diagnosticReport,
        remediation,
        issues: issues.map(i => ({
          severity: i.severity,
          category: i.category,
          message: i.message,
          files: i.files,
          suggestion: i.suggestion
        }))
      },
      actions: {
        'check': '詳細を確認: コマンドパレット → "Servant: Show Warning Log"'
      },
      aiGuidance: 'ログの remediation（推奨対応）に、優先度付きの修正手順を出しています。まずP0（破損/スキーマ違反）を解消し、その後に重複・統合・運用改善を進めてください。'
    });

    // Critical があればステータスバーにも出す
    if (critical.length > 0) {
      vscode.window.showWarningMessage(
        `⚠️ GitHub Actions に ${critical.length} 件の重大な問題があります`,
        'ログを確認'
      ).then(selection => {
        if (selection === 'ログを確認') {
          vscode.commands.executeCommand('servant.showWarningLog');
        }
      });
    }
  }

  dispose() {
    this.disposables.forEach(d => d.dispose());
  }

  private buildRemediationPlan(issues: HealthIssue[]): RemediationItem[] {
    const byCategory = new Map<string, HealthIssue[]>();
    for (const issue of issues) {
      const arr = byCategory.get(issue.category) ?? [];
      arr.push(issue);
      byCategory.set(issue.category, arr);
    }

    const plan: RemediationItem[] = [];

    const collectFiles = (items: HealthIssue[]) => Array.from(new Set(items.flatMap(i => i.files)));

    const add = (item: RemediationItem) => plan.push(item);

    const broken = byCategory.get('ワークフロー破損の疑い');
    if (broken) {
      add({
        title: 'ワークフローの破損（残骸混入）を修正',
        priority: 'P0',
        files: collectFiles(broken),
        actions: [
          { kind: '必要', text: 'トップレベル定義（name/on/jobs）が複数回出現していないか確認し、1つのワークフロー定義に正規化する' },
          { kind: '推奨', text: '最小構成（name/on/jobs/steps）まで削ってから段階的に復元し、VS CodeのProblemsが消えることを確認する' },
          { kind: '非推奨', text: '症状を隠すためにlint/チェックを無効化したり、continue-on-errorで握りつぶす' }
        ],
        steps: [
          '対象ファイル内にトップレベル定義（name/on/jobs）が複数回出現していないか確認する',
          '誤って混入したブロック（別ワークフロー定義やstepsの断片）を削除し、1つのワークフロー定義に正規化する',
          'YAMLのインデントを揃え、VS CodeのProblemsとServant診断が消えることを確認する'
        ]
      });
    }

    const reusableMisuse = byCategory.get('Reusable Workflow 誤用');
    if (reusableMisuse) {
      add({
        title: 'Reusable workflow呼び出し(job.uses)の併用禁止キーを排除',
        priority: 'P0',
        files: collectFiles(reusableMisuse),
        actions: [
          { kind: '必要', text: 'job.uses のジョブから steps/outputs/continue-on-error 等の併用禁止キーを削除する' },
          { kind: '推奨', text: '必要な処理は呼び出し先（再利用ワークフロー側）へ寄せ、呼び出し元は uses/with/permissions/needs/if/strategy に限定する' },
          { kind: '非推奨', text: 'YAMLを無理に通すためにジョブ構造を二重定義して“たまたま動く”形にする' }
        ],
        steps: [
          'job.uses を使うジョブから steps/outputs/continue-on-error 等の併用禁止キーを削除する',
          '必要な処理は「呼び出し先（再利用ワークフロー側）」へ移すか、呼び出しをやめて通常ジョブに戻す',
          'Matrixで分岐したい場合は、呼び出し元は matrix/with のみにして、ロジックは再利用ワークフローに寄せる'
        ]
      });
    }

    const yamlParse = byCategory.get('YAMLパースエラー');
    if (yamlParse) {
      add({
        title: 'YAMLパースエラーを解消',
        priority: 'P0',
        files: collectFiles(yamlParse),
        actions: [
          { kind: '必要', text: 'VS CodeのProblemsが指摘する行付近のインデント/マッピング/配列の崩れを修正する' },
          { kind: '推奨', text: 'コピペ時に混入しやすい全角スペース・タブ・不可視文字を除去する' },
          { kind: '非推奨', text: 'とりあえず動かすためにYAMLブロックを丸ごとコメントアウトして放置する' }
        ],
        steps: [
          'VS CodeのProblemsの指摘行付近でインデント/マッピング/配列を確認する',
          'コピペ時に混入した全角スペースやタブ崩れを除去する',
          '必要なら最小構成（name/on/jobs/steps）まで削ってから段階的に復元する'
        ]
      });
    }

    const localAction = byCategory.get('ローカルAction利用');
    if (localAction) {
      add({
        title: 'ローカルAction利用前にcheckoutを保証',
        priority: 'P1',
        files: collectFiles(localAction),
        actions: [
          { kind: '必要', text: 'ローカルAction（./.github/actions/**）の前に actions/checkout@v4 を実行する' },
          { kind: '推奨', text: 'checkoutはジョブ側で明示し、Composite Actionは環境準備に専念させる（制約が少ない）' },
          { kind: '非推奨', text: 'checkoutが無いままローカルActionを呼び出して実行時失敗に任せる' }
        ],
        steps: [
          'ローカルAction（./.github/actions/**）を使うジョブは、先に actions/checkout@v4 を実行する',
          'checkoutをComposite Actionに含める場合は、Composite内で uses を持てない制約に注意する（現状はジョブ側でcheckout推奨）'
        ]
      });
    }

    const nodeMismatch = byCategory.get('Node version 不整合');
    if (nodeMismatch) {
      add({
        title: 'Nodeバージョンを統一',
        priority: 'P1',
        files: collectFiles(nodeMismatch),
        actions: [
          { kind: '必要', text: 'actions/setup-node の node-version を標準（例: 20）に統一する' },
          { kind: '推奨', text: 'cache: npm を使い、npm ci を標準化してCIの揺れを減らす' },
          { kind: '非推奨', text: 'ワークフローごとにNodeバージョンを変え続けて差分原因を増やす' }
        ],
        steps: [
          'actions/setup-node の node-version をプロジェクト標準（例: 20）に統一する',
          'CIとローカルの差異を減らすため package.json の想定バージョンと揃える'
        ]
      });
    }

    const deployDup = byCategory.get('デプロイ重複');
    if (deployDup) {
      add({
        title: 'デプロイの重複起動を解消',
        priority: 'P1',
        files: collectFiles(deployDup),
        actions: [
          { kind: '必要', text: 'push(main)で複数起動するデプロイを1本に統合する' },
          { kind: '推奨', text: 'その他は workflow_dispatch / schedule / paths でトリガーを絞り、衝突を避ける' },
          { kind: '非推奨', text: '同じ成果物を複数ワークフローが同時にデプロイする状態を許容する' }
        ],
        steps: [
          'push(main)で複数起動するデプロイを1本に統合する',
          'それ以外は workflow_dispatch のみにするか、schedule/paths等でトリガーを絞る'
        ]
      });
    }

    const qualityDup = byCategory.get('品質チェック重複');
    if (qualityDup) {
      add({
        title: '品質チェック重複を整理',
        priority: 'P2',
        files: collectFiles(qualityDup),
        actions: [
          { kind: '必要', text: 'push/PRで走るチェックを棚卸しし、重複しているものを統合・削除する' },
          { kind: '推奨', text: 'matrixで並列化しつつ、必須/任意（continue-on-error相当）は構造として分離する' },
          { kind: '非推奨', text: '増えるたびに新ワークフローを足して“いつか整理する”を繰り返す' }
        ],
        steps: [
          'typecheck/lint/testを1本に寄せ、必要ならmatrixで並列化する',
          'PRだけ走らせたいものは pull_request に限定し、pushでは省く'
        ]
      });
    }

    const selfModify = byCategory.get('自己書換えリスク');
    if (selfModify) {
      add({
        title: '自己書換え（自動commit）を安全化',
        priority: 'P2',
        files: collectFiles(selfModify),
        actions: [
          { kind: '必要', text: 'contents: write を最小化し、push対象ブランチ/パスを強く制限する' },
          { kind: '推奨', text: '自動commitの代わりにPR作成（レビュー）や手動承認（workflow_dispatch）へ寄せる' },
          { kind: '非推奨', text: 'mainへ無条件で自動pushし続ける（意図しない変更の温床）' }
        ],
        steps: [
          '自動commitは手動承認（workflow_dispatch）に寄せるか、PR作成に切り替える',
          'contents:write は最小権限にし、push対象ブランチ/パスを強く制限する'
        ]
      });
    }

    const grammar = byCategory.get('Grammar 検証統合');
    if (grammar) {
      add({
        title: 'Grammarワークフローを統合（任意）',
        priority: 'P2',
        files: collectFiles(grammar),
        actions: [
          { kind: '推奨', text: '同種のGrammar検証は1本に統合し、pathsフィルタで対象を絞る' },
          { kind: '推奨', text: 'コストが気になる場合は schedule や手動起動に寄せる' },
          { kind: '非推奨', text: 'ほぼ同じ内容のGrammarワークフローを用途別に増殖させる' }
        ],
        steps: [
          '同種のGrammar検証は1本に統合し、pathsフィルタで対象を絞る',
          'コストが気になる場合は schedule や手動起動に寄せる'
        ]
      });
    }

    const priorityOrder: Record<RemediationItem['priority'], number> = { P0: 0, P1: 1, P2: 2 };
    plan.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    return plan;
  }
}
