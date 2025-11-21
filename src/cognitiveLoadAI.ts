/**
 * 認知負荷管理AI - セッション内の疲労度と集中力を監視し、最適な学習環境を提供
 * 
 * 主要機能:
 * 1. リアルタイム疲労度検出（応答時間、正答率の変化）
 * 2. 適応的難易度調整（疲労時は簡単な問題、集中時は難問）
 * 3. 時間帯別最適化（朝: 新規学習、夜: 復習）
 * 4. 休憩推奨アルゴリズム
 */

import { QuestionPriority } from './learningCurveAI';

/**
 * 認知負荷モニター
 */
export interface CognitiveLoadMonitor {
  // 疲労度（0-100）
  fatigueLevel: number;
  
  // 集中力レベル（0-100）
  concentrationLevel: number;
  
  // 直近のパフォーマンス
  recentPerformance: {
    last5Accuracy: number; // 直近5問の正答率
    last10Accuracy: number; // 直近10問の正答率
    isDecreasing: boolean; // 正答率が下降傾向か
    averageResponseTime: number; // 平均応答時間
  };
  
  // セッション統計
  sessionStats: {
    duration: number; // セッション時間（分）
    questionsAnswered: number; // 回答数
    correctCount: number; // 正解数
    startTime: number; // 開始時刻（タイムスタンプ）
  };
  
  // 休憩推奨
  breakRecommendation?: {
    shouldBreak: boolean;
    reason: string;
    suggestedDuration: number; // 分
  };
  
