import { describe, it, expect } from 'vitest';

/**
 * サンプルユニットテスト
 * 実際の関数を後で追加する前のプレースホルダー
 */

describe('Math utilities', () => {
  it('should add two numbers correctly', () => {
    const result = 2 + 3;
    expect(result).toBe(5);
  });

  it('should multiply numbers correctly', () => {
    const result = 4 * 5;
    expect(result).toBe(20);
  });
});

describe('String utilities', () => {
  it('should convert to lowercase', () => {
    const result = 'HELLO'.toLowerCase();
    expect(result).toBe('hello');
  });

  it('should trim whitespace', () => {
    const result = '  test  '.trim();
    expect(result).toBe('test');
  });
});
