/**
 * 学習曲線AI - 個別単語の学習パターンを分析し、最適な出題順序を決定
 * 
 * 主要機能:
 * 1. 間違いパターンの分析（混同しやすい単語、応答時間、連続間違い）
 * 2. 学習曲線の追跡（正答率の推移、記憶定着の安定性）
 * 3. 次回正答確率の予測
 * 4. 定着転換を目指した戦略的出題
 */

import { Question } from './types';
import { WordProgress } from './progressStorage';

/**
 * 単語の学習履歴（時系列）
 */
export interface WordLearningHistory {
  word: string;
  attempts: LearningAttempt[];
  confusedWith: ConfusionPattern[];
  learningCurve: LearningCurveData;
  predictionModel: PredictionModel;
}

/**
 * 個別の学習試行記録
 */
export interface LearningAttempt {
  timestamp: number;
  wasCorrect: boolean;
  responseTime: number; // ミリ秒
  userAnswer?: string; // 実際の回答
  confidenceLevel: 'instant' | 'hesitant' | 'guessed'; // 応答速度から推定
  sessionContext: {
    questionIndex: number; // セッション内の何問目か
    previousQuestions: string[]; // 直前3問の単語
    sessionFatigue: number; // 0-1: セッション内の疲労度
  };
}

/**
 * 混同パターン
 */
export interface ConfusionPattern {
  confusedWord: string; // 混同した単語
  frequency: number; // 混同回数
  lastConfusion: number; // 最終混同日時
  confusionType: 'spelling' | 'meaning' | 'pronunciation'; // 混同タイプ
  similarity: number; // 類似度 0-1
}

/**
 * 学習曲線データ
 */
export interface LearningCurveData {
  // 正答率の推移（時系列）
  accuracyHistory: Array<{ timestamp: number; accuracy: number }>;
  
  // 記憶定着の安定性（標準偏差が小さいほど安定）
  stabilityScore: number; // 0-100
  
  // 学習段階
  stage: 'initial' | 'struggling' | 'improving' | 'consolidating' | 'mastered';
  
  // 忘却パターン
  forgettingPattern: {
    typicalDecayDays: number; // 通常の忘却日数
    lastForgetDate?: number; // 最終忘却日時
    forgettingCount: number; // 忘却回数
  };
  
  // 学習効率
  efficiency: {
    attemptsToMastery: number; // 定着までの試行回数（推定）
    currentProgress: number; // 0-100%
    estimatedDaysToMastery: number; // 定着までの推定日数
  };
}

/**
 * 予測モデル
 */
export interface PredictionModel {
  // 次回正答確率（0-100%）
  nextCorrectProbability: number;
  
  // 予測根拠
  predictors: {
    recentAccuracy: number; // 直近5回の正答率
    stabilityFactor: number; // 安定性
    timeSinceLastStudy: number; // 最終学習からの経過時間（日数）
    confusionRisk: number; // 混同リスク（0-1）
  };
  
  // 信頼度
  confidence: number; // 0-1
}

/**
 * 出題優先度スコア
 */
export interface QuestionPriority {
  word: string;
  priority: number; // 高いほど優先（0-100）
  reason: string;
  strategy: 'immediate_review' | 'spaced_repetition' | 'confusion_resolution' | 'consolidation' | 'new_learning';
  estimatedSuccessRate: number; // この出題での成功予測率
  learningImpact: number; // 学習効果の期待値（0-100）
}

/**
 * 学習履歴を分析
 */
export function analyzeLearningHistory(
  word: string,
  wordProgress: WordProgress,
  allAttempts: LearningAttempt[]
): WordLearningHistory {
  // 学習曲線を計算
  const learningCurve = calculateLearningCurve(allAttempts);
  
  // 混同パターンを抽出
  const confusedWith = extractConfusionPatterns(allAttempts);
  
  // 予測モデルを構築
  const predictionModel = buildPredictionModel(wordProgress, allAttempts, learningCurve);
  
  return {
    word,
    attempts: allAttempts,
    confusedWith,
    learningCurve,
    predictionModel
  };
}

/**
 * 学習曲線を計算
 */
