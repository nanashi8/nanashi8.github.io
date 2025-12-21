export type ScoreBoardMode = 'translation' | 'spelling' | 'reading' | 'grammar' | 'memorization';

export type AttemptCounts = {
  once: number;
  twice: number;
  three: number;
  four: number;
  five: number;
  sixOrMore: number;
};

export type WordProgressLike = {
  memorizationAttempts?: number;
  translationAttempts?: number;
  /**
   * 互換性: 旧スキーマでは translation モードでも quizAttempts を使用していた
   */
  quizAttempts?: number;
  spellingAttempts?: number;
  grammarAttempts?: number;
  totalAttempts?: number;
};

export function computeAttemptCounts(params: {
  mode?: ScoreBoardMode;
  currentWord?: string;
  wordProgress: Record<string, WordProgressLike | undefined>;
}): AttemptCounts {
  const { mode = 'translation', currentWord, wordProgress } = params;

  const counts: AttemptCounts = {
    once: 0,
    twice: 0,
    three: 0,
    four: 0,
    five: 0,
    sixOrMore: 0,
  };

  let currentWordCounted = false;

  Object.entries(wordProgress).forEach(([word, wp]) => {
    if (!wp) return;

    let attempts = 0;

    if (mode === 'memorization') {
      attempts = wp.memorizationAttempts || 0;
    } else if (mode === 'translation') {
      attempts = wp.translationAttempts ?? wp.quizAttempts ?? 0;
    } else if (mode === 'spelling') {
      attempts = wp.spellingAttempts || 0;
    } else if (mode === 'grammar') {
      attempts = wp.grammarAttempts || 0;
    } else {
      attempts = wp.totalAttempts || 0;
    }

    // 表示中の単語をマーク
    if (currentWord && word === currentWord) {
      currentWordCounted = true;
    }

    if (attempts === 1) counts.once++;
    else if (attempts === 2) counts.twice++;
    else if (attempts === 3) counts.three++;
    else if (attempts === 4) counts.four++;
    else if (attempts === 5) counts.five++;
    else if (attempts >= 6) counts.sixOrMore++;
  });

  // currentWord がストレージに未登録なら1回として追加
  if (currentWord && !currentWordCounted) {
    counts.once++;
  }

  return counts;
}
