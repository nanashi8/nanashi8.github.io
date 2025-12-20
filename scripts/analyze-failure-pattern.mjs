#!/usr/bin/env node

/**
 * 失敗パターン分析スクリプト
 *
 * CI/CDやローカルテストで失敗が検出された際に、
 * 失敗パターンを分析してデータベースに記録する
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FAILURE_PATTERNS_PATH = path.join(__dirname, '../.aitk/failure-patterns.json');
const INSTRUCTIONS_DIR = path.join(__dirname, '../.aitk/instructions');

/**
 * 失敗パターンデータベースを読み込む
 */
function loadFailurePatterns() {
  if (!fs.existsSync(FAILURE_PATTERNS_PATH)) {
    console.error('❌ 失敗パターンデータベースが見つかりません');
    process.exit(1);
  }

  const data = fs.readFileSync(FAILURE_PATTERNS_PATH, 'utf-8');
  return JSON.parse(data);
}

/**
 * 失敗パターンデータベースを保存する
 */
function saveFailurePatterns(patterns) {
  fs.writeFileSync(
    FAILURE_PATTERNS_PATH,
    JSON.stringify(patterns, null, 2),
    'utf-8'
  );
}

/**
 * エラーメッセージから失敗パターンを検出する
 */
function detectFailurePattern(errorMessage, filePath) {
  const patterns = loadFailurePatterns();

  for (const [key, pattern] of Object.entries(patterns.failurePatterns)) {
    const regex = new RegExp(pattern.detectionPattern.errorMessage, 'i');
    if (regex.test(errorMessage)) {
      return key;
    }
  }

  return 'unknown-error';
}

/**
 * 失敗パターンを記録する
 */
function recordFailure(patternId, errorDetails) {
  const patterns = loadFailurePatterns();

  // パターンが存在しない場合は新規作成
  if (!patterns.failurePatterns[patternId]) {
    patterns.failurePatterns[patternId] = {
      id: patternId,
      category: 'unknown',
      severity: 'medium',
      occurrences: 0,
      lastOccurred: null,
      recoveries: 0,
      weight: 0.5,
      description: errorDetails.message,
      detectionPattern: {
        errorMessage: errorDetails.message,
        files: [errorDetails.file || '**/*.ts']
      },
      prevention: {
        checkType: 'manual',
        command: null,
        instructionsFile: null,
        autoFixable: false
      },
      examples: [],
      learningMetrics: {
        successRate: 0.0,
        averageRecoveryTime: null,
        preventionEffectiveness: 0.5
      }
    };
  }

  // 失敗回数を増やす
  const pattern = patterns.failurePatterns[patternId];
  pattern.occurrences += 1;
  pattern.lastOccurred = new Date().toISOString().split('T')[0];

  // 重みを調整（失敗回数に応じて増加）
  pattern.weight = Math.min(1.0, pattern.weight + 0.1);

  // 例を追加
  pattern.examples.push({
    date: pattern.lastOccurred,
    error: errorDetails.message,
    fix: errorDetails.fix || 'To be determined',
    testsFailed: errorDetails.testsFailed || 0
  });

  // 最大10件まで保持
  if (pattern.examples.length > 10) {
    pattern.examples.shift();
  }

  // メタデータ更新
  patterns.metadata.totalFailures += 1;
  patterns.metadata.lastUpdated = pattern.lastOccurred;

  // 収斂メトリクス更新
  patterns.convergenceMetrics.recentFailures.push({
    date: pattern.lastOccurred,
    patternId: patternId,
    recovered: false,
    recoveryTime: null
  });

  // 最大20件まで保持
  if (patterns.convergenceMetrics.recentFailures.length > 20) {
    patterns.convergenceMetrics.recentFailures.shift();
  }

  // 成功率を再計算
  updateSuccessRate(patterns);

  saveFailurePatterns(patterns);

  console.log(`📝 失敗パターン記録: ${patternId}`);
  console.log(`   発生回数: ${pattern.occurrences}`);
  console.log(`   重み: ${pattern.weight.toFixed(2)}`);
  console.log(`   成功率: ${patterns.convergenceMetrics.currentSuccessRate.toFixed(2)}`);
}

/**
 * 失敗の復旧を記録する
 */
function recordRecovery(patternId) {
  const patterns = loadFailurePatterns();

  if (!patterns.failurePatterns[patternId]) {
    console.error(`❌ 失敗パターン ${patternId} が見つかりません`);
    return;
  }

  const pattern = patterns.failurePatterns[patternId];
  pattern.recoveries += 1;

  // 重みを減少（復旧成功により）
  pattern.weight = Math.max(0.1, pattern.weight - 0.05);

  // 成功率を更新
  pattern.learningMetrics.successRate =
    pattern.recoveries / (pattern.occurrences || 1);

  // メタデータ更新
  patterns.metadata.totalRecoveries += 1;

  // 最新の失敗を「復旧済み」にマーク
  const recentFailures = patterns.convergenceMetrics.recentFailures;
  const latestFailure = recentFailures
    .reverse()
    .find(f => f.patternId === patternId && !f.recovered);

  if (latestFailure) {
    latestFailure.recovered = true;
    latestFailure.recoveryTime = 0; // 分単位で記録
  }

  // 成功率を再計算
  updateSuccessRate(patterns);

  saveFailurePatterns(patterns);

  console.log(`✅ 復旧記録: ${patternId}`);
  console.log(`   復旧回数: ${pattern.recoveries}`);
  console.log(`   成功率: ${pattern.learningMetrics.successRate.toFixed(2)}`);
  console.log(`   現在の重み: ${pattern.weight.toFixed(2)}`);
}

