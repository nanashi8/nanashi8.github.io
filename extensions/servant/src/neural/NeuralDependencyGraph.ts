import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * グラフのノード（ファイル）
 */
export interface NeuralNode {
  /** ファイルパス */
  filePath: string;
  /** エントロピー（複雑度） */
  entropy: number;
  /** 活性化レベル（最近の使用頻度） */
  activationLevel: number;
  /** 変更頻度 */
  changeFrequency: number;
  /** 最終変更日時 */
  lastModified: string;
  /** インポート数 */
  importCount: number;
  /** エクスポート数 */
  exportCount: number;
}

/**
 * グラフのエッジ（接続）
 */
export interface NeuralEdge {
  /** 始点ファイル */
  from: string;
  /** 終点ファイル */
  to: string;
  /** 重み（接続の強度） */
  weight: number;
  /** インポート強度（直接=0.8、間接=0.3） */
  importStrength: number;
  /** 同時変更率 */
  coChangeRate: number;
  /** 相互情報量 */
  mutualInformation: number;
  /** 意味的類似度 */
  semanticSimilarity: number;
}

/**
 * グラフ統計情報
 */
export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  avgEntropy: number;
  avgActivation: number;
  avgWeight: number;
  mostActiveNodes: Array<{ file: string; activation: number }>;
  strongestConnections: Array<{ from: string; to: string; weight: number }>;
}

/**
 * ニューラルネットワーク的依存関係グラフ
 */
