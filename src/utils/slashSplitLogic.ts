/**
 * /分割ロジック
 * 接続詞・前置詞句の前に / を挿入する形式で分割
 */

/**
 * 英文を接続詞・前置詞句で分割し、/ 区切りで返す
 * 例: "I walk to school with friends." → "I walk / to school / with friends."
 */
export function splitWithSlash(text: string): string {
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
