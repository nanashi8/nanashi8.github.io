/**
 * 学習アルゴリズム用の共通ユーティリティ関数
 * 間隔反復学習、忘却リスク計算、進捗管理など
 */

import { logger } from '@/utils/logger';

/**
 * 適応型間隔反復学習：個人の学習速度に最適化（SuperMemo SM-2アルゴリズムベース）
 * @param streak 連続正解数
 * @param easinessFactor 難易度係数（デフォルト: 2.5）
 * @returns 次回復習までの推奨間隔（日数）
 *
 * @example
 * calculateOptimalInterval(0) // => 0 (即座に再出題)
 * calculateOptimalInterval(1) // => 1 (1日後)
 * calculateOptimalInterval(2) // => 3 (3日後)
 * calculateOptimalInterval(3) // => 7 (7日後)
 * calculateOptimalInterval(4, 2.5) // => 18 (7 × 2.5^1)
 */
export function calculateOptimalInterval(streak: number, easinessFactor: number = 2.5): number {
  // 連続正解数に基づく基本間隔（日数）
  if (streak === 0) return 0; // 即座に再出題
  if (streak === 1) return 1; // 1日後
  if (streak === 2) return 3; // 3日後
  if (streak === 3) return 7; // 7日後

  // 4回目以降：前回の間隔 × 難易度係数（個人最適化）
  // SuperMemo SM-2: I(n) = I(n-1) × EF
  const baseInterval = 7;
  return Math.round(baseInterval * Math.pow(easinessFactor, streak - 3));
}

/**
 * 忘却リスクスコアの計算：今復習すべき度合い
 * エビングハウスの忘却曲線を考慮した計算
 *
 * @param lastStudied 最終学習時刻（Unixタイムスタンプ）
 * @param reviewInterval 推奨復習間隔（日数）
 * @param accuracy 正答率（0-100）
 * @returns 忘却リスクスコア（0-300+）
 *   - 0-50: 低リスク
 *   - 50-100: 中リスク
 *   - 100-150: 高リスク
 *   - 150+: 緊急（忘れる直前）
 *
 * @example
 * // 1日前に学習、推奨1日後復習、正答率80%
 * calculateForgettingRisk(Date.now() - 86400000, 1, 80) // => 110 (高リスク)
 *
 * // 3日前に学習、推奨1日後復習、正答率50%
 * calculateForgettingRisk(Date.now() - 259200000, 1, 50) // => 325 (緊急)
 */
export function calculateForgettingRisk(
  lastStudied: number,
  reviewInterval: number,
  accuracy: number
): number {
  const now = Date.now();
  const daysSinceStudy = (now - lastStudied) / (1000 * 60 * 60 * 24);
  const expectedInterval = reviewInterval || 1;

  // 時間リスク：経過時間 / 推奨間隔（100%を超えると忘却の危険）
  // 推奨間隔の2倍経過 → timeRisk = 200
  const timeRisk = (daysSinceStudy / expectedInterval) * 100;

  // 正答率リスク：低いほど忘れやすい
  // accuracy 0% → accuracyRisk = 50
  // accuracy 50% → accuracyRisk = 25
  // accuracy 100% → accuracyRisk = 0
  const accuracyRisk = (1 - accuracy / 100) * 50;

  return timeRisk + accuracyRisk;
}

/**
 * 段階的な学習を促す効果的な上限を計算
 * 急激に上限に達しないように、現在の進捗に応じて調整
 *
 * @param targetLimit 目標とする上限値
 * @param currentCount 現在のカウント
 * @returns 効果的な上限値
 *
 * @example
 * // 目標30、現在10個（前半50%未満）
 * calculateEffectiveLimit(30, 10) // => 23 (30 × 0.75)
 *
 * // 目標30、現在20個（50-75%）
 * calculateEffectiveLimit(30, 20) // => 26 (30 × 0.85)
 *
 * // 目標30、現在25個（75%以降）
 * calculateEffectiveLimit(30, 25) // => 30 (厳密に管理)
 */
