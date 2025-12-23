# 完全学習システムロードマップ - 90点以上を目指す実装計画

**作成日**: 2025年12月23日  
**目標**: 人間のように生徒に寄り添い、記憶の超定着を促す学習システム  
**目標スコア**: 90点以上 / 100点

---

## 📊 現状分析と目標設定

### 現在のスコア: 72点 / 100点

| 観点 | 現状 | 目標 | Gap |
|------|------|------|-----|
| **適応的学習** | 80% | 95% | +15% |
| **Spaced Repetition** | 60% | 95% | +35% ⚠️最優先 |
| **個別化** | 75% | 90% | +15% |
| **人間らしさ** | 65% | 90% | +25% ⚠️重要 |
| **記憶の超定着** | 60% | 95% | +35% ⚠️最優先 |
| **総合目標** | 72% | **93%** | +21% |

### 重点改善エリア
1. 🔴 **記憶科学の統合** - SM-2, Ebbinghaus曲線（+35%）
2. 🟡 **感情的サポート** - 人間らしい対話・励まし（+25%）
3. 🟢 **多様な復習方法** - 文脈変更、段階的指導（+15%）

---

## 🗺️ 全体ロードマップ（6フェーズ）

```
Phase 1: Constants抽出 ────────────────────────────── 2.5時間
         [基盤整理]

Phase 2: Strategy Pattern導入 ───────────────────── 12時間
         [Position計算の整理]

Phase 3: AI統合レイヤー強化 ─────────────────────── 8時間
         [既存AI機能の統合]

Phase 4: 記憶科学統合 ★最重要★ ──────────────────── 18時間
         [SM-2, Ebbinghaus, 長期記憶戦略]

Phase 5: 感情的サポート ★重要★ ──────────────────── 12時間
         [EmotionalAI, 励まし, Scaffolding]

Phase 6: 多様な復習方法 ──────────────────────────── 10時間
         [文脈変更, 多様なテスト形式]

─────────────────────────────────────────────────────
合計: 62.5時間（約8日間）
```

---

## 📋 Phase 1: Constants抽出【2.5時間】

**目的**: Magic numbers削減、意味の明確化  
**優先度**: 🟢 高（即座に実行可能）  
**リスク**: 低

### 工程1-1: Constants定義ファイル作成【1時間】
```typescript
// src/ai/utils/positionConstants.ts
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

### 工程1-2: categoryDetermination.ts への適用【1時間】
- 約20箇所のMagic numbers置換
- 既存ロジックの動作保証

### 工程1-3: テスト更新【30分】
- Constants使用のテストケース追加
- 既存テスト全てパス確認

**Phase 1 完了基準**:
- ✅ Magic numbers 0個
- ✅ 既存テスト全てパス
- ✅ 型エラーなし

---

## 📋 Phase 2: Strategy Pattern導入【12時間】

**目的**: 171行のif-elseチェーンをStrategyクラスに分離  
**優先度**: 🟡 中（次回メジャーアップデート）  
**リスク**: 中

### 工程2-1: Strategyインターフェース定義【1時間】
```typescript
// src/ai/utils/positionStrategies/types.ts
export interface PositionStrategy {
  readonly name: string;
  readonly priority: number;
  canApply(progress: WordProgress, mode: LearningMode): boolean;
  calculate(progress: WordProgress, mode: LearningMode): number;
}
```

### 工程2-2: 各Strategy実装【4時間】
- ConsecutiveCorrectStrategy（1時間）
- ConsecutiveIncorrectStrategy（45分）
- StillLearningStrategy（45分）
- NewWordStrategy（30分）
- DefaultStrategy（1時間）

### 工程2-3: PositionCalculator実装【2時間】
- Strategy選択ロジック
- 優先度順ソート
- デバッグログ

### 工程2-4: categoryDetermination.ts リファクタリング【1時間】
- PositionCalculator使用に変更
- 既存API維持

### 工程2-5: テスト作成【3時間】
- 各Strategy単体テスト（50ケース）
- PositionCalculator統合テスト（30ケース）
- 境界値テスト（20ケース）

### 工程2-6: 既存テスト検証【1時間】
- 全テストパス確認
- リグレッションテスト

**Phase 2 完了基準**:
- ✅ 5つのStrategyクラス実装
- ✅ 100+テストケース全てパス
- ✅ if-else チェーン削減

---

## 📋 Phase 3: AI統合レイヤー強化【8時間】

**目的**: Specialist AIの提案を統合的に適用  
**優先度**: 🟡 中  
**リスク**: 中

### 工程3-1: AI調整インターフェース定義【1時間】
```typescript
export interface PositionAdjustment {
  source: string;
  delta: number; // -10 ~ +10
  reason: string;
  confidence: number; // 0-1
}

