/**
 * エラー予測AI (Error Prediction AI)
 * 
 * 目的:
 * - ユーザーの誤答パターンを分析し、次に間違えそうな問題を予測
 * - 低信頼度の問題に対して事前警告とヒントを提供
 * - 類似エラーパターンを検出して予防的学習を促進
 * 
 * 機能:
 * 1. 誤答パターン分析: 過去のエラーから傾向を検出
 * 2. リスク予測: 次の問題の誤答リスクを0-100%で算出
 * 3. 適応的サポート: リスクレベルに応じたヒント提供
 * 4. 混同単語検出: よく間違える単語ペアを特定
 */

import { WordProgress } from '@/storage/progress/progressStorage';

/**
 * 誤答パターンの種類
 */
export type ErrorPattern = 
  | 'similar_spelling'      // 綴りが似ている
  | 'similar_meaning'       // 意味が似ている
  | 'similar_sound'         // 発音が似ている
  | 'confusion_pair'        // 特定の単語と混同
  | 'grammar_error'         // 文法的な間違い
  | 'length_based'          // 単語の長さに起因
  | 'category_weakness'     // カテゴリー全体の弱点
  | 'timing_based';         // 時間経過による忘却

/**
 * エラー予測結果
 */
export interface ErrorPrediction {
  word: string;
  errorRisk: number; // 0-100%: 誤答する確率
  confidence: number; // 0-100%: 予測の信頼度
  primaryPattern: ErrorPattern;
  riskFactors: RiskFactor[];
  warningLevel: 'low' | 'medium' | 'high' | 'critical';
  suggestedSupport: SupportStrategy;
}

/**
 * リスク要因
 */
export interface RiskFactor {
  type: ErrorPattern;
  weight: number; // 0-1: この要因の重み
  description: string;
  evidence: string[]; // 具体的な証拠
}

/**
 * サポート戦略
 */
export interface SupportStrategy {
  showWarning: boolean;
  warningMessage: string;
  hints: string[];
  reviewWords: string[]; // 一緒に復習すべき単語
  confidenceBooster: string; // 励ましのメッセージ
}

/**
 * 混同ペア
 */
export interface ConfusionPair {
  word1: string;
  word2: string;
  confusionCount: number;
  lastConfusion: number; // timestamp
  pattern: ErrorPattern;
}

/**
 * エラー履歴分析結果
 */
export interface ErrorAnalysis {
  totalErrors: number;
  errorsByPattern: Map<ErrorPattern, number>;
  confusionPairs: ConfusionPair[];
  weakCategories: string[];
  recentErrorRate: number; // 最近10問の誤答率
  errorTrend: 'improving' | 'stable' | 'declining';
}

/**
 * 誤答パターンを分析
 */
export function analyzeErrorPatterns(
  wordProgress: Record<string, WordProgress>,
  recentAnswers: Array<{ word: string; wasCorrect: boolean; userAnswer?: string }>
): ErrorAnalysis {
  const errorsByPattern = new Map<ErrorPattern, number>();
  const confusionPairs: ConfusionPair[] = [];
  const weakCategories: string[] = [];
  
  let totalErrors = 0;
  const last10 = recentAnswers.slice(-10);
  const recentErrorRate = last10.length > 0
    ? (last10.filter(a => !a.wasCorrect).length / last10.length) * 100
    : 0;
  
  // 過去のエラーを集計
  Object.entries(wordProgress).forEach(([word, progress]) => {
    totalErrors += progress.incorrectCount;
    
    // 学習履歴から誤答パターンを検出
    if (progress.learningHistory) {
      const errors = progress.learningHistory.filter(h => !h.wasCorrect);
      
      errors.forEach(error => {
        // 綴り間違いパターン
        if (error.userAnswer && isSpellingError(word, error.userAnswer)) {
          errorsByPattern.set('similar_spelling', (errorsByPattern.get('similar_spelling') || 0) + 1);
        }
        
        // 混同パターン
        if (error.userAnswer) {
          const existingPair = confusionPairs.find(
            p => (p.word1 === word && p.word2 === error.userAnswer) ||
                 (p.word2 === word && p.word1 === error.userAnswer)
          );
          
          if (existingPair) {
            existingPair.confusionCount++;
            existingPair.lastConfusion = error.timestamp;
          } else if (error.userAnswer !== word) {
            confusionPairs.push({
              word1: word,
              word2: error.userAnswer,
              confusionCount: 1,
              lastConfusion: error.timestamp,
              pattern: 'confusion_pair'
            });
          }
        }
      });
    }
  });
  
  // エラー傾向を判定
  const last5 = recentAnswers.slice(-5);
  const last5ErrorRate = last5.length > 0
    ? (last5.filter(a => !a.wasCorrect).length / last5.length) * 100
    : 0;
  
  const errorTrend: 'improving' | 'stable' | 'declining' = 
    last5ErrorRate < recentErrorRate - 10 ? 'improving' :
    last5ErrorRate > recentErrorRate + 10 ? 'declining' :
    'stable';
  
  return {
    totalErrors,
    errorsByPattern,
    confusionPairs: confusionPairs.sort((a, b) => b.confusionCount - a.confusionCount),
    weakCategories,
    recentErrorRate,
    errorTrend
  };
}

