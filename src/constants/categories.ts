/**
 * アプリケーション定数
 * カテゴリ、難易度、その他の定数定義
 */

// 10個の正式カテゴリ（docs/19-junior-high-vocabulary.md参照）
export const OFFICIAL_CATEGORIES = [
  '言語基本',
  '学校・学習',
  '日常生活',
  '人・社会',
  '自然・環境',
  '食・健康',
  '運動・娯楽',
  '場所・移動',
  '時間・数量',
  '科学・技術',
] as const;

export type CategoryType = typeof OFFICIAL_CATEGORIES[number];

// 難易度レベル
export const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type DifficultyType = typeof DIFFICULTY_LEVELS[number];
