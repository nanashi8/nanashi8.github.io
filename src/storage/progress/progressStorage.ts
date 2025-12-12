// 進捗・成績管理用のストレージモジュール（IndexedDB/LocalStorage統合）

import {
  saveProgressData,
  loadProgressData,
  saveSetting,
  loadSetting,
} from '@/storage/manager/storageManager';
import { logger } from '@/utils/logger';
import { formatLocalYYYYMMDD, QUIZ_RESULT_EVENT } from '@/utils';
import type { ReadingPassage, ReadingPhrase, ReadingSegment } from '@/types/storage';
import { deleteDatabase } from '@/storage/indexedDB/indexedDBStorage';

// 型定義をインポート＆re-export
import type {
  SessionHistoryItem,
  StudySettings,
  QuizResult,
  WordProgress,
  UserProgress,
  DetailedRetentionStats,
  MasteryPrediction,
  DailyPlanInfo,
} from './types';

export type {
  SessionHistoryItem,
  StudySettings,
  QuizResult,
  WordProgress,
  UserProgress,
  DetailedRetentionStats,
  MasteryPrediction,
  DailyPlanInfo,
};

// 学習設定関連をre-export
export { getStudySettings, saveStudySettings, updateStudySettings } from './settings';

// セッション履歴関連をre-export
export { addSessionHistory, getSessionHistory, clearSessionHistory } from './sessionHistory';

// LocalStorage容量制限対策
const STORAGE_KEY = 'progress-data';
const MAX_RESULTS_PER_MODE = 50; // モードごとの最大保存数
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
    categoryStats: {},
    difficultyStats: {},
    wordProgress: {},
  };
}

// 進捗データの読み込み（IndexedDB対応）
export async function loadProgress(): Promise<UserProgress> {
  try {
    // ストレージマネージャーから読み込み
    const data = await loadProgressData();

    if (!data) {
      const initialized = initializeProgress();
      updateProgressCache(initialized);
      return initialized;
    }

    // ProgressDataからUserProgressへの変換（Phase 3で型統合予定）
    const progress: UserProgress = {
      results: (data.results || []) as unknown as QuizResult[],
      statistics: data.statistics || {
        totalQuizzes: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        averageScore: 0,
        bestScore: 0,
        streakDays: 0,
        lastStudyDate: 0,
        studyDates: [],
      },
      questionSetStats: data.questionSetStats || {},
      categoryStats: {},
      difficultyStats: {},
      wordProgress: (data.wordProgress || {}) as unknown as { [word: string]: WordProgress },
    };

    // データ構造の完全性チェック
    if (!progress.statistics) {
      progress.statistics = {
        totalQuizzes: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        averageScore: 0,
        bestScore: 0,
        streakDays: 0,
        lastStudyDate: 0,
        studyDates: [],
      };
    }
    if (!progress.questionSetStats) {
      progress.questionSetStats = {};
    }
    if (!progress.wordProgress) {
      progress.wordProgress = {};
    }
    if (!progress.results) {
      progress.results = [];
    }

    // 起動時に自動圧縮を実行
    compressProgressData(progress);

    // キャッシュを更新
    updateProgressCache(progress);

    return progress;
  } catch (error) {
    logger.error('進捗データの読み込みエラー:', error);
    const initialized = initializeProgress();
    updateProgressCache(initialized);
    return initialized;
  }
}

// 同期版loadProgress（後方互換性のため - 内部でキャッシュを使用）
let progressCache: UserProgress | null = null;

// 初期化を確実に行う関数
function ensureProgressCache(): UserProgress {
  if (!progressCache) {
    progressCache = initializeProgress();
    logger.log('📦 Progress cache initialized with default data');
  }
  return progressCache;
}

export function loadProgressSync(): UserProgress {
  if (progressCache) {
    // キャッシュがあっても、statisticsが欠けていたら補完
    if (!progressCache.statistics) {
      logger.warn('⚠️ Cache missing statistics, reinitializing');
      progressCache = initializeProgress();
    }
    return progressCache;
  }

  // キャッシュがない場合は初期化してから読み込み
  ensureProgressCache();

  // LocalStorageから直接読み込み（フォールバック）
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      const initialized = initializeProgress();
      progressCache = initialized;
      return initialized;
    }
    const progress = JSON.parse(data) as UserProgress;

    // データ構造の完全性チェックと補完
    if (!progress.statistics) {
      progress.statistics = {
        totalQuizzes: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        averageScore: 0,
        bestScore: 0,
        streakDays: 0,
        lastStudyDate: 0,
        studyDates: [],
      };
    }
    if (!progress.questionSetStats) {
      progress.questionSetStats = {};
    }
    if (!progress.wordProgress) {
      progress.wordProgress = {};
    }
    if (!progress.results) {
      progress.results = [];
    }
    if (!progress.results) {
      progress.results = [];
    }

    compressProgressData(progress);
    progressCache = progress;
    return progress;
  } catch (error) {
    logger.error('進捗データの読み込みエラー:', error);
    const initialized = initializeProgress();
    progressCache = initialized;
    return initialized;
  }
}

// キャッシュを更新
export function updateProgressCache(progress: UserProgress): void {
  progressCache = progress;
  logger.log('🔄 progressCache更新 - results件数:', progress.results.length);
}

// 進捗データの保存（IndexedDB対応）
export async function saveProgress(progress: UserProgress): Promise<void> {
  try {
    // データ圧縮: 古いデータを削除
    compressProgressData(progress);

    // キャッシュを更新
    updateProgressCache(progress);

    // LocalStorageにも保存（フォールバック用）
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      logger.warn('LocalStorage保存失敗（容量不足の可能性）:', e);
    }

    // UserProgressをProgressDataに変換して保存
    const progressData: import('@/types/storage').ProgressData = {
      quizzes: {},
      lastUpdated: Date.now(),
      totalAnswered: {},
      totalMastered: {},
      results: progress.results as unknown as import('@/types/storage').QuizResult[],
      statistics: progress.statistics,
      questionSetStats: progress.questionSetStats,
      wordProgress: progress.wordProgress as unknown as {
        [word: string]: import('@/types/storage').WordProgress;
      },
    };

    // ストレージマネージャーで保存
    const saved = await saveProgressData(progressData);

    if (!saved) {
      logger.error('データの保存に失敗しました');
    }
  } catch (error) {
    logger.error('進捗データの保存に失敗:', error);
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
  Object.values(progress.wordProgress).forEach((wp) => {
    if (wp.responseTimes && wp.responseTimes.length > MAX_RESPONSE_TIMES) {
      wp.responseTimes = wp.responseTimes.slice(-MAX_RESPONSE_TIMES);
    }
  });
}

// 緊急圧縮: より積極的にデータを削減
function emergencyCompress(progress: UserProgress): void {
  logger.log('緊急圧縮を開始...');

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
  Object.values(progress.wordProgress).forEach((wp) => {
    if (wp.responseTimes && wp.responseTimes.length > 3) {
      wp.responseTimes = wp.responseTimes.slice(-3);
    }
  });

  // 4. 学習日の記録を最新180日に削減
  if (progress.statistics.studyDates.length > 180) {
    progress.statistics.studyDates.sort((a, b) => b - a);
    progress.statistics.studyDates = progress.statistics.studyDates.slice(0, 180);
  }

  logger.log('緊急圧縮完了');
}

// クイズ結果を追加
export async function addQuizResult(result: QuizResult): Promise<void> {
  const progress = await loadProgress();
  progress.results.push(result);

  logger.log('✅ addQuizResult呼び出し:', {
    mode: result.mode,
    score: result.score,
    total: result.total,
    date: new Date(result.date).toISOString(),
    resultsCount: progress.results.length,
  });

  // 統計情報を更新
  updateStatistics(progress, result);

  await saveProgress(progress);

  logger.log('💾 saveProgress完了 - results件数:', progress.results.length);

  // 解答直後イベントを通知（StatsViewなどが購読）
  try {
    if (typeof window !== 'undefined') {
      const evt = new CustomEvent(QUIZ_RESULT_EVENT, { detail: { result } });
      window.dispatchEvent(evt);
    }
  } catch (_) {
    // SSR等でwindowが無い場合は無視
  }
}

