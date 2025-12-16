# データモデル定義書
**バージョン**: 1.0  
**作成日**: 2025年12月16日  
**ステータス**: 確定

## 1. 概要

本ドキュメントは適応型学習AIシステムで使用される全てのデータ構造を定義する。

---

## 2. Enum定義

### 2.1 LearningPhase（学習フェーズ）

```typescript
/**
 * 単語の学習フェーズを表す5段階の列挙型
 * 神経科学的な記憶プロセスに基づく
 */
enum LearningPhase {
  /** エンコーディング（0-30秒）: 作業記憶段階 */
  ENCODING = 'encoding',
  
  /** 初期統合（1分-1時間）: 海馬の初期統合 */
  INITIAL_CONSOLIDATION = 'initial',
  
  /** 同日復習（1-24時間）: 同日内の強化 */
  INTRADAY_REVIEW = 'intraday',
  
  /** 短期記憶（1-7日）: 海馬→新皮質転送期間 */
  SHORT_TERM = 'short_term',
  
  /** 長期記憶（7日以上）: 新皮質保存期間 */
  LONG_TERM = 'long_term'
}
```

### 2.2 QuestionCategory（問題カテゴリ）

```typescript
/**
 * 問題の種類
 */
enum QuestionCategory {
  /** 暗記タブ */
  MEMORIZATION = 'memorization',
  
  /** 和訳タブ */
  TRANSLATION = 'translation',
  
  /** スペルタブ */
  SPELLING = 'spelling',
  
  /** 文法タブ */
  GRAMMAR = 'grammar'
}
```

### 2.3 QueueType（キュータイプ）

```typescript
/**
 * 同日復習キューの種類
 */
enum QueueType {
  /** 即時復習（1-3問後、約1分） */
  IMMEDIATE = 'immediate',
  
  /** 早期復習（5-10問後、約10分） */
  EARLY = 'early',
  
  /** 中期復習（20-30問後、約1時間） */
  MID = 'mid',
  
  /** 終了時復習（セッション終了時） */
  END = 'end'
}
```

---

## 3. コアデータ構造

### 3.1 QuestionStatus（問題状態）

```typescript
/**
 * 単語ごとの学習状態を保持
 * localStorageに永続化される
 */
interface QuestionStatus {
  /** 単語（英語） */
  word: string;
  
  /** 問題カテゴリ */
  category: QuestionCategory;
  
  /** 総復習回数 */
  reviewCount: number;
  
  /** 正答回数 */
  correctCount: number;
  
  /** 誤答回数 */
  wrongCount: number;
  
  /** 最終復習日時（UNIXタイムスタンプ ms） */
  lastReviewTime: number;
  
  /** 最終正答日時（UNIXタイムスタンプ ms） */
  lastCorrectTime: number;
  
  /** 平均応答時間（ms） */
  averageResponseTime: number;
  
  /** 連続正答回数 */
  consecutiveCorrect: number;
  
  /** 連続誤答回数 */
  consecutiveWrong: number;
  
  /** 現在のフェーズ */
  phase: LearningPhase;
  
  /** 記憶獲得進捗（フェーズ1） */
  acquisitionProgress: AcquisitionProgress;
  
  /** 記憶保持スケジュール（フェーズ2） */
  retentionSchedule: RetentionSchedule;
  
  /** 初回学習日時 */
  firstSeenTime: number;
  
  /** 最終更新日時 */
  lastUpdated: number;
}
```

### 3.2 AcquisitionProgress（記憶獲得進捗）

```typescript
/**
 * 同日内の記憶獲得進捗を追跡
 */
interface AcquisitionProgress {
  /** 今日最初に学習した時刻 */
  todayFirstSeen: number;
  
  /** 今日の正答回数 */
  todayCorrectCount: number;
  
  /** 今日の誤答回数 */
  todayWrongCount: number;
  
  /** 記憶獲得完了（閾値回数以上正答） */
  isAcquisitionComplete: boolean;
  
  /** 現在所属しているキュー */
  currentQueue: QueueType | null;
  
  /** キューに追加された時刻 */
  queuedAt: number | null;
  
  /** キューに追加された問題番号 */
  queuedQuestionNumber: number | null;
  
  /** 復習履歴（今日のみ） */
  todayReviews: {
    timestamp: number;
    isCorrect: boolean;
    responseTime: number;
    questionNumber: number;
  }[];
}
```

