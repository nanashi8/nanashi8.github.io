# 適応型学習AIシステム アーキテクチャ設計書
**バージョン**: 1.0  
**作成日**: 2025年12月16日  
**ステータス**: 設計レビュー中

## 1. システム概要

### 1.1 目的
生徒の記憶プロセスを神経科学的に理解し、個人に最適化された学習体験を提供する適応型学習システムを構築する。

### 1.2 核心的な設計思想
1. **2段階システム**: 記憶獲得（同日集中）と記憶保持（分散学習）の分離
2. **神経科学ベース**: 作業記憶→海馬→新皮質の段階的転送プロセス
3. **5段階フェーズ**: ENCODING, INITIAL_CONSOLIDATION, INTRADAY_REVIEW, SHORT_TERM, LONG_TERM
4. **個人化適応**: 学習速度、忘却速度、定着閾値の個別調整

---

## 2. アーキテクチャ図

### 2.1 レイヤー構造

```
┌─────────────────────────────────────────────────────────────┐
│  UI層（React Components）                                    │
│  ┌─────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │Memorization │ │QuizView  │ │Spelling  │ │Grammar   │  │
│  │View         │ │          │ │View      │ │QuizView  │  │
│  └──────┬──────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
│         │             │              │            │         │
└─────────┼─────────────┼──────────────┼────────────┼─────────┘
          │             │              │            │
┌─────────▼─────────────▼──────────────▼────────────▼─────────┐
│  制御層（Strategies）                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  HybridQuestionSelector                             │   │
│  │  - 混合戦略による問題選択                           │   │
│  │  - 優先度計算                                       │   │
│  │  - 動的バランス調整                                 │   │
│  └───────────┬─────────────────────────────────────────┘   │
│              │                                               │
│  ┌───────────▼─────────────────────────────────────────┐   │
│  │  LearningPhaseDetector                              │   │
│  │  - 5段階フェーズ判定                                │   │
│  │  - フェーズ遷移管理                                 │   │
│  │  - 閾値管理                                         │   │
│  └───────────┬─────────────────────────────────────────┘   │
│              │                                               │
└──────────────┼───────────────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────────────┐
│  アルゴリズム層                                              │
│  ┌───────────────────┐  ┌───────────────────────────────┐  │
│  │MemoryAcquisition  │  │MemoryRetentionAlgorithm       │  │
│  │Algorithm          │  │                               │  │
│  │- 即時復習キュー   │  │- 分散学習スケジュール         │  │
│  │- 早期復習キュー   │  │- SuperMemo SM-2統合           │  │
│  │- 中期復習キュー   │  │- 忘却曲線推定                 │  │
│  │- 終了時復習キュー │  │                               │  │
│  └───────────────────┘  └───────────────────────────────┘  │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PersonalParameterEstimator                         │   │
│  │  - 学習速度推定                                     │   │
│  │  - 忘却速度推定                                     │   │
│  │  - 定着閾値推定                                     │   │
│  │  - 最適間隔推定                                     │   │
│  └───────────┬─────────────────────────────────────────┘   │
│              │                                               │
└──────────────┼───────────────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────────────┐
│  データ層（localStorage）                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  QuestionStatus                                     │   │
│  │  - 単語ごとの学習状態                               │   │
│  │  - 復習履歴                                         │   │
│  │  - パフォーマンス統計                               │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  LearningHistory                                    │   │
│  │  - タイムスタンプ付き学習記録                       │   │
│  │  - フェーズ遷移履歴                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PersonalParameters                                 │   │
│  │  - 個人化パラメータ                                 │   │
│  │  - 最終更新日時                                     │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 データフロー

```
┌─────────────┐
│  ユーザー操作 │
│  (スワイプ)  │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────┐
│  UI Component (handleSwipe)          │
│  - 正誤判定                          │
│  - 応答時間記録                      │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  LearningPhaseDetector               │
│  - 現在のフェーズを判定              │
└──────┬───────────────────────────────┘
       │
       ├─[ENCODING/INITIAL/INTRADAY]─►┌─────────────────────────┐
       │                                │MemoryAcquisitionAlgorithm│
       │                                │- 同日復習キューに追加   │
       │                                └─────────────────────────┘
       │
       └─[SHORT_TERM/LONG_TERM]──────►┌─────────────────────────┐
                                        │MemoryRetentionAlgorithm │
                                        │- 分散学習スケジュール更新│
                                        └─────────────────────────┘
                                                 │
                                                 ▼
                                        ┌─────────────────────────┐
                                        │  localStorage更新        │
                                        │  - QuestionStatus        │
                                        │  - LearningHistory       │
                                        └─────────────────────────┘
                                                 │
                                                 ▼
       ┌─────────────────────────────────────────────────────────┐
       │  次の問題選択                                           │
       │  HybridQuestionSelector.selectNextQuestion()            │
       └─────────┬───────────────────────────────────────────────┘
                 │
                 ├─[同日復習キューあり]─►┌─────────────────────┐
                 │                        │immediateQueue を優先  │
                 │                        └─────────────────────┘
                 │
                 └─[キュー空]───────────►┌─────────────────────┐
                                          │混合戦略で選択        │
                                          │(新規60% + 復習40%) │
                                          └─────────────────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────────┐
                                          │ UI Component更新     │
                                          │ - 新しい問題表示     │
                                          └─────────────────────┘
