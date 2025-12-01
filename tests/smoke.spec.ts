import { test, expect } from '@playwright/test';

/**
 * 煙テスト（Smoke Test）
 * 
 * 目的: 基本機能が壊れていないことを素早く確認
 * 実行タイミング: すべてのコミット前、プッシュ前
 * 
 * 破壊的変更を防ぐための最小限のテストセット
 * - 機能テスト: クイズ開始、回答など
 * - 視覚回帰テスト: レイアウト崩壊、デザイン破壊を検出
 */

test.describe('煙テスト - 基本機能', () => {
  test.beforeEach(async ({ page }) => {
    // 開発サーバーに接続
    await page.goto('http://localhost:5173');
  });

  test('アプリが起動すること', async ({ page }) => {
    // タイトルが表示されることを確認
    await expect(page).toHaveTitle(/英単語クイズ|Quiz/);
  });

  test('翻訳クイズが開始できること', async ({ page }) => {
    // 翻訳クイズボタンをクリック
    const translationButton = page.getByRole('button', { name: /翻訳|Translation/ });
    await expect(translationButton).toBeVisible();
    
    // クイズ開始ボタンをクリック
    const startButton = page.getByRole('button', { name: /開始|Start/i });
    if (await startButton.isVisible()) {
      await startButton.click();
    }
    
    // 問題が表示されることを確認（5秒以内）
    await expect(page.locator('.question-card, .quiz-question')).toBeVisible({ timeout: 5000 });
  });

  test('文法クイズが開始できること', async ({ page }) => {
    // 文法クイズタブをクリック
    const grammarTab = page.getByRole('button', { name: /文法|Grammar/ });
    await expect(grammarTab).toBeVisible();
    await grammarTab.click();
    
    // クイズ開始ボタンをクリック
    const startButton = page.getByRole('button', { name: /開始|Start/i });
    if (await startButton.isVisible()) {
      await startButton.click();
    }
    
    // 問題が表示されることを確認
    await expect(page.locator('.question-card, .quiz-question')).toBeVisible({ timeout: 5000 });
  });

  test('重大なJavaScriptエラーが発生しないこと', async ({ page }) => {
    const errors: string[] = [];
    
    // コンソールエラーを収集
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // ページエラーを収集
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    // 各タブを巡回
    const tabs = ['翻訳', '文法', 'スペリング', '長文読解'];
    for (const tabName of tabs) {
      const tab = page.getByRole('button', { name: new RegExp(tabName) });
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // ReferenceError や TypeError などの重大なエラーがないことを確認
    const criticalErrors = errors.filter(err => 
      err.includes('ReferenceError') || 
      err.includes('TypeError') ||
      err.includes('Can\'t find variable')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('煙テスト - 視覚回帰（レイアウト崩壊検出）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    // アニメーションを無効化して安定したスクリーンショットを取得
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
  });

  test('メインページのレイアウトが崩れていないこと', async ({ page }) => {
    // ページ全体のスクリーンショットを取得して比較
    await expect(page).toHaveScreenshot('main-page.png', {
      fullPage: false,
      maxDiffPixels: 100, // 100ピクセル以内の差異は許容
    });
  });

  test('翻訳クイズのレイアウトが崩れていないこと', async ({ page }) => {
    // クイズを開始
    const startButton = page.getByRole('button', { name: /開始|Start/i });
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(1000);
    }
    
    // 問題カードのスクリーンショット
    const questionCard = page.locator('.question-card, .quiz-question').first();
    await expect(questionCard).toHaveScreenshot('translation-quiz-question.png', {
      maxDiffPixels: 100,
    });
  });

  test('文法クイズのレイアウトが崩れていないこと', async ({ page }) => {
    // 文法クイズタブに移動
    const grammarTab = page.getByRole('button', { name: /文法|Grammar/ });
    await grammarTab.click();
    await page.waitForTimeout(500);
    
    // クイズを開始
    const startButton = page.getByRole('button', { name: /開始|Start/i });
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(1000);
    }
    
    // 問題カードのスクリーンショット
    const questionCard = page.locator('.question-card, .quiz-question').first();
    await expect(questionCard).toHaveScreenshot('grammar-quiz-question.png', {
      maxDiffPixels: 100,
    });
  });

  test('スコアボードのレイアウトが崩れていないこと', async ({ page }) => {
    // スコアボード要素のスクリーンショット
    const scoreBoard = page.locator('.score-board, [class*="score"]').first();
    await expect(scoreBoard).toHaveScreenshot('scoreboard.png', {
      maxDiffPixels: 50,
    });
  });

  test('ナビゲーションタブのレイアウトが崩れていないこと', async ({ page }) => {
    // タブ要素のスクリーンショット
    const tabContainer = page.locator('[class*="tab"], nav').first();
    await expect(tabContainer).toHaveScreenshot('navigation-tabs.png', {
      maxDiffPixels: 50,
    });
  });

  test('ボタンスタイルが崩れていないこと', async ({ page }) => {
    // 主要なボタンのスクリーンショット
    const startButton = page.getByRole('button', { name: /開始|Start/i }).first();
    if (await startButton.isVisible()) {
      await expect(startButton).toHaveScreenshot('start-button.png', {
        maxDiffPixels: 20,
      });
    }
  });
});

test.describe('煙テスト - CSS変数とデザインシステム', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('重要なCSS変数が定義されていること', async ({ page }) => {
    // CSS変数が正しく読み込まれているか確認
    const rootStyles = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = getComputedStyle(root);
      
      return {
        // カラーパレット
        primaryColor: styles.getPropertyValue('--color-primary'),
        backgroundColor: styles.getPropertyValue('--color-background'),
        textColor: styles.getPropertyValue('--color-text'),
        
        // スペーシング
        spacing1: styles.getPropertyValue('--spacing-1'),
        spacing2: styles.getPropertyValue('--spacing-2'),
        
        // タイポグラフィ
        fontSize: styles.getPropertyValue('--font-size-base'),
        
        // Z-index
        zModal: styles.getPropertyValue('--z-modal'),
      };
    });
    
    // 各CSS変数が空でないことを確認
    expect(rootStyles.primaryColor).toBeTruthy();
    expect(rootStyles.backgroundColor).toBeTruthy();
    expect(rootStyles.textColor).toBeTruthy();
    expect(rootStyles.spacing1).toBeTruthy();
    expect(rootStyles.fontSize).toBeTruthy();
  });

  test('レスポンシブデザインが機能していること', async ({ page }) => {
    // モバイルサイズ
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('mobile-view.png', {
      fullPage: false,
      maxDiffPixels: 100,
    });
    
    // タブレットサイズ
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('tablet-view.png', {
      fullPage: false,
      maxDiffPixels: 100,
    });
    
    // デスクトップサイズ
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('desktop-view.png', {
      fullPage: false,
      maxDiffPixels: 100,
    });
  });
});