// 統計情報の更新
function updateStatistics(progress: UserProgress, result: QuizResult): void {
  const stats = progress.statistics;

  // 基本統計
  stats.totalQuizzes++;
  stats.totalQuestions += result.total;
  stats.totalCorrect += result.score;
  stats.averageScore =
    stats.totalQuestions > 0 ? (stats.totalCorrect / stats.totalQuestions) * 100 : 0;
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
  const setResults = progress.results.filter((r) => r.questionSetId === result.questionSetId);
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
  const progress = loadProgressSync();
  return progress.results.filter((r) => r.date >= startDate && r.date <= endDate);
}

// getTodayIncorrectWords, getStatsByMode等はstatistics.tsに移動済み

// 進捗データのエクスポート
export function exportProgress(): string {
  const progress = loadProgressSync();
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
    logger.error('進捗データのインポートエラー:', error);
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
  const progress = loadProgressSync();
  const wordMistakes = new Map<string, number>();

  progress.results.forEach((result) => {
    result.incorrectWords.forEach((word) => {
      wordMistakes.set(word, (wordMistakes.get(word) || 0) + 1);
    });
  });

  return Array.from(wordMistakes.entries())
    .map(([word, mistakes]) => ({ word, mistakes }))
    .sort((a, b) => b.mistakes - a.mistakes)
    .slice(0, limit);
}

/**
 * 克服した苦手単語を取得
 * 条件: 累積5回以上間違えたが、最近20回の正答率80%以上 & 連続3回以上正解中
 */
export function getOvercomeWeakWords(limit: number = 10): Array<{
  word: string;
  totalMistakes: number;
  recentAccuracy: number;
  overcomeScore: number; // 克服度（高いほど印象的な克服）
}> {
  const progress = loadProgressSync();

  // 累積の間違い回数を集計
  const wordMistakes = new Map<string, number>();
  progress.results.forEach((result) => {
    result.incorrectWords.forEach((word) => {
      wordMistakes.set(word, (wordMistakes.get(word) || 0) + 1);
    });
  });

  const overcomeWords: Array<{
    word: string;
    totalMistakes: number;
    recentAccuracy: number;
    overcomeScore: number;
  }> = [];

  // 累積で5回以上間違えた単語のみ対象
  wordMistakes.forEach((mistakes, word) => {
    if (mistakes < 5) return;

    const wp = progress.wordProgress[word];
    if (!wp) return;

    const totalAttempts = wp.correctCount + wp.incorrectCount;
    if (totalAttempts === 0) return;

    // 最近20回の正答率を計算（データがない場合は全体の正答率）
    const recentAttempts = Math.min(totalAttempts, 20);
    const accuracy = (wp.correctCount / totalAttempts) * 100;

    // 克服条件:
    // 1. 最近の正答率が80%以上
    // 2. 1発正解 OR 連続3回以上正解中 OR 全体の正答率が85%以上
    const hasHighAccuracy = accuracy >= 80;
    const isFirstTimeCorrect = totalAttempts === 1 && wp.correctCount === 1;
    const isCurrentlyMastered = isFirstTimeCorrect || wp.consecutiveCorrect >= 3 || accuracy >= 85;

    if (hasHighAccuracy && isCurrentlyMastered) {
      // 克服度 = 間違い回数 × 正答率（間違いが多かったほど、そして今の正答率が高いほど印象的）
      const overcomeScore = mistakes * accuracy;

      overcomeWords.push({
        word,
        totalMistakes: mistakes,
        recentAccuracy: Math.round(accuracy),
        overcomeScore,
      });
    }
  });

  // 克服度でソート（最も印象的な克服から）
  return overcomeWords.sort((a, b) => b.overcomeScore - a.overcomeScore).slice(0, limit);
}

/**
 * 現在の苦手単語を取得（克服済みを除外）
 * 克服済みの単語は除外し、まだ苦手な単語のみを返す
 */
export function getCurrentWeakWords(limit: number = 10): Array<{
  word: string;
  mistakes: number;
  recentAccuracy: number;
  meaning?: string;
  reading?: string;
}> {
  const progress = loadProgressSync();

  // 累積の間違い回数を集計
  const wordMistakes = new Map<string, number>();
  progress.results.forEach((result) => {
    result.incorrectWords.forEach((word) => {
      wordMistakes.set(word, (wordMistakes.get(word) || 0) + 1);
    });
  });

  const currentWeakWords: Array<{
    word: string;
    mistakes: number;
    recentAccuracy: number;
    meaning?: string;
    reading?: string;
  }> = [];

  wordMistakes.forEach((mistakes, word) => {
    const wp = progress.wordProgress[word];

    // WordProgressがない場合は苦手として扱う
    if (!wp) {
      currentWeakWords.push({
        word,
        mistakes,
        recentAccuracy: 0,
        meaning: undefined,
        reading: undefined,
      });
      return;
    }

    const totalAttempts = wp.correctCount + wp.incorrectCount;
    const accuracy = totalAttempts > 0 ? (wp.correctCount / totalAttempts) * 100 : 0;

    // 克服判定（getOvercomeWeakWordsと同じ条件）
    const isFirstTimeCorrect = totalAttempts === 1 && wp.correctCount === 1;
    const isOvercome =
      mistakes >= 5 &&
      accuracy >= 80 &&
      (isFirstTimeCorrect || wp.consecutiveCorrect >= 3 || accuracy >= 85);

    // 克服していない場合のみリストに追加
    if (!isOvercome) {
      currentWeakWords.push({
        word,
        mistakes,
        recentAccuracy: Math.round(accuracy),
        meaning: wp.meaning,
        reading: wp.reading,
      });
    }
  });

  // 間違い回数でソート
  return currentWeakWords.sort((a, b) => b.mistakes - a.mistakes).slice(0, limit);
}

// getDailyStudyTime, getTodayStats等はstatistics.tsに移動済み

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
    responseTimes: [], // 応答時間の履歴
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
    1, // 0回: 即座に復習
    1, // 1回: 1日後
    3, // 2回: 3日後
    7, // 3回: 1週間後（短期→長期記憶の移行）
    14, // 4回: 2週間後
    30, // 5回: 1ヶ月後（長期記憶に定着）
    90, // 6回: 3ヶ月後（確実な長期記憶）
    180, // 7回: 6ヶ月後（半永久的記憶）
    365, // 8回以上: 1年後（年次確認）
  ];

  // 8回以上は365日固定
  if (consecutiveCorrect >= intervals.length) {
    return 365;
  }

  return intervals[consecutiveCorrect] || 1;
}

export function checkFlexibleMastery(
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
      masteryLevel: 1,
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
      masteryLevel,
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
      masteryLevel: 2,
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
      masteryLevel: 3,
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
      masteryLevel: 2,
    };
  }

  // パターン6: 短期完璧型（24時間以内に連続2回正解 + 正答率85%以上）
  if (
    consecutiveCorrect >= 2 &&
    daysSinceLastStudy <= 1 &&
    accuracy >= 0.85 &&
    totalAttempts >= 4
  ) {
    const excludeDays = calculateExponentialInterval(consecutiveCorrect);
    return {
      isMastered: true,
      excludeDays,
      reason: `短期完璧型（24時間内に連続正解、${excludeDays}日後に確認）`,
      confidence: 0.8,
      masteryLevel: 1,
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
      masteryLevel: 2,
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
        masteryLevel: 1,
      };
    }
  }

  // === 未定着 ===
  return {
    isMastered: false,
    excludeDays: 0,
    reason: '未定着',
    confidence: 1.0,
    masteryLevel: 0,
  };
}

