/**
 * 🌍 ContextualAI - 文脈的AI
 *
 * 責任:
 * - 学習文脈の分析
 * - タブ間の相乗効果の評価
 * - 環境適合度の判定
 * - トピック継続性の評価
 */

import type { SpecialistAI, ContextualSignal, AIAnalysisInput } from '../types';

export class ContextualAI implements SpecialistAI<ContextualSignal> {
  readonly id = 'contextual';
  readonly name = 'Contextual AI';
  readonly icon = '🌍';

  analyze(input: AIAnalysisInput): ContextualSignal {
    const { word, currentTab, allProgress, sessionStats } = input;

    const contextRelevance = this.calculateContextRelevance(word, currentTab);
    const topicContinuity = this.evaluateTopicContinuity(word, allProgress, sessionStats);
    const environmentFit = this.assessEnvironmentFit(currentTab, sessionStats);
    const crossTabSynergy = this.identifyCrossTabSynergy(word, currentTab, allProgress);

    return {
      aiId: 'contextual',
      confidence: this.calculateConfidence(sessionStats),
      timestamp: Date.now(),
      contextRelevance,
      topicContinuity,
      environmentFit,
      crossTabSynergy,
    };
  }

  /**
   * 文脈関連性の計算
   */
  private calculateContextRelevance(word: string, currentTab: string): number {
    // タブに応じた関連性スコア
    // 実際には問題の文法項目、トピック、難易度などを考慮

    let relevance = 0.5; // ベーススコア

    // 暗記タブ: 新規・復習バランス重視
    if (currentTab === 'memorization') {
      relevance += 0.2;
    }

    // 文法タブ: 文法項目の関連性重視
    if (currentTab === 'grammar') {
      // 文法項目が一致する場合は高関連性
      relevance += 0.3;
    }

    // 総合タブ: バランス重視
    if (currentTab === 'comprehensive') {
      relevance += 0.1;
    }

    return Math.min(relevance, 1);
  }

  /**
   * トピック継続性の評価
   */
  private evaluateTopicContinuity(
    word: string,
    allProgress: Record<string, WordProgress>,
    sessionStats: any
  ): boolean {
    // 最近学習した語句との関連性を評価
    // 実際には意味的カテゴリー、文法項目などを分析

    // 簡易実装: セッション中の試行回数が多い場合は継続性あり
    return sessionStats.totalAttempts >= 5;
  }

  /**
   * 環境適合度の評価
   */
  private assessEnvironmentFit(currentTab: string, sessionStats: any): number {
    let fit = 0.5;

    const sessionMinutes = sessionStats.sessionDuration / (1000 * 60);
    const correctRate =
      sessionStats.totalAttempts > 0
        ? sessionStats.correctAnswers / sessionStats.totalAttempts
        : 0.5;

    // 時間帯による調整（実際にはブラウザのDate APIで判定）
    const hour = new Date().getHours();

    // 朝（6-12時）: 新規学習に適している
    if (hour >= 6 && hour < 12 && currentTab === 'memorization') {
      fit += 0.2;
    }

    // 午後（12-18時）: 集中力が高い → 文法学習に適している
    if (hour >= 12 && hour < 18 && currentTab === 'grammar') {
      fit += 0.2;
    }

    // 夜（18-24時）: 復習に適している
    if (hour >= 18 && currentTab === 'memorization' && correctRate >= 0.7) {
      fit += 0.2;
    }

    // 短時間セッション: 暗記に適している
    if (sessionMinutes < 15 && currentTab === 'memorization') {
      fit += 0.1;
    }

    return Math.min(fit, 1);
  }

  /**
   * タブ間相乗効果の特定
   */
  private identifyCrossTabSynergy(
    word: string,
    currentTab: string,
    allProgress: Record<string, WordProgress>
  ): string[] {
    const synergy: string[] = [];

    // 暗記タブで学習した語句が文法タブで出現する場合
    if (currentTab === 'memorization') {
      const wordProgress = allProgress[word];
      if (wordProgress?.grammarAttempts && wordProgress.grammarAttempts > 0) {
        synergy.push('grammar-memorization-link');
      }
    }

    // 文法タブで学習した語句が暗記タブで出現する場合
    if (currentTab === 'grammar') {
      const wordProgress = allProgress[word];
      if (wordProgress?.memorizationAttempts && wordProgress.memorizationAttempts > 0) {
        synergy.push('memorization-grammar-link');
      }
    }

    // 総合タブ: 両方のタブで学習済み
    if (currentTab === 'comprehensive') {
      const wordProgress = allProgress[word];
      if (
        wordProgress?.memorizationAttempts &&
        wordProgress.memorizationAttempts > 0 &&
        wordProgress?.grammarAttempts &&
        wordProgress.grammarAttempts > 0
      ) {
        synergy.push('comprehensive-integration');
      }
    }

    return synergy;
  }

  private calculateConfidence(sessionStats: any): number {
    const totalAttempts = sessionStats.totalAttempts;
    const sessionMinutes = sessionStats.sessionDuration / (1000 * 60);

    // セッション時間と試行回数で信頼度を計算
    let confidence = 0.4;

    if (totalAttempts >= 10) confidence += 0.3;
    else if (totalAttempts >= 5) confidence += 0.2;

    if (sessionMinutes >= 10) confidence += 0.3;
    else if (sessionMinutes >= 5) confidence += 0.2;

    return Math.min(confidence, 1);
  }

  validateSignal(signal: ContextualSignal): boolean {
    if (!signal.aiId || signal.aiId !== 'contextual') return false;
    if (signal.confidence < 0 || signal.confidence > 1) return false;
    if (signal.contextRelevance < 0 || signal.contextRelevance > 1) return false;
    if (signal.environmentFit < 0 || signal.environmentFit > 1) return false;
    if (typeof signal.topicContinuity !== 'boolean') return false;
    if (!Array.isArray(signal.crossTabSynergy)) return false;

    return true;
  }
}

interface WordProgress {
  memorizationAttempts?: number;
  memorizationCorrect?: number;
  grammarAttempts?: number;
  grammarCorrect?: number;
  comprehensiveAttempts?: number;
  comprehensiveCorrect?: number;
}
