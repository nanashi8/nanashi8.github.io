/**
 * LearningEfficiencyAI - 学習効率評価AI
 *
 * 生徒の学習効率を測定・分析し、最適な学習方法を提案する
 *
 * 主な機能:
 * 1. 定着率・学習速度・忘却率の測定
 * 2. 分野別の得意/苦手分析
 * 3. いもづる式学習の効果測定
 * 4. 最適な学習クラスターの推薦
 */

import type {
  LearningEfficiencyMetrics,
  CategoryEfficiency,
  ChainLearningEffect,
  LearningHistoryEntry,
  EfficiencyAnalysis,
  ClusterRecommendation,
  SemanticCluster,
} from '@/types/learningEfficiency';
import type { WordProgress } from '@/storage/progress/types';
import { logger } from '@/utils/logger';

export class LearningEfficiencyAI {
  /**
   * 全体的な学習効率を計算
   */
  calculateOverallMetrics(
    wordProgress: Record<string, WordProgress>,
    _recentHistory: LearningHistoryEntry[]
  ): LearningEfficiencyMetrics {
    const allWords = Object.values(wordProgress);

    // 定着率: 定着済み単語の割合
    const masteredWords = allWords.filter((wp) => wp.masteryLevel === 'mastered');
    const attemptedWords = allWords.filter((wp) => (wp.totalAttempts ?? 0) > 0);
    const retentionRate =
      attemptedWords.length > 0 ? masteredWords.length / attemptedWords.length : 0;

    // 学習速度: 最近24時間での定着語数
    const now = Date.now();
    const last24Hours = now - 24 * 60 * 60 * 1000;
    const recentMastered = allWords.filter(
      (wp) => wp.masteryLevel === 'mastered' && wp.lastStudied > last24Hours
    );
    const learningSpeed = recentMastered.length; // 語/日

    // 忘却率: 一度定着したが再び学習中になった単語の割合
    const forgottenWords = allWords.filter(
      (wp) =>
        wp.masteryLevel === 'learning' &&
        wp.correctCount > 3 && // 一度は定着していた
        wp.consecutiveCorrect === 0 // でも今は連続正解0
    );
    const forgettingRate =
      masteredWords.length > 0 ? forgottenWords.length / masteredWords.length : 0;

    // 平均試行回数
    const totalAttempts = allWords.reduce((sum, wp) => sum + (wp.totalAttempts ?? 0), 0);
    const averageAttempts = masteredWords.length > 0 ? totalAttempts / masteredWords.length : 0;

    // 効率スコア（0-100）
    const efficiencyScore = this.calculateEfficiencyScore({
      retentionRate,
      learningSpeed,
      forgettingRate,
      averageAttempts,
    });

    return {
      retentionRate,
      learningSpeed,
      forgettingRate,
      averageAttempts,
      efficiencyScore,
      measuredAt: Date.now(),
    };
  }

  /**
   * 効率スコアを計算
   */
  private calculateEfficiencyScore(metrics: {
    retentionRate: number;
    learningSpeed: number;
    forgettingRate: number;
    averageAttempts: number;
  }): number {
    // 定着率の貢献（40点）
    const retentionScore = metrics.retentionRate * 40;

    // 学習速度の貢献（30点）
    // 1日20語を目標として正規化
    const speedScore = Math.min((metrics.learningSpeed / 20) * 30, 30);

    // 忘却率の貢献（20点）- 低いほど良い
    const forgettingScore = (1 - metrics.forgettingRate) * 20;

    // 試行回数の貢献（10点）- 少ないほど良い
    // 理想は3回で定着
    const attemptsScore = Math.max(0, (1 - (metrics.averageAttempts - 3) / 7) * 10);

    return Math.min(100, retentionScore + speedScore + forgettingScore + attemptsScore);
  }

