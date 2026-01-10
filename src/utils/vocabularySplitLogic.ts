/**
 * 語句分割ロジック
 * 単語と熟語のまとまりごとに + ボタンを付加する形式で分割
 */

// 句動詞リスト
const phrasal_verbs = [
  'wake up', 'get up', 'get ready', 'go home', 'look forward to', 'take a bus',
  'give food', 'looking forward to', 'take place', 'put on', 'turn on', 'turn off',
  'want to', 'how to', 'where to', 'what to', 'when to', 'don\'t know', 'didn\'t know'
];

// 熟語・慣用表現リスト
const idioms = [
  'have to', 'in front of', 'by the way', 'at least', 'at first',
  'of course', 'for example', 'such as', 'next to', 'a lot of'
];

// 前置詞リスト
const prepositions = [
  'at', 'in', 'on', 'by', 'to', 'from', 'for', 'with', 'about', 'of',
  'during', 'after', 'before', 'around', 'per', 'near', 'between', 'than'
];

// 時間表現パターン
const timeExpressions = [
  /\b(next|last|this)\s+(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|week|month|year)/gi,
  /\b(every|each)\s+(day|morning|afternoon|evening|night|week|month|year)/gi,
  /\bat\s+(seven|eight|nine|ten|eleven|twelve|one|two|three|four|five|six)(\s+o'clock)?/gi,
  /\b\d+\s+(minutes?|hours?|days?|weeks?|months?|years?)\b/gi,
  /\bfor\s+(five|six|seven|eight|nine|ten|twenty|thirty)\s+years?\b/gi
];

// 数詞+名詞パターン
const numericExpressions = [
  /\b(fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty)\s+years\s+old\b/gi,
  /\b(three|four|five|six|seven|eight|nine|ten)\s+dollars?\b/gi
];

// 受動態のbyフレーズパターン（by + 行為者）
const passiveByPhrases = [
  /\bby\s+(many|some|few|all|most)\s+people\b/gi,
  /\bby\s+(my|your|his|her|our|their)\s+\w+/gi
];

/**
 * 英文を語句のまとまりごとに分割し、+ プレフィックス付きで返す
 * 例: "I wake up at seven." → "+ I / + wake up / + at seven / ."
 */
export function splitIntoVocabularyChunks(text: string): string {
  let result = text;

  // 1. 慣用表現を保護（最長一致、"in front of"など）
  const sortedIdioms = [...idioms].sort((a, b) => b.length - a.length);
  sortedIdioms.forEach(idiom => {
    const regex = new RegExp(`\\b${idiom.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    result = result.replace(regex, (match) => `|||${match}|||`);
  });

  // 2. 時間表現を保護（"at seven", "every morning"など）
  timeExpressions.forEach(pattern => {
    result = result.replace(pattern, (match) => `|||${match}|||`);
  });

  // 3. 受動態のbyフレーズを保護（"by many people"など）
  passiveByPhrases.forEach(pattern => {
    result = result.replace(pattern, (match) => `|||${match}|||`);
  });

  // 4. 数詞+名詞を保護（"fifteen years old"など）
  numericExpressions.forEach(pattern => {
    result = result.replace(pattern, (match) => `|||${match}|||`);
  });

  // 5. 句動詞・熟語を保護（最長一致）
  const sortedPhrasalVerbs = [...phrasal_verbs].sort((a, b) => b.length - a.length);
  sortedPhrasalVerbs.forEach(pv => {
    const regex = new RegExp(`\\b${pv.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    result = result.replace(regex, (match) => `|||${match}|||`);
  });

  // 6. 前置詞句を保護（個別に分離）
  const protectedRegex = /\|\|\|([^|]+)\|\|\|/g;
  const tempMarkers: string[] = [];
  result = result.replace(protectedRegex, (match) => {
    const marker = `__PROTECTED_${tempMarkers.length}__`;
    tempMarkers.push(match);
    return marker;
  });

  // 前置詞句を検出（他の前置詞が来たら必ず止まる）
  // to不定詞の目的用法は前置詞句として保護しない
  for (let i = 0; i < 3; i++) {
    prepositions.forEach(prep => {
      if (prep === 'to') {
        // "to"は前置詞句としてのみ保護（to不定詞は保護しない）
        // 前置詞句のtoの後には名詞が来る（them, school, Tokyo など）
        const regex = new RegExp(`\\bto\\s+(them|him|her|us|me|you|it|school|home|Tokyo|[A-Z][a-z]+)(?=\\s+(?:${prepositions.join('|')})\\b|[,.!?]|\\s+(?:and|but|or|so|because|than)\\b|__PROTECTED_|$)`, 'gi');
        result = result.replace(regex, (match) => {
          if (match.includes('|||') || match.includes('__PROTECTED_')) return match;
          const trimmed = match.trim();
          if (!trimmed) return match;
          return `|||${trimmed}|||`;
        });
      } else {
        const regex = new RegExp(`\\b${prep}\\s+([^,.!?]+?)(?=\\s+(?:${prepositions.join('|')})\\b|[,.!?]|\\s+(?:and|but|or|so|because|than)\\b|__PROTECTED_|$)`, 'gi');
        result = result.replace(regex, (match) => {
          if (match.includes('|||') || match.includes('__PROTECTED_')) return match;
          const trimmed = match.trim();
          if (!trimmed) return match;
          return `|||${trimmed}|||`;
        });
      }
    });
  }

  // 保護マーカーを戻す
  tempMarkers.forEach((original, idx) => {
    result = result.replace(`__PROTECTED_${idx}__`, original);
  });

  // 7. トークン分割
  const chunks: string[] = [];
  const parts = result.split(/(\|\|\|[^|]+\|\|\||[,.!?])/);

  parts.forEach(part => {
    if (part.startsWith('|||') && part.endsWith('|||')) {
      // 保護されたチャンク
      chunks.push(part.slice(3, -3).trim());
    } else if (/^[,.!?]$/.test(part.trim())) {
      // 句読点
      chunks.push(part.trim());
    } else {
      // 通常の単語を分割
      const words = part.trim().split(/\s+/).filter(w => w.length > 0);
      words.forEach(word => {
        chunks.push(word);
      });
    }
  });

  // 8. 各チャンクに + を追加（句読点は除く）
  const formattedChunks = chunks
    .filter(chunk => chunk.length > 0)
    .map(chunk => {
      // 句読点には+を付けない
      if (/^[,.!?]$/.test(chunk)) {
        return chunk;
      }
      return `+ ${chunk}`;
    });

  return formattedChunks.join(' / ');
}
