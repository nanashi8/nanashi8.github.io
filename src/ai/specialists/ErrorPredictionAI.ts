/**
 * 🔮 ErrorPredictionAI - 誤答予測AI（Phase 4.5強化版 + ML統合）
 *
 * 責任:
 * - 誤答パターンの分析
 * - 弱点分野の特定
 * - 混同しやすい語句ペアの検出
 * - 予防的復習の推奨
 *
 * Phase 4.5 ML統合:
 * - TensorFlow.jsによる高度な誤答予測
 * - ハイブリッドAI（ルールベース + ML）
 * - 個人の誤答パターン学習
 */

import type { ErrorPredictionSignal, AIAnalysisInput, StorageWordProgress } from '../types';
import { MLEnhancedSpecialistAI } from '../ml/MLEnhancedSpecialistAI';

export class ErrorPredictionAI extends MLEnhancedSpecialistAI<ErrorPredictionSignal> {
  readonly id = 'errorPrediction';
  readonly name = 'Error Prediction AI';
  readonly icon = '🔮';

  /**
   * Position提案（統合レイヤー用）
   *
   * 誤答予測AIの立場: 誤答パターンからPositionを提案
   * - 正答率が低い → Position高（誤答リスク高）
   * - 試行回数が多いのに習得できていない → Position高
   */
  proposePosition(progress: StorageWordProgress, accuracy: number, attempts: number): number {
    // === 誤答リスク評価 ===
    // 正答率が低い = 誤答の可能性が高い
    const errorRisk = (1 - accuracy) * 40; // 最大+40点

    // === 習得困難度 ===
    // 試行回数が多いのに正答率が低い = 習得が困難
    const difficultyFactor = attempts > 5 && accuracy < 0.5 ? 20 : 0;

    // === 基準Position ===
    const basePosition = 50;

    // === 最終提案 ===
    const proposedPosition = basePosition + errorRisk + difficultyFactor;

    return Math.max(0, Math.min(100, proposedPosition));
  }

  /**
   * ルールベース分析（Phase 4.5新機能）
   *
   * 従来のルールベース分析を移行
   */
  protected analyzeByRules(input: AIAnalysisInput): ErrorPredictionSignal {
    const { word, progress, allProgress } = input;

    const weaknessAreas = this.identifyWeaknessAreas(progress, allProgress);
    const confusionPairs = this.findConfusionPairs(word, allProgress);
    const preemptiveReview = this.recommendPreemptiveReview(word, allProgress);
    const patternConfidence = this.calculatePatternConfidence(progress);

    return {
      aiId: 'errorPrediction',
      confidence: this.calculateConfidence(progress),
      timestamp: Date.now(),
      weaknessAreas,
      confusionPairs,
      preemptiveReview,
      patternConfidence,
    };
  }

  /**
   * 弱点分野の特定
   */
  private identifyWeaknessAreas(
    progress: WordProgress | null,
    allProgress: Record<string, WordProgress>
  ): string[] {
    const weaknessAreas: string[] = [];
    const grammarErrorCounts: Record<string, number> = {};

    // 全語句の誤答履歴から文法項目を集計
    Object.values(allProgress).forEach((p) => {
      p.errorHistory?.forEach((error) => {
        if (error.grammarPoint) {
          grammarErrorCounts[error.grammarPoint] =
            (grammarErrorCounts[error.grammarPoint] || 0) + 1;
        }
      });
    });

    // 3回以上誤答がある文法項目を弱点として認定
    Object.entries(grammarErrorCounts).forEach(([grammar, count]) => {
      if (count >= 3) {
        weaknessAreas.push(grammar);
      }
    });

    return weaknessAreas;
  }

  /**
   * 混同ペアの検出
   */
  private findConfusionPairs(
    word: string,
    allProgress: Record<string, WordProgress>
  ): [string, string][] {
    const confusionPairs: [string, string][] = [];

    // この語句の誤答履歴を取得
    const wordProgress = allProgress[word];
    if (!wordProgress?.errorHistory) return [];

    // 誤答パターンを分析
    const errorPatterns: Record<string, number> = {};
    wordProgress.errorHistory.forEach((error) => {
      if (error.userAnswer) {
        errorPatterns[error.userAnswer] = (errorPatterns[error.userAnswer] || 0) + 1;
      }
    });

    // 2回以上同じ誤答をしている場合は混同ペア
    Object.entries(errorPatterns).forEach(([wrongAnswer, count]) => {
      if (count >= 2) {
        confusionPairs.push([word, wrongAnswer]);
      }
    });

    return confusionPairs;
  }

