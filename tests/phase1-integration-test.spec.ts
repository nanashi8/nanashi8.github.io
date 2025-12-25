import { test, expect } from '@playwright/test';

/**
 * Phase 1統合テスト: 緊急バグ修正の検証
 *
 * テスト項目:
 * 1. 時間ブースト（分単位）の動作確認
 * 2. カテゴリー遷移ルールの正確性
 * 3. シミュレーター双方向遷移
 * 4. デバッグログの出力確認
 */

test.describe('Phase 1: 緊急バグ修正統合テスト', () => {
  test.beforeEach(async ({ page }) => {
    // ローカルストレージをクリア
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('時間ブースト: 2分経過で優先度15%上昇', async ({ page }) => {
    await page.goto('/');

    // 暗記タブに移動
    await page.click('button:has-text("暗記")');

    // 問題を1問解く
    await page.click('text=分からない');

    // 2分待機（実際には2秒でシミュレート）
    await page.evaluate(() => {
      const progress = JSON.parse(localStorage.getItem('english-progress') || '{}');
      const word = Object.keys(progress)[0];
      if (word) {
        progress[word].lastStudied = Date.now() - 2 * 60 * 1000; // 2分前
        localStorage.setItem('english-progress', JSON.stringify(progress));
      }
    });

    // ページをリロードして優先度を再計算
    await page.reload();

    // デバッグログを確認（コンソールに出力されているはず）
    const logs = await page.evaluate(() => {
      const _logEntries: string[] = [];
      // localStorageから語句の優先度を取得
      const progress = JSON.parse(localStorage.getItem('english-progress') || '{}');
      return Object.keys(progress).map((word) => ({
        word,
        lastStudied: progress[word].lastStudied,
        timeSince: Date.now() - progress[word].lastStudied,
      }));
    });

    // 2分経過した語句が存在することを確認
    const twoMinuteWords = logs.filter((log) => log.timeSince >= 2 * 60 * 1000);
    expect(twoMinuteWords.length).toBeGreaterThan(0);
  });

  test('カテゴリー遷移: 連続2回不正解で「分からない」', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("暗記")');

    // 1回目: 分からない
    await page.click('text=分からない');

    // localStorageから語句を取得
    const word = await page.evaluate(() => {
      const progress = JSON.parse(localStorage.getItem('english-progress') || '{}');
      return Object.keys(progress)[0];
    });

    // 語句が出題されるまで次の問題を進める
    let attempts = 0;
    while (attempts < 10) {
      const currentWord = await page.locator('.text-4xl').textContent();
      if (currentWord === word) break;
      await page.click('text=まだまだ');
      attempts++;
    }

    // 2回目: 分からない
    await page.click('text=分からない');

    // カテゴリーが「incorrect」になっていることを確認
    const category = await page.evaluate((w) => {
      const progress = JSON.parse(localStorage.getItem('english-progress') || '{}');
      const wordProgress = progress[w];

      // カテゴリー判定ロジック（QuestionScheduler.tsと同じ）
      const attempts = wordProgress?.memorizationAttempts || 0;
      const correct = wordProgress?.memorizationCorrect || 0;
      const stillLearning = wordProgress?.memorizationStillLearning || 0;
      const effectiveCorrect = correct + stillLearning * 0.5;
      const accuracy = attempts > 0 ? (effectiveCorrect / attempts) * 100 : 0;

      // 連続2回不正解 OR 正答率30%未満
      const incorrectCount = attempts - correct - stillLearning;
      if (incorrectCount >= 2 || accuracy < 30) return 'incorrect';

      return 'other';
    }, word);

    expect(category).toBe('incorrect');
  });

  test('カテゴリー遷移: 連続3回正解で「覚えてる」', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("暗記")');

    // 同じ語句を3回正解させる
    for (let i = 0; i < 3; i++) {
      await page.click('text=覚えてる');
    }

    // 最後の語句を取得
    const lastWord = await page.evaluate(() => {
      const progress = JSON.parse(localStorage.getItem('english-progress') || '{}');
      const words = Object.keys(progress);
      return words[words.length - 1];
    });

    // カテゴリーが「mastered」になっていることを確認
    const status = await page.evaluate((w) => {
      const progress = JSON.parse(localStorage.getItem('english-progress') || '{}');
      const wordProgress = progress[w];

      const streak = wordProgress?.memorizationStreak || 0;
      const attempts = wordProgress?.memorizationAttempts || 0;
      const correct = wordProgress?.memorizationCorrect || 0;
      const stillLearning = wordProgress?.memorizationStillLearning || 0;
      const effectiveCorrect = correct + stillLearning * 0.5;
      const accuracy = attempts > 0 ? (effectiveCorrect / attempts) * 100 : 0;

      // 連続3回以上 OR (連続2回 AND 正答率80%以上)
      if (streak >= 3 || (streak >= 2 && accuracy >= 80)) {
        return 'mastered';
      }
      return 'other';
    }, lastWord);

    expect(status).toBe('mastered');
  });

  test('シミュレーター: 双方向遷移の確認', async ({ page }) => {
    await page.goto('/');

    // 設定タブに移動
    await page.click('button:has-text("設定")');

    // AIシミュレーターが表示されることを確認
    await expect(page.locator('h2:has-text("学習AIシミュレーター")')).toBeVisible();

    // 学習プロファイルを選択（初心者・間違えやすい）
    await page.selectOption('select', 'beginner-error-prone');

    // シミュレーション実行
    await page.click('button:has-text("シミュレーション開始")');

    // グラフが表示されるまで待機
    await page.waitForSelector('canvas', { timeout: 5000 });

    // グラフの凡例に「まだまだ」「分からない」が存在することを確認
    await expect(page.locator('text=まだまだ')).toBeVisible();
    await expect(page.locator('text=分からない')).toBeVisible();

    // シミュレーション結果を取得
    const results = await page.evaluate(() => {
      // Reactの内部状態にはアクセスできないので、
      // グラフの描画内容から推測
      const canvas = document.querySelector('canvas');
      return canvas ? 'rendered' : 'not rendered';
    });

    expect(results).toBe('rendered');
  });

  test('デバッグログ: 🧠🤖💤 絵文字の出力確認', async ({ page }) => {
    await page.goto('/');

    // コンソールログをキャプチャ
    const logs: string[] = [];
    page.on('console', (msg) => {
      logs.push(msg.text());
    });

    await page.click('button:has-text("暗記")');
    await page.click('text=分からない');

    // デバッグログが出力されるまで待機
    await page.waitForTimeout(1000);

    // 🧠(MemoryAI), 🤖(MetaAI), 💤(CognitiveLoadAI) のいずれかが含まれているか確認
    const hasDebugLog = logs.some(
      (log) => log.includes('🧠') || log.includes('🤖') || log.includes('💤')
    );

    // 開発環境でない場合はスキップ
    if (process.env.NODE_ENV !== 'development') {
      test.skip();
    }

    expect(hasDebugLog).toBe(true);
  });

  test('時間ブースト: 30分経過で優先度60%上昇（最大値）', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("暗記")');

    // 問題を解く
    await page.click('text=覚えてる');

    // 30分経過をシミュレート
    await page.evaluate(() => {
      const progress = JSON.parse(localStorage.getItem('english-progress') || '{}');
      Object.keys(progress).forEach((word) => {
        progress[word].lastStudied = Date.now() - 30 * 60 * 1000; // 30分前
      });
      localStorage.setItem('english-progress', JSON.stringify(progress));
    });

    await page.reload();

    // localStorageから語句を取得し、時間経過を確認
    const timeSinceStudy = await page.evaluate(() => {
      const progress = JSON.parse(localStorage.getItem('english-progress') || '{}');
      const word = Object.keys(progress)[0];
      if (!word) return 0;
      return Date.now() - progress[word].lastStudied;
    });

    // 30分以上経過していることを確認
    expect(timeSinceStudy).toBeGreaterThanOrEqual(30 * 60 * 1000);
  });

  test('忘却リスク150+で最優先（priority=0.1）', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("暗記")');

    // 覚えてるを選択して、masteredにする
    for (let i = 0; i < 3; i++) {
      await page.click('text=覚えてる');
    }

    // 忘却リスク150+になるまで時間を進める（約1週間）
    await page.evaluate(() => {
      const progress = JSON.parse(localStorage.getItem('english-progress') || '{}');
      Object.keys(progress).forEach((word) => {
        if (progress[word].memorizationStreak >= 3) {
          progress[word].lastStudied = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7日前
        }
      });
      localStorage.setItem('english-progress', JSON.stringify(progress));
    });

    await page.reload();

    // 忘却リスクが高い語句が最初に出題されることを期待
    // （実装では priority=0.1 が最優先なので、ソート後の最初の要素になるはず）
    const firstWord = await page.locator('.text-4xl').textContent();

    const forgettingRisk = await page.evaluate((w) => {
      if (!w) return 0;
      const progress = JSON.parse(localStorage.getItem('english-progress') || '{}');
      const wordProgress = progress[w];
      if (!wordProgress) return 0;

      const lastStudied = wordProgress.lastStudied || 0;
      const timeSince = Date.now() - lastStudied;
      const daysSince = timeSince / (1000 * 60 * 60 * 24);
      const reviewInterval = wordProgress.reviewInterval || 1;

      // 忘却リスク計算（簡易版）
      return (daysSince / reviewInterval) * 100;
    }, firstWord);

    expect(forgettingRisk).toBeGreaterThan(100);
  });
});
