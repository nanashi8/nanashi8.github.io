import { describe, it, expect, beforeEach } from 'vitest';
import { MermaidParser } from '../src/parser/MermaidParser';

describe('MermaidParser', () => {
  let parser: MermaidParser;

  beforeEach(() => {
    parser = new MermaidParser();
  });

  describe('parse', () => {
    it('シンプルなflowchartをパースできる', () => {
      const mermaidCode = `
graph TD
  A[Start] --> B[Process]
  B --> C[End]
      `.trim();

      const tree = parser.parse(mermaidCode);

      expect(tree.nodes.size).toBe(3);
      expect(tree.rootId).toBe('A');
      
      const nodeA = tree.nodes.get('A');
      expect(nodeA?.label).toBe('Start');
      expect(nodeA?.type).toBe('action');
      expect(nodeA?.children.length).toBe(1);
      expect(nodeA?.children[0].targetId).toBe('B');
    });

    it('条件分岐（diamond）をパースできる', () => {
      const mermaidCode = `
graph TD
  A[バグ報告] --> B{再現可能?}
  B -->|Yes| C[原因特定]
  B -->|No| D[再現手順を要求]
      `.trim();

      const tree = parser.parse(mermaidCode);

      expect(tree.nodes.size).toBe(4);
      
      const nodeB = tree.nodes.get('B');
      expect(nodeB?.type).toBe('decision');
      expect(nodeB?.label).toBe('再現可能?');
      expect(nodeB?.children.length).toBe(2);
      
      // Yes条件
      const yesEdge = nodeB?.children.find(e => e.condition === 'Yes');
      expect(yesEdge?.targetId).toBe('C');
      
      // No条件
      const noEdge = nodeB?.children.find(e => e.condition === 'No');
      expect(noEdge?.targetId).toBe('D');
    });

    it('複雑なDecision Treeをパースできる', () => {
      const mermaidCode = `
graph TD
  A[バグ報告] --> B[バグの検証]
  B --> C{再現可能?}
  C -->|No| D[再現手順を要求]
  C -->|Yes| E[原因特定]
  E --> F{原因は?}
  F -->|型エラー| G[TypeScript修正]
  F -->|ロジックエラー| H[アルゴリズム修正]
  F -->|UI問題| I[コンポーネント修正]
  F -->|データ問題| J[ストレージ修正]
      `.trim();

      const tree = parser.parse(mermaidCode);

      expect(tree.nodes.size).toBeGreaterThanOrEqual(8);
      
      const nodeC = tree.nodes.get('C');
      expect(nodeC?.type).toBe('decision');
      
      const nodeF = tree.nodes.get('F');
      expect(nodeF?.type).toBe('decision');
      expect(nodeF?.children.length).toBe(4);
    });

    it('flowchartタイプもサポート', () => {
      const mermaidCode = `
flowchart LR
  A[Start] --> B[End]
      `.trim();

      const tree = parser.parse(mermaidCode);

      expect(tree.nodes.size).toBe(2);
      expect(tree.rootId).toBe('A');
    });

    it('コメントを無視する', () => {
      const mermaidCode = `
graph TD
  %% これはコメント
  A[Start] --> B[End]
  %% これもコメント
      `.trim();

      const tree = parser.parse(mermaidCode);

      expect(tree.nodes.size).toBe(2);
    });
  });

  describe('traverse', () => {
    it('Decision Treeを辿って推奨事項を生成', () => {
      const mermaidCode = `
graph TD
  A[バグ報告] --> B{再現可能?}
  B -->|Yes| C[原因特定]
  B -->|No| D[再現手順を要求]
  C --> E{原因は?}
  E -->|型エラー| F[TypeScript修正]
  E -->|ロジックエラー| G[アルゴリズム修正]
      `.trim();

      const tree = parser.parse(mermaidCode);

      // 再現可能 + 型エラーのケース
      const path = parser.traverse(tree, {
        answer: true, // Yes
        errorType: 'type'
      });

      expect(path.path).toContain('A');
      expect(path.path).toContain('B');
      expect(path.path).toContain('C');
      expect(path.path).toContain('E');
      expect(path.path).toContain('F');
      
      expect(path.recommendations.length).toBeGreaterThan(0);
      expect(path.recommendations).toContain('TypeScript修正');
    });

    it('No分岐の場合は別のパスを辿る', () => {
      const mermaidCode = `
graph TD
  A[バグ報告] --> B{再現可能?}
  B -->|Yes| C[原因特定]
  B -->|No| D[再現手順を要求]
      `.trim();

      const tree = parser.parse(mermaidCode);

      // 再現不可能のケース
      const path = parser.traverse(tree, {
        answer: false // No
      });

      expect(path.path).toContain('A');
      expect(path.path).toContain('B');
      expect(path.path).toContain('D');
      
      expect(path.recommendations).toContain('再現手順を要求');
    });

    it('ロジックエラーの場合のパス', () => {
      const mermaidCode = `
graph TD
  A[バグ報告] --> B{再現可能?}
  B -->|Yes| C[原因特定]
  C --> D{原因は?}
  D -->|型エラー| E[TypeScript修正]
  D -->|ロジックエラー| F[アルゴリズム修正]
  D -->|UI問題| G[コンポーネント修正]
      `.trim();

      const tree = parser.parse(mermaidCode);

      const path = parser.traverse(tree, {
        answer: true,
        errorType: 'logic'
      });

      expect(path.finalNodeId).toBe('F');
      expect(path.recommendations).toContain('アルゴリズム修正');
    });

    it('無限ループを防ぐ', () => {
      const mermaidCode = `
graph TD
  A[Start] --> B[Loop]
  B --> A
      `.trim();

      const tree = parser.parse(mermaidCode);

      const path = parser.traverse(tree, {});

      // 50ステップ制限で停止
      expect(path.path.length).toBeLessThanOrEqual(50);
    });
  });

  describe('matchCondition', () => {
    it('Yes/No条件をマッチング', () => {
      const mermaidCode = `
graph TD
  A{Question?} -->|Yes| B[Action1]
  A -->|No| C[Action2]
      `.trim();

      const tree = parser.parse(mermaidCode);

      // Yesケース
      const yesPath = parser.traverse(tree, { answer: true });
      expect(yesPath.finalNodeId).toBe('B');

      // Noケース
      const noPath = parser.traverse(tree, { answer: false });
      expect(noPath.finalNodeId).toBe('C');
    });

    it('エラータイプ条件をマッチング', () => {
      const mermaidCode = `
graph TD
  A{原因は?} -->|型エラー| B[TypeScript修正]
  A -->|ロジックエラー| C[アルゴリズム修正]
  A -->|UI問題| D[コンポーネント修正]
      `.trim();

      const tree = parser.parse(mermaidCode);

      // 型エラーケース
      const typePath = parser.traverse(tree, { errorType: 'type' });
      expect(typePath.finalNodeId).toBe('B');

      // ロジックエラーケース
      const logicPath = parser.traverse(tree, { errorType: 'logic' });
      expect(logicPath.finalNodeId).toBe('C');

      // UI問題ケース
      const uiPath = parser.traverse(tree, { errorType: 'ui' });
      expect(uiPath.finalNodeId).toBe('D');
    });
  });
});
