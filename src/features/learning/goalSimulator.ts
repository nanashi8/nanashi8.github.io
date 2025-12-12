/**
 * 目標達成シミュレーター
 * 難易度レベルとの連動、達成予測計算
 */

import { loadProgressSync, getTotalMasteredWordsCount } from '@/storage/progress/progressStorage';

/**
 * 目標レベルの定義
 */
export interface GoalLevel {
  id: string;
  name: string;
  requiredWords: number; // 必要単語数
  requiredAccuracy: number; // 必要正答率（%）
  description: string;
  icon: string;
}

/**
 * 利用可能な目標レベル
 */
export const GOAL_LEVELS: GoalLevel[] = [
  {
    id: 'beginner-basic',
    name: '初級基礎',
    requiredWords: 600,
    requiredAccuracy: 70,
    description: '基本的な単語',
    icon: '🌱',
  },
  {
    id: 'beginner-complete',
    name: '初級完了',
    requiredWords: 1077,
    requiredAccuracy: 70,
    description: '初級レベル完全習得',
    icon: '🌿',
  },
  {
    id: 'intermediate-half',
    name: '中級半分',
    requiredWords: 1900,
    requiredAccuracy: 75,
    description: '中級レベル50%',
    icon: '🌳',
  },
  {
    id: 'intermediate-complete',
    name: '中級完了',
    requiredWords: 2693,
    requiredAccuracy: 75,
    description: '中級レベル完全習得',
    icon: '🎓',
  },
  {
    id: 'advanced-half',
    name: '上級半分',
    requiredWords: 3150,
    requiredAccuracy: 80,
    description: '上級レベル50%',
    icon: '📚',
  },
  {
    id: 'advanced-complete',
    name: '上級完了',
    requiredWords: 3578,
    requiredAccuracy: 80,
    description: '上級レベル完全習得',
    icon: '🚀',
  },
  {
    id: 'master',
    name: 'マスター',
    requiredWords: 4000,
    requiredAccuracy: 85,
    description: '全レベル制覇',
    icon: '⭐',
  },
];

/**
 * 目標達成状況
 */
export interface GoalProgress {
  goal: GoalLevel;
  currentWords: number; // 現在の定着単語数
  currentAccuracy: number; // 現在の正答率
  wordsProgress: number; // 単語数の達成率（0-100）
  accuracyProgress: number; // 正答率の達成率（0-100）
  overallProgress: number; // 総合達成率（0-100）
  isAchieved: boolean; // 達成済みか
  estimatedDaysToAchieve: number; // 達成までの推定日数
  recommendedDailyWords: number; // 1日の推奨学習単語数
}

/**
 * ユーザーの現在の目標を取得
 */
export function getCurrentGoal(): GoalLevel {
  const saved = localStorage.getItem('user-goal-level');
  if (saved) {
    const goalId = JSON.parse(saved);
    const goal = GOAL_LEVELS.find((g) => g.id === goalId);
    if (goal) return goal;
  }
  // デフォルトは中級完了
  return GOAL_LEVELS.find((g) => g.id === 'intermediate-complete') || GOAL_LEVELS[0];
}

/**
 * 目標を設定
 */
export function setCurrentGoal(goalId: string): void {
  localStorage.setItem('user-goal-level', JSON.stringify(goalId));
}

/**
 * 目標達成状況を計算
 */
export function calculateGoalProgress(goal?: GoalLevel): GoalProgress {
  const targetGoal = goal || getCurrentGoal();
  const progress = loadProgressSync();

  // 定着単語数を取得
  const currentWords = getTotalMasteredWordsCount();

  // 全体の正答率を計算
  let totalCorrect = 0;
  let totalAnswered = 0;

  Object.values(progress.wordProgress).forEach((wp) => {
    totalCorrect += wp.correctCount;
    totalAnswered += wp.correctCount + wp.incorrectCount;
  });

  const currentAccuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;

  // 進捗率を計算
  const wordsProgress = Math.min(100, (currentWords / targetGoal.requiredWords) * 100);
  const accuracyProgress = Math.min(100, (currentAccuracy / targetGoal.requiredAccuracy) * 100);
  const overallProgress = (wordsProgress + accuracyProgress) / 2;

  // 達成判定
  const isAchieved =
    currentWords >= targetGoal.requiredWords && currentAccuracy >= targetGoal.requiredAccuracy;

  // 達成までの推定日数を計算
  const estimatedDaysToAchieve = calculateEstimatedDays(
    currentWords,
    targetGoal.requiredWords,
    currentAccuracy,
    targetGoal.requiredAccuracy
  );

  // 1日の推奨学習単語数
  const remainingWords = Math.max(0, targetGoal.requiredWords - currentWords);
  const recommendedDailyWords =
    estimatedDaysToAchieve > 0 ? Math.ceil(remainingWords / estimatedDaysToAchieve) : 0;

  return {
    goal: targetGoal,
    currentWords,
    currentAccuracy: Math.round(currentAccuracy),
    wordsProgress: Math.round(wordsProgress),
    accuracyProgress: Math.round(accuracyProgress),
    overallProgress: Math.round(overallProgress),
    isAchieved,
    estimatedDaysToAchieve,
    recommendedDailyWords: Math.min(50, recommendedDailyWords), // 最大50単語/日
  };
}

