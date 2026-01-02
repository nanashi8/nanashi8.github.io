#!/usr/bin/env tsx

/**
 * Reading grammar-tag sanity checker (tracked).
 *
 * Purpose:
 * - Prevent recurring O/M mislabels in the Reading tab caused by heuristic tagging.
 * - Specifically validates that frequency expressions like "every morning" are tagged as M (modifier),
 *   not O (object).
 *
 * Usage:
 *   npx tsx scripts/check-reading-grammar-tags.ts
 *
 * Exit:
 * - 0 if no issues
 * - 1 if violations are found
 */

import fs from 'node:fs';
import path from 'node:path';
import { analyzeSentence } from '../src/utils/grammarAnalyzer';

type Issue = {
  file: string;
  sentence: string;
  phrase: string;
  tokenTag: string | undefined;
};

const repoRoot = process.cwd();

const CANDIDATE_DIRS = [
  path.join(repoRoot, 'public', 'data', 'passages-original'),
  // NOTE: there is a known historical typo directory; include it to avoid missing checks.
  path.join(repoRoot, 'public', 'data', 'passages', 'pasasges-original'),
];

const EVERY_TIME_NOUNS = [
  'morning',
  'afternoon',
  'evening',
  'night',
  'day',
  'week',
  'month',
  'year',
  'weekend',
  'weekends',
];

const everyTimeRegex = new RegExp(`\\bevery\\s+(${EVERY_TIME_NOUNS.join('|')})\\b`, 'i');

function walkFiles(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;

  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    if (!current) break;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(current, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile()) out.push(full);
    }
  }
  return out;
}

function splitIntoSentences(text: string): string[] {
  // Simple sentence split good enough for the targeted pattern check.
  const matches = text
    .replace(/\r\n/g, '\n')
    .match(/[^.!?\n]+[.!?]/g);

  if (!matches) return [];
  return matches.map((s) => s.trim()).filter(Boolean);
}

function main(): void {
  const txtFiles = CANDIDATE_DIRS.flatMap((d) => walkFiles(d)).filter((p) => p.endsWith('.txt'));

  /** @type {Issue[]} */
  const issues: Issue[] = [];

  for (const filePath of txtFiles) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const sentences = splitIntoSentences(raw);

    for (const sentence of sentences) {
      const m = sentence.match(everyTimeRegex);
      if (!m) continue;

      const timeNoun = m[1];
      const phrase = `every ${timeNoun}`;

      const tokens = analyzeSentence(sentence);
      const token = tokens.find((t) => t.word.toLowerCase() === String(timeNoun).toLowerCase());

      if (token?.tag !== 'M') {
        issues.push({
          file: path.relative(repoRoot, filePath),
          sentence,
          phrase,
          tokenTag: token?.tag,
        });
      }
    }
  }

  if (issues.length === 0) {
    console.log('✅ Reading grammar-tag sanity check passed (every + time noun => M)');
    return;
  }

  console.log('❌ Reading grammar-tag sanity check failed');
  console.log(`Found ${issues.length} violation(s):`);
  console.log('');

  for (const issue of issues.slice(0, 30)) {
    console.log(`- File: ${issue.file}`);
    console.log(`  Phrase: ${issue.phrase}`);
    console.log(`  Tagged as: ${issue.tokenTag ?? '(missing token)'}`);
    console.log(`  Sentence: ${issue.sentence}`);
    console.log('');
  }

  if (issues.length > 30) {
    console.log(`... and ${issues.length - 30} more`);
  }

  process.exit(1);
}

main();
