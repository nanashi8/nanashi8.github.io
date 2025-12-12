/**
 * 統計情報取得モジュール
 * 進捗データの統計分析・集計機能
 */

import { loadProgressSync, checkFlexibleMastery } from './progressStorage';
import type { QuizResult, DetailedRetentionStats, MasteryPrediction } from './types';

// モードごとの統計を取得
export function getStatsByMode(mode: 'translation' | 'spelling' | 'reading'): {
  totalQuizzes: number;
  averageScore: number;
  bestScore: number;
} {
  const progress = loadProgressSync();
  const modeResults = progress.results.filter(r => r.mode === mode);
  
  if (modeResults.length === 0) {
    return { totalQuizzes: 0, averageScore: 0, bestScore: 0 };
  }
  
  const totalScore = modeResults.reduce((sum, r) => sum + r.percentage, 0);
  const bestScore = Math.max(...modeResults.map(r => r.percentage));
  
  return {
    totalQuizzes: modeResults.length,
    averageScore: totalScore / modeResults.length,
    bestScore,
  };
}

// 最近の結果を取得
export function getRecentResults(limit: number = 10): QuizResult[] {
  const progress = loadProgressSync();
  return progress.results.slice(-limit).reverse();
}

// 分野別の統計を取得
export function getStatsByCategory(): Map<string, { correctCount: number; totalCount: number; accuracy: number }> {
  const progress = loadProgressSync();
  const categoryStats = new Map<string, { correctCount: number; totalCount: number }>();
  
  progress.results.forEach(result => {
    if (result.category) {
      const existing = categoryStats.get(result.category) || { correctCount: 0, totalCount: 0 };
      categoryStats.set(result.category, {
        correctCount: existing.correctCount + result.score,
        totalCount: existing.totalCount + result.total
      });
    }
  });
  
  const statsWithAccuracy = new Map<string, { correctCount: number; totalCount: number; accuracy: number }>();
  categoryStats.forEach((stats, category) => {
    statsWithAccuracy.set(category, {
      correctCount: stats.correctCount,
      totalCount: stats.totalCount,
      accuracy: stats.totalCount > 0 ? (stats.correctCount / stats.totalCount) * 100 : 0
    });
  });
  
  return statsWithAccuracy;
}

// 難易度別の統計を取得
export function getStatsByDifficulty(): Map<string, { correctCount: number; totalCount: number; accuracy: number }> {
  const progress = loadProgressSync();
  const difficultyStats = new Map<string, { correctCount: number; totalCount: number }>();
  
  progress.results.forEach(result => {
    if (result.difficulty) {
      const existing = difficultyStats.get(result.difficulty) || { correctCount: 0, totalCount: 0 };
      difficultyStats.set(result.difficulty, {
        correctCount: existing.correctCount + result.score,
        totalCount: existing.totalCount + result.total
      });
    }
  });
  
  const statsWithAccuracy = new Map<string, { correctCount: number; totalCount: number; accuracy: number }>();
  difficultyStats.forEach((stats, difficulty) => {
    statsWithAccuracy.set(difficulty, {
      correctCount: stats.correctCount,
      totalCount: stats.totalCount,
      accuracy: stats.totalCount > 0 ? (stats.correctCount / stats.totalCount) * 100 : 0
    });
  });
  
  return statsWithAccuracy;
}

// 当日の誤答単語を取得
export function getTodayIncorrectWords(): string[] {
  const progress = loadProgressSync();
  const today = new Date().toLocaleDateString('ja-JP');
  const incorrectWords = new Set<string>();
  
  progress.results.forEach(result => {
    if (new Date(result.date).toLocaleDateString('ja-JP') === today) {
      result.incorrectWords.forEach(word => incorrectWords.add(word));
    }
  });
  
  return Array.from(incorrectWords);
}

