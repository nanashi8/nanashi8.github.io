/**
 * /分割のテストスクリプト
 */

function splitIntoChunks(text: string): string {
  let result = text;
  
  // 1. 文頭の副詞・前置詞句の後に/を挿入（カンマの後）
  result = result.replace(
    /^([A-Z][a-z]+|After [a-z]+|Before [a-z]+|During [a-z]+),\s+/,
    '$1, / '
  );
  
  // 2. 接続詞の前に/を挿入
  result = result.replace(
    /\s+(and|but|or|so|because|if|when|while|although|though)\s+/gi,
    ' / $1 '
  );
  
  // 3. 前置詞句の前に/を挿入（ただしhave toなどは除外）
  const preps = 'at|in|on|by|from|for|with|about|of|during|after|before|around|per';
  result = result.replace(
    new RegExp(`\\s+(${preps})\\s+`, 'gi'),
    ' / $1 '
  );
  
  // 4. to不定詞の前に/を挿入（ただしhave to, want to, need toなどは除外）
  result = result.replace(
    /(?<!have|want|need|try|going|used)\s+to\s+/gi,
    ' / to '
  );

  // 5. 連続する/を1つにまとめる
  result = result.replace(/\s*\/\s*\/+\s*/g, ' / ');
  
  // 6. 文頭の/を削除
  result = result.replace(/^\s*\/\s*/, '');
  
  // 7. 文末の/を削除（句読点の前）
  result = result.replace(/\s*\/\s*([.!?,;:])/, '$1');
  
  // 8. スペースを整理
  result = result.replace(/\s+/g, ' ').trim();
  
  return result;
}

// テストケース
const slashSplitTestCases = [
  "I wake up at seven every morning.",
  "First, I brush my teeth and wash my face.",
  "Then I eat breakfast with my family.",
  "I usually have toast and juice.",
  "After breakfast, I get my bag ready.",
  "I check homework and put books inside.",
  "Finally, I walk to school with friends.",
  "In our city, we have a good zoo, Smile Zoo.",
  "We can give food to them.",
  "It will start at eleven in the morning, and we can enjoy it for thirty minutes.",
  "Right, but I can't join Night Safari because I have to go home by six.",
  "So, if we do that, our entrance fee will be three dollars per person.",
];

console.log("=== /分割テスト ===\n");
slashSplitTestCases.forEach((test, idx) => {
  const result = splitIntoChunks(test);
  console.log(`${idx + 1}. 入力: ${test}`);
  console.log(`   出力: ${result}`);
  console.log();
});
