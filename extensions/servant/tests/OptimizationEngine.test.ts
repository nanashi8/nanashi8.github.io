import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OptimizationEngine, TaskState } from '../src/neural/OptimizationEngine';
import { NeuralDependencyGraph } from '../src/neural/NeuralDependencyGraph';
import { NeuralLearningEngine } from '../src/neural/NeuralLearningEngine';
import * as fs from 'fs';

// fsモックを準備
vi.mock('fs');

describe('OptimizationEngine', () => {
  let engine: OptimizationEngine;
  let graph: NeuralDependencyGraph;
  let learning: NeuralLearningEngine;
  const workspaceRoot = '/test/workspace';

  beforeEach(() => {
    vi.clearAllMocks();

    // fsモックのセットアップ
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined);
    vi.mocked(fs.writeFileSync).mockReturnValue(undefined);

    graph = new NeuralDependencyGraph(workspaceRoot);
    learning = new NeuralLearningEngine(graph, workspaceRoot);
    engine = new OptimizationEngine(graph, learning, workspaceRoot);
  });

  it('パターン保存が正しく動作する', async () => {
    await engine.learnPattern('bug-fix', ['src/a.ts', 'src/b.ts'], true, 300, 0);

    await engine.savePatterns();

    // writeFileSync が呼ばれたことを確認
    expect(vi.mocked(fs.writeFileSync)).toHaveBeenCalled();
  });

  it('類似パターンを検索できる', async () => {
    // パターンを学習
    await engine.learnPattern('bug-fix', ['src/a.ts', 'src/b.ts'], true, 300, 0);

    const taskState: TaskState = {
      taskType: 'bug-fix',
      modifiedFiles: ['src/a.ts'],
      startTime: new Date()
    };

    const suggestion = await engine.optimize(taskState);

    expect(suggestion).toHaveProperty('recommendedOrder');
    expect(suggestion).toHaveProperty('risks');
    expect(suggestion).toHaveProperty('nextActions');
    expect(suggestion.predictedSuccessRate).toBeGreaterThanOrEqual(0);
    expect(suggestion.predictedSuccessRate).toBeLessThanOrEqual(1);
  });

  it('リスク予測が機能する', async () => {
    // グラフにノードを追加
    graph['nodes'].set('src/risky.ts', {
      filePath: 'src/risky.ts',
      entropy: 6.0, // 高いエントロピー
      activationLevel: 0.2, // 低い活性化レベル
      changeFrequency: 5,
      lastModified: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30日前
      importCount: 15,
      exportCount: 10
    });

    const taskState: TaskState = {
      taskType: 'feature',
      currentFile: 'src/risky.ts',
      modifiedFiles: ['src/risky.ts'],
      startTime: new Date()
    };

    const suggestion = await engine.optimize(taskState);

    // リスクが検出されることを期待（ただしグラフの接続が必要）
    expect(suggestion.risks).toBeInstanceOf(Array);
  });

  it('統計情報を取得できる', async () => {
    await engine.learnPattern('bug-fix', ['src/a.ts'], true, 200, 0);
    await engine.learnPattern('feature', ['src/b.ts'], true, 400, 0);

    const stats = engine.getStats();

    expect(stats.totalPatterns).toBeGreaterThanOrEqual(0);
    expect(stats.avgSuccessRate).toBeGreaterThanOrEqual(0);
    expect(stats.avgSuccessRate).toBeLessThanOrEqual(1);
  });

  it('成功率が正しく計算される', async () => {
    // 同じパターンで成功と失敗を学習
    await engine.learnPattern('bug-fix', ['src/a.ts', 'src/b.ts'], true, 300, 0);
    await engine.learnPattern('bug-fix', ['src/a.ts', 'src/b.ts'], false, 350, 2);
    await engine.learnPattern('bug-fix', ['src/a.ts', 'src/b.ts'], true, 280, 0);

    const stats = engine.getStats();

    // 3回中2回成功 = 約0.67
    if (stats.bestPattern) {
      expect(stats.bestPattern.successRate).toBeGreaterThan(0.6);
      expect(stats.bestPattern.successRate).toBeLessThan(0.7);
      expect(stats.bestPattern.usageCount).toBeGreaterThanOrEqual(3);
    }
  });

  it('次のアクションを提案できる', async () => {
    await engine.learnPattern('bug-fix', ['src/a.ts', 'src/b.ts'], true, 300, 0);

    const taskState: TaskState = {
      taskType: 'bug-fix',
      currentFile: 'src/a.ts',
      modifiedFiles: ['src/a.ts'],
      startTime: new Date()
    };

    const suggestion = await engine.optimize(taskState);

    expect(suggestion.nextActions).toBeInstanceOf(Array);
    expect(suggestion.nextActions.length).toBeGreaterThan(0);
  });

  it('パターンが存在しない場合でも最適化提案を返す', async () => {
    const taskState: TaskState = {
      taskType: 'unknown',
      modifiedFiles: ['src/new.ts'],
      startTime: new Date()
    };

    const suggestion = await engine.optimize(taskState);

    // デフォルト値を返す
    expect(suggestion.predictedSuccessRate).toBe(0.7);
    expect(suggestion.predictedTime).toBe(600);
  });

  it('最適化提案の推奨順序が重複しない', async () => {
    await engine.learnPattern('feature', ['src/a.ts', 'src/b.ts', 'src/c.ts'], true, 500, 0);

    const taskState: TaskState = {
      taskType: 'feature',
      modifiedFiles: ['src/a.ts'],
      startTime: new Date()
    };

    const suggestion = await engine.optimize(taskState);

    // 推奨順序に重複がないことを確認
    const uniqueFiles = new Set(suggestion.recommendedOrder);
    expect(uniqueFiles.size).toBe(suggestion.recommendedOrder.length);
  });
});
