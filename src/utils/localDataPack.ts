import { logger } from '@/utils/logger';

export const LOCAL_DATA_PACK_CACHE = 'v1-local-data-pack-cache';

export type LocalDataPackFileV1 = {
  /** Must start with /data/ (e.g. /data/passages-for-phrase-work/foo.txt) */
  path: string;
  /** File content as UTF-8 text */
  content: string;
  /** Optional explicit content type */
  contentType?: string;
};

export type LocalDataPackV1 = {
  schemaVersion: 1;
  files: LocalDataPackFileV1[];
};

function guessContentType(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.json')) return 'application/json; charset=utf-8';
  if (lower.endsWith('.csv')) return 'text/csv; charset=utf-8';
  if (lower.endsWith('.txt')) return 'text/plain; charset=utf-8';
  return 'application/octet-stream';
}

function normalizeAndValidatePath(pathValue: string): string {
  if (!pathValue || typeof pathValue !== 'string') {
    throw new Error('path が不正です');
  }

  const trimmed = pathValue.trim();
  if (!trimmed.startsWith('/')) {
    throw new Error('path は / から始めてください');
  }
  if (!trimmed.startsWith('/data/')) {
    throw new Error('path は /data/ 配下のみ許可されています');
  }
  if (trimmed.includes('..')) {
    throw new Error('path に .. は含められません');
  }

  return trimmed;
}

export async function installLocalDataPackFromJsonText(jsonText: string): Promise<{ fileCount: number }>
{
  if (!('caches' in window)) {
    throw new Error('このブラウザは Cache Storage API に対応していません');
  }

  let data: unknown;
  try {
    data = JSON.parse(jsonText);
  } catch {
    throw new Error('JSONの解析に失敗しました');
  }

  const pack = data as Partial<LocalDataPackV1>;
  if (pack.schemaVersion !== 1 || !Array.isArray(pack.files)) {
    throw new Error('教材ファイル形式が不正です（schemaVersion/files）');
  }

  // 既存の教材キャッシュを一旦消して“入れ替え”にする（残骸が残るのを防ぐ）
  await caches.delete(LOCAL_DATA_PACK_CACHE);
  const cache = await caches.open(LOCAL_DATA_PACK_CACHE);

  const origin = window.location.origin;
  const normalizedFiles: LocalDataPackFileV1[] = pack.files.map((f) => {
    if (!f || typeof f !== 'object') throw new Error('files の要素が不正です');

    const file = f as Partial<LocalDataPackFileV1>;
    const normalizedPath = normalizeAndValidatePath(String(file.path ?? ''));

    const content = typeof file.content === 'string' ? file.content : '';
    if (!content) {
      throw new Error(`content が空です: ${normalizedPath}`);
    }

    return {
      path: normalizedPath,
      content,
      contentType: typeof file.contentType === 'string' ? file.contentType : undefined,
    };
  });

  for (const f of normalizedFiles) {
    const url = new URL(f.path, origin).toString();
    const contentType = f.contentType || guessContentType(f.path);

    // Cache API は URL ごとの Response を保持できる。Service Worker 側で /data/** の fetch を
    // このキャッシュから優先的に返すことで、アプリ全体のデータ差し替えを実現する。
    await cache.put(
      url,
      new Response(f.content, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'X-Local-Data-Pack': '1',
        },
      })
    );
  }

  try {
    localStorage.setItem('localDataPackInstalledAt', String(Date.now()));
    localStorage.setItem('localDataPackFileCount', String(normalizedFiles.length));
  } catch {
    // localStorage失敗は無視
  }

  logger.log(`✅ ローカル教材を読み込みました: ${normalizedFiles.length} files`);
  return { fileCount: normalizedFiles.length };
}
