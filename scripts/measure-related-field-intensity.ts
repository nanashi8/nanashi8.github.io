#!/usr/bin/env tsx

/// <reference types="node" />

type Item = {
  word?: string;
  category?: string;
  // fallback shapes
  question?: { word?: string; category?: string };
};

type AnyJson = any;

type ParsedSequenceItem = {
  word: string;
  category: string;
};

function printHelp(): void {
  console.log(`
関連分野（category）の“固まり具合”を測定するツール

使い方:
  npx tsx scripts/measure-related-field-intensity.ts <input.(json|csv)> [options]
  cat <input.(json|csv)> | npx tsx scripts/measure-related-field-intensity.ts - [options]

入力フォーマット例:
  1) 配列: [{ word, category }, ...]
  2) debug出力: { top30: [{word, category}, ...] } など
  3) CSV: 語句,読み,意味,語源等解説,関連語,関連分野,難易度,...（ヘッダあり）

オプション:
  --format <json|csv> 入力形式の明示（省略時は拡張子 or JSONパースで推定）
  --path <jsonPath>   JSON内の配列を指すパス（例: top30 / payload.top30）
                    （省略時は top30 → top100 → 最初に見つかった配列 を自動使用）
  --limit <N>         先頭N件だけ測定（デバッグ用）
  --csv-word <name>   CSVの語句列名（既定: 語句 / word）
  --csv-cat <name>    CSVのカテゴリ列名（既定: 関連分野 / category）
  --per-word-limit <N|all> perWord の出力件数（既定: 50, allで全件）

例:
  npx tsx scripts/measure-related-field-intensity.ts public/data/vocabulary/all-words.csv
  npx tsx scripts/measure-related-field-intensity.ts debug.json --path top30 --limit 100

出力:
  - sameCategoryRate: 隣り合う2問が同じcategoryの割合
  - expectedSameCategoryRateRandom: カテゴリ比率が同じでランダム並びの期待値（厳密: sum n(n-1) / (N(N-1))）
  - expectedSameCategoryRateRandomApprox: 近似（sum(p^2)）
  - liftVsRandom: sameCategoryRate / expectedSameCategoryRateRandom
  - avgRunLength: 同じcategoryが連続する平均長
  - perCategory: category別の連続統計
  - perWord: 各wordの“隣が同category”率（全語ぶん）
`);
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk: string) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

