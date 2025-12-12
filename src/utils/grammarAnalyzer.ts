/**
 * 文法解析ユーティリティ
 * 英文の単語に基本的な文法タグ（S, V, O, C, M等）を付与する
 */

export type GrammarTag =
  | 'S'
  | 'V'
  | 'O'
  | 'C'
  | 'M'
  | 'Prep'
  | 'Conj'
  | 'Det'
  | 'Adj'
  | 'Adv'
  | 'Unknown';

export interface GrammarAnalysisResult {
  word: string;
  tag: GrammarTag;
  color: string;
  description: string;
}

// 品詞判定用の辞書
const VERBS = new Set([
  'be',
  'am',
  'is',
  'are',
  'was',
  'were',
  'been',
  'being',
  'have',
  'has',
  'had',
  'having',
  'do',
  'does',
  'did',
  'done',
  'doing',
  'can',
  'could',
  'will',
  'would',
  'shall',
  'should',
  'may',
  'might',
  'must',
  'go',
  'goes',
  'went',
  'gone',
  'going',
  'get',
  'gets',
  'got',
  'gotten',
  'getting',
  'make',
  'makes',
  'made',
  'making',
  'take',
  'takes',
  'took',
  'taken',
  'taking',
  'see',
  'sees',
  'saw',
  'seen',
  'seeing',
  'come',
  'comes',
  'came',
  'coming',
  'want',
  'wants',
  'wanted',
  'wanting',
  'use',
  'uses',
  'used',
  'using',
  'find',
  'finds',
  'found',
  'finding',
  'give',
  'gives',
  'gave',
  'given',
  'giving',
  'tell',
  'tells',
  'told',
  'telling',
  'work',
  'works',
  'worked',
  'working',
  'call',
  'calls',
  'called',
  'calling',
  'try',
  'tries',
  'tried',
  'trying',
  'ask',
  'asks',
  'asked',
  'asking',
  'need',
  'needs',
  'needed',
  'needing',
  'feel',
  'feels',
  'felt',
  'feeling',
  'become',
  'becomes',
  'became',
  'becoming',
  'leave',
  'leaves',
  'left',
  'leaving',
  'put',
  'puts',
  'putting',
  'mean',
  'means',
  'meant',
  'meaning',
  'keep',
  'keeps',
  'kept',
  'keeping',
  'let',
  'lets',
  'letting',
  'begin',
  'begins',
  'began',
  'begun',
  'beginning',
  'seem',
  'seems',
  'seemed',
  'seeming',
  'help',
  'helps',
  'helped',
  'helping',
  'talk',
  'talks',
  'talked',
  'talking',
  'turn',
  'turns',
  'turned',
  'turning',
  'start',
  'starts',
  'started',
  'starting',
  'show',
  'shows',
  'showed',
  'shown',
  'showing',
  'hear',
  'hears',
  'heard',
  'hearing',
  'play',
  'plays',
  'played',
  'playing',
  'run',
  'runs',
  'ran',
  'running',
  'move',
  'moves',
  'moved',
  'moving',
  'like',
  'likes',
  'liked',
  'liking',
  'live',
  'lives',
  'lived',
  'living',
  'believe',
  'believes',
  'believed',
  'believing',
  'bring',
  'brings',
  'brought',
  'bringing',
  'happen',
  'happens',
  'happened',
  'happening',
  'write',
  'writes',
  'wrote',
  'written',
  'writing',
  'sit',
  'sits',
  'sat',
  'sitting',
  'stand',
  'stands',
  'stood',
  'standing',
  'lose',
  'loses',
  'lost',
  'losing',
  'pay',
  'pays',
  'paid',
  'paying',
  'meet',
  'meets',
  'met',
  'meeting',
  'include',
  'includes',
  'included',
  'including',
  'continue',
  'continues',
  'continued',
  'continuing',
  'set',
  'sets',
  'setting',
  'learn',
  'learns',
  'learned',
  'learning',
  'change',
  'changes',
  'changed',
  'changing',
  'lead',
  'leads',
  'led',
  'leading',
  'understand',
  'understands',
  'understood',
  'understanding',
  'watch',
  'watches',
  'watched',
  'watching',
  'follow',
  'follows',
  'followed',
  'following',
  'stop',
  'stops',
  'stopped',
  'stopping',
  'create',
  'creates',
  'created',
  'creating',
  'speak',
  'speaks',
  'spoke',
  'spoken',
  'speaking',
  'read',
  'reads',
  'reading',
  'spend',
  'spends',
  'spent',
  'spending',
  'grow',
  'grows',
  'grew',
  'grown',
  'growing',
  'open',
  'opens',
  'opened',
  'opening',
  'walk',
  'walks',
  'walked',
  'walking',
  'win',
  'wins',
  'won',
  'winning',
  'teach',
  'teaches',
  'taught',
  'teaching',
  'offer',
  'offers',
  'offered',
  'offering',
  'remember',
  'remembers',
  'remembered',
  'remembering',
  'consider',
  'considers',
  'considered',
  'considering',
  'appear',
  'appears',
  'appeared',
  'appearing',
  'buy',
  'buys',
  'bought',
  'buying',
  'serve',
  'serves',
  'served',
  'serving',
  'die',
  'dies',
  'died',
  'dying',
  'send',
  'sends',
  'sent',
  'sending',
  'build',
  'builds',
  'built',
  'building',
  'stay',
  'stays',
  'stayed',
  'staying',
  'fall',
  'falls',
  'fell',
  'fallen',
  'falling',
  'cut',
  'cuts',
  'cutting',
  'reach',
  'reaches',
  'reached',
  'reaching',
  'kill',
  'kills',
  'killed',
  'killing',
  'raise',
  'raises',
  'raised',
  'raising',
  'pass',
  'passes',
  'passed',
  'passing',
  'sell',
  'sells',
  'sold',
  'selling',
  'decide',
  'decides',
  'decided',
  'deciding',
  'return',
  'returns',
  'returned',
  'returning',
  'explain',
  'explains',
  'explained',
  'explaining',
  'hope',
  'hopes',
  'hoped',
  'hoping',
  'develop',
  'develops',
  'developed',
  'developing',
  'carry',
  'carries',
  'carried',
  'carrying',
  'break',
  'breaks',
  'broke',
  'broken',
  'breaking',
  'receive',
  'receives',
  'received',
  'receiving',
  'agree',
  'agrees',
  'agreed',
  'agreeing',
  'support',
  'supports',
  'supported',
  'supporting',
  'hit',
  'hits',
  'hitting',
  'produce',
  'produces',
  'produced',
  'producing',
  'eat',
  'eats',
  'ate',
  'eaten',
  'eating',
  'cover',
  'covers',
  'covered',
  'covering',
  'catch',
  'catches',
  'caught',
  'catching',
  'draw',
  'draws',
  'drew',
  'drawn',
  'drawing',
  'wake',
  'wakes',
  'woke',
  'woken',
  'waking',
  'brush',
  'brushes',
  'brushed',
  'brushing',
  'wash',
  'washes',
  'washed',
  'washing',
  'prepare',
  'prepares',
  'prepared',
  'preparing',
  'check',
  'checks',
  'checked',
  'checking',
]);

