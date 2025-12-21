#!/usr/bin/env node
/**
 * ドキュメントリンク構造分析スクリプト
 * 断線リスクを事前に検出
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, dirname, resolve } from 'path';

const DOCS_DIR = 'docs';

// 全マークダウンファイルを取得
function getAllMDFiles(dir, files = []) {
  const items = readdirSync(dir);
  for (const item of items) {
    const fullPath = join(dir, item);
    if (statSync(fullPath).isDirectory()) {
      getAllMDFiles(fullPath, files);
    } else if (item.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

// リンク抽出
function extractLinks(content, filePath) {
  const links = [];
  const regex = /\[([^\]]+)\]\(([^)]+\.md[^)]*)\)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const [, text, target] = match;
    links.push({ text, target, source: filePath });
  }

  return links;
}

// リンク解決（相対パス→絶対パス）
function resolveLink(sourceFile, targetPath) {
  const sourceDir = dirname(sourceFile);
  const resolved = resolve(sourceDir, targetPath);
  return resolved;
}

// 分析実行
function analyzeLinks() {
  const files = getAllMDFiles(DOCS_DIR);
  const allLinks = [];
  const brokenLinks = [];
  const linkGraph = {}; // ファイル→被参照数

  console.log(`📁 分析対象: ${files.length}ファイル\n`);

  // リンク抽出
  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const links = extractLinks(content, file);

    for (const link of links) {
      allLinks.push(link);

      // リンク解決
      const resolved = resolveLink(file, link.target);

      // 被参照カウント
      if (!linkGraph[resolved]) {
        linkGraph[resolved] = 0;
      }
      linkGraph[resolved]++;

      // 断線チェック
      try {
        readFileSync(resolved, 'utf-8');
      } catch (error) {
        brokenLinks.push({ ...link, resolved });
      }
    }
  }

  // 結果表示
  console.log(`🔗 総リンク数: ${allLinks.length}`);
  console.log(`❌ 断線リンク: ${brokenLinks.length}\n`);

  if (brokenLinks.length > 0) {
    console.log('⚠️  断線リンク詳細:');

    // 断線をファイル別にグループ化
    const brokenByFile = {};
    brokenLinks.forEach(({ source, target, resolved }) => {
      if (!brokenByFile[source]) {
        brokenByFile[source] = [];
      }
      brokenByFile[source].push({ target, resolved });
    });

    // ファイルごとに表示
    Object.entries(brokenByFile).forEach(([source, targets]) => {
      console.log(`  ${source} (${targets.length}箇所)`);
      targets.forEach(({ target }) => {
        console.log(`    → ${target}`);
      });
    });
    console.log();
  }

  // 最も参照されているファイル
  const topReferenced = Object.entries(linkGraph)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  console.log('📊 最も参照されているファイル (Top 15):');
  topReferenced.forEach(([file, count]) => {
    const rel = relative(process.cwd(), file);
    console.log(`  ${count.toString().padStart(3)}回 - ${rel}`);
  });

  // 警告: ファイル名変更厳禁リスト
  const criticalFiles = topReferenced.filter(([, count]) => count >= 10);
  if (criticalFiles.length > 0) {
    console.log('\n⚠️  【警告】以下のファイルは10回以上参照されています:');
    console.log('   ファイル名変更・移動は断線リスク大！');
    criticalFiles.forEach(([file, count]) => {
      const rel = relative(process.cwd(), file);
      console.log(`   - ${rel} (${count}回)`);
    });
  }

  return {
    totalFiles: files.length,
    totalLinks: allLinks.length,
    brokenLinks: brokenLinks.length,
    criticalFiles: criticalFiles.map(([f]) => relative(process.cwd(), f)),
  };
}

// 実行
const result = analyzeLinks();

if (result.brokenLinks > 0) {
  console.log('\n❌ 断線リンクが存在します。修正が必要です。');
  process.exit(1);
} else {
  console.log('\n✅ 全リンクが正常です。');
}
