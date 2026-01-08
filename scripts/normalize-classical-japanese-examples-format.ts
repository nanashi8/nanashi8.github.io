#!/usr/bin/env tsx

/**
 * JP系 classical-japanese CSV の例文1/例文2を
 * `本文（読み）＜現代語訳＞【出典】` 形式へ正規化する。
 *
 * 変換対象（デフォルト）:
 * - public/data/classical-japanese/classical-grammar.csv
 * - public/data/classical-japanese/classical-vocabulary.csv
 * - public/data/classical-japanese/classical-knowledge.csv
 * - public/data/classical-japanese/classical-words.csv
 * - public/data/classical-japanese/kanbun-words.csv
 * - public/data/classical-japanese/kanbun-practice.csv
 *
 * 方針:
 * - 既存の `本文（意味）【出典】` を以下へ変換
 *   `本文（読み）＜現代語訳＞【出典】`
 * - 既存の `本文（読み）『意味』【出典】` も `＜...＞` に変換
 * - `（現代語訳）` のようなタグが付いている例文も、形式統一のため変換する
 * - 既に `）＜` を含むものは変換済みとしてスキップ
 *
 * 使い方:
 *   npx tsx scripts/normalize-classical-japanese-examples-format.ts
 *
 * オプション:
 *   --dry-run   書き込みせず差分件数だけ表示
 */

import * as fs from 'fs';
import * as path from 'path';

type CsvRow = Record<string, string>;

type ParsedCsv = {
  headers: string[];
  rows: CsvRow[];
};

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      i++;
      continue;
    }
    args[key] = true;
  }
  return args;
}

/** RFC 4180の最低限（引用符・改行・カンマ）を扱う簡易CSVパーサ */
function parseCsvText(csvText: string): string[][] {
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
          continue;
        }
        inQuotes = false;
        continue;
      }
      field += ch;
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
    if (ch === '\r') continue;

    field += ch;
  }

  row.push(field);
  if (row.some((v) => v.trim() !== '')) rows.push(row);
  return rows;
}

function parseCsvToObjects(csvText: string): ParsedCsv {
  const table = parseCsvText(csvText);
  if (table.length < 2) return { headers: [], rows: [] };

  const headers = table[0].map((h) => h.trim());
  const rows: CsvRow[] = [];

  for (const r of table.slice(1)) {
    const row: CsvRow = {};
    headers.forEach((h, idx) => {
      row[h] = (r[idx] ?? '').trim();
    });
    rows.push(row);
  }

  return { headers, rows };
}

