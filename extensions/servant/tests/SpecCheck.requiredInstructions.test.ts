import { describe, expect, it } from 'vitest';
import type { Instruction } from '../src/loader/InstructionsLoader';
import {
  computeRequiredInstructionsForFiles,
  BASELINE_REQUIRED_INSTRUCTIONS,
  isSpecCheckFresh,
  recordSpecCheck,
} from '../src/guard/SpecCheck';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

function mkTmpWorkspace(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'servant-spec-check-'));
  fs.mkdirSync(path.join(dir, '.aitk', 'instructions'), { recursive: true });
  return dir;
}

describe('SpecCheck required instructions', () => {
  it('includes baseline + enforceBeforeModification instructions matching applyTo', () => {
    const workspaceRoot = '/repo';
    const stagedFiles = ['/repo/src/App.tsx', '/repo/README.md'];

    const instructions: Instruction[] = [
      {
        id: 'a',
        filePath: '/repo/.aitk/instructions/a.instructions.md',
        description: '',
        priority: 'high',
        rules: [],
        applyTo: '**/*.tsx',
        enforceBeforeModification: true,
      },
      {
        id: 'b',
        filePath: '/repo/.aitk/instructions/b.instructions.md',
        description: '',
        priority: 'high',
        rules: [],
        applyTo: '**/*.py',
        enforceBeforeModification: true,
      },
      {
        id: 'c',
        filePath: '/repo/.aitk/instructions/c.instructions.md',
        description: '',
        priority: 'high',
        rules: [],
        applyTo: '**/*.md',
        enforceBeforeModification: false,
      },
    ];

    const required = computeRequiredInstructionsForFiles(workspaceRoot, stagedFiles, instructions);

    for (const base of BASELINE_REQUIRED_INSTRUCTIONS) {
      expect(required).toContain(base);
    }

    expect(required).toContain('.aitk/instructions/a.instructions.md');
    expect(required).not.toContain('.aitk/instructions/b.instructions.md');
    expect(required).not.toContain('.aitk/instructions/c.instructions.md');
  });

  it('isSpecCheckFresh fails if missing required instructions', () => {
    const workspaceRoot = mkTmpWorkspace();

    // record baseline only
    recordSpecCheck(workspaceRoot, 'note');

    const required = [
      ...BASELINE_REQUIRED_INSTRUCTIONS,
      '.aitk/instructions/some-extra.instructions.md',
    ];

    const freshness = isSpecCheckFresh(workspaceRoot, 24, required);
    expect(freshness.ok).toBe(false);
    if (!freshness.ok) {
      expect(freshness.reason).toBe('missing_required_instructions');
      expect(freshness.missingInstructions).toContain('.aitk/instructions/some-extra.instructions.md');
    }
  });
});
