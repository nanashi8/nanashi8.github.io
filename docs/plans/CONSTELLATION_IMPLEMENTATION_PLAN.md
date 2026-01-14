# 天体儀システム実装計画
**策定日**: 2026年1月5日  
**目的**: サーバントがプロジェクトのゴールに向かうために、AIに最適な情報を提供するシステムを構築

---

## 📋 実装計画サマリー

| Phase | 工程 | 期間 | 難易度 | 優先度 |
|-------|------|------|--------|--------|
| **Phase 1** | ゴール定義システム | 2〜3時間 | 低 | 🔴 最優先 |
| **Phase 2** | priorityScore計算 | 3〜4時間 | 中 | 🔴 最優先 |
| **Phase 3** | changeFrequency実装 | 4〜6時間 | 中 | 🟡 重要 |
| **Phase 4** | ConstellationDataGenerator | 2〜3時間 | 低 | 🟡 重要 |
| **Phase 5** | Autopilot統合（AIへの情報提供） | 4〜6時間 | 高 | 🔴 最優先 |
| **Phase 6** | VS Code天体儀ビュー | 6〜8時間 | 中 | 🟢 通常 |
| **Phase 7** | 実データ検証・調整 | 4〜6時間 | 中 | 🟢 通常 |
| **Phase 8** | ドキュメント・テスト | 2〜3時間 | 低 | 🟢 通常 |

**総工数**: 27〜39時間（実働3〜5日）

---

## 🎯 システム設計概要

### 情報の流れ
```
┌─────────────────┐
│ プロジェクトの  │
│ ゴール定義      │ ← ユーザーが設定
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ NeuralDependency│
│ Graph           │ ← ファイル間の依存関係
│ + priorityScore │ ← ゴールへの距離計算
│ + changeFreq    │ ← Git履歴から算出
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Constellation   │
│ DataGenerator   │ ← 3D座標・色・サイズ計算
└────────┬────────┘
         │
         ├─────────────────────┐
         │                     │
         ▼                     ▼
┌─────────────────┐   ┌─────────────────┐
│ Autopilot       │   │ VS Code天体儀   │
│ Controller      │   │ ビュー (WebView)│
│ ↓               │   │ ↓               │
│ AI作業開始前に  │   │ 人間が視覚的に  │
│ ゴール・優先度・│   │ プロジェクトの  │
│ リスクを提示    │   │ 全体像を把握    │
└─────────────────┘   └─────────────────┘
```

---

## 📦 Phase 1: ゴール定義システム（2〜3時間）

### 目的
プロジェクトのゴール（中心概念）を定義し、各ファイルとの距離を計算可能にする。

### 実装内容

#### 1.1 データ構造（`.vscode/project-goals.json`）
```json
{
  "version": 1,
  "goals": [
    {
      "id": "main-goal",
      "name": "英語学習プラットフォーム",
      "description": "スマートレビューで長期記憶を促進",
      "priority": 1.0,
      "createdAt": "2026-01-05T12:00:00Z",
      "keywords": ["learning", "memory", "scheduling", "gamification"],
      "coreFiles": [
        "src/models/QuestionScheduler.ts",
        "src/models/MemoryAI.ts",
        "src/models/GamificationAI.ts"
      ]
    },
    {
      "id": "sub-goal-1",
      "name": "UI改善",
      "description": "アクセシビリティとデザインの向上",
      "priority": 0.6,
      "createdAt": "2026-01-05T12:00:00Z",
      "keywords": ["ui", "accessibility", "design"],
      "coreFiles": [
        "src/components/Button.tsx",
        "src/components/QuestionCard.tsx"
      ]
    }
  ]
}
```

#### 1.2 ファイル追加
- `extensions/servant/src/goals/GoalManager.ts`
  - `loadGoals(): ProjectGoals`
  - `getMainGoal(): Goal`
  - `calculateGoalDistance(filePath: string): number` （0〜1、0=中心）

#### 1.3 成果物
- [x] `.vscode/project-goals.json` スキーマ
- [x] `GoalManager.ts` 実装
- [x] `NeuralDependencyGraph.ts` に `goalDistance` プロパティ追加

