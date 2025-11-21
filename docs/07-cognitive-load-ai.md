# 07. 認知負荷管理AI仕様書

## 🧠 概要

認知負荷管理AIは、学習セッション中のユーザーの疲労度と集中力をリアルタイムで監視し、最適な学習環境を提供するAIシステムです。応答時間や正答率の変化から疲労を検出し、適切なタイミングで休憩を推奨します。

### 主な機能

- **リアルタイム疲労度検出**: 応答時間・正答率の変化から疲労を0-100で数値化
- **適応的難易度調整**: 疲労時は簡単な問題、集中時は難問を出題
- **時間帯別最適化**: 朝は新規学習、夜は復習を優先
- **休憩推奨アルゴリズム**: 疲労度に応じて5分休憩を提案

---

## 🎯 機能仕様

### 1. データ構造

#### CognitiveLoadMonitor（認知負荷モニター）

```typescript
export interface CognitiveLoadMonitor {
  fatigueLevel: number;          // 疲労度（0-100）
  concentrationLevel: number;    // 集中力レベル（0-100）
  
  recentPerformance: {
    last5Accuracy: number;       // 直近5問の正答率
    last10Accuracy: number;      // 直近10問の正答率
    isDecreasing: boolean;       // 正答率が下降傾向か
    averageResponseTime: number; // 平均応答時間（ミリ秒）
  };
  
  sessionStats: {
    duration: number;            // セッション時間（分）
    questionsAnswered: number;   // 回答数
    correctCount: number;        // 正解数
    startTime: number;           // 開始時刻（タイムスタンプ）
  };
  
  breakRecommendation?: {
    shouldBreak: boolean;        // 休憩すべきか
    reason: string;              // 理由
    suggestedDuration: number;   // 推奨休憩時間（分）
  };
  
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}
```

#### SessionResponse（セッション応答記録）

```typescript
export interface SessionResponse {
  timestamp: number;           // タイムスタンプ
  wasCorrect: boolean;         // 正解したか
  responseTime: number;        // 応答時間（ミリ秒）
  questionDifficulty: number;  // 推定難易度（0-1）
}
```

---

### 2. 疲労度計算アルゴリズム

#### 4つの疲労要因

```typescript
let fatigueLevel = 0;

// 1. セッション時間（長時間学習で疲労増加）
fatigueLevel += Math.min(40, sessionDuration * 2); // 20分で40pt

// 2. 正答率の下降（疲労の強い兆候）
if (isDecreasing) {
  fatigueLevel += 25;
}

// 3. 応答時間の増加（集中力低下）
if (responseTimeIncrease > 1.3) { // 30%以上増加
  fatigueLevel += 20;
}

// 4. 連続誤答（疲労または理解不足）
const recentErrors = responses.slice(-3).filter(r => !r.wasCorrect).length;
if (recentErrors >= 2) {
  fatigueLevel += 15;
}

// 0-100に正規化
fatigueLevel = Math.min(100, Math.max(0, fatigueLevel));
```

#### 集中力レベル

```typescript
// 疲労度の逆数
const concentrationLevel = 100 - fatigueLevel;
```

---

### 3. 休憩推奨ロジック

#### 3つの推奨パターン

```typescript
function determineBreakRecommendation(
  fatigueLevel: number,
  sessionDuration: number,
  isDecreasing: boolean
): CognitiveLoadMonitor['breakRecommendation'] {
  // パターン1: 高疲労状態（疲労度70以上）
  if (fatigueLevel >= 70) {
    return {
      shouldBreak: true,
      reason: '疲労が蓄積しています。5分休憩して集中力を回復しましょう。',
      suggestedDuration: 5
    };
  }
  
  // パターン2: 長時間学習（25分以上、疲労度50以上）
  if (sessionDuration >= 25 && fatigueLevel >= 50) {
    return {
      shouldBreak: true,
      reason: '25分経過しました。短い休憩で効率がアップします。',
      suggestedDuration: 5
    };
  }
  
  // パターン3: 正答率低下（疲労度40以上）
  if (isDecreasing && fatigueLevel >= 40) {
    return {
      shouldBreak: true,
      reason: '正答率が下がっています。少し休憩しませんか？',
      suggestedDuration: 3
    };
  }
  
  return undefined;
}
```

---

### 4. 時間帯別最適化

#### 時間帯の判定

```typescript
const hour = new Date().getHours();
let timeOfDay: CognitiveLoadMonitor['timeOfDay'];

if (hour >= 6 && hour < 12) timeOfDay = 'morning';       // 6-12時
else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon'; // 12-18時
else if (hour >= 18 && hour < 22) timeOfDay = 'evening';   // 18-22時
else timeOfDay = 'night';                                  // 22-6時
```

#### 時間帯別の学習戦略

| 時間帯 | 推奨学習内容 | 理由 |
|--------|-------------|------|
| **朝** (`morning`) | 新規単語の学習 | 記憶力が高い時間帯 |
| **昼** (`afternoon`) | 復習と練習 | 集中力が安定 |
| **夕** (`evening`) | 復習中心 | 1日の学習を定着させる |
| **夜** (`night`) | 軽めの復習のみ | 疲労が高い |

