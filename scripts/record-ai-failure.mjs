#!/usr/bin/env node

/**
 * AI修正失敗記録スクリプト
 *
 * AIとユーザーの対話における修正失敗を記録し、
 * サーバントが次回同じ失敗を防ぐためのガードを生成する
 *
 * 使用例:
 *   node scripts/record-ai-failure.mjs start "バッチ完全消化後の次バッチ生成を実装"
 *   node scripts/record-ai-failure.mjs attempt "MemorizationView.tsx" "無限ループが発生"
 *   node scripts/record-ai-failure.mjs success "needsBatchRegenerationフラグで解決"
 *   node scripts/record-ai-failure.mjs cancel
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AI_FAILURE_HISTORY_PATH = path.join(__dirname, '../.aitk/ai-failure-history.json');
const TEMP_SESSION_PATH = path.join(__dirname, '../.aitk/.ai-session-temp.json');

/**
 * AI失敗履歴を読み込む
 */
function loadFailureHistory() {
  if (!fs.existsSync(AI_FAILURE_HISTORY_PATH)) {
    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString().split('T')[0],
      metadata: {
        totalFailures: 0,
        totalRecoveries: 0,
        averageAttemptsToSuccess: 0,
        mostCommonFailureTypes: [],
        learningRate: 0.1
      },
      failurePatterns: {},
      conversationFailures: [],
      preventionRules: { rules: [] },
      successPatterns: { patterns: [] }
    };
  }
  return JSON.parse(fs.readFileSync(AI_FAILURE_HISTORY_PATH, 'utf-8'));
}

/**
 * AI失敗履歴を保存する
 */
function saveFailureHistory(history) {
  fs.writeFileSync(AI_FAILURE_HISTORY_PATH, JSON.stringify(history, null, 2), 'utf-8');
}

/**
 * 現在のセッションを読み込む
 */
function loadCurrentSession() {
  if (!fs.existsSync(TEMP_SESSION_PATH)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(TEMP_SESSION_PATH, 'utf-8'));
}

/**
 * 現在のセッションを保存する
 */
function saveCurrentSession(session) {
  fs.writeFileSync(TEMP_SESSION_PATH, JSON.stringify(session, null, 2), 'utf-8');
}

/**
 * セッションを削除する
 */
function clearCurrentSession() {
  if (fs.existsSync(TEMP_SESSION_PATH)) {
    fs.unlinkSync(TEMP_SESSION_PATH);
  }
}

/**
 * 新しい修正依頼セッションを開始
 */
