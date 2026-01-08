import * as vscode from 'vscode';
import { ServantWarningLogger } from '../ui/ServantWarningLogger';

/**
 * 問題パネル統合監視システム
 *
 * TypeScript、ESLint、Markdownlintなど、全ての診断プロバイダーのエラーを監視し、
 * 構造化ログとして出力する。
 */
export class ProblemsIntegrationMonitor {
  private lastErrorCount = 0;
  private lastWarningCount = 0;
  private lastLogTime = 0;
  private disposables: vscode.Disposable[] = [];
  private warningLogger: ServantWarningLogger;

  constructor(
    private outputChannel: vscode.OutputChannel,
    private workspaceRoot: string
  ) {
    this.warningLogger = new ServantWarningLogger(outputChannel);
  }

  public start(): void {
    // 問題パネルの変更を監視
    const diagnosticsListener = vscode.languages.onDidChangeDiagnostics((_e) => {
      this.checkAndLogProblems();
    });

    this.disposables.push(diagnosticsListener);

    // 初回チェック
    setTimeout(() => this.checkAndLogProblems(), 3000);
  }

  /**
   * 問題パネルの全エラーをチェックし、変化があればログに記録
   */
  private checkAndLogProblems(): void {
    const now = Date.now();
    const THROTTLE_MS = 3000; // 3秒に1回まで

    // スロットリング
    if (now - this.lastLogTime < THROTTLE_MS) {
      return;
    }

    const problemsSummary = this.collectAllProblems();

    // 変化がなければスキップ
    if (
      problemsSummary.errorCount === this.lastErrorCount &&
      problemsSummary.warningCount === this.lastWarningCount
    ) {
      return;
    }

    this.lastLogTime = now;
    this.lastErrorCount = problemsSummary.errorCount;
    this.lastWarningCount = problemsSummary.warningCount;

    // エラーがある場合のみログ出力
    if (problemsSummary.errorCount > 0 || problemsSummary.warningCount > 0) {
      this.logProblemsToOutput(problemsSummary);
    }
  }

  /**
   * 全ての問題を収集
   */
  private collectAllProblems(): ProblemsSummary {
    const diagnostics = vscode.languages.getDiagnostics();
    const problems: ProblemDetail[] = [];
    let errorCount = 0;
    let warningCount = 0;

    for (const [uri, fileDiagnostics] of diagnostics) {
      const fsPath = uri.fsPath;

      // node_modules、dist、.gitなどは除外
      if (this.shouldExclude(fsPath)) {
        continue;
      }

      const relativePath = this.getRelativePath(fsPath);

      fileDiagnostics.forEach((diag) => {
        const severity =
          diag.severity === vscode.DiagnosticSeverity.Error
            ? 'error'
            : diag.severity === vscode.DiagnosticSeverity.Warning
            ? 'warning'
            : 'info';

        if (severity === 'error') errorCount++;
        if (severity === 'warning') warningCount++;

        problems.push({
          file: relativePath,
          line: diag.range.start.line + 1,
          column: diag.range.start.character + 1,
          severity,
          message: diag.message,
          code: diag.code?.toString(),
          source: diag.source || 'unknown',
        });
      });
    }

    // ファイル別、行番号順にソート
    problems.sort((a, b) => {
      if (a.file !== b.file) return a.file.localeCompare(b.file);
      return a.line - b.line;
    });

    return {
      errorCount,
      warningCount,
      totalCount: errorCount + warningCount,
      problems: problems.slice(0, 50), // 最大50件
      truncated: problems.length > 50,
    };
  }

  /**
   * 構造化ログとして出力（AI対応用）
   */
  private logProblemsToOutput(summary: ProblemsSummary): void {
    const warning = {
      type: 'problems-panel-update',
      severity: summary.errorCount > 0 ? ('error' as const) : ('warning' as const),
      timestamp: new Date().toISOString(),
      message: `問題パネルに ${summary.errorCount} 件のエラー、${summary.warningCount} 件の警告があります`,
      details: {
        errorCount: summary.errorCount,
        warningCount: summary.warningCount,
        totalCount: summary.totalCount,
        truncated: summary.truncated,
        problems: summary.problems,
      },
      actions: {
        viewProblems: '問題パネル（Problems）を開く',
        fixErrors: 'エラーを1つずつ修正',
        checkSources: '診断ソース（typescript, eslint等）を確認',
      },
      aiGuidance:
        '各エラーの詳細（file, line, message, source）を確認し、優先度の高いものから修正を提案してください。関数の重複、型エラー、未定義の変数などに注意。',
    };

    this.warningLogger.logWarning(warning);
  }

  /**
   * 除外すべきパスか判定
   */
  private shouldExclude(fsPath: string): boolean {
    const excludePatterns = [
      'node_modules',
      'dist',
      'build',
      '.git',
      'coverage',
      '.vscode',
      '.next',
      '.nuxt',
      'out',
    ];
    return excludePatterns.some((pattern) => fsPath.includes(pattern));
  }

  /**
   * 相対パスを取得
   */
  private getRelativePath(fsPath: string): string {
    if (fsPath.startsWith(this.workspaceRoot)) {
      return fsPath.slice(this.workspaceRoot.length + 1).replace(/\\/g, '/');
    }
    return fsPath;
  }

  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }
}

interface ProblemDetail {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  code?: string;
  source: string;
}

interface ProblemsSummary {
  errorCount: number;
  warningCount: number;
  totalCount: number;
  problems: ProblemDetail[];
  truncated: boolean;
}
