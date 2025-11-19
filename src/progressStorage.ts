// 進捗・成績管理用のLocalStorageモジュール

// LocalStorage容量制限対策
const STORAGE_KEY = 'progress-data';
const MAX_RESULTS_PER_MODE = 50; // モードごとの最大保存数

// SafeなLocalStorage操作
function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.warn('LocalStorage容量超過。古いデータを削除します。');
      // 古い結果データを削除
      cleanupOldResults();
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (e2) {
        console.error('データ削除後も保存失敗:', e2);
        return false;
      }
    }
    console.error('LocalStorage保存エラー:', e);
    return false;
  }
}

// 古い結果データを削除
function cleanupOldResults(): void {
  const data = loadProgress();
  if (data.results.length > MAX_RESULTS_PER_MODE * 3) {
    // モード別に最新N件のみ保持
    const resultsByMode = {
      translation: data.results.filter(r => r.mode === 'translation'),
      spelling: data.results.filter(r => r.mode === 'spelling'),
      reading: data.results.filter(r => r.mode === 'reading'),
    };
    
    data.results = [
      ...resultsByMode.translation.slice(-MAX_RESULTS_PER_MODE),
      ...resultsByMode.spelling.slice(-MAX_RESULTS_PER_MODE),
      ...resultsByMode.reading.slice(-MAX_RESULTS_PER_MODE),
    ].sort((a, b) => a.date - b.date);
    
    console.log(`古い結果を削除: ${resultsByMode.translation.length + resultsByMode.spelling.length + resultsByMode.reading.length}件 → ${data.results.length}件`);
  }
}

// セッション履歴インジケーター用のデータ型
export type SessionHistoryItem = {
  status: 'correct' | 'incorrect' | 'review' | 'mastered';
  word: string;
  timestamp: number;
};

// セッション履歴をLocalStorageに保存（最大50件）
const SESSION_HISTORY_KEY = 'session-history';
const MAX_SESSION_HISTORY = 50;

export function addSessionHistory(item: SessionHistoryItem, mode: 'translation' | 'spelling'): void {
  try {
    const key = `${SESSION_HISTORY_KEY}-${mode}`;
    const stored = localStorage.getItem(key);
    const history: SessionHistoryItem[] = stored ? JSON.parse(stored) : [];
    
    history.push(item);
    
    // 最新50件のみ保持
    if (history.length > MAX_SESSION_HISTORY) {
      history.shift();
    }
    
    localStorage.setItem(key, JSON.stringify(history));
  } catch (e) {
    console.error('セッション履歴の保存エラー:', e);
  }
}

export function getSessionHistory(mode: 'translation' | 'spelling', limit: number = 20): SessionHistoryItem[] {
  try {
    const key = `${SESSION_HISTORY_KEY}-${mode}`;
    const stored = localStorage.getItem(key);
    const history: SessionHistoryItem[] = stored ? JSON.parse(stored) : [];
    
    // 最新limit件を返す
    return history.slice(-limit);
  } catch (e) {
    console.error('セッション履歴の取得エラー:', e);
    return [];
  }
}

export function clearSessionHistory(mode: 'translation' | 'spelling'): void {
  try {
    const key = `${SESSION_HISTORY_KEY}-${mode}`;
    localStorage.removeItem(key);
  } catch (e) {
    console.error('セッション履歴のクリアエラー:', e);
  }
}

// 学習設定の型定義
export interface StudySettings {
  maxStudyCount: number; // 学習数上限（デフォルト: 20）
  maxReviewCount: number; // 要復習上限（デフォルト: 10）
}

// デフォルト設定
const DEFAULT_STUDY_SETTINGS: StudySettings = {
  maxStudyCount: 20,
  maxReviewCount: 10,
};

// 学習設定を取得
export function getStudySettings(): StudySettings {
  try {
    const stored = localStorage.getItem('study-settings');
    if (stored) {
      const settings = JSON.parse(stored);
      return {
        maxStudyCount: settings.maxStudyCount ?? DEFAULT_STUDY_SETTINGS.maxStudyCount,
        maxReviewCount: settings.maxReviewCount ?? DEFAULT_STUDY_SETTINGS.maxReviewCount,
      };
    }
  } catch (e) {
    console.error('学習設定の取得エラー:', e);
  }
  return { ...DEFAULT_STUDY_SETTINGS };
}

// 学習設定を保存
export function saveStudySettings(settings: StudySettings): boolean {
  try {
    localStorage.setItem('study-settings', JSON.stringify(settings));
    return true;
  } catch (e) {
    console.error('学習設定の保存エラー:', e);
    return false;
  }
}

// 学習設定を更新（部分更新対応）
export function updateStudySettings(partialSettings: Partial<StudySettings>): boolean {
  const currentSettings = getStudySettings();
  const newSettings = { ...currentSettings, ...partialSettings };
  return saveStudySettings(newSettings);
}

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
  needsVerification?: boolean; // AI学習アシスタント: 検証が必要
  verificationReason?: string; // AI学習アシスタント: 検証が必要な理由
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
const MAX_RESULTS = 300; // 保存する最大結果数（容量削減）
const MAX_WORD_PROGRESS = 2000; // 単語進捗の最大保存数
const MAX_RESPONSE_TIMES = 3; // 応答時間履歴の最大保存数（容量削減）

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
    
    // 起動時に自動圧縮を実行
    compressProgressData(progress);
    
    return progress;
  } catch (error) {
    console.error('進捗データの読み込みエラー:', error);
    return initializeProgress();
  }
}

