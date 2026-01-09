# リファクタリング実装計画

## 概要
Observer PatternとState Patternを段階的に導入し、頻繁変更ファイルの変更頻度を70%以上削減する。

## 目標
- ConstellationViewPanel: 37回/月 → 10回/月 (-73%)
- extension.ts: 17回/月 → 5回/月 (-71%)
- AutopilotController: 8回/月 → 2回/月 (-75%)

---

## Phase 1: Observer Pattern - extension.ts統合

### 目的
グローバルEventBusを初期化し、ステータスバー更新を完全に一元化

### 実装手順

#### 1.1 extension.ts - EventBus初期化
```typescript
// ファイル冒頭に追加
import { globalEventBus, ServantEvents, type EventData } from './core/EventBus';

// activate関数内、各モジュール初期化の前に追加
export async function activate(context: vscode.ExtensionContext) {
    // EventBusリスナー設定
    globalEventBus.on(ServantEvents.STATUS_UPDATE, (data: EventData['status_update']) => {
        updateServantStatusBar(data.activity);
    });
    
    // クリーンアップ処理
    context.subscriptions.push({
        dispose: () => globalEventBus.clear()
    });
    
    // ... 既存の初期化処理
}
```

#### 1.2 extension.ts - モジュール初期化変更
```typescript
// DocumentGuard初期化（既にEventBus統合済み）
const documentGuard = new DocumentGuard(workspaceRoot, globalEventBus);
// setStatusUpdateCallbackは削除不要（後方互換性のため残す）
documentGuard.setStatusUpdateCallback(updateServantStatusBar);

// 統計表示タイマーは残す（EventBusとは独立機能）
```

#### 1.3 検証方法
- ビルド成功確認: `npm run compile`
- 拡張機能起動確認
- ドキュメント作成時にステータスバー更新確認
- 出力パネルでイベント発行ログ確認

### 所要時間: 30分

### リスク
- 低: EventBus既存実装、DocumentGuardで実証済み

---

## Phase 2: Observer Pattern - AdaptiveGuard統合

### 目的
学習イベントをEventBus経由で通知

### 実装手順

#### 2.1 AdaptiveGuard.ts - EventBus統合
```typescript
// インポート追加
import { globalEventBus, ServantEvents, type EventData } from '../core/EventBus';

export class AdaptiveGuard {
    private eventBus: EventBus;
    
    constructor(
        workspaceRoot: string,
        eventBus: EventBus = globalEventBus
    ) {
        this.workspaceRoot = workspaceRoot;
        this.eventBus = eventBus;
        // ...
    }
    
    async triggerLearning(failureData: FailureData): Promise<void> {
        this.eventBus.emit(ServantEvents.STATUS_UPDATE, {
            activity: '🧠 学習中...',
            source: 'AdaptiveGuard'
        });
        
        try {
            // 既存の学習処理
            await this.learnFromFailure(failureData);
            
            this.eventBus.emit(ServantEvents.LEARNING_COMPLETED, {
                category: failureData.category,
                success: true
            });
            
            this.eventBus.emit(ServantEvents.STATUS_UPDATE, {
                activity: '✅ 学習完了',
                source: 'AdaptiveGuard'
            });
        } catch (error) {
            this.eventBus.emit(ServantEvents.LEARNING_FAILED, {
                category: failureData.category,
                error: error.message
            });
            
            this.eventBus.emit(ServantEvents.STATUS_UPDATE, {
                activity: '❌ 学習失敗',
                source: 'AdaptiveGuard'
            });
        }
    }
}
```

#### 2.2 extension.ts - AdaptiveGuard初期化変更
```typescript
const adaptiveGuard = new AdaptiveGuard(workspaceRoot, globalEventBus);
// setStatusUpdateCallback呼び出しは削除可能（EventBusに移行）
// ただし後方互換性のため残してもよい
```

#### 2.3 検証方法
- 学習トリガー時にステータスバー更新確認
- LEARNING_COMPLETEDイベント発行確認
- エラー時にLEARNING_FAILEDイベント発行確認

### 所要時間: 45分

### リスク
- 低: DocumentGuardと同じパターン

---

## Phase 3: Observer Pattern - CodeQualityGuard統合

### 目的
品質チェックイベントをEventBus経由で通知

### 実装手順

