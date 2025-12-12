/**
 * 統計情報取得モジュール
 * 進捗データの統計分析・集計機能
 */

import { loadProgressSync, checkFlexibleMastery, autoDetectWordDifficulty } from './progressStorage';
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

// 難易度別の統計を取得（レーダーチャート用）
export function getDifficultyStatsForRadar(mode: 'translation' | 'spelling' | 'reading'): {
  labels: string[];
  answeredData: number[];
  correctData: number[];
} {
  const progress = loadProgressSync();
  const difficultyMap = new Map<string, { answered: number; correct: number }>();
  
  // モードでフィルタして集計
  progress.results
    .filter(r => r.mode === mode && r.difficulty)
    .forEach(result => {
      const difficulty = result.difficulty!;
      const existing = difficultyMap.get(difficulty) || { answered: 0, correct: 0 };
      difficultyMap.set(difficulty, {
        answered: existing.answered + result.total,
        correct: existing.correct + result.score
      });
    });
  
  // ソート順: 初級 → 中級 → 上級
  const difficultyOrder = ['初級', '中級', '上級'];
  const labels: string[] = [];
  const answeredData: number[] = [];
  const correctData: number[] = [];
  
  difficultyOrder.forEach(difficulty => {
    const stats = difficultyMap.get(difficulty);
    if (stats) {
      labels.push(difficulty);
      answeredData.push(stats.answered);
      correctData.push(stats.correct);
    }
  });
  
  // データがない場合は初期値を返す
  if (labels.length === 0) {
    return {
      labels: ['初級', '中級', '上級'],
      answeredData: [0, 0, 0],
      correctData: [0, 0, 0]
    };
  }
  
  return { labels, answeredData, correctData };
}

// 最近定着した単語を取得
export function getRecentlyMasteredWords(days: number = 7, limit: number = 10): Array<{
  word: string;
  masteredDate: number;
  totalAttempts: number;
}> {
  const progress = loadProgressSync();
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
  
  const words = Object.entries(progress.wordProgress)
    .filter(([_, wp]) => wp.masteryLevel === 'mastered' && wp.lastStudied >= cutoff)
    .map(([word, wp]) => ({
      word,
      masteredDate: wp.lastStudied,
      totalAttempts: wp.correctCount + wp.incorrectCount,
    }))
    .sort((a, b) => b.masteredDate - a.masteredDate)
    .slice(0, limit);
  
  return words;
}

