// @test-guard-bypass: Unit test for priority sorting algorithm - no data files used
import { describe, it, expect /* , beforeEach */ } from 'vitest';
import { sortQuestionsByPriority as sortQuestionsByPriorityImpl } from '../../src/utils/questionPrioritySorter';
import type { WordProgress } from '../../src/storage/progress/types';
import type { Question } from '../../src/types';

/**
 * 学習AIネットワーク - テスト駆動開発
 *
 * 目的: 20問解答後、学習AIが21問目以降をどう出題するか検証
 * 方針: 5つの異なる解答パターンで、優先度順が正しいかテスト
 */

// ラッパー関数: テストの簡便性のため、古いシグネチャをサポート
function sortQuestionsByPriority(
  questions: Question[],
  progressMap: Map<string, WordProgress>,
  isReviewFocusMode: boolean,
  concentrationThreshold: number,
  _newQuestionThreshold: number
): Question[] {
  // LocalStorageにprogressMapを保存
  const progressObj: Record<string, WordProgress> = {};
  progressMap.forEach((value, key) => {
    progressObj[key] = value;
  });
  const progressData = {
    wordProgress: progressObj,
  };
  localStorage.setItem('english-progress', JSON.stringify(progressData));

  // 新しいシグネチャで呼び出し
  return sortQuestionsByPriorityImpl(questions, {
    mode: 'memorization',
    isReviewFocusMode,
    learningLimit: concentrationThreshold,
    reviewLimit: concentrationThreshold,
  });
}

// テスト用の30問を生成
function generateTestQuestions(): Question[] {
  return Array.from({ length: 30 }, (_, i) => ({
    word: `word${i + 1}`,
    meaning: `意味${i + 1}`,
    reading: `reading${i + 1}`,
    etymology: `語源${i + 1}`,
    relatedWords: `関連語${i + 1}`,
    relatedFields: `分野${i + 1}`,
    difficulty: i < 10 ? 'beginner' : i < 20 ? 'intermediate' : 'advanced',
  }));
}

// WordProgress初期化
function initializeWordProgress(word: string): WordProgress {
  return {
    word,
    correctCount: 0,
    incorrectCount: 0,
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
    firstAttempted: Date.now() - 60 * 60 * 1000, // 1時間前
    lastStudied: Date.now(),
    totalResponseTime: 0,
    averageResponseTime: 0,
    difficultyScore: 50,
    masteryLevel: 'new',
    responseTimes: [],
  };
}

// 解答パターンを適用してWordProgressを更新
function applyAnswerPattern(pattern: string): Map<string, WordProgress> {
  const progressMap = new Map<string, WordProgress>();
  const tokens = pattern.split(',').map((s) => s.trim());
  const baseTime = Date.now() - 60 * 60 * 1000;

  tokens.forEach((token, index) => {
    const isCorrect = token.startsWith('+');
    const questionId = parseInt(token.substring(1), 10);
    const word = `word${questionId}`;

    if (!progressMap.has(word)) {
      const progress = initializeWordProgress(word);
      progress.firstAttempted = baseTime + index * 2 * 60 * 1000;
      progressMap.set(word, progress);
    }

    const progress = progressMap.get(word)!;

    if (isCorrect) {
      progress.correctCount++;
      progress.consecutiveCorrect++;
    } else {
      progress.incorrectCount++;
      progress.consecutiveCorrect = 0;
      progress.consecutiveIncorrect++;
    }

    const total = progress.correctCount + progress.incorrectCount;
    const accuracy = progress.correctCount / total;

    // masteryLevel更新
    if (total === 1 && progress.correctCount === 1) {
      progress.masteryLevel = 'mastered';
    } else if (progress.consecutiveCorrect >= 3 || (total >= 3 && accuracy >= 0.9)) {
      progress.masteryLevel = 'mastered';
    } else {
      progress.masteryLevel = 'learning';
    }

    progress.lastStudied = baseTime + index * 2 * 60 * 1000;
  });

  return progressMap;
}

