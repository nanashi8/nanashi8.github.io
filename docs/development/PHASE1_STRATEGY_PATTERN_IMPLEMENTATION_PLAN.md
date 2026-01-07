# Phase 1: Strategy Pattern 実装計画

**開始日**: 2026-01-07  
**対象**: QuestionScheduler.ts のモード切り替えロジックをStrategy Patternでリファクタリング  
**目標**: 3,163行 → ~800行（73%削減）  
**工数見積**: 16-24時間

---

## 🎯 実装目標

### Before（現状）
```typescript
// QuestionScheduler.ts (3,163行)
class QuestionScheduler {
  async schedule(params: ScheduleParams): Promise<ScheduleResult> {
    // ... 共通処理（バッチ管理、A/Bテスト等）...
    
    if (params.hybridMode) {
      return this.scheduleHybridMode(params, startTime);
    }
    
    if (params.finalPriorityMode) {
      return this.scheduleFinalPriorityMode(params, startTime);
    }
    
    // デフォルトロジック（1,500行以上）
    // ...
  }
  
  private scheduleHybridMode(params, startTime) { /* 500行 */ }
  private scheduleFinalPriorityMode(params, startTime) { /* 500行 */ }
}
```

### After（目標）
```typescript
// QuestionScheduler.ts (~800行) - Contextクラス
class QuestionScheduler {
  private strategy: ScheduleStrategy;
  
  async schedule(params: ScheduleParams): Promise<ScheduleResult> {
    // 共通処理（バッチ管理、A/Bテスト等）
    const context = this.buildContext(params);
    
    // Strategy選択
    this.selectStrategy(params);
    
    // Strategy実行
    return this.strategy.schedule(context);
  }
  
  private selectStrategy(params: ScheduleParams): void {
    if (params.hybridMode) {
      this.strategy = new HybridScheduleStrategy(this.dependencies);
    } else if (params.finalPriorityMode) {
      this.strategy = new FinalPriorityScheduleStrategy(this.dependencies);
    } else {
      this.strategy = new DefaultScheduleStrategy(this.dependencies);
    }
  }
}

// 新規ファイル
// - HybridScheduleStrategy.ts (~500行)
// - FinalPriorityScheduleStrategy.ts (~500行)
// - DefaultScheduleStrategy.ts (~700行)
// - ScheduleStrategy.ts (Interface)
```

---

## 📋 実装工程（全8工程）

### 工程1: Strategy Interface定義【2h】

**ファイル**: `src/ai/scheduler/strategies/ScheduleStrategy.ts`

**タスク**:
- [ ] Interface定義
  ```typescript
  export interface ScheduleStrategy {
    schedule(context: ScheduleContext): Promise<ScheduleResult>;
  }
  
  export interface ScheduleContext {
    params: ScheduleParams;
    startTime: number;
    dependencies: SchedulerDependencies;
  }
  
  export interface SchedulerDependencies {
    antiVibration: AntiVibrationFilter;
    aiCoordinator: AICoordinator;
    slotAllocator: SlotAllocator;
    batchManager: BatchManager | null;
  }
  ```

- [ ] 共通ベースクラス作成（オプション）
  ```typescript
  export abstract class BaseScheduleStrategy implements ScheduleStrategy {
    protected deps: SchedulerDependencies;
    
    constructor(deps: SchedulerDependencies) {
      this.deps = deps;
    }
    
    abstract schedule(context: ScheduleContext): Promise<ScheduleResult>;
    
    // 共通ヘルパーメソッド
    protected buildResult(questions: PrioritizedQuestion[], meta: any): ScheduleResult {
      // ...
    }
  }
  ```

**検証**:
- [ ] TypeScript型チェック通過

---

### 工程2: DefaultScheduleStrategy実装【6h】

**ファイル**: `src/ai/scheduler/strategies/DefaultScheduleStrategy.ts`

**タスク**:
- [ ] QuestionScheduler.ts の`schedule()`メソッドからデフォルトロジックを抽出
- [ ] 以下の処理を移行:
  - カテゴリー分類（新規/不正解/学習中/定着済み）
  - 優先度計算（DTA + timeBoost + signals）
  - スロット割り当て（SlotAllocator使用）
  - ソート処理
  - 振動防止フィルタ適用
  - デバッグ情報出力

**コード例**:
```typescript
export class DefaultScheduleStrategy extends BaseScheduleStrategy {
  async schedule(context: ScheduleContext): Promise<ScheduleResult> {
    const { params, startTime } = context;
    const { questions, mode, sessionStats } = params;
    
    // 1. カテゴリー分類
    const categorized = this.categorizeQuestions(questions, mode);
    
    // 2. 優先度計算
    const prioritized = await this.calculatePriorities(
      categorized,
      sessionStats,
      context
    );
    
    // 3. スロット割り当て
    const allocated = this.allocateSlots(prioritized, params);
    
    // 4. ソート
    const sorted = this.sortByPriority(allocated);
    
    // 5. 振動防止
    const filtered = this.deps.antiVibration.filter(sorted, mode);
    
    // 6. 結果構築
    return this.buildResult(filtered, {
      source: 'DefaultScheduleStrategy',
      elapsed: performance.now() - startTime,
    });
  }
  
  private categorizeQuestions(questions: Question[], mode: ScheduleMode) {
    // 実装...
  }
  
  private async calculatePriorities(...) {
    // 実装...
  }
  
  // ... 他のヘルパーメソッド
}
```

