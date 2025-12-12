/**
 * スコアボード表示内容のテストユーティリティ
 *
 * 使い方：
 * ブラウザのコンソールで以下を実行:
 * import { runScoreBoardTests } from './tests/scoreBoardTests';
 * runScoreBoardTests();
 */

import { logger } from '@/utils/logger';

import {
  getTodayStats,
  getTotalAnsweredCount,
  getUniqueQuestionedWordsCount,
  getTotalMasteredWordsCount,
  getRetentionRateWithAI,
  getDetailedRetentionStats,
  getNearMasteryStats,
} from '../progressStorage';
import { calculateGoalProgress, generateGoalMessage } from '../goalSimulator';
import { getAlertSummary } from '../forgettingAlert';

type TestResult = {
  name: string;
  passed: boolean;
  message: string;
  data?: any;
};

/**
 * スコアボードの全テストを実行
 */
export function runScoreBoardTests(): void {
  logger.log('=== スコアボード表示内容テスト開始 ===\n');

  const results: TestResult[] = [];

  // テスト1: 本日統計の取得
  results.push(testTodayStats());

  // テスト2: 累計回答数の取得
  results.push(testTotalAnswered());

  // テスト3: 定着数の取得
  results.push(testMasteredCount());

  // テスト4: 定着率の計算
  results.push(testRetentionRate());

  // テスト5: 詳細な定着率統計
  results.push(testDetailedRetentionStats());

  // テスト6: 定着予測統計
  results.push(testNearMasteryStats());

  // テスト7: 目標達成情報
  results.push(testGoalProgress());

  // テスト8: 忘却アラート
  results.push(testAlertSummary());

  // テスト9: パーセンテージの一貫性チェック
  results.push(testPercentageConsistency());

  // テスト10: データ範囲の妥当性チェック
  results.push(testDataRanges());

  // 結果のサマリー
  logger.log('\n=== テスト結果サマリー ===');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  logger.log(`✅ 成功: ${passed}件`);
  logger.log(`❌ 失敗: ${failed}件`);
  logger.log(`📊 合計: ${results.length}件\n`);

  // 失敗したテストの詳細
  const failedTests = results.filter((r) => !r.passed);
  if (failedTests.length > 0) {
    logger.log('=== 失敗したテスト ===');
    failedTests.forEach((test) => {
      logger.error(`❌ ${test.name}`);
      logger.error(`   ${test.message}`);
      if (test.data) {
        logger.error('   データ:', test.data);
      }
    });
  }

  logger.log('\n=== 全データダンプ ===');
  results.forEach((test) => {
    if (test.data) {
      logger.log(`${test.name}:`, test.data);
    }
  });
}

/**
 * テスト1: 本日統計の取得
 */
function testTodayStats(): TestResult {
  try {
    const translationStats = getTodayStats('translation');
    const spellingStats = getTodayStats('spelling');
    const readingStats = getTodayStats('reading');

    // データの妥当性チェック
    const isValid =
      translationStats.todayAccuracy >= 0 &&
      translationStats.todayAccuracy <= 100 &&
      translationStats.todayTotalAnswered >= 0 &&
      spellingStats.todayAccuracy >= 0 &&
      spellingStats.todayAccuracy <= 100 &&
      spellingStats.todayTotalAnswered >= 0 &&
      readingStats.todayAccuracy >= 0 &&
      readingStats.todayAccuracy <= 100 &&
      readingStats.todayTotalAnswered >= 0;

    if (!isValid) {
      return {
        name: '本日統計の取得',
        passed: false,
        message: '正答率が0-100%の範囲外、または回答数が負の値',
        data: { translationStats, spellingStats, readingStats },
      };
    }

    return {
      name: '本日統計の取得',
      passed: true,
      message: '✅ 正常に取得できました',
      data: { translationStats, spellingStats, readingStats },
    };
  } catch (error) {
    return {
      name: '本日統計の取得',
      passed: false,
      message: `エラー: ${error}`,
      data: null,
    };
  }
}

/**
 * テスト2: 累計回答数の取得
 */
