#!/usr/bin/env tsx

/**
 * 漢文CSV（kanbun-words.csv / kanbun-practice.csv）を
 * 古文と同じスキーマ（語句/読み/意味/解説/関連事項/例文1/例文2）へ移行し、
 * 例文を `引用（読み）＜現代語訳＞【出典】` 形式で可能な範囲で自動生成する。
 *
 * 方針:
 * - 元CSVのヘッダ（word/reading/meaning/etymology/...）を古文側に寄せる
 * - etymology 内の「例文:」「例:」パターンから最大2件抽出
 *   - `例文：「吾不レ知」→「吾知らず」（私は知らない）。`
 *   - `例：「読書一」→「書を読む」。`
 * - 抽出できない場合は空のまま
 * - 出典は暫定で【漢文】を付与
 * - 読みは例文に対応する読みが無いことが多いので、暫定で「-」を入れる
 *
 * 使い方:
 *   npx tsx scripts/migrate-kanbun-to-examples.ts
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

type ExtractedExample = {
  quote: string;
  modern: string;
};

function extractKanbunExamples(explanation: string): ExtractedExample[] {
  const text = (explanation || '').trim();
  if (!text) return [];

  const found: ExtractedExample[] = [];

  // 例文/例: 「X」→「Y」（Z）
  const patterns = [
    /例文\s*[:：]\s*「([^」]+)」\s*→\s*「([^」]+)」(?:\s*（([^）]+)）)?/g,
    /例\s*[:：]\s*「([^」]+)」\s*→\s*「([^」]+)」(?:\s*（([^）]+)）)?/g,
  ];

  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      const quote = (m[1] ?? '').trim();
      const arrowTo = (m[2] ?? '').trim();
      const parenthetical = (m[3] ?? '').trim();
      if (!quote) continue;

      const modern = parenthetical || arrowTo;
      if (!modern) continue;

      found.push({ quote, modern });
      if (found.length >= 2) return found;
    }
  }

  return found;
}

function migrateKanbunFile(filePath: string, dryRun: boolean): { changed: boolean; msg: string } {
  const before = fs.readFileSync(filePath, 'utf-8');
  const parsed = parseCsvToObjects(before);

  // 既に古文スキーマならスキップ
  if (
    parsed.headers.includes('語句') &&
    parsed.headers.includes('例文1') &&
    parsed.headers.includes('例文2')
  ) {
    return { changed: false, msg: 'skip（既に古文スキーマ）' };
  }

  // 期待する元ヘッダ
  const required = ['word', 'reading', 'meaning', 'etymology'];
  const ok = required.every((h) => parsed.headers.includes(h));
  if (!ok) {
    return { changed: false, msg: `skip（想定外ヘッダ: ${parsed.headers.join(', ')}）` };
  }

  const headers = ['語句', '読み', '意味', '解説', '関連事項', '例文1', '例文2'];

  let changedRows = 0;

  const rows: CsvRow[] = parsed.rows.map((r) => {
    const word = (r['word'] || '').trim();
    const reading = (r['reading'] || '').trim();
    const meaning = (r['meaning'] || '').trim();
    const etymology = (r['etymology'] || '').trim();
    const relatedFields = (r['relatedFields'] || '').trim();

    const examples = extractKanbunExamples(etymology);
    const ex1 = examples[0] ? `${examples[0].quote}（-）＜${examples[0].modern}＞【漢文】` : '';
    const ex2 = examples[1] ? `${examples[1].quote}（-）＜${examples[1].modern}＞【漢文】` : '';

    if (ex1 || ex2) changedRows++;

    return {
      語句: word,
      読み: reading,
      意味: meaning,
      解説: etymology,
      関連事項: relatedFields,
      例文1: ex1,
      例文2: ex2,
    };
  });

  const after = formatCsv(headers, rows);

  if (dryRun) {
    return { changed: true, msg: `dry-run: ${changedRows} rows had examples` };
  }

  const backup = filePath.replace(/\.csv$/i, '.before-kanbun-migrate.csv');
  if (!fs.existsSync(backup)) {
    fs.writeFileSync(backup, before, 'utf-8');
  }

  fs.writeFileSync(filePath, after, 'utf-8');
  return {
    changed: true,
    msg: `ok: ${changedRows} rows had examples（backup: ${path.basename(backup)}）`,
  };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const dryRun = Boolean(args['dry-run']);

  const root = path.join(process.cwd(), 'public/data/classical-japanese');
  const targets = ['kanbun-words.csv', 'kanbun-practice.csv'].map((f) => path.join(root, f));

  console.log('=== migrate kanbun csv to classical schema ===');
  console.log(`root: ${path.relative(process.cwd(), root)}`);
  console.log(`dry-run: ${dryRun}`);

  for (const p of targets) {
    const rel = path.relative(process.cwd(), p);
    if (!fs.existsSync(p)) {
      console.log(`- ${rel}: skip（missing）`);
      continue;
    }
    const res = migrateKanbunFile(p, dryRun);
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
