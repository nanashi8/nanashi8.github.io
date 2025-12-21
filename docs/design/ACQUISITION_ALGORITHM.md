---
title: 記憶獲得アルゴリズム詳細設計書
created: 2025-12-16
updated: 2025-12-16
status: in-progress
tags: [design, ai]
---

# 記憶獲得アルゴリズム詳細設計書

**バージョン**: 1.0  
**作成日**: 2025年12月16日  
**ステータス**: レビュー待ち

## 1. 概要

「その日のうちに一旦100％記憶を定着させる」ための同日集中復習アルゴリズム。神経科学的な記憶統合プロセスに基づく最適な復習タイミング設計。

---

## 2. 4段階復習システム

### 2.1 復習タイミングの全体像

```
新規単語出題
    ↓
【即時復習】(1-3問後、約1分)
    ↓
【早期復習】(5-10問後、約10分)
    ↓
【中期復習】(20-30問後、約1時間)
    ↓
【終了時復習】(セッション終了時)
    ↓
記憶獲得完了 → 翌日以降の分散学習へ
```

### 2.2 神経科学的根拠

| 復習段階   | タイミング     | 神経科学的意味           | 文献                      |
| ---------- | -------------- | ------------------------ | ------------------------- |
| 即時復習   | 1分            | 作業記憶の統合           | Baddeley (1974)           |
| 早期復習   | 10分           | 海馬のシナプス可塑性     | Dudai (2004)              |
| 中期復習   | 1時間          | タンパク質合成依存の統合 | McGaugh (2000)            |
| 終了時復習 | セッション終了 | 睡眠前の統合促進         | Walker & Stickgold (2006) |

---

## 3. 4種類のキュー管理

### 3.1 即時復習キュー (IMMEDIATE)

```typescript
interface ImmediateQueue {
  type: QueueType.IMMEDIATE;
  targetGap: 1-3; // 問題数
  targetTime: 60000; // 1分 (ms)
  priority: 100; // 最高優先度
  purpose: '作業記憶の統合';
}

function shouldEnqueueImmediate(word: string, difficulty: number): boolean {
  // 難しい単語（difficulty >= 4）は即時復習が必須
  // 簡単な単語（difficulty <= 2）は即時復習スキップ可能
  return difficulty >= 3;
}

function calculateImmediateGap(difficulty: number): number {
  if (difficulty >= 4) return 1; // 超難問: 1問後
  if (difficulty === 3) return 2; // 難問: 2問後
  return 3; // 標準: 3問後
}
```

**デキュー条件**:

- 新規問題出題から1-3問経過
- または約1分経過
- 優先度: 100（最高）

---

### 3.2 早期復習キュー (EARLY)

```typescript
interface EarlyQueue {
  type: QueueType.EARLY;
  targetGap: 5-10; // 問題数
  targetTime: 600000; // 10分 (ms)
  priority: 80;
  purpose: '海馬の初期統合';
}

function shouldEnqueueEarly(word: string, acquisitionProgress: AcquisitionProgress): boolean {
  // 即時復習で正答した単語のみ
  return acquisitionProgress.todayCorrectCount >= 1;
}

function calculateEarlyGap(difficulty: number): number {
  if (difficulty >= 4) return 5;  // 難問: 5問後
  if (difficulty === 3) return 7;  // 標準: 7問後
  return 10; // 簡単: 10問後
}
```

**デキュー条件**:

- 即時復習から5-10問経過
- または約10分経過
- 優先度: 80

---

### 3.3 中期復習キュー (MID)

```typescript
interface MidQueue {
  type: QueueType.MID;
  targetGap: 20-30; // 問題数
  targetTime: 3600000; // 1時間 (ms)
  priority: 60;
  purpose: 'タンパク質合成依存の統合';
}

function shouldEnqueueMid(word: string, acquisitionProgress: AcquisitionProgress): boolean {
  // 早期復習でも正答した単語のみ
  return acquisitionProgress.todayCorrectCount >= 2;
}

function calculateMidGap(difficulty: number): number {
  if (difficulty >= 4) return 20; // 難問: 20問後
  if (difficulty === 3) return 25; // 標準: 25問後
  return 30; // 簡単: 30問後
}
```

**デキュー条件**:

- 早期復習から20-30問経過
- または約1時間経過
- 優先度: 60

---

### 3.4 終了時復習キュー (END)