function testTotalAnswered(): TestResult {
  try {
    const translationCount = getTotalAnsweredCount('translation');
    const spellingCount = getTotalAnsweredCount('spelling');
    const readingCount = getTotalAnsweredCount('reading');

    const isValid = translationCount >= 0 && spellingCount >= 0 && readingCount >= 0;

    if (!isValid) {
      return {
        name: '累計回答数の取得',
        passed: false,
        message: '回答数が負の値',
        data: { translationCount, spellingCount, readingCount },
      };
    }

    return {
      name: '累計回答数の取得',
      passed: true,
      message: '✅ 正常に取得できました',
      data: { translationCount, spellingCount, readingCount },
    };
  } catch (error) {
    return {
      name: '累計回答数の取得',
      passed: false,
      message: `エラー: ${error}`,
      data: null,
    };
  }
}

/**
 * テスト3: 定着数の取得
 */
function testMasteredCount(): TestResult {
  try {
    const masteredCount = getTotalMasteredWordsCount();
    const uniqueQuestionedCount = getUniqueQuestionedWordsCount();

    const isValid =
      masteredCount >= 0 && uniqueQuestionedCount >= 0 && masteredCount <= uniqueQuestionedCount; // 定着数は出題数以下

    if (!isValid) {
      return {
        name: '定着数の取得',
        passed: false,
        message: '定着数が出題数を超えている、または負の値',
        data: { masteredCount, uniqueQuestionedCount },
      };
    }

    return {
      name: '定着数の取得',
      passed: true,
      message: '✅ 正常に取得できました',
      data: { masteredCount, uniqueQuestionedCount },
    };
  } catch (error) {
    return {
      name: '定着数の取得',
      passed: false,
      message: `エラー: ${error}`,
      data: null,
    };
  }
}

/**
 * テスト4: 定着率の計算
 */
function testRetentionRate(): TestResult {
  try {
    const { retentionRate, appearedCount } = getRetentionRateWithAI();
    const masteredCount = getTotalMasteredWordsCount();

    const isValid =
      retentionRate >= 0 &&
      retentionRate <= 100 &&
      appearedCount >= 0 &&
      masteredCount <= appearedCount;

    if (!isValid) {
      return {
        name: '定着率の計算',
        passed: false,
        message: '定着率が0-100%の範囲外、または定着数が出現数を超えている',
        data: { retentionRate, appearedCount, masteredCount },
      };
    }

    // 定着率の計算が正しいかチェック
    const expectedRate = appearedCount > 0 ? Math.round((masteredCount / appearedCount) * 100) : 0;
    if (Math.abs(retentionRate - expectedRate) > 1) {
      // 1%の誤差は許容
      return {
        name: '定着率の計算',
        passed: false,
        message: `定着率の計算が不正確: 期待値=${expectedRate}%, 実際=${retentionRate}%`,
        data: { retentionRate, expectedRate, appearedCount, masteredCount },
      };
    }

    return {
      name: '定着率の計算',
      passed: true,
      message: '✅ 正常に計算されました',
      data: { retentionRate, appearedCount, masteredCount },
    };
  } catch (error) {
    return {
      name: '定着率の計算',
      passed: false,
      message: `エラー: ${error}`,
      data: null,
    };
  }
}

/**
 * テスト5: 詳細な定着率統計
 */
function testDetailedRetentionStats(): TestResult {
  try {
    const stats = getDetailedRetentionStats();

    // パーセンテージの合計が100%になるかチェック
    const percentageSum =
      stats.masteredPercentage + stats.learningPercentage + stats.strugglingPercentage;
    const countSum = stats.masteredCount + stats.learningCount + stats.strugglingCount;

    const isValid =
      stats.appearedWords >= 0 &&
      stats.masteredCount >= 0 &&
      stats.learningCount >= 0 &&
      stats.strugglingCount >= 0 &&
      stats.basicRetentionRate >= 0 &&
      stats.basicRetentionRate <= 100 &&
      stats.weightedRetentionRate >= 0 &&
      stats.weightedRetentionRate <= 100 &&
      countSum === stats.appearedWords &&
      Math.abs(percentageSum - 100) <= 1; // 1%の誤差は許容（四捨五入のため）

    if (!isValid) {
      return {
        name: '詳細な定着率統計',
        passed: false,
        message: `データの整合性エラー: パーセンテージ合計=${percentageSum}%, カウント合計=${countSum}, 出現単語=${stats.appearedWords}`,
        data: stats,
      };
    }

    return {
      name: '詳細な定着率統計',
      passed: true,
      message: '✅ 正常に取得できました',
      data: stats,
    };
  } catch (error) {
    return {
      name: '詳細な定着率統計',
      passed: false,
      message: `エラー: ${error}`,
      data: null,
    };
  }
}

/**
 * テスト6: 定着予測統計
 */
