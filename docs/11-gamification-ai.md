# 11. ゲーミフィケーションAI仕様書

## 🎮 概要

ゲーミフィケーションAIは、バッジ、レベル、ストリーク、マイルストーンなどのゲーム要素を管理し、学習のモチベーションを維持するAIシステムです。達成感と楽しさを提供しながら、継続的な学習を促進します。

### 主な機能

- **バッジシステム**: 特定の達成条件でバッジを獲得
- **レベルアップ**: 経験値に応じてレベルが上昇
- **ストリーク管理**: 連続学習日数を記録
- **マイルストーン**: 100語習得などの節目を祝福

---

## 🎯 機能仕様

### 1. データ構造

```typescript
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: string;
  earnedAt?: number;
}

export interface UserLevel {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  title: string; // "初心者", "中級者", "上級者"
}

export interface Streak {
  currentStreak: number;    // 現在の連続日数
  longestStreak: number;    // 最長連続日数
  lastStudyDate: string;    // 最終学習日 (YYYY-MM-DD)
}
```

### 2. バッジの種類

```typescript
const BADGES = [
  {
    id: 'first-word',
    name: '最初の一歩',
    description: '初めて単語を学習',
    icon: '🌱',
    criteria: '1語学習'
  },
  {
    id: '100-words',
    name: '語彙の基礎',
    description: '100語を習得',
    icon: '📚',
    criteria: '100語習得'
  },
  {
    id: '7-day-streak',
    name: '習慣化',
    description: '7日連続で学習',
    icon: '🔥',
    criteria: '7日連続'
  },
  {
    id: 'perfect-score',
    name: 'パーフェクト',
    description: '10問連続正解',
    icon: '⭐',
    criteria: '10問連続正解'
  }
];
```

### 3. レベルシステム

```typescript
export function calculateLevel(totalXP: number): UserLevel {
  const level = Math.floor(Math.sqrt(totalXP / 100)) + 1;
  const xpToNextLevel = Math.pow(level, 2) * 100;
  
  const title = 
    level < 5 ? '初心者' :
    level < 10 ? '中級者' :
    level < 20 ? '上級者' : 'マスター';
  
  return {
    level,
    currentXP: totalXP,
    xpToNextLevel,
    title
  };
}

// XP獲得
export function calculateXP(isCorrect: boolean, difficulty: number): number {
  if (!isCorrect) return 0;
  return Math.round(10 + difficulty * 20); // 10-30 XP
}
```

### 4. ストリーク管理

```typescript
export function updateStreak(
  currentStreak: Streak,
  today: string
): Streak {
  const lastDate = new Date(currentStreak.lastStudyDate);
  const todayDate = new Date(today);
  const diffDays = Math.floor(
    (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (diffDays === 0) {
    // 今日すでに学習済み
    return currentStreak;
  } else if (diffDays === 1) {
    // 連続学習
    const newStreak = currentStreak.currentStreak + 1;
    return {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, currentStreak.longestStreak),
      lastStudyDate: today
    };
  } else {
    // ストリーク途切れた
    return {
      currentStreak: 1,
      longestStreak: currentStreak.longestStreak,
      lastStudyDate: today
    };
  }
}
```

### 5. マイルストーン

```typescript
export interface Milestone {
  id: string;
  name: string;
  threshold: number;
  achieved: boolean;
}

const MILESTONES: Milestone[] = [
  { id: 'm10', name: '10語習得', threshold: 10, achieved: false },
  { id: 'm50', name: '50語習得', threshold: 50, achieved: false },
  { id: 'm100', name: '100語習得', threshold: 100, achieved: false },
  { id: 'm500', name: '500語習得', threshold: 500, achieved: false },
  { id: 'm1000', name: '1000語習得', threshold: 1000, achieved: false }
];
```

---

## 📚 関連ドキュメント

- [05. 統計・分析画面](./05-stats-analytics.md) - 進捗の可視化
- [14. AIコメント生成機能](./14-ai-comment-generator.md) - 励ましメッセージ
