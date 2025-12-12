/**
 * 適応型学習AI - ユーザーの脳の記憶パターンを完全に把握するシステム
 *
 * このモジュールは以下の機能を提供します：
 * 1. 記憶定着度の0-100%判定
 * 2. 最適な復習間隔の自動計算（間隔反復アルゴリズム）
 * 3. 個人の忘却曲線の学習
 * 4. 定着ルートの最適化
 */

import { Question } from '@/types';
import { WordProgress } from '@/storage/progress/progressStorage';

/**
 * 記憶定着度（0-100%）
 * - 0-20%: 未学習/忘却
 * - 21-40%: 認識レベル
 * - 41-60%: 想起レベル
 * - 61-80%: 理解レベル
 * - 81-95%: 定着レベル
 * - 96-100%: 完全定着（長期記憶）
 */
export interface MemoryRetention {
  word: string;
  retentionScore: number; // 0-100
  confidence: number; // 判定の確度（0-1）
  lastCalculated: number; // タイムスタンプ
  forgettingCurveParams: {
    initialStrength: number; // 初期記憶強度
    decayRate: number; // 忘却率（個人差）
    reinforcementCount: number; // 強化回数
  };
  nextReviewTime: number; // 次回復習の最適タイミング（タイムスタンプ）
  reviewInterval: number; // 現在の復習間隔（ミリ秒）
  reviewHistory: ReviewEvent[]; // 復習履歴
}

export interface ReviewEvent {
  timestamp: number;
  wasCorrect: boolean;
  responseTime: number; // ミリ秒
  confidence: 'high' | 'medium' | 'low'; // ユーザーの自信度
  retentionScoreBefore: number; // 復習前の定着度
  retentionScoreAfter: number; // 復習後の定着度
}

/**
 * 間隔反復スケジュール
 * 誤答 → 2-3問後に再出題
 * 正答 → 記憶強度に応じて5-15問後に再出題
 */
export interface SpacedRepetitionSchedule {
  word: string;
  priority: number; // 出題優先度（高いほど早く出題）
  nextQuestionIndex: number; // 何問後に出題するか
  reason: string; // 出題理由（デバッグ用）
  estimatedDifficulty: number; // 推定難易度（0-1）
}

/**
 * ユーザーの学習特性プロファイル
 */
export interface UserLearningCharacteristics {
  avgForgettingRate: number; // 平均忘却率
  avgReinforcementEffect: number; // 平均強化効果
  optimalReviewIntervals: number[]; // 最適な復習間隔（ミリ秒）
  categorySpecificRates: { [category: string]: number }; // カテゴリー別忘却率
  timeOfDayEfficiency: { [hour: number]: number }; // 時間帯別学習効率
  learningVelocity: number; // 学習速度（単語/日）
  memoryCapacity: number; // 短期記憶容量（推定）
}

/**
 * 記憶定着度を計算
 * エビングハウスの忘却曲線 + 個人の学習履歴を組み合わせ
 */
