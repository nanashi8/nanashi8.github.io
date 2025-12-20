/**
 * 💤 CognitiveLoadAI - 認知負荷AI
 *
 * 責任:
 * - 学習者の認知負荷レベル推定
 * - 疲労度評価
 * - 休憩推奨判定
 * - 難易度調整提案
 *
 * Phase 1のデバッグログ機能を統合
 */

import type {
  SpecialistAI,
  CognitiveLoadSignal,
  CognitiveLoadLevel,
  AIAnalysisInput,
  SessionStats,
} from '../types';

export class CognitiveLoadAI implements SpecialistAI<CognitiveLoadSignal> {
  readonly id = 'cognitiveLoad';
  readonly name = 'Cognitive Load AI';
  readonly icon = '💤';

  /**
   * 認知負荷分析を実行
   */
  analyze(input: AIAnalysisInput): CognitiveLoadSignal {
    const { sessionStats } = input;

    const loadLevel = this.determineLoadLevel(sessionStats);
    const fatigueScore = this.calculateFatigueScore(sessionStats);
    const recommendedBreak = this.shouldRecommendBreak(loadLevel, fatigueScore, sessionStats);
    const difficultyAdjustment = this.calculateDifficultyAdjustment(loadLevel, sessionStats);

    return {
      aiId: 'cognitiveLoad',
      confidence: this.calculateConfidence(sessionStats),
      timestamp: Date.now(),
      loadLevel,
      fatigueScore,
      recommendedBreak,
      difficultyAdjustment,
    };
  }

  /**
   * 認知負荷レベルの判定
   */
  private determineLoadLevel(stats: SessionStats): CognitiveLoadLevel {
    const totalAttempts = stats.totalAttempts;
    const correctRate = totalAttempts > 0 ? stats.correctAnswers / totalAttempts : 1;
    const consecutiveIncorrect = stats.consecutiveIncorrect;

    // 過負荷判定
    if (consecutiveIncorrect >= 5) return 'overload';
    if (correctRate < 0.3 && totalAttempts >= 10) return 'overload';

    // 高負荷判定
    if (consecutiveIncorrect >= 3) return 'high';
    if (correctRate < 0.5 && totalAttempts >= 5) return 'high';

    // 中負荷判定
    if (correctRate < 0.7) return 'medium';

    // 低負荷
    return 'low';
  }

  /**
   * 疲労スコア計算 (0-1)
   */
  private calculateFatigueScore(stats: SessionStats): number {
    const sessionMinutes = stats.sessionDuration / (1000 * 60);
    const totalAttempts = stats.totalAttempts;
    const avgResponseTime = stats.avgResponseTime || 0;

    let fatigueScore = 0;

    // セッション時間による疲労
    if (sessionMinutes > 45) {
      fatigueScore += 0.5;
    } else if (sessionMinutes > 30) {
      fatigueScore += 0.3;
    } else if (sessionMinutes > 15) {
      fatigueScore += 0.1;
    }

    // 試行回数による疲労
    if (totalAttempts > 50) {
      fatigueScore += 0.3;
    } else if (totalAttempts > 30) {
      fatigueScore += 0.2;
    }

    // 平均応答時間の増加による疲労（基準: 3秒）
    if (avgResponseTime > 5000) {
      fatigueScore += 0.2;
    } else if (avgResponseTime > 4000) {
      fatigueScore += 0.1;
    }

    return Math.min(fatigueScore, 1);
  }

  /**
   * 休憩推奨判定
   */
  private shouldRecommendBreak(
    loadLevel: CognitiveLoadLevel,
    fatigueScore: number,
    stats: SessionStats
  ): boolean {
    // 過負荷状態では必ず休憩推奨
    if (loadLevel === 'overload') return true;

    // 疲労度が高い場合
    if (fatigueScore >= 0.7) return true;

    // 連続不正解が多い場合
    if (stats.consecutiveIncorrect >= 4) return true;

    // 長時間セッション（45分以上）
    const sessionMinutes = stats.sessionDuration / (1000 * 60);
    if (sessionMinutes >= 45) return true;

    return false;
  }

  /**
   * 難易度調整の計算 (-0.2 ~ +0.2)
   */
  private calculateDifficultyAdjustment(
    loadLevel: CognitiveLoadLevel,
    stats: SessionStats
  ): number {
    const totalAttempts = stats.totalAttempts;
    const correctRate = totalAttempts > 0 ? stats.correctAnswers / totalAttempts : 0.5;

    // 過負荷: 難易度を大幅に下げる
    if (loadLevel === 'overload') {
      return -0.2;
    }

    // 高負荷: 難易度を下げる
    if (loadLevel === 'high') {
      return -0.15;
    }

    // 低負荷かつ高正答率: 難易度を上げる
    if (loadLevel === 'low' && correctRate >= 0.85 && totalAttempts >= 10) {
      return 0.15;
    }

    // 低負荷: 難易度を少し上げる
    if (loadLevel === 'low' && correctRate >= 0.75) {
      return 0.1;
    }

    // 適切な負荷レベル
    return 0;
  }

