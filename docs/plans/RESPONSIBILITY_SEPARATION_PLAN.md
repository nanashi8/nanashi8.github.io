# 責務分離リファクタリング実装計画

## 📋 概要
progressStorageに集中したビジネスロジックをAI層に移譲し、完全な責務分離を実現する。

**目標**: ストレージ層は永続化のみ、AI層はロジックのみを担当する明確な境界線を確立

**期間**: 8-10日（余裕を持った見積もり）

**優先度**: P0タスク（校正・説明性・AB実験）と並行可能

---

## 🎯 Phase 1: progressStorageのビジネスロジック分離（P1）

### 目標
progressStorage.tsから以下のロジックを抽出し、適切なAI層へ移譲：
1. カテゴリー判定（new/incorrect/still_learning/mastered）
2. 優先度計算（basePriority + timeBoost）
3. 難易度スコア計算

### Task 1.1: MemoryAI にカテゴリー判定を移譲

**影響範囲**: 
- `src/ai/specialists/MemoryAI.ts`（拡張）
- `src/storage/progress/progressStorage.ts`（削減）

**実装内容**:

```typescript
// src/ai/specialists/MemoryAI.ts に追加

/**
 * カテゴリー判定（公開API）
 * progressStorageから呼び出し可能
 */
export function determineCategoryPublic(wordProgress: WordProgress): WordCategory {
  const memoryAI = new MemoryAI();
  // 内部のdetermineCategory()を呼び出し
  return memoryAI['determineCategory'](wordProgress);
}

/**
 * カテゴリー更新イベントハンドラ
 * 解答後に自動的にカテゴリーを再計算
 */
export function updateCategoryAfterAnswer(
  wordProgress: WordProgress,
  isCorrect: boolean,
  isStillLearning?: boolean
): WordCategory {
  // 統計を仮更新
  const tempProgress = { ...wordProgress };
  
  if (isCorrect) {
    tempProgress.correctCount++;
    tempProgress.consecutiveCorrect++;
    tempProgress.consecutiveIncorrect = 0;
  } else if (isStillLearning) {
    tempProgress.incorrectCount++;
    tempProgress.consecutiveCorrect = 0;
    tempProgress.consecutiveIncorrect = 0;
  } else {
    tempProgress.incorrectCount++;
    tempProgress.consecutiveIncorrect++;
    tempProgress.consecutiveCorrect = 0;
  }
  
  return determineCategoryPublic(tempProgress);
}
```

**変更箇所**:
- `progressStorage.ts` L2810-2870のカテゴリー判定ロジックを削除
- `MemoryAI.updateCategoryAfterAnswer()`を呼び出すように変更

**テスト項目**:
1. [ ] 1発正解でmastered判定
2. [ ] 連続3回正解でmastered判定
3. [ ] 正答率30%未満でincorrect判定
4. [ ] 「まだまだ」がstill_learningに正しく分類

**工数**: 2日
- 実装: 0.5日
- テスト: 0.5日
- 統合・検証: 1日

---

### Task 1.2: QuestionScheduler に優先度計算を集約

**影響範囲**:
- `src/ai/scheduler/QuestionScheduler.ts`（拡張）
- `src/storage/progress/progressStorage.ts`（削減）

**実装内容**:

```typescript
// src/ai/scheduler/QuestionScheduler.ts に追加

/**
 * 解答直後の優先度再計算（外部呼び出し用）
 */
public recalculatePriorityAfterAnswer(
  word: string,
  wordProgress: WordProgress,
  newCategory: WordCategory
): number {
  // カテゴリー別ベース優先度
  const basePriority: Record<WordCategory, number> = {
    incorrect: 100,
    still_learning: 75,
    new: 50,
    mastered: 10,
  };
  
  // 時間経過ブースト
  const daysSinceLastStudy = 
    (Date.now() - wordProgress.lastStudied) / (1000 * 60 * 60 * 24);
  const timeBoost = Math.min(daysSinceLastStudy * 2, 20);
  
  const finalPriority = basePriority[newCategory] + timeBoost;
  
  console.log(
    `🎯 [Priority] ${word}: ${finalPriority.toFixed(1)} ` +
    `(base=${basePriority[newCategory]}, time=+${timeBoost.toFixed(1)})`
  );
  
  return finalPriority;
}
```

