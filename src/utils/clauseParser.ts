/**
 * 節句分割エンジン（Clause Parser）
 * 英文を主節・従属節・句に分割し、SVOCM情報を付与
 *
 * 出力例:
 * "<Because he wanted to help> / hungry people / (around the world)"
 */

import type {
  ClauseParsedSentence,
  ClauseSegment,
  WordWithSVOCM,
  SVOCMComponent,
  DependencyParsedSentence,
} from '@/types/passage';
import { mapDependencyTokensToSVOCMByStartIndex } from '@/utils/dependencySvocm';

/**
 * 従属接続詞のリスト
 */
const SUBORDINATING_CONJUNCTIONS = new Set([
  'because',
  'since',
  'as',
  'when',
  'while',
  'before',
  'after',
  'until',
  'if',
  'unless',
  'although',
  'though',
  'even though',
  'whereas',
  'where',
  'wherever',
]);

/**
 * 関係代名詞・関係副詞
 */
const RELATIVE_PRONOUNS = new Set([
  'who',
  'whom',
  'whose',
  'which',
  'that',
  'where',
  'when',
  'why',
]);

/**
 * 前置詞のリスト
 */
const PREPOSITIONS = new Set([
  'in',
  'on',
  'at',
  'from',
  'with',
  'by',
  'for',
  'about',
  'through',
  'during',
  'after',
  'before',
  'under',
  'over',
  'between',
  'among',
  'around',
  'without',
  'within',
  'into',
  'onto',
]);

/**
 * 文を節・句に分割
 * @param sentence 英文
 * @returns 分割結果
 */
export function parseClausesAndPhrases(
  sentence: string,
  options?: { dependency?: DependencyParsedSentence }
): ClauseParsedSentence {
  // 1. まず単語に分割
  const words = tokenize(sentence);

  const depRoleByStartIndex = options?.dependency
    ? mapDependencyTokensToSVOCMByStartIndex(options.dependency.tokens)
    : undefined;

  // 2. 節・句の境界を検出
  const boundaries = detectBoundaries(words);

  // 3. セグメントに分割
  const segments = createSegments(words, boundaries);

  // 4. 各セグメント（children含む）にSVOCM情報を付与
  const segmentsWithSVOCM = addSVOCMRecursive(segments, depRoleByStartIndex);

  return {
    original: sentence,
    segments: segmentsWithSVOCM,
  };
}

/**
 * セグメント（children含む）にSVOCM情報を付与（構造ベース解析）
 */
function addSVOCMRecursive(
  segments: ClauseSegment[],
  depRoleByStartIndex?: Map<number, SVOCMComponent>
): ClauseSegment[] {
  return segments.map((segment) => {
    const isMain = segment.type === 'main-clause';

    // subordinate-clause は children に実体がある（wordsは空）
    if (segment.words.length === 0) {
      return {
        ...segment,
        children: segment.children ? addSVOCMRecursive(segment.children, depRoleByStartIndex) : undefined,
      };
    }

    const rawWords = segment.words.map((w) => w.word);
    const ruleBased = analyzeSegmentStructure(rawWords, segment.type, isMain);

    const wordsWithSVOCM: WordWithSVOCM[] = segment.words.map((w, idx) => {
      const startIndex = (w as any).index as number | undefined;
      const fromDep =
        depRoleByStartIndex && typeof startIndex === 'number'
          ? depRoleByStartIndex.get(startIndex)
          : undefined;

      // 句（phrase）は常にM
      const forced = segment.type === 'phrase' ? 'M' : undefined;

      return {
        word: w.word,
        component: forced ?? fromDep ?? ruleBased[idx]?.component,
        isMainClause: isMain,
      };
    });

    return {
      ...segment,
      words: wordsWithSVOCM,
      children: segment.children ? addSVOCMRecursive(segment.children, depRoleByStartIndex) : undefined,
    };
  });
}

/**
 * セグメント構造に基づくSVOCM解析
 */