```typescript
interface EndQueue {
  type: QueueType.END;
  targetGap: Infinity; // セッション終了時
  targetTime: Infinity;
  priority: 40;
  purpose: '睡眠前の統合促進';
}

function shouldEnqueueEnd(word: string, acquisitionProgress: AcquisitionProgress): boolean {
  // 中期復習でも正答した単語のみ
  return acquisitionProgress.todayCorrectCount >= 3;
}
```

**デキュー条件**:

- セッション終了時（ユーザーが「終了」をクリック）
- 優先度: 40

---

## 4. キュー管理の実装詳細

### 4.1 データ構造

```typescript
interface QueueEntry {
  word: string;
  queueType: QueueType;
  enqueuedAt: number; // タイムスタンプ
  enqueuedQuestionNumber: number; // 何問目で追加されたか
  targetQuestionNumber: number; // 何問目で出題すべきか
  targetTime: number; // いつ出題すべきか
  priority: number; // 優先度
  difficulty: number; // 難易度
}

class AcquisitionQueueManager {
  private queues: {
    immediate: QueueEntry[];
    early: QueueEntry[];
    mid: QueueEntry[];
    end: QueueEntry[];
  };

  private currentQuestionNumber: number = 0;
  private sessionStartTime: number = Date.now();
}
```

### 4.2 エンキュー処理

```typescript
function enqueueNewWord(word: string, difficulty: number, category: QuestionCategory): void {
  const now = Date.now();
  this.currentQuestionNumber++;

  // 難易度とカテゴリに基づき適切なキューに追加
  if (shouldEnqueueImmediate(word, difficulty)) {
    const gap = calculateImmediateGap(difficulty);
    this.queues.immediate.push({
      word,
      queueType: QueueType.IMMEDIATE,
      enqueuedAt: now,
      enqueuedQuestionNumber: this.currentQuestionNumber,
      targetQuestionNumber: this.currentQuestionNumber + gap,
      targetTime: now + 60000, // 1分後
      priority: 100,
      difficulty,
    });
  }
}
```

### 4.3 デキュー処理（復習問題の選択）

```typescript
function getNextReviewQuestion(): QueueEntry | null {
  const now = Date.now();
  const currentQ = this.currentQuestionNumber;

  // 全キューから候補を収集
  const candidates: QueueEntry[] = [];

  // 即時復習キュー
  for (const entry of this.queues.immediate) {
    if (currentQ >= entry.targetQuestionNumber || now >= entry.targetTime) {
      candidates.push(entry);
    }
  }

  // 早期復習キュー
  for (const entry of this.queues.early) {
    if (currentQ >= entry.targetQuestionNumber || now >= entry.targetTime) {
      candidates.push(entry);
    }
  }

  // 中期復習キュー
  for (const entry of this.queues.mid) {
    if (currentQ >= entry.targetQuestionNumber || now >= entry.targetTime) {
      candidates.push(entry);
    }
  }

  // 優先度順にソート
  candidates.sort((a, b) => b.priority - a.priority);

  if (candidates.length > 0) {
    const selected = candidates[0];
    this.removeFromQueue(selected);
    return selected;
  }

  return null;
}
```

### 4.4 キューからの削除

```typescript
function removeFromQueue(entry: QueueEntry): void {
  const queueName = entry.queueType;
  const queue = this.queues[queueName];
  const index = queue.findIndex((e) => e.word === entry.word);
  if (index !== -1) {
    queue.splice(index, 1);
  }
}
```

---

## 5. 復習結果のトラッキング

### 5.1 正答時の処理

```typescript
function handleCorrectAnswer(word: string, currentQueue: QueueType): void {
  const progress = getAcquisitionProgress(word);
  progress.todayCorrectCount++;
  progress.todayReviews.push({
    timestamp: Date.now(),
    queueType: currentQueue,
    isCorrect: true,
  });

  // 次のキューへ自動昇格
  if (currentQueue === QueueType.IMMEDIATE && shouldEnqueueEarly(word, progress)) {
    enqueueToEarly(word);
  } else if (currentQueue === QueueType.EARLY && shouldEnqueueMid(word, progress)) {
    enqueueToMid(word);
  } else if (currentQueue === QueueType.MID && shouldEnqueueEnd(word, progress)) {
    enqueueToEnd(word);
  }

  // 記憶獲得完了判定
  if (progress.todayCorrectCount >= 3 && !progress.isAcquisitionComplete) {
    progress.isAcquisitionComplete = true;
    console.log(`✅ 記憶獲得完了: ${word}`);
  }

  saveAcquisitionProgress(word, progress);
}
```

