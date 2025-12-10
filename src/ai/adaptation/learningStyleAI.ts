/**
 * 個別学習スタイルAI (Learning Style AI)
 * 
 * 目的:
 * - ユーザーの学習パターンを分析し、個別に最適化された学習方法を提案
 * - 時間帯別の学習効率を測定し、最適な学習時間を推奨
 * - セッション長と学習効果の関係を分析し、最適な学習時間を算出
 * 
 * 機能:
 * 1. 時間帯効率分析: 朝/昼/夕/夜の学習効果を測定
 * 2. 最適セッション長: 集中力が持続する時間を特定
 * 3. 学習パターン検出: 短期集中型 vs 分散学習型を判定
 * 4. 個別推奨: ユーザーに最適化された学習プランを提案
 */

import { logger } from '@/logger';

/**
 * セッション統計
 */
export interface SessionStats {
  sessionId: string;
  startTime: number; // timestamp
  endTime: number; // timestamp
  duration: number; // 分
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number; // 0-100%
  averageResponseTime: number; // ミリ秒
  fatigueLevel: number; // 0-100%
  newWordsLearned: number;
  reviewedWords: number;
}

/**
 * 時間帯別パフォーマンス
 */
export interface TimeOfDayPerformance {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  sessionCount: number;
  totalQuestions: number;
  averageAccuracy: number;
  averageResponseTime: number;
  averageFatigue: number;
  efficiencyScore: number; // 0-100: 総合効率スコア
  bestForNewLearning: boolean;
  bestForReview: boolean;
}

/**
 * セッション長分析結果
 */
export interface SessionLengthAnalysis {
  optimalDuration: number; // 分
  currentAverageDuration: number; // 分
  performanceByDuration: Array<{
    durationRange: string; // "0-5", "5-10", "10-15"等
    accuracy: number;
    efficiency: number;
  }>;
  recommendation: string;
}

/**
 * 学習スタイル
 */
export type LearningStyleType = 
  | 'short_burst'      // 短期集中型（5-10分）
  | 'moderate'         // 中程度（10-20分）
  | 'extended'         // 長時間型（20分以上）
  | 'distributed';     // 分散学習型（1日複数回）

/**
 * 学習スタイルプロファイル
 */
export interface LearningStyleProfile {
  userId: string;
  primaryStyle: LearningStyleType;
  secondaryStyle?: LearningStyleType;
  bestTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  optimalSessionLength: number; // 分
  optimalDailyFrequency: number; // 1日あたりの推奨セッション数
  strengths: string[];
  improvements: string[];
  personalizedRecommendations: string[];
}

/**
 * 学習効率指標
 */
export interface LearningEfficiencyMetrics {
  overallEfficiency: number; // 0-100
  timeEfficiency: number; // 時間あたりの習得単語数
  retentionRate: number; // 復習時の正答率
  learningVelocity: number; // 新規単語の習得速度
  consistencyScore: number; // 学習の一貫性
}

/**
 * 時間帯を判定
 */
export function getTimeOfDay(timestamp: number = Date.now()): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date(timestamp).getHours();
  
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * セッション統計を記録
 */
export function recordSessionStats(
  startTime: number,
  endTime: number,
  questionsAnswered: number,
  correctAnswers: number,
  averageResponseTime: number,
  fatigueLevel: number,
  newWordsLearned: number,
  reviewedWords: number
): SessionStats {
  const duration = (endTime - startTime) / (1000 * 60); // 分
  const accuracy = questionsAnswered > 0 ? (correctAnswers / questionsAnswered) * 100 : 0;
  
  return {
    sessionId: `session_${startTime}`,
    startTime,
    endTime,
    duration,
    timeOfDay: getTimeOfDay(startTime),
    questionsAnswered,
    correctAnswers,
    accuracy,
    averageResponseTime,
    fatigueLevel,
    newWordsLearned,
    reviewedWords
  };
}

/**
 * 時間帯別パフォーマンスを分析
 */
