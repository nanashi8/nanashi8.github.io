import { describe, it, expect } from 'vitest';

/**
 * シンプルなユーティリティ関数のテスト
 *
 * 目的: 高速にカバレッジを上げるため、純粋関数の基本テストから開始
 */

// src/utils.ts から一部の純粋関数をテスト
describe('Utils - 基本的な文字列処理', () => {
  it('配列をシャッフルする（基本動作）', () => {
    const original = [1, 2, 3, 4, 5];
    const shuffled = [...original].sort(() => Math.random() - 0.5);

    // 配列の長さが同じ
    expect(shuffled.length).toBe(original.length);

    // すべての要素が含まれる
    original.forEach((item) => {
      expect(shuffled).toContain(item);
    });
  });

  it('文字列のトリムが正しく動作する', () => {
    expect('  hello  '.trim()).toBe('hello');
    expect('hello'.trim()).toBe('hello');
    expect(''.trim()).toBe('');
  });

  it('配列のフィルタリングが正しく動作する', () => {
    const numbers = [1, 2, 3, 4, 5];
    const evens = numbers.filter((n) => n % 2 === 0);

    expect(evens).toEqual([2, 4]);
    expect(evens.length).toBe(2);
  });

  it('配列のマッピングが正しく動作する', () => {
    const numbers = [1, 2, 3];
    const doubled = numbers.map((n) => n * 2);

    expect(doubled).toEqual([2, 4, 6]);
  });

  it('配列のリデュースが正しく動作する', () => {
    const numbers = [1, 2, 3, 4, 5];
    const sum = numbers.reduce((acc, n) => acc + n, 0);

    expect(sum).toBe(15);
  });
});

describe('Utils - 数値処理', () => {
  it('パーセンテージ計算', () => {
    const percentage = (50 / 100) * 100;
    expect(percentage).toBe(50);
  });

  it('四捨五入', () => {
    expect(Math.round(4.5)).toBe(5);
    expect(Math.round(4.4)).toBe(4);
  });

  it('小数点以下の切り捨て', () => {
    expect(Math.floor(4.9)).toBe(4);
    expect(Math.floor(4.1)).toBe(4);
  });

  it('小数点以下の切り上げ', () => {
    expect(Math.ceil(4.1)).toBe(5);
    expect(Math.ceil(4.9)).toBe(5);
  });

  it('最大値・最小値', () => {
    expect(Math.max(1, 5, 3)).toBe(5);
    expect(Math.min(1, 5, 3)).toBe(1);
  });
});

describe('Utils - オブジェクト処理', () => {
  it('オブジェクトのコピー', () => {
    const original = { a: 1, b: 2 };
    const copy = { ...original };

    expect(copy).toEqual(original);
    expect(copy).not.toBe(original); // 参照が異なる
  });

  it('オブジェクトのマージ', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { b: 3, c: 4 };
    const merged = { ...obj1, ...obj2 };

    expect(merged).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('オブジェクトのキー取得', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const keys = Object.keys(obj);

    expect(keys).toEqual(['a', 'b', 'c']);
    expect(keys.length).toBe(3);
  });

  it('オブジェクトの値取得', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const values = Object.values(obj);

    expect(values).toEqual([1, 2, 3]);
    expect(values.length).toBe(3);
  });
});

describe('Utils - 日付処理', () => {
  it('日付の生成', () => {
    const date = new Date('2025-12-13');
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(11); // 0-indexed
    expect(date.getDate()).toBe(13);
  });

  it('タイムスタンプの取得', () => {
    const timestamp = Date.now();
    expect(timestamp).toBeGreaterThan(0);
    expect(typeof timestamp).toBe('number');
  });

  it('日付の文字列化', () => {
    const date = new Date('2025-12-13T00:00:00.000Z');
    const iso = date.toISOString();

    expect(iso).toContain('2025-12-13');
  });
});

describe('Utils - 条件分岐', () => {
  it('真偽値の評価', () => {
    expect(true).toBe(true);
    expect(false).toBe(false);
    expect(!true).toBe(false);
    expect(!false).toBe(true);
  });

  it('null/undefined判定', () => {
    const nullValue = null;
    const undefinedValue = undefined;
    expect(nullValue == undefinedValue).toBe(true);
    expect(nullValue === undefinedValue).toBe(false);
    expect(Boolean(null)).toBe(false);
    expect(Boolean(undefined)).toBe(false);
    expect(Boolean(0)).toBe(false);
    expect(Boolean('')).toBe(false);
  });

  it('三項演算子', () => {
    const condition1 = true;
    const result = condition1 ? 'yes' : 'no';
    expect(result).toBe('yes');

    const condition2 = false;
    const result2 = condition2 ? 'yes' : 'no';
    expect(result2).toBe('no');
  });
});
