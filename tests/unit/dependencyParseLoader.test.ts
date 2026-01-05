import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  loadDependencyParsedPassage,
  findDependencySentenceByText,
} from '@/utils/dependencyParseLoader';
import type { DependencyParsedPassage } from '@/types/passage';

type MockResponse = {
  ok: boolean;
  json?: () => Promise<unknown>;
};

describe('dependencyParseLoader', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('loadDependencyParsedPassage returns null when response is not ok', async () => {
    const fetchMock = vi.fn(async (): Promise<MockResponse> => ({ ok: false }));
    // @ts-expect-error test override
    globalThis.fetch = fetchMock;

    const parsed = await loadDependencyParsedPassage('missing');

    expect(parsed).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith('/data/passage-parses/missing.json');
  });

  it('loadDependencyParsedPassage returns parsed JSON when response is ok', async () => {
    const payload: DependencyParsedPassage = {
      passageId: 'x',
      generatedAt: '2026-01-03T00:00:00Z',
      sentences: [
        {
          id: 1,
          text: 'Hello, world!',
          tokens: [],
        },
      ],
    };

    const fetchMock = vi.fn(async (): Promise<MockResponse> => ({
      ok: true,
      json: async () => payload,
    }));
    // @ts-expect-error test override
    globalThis.fetch = fetchMock;

    const parsed = await loadDependencyParsedPassage('x');

    expect(parsed).not.toBeNull();
    expect(parsed!.passageId).toBe('x');
    expect(parsed!.sentences).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith('/data/passage-parses/x.json');
  });

  it('findDependencySentenceByText matches by normalized punctuation/whitespace', () => {
    const parsed: DependencyParsedPassage = {
      passageId: 'x',
      sentences: [
        {
          id: 1,
          text: 'Hello,   world!',
          tokens: [],
        },
      ],
    };

    const found = findDependencySentenceByText(parsed, 'hello world');
    expect(found).not.toBeNull();
    expect(found!.id).toBe(1);
  });
});
