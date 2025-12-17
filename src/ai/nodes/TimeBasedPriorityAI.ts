/**
 * TimeBasedPriorityAI - 時間ベースの優先度管理AI
 *
 * 機能:
 * - 最終学習からの経過時間を計算
 * - 時間バケツシステム: 水が順に入っていくように段階的に優先度上昇
 * - 「いつまでも残らない」問題解消システム
 *
 * アルゴリズム: 17段階の時間バケツ
 * 1分 → 3分 → 5分 → 7分 → 10分 → 15分 → 30分 → 1時間 → 2時間 → 3時間
 * → 4時間 → 5時間 → 6時間 → 7時間 → 8時間 → 12時間 → 24時間
 *
 * 各バケツで優先度が段階的に上昇（0 → 100）
 *
 * @author AI Assistant
 * @version 2.0
 * @since 2025-12-17
 */

import type { WordProgress } from '@/storage/progress/types';

// 時間バケツ定義（分単位）- 水が順に入っていくイメージ
const TIME_BUCKETS_MINUTES = [
  1, // 1分
  3, // 3分
  5, // 5分
  7, // 7分
  10, // 10分
  15, // 15分
  30, // 30分
  60, // 1時間
  120, // 2時間
  180, // 3時間
  240, // 4時間
  300, // 5時間
  360, // 6時間
  420, // 7時間
  480, // 8時間
  720, // 12時間
  1440, // 24時間
];

// 各バケツの優先度ブースト（段階的増加）
const BUCKET_PRIORITY_BOOST = [
  5, // 1分: +5
  10, // 3分: +10
  15, // 5分: +15
  20, // 7分: +20
  25, // 10分: +25
  30, // 15分: +30
  40, // 30分: +40
  50, // 1時間: +50
  60, // 2時間: +60
  70, // 3時間: +70
  75, // 4時間: +75
  80, // 5時間: +80
  85, // 6時間: +85
  90, // 7時間: +90
  95, // 8時間: +95
  98, // 12時間: +98
  100, // 24時間: +100（最優先）
];

export interface TimeBasedPriorityResult {
  timePriorityBoost: number; // 時間ベースの優先度ブースト（0-100）
  minutesElapsed: number; // 経過分数
  currentBucket: number; // 現在のバケツ番号（0-17）
  bucketName: string; // バケツ名（例: "3分", "1時間"）
  urgencyLevel: 'normal' | 'attention' | 'urgent' | 'critical'; // 緊急度レベル
  shouldPrioritize: boolean; // 優先すべきか
}

/**
 * 経過時間からバケツ番号を計算
 */
function getTimeBucket(minutesElapsed: number): number {
  for (let i = 0; i < TIME_BUCKETS_MINUTES.length; i++) {
    if (minutesElapsed < TIME_BUCKETS_MINUTES[i]) {
      return i;
    }
  }
  return TIME_BUCKETS_MINUTES.length; // 24時間以上
}

/**
 * バケツ番号から名前を取得
 */
function getBucketName(bucketIndex: number): string {
  if (bucketIndex === 0) return '1分未満';
  if (bucketIndex > TIME_BUCKETS_MINUTES.length) return '24時間以上';

  const minutes = TIME_BUCKETS_MINUTES[bucketIndex - 1];
  if (minutes < 60) return `${minutes}分`;
  return `${minutes / 60}時間`;
}

/**
 * 時間ベースの優先度を計算（バケツシステム）
 */