function testNearMasteryStats(): TestResult {
  try {
    const stats = getNearMasteryStats();

    const isValid =
      stats.nearMasteryCount >= 0 && stats.longTermMemoryCount >= 0 && stats.superMemoryCount >= 0;

    if (!isValid) {
      return {
        name: '定着予測統計',
        passed: false,
        message: 'カウント値が負の値',
        data: stats,
      };
    }

    return {
      name: '定着予測統計',
      passed: true,
      message: '✅ 正常に取得できました',
      data: stats,
    };
  } catch (error) {
    return {
      name: '定着予測統計',
      passed: false,
      message: `エラー: ${error}`,
      data: null,
    };
  }
}

/**
 * テスト7: 目標達成情報
 */
function testGoalProgress(): TestResult {
  try {
    const progress = calculateGoalProgress();
    const message = generateGoalMessage(false);

    const isValid =
      progress.overallProgress >= 0 &&
      progress.overallProgress <= 100 &&
      progress.estimatedDaysToAchieve >= 0 &&
      progress.goal.name.length > 0 &&
      message.length > 0;

    if (!isValid) {
      return {
        name: '目標達成情報',
        passed: false,
        message: '進捗率が0-100%の範囲外、または推定日数が負の値',
        data: { progress, message },
      };
    }

    return {
      name: '目標達成情報',
      passed: true,
      message: '✅ 正常に取得できました',
      data: { progress, message },
    };
  } catch (error) {
    return {
      name: '目標達成情報',
      passed: false,
      message: `エラー: ${error}`,
      data: null,
    };
  }
}

/**
 * テスト8: 忘却アラート
 */
function testAlertSummary(): TestResult {
  try {
    const summary = getAlertSummary();

    const isValid = summary.todayReviewCount >= 0 && summary.critical >= 0 && summary.total >= 0;

    if (!isValid) {
      return {
        name: '忘却アラート',
        passed: false,
        message: 'カウント値が負の値',
        data: summary,
      };
    }

    return {
      name: '忘却アラート',
      passed: true,
      message: '✅ 正常に取得できました',
      data: summary,
    };
  } catch (error) {
    return {
      name: '忘却アラート',
      passed: false,
      message: `エラー: ${error}`,
      data: null,
    };
  }
}

/**
 * テスト9: パーセンテージの一貫性チェック
 */
function testPercentageConsistency(): TestResult {
  try {
    const detailedStats = getDetailedRetentionStats();
    const { retentionRate, appearedCount } = getRetentionRateWithAI();
    const masteredCount = getTotalMasteredWordsCount();

    // 基本定着率と計算された定着率が一致するかチェック
    const calculatedRate =
      appearedCount > 0 ? Math.round((masteredCount / appearedCount) * 100) : 0;
    const isBasicRateConsistent = Math.abs(detailedStats.basicRetentionRate - calculatedRate) <= 1;
    const isMainRateConsistent = Math.abs(retentionRate - calculatedRate) <= 1;

    if (!isBasicRateConsistent || !isMainRateConsistent) {
      return {
        name: 'パーセンテージの一貫性',
        passed: false,
        message: `定着率の計算に矛盾: 基本=${detailedStats.basicRetentionRate}%, メイン=${retentionRate}%, 計算値=${calculatedRate}%`,
        data: { detailedStats, retentionRate, calculatedRate, masteredCount, appearedCount },
      };
    }

    return {
      name: 'パーセンテージの一貫性',
      passed: true,
      message: '✅ 一貫性が確認されました',
      data: {
        basicRate: detailedStats.basicRetentionRate,
        mainRate: retentionRate,
        calculatedRate,
      },
    };
  } catch (error) {
    return {
      name: 'パーセンテージの一貫性',
      passed: false,
      message: `エラー: ${error}`,
      data: null,
    };
  }
}

/**
 * テスト10: データ範囲の妥当性チェック
 */
