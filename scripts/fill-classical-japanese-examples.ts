#!/usr/bin/env tsx

/**
 * JP系 classical-japanese CSV の 例文1/例文2 を「古文作品からの引用（1文）」で埋める。
 *
 * 重要:
 * - 例文はこのリポジトリ内の classical-knowledge.csv（名文句など）に含まれる引用文から抽出する。
 * - 各行に対して、引用文プールから2つ選び、
 *   `本文（読み）＜現代語訳＞【出典】` 形式で 例文1/例文2 に設定。
 * - 既に【-】以外の出典が入っている場合は上書きしない（デフォルト）。
 *
 * 使い方:
 *   npx tsx scripts/fill-classical-japanese-examples.ts
 *
 * オプション:
 *   --force   既存の例文も上書き
 */

import * as fs from 'fs';
import * as path from 'path';

type CsvRow = Record<string, string>;

type ParsedCsv = {
  headers: string[];
  rows: CsvRow[];
};

type Quote = {
  text: string; // 1文
  source: string; // 作品名
  meaning: string; // 簡潔な現代語/要約
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

function splitPipeList(raw: string): string[] {
  return raw
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
}

function pickSourceFromRelated(related: string): string {
  const tags = splitPipeList(related);
  const known = [
    '枕草子',
    '源氏物語',
    '徒然草',
    '方丈記',
    '平家物語',
    '奥の細道',
    '土佐日記',
    '伊勢物語',
    '竹取物語',
    '今昔物語集',
    '更級日記',
    '古今和歌集',
  ];
  for (const k of known) {
    if (tags.includes(k)) return k;
  }
  return '';
}

function firstSentence(text: string): string {
  const t = (text || '').trim();
  if (!t) return '';
  const idx = t.indexOf('。');
  if (idx >= 0) return t.slice(0, idx + 1);
  return t;
}

function extractQuotesFromKnowledge(knowledge: ParsedCsv): Quote[] {
  const quotes: Quote[] = [];

  const meaningMap: Array<{ startsWith: string; meaning: string; source: string }> = [
    { startsWith: '春はあけぼの', meaning: '春は夜明けがよい。', source: '枕草子' },
    { startsWith: '夏は夜', meaning: '夏は夜がよい。', source: '枕草子' },
    { startsWith: '秋は夕暮れ', meaning: '秋は夕暮れがよい。', source: '枕草子' },
    { startsWith: '冬はつとめて', meaning: '冬は早朝がよい。', source: '枕草子' },
    { startsWith: '祇園精舎の鐘の声', meaning: 'この世は無常である。', source: '平家物語' },
    { startsWith: 'ゆく河の流れは絶えずして', meaning: '物事は常に移り変わる。', source: '方丈記' },
    {
      startsWith: 'つれづれなるままに',
      meaning: '退屈なので、硯に向かって書きつける。',
      source: '徒然草',
    },
    {
      startsWith: '月日は百代の過客にして',
      meaning: '月日も年も旅人のように過ぎていく。',
      source: '奥の細道',
    },
    { startsWith: 'いづれの御時にか', meaning: 'いつの帝の御代であったか。', source: '源氏物語' },
    { startsWith: 'うつくしきもの', meaning: 'かわいいものを列挙する。', source: '枕草子' },
    { startsWith: '仁和寺にある法師', meaning: '行き先を勘違いして失敗する話。', source: '徒然草' },
    { startsWith: '高名の木登り', meaning: '危険は油断した時に起こる。', source: '徒然草' },
  ];

  // 省略禁止（ユーザー要件）: 引用プールに現代語訳が無い場合はエラーにする。
  // startsWith で拾えないものは「出典::本文」の完全一致で補完する。
  const exactMeaningMap: Record<string, string> = {
    '今昔物語集::今となっては昔のことだが': '今となってはもう昔の話だが。',
    '伊勢物語::月やあらぬ、春や昔の春ならぬ、我が身ひとつはもとの身にして':
      '月は同じでも春は昔の春ではない。私だけが昔のままの私でいる。',
    '古今和歌集::世の中にたえて桜のなかりせば、春の心はのどけからまし':
      'もし世の中に桜がまったくなかったなら、春の心はどれほどのどかだっただろう。',
    '土佐日記::男もすなる日記といふものを、女もしてみむとて、するなり':
      '男が書くという日記というものを、女も書いてみようと思って書くのである。',
    '徒然草::あやふき時は言はで、やすき時に教へけり':
      '危ない時には言わず、安心な時にこそ教えたのだ。',
    '徒然草::一つには、高く、やんごとなき人': '一つ目は、身分が高く、たいへん高貴な人。',
    '徒然草::一事を必ず成さんと思はば、他の事の破るるをも傷むべからず':
      '一つの事を必ずやり遂げようと思うなら、他の事がだめになるのも惜しんではならない。',
    '徒然草::世にしたがへば、身苦し。': '世間に合わせて生きると、身が苦しくなる。',
    '徒然草::友とするにわろき者、七つあり': '友にしてはいけない人が七種類いる。',
    '徒然草::奥山に、猫またといふものありて、人を食ふなる':
      '奥深い山には猫またというものがいて、人を食うという。',
    '徒然草::少しのことにも先達はあらまほしきことなり':
      '些細なことでも、先に知っている人がいてほしいものだ。',
    '徒然草::花は盛りに、月は隈なきをのみ、見るものかは':
      '花は満開の時だけ、月は雲のない時だけを見るものだろうか。いや、そうではない。',
    '枕草子::やうやう白くなりゆく山ぎは': 'だんだんと白くなっていく山際、夜明けの山の端。',
    '枕草子::中納言参り給ひて、御扇奉らせ給ふに':
      '中納言が参上なさって、御扇を差し上げなさるときに。',
    '枕草子::雪のいと高う降りたるを、例ならず御格子まゐりて、炭櫃に火おこして、物語などして集まりさぶらふに':
      '雪がたいそう降ったので、いつもと違って御格子を上げ、炭びつに火をおこし、物語などしながら集まってお仕えしているときに。',
  };

  const seen = new Set<string>();

  for (const r of knowledge.rows) {
    const explanation = r['解説'] || '';
    const related = r['関連事項'] || '';

    const inferredSource = pickSourceFromRelated(related);

    // 解説から「...」を抽出
    const re = /「([^」]{5,400})」/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(explanation)) !== null) {
      const raw = m[1].replace(/\s+/g, ' ').trim();
      const sentence = firstSentence(raw);
      if (sentence.length < 6) continue;
      if (sentence.length > 120) continue;

      const map = meaningMap.find((x) => sentence.startsWith(x.startsWith));
      const source = map?.source || inferredSource;
      if (!source) continue;

      const key = `${source}::${sentence}`;
      const meaningRaw = map?.meaning || exactMeaningMap[key];
      if (!meaningRaw) {
        throw new Error(`引用の現代語訳が未定義です: ${key}`);
      }
      const meaning = meaningRaw.replace(/[（）]/g, '');

      // key は上で作成済み
      if (seen.has(key)) continue;
      seen.add(key);

      quotes.push({ text: sentence, source, meaning });
    }
  }

  // 作品ごとにバランスよく並ぶように軽くソート
  quotes.sort((a, b) =>
    a.source === b.source ? a.text.localeCompare(b.text) : a.source.localeCompare(b.source)
  );

  return quotes;
}