export class NeuralDependencyGraph {
  private workspaceRoot: string;
  private nodes: Map<string, NeuralNode>;
  private edges: Map<string, NeuralEdge[]>;
  private graphPath: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.nodes = new Map();
    this.edges = new Map();
    this.graphPath = path.join(workspaceRoot, '.vscode', 'neural-graph.json');
  }

  /**
   * グラフを構築
   */
  public async buildGraph(): Promise<void> {
    console.log('🧠 [NeuralGraph] Building dependency graph...');

    // TypeScript/JavaScript ファイルを収集
    const files = await this.collectSourceFiles();

    // ノードを作成
    for (const file of files) {
      const node = await this.createNode(file);
      this.nodes.set(file, node);
    }

    // エッジを作成
    for (const file of files) {
      const edges = await this.createEdges(file);
      this.edges.set(file, edges);
    }

    // グラフを保存
    await this.saveGraph();

    console.log(`🧠 [NeuralGraph] Built graph: ${this.nodes.size} nodes, ${this.getTotalEdges()} edges`);
  }

  /**
   * ソースファイルを収集
   */
  private async collectSourceFiles(): Promise<string[]> {
    const files: string[] = [];
    const pattern = '**/*.{ts,tsx,js,jsx}';

    const uris = await vscode.workspace.findFiles(
      pattern,
      '**/node_modules/**',
      1000
    );

    for (const uri of uris) {
      const relativePath = vscode.workspace.asRelativePath(uri);
      files.push(relativePath);
    }

    return files;
  }

  /**
   * ノードを作成
   */
  private async createNode(file: string): Promise<NeuralNode> {
    const fullPath = path.join(this.workspaceRoot, file);

    let content = '';
    let stats: fs.Stats | null = null;

    try {
      content = fs.readFileSync(fullPath, 'utf-8');
      stats = fs.statSync(fullPath);
    } catch (error) {
      console.warn(`Failed to read ${file}:`, error);
    }

    // エントロピー計算
    const entropy = this.calculateEntropy(content);

    // 活性化レベル計算（Git履歴から算出、ここでは簡易版）
    const activationLevel = this.calculateActivationLevel(file, stats);

    // 変更頻度（簡易版）
    const changeFrequency = 0; // TODO: Git履歴から計算

    // インポート/エクスポート数
    const { importCount, exportCount } = this.countImportsExports(content);

    return {
      filePath: file,
      entropy,
      activationLevel,
      changeFrequency,
      lastModified: stats ? stats.mtime.toISOString() : new Date().toISOString(),
      importCount,
      exportCount
    };
  }

  /**
   * エントロピー計算（情報理論ベース）
   * H(X) = -Σ p(x) * log2(p(x))
   */
  private calculateEntropy(content: string): number {
    if (content.length === 0) {
      return 0;
    }

    // 文字の出現頻度を計算
    const frequency = new Map<string, number>();
    for (const char of content) {
      frequency.set(char, (frequency.get(char) || 0) + 1);
    }

    // エントロピー計算
    let entropy = 0;
    const total = content.length;

    for (const count of frequency.values()) {
      const p = count / total;
      entropy -= p * Math.log2(p);
    }

    return Math.round(entropy * 100) / 100;
  }

  /**
   * 活性化レベル計算
   * 最近の使用頻度を指数関数的減衰で計算
   */
  private calculateActivationLevel(file: string, stats: fs.Stats | null): number {
    if (!stats) {
      return 0;
    }

    // 最終変更からの経過日数
    const now = Date.now();
    const modified = stats.mtime.getTime();
    const daysSinceModified = (now - modified) / (1000 * 60 * 60 * 24);

    // 指数関数的減衰（λ = 0.1）
    const lambda = 0.1;
    const activation = Math.exp(-lambda * daysSinceModified);

    return Math.round(activation * 100) / 100;
  }

  /**
   * インポート/エクスポート数を数える
   */
  private countImportsExports(content: string): { importCount: number; exportCount: number } {
    const importMatches = content.match(/import\s+.*\s+from/g);
    const exportMatches = content.match(/export\s+(class|function|const|let|var|default|interface|type)/g);

    return {
      importCount: importMatches ? importMatches.length : 0,
      exportCount: exportMatches ? exportMatches.length : 0
    };
  }

  /**
   * エッジを作成
   */
  private async createEdges(file: string): Promise<NeuralEdge[]> {
    const edges: NeuralEdge[] = [];
    const fullPath = path.join(this.workspaceRoot, file);

    let content = '';
    try {
      content = fs.readFileSync(fullPath, 'utf-8');
    } catch (error) {
      return edges;
    }

    // インポート文を抽出
    const imports = this.extractImports(content);

    for (const importPath of imports) {
      const targetFile = this.resolveImportPath(file, importPath);

      if (targetFile && this.nodes.has(targetFile)) {
        const weight = this.calculateEdgeWeight(file, targetFile);

        edges.push({
          from: file,
          to: targetFile,
          weight,
          importStrength: 0.8, // 直接インポート
          coChangeRate: 0, // TODO: Git履歴から計算
          mutualInformation: 0, // TODO: 実装
          semanticSimilarity: 0 // TODO: 実装
        });
      }
    }

    return edges;
  }

  /**
   * インポート文を抽出
   */
  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  /**
   * インポートパスを解決
   */
  private resolveImportPath(fromFile: string, importPath: string): string | null {
    // 相対パス処理
    if (importPath.startsWith('.')) {
      const fromDir = path.dirname(fromFile);
      const resolved = path.normalize(path.join(fromDir, importPath));

      // 拡張子を試す
      for (const ext of ['', '.ts', '.tsx', '.js', '.jsx']) {
        const withExt = resolved + ext;
        if (this.nodes.has(withExt)) {
          return withExt;
        }
      }
    }

    return null;
  }

  /**
   * エッジの重みを計算
   * w = α*import + β*coChange + γ*mutualInfo + δ*semantic
   */
  private calculateEdgeWeight(from: string, to: string): number {
    const alpha = 0.4;  // インポート強度の重み
    const beta = 0.3;   // 同時変更率の重み
    const gamma = 0.2;  // 相互情報量の重み
    const delta = 0.1;  // 意味的類似度の重み

    const importStrength = 0.8; // 直接インポート
    const coChangeRate = 0; // TODO: 実装
    const mutualInfo = 0; // TODO: 実装
    const semantic = 0; // TODO: 実装

    const weight =
      alpha * importStrength +
      beta * coChangeRate +
      gamma * mutualInfo +
      delta * semantic;

    return Math.round(weight * 100) / 100;
  }

  /**
   * ノードを取得
   */
  public getNode(file: string): NeuralNode | undefined {
    return this.nodes.get(file);
  }

  /**
   * 接続を取得
   */
  public getConnections(file: string): NeuralEdge[] {
    return this.edges.get(file) || [];
  }

  /**
   * 統計情報を取得
   */
  public getStats(): GraphStats {
    const nodes = Array.from(this.nodes.values());
    const totalEdges = this.getTotalEdges();

    const avgEntropy = nodes.reduce((sum, n) => sum + n.entropy, 0) / nodes.length;
    const avgActivation = nodes.reduce((sum, n) => sum + n.activationLevel, 0) / nodes.length;

    let totalWeight = 0;
    let edgeCount = 0;
    for (const edgeList of this.edges.values()) {
      for (const edge of edgeList) {
        totalWeight += edge.weight;
        edgeCount++;
      }
    }
    const avgWeight = edgeCount > 0 ? totalWeight / edgeCount : 0;

    // 最もアクティブなノード
    const mostActive = nodes
      .sort((a, b) => b.activationLevel - a.activationLevel)
      .slice(0, 10)
      .map(n => ({ file: n.filePath, activation: n.activationLevel }));

    // 最も強い接続
    const allEdges: Array<{ from: string; to: string; weight: number }> = [];
    for (const [from, edgeList] of this.edges) {
      for (const edge of edgeList) {
        allEdges.push({ from, to: edge.to, weight: edge.weight });
      }
    }
    const strongestConnections = allEdges
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10);

    return {
      totalNodes: nodes.length,
      totalEdges,
      avgEntropy: Math.round(avgEntropy * 100) / 100,
      avgActivation: Math.round(avgActivation * 100) / 100,
      avgWeight: Math.round(avgWeight * 100) / 100,
      mostActiveNodes: mostActive,
      strongestConnections
    };
  }

  /**
   * 総エッジ数を取得
   */
  private getTotalEdges(): number {
    let total = 0;
    for (const edgeList of this.edges.values()) {
      total += edgeList.length;
    }
    return total;
  }

  /**
   * グラフを保存
   */
  public async saveGraph(): Promise<void> {
    try {
      const dir = path.dirname(this.graphPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = {
        nodes: Array.from(this.nodes.entries()).map(([file, node]) => ({
          ...node,
          id: file
        })),
        edges: Array.from(this.edges.entries()).flatMap(([from, edgeList]) =>
          edgeList.map(edge => ({ ...edge, from }))
        ),
        stats: this.getStats(),
        lastUpdated: new Date().toISOString()
      };

      fs.writeFileSync(this.graphPath, JSON.stringify(data, null, 2), 'utf-8');
      console.log('💾 [NeuralGraph] Graph saved to:', this.graphPath);
    } catch (error) {
      console.error('❌ [NeuralGraph] Failed to save graph:', error);
    }
  }

  /**
   * グラフを読み込み
   */
  public async loadGraph(): Promise<boolean> {
    try {
      if (!fs.existsSync(this.graphPath)) {
        return false;
      }

      const data = JSON.parse(fs.readFileSync(this.graphPath, 'utf-8'));

      this.nodes.clear();
      this.edges.clear();

      for (const node of data.nodes) {
        const { id, ...nodeData } = node;
        this.nodes.set(id, nodeData);
      }

      for (const edge of data.edges) {
        const { from, ...edgeData } = edge;
        if (!this.edges.has(from)) {
          this.edges.set(from, []);
        }
        this.edges.get(from)!.push(edgeData);
      }

      console.log('📖 [NeuralGraph] Graph loaded from:', this.graphPath);
      return true;
    } catch (error) {
      console.error('❌ [NeuralGraph] Failed to load graph:', error);
      return false;
    }
  }

  /**
   * グラフを更新（差分更新）
   */
  public async updateGraph(changedFiles: string[]): Promise<void> {
    console.log(`🧠 [NeuralGraph] Updating graph for ${changedFiles.length} files...`);

    for (const file of changedFiles) {
      // ノードを更新
      const node = await this.createNode(file);
      this.nodes.set(file, node);

      // エッジを更新
      const edges = await this.createEdges(file);
      this.edges.set(file, edges);
    }

    await this.saveGraph();
    console.log('🧠 [NeuralGraph] Graph updated');
  }
}
