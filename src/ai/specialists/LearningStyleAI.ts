/**
 * 🎯 LearningStyleAI - 学習スタイルAI（Phase 4.5強化版 + ML統合）
 *
 * 責任:
 * - 学習者の学習スタイル推定
 * - 最適なセッション長の提案
 * - 好みの難易度設定の判定
 * - モチベーションタイプの分析
 *
 * Phase 4.5 ML統合:
 * - TensorFlow.jsによる個人の学習パターン学習
 * - ハイブリッドAI（ルールベース + ML）
 * - 個別最適化された学習提案
 */

import type {
  LearningStyleSignal,
  LearningStyle,
  DifficultyPreference,
  MotivationType,
  AIAnalysisInput,
  StorageWordProgress,
} from '../types';
import { MLEnhancedSpecialistAI } from '../ml/MLEnhancedSpecialistAI';

export class LearningStyleAI extends MLEnhancedSpecialistAI<LearningStyleSignal> {
  readonly id = 'learningStyle';
  readonly name = 'Learning Style AI';
  readonly icon = '🎯';

  /**
   * Position提案（統合レイヤー用）
   *
   * 学習スタイルAIの立場: 学習パターンからPositionを提案
   * - 試行回数が少ない → Position中立（まだ判断できない）
   * - 試行回数が多く正答率が低い → Position高（学習スタイルに合っていない）
   */
  proposePosition(progress: StorageWordProgress, accuracy: number, attempts: number): number {
    // === 学習効率評価 ===
    // 試行回数が多いのに習得できていない = 学習方法が合っていない
    const inefficiency = attempts > 10 && accuracy < 0.6 ? 25 : 0;

    // === 基準Position ===
    const basePosition = 50;

    // === 最終提案 ===
    const proposedPosition = basePosition + inefficiency;

    return Math.max(0, Math.min(100, proposedPosition));
  }

  /**
   * ルールベース分析（Phase 4.5新機能）
   */
  protected analyzeByRules(input: AIAnalysisInput): LearningStyleSignal {
    const { progress, allProgress, sessionStats } = input;

    const styleProfile = this.determineStyleProfile(progress, allProgress);
    const optimalSessionLength = this.calculateOptimalSessionLength(allProgress, sessionStats);
    const preferredDifficulty = this.inferDifficultyPreference(allProgress, sessionStats);
    const motivationType = this.inferMotivationType(allProgress);

    return {
      aiId: 'learningStyle',
      confidence: this.calculateConfidence(allProgress),
      timestamp: Date.now(),
      styleProfile,
      optimalSessionLength,
      preferredDifficulty,
      motivationType,
    };
  }

  /**
   * 学習スタイルプロファイルの判定
   */
  private determineStyleProfile(
    progress: StorageWordProgress | null,
    allProgress: Record<string, StorageWordProgress>
  ): LearningStyle {
    // 簡易実装: 問題形式の選好から推定
    // 実際にはIPA利用頻度、視覚/聴覚コンテンツの利用状況などを分析

    const preferredTypes: Record<string, number> = {};

    Object.values(allProgress).forEach((p) => {
      (p as any).preferredQuestionTypes?.forEach((type: string) => {
        preferredTypes[type] = (preferredTypes[type] || 0) + 1;
      });
    });

    // 最も多い問題形式を取得
    const topType = Object.entries(preferredTypes).sort((a, b) => b[1] - a[1])[0]?.[0];

    // 問題形式から学習スタイルを推定
    if (topType?.includes('audio') || topType?.includes('pronunciation')) {
      return 'auditory';
    }
    if (topType?.includes('image') || topType?.includes('visual')) {
      return 'visual';
    }
    if (topType?.includes('writing') || topType?.includes('typing')) {
      return 'kinesthetic';
    }

    return 'reading'; // デフォルト
  }

