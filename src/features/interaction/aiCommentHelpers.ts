// AI コメント生成ヘルパー関数

// ランダム選択ヘルパー
export function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 学習パターン分析
export interface LearningPattern {
  totalSessions: number;
  averageAccuracy: number;
  strongCategories: string[];
  weakCategories: string[];
  recentImprovement: boolean;
  consistencyScore: number; // 0-100
}

export function analyzeLearningPattern(): LearningPattern {
  const progressData = localStorage.getItem('progress-data');
  if (!progressData) {
    return {
      totalSessions: 0,
      averageAccuracy: 0,
      strongCategories: [],
      weakCategories: [],
      recentImprovement: false,
      consistencyScore: 0,
    };
  }

  try {
    const data = JSON.parse(progressData);
    const results = data.results || [];
    const recentResults = results.slice(-10); // 最新10セッション

    // 平均正答率
    const avgAccuracy =
      recentResults.length > 0
        ? recentResults.reduce((sum: number, r: any) => sum + (r.score / r.total) * 100, 0) /
          recentResults.length
        : 0;

    // カテゴリー別分析
    const categoryStats = new Map<string, { correct: number; total: number }>();
    results.forEach((r: any) => {
      if (r.category) {
        const stats = categoryStats.get(r.category) || { correct: 0, total: 0 };
        stats.correct += r.score;
        stats.total += r.total;
        categoryStats.set(r.category, stats);
      }
    });

    const strongCategories: string[] = [];
    const weakCategories: string[] = [];
    categoryStats.forEach((stats, category) => {
      const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
      if (accuracy >= 80) strongCategories.push(category);
      if (accuracy < 60) weakCategories.push(category);
    });

    // 最近の改善傾向
    const older = recentResults.slice(0, 5);
    const newer = recentResults.slice(-5);
    const olderAvg =
      older.length > 0
        ? older.reduce((sum: number, r: any) => sum + (r.score / r.total) * 100, 0) / older.length
        : 0;
    const newerAvg =
      newer.length > 0
        ? newer.reduce((sum: number, r: any) => sum + (r.score / r.total) * 100, 0) / newer.length
        : 0;
    const recentImprovement = newerAvg > olderAvg + 5; // 5%以上の改善

    // 一貫性スコア（過去の学習日数の連続性）
    const uniqueDates = new Set(results.map((r: any) => new Date(r.date).toDateString()));
    const consistencyScore = Math.min(100, uniqueDates.size * 5); // 最大20日で100

    return {
      totalSessions: results.length,
      averageAccuracy: avgAccuracy,
      strongCategories,
      weakCategories,
      recentImprovement,
      consistencyScore,
    };
  } catch {
    return {
      totalSessions: 0,
      averageAccuracy: 0,
      strongCategories: [],
      weakCategories: [],
      recentImprovement: false,
      consistencyScore: 0,
    };
  }
}
