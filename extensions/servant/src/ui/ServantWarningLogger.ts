import * as vscode from 'vscode';

/**
 * サーバント警告システム - 静かに警告し、AI対応可能な構造化ログを出力
 */
export interface ServantWarning {
  type: string;
  severity: 'error' | 'warning' | 'info';
  timestamp: string;
  message: string;
  details?: any;
  actions?: Record<string, string>;
  aiGuidance?: string;
}

type WarningOutputMode = 'summary' | 'detailed';

export class ServantWarningLogger {
  // 重複警告抑制のためのcooldown管理
  private recentWarnings = new Map<string, number>();
  private readonly COOLDOWN_MS = 60000; // 1分

  // 起動直後は強制的に静かにする（showOutputMode とは別）
  private startupUntil = 0;

  // 警告履歴（Show Warning Log 用）
  private warningHistory: ServantWarning[] = [];
  private readonly HISTORY_LIMIT = 100;

  // ステータスサマリー情報
  private stats = {
    monitored: 0,
    violations: 0,
    fixed: 0
  };

  // サマリーの重複出力抑制
  private readonly SUMMARY_COOLDOWN_MS = 60000; // 1分
  private lastSummaryKey: string | null = null;
  private lastSummaryTime = 0;

  constructor(private outputChannel: vscode.OutputChannel) {}

  public setStartupWindowMs(ms: number): void {
    const safeMs = Number.isFinite(ms) && ms > 0 ? ms : 0;
    this.startupUntil = safeMs > 0 ? Date.now() + safeMs : 0;
  }

  private isInStartupWindow(): boolean {
    return this.startupUntil > 0 && Date.now() < this.startupUntil;
  }

  private getOutputMode(): WarningOutputMode {
    const config = vscode.workspace.getConfiguration('servant');

    const modeKey = this.isInStartupWindow()
      ? 'warnings.startupOutputMode'
      : 'warnings.outputMode';

    const mode = config.get<WarningOutputMode>(modeKey, 'summary');
    return mode === 'detailed' ? 'detailed' : 'summary';
  }

  private pushHistory(warning: ServantWarning): void {
    this.warningHistory.unshift(warning);
    if (this.warningHistory.length > this.HISTORY_LIMIT) {
      this.warningHistory.length = this.HISTORY_LIMIT;
    }
  }

  private formatCompactDetails(warning: ServantWarning): string | undefined {
    const d = warning.details;
    if (!d || typeof d !== 'object') return undefined;

    // よく使うカウンタ類を1行に圧縮（例: Actions Health）
    const parts: string[] = [];
    if (typeof d.totalIssues === 'number') parts.push(`Total ${d.totalIssues}`);
    if (typeof d.critical === 'number') parts.push(`Critical ${d.critical}`);
    if (typeof d.warnings === 'number') parts.push(`Warning ${d.warnings}`);
    if (typeof d.infos === 'number') parts.push(`Info ${d.infos}`);
    if (parts.length === 0) return undefined;
    return parts.join(' / ');
  }

  private buildSummaryLine(warning: ServantWarning): string {
    const compact = this.formatCompactDetails(warning);
    const type = warning.type ? `type=${warning.type}` : undefined;
    const parts = [warning.message, type, compact].filter(Boolean);
    return parts.join(' | ');
  }

  private async autoReportToChat(warning: ServantWarning, summaryLine: string): Promise<void> {
    const config = vscode.workspace.getConfiguration('servant');
    const enabled = config.get<boolean>('warnings.autoReportToChat', true);
    if (!enabled) return;

    if (warning.severity === 'info') return;

    const payload = `@servant 警告要約: ${summaryLine}`;
    await vscode.env.clipboard.writeText(payload);

    try {
      await vscode.commands.executeCommand('workbench.action.chat.open');
    } catch {
      // ignore
    }
  }

