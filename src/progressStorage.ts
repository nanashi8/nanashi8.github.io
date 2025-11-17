// 進捗・成績管理用のLocalStorageモジュール

export interface QuizResult {
  id: string;
  questionSetId: string;
  questionSetName: string;
  score: number;
  total: number;
  percentage: number;
  date: number;
  timeSpent: number; // 秒
  incorrectWords: string[];
  mode: 'translation' | 'spelling' | 'reading';
  category?: string; // 関連分野
  difficulty?: string; // 難易度レベル
}

// 単語ごとの学習進捗
export interface WordProgress {
  word: string; // 単語
  correctCount: number; // 正解回数
  incorrectCount: number; // 不正解回数
  consecutiveCorrect: number; // 連続正解回数
  consecutiveIncorrect: number; // 連続不正解回数
  lastStudied: number; // 最終学習日時（タイムスタンプ）
  totalResponseTime: number; // 累計応答時間（ミリ秒）
  averageResponseTime: number; // 平均応答時間（ミリ秒）
  difficultyScore: number; // 難易度スコア（0-100、高いほど苦手）
  userDifficultyRating?: number; // ユーザーの主観的難易度評価（1-3: 簡単/普通/難しい）
  masteryLevel: 'new' | 'learning' | 'mastered'; // 習熟レベル
  responseTimes: number[]; // 応答時間の履歴（最新10件）
  category?: string; // カテゴリー
  difficulty?: string; // 難易度レベル
  skippedCount?: number; // スキップ回数
  lastSkipped?: number; // 最終スキップ日時（タイムスタンプ）
  skipExcludeUntil?: number; // この日時まで出題除外（タイムスタンプ）
}

export interface UserProgress {
  results: QuizResult[];
  statistics: {
    totalQuizzes: number;
    totalQuestions: number;
    totalCorrect: number;
    averageScore: number;
    bestScore: number;
    streakDays: number;
    lastStudyDate: number;
    studyDates: number[]; // 学習した日付のタイムスタンプ配列
  };
  questionSetStats: {
    [setId: string]: {
      attempts: number;
      bestScore: number;
      averageScore: number;
      lastAttempt: number;
      totalTimeSpent: number;
    };
  };
  wordProgress: {
    [word: string]: WordProgress; // 単語ごとの進捗データ
  };
}

const PROGRESS_KEY = 'quiz-app-user-progress';
const MAX_RESULTS = 1000; // 保存する最大結果数

// 初期化
function initializeProgress(): UserProgress {
  return {
    results: [],
    statistics: {
      totalQuizzes: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      averageScore: 0,
      bestScore: 0,
      streakDays: 0,
      lastStudyDate: 0,
      studyDates: [],
    },
    questionSetStats: {},
    wordProgress: {},
  };
}

// 進捗データの読み込み
export function loadProgress(): UserProgress {
  try {
    const data = localStorage.getItem(PROGRESS_KEY);
    if (!data) {
      return initializeProgress();
    }
    const progress = JSON.parse(data) as UserProgress;
    // 古いデータ構造の場合は初期化（wordProgressを追加）
    if (!progress.statistics || !progress.questionSetStats) {
      return initializeProgress();
    }
    if (!progress.wordProgress) {
      progress.wordProgress = {};
    }
    return progress;
  } catch (error) {
    console.error('進捗データの読み込みエラー:', error);
    return initializeProgress();
  }
}

// 進捗データの保存
export function saveProgress(progress: UserProgress): void {
  try {
    // 結果が多すぎる場合は古いものを削除
    if (progress.results.length > MAX_RESULTS) {
      progress.results = progress.results.slice(-MAX_RESULTS);
    }
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('進捗データの保存エラー:', error);
    alert('データの保存に失敗しました。ストレージの容量を確認してください。');
  }
}

// クイズ結果を追加
export function addQuizResult(result: QuizResult): void {
  const progress = loadProgress();
  progress.results.push(result);
  
  // 統計情報を更新
  updateStatistics(progress, result);
  
  saveProgress(progress);
}

