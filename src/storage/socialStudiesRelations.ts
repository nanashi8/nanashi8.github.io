/**
 * 社会科いもづる式学習システム
 *
 * 関連タイプ（cause/effect/chronological等）を考慮した
 * 語句推薦システム
 */

import type { SocialStudiesRelationship, RelationType } from '@/types/socialStudies';
import { RELATION_TYPE_PRIORITY } from '@/types/socialStudies';
import { getSocialStudiesTermProgress } from './progress/socialStudiesProgress';
import { logger } from '@/utils/logger';

/**
 * 関連語句の推薦結果
 */
export interface RelatedTermRecommendation {
  term: string;
  relationType: RelationType;
  priority: number;
  reason: string;
}

/**
 * 関連情報のキャッシュ
 */
let relationshipsCache: SocialStudiesRelationship[] = [];
let lastLoadedDataSource: string = '';

/**
 * 関連情報を読み込み
 */
export async function loadRelationships(dataSource: string): Promise<void> {
  if (lastLoadedDataSource === dataSource && relationshipsCache.length > 0) {
    return; // キャッシュ済み
  }

  try {
    const response = await fetch(`/data/social-studies/${dataSource}-relationships.json`);
    if (!response.ok) {
      throw new Error(`関連情報の読み込みに失敗: ${response.statusText}`);
    }

    relationshipsCache = await response.json();
    lastLoadedDataSource = dataSource;
    logger.log(`関連情報を読み込みました: ${relationshipsCache.length}件`);
  } catch (error) {
    logger.error('関連情報の読み込みエラー:', error);
    relationshipsCache = [];
  }
}

/**
 * 語句の関連語句を取得（優先度順）
 *
 * @param term 語句
 * @param limit 取得する最大数
 * @returns 関連語句の配列（優先度順）
 */
export function getRelatedTerms(term: string, limit: number = 5): RelatedTermRecommendation[] {
  // 関連情報を取得
  const relations = relationshipsCache.filter((r) => r.sourceTerm === term);

  // 各関連語句の推薦情報を生成
  const recommendations: RelatedTermRecommendation[] = relations.map((relation) => {
    // 関連タイプの基本優先度
    const typePriority = RELATION_TYPE_PRIORITY[relation.relationType];

    // 関連の強度（0-100）
    const strengthBonus = relation.strength * 0.5; // 最大50点

    // 対象語句の習熟度（Position）
    const targetProgress = getSocialStudiesTermProgress(relation.targetTerm);
    const targetPosition = targetProgress?.position ?? 35;

    // Positionが高い（苦手）ほど優先
    const positionBonus = targetPosition * 0.3; // 最大30点

    // 総合優先度
    const totalPriority = typePriority + strengthBonus + positionBonus;

    // 推薦理由を生成
    let reason = '';
    if (relation.relationType === 'cause') {
      reason = `${relation.targetTerm}の原因となった出来事`;
    } else if (relation.relationType === 'effect') {
      reason = `${relation.targetTerm}の結果として起こった出来事`;
    } else if (relation.relationType === 'chronological_before') {
      reason = `${relation.targetTerm}の前に起こった出来事`;
    } else if (relation.relationType === 'chronological_after') {
      reason = `${relation.targetTerm}の後に起こった出来事`;
    } else if (relation.relationType === 'person_achievement') {
      reason = `${relation.targetTerm}の業績・功績`;
    } else if (relation.relationType === 'location_event') {
      reason = `${relation.targetTerm}で起こった出来事`;
    } else {
      reason = `${relation.targetTerm}に関連する事項`;
    }

    return {
      term: relation.targetTerm,
      relationType: relation.relationType,
      priority: totalPriority,
      reason,
    };
  });

  // 優先度順にソート
  recommendations.sort((a, b) => b.priority - a.priority);

  // 上位N件を返す
  return recommendations.slice(0, limit);
}

/**
 * 複数の語句から総合的な関連語句を推薦
 *
 * 最近学習した語句から関連語句を抽出し、
 * 出題優先順位を計算する
 *
 * @param recentTerms 最近学習した語句（最新順）
 * @param limit 推薦する最大数
 * @returns 推薦語句の配列（優先度順）
 */