export function calculateMemoryRetention(
  word: string,
  wordProgress: WordProgress | undefined,
  currentTime: number = Date.now()
): MemoryRetention {
  if (!wordProgress) {
    // 未学習の単語
    return {
      word,
      retentionScore: 0,
      confidence: 1.0,
      lastCalculated: currentTime,
      forgettingCurveParams: {
        initialStrength: 0,
        decayRate: 0.5, // デフォルト値
        reinforcementCount: 0,
      },
      nextReviewTime: currentTime,
      reviewInterval: 0,
      reviewHistory: [],
    };
  }

  // 学習履歴から忘却曲線のパラメータを推定
  const totalAttempts = wordProgress.correctCount + wordProgress.incorrectCount;
  const accuracy = totalAttempts > 0 ? wordProgress.correctCount / totalAttempts : 0;

  // 最終学習からの経過時間（日数）
  const daysSinceLastStudy = (currentTime - wordProgress.lastStudied) / (1000 * 60 * 60 * 24);

  // 初期記憶強度（正答率と連続正解から算出）
  const initialStrength = Math.min(
    100,
    accuracy * 100 * 0.6 + wordProgress.consecutiveCorrect * 10
  );

  // 個人の忘却率を推定（応答時間と誤答パターンから）
  const avgResponseTime = wordProgress.averageResponseTime || 3000;
  const responseTimeFactor = Math.min(1, avgResponseTime / 5000); // 遅いほど忘却率高い
  const errorRate = totalAttempts > 0 ? wordProgress.incorrectCount / totalAttempts : 0.5;
  const decayRate = 0.3 + errorRate * 0.4 + responseTimeFactor * 0.3;

  // 強化回数（復習の効果）
  const reinforcementCount = wordProgress.correctCount;

  // エビングハウスの忘却曲線を個人化
  // R(t) = R0 * e^(-t * k / (1 + reinforcement))
  // R0: 初期強度, t: 経過日数, k: 忘却率, reinforcement: 強化回数
  const reinforcementFactor = 1 + Math.log1p(reinforcementCount);
  const retentionScore = Math.max(
    0,
    Math.min(
      100,
      initialStrength * Math.exp((-daysSinceLastStudy * decayRate) / reinforcementFactor)
    )
  );

  // 信頼度（データ量に基づく）
  const confidence = Math.min(1, totalAttempts / 10);

  // 次回復習の最適タイミングを計算
  const { nextReviewTime, reviewInterval } = calculateOptimalReviewTime(
    retentionScore,
    reinforcementCount,
    decayRate,
    currentTime
  );

  return {
    word,
    retentionScore: Math.round(retentionScore * 10) / 10,
    confidence,
    lastCalculated: currentTime,
    forgettingCurveParams: {
      initialStrength,
      decayRate,
      reinforcementCount,
    },
    nextReviewTime,
    reviewInterval,
    reviewHistory: buildReviewHistory(wordProgress),
  };
}

/**
 * 最適な復習タイミングを計算
 * 記憶が70%程度に低下する時点を狙う（効率的な記憶定着）
 */
function calculateOptimalReviewTime(
  currentRetention: number,
  reinforcementCount: number,
  decayRate: number,
  currentTime: number
): { nextReviewTime: number; reviewInterval: number } {
  const targetRetention = 70; // 目標定着度

  if (currentRetention < targetRetention) {
    // すでに目標を下回っている → 即座に復習
    return {
      nextReviewTime: currentTime,
      reviewInterval: 0,
    };
  }

  // 目標定着度に達するまでの日数を計算
  // targetRetention = currentRetention * e^(-days * decayRate / reinforcementFactor)
  const reinforcementFactor = 1 + Math.log1p(reinforcementCount);
  const daysUntilTarget =
    (Math.log(currentRetention / targetRetention) * reinforcementFactor) / decayRate;

  // 最小1時間、最大30日
  const intervalDays = Math.max(0.04, Math.min(30, daysUntilTarget));
  const intervalMs = intervalDays * 24 * 60 * 60 * 1000;

  return {
    nextReviewTime: currentTime + intervalMs,
    reviewInterval: intervalMs,
  };
}

/**
 * 復習履歴を構築（WordProgressから）
 */
function buildReviewHistory(wordProgress: WordProgress): ReviewEvent[] {
  const events: ReviewEvent[] = [];

  // 簡易的な履歴構築（実際の詳細履歴がない場合）
  const totalAttempts = wordProgress.correctCount + wordProgress.incorrectCount;
  if (totalAttempts === 0) return events;

  // 最後の学習イベントのみ記録
  const accuracy = wordProgress.correctCount / totalAttempts;
  events.push({
    timestamp: wordProgress.lastStudied,
    wasCorrect: wordProgress.consecutiveCorrect > 0,
    responseTime: wordProgress.averageResponseTime || 3000,
    confidence: accuracy > 0.8 ? 'high' : accuracy > 0.5 ? 'medium' : 'low',
    retentionScoreBefore: accuracy * 80,
    retentionScoreAfter: accuracy * 100,
  });

  return events;
}

/**
 * 間隔反復スケジュールを生成
 * - 誤答した単語: 2-3問後に出題
 * - 正答した単語: 記憶強度に応じて5-15問後に出題
 */
