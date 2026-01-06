#!/usr/bin/env tsx

/**
 * classical-japanese のJP系CSV（7列）を「例文1/例文2」形式へ移行
 *
 * 変更:
 * - ヘッダ: 時代背景 → 例文1, 種別 → 例文2
 * - 内容: 例文1/例文2 は "例文（意味）【出典】" 形式の雛形を自動投入
 * - 既存の時代背景/種別は、関連事項に `時代:<...>` / `種別:<...>` として退避
 *
 * 使い方:
 *   npx tsx scripts/migrate-classical-japanese-examples.ts
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
    } else {
      args[key] = true;
    }
  }
  return args;
}

function printHelp(): void {
  console.log(`
classical-japanese CSV移行（例文1/例文2）

使い方:
  npx tsx scripts/migrate-classical-japanese-examples.ts

オプション:
  --dry-run   変更内容を表示するだけ（書き込みしない）
  --help      ヘルプ表示
`);
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

function appendTag(raw: string, tag: string): string {
  const base = (raw || '').trim();
  if (!tag.trim()) return base;
  if (base.includes(tag)) return base;
  if (!base) return tag;
  return `${base}|${tag}`;
}

function buildExample(word: string, meaning: string): string {
  const w = (word || '').trim();
  const m = (meaning || '').trim();
  const head = w ? w : '（例文未設定）';
  const mid = m ? m : '（意味未設定）';
  return `${head}（${mid}）【-】`;
}

function migrateFile(filePath: string, dryRun: boolean): { changed: boolean; msg: string } {
  const before = fs.readFileSync(filePath, 'utf-8');
  const parsed = parseCsvToObjects(before);

  const hasEra = parsed.headers.includes('時代背景');
  const hasKind = parsed.headers.includes('種別');
  const already = parsed.headers.includes('例文1') || parsed.headers.includes('例文2');

  if (!hasEra && !hasKind) {
    return { changed: false, msg: 'skip（対象ヘッダなし）' };
  }
  if (already) {
    return { changed: false, msg: 'skip（既に例文ヘッダあり）' };
  }

  const headers = parsed.headers.map((h) => {
    if (h === '時代背景') return '例文1';
    if (h === '種別') return '例文2';
    return h;
  });

  // 期待順に整列（もしヘッダが揃っていれば）
  const preferred = ['語句', '読み', '意味', '解説', '関連事項', '例文1', '例文2'];
  const canReorder = preferred.every((h) => headers.includes(h));
  const finalHeaders = canReorder ? preferred : headers;

  const rows: CsvRow[] = parsed.rows.map((r) => {
    const word = r['語句'] || '';
    const meaning = r['意味'] || '';

    const era = (r['時代背景'] || '').trim();
    const kind = (r['種別'] || '').trim();

    const next: CsvRow = { ...r };

    // 退避タグ
    if (era && era !== '-' && !era.startsWith('時代:')) {
      next['関連事項'] = appendTag(next['関連事項'], `時代:${era}`);
    }
    if (kind && kind !== '-' && !kind.startsWith('種別:')) {
      next['関連事項'] = appendTag(next['関連事項'], `種別:${kind}`);
    }

    // 新例文
    next['例文1'] = buildExample(word, meaning);
    next['例文2'] = buildExample(word, meaning);

    // 旧キーは残してもヘッダ外なので書き出されない（ただし誤用防止のため削除）
    delete next['時代背景'];
    delete next['種別'];

    return next;
  });

  const after = formatCsv(finalHeaders, rows);

  if (dryRun) {
    return {
      changed: true,
      msg: `dry-run: headers ${parsed.headers.join(', ')} -> ${finalHeaders.join(', ')}`,
    };
  }

  // バックアップ
  const backup = filePath.replace(/\.csv$/i, '.before-examples-migration.csv');
  if (!fs.existsSync(backup)) {
    fs.writeFileSync(backup, before, 'utf-8');
  }

  fs.writeFileSync(filePath, after, 'utf-8');
  return { changed: true, msg: `ok（backup: ${path.basename(backup)}）` };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    printHelp();
    process.exit(0);
  }

  const dryRun = Boolean(args['dry-run']);

  const root = path.join(process.cwd(), 'public/data/classical-japanese');
  const targets = [
    'classical-grammar.csv',
    'classical-vocabulary.csv',
    'classical-knowledge.csv',
    'classical-words.csv',
  ].map((f) => path.join(root, f));

  console.log('=== classical-japanese CSV migration ===');
  console.log(`root: ${path.relative(process.cwd(), root)}`);
  console.log(`dry-run: ${dryRun}`);

  for (const p of targets) {
    const rel = path.relative(process.cwd(), p);
    if (!fs.existsSync(p)) {
      console.log(`- ${rel}: skip（missing）`);
      continue;
    }
    const res = migrateFile(p, dryRun);
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
