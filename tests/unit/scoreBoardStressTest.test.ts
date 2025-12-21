import { describe, expect, it, beforeEach } from 'vitest';
import { computeAttemptCounts } from '../../src/components/scoreBoard/attemptCounts';

describe('ScoreBoard ストレステスト: 1000回の回答', () => {
  let wordProgress: Record<string, any>;

  beforeEach(() => {
    wordProgress = {};
  });

  function answerQuestion(
    word: string,
    action: 'correct' | 'stillLearning' | 'incorrect'
  ) {
    if (!wordProgress[word]) {
      wordProgress[word] = {
        memorizationAttempts: 0,
        correctCount: 0,
        incorrectCount: 0,
      };
    }

    const wp = wordProgress[word];
    wp.memorizationAttempts++;

    if (action === 'correct') {
      wp.correctCount++;
    } else if (action === 'incorrect') {
      wp.incorrectCount++;
    }
  }

  it('1000回の回答をシミュレート（ランダムパターン）', () => {
    const words = Array.from({ length: 100 }, (_, i) => `word${i + 1}`);
    const actions: Array<'correct' | 'stillLearning' | 'incorrect'> = [
      'correct',
      'stillLearning',
      'incorrect',
    ];

    // 1000回の回答をシミュレート
    for (let i = 0; i < 1000; i++) {
      const wordIndex = Math.floor(Math.random() * words.length);
      const actionIndex = Math.floor(Math.random() * actions.length);
      const word = words[wordIndex];
      const action = actions[actionIndex];

      answerQuestion(word, action);
    }

    // 最終的なスコアボードの表示を取得
    const counts = computeAttemptCounts({
      mode: 'memorization',
      wordProgress,
    });

    // 結果を詳細に出力
    console.log('\n========================================');
    console.log('📊 1000回回答後のスコアボード表示');
    console.log('========================================');
    console.log(`1回目の出題: ${counts.once}問`);
    console.log(`2回目の出題: ${counts.twice}問`);
    console.log(`3回目の出題: ${counts.three}問`);
    console.log(`4回目の出題: ${counts.four}問`);
    console.log(`5回目の出題: ${counts.five}問`);
    console.log(`6回以上の出題: ${counts.sixOrMore}問`);
    console.log('----------------------------------------');
    console.log(
      `合計: ${counts.once + counts.twice + counts.three + counts.four + counts.five + counts.sixOrMore}問`
    );

    // 詳細な分布を出力
    const distribution: Record<number, number> = {};
    Object.values(wordProgress).forEach((wp: any) => {
      const attempts = wp.memorizationAttempts || 0;
      distribution[attempts] = (distribution[attempts] || 0) + 1;
    });

    console.log('\n📈 詳細な出題回数分布:');
    Object.entries(distribution)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .forEach(([attempts, count]) => {
        console.log(`  ${attempts}回: ${count}問`);
      });

    console.log('\n🎯 統計情報:');
    const totalWords = Object.keys(wordProgress).length;
    const totalAttempts = Object.values(wordProgress).reduce(
      (sum: number, wp: any) => sum + (wp.memorizationAttempts || 0),
      0
    );
    const avgAttempts = totalAttempts / totalWords;
    console.log(`  総単語数: ${totalWords}語`);
    console.log(`  総回答数: ${totalAttempts}回`);
    console.log(`  平均出題回数: ${avgAttempts.toFixed(2)}回/語`);
    console.log('========================================\n');

    // 合計が正しいことを確認
    const total =
      counts.once + counts.twice + counts.three + counts.four + counts.five + counts.sixOrMore;
    expect(total).toBe(totalWords);

    // 少なくとも一部の単語は複数回出題されているはず
    expect(counts.twice + counts.three + counts.four + counts.five + counts.sixOrMore).toBeGreaterThan(
      0
    );
  });

  it('1000回の回答をシミュレート（均等分散パターン）', () => {
    const words = Array.from({ length: 100 }, (_, i) => `word${i + 1}`);

    // 各単語に10回ずつ均等に出題
    for (let i = 0; i < 1000; i++) {
      const word = words[i % words.length];
      const actionIndex = i % 3;
      const actions: Array<'correct' | 'stillLearning' | 'incorrect'> = [
        'correct',
        'stillLearning',
        'incorrect',
      ];
      answerQuestion(word, actions[actionIndex]);
    }

    const counts = computeAttemptCounts({
      mode: 'memorization',
      wordProgress,
    });

    console.log('\n========================================');
    console.log('📊 1000回回答後のスコアボード表示（均等分散）');
    console.log('========================================');
    console.log(`1回目の出題: ${counts.once}問`);
    console.log(`2回目の出題: ${counts.twice}問`);
    console.log(`3回目の出題: ${counts.three}問`);
    console.log(`4回目の出題: ${counts.four}問`);
    console.log(`5回目の出題: ${counts.five}問`);
    console.log(`6回以上の出題: ${counts.sixOrMore}問`);
    console.log('========================================\n');

    // 均等なので全て10回出題されているはず
    expect(counts.sixOrMore).toBe(100);
    expect(counts.once + counts.twice + counts.three + counts.four + counts.five).toBe(0);
  });

  it('1000回の回答をシミュレート（偏りパターン: 一部の単語だけ繰り返し）', () => {
    const words = Array.from({ length: 100 }, (_, i) => `word${i + 1}`);

    // 最初の10単語だけを繰り返し出題（各100回）
    for (let i = 0; i < 1000; i++) {
      const word = words[i % 10]; // 最初の10単語だけ
      const actions: Array<'correct' | 'stillLearning' | 'incorrect'> = [
        'correct',
        'stillLearning',
        'incorrect',
      ];
      const actionIndex = i % 3;
      answerQuestion(word, actions[actionIndex]);
    }

    const counts = computeAttemptCounts({
      mode: 'memorization',
      wordProgress,
    });

    console.log('\n========================================');
    console.log('📊 1000回回答後のスコアボード表示（偏りパターン）');
    console.log('========================================');
    console.log(`1回目の出題: ${counts.once}問`);
    console.log(`2回目の出題: ${counts.twice}問`);
    console.log(`3回目の出題: ${counts.three}問`);
    console.log(`4回目の出題: ${counts.four}問`);
    console.log(`5回目の出題: ${counts.five}問`);
    console.log(`6回以上の出題: ${counts.sixOrMore}問`);
    console.log('\n🎯 説明: 10単語が各100回ずつ出題');
    console.log('========================================\n');

    // 10単語が100回ずつ出題されているはず
    expect(counts.sixOrMore).toBe(10);
    expect(counts.once + counts.twice + counts.three + counts.four + counts.five).toBe(0);
  });
});
