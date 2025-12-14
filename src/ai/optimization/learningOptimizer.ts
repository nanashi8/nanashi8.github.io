// 適応型学習最適化システム
import { Question, UserLearningProfile } from '@/types';
import { WordProgress } from '@/storage/progress/progressStorage';

// ユーザープロファイルの構築
export function buildUserProfile(
  wordProgressMap: { [word: string]: WordProgress },
  _allQuestions: Question[]
): UserLearningProfile {
  const wordProgresses = Object.values(wordProgressMap);

  // 難易度別の正答率計算
  const difficultyStats = {
    beginner: { correct: 0, total: 0 },
    intermediate: { correct: 0, total: 0 },
    advanced: { correct: 0, total: 0 },
  };

  wordProgresses.forEach((wp) => {
    const difficulty = wp.difficulty as 'beginner' | 'intermediate' | 'advanced';
    if (difficulty && difficultyStats[difficulty]) {
      difficultyStats[difficulty].total += wp.correctCount + wp.incorrectCount;
      difficultyStats[difficulty].correct += wp.correctCount;
    }
  });

  const difficultyMastery = {
    beginner:
      difficultyStats.beginner.total > 0
        ? (difficultyStats.beginner.correct / difficultyStats.beginner.total) * 100
        : 70,
    intermediate:
      difficultyStats.intermediate.total > 0
        ? (difficultyStats.intermediate.correct / difficultyStats.intermediate.total) * 100
        : 60,
    advanced:
      difficultyStats.advanced.total > 0
        ? (difficultyStats.advanced.correct / difficultyStats.advanced.total) * 100
        : 50,
  };

  // カテゴリー別の統計計算
  const categoryMap: {
    [category: string]: {
      correct: number;
      total: number;
      studied: number;
      mastered: number;
    };
  } = {};

  wordProgresses.forEach((wp) => {
    if (!wp.category) return;

    if (!categoryMap[wp.category]) {
      categoryMap[wp.category] = { correct: 0, total: 0, studied: 0, mastered: 0 };
    }

    const cat = categoryMap[wp.category];
    cat.total += wp.correctCount + wp.incorrectCount;
    cat.correct += wp.correctCount;
    cat.studied += 1;
    if (wp.masteryLevel === 'mastered') {
      cat.mastered += 1;
    }
  });

  const categoryStrength: UserLearningProfile['categoryStrength'] = {};

  Object.entries(categoryMap).forEach(([category, stats]) => {
    const accuracyRate = stats.total > 0 ? (stats.correct / stats.total) * 100 : 50;
    const retentionRate = stats.studied > 0 ? (stats.mastered / stats.studied) * 100 : 0;
    const learningSpeed = stats.mastered > 0 ? stats.total / stats.mastered : 10;

    let confidence: 'high' | 'medium' | 'low' = 'medium';
    if (accuracyRate >= 75 && retentionRate >= 60) {
      confidence = 'high';
    } else if (accuracyRate < 55 || retentionRate < 30) {
      confidence = 'low';
    }

    categoryStrength[category] = {
      accuracyRate,
      learningSpeed,
      retentionRate,
      confidence,
      totalStudied: stats.studied,
      totalMastered: stats.mastered,
    };
  });

  // 学習ペースの計算
  const now = Date.now();
  const recentProgress = wordProgresses.filter(
    (wp) => now - wp.lastStudied < 7 * 24 * 60 * 60 * 1000 // 過去7日間
  );

  const dailyAverage =
    recentProgress.length > 0
      ? recentProgress.reduce((sum, wp) => sum + wp.correctCount + wp.incorrectCount, 0) / 7
      : 20;

  let studyPattern: 'fast' | 'steady' | 'slow' = 'steady';
  if (dailyAverage >= 50) studyPattern = 'fast';
  else if (dailyAverage < 20) studyPattern = 'slow';

  // 動的閾値の設定
  const overallAccuracy =
    (difficultyMastery.beginner + difficultyMastery.intermediate + difficultyMastery.advanced) / 3;

  return {
    difficultyMastery,
    categoryStrength,
    dynamicThresholds: {
      masteryThreshold: Math.max(70, Math.min(85, overallAccuracy - 10)),
      reviewThreshold: Math.max(50, Math.min(70, overallAccuracy - 20)),
      priorityThreshold: Math.max(55, Math.min(75, overallAccuracy - 15)),
    },
    learningPace: {
      dailyAverage,
      preferredBatchSize: studyPattern === 'fast' ? 50 : studyPattern === 'steady' ? 30 : 20,
      studyPattern,
    },
    lastUpdated: Date.now(),
  };
}

// 単語の期待正答率を計算
export function getExpectedAccuracy(question: Question, profile: UserLearningProfile): number {
  const difficulty = question.difficulty as 'beginner' | 'intermediate' | 'advanced';
  let baseLine = profile.difficultyMastery[difficulty] || 60;

  // カテゴリー補正
  const category = question.category || '';
  if (category && profile.categoryStrength[category]) {
    const categoryBonus = (profile.categoryStrength[category].accuracyRate - baseLine) * 0.4;
    baseLine += categoryBonus;
  }

  return Math.max(0, Math.min(100, baseLine));
}

