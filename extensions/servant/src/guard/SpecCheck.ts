import * as fs from 'fs';
import * as path from 'path';
import type { Instruction } from '../loader/InstructionsLoader';

// 最低限の「作業開始前に必ず読む」指示書
export const BASELINE_REQUIRED_INSTRUCTIONS = [
  '.aitk/instructions/mandatory-spec-check.instructions.md',
  '.aitk/instructions/meta-ai-priority.instructions.md',
] as const;

export type SpecCheckFreshness =
  | { ok: true; recordedAt: string; ageHours: number }
  | {
      ok: false;
      reason:
        | 'missing'
        | 'invalid_timestamp'
        | 'expired'
        | 'missing_required_instructions';
      ageHours?: number;
      missingInstructions?: string[];
    };

function normalizeToPosix(p: string): string {
  return p.replace(/\\/g, '/');
}

function globToRegExp(glob: string): RegExp {
  // 最小実装: InstructionsLoader の shouldApply と同等の感覚
  // - ** は任意階層
  // - * はパスセグメント内
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '§§DOUBLESTAR§§')
    .replace(/\*/g, '[^/]*')
    .replace(/§§DOUBLESTAR§§/g, '.*');
  return new RegExp(`^${escaped}$`);
}

function toWorkspaceRelative(workspaceRoot: string, filePath: string): string {
  const rel = path.isAbsolute(filePath) ? path.relative(workspaceRoot, filePath) : filePath;
  return normalizeToPosix(rel);
}

export function computeRequiredInstructionsForFiles(
  workspaceRoot: string,
  stagedFiles: string[],
  allInstructions: Instruction[]
): string[] {
  const stagedRel = stagedFiles.map((f) => toWorkspaceRelative(workspaceRoot, f));

  const required = new Set<string>(BASELINE_REQUIRED_INSTRUCTIONS);

  for (const inst of allInstructions) {
    if (!inst.enforceBeforeModification) continue;

    const applyTo = inst.applyTo;
    const match = applyTo
      ? stagedRel.some((rel) => globToRegExp(normalizeToPosix(applyTo)).test(rel))
      : true;

    if (!match) continue;

    // inst.filePath は絶対パスなので、ワークスペース相対に正規化して記録する
    const relInstPath = toWorkspaceRelative(workspaceRoot, inst.filePath);
    // 仕様上 .aitk/instructions 配下のみを「指示書」とみなす（安全弁）
    if (relInstPath.startsWith('.aitk/instructions/') && relInstPath.endsWith('.instructions.md')) {
      required.add(relInstPath);
    }
  }

  return Array.from(required);
}

export function getSpecCheckRecordPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, '.aitk', 'spec-check.json');
}

export function loadSpecCheckRecord(workspaceRoot: string): any | null {
  const recordPath = getSpecCheckRecordPath(workspaceRoot);
  if (!fs.existsSync(recordPath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(recordPath, 'utf-8'));
  } catch {
    return null;
  }
}

function recordHasAllRequired(record: any, required: string[]): { ok: true } | { ok: false; missing: string[] } {
  const declared = Array.isArray(record?.requiredInstructions) ? record.requiredInstructions : [];
  const normalizedDeclared = declared.map((x: unknown) => normalizeToPosix(String(x)));

  const missing: string[] = [];
  for (const req of required) {
    const reqPosix = normalizeToPosix(req);
    const found = normalizedDeclared.some((d: string) => d === reqPosix || d.endsWith(`/${path.posix.basename(reqPosix)}`));
    if (!found) missing.push(req);
  }

  return missing.length ? { ok: false, missing } : { ok: true };
}

export function isSpecCheckFresh(
  workspaceRoot: string,
  maxAgeHours: number,
  requiredInstructions: string[] = Array.from(BASELINE_REQUIRED_INSTRUCTIONS)
): SpecCheckFreshness {
  const record = loadSpecCheckRecord(workspaceRoot);
  if (!record?.recordedAt) {
    return { ok: false, reason: 'missing' };
  }

  const recordedAtMs = Date.parse(record.recordedAt);
  if (!Number.isFinite(recordedAtMs)) {
    return { ok: false, reason: 'invalid_timestamp' };
  }

  const ageHours = (Date.now() - recordedAtMs) / 36e5;
  if (ageHours > maxAgeHours) {
    return { ok: false, reason: 'expired', ageHours };
  }

  const check = recordHasAllRequired(record, requiredInstructions);
  if (!check.ok) {
    return { ok: false, reason: 'missing_required_instructions', missingInstructions: check.missing };
  }

  return { ok: true, recordedAt: record.recordedAt, ageHours };
}

export function shouldEnforceSpecCheck(stagedFiles: string[]): boolean {
  return stagedFiles.some(f => /\.(ts|tsx|js|jsx|md)$/.test(f) && !f.endsWith('.instructions.md'));
}

export function recordSpecCheck(
  workspaceRoot: string,
  note: string,
  options?: { requiredInstructions?: string[] }
): void {
  const recordPath = getSpecCheckRecordPath(workspaceRoot);
  const dir = path.dirname(recordPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const record = {
    version: 1,
    recordedAt: new Date().toISOString(),
    requiredInstructions: options?.requiredInstructions ?? Array.from(BASELINE_REQUIRED_INSTRUCTIONS),
    note
  };

  fs.writeFileSync(recordPath, JSON.stringify(record, null, 2) + '\n', 'utf-8');
}
