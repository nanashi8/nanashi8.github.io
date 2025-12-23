/**
 * useAdaptiveNetwork - Adaptive Educational AI Network用Reactフック
 *
 * メタAIネットワークをReactコンポーネントから簡単に利用できるようにする
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AdaptiveEducationalAINetwork,
  StrategyType,
  StrategyRecommendation,
  QuestionContext,
  StrategyEffectiveness,
} from '../ai/meta';

interface AdaptiveNetworkHook {
  enabled: boolean;
  currentStrategy: StrategyType | null;
  processQuestion: (
    word: string,
    result: 'correct' | 'incorrect',
    context: QuestionContext
  ) => Promise<StrategyRecommendation>;
  toggleEnabled: () => void;
  setEnabled: (enabled: boolean) => void;
  resetState: () => void;
  effectiveness: Map<StrategyType, StrategyEffectiveness>;
  isLoading: boolean;
  error: Error | null;
  isInitialized: boolean;
}

/**
 * Adaptive Network Hook
 *
 * @returns フックオブジェクト
 */
export function useAdaptiveNetwork(): AdaptiveNetworkHook {
  // ネットワークインスタンス（シングルトン）
  const networkRef = useRef<AdaptiveEducationalAINetwork | null>(null);

  // 状態管理
  const [enabled, setEnabledState] = useState(true); // ✅ 常時有効化
  const [currentStrategy, setCurrentStrategy] = useState<StrategyType | null>(null);
  const [effectiveness, setEffectiveness] = useState<Map<StrategyType, StrategyEffectiveness>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // ネットワークの初期化
  useEffect(() => {
    const initNetwork = async () => {
      try {
        if (!networkRef.current) {
          networkRef.current = new AdaptiveEducationalAINetwork({
            enabled: true, // ✅ 常時有効化
          });

          await networkRef.current.initialize();

          // 初期状態を反映
          const state = networkRef.current.getState();
          setEnabledState(state.enabled);
          setCurrentStrategy(state.currentStrategy);
          setEffectiveness(state.effectiveness);
          setIsInitialized(true);

          console.log('[useAdaptiveNetwork] Network initialized');
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        console.error('[useAdaptiveNetwork] Initialization failed', err);
      }
    };

    initNetwork();
  }, []);

  /**
   * 質問を処理
   */
  const processQuestion = useCallback(
    async (
      word: string,
      result: 'correct' | 'incorrect',
      context: QuestionContext
    ): Promise<StrategyRecommendation> => {
      if (!networkRef.current) {
        console.warn('[useAdaptiveNetwork] Network not initialized');
        return getDefaultRecommendation();
      }

      // ✅ 常時有効化のため、enabledチェックを削除

      setIsLoading(true);
      setError(null);

      try {
        const recommendation = await networkRef.current.processQuestion(word, result, context);

        // 状態を更新
        setCurrentStrategy(recommendation.strategy);
        const state = networkRef.current.getState();
        setEffectiveness(state.effectiveness);

        return recommendation;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        console.error('[useAdaptiveNetwork] Question processing failed', err);
        return getFallbackRecommendation(error);
      } finally {
        setIsLoading(false);
      }
    },
    [enabled]
  );

  /**
   * 有効/無効を切り替え
   */
  const toggleEnabled = useCallback(() => {
    if (!networkRef.current) return;

    const newEnabled = !enabled;
    networkRef.current.updateConfig({ enabled: newEnabled });
    setEnabledState(newEnabled);

    console.log(`[useAdaptiveNetwork] Network ${newEnabled ? 'enabled' : 'disabled'}`);
  }, [enabled]);

  /**
   * 有効/無効を設定
   */
  const setEnabled = useCallback((newEnabled: boolean) => {
    if (!networkRef.current) return;

    networkRef.current.updateConfig({ enabled: newEnabled });
    setEnabledState(newEnabled);

    console.log(`[useAdaptiveNetwork] Network ${newEnabled ? 'enabled' : 'disabled'}`);
  }, []);

  /**
   * 状態をリセット
   */
  const resetState = useCallback(() => {
    if (!networkRef.current) return;

    networkRef.current.resetState();
    setCurrentStrategy(null);
    setEffectiveness(new Map());
    setError(null);

    console.log('[useAdaptiveNetwork] State reset');
  }, []);

  return {
    enabled,
    currentStrategy,
    processQuestion,
    toggleEnabled,
    setEnabled,
    resetState,
    effectiveness,
    isLoading,
    error,
    isInitialized,
  };
}

/**
 * デフォルト推奨を取得
 */
function getDefaultRecommendation(): StrategyRecommendation {
  return {
    strategy: StrategyType.CONTINUE_NORMAL,
    confidence: 0.5,
    reason: '通常の学習を続けます',
    signals: [],
    metadata: {
      default: true,
    },
  };
}

/**
 * フォールバック推奨を取得
 */
function getFallbackRecommendation(error: Error): StrategyRecommendation {
  return {
    strategy: StrategyType.CONTINUE_NORMAL,
    confidence: 0,
    reason: 'AI処理が一時的に利用できないため、通常学習を続けます',
    signals: [],
    metadata: {
      fallback: true,
      error: true,
      errorMessage: error.message,
    },
  };
}
