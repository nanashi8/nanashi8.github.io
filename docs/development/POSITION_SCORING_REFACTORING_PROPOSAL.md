# Position Scoring System リファクタリング提案

## 現在の問題点

### 1. 巨大なif-elseチェーン
- `determineWordPosition()` が約200行
- 新条件追加で複雑化
- テストが困難

### 2. Magic Numbers
```typescript
if (position >= 40 && position < 70)  // 40, 70の意味が不明瞭
return Math.min(40 + boost, 50);      // 50の根拠が分からない
```

### 3. 条件の優先順位が暗黙的
- if-elseの順序に依存
- 新条件挿入で既存ロジックに影響

## 業界標準アプローチ

### 1. Spaced Repetition System (SRS)

#### SM-2 Algorithm（1987年、SuperMemo）
```typescript
interface SM2State {
  interval: number;      // 次回までの日数
  repetition: number;    // 繰り返し回数
  easinessFactor: number; // 難易度係数（1.3-2.5）
}

function sm2(quality: number, prev: SM2State): SM2State {
  // quality: 0-5（0=完全に忘れた、5=完璧）
  let ef = prev.easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  ef = Math.max(1.3, ef);
  
  if (quality < 3) {
    return { interval: 1, repetition: 0, easinessFactor: ef };
  }
  
  if (prev.repetition === 0) {
    return { interval: 1, repetition: 1, easinessFactor: ef };
  }
  
  return {
    interval: Math.round(prev.interval * ef),
    repetition: prev.repetition + 1,
    easinessFactor: ef
  };
}
```

**特徴**:
- 研究に基づいた科学的アルゴリズム
- 個人の記憶力に適応（easinessFactor）
- 忘却曲線を考慮

#### Anki's Algorithm（SM-2の改良版）
```typescript
type AnkiCard = {
  state: 'learning' | 'review' | 'relearning';
  interval: number;
  easeFactor: number;
  lapses: number;
};

// 4段階評価
type AnkiResponse = 'again' | 'hard' | 'good' | 'easy';
```

**特徴**:
- Learning/Review フェーズを分離
- "Again", "Hard", "Good", "Easy" の4段階
- より細かい間隔調整

#### Leitner System（ボックスシステム）
```typescript
const leitnerBoxes = {
  box1: { interval: 1, name: '毎日' },
  box2: { interval: 2, name: '2日ごと' },
  box3: { interval: 4, name: '4日ごと' },
  box4: { interval: 8, name: '8日ごと' },
  box5: { interval: 16, name: '16日ごと' }
};

// 正解 → 次のボックスへ
// 不正解 → Box 1 へ戻る
```

**特徴**:
- シンプルで理解しやすい
- 物理カードでも実装可能
- デジタル化しやすい

### 2. Weighted Scoring System

```typescript
interface ScoringWeights {
  accuracy: number;          // 正答率
  recentPerformance: number; // 最近の成績
  timeDecay: number;         // 時間経過
  difficulty: number;        // 単語の難易度
  stillLearning: number;     // 「まだまだ」回数
}

function calculatePosition(
  progress: WordProgress,
  weights: ScoringWeights
): number {
  const accuracy = progress.correct / progress.attempts;
  const recentBoost = progress.consecutiveCorrect * weights.recentPerformance;
  const stillBoost = progress.memorizationStillLearning * weights.stillLearning;
  
  const score = 
    accuracy * weights.accuracy +
    recentBoost +
    stillBoost -
    progress.consecutiveIncorrect * 10;
  
  return normalizeToPosition(score);
}
```

**特徴**:
- 複数要素を統合的に評価
- 重み付け調整で柔軟に対応
- A/Bテストしやすい

### 3. Strategy Pattern

