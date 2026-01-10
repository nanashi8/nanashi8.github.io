#!/usr/bin/env tsx

/**
 * 古典（高校受験）「直前チェック」用のテキスト（Markdown / txt）を生成。
 *
 * 目的:
 * - 古文→漢文の順で、短時間で見返せる要点テキストを作る
 * - 例文の出典を厳密に担保できない運用でも使えるように、既定で例文は出力しない
 *
 * 入力:
 * - public/data/classical-japanese/*.csv
 *
 * 出力（既定）:
 * - public/data/classical-japanese/print/古文漢文まとめ_直前.md
 * - public/data/classical-japanese/print/古文漢文まとめ_直前.txt
 *
 * 使い方:
 *   npx tsx scripts/generate-classical-japanese-text.ts
 *
 * オプション:
 *   --out <dir>             出力先（既定: public/data/classical-japanese/print）
 *   --only <deckId>         対象を限定（grammar, vocabulary, knowledge, words, kanbun-practice, kanbun-words）
 *   --format <md|txt|both>  既定: both
 *   --include-examples      例文1/2も出す（既定: 出さない）
 *   --help
 */

import * as fs from 'fs';
import * as path from 'path';

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
};

function ensureDir(dirPath: string): void {
	if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
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
古典（高校受験）直前テキスト生成

使い方:
	npx tsx scripts/generate-classical-japanese-text.ts

オプション:
	--out <dir>             出力先（既定: public/data/classical-japanese/print）
	--only <id>             deckIdのみ生成
	--format <md|txt|both>  既定: both
	--include-examples      例文1/2も出す（既定: 出さない）
	--help                  ヘルプ表示
`);
}

/** RFC 4180の最低限（引用符・改行・カンマ）を扱う簡易CSVパーサ */
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
		if (!fs.existsSync(full)) throw new Error(`CSVが見つかりません: ${full}`);

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
	};
}

function splitPipeList(raw: string): string[] {
	return raw
		.split('|')
		.map((s) => s.trim())
		.filter(Boolean);
}

function pickTagsForQuickView(rawRelated: string): string {
	const tags = splitPipeList(rawRelated)
		.filter((t) => !t.startsWith('時代:') && !t.startsWith('種別:'))
		.slice(0, 6);
	return tags.join(' / ');
}

function firstSentence(text: string): string {
	const t = (text || '').trim();
	if (!t) return '';
	const idx = t.indexOf('。');
	if (idx >= 0) return t.slice(0, idx + 1);
	const idx2 = t.indexOf('.');
	if (idx2 >= 0) return t.slice(0, idx2 + 1);
	return t;
}

function normalizeWhitespace(text: string): string {
	return (text || '').replace(/\s+/g, ' ').trim();
}

function renderMd(decks: Deck[], opts: { only?: string; includeExamples: boolean }): string {
	const now = new Date();
	const header = `# 古文・漢文 直前まとめ（テキスト版）\n\n`;
	const meta = [
		`- 生成日: ${now.toISOString().slice(0, 10)}`,
		`- 入力: public/data/classical-japanese/*.csv`,
		`- 方針: 直前チェック用に要点のみ。既定では例文を載せません（出典厳密性の要求を避けるため）。`,
	].join('\n');

	const parts: string[] = [header + meta, ''];

	for (const deck of decks) {
		if (opts.only && deck.id !== opts.only) continue;

		const items = deck.rows
			.map((r) => normalizeRow(deck, r))
			.filter((it) => it.word || it.meaning || it.explanation);

		parts.push(`## ${deck.title}`);

		for (const it of items) {
			const head = `- **${normalizeWhitespace(it.word)}**（${normalizeWhitespace(it.reading)}）: ${normalizeWhitespace(
				it.meaning
			)}`;
			parts.push(head);

			const point = firstSentence(it.explanation);
			if (point) parts.push(`  - 要点: ${normalizeWhitespace(point)}`);

			const tags = pickTagsForQuickView(it.related);
			if (tags) parts.push(`  - 目印: ${tags}`);

			if (opts.includeExamples) {
				const e1 = normalizeWhitespace(it.example1);
				const e2 = normalizeWhitespace(it.example2);
				if (e1 || e2) parts.push(`  - 用例: ${[e1, e2].filter(Boolean).join(' / ')}`);
			}
		}

		parts.push('');
	}

	return parts.join('\n');
}

