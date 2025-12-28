/**
 * 社会科学習進捗管理
 *
 * 既存のWordProgressと同じくLocalStorageベースで管理
 * Position 0-100方式を採用
 */

import type { SocialStudiesProgress } from '@/types/socialStudies';
import { logger } from '@/utils/logger';

const STORAGE_KEY = 'social-studies-progress';

/**
 * 社会科進捗データ全体
 */
export interface SocialStudiesProgressData {
  termProgress: Record<string, SocialStudiesProgress>;
  lastUpdated: number;
  version: number;
}

/**
 * 進捗データの初期化
 */
function initializeProgressData(): SocialStudiesProgressData {
  return {
    termProgress: {},
    lastUpdated: Date.now(),
    version: 1,
  };
}

/**
 * 語句の進捗を初期化
 */
function initializeTermProgress(term: string, field: string): SocialStudiesProgress {
  return {
    term,
    position: 35, // 初期値: 中間（未学習）
    correctCount: 0,
    incorrectCount: 0,
    lastAnswered: new Date(),
    nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24時間後
    field: field as any,
  };
}

/**
 * 進捗データの読み込み（同期）
 */
export function loadSocialStudiesProgressSync(): SocialStudiesProgressData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return initializeProgressData();
    }

    const data = JSON.parse(stored) as SocialStudiesProgressData;

    // Dateオブジェクトの復元
    Object.values(data.termProgress).forEach((progress) => {
      progress.lastAnswered = new Date(progress.lastAnswered);
      progress.nextReviewDate = new Date(progress.nextReviewDate);
    });

    return data;
  } catch (error) {
    logger.error('社会科進捗データの読み込みエラー:', error);
    return initializeProgressData();
  }
}

/**
 * 進捗データの保存
 */
export function saveSocialStudiesProgress(data: SocialStudiesProgressData): void {
  try {
    data.lastUpdated = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    logger.error('社会科進捗データの保存エラー:', error);
  }
}

/**
 * 語句の進捗を更新
 *
 * Position計算ロジック（英語学習と同じ）:
 * - 正解: Position -= 5-15（連続正解でより大きく減少）
 * - 不正解: Position += 10-20（連続不正解でより大きく増加）
 * - Position範囲: 0-100
 */
export function updateSocialStudiesProgress(
  term: string,
  field: string,
  isCorrect: boolean,
  isDontKnow: boolean = false
): void {
  const data = loadSocialStudiesProgressSync();
  let progress = data.termProgress[term];

  if (!progress) {
    progress = initializeTermProgress(term, field);
    data.termProgress[term] = progress;
  }

  // 統計更新
  if (isCorrect) {
    progress.correctCount++;
  } else {
    progress.incorrectCount++;
  }

  // Position計算
  const oldPosition = progress.position;
  let newPosition = oldPosition;

  if (isCorrect) {
    // 正解: Positionを下げる（0に近づける = 習得）
    const consecutiveBonus = Math.min(progress.correctCount * 2, 10);
    newPosition = Math.max(0, oldPosition - (5 + consecutiveBonus));
  } else {
    // 不正解: Positionを上げる（100に近づける = 苦手）
    const consecutivePenalty = Math.min(progress.incorrectCount * 2, 10);
    const baseIncrease = isDontKnow ? 15 : 10; // 「分からない」は大きく増加
    newPosition = Math.min(100, oldPosition + (baseIncrease + consecutivePenalty));
  }

  progress.position = newPosition;
  progress.lastAnswered = new Date();

  // 次回復習日を計算（忘却曲線ベース）
  const reviewInterval = calculateReviewInterval(progress.position, progress.correctCount);
  progress.nextReviewDate = new Date(Date.now() + reviewInterval);

  // 保存
  saveSocialStudiesProgress(data);

  logger.log(`社会科進捗更新: ${term}`, {
    field,
    isCorrect,
    isDontKnow,
    oldPosition,
    newPosition,
    correctCount: progress.correctCount,
    incorrectCount: progress.incorrectCount,
  });
}

/**
 * 次回復習までの間隔を計算（ミリ秒）
 *
 * Position範囲別:
 * - 0-20 (習得): 7日
 * - 21-40 (定着中): 3日
 * - 41-70 (学習中): 1日
 * - 71-100 (苦手): 6時間
 */
function calculateReviewInterval(position: number, correctCount: number): number {
  const baseIntervals = {
    mastered: 7 * 24 * 60 * 60 * 1000, // 7日
    learning: 3 * 24 * 60 * 60 * 1000, // 3日
    stillLearning: 1 * 24 * 60 * 60 * 1000, // 1日
    incorrect: 6 * 60 * 60 * 1000, // 6時間
  };

  let baseInterval: number;
  if (position <= 20) {
    baseInterval = baseIntervals.mastered;
  } else if (position <= 40) {
    baseInterval = baseIntervals.learning;
  } else if (position <= 70) {
    baseInterval = baseIntervals.stillLearning;
  } else {
    baseInterval = baseIntervals.incorrect;
  }

  // 正解回数に応じて間隔を延長（最大2倍）
  const multiplier = Math.min(2, 1 + correctCount * 0.1);
  return baseInterval * multiplier;
}

/**
 * 語句の進捗を取得
 */
export function getSocialStudiesTermProgress(term: string): SocialStudiesProgress | null {
  const data = loadSocialStudiesProgressSync();
  return data.termProgress[term] || null;
}

/**
 * 全進捗データを取得
 */
export function getAllSocialStudiesProgress(): SocialStudiesProgress[] {
  const data = loadSocialStudiesProgressSync();
  return Object.values(data.termProgress);
}

/**
 * セッション統計を計算
 */
export function calculateSocialStudiesSessionStats(terms: string[]): {
  incorrect: number;
  stillLearning: number;
  learning: number;
  mastered: number;
  new: number;
  total: number;
} {
  const data = loadSocialStudiesProgressSync();

  const stats = {
    incorrect: 0, // 71-100
    stillLearning: 0, // 41-70
    learning: 0, // 21-40
    mastered: 0, // 0-20
    new: 0, // 未出題
    total: terms.length,
  };

  terms.forEach((term) => {
    const progress = data.termProgress[term];

    if (!progress) {
      stats.new++;
      return;
    }

    const position = progress.position;
    if (position >= 71) {
      stats.incorrect++;
    } else if (position >= 41) {
      stats.stillLearning++;
    } else if (position >= 21) {
      stats.learning++;
    } else {
      stats.mastered++;
    }
  });

  return stats;
}

/**
 * 進捗データのリセット
 */
export function resetSocialStudiesProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    logger.log('社会科進捗データをリセットしました');
  } catch (error) {
    logger.error('社会科進捗データのリセットエラー:', error);
  }
}

/**
 * 特定の語句の進捗をリセット
 */
export function resetSocialStudiesTermProgress(term: string): void {
  const data = loadSocialStudiesProgressSync();
  delete data.termProgress[term];
  saveSocialStudiesProgress(data);
  logger.log(`社会科進捗リセット: ${term}`);
}