**検証**:
- [ ] 既存テスト（デフォルトモード）全てパス
- [ ] デバッグログ出力確認
- [ ] パフォーマンス劣化なし（ベンチマーク）

---

### 工程3: HybridScheduleStrategy実装【4h】

**ファイル**: `src/ai/scheduler/strategies/HybridScheduleStrategy.ts`

**タスク**:
- [ ] `scheduleHybridMode()`メソッドをStrategyクラスへ移行
- [ ] AICoordinatorのfinalPriorityを主に使用するロジック
- [ ] 既存の共通処理（振動防止等）を継承

**コード例**:
```typescript
export class HybridScheduleStrategy extends BaseScheduleStrategy {
  async schedule(context: ScheduleContext): Promise<ScheduleResult> {
    const { params, startTime } = context;
    
    // AICoordinator経由でfinalPriority取得
    const prioritized = await this.calculateHybridPriorities(context);
    
    // ソート + フィルタ
    const sorted = this.sortByFinalPriority(prioritized);
    const filtered = this.deps.antiVibration.filter(sorted, params.mode);
    
    return this.buildResult(filtered, {
      source: 'HybridScheduleStrategy',
      elapsed: performance.now() - startTime,
    });
  }
}
```

**検証**:
- [ ] 既存テスト（hybridMode=true）全てパス
- [ ] AICoordinator連携確認

---

### 工程4: FinalPriorityScheduleStrategy実装【4h】

**ファイル**: `src/ai/scheduler/strategies/FinalPriorityScheduleStrategy.ts`

**タスク**:
- [ ] `scheduleFinalPriorityMode()`メソッドをStrategyクラスへ移行
- [ ] variant=C用のfinalPriority主因ロジック

**コード例**:
```typescript
export class FinalPriorityScheduleStrategy extends BaseScheduleStrategy {
  async schedule(context: ScheduleContext): Promise<ScheduleResult> {
    // finalPriorityModeロジック実装
    // ...
  }
}
```

**検証**:
- [ ] 既存テスト（finalPriorityMode=true）全てパス

---

### 工程5: QuestionSchedulerリファクタ（Context化）【4h】

**ファイル**: `src/ai/scheduler/QuestionScheduler.ts`

**タスク**:
- [ ] 巨大なロジックを削除（Strategy側へ移行済み）
- [ ] Strategy選択ロジック追加
- [ ] 共通処理のみ残す（バッチ管理、A/Bテスト等）

**Before/After比較**:
```typescript
// Before: 3,163行
class QuestionScheduler {
  async schedule(params) {
    // バッチ管理（150行）
    // A/Bテスト（50行）
    
    if (params.hybridMode) {
      return this.scheduleHybridMode(params, startTime); // 500行
    }
    if (params.finalPriorityMode) {
      return this.scheduleFinalPriorityMode(params, startTime); // 500行
    }
    
    // デフォルトロジック（1,500行）
    // ...
  }
}

// After: ~800行
class QuestionScheduler {
  private strategy: ScheduleStrategy | null = null;
  
  async schedule(params: ScheduleParams): Promise<ScheduleResult> {
    const startTime = performance.now();
    
    // 1. バッチ管理（150行）
    if (BatchManager.isEnabled()) {
      // ... バッチ処理
    }
    
    // 2. A/Bテスト（50行）
    if (typeof params.useChainLearning !== 'boolean') {
      params = { ...params, useChainLearning: getABTestManager().isFeatureEnabled(...) };
    }
    
    // 3. Context構築
    const context: ScheduleContext = {
      params,
      startTime,
      dependencies: {
        antiVibration: this.antiVibration,
        aiCoordinator: this.aiCoordinator,
        slotAllocator: this.slotAllocator,
        batchManager: this.batchManager,
      },
    };
    
    // 4. Strategy選択
    this.selectStrategy(params);
    
    // 5. Strategy実行
    return this.strategy!.schedule(context);
  }
  
  private selectStrategy(params: ScheduleParams): void {
    if (params.hybridMode) {
      this.strategy = new HybridScheduleStrategy(this.getDependencies());
    } else if (params.finalPriorityMode) {
      this.strategy = new FinalPriorityScheduleStrategy(this.getDependencies());
    } else {
      this.strategy = new DefaultScheduleStrategy(this.getDependencies());
    }
  }
  
  private getDependencies(): SchedulerDependencies {
    return {
      antiVibration: this.antiVibration,
      aiCoordinator: this.aiCoordinator,
      slotAllocator: this.slotAllocator,
      batchManager: this.batchManager,
    };
  }
}
```

**検証**:
- [ ] ファイルサイズ: 3,163行 → ~800行
- [ ] 全テストパス
- [ ] 品質ガード通過（行数500/1000チェック）

---

### 工程6: 共通ヘルパーメソッド抽出【2h】

