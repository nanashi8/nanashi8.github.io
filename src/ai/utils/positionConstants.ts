/**
 * Position System Constants
 *
 * Position範囲とスコア計算に使用する定数を一元管理
 * Magic numbersを排除し、意味を明確化
 */

/**
 * Position範囲の定義（0-100スケール）
 *
 * - MASTERED: 0-20 （定着済み）
 * - NEW: 20-40 （新規）
 * - STILL_LEARNING: 40-70 （学習中・まだまだ）
 * - INCORRECT: 70-100 （要復習・分からない）
 */
export const POSITION_RANGES = {
  MASTERED: {
    min: 0,
    max: 20,
    default: 10,
    label: '定着済み' as const
  },
  NEW: {
    min: 20,
    max: 40,
    default: 35,
    label: '新規' as const
  },
  STILL_LEARNING: {
    min: 40,
    max: 70,
    default: 50,
    label: '学習中' as const
  },
  INCORRECT: {
    min: 70,
    max: 100,
    default: 85,
    label: '要復習' as const
  }
} as const;

/**
 * 連続正解/不正解の閾値
 */
export const CONSECUTIVE_THRESHOLDS = {
  /** 連続正解3回で完全定着 */
  MASTERED: 3,

  /** 連続正解2回でほぼ定着 */
  LEARNING: 2,

  /** 連続不正解1回で注意 */
  STRUGGLING: 1,

  /** 連続不正解3回で最優先復習 */
  INCORRECT: 3,

  /** 連続不正解2回で高優先度 */
  HIGH_PRIORITY: 2
} as const;

/**
 * 正答率の閾値（0-1スケール）
 */
export const ACCURACY_THRESHOLDS = {
  /** 正答率90%以上 - 優秀 */
  EXCELLENT: 0.9,

  /** 正答率80%以上 - 良好 */
  GOOD: 0.8,

  /** 正答率60%以上 - 普通 */
  FAIR: 0.6,

  /** 正答率50%以上 - 要注意 */
  POOR: 0.5
} as const;

/**
 * Position計算時の具体的な値
 */
export const POSITION_VALUES = {
  /** 連続正解3回 → 完全定着 */
  MASTERED_PERFECT: 10,

  /** 連続正解2回 + 正答率80%以上 → ほぼ定着 */
  MASTERED_ALMOST: 15,

  /** 連続正解1回 + 正答率90%以上 + 試行2回以内 → 1発正解 */
  ONE_SHOT_CORRECT: 18,

  /** 連続正解2回 + 正答率80%未満 → もう1回で定着 */
  NEAR_MASTERY: 25,

  /** 連続正解1回 + 正答率60%以上 → 新規（次で定着） */
  NEW_NEAR_MASTERY: 30,

  /** 新規単語のデフォルト */
  NEW_DEFAULT: 35,

  /** 連続正解1回 + 正答率60%未満 → まだまだ */
  STILL_LEARNING_LOW: 45,

  /** まだまだのデフォルト */
  STILL_LEARNING_DEFAULT: 50,

  /** 連続不正解1回 + 正答率50%以上 → まだまだ */
  INCORRECT_LIGHT: 55,

  /** 連続不正解1回 + 正答率50%未満 → 分からない */
  INCORRECT_MEDIUM: 70,

  /** 連続不正解2回 → 高優先度 */
  INCORRECT_HIGH: 75,

  /** 連続不正解3回以上 → 最優先 */
  INCORRECT_URGENT: 85
} as const;

/**
 * ブースト値の設定
 */
export const BOOST_VALUES = {
  /** まだまだブーストの最大値 */
  STILL_LEARNING_MAX: 15,

  /** まだまだブーストの乗数 */
  STILL_LEARNING_MULTIPLIER: 5,

  /** 時間経過ブーストの最大値 */
  TIME_DECAY_MAX: 15,

  /** 時間経過ブーストの係数 */
  TIME_DECAY_MULTIPLIER: 1.5
} as const;

/**
 * GamificationAIのインターリーブ閾値
 * Position階層不変条件に基づく固定値
 */
export const GAMIFICATION_THRESHOLDS = {
  /** 新規語のPosition下限（インターリーブ後） */
  NEW_MIN: 40,

  /** 新規語のPosition上限（インターリーブ後） */
  NEW_MAX: 59,

  /** まだまだ語のPosition下限（ブースト後） */
  STILL_MIN: 60,

  /** まだまだ語のPosition上限（ブースト後） */
  STILL_MAX: 69
} as const;

/**
 * 試行回数の閾値
 */
export const ATTEMPT_THRESHOLDS = {
  /** 1-2回の試行で正解 → 優秀 */
  QUICK_LEARNER: 2,

  /** 3-5回の試行 → 通常 */
  NORMAL_LEARNER: 5,

  /** 6回以上の試行 → 要注意 */
  SLOW_LEARNER: 6
} as const;

/**
 * Position範囲の判定ヘルパー関数
 */
export const isInRange = {
  mastered: (position: number) =>
    position >= POSITION_RANGES.MASTERED.min && position <= POSITION_RANGES.MASTERED.max,

  new: (position: number) =>
    position >= POSITION_RANGES.NEW.min && position <= POSITION_RANGES.NEW.max,

  stillLearning: (position: number) =>
    position >= POSITION_RANGES.STILL_LEARNING.min && position <= POSITION_RANGES.STILL_LEARNING.max,

  incorrect: (position: number) =>
    position >= POSITION_RANGES.INCORRECT.min && position <= POSITION_RANGES.INCORRECT.max
} as const;

/**
 * Positionからカテゴリラベルを取得
 */
export function getPositionCategory(position: number): string {
  if (isInRange.mastered(position)) return POSITION_RANGES.MASTERED.label;
  if (isInRange.new(position)) return POSITION_RANGES.NEW.label;
  if (isInRange.stillLearning(position)) return POSITION_RANGES.STILL_LEARNING.label;
  if (isInRange.incorrect(position)) return POSITION_RANGES.INCORRECT.label;
  return '不明';
}

/**
 * Positionの妥当性検証
 */
export function validatePosition(position: number): boolean {
  return position >= 0 && position <= 100;
}

/**
 * Positionを範囲内に正規化
 */
export function normalizePosition(position: number): number {
  return Math.max(0, Math.min(100, position));
}
