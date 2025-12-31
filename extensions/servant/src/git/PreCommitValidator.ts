import * as vscode from 'vscode';
import { RuleEngine } from '../engine/RuleEngine';
import { InstructionsLoader } from '../loader/InstructionsLoader';
import { IncrementalValidator } from '../performance/IncrementalValidator';
import type { Notifier } from '../ui/Notifier';

/**
 * PreCommitValidator
 *
 * Gitコミット前にInstructions違反をチェックするバリデーター。
 * RuleEngineを使用してstaged filesを検証し、違反があればコミットをブロックします。
 * Phase 5: IncrementalValidatorを使用してパフォーマンス向上
 */
export class PreCommitValidator {
  private ruleEngine: RuleEngine;
  private instructionsLoader: InstructionsLoader;
  private incrementalValidator: IncrementalValidator | null;
  private outputChannel: vscode.OutputChannel;
  private notifier?: Notifier;

  constructor(
    ruleEngine: RuleEngine,
    instructionsLoader: InstructionsLoader,
    outputChannel: vscode.OutputChannel,
    incrementalValidator?: IncrementalValidator,
    notifier?: Notifier
  ) {
    this.ruleEngine = ruleEngine;
    this.instructionsLoader = instructionsLoader;
    this.incrementalValidator = incrementalValidator || null;
    this.outputChannel = outputChannel;
    this.notifier = notifier;
  }

  /**
   * コミット前検証を実行
   *
   * @param stagedFiles - staged状態のファイルパス配列
   * @returns 検証結果。violationsが空配列なら検証成功
   */
  async checkBeforeCommit(stagedFiles: string[]): Promise<{
    success: boolean;
    violations: Array<{
      file: string;
      line: number;
      message: string;
      severity: 'error' | 'warning';
    }>;
    summary: string;
  }> {
    this.outputChannel.appendLine('[PreCommit] Starting validation...');
    this.outputChannel.appendLine(`[PreCommit] Checking ${stagedFiles.length} staged files`);

    const config = vscode.workspace.getConfiguration('servant');
    const legacyConfig = vscode.workspace.getConfiguration('instructionsValidator');
    const strictMode =
      config.get<boolean>('preCommit.strictMode') ??
      legacyConfig.get<boolean>('preCommit.strictMode', false);
    const ignorePatterns =
      config.get<string[]>('preCommit.ignorePatterns') ??
      legacyConfig.get<string[]>('preCommit.ignorePatterns', []);

    // ignore patternsでフィルタリング
    const filesToCheck = stagedFiles.filter(file => {
      return !ignorePatterns.some(pattern => {
        return file.includes(pattern);
      });
    });

    if (filesToCheck.length === 0) {
      this.outputChannel.appendLine('[PreCommit] No files to check (all ignored)');
      return {
        success: true,
        violations: [],
        summary: 'All files ignored by ignore patterns'
      };
    }

    this.outputChannel.appendLine(`[PreCommit] Files to check: ${filesToCheck.length}`);

    // 各ファイルを検証
    const allViolations: Array<{
      file: string;
      line: number;
      message: string;
      severity: 'error' | 'warning';
    }> = [];

    // IncrementalValidatorを使用できる場合は使用
    const useIncremental =
      config.get<boolean>('performance.enableIncremental') ??
      legacyConfig.get<boolean>('performance.enableIncremental', true);

    if (this.incrementalValidator && useIncremental) {
      this.outputChannel.appendLine('[PreCommit] Using incremental validation');

      // 増分検証
      const results = await this.incrementalValidator.validateIncremental(filesToCheck);

      for (const [filePath, violations] of results.entries()) {
        for (const violation of violations) {
          const severity = strictMode ? 'error' :
                          violation.severity === 'error' ? 'error' : 'warning';

          allViolations.push({
            file: filePath,
            line: violation.range.start.line + 1,
            message: violation.message,
            severity
          });
        }
      }
    } else {
      this.outputChannel.appendLine('[PreCommit] Using standard validation');

      // 標準検証（キャッシュなし）
      for (const filePath of filesToCheck) {
        // .instructions.mdファイルのみをチェック
        if (!filePath.endsWith('.instructions.md')) {
          continue;
        }

        try {
          const uri = vscode.Uri.file(filePath);
          const document = await vscode.workspace.openTextDocument(uri);

          this.outputChannel.appendLine(`[PreCommit] Validating: ${filePath}`);

          // InstructionsLoaderからinstructionsを取得
          const instructions = this.instructionsLoader.getInstructions();

          // RuleEngineで検証
          const violations = this.ruleEngine.validate(document, instructions);

          for (const violation of violations) {
            const severity = strictMode ? 'error' :
                            violation.severity === 'error' ? 'error' : 'warning';

            allViolations.push({
              file: filePath,
              line: violation.range.start.line + 1,
              message: violation.message,
              severity
            });
          }
        } catch (error) {
          this.outputChannel.appendLine(`[PreCommit] Error validating ${filePath}: ${error}`);
          // ファイル読み込みエラーは警告として扱う
          allViolations.push({
            file: filePath,
            line: 0,
            message: `Failed to validate file: ${error}`,
            severity: 'warning'
          });
        }
      }
    }

    // エラーレベルの違反をカウント
    const errors = allViolations.filter(v => v.severity === 'error');
    const warnings = allViolations.filter(v => v.severity === 'warning');

    const success = errors.length === 0;
    const summary = this.generateSummary(errors.length, warnings.length, strictMode);

    this.outputChannel.appendLine(`[PreCommit] Validation complete`);
    this.outputChannel.appendLine(`[PreCommit] Errors: ${errors.length}, Warnings: ${warnings.length}`);
    this.outputChannel.appendLine(`[PreCommit] Result: ${success ? 'PASS' : 'FAIL'}`);

    return {
      success,
      violations: allViolations,
      summary
    };
  }

