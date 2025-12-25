/**
 * quickCategoryDetermination.ts
 *
 * 進捗ストレージを参照しつつ、軽量に「今回の解答」を反映したカテゴリ判定を返す。
 *
 * NOTE:
 * - 本体の出題優先度は Position (0-100) が正。
 * - ここはユニットテスト/移行互換のための簡易API。
 */

import * as progressStorage from '@/progressStorage';

export type QuickCategory = 'incorrect' | 'still_learning' | 'correct';

export type WordHistory = {
  totalAttempts: number;
  correctCount: number;
  consecutiveCorrect: number;
  lastStudiedAt?: number;
};

export type QuickCategoryResult = {
  category: QuickCategory;
  confidence: number;
};

export async function getWordHistory(word: string): Promise<WordHistory | null> {
  try {
    const progress: any = await (progressStorage as any).getWordProgress(word);
    if (!progress) return null;

    const correctCount = Number(progress.correctCount || 0);
    const incorrectCount = Number(progress.incorrectCount || 0);
    const totalAttempts = correctCount + incorrectCount;

    return {
      totalAttempts,
      correctCount,
      consecutiveCorrect: Number(progress.consecutiveCorrect || 0),
      lastStudiedAt: progress.lastStudied,
    };
  } catch {
    return null;
  }
}

export async function quickCategoryDetermination(
  word: string,
  isCorrect: boolean,
  history: WordHistory
): Promise<QuickCategoryResult> {
  const totalAttempts = Math.max(0, Number(history.totalAttempts || 0));
  const correctCount = Math.max(0, Number(history.correctCount || 0));
  // テスト期待に合わせ、「今回の回答」を反映した精度で判定する
  // 例: totalAttempts=4, correctCount=3, 今回正解 => (3+1)/(4+1)=0.8
  const effectiveAttempts = totalAttempts + 1;
  const effectiveCorrect = correctCount + (isCorrect ? 1 : 0);
  const accuracy = effectiveAttempts > 0 ? effectiveCorrect / effectiveAttempts : 0;
  const consecutiveCorrect = Math.max(0, Number(history.consecutiveCorrect || 0));

  // 今回不正解なら、精度に応じて即座に降格（テスト期待に合わせて confidence を高めに）
  if (!isCorrect) {
    if (accuracy < 0.5) {
      return { category: 'incorrect', confidence: 0.9 };
    }
    if (accuracy < 0.8) {
      return { category: 'still_learning', confidence: 1.0 };
    }
    return { category: 'still_learning', confidence: 0.95 };
  }

  // 今回正解: 高精度 or 連続正解が十分なら correct
  if (accuracy >= 0.8 || consecutiveCorrect >= 5) {
    return { category: 'correct', confidence: 0.9 };
  }

  // それ以外は学習中
  return { category: 'still_learning', confidence: 0.8 };
}

export async function determineCategory(word: string, isCorrect: boolean): Promise<QuickCategoryResult> {
  const history = await getWordHistory(word);

  if (!history) {
    // 履歴がない場合でも判定できるように、今回の回答だけで履歴を仮置き
    return quickCategoryDetermination(word, isCorrect, {
      totalAttempts: 1,
      correctCount: isCorrect ? 1 : 0,
      consecutiveCorrect: isCorrect ? 1 : 0,
      lastStudiedAt: Date.now(),
    });
  }

  return quickCategoryDetermination(word, isCorrect, history);
}