  /**
   * 最適セッション長の計算
   */
  private calculateOptimalSessionLength(
    allProgress: Record<string, StorageWordProgress>,
    _sessionStats: any
  ): number {
    // 過去の学習時間パターンから最適な長さを推定
    const allStudyTimes: number[] = [];

    Object.values(allProgress).forEach((p) => {
      const studyTimePatterns = (p as any).studyTimePatterns as number[] | undefined;
      if (studyTimePatterns) {
        allStudyTimes.push(...studyTimePatterns);
      }
    });

    if (allStudyTimes.length === 0) return 20; // デフォルト20分

    // セッション間の時間差を計算
    allStudyTimes.sort((a, b) => a - b);
    const sessionLengths: number[] = [];

    for (let i = 1; i < allStudyTimes.length; i++) {
      const diff = allStudyTimes[i] - allStudyTimes[i - 1];
      const minutes = diff / (1000 * 60);

      // 5分以上60分以内のセッションを有効とみなす
      if (minutes >= 5 && minutes <= 60) {
        sessionLengths.push(minutes);
      }
    }

    if (sessionLengths.length === 0) return 20;

    // 中央値を取得
    sessionLengths.sort((a, b) => a - b);
    const median = sessionLengths[Math.floor(sessionLengths.length / 2)];

    return Math.round(median);
  }

  /**
   * 難易度設定の推定
   */
  private inferDifficultyPreference(
    _allProgress: Record<string, StorageWordProgress>,
    sessionStats: any
  ): DifficultyPreference {
    const totalAttempts = sessionStats.totalAttempts;
    const correctRate = totalAttempts > 0 ? sessionStats.correctAnswers / totalAttempts : 0.5;

    // 高正答率かつ試行回数が多い → challenge好き
    if (correctRate >= 0.8 && totalAttempts >= 20) {
      return 'challenge';
    }

    // 低正答率 → gradual（段階的）を好む
    if (correctRate < 0.6) {
      return 'gradual';
    }

    return 'mixed'; // デフォルト
  }

  /**
   * モチベーションタイプの推定
   */
  private inferMotivationType(allProgress: Record<string, StorageWordProgress>): MotivationType {
    // 簡易実装: 学習パターンから推定
    // 実際には達成度、競争スコア、SNS共有頻度などを分析

    const totalWords = Object.keys(allProgress).length;
    const masteredWords = Object.values(allProgress).filter((p) => {
      const streak = p.memorizationStreak || 0;
      return streak >= 3;
    }).length;

    const masteryRate = totalWords > 0 ? masteredWords / totalWords : 0;

    // 高い習熟率 → mastery志向
    if (masteryRate >= 0.7) {
      return 'mastery';
    }

    // 中程度 → performance志向
    if (masteryRate >= 0.4) {
      return 'performance';
    }

    return 'social'; // デフォルト
  }

  private calculateConfidence(allProgress: Record<string, StorageWordProgress>): number {
    const totalWords = Object.keys(allProgress).length;
    const totalAttempts = Object.values(allProgress).reduce(
      (sum, p) => sum + (p.memorizationAttempts || 0),
      0
    );

    // 語句数と試行回数が多いほど信頼度が高い
    let confidence = 0.3;

    if (totalWords >= 50) confidence += 0.3;
    else if (totalWords >= 20) confidence += 0.2;
    else if (totalWords >= 10) confidence += 0.1;

    if (totalAttempts >= 100) confidence += 0.4;
    else if (totalAttempts >= 50) confidence += 0.2;
    else if (totalAttempts >= 20) confidence += 0.1;

    return Math.min(confidence, 1);
  }

  validateSignal(signal: LearningStyleSignal): boolean {
    if (!signal.aiId || signal.aiId !== 'learningStyle') return false;
    if (signal.confidence < 0 || signal.confidence > 1) return false;
    if (signal.optimalSessionLength < 5 || signal.optimalSessionLength > 120) return false;

    const validStyles: LearningStyle[] = ['visual', 'auditory', 'kinesthetic', 'reading'];
    if (!validStyles.includes(signal.styleProfile)) return false;

    const validDifficulties: DifficultyPreference[] = ['gradual', 'challenge', 'mixed'];
    if (!validDifficulties.includes(signal.preferredDifficulty)) return false;

    const validMotivations: MotivationType[] = ['mastery', 'performance', 'social'];
    if (!validMotivations.includes(signal.motivationType)) return false;

    return true;
  }