```

---

## 3. コンポーネント詳細設計

### 3.1 LearningPhaseDetector

#### 責務
- 単語の現在の学習フェーズを判定
- フェーズ遷移の可否を判定
- 個人パラメータに基づく閾値調整

#### 入力
- `word: string` - 判定対象の単語
- `status: QuestionStatus` - 単語の学習状態

#### 出力
- `LearningPhase` - 判定されたフェーズ

#### 判定ロジック（決定木）
```
status.reviewCount === 0
  ├─ Yes → ENCODING（初見）
  └─ No → 次へ

now - status.lastReviewTime < 30000
  ├─ Yes → ENCODING（作業記憶段階）
  └─ No → 次へ

status.correctCount === 1 && now - status.lastCorrectTime < 3600000
  ├─ Yes → INITIAL_CONSOLIDATION（初期統合）
  └─ No → 次へ

isSameDay(now, status.lastCorrectTime) && status.correctCount >= 2
  ├─ Yes → INTRADAY_REVIEW（同日復習）
  └─ No → 次へ

daysSinceLastReview >= 1 && daysSinceLastReview <= 7
  ├─ Yes → correctRate >= 0.5 && correctRate < 0.8
  │         ├─ Yes → SHORT_TERM
  │         └─ No → 次へ
  └─ No → 次へ

daysSinceLastReview > 7
  ├─ Yes → correctRate >= 0.8 && averageResponseTime < 1500
  │         ├─ Yes → LONG_TERM
  │         └─ No → SHORT_TERM
  └─ No → SHORT_TERM（デフォルト）
