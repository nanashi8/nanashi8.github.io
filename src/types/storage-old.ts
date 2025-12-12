/**
 * ストレージ関連型定義
 * データ永続化、進捗管理に関する型
 */

import type { Question } from './domain';

// 学習プランの型（期間調整可能）
export interface LearningSchedule {
  userId: string;
  startDate: number;
  currentDay: number;
  totalDays: number; // 30, 60, 90, 180など
  planDurationMonths: number; // 1, 2, 3, 6ヶ月など
  phase: 1 | 2 | 3;
  
  dailyGoals: {
    newWords: number;
    reviewWords: number;
    timeMinutes: number;
  };
  
  weeklyProgress: {
    week: number;
    wordsLearned: number;
    wordsReviewed: number;
    averageAccuracy: number;
    completionRate: number;
  }[];
  
  milestones: {
    day: number;
    title: string;
    wordsTarget: number;
    achieved: boolean;
  }[];
}

export interface DailyStudyPlan {
  date: number;
  dayNumber: number;
  phase: 1 | 2 | 3;
  
  morning: {
    newWords: Question[];
    duration: number;
    mode: 'discovery';
  };
  
  afternoon: {
    reviewWords: Question[];
    duration: number;
    mode: 'weakness';
  };
  
  evening: {
    mixedWords: Question[];
    duration: number;
    mode: 'mixed';
  };
  
  completed: boolean;
  actualAccuracy: number;
}
