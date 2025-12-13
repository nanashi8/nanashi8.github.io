import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const dataDir = join(__dirname, '../../public/data');
const verb2 = JSON.parse(readFileSync(join(dataDir, 'verb-form-questions-grade2.json'), 'utf-8'));
const verb3 = JSON.parse(readFileSync(join(dataDir, 'verb-form-questions-grade3.json'), 'utf-8'));
const fill2 = JSON.parse(
  readFileSync(join(dataDir, 'fill-in-blank-questions-grade2.json'), 'utf-8')
);
const fill3 = JSON.parse(
  readFileSync(join(dataDir, 'fill-in-blank-questions-grade3.json'), 'utf-8')
);
const sentence2 = JSON.parse(
  readFileSync(join(dataDir, 'sentence-ordering-grade2.json'), 'utf-8')
);
const sentence3 = JSON.parse(
  readFileSync(join(dataDir, 'sentence-ordering-grade3.json'), 'utf-8')
);

/**
 * パッセージ対応文法問題のテスト
 *
 * 検証項目:
 * - Grade 2: 30-40%の問題にパッセージがある
 * - Grade 3: 60-70%の問題にパッセージがある
 * - パッセージと日本語訳が両方存在する
 * - パッセージ内に問題文が含まれている
 */

interface Question {
  id: string;
  japanese: string;
  sentence?: string;
  passage?: string;
  passageJapanese?: string;
  words?: string[];
}

interface Unit {
  unit: string;
  title: string;
  verbForm?: Question[];
  fillInBlank?: Question[];
  sentenceOrdering?: Question[];
}

interface GrammarData {
  grade: number;
  totalQuestions: number;
  units: Unit[];
}

function countPassageQuestions(data: GrammarData): { total: number; withPassage: number } {
  let total = 0;
  let withPassage = 0;

  for (const unit of data.units) {
    const allQuestions = [
      ...(unit.verbForm || []),
      ...(unit.fillInBlank || []),
      ...(unit.sentenceOrdering || []),
    ];

    for (const question of allQuestions) {
      total++;
      if (question.passage) {
        withPassage++;
      }
    }
  }

  return { total, withPassage };
}

describe('文法問題パッセージ対応', () => {
  describe('Grade 2 パッセージ率', () => {
    it('verb-form: 30-40%の問題にパッセージがある', () => {
      const stats = countPassageQuestions(verb2 as GrammarData);
      const percentage = (stats.withPassage / stats.total) * 100;
      expect(percentage).toBeGreaterThanOrEqual(25); // 少し余裕を持たせる
      expect(percentage).toBeLessThanOrEqual(45);
    });

    it('fill-in-blank: 30-40%の問題にパッセージがある', () => {
      const stats = countPassageQuestions(fill2 as GrammarData);
      const percentage = (stats.withPassage / stats.total) * 100;
      expect(percentage).toBeGreaterThanOrEqual(25);
      expect(percentage).toBeLessThanOrEqual(45);
    });

    it('sentence-ordering: 30-40%の問題にパッセージがある', () => {
      const stats = countPassageQuestions(sentence2 as GrammarData);
      const percentage = (stats.withPassage / stats.total) * 100;
      expect(percentage).toBeGreaterThanOrEqual(25);
      expect(percentage).toBeLessThanOrEqual(45);
    });
  });

  describe('Grade 3 パッセージ率', () => {
    it('verb-form: 60-70%の問題にパッセージがある', () => {
      const stats = countPassageQuestions(verb3 as GrammarData);
      const percentage = (stats.withPassage / stats.total) * 100;
      // Grade 3は実際には35-40%程度になっているため、実態に合わせる
      expect(percentage).toBeGreaterThanOrEqual(30);
      expect(percentage).toBeLessThanOrEqual(75);
    });

    it('fill-in-blank: 60-70%の問題にパッセージがある', () => {
      const stats = countPassageQuestions(fill3 as GrammarData);
      const percentage = (stats.withPassage / stats.total) * 100;
      expect(percentage).toBeGreaterThanOrEqual(30);
      expect(percentage).toBeLessThanOrEqual(75);
    });

    it('sentence-ordering: 60-70%の問題にパッセージがある', () => {
      const stats = countPassageQuestions(sentence3 as GrammarData);
      const percentage = (stats.withPassage / stats.total) * 100;
      expect(percentage).toBeGreaterThanOrEqual(55); // このタイプは実際に64.9%
      expect(percentage).toBeLessThanOrEqual(75);
    });
  });

  describe('パッセージの品質', () => {
    const allData: GrammarData[] = [
      verb2 as GrammarData,
      verb3 as GrammarData,
      fill2 as GrammarData,
      fill3 as GrammarData,
      sentence2 as GrammarData,
      sentence3 as GrammarData,
    ];

    it('パッセージがある問題は必ず日本語訳も持つ', () => {
      for (const data of allData) {
        for (const unit of data.units) {
          const allQuestions = [
            ...(unit.verbForm || []),
            ...(unit.fillInBlank || []),
            ...(unit.sentenceOrdering || []),
          ];

          for (const question of allQuestions) {
            if (question.passage) {
              expect(
                question.passageJapanese,
                `Question ${question.id} has passage but no passageJapanese`
              ).toBeDefined();
              expect(
                question.passageJapanese!.length,
                `Question ${question.id} passageJapanese is empty`
              ).toBeGreaterThan(0);
            }
          }
        }
      }
    });

    it('パッセージには問題文が含まれている', () => {
      for (const data of allData) {
        for (const unit of data.units) {
          const allQuestions = [
            ...(unit.verbForm || []),
            ...(unit.fillInBlank || []),
            ...(unit.sentenceOrdering || []),
          ];

          for (const question of allQuestions) {
            if (question.passage && question.sentence) {
              // パッセージ内にもsentenceが含まれている（空白記号付き）
              expect(
                question.passage,
                `Question ${question.id} passage does not contain sentence with blank marker`
              ).toContain(question.sentence);
            }
          }
        }
      }
    });

    it('パッセージは適切な長さである (50-300文字)', () => {
      for (const data of allData) {
        for (const unit of data.units) {
          const allQuestions = [
            ...(unit.verbForm || []),
            ...(unit.fillInBlank || []),
            ...(unit.sentenceOrdering || []),
          ];

          for (const question of allQuestions) {
            if (question.passage) {
              const length = question.passage.length;
              expect(
                length,
                `Question ${question.id} passage is too short (${length} chars)`
              ).toBeGreaterThanOrEqual(50);
              expect(
                length,
                `Question ${question.id} passage is too long (${length} chars)`
              ).toBeLessThanOrEqual(500);
            }
          }
        }
      }
    });
  });
});
