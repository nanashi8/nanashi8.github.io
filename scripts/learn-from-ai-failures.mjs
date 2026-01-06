#!/usr/bin/env node

/**
 * AI失敗から学習するサーバント（水先案内人）
 *
 * AI修正失敗履歴を分析し、ai-failure-prevention.instructions.mdを自動更新する
 *
 * 実行タイミング:
 *   - 手動実行: node scripts/learn-from-ai-failures.mjs
 *   - 自動実行: GitHub Actions（毎日深夜2時 + 15コミットごと）
 *   - 即時実行: record-ai-failure.mjs success 実行時
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AI_FAILURE_HISTORY_PATH = path.join(__dirname, '../.aitk/ai-failure-history.json');
const PREVENTION_INSTRUCTIONS_PATH = path.join(__dirname, '../.aitk/instructions/ai-failure-prevention.instructions.md');

/**
 * AI失敗履歴を読み込む
 */
function loadFailureHistory() {
  if (!fs.existsSync(AI_FAILURE_HISTORY_PATH)) {
    console.error('❌ AI失敗履歴が見つかりません:', AI_FAILURE_HISTORY_PATH);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(AI_FAILURE_HISTORY_PATH, 'utf-8'));
}

/**
 * 頻出失敗カテゴリーを分析
 */
function analyzeCommonFailures(history) {
  const categoryMap = new Map();

  history.conversationFailures.forEach(session => {
    session.attempts.forEach(attempt => {
      if (attempt.failureReason) {
        const count = categoryMap.get(attempt.failureReason) || 0;
        categoryMap.set(attempt.failureReason, count + 1);
      }
    });
  });

  return Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => ({ reason, count }));
}

/**
 * 成功パターンを分析
 */
function analyzeSuccessPatterns(history) {
  const patterns = history.successPatterns?.patterns || [];

  // ソリューションの頻出キーワードを抽出
  const solutionKeywords = new Map();

  patterns.forEach(pattern => {
    const keywords = extractKeywords(pattern.solution);
    keywords.forEach(keyword => {
      const count = solutionKeywords.get(keyword) || 0;
      solutionKeywords.set(keyword, count + 1);
    });
  });

  return {
    totalPatterns: patterns.length,
    topSolutions: Array.from(solutionKeywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([keyword, count]) => ({ keyword, count }))
  };
}

/**
 * キーワードを抽出
 */
function extractKeywords(text) {
  const keywords = [];

  // 技術キーワード
  const techPatterns = [
    /useEffect/gi,
    /useState/gi,
    /フラグ|flag/gi,
    /依存配列|dependency array/gi,
    /バッチ|batch/gi,
    /無限ループ|infinite loop/gi,
    /型定義|type definition/gi,
    /仕様書|specification/gi,
    /importmap/gi,
    /es-module-shims/gi,
    /module-shim/gi,
    /cdn/gi,
    /three(\.js)?/gi,
    /orbitcontrols/gi,
    /top-level await/gi
  ];

  techPatterns.forEach(pattern => {
    if (pattern.test(text)) {
      keywords.push(pattern.source.split('|')[0]);
    }
  });

  return keywords;
}

/**
 * 失敗パターンセクションを生成
 */
function generateFailurePatternsSection(history) {
  if (history.conversationFailures.length === 0) {
    return '現在、記録された失敗パターンはありません。';
  }

  let section = `### 総記録数: ${history.conversationFailures.length}件\n\n`;

  // 直近5件を表示
  const recent = history.conversationFailures.slice(-5).reverse();

  recent.forEach((session, i) => {
    section += `#### ${i + 1}. ${session.userRequest}\n\n`;
    section += `**試行回数**: ${session.totalAttempts}回\n`;
    section += `**解決方法**: ${session.solutionDescription}\n`;
    section += `**日時**: ${new Date(session.timestamp).toLocaleString('ja-JP')}\n\n`;

    if (session.learningPoints && session.learningPoints.length > 0) {
      section += `**学習ポイント**:\n`;
      session.learningPoints.forEach(point => {
        section += `- ${point}\n`;
      });
      section += '\n';
    }

    if (session.attempts.length > 1) {
      section += `**失敗の経緯**:\n`;
      session.attempts.slice(0, -1).forEach((attempt, j) => {
        section += `${j + 1}. ${attempt.userFeedback}\n`;
        if (attempt.failureReason) {
          section += `   - 理由: ${attempt.failureReason}\n`;
        }
      });
      section += '\n';
    }

    section += '---\n\n';
  });

  return section;
}

/**
 * 頻出失敗カテゴリーセクションを生成
 */
function generateCommonFailureCategoriesSection(commonFailures) {
  if (commonFailures.length === 0) {
    return '';
  }

  let section = '## 🎯 頻出失敗カテゴリー（統計）\n\n';

  commonFailures.slice(0, 10).forEach((failure, i) => {
    section += `${i + 1}. **${failure.reason}** - ${failure.count}回発生\n`;
  });

  section += '\n';

  return section;
}

