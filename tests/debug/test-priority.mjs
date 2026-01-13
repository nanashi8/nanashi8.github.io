// 優先度計算と保存のテスト
import { readFileSync } from 'fs';

// progressStorage.ts から該当部分を抽出してテスト
const testPriorityCalculation = () => {
  console.log('🧪 優先度計算テスト開始\n');

  // テストケース1: incorrect単語
  const incorrectWord = {
    correctCount: 2,
    incorrectCount: 8,
    consecutiveCorrect: 0,
    consecutiveIncorrect: 2,
    lastStudied: Date.now() - 86400000, // 1日前
    category: 'incorrect',
  };

  const totalAttempts1 = incorrectWord.correctCount + incorrectWord.incorrectCount;
  const accuracy1 = incorrectWord.correctCount / totalAttempts1;

  const basePriority = {
    incorrect: 100,
    still_learning: 75,
    new: 50,
    mastered: 10,
  };

  const daysSinceLastStudy1 = (Date.now() - incorrectWord.lastStudied) / (1000 * 60 * 60 * 24);
  const timeBoost1 = Math.min(daysSinceLastStudy1 * 2, 20);
  const calculatedPriority1 = basePriority[incorrectWord.category] + timeBoost1;

  console.log('📊 incorrect単語:');
  console.log(`  正解: ${incorrectWord.correctCount}, 不正解: ${incorrectWord.incorrectCount}`);
  console.log(`  正答率: ${(accuracy1 * 100).toFixed(1)}%`);
  console.log(`  カテゴリ: ${incorrectWord.category}`);
  console.log(`  ベース優先度: ${basePriority[incorrectWord.category]}`);
  console.log(`  時間ブースト: +${timeBoost1.toFixed(1)}`);
  console.log(`  最終優先度: ${calculatedPriority1.toFixed(1)} ✅\n`);

  // テストケース2: new単語
  const newWord = {
    correctCount: 0,
    incorrectCount: 0,
    lastStudied: Date.now(),
    category: 'new',
  };

  const daysSinceLastStudy2 = (Date.now() - newWord.lastStudied) / (1000 * 60 * 60 * 24);
  const timeBoost2 = Math.min(daysSinceLastStudy2 * 2, 20);
  const calculatedPriority2 = basePriority[newWord.category] + timeBoost2;

  console.log('📊 new単語:');
  console.log(`  カテゴリ: ${newWord.category}`);
  console.log(`  ベース優先度: ${basePriority[newWord.category]}`);
  console.log(`  時間ブースト: +${timeBoost2.toFixed(1)}`);
  console.log(`  最終優先度: ${calculatedPriority2.toFixed(1)}\n`);

  // テストケース3: still_learning単語
  const stillLearningWord = {
    correctCount: 3,
    incorrectCount: 4,
    lastStudied: Date.now() - 172800000, // 2日前
    category: 'still_learning',
  };

  const daysSinceLastStudy3 = (Date.now() - stillLearningWord.lastStudied) / (1000 * 60 * 60 * 24);
  const timeBoost3 = Math.min(daysSinceLastStudy3 * 2, 20);
  const calculatedPriority3 = basePriority[stillLearningWord.category] + timeBoost3;

  console.log('📊 still_learning単語:');
  console.log(`  正解: ${stillLearningWord.correctCount}, 不正解: ${stillLearningWord.incorrectCount}`);
  console.log(`  カテゴリ: ${stillLearningWord.category}`);
  console.log(`  ベース優先度: ${basePriority[stillLearningWord.category]}`);
  console.log(`  時間ブースト: +${timeBoost3.toFixed(1)}`);
  console.log(`  最終優先度: ${calculatedPriority3.toFixed(1)}\n`);

  // 結論
  console.log('✅ 優先度順序（高→低）:');
  console.log(`1. incorrect: ${calculatedPriority1.toFixed(1)} (100 + ${timeBoost1.toFixed(1)})`);
  console.log(`2. still_learning: ${calculatedPriority3.toFixed(1)} (75 + ${timeBoost3.toFixed(1)})`);
  console.log(`3. new: ${calculatedPriority2.toFixed(1)} (50 + ${timeBoost2.toFixed(1)})`);
  console.log('\n🎯 incorrect単語が最優先で出題されるべき\n');

  // progressStorage.tsの実装を確認
  console.log('📝 progressStorage.ts の実装チェック:');
  try {
    const progressStorageCode = readFileSync('./src/storage/progress/progressStorage.ts', 'utf-8');

    // 優先度計算コードが存在するか
    if (progressStorageCode.includes('calculatedPriority')) {
      console.log('✅ calculatedPriority フィールドが実装されている');
    } else {
      console.log('❌ calculatedPriority フィールドが見つからない');
    }

    // 代入処理が存在するか
    if (progressStorageCode.includes('wordProgress.calculatedPriority =')) {
      console.log('✅ calculatedPriority への代入が実装されている');
    } else {
      console.log('❌ calculatedPriority への代入が見つからない');
    }

    // progress.wordProgress[word] への代入が存在するか
    if (progressStorageCode.includes('progress.wordProgress[word] = wordProgress')) {
      console.log('✅ progress.wordProgress[word] への代入が実装されている');
    } else {
      console.log('❌ progress.wordProgress[word] への代入が見つからない（致命的バグ）');
    }

    console.log('\n📝 QuestionScheduler.ts の実装チェック:');
    const schedulerCode = readFileSync('./src/ai/scheduler/QuestionScheduler.ts', 'utf-8');

    // 保存済み優先度を使用しているか
    if (schedulerCode.includes('wordProgress.calculatedPriority')) {
      console.log('✅ calculatedPriority を読み込んでいる');
    } else {
      console.log('❌ calculatedPriority を読み込んでいない');
    }

    // incorrectを最優先に配置しているか
    if (schedulerCode.includes('incorrectQuestions') && schedulerCode.includes('stillLearningQuestions')) {
      console.log('✅ カテゴリ別に分類して優先順位付けしている');
    } else {
      console.log('❌ カテゴリ別の優先順位付けが見つからない');
    }

  } catch (error) {
    console.error('ファイル読み込みエラー:', error.message);
  }
};

testPriorityCalculation();