function getByPath(obj: AnyJson, path: string): AnyJson {
  const parts = path.split('.').filter(Boolean);
  let cur: AnyJson = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function findFirstArrayCandidate(obj: AnyJson): AnyJson {
  if (obj == null) return undefined;
  if (Array.isArray(obj)) return obj;
  if (typeof obj !== 'object') return undefined;

  // debug_postProcess_output / sortAndBalance_top100 などの典型
  if (Array.isArray((obj as any).top30)) return (obj as any).top30;
  if (Array.isArray((obj as any).top100)) return (obj as any).top100;

  // ありがちなラッパー（payload 等）
  for (const key of Object.keys(obj as any)) {
    const v = (obj as any)[key];
    if (Array.isArray(v)) return v;
  }

  // 1段だけ入れ子を探索
  for (const key of Object.keys(obj as any)) {
    const v = (obj as any)[key];
    if (v && typeof v === 'object') {
      const found = findFirstArrayCandidate(v);
      if (Array.isArray(found)) return found;
    }
  }

  return undefined;
}

function coerceSequence(value: AnyJson): ParsedSequenceItem[] {
  if (!Array.isArray(value)) {
    throw new Error('指定パス（またはJSON全体）が配列ではありません');
  }

  const out: ParsedSequenceItem[] = [];
  for (const raw of value as Item[]) {
    const word =
      (typeof raw?.word === 'string' && raw.word) ||
      (typeof raw?.question?.word === 'string' && raw.question.word) ||
      '';
    const category =
      (typeof raw?.category === 'string' && raw.category) ||
      (typeof raw?.question?.category === 'string' && raw.question.category) ||
      '';

    if (!word || !category) continue;
    out.push({ word, category });
  }

  if (out.length === 0) {
    throw new Error('word/category を含む要素が見つかりません（全件スキップされました）');
  }

  return out;
}

function parseCsvText(csvText: string): string[][] {
  // RFC 4180の最低限（引用符・改行・カンマ）を扱う簡易パーサ
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];

    if (inQuotes) {
      if (ch === '"') {
        const next = csvText[i + 1];
        if (next === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      continue;
    }
    if (ch === '\n') {
      row.push(field);
      field = '';
      if (row.some((v) => v.trim() !== '')) rows.push(row);
      row = [];
      continue;
    }
    if (ch === '\r') {
      continue;
    }

    field += ch;
  }

  row.push(field);
  if (row.some((v) => v.trim() !== '')) rows.push(row);
  return rows;
}

function coerceSequenceFromCsv(
  csvText: string,
  opts: { wordColumnName?: string; categoryColumnName?: string }
): ParsedSequenceItem[] {
  const rows = parseCsvText(csvText);
  if (rows.length < 2) {
    throw new Error('CSVの行数が不足しています（ヘッダ+1行以上が必要）');
  }

  const header = rows[0].map((h) => h.trim());
  const wordName = (opts.wordColumnName || '').trim();
  const catName = (opts.categoryColumnName || '').trim();

  const resolveIndex = (names: string[]): number => {
    for (const n of names) {
      const idx = header.indexOf(n);
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const wordIdx = resolveIndex([wordName, '語句', 'word'].filter(Boolean));
  const catIdx = resolveIndex([catName, '関連分野', 'category'].filter(Boolean));

  if (wordIdx < 0 || catIdx < 0) {
    throw new Error(
      `CSVの列名が見つかりません（wordIdx=${wordIdx}, catIdx=${catIdx}）。` +
        ` --csv-word / --csv-cat で列名を指定できます。`
    );
  }

  const out: ParsedSequenceItem[] = [];
  for (const r of rows.slice(1)) {
    const word = (r[wordIdx] || '').trim();
    const category = (r[catIdx] || '').trim();
    if (!word || !category) continue;
    out.push({ word, category });
  }

  if (out.length === 0) {
    throw new Error('CSVから word/category を含む行が見つかりません（全件スキップされました）');
  }
  return out;
}

function computeSameCategoryRate(seq: ParsedSequenceItem[]): number {
  if (seq.length < 2) return 0;
  let same = 0;
  for (let i = 1; i < seq.length; i++) {
    if (seq[i].category === seq[i - 1].category) same++;
  }
  return same / (seq.length - 1);
}

function computeRunStats(seq: ParsedSequenceItem[]): {
  avgRunLength: number;
  runs: Array<{ category: string; length: number }>; 
  perCategory: Record<
    string,
    {
      runs: number;
      total: number;
      avgRunLength: number;
      maxRunLength: number;
    }
  >;
} {
  const runs: Array<{ category: string; length: number }> = [];
  if (seq.length === 0) {
    return { avgRunLength: 0, runs, perCategory: {} };
  }

  let curCat = seq[0].category;
  let curLen = 1;
  for (let i = 1; i < seq.length; i++) {
    if (seq[i].category === curCat) {
      curLen++;
    } else {
      runs.push({ category: curCat, length: curLen });
      curCat = seq[i].category;
      curLen = 1;
    }
  }
  runs.push({ category: curCat, length: curLen });

  const avgRunLength = runs.reduce((s, r) => s + r.length, 0) / runs.length;

  const perCategory: Record<
    string,
    { runs: number; total: number; avgRunLength: number; maxRunLength: number }
  > = {};

  for (const r of runs) {
    const p = perCategory[r.category] || {
      runs: 0,
      total: 0,
      avgRunLength: 0,
      maxRunLength: 0,
    };
    p.runs += 1;
    p.total += r.length;
    p.maxRunLength = Math.max(p.maxRunLength, r.length);
    perCategory[r.category] = p;
  }

  for (const k of Object.keys(perCategory)) {
    const p = perCategory[k];
    p.avgRunLength = p.total / p.runs;
  }

  return { avgRunLength, runs, perCategory };
}

function computePerCategoryStickiness(seq: ParsedSequenceItem[]): Record<
  string,
  {
    transitionsFrom: number;
    sameAsNext: number;
    sameAsNextRate: number;
  }
> {
  const acc: Record<
    string,
    { transitionsFrom: number; sameAsNext: number; sameAsNextRate: number }
  > = {};

  if (seq.length < 2) return acc;

  for (let i = 0; i < seq.length - 1; i++) {
    const c = seq[i].category;
    const next = seq[i + 1].category;
    const cur = acc[c] || { transitionsFrom: 0, sameAsNext: 0, sameAsNextRate: 0 };
    cur.transitionsFrom += 1;
    if (next === c) cur.sameAsNext += 1;
    acc[c] = cur;
  }

  for (const k of Object.keys(acc)) {
    const v = acc[k];
    v.sameAsNextRate = v.transitionsFrom > 0 ? v.sameAsNext / v.transitionsFrom : 0;
  }

  return acc;
}

function computePerWordNeighborMatchRate(seq: ParsedSequenceItem[]): Array<{
  word: string;
  category: string;
  occurrences: number;
  neighborComparisons: number;
  neighborMatches: number;
  neighborMatchRate: number;
}> {
  // 各出現位置で、左右の隣との一致を数える（端は1回だけ）
  const acc = new Map<
    string,
    {
      word: string;
      category: string;
      occurrences: number;
      neighborComparisons: number;
      neighborMatches: number;
    }
  >();

  for (let i = 0; i < seq.length; i++) {
    const { word, category } = seq[i];
    const key = `${word}::${category}`;
    const cur =
      acc.get(key) ||
      ({ word, category, occurrences: 0, neighborComparisons: 0, neighborMatches: 0 } as const);

    let comparisons = 0;
    let matches = 0;

    if (i - 1 >= 0) {
      comparisons++;
      if (seq[i - 1].category === category) matches++;
    }
    if (i + 1 < seq.length) {
      comparisons++;
      if (seq[i + 1].category === category) matches++;
    }

    const updated = {
      ...cur,
      occurrences: cur.occurrences + 1,
      neighborComparisons: cur.neighborComparisons + comparisons,
      neighborMatches: cur.neighborMatches + matches,
    };
    acc.set(key, updated);
  }

  const out = Array.from(acc.values()).map((v) => ({
    ...v,
    neighborMatchRate: v.neighborComparisons > 0 ? v.neighborMatches / v.neighborComparisons : 0,
  }));

  // 見やすいように、出現回数が多い→一致率が高い順
  out.sort((a, b) => {
    if (b.occurrences !== a.occurrences) return b.occurrences - a.occurrences;
    return b.neighborMatchRate - a.neighborMatchRate;
  });
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const inputPath = args[0];
  const formatIdx = args.indexOf('--format');
  const pathIdx = args.indexOf('--path');
  const limitIdx = args.indexOf('--limit');
  const csvWordIdx = args.indexOf('--csv-word');
  const csvCatIdx = args.indexOf('--csv-cat');
  const perWordLimitIdx = args.indexOf('--per-word-limit');
  const format = formatIdx >= 0 ? String(args[formatIdx + 1] || '').toLowerCase() : '';
  const jsonPath = pathIdx >= 0 ? args[pathIdx + 1] : '';
  const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) : undefined;
  const csvWord = csvWordIdx >= 0 ? String(args[csvWordIdx + 1] || '') : '';
  const csvCat = csvCatIdx >= 0 ? String(args[csvCatIdx + 1] || '') : '';
  const perWordLimitRaw = perWordLimitIdx >= 0 ? String(args[perWordLimitIdx + 1] || '') : '';

  let rawText = '';
  if (inputPath === '-') {
    rawText = await readStdin();
  } else {
    const fs = await import('node:fs/promises');
    rawText = await fs.readFile(inputPath, 'utf8');
  }

  const shouldUseCsv =
    format === 'csv' ||
    (format !== 'json' && inputPath !== '-' && inputPath.toLowerCase().endsWith('.csv'));

  let seq: ParsedSequenceItem[];
  if (shouldUseCsv) {
    seq = coerceSequenceFromCsv(rawText, { wordColumnName: csvWord, categoryColumnName: csvCat });
  } else {
    const parsed = JSON.parse(rawText);
    const value = jsonPath ? getByPath(parsed, jsonPath) : (findFirstArrayCandidate(parsed) ?? parsed);
    seq = coerceSequence(value);
  }

  if (typeof limit === 'number' && Number.isFinite(limit) && limit > 0) {
    seq = seq.slice(0, limit);
  }

  const sameCategoryRate = computeSameCategoryRate(seq);
  const { avgRunLength, perCategory } = computeRunStats(seq);
  const perWord = computePerWordNeighborMatchRate(seq);

  const perCategoryStickiness = computePerCategoryStickiness(seq);

  const expectedSameCategoryRateRandom = (() => {
    // 厳密: カテゴリ比率固定（without replacement）で隣接2問が同カテゴリになる確率
    // sum n_c(n_c-1) / (N(N-1))
    const n = seq.length;
    if (n <= 1) return 0;
    const totals = Object.values(perCategory).map((v) => v.total);
    const numerator = totals.reduce((s, t) => s + t * (t - 1), 0);
    return numerator / (n * (n - 1));
  })();

  const expectedSameCategoryRateRandomApprox = (() => {
    // 近似: with replacement（sum(p^2)）
    const n = seq.length;
    if (n <= 0) return 0;
    const totals = Object.values(perCategory).map((v) => v.total);
    return totals.reduce((s, t) => {
      const p = t / n;
      return s + p * p;
    }, 0);
  })();

  const liftVsRandom =
    expectedSameCategoryRateRandom > 0 ? sameCategoryRate / expectedSameCategoryRateRandom : 0;

  const perWordLimit = (() => {
    if (!perWordLimitRaw) return 50;
    if (perWordLimitRaw.toLowerCase() === 'all') return Number.POSITIVE_INFINITY;
    const n = Number(perWordLimitRaw);
    if (!Number.isFinite(n)) return 50;
    if (n <= 0) return Number.POSITIVE_INFINITY;
    return n;
  })();

  const summary = {
    totalItems: seq.length,
    sameCategoryRate,
    expectedSameCategoryRateRandom,
    expectedSameCategoryRateRandomApprox,
    liftVsRandom,
    avgRunLength,
    // category別は上位だけ見やすいように並べ替え
    perCategory: Object.fromEntries(
      Object.entries(perCategory)
        .map(([cat, stats]) => {
          const sticky = perCategoryStickiness[cat];
          const n = seq.length;
          const expectedSameAsNextRateRandom =
            n > 1 ? Math.max(0, stats.total - 1) / (n - 1) : 0;
          const sameAsNextRate = sticky?.sameAsNextRate ?? 0;
          const transitionsFrom = sticky?.transitionsFrom ?? 0;
          const sameAsNext = sticky?.sameAsNext ?? 0;
          const expectedSameAsNext = expectedSameAsNextRateRandom * transitionsFrom;
          const excessSameAsNext = sameAsNext - expectedSameAsNext;
          const liftVsRandomSameAsNext =
            expectedSameAsNextRateRandom > 0 ? sameAsNextRate / expectedSameAsNextRateRandom : 0;

          return [
            cat,
            {
              ...stats,
              transitionsFrom,
              sameAsNext,
              sameAsNextRate,
              expectedSameAsNextRateRandom,
              expectedSameAsNext,
              excessSameAsNext,
              liftVsRandomSameAsNext,
            },
          ] as const;
        })
        .sort((a, b) => b[1].total - a[1].total)
    ),
    perWordTop: perWord.slice(0, Number.isFinite(perWordLimit) ? perWordLimit : perWord.length),
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(String(err?.stack || err));
  process.exit(1);
});
