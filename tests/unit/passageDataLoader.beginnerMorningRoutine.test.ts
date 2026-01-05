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

describe('passageDataLoader - beginner-morning-routine', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps sentence boundary after splitting "at seven every morning."', async () => {
    mockFetchOnce(async (url) => {
      if (url.endsWith('/data/passages-phrase-learning/beginner-morning-routine.json')) {
        return new Response(
          JSON.stringify({
            phrases: [
              { id: 1, english: 'I wake up', japanese: '私は起きます' },
              { id: 2, english: 'at seven every morning.', japanese: '私は毎朝7時に起きます。' },
              { id: 3, english: 'First, I brush my teeth and wash my face.', japanese: 'まず、歯を磨いて顔を洗います。' },
            ],
          }),
          { status: 200 }
        );
      }

      if (url.endsWith('/data/passages-translations/beginner-morning-routine-ja.txt')) {
        return new Response('私は毎朝7時に起きます。\nまず、歯を磨いて顔を洗います。', { status: 200 });
      }

      return new Response('not found', { status: 404 });
    });

    const data = await loadCompletePassage('beginner-morning-routine');

    expect(data.sentences.map((s) => s.english)).toEqual([
      'I wake up at seven every morning.',
      'First, I brush my teeth and wash my face.',
    ]);

    // 1文目が2文目を吸い込んでいない（回帰防止）
    expect(data.sentences[0].english.toLowerCase()).not.toContain('first');
  });
});
