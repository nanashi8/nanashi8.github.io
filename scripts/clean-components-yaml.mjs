#!/usr/bin/env node
/**
 * _components.yamlから存在しないファイルのエントリを削除するスクリプト
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const componentsFile = path.resolve(__dirname, '../docs/_components.yaml');

// 存在しないファイルのリスト（ビルドログから抽出）
const missingFiles = [
  'docs/ADAPTIVE_GUARD_SYSTEM.md',
  'docs/CONSTELLATION_ENHANCEMENT_ROADMAP.md',
  'docs/DOCUMENTATION_OPERATIONS.md',
  'docs/DOCUMENTATION_ORGANIZATION_PLAN.md',
  'docs/GIT_HISTORY_LEARNING.md',
  'docs/GIT_HISTORY_LEARNING_REPORT.md',
  'docs/GOVERNANCE_INTEGRATION_PLAN.md',
  'docs/IMPLEMENTATION_PLAN_SUMMARY.md',
  'docs/ML_OPERATION_GUIDE.md',
  'docs/PHASE1_2_COMPLETION_REPORT.md',
  'docs/PHASE1_DETAILED_DESIGN.md',
  'docs/PROTOTYPE_VALIDATION_CHECKLIST.md',
  'docs/QUALITY_ASSURANCE_SYSTEM_REPORT.md',
  'docs/REFACTORING_IMPACT_ANALYSIS.md',
  'docs/REFACTORING_PROPOSAL.md',
  'docs/archive/2025/reports/LEARNING_AI_TEST_REPORT.md',
  'docs/archive/legacy-root-docs/AI_PROJECT_COMPLETE.md',
  'docs/archive/legacy-root-docs/FINAL_PROJECT_REPORT.md',
  'docs/archive/legacy-root-docs/INTEGRATED_QUALITY_PIPELINE.md',
  'docs/archive/legacy-root-docs/PHASE3_COMPLETION_REPORT.md',
  'docs/development/INTEGRATION_TEST_REPORT.md',
  'docs/features/CONSTELLATION_GUIDE.md',
  'docs/guidelines/TEST_SPECIFICATION_TEMPLATE.md',
  'docs/plans/LINK_FIX_PLAN.md',
  'docs/plans/PHASE1_COMPLETION_REPORT.md',
  'docs/plans/PHASE_2_PROJECT_SERVANT_TESTS_COMPLETE.md',
  'docs/plans/STRATEGY_PATTERN_IMPLEMENTATION_PLAN.md',
  'docs/private/CS229_Machine_Learning/CS229_01_Machine Learning Course_explained_simple_expanded_ja.md',
  'docs/private/CS229_Machine_Learning/CS229_01_Machine Learning Course_explained_simple_ja.md',
  'docs/private/CS229_Machine_Learning/CS229_01_Machine Learning Course_ja.md',
  'docs/private/CS229_Machine_Learning/CS229_02_Linear Regression and Gradient Descent_explained_simple_expanded_ja.md',
  'docs/private/CS229_Machine_Learning/CS229_02_Linear Regression and Gradient Descent_explained_simple_ja.md',
  'docs/private/CS229_Machine_Learning/CS229_02_Linear Regression and Gradient Descent_ja.md',
  'docs/private/CS229_Machine_Learning/CS229_03_Locally Weighted & Logistic Regression_explained_simple_expanded_ja.md',
  'docs/private/CS229_Machine_Learning/CS229_03_Locally Weighted & Logistic Regression_explained_simple_ja.md',
  'docs/private/CS229_Machine_Learning/CS229_03_Locally Weighted & Logistic Regression_ja.md',
  'docs/private/CS229_Machine_Learning/CS229_04_Perceptron & Generalized Linear Model_explained_simple_expanded_ja.md',
];

console.log(`📋 _components.yamlのクリーニング開始...`);
console.log(`削除対象: ${missingFiles.length}個のエントリ`);

// YAMLファイルを読み込み
const content = fs.readFileSync(componentsFile, 'utf-8');
const lines = content.split('\n');

// 削除すべき行の範囲を特定
const linesToRemove = new Set();

missingFiles.forEach((filePath) => {
  // ファイルパスでエントリを検索
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // エントリのキー行を発見（インデントレベル2）
    if (trimmed === `${filePath}:` && line.startsWith('  ') && !line.startsWith('    ')) {
      console.log(`🔍 Found entry at line ${i + 1}: ${filePath}`);
      
      // このエントリの終わりまでを削除対象にマーク
      linesToRemove.add(i);
      
      // 次の行から、同じレベルまたはそれ以下のインデントの行を削除
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j];
        
        // 空行はスキップ
        if (nextLine.trim() === '') {
          linesToRemove.add(j);
          continue;
        }
        
        // 次のエントリ（同じインデントレベル）に到達したら終了
        if (nextLine.startsWith('  ') && !nextLine.startsWith('    ') && nextLine.trim().endsWith(':')) {
          break;
        }
        
        // より浅いインデント（セクションの終わり）に到達したら終了
        if (!nextLine.startsWith('  ')) {
          break;
        }
        
        // このエントリの一部として削除
        linesToRemove.add(j);
      }
      
      break;
    }
  }
});

// 削除対象外の行を集める
const cleanedLines = lines.filter((_, index) => !linesToRemove.has(index));

// バックアップを作成
const backupFile = `${componentsFile}.backup-${Date.now()}`;
fs.copyFileSync(componentsFile, backupFile);
console.log(`💾 バックアップ作成: ${path.basename(backupFile)}`);

// クリーニングした内容を書き込み
fs.writeFileSync(componentsFile, cleanedLines.join('\n'), 'utf-8');

console.log(`✅ クリーニング完了！`);
console.log(`削除した行数: ${linesToRemove.size}`);
console.log(`残った行数: ${cleanedLines.length} (元: ${lines.length})`);
