/**
 * スナップショット取得・KPI計算
 */

import { loadProgressSync } from '@/storage/progress/progressStorage';
import type { Question } from '@/types';

/**
 * mastered判定（Position 0-19）
 * 注意: WordProgressにはmemorizationPosition/translationPosition/spellingPosition/grammarPositionが分かれている
 * ここでは暗記モードのPosition（memorizationPosition）を基準にmastered判定を行う
 */
function isMastered(word: string): boolean {
  try {
    const allProgress = loadProgressSync();
    const progress = allProgress.wordProgress?.[word];
    if (!progress) {
      return false;
    }

    // 暗記モードのPosition 0-19 が mastered帯
    const position = progress.memorizationPosition ?? 50; // デフォルト50（中間）
    return position >= 0 && position < 20;
  } catch (error) {
    console.warn(`[AB Snapshot] Failed to check mastered status for "${word}":`, error);
    return false;
  }
}

/**
 * 出題語リストからmastered語集合を取得
 */
export function captureMasteredSet(words: string[]): string[] {
  const masteredWords: string[] = [];

  for (const word of words) {
    if (isMastered(word)) {
      masteredWords.push(word);
    }
  }

  return masteredWords;
}

/**
 * 開始/終了スナップショットから取得語数を計算
 *
 * @param startMasteredWords セッション開始時のmastered語集合
 * @param endMasteredWords セッション終了時のmastered語集合
 * @returns 取得語数（開始時にmastered以外→終了時にmastered）
 */
export function calculateAcquiredWords(
  startMasteredWords: string[],
  endMasteredWords: string[]
): number {
  const startSet = new Set(startMasteredWords);
  const endSet = new Set(endMasteredWords);

  // 終了時にmasteredだが、開始時にmasteredでなかった語数
  let acquired = 0;
  for (const word of endSet) {
    if (!startSet.has(word)) {
      acquired++;
    }
  }

  return acquired;
}

/**
 * 取得率を計算
 *
 * @param acquiredWordCount 取得語数
 * @param uniqueWordCount ユニーク出題語数
 * @returns 取得率（0-1）
 */
export function calculateAcquisitionRate(
  acquiredWordCount: number,
  uniqueWordCount: number
): number {
  if (uniqueWordCount === 0) {
    return 0;
  }
  return acquiredWordCount / uniqueWordCount;
}

/**
 * 出題語リストからユニーク語数を計算
 */
export function calculateUniqueWordCount(words: string[]): number {
  return new Set(words).size;
}

/**
 * Question配列から単語リスト（順序付き）を抽出
 */
export function extractWordList(questions: Question[]): string[] {
  return questions.map(q => q.word);
}
