---
canonical: docs/specifications/QUESTION_SCHEDULER_SPEC.md
status: stable
lastUpdated: 2025-12-19
version: 2.0.0
diataxisCategory: reference
references:
  - .aitk/instructions/meta-ai-priority.instructions.md
  - tests/simulation/README.md
  - docs/guidelines/META_AI_TROUBLESHOOTING.md
  - docs/guidelines/QUESTION_SCHEDULER_QUICK_GUIDE.md
  - docs/quality/QUESTION_SCHEDULER_QA_PIPELINE.md
implementation: src/ai/scheduler/QuestionScheduler.ts
doNotMove: true
---

# QuestionScheduler詳細仕様書

**バージョン**: 2.0.0  
**最終更新**: 2025-12-19  
**ステータス**: 実装完了  
**ファイル**: `src/ai/scheduler/QuestionScheduler.ts`

---

## 📋 目次

1. [概要](#概要)
2. [型定義](#型定義)
3. [システム構成](#システム構成)
4. [主要機能](#主要機能)
5. [アルゴリズム詳細](#アルゴリズム詳細)
6. [データフロー](#データフロー)
7. [API仕様](#api仕様)
8. [確実性保証メカニズム](#確実性保証メカニズム)
9. [トラブルシューティング](#トラブルシューティング)
10. [復旧手順](#復旧手順)

---

## 概要

### 目的
QuestionSchedulerは、4タブ（暗記・和訳・スペル・文法）共通の出題機能を統合し、以下を実現する：

1. **DTA（Dynamic Time-based Adjustment）**: 時間経過に基づく忘却リスク計算
2. **振動防止**: 最近正解した問題を一時的に除外
3. **メタAI統合**: 7つの専門AIのシグナルを統合して出題調整
4. **category管理**: 単語の状態（new/still_learning/incorrect/mastered）に基づく優先出題
5. **確実性保証**: 復習単語（incorrect/still_learning）が必ず上位に配置される仕組み

### 8個のAIシステム

#### 7つの専門AI
1. **記憶AI**: 記憶獲得・定着判定（memoryAcquisitionAlgorithm.ts）
2. **認知負荷AI**: 疲労検出・休憩推奨（cognitiveLoadAI.ts）
3. **エラー予測AI**: 混同検出・誤答リスク予測（errorPredictionAI.ts）
4. **学習スタイルAI**: 個人最適化・時間帯調整（learningStyleAI.ts）
5. **言語関連AI**: 語源・関連語ネットワーク（linguisticRelationsAI.ts）
6. **文脈AI**: 意味的クラスタリング（contextualLearningAI.ts）
7. **ゲーミフィケーションAI**: モチベーション管理（gamificationAI.ts）

#### 1つのメタAI統合層
8. **QuestionScheduler**: 7AIのシグナル統合、DTA、振動防止、確実性保証

---

## 型定義

**実装ファイル**: `src/ai/scheduler/types.ts`  
**総数**: 11 interfaces

### 2.1 ScheduleMode

```typescript
export type ScheduleMode = 'memorization' | 'translation' | 'spelling' | 'grammar';
```

| 値 | 説明 | 対応タブ |
|----|------|---------|
| memorization | 暗記モード | 単語暗記タブ |
| translation | 和訳モード | 和訳タブ |
| spelling | スペルモード | スペルタブ |
| grammar | 文法モード | 文法タブ |

**用途**: recentAnswers の取得キー、ログ出力のプレフィックス

---

### 2.2 SessionStats（セッション統計）

```typescript
export interface SessionStats {
  correct: number;
  incorrect: number;
  still_learning: number;
  mastered: number;
  consecutiveCorrect?: number;
  duration?: number;
  averageDifficulty?: number;
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| correct | number | ✅ | 正解数 |
| incorrect | number | ✅ | 不正解数 |
| still_learning | number | ✅ | 学習中の単語数 |
| mastered | number | ✅ | 習得済みの単語数 |
| consecutiveCorrect | number | ❌ | 連続正解数（過学習シグナル検出に使用） |
| duration | number | ❌ | セッション経過時間（ミリ秒）（疲労シグナル検出に使用） |
| averageDifficulty | number | ❌ | 平均難易度（0-1）（将来実装用） |

**使用箇所**:
- `detectSignals()`: 疲労・苦戦・過学習シグナルの検出
- `calculateCognitiveLoad()`: 認知負荷の計算

**重要な閾値**:
- `duration > 20分`: 疲労シグナル発火
- `incorrect / (correct + incorrect) > 0.4`: 苦戦シグナル発火
- `consecutiveCorrect > 10`: 過学習シグナル発火

---

### 2.3 LearningLimits（学習上限設定）

```typescript
export interface LearningLimits {
  learningLimit: number | null;
  reviewLimit: number | null;
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| learningLimit | number \| null | ✅ | 新規学習上限（null = 無制限） |
| reviewLimit | number \| null | ✅ | 復習上限（null = 無制限） |

**使用箇所**: 
- **現在は未使用**（将来の学習量制御機能用）
- `ScheduleParams` に含まれるが、QuestionScheduler内では参照していない

**復旧時の注意**:
- この機能を実装する場合は、`sortAndBalance()` で上限チェックを追加

---

### 2.4 ScheduleParams（スケジューリングパラメータ）⭐ 最重要

```typescript
export interface ScheduleParams {
  questions: Question[];
  mode: ScheduleMode;
  limits: LearningLimits;
  sessionStats: SessionStats;
  useMetaAI?: boolean;
  isReviewFocusMode?: boolean;
  hybridMode?: boolean;
}
```

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| questions | Question[] | ✅ | - | スケジューリング対象の問題配列 |
| mode | ScheduleMode | ✅ | - | スケジューリングモード（タブ種類） |
| limits | LearningLimits | ✅ | - | 学習上限設定（現在未使用） |
| sessionStats | SessionStats | ✅ | - | 現在セッションの統計情報 |
| useMetaAI | boolean | ❌ | false | メタAI統合を有効化するか |
| isReviewFocusMode | boolean | ❌ | false | 復習集中モードか |
| hybridMode | boolean | ❌ | false | ハイブリッドモード（既存AI順序を尊重） |

**useMetaAI=true の場合の動作**:
- `detectSignals()` が実行される
- 4種類のシグナル（疲労・苦戦・過学習・最適状態）を検出
- 優先度に最大30%の調整を適用（将来実装）

**isReviewFocusMode=true の場合の動作**:
- 復習単語（incorrect/still_learning）を最優先
- 確実性保証メカニズムが強化される

**hybridMode=true の場合の動作**:
- `scheduleHybridMode()` メソッドが呼ばれる
- 既存AIの優先度計算を尊重
- QuestionSchedulerは順序の微調整のみ実施
- 振動防止とDTAは適用される

**制約**:
- `questions.length >= 1`（空配列不可）
- 各Questionは必ず`word`フィールドを持つ

---

### 2.5 ScheduleContext（スケジューリングコンテキスト）

```typescript
export interface ScheduleContext {
  mode: ScheduleMode;
  sessionStats: SessionStats;
  recentAnswers: RecentAnswer[];
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  cognitiveLoad: number;
  useMetaAI: boolean;
  isReviewFocusMode: boolean;
  sessionStartTime: number;
}
```

| フィールド | 型 | 説明 | 計算方法 |
|-----------|-----|------|---------|
| mode | ScheduleMode | スケジューリングモード | `params.mode` をコピー |
| sessionStats | SessionStats | セッション統計 | `params.sessionStats` をコピー |
| recentAnswers | RecentAnswer[] | 最近の解答履歴（最大100件） | `getRecentAnswers()` で取得 |
| timeOfDay | 'morning' \| ... | 時間帯 | 現在時刻から計算（< 12: morning, < 17: afternoon, < 21: evening, >= 21: night） |
| cognitiveLoad | number | 認知負荷（0-1） | `calculateCognitiveLoad()` で計算 |
| useMetaAI | boolean | メタAI統合有効化 | `params.useMetaAI \|\| false` |
| isReviewFocusMode | boolean | 復習集中モード | `params.isReviewFocusMode \|\| false` |
| sessionStartTime | number | セッション開始時刻（タイムスタンプ） | `Date.now() - (params.sessionStats.duration \|\| 0)` |

**生成メソッド**: `buildContext(params: ScheduleParams): ScheduleContext`  
**実装**: Line 164-191

**認知負荷の計算式**:
```typescript
const errorRate = (incorrect / (correct + incorrect)) || 0;
const sessionMinutes = (duration || 0) / 60000;
const timeLoad = Math.min(sessionMinutes / 30, 1); // 30分で最大
cognitiveLoad = Math.min((errorRate * 0.7) + (timeLoad * 0.3), 1);
```

---

### 2.6 WordStatus（語句の学習状況）

```typescript
export interface WordStatus {
  category: 'new' | 'incorrect' | 'still_learning' | 'mastered';
  priority: number;
  lastStudied: number;
  attempts: number;
  correct: number;
  streak: number;
  forgettingRisk: number;
  reviewInterval: number;
}
```

| フィールド | 型 | 説明 | 計算元 |
|-----------|-----|------|--------|
| category | 'new' \| ... | 学習カテゴリー | `localStorage['english-progress'].wordProgress[word].category` |
| priority | number | 基本優先度 | `getBasePriority()` で計算 |
| lastStudied | number | 最終学習時刻（タイムスタンプ） | `wordProgress[word].lastStudied` |
| attempts | number | 試行回数 | `wordProgress[word].attempts` |
| correct | number | 正解回数 | `wordProgress[word].correct` |
| streak | number | 連続正解数 | `wordProgress[word].streak` |
| forgettingRisk | number | 忘却リスク（0-100） | `calculateForgettingRisk()` で計算 |
| reviewInterval | number | 復習間隔（ミリ秒） | `wordProgress[word].reviewInterval` |

**取得メソッド**: `getWordStatus(word: string, mode: string): WordStatus | null`  
**実装**: Line 480-520

**category の優先度（降順）**:
```typescript
incorrect: 100      // 最優先（絶対的な最高優先度）
still_learning: 75  // 次点（復習対象）
new: 50            // 中間（新出単語）
mastered: 10       // 最低優先（DTA後に調整）
```

**categoryボーナスの計算式**:
```typescript
// calculatePriorities() 内部での優先度計算
const basePriority = getBasePriority(status);  // 100, 75, 50, or 10

// 実装上の内部計算（参考）
// incorrect:      basePriority = 100 → 最終優先度 = 100 + DTA + signals
// still_learning: basePriority = 75  → 最終優先度 = 75 + DTA + signals
// new:            basePriority = 50  → 最終優先度 = 50 + DTA
// mastered:       basePriority = 10  → 最終優先度 = 10 + DTA (最大40まで)
```

**重要**: `incorrect` の優先度100は、他のカテゴリーに対して **+50〜+90** のボーナスに相当します。これにより、DTAやシグナルの影響を受けても、incorrectが常に最優先で出題されることが保証されます。

---

### 2.7 PrioritizedQuestion（優先度付き問題）

```typescript
export interface PrioritizedQuestion {
  question: Question;
  priority: number;
  status: WordStatus | null;
  antiVibrationApplied?: boolean;
  signals?: any[];
  originalIndex?: number;
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| question | Question | 問題オブジェクト |
| priority | number | 計算された優先度（**高いほど優先**、降順ソート） |
| status | WordStatus \| null | 語句の学習状況（null = 学習履歴なし） |
| antiVibrationApplied | boolean | 振動防止フィルターが適用されたか |
| signals | any[] | 検出されたシグナル（将来実装用） |
| originalIndex | number | 元のインデックス（安定ソート用） |

**生成メソッド**: `calculatePriorities()`  
**実装**: Line 320-390

**優先度の範囲**:
- incorrect: 100（最大）
- still_learning: 75
- new: 50
- mastered: 5-40（DTAで調整）

---

### 2.8 RecentAnswer（最近の解答履歴）

```typescript
export interface RecentAnswer {
  word: string;
  correct: boolean;
  timestamp: number;
  consecutiveCorrect: number;
  responseTime?: number;
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| word | string | 語句 |
| correct | boolean | 正解したか |
| timestamp | number | 解答時刻（タイムスタンプ） |
| consecutiveCorrect | number | 連続正解数 |
| responseTime | number | 反応時間（ミリ秒）（将来実装用） |

**取得メソッド**: `getRecentAnswers(mode: string): RecentAnswer[]`  
**実装**: Line 195-226  
**キャッシュ**: `recentAnswersCache: Map<string, RecentAnswer[]>`

**取得元**: `localStorage['english-progress'].wordProgress[word]`  
**最大件数**: 100件（タイムスタンプ降順）

---

### 2.9 FilterOptions（振動防止フィルターオプション）

```typescript
export interface FilterOptions {
  recentAnswers: RecentAnswer[];
  minInterval: number;
  consecutiveThreshold: number;
}
```

| フィールド | 型 | 説明 | デフォルト値 |
|-----------|-----|------|-------------|
| recentAnswers | RecentAnswer[] | 最近の解答履歴 | - |
| minInterval | number | 最小再出題間隔（ミリ秒） | 60000（1分） |
| consecutiveThreshold | number | 連続正解閾値（この回数以上で頻度低減） | 3回 |

**使用箇所**: `AntiVibrationFilter.filter()`

---

### 2.10 ForgettingRiskParams（忘却リスク計算パラメータ）

```typescript
export interface ForgettingRiskParams {
  lastStudied: number;
  reviewInterval: number;
  accuracy: number;
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| lastStudied | number | 最終学習時刻（タイムスタンプ） |
| reviewInterval | number | 復習間隔（ミリ秒） |
| accuracy | number | 正答率（0-100） |

**計算メソッド**: `calculateForgettingRisk(params: ForgettingRiskParams): number`  
**実装**: Line 420-450

**計算式**:
```typescript
const timeSinceLast = Date.now() - lastStudied;
const ratioToInterval = timeSinceLast / Math.max(reviewInterval, 1);

if (ratioToInterval < 0.5) return 10; // 早すぎる
if (ratioToInterval < 1.0) return 30; // 適切
if (ratioToInterval < 2.0) return 70; // 忘却リスク高
return 95; // 非常に高い
```

---

### 2.11 ScheduleResult（スケジューリング結果）⭐ 最重要

```typescript
export interface ScheduleResult {
  scheduledQuestions: Question[];
  vibrationScore: number;
  processingTime: number;
  signalCount: number;
  debug?: {
    dtaApplied: number;
    antiVibrationApplied: number;
    signalsDetected: any[];
  };
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| scheduledQuestions | Question[] | ソート済み問題リスト（⚠️ 'questions'ではない） |
| vibrationScore | number | 振動スコア（0-100、低いほど良い） |
| processingTime | number | 処理時間（ミリ秒） |
| signalCount | number | 適用されたシグナル数 |
| debug | object | デバッグ情報（省略可） |

**返却メソッド**: `schedule(params: ScheduleParams): ScheduleResult`

**重要な注意**:
- フィールド名は `scheduledQuestions`（複数形）
- `questions` ではない（歴史的理由）
- 復旧時に間違えやすいので要注意

---

## システム構成

```
QuestionScheduler（メタAI統合層）
│
├─ シグナル検出（detectSignals）
│   ├─ 疲労シグナル: セッション20分超 or 認知負荷70%超
│   ├─ 苦戦シグナル: エラー率40%超
│   ├─ 過学習シグナル: 連続10回以上正解
│   └─ 最適状態シグナル: エラー率20-35%
│
├─ 優先度計算（scheduleQuestions）
│   ├─ 基本優先度: categoryとwordProgressから計算
│   ├─ DTAブースト: 忘却リスクに応じて最大10.0追加
│   ├─ シグナル反映: 最大30%調整
│   └─ 時間ブースト: 時間経過で優先度上昇
│
├─ 振動防止（filterRecentCorrect）
│   ├─ 最近1分以内に正解した単語を除外
│   └─ 連続3回正解した単語を除外
│
└─ 確実性保証（sortAndBalance）
    ├─ 強制カテゴリー優先: incorrect → still_learning → その他
    ├─ 上位20%保証: 復習単語が上位に含まれることを監視
    └─ デバッグログ: 詳細な配置情報を出力
```

---

## アルゴリズム詳細

### 5.1 シグナル検出アルゴリズム（detectSignals）⭐ 最重要

**実装**: `QuestionScheduler.ts` Line 230-310  
**所要時間**: 約1-2ms  
**目的**: 学習状況に基づいて適応的なシグナルを検出し、出題を最適化

---

#### DetectedSignal インターフェース定義

```typescript
interface DetectedSignal {
  type: 'fatigue' | 'boredom' | 'overlearning' | 'struggling' | 'optimal';
  confidence: number;  // 0.0-1.0（シグナルの確信度）
  action: 'easier' | 'harder' | 'diverse' | 'review' | 'continue';  // 推奨アクション
}

private detectSignals(context: ScheduleContext): DetectedSignal[] {
  const signals: DetectedSignal[] = [];
  // ...
  return signals;
}
```

**戻り値**: `DetectedSignal[]`（シグナルのリスト）

---

#### 入力

```typescript
interface ScheduleContext {
  sessionStats: SessionStats;
  cognitiveLoad: number;  // 0.0-1.0
  // ... その他
}
```

#### 出力

```typescript
DetectedSignal[]  // ⭐ Array<{ type, confidence, action }> の型定義版
```

#### アルゴリズム（4種類のシグナル）

##### Signal 1: 疲労シグナル（Fatigue）

**検出条件**:
```typescript
const sessionMinutes = (Date.now() - context.sessionStartTime) / 60000;

// 条件1: セッション時間が20分超
if (sessionMinutes > 20) {
  const confidence = Math.min((sessionMinutes / 30) * 0.5 + context.cognitiveLoad * 0.5, 1);
  signals.push({
    type: 'fatigue',
    confidence,
    action: 'easier',
  });
}

// 条件2: 認知負荷が70%超
if (context.cognitiveLoad > 0.7) {
  const confidence = Math.min(context.cognitiveLoad, 1);
  signals.push({
    type: 'fatigue',
    confidence,
    action: 'easier',
  });
}
```

**しきい値の根拠**:
- **20分**: ポモドーロ・テクニック（Francesco Cirillo, 1980s）の1セッション（25分）の80%
  - 集中力維持の限界点として広く認知されている
  - 20分を超えると疲労が蓄積し始める
- **70%**: 認知負荷理論（John Sweller, 1988）の「高負荷」境界
  - 70%を超えると学習効率が急激に低下
  - エラー率と時間負荷の加重平均
- **30分**: 集中力持続の限界（Ariga & Lleras, 2011）
  - 休憩なしでの学習は30分が限界

**confidence 計算式**:
```typescript
// セッション時間と認知負荷の加重平均
confidence = Math.min((sessionMinutes / 30) * 0.5 + cognitiveLoad * 0.5, 1)
```

**推奨アクション**: `easier`（難易度を下げる）

---

##### Signal 2: 苦戦シグナル（Struggling）

**検出条件**:
```typescript
const stats = context.sessionStats;
const totalAttempts = stats.correct + stats.incorrect + stats.still_learning;
const errorRate = totalAttempts > 0 ? stats.incorrect / totalAttempts : 0;

// 条件: エラー率が40%超、かつ試行回数が5回以上
if (errorRate > 0.4 && totalAttempts >= 5) {
  const confidence = Math.min(errorRate, 0.9);
  signals.push({
    type: 'struggling',
    confidence,
    action: 'review',
  });
}
```

**しきい値の根拠**:
- **40%**: 学習心理学における「苦戦状態」の境界
  - 正答率60%を下回ると学習効果が低下（Zone of Proximal Development, Vygotsky, 1978）
  - 適切な難易度は「70-80%の正答率」（最適難易度理論）
- **5回以上**: 統計的有意性の最小サンプルサイズ
  - 5回未満では偶然の影響が大きすぎる

**confidence 計算式**:
```typescript
confidence = Math.min(errorRate, 0.9)  // エラー率そのもの（最大90%）
```

**推奨アクション**: `review`（復習を優先）

---

##### Signal 3: 過学習シグナル（Overlearning）

**検出条件**:
```typescript
const consecutiveCorrect = stats.consecutiveCorrect || 0;

// 条件: 連続10回以上正解
if (consecutiveCorrect > 10) {
  const confidence = Math.min(consecutiveCorrect / 15, 0.9);
  signals.push({
    type: 'overlearning',
    confidence,
    action: 'harder',
  });
}
```

**しきい値の根拠**:
- **10回**: 飽きが発生する閾値
  - 同じパターンの繰り返しによる「学習の停滞」（Learning Plateau）
  - 10回連続正解 = 内容が簡単すぎる、または暗記による回答
- **15回**: confidence が最大になる基準
  - 15回以上 = 明らかに難易度が不足

**confidence 計算式**:
```typescript
confidence = Math.min(consecutiveCorrect / 15, 0.9)
// 例: 10回 → 0.67, 12回 → 0.80, 15回以上 → 0.90
```

**推奨アクション**: `harder`（難易度を上げる）

---

##### Signal 4: 最適状態シグナル（Optimal）

**検出条件**:
```typescript
// 条件: エラー率が20-35%、かつ連続正解が8回未満
if (errorRate >= 0.2 && errorRate <= 0.35 && consecutiveCorrect < 8) {
  signals.push({
    type: 'optimal',
    confidence: 0.8,
    action: 'continue',
  });
}
```

**しきい値の根拠**:
- **20-35%**: 最適難易度帯（正答率65-80%）
  - Vygotsky の「最近接発達領域」（Zone of Proximal Development）
  - 適度な挑戦と成功のバランス
- **8回未満**: 飽きが発生する前の段階
  - 連続正解が少なすぎず、多すぎない状態

**confidence**: 固定値 `0.8`

**推奨アクション**: `continue`（現状維持）

---

#### シグナルがない場合

```typescript
if (signals.length === 0) {
  logger.debug('[Signal] シグナル検出なし - 通常モード');
}
```

通常モードでは、シグナルによる優先度調整は行わない。

---

#### エラーハンドリング

```typescript
try {
  // シグナル検出ロジック
} catch (error) {
  logger.error('[QuestionScheduler] シグナル検出エラー', error);
  return [];  // 空配列を返す（フォールバック）
}
```

エラー発生時は空配列を返し、通常モードで動作を継続。

---

#### 復旧時の注意点

1. **しきい値の変更は慎重に**:
   - 20分、70%、0.4、10回等の値は研究に基づいている
   - 変更時は必ずA/Bテストを実施
   - 最低100セッション以上のデータで検証

2. **複数シグナルの競合**:
   - 現在は複数シグナルが同時に発火する可能性あり
   - 将来実装: 優先度による競合解決（疲労 > 苦戦 > 過学習 > 最適）

3. **confidence の意味**:
   - 0-1の範囲（1 = 100%確信）
   - 将来実装: confidence に応じた優先度調整の強度変更

---

## 主要機能

### 1. シグナル検出（detectSignals）- 概要

**ファイル**: Line 230-310  
**目的**: セッションの状態を4種類のシグナルで検出

#### 疲労シグナル（Fatigue）
```typescript
// 検出条件
sessionMinutes > 20 || cognitiveLoad > 0.7

// アクション
action: 'easier' // mastered単語を優先出題
confidence: 0.8
```

#### 苦戦シグナル（Struggling）
```typescript
// 検出条件
errorRate > 0.4

// アクション
action: 'review' // incorrect/still_learning単語を優先出題
confidence: 0.9
```

#### 過学習シグナル（Overlearning）
```typescript
// 検出条件
consecutiveCorrect >= 10

// アクション
action: 'harder' // 新規単語を優先出題
confidence: 0.75
```

#### 最適状態シグナル（Optimal）
```typescript
// 検出条件
0.2 <= errorRate <= 0.35

// アクション
action: 'continue' // 現在の出題を維持
confidence: 0.85
```

---

### 2. 優先度計算（scheduleQuestions）

**ファイル**: Line 66-375  
**目的**: 各単語の優先度を計算してソート

#### 計算式
```
最終優先度 = 基本優先度 + DTAブースト + シグナル反映 + 時間ブースト
```

#### 基本優先度
```typescript
// categoryベース
'incorrect':      8.0
'still_learning': 6.0
'new':            5.0
'mastered':       2.0

// wordProgressによる調整
incorrectCount * 1.5        // 不正解回数
consecutiveIncorrect * 2.0  // 連続不正解
- masteredCount * 0.5       // 定着回数（減点）
```

#### DTAブースト（忘却リスクベース）
```typescript
// 閾値: <30: 10.0, 30-70: 5.0, >=70: 2.5
const forgettingRisk = calculateForgettingRisk(wordProgress);
if (forgettingRisk < 30) dtaBoost = 10.0;
else if (forgettingRisk < 70) dtaBoost = 5.0;
else dtaBoost = 2.5;
```

#### シグナル反映（最大30%調整）
```typescript
// 疲労時
if (signal.type === 'fatigue' && category === 'mastered') {
  priority *= 1.20; // +20%
}

// 苦戦時
if (signal.type === 'struggling' && (category === 'incorrect' || category === 'still_learning')) {
  priority *= 1.30; // +30%
}

// 過学習時
if (signal.type === 'overlearning' && category === 'new') {
  priority *= 1.15; // +15%
}
```

#### 時間ブースト
```typescript
const hoursSinceLastSeen = (now - lastSeenAt) / (1000 * 60 * 60);
const timeBoost = Math.min(hoursSinceLastSeen * 0.5, 5.0); // 最大5.0
```

---

### 5.2 優先度計算アルゴリズム（calculatePriorities）

**実装**: `QuestionScheduler.ts` Line 314-390  
**所要時間**: 約2-5ms（問題数に比例）  
**目的**: 各問題に優先度スコアを付与（高いほど優先）

#### 入力

- `questions: Question[]` - 問題配列
- `context: ScheduleContext` - コンテキスト
- `signals: Signal[]` - 検出されたシグナル
- `hybridMode: boolean` - ハイブリッドモード

#### 出力

```typescript
PrioritizedQuestion[] = {
  question: Question,
  priority: number,  // 高いほど優先（降順ソート用）
  status: WordStatus | null,
  signals: Signal[],
  originalIndex: number
}[]
```

#### アルゴリズム

##### Step 1: 基本優先度の決定

```typescript
const status = getWordStatus(q.word, context.mode);
let priority = getBasePriority(status);

// 基本優先度（降順ソート: 大きいほど優先）
function getBasePriority(status: WordStatus | null): number {
  if (!status) return 50; // new

  switch (status.category) {
    case 'incorrect':
      return 100; // 最優先（最大値）
    case 'still_learning':
      return 75;
    case 'mastered':
      return 10; // 最低優先（DTA後に調整）
    case 'new':
    default:
      return 50;
  }
}
```

**カテゴリー別優先度**:
| カテゴリー | 基本優先度 | 説明 |
|-----------|-----------|------|
| incorrect | 100 | 不正解の単語（最優先） |
| still_learning | 75 | 学習中の単語 |
| new | 50 | 新出単語 |
| mastered | 10 | 習得済み（DTA調整対象） |

---

##### Step 2: DTA（Dynamic Time-based Adjustment）調整

**対象**: `category === 'mastered'` のみ

```typescript
if (status?.category === 'mastered') {
  const risk = calculateForgettingRisk({
    lastStudied: status.lastStudied,
    reviewInterval: status.reviewInterval,
    accuracy: status.correct / Math.max(status.attempts, 1) * 100,
  });

  // 忘却リスクに応じて優先度を調整
  if (risk < 30) {
    priority = 5;   // 低リスク → 後回し
  } else if (risk < 70) {
    priority = 20;  // 中リスク → 中程度
  } else {
    priority = 40;  // 高リスク → 復習必要
  }
}
```

**忘却リスク計算式**:
```typescript
function calculateForgettingRisk(params: ForgettingRiskParams): number {
  const daysSinceLast = (Date.now() - params.lastStudied) / (1000 * 60 * 60 * 24);
  const intervalRatio = params.reviewInterval > 0 
    ? daysSinceLast / params.reviewInterval 
    : 0;

  let risk = intervalRatio * 100;

  // 正答率による調整
  if (params.accuracy < 50) {
    risk *= 1.5;  // 正答率低い → リスク1.5倍
  } else if (params.accuracy >= 80) {
    risk *= 0.7;  // 正答率高い → リスク0.7倍
  }

  return Math.round(Math.min(risk, 200));
}
```

**リスクレベルと優先度**:
| 忘却リスク | 優先度 | 説明 |
|-----------|--------|------|
| 0-29 | 5 | 最近復習済み → 後回し |
| 30-69 | 20 | 適度な間隔 → 中程度 |
| 70-99 | 40 | 忘却の危険 → 復習必要 |
| 100+ | 40 | 完全に忘却 → 復習必要 |

**DTA調整の根拠**:
- Ebbinghaus の忘却曲線（1885）
- 間隔反復学習（Spaced Repetition）の理論
- reviewInterval の1.0倍を超えると忘却リスクが急増

---

##### Step 3: シグナル反映（将来実装）

```typescript
priority = applySignals(priority, signals, q);

// シグナルによる優先度調整（最大30%）
function applySignals(priority, signals, question): number {
  let adjusted = priority;

  for (const signal of signals) {
    switch (signal.type) {
      case 'fatigue':
        // 疲労時: mastered問題を優先（復習しやすい）
        if (priority < 20) {
          adjusted *= (1 - signal.confidence * 0.2); // 最大20%調整
        }
        break;

      case 'struggling':
        // 苦戦時: incorrect/still_learningの優先度をさらに上げる
        if (priority > 70) {
          adjusted *= (1 + signal.confidence * 0.3); // 最大30%調整
        }
        break;

      case 'overlearning':
        // 過学習時: new問題を優先
        if (priority === 50) {
          adjusted *= (1 + signal.confidence * 0.15); // 最大15%調整
        }
        break;
    }
  }

  return adjusted;
}
```

**注意**: 現在は未実装（signals の影響なし）

---

##### Step 4: 時間ブースト

```typescript
priority = applyTimeBoost(priority, status);

function applyTimeBoost(priority, status): number {
  if (!status || status.lastStudied === 0) return priority;

  const daysSinceLast = (Date.now() - status.lastStudied) / (1000 * 60 * 60 * 24);

  if (daysSinceLast >= 7) {
    return priority * 0.8;  // 7日以上 → 20%優先度アップ（値を下げる）
  } else if (daysSinceLast >= 3) {
    return priority * 0.9;  // 3日以上 → 10%優先度アップ
  }

  return priority;
}
```

**時間ブーストの根拠**:
- 3日: 短期記憶→長期記憶の移行期（記憶の固定化）
- 7日: 週1回の復習サイクル（最適復習間隔）

---

##### ハイブリッドモードの場合

```typescript
if (hybridMode) {
  // 既存AIの順序を保持
  const priority = index / questions.length * 100;  // 0-100の範囲
  return { question: q, priority, status, originalIndex: index };
}
```

既存AIが計算した順序を尊重し、indexベースの優先度を付与。

---

#### 復旧時の注意点

1. **優先度は降順ソート用**:
   - 大きい値 = 高優先度
   - `sort((a, b) => b.priority - a.priority)` で降順ソート

2. **DTA調整の対象**:
   - `mastered` カテゴリーのみ
   - `incorrect`, `still_learning` は常に高優先度（100, 75）

3. **忘却リスクの計算**:
   - `reviewInterval` が0の場合の除算エラーに注意
   - `Math.max(reviewInterval, 1)` で対策

---

### 5.3 振動防止フィルター（applyAntiVibration）

**実装**: `QuestionScheduler.ts` Line 430-465 + `AntiVibrationFilter.ts`  
**所要時間**: 約1-2ms  
**目的**: 最近正解した単語を一時的に除外

#### 除外条件

##### 条件1: 最近1分以内に正解

```typescript
const now = Date.now();
const recentAnswer = recentAnswers.find(ra => ra.word === word && ra.correct);

if (recentAnswer) {
  const minutesSinceCorrect = (now - recentAnswer.timestamp) / (1000 * 60);
  if (minutesSinceCorrect < 1) {
    return true; // 除外
  }
}
```

**根拠**: 短期記憶への刻印（記憶の固定化には間隔が必要）

##### 条件2: 連続3回正解

```typescript
if (recentAnswer && recentAnswer.consecutiveCorrect >= 3) {
  return true; // 除外
}
```

**根拠**: 3回連続正解 = 短期的には定着している（過剰な繰り返しを防止）

---

#### AntiVibrationFilter の実装

```typescript
// AntiVibrationFilter.ts
export class AntiVibrationFilter {
  filter(
    questions: PrioritizedQuestion[],
    recentAnswers: RecentAnswer[],
    minInterval: number = 60000, // 1分
    consecutiveThreshold: number = 3
  ): PrioritizedQuestion[] {
    return questions.filter(pq => {
      const word = pq.question.word;
      const recentAnswer = recentAnswers.find(ra => ra.word === word && ra.correct);

      if (!recentAnswer) return true; // 正解履歴なし → 含める

      const elapsed = Date.now() - recentAnswer.timestamp;
      
      // 条件1: 最近1分以内
      if (elapsed < minInterval) {
        pq.antiVibrationApplied = true;
        return false;
      }

      // 条件2: 連続3回正解
      if (recentAnswer.consecutiveCorrect >= consecutiveThreshold) {
        pq.antiVibrationApplied = true;
        return false;
      }

      return true;
    });
  }

  calculateVibrationScore(
    questions: PrioritizedQuestion[],
    recentAnswers: RecentAnswer[],
    windowSize: number = 20
  ): number {
    const topQuestions = questions.slice(0, windowSize);
    const repeats = topQuestions.filter(pq => {
      const word = pq.question.word;
      const recentAnswer = recentAnswers.find(ra => ra.word === word);
      return recentAnswer && (Date.now() - recentAnswer.timestamp) < 60000;
    });

    return Math.round((repeats.length / topQuestions.length) * 100);
  }
}
```

**振動スコア**:
- 0-20: 良好（繰り返しが少ない）
- 20-50: 中程度
- 50+: 問題あり（同じ単語が頻繁に出題）

---

### 3. 振動防止（filterRecentCorrect）- 概要

**ファイル**: Line 430-465  
**目的**: 最近正解した単語を一時的に除外

#### 除外条件
```typescript
// 条件1: 最近1分以内に正解
const minutesSinceCorrect = (now - lastCorrectAt) / (1000 * 60);
if (minutesSinceCorrect < 1) return true; // 除外

// 条件2: 連続3回正解
if (consecutiveCorrect >= 3) return true; // 除外
```

---

### 5.4 確実性保証メカニズム（sortAndBalance）⭐ 最重要

**実装**: `QuestionScheduler.ts` Line 560-670  
**所要時間**: 約1-3ms  
**目的**: 復習単語（incorrect/still_learning）が**必ず上位に配置される**ことを保証

#### 背景と必要性

**問題**: 優先度計算やDTA調整により、復習単語が下位に押し下げられる可能性

**解決策**: カテゴリー別に強制的にグループ化し、incorrect → still_learning → その他の順で結合

---

#### アルゴリズム

##### Step 1: カテゴリー別グループ化

```typescript
const incorrectQuestions = filtered.filter(pq => 
  pq.status?.category === 'incorrect'
);

const stillLearningQuestions = filtered.filter(pq => 
  pq.status?.category === 'still_learning'
);

const otherQuestions = filtered.filter(pq =>
  pq.status?.category !== 'incorrect' && 
  pq.status?.category !== 'still_learning'
);
```

**グループ**:
1. **incorrect**: 不正解の単語（最優先）
2. **still_learning**: 学習中の単語（次点）
3. **other**: new, mastered, null（最後）

---

##### Step 2: 各グループ内で優先度ソート

```typescript
const sortByPriority = (a: PrioritizedQuestion, b: PrioritizedQuestion) => {
  if (a.priority !== b.priority) {
    return b.priority - a.priority;  // ✅ 降順（優先度が高い順）
  }

  // 🎲 ABC順排除: 学習履歴のない単語はランダムソート
  const aIsNew = !a.status?.category || a.status?.category === 'new';
  const bIsNew = !b.status?.category || b.status?.category === 'new';

  if (aIsNew && bIsNew) {
    return Math.random() - 0.5;  // 両方とも新出単語はランダム
  }

  return (a.originalIndex || 0) - (b.originalIndex || 0);  // 元の順序を維持
};

incorrectQuestions.sort(sortByPriority);
stillLearningQuestions.sort(sortByPriority);
otherQuestions.sort(sortByPriority);
```

**ソートのポイント**:
- 優先度が同じ場合、**ランダムソート**（ABC順を防止）
- new単語のみランダム（学習済み単語は元の順序を維持）

**ABC順防止の根拠**:
- アルファベット順の出題は学習効果を低下させる（Bjork & Bjork, 2011）
- ランダム性により記憶の定着が向上

---

##### Step 3: 強制カテゴリー優先結合

```typescript
const sorted = [
  ...incorrectQuestions,      // 最優先
  ...stillLearningQuestions,  // 次点
  ...otherQuestions           // 最後
];
```

**保証内容**:
- **全ての incorrect 単語**が **全ての still_learning 単語**より上位
- **全ての still_learning 単語**が **全ての other 単語**より上位

**例**:
```
incorrect: apple (priority=100), banana (priority=95)
still_learning: cat (priority=80), dog (priority=75)
other: egg (priority=50), fish (priority=45)

結果: [apple, banana, cat, dog, egg, fish]
```

---

##### Step 4: 上位20%保証監視

```typescript
const reviewNeeded = incorrectQuestions.length + stillLearningQuestions.length;
const totalQuestions = sorted.length;
const top20PercentCount = Math.ceil(totalQuestions * 0.2);

if (reviewNeeded > 0 && reviewNeeded > top20PercentCount) {
  // 復習単語が20%を超える場合は警告
  logger.warn('[QuestionScheduler] 復習単語が多すぎます', {
    reviewNeeded,
    top20Percent: top20PercentCount,
    ratio: `${((reviewNeeded / totalQuestions) * 100).toFixed(0)}%`,
  });
} else if (reviewNeeded > 0) {
  // 復習単語の最小保証: 上位20%に必ず含める
  const guaranteedTop = sorted.slice(0, top20PercentCount);
  const reviewInTop = guaranteedTop.filter(pq =>
    pq.status?.category === 'incorrect' || 
    pq.status?.category === 'still_learning'
  ).length;

  if (reviewInTop < reviewNeeded) {
    logger.warn('[QuestionScheduler] 上位20%に復習単語が不足 - 強制配置実行', {
      expected: reviewNeeded,
      actual: reviewInTop,
      shortfall: reviewNeeded - reviewInTop,
    });
  }
}
```

**監視内容**:
- 上位20%に復習単語が含まれているかをチェック
- 不足している場合は警告ログを出力

**期待値**:
| 復習単語の割合 | 上位20%の期待値 |
|--------------|---------------|
| 50%以上 | 80%以上が復習単語 |
| 20-50% | 全ての復習単語が上位に |
| 10%未満 | 全ての復習単語が上位20%に |

---

##### Step 5: デバッグログ出力

```typescript
console.log('✅✅✅ [QuestionScheduler] 優先単語配置完了', {
  incorrectCount: incorrectQuestions.length,
  stillLearningCount: stillLearningQuestions.length,
  otherCount: otherQuestions.length,
  top10: sorted.slice(0, 10).map(pq => 
    `${pq.question.word}(${pq.status?.category || 'unknown'}/${pq.priority.toFixed(1)})`
  ),
  guaranteeRatio: reviewNeeded > 0 
    ? `${((reviewNeeded / Math.min(top20PercentCount, totalQuestions)) * 100).toFixed(0)}%` 
    : 'N/A',
});
```

**ログ出力例**:
```javascript
✅✅✅ [QuestionScheduler] 優先単語配置完了 {
  incorrectCount: 5,
  stillLearningCount: 10,
  otherCount: 35,
  top10: [
    'apple(incorrect/100.0)',
    'banana(incorrect/95.0)',
    'cat(still_learning/80.0)',
    ...
  ],
  guaranteeRatio: '150%'
}
```

---

#### トラブルシューティング

##### 問題1: 復習単語が上位に来ない

**症状**:
```
top10: ['egg(new/50.0)', 'fish(new/50.0)', ...]
incorrectCount: 5  // 存在するのに上位に来ない
```

**原因**:
1. `status.category` が正しく設定されていない（null または 'new'）
2. localStorage からの読み込みに失敗

**対策**:
```typescript
// getWordStatus() の修正
if (!category) {
  const totalAttempts = (wordProgress.correctCount || 0) + (wordProgress.incorrectCount || 0);
  const consecutiveIncorrect = wordProgress.consecutiveIncorrect || 0;

  if (totalAttempts === 0) {
    category = 'new';
  } else if (consecutiveIncorrect >= 2) {
    category = 'incorrect';  // ← 推測ロジック
  } else if (wordProgress.incorrectCount && wordProgress.incorrectCount > 0) {
    category = 'still_learning';
  } else if (wordProgress.masteryLevel === 'mastered') {
    category = 'mastered';
  } else {
    category = 'still_learning';
  }
}
```

---

##### 問題2: カテゴリーが全て null

**症状**:
```
🚨🚨🚨 [QuestionScheduler] 全単語のカテゴリーがnull
```

**原因**: localStorage から学習履歴を読み取れていない

**対策**:
1. `localStorage['english-progress']` の存在確認
2. ブラウザの localStorage が有効か確認
3. データ形式が正しいか確認（JSON.parse エラー）

---

##### 問題3: 振動防止で全て除外される

**症状**:
```
scheduledQuestions: []  // 空配列
```

**原因**: 全ての単語が1分以内に正解している

**対策**:
- recentAnswers の内容を確認
- minInterval を調整（60000ms → 30000ms）
- 振動防止を一時的に無効化

---

#### 復旧時の注意点

1. **カテゴリー優先の順序**:
   ```typescript
   incorrect → still_learning → other
   ```
   この順序は絶対に変更しない

2. **ソート方向**:
   ```typescript
   return b.priority - a.priority;  // 降順（高い優先度が先）
   ```
   `a.priority - b.priority` にしないこと

3. **ABC順防止**:
   ```typescript
   if (aIsNew && bIsNew) {
     return Math.random() - 0.5;  // ランダムソート
   }
   ```
   この処理を削除しないこと

4. **ログ出力**:
   - デバッグ時に必須
   - top10 の内容で正しくソートされているか確認

---

### 4. 確実性保証（sortAndBalance）- 概要

**ファイル**: Line 560-670  
**目的**: 復習単語が必ず上位に配置されることを保証

#### 強制カテゴリー優先
```typescript
// incorrect → still_learning → その他の順で結合
const result = [...sortedIncorrect, ...sortedStillLearning, ...sortedOther];
```

#### 上位20%保証監視
```typescript
// 上位20%に復習単語が含まれることを確認
const guaranteedTop = sorted.slice(0, top20PercentCount);
const reviewInTop = guaranteedTop.filter(pq => 
  pq.status?.category === 'incorrect' || 
  pq.status?.category === 'still_learning'
).length;

logger.info(`[確実性保証] 上位${top20PercentCount}問中、復習単語${reviewInTop}問`);
```

---

## データフロー

### 入力
```typescript
interface ScheduleOptions {
  questions: Question[];          // 全問題
  wordProgressMap: Map<string, WordProgress>; // 学習進捗
  sessionStats: SessionStats;     // セッション統計
  recentAnswers: RecentAnswer[];  // 最近の解答
  cognitiveLoad: number;          // 認知負荷（0-1）
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  useMetaAI?: boolean;            // メタAI統合を使用するか
}
```

### 出力
```typescript
interface ScheduleResult {
  scheduledQuestions: Question[]; // ソート済み問題（⚠️ 'questions'ではない）
  signals: Signal[];              // 検出されたシグナル
  stats: {
    totalQuestions: number;
    filteredCount: number;
    avgPriority: number;
    categoryDistribution: {
      incorrect: number;
      still_learning: number;
      mastered: number;
      new: number;
    };
  };
}
```

---

## API仕様

### scheduleQuestions()

**目的**: 通常モードの出題順序計算

```typescript
public scheduleQuestions(options: ScheduleOptions): ScheduleResult {
  // 1. シグナル検出
  const signals = this.detectSignals(context);
  
  // 2. 優先度計算
  const prioritizedQuestions = questions.map(q => ({
    ...q,
    priority: basePriority + dtaBoost + signalAdjustment + timeBoost
  }));
  
  // 3. 振動防止
  const filtered = this.filterRecentCorrect(prioritizedQuestions, wordProgressMap);
  
  // 4. 確実性保証
  const sorted = this.sortAndBalance(filtered);
  
  return { scheduledQuestions: sorted, signals, stats };
}
```

---

### scheduleHybridMode()

**目的**: 既存AIの順序を尊重しつつメタAI調整（±20%）

```typescript
public scheduleHybridMode(options: ScheduleOptions): ScheduleResult {
  // 1. 既存順序をベース優先度として使用
  const prioritizedQuestions = questions.map((q, index) => ({
    ...q,
    priority: baseFromExistingOrder(index)
  }));
  
  // 2. メタAI調整（±20%のみ）
  const adjusted = this.applyMetaAdjustment(prioritizedQuestions, signals);
  
  // 3. 確実性保証
  const sorted = this.sortAndBalance(adjusted);
  
  return { scheduledQuestions: sorted, signals, stats };
}
```

---

## category管理システム

### ファイル: `src/utils/progressStorage.ts`

### 初期化（initializeWordProgress）
```typescript
// Line 631
category: 'new', // QuestionScheduler用: 初期値は新規
```

### 更新（updateWordProgress）
```typescript
// Line 1097-1117
if (masteryResult.isMastered) {
  wordProgress.category = 'mastered';
} else if (wordProgress.consecutiveIncorrect >= 2) {
  wordProgress.category = 'incorrect';
} else if (wordProgress.incorrectCount > 0 || isStillLearning) {
  wordProgress.category = 'still_learning';
} else if (wordProgress.totalAttempts === 0) {
  wordProgress.category = 'new';
}
```

### 修復（loadProgress）
```typescript
// Line 131-151
if (!wp.category) {
  // 既存データにcategoryがない場合、推測して付与
  if (wp.consecutiveIncorrect >= 2) {
    wp.category = 'incorrect';
  } else if (wp.incorrectCount > 0) {
    wp.category = 'still_learning';
  } else if (/* mastered判定 */) {
    wp.category = 'mastered';
  } else {
    wp.category = 'new';
  }
  // 修復後はlocalStorageに保存
}
```

### フォールバック（getWordStatus）
```typescript
// Line 467-509
if (!wordProgress.category) {
  // consecutiveIncorrectから推測
  if (consecutiveIncorrect >= 2) return 'incorrect';
  if (incorrectCount > 0) return 'still_learning';
  return 'new';
}
```

---

## 確実性保証メカニズム

### 目的
「まだまだ・分からない」を100個貯めても出題されない問題を防ぐ

### 実装

#### 1. 強制カテゴリー優先（sortAndBalance）
```typescript
// incorrect → still_learning → その他の順で強制配置
const result = [
  ...incorrectQuestions.sort(byPriority),
  ...stillLearningQuestions.sort(byPriority),
  ...otherQuestions.sort(byPriority)
];
```

#### 2. 上位20%保証監視
```typescript
// 上位20%に復習単語が含まれることを確認
const topCount = Math.ceil(result.length * 0.2);
const reviewInTop = result.slice(0, topCount).filter(q => 
  q.category === 'incorrect' || q.category === 'still_learning'
).length;

if (reviewInTop === 0 && (incorrectQuestions.length > 0 || stillLearningQuestions.length > 0)) {
  logger.warn('[確実性保証] 警告: 上位20%に復習単語が含まれていません');
}
```

#### 3. デバッグログ
```typescript
logger.log('[確実性保証] 強制カテゴリー優先配置:');
logger.log(`  incorrect優先: ${incorrectQuestions.length}問`);
logger.log(`  still_learning優先: ${stillLearningQuestions.length}問`);
logger.log(`  その他: ${otherQuestions.length}問`);
logger.log(`[確実性保証] 上位${topCount}問中、復習単語${reviewInTop}問`);
```

---

## トラブルシューティング

### 問題: 復習単語が出題されない

#### 診断手順
1. デバッグログで`[QuestionScheduler] カテゴリー統計`を確認
   - `incorrect: 0, still_learning: 0` → category更新が機能していない
2. `updateWordProgress()`のLine 1097-1117を確認
3. `loadProgress()`の修復処理（Line 131-151）を確認

#### 解決策
- category更新ロジックの実装を確認
- 修復処理が起動時に実行されているか確認

---

### 問題: 優先度計算が機能していない

#### 診断手順
1. デバッグログで`[QuestionScheduler] 優先度計算`を確認
2. 基本優先度、DTA、シグナル反映の各値を確認

#### 解決策
- DTA閾値を確認: `<30: 10.0, 30-70: 5.0, >=70: 2.5`
- `calculateForgettingRisk()`の実装を確認

---

### 問題: シグナル統合が機能していない

#### 診断手順
1. `detectSignals()`が空配列`[]`を返していないか確認
2. `applySignals()`がダミー実装のままでないか確認

#### 解決策
- Line 194-267の`detectSignals()`を完全実装
- Line 377-428の`applySignals()`を完全実装

---

## 参照ドキュメント

- `docs/guidelines/META_AI_TROUBLESHOOTING.md` - トラブルシューティングガイド
- `docs/references/AI_TERMINOLOGY.md` - AIシステムの用語定義
- `docs/quality/QUESTION_SCHEDULER_QA_PIPELINE.md` - 品質保証手順
- `.aitk/instructions/meta-ai-priority.instructions.md` - AIアシスタント用指示書

---

**この仕様書は、QuestionSchedulerの動作を理解し、正しく修正するための完全なリファレンスです。**