/**
 * 次の問題の誤答リスクを予測
 */
export function predictErrorRisk(
  word: string,
  wordProgress: WordProgress | undefined,
  errorAnalysis: ErrorAnalysis,
  currentFatigue: number, // 0-100
  recentErrors: number // 直近の誤答数
): ErrorPrediction {
  const riskFactors: RiskFactor[] = [];
  let baseRisk = 30; // ベースリスク
  
  // 1. 個別単語の履歴
  if (wordProgress) {
    const total = wordProgress.correctCount + wordProgress.incorrectCount;
    if (total > 0) {
      const errorRate = (wordProgress.incorrectCount / total) * 100;
      if (errorRate > 50) {
        baseRisk += 30;
        riskFactors.push({
          type: 'category_weakness',
          weight: 0.3,
          description: 'この単語の過去の誤答率が高い',
          evidence: [`誤答率: ${errorRate.toFixed(0)}%`]
        });
      }
    }
    
    // 最近の学習状況
    if (wordProgress.learningHistory && wordProgress.learningHistory.length > 0) {
      const last3 = wordProgress.learningHistory.slice(-3);
      const last3ErrorRate = (last3.filter(h => !h.wasCorrect).length / last3.length) * 100;
      
      if (last3ErrorRate > 66) {
        baseRisk += 25;
        riskFactors.push({
          type: 'timing_based',
          weight: 0.25,
          description: '最近3回のうち2回以上間違えている',
          evidence: [`直近3回の誤答率: ${last3ErrorRate.toFixed(0)}%`]
        });
      }
    }
    
    // 時間経過による忘却
    if (wordProgress.lastStudied) {
      const daysSinceReview = (Date.now() - wordProgress.lastStudied) / (1000 * 60 * 60 * 24);
      if (daysSinceReview > 7) {
        const forgettingRisk = Math.min(20, daysSinceReview * 2);
        baseRisk += forgettingRisk;
        riskFactors.push({
          type: 'timing_based',
          weight: forgettingRisk / 100,
          description: '前回の復習から時間が経過している',
          evidence: [`${daysSinceReview.toFixed(1)}日前に復習`]
        });
      }
    }
  } else {
    // 初見の単語
    baseRisk += 20;
    riskFactors.push({
      type: 'category_weakness',
      weight: 0.2,
      description: 'まだ学習したことがない単語',
      evidence: ['初見']
    });
  }
  
  // 2. 混同ペアのチェック
  const confusionPair = errorAnalysis.confusionPairs.find(
    p => p.word1 === word || p.word2 === word
  );
  if (confusionPair && confusionPair.confusionCount >= 2) {
    baseRisk += 15;
    const otherWord = confusionPair.word1 === word ? confusionPair.word2 : confusionPair.word1;
    riskFactors.push({
      type: 'confusion_pair',
      weight: 0.15,
      description: `"${otherWord}"と混同しやすい`,
      evidence: [`${confusionPair.confusionCount}回混同`]
    });
  }
  
  // 3. 疲労度の影響
  if (currentFatigue > 60) {
    const fatigueRisk = (currentFatigue - 60) / 2;
    baseRisk += fatigueRisk;
    riskFactors.push({
      type: 'timing_based',
      weight: fatigueRisk / 100,
      description: '疲労により集中力が低下している',
      evidence: [`疲労度: ${currentFatigue.toFixed(0)}%`]
    });
  }
  
  // 4. 連続エラーの影響
  if (recentErrors >= 2) {
    baseRisk += 10;
    riskFactors.push({
      type: 'timing_based',
      weight: 0.1,
      description: '直前の問題で連続して間違えている',
      evidence: [`直近${recentErrors}問連続誤答`]
    });
  }
  
  // 5. 全体的なエラー傾向
  if (errorAnalysis.errorTrend === 'declining') {
    baseRisk += 10;
    riskFactors.push({
      type: 'category_weakness',
      weight: 0.1,
      description: '全体的に誤答率が上昇傾向',
      evidence: [`最近10問の誤答率: ${errorAnalysis.recentErrorRate.toFixed(0)}%`]
    });
  }
  
  const errorRisk = Math.min(100, Math.max(0, baseRisk));
  
  // 警告レベルを決定
  const warningLevel: 'low' | 'medium' | 'high' | 'critical' =
    errorRisk >= 80 ? 'critical' :
    errorRisk >= 60 ? 'high' :
    errorRisk >= 40 ? 'medium' :
    'low';
  
  // サポート戦略を生成
  const suggestedSupport = generateSupportStrategy(
    word,
    errorRisk,
    warningLevel,
    riskFactors,
    confusionPair
  );
  
  // 予測の信頼度を計算
  const confidence = calculatePredictionConfidence(wordProgress, riskFactors.length);
  
  return {
    word,
    errorRisk,
    confidence,
    primaryPattern: riskFactors.length > 0 ? riskFactors[0].type : 'category_weakness',
    riskFactors,
    warningLevel,
    suggestedSupport
  };
}

