/**
 * Calibration Dashboard Component
 *
 * AIの予測精度（キャリブレーション）を可視化するダッシュボード
 */

import React, { useState, useEffect } from 'react';
import { getPredictionLogger } from '@/ai/services/PredictionLogger';
import {
  analyzeCalibration,
  evaluateCalibrationQuality,
  evaluateMAEQuality,
  type CalibrationResult,
  type CalibrationBin,
} from '@/ai/metrics/calibration';

interface CalibrationDashboardProps {
  /** 最小予測数（この数未満の場合は警告表示） */
  minPredictions?: number;
}

export const CalibrationDashboard: React.FC<CalibrationDashboardProps> = ({
  minPredictions = 100,
}) => {
  const [result, setResult] = useState<CalibrationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCalibrationData = async () => {
    setLoading(true);
    setError(null);

    try {
      const logger = getPredictionLogger();
      const predictions = await logger.getAllPredictions();

      if (predictions.length === 0) {
        setError('予測データがありません。学習を開始してください。');
        setResult(null);
        return;
      }

      const calibrationResult = analyzeCalibration(predictions, 10);
      setResult(calibrationResult);
    } catch (err) {
      console.error('Failed to load calibration data:', err);
      setError('データの読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalibrationData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          AIキャリブレーション分析
        </h2>
        <div className="p-4 bg-yellow-50/20 border border-yellow-200 rounded">
          <p className="text-yellow-800">
            {error || '予測データが不足しています'}
          </p>
        </div>
      </div>
    );
  }

  const eceQuality = evaluateCalibrationQuality(result.ece);
  const maeQuality = evaluateMAEQuality(result.mae);

  const qualityColors = {
    excellent: 'text-green-600',
    good: 'text-blue-600',
    fair: 'text-yellow-600',
    poor: 'text-red-600',
  };

  const qualityEmojis = {
    excellent: '🌟',
    good: '👍',
    fair: '⚠️',
    poor: '❌',
  };

  const showWarning = result.count < minPredictions;

  return (
    <div className="p-6 bg-white rounded-lg shadow space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          AIキャリブレーション分析
        </h2>
        <button
          onClick={loadCalibrationData}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          🔄 更新
        </button>
      </div>

      {/* 警告（予測数が少ない場合） */}
      {showWarning && (
        <div className="p-4 bg-yellow-50/20 border border-yellow-200 rounded">
          <p className="text-yellow-800">
            ⚠️ 予測数が{minPredictions}件未満です（現在{result.count}件）。
            より正確な分析には{minPredictions}件以上の予測が推奨されます。
          </p>
        </div>
      )}

      {/* メトリクスサマリー */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ECE */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">
            ECE（Expected Calibration Error）
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-800">
              {(result.ece * 100).toFixed(1)}%
            </span>
            <span className={`text-lg ${qualityColors[eceQuality]}`}>
              {qualityEmojis[eceQuality]} {eceQuality}
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            予測確率と実際の正解率の差（小さいほど良い）
          </div>
        </div>

        {/* MAE */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">
            MAE（Mean Absolute Error）
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-800">
              {result.mae.toFixed(1)}%
            </span>
            <span className={`text-lg ${qualityColors[maeQuality]}`}>
              {qualityEmojis[maeQuality]} {maeQuality}
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            平均絶対誤差（小さいほど良い）
          </div>
        </div>

        {/* 正解率 */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">
            全体正解率
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-800">
              {(result.overallAccuracy * 100).toFixed(1)}%
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            予測数: {result.count}件
          </div>
        </div>
      </div>

      {/* キャリブレーションチャート */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-bold mb-4 text-gray-800">
          ビン別キャリブレーション
        </h3>
        <div className="space-y-2">
          {result.bins
            .filter((bin) => bin.count > 0)
            .map((bin, index) => (
              <CalibrationBinBar key={index} bin={bin} />
            ))}
        </div>
        <div className="mt-4 text-xs text-gray-500">
          理想的な予測では、各ビンの「予測」と「実際」が一致します。
          ビンは予測確率を10分割したグループです。
        </div>
      </div>

      {/* バイアス情報 */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-bold mb-2 text-gray-800">
          予測の傾向
        </h3>
        <div className="flex items-center gap-4">
          <div>
            <span className="text-sm text-gray-600">
              平均予測確率:
            </span>
            <span className="ml-2 font-bold text-gray-800">
              {(result.averagePrediction * 100).toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-600">
              実際の正解率:
            </span>
            <span className="ml-2 font-bold text-gray-800">
              {(result.overallAccuracy * 100).toFixed(1)}%
            </span>
          </div>
          <div className="ml-auto">
            {result.averagePrediction > result.overallAccuracy + 0.05 ? (
              <span className="px-3 py-1 bg-red-100/30 text-red-700 rounded-full text-sm">
                過信傾向
              </span>
            ) : result.averagePrediction < result.overallAccuracy - 0.05 ? (
              <span className="px-3 py-1 bg-blue-100/30 text-blue-700 rounded-full text-sm">
                過小評価傾向
              </span>
            ) : (
              <span className="px-3 py-1 bg-green-100/30 text-green-700 rounded-full text-sm">
                バランス良好
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface CalibrationBinBarProps {
  bin: CalibrationBin;
}

const CalibrationBinBar: React.FC<CalibrationBinBarProps> = ({ bin }) => {
  const [rangeStart, rangeEnd] = bin.range;
  const predicted = bin.averagePrediction * 100;
  const actual = bin.actualAccuracy * 100;
  const error = Math.abs(predicted - actual);

  // エラーに応じた色
  const errorColor =
    error < 5
      ? 'bg-green-500'
      : error < 10
        ? 'bg-blue-500'
        : error < 15
          ? 'bg-yellow-500'
          : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-600">
        <span>
          {(rangeStart * 100).toFixed(0)}%-{(rangeEnd * 100).toFixed(0)}%
          （{bin.count}件）
        </span>
        <span>誤差: {error.toFixed(1)}%</span>
      </div>
      <div className="relative h-6 bg-gray-200 rounded">
        {/* 予測バー（背景） */}
        <div
          className="absolute h-full bg-blue-300 rounded opacity-50"
          style={{ width: `${predicted}%` }}
        ></div>
        {/* 実際のバー（前景） */}
        <div
          className={`absolute h-full ${errorColor} rounded`}
          style={{ width: `${actual}%` }}
        ></div>
        {/* ラベル */}
        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-800">
          予測 {predicted.toFixed(0)}% / 実際 {actual.toFixed(0)}%
        </div>
      </div>
    </div>
  );
};
