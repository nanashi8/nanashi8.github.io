# Strategy Pattern リファクタリング実装計画

**作成日**: 2025年12月23日  
**対象**: Position計算ロジックのリファクタリング  
**目的**: 171行のif-elseチェーンをStrategy Patternで整理し、保守性・テスト性を向上

---

## 📊 現状分析

### 対象ファイル
- **メインファイル**: `src/ai/utils/categoryDetermination.ts` (171行)
- **依存ファイル**: 8ファイル
  - QuestionScheduler.ts（4箇所で使用）
  - MemoryAI.ts（1箇所）
  - priorityExplanation.ts（1箇所）
  - statistics.ts（5箇所）
  - progressStorage.ts（1箇所）

### Magic Numbers（定数化対象）
```typescript
// Position範囲
0-20   // mastered（定着済み）
20-40  // new（新規）
40-70  // still_learning（学習中）
70-100 // incorrect（要復習）

// 閾値
3  // 連続正解で定着
2  // 連続正解でほぼ定着
3  // 連続不正解で最優先
2  // 連続不正解で高優先

// Position値
10, 15, 18, 25, 30, 35, 45, 50, 55, 70, 75, 85

// ブースト値
15, 10, 5  // まだまだブースト
15         // 時間経過ブースト上限
1.5        // 時間経過係数

// 正答率閾値
0.9, 0.8, 0.6, 0.5
```

### 既存テスト
- `tests/unit/questionScheduler.test.ts`
- Position関連テスト: 3ファイル

---

## 🎯 リファクタリング方針

### 設計原則
1. **Specialist AI常時稼働** - AI無効/有効の切り替えは考慮しない
2. **段階的移行** - 各フェーズで動作検証
3. **後方互換性維持** - 既存のAPI（`determineWordPosition()`）を保持
4. **テストカバレッジ維持** - 既存テストを全てパス

### アーキテクチャ
```
Layer 1: Strategy Pattern（決定論的）
  ├── ConsecutiveCorrectStrategy（連続正解判定）
  ├── ConsecutiveIncorrectStrategy（連続不正解判定）
  ├── StillLearningStrategy（まだまだ判定）
  ├── NewWordStrategy（新規単語判定）
  └── DefaultStrategy（デフォルト計算）
  ↓
Layer 2: Specialist AI（確率的・文脈依存）
  ├── GamificationAI（Position調整）
  ├── MemoryAI（忘却曲線）
  └── その他のSpecialist AI
  ↓
Final Position
```

---

## 📋 実装計画（3フェーズ）

### Phase 1: Constants抽出【優先度：高】

**目的**: Magic numbers削減、意味を明確化

#### 工程1-1: Constants定義ファイル作成
- **ファイル**: `src/ai/utils/positionConstants.ts`
- **工数**: 1時間
- **内容**:
  ```typescript
  export const POSITION_RANGES = {
    MASTERED: { min: 0, max: 20, default: 10 },
    NEW: { min: 20, max: 40, default: 35 },
    STILL_LEARNING: { min: 40, max: 70, default: 50 },
    INCORRECT: { min: 70, max: 100, default: 85 }
  } as const;
  
  export const CONSECUTIVE_THRESHOLDS = {
    MASTERED: 3,
    LEARNING: 2,
    STRUGGLING: 1,
    INCORRECT: 3
  } as const;
  
  export const ACCURACY_THRESHOLDS = {
    EXCELLENT: 0.9,
    GOOD: 0.8,
    FAIR: 0.6,
    POOR: 0.5
  } as const;
  
  export const BOOST_VALUES = {
    STILL_LEARNING_MAX: 15,
    STILL_LEARNING_MULTIPLIER: 5,
    TIME_DECAY_MAX: 15,
    TIME_DECAY_MULTIPLIER: 1.5
  } as const;
  
  export const GAMIFICATION_THRESHOLDS = {
    NEW_MIN: 40,
    NEW_MAX: 59,
    STILL_MIN: 60,
    STILL_MAX: 69
  } as const;
  ```