// 分野別・難易度別の統計を取得（レーダーチャート用）
export function getCategoryDifficultyStats(mode: 'translation' | 'spelling'): {
  labels: string[];
  accuracyData: { beginner: number[]; intermediate: number[]; advanced: number[] };
  progressData: { beginner: number[]; intermediate: number[]; advanced: number[] };
} {
  const progress = loadProgressSync();
  
  // 分野別・難易度別の統計マップ
  const statsMap = new Map<string, {
    beginner: { correct: number; total: number; mastered: number; totalWords: number };
    intermediate: { correct: number; total: number; mastered: number; totalWords: number };
    advanced: { correct: number; total: number; mastered: number; totalWords: number };
  }>();

  // 結果から分野別・難易度別に集計
  progress.results
    .filter(r => r.mode === mode && r.category && r.difficulty)
    .forEach(result => {
      const category = result.category!;
      const difficulty = result.difficulty!;
      
      if (!statsMap.has(category)) {
        statsMap.set(category, {
          beginner: { correct: 0, total: 0, mastered: 0, totalWords: 0 },
          intermediate: { correct: 0, total: 0, mastered: 0, totalWords: 0 },
          advanced: { correct: 0, total: 0, mastered: 0, totalWords: 0 }
        });
      }
      
      const stats = statsMap.get(category)!;
      const difficultyKey = difficulty === '初級' ? 'beginner' : difficulty === '中級' ? 'intermediate' : 'advanced';
      
      stats[difficultyKey].correct += result.score;
      stats[difficultyKey].total += result.total;
    });

  // wordProgressから定着数を計算
  Object.entries(progress.wordProgress).forEach(([_word, wordProg]) => {
    if (!wordProg.category || !wordProg.difficulty) return;
    
    const category = wordProg.category;
    const difficulty = wordProg.difficulty;
    
    if (!statsMap.has(category)) {
      statsMap.set(category, {
        beginner: { correct: 0, total: 0, mastered: 0, totalWords: 0 },
        intermediate: { correct: 0, total: 0, mastered: 0, totalWords: 0 },
        advanced: { correct: 0, total: 0, mastered: 0, totalWords: 0 }
      });
    }
    
    const stats = statsMap.get(category)!;
    const difficultyKey = difficulty === '初級' ? 'beginner' : difficulty === '中級' ? 'intermediate' : 'advanced';
    
    stats[difficultyKey].totalWords += 1;
    
    // 定着判定
    const totalAttempts = wordProg.correctCount + wordProg.incorrectCount;
    const isFirstTimeCorrect = totalAttempts === 1 && wordProg.correctCount === 1;
    const isConsecutivelyCorrect = wordProg.consecutiveCorrect >= 3;
    const isSkipped = wordProg.skippedCount && wordProg.skippedCount > 0;
    
    if (isFirstTimeCorrect || isConsecutivelyCorrect || isSkipped) {
      stats[difficultyKey].mastered += 1;
    }
  });

  // ソート順で分野を並べる
  const categoryOrder = ['動物', '植物', '自然', '天気', '時間', '場所', '学校', '家族', '食べ物', '身体', 
    '感情', '行動', '状態', '数字', '色', '形', '方向', '位置', 'その他'];
  
  const labels: string[] = [];
  const accuracyBeginner: number[] = [];
  const accuracyIntermediate: number[] = [];
  const accuracyAdvanced: number[] = [];
  const progressBeginner: number[] = [];
  const progressIntermediate: number[] = [];
  const progressAdvanced: number[] = [];

  categoryOrder.forEach(category => {
    const stats = statsMap.get(category);
    if (stats && (stats.beginner.total > 0 || stats.intermediate.total > 0 || stats.advanced.total > 0)) {
      labels.push(category);
      
      // 正答率（%）
      accuracyBeginner.push(stats.beginner.total > 0 ? (stats.beginner.correct / stats.beginner.total) * 100 : 0);
      accuracyIntermediate.push(stats.intermediate.total > 0 ? (stats.intermediate.correct / stats.intermediate.total) * 100 : 0);
      accuracyAdvanced.push(stats.advanced.total > 0 ? (stats.advanced.correct / stats.advanced.total) * 100 : 0);
      
      // 進捗率（定着数/総単語数 %）
      progressBeginner.push(stats.beginner.totalWords > 0 ? (stats.beginner.mastered / stats.beginner.totalWords) * 100 : 0);
      progressIntermediate.push(stats.intermediate.totalWords > 0 ? (stats.intermediate.mastered / stats.intermediate.totalWords) * 100 : 0);
      progressAdvanced.push(stats.advanced.totalWords > 0 ? (stats.advanced.mastered / stats.advanced.totalWords) * 100 : 0);
    }
  });

  return {
    labels,
    accuracyData: {
      beginner: accuracyBeginner,
      intermediate: accuracyIntermediate,
      advanced: accuracyAdvanced
    },
    progressData: {
      beginner: progressBeginner,
      intermediate: progressIntermediate,
      advanced: progressAdvanced
    }
  };
}

// モード別・難易度別の統計を取得（改善版）
export function getStatsByModeDifficulty(mode: 'translation' | 'spelling'): {
  labels: string[];
  accuracyData: number[];
  retentionData: number[];
} {
  const progress = loadProgressSync();
  const difficulties = ['beginner', 'intermediate', 'advanced'];
  const labels = ['初級', '中級', '上級'];
  const accuracyData: number[] = [];
  const retentionData: number[] = [];

  // モードに関連する結果を取得
  const modeResults = progress.results.filter(r => r.mode === mode);

  difficulties.forEach(difficulty => {
    // この難易度の単語を自動分類
    const difficultyWords = new Set<string>();
    const masteredWords = new Set<string>();
    let totalCorrect = 0;
    let totalQuestions = 0;
    
    // 単語レベルで難易度を判定して分類
    Object.entries(progress.wordProgress).forEach(([word, stats]) => {
      const wordDifficulty = autoDetectWordDifficulty(word, stats);
      const totalAttempts = stats.correctCount + stats.incorrectCount;
      
      // この難易度に該当し、かつこのモードで学習済みの単語
      if (wordDifficulty === difficulty && totalAttempts > 0) {
        difficultyWords.add(word);
        
        // 正答率計算
        totalCorrect += stats.correctCount;
        totalQuestions += totalAttempts;
        
        // 定着判定 (85%以上かつ3回以上)
        const accuracy = totalAttempts > 0 ? (stats.correctCount / totalAttempts) * 100 : 0;
        if (accuracy >= 85 && totalAttempts >= 3) {
          masteredWords.add(word);
        }
      }
    });
    
    // 明示的な難易度設定がある結果も追加考慮
    const explicitResults = modeResults.filter(r => r.difficulty === difficulty);
    if (explicitResults.length > 0) {
      totalCorrect += explicitResults.reduce((sum, r) => sum + r.score, 0);
      totalQuestions += explicitResults.reduce((sum, r) => sum + r.total, 0);
    }

    // 正答率
    const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    accuracyData.push(accuracy);

    // 定着率
    const retention = difficultyWords.size > 0 ? (masteredWords.size / difficultyWords.size) * 100 : 0;
    retentionData.push(Math.min(100, Math.max(0, retention)));
  });

  return { labels, accuracyData, retentionData };
}
