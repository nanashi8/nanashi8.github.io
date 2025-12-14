/**
 * レーダーチャートAI - 弱点分野を自動検出して改善をサポート
 *
 * このモジュールは以下の機能を提供します：
 * 1. レーダーチャートから弱点分野を自動検出
 * 2. 弱点分野の問題を優先的に出題
 * 3. バランスの取れた学習プランの提案
 * 4. 改善目標の自動設定
 */

import { Question } from '@/types';
import { loadProgressSync } from '@/storage/progress/progressStorage';

/**
 * レーダーチャート分析結果
 */
export interface RadarAnalysis {
  weakCategories: CategoryWeakness[];
  strongCategories: CategoryStrength[];
  balanceScore: number; // 0-100（100が完璧なバランス）
  improvementPlan: ImprovementPlan;
  aiRecommendations: string[];
}

export interface CategoryWeakness {
  category: string;
  accuracy: number; // 正答率
  totalAttempts: number;
  masteredWords: number;
  totalWords: number;
  weaknessLevel: 'critical' | 'moderate' | 'minor'; // 弱点レベル
  priorityScore: number; // 優先度（高いほど優先）
  estimatedImprovementDays: number; // 改善に必要な推定日数
}

export interface CategoryStrength {
  category: string;
  accuracy: number;
  totalAttempts: number;
  masteredWords: number;
  totalWords: number;
  strengthLevel: 'expert' | 'proficient' | 'good';
}

export interface ImprovementPlan {
  targetCategories: string[]; // 重点的に学習すべき分野
  dailyQuestions: { [category: string]: number }; // 分野ごとの1日の推奨問題数
  estimatedCompletionDays: number; // 完了までの推定日数
  milestones: Milestone[]; // マイルストーン
}

export interface Milestone {
  day: number;
  category: string;
  targetAccuracy: number;
  description: string;
}

/**
 * レーダーチャートを分析して弱点を検出
 */