const PREPOSITIONS = new Set([
  'in',
  'on',
  'at',
  'to',
  'for',
  'with',
  'from',
  'by',
  'about',
  'as',
  'into',
  'like',
  'through',
  'after',
  'over',
  'between',
  'out',
  'against',
  'during',
  'without',
  'before',
  'under',
  'around',
  'among',
  'of',
  'up',
]);

const CONJUNCTIONS = new Set([
  'and',
  'but',
  'or',
  'so',
  'yet',
  'for',
  'nor',
  'because',
  'although',
  'if',
  'when',
  'while',
  'since',
  'unless',
  'that',
  'which',
  'who',
  'whom',
  'whose',
  'where',
]);

const DETERMINERS = new Set([
  'the',
  'a',
  'an',
  'this',
  'that',
  'these',
  'those',
  'my',
  'your',
  'his',
  'her',
  'its',
  'our',
  'their',
  'some',
  'any',
  'no',
  'every',
  'each',
  'either',
  'neither',
  'much',
  'many',
  'more',
  'most',
  'few',
  'little',
  'several',
]);

const PRONOUNS = new Set([
  'i',
  'you',
  'he',
  'she',
  'it',
  'we',
  'they',
  'me',
  'him',
  'her',
  'us',
  'them',
  'myself',
  'yourself',
  'himself',
  'herself',
  'itself',
  'ourselves',
  'themselves',
]);

const ADJECTIVES = new Set([
  'good',
  'new',
  'first',
  'last',
  'long',
  'great',
  'little',
  'own',
  'other',
  'old',
  'right',
  'big',
  'high',
  'different',
  'small',
  'large',
  'next',
  'early',
  'young',
  'important',
  'few',
  'public',
  'bad',
  'same',
  'able',
  'ready',
  'usual',
  'toast',
  'juice',
]);

