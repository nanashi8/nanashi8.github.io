/**
 * 個人パラメータ推定
 *
 * 学習者の個人差（学習速度、忘却速度、定着閾値等）を
 * 復習履歴から推定し、アルゴリズムをパーソナライズする。
 */

export interface PersonalParameters {
  learningSpeed: number; // 学習速度 (0.5-2.0, 1.0が標準)
  forgettingSpeed: number; // 忘却速度 (0.5-2.0, 1.0が標準)
  consolidationThreshold: number; // 定着閾値 (2-5回、標準3回)
  responseTimeProfile: ResponseTimeProfile;
  confidenceLevel: number; // 推定の信頼度 (0-1)
  sampleSize: number; // サンプル数
  lastUpdated: number; // 最終更新時刻
}

export interface ResponseTimeProfile {
  averageResponseTime: number; // 平均応答時間 (ms)
  fastThreshold: number; // 速いと判定する閾値 (ms)
  slowThreshold: number; // 遅いと判定する閾値 (ms)
  consistencyScore: number; // 応答時間の一貫性 (0-1)
}

export interface LearningHistory {
  word: string;
  timestamp: number;
  isCorrect: boolean;
  responseTime: number;
  reviewNumber: number; // 何回目の復習か
  daysSinceFirstSeen: number; // 初見からの経過日数
}

export interface EstimationConfig {
  minSampleSize: number; // 最小サンプル数
  confidenceThreshold: number; // 信頼できると判定する閾値
  learningSpeedWindow: number; // 学習速度を計算する履歴日数
  forgettingSpeedWindow: number; // 忘却速度を計算する履歴日数
}

export const DEFAULT_ESTIMATION_CONFIG: EstimationConfig = {
  minSampleSize: 20,
  confidenceThreshold: 0.7,
  learningSpeedWindow: 7,
  forgettingSpeedWindow: 30,
};

export const DEFAULT_PERSONAL_PARAMETERS: PersonalParameters = {
  learningSpeed: 1.0,
  forgettingSpeed: 1.0,
  consolidationThreshold: 3,
  responseTimeProfile: {
    averageResponseTime: 2000,
    fastThreshold: 1000,
    slowThreshold: 3000,
    consistencyScore: 0.5,
  },
  confidenceLevel: 0,
  sampleSize: 0,
  lastUpdated: Date.now(),
};

/**
 * 個人パラメータ推定エンジン
 */
export class PersonalParameterEstimator {
  private config: EstimationConfig;
  private parameters: PersonalParameters;
  private historyCache: LearningHistory[] = [];

  constructor(config?: Partial<EstimationConfig>) {
    this.config = { ...DEFAULT_ESTIMATION_CONFIG, ...config };
    this.parameters = { ...DEFAULT_PERSONAL_PARAMETERS };
  }

  /**
   * 学習履歴を追加
   */
  addHistory(history: LearningHistory): void {
    this.historyCache.push(history);

    // 古い履歴は削除（直近100件まで保持）
    if (this.historyCache.length > 100) {
      this.historyCache.shift();
    }
  }

  /**
   * パラメータを推定
   */
  estimateParameters(fullHistory?: LearningHistory[]): PersonalParameters {
    const history = fullHistory || this.historyCache;

    if (history.length < this.config.minSampleSize) {
      // サンプル不足の場合はデフォルト値を返す
      this.parameters.sampleSize = history.length;
      this.parameters.confidenceLevel = 0;
      return { ...this.parameters };
    }

    // 学習速度の推定
    this.parameters.learningSpeed = this.estimateLearningSpeed(history);

    // 忘却速度の推定
    this.parameters.forgettingSpeed = this.estimateForgettingSpeed(history);

    // 定着閾値の推定
    this.parameters.consolidationThreshold = this.estimateConsolidationThreshold(history);

    // 応答時間プロファイルの推定
    this.parameters.responseTimeProfile = this.estimateResponseTimeProfile(history);

    // 信頼度の計算
    this.parameters.confidenceLevel = this.calculateConfidenceLevel(history.length);

    // メタデータの更新
    this.parameters.sampleSize = history.length;
    this.parameters.lastUpdated = Date.now();

    return { ...this.parameters };
  }

  /**
   * 現在のパラメータを取得
   */
  getParameters(): PersonalParameters {
    return { ...this.parameters };
  }

