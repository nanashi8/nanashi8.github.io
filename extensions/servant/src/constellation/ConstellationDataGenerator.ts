import * as path from 'path';
import type { NeuralDependencyGraph, NeuralNode } from '../neural/NeuralDependencyGraph';
import type { GoalManager } from '../goals/GoalManager';

/**
 * 3D座標
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * 天体儀ノード
 */
export interface ConstellationNode {
  /** ノードID（ファイルパス） */
  id: string;
  /** 表示ラベル（ファイル名） */
  label: string;
  /** 3D座標 */
  position: Vector3;
  /** サイズ（1-5） */
  size: number;
  /** 色（16進数） */
  color: string;
  /** 優先度（0-1） */
  priority: number;
  /** カテゴリ */
  category: string;
  /** 接続数 */
  connections: number;
  /** メタデータ */
  metadata: {
    filePath: string;
    goalDistance: number;
    changeFrequency: number;
    activationLevel: number;
    entropy: number;
    lastModified: string;
  };
}

/**
 * 天体儀エッジ
 */
export interface ConstellationEdge {
  /** 始点ノードID */
  from: string;
  /** 終点ノードID */
  to: string;
  /** 強度（0-1） */
  strength: number;
}

/**
 * 天体儀データ全体
 */
export interface ConstellationData {
  /** ゴール情報 */
  goal: {
    name: string;
    description: string;
    position: Vector3;
  };
  /** ノード配列 */
  nodes: ConstellationNode[];
  /** エッジ配列 */
  edges: ConstellationEdge[];
  /** 統計情報 */
  stats: {
    totalNodes: number;
    totalEdges: number;
    avgPriority: number;
    highPriorityNodes: number; // priority >= 0.8
    mediumPriorityNodes: number; // 0.6 <= priority < 0.8
    lowPriorityNodes: number; // priority < 0.6
  };
}

/**
 * 天体儀データ生成クラス
 */
export class ConstellationDataGenerator {
  constructor(
    private graph: NeuralDependencyGraph,
    private goalManager: GoalManager
  ) {}