  /**
   * 予防的復習の推奨
   */
  private recommendPreemptiveReview(
    word: string,
    allProgress: Record<string, WordProgress>
  ): string[] {
    const recommendations: string[] = [];

    // 類似語句を探索（実装は簡易版）
    // 実際にはIPA、意味、形態的類似性を考慮
    Object.keys(allProgress).forEach((w) => {
      if (w === word) return;

      // 先頭3文字が同じなら類似語句とみなす（簡易実装）
      if (w.substring(0, 3) === word.substring(0, 3)) {
        const progress = allProgress[w];
        const attempts = progress.memorizationAttempts || 0;
        const correct = progress.memorizationCorrect || 0;
        const accuracy = attempts > 0 ? correct / attempts : 0;

        // 正答率が低い類似語句は予防的復習推奨
        if (accuracy < 0.6 && attempts >= 2) {
          recommendations.push(w);
        }
      }
    });

    return recommendations.slice(0, 5); // 最大5語
  }

  /**
   * パターン信頼度の計算
   */
  private calculatePatternConfidence(progress: WordProgress | null): number {
    if (!progress?.errorHistory) return 0;

    const errorCount = progress.errorHistory.length;

    // 誤答履歴が多いほど信頼度が高い
    if (errorCount >= 5) return 0.9;
    if (errorCount >= 3) return 0.7;
    if (errorCount >= 2) return 0.5;
    if (errorCount >= 1) return 0.3;
    return 0.1;
  }

  private calculateConfidence(progress: WordProgress | null): number {
    const errorCount = progress?.errorHistory?.length || 0;
    const attempts = progress?.memorizationAttempts || 0;

    // 試行回数と誤答履歴の量で信頼度を計算
    const baseConfidence = Math.min(attempts / 10, 0.5);
    const errorConfidence = Math.min(errorCount / 5, 0.5);

    return baseConfidence + errorConfidence;
  }

  validateSignal(signal: ErrorPredictionSignal): boolean {
    if (!signal.aiId || signal.aiId !== 'errorPrediction') return false;
    if (signal.confidence < 0 || signal.confidence > 1) return false;
    if (signal.patternConfidence < 0 || signal.patternConfidence > 1) return false;
    if (!Array.isArray(signal.weaknessAreas)) return false;
    if (!Array.isArray(signal.confusionPairs)) return false;
    if (!Array.isArray(signal.preemptiveReview)) return false;

    return true;
  }

  // ========================================
  // Phase 4.5: ML統合メソッド
  // ========================================

  /**
   * ML分析（Phase 4.5新機能）
   *
   * TensorFlow.jsによる誤答確率の高度な予測
   * MLは予測タスクが得意なため、高いML重み付け（最大80%）を使用
   */
  protected async analyzeByML(input: AIAnalysisInput): Promise<ErrorPredictionSignal> {
    const features = this.extractFeatures(input);
    const prediction = await this.predict(features);

    // ML予測結果から各指標を生成
    const errorProbability = prediction.values[0]; // 誤答確率 (0-1)
    const weaknessLevel = prediction.values[1]; // 弱点度 (0-1)
    const confusionScore = prediction.values[2]; // 混同スコア (0-1)

    return {
      aiId: 'errorPrediction',
      confidence: prediction.confidence,
      timestamp: Date.now(),

      // ML予測ベースでルールベースの結果を推測
      weaknessAreas: weaknessLevel > 0.7 ? ['predicted_weakness'] : [],
      confusionPairs: confusionScore > 0.7 ? [['predicted', 'confusion']] : [],
      preemptiveReview: errorProbability > 0.6 ? ['predicted_review'] : [],
      patternConfidence: prediction.confidence,

      // ML拡張フィールド
      errorProbability,
      weaknessLevel,
      confusionScore,
    };
  }

