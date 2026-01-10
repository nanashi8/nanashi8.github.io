/**
 * 英文データを読み込んで、3種類の分割（/分割、()分割、語句分割）を適用し、
 * 処理済みデータを生成するスクリプト
 */

import * as fs from 'fs';
import * as path from 'path';

// 分割関数をインポート
import { splitWithSlash } from './slashSplitLogic';
import { splitWithParentheses } from './parenSplitLogic';
import { splitIntoVocabularyChunks } from './vocabularySplitLogic';

interface ProcessedPassage {
  id: string;
  original: string;
  slashSplit: string;
  parenSplit: string;
  vocabularySplit: string;
}

/**
 * テキストファイルを読み込んで文ごとに分割
 */
function loadPassageFile(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // 対話文を文単位に分割（ピリオドまたは疑問符で区切り、話者情報は除去）
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  const sentences: string[] = [];
  
  lines.forEach(line => {
    // 話者部分を除去 (例: "Becky : " → "")
    const text = line.replace(/^[A-Za-z]+\s*:\s*/, '').trim();
    if (text) {
      // 文ごとに分割（.または?で終わる）
      const parts = text.match(/[^.?!]+[.?!]+/g) || [];
      sentences.push(...parts.map(s => s.trim()));
    }
  });
  
  return sentences;
}

/**
 * 単一のpassageファイルを処理
 */
function processPassageFile(inputPath: string, outputDir: string): void {
  const filename = path.basename(inputPath, '.txt');
  const sentences = loadPassageFile(inputPath);
  
  console.log(`\n処理中: ${filename}`);
  console.log(`文の数: ${sentences.length}`);
  
  const processedData: ProcessedPassage[] = sentences.map((sentence, index) => {
    return {
      id: `${filename}_${index + 1}`,
      original: sentence,
      slashSplit: splitWithSlash(sentence),
      parenSplit: splitWithParentheses(sentence),
      vocabularySplit: splitIntoVocabularyChunks(sentence)
    };
  });
  
  // 出力ディレクトリが存在しない場合は作成
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // JSON形式で出力
  const outputPath = path.join(outputDir, `${filename}_processed.json`);
  fs.writeFileSync(
    outputPath,
    JSON.stringify(processedData, null, 2),
    'utf-8'
  );
  
  console.log(`✓ 出力完了: ${outputPath}`);
  console.log(`  処理済み文: ${processedData.length}件`);
}

/**
 * 複数のpassageファイルをバッチ処理
 */
function processAllPassages(inputDir: string, outputDir: string): void {
  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.txt'));
  
  console.log(`\n=== パッセージデータ一括処理 ===`);
  console.log(`入力ディレクトリ: ${inputDir}`);
  console.log(`出力ディレクトリ: ${outputDir}`);
  console.log(`対象ファイル数: ${files.length}件\n`);
  
  files.forEach(file => {
    const inputPath = path.join(inputDir, file);
    try {
      processPassageFile(inputPath, outputDir);
    } catch (error) {
      console.error(`✗ エラー: ${file}`, error);
    }
  });
  
  console.log(`\n=== 処理完了 ===`);
}

// メイン処理
const args = process.argv.slice(2);

if (args.length === 0) {
  // 引数なし: デフォルトで全ファイル処理
  const currentDir = path.dirname(new URL(import.meta.url).pathname);
  const inputDir = path.join(currentDir, '../../public/data/passages-original');
  const outputDir = path.join(currentDir, '../../public/data/passages-processed');
  processAllPassages(inputDir, outputDir);
} else if (args.length === 1) {
  // 引数1つ: 単一ファイル処理
  const inputPath = args[0];
  const currentDir = path.dirname(new URL(import.meta.url).pathname);
  const outputDir = path.join(currentDir, '../../public/data/passages-processed');
  processPassageFile(inputPath, outputDir);
} else {
  console.log('使用方法:');
  console.log('  npx tsx src/utils/generateSplitData.ts                    # 全ファイル処理');
  console.log('  npx tsx src/utils/generateSplitData.ts <inputFile>         # 単一ファイル処理');
}

export { processPassageFile, processAllPassages };