### 3.3 RetentionSchedule（記憶保持スケジュール）

```typescript
/**
 * 分散学習のスケジュール情報
 */
interface RetentionSchedule {
  /** 次回復習予定日時 */
  nextReviewDate: number;
  
  /** 現在の復習間隔（日数） */
  currentInterval: number;
  
  /** SuperMemo Ease Factor */
  easeFactor: number;
  
  /** 分散学習の復習回数 */
  spacingReviewCount: number;
  
  /** スケジュールの段階 */
  stage: 'FIXED' | 'SUPERMEMO';
  
  /** 固定間隔のインデックス（FIXED時のみ） */
  fixedIntervalIndex: number;
  
  /** 最後にSuperMemoを実行した日時 */
  lastSuperMemoUpdate: number | null;
}
```

### 3.4 LearningHistory（学習履歴）

```typescript
/**
 * 個別の学習記録
 * 統計分析や個人パラメータ推定に使用
 */
interface LearningHistory {
  /** 記録ID（自動生成） */
  id: string;
  
  /** タイムスタンプ */
  timestamp: number;
  
  /** 単語 */
  word: string;
  
  /** 問題カテゴリ */
  category: QuestionCategory;
  
  /** 正誤 */
  isCorrect: boolean;
  
  /** 応答時間（ms） */
  responseTime: number;
  
  /** その時点のフェーズ */
  phase: LearningPhase;
  
  /** 難易度（0-1） */
  difficulty: number;
  
  /** 最終復習からの経過日数 */
  daysSinceLastReview: number;
  
  /** その時点の正答率 */
  correctRate: number;
  
  /** セッションID */
  sessionId: string;
  
  /** 問題番号（セッション内） */
  questionNumber: number;
}
```

### 3.5 PersonalParameters（個人パラメータ）

```typescript
/**
 * ユーザー個人に最適化されたパラメータ
 * 学習履歴から統計的に推定される
 */
interface PersonalParameters {
  /** 学習速度（0.5-2.0、標準1.0） */
  learningSpeed: number;
  
  /** 忘却速度（0.5-2.0、標準1.0） */
  forgettingSpeed: number;
  
  /** 定着閾値（2-5回、標準3回） */
  consolidationThreshold: number;
  
  /** 最適復習間隔倍率（0.5-2.0、標準1.0） */
  optimalInterval: number;
  
  /** 推定に使用したサンプル数 */
  sampleSize: number;
  
  /** 推定の信頼度（0-1） */
  confidence: number;
  
  /** 最終更新日時 */
  lastUpdated: number;
  
  /** 次回更新予定サンプル数 */
  nextUpdateAt: number;
}
```

---

## 4. 設定データ構造

### 4.1 PhaseThresholds（フェーズ閾値）

```typescript
/**
 * フェーズ判定の閾値設定
 * 個人パラメータに基づいて調整される
 */
interface PhaseThresholds {
  /** エンコーディングの時間閾値（ms）: デフォルト30秒 */
  encodingTime: number;
  
  /** 初期統合の時間閾値（ms）: デフォルト1時間 */
  initialConsolidation: number;
  
  /** 同日復習のウィンドウ（ms）: デフォルト24時間 */
  intradayWindow: number;
  
  /** 短期記憶のウィンドウ（日）: デフォルト7日 */
  shortTermWindow: number;
  
  /** 長期記憶の閾値（日）: デフォルト7日 */
  longTermThreshold: number;
  
  /** 正答率の閾値（短期→長期の遷移） */
  correctRateThreshold: number;
  
  /** 応答時間の閾値（長期記憶判定） */
  responseTimeThreshold: number;
}
```

### 4.2 TabConfig（タブ別設定）

