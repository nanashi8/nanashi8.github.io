import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkflowLearner } from '../src/neural/WorkflowLearner';
import { OptimizationEngine, TaskState } from '../src/neural/OptimizationEngine';
import { NeuralDependencyGraph } from '../src/neural/NeuralDependencyGraph';
import { NeuralLearningEngine } from '../src/neural/NeuralLearningEngine';
import * as fs from 'fs';

// fsとsimple-gitモックを準備
vi.mock('fs');
vi.mock('simple-git', () => ({
  simpleGit: vi.fn(() => ({
    log: vi.fn().mockResolvedValue({ all: [] }),
    show: vi.fn().mockResolvedValue('')
  }))
}));

describe('WorkflowLearner', () => {
  let learner: WorkflowLearner;
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
    learner = new WorkflowLearner(engine, workspaceRoot);
  });

  it('タスク分類が正しく動作する - bug-fix', () => {
    const classification = learner['classifyCommit']({
      hash: 'abc123',
      message: 'fix: memory leak in parser',
      files: ['src/parser.ts'],
      timestamp: new Date(),
      success: true
    });

    expect(classification.taskType).toBe('bug-fix');
    expect(classification.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('タスク分類が正しく動作する - test', () => {
    const classification = learner['classifyCommit']({
      hash: 'def456',
      message: 'add unit tests for validator',
      files: ['tests/validator.test.ts'],
      timestamp: new Date(),
      success: true
    });

    expect(classification.taskType).toBe('test');
    expect(classification.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('タスク分類が正しく動作する - docs', () => {
    const classification = learner['classifyCommit']({
      hash: 'ghi789',
      message: 'update README',
      files: ['README.md'],
      timestamp: new Date(),
      success: true
    });

    expect(classification.taskType).toBe('docs');
    expect(classification.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('タスク分類が正しく動作する - feature', () => {
    const classification = learner['classifyCommit']({
      hash: 'jkl012',
      message: 'feat: add dark mode support',
      files: ['src/theme.ts', 'src/ui.ts'],
      timestamp: new Date(),
      success: true
    });

    expect(classification.taskType).toBe('feature');
    expect(classification.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('タスク分類が正しく動作する - refactor', () => {
    const classification = learner['classifyCommit']({
      hash: 'mno345',
      message: 'refactor: simplify error handling',
      files: ['src/errors.ts'],
      timestamp: new Date(),
      success: true
    });

    expect(classification.taskType).toBe('refactor');
    expect(classification.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('タスク分類が正しく動作する - unknown', () => {
    const classification = learner['classifyCommit']({
      hash: 'pqr678',
      message: 'update dependencies',
      files: ['package.json'],
      timestamp: new Date(),
      success: true
    });

    expect(classification.taskType).toBe('unknown');
    expect(classification.confidence).toBeLessThanOrEqual(0.6);
  });

  it('現在のタスクを分類できる - test', async () => {
    const taskState: TaskState = {
      taskType: 'unknown',
      modifiedFiles: ['tests/parser.test.ts', 'tests/validator.test.ts'],
      startTime: new Date()
    };

    const classification = await learner.classifyCurrentTask(taskState);

    expect(classification.taskType).toBe('test');
    expect(classification.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('現在のタスクを分類できる - docs', async () => {
    const taskState: TaskState = {
      taskType: 'unknown',
      modifiedFiles: ['README.md', 'CONTRIBUTING.md'],
      startTime: new Date()
    };

    const classification = await learner.classifyCurrentTask(taskState);

    expect(classification.taskType).toBe('docs');
    expect(classification.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('ワークフロー提案が生成される', async () => {
    const taskState: TaskState = {
      taskType: 'bug-fix',
      modifiedFiles: ['src/parser.ts'],
      startTime: new Date()
    };

    const result = await learner.suggestWorkflow(taskState);

    expect(result.classification.taskType).toBe('bug-fix');
    expect(result.recommendation).toBeTruthy();
    expect(result.steps).toBeInstanceOf(Array);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('統計情報を取得できる', () => {
    const stats = learner.getStats();

    expect(stats).toHaveProperty('totalCommits');
    expect(stats).toHaveProperty('taskTypeDistribution');
    expect(stats).toHaveProperty('avgSuccessRate');
  });

  it('Git履歴から学習できる', async () => {
    // Git履歴がない場合でもエラーにならないことを確認
    await expect(learner.learnFromGitHistory(10)).resolves.not.toThrow();
  });

  it('ワークフロー推奨が各タスク種別で生成される', async () => {
    const taskTypes: Array<'bug-fix' | 'feature' | 'refactor' | 'test' | 'docs'> = [
      'bug-fix',
      'feature',
      'refactor',
      'test',
      'docs'
    ];

    for (const taskType of taskTypes) {
      // taskTypeに応じてファイルパスを変更
      let modifiedFiles: string[];
      if (taskType === 'test') {
        modifiedFiles = ['tests/test.ts']; // testはテストファイル
      } else if (taskType === 'docs') {
        modifiedFiles = ['README.md']; // docsはMarkdownファイル
      } else {
        modifiedFiles = ['src/test.ts']; // それ以外はソースファイル
      }

      const taskState: TaskState = {
        taskType,
        modifiedFiles,
        startTime: new Date()
      };

      const result = await learner.suggestWorkflow(taskState);

      expect(result.recommendation).toBeTruthy();
      expect(result.steps.length).toBeGreaterThan(0);
      // 分類結果は入力のtaskTypeまたは推測された結果のいずれか
      expect(result.classification.taskType).toBeDefined();
    }
  });
});