  /**
   * パラメータをインポート
   */
  importParameters(params: PersonalParameters): void {
    this.parameters = { ...params };
  }

  /**
   * 履歴をクリア
   */
  clearHistory(): void {
    this.historyCache = [];
  }

  // ========================================
  // プライベートメソッド
  // ========================================

  /**
   * 学習速度の推定
   *
   * 初回正答までの試行回数から推定
   * - 1-2回で正答 → 学習速度が速い (1.5-2.0)
   * - 3-4回で正答 → 標準 (0.9-1.1)
   * - 5回以上 → 遅い (0.5-0.8)
   */
  private estimateLearningSpeed(history: LearningHistory[]): number {
    // 単語ごとに初回正答までの試行回数を計算
    const wordTrials = new Map<string, number>();
    const wordFirstCorrect = new Map<string, number>();

    for (const record of history) {
      const word = record.word;

      if (!wordTrials.has(word)) {
        wordTrials.set(word, 0);
      }

      wordTrials.set(word, wordTrials.get(word)! + 1);

      if (record.isCorrect && !wordFirstCorrect.has(word)) {
        wordFirstCorrect.set(word, wordTrials.get(word)!);
      }
    }

    // 初回正答までの平均試行回数
    const trials = Array.from(wordFirstCorrect.values());
    if (trials.length === 0) {
      return 1.0;
    }

    const averageTrials = trials.reduce((sum, t) => sum + t, 0) / trials.length;

    // 試行回数から学習速度を推定
    if (averageTrials <= 2) {
      return 1.8;
    } else if (averageTrials <= 2.5) {
      return 1.5;
    } else if (averageTrials <= 3.5) {
      return 1.0;
    } else if (averageTrials <= 5) {
      return 0.7;
    } else {
      return 0.5;
    }
  }

  /**
   * 忘却速度の推定
   *
   * 一度正答した単語を再度間違えるまでの期間から推定
   * - 7日以上維持 → 忘却が遅い (0.5-0.7)
   * - 3-7日維持 → 標準 (0.9-1.1)
   * - 3日未満 → 忘却が速い (1.5-2.0)
   */
  private estimateForgettingSpeed(history: LearningHistory[]): number {
    const wordLastCorrect = new Map<string, number>();
    const retentionPeriods: number[] = [];

    for (const record of history) {
      const word = record.word;

      if (record.isCorrect) {
        wordLastCorrect.set(word, record.timestamp);
      } else if (wordLastCorrect.has(word)) {
        // 誤答した場合、前回正答からの期間を記録
        const lastCorrectTime = wordLastCorrect.get(word)!;
        const periodDays = (record.timestamp - lastCorrectTime) / 86400000;
        retentionPeriods.push(periodDays);

        // この単語の正答記録をリセット
        wordLastCorrect.delete(word);
      }
    }

    if (retentionPeriods.length === 0) {
      return 1.0;
    }

    const averagePeriod = retentionPeriods.reduce((sum, p) => sum + p, 0) / retentionPeriods.length;

    // 保持期間から忘却速度を推定
    if (averagePeriod >= 7) {
      return 0.6;
    } else if (averagePeriod >= 5) {
      return 0.8;
    } else if (averagePeriod >= 3) {
      return 1.0;
    } else if (averagePeriod >= 1) {
      return 1.5;
    } else {
      return 2.0;
    }
  }

  /**
   * 定着閾値の推定
   *
   * 安定して正答できるようになるまでの正答回数から推定
   */
  private estimateConsolidationThreshold(history: LearningHistory[]): number {
    const wordConsecutiveCorrect = new Map<string, number>();
    const wordMaxConsecutive = new Map<string, number>();
    const consolidationCounts: number[] = [];

    for (const record of history) {
      const word = record.word;

      if (!wordConsecutiveCorrect.has(word)) {
        wordConsecutiveCorrect.set(word, 0);
        wordMaxConsecutive.set(word, 0);
      }

      if (record.isCorrect) {
        const current = wordConsecutiveCorrect.get(word)! + 1;
        wordConsecutiveCorrect.set(word, current);

        const max = Math.max(wordMaxConsecutive.get(word)!, current);
        wordMaxConsecutive.set(word, max);

        // 連続5回正答で定着とみなす
        if (current === 5) {
          consolidationCounts.push(this.getWordTotalReviews(word, history));
        }
      } else {
        wordConsecutiveCorrect.set(word, 0);
      }
    }

    if (consolidationCounts.length === 0) {
      return 3;
    }

    const averageCount =
      consolidationCounts.reduce((sum, c) => sum + c, 0) / consolidationCounts.length;

    // 定着までの回数から閾値を推定
    return Math.max(2, Math.min(5, Math.round(averageCount * 0.6)));
  }

