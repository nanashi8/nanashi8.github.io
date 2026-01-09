#!/usr/bin/env tsx

/**
 * 機械生成した古文/漢文の例文「読み」に対し、教材として誤読が致命的なパターンを優先読みで上書きする。
 *
 * 例文フォーマット: `引用（読み）＜現代語訳＞【出典】`
 *
 * 使い方:
 *   npx tsx scripts/override-classical-japanese-example-readings.ts
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

type ParsedExample = {
  quote: string;
  reading: string;
  meaning: string;
  source: string;
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

function normalizeQuoteForMatch(text: string): string {
  return (text || '')
    .replace(/[\s\u3000]+/g, '')
    .replace(/，/g, '、')
    .replace(/．/g, '。')
    .trim();
}

type OverrideResult = {
  nextReading: string;
  reason: string;
} | null;

function applyOverrides(ex: ParsedExample): OverrideResult {
  const qNorm = normalizeQuoteForMatch(ex.quote);

  // 1) 徒然草 冒頭: 「日暮らし」は通常「ひぐらし」。
  //    機械生成では「にちくらし」になりがちなので、読み文字列内の該当部分を確実に置換。
  if (qNorm.includes('日暮らし') && ex.reading.includes('にちくらし')) {
    return {
      nextReading: ex.reading.replace(/にちくらし/g, 'ひぐらし'),
      reason: '日暮らし: にちくらし→ひぐらし',
    };
  }

  // 2) 源氏物語 冒頭: 「御時」を「ごとき」と誤読するケースが多い。
  //    教材用途なので、代表的引用は引用全体に対し読みを固定。
  if (qNorm === 'いづれの御時にか') {
    return {
      nextReading: 'いづれのおほむときにか',
      reason: '御時: ごとき誤読の上書き（短文）',
    };
  }

  // 長文（女御・更衣が続く）
  if (qNorm.startsWith('いづれの御時にか') && qNorm.includes('女御') && qNorm.includes('更衣')) {
    return {
      nextReading:
        'いづれのおほむときにか、にょうご、こういあまたさぶらひたまひけるなかに、いとやむごとなききはにはあらぬが、すぐれてときめきたまふありけり。',
      reason: '御時/候ひ給ふ 等を含む典型誤読の上書き（源氏冒頭）',
    };
  }

  return null;
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

  let totalCells = 0;
  let updatedCells = 0;
  let parseFailedCells = 0;
  const reasonCounts = new Map<string, number>();

  for (const filePath of targets) {
    const before = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseCsvToObjects(before);

    const hasExample1 = parsed.headers.includes('例文1');
    const hasExample2 = parsed.headers.includes('例文2');
    if (!hasExample1 && !hasExample2) continue;

    let fileUpdated = 0;

    for (const row of parsed.rows) {
      for (const key of ['例文1', '例文2']) {
        const cell = (row[key] ?? '').trim();
        if (!cell) continue;

        totalCells++;

        const ex = parseStrictExample(cell);
        if (!ex) {
          parseFailedCells++;
          continue;
        }

        const override = applyOverrides(ex);
        if (!override) continue;

        if (ex.reading !== override.nextReading) {
          ex.reading = override.nextReading;
          row[key] = formatExample(ex);
          updatedCells++;
          fileUpdated++;
          reasonCounts.set(override.reason, (reasonCounts.get(override.reason) ?? 0) + 1);
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
  if (reasonCounts.size > 0) {
    console.log('override reasons:');
    for (const [reason, count] of [...reasonCounts.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`- ${reason}: ${count}`);
    }
  }

  if (parseFailedCells > 0) {
    process.exitCode = 2;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
