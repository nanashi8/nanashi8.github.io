/**
 * 失敗パターンのデータ構造
 */
export interface FailurePattern {
  /** 失敗パターン名（例: "property-naming-error"） */
  pattern: string;

  /** カテゴリ（例: "naming", "structure", "logic"） */
  category: string;

  /** 発生回数 */
  occurrences: number;

  /** 重み（0.1-1.0、発生頻度に応じて増減） */
  weight: number;

  /** 最終発生日（ISO 8601形式） */
  lastOccurred: string;

  /** 具体例 */
  examples: string[];

  /** 復旧回数（修正に成功した回数） */
  recoveries: number;

  /** 復旧成功率（0-1.0） */
  successRate: number;

  /** 説明 */
  description?: string;

  /** 影響を受けるファイルパターン */
  affectedFiles?: string[];
}

/**
 * 失敗パターンデータベースの構造
 */
export interface FailurePatternsDB {
  /** パターンのリスト */
  patterns: FailurePattern[];

  /** 最終更新日時 */
  lastUpdated: string;

  /** 総検証回数 */
  totalValidations: number;

  /** 現在の学習サイクルカウント */
  currentCycleCount: number;

  /** 学習サイクルサイズ（デフォルト: 15） */
  cycleSize: number;
}

/**
 * ホットスポット（問題頻発箇所）
 */
export interface FileHotspot {
  /** ファイルパス */
  file: string;

  /** 違反回数 */
  violationCount: number;

  /** 最も頻繁な違反パターン */
  topPatterns: Array<{
    pattern: string;
    count: number;
  }>;

  /** リスクスコア（0-100） */
  riskScore: number;

  /** 最終違反日 */
  lastViolation: string;
}

/**
 * 学習統計情報
 */
export interface LearningStats {
  /** 総パターン数 */
  totalPatterns: number;

  /** 高リスクパターン数（weight >= 0.7） */
  highRiskPatterns: number;

  /** 平均復旧成功率 */
  averageSuccessRate: number;

  /** 次回学習までの残り検証回数 */
  validationsUntilNextLearning: number;

  /** 総学習回数 */
  totalLearningCycles: number;

  /** 最終学習日時 */
  lastLearningDate: string | null;
}