```

#### エッジケース
1. **初見単語**: `reviewCount === 0` → ENCODING
2. **1000日以上放置**: `daysSinceLastReview > 1000` → ENCODING（リセット）
3. **100回連続正答**: `consecutiveCorrect >= 100` → LONG_TERM（確実に定着）
4. **100回連続誤答**: `consecutiveWrong >= 100` → ENCODING（完全に忘却）
5. **応答時間0ms**: `responseTime === 0` → エラー、デフォルト値1000msを使用
6. **タイムスタンプ未来**: `lastReviewTime > now` → エラー、nowを使用

---

### 3.2 MemoryAcquisitionAlgorithm

#### 責務
- 同日内の集中復習スケジュール管理
- 4種類のキュー管理（immediate, early, mid, end）
- 記憶獲得完了判定

#### キュー構造
```typescript
interface QueueSystem {
  immediate: {
    words: string[];           // 単語リスト
    interval: number;          // 1-3問後
    targetPhase: 'INITIAL';    // 目標フェーズ
  };
  early: {
    words: string[];
    interval: number;          // 5-10問後（約10分）
    targetPhase: 'INTRADAY';
  };
  mid: {
    words: string[];
    interval: number;          // 20-30問後（約1時間）
    targetPhase: 'INTRADAY';
  };
  end: {
    words: string[];
    timing: 'SESSION_END';     // セッション終了時
    targetPhase: 'INTRADAY';
  };
}
```

#### キュー操作
1. **enqueue(word, queueType)**: 単語をキューに追加
2. **dequeue(queueType)**: キューから単語を取得
3. **peek(queueType)**: キューの先頭を確認（取得しない）
4. **clear(queueType)**: キューをクリア
5. **getQueueSize(queueType)**: キューのサイズ取得

#### 復習タイミング計算
```typescript
function calculateNextReview(word: string, performance: Performance): number {
  const phase = detectPhase(word);
  const personalParams = getPersonalParameters();
  
  switch (phase) {
    case 'ENCODING':
      // 即時復習（1-3問後）
      return Math.floor(1 + Math.random() * 2);
    
    case 'INITIAL_CONSOLIDATION':
      // 早期復習（5-10問後）
      const baseInterval = 5;
      const adjustment = personalParams.learningSpeed;
      return Math.floor(baseInterval * adjustment + Math.random() * 5);
    
    case 'INTRADAY_REVIEW':
      // 中期復習（20-30問後）
      const midInterval = 20;
      return Math.floor(midInterval * adjustment + Math.random() * 10);
    
    default:
      return 0; // フェーズ2に移行
  }
}
```

#### 記憶獲得完了判定
```typescript
function isAcquisitionComplete(word: string): boolean {
  const status = getQuestionStatus(word);
  const config = getTabConfig(status.category);
  
  // 同日内に閾値回数以上正答
  const intradayCorrect = countIntradayCorrect(word);
  return intradayCorrect >= config.consolidationThreshold;
}
```

---

### 3.3 MemoryRetentionAlgorithm

#### 責務
- 分散学習スケジュール管理
- SuperMemo SM-2統合
- 忘却曲線推定

#### 分散学習スケジュール
```typescript
interface RetentionSchedule {
  nextReviewDate: number;      // 次回復習日時
  interval: number;            // 現在の間隔（日数）
  easeFactor: number;          // SuperMemo EF（2.5基準）
  reviewCount: number;         // 復習回数
  stage: 'FIXED' | 'SUPERMEMO'; // 固定間隔 or SuperMemo
}

// 固定間隔（SHORT_TERM）
const FIXED_INTERVALS = [1, 3, 7]; // 日

// SuperMemo SM-2（LONG_TERM）
function calculateSuperMemoInterval(
  prevInterval: number,
  easeFactor: number,
  quality: number // 0-5
): number {
  if (quality < 3) {
    return 1; // リセット
  }
  
  const newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  const clampedEF = Math.max(1.3, newEF);
  
  if (prevInterval === 0) return 1;
  if (prevInterval === 1) return 6;
  return Math.round(prevInterval * clampedEF);
}
```

#### 忘却曲線推定
```typescript
interface ForgettingCurve {
  halfLife: number;            // 半減期（日数）
  initialStrength: number;     // 初期記憶強度（0-1）
  currentStrength: number;     // 現在の記憶強度（0-1）
}

// Ebbinghausモデル
function estimateMemoryStrength(
  word: string,
  daysSinceLastReview: number
): number {
  const halfLife = estimateHalfLife(word);
  const initialStrength = 1.0;
  
  // R = e^(-t/S)
  // R: 保持率, t: 経過時間, S: 記憶強度
  return initialStrength * Math.exp(-daysSinceLastReview / halfLife);
}

