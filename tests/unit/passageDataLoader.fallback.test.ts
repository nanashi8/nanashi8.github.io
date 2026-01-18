import { describe, it, expect, vi, afterEach } from 'vitest';
import { loadCompletePassage } from '@/utils/passageDataLoader';

function mockFetchOnce(impl: (url: string) => Promise<Response>) {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : String(input);
    return impl(url);
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe('passageDataLoader - fallback without dependency parse', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds sentences from passages-original when UD parse is missing', async () => {
    mockFetchOnce(async (url) => {
      if (url.endsWith('/data/passage-parses/J_2020_4.json')) {
        return new Response('not found', { status: 404 });
      }

      if (url.endsWith('/data/passages/1_passages-original/J_2020_4.txt')) {
        return new Response(
          ['J_2020_4', 'I like music. She plays the piano.\n\nHe plays soccer.'].join('\n'),
          { status: 200 }
        );
      }

      if (url.endsWith('/data/passages/4_passages-translations/J_2020_4_full.txt')) {
        return new Response('私は音楽が好きです。\n彼女はピアノを弾きます。\n\n彼はサッカーをします。', {
          status: 200,
        });
      }

      return new Response('not found', { status: 404 });
    });

    const data = await loadCompletePassage('J_2020_4');

    expect(data.sentences.length).toBeGreaterThan(0);
    expect(data.sentences[0].english).toBe('I like music.');
    expect(data.sentences[1].english).toBe('She plays the piano.');
    expect(data.sentences[0].japanese).toBe('私は音楽が好きです。');
  });
});