// 進捗データの保存
export function saveProgress(progress: UserProgress): void {
  try {
    // データ圧縮: 古いデータを削除
    compressProgressData(progress);
    
    const data = JSON.stringify(progress);
    
    // データサイズチェック（3MBを超える場合は警告）
    const sizeInBytes = new Blob([data]).size;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    
    if (sizeInMB > 3) {
      console.warn(`LocalStorageデータサイズ: ${sizeInMB.toFixed(2)}MB - 容量超過のリスクあり`);
      // 緊急圧縮
      emergencyCompress(progress);
    }
    
    // safeSetItemを使用
    const saved = safeSetItem(PROGRESS_KEY, JSON.stringify(progress));
    if (!saved) {
      alert('データの保存に失敗しました。ブラウザのストレージ容量が不足しています。\n成績タブから古いデータを削除してください。');
    }
  } catch (error) {
    console.error('進捗データの保存に失敗:', error);
  }
}

// データ圧縮: 古いデータを削除
function compressProgressData(progress: UserProgress): void {
  // 1. 古いクイズ結果を削除（最新500件のみ保持）
  if (progress.results.length > MAX_RESULTS) {
    progress.results.sort((a, b) => b.date - a.date);
    progress.results = progress.results.slice(0, MAX_RESULTS);
  }
  
  // 2. 単語進捗データを最適化
  const wordEntries = Object.entries(progress.wordProgress);
  if (wordEntries.length > MAX_WORD_PROGRESS) {
    // 最終学習日が古い順にソート
    wordEntries.sort((a, b) => b[1].lastStudied - a[1].lastStudied);
    progress.wordProgress = Object.fromEntries(wordEntries.slice(0, MAX_WORD_PROGRESS));
  }
  
  // 3. 応答時間履歴を圧縮
  Object.values(progress.wordProgress).forEach(wp => {
    if (wp.responseTimes && wp.responseTimes.length > MAX_RESPONSE_TIMES) {
      wp.responseTimes = wp.responseTimes.slice(-MAX_RESPONSE_TIMES);
    }
  });
}

