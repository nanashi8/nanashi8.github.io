import { describe, expect, it } from 'vitest';
import { analyzeSentence } from '../../src/utils/grammarAnalyzer';

describe('grammarAnalyzer.analyzeSentence', () => {
  it('tags basic S/V/O and prepositional phrase start correctly', () => {
    const result = analyzeSentence('Then I eat breakfast with my family.');

    const byWord = (w: string) => result.find((r) => r.word === w);

    expect(byWord('Then')?.tag).toBe('Adv');
    expect(byWord('I')?.tag).toBe('S');
    expect(byWord('eat')?.tag).toBe('V');
    expect(byWord('breakfast')?.tag).toBe('O');

    expect(byWord('with')?.tag).toBe('Prep');
    expect(byWord('my')?.tag).toBe('Det');

    // object of preposition is treated as modifier token in this simple tagset
    expect(byWord('family')?.tag).toBe('M');

    expect(byWord('.')?.tag).toBe('Unknown');
  });

  it('treats complements after be-verbs as C', () => {
    const result = analyzeSentence('I am a student.');
    const byWord = (w: string) => result.find((r) => r.word === w);

    expect(byWord('I')?.tag).toBe('S');
    expect(byWord('am')?.tag).toBe('V');
    expect(byWord('a')?.tag).toBe('Det');
    expect(byWord('student')?.tag).toBe('C');
  });

  it('tags coordinated objects as O (toast and juice)', () => {
    const result = analyzeSentence('I usually have toast and juice.');
    const byWord = (w: string) => result.find((r) => r.word === w);

    expect(byWord('I')?.tag).toBe('S');
    expect(byWord('have')?.tag).toBe('V');
    expect(byWord('toast')?.tag).toBe('O');
    // 'and' is a conjunction in the raw tagset
    expect(byWord('and')?.tag).toBe('Conj');
    expect(byWord('juice')?.tag).toBe('O');
  });

  it('treats "every + time noun" as M (frequency expression), not O', () => {
    const result = analyzeSentence('I wake up at seven every morning.');
    const byWord = (w: string) => result.find((r) => r.word === w);

    expect(byWord('I')?.tag).toBe('S');
    expect(byWord('wake')?.tag).toBe('V');
    expect(byWord('at')?.tag).toBe('Prep');

    // key assertion: morning should not be treated as the object
    expect(byWord('morning')?.tag).toBe('M');
  });

  it('does not change object cases like "every movie"', () => {
    const result = analyzeSentence('I like every movie.');
    const byWord = (w: string) => result.find((r) => r.word === w);

    expect(byWord('I')?.tag).toBe('S');
    expect(byWord('like')?.tag).toBe('V');
    expect(byWord('every')?.tag).toBe('Det');
    expect(byWord('movie')?.tag).toBe('O');
  });
});
