/**
 * A/B/C 変種割り当て
 */

import type { Variant } from './types';

/**
 * 簡易ハッシュ関数（決定論的ランダム用）
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit整数に変換
  }
  return Math.abs(hash);
}

/**
 * sessionIdからvariantを割り当て（決定論的ランダム）
 *
 * @param sessionId セッションID
 * @returns 'A' | 'B' | 'C'（等確率）
 */
export function assignVariant(sessionId: string): Variant {
  const hash = simpleHash(sessionId);
  const mod = hash % 3;

  switch (mod) {
    case 0:
      return 'A';
    case 1:
      return 'B';
    case 2:
      return 'C';
    default:
      return 'A'; // フォールバック
  }
}
