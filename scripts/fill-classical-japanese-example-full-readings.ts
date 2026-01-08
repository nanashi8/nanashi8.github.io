#!/usr/bin/env tsx

/**
 * classical-japanese CSV の例文1/例文2に含まれる「読み」を、引用文の全文読みで機械生成して埋める。
 * 例文フォーマット: `引用（読み）＜現代語訳＞【出典】`
 *
 * 使い方:
 *   npx tsx scripts/fill-classical-japanese-example-full-readings.ts
 *
 * オプション:
 *   --dry-run   書き込みせず件数だけ表示
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

function parseStrictExample(text: string): ParsedExample | null {
  const raw = (text || '').trim();
  if (!raw) return null;
  const m = raw.match(/^(.+)（([^（）]+)）＜([^＞]+)＞【([^】]+)】\s*$/);
  if (!m) return null;
  const quote = (m[1] ?? '').trim();
  const reading = (m[2] ?? '').trim();
  const meaning = (m[3] ?? '').trim();
  const source = (m[4] ?? '').trim();
  if (!quote || !meaning || !source) return null;
  return { quote, reading, meaning, source };
}

function formatExample(ex: ParsedExample): string {
  return `${ex.quote}（${ex.reading}）＜${ex.meaning}＞【${ex.source}】`;
}

function looksLikeKanji(str: string): boolean {
  return /[\u3400-\u9FFF]/.test(str);
}

async function createReadingGenerator(): Promise<(text: string) => Promise<string>> {
  const { default: Kuroshiro } = await import('kuroshiro');
  const { default: KuromojiAnalyzer } = await import('kuroshiro-analyzer-kuromoji');

  const kuroshiro = new Kuroshiro();
  await kuroshiro.init(new KuromojiAnalyzer());

  return async (text: string) => {
    const raw = (text || '').trim();
    if (!raw) return '';

    const converted = await kuroshiro.convert(raw, {
      to: 'hiragana',
      mode: 'normal',
    });

    const cleaned = String(converted)
      .replace(/\s+/g, '')
      .replace(/（/g, '(')
      .replace(/）/g, ')')
      .replace(/\(/g, '（')
      .replace(/\)/g, '）');

    return cleaned;
  };
}

function isKanbunSource(source: string): boolean {
  const s = (source || '').trim();
  if (!s) return false;
  if (s === '漢文') return true;
  return s.includes('漢文');
}

function preprocessReadingTargetText(text: string): string {
  const raw = (text || '').trim();
  if (!raw) return '';
  // kuromoji が読めず漢字が残りやすい古文/漢文混じり表現の最小救済
  // 例: 「…旅人也」→「…旅人なり」
  return raw.replace(/也/g, 'なり');
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const dryRun = args['dry-run'] === true;

  const root = process.cwd();
  const targets = [
    'public/data/classical-japanese/classical-grammar.csv',
    'public/data/classical-japanese/classical-vocabulary.csv',
    'public/data/classical-japanese/classical-knowledge.csv',
    'public/data/classical-japanese/classical-words.csv',
    'public/data/classical-japanese/kanbun-words.csv',
    'public/data/classical-japanese/kanbun-practice.csv',
  ].map((p) => path.join(root, p));

  const toReading = await createReadingGenerator();

  let totalCells = 0;
  let updatedCells = 0;
  let parseFailedCells = 0;
  let generationFailedCells = 0;

  for (const filePath of targets) {
    const before = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseCsvToObjects(before);

    const hasExample1 = parsed.headers.includes('例文1');
    const hasExample2 = parsed.headers.includes('例文2');
    if (!hasExample1 && !hasExample2) continue;

    let fileUpdated = 0;

    for (const row of parsed.rows) {
      const exampleKeys = ['例文1', '例文2'];
      for (const key of exampleKeys) {
        const cell = (row[key] ?? '').trim();
        if (!cell) continue;

        totalCells++;

        const ex = parseStrictExample(cell);
        if (!ex) {
          parseFailedCells++;
          continue;
        }

        const readingTarget = isKanbunSource(ex.source) ? ex.meaning : ex.quote;
        const normalizedTarget = preprocessReadingTargetText(readingTarget);

        const nextReading = await toReading(normalizedTarget);
        if (!nextReading || looksLikeKanji(nextReading)) {
          generationFailedCells++;
          continue;
        }

        if (ex.reading !== nextReading) {
          ex.reading = nextReading;
          row[key] = formatExample(ex);
          updatedCells++;
          fileUpdated++;
        }
      }
    }

    if (fileUpdated === 0) continue;

    const after = formatCsv(parsed.headers, parsed.rows);
    if (dryRun) {
      console.log(`[dry-run] ${path.relative(root, filePath)}: would update ${fileUpdated} cells`);
      continue;
    }

    fs.writeFileSync(filePath, after, 'utf-8');
    console.log(`${path.relative(root, filePath)}: updated ${fileUpdated} cells`);
  }

  console.log('---');
  console.log(`total example cells scanned: ${totalCells}`);
  console.log(`updated cells: ${updatedCells}`);
  console.log(`parse failed cells: ${parseFailedCells}`);
  console.log(`reading generation failed cells: ${generationFailedCells}`);

  if (parseFailedCells > 0) {
    process.exitCode = 2;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
