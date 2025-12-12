import { describe, it, expect, vi } from 'vitest';

/**
 * コンポーネントテストテンプレート
 * 
 * 使い方:
 * 1. コンポーネント名に置き換え
 * 2. テストケースを追加
 * 3. npm run test で実行
 */

describe('ExampleComponent', () => {
  it('should render title', () => {
    expect(true).toBe(true);
  });

  it('should render button', () => {
    expect(true).toBe(true);
  });

  it('should call onAction when button clicked', () => {
    const mockFn = vi.fn();
    expect(mockFn).toBeDefined();
  });
});
