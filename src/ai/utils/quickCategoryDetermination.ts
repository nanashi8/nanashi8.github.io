/**
 * 高速カテゴリー判定
 * UI応答を妨げない即座のカテゴリー判定（10-50ms目標）
 */

export type WordCategory = 'new' | 'correct' | 'incorrect' | 'still_learning' | 'mastered';

export interface QuickCategoryResult {
  category: WordCategory;
  confidence: number; // 0-1
  reasoning: string;
}

/**
 * 即座のカテゴリー判定（詳細AI分析なし）
 *
 * 判定ロジック:
 * 1. 正答率ベース（最優先）
 * 2. 連続正解数（補助）
 * 3. 最終学習からの経過時間（補助）
 */
export async function quickCategoryDetermination(
  word: string,
  isCorrect: boolean,
  recentHistory?: {
    totalAttempts: number;
    correctCount: number;
    consecutiveCorrect: number;
    lastStudiedAt?: number;
  }
): Promise<QuickCategoryResult> {
  // ヒストリーがない場合はデフォルト値
  const history = recentHistory || {
    totalAttempts: 0,
    correctCount: 0,
    consecutiveCorrect: 0,
  };

  // 新規単語（履歴なし）
  if (history.totalAttempts === 0) {
    return {
      category: isCorrect ? 'correct' : 'incorrect',
      confidence: 1.0,
      reasoning: isCorrect
        ? '初回で正解 → correct'
        : '初回で不正解 → incorrect',
    };
  }

  // 今回の結果を含めた統計
  const newTotalAttempts = history.totalAttempts + 1;
  const newCorrectCount = history.correctCount + (isCorrect ? 1 : 0);
  const newConsecutiveCorrect = isCorrect ? history.consecutiveCorrect + 1 : 0;
  const accuracy = newCorrectCount / newTotalAttempts;

  // 経過時間の計算（分単位）
  const minutesSinceLastStudy = history.lastStudiedAt
    ? (Date.now() - history.lastStudiedAt) / (1000 * 60)
    : 0;

  // ═══════════════════════════════════════════════════════════
  // 🔴 incorrect: 正答率50%未満
  // ═══════════════════════════════════════════════════════════
  if (accuracy < 0.5) {
    return {
      category: 'incorrect',
      confidence: 0.95,
      reasoning: `正答率${(accuracy * 100).toFixed(0)}% < 50% → incorrect`,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // 🟡 still_learning: 正答率50-79%
  // ═══════════════════════════════════════════════════════════
  if (accuracy < 0.8) {
    // 今回不正解なら確実に still_learning
    if (!isCorrect) {
      return {
        category: 'still_learning',
        confidence: 1.0,
        reasoning: `正答率${(accuracy * 100).toFixed(0)}% + 今回不正解 → still_learning`,
      };
    }

    // 今回正解でも連続正解が少ないなら still_learning
    if (newConsecutiveCorrect < 3) {
      return {
        category: 'still_learning',
        confidence: 0.9,
        reasoning: `正答率${(accuracy * 100).toFixed(0)}% + 連続正解${newConsecutiveCorrect}回 → still_learning`,
      };
    }

    // 連続3回正解なら correct に昇格
    return {
      category: 'correct',
      confidence: 0.85,
      reasoning: `正答率${(accuracy * 100).toFixed(0)}% + 連続3回正解 → correct`,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // 🟢 correct: 正答率80%以上
  // ═══════════════════════════════════════════════════════════

  // 今回不正解なら still_learning に降格
  if (!isCorrect) {
    return {
      category: 'still_learning',
      confidence: 0.95,
      reasoning: `正答率${(accuracy * 100).toFixed(0)}% だが今回不正解 → still_learning`,
    };
  }

  // 正答率80%以上 + 今回正解

  // 長期間経過している場合は confidence を下げる
  if (minutesSinceLastStudy > 1440) { // 1日以上
    return {
      category: 'correct',
      confidence: 0.8,
      reasoning: `正答率${(accuracy * 100).toFixed(0)}% + 今回正解（ただし${Math.floor(minutesSinceLastStudy / 60)}時間経過）`,
    };
  }

  // 通常の correct
  return {
    category: 'correct',
    confidence: 0.95,
    reasoning: `正答率${(accuracy * 100).toFixed(0)}% + 今回正解 → correct`,
  };
}

/**
 * 学習データから履歴を取得
 */
export async function getWordHistory(word: string): Promise<{
  totalAttempts: number;
  correctCount: number;
  consecutiveCorrect: number;
  lastStudiedAt?: number;
} | null> {
  try {
    const { getWordProgress } = await import('@/progressStorage');
    const progress = await getWordProgress(word);

    if (!progress) return null;

    return {
      totalAttempts: (progress.correctCount || 0) + (progress.incorrectCount || 0),
      correctCount: progress.correctCount || 0,
      consecutiveCorrect: progress.consecutiveCorrect || 0,
      lastStudiedAt: progress.lastStudied,
    };
  } catch (error) {
    console.error('[quickCategoryDetermination] Error fetching history:', error);
    return null;
  }
}

/**
 * 統合API: 履歴取得 + カテゴリー判定
 */
export async function determineCategory(
  word: string,
  isCorrect: boolean
): Promise<QuickCategoryResult> {
  const history = await getWordHistory(word);
  return quickCategoryDetermination(word, isCorrect, history || undefined);
}
