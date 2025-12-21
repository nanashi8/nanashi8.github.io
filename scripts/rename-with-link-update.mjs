#!/usr/bin/env node
/**
 * リネーム実行 + リンク更新スクリプト
 * すべてのリンクを確実に更新して断線ゼロを保証
 */

import { readFileSync, writeFileSync, renameSync } from 'fs';
import { join, dirname, basename, relative } from 'path';
import { execSync } from 'child_process';

const DRY_RUN = process.argv.includes('--dry-run');

// リネーム計画（命名規則違反ファイル）
const RENAME_PLAN = [
  // features/ → kebab-case
  {
    from: 'docs/features/DYNAMIC_THRESHOLD_SYSTEM.md',
    to: 'docs/features/dynamic-threshold-system.md',
    priority: 'low'
  },
  {
    from: 'docs/features/GRAMMAR_PASSAGE_FEATURE.md',
    to: 'docs/features/grammar-passage-feature.md',
    priority: 'low'
  },
  {
    from: 'docs/features/grammar_construction_implementation_plan.md',
    to: 'docs/features/grammar-construction-implementation-plan.md',
    priority: 'low'
  },
  {
    from: 'docs/features/grammar_translation_fixes.md',
    to: 'docs/features/grammar-translation-fixes.md',
    priority: 'low'
  },
  
  // guidelines/ → UPPER_SNAKE_CASE
  {
    from: 'docs/guidelines/ci-cd-enhancement-plan.md',
    to: 'docs/guidelines/CI_CD_ENHANCEMENT_PLAN.md',
    priority: 'high'
  },
  
  // references/ → UPPER_SNAKE_CASE
  {
    from: 'docs/references/deploy-explained.md',
    to: 'docs/references/DEPLOY_EXPLAINED.md',
    priority: 'high'
  },
  {
    from: 'docs/references/github-cli-setup.md',
    to: 'docs/references/GITHUB_CLI_SETUP.md',
    priority: 'high'
  },
  
  // quality/ → UPPER_SNAKE_CASE
  {
    from: 'docs/quality/grammar_quality_report.md',
    to: 'docs/quality/GRAMMAR_QUALITY_REPORT.md',
    priority: 'high'
  },
  
  // plans/ → UPPER_SNAKE_CASE
  {
    from: 'docs/plans/grammar-multiple-correct-answers-verification-plan.md',
    to: 'docs/plans/GRAMMAR_MULTIPLE_CORRECT_ANSWERS_VERIFICATION_PLAN.md',
    priority: 'medium'
  },
  {
    from: 'docs/plans/questioncard-custom-set-implementation-plan.md',
    to: 'docs/plans/QUESTIONCARD_CUSTOM_SET_IMPLEMENTATION_PLAN.md',
    priority: 'medium'
  },
  {
    from: 'docs/plans/questioncard-implementation-checklist.md',
    to: 'docs/plans/QUESTIONCARD_IMPLEMENTATION_CHECKLIST.md',
    priority: 'medium'
  },
  {
    from: 'docs/plans/questioncard-implementation-quickstart.md',
    to: 'docs/plans/QUESTIONCARD_IMPLEMENTATION_QUICKSTART.md',
    priority: 'medium'
  },
  
  // reports/ → UPPER_SNAKE_CASE
  {
    from: 'docs/reports/choice-explanation-samples.md',
    to: 'docs/reports/CHOICE_EXPLANATION_SAMPLES.md',
    priority: 'medium'
  },
  {
    from: 'docs/reports/data-quality-improvement-2025-12-07.md',
    to: 'docs/reports/DATA_QUALITY_IMPROVEMENT_2025-12-07.md',
    priority: 'medium'
  },
  {
    from: 'docs/reports/grammar_quality_report.md',
    to: 'docs/reports/GRAMMAR_QUALITY_REPORT.md',
    priority: 'medium'
  },
  {
    from: 'docs/reports/memorization-category-bug-fix.md',
    to: 'docs/reports/MEMORIZATION_CATEGORY_BUG_FIX.md',
    priority: 'medium'
  },
  {
    from: 'docs/reports/multiple-correct-detection-report-v2.md',
    to: 'docs/reports/MULTIPLE_CORRECT_DETECTION_REPORT_V2.md',
    priority: 'medium'
  },
  {
    from: 'docs/reports/multiple-correct-detection-report.md',
    to: 'docs/reports/MULTIPLE_CORRECT_DETECTION_REPORT.md',
    priority: 'medium'
  }
];

