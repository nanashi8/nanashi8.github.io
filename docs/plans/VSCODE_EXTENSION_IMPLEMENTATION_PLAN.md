---
title: VSCode Extension実装計画
description: Instructions違反をリアルタイム検出するVSCode拡張機能の開発計画
created: 2025-12-31
status: planning
category: implementation-plan
phase: design
---

# 🔧 VSCode Extension実装計画

## 📋 プロジェクト概要

### 目的
`.aitk/instructions/*.instructions.md` を読んで**コード入力中にリアルタイムで違反を検出**し、赤波線で警告するVSCode拡張機能を開発する。

### 主要機能
- ✅ **リアルタイム検出**: タイプ中にinstructions違反を即座に検知
- ✅ **AIコード監視**: AIが書いたコードも同様に検証（「AIを監視する番人」）
- ✅ **3層構造統合**: Entry Point → Category Index → Individual Instructionsとの連携
- ✅ **Decision Trees連携**: 判断自動化ツールとしてのDecision Trees活用
- ✅ **pre-commit連携**: 既存のガードシステムと統合

### 差別化ポイント
- **既存拡張機能にはない独自性**（マーケットプレイス調査済み）
- Markdown形式のinstructionsファイル対応
- プロジェクト固有ルールのリアルタイム監視
- 3層構造アーキテクチャとの深い統合

---

## 🏗️ 技術スタック

### 基盤技術

| 技術要素 | 選定理由 | バージョン |
|---------|---------|----------|
| **VSCode Extension API** | VSCode公式API、診断機能（赤波線）を提供 | 最新安定版 |
| **TypeScript** | 型安全性、既存プロジェクトとの統合 | 5.x |
| **Language Server Protocol (LSP)** | リアルタイム解析、パフォーマンス最適化 | 最新 |

### 開発ツール

| ツール | 用途 |
|-------|------|
| **Yeoman Generator** | 拡張機能プロジェクトのスキャフォールディング |
| **@vscode/test-electron** | E2Eテスト |
| **Vitest** | ユニットテスト |
| **ESLint** | コード品質管理 |

---

## 📐 アーキテクチャ設計

### システム構成図

```
┌─────────────────────────────────────────────────────┐
│                   VSCode Editor                      │
│  ┌───────────────────────────────────────────────┐  │
│  │         Diagnostics Provider (赤波線)          │  │
│  └───────────────────────────────────────────────┘  │
│                         ↕                            │
│  ┌───────────────────────────────────────────────┐  │
│  │        Extension Host (Main Process)          │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │   Instructions Validator (Core Engine)  │  │  │
│  │  │   - Parser (Markdown → AST)            │  │  │
│  │  │   - Rule Engine (違反検出ロジック)      │  │  │
│  │  │   - Severity Classifier (CRITICAL/INFO) │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │                     ↕                          │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │    Instructions Loader                  │  │  │
│  │  │    - INDEX.md → Category Index →        │  │  │
│  │  │      Individual Instructions            │  │  │
│  │  │    - Decision Trees Integration         │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### コンポーネント設計

#### 1. Extension Activator
**責務**: 拡張機能のライフサイクル管理

```typescript
// src/extension.ts
export function activate(context: vscode.ExtensionContext) {
  // Instructions Loaderの初期化
  const loader = new InstructionsLoader(context);
  
  // Diagnostics Providerの登録
  const diagnosticsProvider = new InstructionsDiagnosticsProvider(loader);
  
  // ファイル変更監視
  const watcher = vscode.workspace.createFileSystemWatcher(
    '**/*.{ts,tsx,js,jsx,md,json}'
  );
  
  watcher.onDidChange(uri => diagnosticsProvider.validate(uri));
  watcher.onDidCreate(uri => diagnosticsProvider.validate(uri));
}
```

#### 2. Instructions Loader
**責務**: 3層構造のinstructionsファイル読み込み

```typescript
// src/loader/InstructionsLoader.ts
export class InstructionsLoader {
  private entryPoint: EntryPointInstruction | null = null;
  private categoryIndices: Map<string, CategoryIndex> = new Map();
  private individualInstructions: Map<string, IndividualInstruction> = new Map();
  private decisionTrees: Map<string, DecisionTree> = new Map();
  
  async load(): Promise<void> {
    // 1. Entry Point読み込み
    this.entryPoint = await this.parseMarkdown('.aitk/instructions/INDEX.md');
    
    // 2. Category Index読み込み
    const categories = await this.loadCategoryIndices();
    
    // 3. Individual Instructions読み込み
    const instructions = await this.loadIndividualInstructions();
    
    // 4. Decision Trees読み込み
    const trees = await this.loadDecisionTrees();
  }
  