function renderTxt(decks: Deck[], opts: { only?: string; includeExamples: boolean }): string {
	const now = new Date();
	const lines: string[] = [];
	lines.push('古文・漢文 直前まとめ（テキスト版）');
	lines.push(`生成日: ${now.toISOString().slice(0, 10)}`);
	lines.push('入力: public/data/classical-japanese/*.csv');
	lines.push('方針: 直前チェック用に要点のみ。既定では例文を載せません。');
	lines.push('');

	for (const deck of decks) {
		if (opts.only && deck.id !== opts.only) continue;

		lines.push(deck.title);
		lines.push('-'.repeat(deck.title.length));

		const items = deck.rows
			.map((r) => normalizeRow(deck, r))
			.filter((it) => it.word || it.meaning || it.explanation);

		for (const it of items) {
			const w = normalizeWhitespace(it.word);
			const rd = normalizeWhitespace(it.reading);
			const m = normalizeWhitespace(it.meaning);
			const point = normalizeWhitespace(firstSentence(it.explanation));
			const tags = pickTagsForQuickView(it.related);

			lines.push(`・${w}${rd ? `（${rd}）` : ''}: ${m}`);
			if (point) lines.push(`  要点: ${point}`);
			if (tags) lines.push(`  目印: ${tags}`);

			if (opts.includeExamples) {
				const e1 = normalizeWhitespace(it.example1);
				const e2 = normalizeWhitespace(it.example2);
				const ex = [e1, e2].filter(Boolean).join(' / ');
				if (ex) lines.push(`  用例: ${ex}`);
			}
		}

		lines.push('');
	}

	return lines.join('\n');
}

function main(): void {
	const args = parseArgs(process.argv.slice(2));
	if (args.help || args.h) {
		printHelp();
		process.exit(0);
	}

	const root = path.join(process.cwd(), 'public/data/classical-japanese');
	const outDir = args.out
		? path.isAbsolute(String(args.out))
			? String(args.out)
			: path.join(process.cwd(), String(args.out))
		: path.join(root, 'print');

	const only = args.only ? String(args.only) : undefined;
	const format = args.format ? String(args.format) : 'both';
	const includeExamples = Boolean(args['include-examples']);

	ensureDir(outDir);

	console.log('=== 古典 直前テキスト生成 ===');
	console.log(`input: ${path.relative(process.cwd(), root)}`);
	console.log(`output: ${path.relative(process.cwd(), outDir)}`);
	if (only) console.log(`only: ${only}`);
	console.log(`format: ${format}`);
	console.log(`examples: ${includeExamples ? 'include' : 'omit'}`);

	const decks = loadDecks(root);
	const opts = { only, includeExamples };
	const base = path.join(outDir, '古文漢文まとめ_直前');

	if (format === 'md' || format === 'both') {
		const md = renderMd(decks, opts);
		fs.writeFileSync(`${base}.md`, md, 'utf-8');
		console.log(`✅ MD出力: ${path.relative(process.cwd(), `${base}.md`)}`);
	}

	if (format === 'txt' || format === 'both') {
		const txt = renderTxt(decks, opts);
		fs.writeFileSync(`${base}.txt`, txt, 'utf-8');
		console.log(`✅ TXT出力: ${path.relative(process.cwd(), `${base}.txt`)}`);
	}
}

try {
	main();
} catch (e) {
	console.error(`\n❌ エラー: ${String((e as any)?.message || e)}`);
	process.exit(1);
}

