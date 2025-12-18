# 統一問題スケジューラー実装計画
**バージョン**: 1.0  
**作成日**: 2025年12月17日  
**目的**: 4タブ共通の出題機能をメタAI（14AI）に集約し、DTA+振動防止を1箇所で実現

---

## 📋 目次

1. [背景と目的](#背景と目的)
2. [現状分析](#現状分析)
3. [設計思想](#設計思想)
4. [アーキテクチャ](#アーキテクチャ)
5. [実装計画](#実装計画)
6. [振動防止戦略](#振動防止戦略)
7. [リスク管理](#リスク管理)
8. [ロールバック戦略](#ロールバック戦略)

---

## 背景と目的

### なぜ集約するのか

**現状の問題**:
- 4タブ（暗記・和訳・スペル・文法）それぞれに**独自のソート処理**が存在
- 同じロジック（DTA、振動防止、優先度計算）が重複実装
- メンテナンス時に4箇所を修正する必要がある
- 仕組みは共通なのに一貫性がない

**目指す姿**:
```
┌─────────────────────────────────────────┐
│   統一問題スケジューラー (Meta AI)       │
│   - DTA処理                             │
│   - 振動防止                             │
│   - 優先度計算                           │
│   - シグナル検出・審議                   │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┴──────────┐
    │                      │
┌───▼───┐ ┌──▼───┐ ┌──▼───┐ ┌──▼───┐
│暗記タブ│ │和訳  │ │スペル│ │文法  │
└───────┘ └──────┘ └──────┘ └──────┘
```

**利点**:
1. **保守性向上**: 1箇所の修正で全タブに反映
2. **一貫性保証**: すべてのタブで同じ振動防止戦略
3. **拡張性**: 新タブ追加時も統一スケジューラーを呼ぶだけ
4. **テスト容易性**: 1つのテストスイートで全タブカバー

---

## 現状分析

### 各タブの出題処理実装状況

| タブ | 主要コンポーネント | ソート処理 | DTA | 14AI統合 | 重複度 |
|------|-----------------|----------|-----|---------|--------|
| **暗記** | MemorizationView.tsx | ① questionPrioritySorter.ts<br>② ローカル関数（305-590行）| ✅ | ✅ | 高（2重実装） |
| **和訳** | TranslationView.tsx + App.tsx | App.tsx内の複雑なAI連携 | 部分的 | ❌ | 中 |
| **スペル** | SpellingView.tsx | 独自実装（インポート未使用） | 部分的 | ❌ | 中 |
| **文法** | GrammarQuizView.tsx | GrammarStrategy.ts | 部分的 | ❌ | 中 |

### コード重複の具体例

#### パターン1: 優先度計算ロジック

**MemorizationView.tsx（ローカル関数）**:
```typescript
// Line 305-590
const sortQuestionsByPriority = (questions, ...) => {
  const getWordStatus = (word: string) => { /* ... */ };
  
  // 優先度計算
  let priorityA = statusA?.priority || 3;
  if (statusA?.category === 'mastered') {
    const forgettingRisk = calculateForgettingRisk(...);
    priorityA = forgettingRisk >= 50 ? 2.0 : 4.5; // DTA
  }
};
```

**questionPrioritySorter.ts（共通関数）**:
```typescript
// Line 287-366
function calculateTimeBasedPriority(...) {
  // 同じロジック
  if (category === 'mastered') {
    const risk = calculateForgettingRisk(...);
    priority = risk >= 50 ? 2.0 : 4.5; // DTA
  }
}
```

**SpellingStrategy.ts**:
```typescript
// Line 78-120
sortQuestions(questions, limits, stats) {
  // ほぼ同じ優先度計算
  let priorityA = statusA?.priority || 3;
  // 時間考慮は独自実装...
}
```

→ **同じロジックが3-4箇所に分散！**

#### パターン2: 振動防止ロジック

**各タブで個別実装**:
- MemorizationView: DTA + sessionPriority
- TranslationView: 複雑なAI連携（振動対策なし）
- SpellingView: 独自実装（振動対策なし）
- GrammarQuizView: 基本的なソート（振動対策なし）

→ **暗記タブ以外は振動リスクあり！**

---

## 設計思想

### 1. 単一責任の原則（SRP）

```
QuestionScheduler（統一スケジューラー）
└─ 責任: 問題の最適な出題順序を決定する
   - DTA処理
   - 振動防止
   - 優先度計算
   - シグナル反映
```

各Viewは**UIとユーザー操作のみ**に集中:
```typescript
// MemorizationView.tsx（理想形）
const sortedQuestions = QuestionScheduler.schedule({
  questions: filtered,
  mode: 'memorization',
  limits: { learningLimit, reviewLimit },
  sessionContext: { ... },
});
```

### 2. 開放閉鎖の原則（OCP）

**拡張に対して開いている**:
```typescript
// 新しいタブを追加しても既存コードは変更不要
const sortedQuestions = QuestionScheduler.schedule({
  questions: filtered,
  mode: 'listening', // 新タイプ追加
  // ...
});
```

**修正に対して閉じている**:
```typescript
// DTA閾値を変更しても各タブのコードは不変
// QuestionScheduler内部のみ修正
```

### 3. 依存性逆転の原則（DIP）

```
各View（高レベル）
    ↓ 依存
QuestionScheduler（抽象インターフェース）
    ↓ 実装
14AIネットワーク（低レベル）
```

---

## アーキテクチャ

### 全体構造

```
┌──────────────────────────────────────────────────────────┐
│                  QuestionScheduler                        │
│                  (統一問題スケジューラー)                  │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │  1. Preprocessing (前処理)                         │  │
│  │     - 問題リスト正規化                              │  │
│  │     - セッションコンテキスト構築                    │  │
│  │     - 学習履歴取得                                  │  │
│  └────────────────────────────────────────────────────┘  │
│                         ↓                                  │
│  ┌────────────────────────────────────────────────────┐  │
│  │  2. Signal Detection (シグナル検出)                │  │
│  │     - 14AI SignalDetector起動                      │  │
│  │     - 7AI並列シグナル検出                          │  │
│  │     - 疲労・飽き・過学習検出                       │  │
│  └────────────────────────────────────────────────────┘  │
│                         ↓                                  │
│  ┌────────────────────────────────────────────────────┐  │
│  │  3. Priority Calculation (優先度計算)              │  │
│  │     - 基本優先度 (category)                        │  │
│  │     - DTA調整 (forgettingRisk)                     │  │
│  │     - シグナル反映 (signal priority)               │  │
│  │     - 時間ブースト (time-based boost)              │  │
│  └────────────────────────────────────────────────────┘  │
│                         ↓                                  │
│  ┌────────────────────────────────────────────────────┐  │
│  │  4. Anti-Vibration (振動防止)                      │  │
│  │     - sessionPriority除外                          │  │
│  │     - 短時間内再出題ペナルティ                      │  │
│  │     - 連続正解頻度低減                              │  │
│  └────────────────────────────────────────────────────┘  │
│                         ↓                                  │
│  ┌────────────────────────────────────────────────────┐  │
│  │  5. Sorting & Balance (ソート・バランス調整)        │  │
│  │     - 優先度順ソート                                │  │
│  │     - 新規/復習バランス調整                         │  │
│  │     - 上限チェック                                  │  │
│  └────────────────────────────────────────────────────┘  │
│                         ↓                                  │
│  ┌────────────────────────────────────────────────────┐  │
│  │  6. Post-processing (後処理)                       │  │
│  │     - 最終順序決定                                  │  │
│  │     - ログ出力                                      │  │
│  │     - パフォーマンス測定                            │  │
│  └────────────────────────────────────────────────────┘  │
│                                                            │
└──────────────────────────────────────────────────────────┘
          ↓                    ↓                    ↓
   MemorizationView    TranslationView      SpellingView
```

### クラス設計

```typescript
/**
 * 統一問題スケジューラー
 * 全タブ共通の出題順序決定ロジックを提供
 */
export class QuestionScheduler {
  private metaAI: AdaptiveEducationalAINetwork;
  private signalDetector: SignalDetector;
  private antiVibration: AntiVibrationFilter;
  
  /**
   * 問題をスケジューリング（メインAPI）
   */
  schedule(params: ScheduleParams): Question[] {
    // 1. 前処理
    const context = this.buildContext(params);
    
    // 2. シグナル検出
    const signals = this.detectSignals(context);
    
    // 3. 優先度計算
    const prioritized = this.calculatePriorities(params.questions, context, signals);
    
    // 4. 振動防止
    const filtered = this.applyAntiVibration(prioritized, context);
    
    // 5. ソート・バランス調整
    const sorted = this.sortAndBalance(filtered, params);
    
    // 6. 後処理
    return this.postProcess(sorted, context);
  }
  
  /**
   * セッションコンテキスト構築
   */
  private buildContext(params: ScheduleParams): ScheduleContext {
    return {
      mode: params.mode,
      sessionStats: params.sessionStats,
      recentAnswers: this.getRecentAnswers(params.mode),
      timeOfDay: this.getTimeOfDay(),
      cognitiveLoad: this.calculateCognitiveLoad(params.sessionStats),
    };
  }
  
  /**
   * シグナル検出（14AI統合）
   */
  private detectSignals(context: ScheduleContext): LearningSignal[] {
    if (!context.useMetaAI) return [];
    
    return this.signalDetector.detectSignals({
      currentDifficulty: context.sessionStats.averageDifficulty,
      timeOfDay: context.timeOfDay,
      recentErrors: context.sessionStats.incorrect,
      sessionLength: context.sessionStats.duration,
      consecutiveCorrect: context.sessionStats.consecutiveCorrect,
      cognitiveLoad: context.cognitiveLoad,
    });
  }
  
  /**
   * 優先度計算（DTA統合）
   */
  private calculatePriorities(
    questions: Question[],
    context: ScheduleContext,
    signals: LearningSignal[]
  ): PrioritizedQuestion[] {
    return questions.map(q => {
      const status = this.getWordStatus(q.word, context.mode);
      
      // 基本優先度
      let priority = this.getBasePriority(status);
      
      // DTA調整
      if (status?.category === 'mastered') {
        const risk = this.calculateForgettingRisk(status);
        priority = risk >= 50 ? 2.0 : 4.5;
      }
      
      // シグナル反映
      priority = this.applySignals(priority, signals, q);
      
      // 時間ブースト
      priority = this.applyTimeBoost(priority, status);
      
      return { question: q, priority, status };
    });
  }
  
  /**
   * 振動防止フィルター
   */
  private applyAntiVibration(
    questions: PrioritizedQuestion[],
    context: ScheduleContext
  ): PrioritizedQuestion[] {
    return this.antiVibration.filter(questions, {
      recentAnswers: context.recentAnswers,
      minInterval: 60000, // 1分以内の再出題を防止
      consecutiveThreshold: 3, // 3連続正解で頻度低減
    });
  }
  
  /**
   * ソート・バランス調整
   */
  private sortAndBalance(
    questions: PrioritizedQuestion[],
    params: ScheduleParams
  ): Question[] {
    // 優先度順ソート
    const sorted = questions.sort((a, b) => a.priority - b.priority);
    
    // 新規/復習バランス調整
    const balanced = this.balanceNewAndReview(sorted, params);
    
    // 上限チェック
    return this.applyLimits(balanced, params.limits);
  }
}

/**
 * 振動防止フィルター
 */
class AntiVibrationFilter {
  /**
   * 最近正解した問題を一時的に抑制
   */
  filter(questions: PrioritizedQuestion[], options: FilterOptions): PrioritizedQuestion[] {
    const now = Date.now();
    
    return questions.map(pq => {
      const lastAnswer = options.recentAnswers.find(a => a.word === pq.question.word);
      
      if (!lastAnswer) return pq;
      
      // 短時間内の再出題ペナルティ
      const timeSinceAnswer = now - lastAnswer.timestamp;
      if (timeSinceAnswer < options.minInterval && lastAnswer.correct) {
        return {
          ...pq,
          priority: pq.priority + 5.0, // 大幅に後回し
          antiVibrationApplied: true,
        };
      }
      
      // 連続正解の頻度低減
      if (lastAnswer.consecutiveCorrect >= options.consecutiveThreshold) {
        return {
          ...pq,
          priority: pq.priority + 2.0,
          antiVibrationApplied: true,
        };
      }
      
      return pq;
    });
  }
}
```

### 型定義

```typescript
/**
 * スケジューリングパラメータ
 */
interface ScheduleParams {
  questions: Question[];
  mode: 'memorization' | 'translation' | 'spelling' | 'grammar';
  limits: {
    learningLimit: number | null;
    reviewLimit: number | null;
  };
  sessionStats: SessionStats;
  useMetaAI?: boolean;
  isReviewFocusMode?: boolean;
}

/**
 * スケジューリングコンテキスト
 */
interface ScheduleContext {
  mode: ScheduleParams['mode'];
  sessionStats: SessionStats;
  recentAnswers: RecentAnswer[];
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  cognitiveLoad: number;
  useMetaAI: boolean;
}

/**
 * 優先度付き問題
 */
interface PrioritizedQuestion {
  question: Question;
  priority: number;
  status: WordStatus | null;
  antiVibrationApplied?: boolean;
  signals?: LearningSignal[];
}

/**
 * 最近の解答履歴
 */
interface RecentAnswer {
  word: string;
  correct: boolean;
  timestamp: number;
  consecutiveCorrect: number;
}

/**
 * 振動防止フィルターオプション
 */
interface FilterOptions {
  recentAnswers: RecentAnswer[];
  minInterval: number; // ミリ秒
  consecutiveThreshold: number;
}
```

---

## 実装計画

### Phase 0: 準備・設計（1日）

**タスク**:
1. ✅ 現状分析完了
2. ✅ 設計ドキュメント作成
3. ⏳ QuestionSchedulerクラス設計レビュー
4. ⏳ AntiVibrationFilterクラス設計レビュー

**成果物**:
- [x] 本ドキュメント（UNIFIED_QUESTION_SCHEDULER_PLAN.md）
- [ ] QuestionScheduler.tsスケルトン
- [ ] AntiVibrationFilter.tsスケルトン
- [ ] 型定義ファイル（types.ts）

---

### Phase 1: コア実装（2-3日）

#### Step 1.1: QuestionSchedulerクラス作成

**ファイル**: `src/ai/scheduler/QuestionScheduler.ts`

```typescript
export class QuestionScheduler {
  // 基本実装
  schedule(params: ScheduleParams): Question[] {
    // 既存のquestionPrioritySorter.tsのロジックを移植
    // DTA統合
    // シグナル検出統合
  }
}
```

**作業項目**:
- [x] プロジェクト構造決定
- [ ] QuestionScheduler.ts作成
- [ ] buildContext実装
- [ ] calculatePriorities実装（DTAロジック移植）
- [ ] sortAndBalance実装
- [ ] 基本テスト作成

**検証方法**:
```typescript
// tests/unit/questionScheduler.test.ts
describe('QuestionScheduler', () => {
  it('should schedule questions with DTA', () => {
    const scheduler = new QuestionScheduler();
    const result = scheduler.schedule({
      questions: mockQuestions,
      mode: 'memorization',
      limits: { learningLimit: 10, reviewLimit: 5 },
      sessionStats: mockStats,
    });
    
    // Top 100問に「覚えてる」が含まれないことを確認
    const topQuestions = result.slice(0, 100);
    const masteredCount = topQuestions.filter(q => 
      getStatus(q).category === 'mastered'
    ).length;
    expect(masteredCount).toBe(0); // 振動なし
  });
});
```

#### Step 1.2: AntiVibrationFilter実装

**ファイル**: `src/ai/scheduler/AntiVibrationFilter.ts`

```typescript
export class AntiVibrationFilter {
  filter(questions: PrioritizedQuestion[], options: FilterOptions): PrioritizedQuestion[] {
    // 短時間内再出題防止
    // 連続正解頻度低減
    // sessionPriority考慮
  }
}
```

**作業項目**:
- [ ] AntiVibrationFilter.ts作成
- [ ] filter実装
- [ ] 時間ベースペナルティ実装
- [ ] 連続正解検出実装
- [ ] テスト作成

**検証方法**:
```typescript
it('should prevent recent correct answers from reappearing', () => {
  const filter = new AntiVibrationFilter();
  const recentAnswers = [
    { word: 'apple', correct: true, timestamp: Date.now() - 30000, consecutiveCorrect: 1 }
  ];
  
  const result = filter.filter(mockQuestions, {
    recentAnswers,
    minInterval: 60000,
    consecutiveThreshold: 3,
  });
  
  const appleQuestion = result.find(pq => pq.question.word === 'apple');
  expect(appleQuestion.priority).toBeGreaterThan(4.0); // 後回し
  expect(appleQuestion.antiVibrationApplied).toBe(true);
});
```

#### Step 1.3: 14AI統合

**作業項目**:
- [ ] detectSignals実装
- [ ] applySignals実装
- [ ] SignalDetectorとの連携
- [ ] シグナル優先度マッピング

---

### Phase 2: 暗記タブ統合（1日）

#### Step 2.1: ローカル関数削除

**Before**:
```typescript
// MemorizationView.tsx Line 305-590
const sortQuestionsByPriority = (questions, ...) => { ... };
```

**After**:
```typescript
// 削除してQuestionSchedulerを使用
import { QuestionScheduler } from '@/ai/scheduler/QuestionScheduler';

const scheduler = new QuestionScheduler();
const sortedQuestions = scheduler.schedule({
  questions: filtered,
  mode: 'memorization',
  limits: { learningLimit: stillLearningLimit, reviewLimit: incorrectLimit },
  sessionStats,
  useMetaAI: adaptiveEnabled,
});
```

**作業項目**:
- [ ] ローカル関数削除（Line 305-590）
- [ ] QuestionScheduler呼び出し追加
- [ ] sessionContextマッピング
- [ ] 動作確認

**検証方法**:
```bash
# 振動シミュレーション実行
npm run test:simulation
# → Top 100問に「覚えてる」が0件であることを確認
```

#### Step 2.2: 既存sortByPriorityCommon置き換え

**Before**:
```typescript
// Line 211, 758
const sorted = sortByPriorityCommon(filtered, {
  useMetaAI: adaptiveEnabled,
  sessionContext: { ... },
});
```

**After**:
```typescript
const sorted = scheduler.schedule({
  questions: filtered,
  mode: 'memorization',
  limits: { learningLimit, reviewLimit },
  sessionStats,
  useMetaAI: adaptiveEnabled,
});
```

---

### Phase 3: スペルタブ統合（1日）

#### Step 3.1: 独自ソート処理削除

**現状**: SpellingView.tsx内に独自実装

**作業項目**:
- [ ] 独自ソート処理削除
- [ ] QuestionScheduler呼び出し追加
- [ ] mode: 'spelling'設定
- [ ] 動作確認

#### Step 3.2: SpellingStrategy移行

**Before**: SpellingStrategy.sortQuestions()

**After**: QuestionScheduler.schedule()

---

### Phase 4: 文法タブ統合（1日）

**作業項目**:
- [ ] GrammarQuizView調査
- [ ] GrammarStrategy.sortQuestions削除
- [ ] QuestionScheduler呼び出し追加
- [ ] mode: 'grammar'設定
- [ ] 動作確認

---

### Phase 5: 和訳タブ統合（2日）※ハイブリッド方式

#### Step 5.1: 既存AI連携維持

**方針**: App.tsx内の既存AI（Learning Curve, Consolidation, Cognitive Load等）を維持し、QuestionSchedulerを**最終調整役**として追加

**Before**:
```typescript
// App.tsx handleStartQuiz
const prioritizedQuestions = calculateQuestionPriorities(...); // 学習曲線AI
const consolidated = planConsolidationSequence(...); // 定着転換
const adjusted = adjustDifficultyByCognitiveLoad(...); // 認知負荷
const contextualized = generateContextualSequence(...); // 文脈学習
```

**After**:
```typescript
// 既存AI処理後、QuestionSchedulerで最終調整
const existingAI_Result = /* ... 既存AI処理 ... */;

const finalSchedule = scheduler.schedule({
  questions: existingAI_Result,
  mode: 'translation',
  limits: { learningLimit, reviewLimit },
  sessionStats,
  useMetaAI: true,
  hybridMode: true, // 既存AI優先度を尊重
});
```

**実装**:
```typescript
// QuestionScheduler.ts
schedule(params: ScheduleParams): Question[] {
  if (params.hybridMode) {
    // 既存優先度を微調整のみ（±20%）
    return this.hybridAdjustment(params.questions, params);
  }
  // 通常処理
  return this.fullSchedule(params);
}
```

---

### Phase 6: 統合テスト・最適化（2日）

#### Step 6.1: 振動検証テスト

**シナリオ1**: 300+300+300バランス
```typescript
it('should not vibrate with 300 mastered, 300 learning, 300 incorrect', () => {
  const questions = [
    ...create300Mastered(),
    ...create300Learning(),
    ...create300Incorrect(),
  ];
  
  const result = scheduler.schedule({
    questions,
    mode: 'memorization',
    limits: { learningLimit: 10, reviewLimit: 5 },
    sessionStats: mockStats,
  });
  
  const top100 = result.slice(0, 100);
  const masteredInTop100 = top100.filter(q => 
    getStatus(q.word).category === 'mastered'
  ).length;
  
  expect(masteredInTop100).toBe(0); // ✅ 振動なし
});
```

**シナリオ2**: 最近正解した問題の即座再出題防止
```typescript
it('should delay recently answered questions', () => {
  // 1分前に正解した問題
  const recentlyAnswered = { word: 'apple', correct: true, timestamp: Date.now() - 60000 };
  
  const result = scheduler.schedule({
    questions: mockQuestions,
    mode: 'memorization',
    sessionStats: { ...mockStats, recentAnswers: [recentlyAnswered] },
  });
  
  const appleIndex = result.findIndex(q => q.word === 'apple');
  expect(appleIndex).toBeGreaterThan(50); // 後半に配置
});
```

#### Step 6.2: パフォーマンス最適化

**目標**: スケジューリング処理を**50ms以内**に完了

**測定**:
```typescript
const start = performance.now();
scheduler.schedule(params);
const duration = performance.now() - start;
console.log('Scheduling time:', duration, 'ms');
```

**最適化施策**:
- [ ] シグナル検出の並列化
- [ ] キャッシュ活用（WordStatus）
- [ ] 不要なソート削減

---

## 振動防止戦略

### 3層防御システム（変更なし）

#### Layer 1: DTA (Time-Dependent Adjustment)

```typescript
// QuestionScheduler.calculatePriorities内
if (status?.category === 'mastered') {
  const forgettingRisk = this.calculateForgettingRisk(status);
  priority = forgettingRisk >= 50 ? 2.0 : 4.5; // ✅ 忘却リスク低→後回し
}
```

**効果**: 最近正解した「覚えてる」問題は自動的に優先度4.5で後回し

#### Layer 2: AntiVibrationFilter（新規強化）

```typescript
// AntiVibrationFilter.filter内
const timeSinceAnswer = now - lastAnswer.timestamp;
if (timeSinceAnswer < 60000 && lastAnswer.correct) { // 1分以内
  priority += 5.0; // ✅ 大幅ペナルティ
}

if (lastAnswer.consecutiveCorrect >= 3) { // 3連続正解
  priority += 2.0; // ✅ 頻度低減
}
```

**効果**: 短時間内の再出題と連続正解を自動検出して抑制

#### Layer 3: SessionContext（強化）

```typescript
// セッション全体の状態を考慮
const context = {
  recentAnswers: this.getRecentAnswers(mode), // ✅ 最近100件の解答履歴
  cognitiveLoad: this.calculateCognitiveLoad(stats), // ✅ 疲労度
  sessionDuration: Date.now() - sessionStart, // ✅ セッション時間
};
```

**効果**: セッション全体の文脈を考慮した出題調整

### 振動検出指標

**振動スコア**（0-100）:
```typescript
function calculateVibrationScore(questions: Question[], recentAnswers: RecentAnswer[]): number {
  let score = 0;
  
  questions.slice(0, 20).forEach(q => {
    const recent = recentAnswers.find(a => a.word === q.word);
    if (!recent) return;
    
    const timeSinceAnswer = Date.now() - recent.timestamp;
    if (timeSinceAnswer < 60000) { // 1分以内
      score += 10; // 高リスク
    } else if (timeSinceAnswer < 300000) { // 5分以内
      score += 5; // 中リスク
    }
  });
  
  return Math.min(score, 100);
}
```

**閾値**:
- **0-20**: 正常（振動なし）
- **21-50**: 注意（軽度の振動傾向）
- **51-100**: 危険（振動発生中）

---

## リスク管理

### 高リスク項目

#### リスク1: 既存機能の破壊

**懸念**: QuestionScheduler統合時に既存の出題ロジックが壊れる

**対策**:
1. **段階的移行**: Phase 1で暗記タブのみ統合→検証→次タブ
2. **フィーチャーフラグ**: 
   ```typescript
   const USE_UNIFIED_SCHEDULER = process.env.VITE_UNIFIED_SCHEDULER === 'true';
   ```
3. **A/Bテスト**: 旧ロジックと新ロジックを並行稼働
4. **詳細ログ**: すべての優先度計算をログ出力

#### リスク2: パフォーマンス低下

**懸念**: 統一スケジューラーが遅い

**対策**:
1. **パフォーマンス測定**: 各処理ステップの時間測定
2. **キャッシュ**: WordStatus、シグナル検出結果
3. **タイムアウト**: 処理時間50ms超でフォールバック
4. **最適化**: 並列化、不要な処理削減

#### リスク3: 振動問題の再発

**懸念**: 統一スケジューラーで振動が起きる

**対策**:
1. **厳格なテスト**: 振動検証シミュレーション
2. **リアルタイム監視**: vibrationScoreを常時計算
3. **自動フォールバック**: 振動スコア50超で旧ロジックに切り替え
4. **ユーザーフィードバック**: 振動報告機能

---

## ロールバック戦略

### 即座ロールバック（緊急時）

**トリガー**:
- 振動スコア > 50
- ユーザーから振動報告3件以上
- パフォーマンス > 100ms

**手順**:
```typescript
// 1. フィーチャーフラグ無効化
localStorage.setItem('USE_UNIFIED_SCHEDULER', 'false');

// 2. 旧ロジックに自動切り替え
const sortedQuestions = USE_UNIFIED_SCHEDULER
  ? scheduler.schedule(params)
  : sortByPriorityCommon(questions, options); // ✅ 旧ロジック

// 3. ユーザーに通知
showNotification({
  type: 'warning',
  message: '一時的に旧システムに切り替えました',
});
```

### 段階的ロールバック

**手順**:
1. 問題のあるタブのみ旧ロジックに戻す
2. QuestionSchedulerのバグ修正
3. 再デプロイ・検証
4. 再統合

---

## まとめ

### 成功のポイント

1. **段階的実装**: 暗記→スペル→文法→和訳の順で慎重に統合
2. **徹底的なテスト**: 振動シミュレーション、パフォーマンステスト
3. **フィーチャーフラグ**: いつでも無効化可能
4. **詳細ログ**: デバッグとモニタリング
5. **ロールバック戦略**: 問題発生時の即座復旧

### 期待される効果

- **保守性**: 出題ロジックを1箇所で管理
- **一貫性**: 全タブで同じ振動防止戦略
- **拡張性**: 新タブ追加が容易
- **品質**: 統一されたテストスイート

### 次のステップ

1. ✅ 本計画のレビュー
2. ⏳ QuestionSchedulerクラス実装開始
3. ⏳ 暗記タブでの動作検証
4. ⏳ 他タブへの展開

---

**この計画で統一問題スケジューラーを安全に実装し、振動なしの出題システムを全タブで実現します！** 🚀
