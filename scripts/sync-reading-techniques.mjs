#!/usr/bin/env node

/**
 * Sync reading-techniques JSON files from docs/private/reading-techniques
 * into public/data/reading-techniques so the app can fetch them via /data/...
 */

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const srcDir = path.join(repoRoot, 'docs', 'private', 'reading-techniques');
const destDir = path.join(repoRoot, 'public', 'data', 'reading-techniques');

const files = [
  'paragraph_reading_patterns.json',
  'sentence_reading_patterns.json',
  'question_type_strategies.json',
  'reading100_paraphrased.json',
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function assertUniqueIds(items, label) {
  const ids = items.map((x) => x?.id).filter(Boolean);
  const seen = new Set();
  const dup = [];
  for (const id of ids) {
    if (seen.has(id)) dup.push(id);
    seen.add(id);
  }
  if (dup.length) {
    throw new Error(`[sync-reading-techniques] Duplicate ids in ${label}: ${dup.join(', ')}`);
  }
}

function validate(fileName, data) {
  if (fileName === 'paragraph_reading_patterns.json') {
    if (!Array.isArray(data.patterns)) throw new Error('patterns must be an array');
    assertUniqueIds(data.patterns, fileName);
  }
  if (fileName === 'sentence_reading_patterns.json') {
    if (!Array.isArray(data.patterns)) throw new Error('patterns must be an array');
    assertUniqueIds(data.patterns, fileName);
  }
  if (fileName === 'question_type_strategies.json') {
    if (!Array.isArray(data.strategies)) throw new Error('strategies must be an array');
    assertUniqueIds(data.strategies, fileName);
  }
  if (fileName === 'reading100_paraphrased.json') {
    if (!Array.isArray(data.techniques)) throw new Error('techniques must be an array');
    assertUniqueIds(data.techniques, fileName);
  }
}

function main() {
  if (!fs.existsSync(srcDir)) {
    console.error(`[sync-reading-techniques] Source directory not found: ${srcDir}`);
    process.exit(1);
  }

  ensureDir(destDir);

  for (const fileName of files) {
    const from = path.join(srcDir, fileName);
    const to = path.join(destDir, fileName);

    if (!fs.existsSync(from)) {
      console.error(`[sync-reading-techniques] Missing source file: ${from}`);
      process.exit(1);
    }

    const data = readJson(from);
    validate(fileName, data);

    fs.copyFileSync(from, to);
    console.log(`✓ Synced ${fileName}`);
  }

  console.log(`Done. Output: ${path.relative(repoRoot, destDir)}`);
}

main();