export function recommendNextTerms(
  recentTerms: string[],
  limit: number = 10
): RelatedTermRecommendation[] {
  const recommendationMap = new Map<string, RelatedTermRecommendation>();

  // 最近の語句ほど重みを高くする
  recentTerms.forEach((term, index) => {
    const recencyWeight = 1 - index / recentTerms.length; // 1.0 → 0.0
    const relatedTerms = getRelatedTerms(term, 5);

    relatedTerms.forEach((rec) => {
      const existing = recommendationMap.get(rec.term);

      if (existing) {
        // 既に推薦されている場合は優先度を加算
        existing.priority += rec.priority * recencyWeight;
      } else {
        // 新規推薦
        recommendationMap.set(rec.term, {
          ...rec,
          priority: rec.priority * recencyWeight,
        });
      }
    });
  });

  // 優先度順にソート
  const recommendations = Array.from(recommendationMap.values());
  recommendations.sort((a, b) => b.priority - a.priority);

  return recommendations.slice(0, limit);
}

/**
 * 因果関係チェーンを取得
 *
 * 語句から始まる因果関係の連鎖を取得
 * （例: A→B→C→D）
 *
 * @param startTerm 開始語句
 * @param maxDepth 最大深度
 * @returns 因果関係チェーン
 */
export function getCausalChain(
  startTerm: string,
  maxDepth: number = 5
): Array<{ term: string; relationType: RelationType }> {
  const chain: Array<{ term: string; relationType: RelationType }> = [
    { term: startTerm, relationType: 'related' },
  ];

  const visited = new Set<string>([startTerm]);
  let currentTerm = startTerm;

  for (let depth = 0; depth < maxDepth; depth++) {
    // 次の因果関係を探す
    const nextRelation = relationshipsCache.find(
      (r) =>
        r.sourceTerm === currentTerm &&
        (r.relationType === 'cause' || r.relationType === 'effect') &&
        !visited.has(r.targetTerm)
    );

    if (!nextRelation) {
      break; // チェーン終了
    }

    chain.push({
      term: nextRelation.targetTerm,
      relationType: nextRelation.relationType,
    });

    visited.add(nextRelation.targetTerm);
    currentTerm = nextRelation.targetTerm;
  }

  return chain;
}

/**
 * 時系列チェーンを取得
 *
 * 語句から始まる時系列の連鎖を取得
 * （例: 事件A → 事件B → 事件C）
 *
 * @param startTerm 開始語句
 * @param direction 方向（'before' = 過去方向、'after' = 未来方向）
 * @param maxDepth 最大深度
 * @returns 時系列チェーン
 */
export function getChronologicalChain(
  startTerm: string,
  direction: 'before' | 'after' = 'after',
  maxDepth: number = 5
): Array<{ term: string; relationType: RelationType }> {
  const chain: Array<{ term: string; relationType: RelationType }> = [
    { term: startTerm, relationType: 'related' },
  ];

  const visited = new Set<string>([startTerm]);
  let currentTerm = startTerm;

  const targetRelationType: RelationType =
    direction === 'after' ? 'chronological_after' : 'chronological_before';

  for (let depth = 0; depth < maxDepth; depth++) {
    // 次の時系列関係を探す
    const nextRelation = relationshipsCache.find(
      (r) =>
        r.sourceTerm === currentTerm &&
        r.relationType === targetRelationType &&
        !visited.has(r.targetTerm)
    );

    if (!nextRelation) {
      break; // チェーン終了
    }

    chain.push({
      term: nextRelation.targetTerm,
      relationType: nextRelation.relationType,
    });

    visited.add(nextRelation.targetTerm);
    currentTerm = nextRelation.targetTerm;
  }

  return chain;
}

/**
 * 関連語句の学習状況サマリーを取得
 *
 * @param term 語句
 * @returns 関連語句の学習状況
 */
export function getRelatedTermsLearningStatus(term: string): {
  total: number;
  mastered: number;
  learning: number;
  notStarted: number;
} {
  const relatedTerms = getRelatedTerms(term, 20);

  const status = {
    total: relatedTerms.length,
    mastered: 0,
    learning: 0,
    notStarted: 0,
  };

  relatedTerms.forEach((rec) => {
    const progress = getSocialStudiesTermProgress(rec.term);

    if (!progress) {
      status.notStarted++;
    } else if (progress.position <= 20) {
      status.mastered++;
    } else {
      status.learning++;
    }
  });

  return status;
}
