import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DecisionTreeLoader } from '../src/loader/DecisionTreeLoader';
import * as vscode from 'vscode';
import * as fs from 'fs/promises';

vi.mock('vscode');
vi.mock('fs/promises');

describe('DecisionTreeLoader', () => {
  let loader: DecisionTreeLoader;
  const mockWorkspaceRoot = '/workspace';
  const decisionTreesPath = `${mockWorkspaceRoot}/.aitk/instructions/decision-trees`;

  beforeEach(() => {
    vi.clearAllMocks();
    loader = new DecisionTreeLoader(mockWorkspaceRoot);
  });

  describe('load', () => {
    it('.aitk/instructions/decision-trees/配下のファイルを読み込む', async () => {
      // モックのファイルリスト
      vi.mocked(fs.readdir).mockResolvedValue([
        'bug-fix-decision.instructions.md',
        'feature-decision.instructions.md',
        'other.md',
        'subdir'
      ] as any);

      const mockContent = `# Bug Fix Decision Tree

\`\`\`mermaid
graph TD
  A[バグ報告] --> B{再現可能?}
  B -->|Yes| C[修正開始]
  B -->|No| D[再現手順を要求]
\`\`\`
`;

      vi.mocked(fs.readFile).mockResolvedValue(mockContent);

      await loader.load();

      // *.instructions.mdのみ読み込まれる
      expect(fs.readFile).toHaveBeenCalledTimes(2);
      expect(fs.readFile).toHaveBeenCalledWith(
        `${decisionTreesPath}/bug-fix-decision.instructions.md`,
        'utf-8'
      );
    });

    it('Mermaidコードブロックを正しく抽出', async () => {
      vi.mocked(fs.readdir).mockResolvedValue(['test-decision.instructions.md'] as any);

      const mockContent = `# Test Decision

Some text before.

\`\`\`mermaid
graph TD
  A[Start] --> B[End]
\`\`\`

Some text after.
`;

      vi.mocked(fs.readFile).mockResolvedValue(mockContent);

      await loader.load();

      const treeInstruction = loader.getTree('test-decision');
      expect(treeInstruction).toBeDefined();
      expect(treeInstruction?.tree.nodes.size).toBe(2);
    });

    it('複数のDecision Treesを読み込む', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        'bug-fix.instructions.md',
        'feature.instructions.md'
      ] as any);

      vi.mocked(fs.readFile)
        .mockResolvedValueOnce('```mermaid\ngraph TD\n  A[Bug] --> B[Fix]\n```')
        .mockResolvedValueOnce('```mermaid\ngraph TD\n  X[Feature] --> Y[Implement]\n```');

      await loader.load();

      expect(loader.getTree('bug-fix')).toBeDefined();
      expect(loader.getTree('feature')).toBeDefined();
    });
  });

  describe('getApplicableTrees', () => {
    beforeEach(async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        'bug-fix-decision.instructions.md',
        'feature-decision.instructions.md',
        'refactoring-decision.instructions.md',
        'performance-decision.instructions.md'
      ] as any);

      vi.mocked(fs.readFile).mockResolvedValue('```mermaid\ngraph TD\n  A[Test]\n```');

      await loader.load();
    });

    it('ファイル名に"bug"を含む場合、bug-fix-decisionを適用', () => {
      const mockDocument = {
        fileName: '/workspace/src/bugfix-service.ts',
        uri: { fsPath: '/workspace/src/bugfix-service.ts' }
      } as vscode.TextDocument;
      
      const trees = loader.getApplicableTrees(mockDocument);
      
      expect(trees.length).toBeGreaterThan(0);
      expect(trees.some(t => t.id === 'bug-fix-decision')).toBe(true);
    });

    it('ファイル名に"fix"を含む場合、bug-fix-decisionを適用', () => {
      const mockDocument = {
        fileName: '/workspace/src/fix-validation.ts',
        uri: { fsPath: '/workspace/src/fix-validation.ts' }
      } as vscode.TextDocument;
      
      const trees = loader.getApplicableTrees(mockDocument);
      
      expect(trees.length).toBeGreaterThan(0);
      expect(trees.some(t => t.id === 'bug-fix-decision')).toBe(true);
    });

    it('ファイル名に"feature"を含む場合、feature-decisionを適用', () => {
      const mockDocument = {
        fileName: '/workspace/src/new-feature.ts',
        uri: { fsPath: '/workspace/src/new-feature.ts' }
      } as vscode.TextDocument;
      
      const trees = loader.getApplicableTrees(mockDocument);
      
      expect(trees.length).toBeGreaterThan(0);
      expect(trees.some(t => t.id === 'feature-decision')).toBe(true);
    });

    it('ファイル名に"refactor"を含む場合、refactoring-decisionを適用', () => {
      const mockDocument = {
        fileName: '/workspace/src/refactor-model.ts',
        uri: { fsPath: '/workspace/src/refactor-model.ts' }
      } as vscode.TextDocument;
      
      const trees = loader.getApplicableTrees(mockDocument);
      
      expect(trees.length).toBeGreaterThan(0);
      expect(trees.some(t => t.id === 'refactoring-decision')).toBe(true);
    });

    it('ファイル名に"performance"を含む場合、performance-decisionを適用', () => {
      const mockDocument = {
        fileName: '/workspace/src/performance-optimization.ts',
        uri: { fsPath: '/workspace/src/performance-optimization.ts' }
      } as vscode.TextDocument;
      
      const trees = loader.getApplicableTrees(mockDocument);
      
      expect(trees.length).toBeGreaterThan(0);
      expect(trees.some(t => t.id === 'performance-decision')).toBe(true);
    });

    it('該当しないファイル名の場合、空配列を返す', () => {
      const mockDocument = {
        fileName: '/workspace/src/utils.ts',
        uri: { fsPath: '/workspace/src/utils.ts' }
      } as vscode.TextDocument;
      
      const trees = loader.getApplicableTrees(mockDocument);
      
      expect(trees.length).toBe(0);
    });
  });

  describe('evaluateTree', () => {
    beforeEach(async () => {
      vi.mocked(fs.readdir).mockResolvedValue(['test-decision.instructions.md'] as any);

      const mockContent = `\`\`\`mermaid
graph TD
  A[バグ報告] --> B{再現可能?}
  B -->|Yes| C[原因特定]
  B -->|No| D[再現手順を要求]
  C --> E{原因は?}
  E -->|型エラー| F[TypeScript修正]
  E -->|ロジックエラー| G[アルゴリズム修正]
\`\`\``;

      vi.mocked(fs.readFile).mockResolvedValue(mockContent);

      await loader.load();
    });

    it('Decision Treeを評価して推奨事項を取得', () => {
      const treeInstruction = loader.getTree('test-decision');
      expect(treeInstruction).toBeDefined();

      if (treeInstruction) {
        const result = loader.evaluateTree(treeInstruction.tree, {
          answer: true,
          errorType: 'type'
        });

        expect(result.recommendations.length).toBeGreaterThan(0);
        expect(result.recommendations).toContain('TypeScript修正');
      }
    });

    it('No分岐の場合の推奨事項', () => {
      const treeInstruction = loader.getTree('test-decision');
      expect(treeInstruction).toBeDefined();

      if (treeInstruction) {
        const result = loader.evaluateTree(treeInstruction.tree, {
          answer: false
        });

        expect(result.recommendations).toContain('再現手順を要求');
      }
    });

    it('ロジックエラーの場合の推奨事項', () => {
      const treeInstruction = loader.getTree('test-decision');
      expect(treeInstruction).toBeDefined();

      if (treeInstruction) {
        const result = loader.evaluateTree(treeInstruction.tree, {
          answer: true,
          errorType: 'logic'
        });

        expect(result.recommendations).toContain('アルゴリズム修正');
      }
    });
  });

  describe('getTree', () => {
    it('存在しないDecision Treeの場合undefinedを返す', () => {
      const tree = loader.getTree('non-existent');
      expect(tree).toBeUndefined();
    });

    it('読み込み済みのDecision Treeを返す', async () => {
      vi.mocked(fs.readdir).mockResolvedValue(['test.instructions.md'] as any);

      vi.mocked(fs.readFile).mockResolvedValue('```mermaid\ngraph TD\n  A[Test]\n```');

      await loader.load();

      const treeInstruction = loader.getTree('test');
      expect(treeInstruction).toBeDefined();
      expect(treeInstruction?.id).toBe('test');
    });
  });
});