  /**
   * 検証結果のサマリーを生成
   */
  private generateSummary(errorCount: number, warningCount: number, strictMode: boolean): string {
    if (errorCount === 0 && warningCount === 0) {
      return '✅ No violations found. Ready to commit!';
    }

    const parts: string[] = [];

    if (errorCount > 0) {
      parts.push(`❌ ${errorCount} error${errorCount > 1 ? 's' : ''} found`);
    }

    if (warningCount > 0) {
      parts.push(`⚠️  ${warningCount} warning${warningCount > 1 ? 's' : ''} found`);
    }

    const summary = parts.join(', ');

    if (errorCount > 0) {
      return `${summary}\n🚫 Commit blocked. Please fix errors before committing.`;
    } else if (strictMode) {
      return `${summary}\n⚠️  Strict mode: Please fix warnings before committing.`;
    } else {
      return `${summary}\n✅ Commit allowed, but consider fixing warnings.`;
    }
  }

  /**
   * 違反を整形してターミナルに表示
   */
  formatViolationsForTerminal(violations: Array<{
    file: string;
    line: number;
    message: string;
    severity: 'error' | 'warning';
  }>): string {
    if (violations.length === 0) {
      return '';
    }

    const lines: string[] = [];
    lines.push('');
    lines.push('═'.repeat(80));
    lines.push('Servant - Violations Found');
    lines.push('═'.repeat(80));
    lines.push('');

    // ファイルごとにグループ化
    const byFile = new Map<string, typeof violations>();
    for (const violation of violations) {
      if (!byFile.has(violation.file)) {
        byFile.set(violation.file, []);
      }
      byFile.get(violation.file)!.push(violation);
    }

    // 各ファイルの違反を表示
    for (const [file, fileViolations] of byFile) {
      const relativePath = vscode.workspace.asRelativePath(file);
      lines.push(`📄 ${relativePath}`);
      lines.push('─'.repeat(80));

      for (const violation of fileViolations) {
        const icon = violation.severity === 'error' ? '❌' : '⚠️ ';
        const lineInfo = violation.line > 0 ? `:${violation.line}` : '';
        lines.push(`  ${icon} Line ${violation.line}${lineInfo}`);
        lines.push(`     ${violation.message}`);
        lines.push('');
      }
    }

    lines.push('═'.repeat(80));
    return lines.join('\n');
  }

  /**
   * 違反を表示してユーザーに通知
   */
  async showViolations(result: {
    success: boolean;
    violations: Array<{
      file: string;
      line: number;
      message: string;
      severity: 'error' | 'warning';
    }>;
    summary: string;
  }): Promise<void> {
    // Output channelに詳細を表示
    this.outputChannel.appendLine('');
    this.outputChannel.appendLine(this.formatViolationsForTerminal(result.violations));
    this.outputChannel.appendLine(result.summary);
    this.outputChannel.show();

    // ユーザーに通知
    if (!result.success) {
      const action = await (this.notifier?.critical(
        'Servant violations found. Commit blocked.',
        'Show Details',
        'Fix with Quick Fix'
      ) ?? Promise.resolve(undefined));

      if (action === 'Show Details') {
        this.outputChannel.show();
      } else if (action === 'Fix with Quick Fix') {
        // Quick Fixパネルを開く
        await vscode.commands.executeCommand('workbench.action.problems.focus');
      }
    } else if (result.violations.length > 0) {
      // 警告のみの場合
      const action = await (this.notifier
        ? (this.notifier.commandWarning(
            `${result.violations.length} warning(s) found. Commit allowed.`,
            'Show Details'
          ) ?? Promise.resolve(undefined))
        : Promise.resolve(undefined));

      if (action === 'Show Details') {
        this.outputChannel.show();
      }
    }
  }

  /**
   * 設定を取得
   */
  getConfig(): {
    enabled: boolean;
    strictMode: boolean;
    autoFix: boolean;
    ignorePatterns: string[];
  } {
    const config = vscode.workspace.getConfiguration('servant');
    const legacyConfig = vscode.workspace.getConfiguration('instructionsValidator');
    return {
      enabled: config.get<boolean>('preCommit.enabled') ?? legacyConfig.get<boolean>('preCommit.enabled', true),
      strictMode: config.get<boolean>('preCommit.strictMode') ?? legacyConfig.get<boolean>('preCommit.strictMode', false),
      autoFix: config.get<boolean>('preCommit.autoFix') ?? legacyConfig.get<boolean>('preCommit.autoFix', false),
      ignorePatterns: config.get<string[]>('preCommit.ignorePatterns') ?? legacyConfig.get<string[]>('preCommit.ignorePatterns', [])
    };
  }
}
