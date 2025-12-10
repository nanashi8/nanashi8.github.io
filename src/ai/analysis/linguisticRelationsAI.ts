/**
 * 言語学的関連性AI - 単語間のつながりを分析して関連出題
 * 
 * このモジュールは以下の機能を提供します：
 * 1. 語源・語根による関連性分析
 * 2. 品詞・文法パターンによるグループ化
 * 3. 意味ネットワーク構築（類義語・反義語・派生語）
 * 4. コロケーション（よく一緒に使われる単語）検出
 * 5. 動作・状態・性質による分類
 */

import { logger } from '@/logger';
import { Question } from '@/types';
// 言語学的関連性のみを扱うため、progressStorageのインポートは不要

/**
 * 言語学的関連性の種類
 */
export type LinguisticRelationType = 
  | 'etymology'        // 語源・語根が同じ
  | 'derivation'       // 派生語（同じ語根から派生）
  | 'synonym'          // 類義語
  | 'antonym'          // 反義語
  | 'collocation'      // コロケーション（よく一緒に使われる）
  | 'semantic_field'   // 意味分野（同じカテゴリー）
  | 'grammatical'      // 文法的関連（品詞変換）
  | 'phonetic'         // 音韻的類似（発音が似ている）
  | 'compound'         // 複合語の構成要素
  | 'phrasal_verb';    // 句動詞の関連

/**
 * 単語の言語学的特徴
 */
export interface LinguisticFeatures {
  word: string;
  
  // 形態素分析
  morphology: {
    root?: string;           // 語根（例: "happy" → "happ"）
    prefix?: string;         // 接頭辞（例: "un-", "re-"）
    suffix?: string;         // 接尾辞（例: "-ly", "-ness"）
    stem?: string;           // 語幹
  };
  
  // 品詞情報
  partOfSpeech: {
    primary: 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'other';
    subcategory?: string;    // 例: "transitive verb", "countable noun"
  };
  
  // 意味分類
  semanticCategory: {
    domain: string;          // 意味領域（例: "emotion", "action", "state"）
    subcategory?: string;    // 下位分類（例: "positive emotion", "physical action"）
    abstractness: number;    // 抽象度（0-1）
  };
  
  // 動作・状態分類
  actionType?: {
    isAction: boolean;       // 動作かどうか
    isState: boolean;        // 状態かどうか
    isProcess: boolean;      // 過程かどうか
    transitivity?: 'transitive' | 'intransitive' | 'both';
  };
  
  // 感情・評価
  sentiment?: {
    polarity: 'positive' | 'negative' | 'neutral';
    intensity: number;       // 強度（0-1）
  };
}

/**
 * 単語間の関連性
 */
export interface WordRelation {
  word1: string;
  word2: string;
  relationType: LinguisticRelationType;
  strength: number;         // 関連の強さ（0-1）
  explanation: string;      // 関連の説明
}

/**
 * 関連単語グループ
 */
export interface RelatedWordCluster {
  centralWord: string;
  relatedWords: {
    word: string;
    relationType: LinguisticRelationType;
    strength: number;
    shouldStudyTogether: boolean;  // 一緒に学習すべきか
  }[];
  clusterTheme: string;     // グループのテーマ
  studyPriority: number;    // 学習優先度
}

/**
 * 言語学的特徴を抽出（語源・接辞・品詞から分析）
 */
export function extractLinguisticFeatures(question: Question): LinguisticFeatures {
  const word = question.word.toLowerCase();
  
  // 形態素分析（簡易版）
  const morphology = analyzeMorphology(word, question.etymology);
  
  // 品詞判定
  const partOfSpeech = determinePartOfSpeech(word, question.meaning, question.relatedWords);
  
  // 意味分類
  const semanticCategory = classifySemanticCategory(question);
  
  // 動作・状態分類
  const actionType = classifyActionType(word, question.meaning, partOfSpeech.primary);
  
  // 感情・評価
  const sentiment = analyzeSentiment(question.meaning);
  
  return {
    word: question.word,
    morphology,
    partOfSpeech,
    semanticCategory,
    actionType,
    sentiment
  };
}

