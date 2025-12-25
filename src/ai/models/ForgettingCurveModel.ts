/**
 * ForgettingCurveModel - 個別適応型忘却曲線モデル
 *
 * 🔒 内部使用専用: MemoryAI経由でのみアクセス可能
 *
 * @internal
 * @deprecated 直接呼び出しは非推奨。MemoryAI.updateForgettingCurveAfterAnswer()を使用してください。
 *
 * エビングハウスの忘却曲線 + Half-Life Regression を参考にした
 * 個人適応型の記憶保持率予測モデル
 *
 * 【科学的根拠】
 * 1. エビングハウスの忘却曲線（1885）: R(t) = 100% × e^(-t/S)
 * 2. Duolingo Half-Life Regression (2016)
 * 3. ACT-R理論の記憶減衰モデル
 *
 * 【特徴】
 * - 個人ごとの忘却速度を学習
 * - 単語ごとの記憶難易度を反映
 * - 指数関数的減衰モデル（実際の脳の働きに近い）
 *
 * 【Phase 2での責任分離】
 * - MemoryAIを通してのみアクセス
 * - progressStorageからの直接呼び出しは削除済み
 * - 忘却曲線予測の責任をMemoryAIに集約
 */

import type { WordProgress } from '@/storage/progress/types';
import { logger as _logger } from '@/utils/logger';

export interface RetentionPrediction {
  retentionRate: number; // 現在の記憶保持率（0-1）
  halfLife: number; // 記憶半減期（日数）
  optimalReviewTime: number; // 最適な復習時刻（タイムスタンプ）
  forgettingRisk: number; // 忘却リスク（0-100）
  confidence: number; // 予測の信頼度（0-1）
}

export class ForgettingCurveModel {
  /**
   * 記憶保持率を予測（指数関数モデル）
   *
   * R(t) = baseRetention + (1 - baseRetention) × e^(-t × decayRate)
   *
   * @param progress 単語の学習進捗
   * @param currentTime 現在時刻（デフォルト: Date.now()）
   * @returns 記憶保持率予測
   */
  static predictRetention(
    progress: WordProgress,
    currentTime: number = Date.now()
  ): RetentionPrediction {
    // 初回学習の場合
    if (!progress.lastStudied || progress.lastStudied === 0) {
      return {
        retentionRate: 0,
        halfLife: 1,
        optimalReviewTime: currentTime,
        forgettingRisk: 100,
        confidence: 0.5,
      };
    }

    // パラメータ取得（個人適応）
    const params = progress.forgettingCurveParams || this.getDefaultParams();
    const memoryStrength = progress.memoryStrength || 50;

    // 経過時間（日数）
    const timeSinceReview = (currentTime - progress.lastStudied) / (1000 * 60 * 60 * 24);

    // 記憶保持率の計算（指数関数的減衰）
    // R(t) = baseRetention + (1 - baseRetention) × e^(-t × decayRate)
    const exponentialDecay = Math.exp(-timeSinceReview * params.decayRate);
    const retentionRate = params.baseRetention + (1 - params.baseRetention) * exponentialDecay;

    // 記憶強度による補正（学習が進んでいるほど保持率が高い）
    const strengthBonus = (memoryStrength / 100) * 0.2; // 最大+20%
    const adjustedRetention = Math.min(retentionRate + strengthBonus, 1.0);

    // 半減期の計算（50%保持するまでの日数）
    // 0.5 = baseRetention + (1 - baseRetention) × e^(-halfLife × decayRate)
    // halfLife = -ln((0.5 - baseRetention) / (1 - baseRetention)) / decayRate
    const targetRetention = 0.5;
    const halfLife =
      -Math.log((targetRetention - params.baseRetention) / (1 - params.baseRetention)) /
      params.decayRate;

    // 最適復習時刻（記憶保持率が30-40%になる時点）
    const targetReviewRetention = 0.35;
    const optimalDays =
      -Math.log((targetReviewRetention - params.baseRetention) / (1 - params.baseRetention)) /
      params.decayRate;
    const optimalReviewTime = progress.lastStudied + optimalDays * 24 * 60 * 60 * 1000;

    // 忘却リスク（0-100）
    // 保持率が低いほどリスクが高い
    const forgettingRisk = Math.round((1 - adjustedRetention) * 100);

    // 予測の信頼度（学習回数が多いほど高い）
    const attempts = (progress.correctCount || 0) + (progress.incorrectCount || 0);
    const confidence = Math.min(attempts / 10, 1.0); // 10回で最大信頼度

    return {
      retentionRate: adjustedRetention,
      halfLife,
      optimalReviewTime,
      forgettingRisk,
      confidence,
    };
  }

