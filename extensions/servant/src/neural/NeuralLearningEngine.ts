import * as fs from 'fs';
import * as path from 'path';
import { NeuralDependencyGraph } from './NeuralDependencyGraph';

/**
 * 伝播結果
 */
export interface PropagationResult {
  /** 影響を受けるファイルと影響度 */
  affectedFiles: Map<string, number>;
  /** 伝播パス */
  propagationPaths: Array<{
    path: string[];
    finalActivation: number;
  }>;
  /** 計算時間（ms） */
  computationTime: number;
}

/**
 * 逆伝播フィードバック
 */
export interface BackpropagationFeedback {
  /** 失敗ファイル */
  failureFile: string;
  /** エラー情報 */
  error: string;
  /** 違反数 */
  violations: number;
  /** コンパイルエラー数 */
  compileErrors: number;
}

/**
 * 学習履歴エントリ
 */
interface LearningHistoryEntry {
  timestamp: string;
  epoch: number;
  feedbackCount: number;
  avgWeightChange: number;
  convergenceScore: number;
}

/**
 * ニューラルネットワーク学習エンジン
 */
export class NeuralLearningEngine {
  private graph: NeuralDependencyGraph;
  private workspaceRoot: string;
  private learningRate: number;
  private currentEpoch: number;
  private feedbackCount: number;
  private historyPath: string;
  private maxDepth: number;

  constructor(graph: NeuralDependencyGraph, workspaceRoot: string) {
    this.graph = graph;
    this.workspaceRoot = workspaceRoot;
    this.learningRate = 0.01;
    this.currentEpoch = 0;
    this.feedbackCount = 0;
    this.maxDepth = 3; // 伝播の最大深さ
    this.historyPath = path.join(workspaceRoot, '.vscode', 'neural-learning-history.json');
  }

  /**
   * 順伝播（Forward Propagation）
   * 起点ファイルから影響を受けるファイルを計算
   */
  public propagateForward(startFile: string, _taskType?: string): PropagationResult {
    const startTime = Date.now();
    console.log(`🧠 [NeuralLearning] Forward propagation from ${startFile}`);

    const affectedFiles = new Map<string, number>();
    const propagationPaths: Array<{ path: string[]; finalActivation: number }> = [];

    // 起点ノードの活性化
    const startNode = this.graph.getNode(startFile);
    if (!startNode) {
      console.warn(`Node not found: ${startFile}`);
      return {
        affectedFiles,
        propagationPaths,
        computationTime: Date.now() - startTime
      };
    }

    // 初期活性化を設定
    affectedFiles.set(startFile, 1.0);

    // BFS（幅優先探索）で伝播
    const visited = new Set<string>();
    const queue: Array<{ file: string; activation: number; depth: number; path: string[] }> = [
      { file: startFile, activation: 1.0, depth: 0, path: [startFile] }
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (visited.has(current.file) || current.depth >= this.maxDepth) {
        continue;
      }
      visited.add(current.file);

      // 接続先に伝播
      const connections = this.graph.getConnections(current.file);
      for (const edge of connections) {
        const targetNode = this.graph.getNode(edge.to);
        if (!targetNode) continue;

        // 活性化を計算
        const weightedInput = current.activation * edge.weight;
        const newActivation = this.sigmoid(weightedInput);

        // 既存の活性化と比較して高い方を採用
        const existingActivation = affectedFiles.get(edge.to) || 0;
        if (newActivation > existingActivation) {
          affectedFiles.set(edge.to, newActivation);

          // パスを記録
          const newPath = [...current.path, edge.to];
          propagationPaths.push({
            path: newPath,
            finalActivation: newActivation
          });

          // キューに追加
          queue.push({
            file: edge.to,
            activation: newActivation,
            depth: current.depth + 1,
            path: newPath
          });
        }
      }
    }

    const computationTime = Date.now() - startTime;
    console.log(`🧠 [NeuralLearning] Forward propagation complete: ${affectedFiles.size} files affected in ${computationTime}ms`);

    return {
      affectedFiles,
      propagationPaths,
      computationTime
    };
  }

  /**
   * 逆伝播（Backpropagation）
   * 失敗ファイルから原因を逆算し、重みを更新
   */
  public async propagateBackward(feedback: BackpropagationFeedback): Promise<void> {
    console.log(`🧠 [NeuralLearning] Backpropagation from ${feedback.failureFile}`);

    this.feedbackCount++;

    // エラーの重大度を計算
    const errorSeverity = this.calculateErrorSeverity(feedback);

    // 逆方向に伝播して原因ファイルを特定
    const causeFiles = this.traceCauses(feedback.failureFile, errorSeverity);

    // 重みを更新
    await this.updateWeights(causeFiles, errorSeverity);

    // エポック判定（10回のフィードバックで1エポック）
    if (this.feedbackCount >= 10) {
      this.currentEpoch++;
      this.feedbackCount = 0;
      await this.saveEpochHistory();
      console.log(`🧠 [NeuralLearning] Epoch ${this.currentEpoch} complete`);
    }
  }

  /**
   * エラーの重大度を計算
   */
  private calculateErrorSeverity(feedback: BackpropagationFeedback): number {
    // 違反とエラーの数から重大度を計算
    const severity =
      feedback.violations * 0.3 +
      feedback.compileErrors * 0.7;

    // 0-1に正規化
    return Math.min(severity / 10, 1.0);
  }