/**
 * 形態素分析（接頭辞・語根・接尾辞）
 */
function analyzeMorphology(word: string, etymology: string): LinguisticFeatures['morphology'] {
  const morphology: LinguisticFeatures['morphology'] = {};
  
  // 一般的な接頭辞
  const prefixes = ['un', 're', 'dis', 'pre', 'mis', 'over', 'under', 'sub', 'super', 'anti', 'de', 'ex', 'in', 'im'];
  for (const prefix of prefixes) {
    if (word.startsWith(prefix) && word.length > prefix.length + 2) {
      morphology.prefix = prefix;
      morphology.stem = word.substring(prefix.length);
      break;
    }
  }
  
  // 一般的な接尾辞
  const suffixes = ['ly', 'ness', 'ment', 'tion', 'sion', 'ity', 'er', 'or', 'ist', 'ful', 'less', 'able', 'ible', 'ous', 'ive', 'al', 'ic', 'ed', 'ing'];
  for (const suffix of suffixes) {
    if (word.endsWith(suffix) && word.length > suffix.length + 2) {
      morphology.suffix = suffix;
      if (!morphology.stem) {
        morphology.stem = word.substring(0, word.length - suffix.length);
      }
      break;
    }
  }
  
  // 語源から語根を抽出（簡易版）
  if (etymology) {
    const rootMatch = etymology.match(/(?:語根|root|stem)[:：]?\s*([a-zA-Z]+)/i);
    if (rootMatch) {
      morphology.root = rootMatch[1].toLowerCase();
    }
  }
  
  if (!morphology.root && morphology.stem) {
    morphology.root = morphology.stem;
  }
  
  return morphology;
}

/**
 * 品詞判定
 */
function determinePartOfSpeech(word: string, meaning: string, relatedWords: string): LinguisticFeatures['partOfSpeech'] {
  const lowerMeaning = meaning.toLowerCase();
  const lowerRelated = relatedWords.toLowerCase();
  
  // 動詞のパターン
  if (lowerMeaning.match(/する|される|〜る|〜う/) || 
      word.match(/ing$|ed$|s$/) ||
      lowerRelated.includes('verb')) {
    return { primary: 'verb', subcategory: detectVerbType(lowerMeaning) };
  }
  
  // 形容詞のパターン
  if (lowerMeaning.match(/〜い|〜な|〜的/) || 
      word.match(/ful$|less$|ous$|ive$|able$|ible$/) ||
      lowerRelated.includes('adjective')) {
    return { primary: 'adjective' };
  }
  
  // 副詞のパターン
  if (word.endsWith('ly') || lowerMeaning.match(/〜に|〜く/)) {
    return { primary: 'adverb' };
  }
  
  // 前置詞
  const prepositions = ['in', 'on', 'at', 'to', 'for', 'with', 'from', 'by', 'about', 'through', 'during', 'before', 'after'];
  if (prepositions.includes(word)) {
    return { primary: 'preposition' };
  }
  
  // デフォルトは名詞
  return { primary: 'noun', subcategory: detectNounType(lowerMeaning) };
}

function detectVerbType(meaning: string): string | undefined {
  if (meaning.includes('他動詞')) return 'transitive';
  if (meaning.includes('自動詞')) return 'intransitive';
  return undefined;
}

function detectNounType(meaning: string): string | undefined {
  if (meaning.includes('不可算')) return 'uncountable';
  if (meaning.includes('可算')) return 'countable';
  return undefined;
}

/**
 * 意味分類
 */
