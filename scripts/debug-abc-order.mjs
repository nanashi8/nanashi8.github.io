/**
 * ABC順問題をデバッグするスクリプト
 * ブラウザのコンソールログを収集して、QuestionSchedulerが正しく動作しているか確認
 */

import { chromium } from 'playwright';

async function debugABCOrder() {
  console.log('🔍 ABC順問題のデバッグを開始...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // コンソールログを収集
  const logs = [];
  page.on('console', (msg) => {
    const text = msg.text();
    logs.push(text);
    console.log(`[Browser Console] ${text}`);
  });

  // エラーも収集
  page.on('pageerror', (error) => {
    console.error(`[Browser Error] ${error.message}`);
  });

  try {
    // アプリを開く
    console.log('📱 アプリを開いています...');
    await page.goto('http://localhost:5176', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 暗記タブをクリック
    console.log('🎯 暗記タブをクリック...');
    const memorizationTab = page.locator('button:has-text("暗記")').first();
    await memorizationTab.click();
    await page.waitForTimeout(3000);

    // スケジューラー関連のログをフィルター
    console.log('\n📊 スケジューラー関連のログ:');
    const schedulerLogs = logs.filter(
      (log) =>
        log.includes('QuestionScheduler') ||
        log.includes('MemorizationView') ||
        log.includes('スケジュール')
    );

    if (schedulerLogs.length === 0) {
      console.log('❌ スケジューラーのログが見つかりません！');
      console.log('   → QuestionSchedulerが呼び出されていない可能性があります');
    } else {
      schedulerLogs.forEach((log) => console.log(`   ${log}`));
    }

    // 出題される単語の順序を確認
    console.log('\n📝 出題単語の順序を確認...');
    const wordElements = await page.locator('.text-2xl.font-bold').allTextContents();
    
    if (wordElements.length > 0) {
      console.log(`\n最初の単語: ${wordElements[0]}`);
      
      // 次の単語に進む（10回）
      const displayedWords = [wordElements[0]];
      for (let i = 0; i < 9; i++) {
        // 「覚えた」ボタンをクリック
        const correctButton = page.locator('button:has-text("覚えた")').first();
        if (await correctButton.isVisible()) {
          await correctButton.click();
          await page.waitForTimeout(500);
          
          const newWord = await page.locator('.text-2xl.font-bold').first().textContent();
          displayedWords.push(newWord);
        }
      }

      console.log('\n📋 最初の10単語:');
      displayedWords.forEach((word, index) => {
        console.log(`   ${index + 1}. ${word}`);
      });

      // ABC順かどうか確認
      const sortedWords = [...displayedWords].sort();
      const isABCOrder = JSON.stringify(displayedWords) === JSON.stringify(sortedWords);
      
      if (isABCOrder) {
        console.log('\n❌ ABC順になっています！');
      } else {
        console.log('\n✅ ABC順ではありません（正常）');
      }
    }

    // デバッグ情報を保存
    console.log('\n💾 デバッグ情報を保存...');
    const debugInfo = {
      timestamp: new Date().toISOString(),
      allLogs: logs,
      schedulerLogs,
      displayedWords: wordElements,
    };

    await page.evaluate((info) => {
      console.log('🔍 DEBUG INFO:', JSON.stringify(info, null, 2));
    }, debugInfo);

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }

  console.log('\n✅ デバッグ完了。ブラウザは開いたままにします。');
  console.log('   確認後、Ctrl+Cで終了してください。');

  // ブラウザは開いたまま
  await page.waitForTimeout(60000);
  await browser.close();
}

debugABCOrder().catch(console.error);