function testDataRanges(): TestResult {
  try {
    const detailedStats = getDetailedRetentionStats();
    const { appearedCount } = getRetentionRateWithAI();
    const uniqueQuestionedCount = getUniqueQuestionedWordsCount();
    const masteredCount = getTotalMasteredWordsCount();

    // 全ての単語数が4700以下（問題集の総数）であることを確認
    const MAX_WORDS = 4700;
    const isWithinRange =
      appearedCount <= MAX_WORDS &&
      uniqueQuestionedCount <= MAX_WORDS &&
      masteredCount <= MAX_WORDS &&
      detailedStats.appearedWords <= MAX_WORDS;

    if (!isWithinRange) {
      return {
        name: 'データ範囲の妥当性',
        passed: false,
        message: `単語数が上限(${MAX_WORDS})を超えている`,
        data: {
          appearedCount,
          uniqueQuestionedCount,
          masteredCount,
          detailedAppearedWords: detailedStats.appearedWords,
        },
      };
    }

    // 定着数 <= 出現数 <= 出題数 の関係が成り立つかチェック
    const isLogicalOrder = masteredCount <= appearedCount && appearedCount <= uniqueQuestionedCount;

    if (!isLogicalOrder) {
      return {
        name: 'データ範囲の妥当性',
        passed: false,
        message: '定着数、出現数、出題数の関係が不正',
        data: { masteredCount, appearedCount, uniqueQuestionedCount },
      };
    }

    return {
      name: 'データ範囲の妥当性',
      passed: true,
      message: '✅ データ範囲が妥当です',
      data: { masteredCount, appearedCount, uniqueQuestionedCount },
    };
  } catch (error) {
    return {
      name: 'データ範囲の妥当性',
      passed: false,
      message: `エラー: ${error}`,
      data: null,
    };
  }
}

/**
 * 簡易版: スコアボードの現在の表示内容を確認
 */
export function checkCurrentScoreBoardDisplay(
  mode: 'translation' | 'spelling' | 'reading' = 'translation'
): void {
  logger.log(`\n=== スコアボード表示内容確認 (${mode}モード) ===\n`);

  const { todayAccuracy, todayTotalAnswered } = getTodayStats(mode);
  const totalAnsweredCount = getTotalAnsweredCount(mode);
  const masteredCount = getTotalMasteredWordsCount();
  const { retentionRate, appearedCount } = getRetentionRateWithAI();
  const detailedStats = getDetailedRetentionStats();
  const nearMasteryStats = getNearMasteryStats();
  const goalProgress = calculateGoalProgress();
  const alertSummary = getAlertSummary();

  logger.log('📊 基本統計タブ:');
  logger.log(`  本日正答率: ${todayAccuracy}% (${todayTotalAnswered}問)`);
  logger.log(`  定着率: ${retentionRate}% (${masteredCount}/${appearedCount})`);
  logger.log(`  累計回答: ${totalAnsweredCount}`);
  logger.log('');

  logger.log('📊 学習状況の内訳:');
  logger.log(
    `  🟢 完全定着: ${detailedStats.masteredCount}語 (${detailedStats.masteredPercentage}%)`
  );
  logger.log(
    `  🟡 学習中: ${detailedStats.learningCount}語 (${detailedStats.learningPercentage}%)`
  );
  logger.log(
    `  🔴 要復習: ${detailedStats.strugglingCount}語 (${detailedStats.strugglingPercentage}%)`
  );
  logger.log(`  💡 加重定着率: ${detailedStats.weightedRetentionRate}%`);
  logger.log('');

  logger.log('🎯 目標・進捗タブ:');
  if (nearMasteryStats.nearMasteryCount > 0) {
    logger.log(`  🎯 定着間近: ${nearMasteryStats.nearMasteryCount}個`);
  }
  if (nearMasteryStats.longTermMemoryCount > 0) {
    logger.log(`  🧠 長期記憶: ${nearMasteryStats.longTermMemoryCount}個`);
  }
  if (nearMasteryStats.superMemoryCount > 0) {
    logger.log(`  ✨ 完全定着: ${nearMasteryStats.superMemoryCount}個`);
  }
  logger.log(
    `  ${goalProgress.goal.icon} 目標進捗: ${goalProgress.overallProgress}% (${goalProgress.goal.name})`
  );
  if (alertSummary.todayReviewCount >= 1) {
    logger.log(`  ⏰ 要復習: ${alertSummary.todayReviewCount}個`);
  }
  logger.log('');
}

// ブラウザコンソールからアクセスできるようにグローバルに公開
if (typeof window !== 'undefined') {
  (window as any).runScoreBoardTests = runScoreBoardTests;
  (window as any).checkCurrentScoreBoardDisplay = checkCurrentScoreBoardDisplay;
  logger.log('✅ テスト関数を公開しました:');
  logger.log('  - window.runScoreBoardTests()');
  logger.log('  - window.checkCurrentScoreBoardDisplay("translation")');
}