// 緊急圧縮: より積極的にデータを削減
function emergencyCompress(progress: UserProgress): void {
  console.log('緊急圧縮を開始...');
  
  // 1. クイズ結果を最新300件に削減
  if (progress.results.length > 300) {
    progress.results.sort((a, b) => b.date - a.date);
    progress.results = progress.results.slice(0, 300);
  }
  
  // 2. 単語進捗を最新2000件に削減
  const wordEntries = Object.entries(progress.wordProgress);
  if (wordEntries.length > 2000) {
    wordEntries.sort((a, b) => b[1].lastStudied - a[1].lastStudied);
    progress.wordProgress = Object.fromEntries(wordEntries.slice(0, 2000));
  }
  
  // 3. 応答時間履歴を3件に削減
  Object.values(progress.wordProgress).forEach(wp => {
    if (wp.responseTimes && wp.responseTimes.length > 3) {
      wp.responseTimes = wp.responseTimes.slice(-3);
    }
  });
  
  // 4. 学習日の記録を最新180日に削減
  if (progress.statistics.studyDates.length > 180) {
    progress.statistics.studyDates.sort((a, b) => b - a);
    progress.statistics.studyDates = progress.statistics.studyDates.slice(0, 180);
  }
  
  console.log('緊急圧縮完了');
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

/**
 * 柔軟な定着判定システム
 * 忘却曲線を考慮した高度な定着判定
 * 連続正解回数に応じて指数関数的に除外期間を延長
 */
interface MasteryResult {
  isMastered: boolean;
  excludeDays: number; // 除外期間（日数）
  reason: string; // 定着と判定した理由
  confidence: number; // 判定の信頼度（0-1）
  masteryLevel: number; // 習熟度レベル（1-7）
}

/**
 * 間隔反復アルゴリズム（SM-2改良版）
 * 連続正解回数に基づく指数関数的な復習間隔
 * 
 * 脳科学的根拠:
 * - エビングハウスの忘却曲線: 復習ごとに記憶が強化され、忘却速度が低下
 * - 間隔効果: 適切な間隔をあけた復習が最も効果的
 * - 長期増強 (LTP): 繰り返し刺激で神経結合が強化される
 * 
 * 復習スケジュール:
 * 1回目: 1日後
 * 2回目: 3日後
 * 3回目: 7日後   ← 短期記憶から長期記憶への移行
 * 4回目: 14日後
 * 5回目: 30日後  ← 長期記憶に定着
 * 6回目: 90日後  ← 確実な長期記憶
 * 7回目: 180日後 ← 半永久的記憶
 * 8回目以降: 365日後 ← 年1回の確認で十分
 */
function calculateExponentialInterval(consecutiveCorrect: number): number {
  // 連続正解回数に基づく指数関数的な間隔
  const intervals = [
    1,    // 0回: 即座に復習
    1,    // 1回: 1日後
    3,    // 2回: 3日後
    7,    // 3回: 1週間後（短期→長期記憶の移行）
    14,   // 4回: 2週間後
    30,   // 5回: 1ヶ月後（長期記憶に定着）
    90,   // 6回: 3ヶ月後（確実な長期記憶）
    180,  // 7回: 6ヶ月後（半永久的記憶）
    365   // 8回以上: 1年後（年次確認）
  ];
  
  // 8回以上は365日固定
  if (consecutiveCorrect >= intervals.length) {
    return 365;
  }
  
  return intervals[consecutiveCorrect] || 1;
}

function checkFlexibleMastery(
  wordProgress: WordProgress,
  isCorrect: boolean
): MasteryResult {
  const totalAttempts = wordProgress.correctCount + wordProgress.incorrectCount;
  const accuracy = totalAttempts > 0 ? wordProgress.correctCount / totalAttempts : 0;
  const { consecutiveCorrect, lastStudied } = wordProgress;
  
  // 経過時間の計算
  const hoursSinceLastStudy = (Date.now() - lastStudied) / (1000 * 60 * 60);
  const daysSinceLastStudy = hoursSinceLastStudy / 24;
  
  // === 確実な定着パターン ===
  
  // パターン1: 1発正解（即座定着）
  if (totalAttempts === 1 && isCorrect) {
    const excludeDays = calculateExponentialInterval(1);
    return {
      isMastered: true,
      excludeDays,
      reason: `1発正解（${excludeDays}日後に再確認）`,
      confidence: 0.85,
      masteryLevel: 1
    };
  }
  
  // パターン2: 連続正解（指数関数的な間隔延長）
  if (consecutiveCorrect >= 2 && isCorrect) {
    const excludeDays = calculateExponentialInterval(consecutiveCorrect);
    const masteryLevel = Math.min(7, Math.floor(consecutiveCorrect / 1));
    
    let reason = '';
    if (consecutiveCorrect >= 7) {
      reason = `超長期記憶達成！（連続${consecutiveCorrect}回正解、${excludeDays}日後に年次確認）`;
    } else if (consecutiveCorrect >= 5) {
      reason = `長期記憶定着（連続${consecutiveCorrect}回正解、${excludeDays}日後に確認）`;
    } else if (consecutiveCorrect >= 3) {
      reason = `短期→長期記憶移行（連続${consecutiveCorrect}回正解、${excludeDays}日後に確認）`;
    } else {
      reason = `学習中（連続${consecutiveCorrect}回正解、${excludeDays}日後に復習）`;
    }
    
    return {
      isMastered: true,
      excludeDays,
      reason,
      confidence: Math.min(0.99, 0.75 + consecutiveCorrect * 0.05),
      masteryLevel
    };
  }
  
  // === 柔軟な定着パターン（忘却曲線考慮） ===
  
  // パターン3: 高精度安定型（正答率90%以上 + 連続2回正解）
  if (totalAttempts >= 3 && accuracy >= 0.9 && consecutiveCorrect >= 2) {
    const excludeDays = calculateExponentialInterval(consecutiveCorrect);
    return {
      isMastered: true,
      excludeDays,
      reason: `高精度安定型（正答率${Math.round(accuracy * 100)}%、${excludeDays}日後に確認）`,
      confidence: 0.88,
      masteryLevel: 2
    };
  }
  
  // パターン4: 長期記憶型（7日以上間隔をあけて連続2回正解）
  // 間隔学習の効果を評価 → 通常より長い除外期間
  if (consecutiveCorrect >= 2 && daysSinceLastStudy >= 7 && isCorrect) {
    const baseInterval = calculateExponentialInterval(consecutiveCorrect);
    const excludeDays = Math.floor(baseInterval * 1.5); // 1.5倍のボーナス
    return {
      isMastered: true,
      excludeDays,
      reason: `長期記憶型（7日間隔で正解、${excludeDays}日後に確認）`,
      confidence: 0.92,
      masteryLevel: 3
    };
  }
  
  // パターン5: 中期記憶型（3日以上間隔をあけて連続2回正解）
  if (consecutiveCorrect >= 2 && daysSinceLastStudy >= 3 && isCorrect) {
    const baseInterval = calculateExponentialInterval(consecutiveCorrect);
    const excludeDays = Math.floor(baseInterval * 1.2); // 1.2倍のボーナス
    return {
      isMastered: true,
      excludeDays,
      reason: `中期記憶型（3日間隔で正解、${excludeDays}日後に確認）`,
      confidence: 0.85,
      masteryLevel: 2
    };
  }
  
  // パターン6: 短期完璧型（24時間以内に連続2回正解 + 正答率85%以上）
  if (consecutiveCorrect >= 2 && daysSinceLastStudy <= 1 && accuracy >= 0.85 && totalAttempts >= 4) {
    const excludeDays = calculateExponentialInterval(consecutiveCorrect);
    return {
      isMastered: true,
      excludeDays,
      reason: `短期完璧型（24時間内に連続正解、${excludeDays}日後に確認）`,
      confidence: 0.80,
      masteryLevel: 1
    };
  }
  
  // パターン7: 高回数安定型（5回以上挑戦 + 正答率80%以上 + 最近正解）
  if (totalAttempts >= 5 && accuracy >= 0.8 && isCorrect) {
    const excludeDays = Math.max(7, calculateExponentialInterval(2));
    return {
      isMastered: true,
      excludeDays,
      reason: `高回数安定型（${totalAttempts}回挑戦・正答率${Math.round(accuracy * 100)}%、${excludeDays}日後に確認）`,
      confidence: 0.83,
      masteryLevel: 2
    };
  }
  
  // パターン8: 次回定着予測型（連続2回正解 + 正答率75%以上）
  if (consecutiveCorrect >= 2 && accuracy >= 0.75 && totalAttempts >= 3) {
    if (isCorrect) {
      const excludeDays = calculateExponentialInterval(consecutiveCorrect);
      return {
        isMastered: true,
        excludeDays,
        reason: `次回定着達成（${excludeDays}日後に確認）`,
        confidence: 0.78,
        masteryLevel: 1
      };
    }
  }
  
  // === 未定着 ===
  return {
    isMastered: false,
    excludeDays: 0,
    reason: '未定着',
    confidence: 1.0,
    masteryLevel: 0
  };
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
  
  // 柔軟な定着判定システム
  const masteryResult = checkFlexibleMastery(wordProgress, isCorrect);
  
  if (masteryResult.isMastered) {
    wordProgress.skipExcludeUntil = Date.now() + masteryResult.excludeDays * 24 * 60 * 60 * 1000;
    // 定着したので長文読解の保存リストから削除
    removeFromReadingUnknownWords(word);
    
    // デバッグ用: 定着理由をログ出力
    if (masteryResult.reason !== '未定着') {
      console.log(`✅ ${word} が定着: ${masteryResult.reason} (除外期間: ${masteryResult.excludeDays}日)`);
    }
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
    
    // 変更があった場合のみ保存（エラーハンドリング追加）
    if (modified) {
      try {
        localStorage.setItem(readingDataKey, JSON.stringify(passages));
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.warn('長文読解データの保存に失敗（容量超過）。データを圧縮します。');
          // 長文読解データは再読み込みで復元できるため、削除して再取得を促す
          localStorage.removeItem(readingDataKey);
          console.log('長文読解データを削除しました。次回読み込み時に再取得されます。');
        } else {
          throw error;
        }
      }
    }
  } catch (err) {
    console.error('長文読解データの更新エラー:', err);
  }
}