// 日別の学習時間を取得
export function getDailyStudyTime(days: number = 7): Array<{ date: string; timeSpent: number }> {
  const progress = loadProgressSync();
  const now = Date.now();
  const startDate = now - (days * 24 * 60 * 60 * 1000);
  
  const dailyTime = new Map<string, number>();
  
  progress.results
    .filter(r => r.date >= startDate)
    .forEach(result => {
      const dateStr = new Date(result.date).toLocaleDateString('ja-JP');
      dailyTime.set(dateStr, (dailyTime.get(dateStr) || 0) + result.timeSpent);
    });
  
  return Array.from(dailyTime.entries())
    .map(([date, timeSpent]) => ({ date, timeSpent }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// 当日の統計を取得
export function getTodayStats(mode?: 'translation' | 'spelling' | 'reading' | 'grammar' | 'memorization'): {
  todayCorrectCount: number;
  todayTotalAnswered: number;
  todayAccuracy: number;
} {
  const progress = loadProgressSync();
  const today = new Date().setHours(0, 0, 0, 0);
  const tomorrow = today + 24 * 60 * 60 * 1000;
  
  // 本日の結果をフィルタ
  let todayResults = progress.results.filter(r => r.date >= today && r.date < tomorrow);
  
  // モード指定がある場合はフィルタ
  if (mode) {
    todayResults = todayResults.filter(r => r.mode === mode);
  }
  
  const todayCorrectCount = todayResults.reduce((sum, r) => sum + r.score, 0);
  const todayTotalAnswered = todayResults.reduce((sum, r) => sum + r.total, 0);
  const todayAccuracy = todayTotalAnswered > 0 
    ? Math.round((todayCorrectCount / todayTotalAnswered) * 100) 
    : 0;
  
  return {
    todayCorrectCount,
    todayTotalAnswered,
    todayAccuracy,
  };
}

// 週次統計を取得
export function getWeeklyStats(): {
  studyDays: number;
  totalDays: number;
  totalAnswered: number;
  accuracy: number;
  newMastered: number;
  previousWeekAccuracy: number;
} {
  const progress = loadProgressSync();
  const now = new Date();
  
  // 今週の開始日（月曜日）を計算
  const currentDay = now.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  
  // 先週の範囲
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(weekStart.getDate() - 7);
  const lastWeekEnd = new Date(weekStart);
  
  // 今週の結果
  const thisWeekResults = progress.results.filter(r => 
    r.date >= weekStart.getTime() && r.date < weekEnd.getTime()
  );
  
  // 先週の結果
  const lastWeekResults = progress.results.filter(r => 
    r.date >= lastWeekStart.getTime() && r.date < lastWeekEnd.getTime()
  );
  
  // 今週の学習日数
  const studyDatesThisWeek = new Set<string>();
  thisWeekResults.forEach(r => {
    const date = new Date(r.date).toISOString().split('T')[0];
    studyDatesThisWeek.add(date);
  });
  
  // 今週の統計
  const totalAnswered = thisWeekResults.reduce((sum, r) => sum + r.total, 0);
  const totalCorrect = thisWeekResults.reduce((sum, r) => sum + r.score, 0);
  const accuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;
  
  // 先週の統計
  const lastWeekTotalAnswered = lastWeekResults.reduce((sum, r) => sum + r.total, 0);
  const lastWeekTotalCorrect = lastWeekResults.reduce((sum, r) => sum + r.score, 0);
  const previousWeekAccuracy = lastWeekTotalAnswered > 0 ? (lastWeekTotalCorrect / lastWeekTotalAnswered) * 100 : 0;
  
  // 今週新規定着した単語数
  let newMastered = 0;
  Object.values(progress.wordProgress).forEach(wp => {
    if (wp.masteryLevel === 'mastered' && wp.lastStudied >= weekStart.getTime()) {
      newMastered++;
    }
  });
  
  return {
    studyDays: studyDatesThisWeek.size,
    totalDays: 7,
    totalAnswered,
    accuracy,
    newMastered,
    previousWeekAccuracy,
  };
}

// 月次統計を取得
export function getMonthlyStats(): {
  studyDays: number;
  totalDays: number;
  totalAnswered: number;
  accuracy: number;
  newMastered: number;
} {
  const progress = loadProgressSync();
  const now = new Date();
  
  // 今月の開始日
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);
  
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);
  
  // 今月の結果
  const thisMonthResults = progress.results.filter(r => 
    r.date >= monthStart.getTime() && r.date <= monthEnd.getTime()
  );
  
  // 今月の学習日数
  const studyDatesThisMonth = new Set<string>();
  thisMonthResults.forEach(r => {
    const date = new Date(r.date).toISOString().split('T')[0];
    studyDatesThisMonth.add(date);
  });
  
  // 今月の統計
  const totalAnswered = thisMonthResults.reduce((sum, r) => sum + r.total, 0);
  const totalCorrect = thisMonthResults.reduce((sum, r) => sum + r.score, 0);
  const accuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;
  
  // 今月新規定着した単語数
  let newMastered = 0;
  Object.values(progress.wordProgress).forEach(wp => {
    if (wp.masteryLevel === 'mastered' && wp.lastStudied >= monthStart.getTime()) {
      newMastered++;
    }
  });
  
  const totalDays = monthEnd.getDate();
  
  return {
    studyDays: studyDatesThisMonth.size,
    totalDays,
    totalAnswered,
    accuracy,
    newMastered,
  };
}

// 詳細な定着統計を取得
export function getDetailedRetentionStats(): DetailedRetentionStats {
  const progress = loadProgressSync();
  const allWords = Object.values(progress.wordProgress);
  const appearedWords = allWords.filter(wp => 
    (wp.correctCount + wp.incorrectCount) > 0
  );
  
  let masteredCount = 0;
  let learningCount = 0;
  let strugglingCount = 0;
  
  appearedWords.forEach(wp => {
    const totalAttempts = wp.correctCount + wp.incorrectCount;
    const accuracy = totalAttempts > 0 ? (wp.correctCount / totalAttempts) * 100 : 0;
    
    // 🟢 完全定着判定
    const isDefinitelyMastered = 
      (totalAttempts === 1 && wp.correctCount === 1) || // 1発正解
      wp.consecutiveCorrect >= 3 || // 連続3回以上正解
      (wp.consecutiveCorrect >= 2 && accuracy >= 80); // 連続2回 + 正答率80%以上
    
    if (isDefinitelyMastered) {
      masteredCount++;
    }
    // 🟡 学習中（正答率50%以上だがまだ定着していない）
    else if (accuracy >= 50) {
      learningCount++;
    }
    // 🔴 要復習（正答率50%未満）
    else {
      strugglingCount++;
    }
  });
  
  const total = appearedWords.length;
  
  // 加重スコア計算（完全定着=1.0, 学習中=0.5, 要復習=0.0）
  const weightedScore = masteredCount * 1.0 + learningCount * 0.5;
  
  return {
    totalWords: allWords.length,
    appearedWords: total,
    
    masteredCount,
    learningCount,
    strugglingCount,
    
    basicRetentionRate: total > 0 ? Math.round((masteredCount / total) * 100) : 0,
    weightedRetentionRate: total > 0 ? Math.round((weightedScore / total) * 100) : 0,
    
    masteredPercentage: total > 0 ? Math.round((masteredCount / total) * 100) : 0,
    learningPercentage: total > 0 ? Math.round((learningCount / total) * 100) : 0,
    strugglingPercentage: total > 0 ? Math.round((strugglingCount / total) * 100) : 0,
    
    // エイリアス（互換性のため）
    masteredWords: masteredCount,
    learningWords: learningCount,
    newWords: allWords.length - total,
    retentionRate: total > 0 ? Math.round((masteredCount / total) * 100) : 0,
    averageAttempts: 0,
    categoryBreakdown: {},
    difficultyBreakdown: {},
  };
}

// 定着が近い単語の統計を取得
export function getNearMasteryStats(): {
  nearMasteryCount: number;
  learningCount: number;
  averageRemainingAnswers: number;
  longTermMemoryCount: number;
  superMemoryCount: number;
} {
  const progress = loadProgressSync();
  let nearMasteryCount = 0;
  let learningCount = 0;
  let totalRemaining = 0;
  let longTermMemoryCount = 0;
  let superMemoryCount = 0;
  
  Object.values(progress.wordProgress).forEach(wp => {
    const totalAttempts = wp.correctCount + wp.incorrectCount;
    if (totalAttempts === 0) return;
    
    const masteryResult = checkFlexibleMastery(wp, true);
    if (masteryResult.isMastered) {
      // 長期記憶のカウント
      if (wp.consecutiveCorrect >= 7) {
        superMemoryCount++;
      } else if (wp.consecutiveCorrect >= 5) {
        longTermMemoryCount++;
      }
      return;
    }
    
    learningCount++;
    
    // あと1回で定着する条件をチェック
    const { consecutiveCorrect } = wp;
    const accuracy = wp.correctCount / totalAttempts;
    
    if (
      consecutiveCorrect === 2 || // 連続2回正解
      (accuracy >= 0.9 && consecutiveCorrect === 1 && totalAttempts >= 2) || // 高精度安定型
      (totalAttempts >= 4 && accuracy >= 0.75) // 高回数安定型
    ) {
      nearMasteryCount++;
      totalRemaining += 1;
    } else {
      totalRemaining += Math.max(1, 3 - consecutiveCorrect);
    }
  });
  
  return {
    nearMasteryCount,
    learningCount,
    averageRemainingAnswers: learningCount > 0 ? Math.round(totalRemaining / learningCount * 10) / 10 : 0,
    longTermMemoryCount,
    superMemoryCount
  };
}
