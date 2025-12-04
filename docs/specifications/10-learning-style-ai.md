# 10. 学習スタイルAI仕様書

## 👤 概要

学習スタイルAIは、ユーザーの学習パターンを分析し、個人に最適化された学習戦略を提案するAIシステムです。時間帯別のパフォーマンス、セッション長、学習頻度などから、最も効率的な学習方法を自動で発見します。

### 主な機能

- **学習パターン分析**: 時間帯・セッション長・頻度を分析
- **最適時間帯検出**: パフォーマンスが最も高い時間帯を特定
- **個別最適化**: ユーザーごとの学習スタイルプロファイルを生成
- **効率性メトリクス**: 学習効率を数値化して可視化

---

## 🎯 機能仕様

### 1. データ構造

```typescript
export interface LearningStyleProfile {
  optimalTimeOfDay: 'morning' | 'afternoon' | 'evening';
  optimalSessionLength: number; // 分
  preferredFrequency: 'daily' | 'every-other-day' | 'weekly';
  learningPace: 'fast' | 'moderate' | 'slow';
  retentionStrength: 'high' | 'medium' | 'low';
}

export interface TimeOfDayPerformance {
  morning: { accuracy: number; speed: number };
  afternoon: { accuracy: number; speed: number };
  evening: { accuracy: number; speed: number };
}
```

### 2. 最適時間帯の検出

```typescript
export function detectOptimalTimeOfDay(
  sessionHistory: SessionStats[]
): 'morning' | 'afternoon' | 'evening' {
  const performance = {
    morning: { total: 0, count: 0 },
    afternoon: { total: 0, count: 0 },
    evening: { total: 0, count: 0 }
  };
  
  sessionHistory.forEach(session => {
    const hour = new Date(session.startTime).getHours();
    const timeSlot = 
      hour < 12 ? 'morning' :
      hour < 18 ? 'afternoon' : 'evening';
    
    performance[timeSlot].total += session.accuracy;
    performance[timeSlot].count += 1;
  });
  
  const averages = {
    morning: performance.morning.total / performance.morning.count || 0,
    afternoon: performance.afternoon.total / performance.afternoon.count || 0,
    evening: performance.evening.total / performance.evening.count || 0
  };
  
  return Object.keys(averages).reduce((a, b) => 
    averages[a] > averages[b] ? a : b
  ) as 'morning' | 'afternoon' | 'evening';
}
```

### 3. 最適セッション長の分析

```typescript
export function analyzeOptimalSessionLength(
  sessionHistory: SessionStats[]
): number {
  const lengthGroups = {
    short: { accuracies: [], count: 0 },   // 0-15分
    medium: { accuracies: [], count: 0 },  // 15-30分
    long: { accuracies: [], count: 0 }     // 30分以上
  };
  
  sessionHistory.forEach(session => {
    const group = 
      session.duration < 15 ? 'short' :
      session.duration < 30 ? 'medium' : 'long';
    
    lengthGroups[group].accuracies.push(session.accuracy);
    lengthGroups[group].count += 1;
  });
  
  const bestGroup = Object.entries(lengthGroups)
    .map(([group, data]) => ({
      group,
      avgAccuracy: data.accuracies.reduce((a, b) => a + b, 0) / data.count
    }))
    .sort((a, b) => b.avgAccuracy - a.avgAccuracy)[0];
  
  return bestGroup.group === 'short' ? 15 :
         bestGroup.group === 'medium' ? 25 : 40;
}
```

### 4. 学習ペースの判定

```typescript
export function determineLearningPace(
  wordProgress: Record<string, WordProgress>
): 'fast' | 'moderate' | 'slow' {
  const wordsLearned = Object.keys(wordProgress).length;
  const totalDays = 30; // 仮定
  const wordsPerDay = wordsLearned / totalDays;
  
  if (wordsPerDay > 20) return 'fast';
  if (wordsPerDay > 10) return 'moderate';
  return 'slow';
}
```

---

## 📚 関連ドキュメント

- [07. 認知負荷管理AI](./07-cognitive-load-ai.md) - 疲労度検出
- [12. 学習曲線AI](./12-learning-curve-ai.md) - 習得速度の予測