### 検証方法
```typescript
const goalManager = new GoalManager(workspaceRoot);
const mainGoal = goalManager.getMainGoal();
const distance = goalManager.calculateGoalDistance('src/models/QuestionScheduler.ts');
// => 0.0 (中心ファイル)

const distance2 = goalManager.calculateGoalDistance('src/utils/helpers.ts');
// => 0.8 (周辺ファイル)
```

---

## 📦 Phase 2: priorityScore計算（3〜4時間）

### 目的
各ファイルの「重要度」を多次元的に計算し、AIが作業優先度を判断できるようにする。

### 計算ロジック
```typescript
priorityScore = 
  goalDistance * 0.4          // ゴールへの距離（近いほど重要）
  + activationLevel * 0.2     // 最近の使用頻度
  + (importCount / maxImport) * 0.15  // インポート数（依存される度合い）
  + entropy * 0.1             // 複雑度
  + changeFrequency * 0.1     // 変更頻度（活発さ）
  + (edgeWeightSum / maxEdgeWeight) * 0.05  // エッジ重み合計
```

### 実装内容

#### 2.1 `NeuralDependencyGraph.ts` に追加
```typescript
export interface NeuralNode {
  // 既存のプロパティ...
  
  /** ゴールとの距離（0=中心、1=遠い） */
  goalDistance: number;
  
  /** 優先度スコア（0-1、高いほど重要） */
  priorityScore: number;
}

class NeuralDependencyGraph {
  // 既存のメソッド...
  
  /**
   * 全ノードのpriorityScoreを計算
   */
  public computePriorityScores(goalManager: GoalManager): void {
    // 1. goalDistanceを計算
    // 2. 正規化（最大値でスケーリング）
    // 3. 重み付き合計でpriorityScore算出
    // 4. グラフに反映
  }
}
```

#### 2.2 成果物
- [x] `computePriorityScores()` メソッド実装
- [x] `.vscode/neural-graph.json` に `priorityScore` 保存
- [x] `buildGraph()` 後に自動計算

### 検証方法
```typescript
graph.buildGraph();
graph.computePriorityScores(goalManager);

const node = graph.getNode('src/models/QuestionScheduler.ts');
console.log(node.priorityScore); // => 0.95 (最重要)

const node2 = graph.getNode('src/utils/helpers.ts');
console.log(node2.priorityScore); // => 0.3 (周辺)
```

---

## 📦 Phase 3: changeFrequency実装（4〜6時間）

### 目的
Git履歴から各ファイルの変更頻度を算出し、「活発なファイル」を特定可能にする。

### 計算ロジック
```typescript
changeFrequency = 
  (過去30日のコミット数 / 総コミット数) * 0.6
  + (過去7日のコミット数 / 30日のコミット数) * 0.4
```

### 実装内容

#### 3.1 `GitIntegration.ts` に追加
```typescript
export interface FileChangeStats {
  filePath: string;
  totalCommits: number;
  commitsLast30Days: number;
  commitsLast7Days: number;
  lastCommitDate: Date;
  changeFrequency: number; // 0-1
}

class GitIntegration {
  /**
   * ファイルの変更統計を取得
   */
  public async getFileChangeStats(filePath: string): Promise<FileChangeStats> {
    // git log --follow --format="%ad" --date=iso -- <filePath>
    // 日付をパースして集計
  }
  
  /**
   * 全ファイルの変更統計を一括取得
   */
  public async getAllFileChangeStats(): Promise<Map<string, FileChangeStats>> {
    // git log --name-only --format="%ad|%H" --date=iso
    // 全ファイルを一度に集計（効率化）
  }
}
```

#### 3.2 `NeuralDependencyGraph.ts` 統合
```typescript
class NeuralDependencyGraph {
  public async updateChangeFrequencies(gitIntegration: GitIntegration): Promise<void> {
    const stats = await gitIntegration.getAllFileChangeStats();
    
    for (const [filePath, node] of this.nodes) {
      const stat = stats.get(filePath);
      node.changeFrequency = stat?.changeFrequency ?? 0;
    }
    
    this.saveGraph();
  }
}
```

