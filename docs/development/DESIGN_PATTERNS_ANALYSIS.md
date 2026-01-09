---
title: 適切なデザインパターン分析
created: 2026-01-09
updated: 2026-01-09
status: review
tags: [refactoring, design-patterns, analysis]
---

# 頻繁変更ファイルの根本原因と適切なパターン

## 問題の再分析

### Command Registry の限界

**提案したパターン**: Command Pattern（Registry）
**解決できる問題**: コマンド登録の煩雑さ
**解決できない問題**: **頻繁な変更の根本原因**

Command Patternは「コマンド実行の抽象化」には有効ですが、以下の根本原因には対処していません：

## 根本原因と適切なパターン

### 1. ConstellationViewPanel.ts (37回変更)

#### 根本原因
- **状態管理の複雑さ**: ノード選択、フィルタ、表示モードなど複数の状態
- **イベント駆動の問題**: WebviewからのメッセージをSwitch文で処理
- **UIとロジックの密結合**: 状態変化→UI更新が直接実装

#### 適切なパターン

##### 1. **State Pattern** - 表示モードの管理

```typescript
// 状態インターフェース
interface ViewState {
  render(panel: ConstellationViewPanel): string;
  handleNodeClick(nodeId: string): void;
}

// 具象状態
class OverviewState implements ViewState {
  render(panel: ConstellationViewPanel): string {
    // 全体表示のHTML生成
  }
  handleNodeClick(nodeId: string): void {
    // ノード選択 → DetailState に遷移
    panel.setState(new DetailState(nodeId));
  }
}

class DetailState implements ViewState {
  constructor(private nodeId: string) {}
  
  render(panel: ConstellationViewPanel): string {
    // 詳細表示のHTML生成
  }
  handleNodeClick(nodeId: string): void {
    // 別ノード → 状態更新
  }
}

// コンテキスト
class ConstellationViewPanel {
  private state: ViewState;
  
  setState(newState: ViewState): void {
    this.state = newState;
    this.refresh(); // Observer通知
  }
  
  refresh(): void {
    this._panel.webview.html = this.state.render(this);
  }
}
```

**効果**: 新しい表示モード追加時に既存コードを変更不要

##### 2. **Observer Pattern** - UI更新の自動化

```typescript
// Observable（監視対象）
class ConstellationDataModel {
  private observers: Set<Observer> = new Set();
  
  subscribe(observer: Observer): void {
    this.observers.add(observer);
  }
  
  notify(event: string, data: any): void {
    for (const observer of this.observers) {
      observer.update(event, data);
    }
  }
  
  updateNode(nodeId: string, data: any): void {
    // データ更新
    this.notify('nodeUpdated', { nodeId, data });
  }
}

// Observer（監視者）
class ConstellationViewPanel implements Observer {
  update(event: string, data: any): void {
    switch (event) {
      case 'nodeUpdated':
        this.refreshNode(data.nodeId);
        break;
      case 'graphChanged':
        this.refresh();
        break;
    }
  }
}
```

**効果**: データ変更→UI更新が自動化、手動refresh()呼び出しが不要

### 2. AutopilotController.ts (8回変更)

#### 根本原因
- **複雑な状態遷移**: idle → running → reviewing → completed
- **状態依存の振る舞い**: 各状態で異なる処理（条件分岐が多数）
- **状態チェックの散在**: `if (this.activeTaskState)` が複数箇所

#### 適切なパターン: **State Pattern**

```typescript
// 状態インターフェース
interface AutopilotState {
  start(task: string): Promise<void>;
  pause(): void;
  review(): Promise<void>;
  abort(): void;
}

// 具象状態
class IdleState implements AutopilotState {
  async start(task: string): Promise<void> {
    // タスク開始処理
    controller.setState(new RunningState(task));
  }
  pause(): void { /* 何もしない */ }
  review(): Promise<void> { throw new Error('No task to review'); }
  abort(): void { /* 何もしない */ }
}

class RunningState implements AutopilotState {
  constructor(private task: string) {}
  
  async start(): Promise<void> {
    throw new Error('Already running');
  }
  
  pause(): void {
    controller.setState(new PausedState(this.task));
  }
  
  async review(): Promise<void> {
    const result = await executeTask(this.task);
    controller.setState(new ReviewingState(result));
  }
  
  abort(): void {
    controller.setState(new IdleState());
  }
}

class ReviewingState implements AutopilotState {
  constructor(private result: any) {}
  
  async review(): Promise<void> {
    // レビュー処理
    if (approved) {
      controller.setState(new CompletedState(this.result));
    } else {
      controller.setState(new IdleState());
    }
  }
  
  abort(): void {
    controller.setState(new IdleState());
  }
}

// コンテキスト
class AutopilotController {
  private state: AutopilotState = new IdleState();
  
  setState(newState: AutopilotState): void {
    this.state = newState;
    this.updateStatusBar(); // 状態表示更新
  }
  
  async startTask(task: string): Promise<void> {
    await this.state.start(task);
  }
  
  pause(): void {
    this.state.pause();
  }
}
```

**効果**: 
- 状態遷移ロジックが各状態クラスに集約
- 新しい状態追加時に既存コードを変更不要
- 条件分岐が削減（多態性で解決）

### 3. extension.ts (17回変更)

