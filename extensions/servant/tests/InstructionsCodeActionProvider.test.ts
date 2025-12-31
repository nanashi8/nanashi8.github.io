import { describe, it, expect, beforeEach } from 'vitest';
import { InstructionsCodeActionProvider } from '../src/providers/InstructionsCodeActionProvider';
import { InstructionsLoader } from '../src/loader/InstructionsLoader';
import { RuleEngine } from '../src/engine/RuleEngine';
import * as vscode from 'vscode';

// vi.mock('vscode'); // 削除: vitest.config.tsのaliasを使用

describe('InstructionsCodeActionProvider', () => {
  let provider: InstructionsCodeActionProvider;
  let mockLoader: InstructionsLoader;
  let mockEngine: RuleEngine;
  let mockDocument: vscode.TextDocument;

  beforeEach(() => {
    mockLoader = {} as InstructionsLoader;
    mockEngine = new RuleEngine();
    provider = new InstructionsCodeActionProvider(mockLoader, mockEngine);

    // モックドキュメント
    mockDocument = {
      uri: { fsPath: '/workspace/test.ts' } as vscode.Uri,
      fileName: '/workspace/test.ts',
      lineAt: (line: number) => ({
        text: getLineText(line),
        range: new vscode.Range(line, 0, line, 100)
      }),
      getText: () => 'test content'
    } as any;
  });

  function getLineText(line: number): string {
    const lines: Record<number, string> = {
      0: 'class MyPosition extends BasePosition {',
      1: '  async execute() {',
      2: '    await Promise.all([task1(), task2()]);',
      3: '    // Some modification',
      4: '  }',
      5: '}'
    };
    return lines[line] || '';
  }

  describe('provideCodeActions', () => {
    it('instructions-validator診断に対してQuick Fixを提供', async () => {
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 40),
        'Position階層不変条件: BasePositionではなくPositionを継承してください',
        vscode.DiagnosticSeverity.Error
      );
      diagnostic.source = 'instructions-validator';

      const context: vscode.CodeActionContext = {
        diagnostics: [diagnostic],
        only: undefined,
        triggerKind: vscode.CodeActionTriggerKind.Automatic
      };

      const actions = await provider.provideCodeActions(
        mockDocument,
        new vscode.Range(0, 0, 0, 40),
        context,
        {} as vscode.CancellationToken
      );

      expect(actions.length).toBeGreaterThan(0);
      expect(actions[0].title).toContain('Position');
    });

    it('他のソースの診断は無視', async () => {
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 40),
        'Some other error',
        vscode.DiagnosticSeverity.Error
      );
      diagnostic.source = 'typescript';

      const context: vscode.CodeActionContext = {
        diagnostics: [diagnostic],
        only: undefined,
        triggerKind: vscode.CodeActionTriggerKind.Automatic
      };

      const actions = await provider.provideCodeActions(
        mockDocument,
        new vscode.Range(0, 0, 0, 40),
        context,
        {} as vscode.CancellationToken
      );

      expect(actions.length).toBe(0);
    });

    it('バッチ方式3原則違反のQuick Fix', async () => {
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(2, 0, 2, 50),
        'バッチ方式3原則: 順次実行してください',
        vscode.DiagnosticSeverity.Warning
      );
      diagnostic.source = 'instructions-validator';

      const context: vscode.CodeActionContext = {
        diagnostics: [diagnostic],
        only: undefined,
        triggerKind: vscode.CodeActionTriggerKind.Automatic
      };

      const actions = await provider.provideCodeActions(
        mockDocument,
        new vscode.Range(2, 0, 2, 50),
        context,
        {} as vscode.CancellationToken
      );

      expect(actions.length).toBeGreaterThan(0);
      expect(actions.some(a => a.title.includes('並列実行を順次実行'))).toBe(true);
    });

    it('仕様書参照違反のQuick Fix', async () => {
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(3, 0, 3, 30),
        'コード変更前に仕様書を参照してください',
        vscode.DiagnosticSeverity.Warning
      );
      diagnostic.source = 'instructions-validator';

      const context: vscode.CodeActionContext = {
        diagnostics: [diagnostic],
        only: undefined,
        triggerKind: vscode.CodeActionTriggerKind.Automatic
      };

      const actions = await provider.provideCodeActions(
        mockDocument,
        new vscode.Range(3, 0, 3, 30),
        context,
        {} as vscode.CancellationToken
      );

      expect(actions.length).toBeGreaterThan(0);
      expect(actions.some(a => a.title.includes('仕様書参照'))).toBe(true);
    });
  });

  describe('Quick Fix Actions', () => {
    it('Position階層修正のeditが正しい', async () => {
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 40),
        'Position階層不変条件: BasePositionではなくPositionを継承してください',
        vscode.DiagnosticSeverity.Error
      );
      diagnostic.source = 'instructions-validator';

      const context: vscode.CodeActionContext = {
        diagnostics: [diagnostic],
        only: undefined,
        triggerKind: vscode.CodeActionTriggerKind.Automatic
      };

      const actions = await provider.provideCodeActions(
        mockDocument,
        new vscode.Range(0, 0, 0, 40),
        context,
        {} as vscode.CancellationToken
      );

      const positionFix = actions.find(a => a.title.includes('Position'));
      expect(positionFix).toBeDefined();
      expect(positionFix?.edit).toBeDefined();
      expect(positionFix?.isPreferred).toBe(true);
    });

    it('順次実行修正のeditが正しい', async () => {
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(2, 0, 2, 50),
        'バッチ方式3原則: 順次実行してください',
        vscode.DiagnosticSeverity.Warning
      );
      diagnostic.source = 'instructions-validator';

      const context: vscode.CodeActionContext = {
        diagnostics: [diagnostic],
        only: undefined,
        triggerKind: vscode.CodeActionTriggerKind.Automatic
      };

      const actions = await provider.provideCodeActions(
        mockDocument,
        new vscode.Range(2, 0, 2, 50),
        context,
        {} as vscode.CancellationToken
      );

      const sequentialFix = actions.find(a => a.title.includes('順次実行'));
      expect(sequentialFix).toBeDefined();
      expect(sequentialFix?.edit).toBeDefined();
    });

    it('仕様書参照コメント追加のeditが正しい', async () => {
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(3, 0, 3, 30),
        'コード変更前に仕様書を参照してください',
        vscode.DiagnosticSeverity.Warning
      );
      diagnostic.source = 'instructions-validator';

      const context: vscode.CodeActionContext = {
        diagnostics: [diagnostic],
        only: undefined,
        triggerKind: vscode.CodeActionTriggerKind.Automatic
      };

      const actions = await provider.provideCodeActions(
        mockDocument,
        new vscode.Range(3, 0, 3, 30),
        context,
        {} as vscode.CancellationToken
      );

      const specFix = actions.find(a => a.title.includes('仕様書参照'));
      expect(specFix).toBeDefined();
      expect(specFix?.edit).toBeDefined();
      expect(specFix?.isPreferred).toBe(true);
    });
  });

  describe('Command Actions', () => {
    it('Position分割ガイダンスコマンドを提供', async () => {
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 40),
        'バッチ方式3原則: 1つのファイルで1つのルールのみ',
        vscode.DiagnosticSeverity.Warning
      );
      diagnostic.source = 'instructions-validator';

      const context: vscode.CodeActionContext = {
        diagnostics: [diagnostic],
        only: undefined,
        triggerKind: vscode.CodeActionTriggerKind.Automatic
      };

      const actions = await provider.provideCodeActions(
        mockDocument,
        new vscode.Range(0, 0, 0, 40),
        context,
        {} as vscode.CancellationToken
      );

      const splitFix = actions.find(a => a.title.includes('分割'));
      expect(splitFix).toBeDefined();
      expect(splitFix?.command).toBeDefined();
      expect(splitFix?.command?.command).toBe('servant.showSplitGuidance');
    });

    it('単一ファイル完結ガイダンスコマンドを提供', async () => {
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 40),
        'バッチ方式3原則: 修正は1つのファイルで完結',
        vscode.DiagnosticSeverity.Warning
      );
      diagnostic.source = 'instructions-validator';

      const context: vscode.CodeActionContext = {
        diagnostics: [diagnostic],
        only: undefined,
        triggerKind: vscode.CodeActionTriggerKind.Automatic
      };

      const actions = await provider.provideCodeActions(
        mockDocument,
        new vscode.Range(0, 0, 0, 40),
        context,
        {} as vscode.CancellationToken
      );

      const singleFileFix = actions.find(a => a.title.includes('単一ファイル'));
      expect(singleFileFix).toBeDefined();
      expect(singleFileFix?.command).toBeDefined();
      expect(singleFileFix?.command?.command).toBe('servant.showSingleFileGuidance');
    });
  });

  describe('Multiple Diagnostics', () => {
    it('複数の違反に対して複数のQuick Fixを提供', async () => {
      const diagnostics = [
        new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, 40),
          'Position階層不変条件違反',
          vscode.DiagnosticSeverity.Error
        ),
        new vscode.Diagnostic(
          new vscode.Range(2, 0, 2, 50),
          'バッチ方式3原則: 順次実行',
          vscode.DiagnosticSeverity.Warning
        )
      ];
      diagnostics[0].source = 'instructions-validator';
      diagnostics[1].source = 'instructions-validator';

      const context: vscode.CodeActionContext = {
        diagnostics,
        only: undefined,
        triggerKind: vscode.CodeActionTriggerKind.Automatic
      };

      const actions = await provider.provideCodeActions(
        mockDocument,
        new vscode.Range(0, 0, 2, 50),
        context,
        {} as vscode.CancellationToken
      );

      expect(actions.length).toBeGreaterThanOrEqual(2);
    });
  });
});