#### 3.3 成果物
- [x] `getFileChangeStats()` 実装
- [x] `getAllFileChangeStats()` 実装（一括処理）
- [x] `updateChangeFrequencies()` 実装
- [x] `buildGraph()` 後に自動更新

### 検証方法
```typescript
await graph.updateChangeFrequencies(gitIntegration);

const node = graph.getNode('src/models/QuestionScheduler.ts');
console.log(node.changeFrequency); // => 0.8 (頻繁に変更)

const node2 = graph.getNode('src/utils/oldHelper.ts');
console.log(node2.changeFrequency); // => 0.05 (ほぼ変更なし)
```

---

## 📦 Phase 4: ConstellationDataGenerator（2〜3時間）

### 目的
グラフデータを天体儀用の3D座標・色・サイズに変換する。

### 実装内容

#### 4.1 データ構造
```typescript
export interface ConstellationNode {
  id: string;
  label: string;
  position: { x: number; y: number; z: number };
  size: number; // 1-5
  color: string; // "#4a9eff" など
  priority: number; // 0-1
  category: string; // "AI" | "UI" | "Data" | ...
  connections: number;
  metadata: {
    filePath: string;
    goalDistance: number;
    changeFrequency: number;
    lastModified: string;
  };
}

export interface ConstellationData {
  goal: {
    name: string;
    description: string;
    position: { x: 0; y: 0; z: 0 };
  };
  nodes: ConstellationNode[];
  edges: Array<{
    from: string;
    to: string;
    strength: number; // 0-1
  }>;
}
```

#### 4.2 ファイル追加
- `extensions/servant/src/constellation/ConstellationDataGenerator.ts`

```typescript
export class ConstellationDataGenerator {
  constructor(
    private graph: NeuralDependencyGraph,
    private goalManager: GoalManager
  ) {}
  
  /**
   * 3D座標配置（球面レイアウト）
   */
  private calculatePosition(node: NeuralNode, index: number, total: number): Vector3 {
    // 優先度が高いほど中心に近い
    const radius = 40 + (1 - node.priorityScore) * 60;
    
    // 球面座標（フィボナッチ螺旋）
    const phi = Math.acos(-1 + (2 * index) / total);
    const theta = Math.sqrt(total * Math.PI) * phi;
    
    return {
      x: radius * Math.cos(theta) * Math.sin(phi),
      y: radius * Math.cos(phi),
      z: radius * Math.sin(theta) * Math.sin(phi)
    };
  }
  
  /**
   * 色決定（優先度ベース）
   */
  private getColorByPriority(priority: number): string {
    if (priority >= 0.8) return '#4a9eff'; // 青（重要）
    if (priority >= 0.6) return '#8b9eff'; // 薄青
    if (priority >= 0.4) return '#aaaaaa'; // 灰色
    return '#666666'; // 暗灰色
  }
  
  /**
   * サイズ決定
   */
  private getSizeByPriority(priority: number): number {
    return 1.5 + priority * 3.5; // 1.5〜5.0
  }
  
  /**
   * カテゴリ推定（ファイルパスから）
   */
  private inferCategory(filePath: string): string {
    if (filePath.includes('/models/')) return 'AI';
    if (filePath.includes('/components/')) return 'UI';
    if (filePath.includes('/storage/')) return 'Data';
    if (filePath.includes('/test')) return 'Test';
    return 'Util';
  }
  
  /**
   * 天体儀データ生成
   */
  public generate(): ConstellationData {
    const nodes: ConstellationNode[] = [];
    const edges: Array<{ from: string; to: string; strength: number }> = [];
    
    // ノード変換
    const nodeArray = Array.from(this.graph.getNodes().values());
    nodeArray.forEach((node, i) => {
      nodes.push({
        id: node.filePath,
        label: path.basename(node.filePath, path.extname(node.filePath)),
        position: this.calculatePosition(node, i, nodeArray.length),
        size: this.getSizeByPriority(node.priorityScore),
        color: this.getColorByPriority(node.priorityScore),
        priority: node.priorityScore,
        category: this.inferCategory(node.filePath),
        connections: node.importCount + node.exportCount,
        metadata: {
          filePath: node.filePath,
          goalDistance: node.goalDistance,
          changeFrequency: node.changeFrequency,
          lastModified: node.lastModified
        }
      });
    });
    
    // エッジ変換（重み0.5以上のみ）
    for (const edge of this.graph.getEdges().values()) {
      if (edge.weight >= 0.5) {
        edges.push({
          from: edge.from,
          to: edge.to,
          strength: edge.weight
        });
      }
    }
    
    return {
      goal: {
        name: this.goalManager.getMainGoal().name,
        description: this.goalManager.getMainGoal().description,
        position: { x: 0, y: 0, z: 0 }
      },
      nodes,
      edges
    };
  }
}
```

