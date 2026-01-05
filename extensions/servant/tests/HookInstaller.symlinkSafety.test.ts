import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vscode from 'vscode';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { HookInstaller } from '../src/git/HookInstaller';

describe('HookInstaller (symlink safety)', () => {
  let tempRoot: string;
  let mockOutputChannel: vscode.OutputChannel;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'servant-hookinstaller-'));

    mockOutputChannel = {
      appendLine: vi.fn(),
      show: vi.fn(),
      hide: vi.fn(),
      dispose: vi.fn(),
      name: 'test',
      append: vi.fn(),
      clear: vi.fn(),
      replace: vi.fn()
    } as unknown as vscode.OutputChannel;
  });

  afterEach(() => {
    try {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    } catch {
      // ignore
    }

    vi.restoreAllMocks();
  });

  it(process.platform === 'win32' ? 'skip: symlink behavior is platform-specific on Windows' : 'does not overwrite repo guard when pre-commit is a symlink to scripts/pre-commit-ai-guard.sh', async () => {
    if (process.platform === 'win32') return;

    const repoRoot = tempRoot;
    const hooksDir = path.join(repoRoot, '.git', 'hooks');
    const scriptsDir = path.join(repoRoot, 'scripts');

    fs.mkdirSync(hooksDir, { recursive: true });
    fs.mkdirSync(scriptsDir, { recursive: true });

    const guardPath = path.join(scriptsDir, 'pre-commit-ai-guard.sh');
    const sentinel = '#!/bin/sh\necho "SENTINEL"\n';
    fs.writeFileSync(guardPath, sentinel, 'utf8');

    const hookPath = path.join(hooksDir, 'pre-commit');
    // same as documented install: ln -sf ../../scripts/pre-commit-ai-guard.sh .git/hooks/pre-commit
    fs.symlinkSync('../../scripts/pre-commit-ai-guard.sh', hookPath);

    const installer = new HookInstaller(mockOutputChannel);
    const ok = await installer.installPreCommitHook(hooksDir);

    expect(ok).toBe(true);

    const guardContentAfter = fs.readFileSync(guardPath, 'utf8');
    expect(guardContentAfter).toBe(sentinel);

    const st = fs.lstatSync(hookPath);
    expect(st.isSymbolicLink()).toBe(true);
  });
});