/**
 * 成功パターンセクションを生成
 */
function generateSuccessPatternsSection(successAnalysis) {
  if (successAnalysis.totalPatterns === 0) {
    return '';
  }

  let section = '## ✅ 成功パターン分析\n\n';
  section += `**総成功数**: ${successAnalysis.totalPatterns}件\n\n`;

  if (successAnalysis.topSolutions.length > 0) {
    section += '**頻出ソリューションキーワード**:\n';
    successAnalysis.topSolutions.forEach((solution, i) => {
      section += `${i + 1}. ${solution.keyword} (${solution.count}回)\n`;
    });
    section += '\n';
  }

  return section;
}

/**
 * instructionsファイルを更新
 */
function updateInstructionsFile(history) {
  const commonFailures = analyzeCommonFailures(history);
  const successAnalysis = analyzeSuccessPatterns(history);

  // 既存のinstructionsファイルを読み込む
  let instructions = fs.readFileSync(PREVENTION_INSTRUCTIONS_PATH, 'utf-8');

  // メタデータを更新
  instructions = instructions.replace(
    /\*\*更新日\*\*: \d{4}-\d{2}-\d{2}/,
    `**更新日**: ${new Date().toISOString().split('T')[0]}`
  );

  instructions = instructions.replace(
    /\*\*総失敗記録数\*\*: \d+件/,
    `**総失敗記録数**: ${history.conversationFailures.length}件`
  );

  instructions = instructions.replace(
    /\*\*総回復数\*\*: \d+件/,
    `**総回復数**: ${history.metadata.totalRecoveries}件`
  );

  instructions = instructions.replace(
    /\*\*平均試行回数\*\*: [\d.]+回/,
    `**平均試行回数**: ${history.metadata.averageAttemptsToSuccess.toFixed(1)}回`
  );

  // 失敗パターンセクションを更新
  const failurePatternsSection = generateFailurePatternsSection(history);
  instructions = instructions.replace(
    /### 失敗パターン一覧\n\n[\s\S]*?(?=\n## |$)/,
    `### 失敗パターン一覧\n\n${failurePatternsSection}`
  );

  // 頻出失敗カテゴリーセクションを追加（存在しない場合）
  const commonFailureCategoriesSection = generateCommonFailureCategoriesSection(commonFailures);
  if (commonFailureCategoriesSection && !instructions.includes('## 🎯 頻出失敗カテゴリー（統計）')) {
    // "## 🎯 頻出失敗カテゴリー" の前に挿入
    instructions = instructions.replace(
      /## 🎯 頻出失敗カテゴリー/,
      `${commonFailureCategoriesSection}## 🎯 頻出失敗カテゴリー`
    );
  }

  // 成功パターンセクションを追加（存在しない場合）
  const successPatternsSection = generateSuccessPatternsSection(successAnalysis);
  if (successPatternsSection && !instructions.includes('## ✅ 成功パターン分析')) {
    // "## 🔄 修正プロセスフロー" の前に挿入
    instructions = instructions.replace(
      /## 🔄 修正プロセスフロー/,
      `${successPatternsSection}## 🔄 修正プロセスフロー`
    );
  }

  // ファイルを保存
  fs.writeFileSync(PREVENTION_INSTRUCTIONS_PATH, instructions, 'utf-8');

  return {
    totalFailures: history.conversationFailures.length,
    commonFailures: commonFailures.length,
    successPatterns: successAnalysis.totalPatterns
  };
}

/**
 * 予防ルールを生成
 */
function generatePreventionRules(history) {
  const rules = [];

  // 頻出失敗から予防ルールを生成
  const commonFailures = analyzeCommonFailures(history);

  commonFailures.forEach(failure => {
    let rule = null;

    if (failure.reason.includes('useEffect') || failure.reason.includes('依存配列')) {
      rule = {
        id: 'prevent-infinite-loop',
        name: '無限ループ防止',
        condition: 'useEffectまたは依存配列を変更する場合',
        action: 'state更新とuseEffect実行の因果関係を図示し、無限ループが発生しないことを確認',
        severity: 'critical',
        occurrences: failure.count
      };
    } else if (failure.reason.includes('バッチ') || failure.reason.includes('batch')) {
      rule = {
        id: 'enforce-batch-rules',
        name: 'バッチ方式強制',
        condition: 'バッチ関連のコードを変更する場合',
        action: 'batch-system-enforcement.instructions.mdを確認し、3原則を遵守',
        severity: 'critical',
        occurrences: failure.count
      };
    } else if (failure.reason.includes('型') || failure.reason.includes('type')) {
      rule = {
        id: 'verify-type-definitions',
        name: '型定義確認',
        condition: 'プロパティやメソッドにアクセスする場合',
        action: '型定義ファイルを確認し、プロパティ名を推測しない',
        severity: 'high',
        occurrences: failure.count
      };
    }

    if (rule && !rules.find(r => r.id === rule.id)) {
      rules.push(rule);
    }
  });

  return rules;
}

