# フェーズ判定アルゴリズム詳細設計書
**バージョン**: 1.0  
**作成日**: 2025年12月16日  
**ステータス**: レビュー待ち

## 1. 概要

5段階の学習フェーズを判定するアルゴリズムの詳細設計。神経科学的根拠に基づき、単語の学習状態を正確に分類する。

---

## 2. 判定アルゴリズム完全決定木

```
入力: word (string), status (QuestionStatus)
出力: LearningPhase

START
  │
  ├─ [条件1] status.reviewCount === 0
  │   ├─ YES → 【ENCODING】終了（初見単語）
  │   └─ NO → 続行
  │
  ├─ [条件2] now - status.lastReviewTime < 30000
  │   ├─ YES → 【ENCODING】終了（作業記憶段階、30秒以内）
  │   └─ NO → 続行
  │
  ├─ [条件3] status.correctCount === 0
  │   ├─ YES → 【ENCODING】終了（まだ一度も正答していない）
  │   └─ NO → 続行
  │
  ├─ [条件4] status.correctCount === 1 AND 
  │          (now - status.lastCorrectTime < 3600000)
  │   ├─ YES → 【INITIAL_CONSOLIDATION】終了（初回正答後1時間以内）
  │   └─ NO → 続行
  │
  ├─ [条件5] isSameDay(now, status.lastCorrectTime) AND
  │          status.correctCount >= 2
  │   ├─ YES → 【INTRADAY_REVIEW】終了（同日内2回以上正答）
  │   └─ NO → 続行
  │
  ├─ [条件6] daysSinceLastReview >= 1 AND daysSinceLastReview <= 7
  │   ├─ YES → 
  │   │   ├─ [条件6a] correctRate >= 0.5 AND correctRate < 0.8
  │   │   │   ├─ YES → 【SHORT_TERM】終了
  │   │   │   └─ NO → 続行
  │   │   └─ [条件6b] correctRate < 0.5
  │   │       └─ YES → 【ENCODING】終了（忘却、リセット）
  │   └─ NO → 続行
  │
  ├─ [条件7] daysSinceLastReview > 7
  │   ├─ YES →
  │   │   ├─ [条件7a] correctRate >= 0.8 AND
  │   │   │           averageResponseTime < 1500
  │   │   │   ├─ YES → 【LONG_TERM】終了（長期記憶確立）
  │   │   │   └─ NO → 続行
  │   │   ├─ [条件7b] correctRate >= 0.5 AND correctRate < 0.8
  │   │   │   └─ YES → 【SHORT_TERM】終了（まだ不安定）
  │   │   └─ [条件7c] correctRate < 0.5
  │   │       └─ YES → 【ENCODING】終了（完全に忘却）
  │   └─ NO → 続行
  │
  └─ [デフォルト] → 【SHORT_TERM】終了（その他のケース）

END
```

---

## 3. 各条件の詳細説明

### 条件1: 初見判定
```typescript
if (status.reviewCount === 0) {
  return LearningPhase.ENCODING;
}
```
**根拠**: 一度も学習していない単語は作業記憶段階  
**神経科学**: 前頭前野での初期エンコーディング  
**期待される割合**: 新規単語のみ（セッションあたり0-10語）

---

### 条件2: 作業記憶段階判定（30秒以内）
```typescript
const now = Date.now();
const timeSinceLastReview = now - status.lastReviewTime;

if (timeSinceLastReview < 30000) { // 30秒
  return LearningPhase.ENCODING;
}
```
**根拠**: 作業記憶の保持時間は約30秒（Miller, 1956）  
**神経科学**: 前頭前野の一時的活性化  
**期待される割合**: 即時復習中の単語（セッションあたり1-5語）

---

### 条件3: 未正答判定
```typescript
if (status.correctCount === 0) {
  return LearningPhase.ENCODING;
}
```
**根拠**: 一度も正答していない単語はまだ記憶されていない  
**期待される割合**: 難しい単語（全体の5-10%）

---

### 条件4: 初期統合段階判定（1回正答、1時間以内）
```typescript
const hoursSinceCorrect = (now - status.lastCorrectTime) / 3600000;

if (status.correctCount === 1 && hoursSinceCorrect < 1) {
  return LearningPhase.INITIAL_CONSOLIDATION;
}
```
**根拠**: 海馬の初期統合は約1時間（Dudai, 2004）  
**神経科学**: 海馬でのシナプス統合開始  
**期待される割合**: 最近正答した単語（セッションあたり3-8語）

---

### 条件5: 同日復習段階判定（同日内2回以上正答）
```typescript
function isSameDay(timestamp1: number, timestamp2: number): boolean {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

if (isSameDay(now, status.lastCorrectTime) && status.correctCount >= 2) {
  return LearningPhase.INTRADAY_REVIEW;
}
```
**根拠**: 同日内の複数回正答は記憶獲得の進行を示す  
**神経科学**: 海馬の統合プロセス進行中  
**期待される割合**: 積極的に学習中の単語（セッションあたり5-15語）