function calculateLearningCurve(attempts: LearningAttempt[]): LearningCurveData {
  if (attempts.length === 0) {
    return {
      accuracyHistory: [],
      stabilityScore: 0,
      stage: 'initial',
      forgettingPattern: {
        typicalDecayDays: 7,
        forgettingCount: 0
      },
      efficiency: {
        attemptsToMastery: 10,
        currentProgress: 0,
        estimatedDaysToMastery: 30
      }
    };
  }
  
  // 正答率の推移を計算（5問ごとの移動平均）
  const accuracyHistory: Array<{ timestamp: number; accuracy: number }> = [];
  const windowSize = 5;
  
  for (let i = 0; i < attempts.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = attempts.slice(start, i + 1);
    const accuracy = (window.filter(a => a.wasCorrect).length / window.length) * 100;
    
    accuracyHistory.push({
      timestamp: attempts[i].timestamp,
      accuracy
    });
  }
  
  // 安定性スコア（直近10回の正答率の標準偏差から計算）
  const recentAttempts = attempts.slice(-10);
  const recentAccuracies = recentAttempts.map((_, i) => {
    const start = Math.max(0, recentAttempts.length - 5);
    const window = recentAttempts.slice(start, i + 1);
    return (window.filter(a => a.wasCorrect).length / window.length) * 100;
  });
  
  const mean = recentAccuracies.reduce((sum, acc) => sum + acc, 0) / recentAccuracies.length;
  const variance = recentAccuracies.reduce((sum, acc) => sum + Math.pow(acc - mean, 2), 0) / recentAccuracies.length;
  const stdDev = Math.sqrt(variance);
  
  // 標準偏差が小さいほど安定（0-30の範囲を0-100に変換）
  const stabilityScore = Math.max(0, Math.min(100, 100 - (stdDev / 30 * 100)));
  
  // 学習段階を判定
  const recentCorrectRate = recentAttempts.filter(a => a.wasCorrect).length / recentAttempts.length;
  let stage: LearningCurveData['stage'];
  
  if (attempts.length < 3) {
    stage = 'initial';
  } else if (recentCorrectRate < 0.3) {
    stage = 'struggling';
  } else if (recentCorrectRate < 0.7 && stabilityScore < 50) {
    stage = 'improving';
  } else if (recentCorrectRate >= 0.7 && stabilityScore >= 50) {
    stage = 'consolidating';
  } else if (recentCorrectRate >= 0.9 && stabilityScore >= 80) {
    stage = 'mastered';
  } else {
    stage = 'improving';
  }
  
  // 忘却パターンの分析
  const incorrectAttempts = attempts.filter(a => !a.wasCorrect);
  const forgettingCount = incorrectAttempts.length;
  let typicalDecayDays = 7;
  
  if (incorrectAttempts.length >= 2) {
    const intervals = [];
    for (let i = 1; i < incorrectAttempts.length; i++) {
      const days = (incorrectAttempts[i].timestamp - incorrectAttempts[i - 1].timestamp) / (1000 * 60 * 60 * 24);
      intervals.push(days);
    }
    typicalDecayDays = intervals.reduce((sum, d) => sum + d, 0) / intervals.length;
  }
  
  // 学習効率の計算
  const currentProgress = Math.min(100, (recentCorrectRate * 100 + stabilityScore) / 2);
  const attemptsToMastery = attempts.length < 5 ? 10 : Math.ceil(10 / (currentProgress / 100));
  const estimatedDaysToMastery = Math.max(1, Math.ceil((100 - currentProgress) / 5));
  
  return {
    accuracyHistory,
    stabilityScore,
    stage,
    forgettingPattern: {
      typicalDecayDays,
      lastForgetDate: incorrectAttempts.length > 0 ? incorrectAttempts[incorrectAttempts.length - 1].timestamp : undefined,
      forgettingCount
    },
    efficiency: {
      attemptsToMastery,
      currentProgress,
      estimatedDaysToMastery
    }
  };
}

/**
 * 混同パターンを抽出（実際のユーザー回答から）
 */