  public async showWarningLog(): Promise<void> {
    if (this.warningHistory.length === 0) {
      await vscode.window.showInformationMessage('Servant: 警告ログはまだありません');
      return;
    }

    const icon = (s: ServantWarning['severity']) => (s === 'error' ? '⚠️' : s === 'warning' ? '⚡' : 'ℹ️');
    const items = this.warningHistory.map((w) => {
      const time = (() => {
        try {
          return new Date(w.timestamp).toLocaleString('ja-JP');
        } catch {
          return w.timestamp;
        }
      })();
      const compact = this.formatCompactDetails(w);
      return {
        label: `${icon(w.severity)} ${w.message}`,
        description: `${time}  type=${w.type}${compact ? `  (${compact})` : ''}`,
        warning: w,
      } as const;
    });

    const picked = await vscode.window.showQuickPick(items, {
      title: 'Servant: Warning Log',
      matchOnDescription: true,
      ignoreFocusOut: true,
    });
    if (!picked) return;

    const w = picked.warning;
    const diagnosticReport = typeof w.details?.diagnosticReport === 'string' ? w.details.diagnosticReport : undefined;

    const contentLines: string[] = [];
    contentLines.push('# Servant Warning Log');
    contentLines.push('');
    contentLines.push(`- timestamp: ${w.timestamp}`);
    contentLines.push(`- severity: ${w.severity}`);
    contentLines.push(`- type: ${w.type}`);
    contentLines.push(`- message: ${w.message}`);
    contentLines.push('');

    if (diagnosticReport && diagnosticReport.trim().length > 0) {
      contentLines.push('## Diagnostic Report');
      contentLines.push('```text');
      contentLines.push(diagnosticReport.trimEnd());
      contentLines.push('```');
      contentLines.push('');
    }

    contentLines.push('## JSON');
    contentLines.push('```json');
    contentLines.push(JSON.stringify(w, null, 2));
    contentLines.push('```');
    contentLines.push('');

    const doc = await vscode.workspace.openTextDocument({
      content: contentLines.join('\n'),
      language: 'markdown',
    });
    await vscode.window.showTextDocument(doc, { preview: false });
  }

  /**
   * 構造化警告をログに記録
   */
  public logWarning(warning: ServantWarning): void {
    const mode = this.getOutputMode();

    // 重複チェック
    const hash = this.hashWarning(warning);
    const lastLog = this.recentWarnings.get(hash);
    const now = Date.now();

    if (lastLog && now - lastLog < this.COOLDOWN_MS) {
      // 抑制: 起動直後/通常ともに無音（起動直後の連打でログが埋まるのを防ぐ）
      return;
    }

    // 新規または期限切れの警告はフル出力
    this.recentWarnings.set(hash, now);

    // 履歴へ保存（Show Warning Log 用）
    this.pushHistory(warning);

    const icon = warning.severity === 'error' ? '⚠️' : warning.severity === 'warning' ? '⚡' : 'ℹ️';
    const summaryLine = this.buildSummaryLine(warning);

    if (mode === 'summary') {
      this.outputChannel.appendLine(`${icon} [Servant 警告] ${summaryLine} | 詳細: "Servant: Show Warning Log"`);
      void this.autoReportToChat(warning, summaryLine);
      return;
    }

    // detailed: これまで通りフル出力
    this.outputChannel.appendLine('\n' + '='.repeat(70));
    this.outputChannel.appendLine(`${icon} [Servant 警告] ${warning.message}`);
    this.outputChannel.appendLine('='.repeat(70));

    const diagnosticReport = warning.details?.diagnosticReport;
    if (typeof diagnosticReport === 'string' && diagnosticReport.trim().length > 0) {
      this.outputChannel.appendLine('🧪 診断結果:');
      diagnosticReport.split('\n').forEach(line => this.outputChannel.appendLine(line));
      this.outputChannel.appendLine('-'.repeat(70));
    }

    this.outputChannel.appendLine(JSON.stringify(warning, null, 2));
    this.outputChannel.appendLine('='.repeat(70) + '\n');

    if (warning.actions) {
      this.outputChannel.appendLine('💡 対処方法:');
      Object.entries(warning.actions).forEach(([_key, value], idx) => {
        this.outputChannel.appendLine(`  ${idx + 1}. ${value}`);
      });
    }

    if (warning.aiGuidance) {
      this.outputChannel.appendLine('\n🤖 AI対応ガイド:');
      this.outputChannel.appendLine(`  ${warning.aiGuidance}`);
    }

    this.outputChannel.appendLine('\n📋 この出力をCopilot Chatに貼り付けて対処を依頼できます\n');

    void this.autoReportToChat(warning, summaryLine);
  }

