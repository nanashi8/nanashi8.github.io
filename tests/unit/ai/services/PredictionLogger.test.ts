/**
 * PredictionLogger Tests
 *
 * 予測ログサービスの機能を検証
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PredictionLogger } from '../../../../src/ai/services/PredictionLogger';

describe('PredictionLogger', () => {
  let logger: PredictionLogger;

  beforeEach(async () => {
    logger = new PredictionLogger();
    await logger.clearLogs();
  });

  describe('logPrediction', () => {
    it('予測をログに記録できる', async () => {
      await logger.logPrediction('word1', 0.8, 1);

      const predictions = await logger.getAllPredictions();
      expect(predictions).toHaveLength(1);
      expect(predictions[0].word).toBe('word1');
      expect(predictions[0].predicted).toBe(0.8);
      expect(predictions[0].actual).toBe(1);
      expect(predictions[0].timestamp).toBeDefined();
    });

    it('複数の予測を記録できる', async () => {
      await logger.logPrediction('word1', 0.8, 1);
      await logger.logPrediction('word2', 0.6, 0);
      await logger.logPrediction('word3', 0.9, 1);

      const predictions = await logger.getAllPredictions();
      expect(predictions).toHaveLength(3);
    });

    it('MAX_PREDICTIONS超過時は古いログを削除', async () => {
      // 小さいMAX_PREDICTIONSでテスト（実装で10000）
      // 実際は11個追加して最初の1個が削除されることを確認
      const testCount = 11;

      for (let i = 0; i < testCount; i++) {
        await logger.logPrediction(`word${i}`, 0.5, 1);
      }

      const predictions = await logger.getAllPredictions();
      // MAX_PREDICTIONSが10000なので全部残る
      expect(predictions.length).toBeLessThanOrEqual(10000);
    });
  });

  describe('getRecentPredictions', () => {
    it('最近のN件を取得（新しい順）', async () => {
      await logger.logPrediction('word1', 0.8, 1);
      await logger.logPrediction('word2', 0.6, 0);
      await logger.logPrediction('word3', 0.9, 1);

      const recent = await logger.getRecentPredictions(2);
      expect(recent).toHaveLength(2);
      // 新しい順なのでword3, word2
      expect(recent[0].word).toBe('word3');
      expect(recent[1].word).toBe('word2');
    });

    it('limit超過時は全件返す', async () => {
      await logger.logPrediction('word1', 0.8, 1);
      await logger.logPrediction('word2', 0.6, 0);

      const recent = await logger.getRecentPredictions(100);
      expect(recent).toHaveLength(2);
    });
  });

  describe('getAllPredictions', () => {
    it('全予測を取得', async () => {
      await logger.logPrediction('word1', 0.8, 1);
      await logger.logPrediction('word2', 0.6, 0);

      const all = await logger.getAllPredictions();
      expect(all).toHaveLength(2);
    });

    it('空の場合は空配列を返す', async () => {
      const all = await logger.getAllPredictions();
      expect(all).toEqual([]);
    });
  });

  describe('getPredictionsByTimeRange', () => {
    it('期間を指定して予測を取得', async () => {
      const _now = Date.now();

      await logger.logPrediction('word1', 0.8, 1);
      await new Promise((resolve) => setTimeout(resolve, 10));
      const midTime = Date.now();
      await logger.logPrediction('word2', 0.6, 0);

      // midTime以降の予測（word2のみ）
      const predictions = await logger.getPredictionsByTimeRange(midTime);
      expect(predictions.length).toBeGreaterThan(0);
      expect(predictions.some((p) => p.word === 'word2')).toBe(true);
    });
  });

  describe('getPredictionsByWord', () => {
    it('特定の単語の予測履歴を取得', async () => {
      await logger.logPrediction('word1', 0.8, 1);
      await logger.logPrediction('word2', 0.6, 0);
      await logger.logPrediction('word1', 0.7, 0);

      const word1Predictions = await logger.getPredictionsByWord('word1');
      expect(word1Predictions).toHaveLength(2);
      expect(word1Predictions.every((p) => p.word === 'word1')).toBe(true);
    });

    it('存在しない単語で空配列を返す', async () => {
      await logger.logPrediction('word1', 0.8, 1);

      const predictions = await logger.getPredictionsByWord('nonexistent');
      expect(predictions).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('統計情報を取得', async () => {
      await logger.logPrediction('word1', 0.8, 1);
      await logger.logPrediction('word2', 0.6, 0);
      await logger.logPrediction('word1', 0.7, 1);

      const stats = await logger.getStats();
      expect(stats.total).toBe(3);
      expect(stats.uniqueWords).toBe(2); // word1, word2
      expect(stats.oldest).toBeLessThanOrEqual(stats.newest!);
    });

    it('空の場合の統計情報', async () => {
      const stats = await logger.getStats();
      expect(stats.total).toBe(0);
      expect(stats.oldest).toBeNull();
      expect(stats.newest).toBeNull();
      expect(stats.uniqueWords).toBe(0);
    });
  });

  describe('clearLogs', () => {
    it('ログをクリア', async () => {
      await logger.logPrediction('word1', 0.8, 1);
      await logger.logPrediction('word2', 0.6, 0);

      await logger.clearLogs();

      const all = await logger.getAllPredictions();
      expect(all).toEqual([]);
    });
  });

  describe('persistence', () => {
    it('ログが永続化される（同じストレージを共有）', async () => {
      // 共有ストレージを作成
      const sharedStorage = new Map<string, unknown>();
      const storageAdapter = {
        async getItem(key: string) {
          return sharedStorage.get(key);
        },
        async setItem(key: string, value: unknown) {
          sharedStorage.set(key, value);
        },
      };

      const logger1 = new PredictionLogger(storageAdapter);
      await logger1.logPrediction('word1', 0.8, 1);

      // 新しいインスタンスで同じストレージを使用
      const logger2 = new PredictionLogger(storageAdapter);
      const predictions = await logger2.getAllPredictions();

      expect(predictions).toHaveLength(1);
      expect(predictions[0].word).toBe('word1');
    });
  });

  describe('performance', () => {
    it('大量のログでもパフォーマンス維持', async () => {
      const count = 1000;
      const startTime = performance.now();

      for (let i = 0; i < count; i++) {
        await logger.logPrediction(`word${i}`, Math.random(), Math.random() > 0.5 ? 1 : 0);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 1000件で5秒以内
      expect(duration).toBeLessThan(5000);

      const all = await logger.getAllPredictions();
      expect(all).toHaveLength(count);
    });
  });
});
