/**
 * カテゴリー判定ユーティリティ（単一責任）
 *
 * すべてのAIモジュールで統一したカテゴリー判定を行う
 * 重複コードを排除し、ロジックを一箇所に集約
 */

import type { WordProgress, WordCategory } from '@/storage/progress/types';

/**
 * 単語の学習カテゴリーを判定
 *
 * @param progress - 単語の進捗情報
 * @returns カテゴリー（'new' | 'incorrect' | 'still_learning' | 'mastered'）
 *
 * 判定基準:
 * - new: 未出題（memorizationAttempts === 0）
 * - mastered: 正答率80%以上＆連続3回正解 OR 正答率70%以上＆5回以上挑戦
 * - incorrect: 正答率30%未満 OR 連続2回不正解
 * - still_learning: 上記以外
 *
 * 重要: memorizationCorrect と memorizationStillLearning を使用
 * 「まだまだ」は0.5回の正解として計算に含める
 */
export function determineWordCategory(progress: WordProgress): WordCategory {
  const attempts = progress.memorizationAttempts || 0;
  const correct = progress.memorizationCorrect || 0;
  const stillLearning = progress.memorizationStillLearning || 0;
  const streak = progress.memorizationStreak || 0;

  if (attempts === 0) return 'new';

  // まだまだを0.5回の正解として計算
  const effectiveCorrect = correct + stillLearning * 0.5;
  const totalAttempts = attempts;
  const incorrectCount = attempts - correct - stillLearning;
  const accuracy = totalAttempts > 0 ? effectiveCorrect / totalAttempts : 0;

  // 🟢 定着済み: 正答率80%以上 & 連続3回正解 OR 正答率70%以上 & 5回以上挑戦
  if ((accuracy >= 0.8 && streak >= 3) || (accuracy >= 0.7 && totalAttempts >= 5)) {
    return 'mastered';
  }

  // 🔴 要復習: 正答率30%未満 OR 連続2回不正解
  if (accuracy < 0.3 || incorrectCount >= 2) {
    return 'incorrect';
  }

  // 🟡 学習中: それ以外
  return 'still_learning';
}
