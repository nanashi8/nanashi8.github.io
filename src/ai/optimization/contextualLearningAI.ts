/**
 * 文脈学習AI (Contextual Learning AI)
 *
 * 目的:
 * - 意味的に関連する単語をグループ化し、文脈的学習を促進
 * - 類似単語や対義語を連続出題して記憶の定着を強化
 * - カテゴリーベースの学習シーケンスを最適化
 *
 * 機能:
 * 1. 意味的クラスタリング: 関連単語をグループ化
 * 2. 関連単語検出: 類似語・対義語・同じテーマの単語を抽出
 * 3. 文脈ベース出題順序: 関連単語を近くに配置して学習効率を向上
 * 4. テーマ別学習: ストーリー性のある単語シーケンスを生成
 */

import { Question } from '@/types';
import { WordProgress } from '@/storage/progress/progressStorage';
import { extractWordMetadata as _extractWordMetadata, type WordMetadata as _WordMetadata } from './wordMetadata';
import { getWordMetadata, getWordMetadataFromQuestion } from './wordMetadataCache';

/**
 * 意味的関連性のタイプ
 */
export type SemanticRelationType =
  | 'synonym' // 類義語
  | 'antonym' // 対義語
  | 'category' // 同じカテゴリー
  | 'theme' // 同じテーマ
  | 'word_family' // 語源が同じ
  | 'collocation' // よく一緒に使われる
  | 'context'; // 同じ文脈で使われる

/**
 * 意味的クラスター
 */
export interface SemanticCluster {
  id: string;
  name: string;
  theme: string;
  words: string[];
  relationType: SemanticRelationType;
  priority: number; // 学習優先度
}

/**
 * 単語間の関連性
 */
export interface WordRelation {
  word1: string;
  word2: string;
  relationType: SemanticRelationType;
  strength: number; // 0-1: 関連度の強さ
  description: string;
}

/**
 * 文脈学習シーケンス
 */
export interface ContextualSequence {
  clusters: SemanticCluster[];
  sequence: string[]; // 最適化された出題順序
  transitions: Array<{
    from: string;
    to: string;
    reason: string;
  }>;
}

/**
 * テーマ定義（意味的クラスタリング用）
 */
const SEMANTIC_THEMES = {
  emotions: {
    name: '感情',
    keywords: [
      'happy',
      'sad',
      'angry',
      'excited',
      'worried',
      'nervous',
      'calm',
      'joy',
      'fear',
      'love',
      'hate',
      'surprise',
    ],
    relatedCategories: ['形容詞'],
  },
  movement: {
    name: '動作・移動',
    keywords: [
      'walk',
      'run',
      'jump',
      'fly',
      'swim',
      'climb',
      'move',
      'go',
      'come',
      'enter',
      'leave',
      'return',
    ],
    relatedCategories: ['動詞'],
  },
  time: {
    name: '時間',
    keywords: [
      'day',
      'night',
      'morning',
      'evening',
      'week',
      'month',
      'year',
      'today',
      'tomorrow',
      'yesterday',
      'always',
      'never',
      'sometimes',
    ],
    relatedCategories: ['名詞', '副詞'],
  },
  weather: {
    name: '天気',
    keywords: [
      'sunny',
      'rainy',
      'cloudy',
      'windy',
      'snowy',
      'hot',
      'cold',
      'warm',
      'cool',
      'weather',
      'temperature',
    ],
    relatedCategories: ['形容詞', '名詞'],
  },
  food: {
    name: '食べ物',
    keywords: [
      'food',
      'eat',
      'drink',
      'cook',
      'meal',
      'breakfast',
      'lunch',
      'dinner',
      'hungry',
      'thirsty',
      'delicious',
    ],
    relatedCategories: ['名詞', '動詞', '形容詞'],
  },
  nature: {
    name: '自然',
    keywords: [
      'tree',
      'flower',
      'mountain',
      'river',
      'sea',
      'sky',
      'sun',
      'moon',
      'star',
      'nature',
      'plant',
      'animal',
    ],
    relatedCategories: ['名詞'],
  },
  family: {
    name: '家族・人間関係',
    keywords: [
      'family',
      'father',
      'mother',
      'brother',
      'sister',
      'parent',
      'child',
      'friend',
      'teacher',
      'student',
    ],
    relatedCategories: ['名詞'],
  },
  size: {
    name: '大きさ・程度',
    keywords: [
      'big',
      'small',
      'large',
      'tiny',
      'huge',
      'long',
      'short',
      'tall',
      'high',
      'low',
      'wide',
      'narrow',
    ],
    relatedCategories: ['形容詞'],
  },
  communication: {
    name: 'コミュニケーション',
    keywords: [
      'say',
      'speak',
      'talk',
      'tell',
      'ask',
      'answer',
      'listen',
      'hear',
      'write',
      'read',
      'call',
      'email',
    ],
    relatedCategories: ['動詞'],
  },
  learning: {
    name: '学習',
    keywords: [
      'learn',
      'study',
      'teach',
      'understand',
      'know',
      'remember',
      'forget',
      'practice',
      'improve',
      'test',
      'exam',
    ],
    relatedCategories: ['動詞', '名詞'],
  },
};