export function analyzeRadarChart(allQuestions: Question[], categoryList: string[]): RadarAnalysis {
  const progress = loadProgressSync();
  const categoryStats = new Map<
    string,
    {
      correct: number;
      total: number;
      mastered: number;
      wordCount: number;
    }
  >();

  // 分野別の統計を集計
  categoryList.forEach((category) => {
    categoryStats.set(category, {
      correct: 0,
      total: 0,
      mastered: 0,
      wordCount: 0,
    });
  });

  // 結果から統計を計算
  progress.results.forEach((result) => {
    if (result.category && categoryStats.has(result.category)) {
      const stats = categoryStats.get(result.category)!;
      stats.correct += result.score;
      stats.total += result.total;
    }
  });

  // 単語進捗から定着数とカテゴリー単語数を計算
  allQuestions.forEach((q) => {
    const category = q.category;
    if (!category || !categoryStats.has(category)) return;

    const stats = categoryStats.get(category)!;
    stats.wordCount++;

    const wordProgress = progress.wordProgress[q.word];
    if (wordProgress) {
      const totalAttempts = wordProgress.correctCount + wordProgress.incorrectCount;
      const isDefinitelyMastered =
        (totalAttempts === 1 && wordProgress.correctCount === 1) ||
        wordProgress.consecutiveCorrect >= 3 ||
        (wordProgress.skippedCount && wordProgress.skippedCount > 0);

      const isLikelyMastered =
        totalAttempts >= 3 &&
        wordProgress.correctCount / totalAttempts >= 0.8 &&
        wordProgress.consecutiveCorrect >= 2;

      if (isDefinitelyMastered || isLikelyMastered) {
        stats.mastered++;
      }
    }
  });

  // 弱点と強みを分類
  const weakCategories: CategoryWeakness[] = [];
  const strongCategories: CategoryStrength[] = [];

  categoryStats.forEach((stats, category) => {
    if (stats.total === 0 && stats.wordCount === 0) return; // データなし

    const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
    const masteryRate = stats.wordCount > 0 ? (stats.mastered / stats.wordCount) * 100 : 0;

    // 総合スコア（正答率60% + 定着率40%）
    const overallScore = accuracy * 0.6 + masteryRate * 0.4;

    if (overallScore < 60) {
      // 弱点分野
      let weaknessLevel: 'critical' | 'moderate' | 'minor';
      let priorityScore: number;
      let estimatedDays: number;

      if (overallScore < 40) {
        weaknessLevel = 'critical';
        priorityScore = 100;
        estimatedDays = 14;
      } else if (overallScore < 50) {
        weaknessLevel = 'moderate';
        priorityScore = 70;
        estimatedDays = 10;
      } else {
        weaknessLevel = 'minor';
        priorityScore = 40;
        estimatedDays = 7;
      }

      // 試行回数が少ない分野は優先度を上げる（学習不足の可能性）
      if (stats.total < 10) {
        priorityScore += 20;
      }

      weakCategories.push({
        category,
        accuracy,
        totalAttempts: stats.total,
        masteredWords: stats.mastered,
        totalWords: stats.wordCount,
        weaknessLevel,
        priorityScore,
        estimatedImprovementDays: estimatedDays,
      });
    } else if (overallScore >= 75) {
      // 強み分野
      let strengthLevel: 'expert' | 'proficient' | 'good';
      if (overallScore >= 90) {
        strengthLevel = 'expert';
      } else if (overallScore >= 80) {
        strengthLevel = 'proficient';
      } else {
        strengthLevel = 'good';
      }

      strongCategories.push({
        category,
        accuracy,
        totalAttempts: stats.total,
        masteredWords: stats.mastered,
        totalWords: stats.wordCount,
        strengthLevel,
      });
    }
  });

  // 優先度順にソート
  weakCategories.sort((a, b) => b.priorityScore - a.priorityScore);
  strongCategories.sort((a, b) => b.accuracy - a.accuracy);

  // バランススコアを計算
  const balanceScore = calculateBalanceScore(categoryStats);

  // 改善プランを生成
  const improvementPlan = generateImprovementPlan(weakCategories);

  // AI推奨事項を生成
  const aiRecommendations = generateAIRecommendations(
    weakCategories,
    strongCategories,
    balanceScore
  );

  return {
    weakCategories,
    strongCategories,
    balanceScore,
    improvementPlan,
    aiRecommendations,
  };
}

/**
 * バランススコアを計算（全分野の均等度）
 */
function calculateBalanceScore(
  categoryStats: Map<
    string,
    { correct: number; total: number; mastered: number; wordCount: number }
  >
): number {
  const accuracies: number[] = [];

  categoryStats.forEach((stats) => {
    if (stats.total > 0) {
      const accuracy = (stats.correct / stats.total) * 100;
      accuracies.push(accuracy);
    }
  });

  if (accuracies.length === 0) return 50;

  // 標準偏差を計算（低いほどバランスが良い）
  const mean = accuracies.reduce((sum, val) => sum + val, 0) / accuracies.length;
  const variance =
    accuracies.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / accuracies.length;
  const stdDev = Math.sqrt(variance);

  // 標準偏差を0-100のスコアに変換（低いほど高スコア）
  const balanceScore = Math.max(0, Math.min(100, 100 - stdDev * 2));

  return Math.round(balanceScore);
}

/**
 * 改善プランを生成
 */
