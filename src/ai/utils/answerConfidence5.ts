import type { StorageWordProgress } from '@/ai/types';
import { getAnswerConfidenceModel } from '@/ai/ml/AnswerConfidenceModel';

export type AnswerConfidence5 = 1 | 2 | 3 | 4 | 5;

export type Confidence5Estimate = {
  confidence5: AnswerConfidence5;
  score01: number;
  source: 'deep' | 'heuristic';
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function mapScoreToConfidence5(score01: number): AnswerConfidence5 {
  const s = clamp01(score01);
  if (s < 0.2) return 1;
  if (s < 0.4) return 2;
  if (s < 0.6) return 3;
  if (s < 0.8) return 4;
  return 5;
}

function safeDiv(numerator: number, denominator: number, fallback = 0): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return fallback;
  }
  return numerator / denominator;
}

function buildFeatures(params: {
  progress: StorageWordProgress | null | undefined;
  responseTimeMs: number;
  timestamp: number;
}): number[] {
  const progress = params.progress;

  const attempts = progress?.memorizationAttempts ?? progress?.totalAttempts ?? 0;
  const correct = progress?.memorizationCorrect ?? progress?.correctCount ?? 0;
  const incorrect = progress?.incorrectCount ?? 0;
  const streak = progress?.consecutiveCorrect ?? 0;

  const accuracy = attempts > 0 ? correct / attempts : 0.5;
  const daysSinceLast = progress?.lastStudied
    ? (params.timestamp - (progress.lastStudied ?? 0)) / 86_400_000
    : 999;

  const avgRt = progress?.averageResponseTime ?? 3000;

  // 時刻特徴量（曜日/時間帯）
  const d = new Date(params.timestamp);
  const hour = d.getHours();
  const day = d.getDay();

  // responseTimeはスケールが大きいので log 正規化
  const rtLog = Math.log10(Math.max(50, params.responseTimeMs)) / 4; // ~0-1程度

  return [
    clamp01(rtLog),
    clamp01(hour / 23),
    clamp01(day / 6),
    clamp01(safeDiv(attempts, 50, 0)),
    clamp01(accuracy),
    clamp01(safeDiv(streak, 10, 0)),
    clamp01(safeDiv(incorrect, 20, 0)),
    clamp01(safeDiv(daysSinceLast, 30, 1)),
    clamp01(Math.log10(Math.max(50, avgRt)) / 4),
    clamp01(safeDiv(progress?.difficultyScore ?? 0, 1, 0)),
  ];
}

function estimateHeuristic(params: {
  progress: StorageWordProgress | null | undefined;
  wasCorrect: boolean;
  responseTimeMs: number;
  timestamp: number;
}): Confidence5Estimate {
  if (!params.wasCorrect) {
    return { confidence5: 1, score01: 0.0, source: 'heuristic' };
  }

  const avgRt = params.progress?.averageResponseTime ?? 3000;
  const speedRatio = avgRt > 0 ? avgRt / Math.max(200, params.responseTimeMs) : 1;

  // 速いほど高い（ただし過剰に上がらないように）
  const speedScore = clamp01(Math.log2(Math.max(0.25, Math.min(4, speedRatio))) / 2 + 0.5);

  const streak = params.progress?.consecutiveCorrect ?? 0;
  const streakScore = clamp01(streak / 6);

  const score01 = clamp01(0.65 * speedScore + 0.35 * streakScore);
  return { confidence5: mapScoreToConfidence5(score01), score01, source: 'heuristic' };
}

/**
 * 回答ログから「自信度(1-5)」を推定する。
 * - 基本は深層学習モデルの p(correct) を使用（オンライン学習）
 * - モデル未初期化/失敗時はヒューリスティックにフォールバック
 */
export async function estimateConfidence5(params: {
  progress: StorageWordProgress | null | undefined;
  wasCorrect: boolean;
  responseTimeMs: number;
  timestamp?: number;
}): Promise<Confidence5Estimate> {
  const timestamp = params.timestamp ?? Date.now();

  // 不正解は常に最低（SM-2品質の直感と整合）
  if (!params.wasCorrect) {
    return { confidence5: 1, score01: 0.0, source: 'deep' };
  }

  const features = buildFeatures({
    progress: params.progress,
    responseTimeMs: params.responseTimeMs,
    timestamp,
  });

  try {
    const model = getAnswerConfidenceModel(features.length);
    await model.ensureInitialized();

    const pred = model.predict(features);
    const score01 = clamp01(pred.pCorrect);

    // 学習は非同期で回す（UX優先）
    model.learn(features, params.wasCorrect).catch(() => {
      // ignore
    });

    return { confidence5: mapScoreToConfidence5(score01), score01, source: 'deep' };
  } catch {
    return estimateHeuristic({
      progress: params.progress,
      wasCorrect: params.wasCorrect,
      responseTimeMs: params.responseTimeMs,
      timestamp,
    });
  }
}
