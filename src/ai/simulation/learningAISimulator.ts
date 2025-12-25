/**
 * 学習AIネットワーク シミュレーター
 *
 * 異なる学習パターンの生徒を想定し、AIがどのように問題を再出題するかをシミュレート
 */

import { calculateTimeBasedPriority } from '@/ai/nodes/TimeBasedPriorityAI';
import type { WordProgress } from '@/storage/progress/types';

// 生徒タイプ
type StudentPattern =
  | 'perfect' // 完璧型: ほとんど正解
  | 'struggling' // 苦戦型: 多くの問題で苦戦
  | 'inconsistent' // ムラ型: 得意不得意が激しい
  | 'slow-learner' // ゆっくり型: 徐々に定着
  | 'skip-heavy'; // スキップ多用型: スキップを多用

// 問題データ
interface Question {
  id: number;
  word: string;
  difficulty: number; // 0-1
}

// 解答結果
interface AnswerResult {
  questionId: number;
  word: string;
  correct: boolean;
  responseTime: number; // ミリ秒
  timestamp: number;
}

// シミュレーション結果
interface SimulationResult {
  studentPattern: StudentPattern;
  totalQuestions: number;
  answeredQuestions: AnswerResult[];
  wordProgressMap: Map<string, WordProgress>;
  reorderedQuestions: Array<{
    rank: number;
    questionId: number;
    word: string;
    priority: number;
    timeBoost: number;
    category: string;
    reason: string;
  }>;
}

/**
 * 30問の問題を生成
 */
function generateQuestions(): Question[] {
  return Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    word: `word${i + 1}`,
    difficulty: Math.random(),
  }));
}

/**
 * 生徒パターンに応じた解答を生成
 */
function generateAnswer(
  question: Question,
  pattern: StudentPattern,
  attemptNumber: number
): { correct: boolean; responseTime: number } {
  let correctProbability = 0.5;
  let baseResponseTime = 3000; // 3秒

  switch (pattern) {
    case 'perfect':
      // 完璧型: 90%正解、速い
      correctProbability = 0.9;
      baseResponseTime = 2000;
      break;

    case 'struggling':
      // 苦戦型: 30%正解、遅い
      correctProbability = 0.3;
      baseResponseTime = 8000;
      break;

    case 'inconsistent':
      // ムラ型: 難易度依存、普通
      correctProbability = question.difficulty < 0.5 ? 0.8 : 0.2;
      baseResponseTime = 4000;
      break;

    case 'slow-learner':
      // ゆっくり型: 試行回数に応じて向上
      correctProbability = Math.min(0.9, 0.2 + attemptNumber * 0.15);
      baseResponseTime = 5000;
      break;

    case 'skip-heavy':
      // スキップ多用型: 50%正解だが半分スキップ
      if (Math.random() < 0.5) {
        // スキップ扱い（不正解として記録）
        correctProbability = 0;
        baseResponseTime = 500;
      } else {
        correctProbability = 0.7;
        baseResponseTime = 3000;
      }
      break;
  }

  const correct = Math.random() < correctProbability;
  const responseTime = baseResponseTime + (Math.random() - 0.5) * 1000;

  return { correct, responseTime };
}

/**
 * WordProgressを更新
 */
function updateWordProgress(
  progress: WordProgress,
  correct: boolean,
  responseTime: number,
  timestamp: number
): WordProgress {
  const updated = { ...progress };

  if (correct) {
    updated.correctCount++;
    updated.consecutiveCorrect++;
    updated.consecutiveIncorrect = 0;
  } else {
    updated.incorrectCount++;
    updated.consecutiveIncorrect++;
    updated.consecutiveCorrect = 0;
  }

  updated.lastStudied = timestamp;
  updated.totalResponseTime += responseTime;
  updated.averageResponseTime =
    updated.totalResponseTime / (updated.correctCount + updated.incorrectCount);

  // 習熟レベル判定（4タブ統一：1発正解は定着済）
  const totalAttempts = updated.correctCount + updated.incorrectCount;
  if (totalAttempts === 1 && updated.correctCount === 1) {
    updated.masteryLevel = 'mastered'; // 1発正解
  } else if (updated.consecutiveCorrect >= 3) {
    updated.masteryLevel = 'mastered'; // 連続3回正解
  } else if (updated.correctCount + updated.incorrectCount > 0) {
    updated.masteryLevel = 'learning';
  }

  return updated;
}

/**
 * 問題の優先度を計算
 */
function calculatePriority(
  progress: WordProgress,
  _now: number
): {
  priority: number;
  timeBoost: number;
  category: string;
  reason: string;
} {
  // 時間ベース優先度
  const timeResult = calculateTimeBasedPriority(progress);
  const timeBoost = timeResult.timePriorityBoost;

  // カテゴリ判定
  let bucket = 'new';
  let basePriority = 50;
  let reason = '';

  const total = progress.correctCount + progress.incorrectCount;
  if (total === 0) {
    bucket = 'new';
    basePriority = 50;
    reason = '未学習';
  } else if (total === 1 && progress.correctCount === 1) {
    bucket = 'mastered';
    basePriority = 100; // 最後（時間経過で再出題）
    reason = '1発正解';
  } else if (progress.consecutiveCorrect >= 3) {
    bucket = 'mastered';
    basePriority = 100; // 最後
    reason = `連続正解${progress.consecutiveCorrect}回`;
  } else if (progress.incorrectCount > 0 && progress.consecutiveCorrect < 2) {
    bucket = 'incorrect';
    basePriority = 0; // 最優先
    reason = `不正解${progress.incorrectCount}回`;
  } else {
    bucket = 'learning';
    basePriority = 30;
    reason = `学習中（正解率${Math.round((progress.correctCount / total) * 100)}%）`;
  }

  // 時間ブーストを適用（数値が小さいほど優先）
  const finalPriority = basePriority - timeBoost * 0.5;

  return {
    priority: finalPriority,
    timeBoost,
    category: bucket,
    reason: `${reason} + 時間経過${timeResult.bucketName}`,
  };
}

