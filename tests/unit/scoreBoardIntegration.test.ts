import { describe, expect, it, beforeEach } from 'vitest';
import { computeAttemptCounts } from '../../src/components/scoreBoard/attemptCounts';

describe('ScoreBoard 統合テスト: 暗記タブでランダムに回答', () => {
  // テスト用のストレージシミュレーション
  let wordProgress: Record<string, any>;

  beforeEach(() => {
    // 各テストの前にストレージをリセット
    wordProgress = {};
  });

  // ユーザーが回答するシミュレーション
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
    // 'stillLearning' は memorizationAttempts のみ増加
  }

  // スコアボードで表示されるカウントを取得
  function getScoreBoardCounts(currentWord?: string) {
    return computeAttemptCounts({
      mode: 'memorization',
      currentWord,
      wordProgress,
    });
  }

  it('シナリオ1: 3問連続で「覚えてる」', () => {
    // 1問目表示（未回答）
    let counts = getScoreBoardCounts('word1');
    expect(counts.once).toBe(1); // word1（未登録なので1回）

    // 1問目「覚えてる」
    answerQuestion('word1', 'correct');
    counts = getScoreBoardCounts('word1');
    expect(counts.once).toBe(1); // word1（ストレージに1回）

    // 2問目表示（未回答）
    counts = getScoreBoardCounts('word2');
    expect(counts.once).toBe(2); // word1(1回) + word2(未登録なので1回)

    // 2問目「覚えてる」
    answerQuestion('word2', 'correct');
    counts = getScoreBoardCounts('word2');
    expect(counts.once).toBe(2); // word1(1回) + word2(1回)

    // 3問目表示（未回答）
    counts = getScoreBoardCounts('word3');
    expect(counts.once).toBe(3); // word1(1回) + word2(1回) + word3(未登録なので1回)

    // 3問目「覚えてる」
    answerQuestion('word3', 'correct');
    counts = getScoreBoardCounts('word3');
    expect(counts.once).toBe(3); // word1(1回) + word2(1回) + word3(1回)
  });

  it('シナリオ2: ランダムに回答（覚えてる・まだまだ・分からない）', () => {
    // 1問目表示
    let counts = getScoreBoardCounts('apple');
    expect(counts.once).toBe(1); // apple（未登録）

    // 1問目「覚えてる」
    answerQuestion('apple', 'correct');
    counts = getScoreBoardCounts('apple');
    expect(counts.once).toBe(1); // apple(1回)

    // 2問目表示
    counts = getScoreBoardCounts('banana');
    expect(counts.once).toBe(2); // apple(1回) + banana(未登録)

    // 2問目「まだまだ」
    answerQuestion('banana', 'stillLearning');
    counts = getScoreBoardCounts('banana');
    expect(counts.once).toBe(2); // apple(1回) + banana(1回)

    // 3問目表示
    counts = getScoreBoardCounts('cherry');
    expect(counts.once).toBe(3); // apple(1回) + banana(1回) + cherry(未登録)

    // 3問目「分からない」
    answerQuestion('cherry', 'incorrect');
    counts = getScoreBoardCounts('cherry');
    expect(counts.once).toBe(3); // apple(1回) + banana(1回) + cherry(1回)

    // 4問目表示
    counts = getScoreBoardCounts('date');
    expect(counts.once).toBe(4); // apple(1回) + banana(1回) + cherry(1回) + date(未登録)

    // 4問目「覚えてる」
    answerQuestion('date', 'correct');
    counts = getScoreBoardCounts('date');
    expect(counts.once).toBe(4); // 全て1回
  });

  it('シナリオ3: 同じ単語を複数回回答', () => {
    // 1回目: word1表示
    let counts = getScoreBoardCounts('word1');
    expect(counts.once).toBe(1);

    // 1回目: 「分からない」
    answerQuestion('word1', 'incorrect');
    counts = getScoreBoardCounts('word1');
    expect(counts.once).toBe(1); // word1(1回)

    // 2回目: word1が再出題
    counts = getScoreBoardCounts('word1');
    expect(counts.once).toBe(1); // word1（既に1回登録済み）

    // 2回目: 「まだまだ」
    answerQuestion('word1', 'stillLearning');
    counts = getScoreBoardCounts('word1');
    expect(counts.twice).toBe(1); // word1(2回に増加)

    // 3回目: word1が再出題
    counts = getScoreBoardCounts('word1');
    expect(counts.twice).toBe(1); // word1（既に2回登録済み）

    // 3回目: 「覚えてる」
    answerQuestion('word1', 'correct');
    counts = getScoreBoardCounts('word1');
    expect(counts.three).toBe(1); // word1(3回に増加)
  });

  it('シナリオ4: 10問をランダムに回答', () => {
    const words = ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9', 'w10'];
    const actions: Array<'correct' | 'stillLearning' | 'incorrect'> = [
      'correct',
      'stillLearning',
      'incorrect',
      'correct',
      'correct',
      'stillLearning',
      'incorrect',
      'correct',
      'stillLearning',
      'incorrect',
    ];

    // 全問を順番に回答
    words.forEach((word, index) => {
      // 表示時のカウント確認
      const beforeAnswer = getScoreBoardCounts(word);
      expect(beforeAnswer.once).toBe(index + 1); // 未回答分 + 回答済み

      // 回答
      answerQuestion(word, actions[index]);

      // 回答後のカウント確認
      const afterAnswer = getScoreBoardCounts(word);
      expect(afterAnswer.once).toBe(index + 1); // 全て1回
    });

    // 最終的に全10問が1回ずつ
    const finalCounts = getScoreBoardCounts();
    expect(finalCounts.once).toBe(10);
    expect(finalCounts.twice).toBe(0);
  });

  it('シナリオ5: 複数回回答して2回・3回のカウントが増える', () => {
    // word1を3回回答
    answerQuestion('word1', 'incorrect'); // 1回目
    answerQuestion('word1', 'stillLearning'); // 2回目
    answerQuestion('word1', 'correct'); // 3回目

    // word2を2回回答
    answerQuestion('word2', 'stillLearning'); // 1回目
    answerQuestion('word2', 'correct'); // 2回目

    // word3を1回回答
    answerQuestion('word3', 'correct'); // 1回目

    const counts = getScoreBoardCounts();
    expect(counts.once).toBe(1); // word3
    expect(counts.twice).toBe(1); // word2
    expect(counts.three).toBe(1); // word1
  });

  it('シナリオ6: 表示中の問題が既に5回回答済み', () => {
    // word1を5回回答済みにする
    for (let i = 0; i < 5; i++) {
      answerQuestion('word1', 'correct');
    }

    // word1を表示（6回目の出題）
    const counts = getScoreBoardCounts('word1');
    expect(counts.five).toBe(1); // word1は既に5回（currentWordは重複カウントしない）
  });

  it('シナリオ7: 回答後に次の問題を表示', () => {
    // 1問目回答
    answerQuestion('word1', 'correct');

    // 2問目表示（1問目回答済み、2問目未回答）
    const counts = getScoreBoardCounts('word2');
    expect(counts.once).toBe(2); // word1(1回) + word2(未登録なので1回)
  });
});
