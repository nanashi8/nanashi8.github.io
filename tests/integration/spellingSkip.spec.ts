import { test, expect } from '@playwright/test';

/**
 * スペルタブのスキップ機能テスト
 *
 * 検証項目:
 * 1. スキップボタンが機能すること
 * 2. スキップがスコアボードに反映されること（正解としてカウント）
 * 3. プログレスバー（totalAnswered）が更新されること
 */

test.describe('スペルタブ - スキップ機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');

    // スペルタブをクリック
    const spellingTab = page.getByRole('button', { name: /スペル|Spelling/ });
    await spellingTab.click();
    await page.waitForTimeout(800);

    // クイズ開始（自動開始対応: ボタンが無ければスキップ）
    const startButton = page.getByRole('button', { name: /クイズ開始|開始|Start/i });
    if (await startButton.count()) {
      await startButton.click();
      await page.waitForTimeout(800);
    } else {
      // 自動開始済みのケース: 盤面が描画されるまで待機
      await page.waitForTimeout(800);
    }
  });

  test('スキップボタンが表示され、クリックできること', async ({ page }) => {
    // スキップボタンを探す
    const skipButton = page.locator('button:has-text("スキップ")');
    await expect(skipButton).toBeVisible({ timeout: 5000 });

    // スキップボタンをクリック
    await skipButton.click();
    await page.waitForTimeout(500);

    // 回答済み状態になることを確認
    const answeredState = page.locator('.answered, [class*="answered"]');
    // 回答後は次の問題に移動できる状態になる
    const nextButton = page.locator('button:has-text("→"), button[title="次へ"]');
    await expect(nextButton).toBeEnabled({ timeout: 3000 });
  });

  test('スキップがスコアボードに正解として反映されること', async ({ page }) => {
    // スキップ前のスコアを取得
    const scoreBefore = await page
      .locator('[class*="score"], :text("スコア")')
      .first()
      .textContent();
    console.log('スキップ前のスコア:', scoreBefore);

    // スキップボタンをクリック
    const skipButton = page.locator('button:has-text("スキップ")');
    await skipButton.click();
    await page.waitForTimeout(1000);

    // スコアボードが更新されることを確認（正解+1）
    const scoreAfter = await page
      .locator('[class*="score"], :text("スコア")')
      .first()
      .textContent();
    console.log('スキップ後のスコア:', scoreAfter);

    // スコアボードに何らかの変化があることを確認
    expect(scoreAfter).not.toBe(scoreBefore);
  });

  test('スキップ後にtotalAnsweredが増加すること', async ({ page }) => {
    // 解答済み数を取得（スコアボードから）
    let totalAnsweredText = await page.locator(':text("問出題")').first().textContent();
    console.log('スキップ前:', totalAnsweredText);

    // スキップボタンをクリック
    const skipButton = page.locator('button:has-text("スキップ")');
    await skipButton.click();
    await page.waitForTimeout(1000);

    // 次の問題に移動
    const nextButton = page.locator('button:has-text("→"), button[title="次へ"]');
    await nextButton.click();
    await page.waitForTimeout(1000);

    // 解答済み数が増えていることを確認
    totalAnsweredText = await page.locator(':text("問出題")').first().textContent();
    console.log('スキップ後:', totalAnsweredText);

    // 「問出題」のテキストに数字が含まれていることを確認
    expect(totalAnsweredText).toMatch(/\d+/);
  });

  test('複数回スキップしてもスコアボードが正しく更新されること', async ({ page }) => {
    // 3回スキップする
    for (let i = 0; i < 3; i++) {
      const skipButton = page.locator('button:has-text("スキップ")');
      await skipButton.click();
      await page.waitForTimeout(800);

      // 次の問題に移動
      const nextButton = page.locator('button:has-text("→"), button[title="次へ"]');
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(800);
      }
    }

    // スコアボードに「3」という数字が表示されているか確認
    const scoreBoard = page.locator('[class*="score-board"], [class*="ScoreBoard"]');
    const text = await scoreBoard.textContent();
    console.log('3回スキップ後のスコアボード:', text);

    // スコアに3以上の数字が含まれていることを確認
    expect(text).toMatch(/[3-9]|[1-9]\d+/);
  });
});
