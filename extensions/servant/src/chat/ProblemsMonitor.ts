import * as vscode from 'vscode';
import { ServantChatParticipant } from './ChatParticipant';

export class ProblemsMonitor {
  private lastErrorCount = 0;
  private lastWarningCount = 0;
  private disposables: vscode.Disposable[] = [];

  constructor(
    private chatParticipant: ServantChatParticipant,
    private context: vscode.ExtensionContext
  ) {}

  public start(): void {
    // 問題パネルの変更を監視
    const diagnosticsListener = vscode.languages.onDidChangeDiagnostics((_e) => {
      this.checkForNewProblems();
    });

    this.disposables.push(diagnosticsListener);

    // 初回チェック
    setTimeout(() => this.checkForNewProblems(), 5000);
  }

  private checkForNewProblems(): void {
    const config = vscode.workspace.getConfiguration('servant');
    const autoReport = config.get<boolean>('chat.autoReportProblems', false);

    if (!autoReport) return;

    const { errors, warnings } = this.countProblems();

    // エラーが新たに発生した場合のみ通知
    const newErrors = errors - this.lastErrorCount;
    const newWarnings = warnings - this.lastWarningCount;

    if (newErrors > 0) {
      this.chatParticipant.sendAutoReport(
        `新しいエラーが${newErrors}件検出されました。問題を確認して修正方法を提案します。`
      );
    } else if (newWarnings > 5 && newWarnings > this.lastWarningCount) {
      // 警告は5件以上で初めて通知（スパム防止）
      this.chatParticipant.sendAutoReport(
        `警告が${newWarnings}件検出されました。確認が必要な場合は対応します。`
      );
    }

    this.lastErrorCount = errors;
    this.lastWarningCount = warnings;
  }

  private countProblems(): { errors: number; warnings: number } {
    let errors = 0;
    let warnings = 0;

    const diagnostics = vscode.languages.getDiagnostics();

    for (const [uri, fileDiagnostics] of diagnostics) {
      const path = uri.fsPath;
      if (path.includes('node_modules') || path.includes('dist') || path.includes('.git')) {
        continue;
      }

      fileDiagnostics.forEach((diag) => {
        if (diag.severity === vscode.DiagnosticSeverity.Error) {
          errors++;
        } else if (diag.severity === vscode.DiagnosticSeverity.Warning) {
          warnings++;
        }
      });
    }

    return { errors, warnings };
  }

  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }
}