export interface AdjustedPositionResult {
  basePosition: number;
  adjustments: PositionAdjustment[];
  finalPosition: number;
  appliedAIs: string[];
}
```

### 工程3-2: PositionCalculator拡張【2時間】
```typescript
async calculateWithAI(
  progress: WordProgress,
  mode: LearningMode,
  sessionContext: ScheduleContext
): Promise<AdjustedPositionResult> {
  const basePosition = this.calculatePosition(progress, mode);
  const adjustments = await this.collectAIAdjustments(sessionContext);
  const finalPosition = this.applyAdjustments(basePosition, adjustments);
  
  return { basePosition, adjustments, finalPosition };
}
```

### 工程3-3: 7つのSpecialist AI統合【3時間】
- GamificationAI統合（30分）
- MemoryAI統合（30分）
- CognitiveLoadAI統合（30分）
- ErrorPredictionAI統合（30分）
- LinguisticAI統合（30分）
- ContextualAI統合（30分）
- LearningStyleAI統合（30分）

### 工程3-4: QuestionScheduler更新【1時間】
- calculateWithAI使用に変更
- デバッグパネルに調整結果表示

### 工程3-5: テスト作成【1時間】
- AI統合テスト（20ケース）
- 調整値の妥当性検証

**Phase 3 完了基準**:
- ✅ 7つのAI統合完了
- ✅ Position調整の透明性向上
- ✅ デバッグパネルに詳細表示

---

## 📋 Phase 4: 記憶科学統合 ★最重要★【18時間】

**目的**: SM-2, Ebbinghaus曲線、長期記憶戦略の統合  
**優先度**: 🔴 最高（+35%スコア向上）  
**リスク**: 高（既存システムへの影響大）

### 工程4-1: SM-2 Algorithm実装【3時間】

```typescript
// src/ai/specialists/memory/SM2Algorithm.ts
export class SM2Algorithm {
  /**
   * SuperMemo SM-2アルゴリズムの実装
   * 参考: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
   */
  
  calculateNextReview(
    quality: 0 | 1 | 2 | 3 | 4 | 5, // 0=完全失敗, 5=完璧
    easeFactor: number,              // 難易度係数（初期値2.5）
    interval: number,                // 前回の間隔（日数）
    repetitions: number              // 連続正解回数
  ): SM2Result {
    // 1. EaseFactor更新
    let newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (newEF < 1.3) newEF = 1.3; // 下限
    
    // 2. 連続正解回数更新
    let newReps = repetitions;
    if (quality < 3) {
      newReps = 0; // リセット
    } else {
      newReps++;
    }
    
    // 3. 次回の間隔計算
    let newInterval: number;
    if (quality < 3) {
      newInterval = 1; // 1日後
    } else if (newReps === 1) {
      newInterval = 1;
    } else if (newReps === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEF);
    }
    
    return {
      nextInterval: newInterval,
      easeFactor: newEF,
      repetitions: newReps,
      nextReviewDate: new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000)
    };
  }
  
  /**
   * 現在の正答状況からQuality値を算出
   */
  determineQuality(
    isCorrect: boolean,
    responseTime: number, // ミリ秒
    hesitation: boolean,
    attempts: number
  ): 0 | 1 | 2 | 3 | 4 | 5 {
    if (!isCorrect) {
      return attempts > 2 ? 0 : 1; // 完全失敗 or 失敗
    }
    
    // 正解の場合
    if (responseTime < 3000 && !hesitation) {
      return 5; // 完璧（3秒以内、迷いなし）
    }
    if (responseTime < 5000 && !hesitation) {
      return 4; // 迷いなく正解
    }
    if (responseTime < 10000) {
      return 3; // 少し考えて正解
    }
    return 2; // 長考して正解
  }
}

