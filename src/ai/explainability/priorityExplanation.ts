/**
 * Priority Explanation Service
 *
 * 優先度計算の理由を説明する機能
 * ユーザーに「なぜこの問題が選ばれたのか」を透明化
 */

import type { WordProgress } from '@/storage/progress/types';
import type { WordCategory } from '@/ai/types';
import { determineWordPosition, positionToCategory } from '@/ai/utils/categoryDetermination';

/** 優先度の理由 */
export interface PriorityExplanation {
  /** 総合優先度 */
  priority: number;
  /** カテゴリー */
  category: WordCategory;
  /** メイン理由（最も影響の大きい要因） */
  mainReason: string;
  /** 詳細な要因リスト */
  factors: PriorityFactor[];
  /** ユーザー向け簡潔メッセージ */
  userMessage: string;
  /** 推奨アクション */
  recommendedAction: string;
}

/** 優先度要因 */
export interface PriorityFactor {
  /** 要因名 */
  name: string;
  /** 影響度（ポイント） */
  impact: number;
  /** 説明 */
  description: string;
  /** アイコン（絵文字） */
  icon: string;
}

/**
 * 優先度の説明を生成
 *
 * @param progress - 単語の進捗情報
 * @returns 優先度の説明
 */
export function explainPriority(progress: WordProgress): PriorityExplanation {
  const factors: PriorityFactor[] = [];

  // カテゴリーを計算（progress.categoryは削除されたので動的に計算）
  const category = determineCategory(progress);
  const accuracy =
    progress.correctCount + progress.incorrectCount > 0
      ? progress.correctCount / (progress.correctCount + progress.incorrectCount)
      : 0;

  // ベース優先度（カテゴリー）
  const basePriority = getBasePriority(category);
  factors.push({
    name: 'カテゴリー',
    impact: basePriority,
    description: getCategoryDescription(category, accuracy),
    icon: getCategoryIcon(category),
  });

  // 時間経過ブースト
  const daysSinceLastStudy = calculateDaysSinceLastStudy(progress);
  const timeBoost = Math.min(daysSinceLastStudy * 2, 20);
  if (timeBoost > 0) {
    factors.push({
      name: '復習タイミング',
      impact: timeBoost,
      description: `${daysSinceLastStudy}日間復習していません（+${timeBoost.toFixed(0)}pt）`,
      icon: '⏰',
    });
  }

  // 連続不正解ペナルティ
  if (progress.consecutiveIncorrect >= 3) {
    const penalty = progress.consecutiveIncorrect * 5;
    factors.push({
      name: '連続不正解',
      impact: penalty,
      description: `${progress.consecutiveIncorrect}回連続で不正解（+${penalty}pt）`,
      icon: '⚠️',
    });
  }

  // 忘却リスク
  if (progress.lastRetentionRate !== undefined && progress.lastRetentionRate < 0.5) {
    const riskBoost = (1 - progress.lastRetentionRate) * 30;
    factors.push({
      name: '忘却リスク',
      impact: riskBoost,
      description: `記憶保持率${(progress.lastRetentionRate * 100).toFixed(0)}%（+${riskBoost.toFixed(0)}pt）`,
      icon: '🧠',
    });
  }

  // 総合優先度
  const totalPriority = progress.calculatedPriority || basePriority;

  // メイン理由を特定（最も影響の大きい要因）
  const sortedFactors = [...factors].sort((a, b) => b.impact - a.impact);
  const mainFactor = sortedFactors[0];

  // ユーザー向けメッセージ生成
  const userMessage = generateUserMessage(category, mainFactor, accuracy);

  // 推奨アクション生成
  const recommendedAction = generateRecommendedAction(category, accuracy, daysSinceLastStudy);

  return {
    priority: totalPriority,
    category,
    mainReason: mainFactor.description,
    factors: sortedFactors,
    userMessage,
    recommendedAction,
  };
}

/**
 * カテゴリー別のベース優先度を取得
 */
function getBasePriority(category: WordCategory): number {
  switch (category) {
    case 'incorrect':
      return 100;
    case 'still_learning':
      return 75;
    case 'new':
      return 50;
    case 'mastered':
      return 10;
    default:
      return 50;
  }
}

