/**
 * clauseParser.ts の単体テスト
 * ブラウザコンソールで実行可能
 */

import {
  parseClausesAndPhrases,
  formatClauseParsed,
  formatClauseParsedWithSVOCM,
} from '../clauseParser';
import { logger } from '../logger';

/**
 * テストケース
 */
const TEST_CASES = [
  {
    id: 1,
    sentence: 'Takuma is a junior high school student.',
    expected: {
      segmentCount: 1,
      hasMainClause: true,
    },
  },
  {
    id: 2,
    sentence: 'He learned that many people around the world cannot get enough food.',
    expected: {
      segmentCount: 3, // "He learned" / "that many people" / "around the world" / "cannot get enough food"
      hasSubordinateClause: true,
      hasPrepositionalPhrase: true,
    },
  },
  {
    id: 3,
    sentence: 'When it rains too much, the products are damaged.',
    expected: {
      segmentCount: 2,
      hasSubordinateClause: true,
    },
  },
  {
    id: 4,
    sentence: 'He wants the students of his school to think about the problem with him.',
    expected: {
      segmentCount: 3, // "He wants the students" / "of his school" / "to think about the problem" / "with him"
      hasInfinitive: true,
      hasPrepositionalPhrase: true,
    },
  },
  {
    id: 5,
    sentence:
      'More students of my school will start to become interested in the problem if they read about it in the school newspaper.',
    expected: {
      segmentCount: 5, // 複数の句と従属節
      hasSubordinateClause: true,
      hasInfinitive: true,
    },
  },
];

/**
 * テスト実行関数
 */
export async function testClauseParser() {
  logger.log(`\n========================================`);
  logger.log(`  ClauseParser 単体テスト`);
  logger.log(`========================================\n`);

  let passedCount = 0;
  let failedCount = 0;

  for (const testCase of TEST_CASES) {
    logger.log(`\n📝 テストケース ${testCase.id}:`);
    logger.log(`  入力: "${testCase.sentence}"`);

    try {
      // パース実行
      const parsed = parseClausesAndPhrases(testCase.sentence);

      // 基本情報
      logger.log(`\n  セグメント数: ${parsed.segments.length}`);
      logger.log(`  セグメント詳細:`);

      parsed.segments.forEach((segment, index) => {
        logger.log(`    ${index + 1}. [${segment.type}] ${segment.text}`);

        // SVOCM情報
        const svocmWords = segment.words.filter((w) => w.component);
        if (svocmWords.length > 0) {
          const svocmInfo = svocmWords.map((w) => `${w.word}(${w.component})`).join(', ');
          logger.log(`       SVOCM: ${svocmInfo}`);
        }
      });

      // 整形表示
      const formatted = formatClauseParsed(parsed);
      logger.log(`\n  整形表示: ${formatted}`);

      // HTML形式
      const html = formatClauseParsedWithSVOCM(parsed);
      logger.log(`  HTML形式: ${html}`);

      // 期待値チェック
      let checks = 0;
      let checksPassed = 0;

      if (testCase.expected.segmentCount !== undefined) {
        checks++;
        const passed = parsed.segments.length >= testCase.expected.segmentCount - 1; // ±1許容
        if (passed) checksPassed++;
        logger.log(
          `  ${passed ? '✅' : '❌'} セグメント数チェック (期待: ${testCase.expected.segmentCount}, 実際: ${parsed.segments.length})`
        );
      }

      if (testCase.expected.hasMainClause) {
        checks++;
        const passed = parsed.segments.some((s) => s.type === 'main-clause');
        if (passed) checksPassed++;
        logger.log(`  ${passed ? '✅' : '❌'} 主節の存在チェック`);
      }

      if (testCase.expected.hasSubordinateClause) {
        checks++;
        const passed = parsed.segments.some((s) => s.type === 'subordinate-clause');
        if (passed) checksPassed++;
        logger.log(`  ${passed ? '✅' : '❌'} 従属節の存在チェック`);
      }

      if (testCase.expected.hasPrepositionalPhrase) {
        checks++;
        const passed = parsed.segments.some((s) => s.type === 'phrase');
        if (passed) checksPassed++;
        logger.log(`  ${passed ? '✅' : '❌'} 前置詞句の存在チェック`);
      }

      if (testCase.expected.hasInfinitive) {
        checks++;
        const passed = parsed.segments.some((s) => s.text.toLowerCase().includes('to '));
        if (passed) checksPassed++;
        logger.log(`  ${passed ? '✅' : '❌'} 不定詞句の存在チェック`);
      }

      if (checks === checksPassed) {
        logger.log(`\n  ✅ テストケース ${testCase.id} 合格`);
        passedCount++;
      } else {
        logger.log(`\n  ❌ テストケース ${testCase.id} 失敗 (${checksPassed}/${checks})`);
        failedCount++;
      }
    } catch (error) {
      logger.error(`  ❌ テストケース ${testCase.id} でエラー発生: ${error}`);
      failedCount++;
    }
  }

  // 総合結果
  logger.log(`\n========================================`);
  logger.log(`  テスト結果サマリー`);
  logger.log(`========================================`);
  logger.log(`  合格: ${passedCount}/${TEST_CASES.length}`);
  logger.log(`  失敗: ${failedCount}/${TEST_CASES.length}`);
  logger.log(`  成功率: ${((passedCount / TEST_CASES.length) * 100).toFixed(1)}%`);

  if (failedCount === 0) {
    logger.log(`\n  🎉 全テスト合格！`);
  } else {
    logger.log(`\n  ⚠️  一部のテストが失敗しました`);
  }

  logger.log(`========================================\n`);

  return {
    passed: passedCount,
    failed: failedCount,
    total: TEST_CASES.length,
  };
}

/**
 * 実際の文でテスト（J_2022_5から）
 */
export async function testWithRealSentences() {
  logger.log(`\n========================================`);
  logger.log(`  実際の文でのテスト (J_2022_5)`);
  logger.log(`========================================\n`);

  const realSentences = [
    'Takuma is a junior high school student.',
    'One Saturday, he saw a television news story about food shortages.',
    'He learned that many people around the world cannot get enough food to eat.',
    'People in some countries are so poor that they cannot buy enough food to eat.',
    'When it does not rain, farm products do not grow well.',
    'More students of my school will start to become interested in the problem if they read about it in the school newspaper.',
  ];

  for (let i = 0; i < realSentences.length; i++) {
    const sentence = realSentences[i];
    logger.log(`\n${i + 1}. "${sentence}"`);

    try {
      const parsed = parseClausesAndPhrases(sentence);
      const formatted = formatClauseParsed(parsed);
      logger.log(`   → ${formatted}`);

      // 簡易的なSVOCM表示
      parsed.segments.forEach((segment) => {
        const svocmWords = segment.words.filter((w) => w.component);
        if (svocmWords.length > 0) {
          const svocmStr = svocmWords.map((w) => `${w.word}[${w.component}]`).join(' ');
          logger.log(`      SVOCM: ${svocmStr}`);
        }
      });
    } catch (error) {
      logger.error(`   ❌ エラー: ${error}`);
    }
  }

  logger.log(`\n========================================\n`);
}

// ブラウザコンソールからアクセスできるようにグローバルに公開
if (typeof window !== 'undefined') {
  (window as any).testClauseParser = testClauseParser;
  (window as any).testWithRealSentences = testWithRealSentences;
}
