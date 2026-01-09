# ConstellationViewPanel State Pattern 設計書

## 概要

ConstellationViewPanel（天体儀表示パネル）にState Patternを導入し、表示モード管理を整理しました。

## 変更の動機

- **変更頻度**: 37回/月（最頻繁変更ファイル）
- **課題**: 
  - 表示モード切り替えロジックが分散
  - HTML生成が1つの巨大メソッドに集約
  - 新しい表示モード追加が困難
  - テストが難しい

## 目標

- 変更頻度を **73%削減**（37回/月 → 10回/月）
- 各表示モードのロジックを独立したクラスに分離
- 新しい表示モード追加を容易に

## State Pattern 設計

### 状態インターフェース

```typescript
export interface ViewState {
  readonly name: ViewModeName;
  
  enter(context: ConstellationViewPanel): Promise<void>;
  exit(context: ConstellationViewPanel): Promise<void>;
  
  render(context: ConstellationViewPanel): string;
  handleMessage(context: ConstellationViewPanel, message: any): Promise<void>;
  updateData(context: ConstellationViewPanel): Promise<void>;
  
  showOverview(context: ConstellationViewPanel): Promise<void>;
  showDetail(context: ConstellationViewPanel, nodeId: string): Promise<void>;
  showFilter(context: ConstellationViewPanel, filters: Record<string, any>): Promise<void>;
  showSearch(context: ConstellationViewPanel, query: string): Promise<void>;
  
  canTransitionTo(modeName: ViewModeName): boolean;
  getDescription(): string;
}
```

### 4つの表示状態

#### 1. OverviewState（全体表示）

- **責務**: プロジェクト全体を3D天体儀として表示
- **遷移先**: Detail、Filter、Search
- **特徴**:
  - Three.jsで3Dレンダリング
  - ノードクリックでDetail遷移
  - 検索・フィルターボタン

#### 2. DetailState（詳細表示）

- **責務**: 特定ノードの詳細情報を表示
- **状態データ**: `selectedNodeId: string`
- **遷移先**: Overview
- **特徴**:
  - 基本情報テーブル
  - 依存関係リスト
  - 戻るボタン

#### 3. FilterState（フィルター表示）

- **責務**: 条件でノードをフィルタリング
- **状態データ**: `filters: Record<string, any>`
- **遷移先**: Overview
- **特徴**:
  - フィルター条件UI（タイプ選択）
  - 結果リスト表示
  - クリア・適用ボタン

#### 4. SearchState（検索表示）

- **責務**: ノード検索
- **状態データ**: `query: string`
- **遷移先**: Overview、Detail
- **特徴**:
  - 検索ボックス
  - リアルタイム検索結果
  - 結果クリックでDetail遷移

## 状態遷移図

```
        ┌─────────────┐
        │  Overview   │ (デフォルト)
        │  (全体表示)  │
        └──────┬──────┘
         ┌─────┼─────┐
         │     │     │
    ┌────▼──┐ │ ┌───▼─────┐
    │Detail │ │ │ Filter  │
    │(詳細) │ │ │(フィルタ)│
    └───┬───┘ │ └────┬────┘
        │     │      │
        │  ┌──▼───┐  │
        │  │Search│  │
        │  │(検索) │  │
        │  └──┬───┘  │
        │     │      │
        └─────┼──────┘
              │
         ◄────┘ (Overviewへ戻る)
```

## ConstellationViewPanelへの統合

### 追加フィールド

```typescript
export class ConstellationViewPanel {
  // State Pattern統合
  private _currentViewState: ViewState;
  private _outputChannel: vscode.OutputChannel;
  
  // ...
}
```

### 状態遷移メソッド

```typescript
public async transitionToState(newState: ViewState): Promise<void> {
  // 遷移可能性チェック
  if (!this._currentViewState.canTransitionTo(newState.name)) {
    return;
  }
  
  // 現在の状態のexit処理
  await this._currentViewState.exit(this);
  
  // 新しい状態に切り替え
  this._currentViewState = newState;
  
  // 新しい状態のenter処理
  await this._currentViewState.enter(this);
  
  // 画面を更新
  await this.refresh();
}
```

### 状態クラス用ヘルパーメソッド

```typescript
// 画面再描画
public async refresh(): Promise<void> {
  this._panel.webview.html = this._currentViewState.render(this);
}

// データ取得
public getData(): any { ... }
public getNodeData(nodeId: string): any | null { ... }
public getFilteredData(filters: Record<string, any>): any { ... }
public searchNodes(query: string): any[] { ... }

// リソースURI取得
public getThreeJsUri(): string { ... }
public getOrbitControlsUri(): string { ... }

// ログ出力
public logToOutput(message: string): void { ... }

// メッセージ送信
public postMessage(message: any): void { ... }
```