  // ========================================
  // Phase 4.5: ML統合メソッド
  // ========================================

  protected async analyzeByML(input: AIAnalysisInput): Promise<LearningStyleSignal> {
    const features = this.extractFeatures(input);
    const prediction = await this.predict(features);

    const styleValue = prediction.values[0];
    let styleProfile: LearningStyle;
    if (styleValue < 0.25) styleProfile = 'visual';
    else if (styleValue < 0.5) styleProfile = 'auditory';
    else if (styleValue < 0.75) styleProfile = 'kinesthetic';
    else styleProfile = 'reading';

    const optimalSessionLength = Math.round(prediction.values[1] * 60 + 10);

    const diffValue = prediction.values[2];
    let preferredDifficulty: DifficultyPreference;
    if (diffValue < 0.33) preferredDifficulty = 'gradual';
    else if (diffValue < 0.67) preferredDifficulty = 'mixed';
    else preferredDifficulty = 'challenge';

    const motivValue = prediction.values[3];
    let motivationType: MotivationType;
    if (motivValue < 0.33) motivationType = 'mastery';
    else if (motivValue < 0.67) motivationType = 'performance';
    else motivationType = 'social';

    return {
      aiId: 'learningStyle',
      confidence: prediction.confidence,
      timestamp: Date.now(),
      styleProfile,
      optimalSessionLength,
      preferredDifficulty,
      motivationType,
    };
  }

  protected mergeSignals(
    ruleSignal: LearningStyleSignal,
    mlSignal: LearningStyleSignal,
    input: AIAnalysisInput
  ): LearningStyleSignal {
    const totalWords = Object.keys(input.allProgress).length;
    const mlWeight = Math.min(Math.max((totalWords - 20) / 50, 0), 0.6);
    const ruleWeight = 1 - mlWeight;

    return {
      aiId: 'learningStyle',
      confidence: (ruleSignal.confidence * ruleWeight) + (mlSignal.confidence * mlWeight),
      timestamp: Date.now(),
      styleProfile: totalWords > 50 ? mlSignal.styleProfile : ruleSignal.styleProfile,
      optimalSessionLength: Math.round(
        (ruleSignal.optimalSessionLength * ruleWeight) +
        (mlSignal.optimalSessionLength * mlWeight)
      ),
      preferredDifficulty: totalWords > 50 ? mlSignal.preferredDifficulty : ruleSignal.preferredDifficulty,
      motivationType: totalWords > 50 ? mlSignal.motivationType : ruleSignal.motivationType,
    };
  }

  protected extractFeatures(input: AIAnalysisInput): number[] {
    const { sessionStats, allProgress } = input;
    const totalWords = Object.keys(allProgress).length;
    const totalAttempts = Object.values(allProgress).reduce(
      (sum, p) => sum + (p.memorizationAttempts || 0), 0
    );

    return [
      sessionStats.sessionDuration / (1000 * 60 * 60),
      sessionStats.totalAttempts / 50,
      sessionStats.currentAccuracy ||
        (sessionStats.totalAttempts > 0 ?
          sessionStats.correctAnswers / sessionStats.totalAttempts : 0),
      sessionStats.consecutiveCorrect || 0,
      totalWords / 100,
      totalAttempts / 200,
      sessionStats.questionsAnswered || sessionStats.totalAttempts / 50,
      (sessionStats.averageResponseTime || sessionStats.avgResponseTime || 0) / 10000,
      new Date().getHours() / 24,
      new Date().getDay() / 7,
    ];
  }

  protected getFeatureDimension(): number { return 10; }
  protected getOutputDimension(): number { return 4; }
}