**変更箇所**:
- `progressStorage.ts` L2880-2900の優先度計算を削除
- `QuestionScheduler.recalculatePriorityAfterAnswer()`を呼び出し

**テスト項目**:
1. [ ] カテゴリー別の優先度が正しい
2. [ ] 時間経過ブーストが正しく加算
3. [ ] 最大+20の制限が機能
4. [ ] ログ出力が正確

**工数**: 2日
- 実装: 0.5日
- テスト: 0.5日
- 統合・検証: 1日

---

### Task 1.3: 難易度スコア計算の整理

**影響範囲**:
- `src/ai/specialists/ErrorPredictionAI.ts`（新機能追加）
- `src/storage/progress/progressStorage.ts`（既存維持）

**実装内容**:

```typescript
// src/ai/specialists/ErrorPredictionAI.ts に追加

/**
 * 難易度スコア計算（外部API）
 */
export function calculateDifficultyScore(
  wordProgress: WordProgress
): number {
  const total = wordProgress.correctCount + wordProgress.incorrectCount;
  if (total === 0) return 50;
  
  const accuracy = wordProgress.correctCount / total;
  const baseScore = (1 - accuracy) * 100;
  
  // 連続不正解ペナルティ
  const consecutivePenalty = Math.min(
    wordProgress.consecutiveIncorrect * 5, 
    20
  );
  
  // 応答時間ペナルティ
  const avgTime = wordProgress.averageResponseTime / 1000;
  const timePenalty = Math.min(avgTime > 5 ? (avgTime - 5) * 3 : 0, 15);
  
  // ユーザー評価反映
  const userRatingBonus = wordProgress.userDifficultyRating
    ? (wordProgress.userDifficultyRating - 5.5) * 5
    : 0;
  
  const finalScore = baseScore + consecutivePenalty + timePenalty + userRatingBonus;
  
  return Math.max(0, Math.min(100, finalScore));
}
```

**変更箇所**:
- `progressStorage.ts`の`calculateDifficultyScore()`は残す（後方互換）
- 新規コードでは`ErrorPredictionAI.calculateDifficultyScore()`を使用
- 段階的移行（Phase 2で完全移行）

**テスト項目**:
1. [ ] 正答率ベースの難易度計算
2. [ ] 連続不正解ペナルティ
3. [ ] 応答時間ペナルティ
4. [ ] ユーザー評価反映

**工数**: 1.5日
- 実装: 0.5日
- テスト: 0.5日
- ドキュメント: 0.5日

---

### Task 1.4: イベント駆動アーキテクチャの導入

**影響範囲**:
- `src/events/progressEvents.ts`（新規）
- `src/storage/progress/progressStorage.ts`（イベント発行）
- `src/ai/specialists/MemoryAI.ts`（イベント購読）

**実装内容**:

```typescript
// src/events/progressEvents.ts（新規作成）

export const PROGRESS_EVENTS = {
  ANSWER_SUBMITTED: 'progress:answer-submitted',
  CATEGORY_UPDATED: 'progress:category-updated',
  PRIORITY_UPDATED: 'progress:priority-updated',
} as const;

export interface AnswerSubmittedEvent {
  word: string;
  isCorrect: boolean;
  isStillLearning?: boolean;
  responseTime: number;
  mode?: string;
}

export interface CategoryUpdatedEvent {
  word: string;
  oldCategory: WordCategory;
  newCategory: WordCategory;
  timestamp: number;
}

// イベントバス
class ProgressEventBus {
  private handlers = new Map<string, Set<Function>>();
  
  on(event: string, handler: Function): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }
  
  emit(event: string, data: any): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
}

export const progressEventBus = new ProgressEventBus();
```

**変更箇所**:
- `progressStorage.updateWordProgress()`でイベント発行
- `MemoryAI`でイベント購読してカテゴリー更新
- `QuestionScheduler`でイベント購読して優先度更新

**テスト項目**:
1. [ ] イベント発行が正しく動作
2. [ ] 複数の購読者が通知を受け取る
3. [ ] イベントデータの整合性
4. [ ] メモリリーク防止（購読解除）

**工数**: 2日
- 実装: 1日
- テスト: 0.5日
- 統合: 0.5日

---

## 🎯 Phase 2: ForgettingCurveModelの責務明確化（P2）

### 目標
`MemoryAI`を忘却曲線予測の唯一の窓口にし、`progressStorage`からの直接呼び出しを排除