  /**
   * シグナルの信頼度計算
   */
  private calculateConfidence(stats: SessionStats): number {
    const totalAttempts = stats.totalAttempts;
    const sessionMinutes = stats.sessionDuration / (1000 * 60);

    // 試行回数とセッション時間が多いほど信頼度が高い
    let confidence = 0.3; // ベース信頼度

    if (totalAttempts >= 20) confidence += 0.3;
    else if (totalAttempts >= 10) confidence += 0.2;
    else if (totalAttempts >= 5) confidence += 0.1;

    if (sessionMinutes >= 15) confidence += 0.3;
    else if (sessionMinutes >= 5) confidence += 0.2;
    else if (sessionMinutes >= 2) confidence += 0.1;

    return Math.min(confidence, 1);
  }

  /**
   * シグナルの妥当性検証
   */
  validateSignal(signal: CognitiveLoadSignal): boolean {
    if (!signal.aiId || signal.aiId !== 'cognitiveLoad') return false;
    if (signal.confidence < 0 || signal.confidence > 1) return false;
    if (signal.fatigueScore < 0 || signal.fatigueScore > 1) return false;
    if (signal.difficultyAdjustment < -0.2 || signal.difficultyAdjustment > 0.2) return false;

    const validLoadLevels: CognitiveLoadLevel[] = ['low', 'medium', 'high', 'overload'];
    if (!validLoadLevels.includes(signal.loadLevel)) return false;

    return true;
  }

  /**
   * デバッグログ出力（Phase 1で実装した機能）
   */
  logAnalysis(signal: CognitiveLoadSignal, stats: SessionStats): void {
    if (process.env.NODE_ENV !== 'development') return;

    console.log(`${this.icon} ${this.name} Analysis:`);
    console.log(`  Load Level: ${signal.loadLevel}`);
    console.log(`  Fatigue Score: ${(signal.fatigueScore * 100).toFixed(1)}%`);
    console.log(`  Recommended Break: ${signal.recommendedBreak ? 'YES' : 'NO'}`);
    console.log(
      `  Difficulty Adjustment: ${signal.difficultyAdjustment > 0 ? '+' : ''}${(signal.difficultyAdjustment * 100).toFixed(1)}%`
    );
    console.log(
      `  Session: ${stats.totalAttempts} attempts, ${(stats.sessionDuration / 60000).toFixed(1)} minutes`
    );
    console.log(`  Consecutive Incorrect: ${stats.consecutiveIncorrect}`);
  }

  /**
   * 認知負荷を下げるための推奨アクション
   */
  getRecommendedActions(signal: CognitiveLoadSignal): string[] {
    const actions: string[] = [];

    if (signal.loadLevel === 'overload') {
      actions.push('5-10分の休憩を取りましょう');
      actions.push('簡単な問題から再開しましょう');
      actions.push('水分補給をしましょう');
    } else if (signal.loadLevel === 'high') {
      actions.push('2-3分の小休憩を取りましょう');
      actions.push('少し簡単な問題に切り替えます');
    } else if (signal.recommendedBreak) {
      actions.push('よく頑張りました！少し休憩しましょう');
    }

    if (signal.fatigueScore >= 0.7) {
      actions.push('集中力が低下しています。リフレッシュしましょう');
    }

    return actions;
  }

  /**
   * フロー状態（最適な学習状態）の判定
   */
  isInFlowState(signal: CognitiveLoadSignal, stats: SessionStats): boolean {
    // フロー状態の条件:
    // - 中程度の負荷
    // - 適度な正答率（60-80%）
    // - 低い疲労度
    // - 適度なセッション時間

    if (signal.loadLevel !== 'medium' && signal.loadLevel !== 'low') return false;
    if (signal.fatigueScore > 0.5) return false;

    const correctRate = stats.totalAttempts > 0 ? stats.correctAnswers / stats.totalAttempts : 0;
    if (correctRate < 0.6 || correctRate > 0.85) return false;

    const sessionMinutes = stats.sessionDuration / (1000 * 60);
    if (sessionMinutes < 5 || sessionMinutes > 45) return false;

    return true;
  }
}
