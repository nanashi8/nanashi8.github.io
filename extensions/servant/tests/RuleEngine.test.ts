import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RuleEngine } from '../src/engine/RuleEngine';
import { Instruction, Rule } from '../src/loader/InstructionsLoader';

// Mock vscode module
vi.mock('vscode', () => {
  class Range {
    constructor(public start: any, public end: any) {}
  }
  
  return {
    Range,
    DiagnosticSeverity: {
      Error: 0,
      Warning: 1,
      Information: 2,
      Hint: 3
    }
  };
});

const mockDocument = (text: string, fileName: string = 'test.ts') => {
  // 先頭・末尾の空白を除去
  const trimmedText = text.trim();
  
  return {
    getText: () => trimmedText,
    fileName,
    lineCount: trimmedText.split('\n').length,
    lineAt: (line: number) => ({
      text: trimmedText.split('\n')[line] || ''
    }),
    positionAt: (offset: number) => {
      const lines = trimmedText.substring(0, offset).split('\n');
      return {
        line: lines.length - 1,
        character: lines[lines.length - 1].length
      };
    }
  };
};

describe('RuleEngine', () => {
  let engine: RuleEngine;

  beforeEach(() => {
    engine = new RuleEngine();
  });

  describe('Position Invariant Conditions', () => {
    it('Position値のMagic Numberを検出する', () => {
      const text = `
        const position = 5; // Magic Number
        word.position = 0;
      `;
      const doc = mockDocument(text);
      
      const instruction: Instruction = {
        id: 'position-invariant-conditions',
        filePath: '',
        description: '',
        priority: 'critical',
        rules: []
      };
      
      const violations = engine.validate(doc as any, [instruction]);
      
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].message).toContain('CRITICAL');
      expect(violations[0].message).toContain('Magic Number');
      expect(violations[0].severity).toBe('error');
    });

    it('Position定数使用時は違反を検出しない', () => {
      const text = `
        const position = Position.NEUTRAL;
        word.position = Position.HIGH_PRIORITY;
      `;
      const doc = mockDocument(text);
      
      const instruction: Instruction = {
        id: 'position-invariant-conditions',
        filePath: '',
        description: '',
        priority: 'critical',
        rules: []
      };
      
      const violations = engine.validate(doc as any, [instruction]);
      
      expect(violations.length).toBe(0);
    });

    it('Position階層の直接変更を検出する', () => {
      const text = `
        Position.HIGH_PRIORITY += 1; // 直接変更禁止
        Position.NEUTRAL++;
      `;
      const doc = mockDocument(text);
      
      const instruction: Instruction = {
        id: 'position-invariant-conditions',
        filePath: '',
        description: '',
        priority: 'critical',
        rules: []
      };
      
      const violations = engine.validate(doc as any, [instruction]);
      
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].message).toContain('直接変更禁止');
      expect(violations[0].suggestedFix).toContain('PositionCalculator');
    });
  });

  describe('Batch Processing Principles', () => {
    it('単語単位のPosition更新を検出する', () => {
      const text = `
        updatePosition(word); // バッチ方式違反
      `;
      const doc = mockDocument(text);
      
      const instruction: Instruction = {
        id: 'batch-processing-principles',
        filePath: '',
        description: '',
        priority: 'critical',
        rules: []
      };
      
      const violations = engine.validate(doc as any, [instruction]);
      
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].message).toContain('バッチ方式原則1');
      expect(violations[0].severity).toBe('error');
    });

    it('カテゴリー変更時のPosition初期化忘れを警告する', () => {
      const text = `
        category = 'mastered'; // Position初期化忘れ
      `;
      const doc = mockDocument(text);
      
      const instruction: Instruction = {
        id: 'batch-processing-principles',
        filePath: '',
        description: '',
        priority: 'critical',
        rules: []
      };
      
      const violations = engine.validate(doc as any, [instruction]);
      
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].message).toContain('Position初期化');
      expect(violations[0].severity).toBe('warning');
    });

    it('カテゴリー変更とPosition初期化がセットの場合は違反なし', () => {
      const text = `
        category = 'mastered';
        position = Position.NEUTRAL; // 正しい実装
      `;
      const doc = mockDocument(text);
      
      const instruction: Instruction = {
        id: 'batch-processing-principles',
        filePath: '',
        description: '',
        priority: 'critical',
        rules: []
      };
      
      const violations = engine.validate(doc as any, [instruction]);
      
      const categoryViolations = violations.filter(v => 
        v.message.includes('カテゴリー変更')
      );
      
      expect(categoryViolations.length).toBe(0);
    });
  });

  describe('Mandatory Spec Check', () => {
    it('実装ファイルで仕様参照がない場合にINFOレベル警告', () => {
      const text = `
        export function calculatePosition() {
          // 実装...
        }
      `;
      const doc = mockDocument(text, 'src/calculator.ts');
      
      const instruction: Instruction = {
        id: 'mandatory-spec-check',
        filePath: '',
        description: '',
        priority: 'high',
        rules: []
      };
      
      const violations = engine.validate(doc as any, [instruction]);
      
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].message).toContain('仕様書を確認');
      expect(violations[0].severity).toBe('information');
    });

    it('仕様参照コメントがある場合は違反なし', () => {
      const text = `
        // 仕様: docs/specifications/position-calculation.md
        export function calculatePosition() {
          // 実装...
        }
      `;
      const doc = mockDocument(text, 'src/calculator.ts');
      
      const instruction: Instruction = {
        id: 'mandatory-spec-check',
        filePath: '',
        description: '',
        priority: 'high',
        rules: []
      };
      
      const violations = engine.validate(doc as any, [instruction]);
      
      expect(violations.length).toBe(0);
    });

    it('テストファイルは検証対象外', () => {
      const text = `
        // テストファイルは仕様参照不要
        describe('test', () => {});
      `;
      const doc = mockDocument(text, 'src/calculator.test.ts');
      
      const instruction: Instruction = {
        id: 'mandatory-spec-check',
        filePath: '',
        description: '',
        priority: 'high',
        rules: []
      };
      
      const violations = engine.validate(doc as any, [instruction]);
      
      expect(violations.length).toBe(0);
    });
  });

  describe('Generic Rule Detection', () => {
    it('MUST_NOTルールで禁止パターンを検出する', () => {
      const text = `
        console.log('debug'); // 本番環境で禁止
      `;
      const doc = mockDocument(text);
      
      const rule: Rule = {
        type: 'MUST_NOT',
        pattern: 'console\\.log',
        message: 'console.log使用禁止。loggerを使用してください',
        severity: 'error'
      };
      
      const instruction: Instruction = {
        id: 'logging-rules',
        filePath: '',
        description: '',
        priority: 'medium',
        rules: [rule]
      };
      
      const violations = engine.validate(doc as any, [instruction]);
      
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].message).toContain('console.log使用禁止');
    });

    it('debuggerステートメントを検出する', () => {
      const text = `
        function test() {
          debugger; // 本番コードに含めない
        }
      `;
      const doc = mockDocument(text);
      
      const rule: Rule = {
        type: 'MUST_NOT',
        pattern: 'debugger',
        message: 'debuggerステートメント使用禁止',
        severity: 'error'
      };
      
      const instruction: Instruction = {
        id: 'debug-rules',
        filePath: '',
        description: '',
        priority: 'high',
        rules: [rule]
      };
      
      const violations = engine.validate(doc as any, [instruction]);
      
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].message).toContain('debugger');
    });
  });
});