const ADVERBS = new Set([
  'not',
  'so',
  'up',
  'out',
  'just',
  'now',
  'how',
  'then',
  'more',
  'also',
  'here',
  'well',
  'only',
  'very',
  'even',
  'back',
  'there',
  'down',
  'still',
  'in',
  'as',
  'too',
  'when',
  'never',
  'really',
  'usually',
  'finally',
  'first',
  'after',
  'before',
]);

/**
 * 文法タグの色を取得
 */
function getTagColor(tag: GrammarTag): string {
  const colorMap: Record<GrammarTag, string> = {
    S: '#3b82f6', // 青 - 主語
    V: '#ef4444', // 赤 - 動詞
    O: '#10b981', // 緑 - 目的語
    C: '#f59e0b', // オレンジ - 補語
    M: '#8b5cf6', // 紫 - 修飾語
    Prep: '#6366f1', // インディゴ - 前置詞
    Conj: '#ec4899', // ピンク - 接続詞
    Det: '#14b8a6', // ティール - 冠詞
    Adj: '#f97316', // オレンジ - 形容詞
    Adv: '#a855f7', // パープル - 副詞
    Unknown: '#6b7280', // グレー - 不明
  };
  return colorMap[tag];
}

/**
 * 文法タグの説明を取得
 */
function getTagDescription(tag: GrammarTag): string {
  const descMap: Record<GrammarTag, string> = {
    S: '主語',
    V: '動詞',
    O: '目的語',
    C: '補語',
    M: '修飾語',
    Prep: '前置詞',
    Conj: '接続詞',
    Det: '冠詞・限定詞',
    Adj: '形容詞',
    Adv: '副詞',
    Unknown: '不明',
  };
  return descMap[tag];
}

/**
 * 単語の品詞を判定（簡易版）
 */
function classifyWord(word: string, index: number, words: string[]): GrammarTag {
  const lower = word.toLowerCase();

  // 句読点はスキップ
  if (/^[.,!?;:]$/.test(word)) {
    return 'Unknown';
  }

  // 動詞
  if (VERBS.has(lower)) {
    return 'V';
  }

  // 前置詞
  if (PREPOSITIONS.has(lower)) {
    return 'Prep';
  }

  // 接続詞
  if (CONJUNCTIONS.has(lower)) {
    return 'Conj';
  }

  // 冠詞・限定詞
  if (DETERMINERS.has(lower)) {
    return 'Det';
  }

  // 形容詞
  if (ADJECTIVES.has(lower)) {
    return 'Adj';
  }

  // 副詞
  if (ADVERBS.has(lower)) {
    return 'Adv';
  }

  // 代名詞は主語または目的語の可能性
  if (PRONOUNS.has(lower)) {
    // 文頭または動詞の前なら主語
    if (index === 0 || (index > 0 && VERBS.has(words[index + 1]?.toLowerCase()))) {
      return 'S';
    }
    // それ以外は目的語
    return 'O';
  }

  return 'Unknown';
}

/**
 * 句読点の意味を取得
 */
function getPunctuationMeaning(punctuation: string): string {
  const meanings: Record<string, string> = {
    '.': '文の終わり',
    ',': '区切り・列挙',
    '!': '感嘆・強調',
    '?': '疑問',
    ';': '関連する文の区切り',
    ':': '説明・例示の導入',
    '-': '補足説明・言い換え',
    '—': '強い区切り・挿入',
    '–': '範囲・関係',
    '"': '引用',
    "'": '引用・所有格',
    '(': '補足情報の開始',
    ')': '補足情報の終了',
  };
  return meanings[punctuation] || '句読点';
}

/**
 * 文を分析して文法タグを付与
 */
export function analyzeSentence(sentence: string): GrammarAnalysisResult[] {
  // 文を単語に分割（句読点、ダッシュも含む）
  const words = sentence.match(/\b[\w']+\b|[.,!?;:\-—–"'()]/g) || [];

  const results: GrammarAnalysisResult[] = [];
  let foundVerb = false;
  let foundSubject = false;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // 句読点・記号は意味を付けて追加
    if (/^[.,!?;:\-—–"'()]$/.test(word)) {
      results.push({
        word,
        tag: 'Unknown',
        color: '#6b7280',
        description: getPunctuationMeaning(word),
      });
      continue;
    }

    let tag = classifyWord(word, i, words);

    // より詳細な分析
    if (tag === 'Unknown') {
      // 文頭で大文字始まりなら主語の可能性
      if (i === 0 && /^[A-Z]/.test(word) && !foundSubject) {
        tag = 'S';
        foundSubject = true;
      }
      // 動詞の後ろなら目的語の可能性
      else if (foundVerb && !foundSubject) {
        tag = 'O';
      }
      // 前置詞の後ろなら修飾語
      else if (i > 0 && PREPOSITIONS.has(words[i - 1].toLowerCase())) {
        tag = 'M';
      }
      // それ以外は修飾語として扱う
      else {
        tag = 'M';
      }
    }

    if (tag === 'V') {
      foundVerb = true;
    }
    if (tag === 'S') {
      foundSubject = true;
    }

    results.push({
      word,
      tag,
      color: getTagColor(tag),
      description: getTagDescription(tag),
    });
  }

  return results;
}