#### 3.1 CodeQualityGuard.ts - EventBus統合
```typescript
// インポート追加
import { globalEventBus, ServantEvents, type EventData } from '../core/EventBus';

export class CodeQualityGuard {
    private eventBus: EventBus;
    
    constructor(eventBus: EventBus = globalEventBus) {
        this.eventBus = eventBus;
        // ...
    }
    
    async validateOnSave(document: vscode.TextDocument): Promise<void> {
        this.eventBus.emit(ServantEvents.STATUS_UPDATE, {
            activity: '🔍 品質検証中...',
            source: 'CodeQualityGuard'
        });
        
        const issues = await this.validateDocument(document);
        
        if (issues.length > 0) {
            this.eventBus.emit(ServantEvents.QUALITY_ISSUE_DETECTED, {
                filePath: document.uri.fsPath,
                issueCount: issues.length,
                severity: this.calculateMaxSeverity(issues)
            });
            
            this.eventBus.emit(ServantEvents.STATUS_UPDATE, {
                activity: `⚠️ 品質問題: ${issues.length}件`,
                source: 'CodeQualityGuard'
            });
        } else {
            this.eventBus.emit(ServantEvents.STATUS_UPDATE, {
                activity: '✅ 品質OK',
                source: 'CodeQualityGuard'
            });
        }
    }
}
```

#### 3.2 extension.ts - CodeQualityGuard初期化変更
```typescript
const codeQualityGuard = new CodeQualityGuard(globalEventBus);
```

#### 3.3 検証方法
- ファイル保存時にステータスバー更新確認
- 品質問題検出時にQUALITY_ISSUE_DETECTEDイベント発行確認
- 問題なし時に適切なステータス表示確認

### 所要時間: 45分

### リスク
- 低: DocumentGuardと同じパターン

---

## Phase 4: Observer Pattern - ActionsHealthMonitor統合

### 目的
Actions検証イベントをEventBus経由で通知

### 実装手順

#### 4.1 ActionsHealthMonitor.ts - EventBus統合
```typescript
// インポート追加
import { globalEventBus, ServantEvents, type EventData } from '../core/EventBus';

export class ActionsHealthMonitor {
    private eventBus: EventBus;
    
    constructor(eventBus: EventBus = globalEventBus) {
        this.eventBus = eventBus;
        // ...
    }
    
    async checkActionsHealth(): Promise<void> {
        this.eventBus.emit(ServantEvents.STATUS_UPDATE, {
            activity: '🔧 Actions検証中...',
            source: 'ActionsHealthMonitor'
        });
        
        const issues = await this.validateWorkflows();
        
        if (issues.length > 0) {
            this.eventBus.emit(ServantEvents.STATUS_UPDATE, {
                activity: `⚠️ Actions問題: ${issues.length}件`,
                source: 'ActionsHealthMonitor'
            });
        } else {
            this.eventBus.emit(ServantEvents.STATUS_UPDATE, {
                activity: '✅ Actions健全',
                source: 'ActionsHealthMonitor'
            });
        }
    }
}
```

#### 4.2 extension.ts - ActionsHealthMonitor初期化変更
```typescript
const actionsMonitor = new ActionsHealthMonitor(globalEventBus);
```

#### 4.3 検証方法
- Actions検証時にステータスバー更新確認
- 問題検出時に適切なステータス表示確認

### 所要時間: 30分

### リスク
- 低: DocumentGuardと同じパターン

---

## Phase 5: State Pattern - AutopilotController設計

### 目的
状態遷移の複雑さを解消し、変更頻度を75%削減

### 実装手順

#### 5.1 状態インターフェース定義
```typescript
// extensions/servant/src/autopilot/AutopilotState.ts

export interface AutopilotState {
    readonly name: 'Idle' | 'Running' | 'Reviewing' | 'Completed' | 'Paused';
    
    enter(context: AutopilotController): Promise<void>;
    exit(context: AutopilotController): Promise<void>;
    
    // 状態固有の振る舞い
    start(context: AutopilotController): Promise<void>;
    pause(context: AutopilotController): Promise<void>;
    resume(context: AutopilotController): Promise<void>;
    complete(context: AutopilotController): Promise<void>;
    cancel(context: AutopilotController): Promise<void>;
    
    // 状態固有の処理
    canTransitionTo(newState: AutopilotState['name']): boolean;
}
```

