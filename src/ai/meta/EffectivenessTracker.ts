/**
 * EffectivenessTracker - 効果測定器
 *
 * 各戦略の効果を測定し、統計データを管理する
 */

import {
  StrategyType,
  StrategyEffectiveness,
  LearningOutcome,
  NetworkConfig,
  EffectivenessMeasurement,
  EffectivenessReport,
  StrategyComparison,
} from './types';

interface Logger {
  debug(message: string, context?: any): void;
  info(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  error(message: string, context?: any): void;
}

const logger: Logger = {
  debug: (message, context) => {
    if (import.meta.env.DEV) {
      console.debug(`[EffectivenessTracker] ${message}`, context);
    }
  },
  info: (message, context) => console.info(`[EffectivenessTracker] ${message}`, context),
  warn: (message, context) => console.warn(`[EffectivenessTracker] ${message}`, context),
  error: (message, context) => console.error(`[EffectivenessTracker] ${message}`, context),
};

const STORAGE_KEY = 'adaptive_network_effectiveness';

/**
 * EffectivenessTracker
 *
 * 各学習戦略の効果を追跡・測定する
 */
export class EffectivenessTracker {
  private effectiveness: Map<StrategyType, StrategyEffectiveness> = new Map();
  private measurements: EffectivenessMeasurement[] = [];
  private config: NetworkConfig;
  private saveTimer: NodeJS.Timeout | null = null;

  constructor(config: NetworkConfig) {
    this.config = config;
  }

  /**
   * 初期化（履歴データをロード）
   */
  async initialize(): Promise<void> {
    logger.info('EffectivenessTracker initializing...');
    await this.loadHistory();
    logger.info('EffectivenessTracker initialized', {
      strategies: this.effectiveness.size,
      measurements: this.measurements.length,
    });
  }

  /**
   * 結果を記録
   *
   * @param strategy 使用された戦略
   * @param outcome 学習結果
   */
  recordOutcome(strategy: StrategyType, outcome: LearningOutcome): void {
    try {
      // 検証
      if (!Object.values(StrategyType).includes(strategy)) {
        throw new Error(`Invalid strategy: ${strategy}`);
      }

      if (typeof outcome.success !== 'boolean') {
        throw new Error('Outcome.success must be boolean');
      }

      // 効果データ取得または作成
      let effectiveness = this.effectiveness.get(strategy);
      if (!effectiveness) {
        effectiveness = this.createDefaultEffectiveness(strategy);
        this.effectiveness.set(strategy, effectiveness);
      }

      // カウント更新
      effectiveness.totalUses++;
      if (outcome.success) {
        effectiveness.successCount++;
      } else {
        effectiveness.failureCount++;
      }

      // 成功率計算
      effectiveness.successRate = effectiveness.successCount / effectiveness.totalUses;

      // 最終使用時刻更新
      effectiveness.lastUsed = outcome.timestamp;

      // 平均値更新
      if (outcome.timeToMastery !== undefined) {
        this.updateAverage(effectiveness, 'averageTimeToMastery', outcome.timeToMastery);
      }

      if (outcome.retentionRate !== undefined) {
        this.updateAverage(effectiveness, 'averageRetentionRate', outcome.retentionRate);
      }

      // 信頼度更新
      effectiveness.confidence = this.calculateConfidence(effectiveness.totalUses);

      // 測定記録を追加
      this.measurements.push({
        strategy,
        outcome,
        timestamp: Date.now(),
      });

      // 測定記録数を制限
      const windowSize = this.config.effectivenessWindowSize ?? 50;
      if (this.measurements.length > windowSize * 2) {
        this.measurements = this.measurements.slice(-windowSize);
      }

      logger.debug('Outcome recorded', {
        strategy,
        success: outcome.success,
        totalUses: effectiveness.totalUses,
        successRate: effectiveness.successRate,
      });

      // 保存（デバウンス付き）
      this.debounceSave();
    } catch (error) {
      logger.error('Failed to record outcome', { strategy, outcome, error });
    }
  }

  /**
   * 特定戦略の効果を取得
   *
   * @param strategy 戦略タイプ
   * @returns 効果測定データ（存在しない場合はundefined）
   */
  getEffectiveness(strategy: StrategyType): StrategyEffectiveness | undefined {
    return this.effectiveness.get(strategy);
  }

  /**
   * すべての戦略の効果を取得
   *
   * @returns 効果測定データのマップ
   */
  getAllEffectiveness(): Map<StrategyType, StrategyEffectiveness> {
    return new Map(this.effectiveness);
  }

  /**
   * 2つの戦略を比較
   *
   * @param strategy1 戦略1
   * @param strategy2 戦略2
   * @returns 比較結果
   */
  compareStrategies(strategy1: StrategyType, strategy2: StrategyType): StrategyComparison {
    const eff1 = this.effectiveness.get(strategy1);
    const eff2 = this.effectiveness.get(strategy2);

    // データがない場合
    if (!eff1 || !eff2) {
      return {
        strategy1,
        strategy2,
        betterStrategy: null,
        successRateDiff: 0,
        confidenceLevel: 0,
        recommendation: 'データ不足のため比較できません',
      };
    }

    // 成功率の差
    const successRateDiff = eff1.successRate - eff2.successRate;

    // 統計的有意性を計算（フィッシャーの正確確率検定の簡易版）
    const confidenceLevel = this.calculateStatisticalSignificance(eff1, eff2);

    // より良い戦略を判定
    let betterStrategy: StrategyType | null = null;
    if (Math.abs(successRateDiff) > 0.05 && confidenceLevel > 0.8) {
      betterStrategy = successRateDiff > 0 ? strategy1 : strategy2;
    }

    // 推奨メッセージ
    let recommendation = '';
    if (betterStrategy) {
      recommendation = `${betterStrategy}の方が効果的です（差: ${(Math.abs(successRateDiff) * 100).toFixed(1)}%）`;
    } else if (confidenceLevel < 0.8) {
      recommendation = 'より多くのデータが必要です';
    } else {
      recommendation = '両戦略の効果は同程度です';
    }

    return {
      strategy1,
      strategy2,
      betterStrategy,
      successRateDiff,
      confidenceLevel,
      recommendation,
    };
  }

