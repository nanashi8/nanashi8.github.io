// ランダム解答パターンの視覚的シミュレーション

const TIME_BUCKETS = [1, 3, 5, 7, 10, 15, 30, 60, 120, 180, 240, 300, 360, 420, 480, 720, 1440];
// フェーズ1改善: 後半の伸びを抑制(95,98,100 → 90,93,95)
const BUCKET_BOOST = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 85, 88, 90, 93, 95];

// Mulberry32 PRNG(seed対応)
function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// seed取得(CLIまたは現在時刻)
function getSeed(): number {
  const argv = process.argv.slice(2);
  const idx = argv.indexOf('--seed');
  if (idx >= 0 && argv[idx + 1]) {
    const s = Number(argv[idx + 1]);
    if (!Number.isNaN(s)) return s;
  }
  return Date.now();
}

const SEED = getSeed();
const rng = mulberry32(SEED);

interface WordProgress {
  word: string;
  correctCount: number;
  incorrectCount: number;
  consecutiveCorrect: number;
  masteryLevel: 'mastered' | 'learning' | 'new';
  firstAttempted: number;
  lastStudied: number;
  category: string;
  answerHistory: string[];
  confidenceScore?: number; // フェーズ2: 信頼度スコア
}

// シナリオ取得（ENVまたはCLI）
function getScenario(): 'random' | 'heavy_miss' | 'time_boost' | 'perfect' | 'varied' | 'practical_student' {
  const argv = process.argv.slice(2)
  const idx = argv.indexOf('--scenario')
  const fromArg = idx >= 0 ? (argv[idx + 1] as any) : undefined
  const fromEnv = process.env.NODE_ENV as any
  const s = (fromArg || fromEnv || 'random') as any
  if (s === 'heavy_miss' || s === 'time_boost' || s === 'perfect' || s === 'varied' || s === 'practical_student') return s
  return 'random'
}

const SCENARIO = getScenario()

// ランダム解答パターン生成（シナリオで正答率やミスの偏りを調整）
function generateRandomAnswerPattern(totalQuestions: number = 30, answersCount: number = 25): string {
  const answers: string[] = [];
  const questionPool = Array.from({ length: totalQuestions }, (_, i) => i + 1);

  // シナリオ別パラメータ
  let correctProb = 0.7
  let missClusterSize = 0
  if (SCENARIO === 'heavy_miss') {
    correctProb = 0.45
    missClusterSize = 3
  } else if (SCENARIO === 'perfect') {
    correctProb = 0.9
  } else if (SCENARIO === 'varied') {
    correctProb = 0.65
    missClusterSize = 2
  } else if (SCENARIO === 'time_boost') {
    correctProb = 0.7
  } else if (SCENARIO === 'practical_student') {
    // 実践的: 前半は高正答→中盤で疲労によりミス増→後半やや回復
    // 実際のIDで連続ミス・連続正解を混在させる
    correctProb = 0.7
    missClusterSize = 2
  }

  let clusterCountdown = 0
  let clusterTarget: number | null = null

  for (let i = 0; i < answersCount; i++) {
    // ランダムに問題を選択（重複あり）
    let questionId = clusterTarget ?? questionPool[Math.floor(rng() * questionPool.length)];
    let localCorrectProb = correctProb

    // 実践的シナリオ: 疲労・回復フェーズの導入
    if (SCENARIO === 'practical_student') {
      const phase = i / Math.max(answersCount, 1)
      if (phase < 0.33) {
        // 序盤: 高正答・連続正解を狙う
        localCorrectProb = 0.85
        if (rng() < 0.4) {
          // 連続正解用に同一IDを維持
          clusterTarget = questionId
        }
      } else if (phase < 0.66) {
        // 中盤: 疲労で誤答増・特定IDで連続ミス
        localCorrectProb = 0.5
        if (rng() < 0.5) {
          // 苦戦IDを選びやすくする（3, 7, 12など）
          const struggling = [3, 7, 12, 19]
          questionId = struggling[Math.floor(rng() * struggling.length)]
          missClusterSize = 3
        }
      } else {
        // 終盤: 部分回復
        localCorrectProb = 0.7
        missClusterSize = 2
      }
    }

    const isCorrect = rng() < localCorrectProb;
    const sign = isCorrect ? '+' : '-';
    answers.push(`${sign}${questionId}`);

    // heavy miss / varied では同一IDの連続ミスを発生させる
    if (!isCorrect && missClusterSize > 0) {
      if (clusterCountdown === 0) {
        clusterTarget = questionId
        clusterCountdown = missClusterSize - 1
      } else {
        clusterCountdown--
        if (clusterCountdown <= 0) {
          clusterTarget = null
        }
      }
    } else {
      clusterTarget = null
      clusterCountdown = 0
    }
  }

  return answers.join(', ');
}

