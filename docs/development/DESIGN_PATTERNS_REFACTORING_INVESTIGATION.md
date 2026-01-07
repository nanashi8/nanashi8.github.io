# デザインパターン適用によるリファクタリング調査報告

**作成日**: 2026-01-07  
**対象**: 巨大ファイル問題（QuestionScheduler.ts 3163行、RequeuingDebugPanel.tsx 3875行、extension.ts 2060行）  
**調査パターン**: Observer Pattern, State Pattern, Strategy Pattern

---

## 🎯 調査サマリー

### 現状の問題

1. **QuestionScheduler.ts (3163行)**
   - 複数のモード切り替え（`hybridMode`, `finalPriorityMode`）
   - 状態管理の複雑化（BatchManager, SlotAllocator, AntiVibrationFilter）
   - 多数の責任が1クラスに集中（God Object化）

2. **RequeuingDebugPanel.tsx (3875行)**
   - 10以上のuseState（状態管理の分散）
   - 複数のuseEffect（副作用の複雑化）
   - UIロジックとデータ取得ロジックが混在

3. **extension.ts (2060行)**
   - 40以上のコマンド登録
   - 状態更新ロジックが散在
   - 初期化処理が巨大化

### プロジェクト設計原則（確認済み）

- ✅ Single Source of Truth (SSOT)
- ✅ 責任分離（Separation of Concerns）
- ✅ DRY（Don't Repeat Yourself）
- ✅ Open/Closed Principle（開放/閉鎖原則）
- ✅ Dependency Inversion Principle（依存性逆転原則）

---

## 🔍 適用可能性分析

### 1. Strategy Pattern（戦略パターン）

#### 適用対象: QuestionScheduler.ts

**現状の問題**:

```typescript
// 現在：if-else/switchによるモード分岐
if (params.hybridMode) {
  return this.scheduleHybridMode(params, startTime);
}
if (params.finalPriorityMode) {
  return this.scheduleFinalPriorityMode(params, startTime);
}
// デフォルト処理...
```

**リファクタリング提案**:

```typescript
// Strategy Interface
interface ScheduleStrategy {
  schedule(params: ScheduleParams): ScheduleResult;
}

// Concrete Strategies
class HybridScheduleStrategy implements ScheduleStrategy {
  schedule(params: ScheduleParams): ScheduleResult {
    // hybridMode専用ロジック
  }
}

class FinalPriorityScheduleStrategy implements ScheduleStrategy {
  schedule(params: ScheduleParams): ScheduleResult {
    // finalPriorityMode専用ロジック
  }
}

class DefaultScheduleStrategy implements ScheduleStrategy {
  schedule(params: ScheduleParams): ScheduleResult {
    // デフォルトロジック
  }
}

// Context
class QuestionScheduler {
  private strategy: ScheduleStrategy;

  setStrategy(strategy: ScheduleStrategy) {
    this.strategy = strategy;
  }

  schedule(params: ScheduleParams): ScheduleResult {
    return this.strategy.schedule(params);
  }
}
```

**メリット**:

- ✅ モード切り替えロジックの分離（Open/Closed原則）
- ✅ 各モードのテストが独立して可能
- ✅ 新しいモード追加時に既存コードを変更不要
- ✅ ファイルサイズ削減（3163行 → 推定 800行 + 各Strategy 300-500行）

**デメリット**:

- ⚠️ ファイル数増加（Strategy毎に1ファイル）
- ⚠️ 初期実装コスト（既存ロジックの分解が必要）

**優先度**: 🔴 **高** - 既に`STRATEGY_PATTERN_REFACTORING_PLAN.md`が存在し、設計済み

**実装ステップ**:

1. Strategy Interface定義
2. 既存のscheduleHybridMode/scheduleFinalPriorityModeを個別Strategyクラスへ抽出
3. QuestionSchedulerをContext（薄いラッパー）にリファクタ
4. テスト作成と既存テストの検証

---

### 2. State Pattern（状態パターン）

#### 適用対象: RequeuingDebugPanel.tsx

**現状の問題**:

