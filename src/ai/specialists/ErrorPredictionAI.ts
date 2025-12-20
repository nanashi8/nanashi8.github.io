/**
 * 🔮 ErrorPredictionAI - 誤答予測AI
 *
 * 責任:
 * - 誤答パターンの分析
 * - 弱点分野の特定
 * - 混同しやすい語句ペアの検出
 * - 予防的復習の推奨
 */

import type { SpecialistAI, ErrorPredictionSignal, AIAnalysisInput, WordProgress } from '../types';

export class ErrorPredictionAI implements SpecialistAI<ErrorPredictionSignal> {
  readonly id = 'errorPrediction';
  readonly name = 'Error Prediction AI';
  readonly icon = '🔮';

  analyze(input: AIAnalysisInput): ErrorPredictionSignal {
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
}