## 変更前後の比較

### 変更前

```typescript
// 1つの巨大な_getHtmlForWebview()メソッド
private _getHtmlForWebview(webview: vscode.Webview): string {
  // 330行の複雑なHTML生成
  // すべての表示モードが混在
  // 条件分岐が複雑
}

// メッセージハンドラーも1箇所に集約
this._panel.webview.onDidReceiveMessage(message => {
  if (message.command === 'getData') {
    this._sendData();
  }
  // 他のコマンドは未実装
});
```

### 変更後

```typescript
// 状態クラスに委譲
this._panel.webview.html = this._currentViewState.render(this);

// メッセージハンドラーも状態に委譲
this._panel.webview.onDidReceiveMessage(async message => {
  await this._currentViewState.handleMessage(this, message);
});

// 各状態クラスが独立して実装
export class OverviewState extends BaseViewState {
  render(context: ConstellationViewPanel): string {
    // Overview固有のHTML生成
  }
  
  async handleMessage(context: ConstellationViewPanel, message: any): Promise<void> {
    // Overview固有のメッセージ処理
  }
}
```

## 利点

### 1. 関心の分離

- 各表示モードが独立したクラスに
- HTML生成ロジックが状態クラスに分散
- メッセージハンドリングも状態ごとに分離

### 2. 拡張性

新しい表示モードを追加する場合:

```typescript
// 1. 新しい状態クラスを作成
export class NewModeState extends BaseViewState {
  readonly name = 'NewMode';
  // ...
}

// 2. ViewModeNameに追加
export type ViewModeName = 'Overview' | 'Detail' | 'Filter' | 'Search' | 'NewMode';

// 3. 完了! ConstellationViewPanelの変更不要
```

### 3. テスト容易性

```typescript
// 状態クラスを個別にテスト可能
const state = new OverviewState();
const mockContext = createMockContext();
const html = state.render(mockContext);
expect(html).toContain('🌟 天体儀');
```

### 4. 変更の局所化

- 表示モード変更は対応する状態クラスのみ変更
- 他の表示モードに影響なし
- ConstellationViewPanel本体の変更不要

## ファイル構成

```
src/ui/
├── ConstellationViewPanel.ts  (コントローラー、統合済み)
├── ViewState.ts                (インターフェース・基底クラス)
└── states/
    ├── index.ts               (エクスポート)
    ├── OverviewState.ts       (全体表示)
    ├── DetailState.ts         (詳細表示)
    ├── FilterState.ts         (フィルター表示)
    └── SearchState.ts         (検索表示)
```

## 後方互換性

- `_getHtmlForWebview()`メソッドは残存（`@deprecated`マーク）
- 既存の`_sendData()`も維持
- 段階的な移行が可能

## 期待される効果

- **変更頻度削減**: 37回/月 → 10回/月（-73%）
- **コード行数**: 330行 → 各状態150-200行（合計600-800行）
  - 増加するが、保守性・可読性が向上
- **新機能追加時間**: 2-3時間 → 30分-1時間（-67%）
- **バグ発生率**: 表示モード間の干渉が消失

## テスト戦略

### ユニットテスト

```typescript
describe('OverviewState', () => {
  it('should render overview HTML', () => {
    const state = new OverviewState();
    const html = state.render(mockContext);
    expect(html).toContain('🌟 天体儀 - 全体表示');
  });
  
  it('should transition to detail on showDetail', async () => {
    const state = new OverviewState();
    await state.showDetail(mockContext, 'node-1');
    expect(mockContext.transitionToState).toHaveBeenCalledWith(
      expect.any(DetailState)
    );
  });
});
```

### 統合テスト

```typescript
describe('ConstellationViewPanel', () => {
  it('should transition between states', async () => {
    const panel = createPanel();
    
    // 初期状態はOverview
    expect(panel.getCurrentViewState()).toBe('Overview');
    
    // Detailに遷移
    await panel.transitionToState(new DetailState('node-1'));
    expect(panel.getCurrentViewState()).toBe('Detail');
    
    // Overviewに戻る
    await panel.transitionToState(new OverviewState());
    expect(panel.getCurrentViewState()).toBe('Overview');
  });
});
```

## 実装完了日

2024年（Phase 7-8完了）

## 関連ドキュメント

- [../REFACTORING_IMPLEMENTATION_PLAN.md](../REFACTORING_IMPLEMENTATION_PLAN.md) - 全体実装計画
- [./AUTOPILOT_STATE_PATTERN_DESIGN.md](./AUTOPILOT_STATE_PATTERN_DESIGN.md) - AutopilotController State Pattern設計