export function calculateEffectiveLimit(targetLimit: number, currentCount: number): number {
  if (targetLimit === 0) return 0; // 設定無しの場合

  // 現在の進捗に基づいて段階的な目標を設定
  // 目標の50%までは自由に学習、その後は徐々に制限を厳しく
  const halfwayPoint = Math.ceil(targetLimit * 0.5);
  const threeQuarterPoint = Math.ceil(targetLimit * 0.75);

  if (currentCount < halfwayPoint) {
    // 前半50%: 目標の75%まで許容（余裕を持たせる）
    return Math.ceil(targetLimit * 0.75);
  } else if (currentCount < threeQuarterPoint) {
    // 50-75%: 目標の85%まで許容（少し厳しく）
    return Math.ceil(targetLimit * 0.85);
  } else {
    // 75%以降: 目標値そのまま（厳密に管理）
    return targetLimit;
  }
}

/**
 * 問題の状態情報
 */
export interface QuestionStatus {
  category: 'mastered' | 'still_learning' | 'incorrect' | 'new';
  priority: number;
  lastStudied: number;
  attempts: number;
  correct: number;
  streak: number;
  forgettingRisk?: number;
  reviewInterval?: number;
  accuracy?: number;
}

/**
 * localStorageから問題の状態を取得
 *
 * @param word 単語
 * @param mode 学習モード
 * @returns 問題の状態情報（存在しない場合はnull）
 */
export function getQuestionStatus(
  word: string,
  mode: 'memorization' | 'translation' | 'spelling' | 'grammar'
): QuestionStatus | null {
  const key = 'english-progress';
  const stored = localStorage.getItem(key);
  if (!stored) return null;

  try {
    const progress = JSON.parse(stored);
    const wordProgress = progress.wordProgress?.[word];
    if (!wordProgress) return null;

    // モードに応じた統計情報のキーを取得
    const modeKey =
      mode === 'memorization'
        ? 'memorization'
        : mode === 'translation'
          ? 'quiz'
          : mode === 'spelling'
            ? 'spelling'
            : 'grammar';

    const attempts = wordProgress[`${modeKey}Attempts`] || 0;
    const correct = wordProgress[`${modeKey}Correct`] || 0;
    const stillLearning = wordProgress[`${modeKey}StillLearning`] || 0;
    const streak = wordProgress[`${modeKey}Streak`] || 0;
    const lastStudied = wordProgress.lastStudied || 0;

    // 間隔反復学習用データ（暗記モードのみ）
    const easinessFactor = wordProgress.easinessFactor || 2.5;
    const reviewInterval =
      wordProgress.reviewInterval || calculateOptimalInterval(streak, easinessFactor);

    // 新規問題の場合
    if (attempts === 0) {
      return {
        category: 'new',
        priority: 3,
        lastStudied,
        attempts,
        correct,
        streak,
        forgettingRisk: 0,
        reviewInterval: 0,
        accuracy: 0,
      };
    }

    // まだまだを0.5回の正解として計算（正答率50%以上になるように）
    const effectiveCorrect = correct + stillLearning * 0.5;
    const accuracy = attempts > 0 ? (effectiveCorrect / attempts) * 100 : 0;

    // 忘却リスクを計算（暗記モードのみ）
    let forgettingRisk = 0;
    if (mode === 'memorization' && lastStudied > 0) {
      forgettingRisk = calculateForgettingRisk(lastStudied, reviewInterval, accuracy);
    }

    // カテゴリ判定
    // 🟢 覚えてる/定着: 連続3回以上 or 正答率80%以上で連続2回
    if (streak >= 3 || (streak >= 2 && accuracy >= 80)) {
      return {
        category: 'mastered',
        priority: 5,
        lastStudied,
        attempts,
        correct,
        streak,
        forgettingRisk,
        reviewInterval,
        accuracy,
      };
    }
    // 🟡 まだまだ/学習中: 正答率50%以上 or まだまだボタンを押したことがある
    else if (accuracy >= 50 || stillLearning > 0) {
      return {
        category: 'still_learning',
        priority: 2,
        lastStudied,
        attempts,
        correct,
        streak,
        forgettingRisk,
        reviewInterval,
        accuracy,
      };
    }
    // 🔴 分からない/要復習: 正答率50%未満 and まだまだボタンを押したことがない
    else {
      return {
        category: 'incorrect',
        priority: 1,
        lastStudied,
        attempts,
        correct,
        streak,
        forgettingRisk,
        reviewInterval,
        accuracy,
      };
    }
  } catch (error) {
    logger.error('統計情報の取得エラー:', error);
    return null;
  }
}