  /**
   * シグナル統合（ルール + ML）
   *
   * ErrorPredictionはMLが特に得意な分野（予測タスク）
   * データ量が十分あれば、ML重みを80%まで上げる
   */
  protected mergeSignals(
    ruleSignal: ErrorPredictionSignal,
    mlSignal: ErrorPredictionSignal,
    input: AIAnalysisInput
  ): ErrorPredictionSignal {
    const errorCount = input.progress?.errorHistory?.length || 0;
    const attempts = input.progress?.memorizationAttempts || 0;
    const dataCount = errorCount + attempts;

    // ErrorPredictionは予測タスクなのでMLを優先
    // データが20件を超えたらML重み80%、50件を超えたら90%
    let mlWeight = Math.min(Math.max((dataCount - 10) / 15, 0), 0.8);
    if (dataCount > 50) {
      mlWeight = 0.9;
    }
    const ruleWeight = 1 - mlWeight;

    // ルールベースの具体的な情報を保持しつつ、信頼度をMLで補強
    return {
      aiId: 'errorPrediction',
      confidence: (ruleSignal.confidence * ruleWeight) + (mlSignal.confidence * mlWeight),
      timestamp: Date.now(),

      // ルールベースの詳細情報を優先（具体性が高い）
      weaknessAreas: ruleSignal.weaknessAreas,
      confusionPairs: ruleSignal.confusionPairs,
      preemptiveReview: ruleSignal.preemptiveReview,

      patternConfidence:
        (ruleSignal.patternConfidence * ruleWeight) +
        (mlSignal.patternConfidence * mlWeight),

      // ML拡張フィールド
      errorProbability: mlSignal.errorProbability,
      weaknessLevel: mlSignal.weaknessLevel,
      confusionScore: mlSignal.confusionScore,
    };
  }

  /**
   * 特徴量抽出（ML用）
   *
   * 誤答予測に重要な20次元の特徴量
   */
  protected extractFeatures(input: AIAnalysisInput): number[] {
    const { word, progress, allProgress, sessionStats } = input;

    if (!progress) {
      return Array(20).fill(0);
    }

    // 全体の統計を計算
    const totalWords = Object.keys(allProgress).length;
    const errorHistoryLength = progress.errorHistory?.length || 0;
    const attempts = progress.memorizationAttempts || 0;
    const correctCount = progress.memorizationCorrect || 0;
    const accuracy = attempts > 0 ? correctCount / attempts : 0;

    return [
      // 1-4: 単語特性
      word.word.length / 15,
      word.meaning.split(',').length / 5,
      word.ipa ? 1 : 0,
      word.katakana ? 1 : 0,

      // 5-10: 誤答履歴
      errorHistoryLength / 10,
      (progress.consecutiveIncorrect || 0) / 5,
      attempts > 0 ? (1 - accuracy) : 0.5, // 誤答率
      0, // wrongAnswerPatternsは実装されていないため0
      progress.lastErrorType === 'spelling' ? 1 : 0,
      progress.lastErrorType === 'meaning' ? 1 : 0,

      // 11-14: 学習履歴
      attempts / 20,
      (progress.consecutiveCorrect || 0) / 10,
      this.getDaysSinceLastStudy(progress) / 30,
      (progress.memorizationStreak || 0) / 10,

      // 15-17: 複数モードでの習得度
      (progress.translationAttempts || 0) / 20,
      (progress.spellingAttempts || 0) / 20,
      (progress.grammarAttempts || 0) / 20,

      // 18-20: セッションコンテキスト
      sessionStats.questionsAnswered || sessionStats.totalAttempts / 50,
      sessionStats.currentAccuracy ||
        (sessionStats.totalAttempts > 0 ?
          sessionStats.correctAnswers / sessionStats.totalAttempts : 0),
      (sessionStats.averageResponseTime || sessionStats.avgResponseTime || 0) / 10000,
    ];
  }

  /**
   * 前回学習からの経過日数計算
   */
  private getDaysSinceLastStudy(progress: WordProgress): number {
    const lastStudied = progress.lastStudied || 0;
    if (lastStudied === 0) return 0;

    const timeSince = Date.now() - lastStudied;
    return timeSince / (1000 * 60 * 60 * 24);
  }

  /**
   * 特徴量の次元数
   */
  protected getFeatureDimension(): number {
    return 20;
  }

  /**
   * 出力の次元数
   */
  protected getOutputDimension(): number {
    return 3; // errorProbability, weaknessLevel, confusionScore
  }
}
