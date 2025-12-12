/**
 * ストレージ型定義
 * 
 * 目的: storageManager.ts, dataExport.ts, progressStorage.ts の
 * any 型を置換し、型安全性を確保する
 */

// ============================================
// 進捗データ型
// ============================================

// 注: これは簡略版。完全版はprogressStorage.tsのQuizResultとWordProgress
// Phase 3で型定義を統合予定
export interface QuizResult {
  score: number;
  total: number;
  date: string | number; // string または number (タイムスタンプ)
  [key: string]: unknown; // その他のプロパティを許容
}

export interface WordProgress {
  word: string;
  correctCount: number;
  incorrectCount: number;
  lastStudied: number;
  mastered?: boolean;
  consecutiveCorrect?: number;
  nextReviewDate?: number;
  [key: string]: unknown; // その他のプロパティを許容
}

export interface ProgressData {
  quizzes: Record<string, QuizResult[]>;
  lastUpdated: number;
  totalAnswered: Record<string, number>;
  totalMastered: Record<string, number>;
  
  // UserProgress互換フィールド（Phase 3で統合予定）
  results?: QuizResult[];
  statistics?: {
    totalQuizzes: number;
    totalQuestions: number;
    totalCorrect: number;
    averageScore: number;
    bestScore: number;
    streakDays: number;
    lastStudyDate: number;
    studyDates: number[];
  };
  questionSetStats?: {
    [setId: string]: {
      attempts: number;
      bestScore: number;
      averageScore: number;
      lastAttempt: number;
      totalTimeSpent: number;
    };
  };
  wordProgress?: {
    [word: string]: WordProgress;
  };
}

// ============================================
// セッションデータ型
// ============================================

export interface SessionRecord {
  date: string;
  duration: number;
  questionsAnswered: number;
  correctAnswers: number;
}

export interface SessionHistory {
  sessions: SessionRecord[];
}

// ============================================
// 統計型
// ============================================

export interface DailyStat {
  date: string;
  answered: number;
  correct: number;
  retentionRate: number;
}

// ============================================
// 設定型
// ============================================

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  autoAdvance: boolean;
  autoAdvanceDelay: number;
  soundEnabled: boolean;
}

// ============================================
// エクスポートデータ型
// ============================================

export interface ExportData {
  progress: ProgressData | null;
  sessionHistory: SessionRecord[];
  dailyStats: DailyStat[];
  settings: Partial<AppSettings>;
  exportedAt: number;
  version: string;
}

// ============================================
// ローカルストレージ値型
// ============================================

export type StorageValue = 
  | ProgressData 
  | SessionHistory
  | AppSettings
  | string
  | number
  | boolean
  | object
  | null;

// ============================================
// フレーズセグメント型
// ============================================

export interface PhraseSegment {
  text: string;
  ruby?: string;
  meaning?: string;
}

export interface Phrase {
  segments: PhraseSegment[];
}

export interface Passage {
  id: string;
  title: string;
  phrases: Phrase[];
  content?: string;
}

// ============================================
// Reading データ型 (progressStorage.ts用)
// ============================================
// 注: reading.tsと重複のため、型エイリアスとして再エクスポート
import type { 
  ReadingSegment as ReadingSegmentBase, 
  ReadingPhrase as ReadingPhraseBase, 
  ReadingPassage as ReadingPassageBase 
} from './reading';

export type { 
  ReadingSegmentBase as ReadingSegment, 
  ReadingPhraseBase as ReadingPhrase, 
  ReadingPassageBase as ReadingPassage 
};

// ============================================
// AI コメント型
// ============================================

export interface QuizScore {
  score: number;
  total: number;
  date: string;
}

export interface QuizResultWithCategory {
  score: number;
  total: number;
  date: number | string;
  mode?: string;
  category?: string;
}

export interface CategoryStats {
  correct: number;
  total: number;
}

export interface AISummaryData {
  recentResults: QuizScore[];
  averageScore: number;
  improvementTrend: 'improving' | 'stable' | 'declining';
  practiceFrequency: string;
}

// ============================================
// エラーログ型
// ============================================

export interface LogEntry {
  timestamp: number;
  type: 'error' | 'warn' | 'info';
  message: string;
  args?: unknown[];
}

export interface ErrorLogger {
  logs: LogEntry[];
  maxLogs: number;
}

// ============================================
// 単語辞書エントリ型
// ============================================

export interface WordDictionaryEntry {
  word: string;
  reading?: string;
  meaning?: string;
  grade?: number;
  category?: string;
}