  private async parseMarkdown(path: string): Promise<Instruction> {
    const content = await vscode.workspace.fs.readFile(
      vscode.Uri.file(path)
    );
    return this.parser.parse(content.toString());
  }
}
```

#### 3. Rule Engine
**責務**: 違反検出ロジック

```typescript
// src/engine/RuleEngine.ts
export class RuleEngine {
  validate(
    document: vscode.TextDocument,
    instructions: Instruction[]
  ): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    
    for (const instruction of instructions) {
      // MUST/MUST NOT/SHOULD/CRITICAL等のルール検出
      const violations = this.detectViolations(document, instruction);
      
      for (const violation of violations) {
        diagnostics.push(this.createDiagnostic(violation));
      }
    }
    
    return diagnostics;
  }
  
  private detectViolations(
    document: vscode.TextDocument,
    instruction: Instruction
  ): Violation[] {
    const violations: Violation[] = [];
    
    // 例: Position階層不変条件チェック
    if (instruction.id === 'position-invariant-conditions') {
      violations.push(...this.checkPositionInvariant(document));
    }
    
    // 例: バッチ方式3原則チェック
    if (instruction.id === 'batch-processing-principles') {
      violations.push(...this.checkBatchPrinciples(document));
    }
    
    return violations;
  }
}
```

#### 4. Diagnostics Provider
**責務**: VSCodeへの診断結果通知（赤波線表示）

```typescript
// src/providers/InstructionsDiagnosticsProvider.ts
export class InstructionsDiagnosticsProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;
  
  constructor(private loader: InstructionsLoader) {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection(
      'instructions-validator'
    );
  }
  
  async validate(uri: vscode.Uri): Promise<void> {
    const document = await vscode.workspace.openTextDocument(uri);
    const instructions = this.loader.getApplicableInstructions(document);
    
    const diagnostics = this.ruleEngine.validate(document, instructions);
    
    this.diagnosticCollection.set(uri, diagnostics);
  }
  
  private createDiagnostic(violation: Violation): vscode.Diagnostic {
    const diagnostic = new vscode.Diagnostic(
      violation.range,
      violation.message,
      this.getSeverity(violation.severity)
    );
    
    diagnostic.source = 'Instructions Validator';
    diagnostic.code = violation.ruleId;
    
    // Quick Fix提案
    if (violation.suggestedFix) {
      diagnostic.relatedInformation = [
        new vscode.DiagnosticRelatedInformation(
          new vscode.Location(violation.range.uri, violation.range),
          violation.suggestedFix
        )
      ];
    }
    
    return diagnostic;
  }
  
  private getSeverity(severity: string): vscode.DiagnosticSeverity {
    switch (severity) {
      case 'CRITICAL': return vscode.DiagnosticSeverity.Error;
      case 'WARNING': return vscode.DiagnosticSeverity.Warning;
      case 'INFO': return vscode.DiagnosticSeverity.Information;
      default: return vscode.DiagnosticSeverity.Hint;
    }
  }
}
```

---

## 🚀 開発フェーズ（段階的実装）

### Phase 1: MVP（最小機能製品）【2週間】

#### 目標
**基本的な違反検出機能の実装**

#### スコープ
- [x] プロジェクトスキャフォールディング
- [ ] Instructions Loader（Entry Point + 3層構造）
- [ ] Markdown Parser（frontmatterパース）
- [ ] Rule Engine（基本的な違反検出ロジック）
  - Position階層不変条件
  - バッチ方式3原則
  - MUST/MUST NOT検出
- [ ] Diagnostics Provider（赤波線表示）
- [ ] ユニットテスト（カバレッジ80%以上）

#### 成果物
- 動作するVSCode拡張機能（ローカル実行可能）
- テストスイート
- README（インストール手順）

---

### Phase 2: Decision Trees統合【1週間】

#### 目標
**Decision Treesとの連携で判断自動化**

#### スコープ
- [ ] Decision Trees Parser（Mermaid図パース）
- [ ] 条件分岐ロジックの実装
- [ ] Decision Trees結果に基づく診断提案
- [ ] 統合テスト

#### 成果物
- Decision Trees連携機能
- テスト追加（カバレッジ85%以上）

---

### Phase 3: Quick Fix機能【1週間】

#### 目標
**自動修正提案の実装**

#### スコープ
- [ ] Code Actions API統合
- [ ] 自動修正候補生成
- [ ] Quick Fix UI実装
- [ ] E2Eテスト

#### 機能例
```typescript
// 違反コード
const position = 5; // ❌ Magic Number

