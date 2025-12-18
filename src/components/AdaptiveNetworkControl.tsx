/**
 * AdaptiveNetworkControl - メタAI設定コントロール
 *
 * メタAIネットワークの有効/無効、現在の戦略、効果指標を表示
 */

import React, { useState } from 'react';
import { useAdaptiveNetwork } from '../hooks/useAdaptiveNetwork';
import { StrategyType } from '../ai/meta';
import { AISimulator } from './AISimulator';

const STRATEGY_DISPLAY_NAMES: Record<StrategyType, string> = {
  [StrategyType.IMMEDIATE_REPETITION]: '即時反復',
  [StrategyType.TAKE_BREAK]: '休憩',
  [StrategyType.USE_CONFUSION_PAIRS]: '混同ペア',
  [StrategyType.REDUCE_DIFFICULTY]: '難易度低下',
  [StrategyType.SPACED_REPETITION]: '間隔反復',
  [StrategyType.CONTEXTUAL_LEARNING]: '文脈学習',
  [StrategyType.GROUP_BY_THEME]: 'テーマグループ',
  [StrategyType.ADJUST_SESSION_LENGTH]: 'セッション調整',
  [StrategyType.USE_ETYMOLOGY]: '語源利用',
  [StrategyType.TIME_OF_DAY_OPTIMIZATION]: '時間帯最適化',
  [StrategyType.INCREASE_EXPOSURE]: '露出増加',
  [StrategyType.CONTINUE_NORMAL]: '通常継続',
};

export const AdaptiveNetworkControl: React.FC = () => {
  const {
    enabled,
    currentStrategy,
    toggleEnabled,
    resetState,
    effectiveness,
    isLoading,
    error,
    isInitialized,
  } = useAdaptiveNetwork();

  const [showSimulator, setShowSimulator] = useState(false);

  if (!isInitialized) {
    return (
      <div className="adaptive-network-control loading">
        <div className="spinner"></div>
        <span>初期化中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="adaptive-network-control error">
        <p>エラー: {error.message}</p>
        <button onClick={resetState}>リセット</button>
      </div>
    );
  }

  const topStrategies = Array.from(effectiveness.entries())
    .filter(([_, eff]) => eff.totalUses >= 10) // 最低10回使用
    .sort((a, b) => b[1].successRate - a[1].successRate)
    .slice(0, 3);

  return (
    <div className="adaptive-network-control">
      <div className="control-header">
        <h3>🧠 適応的学習AI</h3>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={enabled}
            onChange={toggleEnabled}
            disabled={isLoading}
            aria-label="適応的学習AIを有効化"
          />
          <span className="slider"></span>
        </label>
      </div>

      {enabled && (
        <>
          <div className="current-strategy">
            <span className="label">現在の戦略:</span>
            <span className="strategy-badge">
              {currentStrategy ? STRATEGY_DISPLAY_NAMES[currentStrategy] : '待機中'}
            </span>
          </div>

          {topStrategies.length > 0 && (
            <div className="effectiveness-summary">
              <h4>効果的な戦略 Top 3</h4>
              <ul>
                {topStrategies.map(([strategy, eff]) => (
                  <li key={strategy}>
                    <span className="strategy-name">{STRATEGY_DISPLAY_NAMES[strategy]}</span>
                    <span className="success-rate">
                      成功率: {(eff.successRate * 100).toFixed(1)}%
                    </span>
                    <span className="usage-count">({eff.totalUses}回使用)</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button className="reset-button" onClick={resetState} disabled={isLoading}>
            統計をリセット
          </button>
        </>
      )}

      {!enabled && (
        <p className="info-text">
          適応的AIを有効にすると、あなたの学習パターンに基づいて最適な学習戦略が自動的に選択されます。
        </p>
      )}

      {/* シミュレーターセクション */}
      <div className="simulator-section">
        <button
          className="simulator-toggle-button"
          onClick={() => setShowSimulator(!showSimulator)}
        >
          <span>{showSimulator ? '🔼' : '🔽'}</span>
          <span>学習AIシミュレーター</span>
        </button>
        {showSimulator && (
          <div className="simulator-content">
            <AISimulator />
          </div>
        )}
      </div>
    </div>
  );
};