  /**
   * 原因ファイルを追跡
   */
  private traceCauses(failureFile: string, errorSeverity: number): Map<string, number> {
    const causes = new Map<string, number>();
    const visited = new Set<string>();

    // 失敗ファイル自身が最大の原因
    causes.set(failureFile, errorSeverity);

    // 逆方向（インポート元）を辿る
    const queue: Array<{ file: string; blame: number; depth: number }> = [
      { file: failureFile, blame: errorSeverity, depth: 0 }
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (visited.has(current.file) || current.depth >= this.maxDepth) {
        continue;
      }
      visited.add(current.file);

      // このファイルをインポートしているファイルを探す
      const importers = this.findImporters(current.file);

      for (const importer of importers) {
        // 減衰した責任を伝播
        const decayedBlame = current.blame * 0.5; // 深さごとに半減

        const existingBlame = causes.get(importer) || 0;
        if (decayedBlame > existingBlame) {
          causes.set(importer, decayedBlame);

          queue.push({
            file: importer,
            blame: decayedBlame,
            depth: current.depth + 1
          });
        }
      }
    }

    return causes;
  }

  /**
   * 指定ファイルをインポートしているファイルを探す
   */
  private findImporters(_targetFile: string): string[] {
    const importers: string[] = [];

    // 全ノードをチェック
    // statsから全ノードを取得する代わりに、全エッジをチェック
    // TODO: より効率的な実装

    return importers;
  }

  /**
   * 重みを更新
   */
  private async updateWeights(
    causeFiles: Map<string, number>,
    errorSeverity: number
  ): Promise<void> {
    console.log(`🧠 [NeuralLearning] Updating weights for ${causeFiles.size} cause files`);

    let totalWeightChange = 0;
    let updateCount = 0;

    for (const [file, blame] of causeFiles) {
      const connections = this.graph.getConnections(file);

      for (const edge of connections) {
        // 重みを減少（失敗したパスの重みを下げる）
        const weightChange = -this.learningRate * blame * errorSeverity;
        const newWeight = Math.max(0.1, Math.min(1.0, edge.weight + weightChange)); // 0.1-1.0の範囲に制限

        // 重み更新
        edge.weight = newWeight;

        totalWeightChange += Math.abs(weightChange);
        updateCount++;
      }
    }

    // グラフを保存
    await this.graph.saveGraph();

    const avgWeightChange = updateCount > 0 ? totalWeightChange / updateCount : 0;
    console.log(`🧠 [NeuralLearning] Updated ${updateCount} weights, avg change: ${avgWeightChange.toFixed(4)}`);
  }

  /**
   * シグモイド活性化関数
   * activation = 1 / (1 + exp(-x))
   */
  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  /**
   * エポック履歴を保存
   */
  private async saveEpochHistory(): Promise<void> {
    try {
      const dir = path.dirname(this.historyPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let history: LearningHistoryEntry[] = [];
      if (fs.existsSync(this.historyPath)) {
        const data = fs.readFileSync(this.historyPath, 'utf-8');
        history = JSON.parse(data);
      }

      const stats = this.graph.getStats();

      const entry: LearningHistoryEntry = {
        timestamp: new Date().toISOString(),
        epoch: this.currentEpoch,
        feedbackCount: 10,
        avgWeightChange: stats.avgWeight,
        convergenceScore: this.calculateConvergence(history)
      };

      history.push(entry);

      // 最新100エポックのみ保持
      if (history.length > 100) {
        history = history.slice(-100);
      }

      fs.writeFileSync(this.historyPath, JSON.stringify(history, null, 2), 'utf-8');
      console.log('💾 [NeuralLearning] Epoch history saved');
    } catch (error) {
      console.error('❌ [NeuralLearning] Failed to save epoch history:', error);
    }
  }

  /**
   * 収束スコアを計算
   */
  private calculateConvergence(history: LearningHistoryEntry[]): number {
    if (history.length < 2) {
      return 0;
    }

    // 最近5エポックの重み変化を見る
    const recentHistory = history.slice(-5);
    const weightChanges = recentHistory.map(h => h.avgWeightChange);

    // 分散を計算（低いほど収束）
    const mean = weightChanges.reduce((sum, w) => sum + w, 0) / weightChanges.length;
    const variance = weightChanges.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / weightChanges.length;

    // 収束スコア（0-100、低分散ほど高スコア）
    const convergenceScore = Math.max(0, 100 - variance * 1000);

    return Math.round(convergenceScore);
  }

  /**
   * 学習統計を取得
   */
  public getStats(): {
    currentEpoch: number;
    feedbackCount: number;
    learningRate: number;
    convergence: number;
  } {
    let convergence = 0;
    try {
      if (fs.existsSync(this.historyPath)) {
        const history: LearningHistoryEntry[] = JSON.parse(
          fs.readFileSync(this.historyPath, 'utf-8')
        );
        if (history.length > 0) {
          convergence = history[history.length - 1].convergenceScore;
        }
      }
    } catch {
      // ignore
    }

    return {
      currentEpoch: this.currentEpoch,
      feedbackCount: this.feedbackCount,
      learningRate: this.learningRate,
      convergence
    };
  }

  /**
   * 学習率を設定
   */
  public setLearningRate(rate: number): void {
    this.learningRate = Math.max(0.001, Math.min(0.1, rate)); // 0.001-0.1の範囲
    console.log(`🧠 [NeuralLearning] Learning rate set to ${this.learningRate}`);
  }

  /**
   * 学習をリセット
   */
  public async reset(): Promise<void> {
    this.currentEpoch = 0;
    this.feedbackCount = 0;

    if (fs.existsSync(this.historyPath)) {
      fs.unlinkSync(this.historyPath);
    }

    console.log('🧠 [NeuralLearning] Learning reset');
  }
}