function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function formatExample(q: Quote, reading: string): string {
  const r = (reading || '').trim() || '-';
  return `${q.text}（${r}）『${q.meaning}』【${q.source}】`;
}

function shouldOverwriteExample(existing: string, force: boolean): boolean {
  const e = (existing || '').trim();
  if (force) return true;
  if (!e) return true;
  if (e.includes('【-】')) return true;
  return false;
}

function applyToFile(
  filePath: string,
  quotes: Quote[],
  force: boolean
): { changed: boolean; msg: string } {
  const before = fs.readFileSync(filePath, 'utf-8');
  const parsed = parseCsvToObjects(before);

  if (!parsed.headers.includes('例文1') || !parsed.headers.includes('例文2')) {
    return { changed: false, msg: 'skip（例文列がありません）' };
  }

  let changed = false;

  for (const r of parsed.rows) {
    const key = `${r['語句'] || ''}||${r['読み'] || ''}||${r['意味'] || ''}`;
    const base = fnv1a(key);
    const i1 = quotes.length ? base % quotes.length : 0;
    const i2 = quotes.length ? (base + 7) % quotes.length : 0;
    const q1 = quotes[i1];
    const q2 = quotes[i2];

    const reading = r['読み'] || '';

    if (q1 && shouldOverwriteExample(r['例文1'], force)) {
      r['例文1'] = formatExample(q1, reading);
      changed = true;
    }
    if (q2 && shouldOverwriteExample(r['例文2'], force)) {
      r['例文2'] = formatExample(q2, reading);
      changed = true;
    }
  }

  if (!changed) return { changed: false, msg: 'no-op' };

  const after = formatCsv(parsed.headers, parsed.rows);

  // バックアップ（例文埋めの前）
  const backup = filePath.replace(/\.csv$/i, '.before-fill-examples.csv');
  if (!fs.existsSync(backup)) {
    fs.writeFileSync(backup, before, 'utf-8');
  }

  fs.writeFileSync(filePath, after, 'utf-8');
  return { changed: true, msg: `ok（backup: ${path.basename(backup)}）` };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const force = Boolean(args.force);

  const root = path.join(process.cwd(), 'public/data/classical-japanese');
  const knowledgePath = path.join(root, 'classical-knowledge.csv');

  if (!fs.existsSync(knowledgePath)) {
    throw new Error(`missing: ${knowledgePath}`);
  }

  const knowledge = parseCsvToObjects(fs.readFileSync(knowledgePath, 'utf-8'));
  const quotes = extractQuotesFromKnowledge(knowledge);

  if (quotes.length < 6) {
    throw new Error(
      `引用プールが不足しています（抽出 ${quotes.length}件）。classical-knowledge.csv に名文句の引用が必要です。`
    );
  }

  console.log('=== fill examples (quotes) ===');
  console.log(`quotes: ${quotes.length}`);
  console.log(`force: ${force}`);

  const targets = ['classical-grammar.csv', 'classical-vocabulary.csv', 'classical-words.csv'].map(
    (f) => path.join(root, f)
  );

  for (const p of targets) {
    const rel = path.relative(process.cwd(), p);
    if (!fs.existsSync(p)) {
      console.log(`- ${rel}: skip（missing）`);
      continue;
    }
    const res = applyToFile(p, quotes, force);
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
