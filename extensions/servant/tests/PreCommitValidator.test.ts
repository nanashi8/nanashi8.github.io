import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vscode from 'vscode';
import { PreCommitValidator } from '../src/git/PreCommitValidator';
import { RuleEngine } from '../src/engine/RuleEngine';
import { InstructionsLoader } from '../src/loader/InstructionsLoader';

describe('PreCommitValidator', () => {
  let validator: PreCommitValidator;
  let mockEngine: RuleEngine;
  let mockLoader: InstructionsLoader;
  let mockOutputChannel: vscode.OutputChannel;

  beforeEach(() => {
    // Mock OutputChannel
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

    // Mock RuleEngine
    mockEngine = new RuleEngine();
    vi.spyOn(mockEngine, 'validate').mockReturnValue([]);

    // Mock InstructionsLoader
    mockLoader = {
      getInstructions: vi.fn().mockReturnValue([])
    } as unknown as InstructionsLoader;

    validator = new PreCommitValidator(mockEngine, mockLoader, mockOutputChannel);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('検証が成功し、違反がない場合はsuccessがtrueを返す', async () => {
    vi.spyOn(vscode.workspace, 'getConfiguration').mockReturnValue({
      get: vi.fn((key: string, defaultValue?: unknown) => {
        if (key === 'preCommit.strictMode') return false;
        if (key === 'preCommit.ignorePatterns') return [];
        return defaultValue;
      })
    } as unknown as vscode.WorkspaceConfiguration);

    const result = await validator.checkBeforeCommit(['/path/to/file.instructions.md']);

    expect(result.success).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.summary).toContain('No violations');
  });

  it('.instructions.mdファイルのみを検証する', async () => {
    vi.spyOn(vscode.workspace, 'getConfiguration').mockReturnValue({
      get: vi.fn((key: string, defaultValue?: unknown) => {
        if (key === 'preCommit.strictMode') return false;
        if (key === 'preCommit.ignorePatterns') return [];
        return defaultValue;
      })
    } as unknown as vscode.WorkspaceConfiguration);

    await validator.checkBeforeCommit([
      '/path/to/file.ts',
      '/path/to/file.instructions.md'
    ]);

    // .instructions.mdファイルのみがチェックされることを確認
    // (実際にはopenTextDocumentが呼ばれるかで判定)
  });

  it('ignoreパターンに一致するファイルをスキップする', async () => {
    vi.spyOn(vscode.workspace, 'getConfiguration').mockReturnValue({
      get: vi.fn((key: string, defaultValue?: unknown) => {
        if (key === 'preCommit.strictMode') return false;
        if (key === 'preCommit.ignorePatterns') return ['node_modules'];
        return defaultValue;
      })
    } as unknown as vscode.WorkspaceConfiguration);

    const result = await validator.checkBeforeCommit([
      '/path/to/node_modules/file.instructions.md'
    ]);

    expect(result.success).toBe(true);
    expect(result.summary).toContain('ignored');
  });

  it('strictModeがtrueの場合、warningもerrorとして扱う', async () => {
    vi.spyOn(vscode.workspace, 'getConfiguration').mockReturnValue({
      get: vi.fn((key: string, defaultValue?: unknown) => {
        if (key === 'preCommit.strictMode') return true;
        if (key === 'preCommit.ignorePatterns') return [];
        return defaultValue;
      })
    } as unknown as vscode.WorkspaceConfiguration);

    vi.spyOn(mockEngine, 'validate').mockReturnValue([
      {
        range: new vscode.Range(0, 0, 0, 10),
        message: 'Test warning',
        severity: 'warning',
        ruleId: 'test-rule'
      }
    ]);

    vi.spyOn(vscode.workspace, 'openTextDocument').mockResolvedValue({
      getText: vi.fn().mockReturnValue('test content')
    } as unknown as vscode.TextDocument);

    const result = await validator.checkBeforeCommit(['/path/to/file.instructions.md']);

    // strictModeではwarningもerrorとして扱われる
    const errors = result.violations.filter(v => v.severity === 'error');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('エラーレベルの違反がある場合はsuccessがfalseを返す', async () => {
    vi.spyOn(vscode.workspace, 'getConfiguration').mockReturnValue({
      get: vi.fn((key: string, defaultValue?: unknown) => {
        if (key === 'preCommit.strictMode') return false;
        if (key === 'preCommit.ignorePatterns') return [];
        return defaultValue;
      })
    } as unknown as vscode.WorkspaceConfiguration);

    vi.spyOn(mockEngine, 'validate').mockReturnValue([
      {
        range: new vscode.Range(0, 0, 0, 10),
        message: 'Test error',
        severity: 'error',
        ruleId: 'test-rule'
      }
    ]);

    vi.spyOn(vscode.workspace, 'openTextDocument').mockResolvedValue({
      getText: vi.fn().mockReturnValue('test content')
    } as unknown as vscode.TextDocument);

    const result = await validator.checkBeforeCommit(['/path/to/file.instructions.md']);

    expect(result.success).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.summary).toContain('Commit blocked');
  });

  it('formatViolationsForTerminalが正しいフォーマットを生成する', () => {
    // asRelativePathのモック
    vi.spyOn(vscode.workspace, 'asRelativePath').mockImplementation((pathOrUri: string | vscode.Uri) => {
      const path = typeof pathOrUri === 'string' ? pathOrUri : pathOrUri.fsPath;
      return path.split('/').pop() || path;
    });

    const violations = [
      {
        file: '/path/to/file1.instructions.md',
        line: 10,
        message: 'Error message 1',
        severity: 'error' as const
      },
      {
        file: '/path/to/file1.instructions.md',
        line: 20,
        message: 'Warning message 1',
        severity: 'warning' as const
      },
      {
        file: '/path/to/file2.instructions.md',
        line: 5,
        message: 'Error message 2',
        severity: 'error' as const
      }
    ];

    const formatted = validator.formatViolationsForTerminal(violations);

    expect(formatted).toContain('Servant');
    expect(formatted).toContain('file1.instructions.md');
    expect(formatted).toContain('file2.instructions.md');
    expect(formatted).toContain('Line 10');
    expect(formatted).toContain('Error message 1');
    expect(formatted).toContain('❌');
    expect(formatted).toContain('⚠️');
  });

  it('getConfigが正しい設定を返す', () => {
    vi.spyOn(vscode.workspace, 'getConfiguration').mockReturnValue({
      get: vi.fn((key: string, defaultValue?: unknown) => {
        if (key === 'preCommit.enabled') return true;
        if (key === 'preCommit.strictMode') return true;
        if (key === 'preCommit.autoFix') return false;
        if (key === 'preCommit.ignorePatterns') return ['node_modules', 'dist'];
        return defaultValue;
      })
    } as unknown as vscode.WorkspaceConfiguration);

    const config = validator.getConfig();

    expect(config.enabled).toBe(true);
    expect(config.strictMode).toBe(true);
    expect(config.autoFix).toBe(false);
    expect(config.ignorePatterns).toEqual(['node_modules', 'dist']);
  });

  it('空のファイルリストを渡すとsuccess=trueを返す', async () => {
    vi.spyOn(vscode.workspace, 'getConfiguration').mockReturnValue({
      get: vi.fn((key: string, defaultValue?: unknown) => {
        if (key === 'preCommit.strictMode') return false;
        if (key === 'preCommit.ignorePatterns') return [];
        return defaultValue;
      })
    } as unknown as vscode.WorkspaceConfiguration);

    const result = await validator.checkBeforeCommit([]);

    expect(result.success).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('複数のファイルに違反がある場合、全ての違反を収集する', async () => {
    vi.spyOn(vscode.workspace, 'getConfiguration').mockReturnValue({
      get: vi.fn((key: string, defaultValue?: unknown) => {
        if (key === 'preCommit.strictMode') return false;
        if (key === 'preCommit.ignorePatterns') return [];
        return defaultValue;
      })
    } as unknown as vscode.WorkspaceConfiguration);

    vi.spyOn(mockEngine, 'validate').mockReturnValue([
      {
        range: new vscode.Range(0, 0, 0, 10),
        message: 'Error 1',
        severity: 'error',
        ruleId: 'rule-1'
      },
      {
        range: new vscode.Range(1, 0, 1, 10),
        message: 'Error 2',
        severity: 'error',
        ruleId: 'rule-2'
      }
    ]);

    vi.spyOn(vscode.workspace, 'openTextDocument').mockResolvedValue({
      getText: vi.fn().mockReturnValue('test content')
    } as unknown as vscode.TextDocument);

    const result = await validator.checkBeforeCommit([
      '/path/to/file1.instructions.md',
      '/path/to/file2.instructions.md'
    ]);

    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.success).toBe(false);
  });
});