/**
 * 文法タグの統計を取得
 */
export function getGrammarStats(results: GrammarAnalysisResult[]): Record<GrammarTag, number> {
  const stats: Record<string, number> = {};

  results.forEach((result) => {
    stats[result.tag] = (stats[result.tag] || 0) + 1;
  });

  return stats as Record<GrammarTag, number>;
}

/**
 * 熟語の定義
 * 句動詞・慣用表現・時間表現などを含む
 */
export interface PhrasalExpression {
  words: string[];
  meaning: string;
  type: 'phrasal-verb' | 'idiom' | 'time-expression' | 'determiner-noun';
}

const PHRASAL_EXPRESSIONS: PhrasalExpression[] = [
  // 句動詞 (Phrasal Verbs) - 熟語として表示
  { words: ['wake', 'up'], meaning: '起きる', type: 'phrasal-verb' },
  { words: ['get', 'up'], meaning: '起床する', type: 'phrasal-verb' },
  { words: ['wake', 'up'], meaning: '目を覚ます', type: 'phrasal-verb' },
  { words: ['brush', 'my', 'teeth'], meaning: '歯を磨く', type: 'phrasal-verb' },
  { words: ['wash', 'my', 'face'], meaning: '顔を洗う', type: 'phrasal-verb' },
  { words: ['have', 'breakfast'], meaning: '朝食を食べる', type: 'phrasal-verb' },
  { words: ['go', 'to', 'school'], meaning: '学校に行く', type: 'phrasal-verb' },
  { words: ['come', 'back'], meaning: '帰ってくる', type: 'phrasal-verb' },
  { words: ['come', 'home'], meaning: '帰宅する', type: 'phrasal-verb' },
  { words: ['do', 'homework'], meaning: '宿題をする', type: 'phrasal-verb' },
  { words: ['go', 'to', 'bed'], meaning: '寝る', type: 'phrasal-verb' },

  // 時間表現
  { words: ['at', 'seven'], meaning: '7時に', type: 'time-expression' },
  { words: ['in', 'the', 'morning'], meaning: '朝に', type: 'time-expression' },
  { words: ['in', 'the', 'afternoon'], meaning: '午後に', type: 'time-expression' },
  { words: ['in', 'the', 'evening'], meaning: '夕方に', type: 'time-expression' },
  { words: ['at', 'night'], meaning: '夜に', type: 'time-expression' },

  // 限定詞+名詞の慣用表現
  { words: ['every', 'morning'], meaning: '毎朝', type: 'determiner-noun' },
  { words: ['every', 'day'], meaning: '毎日', type: 'determiner-noun' },
  { words: ['every', 'night'], meaning: '毎晩', type: 'determiner-noun' },
  { words: ['every', 'week'], meaning: '毎週', type: 'determiner-noun' },
];

/**
 * 文から熟語を検出
 */
export function detectPhrasalExpressions(words: string[]): PhrasalExpression[] {
  const detected: PhrasalExpression[] = [];
  const lowerWords = words.map((w) => w.toLowerCase());

  for (const expression of PHRASAL_EXPRESSIONS) {
    const exprLower = expression.words.map((w) => w.toLowerCase());

    // 連続する単語列を探す
    for (let i = 0; i <= lowerWords.length - exprLower.length; i++) {
      let match = true;
      for (let j = 0; j < exprLower.length; j++) {
        if (lowerWords[i + j] !== exprLower[j]) {
          match = false;
          break;
        }
      }

      if (match) {
        detected.push({
          ...expression,
          words: words.slice(i, i + exprLower.length), // 元の大文字小文字を保持
        });
      }
    }
  }

  return detected;
}

/**
 * 構文パターンの定義
 */
export interface GrammarPattern {
  name: string;
  meaning: string;
  pattern: RegExp;
  explanation: string;
}

