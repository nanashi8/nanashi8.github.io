import { describe, it, expect, vi, afterEach } from 'vitest';
import { loadCompletePassage } from '@/utils/passageDataLoader';
import type { DependencyParsedPassage } from '@/types/passage';

type MockResponse = {
  ok: boolean;
  text?: () => Promise<string>;
};

describe('passageDataLoader', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('builds CompletePassageData from UD parse + translation/phrase-work (keeps ASTERISK lines, extracts glossary)', async () => {
    const parsed: DependencyParsedPassage = {
      passageId: 'J_2022_5',
      sentences: [
        { id: 1, text: "He can't eat.", tokens: [] },
        { id: 2, text: 'Farm products do not grow well.', tokens: [] },
      ],
    };

    const jaSentences = ['彼は食べられません。', '農作物はよく育ちません。'].join('\n\n');

    const phraseWork = [
      "He can ' t eat .",
      '< < < ASTERISK > > > farm products don \' t grow well .',
      '',
      '< < < ASTERISK > > > farm product （ s ） 農作物',
    ].join('\n');

    const jaPhrases = ['彼は食べられません', '農作物はよく育ちません'].join('\n');

    const fetchMock = vi.fn(async (url: string): Promise<MockResponse> => {
      if (url === '/data/passages-translations/J_2022_5_sentences.txt') {
        return { ok: true, text: async () => jaSentences };
      }
      if (url === '/data/passages-for-phrase-work/J_2022_5.txt') {
        return { ok: true, text: async () => phraseWork };
      }
      if (url === '/data/passages-translations/J_2022_5_phrases.txt') {
        return { ok: true, text: async () => jaPhrases };
      }

      throw new Error(`Unexpected fetch url: ${url}`);
    });

    // @ts-expect-error test override
    globalThis.fetch = fetchMock;

    const data = await loadCompletePassage('J_2022_5', parsed);

    expect(data.passageId).toBe('J_2022_5');
    expect(data.sentences).toHaveLength(2);
    expect(data.sentences[0].japanese).toBe('彼は食べられません。');

    // phrase-work lines should be kept (marker removed) and normalized
    expect(data.phrases).toHaveLength(2);
    expect(data.phrases[0].english).toBe("He can't eat.");
    expect(data.phrases[1].english).toBe("farm products don't grow well.");

    // glossary should be extracted into annotatedWords and NOT leak into phrases
    expect(data.annotatedWords.some((w) => w.word === 'farm product')).toBe(true);
    expect(data.phrases.some((p) => p.english.includes('農作物'))).toBe(false);
  });
});
