#!/usr/bin/env node
/**
 * passages-originalから passages-sentencesファイルを生成するスクリプト
 * 文単位で分割したテキストファイルを生成
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, basename } from 'path';

/**
 * テキストを文単位に分割
 */
function splitIntoSentences(text) {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const sentences = [];

  lines.forEach(line => {
    // 話者部分を除去 (例: "Sam : " → "")
    const text = line.replace(/^[A-Za-z]+\s*:\s*/, '').trim();
    if (text) {
      // 文ごとに分割（.!?で終わる単位）
      const parts = text.match(/[^.?!]+[.?!]+/g) || [];
      sentences.push(...parts.map(s => s.trim()));
    }
  });

  return sentences;
}

/**
 * 単一ファイルを処理
 */
function processFile(inputPath, outputPath) {
  const filename = basename(inputPath, '.txt');
  console.log(`\n処理中: ${filename}`);

  const content = readFileSync(inputPath, 'utf-8');
  const sentences = splitIntoSentences(content);

  console.log(`  文の数: ${sentences.length}`);

  // 文を改行で結合
  const output = sentences.join('\n') + '\n';
  writeFileSync(outputPath, output, 'utf-8');

  console.log(`✓ 出力完了: ${outputPath}`);
}

/**
 * 全ファイルを処理
 */
function processAllFiles(options) {
  const { inputDir, outputDir } = options;

  console.log(`\n=== passages-sentences 生成 ===`);
  console.log(`入力ディレクトリ: ${inputDir}`);
  console.log(`出力ディレクトリ: ${outputDir}`);

  // 出力ディレクトリ作成
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // .txtファイルのみ処理
  const files = readdirSync(inputDir).filter(f => f.endsWith('.txt'));
  console.log(`対象ファイル数: ${files.length}件\n`);

  files.forEach(file => {
    const inputPath = join(inputDir, file);
    const outputFilename = file.replace('.txt', '_sentences.txt');
    const outputPath = join(outputDir, outputFilename);

    try {
      processFile(inputPath, outputPath);
    } catch (error) {
      console.error(`✗ エラー: ${file}`, error);
    }
  });

  console.log(`\n=== 処理完了 ===`);
  console.log(`生成ファイル数: ${files.length}件`);
}

// メイン処理
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const repoRoot = join(__dirname, '..');

const inputDir = join(repoRoot, 'public/data/passages-original');
const outputDir = join(repoRoot, 'public/data/passages-sentences');

processAllFiles({ inputDir, outputDir });