#### 工程1-2: categoryDetermination.ts への適用
- **ファイル**: `src/ai/utils/categoryDetermination.ts`
- **工数**: 1時間
- **変更箇所**: 約20箇所のMagic numbers置換
- **検証**: 既存テスト全てパス

#### 工程1-3: テスト更新
- **ファイル**: `tests/unit/questionScheduler.test.ts`
- **工数**: 30分
- **内容**: Constants使用のテストケース追加

**Phase 1 合計工数**: 2.5時間

---

### Phase 2: Strategy Pattern導入【優先度：中】

**目的**: if-elseチェーンをStrategyクラスに分離

#### 工程2-1: Strategyインターフェース定義
- **ファイル**: `src/ai/utils/positionStrategies/types.ts`
- **工数**: 1時間
- **内容**:
  ```typescript
  export interface PositionStrategy {
    readonly name: string;
    readonly priority: number;
    canApply(progress: WordProgress, mode: LearningMode): boolean;
    calculate(progress: WordProgress, mode: LearningMode): number;
  }
  
  export interface StrategyContext {
    attempts: number;
    correct: number;
    stillLearning: number;
    consecutiveCorrect: number;
    consecutiveIncorrect: number;
    accuracy: number;
    daysSince: number;
  }
  ```

#### 工程2-2: 各Strategy実装
- **ディレクトリ**: `src/ai/utils/positionStrategies/`
- **工数**: 4時間（8ファイル × 30分）

##### 1. ConsecutiveCorrectStrategy
```typescript
// src/ai/utils/positionStrategies/ConsecutiveCorrectStrategy.ts
export class ConsecutiveCorrectStrategy implements PositionStrategy {
  readonly name = 'consecutive-correct';
  readonly priority = 100; // 最優先
  
  canApply(progress: WordProgress): boolean {
    return (progress.consecutiveCorrect || 0) >= 1;
  }
  
  calculate(progress: WordProgress, mode: LearningMode): number {
    const context = this.buildContext(progress, mode);
    
    if (context.consecutiveCorrect >= CONSECUTIVE_THRESHOLDS.MASTERED) {
      return POSITION_RANGES.MASTERED.default; // 10
    }
    
    if (context.consecutiveCorrect >= CONSECUTIVE_THRESHOLDS.LEARNING) {
      return context.accuracy >= ACCURACY_THRESHOLDS.GOOD
        ? 15 // ほぼ定着
        : 25; // もう1回で定着
    }
    
    // consecutiveCorrect === 1
    if (context.accuracy >= ACCURACY_THRESHOLDS.EXCELLENT && context.attempts <= 2) {
      return 18; // 1発正解
    }
    if (context.accuracy >= ACCURACY_THRESHOLDS.FAIR) {
      return 30; // 新規（次で定着）
    }
    return 45; // まだまだ
  }
}
```

##### 2. ConsecutiveIncorrectStrategy
```typescript
// src/ai/utils/positionStrategies/ConsecutiveIncorrectStrategy.ts
export class ConsecutiveIncorrectStrategy implements PositionStrategy {
  readonly name = 'consecutive-incorrect';
  readonly priority = 90; // 高優先度
  
  canApply(progress: WordProgress): boolean {
    return (progress.consecutiveIncorrect || 0) >= 1;
  }
  
  calculate(progress: WordProgress, mode: LearningMode): number {
    const context = this.buildContext(progress, mode);
    
    if (context.consecutiveIncorrect >= CONSECUTIVE_THRESHOLDS.INCORRECT) {
      return POSITION_RANGES.INCORRECT.default; // 85
    }
    
    if (context.consecutiveIncorrect >= 2) {
      return 75; // 高優先度
    }
    
    // consecutiveIncorrect === 1
    return context.accuracy >= ACCURACY_THRESHOLDS.POOR
      ? 55 // まだまだ
      : 70; // 分からない
  }
}
```

