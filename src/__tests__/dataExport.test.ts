import { describe, it, expect } from 'vitest';
import type { 
  ProgressData, 
  SessionRecord, 
  DailyStat, 
  AppSettings 
} from '@/types/storage';

/**
 * dataExport.ts の型安全テスト
 * 目的: ExportData インターフェースの型定義確認
 */

describe('dataExport - Type Safety', () => {
  describe('SessionRecord 型チェック', () => {
    it('should have correct SessionRecord structure', () => {
      const session: SessionRecord = {
        date: '2025-12-12',
        duration: 300,
        questionsAnswered: 10,
        correctAnswers: 8
      };

      expect(session).toHaveProperty('date');
      expect(session).toHaveProperty('duration');
      expect(session).toHaveProperty('questionsAnswered');
      expect(session).toHaveProperty('correctAnswers');
      expect(typeof session.date).toBe('string');
      expect(typeof session.duration).toBe('number');
    });

    it('should validate duration is non-negative', () => {
      const session: SessionRecord = {
        date: '2025-12-12',
        duration: 0,
        questionsAnswered: 0,
        correctAnswers: 0
      };

      expect(session.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('DailyStat 型チェック', () => {
    it('should have correct DailyStat structure', () => {
      const stat: DailyStat = {
        date: '2025-12-12',
        answered: 15,
        correct: 12,
        retentionRate: 0.8
      };

      expect(stat).toHaveProperty('date');
      expect(stat).toHaveProperty('answered');
      expect(typeof stat.date).toBe('string');
      expect(typeof stat.answered).toBe('number');
    });

    it('should validate answered count', () => {
      const stat: DailyStat = {
        date: '2025-12-12',
        answered: 100,
        correct: 80,
        retentionRate: 0.8
      };

      expect(stat.answered).toBeGreaterThanOrEqual(0);
    });
  });

  describe('AppSettings 型チェック', () => {
    it('should have correct AppSettings structure', () => {
      const settings: AppSettings = {
        theme: 'dark',
        language: 'ja',
        autoAdvance: true,
        autoAdvanceDelay: 3000,
        soundEnabled: false
      };

      expect(settings).toHaveProperty('theme');
      expect(settings).toHaveProperty('language');
      expect(settings).toHaveProperty('autoAdvance');
      expect(['light', 'dark', 'auto']).toContain(settings.theme);
    });

    it('should validate theme values', () => {
      const themes: Array<AppSettings['theme']> = ['light', 'dark', 'auto'];
      
      themes.forEach(theme => {
        const settings: AppSettings = {
          theme,
          language: 'ja',
          autoAdvance: false,
          autoAdvanceDelay: 2000,
          soundEnabled: true
        };
        
        expect(['light', 'dark', 'auto']).toContain(settings.theme);
      });
    });
  });

  describe('ExportData 統合テスト', () => {
    it('should create valid export data structure', () => {
      const exportData = {
        version: '1.0',
        exportDate: Date.now(),
        progress: null as ProgressData | null,
        sessionHistory: [] as SessionRecord[],
        dailyStats: [] as DailyStat[],
        settings: {} as Partial<AppSettings>
      };

      expect(exportData).toHaveProperty('version');
      expect(exportData).toHaveProperty('exportDate');
      expect(exportData).toHaveProperty('progress');
      expect(Array.isArray(exportData.sessionHistory)).toBe(true);
      expect(Array.isArray(exportData.dailyStats)).toBe(true);
    });

    it('should allow partial settings', () => {
      const partialSettings: Partial<AppSettings> = {
        theme: 'dark',
        autoAdvance: true
      };

      expect(partialSettings).toHaveProperty('theme');
      expect(partialSettings).toHaveProperty('autoAdvance');
      expect(partialSettings.language).toBeUndefined();
    });
  });
});