---

### 5. 適応的難易度調整

#### 疲労度に応じた問題選択

```typescript
export function adjustDifficultyByCognitiveLoad(
  questions: Question[],
  cognitiveLoad: CognitiveLoadMonitor
): Question[] {
  const { fatigueLevel, timeOfDay } = cognitiveLoad;
  
  // 高疲労時: 簡単な問題を優先
  if (fatigueLevel >= 60) {
    return questions.sort((a, b) => {
      const diffA = estimateDifficulty(a);
      const diffB = estimateDifficulty(b);
      return diffA - diffB; // 簡単な順
    });
  }
  
  // 低疲労時: バランス良く
  if (fatigueLevel < 30) {
    return questions; // 通常の優先度順
  }
  
  // 中程度の疲労: 復習中心
  return questions.sort((a, b) => {
    // 学習済み単語を優先
    return (b.reviewCount || 0) - (a.reviewCount || 0);
  });
}
```

---

### 6. パフォーマンストレンド分析

#### 応答時間の傾向

```typescript
function calculateTrend(values: number[]): number {
  if (values.length < 2) return 1;
  
  const recent = values.slice(-3);
  const earlier = values.slice(0, Math.max(1, values.length - 3));
  
  const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
  const earlierAvg = earlier.reduce((sum, v) => sum + v, 0) / earlier.length;
  
  return earlierAvg > 0 ? recentAvg / earlierAvg : 1;
}

// 使用例
const responseTimeIncrease = calculateTrend(recentResponseTimes);
if (responseTimeIncrease > 1.3) {
  // 応答時間が30%以上増加 → 疲労の兆候
  fatigueLevel += 20;
}
```

---

### 7. UI統合

#### 疲労度表示

```tsx
<div className="cognitive-load-indicator">
  <div className="fatigue-level">
    <span className="label">疲労度:</span>
    <div className="bar">
      <div 
        className="fill" 
        style={{ width: `${fatigueLevel}%` }}
      />
    </div>
    <span className="value">{fatigueLevel}%</span>
  </div>
  
  {breakRecommendation?.shouldBreak && (
    <div className="break-alert">
      <span className="icon">☕</span>
      <span className="message">{breakRecommendation.reason}</span>
      <button className="break-btn">
        {breakRecommendation.suggestedDuration}分休憩
      </button>
    </div>
  )}
</div>
```

---

### 8. 統計データの活用

#### セッション終了時の分析

```typescript
export function analyzeCognitiveSession(
  monitor: CognitiveLoadMonitor
): {
  efficiency: number; // 効率性（0-100）
  recommendation: string;
} {
  const { fatigueLevel, sessionStats, recentPerformance } = monitor;
  
  const efficiency = 
    (recentPerformance.last10Accuracy * 0.6) + 
    ((100 - fatigueLevel) * 0.4);
  
  let recommendation = '';
  
  if (efficiency >= 80) {
    recommendation = '素晴らしい集中力でした！このペースを維持しましょう。';
  } else if (efficiency >= 60) {
    recommendation = '良いセッションでした。次回はもう少し休憩を挟むと効果的です。';
  } else {
    recommendation = '疲労が見られました。次回は短めのセッションにしましょう。';
  }
  
  return { efficiency, recommendation };
}
```

---

### 9. ポモドーロテクニック統合

#### 25分学習 + 5分休憩サイクル

```typescript
export function shouldSuggestPomodoro(
  sessionDuration: number,
  lastBreakTime: number
): boolean {
  const timeSinceBreak = (Date.now() - lastBreakTime) / (1000 * 60);
  return sessionDuration >= 25 || timeSinceBreak >= 25;
}
```

---

### 10. データ保存

#### LocalStorageへの記録

```typescript
export function saveCognitiveLoadData(monitor: CognitiveLoadMonitor): void {
  const history = JSON.parse(localStorage.getItem('cognitiveHistory') || '[]');
  history.push({
    date: new Date().toISOString(),
    fatigueLevel: monitor.fatigueLevel,
    concentrationLevel: monitor.concentrationLevel,
    duration: monitor.sessionStats.duration,
    accuracy: (monitor.sessionStats.correctCount / monitor.sessionStats.questionsAnswered) * 100
  });
  
  // 直近30セッションのみ保持
  if (history.length > 30) {
    history.shift();
  }
  
  localStorage.setItem('cognitiveHistory', JSON.stringify(history));
}
```

---

## 📚 関連ドキュメント

- [01. プロジェクト概要](./01-project-overview.md) - AI機能の全体像
- [08. エラー予測AI](./08-error-prediction-ai.md) - 誤答リスク予測
- [10. 学習スタイルAI](./10-learning-style-ai.md) - 個人の学習パターン分析
- [12. 学習曲線AI](./12-learning-curve-ai.md) - 習得速度の予測
