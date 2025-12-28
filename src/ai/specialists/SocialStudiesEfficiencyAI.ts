/**
 * SocialStudiesEfficiencyAI - 社会科学習効率評価AI
 *
 * 社会科の学習効率を測定・分析し、最適な学習方法を提案する
 *
 * 主な機能:
 * 1. 定着率・学習速度・忘却率の測定
 * 2. 分野別（歴史・地理・公民）の得意/苦手分析
 * 3. いもづる式学習（因果関係・時系列）の効果測定
 * 4. 年代別・分野別の学習効率分析
 */

import type { SocialStudiesProgressData } from '@/storage/progress/socialStudiesProgress';
import { logger } from '@/utils/logger';

/**
 * 社会科学習効率指標
 */
export interface SocialStudiesEfficiencyMetrics {
  /** 定着率（0-1）: 学習した語句のうち定着した割合 */
  retentionRate: number;

  /** 学習速度（語/日）: 単位時間あたりの定着語数 */
  learningSpeed: number;

  /** 忘却率（0-1）: 一度定着した語句を忘れる割合 */
  forgettingRate: number;

  /** 平均試行回数: 1語句を定着させるのに必要な平均試行回数 */
  averageAttempts: number;

  /** 効率スコア（0-100）: 総合的な学習効率 */
  efficiencyScore: number;

  /** 測定日時 */
  measuredAt: number;
}

/**
 * 分野別学習効率
 */
export interface FieldEfficiency {
  /** 分野名（古代・中世・近世・近代・現代・日本地理・世界地理など） */
  field: string;

  /** この分野での定着率 */
  retentionRate: number;

  /** この分野での学習速度 */
  learningSpeed: number;

  /** 定着語句数 */
  masteredCount: number;

  /** 総出題数 */
  totalAttempts: number;

  /** 得意度（0-100）: この分野の得意具合 */
  proficiency: number;
}

/**
 * いもづる式学習の効果測定（社会科専用）
 */
export interface ChainLearningEffect {
  /** チェーン学習（因果関係・時系列）を使用したか */
  usedChainLearning: boolean;

  /** 因果関係学習での定着率 */
  causalRetentionRate: number;

  /** 時系列学習での定着率 */
  chronologicalRetentionRate: number;

  /** ランダム学習での定着率 */
  randomRetentionRate: number;

  /** 因果関係の効果（causal - random） */
  causalEffect: number;

  /** 時系列の効果（chronological - random） */
  chronologicalEffect: number;

  /** 測定期間の開始日時 */
  periodStart: number;

  /** 測定期間の終了日時 */
  periodEnd: number;
}

/**
 * 学習効率分析結果
 */
export interface EfficiencyAnalysis {
  /** 改善点 */
  improvements: string[];

  /** 懸念事項 */
  concerns: string[];

  /** 推奨事項 */
  recommendations: string[];

  /** 得意分野（上位3つ） */
  strengths: string[];

  /** 苦手分野（下位3つ） */
  weaknesses: string[];
}

export class SocialStudiesEfficiencyAI {
  /**
   * 全体的な学習効率を計算
   */
  calculateOverallMetrics(progressData: SocialStudiesProgressData): SocialStudiesEfficiencyMetrics {
    const allProgress = Object.values(progressData.termProgress);

    // 定着率: Position 0-20の語句の割合
    const masteredTerms = allProgress.filter((tp) => tp.position <= 20);
    const attemptedTerms = allProgress.filter((tp) => tp.correctCount + tp.incorrectCount > 0);
    const retentionRate =
      attemptedTerms.length > 0 ? masteredTerms.length / attemptedTerms.length : 0;

    // 学習速度: 最近24時間での定着語句数
    const now = Date.now();
    const last24Hours = now - 24 * 60 * 60 * 1000;
    const recentMastered = allProgress.filter(
      (tp) => tp.position <= 20 && tp.lastAnswered > last24Hours
    );
    const learningSpeed = recentMastered.length; // 語/日

    // 忘却率: 一度定着したが再び学習中（Position > 20）になった語句の割合
    const forgottenTerms = allProgress.filter(
      (tp) =>
        tp.position > 20 &&
        tp.correctCount > 3 && // 一度は定着していた
        tp.incorrectCount > 0 // でも不正解がある
    );
    const forgettingRate =
      masteredTerms.length > 0 ? forgottenTerms.length / masteredTerms.length : 0;

    // 平均試行回数
    const totalAttempts = allProgress.reduce(
      (sum, tp) => sum + tp.correctCount + tp.incorrectCount,
      0
    );
    const averageAttempts =
      masteredTerms.length > 0 ? totalAttempts / masteredTerms.length : 0;

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
    // 1日10語句を目標として正規化（社会科は英語より少なめ）
    const speedScore = Math.min((metrics.learningSpeed / 10) * 30, 30);

    // 忘却率の貢献（20点）- 低いほど良い
    const forgettingScore = (1 - metrics.forgettingRate) * 20;

    // 試行回数の貢献（10点）- 少ないほど良い
    // 理想は4回で定着（社会科は英語より1回多め）
    const attemptsScore = Math.max(0, (1 - (metrics.averageAttempts - 4) / 8) * 10);

    return Math.min(100, retentionScore + speedScore + forgettingScore + attemptsScore);
  }

