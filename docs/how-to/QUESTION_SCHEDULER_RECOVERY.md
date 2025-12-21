# QuestionScheduler 復旧手順書

**カテゴリー**: How-to（手順書）  
**対象者**: 実装者、緊急復旧担当者  
**想定状況**: QuestionScheduler.ts が削除された、または機能喪失した場合  
**目標復旧時間**: 8時間以内  
**最終更新**: 2025年12月19日

---

## 🚨 緊急度判定

### 即座に復旧が必要な状況

- [ ] QuestionScheduler.tsが削除された
- [ ] 出題機能が完全に停止している
- [ ] 復習単語が一切出題されない
- [ ] エラーログに「QuestionScheduler」が表示される

### 段階的復旧で対応可能な状況

- [ ] 一部の問題だけが出題されない
- [ ] 優先度計算が期待と異なる
- [ ] 振動防止が正しく動作しない

---

## 📋 復旧前のチェックリスト

### 1. 状況確認（5分）

```bash
# ファイルの存在確認
ls -la src/ai/scheduler/QuestionScheduler.ts

# バックアップの確認
ls -la .backup/QuestionScheduler.ts.*

# Git履歴の確認
git log --oneline --all -- src/ai/scheduler/QuestionScheduler.ts | head -20
```

**判定**:
- ファイルが存在する → [トラブルシューティング](#トラブルシューティング)へ
- ファイルが存在しない → **このまま復旧手順を続行**

### 2. 必要なドキュメントの準備（5分）

以下のドキュメントを手元に用意:

1. ✅ [QuestionScheduler 完全仕様書](../specifications/QUESTION_SCHEDULER_SPEC.md)
2. ✅ [型定義リファレンス](../references/QUESTION_SCHEDULER_TYPES.md)
3. ✅ **この復旧手順書**（現在開いているドキュメント）

### 3. 依存関係の確認（5分）

```bash
# 依存ファイルの存在確認
ls -la src/ai/scheduler/types.ts
ls -la src/ai/scheduler/AntiVibrationFilter.ts
ls -la src/utils/logger.ts

# 7つのAIの存在確認
ls -la src/ai/specialists/MemoryAI.ts
ls -la src/ai/specialists/CognitiveLoadAI.ts
ls -la src/ai/specialists/ErrorPredictionAI.ts
ls -la src/ai/specialists/LearningStyleAI.ts
ls -la src/ai/specialists/LinguisticAI.ts
ls -la src/ai/specialists/ContextualAI.ts
ls -la src/ai/specialists/GamificationAI.ts
```

**全て存在する場合**: 復旧開始  
**一部欠けている場合**: 先にそれらを復旧（別の復旧手順書を参照）

---

## 🛠️ 復旧手順（全8ステップ、8時間）

---

### Step 1: ファイル骨格の作成（30分）

#### 1.1 基本構造の作成

```bash
# ファイル作成
touch src/ai/scheduler/QuestionScheduler.ts
```

#### 1.2 インポート文の記述

```typescript
// src/ai/scheduler/QuestionScheduler.ts
import type {
  ScheduleParams,
  ScheduleContext,
  ScheduleResult,
  Question,
  WordStatus,
  PrioritizedQuestion,
  DetectedSignal,  // ⭐ LearningSignal ではなく DetectedSignal
  RecentAnswer,
  CognitiveLoadLevel,
  TimeOfDay,
} from './types';

import { AntiVibrationFilter } from './AntiVibrationFilter';
import { logger } from '@/utils/logger';

// 7つのAI（現時点では未使用だがインポート保持）
import { MemoryAI } from '../MemoryAI';
import { CognitiveLoadAI } from '../CognitiveLoadAI';
import { ErrorPredictionAI } from '../ErrorPredictionAI';
import { LearningStyleAI } from '../LearningStyleAI';
import { LinguisticAI } from '../LinguisticAI';
import { ContextualRelevanceAI } from '../ContextualRelevanceAI';
import { GamificationAI } from '../GamificationAI';
```

**検証**:
```bash
# TypeScriptエラーがないことを確認
npx tsc --noEmit src/ai/scheduler/QuestionScheduler.ts
```

#### 1.3 クラス骨格の作成

```typescript
export class QuestionScheduler {
  private vibrationFilter: AntiVibrationFilter;

  constructor() {
    this.vibrationFilter = new AntiVibrationFilter();
    logger.info('[QuestionScheduler] 初期化完了');
  }

  /**
   * メインAPI: 問題をスケジューリング
   */
  public async schedule(params: ScheduleParams): Promise<ScheduleResult> {
    logger.info('[QuestionScheduler] スケジューリング開始', {
      questionCount: params.availableQuestions.length,
      useMetaAI: params.useMetaAI,
    });

    // TODO: 実装
    return {
      scheduledQuestions: [],
      vibrationScore: 0,
    };
  }

  // 以下、メソッドを順次実装
}
```

**検証**:
```typescript
import { QuestionScheduler } from './QuestionScheduler';

const scheduler = new QuestionScheduler();
const result = await scheduler.schedule({
  availableQuestions: [],
  recentAnswers: [],
});

console.log('✅ Step 1 完了: クラス骨格作成成功');
```

---

### Step 2: buildContext メソッドの実装（15分）⚠️ 簡略化

#### 2.1 メソッド定義

**重要**: `buildStudentState` メソッドは**存在しません**。実装では `sessionStats` をそのまま使用します。

**参照**: [QUESTION_SCHEDULER_SPEC.md - Section 4.1](../specifications/QUESTION_SCHEDULER_SPEC.md#41-buildcontext)

```typescript
private buildContext(params: ScheduleParams): ScheduleContext {
  logger.debug('[QuestionScheduler] コンテキスト構築中');

  // ⚠️ buildStudentState() は呼ばない！
  // sessionStats をそのまま使用
  return {
    availableQuestions: params.availableQuestions,
    recentAnswers: params.recentAnswers,
    sessionStats: params.sessionStats || {
      correct: 0,
      incorrect: 0,
      still_learning: 0,
      consecutiveCorrect: 0,
      duration: 0,
    },
    timeOfDay: params.timeOfDay || 'afternoon',
    cognitiveLoad: params.cognitiveLoad || 0.5,  // デフォルト0.5（中負荷）
    hybridMode: params.hybridMode || false,
    mode: params.mode || 'memorization',
  };
}
```

#### 2.2 SessionStats の取得方法（参考）

**注意**: `sessionStats` は呼び出し元が用意します。QuestionScheduler内では計算しません。

```typescript
// 呼び出し側（例: MemorizationTab.tsx）
const sessionStats = {
  correct: correctAnswersToday,
  incorrect: incorrectAnswersToday,
  still_learning: stillLearningToday,
  consecutiveCorrect: consecutiveCorrectCount,
  duration: Date.now() - sessionStartTime,
};

const result = await scheduler.schedule({
  availableQuestions: questions,
  recentAnswers: getRecentAnswers(),
  sessionStats,  // ← 外部から渡す
  useMetaAI: true,
});
```

**検証**:
```typescript
const context = scheduler['buildContext']({
  availableQuestions: [],
  recentAnswers: [],
  sessionStats: {
    correct: 5,
    incorrect: 2,
    still_learning: 3,
    consecutiveCorrect: 2,
    duration: 600000,  // 10分
  },
});

console.log('✅ Step 2 完了:', context);
// 期待値: { sessionStats: { correct: 5, incorrect: 2, ... }, ... }
```

---

### Step 3: detectSignals メソッドの実装（1時間）

#### 3.1 メソッド定義

**参照**: [QUESTION_SCHEDULER_SPEC.md - Section 5.1](../specifications/QUESTION_SCHEDULER_SPEC.md#51-シグナル検出アルゴリズム)

⚠️ **重要**: 戻り値は `DetectedSignal[]` であり、`LearningSignal[]` ではありません。

```typescript
private detectSignals(context: ScheduleContext): DetectedSignal[] {
  const signals: DetectedSignal[] = [];
  const { studentState } = context;

  const stats = context.sessionStats;
  const totalAttempts = stats.correct + stats.incorrect + stats.still_learning;
  const errorRate = totalAttempts > 0 ? stats.incorrect / totalAttempts : 0;
  const sessionMinutes = (stats.duration || 0) / 60000;

  logger.debug('[QuestionScheduler] シグナル検出中', { stats, errorRate, sessionMinutes });

  // 1. 疲労シグナル（20分以上連続学習 OR 認知負荷0.7以上）
  if (sessionMinutes > 20 || context.cognitiveLoad > 0.7) {
    const confidence = Math.min((sessionMinutes / 30) * 0.5 + context.cognitiveLoad * 0.5, 1);
    signals.push({
      type: 'fatigue',
      confidence,
      action: 'easier',
    });
    logger.warn('[シグナル] 疲労検出', {
      sessionMinutes: sessionMinutes.toFixed(1),
      cognitiveLoad: context.cognitiveLoad,
      confidence: `${(confidence * 100).toFixed(0)}%`,
      reference: 'Ariga & Lleras (2011) - 注意力の限界',
    });
  }

  // 2. 苦戦シグナル（誤答率40%以上）
  if (errorRate > 0.4 && totalAttempts >= 5) {
    const confidence = Math.min(errorRate, 0.9);
    signals.push({
      type: 'struggling',
      confidence,
      action: 'review',
    });
    logger.warn('[シグナル] 苦戦検出', {
      errorRate: `${(errorRate * 100).toFixed(0)}%`,
      confidence: `${(confidence * 100).toFixed(0)}%`,
      threshold: '40%',
      reference: 'Sweller (1988) - 認知負荷理論',
    });
  }

  // 3. 過学習シグナル（連続正解10回以上）
  const consecutiveCorrect = stats.consecutiveCorrect || 0;
  if (consecutiveCorrect > 10) {
    const confidence = Math.min(consecutiveCorrect / 15, 0.9);
    signals.push({
      type: 'overlearning',
      confidence,
      action: 'harder',
    });
    logger.info('[シグナル] 過学習検出', {
      consecutiveCorrect,
      confidence: `${(confidence * 100).toFixed(0)}%`,
      threshold: 10,
      reference: 'Vygotsky (1978) - 最近接発達領域（ZPD）',
    });
  }

  // 4. 最適状態（誤答率20-35% かつ 連続正解8回未満）
  if (errorRate >= 0.2 && errorRate <= 0.35 && consecutiveCorrect < 8) {
    signals.push({
      type: 'optimal',
      confidence: 0.8,
      action: 'continue',
    });
    logger.info('[シグナル] 最適学習状態検出');
  }

  // シグナルがない場合は通常モード
  if (signals.length === 0) {
    logger.debug('[シグナル] シグナル検出なし - 通常モード');
  }

  return signals;
}
```

**検証**:
```typescript
const context: ScheduleContext = {
  availableQuestions: [],
  recentAnswers: [],
  sessionStats: {
    correct: 5,
    incorrect: 10,  // 誤答率 66% → 苦戦シグナル発動
    still_learning: 0,
    consecutiveCorrect: 0,
    duration: 1500000,  // 25分 → 疲労シグナル発動
  },
  timeOfDay: 'afternoon',
  cognitiveLoad: 0.5,
  hybridMode: false,
  mode: 'memorization',
};

const signals = scheduler['detectSignals'](context);
console.log('✅ Step 3 完了:', signals);
// 期待値: [
//   { type: 'fatigue', confidence: 0.67, action: 'easier' },
//   { type: 'struggling', confidence: 0.66, action: 'review' }
// ]
```

---

### Step 4: calculatePriorities メソッドの実装（1.5時間）

#### 4.1 メソッド定義

**参照**: [QUESTION_SCHEDULER_SPEC.md - Section 5.2](../specifications/QUESTION_SCHEDULER_SPEC.md#52-優先度計算アルゴリズム)

```typescript
private calculatePriorities(
  questions: Question[],
  context: ScheduleContext,
  signals: DetectedSignal[],  // ⚠️ LearningSignal[] ではなく DetectedSignal[]
  hybridMode = false
): PrioritizedQuestion[] {
  logger.debug('[QuestionScheduler] 優先度計算開始', {
    questionCount: questions.length,
    signals,
  });

  return questions.map((question, index) => {
    const status = this.getWordStatus(question.word, context.mode);  // ⚠️ 2つの引数
    
    // Step 1: 基本優先度
    let priority = this.getBasePriority(status);

    // Step 2: DTA（Dynamic Time-based Adjustment）
    priority += this.calculateDTA(status);

    // Step 3: シグナル反映（将来実装予定）
    priority = this.applySignals(priority, signals, status);

    // Step 4: タイムブースト
    priority = this.applyTimeBoost(priority, status);

    return {
      question,
      priority,
      status,
      signals,
      originalIndex: index,
    };
  });
}
```

#### 4.2 getBasePriority メソッド

```typescript
private getBasePriority(status: WordStatus | null): number {
  if (!status || !status.category) {
    return 50;  // 新出単語
  }

  switch (status.category) {
    case 'incorrect':
      return 100;  // 不正解（最優先）
    case 'still_learning':
      return 75;   // 学習中
    case 'new':
      return 50;   // 新出単語
    case 'mastered':
      return 10;   // 習得済み（低優先度）
    default:
      return 50;
  }
}
```

#### 4.3 calculateDTA メソッド

```typescript
private calculateDTA(status: WordStatus | null): number {
  if (!status || !status.lastReviewedAt) {
    return 0;  // 学習履歴なし
  }

  const forgettingRisk = this.calculateForgettingRisk(status);

  // 忘却リスクに応じた追加優先度
  if (forgettingRisk >= 70) {
    return 40;  // 高リスク
  } else if (forgettingRisk >= 30) {
    return 20;  // 中リスク
  } else {
    return 5;   // 低リスク
  }
}
```

#### 4.4 calculateForgettingRisk メソッド

```typescript
private calculateForgettingRisk(status: WordStatus): number {
  const now = Date.now();
  const daysSinceLast = (now - (status.lastReviewedAt || now)) / 86400000;

  // 正解率に基づく復習間隔の計算
  const accuracy = status.correctCount / (status.reviewCount || 1);
  const reviewInterval = accuracy >= 0.8 ? 7 : accuracy >= 0.5 ? 3 : 1;

  // 忘却リスク = 経過日数 / 復習間隔 * 100
  let risk = (daysSinceLast / reviewInterval) * 100;

  // 正解率による調整
  if (accuracy < 0.5) {
    risk *= 1.5;  // 低正解率は忘却リスクが高い
  }

  return Math.min(risk, 100);  // 最大100%
}
```

#### 4.5 applySignals メソッド（将来実装）

```typescript
private applySignals(
  priority: number,
  signals: LearningSignal[],
  status: WordStatus | null
): number {
  // 現時点では実装なし（将来拡張予定）
  // 疲労シグナル: -20%, 苦戦シグナル: -30%, 過学習: -15%
  return priority;
}
```

#### 4.6 applyTimeBoost メソッド

```typescript
private applyTimeBoost(priority: number, status: WordStatus | null): number {
  if (!status || !status.lastReviewedAt) {
    return priority;
  }

  const daysSinceLast = (Date.now() - status.lastReviewedAt) / 86400000;

  // 7日以上経過: +20%
  if (daysSinceLast >= 7) {
    return priority * 1.2;
  }
  // 3日以上経過: +10%
  else if (daysSinceLast >= 3) {
    return priority * 1.1;
  }

  return priority;
}
```

#### 4.7 getWordStatus メソッド

⚠️ **重要**: 引数は `(word: string, mode?: string)` であり、`(question: Question)` ではありません。

```typescript
private getWordStatus(word: string, mode?: string): WordStatus | null {
  try {
    const progressKey = 'english-progress';
    const progressData = localStorage.getItem(progressKey);
    
    if (!progressData) {
      return null;
    }

    const allProgress = JSON.parse(progressData);
    const wordProgress = allProgress[word];  // ← question.word ではなく word

    if (!wordProgress) {
      return null;
    }

    // カテゴリーの推測
    let category = question.category || wordProgress.category;
    if (!category) {
      const totalAttempts = (wordProgress.correctCount || 0) + (wordProgress.incorrectCount || 0);
      const consecutiveIncorrect = wordProgress.consecutiveIncorrect || 0;

      if (totalAttempts === 0) {
        category = 'new';
      } else if (consecutiveIncorrect >= 2) {
        category = 'incorrect';
      } else if (wordProgress.incorrectCount && wordProgress.incorrectCount > 0) {
        category = 'still_learning';
      } else if (wordProgress.masteryLevel === 'mastered') {
        category = 'mastered';
      } else {
        category = 'still_learning';
      }
    }

    return {
      category,
      lastReviewedAt: wordProgress.lastReviewedAt || null,
      reviewCount: wordProgress.reviewCount || 0,
      correctCount: wordProgress.correctCount || 0,
      incorrectCount: wordProgress.incorrectCount || 0,
      consecutiveCorrect: wordProgress.consecutiveCorrect || 0,
      consecutiveIncorrect: wordProgress.consecutiveIncorrect || 0,
      masteryLevel: wordProgress.masteryLevel,
    };
  } catch (error) {
    logger.error('[QuestionScheduler] localStorage読み取りエラー', error);
    return null;
  }
}
```

**検証**:
```typescript
const questions: Question[] = [
  { id: 'q1', word: 'apple', meaning: 'りんご', category: 'incorrect' },
  { id: 'q2', word: 'banana', meaning: 'バナナ', category: 'new' },
];

const prioritized = scheduler['calculatePriorities'](questions, context, signals);
console.log('✅ Step 4 完了:', prioritized);
// 期待値: apple=100, banana=50
```

---

### Step 5: sortAndBalance メソッドの実装（1.5時間）

#### 5.1 メソッド定義

**参照**: [QUESTION_SCHEDULER_SPEC.md - Section 5.4](../specifications/QUESTION_SCHEDULER_SPEC.md#54-確実性保証メカニズム)

```typescript
private sortAndBalance(prioritized: PrioritizedQuestion[]): PrioritizedQuestion[] {
  logger.debug('[QuestionScheduler] ソート・バランス調整開始');

  // Step 1: カテゴリー別グループ化
  const incorrectQuestions = prioritized.filter(pq =>
    pq.status?.category === 'incorrect'
  );
  const stillLearningQuestions = prioritized.filter(pq =>
    pq.status?.category === 'still_learning'
  );
  const otherQuestions = prioritized.filter(pq =>
    pq.status?.category !== 'incorrect' &&
    pq.status?.category !== 'still_learning'
  );

  // Step 2: 各グループ内で優先度ソート
  const sortByPriority = (a: PrioritizedQuestion, b: PrioritizedQuestion) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority;  // 降順
    }

    // ABC順防止: 新出単語はランダムソート
    const aIsNew = !a.status?.category || a.status?.category === 'new';
    const bIsNew = !b.status?.category || b.status?.category === 'new';

    if (aIsNew && bIsNew) {
      return Math.random() - 0.5;
    }

    return (a.originalIndex || 0) - (b.originalIndex || 0);
  };

  incorrectQuestions.sort(sortByPriority);
  stillLearningQuestions.sort(sortByPriority);
  otherQuestions.sort(sortByPriority);

  // Step 3: 強制カテゴリー優先結合
  const sorted = [
    ...incorrectQuestions,
    ...stillLearningQuestions,
    ...otherQuestions,
  ];

  // Step 4: 上位20%保証監視
  const reviewNeeded = incorrectQuestions.length + stillLearningQuestions.length;
  const totalQuestions = sorted.length;
  const top20PercentCount = Math.ceil(totalQuestions * 0.2);

  if (reviewNeeded > 0 && reviewNeeded > top20PercentCount) {
    logger.warn('[QuestionScheduler] 復習単語が多すぎます', {
      reviewNeeded,
      top20Percent: top20PercentCount,
      ratio: `${((reviewNeeded / totalQuestions) * 100).toFixed(0)}%`,
    });
  } else if (reviewNeeded > 0) {
    const guaranteedTop = sorted.slice(0, top20PercentCount);
    const reviewInTop = guaranteedTop.filter(pq =>
      pq.status?.category === 'incorrect' ||
      pq.status?.category === 'still_learning'
    ).length;

    if (reviewInTop < reviewNeeded) {
      logger.warn('[QuestionScheduler] 上位20%に復習単語が不足', {
        expected: reviewNeeded,
        actual: reviewInTop,
      });
    }
  }

  // Step 5: デバッグログ出力
  console.log('✅✅✅ [QuestionScheduler] 優先単語配置完了', {
    incorrectCount: incorrectQuestions.length,
    stillLearningCount: stillLearningQuestions.length,
    otherCount: otherQuestions.length,
    top10: sorted.slice(0, 10).map(pq =>
      `${pq.question.word}(${pq.status?.category || 'unknown'}/${pq.priority.toFixed(1)})`
    ),
  });

  return sorted;
}
```

**検証**:
```typescript
const sorted = scheduler['sortAndBalance'](prioritized);
console.log('✅ Step 5 完了:', sorted.slice(0, 5).map(pq => pq.question.word));
// 期待値: incorrectの単語が最初に来る
```

---

### Step 6: schedule メソッドの完成（1時間）

#### 6.1 完全な実装

```typescript
public async schedule(params: ScheduleParams): Promise<ScheduleResult> {
  const startTime = Date.now();

  logger.info('[QuestionScheduler] スケジューリング開始', {
    questionCount: params.availableQuestions.length,
    useMetaAI: params.useMetaAI,
  });

  // Step 1: コンテキスト構築
  const context = this.buildContext(params);

  // Step 2: シグナル検出
  const signals = this.detectSignals(context);

  // Step 3: 優先度計算
  const prioritized = this.calculatePriorities(
    params.availableQuestions,
    context,
    signals
  );

  // Step 4: ソート・バランス調整
  const sorted = this.sortAndBalance(prioritized);

  // Step 5: 振動防止フィルター適用
  const filtered = this.vibrationFilter.filter(sorted, params.recentAnswers);

  // Step 6: 結果構築
  const scheduledQuestions = filtered.map(pq => pq.question);
  const vibrationScore = this.vibrationFilter.calculateVibrationScore(
    filtered,
    params.recentAnswers
  );

  const elapsedTime = Date.now() - startTime;

  logger.info('[QuestionScheduler] スケジューリング完了', {
    totalCandidates: params.availableQuestions.length,
    scheduledCount: scheduledQuestions.length,
    vibrationScore,
    elapsedTime: `${elapsedTime}ms`,
  });

  return {
    scheduledQuestions,
    vibrationScore,
    metadata: {
      totalCandidates: params.availableQuestions.length,
      filteredCount: prioritized.length - filtered.length,
      signalCounts: this.countSignals(signals),
      avgPriority: this.calculateAvgPriority(filtered),
    },
  };
}
```

#### 6.2 補助メソッド

```typescript
private countSignals(signals: LearningSignal[]): Record<LearningSignal, number> {
  return {
    fatigue: signals.filter(s => s === 'fatigue').length,
    struggling: signals.filter(s => s === 'struggling').length,
    overlearning: signals.filter(s => s === 'overlearning').length,
    optimal: signals.filter(s => s === 'optimal').length,
  };
}

private calculateAvgPriority(questions: PrioritizedQuestion[]): number {
  if (questions.length === 0) return 0;
  const sum = questions.reduce((acc, pq) => acc + pq.priority, 0);
  return sum / questions.length;
}
```

**検証**:
```typescript
const result = await scheduler.schedule({
  availableQuestions: [
    { id: 'q1', word: 'apple', meaning: 'りんご', category: 'incorrect' },
    { id: 'q2', word: 'banana', meaning: 'バナナ', category: 'new' },
  ],
  recentAnswers: [],
  useMetaAI: true,
});

console.log('✅ Step 6 完了:', result);
// 期待値: { scheduledQuestions: [apple, banana], vibrationScore: 0 }
```

---

### Step 7: 統合テストの実行（1時間）

#### 7.1 テストケースの作成

```bash
# テストファイル作成
touch tests/ai/scheduler/QuestionScheduler.test.ts
```

```typescript
// tests/ai/scheduler/QuestionScheduler.test.ts
import { describe, it, expect } from 'vitest';
import { QuestionScheduler } from '@/ai/scheduler/QuestionScheduler';
import type { ScheduleParams } from '@/ai/scheduler/types';

describe('QuestionScheduler', () => {
  const scheduler = new QuestionScheduler();

  it('incorrectな単語が最優先で出題される', async () => {
    const params: ScheduleParams = {
      availableQuestions: [
        { id: 'q1', word: 'apple', meaning: 'りんご', category: 'incorrect' },
        { id: 'q2', word: 'banana', meaning: 'バナナ', category: 'new' },
        { id: 'q3', word: 'cat', meaning: '猫', category: 'mastered' },
      ],
      recentAnswers: [],
      useMetaAI: true,
    };

    const result = await scheduler.schedule(params);

    expect(result.scheduledQuestions[0].word).toBe('apple');
    expect(result.scheduledQuestions.length).toBe(3);
  });

  it('振動防止フィルターが機能する', async () => {
    const now = Date.now();
    const params: ScheduleParams = {
      availableQuestions: [
        { id: 'q1', word: 'apple', meaning: 'りんご' },
      ],
      recentAnswers: [
        {
          questionId: 'q1',
          isCorrect: true,
          answeredAt: now - 30000,  // 30秒前に正解
        },
      ],
      useMetaAI: true,
    };

    const result = await scheduler.schedule(params);

    // 1分以内に正解した問題は除外される
    expect(result.scheduledQuestions.length).toBe(0);
  });

  it('シグナル検出が正しく動作する', async () => {
    // 疲労シグナルのテスト
    const params: ScheduleParams = {
      availableQuestions: [
        { id: 'q1', word: 'apple', meaning: 'りんご' },
      ],
      recentAnswers: [
        { questionId: 'q1', isCorrect: true, answeredAt: Date.now() - 1200000 },  // 20分前
      ],
      useMetaAI: true,
    };

    const result = await scheduler.schedule(params);

    // メタデータにfatigueシグナルが記録される
    expect(result.metadata?.signalCounts.fatigue).toBeGreaterThan(0);
  });
});
```

#### 7.2 テスト実行

```bash
# テスト実行
npm run test -- tests/ai/scheduler/QuestionScheduler.test.ts

# カバレッジ確認
npm run test:coverage -- tests/ai/scheduler/QuestionScheduler.test.ts
```

**期待結果**:
```
✓ incorrectな単語が最優先で出題される
✓ 振動防止フィルターが機能する
✓ シグナル検出が正しく動作する

Test Files  1 passed (1)
     Tests  3 passed (3)
```

---

### Step 8: 本番環境での検証（1.5時間）

#### 8.1 開発環境での動作確認

```bash
# 開発サーバー起動
npm run dev
```

ブラウザで以下を確認:

1. **暗記タブ**: 復習単語が上位に表示されるか
2. **翻訳タブ**: incorrect単語が最初に出題されるか
3. **スペルタブ**: 振動防止が動作しているか（連続正解後に除外されるか）
4. **文法タブ**: カテゴリー別にソートされているか

#### 8.2 ログ確認

```typescript
// ブラウザのコンソールで以下を確認
localStorage.setItem('debug-scheduler', 'true');

// 期待されるログ:
// ✅✅✅ [QuestionScheduler] 優先単語配置完了
// incorrectCount: 5
// stillLearningCount: 10
// otherCount: 35
```

#### 8.3 性能測定

```typescript
// 1000問のスケジューリングにかかる時間を測定
const startTime = performance.now();
const result = await scheduler.schedule({
  availableQuestions: Array(1000).fill(null).map((_, i) => ({
    id: `q${i}`,
    word: `word${i}`,
    meaning: `意味${i}`,
  })),
  recentAnswers: [],
  useMetaAI: true,
});
const elapsedTime = performance.now() - startTime;

console.log(`スケジューリング時間: ${elapsedTime.toFixed(2)}ms`);
// 期待値: 10-50ms（1000問の場合）
```

**合格基準**:
- ✅ 1000問のスケジューリングが50ms以内
- ✅ incorrect単語が必ず上位20%に含まれる
- ✅ 振動スコアが30以下
- ✅ TypeScriptエラーなし

---

## ✅ 復旧完了チェックリスト

### 機能確認

- [ ] QuestionScheduler.tsがコンパイルエラーなし
- [ ] 全テストがパス
- [ ] 暗記タブで復習単語が上位に表示される
- [ ] 翻訳タブでincorrect単語が最初に出題される
- [ ] スペルタブで振動防止が動作している
- [ ] 文法タブでカテゴリー別ソートが機能している

### 性能確認

- [ ] 1000問のスケジューリングが50ms以内
- [ ] 振動スコアが30以下
- [ ] メモリリークなし（長時間使用でも問題なし）

### ログ確認

- [ ] コンソールに「✅✅✅ [QuestionScheduler] 優先単語配置完了」が表示される
- [ ] incorrectCount、stillLearningCount、otherCountが正しい
- [ ] top10に復習単語が含まれている

---

## 🐛 トラブルシューティング

### 問題1: TypeScriptのコンパイルエラー

**症状**:
```
error TS2307: Cannot find module './types' or its corresponding type declarations.
```

**原因**: types.tsが存在しない、またはパスが間違っている

**対策**:
```bash
# types.tsの存在確認
ls -la src/ai/scheduler/types.ts

# パス修正
import type { ... } from './types';  # ✅ 正しい
import type { ... } from '../types'; # ❌ 間違い
```

---

### 問題2: 復習単語が上位に来ない

**症状**: 新出単語ばかりが出題される

**原因**: getWordStatus()がnullを返している

**対策**:
```typescript
// localStorage の内容を確認
console.log(localStorage.getItem('english-progress'));

// WordStatusがnullの場合はカテゴリーを推測
if (!status) {
  logger.warn('[QuestionScheduler] WordStatusがnull', { word: question.word });
  // カテゴリー推測ロジックを追加
}
```

---

### 問題3: 振動防止で全て除外される

**症状**: scheduledQuestions が空配列

**原因**: recentAnswers に全ての問題が含まれている

**対策**:
```typescript
// recentAnswers の内容を確認
console.log('recentAnswers:', params.recentAnswers.length);

// minIntervalを調整（60000ms → 30000ms）
const minInterval = 30000;  // 30秒に短縮
```

---

### 問題4: 性能が遅い（100ms以上）

**原因**: localStorage の読み取りが多すぎる

**対策**:
```typescript
// キャッシュを導入
private wordStatusCache = new Map<string, WordStatus | null>();

private getWordStatus(question: Question): WordStatus | null {
  if (this.wordStatusCache.has(question.word)) {
    return this.wordStatusCache.get(question.word)!;
  }

  const status = this.fetchWordStatusFromStorage(question);
  this.wordStatusCache.set(question.word, status);
  return status;
}
```

---

## 📚 関連ドキュメント

- [QuestionScheduler 完全仕様書](../specifications/QUESTION_SCHEDULER_SPEC.md)
- [型定義リファレンス](../references/QUESTION_SCHEDULER_TYPES.md)
- [メタAI統合ガイド](../guidelines/META_AI_INTEGRATION_GUIDE.md)
- [トラブルシューティングガイド](../guidelines/META_AI_TROUBLESHOOTING.md)

---

## 🔄 復旧後の改善提案

### 1. 自動バックアップの設定

```bash
# .githooks/pre-commit に追加
cp src/ai/scheduler/QuestionScheduler.ts .backup/QuestionScheduler.ts.$(date +%Y%m%d-%H%M%S)
```

### 2. CI/CDでの自動テスト

```yaml
# .github/workflows/test.yml
- name: Test QuestionScheduler
  run: npm run test -- tests/ai/scheduler/QuestionScheduler.test.ts
```

### 3. ドキュメントの定期更新

```bash
# 月1回、実装とドキュメントの乖離をチェック
npm run check-docs-sync
```

---

## 変更履歴

| 日付 | 変更内容 |
|------|---------|
| 2025-12-19 | 初版作成（Phase 1.3完了） |
