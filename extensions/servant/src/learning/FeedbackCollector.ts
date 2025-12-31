import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { AIPerformanceMetrics } from './AIEvaluator';
import { AIAction } from './AIActionTracker';

/**
 * AI処理のフィードバック情報
 */
export interface AIFeedback {
  /** 良かった点 */
  strengths: string[];
  /** 悪かった点 */
  weaknesses: string[];
  /** 改善提案 */
  improvements: string[];
  /** 警告メッセージ */
  warnings: string[];
  /** 推奨アクション */
  recommendedActions: string[];
}

/**
 * パターン分析結果
 */
interface PatternAnalysis {
  failurePatterns: string[];
  successPatterns: string[];
  riskAreas: string[];
}

/**
 * AI処理のフィードバック収集システム
 */
export class FeedbackCollector {
  private workspaceRoot: string;
  private feedbackPath: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.feedbackPath = path.join(workspaceRoot, '.vscode', 'ai-feedback.json');
  }

  /**
   * 評価結果とアクション履歴からフィードバックを生成
   */
  public collectFeedback(
    metrics: AIPerformanceMetrics,
    actions: AIAction[]
  ): AIFeedback {
    const feedback: AIFeedback = {
      strengths: [],
      weaknesses: [],
      improvements: [],
      warnings: [],
      recommendedActions: []
    };

    // 総合スコア評価
    this.evaluateOverallScore(metrics, feedback);

    // タスク完了率評価
    this.evaluateTaskCompletion(metrics, feedback);

    // 違反率評価
    this.evaluateViolationRate(metrics, feedback);

    // コード品質評価
    this.evaluateCodeQuality(metrics, feedback);

    // 効率性評価
    this.evaluateEfficiency(metrics, feedback);

    // パターン分析
    const patterns = this.analyzePatterns(actions);
    this.addPatternFeedback(patterns, feedback);

    console.log('📊 [FeedbackCollector] Feedback generated:', feedback);
    return feedback;
  }

  /**
   * 総合スコア評価
   */
  private evaluateOverallScore(
    metrics: AIPerformanceMetrics,
    feedback: AIFeedback
  ): void {
    if (metrics.overallScore >= 80) {
      feedback.strengths.push('AI処理の総合スコアが優秀です（80点以上）');
    } else if (metrics.overallScore >= 60) {
      feedback.weaknesses.push('AI処理の総合スコアが中程度です（60-80点）');
      feedback.improvements.push('各メトリクスを改善して総合スコアを向上させましょう');
    } else {
      feedback.weaknesses.push('AI処理の総合スコアが低下しています（60点未満）');
      feedback.warnings.push('⚠️ AI処理品質が大幅に低下しています');
      feedback.recommendedActions.push('詳細な分析を行い、問題の原因を特定してください');
    }
  }

  /**
   * タスク完了率評価
   */
  private evaluateTaskCompletion(
    metrics: AIPerformanceMetrics,
    feedback: AIFeedback
  ): void {
    if (metrics.taskCompletionRate >= 90) {
      feedback.strengths.push(`タスク完了率が優秀です（${metrics.taskCompletionRate}%）`);
    } else if (metrics.taskCompletionRate >= 70) {
      feedback.weaknesses.push(`タスク完了率が中程度です（${metrics.taskCompletionRate}%）`);
    } else {
      feedback.weaknesses.push(`タスク完了率が低いです（${metrics.taskCompletionRate}%）`);
      feedback.warnings.push('⚠️ AIが頻繁に失敗しています');
      feedback.improvements.push('タスクの複雑度を下げるか、コンテキスト情報を増やしましょう');
      feedback.recommendedActions.push('失敗したタスクのパターンを分析してください');
    }
  }

  /**
   * 違反率評価
   */
  private evaluateViolationRate(
    metrics: AIPerformanceMetrics,
    feedback: AIFeedback
  ): void {
    if (metrics.violationRate <= 5) {
      feedback.strengths.push(`違反発生率が低いです（${metrics.violationRate}%）`);
    } else if (metrics.violationRate <= 20) {
      feedback.weaknesses.push(`違反発生率がやや高いです（${metrics.violationRate}%）`);
      feedback.improvements.push('Instructions の遵守を強化しましょう');
    } else {
      feedback.weaknesses.push(`違反発生率が高いです（${metrics.violationRate}%）`);
      feedback.warnings.push('⚠️ AIが頻繁にルールを違反しています');
      feedback.improvements.push('適応学習システムでパターンを学習させましょう');
      feedback.recommendedActions.push('頻発する違反パターンをInstructionsに追加してください');
    }
  }

  /**
   * コード品質評価
   */
  private evaluateCodeQuality(
    metrics: AIPerformanceMetrics,
    feedback: AIFeedback
  ): void {
    if (metrics.codeQualityScore >= 80) {
      feedback.strengths.push(`コード品質が優秀です（${metrics.codeQualityScore}点）`);
    } else if (metrics.codeQualityScore >= 60) {
      feedback.weaknesses.push(`コード品質が中程度です（${metrics.codeQualityScore}点）`);
      feedback.improvements.push('コンパイルエラーや違反を減らしましょう');
    } else {
      feedback.weaknesses.push(`コード品質が低いです（${metrics.codeQualityScore}点）`);
      feedback.warnings.push('⚠️ AIが生成するコードの品質が低下しています');
      feedback.improvements.push('テストカバレッジを向上させ、品質を監視しましょう');
      feedback.recommendedActions.push('コード生成のプロンプトを見直してください');
    }
  }

  /**
   * 効率性評価
   */
  private evaluateEfficiency(
    metrics: AIPerformanceMetrics,
    feedback: AIFeedback
  ): void {
    if (metrics.efficiencyScore >= 80) {
      feedback.strengths.push(`効率性が優秀です（${metrics.efficiencyScore}点）`);
    } else if (metrics.efficiencyScore >= 60) {
      feedback.weaknesses.push(`効率性が中程度です（${metrics.efficiencyScore}点）`);
      feedback.improvements.push('タスク実行時間を短縮しましょう');
    } else {
      feedback.weaknesses.push(`効率性が低いです（${metrics.efficiencyScore}点）`);
      feedback.warnings.push('⚠️ AIが同じファイルを繰り返し変更しています');
      feedback.improvements.push('タスクの分割や計画を改善しましょう');
      feedback.recommendedActions.push('振動（繰り返し変更）を減らすため、一度に完了させる方針を検討してください');
    }
  }

  /**
   * パターン分析
   */
  private analyzePatterns(actions: AIAction[]): PatternAnalysis {
    const failurePatterns: string[] = [];
    const successPatterns: string[] = [];
    const riskAreas: string[] = [];

    // 失敗パターン抽出
    const failedActions = actions.filter(a => !a.success);
    if (failedActions.length > 0) {
      const failureTypes = this.countByType(failedActions);
      for (const [type, count] of Object.entries(failureTypes)) {
        if (count >= 2) {
          failurePatterns.push(`${type}タスクで頻繁に失敗（${count}回）`);
        }
      }
    }

    // 成功パターン抽出
    const successActions = actions.filter(a => a.success && a.violations === 0);
    if (successActions.length > 0) {
      const successTypes = this.countByType(successActions);
      for (const [type, count] of Object.entries(successTypes)) {
        if (count >= 3) {
          successPatterns.push(`${type}タスクで安定した成功（${count}回）`);
        }
      }
    }

    // リスクエリア検出
    const fileFrequency = new Map<string, number>();
    for (const action of actions) {
      for (const file of action.changedFiles) {
        fileFrequency.set(file, (fileFrequency.get(file) || 0) + 1);
      }
    }

    for (const [file, count] of fileFrequency) {
      if (count >= 5) {
        riskAreas.push(`${file} が頻繁に変更されています（${count}回）`);
      }
    }

    return { failurePatterns, successPatterns, riskAreas };
  }

  /**
   * タスク種別ごとのカウント
   */
  private countByType(actions: AIAction[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const action of actions) {
      counts[action.type] = (counts[action.type] || 0) + 1;
    }
    return counts;
  }

  /**
   * パターン分析をフィードバックに追加
   */
  private addPatternFeedback(
    patterns: PatternAnalysis,
    feedback: AIFeedback
  ): void {
    // 失敗パターン
    for (const pattern of patterns.failurePatterns) {
      feedback.weaknesses.push(pattern);
      feedback.improvements.push(`${pattern}の原因を分析し、対策を講じましょう`);
    }

    // 成功パターン
    for (const pattern of patterns.successPatterns) {
      feedback.strengths.push(pattern);
    }

    // リスクエリア
    for (const risk of patterns.riskAreas) {
      feedback.warnings.push(`⚠️ ${risk}`);
      feedback.recommendedActions.push(`頻繁に変更されるファイルをレビューしてください`);
    }
  }

  /**
   * フィードバックを保存
   */
  public async saveFeedback(feedback: AIFeedback): Promise<void> {
    try {
      const dir = path.dirname(this.feedbackPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = {
        feedback,
        timestamp: new Date().toISOString()
      };

      fs.writeFileSync(this.feedbackPath, JSON.stringify(data, null, 2), 'utf-8');
      console.log('💾 [FeedbackCollector] Feedback saved to:', this.feedbackPath);
    } catch (error) {
      console.error('❌ [FeedbackCollector] Failed to save feedback:', error);
    }
  }

  /**
   * 最新のフィードバックを取得
   */
  public getLatestFeedback(): AIFeedback | null {
    try {
      if (!fs.existsSync(this.feedbackPath)) {
        return null;
      }
      const data = fs.readFileSync(this.feedbackPath, 'utf-8');
      const parsed = JSON.parse(data);
      return parsed.feedback;
    } catch (error) {
      console.error('❌ [FeedbackCollector] Failed to load feedback:', error);
      return null;
    }
  }

  /**
   * フィードバックを表示
   */
  public showFeedback(feedback: AIFeedback, outputChannel: vscode.OutputChannel): void {
    outputChannel.clear();
    outputChannel.appendLine('=== AI Feedback Report ===');
    outputChannel.appendLine('');

    if (feedback.strengths.length > 0) {
      outputChannel.appendLine('✅ 強み:');
      feedback.strengths.forEach(s => outputChannel.appendLine(`  - ${s}`));
      outputChannel.appendLine('');
    }

    if (feedback.weaknesses.length > 0) {
      outputChannel.appendLine('⚠️  弱点:');
      feedback.weaknesses.forEach(w => outputChannel.appendLine(`  - ${w}`));
      outputChannel.appendLine('');
    }

    if (feedback.improvements.length > 0) {
      outputChannel.appendLine('💡 改善提案:');
      feedback.improvements.forEach(i => outputChannel.appendLine(`  - ${i}`));
      outputChannel.appendLine('');
    }

    if (feedback.warnings.length > 0) {
      outputChannel.appendLine('⚠️  警告:');
      feedback.warnings.forEach(w => outputChannel.appendLine(`  - ${w}`));
      outputChannel.appendLine('');
    }

    if (feedback.recommendedActions.length > 0) {
      outputChannel.appendLine('🎯 推奨アクション:');
      feedback.recommendedActions.forEach(a => outputChannel.appendLine(`  - ${a}`));
    }

    outputChannel.show();
  }
}
