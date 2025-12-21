import { describe, expect, it } from 'vitest';

import { computeAttemptCounts } from '../../src/components/scoreBoard/attemptCounts';

describe('computeAttemptCounts', () => {
  it('translation: translationAttempts が無くても quizAttempts を参照して集計する', () => {
    const counts = computeAttemptCounts({
      mode: 'translation',
      wordProgress: {
        apple: { quizAttempts: 1 },
      },
    });

    expect(counts).toEqual({
      once: 1,
      twice: 0,
      three: 0,
      four: 0,
      five: 0,
      sixOrMore: 0,
    });
  });

  it('ストレージの値をそのまま表示（回答前）', () => {
    const counts = computeAttemptCounts({
      mode: 'memorization',
      wordProgress: {
        word1: { memorizationAttempts: 1 },
        word2: { memorizationAttempts: 2 },
        word3: { memorizationAttempts: 3 },
      },
    });

    expect(counts).toEqual({
      once: 1,  // word1
      twice: 1, // word2
      three: 1, // word3
      four: 0,
      five: 0,
      sixOrMore: 0,
    });
  });

  it('ストレージ更新を反映（回答後）', () => {
    const counts = computeAttemptCounts({
      mode: 'memorization',
      wordProgress: {
        word1: { memorizationAttempts: 2 }, // 回答後に更新済み
        word2: { memorizationAttempts: 2 },
      },
    });

    expect(counts).toEqual({
      once: 0,
      twice: 2, // word1, word2
      three: 0,
      four: 0,
      five: 0,
      sixOrMore: 0,
    });
  });

  it('currentWord: 未登録の単語は1回として追加される', () => {
    const counts = computeAttemptCounts({
      mode: 'memorization',
      currentWord: 'newWord',
      wordProgress: {
        word1: { memorizationAttempts: 1 },
      },
    });

    expect(counts).toEqual({
      once: 2,  // word1(1回) + newWord(未登録なので1回)
      twice: 0,
      three: 0,
      four: 0,
      five: 0,
      sixOrMore: 0,
    });
  });

  it('currentWord: 既に登録済みの単語は重複カウントしない', () => {
    const counts = computeAttemptCounts({
      mode: 'memorization',
      currentWord: 'word1',
      wordProgress: {
        word1: { memorizationAttempts: 2 },
        word2: { memorizationAttempts: 1 },
      },
    });

    expect(counts).toEqual({
      once: 1,  // word2
      twice: 1, // word1（既に2回なのでそのまま）
      three: 0,
      four: 0,
      five: 0,
      sixOrMore: 0,
    });
  });

  it('複数問を連続で回答したシナリオ', () => {
    // シナリオ: word1回答済み(1回) → word2表示中（未登録）
    const counts = computeAttemptCounts({
      mode: 'memorization',
      currentWord: 'word2',
      wordProgress: {
        word1: { memorizationAttempts: 1 }, // 1問目回答済み
      },
    });

    expect(counts).toEqual({
      once: 2,  // word1(1回) + word2(未登録なので1回)
      twice: 0,
      three: 0,
      four: 0,
      five: 0,
      sixOrMore: 0,
    });
  });
});