  /**
   * 天体儀データを生成
   */
  public generate(): ConstellationData {
    const mainGoal = this.goalManager.getMainGoal();
    const nodes: ConstellationNode[] = [];
    const edges: ConstellationEdge[] = [];

    // ノード変換
    const nodeArray = Array.from(this.graph.getNodes().values());
    nodeArray.forEach((node, i) => {
      nodes.push(this.convertNode(node, i, nodeArray.length));
    });

    // エッジ変換（重み0.5以上のみ）
    for (const [from, edgeList] of this.graph.getEdges()) {
      for (const edge of edgeList) {
        if (edge.weight >= 0.5) {
          edges.push({
            from,
            to: edge.to,
            strength: edge.weight,
          });
        }
      }
    }

    // 統計計算
    const avgPriority = nodes.reduce((sum, n) => sum + n.priority, 0) / (nodes.length || 1);
    const highPriorityNodes = nodes.filter((n) => n.priority >= 0.8).length;
    const mediumPriorityNodes = nodes.filter((n) => n.priority >= 0.6 && n.priority < 0.8).length;
    const lowPriorityNodes = nodes.filter((n) => n.priority < 0.6).length;

    return {
      goal: {
        name: mainGoal.name,
        description: mainGoal.description,
        position: { x: 0, y: 0, z: 0 },
      },
      nodes,
      edges,
      stats: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        avgPriority,
        highPriorityNodes,
        mediumPriorityNodes,
        lowPriorityNodes,
      },
    };
  }

  /**
   * ノードを天体儀ノードに変換
   */
  private convertNode(node: NeuralNode, index: number, total: number): ConstellationNode {
    return {
      id: node.filePath,
      label: this.extractLabel(node.filePath),
      position: this.calculatePosition(node, index, total),
      size: this.calculateSize(node.priorityScore),
      color: this.getColorByPriority(node.priorityScore),
      priority: node.priorityScore,
      category: this.inferCategory(node.filePath),
      connections: node.importCount + node.exportCount,
      metadata: {
        filePath: node.filePath,
        goalDistance: node.goalDistance,
        changeFrequency: node.changeFrequency,
        activationLevel: node.activationLevel,
        entropy: node.entropy,
        lastModified: node.lastModified,
      },
    };
  }

  /**
   * ファイルパスからラベルを抽出
   */
  private extractLabel(filePath: string): string {
    const basename = path.basename(filePath);
    const ext = path.extname(basename);
    return basename.replace(ext, '');
  }

  /**
   * 3D座標を計算
   * - 距離（半径）: 重要度の逆数（近い=重要）
   * - 高さ（Y軸）: 更新日（新しい=高い）
   * - 角度: 均等配置（円筒座標）
   */
  private calculatePosition(node: NeuralNode, index: number, total: number): Vector3 {
    // 距離 = 重要度の逆数（近い=重要）
    const distance = 15 + (1 - node.priorityScore) * 50; // 15〜65

    // 角度 = 均等配置（円周を等分）
    const angle = (index / total) * Math.PI * 2;

    // 高さ = 更新日（新しい=高い）
    const daysAgo = this.getDaysAgo(node.lastModified);
    const maxHeight = 30;
    const height = Math.max(-10, maxHeight - (daysAgo / 10)); // 最大30から減衰

    // 円筒座標 → 直交座標
    return {
      x: distance * Math.cos(angle),
      y: height,
      z: distance * Math.sin(angle),
    };
  }

  /**
   * 最終更新日から経過日数を計算
   */
  private getDaysAgo(lastModified: string): number {
    try {
      const lastDate = new Date(lastModified);
      const now = new Date();
      const diffMs = now.getTime() - lastDate.getTime();
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    } catch {
      return 365; // パース失敗時は1年前扱い
    }
  }

  /**
   * 優先度からサイズを計算
   */
  private calculateSize(priority: number): number {
    return 1.5 + priority * 3.5; // 1.5〜5.0
  }

  /**
   * 優先度から色を決定
   */
  private getColorByPriority(priority: number): string {
    if (priority >= 0.8) return '#4a9eff'; // 青（最重要）
    if (priority >= 0.6) return '#8b9eff'; // 薄青（重要）
    if (priority >= 0.4) return '#aaaaaa'; // 灰色（通常）
    return '#666666'; // 暗灰色（低優先度）
  }

  /**
   * ファイルパスからカテゴリを推定
   */
  private inferCategory(filePath: string): string {
    const lower = filePath.toLowerCase();

    // AI/学習系
    if (
      lower.includes('/models/') ||
      lower.includes('/specialists/') ||
      lower.includes('ai') ||
      lower.includes('learning') ||
      lower.includes('scheduler')
    ) {
      return 'AI';
    }

    // UI/コンポーネント
    if (lower.includes('/components/') || lower.includes('.tsx')) {
      return 'UI';
    }

    // データ/ストレージ
    if (
      lower.includes('/storage/') ||
      lower.includes('/data/') ||
      lower.includes('storage') ||
      lower.includes('database')
    ) {
      return 'Data';
    }

    // テスト
    if (
      lower.includes('/tests/') ||
      lower.includes('/test/') ||
      lower.includes('.test.') ||
      lower.includes('.spec.')
    ) {
      return 'Test';
    }

    // ドキュメント
    if (lower.includes('/docs/') || lower.endsWith('.md')) {
      return 'Docs';
    }

    // 設定
    if (lower.includes('config') || lower.includes('.json') || lower.includes('.yaml')) {
      return 'Config';
    }

    // スクリプト
    if (lower.includes('/scripts/') || lower.includes('.sh') || lower.endsWith('.py')) {
      return 'Script';
    }

    // ユーティリティ
    if (lower.includes('/utils/') || lower.includes('/helpers/') || lower.includes('util')) {
      return 'Util';
    }

    // その他
    return 'Other';
  }

  /**
   * カテゴリごとのノード数を集計
   */
  public getCategoryStats(): Map<string, number> {
    const data = this.generate();
    const stats = new Map<string, number>();

    for (const node of data.nodes) {
      stats.set(node.category, (stats.get(node.category) || 0) + 1);
    }

    return stats;
  }

  /**
   * 優先度上位N件のノードを取得
   */
  public getTopPriorityNodes(n: number = 10): ConstellationNode[] {
    const data = this.generate();
    return data.nodes.sort((a, b) => b.priority - a.priority).slice(0, n);
  }

  /**
   * 変更頻度が高いノードを取得
   */
  public getFrequentlyChangedNodes(threshold: number = 0.7): ConstellationNode[] {
    const data = this.generate();
    return data.nodes
      .filter((n) => n.metadata.changeFrequency >= threshold)
      .sort((a, b) => b.metadata.changeFrequency - a.metadata.changeFrequency);
  }

  /**
   * リスクが高いノード（変更頻度高 + 優先度高）を取得
   */
  public getRiskyNodes(): ConstellationNode[] {
    const data = this.generate();
    return data.nodes
      .filter((n) => n.metadata.changeFrequency > 0.7 && n.priority > 0.7)
      .sort((a, b) => {
        const riskA = a.metadata.changeFrequency * a.priority;
        const riskB = b.metadata.changeFrequency * b.priority;
        return riskB - riskA;
      });
  }

  /**
   * 重み順で上位N件のエッジを取得
   */
  public getTopEdges(n: number = 50): ConstellationEdge[] {
    const edges: ConstellationEdge[] = [];

    // すべてのエッジを収集
    for (const [from, edgeList] of this.graph.getEdges()) {
      for (const edge of edgeList) {
        edges.push({
          from,
          to: edge.to,
          strength: edge.weight,
        });
      }
    }

    // 重みでソートして上位N件を返す
    return edges.sort((a, b) => b.strength - a.strength).slice(0, n);
  }

  /**
   * エッジの重みから色を決定
   * @param weight エッジの重み（0-1）
   * @returns 16進数カラーコード
   */
  public getEdgeColor(weight: number): string {
    if (weight >= 0.8) return '#ff4444'; // 赤（超重要）
    if (weight >= 0.6) return '#ffaa44'; // オレンジ（重要）
    if (weight >= 0.4) return '#ffff44'; // 黄色（中）
    if (weight >= 0.3) return '#44ff44'; // 緑（弱）
    return '#4444ff'; // 青（超弱）
  }

  /**
   * エッジの重みから線の太さを決定
   * @param weight エッジの重み（0-1）
   * @returns 線の半径（0.1-0.5）
   */
  public getEdgeRadius(weight: number): number {
    return 0.1 + weight * 0.4; // 0.1〜0.5
  }

  /**
   * 指定ノードに接続されているノードIDリストを取得
   * @param nodeId ノードID（ファイルパス）
   * @returns 接続先ノードIDの配列
   */
  public getConnectedNodes(nodeId: string): string[] {
    const connected = new Set<string>();
    const edges = this.graph.getEdges();

    // 接続先（from → to）
    const outgoing = edges.get(nodeId) || [];
    for (const edge of outgoing) {
      connected.add(edge.to);
    }

    // 接続元（to ← from）
    for (const [from, edgeList] of edges) {
      for (const edge of edgeList) {
        if (edge.to === nodeId) {
          connected.add(from);
        }
      }
    }

    return Array.from(connected);
  }

  /**
   * 指定ノードに関連するエッジを取得
   * @param nodeId ノードID（ファイルパス）
   * @returns 関連エッジの配列
   */
  public getRelatedEdges(nodeId: string): ConstellationEdge[] {
    const relatedEdges: ConstellationEdge[] = [];
    const edges = this.graph.getEdges();

    // 接続先（from → to）
    const outgoing = edges.get(nodeId) || [];
    for (const edge of outgoing) {
      relatedEdges.push({
        from: nodeId,
        to: edge.to,
        strength: edge.weight,
      });
    }

    // 接続元（to ← from）
    for (const [from, edgeList] of edges) {
      for (const edge of edgeList) {
        if (edge.to === nodeId) {
          relatedEdges.push({
            from,
            to: nodeId,
            strength: edge.weight,
          });
        }
      }
    }

    return relatedEdges;
  }

  /**
   * BFSで依存深度を計算
   * @param startNodeId 起点ノードID
   * @param maxDepth 最大深度（デフォルト3）
   * @returns ノードID → 深度のマップ
   */
  public calculateDependencyDepth(startNodeId: string, maxDepth: number = 3): Map<string, number> {
    const depths = new Map<string, number>();
    const queue: Array<[string, number]> = [[startNodeId, 0]];
    const visited = new Set<string>();
    const edges = this.graph.getEdges();

    while (queue.length > 0) {
      const [nodeId, depth] = queue.shift()!;

      if (visited.has(nodeId) || depth > maxDepth) {
        continue;
      }

      visited.add(nodeId);
      depths.set(nodeId, depth);

      // 接続先を追加
      const outgoing = edges.get(nodeId) || [];
      for (const edge of outgoing) {
        if (!visited.has(edge.to)) {
          queue.push([edge.to, depth + 1]);
        }
      }

      // 接続元も追加（双方向探索）
      for (const [from, edgeList] of edges) {
        for (const edge of edgeList) {
          if (edge.to === nodeId && !visited.has(from)) {
            queue.push([from, depth + 1]);
          }
        }
      }
    }

    return depths;
  }
}
