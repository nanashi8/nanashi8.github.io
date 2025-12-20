/**
 * 🎮 GamificationAI - ゲーミフィケーションAI
 *
 * 責任:
 * - モチベーションレベルの評価
 * - 報酬付与タイミングの判定
 * - チャレンジレベルの設定
 * - SNS共有推奨の生成
 */

import type {
  SpecialistAI,
  GamificationSignal,
  ChallengeLevel,
  AIAnalysisInput,
  WordProgress,
} from '../types';

export class GamificationAI implements SpecialistAI<GamificationSignal> {
  readonly id = 'gamification';
  readonly name = 'Gamification AI';
  readonly icon = '🎮';

  analyze(input: AIAnalysisInput): GamificationSignal {
    const { allProgress, sessionStats } = input;

    const motivationLevel = this.calculateMotivationLevel(allProgress, sessionStats);
    const rewardTiming = this.shouldTriggerReward(allProgress, sessionStats);
    const challengeLevel = this.determineChallengeLevel(sessionStats);
    const socialFeedback = this.generateSocialFeedback(allProgress, sessionStats);

    return {
      aiId: 'gamification',
      confidence: this.calculateConfidence(allProgress),
      timestamp: Date.now(),
      motivationLevel,
      rewardTiming,
      challengeLevel,
      socialFeedback,
    };
  }

  /**
   * モチベーションレベルの計算
   */
  private calculateMotivationLevel(
    allProgress: Record<string, WordProgress>,
    sessionStats: any
  ): number {
    let motivation = 0.5; // ベースライン

    // 正答率が高い → モチベーション上昇
    const correctRate =
      sessionStats.totalAttempts > 0
        ? sessionStats.correctAnswers / sessionStats.totalAttempts
        : 0.5;

    if (correctRate >= 0.8) motivation += 0.3;
    else if (correctRate >= 0.6) motivation += 0.2;
    else if (correctRate >= 0.4) motivation += 0.1;
    else motivation -= 0.2; // 低正答率はモチベーション低下

    // 連続正解 → モチベーション上昇
    if (sessionStats.consecutiveIncorrect === 0 && sessionStats.totalAttempts >= 5) {
      motivation += 0.2;
    }

    // 習得語句数 → モチベーション上昇
    const masteredCount = sessionStats.masteredCount || 0;
    const totalWords = Object.keys(allProgress).length;
    const masteryRate = totalWords > 0 ? masteredCount / totalWords : 0;

    if (masteryRate >= 0.7) motivation += 0.2;
    else if (masteryRate >= 0.5) motivation += 0.1;

    // セッション時間 → 長時間学習はモチベーション低下の兆候
    const sessionMinutes = sessionStats.sessionDuration / (1000 * 60);
    if (sessionMinutes > 45) motivation -= 0.2;
    else if (sessionMinutes > 30) motivation -= 0.1;

    return Math.max(0, Math.min(motivation, 1));
  }

  /**
   * 報酬付与タイミングの判定
   */
  private shouldTriggerReward(
    allProgress: Record<string, WordProgress>,
    sessionStats: any
  ): boolean {
    // マイルストーン達成時
    const masteredCount = sessionStats.masteredCount || 0;
    if (masteredCount > 0 && masteredCount % 10 === 0) return true;

    // 高正答率達成時
    const correctRate =
      sessionStats.totalAttempts > 0 ? sessionStats.correctAnswers / sessionStats.totalAttempts : 0;
    if (correctRate >= 0.9 && sessionStats.totalAttempts >= 10) return true;

    // 連続学習日数（実装は簡易版）
    const studyDates = new Set<string>();
    Object.values(allProgress).forEach((p) => {
      if (p.lastStudied) {
        const date = new Date(p.lastStudied).toDateString();
        studyDates.add(date);
      }
    });

    if (studyDates.size >= 7) return true; // 7日連続

    return false;
  }

  /**
   * チャレンジレベルの決定
   */
  private determineChallengeLevel(sessionStats: any): ChallengeLevel {
    const correctRate =
      sessionStats.totalAttempts > 0
        ? sessionStats.correctAnswers / sessionStats.totalAttempts
        : 0.5;

    // 高正答率 → ハードチャレンジ
    if (correctRate >= 0.85) return 'hard';

    // 中正答率 → ミディアムチャレンジ
    if (correctRate >= 0.6) return 'medium';

    // 低正答率 → イージーチャレンジ
    return 'easy';
  }

  /**
   * SNS共有メッセージの生成
   */
  private generateSocialFeedback(
    allProgress: Record<string, WordProgress>,
    sessionStats: any
  ): string {
    const masteredCount = sessionStats.masteredCount || 0;
    const totalAttempts = sessionStats.totalAttempts;
    const correctRate = totalAttempts > 0 ? sessionStats.correctAnswers / totalAttempts : 0;

    // マイルストーン達成
    if (masteredCount >= 100) {
      return `🎉 100語以上マスター！英語学習を続けています！ #英語学習 #継続は力なり`;
    }
    if (masteredCount >= 50) {
      return `🌟 50語マスター達成！着実に成長中！ #英語学習 #目標達成`;
    }
    if (masteredCount >= 10) {
      return `📚 10語マスター！コツコツ頑張っています！ #英語学習 #初心者`;
    }

    // 高正答率
    if (correctRate >= 0.9 && totalAttempts >= 10) {
      return `💯 正答率90%以上！調子がいいです！ #英語学習 #好調`;
    }

    // 連続学習
    const studyDays = this.calculateStudyDays(allProgress);
    if (studyDays >= 30) {
      return `🔥 30日連続学習達成！継続は力なり！ #英語学習 #習慣化`;
    }
    if (studyDays >= 7) {
      return `✨ 1週間連続学習！習慣化できています！ #英語学習 #継続中`;
    }

    return ''; // 共有推奨なし
  }

  /**
   * 学習日数の計算
   */
  private calculateStudyDays(allProgress: Record<string, WordProgress>): number {
    const studyDates = new Set<string>();

    Object.values(allProgress).forEach((p) => {
      if (p.lastStudied) {
        const date = new Date(p.lastStudied).toDateString();
        studyDates.add(date);
      }
    });

    return studyDates.size;
  }

  private calculateConfidence(allProgress: Record<string, WordProgress>): number {
    const totalWords = Object.keys(allProgress).length;
    const studyDays = this.calculateStudyDays(allProgress);

    // 語句数と学習日数で信頼度を計算
    let confidence = 0.3;

    if (totalWords >= 50) confidence += 0.3;
    else if (totalWords >= 20) confidence += 0.2;

    if (studyDays >= 7) confidence += 0.4;
    else if (studyDays >= 3) confidence += 0.2;

    return Math.min(confidence, 1);
  }

  validateSignal(signal: GamificationSignal): boolean {
    if (!signal.aiId || signal.aiId !== 'gamification') return false;
    if (signal.confidence < 0 || signal.confidence > 1) return false;
    if (signal.motivationLevel < 0 || signal.motivationLevel > 1) return false;
    if (typeof signal.rewardTiming !== 'boolean') return false;
    if (typeof signal.socialFeedback !== 'string') return false;

    const validLevels: ChallengeLevel[] = ['easy', 'medium', 'hard'];
    if (!validLevels.includes(signal.challengeLevel)) return false;

    return true;
  }
}