function extractConfusionPatterns(attempts: LearningAttempt[]): ConfusionPattern[] {
  const confusionMap = new Map<string, ConfusionPattern>();
  
  attempts.forEach(attempt => {
    if (!attempt.wasCorrect && attempt.userAnswer) {
      const key = attempt.userAnswer;
      
      if (confusionMap.has(key)) {
        const pattern = confusionMap.get(key)!;
        pattern.frequency++;
        pattern.lastConfusion = attempt.timestamp;
      } else {
        confusionMap.set(key, {
          confusedWord: attempt.userAnswer,
          frequency: 1,
          lastConfusion: attempt.timestamp,
          confusionType: 'meaning', // 簡易実装
          similarity: 0.7 // 簡易実装
        });
      }
    }
  });
  
  return Array.from(confusionMap.values())
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5); // 上位5つ
}

/**
 * 予測モデルを構築
 */
function buildPredictionModel(
  _wordProgress: WordProgress,
  attempts: LearningAttempt[],
  learningCurve: LearningCurveData
): PredictionModel {
  // 直近5回の正答率
  const recent5 = attempts.slice(-5);
  const recentAccuracy = recent5.length > 0 
    ? (recent5.filter(a => a.wasCorrect).length / recent5.length) * 100 
    : 50;
  
  // 安定性ファクター
  const stabilityFactor = learningCurve.stabilityScore / 100;
  
  // 最終学習からの経過時間
  const timeSinceLastStudy = attempts.length > 0
    ? (Date.now() - attempts[attempts.length - 1].timestamp) / (1000 * 60 * 60 * 24)
    : 0;
  
  // 混同リスク（直近の混同頻度）
  const recentConfusions = attempts.slice(-10).filter(a => !a.wasCorrect && a.userAnswer);
  const confusionRisk = Math.min(1, recentConfusions.length / 5);
  
  // 次回正答確率を計算
  // 基本確率: 直近の正答率
  let probability = recentAccuracy;
  
  // 安定性ボーナス
  probability += stabilityFactor * 20;
  
  // 時間経過によるペナルティ（忘却曲線）
  const decayFactor = Math.exp(-timeSinceLastStudy / learningCurve.forgettingPattern.typicalDecayDays);
  probability *= decayFactor;
  
  // 混同リスクペナルティ
  probability -= confusionRisk * 30;
  
  // 0-100に正規化
  probability = Math.max(0, Math.min(100, probability));
  
  // 信頼度（データ量に基づく）
  const confidence = Math.min(1, attempts.length / 10);
  
  return {
    nextCorrectProbability: probability,
    predictors: {
      recentAccuracy,
      stabilityFactor,
      timeSinceLastStudy,
      confusionRisk
    },
    confidence
  };
}

/**
 * 全単語の出題優先度を計算
 */
export function calculateQuestionPriorities(
  questions: Question[],
  wordProgressMap: { [word: string]: WordProgress },
  learningHistories: Map<string, WordLearningHistory>
): QuestionPriority[] {
  const priorities: QuestionPriority[] = [];
  
  questions.forEach(question => {
    const wordProgress = wordProgressMap[question.word];
    const history = learningHistories.get(question.word);
    
    const priority = calculateSingleWordPriority(question, wordProgress, history);
    priorities.push(priority);
  });
  
  // 優先度順にソート
  return priorities.sort((a, b) => b.priority - a.priority);
}

/**
 * 個別単語の優先度を計算
 */
