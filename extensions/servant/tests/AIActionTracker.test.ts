import { describe, it, expect, beforeEach } from 'vitest';
import { AIActionTracker } from '../src/learning/AIActionTracker';
import * as path from 'path';
import * as fs from 'fs';

describe('AIActionTracker', () => {
  let tracker: AIActionTracker;
  let testWorkspaceRoot: string;
  let logPath: string;

  beforeEach(() => {
    testWorkspaceRoot = path.join(__dirname, '..');
    logPath = path.join(testWorkspaceRoot, '.vscode', 'ai-action-log.json');

    // Clean up existing log
    if (fs.existsSync(logPath)) {
      fs.unlinkSync(logPath);
    }

    tracker = new AIActionTracker(testWorkspaceRoot);
  });

  it('AI処理を開始できる', () => {
    const actionId = tracker.startAction('bug-fix');

    expect(actionId).toBeDefined();
    expect(actionId).toMatch(/^action-/);
  });

  it('AI処理を記録できる', async () => {
    tracker.startAction('feature');

    await tracker.endAction({
      success: true,
      compileErrors: 0,
      violations: 0
    });

    const stats = tracker.getStats();
    expect(stats.totalActions).toBe(1);
    expect(stats.successRate).toBe(1);
  });

  it('失敗したAI処理を記録できる', async () => {
    tracker.startAction('refactor');

    await tracker.endAction({
      success: false,
      error: 'Type error',
      compileErrors: 3,
      violations: 2
    });

    const stats = tracker.getStats();
    expect(stats.totalActions).toBe(1);
    expect(stats.successRate).toBe(0);
    expect(stats.avgCompileErrors).toBe(3);
    expect(stats.avgViolations).toBe(2);
  });

  it('タスク種別を推定できる', () => {
    expect(tracker.inferTaskType({
      commitMessage: 'fix: bug in auth'
    })).toBe('bug-fix');

    expect(tracker.inferTaskType({
      branchName: 'feature/new-login'
    })).toBe('feature');

    expect(tracker.inferTaskType({
      files: ['src/utils.test.ts']
    })).toBe('test');
  });

  it('統計情報を取得できる', async () => {
    // 複数のアクションを記録
    tracker.startAction('bug-fix');
    await tracker.endAction({ success: true, compileErrors: 0, violations: 0 });

    tracker.startAction('feature');
    await tracker.endAction({ success: false, compileErrors: 2, violations: 1 });

    tracker.startAction('refactor');
    await tracker.endAction({ success: true, compileErrors: 0, violations: 0 });

    const stats = tracker.getStats();

    expect(stats.totalActions).toBe(3);
    expect(stats.successRate).toBeCloseTo(2/3);
    expect(stats.typeDistribution['bug-fix']).toBe(1);
    expect(stats.typeDistribution['feature']).toBe(1);
    expect(stats.typeDistribution['refactor']).toBe(1);
  });

  it('直近のアクションを取得できる', async () => {
    // 5件のアクションを記録
    for (let i = 0; i < 5; i++) {
      tracker.startAction('test');
      await tracker.endAction({ success: true, compileErrors: 0, violations: 0 });
    }

    const recent = tracker.getRecentActions(3);
    expect(recent.length).toBe(3);
    expect(recent[0].type).toBe('test');
  });

  it('追跡データをリセットできる', async () => {
    tracker.startAction('bug-fix');
    await tracker.endAction({ success: true, compileErrors: 0, violations: 0 });

    let stats = tracker.getStats();
    expect(stats.totalActions).toBe(1);

    await tracker.reset();

    stats = tracker.getStats();
    expect(stats.totalActions).toBe(0);
  });
});