  /**
   * 分野別の学習効率を分析
   */
  analyzeCategoryEfficiency(
    wordProgress: Record<string, WordProgress>,
    allWords: Array<{ word: string; relatedFields?: string[] }>
  ): CategoryEfficiency[] {
    const categoryMap = new Map<string, WordProgress[]>();

    // 分野ごとに単語をグループ化
    Object.entries(wordProgress).forEach(([word, wp]) => {
      const wordData = allWords.find((w) => w.word === word);
      const categories = wordData?.relatedFields || ['その他'];

      categories.forEach((category) => {
        if (!categoryMap.has(category)) {
          categoryMap.set(category, []);
        }
        categoryMap.get(category)!.push(wp);
      });
    });

    // 各分野の効率を計算
    const efficiencies: CategoryEfficiency[] = [];

    categoryMap.forEach((words, category) => {
      const attemptedWords = words.filter((wp) => (wp.totalAttempts ?? 0) > 0);
      const masteredWords = words.filter((wp) => wp.masteryLevel === 'mastered');

      const retentionRate =
        attemptedWords.length > 0 ? masteredWords.length / attemptedWords.length : 0;

      const totalAttempts = words.reduce((sum, wp) => sum + (wp.totalAttempts ?? 0), 0);
      const learningSpeed =
        masteredWords.length > 0 ? masteredWords.length / (totalAttempts / 10) : 0;

      // 得意度: 定着率と学習速度の総合評価
      const proficiency = (retentionRate * 60 + Math.min(learningSpeed / 2, 1) * 40) * 100;

      efficiencies.push({
        category,
        retentionRate,
        learningSpeed,
        masteredCount: masteredWords.length,
        totalAttempts,
        proficiency: Math.round(proficiency),
      });
    });

    // 得意度順にソート
    return efficiencies.sort((a, b) => b.proficiency - a.proficiency);
  }

  /**
   * いもづる式学習の効果を測定
   */
  measureChainLearningEffect(recentHistory: LearningHistoryEntry[]): ChainLearningEffect {
    const chainedEntries = recentHistory.filter((e) => e.wasChainedLearning);
    const randomEntries = recentHistory.filter((e) => !e.wasChainedLearning);

    const chainRetentionRate =
      chainedEntries.length > 0
        ? chainedEntries.filter((e) => e.correct).length / chainedEntries.length
        : 0;

    const randomRetentionRate =
      randomEntries.length > 0
        ? randomEntries.filter((e) => e.correct).length / randomEntries.length
        : 0;

    const effectDifference = chainRetentionRate - randomRetentionRate;

    const timestamps = recentHistory.map((e) => e.timestamp);
    const periodStart = timestamps.length > 0 ? Math.min(...timestamps) : Date.now();
    const periodEnd = timestamps.length > 0 ? Math.max(...timestamps) : Date.now();

    return {
      usedChainLearning: chainedEntries.length > 0,
      chainRetentionRate,
      randomRetentionRate,
      effectDifference,
      periodStart,
      periodEnd,
    };
  }

  /**
   * 学習効率を分析してフィードバックを生成
   */
  analyzeEfficiency(
    metrics: LearningEfficiencyMetrics,
    categoryEfficiencies: CategoryEfficiency[],
    chainEffect: ChainLearningEffect,
    previousMetrics?: LearningEfficiencyMetrics
  ): EfficiencyAnalysis {
    const improvements: string[] = [];
    const concerns: string[] = [];
    const recommendations: string[] = [];

    // スコア変化の分析
    const scoreChange = previousMetrics
      ? metrics.efficiencyScore - previousMetrics.efficiencyScore
      : 0;

    if (scoreChange > 5) {
      improvements.push(`学習効率が${Math.round(scoreChange)}ポイント向上しました！`);
    } else if (scoreChange < -5) {
      concerns.push(`学習効率が${Math.round(Math.abs(scoreChange))}ポイント低下しています`);
    }

    // 定着率の分析
    if (metrics.retentionRate >= 0.8) {
      improvements.push('定着率が非常に高いです（80%以上）');
    } else if (metrics.retentionRate < 0.5) {
      concerns.push('定着率が低めです（50%未満）');
      recommendations.push('復習の頻度を増やすことをお勧めします');
    }

    // 学習速度の分析
    if (metrics.learningSpeed >= 20) {
      improvements.push('学習ペースが理想的です（1日20語以上）');
    } else if (metrics.learningSpeed < 10) {
      concerns.push('学習ペースが遅めです（1日10語未満）');
      recommendations.push('学習時間を増やすか、1セッションの問題数を増やしましょう');
    }

    // 忘却率の分析
    if (metrics.forgettingRate > 0.3) {
      concerns.push('忘却率が高めです（30%以上）');
      recommendations.push('定期的な復習を取り入れましょう');
    }

    // 分野別分析
    if (categoryEfficiencies.length > 0) {
      const strongestCategory = categoryEfficiencies[0];
      const weakestCategory = categoryEfficiencies[categoryEfficiencies.length - 1];

      if (strongestCategory.proficiency >= 70) {
        improvements.push(`${strongestCategory.category}分野が得意です`);
      }

      if (weakestCategory.proficiency < 40) {
        concerns.push(`${weakestCategory.category}分野が苦手です`);
        recommendations.push(
          `${strongestCategory.category}分野から${weakestCategory.category}分野への関連学習を試してみましょう`
        );
      }
    }

    // いもづる式学習の効果分析
    let chainLearningRecommendation = 50; // デフォルト

    if (chainEffect.usedChainLearning) {
      if (chainEffect.effectDifference > 0.1) {
        improvements.push(
          `いもづる式学習で定着率が${Math.round(chainEffect.effectDifference * 100)}%向上しています`
        );
        chainLearningRecommendation = 90;
        recommendations.push('いもづる式学習を積極的に活用しましょう');
      } else if (chainEffect.effectDifference < -0.1) {
        concerns.push('いもづる式学習の効果が出ていません');
        chainLearningRecommendation = 30;
        recommendations.push('ランダム学習に戻すか、関連度の高い単語で試してみましょう');
      } else {
        chainLearningRecommendation = 50;
      }
    } else {
      recommendations.push('いもづる式学習を試してみることをお勧めします');
      chainLearningRecommendation = 70;
    }

    return {
      currentScore: Math.round(metrics.efficiencyScore),
      scoreChange: Math.round(scoreChange),
      improvements,
      concerns,
      recommendations,
      chainLearningRecommendation,
    };
  }