function estimateHalfLife(word: string): number {
  const history = getLearningHistory(word);
  const personalParams = getPersonalParameters();
  
  // 個人の忘却速度を考慮
  const baseHalfLife = 2; // 標準2日
  return baseHalfLife / personalParams.forgettingSpeed;
}
```

---

### 3.4 PersonalParameterEstimator

#### 責務
- 学習履歴から個人パラメータを推定
- 統計的手法による推定
- パラメータの信頼区間計算

#### 推定アルゴリズム

##### 学習速度推定
```typescript
function estimateLearningSpeed(history: LearningHistory[]): number {
  // 最近30語の習得時間を分析
  const recentWords = history.slice(-30);
  const acquisitionTimes: number[] = [];
  
  for (const word of recentWords) {
    const firstSeen = word.timestamps[0];
    const acquisitionComplete = word.timestamps.find(t => 
      isAcquisitionComplete(word.word, t)
    );
    
    if (acquisitionComplete) {
      const timeToAcquire = (acquisitionComplete - firstSeen) / 86400000; // 日数
      acquisitionTimes.push(timeToAcquire);
    }
  }
  
  // 外れ値除去（IQR法）
  const cleaned = removeOutliers(acquisitionTimes);
  
  // 平均習得時間 / 標準時間（3日）
  const avgTime = mean(cleaned);
  const standardTime = 3;
  
  return avgTime / standardTime; // 1.0が標準
}
```

##### 忘却速度推定
```typescript
function estimateForgettingSpeed(history: LearningHistory[]): number {
  // 最近50語の忘却パターンを分析
  const recentReviews = history.slice(-50);
  const forgettingRates: number[] = [];
  
  for (const review of recentReviews) {
    if (review.daysSinceLastReview > 0) {
      const expectedStrength = 1.0 * Math.exp(-review.daysSinceLastReview / 2);
      const actualStrength = review.isCorrect ? 1.0 : 0.0;
      
      // 実際の忘却速度を推定
      const forgettingRate = -Math.log(actualStrength || 0.01) / review.daysSinceLastReview;
      forgettingRates.push(forgettingRate);
    }
  }
  
  // Ebbinghaus標準傾きとの比率
  const standardRate = -Math.log(0.33) / 1; // 1日で33%
  const personalRate = median(forgettingRates);
  
  return personalRate / standardRate; // 1.0が標準
}
```

##### 定着閾値推定
```typescript
function estimateConsolidationThreshold(history: LearningHistory[]): number {
  // 習得済み単語の復習回数を分析
  const consolidatedWords = history.filter(h => h.isConsolidated);
  const reviewCounts = consolidatedWords.map(h => h.reviewCount);
  
  // 中央値を閾値とする
  const threshold = median(reviewCounts);
  
  // 2-5回の範囲にクランプ
  return Math.max(2, Math.min(5, Math.round(threshold)));
}
```

---

### 3.5 HybridQuestionSelector

#### 責務
- 混合戦略による問題選択
- 優先度計算
- 動的バランス調整

#### 優先度計算
```typescript
interface Priority {
  word: string;
  score: number;              // 0-100
  reason: string;             // デバッグ用
}

