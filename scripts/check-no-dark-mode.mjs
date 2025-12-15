#!/usr/bin/env node

/**
 * 🚨 ダークモード禁止チェッカー
 *
 * 現在の方針: ダークモードは使用しない
 * このスクリプトはコミット前にdark:クラスの使用を検出し、コミットをブロックします
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const ALLOWED_EXCEPTIONS = [
  // ドキュメント・ガイドファイルは除外
  '.md',
  '.json',
  'docs/design/DARK_MODE_GUIDE.md',
  '.copilot-instructions.md',
  // このチェッカー自体
  'check-no-dark-mode.mjs',
];

const TARGET_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.css'];

let violations = [];

/**
 * ディレクトリを再帰的にスキャン
 */
function scanDirectory(dir, baseDir = '') {
  const files = readdirSync(dir);

  for (const file of files) {
    const fullPath = join(dir, file);
    const relativePath = join(baseDir, file);
    const stat = statSync(fullPath);

    // node_modules, .git, distなどは除外
    if (file === 'node_modules' || file === '.git' || file === 'dist' ||
        file === 'coverage' || file === 'build' || file === '.next') {
      continue;
    }

    if (stat.isDirectory()) {
      scanDirectory(fullPath, relativePath);
    } else if (stat.isFile()) {
      const ext = extname(file);
      if (TARGET_EXTENSIONS.includes(ext)) {
        checkFile(fullPath, relativePath);
      }
    }
  }
}

/**
 * ファイル内のdark:クラスをチェック
 */
function checkFile(filePath, relativePath) {
  // 除外ファイルチェック
  for (const exception of ALLOWED_EXCEPTIONS) {
    if (relativePath.includes(exception)) {
      return;
    }
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // dark: プレフィックスを検出
      const darkMatches = line.match(/dark:[a-z-]+/g);
      if (darkMatches) {
        violations.push({
          file: relativePath,
          line: index + 1,
          content: line.trim(),
          matches: darkMatches,
        });
      }

      // .dark-mode セレクタを検出（CSSファイル）
      if (filePath.endsWith('.css') && line.includes('.dark-mode')) {
        violations.push({
          file: relativePath,
          line: index + 1,
          content: line.trim(),
          matches: ['.dark-mode'],
        });
      }
    });
  } catch (error) {
    console.error(`❌ ファイル読み込みエラー: ${relativePath}`);
  }
}

/**
 * メイン処理
 */
function main() {
  console.log('🔍 ダークモードクラス禁止チェック開始...\n');

  const srcDir = join(process.cwd(), 'src');
  scanDirectory(srcDir, 'src');

  if (violations.length === 0) {
    console.log('✅ ダークモードクラスは検出されませんでした\n');
    process.exit(0);
  }

  // 違反を報告
  console.error('🚨 ダークモードクラスが検出されました！\n');
  console.error('現在の方針: ダークモードは使用しません\n');
  console.error('違反箇所:\n');

  violations.forEach(({ file, line, content, matches }) => {
    console.error(`📄 ${file}:${line}`);
    console.error(`   ${content}`);
    console.error(`   検出: ${matches.join(', ')}\n`);
  });

  console.error('\n📋 修正方法:');
  console.error('1. dark: プレフィックスをすべて削除してください');
  console.error('2. .dark-mode セレクタを削除してください\n');
  console.error('例:');
  console.error('  ❌ className="bg-white dark:bg-gray-800"');
  console.error('  ✅ className="bg-white"\n');
  console.error('一括削除コマンド:');
  console.error('  find src -name "*.tsx" -exec sed -i \'\' \'s/ dark:[a-z-]*[a-z0-9-]*//g\' {} \\;\n');

  console.error(`合計 ${violations.length} 件の違反が見つかりました\n`);
  process.exit(1);
}

main();
