/**
 * A/Bテスト関連の型定義
 */

/**
 * 変種（アルゴリズム）
 */
export type Variant = 'A' | 'B' | 'C';

/**
 * セッションログ
 */
export interface SessionLog {
  /** セッションID（グローバル一意寄り） */
  sessionId: string;

  /** 変種 */
  variant: Variant;

  /** モード */
  mode: string;

  /** セッション長（出題数） */
  sessionLength: number;

  /** 出題語リスト（順序付き） */
  questionWords: string[];

  /** ユニーク出題語数 */
  uniqueWordCount: number;

  /** セッション開始時のmastered語集合 */
  startMasteredWords: string[];

  /** セッション終了時のmastered語集合 */
  endMasteredWords: string[];

  /** 取得語数（mastered遷移） */
  acquiredWordCount: number;

  /** 取得率 */
  acquisitionRate: number;

  /** 振動スコア */
  vibrationScore: number;

  /** 開始時刻 */
  startedAt: number;

  /** 終了時刻 */
  endedAt: number;

  /** 所要時間（秒） */
  durationSec: number;

  /** ML有効フラグ（Week 4追加） */
  mlEnabled: boolean;
}

/**
 * 集計結果（variant別）
 */
export interface AggregateResult {
  /** variant */
  variant: Variant;

  /** セッション数 */
  sessionCount: number;

  /** 取得語数/セッション（平均） */
  avgAcquiredWords: number;

  /** 取得語数/セッション（中央値） */
  medianAcquiredWords: number;

  /** 取得率（平均） */
  avgAcquisitionRate: number;

  /** 取得率（中央値） */
  medianAcquisitionRate: number;

  /** 振動スコア（平均） */
  avgVibrationScore: number;

  /** 振動スコア（中央値） */
  medianVibrationScore: number;

  /** 平均所要時間（秒） */
  avgDurationSec: number;
}

/**
 * 全体集計結果
 */
export interface OverallAggregateResult {
  /** 総セッション数 */
  totalSessions: number;

  /** variant別集計 */
  byVariant: {
    A: AggregateResult | null;
    B: AggregateResult | null;
    C: AggregateResult | null;
  };

  /** 最終更新時刻 */
  lastUpdated: number;
}