/**
 * レポート生成
 */
function generateReport(history, stats) {
  const report = `# AI失敗学習レポート

**学習日時**: ${new Date().toISOString()}
**解析データ**: AI失敗履歴

---

## 📊 統計サマリー

- **総失敗記録**: ${stats.totalFailures}件
- **頻出失敗カテゴリー**: ${stats.commonFailures}種類
- **成功パターン**: ${stats.successPatterns}件
- **平均試行回数**: ${history.metadata.averageAttemptsToSuccess.toFixed(1)}回

---

## 🎓 学習成果

サーバントは以下を更新しました:

1. **ai-failure-prevention.instructions.md**: 最新の失敗パターンを反映
2. **予防ルール**: ${stats.commonFailures}個の新しいガードを追加
3. **成功パターン**: 効果的な解決方法を文書化

---

## 🛡️ 次回AIへの案内

サーバントは水先案内人として、次回のAIに以下を提供します:

- ✅ 過去の失敗パターン一覧
- ✅ 頻出失敗カテゴリーと予防策
- ✅ 成功パターンのベストプラクティス
- ✅ 修正前の必須チェックリスト

---

**生成日時**: ${new Date().toISOString()}
**次回更新**: サーバント自動学習時（毎日深夜2時）
`;

  return report;
}

/**
 * メイン処理
 */
async function main() {
  console.log('🧠 サーバント水先案内人: AI失敗から学習中...\n');

  // 1. AI失敗履歴を読み込む
  console.log('📖 AI失敗履歴を読み込み中...');
  const history = loadFailureHistory();
  console.log(`   総記録数: ${history.conversationFailures.length}件\n`);

  if (history.conversationFailures.length === 0) {
    console.log('ℹ️  学習対象の失敗記録がありません');
    console.log('');
    console.log('📝 失敗を記録するには:');
    console.log('   node scripts/record-ai-failure.mjs start "<ユーザー依頼>"');
    return;
  }

  // 2. 頻出失敗カテゴリーを分析
  console.log('🔍 頻出失敗カテゴリーを分析中...');
  const commonFailures = analyzeCommonFailures(history);
  console.log(`   検出: ${commonFailures.length}種類\n`);

  if (commonFailures.length > 0) {
    console.log('   トップ5:');
    commonFailures.slice(0, 5).forEach((failure, i) => {
      console.log(`   ${i + 1}. ${failure.reason} (${failure.count}回)`);
    });
    console.log('');
  }

  // 3. 成功パターンを分析
  console.log('✅ 成功パターンを分析中...');
  const successAnalysis = analyzeSuccessPatterns(history);
  console.log(`   総成功数: ${successAnalysis.totalPatterns}件\n`);

  // 4. 予防ルールを生成
  console.log('🛡️  予防ルールを生成中...');
  const preventionRules = generatePreventionRules(history);
  history.preventionRules.rules = preventionRules;
  console.log(`   生成: ${preventionRules.length}個のルール\n`);

  if (preventionRules.length > 0) {
    preventionRules.forEach((rule, i) => {
      console.log(`   ${i + 1}. ${rule.name} (${rule.severity})`);
    });
    console.log('');
  }

  // 5. instructionsファイルを更新
  console.log('📝 ai-failure-prevention.instructions.md を更新中...');
  const stats = updateInstructionsFile(history);
  console.log(`   更新完了\n`);

  // 6. レポートを生成
  console.log('📊 学習レポートを生成中...');
  const report = generateReport(history, stats);
  const reportPath = path.join(__dirname, '../docs/AI_FAILURE_LEARNING_REPORT.md');
  fs.writeFileSync(reportPath, report, 'utf-8');
  console.log(`   レポート: ${reportPath}\n`);

  // 7. 履歴を保存
  fs.writeFileSync(AI_FAILURE_HISTORY_PATH, JSON.stringify(history, null, 2), 'utf-8');

  console.log('\n✅ サーバント学習完了！');
  console.log(`\n📊 サマリー:`);
  console.log(`   - 総失敗記録: ${stats.totalFailures}件`);
  console.log(`   - 頻出カテゴリー: ${stats.commonFailures}種類`);
  console.log(`   - 成功パターン: ${stats.successPatterns}件`);
  console.log(`   - 予防ルール: ${preventionRules.length}個`);
  console.log(`\n📋 詳細レポート: ${reportPath}`);
  console.log(`\n🛡️  次回AIは以下を参照してください:`);
  console.log(`   .aitk/instructions/ai-failure-prevention.instructions.md`);
}

main().catch(error => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});
