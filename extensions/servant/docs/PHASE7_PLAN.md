# Phase 7: 適応的学習システム統合

## 🎯 目標

既存プロジェクトの**適応的ガードシステム**をServant拡張機能に統合し、AIが経験から学習して成長する仕組みを実装。

---

## 📋 実装タスク

### Task 1: AdaptiveGuard 実装（2時間）

#### ファイル
- `src/learning/AdaptiveGuard.ts` (新規, 250行)
- `src/learning/FailurePattern.ts` (新規, 80行)

#### 機能
1. **違反記録**
   ```typescript
   recordViolation(violation: Violation): Promise<void>
   // - failure-patterns.json に記録
   // - occurrences += 1
   // - weight 更新（+0.1, 最大1.0）
   ```

2. **学習サイクル**
   ```typescript
   triggerLearning(): Promise<void>
   // - 15回の検証ごとに自動学習
   // - Instructions 自動更新
   // - カウントリセット
   ```

3. **パターン分析**
   ```typescript
   analyzePatterns(): FailurePattern[]
   // - 高頻度パターン抽出
   // - 重み付け（0.1-1.0）
   // - ホットスポット検出
   ```

#### データ構造
```typescript
interface FailurePattern {
  pattern: string;           // 失敗パターン名
  category: string;          // カテゴリ（naming, structure, etc.）
  occurrences: number;       // 発生回数
  weight: number;            // 重み（0.1-1.0）
  lastOccurred: string;      // 最終発生日
  examples: string[];        // 例
  recoveries: number;        // 復旧回数
  successRate: number;       // 復旧成功率
}
```

---

### Task 2: GitHistoryAnalyzer 実装（2時間）

#### ファイル
- `src/learning/GitHistoryAnalyzer.ts` (新規, 300行)

#### 機能
1. **Git履歴解析**
   ```typescript
   analyzeRecentCommits(limit: number): Promise<CommitAnalysis[]>
   // - 直近N件のコミットを解析
   // - 変更ファイル抽出
   // - Instructions違反を検出
   ```

2. **ホットスポット検出**
   ```typescript
   detectHotspots(): Promise<FileHotspot[]>
   // - 頻繁に変更されるファイル
   // - 違反が多発するファイル
   // - リスクスコア計算
   ```

3. **パターン抽出**
   ```typescript
   extractFailurePatterns(): Promise<FailurePattern[]>
   // - コミット間の変更を分析
   // - 繰り返される失敗を検出
   // - 自動的にパターン化
   ```

#### Git連携
```typescript
interface CommitAnalysis {
  hash: string;
  message: string;
  files: string[];
  violations: Violation[];
  timestamp: Date;
}

interface FileHotspot {
  file: string;
  changeCount: number;
  violationCount: number;
  riskScore: number;  // changeCount * violationCount
}
```

---

### Task 3: ProjectContextDB 実装（3時間）

#### ファイル
- `src/context/ProjectContextDB.ts` (新規, 400行)
- `src/context/DependencyGraph.ts` (新規, 200行)

#### 機能
1. **プロジェクトインデックス**
   ```typescript
   indexProject(): Promise<void>
   // - ファイル構造解析
   // - 依存関係グラフ構築
   // - Instructions マッピング
   ```

2. **コンテキスト提供**
   ```typescript
   getContextForFile(filePath: string): Promise<FileContext>
   // - 関連ファイルリスト
   // - 適用される Instructions
   // - 依存関係情報
   ```

3. **AI向け情報収集**
   ```typescript
   collectContextForAI(task: string): Promise<AIContext>
   // - タスク分析
   // - 必要なファイル推測
   // - 設計パターン提案
   ```

#### データ構造
```typescript
interface ProjectIndex {
  files: Map<string, FileInfo>;
  dependencies: DependencyGraph;
  instructionsMap: Map<string, Instruction[]>;
}

interface FileContext {
  file: string;
  relatedFiles: string[];
  instructions: Instruction[];
  dependencies: {
    imports: string[];
    importedBy: string[];
  };
}

interface AIContext {
  task: string;
  relevantFiles: string[];
  suggestedActions: string[];
  warnings: string[];
  examples: CodeExample[];
}
```