function calculateSingleWordPriority(
  question: Question,
  _wordProgress: WordProgress | undefined,
  history: WordLearningHistory | undefined
): QuestionPriority {
  // 未学習の単語
  if (!_wordProgress || !history) {
    return {
      word: question.word,
      priority: 50, // 中程度の優先度
      reason: '新規単語',
      strategy: 'new_learning',
      estimatedSuccessRate: 50,
      learningImpact: 60
    };
  }
  
  const curve = history.learningCurve;
  const prediction = history.predictionModel;
  
  // 学習段階に応じた戦略
  switch (curve.stage) {
    case 'struggling':
      // 苦戦中 → 即座に復習（ただし連続出題は避ける）
      return {
        word: question.word,
        priority: 90,
        reason: `苦戦中（正答率${prediction.predictors.recentAccuracy.toFixed(0)}%）`,
        strategy: 'immediate_review',
        estimatedSuccessRate: prediction.nextCorrectProbability,
        learningImpact: 80 // 高い学習効果
      };
      
    case 'improving':
      // 改善中 → 定着転換を狙う
      const daysSince = prediction.predictors.timeSinceLastStudy;
      const isOptimalTiming = daysSince >= 1 && daysSince <= 3;
      
      return {
        word: question.word,
        priority: isOptimalTiming ? 85 : 70,
        reason: `改善中（${daysSince.toFixed(1)}日経過、成功率${prediction.nextCorrectProbability.toFixed(0)}%）`,
        strategy: isOptimalTiming ? 'consolidation' : 'spaced_repetition',
        estimatedSuccessRate: prediction.nextCorrectProbability,
        learningImpact: 75
      };
      
    case 'consolidating':
      // 定着化中 → 適切な間隔で復習
      const optimalInterval = curve.forgettingPattern.typicalDecayDays * 0.7;
      const currentInterval = prediction.predictors.timeSinceLastStudy;
      const isNearOptimal = Math.abs(currentInterval - optimalInterval) < 2;
      
      return {
        word: question.word,
        priority: isNearOptimal ? 60 : 40,
        reason: `定着化中（次回復習まで${Math.max(0, optimalInterval - currentInterval).toFixed(1)}日）`,
        strategy: 'spaced_repetition',
        estimatedSuccessRate: prediction.nextCorrectProbability,
        learningImpact: 50
      };
      
    case 'mastered':
      // 習得済み → 低優先度（長期記憶の確認のみ）
      return {
        word: question.word,
        priority: 20,
        reason: '習得済み（長期記憶確認）',
        strategy: 'spaced_repetition',
        estimatedSuccessRate: prediction.nextCorrectProbability,
        learningImpact: 20
      };
      
    default:
      return {
        word: question.word,
        priority: 50,
        reason: '初期段階',
        strategy: 'new_learning',
        estimatedSuccessRate: 50,
        learningImpact: 60
      };
  }
}

/**
 * 混同リスクの高い単語ペアを検出
 */
export function detectConfusionRisks(
  learningHistories: Map<string, WordLearningHistory>
): Array<{ word1: string; word2: string; riskScore: number }> {
  const risks: Array<{ word1: string; word2: string; riskScore: number }> = [];
  
  learningHistories.forEach((history1, word1) => {
    history1.confusedWith.forEach(confusion => {
      const word2 = confusion.confusedWord;
      const riskScore = confusion.frequency * 10 + (confusion.similarity * 50);
      
      risks.push({ word1, word2, riskScore });
    });
  });
  
  return risks.sort((a, b) => b.riskScore - a.riskScore).slice(0, 10);
}

/**
 * 定着転換戦略: 苦手な単語を戦略的に出題
 */
export function planConsolidationSequence(
  strugglingWords: QuestionPriority[],
  sessionLength: number
): QuestionPriority[] {
  // 苦戦中の単語を抽出
  const struggling = strugglingWords.filter(p => p.strategy === 'immediate_review');
  
  if (struggling.length === 0) return strugglingWords;
  
  // 戦略的な出題順序を構築
  const sequence: QuestionPriority[] = [];
  
  // 1. 最も苦戦している単語から開始（最大3問）
  const topStruggling = struggling.slice(0, 3);
  sequence.push(...topStruggling);
  
  // 2. 改善中の単語を挟む（記憶の干渉を防ぐ）
  const improving = strugglingWords.filter(p => p.strategy === 'consolidation');
  if (improving.length > 0) {
    sequence.push(improving[0]);
  }
  
  // 3. 再度苦戦している単語（間隔反復）
  if (topStruggling.length > 0 && sessionLength >= 10) {
    sequence.push(topStruggling[0]); // 最初の単語を再出題
  }
  
  // 4. 残りの単語を優先度順に追加
  const remaining = strugglingWords.filter(p => !sequence.includes(p));
  sequence.push(...remaining);
  
  return sequence.slice(0, sessionLength);
}