/**
 * 全体の成功率を更新
 */
function updateSuccessRate(patterns) {
  const recentFailures = patterns.convergenceMetrics.recentFailures;
  const recovered = recentFailures.filter(f => f.recovered).length;
  const total = recentFailures.length;

  patterns.convergenceMetrics.currentSuccessRate =
    total > 0 ? recovered / total : 1.0;

  // 収斂進捗を計算
  const target = patterns.metadata.convergenceThreshold;
  const current = patterns.convergenceMetrics.currentSuccessRate;
  patterns.convergenceMetrics.convergenceProgress = current / target;
}

/**
 * 高リスクパターンをレポート
 */
function reportHighRiskPatterns() {
  const patterns = loadFailurePatterns();
  const highRiskPatterns = Object.values(patterns.failurePatterns)
    .filter(p => p.weight > 0.7 && p.occurrences > 0)
    .sort((a, b) => b.weight - a.weight);

  if (highRiskPatterns.length === 0) {
    console.log('✅ 高リスクパターンはありません');
    return;
  }

  console.log('\n⚠️  高リスク失敗パターン:');
  highRiskPatterns.forEach(pattern => {
    console.log(`\n  ${pattern.id}`);
    console.log(`    カテゴリー: ${pattern.category}`);
    console.log(`    重要度: ${pattern.severity}`);
    console.log(`    発生回数: ${pattern.occurrences}`);
    console.log(`    復旧回数: ${pattern.recoveries}`);
    console.log(`    重み: ${pattern.weight.toFixed(2)}`);
    console.log(`    成功率: ${pattern.learningMetrics.successRate.toFixed(2)}`);
    console.log(`    最終発生: ${pattern.lastOccurred || 'なし'}`);

    if (pattern.prevention.instructionsFile) {
      console.log(`    対策: ${pattern.prevention.instructionsFile}`);
    }
  });
}

/**
 * 収斂状態をレポート
 */
function reportConvergence() {
  const patterns = loadFailurePatterns();
  const metrics = patterns.convergenceMetrics;

  console.log('\n📊 収斂メトリクス:');
  console.log(`  現在の成功率: ${(metrics.currentSuccessRate * 100).toFixed(1)}%`);
  console.log(`  目標成功率: ${(patterns.metadata.convergenceThreshold * 100).toFixed(1)}%`);
  console.log(`  収斂進捗: ${(metrics.convergenceProgress * 100).toFixed(1)}%`);

  const isConverged = metrics.currentSuccessRate >= patterns.metadata.convergenceThreshold;

  if (isConverged) {
    console.log('  状態: ✅ 収斂済み');
  } else {
    console.log('  状態: 🔄 学習中');
  }
}

/**
 * メインコマンド処理
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'record':
      // 失敗を記録
      const patternId = args[1];
      const errorMessage = args[2];
      const testsFailed = parseInt(args[3] || '0', 10);

      if (!patternId || !errorMessage) {
        console.error('使用方法: record <patternId> <errorMessage> [testsFailed]');
        process.exit(1);
      }

      recordFailure(patternId, {
        message: errorMessage,
        testsFailed: testsFailed
      });
      break;

    case 'recover':
      // 復旧を記録
      const recoveredPatternId = args[1];

      if (!recoveredPatternId) {
        console.error('使用方法: recover <patternId>');
        process.exit(1);
      }

      recordRecovery(recoveredPatternId);
      break;

    case 'report':
      // レポート表示
      reportHighRiskPatterns();
      reportConvergence();
      break;

    case 'analyze':
      // エラーメッセージから自動検出
      const errorMsg = args[1];
      const file = args[2];

      if (!errorMsg) {
        console.error('使用方法: analyze <errorMessage> [file]');
        process.exit(1);
      }

      const detected = detectFailurePattern(errorMsg, file);
      console.log(`検出されたパターン: ${detected}`);
      break;

    default:
      console.log('使用方法:');
      console.log('  node analyze-failure-pattern.mjs record <patternId> <errorMessage> [testsFailed]');
      console.log('  node analyze-failure-pattern.mjs recover <patternId>');
      console.log('  node analyze-failure-pattern.mjs report');
      console.log('  node analyze-failure-pattern.mjs analyze <errorMessage> [file]');
      process.exit(1);
  }
}

main();
