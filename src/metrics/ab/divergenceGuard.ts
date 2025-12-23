/**
 * AI-Position乖離検知と自動フォールバック
 *
 * 責務:
 * - AICoordinatorのfinalPriorityとPosition由来の優先度の乖離を検出
 * - 大きな乖離が検出された場合、AIの判断が不適切と判定
 * - 連続乖離でvariant=Aへの切戻しを推奨
 */

export interface DivergenceDetection {
  word: string;
  aiPriority: number;       // AICoordinatorのfinalPriority（0-1）
  positionPriority: number; // Position由来の優先度（0-1）
  divergence: number;       // 乖離度（絶対値、0-1）
  severity: 'normal' | 'warning' | 'critical'; // 正常/注意/異常
}

export interface DivergenceGuardResult {
  isValid: boolean;
  averageDivergence: number; // 平均乖離度
  maxDivergence: number;     // 最大乖離度
  criticalCount: number;     // 異常レベルの乖離数
  shouldFallbackToA: boolean; // variant=Aへの切戻し推奨
  detections: DivergenceDetection[];
}

export interface DivergenceGuardConfig {
  warningThreshold: number;  // 注意閾値（0.3 = 30%乖離）
  criticalThreshold: number; // 異常閾値（0.5 = 50%乖離）
  criticalCountLimit: number; // 異常数の上限（TOP30中5個以上で警告）
  consecutiveCriticalLimit: number; // 連続異常セッション数（2回以上でA推奨）
}

export const DEFAULT_DIVERGENCE_GUARD_CONFIG: DivergenceGuardConfig = {
  warningThreshold: 0.3,
  criticalThreshold: 0.5,
  criticalCountLimit: 5,
  consecutiveCriticalLimit: 2,
};

/**
 * AI-Position乖離を検知
 *
 * @param prioritizedQuestions - finalPriorityを含む出題リスト
 * @param config - 設定
 * @returns 検証結果
 */
export function detectAIPositionDivergence(
  prioritizedQuestions: Array<{
    word: string;
    finalPriority: number;
    position: number;
  }>,
  config: DivergenceGuardConfig = DEFAULT_DIVERGENCE_GUARD_CONFIG
): DivergenceGuardResult {
  const detections: DivergenceDetection[] = [];

  for (const pq of prioritizedQuestions) {
    const aiPriority = pq.finalPriority;
    const positionPriority = pq.position / 100; // 0-100 → 0-1
    const divergence = Math.abs(aiPriority - positionPriority);

    let severity: 'normal' | 'warning' | 'critical' = 'normal';
    if (divergence >= config.criticalThreshold) {
      severity = 'critical';
    } else if (divergence >= config.warningThreshold) {
      severity = 'warning';
    }

    detections.push({
      word: pq.word,
      aiPriority,
      positionPriority,
      divergence,
      severity,
    });
  }

  const criticalCount = detections.filter(d => d.severity === 'critical').length;
  const averageDivergence = detections.reduce((sum, d) => sum + d.divergence, 0) / detections.length;
  const maxDivergence = Math.max(...detections.map(d => d.divergence));

  const isValid = criticalCount < config.criticalCountLimit;

  return {
    isValid,
    averageDivergence,
    maxDivergence,
    criticalCount,
    shouldFallbackToA: false, // 連続判定は外部で実施
    detections,
  };
}

/**
 * 連続異常カウントをlocalStorageで管理
 */
export function updateConsecutiveDivergence(
  userId: string,
  variant: string,
  isCritical: boolean
): number {
  try {
    const key = `ab_consecutive_divergence_${userId}_${variant}`;
    const current = parseInt(localStorage.getItem(key) || '0', 10);
    const updated = isCritical ? current + 1 : 0;
    localStorage.setItem(key, String(updated));
    return updated;
  } catch {
    return 0;
  }
}

/**
 * 連続異常カウントをリセット
 */
export function resetConsecutiveDivergence(userId: string, variant: string): void {
  try {
    const key = `ab_consecutive_divergence_${userId}_${variant}`;
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * 乖離ログをlocalStorageに記録
 */
export function logDivergence(
  sessionId: string,
  variant: string,
  result: DivergenceGuardResult
): void {
  try {
    const log = {
      sessionId,
      variant,
      timestamp: Date.now(),
      averageDivergence: result.averageDivergence,
      maxDivergence: result.maxDivergence,
      criticalCount: result.criticalCount,
      isValid: result.isValid,
      top5Detections: result.detections.slice(0, 5),
    };

    const existing = JSON.parse(
      localStorage.getItem('ab_divergence_history') || '[]'
    ) as typeof log[];
    existing.push(log);

    // 最新300件のみ保持
    if (existing.length > 300) {
      existing.splice(0, existing.length - 300);
    }

    localStorage.setItem('ab_divergence_history', JSON.stringify(existing));
  } catch {
    // localStorage失敗は無視
  }
}

/**
 * 乖離ログをクリア
 */
export function clearDivergenceHistory(): void {
  try {
    localStorage.removeItem('ab_divergence_history');
  } catch {
    // ignore
  }
}

/**
 * 乖離ログを取得
 */
export function loadDivergenceHistory(): any[] {
  try {
    return JSON.parse(
      localStorage.getItem('ab_divergence_history') || '[]'
    );
  } catch {
    return [];
  }
}
