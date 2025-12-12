import { describe, it, expect } from 'vitest';

/**
 * ユーティリティ関数テストテンプレート
 * 
 * 使い方:
 * 1. 関数名に置き換え
 * 2. 入出力テストケースを追加
 * 3. npm run test で実行
 */

// テスト対象の関数例
function exampleUtility(input: string): string {
  return input.toUpperCase();
}

describe('exampleUtility', () => {
  it('should convert to uppercase', () => {
    const result = exampleUtility('hello');
    expect(result).toBe('HELLO');
  });

  it('should handle empty string', () => {
    const result = exampleUtility('');
    expect(result).toBe('');
  });

  it('should handle special characters', () => {
    const result = exampleUtility('hello-world_123');
    expect(result).toBe('HELLO-WORLD_123');
  });
});
