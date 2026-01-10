/**
 * 語句タブの分割テスト
 * パターン選択法で定義したルール:
 * 1. 句動詞（wake up, get ready, go home）はまとめる
 * 2. 熟語（have to, take a bus, looking forward to）はまとめる
 * 3. 慣用表現（in front of）はまとめる
 * 4. 前置詞句は全体でまとめる（In our city, at seven）
 * 5. 時間表現はまとめる（next Sunday, at eight）
 * 6. 数詞+名詞はまとめる（fifteen years old, thirty minutes）
 * 7. 所有格と名詞は分ける（my / teeth）
 * 8. 冠詞、形容詞は分ける（a / good / zoo）
 * 9. カンマ、接続詞、ピリオド、疑問符、感嘆符は独立要素
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

// 前置詞リスト（thanを除外、後で個別処理）
const prepositions = [
  'at', 'in', 'on', 'by', 'to', 'from', 'for', 'with', 'about', 'of',
  'during', 'after', 'before', 'around', 'per', 'near', 'between'
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

function splitIntoVocabularyChunks(text: string): string {
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

  // 6. トークン分割
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

  // 7. 各チャンクに + を追加（句読点は除く）
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

const vocabularySplitTestCases = [
  {
    input: "I wake up at seven every morning.",
    expected: "+ I / + wake up / + at seven / + every morning / ."
  },
  {
    input: "First, I brush my teeth and wash my face.",
    expected: "+ First / , / + I / + brush / + my / + teeth / + and / + wash / + my / + face / ."
  },
  {
    input: "Then I eat breakfast with my family.",
    expected: "+ Then / + I / + eat / + breakfast / + with my family / ."
  },
  {
    input: "I usually have toast and juice.",
    expected: "+ I / + usually / + have / + toast / + and / + juice / ."
  },
  {
    input: "After breakfast, I get my bag ready.",
    expected: "+ After breakfast / , / + I / + get / + my / + bag / + ready / ."
  },
  {
    input: "Finally, I walk to school with friends.",
    expected: "+ Finally / , / + I / + walk / + to school / + with friends / ."
  },
  {
    input: "In our city, we have a good zoo, Smile Zoo.",
    expected: "+ In our city / , / + we / + have / + a / + good / + zoo / , / + Smile / + Zoo / ."
  },
  {
    input: "Right, but I can't join Night Safari because I have to go home by six.",
    expected: "+ Right / , / + but / + I / + can't / + join / + Night / + Safari / + because / + I / + have to / + go home / + by six / ."
  },
  {
    input: "It will start at eleven in the morning, and we can enjoy it for thirty minutes.",
    expected: "+ It / + will / + start / + at eleven / + in the morning / , / + and / + we / + can / + enjoy / + it / + for thirty minutes / ."
  },
  {
    input: "I'm looking forward to the event!",
    expected: "+ I'm / + looking forward to / + the / + event / !"
  },
  {
    input: "We are fifteen years old.",
    expected: "+ We / + are / + fifteen years old / ."
  },
  {
    input: "We'll take a bus at the bus stop in front of our school at eight.",
    expected: "+ We'll / + take a bus / + at the bus stop / + in front of / + our / + school / + at eight / ."
  },
  // 追加テストケース
  {
    input: "This is the book that I bought yesterday.",
    expected: "+ This / + is / + the / + book / + that / + I / + bought / + yesterday / ."
  },
  {
    input: "English is spoken by many people in the world.",
    expected: "+ English / + is / + spoken / + by many people / + in the world / ."
  },
  {
    input: "I want to visit Tokyo to see my friend.",
    expected: "+ I / + want to / + visit / + Tokyo / + to / + see / + my / + friend / ."
  },
  {
    input: "This book is more interesting than that one.",
    expected: "+ This / + book / + is / + more / + interesting / + than / + that / + one / ."
  },
  {
    input: "I don't know how to use this machine.",
    expected: "+ I / + don't know / + how to / + use / + this / + machine / ."
  },
  {
    input: "I have lived in Tokyo for five years.",
    expected: "+ I / + have / + lived / + in Tokyo / + for five years / ."
  }
];

console.log("=== 語句タブ分割テスト ===\n");

let passCount = 0;
let failCount = 0;

vocabularySplitTestCases.forEach((test, idx) => {
  const result = splitIntoVocabularyChunks(test.input);
  const passed = result === test.expected;

  if (passed) {
    passCount++;
    console.log(`✓ ${idx + 1}. ${test.input}`);
  } else {
    failCount++;
    console.log(`✗ ${idx + 1}. ${test.input}`);
    console.log(`   期待: ${test.expected}`);
    console.log(`   実際: ${result}`);
  }
  console.log();
});

console.log(`\n結果: ${passCount}/${vocabularySplitTestCases.length} 合格`);
if (failCount > 0) {
  console.log(`失敗: ${failCount}件`);
}
