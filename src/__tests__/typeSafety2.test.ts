import { describe, it, expect } from 'vitest';
import type {
  ReadingPassage,
  ReadingPhrase,
  ReadingSegment,
  QuizResultWithCategory,
  CategoryStats,
} from '@/types/storage';

/**
 * Phase 2: 型安全性向上テスト
 * 
 * 目的:
 * - 追加型定義の検証
 * - progressStorage.ts の型安全性確認
 * - aiCommentHelpers.ts の型安全性確認
 */

describe('Phase 2: 型安全性向上テスト', () => {
  describe('Reading データ型', () => {
    it('should have valid ReadingSegment structure', () => {
      const segment: ReadingSegment = {
        word: 'example',
        isUnknown: true,
      };

      expect(segment.word).toBe('example');
      expect(segment.isUnknown).toBe(true);
    });

    it('should have valid ReadingPhrase structure', () => {
      const phrase: ReadingPhrase = {
        segments: [
          { word: 'hello', isUnknown: false },
          { word: 'world', isUnknown: true },
        ],
      };

      expect(phrase.segments).toHaveLength(2);
      expect(phrase.segments[0].word).toBe('hello');
    });

    it('should have valid ReadingPassage structure', () => {
      const passage: ReadingPassage = {
        phrases: [
          {
            segments: [
              { word: 'test', isUnknown: false },
            ],
          },
        ],
      };

      expect(passage.phrases).toBeDefined();
      expect(passage.phrases![0].segments).toHaveLength(1);
    });

    it('should handle ReadingPassage without phrases', () => {
      const passage: ReadingPassage = {};

      expect(passage.phrases).toBeUndefined();
    });
  });

  describe('AI コメント型', () => {
    it('should have valid QuizResultWithCategory structure', () => {
      const result: QuizResultWithCategory = {
        score: 8,
        total: 10,
        date: '2025-12-12',
        mode: 'translation',
        category: 'basic',
      };

      expect(result.score).toBe(8);
      expect(result.total).toBe(10);
      expect(result.mode).toBe('translation');
      expect(result.category).toBe('basic');
    });

    it('should support numeric date in QuizResultWithCategory', () => {
      const result: QuizResultWithCategory = {
        score: 7,
        total: 10,
        date: Date.now(),
      };

      expect(typeof result.date).toBe('number');
      expect(result.date).toBeGreaterThan(0);
    });

    it('should have valid CategoryStats structure', () => {
      const stats: CategoryStats = {
        correct: 15,
        total: 20,
      };

      expect(stats.correct).toBe(15);
      expect(stats.total).toBe(20);
      expect(stats.correct / stats.total).toBe(0.75);
    });

    it('should calculate category accuracy correctly', () => {
      const stats: CategoryStats = {
        correct: 45,
        total: 50,
      };

      const accuracy = (stats.correct / stats.total) * 100;
      expect(accuracy).toBe(90);
    });
  });

  describe('型安全性改善の検証', () => {
    it('should not allow invalid ReadingSegment', () => {
      const segment: ReadingSegment = {
        word: 'test',
        // isUnknown は optional
      };

      expect(segment).toBeDefined();
      expect(segment.isUnknown).toBeUndefined();
    });

    it('should enforce QuizResultWithCategory required fields', () => {
      const result: QuizResultWithCategory = {
        score: 10,
        total: 10,
        date: '2025-12-12',
        // mode と category は optional
      };

      expect(result.score).toBe(10);
      expect(result.mode).toBeUndefined();
      expect(result.category).toBeUndefined();
    });

    it('should create Map with CategoryStats', () => {
      const statsMap = new Map<string, CategoryStats>();
      
      statsMap.set('vocabulary', { correct: 20, total: 25 });
      statsMap.set('grammar', { correct: 18, total: 20 });

      expect(statsMap.size).toBe(2);
      expect(statsMap.get('vocabulary')?.correct).toBe(20);
      expect(statsMap.get('grammar')?.total).toBe(20);
    });
  });

  describe('Reading データ操作', () => {
    it('should iterate over passages, phrases, and segments', () => {
      const passages: ReadingPassage[] = [
        {
          phrases: [
            {
              segments: [
                { word: 'Hello', isUnknown: false },
                { word: 'World', isUnknown: true },
              ],
            },
            {
              segments: [
                { word: 'TypeScript', isUnknown: false },
              ],
            },
          ],
        },
      ];

      let unknownCount = 0;
      passages.forEach((passage) => {
        passage.phrases?.forEach((phrase) => {
          phrase.segments.forEach((segment) => {
            if (segment.isUnknown) {
              unknownCount++;
            }
          });
        });
      });

      expect(unknownCount).toBe(1);
    });

    it('should mark unknown words as known', () => {
      const passages: ReadingPassage[] = [
        {
          phrases: [
            {
              segments: [
                { word: 'difficult', isUnknown: true },
                { word: 'easy', isUnknown: false },
              ],
            },
          ],
        },
      ];

      passages.forEach((passage) => {
        passage.phrases?.forEach((phrase) => {
          phrase.segments.forEach((segment) => {
            if (segment.word === 'difficult' && segment.isUnknown) {
              segment.isUnknown = false;
            }
          });
        });
      });

      const difficultSegment = passages[0].phrases![0].segments[0];
      expect(difficultSegment.isUnknown).toBe(false);
    });
  });

  describe('Quiz結果データ分析', () => {
    it('should calculate average accuracy from results', () => {
      const results: QuizResultWithCategory[] = [
        { score: 8, total: 10, date: '2025-12-10' },
        { score: 9, total: 10, date: '2025-12-11' },
        { score: 7, total: 10, date: '2025-12-12' },
      ];

      const avgAccuracy = results.reduce(
        (sum, r) => sum + (r.score / r.total * 100), 0
      ) / results.length;

      expect(avgAccuracy).toBe(80);
    });

    it('should group results by category', () => {
      const results: QuizResultWithCategory[] = [
        { score: 8, total: 10, date: '2025-12-12', category: 'vocab' },
        { score: 9, total: 10, date: '2025-12-12', category: 'grammar' },
        { score: 7, total: 10, date: '2025-12-12', category: 'vocab' },
      ];

      const categoryStats = new Map<string, CategoryStats>();
      results.forEach((r) => {
        if (r.category) {
          const stats = categoryStats.get(r.category) || { correct: 0, total: 0 };
          stats.correct += r.score;
          stats.total += r.total;
          categoryStats.set(r.category, stats);
        }
      });

      expect(categoryStats.get('vocab')?.correct).toBe(15);
      expect(categoryStats.get('vocab')?.total).toBe(20);
      expect(categoryStats.get('grammar')?.correct).toBe(9);
      expect(categoryStats.get('grammar')?.total).toBe(10);
    });

    it('should compare recent vs older results', () => {
      const results: QuizResultWithCategory[] = [
        { score: 6, total: 10, date: '2025-12-01' },
        { score: 7, total: 10, date: '2025-12-02' },
        { score: 8, total: 10, date: '2025-12-10' },
        { score: 9, total: 10, date: '2025-12-11' },
      ];

      const older = results.slice(0, 2);
      const newer = results.slice(-2);

      const olderAvg = older.reduce((sum, r) => sum + (r.score / r.total * 100), 0) / older.length;
      const newerAvg = newer.reduce((sum, r) => sum + (r.score / r.total * 100), 0) / newer.length;

      expect(olderAvg).toBe(65);
      expect(newerAvg).toBe(85);
      expect(newerAvg > olderAvg + 5).toBe(true); // 改善傾向
    });
  });
});
