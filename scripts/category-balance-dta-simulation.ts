/**
 * カテゴリバランスシミュレーション（DTA = Time-Dependent Adjustment版）
 * 覚えている・まだまだ・分からないが各300問ある状態での動作を視覚化
 * 時間経過による忘却リスクを正しく反映
 */

interface WordProgress {
  word: string;
  correctCount: number;
  incorrectCount: number;
  memorizationStreak: number;
  memorizationCorrect: number;
  memorizationStillLearning: number;
  memorizationAttempts: number;
  lastStudied: number;
  category: 'mastered' | 'still_learning' | 'incorrect' | 'new';
}

// カテゴリ判定ロジック（MemorizationView.tsxと同じ）
function determineCategory(progress: WordProgress): string {
  const streak = progress.memorizationStreak || 0;
  const correct = progress.memorizationCorrect || 0;
  const stillLearning = progress.memorizationStillLearning || 0;
  const attempts = progress.memorizationAttempts || 0;

  if (attempts === 0) return '⚪ 未学習';

  const accuracy = attempts > 0 ? (correct / attempts) * 100 : 0;

  // 覚えてる判定
  if (streak >= 3 || (streak >= 2 && accuracy >= 80)) {
    return '🟢 覚えてる';
  }

  // まだまだ判定
  if (accuracy >= 50 || stillLearning > 0) {
    return '🟡 まだまだ';
  }

  // 分からない
  return '🔴 分からない';
}

// 忘却リスク計算（questionPrioritySorter.tsと同じ）
function calculateForgettingRisk(
  lastStudied: number,
  reviewInterval: number,
  accuracy: number
): number {
  if (lastStudied === 0) return 0;

  const daysSinceLastStudy = (Date.now() - lastStudied) / (1000 * 60 * 60 * 24);
  const intervalRatio = reviewInterval > 0 ? daysSinceLastStudy / reviewInterval : 0;

  let risk = intervalRatio * 100;
  if (accuracy < 50) risk *= 1.5;
  else if (accuracy >= 80) risk *= 0.7;

  return Math.round(Math.min(risk, 200));
}

// 最適な復習間隔を計算
function calculateOptimalInterval(streak: number, easinessFactor: number = 2.5): number {
  if (streak === 0) return 0;
  if (streak === 1) return 1;
  if (streak === 2) return 3;
  if (streak === 3) return 7;

  const baseInterval = 7;
  return Math.round(baseInterval * Math.pow(easinessFactor, streak - 3));
}

// 優先度計算（questionPrioritySorter.tsと同じロジック + DTA）
function calculatePriority(progress: WordProgress): number {
  const streak = progress.memorizationStreak || 0;
  const correct = progress.memorizationCorrect || 0;
  const attempts = progress.memorizationAttempts || 0;
  const category = progress.category;
  const lastStudied = progress.lastStudied || 0;

  if (attempts === 0) return 3.5; // 新規

  const accuracy = attempts > 0 ? (correct / attempts) * 100 : 0;
  const reviewInterval = calculateOptimalInterval(streak);
  const forgettingRisk = calculateForgettingRisk(lastStudied, reviewInterval, accuracy);

  // 分からない: 最優先
  if (category === 'incorrect') {
    const consecutiveWrong = attempts - correct;
    if (consecutiveWrong >= 3) return -10; // 3連ミス以上
    if (consecutiveWrong >= 2) return -5;  // 2連ミス
    return 0.3;
  }

  // まだまだ: 中優先
  if (category === 'still_learning') {
    return 0.8;
  }

  // 覚えてる: 時間依存の優先度（DTA: Time-Dependent Adjustment）
  if (category === 'mastered') {
    if (forgettingRisk >= 50) return 2.0; // 忘却リスク高 → 優先度上げる
    return 4.5; // 最近正解 → 後回し
  }

  return 3.5;
}