interface SM2Result {
  nextInterval: number;      // 日数
  easeFactor: number;        // 難易度係数
  repetitions: number;       // 連続正解回数
  nextReviewDate: Date;      // 次回復習日時
}
```

### 工程4-2: Ebbinghaus忘却曲線モデル【2時間】

```typescript
// src/ai/specialists/memory/ForgettingCurveModel.ts
export class ForgettingCurveModel {
  /**
   * Ebbinghaus忘却曲線の実装
   * R(t) = e^(-t/S)
   * R = 記憶保持率, t = 経過時間, S = 記憶強度
   */
  
  calculateRetention(
    daysSinceLastReview: number,
    memoryStrength: number // 1-10（10が最強）
  ): number {
    const decayRate = 1 / memoryStrength;
    const retention = Math.exp(-daysSinceLastReview * decayRate);
    
    return Math.max(0, Math.min(1, retention)); // 0-1に正規化
  }
  
  /**
   * 記憶強度の計算（正答履歴から）
   */
  calculateMemoryStrength(progress: WordProgress): number {
    const baseStrength = 1;
    
    // 連続正解で強度上昇
    const consecutiveBonus = (progress.consecutiveCorrect || 0) * 1.5;
    
    // 正答率で調整
    const accuracyBonus = (progress.accuracy || 0) * 3;
    
    // 試行回数で安定化
    const stabilityBonus = Math.min((progress.attempts || 0) * 0.2, 2);
    
    const totalStrength = baseStrength + consecutiveBonus + accuracyBonus + stabilityBonus;
    
    return Math.max(1, Math.min(10, totalStrength));
  }
  
  /**
   * 最適な復習タイミングの提案
   */
  suggestReviewTiming(
    currentRetention: number,
    targetRetention: number = 0.9 // 目標保持率90%
  ): 'now' | 'soon' | 'scheduled' {
    if (currentRetention < targetRetention) {
      return 'now'; // 今すぐ復習
    }
    if (currentRetention < targetRetention + 0.05) {
      return 'soon'; // 近日中に復習
    }
    return 'scheduled'; // スケジュール通り
  }
}
```

### 工程4-3: 長期記憶移行戦略【3時間】

```typescript
// src/ai/specialists/memory/LongTermMemoryStrategy.ts
export enum MemoryStage {
  WORKING_MEMORY = 'working',      // 作業記憶（数秒～数分）
  SHORT_TERM = 'short',            // 短期記憶（数分～数日）
  CONSOLIDATING = 'consolidating', // 固定化中（数日～数週間）
  LONG_TERM = 'long'               // 長期記憶（数ヶ月～永続）
}

export class LongTermMemoryStrategy {
  /**
   * 現在の記憶段階を判定
   */
  determineMemoryStage(progress: WordProgress): MemoryStage {
    const daysSinceFirst = this.getDaysSinceFirstAttempt(progress);
    const consecutiveCorrect = progress.consecutiveCorrect || 0;
    const attempts = progress.attempts || 0;
    
    // 長期記憶: 30日以上経過 & 連続正解3回以上 & 試行10回以上
    if (daysSinceFirst >= 30 && consecutiveCorrect >= 3 && attempts >= 10) {
      return MemoryStage.LONG_TERM;
    }
    
    // 固定化中: 7日以上経過 & 連続正解2回以上
    if (daysSinceFirst >= 7 && consecutiveCorrect >= 2) {
      return MemoryStage.CONSOLIDATING;
    }
    
    // 短期記憶: 1日以上経過 & 正解経験あり
    if (daysSinceFirst >= 1 && progress.correct > 0) {
      return MemoryStage.SHORT_TERM;
    }
    
    // 作業記憶: 初回～1日以内
    return MemoryStage.WORKING_MEMORY;
  }
  
  /**
   * 各段階に適した復習間隔（時間単位）
   */
  getReviewIntervals(stage: MemoryStage): number[] {
    const intervals = {
      [MemoryStage.WORKING_MEMORY]: [
        1 / 1440,      // 1分後
        10 / 1440,     // 10分後
        1 / 24,        // 1時間後
        0.5            // 12時間後
      ],
      [MemoryStage.SHORT_TERM]: [
        1,   // 1日後
        3,   // 3日後
        7,   // 1週間後
        14   // 2週間後
      ],
      [MemoryStage.CONSOLIDATING]: [
        14,  // 2週間後
        30,  // 1ヶ月後
        60,  // 2ヶ月後
        90   // 3ヶ月後
      ],
      [MemoryStage.LONG_TERM]: [
        180, // 6ヶ月後
        365, // 1年後
        730  // 2年後
      ]
    };
    
    return intervals[stage];
  }
  
