/**
 * 暗記タブの振動問題シミュレーション
 * 「分からない」を連打した場合の出題順序を検証
 *
 * 実行方法:
 *   node scripts/simulate-memorization-vibration.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// テスト用のProgress状態（メモリ上で管理）
const mockProgress = {
  wordProgress: {},
  lastUpdated: Date.now(),
};

// テスト用のQuestionデータ（実際のデータから30語を抽出）
const testQuestions = [
  { word: 'grandma', meaning: '祖母', position: 85, grade: 5 },
  { word: 'endangered', meaning: '絶滅危惧の', position: 85, grade: 7 },
  { word: 'simply', meaning: '単純に', position: 85, grade: 6 },
  { word: 'alone', meaning: '一人で', position: 60, grade: 4 },
  { word: 'metal', meaning: '金属', position: 50, grade: 5 },
  { word: 'arrive', meaning: '到着する', position: 60, grade: 4 },
  { word: 'ancient', meaning: '古代の', position: 50, grade: 6 },
  { word: 'wise', meaning: '賢い', position: 45, grade: 5 },
  { word: 'beneath', meaning: '下に', position: 40, grade: 6 },
  { word: 'citizen', meaning: '市民', position: 35, grade: 6 },
  // 新規20語（Position 0）
  { word: 'abandon', meaning: '捨てる', position: 0, grade: 7 },
  { word: 'ability', meaning: '能力', position: 0, grade: 5 },
  { word: 'abroad', meaning: '海外へ', position: 0, grade: 6 },
  { word: 'absence', meaning: '不在', position: 0, grade: 6 },
  { word: 'absolute', meaning: '絶対的な', position: 0, grade: 7 },
  { word: 'absorb', meaning: '吸収する', position: 0, grade: 7 },
  { word: 'abstract', meaning: '抽象的な', position: 0, grade: 8 },
  { word: 'abundant', meaning: '豊富な', position: 0, grade: 7 },
  { word: 'accept', meaning: '受け入れる', position: 0, grade: 5 },
  { word: 'access', meaning: 'アクセス', position: 0, grade: 6 },
  { word: 'accident', meaning: '事故', position: 0, grade: 5 },
  { word: 'accompany', meaning: '同行する', position: 0, grade: 6 },
  { word: 'accomplish', meaning: '達成する', position: 0, grade: 7 },
  { word: 'accord', meaning: '一致', position: 0, grade: 7 },
  { word: 'account', meaning: '口座', position: 0, grade: 5 },
  { word: 'accurate', meaning: '正確な', position: 0, grade: 6 },
  { word: 'accuse', meaning: '非難する', position: 0, grade: 7 },
  { word: 'achieve', meaning: '達成する', position: 0, grade: 5 },
  { word: 'acknowledge', meaning: '認める', position: 0, grade: 7 },
  { word: 'acquire', meaning: '獲得する', position: 0, grade: 7 },
];

// Progress状態を初期化
function initializeProgress() {
  testQuestions.forEach(q => {
    mockProgress.wordProgress[q.word] = {
      memorizationPosition: q.position,
      memorizationAttempts: q.position > 0 ? Math.floor(q.position / 5) : 0,
      memorizationCorrect: 0,
      memorizationIncorrect: q.position > 0 ? Math.floor(q.position / 5) : 0,
      totalAttempts: q.position > 0 ? Math.floor(q.position / 5) : 0,
      consecutiveCorrect: 0,
      lastReviewed: q.position > 0 ? Date.now() - 86400000 : null, // 1日前
    };
  });
}

// Position計算（簡易版）
function calculatePosition(wordProgress) {
  const attempts = wordProgress.memorizationAttempts || 0;
  const incorrect = wordProgress.memorizationIncorrect || 0;

  if (attempts === 0) return 0;

  const incorrectRate = incorrect / attempts;
  if (incorrectRate >= 0.8) return 85; // まだまだ
  if (incorrectRate >= 0.6) return 60; // 分からない
  if (incorrectRate >= 0.4) return 40; // もう少し
  if (incorrectRate >= 0.2) return 25; // あと一歩
  return 10; // 定着済み
}

// インターリーブ計算（簡易版）
function calculateInterleaving(questions) {
  const weakWords = questions.filter(q => q.position >= 40).sort((a, b) => b.position - a.position);
  const newWords = questions.filter(q => q.position === 0);
  const reviewWords = questions.filter(q => q.position > 0 && q.position < 40);

  const result = [];
  let weakIndex = 0;
  let newIndex = 0;
  let reviewIndex = 0;

  // インターリーブパターン: まだまだ → 新規 → まだまだ → 新規 ...
  while (result.length < 30) {
    if (weakIndex < weakWords.length) {
      result.push(weakWords[weakIndex++]);
    }
    if (result.length < 30 && newIndex < newWords.length) {
      result.push(newWords[newIndex++]);
    }
    if (result.length < 30 && reviewIndex < reviewWords.length) {
      result.push(reviewWords[reviewIndex++]);
    }

    // 無限ループ防止
    if (weakIndex >= weakWords.length && newIndex >= newWords.length && reviewIndex >= reviewWords.length) {
      break;
    }
  }

  return result.slice(0, 30);
}

// 「分からない」解答をシミュレート
function simulateIncorrectAnswer(word) {
  const wp = mockProgress.wordProgress[word];
  if (!wp) return;

  wp.memorizationAttempts = (wp.memorizationAttempts || 0) + 1;
  wp.memorizationIncorrect = (wp.memorizationIncorrect || 0) + 1;
  wp.totalAttempts = (wp.totalAttempts || 0) + 1;
  wp.consecutiveCorrect = 0;
  wp.lastReviewed = Date.now();

  // Position再計算
  wp.memorizationPosition = calculatePosition(wp);
}

// スケジューリングシミュレーション
function simulateScheduling() {
  const questions = testQuestions.map(q => ({
    ...q,
    position: mockProgress.wordProgress[q.word]?.memorizationPosition || 0,
  }));

  return calculateInterleaving(questions);
}

// 振動検出
function detectVibration(history) {
  const vibrations = [];

  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1];
    const curr = history[i];

    // 同じ単語が連続で出現
    const prevWords = prev.map(q => q.word);
    const currWords = curr.map(q => q.word);

    for (let j = 0; j < Math.min(5, prevWords.length, currWords.length); j++) {
      if (prevWords[j] === currWords[j]) {
        vibrations.push({
          answerIndex: i,
          word: prevWords[j],
          position: j,
        });
      }
    }
  }

  return vibrations;
}

// メインシミュレーション
function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 暗記タブ振動シミュレーション');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  initializeProgress();

  console.log('✅ 初期状態:');
  console.log(`   - まだまだ語: ${testQuestions.filter(q => q.position >= 60).length}語`);
  console.log(`   - 分からない: ${testQuestions.filter(q => q.position >= 40 && q.position < 60).length}語`);
  console.log(`   - もう少し: ${testQuestions.filter(q => q.position >= 25 && q.position < 40).length}語`);
  console.log(`   - 新規: ${testQuestions.filter(q => q.position === 0).length}語\n`);

  const schedulingHistory = [];

  // 初回スケジューリング
  console.log('━━━ 初回スケジューリング ━━━');
  const initialSchedule = simulateScheduling();
  schedulingHistory.push(initialSchedule);

  console.log('出題予定 (TOP10):');
  initialSchedule.slice(0, 10).forEach((q, i) => {
    console.log(`  ${i + 1}. ${q.word.padEnd(15)} (Position: ${q.position})`);
  });
  console.log('');

  // 30問「分からない」をシミュレート
  console.log('━━━ 「分からない」を30回連打 ━━━\n');

  for (let i = 0; i < 30; i++) {
    const currentQuestion = schedulingHistory[schedulingHistory.length - 1][i];

    if (!currentQuestion) {
      console.log(`⚠️  問題${i + 1}: 出題予定なし（キュー不足）`);
      break;
    }

    simulateIncorrectAnswer(currentQuestion.word);

    const wp = mockProgress.wordProgress[currentQuestion.word];
    console.log(`  ${i + 1}. ${currentQuestion.word.padEnd(15)} → Position: ${wp.memorizationPosition} (試行: ${wp.memorizationAttempts})`);

    // 10回ごとに再スケジューリング（初回30回はスキップ）
    if (i >= 30 && (i + 1) % 10 === 0) {
      console.log(`\n━━━ 再スケジューリング (${i + 1}回目) ━━━`);
      const rescheduled = simulateScheduling();
      schedulingHistory.push(rescheduled);

      console.log('出題予定 (TOP10):');
      rescheduled.slice(0, 10).forEach((q, idx) => {
        console.log(`  ${idx + 1}. ${q.word.padEnd(15)} (Position: ${q.position})`);
      });
      console.log('');
    }
  }

  console.log('\n━━━ シミュレーション完了 ━━━\n');

  // 振動検出
  console.log('━━━ 振動検出 ━━━');
  const vibrations = detectVibration(schedulingHistory);

  if (vibrations.length === 0) {
    console.log('✅ 振動なし: 出題順序は正常です\n');
  } else {
    console.log(`❌ 振動検出: ${vibrations.length}件\n`);
    vibrations.slice(0, 5).forEach(v => {
      console.log(`  - 解答${v.answerIndex}回目: "${v.word}" が位置${v.position}で再出現`);
    });
    console.log('');
  }

  // 最終状態
  console.log('━━━ 最終状態 ━━━');
  const finalPositions = testQuestions.map(q => ({
    word: q.word,
    initialPosition: q.position,
    finalPosition: mockProgress.wordProgress[q.word].memorizationPosition,
  })).sort((a, b) => b.finalPosition - a.finalPosition);

  console.log('Position変化 (TOP10):');
  finalPositions.slice(0, 10).forEach((item, i) => {
    const change = item.finalPosition - item.initialPosition;
    const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '→';
    console.log(`  ${i + 1}. ${item.word.padEnd(15)}: ${item.initialPosition} → ${item.finalPosition} ${arrow} (${change >= 0 ? '+' : ''}${change})`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ シミュレーション完了');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main();
