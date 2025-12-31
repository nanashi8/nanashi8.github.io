import * as fs from 'fs';
import * as path from 'path';
import { NeuralDependencyGraph } from './NeuralDependencyGraph';
import { NeuralLearningEngine, PropagationResult } from './NeuralLearningEngine';

/**
 * ワークフローパターン
 */
export interface WorkflowPattern {
  /** パターンID */
  id: string;
  /** タスク種別 */
  taskType: 'bug-fix' | 'feature' | 'refactor' | 'test' | 'docs' | 'unknown';
  /** ファイル変更の順序 */
  sequence: string[];
  /** 成功率（0-1） */
  successRate: number;
  /** 平均所要時間（秒） */
  avgTime: number;
  /** 違反発生率（0-1） */
  violationRate: number;
  /** 使用回数 */
  usageCount: number;
  /** 最終使用日時 */
  lastUsed: string;
  /** 提案効果（提案を採用→成功の割合, 0-1） */
  suggestionEffectiveness?: number;
  /** 提案回数 */
  suggestionCount?: number;
  /** 提案採用回数 */
  suggestionAccepted?: number;
}

/**
 * 最適化提案
 */
export interface OptimizationSuggestion {
  /** 提案ID（効果追跡用） */
  suggestionId: string;
  /** 使用したパターンID（効果測定用） */
  patternIds: string[];
  /** 推奨ファイル順序 */
  recommendedOrder: string[];
  /** リスク予測 */
  risks: Array<{
    file: string;
    riskLevel: 'low' | 'medium' | 'high';
    reason: string;
  }>;
  /** 次のアクション */
  nextActions: string[];
  /** 予測成功率 */
  predictedSuccessRate: number;
  /** 予測所要時間（秒） */
  predictedTime: number;
}

/**
 * タスク状態
 */
export interface TaskState {
  /** タスク種別 */
  taskType: string;
  /** 現在のファイル */
  currentFile?: string;
  /** 変更済みファイル */
  modifiedFiles: string[];
  /** 開始時刻 */
  startTime: Date;
}

/**
 * 最適化エンジン
 */
export class OptimizationEngine {
  // パターンスコアリングの重み付け
  private static readonly PATTERN_SCORE_WEIGHTS = {
    SIMILARITY: 0.3,
    SUCCESS_RATE: 0.3,
    DECAY: 0.2,
    EFFECTIVENESS: 0.2
  };

  private graph: NeuralDependencyGraph;
  private learningEngine: NeuralLearningEngine;
  private workspaceRoot: string;
  private patternsPath: string;
  private patterns: Map<string, WorkflowPattern>;

  constructor(
    graph: NeuralDependencyGraph,
    learningEngine: NeuralLearningEngine,
    workspaceRoot: string
  ) {
    this.graph = graph;
    this.learningEngine = learningEngine;
    this.workspaceRoot = workspaceRoot;
    this.patternsPath = path.join(workspaceRoot, '.vscode', 'workflow-patterns.json');
    this.patterns = new Map();
  }

  /**
   * パターンを読み込み
   */
  public async loadPatterns(): Promise<void> {
    try {
      if (!fs.existsSync(this.patternsPath)) {
        return;
      }

      const data = JSON.parse(fs.readFileSync(this.patternsPath, 'utf-8'));
      this.patterns.clear();

      for (const pattern of data.patterns || []) {
        this.patterns.set(pattern.id, pattern);
      }

      console.log(`🎯 [Optimization] Loaded ${this.patterns.size} workflow patterns`);
    } catch (error) {
      console.error('❌ [Optimization] Failed to load patterns:', error);
    }
  }

