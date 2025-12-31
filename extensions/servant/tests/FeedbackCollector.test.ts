import { describe, it, expect, beforeEach } from 'vitest';
import { FeedbackCollector } from '../src/learning/FeedbackCollector';
import { AIPerformanceMetrics } from '../src/learning/AIEvaluator';
import { AIAction } from '../src/learning/AIActionTracker';
import * as fs from 'fs';
import * as path from 'path';

describe('FeedbackCollector', () => {
  let collector: FeedbackCollector;
  const testWorkspaceRoot = path.join(__dirname, '..', 'test-workspace-feedback');

  beforeEach(() => {
    collector = new FeedbackCollector(testWorkspaceRoot);

    // テスト用ディレクトリをクリーンアップ
    const feedbackPath = path.join(testWorkspaceRoot, '.vscode', 'ai-feedback.json');
    if (fs.existsSync(feedbackPath)) {
      fs.unlinkSync(feedbackPath);
    }
  });

  it('高スコアのメトリクスから強みを抽出できる', () => {
    const metrics: AIPerformanceMetrics = {
      taskCompletionRate: 95,
      violationRate: 3,
      codeQualityScore: 85,
      efficiencyScore: 90,
      overallScore: 90,
      timestamp: new Date().toISOString(),
      actionsEvaluated: 10
    };

    const actions: AIAction[] = [
      createMockAction({ success: true })
    ];

    const feedback = collector.collectFeedback(metrics, actions);

    expect(feedback.strengths.length).toBeGreaterThan(0);
    expect(feedback.strengths.some(s => s.includes('優秀'))).toBe(true);
  });

  it('低スコアのメトリクスから弱点を抽出できる', () => {
    const metrics: AIPerformanceMetrics = {
      taskCompletionRate: 40,
      violationRate: 30,
      codeQualityScore: 45,
      efficiencyScore: 50,
      overallScore: 40,
      timestamp: new Date().toISOString(),
      actionsEvaluated: 10
    };

    const actions: AIAction[] = [
      createMockAction({ success: false }),
      createMockAction({ success: false })
    ];

    const feedback = collector.collectFeedback(metrics, actions);

    expect(feedback.weaknesses.length).toBeGreaterThan(0);
    expect(feedback.warnings.length).toBeGreaterThan(0);
    expect(feedback.improvements.length).toBeGreaterThan(0);
  });

  it('改善提案を生成できる', () => {
    const metrics: AIPerformanceMetrics = {
      taskCompletionRate: 60,
      violationRate: 15,
      codeQualityScore: 65,
      efficiencyScore: 70,
      overallScore: 65,
      timestamp: new Date().toISOString(),
      actionsEvaluated: 10
    };

    const actions: AIAction[] = [
      createMockAction({ success: true, violations: 2 }),
      createMockAction({ success: false, violations: 1 })
    ];

    const feedback = collector.collectFeedback(metrics, actions);

    expect(feedback.improvements.length).toBeGreaterThan(0);
  });

  it('失敗パターンを検出できる', () => {
    const actions: AIAction[] = [
      createMockAction({ success: false, type: 'bug-fix' }),
      createMockAction({ success: false, type: 'bug-fix' }),
      createMockAction({ success: true, type: 'feature' })
    ];

    const metrics: AIPerformanceMetrics = {
      taskCompletionRate: 33,
      violationRate: 0,
      codeQualityScore: 80,
      efficiencyScore: 80,
      overallScore: 60,
      timestamp: new Date().toISOString(),
      actionsEvaluated: 3
    };

    const feedback = collector.collectFeedback(metrics, actions);

    // bug-fixで頻繁に失敗
    expect(feedback.weaknesses.some(w => w.includes('bug-fix'))).toBe(true);
  });

  it('頻繁に変更されるファイルをリスクとして検出できる', () => {
    const actions: AIAction[] = [
      createMockAction({ changedFiles: ['file1.ts'] }),
      createMockAction({ changedFiles: ['file1.ts'] }),
      createMockAction({ changedFiles: ['file1.ts'] }),
      createMockAction({ changedFiles: ['file1.ts'] }),
      createMockAction({ changedFiles: ['file1.ts'] })
    ];

    const metrics: AIPerformanceMetrics = {
      taskCompletionRate: 100,
      violationRate: 0,
      codeQualityScore: 80,
      efficiencyScore: 80,
      overallScore: 85,
      timestamp: new Date().toISOString(),
      actionsEvaluated: 5
    };

    const feedback = collector.collectFeedback(metrics, actions);

    // file1.tsが頻繁に変更されている
    expect(feedback.warnings.some(w => w.includes('file1.ts'))).toBe(true);
  });

  it('フィードバックを保存できる', async () => {
    const metrics: AIPerformanceMetrics = {
      taskCompletionRate: 80,
      violationRate: 5,
      codeQualityScore: 75,
      efficiencyScore: 80,
      overallScore: 78,
      timestamp: new Date().toISOString(),
      actionsEvaluated: 5
    };

    const actions: AIAction[] = [
      createMockAction({ success: true })
    ];

    const feedback = collector.collectFeedback(metrics, actions);
    await collector.saveFeedback(feedback);

    const loaded = collector.getLatestFeedback();
    expect(loaded).not.toBeNull();
    expect(loaded!.strengths.length).toBeGreaterThan(0);
  });

  it('推奨アクションを生成できる', () => {
    const metrics: AIPerformanceMetrics = {
      taskCompletionRate: 30,
      violationRate: 40,
      codeQualityScore: 40,
      efficiencyScore: 35,
      overallScore: 35,
      timestamp: new Date().toISOString(),
      actionsEvaluated: 10
    };

    const actions: AIAction[] = [
      createMockAction({ success: false, violations: 5, compileErrors: 3 })
    ];

    const feedback = collector.collectFeedback(metrics, actions);

    expect(feedback.recommendedActions.length).toBeGreaterThan(0);
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
