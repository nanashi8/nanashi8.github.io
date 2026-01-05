#!/usr/bin/env tsx

/**
 * 社会科CSVの値内カンマを除去して列ズレを解消する修復スクリプト
 *
 * 問題：
 * - 「3,780km」のような数値内のカンマがCSV区切りカンマと解釈され列ズレが起きる
 * - アプリ側は単純な split(',') を使っているため、RFC 4180的な引用符エスケープに対応していない
 *
 * 修復方針：
 * - 値内カンマを除去（例：3,780 → 3780）
 * - 列数が不足している行は空文字列で補完
 * - バックアップを作成してから上書き
 *
 * 使い方:
 *   npx tsx scripts/fix-social-studies-csv-commas.ts \
 *     --input public/data/social-studies/all-social-studies.csv
 */

import * as fs from 'fs';
import * as path from 'path';

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
社会科CSV修復ツール - 値内カンマを除去して列ズレを解消

使い方:
  npx tsx scripts/fix-social-studies-csv-commas.ts --input <csvPath>

オプション:
  --input <path>   対象CSV（必須）
  --dry-run        実際には書き込まず、プレビューのみ
  --backup         バックアップを作成（既定: true）
`);
}

/**
 * RFC 4180風の簡易CSVパーサ（引用符サポート）
 */
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

/**
 * 値内カンマを除去（数値のカンマ区切りを除去）
 */
function removeInnerCommas(text: string): string {
  // 数値内のカンマを除去（例：3,780 → 3780）
  // パターン: 数字+カンマ+数字 を 数字のみに
  return text.replace(/(\d),(\d)/g, '$1$2');
}

/**
 * CSVテーブルを文字列に変換（引用符エスケープなし、単純join）
 */
function formatCsvSimple(table: string[][]): string {
  return table.map((row) => row.map((cell) => cell.trim()).join(',')).join('\n') + '\n';
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || args.h || !args.input) {
    printHelp();
    process.exit(args.help || args.h ? 0 : 1);
  }

  const input = String(args.input);
  const dryRun = Boolean(args['dry-run']);
  const backup = args.backup !== false; // デフォルトtrue

  const inputPath = path.isAbsolute(input) ? input : path.join(process.cwd(), input);
  if (!fs.existsSync(inputPath)) {
    throw new Error(`input が存在しません: ${inputPath}`);
  }

  console.log(`\n=== 社会科CSV修復 ===`);
  console.log(`input: ${path.relative(process.cwd(), inputPath)}`);
  console.log(`dry-run: ${dryRun}`);

  const csvText = fs.readFileSync(inputPath, 'utf-8');
  const table = parseCsvText(csvText);

  if (table.length < 2) {
    throw new Error('CSVの行数が不足しています（ヘッダ+1行以上が必要）');
  }

  const headers = table[0];
  const expectedCols = headers.length;

  console.log(`headers: ${headers.join(', ')}`);
  console.log(`expected columns: ${expectedCols}`);
  console.log(`total rows (inc. header): ${table.length}`);

  let fixedCount = 0;
  const fixedTable: string[][] = [headers];

  for (let i = 1; i < table.length; i++) {
    const row = table[i];
    const fixed: string[] = [];

    for (let j = 0; j < expectedCols; j++) {
      const cell = row[j] ?? '';
      // 値内カンマを除去
      const cleaned = removeInnerCommas(cell);
      fixed.push(cleaned);
    }

    // 列数が不足している場合は空で補完
    while (fixed.length < expectedCols) {
      fixed.push('');
    }

    // 変更があったかチェック
    const changed = row.join('|') !== fixed.join('|');
    if (changed) {
      fixedCount++;
      if (fixedCount <= 10) {
        console.log(`\n[修復 ${fixedCount}] line ${i + 1}`);
        console.log(`  before: ${row.slice(0, 5).join(' | ')}`);
        console.log(`  after:  ${fixed.slice(0, 5).join(' | ')}`);
      }
    }

    fixedTable.push(fixed);
  }

  console.log(`\n修復行数: ${fixedCount} / ${table.length - 1}`);

  if (dryRun) {
    console.log('\n※ dry-run モードのため、ファイルは更新されません');
    return;
  }

  if (backup) {
    const backupPath = inputPath.replace(/\.csv$/, '.before-fix.csv');
    fs.writeFileSync(backupPath, csvText, 'utf-8');
    console.log(`\nバックアップ作成: ${path.relative(process.cwd(), backupPath)}`);
  }

  const fixedCsv = formatCsvSimple(fixedTable);
  fs.writeFileSync(inputPath, fixedCsv, 'utf-8');

  console.log(`\n✅ 修復完了: ${path.relative(process.cwd(), inputPath)}`);
}

try {
  main();
} catch (e) {
  console.error(`\n❌ エラー: ${String((e as any)?.message || e)}`);
  printHelp();
  process.exit(1);
}