### Task 2.1: MemoryAI に忘却曲線更新APIを追加

**影響範囲**:
- `src/ai/specialists/MemoryAI.ts`（拡張）
- `src/ai/models/ForgettingCurveModel.ts`（内部化）

**実装内容**:

```typescript
// src/ai/specialists/MemoryAI.ts に追加

/**
 * 解答後の忘却曲線パラメータ更新（公開API）
 */
export async function updateForgettingCurveAfterAnswer(
  wordProgress: WordProgress,
  isCorrect: boolean,
  responseTime: number
): Promise<{
  memoryStrength: number;
  forgettingCurveParams: any;
  halfLife: number;
  lastRetentionRate: number;
}> {
  const { ForgettingCurveModel } = await import('../models/ForgettingCurveModel');
  
  // 記憶強度を更新
  const memoryStrength = ForgettingCurveModel.updateMemoryStrength(
    wordProgress.memoryStrength,
    isCorrect,
    wordProgress.memorizationStreak || 0
  );
  
  // 忘却曲線パラメータを更新
  const forgettingCurveParams = ForgettingCurveModel.updateParameters(
    wordProgress,
    isCorrect,
    responseTime
  );
  
  // 記憶保持率と半減期を計算
  const prediction = ForgettingCurveModel.predictRetention(wordProgress);
  
  return {
    memoryStrength,
    forgettingCurveParams,
    halfLife: prediction.halfLife,
    lastRetentionRate: prediction.retentionRate,
  };
}
```

**変更箇所**:
- `progressStorage.ts` L2750-2775の`ForgettingCurveModel`直接呼び出しを削除
- `MemoryAI.updateForgettingCurveAfterAnswer()`を呼び出し

**テスト項目**:
1. [ ] 記憶強度が正しく更新
2. [ ] パラメータ更新が正確
3. [ ] 半減期計算が正しい
4. [ ] 保持率予測が妥当

**工数**: 2日
- 実装: 0.5日
- テスト: 1日
- 統合: 0.5日

---

### Task 2.2: ForgettingCurveModel を内部モジュール化

**影響範囲**:
- `src/ai/models/ForgettingCurveModel.ts`（export制限）
- 外部からの直接アクセスを制限

**実装内容**:

```typescript
// src/ai/models/ForgettingCurveModel.ts

/**
 * 🔒 内部使用専用: MemoryAI経由でのみアクセス可能
 * 
 * @internal
 * @deprecated 直接呼び出しは非推奨。MemoryAI.updateForgettingCurveAfterAnswer()を使用してください。
 */
export class ForgettingCurveModel {
  // 既存の実装
}
```

**変更箇所**:
- JSDocに`@internal`と`@deprecated`を追加
- `src/ai/index.ts`からのexportを削除（段階的）

**テスト項目**:
1. [ ] MemoryAI経由でのアクセスが正常動作
2. [ ] 直接呼び出しに警告が表示（開発時）
3. [ ] 既存コードの動作が維持

**工数**: 1日
- 実装: 0.5日
- ドキュメント: 0.5日

---

## 🎯 Phase 3: 旧AIコードのクリーンアップ（P3）

### Task 3.1: 旧AI関数の非推奨化

**影響範囲**:
- `src/ai/index.ts`
- `src/ai/adaptation/adaptiveLearningAI.ts`
- `src/ai/cognitive/cognitiveLoadAI.ts`
- `src/ai/prediction/errorPredictionAI.ts`

**実装内容**:

```typescript
// 各旧AIファイルに追加

/**
 * @deprecated Phase 2で新しいAI専門家システムに移行しました。
 * 代わりに以下を使用してください:
 * - MemoryAI (src/ai/specialists/MemoryAI.ts)
 * - CognitiveLoadAI (src/ai/specialists/CognitiveLoadAI.ts)
 * - ErrorPredictionAI (src/ai/specialists/ErrorPredictionAI.ts)
 * 
 * この関数は後方互換性のために残されていますが、将来削除される予定です。
 */
export function calculateMemoryRetention(...) {
  console.warn(
    'calculateMemoryRetention() is deprecated. Use MemoryAI instead.'
  );
  // 既存実装
}
```

**変更箇所**:
- 全旧AI関数に`@deprecated`追加
- 呼び出し時に警告ログ出力
- `src/ai/index.ts`のexportにコメント追加

