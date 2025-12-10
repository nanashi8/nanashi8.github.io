/**
 * 類似単語混同検出AI
 * よく間違える単語ペアやグループを自動検出し、集中的に出題する
 */

import { loadProgressSync, WordProgress } from '@/storage/progress/progressStorage';
import { Question } from '@/types';

/**
 * 混同しやすい単語ペア（スペルや意味が似ている）
 */
export const CONFUSION_PAIRS: { [key: string]: string[] } = {
  // スペルが似ている
  'accept': ['except'],
  'except': ['accept'],
  'affect': ['effect'],
  'effect': ['affect'],
  'dessert': ['desert'],
  'desert': ['dessert'],
  'quiet': ['quite'],
  'quite': ['quiet'],
  'lose': ['loose'],
  'loose': ['lose'],
  'advice': ['advise'],
  'advise': ['advice'],
  'breath': ['breathe'],
  'breathe': ['breath'],
  'cloth': ['clothe', 'clothes'],
  'clothe': ['cloth', 'clothes'],
  'clothes': ['cloth', 'clothe'],
  
  // 意味が似ている
  'borrow': ['lend'],
  'lend': ['borrow'],
  'teach': ['learn'],
  'learn': ['teach'],
  'speak': ['talk', 'say', 'tell'],
  'talk': ['speak', 'say', 'tell'],
  'say': ['speak', 'talk', 'tell'],
  'tell': ['speak', 'talk', 'say'],
  'see': ['look', 'watch'],
  'look': ['see', 'watch'],
  'watch': ['see', 'look'],
  'hear': ['listen'],
  'listen': ['hear'],
  'bring': ['take'],
  'take': ['bring'],
  'come': ['go'],
  'go': ['come'],
  
  // 前置詞
  'in': ['on', 'at'],
  'on': ['in', 'at'],
  'at': ['in', 'on'],
  'for': ['to', 'of'],
  'to': ['for', 'of'],
  'of': ['for', 'to'],
  
  // その他よく混同される単語
  'already': ['all ready'],
  'all ready': ['already'],
  'altogether': ['all together'],
  'all together': ['altogether'],
  'everyday': ['every day'],
  'every day': ['everyday'],
};

/**
 * 混同グループの定義
 */
export interface ConfusionGroup {
  words: string[];
  type: 'spelling' | 'meaning' | 'grammar';
  description: string;
  confusionScore: number; // 0-100、高いほど混同しやすい
  totalErrors: number; // グループ全体のエラー数
  needsReview: boolean; // 復習が必要か
}

/**
 * 単語の混同パートナーを取得
 */
export function getConfusionPartners(word: string): string[] {
  const lowerWord = word.toLowerCase();
  return CONFUSION_PAIRS[lowerWord] || [];
}

/**
 * ユーザーの混同パターンを分析
 */
export function analyzeConfusionPatterns(): ConfusionGroup[] {
  const progress = loadProgressSync();
  const groups: ConfusionGroup[] = [];
  const processedWords = new Set<string>();

  // すべての単語について混同パターンをチェック
  Object.entries(progress.wordProgress).forEach(([word]) => {
    if (processedWords.has(word.toLowerCase())) return;

    const partners = getConfusionPartners(word);
    if (partners.length === 0) return;

    // グループを作成
    const groupWords = [word, ...partners].map(w => w.toLowerCase());
    const uniqueWords = Array.from(new Set(groupWords));

    // グループ内の単語の進捗を集計
    let totalErrors = 0;
    let totalAttempts = 0;
    const wordProgresses: WordProgress[] = [];

    uniqueWords.forEach(w => {
      const wordProgress = progress.wordProgress[w];
      if (wordProgress) {
        totalErrors += wordProgress.incorrectCount;
        totalAttempts += wordProgress.correctCount + wordProgress.incorrectCount;
        wordProgresses.push(wordProgress);
      }
    });

    // 混同スコアを計算（エラー率 × 学習回数の重み）
    const errorRate = totalAttempts > 0 ? (totalErrors / totalAttempts) : 0;
    const confusionScore = Math.min(100, errorRate * 100 * Math.log1p(totalAttempts));

    // タイプを判定
    let type: 'spelling' | 'meaning' | 'grammar' = 'spelling';
    if (['speak', 'talk', 'say', 'tell', 'see', 'look', 'watch'].includes(word.toLowerCase())) {
      type = 'meaning';
    } else if (['in', 'on', 'at', 'for', 'to', 'of'].includes(word.toLowerCase())) {
      type = 'grammar';
    }

    groups.push({
      words: uniqueWords,
      type,
      description: getConfusionDescription(uniqueWords, type),
      confusionScore: Math.round(confusionScore),
      totalErrors,
      needsReview: confusionScore > 30 || errorRate > 0.3
    });

    // 処理済みとしてマーク
    uniqueWords.forEach(w => processedWords.add(w));
  });

  // スコアが高い順にソート
  return groups
    .filter(g => g.totalErrors > 0) // エラーがあるもののみ
    .sort((a, b) => b.confusionScore - a.confusionScore);
}