  /**
   * 最適な学習クラスターを推薦
   */
  recommendClusters(
    clusters: SemanticCluster[],
    categoryEfficiencies: CategoryEfficiency[],
    wordProgress: Record<string, WordProgress>
  ): ClusterRecommendation[] {
    const recommendations: ClusterRecommendation[] = [];

    clusters.forEach((cluster) => {
      // クラスター内の単語の進捗を分析
      const clusterWords = cluster.words
        .map((word) => wordProgress[word])
        .filter((wp) => wp !== undefined);

      const masteredCount = clusterWords.filter((wp) => wp.masteryLevel === 'mastered').length;
      const totalCount = clusterWords.length;
      const masteredRate = totalCount > 0 ? masteredCount / totalCount : 0;

      // このクラスターの分野効率を取得
      const categoryEff = categoryEfficiencies.find((ce) => ce.category === cluster.clusterName);
      const proficiency = categoryEff?.proficiency ?? 50;

      // 推薦理由を生成
      let reason = '';
      let priority = 50;
      let expectedRetentionRate = 0.5;

      if (masteredRate >= 0.7) {
        // 70%以上定着済み → 仕上げに最適
        reason = `${cluster.clusterName}分野は既に${Math.round(masteredRate * 100)}%定着しています。残りを完璧にしましょう`;
        priority = 60;
        expectedRetentionRate = 0.85;
      } else if (masteredRate >= 0.3 && proficiency >= 60) {
        // 30-70%定着 & 得意分野 → 最優先
        reason = `${cluster.clusterName}分野は得意で、成長の余地があります（現在${Math.round(masteredRate * 100)}%定着）`;
        priority = 90;
        expectedRetentionRate = 0.75;
      } else if (masteredRate < 0.3 && proficiency >= 60) {
        // 未着手だが得意分野 → 高優先度
        reason = `${cluster.clusterName}分野は得意です。新しい単語を覚えやすいでしょう`;
        priority = 80;
        expectedRetentionRate = 0.7;
      } else if (masteredRate >= 0.5) {
        // 半分定着済み → 中優先度
        reason = `${cluster.clusterName}分野は半分定着しています。もう一息です`;
        priority = 70;
        expectedRetentionRate = 0.65;
      } else if (proficiency < 40) {
        // 苦手分野 → 低優先度（但し重要）
        reason = `${cluster.clusterName}分野は苦手ですが、いもづる式学習で克服できます`;
        priority = 40;
        expectedRetentionRate = 0.5;
      } else {
        // 中間的な分野
        reason = `${cluster.clusterName}分野はバランスよく学習できます`;
        priority = 55;
        expectedRetentionRate = 0.6;
      }

      recommendations.push({
        cluster,
        reason,
        expectedRetentionRate,
        priority,
      });
    });

    // 優先度順にソート
    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  /**
   * デバッグ用ログ
   */
  logAnalysis(analysis: EfficiencyAnalysis): void {
    logger.info('[LearningEfficiencyAI] 学習効率分析結果', {
      score: analysis.currentScore,
      change: analysis.scoreChange,
      improvements: analysis.improvements.length,
      concerns: analysis.concerns.length,
      recommendations: analysis.recommendations.length,
    });
  }
}