/**
 * サポート戦略を生成
 */
function generateSupportStrategy(
  word: string,
  errorRisk: number,
  warningLevel: 'low' | 'medium' | 'high' | 'critical',
  riskFactors: RiskFactor[],
  confusionPair?: ConfusionPair
): SupportStrategy {
  const hints: string[] = [];
  const reviewWords: string[] = [];
  let warningMessage = '';
  let confidenceBooster = '';
  
  // 警告メッセージ
  if (warningLevel === 'critical') {
    warningMessage = `⚠️ 注意: この問題は間違えやすい可能性があります（リスク: ${errorRisk.toFixed(0)}%）`;
    confidenceBooster = '落ち着いて、しっかり考えてから答えましょう！';
  } else if (warningLevel === 'high') {
    warningMessage = `🔔 この問題は少し難しいかもしれません（リスク: ${errorRisk.toFixed(0)}%）`;
    confidenceBooster = 'ゆっくり考えれば大丈夫です！';
  } else if (warningLevel === 'medium') {
    warningMessage = `💡 慎重に答えてください（リスク: ${errorRisk.toFixed(0)}%）`;
    confidenceBooster = '落ち着いて取り組みましょう！';
  }
  
  // ヒント生成
  riskFactors.forEach(factor => {
    switch (factor.type) {
      case 'confusion_pair':
        if (confusionPair) {
          const otherWord = confusionPair.word1 === word ? confusionPair.word2 : confusionPair.word1;
          hints.push(`"${otherWord}"と混同しないように注意`);
          reviewWords.push(otherWord);
        }
        break;
      case 'similar_spelling':
        hints.push('綴りをよく確認しましょう');
        break;
      case 'timing_based':
        if (factor.description.includes('時間が経過')) {
          hints.push('前回の復習から時間が経っています。意味を思い出してみましょう');
        } else if (factor.description.includes('疲労')) {
          hints.push('疲れているときは焦らず、ゆっくり考えましょう');
        }
        break;
      case 'category_weakness':
        hints.push('この単語は過去に間違えています。慎重に！');
        break;
    }
  });
  
  return {
    showWarning: warningLevel !== 'low',
    warningMessage,
    hints: hints.slice(0, 2), // 最大2つのヒント
    reviewWords,
    confidenceBooster
  };
}

/**
 * 予測の信頼度を計算
 */
function calculatePredictionConfidence(
  wordProgress: WordProgress | undefined,
  riskFactorCount: number
): number {
  let confidence = 50; // ベース信頼度
  
  // 学習データが多いほど信頼度が高い
  if (wordProgress) {
    const totalAttempts = wordProgress.correctCount + wordProgress.incorrectCount;
    confidence += Math.min(30, totalAttempts * 5);
    
    // 学習履歴があればさらに信頼度アップ
    if (wordProgress.learningHistory && wordProgress.learningHistory.length >= 3) {
      confidence += 10;
    }
  }
  
  // リスク要因が多いほど信頼度が高い
  confidence += Math.min(10, riskFactorCount * 3);
  
  return Math.min(100, confidence);
}

/**
 * 綴り間違いかどうかを判定
 */
function isSpellingError(correctWord: string, userAnswer: string): boolean {
  // レーベンシュタイン距離を簡易計算
  const distance = calculateLevenshteinDistance(
    correctWord.toLowerCase(),
    userAnswer.toLowerCase()
  );
  
  // 1-2文字の違いなら綴り間違い
  return distance > 0 && distance <= 2;
}

/**
 * レーベンシュタイン距離を計算
 */
function calculateLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * エラー予測結果をバッチ処理
 */
export function batchPredictErrors(
  words: string[],
  wordProgress: Record<string, WordProgress>,
  errorAnalysis: ErrorAnalysis,
  currentFatigue: number,
  recentErrors: number
): Map<string, ErrorPrediction> {
  const predictions = new Map<string, ErrorPrediction>();
  
  words.forEach(word => {
    const prediction = predictErrorRisk(
      word,
      wordProgress[word],
      errorAnalysis,
      currentFatigue,
      recentErrors
    );
    predictions.set(word, prediction);
  });
  
  return predictions;
}

/**
 * 高リスク問題をフィルタリング
 */
export function getHighRiskQuestions(
  predictions: Map<string, ErrorPrediction>,
  threshold: number = 60
): ErrorPrediction[] {
  return Array.from(predictions.values())
    .filter(p => p.errorRisk >= threshold)
    .sort((a, b) => b.errorRisk - a.errorRisk);
}