---

### 条件6: 短期記憶段階判定（1-7日、正答率50-80%）
```typescript
const daysSinceLastReview = timeSinceLastReview / 86400000;
const correctRate = status.correctCount / status.reviewCount;

if (daysSinceLastReview >= 1 && daysSinceLastReview <= 7) {
  if (correctRate >= 0.5 && correctRate < 0.8) {
    return LearningPhase.SHORT_TERM;
  } else if (correctRate < 0.5) {
    return LearningPhase.ENCODING; // 忘却リセット
  }
}
```
**根拠**: 海馬から新皮質への転送期間は約7日（Squire & Alvarez, 1995）  
**神経科学**: システム統合段階  
**期待される割合**: 最近学習した単語（全体の20-30%）

---

### 条件7: 長期記憶段階判定（7日以上、正答率80%以上、応答時間<1.5秒）
```typescript
if (daysSinceLastReview > 7) {
  if (correctRate >= 0.8 && status.averageResponseTime < 1500) {
    return LearningPhase.LONG_TERM;
  } else if (correctRate >= 0.5 && correctRate < 0.8) {
    return LearningPhase.SHORT_TERM;
  } else {
    return LearningPhase.ENCODING; // 完全忘却
  }
}
```
**根拠**: 新皮質への定着には7日以上必要  
**神経科学**: 大脳新皮質での長期保存  
**応答時間の意味**: 1.5秒以下は自動化された記憶（Anderson, 1982）  
**期待される割合**: 習得済み単語（全体の40-60%）

---

## 4. エッジケースの処理

### 4.1 超長期放置（1000日以上）
```typescript
const MAX_DAYS_THRESHOLD = 1000;

if (daysSinceLastReview > MAX_DAYS_THRESHOLD) {
  return LearningPhase.ENCODING; // 完全リセット
}
```
**理由**: 1000日以上放置された単語は事実上忘却している

---

### 4.2 超高頻度正答（100回以上連続正答）
```typescript
const MASTERY_THRESHOLD = 100;

if (status.consecutiveCorrect >= MASTERY_THRESHOLD) {
  return LearningPhase.LONG_TERM; // 確実に定着
}
```
**理由**: 100回連続正答は完全習得を示す

---

### 4.3 超高頻度誤答（100回以上連続誤答）
```typescript
const RESET_THRESHOLD = 100;

if (status.consecutiveWrong >= RESET_THRESHOLD) {
  return LearningPhase.ENCODING; // 完全リセット
}
```
**理由**: 学習方法の見直しが必要

---

### 4.4 応答時間異常（0msまたは異常値）
```typescript
function sanitizeResponseTime(responseTime: number): number {
  if (responseTime <= 0 || responseTime > 60000) {
    return 1000; // デフォルト1秒
  }
  return responseTime;
}
```
**理由**: 計測エラーへの対応

---

### 4.5 タイムスタンプ異常（未来の日付）
```typescript
function sanitizeTimestamp(timestamp: number, now: number): number {
  if (timestamp > now) {
    console.warn(`Future timestamp detected: ${timestamp}`);
    return now;
  }
  return timestamp;
}
```
**理由**: システムクロックのズレへの対応

---

## 5. フェーズ遷移パターン

### 5.1 正常な学習フロー
```
ENCODING
  ↓ (初回正答)
INITIAL_CONSOLIDATION
  ↓ (2回目正答、同日内)
INTRADAY_REVIEW
  ↓ (3回正答完了、翌日以降)
SHORT_TERM
  ↓ (7日以上経過、正答率80%以上)
LONG_TERM
```

### 5.2 忘却による退行フロー
```
LONG_TERM
  ↓ (正答率80%未満に低下)
SHORT_TERM
  ↓ (正答率50%未満に低下)
ENCODING
```

### 5.3 高速学習フロー（スキップあり）
```
ENCODING
  ↓ (1日で3回正答、高い正答率維持)
SHORT_TERM
  ↓ (すぐに7日経過、高正答率)
LONG_TERM
```

---

## 6. 個人パラメータによる閾値調整

### 6.1 学習速度による調整
```typescript
function adjustThresholds(
  baseThresholds: PhaseThresholds,
  personalParams: PersonalParameters
): PhaseThresholds {
  return {
    encodingTime: baseThresholds.encodingTime,
    initialConsolidation: baseThresholds.initialConsolidation / personalParams.learningSpeed,
    intradayWindow: baseThresholds.intradayWindow,
    shortTermWindow: baseThresholds.shortTermWindow / personalParams.learningSpeed,
    longTermThreshold: baseThresholds.longTermThreshold / personalParams.learningSpeed,
    correctRateThreshold: baseThresholds.correctRateThreshold,
    responseTimeThreshold: baseThresholds.responseTimeThreshold * personalParams.learningSpeed
  };
}
```

