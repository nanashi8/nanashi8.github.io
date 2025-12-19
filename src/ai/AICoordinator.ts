/**
 * 🤖 AICoordinator - AI統合調整役
 *
 * 責任:
 * - 7つの専門AIシグナルの収集
 * - シグナルの統合と優先度計算
 * - 緊急フラグの判定
 * - 推奨アクションの生成
 */

import type {
  AICoordinationResult,
  AIAnalysisInput,
  CoordinatorConfig,
} from './types';

import { DEFAULT_COORDINATOR_CONFIG } from './types';

import { MemoryAI } from './specialists/MemoryAI';
import { CognitiveLoadAI } from './specialists/CognitiveLoadAI';
import { ErrorPredictionAI } from './specialists/ErrorPredictionAI';
import { LearningStyleAI } from './specialists/LearningStyleAI';
import { LinguisticAI } from './specialists/LinguisticAI';
import { ContextualAI } from './specialists/ContextualAI';
import { GamificationAI } from './specialists/GamificationAI';

export class AICoordinator {
  private memoryAI: MemoryAI;
  private cognitiveLoadAI: CognitiveLoadAI;
  private errorPredictionAI: ErrorPredictionAI;
  private learningStyleAI: LearningStyleAI;
  private linguisticAI: LinguisticAI;
  private contextualAI: ContextualAI;
  private gamificationAI: GamificationAI;

  private config: CoordinatorConfig;

  constructor(config: Partial<CoordinatorConfig> = {}) {
    // 7つの専門AIインスタンス化
    this.memoryAI = new MemoryAI();
    this.cognitiveLoadAI = new CognitiveLoadAI();
    this.errorPredictionAI = new ErrorPredictionAI();
    this.learningStyleAI = new LearningStyleAI();
    this.linguisticAI = new LinguisticAI();
    this.contextualAI = new ContextualAI();
    this.gamificationAI = new GamificationAI();

    // 設定をマージ
    this.config = {
      ...DEFAULT_COORDINATOR_CONFIG,
      ...config,
      weights: {
        ...DEFAULT_COORDINATOR_CONFIG.weights,
        ...(config.weights || {}),
      },
      emergencyThresholds: {
        ...DEFAULT_COORDINATOR_CONFIG.emergencyThresholds,
        ...(config.emergencyThresholds || {}),
      },
    };
  }

  /**
   * すべてのAIを実行してシグナルを統合
   */
  async analyzeAndCoordinate(
    input: AIAnalysisInput,
    basePriority: number
  ): Promise<AICoordinationResult> {
    // 7つのAIを並列実行
    const [
      memorySignal,
      cognitiveLoadSignal,
      errorPredictionSignal,
      learningStyleSignal,
      linguisticSignal,
      contextualSignal,
      gamificationSignal,
    ] = await Promise.all([
      Promise.resolve(this.memoryAI.analyze(input)),
      Promise.resolve(this.cognitiveLoadAI.analyze(input)),
      Promise.resolve(this.errorPredictionAI.analyze(input)),
      Promise.resolve(this.learningStyleAI.analyze(input)),
      Promise.resolve(this.linguisticAI.analyze(input)),
      Promise.resolve(this.contextualAI.analyze(input)),
      Promise.resolve(this.gamificationAI.analyze(input)),
    ]);

    // シグナルの妥当性検証
    if (!this.memoryAI.validateSignal(memorySignal)) {
      console.warn('❌ Invalid MemorySignal');
    }
    if (!this.cognitiveLoadAI.validateSignal(cognitiveLoadSignal)) {
      console.warn('❌ Invalid CognitiveLoadSignal');
    }

    // 緊急フラグの判定
    const urgentFlag = this.checkEmergencyConditions(
      memorySignal,
      cognitiveLoadSignal,
      input.sessionStats
    );

    // 優先度の統合計算
    const finalPriority = this.calculateFinalPriority(
      basePriority,
      memorySignal,
      cognitiveLoadSignal,
      errorPredictionSignal,
      learningStyleSignal,
      linguisticSignal,
      contextualSignal,
      gamificationSignal
    );

    // 推奨アクションの生成
    const recommendedAction = this.generateRecommendedAction(
      memorySignal,
      cognitiveLoadSignal,
      gamificationSignal
    );

    // デバッグ情報の生成
    const debug = this.config.debugMode
      ? this.generateDebugInfo(
          basePriority,
          finalPriority,
          memorySignal,
          cognitiveLoadSignal,
          errorPredictionSignal
        )
      : undefined;

    return {
      finalPriority: urgentFlag ? 0.1 : finalPriority,
      signals: {
        memory: memorySignal,
        cognitiveLoad: cognitiveLoadSignal,
        errorPrediction: errorPredictionSignal,
        learningStyle: learningStyleSignal,
        linguistic: linguisticSignal,
        contextual: contextualSignal,
        gamification: gamificationSignal,
      },
      urgentFlag,
      recommendedAction,
      debug,
    };
  }

  /**
   * 緊急条件のチェック
   */
  private checkEmergencyConditions(
    memorySignal: any,
    cognitiveLoadSignal: any,
    sessionStats: any
  ): boolean {
    // 忘却リスクが閾値を超える
    if (
      memorySignal.forgettingRisk >= this.config.emergencyThresholds.forgettingRisk
    ) {
      return true;
    }

    // 認知負荷が過負荷状態
    if (
      this.config.emergencyThresholds.cognitiveOverload &&
      cognitiveLoadSignal.loadLevel === 'overload'
    ) {
      return true;
    }

    // 連続不正解が閾値を超える
    if (
      sessionStats.consecutiveIncorrect >= this.config.emergencyThresholds.consecutiveErrors
    ) {
      return true;
    }

    return false;
  }

