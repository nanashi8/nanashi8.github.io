/**
 * ()分割ロジック
 * 従属節を()で、前置詞句を<>で囲む形式で分割
 */

/**
 * 英文の従属節を()、前置詞句を<>で囲んで返す
 * 例: "I walk to school with friends." → "I walk <to school> <with friends>."
 */
export function splitWithParentheses(text: string): string {
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
