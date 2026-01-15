type WordItem = { question: { word: string } };
type PositionedWordItem = WordItem & { position: number };

export function normalizeHeadChar(word: string): string {
  const w = String(word ?? '').toLowerCase();
  const c = w.charAt(0);
  return c >= 'a' && c <= 'z' ? c : '#';
}

export function fnv1a32(word: string): number {
  const s = String(word ?? '');
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function pickChainSeedIndex<T extends WordItem>(
  items: T[],
  getStrength: (a: string, b: string) => number
): number {
  if (items.length <= 1) return 0;

  // “開始語”が入力順に依存すると、そのままABC順が漏れやすい。
  // そこで、同一帯内で他との総関連度が最も高い語を起点にする（同点はハッシュで決定）。
  let bestIdx = 0;
  let bestScore = -1;
  let bestHash = fnv1a32(items[0].question.word);

  for (let i = 0; i < items.length; i++) {
    const wi = items[i].question.word;
    let score = 0;
    for (let j = 0; j < items.length; j++) {
      if (i === j) continue;
      score += getStrength(wi, items[j].question.word);
    }
    const h = fnv1a32(wi);
    if (score > bestScore || (score === bestScore && h < bestHash)) {
      bestScore = score;
      bestIdx = i;
      bestHash = h;
    }
  }
  return bestIdx;
}

export function maxAdjacentHeadRun<T extends WordItem>(items: T[]): number {
  if (!Array.isArray(items) || items.length === 0) return 0;
  let maxRun = 1;
  let run = 1;
  for (let i = 1; i < items.length; i++) {
    const h1 = normalizeHeadChar(items[i - 1].question.word);
    const h2 = normalizeHeadChar(items[i].question.word);
    if (h1 === h2) {
      run++;
      if (run > maxRun) maxRun = run;
    } else {
      run = 1;
    }
  }
  return maxRun;
}

export function diversifyByHeadCharWithinPositionBuckets<T extends PositionedWordItem>(
  items: T[],
  bucketSize: number
): T[] {
  if (!Array.isArray(items) || items.length <= 2) return items;
  if (!Number.isFinite(bucketSize) || bucketSize <= 0) return items;

  // Position帯（高→低）を維持しつつ、帯内で頭文字の連続を最小化
  const buckets = new Map<number, T[]>();
  for (const item of items) {
    const b = Math.floor((item.position ?? 0) / bucketSize);
    const list = buckets.get(b);
    if (list) list.push(item);
    else buckets.set(b, [item]);
  }

  const bucketKeys = Array.from(buckets.keys()).sort((a, b) => b - a);
  const out: T[] = [];
  let prevHead: string | null = null;

  for (const b of bucketKeys) {
    const seg = buckets.get(b) ?? [];
    if (seg.length <= 1) {
      if (seg.length === 1) {
        out.push(seg[0]);
        prevHead = normalizeHeadChar(seg[0].question.word);
      }
      continue;
    }

    const { sequence, lastHead } = reorderToAvoidAdjacentHead(seg, prevHead);
    out.push(...sequence);
    prevHead = lastHead;
  }

  return out;
}

function reorderToAvoidAdjacentHead<T extends WordItem>(
  items: T[],
  prevHead: string | null
): { sequence: T[]; lastHead: string | null } {
  // 同一頭文字の連続を最小化する決定的な貪欲法
  // - 各グループ（頭文字）ごとにキュー化し、残数が最も多いグループから取る
  // - ただし直前と同じ頭文字は可能な限り避ける
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = normalizeHeadChar(item.question.word);
    const list = groups.get(key);
    if (list) list.push(item);
    else groups.set(key, [item]);
  }

  const pickKey = (avoid: string | null): string | null => {
    let bestKey: string | null = null;
    let bestLen = -1;

    // 優先: avoid以外で最大残数（同数はキー昇順で決定的に）
    for (const [k, list] of groups.entries()) {
      const len = list.length;
      if (len <= 0) continue;
      if (avoid && k === avoid) continue;
      if (len > bestLen || (len === bestLen && bestKey !== null && k < bestKey)) {
        bestLen = len;
        bestKey = k;
      }
      if (bestKey === null && len > 0) {
        bestLen = len;
        bestKey = k;
      }
    }

    if (bestKey) return bestKey;

    // フォールバック: avoidしか残っていない
    if (avoid && (groups.get(avoid)?.length ?? 0) > 0) return avoid;

    // それも無いなら残りから最大
    for (const [k, list] of groups.entries()) {
      const len = list.length;
      if (len <= 0) continue;
      if (len > bestLen || (len === bestLen && bestKey !== null && k < bestKey)) {
        bestLen = len;
        bestKey = k;
      }
      if (bestKey === null && len > 0) {
        bestLen = len;
        bestKey = k;
      }
    }
    return bestKey;
  };

  const sequence: T[] = [];
  let last = prevHead;

  while (sequence.length < items.length) {
    const key = pickKey(last);
    if (!key) break;

    const list = groups.get(key);
    if (!list || list.length === 0) break;

    sequence.push(list.shift()!);
    last = key;
  }

  // 念のため、取りこぼしがあれば末尾に足す（通常ここには来ない）
  if (sequence.length < items.length) {
    const remaining: T[] = [];
    for (const list of groups.values()) remaining.push(...list);
    sequence.push(...remaining);
    if (sequence.length > 0) {
      last = normalizeHeadChar(sequence[sequence.length - 1].question.word);
    }
  }

  return { sequence, lastHead: last };
}