function classifySemanticCategory(question: Question): LinguisticFeatures['semanticCategory'] {
  const category = question.category || '';
  const meaning = question.meaning.toLowerCase();
  
  // カテゴリーベースの領域マッピング
  const domainMap: { [key: string]: { domain: string; subcategory?: string; abstractness: number } } = {
    '動物': { domain: 'living_things', subcategory: 'animals', abstractness: 0.1 },
    '植物': { domain: 'living_things', subcategory: 'plants', abstractness: 0.1 },
    '食べ物': { domain: 'physical_objects', subcategory: 'food', abstractness: 0.2 },
    '身体': { domain: 'physical_objects', subcategory: 'body_parts', abstractness: 0.2 },
    '感情': { domain: 'mental_states', subcategory: 'emotions', abstractness: 0.8 },
    '行動': { domain: 'actions', subcategory: 'physical_actions', abstractness: 0.4 },
    '状態': { domain: 'states', subcategory: 'conditions', abstractness: 0.6 },
    '時間': { domain: 'abstract_concepts', subcategory: 'time', abstractness: 0.9 },
    '場所': { domain: 'spatial_concepts', subcategory: 'locations', abstractness: 0.3 },
    '自然': { domain: 'natural_phenomena', abstractness: 0.3 },
    '天気': { domain: 'natural_phenomena', subcategory: 'weather', abstractness: 0.3 },
  };
  
  if (domainMap[category]) {
    return domainMap[category];
  }
  
  // 意味から推定
  if (meaning.match(/感じ|思|気持ち/)) {
    return { domain: 'mental_states', subcategory: 'emotions', abstractness: 0.8 };
  }
  if (meaning.match(/する|行う|動/)) {
    return { domain: 'actions', abstractness: 0.4 };
  }
  
  return { domain: 'general', abstractness: 0.5 };
}

/**
 * 動作・状態分類
 */
function classifyActionType(_word: string, meaning: string, pos: string): LinguisticFeatures['actionType'] | undefined {
  if (pos !== 'verb' && !meaning.match(/する|行う/)) {
    return undefined;
  }
  
  const isAction = meaning.match(/する|行う|動|作/) !== null;
  const isState = meaning.match(/〜である|〜な|状態/) !== null;
  const isProcess = meaning.match(/〜になる|変化|過程/) !== null;
  
  let transitivity: 'transitive' | 'intransitive' | 'both' | undefined;
  if (meaning.includes('他動詞')) transitivity = 'transitive';
  else if (meaning.includes('自動詞')) transitivity = 'intransitive';
  
  return {
    isAction,
    isState,
    isProcess,
    transitivity
  };
}

/**
 * 感情・評価分析
 */
function analyzeSentiment(meaning: string): LinguisticFeatures['sentiment'] | undefined {
  const positive = ['幸せ', '嬉しい', '良い', '素晴らしい', '美しい', '楽しい', '喜び'];
  const negative = ['悲しい', '怒り', '嫌', '悪い', '醜い', '苦しい', '痛い'];
  
  let polarity: 'positive' | 'negative' | 'neutral' = 'neutral';
  let intensity = 0.5;
  
  for (const word of positive) {
    if (meaning.includes(word)) {
      polarity = 'positive';
      intensity = 0.7;
      break;
    }
  }
  
  for (const word of negative) {
    if (meaning.includes(word)) {
      polarity = 'negative';
      intensity = 0.7;
      break;
    }
  }
  
  if (polarity === 'neutral') {
    return undefined;
  }
  
  return { polarity, intensity };
}

/**
 * 単語間の関連性を分析
 */
