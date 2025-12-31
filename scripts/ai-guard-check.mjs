#!/usr/bin/env node

/**
 * AIガード起動スクリプト（リアルタイム）
 *
 * AI修正開始時に必ず実行され、以下を強制チェック:
 * 1. 過去の類似失敗パターン検索
 * 2. 関連仕様書の提示
 * 3. 危険な変更パターンの検出
 * 4. 必須チェックリストの表示
 *
 * 使用方法:
 *   # AI修正開始前に必ず実行
 *   node scripts/ai-guard-check.mjs "<ユーザー依頼内容>" [変更予定ファイル]
 *
 * 例:
 *   node scripts/ai-guard-check.mjs "バッチ完全消化後の次バッチ生成" "MemorizationView.tsx"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AI_FAILURE_HISTORY_PATH = path.join(__dirname, '../.aitk/ai-failure-history.json');
const FAILURE_PATTERNS_PATH = path.join(__dirname, '../.aitk/failure-patterns.json');
const INSTRUCTIONS_DIR = path.join(__dirname, '../.aitk/instructions');

// カラー出力
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
 * AI失敗履歴を読み込む
 */
function loadFailureHistory() {
  if (!fs.existsSync(AI_FAILURE_HISTORY_PATH)) {
    return { conversationFailures: [] };
  }
  return JSON.parse(fs.readFileSync(AI_FAILURE_HISTORY_PATH, 'utf-8'));
}

/**
 * 一般失敗パターンを読み込む
 */
function loadFailurePatterns() {
  if (!fs.existsSync(FAILURE_PATTERNS_PATH)) {
    return { failurePatterns: {} };
  }
  return JSON.parse(fs.readFileSync(FAILURE_PATTERNS_PATH, 'utf-8'));
}

/**
 * キーワードマッチング
 */