// 単語のスキップを記録（スワイプでスキップされた場合）
// AI学習アシスタント: 後日検証するため一時的に除外
export function recordWordSkip(
  word: string,
  excludeDays: number = 30 // 30日後に検証
): void {
  const progress = loadProgress();
  
  if (!progress.wordProgress[word]) {
    progress.wordProgress[word] = initializeWordProgress(word);
  }
  
  const wordProgress = progress.wordProgress[word];
  
  // スキップを記録（後日検証するため、暫定的に定着扱い）
  wordProgress.consecutiveCorrect = 3; // 暫定定着
  wordProgress.masteryLevel = 'mastered';
  wordProgress.lastReviewed = Date.now();
  wordProgress.nextReviewDate = Date.now() + (excludeDays * 24 * 60 * 60 * 1000);
  
  // スキップ情報を記録
  wordProgress.skippedCount = (wordProgress.skippedCount || 0) + 1;
  wordProgress.lastSkipped = Date.now();
  wordProgress.skipExcludeUntil = Date.now() + (excludeDays * 24 * 60 * 60 * 1000);
  
  // AI学習アシスタント: スキップグループに追加（後で検証）
  // この処理はlearningAssistant.tsで行う
  
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
 * 定着率を計算（AI学習エンジンと連携）
 * 定着 = AI判定でretentionScore >= 80%の単語
 */
export function getRetentionRateWithAI(): {
  retentionRate: number;
  masteredCount: number;
  appearedCount: number;
} {
  const progress = loadProgress();
  const wordProgresses = Object.values(progress.wordProgress);
  const appearedWords = wordProgresses.filter(wp => 
    (wp.correctCount + wp.incorrectCount) > 0
  );
  
  let masteredCount = 0;
  
  // AI学習エンジンを使用して定着度を計算
  // adaptiveLearningAI.tsから関数をインポートして使用する想定
  // ここでは簡易的な実装
  appearedWords.forEach(wp => {
    const totalAttempts = wp.correctCount + wp.incorrectCount;
    const accuracy = totalAttempts > 0 ? (wp.correctCount / totalAttempts) * 100 : 0;
    
    // 簡易的な定着判定（本来はadaptiveLearningAI.calculateMemoryRetentionを使用）
    const isDefinitelyMastered = 
      (totalAttempts === 1 && wp.correctCount === 1) || // 1発100%
      wp.consecutiveCorrect >= 3 || // 連続3回以上正解
      (wp.skippedCount && wp.skippedCount > 0); // スキップ済み
    
    const isLikelyMastered = 
      totalAttempts >= 3 && 
      accuracy >= 80 && 
      wp.consecutiveCorrect >= 2;
    
    if (isDefinitelyMastered || isLikelyMastered) {
      masteredCount++;
    }
  });
  
  const retentionRate = appearedWords.length > 0 
    ? (masteredCount / appearedWords.length) * 100 
    : 0;
  
  return {
    retentionRate: Math.round(retentionRate),
    masteredCount,
    appearedCount: appearedWords.length
  };
}

/**
 * 学習中の単語の定着予測を取得
 * 各単語があと何回正解すれば定着するかを計算
 */
export interface MasteryPrediction {
  word: string;
  currentStatus: string; // 現在の状態
  remainingCorrectAnswers: number; // あと何回正解が必要か
  confidence: number; // 予測の信頼度（0-100%）
  nextMilestone: string; // 次のマイルストーン
  estimatedDays: number; // 推定残り日数
}

export function getMasteryPredictions(limit: number = 10): MasteryPrediction[] {
  const progress = loadProgress();
  const predictions: MasteryPrediction[] = [];
  
  Object.entries(progress.wordProgress).forEach(([word, wp]) => {
    const totalAttempts = wp.correctCount + wp.incorrectCount;
    if (totalAttempts === 0) return; // 未学習はスキップ
    
    const accuracy = wp.correctCount / totalAttempts;
    const { consecutiveCorrect } = wp;
    
    // すでに定着している単語はスキップ
    const masteryResult = checkFlexibleMastery(wp, true);
    if (masteryResult.isMastered) return;
    
    // 現在の状態を分析
    let remainingCorrectAnswers = 0;
    let nextMilestone = '';
    let estimatedDays = 0;
    let confidence = 0;
    let currentStatus = '';
    
    // パターン1: 連続正解に近い
    if (consecutiveCorrect === 2) {
      remainingCorrectAnswers = 1;
      nextMilestone = '連続3回正解で定着';
      estimatedDays = 1;
      confidence = 90;
      currentStatus = `連続${consecutiveCorrect}回正解中`;
    } else if (consecutiveCorrect === 1) {
      remainingCorrectAnswers = 2;
      nextMilestone = '連続3回正解で定着';
      estimatedDays = 2;
      confidence = 75;
      currentStatus = `連続${consecutiveCorrect}回正解中`;
    }
    // パターン2: 高精度安定型に近い（正答率90%以上）
    else if (accuracy >= 0.9 && consecutiveCorrect === 1 && totalAttempts >= 2) {
      remainingCorrectAnswers = 1;
      nextMilestone = '高精度安定型で定着（連続2回正解）';
      estimatedDays = 1;
      confidence = 85;
      currentStatus = `正答率${Math.round(accuracy * 100)}%`;
    }
    // パターン3: 高回数安定型に近い
    else if (totalAttempts >= 4 && accuracy >= 0.75) {
      remainingCorrectAnswers = 1;
      nextMilestone = '高回数安定型で定着（次回正解）';
      estimatedDays = 1;
      confidence = 80;
      currentStatus = `${totalAttempts}回挑戦・正答率${Math.round(accuracy * 100)}%`;
    }
    // パターン4: 次回定着予測型
    else if (consecutiveCorrect >= 2 && accuracy >= 0.7 && totalAttempts >= 3) {
      remainingCorrectAnswers = 1;
      nextMilestone = '次回定着達成';
      estimatedDays = 1;
      confidence = 75;
      currentStatus = `連続${consecutiveCorrect}回正解・正答率${Math.round(accuracy * 100)}%`;
    }
    // パターン5: まだ遠い
    else if (accuracy >= 0.6) {
      const neededConsecutive = 3 - consecutiveCorrect;
      remainingCorrectAnswers = Math.max(neededConsecutive, 2);
      nextMilestone = `連続${3}回正解を目指す`;
      estimatedDays = remainingCorrectAnswers;
      confidence = 60;
      currentStatus = `正答率${Math.round(accuracy * 100)}%`;
    }
    // パターン6: 苦手な単語
    else {
      remainingCorrectAnswers = 3;
      nextMilestone = '基礎から復習';
      estimatedDays = 5;
      confidence = 40;
      currentStatus = `要復習（正答率${Math.round(accuracy * 100)}%）`;
    }
    
    predictions.push({
      word,
      currentStatus,
      remainingCorrectAnswers,
      confidence,
      nextMilestone,
      estimatedDays
    });
  });
  
  // 定着が近い順にソート（残り回答数 → 信頼度）
  return predictions
    .sort((a, b) => {
      if (a.remainingCorrectAnswers !== b.remainingCorrectAnswers) {
        return a.remainingCorrectAnswers - b.remainingCorrectAnswers;
      }
      return b.confidence - a.confidence;
    })
    .slice(0, limit);
}

/**
 * 定着が近い単語の統計を取得
 */
export function getNearMasteryStats(): {
  nearMasteryCount: number; // 定着まであと1回の単語数
  learningCount: number; // 学習中の単語数
  averageRemainingAnswers: number; // 平均残り回答数
  longTermMemoryCount: number; // 長期記憶に達した単語数（連続5回以上）
  superMemoryCount: number; // 超長期記憶に達した単語数（連続7回以上）
} {
  const progress = loadProgress();
  let nearMasteryCount = 0;
  let learningCount = 0;
  let totalRemaining = 0;
  let longTermMemoryCount = 0;
  let superMemoryCount = 0;
  
  Object.values(progress.wordProgress).forEach(wp => {
    const totalAttempts = wp.correctCount + wp.incorrectCount;
    if (totalAttempts === 0) return;
    
    const masteryResult = checkFlexibleMastery(wp, true);
    if (masteryResult.isMastered) {
      // 長期記憶のカウント
      if (wp.consecutiveCorrect >= 7) {
        superMemoryCount++;
      } else if (wp.consecutiveCorrect >= 5) {
        longTermMemoryCount++;
      }
      return;
    }
    
    learningCount++;
    
    // あと1回で定着する条件をチェック
    const { consecutiveCorrect } = wp;
    const accuracy = wp.correctCount / totalAttempts;
    
    if (
      consecutiveCorrect === 2 || // 連続2回正解
      (accuracy >= 0.9 && consecutiveCorrect === 1 && totalAttempts >= 2) || // 高精度安定型
      (totalAttempts >= 4 && accuracy >= 0.75) // 高回数安定型
    ) {
      nearMasteryCount++;
      totalRemaining += 1;
    } else {
      totalRemaining += Math.max(1, 3 - consecutiveCorrect);
    }
  });
  
  return {
    nearMasteryCount,
    learningCount,
    averageRemainingAnswers: learningCount > 0 ? Math.round(totalRemaining / learningCount * 10) / 10 : 0,
    longTermMemoryCount,
    superMemoryCount
  };
}

/**
 * 今日の学習計画情報を取得
 * 要復習単語と確認予定単語を計算
 */
export interface DailyPlanInfo {
  reviewWordsCount: number; // 要復習単語数（忘却曲線で復習が必要）
  scheduledWordsCount: number; // 確認予定単語数（skipExcludeUntilが今日まで）
  totalPlannedCount: number; // 合計学習予定数
  reviewWords: string[]; // 要復習単語リスト
  scheduledWords: string[]; // 確認予定単語リスト
}

export function getDailyPlanInfo(): DailyPlanInfo {
  const progress = loadProgress();
  const now = Date.now();
  const today = new Date().setHours(0, 0, 0, 0);
  const tomorrow = today + 24 * 60 * 60 * 1000;
  
  const reviewWords: string[] = [];
  const scheduledWords: string[] = [];
  
  Object.entries(progress.wordProgress).forEach(([word, wp]) => {
    const totalAttempts = wp.correctCount + wp.incorrectCount;
    if (totalAttempts === 0) return; // 未学習はスキップ
    
    // 定着済みでスキップ除外期間中かチェック
    const isExcluded = wp.skipExcludeUntil && wp.skipExcludeUntil > now;
    
    if (isExcluded) {
      // 除外期間が今日中に終了する単語 = 確認予定
      if (wp.skipExcludeUntil && wp.skipExcludeUntil < tomorrow) {
        scheduledWords.push(word);
      }
    } else {
      // 除外されていない = 復習が必要
      // 最終学習から24時間以上経過している場合
      const hoursSinceLastStudy = (now - wp.lastStudied) / (1000 * 60 * 60);
      if (hoursSinceLastStudy >= 24) {
        reviewWords.push(word);
      }
    }
  });
  
  return {
    reviewWordsCount: reviewWords.length,
    scheduledWordsCount: scheduledWords.length,
    totalPlannedCount: reviewWords.length + scheduledWords.length,
    reviewWords,
    scheduledWords
  };
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

/**
 * モード別・難易度別の統計を取得
 */
export function getStatsByModeDifficulty(mode: 'translation' | 'spelling'): {
  labels: string[];
  accuracyData: number[];
  retentionData: number[];
} {
  const progress = loadProgress();
  const difficulties = ['beginner', 'intermediate', 'advanced'];
  const labels = ['初級', '中級', '上級'];
  const accuracyData: number[] = [];
  const retentionData: number[] = [];

  difficulties.forEach(difficulty => {
    const results = progress.results.filter(r => r.mode === mode && r.difficulty === difficulty);
    
    if (results.length > 0) {
      // 正答率
      const totalCorrect = results.reduce((sum, r) => sum + r.score, 0);
      const totalQuestions = results.reduce((sum, r) => sum + r.total, 0);
      const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
      accuracyData.push(accuracy);

      // 定着率（正答率85%以上の単語数 / 総出題単語数）
      const masteredWords = new Set<string>();
      const allWords = new Set<string>();
      
      Object.entries(progress.wordProgress).forEach(([word, stats]) => {
        // この難易度の問題で出題された単語かチェック
        const wordResults = results.filter(r => 
          r.incorrectWords?.includes(word) || 
          (r.questionSetName?.includes(word))
        );
        
        if (wordResults.length > 0 || stats.totalAttempts > 0) {
          allWords.add(word);
          if (stats.accuracy >= 85 && stats.totalAttempts >= 3) {
            masteredWords.add(word);
          }
        }
      });

      const retention = allWords.size > 0 ? (masteredWords.size / allWords.size) * 100 : 0;
      retentionData.push(retention);
    } else {
      accuracyData.push(0);
      retentionData.push(0);
    }
  });

  return { labels, accuracyData, retentionData };
}

/**
 * モード別・難易度別のデータをリセット
 */
export function resetStatsByModeDifficulty(mode: 'translation' | 'spelling', difficulty: string): void {
  const progress = loadProgress();
  
  // 該当するクイズ結果を削除
  progress.results = progress.results.filter(r => 
    !(r.mode === mode && r.difficulty === difficulty)
  );
  
  // 該当する単語の進捗をリセット（完全には削除せず、統計をリセット）
  Object.keys(progress.wordProgress).forEach(word => {
    const wordStat = progress.wordProgress[word];
    // この難易度・モードに関連する試行のみリセット
    // 簡易的に全体をリセット（より詳細な実装も可能）
    if (wordStat.totalAttempts > 0) {
      // 部分的なリセットは複雑なので、全モード・難易度でリセットする場合のみサポート
    }
  });
  
  saveProgress(progress);
}

/**
 * 学習カレンダー用のデータを取得（過去N日分）
 */
export function getStudyCalendarData(days: number = 90): Array<{
  date: string; // YYYY-MM-DD形式
  count: number; // その日の回答数
  accuracy: number; // その日の正答率
}> {
  const progress = loadProgress();
  const now = new Date();
  const calendarData: Array<{ date: string; count: number; accuracy: number }> = [];
  
  // 過去N日分の日付を生成
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // その日の結果を集計
    const dayStart = new Date(date).setHours(0, 0, 0, 0);
    const dayEnd = new Date(date).setHours(23, 59, 59, 999);
    const dayResults = progress.results.filter(r => r.date >= dayStart && r.date <= dayEnd);
    
    const totalAnswered = dayResults.reduce((sum, r) => sum + r.total, 0);
    const totalCorrect = dayResults.reduce((sum, r) => sum + r.score, 0);
    const accuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;
    
    calendarData.push({
      date: dateStr,
      count: totalAnswered,
      accuracy: accuracy,
    });
  }
  
  return calendarData;
}

/**
 * 週次統計を取得
 */
export function getWeeklyStats(): {
  studyDays: number; // 今週の学習日数
  totalDays: number; // 今週の総日数（通常7）
  totalAnswered: number; // 今週の総回答数
  accuracy: number; // 今週の正答率
  newMastered: number; // 今週新規定着した単語数
  previousWeekAccuracy: number; // 先週の正答率（比較用）
} {
  const progress = loadProgress();
  const now = new Date();
  
  // 今週の開始日（月曜日）を計算
  const currentDay = now.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  
  // 先週の範囲
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(weekStart.getDate() - 7);
  const lastWeekEnd = new Date(weekStart);
  
  // 今週の結果
  const thisWeekResults = progress.results.filter(r => 
    r.date >= weekStart.getTime() && r.date < weekEnd.getTime()
  );
  
  // 先週の結果
  const lastWeekResults = progress.results.filter(r => 
    r.date >= lastWeekStart.getTime() && r.date < lastWeekEnd.getTime()
  );
  
  // 今週の学習日数
  const studyDatesThisWeek = new Set<string>();
  thisWeekResults.forEach(r => {
    const date = new Date(r.date).toISOString().split('T')[0];
    studyDatesThisWeek.add(date);
  });
  
  // 今週の統計
  const totalAnswered = thisWeekResults.reduce((sum, r) => sum + r.total, 0);
  const totalCorrect = thisWeekResults.reduce((sum, r) => sum + r.score, 0);
  const accuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;
  
  // 先週の統計
  const lastWeekTotalAnswered = lastWeekResults.reduce((sum, r) => sum + r.total, 0);
  const lastWeekTotalCorrect = lastWeekResults.reduce((sum, r) => sum + r.score, 0);
  const previousWeekAccuracy = lastWeekTotalAnswered > 0 ? (lastWeekTotalCorrect / lastWeekTotalAnswered) * 100 : 0;
  
  // 今週新規定着した単語数
  let newMastered = 0;
  Object.values(progress.wordProgress).forEach(wp => {
    if (wp.masteryLevel === 'mastered' && wp.lastStudied >= weekStart.getTime()) {
      newMastered++;
    }
  });
  
  return {
    studyDays: studyDatesThisWeek.size,
    totalDays: 7,
    totalAnswered,
    accuracy,
    newMastered,
    previousWeekAccuracy,
  };
}

/**
 * 月次統計を取得
 */
export function getMonthlyStats(): {
  studyDays: number; // 今月の学習日数
  totalDays: number; // 今月の総日数
  totalAnswered: number; // 今月の総回答数
  accuracy: number; // 今月の正答率
  newMastered: number; // 今月新規定着した単語数
} {
  const progress = loadProgress();
  const now = new Date();
  
  // 今月の開始日
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);
  
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);
  
  // 今月の結果
  const thisMonthResults = progress.results.filter(r => 
    r.date >= monthStart.getTime() && r.date <= monthEnd.getTime()
  );
  
  // 今月の学習日数
  const studyDatesThisMonth = new Set<string>();
  thisMonthResults.forEach(r => {
    const date = new Date(r.date).toISOString().split('T')[0];
    studyDatesThisMonth.add(date);
  });
  
  // 今月の統計
  const totalAnswered = thisMonthResults.reduce((sum, r) => sum + r.total, 0);
  const totalCorrect = thisMonthResults.reduce((sum, r) => sum + r.score, 0);
  const accuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;
  
  // 今月新規定着した単語数
  let newMastered = 0;
  Object.values(progress.wordProgress).forEach(wp => {
    if (wp.masteryLevel === 'mastered' && wp.lastStudied >= monthStart.getTime()) {
      newMastered++;
    }
  });
  
  const totalDays = monthEnd.getDate();
  
  return {
    studyDays: studyDatesThisMonth.size,
    totalDays,
    totalAnswered,
    accuracy,
    newMastered,
  };
}

