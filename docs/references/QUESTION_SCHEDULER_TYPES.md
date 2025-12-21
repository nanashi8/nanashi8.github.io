# QuestionScheduler 型定義リファレンス

**カテゴリー**: Reference（リファレンス）  
**対象者**: 実装者、TypeScript開発者  
**最終更新**: 2025年12月19日

---

## 📋 概要

このドキュメントは、QuestionSchedulerで使用される全11個のインターフェース定義と検証ルールを提供します。

**実装ファイル**: `src/ai/scheduler/types.ts`

---

## 目次

1. [ScheduleParams](#1-scheduleparams) - スケジューリング入力パラメータ
2. [ScheduleContext](#2-schedulecontext) - 内部コンテキスト
3. [Question](#3-question) - 問題オブジェクト
4. [WordStatus](#4-wordstatus) - 単語学習状態
5. [PrioritizedQuestion](#5-prioritizedquestion) - 優先度付き問題
6. [ScheduleResult](#6-scheduleresult) - スケジューリング結果
7. [LearningSignal](#7-learningsignal) - 学習シグナル
8. [StudentState](#8-studentstate) - 生徒状態
9. [RecentAnswer](#9-recentanswer) - 直近回答履歴
10. [CognitiveLoadLevel](#10-cognitiveloadlevel) - 認知負荷レベル
11. [TimeOfDay](#11-timeofday) - 時間帯

---

## 1. ScheduleParams

### 定義

```typescript
interface ScheduleParams {
  availableQuestions: Question[];
  recentAnswers: RecentAnswer[];
  useMetaAI?: boolean;
  hybridMode?: boolean;
  timeOfDay?: TimeOfDay;
  cognitiveLoad?: CognitiveLoadLevel;
  maxQuestions?: number;
}
```

### フィールド詳細

| フィールド | 型 | 必須 | デフォルト | 説明 |
|----------|-----|------|-----------|------|
| `availableQuestions` | `Question[]` | ✅ | - | 出題可能な問題リスト |
| `recentAnswers` | `RecentAnswer[]` | ✅ | - | 直近の回答履歴（振動防止用） |
| `useMetaAI` | `boolean` | - | `false` | QuestionSchedulerを使用するか |
| `hybridMode` | `boolean` | - | `false` | 旧システムとの併用モード |
| `timeOfDay` | `TimeOfDay` | - | `'afternoon'` | 現在の時間帯 |
| `cognitiveLoad` | `CognitiveLoadLevel` | - | `'medium'` | 認知負荷レベル |
| `maxQuestions` | `number` | - | `undefined` | 最大出題数（制限なしの場合はundefined） |

### 使用例

#### 基本的な使用
```typescript
const params: ScheduleParams = {
  availableQuestions: allQuestions,
  recentAnswers: getRecentAnswers(),
  useMetaAI: true,
};

const result = await scheduler.schedule(params);
```

#### 詳細設定
```typescript
const params: ScheduleParams = {
  availableQuestions: grammarQuestions,
  recentAnswers: getRecentAnswers(),
  useMetaAI: true,
  hybridMode: false,
  timeOfDay: 'evening',      // 夕方（疲労が蓄積している時間帯）
  cognitiveLoad: 'high',     // 高負荷状態
  maxQuestions: 20,          // 最大20問まで
};
```

#### 旧システム互換モード
```typescript
const params: ScheduleParams = {
  availableQuestions: allQuestions,
  recentAnswers: [],
  useMetaAI: false,  // QuestionSchedulerを無効化
  hybridMode: true,  // 旧ロジックとの併用
};
```

### 検証ルール

```typescript
function validateScheduleParams(params: ScheduleParams): string[] {
  const errors: string[] = [];

  // 必須フィールド
  if (!params.availableQuestions) {
    errors.push('availableQuestions は必須です');
  }
  if (!params.recentAnswers) {
    errors.push('recentAnswers は必須です');
  }

  // 配列の検証
  if (params.availableQuestions && !Array.isArray(params.availableQuestions)) {
    errors.push('availableQuestions は配列である必要があります');
  }
  if (params.availableQuestions && params.availableQuestions.length === 0) {
    errors.push('availableQuestions は空配列にできません（最低1問必要）');
  }

  // maxQuestions の範囲チェック
  if (params.maxQuestions !== undefined) {
    if (params.maxQuestions < 1) {
      errors.push('maxQuestions は1以上である必要があります');
    }
    if (params.maxQuestions > 1000) {
      errors.push('maxQuestions は1000以下である必要があります（パフォーマンス制約）');
    }
  }

  // useMetaAI と hybridMode の組み合わせチェック
  if (params.useMetaAI === true && params.hybridMode === true) {
    errors.push('useMetaAI と hybridMode は同時に true にできません');
  }

  return errors;
}
```

---

## 2. ScheduleContext

### 定義

```typescript
interface ScheduleContext {
  availableQuestions: Question[];
  recentAnswers: RecentAnswer[];
  studentState: StudentState;
  timeOfDay: TimeOfDay;
  cognitiveLoad: CognitiveLoadLevel;
  hybridMode: boolean;
}
```

### フィールド詳細

| フィールド | 型 | 必須 | 説明 |
|----------|-----|------|------|
| `availableQuestions` | `Question[]` | ✅ | 出題可能な問題リスト |
| `recentAnswers` | `RecentAnswer[]` | ✅ | 直近の回答履歴 |
| `studentState` | `StudentState` | ✅ | 生徒の現在の学習状態 |
| `timeOfDay` | `TimeOfDay` | ✅ | 現在の時間帯 |
| `cognitiveLoad` | `CognitiveLoadLevel` | ✅ | 認知負荷レベル |
| `hybridMode` | `boolean` | ✅ | 旧システムとの併用モード |

### 用途

ScheduleContextは **内部使用のみ**。ScheduleParamsから構築されます。

```typescript
private buildContext(params: ScheduleParams): ScheduleContext {
  return {
    availableQuestions: params.availableQuestions,
    recentAnswers: params.recentAnswers,
    studentState: this.buildStudentState(params),
    timeOfDay: params.timeOfDay || 'afternoon',
    cognitiveLoad: params.cognitiveLoad || 'medium',
    hybridMode: params.hybridMode || false,
  };
}
```

### 使用例

```typescript
// ❌ ユーザーはScheduleContextを直接作成しない
// ✅ ScheduleParamsを渡すとQuestionSchedulerが自動生成

const params: ScheduleParams = { /* ... */ };
const result = await scheduler.schedule(params);  // 内部でContextに変換
```

---

## 3. Question

### 定義

```typescript
interface Question {
  id: string;
  word: string;
  meaning: string;
  type?: 'memorization' | 'translation' | 'spelling' | 'grammar';
  category?: 'incorrect' | 'still_learning' | 'new' | 'mastered';
  difficulty?: number;
  [key: string]: any;
}
```

### フィールド詳細

| フィールド | 型 | 必須 | 説明 |
|----------|-----|------|------|
| `id` | `string` | ✅ | 問題の一意識別子（例: `"memorize_apple_123"`） |
| `word` | `string` | ✅ | 英単語（例: `"apple"`） |
| `meaning` | `string` | ✅ | 日本語訳（例: `"りんご"`） |
| `type` | `string` | - | 問題タイプ（4種類のタブに対応） |
| `category` | `string` | - | 学習カテゴリー（4段階） |
| `difficulty` | `number` | - | 難易度（1-10、未使用の場合あり） |

### 使用例

#### 基本的な問題
```typescript
const question: Question = {
  id: 'memorize_apple_001',
  word: 'apple',
  meaning: 'りんご',
  type: 'memorization',
};
```

#### 完全な問題（全フィールド）
```typescript
const question: Question = {
  id: 'grammar_passive_voice_042',
  word: 'was eaten',
  meaning: '食べられた（受動態）',
  type: 'grammar',
  category: 'still_learning',
  difficulty: 7,
  grammarPoint: 'passive_voice',
  exampleSentence: 'The apple was eaten by Tom.',
};
```

### 検証ルール

```typescript
function validateQuestion(q: Question): string[] {
  const errors: string[] = [];

  // 必須フィールド
  if (!q.id) errors.push('id は必須です');
  if (!q.word) errors.push('word は必須です');
  if (!q.meaning) errors.push('meaning は必須です');

  // type の検証
  if (q.type && !['memorization', 'translation', 'spelling', 'grammar'].includes(q.type)) {
    errors.push(`type は 'memorization' | 'translation' | 'spelling' | 'grammar' のいずれかである必要があります: ${q.type}`);
  }

  // category の検証
  if (q.category && !['incorrect', 'still_learning', 'new', 'mastered'].includes(q.category)) {
    errors.push(`category は 'incorrect' | 'still_learning' | 'new' | 'mastered' のいずれかである必要があります: ${q.category}`);
  }

  // difficulty の範囲チェック
  if (q.difficulty !== undefined) {
    if (q.difficulty < 1 || q.difficulty > 10) {
      errors.push(`difficulty は 1-10 の範囲である必要があります: ${q.difficulty}`);
    }
  }

  return errors;
}
```

---

## 4. WordStatus

### 定義

```typescript
interface WordStatus {
  category: 'incorrect' | 'still_learning' | 'new' | 'mastered' | null;
  lastReviewedAt: number | null;
  reviewCount: number;
  correctCount: number;
  incorrectCount: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  masteryLevel?: 'beginner' | 'intermediate' | 'advanced' | 'mastered';
}
```

### フィールド詳細

| フィールド | 型 | 必須 | 説明 |
|----------|-----|------|------|
| `category` | `string \| null` | ✅ | 学習カテゴリー（4段階 + null） |
| `lastReviewedAt` | `number \| null` | ✅ | 最終復習日時（Unix timestamp ms） |
| `reviewCount` | `number` | ✅ | 復習回数 |
| `correctCount` | `number` | ✅ | 正解回数 |
| `incorrectCount` | `number` | ✅ | 不正解回数 |
| `consecutiveCorrect` | `number` | ✅ | 連続正解回数 |
| `consecutiveIncorrect` | `number` | ✅ | 連続不正解回数 |
| `masteryLevel` | `string` | - | 習熟度レベル（4段階） |

### カテゴリーの判定基準

| Category | 条件 | 説明 |
|----------|------|------|
| `null` | `reviewCount === 0` | 学習履歴なし（初見） |
| `'new'` | `reviewCount > 0` かつ `incorrectCount === 0` | 学習開始済み、未だに不正解なし |
| `'incorrect'` | `consecutiveIncorrect >= 2` | 2回連続で不正解 |
| `'still_learning'` | `incorrectCount > 0` かつ 上記以外 | 学習中（不正解経験あり） |
| `'mastered'` | `consecutiveCorrect >= 10` かつ `masteryLevel === 'mastered'` | 習得済み |

### 使用例

#### 初見の単語
```typescript
const status: WordStatus = {
  category: null,
  lastReviewedAt: null,
  reviewCount: 0,
  correctCount: 0,
  incorrectCount: 0,
  consecutiveCorrect: 0,
  consecutiveIncorrect: 0,
};
```

#### 学習中の単語（不正解が多い）
```typescript
const status: WordStatus = {
  category: 'still_learning',
  lastReviewedAt: Date.now() - 86400000,  // 1日前
  reviewCount: 5,
  correctCount: 2,
  incorrectCount: 3,
  consecutiveCorrect: 0,
  consecutiveIncorrect: 2,
  masteryLevel: 'beginner',
};
```

#### 習得済みの単語
```typescript
const status: WordStatus = {
  category: 'mastered',
  lastReviewedAt: Date.now() - 604800000,  // 7日前
  reviewCount: 15,
  correctCount: 14,
  incorrectCount: 1,
  consecutiveCorrect: 10,
  consecutiveIncorrect: 0,
  masteryLevel: 'mastered',
};
```

---

## 5. PrioritizedQuestion

### 定義

```typescript
interface PrioritizedQuestion {
  question: Question;
  priority: number;
  status: WordStatus | null;
  signals: LearningSignal[];
  originalIndex?: number;
}
```

### フィールド詳細

| フィールド | 型 | 必須 | 説明 |
|----------|-----|------|------|
| `question` | `Question` | ✅ | 元の問題オブジェクト |
| `priority` | `number` | ✅ | 計算された優先度（0-200） |
| `status` | `WordStatus \| null` | ✅ | 学習状態（nullは初見） |
| `signals` | `LearningSignal[]` | ✅ | 検出されたシグナルリスト |
| `originalIndex` | `number` | - | 元の配列内でのインデックス |

### 優先度の範囲

| Priority範囲 | カテゴリー | 説明 |
|------------|----------|------|
| 100-200 | `incorrect` | 不正解単語（最優先） |
| 75-150 | `still_learning` | 学習中単語 |
| 50-100 | `new` | 新出単語 |
| 10-50 | `mastered` | 習得済み単語（低優先度） |

### 使用例

```typescript
const prioritized: PrioritizedQuestion = {
  question: {
    id: 'memorize_apple_001',
    word: 'apple',
    meaning: 'りんご',
    type: 'memorization',
  },
  priority: 120.5,
  status: {
    category: 'incorrect',
    lastReviewedAt: Date.now() - 86400000,
    reviewCount: 5,
    correctCount: 2,
    incorrectCount: 3,
    consecutiveCorrect: 0,
    consecutiveIncorrect: 2,
  },
  signals: ['struggling', 'fatigue'],
  originalIndex: 42,
};
```

---

## 6. ScheduleResult

### 定義

```typescript
interface ScheduleResult {
  scheduledQuestions: Question[];
  vibrationScore: number;
  metadata?: {
    totalCandidates: number;
    filteredCount: number;
    signalCounts: Record<LearningSignal, number>;
    avgPriority: number;
  };
}
```

### フィールド詳細

| フィールド | 型 | 必須 | 説明 |
|----------|-----|------|------|
| `scheduledQuestions` | `Question[]` | ✅ | スケジューリング済み問題リスト |
| `vibrationScore` | `number` | ✅ | 振動スコア（0-100、低いほど良い） |
| `metadata` | `object` | - | デバッグ用メタデータ |

### metadata の内容

| フィールド | 型 | 説明 |
|----------|-----|------|
| `totalCandidates` | `number` | 候補問題数（振動防止前） |
| `filteredCount` | `number` | 振動防止で除外された問題数 |
| `signalCounts` | `Record<LearningSignal, number>` | 各シグナルの検出数 |
| `avgPriority` | `number` | 平均優先度 |

### 使用例

```typescript
const result: ScheduleResult = {
  scheduledQuestions: [
    { id: 'q1', word: 'apple', meaning: 'りんご' },
    { id: 'q2', word: 'banana', meaning: 'バナナ' },
  ],
  vibrationScore: 15.5,
  metadata: {
    totalCandidates: 50,
    filteredCount: 5,
    signalCounts: {
      fatigue: 10,
      struggling: 5,
      overlearning: 2,
      optimal: 33,
    },
    avgPriority: 75.3,
  },
};
```

---

## 7. DetectedSignal（新規追加 - 実装に合わせて修正）

### 定義

```typescript
interface DetectedSignal {
  type: 'fatigue' | 'boredom' | 'overlearning' | 'struggling' | 'optimal';
  confidence: number;  // 0.0-1.0
  action: 'easier' | 'harder' | 'diverse' | 'review' | 'continue';
}
```

### フィールド詳細

| フィールド | 型 | 必須 | 説明 |
|----------|-----|------|------|
| `type` | `string` | ✅ | シグナルの種類（5種類） |
| `confidence` | `number` | ✅ | シグナルの確信度（0.0-1.0） |
| `action` | `string` | ✅ | 推奨される学習アクション |

### シグナルの意味

| Signal | 日本語 | 条件 | 影響 | Confidence | Action |
|--------|-------|------|------|-----------|--------|
| `'fatigue'` | 疲労 | 20分以上連続学習 `OR` 認知負荷0.7以上 | 優先度 -20% | sessionMinutes/30 \* 0.5 + cognitiveLoad \* 0.5 | `'easier'` |
| `'struggling'` | 苦戦中 | 誤答率 40%以上 | 優先度 -30% | min(errorRate, 0.9) | `'review'` |
| `'boredom'` | 飽き | 同じ問題の繰り返し | 優先度調整 | 実装待ち | `'diverse'` |
| `'overlearning'` | 過学習 | 連続正解 10回以上 | 優先度 -15% | consecutiveCorrect / 15 | `'harder'` |
| `'optimal'` | 最適状態 | 誤答率20-35% & 連続正解8回未満 | 影響なし | 0.8 | `'continue'` |

### LearningSignal（旧型定義 - 互換性のため残す）

```typescript
type LearningSignal = 'fatigue' | 'struggling' | 'overlearning' | 'optimal';
```

**注意**: 新しいコードでは `DetectedSignal` を使用してください。`LearningSignal` は後方互換性のためのみ残されています

### 使用例

```typescript
const signals: LearningSignal[] = ['fatigue', 'struggling'];

// シグナルの検出
function detectSignals(context: ScheduleContext): LearningSignal[] {
  const signals: LearningSignal[] = [];
  
  if (context.studentState.continuousStudyMinutes >= 20) {
    signals.push('fatigue');
  }
  
  if (context.studentState.recentErrorRate >= 0.4) {
    signals.push('struggling');
  }
  
  if (signals.length === 0) {
    signals.push('optimal');
  }
  
  return signals;
}
```

---

## 8. StudentState

### 定義

```typescript
interface StudentState {
  continuousStudyMinutes: number;
  recentErrorRate: number;
  consecutiveCorrectAnswers: number;
  totalReviewsToday: number;
}
```

### フィールド詳細

| フィールド | 型 | 必須 | 説明 |
|----------|-----|------|------|
| `continuousStudyMinutes` | `number` | ✅ | 連続学習時間（分） |
| `recentErrorRate` | `number` | ✅ | 直近の誤答率（0.0-1.0） |
| `consecutiveCorrectAnswers` | `number` | ✅ | 連続正解回数 |
| `totalReviewsToday` | `number` | ✅ | 本日の復習回数 |

### 使用例

```typescript
const state: StudentState = {
  continuousStudyMinutes: 25,      // 25分連続学習中
  recentErrorRate: 0.45,           // 45%誤答率
  consecutiveCorrectAnswers: 0,    // 連続正解なし
  totalReviewsToday: 47,           // 本日47回復習済み
};
```

---

## 9. RecentAnswer

### 定義

```typescript
interface RecentAnswer {
  questionId: string;
  isCorrect: boolean;
  answeredAt: number;
  consecutiveCorrectCount?: number;
}
```

### フィールド詳細

| フィールド | 型 | 必須 | 説明 |
|----------|-----|------|------|
| `questionId` | `string` | ✅ | 問題ID |
| `isCorrect` | `boolean` | ✅ | 正解かどうか |
| `answeredAt` | `number` | ✅ | 回答日時（Unix timestamp ms） |
| `consecutiveCorrectCount` | `number` | - | 連続正解回数（この時点での） |

### 使用例

```typescript
const answers: RecentAnswer[] = [
  {
    questionId: 'memorize_apple_001',
    isCorrect: true,
    answeredAt: Date.now() - 30000,      // 30秒前
    consecutiveCorrectCount: 1,
  },
  {
    questionId: 'memorize_banana_002',
    isCorrect: false,
    answeredAt: Date.now() - 60000,      // 1分前
    consecutiveCorrectCount: 0,
  },
];
```

---

## 10. CognitiveLoadLevel

### 定義

```typescript
type CognitiveLoadLevel = 'low' | 'medium' | 'high';
```

### レベルの意味

| Level | 日本語 | 説明 | 使用場面 |
|-------|-------|------|---------|
| `'low'` | 低負荷 | 簡単な問題、軽い学習 | ウォーミングアップ時 |
| `'medium'` | 中負荷 | 通常の学習 | デフォルト |
| `'high'` | 高負荷 | 難しい問題、集中が必要 | 文法問題、長文読解 |

### 使用例

```typescript
const cognitiveLoad: CognitiveLoadLevel = 'high';

// 認知負荷に応じた調整
function adjustForCognitiveLoad(priority: number, load: CognitiveLoadLevel): number {
  switch (load) {
    case 'low':
      return priority * 1.1;   // 10%増加
    case 'medium':
      return priority;          // 変更なし
    case 'high':
      return priority * 0.9;   // 10%減少（疲労を考慮）
  }
}
```

---

## 11. TimeOfDay

### 定義

```typescript
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
```

### 時間帯の定義

| TimeOfDay | 日本語 | 時間範囲 | 特徴 |
|-----------|-------|---------|------|
| `'morning'` | 朝 | 6:00-12:00 | 集中力が高い |
| `'afternoon'` | 午後 | 12:00-18:00 | 通常の学習 |
| `'evening'` | 夕方 | 18:00-22:00 | 疲労が蓄積 |
| `'night'` | 夜 | 22:00-6:00 | 低集中力 |

### 使用例

```typescript
const timeOfDay: TimeOfDay = 'evening';

// 時間帯に応じた調整
function adjustForTimeOfDay(priority: number, time: TimeOfDay): number {
  switch (time) {
    case 'morning':
      return priority * 1.1;   // 10%増加（集中力が高い）
    case 'afternoon':
      return priority;          // 変更なし
    case 'evening':
      return priority * 0.95;  // 5%減少（疲労考慮）
    case 'night':
      return priority * 0.85;  // 15%減少（低集中力）
  }
}
```

---

## 完全な使用例

### QuestionSchedulerの呼び出し

```typescript
import { QuestionScheduler } from './ai/scheduler/QuestionScheduler';
import type { ScheduleParams, ScheduleResult } from './ai/scheduler/types';

// 1. パラメータ準備
const params: ScheduleParams = {
  availableQuestions: [
    { id: 'q1', word: 'apple', meaning: 'りんご', type: 'memorization' },
    { id: 'q2', word: 'banana', meaning: 'バナナ', type: 'memorization' },
    // ... 他の問題
  ],
  recentAnswers: [
    {
      questionId: 'q1',
      isCorrect: false,
      answeredAt: Date.now() - 60000,  // 1分前
    },
  ],
  useMetaAI: true,
  timeOfDay: 'afternoon',
  cognitiveLoad: 'medium',
  maxQuestions: 20,
};

// 2. スケジューリング実行
const scheduler = new QuestionScheduler();
const result: ScheduleResult = await scheduler.schedule(params);

// 3. 結果の使用
console.log(`スケジュール済み問題数: ${result.scheduledQuestions.length}`);
console.log(`振動スコア: ${result.vibrationScore}`);
console.log(`上位3問: ${result.scheduledQuestions.slice(0, 3).map(q => q.word).join(', ')}`);
```

---

## バリデーション実装例

### 完全なバリデーター

```typescript
export class TypeValidator {
  static validateScheduleParams(params: any): string[] {
    const errors: string[] = [];

    if (!params.availableQuestions || !Array.isArray(params.availableQuestions)) {
      errors.push('availableQuestions は配列である必要があります');
    } else if (params.availableQuestions.length === 0) {
      errors.push('availableQuestions は空配列にできません');
    } else {
      // 各問題を検証
      params.availableQuestions.forEach((q: any, i: number) => {
        const qErrors = this.validateQuestion(q);
        qErrors.forEach(err => errors.push(`availableQuestions[${i}]: ${err}`));
      });
    }

    if (!params.recentAnswers || !Array.isArray(params.recentAnswers)) {
      errors.push('recentAnswers は配列である必要があります');
    }

    if (params.useMetaAI !== undefined && typeof params.useMetaAI !== 'boolean') {
      errors.push('useMetaAI はboolean型である必要があります');
    }

    return errors;
  }

  static validateQuestion(q: any): string[] {
    const errors: string[] = [];
    
    if (!q.id) errors.push('id は必須です');
    if (!q.word) errors.push('word は必須です');
    if (!q.meaning) errors.push('meaning は必須です');
    
    return errors;
  }

  static validateWordStatus(status: any): string[] {
    const errors: string[] = [];
    
    const validCategories = ['incorrect', 'still_learning', 'new', 'mastered', null];
    if (!validCategories.includes(status.category)) {
      errors.push(`category は ${validCategories.join(' | ')} のいずれかである必要があります`);
    }
    
    if (typeof status.reviewCount !== 'number' || status.reviewCount < 0) {
      errors.push('reviewCount は0以上の数値である必要があります');
    }
    
    return errors;
  }
}
```

---

## 型安全性のTips

### 1. Type Guardsの使用

```typescript
function isQuestion(obj: any): obj is Question {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.word === 'string' &&
    typeof obj.meaning === 'string'
  );
}

// 使用例
if (isQuestion(unknownObject)) {
  console.log(unknownObject.word);  // 型安全
}
```

### 2. Discriminated Union

```typescript
type ScheduleMode =
  | { useMetaAI: true; hybridMode: false }
  | { useMetaAI: false; hybridMode: true }
  | { useMetaAI: false; hybridMode: false };

// useMetaAI と hybridMode を同時にtrueにできない
```

### 3. TypeScript型ユーティリティ

```typescript
// Required<T> と Partial<T>
// 全フィールド必須
type RequiredScheduleParams = Required<ScheduleParams>;

// 全フィールドオプショナル
type PartialScheduleParams = Partial<ScheduleParams>;

// 特定フィールドのみ必須
type MinimalScheduleParams = Pick<ScheduleParams, 'availableQuestions' | 'recentAnswers'>;
```

---

## トラブルシューティング

### 問題1: 型エラー「Type 'X' is not assignable to type 'Y'」

**原因**: フィールドの型が一致していない

**解決策**:
```typescript
// ❌ 間違い
const params: ScheduleParams = {
  availableQuestions: {},  // 配列ではない
  recentAnswers: [],
};

// ✅ 正しい
const params: ScheduleParams = {
  availableQuestions: [],
  recentAnswers: [],
};
```

### 問題2: category が string 型で型エラー

**原因**: category は特定の文字列リテラル型

**解決策**:
```typescript
// ❌ 間違い
const category: string = 'incorrect';
const status: WordStatus = { category, ... };  // エラー

// ✅ 正しい
const category: 'incorrect' | 'still_learning' | 'new' | 'mastered' | null = 'incorrect';
const status: WordStatus = { category, ... };
```

---

## 関連ドキュメント

- [QuestionScheduler 完全仕様書](../specifications/QUESTION_SCHEDULER_SPEC.md)
- [QuestionScheduler 復旧手順書](../how-to/QUESTION_SCHEDULER_RECOVERY.md)
- [メタAI統合ガイド](META_AI_INTEGRATION_GUIDE.md)

---

## 変更履歴

| 日付 | 変更内容 |
|------|---------|
| 2025-12-19 | 初版作成（Phase 1.2完了） |
