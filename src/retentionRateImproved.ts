/**
 * 改善版：シンプルで分かりやすい定着率計算
 */

import { logger } from './logger';

interface WordProgress {
  word: string;
  correctCount: number;
  incorrectCount: number;
  consecutiveCorrect: number;
  lastStudied: number;
  masteryLevel: string;
  averageResponseTime?: number;
  difficultyScore?: number;
  totalAttempts: number;
  accuracy: number;
  category?: string;
}

/**
 * 定着レベル（3段階）
 */
export type MasteryTier = 'mastered' | 'learning' | 'struggling';

export interface SimpleMasteryResult {
  tier: MasteryTier;
  displayName: string;
  emoji: string;
  description: string;
}

/**
 * シンプルな定着判定（3段階）
 */
export function getSimpleMasteryTier(wp: WordProgress): SimpleMasteryResult {
  const totalAttempts = wp.correctCount + wp.incorrectCount;
  const accuracy = totalAttempts > 0 ? wp.correctCount / totalAttempts : 0;
  
  // 🟢 完全定着: 連続3回以上正解
  if (wp.consecutiveCorrect >= 3) {
    return {
      tier: 'mastered',
      displayName: '完全定着',
      emoji: '🟢',
      description: `連続${wp.consecutiveCorrect}回正解`
    };
  }
  
  // 🟢 定着: 連続2回正解 + 正答率80%以上
  if (wp.consecutiveCorrect >= 2 && accuracy >= 0.8) {
    return {
      tier: 'mastered',
      displayName: '定着',
      emoji: '🟢',
      description: `連続2回正解・正答率${Math.round(accuracy * 100)}%`
    };
  }
  
  // 🟢 1発定着: 1回目で正解
  if (totalAttempts === 1 && wp.correctCount === 1) {
    return {
      tier: 'mastered',
      displayName: '1発定着',
      emoji: '🟢',
      description: '1回目で正解'
    };
  }
  
  // 🟡 学習中: 正答率50%以上だがまだ定着していない
  if (accuracy >= 0.5) {
    return {
      tier: 'learning',
      displayName: '学習中',
      emoji: '🟡',
      description: `正答率${Math.round(accuracy * 100)}%（あと${2 - wp.consecutiveCorrect}回連続正解で定着）`
    };
  }
  
  // 🔴 要復習: 正答率50%未満
  return {
    tier: 'struggling',
    displayName: '要復習',
    emoji: '🔴',
    description: `正答率${Math.round(accuracy * 100)}%（苦手単語）`
  };
}

/**
 * 詳細な定着率統計
 */
export interface DetailedRetentionStats {
  // 基本統計
  totalWords: number;
  appearedWords: number;
  
  // 段階別カウント
  masteredCount: number;      // 🟢 完全定着
  learningCount: number;       // 🟡 学習中
  strugglingCount: number;     // 🔴 要復習
  
  // 定着率（複数の指標）
  basicRetentionRate: number;      // 基本定着率: 定着数/出題数 (0-100%)
  effectiveRetentionRate: number;  // 実効定着率: 時間減衰考慮 (0-100%)
  weightedRetentionRate: number;   // 加重定着率: 学習中を0.5倍 (0-100%)
  
  // 補修情報
  needsReviewCount: number;    // 補修必要（学習中 + 要復習）
  criticalCount: number;       // 緊急復習（要復習のみ）
  
  // パーセンテージ（表示用）
  masteredPercentage: number;
  learningPercentage: number;
  strugglingPercentage: number;
}

/**
 * 改善版：詳細な定着率計算
 */
export function calculateDetailedRetentionStats(
  wordProgressMap: { [word: string]: WordProgress }
): DetailedRetentionStats {
  const allWords = Object.values(wordProgressMap);
  const appearedWords = allWords.filter(wp => 
    (wp.correctCount + wp.incorrectCount) > 0
  );
  
  let masteredCount = 0;
  let learningCount = 0;
  let strugglingCount = 0;
  let effectiveScore = 0;
  let weightedScore = 0;
  
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  
  appearedWords.forEach(wp => {
    const result = getSimpleMasteryTier(wp);
    
    switch (result.tier) {
      case 'mastered':
        masteredCount++;
        weightedScore += 1.0;
        
        // 時間減衰を計算（30日で約63%減衰）
        const daysSince = (now - wp.lastStudied) / ONE_DAY;
        const decayFactor = Math.exp(-daysSince / 30);
        effectiveScore += decayFactor;
        break;
        
      case 'learning':
        learningCount++;
        weightedScore += 0.5; // 学習中は0.5倍
        break;
        
      case 'struggling':
        strugglingCount++;
        // 要復習は0倍
        break;
    }
  });
  
  const total = appearedWords.length;
  
  return {
    totalWords: allWords.length,
    appearedWords: total,
    
    masteredCount,
    learningCount,
    strugglingCount,
    
    basicRetentionRate: total > 0 ? Math.round((masteredCount / total) * 100) : 0,
    effectiveRetentionRate: total > 0 ? Math.round((effectiveScore / total) * 100) : 0,
    weightedRetentionRate: total > 0 ? Math.round((weightedScore / total) * 100) : 0,
    
    needsReviewCount: learningCount + strugglingCount,
    criticalCount: strugglingCount,
    
    masteredPercentage: total > 0 ? Math.round((masteredCount / total) * 100) : 0,
    learningPercentage: total > 0 ? Math.round((learningCount / total) * 100) : 0,
    strugglingPercentage: total > 0 ? Math.round((strugglingCount / total) * 100) : 0,
  };
}