/**
 * 達成までの推定日数を計算
 */
function calculateEstimatedDays(
  currentWords: number,
  requiredWords: number,
  currentAccuracy: number,
  requiredAccuracy: number
): number {
  if (currentWords >= requiredWords && currentAccuracy >= requiredAccuracy) {
    return 0; // すでに達成
  }

  const progress = loadProgressSync();

  // 過去7日間の学習ペースを計算
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  let recentMastered = 0;
  Object.values(progress.wordProgress).forEach((wp) => {
    if (wp.lastStudied >= sevenDaysAgo && wp.masteryLevel === 'mastered') {
      recentMastered++;
    }
  });

  const dailyMasteryRate = recentMastered / 7;

  // 学習ペースが低すぎる場合はデフォルト値を使用
  const effectiveDailyRate = Math.max(5, dailyMasteryRate);

  // 残りの単語数
  const remainingWords = Math.max(0, requiredWords - currentWords);

  // 単語数ベースの推定日数
  const daysForWords = remainingWords / effectiveDailyRate;

  // 正答率の改善が必要な場合の追加日数
  const accuracyGap = Math.max(0, requiredAccuracy - currentAccuracy);
  const daysForAccuracy = accuracyGap * 2; // 正答率1%向上に2日と仮定

  // 合計
  const totalDays = Math.ceil(daysForWords + daysForAccuracy);

  return Math.max(1, totalDays);
}

/**
 * すべての目標レベルの達成状況を取得
 */
export function getAllGoalProgress(): GoalProgress[] {
  return GOAL_LEVELS.map((goal) => calculateGoalProgress(goal));
}

/**
 * 次に達成できそうな目標を取得
 */
export function getNextAchievableGoal(): GoalLevel | null {
  const allProgress = getAllGoalProgress();

  // まだ達成していない目標で、最も達成率が高いものを選ぶ
  const unachieved = allProgress
    .filter((p) => !p.isAchieved)
    .sort((a, b) => b.overallProgress - a.overallProgress);

  return unachieved.length > 0 ? unachieved[0].goal : null;
}

/**
 * 目標達成のメッセージを生成
 */
export function generateGoalMessage(includeEncouragement: boolean = true): string {
  const goalProgress = calculateGoalProgress();

  if (goalProgress.isAchieved) {
    return `🎉 おめでとうございます！${goalProgress.goal.name}レベルを達成しました！`;
  }

  const messages: string[] = [];

  // 進捗メッセージ
  messages.push(
    `${goalProgress.goal.icon} ${goalProgress.goal.name}まで ${goalProgress.overallProgress}%`
  );

  // 詳細情報
  if (goalProgress.currentWords < goalProgress.goal.requiredWords) {
    const remaining = goalProgress.goal.requiredWords - goalProgress.currentWords;
    messages.push(`あと${remaining}語`);
  }

  if (goalProgress.estimatedDaysToAchieve > 0) {
    if (goalProgress.estimatedDaysToAchieve <= 7) {
      messages.push(`あと${goalProgress.estimatedDaysToAchieve}日で達成！`);
    } else if (goalProgress.estimatedDaysToAchieve <= 30) {
      messages.push(`約${Math.ceil(goalProgress.estimatedDaysToAchieve / 7)}週間で達成見込み`);
    } else {
      messages.push(`約${Math.ceil(goalProgress.estimatedDaysToAchieve / 30)}ヶ月で達成見込み`);
    }
  }

  // 励ましのメッセージ
  if (includeEncouragement) {
    if (goalProgress.overallProgress >= 80) {
      messages.push('もう少しで達成です！頑張りましょう！');
    } else if (goalProgress.overallProgress >= 50) {
      messages.push('順調に進んでいます！この調子で続けましょう！');
    } else if (goalProgress.overallProgress >= 25) {
      messages.push('着実に進歩しています！');
    }
  }

  return messages.join(' ');
}

/**
 * 現在のペースで達成できる目標を提案
 */
export function suggestRealisticGoal(): GoalLevel {
  const progress = loadProgressSync();
  const masteredCount = getTotalMasteredWordsCount();

  // 現在の学習ペースを計算
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  let recentMastered = 0;
  Object.values(progress.wordProgress).forEach((wp) => {
    if (wp.lastStudied >= thirtyDaysAgo && wp.masteryLevel === 'mastered') {
      recentMastered++;
    }
  });

  const dailyRate = recentMastered / 30;
  const weeklyRate = dailyRate * 7;

  // 8週間（2ヶ月）で達成できる単語数を推定
  const achievableWords = masteredCount + weeklyRate * 8;

  // 最適な目標を選択
  const suitableGoals = GOAL_LEVELS.filter(
    (g) =>
      g.requiredWords <= achievableWords * 1.2 && // 少し余裕を持たせる
      g.requiredWords >= masteredCount // 現在の単語数以上
  );

  if (suitableGoals.length > 0) {
    // 最も高いレベルを選択
    return suitableGoals[suitableGoals.length - 1];
  }

  // 適切な目標がない場合は、現在の単語数に最も近い目標
  return GOAL_LEVELS.reduce((closest, goal) => {
    const currentDiff = Math.abs(goal.requiredWords - masteredCount);
    const closestDiff = Math.abs(closest.requiredWords - masteredCount);
    return currentDiff < closestDiff ? goal : closest;
  });
}
