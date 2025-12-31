import { describe, it, expect, beforeEach } from 'vitest';
import { AIEvaluator } from '../src/learning/AIEvaluator';
import { AIAction } from '../src/learning/AIActionTracker';
import * as fs from 'fs';
import * as path from 'path';

describe('AIEvaluator', () => {
  let evaluator: AIEvaluator;
  const testWorkspaceRoot = path.join(__dirname, '..', 'test-workspace-evaluator');

  beforeEach(() => {
    evaluator = new AIEvaluator(testWorkspaceRoot);

    // テスト用ディレクトリをクリーンアップ
    const historyPath = path.join(testWorkspaceRoot, '.vscode', 'ai-performance-history.json');
    if (fs.existsSync(historyPath)) {
      fs.unlinkSync(historyPath);
    }
  });

  it('タスク完了率を正しく計算できる', () => {
    const actions: AIAction[] = [
      createMockAction({ success: true }),
      createMockAction({ success: true }),
      createMockAction({ success: false }),
      createMockAction({ success: true }),
      createMockAction({ success: false })
    ];

    const metrics = evaluator.evaluate(actions);

    // 5件中3件成功 = 60%
    expect(metrics.taskCompletionRate).toBe(60);
  });

  it('違反発生率を正しく計算できる', () => {
    const actions: AIAction[] = [
      createMockAction({ violations: 0 }),
      createMockAction({ violations: 2 }),
      createMockAction({ violations: 1 }),
      createMockAction({ violations: 0 })
    ];

    const metrics = evaluator.evaluate(actions);

    // 平均 0.75違反 = 7.5%
    expect(metrics.violationRate).toBeCloseTo(7.5, 1);
  });

  it('コード品質スコアを正しく計算できる', () => {
    const actions: AIAction[] = [
      createMockAction({ linesAdded: 10, linesDeleted: 5, violations: 0, compileErrors: 0 }),
      createMockAction({ linesAdded: 20, linesDeleted: 10, violations: 1, compileErrors: 0 }),
      createMockAction({ linesAdded: 15, linesDeleted: 8, violations: 0, compileErrors: 0 })
    ];

    const metrics = evaluator.evaluate(actions);

    // 低違反、低エラーなので高スコア
    expect(metrics.codeQualityScore).toBeGreaterThan(90);
  });

  it('効率スコアを正しく計算できる', () => {
    const now = Date.now();
    const actions: AIAction[] = [
      createMockAction({
        startTime: new Date(now).toISOString(),
        endTime: new Date(now + 10000).toISOString(), // 10秒
        changedFiles: ['file1.ts', 'file2.ts']
      }),
      createMockAction({
        startTime: new Date(now + 15000).toISOString(),
        endTime: new Date(now + 25000).toISOString(), // 10秒
        changedFiles: ['file3.ts']
      })
    ];

    const metrics = evaluator.evaluate(actions);

    // 短時間、少ファイル数なので高スコア
    expect(metrics.efficiencyScore).toBeGreaterThan(80);
  });

  it('総合スコアを正しく計算できる', () => {
    const actions: AIAction[] = [
      createMockAction({
        success: true,
        violations: 0,
        compileErrors: 0,
        linesAdded: 20,
        linesDeleted: 10
      }),
      createMockAction({
        success: true,
        violations: 1,
        compileErrors: 0,
        linesAdded: 15,
        linesDeleted: 5
      })
    ];

    const metrics = evaluator.evaluate(actions);

    // 全体的に良好なので高スコア
    expect(metrics.overallScore).toBeGreaterThan(80);
  });

  it('空のアクションリストでも正しく動作する', () => {
    const metrics = evaluator.evaluate([]);

    expect(metrics.taskCompletionRate).toBe(0);
    expect(metrics.violationRate).toBe(0);
    expect(metrics.codeQualityScore).toBe(0);
    expect(metrics.efficiencyScore).toBe(0);
    expect(metrics.overallScore).toBe(0);
    expect(metrics.actionsEvaluated).toBe(0);
  });

  it('評価結果を保存できる', async () => {
    const actions: AIAction[] = [
      createMockAction({ success: true })
    ];

    const metrics = evaluator.evaluate(actions);
    await evaluator.saveMetrics(metrics);

    const history = evaluator.getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].taskCompletionRate).toBe(100);
  });

  it('最新のメトリクスを取得できる', async () => {
    const actions1: AIAction[] = [createMockAction({ success: true })];
    const actions2: AIAction[] = [createMockAction({ success: false })];

    const metrics1 = evaluator.evaluate(actions1);
    const metrics2 = evaluator.evaluate(actions2);

    await evaluator.saveMetrics(metrics1);
    await evaluator.saveMetrics(metrics2);

    const latest = evaluator.getLatestMetrics();
    expect(latest).not.toBeNull();
    expect(latest!.taskCompletionRate).toBe(0); // 最新は失敗
  });

  it('メトリクスの推移を取得できる', async () => {
    for (let i = 0; i < 15; i++) {
      const actions: AIAction[] = [createMockAction({ success: i % 2 === 0 })];
      const metrics = evaluator.evaluate(actions);
      await evaluator.saveMetrics(metrics);
    }

    const trend = evaluator.getTrend(5);
    expect(trend).toHaveLength(5);
  });

  it('振動（同じファイルの繰り返し変更）を検出できる', () => {
    const now = Date.now();
    const actions: AIAction[] = [
      createMockAction({
        startTime: new Date(now).toISOString(),
        endTime: new Date(now + 10000).toISOString(),
        changedFiles: ['file1.ts']
      }),
      createMockAction({
        startTime: new Date(now + 60000).toISOString(), // 1分後
        endTime: new Date(now + 70000).toISOString(),
        changedFiles: ['file1.ts']
      }),
      createMockAction({
        startTime: new Date(now + 120000).toISOString(), // 2分後
        endTime: new Date(now + 130000).toISOString(),
        changedFiles: ['file1.ts']
      })
    ];

    const metrics = evaluator.evaluate(actions);

    // 振動が検出されるので効率スコアが減少（100点満点ではない）
    expect(metrics.efficiencyScore).toBeLessThan(100);
  });
});

/**
 * モックAIActionを作成
 */
function createMockAction(overrides: Partial<AIAction> = {}): AIAction {
  const id = `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  return {
    id,
    type: 'bug-fix',
    startTime: now,
    endTime: new Date(Date.now() + 1000).toISOString(),
    changedFiles: ['test.ts'],
    linesAdded: 10,
    linesDeleted: 5,
    success: true,
    compileErrors: 0,
    violations: 0,
    ...overrides
  };
}
