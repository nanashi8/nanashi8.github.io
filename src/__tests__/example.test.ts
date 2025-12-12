import { describe, it, expect } from 'vitest';

/**
 * 初期テスト - Vitest セットアップ確認用
 */

describe('Vitest Setup', () => {
  it('should run basic test', () => {
    expect(true).toBe(true);
  });

  it('should calculate numbers correctly', () => {
    expect(1 + 1).toBe(2);
  });

  it('should compare strings', () => {
    const str = 'hello';
    expect(str).toBe('hello');
    expect(str.length).toBe(5);
  });

  it('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  it('should handle objects', () => {
    const obj = { name: 'test', value: 42 };
    expect(obj).toHaveProperty('name');
    expect(obj.value).toBe(42);
  });
});
