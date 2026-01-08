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

export class ServantWarningLogger {
  constructor(private outputChannel: vscode.OutputChannel) {}

  /**
   * 構造化警告をログに記録
   */
  public logWarning(warning: ServantWarning): void {
    const icon = warning.severity === 'error' ? '⚠️' : warning.severity === 'warning' ? '⚡' : 'ℹ️';

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
}
