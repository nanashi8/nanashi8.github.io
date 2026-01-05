import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadCompletePassage } from '../src/utils/passageDataLoader';

type MockResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
};

function responseFromBody(body: string, status: number): MockResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => JSON.parse(body) as unknown,
    text: async () => body,
  };
}

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(here, '..');
  const publicRoot = path.join(repoRoot, 'public');

  // passageDataLoader は fetch('/data/...') を使うため、ファイルへマップする
  // @ts-expect-error - script override
  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : String(input);
    if (!url.startsWith('/data/')) return responseFromBody('not found', 404);

    const filePath = path.join(publicRoot, url.replace(/^\/data\//, 'data/'));
    try {
      const body = await readFile(filePath, 'utf8');
      return responseFromBody(body, 200);
    } catch {
      return responseFromBody('not found', 404);
    }
  };

  const passageId = 'beginner-morning-routine';
  const data = await loadCompletePassage(passageId);
  const got = data.sentences.map((s) => s.english);

  const expectedFirst = 'I wake up at seven every morning.';
  if (got[0] !== expectedFirst) {
    throw new Error(
      [
        '[reading-quote-check] Sentence quoting mismatch',
        `passageId: ${passageId}`,
        `expected[0]: ${expectedFirst}`,
        `got[0]: ${got[0] ?? '(missing)'}`,
      ].join('\n')
    );
  }

  if ((got[0] ?? '').toLowerCase().includes('first')) {
    throw new Error(
      [
        '[reading-quote-check] Sentence boundary regression: sentence 1 contains next sentence',
        `passageId: ${passageId}`,
        `got[0]: ${got[0]}`,
      ].join('\n')
    );
  }

  // eslint-disable-next-line no-console
  console.log('[reading-quote-check] OK');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(String(err?.message ?? err));
  process.exit(1);
});