// 習熟レベルを判定
function determineMasteryLevel(wordProgress: WordProgress): 'new' | 'learning' | 'mastered' {
  const total = wordProgress.correctCount + wordProgress.incorrectCount;

  if (total === 0) return 'new';

  const accuracy = wordProgress.correctCount / total;

  // より柔軟な定着判定:
  // 1. 初出で正解 → 即座に定着
  // 2. 5回以上学習して正解率85%以上 → 安定した定着
  // 3. 3回以上学習して正解率90%以上 → 高い定着
  // 4. 連続5回以上正解 → 強い定着
  // 5. 10回以上学習して正解率75%以上かつ直近2回が正解 → 長期学習による定着
  const isOneShot = total === 1 && wordProgress.correctCount === 1;
  const isStableAccuracy = total >= 5 && accuracy >= 0.85;
  const isHighAccuracy = total >= 3 && accuracy >= 0.9;
  const isStrongStreak = wordProgress.consecutiveCorrect >= 5;
  const isLongTermLearning =
    total >= 10 && accuracy >= 0.75 && wordProgress.consecutiveCorrect >= 2;

  if (isOneShot || isStableAccuracy || isHighAccuracy || isStrongStreak || isLongTermLearning) {
    return 'mastered';
  }

  return 'learning';
}

