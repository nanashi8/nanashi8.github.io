/**
 * Calibration Metrics Library
 *
 * AIモデルの予測精度を測定するためのメトリクス
 *
 * ECE (Expected Calibration Error):
 * - 予測確率と実際の正解率の乖離を測定
 * - 値が小さいほど良い（0が理想）
 * - 0.1以下なら良好、0.05以下なら優秀
 *
 * MAE (Mean Absolute Error):
 * - 予測値と実測値の平均絶対誤差
 * - 値が小さいほど良い（0が理想）
 * - パーセント単位で解釈（例: 15 = 平均15%の誤差）
 */

export interface Prediction {
  /** 予測した確率（0-1） */
  predicted: number;
  /** 実際の結果（0=不正解、1=正解） */
  actual: number;
  /** 予測対象（デバッグ用） */
  word?: string;
  /** タイムスタンプ */
  timestamp?: number;
}

export interface CalibrationResult {
  /** ECE（Expected Calibration Error） */
  ece: number;
  /** MAE（Mean Absolute Error） */
  mae: number;
  /** 予測数 */
  count: number;
  /** ビンごとの詳細（ECE計算用） */
  bins: CalibrationBin[];
  /** 全体的な正解率 */
  overallAccuracy: number;
  /** 平均予測確率 */
  averagePrediction: number;
}

export interface CalibrationBin {
  /** ビンの範囲（例: [0.0, 0.1]） */
  range: [number, number];
  /** ビンの中央値（例: 0.05） */
  midpoint: number;
  /** ビン内の予測数 */
  count: number;
  /** ビン内の平均予測確率 */
  averagePrediction: number;
  /** ビン内の実際の正解率 */
  actualAccuracy: number;
  /** ビンの重み（全体に占める割合） */
  weight: number;
  /** ビンのキャリブレーションエラー */
  error: number;
}

/**
 * ECE（Expected Calibration Error）を計算
 *
 * 予測確率をN個のビンに分割し、各ビン内での
 * 平均予測確率と実際の正解率の差を重み付き平均
 *
 * @param predictions - 予測結果の配列
 * @param numBins - ビン数（デフォルト: 10）
 * @returns ECE値（0-1、小さいほど良い）
 */
export function calculateECE(predictions: Prediction[], numBins: number = 10): number {
  if (predictions.length === 0) return 0;

  const bins = createBins(predictions, numBins);

  // 各ビンの重み付きエラーを合計
  const ece = bins.reduce((sum, bin) => {
    return sum + bin.weight * bin.error;
  }, 0);

  return ece;
}

/**
 * MAE（Mean Absolute Error）を計算
 *
 * 予測確率と実際の結果（0 or 1）の絶対差の平均
 *
 * @param predictions - 予測結果の配列
 * @returns MAE値（0-100のパーセント、小さいほど良い）
 */
export function calculateMAE(predictions: Prediction[]): number {
  if (predictions.length === 0) return 0;

  const sumAbsError = predictions.reduce((sum, pred) => {
    return sum + Math.abs(pred.predicted - pred.actual);
  }, 0);

  // パーセント表記に変換（0-100）
  return (sumAbsError / predictions.length) * 100;
}

/**
 * 包括的なキャリブレーション分析を実行
 *
 * @param predictions - 予測結果の配列
 * @param numBins - ビン数（デフォルト: 10）
 * @returns キャリブレーション結果
 */
export function analyzeCalibration(
  predictions: Prediction[],
  numBins: number = 10
): CalibrationResult {
  if (predictions.length === 0) {
    return {
      ece: 0,
      mae: 0,
      count: 0,
      bins: [],
      overallAccuracy: 0,
      averagePrediction: 0,
    };
  }

  const bins = createBins(predictions, numBins);
  const ece = bins.reduce((sum, bin) => sum + bin.weight * bin.error, 0);
  const mae = calculateMAE(predictions);

  const totalCorrect = predictions.filter((p) => p.actual === 1).length;
  const overallAccuracy = totalCorrect / predictions.length;

  const totalPredicted = predictions.reduce((sum, p) => sum + p.predicted, 0);
  const averagePrediction = totalPredicted / predictions.length;

  return {
    ece,
    mae,
    count: predictions.length,
    bins,
    overallAccuracy,
    averagePrediction,
  };
}

/**
 * 予測をビンに分割
 *
 * @param predictions - 予測結果の配列
 * @param numBins - ビン数
 * @returns ビンの配列
 */