function matchKeywords(text, keywords) {
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * 類似失敗パターンを検索
 */
function searchSimilarFailures(userRequest, targetFiles) {
  const history = loadFailureHistory();
  const patterns = loadFailurePatterns();

  const results = {
    conversationFailures: [],
    codeFailures: [],
  };

  // キーワード抽出
  const keywords = extractKeywordsFromRequest(userRequest);

  // 会話失敗履歴から検索
  history.conversationFailures.forEach(failure => {
    if (matchKeywords(failure.userRequest, keywords)) {
      results.conversationFailures.push(failure);
    }
  });

  // コード失敗パターンから検索
  Object.values(patterns.failurePatterns || {}).forEach(pattern => {
    if (matchKeywords(pattern.description, keywords)) {
      results.codeFailures.push(pattern);
    }
  });

  // ファイル名マッチング
  if (targetFiles && targetFiles.length > 0) {
    history.conversationFailures.forEach(failure => {
      failure.attempts.forEach(attempt => {
        if (attempt.changes.some(file => targetFiles.includes(file))) {
          if (!results.conversationFailures.includes(failure)) {
            results.conversationFailures.push(failure);
          }
        }
      });
    });
  }

  return results;
}

/**
 * ユーザー依頼からキーワードを抽出
 */
function extractKeywordsFromRequest(request) {
  const keywords = [];

  // 技術キーワード
  const techPatterns = [
    { pattern: /バッチ|batch/gi, keyword: 'バッチ' },
    { pattern: /再計算|recompute|recalculate/gi, keyword: '再計算' },
    { pattern: /useEffect/gi, keyword: 'useEffect' },
    { pattern: /依存配列|dependency/gi, keyword: '依存配列' },
    { pattern: /無限ループ|infinite.*loop/gi, keyword: '無限ループ' },
    { pattern: /型|type/gi, keyword: '型' },
    { pattern: /Position|position/gi, keyword: 'Position' },
    { pattern: /カテゴリー|category/gi, keyword: 'カテゴリー' },
    { pattern: /スロット|slot/gi, keyword: 'スロット' },
    { pattern: /振動|vibration/gi, keyword: '振動' },
    { pattern: /出題|schedule/gi, keyword: '出題' },
  ];

  techPatterns.forEach(({ pattern, keyword }) => {
    if (pattern.test(request)) {
      keywords.push(keyword);
    }
  });

  return keywords;
}

/**
 * 関連仕様書を特定
 */
function identifyRelatedSpecs(userRequest, targetFiles) {
  const specs = [];

  const specMappings = [
    {
      keywords: ['バッチ', 'batch', '再計算', 'recompute'],
      file: 'batch-system-enforcement.instructions.md',
      title: 'バッチ方式の3原則',
      priority: 'CRITICAL',
    },
    {
      keywords: ['Position', 'position', '階層', 'hierarchy'],
      file: 'position-hierarchy-enforcement.instructions.md',
      title: 'Position階層の不変条件',
      priority: 'HIGH',
    },
    {
      keywords: ['カテゴリー', 'category', 'スロット', 'slot'],
      file: 'category-slots-enforcement.instructions.md',
      title: 'カテゴリースロット方式',
      priority: 'HIGH',
    },
    {
      keywords: ['仕様', 'spec', '設計', 'design'],
      file: 'mandatory-spec-check.instructions.md',
      title: '仕様確認の強制',
      priority: 'CRITICAL',
    },
    {
      keywords: ['修正', 'modify', 'fix', '変更'],
      file: 'modification-enforcement.instructions.md',
      title: '修正前チェックリスト',
      priority: 'CRITICAL',
    },
  ];

  specMappings.forEach(mapping => {
    if (matchKeywords(userRequest, mapping.keywords)) {
      const specPath = path.join(INSTRUCTIONS_DIR, mapping.file);
      if (fs.existsSync(specPath)) {
        specs.push({
          file: mapping.file,
          path: specPath,
          title: mapping.title,
          priority: mapping.priority,
        });
      }
    }
  });

  // ファイル別の仕様書マッピング
  if (targetFiles) {
    targetFiles.forEach(file => {
      if (file.includes('MemorizationView') || file.includes('QuestionScheduler')) {
        const batchSpec = path.join(INSTRUCTIONS_DIR, 'batch-system-enforcement.instructions.md');
        if (fs.existsSync(batchSpec) && !specs.find(s => s.file === 'batch-system-enforcement.instructions.md')) {
          specs.push({
            file: 'batch-system-enforcement.instructions.md',
            path: batchSpec,
            title: 'バッチ方式の3原則',
            priority: 'CRITICAL',
          });
        }
      }
    });
  }

  // 必須仕様書（常に含める）
  const mandatorySpecs = ['mandatory-spec-check.instructions.md', 'ai-failure-prevention.instructions.md'];
  mandatorySpecs.forEach(specFile => {
    const specPath = path.join(INSTRUCTIONS_DIR, specFile);
    if (fs.existsSync(specPath) && !specs.find(s => s.file === specFile)) {
      specs.push({
        file: specFile,
        path: specPath,
        title: specFile.replace('.instructions.md', ''),
        priority: 'CRITICAL',
      });
    }
  });

  return specs;
}

/**
 * 危険な変更パターンを検出
 */
function detectDangerousPatterns(userRequest, targetFiles) {
  const dangers = [];

  const dangerPatterns = [
    {
      keywords: ['バッチ', 'batch', '配列', 'array', '順序', 'order'],
      files: ['MemorizationView.tsx', 'QuestionScheduler.ts'],
      warning: 'バッチ確定後の配列変更は振動の原因です',
      action: 'batch-system-enforcement.instructions.mdを必ず確認',
      severity: 'CRITICAL',
    },
    {
      keywords: ['useEffect', '依存配列', 'dependency'],
      files: ['*.tsx', '*.ts'],
      warning: '無限ループの危険性があります',
      action: 'state更新とuseEffect実行の因果関係を図示してください',
      severity: 'HIGH',
    },
    {
      keywords: ['clearExpiredFlags', '再スケジューリング', 'reschedule'],
      files: ['QuestionScheduler.ts', 'MemorizationView.tsx'],
      warning: 'useCategorySlots=true時はこれらの機能を無効化する必要があります',
      action: 'バッチ方式の原則を確認してください',
      severity: 'CRITICAL',
    },
    {
      keywords: ['型', 'type', 'プロパティ', 'property'],
      files: ['*.ts', '*.tsx'],
      warning: 'プロパティ名を推測していませんか？',
      action: '型定義ファイルを確認し、IDEの型推論を信頼してください',
      severity: 'MEDIUM',
    },
  ];

  dangerPatterns.forEach(pattern => {
    const keywordMatch = matchKeywords(userRequest, pattern.keywords);
    const fileMatch = targetFiles && targetFiles.some(file =>
      pattern.files.some(pf => {
        if (pf.includes('*')) {
          const regex = new RegExp(pf.replace('*', '.*'));
          return regex.test(file);
        }
        return file.includes(pf);
      })
    );

    if (keywordMatch || fileMatch) {
      dangers.push(pattern);
    }
  });

  return dangers;
}

/**
 * 必須チェックリストを表示
 */
function displayCheckList() {
  return `
${colors.bold}${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
${colors.bold}${colors.red}⚠️  CRITICAL: 修正前の必須チェックリスト${colors.reset}
${colors.bold}${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}

${colors.cyan}□ 1. このガードレポートを読んだ${colors.reset}
${colors.cyan}□ 2. 過去の類似失敗パターンを確認した${colors.reset}
${colors.cyan}□ 3. 関連する仕様書を確認した${colors.reset}
${colors.cyan}□ 4. バッチ方式の原則を理解した${colors.reset}
${colors.cyan}□ 5. Position階層を理解した${colors.reset}
${colors.cyan}□ 6. ユーザーに不明点を質問した${colors.reset}

${colors.bold}${colors.red}❌ このチェックリストを完了せずに修正を開始してはいけません${colors.reset}
${colors.bold}${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
`;
}

/**
 * メインレポート生成
 */
function generateGuardReport(userRequest, targetFiles) {
  const report = [];

  report.push('');
  report.push(`${colors.bold}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  report.push(`${colors.bold}${colors.blue}🛡️  サーバント水先案内人: リアルタイムガード起動${colors.reset}`);
  report.push(`${colors.bold}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  report.push('');

  // ユーザー依頼
  report.push(`${colors.bold}📋 ユーザー依頼:${colors.reset}`);
  report.push(`   "${userRequest}"`);
  report.push('');

  if (targetFiles && targetFiles.length > 0) {
    report.push(`${colors.bold}📁 変更予定ファイル:${colors.reset}`);
    targetFiles.forEach(file => {
      report.push(`   - ${file}`);
    });
    report.push('');
  }

  // 類似失敗パターン検索
  report.push(`${colors.bold}${colors.yellow}🔍 過去の類似失敗パターンを検索中...${colors.reset}`);
  const similarFailures = searchSimilarFailures(userRequest, targetFiles);

  if (similarFailures.conversationFailures.length > 0) {
    report.push('');
    report.push(`${colors.bold}${colors.red}⚠️  警告: 過去に類似した失敗があります！${colors.reset}`);
    report.push('');

    similarFailures.conversationFailures.slice(0, 3).forEach((failure, i) => {
      report.push(`${colors.bold}${i + 1}. ${failure.userRequest}${colors.reset}`);
      report.push(`   ${colors.yellow}試行回数: ${failure.totalAttempts}回${colors.reset}`);

      const failedAttempts = failure.attempts.filter(a => !a.success);
      if (failedAttempts.length > 0) {
        report.push(`   ${colors.red}失敗理由:${colors.reset}`);
        failedAttempts.forEach(attempt => {
          if (attempt.failureReason) {
            report.push(`   - ${attempt.failureReason}`);
          }
        });
      }

      const successAttempt = failure.attempts.find(a => a.success);
      if (successAttempt && successAttempt.solutionDescription) {
        report.push(`   ${colors.green}✅ 成功した解決方法: ${successAttempt.solutionDescription}${colors.reset}`);
      }

      if (failure.learningPoints && failure.learningPoints.length > 0) {
        report.push(`   ${colors.cyan}🎓 学習ポイント:${colors.reset}`);
        failure.learningPoints.forEach(point => {
          report.push(`   - ${point}`);
        });
      }

      report.push('');
    });
  } else {
    report.push(`   ${colors.green}✅ 類似失敗なし（初めてのパターン）${colors.reset}`);
    report.push('');
  }

  // 危険な変更パターン検出
  report.push(`${colors.bold}${colors.yellow}⚠️  危険な変更パターンを検出中...${colors.reset}`);
  const dangers = detectDangerousPatterns(userRequest, targetFiles);

  if (dangers.length > 0) {
    report.push('');
    report.push(`${colors.bold}${colors.red}🚨 ${dangers.length}個の危険パターンを検出しました！${colors.reset}`);
    report.push('');

    dangers.forEach((danger, i) => {
      const severityColor = danger.severity === 'CRITICAL' ? colors.red : danger.severity === 'HIGH' ? colors.yellow : colors.cyan;
      report.push(`${colors.bold}${severityColor}${i + 1}. [${danger.severity}] ${danger.warning}${colors.reset}`);
      report.push(`   ${colors.cyan}対策: ${danger.action}${colors.reset}`);
      report.push('');
    });
  } else {
    report.push(`   ${colors.green}✅ 危険パターンなし${colors.reset}`);
    report.push('');
  }

  // 関連仕様書の特定
  report.push(`${colors.bold}${colors.magenta}📖 確認すべき仕様書:${colors.reset}`);
  const specs = identifyRelatedSpecs(userRequest, targetFiles);

  if (specs.length > 0) {
    report.push('');
    specs.forEach((spec, i) => {
      const priorityColor = spec.priority === 'CRITICAL' ? colors.red : colors.yellow;
      report.push(`${colors.bold}${priorityColor}${i + 1}. [${spec.priority}] ${spec.title}${colors.reset}`);
      report.push(`   ${colors.cyan}${spec.path}${colors.reset}`);
      report.push('');
    });
  }

  // 必須チェックリスト
  report.push(displayCheckList());

  // 次のアクション
  report.push('');
  report.push(`${colors.bold}${colors.green}📝 次のアクション:${colors.reset}`);
  report.push('');
  report.push(`${colors.cyan}1. 上記の仕様書を必ず読む${colors.reset}`);
  report.push(`${colors.cyan}2. 過去の失敗を参考にする${colors.reset}`);
  report.push(`${colors.cyan}3. 不明点があればユーザーに質問する${colors.reset}`);
  report.push(`${colors.cyan}4. セッションを開始:${colors.reset}`);
  report.push(`   ${colors.yellow}node scripts/record-ai-failure.mjs start "${userRequest}"${colors.reset}`);
  report.push('');

  report.push(`${colors.bold}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  report.push(`${colors.bold}${colors.green}✅ ガードチェック完了 - 修正を開始できます${colors.reset}`);
  report.push(`${colors.bold}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  report.push('');

  return report.join('\n');
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
    console.log('  node scripts/ai-guard-check.mjs "<ユーザー依頼内容>" [変更予定ファイル...]');
    console.log('');
    console.log('例:');
    console.log('  node scripts/ai-guard-check.mjs "バッチ完全消化後の次バッチ生成" "MemorizationView.tsx"');
    process.exit(1);
  }

  const userRequest = args[0];
  const targetFiles = args.slice(1);

  const report = generateGuardReport(userRequest, targetFiles);
  console.log(report);
}

main();
