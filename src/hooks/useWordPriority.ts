/**
 * useWordPriority Hook
 *
 * 単語の優先度情報を取得するフック
 */

import { useState, useEffect } from 'react';
import { loadProgress } from '@/storage/progress/progressStorage';
import type { WordProgress } from '@/storage/progress/types';
import type { PriorityExplanation } from '@/ai/explainability/priorityExplanation';
import { explainPriority } from '@/ai/explainability/priorityExplanation';

/**
 * 単語の優先度情報を取得
 *
 * @param word - 単語
 * @returns 優先度説明（ロード中はnull）
 */
export function useWordPriority(word: string): PriorityExplanation | null {
  const [explanation, setExplanation] = useState<PriorityExplanation | null>(null);

  useEffect(() => {
    async function loadPriority() {
      try {
        const progress = await loadProgress();
        const wordProgress = progress.wordProgress[word];

        if (wordProgress) {
          const exp = explainPriority(wordProgress);
          setExplanation(exp);
        } else {
          // 新規単語の場合、デフォルト進捗を作成
          const defaultProgress: WordProgress = {
            word,
            correctCount: 0,
            incorrectCount: 0,
            consecutiveCorrect: 0,
            consecutiveIncorrect: 0,
            category: 'new',
            calculatedPriority: 50,
            lastPriorityUpdate: Date.now(),
            accuracyRate: 0,
            memorizationAttempts: 0,
          };
          const exp = explainPriority(defaultProgress);
          setExplanation(exp);
        }
      } catch (error) {
        console.error('Failed to load priority:', error);
      }
    }

    loadPriority();
  }, [word]);

  return explanation;
}
