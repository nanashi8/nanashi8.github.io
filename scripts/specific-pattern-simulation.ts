// 特定解答パターンのシミュレーション
// +1, +2, +3, +4, -5, +6, +7, -5, +8, +9, +10, +5, +11, +12, -13, -14, +15, -13

// 時間ベースバケット設定（実装と同じ）
const TIME_BUCKETS = [1, 3, 5, 7, 10, 15, 30, 60, 120, 180, 240, 300, 360, 420, 480, 720, 1440];
const BUCKET_BOOST = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 85, 90, 95, 98, 100];

interface WordProgress {
  word: string;
  correctCount: number;
  incorrectCount: number;
  consecutiveCorrect: number;
  masteryLevel: 'mastered' | 'learning' | 'new';
  firstAttempted: number;
  lastStudied: number;
  category: string;
  answerHistory: string[]; // 解答履歴を記録
}

// 解答パターン文字列をパース
// "+1, +2, +3, +4, -5, +6, +7, -5, +8, +9, +10, +5, +11, +12, -13, -14, +15, -13"
const ANSWER_PATTERN = "+1, +2, +3, +4, -5, +6, +7, -5, +8, +9, +10, +5, +11, +12, -13, -14, +15, -13";

interface AnswerEvent {
  questionId: number;
  isCorrect: boolean;
  sequenceIndex: number; // 何番目の解答か
}

function parseAnswerPattern(pattern: string): AnswerEvent[] {
  const tokens = pattern.split(',').map(s => s.trim());
  const events: AnswerEvent[] = [];

  tokens.forEach((token, index) => {
    const isCorrect = token.startsWith('+');
    const questionId = parseInt(token.substring(1), 10);

    events.push({
      questionId,
      isCorrect,
      sequenceIndex: index
    });
  });

  return events;
}

// 時間ベース優先度計算
function calculateTimeBasedPriority(progress: WordProgress): number {
  if (!progress.firstAttempted) return 0;

  const elapsedMinutes = (Date.now() - progress.firstAttempted) / (1000 * 60);

  let boost = 0;
  for (let i = 0; i < TIME_BUCKETS.length; i++) {
    if (elapsedMinutes >= TIME_BUCKETS[i]) {
      boost = BUCKET_BOOST[i];
    } else {
      break;
    }
  }

  return boost;
}

// カテゴリ判定
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
  if (category === '未学習') return 50; // 新問題は中間
  return 50;
}