  /**
   * 効果測定レポートをエクスポート
   *
   * @returns レポートオブジェクト
   */
  exportMetrics(): EffectivenessReport {
    const strategies = Array.from(this.effectiveness.values());

    // 成功率でソート
    const topPerformers = strategies
      .filter((s) => s.totalUses >= 10) // 最低10回の使用
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 3)
      .map((s) => ({
        strategy: s.strategyType,
        successRate: s.successRate,
        uses: s.totalUses,
      }));

    // 推奨事項を生成
    const recommendations: string[] = [];

    // 高パフォーマンス戦略
    if (topPerformers.length > 0) {
      recommendations.push(
        `最も効果的な戦略: ${topPerformers[0].strategy}（成功率: ${(topPerformers[0].successRate * 100).toFixed(1)}%）`
      );
    }

    // 低パフォーマンス戦略
    const lowPerformers = strategies
      .filter((s) => s.totalUses >= 10 && s.successRate < 0.5)
      .map((s) => s.strategyType);

    if (lowPerformers.length > 0) {
      recommendations.push(`改善が必要な戦略: ${lowPerformers.join(', ')}`);
    }

    // データ不足の戦略
    const insufficientData = strategies.filter((s) => s.totalUses < 10);
    if (insufficientData.length > 0) {
      recommendations.push(`より多くのデータが必要: ${insufficientData.length}個の戦略`);
    }

    return {
      topPerformers,
      recommendations,
      timestamp: Date.now(),
    };
  }

  /**
   * データをリセット
   */
  reset(): void {
    logger.info('Resetting effectiveness data');
    this.effectiveness.clear();
    this.measurements = [];
    this.saveToStorage();
  }

  // ================== プライベートメソッド ==================

  /**
   * デフォルトの効果測定データを作成
   */
  private createDefaultEffectiveness(strategy: StrategyType): StrategyEffectiveness {
    return {
      strategyType: strategy,
      totalUses: 0,
      successCount: 0,
      failureCount: 0,
      successRate: 0,
      averageTimeToMastery: 0,
      averageRetentionRate: 0,
      lastUsed: 0,
      confidence: 0,
    };
  }

  /**
   * 平均値を更新
   */
  private updateAverage(
    effectiveness: StrategyEffectiveness,
    field: 'averageTimeToMastery' | 'averageRetentionRate',
    newValue: number
  ): void {
    const currentAverage = effectiveness[field];
    const n = effectiveness.totalUses;

    // 移動平均: new_avg = (old_avg * (n-1) + new_value) / n
    effectiveness[field] = (currentAverage * (n - 1) + newValue) / n;
  }

  /**
   * 信頼度を計算（ベイズ的手法）
   */
  private calculateConfidence(totalUses: number): number {
    // ベイズ的信頼度: サンプル数が多いほど高い
    const alpha = 2; // 事前分布のパラメータ
    const beta = 2;
    return Math.min(1, totalUses / (totalUses + alpha + beta));
  }

  /**
   * 統計的有意性を計算
   */
  private calculateStatisticalSignificance(
    eff1: StrategyEffectiveness,
    eff2: StrategyEffectiveness
  ): number {
    // 簡易版: サンプルサイズと効果量から信頼度を計算
    const n1 = eff1.totalUses;
    const n2 = eff2.totalUses;
    const effectSize = Math.abs(eff1.successRate - eff2.successRate);

    // サンプルサイズが大きく、効果量も大きければ信頼度が高い
    const sampleScore = Math.min(1, (n1 + n2) / 100); // 100サンプルで最大
    const effectScore = effectSize; // 効果量そのまま

    return (sampleScore + effectScore) / 2;
  }

  /**
   * LocalStorageから履歴をロード
   */
  private async loadHistory(): Promise<void> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        logger.info('No stored effectiveness data found');
        return;
      }

      const data = JSON.parse(stored);

      // 効果測定データを復元
      if (data.strategies) {
        data.strategies.forEach((eff: StrategyEffectiveness) => {
          this.effectiveness.set(eff.strategyType, eff);
        });
      }

      // 測定記録を復元
      if (Array.isArray(data.measurements)) {
        this.measurements = data.measurements;
      }

      logger.info('Effectiveness data loaded', {
        strategies: this.effectiveness.size,
        measurements: this.measurements.length,
      });
    } catch (error) {
      logger.error('Failed to load effectiveness data', error);
      // エラーの場合は空のデータから開始
    }
  }

  /**
   * LocalStorageに保存
   */
  private saveToStorage(): void {
    try {
      const data = {
        version: '1.0.0',
        strategies: Array.from(this.effectiveness.values()),
        measurements: this.measurements,
        lastUpdated: Date.now(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      logger.debug('Effectiveness data saved');
    } catch (error) {
      logger.warn('Failed to save effectiveness data', error);
    }
  }

  /**
   * デバウンスして保存
   */
  private debounceSave(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    this.saveTimer = setTimeout(() => {
      this.saveToStorage();
      this.saveTimer = null;
    }, 500); // 500ms後に保存
  }
}