function calculatePriority(question: Question, phase: LearningPhase): number {
  let score = 0;
  
  // フェーズ別の基本優先度
  const phaseWeights = {
    ENCODING: 80,              // 新規単語は高優先
    INITIAL_CONSOLIDATION: 90, // 初期統合は最優先
    INTRADAY_REVIEW: 85,       // 同日復習は高優先
    SHORT_TERM: 50,            // 短期記憶は中優先
    LONG_TERM: 30              // 長期記憶は低優先
  };
  score += phaseWeights[phase];
  
  // 復習タイミングの緊急度
  const daysSinceLastReview = getDaysSinceLastReview(question.word);
  const optimalInterval = getOptimalInterval(question.word);
  const urgency = Math.max(0, daysSinceLastReview - optimalInterval);
  score += urgency * 5;
  
  // 忘却リスク
  const memoryStrength = estimateMemoryStrength(question.word, daysSinceLastReview);
  if (memoryStrength < 0.5) {
    score += 20; // 忘却リスク高い
  }
  
  // 連続誤答回数
  const consecutiveWrong = getConsecutiveWrong(question.word);
  score += consecutiveWrong * 10;
  
  // ランダム性（±10点）
  score += (Math.random() - 0.5) * 20;
  
  return Math.max(0, Math.min(100, score));
}
```

#### 混合戦略
```typescript
function selectNextQuestion(
  candidates: Question[],
  strategy: HybridStrategy
): Question {
  // 1. 同日復習キューを最優先
  const immediateReview = acquisitionAlgo.peek('immediate');
  if (immediateReview) {
    return acquisitionAlgo.dequeue('immediate');
  }
  
  const earlyReview = acquisitionAlgo.peek('early');
  if (earlyReview && questionCount >= 5) {
    return acquisitionAlgo.dequeue('early');
  }
  
  const midReview = acquisitionAlgo.peek('mid');
  if (midReview && questionCount >= 20) {
    return acquisitionAlgo.dequeue('mid');
  }
  
  // 2. 混合戦略（新規 vs 復習）
  const newWords = candidates.filter(q => detectPhase(q.word) === 'ENCODING');
  const reviewWords = candidates.filter(q => detectPhase(q.word) !== 'ENCODING');
  
  const ratio = strategy.acquisitionRatio;
  const shouldSelectNew = Math.random() < ratio;
  
  const pool = shouldSelectNew && newWords.length > 0 ? newWords : reviewWords;
  
  // 3. 優先度順にソート
  const scored = pool.map(q => ({
    question: q,
    priority: calculatePriority(q, detectPhase(q.word))
  }));
  
  scored.sort((a, b) => b.priority - a.priority);
  
  // 4. 上位3つからランダム選択（多様性確保）
  const topCandidates = scored.slice(0, 3);
  const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];
  
  return selected.question;
}
```

---

## 4. エラーハンドリング戦略

### 4.1 データ整合性エラー
```typescript
try {
  const status = getQuestionStatus(word);
} catch (error) {
  console.error('Failed to get question status', error);
  // デフォルト値で続行
  return createDefaultQuestionStatus(word);
}
```

### 4.2 localStorage容量超過
```typescript
try {
  localStorage.setItem('english-progress', JSON.stringify(data));
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    // 古いデータを削除
    cleanupOldData();
    // 再試行
    localStorage.setItem('english-progress', JSON.stringify(data));
  }
}
```

### 4.3 無限ループ防止
```typescript
function selectNextQuestion(candidates: Question[]): Question {
  const maxAttempts = 100;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const question = _selectNextQuestion(candidates);
    
    // 同じ問題が連続しないようにチェック
    if (question.word !== lastQuestion?.word) {
      return question;
    }
    
    attempts++;
  }
  
  // フォールバック: ランダム選択
  return candidates[Math.floor(Math.random() * candidates.length)];
}
```

---

## 5. パフォーマンス要件

### 5.1 応答時間
- **フェーズ判定**: <1ms
- **次の問題選択**: <10ms
- **localStorage読み書き**: <5ms
- **全体レイテンシ**: <20ms

### 5.2 メモリ使用量
- **キュー管理**: 最大1000単語
- **履歴保持**: 最大10,000エントリ
- **localStorage**: 最大5MB

### 5.3 スケーラビリティ
- **単語数**: 10,000単語まで対応
- **ユーザー数**: 単一ユーザー（ブラウザローカル）
- **同時セッション**: 1セッション

---

## 6. セキュリティとプライバシー

### 6.1 データ保存
- 全データはlocalStorageにのみ保存
- サーバーへのデータ送信なし
- 完全オフライン動作

### 6.2 データ保護
- XSS対策: React標準のエスケープ
- CSRF対策: 不要（サーバー通信なし）

---

## 7. 設計レビューチェックリスト

- [x] アーキテクチャ図が明確
- [x] データフローが明確
- [x] 各コンポーネントの責務が明確
- [x] エッジケースが洗い出されている
- [x] エラーハンドリング戦略が定義されている
- [x] パフォーマンス要件が定義されている
- [x] セキュリティが考慮されている

---

**承認**: 設計レビュー完了、実装フェーズへ進む