  /**
   * パターンを保存
   */
  public async savePatterns(): Promise<void> {
    try {
      const dir = path.dirname(this.patternsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = {
        patterns: Array.from(this.patterns.values()),
        lastUpdated: new Date().toISOString()
      };

      fs.writeFileSync(this.patternsPath, JSON.stringify(data, null, 2), 'utf-8');
      console.log('💾 [Optimization] Patterns saved');
    } catch (error) {
      console.error('❌ [Optimization] Failed to save patterns:', error);
    }
  }

  /**
   * タスクの最適化提案を生成
   */
  public async optimize(taskState: TaskState): Promise<OptimizationSuggestion> {
    console.log(`🎯 [Optimization] Optimizing task: ${taskState.taskType}`);

    // 1. 類似パターンを検索
    const similarPatterns = this.findSimilarPatterns(taskState);

    // 2. ニューラルグラフから影響予測
    const propagationResults = taskState.currentFile
      ? this.learningEngine.propagateForward(taskState.currentFile, taskState.taskType)
      : null;

    // 3. 推奨順序を計算
    const recommendedOrder = this.calculateOptimalOrder(
      taskState,
      similarPatterns,
      propagationResults
    );

    // 4. リスク予測
    const risks = this.predictRisks(recommendedOrder);

    // 5. 次のアクションを提案
    const nextActions = this.suggestNextActions(taskState, recommendedOrder, risks);

    // 6. 成功率と時間を予測
    const { predictedSuccessRate, predictedTime } = this.predictOutcome(
      taskState,
      similarPatterns
    );

    // 7. 提案IDとパターンIDを記録（効果測定用）
    const suggestionId = `suggestion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const patternIds = similarPatterns.map(p => p.id);

    // 提案回数をインクリメント
    similarPatterns.forEach(p => {
      p.suggestionCount = (p.suggestionCount ?? 0) + 1;
    });
    await this.savePatterns();

    return {
      suggestionId,
      patternIds,
      recommendedOrder,
      risks,
      nextActions,
      predictedSuccessRate,
      predictedTime
    };
  }

  /**
   * 類似パターンを検索
   */
  private findSimilarPatterns(taskState: TaskState): WorkflowPattern[] {
    const candidates: Array<{ pattern: WorkflowPattern; similarity: number }> = [];

    for (const pattern of this.patterns.values()) {
      // タスク種別が一致
      if (pattern.taskType !== taskState.taskType && taskState.taskType !== 'unknown') {
        continue;
      }

      // 変更ファイルの類似度を計算
      const similarity = this.calculateSimilarity(
        taskState.modifiedFiles,
        pattern.sequence
      );

      if (similarity > 0.3) {
        candidates.push({ pattern, similarity });
      }
    }

    // 類似度、成功率、減衰係数、提案効果でソート
    candidates.sort((a, b) => {
      const decayA = this.calculateDecayFactor(a.pattern.lastUsed);
      const decayB = this.calculateDecayFactor(b.pattern.lastUsed);
      const effectivenessA = a.pattern.suggestionEffectiveness ?? 0.5;
      const effectivenessB = b.pattern.suggestionEffectiveness ?? 0.5;

      const W = OptimizationEngine.PATTERN_SCORE_WEIGHTS;
      const scoreA = a.similarity * W.SIMILARITY + a.pattern.successRate * W.SUCCESS_RATE + decayA * W.DECAY + effectivenessA * W.EFFECTIVENESS;
      const scoreB = b.similarity * W.SIMILARITY + b.pattern.successRate * W.SUCCESS_RATE + decayB * W.DECAY + effectivenessB * W.EFFECTIVENESS;
      return scoreB - scoreA;
    });

    return candidates.slice(0, 5).map(c => c.pattern);
  }

  /**
   * 類似度を計算（Jaccard係数）
   */
  private calculateSimilarity(files1: string[], files2: string[]): number {
    const set1 = new Set(files1);
    const set2 = new Set(files2);

    const intersection = new Set([...set1].filter(f => set2.has(f)));
    const union = new Set([...set1, ...set2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * パターンの減衰係数を計算（時間経過で重み減少）
   */
  private calculateDecayFactor(lastUsed: string): number {
    const now = Date.now();
    const lastUsedTime = new Date(lastUsed).getTime();
    const daysPassed = (now - lastUsedTime) / (1000 * 60 * 60 * 24);

    // 1週間前: ×0.9, 2週間前: ×0.7, 1ヶ月前: ×0.5, 2ヶ月前: ×0.3
    if (daysPassed < 7) return 1.0;
    if (daysPassed < 14) return 0.9;
    if (daysPassed < 30) return 0.7;
    if (daysPassed < 60) return 0.5;
    return 0.3;
  }

  /**
   * 最適な順序を計算
   */
  private calculateOptimalOrder(
    taskState: TaskState,
    patterns: WorkflowPattern[],
    propagationResult: PropagationResult | null
  ): string[] {
    const order: string[] = [];
    const processed = new Set(taskState.modifiedFiles);

    // パターンから推奨順序を抽出
    if (patterns.length > 0) {
      const bestPattern = patterns[0];
      for (const file of bestPattern.sequence) {
        if (!processed.has(file)) {
          order.push(file);
          processed.add(file);
        }
      }
    }

    // ニューラルグラフから影響の大きいファイルを追加
    if (propagationResult) {
      const sorted = Array.from(propagationResult.affectedFiles.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      for (const [file, _] of sorted) {
        if (!processed.has(file)) {
          order.push(file);
          processed.add(file);
        }
      }
    }

    return order;
  }

  /**
   * リスクを予測
   */
  private predictRisks(files: string[]): Array<{
    file: string;
    riskLevel: 'low' | 'medium' | 'high';
    reason: string;
  }> {
    const risks: Array<{
      file: string;
      riskLevel: 'low' | 'medium' | 'high';
      reason: string;
    }> = [];

    for (const file of files) {
      const node = this.graph.getNode(file);
      if (!node) continue;

      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      const reasons: string[] = [];

      // エントロピーが高い（複雑）
      if (node.entropy > 5) {
        riskLevel = 'medium';
        reasons.push('高い複雑度');
      }

      // 多数の接続
      const connections = this.graph.getConnections(file);
      if (connections.length > 10) {
        riskLevel = 'high';
        reasons.push(`${connections.length}ファイルと結合`);
      }

      // 活性化レベルが低い（最近触られていない）
      if (node.activationLevel < 0.3) {
        if (riskLevel === 'low') riskLevel = 'medium';
        reasons.push('最近変更されていない');
      }

      if (reasons.length > 0) {
        risks.push({
          file,
          riskLevel,
          reason: reasons.join(', ')
        });
      }
    }

    return risks;
  }

  /**
   * 次のアクションを提案
   */
  private suggestNextActions(
    taskState: TaskState,
    recommendedOrder: string[],
    risks: Array<{ file: string; riskLevel: string }>
  ): string[] {
    const actions: string[] = [];

    // 次に変更すべきファイル
    if (recommendedOrder.length > 0) {
      const nextFile = recommendedOrder[0];
      actions.push(`次は ${nextFile} を変更することを推奨します`);

      // リスクがある場合は警告
      const risk = risks.find(r => r.file === nextFile);
      if (risk && risk.riskLevel === 'high') {
        actions.push(`⚠️ ${nextFile} は高リスクです。慎重に変更してください`);
      }
    }

    // 関連ファイルの確認
    if (taskState.currentFile) {
      const connections = this.graph.getConnections(taskState.currentFile);
      if (connections.length > 0) {
        const topConnections = connections
          .sort((a, b) => b.weight - a.weight)
          .slice(0, 3)
          .map(c => c.to);
        actions.push(`関連ファイルを確認: ${topConnections.join(', ')}`);
      }
    }

    // テストの実行
    if (taskState.modifiedFiles.length > 3) {
      actions.push('テストを実行して動作確認してください');
    }

    return actions;
  }

  /**
   * 成果を予測
   */
  private predictOutcome(
    taskState: TaskState,
    patterns: WorkflowPattern[]
  ): { predictedSuccessRate: number; predictedTime: number } {
    if (patterns.length === 0) {
      return {
        predictedSuccessRate: 0.7, // デフォルト
        predictedTime: 600 // 10分
      };
    }

    // 上位3パターンの平均
    const topPatterns = patterns.slice(0, 3);
    const avgSuccessRate = topPatterns.reduce((sum, p) => sum + p.successRate, 0) / topPatterns.length;
    const avgTime = topPatterns.reduce((sum, p) => sum + p.avgTime, 0) / topPatterns.length;

    return {
      predictedSuccessRate: Math.round(avgSuccessRate * 100) / 100,
      predictedTime: Math.round(avgTime)
    };
  }

  /**
   * 新しいパターンを学習
   */
  public async learnPattern(
    taskType: string,
    sequence: string[],
    success: boolean,
    time: number,
    violations: number
  ): Promise<void> {
    const patternId = `${taskType}-${Date.now()}`;

    // 既存の類似パターンを検索
    const similar = this.findSimilarPatterns({
      taskType: taskType as any,
      modifiedFiles: sequence,
      startTime: new Date()
    });

    if (similar.length > 0) {
      // 既存パターンを更新
      const pattern = similar[0];
      pattern.usageCount++;
      pattern.successRate = (pattern.successRate * (pattern.usageCount - 1) + (success ? 1 : 0)) / pattern.usageCount;
      pattern.avgTime = (pattern.avgTime * (pattern.usageCount - 1) + time) / pattern.usageCount;
      pattern.violationRate = (pattern.violationRate * (pattern.usageCount - 1) + violations) / pattern.usageCount;
      pattern.lastUsed = new Date().toISOString();
    } else {
      // 新しいパターンを追加
      const newPattern: WorkflowPattern = {
        id: patternId,
        taskType: taskType as any,
        sequence,
        successRate: success ? 1.0 : 0.0,
        avgTime: time,
        violationRate: violations,
        usageCount: 1,
        lastUsed: new Date().toISOString()
      };

      this.patterns.set(patternId, newPattern);
    }

    await this.savePatterns();
    console.log(`🎯 [Optimization] Pattern learned: ${patternId}`);
  }

  /**
   * 提案効果を記録（提案を採用→成功/失敗）
   */
  public async recordSuggestionOutcome(
    patternIds: string[],
    wasAccepted: boolean,
    wasSuccessful: boolean
  ): Promise<void> {
    for (const patternId of patternIds) {
      const pattern = this.patterns.get(patternId);
      if (!pattern) continue;

      if (wasAccepted) {
        pattern.suggestionAccepted = (pattern.suggestionAccepted ?? 0) + 1;

        // 効果率を更新（採用→成功の割合）
        const totalAccepted = pattern.suggestionAccepted;
        const prevEffectiveness = pattern.suggestionEffectiveness ?? 0.5;
        pattern.suggestionEffectiveness =
          (prevEffectiveness * (totalAccepted - 1) + (wasSuccessful ? 1 : 0)) / totalAccepted;
      }
    }

    await this.savePatterns();
    console.log(`📊 [Optimization] Suggestion outcome recorded for ${patternIds.length} patterns`);
  }

  /**
   * 統計情報を取得
   */
  public getStats(): {
    totalPatterns: number;
    avgSuccessRate: number;
    bestPattern: WorkflowPattern | null;
    worstPattern: WorkflowPattern | null;
  } {
    const patterns = Array.from(this.patterns.values());

    if (patterns.length === 0) {
      return {
        totalPatterns: 0,
        avgSuccessRate: 0,
        bestPattern: null,
        worstPattern: null
      };
    }

    const avgSuccessRate = patterns.reduce((sum, p) => sum + p.successRate, 0) / patterns.length;
    const sorted = [...patterns].sort((a, b) => b.successRate - a.successRate);

    return {
      totalPatterns: patterns.length,
      avgSuccessRate: Math.round(avgSuccessRate * 100) / 100,
      bestPattern: sorted[0],
      worstPattern: sorted[sorted.length - 1]
    };
  }
}