**例**: 
- 学習速度2.0（速い）→ 統合時間を半分に
- 学習速度0.5（遅い）→ 統合時間を2倍に

---

## 7. デバッグとロギング

### 7.1 判定理由のロギング
```typescript
interface PhaseDetectionResult {
  phase: LearningPhase;
  reason: string;
  matchedCondition: number;
  metrics: {
    reviewCount: number;
    correctCount: number;
    correctRate: number;
    daysSinceLastReview: number;
    timeSinceLastReview: number;
    averageResponseTime: number;
  };
}

function detectPhaseWithReason(
  word: string,
  status: QuestionStatus
): PhaseDetectionResult {
  const now = Date.now();
  const timeSinceLastReview = now - status.lastReviewTime;
  const daysSinceLastReview = timeSinceLastReview / 86400000;
  const correctRate = status.reviewCount > 0 
    ? status.correctCount / status.reviewCount 
    : 0;
  
  // 条件1
  if (status.reviewCount === 0) {
    return {
      phase: LearningPhase.ENCODING,
      reason: '初見単語（reviewCount=0）',
      matchedCondition: 1,
      metrics: { reviewCount: 0, correctCount: 0, correctRate: 0, 
                 daysSinceLastReview: 0, timeSinceLastReview: 0,
                 averageResponseTime: 0 }
    };
  }
  
  // 条件2
  if (timeSinceLastReview < 30000) {
    return {
      phase: LearningPhase.ENCODING,
      reason: `作業記憶段階（${Math.round(timeSinceLastReview/1000)}秒前）`,
      matchedCondition: 2,
      metrics: { reviewCount: status.reviewCount, 
                 correctCount: status.correctCount, 
                 correctRate, daysSinceLastReview, 
                 timeSinceLastReview,
                 averageResponseTime: status.averageResponseTime }
    };
  }
  
  // ... 他の条件も同様
  
  // デフォルト
  return {
    phase: LearningPhase.SHORT_TERM,
    reason: 'デフォルト判定',
    matchedCondition: 0,
    metrics: { reviewCount: status.reviewCount, 
               correctCount: status.correctCount, 
               correctRate, daysSinceLastReview, 
               timeSinceLastReview,
               averageResponseTime: status.averageResponseTime }
  };
}
```

### 7.2 フェーズ分布の監視
```typescript
function analyzePhaseDistribution(): Record<LearningPhase, number> {
  const allWords = getAllWords();
  const distribution: Record<LearningPhase, number> = {
    [LearningPhase.ENCODING]: 0,
    [LearningPhase.INITIAL_CONSOLIDATION]: 0,
    [LearningPhase.INTRADAY_REVIEW]: 0,
    [LearningPhase.SHORT_TERM]: 0,
    [LearningPhase.LONG_TERM]: 0
  };
  
  for (const word of allWords) {
    const phase = detectPhase(word);
    distribution[phase]++;
  }
  
  return distribution;
}
```

**期待される分布** (1000語の場合):
- ENCODING: 50-100語 (5-10%)
- INITIAL_CONSOLIDATION: 30-80語 (3-8%)
- INTRADAY_REVIEW: 50-150語 (5-15%)
- SHORT_TERM: 200-300語 (20-30%)
- LONG_TERM: 400-600語 (40-60%)

---

## 8. パフォーマンス最適化

### 8.1 キャッシング戦略
```typescript
class PhaseDetectorWithCache {
  private cache: Map<string, { phase: LearningPhase; timestamp: number }>;
  private CACHE_DURATION = 5000; // 5秒
  
  detectPhase(word: string): LearningPhase {
    const now = Date.now();
    const cached = this.cache.get(word);
    
    if (cached && now - cached.timestamp < this.CACHE_DURATION) {
      return cached.phase;
    }
    
    const phase = this._detectPhaseUncached(word);
    this.cache.set(word, { phase, timestamp: now });
    
    return phase;
  }
}
```

### 8.2 計算量
- 時間計算性: **O(1)** (全て定数時間の条件チェック)
- 空間計算量: **O(1)** (固定サイズのデータ)

---

## 9. テスト戦略

### 9.1 単体テストカバレッジ
- 各条件の境界値テスト: 20ケース
- フェーズ遷移テスト: 15ケース
- エッジケーステスト: 10ケース
- **合計**: 45ケース

### 9.2 統合テストシナリオ
- 30問の学習フロー: 10パターン

---

**承認**: アルゴリズム設計完了、プロトタイプ実装へ