export function calculateTimeBasedPriority(wordProgress: WordProgress): TimeBasedPriorityResult {
  // lastStudiedがない場合（未学習）は優先度0
  const lastTime = wordProgress.lastStudied || 0;
  if (lastTime === 0) {
    return {
      timePriorityBoost: 0,
      minutesElapsed: 0,
      currentBucket: 0,
      bucketName: '未学習',
      urgencyLevel: 'normal',
      shouldPrioritize: false,
    };
  }

  const now = Date.now();
  const minutesElapsed = (now - lastTime) / (1000 * 60);

  // 「分からない」「まだまだ」状態の場合のみ時間ベース優先度を適用
  const isStuck =
    wordProgress.incorrectCount > 0 ||
    (wordProgress.consecutiveCorrect < 3 &&
      wordProgress.correctCount + wordProgress.incorrectCount > 0);

  if (!isStuck) {
    return {
      timePriorityBoost: 0,
      minutesElapsed: Math.floor(minutesElapsed),
      currentBucket: 0,
      bucketName: '覚えてる',
      urgencyLevel: 'normal',
      shouldPrioritize: false,
    };
  }

  // バケツ番号を取得
  const bucketIndex = getTimeBucket(minutesElapsed);
  const bucketName = getBucketName(bucketIndex);

  // 優先度ブーストを計算
  let timePriorityBoost = 0;
  if (bucketIndex > 0 && bucketIndex <= BUCKET_PRIORITY_BOOST.length) {
    timePriorityBoost = BUCKET_PRIORITY_BOOST[bucketIndex - 1];
  } else if (bucketIndex > BUCKET_PRIORITY_BOOST.length) {
    timePriorityBoost = 100; // 24時間以上
  }

  // 緊急度レベルを判定
  let urgencyLevel: 'normal' | 'attention' | 'urgent' | 'critical' = 'normal';
  if (timePriorityBoost >= 90) {
    urgencyLevel = 'critical';
  } else if (timePriorityBoost >= 60) {
    urgencyLevel = 'urgent';
  } else if (timePriorityBoost >= 30) {
    urgencyLevel = 'attention';
  }

  return {
    timePriorityBoost,
    minutesElapsed: Math.floor(minutesElapsed),
    currentBucket: bucketIndex,
    bucketName,
    urgencyLevel,
    shouldPrioritize: timePriorityBoost >= 30, // 15分以上で優先
  };
}

/**
 * 時間ベース優先度のメッセージ生成
 */
export function getTimeBasedMessage(result: TimeBasedPriorityResult): string {
  if (!result.shouldPrioritize) return '';

  const { bucketName, urgencyLevel, minutesElapsed } = result;
  const hours = Math.floor(minutesElapsed / 60);
  const mins = minutesElapsed % 60;
  const timeStr = hours > 0 ? `${hours}時間${mins}分` : `${mins}分`;

  switch (urgencyLevel) {
    case 'critical':
      return `🔴 ${timeStr}経過！バケツ「${bucketName}」- 最優先で復習しましょう`;
    case 'urgent':
      return `🟠 ${timeStr}経過。バケツ「${bucketName}」- 集中的な学習が必要です`;
    case 'attention':
      return `🟡 ${timeStr}経過。バケツ「${bucketName}」- そろそろ復習しましょう`;
    default:
      return '';
  }
}

/**
 * 複数の単語の時間ベース優先度を一括計算
 */
export function calculateBatchTimeBasedPriority(
  wordProgressList: WordProgress[]
): Map<string, TimeBasedPriorityResult> {
  const results = new Map<string, TimeBasedPriorityResult>();

  for (const progress of wordProgressList) {
    const result = calculateTimeBasedPriority(progress);
    results.set(progress.word, result);
  }

  return results;
}

/**
 * 時間ベース優先度でソート
 */
export function sortByTimeBasedPriority(wordProgressList: WordProgress[]): WordProgress[] {
  return [...wordProgressList].sort((a, b) => {
    const priorityA = calculateTimeBasedPriority(a).timePriorityBoost;
    const priorityB = calculateTimeBasedPriority(b).timePriorityBoost;
    return priorityB - priorityA; // 降順（優先度が高い順）
  });
}

/**
 * 時間ベース優先度の統計情報
 */
export interface TimeBasedStats {
  totalStuckWords: number; // 未解決語句数
  criticalWords: number; // 緊急語句数（8時間以上）
  urgentWords: number; // 要注意語句数（2時間以上）
  attentionWords: number; // 注意語句数（15分以上）
  averageMinutesElapsed: number; // 平均経過分数
  bucketDistribution: Map<string, number>; // バケツごとの分布
}

export function getTimeBasedStats(wordProgressList: WordProgress[]): TimeBasedStats {
  const results = wordProgressList.map(calculateTimeBasedPriority);
  const stuckWords = results.filter((r) => r.shouldPrioritize);

  // バケツごとの分布を集計
  const bucketDistribution = new Map<string, number>();
  for (const result of results) {
    if (result.shouldPrioritize) {
      const count = bucketDistribution.get(result.bucketName) || 0;
      bucketDistribution.set(result.bucketName, count + 1);
    }
  }

  return {
    totalStuckWords: stuckWords.length,
    criticalWords: results.filter((r) => r.urgencyLevel === 'critical').length,
    urgentWords: results.filter((r) => r.urgencyLevel === 'urgent').length,
    attentionWords: results.filter((r) => r.urgencyLevel === 'attention').length,
    averageMinutesElapsed:
      stuckWords.length > 0
        ? stuckWords.reduce((sum, r) => sum + r.minutesElapsed, 0) / stuckWords.length
        : 0,
    bucketDistribution,
  };
}
