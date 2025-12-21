#!/usr/bin/env node
/**
 * Front Matter自動追加スクリプト
 * Git履歴から作成日・更新日を取得し、YAMLヘッダーを追加
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve } from 'path';

// ディレクトリ→カテゴリマッピング
const CATEGORY_MAP = {
  'specifications': 'specification',
  'design': 'design',
  'features': 'feature',
  'fixes': 'fix',
  'quality': 'quality',
  'guidelines': 'guideline',
  'plans': 'plan',
  'reports': 'report',
  'development': 'development',
  'processes': 'process',
  'maintenance': 'maintenance',
  'references': 'reference',
  'how-to': 'how-to',
  'roadmap': 'roadmap',
  'analysis': 'analysis',
  'archive': 'archive',
  'templates': 'template',
};

// ステータス推定（ファイル名/パスから）
function estimateStatus(filePath, content) {
  const lower = filePath.toLowerCase();
  
  // archive, deprecated → deprecated
  if (lower.includes('archive') || lower.includes('deprecated')) {
    return 'deprecated';
  }
  
  // COMPLETE, DONE, IMPLEMENTEDなどがタイトルにあれば→ implemented
  if (/complete|done|implemented|finished/i.test(content.slice(0, 500))) {
    return 'implemented';
  }
  
  // PLAN, TODO, PROPOSAL → planned
  if (/\b(plan|todo|proposal|draft)\b/i.test(content.slice(0, 500))) {
    return 'planned';
  }
  
  // デフォルトは in-progress
  return 'in-progress';
}

// タイトル抽出（最初の# ヘッダーまたはファイル名）
function extractTitle(content, fileName) {
  const match = content.match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();
  
  // ファイル名からタイトル生成
  return fileName
    .replace('.md', '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Git履歴から日付取得
function getGitDates(filePath) {
  try {
    // 最初のコミット日 (created)
    const created = execSync(
      `git log --follow --format=%ad --date=short "${filePath}" | tail -1`,
      { encoding: 'utf-8' }
    ).trim();
    
    // 最後のコミット日 (updated)
    const updated = execSync(
      `git log -1 --format=%ad --date=short "${filePath}"`,
      { encoding: 'utf-8' }
    ).trim();
    
    return { created: created || null, updated: updated || null };
  } catch (error) {
    return { created: null, updated: null };
  }
}

// カテゴリ抽出
function extractCategory(filePath) {
  const match = filePath.match(/docs\/([^/]+)/);
  if (!match) return 'other';
  
  const dir = match[1];
  return CATEGORY_MAP[dir] || 'other';
}

// タグ生成
function generateTags(filePath, content, category) {
  const tags = [category];
  
  // 内容からタグ抽出
  const lowerContent = content.toLowerCase();
  if (lowerContent.includes('ai')) tags.push('ai');
  if (lowerContent.includes('scheduler')) tags.push('scheduler');
  if (lowerContent.includes('adaptive')) tags.push('adaptive');
  if (lowerContent.includes('test')) tags.push('test');
  if (lowerContent.includes('dark mode') || lowerContent.includes('dark-mode')) tags.push('dark-mode');
  
  return [...new Set(tags)]; // 重複削除
}

// Front Matter生成
function generateFrontMatter(filePath, content) {
  const fileName = filePath.split('/').pop();
  const title = extractTitle(content, fileName);
  const { created, updated } = getGitDates(filePath);
  const category = extractCategory(filePath);
  const status = estimateStatus(filePath, content);
  const tags = generateTags(filePath, content, category);
  
  const today = new Date().toISOString().split('T')[0];
  
  return `---
title: ${title}
created: ${created || today}
updated: ${updated || today}
status: ${status}
tags: [${tags.join(', ')}]
---

`;
}

// Front Matterチェック
function hasFrontMatter(content) {
  return /^---\s*\n/.test(content);
}

// メイン処理
function processMDFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    
    // 既にFront Matterがあればスキップ
    if (hasFrontMatter(content)) {
      console.log(`⏭️  スキップ: ${filePath} (既存)`);
      return false;
    }
    
    const frontMatter = generateFrontMatter(filePath, content);
    const newContent = frontMatter + content;
    
    writeFileSync(filePath, newContent, 'utf-8');
    console.log(`✅ 追加: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ エラー: ${filePath}`, error.message);
    return false;
  }
}

// エントリーポイント
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('使用法: node add-frontmatter.mjs <file1.md> [file2.md ...]');
    process.exit(1);
  }
  
  let processed = 0;
  let skipped = 0;
  
  for (const arg of args) {
    const filePath = resolve(arg);
    if (processMDFile(filePath)) {
      processed++;
    } else {
      skipped++;
    }
  }
  
  console.log(`\n📊 完了: ${processed}件追加, ${skipped}件スキップ`);
}

main();
