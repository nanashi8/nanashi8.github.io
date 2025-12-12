/**
 * 忘却予測アラートシステム
 * 単語別とグループ別の忘却を予測し、復習タイミングを通知
 */

import { calculateMemoryRetention } from '@/ai/adaptation/adaptiveLearningAI';
import { loadProgressSync, WordProgress } from '@/storage/progress/progressStorage';
import { analyzeConfusionPatterns, ConfusionGroup } from '@/features/analysis/confusionPairs';

/**
 * 忘却アラート
 */
export interface ForgettingAlert {
  type: 'word' | 'group';
  word?: string; // 単語別アラート
  group?: ConfusionGroup; // グループ別アラート
  currentRetention: number; // 現在の定着度（0-100）
  predictedRetention24h: number; // 24時間後の予測定着度
  predictedRetention7d: number; // 7日後の予測定着度
  urgency: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  recommendedAction: string;
  daysUntilCritical: number; // 定着度50%を下回るまでの日数
}

/**
 * すべての忘却アラートを取得
 */
export function getAllForgettingAlerts(): ForgettingAlert[] {
  const alerts: ForgettingAlert[] = [];

  // 単語別アラート
  const wordAlerts = getWordForgettingAlerts();
  alerts.push(...wordAlerts);

  // グループ別アラート
  const groupAlerts = getGroupForgettingAlerts();
  alerts.push(...groupAlerts);

  // 緊急度順にソート
  return alerts.sort((a, b) => {
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });
}

/**
 * 単語別の忘却アラート
 */
function getWordForgettingAlerts(): ForgettingAlert[] {
  const progress = loadProgressSync();
  const alerts: ForgettingAlert[] = [];
  const now = Date.now();

  Object.entries(progress.wordProgress).forEach(([word, wp]) => {
    // 一度も学習していない単語はスキップ
    if (wp.correctCount + wp.incorrectCount === 0) return;

    // 記憶定着度を計算
    const retention = calculateMemoryRetention(word, wp, now);

    // 24時間後の予測
    const retention24h = predictRetentionAfterDays(wp, 1);

    // 7日後の予測
    const retention7d = predictRetentionAfterDays(wp, 7);

    // 定着度50%を下回るまでの日数
    const daysUntilCritical = calculateDaysUntilCritical(wp, retention.retentionScore);

    // アラートが必要かチェック
    let urgency: 'critical' | 'high' | 'medium' | 'low' | null = null;
    let message = '';
    let recommendedAction = '';

    if (retention.retentionScore < 50) {
      urgency = 'critical';
      message = `「${word}」の定着度が${Math.round(retention.retentionScore)}%まで低下しています！`;
      recommendedAction = '今すぐ復習してください';
    } else if (retention24h < 50) {
      urgency = 'high';
      message = `「${word}」は明日までに復習しないと定着度が50%以下に低下します`;
      recommendedAction = '本日中に復習することをお勧めします';
    } else if (retention7d < 50) {
      urgency = 'medium';
      message = `「${word}」は${daysUntilCritical}日後に復習が必要になります`;
      recommendedAction = `${daysUntilCritical}日以内に復習してください`;
    } else if (retention.retentionScore < 70 && retention7d < 70) {
      urgency = 'low';
      message = `「${word}」の定着度は${Math.round(retention.retentionScore)}%です`;
      recommendedAction = '今週中に復習すると効果的です';
    }

    if (urgency) {
      alerts.push({
        type: 'word',
        word,
        currentRetention: Math.round(retention.retentionScore),
        predictedRetention24h: Math.round(retention24h),
        predictedRetention7d: Math.round(retention7d),
        urgency,
        message,
        recommendedAction,
        daysUntilCritical,
      });
    }
  });

  return alerts;
}

/**
 * グループ別の忘却アラート
 */