##### 3. StillLearningStrategy
```typescript
// src/ai/utils/positionStrategies/StillLearningStrategy.ts
export class StillLearningStrategy implements PositionStrategy {
  readonly name = 'still-learning';
  readonly priority = 80;
  
  canApply(progress: WordProgress, mode: LearningMode): boolean {
    const stillLearning = mode === 'memorization'
      ? progress.memorizationStillLearning || 0
      : 0;
    
    return (
      stillLearning > 0 &&
      (progress.consecutiveCorrect || 0) === 0 &&
      (progress.consecutiveIncorrect || 0) === 0
    );
  }
  
  calculate(progress: WordProgress, mode: LearningMode): number {
    const stillLearning = progress.memorizationStillLearning || 0;
    const boost = Math.min(
      stillLearning * BOOST_VALUES.STILL_LEARNING_MULTIPLIER,
      BOOST_VALUES.STILL_LEARNING_MAX
    );
    
    return Math.min(
      POSITION_RANGES.STILL_LEARNING.min + boost,
      POSITION_RANGES.STILL_LEARNING.default
    );
  }
}
```

##### 4. NewWordStrategy
```typescript
// src/ai/utils/positionStrategies/NewWordStrategy.ts
export class NewWordStrategy implements PositionStrategy {
  readonly name = 'new-word';
  readonly priority = 70;
  
  canApply(progress: WordProgress, mode: LearningMode): boolean {
    const context = this.buildContext(progress, mode);
    return context.attempts === 0;
  }
  
  calculate(): number {
    return POSITION_RANGES.NEW.default; // 35
  }
}
```

##### 5. DefaultStrategy
```typescript
// src/ai/utils/positionStrategies/DefaultStrategy.ts
export class DefaultStrategy implements PositionStrategy {
  readonly name = 'default';
  readonly priority = 0; // 最低優先度
  
  canApply(): boolean {
    return true; // 常にマッチ
  }
  
  calculate(progress: WordProgress, mode: LearningMode): number {
    const context = this.buildContext(progress, mode);
    
    // BaseScore計算
    const baseScore = 50 - (context.accuracy * 30) + (context.consecutiveIncorrect * 10);
    
    // 時間経過ブースト
    const timeBoost = Math.min(
      context.daysSince * BOOST_VALUES.TIME_DECAY_MULTIPLIER,
      BOOST_VALUES.TIME_DECAY_MAX
    );
    
    // 最終Position
    const rawPosition = baseScore + timeBoost;
    return Math.max(0, Math.min(100, rawPosition));
  }
}
```

#### 工程2-3: PositionCalculator実装
- **ファイル**: `src/ai/utils/positionStrategies/PositionCalculator.ts`
- **工数**: 2時間
- **内容**:
  ```typescript
  export class PositionCalculator {
    private strategies: PositionStrategy[];
    
    constructor() {
      this.strategies = [
        new ConsecutiveCorrectStrategy(),    // priority: 100
        new ConsecutiveIncorrectStrategy(),  // priority: 90
        new StillLearningStrategy(),         // priority: 80
        new NewWordStrategy(),               // priority: 70
        new DefaultStrategy()                // priority: 0
      ].sort((a, b) => b.priority - a.priority);
    }
    
    calculatePosition(progress: WordProgress, mode: LearningMode = 'memorization'): number {
      for (const strategy of this.strategies) {
        if (strategy.canApply(progress, mode)) {
          const position = strategy.calculate(progress, mode);
          
          if (import.meta.env?.DEV) {
            console.log(`📐 [Position] Strategy: ${strategy.name} → ${position}`);
          }
          
          return position;
        }
      }
      
      // フォールバック（DefaultStrategyが必ずマッチするためここには到達しない）
      return POSITION_RANGES.NEW.default;
    }
  }
  ```

#### 工程2-4: categoryDetermination.ts のリファクタリング
- **ファイル**: `src/ai/utils/categoryDetermination.ts`
- **工数**: 1時間
- **変更内容**:
  ```typescript
  import { PositionCalculator } from './positionStrategies/PositionCalculator';
  
  const positionCalculator = new PositionCalculator();
  
  export function determineWordPosition(
    progress: WordProgress,
    mode: LearningMode = 'memorization'
  ): WordPosition {
    return positionCalculator.calculatePosition(progress, mode);
  }
  ```