/**
 * 累積進捗データを取得（週別集計）
 */
export function getCumulativeProgressData(weeks: number = 12): Array<{
  weekLabel: string; // 週のラベル（例: "11/01"）
  cumulativeMastered: number; // 累積定着数
  weeklyMastered: number; // その週の新規定着数
  cumulativeAnswered: number; // 累積回答数
  weeklyAnswered: number; // その週の回答数
}> {
  const progress = loadProgress();
  const now = new Date();
  const data: Array<{
    weekLabel: string;
    cumulativeMastered: number;
    weeklyMastered: number;
    cumulativeAnswered: number;
    weeklyAnswered: number;
  }> = [];
  
  let cumulativeMastered = 0;
  let cumulativeAnswered = 0;
  
  for (let i = weeks - 1; i >= 0; i--) {
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - (i * 7));
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    
    // その週の結果
    const weekResults = progress.results.filter(r => 
      r.date >= weekStart.getTime() && r.date <= weekEnd.getTime()
    );
    
    const weeklyAnswered = weekResults.reduce((sum, r) => sum + r.total, 0);
    cumulativeAnswered += weeklyAnswered;
    
    // その週の新規定着数
    let weeklyMastered = 0;
    Object.values(progress.wordProgress).forEach(wp => {
      if (wp.masteryLevel === 'mastered' && 
          wp.lastStudied >= weekStart.getTime() && 
          wp.lastStudied <= weekEnd.getTime()) {
        weeklyMastered++;
      }
    });
    cumulativeMastered += weeklyMastered;
    
    const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
    
    data.push({
      weekLabel,
      cumulativeMastered,
      weeklyMastered,
      cumulativeAnswered,
      weeklyAnswered,
    });
  }
  
  return data;
}