export function findWordRelations(
  question1: Question,
  question2: Question,
  features1: LinguisticFeatures,
  features2: LinguisticFeatures
): WordRelation[] {
  const relations: WordRelation[] = [];
  
  // 1. 語源・語根の関連
  if (features1.morphology.root && features2.morphology.root) {
    if (features1.morphology.root === features2.morphology.root) {
      relations.push({
        word1: question1.word,
        word2: question2.word,
        relationType: 'etymology',
        strength: 0.9,
        explanation: `共通の語根「${features1.morphology.root}」から派生`
      });
    }
  }
  
  // 2. 派生語の関連（接辞が異なるが語幹が同じ）
  if (features1.morphology.stem && features2.morphology.stem) {
    if (features1.morphology.stem === features2.morphology.stem && question1.word !== question2.word) {
      relations.push({
        word1: question1.word,
        word2: question2.word,
        relationType: 'derivation',
        strength: 0.85,
        explanation: `共通の語幹「${features1.morphology.stem}」から派生した単語`
      });
    }
  }
  
  // 3. 意味分野の関連
  if (features1.semanticCategory.domain === features2.semanticCategory.domain) {
    const strength = features1.semanticCategory.subcategory === features2.semanticCategory.subcategory ? 0.8 : 0.6;
    relations.push({
      word1: question1.word,
      word2: question2.word,
      relationType: 'semantic_field',
      strength,
      explanation: `同じ意味分野「${features1.semanticCategory.domain}」に属する`
    });
  }
  
  // 4. 文法的関連（品詞変換）
  if (features1.morphology.stem && features2.morphology.stem &&
      features1.morphology.stem === features2.morphology.stem &&
      features1.partOfSpeech.primary !== features2.partOfSpeech.primary) {
    relations.push({
      word1: question1.word,
      word2: question2.word,
      relationType: 'grammatical',
      strength: 0.75,
      explanation: `${features1.partOfSpeech.primary}と${features2.partOfSpeech.primary}の品詞変換`
    });
  }
  
  // 5. 対義語検出（簡易版）
  if (detectAntonyms(features1, features2)) {
    relations.push({
      word1: question1.word,
      word2: question2.word,
      relationType: 'antonym',
      strength: 0.8,
      explanation: '反対の意味を持つ対義語'
    });
  }
  
  // 6. 類義語検出（簡易版）
  if (detectSynonyms(question1, question2, features1, features2)) {
    relations.push({
      word1: question1.word,
      word2: question2.word,
      relationType: 'synonym',
      strength: 0.7,
      explanation: '似た意味を持つ類義語'
    });
  }
  
  return relations;
}

/**
 * 対義語検出
 */
