# AutopilotController State Pattern 設計

## 概要
AutopilotControllerにState Patternを導入し、状態遷移の複雑さを解消。変更頻度を75%削減（8回/月 → 2回/月）することを目指します。

## 状態一覧

### 1. IdleState（待機中）
- **役割**: 初期状態、自動操縦が開始されていない
- **可能な操作**: start()
- **遷移先**: Running

### 2. RunningState（実行中）
- **役割**: 自動操縦が実行中、定期的にタスクを実行
- **可能な操作**: pause(), stop(), startReview(), startInvestigation(), complete(), fail()
- **遷移先**: Paused, Idle, Reviewing, Investigating, Completed, Failed
- **特殊処理**: 
  - enter時に定期実行タイマー開始
  - exit時に定期実行タイマー停止

### 3. PausedState（一時停止）
- **役割**: 実行が一時停止されている
- **可能な操作**: resume(), stop()
- **遷移先**: Running, Idle

### 4. ReviewingState（レビュー中）
- **役割**: エラー・警告が発生し、レビューが必要
- **可能な操作**: complete(), resume(), stop()
- **遷移先**: Completed, Running, Idle
- **状態固有データ**: severity（error/warning）、reasons（理由リスト）
- **特殊処理**: enter時にレビューUIを表示

### 5. InvestigatingState（調査中）
- **役割**: エラーの原因を自動調査中
- **可能な操作**: complete(), resume(), stop()
- **遷移先**: Completed, Running, Idle
- **特殊処理**: enter時に自動調査エンジンを起動

### 6. CompletedState（完了）
- **役割**: タスクが正常に完了
- **可能な操作**: stop()
- **遷移先**: Idle
- **特殊処理**: enter時に完了通知

### 7. FailedState（失敗）
- **役割**: タスク実行が失敗
- **可能な操作**: stop()
- **遷移先**: Idle
- **状態固有データ**: reason（失敗理由）
- **特殊処理**: enter時に失敗通知

## 状態遷移図

```
         ┌─────────┐
         │  Idle   │◄─────────────────────┐
         └────┬────┘                      │
              │ start()                   │
              ▼                           │
         ┌─────────┐                      │
    ┌───►│ Running │                      │
    │    └────┬────┘                      │
    │         │                           │
    │         ├──pause()──►┌─────────┐   │
    │         │            │ Paused  │───┘
    │         │            └─────────┘
    │         │  resume()
    │         │
    │         ├──startReview()──►┌────────────┐
    │         │                   │ Reviewing  │
    │         │                   └──────┬─────┘
    │         │                          │
    │         │                          ├─stop()──►Idle
    │         │                          └─complete()
    │         │                               │
    │         ├──startInvestigation()──►┌────────────────┐
    │         │                         │ Investigating  │
    │         │                         └────────┬───────┘
    │         │                                  │
    │         │                                  ├─stop()──►Idle
    │         │                                  └─resume()
    │         │                                       │
    │         ├──complete()──►┌───────────┐         │
    │         │                │ Completed │─stop()──┤
    │         │                └───────────┘         │
    │         │                                      │
    │         └──fail()──►┌─────────┐               │
    │                      │ Failed  │─stop()────────┘
    │                      └─────────┘
    │                           │
    └───────resume()────────────┘
```

## AutopilotControllerの変更点

### 変更前（問題のあるコード）
```typescript
export class AutopilotController {
  private isRunning = false;
  private isPaused = false;
  private isInvestigating = false;
  private pendingReview: { ... } | null = null;
  
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Already running');
    }
    if (this.isPaused) {
      throw new Error('Cannot start while paused');
    }
    
    this.isRunning = true;
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

### 変更後（State Pattern）
```typescript
export class AutopilotController {
  private currentState: AutopilotState;
  
  constructor(...) {
    this.currentState = new IdleState();
  }
  
  // 状態遷移（内部メソッド）
  async transitionToState(newState: AutopilotState): Promise<void> {
    if (!this.currentState.canTransitionTo(newState.name)) {
      throw new Error(
        `Invalid transition: ${this.currentState.name} -> ${newState.name}`
      );
    }
    
    await this.currentState.exit(this);
    const previousState = this.currentState.name;
    this.currentState = newState;
    await this.currentState.enter(this);
    
    // EventBusにイベント発行
    this.eventBus.emit(ServantEvents.AUTOPILOT_STATE_CHANGED, {
      from: previousState,
      to: newState.name,
      timestamp: Date.now()
    });
  }
  
  // 公開API（状態に委譲）
  async start(): Promise<void> {
    await this.currentState.start(this);
  }
  
  async pause(): Promise<void> {
    await this.currentState.pause(this);
  }
  
  async resume(): Promise<void> {
    await this.currentState.resume(this);
  }
  
  async stop(): Promise<void> {
    await this.currentState.stop(this);
  }
  
  // 状態クラスから呼ばれるヘルパーメソッド
  async executeAutopilotTask(): Promise<void> {
    // 既存のrunAutopilotTaskロジック
  }
  
