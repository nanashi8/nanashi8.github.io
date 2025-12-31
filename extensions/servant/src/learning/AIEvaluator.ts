import * as fs from 'fs';
import * as path from 'path';
import { AIAction } from './AIActionTracker';

/**
 * AI処理のパフォーマンスメトリクス
 */
export interface AIPerformanceMetrics {
  /** タスク完了率（0-100） */
  taskCompletionRate: number;
  /** 違反発生率（0-100） */
  violationRate: number;
  /** コード品質スコア（0-100） */
  codeQualityScore: number;
  /** 効率スコア（0-100） */
  efficiencyScore: number;
  /** 総合スコア（0-100） */
  overallScore: number;
  /** 評価時刻 */
  timestamp: string;
  /** 評価対象アクション数 */
  actionsEvaluated: number;
}

/**
 * タスク完了率の詳細
 */
interface TaskCompletionDetail {
  successCount: number;
  failureCount: number;
  rate: number;
}

/**
 * コード品質の詳細
 */
interface CodeQualityDetail {
  avgLinesChanged: number;
  avgViolations: number;
  avgErrors: number;
  score: number;
}

/**
 * 効率性の詳細
 */
interface EfficiencyDetail {
  avgDuration: number;
  avgFilesPerAction: number;
  oscillationCount: number;
  score: number;
}

/**
 * AI処理の自己評価システム
 */
