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
      timeout: 30000,
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
    // 暗記タブには左右ボタンと中央に単語が表示される
    // 「タップして発音」というtitle属性を持つ要素（=単語表示エリア）を探す
    // 実装の細部（絵文字の有無等）に依存しない堅牢なセレクタ
    const wordDisplay = page.locator('[title*="タップして発音"]').first();
    await expect(wordDisplay).toBeVisible({ timeout: 10000 });

    // 単語エリア内に英単語が含まれることを確認（部分マッチで柔軟に）
    const wordText = await wordDisplay.textContent();
    expect(wordText).toMatch(/[A-Za-z]{3,}/); // 3文字以上の英単語が含まれればOK

    // 4. JavaScriptエラーがないことを確認
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    // 簡単な操作を実行
    await page.waitForTimeout(500);

    // エラーチェック
    expect(errors.length).toBe(0);
  });
});
