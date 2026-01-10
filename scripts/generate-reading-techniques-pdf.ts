#!/usr/bin/env tsx

/**
 * 中学受験向け：英語長文読解「要点チェック」PDFを生成
 *
 * 方針:
 * - docs/private/reading-techniques の要約データを素材にする（引用なし）
 * - J_2020_4_sentences.txt を“構造の参考”として使い、例文は言い換え（転載しない）
 * - /分割・()分割（<>）の読み方を、フレーズ訳付きで具体例に落とす
 * - HTML（印刷CSS）を生成し、PlaywrightでPDF化
 *
 * 使い方:
 *   npx tsx scripts/generate-reading-techniques-pdf.ts
 *
 * 出力:
 *   public/data/reading-techniques/print/reading-techniques-jhs-a4.html
 *   public/data/reading-techniques/print/reading-techniques-jhs-a4.pdf
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { chromium } from '@playwright/test';
import { splitWithSlash } from '../src/utils/slashSplitLogic';
import { splitWithParentheses } from '../src/utils/parenSplitLogic';

type SentencePattern = {
  id: string;
  title: string;
  gist: string;
  steps: string[];
  pitfalls: string[];
  exampleEn?: string;
};

type SentencePatternsJson = {
  version: number;
  language: string;
  licenseNote?: string;
  patterns: SentencePattern[];
};

type QuestionStrategy = {
  id: string;
  title: string;
  gist: string;
  steps: string[];
  pitfalls: string[];
};

type QuestionStrategiesJson = {
  version: number;
  language: string;
  strategies: QuestionStrategy[];
};

type ParagraphPattern = {
  id: string;
  title: string;
  gist: string;
  steps: string[];
  pitfalls: string[];
};

type ParagraphPatternsJson = {
  version: number;
  language: string;
  patterns: ParagraphPattern[];
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
英語長文（中学受験）PDFジェネレータ

使い方:
  npx tsx scripts/generate-reading-techniques-pdf.ts

オプション:
  --out <dir>     出力先ディレクトリ（既定: public/data/reading-techniques/print）
  --no-pdf        HTMLのみ出力（PDF生成をスキップ）
  --help          ヘルプ表示
`);
}

function readJson<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

function readJ2020SeedSentences(repoRoot: string): string[] {
  // 注意: ここで読むのは「構造の参考」のため。PDFには原文を転載しない。
  const filePath = path.join(
    repoRoot,
    'public',
    'data',
    'passages-sentences',
    'J_2020_4_sentences.txt'
  );
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function chunkBySlash(slashSplit: string): string[] {
  return slashSplit
    .split(' / ')
    .map((s) => s.trim())
    .filter(Boolean);
}

type Example = {
  title: string;
  sentenceParaphrased: string;
  whyItMatters: string;
  glossByChunk: Record<string, string>;
};

function buildExamples(_seedLines: string[]): Example[] {
  // 重要: 例文は“言い換え”で、元文の転載はしない
  return [
    {
      title: '例1：場所（前置詞句）を先に固定する',
      sentenceParaphrased: 'In our town, we have a nice zoo called Sunny Zoo.',
      whyItMatters: '最初の場所情報を/で切っておくと、主語と動詞に早く着地できます。',
      glossByChunk: {
        'In our town,': '私たちの町では',
        'we have': '〜がある',
        'a nice zoo called Sunny Zoo.': 'Sunny Zooというすてきな動物園が',
      },
    },
    {
      title: '例2：時間・追加情報を/で足す（and）',
      sentenceParaphrased:
        'It will start at eleven in the morning, and we can enjoy it for thirty minutes.',
      whyItMatters: '「いつ」「どれくらい」を別チャンクにすると、情報を落としません。',
      glossByChunk: {
        'It will start': 'それは始まる',
        'at eleven in the morning,': '午前11時に',
        'and': 'そして',
        'we can enjoy it': '私たちはそれを楽しめる',
        'for thirty minutes.': '30分間',
      },
    },
    {
      title: '例3：理由（because）を()で“後付け”にする',
      sentenceParaphrased: 'I can\'t join the night tour because I have to go home by six.',
      whyItMatters: '主節（言いたいこと）→理由の順にすると、迷子になりにくいです。',
      glossByChunk: {
        "I can't join the night tour": '夜のツアーには参加できない',
        'because': 'なぜなら',
        'I have to go home': '家に帰らなければならない',
        'by six.': '6時までに',
      },
    },
    {
      title: '例4：条件（if）を()で囲んで判断を早くする',
      sentenceParaphrased:
        'So, if we show our student cards, the entrance fee will be three dollars per person.',
      whyItMatters: '条件を括ると「結論（料金）」が一気に読めます。',
      glossByChunk: {
        'So,': 'それで',
        'if we show our student cards,': 'もし学生証を見せれば',
        'the entrance fee will be three dollars per person.': '入場料は1人3ドルになる',
      },
    },
    {
      title: '例5：命令・提案（should/let\'s）は“行動”を先に取る',
      sentenceParaphrased:
        'We should take our student ID cards to the zoo and show them to the staff.',
      whyItMatters: 'やること（take/show）を2つの動作として整理すると速いです。',
      glossByChunk: {
        'We should take our student ID cards': '私たちは学生証を持っていくべきだ',
        'to the zoo': '動物園に',
        'and': 'そして',
        'show them': 'それを見せる',
        'to the staff.': '係の人に',
      },
    },
    {
      title: '例6：場所の後置修飾（in front of ...）は名詞にくっつける',
      sentenceParaphrased:
        'We\'ll take a bus at the stop in front of our school at eight.',
      whyItMatters: '「どの停留所？」を名詞にくっつけると、順番に訳しても崩れません。',
      glossByChunk: {
        "We'll take a bus": '私たちはバスに乗る',
        'at the stop in front of our school': '学校の前にある停留所で',
        'at eight.': '8時に',
      },
    },
  ];
}

function pickById<T extends { id: string }>(items: T[], ids: string[]): T[] {
  const map = new Map(items.map((x) => [x.id, x] as const));
  return ids.map((id) => map.get(id)).filter(Boolean) as T[];
}

function renderTechniqueCard(t: { id: string; title: string; gist: string; steps: string[]; pitfalls: string[] }): string {
  return `
    <div class="card">
      <div class="card-head">
        <div class="badge">${escapeHtml(t.id)}</div>
        <div class="card-title">${escapeHtml(t.title)}</div>
      </div>
      <div class="gist">${escapeHtml(t.gist)}</div>
      <div class="cols">
        <div>
          <div class="sub">手順</div>
          <ol>
            ${t.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}
          </ol>
        </div>
        <div>
          <div class="sub">落とし穴</div>
          <ul>
            ${t.pitfalls.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>
  `;
}

function renderExample(ex: Example): string {
  const slash = splitWithSlash(ex.sentenceParaphrased);
  const chunks = chunkBySlash(slash);
  const paren = splitWithParentheses(ex.sentenceParaphrased);

  const glossRows = chunks
    .map((c) => {
      const jp = ex.glossByChunk[c] ?? '';
      return `<tr><td class="en">${escapeHtml(c)}</td><td class="jp">${escapeHtml(jp)}</td></tr>`;
    })
    .join('');

  return `
  <div class="example">
    <div class="example-title">${escapeHtml(ex.title)}</div>
    <div class="why">${escapeHtml(ex.whyItMatters)}</div>

    <div class="mono"><span class="label">例文（言い換え）</span> ${escapeHtml(ex.sentenceParaphrased)}</div>
    <div class="mono"><span class="label">/分割</span> ${escapeHtml(slash)}</div>
    <div class="mono"><span class="label">()<>分割</span> ${escapeHtml(paren)}</div>

    <table class="gloss">
      <thead><tr><th>チャンク（/の単位）</th><th>フレーズ訳（目安）</th></tr></thead>
      <tbody>${glossRows}</tbody>
    </table>
  </div>
  `;
}

function buildHtml(opts: {
  generatedAt: string;
  sentenceTechniques: SentencePattern[];
  paragraphTechniques: ParagraphPattern[];
  questionStrategies: QuestionStrategy[];
  examples: Example[];
  seedCount: number;
}): string {
  const { generatedAt, sentenceTechniques, paragraphTechniques, questionStrategies, examples, seedCount } = opts;

  const sentenceCards = sentenceTechniques.map(renderTechniqueCard).join('');
  const paragraphCards = paragraphTechniques.map(renderTechniqueCard).join('');
  const questionCards = questionStrategies.map(renderTechniqueCard).join('');
  const exampleHtml = examples.map(renderExample).join('');

  return `
<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>英語長文読解 要点チェック（中学受験）</title>
  <style>
    @page { size: A4; margin: 12mm; }
    :root {
      --fg: #111827;
      --muted: #6b7280;
      --border: #e5e7eb;
      --bg: #ffffff;
      --card: #f9fafb;
      --accent: #2563eb;
      --warn: #b45309;
    }
    html, body { background: var(--bg); color: var(--fg); font-family: -apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Noto Sans JP', Segoe UI, Roboto, Helvetica, Arial, sans-serif; }
    body { margin: 0; }
    .wrap { max-width: 980px; margin: 0 auto; }
    .cover { border: 1px solid var(--border); border-radius: 12px; padding: 18px; }
    h1 { font-size: 22px; margin: 0 0 6px; }
    .subline { color: var(--muted); font-size: 12px; line-height: 1.5; }
    .badge2 { display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--border); background: #fff; margin-right: 6px; }
    .toc { margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--border); }
    .toc h2 { font-size: 14px; margin: 0 0 8px; }
    .toc ul { margin: 0; padding-left: 18px; color: var(--muted); }

    .section { margin-top: 16px; }
    .section h2 { font-size: 16px; margin: 0 0 8px; }
    .section .lead { color: var(--muted); font-size: 12px; margin: 0 0 10px; }

    .rulebox { border: 1px solid var(--border); border-radius: 12px; background: var(--card); padding: 12px; }
    .rulebox h3 { margin: 0 0 8px; font-size: 13px; }
    .rulebox ul { margin: 0; padding-left: 18px; }

    .card { border: 1px solid var(--border); border-radius: 12px; background: var(--card); padding: 12px; margin: 10px 0; }
    .card-head { display: flex; align-items: baseline; gap: 8px; }
    .badge { font-size: 11px; color: var(--accent); border: 1px solid #bfdbfe; background: #eff6ff; padding: 2px 8px; border-radius: 999px; }
    .card-title { font-size: 13px; font-weight: 700; }
    .gist { margin-top: 6px; font-size: 12px; color: var(--fg); }
    .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
    .sub { font-size: 11px; color: var(--muted); font-weight: 700; margin-bottom: 6px; }
    ol, ul { margin: 0; padding-left: 18px; font-size: 12px; }

    .example { border: 1px solid var(--border); border-radius: 12px; padding: 12px; margin: 10px 0; }
    .example-title { font-size: 13px; font-weight: 800; margin: 0 0 6px; }
    .why { font-size: 12px; color: var(--muted); margin-bottom: 10px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 11px; background: #0b1020; color: #e5e7eb; padding: 8px; border-radius: 10px; margin: 6px 0; }
    .label { color: #93c5fd; font-weight: 700; margin-right: 6px; }

    table.gloss { width: 100%; border-collapse: collapse; margin-top: 8px; }
    table.gloss th, table.gloss td { border: 1px solid var(--border); padding: 6px 8px; font-size: 12px; vertical-align: top; }
    table.gloss th { background: #f3f4f6; text-align: left; }
    td.en { width: 58%; }
    td.jp { width: 42%; }

    .note { font-size: 11px; color: var(--warn); margin-top: 8px; }

    .page-break { page-break-before: always; }

    @media print {
      .wrap { max-width: none; }
      .card, .example, .cover, .rulebox { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <section class="cover">
      <div>
        <span class="badge2">中学受験</span>
        <span class="badge2">英語長文</span>
        <span class="badge2">/分割</span>
        <span class="badge2">()<>分割</span>
      </div>
      <h1>英語長文読解：要点チェック（受験前）</h1>
      <div class="subline">生成日: ${escapeHtml(generatedAt)} / reading-techniques: docs/private 由来（要約）</div>
      <div class="subline">注意: 例文は学習用に言い換えています。元の本文の転載はしていません（引用なし）。</div>
      <div class="subline">参考データ: J_2020_4_sentences.txt（行数 ${seedCount}）を“構造の参考”として使用。</div>

      <div class="toc">
        <h2>目次（速習）</h2>
        <ul>
          <li>1分：/分割（スラッシュ）で骨格→情報を足す</li>
          <li>1分：()<>分割で「主節」と「従属節/前置詞句」を分ける</li>
          <li>実例：フレーズ訳つき（6例）</li>
          <li>頻出：文内テクニック（10枚）</li>
          <li>頻出：段落テクニック（4枚）</li>
          <li>頻出：設問タイプ別（4枚）</li>
        </ul>
      </div>
    </section>

    <section class="section">
      <h2>/分割（スラッシュ）の使い方：30秒手順</h2>
      <p class="lead">1文を「意味のかたまり」に分けて、順番に“足し算”で読む方法です。</p>
      <div class="rulebox">
        <h3>手順（覚える形）</h3>
        <ul>
          <li>① まず主語(S)と動詞(V)に着地（最短で骨格）</li>
          <li>② 前置詞句（場所/時間/手段）や接続詞（and/because/if）で / を入れる</li>
          <li>③ /ごとに「ミニ訳」を作って、最後に合体させる</li>
        </ul>
        <div class="note">コツ: /で切る目的は“訳の順番”ではなく“情報を落とさないこと”。</div>
      </div>
    </section>

    <section class="section">
      <h2>()<>分割の使い方：30秒手順</h2>
      <p class="lead">従属節（because/if/that等）を()、前置詞句（at/in/by等）を<>で括って、主節から読む方法です。</p>
      <div class="rulebox">
        <h3>手順（覚える形）</h3>
        <ul>
          <li>① () を見つけたら「後で読むメモ」にする（まず主節）</li>
          <li>② &lt;&gt; は「どこで/いつ/どうやって」を表す“追加情報”として処理</li>
          <li>③ 最後に()や&lt;&gt;を足して、自然な日本語に整える</li>
        </ul>
        <div class="note">コツ: because/if を見た瞬間に()で括ると、主節の意味が崩れません。</div>
      </div>
    </section>

    <div class="page-break"></div>

    <section class="section">
      <h2>実例：/分割→フレーズ訳（言い換え例）</h2>
      <p class="lead">短時間で確認できるように、代表構文だけ6例に絞っています。</p>
      ${exampleHtml}
    </section>

    <div class="page-break"></div>

    <section class="section">
      <h2>頻出：文内（1文）テクニック</h2>
      <p class="lead">「これを見たらこう読む」を型で覚えると、初見でも崩れません。</p>
      ${sentenceCards}
    </section>

    <div class="page-break"></div>

    <section class="section">
      <h2>頻出：段落（パラグラフ）テクニック</h2>
      <p class="lead">段落は“機能”で読むと、主旨と根拠の位置が見えます。</p>
      ${paragraphCards}
    </section>

    <div class="page-break"></div>

    <section class="section">
      <h2>頻出：設問タイプ別（解き方）</h2>
      <p class="lead">本文の読み方と、設問の取り方はセットで覚えるのが最短です。</p>
      ${questionCards}
    </section>
  </div>
</body>
</html>
`;
}

async function renderPdf(htmlPath: string, pdfPath: string): Promise<void> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1240, height: 1754 } }); // A4相当
    const html = fs.readFileSync(htmlPath, 'utf-8');

    await page.setContent(html, { waitUntil: 'load' });
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', bottom: '12mm', left: '12mm', right: '12mm' },
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

  const repoRoot = process.cwd();
  const techniquesDir = path.join(repoRoot, 'docs', 'private', 'reading-techniques');
  if (!fs.existsSync(techniquesDir)) {
    console.warn(`[generate-reading-techniques-pdf] Source directory not found: ${techniquesDir}`);
    console.warn(`[generate-reading-techniques-pdf] Skipping (this is expected in some CI environments)`);
    return;
  }

  const outDir = args.out
    ? path.isAbsolute(String(args.out))
      ? String(args.out)
      : path.join(repoRoot, String(args.out))
    : path.join(repoRoot, 'public', 'data', 'reading-techniques', 'print');

  const noPdf = Boolean(args['no-pdf']);
  ensureDir(outDir);

  const sentenceJson = readJson<SentencePatternsJson>(
    path.join(techniquesDir, 'sentence_reading_patterns.json')
  );
  const paragraphJson = readJson<ParagraphPatternsJson>(
    path.join(techniquesDir, 'paragraph_reading_patterns.json')
  );
  const questionJson = readJson<QuestionStrategiesJson>(
    path.join(techniquesDir, 'question_type_strategies.json')
  );

  const seedLines = readJ2020SeedSentences(repoRoot);

  // 中学受験で特に効く “少数精鋭”
  const sentenceTechniques = pickById(sentenceJson.patterns, [
    'S03', // 挿入
    'S05', // to
    'S08', // 否定
    'S10', // 受動
    'S11', // that/wh
    'S14', // 後置修飾
    'S19', // 前置詞
    'S20', // 長主語
    'S22', // 並列
    'S04', // 分詞構文
  ]);

  const paragraphTechniques = pickById(paragraphJson.patterns, [
    'P01',
    'P02',
    'P03',
    'P04',
  ]);

  const questionStrategies = pickById(questionJson.strategies, [
    'Q01',
    'Q02',
    'Q03',
    'Q04',
  ]);

  const examples = buildExamples(seedLines);

  const generatedAt = new Date().toISOString().slice(0, 10);
  const html = buildHtml({
    generatedAt,
    sentenceTechniques,
    paragraphTechniques,
    questionStrategies,
    examples,
    seedCount: seedLines.length,
  });

  const htmlPath = path.join(outDir, 'reading-techniques-jhs-a4.html');
  const pdfPath = path.join(outDir, 'reading-techniques-jhs-a4.pdf');

  fs.writeFileSync(htmlPath, html, 'utf-8');
  console.log(`✅ HTML出力: ${path.relative(repoRoot, htmlPath)}`);

  if (!noPdf) {
    await renderPdf(htmlPath, pdfPath);
    console.log(`✅ PDF出力: ${path.relative(repoRoot, pdfPath)}`);
  } else {
    console.log('ℹ️ PDF生成は --no-pdf によりスキップ');
  }
}

main().catch((e) => {
  console.error(`\n❌ エラー: ${String((e as any)?.message || e)}`);
  process.exit(1);
});