/**
 * 混同グループの説明を生成
 */
function getConfusionDescription(words: string[], type: string): string {
  if (type === 'spelling') {
    return `スペルが似ている: ${words.join(', ')}`;
  } else if (type === 'meaning') {
    return `意味が似ている: ${words.join(', ')}`;
  } else {
    return `文法的に混同しやすい: ${words.join(', ')}`;
  }
}

/**
 * 混同グループの単語を優先的に出題
 */
export function prioritizeConfusedWords(
  questions: Question[],
  maxConfusedWords: number = 10
): Question[] {
  const confusionGroups = analyzeConfusionPatterns();
  const priorityWords = new Set<string>();

  // 混同スコアが高いグループから単語を追加
  confusionGroups
    .filter(g => g.needsReview)
    .slice(0, 3) // 上位3グループ
    .forEach(group => {
      group.words.forEach(word => priorityWords.add(word));
    });

  // 優先単語を最初に配置
  const priorityQuestions = questions.filter(q => 
    priorityWords.has(q.word.toLowerCase())
  ).slice(0, maxConfusedWords);

  const otherQuestions = questions.filter(q => 
    !priorityWords.has(q.word.toLowerCase())
  );

  return [...priorityQuestions, ...otherQuestions];
}

/**
 * 混同グループ別の記憶定着度を計算
 */
export function calculateGroupRetention(group: ConfusionGroup): {
  groupRetention: number;
  individualRetentions: { [word: string]: number };
  variance: number; // グループ内のばらつき
} {
  const progress = loadProgressSync();
  const individualRetentions: { [word: string]: number } = {};
  const retentions: number[] = [];

  group.words.forEach(word => {
    const wp = progress.wordProgress[word];
    if (wp) {
      const totalAttempts = wp.correctCount + wp.incorrectCount;
      const retention = totalAttempts > 0 
        ? (wp.correctCount / totalAttempts) * 100 
        : 0;
      individualRetentions[word] = retention;
      retentions.push(retention);
    }
  });

  // グループ全体の平均定着度
  const groupRetention = retentions.length > 0
    ? retentions.reduce((sum, r) => sum + r, 0) / retentions.length
    : 0;

  // 分散（ばらつき）を計算
  const variance = retentions.length > 0
    ? retentions.reduce((sum, r) => sum + Math.pow(r - groupRetention, 2), 0) / retentions.length
    : 0;

  return {
    groupRetention: Math.round(groupRetention),
    individualRetentions,
    variance: Math.round(variance)
  };
}

/**
 * 混同グループのアドバイスを生成
 */
export function generateConfusionAdvice(group: ConfusionGroup): string {
  const retention = calculateGroupRetention(group);
  
  if (retention.groupRetention < 50) {
    return `⚠️ ${group.words.join(', ')} の区別が曖昧です。集中的に復習しましょう。`;
  } else if (retention.variance > 500) {
    return `📊 ${group.words.join(', ')} で定着度にばらつきがあります。弱い単語を重点的に。`;
  } else if (retention.groupRetention < 70) {
    return `💪 ${group.words.join(', ')} をもう少し練習すると完璧です！`;
  } else {
    return `✅ ${group.words.join(', ')} の区別がしっかりできています！`;
  }
}
