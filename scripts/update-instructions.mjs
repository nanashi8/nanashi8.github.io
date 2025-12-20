#!/usr/bin/env node

/**
 * Instructions自動更新スクリプト
 *
 * 失敗パターンデータベースから学習し、
 * Instructionsファイルを自動的に更新・強化する
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FAILURE_PATTERNS_PATH = path.join(__dirname, '../.aitk/failure-patterns.json');
const INSTRUCTIONS_DIR = path.join(__dirname, '../.aitk/instructions');
const ADAPTIVE_INSTRUCTIONS_PATH = path.join(
  INSTRUCTIONS_DIR,
  'adaptive-guard-system.instructions.md'
);

/**
 * 失敗パターンデータベースを読み込む
 */
function loadFailurePatterns() {
  const data = fs.readFileSync(FAILURE_PATTERNS_PATH, 'utf-8');
  return JSON.parse(data);
}

/**
 * 適応的Instructionsを生成
 */
function generateAdaptiveInstructions() {
  const patterns = loadFailurePatterns();
  const highRiskPatterns = Object.values(patterns.failurePatterns)
    .filter(p => p.weight > 0.5)
    .sort((a, b) => b.weight - a.weight);

  const content = `---
description: 適応的ガードシステム - 自動生成された失敗パターンガイド
generated: ${new Date().toISOString()}
version: ${patterns.version}
---

# 適応的ガードシステム

このファイルは**自動生成**されます。失敗パターンデータベースから学習し、
最新の失敗パターンと対策を反映します。

**最終更新**: ${patterns.metadata.lastUpdated}
**総失敗回数**: ${patterns.metadata.totalFailures}
**総復旧回数**: ${patterns.metadata.totalRecoveries}
**現在の成功率**: ${(patterns.convergenceMetrics.currentSuccessRate * 100).toFixed(1)}%
**収斂進捗**: ${(patterns.convergenceMetrics.convergenceProgress * 100).toFixed(1)}%

---

## 🚨 高リスク失敗パターン（自動更新）

以下のパターンは、過去の失敗から学習した重要度の高い項目です。
重みが高いほど、注意が必要です。

${highRiskPatterns.map((pattern, index) => `
### ${index + 1}. ${pattern.id} ⚠️ 重要度: ${pattern.weight.toFixed(2)}

**カテゴリー**: ${pattern.category}
**重要度**: ${pattern.severity}
**発生回数**: ${pattern.occurrences}
**復旧回数**: ${pattern.recoveries}
**成功率**: ${(pattern.learningMetrics.successRate * 100).toFixed(1)}%

**説明**:
${pattern.description}

**検出方法**:
- エラーパターン: \`${pattern.detectionPattern.errorMessage}\`
- 対象ファイル: ${pattern.detectionPattern.files.join(', ')}

**予防策**:
- チェック方法: ${pattern.prevention.checkType}
${pattern.prevention.command ? `- コマンド: \`${pattern.prevention.command}\`` : ''}
${pattern.prevention.instructionsFile ? `- ガイド: [${path.basename(pattern.prevention.instructionsFile)}](${pattern.prevention.instructionsFile})` : ''}
- 自動修正: ${pattern.prevention.autoFixable ? '可能' : '不可'}

${pattern.examples.length > 0 ? `**最近の事例**:
${pattern.examples.slice(-3).map(ex => `
- **日時**: ${ex.date}
  - エラー: \`${ex.error}\`
  - 修正: ${ex.fix}
  - 失敗テスト数: ${ex.testsFailed}
`).join('\n')}` : ''}

---
`).join('\n')}

## 📊 収斂状態

システムは経験から学習し、失敗率を減少させています。

- **現在の成功率**: ${(patterns.convergenceMetrics.currentSuccessRate * 100).toFixed(1)}%
- **目標成功率**: ${(patterns.metadata.convergenceThreshold * 100).toFixed(1)}%
- **収斂進捗**: ${(patterns.convergenceMetrics.convergenceProgress * 100).toFixed(1)}%

${patterns.convergenceMetrics.currentSuccessRate >= patterns.metadata.convergenceThreshold
  ? '✅ **システムは収斂しました**。安定稼働中です。'
  : '🔄 **システムは学習中です**。失敗パターンを蓄積し、改善しています。'}

## 🛡️ 自動ガード層の状態

${Object.entries(patterns.guardRules).map(([key, rule]) => `
### ${key}
- 状態: ${rule.enabled ? '✅ 有効' : '❌ 無効'}
- 重み: ${rule.weight.toFixed(2)}
${rule.checks ? `- チェック項目: ${rule.checks.join(', ')}` : ''}
${rule.priority ? `- 優先度: ${rule.priority}` : ''}
`).join('\n')}

## 🎓 学習アルゴリズム

このシステムは以下のロジックで成長します：