  /**
   * 応答時間プロファイルの推定
   */
  private estimateResponseTimeProfile(history: LearningHistory[]): ResponseTimeProfile {
    const responseTimes = history.map((h) => h.responseTime);

    if (responseTimes.length === 0) {
      return DEFAULT_PERSONAL_PARAMETERS.responseTimeProfile;
    }

    // 平均応答時間
    const averageResponseTime = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;

    // 標準偏差
    const variance =
      responseTimes.reduce((sum, t) => sum + Math.pow(t - averageResponseTime, 2), 0) /
      responseTimes.length;
    const stdDev = Math.sqrt(variance);

    // 閾値の設定
    const fastThreshold = Math.max(500, averageResponseTime - stdDev);
    const slowThreshold = Math.min(5000, averageResponseTime + stdDev);

    // 一貫性スコア（変動係数の逆数）
    const coefficientOfVariation = stdDev / averageResponseTime;
    const consistencyScore = Math.max(0, Math.min(1, 1 - coefficientOfVariation));

    return {
      averageResponseTime: Math.round(averageResponseTime),
      fastThreshold: Math.round(fastThreshold),
      slowThreshold: Math.round(slowThreshold),
      consistencyScore: Math.round(consistencyScore * 100) / 100,
    };
  }

  /**
   * 信頼度の計算
   */
  private calculateConfidenceLevel(sampleSize: number): number {
    // サンプル数に基づく信頼度
    // 20件未満: 低信頼度
    // 20-50件: 中信頼度
    // 50件以上: 高信頼度

    if (sampleSize < this.config.minSampleSize) {
      return 0;
    } else if (sampleSize < 50) {
      return ((sampleSize - this.config.minSampleSize) / (50 - this.config.minSampleSize)) * 0.7;
    } else if (sampleSize < 100) {
      return 0.7 + ((sampleSize - 50) / 50) * 0.2;
    } else {
      return 0.9 + Math.min(((sampleSize - 100) / 200) * 0.1, 0.1);
    }
  }

  /**
   * 単語の総復習回数を取得
   */
  private getWordTotalReviews(word: string, history: LearningHistory[]): number {
    return history.filter((h) => h.word === word).length;
  }
}

/**
 * パラメータが信頼できるか判定
 */
export function isParameterReliable(params: PersonalParameters): boolean {
  return params.confidenceLevel >= DEFAULT_ESTIMATION_CONFIG.confidenceThreshold;
}

/**
 * パラメータの推奨適用度を計算
 */
export function calculateParameterApplicability(params: PersonalParameters): {
  shouldApply: boolean;
  applicabilityScore: number;
  reason: string;
} {
  if (params.sampleSize < DEFAULT_ESTIMATION_CONFIG.minSampleSize) {
    return {
      shouldApply: false,
      applicabilityScore: 0,
      reason: `サンプル不足（${params.sampleSize}/${DEFAULT_ESTIMATION_CONFIG.minSampleSize}）`,
    };
  }

  if (params.confidenceLevel < DEFAULT_ESTIMATION_CONFIG.confidenceThreshold) {
    return {
      shouldApply: false,
      applicabilityScore: params.confidenceLevel,
      reason: `信頼度が低い（${Math.round(params.confidenceLevel * 100)}%）`,
    };
  }

  // 標準から大きく外れている場合は適用を推奨
  const learningDeviation = Math.abs(params.learningSpeed - 1.0);
  const forgettingDeviation = Math.abs(params.forgettingSpeed - 1.0);
  const thresholdDeviation = Math.abs(params.consolidationThreshold - 3);

  const totalDeviation = learningDeviation + forgettingDeviation + thresholdDeviation / 2;
  const applicabilityScore = Math.min(1.0, params.confidenceLevel * (1 + totalDeviation));

  if (totalDeviation > 0.5) {
    return {
      shouldApply: true,
      applicabilityScore,
      reason: '個人差が顕著です。パラメータ適用を推奨します',
    };
  }

  return {
    shouldApply: true,
    applicabilityScore,
    reason: '標準的な学習パターンです',
  };
}