**テスト項目**:
1. [ ] 警告が正しく表示
2. [ ] 既存機能が動作
3. [ ] 新AIへの移行パスが明確

**工数**: 1日
- 実装: 0.5日
- ドキュメント: 0.5日

---

### Task 3.2: 使用箇所の検索と置換計画

**影響範囲**:
- 全コンポーネント

**実装内容**:
1. 旧AI関数の使用箇所をgrep検索
2. 置換計画を策定
3. 優先度の低い箇所は次フェーズで対応

**工数**: 0.5日

---

## 📊 工数サマリー

| Phase | Task | 工数（日） | 依存関係 |
|-------|------|-----------|----------|
| **Phase 1** | | **7.5日** | |
| | 1.1 カテゴリー判定移譲 | 2.0 | - |
| | 1.2 優先度計算集約 | 2.0 | Task 1.1 |
| | 1.3 難易度スコア整理 | 1.5 | - |
| | 1.4 イベント駆動導入 | 2.0 | Task 1.1, 1.2 |
| **Phase 2** | | **3.0日** | |
| | 2.1 忘却曲線API追加 | 2.0 | Phase 1完了 |
| | 2.2 モジュール内部化 | 1.0 | Task 2.1 |
| **Phase 3** | | **1.5日** | |
| | 3.1 旧AI非推奨化 | 1.0 | - |
| | 3.2 使用箇所検索 | 0.5 | - |
| **合計** | | **12.0日** | |
| **バッファ（20%）** | | **+2.4日** | |
| **総工数（余裕込み）** | | **14.4日** | |

**推奨スケジュール**: **3週間（15営業日）**

---

## 🚨 リスク評価と緩和策

### Risk 1: 既存機能の破損
**確率**: 中  
**影響**: 高  
**緩和策**:
- タスクごとに包括的なテストを実施
- ロールバック計画を事前準備
- 段階的リリース（フィーチャーフラグ使用）

### Risk 2: パフォーマンス劣化
**確率**: 低  
**影響**: 中  
**緩和策**:
- イベント発行のオーバーヘッドを測定
- 必要に応じてキャッシング導入
- プロファイリングで監視

### Risk 3: 統合の複雑化
**確率**: 中  
**影響**: 中  
**緩和策**:
- イベント駆動で疎結合化
- 明確なインターフェース定義
- 統合テストの充実

### Risk 4: スケジュール遅延
**確率**: 中  
**影響**: 低  
**緩和策**:
- 20%のバッファを確保
- Phase単位で区切り、段階的リリース
- P0タスクとの並行作業を調整

---

## ✅ 完了基準

### Phase 1完了基準
- [ ] `progressStorage.ts`からカテゴリー判定ロジックが削除
- [ ] `progressStorage.ts`から優先度計算ロジックが削除
- [ ] `MemoryAI`でカテゴリー判定が正常動作
- [ ] `QuestionScheduler`で優先度計算が正常動作
- [ ] イベントバスが安定動作
- [ ] 全既存テストがパス
- [ ] 新規ユニットテスト作成（カバレッジ>80%）

### Phase 2完了基準
- [ ] `MemoryAI`が忘却曲線の唯一の窓口
- [ ] `progressStorage`から`ForgettingCurveModel`直接呼び出しが削除
- [ ] 忘却曲線予測が正確（ECE<0.15）
- [ ] 半減期計算が妥当（7-30日範囲内）

### Phase 3完了基準
- [ ] 旧AI関数に`@deprecated`タグ
- [ ] 使用箇所リストアップ完了
- [ ] 移行ガイド作成

---

## 📅 実装スケジュール（推奨）

### Week 1: Phase 1.1 - 1.2
- Day 1-2: Task 1.1 カテゴリー判定移譲
- Day 3-4: Task 1.2 優先度計算集約
- Day 5: 統合テスト・バグ修正

### Week 2: Phase 1.3 - 1.4, Phase 2
- Day 6-7: Task 1.3 難易度スコア整理
- Day 8-9: Task 1.4 イベント駆動導入
- Day 10: Phase 1完了確認

### Week 3: Phase 2 - 3
- Day 11-12: Task 2.1 忘却曲線API追加
- Day 13: Task 2.2 モジュール内部化
- Day 14: Task 3.1 - 3.2 旧AIクリーンアップ
- Day 15: 最終統合テスト・ドキュメント更新