export class AIEvaluator {
  private workspaceRoot: string;
  private historyPath: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.historyPath = path.join(workspaceRoot, '.vscode', 'ai-performance-history.json');
  }

  /**
   * AI処理履歴を評価
   */
  public evaluate(actions: AIAction[]): AIPerformanceMetrics {
    if (actions.length === 0) {
      return this.createEmptyMetrics();
    }

    const completionDetail = this.calculateTaskCompletionRate(actions);
    const violationRate = this.calculateViolationRate(actions);
    const qualityDetail = this.calculateCodeQualityScore(actions);
    const efficiencyDetail = this.calculateEfficiencyScore(actions);

    // 総合スコア: 各メトリクスの重み付け平均
    const overallScore =
      completionDetail.rate * 0.3 +  // タスク完了率 30%
      (100 - violationRate) * 0.25 + // 違反率の逆数 25%
      qualityDetail.score * 0.25 +   // コード品質 25%
      efficiencyDetail.score * 0.2;  // 効率性 20%

    const metrics: AIPerformanceMetrics = {
      taskCompletionRate: completionDetail.rate,
      violationRate,
      codeQualityScore: qualityDetail.score,
      efficiencyScore: efficiencyDetail.score,
      overallScore: Math.round(overallScore * 10) / 10,
      timestamp: new Date().toISOString(),
      actionsEvaluated: actions.length
    };

    console.log('🎯 [AIEvaluator] Evaluation complete:', metrics);
    return metrics;
  }

  /**
   * タスク完了率を計算
   */
  private calculateTaskCompletionRate(actions: AIAction[]): TaskCompletionDetail {
    const successCount = actions.filter(a => a.success).length;
    const failureCount = actions.length - successCount;
    const rate = (successCount / actions.length) * 100;

    return {
      successCount,
      failureCount,
      rate: Math.round(rate * 10) / 10
    };
  }

  /**
   * 違反発生率を計算
   */
  private calculateViolationRate(actions: AIAction[]): number {
    const totalViolations = actions.reduce((sum, a) => sum + a.violations, 0);
    const avgViolations = totalViolations / actions.length;

    // 違反数を率に変換（0違反=0%, 10違反以上=100%）
    const rate = Math.min(avgViolations * 10, 100);
    return Math.round(rate * 10) / 10;
  }

  /**
   * コード品質スコアを計算
   */
  private calculateCodeQualityScore(actions: AIAction[]): CodeQualityDetail {
    const totalLinesChanged = actions.reduce((sum, a) => sum + a.linesAdded + a.linesDeleted, 0);
    const avgLinesChanged = totalLinesChanged / actions.length;

    const totalViolations = actions.reduce((sum, a) => sum + a.violations, 0);
    const avgViolations = totalViolations / actions.length;

    const totalErrors = actions.reduce((sum, a) => sum + a.compileErrors, 0);
    const avgErrors = totalErrors / actions.length;

    // スコア計算: 適度な行数変更、低違反数、低エラー数が高スコア
    let score = 100;

    // 行数の変動が大きすぎる場合は減点（500行以上の変更）
    if (avgLinesChanged > 500) {
      score -= Math.min((avgLinesChanged - 500) / 50, 30);
    }

    // 違反数による減点（1違反につき5点減）
    score -= avgViolations * 5;

    // エラー数による減点（1エラーにつき10点減）
    score -= avgErrors * 10;

    score = Math.max(0, score);

    return {
      avgLinesChanged: Math.round(avgLinesChanged),
      avgViolations: Math.round(avgViolations * 10) / 10,
      avgErrors: Math.round(avgErrors * 10) / 10,
      score: Math.round(score * 10) / 10
    };
  }

  /**
   * 効率スコアを計算
   */
  private calculateEfficiencyScore(actions: AIAction[]): EfficiencyDetail {
    // 期間の計算
    const durations = actions
      .filter(a => a.endTime)
      .map(a => {
        const start = new Date(a.startTime).getTime();
        const end = new Date(a.endTime!).getTime();
        return (end - start) / 1000; // 秒単位
      });

    const avgDuration = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

    // ファイル数の計算
    const totalFiles = actions.reduce((sum, a) => sum + a.changedFiles.length, 0);
    const avgFilesPerAction = totalFiles / actions.length;

    // 振動検出: 同じファイルが短時間で何度も変更される
    const oscillationCount = this.detectOscillation(actions);

    // スコア計算: 短時間、適度なファイル数、低振動が高スコア
    let score = 100;

    // 時間による減点（60秒以上で減点）
    if (avgDuration > 60) {
      score -= Math.min((avgDuration - 60) / 10, 30);
    }

    // ファイル数による減点（10ファイル以上で減点）
    if (avgFilesPerAction > 10) {
      score -= Math.min((avgFilesPerAction - 10) * 2, 20);
    }

    // 振動による減点（1振動につき5点減）
    score -= oscillationCount * 5;

    score = Math.max(0, score);

    return {
      avgDuration: Math.round(avgDuration * 10) / 10,
      avgFilesPerAction: Math.round(avgFilesPerAction * 10) / 10,
      oscillationCount,
      score: Math.round(score * 10) / 10
    };
  }

  /**
   * 振動（同じファイルの繰り返し変更）を検出
   */
  private detectOscillation(actions: AIAction[]): number {
    const fileTimestamps = new Map<string, number[]>();

    // ファイルごとの変更時刻を記録
    for (const action of actions) {
      const timestamp = new Date(action.startTime).getTime();
      for (const file of action.changedFiles) {
        if (!fileTimestamps.has(file)) {
          fileTimestamps.set(file, []);
        }
        fileTimestamps.get(file)!.push(timestamp);
      }
    }

    // 短時間（5分以内）に3回以上変更されたファイルをカウント
    let oscillationCount = 0;
    for (const [, timestamps] of fileTimestamps) {
      timestamps.sort((a, b) => a - b);
      for (let i = 0; i < timestamps.length - 2; i++) {
        const diff = timestamps[i + 2] - timestamps[i];
        if (diff < 5 * 60 * 1000) { // 5分
          oscillationCount++;
          break; // 同じファイルは1回だけカウント
        }
      }
    }

    return oscillationCount;
  }

  /**
   * 空のメトリクスを作成
   */
  private createEmptyMetrics(): AIPerformanceMetrics {
    return {
      taskCompletionRate: 0,
      violationRate: 0,
      codeQualityScore: 0,
      efficiencyScore: 0,
      overallScore: 0,
      timestamp: new Date().toISOString(),
      actionsEvaluated: 0
    };
  }

  /**
   * 評価結果を保存
   */
  public async saveMetrics(metrics: AIPerformanceMetrics): Promise<void> {
    try {
      const dir = path.dirname(this.historyPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let history: AIPerformanceMetrics[] = [];
      if (fs.existsSync(this.historyPath)) {
        const data = fs.readFileSync(this.historyPath, 'utf-8');
        history = JSON.parse(data);
      }

      history.push(metrics);

      // 最新100件のみ保持
      if (history.length > 100) {
        history = history.slice(-100);
      }

      fs.writeFileSync(this.historyPath, JSON.stringify(history, null, 2), 'utf-8');
      console.log('💾 [AIEvaluator] Metrics saved to:', this.historyPath);
    } catch (error) {
      console.error('❌ [AIEvaluator] Failed to save metrics:', error);
    }
  }

  /**
   * 評価履歴を取得
   */
  public getHistory(): AIPerformanceMetrics[] {
    try {
      if (!fs.existsSync(this.historyPath)) {
        return [];
      }
      const data = fs.readFileSync(this.historyPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ [AIEvaluator] Failed to load history:', error);
      return [];
    }
  }

  /**
   * 最新のメトリクスを取得
   */
  public getLatestMetrics(): AIPerformanceMetrics | null {
    const history = this.getHistory();
    return history.length > 0 ? history[history.length - 1] : null;
  }

  /**
   * メトリクスの推移を取得
   */
  public getTrend(count: number = 10): AIPerformanceMetrics[] {
    const history = this.getHistory();
    return history.slice(-count);
  }
}
