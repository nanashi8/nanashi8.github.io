/**
 * A/B/C 集計計算
 */

import type { SessionLog, AggregateResult, OverallAggregateResult, Variant } from './types';
import { loadSessionLogs } from './storage';

/**
 * 中央値を計算
 */
function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}

/**
 * 平均を計算
 */
function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * variant別にセッションログを集計
 */
function aggregateByVariant(logs: SessionLog[], variant: Variant): AggregateResult | null {
  const filtered = logs.filter(log => log.variant === variant);

  if (filtered.length === 0) {
    return null;
  }

  const acquiredWords = filtered.map(log => log.acquiredWordCount);
  const acquisitionRates = filtered.map(log => log.acquisitionRate);
  const vibrationScores = filtered.map(log => log.vibrationScore);
  const durations = filtered.map(log => log.durationSec);

  return {
    variant,
    sessionCount: filtered.length,
    avgAcquiredWords: average(acquiredWords),
    medianAcquiredWords: median(acquiredWords),
    avgAcquisitionRate: average(acquisitionRates),
    medianAcquisitionRate: median(acquisitionRates),
    avgVibrationScore: average(vibrationScores),
    medianVibrationScore: median(vibrationScores),
    avgDurationSec: average(durations),
  };
}

/**
 * 全体集計を計算
 */
export function aggregateAll(): OverallAggregateResult {
  const logs = loadSessionLogs();

  return {
    totalSessions: logs.length,
    byVariant: {
      A: aggregateByVariant(logs, 'A'),
      B: aggregateByVariant(logs, 'B'),
      C: aggregateByVariant(logs, 'C'),
    },
    lastUpdated: Date.now(),
  };
}

/**
 * 特定modeのセッションのみで集計
 */
export function aggregateByMode(mode: string): OverallAggregateResult {
  const allLogs = loadSessionLogs();
  const filtered = allLogs.filter(log => log.mode === mode);

  return {
    totalSessions: filtered.length,
    byVariant: {
      A: aggregateByVariant(filtered, 'A'),
      B: aggregateByVariant(filtered, 'B'),
      C: aggregateByVariant(filtered, 'C'),
    },
    lastUpdated: Date.now(),
  };
}