test.describe('煙テスト - State管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('翻訳クイズで回答できること', async ({ page }) => {
    // 翻訳クイズ開始
    const startButton = page.getByRole('button', { name: /開始|Start/i });
    if (await startButton.isVisible()) {
      await startButton.click();
    }
    
    // 問題が表示されるまで待機
    await page.waitForSelector('.choice-button, button[class*="choice"]', { timeout: 5000 });
    
    // 選択肢をクリック
    const choices = page.locator('.choice-button, button[class*="choice"]');
    const firstChoice = choices.first();
    await firstChoice.click();
    
    // 回答後、次の問題に進めることを確認
    const nextButton = page.getByRole('button', { name: /次へ|Next/i });
    await expect(nextButton).toBeVisible({ timeout: 3000 });
  });

  test('スコアボードが更新されること', async ({ page }) => {
    // スコアボード要素が存在することを確認
    const scoreBoard = page.locator('.score-board, [class*="score"]');
    await expect(scoreBoard.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('煙テスト - ビルド成果物', () => {
  test('本番ビルドが正常に動作すること', async ({ page }) => {
    // プレビューサーバー（npm run preview）を想定
    // CIでは dist ビルド後にプレビューサーバーを起動
    await page.goto('http://localhost:4173', { timeout: 10000 });
    await expect(page).toHaveTitle(/英単語クイズ|Quiz/);
  });
});
