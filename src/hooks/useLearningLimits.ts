import { useState, useCallback } from 'react';

interface LearningLimits {
  learningLimit: number;
  reviewLimit: number;
  setLearningLimit: (value: number) => void;
  setReviewLimit: (value: number) => void;
}

/**
 * 学習中・要復習の上限設定を管理するカスタムフック
 * @param mode クイズモード ('translation' | 'spelling' | 'grammar')
 * @returns 学習上限の状態と更新関数
 */
export function useLearningLimits(mode: 'translation' | 'spelling' | 'grammar'): LearningLimits {
  const [learningLimit, setLearningLimitState] = useState<number>(() => {
    const saved = localStorage.getItem(`learning-limit-${mode}`);
    return saved ? parseInt(saved) : 30; // デフォルト: 30
  });

  const [reviewLimit, setReviewLimitState] = useState<number>(() => {
    const saved = localStorage.getItem(`review-limit-${mode}`);
    return saved ? parseInt(saved) : 10; // デフォルト: 10
  });

  const setLearningLimit = useCallback(
    (value: number) => {
      const validValue = Math.max(0, value) || 30;
      setLearningLimitState(validValue);
      localStorage.setItem(`learning-limit-${mode}`, validValue.toString());
    },
    [mode]
  );

  const setReviewLimit = useCallback(
    (value: number) => {
      const validValue = Math.max(0, value) || 10;
      setReviewLimitState(validValue);
      localStorage.setItem(`review-limit-${mode}`, validValue.toString());
    },
    [mode]
  );

  return {
    learningLimit,
    reviewLimit,
    setLearningLimit,
    setReviewLimit,
  };
}
