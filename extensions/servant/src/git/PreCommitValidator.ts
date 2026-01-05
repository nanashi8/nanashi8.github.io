import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { RuleEngine } from '../engine/RuleEngine';
import { InstructionsLoader } from '../loader/InstructionsLoader';
import { IncrementalValidator } from '../performance/IncrementalValidator';
import type { Notifier } from '../ui/Notifier';
import { NeuralSignalStore } from '../neural/NeuralSignalStore';
import {
  getSpecCheckRecordPath,
  isSpecCheckFresh,
  computeRequiredInstructionsForFiles,
  shouldEnforceSpecCheck
} from '../guard/SpecCheck';
import type { GuardResult, GuardSeverity, GuardViolation } from '../guard/GuardTypes';
import { detectDangerousPatternViolations } from '../guard/DangerousPatterns';

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

  private async tryGetStagedDiff(workspaceRoot: string): Promise<string> {
    const execFileAsync = promisify(execFile);
    try {
      const git = fs.existsSync('/usr/bin/git') ? '/usr/bin/git' : 'git';
      const { stdout } = await execFileAsync(git, ['-C', workspaceRoot, 'diff', '--staged'], {
        maxBuffer: 20 * 1024 * 1024,
      }) as unknown as { stdout: string };
      return stdout ?? '';
    } catch {
      return '';
    }
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

    // 変更前の仕様確認（Specチェック）を強制
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const specCheckEnabled = vscode.workspace.getConfiguration('servant').get<boolean>('specCheck.enabled', true);
    const maxAgeHours = vscode.workspace.getConfiguration('servant').get<number>('specCheck.maxAgeHours', 24);

    if (specCheckEnabled && workspaceRoot && shouldEnforceSpecCheck(stagedFiles)) {
      const required = computeRequiredInstructionsForFiles(
        workspaceRoot,
        stagedFiles,
        this.instructionsLoader.getInstructions()
      );

      const freshness = isSpecCheckFresh(workspaceRoot, maxAgeHours, required);
      if (!freshness.ok) {
        const recordPath = getSpecCheckRecordPath(workspaceRoot);
        const missingList = (freshness.reason === 'missing_required_instructions' && freshness.missingInstructions)
          ? `\n\n不足している指示書:\n${freshness.missingInstructions.map((x) => `- ${x}`).join('\n')}`
          : '';
        const message =
          '変更前の仕様確認（Specチェック）が未記録/期限切れです。' +
          ' 対象ファイルに応じた指示書を確認し、' +
          'コマンド「Servant: Review Required Instructions」または `npm run guard:spec-check` を実行してください。' +
          missingList;

        return {
          success: false,
          violations: [
            {
              file: path.isAbsolute(recordPath) ? recordPath : path.join(workspaceRoot, recordPath),
              line: 0,
              message,
              severity: 'error'
            }
          ],
          summary: '❌ Specチェック未記録/期限切れのためコミットをブロックしました'
        };
      }
    }

    // UI系変更のときは、決定ログ（DECISIONS.md）の更新を要求（warning、strictMode時はerror）
    if (workspaceRoot) {
      const enforceDecisionOnUIChange = vscode.workspace
        .getConfiguration('servant')
        .get<boolean>('specBook.enforceDecisionOnUIChange', true);

      if (enforceDecisionOnUIChange) {
        const decisionsRelOrAbs = (
          vscode.workspace
            .getConfiguration('servant')
            .get<string>('specBook.decisionsPath', 'docs/specifications/DECISIONS.md') ??
          'docs/specifications/DECISIONS.md'
        ).trim();
        const decisionsAbs = path.isAbsolute(decisionsRelOrAbs)
          ? decisionsRelOrAbs
          : path.join(workspaceRoot, decisionsRelOrAbs);

        const uiLikelyChanged = stagedFiles.some((filePath) => {
          const rel = path.isAbsolute(filePath) ? path.relative(workspaceRoot, filePath) : filePath;
          const p = rel.replace(/\\/g, '/');
          return (
            p.endsWith('.tsx') ||
            p.endsWith('.jsx') ||
            p.endsWith('.css') ||
            p.endsWith('.scss') ||
            p.endsWith('.html') ||
            p.startsWith('src/components/') ||
            p.startsWith('src/styles/') ||
            p === 'tailwind.config.js' ||
            p === 'postcss.config.cjs'
          );
        });

        const decisionsUpdated = stagedFiles.some((filePath) => {
          const abs = path.isAbsolute(filePath) ? filePath : path.join(workspaceRoot, filePath);
          return path.resolve(abs) === path.resolve(decisionsAbs);
        });

        if (uiLikelyChanged && !decisionsUpdated) {
          // strictModeは後で読み込むので、ここではwarningで積む
          // （strictMode trueなら下で error に昇格される）
          const message =
            'UI/レイアウト/スタイルに関係する変更が検出されましたが、決定ログ（DECISIONS.md）が更新されていません。' +
            ' 仕様（WORKING_SPEC.md）の「UI実装の強制ルール」に従い、' +
            'コマンド「Servant: Append Decision Log」または手動で DECISIONS.md に理由を追記してください。';

          // decision log を「違反ファイル」として表示し、修正先を明示
          // line=0 はファイル全体を指す
          // severityは後段の strictMode で昇格される
          // 一時的に violations に追加する（strictMode判定後に severity を確定）
          // strictMode は下で読み込まれるため、ここでは warning のまま積む
          // 実際の昇格は後段の strictMode 分岐で行う
          // ※allViolations の宣言前なので、ここでは return の早期ブロックはしない
          //    → allViolations 宣言後に追加すると構造が崩れるため、この段階で early-return を使う
          const legacyConfig = vscode.workspace.getConfiguration('instructionsValidator');
          const strictModeTmp =
            vscode.workspace.getConfiguration('servant').get<boolean>('preCommit.strictMode') ??
            legacyConfig.get<boolean>('preCommit.strictMode', false);

          const severity: 'error' | 'warning' = strictModeTmp ? 'error' : 'warning';

          // strictMode で error の場合はここでブロック（仕様: 強制力）
          if (severity === 'error') {
            return {
              success: false,
              violations: [
                {
                  file: decisionsAbs,
                  line: 0,
                  message,
                  severity
                }
              ],
              summary: '❌ UI変更に対する決定ログ未更新のためコミットをブロックしました'
            };
          }

          // warning の場合は後続検証へ進み、警告として返す
          // ここでは allViolations がまだ無いので、後続で集約できるように stagedFiles 末尾に擬似的な要素を足さない
          // 代わりに、incremental/standard検証結果に混ぜて返すため、後で allViolations に追加する
          // → allViolations 宣言直後に追加するフラグを使う
        }
      }
    }

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

    // staged diff を使った危険パターン検出（repo scripts の検出を段階移植）
    if (workspaceRoot) {
      const diffContent = await this.tryGetStagedDiff(workspaceRoot);
      if (diffContent) {
        const changedFiles = stagedFiles.map((filePath) => {
          const rel = path.isAbsolute(filePath) ? path.relative(workspaceRoot, filePath) : filePath;
          return rel.replace(/\\/g, '/');
        });

        const anchorFile = path.join(workspaceRoot, '.aitk/instructions/batch-system-enforcement.instructions.md');
        const violations = detectDangerousPatternViolations({ changedFiles, diffContent });
        for (const v of violations) {
          const suggestionText = v.suggestedActions?.length ? `\n${v.suggestedActions.join('\n')}` : '';
          allViolations.push({
            file: anchorFile,
            line: 0,
            message: `${v.message}${suggestionText}`,
            severity: v.severity === 'error' ? 'error' : 'warning',
          });
        }
      }
    }

    const shouldEnforceContextPacket = (files: string[]): boolean => {
      // AI_CONTEXT は「変更内容の理解に必要なとき」だけ強制する。
      // .instructions.md のみのコミット等ではノイズになりやすいので除外。
      return files.some((f) => /\.(ts|tsx|js|jsx|md)$/.test(f) && !f.endsWith('.instructions.md'));
    };

    // AI_CONTEXT.md の鮮度を pre-commit で強制（warning、strictMode時はerror）
    if (workspaceRoot && shouldEnforceContextPacket(stagedFiles)) {
      const enforceContextBeforeCommit = config.get<boolean>('context.enforceBeforeCommit', true);
      const maxAgeMinutes = config.get<number>('context.maxAgeMinutes', 120);

      if (enforceContextBeforeCommit && stagedFiles.length > 0) {
        const outputRelOrAbs = (config.get<string>('context.outputPath', '.aitk/context/AI_CONTEXT.md') ?? '').trim();
        const outputAbs = path.isAbsolute(outputRelOrAbs) ? outputRelOrAbs : path.join(workspaceRoot, outputRelOrAbs);

        let ageMinutes = Number.POSITIVE_INFINITY;
        try {
          if (fs.existsSync(outputAbs)) {
            const stat = fs.statSync(outputAbs);
            ageMinutes = (Date.now() - stat.mtimeMs) / 60000;
          }
        } catch {
          ageMinutes = Number.POSITIVE_INFINITY;
        }

        if (!Number.isFinite(ageMinutes) || ageMinutes > maxAgeMinutes) {
          const severity: 'error' | 'warning' = strictMode ? 'error' : 'warning';
          const reason = fs.existsSync(outputAbs)
            ? `期限切れ（ageMinutes=${ageMinutes.toFixed(1)}, maxAgeMinutes=${maxAgeMinutes}）`
            : '未生成';
          allViolations.push({
            file: outputAbs,
            line: 0,
            message:
              `AI Context Packet (${outputRelOrAbs || '.aitk/context/AI_CONTEXT.md'}) が ${reason} です。` +
              ' コミット前にコマンド「Servant: Build AI Context Packet」を実行してください。',
            severity
          });
        }
      }
    }

    // UI変更 + decision未更新（warning）の場合に、ここで違反として追加
    if (workspaceRoot) {
      const enforceDecisionOnUIChange = vscode.workspace
        .getConfiguration('servant')
        .get<boolean>('specBook.enforceDecisionOnUIChange', true);

      if (enforceDecisionOnUIChange) {
        const decisionsRelOrAbs = (
          vscode.workspace
            .getConfiguration('servant')
            .get<string>('specBook.decisionsPath', 'docs/specifications/DECISIONS.md') ??
          'docs/specifications/DECISIONS.md'
        ).trim();
        const decisionsAbs = path.isAbsolute(decisionsRelOrAbs)
          ? decisionsRelOrAbs
          : path.join(workspaceRoot, decisionsRelOrAbs);

        const uiLikelyChanged = stagedFiles.some((filePath) => {
          const rel = path.isAbsolute(filePath) ? path.relative(workspaceRoot, filePath) : filePath;
          const p = rel.replace(/\\/g, '/');
          return (
            p.endsWith('.tsx') ||
            p.endsWith('.jsx') ||
            p.endsWith('.css') ||
            p.endsWith('.scss') ||
            p.endsWith('.html') ||
            p.startsWith('src/components/') ||
            p.startsWith('src/styles/') ||
            p === 'tailwind.config.js' ||
            p === 'postcss.config.cjs'
          );
        });

        const decisionsUpdated = stagedFiles.some((filePath) => {
          const abs = path.isAbsolute(filePath) ? filePath : path.join(workspaceRoot, filePath);
          return path.resolve(abs) === path.resolve(decisionsAbs);
        });

        if (uiLikelyChanged && !decisionsUpdated) {
          allViolations.push({
            file: decisionsAbs,
            line: 0,
            message:
              'UI/レイアウト/スタイルに関係する変更が検出されましたが、決定ログ（DECISIONS.md）が更新されていません。' +
              ' 仕様（WORKING_SPEC.md）の「UI実装の強制ルール」に従い、' +
              'コマンド「Servant: Append Decision Log」または手動で DECISIONS.md に理由を追記してください。',
            severity: 'warning'
          });
        }
      }
    }

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

    // 信号: pre-commit の結果
    if (workspaceRoot) {
      try {
        const store = new NeuralSignalStore(workspaceRoot);
        if (allViolations.length === 0) {
          store.record({
            timestamp: new Date().toISOString(),
            type: 'precommit:success',
            strength: 0.4,
            meta: { stagedCount: stagedFiles.length }
          });
        } else {
          // 違反は「起点候補」になりうるので、上位数件を target 分散して記録
          const sorted = [...allViolations].sort((a, b) => {
            // error優先
            if (a.severity !== b.severity) return a.severity === 'error' ? -1 : 1;
            return 0;
          });

          const uniqueTargets: string[] = [];
          for (const v of sorted) {
            const raw = v.file;
            if (!raw) continue;
            const rel = path.isAbsolute(raw) ? path.relative(workspaceRoot, raw) : raw;
            const normalized = rel.replace(/\\/g, '/');
            if (!normalized || normalized.startsWith('..')) continue;
            if (!uniqueTargets.includes(normalized)) uniqueTargets.push(normalized);
            if (uniqueTargets.length >= 5) break;
          }

          // グローバルな失敗信号（targetなし）も残す
          store.record({
            timestamp: new Date().toISOString(),
            type: 'precommit:violation',
            strength: 0.85,
            meta: { errors: errors.length, warnings: warnings.length, stagedCount: stagedFiles.length }
          });

          for (let i = 0; i < uniqueTargets.length; i++) {
            const t = uniqueTargets[i];
            const firstMatch = sorted.find((v) => {
              const rel = path.isAbsolute(v.file) ? path.relative(workspaceRoot, v.file) : v.file;
              return rel.replace(/\\/g, '/') === t;
            });

            const base = firstMatch?.severity === 'error' ? 0.95 : 0.65;
            const rankDamp = 1 / (i + 1);

            store.record({
              timestamp: new Date().toISOString(),
              type: 'precommit:violation',
              target: t,
              strength: Math.max(0, Math.min(1, base * rankDamp)),
              meta: {
                severity: firstMatch?.severity,
                message: firstMatch?.message,
                errors: errors.length,
                warnings: warnings.length,
                stagedCount: stagedFiles.length
              }
            });
          }
        }
      } catch {
        // ignore
      }
    }

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
  async showViolations(
    result:
      | {
          success: boolean;
          violations: Array<{
            file: string;
            line: number;
            message: string;
            severity: 'error' | 'warning';
          }>;
          summary: string;
        }
      | GuardResult
  ): Promise<void> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const normalized = this.isGuardResult(result)
      ? this.toLegacyResultFromGuardResult(workspaceRoot, result)
      : result;

    // Output channelに詳細を表示
    this.outputChannel.appendLine('');
    this.outputChannel.appendLine(this.formatViolationsForTerminal(normalized.violations));
    this.outputChannel.appendLine(normalized.summary);

    // GuardResult のときは、失敗時のみ raw logs を出す（長文になりやすいので）
    if (this.isGuardResult(result) && !result.success && result.logs) {
      this.outputChannel.appendLine('');
      this.outputChannel.appendLine('--- Raw guard logs (truncated) ---');
      this.outputChannel.appendLine(this.truncateLogs(result.logs, 400));
    }

    this.outputChannel.show();

    // ユーザーに通知
    if (!normalized.success) {
      const action = await (this.notifier?.critical(
        'Servant violations found. Commit blocked.',
        'Show Details',
        'Fix with Quick Fix'
      ) ?? Promise.resolve(undefined));

      if (action === 'Show Details') {
        this.outputChannel.show();
      } else if (action === 'Fix with Quick Fix') {
        await vscode.commands.executeCommand('workbench.action.problems.focus');
      }
    } else if (normalized.violations.length > 0) {
      const action = await (this.notifier
        ? (this.notifier.commandWarning(
            `${normalized.violations.length} warning(s) found. Commit allowed.`,
            'Show Details'
          ) ?? Promise.resolve(undefined))
        : Promise.resolve(undefined));

      if (action === 'Show Details') {
        this.outputChannel.show();
      }
    }
  }

  private isGuardResult(value: any): value is GuardResult {
    return Boolean(value && typeof value === 'object' && typeof value.summary === 'string' && 'logs' in value);
  }

  private toLegacyResultFromGuardResult(
    workspaceRoot: string | undefined,
    result: GuardResult
  ): {
    success: boolean;
    violations: Array<{ file: string; line: number; message: string; severity: 'error' | 'warning' }>;
    summary: string;
  } {
    const fallbackFile = workspaceRoot
      ? path.join(workspaceRoot, '.aitk', 'guard', 'SCRIPTS_GUARD.txt')
      : 'SCRIPTS_GUARD.txt';

    const violations = result.violations.map((v: GuardViolation) => {
      const file = this.normalizeViolationFile(workspaceRoot, v.file) ?? fallbackFile;
      const line = Number.isFinite(v.line) ? Number(v.line) : 0;
      const severity = this.mapGuardSeverity(v.severity);

      const suggestion = Array.isArray(v.suggestedActions) && v.suggestedActions.length > 0
        ? `\n\nSuggested actions:\n- ${v.suggestedActions.join('\n- ')}`
        : '';

      return {
        file,
        line,
        message: `${v.message}${suggestion}`,
        severity
      };
    });

    return {
      success: result.success,
      violations,
      summary: result.summary
    };
  }

  private mapGuardSeverity(severity: GuardSeverity): 'error' | 'warning' {
    if (severity === 'error') return 'error';
    // info も warning に寄せる（表示はするがブロックはしない）
    return 'warning';
  }

  private normalizeViolationFile(workspaceRoot: string | undefined, file: string | undefined): string | undefined {
    if (!file) return undefined;
    if (path.isAbsolute(file)) return file;
    if (!workspaceRoot) return file;
    return path.join(workspaceRoot, file);
  }

  private truncateLogs(logs: string, maxLines: number): string {
    const lines = logs.split(/\r?\n/);
    if (lines.length <= maxLines) return logs;
    const head = lines.slice(0, maxLines);
    head.push(`... (truncated: ${lines.length - maxLines} more lines)`);
    return head.join('\n');
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
