#!/usr/bin/env tsx

/**
 * 高校受験向け（スマホで読みやすいA5）古文・漢文「総まとめ」PDFを生成
 *
 * 方針:
 * - public/data/classical-japanese/*.csv を全て読み込み
 * - 重要（最重要/最頻出など）をカードで大きく、全文は付録の一覧で落とさない
 * - HTML（印刷CSS）を生成し、PlaywrightでPDF化
 *
 * 使い方:
 *   npx tsx scripts/generate-classical-japanese-pdf.ts
 *
 * 出力:
 *   public/data/classical-japanese/print/classical-japanese-a5.html
 *   public/data/classical-japanese/print/classical-japanese-a5.pdf
 */

import * as fs from 'fs';
import * as path from 'path';
import { chromium } from '@playwright/test';

type CsvRow = Record<string, string>;

type Deck = {
  id: string;
  title: string;
  sourcePath: string;
  rows: CsvRow[];
  header: string[];
  schema: 'jp7' | 'en7';
};

type NormalizedItem = {
  deckId: string;
  deckTitle: string;
  word: string;
  reading: string;
  meaning: string;
  explanation: string;
  related: string;
  example1: string;
  example2: string;
  era: string;
  kind: string;
  difficulty: string;
  source: string;
};

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function splitPipeList(raw: string): string[] {
  return raw
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
}

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
古典（高校受験）A5 PDFジェネレータ

使い方:
  npx tsx scripts/generate-classical-japanese-pdf.ts

オプション:
  --out <dir>     出力先ディレクトリ（既定: public/data/classical-japanese/print）
  --only <id>     deckIdのみ生成（例: grammar, vocabulary, knowledge, words, kanbun-practice, kanbun-words）
  --no-pdf        HTMLのみ出力（PDF生成をスキップ）
  --help          ヘルプ表示