/**
 * 対義語ペアの定義
 */
const ANTONYM_PAIRS = [
  ['big', 'small'],
  ['large', 'small'],
  ['long', 'short'],
  ['tall', 'short'],
  ['high', 'low'],
  ['wide', 'narrow'],
  ['deep', 'shallow'],
  ['heavy', 'light'],
  ['strong', 'weak'],
  ['hard', 'soft'],
  ['hot', 'cold'],
  ['warm', 'cool'],
  ['fast', 'slow'],
  ['quick', 'slow'],
  ['early', 'late'],
  ['young', 'old'],
  ['new', 'old'],
  ['happy', 'sad'],
  ['good', 'bad'],
  ['right', 'wrong'],
  ['easy', 'difficult'],
  ['simple', 'complex'],
  ['start', 'end'],
  ['begin', 'finish'],
  ['open', 'close'],
  ['love', 'hate'],
  ['day', 'night'],
  ['morning', 'evening'],
  ['always', 'never'],
  ['often', 'rarely'],
  ['many', 'few'],
  ['much', 'little'],
  ['more', 'less'],
  ['increase', 'decrease'],
  ['rise', 'fall'],
  ['up', 'down'],
  ['front', 'back'],
  ['before', 'after'],
  ['first', 'last'],
  ['enter', 'leave'],
  ['come', 'go'],
  ['push', 'pull'],
  ['give', 'take'],
  ['buy', 'sell'],
  ['win', 'lose'],
  ['remember', 'forget'],
  ['find', 'lose'],
];

/**
 * 類義語グループの定義
 */
const SYNONYM_GROUPS = [
  ['big', 'large', 'huge', 'enormous'],
  ['small', 'little', 'tiny'],
  ['happy', 'glad', 'joyful', 'pleased'],
  ['sad', 'unhappy', 'sorrowful'],
  ['angry', 'mad', 'furious'],
  ['beautiful', 'pretty', 'lovely'],
  ['ugly', 'unattractive'],
  ['important', 'significant', 'essential'],
  ['difficult', 'hard', 'tough', 'challenging'],
  ['easy', 'simple'],
  ['fast', 'quick', 'rapid', 'swift'],
  ['slow', 'sluggish'],
  ['smart', 'intelligent', 'clever', 'bright'],
  ['stupid', 'foolish', 'dumb'],
  ['funny', 'amusing', 'humorous'],
  ['boring', 'dull', 'tedious'],
  ['interesting', 'fascinating', 'engaging'],
  ['tired', 'exhausted', 'weary'],
  ['afraid', 'scared', 'frightened', 'terrified'],
  ['brave', 'courageous', 'bold'],
  ['kind', 'nice', 'gentle', 'friendly'],
  ['mean', 'cruel', 'unkind'],
  ['rich', 'wealthy', 'affluent'],
  ['poor', 'needy'],
  ['famous', 'well-known', 'renowned'],
  ['strange', 'odd', 'weird', 'unusual'],
  ['normal', 'ordinary', 'common', 'typical'],
];

/**
 * 意味的クラスターを生成
 */