#### 工程2-5: テスト作成
- **ファイル**: `tests/unit/positionStrategies.test.ts`
- **工数**: 3時間
- **内容**:
  - 各Strategy単体テスト（5戦略 × 10ケース）
  - PositionCalculator統合テスト
  - 境界値テスト
  - エッジケーステスト

#### 工程2-6: 既存テストの検証
- **ファイル**: `tests/unit/questionScheduler.test.ts` 他
- **工数**: 1時間
- **検証**: 全テストがパスすることを確認

**Phase 2 合計工数**: 12時間（1.5日）

---

### Phase 3: Specialist AI統合レイヤー【優先度：低】

**目的**: Specialist AIの提案を統合的に適用

#### 工程3-1: AI調整インターフェース定義
- **ファイル**: `src/ai/utils/positionStrategies/types.ts`
- **工数**: 1時間
- **内容**:
  ```typescript
  export interface PositionAdjustment {
    source: string; // AI名
    delta: number;  // Position調整量（-10 ~ +10）
    reason: string; // 調整理由
  }
  
  export interface AdjustedPositionResult {
    basePosition: number;
    adjustments: PositionAdjustment[];
    finalPosition: number;
  }
  ```

#### 工程3-2: PositionCalculator拡張
- **ファイル**: `src/ai/utils/positionStrategies/PositionCalculator.ts`
- **工数**: 2時間
- **内容**:
  ```typescript
  async calculateWithAI(
    progress: WordProgress,
    mode: LearningMode,
    sessionContext: ScheduleContext
  ): Promise<AdjustedPositionResult> {
    // 1️⃣ 基礎Position（Strategy Pattern）
    const basePosition = this.calculatePosition(progress, mode);
    
    // 2️⃣ Specialist AI分析（常時稼働）
    const adjustments: PositionAdjustment[] = [];
    
    // 🎮 GamificationAI
    const gamificationSignal = await this.gamificationAI.analyze({
      progress,
      sessionStats: sessionContext.sessionStats
    });
    
    if (gamificationSignal.motivationLevel === 'low') {
      adjustments.push({
        source: 'GamificationAI',
        delta: -5,
        reason: 'モチベーション維持（簡単な問題）'
      });
    }
    
    // 🧠 MemoryAI
    const memorySignal = await this.memoryAI.analyze({
      progress,
      sessionStats: sessionContext.sessionStats
    });
    
    if (memorySignal.forgettingRisk === 'high') {
      adjustments.push({
        source: 'MemoryAI',
        delta: +10,
        reason: '忘却リスク高（優先度上げ）'
      });
    }
    
    // 🎯 CognitiveLoadAI
    const cognitiveSignal = await this.cognitiveAI.analyze({
      progress,
      sessionStats: sessionContext.sessionStats
    });
    
    if (cognitiveSignal.loadLevel === 'high') {
      adjustments.push({
        source: 'CognitiveLoadAI',
        delta: -3,
        reason: '認知負荷高（休憩推奨）'
      });
    }
    
    // 3️⃣ 調整を適用
    const totalDelta = adjustments.reduce((sum, adj) => sum + adj.delta, 0);
    const finalPosition = Math.max(0, Math.min(100, basePosition + totalDelta));
    
    return {
      basePosition,
      adjustments,
      finalPosition
    };
  }
  ```

#### 工程3-3: QuestionScheduler統合
- **ファイル**: `src/ai/scheduler/QuestionScheduler.ts`
- **工数**: 2時間
- **変更内容**:
  ```typescript
  private async determinePosition(
    progress: WordProgress,
    mode: string
  ): Promise<number> {
    // AI統合レイヤーを使用
    const result = await this.positionCalculator.calculateWithAI(
      progress,
      mode as LearningMode,
      this.currentContext
    );
    
    // デバッグログ
    if (import.meta.env?.DEV) {
      console.log('🎯 [Position] Base:', result.basePosition);
      result.adjustments.forEach(adj => {
        console.log(`  ${adj.source}: ${adj.delta > 0 ? '+' : ''}${adj.delta} (${adj.reason})`);
      });
      console.log('🎯 [Position] Final:', result.finalPosition);
    }
    
    return result.finalPosition;
  }
  ```