`);
}

/**
 * RFC 4180の最低限（引用符・改行・カンマ）を扱う簡易CSVパーサ
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

function parseCsvToObjects(csvText: string): { headers: string[]; rows: CsvRow[] } {
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

function detectSchema(headers: string[]): 'jp7' | 'en7' {
  if (headers.includes('語句')) return 'jp7';
  return 'en7';
}

function loadDecks(rootDir: string): Deck[] {
  const sources: Array<{ id: string; title: string; file: string }> = [
    { id: 'grammar', title: '古文：文法・敬語・助動詞', file: 'classical-grammar.csv' },
    { id: 'vocabulary', title: '古文：重要語彙（表現）', file: 'classical-vocabulary.csv' },
    { id: 'knowledge', title: '古文：古典常識（作品・名文）', file: 'classical-knowledge.csv' },
    { id: 'words', title: '古文：単語（総覧）', file: 'classical-words.csv' },
    { id: 'kanbun-practice', title: '漢文：句形・演習', file: 'kanbun-practice.csv' },
    { id: 'kanbun-words', title: '漢文：重要語・句形（総覧）', file: 'kanbun-words.csv' },
  ];

  return sources.map((s) => {
    const full = path.join(rootDir, s.file);
    if (!fs.existsSync(full)) {
      throw new Error(`CSVが見つかりません: ${full}`);
    }

    const csvText = fs.readFileSync(full, 'utf-8');
    const parsed = parseCsvToObjects(csvText);
    const schema = detectSchema(parsed.headers);
    return {
      id: s.id,
      title: s.title,
      sourcePath: full,
      rows: parsed.rows,
      header: parsed.headers,
      schema,
    };
  });
}

function normalizeRow(deck: Deck, row: CsvRow): NormalizedItem {
  if (deck.schema === 'jp7') {
    return {
      deckId: deck.id,
      deckTitle: deck.title,
      word: row['語句'] || '',
      reading: row['読み'] || '',
      meaning: row['意味'] || '',
      explanation: row['解説'] || '',
      related: row['関連事項'] || '',
      example1: row['例文1'] || '',
      example2: row['例文2'] || '',
      era: '',
      kind: '',
      difficulty: '',
      source: '',
    };
  }

  return {
    deckId: deck.id,
    deckTitle: deck.title,
    word: row['word'] || '',
    reading: row['reading'] || '',
    meaning: row['meaning'] || '',
    explanation: row['etymology'] || '',
    related: row['relatedFields'] || '',
    example1: '',
    example2: '',
    era: '',
    kind: row['source'] || row['relatedFields'] || '',
    difficulty: row['difficulty'] || '',
    source: row['source'] || '',
  };
}

function extractMetaFromRelated(related: string): { era?: string; kind?: string } {
  const tags = splitPipeList(related);
  const out: { era?: string; kind?: string } = {};
  for (const t of tags) {
    if (!out.era && t.startsWith('時代:')) out.era = t.slice('時代:'.length).trim();
    if (!out.kind && t.startsWith('種別:')) out.kind = t.slice('種別:'.length).trim();
  }
  return out;
}

function isImportant(item: NormalizedItem): boolean {
  const tags = splitPipeList(item.related);
  const joined = `${item.related} ${item.kind} ${item.explanation}`;
  if (tags.some((t) => ['最重要', '最頻出', '頻出', '超頻出'].includes(t))) return true;
  if (/最重要|最頻出|頻出/.test(joined)) return true;
  if (item.deckId === 'grammar' && /助動詞|敬語|助詞/.test(joined)) return true;
  if (
    item.deckId.startsWith('kanbun') &&
    /返り点|再読文字|否定|疑問|反語|使役|受身|禁止/.test(item.related)
  )
    return true;
  return false;
}

function classifyBadge(item: NormalizedItem): string {
  const joined = `${item.related} ${item.explanation}`;
  if (/最重要/.test(joined)) return '最重要';
  if (/最頻出/.test(joined)) return '最頻出';
  if (/頻出/.test(joined)) return '頻出';
  return '';
}

function renderTags(raw: string): string {
  const tags = splitPipeList(raw);
  if (tags.length === 0) return '';
  return `<div class="tags">${tags
    .slice(0, 8)
    .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
    .join('')}</div>`;
}

function renderCard(item: NormalizedItem, mode: 'hero' | 'compact'): string {
  const badge = classifyBadge(item);
  const hasBadge = Boolean(badge);

  const inferred = extractMetaFromRelated(item.related);

  const metaParts: string[] = [];
  if (item.era || inferred.era) metaParts.push(item.era || inferred.era || '');
  if (item.kind || inferred.kind) metaParts.push(item.kind || inferred.kind || '');
  if (item.difficulty) metaParts.push(`難易度: ${item.difficulty}`);

  const meta = metaParts.length
    ? `<div class="meta">${escapeHtml(metaParts.join(' / '))}</div>`
    : '';

  const explanation = item.explanation.trim();
  const related = item.related.trim();
  const example1 = item.example1.trim();
  const example2 = item.example2.trim();

  const bodyPieces: string[] = [];
  if (explanation) {
    bodyPieces.push(
      `<div class="block"><div class="label">解説</div><div class="text">${escapeHtml(explanation)}</div></div>`
    );
  }
  if (example1) {
    bodyPieces.push(
      `<div class="block"><div class="label">例文1</div><div class="text">${escapeHtml(example1)}</div></div>`
    );
  }
  if (example2) {
    bodyPieces.push(
      `<div class="block"><div class="label">例文2</div><div class="text">${escapeHtml(example2)}</div></div>`
    );
  }
  if (related) {
    bodyPieces.push(`<div class="block"><div class="label">関連</div>${renderTags(related)}</div>`);
  }

  const body = bodyPieces.length ? `<div class="body">${bodyPieces.join('')}</div>` : '';

  return `
    <section class="card ${mode}">
      <div class="head">
        <div class="left">
          <div class="wordline">
            <span class="word">${escapeHtml(item.word)}</span>
            ${item.reading ? `<span class="reading">(${escapeHtml(item.reading)})</span>` : ''}
          </div>
          ${item.meaning ? `<div class="meaning">${escapeHtml(item.meaning)}</div>` : ''}
          ${meta}
        </div>
        <div class="right">
          ${hasBadge ? `<div class="badge">${escapeHtml(badge)}</div>` : ''}
        </div>
      </div>
      ${body}
    </section>
  `;
}

function renderDeckSection(deck: Deck, items: NormalizedItem[]): string {
  const important = items.filter(isImportant);

  const heroCards = important
    .slice(0, 40)
    .map((it) => renderCard(it, 'hero'))
    .join('');

  const compactCards = items.map((it) => renderCard(it, 'compact')).join('');

  return `
    <section class="deck">
      <div class="deck-title">
        <h2>${escapeHtml(deck.title)}</h2>
        <div class="deck-sub">
          <span>全${items.length}件</span>
          <span> / 重要候補${important.length}件</span>
          <span class="deck-file">${escapeHtml(path.basename(deck.sourcePath))}</span>
        </div>
      </div>

      <div class="page-break"></div>

      <h3 class="section-title">重要ポイント（大きく）</h3>
      <div class="hero-grid">${heroCards || '<div class="muted">（重要候補が見つかりませんでした）</div>'}</div>

      <div class="page-break"></div>

      <h3 class="section-title">付録：全データ（削らない）</h3>
      <div class="compact-list">${compactCards}</div>
    </section>
  `;
}

function buildHtml(decks: Deck[], opts: { only?: string }): string {
  const now = new Date();
  const dateLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;

  const included = opts.only ? decks.filter((d) => d.id === opts.only) : decks;
  if (opts.only && included.length === 0) {
    const ids = decks.map((d) => d.id).join(', ');
    throw new Error(`--only が不正です: ${opts.only}（有効: ${ids}）`);
  }

  const allItems: NormalizedItem[] = [];
  for (const d of included) {
    for (const r of d.rows) allItems.push(normalizeRow(d, r));
  }

  const total = allItems.length;
  const importantCount = allItems.filter(isImportant).length;

  const deckSections = included
    .map((d) => {
      const items = d.rows
        .map((r) => normalizeRow(d, r))
        .filter((it) => it.word || it.meaning || it.explanation);
      return renderDeckSection(d, items);
    })
    .join('');

  const css = `
    @page {
      size: A5;
      margin: 10mm;
    }

    :root {
      --fg: #111;
      --muted: #555;
      --line: #ddd;
      --panel: #f6f6f6;
      --panel2: #f1f1f1;
    }

    html, body {
      padding: 0;
      margin: 0;
      color: var(--fg);
      font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", "Meiryo", system-ui, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .container {
      padding: 0;
    }

    .cover {
      border: 2px solid var(--fg);
      padding: 14mm 10mm;
      border-radius: 10px;
    }

    .cover h1 {
      font-size: 22px;
      margin: 0 0 6mm 0;
      letter-spacing: 0.02em;
    }

    .cover .subtitle {
      font-size: 13px;
      color: var(--muted);
      margin-bottom: 6mm;
    }

    .cover .stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6mm;
      margin-top: 6mm;
    }

    .stat {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 4mm;
      background: var(--panel);
    }

    .stat .k {
      font-size: 11px;
      color: var(--muted);
    }

    .stat .v {
      font-size: 16px;
      font-weight: 800;
      margin-top: 2mm;
    }

    .howto {
      margin-top: 8mm;
      padding: 6mm;
      border-radius: 10px;
      border: 1px dashed var(--line);
    }

    .howto h2 {
      margin: 0 0 3mm 0;
      font-size: 14px;
    }

    .howto ul {
      margin: 0;
      padding-left: 5mm;
      color: var(--fg);
    }

    .page-break {
      break-after: page;
      page-break-after: always;
    }

    .deck {
      margin-top: 0;
    }

    .deck-title {
      margin-top: 0;
      padding: 6mm;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: var(--panel);
    }

    .deck-title h2 {
      margin: 0;
      font-size: 16px;
      letter-spacing: 0.01em;
    }

    .deck-sub {
      margin-top: 2mm;
      font-size: 11px;
      color: var(--muted);
      display: flex;
      gap: 4mm;
      flex-wrap: wrap;
    }

    .section-title {
      margin: 0 0 3mm 0;
      font-size: 14px;
      padding-left: 3mm;
      border-left: 4px solid var(--fg);
    }

    .muted {
      color: var(--muted);
    }

    .hero-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 4mm;
    }

    .compact-list {
      display: grid;
      grid-template-columns: 1fr;
      gap: 3mm;
    }

    .card {
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 4mm;
      background: #fff;
      break-inside: avoid;
      page-break-inside: avoid;
      position: relative;
      overflow: hidden;
    }

    .card.hero {
      border-width: 2px;
    }

    .card.compact {
      background: var(--panel2);
    }

    .head {
      display: flex;
      justify-content: space-between;
      gap: 4mm;
      align-items: flex-start;
    }

    .wordline {
      display: flex;
      gap: 2mm;
      align-items: baseline;
      flex-wrap: wrap;
    }

    .word {
      font-size: 16px;
      font-weight: 900;
      letter-spacing: 0.01em;
    }

    .card.compact .word {
      font-size: 14px;
    }

    .reading {
      font-size: 12px;
      color: var(--muted);
      font-weight: 600;
    }

    .meaning {
      margin-top: 1.5mm;
      font-size: 13px;
      font-weight: 700;
    }

    .card.compact .meaning {
      font-size: 12px;
      font-weight: 700;
    }

    .meta {
      margin-top: 1mm;
      font-size: 11px;
      color: var(--muted);
    }

    .badge {
      border: 2px solid var(--fg);
      padding: 1mm 2.5mm;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 900;
      white-space: nowrap;
      background: #fff;
    }

    .body {
      margin-top: 3mm;
      display: grid;
      grid-template-columns: 1fr;
      gap: 2.5mm;
    }

    .block {
      border-top: 1px solid var(--line);
      padding-top: 2mm;
    }

    .label {
      font-size: 10px;
      color: var(--muted);
      font-weight: 800;
      letter-spacing: 0.04em;
    }

    .text {
      margin-top: 1mm;
      font-size: 12px;
      white-space: pre-wrap;
    }

    .card.compact .text {
      font-size: 11px;
    }

    .tags {
      margin-top: 1.5mm;
      display: flex;
      gap: 1.5mm;
      flex-wrap: wrap;
    }

    .tag {
      font-size: 10px;
      padding: 0.6mm 2mm;
      border-radius: 999px;
      background: #fff;
      border: 1px solid var(--line);
      color: var(--fg);
      font-weight: 700;
    }

    .footer {
      margin-top: 6mm;
      color: var(--muted);
      font-size: 10px;
    }
  `;

  const html = `