```typescript
interface PositionStrategy {
  canHandle(progress: WordProgress): boolean;
  calculatePosition(progress: WordProgress): number;
}

class NewWordStrategy implements PositionStrategy {
  canHandle(progress: WordProgress): boolean {
    return progress.attempts === 0;
  }
  
  calculatePosition(progress: WordProgress): number {
    return 35; // 新規単語の初期Position
  }
}

class StillLearningStrategy implements PositionStrategy {
  canHandle(progress: WordProgress): boolean {
    return (
      progress.memorizationStillLearning > 0 &&
      progress.consecutiveCorrect === 0 &&
      progress.consecutiveIncorrect === 0
    );
  }
  
  calculatePosition(progress: WordProgress): number {
    const boost = Math.min(progress.memorizationStillLearning * 5, 15);
    return Math.min(40 + boost, 50);
  }
}

class MasteredStrategy implements PositionStrategy {
  canHandle(progress: WordProgress): boolean {
    return progress.consecutiveCorrect >= 3;
  }
  
  calculatePosition(progress: WordProgress): number {
    return 10; // 定着済み
  }
}

class IncorrectStrategy implements PositionStrategy {
  canHandle(progress: WordProgress): boolean {
    return progress.consecutiveIncorrect >= 3;
  }
  
  calculatePosition(progress: WordProgress): number {
    return 85; // 最優先
  }
}

class PositionCalculator {
  private strategies: PositionStrategy[] = [
    new IncorrectStrategy(),    // 最優先
    new MasteredStrategy(),
    new StillLearningStrategy(),
    new NewWordStrategy(),
    // ... その他
  ];
  
  calculatePosition(progress: WordProgress): number {
    for (const strategy of this.strategies) {
      if (strategy.canHandle(progress)) {
        return strategy.calculatePosition(progress);
      }
    }
    
    // デフォルト計算
    return this.defaultCalculation(progress);
  }
}
```

**特徴**:
- 各状態のロジックを分離
- テストしやすい
- 新条件追加が容易
- 優先順位が明示的

### 4. Rule-based System（設定ファイル）

```typescript
// position-rules.config.ts
export const positionRules = [
  {
    name: 'consecutive_incorrect_3',
    priority: 1,
    condition: (p: WordProgress) => p.consecutiveIncorrect >= 3,
    position: 85,
    description: '3回連続不正解 → 最優先'
  },
  {
    name: 'consecutive_correct_3',
    priority: 2,
    condition: (p: WordProgress) => p.consecutiveCorrect >= 3,
    position: 10,
    description: '3回連続正解 → 定着済み'
  },
  {
    name: 'still_learning',
    priority: 3,
    condition: (p: WordProgress) => 
      p.memorizationStillLearning > 0 &&
      p.consecutiveCorrect === 0 &&
      p.consecutiveIncorrect === 0,
    position: (p: WordProgress) => {
      const boost = Math.min(p.memorizationStillLearning * 5, 15);
      return Math.min(40 + boost, 50);
    },
    description: '「まだまだ」選択 → Position 40-50'
  },
  // ... 他のルール
];

function determinePosition(progress: WordProgress): number {
  // 優先順位順にルールを評価
  for (const rule of positionRules.sort((a, b) => a.priority - b.priority)) {
    if (rule.condition(progress)) {
      return typeof rule.position === 'function' 
        ? rule.position(progress) 
        : rule.position;
    }
  }
  
  return defaultPosition(progress);
}
```

**特徴**:
- ルールが可視化される
- 優先順位が明示的
- テストケース作成が容易
- ノンプログラマーでも理解可能

## 推奨リファクタリング案

### 段階的アプローチ

#### Phase 1: Constants抽出（即座に実行可能）