// 単語進捗を更新
export async function updateWordProgress(
  word: string,
  isCorrect: boolean,
  responseTime: number, // ミリ秒
  userRating?: number, // 1-10のユーザー評価（オプション）
  mode?: 'translation' | 'spelling' | 'reading' | 'grammar' | 'memorization' // モード情報
): Promise<void> {
  const progress = await loadProgress();

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

  // モード別統計を更新
  if (mode === 'translation') {
    wordProgress.translationAttempts = (wordProgress.translationAttempts || 0) + 1;
    if (isCorrect) {
      wordProgress.translationCorrect = (wordProgress.translationCorrect || 0) + 1;
      wordProgress.translationStreak = (wordProgress.translationStreak || 0) + 1;
    } else {
      wordProgress.translationStreak = 0;
    }
  } else if (mode === 'spelling') {
    wordProgress.spellingAttempts = (wordProgress.spellingAttempts || 0) + 1;
    if (isCorrect) {
      wordProgress.spellingCorrect = (wordProgress.spellingCorrect || 0) + 1;
      wordProgress.spellingStreak = (wordProgress.spellingStreak || 0) + 1;
    } else {
      wordProgress.spellingStreak = 0;
    }
  } else if (mode === 'grammar') {
    // 文法モードの統計（将来的に拡張可能）
    wordProgress.grammarAttempts = (wordProgress.grammarAttempts || 0) + 1;
    if (isCorrect) {
      wordProgress.grammarCorrect = (wordProgress.grammarCorrect || 0) + 1;
      wordProgress.grammarStreak = (wordProgress.grammarStreak || 0) + 1;
    } else {
      wordProgress.grammarStreak = 0;
    }
  } else if (mode === 'memorization') {
    // 暗記モードの統計（将来的に拡張可能）
    wordProgress.memorizationAttempts = (wordProgress.memorizationAttempts || 0) + 1;
    if (isCorrect) {
      wordProgress.memorizationCorrect = (wordProgress.memorizationCorrect || 0) + 1;
      wordProgress.memorizationStreak = (wordProgress.memorizationStreak || 0) + 1;
    } else {
      wordProgress.memorizationStreak = 0;
    }
  }

  // 総試行回数を更新
  wordProgress.totalAttempts =
    (wordProgress.translationAttempts || 0) +
    (wordProgress.spellingAttempts || 0) +
    (wordProgress.grammarAttempts || 0) +
    (wordProgress.memorizationAttempts || 0);

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

  // 学習履歴を記録（学習曲線AI用）最新20件を保持
  if (!wordProgress.learningHistory) {
    wordProgress.learningHistory = [];
  }
  wordProgress.learningHistory.push({
    timestamp: Date.now(),
    wasCorrect: isCorrect,
    responseTime,
    sessionIndex: 0, // App.tsxから渡すようにする
  });

  // 最新20件のみ保持（容量削減）
  if (wordProgress.learningHistory.length > 20) {
    wordProgress.learningHistory = wordProgress.learningHistory.slice(-20);
  }

  // 難易度スコアを再計算
  wordProgress.difficultyScore = calculateDifficultyScore(wordProgress);

  // 習熟レベルを更新
  const oldMasteryLevel = wordProgress.masteryLevel;
  wordProgress.masteryLevel = determineMasteryLevel(wordProgress);

  // デバッグ: 習熟レベルの変化をログ出力
  if (oldMasteryLevel !== wordProgress.masteryLevel) {
    logger.log(
      `🔄 ${word}: ${oldMasteryLevel} → ${wordProgress.masteryLevel} (正解: ${wordProgress.correctCount}, 不正解: ${wordProgress.incorrectCount}, 連続: ${wordProgress.consecutiveCorrect})`
    );
  }

  // 柔軟な定着判定システム
  const masteryResult = checkFlexibleMastery(wordProgress, isCorrect);

  if (masteryResult.isMastered) {
    wordProgress.skipExcludeUntil = Date.now() + masteryResult.excludeDays * 24 * 60 * 60 * 1000;
    // 定着したので長文読解の保存リストから削除
    removeFromReadingUnknownWords(word);

    // デバッグ用: 定着理由をログ出力
    if (masteryResult.reason !== '未定着') {
      logger.log(
        `✅ ${word} が定着: ${masteryResult.reason} (除外期間: ${masteryResult.excludeDays}日)`
      );
    }
  }

  // results配列に記録（ScoreBoard統計用）
  if (mode) {
    const questionSetName =
      mode === 'translation'
        ? '和訳'
        : mode === 'spelling'
          ? 'スペル'
          : mode === 'grammar'
            ? '文法'
            : mode === 'memorization'
              ? '暗記'
              : '読解';

    progress.results.push({
      id: `word-${word}-${Date.now()}`,
      questionSetId: 'individual-word',
      questionSetName,
      score: isCorrect ? 1 : 0,
      total: 1,
      percentage: isCorrect ? 100 : 0,
      date: Date.now(),
      timeSpent: responseTime / 1000,
      incorrectWords: isCorrect ? [] : [word],
      mode: mode as 'translation' | 'spelling' | 'reading' | 'grammar' | 'memorization',
      difficulty:
        wordProgress.difficultyScore > 0.7
          ? 'advanced'
          : wordProgress.difficultyScore > 0.4
            ? 'intermediate'
            : 'beginner',
    });
  }

  await saveProgress(progress);

  // 解答直後イベントを通知（StatsViewなどが購読）
  try {
    if (typeof window !== 'undefined') {
      const evt = new CustomEvent(QUIZ_RESULT_EVENT, {
        detail: {
          word,
          isCorrect,
          responseTime,
          mode,
        },
      });
      window.dispatchEvent(evt);
    }
  } catch (_) {
    // SSR等でwindowが無い場合は無視
  }
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
    const passages: ReadingPassage[] = JSON.parse(storedData);
    let modified = false;

    // 全パッセージの全フレーズの全セグメントをチェック
    passages.forEach((passage: ReadingPassage) => {
      if (passage.phrases) {
        passage.phrases.forEach((phrase: ReadingPhrase) => {
          if (phrase.segments) {
            phrase.segments.forEach((segment: ReadingSegment) => {
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
          logger.warn('長文読解データの保存に失敗（容量超過）。データを圧縮します。');
          // 長文読解データは再読み込みで復元できるため、削除して再取得を促す
          localStorage.removeItem(readingDataKey);
          logger.log('長文読解データを削除しました。次回読み込み時に再取得されます。');
        } else {
          throw error;
        }
      }
    }
  } catch (err) {
    logger.error('長文読解データの更新エラー:', err);
  }
}

// 単語のスキップを記録（スワイプでスキップされた場合）
// AI学習アシスタント: 後日検証するため一時的に除外
export function recordWordSkip(
  word: string,
  excludeDays: number = 30 // 30日後に検証
): void {
  const progress = loadProgressSync();

  if (!progress.wordProgress[word]) {
    progress.wordProgress[word] = initializeWordProgress(word);
  }

  const wordProgress = progress.wordProgress[word];

  // スキップを記録（後日検証するため、暫定的に定着扱い）
  wordProgress.consecutiveCorrect = 3; // 暫定定着
  wordProgress.masteryLevel = 'mastered';
  // wordProgress.lastReviewed = Date.now(); // プロパティが型定義に存在しないためコメントアウト
  // wordProgress.nextReviewDate = Date.now() + (excludeDays * 24 * 60 * 60 * 1000); // プロパティが型定義に存在しないためコメントアウト

  // スキップ情報を記録
  wordProgress.skippedCount = (wordProgress.skippedCount || 0) + 1;
  wordProgress.lastSkipped = Date.now();
  wordProgress.skipExcludeUntil = Date.now() + excludeDays * 24 * 60 * 60 * 1000;

  // AI学習アシスタント: スキップグループに追加（後で検証）
  // この処理はlearningAssistant.tsで行う

  saveProgress(progress);
}

// 単語がスキップ除外期間中かチェック
export function isWordSkipExcluded(word: string): boolean {
  const progress = loadProgressSync();
  const wordProgress = progress.wordProgress[word];

  if (!wordProgress) {
    return false;
  }

  // スキップによる除外期間をチェック
  if (wordProgress.skipExcludeUntil && Date.now() < wordProgress.skipExcludeUntil) {
    return true;
  }

  // 定着済み単語の次回復習日をチェック
  if (
    wordProgress.masteryLevel === 'mastered' &&
    wordProgress.nextReviewDate &&
    Date.now() < wordProgress.nextReviewDate
  ) {
    return true;
  }

  return false;
}

// スキップ除外期間中の単語および定着済み単語（復習期間外）を除外した問題リストを取得
export function filterSkippedWords<T extends { word: string }>(questions: T[]): T[] {
  return questions.filter((q) => !isWordSkipExcluded(q.word));
}

// 単語の進捗を取得
export function getWordProgress(word: string): WordProgress | null {
  const progress = loadProgressSync();
  return progress.wordProgress[word] || null;
}

// すべての単語進捗を取得
export function getAllWordProgress(): WordProgress[] {
  const progress = loadProgressSync();
  return Object.values(progress.wordProgress);
}

// 習熟レベル別に単語を取得
export function getWordsByMasteryLevel(level: 'new' | 'learning' | 'mastered'): string[] {
  const progress = loadProgressSync();
  return Object.values(progress.wordProgress)
    .filter((wp) => wp.masteryLevel === level)
    .map((wp) => wp.word);
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
    .filter((wp) => wp.difficultyScore >= 50)
    .sort((a, b) => b.difficultyScore - a.difficultyScore)
    .slice(0, limit);
}

// 復習が必要な単語を取得（最終学習から一定時間経過）
export function getWordsNeedingReview(hoursThreshold: number = 24): WordProgress[] {
  const now = Date.now();
  const threshold = hoursThreshold * 60 * 60 * 1000;

  const allWords = getAllWordProgress();
  return allWords
    .filter((wp) => {
      const timeSinceLastStudy = now - wp.lastStudied;
      return wp.masteryLevel === 'learning' && timeSinceLastStudy >= threshold;
    })
    .sort((a, b) => b.difficultyScore - a.difficultyScore);
}

/**
 * 混同履歴を記録（誤答として選んだ単語を記録）
 * @param confusedWord 誤答として選んだ単語
 * @param actualWord 実際に出題された単語
 */
export async function recordConfusion(confusedWord: string, actualWord: string): Promise<void> {
  const progress = await loadProgress();

  if (!progress.wordProgress[confusedWord]) {
    // まだ進捗がない場合は初期化
    progress.wordProgress[confusedWord] = {
      word: confusedWord,
      correctCount: 0,
      incorrectCount: 0,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,
      lastStudied: Date.now(),
      totalResponseTime: 0,
      averageResponseTime: 0,
      difficultyScore: 0,
      masteryLevel: 'new',
      responseTimes: [],
      confusedWith: [],
      confusionCount: 0,
      lastConfused: Date.now(),
    };
  }

  const wordProgress = progress.wordProgress[confusedWord];

  // 混同履歴を追加
  if (!wordProgress.confusedWith) {
    wordProgress.confusedWith = [];
  }

  wordProgress.confusedWith.push({
    word: actualWord,
    timestamp: Date.now(),
  });

  // 最新10件のみ保持
  if (wordProgress.confusedWith.length > 10) {
    wordProgress.confusedWith = wordProgress.confusedWith.slice(-10);
  }

  // 混同カウントを更新
  wordProgress.confusionCount = (wordProgress.confusionCount || 0) + 1;
  wordProgress.lastConfused = Date.now();

  // 難易度スコアを軽く上げる（混同されたということは覚えにくい可能性がある）
  wordProgress.difficultyScore = Math.min(100, (wordProgress.difficultyScore || 0) + 5);

  await saveProgress(progress);
  updateProgressCache(progress);
}

/**
 * 混同された単語を優先的に取得（出題の優先度を上げるため）
 */
export function getConfusedWords(limit: number = 20): WordProgress[] {
  const allWords = getAllWordProgress();
  return allWords
    .filter((wp) => (wp.confusionCount || 0) > 0)
    .sort((a, b) => {
      // 混同回数が多い順、同じなら最終混同日時が新しい順
      const countDiff = (b.confusionCount || 0) - (a.confusionCount || 0);
      if (countDiff !== 0) return countDiff;
      return (b.lastConfused || 0) - (a.lastConfused || 0);
    })
    .slice(0, limit);
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
    new: allWords.filter((wp) => wp.masteryLevel === 'new').length,
    learning: allWords.filter((wp) => wp.masteryLevel === 'learning').length,
    mastered: allWords.filter((wp) => wp.masteryLevel === 'mastered').length,
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
 * 定着条件: 1発正解 または 連続3回以上正解 または スキップされた単語
 */
export function getMasteredWordsCount(words: string[]): number {
  const progress = loadProgressSync();
  let masteredCount = 0;

  for (const word of words) {
    const wordProgress = progress.wordProgress[word];
    if (!wordProgress) continue;

    const totalAttempts = wordProgress.correctCount + wordProgress.incorrectCount;

    // 定着条件: 1発正解 または 連続3回以上正解 または スキップされている
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
 * 定着している単語のリストを取得
 */
export function getMasteredWords(words: string[]): string[] {
  const progress = loadProgressSync();
  const masteredWords: string[] = [];

  for (const word of words) {
    const wordProgress = progress.wordProgress[word];
    if (!wordProgress) continue;

    const totalAttempts = wordProgress.correctCount + wordProgress.incorrectCount;

    // 定着条件: 1発正解 または 連続3回以上正解 または スキップされている
    const isFirstTimeCorrect = totalAttempts === 1 && wordProgress.correctCount === 1;
    const isConsecutivelyCorrect = wordProgress.consecutiveCorrect >= 3;
    const isSkipped = wordProgress.skippedCount && wordProgress.skippedCount > 0;

    if (isFirstTimeCorrect || isConsecutivelyCorrect || isSkipped) {
      masteredWords.push(word);
    }
  }

  return masteredWords;
}

/**
 * 本日の統計を取得 - statistics.tsに移動済み
 */

/**
 * 累計回答数を取得
 * @param mode クイズモード（translation, spelling, reading, grammar）
 */
export function getTotalAnsweredCount(
  mode?: 'translation' | 'spelling' | 'reading' | 'grammar' | 'memorization'
): number {
  const progress = loadProgressSync();
  let results = progress.results;

  // モード指定がある場合はフィルタ
  if (mode) {
    results = results.filter((r) => r.mode === mode);
  }

  return results.reduce((sum, r) => sum + r.total, 0);
}

/**
 * 出題された単語数を取得（重複を除く）
 * @param mode クイズモード（translation, spelling, reading）
 */
export function getUniqueQuestionedWordsCount(
  mode?: 'translation' | 'spelling' | 'reading'
): number {
  const progress = loadProgressSync();
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
  const progress = loadProgressSync();
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
  const progress = loadProgressSync();
  const wordProgresses = Object.values(progress.wordProgress);
  const appearedWords = wordProgresses.filter((wp) => wp.correctCount + wp.incorrectCount > 0);

  let masteredCount = 0;

  // より現実的な定着判定（一度の間違いで失われない）
  appearedWords.forEach((wp) => {
    const totalAttempts = wp.correctCount + wp.incorrectCount;
    const accuracy = totalAttempts > 0 ? (wp.correctCount / totalAttempts) * 100 : 0;

    // 定着の条件（いずれかを満たせば定着とみなす）:
    // 1. masteryLevel が 'mastered' （システムが定着と判定）
    // 2. 1発で正解（1回目で正解した単語は即座に定着とみなす）
    // 3. 5回以上挑戦して正答率85%以上（安定した実績）
    // 4. 3回以上挑戦して正答率90%以上（高い習熟度）
    // 5. 連続5回以上正解（現在の強い定着状態）
    // 6. 10回以上挑戦して正答率75%以上（長期的な学習実績）
    const isMarkedAsMastered = wp.masteryLevel === 'mastered';
    const isOneShot = totalAttempts === 1 && wp.correctCount === 1;
    const isStableAccuracy = totalAttempts >= 5 && accuracy >= 85;
    const isHighAccuracy = totalAttempts >= 3 && accuracy >= 90;
    const isStrongStreak = wp.consecutiveCorrect >= 5;
    const isLongTermLearning = totalAttempts >= 10 && accuracy >= 75;

    if (
      isMarkedAsMastered ||
      isOneShot ||
      isStableAccuracy ||
      isHighAccuracy ||
      isStrongStreak ||
      isLongTermLearning
    ) {
      masteredCount++;
    }
  });

  const retentionRate = appearedWords.length > 0 ? (masteredCount / appearedWords.length) * 100 : 0;

  // 定着率は0-100%の範囲に制限
  const normalizedRetentionRate = Math.min(100, Math.max(0, retentionRate));

  return {
    retentionRate: Math.round(normalizedRetentionRate),
    masteredCount,
    appearedCount: appearedWords.length,
  };
}

/**
 * 学習中の単語の定着予測を取得
 * 各単語があと何回正解すれば定着するかを計算
 */
export function getMasteryPredictions(limit: number = 10): MasteryPrediction[] {
  const progress = loadProgressSync();
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
    } else if (consecutiveCorrect === 1 && accuracy >= 0.9 && totalAttempts >= 2) {
      // パターン2: 高精度安定型に近い（正答率90%以上）
      remainingCorrectAnswers = 1;
      nextMilestone = '高精度安定型で定着（連続2回正解）';
      estimatedDays = 1;
      confidence = 85;
      currentStatus = `正答率${Math.round(accuracy * 100)}%`;
    } else if (consecutiveCorrect === 1) {
      remainingCorrectAnswers = 2;
      nextMilestone = '連続3回正解で定着';
      estimatedDays = 2;
      confidence = 75;
      currentStatus = `連続${consecutiveCorrect}回正解中`;
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
      estimatedDays,
    });
  });

  // 定着が近い順にソート（残り回答数 → 信頼度）
  return predictions
    .sort((a, b) => {
      const aRemaining = a.remainingCorrectAnswers ?? 999;
      const bRemaining = b.remainingCorrectAnswers ?? 999;
      if (aRemaining !== bRemaining) {
        return aRemaining - bRemaining;
      }
      return b.confidence - a.confidence;
    })
    .slice(0, limit);
}

/**
 * 今日の学習計画情報を取得
 * 要復習単語と確認予定単語を計算
 */
export function getDailyPlanInfo(): DailyPlanInfo {
  const progress = loadProgressSync();
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
    scheduledWords,
  };
}

/**
 * 単語の難易度を自動判定する
 * 基準: 語長、学習回数、正答率から総合的に判定
 */
export function autoDetectWordDifficulty(
  word: string,
  stats: WordProgress
): 'beginner' | 'intermediate' | 'advanced' {
  // 1. 明示的な難易度設定があればそれを使用
  if (stats.difficulty) {
    return stats.difficulty as 'beginner' | 'intermediate' | 'advanced';
  }

  const totalAttempts = stats.correctCount + stats.incorrectCount;
  const accuracy = totalAttempts > 0 ? (stats.correctCount / totalAttempts) * 100 : 0;

  // 2. 語長ベースの初期判定
  let baseScore = 0;
  if (word.length <= 5)
    baseScore = 1; // 初級候補
  else if (word.length <= 8)
    baseScore = 2; // 中級候補
  else baseScore = 3; // 上級候補

  // 3. 学習パフォーマンスで調整
  if (totalAttempts >= 3) {
    if (accuracy < 50) {
      // 正答率50%未満 = 難しい → レベルアップ
      baseScore = Math.min(3, baseScore + 1);
    } else if (accuracy > 90 && stats.consecutiveCorrect >= 3) {
      // 正答率90%以上かつ連続3回以上正解 = 簡単 → レベルダウン
      baseScore = Math.max(1, baseScore - 1);
    }
  }

  // 4. スコアを難易度に変換
  if (baseScore === 1) return 'beginner';
  if (baseScore === 2) return 'intermediate';
  return 'advanced';
}

/**
 * モード別・難易度別のデータをリセット
 */
export function resetStatsByModeDifficulty(
  mode: 'translation' | 'spelling',
  difficulty: string
): void {
  const progress = loadProgressSync();

  // 該当するクイズ結果を削除
  const removedResults = progress.results.filter(
    (r) => r.mode === mode && r.difficulty === difficulty
  );
  progress.results = progress.results.filter(
    (r) => !(r.mode === mode && r.difficulty === difficulty)
  );

  // 削除された結果から単語リストを抽出
  const affectedWords = new Set<string>();
  removedResults.forEach((result) => {
    // 正解した単語
    const totalWords = result.total;
    const incorrectWords = result.incorrectWords || [];

    // すべての単語を収集（正解・不正解両方）
    incorrectWords.forEach((word) => affectedWords.add(word.toLowerCase()));

    // resultsには正解した単語のリストが無いので、
    // questionSetから該当する問題セットの単語を取得する必要がある
  });

  // questionSetStatsから該当するセットを削除
  Object.keys(progress.questionSetStats).forEach((setId) => {
    // セットIDに難易度が含まれているかチェック
    if (setId.includes(difficulty)) {
      delete progress.questionSetStats[setId];
    }
  });

  // 全単語の進捗データを見直し
  Object.keys(progress.wordProgress).forEach((word) => {
    const wordStat = progress.wordProgress[word];

    // 該当難易度の単語かチェック
    if (wordStat.difficulty === difficulty) {
      // モード別の統計をリセット
      if (mode === 'translation') {
        wordStat.translationAttempts = 0;
        wordStat.translationCorrect = 0;
        wordStat.translationStreak = 0;
      } else if (mode === 'spelling') {
        wordStat.spellingAttempts = 0;
        wordStat.spellingCorrect = 0;
        wordStat.spellingStreak = 0;
      }

      // 全体の統計を再計算
      const transAttempts = wordStat.translationAttempts || 0;
      const transCorrect = wordStat.translationCorrect || 0;
      const spellAttempts = wordStat.spellingAttempts || 0;
      const spellCorrect = wordStat.spellingCorrect || 0;

      wordStat.totalAttempts = transAttempts + spellAttempts;
      wordStat.correctCount = transCorrect + spellCorrect;
      wordStat.incorrectCount = transAttempts - transCorrect + (spellAttempts - spellCorrect);
      wordStat.consecutiveCorrect = Math.max(
        wordStat.translationStreak || 0,
        wordStat.spellingStreak || 0
      );

      // 統計が0になった場合は削除
      if (wordStat.totalAttempts === 0 || wordStat.totalAttempts === undefined) {
        delete progress.wordProgress[word];
      } else {
        // masteryLevelを再評価
        const accuracy =
          wordStat.totalAttempts > 0 ? wordStat.correctCount / wordStat.totalAttempts : 0;

        if (wordStat.consecutiveCorrect >= 3 || accuracy >= 0.9) {
          wordStat.masteryLevel = 'mastered';
        } else if (wordStat.totalAttempts > 0) {
          wordStat.masteryLevel = 'learning';
        } else {
          wordStat.masteryLevel = 'new';
        }

        // difficultyScoreを再計算
        wordStat.difficultyScore = calculateDifficultyScore(wordStat);
      }
    }
  });

  // 全体統計を再計算
  recalculateStatistics(progress);

  saveProgress(progress);

  logger.log(`${mode}モードの${difficulty}をリセット: ${removedResults.length}件の結果を削除`);
}

/**
 * 全体統計を再計算
 */
function recalculateStatistics(progress: UserProgress): void {
  const stats = progress.statistics;

  // resultsから統計を再計算
  stats.totalQuizzes = progress.results.length;
  stats.totalQuestions = progress.results.reduce((sum, r) => sum + r.total, 0);
  stats.totalCorrect = progress.results.reduce((sum, r) => sum + r.score, 0);
  stats.averageScore =
    stats.totalQuestions > 0 ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) : 0;
  stats.bestScore =
    progress.results.length > 0 ? Math.max(...progress.results.map((r) => r.percentage)) : 0;

  // 連続学習日数の再計算は複雑なので、既存の値を保持
  // （日付ベースの計算が必要）
}

// 全ての問題を読み込む補助関数
function loadAllQuestions(): Array<{ word: string; difficulty: string }> {
  try {
    const stored = localStorage.getItem('all-questions-cache');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    logger.error('Failed to load questions cache:', e);
  }
  return [];
}

/**
 * すべての学習記録を完全にリセット
 */
export async function resetAllProgress(): Promise<void> {
  // 1. IndexedDBの完全削除
  try {
    await deleteDatabase();
    logger.log('✅ IndexedDB削除完了');
  } catch (error) {
    logger.error('IndexedDB削除エラー:', error);
  }

  // 2. LocalStorageの全ての関連キーを削除
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key &&
      (key.startsWith('quiz-result-') ||
        key === 'quiz-app-user-progress' ||
        key === 'progress-data' ||
        key.startsWith('session-history-') ||
        key === 'session-history' ||
        key === 'skipped-words' ||
        key === 'skip-groups' ||
        key === 'improvement-progress' ||
        key === 'study-settings' ||
        key === 'reading-passages-data' ||
        key === 'all-questions-cache')
    ) {
      keysToRemove.push(key);
    }
  }

  // 一括削除
  keysToRemove.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      logger.error(`Failed to remove ${key}:`, e);
    }
  });

  // 3. 初期化データを保存
  const initialProgress = initializeProgress();
  saveProgress(initialProgress);

  logger.log(`✅ リセット完了: LocalStorage ${keysToRemove.length}個のキーを削除しました`);

  // 4. ページリロード（キャッシュクリア目的）
  window.location.reload();
}

