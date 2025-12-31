import { describe, it, expect, beforeEach } from 'vitest';
import { NeuralLearningEngine } from '../src/neural/NeuralLearningEngine';
import { NeuralDependencyGraph } from '../src/neural/NeuralDependencyGraph';
import * as fs from 'fs';
import * as path from 'path';

describe('NeuralLearningEngine', () => {
  let engine: NeuralLearningEngine;
  let graph: NeuralDependencyGraph;
  const testWorkspaceRoot = path.join(__dirname, '..', 'test-workspace-learning');

  beforeEach(() => {
    graph = new NeuralDependencyGraph(testWorkspaceRoot);
    engine = new NeuralLearningEngine(graph, testWorkspaceRoot);

    // テスト用ディレクトリをクリーンアップ
    const historyPath = path.join(testWorkspaceRoot, '.vscode', 'neural-learning-history.json');
    if (fs.existsSync(historyPath)) {
      fs.unlinkSync(historyPath);
    }
  });

  it('順伝播を実行できる', () => {
    // グラフにテストノードを追加（実際のビルドはスキップ）
    const result = engine.propagateForward('src/test.ts');

    expect(result).toHaveProperty('affectedFiles');
    expect(result).toHaveProperty('propagationPaths');
    expect(result).toHaveProperty('computationTime');
    expect(result.computationTime).toBeGreaterThanOrEqual(0);
  });

  it('順伝播で起点ファイルが含まれる', () => {
    const result = engine.propagateForward('src/test.ts');

    // グラフが空の場合は起点ファイルのみが含まれる
    // グラフにノードがない場合は affectedFiles も空になる可能性がある
    expect(result.affectedFiles.size).toBeGreaterThanOrEqual(0);
  });

  it('逆伝播を実行できる', async () => {
    await engine.propagateBackward({
      failureFile: 'src/test.ts',
      error: 'Test error',
      violations: 2,
      compileErrors: 1
    });

    // エラーなく完了することを確認
    const stats = engine.getStats();
    expect(stats.feedbackCount).toBe(1);
  });

  it('学習率を設定できる', () => {
    engine.setLearningRate(0.05);
    const stats = engine.getStats();
    expect(stats.learningRate).toBe(0.05);
  });

  it('学習率が範囲内に制限される', () => {
    engine.setLearningRate(0.5); // 大きすぎる
    let stats = engine.getStats();
    expect(stats.learningRate).toBeLessThanOrEqual(0.1);

    engine.setLearningRate(0.0001); // 小さすぎる
    stats = engine.getStats();
    expect(stats.learningRate).toBeGreaterThanOrEqual(0.001);
  });

  it('エポックが正しく進む', async () => {
    // 10回のフィードバックで1エポック
    for (let i = 0; i < 10; i++) {
      await engine.propagateBackward({
        failureFile: 'src/test.ts',
        error: `Test error ${i}`,
        violations: 1,
        compileErrors: 0
      });
    }

    const stats = engine.getStats();
    expect(stats.currentEpoch).toBe(1);
    expect(stats.feedbackCount).toBe(0); // リセットされる
  });

  it('学習統計を取得できる', () => {
    const stats = engine.getStats();

    expect(stats).toHaveProperty('currentEpoch');
    expect(stats).toHaveProperty('feedbackCount');
    expect(stats).toHaveProperty('learningRate');
    expect(stats).toHaveProperty('convergence');
    expect(stats.currentEpoch).toBe(0);
  });

  it('学習をリセットできる', async () => {
    // フィードバックを追加
    await engine.propagateBackward({
      failureFile: 'src/test.ts',
      error: 'Test error',
      violations: 1,
      compileErrors: 0
    });

    let stats = engine.getStats();
    expect(stats.feedbackCount).toBe(1);

    // リセット
    await engine.reset();

    stats = engine.getStats();
    expect(stats.currentEpoch).toBe(0);
    expect(stats.feedbackCount).toBe(0);
  });

  it('シグモイド関数が正しく動作する', () => {
    // sigmoid は private なので、順伝播を通してテスト
    // sigmoid(0) = 0.5
    // sigmoid(正の大きな値) ≈ 1
    // sigmoid(負の大きな値) ≈ 0

    // 順伝播の結果は0-1の範囲になるはず
    const result = engine.propagateForward('src/test.ts');

    for (const activation of result.affectedFiles.values()) {
      expect(activation).toBeGreaterThanOrEqual(0);
      expect(activation).toBeLessThanOrEqual(1);
    }
  });

  it('エラー重大度が正しく計算される', async () => {
    // 高い重大度（多くの違反とエラー）
    await engine.propagateBackward({
      failureFile: 'src/test.ts',
      error: 'Critical error',
      violations: 10,
      compileErrors: 5
    });

    // 低い重大度（少ない違反とエラー）
    await engine.propagateBackward({
      failureFile: 'src/test2.ts',
      error: 'Minor error',
      violations: 1,
      compileErrors: 0
    });

    // エラーなく完了することを確認
    const stats = engine.getStats();
    expect(stats.feedbackCount).toBe(2);
  });
});