/**
 * UIに表示する定着率サマリー
 */
export interface RetentionSummary {
  mainRate: number;           // メイン表示用（基本定着率）
  subRates: {
    effective: number;        // 実効定着率（時間考慮）
    weighted: number;         // 加重定着率（学習中を半分評価）
  };
  breakdown: string;          // 内訳テキスト（例: "🟢50% 🟡30% 🔴20%"）
  actionNeeded: string;       // アクション推奨（例: "要復習5語"）
}

/**
 * 表示用サマリーを生成
 */
export function getRetentionSummary(
  wordProgressMap: { [word: string]: WordProgress }
): RetentionSummary {
  const stats = calculateDetailedRetentionStats(wordProgressMap);
  
  // 内訳テキスト
  const breakdown = `🟢${stats.masteredPercentage}% 🟡${stats.learningPercentage}% 🔴${stats.strugglingPercentage}%`;
  
  // アクション推奨
  let actionNeeded = '';
  if (stats.criticalCount > 0) {
    actionNeeded = `緊急復習${stats.criticalCount}語`;
  } else if (stats.needsReviewCount > 0) {
    actionNeeded = `復習推奨${stats.needsReviewCount}語`;
  } else {
    actionNeeded = '良好';
  }
  
  return {
    mainRate: stats.basicRetentionRate,
    subRates: {
      effective: stats.effectiveRetentionRate,
      weighted: stats.weightedRetentionRate,
    },
    breakdown,
    actionNeeded,
  };
}

/**
 * ユーザー様のシナリオ例をテスト
 */
export function testScenario1(): DetailedRetentionStats {
  // 10問やって5問連続正解、5問不正解
  const testProgress: { [word: string]: WordProgress } = {};
  
  // 5問: 連続2回正解（定着）
  for (let i = 1; i <= 5; i++) {
    testProgress[`word${i}`] = {
      word: `word${i}`,
      correctCount: 2,
      incorrectCount: 0,
      consecutiveCorrect: 2,
      lastStudied: Date.now(),
      masteryLevel: 'learning',
      averageResponseTime: 3000,
      difficultyScore: 50,
      totalAttempts: 2,
      accuracy: 1.0,
      category: 'test',
    } as WordProgress;
  }
  
  // 5問: 不正解
  for (let i = 6; i <= 10; i++) {
    testProgress[`word${i}`] = {
      word: `word${i}`,
      correctCount: 0,
      incorrectCount: 2,
      consecutiveCorrect: 0,
      lastStudied: Date.now(),
      masteryLevel: 'learning',
      averageResponseTime: 5000,
      difficultyScore: 80,
      totalAttempts: 2,
      accuracy: 0.0,
      category: 'test',
    } as WordProgress;
  }
  
  return calculateDetailedRetentionStats(testProgress);
}

/**
 * テスト実行例
 */
if (typeof window !== 'undefined') {
  // ブラウザ環境でのみ実行
  (window as any).testRetentionScenario = () => {
    const result = testScenario1();
    logger.log('=== 定着率テスト ===');
    logger.log('シナリオ: 10問やって5問連続正解、5問不正解');
    logger.log('出題単語数:', result.appearedWords);
    logger.log('定着数:', result.masteredCount);
    logger.log('学習中:', result.learningCount);
    logger.log('要復習:', result.strugglingCount);
    logger.log('基本定着率:', result.basicRetentionRate + '%');
    logger.log('内訳: 🟢' + result.masteredPercentage + '% 🟡' + result.learningPercentage + '% 🔴' + result.strugglingPercentage + '%');
    logger.log('期待値: 50% ✅ 実際: ' + result.basicRetentionRate + '%');
  };
}