  /**
   * 分野別の学習効率を分析
   */
  analyzeFieldEfficiency(progressData: SocialStudiesProgressData): FieldEfficiency[] {
    const fieldMap = new Map<string, typeof progressData.termProgress[string][]>();

    // 分野ごとに語句をグループ化
    Object.values(progressData.termProgress).forEach((tp) => {
      const field = tp.field || 'その他';
      if (!fieldMap.has(field)) {
        fieldMap.set(field, []);
      }
      fieldMap.get(field)!.push(tp);
    });

    const efficiencies: FieldEfficiency[] = [];

    fieldMap.forEach((terms, field) => {
      const attemptedTerms = terms.filter((tp) => tp.correctCount + tp.incorrectCount > 0);
      const masteredTerms = terms.filter((tp) => tp.position <= 20);

      const retentionRate =
        attemptedTerms.length > 0 ? masteredTerms.length / attemptedTerms.length : 0;

      const totalAttempts = terms.reduce(
        (sum, tp) => sum + tp.correctCount + tp.incorrectCount,
        0
      );
      const learningSpeed =
        masteredTerms.length > 0 ? masteredTerms.length / (totalAttempts / 10) : 0;

      // 得意度: 定着率と学習速度の総合評価
      const proficiency = (retentionRate * 60 + Math.min(learningSpeed / 2, 1) * 40) * 100;

      efficiencies.push({
        field,
        retentionRate,
        learningSpeed,
        masteredCount: masteredTerms.length,
        totalAttempts,
        proficiency: Math.round(proficiency),
      });
    });

    // 得意度順にソート
    return efficiencies.sort((a, b) => b.proficiency - a.proficiency);
  }

  /**
   * いもづる式学習の効果を測定（社会科専用）
   */
  measureChainLearningEffect(
    progressData: SocialStudiesProgressData,
    relationshipType: 'cause' | 'chronological' | 'random'
  ): ChainLearningEffect {
    // TODO: 将来的に学習履歴を記録して効果測定を実装
    // 現時点では基本的な統計のみ

    const allProgress = Object.values(progressData.termProgress);
    const masteredTerms = allProgress.filter((tp) => tp.position <= 20);
    const attemptedTerms = allProgress.filter((tp) => tp.correctCount + tp.incorrectCount > 0);

    const retentionRate =
      attemptedTerms.length > 0 ? masteredTerms.length / attemptedTerms.length : 0;

    return {
      usedChainLearning: true,
      causalRetentionRate: retentionRate, // 現時点では同じ値
      chronologicalRetentionRate: retentionRate, // 現時点では同じ値
      randomRetentionRate: retentionRate * 0.9, // 推定値（将来的には実データで測定）
      causalEffect: retentionRate * 0.1, // 推定値
      chronologicalEffect: retentionRate * 0.1, // 推定値
      periodStart: Date.now() - 30 * 24 * 60 * 60 * 1000, // 過去30日
      periodEnd: Date.now(),
    };
  }

  /**
   * 学習効率を分析してフィードバックを生成
   */
  analyzeEfficiency(
    metrics: SocialStudiesEfficiencyMetrics,
    fieldEfficiencies: FieldEfficiency[],
    chainEffect: ChainLearningEffect,
    previousMetrics?: SocialStudiesEfficiencyMetrics
  ): EfficiencyAnalysis {
    const improvements: string[] = [];
    const concerns: string[] = [];
    const recommendations: string[] = [];

    // 前回との比較
    if (previousMetrics) {
      const scoreChange = metrics.efficiencyScore - previousMetrics.efficiencyScore;
      if (scoreChange > 5) {
        improvements.push(`学習効率が${Math.round(scoreChange)}ポイント向上しています`);
      } else if (scoreChange < -5) {
        concerns.push(`学習効率が${Math.round(Math.abs(scoreChange))}ポイント低下しています`);
      }
    }

    // 定着率の分析
    if (metrics.retentionRate >= 0.8) {
      improvements.push('定着率が非常に高いです（80%以上）');
    } else if (metrics.retentionRate < 0.5) {
      concerns.push('定着率が低めです（50%未満）');
      recommendations.push('復習の頻度を増やしましょう');
    }

    // 学習速度の分析
    if (metrics.learningSpeed < 3) {
      concerns.push('学習速度が遅めです（1日3語句未満）');
      recommendations.push('学習時間を増やすか、1セッションの問題数を増やしましょう');
    }

    // 忘却率の分析
    if (metrics.forgettingRate > 0.3) {
      concerns.push('忘却率が高めです（30%以上）');
      recommendations.push('定期的な復習を取り入れましょう');
    }

    // 分野別分析
    const topFields = fieldEfficiencies.slice(0, 3);
    const bottomFields = fieldEfficiencies.slice(-3).reverse();

    const strengths = topFields.map((f) => `${f.field}（${Math.round(f.proficiency)}点）`);
    const weaknesses = bottomFields
      .filter((f) => f.proficiency < 60)
      .map((f) => `${f.field}（${Math.round(f.proficiency)}点）`);

    if (weaknesses.length > 0) {
      recommendations.push(`苦手分野（${weaknesses.join('、')}）の集中学習を検討しましょう`);
    }

    // いもづる式学習の効果
    if (chainEffect.usedChainLearning) {
      if (chainEffect.causalEffect > 0.1) {
        improvements.push('因果関係学習が効果的に機能しています');
        recommendations.push('因果関係を意識した学習を継続しましょう');
      }
      if (chainEffect.chronologicalEffect > 0.1) {
        improvements.push('時系列学習が効果的に機能しています');
        recommendations.push('歴史の流れを重視した学習を継続しましょう');
      }
    }

    logger.info('[SocialStudiesEfficiencyAI] 学習効率分析結果', {
      metrics,
      improvements: improvements.length,
      concerns: concerns.length,
      recommendations: recommendations.length,
      strengths: strengths.length,
      weaknesses: weaknesses.length,
    });

    return {
      improvements,
      concerns,
      recommendations,
      strengths,
      weaknesses,
    };
  }
}

/**
 * シングルトンインスタンス
 */
export const socialStudiesEfficiencyAI = new SocialStudiesEfficiencyAI();