#### 根本原因
- **初期化順序の依存**: 20+のモジュールの初期化順序が暗黙的
- **ステータスバー更新の散在**: 各モジュールが直接更新
- **設定変更の検出**: 検証戦略の切り替えが複雑

#### 適切なパターン

##### 1. **Observer Pattern** - ステータスバー更新の一元化

```typescript
// Subject
class ServantEventBus {
  private listeners = new Map<string, Set<(data: any) => void>>();
  
  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }
  
  emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      for (const callback of callbacks) {
        callback(data);
      }
    }
  }
}

// 使用例
const eventBus = new ServantEventBus();

// ステータスバー更新を一箇所で監視
eventBus.on('status.update', (status) => {
  updateServantStatusBar(status);
});

// 各モジュールはイベント発行のみ
documentGuard.on('violation', () => {
  eventBus.emit('status.update', '⚠️ 違反検出');
});

adaptiveGuard.on('learning', () => {
  eventBus.emit('status.update', '🧠 学習中');
});
```

**効果**: 各モジュールがステータスバー更新ロジックを持たなくて良い

##### 2. **Strategy Pattern** - 検証戦略の切り替え

```typescript
// 戦略インターフェース
interface ValidationStrategy {
  validate(files: string[]): Promise<ValidationResult>;
}

// 具象戦略
class StrictValidationStrategy implements ValidationStrategy {
  async validate(files: string[]): Promise<ValidationResult> {
    // 厳密検証: 全てのルールを適用
  }
}

class QuickValidationStrategy implements ValidationStrategy {
  async validate(files: string[]): Promise<ValidationResult> {
    // 高速検証: 重要ルールのみ
  }
}

class IncrementalValidationStrategy implements ValidationStrategy {
  async validate(files: string[]): Promise<ValidationResult> {
    // 増分検証: 変更ファイルのみ
  }
}

// コンテキスト
class Validator {
  private strategy: ValidationStrategy;
  
  setStrategy(strategy: ValidationStrategy): void {
    this.strategy = strategy;
  }
  
  async validate(files: string[]): Promise<ValidationResult> {
    return this.strategy.validate(files);
  }
}

// 使用例
const validator = new Validator();

// 設定に応じて戦略切り替え
if (config.get('validation.mode') === 'strict') {
  validator.setStrategy(new StrictValidationStrategy());
} else if (config.get('validation.mode') === 'quick') {
  validator.setStrategy(new QuickValidationStrategy());
}
```

**効果**: 検証モード追加時に既存コードを変更不要

## パターン比較

| パターン | 適用箇所 | 解決する問題 | 優先度 |
|---------|---------|-------------|--------|
| **State** | AutopilotController | 状態遷移の複雑さ | ⭐⭐⭐ 高 |
| **State** | ConstellationViewPanel | 表示モード管理 | ⭐⭐ 中 |
| **Observer** | 全モジュール | イベント駆動、UI更新 | ⭐⭐⭐ 高 |
| **Strategy** | Validator | アルゴリズム切り替え | ⭐⭐ 中 |
| **Command** | extension.ts | コマンド登録 | ⭐ 低 |

## 推奨実装順序

### Phase 1: Observer Pattern（最優先）
**理由**: 全モジュールのステータスバー更新を一元化できる

1. EventBus 実装
2. 各モジュールからイベント発行に変更
3. ステータスバー更新を一箇所に集約

**効果**: extension.ts の変更頻度を大幅削減

### Phase 2: State Pattern（AutopilotController）
**理由**: 8回変更の根本原因（状態遷移）を解決

1. AutopilotState インターフェース定義
2. 各状態クラス実装（Idle, Running, Reviewing, etc.）
3. AutopilotController をコンテキストに変更

**効果**: 新しい状態追加時の変更を局所化

### Phase 3: State Pattern（ConstellationViewPanel）
**理由**: 37回変更の根本原因を解決

1. ViewState インターフェース定義
2. 各表示モードクラス実装（Overview, Detail, Filter, etc.）
3. ConstellationViewPanel をコンテキストに変更

**効果**: 新しい表示モード追加時の変更を局所化

### Phase 4: Strategy Pattern（Validator）
**理由**: 検証ロジックの拡張性向上

1. ValidationStrategy インターフェース定義
2. 各戦略クラス実装
3. Validator をコンテキストに変更

**効果**: 新しい検証モード追加が容易に

## まとめ

### Command Pattern の位置づけ
- **有効な場面**: コマンド登録の簡素化
- **限界**: 頻繁な変更の根本原因には対処できない
- **評価**: 補助的なパターン（優先度: 低）

### State/Strategy/Observer の重要性
- **State**: 複雑な状態遷移を管理（AutopilotController, ConstellationViewPanel）
- **Observer**: イベント駆動アーキテクチャの基盤（全モジュール）
- **Strategy**: アルゴリズムの切り替えを容易に（Validator）

### 期待される効果

| 指標 | Before | After | 改善率 |
|------|--------|-------|--------|
| AutopilotController 変更頻度 | 8回/月 | 2回/月 | -75% |
| ConstellationViewPanel 変更頻度 | 37回/月 | 10回/月 | -73% |
| extension.ts 変更頻度 | 17回/月 | 5回/月 | -71% |
| 新機能追加時の変更箇所 | 3-5ファイル | 1-2ファイル | -60% |
