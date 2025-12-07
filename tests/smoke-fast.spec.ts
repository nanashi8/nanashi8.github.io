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
    // タイムアウトを60秒に延長（サーバー起動待ち含む）
    test.setTimeout(60000);
    
    // 1. アプリ起動確認（リトライ付き・サーバー起動待ち時間延長）
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    await expect(page).toHaveTitle(/英語クイズ|Quiz/);
    
    // 2. クイズモード選択ボタンが表示されることを確認
    const memorizeButton = page.getByRole('button', { name: /💡 暗記/ });
    await expect(memorizeButton).toBeVisible({ timeout: 5000 });
    
    // 3. 暗記モードをクリック（既に選択されている場合もある）
    const isClickable = await memorizeButton.isEnabled();
    if (isClickable) {
      await memorizeButton.click();
    }
    
    // 4. 問題が表示されることを確認（最重要：これが表示されればクイズは動作している）
    // どんな単語でも良いので、問題カード全体が存在すればOK
    const hasQuestionCard = page.locator('[class*="question"]').first().or(
      page.locator('[class*="card"]').first()
    ).or(
      page.locator('text=/^[A-Za-z]+$/')  // 英単語パターン
    );
    await expect(hasQuestionCard).toBeVisible({ timeout: 10000 });
    
    // 4. JavaScriptエラーがないことを確認
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    
    // 簡単な操作を実行
    await page.waitForTimeout(500);
    
    // エラーチェック
    expect(errors.length).toBe(0);
  });
});
