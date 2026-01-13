import { splitWithSlash } from './src/utils/slashSplitLogic';

// J2022_5_10のデバッグ
const input1 = "People in some countries are so poor that they can't buy enough food to eat.";
console.log('=== J2022_5_10 ===');
console.log('入力:', input1);
console.log('出力:', splitWithSlash(input1));
console.log('期待:', "People / in some countries / are so poor / that they can't buy enough food / to eat.");
console.log();

// J2022_5_12のデバッグ
const input2 = 'you know there is a lot of food to eat';
console.log('=== J2022_5_12 ===');
console.log('入力:', input2);
console.log('出力:', splitWithSlash(input2));
console.log('期待:', 'you know / there is a lot of food / to eat /');
console.log();

// 簡略版でステップバイステップテスト
console.log('=== ステップバイステップ（簡略版） ===');
let result = 'People in some countries are so poor';
console.log('0. 初期:', result);

// ルール6: 前置詞句+be動詞
result = result.replace(
  /\s+(in|at|on|from|to|with|for|by|about|of|during|after|before|around|near|under|over)\s+([a-z]+(?:\s+[a-z]+)*)\s+(am|is|are|was|were|be|been|being)\b/gi,
  ' $1 $2 / $3'
);
console.log('6. 前置詞句+be動詞:', result);

// ルール6-1: be動詞+副詞+形容詞の塊化
const before61 = result;
result = result.replace(
  /\b(am|is|are|was|were|be|been|being)\s*\/\s+(so|very|too|quite|really|extremely)\s+([a-z]+)\b/gi,
  '$1 $2 $3'
);
console.log('6-1. be動詞+副詞+形容詞:', result, before61 === result ? '(変更なし)' : '(変更あり)');

// ルール7: 接続詞
result = result.replace(/\s+and(\s+|$)/gi, ' / and$1');
result = result.replace(/\s+(but|or)(\s+|$)/gi, ' / $1$2');
result = result.replace(/\s+so\s+([A-Z]|that\s|I\s|he\s|she\s|we\s|they\s|it\s|you\s|there\s)/g, ' / so $1');
console.log('7. 接続詞:', result);

// ルール8: 前置詞句の前
const preps = 'at|in|on|by|from|for|with|about|of|during|after|before|around|per|near|under|over|through|into|onto|upon|without|within|among|between|behind|beside|below|above|across|along|against|beyond|past|since|until|towards?|throughout|underneath';
result = result.replace(
  new RegExp(`(?<!/)\\s+(${preps})\\s+`, 'gi'),
  ' / $1 '
);
console.log('8. 前置詞句の前:', result);
