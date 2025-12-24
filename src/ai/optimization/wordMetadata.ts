/**
 * 単語メタ情報管理モジュール
 * 
 * オフラインで管理される単語の追加メタ情報（語族・品詞・熟語パターン等）
 * 関連語グループ化の精度向上のため、contextualLearningAIで使用
 */

/**
 * 語族情報（語根・接頭辞・接尾辞）
 */
export interface WordFamily {
  root?: string;           // 語根（例: "act" in action/react/actor）
  prefix?: string;         // 接頭辞（例: "un-", "re-"）
  suffix?: string;         // 接尾辞（例: "-tion", "-ment", "-ly"）
  derivedFrom?: string;    // 派生元の単語（例: "happy" from "happiness"）
}

/**
 * 品詞情報（粗分類）
 */
export type PartOfSpeech = 
  | 'noun'          // 名詞
  | 'verb'          // 動詞
  | 'adjective'     // 形容詞
  | 'adverb'        // 副詞
  | 'phrase'        // 熟語・慣用句
  | 'other';        // その他

/**
 * 熟語パターン
 */
export type PhrasePattern =
  | 'preposition_phrase'  // 前置詞句（in the ~, at the ~）
  | 'verb_phrase'         // 動詞句（take a ~, make a ~）
  | 'idiom'               // 慣用句（kick the bucket）
  | 'collocation'         // コロケーション（strong coffee）
  | 'none';               // 熟語ではない

/**
 * 単語の追加メタ情報
 */
export interface WordMetadata {
  word: string;
  family?: WordFamily;
  pos?: PartOfSpeech;
  phrasePattern?: PhrasePattern;
  themeTags?: string[];    // テーマタグ（既存SEMANTIC_THEMESとの対応）
}

/**
 * 接頭辞の定義（一般的なもの）
 */
export const COMMON_PREFIXES = [
  { prefix: 'un-', meaning: '否定・反対', examples: ['unhappy', 'unable', 'unfair'] },
  { prefix: 're-', meaning: '再び・元に', examples: ['return', 'rebuild', 'review'] },
  { prefix: 'dis-', meaning: '否定・反対', examples: ['disagree', 'dislike', 'disappear'] },
  { prefix: 'in-/im-', meaning: '否定', examples: ['impossible', 'inactive', 'impolite'] },
  { prefix: 'pre-', meaning: '前に', examples: ['preview', 'predict', 'prepare'] },
  { prefix: 'post-', meaning: '後に', examples: ['postwar', 'postpone', 'postgraduate'] },
  { prefix: 'mis-', meaning: '誤って', examples: ['mistake', 'misunderstand', 'mislead'] },
  { prefix: 'over-', meaning: '過度に', examples: ['overwork', 'overlook', 'overcome'] },
  { prefix: 'under-', meaning: '不足・下に', examples: ['understand', 'underground', 'underline'] },
  { prefix: 'sub-', meaning: '下に・副の', examples: ['subway', 'submarine', 'subtitle'] },
] as const;

/**
 * 接尾辞の定義（一般的なもの）
 */
export const COMMON_SUFFIXES = [
  { suffix: '-tion/-sion', pos: 'noun', meaning: '動作・状態', examples: ['action', 'decision', 'confusion'] },
  { suffix: '-ment', pos: 'noun', meaning: '動作・結果', examples: ['development', 'movement', 'agreement'] },
  { suffix: '-ness', pos: 'noun', meaning: '性質・状態', examples: ['happiness', 'kindness', 'darkness'] },
  { suffix: '-ly', pos: 'adverb', meaning: '様態', examples: ['quickly', 'slowly', 'carefully'] },
  { suffix: '-ful', pos: 'adjective', meaning: '～に満ちた', examples: ['beautiful', 'careful', 'wonderful'] },
  { suffix: '-less', pos: 'adjective', meaning: '～のない', examples: ['hopeless', 'careless', 'endless'] },
  { suffix: '-able/-ible', pos: 'adjective', meaning: '～できる', examples: ['readable', 'possible', 'comfortable'] },
  { suffix: '-er/-or', pos: 'noun', meaning: '人・もの', examples: ['teacher', 'actor', 'writer'] },
  { suffix: '-ist', pos: 'noun', meaning: '～する人', examples: ['artist', 'scientist', 'pianist'] },
  { suffix: '-ize', pos: 'verb', meaning: '～化する', examples: ['realize', 'organize', 'modernize'] },
  { suffix: '-ing', pos: 'noun/adjective', meaning: '動名詞・現在分詞', examples: ['running', 'interesting', 'learning'] },
  { suffix: '-ed', pos: 'adjective', meaning: '過去分詞・形容詞', examples: ['tired', 'excited', 'surprised'] },
] as const;

/**
 * 語根グループの定義（頻出の語根）
 */