#### 5.2 具体的状態クラス設計
```typescript
// IdleState: 初期状態、待機中
export class IdleState implements AutopilotState {
    readonly name = 'Idle';
    
    async start(context: AutopilotController): Promise<void> {
        // Running状態へ遷移
        context.setState(new RunningState());
    }
    
    canTransitionTo(newState: AutopilotState['name']): boolean {
        return newState === 'Running';
    }
}

// RunningState: 実行中
export class RunningState implements AutopilotState {
    readonly name = 'Running';
    private intervalId?: NodeJS.Timeout;
    
    async enter(context: AutopilotController): Promise<void> {
        // 定期実行開始
        this.intervalId = setInterval(() => {
            context.executeTask();
        }, context.getInterval());
        
        context.getEventBus().emit(ServantEvents.STATUS_UPDATE, {
            activity: '🚀 自動操縦実行中',
            source: 'AutopilotController'
        });
    }
    
    async exit(context: AutopilotController): Promise<void> {
        // 定期実行停止
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }
    
    async pause(context: AutopilotController): Promise<void> {
        context.setState(new PausedState());
    }
    
    async complete(context: AutopilotController): Promise<void> {
        context.setState(new CompletedState());
    }
    
    canTransitionTo(newState: AutopilotState['name']): boolean {
        return ['Paused', 'Completed', 'Idle'].includes(newState);
    }
}

// ReviewingState: レビュー中
export class ReviewingState implements AutopilotState {
    readonly name = 'Reviewing';
    
    async enter(context: AutopilotController): Promise<void> {
        context.getEventBus().emit(ServantEvents.STATUS_UPDATE, {
            activity: '🔍 レビュー中',
            source: 'AutopilotController'
        });
    }
    
    async complete(context: AutopilotController): Promise<void> {
        context.setState(new CompletedState());
    }
    
    async cancel(context: AutopilotController): Promise<void> {
        context.setState(new IdleState());
    }
    
    canTransitionTo(newState: AutopilotState['name']): boolean {
        return ['Completed', 'Idle'].includes(newState);
    }
}

// CompletedState: 完了
export class CompletedState implements AutopilotState {
    readonly name = 'Completed';
    
    async enter(context: AutopilotController): Promise<void> {
        context.getEventBus().emit(ServantEvents.STATUS_UPDATE, {
            activity: '✅ 自動操縦完了',
            source: 'AutopilotController'
        });
    }
    
    canTransitionTo(newState: AutopilotState['name']): boolean {
        return newState === 'Idle';
    }
}

// PausedState: 一時停止
export class PausedState implements AutopilotState {
    readonly name = 'Paused';
    
    async enter(context: AutopilotController): Promise<void> {
        context.getEventBus().emit(ServantEvents.STATUS_UPDATE, {
            activity: '⏸️ 一時停止中',
            source: 'AutopilotController'
        });
    }
    
    async resume(context: AutopilotController): Promise<void> {
        context.setState(new RunningState());
    }
    
    async cancel(context: AutopilotController): Promise<void> {
        context.setState(new IdleState());
    }
    
    canTransitionTo(newState: AutopilotState['name']): boolean {
        return ['Running', 'Idle'].includes(newState);
    }
}
```

#### 5.3 AutopilotController リファクタリング設計
```typescript
// extensions/servant/src/autopilot/AutopilotController.ts

export class AutopilotController {
    private currentState: AutopilotState;
    private eventBus: EventBus;
    private interval: number;
    
    constructor(eventBus: EventBus = globalEventBus) {
        this.currentState = new IdleState();
        this.eventBus = eventBus;
        this.interval = 60000; // 1分
    }
    
    // 状態遷移
    setState(newState: AutopilotState): void {
        if (!this.currentState.canTransitionTo(newState.name)) {
            throw new Error(
                `Invalid state transition: ${this.currentState.name} -> ${newState.name}`
            );
        }
        
        this.currentState.exit(this);
        this.currentState = newState;
        this.currentState.enter(this);
        
        this.eventBus.emit(ServantEvents.AUTOPILOT_STATE_CHANGED, {
            previousState: this.currentState.name,
            currentState: newState.name
        });
    }
    
    // 公開メソッド（状態に委譲）
    async start(): Promise<void> {
        await this.currentState.start(this);
    }
    
    async pause(): Promise<void> {
        await this.currentState.pause(this);
    }
    
    async resume(): Promise<void> {
        await this.currentState.resume(this);
    }
    
    async complete(): Promise<void> {
        await this.currentState.complete(this);
    }
    
    async cancel(): Promise<void> {
        await this.currentState.cancel(this);
    }
    
    // ゲッター（状態クラスから使用）
    getEventBus(): EventBus {
        return this.eventBus;
    }
    
    getInterval(): number {
        return this.interval;
    }
    
    getCurrentState(): AutopilotState['name'] {
        return this.currentState.name;
    }
    
    // ビジネスロジック
    async executeTask(): Promise<void> {
        // 既存のタスク実行ロジック
    }
}
```