```typescript
// 10以上のuseStateが散在
const [isExpanded, setIsExpanded] = useState(initialExpanded);
const [aiEvaluations, setAIEvaluations] = useState<any[]>([]);
const [copySuccess, setCopySuccess] = useState(false);
const [strugglingWords, setStrugglingWords] = useState(...);
const [interleavingDiag, setInterleavingDiag] = useState<any>(null);
const [answerLogs, setAnswerLogs] = useState<any[]>([]);
const [functionCalls, setFunctionCalls] = useState<any[]>([]);
const [abAggregate, setAbAggregate] = useState<...>(null);
// ... 他にも多数
```

**リファクタリング提案**:

```typescript
// State Interface
interface PanelState {
  render(): JSX.Element;
  handleExpand(): PanelState;
  handleCopy(): PanelState;
  handleDataUpdate(data: any): PanelState;
}

// Concrete States
class CollapsedState implements PanelState {
  constructor(private context: PanelContext) {}

  render(): JSX.Element {
    return <div className="collapsed">...</div>;
  }

  handleExpand(): PanelState {
    return new ExpandedState(this.context);
  }

  // ... その他のハンドラ
}

class ExpandedState implements PanelState {
  constructor(private context: PanelContext) {}

  render(): JSX.Element {
    return <div className="expanded">...</div>;
  }

  handleExpand(): PanelState {
    return new CollapsedState(this.context);
  }

  // ... その他のハンドラ
}

class LoadingState implements PanelState {
  // データ取得中の状態
}

// Context
class RequeuingDebugPanelContext {
  private state: PanelState;

  setState(state: PanelState) {
    this.state = state;
  }

  render() {
    return this.state.render();
  }

  expand() {
    this.setState(this.state.handleExpand());
  }
}
```

**メリット**:

- ✅ 状態ごとの振る舞いをカプセル化
- ✅ useState地獄の解消
- ✅ 状態遷移ロジックの明確化
- ✅ ファイルサイズ削減（3875行 → 推定 500行 Context + 各State 300-500行）

**デメリット**:

- ⚠️ React Hooksとの相性（Contextをカスタムフックで包む必要）
- ⚠️ 状態数が多い場合のクラス爆発

**代替案: useReducer + 状態マシン**:

```typescript
type PanelAction =
  | { type: 'EXPAND' }
  | { type: 'COLLAPSE' }
  | { type: 'LOAD_DATA'; payload: any }
  | { type: 'COPY_SUCCESS' };

type PanelStateType = 'collapsed' | 'expanded' | 'loading';

interface PanelReducerState {
  view: PanelStateType;
  data: {
    aiEvaluations: any[];
    strugglingWords: any;
    // ... 集約
  };
  ui: {
    copySuccess: boolean;
    // ... UI状態
  };
}

function panelReducer(state: PanelReducerState, action: PanelAction): PanelReducerState {
  switch (action.type) {
    case 'EXPAND':
      return { ...state, view: 'expanded' };
    case 'COLLAPSE':
      return { ...state, view: 'collapsed' };
    // ...
  }
}

// 使用
const [state, dispatch] = useReducer(panelReducer, initialState);
```

**優先度**: 🟡 **中** - React Hooksとの統合コストを考慮

**実装ステップ**:

1. useReducer版を試作（軽量で効果的）
2. 効果が高ければState Pattern（完全版）へ移行
3. カスタムフックで状態管理を分離（`useDebugPanelState`）

---

### 3. Observer Pattern（オブザーバーパターン）

#### 適用対象: extension.ts + ステータスバー連携

**現状の問題**:

```typescript
// ステータス更新が各所に散在
updateServantStatusBar('手動検証中');
// ... 処理 ...
updateServantStatusBar('待機中');

// 別の箇所
updateServantStatusBar('コミット前検証中');
// ... 処理 ...
updateServantStatusBar('待機中');
```

**リファクタリング提案**:

```typescript
// Subject (Observable)
class ServantActivitySubject {
  private observers: ActivityObserver[] = [];
  private currentActivity: string = '待機中';

  attach(observer: ActivityObserver) {
    this.observers.push(observer);
  }

  detach(observer: ActivityObserver) {
    this.observers = this.observers.filter((o) => o !== observer);
  }

  notify() {
    for (const observer of this.observers) {
      observer.update(this.currentActivity);
    }
  }

  setActivity(activity: string) {
    this.currentActivity = activity;
    this.notify();
  }

  getActivity(): string {
    return this.currentActivity;
  }
}

// Observer Interface
interface ActivityObserver {
  update(activity: string): void;
}

// Concrete Observer: ステータスバー
class StatusBarObserver implements ActivityObserver {
  constructor(private statusBar: vscode.StatusBarItem) {}

  update(activity: string) {
    const enabled = isEnabled();
    this.statusBar.text = enabled ? `🛡️ Servant: ${activity}` : 'Servant: OFF';
    this.statusBar.show();
  }
}

// Concrete Observer: ログ出力
class LogObserver implements ActivityObserver {
  update(activity: string) {
    outputChannel.appendLine(`[Activity] ${activity}`);
  }
}

// 使用
const activitySubject = new ServantActivitySubject();
activitySubject.attach(new StatusBarObserver(servantStatusBar));
activitySubject.attach(new LogObserver());

// 状態変更
activitySubject.setActivity('手動検証中');
// → 全てのObserverに自動通知
```

**メリット**:

- ✅ 状態変更と通知ロジックの分離
- ✅ 新しい通知先追加が容易（例: テレメトリ送信）
- ✅ コード重複削減（`updateServantStatusBar`呼び出しが集約）
- ✅ SSOT原則の徹底（状態は1箇所のみ）

**デメリット**:

- ⚠️ 既存コードの書き換えコスト（40箇所以上の`updateServantStatusBar`を置換）
- ⚠️ 小規模なObserverではオーバーエンジニアリングの可能性

**優先度**: 🟢 **低** - 現状でも動作しているが、将来の拡張性向上には有効

**実装ステップ**:

1. ServantActivitySubject クラス作成
2. StatusBarObserver / LogObserver 実装
3. 既存の`updateServantStatusBar`呼び出しを段階的に置換
4. テスト追加

---

## 📊 優先度マトリクス

| パターン     | 対象ファイル            | 効果（行数削減）        | 実装コスト | 優先度 | 推奨時期 |
| ------------ | ----------------------- | ----------------------- | ---------- | ------ | -------- |
| **Strategy** | QuestionScheduler.ts    | 🔴 高<br>(3163→~800行)  | 🟡 中      | 🔴 高  | 即時     |
| **State**    | RequeuingDebugPanel.tsx | 🟡 中<br>(3875→~500行)  | 🟡 中      | 🟡 中  | Phase 2  |
| **Observer** | extension.ts            | 🟢 低<br>(2060→~1900行) | 🟢 低      | 🟢 低  | Phase 3  |

---

## 🚀 推奨実装ロードマップ

### Phase 1: Strategy Pattern（即時実施）【推定: 16-24h】

**目的**: QuestionScheduler.ts の巨大化問題を解決

**タスク**:

1. ✅ `STRATEGY_PATTERN_REFACTORING_PLAN.md` 確認（既存設計活用）
2. Strategy Interface定義
3. HybridScheduleStrategy 実装
4. FinalPriorityScheduleStrategy 実装
5. DefaultScheduleStrategy 実装
6. QuestionScheduler リファクタ（Contextクラス化）
7. テスト作成
8. コミット

**成果**:

- QuestionScheduler.ts: 3163行 → ~800行（**73%削減**）
- 新規ファイル:
  - `ScheduleStrategy.ts` (Interface)
  - `HybridScheduleStrategy.ts` (~500行)
  - `FinalPriorityScheduleStrategy.ts` (~500行)
  - `DefaultScheduleStrategy.ts` (~300行)

**品質ガード通過確認**:

- ✅ 全ファイル500行以下
- ✅ 対症療法なし
- ✅ 型エラーゼロ

---

### Phase 2: State Pattern / useReducer（中期）【推定: 12-16h】

**目的**: RequeuingDebugPanel.tsx の状態管理を整理

