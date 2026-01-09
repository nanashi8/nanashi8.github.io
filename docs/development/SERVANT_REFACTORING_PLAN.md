---
title: Servant Extension Refactoring Plan
created: 2026-01-09
updated: 2026-01-09
status: draft
tags: [refactoring, architecture, servant]
---

# Servant 拡張機能リファクタリング計画

## 問題の特定

### 頻繁に変更されるファイル
1. `ConstellationViewPanel.ts` (37回) - 324行
2. `package.json` (18回)
3. `extension.ts` (17回) - **2170行**
4. `QuestionScheduler.ts` (12回)
5. `fill-classical-japanese-examples.ts` (9回)
6. `AutopilotController.ts` (8回)
7. `constellation-3d-demo.html` (7回)

### 主な問題点

#### 1. extension.ts の肥大化（2170行）
- **20以上のコマンド登録**が直接記述
- 初期化ロジックが長大
- 複数の責務が混在（コマンド、Guard、Monitor、学習システム、etc.）
- 変更時に影響範囲が広い

#### 2. ConstellationViewPanel.ts の複雑さ
- Webview、メッセージング、データ生成が一体化
- HTML生成ロジックが巨大
- 拡張時に必ず変更が必要

## リファクタリング戦略

### Phase 1: Command Registry パターン導入

**目的**: コマンド登録を一元管理し、extension.ts の肥大化を防止

#### 実装案

```typescript
// src/commands/CommandRegistry.ts
export class CommandRegistry {
  private commands = new Map<string, CommandHandler>();
  
  register(id: string, handler: CommandHandler): void {
    this.commands.set(id, handler);
  }
  
  registerAll(context: vscode.ExtensionContext): void {
    for (const [id, handler] of this.commands) {
      context.subscriptions.push(
        vscode.commands.registerCommand(id, handler.execute.bind(handler))
      );
    }
  }
}

// src/commands/handlers/ValidateCommand.ts
export class ValidateCommand implements CommandHandler {
  execute(): Promise<void> {
    // 実装
  }
}
```

**メリット**:
- コマンド登録を `commands/` ディレクトリに分離
- 新規コマンド追加時に extension.ts を変更不要
- テスタビリティ向上

### Phase 2: Service Container パターン導入

**目的**: 依存関係の管理を一元化

#### 実装案

```typescript
// src/core/ServiceContainer.ts
export class ServiceContainer {
  private services = new Map<string, any>();
  
  register<T>(key: string, factory: () => T): void {
    this.services.set(key, factory);
  }
  
  get<T>(key: string): T {
    const factory = this.services.get(key);
    if (!factory) throw new Error(`Service not found: ${key}`);
    return factory();
  }
}

// extension.ts での利用
const container = new ServiceContainer();
container.register('notifier', () => new Notifier(outputChannel));
container.register('documentGuard', () => new DocumentGuard(workspaceRoot));
```

**メリット**:
- 初期化順序の依存関係を明示化
- モジュール間の結合度低減
- テスト時のモック注入が容易

### Phase 3: View Model パターン導入（ConstellationViewPanel）

**目的**: UI層とデータ層を分離

#### 実装案

```typescript
// src/ui/constellation/ConstellationViewModel.ts
export class ConstellationViewModel {
  constructor(
    private graph: NeuralDependencyGraph,
    private generator: ConstellationDataGenerator
  ) {}
  
  getData(): ConstellationData {
    return this.generator.generate();
  }
  
  handleNodeClick(nodeId: string): void {
    // ビジネスロジック
  }
}

// src/ui/constellation/ConstellationViewPanel.ts（簡素化）
export class ConstellationViewPanel {
  constructor(
    private viewModel: ConstellationViewModel,
    private htmlGenerator: HtmlGenerator
  ) {}
  
  render(): void {
    this._panel.webview.html = this.htmlGenerator.generate();
  }
}
```

**メリット**:
- HTML生成ロジックを分離
- ビジネスロジックとUIを分離
- 変更時の影響範囲を限定

### Phase 4: Event Bus パターン導入

**目的**: モジュール間の疎結合化

#### 実装案

```typescript
// src/core/EventBus.ts
export class EventBus {
  private listeners = new Map<string, Set<EventListener>>();
  
  on(event: string, listener: EventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }
  
  emit(event: string, data: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        listener(data);
      }
    }
  }
}

// 使用例
eventBus.on('document.violation', (data) => {
  statusBar.update(`⚠️ 違反検出: ${data.count}件`);
});

documentGuard.emit('document.violation', { count: 5 });
```

**メリット**:
- 直接依存を削減
- 機能追加時の変更を局所化
- ステータスバー更新が自動化

## 実装順序

### Step 1: Command Registry（優先度: 高）
- extension.ts の肥大化を即座に解消
- 影響範囲: extension.ts のみ
- 所要時間: 2-3時間

### Step 2: Service Container（優先度: 中）
- 初期化ロジックを整理
- 影響範囲: extension.ts、各モジュール
- 所要時間: 3-4時間

### Step 3: View Model（優先度: 中）
- ConstellationViewPanel.ts の複雑さを解消
- 影響範囲: ui/constellation/ 配下
- 所要時間: 2-3時間

### Step 4: Event Bus（優先度: 低）
- ステータスバー更新を自動化
- 影響範囲: 全モジュール
- 所要時間: 4-5時間

## 効果測定

### Before
- extension.ts: 2170行、20+コマンド
- ConstellationViewPanel.ts: 324行
- 変更時の影響範囲: 広範囲

### After（目標）
- extension.ts: 500行以下
- ConstellationViewPanel.ts: 150行以下
- 新規コマンド追加: extension.ts 変更不要
- 新規機能追加: 影響範囲を1ファイルに限定

## リスク管理

### リスク
1. 既存機能の破壊
2. テストコードの大量更新
3. 開発効率の一時的低下

### 対策
1. 段階的リファクタリング（1機能ずつ）
2. 既存テストを維持しながら移行
3. 各Step完了後にビルド・動作確認

## 次のアクション

1. **Command Registry の実装** - 即座に着手可能
2. **DocumentGuard の分離** - 既にステータスバー統合済み
3. **テストコード作成** - リファクタリング前に既存動作を保証
