import { describe, it, expect } from 'vitest';

/**
 * 型安全テストテンプレート
 * 
 * 目的: any 型を除去し、型チェック強化
 * 
 * 使い方:
 * 1. 対象の関数/変数に置き換え
 * 2. 型定義テストを追加
 * 3. npm run test で実行
 */

// 悪い例（修正前）
// function processData(data: any): any {
//   return data.value;
// }

// 良い例（修正後）
interface DataInput {
  value: string;
  timestamp: number;
}

interface DataOutput {
  processed: string;
  timestamp: number;
}

function processData(data: DataInput): DataOutput {
  return {
    processed: data.value.toUpperCase(),
    timestamp: data.timestamp,
  };
}

describe('Type Safety - processData', () => {
  it('should process data with correct types', () => {
    const input: DataInput = {
      value: 'test',
      timestamp: Date.now(),
    };

    const result = processData(input);

    expect(result).toHaveProperty('processed');
    expect(result).toHaveProperty('timestamp');
    expect(typeof result.processed).toBe('string');
    expect(typeof result.timestamp).toBe('number');
  });

  it('should return correct output', () => {
    const input: DataInput = {
      value: 'hello',
      timestamp: 12345,
    };

    const result = processData(input);

    expect(result.processed).toBe('HELLO');
    expect(result.timestamp).toBe(12345);
  });

  it('should handle edge cases', () => {
    const input: DataInput = {
      value: '',
      timestamp: 0,
    };

    const result = processData(input);

    expect(result.processed).toBe('');
    expect(result.timestamp).toBe(0);
  });
});