// プログレスバー生成
function generateProgressBar(value: number, max: number, width: number = 50): string {
  const filled = Math.round((value / max) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

// テストデータ生成（時間経過のバリエーション付き）
function generateTestData(): WordProgress[] {
  const data: WordProgress[] = [];
  let wordId = 1;

  // 分からない 300問
  for (let i = 0; i < 300; i++) {
    const consecutiveWrong = i < 100 ? 5 : i < 200 ? 3 : 1;
    data.push({
      word: `word${wordId++}`,
      correctCount: 0,
      incorrectCount: consecutiveWrong,
      memorizationStreak: 0,
      memorizationCorrect: 0,
      memorizationStillLearning: 0,
      memorizationAttempts: consecutiveWrong,
      lastStudied: Date.now() - Math.random() * 86400000,
      category: 'incorrect',
    });
  }

  // まだまだ 300問
  for (let i = 0; i < 300; i++) {
    data.push({
      word: `word${wordId++}`,
      correctCount: 2,
      incorrectCount: 2,
      memorizationStreak: 1,
      memorizationCorrect: 2,
      memorizationStillLearning: 1,
      memorizationAttempts: 4,
      lastStudied: Date.now() - Math.random() * 86400000,
      category: 'still_learning',
    });
  }

  // 覚えてる 300問（時間経過のバリエーション）
  for (let i = 0; i < 300; i++) {
    let lastStudied: number;
    if (i < 100) {
      // 最近正解（1時間以内） → 忘却リスク低
      lastStudied = Date.now() - Math.random() * 3600000; // 0-1時間前
    } else if (i < 200) {
      // 中期（1-7日前） → 忘却リスク中
      lastStudied = Date.now() - (Math.random() * 6 + 1) * 86400000; // 1-7日前
    } else {
      // 長期（8-30日前） → 忘却リスク高
      lastStudied = Date.now() - (Math.random() * 22 + 8) * 86400000; // 8-30日前
    }

    data.push({
      word: `word${wordId++}`,
      correctCount: 5,
      incorrectCount: 0,
      memorizationStreak: 5,
      memorizationCorrect: 5,
      memorizationStillLearning: 0,
      memorizationAttempts: 5,
      lastStudied,
      category: 'mastered',
    });
  }

  return data;
}

// カテゴリ別の優先度分布を表示
function displayPriorityDistribution(data: WordProgress[]) {
  const incorrect = data.filter((d) => d.category === 'incorrect');
  const stillLearning = data.filter((d) => d.category === 'still_learning');
  const mastered = data.filter((d) => d.category === 'mastered');

  console.log('\n📊 カテゴリ別データ分布:');
  console.log('═'.repeat(100));
  console.log(`🔴 分からない  : ${incorrect.length}問`);
  console.log(`🟡 まだまだ    : ${stillLearning.length}問`);
  console.log(`🟢 覚えてる    : ${mastered.length}問`);
  console.log(`合計          : ${data.length}問\n`);

  // 復習比率の計算
  const totalStudied = data.length;
  const needsReview = incorrect.length + stillLearning.length;
  const reviewRatio = needsReview / totalStudied;

  console.log('📈 学習状況分析:');
  console.log('═'.repeat(100));
  console.log(`復習が必要な問題: ${needsReview}問 / ${totalStudied}問 (${(reviewRatio * 100).toFixed(1)}%)`);
  console.log(`復習比率閾値: 20%`);
  console.log(`新規問題抑制: ${reviewRatio >= 0.2 ? '🔒 有効' : '✅ 無効'}\n`);

  // 優先度の計算と表示
  const withPriority = data.map((d) => ({
    ...d,
    priority: calculatePriority(d),
    displayCategory: determineCategory(d),
  }));

  // 優先度でソート
  withPriority.sort((a, b) => a.priority - b.priority);

  console.log('🎯 出題優先順位（上位30問）:');
  console.log('═'.repeat(120));
  console.log('順位 │ カテゴリ     │ 連続ミス │ 正答率 │ 優先度  │ 視覚表現             │ 経過  │ 忘却度');
  console.log('─'.repeat(120));

  for (let i = 0; i < Math.min(30, withPriority.length); i++) {
    const item = withPriority[i];
    const consecutiveWrong = item.incorrectCount;
    const accuracy =
      item.memorizationAttempts > 0
        ? ((item.memorizationCorrect / item.memorizationAttempts) * 100).toFixed(0)
        : '0';

    const daysSinceStudy = item.lastStudied
      ? ((Date.now() - item.lastStudied) / (1000 * 60 * 60 * 24)).toFixed(1)
      : '0.0';

    const reviewInterval = calculateOptimalInterval(item.memorizationStreak);
    const forgettingRisk = calculateForgettingRisk(item.lastStudied, reviewInterval, parseFloat(accuracy));

    const normalizedPriority = Math.max(-10, Math.min(100, item.priority));
    const barValue = ((normalizedPriority + 10) / 110) * 20;
    const bar = '█'.repeat(Math.floor(barValue)) + '░'.repeat(20 - Math.floor(barValue));

    console.log(
      `${String(i + 1).padStart(4)} │ ${item.displayCategory.padEnd(12)} │ ${String(consecutiveWrong).padStart(8)} │ ${String(accuracy).padStart(5)}% │ ${item.priority.toFixed(1).padStart(7)} │ ${bar} │ ${daysSinceStudy.padStart(5)}日 │ リスク${String(forgettingRisk).padStart(3)}`
    );
  }

  console.log('\n🔻 低優先度（下位10問）:');
  console.log('═'.repeat(120));
  console.log('順位 │ カテゴリ     │ 連続ミス │ 正答率 │ 優先度  │ 視覚表現             │ 経過  │ 忘却度');
  console.log('─'.repeat(120));

  const bottomStart = Math.max(0, withPriority.length - 10);
  for (let i = bottomStart; i < withPriority.length; i++) {
    const item = withPriority[i];
    const consecutiveWrong = item.incorrectCount;
    const accuracy =
      item.memorizationAttempts > 0
        ? ((item.memorizationCorrect / item.memorizationAttempts) * 100).toFixed(0)
        : '0';

    const daysSinceStudy = item.lastStudied
      ? ((Date.now() - item.lastStudied) / (1000 * 60 * 60 * 24)).toFixed(1)
      : '0.0';

    const reviewInterval = calculateOptimalInterval(item.memorizationStreak);
    const forgettingRisk = calculateForgettingRisk(item.lastStudied, reviewInterval, parseFloat(accuracy));

    const normalizedPriority = Math.max(-10, Math.min(100, item.priority));
    const barValue = ((normalizedPriority + 10) / 110) * 20;
    const bar = '█'.repeat(Math.floor(barValue)) + '░'.repeat(20 - Math.floor(barValue));

    console.log(
      `${String(i + 1).padStart(4)} │ ${item.displayCategory.padEnd(12)} │ ${String(consecutiveWrong).padStart(8)} │ ${String(accuracy).padStart(5)}% │ ${item.priority.toFixed(1).padStart(7)} │ ${bar} │ ${daysSinceStudy.padStart(5)}日 │ リスク${String(forgettingRisk).padStart(3)}`
    );
  }

  // カテゴリ別の出題される割合を計算
  console.log('\n📊 出題される問題の構成（上位100問での分析）:');
  console.log('═'.repeat(100));

  const top100 = withPriority.slice(0, 100);
  const top100Incorrect = top100.filter((d) => d.category === 'incorrect').length;
  const top100StillLearning = top100.filter((d) => d.category === 'still_learning').length;
  const top100Mastered = top100.filter((d) => d.category === 'mastered').length;
  const top100New = top100.filter((d) => d.category === 'new').length;

  console.log(`🔴 分からない  : ${top100Incorrect}問 ${generateProgressBar(top100Incorrect, 100, 40)} ${((top100Incorrect / 100) * 100).toFixed(1)}%`);
  console.log(`🟡 まだまだ    : ${top100StillLearning}問 ${generateProgressBar(top100StillLearning, 100, 40)} ${((top100StillLearning / 100) * 100).toFixed(1)}%`);
  console.log(`🟢 覚えてる    : ${top100Mastered}問 ${generateProgressBar(top100Mastered, 100, 40)} ${((top100Mastered / 100) * 100).toFixed(1)}%`);
  console.log(`⚪ 未学習      : ${top100New}問 ${generateProgressBar(top100New, 100, 40)} ${((top100New / 100) * 100).toFixed(1)}%`);

  // 覚えてる問題の詳細分析
  const masteredInTop100 = top100.filter((d) => d.category === 'mastered');
  if (masteredInTop100.length > 0) {
    console.log('\n⭐ 上位100問に含まれる「覚えてる」問題の分析:');
    console.log('═'.repeat(100));
    masteredInTop100.forEach((item, idx) => {
      const daysSinceStudy = item.lastStudied
        ? ((Date.now() - item.lastStudied) / (1000 * 60 * 60 * 24)).toFixed(1)
        : '0.0';
      const reviewInterval = calculateOptimalInterval(item.memorizationStreak);
      const forgettingRisk = calculateForgettingRisk(item.lastStudied, reviewInterval, 100);
      console.log(`  ${idx + 1}. ${item.word}: ${daysSinceStudy}日前に正解 → 忘却リスク${forgettingRisk} → 優先度${item.priority.toFixed(1)}`);
    });
  }

  console.log('\n💡 DTA（Time-Dependent Adjustment）の効果:');
  console.log('═'.repeat(100));
  const recentMastered = mastered.filter((m) => {
    const reviewInterval = calculateOptimalInterval(m.memorizationStreak);
    const risk = calculateForgettingRisk(m.lastStudied, reviewInterval, 100);
    return risk < 50;
  });
  const forgottenMastered = mastered.filter((m) => {
    const reviewInterval = calculateOptimalInterval(m.memorizationStreak);
    const risk = calculateForgettingRisk(m.lastStudied, reviewInterval, 100);
    return risk >= 50;
  });

  console.log(`✅ 最近正解した「覚えてる」: ${recentMastered.length}問 → 優先度4.5で後回し`);
  console.log(`⚠️  忘却リスク高い「覚えてる」: ${forgottenMastered.length}問 → 優先度2.0に上昇`);
  console.log(`✅ 復習比率が ${(reviewRatio * 100).toFixed(1)}% のため、新規問題は${reviewRatio >= 0.2 ? '大幅に抑制' : '通常通り出題'}されます`);
  console.log(`✅ 「分からない」が${incorrect.length}問あり、これらが最優先で出題されます`);

  // 自動復習モードのチェック
  const learningLimit = 50;
  const reviewLimit = 30;
  const autoReviewMode =
    stillLearning.length >= learningLimit * 0.8 || incorrect.length >= reviewLimit * 0.8;

  if (autoReviewMode) {
    console.log(`\n⚠️  自動復習モード発動！`);
    console.log(`   「まだまだ」が${stillLearning.length}問（上限${learningLimit}の80%=${learningLimit * 0.8}以上）`);
    console.log(`   または「分からない」が${incorrect.length}問（上限${reviewLimit}の80%=${reviewLimit * 0.8}以上）`);
    console.log(`   → 新規問題と「低リスクの覚えてる」問題は優先度999で事実上出題されません`);
  }

  console.log('\n🎯 集中モード閾値:');
  console.log('═'.repeat(100));
  console.log(`分からない問題が10問以上: ${incorrect.length >= 10 ? '✅ 有効（新規問題を事実上ブロック）' : '❌ 無効'}`);
  console.log(`分からない問題が5問以下: ${incorrect.length <= 5 ? '✅ 新規問題を再開' : '❌ まだ集中モード継続'}`);
}

// メイン実行
console.log('\n🎯 カテゴリバランスシミュレーション（DTA版）');
console.log('═'.repeat(100));
console.log('シナリオ: 覚えている300問 + まだまだ300問 + 分からない300問');
console.log('DTA = Time-Dependent Adjustment（時間依存調整）');
console.log('═'.repeat(100));

const testData = generateTestData();
displayPriorityDistribution(testData);

console.log('\n✅ シミュレーション完了');
console.log('═'.repeat(100));