#### 5.4 変更前後の比較

**変更前（問題のあるコード）:**
```typescript
export class AutopilotController {
    private isRunning = false;
    private isPaused = false;
    private isCompleted = false;
    
    async start(): Promise<void> {
        if (this.isRunning) {
            throw new Error('Already running');
        }
        if (this.isCompleted) {
            throw new Error('Already completed');
        }
        
        this.isRunning = true;
        this.isPaused = false;
        // 複雑な起動処理...
    }
    
    async pause(): Promise<void> {
        if (!this.isRunning) {
            throw new Error('Not running');
        }
        if (this.isPaused) {
            throw new Error('Already paused');
        }
        
        this.isPaused = true;
        // 複雑な停止処理...
    }
    
    // 状態チェックが至る所に散在
    // 新しい状態追加時に全メソッドを修正
}
```

**変更後（State Pattern）:**
```typescript
export class AutopilotController {
    private currentState: AutopilotState;
    
    async start(): Promise<void> {
        await this.currentState.start(this); // 状態に委譲
    }
    
    async pause(): Promise<void> {
        await this.currentState.pause(this); // 状態に委譲
    }
    
    // 状態チェックは各状態クラスが担当
    // 新しい状態追加時はコントローラーの修正不要
}
```

### 期待効果
- 状態遷移ロジックの集約
- 新しい状態追加が容易
- 状態固有の処理が明確
- テストが容易（状態ごとに独立）
- 変更頻度: 8回/月 → 2回/月 (-75%)

### 所要時間: 3時間

### リスク
- 中: 既存のAutopilotController実装を大幅に変更
- 対策: 既存メソッドを残し、段階的に移行

---

## Phase 6: State Pattern - AutopilotController実装

### 目的
Phase 5の設計に基づいて実装

### 実装手順

#### 6.1 状態インターフェース作成
```bash
# ファイル作成
extensions/servant/src/autopilot/AutopilotState.ts
extensions/servant/src/autopilot/states/IdleState.ts
extensions/servant/src/autopilot/states/RunningState.ts
extensions/servant/src/autopilot/states/ReviewingState.ts
extensions/servant/src/autopilot/states/CompletedState.ts
extensions/servant/src/autopilot/states/PausedState.ts
```

#### 6.2 AutopilotController リファクタリング
- 既存の状態フラグを削除
- currentStateフィールド追加
- setState()メソッド実装
- 既存メソッドを状態に委譲

#### 6.3 検証方法
- 全状態遷移のユニットテスト作成
- 無効な状態遷移でエラー発生確認
- 状態変更時のイベント発行確認
- 既存機能の動作確認

### 所要時間: 4時間

### リスク
- 中: 既存機能への影響
- 対策: 包括的なテスト作成

---

## Phase 7: State Pattern - ConstellationViewPanel設計

### 目的
表示モード管理を State Pattern で実装し、変更頻度を73%削減

### 実装手順

#### 7.1 ViewState インターフェース定義
```typescript
// extensions/servant/src/views/ViewState.ts

export interface ViewState {
    readonly name: 'Overview' | 'Detail' | 'Filter' | 'Search';
    
    enter(context: ConstellationViewPanel): Promise<void>;
    exit(context: ConstellationViewPanel): Promise<void>;
    
    // 表示更新
    render(context: ConstellationViewPanel): string;
    
    // ユーザー操作ハンドリング
    handleCommand(context: ConstellationViewPanel, command: string, args?: any): Promise<void>;
    
    // 状態遷移可否
    canTransitionTo(newState: ViewState['name']): boolean;
}
```