export function analyzeTimeOfDayPerformance(
  sessions: SessionStats[]
): TimeOfDayPerformance[] {
  const timeSlots: Array<'morning' | 'afternoon' | 'evening' | 'night'> = 
    ['morning', 'afternoon', 'evening', 'night'];
  
  return timeSlots.map(timeOfDay => {
    const timeSessions = sessions.filter(s => s.timeOfDay === timeOfDay);
    
    if (timeSessions.length === 0) {
      return {
        timeOfDay,
        sessionCount: 0,
        totalQuestions: 0,
        averageAccuracy: 0,
        averageResponseTime: 0,
        averageFatigue: 0,
        efficiencyScore: 0,
        bestForNewLearning: false,
        bestForReview: false
      };
    }
    
    const totalQuestions = timeSessions.reduce((sum, s) => sum + s.questionsAnswered, 0);
    const totalCorrect = timeSessions.reduce((sum, s) => sum + s.correctAnswers, 0);
    const averageAccuracy = (totalCorrect / totalQuestions) * 100;
    const averageResponseTime = timeSessions.reduce((sum, s) => sum + s.averageResponseTime, 0) / timeSessions.length;
    const averageFatigue = timeSessions.reduce((sum, s) => sum + s.fatigueLevel, 0) / timeSessions.length;
    const totalNewWords = timeSessions.reduce((sum, s) => sum + s.newWordsLearned, 0);
    const totalReviewWords = timeSessions.reduce((sum, s) => sum + s.reviewedWords, 0);
    
    // 効率スコア = 正答率(40%) + 応答速度(30%) + 低疲労度(30%)
    const accuracyScore = averageAccuracy;
    const speedScore = Math.max(0, 100 - (averageResponseTime / 50)); // 5秒以下が理想
    const fatigueScore = 100 - averageFatigue;
    const efficiencyScore = (accuracyScore * 0.4) + (speedScore * 0.3) + (fatigueScore * 0.3);
    
    return {
      timeOfDay,
      sessionCount: timeSessions.length,
      totalQuestions,
      averageAccuracy,
      averageResponseTime,
      averageFatigue,
      efficiencyScore,
      bestForNewLearning: totalNewWords > totalReviewWords,
      bestForReview: totalReviewWords >= totalNewWords
    };
  }).sort((a, b) => b.efficiencyScore - a.efficiencyScore);
}

/**
 * セッション長と効率の関係を分析
 */
export function analyzeSessionLength(
  sessions: SessionStats[]
): SessionLengthAnalysis {
  if (sessions.length === 0) {
    return {
      optimalDuration: 15,
      currentAverageDuration: 0,
      performanceByDuration: [],
      recommendation: '学習データが不足しています。まずは15分程度のセッションから始めてみましょう。'
    };
  }
  
  const currentAverageDuration = sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length;
  
  // 5分刻みでグループ化
  const durationRanges = [
    { min: 0, max: 5, label: '0-5分' },
    { min: 5, max: 10, label: '5-10分' },
    { min: 10, max: 15, label: '10-15分' },
    { min: 15, max: 20, label: '15-20分' },
    { min: 20, max: 30, label: '20-30分' },
    { min: 30, max: 999, label: '30分以上' }
  ];
  
  const performanceByDuration = durationRanges.map(range => {
    const rangeSessions = sessions.filter(s => 
      s.duration >= range.min && s.duration < range.max
    );
    
    if (rangeSessions.length === 0) {
      return {
        durationRange: range.label,
        accuracy: 0,
        efficiency: 0
      };
    }
    
    const avgAccuracy = rangeSessions.reduce((sum, s) => sum + s.accuracy, 0) / rangeSessions.length;
    const avgFatigue = rangeSessions.reduce((sum, s) => sum + s.fatigueLevel, 0) / rangeSessions.length;
    const efficiency = avgAccuracy - (avgFatigue * 0.5); // 疲労を考慮
    
    return {
      durationRange: range.label,
      accuracy: avgAccuracy,
      efficiency
    };
  }).filter(p => p.efficiency > 0);
  
  // 最高効率の時間帯を特定
  const bestRange = performanceByDuration.reduce((best, current) => 
    current.efficiency > best.efficiency ? current : best
  , performanceByDuration[0] || { durationRange: '10-15分', efficiency: 0 });
  
  // 最適時間を算出
  const optimalDuration = bestRange ? 
    parseInt(bestRange.durationRange.split('-')[0]) + 5 : 15;
  
  // 推奨メッセージ
  let recommendation = '';
  if (optimalDuration < 10) {
    recommendation = `短期集中型の学習が効果的です。${optimalDuration}分程度の短いセッションを1日複数回行うことをお勧めします。`;
  } else if (optimalDuration < 20) {
    recommendation = `${optimalDuration}分程度のセッションが最も効率的です。この長さを目安に学習を続けましょう。`;
  } else {
    recommendation = `長時間の学習が得意なようです。${optimalDuration}分程度のセッションで深い学習ができます。ただし、疲労に注意しましょう。`;
  }
  
  return {
    optimalDuration,
    currentAverageDuration,
    performanceByDuration,
    recommendation
  };
}