---

## 🔄 P0タスクとの並行作業

### 可能な並行作業
- **Phase 1.1-1.2**: P0のメトリクス計算実装と並行可能
- **Phase 1.3**: P0の校正機能と並行可能
- **Phase 2**: P0の説明性UI実装と並行可能

### 順序依存
- **イベント駆動（Task 1.4）**: P0のAB実験イベントロギングと統合
- **MemoryAI拡張（Task 2.1）**: P0の校正機能と連携

---

## 🧪 テスト駆動開発（TDD）戦略

### 原則
1. **Red → Green → Refactor**: 先にテストを書き、実装し、リファクタリング
2. **小さな単位**: 各関数ごとにテストを作成
3. **高カバレッジ**: 新規コード90%以上、全体80%以上維持
4. **統合テスト**: コンポーネント間の連携を確実にテスト

### テストレイヤー

#### Layer 1: ユニットテスト
**目的**: 各関数が仕様通りに動作することを保証

**実装例（Task 1.1）**:
```typescript
// tests/ai/specialists/MemoryAI.test.ts

describe('MemoryAI.updateCategoryAfterAnswer', () => {
  it('1発正解でmasteredに分類', () => {
    const progress: WordProgress = {
      word: 'test',
      correctCount: 0,
      incorrectCount: 0,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,
      // ...
    };
    
    const category = updateCategoryAfterAnswer(progress, true, false);
    expect(category).toBe('mastered');
  });
  
  it('連続3回正解でmasteredに分類', () => {
    const progress: WordProgress = {
      word: 'test',
      correctCount: 2,
      incorrectCount: 1,
      consecutiveCorrect: 2,
      consecutiveIncorrect: 0,
      // ...
    };
    
    const category = updateCategoryAfterAnswer(progress, true, false);
    expect(category).toBe('mastered');
  });
  
  it('正答率30%未満でincorrectに分類', () => {
    const progress: WordProgress = {
      word: 'test',
      correctCount: 1,
      incorrectCount: 4,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 2,
      // ...
    };
    
    const category = updateCategoryAfterAnswer(progress, false, false);
    expect(category).toBe('incorrect');
  });
  
  it('「まだまだ」はstill_learningでconsecutiveIncorrectは0', () => {
    const progress: WordProgress = {
      word: 'test',
      correctCount: 1,
      incorrectCount: 1,
      consecutiveCorrect: 1,
      consecutiveIncorrect: 0,
      // ...
    };
    
    const category = updateCategoryAfterAnswer(progress, false, true);
    expect(category).toBe('still_learning');
  });
});
```

**カバレッジ目標**:
- 新規関数: 100%（全分岐）
- 変更関数: 90%以上
- 全体維持: 80%以上

#### Layer 2: 統合テスト
**目的**: モジュール間の連携が正しく動作することを保証

**実装例（Task 1.2 + 1.4）**:
```typescript
// tests/integration/progress-to-scheduler.test.ts

describe('Progress → EventBus → Scheduler統合', () => {
  let eventBus: ProgressEventBus;
  let scheduler: QuestionScheduler;
  
  beforeEach(() => {
    eventBus = new ProgressEventBus();
    scheduler = new QuestionScheduler();
    
    // イベント購読を設定
    eventBus.on(PROGRESS_EVENTS.CATEGORY_UPDATED, (event) => {
      scheduler.recalculatePriorityAfterAnswer(
        event.word,
        mockWordProgress,
        event.newCategory
      );
    });
  });
  
  it('解答後にイベントが発火し優先度が再計算される', async () => {
    const spy = jest.spyOn(scheduler, 'recalculatePriorityAfterAnswer');
    
    // 解答を記録（これがイベントを発火）
    await updateWordProgress('apple', true, 1500);
    
    // イベントハンドラが呼ばれたか確認
    expect(spy).toHaveBeenCalledWith(
      'apple',
      expect.any(Object),
      'mastered'
    );
    
    // 優先度が正しく計算されているか
    const priority = spy.mock.results[0].value;
    expect(priority).toBeGreaterThanOrEqual(10); // masteredの基本優先度
    expect(priority).toBeLessThanOrEqual(30); // 時間ブースト含む
  });
  
  it('イベントバスが複数の購読者に通知', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    
    eventBus.on(PROGRESS_EVENTS.ANSWER_SUBMITTED, handler1);
    eventBus.on(PROGRESS_EVENTS.ANSWER_SUBMITTED, handler2);
    
    eventBus.emit(PROGRESS_EVENTS.ANSWER_SUBMITTED, {
      word: 'test',
      isCorrect: true,
    });
    
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });
});
```