```typescript
/**
 * タブごとの学習特性に応じた設定
 */
interface TabConfig {
  /** 問題カテゴリ */
  category: QuestionCategory;
  
  /** 記憶獲得完了の閾値（同日内の正答回数） */
  consolidationThreshold: number;
  
  /** 有効な同日復習スケジュール */
  intradaySchedule: {
    immediate: boolean;  // 即時復習（1-3問後）
    early: boolean;      // 早期復習（5-10問後）
    mid: boolean;        // 中期復習（20-30問後）
    end: boolean;        // 終了時復習
  };
  
  /** 混合戦略の新規問題比率 */
  acquisitionRatio: number;
  
  /** 混合戦略の復習問題比率 */
  retentionRatio: number;
  
  /** タブ固有の説明 */
  description: string;
}
```

### 4.3 HybridStrategy（混合戦略設定）

```typescript
/**
 * 問題選択の混合戦略設定
 */
interface HybridStrategy {
  /** 記憶獲得（新規）の比率（0-1） */
  acquisitionRatio: number;
  
  /** 記憶保持（復習）の比率（0-1） */
  retentionRatio: number;
  
  /** セッション進行に応じた動的調整を有効化 */
  adaptiveAdjustment: boolean;
  
  /** 優先度のランダム性（0-1） */
  randomnessFactor: number;
}
```

---

## 5. 内部データ構造

### 5.1 QueueEntry（キューエントリ）

```typescript
/**
 * キュー内の単一エントリ
 */
interface QueueEntry {
  /** 単語 */
  word: string;
  
  /** キューに追加された時刻 */
  enqueuedAt: number;
  
  /** キューに追加された問題番号 */
  enqueuedQuestionNumber: number;
  
  /** 復習予定問題番号 */
  scheduledQuestionNumber: number;
  
  /** 優先度 */
  priority: number;
}
```

### 5.2 PriorityScore（優先度スコア）

```typescript
/**
 * 問題選択時の優先度計算結果
 */
interface PriorityScore {
  /** 単語 */
  word: string;
  
  /** 総合スコア（0-100） */
  totalScore: number;
  
  /** スコアの内訳 */
  breakdown: {
    phaseWeight: number;        // フェーズ別重み
    urgency: number;            // 緊急度
    forgettingRisk: number;     // 忘却リスク
    consecutiveWrong: number;   // 連続誤答
    randomness: number;         // ランダム性
  };
  
  /** デバッグ用説明 */
  reason: string;
}
```

### 5.3 SessionStats（セッション統計）

```typescript
/**
 * 現在の学習セッションの統計情報
 */
interface SessionStats {
  /** セッションID */
  sessionId: string;
  
  /** セッション開始時刻 */
  startTime: number;
  
  /** 総問題数 */
  totalQuestions: number;
  
  /** 正答数 */
  correctAnswers: number;
  
  /** 誤答数 */
  wrongAnswers: number;
  
  /** 今日学習した新規単語数 */
  newWordsToday: number;
  
  /** 同日復習回数 */
  intradayReviews: number;
  
  /** 記憶獲得完了数 */
  acquisitionComplete: number;
  
  /** 分散復習回数 */
  spacingReviews: number;
  
  /** フェーズ1（記憶獲得）の出題数 */
  phase1Questions: number;
  
  /** フェーズ2（記憶保持）の出題数 */
  phase2Questions: number;
  
  /** 平均応答時間 */
  averageResponseTime: number;
}
```

---

## 6. 型エイリアス

```typescript
/** タイムスタンプ（UNIXミリ秒） */
type Timestamp = number;

/** 日数 */
type Days = number;

/** ミリ秒 */
type Milliseconds = number;

/** 比率（0-1） */
type Ratio = number;

/** スコア（0-100） */
type Score = number;

/** 単語（英語） */
type Word = string;
```

---

## 7. デフォルト値

### 7.1 PhaseThresholdsのデフォルト

