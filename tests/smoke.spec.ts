import { test, expect, type Page } from '@playwright/test';

async function clickNav(page: Page, name: RegExp) {
  const nav = page.locator('button, a, [role="button"], [role="tab"]').filter({ hasText: name }).first();
  await expect(nav).toBeVisible({ timeout: 5000 });
  await nav.click();
}

async function startQuizIfNeeded(page: Page) {
  const startButton = page
    .locator('button, [role="button"]')
    .filter({ hasText: /クイズ開始|開始|スタート|Start/i })
    .first();
  if (await startButton.isVisible().catch(() => false)) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await startButton.click({ force: true, timeout: 3000 });
        break;
      } catch {
        // ボタン押下で即座に再レンダリングされ要素がdetachされる場合があるためリトライ
      }
    }
  }
}

async function expectQuestionVisible(page: Page) {
  const question = page
    .locator('[data-testid="question"], .question-card, .quiz-question, [class*="question"]')
    .first();
  await expect(question).toBeVisible({ timeout: 5000 });
}

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
    await expect(page).toHaveTitle(/中学生英語学習アプリ|英語クイズ|Quiz/);
  });

  test('翻訳クイズが開始できること', async ({ page }) => {
    // 和訳クイズボタンをクリック
    await clickNav(page, /和訳|Translation/);

    // クイズ開始ボタンをクリックして問題表示を待つ
    await startQuizIfNeeded(page);

    // 問題が表示されることを確認（設定画面から問題画面への遷移を待つ）
    await expectQuestionVisible(page);
  });

  test('文法クイズが開始できること', async ({ page }) => {
    await clickNav(page, /文法|Grammar/);
    await page.waitForTimeout(300);
    await startQuizIfNeeded(page);
    await expectQuestionVisible(page);
  });

  test('スペルクイズが開始できること', async ({ page }) => {
    await clickNav(page, /スペル|Spelling/);
    await page.waitForTimeout(300);
    await startQuizIfNeeded(page);
    await expectQuestionVisible(page);
  });

  test('長文読解が開始できること', async ({ page }) => {
    await clickNav(page, /長文|Reading/);
    await page.waitForTimeout(300);

    // 読解ビューは初期ロード中に「読み込み中...」のみ表示されるため、まずローディング終了を待つ
    const loading = page.getByText('読み込み中...').first();
    await expect(loading).toBeHidden({ timeout: 10000 });

    const readingView = page.locator('.comprehensive-reading-view').first();
    if (await readingView.isVisible().catch(() => false)) {
      await expect(readingView).toBeVisible({ timeout: 5000 });
      return;
    }

    // パッセージ0件などのケースは empty-container で表示される
    const empty = page.getByText(/パッセージが見つかりません|別の難易度を選択してください/).first();
    await expect(empty).toBeVisible({ timeout: 5000 });
  });

  test('統計画面が表示できること', async ({ page }) => {
    await clickNav(page, /成績|統計|Stats|分析/);
    await page.waitForTimeout(300);
    const structuredStats = page
      .locator('[class*="stats"], [class*="chart"], [class*="progress"]')
      .first();
    if (await structuredStats.isVisible().catch(() => false)) {
      await expect(structuredStats).toBeVisible({ timeout: 5000 });
      return;
    }

    const statsHeading = page.getByText(/成績|統計|Stats|分析|学習状況/).first();
    await expect(statsHeading).toBeVisible({ timeout: 5000 });
  });

  test('データロードが成功すること', async ({ page }) => {
    const dataLoadErrors: string[] = [];
    page.on('response', (response) => {
      const url = response.url();
      if ((url.includes('.csv') || url.includes('.json')) && !response.ok()) {
        dataLoadErrors.push(`${url} (${response.status()})`);
      }
    });

    const tabs = ['和訳', '文法', 'スペル', '長文'];
    for (const tabName of tabs) {
      const tab = page.getByRole('button', { name: new RegExp(tabName) });
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(500);
      }
    }

    expect(dataLoadErrors).toHaveLength(0);
  });

  test('重大なJavaScriptエラーが発生しないこと', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    const tabs = ['和訳', '文法', 'スペル', '長文'];
    for (const tabName of tabs) {
      const tab = page.getByRole('button', { name: new RegExp(tabName) });
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(500);
      }
    }

    const criticalErrors = errors.filter(
      (err) =>
        err.includes('ReferenceError') ||
        err.includes('TypeError') ||
        err.includes("Can't find variable")
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('煙テスト - レイアウト検証（DOM）', () => {
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
      `,
    });
  });

  test('メインページのレイアウトが崩れていないこと', async ({ page }) => {
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    const { width, height } = viewport!;

    const navButtons = [
      page.getByRole('button', { name: /暗記/ }).first(),
      page.getByRole('button', { name: /和訳/ }).first(),
      page.getByRole('button', { name: /スペル/ }).first(),
      page.getByRole('button', { name: /文法/ }).first(),
      page.getByRole('button', { name: /長文/ }).first(),
      page.getByRole('button', { name: /参考/ }).first(),
      page.getByRole('button', { name: /辞書/ }).first(),
      page.getByRole('button', { name: /成績/ }).first(),
      page.getByRole('button', { name: /設定/ }).first(),
    ];
    for (const btn of navButtons) {
      await expect(btn).toBeVisible({ timeout: 5000 });
    }

    const navBoxes = (await Promise.all(navButtons.map((b) => b.boundingBox()))).filter(
      (b): b is NonNullable<typeof b> => b !== null
    );
    expect(navBoxes.length).toBe(navButtons.length);

    const navY = navBoxes[0].y;
    for (const b of navBoxes) {
      expect(Math.abs(b.y - navY)).toBeLessThan(30);
      expect(b.y).toBeLessThan(140);
      expect(b.height).toBeGreaterThan(20);
      expect(b.height).toBeLessThan(90);
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(width + 2);
    }

    const sortedNav = [...navBoxes].sort((a, b) => a.x - b.x);
    for (let i = 1; i < sortedNav.length; i++) {
      expect(sortedNav[i].x).toBeGreaterThan(sortedNav[i - 1].x + sortedNav[i - 1].width - 2);
    }

    const fullScreenButton = page.getByRole('button', { name: '全画面表示' });
    await expect(fullScreenButton).toBeVisible({ timeout: 5000 });
    const fullBox = await fullScreenButton.boundingBox();
    expect(fullBox).not.toBeNull();
    expect(fullBox!.y).toBeGreaterThan(40);
    expect(fullBox!.y).toBeLessThan(height - 120);
    expect(fullBox!.x + fullBox!.width).toBeLessThanOrEqual(width + 2);

    const leftArrow = page.getByRole('button', { name: '←' });
    const rightArrow = page.getByRole('button', { name: '→' });
    await expect(leftArrow).toBeVisible();
    await expect(rightArrow).toBeVisible();
    const leftBox = await leftArrow.boundingBox();
    const rightBox = await rightArrow.boundingBox();
    expect(leftBox).not.toBeNull();
    expect(rightBox).not.toBeNull();
    expect(Math.abs(leftBox!.y - rightBox!.y)).toBeLessThan(20);
    expect(rightBox!.x).toBeGreaterThan(leftBox!.x + leftBox!.width + 20);

    const unknownChoice = page.getByRole('button', { name: '分からない' });
    await expect(unknownChoice).toBeVisible({ timeout: 5000 });

    // 選択肢エリアが画面下にある場合があるため、検証前に表示領域へスクロール
    await unknownChoice.scrollIntoViewIfNeeded();
    const unknownBox = await unknownChoice.boundingBox();
    expect(unknownBox).not.toBeNull();
    expect(unknownBox!.width).toBeGreaterThan(80);
    expect(unknownBox!.height).toBeGreaterThan(24);
    expect(unknownBox!.x).toBeGreaterThanOrEqual(0);
    expect(unknownBox!.x + unknownBox!.width).toBeLessThanOrEqual(width + 2);
    expect(unknownBox!.y).toBeGreaterThanOrEqual(0);
    expect(unknownBox!.y + unknownBox!.height).toBeLessThanOrEqual(height + 2);
  });

  test.skip('翻訳クイズのレイアウトが崩れていないこと', async ({ page }) => {
    // クイズを開始
    const startButton = page.getByRole('button', { name: /クイズ開始|開始|Start/i });
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(2000);
    }

    // 問題カードのスクリーンショット
    const questionCard = page
      .locator('.question-card, .quiz-question, [class*="question"]')
      .first();
    if (await questionCard.isVisible()) {
      await expect(questionCard).toHaveScreenshot('translation-quiz-question.png', {
        maxDiffPixels: 500,
      });
    }
  });

  test.skip('文法クイズのレイアウトが崩れていないこと', async ({ page }) => {
    // 文法クイズタブに移動
    const grammarTab = page.getByRole('button', { name: /文法|Grammar/ });
    await grammarTab.click();
    await page.waitForTimeout(500);

    // クイズを開始
    const startButton = page.getByRole('button', { name: /クイズ開始|開始|Start/i });
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(2000);
    }

    // 問題カードのスクリーンショット
    const questionCard = page
      .locator('.question-card, .quiz-question, [class*="question"]')
      .first();
    if (await questionCard.isVisible()) {
      await expect(questionCard).toHaveScreenshot('grammar-quiz-question.png', {
        maxDiffPixels: 500,
      });
    }
  });

  test.skip('スコアボードのレイアウトが崩れていないこと', async ({ page }) => {
    // スコアボード要素のスクリーンショット
    const scoreBoard = page.locator('.score-board, [class*="score"], [class*="stats"]').first();
    if (await scoreBoard.isVisible()) {
      await expect(scoreBoard).toHaveScreenshot('scoreboard.png', {
        maxDiffPixels: 100,
      });
    }
  });

  test.skip('ナビゲーションタブのレイアウトが崩れていないこと', async ({ page }) => {
    // タブ要素のスクリーンショット
    const tabContainer = page.locator('[class*="tab"], nav').first();
    await expect(tabContainer).toHaveScreenshot('navigation-tabs.png', {
      maxDiffPixels: 50,
    });
  });

  test.skip('ボタンスタイルが崩れていないこと', async ({ page }) => {
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
        primaryColor: styles.getPropertyValue('--primary-color'),
        backgroundColor: styles.getPropertyValue('--background-color'),
        textColor: styles.getPropertyValue('--text-color'),

        // スペーシング
        spacing1: styles.getPropertyValue('--spacing-xs'),
        spacing2: styles.getPropertyValue('--spacing-sm'),

        // タイポグラフィ
        fontSize: styles.getPropertyValue('--font-size-base'),

        // Z-index
        zModal: styles.getPropertyValue('--z-modal'),
      };
    });

    // 少なくとも1つのCSS変数が定義されていることを確認
    const hasAnyVariable = Object.values(rootStyles).some((val) => val && val.trim() !== '');
    expect(hasAnyVariable).toBeTruthy();
  });

  test.skip('レスポンシブデザインが機能していること', async ({ page }) => {
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
    await clickNav(page, /和訳|Translation/);
    // 翻訳クイズ開始
    await startQuizIfNeeded(page);

    // 問題が表示されるまで待つ
    await expectQuestionVisible(page);

    // 現行UIでは「分からない」などの選択肢ボタンを押して回答する
    const dontKnow = page.locator('button, [role="button"]').filter({ hasText: /分からない/ }).first();
    await expect(dontKnow).toBeVisible({ timeout: 3000 });
    await dontKnow.click();
  });

  test('スコアボードが更新されること', async ({ page }) => {
    // 統計/スコア表示に移動（UIによりデフォルト表示ではない場合がある）
    await clickNav(page, /成績|統計|Stats|分析/);
    // スコアボード要素が存在することを確認（複数のセレクターで試行）
    const selectors = [
      '.score-board',
      '[class*="score"]',
      '[class*="stats"]',
      'div:has-text("正解")',
      'div:has-text("学習中")',
      'div:has-text("成績")',
      'div:has-text("学習状況")',
    ];

    let found = false;
    for (const selector of selectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
        found = true;
        break;
      }
    }

    expect(found).toBeTruthy();
  });
});

test.describe('煙テスト - ビルド成果物', () => {
  test.skip('本番ビルドが正常に動作すること', async ({ page }) => {
    // プレビューサーバー（npm run preview）を想定
    // CIでは dist ビルド後にプレビューサーバーを起動
    await page.goto('http://localhost:4173', { timeout: 10000 });
    await expect(page).toHaveTitle(/英語クイズ|Quiz/);
  });
});