// Quick Fix適用後
const position = Position.NEUTRAL; // ✅ 定数使用
```

#### 成果物
- Quick Fix機能
- E2Eテスト（@vscode/test-electron）

---

### Phase 4: pre-commit統合【3日】

#### 目標
**既存ガードシステムとの統合**

#### スコープ
- [ ] pre-commit-ai-guard.sh連携
- [ ] コミット前の一括検証
- [ ] CI/CD統合（GitHub Actions）
- [ ] 統合テスト

#### 統合イメージ
```bash
# pre-commit hook
#!/bin/bash

# 1. 既存ガード実行
./scripts/pre-commit-ai-guard.sh

# 2. VSCode Extension CLIモード実行
vscode-instructions-validator validate --staged

# 3. 両方パスでコミット許可
```

---

### Phase 5: パフォーマンス最適化【1週間】

#### 目標
**大規模プロジェクトでも快適に動作**

#### スコープ
- [ ] Language Server Protocol（LSP）実装
- [ ] インクリメンタル解析
- [ ] キャッシング最適化
- [ ] パフォーマンステスト

#### 目標値
- ファイル解析: <100ms
- 大規模プロジェクト（1000ファイル）初回解析: <5秒
- メモリ使用量: <200MB

---

### Phase 6: マーケットプレイス公開【1週間】

#### 目標
**VSCode Marketplace公開**

#### スコープ
- [ ] パッケージング（vsce）
- [ ] READMEドキュメント完成
- [ ] スクリーンショット・デモ動画作成
- [ ] ライセンス設定（MIT）
- [ ] セキュリティ監査
- [ ] 公開申請

#### チェックリスト
- [ ] 拡張機能アイコン作成
- [ ] CHANGELOGドキュメント
- [ ] CONTRIBUTINGガイド
- [ ] バグトラッキング設定（GitHub Issues）
- [ ] バージョニング戦略（Semantic Versioning）

---

## 🧪 テスト戦略

### テスト構成

```
tests/
├── unit/                    # ユニットテスト
│   ├── loader/
│   │   └── InstructionsLoader.test.ts
│   ├── engine/
│   │   └── RuleEngine.test.ts
│   └── parser/
│       └── MarkdownParser.test.ts
├── integration/             # 統合テスト
│   ├── diagnostics.test.ts
│   └── decisionTrees.test.ts
└── e2e/                     # E2Eテスト
    └── extension.test.ts
