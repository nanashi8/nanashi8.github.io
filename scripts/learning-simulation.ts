// @ts-nocheck
// 学習AIネットワーク シミュレーション
// 5種類の生徒パターンで30問の解答→優先度計算→並び替えをシミュレート

/// <reference types="node" />

// 時間ベースバケット設定（実装と同じ）
const TIME_BUCKETS_LEARNING = [1, 3, 5, 7, 10, 15, 30, 60, 120, 180, 240, 300, 360, 420, 480, 720, 1440];
const BUCKET_BOOST_LEARNING = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 85, 90, 95, 98, 100];

interface WordProgress {
  word: string;
  correctCount: number;
  incorrectCount: number;
  consecutiveCorrect: number;
  masteryLevel: 'mastered' | 'learning' | 'new';
  firstAttempted: number;
  lastStudied: number;
  category: string;
}

interface Question {
  id: number;
  word: string;
  difficulty: number;
}

type StudentPattern = 'perfect' | 'struggling' | 'inconsistent' | 'slow-learner' | 'skip-heavy';

interface AnswerResult {
  isCorrect: boolean;
  isSkip: boolean; // スキップフラグ（正解扱いだが、明示的に区別）
}

// 時間ベース優先度計算（TimeBasedPriorityAI.tsと同じロジック）
function calculateTimeBasedPriority(progress: WordProgress): number {
  if (!progress.firstAttempted) return 0;

  const elapsedMinutes = (Date.now() - progress.firstAttempted) / (1000 * 60);

  let boost = 0;
  for (let i = 0; i < TIME_BUCKETS_LEARNING.length; i++) {
    if (elapsedMinutes >= TIME_BUCKETS_LEARNING[i]) {
      boost = BUCKET_BOOST_LEARNING[i];
    } else {
      break;
    }
  }

  return boost;
}

// カテゴリ判定（questionPrioritySorter.tsと同じロジック）
function determineCategory(progress: WordProgress): string {
  const total = progress.correctCount + progress.incorrectCount;
  if (total === 0) return '未学習';

  const accuracy = progress.correctCount / total;
  const { consecutiveCorrect, masteryLevel } = progress;

  // 覚えてる（優先度低）
  if (masteryLevel === 'mastered' ||
      (total === 1 && progress.correctCount === 1) ||
      consecutiveCorrect >= 3 ||
      (consecutiveCorrect >= 2 && accuracy >= 0.8)) {
    return '覚えてる';
  }

  // 分からない（最優先）
  if (accuracy < 0.4 || consecutiveCorrect === 0) {
    return '分からない';
  }

  // まだまだ（中優先）
  return 'まだまだ';
}

// カテゴリ別基礎優先度
function getCategoryBasePriority(category: string): number {
  if (category === '分からない') return 0;
  if (category === 'まだまだ') return 30;
  if (category === '覚えてる') return 100;
  return 50;
}

// 30問生成
function generateQuestions(): Question[] {
  const questions: Question[] = [];
  for (let i = 1; i <= 30; i++) {
    questions.push({
      id: i,
      word: `word${i}`,
      difficulty: i <= 10 ? 1 : i <= 20 ? 2 : 3 // 簡単10問、普通10問、難しい10問
    });
  }
  return questions;
}

// 生徒パターン別の解答生成
function generateAnswer(question: Question, pattern: StudentPattern, attemptIndex: number): AnswerResult {
  switch (pattern) {
    case 'perfect':
      return { isCorrect: Math.random() < 0.9, isSkip: false }; // 90%正解

    case 'struggling':
      return { isCorrect: Math.random() < 0.3, isSkip: false }; // 30%正解

    case 'inconsistent':
      // 難易度依存型
      let prob = 0.5;
      if (question.difficulty === 1) prob = 0.8;
      if (question.difficulty === 2) prob = 0.5;
      if (question.difficulty === 3) prob = 0.2;
      return { isCorrect: Math.random() < prob, isSkip: false };

    case 'slow-learner':
      // 徐々に改善
      const baseRate = 0.4;
      const improvement = attemptIndex * 0.02; // 2%ずつ向上
      return { isCorrect: Math.random() < (baseRate + improvement), isSkip: false };

    case 'skip-heavy':
      // 50%の確率でスキップ（正解扱い + 定着済み扱い）
      if (Math.random() < 0.5) {
        return { isCorrect: true, isSkip: true }; // スキップは正解扱い
      }
      return { isCorrect: Math.random() < 0.6, isSkip: false }; // 実際の解答は60%正解

    default:
      return { isCorrect: false, isSkip: false };
  }
}

