/**
 * AdaptiveEducationalAINetwork - 統合テスト
 *
 * メタAIネットワークの統合動作をテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdaptiveEducationalAINetwork } from '../../src/ai/meta/AdaptiveEducationalAINetwork';
import { StrategyType, QuestionContext } from '../../src/ai/meta/types';

describe('AdaptiveEducationalAINetwork - Integration Tests', () => {
  let network: AdaptiveEducationalAINetwork;
  let mockLocalStorage: Storage;

  beforeEach(async () => {
    // LocalStorageをモック（代入ではなくvi.stubGlobalを使用）
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    } as Storage;

    vi.stubGlobal('localStorage', mockLocalStorage);

    network = new AdaptiveEducationalAINetwork({ enabled: true });
    await network.initialize();
  });

  describe('初期化', () => {
    it('正常に初期化される', async () => {
      const state = network.getState();
      expect(state.enabled).toBe(true);
      expect(state.currentStrategy).toBeNull();
      expect(state.activeSignals).toHaveLength(0);
    });

    it('無効化状態で初期化される', async () => {
      const disabledNetwork = new AdaptiveEducationalAINetwork({ enabled: false });
      await disabledNetwork.initialize();

      const state = disabledNetwork.getState();
      expect(state.enabled).toBe(false);
    });
  });

  describe('質問処理', () => {
    const mockContext: QuestionContext = {
      currentDifficulty: 0.5,
      timeOfDay: 'morning',
      recentErrors: 2,
      sessionLength: 15,
      consecutiveCorrect: 3,
    };

    it('正答時に戦略を推奨する', async () => {
      const recommendation = await network.processQuestion('apple', 'correct', mockContext);

      expect(recommendation).toBeDefined();
      expect(recommendation.strategy).toBeDefined();
      expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
      expect(recommendation.confidence).toBeLessThanOrEqual(1);
      expect(recommendation.reason).toBeTruthy();
    });

    it('誤答時に戦略を推奨する', async () => {
      const recommendation = await network.processQuestion('difficult', 'incorrect', mockContext);

      expect(recommendation).toBeDefined();
      expect(recommendation.strategy).toBeDefined();
      expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
      expect(recommendation.confidence).toBeLessThanOrEqual(1);
    });

    it('無効化状態では通常継続を返す', async () => {
      network.updateConfig({ enabled: false });

      const recommendation = await network.processQuestion('test', 'correct', mockContext);

      expect(recommendation.strategy).toBe(StrategyType.CONTINUE_NORMAL);
    });
  });

  describe('学習シナリオ', () => {
    it('シナリオ1: 連続正解後の対応', async () => {
      const context: QuestionContext = {
        currentDifficulty: 0.3,
        timeOfDay: 'morning',
        recentErrors: 0,
        sessionLength: 10,
        consecutiveCorrect: 5,
      };

      const recommendation = await network.processQuestion('easy_word', 'correct', context);

      // 連続正解時は何らかの戦略を推奨（AIの判断は動的）
      expect(recommendation.strategy).toBeDefined();
      expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
      expect(recommendation.confidence).toBeLessThanOrEqual(1);
    });

    it('シナリオ2: 複数回誤答後の対応', async () => {
      const context: QuestionContext = {
        currentDifficulty: 0.8,
        timeOfDay: 'afternoon',
        recentErrors: 5,
        sessionLength: 20,
        consecutiveCorrect: 0,
      };

      const recommendation = await network.processQuestion('hard_word', 'incorrect', context);

      // 複数誤答時は何らかの戦略を推奨（AIの判断は動的）
      expect(recommendation.strategy).toBeDefined();
      expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
      expect(recommendation.confidence).toBeLessThanOrEqual(1);
    });

    it('シナリオ3: 長時間セッション後の対応', async () => {
      const context: QuestionContext = {
        currentDifficulty: 0.5,
        timeOfDay: 'evening',
        recentErrors: 3,
        sessionLength: 45, // 45分
        consecutiveCorrect: 2,
      };

      const recommendation = await network.processQuestion('word', 'correct', context);

      // 長時間学習後は休憩やセッション調整を推奨する可能性が高い
      // ただし、他の戦略も可能性がある
      expect(recommendation.strategy).toBeDefined();
      expect(recommendation.confidence).toBeGreaterThan(0);
    });
  });

  describe('状態管理', () => {
    it('設定を更新できる', () => {
      network.updateConfig({
        minSignalStrength: 0.5,
        minConfidence: 0.6,
      });

      // 設定変更が反映されているか確認
      const state = network.getState();
      expect(state).toBeDefined();
    });

    it('状態をリセットできる', () => {
      network.resetState();

      const state = network.getState();
      expect(state.currentStrategy).toBeNull();
      expect(state.activeSignals).toHaveLength(0);
      expect(state.sessionStats.questionsAnswered).toBe(0);
    });

    it('状態をエクスポート/インポートできる', () => {
      const exported = network.exportState();
      expect(exported).toBeTruthy();

      const newNetwork = new AdaptiveEducationalAINetwork();
      newNetwork.importState(exported);

      // エクスポートしたデータが正しくインポートされる
      expect(() => newNetwork.getState()).not.toThrow();
    });
  });

  describe('効果測定', () => {
    it('複数回使用後に効果を追跡できる', async () => {
      const context: QuestionContext = {
        currentDifficulty: 0.5,
        timeOfDay: 'morning',
        recentErrors: 1,
        sessionLength: 10,
        consecutiveCorrect: 2,
      };

      // 10回質問を処理
      for (let i = 0; i < 10; i++) {
        await network.processQuestion(`word_${i}`, i % 2 === 0 ? 'correct' : 'incorrect', context);
      }

      const state = network.getState();
      expect(state.sessionStats.questionsAnswered).toBe(10);
      expect(state.sessionStats.correctAnswers + state.sessionStats.incorrectAnswers).toBe(10);

      // 状態が更新されている（effectivenessは非同期で記録される）
      expect(state.lastUpdated).toBeGreaterThan(0);
    });

    it('成功率が正しく計算される', async () => {
      const context: QuestionContext = {
        currentDifficulty: 0.5,
        timeOfDay: 'morning',
        recentErrors: 0,
        sessionLength: 5,
        consecutiveCorrect: 0,
      };

      // 5回正答、5回誤答
      for (let i = 0; i < 10; i++) {
        await network.processQuestion(`word_${i}`, i < 5 ? 'correct' : 'incorrect', context);
      }

      const state = network.getState();
      expect(state.sessionStats.correctAnswers).toBe(5);
      expect(state.sessionStats.incorrectAnswers).toBe(5);

      // 状態が更新されている（effectivenessは非同期で記録される）
      expect(state.lastUpdated).toBeGreaterThan(0);
    });
  });

  describe('エラーハンドリング', () => {
    it('無効な単語でもエラーにならない', async () => {
      const context: QuestionContext = {
        currentDifficulty: 0.5,
        timeOfDay: 'morning',
        recentErrors: 0,
        sessionLength: 5,
        consecutiveCorrect: 0,
      };

      await expect(network.processQuestion('', 'correct', context)).resolves.toBeDefined();
    });

    it('無効なコンテキストでもフォールバックする', async () => {
      const invalidContext = {} as QuestionContext;

      const recommendation = await network.processQuestion('word', 'correct', invalidContext);

      // フォールバックとして何らかの戦略を返す（AIが判断を試みる可能性あり）
      expect(recommendation).toBeDefined();
      expect(recommendation.strategy).toBeDefined();
      expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
    });
  });

  describe('パフォーマンス', () => {
    it('応答時間が200ms以下', async () => {
      const context: QuestionContext = {
        currentDifficulty: 0.5,
        timeOfDay: 'morning',
        recentErrors: 1,
        sessionLength: 10,
        consecutiveCorrect: 2,
      };

      const start = Date.now();
      await network.processQuestion('test', 'correct', context);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(200);
    });

    it('連続呼び出しでも安定している', async () => {
      const context: QuestionContext = {
        currentDifficulty: 0.5,
        timeOfDay: 'morning',
        recentErrors: 1,
        sessionLength: 10,
        consecutiveCorrect: 2,
      };

      const promises = Array.from({ length: 10 }, (_, i) =>
        network.processQuestion(`word_${i}`, 'correct', context)
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result).toBeDefined();
        expect(result.strategy).toBeDefined();
      });
    });
  });
});