// 解答パターンをパース
interface AnswerEvent {
  questionId: number;
  isCorrect: boolean;
  sequenceIndex: number;
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

// フェーズ2: ストリーク減衰を計算
function calculateEffectiveStreak(progress: WordProgress): number {
  if (!progress.lastStudied) return progress.consecutiveCorrect;

  const hoursSinceStudy = (Date.now() - progress.lastStudied) / (1000 * 60 * 60);
  // 1週間(168時間)で50%まで減衰
  const decayFactor = Math.max(0.5, 1 - hoursSinceStudy / (24 * 7));
  return progress.consecutiveCorrect * decayFactor;
}

// フェーズ2: 信頼度スコアを計算
function calculateConfidenceScore(progress: WordProgress): number {
  const total = progress.correctCount + progress.incorrectCount;
  if (total === 0) return 0;

  const overallAccuracy = progress.correctCount / total;

  // 直近5回の正答率
  const recentAnswers = progress.answerHistory.slice(-5);
  const recentCorrectCount = recentAnswers.filter(a => a === '✓').length;
  const recentAccuracy = recentAnswers.length > 0 ? recentCorrectCount / recentAnswers.length : 0;

  // 全体50% + 直近50%
  return overallAccuracy * 0.5 + recentAccuracy * 0.5;
}

// カテゴリ判定（フェーズ2: 減衰ストリークと信頼度スコアを使用）
function determineCategory(progress: WordProgress): string {
  const total = progress.correctCount + progress.incorrectCount;
  if (total === 0) return '未学習';

  const accuracy = progress.correctCount / total;
  const effectiveStreak = calculateEffectiveStreak(progress);
  const confidenceScore = calculateConfidenceScore(progress);
  const { masteryLevel } = progress;

  // 信頼度スコアを使った定着判定
  if (masteryLevel === 'mastered' ||
      (total === 1 && progress.correctCount === 1) ||
      effectiveStreak >= 3 ||
      (effectiveStreak >= 2 && accuracy >= 0.8) ||
      confidenceScore >= 0.75) {
    return '覚えてる';
  }

  if (accuracy < 0.4 || effectiveStreak === 0) {
    return '分からない';
  }

  return 'まだまだ';
}

// カテゴリ別基礎優先度
function getCategoryBasePriority(category: string): number {
  if (category === '分からない') return 0;
  if (category === 'まだまだ') return 30;
  if (category === '覚えてる') return 100;
  if (category === '未学習') return 50;
  return 50;
}

// カテゴリアイコン
function getCategoryIcon(category: string): string {
  if (category === '分からない') return '🔴';
  if (category === 'まだまだ') return '🟡';
  if (category === '覚えてる') return '🟢';
  if (category === '未学習') return '⚪';
  return '⚫';
}

// フェーズ2: メタAIログ生成（判断根拠の可視化）
function generateMetaAILog(item: any): string {
  const signals: string[] = [];
  const strategies: string[] = [];

  // Signal検出
  if (item.incorrectCount >= 3) {
    signals.push('連続ミス検出');
    strategies.push('優先度UP(-5)');
  } else if (item.incorrectCount === 2) {
    signals.push('2連ミス');
    strategies.push('優先度UP(-2)');
  }

  if (item.timeBoost >= 90) {
    signals.push('長期未復習');
    strategies.push('時間ブースト大');
  } else if (item.timeBoost >= 70) {
    signals.push('中期未復習');
    strategies.push('時間ブースト中');
  }

  const effectiveStreakNum = parseFloat(item.effectiveStreak || '0');
  const rawStreak = item.consecutiveCorrect || 0;
  if (effectiveStreakNum < rawStreak * 0.8) {
    signals.push('ストリーク減衰中');
    strategies.push('復習促進');
  }

  const confidenceNum = parseFloat(item.confidenceScore || '0');
  if (confidenceNum >= 0.75) {
    signals.push('高信頼度定着');
    strategies.push('出題頻度DOWN');
  } else if (confidenceNum < 0.4 && item.correctCount > 0) {
    signals.push('定着不安定');
    strategies.push('集中復習推奨');
  }

  if (signals.length === 0 && strategies.length === 0) {
    return ''; // ログなし
  }

  const signalStr = signals.join('・');
  const strategyStr = strategies.join('・');
  return `[Signal: ${signalStr}] [Strategy: ${strategyStr}]`;
}

// 優先度バー表示
function getPriorityBar(priority: number, maxPriority: number): string {
  const normalizedPriority = Math.max(-10, Math.min(100, priority));
  const barLength = 20;
  const filledLength = Math.round((normalizedPriority + 10) / 110 * barLength);

  let bar = '';
  for (let i = 0; i < barLength; i++) {
    if (i < filledLength) {
      if (normalizedPriority < 10) bar += '█'; // 高優先度
      else if (normalizedPriority < 40) bar += '▓'; // 中優先度
      else bar += '░'; // 低優先度
    } else {
      bar += '·';
    }
  }

  return bar;
}

// フェーズ3: 疲労推定（解答履歴から認知負荷を推定）
function estimateFatigue(events: AnswerEvent[]): number {
  if (events.length < 5) return 0; // データ不足の場合は疲労なし

  // 直近10回の誤答率を計算
  const recentEvents = events.slice(-10);
  const incorrectCount = recentEvents.filter(e => !e.isCorrect).length;
  const errorRate = incorrectCount / recentEvents.length;

  // 連続誤答をカウント
  let consecutiveErrors = 0;
  for (let i = recentEvents.length - 1; i >= 0; i--) {
    if (!recentEvents[i].isCorrect) {
      consecutiveErrors++;
    } else {
      break;
    }
  }

  // 疲労スコア: 誤答率70% + 連続誤答30%
  const fatigueScore = errorRate * 0.7 + (consecutiveErrors / 5) * 0.3;

  return Math.min(1.0, fatigueScore); // 0.0 - 1.0の範囲
}

// シミュレーション実行
function runSimulation(pattern: string): Map<number, WordProgress> {
  const events = parseAnswerPattern(pattern);
  const progressMap = new Map<number, WordProgress>();
  const baseTime = Date.now() - 60 * 60 * 1000;

  events.forEach((event) => {
    const { questionId, isCorrect, sequenceIndex } = event;
    const wordKey = `word${questionId}`;

    if (!progressMap.has(questionId)) {
      progressMap.set(questionId, {
        word: wordKey,
        correctCount: 0,
        incorrectCount: 0,
        consecutiveCorrect: 0,
        masteryLevel: 'new',
        firstAttempted: baseTime + sequenceIndex * 2 * 60 * 1000,
        lastStudied: baseTime + sequenceIndex * 2 * 60 * 1000,
        category: '未学習',
        answerHistory: []
      });
    }

    const prog = progressMap.get(questionId)!;

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

    if (total === 1 && prog.correctCount === 1) {
      prog.masteryLevel = 'mastered';
    } else if (prog.consecutiveCorrect >= 3 || (total >= 3 && accuracy >= 0.9)) {
      prog.masteryLevel = 'mastered';
    } else {
      prog.masteryLevel = 'learning';
    }

    prog.category = determineCategory(prog);
    prog.lastStudied = baseTime + sequenceIndex * 2 * 60 * 1000;
  });

  return progressMap;
}

// 全問題の優先度計算
function calculateAllPriorities(progressMap: Map<number, WordProgress>, totalQuestions: number, events?: AnswerEvent[]): any[] {
  const allWords: any[] = [];

  // フェーズ3: 疲労スコアを計算
  const fatigueScore = events ? estimateFatigue(events) : 0;

  progressMap.forEach((prog, questionId) => {
    const timeBoost = calculateTimeBasedPriority(prog);
    const basePriority = getCategoryBasePriority(prog.category);

    // フェーズ1改善: 連続ミス段階加点
    const effectiveStreak = calculateEffectiveStreak(prog);
    let missBoost = 0;
    if (effectiveStreak === 0 && prog.incorrectCount >= 2) {
      missBoost = prog.incorrectCount >= 3 ? -5 : -2; // 3連ミスで大幅加点
    }

    // フェーズ2: 信頼度スコアを計算してメタデータとして保持
    const confidenceScore = calculateConfidenceScore(prog);
    prog.confidenceScore = confidenceScore;

    const finalPriority = basePriority - timeBoost * 0.05 + missBoost;

    allWords.push({
      questionId,
      word: prog.word,
      category: prog.category,
      correctCount: prog.correctCount,
      incorrectCount: prog.incorrectCount,
      consecutiveCorrect: prog.consecutiveCorrect,
      effectiveStreak: effectiveStreak.toFixed(1), // フェーズ2: 減衰適用後
      confidenceScore: confidenceScore.toFixed(2), // フェーズ2: 信頼度スコア
      answerHistory: prog.answerHistory.join(''),
      timeBoost,
      basePriority,
      finalPriority,
      isAnswered: true
    });
  });

  for (let i = 1; i <= totalQuestions; i++) {
    if (!progressMap.has(i)) {
      allWords.push({
        questionId: i,
        word: `word${i}`,
        category: '未学習',
        correctCount: 0,
        incorrectCount: 0,
        consecutiveCorrect: 0,
        effectiveStreak: '0.0', // フェーズ2
        confidenceScore: '0.00', // フェーズ2
        answerHistory: '-',
        timeBoost: 0,
        basePriority: 50,
        finalPriority: 50,
        isAnswered: false
      });
    }
  }

  allWords.sort((a, b) => a.finalPriority - b.finalPriority);

  // フェーズ3: インタリーブ（交互出題）を適用
  let result = applyInterleaving(allWords);

  // フェーズ3: 疲労連動の緩和戦略を適用
  result = applyFatigueAdjustment(result, fatigueScore);

  return result;
}

// フェーズ3: インタリーブ（交互出題）の実装
function applyInterleaving(sortedWords: any[]): any[] {
  // インタリーブを有効にするかどうかのフラグ（CLI引数で制御可能）
  const args = process.argv.slice(2);
  const interleavingEnabled = args.includes('--interleaving');

  if (!interleavingEnabled || sortedWords.length < 10) {
    // インタリーブ無効でも難易度スロットは適用可能
    return applyDifficultySlots(sortedWords);
  }

  // TOP10に混合出題を適用
  // 枠配分: 重ミス枠×4、未学習枠×3、定着間近枠×2、その他×1
  const heavyMissSlots = 4;
  const newItemSlots = 3;
  const nearMasterySlots = 2;
  const otherSlots = 1;

  // カテゴリ別にフィルタリング
  const heavyMiss = sortedWords.filter(w => w.category === '分からない');
  const struggling = sortedWords.filter(w => w.category === 'まだまだ');
  const newItems = sortedWords.filter(w => w.category === '未学習');
  const mastered = sortedWords.filter(w => w.category === '覚えてる');

  // 定着間近: まだまだカテゴリで信頼度0.5以上
  const nearMastery = struggling.filter(w => parseFloat(w.confidenceScore || '0') >= 0.5);

  const top10: any[] = [];

  // 1. 重ミス枠を埋める（最大4件）
  top10.push(...heavyMiss.slice(0, heavyMissSlots));

  // 2. 未学習枠を埋める（最大3件）
  top10.push(...newItems.slice(0, newItemSlots));

  // 3. 定着間近枠を埋める（最大2件）
  top10.push(...nearMastery.slice(0, nearMasterySlots));

  // 4. その他枠（残りの最優先項目）
  const usedIds = new Set(top10.map(w => w.questionId));
  const remaining = sortedWords.filter(w => !usedIds.has(w.questionId));
  top10.push(...remaining.slice(0, otherSlots));

  // 5. TOP10に満たない場合は残りを追加
  while (top10.length < 10 && remaining.length > 0) {
    const nextItem = remaining.find(w => !usedIds.has(w.questionId));
    if (!nextItem) break;
    top10.push(nextItem);
    usedIds.add(nextItem.questionId);
  }

  // 6. TOP10以降はそのまま維持
  const result = [...top10, ...sortedWords.filter(w => !usedIds.has(w.questionId))];

  // 7. 難易度スロットを適用
  return applyDifficultySlots(result);
}

// フェーズ3: 疲労連動の緩和戦略を適用
function applyFatigueAdjustment(sortedWords: any[], fatigueScore: number): any[] {
  const args = process.argv.slice(2);
  const fatigueEnabled = args.includes('--fatigue');

  if (!fatigueEnabled || fatigueScore < 0.5 || sortedWords.length < 10) {
    return sortedWords; // 疲労なしまたは無効の場合はそのまま
  }

  // 高疲労時（0.5以上）: TOP10に易問（覚えてる・1回正解の未学習）を2-3件挿入
  const top10 = sortedWords.slice(0, 10);
  const remaining = sortedWords.slice(10);

  // 易問候補: 覚えてるカテゴリまたは1回正解の項目
  const easyItems = remaining.filter(w =>
    w.category === '覚えてる' ||
    (w.correctCount === 1 && w.incorrectCount === 0)
  );

  if (easyItems.length === 0) {
    return sortedWords; // 易問がない場合はそのまま
  }

  // 挿入数: 疲労度に応じて2-3件
  const insertCount = fatigueScore >= 0.7 ? 3 : 2;
  const toInsert = easyItems.slice(0, insertCount);

  // TOP10の7-9位付近に易問を挿入（完全に最後にしない）
  const adjusted = [
    ...top10.slice(0, 6),
    ...toInsert,
    ...top10.slice(6)
  ].slice(0, 10); // TOP10を維持

  const usedIds = new Set(adjusted.map(w => w.questionId));
  const newRemaining = sortedWords.filter(w => !usedIds.has(w.questionId));

  return [...adjusted, ...newRemaining];
}

// フェーズ3: 難易度スロット（カテゴリ別最小枠保証）
function applyDifficultySlots(sortedWords: any[]): any[] {
  const args = process.argv.slice(2);
  const slotsEnabled = args.includes('--difficulty-slots');

  if (!slotsEnabled || sortedWords.length < 10) {
    return sortedWords;
  }

  // TOP10のカテゴリ分布を確認
  const top10 = sortedWords.slice(0, 10);
  const categoryDistribution = {
    '分からない': 0,
    'まだまだ': 0,
    '覚えてる': 0,
    '未学習': 0
  };

  top10.forEach(w => {
    if (w.category in categoryDistribution) {
      categoryDistribution[w.category as keyof typeof categoryDistribution]++;
    }
  });

  // 最小枠の定義: 各カテゴリ最低1件
  const minSlots = {
    '分からない': 1,
    'まだまだ': 1,
    '覚えてる': 0, // 覚えてるは最小枠なし（低優先度のため）
    '未学習': 2    // 新問題は2件以上確保
  };

  // 不足しているカテゴリをチェック
  const adjustedTop10 = [...top10];
  const remaining = sortedWords.slice(10);

  for (const [category, minCount] of Object.entries(minSlots)) {
    const currentCount = categoryDistribution[category as keyof typeof categoryDistribution];
    const shortage = minCount - currentCount;

    if (shortage > 0) {
      // 不足分を残りから補充
      const candidates = remaining.filter(w => w.category === category);
      const toAdd = candidates.slice(0, shortage);

      // TOP10の最下位と入れ替え
      toAdd.forEach(item => {
        const lowestPriorityIndex = adjustedTop10.length - 1;
        adjustedTop10.pop(); // 最下位を削除
        adjustedTop10.push(item); // 補充
      });
    }
  }

  // 結果を再構築
  const usedIds = new Set(adjustedTop10.map(w => w.questionId));
  const newRemaining = sortedWords.filter(w => !usedIds.has(w.questionId));

  return [...adjustedTop10, ...newRemaining];
}

// 視覚的に見やすい表示
function displayVisualResults(sortedWords: any[], pattern: string) {
  // フェーズ3: インタリーブが有効かチェック
  const args = process.argv.slice(2);
  const interleavingEnabled = args.includes('--interleaving');

  console.log('\n' + '═'.repeat(100));
  console.log('🎲 ランダム解答パターンシミュレーション');
  if (interleavingEnabled) {
    console.log('🔀 インタリーブモード有効（重ミス×4 | 未学習×3 | 定着間近×2 | その他×1）');
  }
  console.log('═'.repeat(100));

  // パターン表示（短縮版）
  const tokens = pattern.split(',').map(s => s.trim());
  console.log(`\n📝 解答パターン (${tokens.length}回の解答):`);
  console.log(pattern.substring(0, 100) + (pattern.length > 100 ? '...' : ''));

  // フェーズ3: 疲労スコアを表示（args変数を再利用）
  if (args.includes('--fatigue')) {
    const events = parseAnswerPattern(pattern);
    const fatigueScore = estimateFatigue(events);
    if (fatigueScore >= 0.5) {
      console.log(`\n😴 疲労検出: ${(fatigueScore * 100).toFixed(0)}% - 易問を挿入して認知負荷を緩和`);
    }
  }

  // カテゴリ別集計
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

  console.log('\n' + '─'.repeat(100));
  console.log('📊 カテゴリ別分布:');
  console.log('─'.repeat(100));

  const total = sortedWords.length;

  Object.entries(categoryCount).forEach(([category, count]) => {
    const icon = getCategoryIcon(category);
    const percentage = (count / total * 100).toFixed(1);
    const barLength = Math.round(count / total * 40);
    const bar = '█'.repeat(barLength) + '░'.repeat(40 - barLength);
    console.log(`${icon} ${category.padEnd(12)} ${bar} ${String(count).padStart(2)}問 (${percentage.padStart(5)}%)`);
  });

  // 上位10問を視覚的に表示
  console.log('\n' + '═'.repeat(100));
  console.log('🎯 次に出題される問題（優先度順TOP10）');
  console.log('═'.repeat(100));

  sortedWords.slice(0, 10).forEach((item, index) => {
    const icon = getCategoryIcon(item.category);
    const rank = String(index + 1).padStart(2);
    const id = String(item.questionId).padStart(2);
    const history = item.answerHistory.padEnd(8);
    const priorityBar = getPriorityBar(item.finalPriority, 100);
    const priority = item.finalPriority.toFixed(1).padStart(6);

    console.log(`\n${rank}位 │ ${icon} 問題${id} │ ${history} │ ${priorityBar} │ ${priority}`);

    if (item.isAnswered) {
      const accuracy = item.correctCount + item.incorrectCount > 0
        ? Math.round(item.correctCount / (item.correctCount + item.incorrectCount) * 100)
        : 0;
      // フェーズ2: 減衰ストリークと信頼度スコアを表示
      const streakInfo = item.effectiveStreak !== undefined
        ? `減衰${item.effectiveStreak}`
        : `連続${item.consecutiveCorrect}`;
      const confidenceInfo = item.confidenceScore !== undefined
        ? `信頼度${item.confidenceScore}`
        : '';
      console.log(`     │          │ 正解${item.correctCount}回 不正解${item.incorrectCount}回 正答率${accuracy}% ${streakInfo}回 ${confidenceInfo}`);

      // フェーズ2: メタAIログ（判断根拠の可視化）
      const metaLog = generateMetaAILog(item);
      if (metaLog) {
        console.log(`     │          │ 🤖 ${metaLog}`);
      }
    } else {
      console.log(`     │          │ 未出題の新問題`);
    }
  });

  // 下位5問（低優先度）を表示
  console.log('\n' + '═'.repeat(100));
  console.log('⏸️  後回しにされる問題（低優先度BOTTOM5）');
  console.log('═'.repeat(100));

  sortedWords.slice(-5).reverse().forEach((item, index) => {
    const icon = getCategoryIcon(item.category);
    const rank = String(sortedWords.length - index).padStart(2);
    const id = String(item.questionId).padStart(2);
    const history = item.answerHistory.padEnd(8);
    const priorityBar = getPriorityBar(item.finalPriority, 100);
    const priority = item.finalPriority.toFixed(1).padStart(6);

    console.log(`\n${rank}位 │ ${icon} 問題${id} │ ${history} │ ${priorityBar} │ ${priority}`);
    console.log(`     │          │ 定着済み・時間経過待ち`);
  });

  // サマリー
  console.log('\n' + '═'.repeat(100));
  console.log('📈 学習AIの判断サマリー');
  console.log('═'.repeat(100));
  console.log(`\n🔴 最優先（分からない）: ${categoryCount['分からない']}問 → 即座に再出題`);
  console.log(`🟡 中優先（まだまだ）  : ${categoryCount['まだまだ']}問 → 定着まであと少し`);
  console.log(`⚪ 中優先（未学習）    : ${categoryCount['未学習']}問 → 新問題として出題`);
  console.log(`🟢 低優先（覚えてる）  : ${categoryCount['覚えてる']}問 → 時間経過後に復習`);

  // 学習効率分析
  const answeredCount = sortedWords.filter(w => w.isAnswered).length;
  const masteredCount = categoryCount['覚えてる'];
  const strugglingCount = categoryCount['分からない'];
  const efficiency = answeredCount > 0 ? Math.round(masteredCount / answeredCount * 100) : 0;

  console.log(`\n💡 学習効率: ${efficiency}% (出題${answeredCount}問中${masteredCount}問が定着)`);
  console.log(`⚠️  要注意: ${strugglingCount}問が「分からない」状態で最優先再出題`);
  console.log('\n' + '═'.repeat(100));
}

// メイン実行
console.log('\n🎯 学習AIネットワーク - ランダムパターン視覚化シミュレーション');
console.log('━'.repeat(100));

// 実行回数（--runsで指定可能、既定3）
function getRuns(): number {
  const argv = process.argv.slice(2)
  const idx = argv.indexOf('--runs')
  const val = idx >= 0 ? Number(argv[idx + 1]) : NaN
  if (!Number.isNaN(val) && val > 0 && val <= 20) return val
  return 3
}
const runs = getRuns()

// ランダムパターンを生成
const patterns: string[] = []
for (let i = 0; i < runs; i++) {
  const len = i === 0 ? 25 : i === 1 ? 20 : 30
  patterns.push(generateRandomAnswerPattern(30, len))
}

patterns.forEach((pattern, index) => {
  console.log(`\n${'█'.repeat(100)}`);
  console.log(`シミュレーション ${index + 1}/${runs} (scenario: ${SCENARIO})`);
  console.log(`${'█'.repeat(100)}`);

  const progressMap = runSimulation(pattern);
  const events = parseAnswerPattern(pattern); // フェーズ3: イベント情報を取得
  const sortedWords = calculateAllPriorities(progressMap, 30, events);
  displayVisualResults(sortedWords, pattern);

  if (index < patterns.length - 1) {
    console.log('\n\n' + '⏬'.repeat(50));
    console.log('\n');
  }
});

console.log('\n' + '✅'.repeat(50));
console.log('すべてのシミュレーション完了！');
console.log('✅'.repeat(50) + '\n');

console.log('凡例:');
console.log('🔴 分からない = 不正解多数・連続正解0回 → 最優先再出題');
console.log('🟡 まだまだ   = 学習中・もう少しで定着 → 中優先出題');
console.log('⚪ 未学習     = 未出題の新問題 → 中優先出題');
console.log('🟢 覚えてる   = 定着済み → 時間経過後に復習');
console.log('\n優先度バー:');
console.log('█ = 高優先度（-10～10）  ▓ = 中優先度（10～40）  ░ = 低優先度（40～100）\n');