// 統計情報の更新
function updateStatistics(progress: UserProgress, result: QuizResult): void {
  const stats = progress.statistics;
  
  // 基本統計
  stats.totalQuizzes++;
  stats.totalQuestions += result.total;
  stats.totalCorrect += result.score;
  stats.averageScore = stats.totalQuestions > 0 
    ? (stats.totalCorrect / stats.totalQuestions) * 100 
    : 0;
  stats.bestScore = Math.max(stats.bestScore, result.percentage);
  stats.lastStudyDate = result.date;
  
  // 学習日の記録（連続学習日数の計算用）
  const today = new Date(result.date).setHours(0, 0, 0, 0);
  if (!stats.studyDates.includes(today)) {
    stats.studyDates.push(today);
    stats.studyDates.sort((a, b) => b - a); // 降順ソート
  }
  
  // 連続学習日数の計算
  stats.streakDays = calculateStreakDays(stats.studyDates);
  
  // 問題集ごとの統計
  if (!progress.questionSetStats[result.questionSetId]) {
    progress.questionSetStats[result.questionSetId] = {
      attempts: 0,
      bestScore: 0,
      averageScore: 0,
      lastAttempt: 0,
      totalTimeSpent: 0,
    };
  }
  
  const setStats = progress.questionSetStats[result.questionSetId];
  setStats.attempts++;
  setStats.bestScore = Math.max(setStats.bestScore, result.percentage);
  setStats.lastAttempt = result.date;
  setStats.totalTimeSpent += result.timeSpent;
  
  // 問題集ごとの平均スコアを計算
  const setResults = progress.results.filter(r => r.questionSetId === result.questionSetId);
  const totalScore = setResults.reduce((sum, r) => sum + r.percentage, 0);
  setStats.averageScore = totalScore / setResults.length;
}