/**
 * カテゴリー説明を取得
 */
function getCategoryDescription(category: WordCategory, accuracy: number): string {
  switch (category) {
    case 'incorrect':
      return `苦手単語（正答率${(accuracy * 100).toFixed(0)}%）`;
    case 'still_learning':
      return `学習中（正答率${(accuracy * 100).toFixed(0)}%）`;
    case 'new':
      return '未学習の単語';
    case 'mastered':
      return `定着済み（正答率${(accuracy * 100).toFixed(0)}%）`;
    default:
      return 'カテゴリー不明';
  }
}

/**
 * カテゴリーアイコンを取得
 */
function getCategoryIcon(category: WordCategory): string {
  switch (category) {
    case 'incorrect':
      return '🔴';
    case 'still_learning':
      return '🟡';
    case 'new':
      return '🆕';
    case 'mastered':
      return '🟢';
    default:
      return '❓';
  }
}

/**
 * 最終学習日からの経過日数を計算
 */
function calculateDaysSinceLastStudy(progress: WordProgress): number {
  if (!progress.lastStudied) return 0;
  const now = Date.now();
  const lastStudied = progress.lastStudied;
  const daysDiff = (now - lastStudied) / (1000 * 60 * 60 * 24);
  return Math.floor(daysDiff);
}

/**
 * ユーザー向けメッセージを生成
 */
function generateUserMessage(
  category: WordCategory,
  mainFactor: PriorityFactor,
  accuracy: number
): string {
  if (category === 'incorrect') {
    return '苦手な単語です。集中的に復習しましょう！';
  }
  if (category === 'still_learning') {
    if (accuracy < 0.5) {
      return 'もう少しで定着します。繰り返し練習しましょう。';
    }
    return '順調に学習が進んでいます。引き続き頑張りましょう！';
  }
  if (category === 'new') {
    return '新しい単語です。まずは意味を覚えましょう。';
  }
  if (category === 'mastered') {
    if (mainFactor.name === '復習タイミング') {
      return '定着していますが、忘れる前に復習しておきましょう。';
    }
    return 'よく覚えています。定期的な復習で記憶を維持しましょう。';
  }
  return '一緒に学習を進めましょう！';
}

/**
 * 推奨アクションを生成
 */
function generateRecommendedAction(
  category: WordCategory,
  accuracy: number,
  daysSinceLastStudy: number
): string {
  if (category === 'incorrect') {
    return '語源や関連語を確認して、記憶の手がかりを増やしましょう';
  }
  if (category === 'still_learning') {
    if (accuracy < 0.5) {
      return '間違えやすいポイントを意識して、例文で使い方を確認しましょう';
    }
    return 'あと数回の正解で定着します。焦らず着実に進めましょう';
  }
  if (category === 'new') {
    return '発音と意味を一緒に覚えると効果的です';
  }
  if (category === 'mastered') {
    if (daysSinceLastStudy > 7) {
      return '1週間以上復習していません。忘れる前に確認しましょう';
    }
    return '定期的な復習で長期記憶に定着させましょう';
  }
  return '自分のペースで学習を続けましょう';
}

/**
 * 優先度の色を取得（Tailwind CSS用）
 */
export function getPriorityColor(priority: number): string {
  if (priority >= 100) return 'text-red-600 bg-red-50 border-red-200';
  if (priority >= 75) return 'text-orange-600 bg-orange-50 border-orange-200';
  if (priority >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  if (priority >= 25) return 'text-blue-600 bg-blue-50 border-blue-200';
  return 'text-green-600 bg-green-50 border-green-200';
}

/**
 * 優先度ラベルを取得
 */
export function getPriorityLabel(priority: number): string {
  if (priority >= 100) return '最優先';
  if (priority >= 75) return '優先';
  if (priority >= 50) return '通常';
  if (priority >= 25) return '低';
  return '最低';
}

/**
 * カテゴリーを判定（統一ユーティリティを使用）
 */
function determineCategory(progress: WordProgress): WordCategory {
  return positionToCategory(determineWordPosition(progress));
}
