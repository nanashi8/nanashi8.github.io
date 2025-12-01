import { test, expect } from '@playwright/test';

/**
 * 超高速煙テスト
 * 
 * 目的: 破壊的変更を最速で検出（10秒以内）
 * 
 * 最小限のテストで最大限の価値を提供
 */

test.describe('超高速煙テスト', () => {
  test('アプリの基本動作確認', async ({ page }) => {
    // 1. アプリ起動確認
    await page.goto('http://localhost:5173');
    await expect(page).toHaveTitle(/英語クイズ|Quiz/);
    
    // 2. 翻訳クイズ開始確認
    const startButton = page.getByRole('button', { name: /クイズ開始|開始|Start/i });
    await startButton.click();
    
    // 3. 問題表示確認（最重要：これが表示されればクイズは動作している）
    await expect(page.locator('[class*="question"]').first()).toBeVisible({ timeout: 3000 });
    
    // 4. JavaScriptエラーがないことを確認
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    
    // 簡単な操作を実行
    await page.waitForTimeout(500);
    
    // エラーチェック
    expect(errors.length).toBe(0);
  });
});
