/**
 * /分割の学習データと検証
 * ユーザー提供の正解例を基に、パターンを分析・改善
 */

export type SlashSplitExample = {
  id: string;
  original: string;
  expected: string;
  patterns: string[]; // このルールが適用されるパターン
};

/**
 * J_2022_5からの正解例
 */
export const learningExamples: SlashSplitExample[] = [
  {
    id: 'J2022_5_1',
    original: 'One Saturday, a lot of people',
    expected: 'One Saturday, / a lot of people',
    patterns: ['文頭の時間表現+カンマの後']
  },
  {
    id: 'J2022_5_2',
    original: 'He knows that a lot of people around the world',
    expected: 'He knows / that a lot of people / around the world',
    patterns: ['動詞+that節', '前置詞句の前（around）']
  },
  {
    id: 'J2022_5_3',
    original: 'That evening on the Internet,',
    expected: 'That evening / on the Internet, /',
    patterns: ['文頭の時間表現', '前置詞句+カンマの後']
  },
  {
    id: 'J2022_5_4',
    original: 'In some countries,',
    expected: 'In some countries, /',
    patterns: ['文頭の前置詞句+カンマの後']
  },
  {
    id: 'J2022_5_5',
    original: 'The people who live in such countries',
    expected: 'The people / who live / in such countries',
    patterns: ['主語+関係代名詞の前', '関係代名詞節の動詞の後', '前置詞句の前（in）']
  },
  {
    id: 'J2022_5_6',
    original: "When it doesn't rain,",
    expected: "When it doesn't rain, /",
    patterns: ['従属節+カンマの後']
  },
  {
    id: 'J2022_5_7',
    original: "don't grow well. When it rains",
    expected: "don't grow well. When it rains",
    patterns: ['文の途中では新しい文の前に/なし']
  },
  {
    id: 'J2022_5_8',
    original: 'When it rains too much,',
    expected: 'When it rains too much, /',
    patterns: ['従属節+カンマの後']
  },
  {
    id: 'J2022_5_9',
    original: 'From one book,',
    expected: 'From one book, /',
    patterns: ['文頭の前置詞句+カンマの後']
  },
  {
    id: 'J2022_5_10',
    original: 'he learned that there',
    expected: 'he learned / that there',
    patterns: ['動詞+that節']
  },
  {
    id: 'J2022_5_11',
    original: "People in some countries are so poor that they can't buy enough food to eat.",
    expected: "People / in some countries / are so poor / that they can't buy enough food / to eat.",
    patterns: ['主語の後', '前置詞句の前（in）', 'be動詞+補語の後', 'that結果節', 'to不定詞の前']
  },
  {
    id: 'J2022_5_12',
    original: 'That evening, Takuma told his parents and',
    expected: 'That evening, / Takuma told his parents / and',
    patterns: ['文頭の時間表現+カンマの後', '動詞+目的語の後', '接続詞の前']
  },
  {
    id: 'J2022_5_13',
    original: 'you know there is a lot of food to eat',
    expected: 'you know / there is a lot of food / to eat /',
    patterns: ['動詞の後（that省略）', 'there is構文の後', 'to不定詞の前']
  },
  {
    id: 'J2022_5_14',
    original: 'When we eat dinner at home, your mother',
    expected: 'When we eat dinner / at home, / your mother',
    patterns: ['従属節内の動詞+目的語の後', '前置詞句+カンマの後']
  },
  {
    id: 'J2022_5_15',
    original: 'all the food on your plate.',
    expected: 'all the food / on your plate.',
    patterns: ['目的語の後', '前置詞句の前（on）']
  },
  {
    id: 'J2022_5_16',
    original: 'He thought his grandmother was right.',
    expected: 'He thought / his grandmother was right.',
    patterns: ['動詞の後（that省略）']
  },
  {
    id: 'J2022_5_17',
    original: 'He thinks,',
    expected: 'He thinks, /',
    patterns: ['動詞+カンマの後']
  },
  {
    id: 'J2022_5_18',
    original: 'And I hope we can help hungry people in poor countries.',
    expected: 'And I hope / we can help hungry people / in poor countries.',
    patterns: ['動詞の後（that省略）', '動詞+目的語の後', '前置詞句の前（in）']
  }
];

/**
 * パターン分析結果
 */
export const identifiedPatterns = {
  // 既存のパターン（実装済み）
  existing: [
    '接続詞（and/but/or/so）の前',
    '基本的な前置詞句の前',
    'to不定詞の前（一部）'
  ],
  
  // 新しく必要なパターン
  needed: [
    '文頭の時間・場所表現+カンマの後: "One Saturday, /", "That evening, /"',
    '動詞+that節: "knows / that", "learned / that", "hope / (that)"',
    '主語+関係代名詞の前: "The people / who"',
    '関係代名詞節の動詞の後: "who live /"',
    '従属節+カンマの後: "When it rains, /"',
    '主語の後（長い主語）: "People / in some countries"',
    '動詞+目的語の後: "told his parents /"',
    'be動詞+補語の後: "are so poor /"',
    'there is/are構文の後: "there is a lot of food /"',
    '前置詞句の拡張: around, such'
  ]
};

/**
 * 学習の優先順位
 */
export const learningPriority = [
  {
    rank: 1,
    pattern: '文頭の時間・場所表現+カンマの後',
    frequency: 'high',
    examples: ['One Saturday, /', 'That evening, /', 'From one book, /']
  },
  {
    rank: 2,
    pattern: '動詞+that節（省略含む）',
    frequency: 'high',
    examples: ['knows / that', 'learned / that', 'thought / (that)', 'hope / (that)']
  },
  {
    rank: 3,
    pattern: '主語+関係代名詞の前',
    frequency: 'medium',
    examples: ['The people / who', 'The book / which']
  },
  {
    rank: 4,
    pattern: '従属節+カンマの後',
    frequency: 'high',
    examples: ["When it rains, /", "If it's sunny, /"]
  },
  {
    rank: 5,
    pattern: '前置詞句の拡張',
    frequency: 'high',
    examples: ['around the world', 'such countries']
  }
];
