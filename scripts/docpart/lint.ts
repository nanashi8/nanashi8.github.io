/**
 * Document Component System - Lint Command
 * 
 * マッピングファイルの検証
 */

import { join } from 'path';
import { existsSync } from 'fs';
import type { ValidationResult } from './core/types.js';
import { loadComponentMap, validateComponentMap, findUnresolvedRequires } from './core/parser.js';
import { findOrphanedComponents, detectCycles } from './core/analyzer.js';
import { loadConfig } from './core/config.js';

/**
 * lint コマンドの実行
 */
export async function lintCommand(options: { configPath?: string } = {}) {
  const config = loadConfig(options.configPath);
  const componentsPath = join(config.outputDir, '_components.yaml');

  if (!existsSync(componentsPath)) {
    console.error(`❌ ${componentsPath} not found. Run 'npm run docpart init' first.`);
    process.exit(1);
  }

  console.log('🔍 Validating', componentsPath, '...\n');

  const componentMap = loadComponentMap(componentsPath);

  let hasErrors = false;
  let totalErrors = 0;
  let totalWarnings = 0;

  // 1. 構造検証
  const structureResults = validateComponentMap(componentMap);
  if (structureResults.length > 0) {
    console.log('❌ Structure validation failed:\n');
    printResults(structureResults);
    hasErrors = true;
    totalErrors += countErrors(structureResults);
    totalWarnings += countWarnings(structureResults);
  } else {
    console.log('✅ Structure: OK');
  }

  // 2. 未解決 requires
  const unresolvedResults = findUnresolvedRequires(componentMap);
  if (unresolvedResults.length > 0) {
    if (config.lint.unresolvedAsWarning) {
      console.log('\n⚠️  Unresolved requires (warnings):\n');
      totalWarnings += unresolvedResults.length;
    } else {
      console.log('\n❌ Unresolved requires:\n');
      hasErrors = true;
      totalErrors += countErrors(unresolvedResults);
    }
    printResults(unresolvedResults);
  } else {
    console.log('✅ Requires: All resolved');
  }

  // 3. 孤立部品
  if (config.lint.detectOrphans) {
    const orphanResults = findOrphanedComponents(componentMap);
    if (orphanResults.length > 0) {
      console.log('\n⚠️  Orphaned components:\n');
      printResults(orphanResults);
      totalWarnings += countWarnings(orphanResults);
    } else {
      console.log('✅ No orphaned components');
    }
  }

  // 4. 循環依存
  if (config.lint.detectCycles) {
    const cycleResults = detectCycles(componentMap);
    if (cycleResults.length > 0) {
      console.log('\n⚠️  Circular dependencies detected:\n');
      printResults(cycleResults);
      totalWarnings += countWarnings(cycleResults);
    } else {
      console.log('✅ No circular dependencies');
    }
  }

  // サマリー
  console.log('\n' + '─'.repeat(50));
  console.log(`Summary: ${totalErrors} errors, ${totalWarnings} warnings`);

  if (hasErrors) {
    process.exit(1);
  }
}

/**
 * 検証結果を表示
 */
function printResults(results: ValidationResult[]) {
  for (const result of results) {
    console.log(`  ${result.filePath}`);

    for (const error of result.errors) {
      console.log(`    ❌ ${error.message}`);
      if (error.field) {
        console.log(`       Field: ${error.field}`);
      }
      if (error.value) {
        console.log(`       Value: ${error.value}`);
      }
    }

    for (const warning of result.warnings) {
      console.log(`    ⚠️  ${warning.message}`);
    }

    console.log('');
  }
}

/**
 * エラー数をカウント
 */
function countErrors(results: ValidationResult[]): number {
  return results.reduce((sum, r) => sum + r.errors.length, 0);
}

/**
 * 警告数をカウント
 */
function countWarnings(results: ValidationResult[]): number {
  return results.reduce((sum, r) => sum + r.warnings.length, 0);
}