  /**
   * 次回復習までの推奨時間（日数）
   */
  calculateNextReviewInterval(
    progress: WordProgress,
    sm2Result: SM2Result
  ): number {
    const stage = this.determineMemoryStage(progress);
    const intervals = this.getReviewIntervals(stage);
    const repetition = sm2Result.repetitions;
    
    // SM-2の推奨間隔と記憶段階を組み合わせ
    const stageInterval = intervals[Math.min(repetition, intervals.length - 1)];
    const sm2Interval = sm2Result.nextInterval;
    
    // 両者の平均を取る（バランス）
    return (stageInterval + sm2Interval) / 2;
  }
}
```

### 工程4-4: MemoryAI統合強化【3時間】

```typescript
// src/ai/specialists/MemoryAI.ts（大幅強化）
export class MemoryAI extends BaseSpecialistAI {
  private sm2: SM2Algorithm;
  private forgettingCurve: ForgettingCurveModel;
  private longTermStrategy: LongTermMemoryStrategy;
  
  async analyze(context: AnalysisContext): Promise<MemorySignal> {
    const progress = context.progress;
    
    // 1️⃣ SM-2分析
    const quality = this.determineQuality(context);
    const sm2Result = this.sm2.calculateNextReview(
      quality,
      progress.easeFactor || 2.5,
      progress.lastInterval || 1,
      progress.repetitions || 0
    );
    
    // 2️⃣ Ebbinghaus分析
    const memoryStrength = this.forgettingCurve.calculateMemoryStrength(progress);
    const daysSince = this.getDaysSinceLastAttempt(progress);
    const retention = this.forgettingCurve.calculateRetention(daysSince, memoryStrength);
    const reviewTiming = this.forgettingCurve.suggestReviewTiming(retention);
    
    // 3️⃣ 長期記憶戦略
    const memoryStage = this.longTermStrategy.determineMemoryStage(progress);
    const recommendedInterval = this.longTermStrategy.calculateNextReviewInterval(
      progress,
      sm2Result
    );
    
    // 4️⃣ Position調整の提案
    let positionDelta = 0;
    let reason = '';
    
    if (reviewTiming === 'now' && retention < 0.7) {
      positionDelta = +20; // 記憶が薄れている → 優先度UP
      reason = `記憶保持率${(retention * 100).toFixed(0)}% - 今すぐ復習が必要`;
    } else if (memoryStage === MemoryStage.LONG_TERM) {
      positionDelta = -10; // 長期記憶済み → 優先度DOWN
      reason = '長期記憶に移行済み - 間隔を空けて復習';
    } else if (sm2Result.easeFactor < 2.0) {
      positionDelta = +10; // 難易度が高い → 優先度UP
      reason = `難易度係数${sm2Result.easeFactor.toFixed(2)} - 定着に時間が必要`;
    }
    
    return {
      positionAdjustment: {
        source: 'MemoryAI',
        delta: positionDelta,
        reason,
        confidence: 0.95
      },
      memoryStage,
      retention,
      forgettingRisk: reviewTiming === 'now' ? 'high' : 'low',
      sm2Data: sm2Result,
      recommendedNextReview: new Date(Date.now() + recommendedInterval * 24 * 60 * 60 * 1000)
    };
  }
}
```

### 工程4-5: WordProgress型拡張【2時間】
```typescript
// src/types/adaptive.ts（拡張）
export interface WordProgress {
  // 既存フィールド...
  
  // 🆕 SM-2データ
  easeFactor?: number;        // 難易度係数（1.3-3.0, 初期値2.5）
  lastInterval?: number;      // 前回の復習間隔（日数）
  repetitions?: number;       // SM-2連続正解回数
  
  // 🆕 記憶段階
  memoryStage?: MemoryStage;
  
  // 🆕 推奨復習日時
  nextReviewDate?: Date;
  
  // 🆕 記憶強度（1-10）
  memoryStrength?: number;
  