  // 時間帯
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

/**
 * セッション応答記録
 */
export interface SessionResponse {
  timestamp: number;
  wasCorrect: boolean;
  responseTime: number; // ミリ秒
  questionDifficulty: number; // 推定難易度（0-1）
}

/**
 * 認知負荷を計算
 */
export function calculateCognitiveLoad(
  responses: SessionResponse[],
  sessionStartTime: number
): CognitiveLoadMonitor {
  const now = Date.now();
  const sessionDuration = (now - sessionStartTime) / (1000 * 60); // 分
  
  // 直近のパフォーマンス分析
  const last5 = responses.slice(-5);
  const last10 = responses.slice(-10);
  
  const last5Accuracy = last5.length > 0 
    ? (last5.filter(r => r.wasCorrect).length / last5.length) * 100 
    : 100;
  
  const last10Accuracy = last10.length > 0 
    ? (last10.filter(r => r.wasCorrect).length / last10.length) * 100 
    : 100;
  
  // 正答率が下降傾向か判定
  const isDecreasing = last10Accuracy - last5Accuracy > 10;
  
  // 平均応答時間
  const averageResponseTime = responses.length > 0
    ? responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length
    : 3000;
  
  // 直近の応答時間の変化（疲労の兆候）
  const recentResponseTimes = responses.slice(-5).map(r => r.responseTime);
  const responseTimeIncrease = calculateTrend(recentResponseTimes);
  
  // 疲労度を計算（複数要素から総合判定）
  let fatigueLevel = 0;
  
  // 1. セッション時間（長時間学習で疲労増加）
  fatigueLevel += Math.min(40, sessionDuration * 2); // 20分で40pt
  
  // 2. 正答率の下降（疲労の強い兆候）
  if (isDecreasing) {
    fatigueLevel += 25;
  }
  
  // 3. 応答時間の増加（集中力低下）
  if (responseTimeIncrease > 1.3) { // 30%以上増加
    fatigueLevel += 20;
  }
  
  // 4. 連続誤答（疲労または理解不足）
  const recentErrors = responses.slice(-3).filter(r => !r.wasCorrect).length;
  if (recentErrors >= 2) {
    fatigueLevel += 15;
  }
  
  // 0-100に正規化
  fatigueLevel = Math.min(100, Math.max(0, fatigueLevel));
  
  // 集中力レベル（疲労度の逆）
  const concentrationLevel = 100 - fatigueLevel;
  
  // 時間帯を判定
  const hour = new Date().getHours();
  let timeOfDay: CognitiveLoadMonitor['timeOfDay'];
  if (hour >= 6 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
  else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
  else timeOfDay = 'night';
  
  // 休憩推奨を判定
  const breakRecommendation = determineBreakRecommendation(
    fatigueLevel,
    sessionDuration,
    isDecreasing
  );
  
  return {
    fatigueLevel,
    concentrationLevel,
    recentPerformance: {
      last5Accuracy,
      last10Accuracy,
      isDecreasing,
      averageResponseTime
    },
    sessionStats: {
      duration: sessionDuration,
      questionsAnswered: responses.length,
      correctCount: responses.filter(r => r.wasCorrect).length,
      startTime: sessionStartTime
    },
    breakRecommendation,
    timeOfDay
  };
}

/**
 * トレンドを計算（増加傾向 > 1, 減少傾向 < 1）
 */
function calculateTrend(values: number[]): number {
  if (values.length < 2) return 1;
  
  const recent = values.slice(-3);
  const earlier = values.slice(0, Math.max(1, values.length - 3));
  
  const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
  const earlierAvg = earlier.reduce((sum, v) => sum + v, 0) / earlier.length;
  
  return earlierAvg > 0 ? recentAvg / earlierAvg : 1;
}

/**
 * 休憩推奨を判定
 */
function determineBreakRecommendation(
  fatigueLevel: number,
  sessionDuration: number,
  isDecreasing: boolean
): CognitiveLoadMonitor['breakRecommendation'] {
  // 高疲労状態
  if (fatigueLevel >= 70) {
    return {
      shouldBreak: true,
      reason: '疲労が蓄積しています。5分休憩して集中力を回復しましょう。',
      suggestedDuration: 5
    };
  }
  
  // 長時間学習
  if (sessionDuration >= 25 && fatigueLevel >= 50) {
    return {
      shouldBreak: true,
      reason: '25分経過しました。短い休憩で効率がアップします。',
      suggestedDuration: 5
    };
  }
  
  // 正答率低下
  if (isDecreasing && fatigueLevel >= 40) {
    return {
      shouldBreak: true,
      reason: '正答率が下がっています。一度リフレッシュしましょう。',
      suggestedDuration: 3
    };
  }
  
  return undefined;
}

/**
 * 認知負荷に応じた難易度調整
 */
export function adjustDifficultyByCognitiveLoad(
  priorities: QuestionPriority[],
  cognitiveLoad: CognitiveLoadMonitor
): QuestionPriority[] {
  const { fatigueLevel, concentrationLevel, timeOfDay, sessionStats } = cognitiveLoad;
  
  console.log(`🧠 認知負荷AI: 疲労度${fatigueLevel}%, 集中力${concentrationLevel}%, 時間帯: ${timeOfDay}`);
  
  // 高疲労時: 簡単な復習問題を優先
  if (fatigueLevel >= 70) {
    console.log('  💤 疲労度高: 簡単な復習問題を優先');
    return priorities
      .filter(p => p.estimatedSuccessRate >= 70 || p.strategy === 'spaced_repetition')
      .map(p => ({
        ...p,
        priority: p.priority + (p.estimatedSuccessRate >= 80 ? 20 : 0),
        reason: p.reason + ' (疲労時・易問優先)'
      }));
  }
  
  // 中程度疲労: バランス重視
  if (fatigueLevel >= 40) {
    console.log('  😐 疲労度中: バランス重視');
    return priorities.map(p => {
      // 極端に難しい問題を避ける
      if (p.estimatedSuccessRate < 40) {
        return { ...p, priority: p.priority - 20 };
      }
      return p;
    });
  }
  
  // 高集中時: 新規学習と難問を投入
  if (concentrationLevel >= 70 && sessionStats.duration < 15) {
    console.log('  ⚡ 集中力高: 新規単語・難問を優先');
    
    return priorities.map(p => {
      // 新規学習を優先
      if (p.strategy === 'new_learning') {
        return { ...p, priority: p.priority + 30, reason: p.reason + ' (集中時・新規優先)' };
      }
      
      // 苦戦中の単語も優先（定着のチャンス）
      if (p.strategy === 'immediate_review' && p.estimatedSuccessRate < 60) {
        return { ...p, priority: p.priority + 20, reason: p.reason + ' (集中時・難問挑戦)' };
      }
      
      return p;
    });
  }
  
  // 通常時: 時間帯に応じた最適化
  return adjustByTimeOfDay(priorities, timeOfDay);
}

/**
 * 時間帯に応じた出題調整
 */
function adjustByTimeOfDay(
  priorities: QuestionPriority[],
  timeOfDay: CognitiveLoadMonitor['timeOfDay']
): QuestionPriority[] {
  switch (timeOfDay) {
    case 'morning':
      // 朝: 新規学習と重要単語
      console.log('  🌅 朝: 新規学習を優先');
      return priorities.map(p => {
        if (p.strategy === 'new_learning') {
          return { ...p, priority: p.priority + 15, reason: p.reason + ' (朝・新規最適)' };
        }
        return p;
      });
      
    case 'afternoon':
      // 午後: バランス型
      console.log('  ☀️ 午後: バランス型');
      return priorities;
      
    case 'evening':
      // 夕方: 復習中心
      console.log('  🌆 夕方: 復習中心');
      return priorities.map(p => {
        if (p.strategy === 'spaced_repetition' || p.strategy === 'consolidation') {
          return { ...p, priority: p.priority + 10, reason: p.reason + ' (夕方・復習最適)' };
        }
        return p;
      });
      
    case 'night':
      // 夜: 軽い復習のみ（新規学習は避ける）
      console.log('  🌙 夜: 軽い復習のみ');
      return priorities
        .filter(p => p.strategy !== 'new_learning' || p.estimatedSuccessRate >= 60)
        .map(p => {
          if (p.estimatedSuccessRate >= 70) {
            return { ...p, priority: p.priority + 15, reason: p.reason + ' (夜・復習推奨)' };
          }
          return p;
        });
      
    default:
      return priorities;
  }
}

/**
 * 疲労度メッセージを生成
 */
export function generateFatigueMessage(cognitiveLoad: CognitiveLoadMonitor): string {
  const { fatigueLevel, breakRecommendation } = cognitiveLoad;
  
  if (breakRecommendation?.shouldBreak) {
    return `💡 ${breakRecommendation.reason}`;
  }
  
  if (fatigueLevel >= 60) {
    return '😌 少し疲れてきたかも。無理せずマイペースで！';
  }
  
  if (fatigueLevel <= 20) {
    return '✨ 集中力バッチリ！この調子で頑張ろう！';
  }
  
  return '';
}

/**
 * 学習効率スコアを計算
 */
export function calculateLearningEfficiency(cognitiveLoad: CognitiveLoadMonitor): number {
  const { concentrationLevel, recentPerformance } = cognitiveLoad;
  
  // 集中力 × 正答率で効率を算出
  const efficiency = (concentrationLevel / 100) * (recentPerformance.last5Accuracy / 100);
  
  return Math.round(efficiency * 100);
}