#### 工程3-4: デバッグパネル統合
- **ファイル**: `src/components/RequeuingDebugPanel.tsx`
- **工数**: 1時間
- **内容**: AI調整の可視化セクション追加

#### 工程3-5: テスト作成
- **ファイル**: `tests/unit/positionAIIntegration.test.ts`
- **工数**: 2時間
- **内容**:
  - AI調整の統合テスト
  - Specialist AIモックテスト

**Phase 3 合計工数**: 8時間（1日）

---

## 📅 スケジュール

### 推奨実行順序

| Phase | 工程 | 工数 | 実行タイミング |
|-------|------|------|----------------|
| **Phase 1** | Constants抽出 | 2.5時間 | **即座に実行** |
| **Phase 2** | Strategy Pattern | 12時間 | 次回メジャーアップデート |
| **Phase 3** | AI統合レイヤー | 8時間 | 将来的な改善 |
| **合計** | - | **22.5時間** | 約3日間 |

### マイルストーン

```
Phase 1 (Day 1前半)
├── Constants定義 ✓
├── categoryDetermination.ts適用 ✓
└── テスト更新 ✓

Phase 2 (Day 1後半 ~ Day 2)
├── Strategy interface定義 ✓
├── 5つのStrategy実装 ✓
├── PositionCalculator実装 ✓
├── categoryDetermination.tsリファクタリング ✓
├── 新規テスト作成 ✓
└── 既存テスト検証 ✓

Phase 3 (Day 3)
├── AI調整interface定義 ✓
├── PositionCalculator拡張 ✓
├── QuestionScheduler統合 ✓
├── デバッグパネル統合 ✓
└── 統合テスト ✓
```

---

## 🧪 テスト計画

### Phase 1: Constants抽出
- **既存テスト**: 全てパス必須
- **新規テスト**: Constants使用の検証

### Phase 2: Strategy Pattern
- **ユニットテスト**: 各Strategy単体（50ケース）
  - ConsecutiveCorrectStrategy: 10ケース
  - ConsecutiveIncorrectStrategy: 10ケース
  - StillLearningStrategy: 10ケース
  - NewWordStrategy: 5ケース
  - DefaultStrategy: 15ケース

- **統合テスト**: PositionCalculator（20ケース）
  - Strategy選択の優先順位
  - 境界値テスト
  - エッジケース

- **リグレッションテスト**: 既存テスト全てパス（必須）

### Phase 3: AI統合
- **モックテスト**: Specialist AIモック（15ケース）
- **統合テスト**: AI調整の統合（10ケース）

### テストカバレッジ目標
- **Phase 1**: 100%（既存維持）
- **Phase 2**: 90%以上（新規コード）
- **Phase 3**: 85%以上（AI統合）

---

## ⚠️ リスク評価

### Phase 1: 低リスク
| リスク | 影響 | 確率 | 対策 |
|--------|------|------|------|
| Constants定義ミス | 低 | 低 | 型安全性で検出 |
| 置換漏れ | 中 | 低 | grep検索で確認 |

### Phase 2: 中リスク
| リスク | 影響 | 確率 | 対策 |
|--------|------|------|------|
| Strategy選択ロジックミス | 高 | 中 | 詳細なユニットテスト |
| パフォーマンス劣化 | 中 | 低 | ベンチマーク測定 |
| 既存テスト失敗 | 高 | 中 | リグレッションテスト |

### Phase 3: 中リスク
| リスク | 影響 | 確率 | 対策 |
|--------|------|------|------|
| AI調整の過剰適用 | 中 | 中 | 調整量の上限設定 |
| Async/Await遅延 | 低 | 低 | キャッシュ機構 |

---

## 🔄 ロールバック計画

### Phase 1
- **所要時間**: 10分
- **手順**:
  1. `positionConstants.ts` 削除
  2. `categoryDetermination.ts` をGitで復元

### Phase 2
- **所要時間**: 30分
- **手順**:
  1. `positionStrategies/` ディレクトリ削除
  2. `categoryDetermination.ts` をPhase 1版に復元
  3. import文を修正

