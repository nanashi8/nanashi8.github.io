#!/usr/bin/env node

/**
 * Git履歴学習スクリプト
 * 
 * コミット履歴から失敗パターンを自動抽出し、
 * サーバントのfailure-patterns.jsonに学習させる
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FAILURE_PATTERNS_PATH = path.join(__dirname, '../.aitk/failure-patterns.json');

/**
 * 学習AI実装開始日を検出
 */
function detectLearningAIStartDate() {
  try {
    // "学習AI"関連の最初のコミットを検索
    const result = execSync(
      'git log --all --grep="学習AI\\|Memory AI\\|AdaptiveEducationalAI" --reverse --format="%ad" --date=iso | head -1',
      { encoding: 'utf-8', cwd: path.join(__dirname, '..') }
    ).trim();
    
    if (result) {
      return new Date(result);
    }
    
    // fallback: 6ヶ月前
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return sixMonthsAgo;
  } catch (error) {
    console.error('⚠️  学習AI開始日の検出に失敗しました。6ヶ月前を使用します。');
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return sixMonthsAgo;
  }
}

/**
 * 修正コミットを検出
 */
function detectFixCommits(sinceDate) {
  const dateStr = sinceDate.toISOString().split('T')[0];
  
  try {
    const result = execSync(
      `git log --since="${dateStr}" --grep="fix\\|修正\\|バグ\\|エラー\\|typo\\|誤り" -i --format="%H|%s|%ad|%an" --date=iso`,
      { encoding: 'utf-8', cwd: path.join(__dirname, '..') }
    ).trim();
    
    if (!result) return [];
    
    return result.split('\n').map(line => {
      const [hash, subject, date, author] = line.split('|');
      return { hash, subject, date, author };
    });
  } catch (error) {
    console.error('⚠️  コミット検出に失敗しました:', error.message);
    return [];
  }
}

/**
 * コミット差分から修正パターンを抽出
 */
function extractFixPatterns(commit) {
  try {
    const diff = execSync(
      `git show ${commit.hash} --format="" --unified=0`,
      { encoding: 'utf-8', cwd: path.join(__dirname, '..') }
    );
    
    const patterns = [];
    
    // パターン1: プロパティ名の修正
    const propertyFix = diff.match(/[-].*\.(correctCount|incorrectCount|attemptCount)[^a-zA-Z]/g);
    const propertyCorrect = diff.match(/[+].*\.(memorizationCorrect|memorizationAttempts|translationCorrect)/g);
    if (propertyFix && propertyCorrect) {
      patterns.push({
        type: 'property-naming-error',
        before: propertyFix[0]?.trim().substring(1),
        after: propertyCorrect[0]?.trim().substring(1),
        files: extractFilesFromDiff(diff)
      });
    }
    
    // パターン2: 型エラーの修正
    if (commit.subject.match(/型|type|Type/i)) {
      patterns.push({
        type: 'type-error',
        description: commit.subject,
        files: extractFilesFromDiff(diff)
      });
    }
    
    // パターン3: ロジックの修正
    if (commit.subject.match(/ロジック|logic|修正|fix/i)) {
      patterns.push({
        type: 'logic-error',
        description: commit.subject,
        files: extractFilesFromDiff(diff)
      });
    }
    
    // パターン4: テスト修正
    if (commit.subject.match(/テスト|test/i) && diff.includes('test')) {
      patterns.push({
        type: 'test-error',
        description: commit.subject,
        files: extractFilesFromDiff(diff)
      });
    }
    
    return patterns;
  } catch (error) {
    console.error(`⚠️  コミット ${commit.hash} の解析に失敗:`, error.message);
    return [];
  }
}

/**
 * 差分からファイル名を抽出
 */
function extractFilesFromDiff(diff) {
  const filePattern = /diff --git a\/(.*?) b\//g;
  const files = [];
  let match;
  
  while ((match = filePattern.exec(diff)) !== null) {
    files.push(match[1]);
  }
  
  return files;
}

/**
 * ホットスポット（頻繁に修正されるファイル）を検出
 */
