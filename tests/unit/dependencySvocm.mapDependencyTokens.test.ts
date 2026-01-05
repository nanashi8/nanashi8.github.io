import { describe, expect, it } from 'vitest';
import { mapDependencyTokensToSVOCMByStartIndex } from '../../src/utils/dependencySvocm';
import type { DependencyToken } from '../../src/types/passage';

describe('dependencySvocm.mapDependencyTokensToSVOCMByStartIndex', () => {
  it('treats compound:prt (phrasal verb particle) as V (wake up)', () => {
    const sentence = 'I wake up';

    const tokens: DependencyToken[] = [
      {
        id: 1,
        text: 'I',
        lemma: 'I',
        upos: 'PRON',
        head: 2,
        deprel: 'nsubj',
        start: sentence.indexOf('I'),
        end: sentence.indexOf('I') + 1,
      },
      {
        id: 2,
        text: 'wake',
        lemma: 'wake',
        upos: 'VERB',
        head: 0,
        deprel: 'root',
        start: sentence.indexOf('wake'),
        end: sentence.indexOf('wake') + 4,
      },
      {
        id: 3,
        text: 'up',
        lemma: 'up',
        upos: 'PART',
        head: 2,
        deprel: 'compound:prt',
        start: sentence.indexOf('up'),
        end: sentence.indexOf('up') + 2,
      },
    ];

    const mapped = mapDependencyTokensToSVOCMByStartIndex(tokens);

    expect(mapped.get(sentence.indexOf('I'))).toBe('S');
    expect(mapped.get(sentence.indexOf('wake'))).toBe('V');
    expect(mapped.get(sentence.indexOf('up'))).toBe('V');
  });

  it('handles copular clauses by tagging copula as V and predicate as C (I am a student.)', () => {
    const sentence = 'I am a student.';

    // UD-style: predicate nominal is the root; copula is a child with deprel=cop.
    const tokens: DependencyToken[] = [
      {
        id: 1,
        text: 'I',
        lemma: 'I',
        upos: 'PRON',
        head: 4,
        deprel: 'nsubj',
        start: sentence.indexOf('I'),
        end: sentence.indexOf('I') + 1,
      },
      {
        id: 2,
        text: 'am',
        lemma: 'be',
        upos: 'AUX',
        head: 4,
        deprel: 'cop',
        start: sentence.indexOf('am'),
        end: sentence.indexOf('am') + 2,
      },
      {
        id: 3,
        text: 'a',
        lemma: 'a',
        upos: 'DET',
        head: 4,
        deprel: 'det',
        start: sentence.indexOf('a student'),
        end: sentence.indexOf('a student') + 1,
      },
      {
        id: 4,
        text: 'student',
        lemma: 'student',
        upos: 'NOUN',
        head: 0,
        deprel: 'root',
        start: sentence.indexOf('student'),
        end: sentence.indexOf('student') + 7,
      },
      {
        id: 5,
        text: '.',
        lemma: '.',
        upos: 'PUNCT',
        head: 4,
        deprel: 'punct',
        start: sentence.indexOf('.'),
        end: sentence.indexOf('.') + 1,
      },
    ];

    const mapped = mapDependencyTokensToSVOCMByStartIndex(tokens);

    expect(mapped.get(sentence.indexOf('I'))).toBe('S');
    expect(mapped.get(sentence.indexOf('am'))).toBe('V');
    expect(mapped.get(sentence.indexOf('student'))).toBe('C');
  });

  it('treats object complements (resultative xcomp ADJ) as C (I get my bag ready.)', () => {
    const sentence = 'I get my bag ready.';

    const tokens: DependencyToken[] = [
      {
        id: 1,
        text: 'I',
        lemma: 'I',
        upos: 'PRON',
        head: 2,
        deprel: 'nsubj',
        start: sentence.indexOf('I'),
        end: sentence.indexOf('I') + 1,
      },
      {
        id: 2,
        text: 'get',
        lemma: 'get',
        upos: 'VERB',
        head: 0,
        deprel: 'root',
        start: sentence.indexOf('get'),
        end: sentence.indexOf('get') + 3,
      },
      {
        id: 3,
        text: 'my',
        lemma: 'my',
        upos: 'DET',
        head: 4,
        deprel: 'det',
        start: sentence.indexOf('my'),
        end: sentence.indexOf('my') + 2,
      },
      {
        id: 4,
        text: 'bag',
        lemma: 'bag',
        upos: 'NOUN',
        head: 2,
        deprel: 'obj',
        start: sentence.indexOf('bag'),
        end: sentence.indexOf('bag') + 3,
      },
      {
        id: 5,
        text: 'ready',
        lemma: 'ready',
        upos: 'ADJ',
        head: 2,
        deprel: 'xcomp',
        start: sentence.indexOf('ready'),
        end: sentence.indexOf('ready') + 5,
      },
      {
        id: 6,
        text: '.',
        lemma: '.',
        upos: 'PUNCT',
        head: 2,
        deprel: 'punct',
        start: sentence.indexOf('.'),
        end: sentence.indexOf('.') + 1,
      },
    ];

    const mapped = mapDependencyTokensToSVOCMByStartIndex(tokens);

    expect(mapped.get(sentence.indexOf('I'))).toBe('S');
    expect(mapped.get(sentence.indexOf('get'))).toBe('V');
    expect(mapped.get(sentence.indexOf('bag'))).toBe('O');
    expect(mapped.get(sentence.indexOf('ready'))).toBe('C');
  });
});