/**
 * 定着率のトレンドを取得
 */
export function getRetentionTrend(): {
  last7Days: number;
  last30Days: number;
  allTime: number;
} {
  const progress = loadProgress();
  const now = Date.now();
  
  const day7Ago = now - (7 * 24 * 60 * 60 * 1000);
  const day30Ago = now - (30 * 24 * 60 * 60 * 1000);
  
  // 各期間の単語を集計
  const words7Days = new Set<string>();
  const mastered7Days = new Set<string>();
  const words30Days = new Set<string>();
  const mastered30Days = new Set<string>();
  const wordsAllTime = new Set<string>();
  const masteredAllTime = new Set<string>();
  
  progress.results.forEach(result => {
    result.incorrectWords.forEach(word => {
      wordsAllTime.add(word);
      if (result.date >= day30Ago) {
        words30Days.add(word);
      }
      if (result.date >= day7Ago) {
        words7Days.add(word);
      }
    });
  });
  
  Object.entries(progress.wordProgress).forEach(([word, wp]) => {
    if (wp.masteryLevel === 'mastered') {
      masteredAllTime.add(word);
      if (wp.lastStudied >= day30Ago) {
        mastered30Days.add(word);
      }
      if (wp.lastStudied >= day7Ago) {
        mastered7Days.add(word);
      }
    }
  });
  
  return {
    last7Days: words7Days.size > 0 ? (mastered7Days.size / words7Days.size) * 100 : 0,
    last30Days: words30Days.size > 0 ? (mastered30Days.size / words30Days.size) * 100 : 0,
    allTime: wordsAllTime.size > 0 ? (masteredAllTime.size / wordsAllTime.size) * 100 : 0,
  };
}

/**
 * 克服した単語（最近定着した単語）を取得
 */
export function getRecentlyMasteredWords(days: number = 7, limit: number = 10): Array<{
  word: string;
  masteredDate: number;
  totalAttempts: number;
}> {
  const progress = loadProgress();
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
  
  const words = Object.entries(progress.wordProgress)
    .filter(([_, wp]) => wp.masteryLevel === 'mastered' && wp.lastStudied >= cutoff)
    .map(([word, wp]) => ({
      word,
      masteredDate: wp.lastStudied,
      totalAttempts: wp.correctCount + wp.incorrectCount,
    }))
    .sort((a, b) => b.masteredDate - a.masteredDate)
    .slice(0, limit);
  
  return words;
}