  /**
   * 最終優先度の計算
   */
  private calculateFinalPriority(
    basePriority: number,
    memorySignal: any,
    cognitiveLoadSignal: any,
    errorPredictionSignal: any,
    learningStyleSignal: any,
    linguisticSignal: any,
    contextualSignal: any,
    gamificationSignal: any
  ): number {
    let priority = basePriority;

    // 記憶AI: 時間ブースト適用
    priority *= 1 - memorySignal.timeBoost * this.config.weights.memory;

    // 認知負荷AI: 難易度調整
    priority *= 1 + cognitiveLoadSignal.difficultyAdjustment * this.config.weights.cognitiveLoad;

    // 誤答予測AI: 弱点優先
    if (errorPredictionSignal.weaknessAreas.length > 0) {
      priority *= 1 - errorPredictionSignal.patternConfidence * 0.3 * this.config.weights.errorPrediction;
    }

    // 学習スタイルAI: スタイル適合度（簡易実装）
    // 実際には学習スタイルに応じて優先度を調整

    // 言語学的AI: 固有難易度を考慮
    priority *= 1 + linguisticSignal.inherentDifficulty * 0.2 * this.config.weights.linguistic;

    // 文脈的AI: 文脈関連性
    priority *= 1 - (contextualSignal.contextRelevance - 0.5) * 0.3 * this.config.weights.contextual;

    // ゲーミフィケーションAI: モチベーション調整
    if (gamificationSignal.motivationLevel < 0.3) {
      // モチベーション低下時は簡単な問題を優先
      priority *= 1 - 0.2 * this.config.weights.gamification;
    }

    return Math.max(0.1, Math.min(priority, 10));
  }

  /**
   * 推奨アクションの生成
   */
  private generateRecommendedAction(
    memorySignal: any,
    cognitiveLoadSignal: any,
    gamificationSignal: any
  ): string | undefined {
    // 休憩推奨
    if (cognitiveLoadSignal.recommendedBreak) {
      return '休憩を取りましょう。5-10分のリフレッシュが効果的です。';
    }

    // 報酬付与
    if (gamificationSignal.rewardTiming) {
      return `🎉 ${gamificationSignal.socialFeedback}`;
    }

    // 忘却リスク高
    if (memorySignal.forgettingRisk >= 100) {
      return '復習が必要です。記憶が薄れる前に確認しましょう。';
    }

    return undefined;
  }

  /**
   * デバッグ情報の生成
   */
  private generateDebugInfo(
    basePriority: number,
    finalPriority: number,
    memorySignal: any,
    cognitiveLoadSignal: any,
    errorPredictionSignal: any
  ): any {
    const adjustments: Record<string, number> = {
      timeBoost: -memorySignal.timeBoost * this.config.weights.memory,
      difficultyAdjustment:
        cognitiveLoadSignal.difficultyAdjustment * this.config.weights.cognitiveLoad,
      weaknessPenalty:
        errorPredictionSignal.weaknessAreas.length > 0
          ? -errorPredictionSignal.patternConfidence * 0.3 * this.config.weights.errorPrediction
          : 0,
    };

    const reasoning = `
      Base Priority: ${basePriority.toFixed(2)}
      Time Boost: ${(adjustments.timeBoost * 100).toFixed(1)}%
      Difficulty Adjustment: ${(adjustments.difficultyAdjustment * 100).toFixed(1)}%
      Weakness Penalty: ${(adjustments.weaknessPenalty * 100).toFixed(1)}%
      Final Priority: ${finalPriority.toFixed(2)}
    `.trim();

    return {
      basePriority,
      adjustments,
      reasoning,
    };
  }

  /**
   * デバッグログ出力
   */
  logCoordinationResult(result: AICoordinationResult): void {
    if (!this.config.debugMode) return;

    console.group('🤖 AI Coordination Result');
    console.log(`Final Priority: ${result.finalPriority.toFixed(2)}`);
    console.log(`Urgent Flag: ${result.urgentFlag ? 'YES ⚠️' : 'NO'}`);

    if (result.signals.memory) {
      console.log(
        `${this.memoryAI.icon} Memory: forgettingRisk=${result.signals.memory.forgettingRisk.toFixed(0)}, timeBoost=${(result.signals.memory.timeBoost * 100).toFixed(0)}%`
      );
    }

    if (result.signals.cognitiveLoad) {
      console.log(
        `${this.cognitiveLoadAI.icon} CognitiveLoad: level=${result.signals.cognitiveLoad.loadLevel}, fatigue=${(result.signals.cognitiveLoad.fatigueScore * 100).toFixed(0)}%`
      );
    }

    if (result.recommendedAction) {
      console.log(`💡 Action: ${result.recommendedAction}`);
    }

    if (result.debug) {
      console.log('Debug Info:', result.debug.reasoning);
    }

    console.groupEnd();
  }

  /**
   * 設定の更新
   */
  updateConfig(config: Partial<CoordinatorConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      weights: {
        ...this.config.weights,
        ...(config.weights || {}),
      },
      emergencyThresholds: {
        ...this.config.emergencyThresholds,
        ...(config.emergencyThresholds || {}),
      },
    };
  }

  /**
   * 現在の設定を取得
   */
  getConfig(): CoordinatorConfig {
    return { ...this.config };
  }
}