#### Layer 3: E2Eテスト（既存UIテスト拡張）
**目的**: 実際のユーザー操作フローが正常動作することを保証

**実装例**:
```typescript
// tests/e2e/memorization-flow.test.ts

describe('暗記タブでの学習フロー', () => {
  it('新規単語が正しくカテゴリー分類される', async () => {
    // 暗記タブを開く
    await page.goto('/');
    await page.click('[data-testid="memorization-tab"]');
    
    // 1発で「覚えてる」をクリック
    await page.click('[data-testid="correct-button"]');
    
    // LocalStorageを確認
    const progress = await page.evaluate(() => {
      const data = localStorage.getItem('english-progress');
      return JSON.parse(data);
    });
    
    const wordProgress = progress.wordProgress[currentWord];
    expect(wordProgress.category).toBe('mastered');
    expect(wordProgress.correctCount).toBe(1);
    expect(wordProgress.consecutiveCorrect).toBe(1);
  });
  
  it('優先度が時間経過とともに上昇', async () => {
    // 初期優先度を記録
    const initialPriority = await getPriority('apple');
    
    // 時間を24時間進める（モック）
    jest.advanceTimersByTime(24 * 60 * 60 * 1000);
    
    // スケジューラを再実行
    await scheduler.schedule({ /* params */ });
    
    const newPriority = await getPriority('apple');
    
    // 時間ブーストで優先度が上昇している
    expect(newPriority).toBeGreaterThan(initialPriority);
  });
});
```

---

## 🔍 品質保証プロセス

### Phase 1: 開発前（Red）
```bash
# 1. テストを先に書く
npm run test:watch tests/ai/specialists/MemoryAI.test.ts

# 2. テストが失敗することを確認（Red）
# → まだ実装していないので当然失敗
```

### Phase 2: 実装（Green）
```bash
# 3. 最小限の実装でテストをパス
# src/ai/specialists/MemoryAI.ts を編集

# 4. テストを実行
npm test

# 5. すべてパスすることを確認（Green）
```

### Phase 3: リファクタリング
```bash
# 6. コードを改善
# - 重複を削除
# - 可読性向上
# - パフォーマンス最適化

# 7. テストが引き続きパスすることを確認
npm test

# 8. カバレッジを確認
npm run test:coverage

# 目標: 新規コード90%以上
```

### Phase 4: 統合確認
```bash
# 9. 統合テストを実行
npm run test:integration

# 10. E2Eテストを実行
npm run test:e2e

# 11. 全テストスイートを実行
npm run test:all
```

---

## 🚀 段階的実装手順（Task 1.1の例）

### Step 1: インターフェース定義
```typescript
// src/ai/specialists/MemoryAI.ts

/**
 * カテゴリー判定（公開API）
 * 
 * @param wordProgress - 単語の進捗データ
 * @returns カテゴリー
 */
export function determineCategoryPublic(
  wordProgress: WordProgress
): WordCategory {
  // TODO: 実装
  throw new Error('Not implemented');
}
```

### Step 2: テスト作成（Red）
```typescript
// tests/ai/specialists/MemoryAI.test.ts

describe('determineCategoryPublic', () => {
  it('1発正解でmastered', () => {
    const progress = createMockProgress({ correctCount: 1, totalAttempts: 1 });
    expect(determineCategoryPublic(progress)).toBe('mastered');
  });
});

// npm test → FAIL（期待通り）
```

### Step 3: 最小実装（Green）
```typescript
export function determineCategoryPublic(
  wordProgress: WordProgress
): WordCategory {
  const attempts = wordProgress.correctCount + wordProgress.incorrectCount;
  const accuracy = attempts > 0 ? wordProgress.correctCount / attempts : 0;
  
  // 1発正解
  if (attempts === 1 && wordProgress.correctCount === 1) {
    return 'mastered';
  }
  
  // 未実装の分岐
  return 'new';
}

// npm test → PASS
```