function generateImprovementPlan(weakCategories: CategoryWeakness[]): ImprovementPlan {
  const targetCategories: string[] = [];
  const dailyQuestions: { [category: string]: number } = {};
  const milestones: Milestone[] = [];

  // 上位3つの弱点分野を重点的に学習
  const topWeak = weakCategories.slice(0, 3);

  topWeak.forEach((weak) => {
    targetCategories.push(weak.category);

    // 弱点レベルに応じて問題数を決定
    let questionsPerDay: number;
    if (weak.weaknessLevel === 'critical') {
      questionsPerDay = 15;
    } else if (weak.weaknessLevel === 'moderate') {
      questionsPerDay = 10;
    } else {
      questionsPerDay = 5;
    }

    dailyQuestions[weak.category] = questionsPerDay;

    // マイルストーンを設定
    const milestone: Milestone = {
      day: Math.ceil(weak.estimatedImprovementDays / 2),
      category: weak.category,
      targetAccuracy: Math.min(weak.accuracy + 20, 80),
      description: `${weak.category}の正答率を${Math.round(weak.accuracy)}%から${Math.min(weak.accuracy + 20, 80)}%に改善`,
    };
    milestones.push(milestone);
  });

  // 完了までの推定日数
  const estimatedCompletionDays =
    topWeak.length > 0 ? Math.max(...topWeak.map((w) => w.estimatedImprovementDays)) : 0;

  return {
    targetCategories,
    dailyQuestions,
    estimatedCompletionDays,
    milestones,
  };
}

/**
 * AI推奨事項を生成
 */
function generateAIRecommendations(
  weakCategories: CategoryWeakness[],
  strongCategories: CategoryStrength[],
  balanceScore: number
): string[] {
  const recommendations: string[] = [];

  // 弱点分野に関する推奨
  if (weakCategories.length > 0) {
    const topWeak = weakCategories[0];
    recommendations.push(
      `🎯 最優先: 「${topWeak.category}」を重点学習しましょう（現在${Math.round(topWeak.accuracy)}% → 目標80%）`
    );

    if (topWeak.weaknessLevel === 'critical') {
      recommendations.push(
        `⚠️ 「${topWeak.category}」は重要な弱点です。毎日15問以上取り組むことを推奨します`
      );
    }

    // 複数の弱点がある場合
    if (weakCategories.length >= 3) {
      recommendations.push(
        `📚 ${weakCategories.length}個の弱点分野があります。1つずつ集中して改善しましょう`
      );
    }
  }

  // バランスに関する推奨
  if (balanceScore < 50) {
    recommendations.push(
      `⚖️ 学習バランスが偏っています（バランススコア: ${balanceScore}%）。弱点分野に時間を配分しましょう`
    );
  } else if (balanceScore >= 80) {
    recommendations.push(
      `✨ 素晴らしいバランスです！（バランススコア: ${balanceScore}%）この調子で継続しましょう`
    );
  }

  // 強み分野の活用
  if (strongCategories.length > 0 && weakCategories.length > 0) {
    const topStrong = strongCategories[0];
    recommendations.push(
      `💪 「${topStrong.category}」は得意分野です（${Math.round(topStrong.accuracy)}%）。この学習方法を他の分野にも応用しましょう`
    );
  }

  // 具体的な学習戦略
  if (weakCategories.length > 0) {
    recommendations.push(`🧠 AI学習システムが弱点分野の問題を自動的に優先出題します`);
  }

  // データが少ない場合
  const totalAttempts = [...weakCategories, ...strongCategories].reduce(
    (sum, cat) => sum + cat.totalAttempts,
    0
  );
  if (totalAttempts < 50) {
    recommendations.push(`📈 まだ学習データが少ないです。50問以上解くとより正確な分析ができます`);
  }

  return recommendations;
}

/**
 * 弱点分野の問題を優先的に選択（軽量版）
 */