### 5.2 誤答時の処理

```typescript
function handleWrongAnswer(word: string, currentQueue: QueueType): void {
  const progress = getAcquisitionProgress(word);
  progress.todayWrongCount++;
  progress.todayReviews.push({
    timestamp: Date.now(),
    queueType: currentQueue,
    isCorrect: false,
  });

  // 即時復習キューに再追加（リセット）
  if (currentQueue !== QueueType.IMMEDIATE) {
    console.log(`❌ 誤答により即時復習キューに戻します: ${word}`);
    enqueueToImmediate(word, HIGH_DIFFICULTY);
  } else {
    // すでに即時復習中なら、次の問題で再出題
    enqueueToImmediate(word, VERY_HIGH_DIFFICULTY);
  }

  saveAcquisitionProgress(word, progress);
}
```

---

## 6. 記憶獲得完了の判定

### 6.1 完了条件

```typescript
function isAcquisitionComplete(progress: AcquisitionProgress): boolean {
  // 条件1: 同日内に3回以上正答
  if (progress.todayCorrectCount < 3) {
    return false;
  }

  // 条件2: 最低でも3つのキューを通過
  const uniqueQueues = new Set(
    progress.todayReviews.filter((r) => r.isCorrect).map((r) => r.queueType)
  );
  if (uniqueQueues.size < 3) {
    return false;
  }

  // 条件3: 最後の2回が連続正答
  const recentReviews = progress.todayReviews.slice(-2);
  if (recentReviews.length < 2 || !recentReviews.every((r) => r.isCorrect)) {
    return false;
  }

  return true;
}
```

### 6.2 個人パラメータによる調整

```typescript
function getConsolidationThreshold(
  category: QuestionCategory,
  personalParams: PersonalParameters
): number {
  const baseThreshold = getTabConfig(category).consolidationThreshold;
  const adjustedThreshold = baseThreshold / personalParams.learningSpeed;

  // 最小2回、最大5回
  return Math.max(2, Math.min(5, Math.round(adjustedThreshold)));
}
```

**例**:

- 暗記タブ、学習速度1.0 → 3回正答で完了
- 暗記タブ、学習速度2.0 → 2回正答で完了（速い）
- 暗記タブ、学習速度0.5 → 5回正答で完了（遅い）

---

## 7. セッション終了時の処理

### 7.1 終了時復習の実施

```typescript
function startSessionEndReview(): void {
  const endQueue = this.queues.end;

  if (endQueue.length === 0) {
    console.log('終了時復習なし');
    return;
  }

  console.log(`終了時復習を開始します（${endQueue.length}語）`);

  // UI表示切り替え
  showEndReviewMode(true);

  // 終了時復習問題を順次出題
  for (const entry of endQueue) {
    presentQuestion(entry.word);
  }

  showEndReviewMode(false);
}
```

### 7.2 未完了単語のレポート

```typescript
function generateAcquisitionReport(): AcquisitionReport {
  const allWords = getAllWordsSeenToday();
  const completed: string[] = [];
  const incomplete: string[] = [];

  for (const word of allWords) {
    const progress = getAcquisitionProgress(word);
    if (progress.isAcquisitionComplete) {
      completed.push(word);
    } else {
      incomplete.push(word);
    }
  }

  return {
    totalWords: allWords.length,
    completed: completed.length,
    incomplete: incomplete.length,
    completionRate: completed.length / allWords.length,
    incompleteWords: incomplete,
  };
}
```

**UI表示例**:

```
今日の学習結果
━━━━━━━━━━━━━━━━━━━━
記憶獲得完了: 12語 / 15語 (80%)

✅ 完了した単語 (12語):
apple, book, car, ...

⚠️ 未完了の単語 (3語):
difficult, complex, intricate
→ 明日優先的に復習します
```

---

## 8. 最適化とパフォーマンス

### 8.1 キューサイズの制限