  // 🆕 最終保持率（0-1）
  lastRetention?: number;
}
```

### 工程4-6: データ移行スクリプト【2時間】
- 既存のWordProgressデータにSM-2フィールド追加
- 初期値設定（easeFactor=2.5, repetitions=0）
- マイグレーションテスト

### 工程4-7: テスト作成【3時間】
- SM-2アルゴリズムテスト（30ケース）
- Ebbinghaus曲線テスト（20ケース）
- 長期記憶戦略テスト（25ケース）
- MemoryAI統合テスト（25ケース）

**Phase 4 完了基準**:
- ✅ SM-2完全実装
- ✅ Ebbinghaus曲線統合
- ✅ 4段階の記憶移行戦略
- ✅ 100+テスト全てパス
- ✅ データ移行完了
- ✅ **Spaced Repetitionスコア: 60% → 95%**

---

## 📋 Phase 5: 感情的サポート ★重要★【12時間】

**目的**: 人間らしい対話・励まし・段階的指導  
**優先度**: 🔴 高（+25%スコア向上）  
**リスク**: 中

### 工程5-1: EmotionalAI実装【3時間】

```typescript
// src/ai/specialists/EmotionalAI.ts
export class EmotionalAI extends BaseSpecialistAI {
  async analyze(context: AnalysisContext): Promise<EmotionalSignal> {
    const sessionStats = context.sessionStats;
    
    // 1️⃣ 挫折度の検出
    const frustrationLevel = this.detectFrustration(sessionStats);
    
    // 2️⃣ 自信度の評価
    const confidenceLevel = this.calculateConfidence(sessionStats);
    
    // 3️⃣ 疲労度の推定
    const fatigueLevel = this.estimateFatigue(sessionStats);
    
    // 4️⃣ 休憩の提案
    const suggestBreak = this.shouldSuggestBreak(sessionStats, fatigueLevel);
    
    // 5️⃣ 適切な励ましの選択
    const encouragement = this.selectEncouragement(
      frustrationLevel,
      confidenceLevel,
      context.progress
    );
    
    // 6️⃣ Position調整
    let positionDelta = 0;
    let reason = '';
    
    if (frustrationLevel === 'high') {
      positionDelta = -15; // 簡単な問題に切り替え
      reason = '連続失敗検出 - モチベーション維持のため簡単な問題を';
    } else if (confidenceLevel === 'high' && fatigueLevel === 'low') {
      positionDelta = +5; // 少し難しい問題に挑戦
      reason = '好調 - 少し難易度を上げて成長を促す';
    }
    
    return {
      positionAdjustment: {
        source: 'EmotionalAI',
        delta: positionDelta,
        reason,
        confidence: 0.85
      },
      frustrationLevel,
      confidenceLevel,
      fatigueLevel,
      suggestBreak,
      encouragement
    };
  }
  
  /**
   * 挫折度の検出（連続不正解、長時間停滞）
   */
  private detectFrustration(stats: SessionStats): 'low' | 'medium' | 'high' {
    const recentErrors = stats.recentAnswers?.filter(a => !a.correct).length || 0;
    const consecutiveErrors = stats.consecutiveIncorrect || 0;
    
    if (consecutiveErrors >= 3 || recentErrors >= 5) {
      return 'high';
    }
    if (consecutiveErrors >= 2 || recentErrors >= 3) {
      return 'medium';
    }
    return 'low';
  }
  
  /**
   * 自信度の計算（連続正解、正答率）
   */
  private calculateConfidence(stats: SessionStats): 'low' | 'medium' | 'high' {
    const consecutiveCorrect = stats.consecutiveCorrect || 0;
    const accuracy = stats.accuracy || 0;
    
    if (consecutiveCorrect >= 5 && accuracy >= 0.8) {
      return 'high';
    }
    if (consecutiveCorrect >= 3 && accuracy >= 0.6) {
      return 'medium';
    }
    return 'low';
  }
  
  /**
   * 疲労度の推定（セッション時間、問題数）
   */
  private estimateFatigue(stats: SessionStats): 'low' | 'medium' | 'high' {
    const sessionMinutes = stats.sessionDuration || 0;
    const questionCount = stats.totalQuestions || 0;
    
    if (sessionMinutes > 45 || questionCount > 50) {
      return 'high';
    }
    if (sessionMinutes > 30 || questionCount > 30) {
      return 'medium';
    }
    return 'low';
  }
  