export function generateSemanticClusters(
  questions: Question[],
  wordProgress: Record<string, WordProgress>
): SemanticCluster[] {
  const clusters: SemanticCluster[] = [];
  const processedWords = new Set<string>();

  // 1. テーマベースのクラスタリング
  Object.entries(SEMANTIC_THEMES).forEach(([themeId, theme]) => {
    const themeWords = questions
      .filter((q) => {
        const word = q.word.toLowerCase();
        const meaning = q.meaning.toLowerCase();
        return (
          theme.keywords.some((keyword) => word.includes(keyword) || meaning.includes(keyword)) &&
          !processedWords.has(q.word)
        );
      })
      .map((q) => q.word);

    if (themeWords.length >= 2) {
      themeWords.forEach((w) => processedWords.add(w));

      // 優先度: 弱点単語が多いほど高優先度
      const weakWords = themeWords.filter((w) => {
        const progress = wordProgress[w];
        return progress && progress.incorrectCount > progress.correctCount;
      });
      const priority = 50 + (weakWords.length / themeWords.length) * 50;

      clusters.push({
        id: `theme_${themeId}`,
        name: theme.name,
        theme: themeId,
        words: themeWords,
        relationType: 'theme',
        priority,
      });
    }
  });

  // 2. 対義語ペアのクラスタリング
  ANTONYM_PAIRS.forEach((pair, index) => {
    const [word1, word2] = pair;
    const matchingWords = questions
      .filter((q) => {
        const word = q.word.toLowerCase();
        return (word === word1 || word === word2) && !processedWords.has(q.word);
      })
      .map((q) => q.word);

    if (matchingWords.length === 2) {
      matchingWords.forEach((w) => processedWords.add(w));

      clusters.push({
        id: `antonym_${index}`,
        name: `対義語: ${word1} ⇔ ${word2}`,
        theme: 'antonyms',
        words: matchingWords,
        relationType: 'antonym',
        priority: 70, // 対義語は高優先度
      });
    }
  });

  // 3. 類義語グループのクラスタリング
  SYNONYM_GROUPS.forEach((group, index) => {
    const matchingWords = questions
      .filter((q) => {
        const word = q.word.toLowerCase();
        return group.includes(word) && !processedWords.has(q.word);
      })
      .map((q) => q.word);

    if (matchingWords.length >= 2) {
      matchingWords.forEach((w) => processedWords.add(w));

      clusters.push({
        id: `synonym_${index}`,
        name: `類義語: ${group.join(', ')}`,
        theme: 'synonyms',
        words: matchingWords,
        relationType: 'synonym',
        priority: 60,
      });
    }
  });

  // 4. カテゴリーベースのクラスタリング（残りの単語）
  const categoryMap = new Map<string, string[]>();
  questions.forEach((q) => {
    if (!processedWords.has(q.word) && q.category) {
      const words = categoryMap.get(q.category) || [];
      words.push(q.word);
      categoryMap.set(q.category, words);
    }
  });

  categoryMap.forEach((words, category) => {
    if (words.length >= 3) {
      words.forEach((w) => processedWords.add(w));

      clusters.push({
        id: `category_${category}`,
        name: `カテゴリー: ${category}`,
        theme: category,
        words,
        relationType: 'category',
        priority: 40,
      });
    }
  });

  return clusters.sort((a, b) => b.priority - a.priority);
}

/**
 * 単語間の関連性を検出（メタ情報拡張版）
 */
export function detectWordRelations(word1: string, word2: string, question1?: Question, question2?: Question): WordRelation | null {
  const w1 = word1.toLowerCase();
  const w2 = word2.toLowerCase();

  // メタ情報を抽出（キャッシュ活用）
  const meta1 = question1
    ? getWordMetadataFromQuestion(question1)
    : getWordMetadata(word1);
  const meta2 = question2
    ? getWordMetadataFromQuestion(question2)
    : getWordMetadata(word2);

  // 語根チェック（最優先）
  if (meta1.family?.root && meta2.family?.root && meta1.family.root === meta2.family.root) {
    return {
      word1,
      word2,
      relationType: 'word_family',
      strength: 0.95,
      description: `"${word1}"と"${word2}"は同じ語根（${meta1.family.root}）`,
    };
  }

  // 接頭辞チェック
  if (meta1.family?.prefix && meta2.family?.prefix && meta1.family.prefix === meta2.family.prefix) {
    return {
      word1,
      word2,
      relationType: 'word_family',
      strength: 0.7,
      description: `"${word1}"と"${word2}"は同じ接頭辞（${meta1.family.prefix}-）`,
    };
  }

  // 接尾辞チェック（品詞が同じ場合のみ）
  if (meta1.family?.suffix && meta2.family?.suffix &&
      meta1.family.suffix === meta2.family.suffix &&
      meta1.pos === meta2.pos) {
    return {
      word1,
      word2,
      relationType: 'word_family',
      strength: 0.65,
      description: `"${word1}"と"${word2}"は同じ接尾辞（-${meta1.family.suffix}）`,
    };
  }

  // 熟語パターンチェック
  if (meta1.phrasePattern && meta2.phrasePattern &&
      meta1.phrasePattern === meta2.phrasePattern &&
      meta1.phrasePattern !== 'none') {
    return {
      word1,
      word2,
      relationType: 'collocation',
      strength: 0.75,
      description: `"${word1}"と"${word2}"は同じ熟語パターン`,
    };
  }

  // 対義語チェック
  for (const pair of ANTONYM_PAIRS) {
    if ((pair[0] === w1 && pair[1] === w2) || (pair[0] === w2 && pair[1] === w1)) {
      return {
        word1,
        word2,
        relationType: 'antonym',
        strength: 0.9,
        description: `"${word1}"と"${word2}"は対義語`,
      };
    }
  }

  // 類義語チェック
  for (const group of SYNONYM_GROUPS) {
    if (group.includes(w1) && group.includes(w2)) {
      return {
        word1,
        word2,
        relationType: 'synonym',
        strength: 0.8,
        description: `"${word1}"と"${word2}"は類義語`,
      };
    }
  }

  // テーマチェック
  for (const [, theme] of Object.entries(SEMANTIC_THEMES)) {
    const matchesTheme1 = theme.keywords.some((k) => w1.includes(k) || k.includes(w1));
    const matchesTheme2 = theme.keywords.some((k) => w2.includes(k) || k.includes(w2));

    if (matchesTheme1 && matchesTheme2) {
      return {
        word1,
        word2,
        relationType: 'theme',
        strength: 0.6,
        description: `"${word1}"と"${word2}"は同じテーマ（${theme.name}）`,
      };
    }
  }

  return null;
}

