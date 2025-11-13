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
    // 古いデータ構造の場合は初期化
    if (!progress.statistics || !progress.questionSetStats) {
      return initializeProgress();
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
