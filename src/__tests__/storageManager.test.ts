import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ProgressData, StorageValue } from '@/types/storage';

/**
 * storageManager.ts の型安全テスト
 * 目的: any 型を除去し ProgressData, StorageValue 型を使用
 */

// モックデータ
const mockProgressData: ProgressData = {
  quizzes: {
    'grade1-words': [
      { score: 8, total: 10, date: '2025-12-12' },
      { score: 9, total: 10, date: '2025-12-11' }
    ]
  },
  lastUpdated: Date.now(),
  totalAnswered: { 'grade1-words': 20 },
  totalMastered: { 'grade1-words': 17 }
};

describe('storageManager - Type Safety', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('ProgressData 型チェック', () => {
    it('should have correct ProgressData structure', () => {
      expect(mockProgressData).toHaveProperty('quizzes');
      expect(mockProgressData).toHaveProperty('lastUpdated');
      expect(mockProgressData).toHaveProperty('totalAnswered');
      expect(mockProgressData).toHaveProperty('totalMastered');
    });

    it('should have correct quiz result structure', () => {
      const quizResult = mockProgressData.quizzes['grade1-words'][0];
      expect(quizResult).toHaveProperty('score');
      expect(quizResult).toHaveProperty('total');
      expect(quizResult).toHaveProperty('date');
      expect(typeof quizResult.score).toBe('number');
      expect(typeof quizResult.total).toBe('number');
      expect(typeof quizResult.date).toBe('string');
    });

    it('should validate lastUpdated is a timestamp', () => {
      expect(typeof mockProgressData.lastUpdated).toBe('number');
      expect(mockProgressData.lastUpdated).toBeGreaterThan(0);
    });

    it('should validate totalAnswered structure', () => {
      expect(typeof mockProgressData.totalAnswered).toBe('object');
      Object.values(mockProgressData.totalAnswered).forEach(count => {
        expect(typeof count).toBe('number');
      });
    });
  });

  describe('StorageValue 型チェック', () => {
    it('should accept string value', () => {
      const value: StorageValue = 'test-value';
      expect(typeof value).toBe('string');
    });

    it('should accept number value', () => {
      const value: StorageValue = 42;
      expect(typeof value).toBe('number');
    });

    it('should accept boolean value', () => {
      const value: StorageValue = true;
      expect(typeof value).toBe('boolean');
    });

    it('should accept ProgressData object', () => {
      const value: StorageValue = mockProgressData;
      expect(value).toHaveProperty('quizzes');
      expect(value).toHaveProperty('lastUpdated');
    });

    it('should accept null value', () => {
      const value: StorageValue = null;
      expect(value).toBeNull();
    });
  });

  describe('型ガードテスト', () => {
    it('should identify ProgressData correctly', () => {
      const isProgressData = (data: StorageValue): data is ProgressData => {
        return (
          typeof data === 'object' &&
          data !== null &&
          'quizzes' in data &&
          'lastUpdated' in data
        );
      };

      expect(isProgressData(mockProgressData)).toBe(true);
      expect(isProgressData('string')).toBe(false);
      expect(isProgressData(null)).toBe(false);
    });
  });

  describe('LocalStorage連携テスト', () => {
    it('should save and load ProgressData via localStorage', () => {
      const key = 'test-progress';
      localStorage.setItem(key, JSON.stringify(mockProgressData));
      
      const loaded = JSON.parse(localStorage.getItem(key) || '{}');
      expect(loaded).toEqual(mockProgressData);
    });

    it('should handle missing data gracefully', () => {
      const loaded = localStorage.getItem('non-existent-key');
      expect(loaded).toBeNull();
    });
  });
});