/**
 * 文脈ベースの最適出題順序を生成
 */
export function generateContextualSequence(
  questions: Question[],
  wordProgress: Record<string, WordProgress>,
  recentlyStudied: string[] = []
): ContextualSequence {
  const clusters = generateSemanticClusters(questions, wordProgress);
  const sequence: string[] = [];
  const transitions: Array<{ from: string; to: string; reason: string }> = [];
  const used = new Set<string>();

  // 最近学習した単語は除外
  recentlyStudied.forEach((w) => used.add(w));

  // 高優先度のクラスターから順に処理
  clusters.forEach((cluster) => {
    const availableWords = cluster.words.filter((w) => !used.has(w));

    if (availableWords.length === 0) return;

    // クラスター内の単語を学習状況でソート
    const sortedWords = availableWords.sort((a, b) => {
      const progressA = wordProgress[a];
      const progressB = wordProgress[b];

      if (!progressA && !progressB) return 0;
      if (!progressA) return -1; // 未学習を優先
      if (!progressB) return 1;

      // 誤答率が高い順
      const errorRateA =
        progressA.incorrectCount / (progressA.correctCount + progressA.incorrectCount || 1);
      const errorRateB =
        progressB.incorrectCount / (progressB.correctCount + progressB.incorrectCount || 1);

      return errorRateB - errorRateA;
    });

    // クラスターの単語を連続して配置
    sortedWords.forEach((word) => {
      if (used.has(word)) return;

      const prevWord = sequence[sequence.length - 1];
      if (prevWord) {
        // Questionオブジェクトを探して渡す（メタ情報活用のため）
        const prevQ = questions.find(q => q.word === prevWord);
        const currentQ = questions.find(q => q.word === word);
        const relation = detectWordRelations(prevWord, word, prevQ, currentQ);
        transitions.push({
          from: prevWord,
          to: word,
          reason: relation ? relation.description : `同じクラスター（${cluster.name}）`,
        });
      }

      sequence.push(word);
      used.add(word);
    });
  });

  // クラスターに属さない単語を追加
  questions.forEach((q) => {
    if (!used.has(q.word)) {
      sequence.push(q.word);
      used.add(q.word);
    }
  });

  return {
    clusters,
    sequence,
    transitions,
  };
}

/**
 * 関連単語の推奨（復習時）
 */
export function getRelatedWordsForReview(
  word: string,
  allQuestions: Question[],
  _wordProgress: Record<string, WordProgress>,
  maxSuggestions: number = 3
): string[] {
  const suggestions: Array<{ word: string; strength: number; reason: string }> = [];

  allQuestions.forEach((q) => {
    if (q.word === word) return;

    const relation = detectWordRelations(word, q.word);
    if (relation) {
      suggestions.push({
        word: q.word,
        strength: relation.strength,
        reason: relation.description,
      });
    }
  });

  // 強度順にソートして上位を返す
  return suggestions
    .sort((a, b) => b.strength - a.strength)
    .slice(0, maxSuggestions)
    .map((s) => s.word);
}

/**
 * クラスター学習の進捗を分析
 */
export function analyzeClusterProgress(
  cluster: SemanticCluster,
  wordProgress: Record<string, WordProgress>
): {
  masteredWords: string[];
  learningWords: string[];
  newWords: string[];
  completionRate: number;
  averageAccuracy: number;
} {
  const masteredWords: string[] = [];
  const learningWords: string[] = [];
  const newWords: string[] = [];
  let totalAttempts = 0;
  let totalCorrect = 0;

  cluster.words.forEach((word) => {
    const progress = wordProgress[word];

    if (!progress || (progress.correctCount === 0 && progress.incorrectCount === 0)) {
      newWords.push(word);
    } else if (progress.masteryLevel === 'mastered') {
      masteredWords.push(word);
      totalAttempts += progress.correctCount + progress.incorrectCount;
      totalCorrect += progress.correctCount;
    } else {
      learningWords.push(word);
      totalAttempts += progress.correctCount + progress.incorrectCount;
      totalCorrect += progress.correctCount;
    }
  });

  const completionRate = (masteredWords.length / cluster.words.length) * 100;
  const averageAccuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;

  return {
    masteredWords,
    learningWords,
    newWords,
    completionRate,
    averageAccuracy,
  };
}
