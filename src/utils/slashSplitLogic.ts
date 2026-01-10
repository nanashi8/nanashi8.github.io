/**
 * /分割ロジック（学習改善版 v3）
 * ルール整理:
 * 1. /は句と節の境界（<>と()が/になったイメージ）
 * 2. カンマで終わる文 → , /
 * 3. ピリオドで終わる文 → /なし
 * 4. be動詞+形容詞 → 1つの塊
 * 5. that節内部は切らない
 */

/**
 * 英文を句・節の境界で分割し、/ 区切りで返す
 */
export function splitWithSlash(text: string): string {
  let result = text;

  // 0. 熟語を保護（分割させない）
  const idioms = [
    'a lot of', 'a number of', 'a kind of', 'a sort of', 'a type of',
    'a couple of', 'a bit of', 'a piece of', 'a pair of', 'a group of',
    'plenty of', 'lots of', 'most of', 'some of', 'all of', 'many of',
    'each of', 'both of', 'none of', 'several of', 'few of', 'a few of'
  ];
  const protectedPhrases: string[] = [];
  idioms.forEach((idiom, idx) => {
    const marker = `__IDIOM_${idx}__`;
    const regex = new RegExp(idiom.replace(/\s+/g, '\\s+'), 'gi');
    result = result.replace(regex, (match) => {
      protectedPhrases.push(match);
      return marker;
    });
  });

  // 1. 文頭の時間・場所表現+カンマの後に/
  result = result.replace(
    /^([A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)*),\s+/,
    '$1, / '
  );

  // 2. カンマの後に/を追加
  // - 後ろに小文字の単語が続く場合
  // - 文末のカンマ（後ろに何もない）
  result = result.replace(/,\s+([a-z])/g, ', / $1');
  result = result.replace(/,\s*$/gm, ', /');

  // 3. 伝聞・思考動詞+that節
  const reportThinkVerbs = 'know|knows|knew|learn|learned|learnt|think|thinks|thought|hope|hopes|hoped|say|says|said|tell|tells|told|believe|believes|believed|feel|feels|felt|find|finds|found|see|sees|saw|hear|hears|heard|understand|understands|understood|realize|realizes|realized|imagine|imagines|imagined|suppose|supposes|supposed|expect|expects|expected|remember|remembers|remembered|forget|forgets|forgot|wonder|wonders|wondered|guess|guesses|guessed|assume|assumes|assumed';

  // that明示の場合
  result = result.replace(
    new RegExp(`\\b(${reportThinkVerbs})\\s+that\\s+`, 'gi'),
    '$1 / that '
  );

  // that省略の場合（動詞の後に主語+be動詞/助動詞が来る）
  result = result.replace(
    new RegExp(`\\b(${reportThinkVerbs})\\s+([a-z]+|there|[A-Z][a-z]+|his|her|their|my|your)\\s+(is|are|was|were|can|will|would|should|could|may|might|must|has|have|had|am)\\b`, 'gi'),
    '$1 / $2 $3'
  );

  // that省略（所有格+名詞の場合、例: his grandmother）
  result = result.replace(
    new RegExp(`\\b(${reportThinkVerbs})\\s+(his|her|their|my|your|our)\\s+([a-z]+)\\s+(is|are|was|were|can|will|would|should|could)\\b`, 'gi'),
    '$1 / $2 $3 $4'
  );

  // 4. 主語+関係代名詞の前に/
  result = result.replace(
    /\b([A-Z][a-z]+(?:\s+[a-z]+)*)\s+(who|which|that)\s+/g,
    '$1 / $2 '
  );

  // 5. 関係代名詞節の動詞の後に/（前置詞句が来る場合のみ）
  result = result.replace(
    /\b(who|which)\s+([a-z]+)\s+(in|at|on|from|to|with|for|by|about|of|during|after|before|around|near)\s+/gi,
    '$1 $2 / $3 '
  );

  // 6. 前置詞句+be動詞の間に/
  result = result.replace(
    /\s+(in|at|on|from|to|with|for|by|about|of|during|after|before|around|near|under|over)\s+([a-z]+(?:\s+[a-z]+)*)\s+(am|is|are|was|were|be|been|being)\b/gi,
    ' $1 $2 / $3'
  );

  // 6-1. be動詞+副詞+形容詞の塊化（"are / so poor" → "are so poor"）
  result = result.replace(
    /\b(am|is|are|was|were|be|been|being)\s*\/\s+(so|very|too|quite|really|extremely)\s+([a-z]+)\b/gi,
    '$1 $2 $3'
  );

  // 7. 接続詞の前に/（順接のand, but等）
  // soは接続詞のみ（"so poor"の副詞soは除外）
  // andは必ず/を追加（後ろにスペースがなくてもOK）
  result = result.replace(/\s+and(\s+|$)/gi, ' / and$1');
  result = result.replace(/\s+(but|or)(\s+|$)/gi, ' / $1$2');
  // soの後に主語（大文字始まり、代名詞、that）が来る場合のみ接続詞として/を追加
  result = result.replace(/\s+so\s+([A-Z]|that\s|I\s|he\s|she\s|we\s|they\s|it\s|you\s|there\s)/g, ' / so $1');

  // 8. 前置詞句の前に/（句の境界）
  const preps = 'at|in|on|by|from|for|with|about|of|during|after|before|around|per|near|under|over|through|into|onto|upon|without|within|among|between|behind|beside|below|above|across|along|against|beyond|past|since|until|towards?|throughout|underneath';
  result = result.replace(
    new RegExp(`(?<!/)\\s+(${preps})\\s+`, 'gi'),
    ' / $1 '
  );

  // 9. to不定詞の前に/（句の境界、have to等は除外）
  result = result.replace(
    new RegExp('(?<!have|want|need|try|going|used|able|ought)(?<!/)\\s+to\\s+([a-z]+)', 'gi'),
    ' / to $1'
  );

  // 10. 熟語を復元
  protectedPhrases.forEach((phrase, idx) => {
    result = result.replace(`__IDIOM_${idx}__`, phrase);
  });

  // 11. 連続する/を1つにまとめる
  result = result.replace(/\s*\/\s*\/+\s*/g, ' / ');

  // 12. 文頭の/を削除
  result = result.replace(/^\s*\/\s*/, '');

  // 13. 文末の/を削除（ピリオドの前）
  result = result.replace(/\s*\/\s*([.!?;:])/, '$1');

  // 14. カンマ直前の/を削除（カンマの後だけ/を残す）
  result = result.replace(/\s*\/\s*,/, ',');

  // 15. スペースを整理
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}
