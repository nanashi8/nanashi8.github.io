/**
 * 統計情報取得モジュール
 * 進捗データの統計分析・集計機能
 */

import {
  loadProgressSync,
  checkFlexibleMastery,
  autoDetectWordDifficulty,
} from './progressStorage';
import { determineWordPosition, type LearningMode } from '@/ai/utils/categoryDetermination';
import type { QuizResult, DetailedRetentionStats, WordProgress } from './types';

// モードごとの統計を取得
export function getStatsByMode(mode: 'translation' | 'spelling' | 'reading'): {
  totalQuizzes: number;
  averageScore: number;
  bestScore: number;
} {
  const progress = loadProgressSync();
  const modeResults = progress.results.filter((r) => r.mode === mode);

  if (modeResults.length === 0) {
    return { totalQuizzes: 0, averageScore: 0, bestScore: 0 };
  }

  const totalScore = modeResults.reduce((sum, r) => sum + r.percentage, 0);
  const bestScore = Math.max(...modeResults.map((r) => r.percentage));

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
export function getStatsByCategory(): Map<
  string,
  { correctCount: number; totalCount: number; accuracy: number }
> {
  const progress = loadProgressSync();
  const categoryStats = new Map<string, { correctCount: number; totalCount: number }>();

  progress.results.forEach((result) => {
    if (result.category) {
      const existing = categoryStats.get(result.category) || { correctCount: 0, totalCount: 0 };
      categoryStats.set(result.category, {
        correctCount: existing.correctCount + result.score,
        totalCount: existing.totalCount + result.total,
      });
    }
  });

  const statsWithAccuracy = new Map<
    string,
    { correctCount: number; totalCount: number; accuracy: number }
  >();
  categoryStats.forEach((stats, category) => {
    statsWithAccuracy.set(category, {
      correctCount: stats.correctCount,
      totalCount: stats.totalCount,
      accuracy: stats.totalCount > 0 ? (stats.correctCount / stats.totalCount) * 100 : 0,
    });
  });

  return statsWithAccuracy;
}

// 難易度別の統計を取得
export function getStatsByDifficulty(): Map<
  string,
  { correctCount: number; totalCount: number; accuracy: number }
> {
  const progress = loadProgressSync();
  const difficultyStats = new Map<string, { correctCount: number; totalCount: number }>();

  progress.results.forEach((result) => {
    if (result.difficulty) {
      const existing = difficultyStats.get(result.difficulty) || { correctCount: 0, totalCount: 0 };
      difficultyStats.set(result.difficulty, {
        correctCount: existing.correctCount + result.score,
        totalCount: existing.totalCount + result.total,
      });
    }
  });

  const statsWithAccuracy = new Map<
    string,
    { correctCount: number; totalCount: number; accuracy: number }
  >();
  difficultyStats.forEach((stats, difficulty) => {
    statsWithAccuracy.set(difficulty, {
      correctCount: stats.correctCount,
      totalCount: stats.totalCount,
      accuracy: stats.totalCount > 0 ? (stats.correctCount / stats.totalCount) * 100 : 0,
    });
  });

  return statsWithAccuracy;
}

// 当日の誤答単語を取得
export function getTodayIncorrectWords(): string[] {
  const progress = loadProgressSync();
  const today = new Date().toLocaleDateString('ja-JP');
  const incorrectWords = new Set<string>();

  progress.results.forEach((result) => {
    if (new Date(result.date).toLocaleDateString('ja-JP') === today) {
      result.incorrectWords.forEach((word) => incorrectWords.add(word));
    }
  });

  return Array.from(incorrectWords);
}

// 日別の学習時間を取得
export function getDailyStudyTime(days: number = 7): Array<{ date: string; timeSpent: number }> {
  const progress = loadProgressSync();
  const now = Date.now();
  const startDate = now - days * 24 * 60 * 60 * 1000;

  const dailyTime = new Map<string, number>();

  progress.results
    .filter((r) => r.date >= startDate)
    .forEach((result) => {
      const dateStr = new Date(result.date).toLocaleDateString('ja-JP');
      dailyTime.set(dateStr, (dailyTime.get(dateStr) || 0) + result.timeSpent);
    });

  return Array.from(dailyTime.entries())
    .map(([date, timeSpent]) => ({ date, timeSpent }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// 当日の統計を取得
export function getTodayStats(
  mode?: 'translation' | 'spelling' | 'reading' | 'grammar' | 'memorization'
): {
  todayCorrectCount: number;
  todayTotalAnswered: number;
  todayAccuracy: number;
} {
  const progress = loadProgressSync();
  const today = new Date().setHours(0, 0, 0, 0);
  const tomorrow = today + 24 * 60 * 60 * 1000;

  // 本日の結果をフィルタ
  let todayResults = progress.results.filter((r) => r.date >= today && r.date < tomorrow);

  // モード指定がある場合はフィルタ
  if (mode) {
    todayResults = todayResults.filter((r) => r.mode === mode);
  }

  const todayCorrectCount = todayResults.reduce((sum, r) => sum + r.score, 0);
  const todayTotalAnswered = todayResults.reduce((sum, r) => sum + r.total, 0);
  const todayAccuracy =
    todayTotalAnswered > 0 ? Math.round((todayCorrectCount / todayTotalAnswered) * 100) : 0;

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
  const thisWeekResults = progress.results.filter(
    (r) => r.date >= weekStart.getTime() && r.date < weekEnd.getTime()
  );

  // 先週の結果
  const lastWeekResults = progress.results.filter(
    (r) => r.date >= lastWeekStart.getTime() && r.date < lastWeekEnd.getTime()
  );

  // 今週の学習日数
  const studyDatesThisWeek = new Set<string>();
  thisWeekResults.forEach((r) => {
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
  const previousWeekAccuracy =
    lastWeekTotalAnswered > 0 ? (lastWeekTotalCorrect / lastWeekTotalAnswered) * 100 : 0;

  // 今週新規定着した単語数
  let newMastered = 0;
  Object.values(progress.wordProgress).forEach((wp) => {
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
  const thisMonthResults = progress.results.filter(
    (r) => r.date >= monthStart.getTime() && r.date <= monthEnd.getTime()
  );

  // 今月の学習日数
  const studyDatesThisMonth = new Set<string>();
  thisMonthResults.forEach((r) => {
    const date = new Date(r.date).toISOString().split('T')[0];
    studyDatesThisMonth.add(date);
  });

  // 今月の統計
  const totalAnswered = thisMonthResults.reduce((sum, r) => sum + r.total, 0);
  const totalCorrect = thisMonthResults.reduce((sum, r) => sum + r.score, 0);
  const accuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;

  // 今月新規定着した単語数
  let newMastered = 0;
  Object.values(progress.wordProgress).forEach((wp) => {
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
  // ✅ totalAttemptsで出題済み単語を判定（全モード合計）
  const appearedWords = allWords.filter((wp) => (wp.totalAttempts || 0) > 0);

  let masteredCount = 0;
  let learningCount = 0;
  let strugglingCount = 0;

  // ⚡ パフォーマンス最適化: 最初の500単語のみ処理（プログレスバーは概算で十分）
  const sampleWords = appearedWords.slice(0, Math.min(500, appearedWords.length));
  const scaleFactor = appearedWords.length / sampleWords.length;

  // ✅ AI担当関数に完全委譲（modeなしで呼び出すとcorrectCountベースで計算）
  sampleWords.forEach((wp) => {
    const position = determineWordPosition(wp);

    // Position範囲でカテゴリ判定
    // 0-20: mastered, 20-40: new→masteredに含める, 40-70: learning, 70-100: struggling
    if (position < 40) {
      // 0-40: mastered（定着済み + 新規学習中）
      masteredCount++;
    } else if (position >= 40 && position < 70) {
      learningCount++;
    } else if (position >= 70) {
      strugglingCount++;
    }
  });

  // サンプリングした結果を全体にスケールアップ
  masteredCount = Math.round(masteredCount * scaleFactor);
  learningCount = Math.round(learningCount * scaleFactor);
  strugglingCount = Math.round(strugglingCount * scaleFactor);

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

  Object.values(progress.wordProgress).forEach((wp) => {
    const totalAttempts = wp.correctCount + wp.incorrectCount;
    if (totalAttempts === 0) return;

    // ✅ AI担当関数に委譲
    const position = determineWordPosition(wp);

    // mastered (0-20): 長期記憶のカウント
    if (position < 20) {
      if (wp.consecutiveCorrect >= 7) {
        superMemoryCount++;
      } else if (wp.consecutiveCorrect >= 5) {
        longTermMemoryCount++;
      }
      return;
    }

    // still_learning (40-70) または incorrect (70-100)
    if (position >= 40) {
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
    }
  });

  return {
    nearMasteryCount,
    learningCount,
    averageRemainingAnswers:
      learningCount > 0 ? Math.round((totalRemaining / learningCount) * 10) / 10 : 0,
    longTermMemoryCount,
    superMemoryCount,
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
    .filter((r) => r.mode === mode && r.difficulty)
    .forEach((result) => {
      const difficulty = result.difficulty!;
      const existing = difficultyMap.get(difficulty) || { answered: 0, correct: 0 };
      difficultyMap.set(difficulty, {
        answered: existing.answered + result.total,
        correct: existing.correct + result.score,
      });
    });

  // ソート順: 初級 → 中級 → 上級
  const difficultyOrder = ['初級', '中級', '上級'];
  const labels: string[] = [];
  const answeredData: number[] = [];
  const correctData: number[] = [];

  difficultyOrder.forEach((difficulty) => {
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
      correctData: [0, 0, 0],
    };
  }

  return { labels, answeredData, correctData };
}

// 最近定着した単語を取得
export function getRecentlyMasteredWords(
  days: number = 7,
  limit: number = 10
): Array<{
  word: string;
  masteredDate: number;
  totalAttempts: number;
}> {
  const progress = loadProgressSync();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

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
  const statsMap = new Map<
    string,
    {
      beginner: { correct: number; total: number; mastered: number; totalWords: number };
      intermediate: { correct: number; total: number; mastered: number; totalWords: number };
      advanced: { correct: number; total: number; mastered: number; totalWords: number };
    }
  >();

  // 結果から分野別・難易度別に集計
  progress.results
    .filter((r) => r.mode === mode && r.category && r.difficulty)
    .forEach((result) => {
      const category = result.category!;
      const difficulty = result.difficulty!;

      if (!statsMap.has(category)) {
        statsMap.set(category, {
          beginner: { correct: 0, total: 0, mastered: 0, totalWords: 0 },
          intermediate: { correct: 0, total: 0, mastered: 0, totalWords: 0 },
          advanced: { correct: 0, total: 0, mastered: 0, totalWords: 0 },
        });
      }

      const stats = statsMap.get(category)!;
      const difficultyKey =
        difficulty === '初級' ? 'beginner' : difficulty === '中級' ? 'intermediate' : 'advanced';

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
        advanced: { correct: 0, total: 0, mastered: 0, totalWords: 0 },
      });
    }

    const stats = statsMap.get(category)!;
    const difficultyKey =
      difficulty === '初級' ? 'beginner' : difficulty === '中級' ? 'intermediate' : 'advanced';

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
  const categoryOrder = [
    '動物',
    '植物',
    '自然',
    '天気',
    '時間',
    '場所',
    '学校',
    '家族',
    '食べ物',
    '身体',
    '感情',
    '行動',
    '状態',
    '数字',
    '色',
    '形',
    '方向',
    '位置',
    'その他',
  ];

  const labels: string[] = [];
  const accuracyBeginner: number[] = [];
  const accuracyIntermediate: number[] = [];
  const accuracyAdvanced: number[] = [];
  const progressBeginner: number[] = [];
  const progressIntermediate: number[] = [];
  const progressAdvanced: number[] = [];

  categoryOrder.forEach((category) => {
    const stats = statsMap.get(category);
    if (
      stats &&
      (stats.beginner.total > 0 || stats.intermediate.total > 0 || stats.advanced.total > 0)
    ) {
      labels.push(category);

      // 正答率（%）
      accuracyBeginner.push(
        stats.beginner.total > 0 ? (stats.beginner.correct / stats.beginner.total) * 100 : 0
      );
      accuracyIntermediate.push(
        stats.intermediate.total > 0
          ? (stats.intermediate.correct / stats.intermediate.total) * 100
          : 0
      );
      accuracyAdvanced.push(
        stats.advanced.total > 0 ? (stats.advanced.correct / stats.advanced.total) * 100 : 0
      );

      // 進捗率（定着数/総単語数 %）
      progressBeginner.push(
        stats.beginner.totalWords > 0
          ? (stats.beginner.mastered / stats.beginner.totalWords) * 100
          : 0
      );
      progressIntermediate.push(
        stats.intermediate.totalWords > 0
          ? (stats.intermediate.mastered / stats.intermediate.totalWords) * 100
          : 0
      );
      progressAdvanced.push(
        stats.advanced.totalWords > 0
          ? (stats.advanced.mastered / stats.advanced.totalWords) * 100
          : 0
      );
    }
  });

  return {
    labels,
    accuracyData: {
      beginner: accuracyBeginner,
      intermediate: accuracyIntermediate,
      advanced: accuracyAdvanced,
    },
    progressData: {
      beginner: progressBeginner,
      intermediate: progressIntermediate,
      advanced: progressAdvanced,
    },
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
  const modeResults = progress.results.filter((r) => r.mode === mode);

  difficulties.forEach((difficulty) => {
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
    const explicitResults = modeResults.filter((r) => r.difficulty === difficulty);
    if (explicitResults.length > 0) {
      totalCorrect += explicitResults.reduce((sum, r) => sum + r.score, 0);
      totalQuestions += explicitResults.reduce((sum, r) => sum + r.total, 0);
    }

    // 正答率
    const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    accuracyData.push(accuracy);

    // 定着率
    const retention =
      difficultyWords.size > 0 ? (masteredWords.size / difficultyWords.size) * 100 : 0;
    retentionData.push(Math.min(100, Math.max(0, retention)));
  });

  return { labels, accuracyData, retentionData };
}

// 文法モード専用の詳細統計を計算
export function getGrammarDetailedRetentionStats(): DetailedRetentionStats {
  const progress = loadProgressSync();
  const allWords = Object.values(progress.wordProgress);

  // 文法問題のみフィルタリング
  const grammarQuestions = allWords.filter(
    (wp) =>
      (wp.grammarAttempts && wp.grammarAttempts > 0) ||
      wp.word.startsWith('grammar_') ||
      wp.word.includes('_g')
  );

  // 出題された文法問題のみ
  const appearedQuestions = grammarQuestions.filter(
    (wp) =>
      (wp.grammarAttempts && wp.grammarAttempts > 0) || wp.correctCount + wp.incorrectCount > 0
  );

  let masteredCount = 0;
  let learningCount = 0;
  let strugglingCount = 0;

  appearedQuestions.forEach((wp) => {
    // 文法モード専用の統計を優先的に使用
    const totalAttempts = wp.grammarAttempts || wp.correctCount + wp.incorrectCount;
    const correctCount = wp.grammarCorrect || wp.correctCount;
    const consecutiveCorrect = wp.grammarStreak || wp.consecutiveCorrect;

    const accuracy = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0;

    // 🟢 完全定着判定
    const isDefinitelyMastered =
      (totalAttempts === 1 && correctCount === 1) ||
      consecutiveCorrect >= 3 ||
      (consecutiveCorrect >= 2 && accuracy >= 80);

    if (isDefinitelyMastered) {
      masteredCount++;
    } else if (accuracy >= 50) {
      learningCount++;
    } else {
      strugglingCount++;
    }
  });

  const total = appearedQuestions.length;
  const weightedScore = masteredCount * 1.0 + learningCount * 0.5;

  return {
    totalWords: grammarQuestions.length,
    appearedWords: total,

    masteredCount,
    learningCount,
    strugglingCount,

    basicRetentionRate: total > 0 ? Math.round((masteredCount / total) * 100) : 0,
    weightedRetentionRate: total > 0 ? Math.round((weightedScore / total) * 100) : 0,

    masteredPercentage: total > 0 ? Math.round((masteredCount / total) * 100) : 0,
    learningPercentage: total > 0 ? Math.round((learningCount / total) * 100) : 0,
    strugglingPercentage: total > 0 ? Math.round((strugglingCount / total) * 100) : 0,

    masteredWords: masteredCount,
    learningWords: learningCount,
    newWords: grammarQuestions.length - total,
    retentionRate: total > 0 ? Math.round((masteredCount / total) * 100) : 0,
    averageAttempts: 0,
    categoryBreakdown: {},
    difficultyBreakdown: {},
  };
}

// 暗記モード専用の詳細統計を計算
export function getMemorizationDetailedRetentionStats(): DetailedRetentionStats {
  const progress = loadProgressSync();
  const allWords = Object.values(progress.wordProgress);

  // 暗記モードで出題された単語のみフィルタリング
  const memorizationWords = allWords.filter(
    (wp) => wp.memorizationAttempts && wp.memorizationAttempts > 0
  );

  let masteredCount = 0;
  let learningCount = 0;
  let strugglingCount = 0;

  // デバッグ: カテゴリー別カウント
  const categoryDebug = {
    mastered: 0,
    still_learning: 0,
    incorrect: 0,
    new: 0,
    undefined: 0,
  };

  memorizationWords.forEach((wp) => {
    const cat = wp.category;
    if (cat === 'mastered') categoryDebug.mastered++;
    else if (cat === 'still_learning') categoryDebug.still_learning++;
    else if (cat === 'incorrect') categoryDebug.incorrect++;
    else if (cat === 'new') categoryDebug.new++;
    else categoryDebug.undefined++;
  });

  // Debug log removed to reduce console noise

  // ✅ AI担当関数に完全委譲（暗記モード専用）
  memorizationWords.forEach((wp) => {
    const position = determineWordPosition(wp, 'memorization');

    // Position範囲でカテゴリ判定（0-20: mastered, 20-40: new, 40-70: still_learning, 70-100: incorrect）
    // 0-40: mastered（定着済み + 新規学習中）として表示
    if (position < 40) {
      masteredCount++;
    } else if (position >= 40 && position < 70) {
      learningCount++;
    } else if (position >= 70) {
      strugglingCount++;
    }
  });

  const total = memorizationWords.length;
  const weightedScore = masteredCount * 1.0 + learningCount * 0.5;

  // Debug log removed to reduce console noise

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

    masteredWords: masteredCount,
    learningWords: learningCount,
    newWords: allWords.length - total,
    retentionRate: total > 0 ? Math.round((masteredCount / total) * 100) : 0,
    averageAttempts: 0,
    categoryBreakdown: {},
    difficultyBreakdown: {},
  };
}

// 文法問題の単元ごとの成績を集計
export function getGrammarUnitStats(): Array<{
  unit: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctCount: number;
  incorrectCount: number;
  masteredCount: number;
  accuracy: number;
  progress: number;
  historyIcons: string;
}> {
  const progress = loadProgressSync();

  // 文法問題のみフィルタリング
  const grammarQuestions = Object.entries(progress.wordProgress).filter(([word, _]) =>
    word.startsWith('grammar_')
  );

  // 単元ごとにグループ化
  const unitMap = new Map<
    string,
    {
      questions: Array<[string, WordProgress]>;
      answered: Array<[string, WordProgress]>;
      correct: number;
      incorrect: number;
      mastered: number;
      allHistory: Array<{ timestamp: number; wasCorrect: boolean }>; // 全問の履歴を統合
    }
  >();

  grammarQuestions.forEach(([word, wp]) => {
    // IDフォーマット: grammar_vf-g3-u1-001 または grammar_g3-u1-q1 などに対応
    const match = word.match(/grammar_(?:\w+-)?g(\d+)-u(\d+)/);
    if (!match) {
      // マッチしないIDをログ出力（デバッグ用）
      if (word.startsWith('grammar_') && !word.includes('unknown')) {
        console.warn(`⚠️ 文法問題IDがパターンにマッチしません: ${word}`);
      }
      return;
    }

    const grade = match[1];
    const unit = match[2];
    const unitKey = `中${grade}_Unit${unit}`;

    if (!unitMap.has(unitKey)) {
      unitMap.set(unitKey, {
        questions: [],
        answered: [],
        correct: 0,
        incorrect: 0,
        mastered: 0,
        allHistory: [],
      });
    }

    const unitData = unitMap.get(unitKey)!;
    unitData.questions.push([word, wp]);

    const totalAttempts = wp.grammarAttempts || wp.correctCount + wp.incorrectCount;
    if (totalAttempts > 0) {
      unitData.answered.push([word, wp]);
      const correctCount = wp.grammarCorrect || wp.correctCount || 0;
      const incorrectCount = totalAttempts - correctCount;
      unitData.correct += correctCount;
      unitData.incorrect += incorrectCount;

      // learningHistoryから履歴を統合（各問題ごとに最新10件）
      if (wp.learningHistory && wp.learningHistory.length > 0) {
        const recentHistory = wp.learningHistory.slice(-10);
        unitData.allHistory.push(...recentHistory);
      }

      // 定着判定
      const consecutiveCorrect = wp.grammarStreak || wp.consecutiveCorrect || 0;
      const accuracy = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0;
      const isMarkedAsMastered = wp.masteryLevel === 'mastered';
      const isOneShot = totalAttempts === 1 && correctCount === 1;
      const isStableAccuracy = totalAttempts >= 3 && accuracy >= 85;

      if (isMarkedAsMastered || isOneShot || isStableAccuracy || consecutiveCorrect >= 3) {
        unitData.mastered++;
      }
    }
  });

  // 結果を配列に変換
  const result = Array.from(unitMap.entries()).map(([unit, data]) => {
    const totalAttempts = data.correct + data.incorrect;
    const accuracy = totalAttempts > 0 ? (data.correct / totalAttempts) * 100 : 0;
    const progress =
      data.questions.length > 0 ? (data.answered.length / data.questions.length) * 100 : 0;

    // 履歴を時系列でソートして最新10件を取得
    const sortedHistory = data.allHistory.sort((a, b) => a.timestamp - b.timestamp).slice(-10);
    const historyIcons = sortedHistory.map((h) => (h.wasCorrect ? '🟩' : '🟥')).join('');

    return {
      unit,
      totalQuestions: data.questions.length,
      answeredQuestions: data.answered.length,
      correctCount: data.correct,
      incorrectCount: data.incorrect,
      masteredCount: data.mastered,
      accuracy: Math.round(accuracy),
      progress: Math.round(progress),
      historyIcons,
    };
  });

  // 単元名でソート
  result.sort((a, b) => a.unit.localeCompare(b.unit));

  return result;
}

/**
 * まだまだ・分からない単語のリストを取得
 * @param mode 学習モード（指定しない場合は全モード）
 * @returns 単語リスト（Position降順）
 */
export function getStrugglingWordsList(mode?: LearningMode): Array<{
  word: string;
  position: number;
  category: 'still_learning' | 'incorrect';
  attempts: number;
  correctCount: number;
  incorrectCount: number;
  lastStudied: number;
}> {
  const progress = loadProgressSync();
  const allWords = Object.entries(progress.wordProgress);

  const strugglingWords = allWords
    .map(([word, wp]) => {
      // モード指定がある場合はフィルタリング
      let attempts = 0;
      if (mode) {
        switch (mode) {
          case 'memorization':
            attempts = wp.memorizationAttempts || 0;
            break;
          case 'translation':
            attempts = wp.translationAttempts || 0;
            break;
          case 'spelling':
            attempts = wp.spellingAttempts || 0;
            break;
          case 'grammar':
            attempts = wp.grammarAttempts || 0;
            break;
        }
        if (attempts === 0) return null;
      } else {
        attempts = wp.totalAttempts || 0;
        if (attempts === 0) return null;
      }

      // Positionを計算
      const position = mode ? determineWordPosition(wp, mode) : determineWordPosition(wp);

      // まだまだ（40-70）または分からない（70-100）のみ
      if (position < 40) return null;

      const category: 'still_learning' | 'incorrect' = position >= 70 ? 'incorrect' : 'still_learning';

      return {
        word,
        position,
        category,
        attempts,
        correctCount: wp.correctCount || 0,
        incorrectCount: wp.incorrectCount || 0,
        lastStudied: wp.lastStudied || 0,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // Position降順（優先度が高い順）
  strugglingWords.sort((a, b) => b.position - a.position);

  return strugglingWords;
}
