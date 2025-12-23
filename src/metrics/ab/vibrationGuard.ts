/**
 * 振動スコア監視とフォールバック
 *
 * 責務:
 * - セッション中の振動スコア監視（目標≤30、注意>40、悪化>50）
 * - 悪化検出時にN=20へ自動フォールバック
 * - variant=A（ベースライン）への切戻し判定
 */

export interface VibrationGuardConfig {
  targetScore: number;    // 目標値（≤30）
  warningScore: number;   // 注意値（>40）
  criticalScore: number;  // 悪化値（>50）
  fallbackQuestionCount: number; // フォールバック時の出題数（20）
}

export const DEFAULT_VIBRATION_GUARD_CONFIG: VibrationGuardConfig = {
  targetScore: 30,
  warningScore: 40,
  criticalScore: 50,
  fallbackQuestionCount: 20,
};

export type VibrationLevel = 'good' | 'warning' | 'critical';

export interface VibrationGuardResult {
  level: VibrationLevel;
  shouldFallback: boolean; // N=20への切り替え推奨
  shouldSwitchToA: boolean; // variant=Aへの切戻し推奨
  score: number;
  message: string;
}

/**
 * 振動スコアを評価
 *
 * @param score - 現在の振動スコア
 * @param consecutiveCritical - 連続悪化カウント（2回以上でvariant=A推奨）
 * @param config - 設定
 * @returns 評価結果
 */
export function evaluateVibrationScore(
  score: number,
  consecutiveCritical: number = 0,
  config: VibrationGuardConfig = DEFAULT_VIBRATION_GUARD_CONFIG
): VibrationGuardResult {
  let level: VibrationLevel = 'good';
  let shouldFallback = false;
  let shouldSwitchToA = false;
  let message = '';

  if (score <= config.targetScore) {
    level = 'good';
    message = '振動スコア良好';
  } else if (score <= config.warningScore) {
    level = 'warning';
    message = '振動スコア注意レベル';
  } else if (score <= config.criticalScore) {
    level = 'critical';
    shouldFallback = true;
    message = '振動スコア悪化: N=20へフォールバック推奨';
  } else {
    level = 'critical';
    shouldFallback = true;
    message = '振動スコア悪化: N=20へフォールバック推奨';

    // 連続2回以上の悪化でvariant=A推奨
    if (consecutiveCritical >= 2) {
      shouldSwitchToA = true;
      message = '振動スコア悪化継続: variant=Aへ切戻し推奨';
    }
  }

  return {
    level,
    shouldFallback,
    shouldSwitchToA,
    score,
    message,
  };
}

/**
 * 連続悪化カウントをlocalStorageで管理
 */
export function updateConsecutiveCritical(
  userId: string,
  variant: string,
  isCritical: boolean
): number {
  try {
    const key = `ab_consecutive_critical_${userId}_${variant}`;
    const current = parseInt(localStorage.getItem(key) || '0', 10);
    const updated = isCritical ? current + 1 : 0;
    localStorage.setItem(key, String(updated));
    return updated;
  } catch {
    return 0;
  }
}

/**
 * 連続悪化カウントをリセット
 */
export function resetConsecutiveCritical(userId: string, variant: string): void {
  try {
    const key = `ab_consecutive_critical_${userId}_${variant}`;
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * 振動スコア履歴をlocalStorageに記録
 */
export function logVibrationScore(
  sessionId: string,
  variant: string,
  score: number,
  level: VibrationLevel,
  fallbackApplied: boolean
): void {
  try {
    const log = {
      sessionId,
      variant,
      timestamp: Date.now(),
      score,
      level,
      fallbackApplied,
    };

    const existing = JSON.parse(
      localStorage.getItem('ab_vibration_history') || '[]'
    ) as typeof log[];
    existing.push(log);

    // 最新300件のみ保持（ABログと同じ）
    if (existing.length > 300) {
      existing.splice(0, existing.length - 300);
    }

    localStorage.setItem('ab_vibration_history', JSON.stringify(existing));
  } catch {
    // localStorage失敗は無視
  }
}

/**
 * 振動スコア履歴をクリア
 */
export function clearVibrationHistory(): void {
  try {
    localStorage.removeItem('ab_vibration_history');
  } catch {
    // ignore
  }
}

/**
 * 振動スコア履歴を取得
 */
export function loadVibrationHistory(): any[] {
  try {
    return JSON.parse(
      localStorage.getItem('ab_vibration_history') || '[]'
    );
  } catch {
    return [];
  }
}