export function generateSpacedRepetitionSchedule(
  recentAnswers: Array<{ word: string; wasCorrect: boolean; timestamp: number }>,
  wordProgressMap: { [word: string]: WordProgress },
  currentQuestionIndex: number,
  totalQuestionsInSession: number
): SpacedRepetitionSchedule[] {
  const schedule: SpacedRepetitionSchedule[] = [];
  const now = Date.now();

  recentAnswers.forEach((answer) => {
    const retention = calculateMemoryRetention(answer.word, wordProgressMap[answer.word], now);

    let nextQuestionIndex: number;
    let priority: number;
    let reason: string;

    if (!answer.wasCorrect) {
      // 誤答 → 2-3問後に再出題（短期記憶への刻印）
      nextQuestionIndex = currentQuestionIndex + 2 + Math.floor(Math.random() * 2);
      priority = 100; // 最高優先度
      reason = '誤答直後の短期記憶強化';
    } else {
      // 正答 → 記憶定着度に応じて間隔を調整
      if (retention.retentionScore > 90) {
        // 十分定着 → 15-20問後
        nextQuestionIndex = currentQuestionIndex + 15 + Math.floor(Math.random() * 6);
        priority = 20;
        reason = '長期記憶への移行確認';
      } else if (retention.retentionScore > 70) {
        // 定着中 → 10-15問後
        nextQuestionIndex = currentQuestionIndex + 10 + Math.floor(Math.random() * 6);
        priority = 40;
        reason = '定着強化';
      } else if (retention.retentionScore > 50) {
        // 不安定 → 5-8問後
        nextQuestionIndex = currentQuestionIndex + 5 + Math.floor(Math.random() * 4);
        priority = 60;
        reason = '記憶の安定化';
      } else {
        // 弱い記憶 → 3-5問後
        nextQuestionIndex = currentQuestionIndex + 3 + Math.floor(Math.random() * 3);
        priority = 80;
        reason = '弱い記憶の再強化';
      }
    }

    // セッション内に収まるように調整
    if (nextQuestionIndex >= totalQuestionsInSession) {
      nextQuestionIndex = totalQuestionsInSession - 1;
    }

    schedule.push({
      word: answer.word,
      priority,
      nextQuestionIndex,
      reason,
      estimatedDifficulty: 1 - retention.retentionScore / 100,
    });
  });

  return schedule;
}

/**
 * 出題する問題を動的に選択
 * - 間隔反復スケジュールに基づく再出題
 * - 新規問題
 * - 復習が必要な問題
 */
export function selectNextQuestions(
  allQuestions: Question[],
  wordProgressMap: { [word: string]: WordProgress },
  spacedRepetitionSchedule: SpacedRepetitionSchedule[],
  currentQuestionIndex: number,
  batchSize: number = 1
): Question[] {
  const now = Date.now();
  const selectedQuestions: Question[] = [];

  // 1. 間隔反復スケジュールからの出題
  const dueForReview = spacedRepetitionSchedule
    .filter((schedule) => schedule.nextQuestionIndex === currentQuestionIndex)
    .sort((a, b) => b.priority - a.priority);

  dueForReview.forEach((schedule) => {
    const question = allQuestions.find((q) => q.word === schedule.word);
    if (question && selectedQuestions.length < batchSize) {
      selectedQuestions.push(question);
    }
  });

  // 2. 復習が必要な問題（次回復習時刻が過ぎている）
  if (selectedQuestions.length < batchSize) {
    const needsReview = allQuestions
      .map((q) => ({
        question: q,
        retention: calculateMemoryRetention(q.word, wordProgressMap[q.word], now),
      }))
      .filter(({ retention }) => retention.nextReviewTime <= now)
      .sort((a, b) => a.retention.retentionScore - b.retention.retentionScore); // 定着度が低い順

    needsReview.forEach(({ question }) => {
      if (
        selectedQuestions.length < batchSize &&
        !selectedQuestions.find((q) => q.word === question.word)
      ) {
        selectedQuestions.push(question);
      }
    });
  }

  // 3. 新規問題（まだ出題されていない）
  if (selectedQuestions.length < batchSize) {
    const newQuestions = allQuestions
      .filter((q) => !wordProgressMap[q.word])
      .slice(0, batchSize - selectedQuestions.length);

    selectedQuestions.push(...newQuestions);
  }

  return selectedQuestions;
}

