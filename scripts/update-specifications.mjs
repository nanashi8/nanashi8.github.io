#!/usr/bin/env node

/**
 * 仕様書自動更新スクリプト
 *
 * 失敗パターンから「仕様の抜け」を検出し、
 * 仕様書を自動的に補完・更新する
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FAILURE_PATTERNS_PATH = path.join(__dirname, '../.aitk/failure-patterns.json');
const SPECIFICATIONS_DIR = path.join(__dirname, '../docs/specifications');

/**
 * 失敗パターンから仕様の抜けを検出
 */
function detectSpecificationGaps(patterns) {
  const gaps = [];

  for (const [key, pattern] of Object.entries(patterns.failurePatterns)) {
    // 高リスクで未文書化のパターンを検出
    if (pattern.weight > 0.7 && !pattern.specificationReference) {
      gaps.push({
        patternId: key,
        category: pattern.category,
        severity: pattern.severity,
        occurrences: pattern.occurrences,
        description: pattern.description,
        suggestedSpecSection: generateSpecSection(pattern)
      });
    }
  }

  return gaps;
}

/**
 * 失敗パターンから仕様セクションを生成
 */
function generateSpecSection(pattern) {
  const section = {
    title: `${pattern.id}の防止`,
    priority: pattern.severity === 'critical' ? 'MUST' : 'SHOULD',
    content: `
## ${pattern.id}の防止

**優先度**: ${pattern.severity === 'critical' ? 'MUST（必須）' : 'SHOULD（推奨）'}
**カテゴリー**: ${pattern.category}
**リスクレベル**: ${pattern.weight.toFixed(2)}

### 問題の説明

${pattern.description}

### 予防策

${pattern.prevention.checkType === 'static-analysis'
  ? `#### 静的解析による自動検出

\`\`\`bash
${pattern.prevention.command || 'npm run type-check'}
\`\`\`

このコマンドを実行することで、以下のエラーが検出されます：

\`\`\`
${pattern.detectionPattern.errorMessage}
\`\`\`
`
  : '#### 手動確認が必要'}

### 実装例

${pattern.examples.length > 0
  ? `#### 誤った実装例

\`\`\`typescript
// ❌ 誤り
${pattern.examples[0].error}
\`\`\`

#### 正しい実装例

\`\`\`typescript
// ✅ 正しい
${pattern.examples[0].fix}
\`\`\`
`
  : '実装例は今後追加されます。'}

### チェックリスト

- [ ] ${pattern.prevention.instructionsFile
        ? `[${path.basename(pattern.prevention.instructionsFile)}](${pattern.prevention.instructionsFile}) を確認`
        : '関連ドキュメントを確認'}
${pattern.prevention.command
  ? `- [ ] \`${pattern.prevention.command}\` を実行`
  : ''}
- [ ] 型定義を確認
- [ ] テストを実行

### 参考資料

- 失敗パターンID: \`${pattern.id}\`
- 最終発生日: ${pattern.lastOccurred}
- 発生回数: ${pattern.occurrences}回
- 復旧回数: ${pattern.recoveries}回
`
  };

  return section;
}

/**
 * 仕様書を更新
 */
function updateSpecifications() {
  console.log('📝 仕様書自動更新開始...');

  // 失敗パターンを読み込み
  const data = fs.readFileSync(FAILURE_PATTERNS_PATH, 'utf-8');
  const patterns = JSON.parse(data);

  // 仕様の抜けを検出
  const gaps = detectSpecificationGaps(patterns);

  if (gaps.length === 0) {
    console.log('✅ 仕様の抜けは検出されませんでした');
    return;
  }

  console.log(`🔍 仕様の抜けを ${gaps.length} 件検出`);

  // 適応的仕様書を生成
  const adaptiveSpecPath = path.join(
    SPECIFICATIONS_DIR,
    'ADAPTIVE_SPECIFICATIONS.md'
  );

  const content = `---
description: 適応的仕様書 - 失敗パターンから自動生成
generated: ${new Date().toISOString()}
---

# 適応的仕様書

このファイルは**自動生成**されます。失敗パターンデータベースから、
未文書化の仕様や抜けている要件を検出し、自動的に仕様書を補完します。

**最終更新**: ${patterns.metadata.lastUpdated}
**検出された仕様の抜け**: ${gaps.length}件

---

${gaps.map((gap, index) => `
## ${index + 1}. ${gap.patternId}

**カテゴリー**: ${gap.category}
**重要度**: ${gap.severity}
**発生回数**: ${gap.occurrences}

${gap.suggestedSpecSection.content}

---
`).join('\n')}

## 仕様書への反映ルール

### MUST（必須要件）

**critical**レベルの失敗パターンは、必ず既存仕様書に反映する必要があります：

${gaps.filter(g => g.severity === 'critical').map(g => `
- [ ] \`${g.patternId}\` を [該当仕様書](${SPECIFICATIONS_DIR}/) に追記
`).join('\n')}

### SHOULD（推奨要件）

その他の失敗パターンは、関連する仕様書に追記することを推奨します：

${gaps.filter(g => g.severity !== 'critical').map(g => `
- [ ] \`${g.patternId}\` を [該当仕様書](${SPECIFICATIONS_DIR}/) に検討
`).join('\n')}

---

**このファイルは自動生成されます。手動編集しないでください。**
**更新方法**: \`npm run update-specifications\`
`;

  fs.writeFileSync(adaptiveSpecPath, content, 'utf-8');

  console.log(`✅ 適応的仕様書生成完了: ${adaptiveSpecPath}`);
  console.log('\n📊 検出サマリー:');
  console.log(`  仕様の抜け: ${gaps.length}件`);
  console.log(`  MUST要件: ${gaps.filter(g => g.severity === 'critical').length}件`);
  console.log(`  SHOULD要件: ${gaps.filter(g => g.severity !== 'critical').length}件`);
}

/**
 * メイン処理
 */
function main() {
  updateSpecifications();
}

main();
