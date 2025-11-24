/**
 * スコアボードタブ表示の自動テスト
 * 
 * このスクリプトは、スコアボードのタブが全てのビューポートサイズで
 * 正しく表示されるかをテストします。
 */

const puppeteer = require('puppeteer');

const VIEWPORTS = [
  { name: 'デスクトップ (1920x1080)', width: 1920, height: 1080, isMobile: false },
  { name: 'ラップトップ (1366x768)', width: 1366, height: 768, isMobile: false },
  { name: 'タブレット (768x1024)', width: 768, height: 1024, isMobile: true },
  { name: 'モバイル (375x667)', width: 375, height: 667, isMobile: true },
  { name: '小型モバイル (320x568)', width: 320, height: 568, isMobile: true },
];

async function testScoreboard() {
  console.log('🧪 スコアボードタブ表示テスト開始\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();
  
  const results = [];

  for (const viewport of VIEWPORTS) {
    console.log(`\n📱 テスト中: ${viewport.name}`);
    console.log(`   サイズ: ${viewport.width}x${viewport.height}`);

    await page.setViewport({
      width: viewport.width,
      height: viewport.height,
    });

    await page.goto('http://localhost:5175/', {
      waitUntil: 'networkidle0',
    });

    // 和訳クイズを開始
    await page.waitForSelector('.start-btn', { timeout: 5000 });
    await page.click('.start-btn');

    // スコアボードが表示されるまで待機
    await page.waitForSelector('.score-board-compact', { timeout: 5000 });

    // タブの表示状態を確認
    const tabsInfo = await page.evaluate(() => {
      const desktopTabs = document.querySelector('.score-board-tabs:not(.score-tabs-mobile)');
      const mobileTabs = document.querySelector('.score-board-tabs.score-tabs-mobile');

      const desktopVisible = desktopTabs 
        ? window.getComputedStyle(desktopTabs).display !== 'none'
        : false;
      const mobileVisible = mobileTabs 
        ? window.getComputedStyle(mobileTabs).display !== 'none'
        : false;

      const allTabs = document.querySelectorAll('.score-tab');
      const activeTabs = document.querySelectorAll('.score-tab.active');

      return {
        desktopVisible,
        mobileVisible,
        totalTabs: allTabs.length,
        activeTabs: activeTabs.length,
        desktopExists: !!desktopTabs,
        mobileExists: !!mobileTabs,
      };
    });

    // 検証
    const tests = [];

    // テスト1: 正しいタブセットが表示されているか
    if (viewport.isMobile) {
      tests.push({
        name: 'モバイル版表示',
        pass: !tabsInfo.desktopVisible && tabsInfo.mobileVisible,
        expected: 'モバイル版のみ表示',
        actual: `デスクトップ:${tabsInfo.desktopVisible ? '表示' : '非表示'}, モバイル:${tabsInfo.mobileVisible ? '表示' : '非表示'}`,
      });
    } else {
      tests.push({
        name: 'デスクトップ版表示',
        pass: tabsInfo.desktopVisible && !tabsInfo.mobileVisible,
        expected: 'デスクトップ版のみ表示',
        actual: `デスクトップ:${tabsInfo.desktopVisible ? '表示' : '非表示'}, モバイル:${tabsInfo.mobileVisible ? '表示' : '非表示'}`,
      });
    }

    // テスト2: タブボタンが存在するか
    tests.push({
      name: 'タブボタン存在',
      pass: tabsInfo.totalTabs >= 6,
      expected: '6個以上のタブ',
      actual: `${tabsInfo.totalTabs}個`,
    });

    // テスト3: アクティブタブが存在するか
    tests.push({
      name: 'アクティブタブ',
      pass: tabsInfo.activeTabs > 0,
      expected: '1個以上',
      actual: `${tabsInfo.activeTabs}個`,
    });

    // スクリーンショット撮影
    const screenshotPath = `./test-screenshots/${viewport.name.replace(/\s+/g, '-')}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // 結果を保存
    results.push({
      viewport: viewport.name,
      width: viewport.width,
      height: viewport.height,
      tests,
      screenshot: screenshotPath,
    });

    // 結果を表示
    tests.forEach(test => {
      const icon = test.pass ? '✅' : '❌';
      console.log(`   ${icon} ${test.name}: ${test.pass ? 'PASS' : 'FAIL'}`);
      if (!test.pass) {
        console.log(`      期待値: ${test.expected}`);
        console.log(`      実際値: ${test.actual}`);
      }
    });
  }

  // サマリーを表示
  console.log('\n\n📊 テスト結果サマリー\n');
  console.log('=' .repeat(80));

  let totalTests = 0;
  let passedTests = 0;

  results.forEach(result => {
    const allPassed = result.tests.every(t => t.pass);
    const icon = allPassed ? '✅' : '❌';
    
    console.log(`${icon} ${result.viewport} (${result.width}x${result.height})`);
    
    result.tests.forEach(test => {
      totalTests++;
      if (test.pass) passedTests++;
    });
  });

  console.log('=' .repeat(80));
  console.log(`\n合計: ${passedTests}/${totalTests} テスト合格 (${Math.round(passedTests/totalTests*100)}%)\n`);

  if (passedTests === totalTests) {
    console.log('🎉 全てのテストが合格しました！');
  } else {
    console.log('⚠️  一部のテストが失敗しました。上記の詳細を確認してください。');
  }

  await browser.close();
}

// テスト実行
testScoreboard().catch(console.error);