function getGroupForgettingAlerts(): ForgettingAlert[] {
  const confusionGroups = analyzeConfusionPatterns();
  const alerts: ForgettingAlert[] = [];
  const progress = loadProgressSync();

  confusionGroups
    .filter((g) => g.needsReview)
    .slice(0, 5) // 上位5グループのみ
    .forEach((group) => {
      // グループ内の単語の平均定着度を計算
      let totalRetention = 0;
      let count = 0;
      let minRetention = 100;

      group.words.forEach((word) => {
        const wp = progress.wordProgress[word];
        if (wp && wp.correctCount + wp.incorrectCount > 0) {
          const retention = calculateMemoryRetention(word, wp);
          totalRetention += retention.retentionScore;
          minRetention = Math.min(minRetention, retention.retentionScore);
          count++;
        }
      });

      if (count === 0) return;

      const avgRetention = totalRetention / count;

      // グループの緊急度を判定
      let urgency: 'critical' | 'high' | 'medium' | 'low';
      if (minRetention < 50 || avgRetention < 55) {
        urgency = 'critical';
      } else if (avgRetention < 65) {
        urgency = 'high';
      } else if (avgRetention < 75) {
        urgency = 'medium';
      } else {
        urgency = 'low';
      }

      const message = `混同しやすい単語グループ「${group.words.join(', ')}」の定着度が低下しています`;
      const recommendedAction = '区別を意識しながら集中的に復習してください';

      alerts.push({
        type: 'group',
        group,
        currentRetention: Math.round(avgRetention),
        predictedRetention24h: Math.round(avgRetention * 0.95), // 簡易予測
        predictedRetention7d: Math.round(avgRetention * 0.85), // 簡易予測
        urgency,
        message,
        recommendedAction,
        daysUntilCritical: Math.max(1, Math.floor((avgRetention - 50) / 5)),
      });
    });

  return alerts;
}

/**
 * N日後の定着度を予測
 */
function predictRetentionAfterDays(wp: WordProgress, days: number): number {
  const totalAttempts = wp.correctCount + wp.incorrectCount;
  if (totalAttempts === 0) return 0;

  const accuracy = wp.correctCount / totalAttempts;
  const initialStrength = accuracy * 100;

  // 忘却率を推定
  const errorRate = wp.incorrectCount / totalAttempts;
  const decayRate = 0.3 + errorRate * 0.4;

  // 強化効果
  const reinforcementFactor = 1 + Math.log1p(wp.correctCount);

  // エビングハウスの忘却曲線
  const predictedRetention = initialStrength * Math.exp((-days * decayRate) / reinforcementFactor);

  return Math.max(0, Math.min(100, predictedRetention));
}

/**
 * 定着度50%を下回るまでの日数を計算
 */
function calculateDaysUntilCritical(wp: WordProgress, currentRetention: number): number {
  if (currentRetention < 50) return 0;

  const totalAttempts = wp.correctCount + wp.incorrectCount;
  if (totalAttempts === 0) return 999;

  const errorRate = wp.incorrectCount / totalAttempts;
  const decayRate = 0.3 + errorRate * 0.4;
  const reinforcementFactor = 1 + Math.log1p(wp.correctCount);

  // currentRetention * e^(-days * decayRate / reinforcementFactor) = 50
  // days = log(currentRetention / 50) * reinforcementFactor / decayRate
  const days = (Math.log(currentRetention / 50) * reinforcementFactor) / decayRate;

  return Math.max(1, Math.ceil(days));
}

/**
 * 緊急度別にアラートを取得
 */
export function getAlertsByUrgency(
  urgency: 'critical' | 'high' | 'medium' | 'low'
): ForgettingAlert[] {
  return getAllForgettingAlerts().filter((alert) => alert.urgency === urgency);
}

/**
 * 今日復習すべき単語を取得
 */
export function getTodayReviewWords(): string[] {
  const criticalAlerts = getAlertsByUrgency('critical');
  const highAlerts = getAlertsByUrgency('high');

  const words = new Set<string>();

  [...criticalAlerts, ...highAlerts].forEach((alert) => {
    if (alert.type === 'word' && alert.word) {
      words.add(alert.word);
    } else if (alert.type === 'group' && alert.group) {
      alert.group.words.forEach((w) => words.add(w));
    }
  });

  return Array.from(words);
}

/**
 * アラートサマリーを取得
 */
export function getAlertSummary(): {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  todayReviewCount: number;
} {
  const alerts = getAllForgettingAlerts();

  return {
    total: alerts.length,
    critical: alerts.filter((a) => a.urgency === 'critical').length,
    high: alerts.filter((a) => a.urgency === 'high').length,
    medium: alerts.filter((a) => a.urgency === 'medium').length,
    low: alerts.filter((a) => a.urgency === 'low').length,
    todayReviewCount: getTodayReviewWords().length,
  };
}

/**
 * アラートメッセージを生成（ランダムで1つ表示）
 */
export function getRandomAlertMessage(): string | null {
  const alerts = getAllForgettingAlerts();

  if (alerts.length === 0) {
    return null;
  }

  // 緊急度が高いものを優先
  const criticalAndHigh = alerts.filter((a) => a.urgency === 'critical' || a.urgency === 'high');
  const targetAlerts = criticalAndHigh.length > 0 ? criticalAndHigh : alerts;

  const randomAlert = targetAlerts[Math.floor(Math.random() * targetAlerts.length)];

  return `⏰ ${randomAlert.message} ${randomAlert.recommendedAction}`;
}