<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>高校受験 古文・漢文 総まとめ（A5）</title>
  <style>${css}</style>
</head>
<body>
  <div class="container">
    <section class="cover">
      <h1>高校受験 古文・漢文 総まとめ（A5）</h1>
      <div class="subtitle">スマホで見やすいサイズ / 重要は大きく / 内容は付録で全収録</div>
      <div class="stats">
        <div class="stat"><div class="k">収録（全件）</div><div class="v">${total}件</div></div>
        <div class="stat"><div class="k">重要候補（自動抽出）</div><div class="v">${importantCount}件</div></div>
        <div class="stat"><div class="k">生成日</div><div class="v">${escapeHtml(dateLabel)}</div></div>
        <div class="stat"><div class="k">対象データ</div><div class="v">classical-japanese</div></div>
      </div>
      <div class="howto">
        <h2>使い方（おすすめ）</h2>
        <ul>
          <li>まず各章の「重要ポイント（大きく）」だけ流し読み（10〜20分）</li>
          <li>間違えた/曖昧な項目だけ「付録：全データ」で該当カードを確認</li>
          <li>前日は「重要ポイント」だけもう1周（短時間で復習できる）</li>
        </ul>
      </div>
      <div class="footer">※「重要候補」はCSVの関連事項（最重要/最頻出など）や種別から自動抽出。必要なら基準は調整できます。</div>
    </section>

    <div class="page-break"></div>

    ${deckSections}
  </div>
