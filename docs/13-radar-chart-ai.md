# 13. レーダーチャートAI仕様書

## 📊 概要

レーダーチャートAIは、カテゴリー別の習熟度を分析し、レーダーチャートとして可視化するAIシステムです。弱点カテゴリーを特定し、バランスの取れた学習プランを提案します。

### 主な機能

- **カテゴリー別分析**: 名詞・動詞・形容詞などの習熟度を計算
- **弱点検出**: 習熟度が低いカテゴリーを自動特定
- **改善プラン生成**: 弱点克服のための学習プランを提案
- **進捗追跡**: カテゴリー別の成長を時系列で記録

---

## 🎯 機能仕様

### 1. データ構造

```typescript
export interface RadarAnalysis {
  categories: Map<string, number>; // カテゴリー名 → 習熟度(0-100)
  weaknesses: CategoryWeakness[];
  strengths: CategoryStrength[];
  balance: number; // 0-100: バランスの良さ
}

export interface CategoryWeakness {
  category: string;
  mastery: number;
  gap: number;          // 平均からの差
  priority: number;     // 改善優先度
}

export interface CategoryStrength {
  category: string;
  mastery: number;
  advantage: number;    // 平均を上回る度合い
}
```

### 2. カテゴリー別習熟度の計算

```typescript
export function analyzeCategoryMastery(
  questions: Question[],
  wordProgress: Record<string, WordProgress>
): Map<string, number> {
  const categoryStats = new Map<string, { total: number; count: number }>();
  
  questions.forEach(q => {
    const category = q.category || '未分類';
    const progress = wordProgress[q.word];
    
    if (progress) {
      const mastery = calculateMastery(progress);
      
      if (!categoryStats.has(category)) {
        categoryStats.set(category, { total: 0, count: 0 });
      }
      
      const stats = categoryStats.get(category)!;
      stats.total += mastery;
      stats.count += 1;
    }
  });
  
  const categoryMastery = new Map<string, number>();
  categoryStats.forEach((stats, category) => {
    categoryMastery.set(category, stats.total / stats.count);
  });
  
  return categoryMastery;
}

function calculateMastery(progress: WordProgress): number {
  const total = progress.correctCount + progress.incorrectCount;
  if (total === 0) return 0;
  
  const accuracy = (progress.correctCount / total) * 100;
  const stability = Math.min(100, progress.correctCount * 10);
  
  return (accuracy * 0.7 + stability * 0.3);
}
```

### 3. 弱点カテゴリーの検出

```typescript
export function detectWeaknesses(
  categoryMastery: Map<string, number>
): CategoryWeakness[] {
  const values = Array.from(categoryMastery.values());
  const average = values.reduce((a, b) => a + b) / values.length;
  
  const weaknesses: CategoryWeakness[] = [];
  
  categoryMastery.forEach((mastery, category) => {
    if (mastery < average - 10) {
      weaknesses.push({
        category,
        mastery,
        gap: average - mastery,
        priority: Math.round((average - mastery) * 2)
      });
    }
  });
  
  return weaknesses.sort((a, b) => b.priority - a.priority);
}
```

### 4. バランススコアの計算

```typescript
export function calculateBalance(
  categoryMastery: Map<string, number>
): number {
  const values = Array.from(categoryMastery.values());
  if (values.length === 0) return 0;
  
  const mean = values.reduce((a, b) => a + b) / values.length;
  const variance = values.reduce((sum, v) => 
    sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // 標準偏差が小さいほどバランスが良い
  const balance = Math.max(0, 100 - stdDev * 2);
  return Math.round(balance);
}
```

### 5. 改善プランの生成

```typescript
export interface ImprovementPlan {
  targetCategory: string;
  currentMastery: number;
  targetMastery: number;
  estimatedDays: number;
  dailyGoal: number;      // 1日の学習単語数
}

export function generateImprovementPlan(
  weakness: CategoryWeakness,
  totalWords: number
): ImprovementPlan {
  const gap = 70 - weakness.mastery; // 目標: 70点
  const dailyGoal = Math.ceil(totalWords * 0.1); // 全体の10%
  const estimatedDays = Math.ceil(gap / 5); // 1日5点向上と仮定
  
  return {
    targetCategory: weakness.category,
    currentMastery: weakness.mastery,
    targetMastery: 70,
    estimatedDays,
    dailyGoal
  };
}
```

### 6. UI統合（CategoryRadarChart.tsx）

```tsx
import { Radar } from 'react-chartjs-2';

function CategoryRadarChart({ radarData }: { radarData: RadarAnalysis }) {
  const chartData = {
    labels: Array.from(radarData.categories.keys()),
    datasets: [{
      label: '習熟度',
      data: Array.from(radarData.categories.values()),
      backgroundColor: 'rgba(33, 150, 243, 0.2)',
      borderColor: 'rgb(33, 150, 243)',
      pointBackgroundColor: 'rgb(33, 150, 243)',
    }]
  };
  
  const options = {
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { stepSize: 20 }
      }
    }
  };
  
  return <Radar data={chartData} options={options} />;
}
```

---

## 📚 関連ドキュメント

- [05. 統計・分析画面](./05-stats-analytics.md) - レーダーチャート表示
- [09. 文脈学習AI](./09-contextual-learning-ai.md) - カテゴリー別学習