// 連続学習日数の計算
function calculateStreakDays(studyDates: number[]): number {
  if (studyDates.length === 0) return 0;
  
  const today = new Date().setHours(0, 0, 0, 0);
  const yesterday = today - 24 * 60 * 60 * 1000;
  
  // 今日または昨日に学習していない場合はストリーク終了
  const latestStudy = studyDates[0];
  if (latestStudy !== today && latestStudy !== yesterday) {
    return 0;
  }
  
  let streak = 1;
  for (let i = 1; i < studyDates.length; i++) {
    const diff = studyDates[i - 1] - studyDates[i];
    const daysDiff = diff / (24 * 60 * 60 * 1000);
    
    if (daysDiff === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

// 特定期間の結果を取得
export function getResultsByDateRange(startDate: number, endDate: number): QuizResult[] {
  const progress = loadProgress();
  return progress.results.filter(r => r.date >= startDate && r.date <= endDate);
}

// モードごとの統計を取得
export function getStatsByMode(mode: 'translation' | 'spelling' | 'reading'): {
  totalQuizzes: number;
  averageScore: number;
  bestScore: number;
} {
  const progress = loadProgress();
  const modeResults = progress.results.filter(r => r.mode === mode);
  
  if (modeResults.length === 0) {
    return { totalQuizzes: 0, averageScore: 0, bestScore: 0 };
  }
  
  const totalScore = modeResults.reduce((sum, r) => sum + r.percentage, 0);
  const bestScore = Math.max(...modeResults.map(r => r.percentage));
  
  return {
    totalQuizzes: modeResults.length,
    averageScore: totalScore / modeResults.length,
    bestScore,
  };
}

// 最近の結果を取得
export function getRecentResults(limit: number = 10): QuizResult[] {
  const progress = loadProgress();
  return progress.results.slice(-limit).reverse();
}

// 分野別の統計を取得
export function getStatsByCategory(): Map<string, { correctCount: number; totalCount: number; accuracy: number }> {
  const progress = loadProgress();
  const categoryStats = new Map<string, { correctCount: number; totalCount: number }>();
  
  progress.results.forEach(result => {
    if (result.category) {
      const existing = categoryStats.get(result.category) || { correctCount: 0, totalCount: 0 };
      categoryStats.set(result.category, {
        correctCount: existing.correctCount + result.score,
        totalCount: existing.totalCount + result.total
      });
    }
  });
  
  const statsWithAccuracy = new Map<string, { correctCount: number; totalCount: number; accuracy: number }>();
  categoryStats.forEach((stats, category) => {
    statsWithAccuracy.set(category, {
      correctCount: stats.correctCount,
      totalCount: stats.totalCount,
      accuracy: stats.totalCount > 0 ? (stats.correctCount / stats.totalCount) * 100 : 0
    });
  });
  
  return statsWithAccuracy;
}

// 難易度別の統計を取得
export function getStatsByDifficulty(): Map<string, { correctCount: number; totalCount: number; accuracy: number }> {
  const progress = loadProgress();
  const difficultyStats = new Map<string, { correctCount: number; totalCount: number }>();
  
  progress.results.forEach(result => {
    if (result.difficulty) {
      const existing = difficultyStats.get(result.difficulty) || { correctCount: 0, totalCount: 0 };
      difficultyStats.set(result.difficulty, {
        correctCount: existing.correctCount + result.score,
        totalCount: existing.totalCount + result.total
      });
    }
  });
  
  const statsWithAccuracy = new Map<string, { correctCount: number; totalCount: number; accuracy: number }>();
  difficultyStats.forEach((stats, difficulty) => {
    statsWithAccuracy.set(difficulty, {
      correctCount: stats.correctCount,
      totalCount: stats.totalCount,
      accuracy: stats.totalCount > 0 ? (stats.correctCount / stats.totalCount) * 100 : 0
    });
  });
  
  return statsWithAccuracy;
}

// 当日の誤答単語を取得
export function getTodayIncorrectWords(): string[] {
  const progress = loadProgress();
  const today = new Date().toLocaleDateString('ja-JP');
  const incorrectWords = new Set<string>();
  
  progress.results.forEach(result => {
    if (new Date(result.date).toLocaleDateString('ja-JP') === today) {
      result.incorrectWords.forEach(word => incorrectWords.add(word));
    }
  });
  
  return Array.from(incorrectWords);
}

// 進捗データのエクスポート
export function exportProgress(): string {
  const progress = loadProgress();
  return JSON.stringify(progress, null, 2);
}

// 進捗データのインポート
export function importProgress(jsonData: string): boolean {
  try {
    const progress = JSON.parse(jsonData) as UserProgress;
    
    // データ構造の検証
    if (!progress.results || !progress.statistics || !progress.questionSetStats) {
      throw new Error('無効なデータ形式です');
    }
    
    saveProgress(progress);
    return true;
  } catch (error) {
    console.error('進捗データのインポートエラー:', error);
    return false;
  }
}

// すべての進捗データをクリア
export function clearProgress(): void {
  if (confirm('すべての成績データを削除しますか？この操作は取り消せません。')) {
    localStorage.removeItem(PROGRESS_KEY);
    alert('成績データをクリアしました。');
  }
}

// 弱点単語を分析（間違えた回数が多い単語）
export function getWeakWords(limit: number = 10): Array<{ word: string; mistakes: number }> {
  const progress = loadProgress();
  const wordMistakes = new Map<string, number>();
  
  progress.results.forEach(result => {
    result.incorrectWords.forEach(word => {
      wordMistakes.set(word, (wordMistakes.get(word) || 0) + 1);
    });
  });
  
  return Array.from(wordMistakes.entries())
    .map(([word, mistakes]) => ({ word, mistakes }))
    .sort((a, b) => b.mistakes - a.mistakes)
    .slice(0, limit);
}

// 日別の学習時間を取得
export function getDailyStudyTime(days: number = 7): Array<{ date: string; timeSpent: number }> {
  const progress = loadProgress();
  const now = Date.now();
  const startDate = now - (days * 24 * 60 * 60 * 1000);
  
  const dailyTime = new Map<string, number>();
  
  progress.results
    .filter(r => r.date >= startDate)
    .forEach(result => {
      const dateStr = new Date(result.date).toLocaleDateString('ja-JP');
      dailyTime.set(dateStr, (dailyTime.get(dateStr) || 0) + result.timeSpent);
    });
  
  return Array.from(dailyTime.entries())
    .map(([date, timeSpent]) => ({ date, timeSpent }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// ========== 単語レベルの進捗管理 ==========

// 単語進捗の初期化
function initializeWordProgress(word: string): WordProgress {
  return {
    word,
    correctCount: 0,
    incorrectCount: 0,
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
    lastStudied: 0,
    totalResponseTime: 0,
    averageResponseTime: 0,
    difficultyScore: 50, // 初期値は中間
    masteryLevel: 'new',
  };
}

// 単語の難易度スコアを計算（0-100、高いほど苦手）
function calculateDifficultyScore(wordProgress: WordProgress): number {
  const total = wordProgress.correctCount + wordProgress.incorrectCount;
  if (total === 0) return 50; // 未学習は中間値
  
  const accuracy = wordProgress.correctCount / total;
  const baseScore = (1 - accuracy) * 100; // 不正解率ベース
  
  // 連続不正解によるペナルティ（最大+20）
  const consecutivePenalty = Math.min(wordProgress.consecutiveIncorrect * 5, 20);
  
  // 平均応答時間による調整（遅いほど難しい、最大+15）
  const avgTime = wordProgress.averageResponseTime / 1000; // 秒に変換
  const timePenalty = Math.min(avgTime > 5 ? (avgTime - 5) * 3 : 0, 15);
  
  // ユーザー評価の反映（評価がある場合）
  const userRatingBonus = wordProgress.userDifficultyRating 
    ? (wordProgress.userDifficultyRating - 5.5) * 5 // 1-10を-22.5〜+22.5に変換
    : 0;
  
  const finalScore = baseScore + consecutivePenalty + timePenalty + userRatingBonus;
  
  return Math.max(0, Math.min(100, finalScore)); // 0-100の範囲に制限
}

// 習熟レベルを判定
function determineMasteryLevel(wordProgress: WordProgress): 'new' | 'learning' | 'mastered' {
  const total = wordProgress.correctCount + wordProgress.incorrectCount;
  
  if (total === 0) return 'new';
  if (total < 3) return 'learning';
  
  const accuracy = wordProgress.correctCount / total;
  
  // 3回以上学習して正解率80%以上かつ連続2回以上正解で習得
  if (total >= 3 && accuracy >= 0.8 && wordProgress.consecutiveCorrect >= 2) {
    return 'mastered';
  }
  
  return 'learning';
}

// 単語進捗を更新
export function updateWordProgress(
  word: string,
  isCorrect: boolean,
  responseTime: number, // ミリ秒
  userRating?: number // 1-10のユーザー評価（オプション）
): void {
  const progress = loadProgress();
  
  if (!progress.wordProgress[word]) {
    progress.wordProgress[word] = initializeWordProgress(word);
  }
  
  const wordProgress = progress.wordProgress[word];
  
  // 基本統計を更新
  if (isCorrect) {
    wordProgress.correctCount++;
    wordProgress.consecutiveCorrect++;
    wordProgress.consecutiveIncorrect = 0;
  } else {
    wordProgress.incorrectCount++;
    wordProgress.consecutiveIncorrect++;
    wordProgress.consecutiveCorrect = 0;
  }
  
  // 応答時間を更新
  wordProgress.totalResponseTime += responseTime;
  const totalAttempts = wordProgress.correctCount + wordProgress.incorrectCount;
  wordProgress.averageResponseTime = wordProgress.totalResponseTime / totalAttempts;
  
  // ユーザー評価を記録（提供された場合）
  if (userRating !== undefined) {
    wordProgress.userDifficultyRating = userRating;
  }
  
  // 最終学習日時を更新
  wordProgress.lastStudied = Date.now();
  
  // 難易度スコアを再計算
  wordProgress.difficultyScore = calculateDifficultyScore(wordProgress);
  
  // 習熟レベルを更新
  wordProgress.masteryLevel = determineMasteryLevel(wordProgress);
  
  // 1発100%（初回で正解）の場合、定着として扱い7日間出題除外
  if (totalAttempts === 1 && isCorrect) {
    wordProgress.skipExcludeUntil = Date.now() + (7 * 24 * 60 * 60 * 1000);
    // 定着したので長文読解の保存リストから削除
    removeFromReadingUnknownWords(word);
  }
  // 連続3回以上正解の場合も同様に14日間除外
  else if (wordProgress.consecutiveCorrect >= 3) {
    wordProgress.skipExcludeUntil = Date.now() + (14 * 24 * 60 * 60 * 1000);
    // 定着したので長文読解の保存リストから削除
    removeFromReadingUnknownWords(word);
  }
  
  saveProgress(progress);
}

/**
 * 定着した単語を長文読解の保存リストから削除
 */
function removeFromReadingUnknownWords(word: string): void {
  // LocalStorageから長文読解データを取得
  const readingDataKey = 'reading-passages-data';
  const storedData = localStorage.getItem(readingDataKey);
  
  if (!storedData) return;
  
  try {
    const passages = JSON.parse(storedData);
    let modified = false;
    
    // 全パッセージの全フレーズの全セグメントをチェック
    passages.forEach((passage: any) => {
      if (passage.phrases) {
        passage.phrases.forEach((phrase: any) => {
          if (phrase.segments) {
            phrase.segments.forEach((segment: any) => {
              if (segment.word.toLowerCase() === word.toLowerCase() && segment.isUnknown) {
                segment.isUnknown = false;
                modified = true;
              }
            });
          }
        });
      }
    });
    
    // 変更があった場合のみ保存
    if (modified) {
      localStorage.setItem(readingDataKey, JSON.stringify(passages));
    }
  } catch (err) {
    console.error('長文読解データの更新エラー:', err);
  }
}

// 単語のスキップを記録（スワイプでスキップされた場合）
export function recordWordSkip(
  word: string,
  excludeDays: number = 7 // デフォルトで7日間除外
): void {
  const progress = loadProgress();
  
  if (!progress.wordProgress[word]) {
    progress.wordProgress[word] = initializeWordProgress(word);
  }
  
  const wordProgress = progress.wordProgress[word];
  
  // スキップ情報を更新
  wordProgress.skippedCount = (wordProgress.skippedCount || 0) + 1;
  wordProgress.lastSkipped = Date.now();
  wordProgress.skipExcludeUntil = Date.now() + (excludeDays * 24 * 60 * 60 * 1000);
  
  // スキップが多い場合は除外期間を延長
  if (wordProgress.skippedCount >= 3) {
    // 3回以上スキップされた場合は14日間除外
    wordProgress.skipExcludeUntil = Date.now() + (14 * 24 * 60 * 60 * 1000);
  } else if (wordProgress.skippedCount >= 5) {
    // 5回以上スキップされた場合は30日間除外
    wordProgress.skipExcludeUntil = Date.now() + (30 * 24 * 60 * 60 * 1000);
  }
  
  saveProgress(progress);
}

// 単語がスキップ除外期間中かチェック
export function isWordSkipExcluded(word: string): boolean {
  const progress = loadProgress();
  const wordProgress = progress.wordProgress[word];
  
  if (!wordProgress || !wordProgress.skipExcludeUntil) {
    return false;
  }
  
  return Date.now() < wordProgress.skipExcludeUntil;
}

// スキップ除外期間中の単語を除外した問題リストを取得
export function filterSkippedWords<T extends { word: string }>(questions: T[]): T[] {
  return questions.filter(q => !isWordSkipExcluded(q.word));
}

// 単語の進捗を取得
export function getWordProgress(word: string): WordProgress | null {
  const progress = loadProgress();
  return progress.wordProgress[word] || null;
}

// すべての単語進捗を取得
export function getAllWordProgress(): WordProgress[] {
  const progress = loadProgress();
  return Object.values(progress.wordProgress);
}

// 習熟レベル別に単語を取得
export function getWordsByMasteryLevel(level: 'new' | 'learning' | 'mastered'): string[] {
  const progress = loadProgress();
  return Object.values(progress.wordProgress)
    .filter(wp => wp.masteryLevel === level)
    .map(wp => wp.word);
}

// 難易度スコアでソートされた単語リストを取得
export function getWordsSortedByDifficulty(limit?: number): WordProgress[] {
  const allWords = getAllWordProgress();
  const sorted = allWords.sort((a, b) => b.difficultyScore - a.difficultyScore);
  return limit ? sorted.slice(0, limit) : sorted;
}

// 苦手単語を取得（難易度スコア50以上）
export function getWeakWordsAdvanced(limit: number = 20): WordProgress[] {
  const allWords = getAllWordProgress();
  return allWords
    .filter(wp => wp.difficultyScore >= 50)
    .sort((a, b) => b.difficultyScore - a.difficultyScore)
    .slice(0, limit);
}

// 復習が必要な単語を取得（最終学習から一定時間経過）
export function getWordsNeedingReview(hoursThreshold: number = 24): WordProgress[] {
  const now = Date.now();
  const threshold = hoursThreshold * 60 * 60 * 1000;
  
  const allWords = getAllWordProgress();
  return allWords
    .filter(wp => {
      const timeSinceLastStudy = now - wp.lastStudied;
      return wp.masteryLevel === 'learning' && timeSinceLastStudy >= threshold;
    })
    .sort((a, b) => b.difficultyScore - a.difficultyScore);
}

// 学習統計のサマリーを取得
export function getWordProgressSummary(): {
  total: number;
  new: number;
  learning: number;
  mastered: number;
  averageDifficulty: number;
} {
  const allWords = getAllWordProgress();
  
  const summary = {
    total: allWords.length,
    new: allWords.filter(wp => wp.masteryLevel === 'new').length,
    learning: allWords.filter(wp => wp.masteryLevel === 'learning').length,
    mastered: allWords.filter(wp => wp.masteryLevel === 'mastered').length,
    averageDifficulty: 0,
  };
  
  if (allWords.length > 0) {
    const totalDifficulty = allWords.reduce((sum, wp) => sum + wp.difficultyScore, 0);
    summary.averageDifficulty = totalDifficulty / allWords.length;
  }
  
  return summary;
}

/**
 * 定着した単語数を取得
 * 定着条件: 連続3回以上正解 または スキップされた単語
 */
export function getMasteredWordsCount(words: string[]): number {
  const progress = loadProgress();
  let masteredCount = 0;
  
  for (const word of words) {
    const wordProgress = progress.wordProgress[word];
    if (!wordProgress) continue;
    
    // 定着条件: 連続3回以上正解 または スキップされている
    const isConsecutivelyCorrect = wordProgress.consecutiveCorrect >= 3;
    const isSkipped = wordProgress.skippedCount && wordProgress.skippedCount > 0;
    
    if (isConsecutivelyCorrect || isSkipped) {
      masteredCount++;
    }
  }
  
  return masteredCount;
}

/**
 * 定着している単語のリストを取得
 */
export function getMasteredWords(words: string[]): string[] {
  const progress = loadProgress();
  const masteredWords: string[] = [];
  
  for (const word of words) {
    const wordProgress = progress.wordProgress[word];
    if (!wordProgress) continue;
    
    // 定着条件: 連続3回以上正解 または スキップされている
    const isConsecutivelyCorrect = wordProgress.consecutiveCorrect >= 3;
    const isSkipped = wordProgress.skippedCount && wordProgress.skippedCount > 0;
    
    if (isConsecutivelyCorrect || isSkipped) {
      masteredWords.push(word);
    }
  }
  
  return masteredWords;
}

/**
 * 本日の統計を取得（本日正答率、本日回答数）
 * @param mode クイズモード（translation, spelling, reading）
 */
export function getTodayStats(mode?: 'translation' | 'spelling' | 'reading'): {
  todayCorrectCount: number;
  todayTotalAnswered: number;
  todayAccuracy: number;
} {
  const progress = loadProgress();
  const today = new Date().setHours(0, 0, 0, 0);
  const tomorrow = today + 24 * 60 * 60 * 1000;
  
  // 本日の結果をフィルタ
  let todayResults = progress.results.filter(r => r.date >= today && r.date < tomorrow);
  
  // モード指定がある場合はフィルタ
  if (mode) {
    todayResults = todayResults.filter(r => r.mode === mode);
  }
  
  const todayCorrectCount = todayResults.reduce((sum, r) => sum + r.score, 0);
  const todayTotalAnswered = todayResults.reduce((sum, r) => sum + r.total, 0);
  const todayAccuracy = todayTotalAnswered > 0 
    ? Math.round((todayCorrectCount / todayTotalAnswered) * 100) 
    : 0;
  
  return {
    todayCorrectCount,
    todayTotalAnswered,
    todayAccuracy,
  };
}

/**
 * 累計回答数を取得
 * @param mode クイズモード（translation, spelling, reading）
 */
export function getTotalAnsweredCount(mode?: 'translation' | 'spelling' | 'reading'): number {
  const progress = loadProgress();
  let results = progress.results;
  
  // モード指定がある場合はフィルタ
  if (mode) {
    results = results.filter(r => r.mode === mode);
  }
  
  return results.reduce((sum, r) => sum + r.total, 0);
}

/**
 * 出題された単語数を取得（重複を除く）
 * @param mode クイズモード（translation, spelling, reading）
 */
export function getUniqueQuestionedWordsCount(mode?: 'translation' | 'spelling' | 'reading'): number {
  const progress = loadProgress();
  const uniqueWords = new Set<string>();
  
  // wordProgressから、実際に出題された単語を抽出
  for (const [word, wordProgress] of Object.entries(progress.wordProgress)) {
    const hasBeenAnswered = wordProgress.correctCount > 0 || wordProgress.incorrectCount > 0;
    const hasBeenSkipped = wordProgress.skippedCount && wordProgress.skippedCount > 0;
    
    if (hasBeenAnswered || hasBeenSkipped) {
      uniqueWords.add(word);
    }
  }
  
  return uniqueWords.size;
}

/**
 * 定着した単語数を全体から取得（スキップ含む）
 */
export function getTotalMasteredWordsCount(): number {
  const progress = loadProgress();
  let masteredCount = 0;
  
  for (const wordProgress of Object.values(progress.wordProgress)) {
    const totalAttempts = wordProgress.correctCount + wordProgress.incorrectCount;
    
    // 定着条件:
    // 1. 1発100%（初回で正解）
    // 2. 連続3回以上正解
    // 3. スキップされている
    const isFirstTimeCorrect = totalAttempts === 1 && wordProgress.correctCount === 1;
    const isConsecutivelyCorrect = wordProgress.consecutiveCorrect >= 3;
    const isSkipped = wordProgress.skippedCount && wordProgress.skippedCount > 0;
    
    if (isFirstTimeCorrect || isConsecutivelyCorrect || isSkipped) {
      masteredCount++;
    }
  }
  
  return masteredCount;
}

/**
 * 難易度別の統計を取得（レーダーチャート用）
 * @param mode クイズモード
 */
export function getDifficultyStatsForRadar(mode: 'translation' | 'spelling' | 'reading'): {
  labels: string[];
  answeredData: number[];
  correctData: number[];
} {
  const progress = loadProgress();
  const difficultyMap = new Map<string, { answered: number; correct: number }>();
  
  // モードでフィルタして集計
  progress.results
    .filter(r => r.mode === mode && r.difficulty)
    .forEach(result => {
      const difficulty = result.difficulty!;
      const existing = difficultyMap.get(difficulty) || { answered: 0, correct: 0 };
      difficultyMap.set(difficulty, {
        answered: existing.answered + result.total,
        correct: existing.correct + result.score
      });
    });
  
  // ソート順: 初級 → 中級 → 上級
  const difficultyOrder = ['初級', '中級', '上級'];
  const labels: string[] = [];
  const answeredData: number[] = [];
  const correctData: number[] = [];
  
  difficultyOrder.forEach(difficulty => {
    const stats = difficultyMap.get(difficulty);
    if (stats) {
      labels.push(difficulty);
      answeredData.push(stats.answered);
      correctData.push(stats.correct);
    }
  });
  
  // データがない場合は初期値を返す
  if (labels.length === 0) {
    return {
      labels: ['初級', '中級', '上級'],
      answeredData: [0, 0, 0],
      correctData: [0, 0, 0]
    };
  }
  
  return { labels, answeredData, correctData };
}

/**
 * 分野別・難易度別の統計を取得（レーダーチャート用）
 * @param mode クイズモード
 */
export function getCategoryDifficultyStats(mode: 'translation' | 'spelling'): {
  labels: string[];
  accuracyData: { beginner: number[]; intermediate: number[]; advanced: number[] };
  progressData: { beginner: number[]; intermediate: number[]; advanced: number[] };
} {
  const progress = loadProgress();
  
  // 分野別・難易度別の統計マップ
  const statsMap = new Map<string, {
    beginner: { correct: number; total: number; mastered: number; totalWords: number };
    intermediate: { correct: number; total: number; mastered: number; totalWords: number };
    advanced: { correct: number; total: number; mastered: number; totalWords: number };
  }>();

  // 結果から分野別・難易度別に集計
  progress.results
    .filter(r => r.mode === mode && r.category && r.difficulty)
    .forEach(result => {
      const category = result.category!;
      const difficulty = result.difficulty!;
      
      if (!statsMap.has(category)) {
        statsMap.set(category, {
          beginner: { correct: 0, total: 0, mastered: 0, totalWords: 0 },
          intermediate: { correct: 0, total: 0, mastered: 0, totalWords: 0 },
          advanced: { correct: 0, total: 0, mastered: 0, totalWords: 0 }
        });
      }
      
      const stats = statsMap.get(category)!;
      const difficultyKey = difficulty === '初級' ? 'beginner' : difficulty === '中級' ? 'intermediate' : 'advanced';
      
      stats[difficultyKey].correct += result.score;
      stats[difficultyKey].total += result.total;
    });

  // wordProgressから定着数を計算
  Object.entries(progress.wordProgress).forEach(([word, wordProg]) => {
    if (!wordProg.category || !wordProg.difficulty) return;
    
    const category = wordProg.category;
    const difficulty = wordProg.difficulty;
    
    if (!statsMap.has(category)) {
      statsMap.set(category, {
        beginner: { correct: 0, total: 0, mastered: 0, totalWords: 0 },
        intermediate: { correct: 0, total: 0, mastered: 0, totalWords: 0 },
        advanced: { correct: 0, total: 0, mastered: 0, totalWords: 0 }
      });
    }
    
    const stats = statsMap.get(category)!;
    const difficultyKey = difficulty === '初級' ? 'beginner' : difficulty === '中級' ? 'intermediate' : 'advanced';
    
    stats[difficultyKey].totalWords += 1;
    
    // 定着判定
    const totalAttempts = wordProg.correctCount + wordProg.incorrectCount;
    const isFirstTimeCorrect = totalAttempts === 1 && wordProg.correctCount === 1;
    const isConsecutivelyCorrect = wordProg.consecutiveCorrect >= 3;
    const isSkipped = wordProg.skippedCount && wordProg.skippedCount > 0;
    
    if (isFirstTimeCorrect || isConsecutivelyCorrect || isSkipped) {
      stats[difficultyKey].mastered += 1;
    }
  });

  // ソート順で分野を並べる
  const categoryOrder = ['動物', '植物', '自然', '天気', '時間', '場所', '学校', '家族', '食べ物', '身体', 
    '感情', '行動', '状態', '数字', '色', '形', '方向', '位置', 'その他'];
  
  const labels: string[] = [];
  const accuracyBeginner: number[] = [];
  const accuracyIntermediate: number[] = [];
  const accuracyAdvanced: number[] = [];
  const progressBeginner: number[] = [];
  const progressIntermediate: number[] = [];
  const progressAdvanced: number[] = [];

  categoryOrder.forEach(category => {
    const stats = statsMap.get(category);
    if (stats && (stats.beginner.total > 0 || stats.intermediate.total > 0 || stats.advanced.total > 0)) {
      labels.push(category);
      
      // 正答率（%）
      accuracyBeginner.push(stats.beginner.total > 0 ? (stats.beginner.correct / stats.beginner.total) * 100 : 0);
      accuracyIntermediate.push(stats.intermediate.total > 0 ? (stats.intermediate.correct / stats.intermediate.total) * 100 : 0);
      accuracyAdvanced.push(stats.advanced.total > 0 ? (stats.advanced.correct / stats.advanced.total) * 100 : 0);
      
      // 進捗率（定着数/総単語数 %）
      progressBeginner.push(stats.beginner.totalWords > 0 ? (stats.beginner.mastered / stats.beginner.totalWords) * 100 : 0);
      progressIntermediate.push(stats.intermediate.totalWords > 0 ? (stats.intermediate.mastered / stats.intermediate.totalWords) * 100 : 0);
      progressAdvanced.push(stats.advanced.totalWords > 0 ? (stats.advanced.mastered / stats.advanced.totalWords) * 100 : 0);
    }
  });

  return {
    labels,
    accuracyData: {
      beginner: accuracyBeginner,
      intermediate: accuracyIntermediate,
      advanced: accuracyAdvanced
    },
    progressData: {
      beginner: progressBeginner,
      intermediate: progressIntermediate,
      advanced: progressAdvanced
    }
  };
}
