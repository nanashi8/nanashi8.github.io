import type { WordCategory } from '@/ai/types';

export function isIncorrectWordCategory(value: WordCategory | null | undefined): boolean {
  switch (value) {
    case 'incorrect':
      return true;
    default:
      return false;
  }
}

export function isStillLearningWordCategory(value: WordCategory | null | undefined): boolean {
  switch (value) {
    case 'still_learning':
      return true;
    default:
      return false;
  }
}

export function isMasteredWordCategory(value: WordCategory | null | undefined): boolean {
  switch (value) {
    case 'mastered':
      return true;
    default:
      return false;
  }
}

export function isNewWordCategory(value: WordCategory | null | undefined): boolean {
  switch (value) {
    case 'new':
      return true;
    default:
      return false;
  }
}

export function isReviewWordCategory(value: WordCategory | null | undefined): boolean {
  switch (value) {
    case 'incorrect':
    case 'still_learning':
      return true;
    default:
      return false;
  }
}

export const WORD_CATEGORY_LABEL: Record<WordCategory, string> = {
  incorrect: '分からない',
  still_learning: 'まだまだ',
  new: '新規',
  mastered: '覚えてる',
};
