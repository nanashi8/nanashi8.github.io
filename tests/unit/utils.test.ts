import { describe, it, expect } from 'vitest';
import { shuffle, formatLocalYYYYMMDD, generateId, generateSpellingPuzzle } from '@/utils';

/**
 * src/utils.ts の純粋関数テスト
 *
 * テスト対象: LocalStorageに依存しない、テストしやすい関数
 */

describe('Utils - shuffle', () => {
  it('配列の長さが変わらない', () => {
    const original = [1, 2, 3, 4, 5];
    const shuffled = shuffle([...original]);

    expect(shuffled.length).toBe(original.length);
  });

  it('すべての要素が保持される', () => {
    const original = [1, 2, 3, 4, 5];
    const shuffled = shuffle([...original]);

    original.forEach((item) => {
      expect(shuffled).toContain(item);
    });
  });

  it('空配列を渡しても正常に動作する', () => {
    const shuffled = shuffle([]);
    expect(shuffled).toEqual([]);
  });

  it('1要素の配列はそのまま', () => {
    const shuffled = shuffle([42]);
    expect(shuffled).toEqual([42]);
  });
});

describe('Utils - formatLocalYYYYMMDD', () => {
  it('日付を YYYY-MM-DD 形式で返す', () => {
    const date = new Date('2025-12-13T15:30:00');
    const formatted = formatLocalYYYYMMDD(date);

    expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('1桁の月と日をゼロパディングする', () => {
    const date = new Date('2025-01-05T00:00:00');
    const formatted = formatLocalYYYYMMDD(date);

    expect(formatted).toBe('2025-01-05');
  });

  it('12月31日を正しくフォーマットする', () => {
    const date = new Date('2025-12-31T23:59:59');
    const formatted = formatLocalYYYYMMDD(date);

    expect(formatted).toBe('2025-12-31');
  });
});

describe('Utils - generateId', () => {
  it('ユニークなIDを生成する', () => {
    const id1 = generateId();
    const id2 = generateId();

    expect(id1).not.toBe(id2);
  });

  it('IDが文字列である', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
  });

  it('IDが空でない', () => {
    const id = generateId();
    expect(id.length).toBeGreaterThan(0);
  });

  it('複数回呼び出しても重複しない', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }

    expect(ids.size).toBe(100);
  });
});

describe('Utils - generateSpellingPuzzle', () => {
  it('スペリングパズルの構造を返す', () => {
    const result = generateSpellingPuzzle('apple');

    expect(result.displayWord).toBeDefined();
    expect(result.missingIndices).toBeDefined();
    expect(result.letterChoices).toBeDefined();
    expect(Array.isArray(result.displayWord)).toBe(true);
    expect(Array.isArray(result.missingIndices)).toBe(true);
    expect(Array.isArray(result.letterChoices)).toBe(true);
  });

  it('displayWordの長さが元の単語と同じ', () => {
    const word = 'hello';
    const result = generateSpellingPuzzle(word);

    expect(result.displayWord.length).toBe(word.length);
  });

  it('空文字列の場合は空配列を返す', () => {
    const result = generateSpellingPuzzle('');

    expect(result.displayWord).toEqual([]);
    expect(result.missingIndices).toEqual([]);
    expect(result.letterChoices).toEqual([]);
  });

  it('missingIndicesが昇順にソートされている', () => {
    const result = generateSpellingPuzzle('testing');

    for (let i = 1; i < result.missingIndices.length; i++) {
      expect(result.missingIndices[i]).toBeGreaterThan(result.missingIndices[i - 1]);
    }
  });

  it('letterChoicesに正解の文字と囮が含まれる', () => {
    const result = generateSpellingPuzzle('apple');

    // letterChoicesが空でない
    expect(result.letterChoices.length).toBeGreaterThan(0);

    // 正解の文字がletterChoicesに含まれる
    result.missingIndices.forEach((idx) => {
      const correctLetter = 'APPLE'[idx];
      expect(result.letterChoices).toContain(correctLetter);
    });
  });
});