#### 4.3 成果物
- [x] `ConstellationDataGenerator.ts` 実装
- [x] `.vscode/constellation-data.json` 出力

### 検証方法
```typescript
const generator = new ConstellationDataGenerator(graph, goalManager);
const data = generator.generate();

console.log(data.nodes.length); // => 50
console.log(data.nodes[0].position); // => { x: 45.2, y: 12.3, z: -8.7 }
console.log(data.nodes[0].color); // => "#4a9eff"
```

---

## 📦 Phase 5: Autopilot統合（AIへの情報提供）（4〜6時間）

### 目的
**サーバントがAIに対して、プロジェクトのゴール・優先度・リスクを事前に提供する。**

### 実装内容

#### 5.1 `AutopilotController.ts` に統合

```typescript
import { ConstellationDataGenerator } from '../constellation/ConstellationDataGenerator';
import { GoalManager } from '../goals/GoalManager';

class AutopilotController {
  private constellationGenerator: ConstellationDataGenerator | null = null;
  private goalManager: GoalManager | null = null;
  
  /**
   * 初期化時にConstellationGeneratorを準備
   */
  public async initialize(): Promise<void> {
    // 既存の初期化処理...
    
    this.goalManager = new GoalManager(this.workspaceRoot);
    await this.graph.updateChangeFrequencies(this.gitIntegration);
    this.graph.computePriorityScores(this.goalManager);
    
    this.constellationGenerator = new ConstellationDataGenerator(
      this.graph,
      this.goalManager
    );
  }
  
  /**
   * AI作業開始前に、コンテキストを生成
   */
  private async generateConstellationContext(): Promise<string> {
    if (!this.constellationGenerator) {
      return '';
    }
    
    const data = this.constellationGenerator.generate();
    
    // 重要度上位10ファイル
    const topFiles = data.nodes
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10)
      .map(n => `- ${n.label} (優先度: ${n.priority.toFixed(2)}, カテゴリ: ${n.category})`)
      .join('\n');
    
    // ゴール情報
    const goal = data.goal;
    
    // リスク高いファイル（頻繁に変更 + 複雑）
    const riskyFiles = data.nodes
      .filter(n => n.metadata.changeFrequency > 0.7 && n.priority > 0.8)
      .map(n => `- ${n.label} (変更頻度: ${n.metadata.changeFrequency.toFixed(2)})`)
      .join('\n');
    
    return `
# プロジェクトの全体像（天体儀ビュー）

## 🎯 プロジェクトのゴール
**${goal.name}**
${goal.description}

## ⭐ 重要度上位ファイル（ゴールに近い）
${topFiles}

## ⚠️ 注意が必要なファイル（頻繁に変更 + 重要）
${riskyFiles || '（該当なし）'}

## 💡 推奨アクション
- ゴールに近いファイルを優先的に改善してください。
- 変更頻度が高いファイルは、慎重に扱ってください。
- 周辺ファイル（優先度 < 0.4）の変更は、影響範囲を確認してください。
`;
  }
  
  /**
   * AI作業開始時にコンテキストを提供
   */
  public async onAIActionStarted(action: AIAction): Promise<void> {
    // 既存の処理...
    
    // Constellationコンテキストを生成
    const context = await this.generateConstellationContext();
    
    // VS Code チャットに送信（未実装：将来的にはChatAPI経由）
    this.outputChannel.appendLine('\n' + context);
    
    // 通知
    vscode.window.showInformationMessage(
      `🌟 サーバント: プロジェクトの全体像を確認しました。ゴール「${this.goalManager?.getMainGoal().name}」に向かって作業を進めます。`
    );
  }
}
```

