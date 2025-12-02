import { test, expect } from '@playwright/test';

/**
 * 視覚比較テスト - 本番版 vs Beta版 (Tailwind)
 * 
 * 目的: Tailwind導入後のレイアウト・デザインが本番版と一致することを確認
 */

const PRODUCTION_URL = 'https://nanashi8.github.io/';
const BETA_URL = 'https://nanashi8.github.io/beta/';

test.describe('視覚比較: 本番 vs Beta (Tailwind)', () => {
  
  test('トップページ - 和訳タブ', async ({ page }) => {
    // 本番版のスクリーンショット
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.tab-menu')).toBeVisible();
    await page.screenshot({ path: 'test-results/visual/production-home.png', fullPage: true });
    
    // Beta版のスクリーンショット
    await page.goto(BETA_URL);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.tab-menu')).toBeVisible();
    await page.screenshot({ path: 'test-results/visual/beta-home.png', fullPage: true });
    
    console.log('✅ スクリーンショット保存完了');
    console.log('   本番: test-results/visual/production-home.png');
    console.log('   Beta: test-results/visual/beta-home.png');
  });

  test('設定画面 - ダークモード切り替え', async ({ page }) => {
    // 本番版
    await page.goto(PRODUCTION_URL);
    await page.click('button:has-text("設定")');
    await page.waitForSelector('.theme-toggle-grid');
    await page.screenshot({ path: 'test-results/visual/production-settings.png', fullPage: true });
    
    // Beta版
    await page.goto(BETA_URL);
    await page.click('button:has-text("設定")');
    await page.waitForSelector('.theme-toggle-grid');
    await page.screenshot({ path: 'test-results/visual/beta-settings.png', fullPage: true });
    
    console.log('✅ 設定画面スクリーンショット保存完了');
  });

  test('クイズ画面 - 問題表示', async ({ page }) => {
    // 本番版
    await page.goto(PRODUCTION_URL);
    await page.click('button:has-text("和訳")');
    await page.click('button:has-text("クイズ開始")');
    await page.waitForSelector('.question-card', { timeout: 5000 });
    await page.screenshot({ path: 'test-results/visual/production-quiz.png', fullPage: true });
    
    // Beta版
    await page.goto(BETA_URL);
    await page.click('button:has-text("和訳")');
    await page.click('button:has-text("クイズ開始")');
    await page.waitForSelector('.question-card', { timeout: 5000 });
    await page.screenshot({ path: 'test-results/visual/beta-quiz.png', fullPage: true });
    
    console.log('✅ クイズ画面スクリーンショット保存完了');
  });

  test('ダークモード - 本番 vs Beta', async ({ page }) => {
    // 本番版 - ダークモード有効化
    await page.goto(PRODUCTION_URL);
    await page.click('button:has-text("設定")');
    await page.click('button:has-text("ダーク")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/visual/production-dark.png', fullPage: true });
    
    // Beta版 - ダークモード有効化
    await page.goto(BETA_URL);
    await page.click('button:has-text("設定")');
    await page.click('button:has-text("ダーク")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/visual/beta-dark.png', fullPage: true });
    
    console.log('✅ ダークモードスクリーンショット保存完了');
  });

  test('スコアボード表示', async ({ page }) => {
    // 本番版
    await page.goto(PRODUCTION_URL);
    await page.click('button:has-text("和訳")');
    await page.click('button:has-text("クイズ開始")');
    await page.waitForSelector('.score-board', { timeout: 5000 });
    await page.screenshot({ path: 'test-results/visual/production-scoreboard.png' });
    
    // Beta版
    await page.goto(BETA_URL);
    await page.click('button:has-text("和訳")');
    await page.click('button:has-text("クイズ開始")');
    await page.waitForSelector('.score-board', { timeout: 5000 });
    await page.screenshot({ path: 'test-results/visual/beta-scoreboard.png' });
    
    console.log('✅ スコアボードスクリーンショット保存完了');
  });
});

test.describe('CSSサイズ比較', () => {
  test('ビルドサイズを比較', async ({ page }) => {
    const sizes = {
      production: 0,
      beta: 0
    };

    // 本番版のCSSサイズ取得
    await page.goto(PRODUCTION_URL);
    const prodCssLinks = await page.locator('link[rel="stylesheet"]').all();
    for (const link of prodCssLinks) {
      const href = await link.getAttribute('href');
      if (href) {
        const response = await page.request.get(PRODUCTION_URL + href);
        const body = await response.body();
        sizes.production += body.length;
      }
    }

    // Beta版のCSSサイズ取得
    await page.goto(BETA_URL);
    const betaCssLinks = await page.locator('link[rel="stylesheet"]').all();
    for (const link of betaCssLinks) {
      const href = await link.getAttribute('href');
      if (href) {
        const response = await page.request.get(BETA_URL + href);
        const body = await response.body();
        sizes.beta += body.length;
      }
    }

    console.log('\n📊 CSSサイズ比較:');
    console.log(`   本番: ${(sizes.production / 1024).toFixed(2)} KB`);
    console.log(`   Beta: ${(sizes.beta / 1024).toFixed(2)} KB`);
    console.log(`   差分: ${((sizes.beta - sizes.production) / 1024).toFixed(2)} KB`);
  });
});