/**
 * シミュレーション実行
 */
export function runSimulation(pattern: StudentPattern): SimulationResult {
  const questions = generateQuestions();
  const wordProgressMap = new Map<string, WordProgress>();
  const answeredQuestions: AnswerResult[] = [];

  // 初期化
  for (const q of questions) {
    wordProgressMap.set(q.word, {
      word: q.word,
      correctCount: 0,
      incorrectCount: 0,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,
      firstAttempted: Date.now(),
      lastStudied: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      difficultyScore: 50,
      masteryLevel: 'new',
      responseTimes: [],
    });
  }

  // 各問題を1回ずつ解答（時間経過をシミュレート）
  let currentTime = Date.now();
  for (const q of questions) {
    const progress = wordProgressMap.get(q.word)!;
    const attemptNumber = progress.correctCount + progress.incorrectCount + 1;
    const { correct, responseTime } = generateAnswer(q, pattern, attemptNumber);

    // 解答を記録
    answeredQuestions.push({
      questionId: q.id,
      word: q.word,
      correct,
      responseTime,
      timestamp: currentTime,
    });

    // WordProgressを更新
    const updated = updateWordProgress(progress, correct, responseTime, currentTime);
    wordProgressMap.set(q.word, updated);

    // 時間を進める（1問あたり5秒 + 応答時間）
    currentTime += responseTime + 5000;
  }

  // 現在時刻を設定（全問題終了後の時間）
  const now = currentTime;

  // 優先度を計算して並び替え
  const reorderedQuestions = questions
    .map((q) => {
      const progress = wordProgressMap.get(q.word)!;
      const { priority, timeBoost, category, reason } = calculatePriority(progress, now);
      return {
        rank: 0, // 後で設定
        questionId: q.id,
        word: q.word,
        priority,
        timeBoost,
        category,
        reason,
      };
    })
    .sort((a, b) => a.priority - b.priority) // 優先度が小さい順
    .map((item, index) => ({ ...item, rank: index + 1 }));

  return {
    studentPattern: pattern,
    totalQuestions: questions.length,
    answeredQuestions,
    wordProgressMap,
    reorderedQuestions,
  };
}

/**
 * シミュレーション結果を整形
 */
export function formatSimulationResult(result: SimulationResult): string {
  const lines: string[] = [];

  lines.push(`\n${'='.repeat(80)}`);
  lines.push(`生徒タイプ: ${result.studentPattern}`);
  lines.push(`総問題数: ${result.totalQuestions}`);
  lines.push(`${'='.repeat(80)}\n`);

  // 解答結果サマリー
  const correctCount = result.answeredQuestions.filter((a) => a.correct).length;
  const incorrectCount = result.answeredQuestions.filter((a) => !a.correct).length;
  const accuracy = (correctCount / result.totalQuestions) * 100;

  lines.push(`【解答結果サマリー】`);
  lines.push(`  正解: ${correctCount}問`);
  lines.push(`  不正解: ${incorrectCount}問`);
  lines.push(`  正解率: ${accuracy.toFixed(1)}%`);
  lines.push('');

  // カテゴリ別分布
  const categories = { incorrect: 0, learning: 0, mastered: 0, new: 0 };
  for (const q of result.reorderedQuestions) {
    switch (q.category) {
      case 'incorrect':
        categories.incorrect++;
        break;
      case 'learning':
        categories.learning++;
        break;
      case 'mastered':
        categories.mastered++;
        break;
      case 'new':
        categories.new++;
        break;
    }
  }

  lines.push(`【カテゴリ別分布】`);
  lines.push(`  分からない: ${categories.incorrect}問`);
  lines.push(`  まだまだ: ${categories.learning}問`);
  lines.push(`  覚えてる: ${categories.mastered}問`);
  lines.push(`  新規: ${categories.new}問`);
  lines.push('');

  // 再出題順（上位15問のみ表示）
  lines.push(`【AIが決定した再出題順（上位15問）】`);
  lines.push(`順位 | ID  | 単語      | カテゴリ   | 優先度 | 時間ブースト | 理由`);
  lines.push(`${'─'.repeat(80)}`);

  for (let i = 0; i < Math.min(15, result.reorderedQuestions.length); i++) {
    const q = result.reorderedQuestions[i];
    const category = q.category.padEnd(10);
    const priority = q.priority.toFixed(1).padStart(6);
    const timeBoost = `+${q.timeBoost}`.padStart(5);

    lines.push(
      `${String(q.rank).padStart(4)} | ${String(q.questionId).padStart(3)} | ${q.word.padEnd(9)} | ${category} | ${priority} | ${timeBoost}     | ${q.reason}`
    );
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * 全パターンのシミュレーションを実行
 */
export function runAllSimulations(): string {
  const patterns: StudentPattern[] = [
    'perfect',
    'struggling',
    'inconsistent',
    'slow-learner',
    'skip-heavy',
  ];

  const results = patterns.map((pattern) => {
    const result = runSimulation(pattern);
    return formatSimulationResult(result);
  });

  return results.join('\n\n');
}