function detectHotspots(sinceDate) {
  const dateStr = sinceDate.toISOString().split('T')[0];
  
  try {
    const result = execSync(
      `git log --since="${dateStr}" --name-only --format="" | grep -E "\\.(ts|tsx|js|jsx)$" | sort | uniq -c | sort -rn | head -20`,
      { encoding: 'utf-8', cwd: path.join(__dirname, '..') }
    ).trim();
    
    if (!result) return [];
    
    return result.split('\n').map(line => {
      const match = line.trim().match(/(\d+)\s+(.+)/);
      if (match) {
        return { count: parseInt(match[1], 10), file: match[2] };
      }
      return null;
    }).filter(Boolean);
  } catch (error) {
    console.error('⚠️  ホットスポット検出に失敗しました:', error.message);
    return [];
  }
}

/**
 * パターンを失敗パターンデータベースに統合
 */
function integratePatterns(extractedPatterns, hotspots) {
  const data = fs.readFileSync(FAILURE_PATTERNS_PATH, 'utf-8');
  const patterns = JSON.parse(data);
  
  let newPatternsCount = 0;
  let updatedPatternsCount = 0;
  
  // 抽出されたパターンを統合
  for (const extracted of extractedPatterns) {
    const patternId = extracted.type;
    
    if (patterns.failurePatterns[patternId]) {
      // 既存パターンを更新
      const pattern = patterns.failurePatterns[patternId];
      pattern.occurrences += 1;
      pattern.weight = Math.min(1.0, pattern.weight + 0.05); // Git履歴から学習したので控えめに増加
      
      if (extracted.before && extracted.after) {
        pattern.examples.push({
          date: new Date().toISOString().split('T')[0],
          error: extracted.before,
          fix: extracted.after,
          testsFailed: 0,
          source: 'git-history'
        });
        
        // 最大10件まで保持
        if (pattern.examples.length > 10) {
          pattern.examples.shift();
        }
      }
      
      updatedPatternsCount++;
    } else {
      // 新しいパターンを追加
      patterns.failurePatterns[patternId] = {
        id: patternId,
        category: 'unknown',
        severity: 'medium',
        occurrences: 1,
        lastOccurred: new Date().toISOString().split('T')[0],
        recoveries: 1, // Git履歴から学習 = すでに修正済み
        weight: 0.5,
        description: extracted.description || `Git履歴から検出: ${patternId}`,
        detectionPattern: {
          errorMessage: extracted.description || patternId,
          files: extracted.files || ['**/*.ts']
        },
        prevention: {
          checkType: 'manual',
          command: null,
          instructionsFile: null,
          autoFixable: false
        },
        examples: extracted.before && extracted.after ? [{
          date: new Date().toISOString().split('T')[0],
          error: extracted.before,
          fix: extracted.after,
          testsFailed: 0,
          source: 'git-history'
        }] : [],
        learningMetrics: {
          successRate: 1.0, // Git履歴から学習 = すでに修正済み
          averageRecoveryTime: null,
          preventionEffectiveness: 0.5
        }
      };
      
      newPatternsCount++;
    }
  }
  
  // ホットスポット情報を追加
  patterns.hotspots = hotspots.slice(0, 10).map(h => ({
    file: h.file,
    modificationCount: h.count,
    riskLevel: h.count > 10 ? 'high' : h.count > 5 ? 'medium' : 'low'
  }));
  
  // メタデータ更新
  patterns.metadata.totalFailures += newPatternsCount;
  patterns.metadata.totalRecoveries += newPatternsCount; // Git履歴から学習 = すでに修正済み
  patterns.metadata.lastUpdated = new Date().toISOString().split('T')[0];
  patterns.metadata.gitHistoryLearned = true;
  patterns.metadata.gitHistoryLearnedAt = new Date().toISOString();
  
  fs.writeFileSync(FAILURE_PATTERNS_PATH, JSON.stringify(patterns, null, 2), 'utf-8');
  
  return { newPatternsCount, updatedPatternsCount };
}

/**
 * 学習レポートを生成
 */
