/**
 * ()分割のテストスクリプト
 */

function renderWithParens(text: string): string {
  let result = text;

  // 1. 従属節を()で囲む
  // that節（単語境界を考慮）
  result = result.replace(
    /\b(that\s+[^,.!?()]+?)([,.!?]|\s+and\s+|\s+but\s+|$)/gi,
    '($1)$2'
  );
  
  // if節
  result = result.replace(
    /\b(if\s+[^,()]+?),/gi,
    '($1),'
  );
  
  // because節
  result = result.replace(
    /\b(because\s+[^,.!?()]+?)([,.!?]|\s+and\s+|\s+but\s+|$)/gi,
    '($1)$2'
  );
  
  // when節
  result = result.replace(
    /\b(when\s+[^,()]+?),/gi,
    '($1),'
  );

  // 2. 前置詞句を<>で囲む（単語境界を考慮）
  const preps = 'at|in|on|by|to|from|for|with|about|of|during|after|before|around|per';
  const dets = 'the|a|an|my|your|his|her|their|our|its|this|that|these|those';
  
  // 前置詞 + 冠詞/所有格 + 名詞句（1-4語）
  result = result.replace(
    new RegExp(`\\b(${preps})\\s+(${dets})\\s+([a-z]+\\s+){0,2}[a-z]+\\b`, 'gi'),
    '<$&>'
  );
  
  // 前置詞 + 固有名詞/数字
  result = result.replace(
    new RegExp(`\\b(${preps})\\s+([A-Z][a-z]+|\\d+)\\b`, 'g'),
    '<$&>'
  );
  
  // 前置詞 + 一般名詞（単数）- 冠詞なしの場合
  result = result.replace(
    new RegExp(`\\b(${preps})\\s+(breakfast|lunch|dinner|school|home|work|bed|friends|them|seven|eight|nine|ten|eleven|twelve)\\b`, 'gi'),
    '<$&>'
  );
  
  // 前置詞 + 数量表現（thirty minutes, two hours など）
  result = result.replace(
    /\b(for|in|after|before|during)\s+([a-z]+\s+[a-z]+)\b/gi,
    '<$&>'
  );

  // 3. 重複や入れ子を整理
  // <<>> -> <>
  result = result.replace(/<+([^<>]+?)>+/g, '<$1>');
  // (()) -> ()
  result = result.replace(/\(+([^()]+?)\)+/g, '($1)');
  
  // 4. 句読点の前の余分なスペースを削除
  result = result.replace(/\s+([,.!?])/g, '$1');
  
  return result;
}

// テストケース
const testCases = [
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

console.log("=== ()分割テスト ===\n");
testCases.forEach((test, idx) => {
  const result = renderWithParens(test);
  console.log(`${idx + 1}. 入力: ${test}`);
  console.log(`   出力: ${result}`);
  console.log();
});
