/**
 * 🌍 ContextualAI - 文脈的AI（Phase 4.5強化版 + ML統合）
 *
 * 責任:
 * - 学習文脈の分析
 * - タブ間の相乗効果の評価
 * - 環境適合度の判定
 * - トピック継続性の評価
 *
 * Phase 4.5 ML統合:
 * - TensorFlow.jsによる文脈適合度予測
 * - ハイブリッドAI（ルールベース + ML）
 */

import type { ContextualSignal, AIAnalysisInput, StorageWordProgress } from '../types';
import { MLEnhancedSpecialistAI } from '../ml/MLEnhancedSpecialistAI';

export class ContextualAI extends MLEnhancedSpecialistAI<ContextualSignal> {
  readonly id = 'contextual';
  readonly name = 'Contextual AI';
  readonly icon = '🌍';

  /**
   * Position提案（統合レイヤー用）
   *
   * 文脈AIの立場: 学習文脈からPositionを提案
   * - 時間経過が長い → Position高（文脈忘却）
   * - 最近学習した → Position低（文脈が鮮明）
   */
  proposePosition(progress: StorageWordProgress, daysSince: number): number {
    // === 文脈忘却 ===
    // 時間が経つと学習時の文脈を忘れる
    const contextDecay = Math.min(daysSince * 3, 30); // 最大+30点

    // === 基準Position ===
    const basePosition = 50;

    // === 最終提案 ===
    const proposedPosition = basePosition + contextDecay;

    return Math.max(0, Math.min(100, proposedPosition));
  }

  protected analyzeByRules(input: AIAnalysisInput): ContextualSignal {
    const { word, currentTab, allProgress, sessionStats } = input;
    const wordStr = typeof word === 'string' ? word : word?.word || '';

    const contextRelevance = this.calculateContextRelevance(wordStr, currentTab);
    const topicContinuity = this.evaluateTopicContinuity(wordStr, allProgress, sessionStats);
    const environmentFit = this.assessEnvironmentFit(currentTab, sessionStats);
    const crossTabSynergy = this.identifyCrossTabSynergy(wordStr, currentTab, allProgress);

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
    allProgress: Record<string, StorageWordProgress>,
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
    allProgress: Record<string, StorageWordProgress>
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

  // ========================================
  // Phase 4.5: ML統合メソッド
  // ========================================

  protected async analyzeByML(input: AIAnalysisInput): Promise<ContextualSignal> {
    const features = this.extractFeatures(input);
    const prediction = await this.predict(features);

    return {
      aiId: 'contextual',
      confidence: prediction.confidence,
      timestamp: Date.now(),
      contextRelevance: prediction.values[0],
      topicContinuity: prediction.values[1] > 0.5,
      environmentFit: prediction.values[2],
      crossTabSynergy: [],
    };
  }

  protected mergeSignals(
    ruleSignal: ContextualSignal,
    mlSignal: ContextualSignal,
    input: AIAnalysisInput
  ): ContextualSignal {
    const sessionCount = input.sessionStats.totalAttempts;
    const mlWeight = Math.min(Math.max((sessionCount - 20) / 50, 0), 0.6);
    const ruleWeight = 1 - mlWeight;

    return {
      aiId: 'contextual',
      confidence: (ruleSignal.confidence * ruleWeight) + (mlSignal.confidence * mlWeight),
      timestamp: Date.now(),
      contextRelevance:
        (ruleSignal.contextRelevance * ruleWeight) +
        (mlSignal.contextRelevance * mlWeight),
      topicContinuity: ruleSignal.topicContinuity || mlSignal.topicContinuity,
      environmentFit:
        (ruleSignal.environmentFit * ruleWeight) +
        (mlSignal.environmentFit * mlWeight),
      crossTabSynergy: ruleSignal.crossTabSynergy,
    };
  }

  protected extractFeatures(input: AIAnalysisInput): number[] {
    const { currentTab, sessionStats, progress } = input;
    return [
      currentTab === 'memorization' ? 1 : 0,
      currentTab === 'grammar' ? 1 : 0,
      currentTab === 'comprehensive' ? 1 : 0,
      sessionStats.sessionDuration / (1000 * 60 * 60),
      sessionStats.totalAttempts / 50,
      sessionStats.currentAccuracy ||
        (sessionStats.totalAttempts > 0 ?
          sessionStats.correctAnswers / sessionStats.totalAttempts : 0),
      progress ? (progress.memorizationAttempts || 0) / 20 : 0,
      progress ? (progress.grammarAttempts || 0) / 20 : 0,
      new Date().getHours() / 24,
      new Date().getDay() / 7,
    ];
  }

  protected getFeatureDimension(): number { return 10; }
  protected getOutputDimension(): number { return 3; }
}
