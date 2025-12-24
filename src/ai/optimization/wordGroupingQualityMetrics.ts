/**
 * Word Grouping Quality Metrics
 *
 * 関連語グループ化の品質を測定する指標
 * 
 * 主要メトリクス:
 * - 近接率: 関連語が近くに配置されている割合
 * - 多様性: 同じテーマが連続しない程度
 * - Position階層保持率: 階層が正しく保たれている割合
 */

import type { Question } from '../../types';
import { detectWordRelations } from './contextualLearningAI';

function getPositionBandRank(position: number): number {
  // 0 = highest priority band
  if (position >= 70) return 0;
  if (position >= 60) return 1;
  if (position >= 40) return 2;
  if (position >= 20) return 3;
  return 4;
}

/**
 * 品質メトリクスの結果
 */
export interface QualityMetrics {
  /** 近接率: 関連語がK個以内に配置されている割合（0-1） */
  proximityRate: number;
  
  /** 多様性スコア: エントロピーベースの多様性（高いほど良い） */
  diversityScore: number;
  
  /** Position階層保持率: 違反がない割合（1.0が理想） */
  hierarchyPreservationRate: number;
  
  /** 平均関連性強度: 連続する語句間の関連性の平均（0-1） */
  avgRelationStrength: number;
  
  /** 関連ペア数: 隣接する語句間で関連性が検出された数 */
  relatedPairCount: number;
  
  /** 総ペア数 */
  totalPairs: number;
}

/**
 * 語句リストの品質メトリクスを計算
 *
 * @param questions - 出題順序の問題リスト
 * @param positionMap - 語句→Position値のマップ
 * @param windowSize - 近接率の判定ウィンドウサイズ（デフォルト: 5）
 * @returns 品質メトリクス
 */
export function calculateQualityMetrics(
  questions: Question[],
  positionMap: Map<string, number>,
  windowSize: number = 5
): QualityMetrics {
  if (questions.length < 2) {
    return {
      proximityRate: 1.0,
      diversityScore: 0,
      hierarchyPreservationRate: 1.0,
      avgRelationStrength: 0,
      relatedPairCount: 0,
      totalPairs: 0,
    };
  }
  
  // 1. 近接率の計算
  let relatedPairsFound = 0;
  let totalRelatedPairs = 0;
  
  for (let i = 0; i < questions.length; i++) {
    for (let j = i + 1; j < questions.length; j++) {
      const relation = detectWordRelations(
        questions[i].word,
        questions[j].word,
        questions[i],
        questions[j]
      );
      
      if (relation && relation.strength >= 0.6) {
        totalRelatedPairs++;
        
        // ウィンドウサイズ以内なら近接
        if (j - i <= windowSize) {
          relatedPairsFound++;
        }
      }
    }
  }
  
  const proximityRate = totalRelatedPairs > 0 ? relatedPairsFound / totalRelatedPairs : 1.0;
  
  // 2. 多様性スコアの計算（カテゴリのエントロピー）
  const categoryFreq = new Map<string, number>();
  for (const q of questions) {
    const cat = q.category || 'unknown';
    categoryFreq.set(cat, (categoryFreq.get(cat) || 0) + 1);
  }
  
  let entropy = 0;
  const total = questions.length;
  for (const freq of categoryFreq.values()) {
    const p = freq / total;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }
  
  // エントロピーを0-1にスケール（最大エントロピーで正規化）
  const maxEntropy = Math.log2(categoryFreq.size);
  const diversityScore = maxEntropy > 0 ? entropy / maxEntropy : 0;
  
  // 3. Position階層保持率の計算
  let violations = 0;
  for (let i = 0; i < questions.length - 1; i++) {
    const currentPos = positionMap.get(questions[i].word) ?? 0;
    const nextPos = positionMap.get(questions[i + 1].word) ?? 0;

    // 重要制約: Position帯（70-100 > 60-69 > 40-59 > 20-39 > 0-19）を跨いだ逆転がないこと。
    // 帯内は関連語グループ化で並べ替えるため、厳密な降順は要求しない。
    const currentBand = getPositionBandRank(currentPos);
    const nextBand = getPositionBandRank(nextPos);
    if (currentBand > nextBand) {
      violations++;
    }
  }
  
  const hierarchyPreservationRate = questions.length > 1
    ? 1.0 - violations / (questions.length - 1)
    : 1.0;
  
  // 4. 平均関連性強度の計算
  let totalStrength = 0;
  let relatedPairCount = 0;
  
  for (let i = 0; i < questions.length - 1; i++) {
    const relation = detectWordRelations(
      questions[i].word,
      questions[i + 1].word,
      questions[i],
      questions[i + 1]
    );
    
    if (relation && relation.strength >= 0.6) {
      totalStrength += relation.strength;
      relatedPairCount++;
    }
  }
  
  const avgRelationStrength = relatedPairCount > 0 ? totalStrength / relatedPairCount : 0;
  
  return {
    proximityRate,
    diversityScore,
    hierarchyPreservationRate,
    avgRelationStrength,
    relatedPairCount,
    totalPairs: questions.length - 1,
  };
}

/**
 * ABC順と関連語順を比較する
 *
 * @param abcQuestions - ABC順の問題リスト
 * @param contextualQuestions - 関連語順の問題リスト
 * @param positionMap - 語句→Position値のマップ
 * @returns 比較結果
 */
export function compareOrderingQuality(
  abcQuestions: Question[],
  contextualQuestions: Question[],
  positionMap: Map<string, number>
): {
  abc: QualityMetrics;
  contextual: QualityMetrics;
  improvement: {
    proximityRate: number;
    diversityScore: number;
    avgRelationStrength: number;
  };
} {
  const abcMetrics = calculateQualityMetrics(abcQuestions, positionMap);
  const contextualMetrics = calculateQualityMetrics(contextualQuestions, positionMap);
  
  return {
    abc: abcMetrics,
    contextual: contextualMetrics,
    improvement: {
      proximityRate: contextualMetrics.proximityRate - abcMetrics.proximityRate,
      diversityScore: contextualMetrics.diversityScore - abcMetrics.diversityScore,
      avgRelationStrength: contextualMetrics.avgRelationStrength - abcMetrics.avgRelationStrength,
    },
  };
}

/**
 * 品質メトリクスを人間が読みやすい形式にフォーマット
 *
 * @param metrics - 品質メトリクス
 * @returns フォーマットされた文字列
 */
export function formatQualityMetrics(metrics: QualityMetrics): string {
  return `
品質メトリクス:
  近接率: ${(metrics.proximityRate * 100).toFixed(1)}% (関連語が近くに配置)
  多様性: ${(metrics.diversityScore * 100).toFixed(1)}% (カテゴリの分散)
  階層保持: ${(metrics.hierarchyPreservationRate * 100).toFixed(1)}% (Position順序維持)
  平均関連度: ${(metrics.avgRelationStrength * 100).toFixed(1)}% (隣接語の関連性)
  関連ペア: ${metrics.relatedPairCount}/${metrics.totalPairs}個
  `.trim();
}