function createBins(predictions: Prediction[], numBins: number): CalibrationBin[] {
  const binSize = 1.0 / numBins;
  const bins: CalibrationBin[] = [];

  // 各ビンを初期化
  for (let i = 0; i < numBins; i++) {
    const lowerBound = i * binSize;
    const upperBound = (i + 1) * binSize;

    // このビンに属する予測をフィルタリング
    const binPredictions = predictions.filter((p) => {
      if (i === numBins - 1) {
        // 最後のビンは上限を含む
        return p.predicted >= lowerBound && p.predicted <= upperBound;
      } else {
        return p.predicted >= lowerBound && p.predicted < upperBound;
      }
    });

    if (binPredictions.length === 0) {
      // 空のビン
      bins.push({
        range: [lowerBound, upperBound],
        midpoint: (lowerBound + upperBound) / 2,
        count: 0,
        averagePrediction: 0,
        actualAccuracy: 0,
        weight: 0,
        error: 0,
      });
      continue;
    }

    // ビン内の統計を計算
    const count = binPredictions.length;
    const weight = count / predictions.length;

    const sumPredicted = binPredictions.reduce((sum, p) => sum + p.predicted, 0);
    const averagePrediction = sumPredicted / count;

    const correctCount = binPredictions.filter((p) => p.actual === 1).length;
    const actualAccuracy = correctCount / count;

    const error = Math.abs(averagePrediction - actualAccuracy);

    bins.push({
      range: [lowerBound, upperBound],
      midpoint: (lowerBound + upperBound) / 2,
      count,
      averagePrediction,
      actualAccuracy,
      weight,
      error,
    });
  }

  return bins;
}

/**
 * キャリブレーション品質を評価
 *
 * @param ece - ECE値
 * @returns 品質評価（excellent/good/fair/poor）
 */
export function evaluateCalibrationQuality(ece: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (ece <= 0.05) return 'excellent'; // 5%以下
  if (ece <= 0.10) return 'good';      // 10%以下
  if (ece <= 0.15) return 'fair';      // 15%以下
  return 'poor';                        // 15%超
}

/**
 * MAE品質を評価
 *
 * @param mae - MAE値（パーセント）
 * @returns 品質評価（excellent/good/fair/poor）
 */
export function evaluateMAEQuality(mae: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (mae <= 10) return 'excellent'; // 10%以下
  if (mae <= 20) return 'good';      // 20%以下
  if (mae <= 30) return 'fair';      // 30%以下
  return 'poor';                      // 30%超
}

/**
 * キャリブレーション結果を人間が読める形式でフォーマット
 *
 * @param result - キャリブレーション結果
 * @returns フォーマット済み文字列
 */
export function formatCalibrationResult(result: CalibrationResult): string {
  const eceQuality = evaluateCalibrationQuality(result.ece);
  const maeQuality = evaluateMAEQuality(result.mae);

  const eceEmoji = {
    excellent: '✅',
    good: '🟢',
    fair: '🟡',
    poor: '🔴',
  }[eceQuality];

  const maeEmoji = {
    excellent: '✅',
    good: '🟢',
    fair: '🟡',
    poor: '🔴',
  }[maeQuality];

  return `
📊 キャリブレーション分析結果
━━━━━━━━━━━━━━━━━━━━━━
${eceEmoji} ECE: ${(result.ece * 100).toFixed(2)}% (${eceQuality})
${maeEmoji} MAE: ${result.mae.toFixed(2)}% (${maeQuality})

📈 全体統計
  • 予測数: ${result.count}
  • 実際の正解率: ${(result.overallAccuracy * 100).toFixed(1)}%
  • 平均予測確率: ${(result.averagePrediction * 100).toFixed(1)}%
  • 予測バイアス: ${((result.averagePrediction - result.overallAccuracy) * 100).toFixed(1)}%

📊 ビン別詳細
${result.bins
  .filter((bin) => bin.count > 0)
  .map((bin) => {
    const barLength = Math.round(bin.weight * 20);
    const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
    return `  [${(bin.range[0] * 100).toFixed(0)}-${(bin.range[1] * 100).toFixed(0)}%] ${bar} n=${bin.count} 予測=${(bin.averagePrediction * 100).toFixed(1)}% 実際=${(bin.actualAccuracy * 100).toFixed(1)}% 誤差=${(bin.error * 100).toFixed(1)}%`;
  })
  .join('\n')}
`.trim();
}