const GRAMMAR_PATTERNS: GrammarPattern[] = [
  {
    name: 'too ~ to ...',
    meaning: '〜すぎて...できない',
    pattern: /\btoo\s+\w+\s+to\s+\w+/i,
    explanation: '「too + 形容詞/副詞 + to + 動詞」の形で、「〜すぎて...できない」という意味',
  },
  {
    name: 'so ~ that ...',
    meaning: 'とても〜なので...',
    pattern: /\bso\s+\w+\s+that\b/i,
    explanation: '「so + 形容詞/副詞 + that ~」の形で、「とても〜なので...」という意味',
  },
  {
    name: 'so that ...',
    meaning: '〜するために',
    pattern: /\bso\s+that\b/i,
    explanation: '「so that ~」の形で、「〜するために」という目的を表す',
  },
  {
    name: 'It is ~ for ... to',
    meaning: '...が〜するのは',
    pattern: /\bit\s+is\s+\w+\s+for\s+\w+\s+to\b/i,
    explanation:
      '「It is + 形容詞 + for + 人 + to + 動詞」の形で、「(人)が〜するのは...だ」という意味',
  },
  {
    name: 'It is ~ to ...',
    meaning: '〜することは...だ',
    pattern: /\bit\s+is\s+\w+\s+to\s+\w+/i,
    explanation: '「It is + 形容詞 + to + 動詞」の形で、「〜することは...だ」という意味',
  },
  {
    name: 'It is ~ that ...',
    meaning: '...なのは〜だ (強調)',
    pattern: /\bit\s+is\s+\w+\s+that\b/i,
    explanation: '強調構文。「It is ~ that ...」の形で、特定の部分を強調する',
  },
  {
    name: 'not only ~ but also ...',
    meaning: '〜だけでなく...も',
    pattern: /\bnot\s+only\s+.+\s+but\s+also\b/i,
    explanation: '「not only A but also B」の形で、「AだけでなくBも」という意味',
  },
  {
    name: 'either ~ or ...',
    meaning: '〜か...かどちらか',
    pattern: /\beither\s+.+\s+or\b/i,
    explanation: '「either A or B」の形で、「AかBかどちらか」という選択を表す',
  },
  {
    name: 'neither ~ nor ...',
    meaning: '〜も...もない',
    pattern: /\bneither\s+.+\s+nor\b/i,
    explanation: '「neither A nor B」の形で、「AもBもない」という否定を表す',
  },
  {
    name: 'both ~ and ...',
    meaning: '〜も...も両方',
    pattern: /\bboth\s+.+\s+and\b/i,
    explanation: '「both A and B」の形で、「AもBも両方」という意味',
  },
  {
    name: 'as ~ as ...',
    meaning: '...と同じくらい〜',
    pattern: /\bas\s+\w+\s+as\b/i,
    explanation: '「as + 形容詞/副詞 + as ...」の形で、「...と同じくらい〜」という同等比較',
  },
  {
    name: 'not as ~ as ...',
    meaning: '...ほど〜ない',
    pattern: /\bnot\s+as\s+\w+\s+as\b/i,
    explanation: '「not as + 形容詞/副詞 + as ...」の形で、「...ほど〜ない」という意味',
  },
  {
    name: 'one of the ~est',
    meaning: '最も〜なものの1つ',
    pattern: /\bone\s+of\s+the\s+\w+est\b/i,
    explanation: '「one of the + 最上級 + 複数名詞」の形で、「最も〜なものの1つ」という意味',
  },
  {
    name: 'make/let/have + 人 + 動詞',
    meaning: '人に〜させる',
    pattern: /\b(make|let|have|help)\s+\w+\s+\w+/i,
    explanation: '使役動詞の構文。「make/let/have + 人 + 動詞の原形」で「人に〜させる」',
  },
  {
    name: 'be used to ~ing',
    meaning: '〜することに慣れている',
    pattern: /\b(am|is|are|was|were)\s+used\s+to\s+\w+ing\b/i,
    explanation: '「be used to + 動名詞」の形で、「〜することに慣れている」という意味',
  },
  {
    name: 'used to + 動詞',
    meaning: '昔は〜したものだ',
    pattern: /\bused\s+to\s+\w+/i,
    explanation: '「used to + 動詞の原形」の形で、「昔は〜したものだ」という過去の習慣を表す',
  },
];

/**
 * 文から構文パターンを検出
 */
export function detectGrammarPatterns(sentence: string): GrammarPattern[] {
  const detected: GrammarPattern[] = [];

  for (const pattern of GRAMMAR_PATTERNS) {
    if (pattern.pattern.test(sentence)) {
      detected.push(pattern);
    }
  }

  return detected;
}