1. **失敗検出**: CI/CD、Git Hooks、手動報告から失敗を検出
2. **パターン記録**: 失敗パターンをデータベースに記録（重み +0.1）
3. **復旧記録**: 復旧成功時に記録（重み -0.05）
4. **収斂判定**: 成功率が${(patterns.metadata.convergenceThreshold * 100).toFixed(0)}%を超えると収斂
5. **自動更新**: このInstructionsファイルを自動生成

### 重み付けロジック

- **初期重み**: 0.5（中程度のリスク）
- **失敗時**: +0.1（最大1.0）
- **復旧時**: -0.05（最小0.1）
- **高リスク閾値**: 0.7以上

### 収斂条件

\`\`\`
成功率 = 復旧した失敗数 / 総失敗数
収斂進捗 = 成功率 / 目標成功率
収斂 = 成功率 >= ${(patterns.metadata.convergenceThreshold * 100).toFixed(0)}%
\`\`\`

## 📋 AI実装時の必須チェック（自動生成）

以下は、高リスクパターンから自動生成された必須チェックリストです：

${highRiskPatterns.map((pattern, index) => `
${index + 1}. **${pattern.id}** (重み: ${pattern.weight.toFixed(2)})
   - [ ] ${pattern.description}
   ${pattern.prevention.command ? `- [ ] \`${pattern.prevention.command}\` を実行` : ''}
   ${pattern.prevention.instructionsFile ? `- [ ] [${path.basename(pattern.prevention.instructionsFile)}](${pattern.prevention.instructionsFile}) を確認` : ''}
`).join('\n')}

---

**このファイルは自動生成されます。手動編集しないでください。**
**更新方法**: \`npm run update-instructions\`
`;

  return content;
}

/**
 * Instructionsファイルを更新
 */
function updateInstructions() {
  console.log('🔄 Instructions自動更新開始...');

  // 適応的Instructionsを生成
  const content = generateAdaptiveInstructions();

  // ファイルに書き込み
  fs.writeFileSync(ADAPTIVE_INSTRUCTIONS_PATH, content, 'utf-8');

  console.log(`✅ Instructions更新完了: ${ADAPTIVE_INSTRUCTIONS_PATH}`);

  // レポート表示
  const patterns = loadFailurePatterns();
  console.log('\n📊 更新サマリー:');
  console.log(`  総失敗回数: ${patterns.metadata.totalFailures}`);
  console.log(`  総復旧回数: ${patterns.metadata.totalRecoveries}`);
  console.log(`  現在の成功率: ${(patterns.convergenceMetrics.currentSuccessRate * 100).toFixed(1)}%`);
  console.log(`  高リスクパターン数: ${Object.values(patterns.failurePatterns).filter(p => p.weight > 0.7).length}`);
}

/**
 * GitHub Actions用のチェックスクリプトを生成
 */
function generateGitHubActionsChecks() {
  const patterns = loadFailurePatterns();
  const highRiskPatterns = Object.values(patterns.failurePatterns)
    .filter(p => p.weight > 0.7 && p.prevention.checkType === 'static-analysis');

  if (highRiskPatterns.length === 0) {
    console.log('ℹ️  高リスクの静的解析パターンはありません');
    return;
  }

  const checksScript = `#!/bin/bash
# 自動生成されたチェックスクリプト
# 生成日時: ${new Date().toISOString()}

echo "🔍 適応的ガードシステム - 自動チェック開始"

${highRiskPatterns.map(pattern => `
# ${pattern.id} (重み: ${pattern.weight.toFixed(2)})
echo "📋 ${pattern.description}"
if grep -rn "${pattern.detectionPattern.errorMessage}" ${pattern.detectionPattern.files.join(' ')} 2>/dev/null; then
  echo "::error::${pattern.id} が検出されました"
  echo "::error::対策: ${pattern.prevention.instructionsFile || 'Manual fix required'}"
  exit 1
fi
`).join('\n')}

echo "✅ すべてのチェックが成功しました"
`;

  const checksPath = path.join(__dirname, 'adaptive-guard-checks.sh');
  fs.writeFileSync(checksPath, checksScript, 'utf-8');
  fs.chmodSync(checksPath, 0o755);

  console.log(`✅ チェックスクリプト生成完了: ${checksPath}`);
}

/**
 * メイン処理
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'update';

  switch (command) {
    case 'update':
      updateInstructions();
      break;

    case 'generate-checks':
      generateGitHubActionsChecks();
      break;

    case 'all':
      updateInstructions();
      generateGitHubActionsChecks();
      break;

    default:
      console.log('使用方法:');
      console.log('  node update-instructions.mjs update         # Instructionsを更新');
      console.log('  node update-instructions.mjs generate-checks # チェックスクリプトを生成');
      console.log('  node update-instructions.mjs all            # すべて実行');
      process.exit(1);
  }
}

main();
