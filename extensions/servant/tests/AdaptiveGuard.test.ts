import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { AdaptiveGuard } from '../src/learning/AdaptiveGuard';

// Mock vscode
const mockContext = {
  subscriptions: [],
  workspaceState: new Map(),
  globalState: new Map(),
  extensionPath: '',
  storagePath: '',
  globalStoragePath: '',
  logPath: ''
} as any;

const mockWorkspaceFolder = {
  uri: { fsPath: '/tmp/test-workspace' },
  name: 'test',
  index: 0
};

describe('AdaptiveGuard', () => {
  let guard: AdaptiveGuard;
  let dbPath: string;

  beforeEach(() => {
    // Mock workspace
    (vscode.workspace as any).workspaceFolders = [mockWorkspaceFolder];
    (vscode.workspace as any).getConfiguration = () => ({
      get: (key: string, defaultValue: any) => defaultValue
    });

    dbPath = path.join(mockWorkspaceFolder.uri.fsPath, '.vscode', 'failure-patterns.json');

    // Clean up DB file
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }

    guard = new AdaptiveGuard(mockContext);
  });

  afterEach(() => {
    // Clean up
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  });

  it('違反を記録できる', async () => {
    await guard.recordViolation({
      rule: 'test-rule',
      category: 'test-category',
      filePath: 'test.ts',
      message: 'Test violation'
    });

    // DB ファイルが生成される
    expect(fs.existsSync(dbPath)).toBe(true);

    const content = fs.readFileSync(dbPath, 'utf-8');
    const db = JSON.parse(content);

    expect(db.patterns).toHaveLength(1);
    expect(db.patterns[0].pattern).toBe('test-rule');
    expect(db.patterns[0].occurrences).toBe(1);
    expect(db.totalValidations).toBe(1);
  });

  it('同じ違反を複数回記録すると重みが増加する', async () => {
    await guard.recordViolation({
      rule: 'test-rule',
      category: 'test-category',
      filePath: 'test.ts',
      message: 'Test violation'
    });

    await guard.recordViolation({
      rule: 'test-rule',
      category: 'test-category',
      filePath: 'test.ts',
      message: 'Test violation'
    });

    const content = fs.readFileSync(dbPath, 'utf-8');
    const db = JSON.parse(content);

    expect(db.patterns).toHaveLength(1);
    expect(db.patterns[0].occurrences).toBe(2);
    expect(db.patterns[0].weight).toBeGreaterThan(0.5);
  });

  it('復旧を記録すると重みが減少する', async () => {
    await guard.recordViolation({
      rule: 'test-rule',
      category: 'test-category',
      filePath: 'test.ts',
      message: 'Test violation'
    });

    let content = fs.readFileSync(dbPath, 'utf-8');
    let db = JSON.parse(content);
    const initialWeight = db.patterns[0].weight;

    await guard.recordRecovery('test-rule');

    content = fs.readFileSync(dbPath, 'utf-8');
    db = JSON.parse(content);

    expect(db.patterns[0].recoveries).toBe(1);
    expect(db.patterns[0].weight).toBeLessThan(initialWeight);
  });

  it('統計情報を取得できる', () => {
    const stats = guard.getStats();

    expect(stats).toHaveProperty('totalPatterns');
    expect(stats).toHaveProperty('highRiskPatterns');
    expect(stats).toHaveProperty('averageSuccessRate');
    expect(stats).toHaveProperty('validationsUntilNextLearning');
    expect(stats).toHaveProperty('totalLearningCycles');
  });
});