export const WORD_ROOTS = [
  { root: 'act', meaning: '行動', words: ['action', 'react', 'actor', 'activity', 'actual'] },
  { root: 'struct', meaning: '建てる', words: ['structure', 'construct', 'destruction', 'instruct'] },
  { root: 'dict', meaning: '言う', words: ['dictionary', 'predict', 'contradict', 'dictate'] },
  { root: 'port', meaning: '運ぶ', words: ['transport', 'import', 'export', 'portable', 'report'] },
  { root: 'duct', meaning: '導く', words: ['conduct', 'produce', 'reduce', 'introduce'] },
  { root: 'scrib/script', meaning: '書く', words: ['describe', 'script', 'prescription', 'manuscript'] },
  { root: 'spect', meaning: '見る', words: ['inspect', 'respect', 'expect', 'spectator'] },
  { root: 'form', meaning: '形', words: ['reform', 'inform', 'transform', 'uniform'] },
  { root: 'ject', meaning: '投げる', words: ['project', 'reject', 'subject', 'object'] },
  { root: 'miss/mit', meaning: '送る', words: ['mission', 'permit', 'submit', 'transmit'] },
] as const;

/**
 * 熟語パターンの識別
 */
export function identifyPhrasePattern(word: string): PhrasePattern {
  const lower = word.toLowerCase();
  
  // 前置詞句パターン
  const prepPhrases = ['in the', 'at the', 'on the', 'to the', 'for the', 'with the', 'by the'];
  if (prepPhrases.some(p => lower.startsWith(p))) {
    return 'preposition_phrase';
  }
  
  // 動詞句パターン
  const verbPhrases = ['take a', 'make a', 'have a', 'get a', 'give a', 'do a'];
  if (verbPhrases.some(p => lower.startsWith(p))) {
    return 'verb_phrase';
  }
  
  // スペースが含まれれば何らかの熟語
  if (word.includes(' ')) {
    return 'idiom';
  }
  
  return 'none';
}

/**
 * 接頭辞の抽出
 */
export function extractPrefix(word: string): string | undefined {
  const lower = word.toLowerCase();
  
  for (const { prefix } of COMMON_PREFIXES) {
    // 接頭辞パターンをクリーンアップ（ハイフン除去）
    const cleanPrefix = prefix.replace(/-/g, '');
    const patterns = [cleanPrefix];
    
    // in-/im- のような代替形式も考慮
    if (cleanPrefix === 'in' || cleanPrefix === 'im') {
      patterns.push('in', 'im', 'il', 'ir');
    }
    
    for (const pat of patterns) {
      if (lower.startsWith(pat) && word.length > pat.length + 2) {
        return pat;
      }
    }
  }
  
  return undefined;
}

/**
 * 接尾辞の抽出
 */
export function extractSuffix(word: string): string | undefined {
  const lower = word.toLowerCase();
  
  for (const { suffix } of COMMON_SUFFIXES) {
    // 接尾辞パターンをクリーンアップ
    const cleanSuffix = suffix.split('/')[0].replace(/-/g, '');
    
    if (lower.endsWith(cleanSuffix) && word.length > cleanSuffix.length + 2) {
      return cleanSuffix;
    }
  }
  
  return undefined;
}

/**
 * 語根の推定（簡易版）
 */
export function estimateRoot(word: string): string | undefined {
  const lower = word.toLowerCase();
  
  // 既知の語根リストから検索
  for (const { root, words } of WORD_ROOTS) {
    if (words.some(w => w === lower)) {
      return root;
    }
    // 語根が単語内に含まれるかチェック
    if (lower.includes(root)) {
      return root;
    }
  }
  
  // 接頭辞・接尾辞を除去して語根を推定
  let estimated = lower;
  
  const prefix = extractPrefix(word);
  if (prefix) {
    estimated = estimated.substring(prefix.length);
  }
  
  const suffix = extractSuffix(word);
  if (suffix) {
    estimated = estimated.substring(0, estimated.length - suffix.length);
  }
  
  // 推定語根が短すぎる場合は無効
  if (estimated.length < 3) {
    return undefined;
  }
  
  return estimated !== lower ? estimated : undefined;
}

/**
 * 品詞の推定（簡易版）
 */
export function estimatePartOfSpeech(word: string, meaning?: string): PartOfSpeech {
  const lower = word.toLowerCase();
  
  // 熟語チェック
  if (word.includes(' ')) {
    return 'phrase';
  }
  
  // 接尾辞から品詞を推定
  for (const { suffix, pos } of COMMON_SUFFIXES) {
    const cleanSuffix = suffix.split('/')[0].replace(/-/g, '');
    if (lower.endsWith(cleanSuffix)) {
      // noun/adjective のような複数の可能性がある場合は最初のものを返す
      return pos.split('/')[0] as PartOfSpeech;
    }
  }
  
  // 意味から推定（日本語の意味を使用）
  if (meaning) {
    if (meaning.includes('する') || meaning.includes('される')) {
      return 'verb';
    }
    if (meaning.includes('的な') || meaning.includes('い（形容詞語尾）')) {
      return 'adjective';
    }
    if (meaning.includes('に') || meaning.includes('で（副詞）')) {
      return 'adverb';
    }
  }
  
  return 'other';
}

/**
 * 単語のメタ情報を自動抽出
 */
export function extractWordMetadata(word: string, meaning?: string): WordMetadata {
  const prefix = extractPrefix(word);
  const suffix = extractSuffix(word);
  const root = estimateRoot(word);
  
  const family: WordFamily | undefined = 
    (prefix || suffix || root) ? { prefix, suffix, root } : undefined;
  
  const pos = estimatePartOfSpeech(word, meaning);
  const phrasePattern = identifyPhrasePattern(word);
  
  return {
    word,
    family,
    pos,
    phrasePattern: phrasePattern !== 'none' ? phrasePattern : undefined,
  };
}