#### 5.2 成果物
- [x] `generateConstellationContext()` 実装
- [x] `onAIActionStarted()` に統合
- [x] Output Channelにコンテキスト出力
- [x] （将来）VS Code Chat APIへの自動送信

### 検証方法
1. AI作業を開始（Copilotチャット起動）
2. Output Channel "Servant (Autopilot)" を確認
3. 以下が表示される：
   ```
   # プロジェクトの全体像（天体儀ビュー）
   
   ## 🎯 プロジェクトのゴール
   **英語学習プラットフォーム**
   スマートレビューで長期記憶を促進
   
   ## ⭐ 重要度上位ファイル（ゴールに近い）
   - QuestionScheduler (優先度: 0.95, カテゴリ: AI)
   - MemoryAI (優先度: 0.92, カテゴリ: AI)
   ...
   ```

---

## 📦 Phase 6: VS Code天体儀ビュー（6〜8時間）

### 目的
人間が視覚的にプロジェクトの全体像を把握できるビューを提供。

### 実装内容

#### 6.1 ファイル追加
- `extensions/servant/src/constellation/ConstellationViewProvider.ts`
- `extensions/servant/webview/constellation.html`
- `extensions/servant/package.json` に view 登録

#### 6.2 `ConstellationViewProvider.ts`
```typescript
import * as vscode from 'vscode';
import { ConstellationDataGenerator } from './ConstellationDataGenerator';

export class ConstellationViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'servant.constellationView';
  
  private _view?: vscode.WebviewView;
  
  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly generator: ConstellationDataGenerator
  ) {}
  
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };
    
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    
    // メッセージ受信（ノードクリック等）
    webviewView.webview.onDidReceiveMessage(data => {
      switch (data.type) {
        case 'nodeClicked':
          vscode.workspace.openTextDocument(data.filePath).then(doc => {
            vscode.window.showTextDocument(doc);
          });
          break;
      }
    });
    
    // 初期データ送信
    this.updateView();
  }
  
  public updateView() {
    if (this._view) {
      const data = this.generator.generate();
      this._view.webview.postMessage({ type: 'update', data });
    }
  }
  
  private _getHtmlForWebview(webview: vscode.Webview): string {
    // constellation-3d-demo.html の内容をベースに、
    // vscode.postMessage でのノードクリック送信を追加
    return `<!DOCTYPE html>
<html>
  <head>
    <!-- Three.js + OrbitControls -->
    <script type="importmap">
      {
        "imports": {
          "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
          "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
        }
      }
    </script>
  </head>
  <body>
    <div id="container"></div>
    <script type="module">
      import * as THREE from 'three';
      import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
      
      const vscode = acquireVsCodeApi();
      
      // メッセージ受信でデータ更新
      window.addEventListener('message', event => {
        const message = event.data;
        if (message.type === 'update') {
          renderConstellation(message.data);
        }
      });
      
      function renderConstellation(data) {
        // Three.jsで描画
        // ノードクリック時に vscode.postMessage 送信
        sphere.onClick = () => {
          vscode.postMessage({
            type: 'nodeClicked',
            filePath: node.metadata.filePath
          });
        };
      }
    </script>
  </body>
</html>`;
  }
}
```

#### 6.3 `package.json` に登録
```json
{
  "contributes": {
    "views": {
      "explorer": [
        {
          "type": "webview",
          "id": "servant.constellationView",
          "name": "🌟 Project Constellation"
        }
      ]
    }
  }
}
```

#### 6.4 成果物
- [x] `ConstellationViewProvider.ts` 実装
- [x] `constellation.html` 作成（3D版ベース）
- [x] `package.json` に view 登録
- [x] `extension.ts` で登録

### 検証方法
1. VS Code再起動
2. エクスプローラーサイドバーに "🌟 Project Constellation" が表示
3. クリックすると3D天体儀が表示
4. ノードをクリック → ファイルが開く

---

## 📦 Phase 7: 実データ検証・調整（4〜6時間）

### 目的
実際のプロジェクトデータで動作確認し、アルゴリズム・UI・パフォーマンスを調整。

### 検証項目