  /**
   * 休憩提案の判定
   */
  private shouldSuggestBreak(
    stats: SessionStats,
    fatigue: 'low' | 'medium' | 'high'
  ): boolean {
    if (fatigue === 'high') return true;
    
    const errorRate = 1 - (stats.accuracy || 0);
    if (fatigue === 'medium' && errorRate > 0.4) {
      return true; // 疲労+エラー率40%超 → 休憩推奨
    }
    
    return false;
  }
  
  /**
   * 状況に応じた励ましの選択
   */
  private selectEncouragement(
    frustration: 'low' | 'medium' | 'high',
    confidence: 'low' | 'medium' | 'high',
    progress: WordProgress
  ): string {
    // 挫折時
    if (frustration === 'high') {
      return this.getFrustrationEncouragement(progress);
    }
    
    // 好調時
    if (confidence === 'high') {
      return this.getProgressEncouragement(progress);
    }
    
    // 定着時
    if ((progress.consecutiveCorrect || 0) >= 3) {
      return this.getMasteryEncouragement(progress);
    }
    
    // 通常時
    return this.getStandardEncouragement();
  }
  
  private getFrustrationEncouragement(progress: WordProgress): string {
    const templates = [
      'この単語は難しいですね。焦らず、もう一度ゆっくり見てみましょう',
      '大丈夫です。難しい単語ほど、定着したときの達成感は大きいですよ',
      '誰でも苦手な単語はあります。一緒に何度でも挑戦しましょう',
      'まだ覚えていなくても問題ありません。繰り返しが記憶の鍵です'
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }
  
  private getProgressEncouragement(progress: WordProgress): string {
    const consecutiveCorrect = progress.consecutiveCorrect || 0;
    return `素晴らしい！${consecutiveCorrect}回連続正解です。この調子で頑張りましょう！`;
  }
  
  private getMasteryEncouragement(progress: WordProgress): string {
    return '完璧です！この単語はもう自分のものになりましたね。長期記憶に移行しています';
  }
  
  private getStandardEncouragement(): string {
    return '良いペースです。この調子で続けましょう';
  }
}
```

### 工程5-2: Scaffolding（段階的指導）実装【3時間】

```typescript
// src/ai/specialists/scaffolding/ScaffoldingSystem.ts
export class ScaffoldingSystem {
  /**
   * 適切なヒントレベルの決定
   */
  determineHintLevel(
    progress: WordProgress,
    consecutiveErrors: number
  ): 0 | 1 | 2 | 3 {
    // エラー回数に応じてヒント強度を上げる
    if (consecutiveErrors === 0) return 0; // ヒントなし
    if (consecutiveErrors === 1) return 1; // 軽いヒント
    if (consecutiveErrors === 2) return 2; // 強いヒント
    return 3; // ほぼ答え
  }
  
  /**
   * ヒントの生成（単語タイプ別）
   */
  generateHint(
    word: Word,
    hintLevel: 0 | 1 | 2 | 3
  ): string | null {
    if (hintLevel === 0) return null;
    
    const hints = {
      1: this.generateLightHint(word),
      2: this.generateMediumHint(word),
      3: this.generateStrongHint(word)
    };
    
    return hints[hintLevel];
  }
  
  private generateLightHint(word: Word): string {
    // 最初の文字
    return `ヒント: 最初の文字は「${word.english[0]}」です`;
  }
  
  private generateMediumHint(word: Word): string {
    // 最初の3文字 + 文字数
    const first3 = word.english.substring(0, 3);
    const length = word.english.length;
    return `ヒント: ${first3}... (${length}文字)`;
  }
  