```typescript
// src/ai/utils/positionConstants.ts
export const POSITION_RANGES = {
  MASTERED: { min: 0, max: 20, default: 10 },
  NEW: { min: 20, max: 40, default: 35 },
  STILL_LEARNING: { min: 40, max: 70, default: 50 },
  INCORRECT: { min: 70, max: 100, default: 85 }
} as const;

export const POSITION_THRESHOLDS = {
  GAMIFICATION_NEW_MIN: 40,
  GAMIFICATION_NEW_MAX: 59,
  GAMIFICATION_STILL_MIN: 60,
  GAMIFICATION_STILL_MAX: 69
} as const;

export const CONSECUTIVE_THRESHOLDS = {
  MASTERED: 3,
  LEARNING: 2,
  STRUGGLING: 1,
  INCORRECT: 3
} as const;
```

**メリット**:
- Magic numbers 削減
- 意味が明確
- 変更が一箇所に集約

#### Phase 2: Strategy Pattern導入（中期）

```typescript
// src/ai/utils/positionStrategies/index.ts
export class PositionCalculator {
  private strategies: PositionStrategy[];
  
  constructor() {
    this.strategies = [
      new ConsecutiveIncorrectStrategy(),
      new ConsecutiveMasteredStrategy(),
      new StillLearningStrategy(),
      new NewWordStrategy(),
      new DefaultStrategy()
    ];
  }
  
  calculate(progress: WordProgress, mode: string): number {
    for (const strategy of this.strategies) {
      if (strategy.canApply(progress, mode)) {
        return strategy.calculate(progress, mode);
      }
    }
    
    throw new Error('No strategy matched');
  }
}
```

**メリット**:
- テストしやすい
- 各戦略を独立開発可能
- 優先順位が明示的

#### Phase 3: SRS Algorithm統合（長期）

```typescript
// src/ai/utils/srs/sm2.ts
export class SM2Scheduler {
  calculateNextReview(
    quality: number,
    state: SM2State
  ): SM2State {
    // SM-2 algorithm実装
  }
}

// 既存のPosition systemと併用
function determinePositionWithSRS(
  progress: WordProgress
): number {
  const sm2State = calculateSM2State(progress);
  const basePosition = positionCalculator.calculate(progress);
  
  // SRSスケジュールとPosition systemを統合
  return adjustPositionBySRS(basePosition, sm2State);
}
```

**メリット**:
- 科学的根拠に基づく
- 長期記憶の形成に最適
- 業界標準に準拠

## 実装優先度

### 🟢 優先度：高（即座に実行）
1. **Constants抽出**
   - Magic numbers削減
   - 1-2時間で完了
   - リスク：低

### 🟡 優先度：中（次回メジャーアップデート）
2. **Strategy Pattern導入**
   - 保守性向上
   - 1-2日で完了
   - リスク：中（リグレッションテスト必要）

### 🔴 優先度：低（将来的な改善）
3. **SRS Algorithm統合**
   - 学習効果の科学的最適化
   - 1-2週間で完了
   - リスク：高（既存データ移行、UI変更必要）

## 参考資料

### Spaced Repetition Systems
- [SuperMemo Algorithm (SM-2)](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)
- [Anki's Scheduling Algorithm](https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html)
- [Leitner System](https://en.wikipedia.org/wiki/Leitner_system)

### Design Patterns
- [Strategy Pattern (Refactoring Guru)](https://refactoring.guru/design-patterns/strategy)
- [Clean Code - Chapter 3: Functions](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)

### Research Papers
- Wozniak, P. A., & Gorzelańczyk, E. J. (1994). "Optimization of repetition spacing in the practice of learning"
- Cepeda, N. J., et al. (2006). "Distributed practice in verbal recall tasks: A review and quantitative synthesis"

## 結論

### 現状で問題ない場合
- 動作しているコードは触らない（"If it ain't broke, don't fix it"）
- Magic numbers のConstants化のみ実施

### 今後の拡張を考える場合
- Strategy Patternへのリファクタリングを推奨
- テストカバレッジ向上

### 長期的な最適化を目指す場合
- SRS Algorithm（SM-2やAnki風）の統合
- ユーザーの学習データを分析してアルゴリズム改善