### Phase 3
- **所要時間**: 30分
- **手順**:
  1. `PositionCalculator.calculateWithAI()` 削除
  2. QuestionScheduler を Phase 2版に復元

---

## 📦 成果物

### Phase 1
- `src/ai/utils/positionConstants.ts` - Constants定義
- `src/ai/utils/categoryDetermination.ts` - Constants適用版

### Phase 2
- `src/ai/utils/positionStrategies/types.ts` - インターフェース
- `src/ai/utils/positionStrategies/BaseStrategy.ts` - 基底クラス
- `src/ai/utils/positionStrategies/ConsecutiveCorrectStrategy.ts`
- `src/ai/utils/positionStrategies/ConsecutiveIncorrectStrategy.ts`
- `src/ai/utils/positionStrategies/StillLearningStrategy.ts`
- `src/ai/utils/positionStrategies/NewWordStrategy.ts`
- `src/ai/utils/positionStrategies/DefaultStrategy.ts`
- `src/ai/utils/positionStrategies/PositionCalculator.ts`
- `src/ai/utils/positionStrategies/index.ts` - エクスポート
- `tests/unit/positionStrategies.test.ts` - テスト

### Phase 3
- `src/ai/utils/positionStrategies/PositionCalculator.ts` - AI統合版
- `tests/unit/positionAIIntegration.test.ts` - 統合テスト

---

## ✅ 完了条件

### Phase 1
- [ ] Constants定義ファイル作成完了
- [ ] categoryDetermination.ts への適用完了
- [ ] 既存テスト全てパス
- [ ] Magic numbers 0個

### Phase 2
- [ ] 5つのStrategy実装完了
- [ ] PositionCalculator実装完了
- [ ] categoryDetermination.ts リファクタリング完了
- [ ] 新規テスト70ケース作成完了
- [ ] 既存テスト全てパス
- [ ] パフォーマンス劣化なし（±5%以内）

### Phase 3
- [ ] AI調整レイヤー実装完了
- [ ] QuestionScheduler統合完了
- [ ] デバッグパネル可視化完了
- [ ] 統合テスト25ケース作成完了
- [ ] 既存テスト全てパス

---

## 📊 メトリクス

### コード品質指標

| 指標 | 現状 | Phase 1 | Phase 2 | Phase 3 |
|------|------|---------|---------|---------|
| categoryDetermination.ts行数 | 171 | 171 | 30 | 30 |
| Magic numbers | 20+ | 0 | 0 | 0 |
| if-elseチェーン | 1（大） | 1 | 0 | 0 |
| Strategy数 | 0 | 0 | 5 | 5 |
| テストケース数 | 15 | 18 | 88 | 113 |
| テストカバレッジ | 85% | 85% | 90% | 85% |
| Cyclomatic Complexity | 15+ | 15+ | 5以下 | 5以下 |

### パフォーマンス指標

| 指標 | 現状 | 目標 |
|------|------|------|
| Position計算時間 | ~0.1ms | ±5%以内 |
| メモリ使用量 | ~1KB | ±10%以内 |
| 初期化時間 | ~1ms | ±20%以内 |

---

## 🎓 学習リソース

### Strategy Pattern
- [Refactoring Guru - Strategy Pattern](https://refactoring.guru/design-patterns/strategy)
- [Martin Fowler - Refactoring](https://refactoring.com/)

### Spaced Repetition
- [SuperMemo Algorithm (SM-2)](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)
- [Anki's Scheduling Algorithm](https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html)

---

## 📝 備考

### 重要な設計判断
1. **Specialist AI常時稼働** - `adaptiveEnabled`フラグは削除済み
2. **Layer分離** - Strategy（決定論）とSpecialist AI（確率論）を明確に分離
3. **後方互換性** - `determineWordPosition()` APIは維持

### 将来的な拡張
- SM-2 Algorithm統合（Phase 4）
- ユーザー別学習曲線最適化（Phase 5）
- A/Bテスト基盤（Phase 6）

---

**承認**:  
[ ] Phase 1 実行承認  
[ ] Phase 2 実行承認  
[ ] Phase 3 実行承認  

**実行開始日**: _______________  
**実行責任者**: _______________