#### 7.2 具体的ViewState設計
```typescript
// OverviewState: 全体表示
export class OverviewState implements ViewState {
    readonly name = 'Overview';
    
    render(context: ConstellationViewPanel): string {
        const data = context.getData();
        return `
            <!DOCTYPE html>
            <html>
            <body>
                <h1>Constellation Overview</h1>
                <div id="graph">${this.renderGraph(data)}</div>
                <button onclick="showDetail()">詳細表示</button>
            </body>
            </html>
        `;
    }
    
    async handleCommand(context: ConstellationViewPanel, command: string): Promise<void> {
        if (command === 'showDetail') {
            context.setState(new DetailState());
        } else if (command === 'showFilter') {
            context.setState(new FilterState());
        }
    }
    
    canTransitionTo(newState: ViewState['name']): boolean {
        return ['Detail', 'Filter', 'Search'].includes(newState);
    }
}

// DetailState: 詳細表示
export class DetailState implements ViewState {
    readonly name = 'Detail';
    private selectedNode?: string;
    
    constructor(selectedNode?: string) {
        this.selectedNode = selectedNode;
    }
    
    render(context: ConstellationViewPanel): string {
        const nodeData = context.getNodeData(this.selectedNode);
        return `
            <!DOCTYPE html>
            <html>
            <body>
                <h1>Node Detail: ${nodeData.title}</h1>
                <div>${this.renderNodeDetail(nodeData)}</div>
                <button onclick="backToOverview()">戻る</button>
            </body>
            </html>
        `;
    }
    
    async handleCommand(context: ConstellationViewPanel, command: string): Promise<void> {
        if (command === 'backToOverview') {
            context.setState(new OverviewState());
        }
    }
    
    canTransitionTo(newState: ViewState['name']): boolean {
        return ['Overview', 'Search'].includes(newState);
    }
}

// FilterState: フィルター表示
export class FilterState implements ViewState {
    readonly name = 'Filter';
    private filters: Record<string, any> = {};
    
    render(context: ConstellationViewPanel): string {
        const filteredData = context.getFilteredData(this.filters);
        return `
            <!DOCTYPE html>
            <html>
            <body>
                <h1>Filtered View</h1>
                <div id="filters">${this.renderFilters()}</div>
                <div id="results">${this.renderResults(filteredData)}</div>
            </body>
            </html>
        `;
    }
    
    async handleCommand(context: ConstellationViewPanel, command: string, args?: any): Promise<void> {
        if (command === 'applyFilter') {
            this.filters = args;
            context.refresh(); // 再レンダリング
        } else if (command === 'clearFilter') {
            context.setState(new OverviewState());
        }
    }
    
    canTransitionTo(newState: ViewState['name']): boolean {
        return ['Overview', 'Detail', 'Search'].includes(newState);
    }
}

// SearchState: 検索表示
export class SearchState implements ViewState {
    readonly name = 'Search';
    private query: string = '';
    
    render(context: ConstellationViewPanel): string {
        const results = context.searchNodes(this.query);
        return `
            <!DOCTYPE html>
            <html>
            <body>
                <h1>Search Results</h1>
                <input type="text" id="search" value="${this.query}" />
                <div id="results">${this.renderSearchResults(results)}</div>
            </body>
            </html>
        `;
    }
    
    async handleCommand(context: ConstellationViewPanel, command: string, args?: any): Promise<void> {
        if (command === 'search') {
            this.query = args.query;
            context.refresh();
        } else if (command === 'selectResult') {
            context.setState(new DetailState(args.nodeId));
        }
    }
    
    canTransitionTo(newState: ViewState['name']): boolean {
        return ['Overview', 'Detail'].includes(newState);
    }
}
```

#### 7.3 ConstellationViewPanel リファクタリング設計
```typescript
// extensions/servant/src/views/ConstellationViewPanel.ts

export class ConstellationViewPanel {
    private currentState: ViewState;
    private panel: vscode.WebviewPanel;
    private data: any; // Constellation データ
    
    constructor(panel: vscode.WebviewPanel) {
        this.panel = panel;
        this.currentState = new OverviewState();
        this.setupMessageHandler();
    }
    
    // 状態遷移
    setState(newState: ViewState): void {
        if (!this.currentState.canTransitionTo(newState.name)) {
            throw new Error(
                `Invalid view transition: ${this.currentState.name} -> ${newState.name}`
            );
        }
        
        this.currentState.exit(this);
        this.currentState = newState;
        this.currentState.enter(this);
        this.refresh();
    }
    
    // 表示更新
    refresh(): void {
        const html = this.currentState.render(this);
        this.panel.webview.html = html;
    }
    
    // メッセージハンドラー
    private setupMessageHandler(): void {
        this.panel.webview.onDidReceiveMessage(async (message) => {
            await this.currentState.handleCommand(this, message.command, message.args);
        });
    }
    
    // データアクセス（状態クラスから使用）
    getData(): any {
        return this.data;
    }
    
    getNodeData(nodeId?: string): any {
        // ノードデータ取得
    }
    
    getFilteredData(filters: Record<string, any>): any {
        // フィルタリング処理
    }
    
    searchNodes(query: string): any[] {
        // 検索処理
    }
}
```