```typescript
const MAX_QUEUE_SIZE = {
  immediate: 10, // 最大10語まで同時に即時復習キュー
  early: 20, // 最大20語まで同時に早期復習キュー
  mid: 30, // 最大30語まで同時に中期復習キュー
  end: 50, // 最大50語まで同時に終了時復習キュー
};

function enqueueWithLimit(queue: QueueEntry[], entry: QueueEntry, maxSize: number): void {
  if (queue.length >= maxSize) {
    console.warn(`キューが満杯です（${maxSize}語）。古いエントリを削除します。`);
    queue.shift(); // 最も古いものを削除
  }
  queue.push(entry);
}
```

### 8.2 計算量

- エンキュー: **O(1)**
- デキュー: **O(n)** (n = 全キューサイズ、通常50-100語)
- 削除: **O(n)**

### 8.3 メモリ使用量

- 1語あたり: 約200バイト
- 100語同時管理: 約20KB
- 許容範囲内

---

## 9. エラーハンドリング

### 9.1 重複エンキューの防止

```typescript
function isDuplicateInQueue(word: string, queueType: QueueType): boolean {
  return this.queues[queueType].some((entry) => entry.word === word);
}

function enqueueWithDuplicateCheck(word: string, queueType: QueueType, entry: QueueEntry): void {
  if (isDuplicateInQueue(word, queueType)) {
    console.warn(`重複エンキューを検出: ${word} in ${queueType}`);
    return;
  }
  this.queues[queueType].push(entry);
}
```

### 9.2 古いエントリの自動削除

```typescript
const QUEUE_EXPIRY_TIME = 7200000; // 2時間

function cleanupExpiredEntries(): void {
  const now = Date.now();

  for (const queueType of Object.keys(this.queues)) {
    this.queues[queueType] = this.queues[queueType].filter((entry) => {
      const age = now - entry.enqueuedAt;
      if (age > QUEUE_EXPIRY_TIME) {
        console.warn(`期限切れエントリを削除: ${entry.word}`);
        return false;
      }
      return true;
    });
  }
}
```

### 9.3 無限ループの防止

```typescript
const MAX_SAME_WORD_ATTEMPTS = 10;

function trackWordAttempts(word: string): boolean {
  if (!this.wordAttempts.has(word)) {
    this.wordAttempts.set(word, 0);
  }

  const attempts = this.wordAttempts.get(word)! + 1;
  this.wordAttempts.set(word, attempts);

  if (attempts >= MAX_SAME_WORD_ATTEMPTS) {
    console.error(`同じ単語の試行回数が上限に達しました: ${word}`);
    this.removeFromAllQueues(word);
    return false;
  }

  return true;
}
```

---

## 10. 統計とモニタリング

### 10.1 キュー状態の可視化

```typescript
function getQueueStatistics(): QueueStatistics {
  return {
    immediate: {
      size: this.queues.immediate.length,
      oldestEntry: this.queues.immediate[0]?.enqueuedAt,
      averageWaitTime: calculateAverageWaitTime(this.queues.immediate),
    },
    early: {
      size: this.queues.early.length,
      oldestEntry: this.queues.early[0]?.enqueuedAt,
      averageWaitTime: calculateAverageWaitTime(this.queues.early),
    },
    mid: {
      size: this.queues.mid.length,
      oldestEntry: this.queues.mid[0]?.enqueuedAt,
      averageWaitTime: calculateAverageWaitTime(this.queues.mid),
    },
    end: {
      size: this.queues.end.length,
      oldestEntry: this.queues.end[0]?.enqueuedAt,
      averageWaitTime: 0,
    },
  };
}
```

### 10.2 復習効率の測定

```typescript
function calculateAcquisitionEfficiency(): number {
  const allWords = getAllWordsSeenToday();
  let totalReviewCount = 0;
  let completedCount = 0;

  for (const word of allWords) {
    const progress = getAcquisitionProgress(word);
    totalReviewCount += progress.todayReviews.length;
    if (progress.isAcquisitionComplete) {
      completedCount++;
    }
  }

  // 平均復習回数 = 総復習回数 / 完了単語数
  const avgReviewsPerWord = totalReviewCount / completedCount;

  // 効率 = 理想回数(3) / 実際の平均回数
  const efficiency = 3.0 / avgReviewsPerWord;

  return efficiency;
}
```

**期待値**:

- 効率1.0: 理想的（平均3回で習得）
- 効率0.75: 良好（平均4回で習得）
- 効率0.5: 要改善（平均6回で習得）

---

**承認**: 記憶獲得アルゴリズム設計完了、テストケース定義へ
