/**
 * Word Metadata Debug Utilities
 *
 * メタ情報の抽出カバレッジと品質を可視化する開発用ユーティリティ
 */

import type { Question } from '../../types';
import { getWordMetadataFromQuestion } from './wordMetadataCache';

function getPositionBandRank(position: number): number {
  // 0 = highest priority band
  if (position >= 70) return 0;
  if (position >= 60) return 1;
  if (position >= 40) return 2;
  if (position >= 20) return 3;
  return 4;
}

/**
 * メタ情報のカバレッジ統計
 */
export interface MetadataCoverageStats {
  /** 語族（root/prefix/suffix）が検出された語句の割合 */
  wordFamilyCoverage: number;
  
  /** 語根が検出された語句数 */
  rootCount: number;
  
  /** 接頭辞が検出された語句数 */
  prefixCount: number;
  
  /** 接尾辞が検出された語句数 */
  suffixCount: number;
  
  /** 品詞が推定された語句の割合 */
  posCoverage: number;
  
  /** 句パターンが検出された語句の割合 */
  phrasePatternCoverage: number;
  
  /** 総語句数 */
  totalWords: number;
}

/**
 * 語句リストのメタ情報カバレッジを計算
 *
 * @param questions - 問題リスト
 * @returns カバレッジ統計
 */
export function calculateMetadataCoverage(questions: Question[]): MetadataCoverageStats {
  let rootCount = 0;
  let prefixCount = 0;
  let suffixCount = 0;
  let posCount = 0;
  let phraseCount = 0;
  let wordFamilyCount = 0;
  
  for (const q of questions) {
    const meta = getWordMetadataFromQuestion(q);
    
    if (meta.family?.root) rootCount++;
    if (meta.family?.prefix) prefixCount++;
    if (meta.family?.suffix) suffixCount++;
    if (meta.pos && meta.pos !== 'other') posCount++;
    if (meta.phrasePattern && meta.phrasePattern !== 'none') phraseCount++;

    if (meta.family?.root || meta.family?.prefix || meta.family?.suffix) {
      wordFamilyCount++;
    }
  }
  
  const total = questions.length;
  
  return {
    wordFamilyCoverage: total > 0 ? wordFamilyCount / total : 0,
    rootCount,
    prefixCount,
    suffixCount,
    posCoverage: total > 0 ? posCount / total : 0,
    phrasePatternCoverage: total > 0 ? phraseCount / total : 0,
    totalWords: total,
  };
}

/**
 * 関連性の強度分布を分析
 *
 * @param transitions - 遷移リスト
 * @returns 強度分布
 */
export interface RelationStrengthDistribution {
  /** 強度0.9以上（root/antonym） */
  veryStrong: number;
  
  /** 強度0.75-0.89（synonym/phrase） */
  strong: number;
  
  /** 強度0.6-0.74（prefix/suffix） */
  moderate: number;
  
  /** 強度0.6未満（theme） */
  weak: number;
  
  /** 関連性なし */
  none: number;
  
  /** 総遷移数 */
  total: number;
}

/**
 * 遷移リストから関連性の強度分布を計算
 *
 * @param transitions - 遷移リスト（contextualLearningAIから取得）
 * @returns 強度分布
 */
export function analyzeRelationStrengthDistribution(
  transitions: Array<{ from: string; to: string; reason: string }>
): RelationStrengthDistribution {
  const dist: RelationStrengthDistribution = {
    veryStrong: 0,
    strong: 0,
    moderate: 0,
    weak: 0,
    none: 0,
    total: transitions.length,
  };
  
  for (const t of transitions) {
    // reasonから強度を推定（簡易版）
    const reason = t.reason.toLowerCase();
    
    if (reason.includes('語根') || reason.includes('反意語')) {
      dist.veryStrong++;
    } else if (reason.includes('類義語') || reason.includes('句パターン')) {
      dist.strong++;
    } else if (reason.includes('接頭辞') || reason.includes('接尾辞')) {
      dist.moderate++;
    } else if (reason.includes('テーマ')) {
      dist.weak++;
    } else {
      dist.none++;
    }
  }
  
  return dist;
}

/**
 * Position範囲の不変条件を検証
 *
 * @param questions - 出題順序の問題リスト
 * @param positionMap - 語句→Position値のマップ
 * @returns 違反が見つかった場合はその詳細、なければnull
 */
export function validatePositionHierarchy(
  questions: Question[],
  positionMap: Map<string, number>
): {
  violationIndex: number;
  currentPosition: number;
  nextPosition: number;
  currentWord: string;
  nextWord: string;
} | null {
  for (let i = 0; i < questions.length - 1; i++) {
    const current = questions[i];
    const next = questions[i + 1];
    
    const currentPos = positionMap.get(current.word) ?? 0;
    const nextPos = positionMap.get(next.word) ?? 0;

    // 重要制約: Position帯（70-100 > 60-69 > 40-59 > 20-39 > 0-19）を跨いだ逆転は許容しない。
    // 帯の中は関連語グループ化で並べ替えるため、厳密な降順は要求しない。
    const currentBand = getPositionBandRank(currentPos);
    const nextBand = getPositionBandRank(nextPos);
    if (currentBand > nextBand) {
      return {
        violationIndex: i,
        currentPosition: currentPos,
        nextPosition: nextPos,
        currentWord: current.word,
        nextWord: next.word,
      };
    }
  }
  
  return null; // 違反なし
}