function generateLearningReport(commits, extractedPatterns, hotspots, stats) {
  const report = `# Git履歴学習レポート

**学習日時**: ${new Date().toISOString()}  
**学習範囲**: 学習AI実装開始以降

---

## 📊 学習サマリー

- **解析コミット数**: ${commits.length}件
- **抽出パターン数**: ${extractedPatterns.length}件
- **新規パターン**: ${stats.newPatternsCount}件
- **更新パターン**: ${stats.updatedPatternsCount}件
- **ホットスポット**: ${hotspots.length}ファイル

---

## 🔥 ホットスポット（頻繁に修正されるファイル）

${hotspots.slice(0, 10).map((h, i) => `
${i + 1}. **${h.file}** - ${h.count}回修正
   - リスクレベル: ${h.count > 10 ? '高' : h.count > 5 ? '中' : '低'}
`).join('\n')}

---

## 📋 抽出された失敗パターン

${extractedPatterns.slice(0, 10).map((p, i) => `
### ${i + 1}. ${p.type}

${p.description ? `**説明**: ${p.description}` : ''}
${p.before ? `**修正前**: \`${p.before}\`` : ''}
${p.after ? `**修正後**: \`${p.after}\`` : ''}
${p.files?.length > 0 ? `**影響ファイル**: ${p.files.join(', ')}` : ''}
`).join('\n')}

---

## 🎓 学習結果

サーバントは過去の失敗から以下を学習しました：

1. **頻出エラーパターン**: ${extractedPatterns.length}件
2. **高リスクファイル**: ${hotspots.filter(h => h.count > 10).length}ファイル
3. **成功率向上**: Git履歴から学習したパターンは全て「修正済み」として記録

**次回のアクション**:
- ホットスポットファイルに特に注意
- 抽出されたパターンをInstructionsに反映
- CI/CDパイプラインに自動チェックを追加

---

**生成日時**: ${new Date().toISOString()}
`;

  return report;
}

/**
 * メイン処理
 */
async function main() {
  console.log('🧠 Git履歴学習開始...\n');
  
  // 1. 学習AI実装開始日を検出
  console.log('📅 学習AI実装開始日を検出中...');
  const startDate = detectLearningAIStartDate();
  console.log(`   開始日: ${startDate.toISOString().split('T')[0]}\n`);
  
  // 2. 修正コミットを検出
  console.log('🔍 修正コミットを検出中...');
  const commits = detectFixCommits(startDate);
  console.log(`   検出: ${commits.length}件のコミット\n`);
  
  if (commits.length === 0) {
    console.log('ℹ️  学習対象のコミットが見つかりませんでした');
    return;
  }
  
  // 3. パターンを抽出
  console.log('🎯 失敗パターンを抽出中...');
  const extractedPatterns = [];
  for (const commit of commits) {
    const patterns = extractFixPatterns(commit);
    extractedPatterns.push(...patterns);
  }
  console.log(`   抽出: ${extractedPatterns.length}件のパターン\n`);
  
  // 4. ホットスポットを検出
  console.log('🔥 ホットスポットを検出中...');
  const hotspots = detectHotspots(startDate);
  console.log(`   検出: ${hotspots.length}ファイル\n`);
  
  if (hotspots.length > 0) {
    console.log('   トップ5:');
    hotspots.slice(0, 5).forEach((h, i) => {
      console.log(`   ${i + 1}. ${h.file} (${h.count}回)`);
    });
    console.log('');
  }
  
  // 5. パターンをデータベースに統合
  console.log('💾 パターンをデータベースに統合中...');
  const stats = integratePatterns(extractedPatterns, hotspots);
  console.log(`   新規パターン: ${stats.newPatternsCount}件`);
  console.log(`   更新パターン: ${stats.updatedPatternsCount}件\n`);
  
  // 6. 学習レポートを生成
  console.log('📝 学習レポートを生成中...');
  const report = generateLearningReport(commits, extractedPatterns, hotspots, stats);
  const reportPath = path.join(__dirname, '../docs/GIT_HISTORY_LEARNING_REPORT.md');
  fs.writeFileSync(reportPath, report, 'utf-8');
  console.log(`   レポート: ${reportPath}\n`);
  
  // 7. Instructionsを自動更新
  console.log('📚 Instructionsを自動更新中...');
  try {
    execSync('node scripts/update-instructions.mjs all', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
  } catch (error) {
    console.error('⚠️  Instructions更新に失敗しました');
  }
  
  console.log('\n✅ Git履歴学習完了！');
  console.log(`\n📊 サマリー:`);
  console.log(`   - 解析コミット: ${commits.length}件`);
  console.log(`   - 抽出パターン: ${extractedPatterns.length}件`);
  console.log(`   - ホットスポット: ${hotspots.length}ファイル`);
  console.log(`   - 新規学習: ${stats.newPatternsCount}件`);
  console.log(`   - 更新: ${stats.updatedPatternsCount}件`);
  console.log(`\n📋 詳細レポート: ${reportPath}`);
}

main().catch(error => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});
