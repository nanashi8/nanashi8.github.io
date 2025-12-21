#!/usr/bin/env node
/**
 * 命名規則違反ファイルの分析とリネーム計画作成
 * 参照: docs/guidelines/DOCUMENT_NAMING_CONVENTION.md
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename, relative } from 'path';

const DOCS_DIR = 'docs';

// 命名規則チェック関数
function checkNamingConvention(filePath) {
  const dir = dirname(filePath);
  const base = basename(filePath);
  
  // README.md と INDEX.md は除外
  if (base === 'README.md' || base === 'INDEX.md') {
    return { valid: true, reason: 'Special file' };
  }
  
  // archive内は除外
  if (filePath.includes('/archive/')) {
    return { valid: true, reason: 'Archived file' };
  }
  
  const dirName = dir.split('/').pop();
  
  switch (dirName) {
    case 'specifications':
      // 番号付きkebab-case または UPPER_SNAKE_CASE
      if (/^[0-9]{2}-[a-z0-9-]+\.md$/.test(base) || /^[A-Z_]+\.md$/.test(base)) {
        return { valid: true };
      }
      return { 
        valid: false, 
        expected: '01-project-overview.md or ADAPTIVE_NETWORK_API.md',
        reason: 'Should be numbered kebab-case or UPPER_SNAKE_CASE'
      };
      
    case 'guidelines':
      if (/^[A-Z][A-Z0-9_]*\.md$/.test(base)) {
        return { valid: true };
      }
      return { 
        valid: false, 
        expected: 'META_AI_TROUBLESHOOTING.md',
        reason: 'Should be UPPER_SNAKE_CASE'
      };
      
    case 'references':
      if (/^[A-Z][A-Z0-9_]*\.md$/.test(base)) {
        return { valid: true };
      }
      return { 
        valid: false, 
        expected: 'QUICK_REFERENCE.md',
        reason: 'Should be UPPER_SNAKE_CASE'
      };
      
    case 'development':
      // kebab-case または UPPER_SNAKE_CASE
      if (/^[a-z][a-z0-9-]*\.md$/.test(base) || /^[A-Z][A-Z0-9_]*\.md$/.test(base)) {
        return { valid: true };
      }
      return { 
        valid: false, 
        expected: 'setup.md or TYPESCRIPT_DEVELOPMENT_GUIDELINES.md',
        reason: 'Should be kebab-case or UPPER_SNAKE_CASE'
      };
      
    case 'plans':
    case 'reports':
    case 'quality':
    case 'how-to':
    case 'processes':
    case 'maintenance':
      // UPPER_SNAKE_CASE (オプショナルな日付)
      if (/^[A-Z][A-Z0-9_]*(_[0-9]{4}-[0-9]{2}-[0-9]{2})?\.md$/.test(base)) {
        return { valid: true };
      }
      return { 
        valid: false, 
        expected: 'LINK_FIX_PLAN.md or PLAN_2025-12-17.md',
        reason: 'Should be UPPER_SNAKE_CASE with optional date'
      };
      
    case 'features':
      if (/^[a-z][a-z0-9-]*\.md$/.test(base)) {
        return { valid: true };
      }
      return { 
        valid: false, 
        expected: 'random-skip-feature.md',
        reason: 'Should be kebab-case'
      };
      
    default:
      // その他（サブディレクトリなど）
      if (dir.includes('guidelines/')) {
        return checkNamingConvention(dir.replace(/\/[^/]+$/, '') + '/' + base);
      }
      return { valid: true, reason: 'Unknown directory' };
  }
}

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

// リネーム提案を生成
function suggestRename(filePath) {
  const dir = dirname(filePath);
  const base = basename(filePath);
  const dirName = dir.split('/').pop();
  
  // kebab-case → UPPER_SNAKE_CASE
  if (/^[a-z][a-z0-9-]*\.md$/.test(base)) {
    const upperSnake = base
      .replace(/\.md$/, '')
      .split('-')
      .map(word => word.toUpperCase())
      .join('_') + '.md';
    
    if (['guidelines', 'references', 'plans', 'reports', 'quality', 'how-to', 'processes', 'maintenance'].includes(dirName)) {
      return join(dir, upperSnake);
    }
  }
  
  // UPPER_SNAKE_CASE → kebab-case (features only)
  if (dirName === 'features' && /^[A-Z_]+\.md$/.test(base)) {
    const kebab = base
      .replace(/\.md$/, '')
      .toLowerCase()
      .replace(/_/g, '-') + '.md';
    return join(dir, kebab);
  }
  
  return null;
}

// メイン処理
function analyzeNamingConventions() {
  const files = getAllMDFiles(DOCS_DIR);
  const violations = [];
  const valid = [];
  
  for (const file of files) {
    const check = checkNamingConvention(file);
    if (check.valid) {
      valid.push({ file, reason: check.reason });
    } else {
      const suggestedPath = suggestRename(file);
      violations.push({
        file,
        reason: check.reason,
        expected: check.expected,
        suggested: suggestedPath ? relative(process.cwd(), suggestedPath) : null
      });
    }
  }
  
  // 結果表示
  console.log(`📊 命名規則分析結果\n`);
  console.log(`総ファイル数: ${files.length}`);
  console.log(`✅ 規則準拠: ${valid.length}ファイル`);
  console.log(`❌ 規則違反: ${violations.length}ファイル\n`);
  
  if (violations.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  命名規則違反ファイル一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // ディレクトリ別にグループ化
    const byDir = {};
    violations.forEach(v => {
      const dir = dirname(v.file);
      if (!byDir[dir]) byDir[dir] = [];
      byDir[dir].push(v);
    });
    
    Object.entries(byDir).forEach(([dir, items]) => {
      console.log(`\n📁 ${dir}/`);
      items.forEach(({ file, reason, expected, suggested }) => {
        const base = basename(file);
        console.log(`  ❌ ${base}`);
        console.log(`     理由: ${reason}`);
        console.log(`     期待: ${expected}`);
        if (suggested) {
          console.log(`     提案: ${basename(suggested)}`);
        }
      });
    });
    
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 リネーム実施の優先度');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('【高】guidelines/, references/, quality/');
    console.log('  → 頻繁に参照される重要文書\n');
    console.log('【中】plans/, reports/, processes/');
    console.log('  → プロジェクト管理文書\n');
    console.log('【低】features/, development/');
    console.log('  → 日常的な文書\n');
  }
  
  return { violations, valid };
}

// 実行
const result = analyzeNamingConventions();

if (result.violations.length > 0) {
  console.log('💡 次のステップ:');
  console.log('  1. リネーム+リンク更新スクリプトを実行');
  console.log('  2. 段階的にリネーム実施（高優先度から）');
  console.log('  3. Pre-commit Hookで今後の違反を防止\n');
  process.exit(1);
} else {
  console.log('✅ すべてのファイルが命名規則に準拠しています！\n');
}