  /**
   * 学習結果に基づいて忘却曲線パラメータを更新（個人適応）
   *
   * @param progress 現在の進捗
   * @param wasCorrect 正解したかどうか
   * @param responseTime 応答時間（ミリ秒）
   * @returns 更新されたパラメータ
   */
  static updateParameters(
    progress: WordProgress,
    wasCorrect: boolean,
    responseTime: number
  ): WordProgress['forgettingCurveParams'] {
    const current = progress.forgettingCurveParams || this.getDefaultParams();
    const updated = { ...current };

    // 学習結果に基づいた適応
    if (wasCorrect) {
      // 正解: 減衰率を下げる（忘れにくくなる）
      updated.decayRate = Math.max(0.05, updated.decayRate * 0.95);

      // 応答が速い場合はさらに強化
      if (responseTime < 3000) {
        updated.baseRetention = Math.min(0.9, updated.baseRetention + 0.02);
      }
    } else {
      // 不正解: 減衰率を上げる（忘れやすい）
      updated.decayRate = Math.min(0.5, updated.decayRate * 1.1);
      updated.baseRetention = Math.max(0.2, updated.baseRetention - 0.02);
    }

    return updated;
  }

  /**
   * 記憶強度を更新（学習による強化）
   *
   * @param currentStrength 現在の記憶強度
   * @param wasCorrect 正解したかどうか
   * @param consecutiveCorrect 連続正解回数
   * @returns 更新された記憶強度
   */
  static updateMemoryStrength(
    currentStrength: number = 50,
    wasCorrect: boolean,
    consecutiveCorrect: number = 0
  ): number {
    let newStrength = currentStrength;

    if (wasCorrect) {
      // 正解: 記憶強度を増加
      const increment = 5 + Math.min(consecutiveCorrect * 2, 15); // 最大+20
      newStrength = Math.min(100, currentStrength + increment);
    } else {
      // 不正解: 記憶強度を減少
      newStrength = Math.max(0, currentStrength - 15);
    }

    return newStrength;
  }

  /**
   * デフォルトパラメータ（平均的な学習者）
   */
  private static getDefaultParams(): NonNullable<WordProgress['forgettingCurveParams']> {
    return {
      decayRate: 0.3, // 標準的な減衰率
      recoveryRate: 1.0, // 標準的な回復率
      baseRetention: 0.5, // 標準的な基礎保持率（50%）
    };
  }

  /**
   * 学習履歴から個人パラメータを推定（将来の拡張）
   *
   * @param history 学習履歴
   * @returns 推定されたパラメータ
   */
  static estimatePersonalParameters(
    history: Array<{ timestamp: number; wasCorrect: boolean; responseTime: number }>
  ): NonNullable<WordProgress['forgettingCurveParams']> {
    if (history.length < 3) {
      return this.getDefaultParams();
    }

    // 正答率の計算
    const correctCount = history.filter((h) => h.wasCorrect).length;
    const accuracy = correctCount / history.length;

    // 平均応答速度
    const avgResponseTime =
      history.reduce((sum, h) => sum + h.responseTime, 0) / history.length;

    // パラメータの推定
    const params = this.getDefaultParams();

    // 正答率が高い → 基礎保持率が高い、減衰率が低い
    params.baseRetention = 0.3 + accuracy * 0.4; // 0.3-0.7
    params.decayRate = 0.5 - accuracy * 0.3; // 0.2-0.5

    // 応答速度が速い → 学習速度が速い
    if (avgResponseTime < 3000) {
      params.baseRetention = Math.min(0.9, params.baseRetention + 0.1);
      params.decayRate = Math.max(0.1, params.decayRate - 0.05);
    }

    return params;
  }

  /**
   * 忘却曲線の可視化データを生成（デバッグ・分析用）
   *
   * @param progress 単語の学習進捗
   * @param days 予測する日数
   * @returns 日数ごとの保持率データ
   */
  static generateCurveData(
    progress: WordProgress,
    days: number = 30
  ): Array<{ day: number; retention: number }> {
    const data: Array<{ day: number; retention: number }> = [];
    const baseTime = progress.lastStudied || Date.now();

    for (let day = 0; day <= days; day++) {
      const futureTime = baseTime + day * 24 * 60 * 60 * 1000;
      const prediction = this.predictRetention(progress, futureTime);
      data.push({
        day,
        retention: Math.round(prediction.retentionRate * 100) / 100,
      });
    }

    return data;
  }
}