function detectAntonyms(features1: LinguisticFeatures, features2: LinguisticFeatures): boolean {
  // 接頭辞による対義語（例: happy / unhappy）
  if (features1.morphology.prefix && !features2.morphology.prefix) {
    const antonymPrefixes = ['un', 'in', 'im', 'dis', 'non'];
    if (antonymPrefixes.includes(features1.morphology.prefix) &&
        features1.morphology.stem === features2.word) {
      return true;
    }
  }
  
  if (features2.morphology.prefix && !features1.morphology.prefix) {
    const antonymPrefixes = ['un', 'in', 'im', 'dis', 'non'];
    if (antonymPrefixes.includes(features2.morphology.prefix) &&
        features2.morphology.stem === features1.word) {
      return true;
    }
  }
  
  // 感情の極性が反対
  if (features1.sentiment && features2.sentiment) {
    if ((features1.sentiment.polarity === 'positive' && features2.sentiment.polarity === 'negative') ||
        (features1.sentiment.polarity === 'negative' && features2.sentiment.polarity === 'positive')) {
      if (features1.semanticCategory.domain === features2.semanticCategory.domain) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * 類義語検出
 */
function detectSynonyms(q1: Question, q2: Question, f1: LinguisticFeatures, f2: LinguisticFeatures): boolean {
  // 意味が非常に似ている
  if (f1.semanticCategory.domain === f2.semanticCategory.domain &&
      f1.semanticCategory.subcategory === f2.semanticCategory.subcategory &&
      f1.partOfSpeech.primary === f2.partOfSpeech.primary) {
    
    // 意味の文字列が似ている（簡易的な類似度）
    const similarity = calculateMeaningSimilarity(q1.meaning, q2.meaning);
    if (similarity > 0.6) {
      return true;
    }
  }
  
  return false;
}

/**
 * 意味の類似度計算（簡易版）
 */
function calculateMeaningSimilarity(meaning1: string, meaning2: string): number {
  const words1 = new Set(meaning1.split(/[、。]/));
  const words2 = new Set(meaning2.split(/[、。]/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * 関連単語クラスターを生成
 */
export function generateRelatedWordClusters(
  allQuestions: Question[],
  targetWord: string
): RelatedWordCluster[] {
  const targetQuestion = allQuestions.find(q => q.word.toLowerCase() === targetWord.toLowerCase());
  if (!targetQuestion) return [];
  
  const targetFeatures = extractLinguisticFeatures(targetQuestion);
  const clusters: RelatedWordCluster[] = [];
  
  // 各単語との関連性を計算
  const relatedWords: RelatedWordCluster['relatedWords'] = [];
  
  allQuestions.forEach(q => {
    if (q.word === targetWord) return;
    
    const features = extractLinguisticFeatures(q);
    const relations = findWordRelations(targetQuestion, q, targetFeatures, features);
    
    relations.forEach(relation => {
      relatedWords.push({
        word: q.word,
        relationType: relation.relationType,
        strength: relation.strength,
        shouldStudyTogether: relation.strength >= 0.7
      });
    });
  });
  
  // 関連の強さでソート
  relatedWords.sort((a, b) => b.strength - a.strength);
  
  // クラスターを生成（上位10件）
  if (relatedWords.length > 0) {
    clusters.push({
      centralWord: targetWord,
      relatedWords: relatedWords.slice(0, 10),
      clusterTheme: targetFeatures.semanticCategory.domain,
      studyPriority: calculateClusterPriority(relatedWords)
    });
  }
  
  return clusters;
}

/**
 * クラスターの学習優先度を計算
 */
function calculateClusterPriority(relatedWords: RelatedWordCluster['relatedWords']): number {
  if (relatedWords.length === 0) return 0;
  
  const avgStrength = relatedWords.reduce((sum, w) => sum + w.strength, 0) / relatedWords.length;
  const studyTogetherCount = relatedWords.filter(w => w.shouldStudyTogether).length;
  
  return avgStrength * 0.6 + (studyTogetherCount / relatedWords.length) * 0.4;
}

/**
 * 関連出題システム - 学習した単語の関連語を優先出題
 */
export function selectRelatedQuestions(
  recentlyStudiedWords: string[],
  allQuestions: Question[],
  targetCount: number = 10
): Question[] {
  const selected: Question[] = [];
  const selectedWords = new Set<string>();
  
  // 最近学習した単語の関連語を探す
  recentlyStudiedWords.slice(-5).forEach(studiedWord => {
    const clusters = generateRelatedWordClusters(allQuestions, studiedWord);
    
    clusters.forEach(cluster => {
      const stronglyRelated = cluster.relatedWords
        .filter(rw => rw.shouldStudyTogether && !selectedWords.has(rw.word))
        .slice(0, 2); // 各単語から最大2つ
      
      stronglyRelated.forEach(rw => {
        const question = allQuestions.find(q => q.word === rw.word);
        if (question && selected.length < targetCount) {
          selected.push(question);
          selectedWords.add(rw.word);
          logger.log(`🔗 関連出題: "${studiedWord}" → "${rw.word}" (${rw.relationType})`);
        }
      });
    });
  });
  
  return selected;
}

/**
 * 言語学的に効果的な学習順序を生成
 */
export function generateLinguisticStudyOrder(
  questions: Question[]
): Question[] {
  // 1. 全単語の言語学的特徴を抽出
  const featuresMap = new Map<string, LinguisticFeatures>();
  questions.forEach(q => {
    featuresMap.set(q.word, extractLinguisticFeatures(q));
  });
  
  // 2. 基本語（語根）を先に学習
  const rootWords = questions.filter(q => {
    const features = featuresMap.get(q.word);
    return features && !features.morphology.prefix && !features.morphology.suffix;
  });
  
  // 3. 派生語を後に学習
  const derivedWords = questions.filter(q => {
    const features = featuresMap.get(q.word);
    return features && (features.morphology.prefix || features.morphology.suffix);
  });
  
  // 4. 意味分野でグループ化
  const orderedQuestions: Question[] = [];
  
  // 基本語を先に
  orderedQuestions.push(...rootWords);
  
  // 派生語を関連順に
  orderedQuestions.push(...derivedWords);
  
  return orderedQuestions;
}
