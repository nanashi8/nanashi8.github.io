import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  loadParagraphReadingPatterns,
  loadSentenceReadingPatterns,
  loadQuestionTypeStrategies,
  loadReading100Paraphrased,
} from '@/utils/readingTechniquesLoader';

type MockResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

describe('readingTechniquesLoader (smoke)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    const fetchMock = vi.fn(async (url: string): Promise<MockResponse> => {
      const minimal = { version: 1, language: 'ja', licenseNote: 'test' };

      if (url.includes('paragraph_reading_patterns.json')) {
        return {
          ok: true,
          json: async () => ({
            ...minimal,
            patterns: [
              {
                id: 'P2',
                title: 't2',
                gist: 'g2',
                steps: [],
                pitfalls: [],
                exampleEn: 'e2',
              },
              {
                id: 'P1',
                title: 't1',
                gist: 'g1',
                steps: [],
                pitfalls: [],
                exampleEn: 'e1',
              },
            ],
          }),
        };
      }
      if (url.includes('sentence_reading_patterns.json')) {
        return {
          ok: true,
          json: async () => ({
            ...minimal,
            patterns: [
              {
                id: 'S10',
                title: 't10',
                gist: 'g10',
                steps: [],
                pitfalls: [],
                miniExampleEn: 'e10',
              },
              {
                id: 'S2',
                title: 't2',
                gist: 'g2',
                steps: [],
                pitfalls: [],
                miniExampleEn: 'e2',
              },
            ],
          }),
        };
      }
      if (url.includes('question_type_strategies.json')) {
        return {
          ok: true,
          json: async () => ({
            ...minimal,
            strategies: [
              {
                id: 'Q100',
                title: 't100',
                gist: 'g100',
                steps: [],
                pitfalls: [],
                miniExampleEn: 'e100',
              },
              {
                id: 'Q2',
                title: 't2',
                gist: 'g2',
                steps: [],
                pitfalls: [],
                miniExampleEn: 'e2',
              },
            ],
          }),
        };
      }
      if (url.includes('reading100_paraphrased.json')) {
        return {
          ok: true,
          json: async () => ({
            ...minimal,
            techniques: [
              {
                id: 'R002',
                originIndex: 2,
                category: 'c',
                title: 't2',
                gist: 'g2',
                steps: [],
              },
              {
                id: 'R001',
                originIndex: 1,
                category: 'c',
                title: 't1',
                gist: 'g1',
                steps: [],
              },
            ],
          }),
        };
      }

      return { ok: false, json: async () => ({}) };
    });

    // @ts-expect-error - test override
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('fetches each JSON from /data/reading-techniques/* and caches results', async () => {
    const p1 = await loadParagraphReadingPatterns();
    const p2 = await loadParagraphReadingPatterns();

    expect(p1).not.toBeNull();
    expect(p2).not.toBeNull();

    expect(p1!.patterns.map((x) => x.id)).toEqual(['P1', 'P2']);
    expect(p2!.patterns.map((x) => x.id)).toEqual(['P1', 'P2']);

    const s = await loadSentenceReadingPatterns();
    const q = await loadQuestionTypeStrategies();
    const r = await loadReading100Paraphrased();

    expect(s).not.toBeNull();
    expect(q).not.toBeNull();
    expect(r).not.toBeNull();

    expect(s!.patterns.map((x) => x.id)).toEqual(['S2', 'S10']);
    expect(q!.strategies.map((x) => x.id)).toEqual(['Q2', 'Q100']);
    expect(r!.techniques.map((x) => x.id)).toEqual(['R001', 'R002']);

    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;

    // paragraph is called twice but should be fetched once due to cache
    expect(fetchMock).toHaveBeenCalledWith(
      '/data/reading-techniques/paragraph_reading_patterns.json'
    );

    const paragraphCalls = fetchMock.mock.calls.filter((c) =>
      String(c[0]).includes('paragraph_reading_patterns.json')
    );
    expect(paragraphCalls.length).toBe(1);

    expect(fetchMock).toHaveBeenCalledWith(
      '/data/reading-techniques/sentence_reading_patterns.json'
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/data/reading-techniques/question_type_strategies.json'
    );
    expect(fetchMock).toHaveBeenCalledWith('/data/reading-techniques/reading100_paraphrased.json');
  });
});
