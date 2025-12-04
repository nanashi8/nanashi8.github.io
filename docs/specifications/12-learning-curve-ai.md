# 12. 学習曲線AI仕様書

## 📈 概要

学習曲線AIは、ユーザーの習得速度を分析し、各単語がいつ定着するかを予測するAIシステムです。忘却曲線理論に基づいて最適な復習タイミングを計算し、効率的な記憶定着を支援します。

### 主な機能

- **習得速度の予測**: 各単語の定着までの日数を予測
- **忘却曲線モデル**: エビングハウスの忘却曲線を適用
- **復習タイミング最適化**: 最適な復習間隔を自動計算
- **出題優先度算出**: 忘れそうな単語を優先的に出題

---

## 🎯 機能仕様

### 1. データ構造

```typescript
export interface LearningCurveData {
  word: string;
  attempts: LearningAttempt[];
  currentMastery: number;     // 0-100: 習熟度
  predictedMastery: number;   // 予測習熟度
  daysToMastery: number;      // 定着までの推定日数
  nextReviewDate: number;     // 次回復習推奨日（タイムスタンプ）
}

export interface LearningAttempt {
  timestamp: number;
  wasCorrect: boolean;
  responseTime: number;
  confidenceLevel: number;    // 0-100
}
```

### 2. 忘却曲線モデル

```typescript
export function calculateRetention(
  daysSinceLastReview: number,
  previousMastery: number,
  reviewCount: number
): number {
  // エビングハウスの忘却曲線: R(t) = e^(-t/S)
  const stabilityFactor = 1 + Math.log(reviewCount + 1) * 2;
  const retention = previousMastery * Math.exp(
    -daysSinceLastReview / stabilityFactor
  );
  
  return Math.max(0, Math.min(100, retention));
}
```

### 3. 最適な復習間隔

```typescript
export function calculateOptimalReviewInterval(
  currentMastery: number,
  reviewCount: number
): number {
  // SM-2アルゴリズムに基づく間隔計算
  const baseInterval = 1; // 1日
  const interval = baseInterval * Math.pow(2.5, reviewCount);
  
  // 習熟度による調整
  const masteryMultiplier = currentMastery / 100;
  return Math.round(interval * (0.5 + masteryMultiplier));
}
```

### 4. 出題優先度の算出

```typescript
export interface QuestionPriority {
  word: string;
  priority: number;         // 0-100: 高いほど優先
  reason: string;
  urgency: 'high' | 'medium' | 'low';
}

export function calculatePriority(
  curve: LearningCurveData,
  currentDate: number
): QuestionPriority {
  let priority = 50; // ベース優先度
  
  // 1. 次回復習日を過ぎている
  const daysSinceReview = 
    (currentDate - curve.nextReviewDate) / (1000 * 60 * 60 * 24);
  if (daysSinceReview > 0) {
    priority += Math.min(30, daysSinceReview * 5);
  }
  
  // 2. 習熟度が低い
  if (curve.currentMastery < 50) {
    priority += 20;
  }
  
  // 3. 過去の誤答率が高い
  const errorRate = curve.attempts.filter(a => !a.wasCorrect).length / 
                    curve.attempts.length;
  if (errorRate > 0.5) {
    priority += 15;
  }
  
  const urgency = 
    priority >= 80 ? 'high' :
    priority >= 60 ? 'medium' : 'low';
  
  return {
    word: curve.word,
    priority: Math.min(100, priority),
    reason: daysSinceReview > 0 ? '復習期限超過' : '習熟度が低い',
    urgency
  };
}
```

### 5. 予測精度の向上

```typescript
export function updatePredictionModel(
  actualResults: LearningAttempt[],
  predictions: number[]
): void {
  // 予測と実際の結果の差を計算
  const errors = actualResults.map((result, idx) => {
    const expected = predictions[idx] / 100;
    const actual = result.wasCorrect ? 1 : 0;
    return Math.abs(expected - actual);
  });
  
  // モデルの調整
  const meanError = errors.reduce((a, b) => a + b) / errors.length;
  
  if (meanError > 0.3) {
    console.log('予測精度が低いため、モデルを再調整します');
    // モデルパラメータを調整する処理
  }
}
```

---

## 📚 関連ドキュメント

- [05. 統計・分析画面](./05-stats-analytics.md) - 定着率の可視化
- [07. 認知負荷管理AI](./07-cognitive-load-ai.md) - 疲労度検出
- [08. エラー予測AI](./08-error-prediction-ai.md) - 誤答リスク予測