**ファイル**: `src/ai/scheduler/strategies/ScheduleHelpers.ts`

**タスク**:
- [ ] 複数Strategyで共通するヘルパー関数を抽出
  - カテゴリー分類ロジック
  - 優先度計算の共通部分
  - ソート・フィルタ処理
  - デバッグ情報出力

**コード例**:
```typescript
export class ScheduleHelpers {
  static categorizeQuestions(
    questions: Question[],
    mode: ScheduleMode,
    progressMap: Record<string, any>
  ): CategorizedQuestions {
    // ...
  }
  
  static buildDebugInfo(result: ScheduleResult, meta: any): void {
    // ...
  }
}
```

---

### 工程7: テスト作成・更新【3h】

**ファイル**: 
- `tests/unit/scheduler/DefaultScheduleStrategy.test.ts` (新規)
- `tests/unit/scheduler/HybridScheduleStrategy.test.ts` (新規)
- `tests/unit/scheduler/FinalPriorityScheduleStrategy.test.ts` (新規)
- `tests/unit/questionScheduler.test.ts` (既存・更新)

**タスク**:
- [ ] 各Strategy単独のユニットテスト作成
- [ ] QuestionScheduler統合テスト更新
- [ ] 既存テスト全てパス確認

**テストケース例**:
```typescript
describe('DefaultScheduleStrategy', () => {
  it('should categorize questions correctly', async () => {
    // ...
  });
  
  it('should calculate priorities with DTA', async () => {
    // ...
  });
  
  it('should apply anti-vibration filter', async () => {
    // ...
  });
});
```

---

### 工程8: ドキュメント更新・コミット【1h】

**タスク**:
- [ ] CHANGELOG.md更新
- [ ] コード内コメント追加（JSDoc）
- [ ] README更新（Strategy Pattern採用を記載）
- [ ] コミット

**コミットメッセージ例**:
```
refactor(scheduler): Strategy Patternでモード切り替えロジックを分離

- QuestionScheduler.ts: 3,163行 → 800行（73%削減）
- 新規Strategy:
  - DefaultScheduleStrategy.ts (700行)
  - HybridScheduleStrategy.ts (500行)
  - FinalPriorityScheduleStrategy.ts (500行)
- 既存テスト全てパス
- パフォーマンス劣化なし
```

---

## ⚠️ リスク管理

### 高リスク項目

1. **既存機能の破壊**
   - 対策: テストファースト（工程2-4で既存動作を先にテスト化）
   - 検証: 各工程で既存テスト全てパス確認

2. **パフォーマンス劣化**
   - 対策: 工程5でベンチマーク実施
   - 基準: Strategy選択のオーバーヘッド < 1ms

3. **依存関係の複雑化**
   - 対策: SchedulerDependenciesで明示的に注入
   - 検証: 循環依存チェック

### 中断・ロールバック基準

以下の場合は即座に中断:
- ❌ テスト失敗率が20%を超えた
- ❌ ビルドエラーが解消できない（1時間以上）
- ❌ パフォーマンスが50%以上劣化
- ❌ 工数が見積もりの2倍（32h）を超えた

---

## 📊 進捗チェックリスト

### 事前準備
- [ ] Phase 1実施の承認取得
- [ ] 既存設計ドキュメント精読完了
- [ ] 開発環境セットアップ確認
- [ ] ブランチ作成（`refactor/strategy-pattern-phase1`）

### 実装工程
- [ ] 工程1: Strategy Interface定義【2h】
- [ ] 工程2: DefaultScheduleStrategy実装【6h】
- [ ] 工程3: HybridScheduleStrategy実装【4h】
- [ ] 工程4: FinalPriorityScheduleStrategy実装【4h】
- [ ] 工程5: QuestionSchedulerリファクタ【4h】
- [ ] 工程6: 共通ヘルパー抽出【2h】
- [ ] 工程7: テスト作成・更新【3h】
- [ ] 工程8: ドキュメント更新・コミット【1h】

### 完了条件
- [ ] 全ファイルが品質ガード通過（500行/1000行チェック）
- [ ] TypeScriptエラー0件
- [ ] ESLintエラー0件
- [ ] 既存テスト全てパス
- [ ] 新規テスト作成完了
- [ ] パフォーマンス劣化なし（ベンチマーク）
- [ ] コードレビュー完了
- [ ] mainブランチへマージ

---

## 🚀 次のアクション

### 今すぐ実行可能
1. **Phase 1開始の最終確認**
   - ユーザー承認: 「Phase 1を開始しますか？」
   - 工数見積（16-24h）の確認

2. **ブランチ作成**
   ```bash
   git checkout -b refactor/strategy-pattern-phase1
   ```

3. **工程1開始**
   - Strategy Interface定義ファイル作成

### 実装中の注意事項
- ✅ 1工程 = 1コミット（段階的実装）
- ✅ 各工程で品質ガード通過確認
- ✅ テスト失敗時は即座に原因調査
- ✅ 対症療法禁止（根本原因を解決）

---

**計画作成日**: 2026-01-07  
**開始予定日**: ユーザー承認後  
**完了予定日**: 開始から3日以内（実稼働16-24h）
