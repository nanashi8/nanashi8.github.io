/**
 * 統計情報取得モジュール
 * 進捗データの統計分析・集計機能
 */

import { loadProgressSync } from './progressStorage';
import type { QuizResult } from './types';

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
