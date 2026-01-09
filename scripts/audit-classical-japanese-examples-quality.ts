#!/usr/bin/env tsx

/**
 * 古文/漢文データの例文品質を全件監査する（教材向けの厳密チェック）。
 *
 * チェック対象（例文1/例文2）:
 * - 例文フォーマットの厳密性: `引用（読み）＜現代語訳＞【出典】`
 * - 読みの妥当性（ひらがな中心・漢字残り検出）
 * - 文法項目と例文の整合（例: 「き」なのに引用に「き/しか」が無い 等）
 * - 引用（quote）の重複検出（重要度が低い重複を優先的に除去できるようレポート）
 *
 * 使い方:
 *   npx tsx scripts/audit-classical-japanese-examples-quality.ts
 *
 * オプション:
 *   --only file.csv   対象ファイルを1つに限定（相対パス）
 *   --show-duplicates 重複詳細を出す
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

type Args = {
  only?: string;
  showDuplicates?: boolean;
  heuristicTermCheck?: boolean;
  requireKnownSources?: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--show-duplicates') {
      args.showDuplicates = true;
      continue;
    }
    if (a === '--heuristic-term-check') {
      args.heuristicTermCheck = true;
      continue;
    }
    if (a === '--require-known-sources') {
      args.requireKnownSources = true;
      continue;
    }
    if (a === '--only') {
      const v = argv[i + 1];
      if (v && !v.startsWith('--')) {
        args.only = v;
        i++;
      }
      continue;
    }
  }
  return args;
}

function isInvalidSource(source: string, requireKnownSources: boolean): { invalid: boolean; reason?: string } {
  const s = (source || '').trim();
  // 空は parseStrictExample が弾くが、念のため
  if (!s) return { invalid: true, reason: '出典が空' };

  // 出典必須方針: 作例は禁止
  if (s === '作例') return { invalid: true, reason: '作例は禁止（出典必須）' };

  // 段階移行用: “要確認”は厳格モードでのみ NG
  if (requireKnownSources && s === '出典要確認') {
    return { invalid: true, reason: '出典要確認（要手動で典拠確定）' };
  }

  return { invalid: false };
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

function normalizeQuoteForMatch(text: string): string {
  return (text || '')
    .replace(/[\s\u3000]+/g, '')
    .replace(/，/g, '、')
    .replace(/．/g, '。')
    .replace(/[「」『』]/g, '')
    .trim();
}

function looksLikeKanji(str: string): boolean {
  return /[\u3400-\u9FFF]/.test(str);
}

function looksLikeHiraganaOnlyish(str: string): boolean {
  // 記号や長音、句読点は許容しつつ、漢字が混じっていないかを先に見る
  if (looksLikeKanji(str)) return false;
  return /[\u3040-\u309F]/.test(str);
}

function isImportantRow(row: CsvRow): boolean {
  const related = row['関連事項'] ?? '';
  const desc = row['解説'] ?? '';
  const merged = `${related} ${desc}`;
  return merged.includes('最重要') || merged.includes('重要');
}

function getEntryKey(row: CsvRow): string {
  // 古文系はほぼ「語句」。無い場合は他候補へ。
  const candidates = ['語句', '用語', '項目', '見出し', 'ID', '単語'];
  for (const c of candidates) {
    const v = (row[c] ?? '').trim();
    if (v) return v;
  }
  return '';
}

type TermExpectation = {
  term: string;
  quoteMustMatchAny: RegExp[];
  note: string;
};

function buildTermExpectations(): TermExpectation[] {
  const boundary = '(?:$|[、。！？」\s])';
  return [
    {
      term: 'き',
      // 「き」は1文字で誤検出が多いので、終止/連体の「き」または已然形「しか」を明示的に見る
      quoteMustMatchAny: [new RegExp(`き${boundary}`), new RegExp(`しか${boundary}`)],
      note: '過去助動詞「き」は引用文内に「…き」または「…しか」が必要',
    },
    {
      term: 'けり',
      quoteMustMatchAny: [new RegExp(`けり${boundary}`)],
      note: '過去・詠嘆助動詞「けり」は引用文内に「…けり」が必要',
    },
  ];
}

function checkTermQuoteConsistency(term: string, quote: string): { ok: boolean; note?: string } {
  const t = (term || '').trim();
  if (!t) return { ok: true };

  const expectations = buildTermExpectations();
  const exp = expectations.find((e) => e.term === t);
  if (exp) {
    const q = (quote || '').trim();
    const ok = exp.quoteMustMatchAny.some((re) => re.test(q));
    return ok ? { ok: true } : { ok: false, note: exp.note };
  }

  // 既知の“誤読・誤引用が致命的”項目以外は、語句包含の自動判定は誤検出が多い。
  // （例: 概念項目、複合ラベル、1文字語、表記ゆれ等）
  return { ok: true };
}

type ExampleOccurrence = {
  file: string;
  csvLine: number;
  entryKey: string;
  exampleKey: string;
  important: boolean;
  quote: string;
  reading: string;
  source: string;
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const root = process.cwd();
  const defaultTargets = [
    'public/data/classical-japanese/classical-grammar.csv',
    'public/data/classical-japanese/classical-vocabulary.csv',
    'public/data/classical-japanese/classical-knowledge.csv',
    'public/data/classical-japanese/classical-words.csv',
    'public/data/classical-japanese/kanbun-words.csv',
    'public/data/classical-japanese/kanbun-practice.csv',
  ];

  const targetRelPaths = args.only ? [args.only] : defaultTargets;
  const targets = targetRelPaths.map((p) => path.join(root, p));

  let totalCells = 0;
  let strictParseFailed = 0;
  let readingSuspicious = 0;
  let criticalTermMismatch = 0;
  let heuristicTermMismatch = 0;
  let invalidSourceCount = 0;

  const occurrences: ExampleOccurrence[] = [];

  for (const filePath of targets) {
    const rel = path.relative(root, filePath);
    if (!fs.existsSync(filePath)) {
      console.warn(`[warn] not found: ${rel}`);
      continue;
    }

    const before = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseCsvToObjects(before);

    const hasExample1 = parsed.headers.includes('例文1');
    const hasExample2 = parsed.headers.includes('例文2');
    if (!hasExample1 && !hasExample2) continue;

    for (let i = 0; i < parsed.rows.length; i++) {
      const row = parsed.rows[i];
      const csvLine = i + 2;
      const entryKey = getEntryKey(row);
      const important = isImportantRow(row);

      for (const exampleKey of ['例文1', '例文2']) {
        const cell = (row[exampleKey] ?? '').trim();
        if (!cell) continue;
        totalCells++;

        const ex = parseStrictExample(cell);
        if (!ex) {
          strictParseFailed++;
          console.log(`[format] ${rel}:${csvLine}:${exampleKey} entry=${entryKey}`);
          continue;
        }

        const srcCheck = isInvalidSource(ex.source, !!args.requireKnownSources);
        if (srcCheck.invalid) {
          invalidSourceCount++;
          console.log(
            `[source] ${rel}:${csvLine}:${exampleKey} entry=${entryKey} source=${ex.source || '(empty)'} reason=${srcCheck.reason}`,
          );
          console.log(`        quote=${ex.quote}`);
        }

        // 読みはひらがな中心であることを期待（記号は許容）
        if (!looksLikeHiraganaOnlyish(ex.reading)) {
          readingSuspicious++;
          console.log(`[reading] ${rel}:${csvLine}:${exampleKey} entry=${entryKey} reading=${ex.reading}`);
        }

        // 致命度が高い項目（き/けり等）のみ、デフォルトで厳密に確認
        if (rel.includes('public/data/classical-japanese/classical-')) {
          const term = (row['語句'] ?? '').trim();
          const chk = checkTermQuoteConsistency(term, ex.quote);
          if (!chk.ok) {
            criticalTermMismatch++;
            console.log(`[term-critical] ${rel}:${csvLine}:${exampleKey} term=${term} entry=${entryKey} note=${chk.note ?? ''}`);
            console.log(`             quote=${ex.quote}`);
          }

          // 語句包含の機械判定は誤検出が多いので、明示オプション時のみ実行
          if (args.heuristicTermCheck) {
            const t = term;
            if (t.length >= 2 || /[\u3400-\u9FFF]/.test(t)) {
              const ok = ex.quote.includes(t);
              if (!ok) {
                heuristicTermMismatch++;
              }
            }
          }
        }

        occurrences.push({
          file: rel,
          csvLine,
          entryKey,
          exampleKey,
          important,
          quote: ex.quote,
          reading: ex.reading,
          source: ex.source,
        });
      }
    }
  }

  // 重複引用の検出
  const byQuote = new Map<string, ExampleOccurrence[]>();
  for (const occ of occurrences) {
    const key = normalizeQuoteForMatch(occ.quote);
    if (!key) continue;
    const arr = byQuote.get(key) ?? [];
    arr.push(occ);
    byQuote.set(key, arr);
  }

  const duplicates = [...byQuote.entries()]
    .map(([k, v]) => ({ key: k, occ: v }))
    .filter((d) => d.occ.length >= 2)
    .sort((a, b) => b.occ.length - a.occ.length);

  const lowImportanceDuplicates = duplicates.filter((d) => d.occ.every((o) => !o.important));

  console.log('---');
  console.log(`targets: ${targetRelPaths.length}`);
  console.log(`example cells scanned: ${totalCells}`);
  console.log(`strict format failures: ${strictParseFailed}`);
  console.log(`suspicious readings: ${readingSuspicious}`);
  console.log(`invalid sources: ${invalidSourceCount}${args.requireKnownSources ? ' (known sources required)' : ''}`);
  console.log(`critical term/example mismatches: ${criticalTermMismatch}`);
  if (args.heuristicTermCheck) {
    console.log(`heuristic term/example mismatches (count only): ${heuristicTermMismatch}`);
  }
  console.log(`duplicate quotes: ${duplicates.length}`);
  console.log(`duplicate quotes (all low-importance): ${lowImportanceDuplicates.length}`);

  if (args.showDuplicates && duplicates.length > 0) {
    console.log('---');
    console.log('top duplicate quotes:');
    for (const d of duplicates.slice(0, 20)) {
      const sample = d.occ[0];
      console.log(`- count=${d.occ.length} quote=${sample.quote}`);
      for (const o of d.occ.slice(0, 6)) {
        console.log(`  - ${o.file}:${o.csvLine}:${o.exampleKey} entry=${o.entryKey}`);
      }
      if (d.occ.length > 6) console.log('  - ...');
    }
  }

  // 失敗があれば CI/ガードで止められるように exit code を立てる
  const hasProblems = strictParseFailed > 0 || readingSuspicious > 0 || invalidSourceCount > 0 || criticalTermMismatch > 0;
  if (hasProblems) process.exitCode = 2;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