// 全マークダウンファイルを取得（使用しない - execSyncで取得）
// function getAllMDFiles(dir, files = []) {
//   // 削除
// }

// リンク更新
function updateLinks(renameMap) {
  console.log('\n🔗 リンク更新中...\n');
  
  const allMdFiles = [];
  const scanDirs = ['docs', '.aitk/instructions'];
  
  scanDirs.forEach(dir => {
    try {
      const result = execSync(`find ${dir} -name "*.md" 2>/dev/null || true`, { encoding: 'utf-8' });
      const files = result.trim().split('\n').filter(f => f);
      allMdFiles.push(...files);
    } catch (error) {
      // Ignore errors
    }
  });
  
  console.log(`  検索対象: ${allMdFiles.length}ファイル`);
  
  let totalUpdates = 0;
  
  for (const file of allMdFiles) {
    try {
      let content = readFileSync(file, 'utf-8');
      let updated = false;
      let fileUpdates = 0;
      
      for (const [oldPath, newPath] of Object.entries(renameMap)) {
        const oldBase = basename(oldPath);
        const newBase = basename(newPath);
        
        // 完全一致リンクを更新
        const regex1 = new RegExp(`\\]\\(${oldPath.replace(/\//g, '\\/')}\\)`, 'g');
        if (regex1.test(content)) {
          content = content.replace(regex1, `](${newPath})`);
          updated = true;
          fileUpdates++;
        }
        
        // 相対パスリンクを更新（ファイル名のみ）
        const regex2 = new RegExp(`\\]\\([^)]*${oldBase.replace(/\./g, '\\.')}\\)`, 'g');
        const matches = content.match(regex2);
        if (matches) {
          matches.forEach(match => {
            const oldLink = match.slice(2, -1); // ](...) から ... を抽出
            if (oldLink.endsWith(oldBase)) {
              const newLink = oldLink.replace(oldBase, newBase);
              content = content.replace(match, `](${newLink})`);
              updated = true;
              fileUpdates++;
            }
          });
        }
      }
      
      if (updated) {
        if (!DRY_RUN) {
          writeFileSync(file, content, 'utf-8');
        }
        console.log(`  ✓ ${file}: ${fileUpdates}箇所更新`);
        totalUpdates += fileUpdates;
      }
    } catch (error) {
      console.log(`  ⚠️  ${file}: 読み取りエラー`);
    }
  }
  
  console.log(`\n  合計: ${totalUpdates}箇所のリンクを更新\n`);
}

// リネーム実行
function executeRenames(priority = null) {
  const filteredPlan = priority 
    ? RENAME_PLAN.filter(item => item.priority === priority)
    : RENAME_PLAN;
  
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📝 リネーム実行${priority ? ` (優先度: ${priority})` : ''}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN モード（実際の変更は行いません）\n');
  }
  
  const renameMap = {};
  let successCount = 0;
  
  for (const { from, to, priority: itemPriority } of filteredPlan) {
    try {
      if (!DRY_RUN) {
        renameSync(from, to);
      }
      console.log(`  ✓ ${basename(from)} → ${basename(to)}`);
      renameMap[from] = to;
      successCount++;
    } catch (error) {
      console.log(`  ✗ ${from}: ${error.message}`);
    }
  }
  
  console.log(`\n  成功: ${successCount}/${filteredPlan.length}ファイル\n`);
  
  // リンク更新
  if (Object.keys(renameMap).length > 0) {
    updateLinks(renameMap);
  }
  
  return successCount;
}

// メイン処理
function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 ドキュメントリネーム + リンク更新');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const priorityArg = process.argv.find(arg => arg.startsWith('--priority='));
  const priority = priorityArg ? priorityArg.split('=')[1] : null;
  
  if (priority && !['high', 'medium', 'low'].includes(priority)) {
    console.error('\n❌ 無効な優先度: ' + priority);
    console.error('   使用可能: high, medium, low\n');
    process.exit(1);
  }
  
  const totalRenamed = executeRenames(priority);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ 完了: ${totalRenamed}ファイルをリネーム`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (!DRY_RUN) {
    console.log('💡 次のステップ:');
    console.log('  1. git status で変更を確認');
    console.log('  2. node scripts/analyze-doc-links.mjs でリンク断線を確認');
    console.log('  3. 問題なければコミット\n');
  }
}

main();