/**
 * 学習スタイルを判定
 */
export function determineLearningStyle(
  sessions: SessionStats[]
): LearningStyleType {
  if (sessions.length < 5) {
    return 'moderate'; // デフォルト
  }
  
  const avgDuration = sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length;
  
  // 1日あたりのセッション数を計算
  const dates = new Set(sessions.map(s => new Date(s.startTime).toDateString()));
  const avgSessionsPerDay = sessions.length / dates.size;
  
  if (avgDuration < 10 && avgSessionsPerDay >= 2) {
    return 'distributed'; // 分散学習型
  } else if (avgDuration < 10) {
    return 'short_burst'; // 短期集中型
  } else if (avgDuration < 20) {
    return 'moderate'; // 中程度
  } else {
    return 'extended'; // 長時間型
  }
}

/**
 * 学習スタイルプロファイルを生成
 */
export function generateLearningStyleProfile(
  userId: string,
  sessions: SessionStats[]
): LearningStyleProfile {
  const primaryStyle = determineLearningStyle(sessions);
  const timePerformance = analyzeTimeOfDayPerformance(sessions);
  const sessionLengthAnalysis = analyzeSessionLength(sessions);
  
  const bestTimeOfDay = timePerformance[0]?.timeOfDay || 'morning';
  const optimalSessionLength = sessionLengthAnalysis.optimalDuration;
  
  // 1日あたりの推奨セッション数
  let optimalDailyFrequency = 1;
  if (primaryStyle === 'distributed' || primaryStyle === 'short_burst') {
    optimalDailyFrequency = 3;
  } else if (primaryStyle === 'moderate') {
    optimalDailyFrequency = 2;
  }
  
  // 強み・改善点の特定
  const strengths: string[] = [];
  const improvements: string[] = [];
  
  if (timePerformance[0]?.averageAccuracy > 80) {
    strengths.push(`${timePerformance[0].timeOfDay}の学習が得意（正答率${timePerformance[0].averageAccuracy.toFixed(0)}%）`);
  }
  
  if (primaryStyle === 'distributed') {
    strengths.push('分散学習により記憶の定着が良好');
  } else if (primaryStyle === 'extended') {
    strengths.push('長時間の集中学習が可能');
  }
  
  const avgFatigue = sessions.reduce((sum, s) => sum + s.fatigueLevel, 0) / sessions.length;
  if (avgFatigue > 60) {
    improvements.push('疲労レベルが高め。休憩を増やすか、セッション時間を短縮してみましょう');
  }
  
  if (timePerformance[timePerformance.length - 1]?.averageAccuracy < 60) {
    improvements.push(`${timePerformance[timePerformance.length - 1].timeOfDay}の学習効率が低いため、避けることを推奨`);
  }
  
  // 個別推奨
  const personalizedRecommendations: string[] = [];
  
  personalizedRecommendations.push(
    `最適な学習時間帯: ${bestTimeOfDay === 'morning' ? '朝' : 
     bestTimeOfDay === 'afternoon' ? '午後' : 
     bestTimeOfDay === 'evening' ? '夕方' : '夜'}`
  );
  
  personalizedRecommendations.push(
    `推奨セッション長: ${optimalSessionLength}分`
  );
  
  personalizedRecommendations.push(
    `1日の推奨学習回数: ${optimalDailyFrequency}回`
  );
  
  if (primaryStyle === 'distributed') {
    personalizedRecommendations.push(
      '短い学習を複数回行うスタイルが効果的です。朝・昼・夜に分けて学習しましょう'
    );
  } else if (primaryStyle === 'extended') {
    personalizedRecommendations.push(
      '長時間の学習が得意です。週末などにまとめて学習する方法も有効です'
    );
  }
  
  return {
    userId,
    primaryStyle,
    bestTimeOfDay,
    optimalSessionLength,
    optimalDailyFrequency,
    strengths,
    improvements,
    personalizedRecommendations
  };
}