function analyzeSegmentStructure(
  words: string[],
  segmentType: ClauseSegment['type'],
  isMainClause: boolean
): WordWithSVOCM[] {
  const result: WordWithSVOCM[] = [];

  // 句（phrase）内は基本的に修飾語（M）
  if (segmentType === 'phrase') {
    return words.map(w => ({
      word: w,
      component: 'M',
      isMainClause,
    }));
  }

  // 主節・従属節・従属節内テキストの解析
  let verbIndex = -1;
  let takesComplement = false;  // 補語を取る動詞（be動詞・知覚動詞・変化動詞）

  // 動詞を探す（第1パス）
  for (let i = 0; i < words.length; i++) {
    const lower = words[i].toLowerCase();
    if (isVerb(lower)) {
      verbIndex = i;
      takesComplement = isBeVerb(lower) || isLinkingVerb(lower);
      break;
    }
  }

  // 動詞が見つからない場合は全てMとして扱う
  if (verbIndex === -1) {
    return words.map(w => ({
      word: w,
      component: /^[.,!?;:()"]$/.test(w) ? undefined : 'M',
      isMainClause,
    }));
  }

  // SVOCM割り当て（第2パス）
  let _inSubject = true;  // 動詞の前はS領域
  let inObjectOrComplement = false;  // 動詞の後はO/C領域
  let inModifier = false;  // 前置詞以降はM領域

  for (let i = 0; i < words.length; i++) {
    const lower = words[i].toLowerCase();
    let component: SVOCMComponent | undefined;

    // 句読点はSVOCM対象外
    if (/^[.,!?;:()"]$/.test(words[i])) {
      result.push({ word: words[i], component: undefined, isMainClause });
      continue;
    }

    // 接続詞（that等）はSVOCM対象外
    if (isConjunction(lower)) {
      result.push({ word: words[i], component: undefined, isMainClause });
      continue;
    }

    // 動詞
    if (i === verbIndex) {
      component = 'V';
      _inSubject = false;
      inObjectOrComplement = true;
      inModifier = false;
    }
    // 動詞の前（主語領域）
    else if (i < verbIndex && !inModifier) {
      // 冠詞はSVOCM対象外
      if (isDeterminer(lower)) {
        component = undefined;
      }
      // 形容詞・代名詞・名詞は主語（S）
      else if (isAdjective(lower) || isPronoun(lower) || isNounLike(lower)) {
        component = 'S';
      }
      // 前置詞以降は修飾語（M）の始まり
      else if (isPreposition(lower)) {
        inModifier = true;
        component = 'M';
      }
      // その他は修飾語（M）
      else {
        component = 'M';
      }
    }
    // 動詞の後ろ（目的語/補語領域）
    else if (i > verbIndex) {
      // 前置詞があれば修飾語（M）の始まり
      if (isPreposition(lower)) {
        inObjectOrComplement = false;
        inModifier = true;
        component = 'M';
      }
      // 副詞（loudly, already等）は修飾語（M）
      else if (isAdverb(lower)) {
        component = 'M';
        // 副詞が来たらO/C領域は終了
        if (inObjectOrComplement && !takesComplement) {
          inObjectOrComplement = false;
        }
      }
      // 修飾語領域内
      else if (inModifier) {
        component = 'M';
      }
      // 目的語/補語領域内
      else if (inObjectOrComplement) {
        // 時間表現（every, morning等）は修飾語
        if (isTimeExpression(lower)) {
          component = 'M';
          inObjectOrComplement = false;
          inModifier = true;
        }
        // 冠詞はO/Cの一部としてマーク
        else if (isDeterminer(lower)) {
          component = takesComplement ? 'C' : 'O';
        }
        // 形容詞
        else if (isAdjective(lower)) {
          // 補語を取る動詞の後ろは補語（C）
          component = takesComplement ? 'C' : 'O';
        }
        // 名詞はO/C
        else if (isNounLike(lower)) {
          component = takesComplement ? 'C' : 'O';
        }
        // その他は修飾語（M）
        else {
          component = 'M';
          inObjectOrComplement = false;
          inModifier = true;
        }
      }
      // その他の修飾語
      else {
        component = 'M';
      }
    }
    // 前置詞句内（動詞の前だがinModifier=true）
    else if (inModifier) {
      component = 'M';
    }

    result.push({
      word: words[i],
      component,
      isMainClause,
    });
  }

  return result;
}

// be動詞判定
function isBeVerb(word: string): boolean {
  const lowerWord = word.toLowerCase();
  return lowerWord === 'is' || lowerWord === 'are' || lowerWord === 'was' ||
         lowerWord === 'were' || lowerWord === 'am' || lowerWord === 'be' ||
         lowerWord === 'been' || lowerWord === 'being';
}

// 連結動詞（Linking Verb）判定: be動詞以外で補語を取る動詞
function isLinkingVerb(word: string): boolean {
  const linkingVerbs = new Set([
    'look', 'looks', 'looked',
    'seem', 'seems', 'seemed',
    'appear', 'appears', 'appeared',
    'become', 'becomes', 'became',
    'get', 'gets', 'got',
    'grow', 'grows', 'grew',
    'remain', 'remains', 'remained',
    'stay', 'stays', 'stayed',
    'turn', 'turns', 'turned',
    'prove', 'proves', 'proved',
    'smell', 'smells', 'smelled',
    'taste', 'tastes', 'tasted',
    'sound', 'sounds', 'sounded',
    'feel', 'feels', 'felt',
  ]);
  return linkingVerbs.has(word);
}

// 副詞判定
function isAdverb(word: string): boolean {
  const adverbs = new Set([
    'very', 'really', 'quite', 'too', 'so', 'just', 'only', 'also',
    'well', 'still', 'always', 'never', 'often', 'sometimes', 'usually',
    'already', 'yet', 'soon', 'now', 'then', 'today', 'tomorrow', 'yesterday',
    'here', 'there', 'everywhere', 'somewhere', 'nowhere',
    'loudly', 'quickly', 'slowly', 'carefully', 'happily', 'sadly',
    'hard', 'fast', 'late', 'early', 'together', 'alone',
    'finally', 'first', 'second', 'third', 'next', 'lastly',
  ]);
  // -ly で終わる単語も副詞と判定
  return adverbs.has(word) || word.endsWith('ly');
}

// 時間表現判定
function isTimeExpression(word: string): boolean {
  const timeWords = new Set([
    'every', 'morning', 'afternoon', 'evening', 'night', 'day', 'week',
    'month', 'year', 'monday', 'tuesday', 'wednesday', 'thursday',
    'friday', 'saturday', 'sunday', 'today', 'tomorrow', 'yesterday',
  ]);
  return timeWords.has(word);
}

// ヘルパー関数群
function isVerb(word: string): boolean {
  const verbs = new Set([
    'is', 'are', 'was', 'were', 'am', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did',
    'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
    'go', 'goes', 'went', 'gone', 'get', 'gets', 'got', 'gotten',
    'make', 'makes', 'made', 'take', 'takes', 'took', 'taken',
    'see', 'sees', 'saw', 'seen', 'come', 'comes', 'came',
    'want', 'wants', 'wanted', 'use', 'uses', 'used',
    'find', 'finds', 'found', 'give', 'gives', 'gave', 'given',
    'tell', 'tells', 'told', 'work', 'works', 'worked',
    'call', 'calls', 'called', 'try', 'tries', 'tried',
    'ask', 'asks', 'asked', 'need', 'needs', 'needed',
    'feel', 'feels', 'felt', 'become', 'becomes', 'became',
    'leave', 'leaves', 'left', 'put', 'puts', 'mean', 'means', 'meant',
    'keep', 'keeps', 'kept', 'let', 'lets', 'begin', 'begins', 'began', 'begun',
    'seem', 'seems', 'seemed', 'help', 'helps', 'helped',
    'talk', 'talks', 'talked', 'turn', 'turns', 'turned',
    'start', 'starts', 'started', 'show', 'shows', 'showed', 'shown',
    'hear', 'hears', 'heard', 'play', 'plays', 'played',
    'run', 'runs', 'ran', 'move', 'moves', 'moved',
    'like', 'likes', 'liked', 'live', 'lives', 'lived',
    'believe', 'believes', 'believed', 'bring', 'brings', 'brought',
    'happen', 'happens', 'happened', 'write', 'writes', 'wrote', 'written',
    'sit', 'sits', 'sat', 'stand', 'stands', 'stood',
    'lose', 'loses', 'lost', 'pay', 'pays', 'paid',
    'meet', 'meets', 'met', 'include', 'includes', 'included',
    'continue', 'continues', 'continued', 'set', 'sets',
    'learn', 'learns', 'learned', 'learnt',
    'change', 'changes', 'changed', 'lead', 'leads', 'led',
    'understand', 'understands', 'understood',
    'watch', 'watches', 'watched', 'follow', 'follows', 'followed',
    'stop', 'stops', 'stopped', 'create', 'creates', 'created',
    'speak', 'speaks', 'spoke', 'spoken', 'read', 'reads',
    'spend', 'spends', 'spent', 'grow', 'grows', 'grew', 'grown',
    'open', 'opens', 'opened', 'walk', 'walks', 'walked',
    'win', 'wins', 'won', 'teach', 'teaches', 'taught',
    'offer', 'offers', 'offered', 'remember', 'remembers', 'remembered',
    'consider', 'considers', 'considered', 'appear', 'appears', 'appeared',
    'buy', 'buys', 'bought', 'serve', 'serves', 'served',
    'die', 'dies', 'died', 'send', 'sends', 'sent',
    'build', 'builds', 'built', 'stay', 'stays', 'stayed',
    'fall', 'falls', 'fell', 'fallen', 'cut', 'cuts',
    'reach', 'reaches', 'reached', 'kill', 'kills', 'killed',
    'raise', 'raises', 'raised', 'pass', 'passes', 'passed',
    'sell', 'sells', 'sold', 'decide', 'decides', 'decided',
    'return', 'returns', 'returned', 'explain', 'explains', 'explained',
    'hope', 'hopes', 'hoped', 'develop', 'develops', 'developed',
    'carry', 'carries', 'carried', 'break', 'breaks', 'broke', 'broken',
    'receive', 'receives', 'received', 'agree', 'agrees', 'agreed',
    'support', 'supports', 'supported', 'hit', 'hits',
    'produce', 'produces', 'produced', 'eat', 'eats', 'ate', 'eaten',
    'cover', 'covers', 'covered', 'catch', 'catches', 'caught',
    'draw', 'draws', 'drew', 'drawn',
    'fly', 'flies', 'rise', 'rises', 'rose', 'risen',
    'smile', 'smiles', 'smiled', 'cry', 'cries', 'cried',
    'look', 'looks', 'looked', 'smell', 'smells', 'smelled',
    'become', 'becomes', 'became', 'read', 'reads',
    'love', 'loves', 'loved', 'buy', 'buys', 'bought',
  ]);
  return verbs.has(word);
}

function isPronoun(word: string): boolean {
  const pronouns = new Set([
    'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'me', 'him', 'her', 'us', 'them',
    'this', 'that', 'these', 'those',
    'my', 'your', 'his', 'her', 'its', 'our', 'their',
  ]);
  return pronouns.has(word.toLowerCase());
}

function isDeterminer(word: string): boolean {
  const determiners = new Set([
    'a', 'an', 'the', 'this', 'that', 'these', 'those',
    'my', 'your', 'his', 'her', 'its', 'our', 'their',
    'some', 'any', 'no', 'every', 'each', 'much', 'many',
  ]);
  return determiners.has(word);
}

function isAdjective(word: string): boolean {
  const adjectives = new Set([
    'good', 'new', 'first', 'last', 'long', 'great', 'little',
    'own', 'other', 'old', 'right', 'big', 'high', 'different',
    'small', 'large', 'next', 'early', 'young', 'important',
    'few', 'public', 'bad', 'same', 'able', 'junior', 'senior',
    'television', 'enough', 'lot', 'happy', 'difficult', 'open',
    'interesting', 'kind', 'red', 'beautiful',
  ]);
  return adjectives.has(word);
}

function isConjunction(word: string): boolean {
  const conjunctions = new Set([
    'and', 'but', 'or', 'so', 'yet', 'for', 'nor',
    'that', 'which', 'who', 'whom', 'whose', 'where', 'when',
    'because', 'although', 'if', 'unless', 'while', 'since',
  ]);
  return conjunctions.has(word);
}

function isPreposition(word: string): boolean {
  const prepositions = new Set([
    'about', 'above', 'across', 'after', 'against', 'along', 'among',
    'around', 'at', 'before', 'behind', 'below', 'beneath', 'beside',
    'between', 'beyond', 'by', 'down', 'during', 'except', 'for',
    'from', 'in', 'inside', 'into', 'like', 'near', 'on', 'onto',
    'out', 'outside', 'over', 'past', 'through', 'throughout',
    'till', 'toward', 'under', 'underneath', 'until', 'up', 'upon',
    'with', 'within', 'without',
  ]);
  return prepositions.has(word);
}

function isNounLike(word: string): boolean {
  // 大文字始まり（固有名詞）
  if (/^[A-Z]/.test(word)) return true;

  const commonNouns = new Set([
    'student', 'people', 'food', 'world', 'news', 'story',
    'shortages', 'saturday', 'television', 'lot',
    'birds', 'sun', 'baby', 'cake', 'doctor', 'apples', 'books',
    'movie', 'breakfast', 'day', 'help', 'cat', 'phone', 'truth',
    'book', 'letter', 'house', 'present', 'door', 'morning',
    'afternoon', 'evening', 'night', 'week', 'month', 'year',
    'genius', 'running',
  ]);
  return commonNouns.has(word.toLowerCase());
}

/**
 * 文を単語に分割（句読点も含む）
 */
function tokenize(sentence: string): Array<{ word: string; index: number }> {
  const tokens: Array<{ word: string; index: number }> = [];
  const regex = /\b[\w']+\b|[.,!?;:]/g;
  let match;

  while ((match = regex.exec(sentence)) !== null) {
    tokens.push({
      word: match[0],
      index: match.index,
    });
  }

  return tokens;
}

/**
 * 節・句の境界を検出
 */
interface Boundary {
  index: number; // 単語のインデックス
  type: 'subordinate-clause' | 'phrase' | 'clause-separator';
  reason: string; // 検出理由
}

function detectBoundaries(words: Array<{ word: string; index: number }>): Boundary[] {
  const boundaries: Boundary[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i].word.toLowerCase();
    const nextWord = words[i + 1]?.word.toLowerCase();

    // 1. 従属接続詞の検出
    if (SUBORDINATING_CONJUNCTIONS.has(word)) {
      boundaries.push({
        index: i,
        type: 'subordinate-clause',
        reason: `subordinating conjunction: ${word}`,
      });
    }

    // 2. 関係代名詞の検出
    if (RELATIVE_PRONOUNS.has(word)) {
      boundaries.push({
        index: i,
        type: 'subordinate-clause',
        reason: `relative pronoun: ${word}`,
      });
    }

    // 3. 前置詞句の検出
    // NOTE: "of" は名詞句内部で頻出し過剰分割になりやすいので除外
    // NOTE: 副詞（finally, first等）は句として扱わない
    if (word !== 'to' && PREPOSITIONS.has(word) && !isAdverb(word)) {
      if (i > 0) {
        boundaries.push({
          index: i,
          type: 'phrase',
          reason: `prepositional phrase: ${word}`,
        });
      } else if (i === 0 && nextWord) {
        // 文頭の前置詞句は次の単語が名詞的な場合のみ（"After breakfast"等）
        const isNounFollowing = !['i', 'you', 'he', 'she', 'it', 'we', 'they'].includes(nextWord);
        if (isNounFollowing) {
          boundaries.push({
            index: i,
            type: 'phrase',
            reason: `prepositional phrase (sentence-initial): ${word}`,
          });
        }
      }
    }

    // 4. to の扱い（前置詞/不定詞のどちらかに一度だけ）
    if (word === 'to' && nextWord) {
      const isPrepositionalTo = ['the', 'a', 'an'].includes(nextWord);
      if (i > 0) {
        boundaries.push({
          index: i,
          type: 'phrase',
          reason: isPrepositionalTo ? 'prepositional phrase: to' : 'infinitive phrase',
        });
      }
    }

    // 5. カンマでの分割
    if (word === ',') {
      boundaries.push({
        index: i + 1,
        type: 'clause-separator',
        reason: 'comma',
      });
    }
  }

  return boundaries.sort((a, b) => a.index - b.index);
}

/**
 * 境界情報に基づいてセグメントを作成（原文欠落を防ぐ span ベース）
 */
function createSegments(
  words: Array<{ word: string; index: number }>,
  boundaries: Boundary[]
): ClauseSegment[] {
  const wordStrings = words.map((w) => w.word);
  const boundaryList = boundaries
    .filter((b) => b.index >= 0 && b.index < wordStrings.length)
    .sort((a, b) => a.index - b.index);

  const phraseStarts = new Set(
    boundaryList.filter((b) => b.type === 'phrase').map((b) => b.index)
  );
  const subordinateStarts = new Set(
    boundaryList.filter((b) => b.type === 'subordinate-clause').map((b) => b.index)
  );

  const isClausePunctuation = (token: string): boolean =>
    token === ',' || token === '.' || token === '!' || token === '?' || token === ';' || token === ':';

  const makeSegment = (
    start: number,
    end: number,
    type: ClauseSegment['type']
  ): ClauseSegment | null => {
    if (end <= start) return null;
    const sliceTokens = words.slice(start, end);
    const slice = sliceTokens.map((t) => t.word);
    const text = slice.join(' ');
    // NOTE: dependency parse との突合用に start index を保持（UI側には影響しない追加プロパティ）
    const wordsWithPlaceholders: WordWithSVOCM[] = sliceTokens.map((t) =>
      ({
        word: t.word,
        component: undefined,
        isMainClause: type === 'main-clause',
        index: t.index,
      } as any)
    );
    return { text, type, words: wordsWithPlaceholders };
  };

  const splitByPhrases = (
    start: number,
    end: number,
    baseType: ClauseSegment['type']
  ): ClauseSegment[] => {
    const out: ClauseSegment[] = [];
    let cursor = start;
    for (let i = start; i < end; i++) {
      if (!phraseStarts.has(i)) continue;
      if (i <= cursor) continue;
      // 句の直前まで（通常テキスト）
      const before = makeSegment(cursor, i, baseType);
      if (before) out.push(before);

      // 句本体（次の phraseStart or 範囲 end まで。ただし句読点で打ち切り）
      let phraseEnd = end;
      for (let j = i + 1; j < end; j++) {
        if (phraseStarts.has(j) || subordinateStarts.has(j)) {
          phraseEnd = j;
          break;
        }
        if (isClausePunctuation(wordStrings[j])) {
          phraseEnd = j;
          break;
        }
      }

      // 句は最低2語以上必要（1語だけの場合は句として扱わない）
      if (phraseEnd - i >= 2) {
        const phrase = makeSegment(i, phraseEnd, 'phrase');
        if (phrase) out.push(phrase);
        cursor = phraseEnd;
        i = phraseEnd - 1;
      } else {
        // 1語だけの場合は通常テキストとして扱う
        cursor = i;
      }
    }
    const tail = makeSegment(cursor, end, baseType);
    if (tail) out.push(tail);
    return out;
  };

  const findSubordinateEnd = (start: number, rangeEnd: number): number => {
    for (let i = start + 1; i < rangeEnd; i++) {
      if (isClausePunctuation(wordStrings[i])) return i;
    }
    return rangeEnd;
  };

  const buildRange = (
    start: number,
    end: number,
    baseType: ClauseSegment['type']
  ): ClauseSegment[] => {
    const out: ClauseSegment[] = [];
    let cursor = start;

    while (cursor < end) {
      // 次の従属節開始を探す
      let nextSubStart = -1;
      for (let i = cursor; i < end; i++) {
        if (subordinateStarts.has(i)) {
          nextSubStart = i;
          break;
        }
        if (isClausePunctuation(wordStrings[i])) {
          break;
        }
      }

      if (nextSubStart === -1) {
        // 残りを句で分割して追加
        out.push(...splitByPhrases(cursor, end, baseType));
        break;
      }

      // 従属節前の部分
      if (nextSubStart > cursor) {
        out.push(...splitByPhrases(cursor, nextSubStart, baseType));
      }

      // 従属節本体（句読点まで）
      const subEnd = findSubordinateEnd(nextSubStart, end);
      const children = splitByPhrases(nextSubStart, subEnd, 'clause-text');

      const subText = wordStrings.slice(nextSubStart, subEnd).join(' ');
      out.push({
        text: subText,
        type: 'subordinate-clause',
        words: [],
        children,
      });

      cursor = subEnd;

      // 句読点は外側（主節/従属の外）に残す
      if (cursor < end && isClausePunctuation(wordStrings[cursor])) {
        const punct = makeSegment(cursor, cursor + 1, baseType);
        if (punct) out.push(punct);
        cursor += 1;
      }
    }

    return out;
  };

  // 境界がない場合でも句分割は走らせる（色付けのため）
  return buildRange(0, wordStrings.length, 'main-clause');
}

/**
 * セグメントが従属節で始まるかを判定
 */
function _isSubordinateStart(words: Array<{ word: string; index: number }>): boolean {
  if (words.length === 0) return false;
  const firstWord = words[0].word.toLowerCase();
  return SUBORDINATING_CONJUNCTIONS.has(firstWord) || RELATIVE_PRONOUNS.has(firstWord);
}

/**
 * GrammarTagをSVOCMComponentにマッピング
 */
function _mapGrammarTagToSVOCM(tag: string | undefined): SVOCMComponent | undefined {
  if (!tag) return undefined;

  switch (tag) {
    case 'S':
      return 'S';
    case 'V':
      return 'V';
    case 'O':
      return 'O';
    case 'C':
      return 'C';
    case 'M':
    case 'Adv':
    case 'Prep':
      return 'M';
    default:
      return undefined;
  }
}

/**
 * 分割された文を整形して表示用テキストを生成
 * @param parsed 分割結果
 * @returns 整形されたテキスト（例: "<Because ...> / hungry people / (around the world)"）
 */
export function formatClauseParsed(parsed: ClauseParsedSentence): string {
  return parsed.segments
    .map((segment) => {
      const text = segment.words.map((w) => w.word).join(' ');

      switch (segment.type) {
        case 'subordinate-clause':
          return `(${text})`; // 従属節は()で囲む
        case 'phrase':
          return `<${text}>`; // 句は<>で囲む
        case 'main-clause':
          return text; // 主節はそのまま
        default:
          return text;
      }
    })
    .join(' / '); // セグメント間を / で区切る
}

/**
 * SVOCM下線情報を含むHTML形式で出力
 * @param parsed 分割結果
 * @returns HTML文字列
 */
export function formatClauseParsedWithSVOCM(parsed: ClauseParsedSentence): string {
  return parsed.segments
    .map((segment) => {
      const wordsHtml = segment.words
        .map((w) => {
          if (w.component) {
            const underlineClass = `svocm-${w.component.toLowerCase()}`;
            return `<span class="${underlineClass}">${w.word}</span>`;
          }
          return w.word;
        })
        .join(' ');

      switch (segment.type) {
        case 'subordinate-clause':
          return `(${wordsHtml})`;
        case 'phrase':
          return `<${wordsHtml}>`;
        case 'main-clause':
          return wordsHtml;
        default:
          return wordsHtml;
      }
    })
    .join(' / ');
}
