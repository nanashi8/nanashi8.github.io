#!/usr/bin/env node

/**
 * AI修正ワークフロー自動実行ラッパー
 *
 * AIエージェント向けの統合ワークフロー:
 * 1. ガードチェック実行
 * 2. セッション開始
 * 3. 修正作業の案内
 *
 * 使用方法:
 *   node scripts/ai-workflow.mjs "<ユーザー依頼>" [変更予定ファイル...]
 *
 * 例:
 *   node scripts/ai-workflow.mjs "バッチ完全消化後の次バッチ生成" "MemorizationView.tsx"
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

/**
 * ステップ実行
 */
function executeStep(stepNumber, title, command, continueOnError = false) {
  console.log('');
  console.log(`${colors.bold}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}Step ${stepNumber}: ${title}${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log('');

  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      cwd: join(__dirname, '..'),
      stdio: 'inherit'
    });
    return true;
  } catch (error) {
    if (continueOnError) {
      console.log('');
      console.log(`${colors.yellow}⚠️  エラーが発生しましたが続行します${colors.reset}`);
      console.log('');
      return false;
    } else {
      console.log('');
      console.log(`${colors.red}❌ エラーが発生しました${colors.reset}`);
      console.log('');
      process.exit(1);
    }
  }
}

/**
 * 完了メッセージ
 */
function showCompletionMessage(userRequest) {
  console.log('');
  console.log(`${colors.bold}${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bold}${colors.green}✅ ワークフロー完了 - 修正を開始してください${colors.reset}`);
  console.log(`${colors.bold}${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log('');
  console.log(`${colors.bold}📝 修正中のコマンド:${colors.reset}`);
  console.log('');
  console.log(`${colors.cyan}1. 修正試行ごとに記録:${colors.reset}`);
  console.log(`   ${colors.yellow}node scripts/record-ai-failure.mjs attempt "<変更ファイル>" "<ユーザーフィードバック>"${colors.reset}`);
  console.log('');
  console.log(`${colors.cyan}2. 成功時に記録:${colors.reset}`);
  console.log(`   ${colors.yellow}node scripts/record-ai-failure.mjs success "<解決方法>"${colors.reset}`);
  console.log('');
  console.log(`${colors.cyan}3. キャンセル:${colors.reset}`);
  console.log(`   ${colors.yellow}node scripts/record-ai-failure.mjs cancel${colors.reset}`);
  console.log('');
  console.log(`${colors.bold}${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log('');
}

/**
 * メイン処理
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(`${colors.red}エラー: ユーザー依頼内容を指定してください${colors.reset}`);
    console.log('');
    console.log('使用方法:');
    console.log('  node scripts/ai-workflow.mjs "<ユーザー依頼内容>" [変更予定ファイル...]');
    console.log('');
    console.log('例:');
    console.log('  node scripts/ai-workflow.mjs "バッチ完全消化後の次バッチ生成" "MemorizationView.tsx"');
    process.exit(1);
  }

  const userRequest = args[0];
  const targetFiles = args.slice(1);

  console.log('');
  console.log(`${colors.bold}${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}🤖 AI修正ワークフロー - サーバント水先案内人が起動しました${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log('');
  console.log(`${colors.bold}📋 ユーザー依頼:${colors.reset}`);
  console.log(`   "${userRequest}"`);

  if (targetFiles.length > 0) {
    console.log('');
    console.log(`${colors.bold}📁 変更予定ファイル:${colors.reset}`);
    targetFiles.forEach(file => {
      console.log(`   - ${file}`);
    });
  }

  // Step 1: ガードチェック実行
  const guardCommand = `node scripts/ai-guard-check.mjs "${userRequest}" ${targetFiles.join(' ')}`;
  executeStep(1, 'ガードチェック実行', guardCommand);

  // Step 2: セッション開始
  const sessionCommand = `node scripts/record-ai-failure.mjs start "${userRequest}"`;
  executeStep(2, 'セッション開始', sessionCommand);

  // 完了メッセージ
  showCompletionMessage(userRequest);
}

main();