/**
 * 学習効率指標を計算
 */
export function calculateLearningEfficiency(
  sessions: SessionStats[]
): LearningEfficiencyMetrics {
  if (sessions.length === 0) {
    return {
      overallEfficiency: 0,
      timeEfficiency: 0,
      retentionRate: 0,
      learningVelocity: 0,
      consistencyScore: 0
    };
  }
  
  // 全体効率
  const avgAccuracy = sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length;
  const avgFatigue = sessions.reduce((sum, s) => sum + s.fatigueLevel, 0) / sessions.length;
  const overallEfficiency = avgAccuracy - (avgFatigue * 0.3);
  
  // 時間効率（1時間あたりの新規単語習得数）
  const totalNewWords = sessions.reduce((sum, s) => sum + s.newWordsLearned, 0);
  const totalHours = sessions.reduce((sum, s) => sum + s.duration, 0) / 60;
  const timeEfficiency = totalHours > 0 ? totalNewWords / totalHours : 0;
  
  // 復習時の保持率
  const reviewSessions = sessions.filter(s => s.reviewedWords > 0);
  const retentionRate = reviewSessions.length > 0
    ? reviewSessions.reduce((sum, s) => sum + s.accuracy, 0) / reviewSessions.length
    : avgAccuracy;
  
  // 学習速度
  const recentSessions = sessions.slice(-10);
  const recentNewWords = recentSessions.reduce((sum, s) => sum + s.newWordsLearned, 0);
  const learningVelocity = recentSessions.length > 0 ? recentNewWords / recentSessions.length : 0;
  
  // 一貫性スコア（学習頻度の安定性）
  // 過去30日間での学習日数
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const recentDates = sessions
    .filter(s => s.startTime >= thirtyDaysAgo)
    .map(s => new Date(s.startTime).toDateString());
  const recentUniqueDates = new Set(recentDates);
  const consistencyScore = (recentUniqueDates.size / 30) * 100;
  
  return {
    overallEfficiency,
    timeEfficiency,
    retentionRate,
    learningVelocity,
    consistencyScore
  };
}

/**
 * セッション履歴をローカルストレージに保存
 */
export function saveSessionToHistory(session: SessionStats): void {
  try {
    const key = 'learning-style-sessions';
    const stored = localStorage.getItem(key);
    const sessions: SessionStats[] = stored ? JSON.parse(stored) : [];
    
    sessions.push(session);
    
    // 最新100セッションのみ保持
    const trimmed = sessions.slice(-100);
    
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch (error) {
    logger.error('Failed to save session history:', error);
  }
}

/**
 * セッション履歴を読み込み
 */
export function loadSessionHistory(): SessionStats[] {
  try {
    const key = 'learning-style-sessions';
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    logger.error('Failed to load session history:', error);
    return [];
  }
}

/**
 * 学習推奨メッセージを生成
 */
export function generateRecommendationMessage(
  profile: LearningStyleProfile,
  currentTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
): string {
  const isBestTime = currentTimeOfDay === profile.bestTimeOfDay;
  
  const timeNames = {
    morning: '朝',
    afternoon: '午後',
    evening: '夕方',
    night: '夜'
  };
  
  if (isBestTime) {
    return `✨ 今は${timeNames[currentTimeOfDay]}です。あなたの最も学習効率が高い時間帯です！${profile.optimalSessionLength}分程度の学習をお勧めします。`;
  } else {
    return `💡 ${timeNames[profile.bestTimeOfDay]}の学習が最も効果的です。現在は${timeNames[currentTimeOfDay]}なので、軽めの復習が良いでしょう。`;
  }
}
