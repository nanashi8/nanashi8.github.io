/**
 * 🎯 LearningStyleAI - 学習スタイルAI
 *
 * 責任:
 * - 学習者の学習スタイル推定
 * - 最適なセッション長の提案
 * - 好みの難易度設定の判定
 * - モチベーションタイプの分析
 */

import type {
  SpecialistAI,
  LearningStyleSignal,
  LearningStyle,
  DifficultyPreference,
  MotivationType,
  AIAnalysisInput,
  WordProgress,
} from '../types';

export class LearningStyleAI implements SpecialistAI<LearningStyleSignal> {
  readonly id = 'learningStyle';
  readonly name = 'Learning Style AI';
  readonly icon = '🎯';

  analyze(input: AIAnalysisInput): LearningStyleSignal {
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
    progress: WordProgress | null,
    allProgress: Record<string, WordProgress>
  ): LearningStyle {
    // 簡易実装: 問題形式の選好から推定
    // 実際にはIPA利用頻度、視覚/聴覚コンテンツの利用状況などを分析

    const preferredTypes: Record<string, number> = {};

    Object.values(allProgress).forEach((p) => {
      p.preferredQuestionTypes?.forEach((type) => {
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
    allProgress: Record<string, WordProgress>,
    _sessionStats: any
  ): number {
    // 過去の学習時間パターンから最適な長さを推定
    const allStudyTimes: number[] = [];

    Object.values(allProgress).forEach((p) => {
      if (p.studyTimePatterns) {
        allStudyTimes.push(...p.studyTimePatterns);
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
    allProgress: Record<string, WordProgress>,
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
  private inferMotivationType(allProgress: Record<string, WordProgress>): MotivationType {
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

  private calculateConfidence(allProgress: Record<string, WordProgress>): number {
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
}