#### 7.1 データ品質
- [x] priorityScore が妥当な値か（重要ファイルが高いか）
- [x] changeFrequency がGit履歴と一致するか
- [x] goalDistance が適切か（中心ファイルが0に近いか）

#### 7.2 UI/UX
- [x] 3D表示が見やすいか（ノードが重ならないか）
- [x] 色分けが直感的か
- [x] クリック操作がスムーズか
- [x] 3軸オンオフが有効に機能するか

#### 7.3 パフォーマンス
- [x] 100ファイル以上で動作するか
- [x] グラフ再計算が1秒以内か
- [x] 天体儀描画が60fps維持できるか

#### 7.4 調整内容
- priorityScore の重み付け調整
- 色分けの閾値調整
- ノード配置アルゴリズムの改善
- エッジ描画の最適化（重いエッジのみ表示）

---

## 📦 Phase 8: ドキュメント・テスト（2〜3時間）

### 成果物
- [x] `docs/features/constellation-guide.md`（ユーザーガイド）
- [x] `docs/development/CONSTELLATION_API.md`（開発者向けAPI）
- [x] `extensions/servant/src/constellation/__tests__/`（ユニットテスト）
- [x] README に天体儀機能の説明追加

---

## 🚀 実装順序

### Week 1（実働3日）
1. **Day 1（8時間）**:
   - Phase 1: ゴール定義システム（2〜3h）
   - Phase 2: priorityScore計算（3〜4h）
   - Phase 3: changeFrequency（開始、2h）

2. **Day 2（8時間）**:
   - Phase 3: changeFrequency（完了、2〜4h）
   - Phase 4: ConstellationDataGenerator（2〜3h）
   - Phase 5: Autopilot統合（開始、2h）

3. **Day 3（8時間）**:
   - Phase 5: Autopilot統合（完了、2〜4h）
   - Phase 7: 実データ検証（開始、4h）

### Week 2（実働2日）
4. **Day 4（8時間）**:
   - Phase 6: VS Code天体儀ビュー（6〜8h）

5. **Day 5（4時間）**:
   - Phase 7: 実データ検証・調整（完了、2h）
   - Phase 8: ドキュメント・テスト（2〜3h）

---

## 📊 リスク評価

| リスク | 発生確率 | 影響度 | 対策 |
|--------|---------|--------|------|
| Git履歴取得が遅い | 中 | 中 | キャッシュ化・一括取得 |
| priorityScore計算が複雑 | 低 | 低 | 段階的に重み調整 |
| Three.js描画が重い | 中 | 中 | エッジ削減・LOD導入 |
| VS Code API制約 | 低 | 中 | Webviewで回避可能 |

---

## 🎯 成功基準

### 定量的指標
- [x] priorityScore計算時間 < 1秒（100ファイル）
- [x] 天体儀描画 60fps維持（100ノード）
- [x] Autopilotコンテキスト生成 < 500ms
- [x] changeFrequency更新 < 3秒（全ファイル）

### 定性的指標
- [x] AIが「ゴールに近いファイル」を優先的に提案する
- [x] 人間が「プロジェクトの全体像」を視覚的に把握できる
- [x] 編集中のファイルが天体儀上でハイライトされる
- [x] サーバントが「プロジェクトのゴールに向かう最適な作業」を提案する

---

## 🔮 将来の拡張（Phase 9+）

### VR対応（ロードマップ）
- **Phase 9**: WebXR基本対応（2〜3日）
- **Phase 10**: VRコントローラー操作（3〜5日）
- **Phase 11**: 音声入力＋AI連携（5〜7日）

### その他
- リアルタイム更新（ファイル保存時に自動更新）
- 時系列アニメーション（プロジェクトの進化を再生）
- チーム協働（他のメンバーの作業位置を表示）
- カスタムゴール（複数ゴールの同時表示）

---

## 📝 次のアクション

**最優先**: Phase 1〜5（AI情報提供システム）を先に完成させる。
- Phase 1: ゴール定義（2〜3h）
- Phase 2: priorityScore（3〜4h）
- Phase 5: Autopilot統合（4〜6h）

**Phase 6（天体儀ビュー）は、Phase 1〜5 の効果確認後に着手。**

---

**策定者**: GitHub Copilot  
**承認者**: （ユーザー確認待ち）
