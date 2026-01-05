#!/usr/bin/env tsx

/**
 * 社会科CSV（public/data/social-studies/*.csv）のカバレッジ監査ツール
 *
 * 目的:
 * - 関連分野/学年/出題元の分布を集計し、データが「単元別網羅」を主張できる状態かを点検する
 * - 関連分野の不正値（ノイズ）を検出して、単元別の検証が可能な状態に近づける
 * - 任意で「単元（ユーザー定義）」の必須語句リストに対する充足率を算出する
 *
 * 使い方:
 *   npx tsx scripts/audit-social-studies-coverage.ts \
 *     --input public/data/social-studies/all-social-studies.csv
 *
 *   npx tsx scripts/audit-social-studies-coverage.ts \
 *     --input public/data/social-studies/all-social-studies.csv \
 *     --units scripts/social-studies-units.example.json
 */

import * as fs from 'fs';
import * as path from 'path';

type CsvRow = Record<string, string>;

type UnitSpec = {
  id: string;
  label: string;
  requiredTerms: string[];
};

type UnitsFile = {
  units: UnitSpec[];
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
社会科CSVのカバレッジ監査ツール

使い方:
  npx tsx scripts/audit-social-studies-coverage.ts --input <csvPath> [--units <unitsJson>]

オプション:
  --input <path>  対象CSV（既定: public/data/social-studies/all-social-studies.csv）
  --units <path>  単元（ユーザー定義）ごとの必須語句リスト（JSON）
  --top <N>       上位N件だけ表示（既定: 25）

units JSON 形式:
{
  "units": [
    {
      "id": "history-ancient-1",
      "label": "（例）歴史：古代 その1",
      "requiredTerms": ["縄文時代", "弥生時代"]
    }
  ]
}
`);
}

function parseCsvText(csvText: string): string[][] {
  // RFC 4180の最低限（引用符・改行・カンマ）を扱う簡易パーサ
  // ただし、データに値内カンマ（3,780など）が混ざる可能性があるため
  // パース後に数値内カンマを除去する後処理を追加
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

  // 値内カンマを除去（数値内のカンマ区切りを除去: 3,780 → 3780）
  return rows.map(row =>
    row.map(cell => cell.replace(/(\d),(\d)/g, '$1$2'))
  );
}

function parseCsvToObjects(csvText: string): { headers: string[]; rows: CsvRow[] } {
  const table = parseCsvText(csvText);
  if (table.length < 2) {
    throw new Error('CSVの行数が不足しています（ヘッダ+1行以上が必要）');
  }

  const headers = table[0].map((h) => h.trim());
  const rows: CsvRow[] = [];

  for (const r of table.slice(1)) {
    const row: CsvRow = {};
    headers.forEach((h, idx) => {
      // 空文字列もそのまま保持（列ズレ防止）
      row[h] = (r[idx] ?? '').trim();
    });
    rows.push(row);
  }

  return { headers, rows };
}

function splitPipeList(raw: string): string[] {
  return raw
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitGrades(raw: string): string[] {
  // 推奨は 1|2|3 だが、互換として 1,2 も許容
  return raw
    .split(/[|,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function padRight(s: string, n: number): string {
  if (s.length >= n) return s;
  return s + ' '.repeat(n - s.length);
}

function sortByValueDesc<T extends Record<string, number>>(obj: T): Array<[string, number]> {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]);
}

function loadUnits(unitsPath: string): UnitsFile {
  const raw = fs.readFileSync(unitsPath, 'utf-8');
  const parsed = JSON.parse(raw) as UnitsFile;
  if (!parsed || !Array.isArray(parsed.units)) {
    throw new Error('units JSON の形式が不正です（units: [] が必要）');
  }
  for (const u of parsed.units) {
    if (!u || typeof u.id !== 'string' || typeof u.label !== 'string' || !Array.isArray(u.requiredTerms)) {
      throw new Error('units JSON の unit 要素が不正です（id,label,requiredTerms が必要）');
    }
  }
  return parsed;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    printHelp();
    process.exit(0);
  }

  const input = String(
    args.input || 'public/data/social-studies/all-social-studies.csv'
  );

  const topN = (() => {
    const raw = args.top;
    if (raw == null || raw === true) return 25;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 25;
  })();

  const inputPath = path.isAbsolute(input) ? input : path.join(process.cwd(), input);
  if (!fs.existsSync(inputPath)) {
    throw new Error(`input が存在しません: ${inputPath}`);
  }

  const csvText = fs.readFileSync(inputPath, 'utf-8');
  const { headers, rows } = parseCsvToObjects(csvText);

  const termKey = headers.includes('語句') ? '語句' : headers.includes('term') ? 'term' : '';
  const relatedKey = headers.includes('関連分野') ? '関連分野' : headers.includes('category') ? 'category' : '';
  const gradeKey = headers.includes('grade') ? 'grade' : '';
  const sourceKey = headers.includes('source') ? 'source' : '';

  if (!termKey || !relatedKey) {
    throw new Error(
      `必要な列が見つかりません（語句/関連分野）。headers=${headers.join(',')}`
    );
  }

  // src/types/socialStudies.ts の SocialStudiesField に合わせる
  const allowedRelatedFields = new Set([
    '歴史-古代',
    '歴史-中世',
    '歴史-近世',
    '歴史-近代',
    '歴史-現代',
    '地理-日本',
    '地理-世界',
    '地理-産業',
    '地理-環境',
    '公民-政治',
    '公民-経済',
    '公民-国際',
    '公民-人権',
  ]);

  const byRelated: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  const gradeMembership: Record<string, number> = { '1': 0, '2': 0, '3': 0 };

  let missingRelated = 0;
  let missingGrade = 0;

  const invalidRelatedCounts: Record<string, number> = {};
  const invalidRelatedSamples: Record<string, string[]> = {};

  const termSet = new Set<string>();

  for (const r of rows) {
    const term = (r[termKey] || '').trim();
    if (term) termSet.add(term);

    const relatedRaw = (r[relatedKey] || '').trim();
    const related = relatedRaw ? splitPipeList(relatedRaw) : [];

    if (related.length === 0) {
      missingRelated++;
    } else {
      for (const f of related) {
        byRelated[f] = (byRelated[f] || 0) + 1;
        if (!allowedRelatedFields.has(f)) {
          invalidRelatedCounts[f] = (invalidRelatedCounts[f] || 0) + 1;
          if (!invalidRelatedSamples[f]) invalidRelatedSamples[f] = [];
          if (invalidRelatedSamples[f].length < 5 && term) invalidRelatedSamples[f].push(term);
        }
      }
    }

    const srcRaw = sourceKey ? (r[sourceKey] || '').trim() : '';
    const src = srcRaw || 'unknown';
    bySource[src] = (bySource[src] || 0) + 1;

    const gradeRaw = gradeKey ? (r[gradeKey] || '').trim() : '';
    const grades = gradeRaw ? splitGrades(gradeRaw) : [];
    if (gradeKey && grades.length === 0) {
      missingGrade++;
    }
    for (const g of grades) {
      if (g === '1' || g === '2' || g === '3') {
        gradeMembership[g] = (gradeMembership[g] || 0) + 1;
      }
    }
  }

  console.log(`\n=== 社会科カバレッジ監査 ===`);
  console.log(`input: ${path.relative(process.cwd(), inputPath)}`);
  console.log(`rows: ${rows.length}`);

  console.log(`\n--- 出題元（source）分布 ---`);
  for (const [k, v] of sortByValueDesc(bySource).slice(0, topN)) {
    console.log(`${padRight(k, 16)} ${v}`);
  }

  console.log(`\n--- 学年（grade）会員数（重複カウント） ---`);
  console.log(`grade=1: ${gradeMembership['1']}`);
  console.log(`grade=2: ${gradeMembership['2']}`);
  console.log(`grade=3: ${gradeMembership['3']}`);
  if (gradeKey) {
    console.log(`missing grade: ${missingGrade}`);
  } else {
    console.log(`grade列なし（このCSVは学年メタが未付与の可能性）`);
  }

  console.log(`\n--- 関連分野（relatedFields）分布 ---`);
  const relatedSorted = sortByValueDesc(byRelated);
  console.log(`unique relatedFields: ${relatedSorted.length}`);
  for (const [k, v] of relatedSorted.slice(0, topN)) {
    console.log(`${padRight(k, 16)} ${v}`);
  }
  console.log(`missing relatedFields: ${missingRelated}`);

  const invalidSorted = sortByValueDesc(invalidRelatedCounts);
  let hasQualityIssues = false;

  if (invalidSorted.length > 0) {
    console.log(`\n--- ⚠️ 不正な関連分野（ノイズ） ---`);
    console.log(`invalid relatedFields: ${invalidSorted.length}種類`);
    for (const [k, v] of invalidSorted.slice(0, topN)) {
      const samples = invalidRelatedSamples[k]?.join(' / ') || '';
      console.log(`${padRight(k, 24)} ${padRight(String(v), 6)} sample: ${samples}`);
    }
    console.log(`\n※ 不正値が残っていると「単元別の網羅チェック」が困難になります。`);
    hasQualityIssues = true;
  }

  const unitsPath = typeof args.units === 'string' ? String(args.units) : '';
  if (unitsPath) {
    const full = path.isAbsolute(unitsPath) ? unitsPath : path.join(process.cwd(), unitsPath);
    if (!fs.existsSync(full)) {
      throw new Error(`units が存在しません: ${full}`);
    }

    const units = loadUnits(full);
    console.log(`\n=== 単元（ユーザー定義）カバレッジ ===`);
    console.log(`units: ${units.units.length}`);

    let allRequired = 0;
    let allPresent = 0;

    for (const u of units.units) {
      const required = u.requiredTerms || [];
      const missing: string[] = [];
      let present = 0;
      for (const t of required) {
        allRequired++;
        if (termSet.has(t)) {
          present++;
          allPresent++;
        } else {
          missing.push(t);
        }
      }

      const pct = required.length === 0 ? 100 : Math.round((present / required.length) * 100);
      const badge = pct === 100 ? 'OK' : pct >= 80 ? 'WARN' : 'NG';
      console.log(`\n[${badge}] ${u.label} (${u.id})`);
      console.log(`  required: ${required.length}, present: ${present}, missing: ${missing.length}, coverage: ${pct}%`);
      if (missing.length > 0) {
        const show = missing.slice(0, 30);
        console.log(`  missingTerms (top ${show.length}): ${show.join(' / ')}`);
        if (missing.length > show.length) {
          console.log(`  ... and ${missing.length - show.length} more`);
        }
      }
    }

    const overall = allRequired === 0 ? 100 : Math.round((allPresent / allRequired) * 100);
    console.log(`\n--- 総合 ---`);
    console.log(`required: ${allRequired}, present: ${allPresent}, coverage: ${overall}%`);
  }

  // CI環境で品質問題が検出された場合は exit 1
  if (hasQualityIssues) {
    console.error(`\n❌ データ品質問題が検出されました。不正な関連分野を修正してください。`);
    process.exit(1);
  }
}

try {
  main();
} catch (e) {
  console.error(String((e as any)?.message || e));
  printHelp();
  process.exit(1);
}