</body>
</html>
`;

  return html;
}

async function renderPdf(htmlPath: string, pdfPath: string): Promise<void> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 840, height: 1188 } }); // A5相当
    const html = fs.readFileSync(htmlPath, 'utf-8');

    await page.setContent(html, { waitUntil: 'load' });
    await page.pdf({
      path: pdfPath,
      format: 'A5',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    });
  } finally {
    await browser.close();
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    printHelp();
    return;
  }

  const root = path.join(process.cwd(), 'public/data/classical-japanese');
  const outDir = args.out
    ? path.isAbsolute(String(args.out))
      ? String(args.out)
      : path.join(process.cwd(), String(args.out))
    : path.join(root, 'print');

  const only = args.only ? String(args.only) : undefined;
  const noPdf = Boolean(args['no-pdf']);

  ensureDir(outDir);

  console.log('=== 古典PDF生成 ===');
  console.log(`input: ${path.relative(process.cwd(), root)}`);
  console.log(`output: ${path.relative(process.cwd(), outDir)}`);
  if (only) console.log(`only: ${only}`);
  console.log(`pdf: ${noPdf ? 'skip' : 'generate'}`);

  const decks = loadDecks(root);
  const html = buildHtml(decks, { only });

  const htmlPath = path.join(outDir, 'classical-japanese-a5.html');
  const pdfPath = path.join(outDir, 'classical-japanese-a5.pdf');

  fs.writeFileSync(htmlPath, html, 'utf-8');
  console.log(`\n✅ HTML出力: ${path.relative(process.cwd(), htmlPath)}`);

  if (!noPdf) {
    await renderPdf(htmlPath, pdfPath);
    console.log(`✅ PDF出力: ${path.relative(process.cwd(), pdfPath)}`);
  }
}

main().catch((e) => {
  console.error(`\n❌ エラー: ${String((e as any)?.message || e)}`);
  process.exit(1);
});
