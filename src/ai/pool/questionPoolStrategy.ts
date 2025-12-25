import { determineWordPosition, type LearningMode } from '@/ai/utils/categoryDetermination';
import type { WordProgress } from '@/storage/progress/types';
import { loadProgressSync } from '@/storage/progress/progressStorage';

export type QuestionPoolBucket = 'incorrect' | 'still_learning' | 'unseen' | 'remembered';

export type QuestionWordLike = {
  word: string;
};

export type QuestionPoolBuildResult<Q> = {
  buckets: Record<QuestionPoolBucket, Q[]>;
  ordered: Q[];
  counts: Record<QuestionPoolBucket, number>;
};

export interface QuestionPoolStrategy<Q extends QuestionWordLike> {
  buildPool: (questions: Q[], mode: LearningMode) => QuestionPoolBuildResult<Q>;
}

function getAttempts(progress: WordProgress, mode: LearningMode): number {
  switch (mode) {
    case 'memorization':
      return progress.memorizationAttempts || 0;
    case 'translation':
      return progress.translationAttempts || 0;
    case 'spelling':
      return progress.spellingAttempts || 0;
    case 'grammar':
      return progress.grammarAttempts || 0;
  }
}

function bucketForWord(progress: WordProgress | undefined, mode: LearningMode): QuestionPoolBucket {
  if (!progress) return 'unseen';

  const attempts = getAttempts(progress, mode);
  if (attempts === 0) return 'unseen';

  const position = determineWordPosition(progress, mode);
  if (position >= 70) return 'incorrect';
  if (position >= 40) return 'still_learning';
  return 'remembered';
}

/**
 * 未出題 / 覚えてる / まだまだ / 分からない の語句取得をStrategyとして抽出。
 *
 * - 分からない: Position >= 70
 * - まだまだ:    40 <= Position < 70
 * - 覚えてる:    Position < 40 かつ attempts > 0
 * - 未出題:      attempts == 0 または progress無し
 */
export class PositionBucketPoolStrategy<Q extends QuestionWordLike>
  implements QuestionPoolStrategy<Q>
{
  buildPool(questions: Q[], mode: LearningMode): QuestionPoolBuildResult<Q> {
    const progress = loadProgressSync();
    const wordProgress = progress?.wordProgress ?? {};

    const buckets: Record<QuestionPoolBucket, Q[]> = {
      incorrect: [],
      still_learning: [],
      unseen: [],
      remembered: [],
    };

    for (const question of questions) {
      const bucket = bucketForWord(wordProgress[question.word], mode);
      buckets[bucket].push(question);
    }

    const ordered = [
      ...buckets.incorrect,
      ...buckets.still_learning,
      ...buckets.unseen,
      ...buckets.remembered,
    ];

    return {
      buckets,
      ordered,
      counts: {
        incorrect: buckets.incorrect.length,
        still_learning: buckets.still_learning.length,
        unseen: buckets.unseen.length,
        remembered: buckets.remembered.length,
      },
    };
  }
}