export function prioritizeWeakCategoryQuestions(
  questions: Question[],
  weakCategories: CategoryWeakness[],
  targetCount: number = 30
): Question[] {
  if (weakCategories.length === 0) {
    // 弱点がない場合は通常の選択
    return questions.slice(0, targetCount);
  }

  const prioritized: Question[] = [];
  const categoryQuotas = new Map<string, number>();

  // 弱点分野ごとの出題数を計算（優先度に応じて配分）
  const totalPriority = weakCategories.slice(0, 3).reduce((sum, cat) => sum + cat.priorityScore, 0);

  weakCategories.slice(0, 3).forEach((weak) => {
    const quota = Math.ceil((weak.priorityScore / totalPriority) * targetCount * 0.7); // 70%を弱点分野に
    categoryQuotas.set(weak.category, quota);
  });

  // 弱点分野から問題を選択
  weakCategories.slice(0, 3).forEach((weak) => {
    const quota = categoryQuotas.get(weak.category) || 0;
    const categoryQuestions = questions.filter((q) => q.category === weak.category);

    // ランダムに選択（既に定着している単語は除外）
    const progress = loadProgressSync();
    const unmastered = categoryQuestions.filter((q) => {
      const wp = progress.wordProgress[q.word];
      if (!wp) return true; // 未学習
      return wp.consecutiveCorrect < 3; // 定着していない
    });

    const selected = shuffleArray(unmastered).slice(0, quota);
    prioritized.push(...selected);
  });

  // 残りは他の分野からバランスよく選択
  const remainingCount = targetCount - prioritized.length;
  const weakCategorySet = new Set(weakCategories.slice(0, 3).map((w) => w.category));
  const otherQuestions = questions.filter((q) => !weakCategorySet.has(q.category || ''));

  const selectedWords = new Set(prioritized.map((q) => q.word));
  const remaining = otherQuestions.filter((q) => !selectedWords.has(q.word));

  prioritized.push(...shuffleArray(remaining).slice(0, remainingCount));

  return shuffleArray(prioritized);
}

/**
 * 配列をシャッフル
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * レーダーチャート改善進捗を追跡
 */
export interface RadarImprovementProgress {
  startDate: number;
  currentDay: number;
  targetCategories: string[];
  initialAccuracies: { [category: string]: number };
  currentAccuracies: { [category: string]: number };
  improvements: { [category: string]: number }; // 改善度（%）
  overallProgress: number; // 全体の進捗（0-100%）
  isCompleted: boolean;
}

/**
 * 改善進捗を保存
 */
export function saveImprovementProgress(analysis: RadarAnalysis): void {
  const progress: RadarImprovementProgress = {
    startDate: Date.now(),
    currentDay: 1,
    targetCategories: analysis.improvementPlan.targetCategories,
    initialAccuracies: {},
    currentAccuracies: {},
    improvements: {},
    overallProgress: 0,
    isCompleted: false,
  };

  analysis.weakCategories.forEach((weak) => {
    if (analysis.improvementPlan.targetCategories.includes(weak.category)) {
      progress.initialAccuracies[weak.category] = weak.accuracy;
      progress.currentAccuracies[weak.category] = weak.accuracy;
      progress.improvements[weak.category] = 0;
    }
  });

  localStorage.setItem('radar-improvement-progress', JSON.stringify(progress));
}

/**
 * 改善進捗を取得
 */
export function getImprovementProgress(): RadarImprovementProgress | null {
  const stored = localStorage.getItem('radar-improvement-progress');
  if (!stored) return null;

  try {
    return JSON.parse(stored) as RadarImprovementProgress;
  } catch {
    return null;
  }
}

/**
 * 改善進捗を更新
 */
export function updateImprovementProgress(currentAnalysis: RadarAnalysis): void {
  const progress = getImprovementProgress();
  if (!progress) return;

  const daysSinceStart = Math.floor((Date.now() - progress.startDate) / (1000 * 60 * 60 * 24));
  progress.currentDay = daysSinceStart + 1;

  let completedCount = 0;

  progress.targetCategories.forEach((category) => {
    const weak = currentAnalysis.weakCategories.find((w) => w.category === category);
    const current = weak?.accuracy || 80; // 弱点リストから外れていれば80%と仮定

    progress.currentAccuracies[category] = current;
    const improvement = current - progress.initialAccuracies[category];
    progress.improvements[category] = improvement;

    // 目標達成（80%以上）
    if (current >= 80) {
      completedCount++;
    }
  });

  progress.overallProgress = (completedCount / progress.targetCategories.length) * 100;
  progress.isCompleted = completedCount === progress.targetCategories.length;

  localStorage.setItem('radar-improvement-progress', JSON.stringify(progress));
}