  private generateStrongHint(word: Word): string {
    // ほぼ答え（伏せ字1-2文字）
    const masked = word.english
      .split('')
      .map((char, i) => {
        if (i === 0 || i === word.english.length - 1) {
          return char; // 最初と最後は表示
        }
        return i % 2 === 0 ? char : '_'; // 1文字おきに伏せ字
      })
      .join('');
    
    return `ヒント: ${masked}`;
  }
}
```

### 工程5-3: 励ましメッセージシステム【2時間】
```typescript
// src/components/encouragement/EncouragementDisplay.tsx
export const EncouragementDisplay: React.FC<{
  message: string;
  emotion: 'support' | 'praise' | 'mastery' | 'neutral';
}> = ({ message, emotion }) => {
  const icon = {
    support: '💪',
    praise: '🎉',
    mastery: '⭐',
    neutral: '📝'
  }[emotion];
  
  return (
    <div className={`encouragement ${emotion}`}>
      <span className="icon">{icon}</span>
      <p>{message}</p>
    </div>
  );
};
```

### 工程5-4: QuestionCardへの統合【2時間】
- EmotionalAIシグナル表示
- Scaffoldingヒント表示
- 励ましメッセージアニメーション

### 工程5-5: テスト作成【2時間】
- EmotionalAI単体テスト（20ケース）
- Scaffoldingテスト（15ケース）
- UI統合テスト（10ケース）

**Phase 5 完了基準**:
- ✅ EmotionalAI実装完了
- ✅ 4段階のScaffolding
- ✅ 状況別の励ましメッセージ
- ✅ UI統合完了
- ✅ **人間らしさスコア: 65% → 90%**

---

## 📋 Phase 6: 多様な復習方法【10時間】

**目的**: 文脈変更、多様なテスト形式で定着強化  
**優先度**: 🟡 中（+15%スコア向上）  
**リスク**: 低

### 工程6-1: 文脈変更システム実装【3時間】

```typescript
// src/ai/specialists/context/ContextRotationSystem.ts
export enum ReviewMethod {
  RECOGNITION = 'recognition',  // 認識テスト（英 → 日）
  RECALL = 'recall',            // 想起テスト（日 → 英）
  SENTENCE = 'sentence',        // 文脈テスト（穴埋め）
  LISTENING = 'listening',      // 聴覚テスト（音声 → 書き取り）
  PRODUCTION = 'production'     // 産出テスト（画像 → 英語）
}

export class ContextRotationSystem {
  /**
   * 試行回数に応じた復習方法の選択
   */
  selectReviewMethod(
    word: Word,
    progress: WordProgress
  ): ReviewMethod {
    const attempts = progress.attempts || 0;
    const accuracy = progress.accuracy || 0;
    
    // 初回: 認識テスト（簡単）
    if (attempts === 0) {
      return ReviewMethod.RECOGNITION;
    }
    
    // 2-3回目: 想起テスト（中級）
    if (attempts <= 3) {
      return ReviewMethod.RECALL;
    }
    
    // 4-6回目: 文脈テスト（応用）
    if (attempts <= 6 && accuracy >= 0.7) {
      return ReviewMethod.SENTENCE;
    }
    
    // 7回目以降: ランダムで多様性確保
    return this.selectRandomMethod(accuracy);
  }
  
  private selectRandomMethod(accuracy: number): ReviewMethod {
    const methods = [
      ReviewMethod.RECOGNITION,
      ReviewMethod.RECALL,
      ReviewMethod.SENTENCE
    ];
    
    // 正答率高い → 聴覚・産出も追加
    if (accuracy >= 0.8) {
      methods.push(ReviewMethod.LISTENING, ReviewMethod.PRODUCTION);
    }
    
    return methods[Math.floor(Math.random() * methods.length)];
  }
  
  /**
   * 方法別の問題生成
   */
  generateQuestion(
    word: Word,
    method: ReviewMethod
  ): QuestionVariant {
    switch (method) {
      case ReviewMethod.RECOGNITION:
        return {
          type: 'recognition',
          prompt: word.english,
          answer: word.japanese,
          instruction: '意味を選んでください'
        };
        
      case ReviewMethod.RECALL:
        return {
          type: 'recall',
          prompt: word.japanese,
          answer: word.english,
          instruction: '英語で答えてください'
        };
        
      case ReviewMethod.SENTENCE:
        return this.generateSentenceQuestion(word);
        
      case ReviewMethod.LISTENING:
        return {
          type: 'listening',
          audioUrl: word.pronunciation?.audio,
          answer: word.english,
          instruction: '聞こえた単語を書き取ってください'
        };
        
      case ReviewMethod.PRODUCTION:
        return {
          type: 'production',
          imageUrl: word.image,
          answer: word.english,
          instruction: '画像を英語で説明してください'
        };
    }
  }
  