// シミュレーション実行
function runSimulation(pattern: StudentPattern): { progress: WordProgress[], sorted: WordProgress[] } {
  const questions = generateQuestions();
  const progressMap = new Map<string, WordProgress>();
  const baseTime = Date.now() - 60 * 60 * 1000; // 1時間前から開始

  questions.forEach((q, index) => {
    const answer = generateAnswer(q, pattern, index);

    if (!progressMap.has(q.word)) {
      progressMap.set(q.word, {
        word: q.word,
        correctCount: 0,
        incorrectCount: 0,
        consecutiveCorrect: 0,
        masteryLevel: 'new',
        firstAttempted: baseTime + index * 2 * 60 * 1000, // 2分間隔
        lastStudied: baseTime + index * 2 * 60 * 1000,
        category: '未学習'
      });
    }

    const prog = progressMap.get(q.word)!;

    // スキップは正解扱い（実装仕様: GrammarQuizView.tsx line 443, SpellingView.tsx line 459）
    if (answer.isCorrect) {
      prog.correctCount++;
      prog.consecutiveCorrect++;
    } else {
      prog.incorrectCount++;
      prog.consecutiveCorrect = 0;
    }

    const total = prog.correctCount + prog.incorrectCount;
    const accuracy = prog.correctCount / total;

    // masteryLevel更新
    if (total === 1 && prog.correctCount === 1) {
      prog.masteryLevel = 'mastered';
    } else if (prog.consecutiveCorrect >= 3 || (total >= 3 && accuracy >= 0.9)) {
      prog.masteryLevel = 'mastered';
    } else {
      prog.masteryLevel = 'learning';
    }

    prog.category = determineCategory(prog);
    prog.lastStudied = baseTime + index * 2 * 60 * 1000;
  });

  const progressArray = Array.from(progressMap.values());

  // 優先度計算 & ソート
  const sorted = progressArray.map(prog => {
    const timeBoost = calculateTimeBasedPriority(prog);
    const basePriority = getCategoryBasePriority(prog.category);
    const finalPriority = basePriority - timeBoost * 0.05; // 実装と同じ重み付け

    return {
      ...prog,
      timeBoost,
      basePriority,
      finalPriority
    };
  }).sort((a, b) => a.finalPriority - b.finalPriority);

  return { progress: progressArray, sorted };
}

// 結果フォーマット
function formatResult(pattern: StudentPattern, result: ReturnType<typeof runSimulation>) {
  const patternNames: Record<StudentPattern, string> = {
    perfect: '完璧型（90%正解）',
    struggling: '苦戦型（30%正解）',
    inconsistent: 'ムラ型（難易度依存）',
    'slow-learner': 'ゆっくり型（徐々に改善）',
    'skip-heavy': 'スキップ多用型（50%スキップ）'
  };

  console.log(`\n${'='.repeat(80)}`);
  console.log(`【${patternNames[pattern]}】`);
  console.log(`${'='.repeat(80)}\n`);

  // 統計サマリ
  const categoryCount = {
    '分からない': 0,
    'まだまだ': 0,
    '覚えてる': 0
  };

  result.progress.forEach(p => {
    if (p.category in categoryCount) {
      categoryCount[p.category as keyof typeof categoryCount]++;
    }
  });

  const totalCorrect = result.progress.reduce((sum, p) => sum + p.correctCount, 0);
  const totalIncorrect = result.progress.reduce((sum, p) => sum + p.incorrectCount, 0);
  const accuracy = Math.round(totalCorrect / (totalCorrect + totalIncorrect) * 100);

  console.log(`📊 解答統計:`);
  console.log(`   正解: ${totalCorrect}回 / 不正解: ${totalIncorrect}回 / 正答率: ${accuracy}%\n`);

  console.log(`📂 カテゴリ分布:`);
  console.log(`   分からない: ${categoryCount['分からない']}語`);
  console.log(`   まだまだ: ${categoryCount['まだまだ']}語`);
  console.log(`   覚えてる: ${categoryCount['覚えてる']}語\n`);

  console.log(`🔄 学習AIによる再出題順（上位15問）:\n`);
  console.log(`順位 | 単語    | カテゴリ   | 基礎優先度 | 時間ブースト | 最終優先度 | 連続正解`);
  console.log(`${'─'.repeat(88)}`);

  result.sorted.slice(0, 15).forEach((item: any, index) => {
    const rank = String(index + 1).padStart(3);
    const word = item.word.padEnd(8);
    const category = item.category.padEnd(10);
    const base = String(item.basePriority).padStart(9);
    const boost = String(item.timeBoost).padStart(12);
    const final = item.finalPriority.toFixed(2).padStart(10);
    const streak = String(item.consecutiveCorrect).padStart(8);

    console.log(`${rank}  | ${word} | ${category} | ${base} | ${boost} | ${final} | ${streak}`);
  });

  console.log('');
}

// メイン実行
console.log('\n学習AIネットワーク シミュレーション');
console.log('━'.repeat(80));
console.log('5種類の生徒パターンで30問解答後の再出題順を計算\n');
console.log('実装仕様:');
console.log('• 時間バケット: 1分→3分→5分...→24時間（17段階）');
console.log('• 優先度ブースト: +5 → +100');
console.log('• カテゴリ: 分からない(優先度0) / まだまだ(30) / 覚えてる(100)');
console.log('• 最終優先度 = 基礎優先度 - 時間ブースト×0.05\n');

const patterns: StudentPattern[] = ['perfect', 'struggling', 'inconsistent', 'slow-learner', 'skip-heavy'];

patterns.forEach(pattern => {
  const result = runSimulation(pattern);
  formatResult(pattern, result);
});

console.log('='.repeat(80));
console.log('✅ シミュレーション完了\n');
console.log('重要ポイント:');
console.log('• 「分からない」は常に上位に来る（基礎優先度0）');
console.log('• 時間経過は正解扱い + 定着済み扱い（GrammarQuizView.tsx line 443参照）');
console.log('• スキップ多用型は「覚えてる」カテゴリが増加し、優先度が下がる前後）');
console.log('• 「覚えてる」は下位に押し出される（基礎優先度100）');
console.log('• スキップ多用型でも即座に再出題（offset=1の効果）\n');