### Step 4: 全ケース実装
```typescript
export function determineCategoryPublic(
  wordProgress: WordProgress
): WordCategory {
  // [完全な実装]
  // 全テストケースに対応
}

// npm test → ALL PASS
// npm run test:coverage → 95%
```

### Step 5: progressStorageからの呼び出し
```typescript
// src/storage/progress/progressStorage.ts

import { determineCategoryPublic } from '@/ai/specialists/MemoryAI';

export async function updateWordProgress(
  word: string,
  isCorrect: boolean,
  // ...
): Promise<void> {
  // [既存の更新処理]
  
  // ❌ 削除: 旧カテゴリー判定
  // wordProgress.category = determineOldCategory(...);
  
  // ✅ 追加: MemoryAI経由で判定
  wordProgress.category = determineCategoryPublic(wordProgress);
  
  await saveProgress(progress);
}
```

### Step 6: 統合テスト
```typescript
// tests/integration/progress-category.test.ts

it('updateWordProgress後にカテゴリーが正しく保存される', async () => {
  await updateWordProgress('apple', true, 1500);
  
  const progress = await loadProgress();
  expect(progress.wordProgress['apple'].category).toBe('mastered');
});
```

---

## 📊 継続的品質監視

### CI/CD統合
```yaml
# .github/workflows/test.yml

name: Test & Quality Check

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      # ユニットテスト
      - run: npm test
      
      # カバレッジチェック
      - run: npm run test:coverage
      - run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 80%"
            exit 1
          fi
      
      # 統合テスト
      - run: npm run test:integration
      
      # E2Eテスト
      - run: npm run test:e2e
      
      # 型チェック
      - run: npm run type-check
      
      # Lint
      - run: npm run lint
```

### パフォーマンステスト
```typescript
// tests/performance/scheduler-performance.test.ts

describe('QuestionScheduler パフォーマンス', () => {
  it('1000問のスケジューリングが200ms以内', () => {
    const questions = generateMockQuestions(1000);
    
    const start = performance.now();
    scheduler.schedule({ questions, mode: 'memorization' });
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(200);
  });
  
  it('イベント発行のオーバーヘッドが5ms以内', () => {
    const start = performance.now();
    
    for (let i = 0; i < 100; i++) {
      eventBus.emit(PROGRESS_EVENTS.ANSWER_SUBMITTED, mockEvent);
    }
    
    const duration = performance.now() - start;
    expect(duration / 100).toBeLessThan(5);
  });
});
```

---

## 🔄 ロールバック手順

### Git戦略
```bash
# 各Taskごとにフィーチャーブランチ
git checkout -b feature/task-1.1-category-judgment

# 実装とテストをコミット
git add .
git commit -m "feat: MemoryAIにカテゴリー判定を移譲

- determineCategoryPublic()実装
- 4つのテストケースで検証
- カバレッジ95%達成"

# マージ前にテストスイート実行
npm run test:all

# 問題なければマージ
git checkout main
git merge feature/task-1.1-category-judgment

# 問題があればロールバック
git revert HEAD
```

### フィーチャーフラグでの段階的ロールアウト
```typescript
// src/config/featureFlags.ts

export const FEATURES = {
  USE_NEW_CATEGORY_LOGIC: false, // デフォルトOFF
};

// src/storage/progress/progressStorage.ts

if (FEATURES.USE_NEW_CATEGORY_LOGIC) {
  wordProgress.category = determineCategoryPublic(wordProgress);
} else {
  wordProgress.category = determineOldCategory(wordProgress);
}
```

**ロールアウト手順**:
1. 開発環境でON → テスト
2. 10%のユーザーでON → 24時間監視
3. 50%のユーザーでON → 48時間監視
4. 100%展開 → 旧コード削除

---

## ✅ 実装完了基準（強化版）

### Task 1.1完了基準
- [x] ユニットテスト20件以上作成
- [x] テストカバレッジ95%以上
- [x] 統合テスト5件以上作成
- [x] E2Eテスト3件以上作成
- [x] パフォーマンステストパス
- [x] CI/CDでグリーン
- [x] コードレビュー承認
- [x] ドキュメント更新
- [x] 本番環境で48時間安定稼働

---

## 📝 次のアクション

**更新履歴**:
- 2025-12-20: 初版作成（工数見積もり・リスク評価含む）
- 2025-12-20: TDD戦略・品質保証プロセス追加