---

### Task 4: 設定・コマンド追加（1時間）

#### package.json 更新

**新しい設定**:
```json
"servant.learning.enabled": {
  "type": "boolean",
  "default": true,
  "description": "Enable adaptive learning from failures"
},
"servant.learning.cycleSize": {
  "type": "number",
  "default": 15,
  "description": "Number of validations before automatic learning"
},
"servant.learning.autoUpdateInstructions": {
  "type": "boolean",
  "default": true,
  "description": "Automatically update Instructions after learning"
},
"servant.learning.gitHistoryLimit": {
  "type": "number",
  "default": 100,
  "description": "Number of recent commits to analyze"
}
```

**新しいコマンド**:
```json
{
  "command": "servant.learnFromHistory",
  "title": "Servant: Learn from Git History"
},
{
  "command": "servant.showHotspots",
  "title": "Servant: Show Problem Hotspots"
},
{
  "command": "servant.showLearningStats",
  "title": "Servant: Show Learning Statistics"
},
{
  "command": "servant.resetLearning",
  "title": "Servant: Reset Learning Data"
}
```

---

## 🔗 統合ポイント

### extension.ts への統合

```typescript
// Phase 7: 学習システム初期化
const adaptiveGuard = new AdaptiveGuard(context);
const gitAnalyzer = new GitHistoryAnalyzer(workspaceRoot);
const contextDB = new ProjectContextDB(workspaceRoot);

// プロジェクトインデックス構築
await contextDB.indexProject();

// バリデーション後のフック
diagnosticCollection.onDidChangeDiagnostics(async () => {
  const violations = getAllViolations();
  await adaptiveGuard.recordViolations(violations);
  await adaptiveGuard.checkLearningCycle();
});

// コマンド登録
context.subscriptions.push(
  vscode.commands.registerCommand('servant.learnFromHistory', async () => {
    const patterns = await gitAnalyzer.analyzeRecentCommits(100);
    await adaptiveGuard.updatePatterns(patterns);
    vscode.window.showInformationMessage(`学習完了: ${patterns.length}パターン抽出`);
  })
);
```

---

## 📊 期待される効果

### 学習前
```
違反検出 → Problems パネルに表示 → 終わり
```

### 学習後
```
違反検出 → failure-patterns.json に記録
         ↓
    15回の違反蓄積
         ↓
    自動学習実行
         ↓
    Instructions 自動更新
         ↓
    次回から同じ違反を強調警告
```

---

## 🧪 テスト計画

### 新規テストファイル
1. `tests/AdaptiveGuard.test.ts` (15 tests)
   - 違反記録
   - 学習サイクル
   - パターン更新

2. `tests/GitHistoryAnalyzer.test.ts` (12 tests)
   - コミット解析
   - ホットスポット検出
   - パターン抽出

3. `tests/ProjectContextDB.test.ts` (18 tests)
   - インデックス構築
   - コンテキスト取得
   - 依存関係解析

**合計**: 45テスト → 全体で **100テスト**

---

## 📅 実装スケジュール

| タスク | 所要時間 | 累計 |
|--------|---------|------|
| Task 1: AdaptiveGuard | 2時間 | 2時間 |
| Task 2: GitHistoryAnalyzer | 2時間 | 4時間 |
| Task 3: ProjectContextDB | 3時間 | 7時間 |
| Task 4: 設定・コマンド | 1時間 | 8時間 |
| **合計** | **8時間** | - |

---

## 🎯 成功基準

- ✅ 全100テストが100%パス
- ✅ 15回の検証後に自動学習が動作
- ✅ Git履歴から失敗パターンを抽出
- ✅ プロジェクトインデックスが正常に構築
- ✅ コンパイルエラー0
- ✅ VSIXファイル生成成功（servant-0.3.0.vsix）

---

**Phase 7 完了後、Servant は:**
- リアルタイム監視 ✅
- 自動修正 ✅
- Pre-commit ガード ✅
- **経験から学習** 🆕
- **プロジェクトを理解** 🆕
- **AIの作業を効率化** 🆕