  async showReviewUI(severity: 'error' | 'warning', reasons: string[]): Promise<void> {
    // レビューUI表示
  }
  
  async startAutoInvestigation(): Promise<void> {
    // 自動調査エンジン起動
  }
  
  async notifyCompletion(): Promise<void> {
    // 完了通知
  }
  
  async notifyFailure(reason: string): Promise<void> {
    // 失敗通知
  }
  
  // 状態取得
  getCurrentState(): AutopilotStateName {
    return this.currentState.name;
  }
  
  getStateDescription(): string {
    return this.currentState.getDescription();
  }
}
```

## 利点

### 1. 状態遷移ロジックの集約
- 状態チェックが各状態クラスに集約される
- `canTransitionTo()`で遷移可否を明確に定義
- 不正な遷移は実行前にエラーになる

### 2. 新しい状態の追加が容易
- 新しい状態クラスを作成するだけ
- 既存のコントローラーコードを変更不要
- 状態固有のデータ・ロジックをカプセル化

### 3. テストが容易
- 各状態クラスを独立してテスト可能
- 状態遷移のテストが明確
- モックが容易

### 4. コードの可読性向上
- 状態ごとにファイルが分離
- 状態固有の処理が明確
- 状態遷移の流れが追いやすい

### 5. 変更頻度の削減
- 状態追加時にコントローラーを変更不要
- 状態固有の処理変更が局所化
- **目標: 8回/月 → 2回/月（-75%）**

## EventBus統合

State Pattern導入と同時にEventBusも統合します。

### イベント定義
```typescript
export const ServantEvents = {
  // ... 既存のイベント
  
  // Autopilot状態変更
  AUTOPILOT_STATE_CHANGED: 'autopilot.state.changed',
  AUTOPILOT_TASK_STARTED: 'autopilot.task.started',
  AUTOPILOT_TASK_COMPLETED: 'autopilot.task.completed',
} as const;

export interface EventData {
  // ... 既存の型定義
  
  [ServantEvents.AUTOPILOT_STATE_CHANGED]: {
    from: AutopilotStateName;
    to: AutopilotStateName;
    timestamp: number;
  };
  
  [ServantEvents.AUTOPILOT_TASK_STARTED]: {
    taskId: string;
  };
  
  [ServantEvents.AUTOPILOT_TASK_COMPLETED]: {
    taskId: string;
    success: boolean;
  };
}
```

## 実装手順

### Phase 6で実装予定
1. AutopilotControllerに`currentState`フィールド追加
2. `transitionToState()`メソッド実装
3. 既存のフラグ（`isRunning`, `isPaused`等）を削除
4. 既存メソッドを状態に委譲するよう変更
5. 状態固有の処理をヘルパーメソッドに抽出
6. EventBus統合
7. 既存機能の動作確認

## 互換性

### 後方互換性
- 公開APIは変更なし（`start()`, `pause()`, `resume()`, `stop()`）
- 内部実装のみ変更
- 既存のコールバックも維持

### 段階的移行
1. 新しい状態クラスを作成（Phase 5完了）
2. AutopilotController内部で状態クラスを使用開始（Phase 6）
3. 既存のフラグを徐々に削除
4. テスト・検証

## テスト戦略

### 単体テスト
```typescript
describe('IdleState', () => {
  it('should allow transition to Running', () => {
    const state = new IdleState();
    expect(state.canTransitionTo('Running')).toBe(true);
  });
  
  it('should not allow transition to Paused', () => {
    const state = new IdleState();
    expect(state.canTransitionTo('Paused')).toBe(false);
  });
  
  it('should start autopilot', async () => {
    const state = new IdleState();
    const mockContext = createMockContext();
    await state.start(mockContext);
    expect(mockContext.transitionToState).toHaveBeenCalledWith(
      expect.any(RunningState)
    );
  });
});
```

### 統合テスト
```typescript
describe('AutopilotController State Transitions', () => {
  it('should transition from Idle to Running', async () => {
    const controller = new AutopilotController(...);
    expect(controller.getCurrentState()).toBe('Idle');
    
    await controller.start();
    expect(controller.getCurrentState()).toBe('Running');
  });
  
  it('should not allow invalid transitions', async () => {
    const controller = new AutopilotController(...);
    await expect(controller.pause()).rejects.toThrow(
      'Cannot pause from Idle state'
    );
  });
});
```

## まとめ

Phase 5でState Patternの設計が完了しました。

**作成ファイル:**
- `AutopilotState.ts` - 状態インターフェース、基底クラス
- `states/IdleState.ts` - 待機状態
- `states/RunningState.ts` - 実行状態
- `states/PausedState.ts` - 一時停止状態
- `states/ReviewingState.ts` - レビュー状態
- `states/InvestigatingState.ts` - 調査状態
- `states/CompletedState.ts` - 完了状態
- `states/FailedState.ts` - 失敗状態
- `states/index.ts` - エクスポート

**次のステップ:**
Phase 6でAutopilotControllerを実際にリファクタリングし、State Patternを統合します。