/**
 * ユーザーの学習特性プロファイルを構築
 */
export function buildUserLearningCharacteristics(wordProgressMap: {
  [word: string]: WordProgress;
}): UserLearningCharacteristics {
  const wordProgresses = Object.values(wordProgressMap);

  if (wordProgresses.length === 0) {
    return {
      avgForgettingRate: 0.5,
      avgReinforcementEffect: 1.2,
      optimalReviewIntervals: [
        1000 * 60 * 60 * 24, // 1日
        1000 * 60 * 60 * 24 * 3, // 3日
        1000 * 60 * 60 * 24 * 7, // 7日
        1000 * 60 * 60 * 24 * 14, // 14日
        1000 * 60 * 60 * 24 * 30, // 30日
      ],
      categorySpecificRates: {},
      timeOfDayEfficiency: {},
      learningVelocity: 20,
      memoryCapacity: 7, // マジックナンバー7±2
    };
  }

  // 忘却率の平均を計算
  let totalDecayRate = 0;
  let count = 0;

  wordProgresses.forEach((wp) => {
    const totalAttempts = wp.correctCount + wp.incorrectCount;
    if (totalAttempts > 0) {
      const errorRate = wp.incorrectCount / totalAttempts;
      const responseTimeFactor = Math.min(1, (wp.averageResponseTime || 3000) / 5000);
      const decayRate = 0.3 + errorRate * 0.4 + responseTimeFactor * 0.3;
      totalDecayRate += decayRate;
      count++;
    }
  });

  const avgForgettingRate = count > 0 ? totalDecayRate / count : 0.5;

  // カテゴリー別忘却率
  const categoryRates: { [category: string]: { sum: number; count: number } } = {};

  wordProgresses.forEach((wp) => {
    if (wp.category) {
      if (!categoryRates[wp.category]) {
        categoryRates[wp.category] = { sum: 0, count: 0 };
      }
      const totalAttempts = wp.correctCount + wp.incorrectCount;
      if (totalAttempts > 0) {
        const errorRate = wp.incorrectCount / totalAttempts;
        categoryRates[wp.category].sum += errorRate;
        categoryRates[wp.category].count++;
      }
    }
  });

  const categorySpecificRates: { [category: string]: number } = {};
  Object.entries(categoryRates).forEach(([category, data]) => {
    categorySpecificRates[category] = data.count > 0 ? data.sum / data.count : 0.5;
  });

  // 学習速度（過去7日間の平均）
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recentWords = wordProgresses.filter((wp) => wp.lastStudied >= sevenDaysAgo);
  const learningVelocity = recentWords.length / 7;

  // 最適な復習間隔（忘却率に基づいて調整）
  const baseIntervals = [1, 3, 7, 14, 30]; // 日数
  const optimalReviewIntervals = baseIntervals.map(
    (days) => days * 24 * 60 * 60 * 1000 * (1 / avgForgettingRate)
  );

  return {
    avgForgettingRate,
    avgReinforcementEffect: 1.2,
    optimalReviewIntervals,
    categorySpecificRates,
    timeOfDayEfficiency: {},
    learningVelocity,
    memoryCapacity: 7,
  };
}

/**
 * 定着率を計算（全体統計用）
 * 定着 = retentionScore >= 80%
 */
export function calculateRetentionRate(wordProgressMap: { [word: string]: WordProgress }): {
  retentionRate: number;
  masteredCount: number;
  appearedCount: number;
} {
  const wordProgresses = Object.values(wordProgressMap);
  const appearedWords = wordProgresses.filter((wp) => wp.correctCount + wp.incorrectCount > 0);

  let masteredCount = 0;
  const now = Date.now();

  appearedWords.forEach((wp) => {
    const retention = calculateMemoryRetention(wp.word, wp, now);
    if (retention.retentionScore >= 80) {
      masteredCount++;
    }
  });

  const retentionRate = appearedWords.length > 0 ? (masteredCount / appearedWords.length) * 100 : 0;

  // 定着率は0-100%の範囲に制限
  const normalizedRetentionRate = Math.min(100, Math.max(0, retentionRate));

  return {
    retentionRate: Math.round(normalizedRetentionRate),
    masteredCount,
    appearedCount: appearedWords.length,
  };
}
