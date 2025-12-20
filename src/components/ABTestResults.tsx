/**
 * ABテスト結果ダッシュボード
 *
 * 実験結果を可視化し、統計的有意性を評価します。
 */

import React, { useEffect, useState } from 'react';
import { getABTestManager } from '@/ai/experiments/ABTestManager';
import { getMetricsCollector, type MetricsSummary, type ComparisonResult } from '@/ai/experiments/MetricsCollector';

interface ABTestResultsProps {
  testId: string;
  className?: string;
}

export function ABTestResults({ testId, className = '' }: ABTestResultsProps) {
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadResults();
  }, [testId]);

  const loadResults = () => {
    try {
      setLoading(true);
      setError(null);

      const collector = getMetricsCollector();
      const summaryData = collector.summarize(testId);
      setSummary(summaryData);

      // コントロールとトリートメントを比較
      const variantIds = Object.keys(summaryData.byVariant);
      if (variantIds.length >= 2) {
        const comparison = collector.compareVariants(
          testId,
          variantIds[1], // treatment
          variantIds[0], // control
          'correctRate'
        );
        setComparison(comparison);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50/20 rounded-lg ${className}`}>
        <p className="text-red-600">エラー: {error}</p>
      </div>
    );
  }

  if (!summary || summary.totalEvents === 0) {
    return (
      <div className={`p-4 bg-yellow-50/20 rounded-lg ${className}`}>
        <p className="text-yellow-600">
          データがありません。テストが開始されるとここに結果が表示されます。
        </p>
      </div>
    );
  }

  const manager = getABTestManager();
  const test = manager.getTest(testId);

  if (!test) {
    return (
      <div className={`p-4 bg-red-50/20 rounded-lg ${className}`}>
        <p className="text-red-600">テストが見つかりません: {testId}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {test.name}
        </h2>
        <p className="text-gray-600 mb-4">{test.description}</p>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">
            総イベント数: <span className="font-semibold">{summary.totalEvents}</span>
          </span>
          <span className="text-gray-500">
            期間: {summary.period.start.toLocaleDateString()} - {summary.period.end.toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* 統計的有意性 */}
      {comparison && (
        <div className={`p-6 rounded-lg shadow ${
          comparison.isSignificant
            ? 'bg-green-50/20 border-2 border-green-500'
            : 'bg-gray-50'
        }`}>
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            統計的有意性
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">差分</p>
              <p className="text-2xl font-bold text-gray-900">
                {comparison.relativeDifference > 0 ? '+' : ''}
                {comparison.relativeDifference.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">信頼度</p>
              <p className="text-2xl font-bold text-gray-900">
                {(comparison.confidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>
          <div className="mt-4">
            {comparison.isSignificant ? (
              <p className="text-green-700 font-semibold flex items-center gap-2">
                <span>✓</span>
                統計的に有意な差が検出されました
              </p>
            ) : (
              <p className="text-gray-600">
                統計的に有意な差は検出されませんでした（さらにデータ収集が必要）
              </p>
            )}
          </div>
        </div>
      )}

      {/* バリアント別の結果 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(summary.byVariant).map(([variantId, metrics]) => {
          const variant = test.variants.find(v => v.id === variantId);
          if (!variant) return null;

          return (
            <div key={variantId} className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {variant.name}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {variant.description}
              </p>

              <div className="space-y-4">
                {/* 学習成果 */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    学習成果
                  </h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">正答率</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {(metrics.learningOutcome.correctRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">平均記憶保持率</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {(metrics.learningOutcome.avgRetentionRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">問題数</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {metrics.learningOutcome.totalQuestions}
                      </span>
                    </div>
                  </div>
                </div>

                {/* エンゲージメント */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    エンゲージメント
                  </h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">平均セッション時間</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {metrics.engagement.avgSessionDuration.toFixed(0)}秒
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">セッションあたりアクション</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {metrics.engagement.actionsPerSession.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">機能インタラクション</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {metrics.engagement.featureInteractions}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 信頼度 */}
                {metrics.trust.ratingCount > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      AI信頼度
                    </h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">平均評価</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {metrics.trust.avgRating.toFixed(1)} / 5.0
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">評価数</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {metrics.trust.ratingCount}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    サンプル数: {metrics.sampleSize}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 更新ボタン */}
      <div className="flex justify-end">
        <button
          onClick={loadResults}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          結果を更新
        </button>
      </div>
    </div>
  );
}

/**
 * 全ABテストの概要を表示
 */
export function ABTestOverview() {
  const [tests, setTests] = useState<any[]>([]);

  useEffect(() => {
    const manager = getABTestManager();
    setTests(manager.getActiveTests());
  }, []);

  if (tests.length === 0) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <p className="text-gray-600">
          現在実行中のABテストはありません
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">
        実行中のABテスト
      </h2>

      {tests.map(test => (
        <ABTestResults key={test.id} testId={test.id} />
      ))}
    </div>
  );
}