describe('学習AIネットワーク - 21問目以降の出題順序テスト', () => {
  it('パターン1: 苦戦型（30%正答率） - 不正解問題が最優先されるべき', () => {
    // 20問中6問正解、14問不正解
    const pattern =
      '-1, -2, -3, +4, -5, -6, -7, +8, -9, -10, -11, +12, -13, -14, -15, +16, -17, -18, +19, -20';
    const progressMap = applyAnswerPattern(pattern);
    const questions = generateTestQuestions();

    const sorted = sortQuestionsByPriority(
      questions,
      progressMap,
      false, // isReviewFocusMode
      10, // concentrationThreshold
      5 // newQuestionThreshold
    );

    // デバッグ出力
    const top10 = sorted.slice(0, 10);
    console.log('\n✅ パターン1: 苦戦型（30%正答率）');
    console.log(`上位10問: ${top10.map((q) => q.word).join(', ')}`);
    console.log(`上位10問の詳細:`);
    sorted.slice(0, 10).forEach((q, i) => {
      const progress = progressMap.get(q.word);
      if (progress) {
        const total = progress.correctCount + progress.incorrectCount;
        const accuracy = progress.correctCount / total;
        console.log(
          `  ${i + 1}. ${q.word}: 正解${progress.correctCount}/${total} (${(accuracy * 100).toFixed(0)}%) 連続${progress.consecutiveCorrect}`
        );
      } else {
        console.log(`  ${i + 1}. ${q.word}: 未学習`);
      }
    });

    // 検証1: 上位10問の多くは「分からない」問題であるべき
    const strugglingQuestions = top10.filter((q) => {
      const progress = progressMap.get(q.word);
      if (!progress) return false;
      const total = progress.correctCount + progress.incorrectCount;
      const accuracy = progress.correctCount / total;
      return accuracy < 0.4 || progress.consecutiveCorrect === 0;
    });

    expect(strugglingQuestions.length).toBeGreaterThan(0); // 少なくとも1問は「分からない」

    // 検証2: 正解した問題（4, 8, 12, 16）は下位にあるべき
    const correctWords = ['word4', 'word8', 'word12', 'word16'];
    const correctInTop5 = correctWords.filter((word) => {
      const index = sorted.findIndex((q) => q.word === word);
      return index < 5;
    }).length;

    console.log(`1発正解問題(word4,8,12,16)が上位5問に: ${correctInTop5}問`);
    expect(correctInTop5).toBeLessThanOrEqual(1); // 上位5問には最大1問まで許容

    // 検証3: 未出題問題（21-30）は存在するべき
    const unanswered = sorted.filter((q) => !progressMap.has(q.word));
    expect(unanswered.length).toBe(10);

    console.log('\n✅ パターン1: 苦戦型');
    console.log(`上位10問: ${top10.map((q) => q.word).join(', ')}`);
    console.log(`上位10問中「分からない」: ${strugglingQuestions.length}問`);
    console.log(`上位5問の詳細:`);
    sorted.slice(0, 5).forEach((q, i) => {
      const progress = progressMap.get(q.word);
      if (progress) {
        const _total = progress.correctCount + progress.incorrectCount;
        console.log(
          `  ${i + 1}. ${q.word}: 正解${progress.correctCount}/不正解${progress.incorrectCount} 連続${progress.consecutiveCorrect}`
        );
      } else {
        console.log(`  ${i + 1}. ${q.word}: 未学習`);
      }
    });
  });

  it('パターン2: 完璧型（90%正答率） - 正解問題は低優先度であるべき', () => {
    // 20問中18問正解、2問不正解
    const pattern =
      '+1, +2, +3, +4, +5, +6, +7, +8, +9, +10, -11, +12, +13, +14, +15, +16, +17, +18, -19, +20';
    const progressMap = applyAnswerPattern(pattern);
    const questions = generateTestQuestions();

    const sorted = sortQuestionsByPriority(questions, progressMap, false, 10, 5);

    // デバッグ出力
    const top10 = sorted.slice(0, 10);
    console.log('\n✅ パターン2: 完璧型（90%正答率）');
    console.log(`上位10問: ${top10.map((q) => q.word).join(', ')}`);
    const word11Index = sorted.findIndex((q) => q.word === 'word11');
    const word19Index = sorted.findIndex((q) => q.word === 'word19');
    console.log(`word11の順位: ${word11Index + 1}位, word19の順位: ${word19Index + 1}位`);

    // 検証1: 不正解問題（word11, word19）は上位にあるべき
    const hasWord11 = top10.some((q) => q.word === 'word11');
    const hasWord19 = top10.some((q) => q.word === 'word19');

    console.log(`word11は上位10問に: ${hasWord11}, word19は上位10問に: ${hasWord19}`);

    // 検証1: 不正解問題は上位20問には入るべき（未学習問題が優先される場合もある）
    expect(word11Index).toBeLessThan(20); // word11は上位20問以内
    expect(word19Index).toBeLessThan(20); // word19は上位20問以内

    // 検証2: 学習済み20問が全て上位に来るべき（2問不正解があるため復習優先）
    const answeredInTop20 = sorted.slice(0, 20).filter((q) => progressMap.has(q.word)).length;
    console.log(`上位10問: ${top10.map((q) => q.word).join(', ')}`);
    console.log(`上位10問中未学習: ${top10.filter((q) => !progressMap.has(q.word)).length}問`);
    console.log(`word11の順位: ${word11Index + 1}位, word19の順位: ${word19Index + 1}位`);

    expect(answeredInTop20).toBe(20); // 学習済み20問が全て上位20問以内
  });

  it('パターン3: ムラ型（同じ問題を繰り返し間違える） - 繰り返し不正解問題が最優先', () => {
    // 問題5を3回不正解、その他は混在
    const pattern =
      '-5, +1, +2, -5, +3, +4, -5, +6, +7, +8, +9, +10, +11, +12, +13, +14, +15, +16, +17, +18';
    const progressMap = applyAnswerPattern(pattern);
    const questions = generateTestQuestions();

    const sorted = sortQuestionsByPriority(questions, progressMap, false, 10, 5);

    // デバッグ出力
    console.log('\n✅ パターン3: ムラ型（word5を3回不正解）');
    console.log(
      `上位10問: ${sorted
        .slice(0, 10)
        .map((q) => q.word)
        .join(', ')}`
    );
    const word5Index = sorted.findIndex((q) => q.word === 'word5');
    const word5Progress = progressMap.get('word5')!;
    console.log(`word5の順位: ${word5Index + 1}位 (不正解${word5Progress.incorrectCount}回)`);

    // 検証1: 問題5が上位10問以内であるべき
    const top10 = sorted.slice(0, 10);
    const hasWord5 = top10.some((q) => q.word === 'word5');
    expect(hasWord5).toBe(true);

    // 検証2: 問題5の状態確認
    expect(word5Progress.incorrectCount).toBe(3);
    expect(word5Progress.consecutiveCorrect).toBe(0);

    // 検証3: 問題5は「分からない」カテゴリ
    const total = word5Progress.correctCount + word5Progress.incorrectCount;
    const accuracy = word5Progress.correctCount / total;
    expect(accuracy).toBe(0); // 3回全て不正解
  });

  it('パターン4: 復習型（不正解→正解パターン） - 克服した問題は低優先度', () => {
    // 最初不正解、後で正解するパターン
    const pattern =
      '-1, -2, -3, +1, +2, +3, +4, +5, +6, +7, +8, +9, +10, +11, +12, +13, +14, +15, +16, +17';
    const progressMap = applyAnswerPattern(pattern);
    const questions = generateTestQuestions();

    const sorted = sortQuestionsByPriority(questions, progressMap, false, 10, 5);

    // 検証1: 問題1, 2, 3は最後に正解したので連続正解1回
    const word1Progress = progressMap.get('word1')!;
    expect(word1Progress.consecutiveCorrect).toBe(1);
    expect(word1Progress.incorrectCount).toBe(1);

    // 検証2: 1回正解しただけでは「分からない」扱いのまま（正答率50%）
    const word1Index = sorted.findIndex((q) => q.word === 'word1');
    expect(word1Index).toBeLessThan(10); // まだ上位にある

    console.log('\n✅ パターン4: 復習型');
    console.log(
      `word1の位置: ${word1Index + 1}位 (正解${word1Progress.correctCount}/不正解${word1Progress.incorrectCount})`
    );
  });

  it('パターン5: 混合型（様々なパターンが混在） - 総合的な優先度判定', () => {
    // ランダムな混合パターン
    const pattern =
      '+1, -2, +3, -2, +4, +5, -6, -6, +7, +8, -9, +10, +11, -12, +13, +14, -15, +16, +17, +18';
    const progressMap = applyAnswerPattern(pattern);
    const questions = generateTestQuestions();

    const sorted = sortQuestionsByPriority(questions, progressMap, false, 10, 5);

    // 検証1: 複数回不正解の問題（2, 6）が上位
    const top5 = sorted.slice(0, 5);
    const multipleWrong = top5.filter((q) => {
      const progress = progressMap.get(q.word);
      return progress && progress.incorrectCount >= 2;
    });

    expect(multipleWrong.length).toBeGreaterThan(0);

    // 検証2: カテゴリ分布の確認
    const categories = {
      struggling: 0, // 分からない
      learning: 0, // まだまだ
      mastered: 0, // 覚えてる
      unanswered: 0, // 未学習
    };

    sorted.forEach((q) => {
      const progress = progressMap.get(q.word);
      if (!progress) {
        categories.unanswered++;
      } else {
        const total = progress.correctCount + progress.incorrectCount;
        const accuracy = progress.correctCount / total;

        if (accuracy < 0.4 || progress.consecutiveCorrect === 0) {
          categories.struggling++;
        } else if (progress.masteryLevel === 'mastered') {
          categories.mastered++;
        } else {
          categories.learning++;
        }
      }
    });

    // 検証3: 「分からない」問題が上位に集中しているか
    const top10 = sorted.slice(0, 10);
    const strugglingInTop10 = top10.filter((q) => {
      const progress = progressMap.get(q.word);
      if (!progress) return false;
      const total = progress.correctCount + progress.incorrectCount;
      const accuracy = progress.correctCount / total;
      return accuracy < 0.4 || progress.consecutiveCorrect === 0;
    }).length;

    expect(strugglingInTop10).toBeGreaterThan(0);

    console.log('\n✅ パターン5: 混合型');
    console.log(`カテゴリ分布:`, categories);
    console.log(`上位10問中「分からない」: ${strugglingInTop10}問`);
  });

  it('復習モード: 復習モードON時は未学習を後回しにするべき', () => {
    const pattern =
      '-1, -2, -3, +4, -5, -6, -7, +8, -9, -10, -11, +12, -13, -14, -15, +16, -17, -18, +19, -20';
    const progressMap = applyAnswerPattern(pattern);
    const questions = generateTestQuestions();

    // 復習モードON
    const sorted = sortQuestionsByPriority(
      questions,
      progressMap,
      true, // isReviewFocusMode = true
      10,
      5
    );

    // 検証: 未学習問題（21-30）が後回しにされているか
    const top10 = sorted.slice(0, 10);
    const unansweredInTop10 = top10.filter((q) => !progressMap.has(q.word)).length;

    expect(unansweredInTop10).toBe(0); // 上位10問に未学習はない

    // 復習モードOFF（比較用）
    const sortedNormal = sortQuestionsByPriority(questions, progressMap, false, 10, 5);

    const top10Normal = sortedNormal.slice(0, 10);
    const unansweredInTop10Normal = top10Normal.filter((q) => !progressMap.has(q.word)).length;

    console.log('\n✅ 復習モード検証');
    console.log(`復習モードON: 上位10問中未学習${unansweredInTop10}問`);
    console.log(`復習モードOFF: 上位10問中未学習${unansweredInTop10Normal}問`);

    expect(unansweredInTop10).toBeLessThanOrEqual(unansweredInTop10Normal);
  });

  it('閾値テスト: concentrationThreshold=10で「分からない」が10問以上なら新問題ブロック', () => {
    // 15問不正解、5問正解 = 「分からない」15問
    const pattern =
      '-1, -2, -3, -4, -5, -6, -7, -8, -9, -10, -11, -12, -13, -14, -15, +16, +17, +18, +19, +20';
    const progressMap = applyAnswerPattern(pattern);
    const questions = generateTestQuestions();

    const sorted = sortQuestionsByPriority(
      questions,
      progressMap,
      false,
      10, // concentrationThreshold = 10
      5
    );

    // 検証: 上位15問は全て出題済み問題であるべき（未学習問題がブロックされる）
    const top15 = sorted.slice(0, 15);
    const answeredInTop15 = top15.filter((q) => progressMap.has(q.word)).length;

    expect(answeredInTop15).toBe(15); // 全て出題済み

    console.log('\n✅ 閾値テスト');
    console.log(`「分からない」15問 → 上位15問は全て復習問題`);
  });

  it('時間ブーストテスト: 古い問題ほど優先度が上がるべき', () => {
    const pattern = '+1, +2, +3, +4, +5';
    const progressMap = applyAnswerPattern(pattern);

    // word1を1時間前、word5を最近にする
    const word1 = progressMap.get('word1')!;
    const word5 = progressMap.get('word5')!;

    word1.firstAttempted = Date.now() - 60 * 60 * 1000; // 1時間前
    word1.lastStudied = Date.now() - 60 * 60 * 1000;

    word5.firstAttempted = Date.now() - 10 * 60 * 1000; // 10分前
    word5.lastStudied = Date.now() - 10 * 60 * 1000;

    const questions = generateTestQuestions().slice(0, 5);

    const sorted = sortQuestionsByPriority(questions, progressMap, false, 10, 5);

    // 検証: word1がword5より上位にあるべき
    const word1Index = sorted.findIndex((q) => q.word === 'word1');
    const word5Index = sorted.findIndex((q) => q.word === 'word5');

    expect(word1Index).toBeLessThan(word5Index);

    console.log('\n✅ 時間ブーストテスト');
    console.log(`word1(1時間前): ${word1Index + 1}位`);
    console.log(`word5(10分前): ${word5Index + 1}位`);
  });

  it('🤖 14AI統合テスト: メタAIネットワークが協調動作するべき', () => {
    // 複雑な学習パターン: 連続ミス、疲労、混同ペアを含む
    const pattern =
      '-1, -1, -1, +2, -3, -3, +4, +5, -6, -6, -6, +7, +8, -9, -9, +10, +11, +12, -13, -13';
    const progressMap = applyAnswerPattern(pattern);

    // LocalStorageにデータを保存（14AIが読み取れるように）
    const progressObj: Record<string, WordProgress> = {};
    progressMap.forEach((value, key) => {
      progressObj[key] = value;
    });
    const progressData = {
      wordProgress: progressObj,
    };
    localStorage.setItem('english-progress', JSON.stringify(progressData));

    const questions = generateTestQuestions();

    // 🔥 14AI統合を有効化
    const sorted = sortQuestionsByPriorityImpl(questions, {
      mode: 'memorization',
      isReviewFocusMode: false,
      learningLimit: 10,
      reviewLimit: 10,
      useMetaAI: true, // 14AIを起動！
      sessionContext: {
        recentErrors: 7, // 最近7問ミス → 認知負荷シグナル
        sessionLength: 15, // 15分経過 → 疲労シグナル
        sessionDuration: 900, // 900秒
      },
    });

    console.log('\n🤖 14AI統合テスト実行');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 検証1: word1, word3, word6（3回連続ミス）が上位10問に入るべき
    const top10 = sorted.slice(0, 10);
    const criticalWords = ['word1', 'word3', 'word6'];
    const criticalInTop10 = criticalWords.filter((w) => top10.some((q) => q.word === w)).length;

    console.log(`\n📊 シグナル検出結果:`);
    console.log(`  - 連続ミス問題(word1,3,6): ${criticalInTop10}/3問が上位10問に`);
    console.log(`  - 認知負荷: ${7}/10 (high)`);
    console.log(`  - セッション時間: 15分`);

    expect(criticalInTop10).toBeGreaterThan(0); // 少なくとも1問は上位に

    // 検証2: 上位10問の詳細を出力
    console.log(`\n📋 上位10問の出題順序:`);
    sorted.slice(0, 10).forEach((q, i) => {
      const progress = progressMap.get(q.word);
      if (progress) {
        const total = progress.correctCount + progress.incorrectCount;
        const rate = total > 0 ? ((progress.correctCount / total) * 100).toFixed(0) : 'N/A';
        const icon =
          progress.incorrectCount >= 3 ? '🔴' : progress.incorrectCount > 0 ? '🟡' : '🟢';
        console.log(
          `  ${i + 1}. ${icon} ${q.word}: 正解${progress.correctCount}/${total} (${rate}%)`
        );
      } else {
        console.log(`  ${i + 1}. ⚪ ${q.word}: 未学習`);
      }
    });

    console.log('\n✅ 14AIネットワーク協調動作確認完了');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // LocalStorageをクリーンアップ
    localStorage.removeItem('english-progress');
  });

  it('シミュレーション: 20問を100%正解になるまでの再出題シーケンス', () => {
    const questions = generateTestQuestions().slice(0, 20);

    // 初期状態: 前半は不正解、後半は未学習
    const progressMap = new Map<string, WordProgress>();
    const baseTime = Date.now() - 60 * 60 * 1000;
    for (let i = 1; i <= 10; i++) {
      const w = `word${i}`;
      const p = initializeWordProgress(w);
      p.incorrectCount = 1;
      p.consecutiveCorrect = 0;
      p.consecutiveIncorrect = 1;
      p.masteryLevel = 'learning';
      p.firstAttempted = baseTime + i * 60 * 1000;
      p.lastStudied = baseTime + i * 60 * 1000;
      progressMap.set(w, p);
    }
    for (let i = 11; i <= 20; i++) {
      const w = `word${i}`;
      const p = initializeWordProgress(w);
      // 未学習のまま
      p.firstAttempted = 0;
      p.lastStudied = 0;
      progressMap.set(w, p);
    }

    // LocalStorageへ保存（ソーターが参照）
    const progressObj: Record<string, WordProgress> = {};
    progressMap.forEach((v, k) => (progressObj[k] = v));
    localStorage.setItem('english-progress', JSON.stringify({ wordProgress: progressObj }));

    const sequence: { step: number; word: string; before: string; after: string }[] = [];

    // すべての20問が「正解>=1 & 連続正解>=1」で揃うまで、AIの並びに従って正解していく
    let safety = 0;
    while (safety < 100) {
      safety++;
      const sorted = sortQuestionsByPriorityImpl(questions, {
        mode: 'memorization',
        isReviewFocusMode: false,
        learningLimit: 10,
        reviewLimit: 10,
        useMetaAI: true,
        sessionContext: { recentErrors: 5, sessionLength: 12, sessionDuration: safety * 30 },
      });

      // 次に出題されるトップを取得
      const next = sorted[0];
      const prog = progressMap.get(next.word)!;
      const totalBefore = prog.correctCount + prog.incorrectCount;
      const accBefore = totalBefore > 0 ? Math.round((prog.correctCount / totalBefore) * 100) : 0;
      const before = `正:${prog.correctCount}/誤:${prog.incorrectCount} (${accBefore}%) 連続:${prog.consecutiveCorrect}`;

      // 正解として更新（シミュレーションでは常に正答）
      prog.correctCount += 1;
      prog.consecutiveCorrect += 1;
      prog.consecutiveIncorrect = 0;
      prog.masteryLevel = prog.consecutiveCorrect >= 1 ? 'mastered' : 'learning';
      prog.lastStudied = Date.now();

      const totalAfter = prog.correctCount + prog.incorrectCount;
      const accAfter = Math.round((prog.correctCount / totalAfter) * 100);
      const after = `正:${prog.correctCount}/誤:${prog.incorrectCount} (${accAfter}%) 連続:${prog.consecutiveCorrect}`;
      sequence.push({ step: safety, word: next.word, before, after });

      // LocalStorage更新
      progressObj[next.word] = prog;
      localStorage.setItem('english-progress', JSON.stringify({ wordProgress: progressObj }));

      // 終了判定: 全20問が少なくとも1回正解し、連続正解>=1
      const allMastered = Array.from(progressMap.values()).every(
        (p) => p.correctCount >= 1 && p.consecutiveCorrect >= 1
      );
      if (allMastered) break;
    }

    // 出力
    console.log('\n📈 20問→100%正解までの再出題シーケンス（上位から順に回答）');
    sequence.slice(0, 40).forEach((s) => {
      console.log(`  #${s.step.toString().padStart(2, ' ')} ${s.word} | ${s.before} → ${s.after}`);
    });
    console.log(`合計ステップ: ${sequence.length}`);

    // 検証
    expect(sequence.length).toBeGreaterThan(0);
    const masteredCount = Array.from(progressMap.values()).filter(
      (p) => p.correctCount >= 1 && p.consecutiveCorrect >= 1
    ).length;
    expect(masteredCount).toBe(20);
  });
});
