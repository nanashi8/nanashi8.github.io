import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import type { GuardResult, GuardRunner, GuardSeverity, GuardViolation } from './GuardTypes';

const execFileAsync = promisify(execFile);

type ScriptInvocation =
  | {
      kind: 'ai-guard-check';
      userRequest: string;
      targetFiles?: string[];
    }
  | {
      kind: 'pre-commit-ai-guard';
    };

function mapSeverity(label: string): GuardSeverity {
  const upper = label.toUpperCase();
  if (upper.includes('CRITICAL')) return 'error';
  if (upper.includes('HIGH')) return 'warning';
  if (upper.includes('MEDIUM')) return 'warning';
  return 'info';
}

export function parseGuardViolationsFromOutput(output: string): GuardViolation[] {
  const lines = output.split(/\r?\n/);
  const violations: GuardViolation[] = [];

  // Patterns seen in scripts:
  // - "🚨 [CRITICAL] ..."
  // - "⚠️  [HIGH] ..."
  // - "❌ CRITICAL: ..."
  const bracketPattern = /\[(CRITICAL|HIGH|MEDIUM|LOW)\]\s*(.*)$/;
  const criticalLinePattern = /❌\s*CRITICAL:\s*(.*)$/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const criticalMatch = trimmed.match(criticalLinePattern);
    if (criticalMatch) {
      violations.push({
        severity: 'error',
        message: criticalMatch[1].trim() || 'CRITICAL',
        rawOutput: trimmed
      });
      continue;
    }

    const bracketMatch = trimmed.match(bracketPattern);
    if (bracketMatch) {
      const sevLabel = bracketMatch[1];
      const message = bracketMatch[2]?.trim() || trimmed;
      violations.push({
        severity: mapSeverity(sevLabel),
        message,
        rawOutput: trimmed
      });
    }
  }

  return violations;
}

function summarize(invocation: ScriptInvocation, exitCode: number | null): string {
  const base = invocation.kind === 'ai-guard-check' ? 'AI guard check' : 'Pre-commit guard';
  if (exitCode === 0) return `✅ ${base} passed`;
  if (exitCode === 2) return `❌ ${base} failed (spec-check missing/expired)`;
  return `❌ ${base} failed`;
}

/**
 * Executes repo-local guard scripts and normalizes result to GuardResult.
 *
 * Notes:
 * - This runner does not require VS Code CLI ("code").
 * - Output parsing is best-effort; full raw output is preserved in GuardResult.logs.
 */
export class ScriptsGuardRunner implements GuardRunner {
  private invocation: ScriptInvocation;

  constructor(invocation: ScriptInvocation) {
    this.invocation = invocation;
  }

  async run(options: { workspaceRoot: string; stagedFiles?: string[]; userRequestNote?: string }): Promise<GuardResult> {
    const { workspaceRoot } = options;

    try {
      const { command, args, cwd } = this.buildCommand(workspaceRoot, options);
      const { stdout, stderr } = await execFileAsync(command, args, {
        cwd,
        windowsHide: true,
        maxBuffer: 10 * 1024 * 1024
      });

      const logs = [stdout, stderr].filter(Boolean).join('\n');
      const violations = parseGuardViolationsFromOutput(logs);

      return {
        success: true,
        summary: summarize(this.invocation, 0),
        violations,
        logs
      };
    } catch (error: any) {
      const exitCode: number | null = Number.isFinite(error?.code) ? Number(error.code) : null;
      const stdout = String(error?.stdout ?? '');
      const stderr = String(error?.stderr ?? '');
      const logs = [stdout, stderr].filter(Boolean).join('\n');

      const violations = parseGuardViolationsFromOutput(logs);
      if (violations.length === 0) {
        violations.push({
          severity: exitCode === 2 ? 'error' : 'error',
          message: exitCode === 2 ? 'Specチェック未記録/期限切れ' : 'Guardスクリプトが失敗しました',
          rawOutput: logs || String(error)
        });
      }

      return {
        success: false,
        summary: summarize(this.invocation, exitCode),
        violations,
        logs
      };
    }
  }

  private buildCommand(
    workspaceRoot: string,
    options: { stagedFiles?: string[]; userRequestNote?: string }
  ): { command: string; args: string[]; cwd: string } {
    if (this.invocation.kind === 'ai-guard-check') {
      const nodeCommand = process.execPath;
      const scriptPath = path.join(workspaceRoot, 'scripts', 'ai-guard-check.mjs');

      const userRequest = this.invocation.userRequest || options.userRequestNote || 'guard-check';
      const targetFiles = this.invocation.targetFiles ?? options.stagedFiles ?? [];

      return {
        command: nodeCommand,
        args: [scriptPath, userRequest, ...targetFiles],
        cwd: workspaceRoot
      };
    }

    // pre-commit-ai-guard
    const scriptPath = path.join(workspaceRoot, 'scripts', 'pre-commit-ai-guard.sh');
    return {
      command: 'sh',
      args: [scriptPath],
      cwd: workspaceRoot
    };
  }
}
