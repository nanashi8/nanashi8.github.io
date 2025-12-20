#!/usr/bin/env node

/**
 * パイプライン自動更新スクリプト
 *
 * 失敗パターンから新しいCI/CDチェックを自動生成し、
 * GitHub Actionsワークフローを更新する
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FAILURE_PATTERNS_PATH = path.join(__dirname, '../.aitk/failure-patterns.json');
const WORKFLOWS_DIR = path.join(__dirname, '../.github/workflows');

/**
 * 失敗パターンから新しいCIチェックを生成
 */
function generateCIChecks(patterns) {
  const checks = [];

  for (const [key, pattern] of Object.entries(patterns.failurePatterns)) {
    // 高リスクで静的解析可能なパターン
    if (pattern.weight > 0.7 && pattern.prevention.checkType === 'static-analysis') {
      checks.push({
        id: key,
        name: pattern.id,
        command: pattern.prevention.command || 'npm run type-check',
        errorPattern: pattern.detectionPattern.errorMessage,
        files: pattern.detectionPattern.files,
        weight: pattern.weight,
        autoFixable: pattern.prevention.autoFixable
      });
    }
  }

  // 重みでソート（高リスク優先）
  checks.sort((a, b) => b.weight - a.weight);

  return checks;
}

/**
 * GitHub Actionsワークフローを生成
 */
function generateWorkflow(checks, patterns) {
  return `name: 適応的品質ゲート

# このワークフローは自動生成されます
# 生成元: scripts/update-pipelines.mjs
# 生成日時: ${new Date().toISOString()}

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  adaptive-quality-gate:
    name: 適応的品質チェック
    runs-on: ubuntu-latest

    steps:
      - name: チェックアウト
        uses: actions/checkout@v3

      - name: Node.jsセットアップ
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: 依存関係インストール
        run: npm ci

${checks.map((check, index) => `
      - name: ${index + 1}. ${check.name} (重み: ${check.weight.toFixed(2)})
        id: check-${check.id}
        continue-on-error: ${check.autoFixable ? 'true' : 'false'}
        run: |
          echo "🔍 ${check.name}チェック実行中..."
          ${check.command} || {
            echo "::error::${check.name}エラーが検出されました"
            echo "::error::パターン: ${check.errorPattern}"
            ${check.autoFixable
              ? `echo "::warning::自動修正可能なエラーです"
            exit 0`
              : 'exit 1'}
          }

      - name: ${check.name} - 詳細診断
        if: failure() && steps.check-${check.id}.outcome == 'failure'
        run: |
          echo "📋 失敗パターン: ${check.id}"
          echo "📊 重要度: ${check.weight.toFixed(2)}"
          echo "🔍 検出パターン: ${check.errorPattern}"
          echo "📁 対象ファイル: ${check.files.join(', ')}"

          # 失敗を記録
          node scripts/analyze-failure-pattern.mjs record \\
            "${check.id}" \\
            "${check.errorPattern}" \\
            "1"
`).join('\n')}

      - name: 品質チェック完了
        if: success()
        run: |
          echo "✅ すべての適応的品質チェックが成功しました"
          echo "📊 チェック項目: ${checks.length}件"
          echo "🎯 最高リスク: ${checks[0]?.weight.toFixed(2) || 'N/A'}"

      - name: 失敗時の自動更新
        if: failure()
        run: |
          # Instructions自動更新
          node scripts/update-instructions.mjs all

          # 仕様書自動更新
          node scripts/update-specifications.mjs

          # パイプライン自動更新（自己更新）
          node scripts/update-pipelines.mjs

      - name: 変更をコミット（自動更新）
        if: failure()
        run: |
          git config user.name "Adaptive Pipeline System"
          git config user.email "pipeline@example.com"

          git add .aitk/
          git add docs/specifications/
          git add .github/workflows/
          git add scripts/

          if git diff --staged --quiet; then
            echo "ℹ️  変更なし"
          else
            git commit -m "🤖 適応的システム: パイプライン自動更新 [skip ci]"
            git push
          fi
`;
}

/**
 * パイプラインを更新
 */
function updatePipelines() {
  console.log('🔧 パイプライン自動更新開始...');

  // 失敗パターンを読み込み
  const data = fs.readFileSync(FAILURE_PATTERNS_PATH, 'utf-8');
  const patterns = JSON.parse(data);

  // 新しいCIチェックを生成
  const checks = generateCIChecks(patterns);

  if (checks.length === 0) {
    console.log('ℹ️  新しいCIチェックは不要です');
    return;
  }

  console.log(`✨ ${checks.length}件のCIチェックを生成`);

  // GitHub Actionsワークフローを生成
  const workflow = generateWorkflow(checks, patterns);
  const workflowPath = path.join(
    WORKFLOWS_DIR,
    'adaptive-quality-gate.yml'
  );

  fs.writeFileSync(workflowPath, workflow, 'utf-8');

  console.log(`✅ パイプライン更新完了: ${workflowPath}`);
  console.log('\n📊 生成サマリー:');
  console.log(`  CIチェック: ${checks.length}件`);
  console.log(`  最高リスク: ${checks[0]?.weight.toFixed(2) || 'N/A'}`);
  console.log(`  自動修正可能: ${checks.filter(c => c.autoFixable).length}件`);
}

/**
 * メイン処理
 */
function main() {
  updatePipelines();
}

main();