function startSession(userRequest) {
  const session = {
    id: `session-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userRequest: userRequest,
    attempts: [],
    status: 'in-progress'
  };

  saveCurrentSession(session);

  console.log('✅ AI修正セッション開始');
  console.log(`   ID: ${session.id}`);
  console.log(`   依頼: "${userRequest}"`);
  console.log('');
  console.log('📝 次のコマンド:');
  console.log('   - 修正試行を記録: node scripts/record-ai-failure.mjs attempt "<変更ファイル>" "<ユーザーフィードバック>"');
  console.log('   - 成功を記録: node scripts/record-ai-failure.mjs success "<解決方法>"');
  console.log('   - キャンセル: node scripts/record-ai-failure.mjs cancel');
}

/**
 * 修正試行を記録
 */
function recordAttempt(changedFiles, userFeedback) {
  const session = loadCurrentSession();

  if (!session) {
    console.error('❌ エラー: アクティブなセッションがありません');
    console.error('   まず `node scripts/record-ai-failure.mjs start "<依頼内容>"` を実行してください');
    process.exit(1);
  }

  const attemptNumber = session.attempts.length + 1;
  const attempt = {
    attemptNumber: attemptNumber,
    timestamp: new Date().toISOString(),
    changes: Array.isArray(changedFiles) ? changedFiles : [changedFiles],
    userFeedback: userFeedback,
    failureReason: null,
    success: false
  };

  session.attempts.push(attempt);
  saveCurrentSession(session);

  console.log(`📝 試行 #${attemptNumber} を記録しました`);
  console.log(`   変更ファイル: ${attempt.changes.join(', ')}`);
  console.log(`   フィードバック: "${userFeedback}"`);
  console.log('');

  // 失敗理由を推測
  const failureReason = detectFailureReason(userFeedback, attempt.changes);
  if (failureReason) {
    console.log(`🔍 推定失敗理由: ${failureReason}`);
    attempt.failureReason = failureReason;
    saveCurrentSession(session);
  }

  console.log('📝 次のコマンド:');
  console.log('   - 次の修正を試行: node scripts/record-ai-failure.mjs attempt "<変更ファイル>" "<フィードバック>"');
  console.log('   - 成功: node scripts/record-ai-failure.mjs success "<解決方法>"');
}

/**
 * 成功を記録
 */
function recordSuccess(solutionDescription) {
  const session = loadCurrentSession();

  if (!session) {
    console.error('❌ エラー: アクティブなセッションがありません');
    process.exit(1);
  }

  const attemptNumber = session.attempts.length + 1;
  const successAttempt = {
    attemptNumber: attemptNumber,
    timestamp: new Date().toISOString(),
    changes: [],
    userFeedback: 'Success',
    failureReason: null,
    success: true,
    solutionDescription: solutionDescription
  };

  session.attempts.push(successAttempt);
  session.status = 'success';
  session.totalAttempts = attemptNumber;
  session.solutionDescription = solutionDescription;

  // 失敗履歴に追加
  const history = loadFailureHistory();
  history.conversationFailures.push(session);

  // メタデータ更新
  if (attemptNumber > 1) {
    history.metadata.totalFailures += (attemptNumber - 1);
  }
  history.metadata.totalRecoveries += 1;

  const allAttempts = history.conversationFailures.map(s => s.totalAttempts || 1);
  history.metadata.averageAttemptsToSuccess =
    allAttempts.reduce((sum, a) => sum + a, 0) / allAttempts.length;

  history.lastUpdated = new Date().toISOString().split('T')[0];

  // 学習ポイントを抽出
  const learningPoints = extractLearningPoints(session);
  session.learningPoints = learningPoints;

  // 成功パターンを追加
  if (learningPoints.length > 0) {
    history.successPatterns.patterns.push({
      timestamp: new Date().toISOString(),
      userRequest: session.userRequest,
      solution: solutionDescription,
      attempts: attemptNumber,
      learningPoints: learningPoints
    });
  }

  saveFailureHistory(history);
  clearCurrentSession();

  console.log('');
  console.log('✅ 修正成功を記録しました！');
  console.log(`   試行回数: ${attemptNumber}回`);
  console.log(`   解決方法: "${solutionDescription}"`);
  console.log('');

  if (learningPoints.length > 0) {
    console.log('🎓 学習ポイント:');
    learningPoints.forEach((point, i) => {
      console.log(`   ${i + 1}. ${point}`);
    });
    console.log('');
  }

  console.log('📊 統計:');
  console.log(`   - 総失敗数: ${history.metadata.totalFailures}`);
  console.log(`   - 総回復数: ${history.metadata.totalRecoveries}`);
  console.log(`   - 平均試行回数: ${history.metadata.averageAttemptsToSuccess.toFixed(1)}回`);
  console.log('');
  console.log('💡 サーバントが次回同じ失敗を防ぐためのガードを生成します:');
  console.log('   node scripts/learn-from-ai-failures.mjs');
}

/**
 * セッションをキャンセル
 */
function cancelSession() {
  const session = loadCurrentSession();

  if (!session) {
    console.log('ℹ️  アクティブなセッションはありません');
    return;
  }

  clearCurrentSession();
  console.log('❌ セッションをキャンセルしました');
}

/**
 * 失敗理由を推測
 */
function detectFailureReason(feedback, changedFiles) {
  const lowerFeedback = feedback.toLowerCase();

  if (lowerFeedback.includes('無限ループ') || lowerFeedback.includes('infinite loop')) {
    return 'useEffect依存配列の設定ミス';
  }

  if (lowerFeedback.includes('型エラー') || lowerFeedback.includes('type error')) {
    return '型定義の不一致';
  }

  if (lowerFeedback.includes('動作しない') || lowerFeedback.includes('not working')) {
    return 'ロジックの実装漏れまたは誤り';
  }

  if (lowerFeedback.includes('まだ') && lowerFeedback.includes('直って')) {
    return '修正が不完全または別の箇所が原因';
  }

  if (lowerFeedback.includes('バッチ') || lowerFeedback.includes('batch')) {
    return 'バッチ方式の原則違反';
  }

  if (lowerFeedback.includes('再計算') || lowerFeedback.includes('recompute')) {
    return '再計算タイミングの誤り';
  }

  return null;
}

/**
 * 学習ポイントを抽出
 */
function extractLearningPoints(session) {
  const points = [];

  // 試行回数が多い場合
  if (session.totalAttempts > 3) {
    points.push(`修正に${session.totalAttempts}回の試行が必要だった - 初回の仕様理解を強化すべき`);
  }

  // 失敗理由から学習
  const failureReasons = session.attempts
    .filter(a => a.failureReason)
    .map(a => a.failureReason);

  if (failureReasons.length > 0) {
    const uniqueReasons = [...new Set(failureReasons)];
    uniqueReasons.forEach(reason => {
      points.push(`頻出失敗: ${reason}`);
    });
  }

  // ユーザーフィードバックからパターン抽出
  const feedbacks = session.attempts.map(a => a.userFeedback.toLowerCase());

  if (feedbacks.some(f => f.includes('仕様') || f.includes('spec'))) {
    points.push('仕様確認の不足 - 修正前に必ず仕様書を確認すべき');
  }

  if (feedbacks.some(f => f.includes('バッチ') || f.includes('batch'))) {
    points.push('バッチ方式の原則理解不足 - batch-system-enforcement.instructions.mdを確認');
  }

  // 解決方法から学習
  if (session.solutionDescription) {
    const solution = session.solutionDescription.toLowerCase();

    if (solution.includes('フラグ') || solution.includes('flag')) {
      points.push('状態管理にフラグを導入することで解決');
    }

    if (solution.includes('useeffect') || solution.includes('依存配列')) {
      points.push('useEffect依存配列の適切な設定が重要');
    }
  }

  return points;
}

/**
 * セッション状態を表示
 */
function showStatus() {
  const session = loadCurrentSession();

  if (!session) {
    console.log('ℹ️  アクティブなセッションはありません');
    console.log('');
    console.log('📝 新しいセッションを開始:');
    console.log('   node scripts/record-ai-failure.mjs start "<ユーザー依頼内容>"');
    return;
  }

  console.log('📊 現在のセッション状態');
  console.log(`   ID: ${session.id}`);
  console.log(`   依頼: "${session.userRequest}"`);
  console.log(`   試行回数: ${session.attempts.length}回`);
  console.log('');

  if (session.attempts.length > 0) {
    console.log('📝 試行履歴:');
    session.attempts.forEach((attempt, i) => {
      console.log(`   ${i + 1}. ${attempt.userFeedback}`);
      if (attempt.failureReason) {
        console.log(`      理由: ${attempt.failureReason}`);
      }
    });
  }
}

/**
 * メイン処理
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('使用方法:');
    console.log('  node scripts/record-ai-failure.mjs start "<ユーザー依頼内容>"');
    console.log('  node scripts/record-ai-failure.mjs attempt "<変更ファイル>" "<ユーザーフィードバック>"');
    console.log('  node scripts/record-ai-failure.mjs success "<解決方法>"');
    console.log('  node scripts/record-ai-failure.mjs cancel');
    console.log('  node scripts/record-ai-failure.mjs status');
    process.exit(1);
  }

  switch (command) {
    case 'start':
      const userRequest = args[1];
      if (!userRequest) {
        console.error('エラー: ユーザー依頼内容を指定してください');
        process.exit(1);
      }
      startSession(userRequest);
      break;

    case 'attempt':
      const changedFiles = args[1];
      const userFeedback = args[2];
      if (!changedFiles || !userFeedback) {
        console.error('エラー: 変更ファイルとユーザーフィードバックを指定してください');
        process.exit(1);
      }
      recordAttempt(changedFiles, userFeedback);
      break;

    case 'success':
      const solutionDescription = args[1];
      if (!solutionDescription) {
        console.error('エラー: 解決方法を指定してください');
        process.exit(1);
      }
      recordSuccess(solutionDescription);
      break;

    case 'cancel':
      cancelSession();
      break;

    case 'status':
      showStatus();
      break;

    default:
      console.error(`エラー: 未知のコマンド "${command}"`);
      process.exit(1);
  }
}

main();