// 優先度スコアリング
export function calculatePriority(
  question: Question,
  wordProgress: WordProgress | undefined,
  profile: UserLearningProfile,
  userPlan: { totalDays: number; currentDay: number }
): number {
  let score = 0;

  // 既に習得済みの単語は優先度を下げる
  if (wordProgress?.masteryLevel === 'mastered') {
    return -100;
  }

  // 新規単語
  if (!wordProgress || wordProgress.masteryLevel === 'new') {
    score += 20;
  }

  // 習得に近い単語を優先(正答率50-79%)
  if (wordProgress) {
    const accuracy =
      wordProgress.correctCount > 0
        ? (wordProgress.correctCount / (wordProgress.correctCount + wordProgress.incorrectCount)) *
          100
        : 0;

    if (accuracy >= 50 && accuracy < 80) {
      score += 40; // 最高優先度
    } else if (accuracy >= 30 && accuracy < 50) {
      score += 20;
    } else if (accuracy >= 80) {
      score += 5; // 復習程度
    }
  }

  // 期待正答率との差分
  const expected = getExpectedAccuracy(question, profile);
  const actual = wordProgress
    ? (wordProgress.correctCount /
        Math.max(1, wordProgress.correctCount + wordProgress.incorrectCount)) *
      100
    : 50;

  if (actual < expected - 20) {
    score += 30; // 期待より大幅に悪い → 集中学習
  }

  // カテゴリーバランス調整
  const category = question.category || '';
  if (category && profile.categoryStrength[category]) {
    const catData = profile.categoryStrength[category];

    // 苦手カテゴリーを適度に混ぜる
    if (catData.confidence === 'low') {
      score += 15;
    } else if (catData.confidence === 'high') {
      // 得意カテゴリーから新単語を優先投入
      if (!wordProgress || wordProgress.masteryLevel === 'new') {
        score += 10;
      }
    }
  }

  // 復習タイミング(忘却曲線)
  if (wordProgress && wordProgress.lastStudied) {
    const daysSinceStudy = (Date.now() - wordProgress.lastStudied) / (24 * 60 * 60 * 1000);

    // 理想的な復習間隔: 1日後、3日後、7日後、14日後
    const idealIntervals = [1, 3, 7, 14];
    const nearestInterval = idealIntervals.reduce((prev, curr) =>
      Math.abs(curr - daysSinceStudy) < Math.abs(prev - daysSinceStudy) ? curr : prev
    );

    if (Math.abs(nearestInterval - daysSinceStudy) < 0.5) {
      score += 25; // 復習タイミングが近い
    }
  }

  // プラン達成のためのペース調整
  const daysRemaining = userPlan.totalDays - userPlan.currentDay;
  if (daysRemaining > 0) {
    // ペースアップが必要な場合、習得に近い単語を優先
    const requiredPaceMultiplier = daysRemaining < 30 ? 1.5 : 1.0;
    if (wordProgress && wordProgress.masteryLevel === 'learning') {
      score += 10 * requiredPaceMultiplier;
    }
  }

  // 連続不正解の単語は一旦保留(スコアを下げる)
  if (wordProgress && wordProgress.consecutiveIncorrect >= 3) {
    score -= 20;
  }

  return score;
}

// 最適な出題順序で問題を選択
export function selectOptimalQuestions(
  allQuestions: Question[],
  wordProgressMap: { [word: string]: WordProgress },
  profile: UserLearningProfile,
  batchSize: number,
  userPlan: { totalDays: number; currentDay: number }
): Question[] {
  // 各問題に優先度スコアを付与
  const scoredQuestions = allQuestions.map((q) => ({
    question: q,
    priority: calculatePriority(q, wordProgressMap[q.word], profile, userPlan),
  }));

  // 優先度順にソート
  scoredQuestions.sort((a, b) => b.priority - a.priority);

  // 上位batchSize個を選択
  return scoredQuestions.slice(0, batchSize).map((sq) => sq.question);
}

// 動的閾値の取得
export function getDynamicThreshold(
  question: Question,
  wordProgress: WordProgress | undefined,
  profile: UserLearningProfile,
  thresholdType: 'mastery' | 'review' | 'priority'
): number {
  const expected = getExpectedAccuracy(question, profile);
  const category = question.category || '';
  const categoryData = profile.categoryStrength[category];

  switch (thresholdType) {
    case 'mastery':
      // 得意分野: 高い閾値(早く卒業)
      // 苦手分野: 低い閾値(慎重に判定)
      if (categoryData?.confidence === 'high') {
        return Math.max(75, expected * 0.85);
      } else if (categoryData?.confidence === 'low') {
        return Math.max(80, expected * 1.1);
      }
      return profile.dynamicThresholds.masteryThreshold;

    case 'review':
      // 苦手分野: 低い閾値(早めに復習)
      if (categoryData?.confidence === 'low') {
        return 50;
      }
      return profile.dynamicThresholds.reviewThreshold;

    case 'priority':
      // 習得効率が高い範囲を優先
      return expected * 0.7;
  }
}