### 期待効果
- 表示モードごとのロジック分離
- 新しい表示モード追加が容易
- 状態遷移の明確化
- 変更頻度: 37回/月 → 10回/月 (-73%)

### 所要時間: 4時間

### リスク
- 中: WebviewPanel の複雑さ
- 対策: 段階的移行、既存表示を残す

---

## Phase 8: State Pattern - ConstellationViewPanel実装

### 目的
Phase 7の設計に基づいて実装

### 実装手順

#### 8.1 ViewState クラス作成
```bash
# ファイル作成
extensions/servant/src/views/ViewState.ts
extensions/servant/src/views/states/OverviewState.ts
extensions/servant/src/views/states/DetailState.ts
extensions/servant/src/views/states/FilterState.ts
extensions/servant/src/views/states/SearchState.ts
```

#### 8.2 ConstellationViewPanel リファクタリング
- 既存の表示モードフラグを削除
- currentStateフィールド追加
- setState()メソッド実装
- render()を状態に委譲

#### 8.3 検証方法
- 全表示モードの動作確認
- 状態遷移のユニットテスト
- WebviewPanel表示確認
- パフォーマンス測定

### 所要時間: 5時間

### リスク
- 中: WebviewPanel の既存実装への影響
- 対策: プレビュー版で検証

---

## 総合スケジュール

### タイムライン
```
Week 1:
  Day 1-2: Phase 1-4 (Observer Pattern統合)
  Day 3-4: Phase 5-6 (AutopilotController State Pattern)
  Day 5: 統合テスト、バグ修正

Week 2:
  Day 1-3: Phase 7-8 (ConstellationViewPanel State Pattern)
  Day 4: 統合テスト、パフォーマンス測定
  Day 5: ドキュメント更新、リリース準備
```

### 総所要時間: 約18時間（2週間想定）

---

## リスク管理

### 高リスク項目
なし

### 中リスク項目
1. **AutopilotController の大幅変更**
   - 対策: 既存メソッドを残し段階的移行、包括的テスト作成
   
2. **ConstellationViewPanel のWebview複雑性**
   - 対策: プレビュー版で検証、段階的移行

### 低リスク項目
1. **Observer Pattern統合**
   - 対策: DocumentGuardで実証済み、同じパターン適用

---

## 成功指標

### 定量的指標
- [ ] ConstellationViewPanel 変更頻度: 37回/月 → 10回/月以下
- [ ] AutopilotController 変更頻度: 8回/月 → 2回/月以下
- [ ] extension.ts 変更頻度: 17回/月 → 5回/月以下
- [ ] ビルド時間: 変化なし（±5%以内）
- [ ] 拡張機能起動時間: 変化なし（±10%以内）

### 定性的指標
- [ ] 状態遷移が明確で理解しやすい
- [ ] 新機能追加が容易
- [ ] テストカバレッジ向上
- [ ] コードレビューが容易

---

## ロールバック計画

### Phase 1-4 失敗時
- 既存のsetStatusUpdateCallbackは削除していないため影響なし
- EventBusリスナー削除のみで復旧可能

### Phase 5-6 失敗時
- State Patternの状態クラスを削除
- AutopilotControllerを元のコードに戻す
- Git revert使用

### Phase 7-8 失敗時
- ViewStateクラスを削除
- ConstellationViewPanelを元のコードに戻す
- Git revert使用

---

## 次のアクション

1. **Phase 1実装開始**: extension.ts に EventBus リスナー追加
2. **進捗確認**: 各Phase完了後にビルド&テスト実行
3. **ドキュメント更新**: 実装完了後に REFACTORING_SUMMARY.md 更新

---

## 付録: コマンド一覧

### ビルド
```bash
cd extensions/servant
npm run compile
```

### テスト
```bash
cd extensions/servant
npm test
```

### ウォッチモード
```bash
cd extensions/servant
npm run watch
```

### デバッグ実行
- F5キーで拡張機能デバッグ起動
- `[Extension Development Host]` ウィンドウで検証