```

### テストカバレッジ目標

| Phase | ユニットテスト | 統合テスト | E2Eテスト | 総合カバレッジ |
|-------|-------------|-----------|----------|------------|
| Phase 1 | 80% | - | - | 80% |
| Phase 2 | 85% | 70% | - | 82% |
| Phase 3 | 85% | 75% | 50% | 80% |
| Phase 4+ | 90% | 80% | 60% | 85% |

### CI/CD統合

```yaml
# .github/workflows/extension-ci.yml
name: VSCode Extension CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
```

---

## 🔗 既存システム統合計画

### 1. 3層構造アーキテクチャ統合

**統合ポイント**:
- Entry Point（INDEX.md）を必ず最初に読む
- Category Indexから適切なInstructionsを選択
- Individual Instructionsのルールを適用

**実装**:
```typescript
// src/loader/ThreeLayerLoader.ts
export class ThreeLayerLoader {
  async loadForContext(context: ValidationContext): Promise<Instruction[]> {
    // 1. Entry Point読み込み
    const entryPoint = await this.loadEntryPoint();
    
    // 2. コンテキストに応じたCategory Index選択
    const category = this.selectCategory(context, entryPoint);
    
    // 3. Individual Instructions読み込み
    const instructions = await this.loadIndividualInstructions(category);
    
    return instructions;
  }
}
```

### 2. Decision Trees統合

**統合ポイント**:
- Mermaid図のフローチャート解析
- 条件分岐に基づく診断提案
- Decision Trees結果の可視化

**実装**:
```typescript
// src/engine/DecisionTreeEngine.ts
export class DecisionTreeEngine {
  async evaluate(context: ValidationContext): Promise<DecisionTreeResult> {
    // Mermaid図パース → 条件分岐評価
    const tree = await this.parseDecisionTree(context.treeId);
    return this.traverse(tree, context);
  }
}
```

### 3. サーバント水先案内人統合

**統合ポイント**:
- 失敗記録との連携
- 学習結果のinstructionsへの反映
- 失敗パターン検出

**実装**:
```typescript
// src/integration/ServantIntegration.ts
export class ServantIntegration {
  async checkFailurePatterns(document: vscode.TextDocument): Promise<Diagnostic[]> {
    // ai-failure-history.json読み込み
    const history = await this.loadFailureHistory();
    
    // 過去の失敗パターンと照合
    const matches = this.matchFailurePatterns(document, history);
    
    return matches.map(m => this.createWarningDiagnostic(m));
  }
}
```

### 4. pre-commit/ai-guard統合

**統合ポイント**:
- pre-commit hookとの連携
- CLIモード実装
- 既存スクリプトとの互換性

**実装**:
```typescript
// src/cli/ValidatorCLI.ts
export class ValidatorCLI {
  async validateStaged(): Promise<number> {
    // git diff --cached で変更ファイル取得
    const files = await this.getStagedFiles();
    
    // 各ファイル検証
    const diagnostics = await this.validateFiles(files);
    
    // CRITICAL検出でexit 1
    return diagnostics.some(d => d.severity === 'CRITICAL') ? 1 : 0;
  }
}
```

---

## 📅 実装スケジュール

### タイムライン（6週間）

| 週 | Phase | タスク | 工数 | 担当 |
|---|-------|--------|-----|-----|
| 1 | Phase 1 | プロジェクトセットアップ、Loader実装 | 40h | TBD |
| 2 | Phase 1 | Rule Engine、Diagnostics Provider | 40h | TBD |
| 3 | Phase 2 | Decision Trees統合 | 40h | TBD |
| 4 | Phase 3 | Quick Fix機能 | 40h | TBD |
| 5 | Phase 4-5 | pre-commit統合、パフォーマンス最適化 | 40h | TBD |
| 6 | Phase 6 | ドキュメント、公開準備 | 40h | TBD |

### マイルストーン

- **Week 2終了**: MVP完成、ローカル実行可能
- **Week 4終了**: Quick Fix機能完成
- **Week 5終了**: 既存システム統合完了
- **Week 6終了**: Marketplace公開

---

## 📊 成功基準

### 機能要件

- [ ] TypeScript/JavaScript/Markdown/JSONファイルの検証動作
- [ ] 赤波線でリアルタイム警告表示
- [ ] CRITICAL/WARNING/INFO の3段階severity
- [ ] Quick Fix提案機能
- [ ] pre-commit統合
- [ ] 3層構造アーキテクチャ完全対応
- [ ] Decision Trees連携

### 非機能要件

- [ ] ファイル解析: <100ms
- [ ] テストカバレッジ: 85%以上
- [ ] メモリ使用量: <200MB
- [ ] VSCode 1.80以降対応
- [ ] Linux/Mac/Windows対応

### ドキュメント要件

- [ ] README（インストール、使い方、設定）
- [ ] CONTRIBUTING（開発ガイド）
- [ ] CHANGELOG（バージョン履歴）
- [ ] API Documentation（主要クラス・メソッド）
- [ ] デモ動画（30秒）

---

## 🚧 リスクと対策

### リスク1: パフォーマンス劣化

**リスク**: 大規模プロジェクトで解析が遅くなる

**対策**:
- Language Server Protocol（LSP）採用
- インクリメンタル解析（変更部分のみ）
- ワーカースレッド活用
- キャッシング最適化

### リスク2: instructionsファイルのパースエラー

**リスク**: Markdown構文が予期しない形式

**対策**:
- スキーマバリデーション（frontmatter検証）
- エラーハンドリング強化
- フォールバック機能（パース失敗時）

### リスク3: 既存システムとの競合

**リスク**: pre-commitガードと重複して遅くなる

**対策**:
- CLIモード実装で統合可能に
- 並列実行最適化
- 段階的移行計画

---

## 🔄 段階的ロールアウト

### ステップ1: ローカル開発環境での試用（Week 2-3）
- 開発者1-2名でMVP試用
- フィードバック収集
- バグ修正

### ステップ2: チーム内展開（Week 4-5）
- 全開発者にインストール推奨
- 既存pre-commitと並行稼働
- 検出精度検証

### ステップ3: 本番投入（Week 6）
- pre-commit統合完了
- CI/CD統合
- Marketplace公開

---

## 📚 参考資料

### VSCode Extension開発
- [VSCode Extension API](https://code.visualstudio.com/api)
- [Language Server Protocol](https://microsoft.github.io/language-server-protocol/)
- [Extension Testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension)

### 類似プロジェクト
- [ESLint VSCode Extension](https://github.com/microsoft/vscode-eslint)
- [Stylelint VSCode Extension](https://github.com/stylelint/vscode-stylelint)
- [SonarLint VSCode Extension](https://github.com/SonarSource/sonarlint-vscode)

---

## ✅ 承認・実行

### 承認者
- [ ] プロジェクトオーナー
- [ ] テックリード

### 実行開始判断
**実行する**: すぐに開始
**一部実装**: Phase 1のみ実装
**延期**: 既存システムで十分

---

**策定日**: 2025-12-31  
**策定者**: AI Assistant  
**次回レビュー**: Phase 1完了時
