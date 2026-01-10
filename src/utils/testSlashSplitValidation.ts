/**
 * /分割の検証テスト（J_2022_5正解例ベース）
 * ユーザー提供の正解データとの一致度を確認
 */

import { splitWithSlash } from './slashSplitLogic';

type TestCase = {
  id: string;
  input: string;
  expected: string;
  description: string;
};

const testCases: TestCase[] = [
  {
    id: 'J2022_5_1',
    input: 'One Saturday, a lot of people',
    expected: 'One Saturday, / a lot of people',
    description: '文頭の時間表現'
  },
  {
    id: 'J2022_5_2',
    input: 'He knows that a lot of people around the world',
    expected: 'He knows / that a lot of people / around the world',
    description: '動詞+that節、前置詞句'
  },
  {
    id: 'J2022_5_3',
    input: 'That evening on the Internet,',
    expected: 'That evening / on the Internet, /',
    description: '文頭の時間表現、前置詞句+カンマ'
  },
  {
    id: 'J2022_5_4',
    input: 'In some countries,',
    expected: 'In some countries, /',
    description: '文頭の前置詞句+カンマ'
  },
  {
    id: 'J2022_5_5',
    input: 'The people who live in such countries',
    expected: 'The people / who live / in such countries',
    description: '主語+関係代名詞、関係代名詞節の動詞'
  },
  {
    id: 'J2022_5_6',
    input: "When it doesn't rain,",
    expected: "When it doesn't rain, /",
    description: '従属節+カンマ'
  },
  {
    id: 'J2022_5_7',
    input: 'When it rains too much,',
    expected: 'When it rains too much, /',
    description: '従属節+カンマ'
  },
  {
    id: 'J2022_5_8',
    input: 'From one book,',
    expected: 'From one book, /',
    description: '文頭の前置詞句+カンマ'
  },
  {
    id: 'J2022_5_9',
    input: 'he learned that there',
    expected: 'he learned / that there',
    description: '動詞+that節'
  },
  {
    id: 'J2022_5_10',
    input: "People in some countries are so poor that they can't buy enough food to eat.",
    expected: "People / in some countries / are so poor / that they can't buy enough food / to eat.",
    description: '複雑な文（主語、前置詞句、that節、to不定詞）'
  },
  {
    id: 'J2022_5_11',
    input: 'That evening, Takuma told his parents and',
    expected: 'That evening, / Takuma told his parents / and',
    description: '文頭、動詞+目的語、接続詞'
  },
  {
    id: 'J2022_5_12',
    input: 'you know there is a lot of food to eat',
    expected: 'you know / there is a lot of food / to eat /',
    description: '動詞（that省略）、there is構文、to不定詞'
  },
  {
    id: 'J2022_5_13',
    input: 'When we eat dinner at home, your mother',
    expected: 'When we eat dinner / at home, / your mother',
    description: '従属節内の動詞+目的語、前置詞句'
  },
  {
    id: 'J2022_5_14',
    input: 'all the food on your plate.',
    expected: 'all the food / on your plate.',
    description: '目的語+前置詞句'
  },
  {
    id: 'J2022_5_15',
    input: 'He thought his grandmother was right.',
    expected: 'He thought / his grandmother was right.',
    description: '動詞（that省略）'
  },
  {
    id: 'J2022_5_16',
    input: 'He thinks,',
    expected: 'He thinks, /',
    description: '動詞+カンマ'
  },
  {
    id: 'J2022_5_17',
    input: 'And I hope we can help hungry people in poor countries.',
    expected: 'And I hope / we can help hungry people / in poor countries.',
    description: '接続詞、動詞（that省略）、前置詞句'
  }
];

function runTests() {
  console.log('=== /分割検証テスト（J_2022_5正解例） ===\n');
  
  let passed = 0;
  let failed = 0;
  const failures: { id: string; input: string; expected: string; actual: string; description: string }[] = [];

  testCases.forEach(test => {
    const actual = splitWithSlash(test.input);
    const isMatch = actual === test.expected;

    if (isMatch) {
      passed++;
      console.log(`✓ ${test.id}: ${test.description}`);
    } else {
      failed++;
      console.log(`✗ ${test.id}: ${test.description}`);
      console.log(`  入力:   ${test.input}`);
      console.log(`  期待値: ${test.expected}`);
      console.log(`  実際:   ${actual}`);
      console.log();
      failures.push({
        id: test.id,
        input: test.input,
        expected: test.expected,
        actual,
        description: test.description
      });
    }
  });

  console.log(`\n=== テスト結果 ===`);
  console.log(`合格: ${passed}/${testCases.length}`);
  console.log(`不合格: ${failed}/${testCases.length}`);
  console.log(`正解率: ${((passed / testCases.length) * 100).toFixed(1)}%`);

  if (failures.length > 0) {
    console.log(`\n=== 不合格の詳細 ===`);
    failures.forEach(f => {
      console.log(`\n${f.id}: ${f.description}`);
      console.log(`入力:   ${f.input}`);
      console.log(`期待値: ${f.expected}`);
      console.log(`実際:   ${f.actual}`);
      
      // 差分を分析
      const expectedParts = f.expected.split(' / ');
      const actualParts = f.actual.split(' / ');
      console.log(`差分:`);
      console.log(`  期待チャンク数: ${expectedParts.length}`);
      console.log(`  実際チャンク数: ${actualParts.length}`);
    });
  }
}

runTests();