/**
 * 問題の進捗を更新
 *
 * @param word 単語
 * @param mode 学習モード
 * @param result 結果（'correct' | 'incorrect' | 'still_learning'）
 * @param responseTime 回答時間（ミリ秒、オプション）
 */
export function updateQuestionProgress(
  word: string,
  mode: 'memorization' | 'translation' | 'spelling' | 'grammar',
  result: 'correct' | 'incorrect' | 'still_learning',
  responseTime?: number
): void {
  const key = 'english-progress';
  const stored = localStorage.getItem(key);

  let progress: any = {};
  if (stored) {
    try {
      progress = JSON.parse(stored);
    } catch (error) {
      logger.error('進捗データの読み込みエラー:', error);
      progress = { wordProgress: {} };
    }
  }

  if (!progress.wordProgress) {
    progress.wordProgress = {};
  }

  if (!progress.wordProgress[word]) {
    progress.wordProgress[word] = {};
  }

  const wordProgress = progress.wordProgress[word];

  // モードに応じた統計情報のキーを取得
  const modeKey =
    mode === 'memorization'
      ? 'memorization'
      : mode === 'translation'
        ? 'quiz'
        : mode === 'spelling'
          ? 'spelling'
          : 'grammar';

  // 試行回数を増やす
  wordProgress[`${modeKey}Attempts`] = (wordProgress[`${modeKey}Attempts`] || 0) + 1;

  // 結果に応じて統計を更新
  if (result === 'correct') {
    wordProgress[`${modeKey}Correct`] = (wordProgress[`${modeKey}Correct`] || 0) + 1;
    wordProgress[`${modeKey}Streak`] = (wordProgress[`${modeKey}Streak`] || 0) + 1;
  } else if (result === 'still_learning') {
    wordProgress[`${modeKey}StillLearning`] = (wordProgress[`${modeKey}StillLearning`] || 0) + 1;
    // 連続正解はリセットしない（まだまだは部分的正解として扱う）
  } else {
    // incorrect
    wordProgress[`${modeKey}Streak`] = 0; // 連続正解をリセット
  }

  // 最終学習時刻を更新
  wordProgress.lastStudied = Date.now();

  // 回答時間を記録（オプション）
  if (responseTime !== undefined) {
    const responseTimes = wordProgress.responseTimes || [];
    responseTimes.push(responseTime);
    // 最新10回の平均を計算
    const recent = responseTimes.slice(-10);
    wordProgress.avgResponseSpeed =
      recent.reduce((sum: number, t: number) => sum + t, 0) / recent.length;
    wordProgress.responseTimes = recent; // 最新10回のみ保持
  }

  // 間隔反復学習用データを更新（暗記モードのみ）
  if (mode === 'memorization') {
    const streak = wordProgress[`${modeKey}Streak`] || 0;
    const easinessFactor = wordProgress.easinessFactor || 2.5;

    // 次回復習間隔を計算
    wordProgress.reviewInterval = calculateOptimalInterval(streak, easinessFactor);

    // 難易度係数を調整（正解で上昇、不正解で下降）
    if (result === 'correct') {
      wordProgress.easinessFactor = Math.min(easinessFactor + 0.1, 3.0);
    } else if (result === 'incorrect') {
      wordProgress.easinessFactor = Math.max(easinessFactor - 0.2, 1.3);
    }
  }

  // 保存
  try {
    localStorage.setItem(key, JSON.stringify(progress));
  } catch (error) {
    logger.error('進捗データの保存エラー:', error);
  }
}

/**
 * 復習が必要な問題をフィルタリング
 *
 * @param words 単語リスト
 * @param mode 学習モード
 * @returns 復習が必要な単語リスト
 */
export function filterQuestionsNeedingReview(
  words: string[],
  mode: 'memorization' | 'translation' | 'spelling' | 'grammar'
): string[] {
  return words.filter((word) => {
    const status = getQuestionStatus(word, mode);
    if (!status) return false;

    // 忘却リスクが高い、または不正解・学習中のカテゴリ
    return (
      (status.forgettingRisk && status.forgettingRisk >= 100) ||
      status.category === 'incorrect' ||
      status.category === 'still_learning'
    );
  });
}