```typescript
const DEFAULT_PHASE_THRESHOLDS: PhaseThresholds = {
  encodingTime: 30000,              // 30秒
  initialConsolidation: 3600000,    // 1時間
  intradayWindow: 86400000,         // 24時間
  shortTermWindow: 7,               // 7日
  longTermThreshold: 7,             // 7日
  correctRateThreshold: 0.8,        // 80%
  responseTimeThreshold: 1500       // 1.5秒
};
```

### 7.2 PersonalParametersのデフォルト

```typescript
const DEFAULT_PERSONAL_PARAMETERS: PersonalParameters = {
  learningSpeed: 1.0,               // 標準
  forgettingSpeed: 1.0,             // 標準
  consolidationThreshold: 3,        // 3回
  optimalInterval: 1.0,             // 標準
  sampleSize: 0,
  confidence: 0.5,                  // 低信頼度
  lastUpdated: Date.now(),
  nextUpdateAt: 30                  // 30サンプル後
};
```

### 7.3 TabConfigのデフォルト

```typescript
const DEFAULT_TAB_CONFIGS: Record<QuestionCategory, TabConfig> = {
  [QuestionCategory.MEMORIZATION]: {
    category: QuestionCategory.MEMORIZATION,
    consolidationThreshold: 3,
    intradaySchedule: {
      immediate: true,
      early: true,
      mid: true,
      end: true
    },
    acquisitionRatio: 0.6,
    retentionRatio: 0.4,
    description: '暗記タブ: 標準的な学習特性'
  },
  [QuestionCategory.TRANSLATION]: {
    category: QuestionCategory.TRANSLATION,
    consolidationThreshold: 2,
    intradaySchedule: {
      immediate: true,
      early: false,
      mid: false,
      end: true
    },
    acquisitionRatio: 0.7,
    retentionRatio: 0.3,
    description: '和訳タブ: 認識は獲得が速い'
  },
  [QuestionCategory.SPELLING]: {
    category: QuestionCategory.SPELLING,
    consolidationThreshold: 4,
    intradaySchedule: {
      immediate: true,
      early: true,
      mid: true,
      end: true
    },
    acquisitionRatio: 0.5,
    retentionRatio: 0.5,
    description: 'スペルタブ: 想起は獲得が遅い'
  },
  [QuestionCategory.GRAMMAR]: {
    category: QuestionCategory.GRAMMAR,
    consolidationThreshold: 3,
    intradaySchedule: {
      immediate: true,
      early: true,
      mid: false,
      end: true
    },
    acquisitionRatio: 0.6,
    retentionRatio: 0.4,
    description: '文法タブ: 理解は中程度'
  }
};
```

---

## 8. データ検証

### 8.1 バリデーション関数

```typescript
function validateQuestionStatus(status: QuestionStatus): boolean {
  return (
    typeof status.word === 'string' &&
    status.reviewCount >= 0 &&
    status.correctCount >= 0 &&
    status.wrongCount >= 0 &&
    status.correctCount + status.wrongCount <= status.reviewCount &&
    status.lastReviewTime > 0 &&
    status.averageResponseTime >= 0 &&
    Object.values(LearningPhase).includes(status.phase)
  );
}

function validatePersonalParameters(params: PersonalParameters): boolean {
  return (
    params.learningSpeed >= 0.5 && params.learningSpeed <= 2.0 &&
    params.forgettingSpeed >= 0.5 && params.forgettingSpeed <= 2.0 &&
    params.consolidationThreshold >= 2 && params.consolidationThreshold <= 5 &&
    params.optimalInterval >= 0.5 && params.optimalInterval <= 2.0 &&
    params.confidence >= 0 && params.confidence <= 1
  );
}
```

---

## 9. マイグレーション

### 9.1 バージョン管理

```typescript
interface DataVersion {
  version: string;
  timestamp: number;
  changes: string[];
}

const CURRENT_DATA_VERSION = '1.0.0';
```

### 9.2 マイグレーション戦略

将来のデータ構造変更時:
1. 旧データ形式を検出
2. 新形式に変換
3. バージョン番号を更新
4. localStorage に保存

---

**承認**: データモデル定義完了