// シミュレーション実行
function runSimulation(): Map<number, WordProgress> {
  const events = parseAnswerPattern(ANSWER_PATTERN);
  const progressMap = new Map<number, WordProgress>();
  const baseTime = Date.now() - 60 * 60 * 1000; // 1時間前から開始

  console.log('\n📝 解答履歴の処理:');
  console.log('順序 | 問題 | 結果   | 経過時間 | 備考');
  console.log('─'.repeat(70));

  events.forEach((event) => {
    const { questionId, isCorrect, sequenceIndex } = event;
    const wordKey = `word${questionId}`;

    // 初回出題時に初期化
    if (!progressMap.has(questionId)) {
      progressMap.set(questionId, {
        word: wordKey,
        correctCount: 0,
        incorrectCount: 0,
        consecutiveCorrect: 0,
        masteryLevel: 'new',
        firstAttempted: baseTime + sequenceIndex * 2 * 60 * 1000, // 2分間隔
        lastStudied: baseTime + sequenceIndex * 2 * 60 * 1000,
        category: '未学習',
        answerHistory: []
      });
    }

    const prog = progressMap.get(questionId)!;

    // 解答を記録
    if (isCorrect) {
      prog.correctCount++;
      prog.consecutiveCorrect++;
      prog.answerHistory.push('✓');
    } else {
      prog.incorrectCount++;
      prog.consecutiveCorrect = 0;
      prog.answerHistory.push('✗');
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
    prog.lastStudied = baseTime + sequenceIndex * 2 * 60 * 1000;

    // ログ出力
    const elapsedMin = sequenceIndex * 2;
    const result = isCorrect ? '正解 ✓' : '不正解✗';
    const note = prog.answerHistory.length === 1 ? '初出題' :
                 prog.consecutiveCorrect >= 2 ? '連続正解中' :
                 prog.incorrectCount > 0 && !isCorrect ? '再度不正解' : '';

    console.log(`${String(sequenceIndex + 1).padStart(4)} | ${String(questionId).padStart(4)} | ${result} | ${String(elapsedMin).padStart(6)}分 | ${note}`);
  });

  return progressMap;
}

// 30問全体の優先度を計算
function calculateAllPriorities(progressMap: Map<number, WordProgress>): any[] {
  const allWords: any[] = [];

  // 出題済み問題
  progressMap.forEach((prog, questionId) => {
    const timeBoost = calculateTimeBasedPriority(prog);
    const basePriority = getCategoryBasePriority(prog.category);
    const finalPriority = basePriority - timeBoost * 0.05;

    allWords.push({
      questionId,
      word: prog.word,
      category: prog.category,
      correctCount: prog.correctCount,
      incorrectCount: prog.incorrectCount,
      consecutiveCorrect: prog.consecutiveCorrect,
      answerHistory: prog.answerHistory.join(''),
      timeBoost,
      basePriority,
      finalPriority,
      isAnswered: true
    });
  });

  // 未出題問題（16-30）
  for (let i = 16; i <= 30; i++) {
    if (!progressMap.has(i)) {
      allWords.push({
        questionId: i,
        word: `word${i}`,
        category: '未学習',
        correctCount: 0,
        incorrectCount: 0,
        consecutiveCorrect: 0,
        answerHistory: '-',
        timeBoost: 0,
        basePriority: 50,
        finalPriority: 50,
        isAnswered: false
      });
    }
  }

  // 優先度順にソート
  allWords.sort((a, b) => a.finalPriority - b.finalPriority);

  return allWords;
}

// 結果表示
function displayResults(sortedWords: any[]) {
  console.log('\n' + '='.repeat(100));
  console.log('🔄 学習AIによる30問の再出題順（全問表示）');
  console.log('='.repeat(100));
  console.log('\n順位 | 問題ID | カテゴリ   | 正解 | 不正解 | 連続 | 履歴     | 時間ブースト | 基礎優先度 | 最終優先度');
  console.log('─'.repeat(110));

  sortedWords.forEach((item, index) => {
    const rank = String(index + 1).padStart(4);
    const id = String(item.questionId).padStart(6);
    const category = item.category.padEnd(10);
    const correct = String(item.correctCount).padStart(4);
    const incorrect = String(item.incorrectCount).padStart(6);
    const streak = String(item.consecutiveCorrect).padStart(4);
    const history = item.answerHistory.padEnd(8);
    const boost = String(item.timeBoost).padStart(12);
    const base = String(item.basePriority).padStart(10);
    const final = item.finalPriority.toFixed(2).padStart(10);

    console.log(`${rank} | ${id} | ${category} | ${correct} | ${incorrect} | ${streak} | ${history} | ${boost} | ${base} | ${final}`);
  });

  // カテゴリ別集計
  console.log('\n' + '='.repeat(100));
  console.log('📊 カテゴリ別集計:');
  console.log('='.repeat(100));

  const categoryCount = {
    '分からない': 0,
    'まだまだ': 0,
    '覚えてる': 0,
    '未学習': 0
  };

  sortedWords.forEach(item => {
    if (item.category in categoryCount) {
      categoryCount[item.category as keyof typeof categoryCount]++;
    }
  });

  console.log(`\n分からない（最優先）: ${categoryCount['分からない']}問`);
  console.log(`まだまだ（中優先）  : ${categoryCount['まだまだ']}問`);
  console.log(`覚えてる（低優先）  : ${categoryCount['覚えてる']}問`);
  console.log(`未学習（新問題）    : ${categoryCount['未学習']}問`);

  // 上位10問の分析
  console.log('\n' + '='.repeat(100));
  console.log('🎯 次に出題される上位10問の分析:');
  console.log('='.repeat(100));

  sortedWords.slice(0, 10).forEach((item, index) => {
    const reason = item.category === '分からない' ?
      `不正解が多い（正解${item.correctCount}回 vs 不正解${item.incorrectCount}回）` :
      item.category === '未学習' ?
      '未出題の新問題' :
      item.category === 'まだまだ' ?
      '学習中（もう少しで定着）' :
      '定着済みだが時間経過で復習';

    console.log(`\n${index + 1}位: 問題${item.questionId} (${item.category})`);
    console.log(`   理由: ${reason}`);
    console.log(`   履歴: ${item.answerHistory === '-' ? '未出題' : item.answerHistory}`);
    console.log(`   優先度: ${item.finalPriority.toFixed(2)} (基礎${item.basePriority} - 時間${item.timeBoost}×0.05)`);
  });
}

// メイン実行
console.log('学習AIネットワーク - 特定解答パターンシミュレーション');
console.log('━'.repeat(100));
console.log(`解答パターン: ${ANSWER_PATTERN}`);
console.log('\n凡例:');
console.log('  +数字 = 正解  -数字 = 不正解');
console.log('  例: -5が2回 → 問題5を2回不正解');
console.log('      +5    → 問題5を3回目で正解\n');

const progressMap = runSimulation();
const sortedWords = calculateAllPriorities(progressMap);
displayResults(sortedWords);

console.log('\n' + '='.repeat(100));
console.log('✅ シミュレーション完了');
console.log('='.repeat(100));
console.log('\n重要ポイント:');
console.log('• 問題5: 2回不正解→1回正解（連続正解1回） → 「まだまだ」カテゴリ');
console.log('• 問題13: 2回不正解（連続正解0回） → 「分からない」カテゴリで最優先');
console.log('• 問題14: 1回不正解（連続正解0回） → 「分からない」カテゴリで最優先');
console.log('• 問題1-4,6-12,15: 1回正解（1発正解） → 「覚えてる」カテゴリで低優先度');
console.log('• 問題16-30: 未出題 → 「未学習」カテゴリで中優先度（新問題として出題）\n');
