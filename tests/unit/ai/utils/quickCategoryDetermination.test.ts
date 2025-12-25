/**
 * quickCategoryDetermination.ts のユニットテスト
 * Phase 1 Pattern 2: AI分析の段階的実行
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  quickCategoryDetermination,
  getWordHistory,
  determineCategory,
} from '@/ai/utils/quickCategoryDetermination';
import * as progressStorage from '@/progressStorage';

// モック
vi.mock('@/progressStorage');

describe('quickCategoryDetermination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('quickCategoryDetermination - 即座のカテゴリー判定', () => {
    it('正答率 < 50% + 今回不正解の場合は incorrect を返す', async () => {
      const result = await quickCategoryDetermination('test', false, {
        totalAttempts: 10,
        correctCount: 3,
        consecutiveCorrect: 0,
      });

      expect(result.category).toBe('incorrect');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('正答率 50-80% + 今回不正解の場合は still_learning を返す', async () => {
      const result = await quickCategoryDetermination('test', false, {
        totalAttempts: 10,
        correctCount: 7,
        consecutiveCorrect: 0,
      });

      expect(result.category).toBe('still_learning');
      expect(result.confidence).toBe(1.0); // 今回不正解なら確実
    });

    it('正答率 >= 80% + 今回正解の場合は correct を返す', async () => {
      const result = await quickCategoryDetermination('test', true, {
        totalAttempts: 10,
        correctCount: 8,
        consecutiveCorrect: 2,
        lastStudiedAt: Date.now(),
      });

      expect(result.category).toBe('correct');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('正答率 >= 80% + 今回不正解の場合は still_learning に降格', async () => {
      const result = await quickCategoryDetermination('test', false, {
        totalAttempts: 10,
        correctCount: 9,
        consecutiveCorrect: 4,
        lastStudiedAt: Date.now(),
      });

      expect(result.category).toBe('still_learning');
      expect(result.confidence).toBe(0.95);
    });

    it('境界値（50%）+ 今回不正解は still_learning', async () => {
      const result = await quickCategoryDetermination('test', false, {
        totalAttempts: 1,
        correctCount: 1,
        consecutiveCorrect: 1,
      });

      expect(result.category).toBe('still_learning');
    });

    it('境界値（80%）+ 今回正解は correct', async () => {
      const result = await quickCategoryDetermination('test', true, {
        totalAttempts: 4,
        correctCount: 3,
        consecutiveCorrect: 2,
        lastStudiedAt: Date.now(),
      });

      expect(result.category).toBe('correct');
    });

    it('パフォーマンス: 50ms以内に完了する', async () => {
      const start = performance.now();
      await quickCategoryDetermination('test', true, {
        totalAttempts: 10,
        correctCount: 7,
        consecutiveCorrect: 2,
      });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
    });
  });

  describe('getWordHistory - 履歴取得', () => {
    it('進捗データが存在する場合は履歴を返す', async () => {
      vi.mocked(progressStorage.getWordProgress).mockResolvedValue({
        word: 'test',
        correctCount: 8,
        incorrectCount: 2,
        consecutiveCorrect: 3,
        consecutiveIncorrect: 0,
        lastStudied: Date.now(),
        totalResponseTime: 10000,
        averageResponseTime: 1000,
        difficultyScore: 20,
        masteryLevel: 'learning',
        responseTimes: [1000, 1100, 900],
        accuracyRate: 0.8,
      });

      const history = await getWordHistory('test');

      expect(history).not.toBeNull();
      expect(history?.totalAttempts).toBe(10);
      expect(history?.correctCount).toBe(8);
      expect(history?.consecutiveCorrect).toBe(3);
    });

    it('進捗データが存在しない場合は null を返す', async () => {
      vi.mocked(progressStorage.getWordProgress).mockResolvedValue(null);

      const history = await getWordHistory('unknown');

      expect(history).toBeNull();
    });

    it('エラー時は null を返す', async () => {
      vi.mocked(progressStorage.getWordProgress).mockRejectedValue(
        new Error('DB error')
      );

      const history = await getWordHistory('test');

      expect(history).toBeNull();
    });
  });

  describe('determineCategory - 統合API', () => {
    it('履歴データを含めた総合判定を行う', async () => {
      vi.mocked(progressStorage.getWordProgress).mockResolvedValue({
        word: 'test',
        correctCount: 15,
        incorrectCount: 5,
        consecutiveCorrect: 5,
        consecutiveIncorrect: 0,
        lastStudied: Date.now(),
        totalResponseTime: 20000,
        averageResponseTime: 1000,
        difficultyScore: 25,
        masteryLevel: 'learning',
        responseTimes: [1000, 1100, 900, 950, 1050],
        accuracyRate: 0.75,
      });

      const result = await determineCategory('test', true);

      // 正答率75% + 今回正解 + 連続正解5回 → correct に昇格
      expect(result.category).toBe('correct');
    });

    it('履歴がない場合でも判定可能', async () => {
      vi.mocked(progressStorage.getWordProgress).mockResolvedValue(null);

      const result = await determineCategory('new_word', true);

      // 正答率100% + 今回正解 → correct
      expect(result.category).toBe('correct');
    });
  });

  describe('パフォーマンステスト', () => {
    it('100回連続実行しても安定動作する', async () => {
      const start = performance.now();
      const results = [];

      for (let i = 0; i < 100; i++) {
        const totalAttempts = 10;
        const baseAccuracy = Math.random();
        const correctCount = Math.max(0, Math.min(totalAttempts, Math.round(totalAttempts * baseAccuracy)));

        const result = await quickCategoryDetermination(
          `word_${i}`,
          i % 2 === 0,
          {
            totalAttempts,
            correctCount,
            consecutiveCorrect: i % 2 === 0 ? 2 : 0,
            lastStudiedAt: Date.now(),
          }
        );
        results.push(result);
      }

      const duration = performance.now() - start;
      const avgDuration = duration / 100;

      expect(results).toHaveLength(100);
      expect(avgDuration).toBeLessThan(50); // 平均50ms以内
      expect(results.every((r) => r.confidence >= 0.8)).toBe(true);
    });
  });
});