/**
 * 学習カレンダー用のデータを取得（過去N日分）
 */
export function getStudyCalendarData(days: number = 90): Array<{
  date: string; // YYYY-MM-DD形式
  count: number; // その日の回答数
  accuracy: number; // その日の正答率
}> {
  const progress = loadProgressSync();
  const now = new Date();
  const calendarData: Array<{ date: string; count: number; accuracy: number }> = [];

  // 日付キーは共通ユーティリティを使用（UTCズレ対策）

  logger.log('📊 getStudyCalendarData呼び出し - progress.results件数:', progress.results.length);

  // 過去N日分の日付を生成
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = formatLocalYYYYMMDD(date);

    // その日の結果を集計
    const dayStart = new Date(date).setHours(0, 0, 0, 0);
    const dayEnd = new Date(date).setHours(23, 59, 59, 999);
    const dayResults = progress.results.filter((r) => r.date >= dayStart && r.date <= dayEnd);

    if (i === 0) {
      // 今日のデータを詳しくログ
      logger.log('📅 今日のデータ:', {
        dateStr,
        dayStart: new Date(dayStart).toISOString(),
        dayEnd: new Date(dayEnd).toISOString(),
        dayResults: dayResults.length,
        sampleResults: dayResults.slice(0, 3).map((r) => ({
          mode: r.mode,
          score: r.score,
          total: r.total,
          date: new Date(r.date).toISOString(),
        })),
      });
    }

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
 * 累積進捗データを取得（週別集計）
 */
export function getCumulativeProgressData(weeks: number = 12): Array<{
  weekLabel: string; // 週のラベル（例: "11/01"）
  cumulativeMastered: number; // 累積定着数
  weeklyMastered: number; // その週の新規定着数
  cumulativeAnswered: number; // 累積回答数
  weeklyAnswered: number; // その週の回答数
}> {
  const progress = loadProgressSync();
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
    weekEnd.setDate(now.getDate() - i * 7);
    weekEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    // その週の結果
    const weekResults = progress.results.filter(
      (r) => r.date >= weekStart.getTime() && r.date <= weekEnd.getTime()
    );

    const weeklyAnswered = weekResults.reduce((sum, r) => sum + r.total, 0);
    cumulativeAnswered += weeklyAnswered;

    // その週の新規定着数
    let weeklyMastered = 0;
    Object.values(progress.wordProgress).forEach((wp) => {
      if (
        wp.masteryLevel === 'mastered' &&
        wp.lastStudied >= weekStart.getTime() &&
        wp.lastStudied <= weekEnd.getTime()
      ) {
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
  const progress = loadProgressSync();
  const now = Date.now();

  const day7Ago = now - 7 * 24 * 60 * 60 * 1000;
  const day30Ago = now - 30 * 24 * 60 * 60 * 1000;

  // 各期間の単語を集計
  const words7Days = new Set<string>();
  const mastered7Days = new Set<string>();
  const words30Days = new Set<string>();
  const mastered30Days = new Set<string>();
  const wordsAllTime = new Set<string>();
  const masteredAllTime = new Set<string>();

  progress.results.forEach((result) => {
    result.incorrectWords.forEach((word) => {
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
    last7Days: Math.min(
      100,
      Math.max(0, words7Days.size > 0 ? (mastered7Days.size / words7Days.size) * 100 : 0)
    ),
    last30Days: Math.min(
      100,
      Math.max(0, words30Days.size > 0 ? (mastered30Days.size / words30Days.size) * 100 : 0)
    ),
    allTime: Math.min(
      100,
      Math.max(0, wordsAllTime.size > 0 ? (masteredAllTime.size / wordsAllTime.size) * 100 : 0)
    ),
  };
}

/**
 * 克服した単語（最近定着した単語）を取得
 */
/**
 * 単語の詳細データを取得（履歴タブ用）
 */
export function getWordDetailedData(word: string): {
  correctCount: number;
  totalCount: number;
  accuracyHistory: string; // 🟩🟥などのアイコン履歴
  retentionRate: number; // 定着率（0-100%）
  status: 'mastered' | 'learning' | 'struggling' | 'new'; // 定着状態
  statusLabel: string; // 状態ラベル
  statusIcon: string; // 状態アイコン
} | null {
  const progress = loadProgressSync();
  const wordProgress = progress.wordProgress[word];

  if (!wordProgress) {
    return null;
  }

  const correctCount = wordProgress.correctCount;
  const totalCount = wordProgress.correctCount + wordProgress.incorrectCount;

  // learningHistoryから正誤履歴を生成（最新10件）
  const learningHistory = wordProgress.learningHistory || [];
  const recentHistory = learningHistory.slice(-10);
  const accuracyHistory = recentHistory.map((h) => (h.wasCorrect ? '🟩' : '🟥')).join('');

  // 定着率を計算（連続正解数、正答率、最終学習日からの経過時間を考慮）
  let retentionRate = 0;

  if (totalCount === 0) {
    retentionRate = 0;
  } else {
    // 基本正答率（0-70%）
    const baseAccuracy = (correctCount / totalCount) * 70;

    // 連続正解ボーナス（0-20%）
    const consecutiveBonus = Math.min(20, (wordProgress.consecutiveCorrect || 0) * 5);

    // 最終学習からの経過時間によるペナルティ（0-10%減少）
    const daysSinceStudy = (Date.now() - wordProgress.lastStudied) / (24 * 60 * 60 * 1000);
    const timePenalty = Math.min(10, Math.max(0, (daysSinceStudy - 1) * 2));

    retentionRate = Math.min(100, Math.max(0, baseAccuracy + consecutiveBonus - timePenalty));

    // 定着レベルによる調整
    if (wordProgress.masteryLevel === 'mastered') {
      retentionRate = Math.max(90, retentionRate);
    }
  }

  // 定着状態を判定
  let status: 'mastered' | 'learning' | 'struggling' | 'new' = 'new';
  let statusLabel = '未学習';
  let statusIcon = '⚪';

  if (totalCount === 0) {
    status = 'new';
    statusLabel = '未学習';
    statusIcon = '⚪';
  } else if (wordProgress.masteryLevel === 'mastered' || retentionRate >= 80) {
    status = 'mastered';
    statusLabel = '定着済';
    statusIcon = '🟢';
  } else if (retentionRate >= 50) {
    status = 'learning';
    statusLabel = '学習中';
    statusIcon = '🟡';
  } else {
    status = 'struggling';
    statusLabel = '要復習';
    statusIcon = '🔴';
  }

  return {
    correctCount,
    totalCount,
    accuracyHistory,
    retentionRate: Math.round(retentionRate),
    status,
    statusLabel,
    statusIcon,
  };
}

// ===========================
// 暗記タブ用の関数
// ===========================

// カード表示設定の保存
export async function saveMemorizationCardSettings(
  settings: import('@/types').MemorizationCardState
): Promise<void> {
  try {
    await saveSetting('memorization-card-settings', settings);
  } catch (error) {
    logger.error('カード表示設定の保存エラー:', error);
    // フォールバック: localStorage
    localStorage.setItem('memorization-card-settings', JSON.stringify(settings));
  }
}

// カード表示設定の読み込み
export async function getMemorizationCardSettings(): Promise<
  import('@/types').MemorizationCardState | null
> {
  try {
    const settings = await loadSetting('memorization-card-settings');
    if (!settings) return null;
    if (typeof settings === 'string') {
      return JSON.parse(settings) as import('@/types').MemorizationCardState;
    }
    // ProgressData, SessionHistory, AppSettingsなどStorageValueのサブタイプを除外
    if (typeof settings === 'object' && 'showFurigana' in settings) {
      return settings as unknown as import('@/types').MemorizationCardState;
    }
    return null;
  } catch (error) {
    logger.error('カード表示設定の読み込みエラー:', error);
    // フォールバック: localStorage
    const stored = localStorage.getItem('memorization-card-settings');
    return stored ? JSON.parse(stored) : null;
  }
}

// 暗記設定の保存
export async function saveMemorizationSettings(
  settings: import('@/types').MemorizationSettings
): Promise<void> {
  try {
    await saveSetting('memorization-settings', settings);
  } catch (error) {
    logger.error('暗記設定の保存エラー:', error);
    localStorage.setItem('memorization-settings', JSON.stringify(settings));
  }
}

// 暗記設定の読み込み
export async function getMemorizationSettings(): Promise<
  import('@/types').MemorizationSettings | null
> {
  try {
    const settings = await loadSetting('memorization-settings');
    if (!settings) return null;
    if (typeof settings === 'string') {
      return JSON.parse(settings) as import('@/types').MemorizationSettings;
    }
    if (typeof settings === 'object' && 'shuffleOrder' in settings) {
      return settings as unknown as import('@/types').MemorizationSettings;
    }
    return null;
  } catch (error) {
    logger.error('暗記設定の読み込みエラー:', error);
    const stored = localStorage.getItem('memorization-settings');
    return stored ? JSON.parse(stored) : null;
  }
}

// 暗記行動記録の保存
export async function recordMemorizationBehavior(
  behavior: import('@/types').MemorizationBehavior
): Promise<void> {
  try {
    // 既存の記録を取得
    const existingBehaviors = await loadSetting('memorization-behaviors');
    const behaviors = existingBehaviors
      ? typeof existingBehaviors === 'string'
        ? JSON.parse(existingBehaviors)
        : existingBehaviors
      : [];

    // 新しい記録を追加（最大1000件まで）
    const updated = [...behaviors, behavior].slice(-1000);

    await saveSetting('memorization-behaviors', updated);
  } catch (error) {
    logger.error('暗記行動記録の保存エラー:', error);
  }
}

// 暗記行動履歴の取得
export async function getMemorizationHistory(
  word?: string,
  limit: number = 100
): Promise<import('@/types').MemorizationBehavior[]> {
  try {
    const behaviorData = await loadSetting('memorization-behaviors');
    const behaviors = behaviorData
      ? typeof behaviorData === 'string'
        ? JSON.parse(behaviorData)
        : behaviorData
      : [];

    let filtered = behaviors;
    if (word) {
      filtered = behaviors.filter((b: import('@/types').MemorizationBehavior) => b.word === word);
    }

    return filtered.slice(-limit);
  } catch (error) {
    logger.error('暗記行動履歴の取得エラー:', error);
    return [];
  }
}

// 学習曲線データの更新
export async function updateMemorizationCurve(
  word: string,
  curve: import('@/types').MemorizationCurve
): Promise<void> {
  try {
    const key = `memorization-curve-${word}`;
    await saveSetting(key, curve);
  } catch (error) {
    logger.error('学習曲線データの更新エラー:', error);
  }
}

// 学習曲線データの取得
export async function getMemorizationCurve(
  word: string
): Promise<import('@/types').MemorizationCurve | null> {
  try {
    const key = `memorization-curve-${word}`;
    const curveData = await loadSetting(key);
    if (!curveData) return null;
    if (typeof curveData === 'string') {
      return JSON.parse(curveData) as import('@/types').MemorizationCurve;
    }
    if (typeof curveData === 'object' && 'correctHistory' in curveData) {
      return curveData as unknown as import('@/types').MemorizationCurve;
    }
    return null;
  } catch (error) {
    logger.error('学習曲線データの取得エラー:', error);
    return null;
  }
}

// ============================================
// カスタム問題セット管理機能
// ============================================

const CUSTOM_QUESTION_SETS_KEY = 'custom-question-sets';

// カスタム問題セット一覧を取得
export async function getCustomQuestionSets(): Promise<import('@/types').CustomQuestionSet[]> {
  try {
    const data = await loadSetting(CUSTOM_QUESTION_SETS_KEY);
    if (!data) return [];
    if (typeof data === 'string') {
      return JSON.parse(data) as import('@/types').CustomQuestionSet[];
    }
    if (Array.isArray(data)) {
      return data as import('@/types').CustomQuestionSet[];
    }
    return [];
  } catch (error) {
    logger.error('カスタム問題セット取得エラー:', error);
    return [];
  }
}

// カスタム問題セットを保存
export async function saveCustomQuestionSet(
  questionSet: import('@/types').CustomQuestionSet
): Promise<void> {
  try {
    const sets = await getCustomQuestionSets();
    const existingIndex = sets.findIndex((s) => s.id === questionSet.id);

    if (existingIndex >= 0) {
      // 既存のセットを更新
      sets[existingIndex] = {
        ...questionSet,
        updatedAt: Date.now(),
      };
    } else {
      // 新規追加
      sets.push(questionSet);
    }

    await saveSetting(CUSTOM_QUESTION_SETS_KEY, sets);
  } catch (error) {
    logger.error('カスタム問題セット保存エラー:', error);
    throw error;
  }
}

// カスタム問題セットを削除
export async function deleteCustomQuestionSet(id: string): Promise<void> {
  try {
    const sets = await getCustomQuestionSets();
    const filtered = sets.filter((s) => s.id !== id);
    await saveSetting(CUSTOM_QUESTION_SETS_KEY, filtered);
  } catch (error) {
    logger.error('カスタム問題セット削除エラー:', error);
    throw error;
  }
}

// 苦手語句から自動的に問題セットを生成
export async function createWeakWordsQuestionSet(
  name: string,
  limit: number = 20,
  minMistakes: number = 3,
  maxAccuracy: number = 60,
  allQuestions: import('@/types').Question[]
): Promise<import('@/types').CustomQuestionSet> {
  // 苦手語句を取得
  const weakWords = getCurrentWeakWords(100); // 多めに取得

  // 条件でフィルタリング
  const filtered = weakWords
    .filter((w) => w.mistakes >= minMistakes && w.recentAccuracy <= maxAccuracy)
    .slice(0, limit);

  // allQuestionsから詳細情報を取得してQuestion形式に変換
  const questions: import('@/types').Question[] = filtered.map((w) => {
    const questionData = allQuestions.find((q) => q.word.toLowerCase() === w.word.toLowerCase());

    if (questionData) {
      return questionData;
    }

    // allQuestionsに見つからない場合は基本情報のみで作成
    return {
      word: w.word,
      reading: w.reading || '',
      meaning: w.meaning || '',
      etymology: '',
      relatedWords: '',
      relatedFields: '',
      difficulty: 'intermediate',
    };
  });

  const questionSet: import('@/types').CustomQuestionSet = {
    id: `weak-words-${Date.now()}`,
    name,
    source: 'weak-words',
    questions,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isAutoUpdate: true,
    autoUpdateConfig: {
      limit,
      minMistakes,
      maxAccuracy,
    },
    metadata: {
      description: `苦手語句から自動生成（間違い${minMistakes}回以上、正答率${maxAccuracy}%以下）`,
      totalWords: questions.length,
    },
  };

  return questionSet;
}

// 長文保存語句から問題セットを生成
export async function createReadingQuestionSet(
  name: string,
  questions: import('@/types').Question[]
): Promise<import('@/types').CustomQuestionSet> {
  const questionSet: import('@/types').CustomQuestionSet = {
    id: `reading-${Date.now()}`,
    name,
    source: 'reading',
    questions,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isAutoUpdate: false,
    metadata: {
      description: '長文読解から保存した語句',
      totalWords: questions.length,
    },
  };

  return questionSet;
}

// 自動更新が有効な問題セットを更新
export async function updateAutoUpdateQuestionSets(
  allQuestions: import('@/types').Question[]
): Promise<void> {
  try {
    const sets = await getCustomQuestionSets();
    let updated = false;

    for (const set of sets) {
      if (set.isAutoUpdate && set.source === 'weak-words' && set.autoUpdateConfig) {
        // 苦手語句を再取得して更新
        const newSet = await createWeakWordsQuestionSet(
          set.name,
          set.autoUpdateConfig.limit,
          set.autoUpdateConfig.minMistakes,
          set.autoUpdateConfig.maxAccuracy,
          allQuestions
        );

        set.questions = newSet.questions;
        set.updatedAt = Date.now();
        set.metadata = newSet.metadata;
        updated = true;
      }
    }

    if (updated) {
      await saveSetting(CUSTOM_QUESTION_SETS_KEY, sets);
    }
  } catch (error) {
    logger.error('自動更新エラー:', error);
  }
}

/**
 * 文法モード専用の定着率を計算
 */
export function getGrammarRetentionRateWithAI(): {
  retentionRate: number;
  masteredCount: number;
  appearedCount: number;
} {
  const progress = loadProgressSync();
  const allWords = Object.values(progress.wordProgress);

  // 文法問題のみフィルタリング
  const grammarQuestions = allWords.filter(
    (wp) =>
      (wp.grammarAttempts && wp.grammarAttempts > 0) ||
      wp.word.startsWith('grammar_') ||
      wp.word.includes('_g')
  );

  const appearedQuestions = grammarQuestions.filter(
    (wp) =>
      (wp.grammarAttempts && wp.grammarAttempts > 0) || wp.correctCount + wp.incorrectCount > 0
  );

  let masteredCount = 0;

  appearedQuestions.forEach((wp) => {
    const totalAttempts = wp.grammarAttempts || wp.correctCount + wp.incorrectCount;
    const correctCount = wp.grammarCorrect || wp.correctCount;
    const consecutiveCorrect = wp.grammarStreak || wp.consecutiveCorrect;
    const accuracy = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0;

    // 定着の条件
    const isMarkedAsMastered = wp.masteryLevel === 'mastered';
    const isOneShot = totalAttempts === 1 && correctCount === 1;
    const isStableAccuracy = totalAttempts >= 5 && accuracy >= 85;
    const isHighAccuracy = totalAttempts >= 3 && accuracy >= 90;
    const isStrongStreak = consecutiveCorrect >= 5;
    const isLongTermLearning = totalAttempts >= 10 && accuracy >= 75;

    if (
      isMarkedAsMastered ||
      isOneShot ||
      isStableAccuracy ||
      isHighAccuracy ||
      isStrongStreak ||
      isLongTermLearning
    ) {
      masteredCount++;
    }
  });

  const retentionRate =
    appearedQuestions.length > 0 ? (masteredCount / appearedQuestions.length) * 100 : 0;

  const normalizedRetentionRate = Math.min(100, Math.max(0, retentionRate));

  return {
    retentionRate: Math.round(normalizedRetentionRate),
    masteredCount,
    appearedCount: appearedQuestions.length,
  };
}

// 文法単元別統計を単元タイトル付きで取得（出題されている単元のみ）
export async function getGrammarUnitStatsWithTitles(): Promise<
  Array<{
    unit: string;
    title: string;
    totalQuestions: number;
    answeredQuestions: number;
    correctCount: number;
    incorrectCount: number;
    masteredCount: number;
    accuracy: number;
    progress: number;
  }>
> {
  const baseStats = getGrammarUnitStats();

  // 各単元のタイトルを取得し、出題されている単元のみフィルター
  const statsWithTitles = await Promise.all(
    baseStats.map(
      async (stat: {
        unit: string;
        totalQuestions: number;
        answeredQuestions: number;
        correctCount: number;
        incorrectCount: number;
        masteredCount: number;
        accuracy: number;
        progress: number;
      }) => {
        // 中1_Unit1 → grade=1, unit=1
        const match = stat.unit.match(/中(\d+)_Unit(\d+)/);
        if (!match) {
          return null;
        }

        const grade = match[1];
        const unitNum = match[2];

        try {
          const res = await fetch(`/data/grammar/grammar_grade${grade}_unit${unitNum}.json`);
          if (res.ok) {
            const data = await res.json();
            // enabled === false の単元は除外
            if (data.enabled === false) {
              return null;
            }
            return {
              ...stat,
              title: data.title || '',
            };
          }
        } catch (_err) {
          // fetch失敗時はnull
          return null;
        }

        return null;
      }
    )
  );

  // nullを除外して返す
  return statsWithTitles.filter((stat): stat is NonNullable<typeof stat> => stat !== null);
}

// ========== 統計関数の再エクスポート ==========
export {
  getStatsByMode,
  getRecentResults,
  getStatsByCategory,
  getStatsByDifficulty,
  getTodayIncorrectWords,
  getDailyStudyTime,
  getTodayStats,
  getWeeklyStats,
  getMonthlyStats,
  getDetailedRetentionStats,
  getNearMasteryStats,
  getDifficultyStatsForRadar,
  getRecentlyMasteredWords,
  getCategoryDifficultyStats,
  getStatsByModeDifficulty,
  getGrammarDetailedRetentionStats,
  getGrammarUnitStats,
} from './statistics';

// getGrammarUnitStatsで使用するため、再importが必要
import { getGrammarUnitStats } from './statistics';