function escapeCsvCell(value: string): string {
  const v = value ?? '';
  const needsQuote = /[\n\r\",]/.test(v);
  if (!needsQuote) return v;
  return `"${v.replace(/"/g, '""')}"`;
}

function formatCsv(headers: string[], rows: CsvRow[]): string {
  const lines: string[] = [];
  lines.push(headers.map(escapeCsvCell).join(','));
  for (const r of rows) {
    lines.push(headers.map((h) => escapeCsvCell(r[h] ?? '')).join(','));
  }
  return lines.join('\n') + '\n';
}

type ParsedExample = {
  quote: string;
  reading: string;
  meaning: string;
  source: string;
};

function parseExample(text: string): ParsedExample | null {
  const raw = (text || '').trim();
  if (!raw) return null;

  // 既に新フォーマット（＜...＞）っぽいものはスキップ
  if (raw.includes('）＜') && /【[^】]+】\s*$/.test(raw)) return null;

  // 末尾の【出典】
  const sourceMatch = raw.match(/【([^】]+)】\s*$/);
  const source = (sourceMatch?.[1] ?? '').trim();

  let rest = raw;
  if (sourceMatch) rest = rest.slice(0, sourceMatch.index).trim();

  // 旧フォーマット: 本文（読み）『意味』
  const legacyReadingMeaning = rest.match(/^(.*)（([^（）]{0,120})）『([^』]{0,800})』\s*$/);
  if (legacyReadingMeaning) {
    const quote = (legacyReadingMeaning[1] ?? '').trim();
    const reading = (legacyReadingMeaning[2] ?? '').trim();
    const meaning = (legacyReadingMeaning[3] ?? '').trim();
    if (!quote) return null;
    return { quote, reading, meaning, source };
  }

  // 旧フォーマット: 本文（読み）＜現代語訳＞（すでに変換済み判定に引っかからないケース用）
  const alreadyAngle = rest.match(/^(.*)（([^（）]{0,120})）＜([^＞]{0,800})＞\s*$/);
  if (alreadyAngle) {
    const quote = (alreadyAngle[1] ?? '').trim();
    const reading = (alreadyAngle[2] ?? '').trim();
    const meaning = (alreadyAngle[3] ?? '').trim();
    if (!quote) return null;
    return { quote, reading, meaning, source };
  }

  // 「（現代語訳）」タグ形式: 本文（現代語訳）
  // この場合、本文自体が現代語訳になっているケースが多いので、意味にも同じ文を入れて形式統一する。
  const modernTagMatch = rest.match(/^(.*)（現代語訳）\s*$/);
  if (modernTagMatch) {
    const quote = (modernTagMatch[1] ?? '').trim();
    if (!quote) return null;
    return { quote, reading: '-', meaning: quote, source };
  }

  // 末尾の（意味/現代語訳）
  const meaningMatch = rest.match(/（([^（）]{0,800})）\s*$/);
  const meaning = (meaningMatch?.[1] ?? '').trim();
  if (meaningMatch) rest = rest.slice(0, meaningMatch.index).trim();

  const quote = rest.trim();

  // 最低限: 本文/（意味 or 出典）のどれかが無ければ、変換せずに終える
  if (!quote) return null;
  if (!source && !meaning) return null;

  return { quote, reading: '', meaning, source };
}

function normalizeExample(
  raw: string,
  fallbackReading: string,
  fallbackMeaning: string,
  fallbackSource: string
): string | null {
  const t = (raw || '').trim();
  if (!t) return null;

  // 既に変換済みは触らない
  if (t.includes('）＜') && /【[^】]+】\s*$/.test(t)) return null;

  const parsed = parseExample(t);
  if (!parsed) return null;

  const reading = (parsed.reading || '').trim() || (fallbackReading || '').trim() || '-';
  const meaning =
    (parsed.meaning || '').trim() || (fallbackMeaning || '').trim() || '（現代語訳未設定）';
  const source = (parsed.source || '').trim() || (fallbackSource || '').trim() || '-';

  return `${parsed.quote}（${reading}）＜${meaning}＞【${source}】`;
}

function normalizeFile(filePath: string, dryRun: boolean): { changed: boolean; msg: string } {
  const before = fs.readFileSync(filePath, 'utf-8');
  const parsed = parseCsvToObjects(before);

  if (!parsed.headers.includes('例文1') || !parsed.headers.includes('例文2')) {
    return { changed: false, msg: 'skip（例文列がありません）' };
  }

  let changed = false;
  let changedCells = 0;

  for (const r of parsed.rows) {
    const reading = r['読み'] || '';
    const fallbackMeaning = r['意味'] || '';

    const n1 = normalizeExample(r['例文1'] || '', reading, fallbackMeaning, '-');
    if (n1 && n1 !== r['例文1']) {
      r['例文1'] = n1;
      changed = true;
      changedCells++;
    }

    const n2 = normalizeExample(r['例文2'] || '', reading, fallbackMeaning, '-');
    if (n2 && n2 !== r['例文2']) {
      r['例文2'] = n2;
      changed = true;
      changedCells++;
    }
  }

  if (!changed) return { changed: false, msg: 'no-op' };

  if (dryRun) {
    return { changed: true, msg: `dry-run: ${changedCells} cells` };
  }

  // バックアップ
  const backup = filePath.replace(/\.csv$/i, '.before-examples-format-normalize.csv');
  if (!fs.existsSync(backup)) {
    fs.writeFileSync(backup, before, 'utf-8');
  }

  const after = formatCsv(parsed.headers, parsed.rows);
  fs.writeFileSync(filePath, after, 'utf-8');

  return { changed: true, msg: `ok: ${changedCells} cells（backup: ${path.basename(backup)}）` };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const dryRun = Boolean(args['dry-run']);

  const root = path.join(process.cwd(), 'public/data/classical-japanese');
  const targets = [
    'classical-grammar.csv',
    'classical-vocabulary.csv',
    'classical-knowledge.csv',
    'classical-words.csv',
    'kanbun-words.csv',
    'kanbun-practice.csv',
  ].map((f) => path.join(root, f));

  console.log('=== normalize examples format ===');
  console.log(`root: ${path.relative(process.cwd(), root)}`);
  console.log(`dry-run: ${dryRun}`);

  for (const p of targets) {
    const rel = path.relative(process.cwd(), p);
    if (!fs.existsSync(p)) {
      console.log(`- ${rel}: skip（missing）`);
      continue;
    }
    const res = normalizeFile(p, dryRun);
    console.log(`- ${rel}: ${res.msg}`);
  }

  console.log('\n✅ done');
}

try {
  main();
} catch (e) {
  console.error(`\n❌ エラー: ${String((e as any)?.message || e)}`);
  process.exit(1);
}