**タスク**:

1. useReducer版プロトタイプ作成
2. PanelReducerState 型定義
3. panelReducer 実装
4. カスタムフック抽出（`useDebugPanelState`）
5. 既存のuseState置換
6. テスト作成
7. コミット

**成果**:

- RequeuingDebugPanel.tsx: 3875行 → ~500行（**87%削減**）
- 新規ファイル:
  - `useDebugPanelState.ts` (カスタムフック)
  - `panelReducer.ts` (Reducer)
  - `PanelTypes.ts` (型定義)

---

### Phase 3: Observer Pattern（長期）【推定: 8-12h】

**目的**: extension.ts の通知ロジックを整理

**タスク**:

1. ServantActivitySubject 実装
2. Observer Interface定義
3. StatusBarObserver / LogObserver 実装
4. 既存`updateServantStatusBar`置換（段階的）
5. テスト作成
6. コミット

**成果**:

- extension.ts: 2060行 → ~1900行（**8%削減**）
- 新規ファイル:
  - `ServantActivitySubject.ts`
  - `ActivityObserver.ts`

---

## 🔗 既存ドキュメントとの連携

### 利用可能な既存設計

1. **Strategy Pattern実装計画**
   - ファイル: `docs/development/STRATEGY_PATTERN_REFACTORING_PLAN.md`
   - 内容: QuestionScheduler向けStrategy Pattern詳細設計
   - 活用: Phase 1で直接利用可能

2. **Strategy vs Specialist AI分析**
   - ファイル: `docs/development/STRATEGY_PATTERN_VS_SPECIALIST_AI_ANALYSIS.md`
   - 内容: Strategy PatternとSpecialist AIの責任分離
   - 活用: 設計判断の参考資料

3. **アーキテクチャ設計原則**
   - ファイル: `docs/design/ARCHITECTURE.md`
   - 内容: プロジェクト全体の設計原則
   - 活用: リファクタリング時の判断基準

---

## ⚠️ リスク管理

### 高リスク要因

1. **既存機能の破壊**
   - 対策: テストファースト（既存動作を先にテスト化）
   - 対策: 段階的リファクタ（1パターン = 1コミット）

2. **パフォーマンス劣化**
   - 対策: リファクタ前後でベンチマーク
   - 対策: Strategy選択のオーバーヘッド最小化

3. **スコープクリープ**
   - 対策: 各Phaseで完結させる（Phase 1完了後にPhase 2着手）
   - 対策: 品質ガード通過を完了条件にする

### 中断・ロールバック基準

以下の場合は即座に中断してロールバック:

- ❌ テスト失敗率が20%を超えた
- ❌ ビルドエラーが解消できない
- ❌ パフォーマンスが50%以上劣化
- ❌ 工数が見積もりの2倍を超えた

---

## 📝 次のアクション

### 今すぐ実行可能

1. **Phase 1開始の承認を取得**
   - Strategy Pattern適用の是非確認
   - 工数見積（16-24h）の承認

2. **既存設計ドキュメントの最終確認**
   - `STRATEGY_PATTERN_REFACTORING_PLAN.md` 精読
   - 不明点の洗い出し

3. **品質ガード整備完了の確認**
   - pre-commit動作確認
   - 非対話モード動作確認

### ユーザー判断が必要

- **Phase 1を進めるか？**（推奨: YES）
- **Phase 2/3のタイミングは？**（推奨: Phase 1完了後に判断）
- **他の巨大ファイルも対象にするか？**（推奨: Phase 1の効果を見てから）

---

## 📚 参考資料

- [Strategy Pattern - Refactoring Guru](https://refactoring.guru/design-patterns/strategy)
- [State Pattern - Refactoring Guru](https://refactoring.guru/design-patterns/state)
- [Observer Pattern - Refactoring Guru](https://refactoring.guru/design-patterns/observer)
- [React Hooks: useReducer](https://react.dev/reference/react/useReducer)
- [Clean Code - Robert C. Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)

---

**調査完了日**: 2026-01-07  
**次回レビュー**: Phase 1完了時