  private generateSentenceQuestion(word: Word): QuestionVariant {
    // 例文から穴埋め問題を生成
    const sentence = word.exampleSentence || `I use ${word.english} every day.`;
    const blankedSentence = sentence.replace(word.english, '____');
    
    return {
      type: 'sentence',
      prompt: blankedSentence,
      answer: word.english,
      instruction: '空欄に入る単語を答えてください',
      hint: `${word.english.length}文字の単語`
    };
  }
}
```

### 工程6-2: QuestionCard多様化【3時間】
- 5種類のテスト形式コンポーネント
- 方法別のUI実装
- アニメーション・効果音

### 工程6-3: 音声・画像リソース準備【2時間】
- 音声ファイル生成（TTS API使用）
- 画像リソースの準備
- リソース管理システム

### 工程6-4: テスト作成【2時間】
- 各ReviewMethodのテスト（25ケース）
- UI統合テスト（15ケース）

**Phase 6 完了基準**:
- ✅ 5種類の復習方法実装
- ✅ 文脈変更システム完成
- ✅ 音声・画像リソース統合
- ✅ **個別化スコア: 75% → 90%**

---

## 📊 最終目標達成予測

| 観点 | 現状 | Phase完了後 | 目標 | 達成 |
|------|------|------------|------|------|
| **適応的学習** | 80% | 95% | 95% | ✅ |
| **Spaced Repetition** | 60% | 95% | 95% | ✅ |
| **個別化** | 75% | 90% | 90% | ✅ |
| **人間らしさ** | 65% | 90% | 90% | ✅ |
| **記憶の超定着** | 60% | 95% | 95% | ✅ |
| **総合スコア** | 72% | **93%** | 93% | ✅ |

---

## ⏱️ 工数サマリー

| Phase | 内容 | 工数 | 優先度 | リスク |
|-------|------|------|--------|--------|
| Phase 1 | Constants抽出 | 2.5時間 | 🟢 高 | 低 |
| Phase 2 | Strategy Pattern | 12時間 | 🟡 中 | 中 |
| Phase 3 | AI統合強化 | 8時間 | 🟡 中 | 中 |
| **Phase 4** | **記憶科学統合** | **18時間** | 🔴 **最高** | 高 |
| **Phase 5** | **感情的サポート** | **12時間** | 🔴 **高** | 中 |
| Phase 6 | 多様な復習 | 10時間 | 🟡 中 | 低 |
| **合計** | | **62.5時間** | | |

### 実装スケジュール（目安）
- **短期（1週間）**: Phase 1のみ実装
- **中期（2週間）**: Phase 1-3完了
- **長期（4週間）**: Phase 1-6全て完了 → **93点達成** 🎯

---

## ✅ 品質保証チェックリスト

### Phase完了時の必須確認項目
- [ ] 全ユニットテストがパス（100%）
- [ ] 型エラーゼロ
- [ ] ESLintエラーゼロ
- [ ] パフォーマンス劣化なし（Lighthouse 90+維持）
- [ ] 既存機能のリグレッションテストパス
- [ ] デバッグパネルで動作確認
- [ ] ドキュメント更新完了

### 最終リリース前の確認
- [ ] E2Eテスト全てパス
- [ ] クロスブラウザテスト完了
- [ ] データ移行テスト完了
- [ ] ユーザーマニュアル更新
- [ ] AIシステムの透明性確保（各判断理由の表示）
- [ ] プライバシー・セキュリティ確認

---

## 🎯 成功の定義

### 技術的成功指標
1. ✅ SM-2アルゴリズム完全実装
2. ✅ Ebbinghaus曲線統合
3. ✅ 4段階の記憶移行戦略
4. ✅ EmotionalAI稼働
5. ✅ 5種類の復習方法実装
6. ✅ 総合スコア93点以上

### ユーザー体験指標
1. 📈 学習定着率: 70% → 90%以上
2. 📈 学習継続率: 60% → 85%以上
3. 📈 学習満足度: 7.5/10 → 9.0/10以上
4. 📉 挫折率: 30% → 10%以下

---

**このロードマップに従えば、人間の家庭教師のように生徒に寄り添い、科学的根拠に基づいた記憶の超定着を実現できます。** 🚀
