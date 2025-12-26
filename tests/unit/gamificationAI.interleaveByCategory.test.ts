// @test-guard-bypass: このテストは既存のGamificationAI実装の動作確認であり、データファイルには依存しない
import { describe, expect, it } from 'vitest';

import { GamificationAI } from '../../src/ai/specialists/GamificationAI';

type PQ = { position: number; attempts: number; question: { word: string } };

function mkStruggling(idx: number): PQ {
  return { position: 60, attempts: 1, question: { word: `s${idx}` } };
}

function mkBoostedNew(idx: number): PQ {
  return { position: 50, attempts: 0, question: { word: `n${idx}` } };
}

describe('GamificationAI.interleaveByCategory', () => {
  it('interleaves as 4 struggling then 1 boosted-new (≈20% new) when both exist', () => {
    const ai = new GamificationAI();

    const struggling = Array.from({ length: 20 }, (_, i) => mkStruggling(i));
    const boostedNew = Array.from({ length: 5 }, (_, i) => mkBoostedNew(i));

    // 入力は「Position降順ソート済み」を想定（struggling(60) → boostedNew(50)）
    const input: PQ[] = [...struggling, ...boostedNew];

    const out = ai.interleaveByCategory(input);

    const top25 = out.slice(0, 25);
    const newCount = top25.filter((q) => q.attempts === 0).length;

    expect(newCount).toBe(5);

    // 4問ごとに新規が入る（位置: 5, 10, 15, 20, 25）
    expect(top25[4].question.word).toBe('n0');
    expect(top25[9].question.word).toBe('n1');
    expect(top25[14].question.word).toBe('n2');
    expect(top25[19].question.word).toBe('n3');
    expect(top25[24].question.word).toBe('n4');
  });
});