  /**
   * Specチェック警告
   */
  public logSpecCheckWarning(requiredInstructions: string[], maxAgeHours: number): void {
    this.logWarning({
      type: 'spec-check-required',
      severity: 'error',
      timestamp: new Date().toISOString(),
      message: 'Specチェックが未記録/期限切れです',
      details: {
        requiredInstructions,
        maxAgeHours,
      },
      actions: {
        openInstructions: 'コマンドパレット → "Servant: Review Required Instructions"',
        review: '必須指示書を確認',
        record: 'ステータスバー "Servant: 審議" をクリックして記録',
      },
      aiGuidance: 'ユーザーに「必須指示書の確認」を促し、確認後に記録を行ってください。コマンド: vscode.commands.executeCommand("servant.reviewRequiredInstructions")',
    });
  }

  /**
   * コード品質警告
   */
  public logQualityWarning(issueCount: number, errorCount: number, warningCount: number, filePath: string): void {
    this.logWarning({
      type: 'code-quality-issues',
      severity: errorCount > 0 ? 'error' : 'warning',
      timestamp: new Date().toISOString(),
      message: `コード品質問題を検出しました (${issueCount}件)`,
      details: {
        file: filePath,
        errors: errorCount,
        warnings: warningCount,
      },
      actions: {
        checkProblems: '問題パネル（Problems）を確認',
        viewDetails: '各問題の修正提案を確認',
      },
      aiGuidance: '問題パネルの詳細を確認し、修正を提案してください。特に関数の重複定義やスコープ問題に注意。',
    });
  }

  /**
   * Git違反警告
   */
  public logGitViolation(violationCount: number, files: string[]): void {
    this.logWarning({
      type: 'git-violations',
      severity: 'warning',
      timestamp: new Date().toISOString(),
      message: `Git違反を検出しました (${violationCount}件)`,
      details: {
        files: files.slice(0, 10), // 最大10件
        totalFiles: files.length,
      },
      actions: {
        checkFiles: '変更されたファイルを確認',
        fixViolations: '違反を修正',
        commit: '修正後にコミット',
      },
      aiGuidance: '違反内容を確認し、instructions.mdのルールに従って修正してください。',
    });
  }

  /**
   * 警告のハッシュ生成（重複チェック用）
   */
  private hashWarning(warning: ServantWarning): string {
    return `${warning.type}:${warning.severity}:${warning.message}`;
  }

  /**
   * サマリー情報の表示
   */
  public logStatusSummary(): void {
    const summaryKey = `${this.stats.monitored}:${this.stats.violations}:${this.stats.fixed}`;
    const now = Date.now();
    if (this.lastSummaryKey === summaryKey && now - this.lastSummaryTime < this.SUMMARY_COOLDOWN_MS) {
      return;
    }
    this.lastSummaryKey = summaryKey;
    this.lastSummaryTime = now;

    this.outputChannel.appendLine('\n' + '═'.repeat(70));
    this.outputChannel.appendLine('🛡️ Servant ステータスサマリー');
    this.outputChannel.appendLine('═'.repeat(70));
    this.outputChannel.appendLine(`監視中: ${this.stats.monitored}件`);
    this.outputChannel.appendLine(`違反: ${this.stats.violations}件`);
    this.outputChannel.appendLine(`修正: ${this.stats.fixed}件`);
    this.outputChannel.appendLine('═'.repeat(70) + '\n');
  }

  /**
   * ステータス更新（外部から呼び出される）
   */
  public updateStats(monitored: number, violations: number, fixed: number): boolean {
    const changed =
      this.stats.monitored !== monitored ||
      this.stats.violations !== violations ||
      this.stats.fixed !== fixed;
    this.stats = { monitored, violations, fixed };
    return changed;
  }

  /**
   * サマリーを強制的に表示する（重複抑制を無視）
   */
  public logStatusSummaryForce(): void {
    this.lastSummaryKey = null;
    this.lastSummaryTime = 0;
    this.logStatusSummary();
  }

  /**
   * cooldownクリア（テスト用/デバッグ用）
   */
  public clearCooldown(): void {
    this.recentWarnings.clear();
  }
}
